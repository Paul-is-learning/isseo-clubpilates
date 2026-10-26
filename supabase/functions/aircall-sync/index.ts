// ═══════════════════════════════════════════════════════════════════════════
// Edge Function — aircall-sync (découverte + mise en place du branchement)
// ═══════════════════════════════════════════════════════════════════════════
// Aircall (téléphonie de Montpellier Lattes) doit enrichir les fiches Boost,
// comme Allo : appels, durée, résumé, transcription. Cette première version ne
// fait que des GET vers l'API Aircall et n'écrit RIEN : elle renvoie un rapport
// sans donnée personnelle (comptes, formes, disponibilité de l'IA) pour caler
// le branchement sur ce que le compte fournit vraiment.
//
// POST ?action=discover          lecture seule, rapport sans donnée personnelle
// POST ?action=setup_webhook     crée dans Aircall la notification « Sales Coach »
//                                (call.ended + transcription.created → aircall-webhook)
// POST ?action=remove_webhook    la supprime
// POST ?action=backfill&days=60[&write=1]  range les appels passés sur les fiches de Lattes
//                                (sans write : simulation, comptes seulement)
// En-tête x-sync-key = BOOST_SYNC_KEY
// Secrets : AIRCALL_API_ID, AIRCALL_API_TOKEN (Basic auth), BOOST_SYNC_KEY
// Déployée avec --no-verify-jwt.
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRow, putRow, rateLimit, safeEq } from "../_shared/store.ts";
import { AIRCALL_STUDIO, callMeta, callTs, telKey } from "../_shared/aircall.ts";

const BASE = "https://api.aircall.io/v1";

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj, null, 1), { status, headers: { "Content-Type": "application/json" } });
}
// deno-lint-ignore no-explicit-any
const typeOf = (v: any) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);
// deno-lint-ignore no-explicit-any
function shape(items: any[]) {
  const keys: Record<string, { types: string[]; present: number }> = {};
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    for (const [k, v] of Object.entries(it)) {
      keys[k] = keys[k] || { types: [], present: 0 };
      const t = typeOf(v);
      if (!keys[k].types.includes(t)) keys[k].types.push(t);
      if (v !== null && v !== "" && !(Array.isArray(v) && !v.length)) keys[k].present++;
    }
  }
  return { sample: items.length, keys };
}
const count = (arr: unknown[]) => arr.reduce((o: Record<string, number>, k) => { const s = String(k ?? "null"); o[s] = (o[s] || 0) + 1; return o; }, {});

serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST attendu" }, 405);
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const rl = await rateLimit(admin, req);
    if (rl.blocked) return json({ error: "Trop d'essais · réessayez dans 15 minutes" }, 429);
    const key = Deno.env.get("BOOST_SYNC_KEY") || "";
    if (key.length < 24 || !safeEq(req.headers.get("x-sync-key") || "", key)) { await rl.fail(); return json({ error: "Clé invalide" }, 401); }
    await rl.ok();
    const id = Deno.env.get("AIRCALL_API_ID") || "", tok = Deno.env.get("AIRCALL_API_TOKEN") || "";
    if (!id || !tok) return json({ error: "AIRCALL_API_ID ou AIRCALL_API_TOKEN non configuré" }, 500);
    const H = { Authorization: "Basic " + btoa(id + ":" + tok), Accept: "application/json" };
    const get = async (path: string) => {
      const r = await fetch(BASE + path, { headers: H, redirect: "manual" });
      const rate: Record<string, string> = {};
      r.headers.forEach((v, k) => { if (/ratelimit|retry-after/i.test(k)) rate[k] = v.slice(0, 40); });
      if (!r.ok) { await r.body?.cancel(); return { status: r.status, rate, body: null }; }
      // deno-lint-ignore no-explicit-any
      let body: any = null;
      try { body = await r.json(); } catch { /* non JSON */ }
      return { status: r.status, rate, body };
    };

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "";
    if (action === "setup_webhook" || action === "remove_webhook") {
      const cfg = await getRow(admin, "_aircall");
      const send = async (method: string, path: string, body?: unknown) => {
        const r = await fetch(BASE + path, { method, redirect: "manual", headers: { ...H, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
        // deno-lint-ignore no-explicit-any
        let b: any = null; try { b = await r.json(); } catch { /* vide */ }
        return { status: r.status, body: b };
      };
      if (action === "remove_webhook") {
        if (!cfg.webhook_id) return json({ ok: true, note: "aucun webhook enregistré" });
        const r = await send("DELETE", "/webhooks/" + encodeURIComponent(String(cfg.webhook_id)));
        await putRow(admin, "_aircall", {});
        return json({ ok: r.status < 300 || r.status === 404, http: r.status });
      }
      if (cfg.webhook_id && cfg.token) return json({ ok: true, deja: true, webhook_id: cfg.webhook_id });
      const target = (Deno.env.get("SUPABASE_URL") || "") + "/functions/v1/aircall-webhook";
      const r = await send("POST", "/webhooks", { custom_name: "Sales Coach", url: target, events: ["call.ended", "transcription.created"] });
      const w = r.body?.webhook || r.body;
      if (r.status >= 300 || !w?.token) return json({ ok: false, http: r.status }, 502);
      await putRow(admin, "_aircall", { webhook_id: w.webhook_id ?? w.id, token: w.token, at: new Date().toISOString() });
      return json({ ok: true, webhook_id: w.webhook_id ?? w.id, evenements: w.events || ["call.ended", "transcription.created"] });
    }
    if (action === "backfill") {
      const days = Math.max(1, Math.min(120, Number(url.searchParams.get("days")) || 60));
      const write = url.searchParams.get("write") === "1";
      const from = Math.floor(Date.now() / 1000) - days * 86400;
      // deno-lint-ignore no-explicit-any
      const calls: any[] = [];
      let pages = 0, complete = false;
      for (let page = 1; page <= 80; page++) {
        const r = await get(`/calls?from=${from}&order=asc&per_page=50&page=${page}`);
        if (r.status !== 200 || !r.body) break;
        calls.push(...(r.body.calls || []));
        pages++;
        if (!r.body.meta?.next_page_link) { complete = true; break; }
        await new Promise((res) => setTimeout(res, 1100)); // limite Aircall : 60 requêtes / minute
      }
      if (!complete) return json({ ok: false, error: "Lecture Aircall incomplète", pages, appels_lus: calls.length }, 502);
      const sk = (x: unknown) => String(x ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
      const apply = (list: any[]) => { // deno-lint-ignore no-explicit-any
        const byKey = new Map<string, any>();
        for (const p of list) if (sk(p?.studio) === sk(AIRCALL_STUDIO)) { const k = telKey(p?.tel); if (k.length === 9 && (!byKey.has(k) || (p.bid && !byKey.get(k).bid))) byKey.set(k, p); }
        let rattaches = 0, deja = 0, inconnus = 0; const fiches = new Set<string>();
        for (const c of calls) {
          const p = byKey.get(telKey(c?.raw_digits));
          if (!p) { inconnus++; continue; }
          p.appels = Array.isArray(p.appels) ? p.appels : [];
          const id = "ac_" + String(c.id).slice(0, 30);
          if (p.appels.some((a: any) => a?.id === id)) { deja++; continue; }
          p.appels.push({ id, ts: callTs(c), rx: c?.ended_at ? new Date(Number(c.ended_at) * 1000).toISOString() : callTs(c), sv: 0, txt: callMeta(c) });
          p.appels.sort((a: any, b: any) => String(a.ts).localeCompare(String(b.ts)));
          if (p.appels.length > 20) p.appels = p.appels.slice(-20);
          rattaches++; fiches.add(p.id);
        }
        return { rattaches, deja, inconnus, fiches: fiches.size };
      };
      const report = { jours: days, appels_aircall: calls.length, pages };
      for (let attempt = 0; attempt < 4; attempt++) {
        const { data: row } = await admin.from("coach_store").select("data,updated_at").eq("id", "_coach_prospects").maybeSingle();
        // deno-lint-ignore no-explicit-any
        const list: any[] = structuredClone(row?.data?.prospects || []);
        const res = apply(list);
        if (!write) return json({ ok: true, mode: "simulation", ...report, ...res });
        if (!res.rattaches) return json({ ok: true, mode: "import", ...report, ...res });
        const { data: upd } = await admin.from("coach_store")
          .update({ data: { ...(row?.data || {}), prospects: list }, updated_at: new Date().toISOString() })
          .eq("id", "_coach_prospects").eq("updated_at", row?.updated_at).select("id");
        if (upd && upd.length) return json({ ok: true, mode: "import", ...report, ...res });
        await new Promise((res2) => setTimeout(res2, 400));
      }
      return json({ ok: false, error: "Les fiches changeaient pendant l'écriture · relancez" }, 409);
    }
    if (action !== "discover") return json({ error: "Action inconnue" }, 400);
    const report: Record<string, unknown> = { at: new Date().toISOString() };

    const company = await get("/company");
    report.company = { http: company.status, name: typeof company.body?.company?.name === "string" ? company.body.company.name : null };

    // Lignes : nom et pays seulement (pour savoir quelle ligne correspond à quel studio)
    const numbers = await get("/numbers?per_page=50");
    // deno-lint-ignore no-explicit-any
    const nl: any[] = numbers.body?.numbers || [];
    report.numbers = { http: numbers.status, count: nl.length, list: nl.map((n) => ({ id: n?.id, name: String(n?.name || "").slice(0, 60), country: n?.country || "", fin: String(n?.digits || "").replace(/\D/g, "").slice(-2) })) };

    const users = await get("/users?per_page=50");
    // deno-lint-ignore no-explicit-any
    const ul: any[] = users.body?.users || [];
    report.users = { http: users.status, count: ul.length, names: ul.map((u) => String(u?.name || "").slice(0, 60)) };

    // Appels récents : forme et comptes, jamais de numéro ni de contenu
    const calls = await get("/calls?per_page=50&order=desc");
    // deno-lint-ignore no-explicit-any
    const cl: any[] = calls.body?.calls || [];
    const durs = cl.map((c) => Number(c?.duration) || 0).filter((d) => d > 0).sort((a, b) => a - b);
    const ts = cl.map((c) => Number(c?.started_at) || 0).filter(Boolean);
    report.calls = {
      http: calls.status, rate: calls.rate, meta: calls.body?.meta ? { total: calls.body.meta.total, count: calls.body.meta.count, per_page: calls.body.meta.per_page } : null,
      shape: shape(cl), direction: count(cl.map((c) => c?.direction)), status: count(cl.map((c) => c?.status)),
      missed_reason: count(cl.map((c) => c?.missed_call_reason)), with_recording: cl.filter((c) => c?.recording || c?.asset).length,
      duree_mediane_s: durs.length ? durs[Math.floor(durs.length / 2)] : 0,
      periode: ts.length ? { du: new Date(Math.min(...ts) * 1000).toISOString().slice(0, 10), au: new Date(Math.max(...ts) * 1000).toISOString().slice(0, 10) } : null,
      par_ligne: count(cl.map((c) => String(c?.number?.name || c?.number?.id || "?"))),
      format_numero: count(cl.map((c) => { const d = String(c?.raw_digits || ""); return d.startsWith("+33") ? "+33" : d.startsWith("0") ? "0" : d ? "autre" : "absent"; })),
    };

    // IA Aircall : disponibilité (code HTTP seulement) sur le dernier appel décroché
    const answered = cl.find((c) => c?.answered_at && Number(c?.duration) > 20);
    if (answered?.id) {
      const tr = await get(`/calls/${answered.id}/transcription`);
      const su = await get(`/calls/${answered.id}/summary`);
      report.ia = { transcription_http: tr.status, transcription_dispo: !!tr.body, resume_http: su.status, resume_dispo: !!su.body };
    } else report.ia = { note: "aucun appel décroché de plus de 20 s dans les 50 derniers" };

    return json({ ok: true, report });
  } catch (err) {
    console.error("aircall-sync", (err as Error).message);
    return json({ error: "Erreur serveur" }, 500);
  }
});
