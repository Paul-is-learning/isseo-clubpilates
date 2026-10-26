// ═══════════════════════════════════════════════════════════════════════════
// Edge Function — boost-sync (phase 1 : découverte, LECTURE SEULE)
// ═══════════════════════════════════════════════════════════════════════════
// Fitness Boost est la source maîtresse des leads. Cette première version ne
// fait que des GET vers Boost et n'écrit RIEN en base : elle renvoie un
// rapport SANS donnée personnelle (noms de champs, types, comptes, valeurs
// des listes fermées) pour caler l'import sur le vrai schéma.
//
// POST ?action=discover&club=garenne|lattes|defense
// En-tête : x-sync-key = secret BOOST_SYNC_KEY (jamais le code maître du Sales Coach)
// Secrets : BOOST_SYNC_KEY, BOOST_TOKEN_GARENNE / _LATTES / _DEFENSE (lecture seule)
// Déployée avec --no-verify-jwt.
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit, safeEq } from "../_shared/store.ts";

const BASE = "https://www.app-boost.com/api/v1";
const CLUBS: Record<string, { secret: string; studio: string }> = {
  garenne: { secret: "BOOST_TOKEN_GARENNE", studio: "La Garenne-Colombes" },
  lattes: { secret: "BOOST_TOKEN_LATTES", studio: "Montpellier Lattes" },
  defense: { secret: "BOOST_TOKEN_DEFENSE", studio: "La Défense" },
};
// Seuls champs dont on renvoie les VALEURS (listes fermées, jamais de donnée personnelle)
const ENUM_FIELDS = ["status", "source", "action_type", "rdv_type", "delivery_status", "platform", "badge"];
const CONSENTS = ["email_consent", "sms_consent", "phone_consent", "whatsapp_consent", "messenger_consent"];

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj, null, 1), { status, headers: { "Content-Type": "application/json" } });
}

// deno-lint-ignore no-explicit-any
const typeOf = (v: any) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

// Schéma agrégé d'une liste d'objets : pour chaque clé, types vus et taux de présence
// deno-lint-ignore no-explicit-any
function shape(items: any[]) {
  const keys: Record<string, { types: Record<string, number>; present: number }> = {};
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    for (const [k, v] of Object.entries(it)) {
      keys[k] = keys[k] || { types: {}, present: 0 };
      const t = typeOf(v);
      keys[k].types[t] = (keys[k].types[t] || 0) + 1;
      if (v !== null && v !== "" && !(Array.isArray(v) && !v.length)) keys[k].present++;
    }
  }
  return { sample: items.length, keys };
}

// deno-lint-ignore no-explicit-any
function enums(items: any[]) {
  const out: Record<string, Record<string, number>> = {};
  for (const f of ENUM_FIELDS) {
    for (const it of items) {
      if (!it || !(f in it)) continue;
      const v = String(it[f] ?? "null").slice(0, 40);
      out[f] = out[f] || {};
      out[f][v] = (out[f][v] || 0) + 1;
    }
  }
  return out;
}

// deno-lint-ignore no-explicit-any
function consents(items: any[]) {
  const out: Record<string, { null: number; true: number; false: number }> = {};
  for (const c of CONSENTS) {
    out[c] = { null: 0, true: 0, false: 0 };
    for (const it of items) {
      if (!it || !(c in it)) continue;
      const v = it[c];
      if (v === true) out[c].true++; else if (v === false) out[c].false++; else out[c].null++;
    }
  }
  return out;
}

// Formats de téléphone (jamais les numéros) : +33…, 33…, 0…, autre, absent
// deno-lint-ignore no-explicit-any
function phones(items: any[]) {
  const out = { "+33": 0, "33": 0, "0": 0, autre: 0, absent: 0, moins_de_9_chiffres: 0 };
  for (const it of items) {
    const p = String(it?.phone ?? "").trim();
    if (!p) { out.absent++; continue; }
    if (p.replace(/\D/g, "").length < 9) out.moins_de_9_chiffres++;
    if (p.startsWith("+33")) out["+33"]++; else if (p.startsWith("33")) out["33"]++; else if (p.startsWith("0")) out["0"]++; else out.autre++;
  }
  return out;
}

// deno-lint-ignore no-explicit-any
const pagination = (b: any) => {
  const p = b?.pagination || {};
  const pick: Record<string, unknown> = {};
  for (const k of ["total", "limit", "offset", "page", "total_pages", "has_more"]) {
    if (k in p) pick[k] = p[k];
    else if (b && k in b && typeof b[k] !== "object") pick[k] = b[k];
  }
  return pick;
};

