// ════════════════════════════════════════════════════════════════════════════
// Edge Function — allo-contacts (Sales Coach → Allo, noms des contacts)
// ════════════════════════════════════════════════════════════════════════════
// Demande de Paul (24 nov. 2026) : dans Allo, les appels n'affichent que des numéros.
// Cette fonction crée dans le carnet Allo (CRM « People ») un contact par fiche du studio
// Allo, avec le vrai nom de la fiche, pour que l'appelant soit reconnu.
//
// Règles
//   · une fiche = un numéro = un contact Allo (nom complet dans « name », rien dans « last_name »,
//     que l'équipe utilise librement comme étiquette)
//   · numéro déjà connu d'Allo avec un nom saisi par l'équipe → on n'y touche jamais
//   · numéro connu d'Allo sans nom (ou nom = numéro) → on pose le nom de la fiche
//   · un contact créé ici dont le nom change dans la fiche est renommé, tant que personne
//     ne l'a modifié dans Allo
//   · jamais de suppression ; 40 contacts au plus par passage (limite Allo : 5 écritures/s)
//
// Secrets : ALLO_API_KEY avec les droits CRM_READ + CRM_WRITE, ALLO_STUDIO (défaut La Garenne-Colombes).
// Auth : x-sync-key (clé du planificateur, coach_store `_boost_cron`) ou x-admin-code (code maître).
// Déployée avec --no-verify-jwt.
//
// POST ?action=check   droits de la clé + nombre de fiches à traiter (aucune écriture)
// POST ?action=run     un passage (planificateur, toutes les 10 min)
// Les réponses ne contiennent que des compteurs, jamais de nom ni de numéro.
// ════════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRow, putRow, rateLimit, readProspectsRow, revStr, safeEq } from "../_shared/store.ts";

const API = "https://api.withallo.com/v2/api";
const ROW = "_allo_contacts";
const LIMIT = 40;

