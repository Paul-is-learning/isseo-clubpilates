// ═════════════════════════════════════════════════════════════════
// weekly-digest · e-mail du lundi matin : bilan commercial de la semaine passée
// ─────────────────────────────────────────────────────────────────
// Pour chaque utilisateur de l'app (table profiles, droits par société comme dans
// js/constants.js ROLE_FILTER), un e-mail avec, par studio visible :
//   · nouveaux leads (arrivée dans Boost dans la semaine)
//   · nouveaux inscrits (date d'inscription Boost dans la semaine)
//   · packs signés (ventes déclarées dans le Sales Coach, avec pack)
//   · Intro Class réalisées (contacts venus à leur IC dans la semaine)
// Semaine = du lundi précédent 00:00 au lundi courant 00:00 (heure de Paris).
// Déclenchée par le cron weekly-digest-lundi-9h (Bearer service role, JWT vérifié).
// Paramètres de test : ?dry=1 (chiffres seulement, aucun envoi) · ?only=email (un seul destinataire)
// Secrets : RESEND_API_KEY, BOOST_TOKEN_GARENNE, BOOST_TOKEN_LATTES, SUPABASE_*
// ═════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AIRCALL_STUDIO, aircallGet } from "../_shared/aircall.ts";
import { readProspectsRow } from "../_shared/store.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("PUBLIC_APP_URL") || Deno.env.get("APP_URL") || "https://clubpilates.isseo-dev.com";
const BASE = "https://www.app-boost.com/api/v1";

// Studio de l'app (table studios) → club Boost et libellé du Sales Coach
const CLUBS: Record<string, { secret: string; coach: string }> = {
  garenne: { secret: "BOOST_TOKEN_GARENNE", coach: "La Garenne-Colombes" },
  lattes: { secret: "BOOST_TOKEN_LATTES", coach: "Montpellier Lattes" },
  levallois: { secret: "BOOST_TOKEN_DEFENSE", coach: "La Défense" },
};

const PACKS: Record<string, string> = { "1": "4 séances", "2": "8 séances", "3": "Illimité" };

// Droits par société, copie de ROLE_FILTER (js/constants.js)
function canSee(role: string, societe: string): boolean {
  if (role === "coquel" || role === "caroline") return societe === "COBE Society" || societe === "SACOBE Society";
  if (role === "sabourin") return societe === "SACOBE Society";
  return true;
}

// deno-lint-ignore no-explicit-any
const listOf = (b: any): any[] => (Array.isArray(b?.data) ? b.data : Array.isArray(b) ? b : []);