async function get(token: string, path: string) {
  const r = await fetch(BASE + path, { headers: { Authorization: "Bearer " + token, Accept: "application/json" }, redirect: "manual" });
  const rate: Record<string, string> = {};
  r.headers.forEach((v, k) => { if (/ratelimit|rate-limit|retry-after/i.test(k)) rate[k] = v.slice(0, 40); });
  // Jamais le corps d'une erreur (il pourrait contenir des données) : seulement le code HTTP
  if (!r.ok) { await r.body?.cancel(); return { status: r.status, rate, body: null }; }
  const txt = await r.text();
  if (txt.length > 3_000_000) return { status: r.status, rate, body: null, tooBig: true };
  try { return { status: r.status, rate, body: JSON.parse(txt) }; } catch { return { status: r.status, rate, body: null }; }
}

// deno-lint-ignore no-explicit-any
const listOf = (b: any): any[] => (Array.isArray(b?.data) ? b.data : Array.isArray(b) ? b : []);

serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST attendu" }, 405);
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const rl = await rateLimit(admin, req);
    if (rl.blocked) return json({ error: "Trop d'essais · réessayez dans 15 minutes" }, 429);
    const key = Deno.env.get("BOOST_SYNC_KEY") || "";
    if (key.length < 24) return json({ error: "BOOST_SYNC_KEY non configuré (24 caractères minimum)" }, 500);
    if (!safeEq(req.headers.get("x-sync-key") || "", key)) { await rl.fail(); return json({ error: "Clé invalide" }, 401); }
    await rl.ok();

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "";
    const club = CLUBS[url.searchParams.get("club") || ""];
    if (!club) return json({ error: "club attendu : " + Object.keys(CLUBS).join(", ") }, 400);
    const token = Deno.env.get(club.secret) || "";
    if (!token) return json({ error: club.secret + " non configuré" }, 500);

    if (action !== "discover") return json({ error: "Action inconnue (phase 1 : discover uniquement)" }, 400);

    const report: Record<string, unknown> = { club: club.studio, at: new Date().toISOString() };

    // /me : clés et types seulement, plus le nom du club pour vérifier que le bon token est posé
    const me = await get(token, "/me");
    const meData = me.body?.data ?? me.body;
    report.me = { http: me.status, rate: me.rate, shape: meData ? shape([meData]) : null,
      club_name: typeof meData?.club?.name === "string" ? meData.club.name : typeof meData?.name === "string" ? meData.name : null };

    // Équipe : nombre et forme seulement (emails du personnel = données personnelles)
    const users = await get(token, "/users");
    report.users = { http: users.status, count: listOf(users.body).length, shape: shape(listOf(users.body)) };

    // Configuration métier (pas de donnée personnelle) : valeurs renvoyées
    const tags = await get(token, "/tags");
    // deno-lint-ignore no-explicit-any
    report.tags = { http: tags.status, count: listOf(tags.body).length, names: listOf(tags.body).map((t: any) => String(t?.name ?? t?.label ?? t ?? "").slice(0, 40)).slice(0, 100) };
    const tunnels = await get(token, "/tunnels");
    // deno-lint-ignore no-explicit-any
    report.tunnels = { http: tunnels.status, list: listOf(tunnels.body).map((t: any) => ({
      id: t?.id, name: String(t?.name ?? "").slice(0, 60),
      // deno-lint-ignore no-explicit-any
      stages: (t?.stages || t?.etapes || []).map((s: any) => ({ id: s?.id, name: String(s?.name ?? "").slice(0, 60), order: s?.order ?? s?.position ?? null })),
    })), shape: shape(listOf(tunnels.body)) };
    const ref = await get(token, "/reference");
    report.reference = { http: ref.status, data: ref.body?.data ?? ref.body };

    // Contacts : 1 page, forme + comptes agrégés (jamais de nom, email, téléphone, note)
    const contacts = await get(token, "/contacts?limit=50&page=1");
    const cl = listOf(contacts.body);
    report.contacts = { http: contacts.status, rate: contacts.rate, pagination: pagination(contacts.body), shape: shape(cl),
      enums: enums(cl), consents: consents(cl), phone_formats: phones(cl), top_keys: contacts.body ? Object.keys(contacts.body) : [] };

    const deleted = await get(token, "/contacts/deleted?limit=1");
    report.deleted = { http: deleted.status, pagination: pagination(deleted.body) };

    const acts = await get(token, "/activities?limit=50");
    const al = listOf(acts.body);
    report.activities = { http: acts.status, pagination: pagination(acts.body), shape: shape(al), enums: enums(al) };

    const stats = await get(token, "/stats/activities");
    report.stats = { http: stats.status, shape: stats.body ? shape([stats.body?.data ?? stats.body]) : null };

    return json({ ok: true, report });
  } catch (err) {
    console.error("boost-sync", (err as Error).message);
    return json({ error: "Erreur serveur" }, 500);
  }
});