const json = (obj: unknown, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
const sk = (s: unknown) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
export const telKey = (s: unknown) => String(s ?? "").replace(/\D/g, "").slice(-9);
// Numéro au format international ; vide si le numéro n'est pas exploitable
export function e164(raw: unknown): string {
  const s = String(raw ?? "").trim(), d = s.replace(/\D/g, "");
  if (s.startsWith("+") && d.length >= 8 && d.length <= 15) return "+" + d;
  if (d.startsWith("00") && d.length >= 10) return "+" + d.slice(2);
  if (d.length === 10 && d.startsWith("0")) return "+33" + d.slice(1);
  if (d.length === 11 && d.startsWith("33")) return "+" + d;
  if (d.length === 9 && /^[1-9]/.test(d)) return "+33" + d;
  return "";
}
// Un vrai nom : au moins deux lettres, et pas un numéro ni un libellé technique
export const realName = (n: unknown) => { const s = String(n ?? "").trim(); return /\p{L}{2}/u.test(s) && !/^(inconnu|sans nom|numéro|appel|allo)\b/i.test(s) ? s.replace(/\s+/g, " ").slice(0, 80) : ""; };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Done = { id: string; nom: string; at: string; how: "created" | "named" | "renamed" | "kept" | "existing" };

serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST attendu" }, 405);
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const rl = await rateLimit(admin, req);
    if (rl.blocked) return json({ error: "Trop d'essais · réessayez dans 15 minutes" }, 429);
    const { data: cron } = await admin.from("coach_store").select("data").eq("id", "_boost_cron").maybeSingle();
    const cronKey = String(cron?.data?.key || "");
    const master = (Deno.env.get("COACH_CODE") || "").trim().toUpperCase();
    const okKey = cronKey.length >= 32 && safeEq(req.headers.get("x-sync-key") || "", cronKey);
    const okCode = !!master && safeEq((req.headers.get("x-admin-code") || "").trim().toUpperCase(), master);
    if (!okKey && !okCode) { await rl.fail(); return json({ error: "Clé invalide" }, 401); }

    const apiKey = Deno.env.get("ALLO_API_KEY") || "";
    if (!apiKey) return json({ error: "ALLO_API_KEY non configuré" }, 500);
    const STUDIO = Deno.env.get("ALLO_STUDIO") || "La Garenne-Colombes";
    const H = { Authorization: "Api-Key " + apiKey, "Content-Type": "application/json", Accept: "application/json" };
    const action = new URL(req.url).searchParams.get("action") || "check";

    // Fiches du studio Allo : un vrai nom et un numéro exploitable, une seule par numéro (la plus récente)
    const row = await readProspectsRow(admin);
    // deno-lint-ignore no-explicit-any
    const list: any[] = Array.isArray(row.data?.prospects) ? row.data.prospects : [];
    // deno-lint-ignore no-explicit-any
    const byKey = new Map<string, any>();
    for (const p of list) {
      if (!p || sk(p.studio) !== sk(STUDIO)) continue;
      const num = e164(p.tel), nom = realName(p.nom), k = telKey(num);
      if (!num || !nom || k.length !== 9) continue;
      const cur = byKey.get(k);
      if (!cur || String(p.maj || "") > String(cur.maj || "")) byKey.set(k, { num, nom, email: String(p.email || "").trim(), maj: p.maj || "" });
    }
    const state = await getRow(admin, ROW);
    const done: Record<string, Done> = (state.done && typeof state.done === "object") ? state.done : {};
    const todo = [...byKey.entries()].filter(([k, f]) => !done[k] || ((done[k].how === "created" || done[k].how === "named" || done[k].how === "renamed") && done[k].nom !== f.nom));

    if (action === "check") {
      let scopes: string[] = [], me = 0;
      try { const r = await fetch(API + "/me", { headers: H }); me = r.status; const d = await r.json().catch(() => ({})); scopes = (d?.data?.scopes || d?.scopes || []) as string[]; } catch (_e) { /* réseau */ }
      const has = (s: string) => scopes.includes(s);
      return json({ ok: true, studio: STUDIO, cle_allo: { http: me, lecture_crm: has("CRM_READ"), ecriture_crm: has("CRM_WRITE") }, fiches_avec_nom_et_numero: byKey.size, deja_traitees: Object.keys(done).length, a_traiter: todo.length, par_passage: LIMIT });
    }
    if (action !== "run") return json({ error: "Action inconnue" }, 400);

    // Veille : liste des fiches inchangée depuis un passage sans reste → rien à faire
    const rev = revStr(row.updated_at);
    if (!todo.length) { if (state.rev !== rev) await putRow(admin, ROW, { ...state, done, rev, last: new Date().toISOString() }); return json({ ok: true, idle: true, a_traiter: 0 }); }

    const res = { crees: 0, nommes: 0, renommes: 0, conserves: 0, erreurs: 0 };
    let stop = "";
    for (const [k, f] of todo.slice(0, LIMIT)) {
      const now = new Date().toISOString();
      try {
        const rs = await fetch(API + "/crm/people/search", { method: "POST", headers: H, body: JSON.stringify({ filters: { phone_number: f.num }, page: 1, size: 5 }) });
        if (rs.status === 401 || rs.status === 403) { stop = "La clé Allo n'a pas le droit de lire le carnet (CRM_READ)"; break; }
        if (rs.status === 429) { stop = "Limite de débit Allo atteinte · reprise au prochain passage"; break; }
        if (!rs.ok) { res.erreurs++; continue; }
        const found = ((await rs.json().catch(() => ({})))?.data || []) as { id: string; name?: string; last_name?: string }[];
        const ex = found[0];
        if (ex) {
          const exName = realName(((ex.name || "") + " " + (ex.last_name || "")).trim());
          const ours = done[k] && done[k].id === ex.id && done[k].how !== "kept" && done[k].how !== "existing" && String(ex.name || "").trim() === done[k].nom && !String(ex.last_name || "").trim();
          if (exName && !ours) { done[k] = { id: ex.id, nom: f.nom, at: now, how: "kept" }; res.conserves++; continue; } // nommé par l'équipe : intouché
          const ru = await fetch(API + "/crm/people/" + encodeURIComponent(ex.id), { method: "PUT", headers: H, body: JSON.stringify({ name: f.nom }) });
          if (ru.status === 401 || ru.status === 403) { stop = "La clé Allo n'a pas le droit d'écrire dans le carnet (CRM_WRITE)"; break; }
          if (ru.status === 429) { stop = "Limite de débit Allo atteinte · reprise au prochain passage"; break; }
          if (!ru.ok) { res.erreurs++; continue; }
          done[k] = { id: ex.id, nom: f.nom, at: now, how: ours ? "renamed" : "named" };
          if (ours) res.renommes++; else res.nommes++;
        } else {
          const body: Record<string, unknown> = { name: f.nom, numbers: [f.num] };
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) body.emails = [f.email];
          const rc = await fetch(API + "/crm/people", { method: "POST", headers: H, body: JSON.stringify(body) });
          if (rc.status === 401 || rc.status === 403) { stop = "La clé Allo n'a pas le droit d'écrire dans le carnet (CRM_WRITE)"; break; }
          if (rc.status === 429) { stop = "Limite de débit Allo atteinte · reprise au prochain passage"; break; }
          if (rc.status === 409) { done[k] = { id: "", nom: f.nom, at: now, how: "existing" }; res.conserves++; continue; } // numéro déjà attribué dans Allo
          if (!rc.ok) { res.erreurs++; continue; }
          const d = await rc.json().catch(() => ({}));
          done[k] = { id: String(d?.data?.id || d?.id || ""), nom: f.nom, at: now, how: "created" };
          res.crees++;
        }
      } catch (_e) { res.erreurs++; }
      await wait(230); // au plus ~4 écritures par seconde
    }
    const reste = [...byKey.entries()].filter(([k, f]) => !done[k] || ((done[k].how === "created" || done[k].how === "named" || done[k].how === "renamed") && done[k].nom !== f.nom)).length;
    await putRow(admin, ROW, { done, rev: reste ? "" : rev, last: new Date().toISOString(), dernier: res });
    return json({ ok: !stop, ...res, reste, ...(stop ? { arret: stop } : {}) }, stop ? 502 : 200);
  } catch (e) {
    console.warn("[allo-contacts]", e);
    return json({ error: "Erreur interne" }, 500);
  }
});