// deno-lint-ignore no-explicit-any
async function boostAll(token: string, path: string, limit = 50, maxPages = 80): Promise<{ items: any[]; ok: boolean }> {
  // deno-lint-ignore no-explicit-any
  const items: any[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const r = await fetch(`${BASE}${path}${sep}limit=${limit}&page=${page}`, { headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
    if (!r.ok) { await r.body?.cancel(); return { items, ok: false }; }
    const body = await r.json().catch(() => null);
    if (!body) return { items, ok: false };
    items.push(...listOf(body));
    const p = body.pagination || body;
    if (!p?.has_more) return { items, ok: true };
    await new Promise((res) => setTimeout(res, 60));
  }
  return { items, ok: false };
}

// Instant « lundi 00:00 Paris » de la semaine courante, en ISO UTC
function parisMondayIso(now: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  const back = (dow + 6) % 7; // jours écoulés depuis lundi
  const d = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - back);
  // décalage Paris (UTC+1 ou +2) au jour considéré
  const off = (() => {
    const f = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", timeZoneName: "shortOffset" }).formatToParts(d).find((p) => p.type === "timeZoneName")?.value || "GMT+1";
    const m = f.match(/([+-])(\d+)/); return m ? (m[1] === "-" ? -1 : 1) * Number(m[2]) : 1;
  })();
  d.setUTCHours(d.getUTCHours() - off);
  return d.toISOString();
}

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" });

type Stats = { leads: number; inscrits: number; packs: number; packsDetail: string; ic: number; icDetail: string; ok: boolean; aircall?: { total: number; rattaches: number; pct: number; ok: boolean }; sources: { leads: number; google: number; meta: number; site: number } };

// deno-lint-ignore no-explicit-any
function countContacts(contacts: any[], from: string, to: string): Omit<Stats, "packs" | "packsDetail" | "ok" | "icDetail"> {
  const inWeek = (v: unknown) => { const s = String(v || ""); return !!s && s >= from && s < to; };
  let leads = 0, inscrits = 0, ic = 0, google = 0, meta = 0, site = 0;
  for (const c of contacts) {
    const arr = c.effective_entry_at || c.created_at;
    if (inWeek(arr)) {
      leads++;
      const src = String(c.source || c.first_source || "");
      if (src === "google_ads") google++; else if (src === "facebook_ads") meta++; else if (src === "site_web") site++;
    }
    if (inWeek(c.date_inscription) || (!c.date_inscription && String(c.status) === "client" && inWeek(c.status_changed_at))) inscrits++;
    if (inWeek(c.date_last_rdv_venu)) ic++;
  }
  return { leads, inscrits, ic, sources: { leads, google, meta, site } };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const only = (url.searchParams.get("only") || "").trim().toLowerCase();
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const now = new Date();
  const to = parisMondayIso(now);
  const from = new Date(new Date(to).getTime() - 7 * 86400000).toISOString();
  const lastDay = new Date(new Date(to).getTime() - 1).toISOString();

  // ── Studios de l'app (nom, société) ──
  const { data: srows, error: serr } = await sb.from("studios").select("id,data");
  if (serr) return new Response(JSON.stringify({ error: serr.message }), { status: 500 });
  // deno-lint-ignore no-explicit-any
  const studios = (srows || []).filter((r: any) => CLUBS[r.id] && r.data?.name && Deno.env.get(CLUBS[r.id].secret)).map((r: any) => ({ id: r.id, name: String(r.data.name), societe: String(r.data.societe || "") }));

  // ── Ventes déclarées dans le Sales Coach (événements abo) ──
  const { data: stRow } = await sb.from("coach_store").select("data").eq("id", "_coach_stats").maybeSingle();
  // deno-lint-ignore no-explicit-any
  const events: any[] = Array.isArray(stRow?.data?.events) ? stRow!.data.events : [];
  const { data: icRow } = await sb.from("coach_store").select("data").eq("id", "_ic_data").maybeSingle();
  // deno-lint-ignore no-explicit-any
  const icSessions: any[] = Array.isArray(icRow?.data?.sessions) ? icRow!.data.sessions : [];

  // ── Chiffres par studio ──
  const stats: Record<string, Stats> = {};
  const diag: Record<string, unknown> = {};
  for (const s of studios) {
    const club = CLUBS[s.id];
    const token = Deno.env.get(club.secret) || "";
    const packsEv = events.filter((e) => e.type === "abo" && e.studio === club.coach && String(e.ts || "") >= from && String(e.ts || "") < to);
    const byPack: Record<string, number> = {};
    for (const e of packsEv) { const k = PACKS[String(e.pack || "")] || "pack à préciser"; byPack[k] = (byPack[k] || 0) + 1; }
    const packsDetail = Object.entries(byPack).map(([k, n]) => `${n} × ${k}`).join(" · ");
    if (!token) continue;
    const contacts = await boostAll(token, "/contacts");
    const c = countContacts(contacts.items, from, to);
    // Intro Class réalisées : séances « faites » saisies dans le Sales Coach (nombre de séances et de présents) ;
    // à défaut, contacts Boost passés « RDV venu » dans la semaine (Boost ne renseigne jamais est_venu)
    const sess = icSessions.filter((x) => x.studio === club.coach && x.statut === "faite" && String(x.date || "") >= from.slice(0, 10) && String(x.date || "") < to.slice(0, 10));
    const presents = sess.reduce((n, x) => n + (Number(x.show) || 0), 0);
    const venus = contacts.items.filter((x) => String(x.status) === "rdv_venu" && String(x.status_changed_at || "") >= from && String(x.status_changed_at || "") < to).length;
    const ic = sess.length || venus;
    const icDetail = sess.length
      ? [presents ? `${presents} présent${presents > 1 ? "s" : ""}` : "présents non saisis dans l'outil", venus ? `${venus} RDV venu${venus > 1 ? "s" : ""} dans Boost` : ""].filter(Boolean).join(" · ")
      : (venus ? "passés « RDV venu » dans Boost" : "aucune séance saisie");
    if (dry) diag[s.id] = { contacts: contacts.items.length, sessionsFaites: sess.length, presents, venusBoost: venus };
    stats[s.id] = { ...c, ic, icDetail, packs: packsEv.length, packsDetail, ok: contacts.ok };
  }

  // ── Contrôle Aircall (Lattes) : part des appels de la semaine rattachés à une fiche ──
  const sk = (x: unknown) => String(x ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
  const acStudio = studios.find((x) => sk(CLUBS[x.id].coach) === sk(AIRCALL_STUDIO));
  if (acStudio && Deno.env.get("AIRCALL_API_ID")) {
    let total = 0, ok = false;
    const f = Math.floor(new Date(from).getTime() / 1000), t = Math.floor(new Date(to).getTime() / 1000);
    for (let page = 1; page <= 20; page++) {
      const r = await aircallGet(`/calls?from=${f}&to=${t}&order=asc&per_page=50&page=${page}`);
      if (r.status !== 200 || !r.body) break;
      // deno-lint-ignore no-explicit-any
      total += (r.body.calls || []).filter((c: any) => c?.direction === "outbound" || c?.direction === "inbound").length;
      if (!r.body.meta?.next_page_link) { ok = true; break; }
      await new Promise((res) => setTimeout(res, 1100));
    }
    const prRow = await readProspectsRow(sb);
    // deno-lint-ignore no-explicit-any
    const plist: any[] = Array.isArray(prRow.data?.prospects) ? prRow.data.prospects : [];
    let rattaches = 0;
    // deno-lint-ignore no-explicit-any
    for (const p of plist) if (sk(p?.studio) === sk(AIRCALL_STUDIO)) for (const a of (p.appels || [])) if (String(a?.id || "").startsWith("ac_") && String(a?.ts || "") >= from && String(a?.ts || "") < to) rattaches++;
    stats[acStudio.id].aircall = { total, rattaches, pct: total ? Math.round(rattaches / total * 100) : 100, ok };
  }

  if (dry) return new Response(JSON.stringify({ from, to, stats, diag }, null, 1), { headers: { "Content-Type": "application/json" } });
  if (!RESEND_API_KEY) return new Response(JSON.stringify({ error: "RESEND_API_KEY manquant" }), { status: 500 });

  // ── Destinataires : profils de l'app, droits par société ──
  const { data: profiles } = await sb.from("profiles").select("id,email,nom,role");
  const { data: adm } = await sb.from("studios").select("data").eq("id", "_admin_settings").maybeSingle();
  const settings = (adm?.data?.settings || {}) as { roles?: Record<string, string>; blocked?: string[] };
  const blocked = new Set(settings.blocked || []);
  const results: string[] = [];
  const weekLbl = `${fmtDay(from)} au ${fmtDay(lastDay)}`;

  for (const u of profiles || []) {
    const email = String(u.email || "").trim().toLowerCase();
    if (!email || blocked.has(u.id)) continue;
    if (only && email !== only) continue;
    const role = String(u.role || settings.roles?.[u.id] || "viewer");
    const mine = studios.filter((s) => canSee(role, s.societe));
    const first = String(u.nom || "").replace(/\s*\(.*\)\s*/, "").split(" ")[0] || "";
    if (!mine.length) { results.push(`${first}: aucun studio`); continue; }

    const tile = (n: number, lbl: string, sub: string, col: string) =>
      `<td style="width:50%;padding:6px"><div style="background:#f7f7f2;border-radius:10px;padding:14px 12px;text-align:center"><div style="font-size:26px;font-weight:800;color:${col};line-height:1">${n}</div><div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-top:6px">${lbl}</div><div style="font-size:11px;color:#888;margin-top:2px;min-height:14px">${sub}</div></div></td>`;

    let studiosHtml = "";
    for (const s of mine) {
      const st = stats[s.id];
      const src = st.sources;
      const srcLbl = st.leads ? [src.google ? `${src.google} Google` : "", src.meta ? `${src.meta} Meta` : "", src.site ? `${src.site} site` : ""].filter(Boolean).join(" · ") : "aucun cette semaine";
      studiosHtml += `<div style="background:#fff;border:1px solid #e8e8e0;border-radius:12px;padding:18px 14px;margin-bottom:16px">
<div style="font-weight:700;font-size:16px;margin:0 0 4px">${s.name}</div>
<div style="font-size:12px;color:#888;margin-bottom:10px">${st.ok ? "Chiffres Boost et Sales Coach" : "Boost indisponible ce matin : seuls les packs déclarés dans l'outil sont affichés"}</div>
<table role="presentation" style="width:100%;border-collapse:collapse"><tr>${tile(st.leads, "Nouveaux leads", srcLbl, "#185FA5")}${tile(st.inscrits, "Nouveaux inscrits", "inscrits dans Boost", "#0F6E56")}</tr><tr>${tile(st.packs, st.packs > 1 ? "Packs signés" : "Pack signé", st.packsDetail || "déclarés dans le Sales Coach", "#C9871F")}${tile(st.ic, st.ic > 1 ? "Intro Class réalisées" : "Intro Class réalisée", st.icDetail, "#6b40b8")}</tr></table>${st.aircall ? `<div style="margin-top:10px;font-size:12px;color:#555;padding:8px 10px;border-radius:8px;background:${!st.aircall.ok ? "#F1EFE8" : st.aircall.pct < 70 ? "#FCEBEB" : "#F1EFE8"}">${!st.aircall.ok ? "Contrôle Aircall indisponible ce matin" : `Appels Aircall de la semaine : <b>${st.aircall.total}</b> · rattachés à une fiche : <b>${st.aircall.rattaches}</b> (${st.aircall.pct} %)${st.aircall.pct < 70 ? ` · <span style="color:#A32D2D;font-weight:700">⚠️ ${st.aircall.total - st.aircall.rattaches} appels sans fiche : numéros absents ou différents de Boost, à compléter</span>` : ""}`}</div>` : ""}</div>`;
    }

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,Segoe UI,sans-serif"><div style="max-width:600px;margin:0 auto;padding:24px 16px">
<div style="background:#F8F5EE;border:1px solid #e8e8e0;border-bottom:none;border-radius:12px 12px 0 0;padding:20px 24px"><table role="presentation" style="border-collapse:collapse"><tr><td style="vertical-align:middle;padding-right:12px"><img src="${APP_URL}/cp-sales-coach/icons/icon-192.png" width="44" height="44" alt="" style="display:block;border-radius:50%"></td><td style="vertical-align:middle;padding-right:10px"><img src="${APP_URL}/cp-sales-coach/logo-jjoseph.png" height="30" alt="Joseph" style="display:block;height:30px;width:auto"></td><td style="vertical-align:middle;font-size:13px;color:#6b6b66;white-space:nowrap;padding-top:6px">by <img src="${APP_URL}/logo-black-sm.png" height="18" alt="Isseo" style="height:18px;width:auto;vertical-align:middle;margin-left:4px"></td></tr></table><div style="color:#6b6b66;font-size:12px;margin-top:14px">Bilan commercial · semaine du ${weekLbl}</div></div>
<div style="background:#fff;padding:26px 24px;border:1px solid #e8e8e0;border-top:none">
<h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 6px">Bonjour ${first}</h1>
<p style="font-size:14px;color:#555;margin:0 0 20px">Voici les résultats de la semaine passée pour ${mine.length > 1 ? "vos studios" : "votre studio"}.</p>
${studiosHtml}
<a href="${APP_URL}/cp-sales-coach/" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;margin-top:4px">Ouvrir le Sales Coach</a>
</div>
<div style="font-size:11px;color:#999;padding:14px 8px;line-height:1.5">ISSEO · Club Pilates France · envoi automatique chaque lundi à 9h.<br>Leads, inscrits et Intro Class : Fitness Boost. Packs : ventes déclarées par l'équipe dans le Sales Coach.</div>
</div></body></html>`;

    await new Promise((r) => setTimeout(r, 300));
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Club Pilates ISSEO <noreply@isseo-dev.com>", to: [email], subject: `Bilan commercial Club Pilates · semaine du ${weekLbl}`, html }),
    });
    await res.body?.cancel();
    results.push(`${first}: ${res.status}`);
  }

  return new Response(JSON.stringify({ from, to, stats, sent: results }, null, 1), { headers: { "Content-Type": "application/json" } });
});
