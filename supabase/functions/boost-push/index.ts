// ═══════════════════════════════════════════════════════════════════════════
// Edge Function — boost-push (Sales Coach → Fitness Boost, ÉCRITURE)
// ═══════════════════════════════════════════════════════════════════════════
// Seule fonction à détenir les tokens d'écriture (BOOST_RW_TOKEN_<CLUB>).
// Elle lit les changements mis en file par coach-sync sur les fiches liées à
// Boost (p.bq : statut, rappel) et les écrit dans Boost :
//   Contacté / RDV planifié (+ date de relance) / Séance d'essai (RDV) /
//   RDV venu / Client / Perdu. Jamais de fiche, note, transcription ni santé.
//
// Trois modes, stockés dans coach_store `_boost_push` (défaut : simulation)
//   simulation : rien n'est envoyé, le journal dit ce qui l'aurait été
//   test       : n'écrit que pour les contacts Boost dont le nom commence par « TEST »
//   live       : écrit pour tous
// Garde-fous : 30 écritures max par passage · Boost modifié depuis le changement
// → on n'écrase pas · jamais de recul depuis « client » · un changement = un envoi.
//
// POST ?action=run            (planificateur ou Paul)   x-sync-key
// POST ?action=mode&set=…     (Paul uniquement)         x-sync-key = BOOST_SYNC_KEY
// POST ?action=log            (Paul uniquement)         journal des 50 derniers envois
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRow, putRow, rateLimit, safeEq } from "../_shared/store.ts";
import { bqSig, buildOps } from "../boost-sync/sync.ts";

const BASE = "https://www.app-boost.com/api/v1";
const RW: Record<string, string> = { garenne: "BOOST_RW_TOKEN_GARENNE", lattes: "BOOST_RW_TOKEN_LATTES", defense: "BOOST_RW_TOKEN_DEFENSE" };
const MAX_WRITES = 30;
const MODES = ["simulation", "test", "live"];

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj, null, 1), { status, headers: { "Content-Type": "application/json" } });
}

async function call(token: string, method: string, path: string, body?: unknown) {
  const r = await fetch(BASE + path, {
    method, redirect: "manual",
    headers: { Authorization: "Bearer " + token, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await r.text();
  // deno-lint-ignore no-explicit-any
  let data: any = null;
  try { data = JSON.parse(txt)?.data ?? null; } catch { /* corps non JSON */ }
  return { status: r.status, data };
}

serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST attendu" }, 405);
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const rl = await rateLimit(admin, req);
    if (rl.blocked) return json({ error: "Trop d'essais · réessayez dans 15 minutes" }, 429);
    const key = Deno.env.get("BOOST_SYNC_KEY") || "";
    if (key.length < 24) return json({ error: "BOOST_SYNC_KEY non configuré" }, 500);
    const given = req.headers.get("x-sync-key") || "";
    const { data: cron } = await admin.from("coach_store").select("data").eq("id", "_boost_cron").maybeSingle();
    const cronKey = String(cron?.data?.key || "");
    const isPaul = safeEq(given, key);
    if (!isPaul && !(cronKey.length >= 32 && safeEq(given, cronKey))) { await rl.fail(); return json({ error: "Clé invalide" }, 401); }
    await rl.ok();

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "";
    const cfg = await getRow(admin, "_boost_push");
    const mode = MODES.includes(cfg.mode) ? cfg.mode : "simulation";
    // deno-lint-ignore no-explicit-any
    const log: any[] = Array.isArray(cfg.log) ? cfg.log : [];

    if (action === "mode") {
      if (!isPaul) return json({ error: "Réservé à Paul" }, 403);
      const set = url.searchParams.get("set") || "";
      if (!MODES.includes(set)) return json({ error: "mode attendu : " + MODES.join(", ") }, 400);
      await putRow(admin, "_boost_push", { ...cfg, mode: set, modeAt: new Date().toISOString() });
      return json({ ok: true, mode: set });
    }
    if (action === "log") {
      if (!isPaul) return json({ error: "Réservé à Paul" }, 403);
      return json({ ok: true, mode, log: log.slice(-50) });
    }
    if (action !== "run") return json({ error: "Action inconnue" }, 400);

    const nowIso = new Date().toISOString();
    const { data: row } = await admin.from("coach_store").select("data").eq("id", "_coach_prospects").maybeSingle();
    // deno-lint-ignore no-explicit-any
    const list: any[] = row?.data?.prospects || [];
    const todo = list.filter((p) => p?.bid && p.bq && bqSig(p.bq) !== p.bqs);
    // deno-lint-ignore no-explicit-any
    const results: Record<string, { at: string; sig: string; bqr?: string; bqe?: string; retry?: boolean }> = {};
    let writes = 0;
    for (const p of todo) {
      if (writes >= MAX_WRITES) break;
      const token = Deno.env.get(RW[p.bclub] || "") || "";
      const sig = bqSig(p.bq);
      const entry = { at: nowIso, mode, fiche: p.id, statut: p.bq.statut, par: p.bq.by || "", res: "" };
      if (!token) { entry.res = "pas de token d'écriture pour ce club"; log.push(entry); results[p.id] = { at: p.bq.at, sig, bqe: entry.res }; continue; }
      const got = await call(token, "GET", "/contacts/" + encodeURIComponent(p.bid));
      if (got.status !== 200 || !got.data) {
        entry.res = "lecture Boost " + got.status;
        log.push(entry);
        // 404 : contact supprimé → on n'insiste pas ; autre erreur → nouvel essai au prochain passage
        results[p.id] = got.status === 404 ? { at: p.bq.at, sig, bqe: entry.res } : { at: p.bq.at, sig, retry: true };
        continue;
      }
      const c = got.data;
      if (mode === "test" && !/^test\b/i.test(String(c.name || "").trim())) {
        entry.res = "ignoré (mode test : seuls les contacts « TEST… »)"; log.push(entry); results[p.id] = { at: p.bq.at, sig }; continue;
      }
      // Boost a changé ce contact après le changement fait dans l'outil : Boost reste maître
      if (String(c.status_changed_at || "") > String(p.bq.at)) {
        entry.res = "ignoré (modifié dans Boost entre-temps)"; log.push(entry); results[p.id] = { at: p.bq.at, sig }; continue;
      }
      const ops = buildOps(p.bq, c, nowIso, p.bqr);
      if ("skip" in ops) { entry.res = String(ops.skip); log.push(entry); results[p.id] = { at: p.bq.at, sig }; continue; }
      if (mode === "simulation") {
        entry.res = "simulé : " + JSON.stringify({ patch: ops.patch, rdv: ops.rdv ? { titre: ops.rdv.title, le: ops.rdv.scheduled_at } : null });
        log.push(entry); results[p.id] = { at: p.bq.at, sig }; continue;
      }
      const out: string[] = [];
      let bqr: string | undefined;
      let failed = false;
      if (ops.rdv) {
        const r = await call(token, "POST", "/contacts/" + encodeURIComponent(p.bid) + "/rdv", ops.rdv);
        writes++;
        if (r.status === 200 || r.status === 201) { out.push("RDV créé"); bqr = "essai|" + ops.rdv.scheduled_at; }
        else { out.push("RDV refusé " + r.status); failed = r.status >= 500; }
      }
      if (ops.patch) {
        const r = await call(token, "PATCH", "/contacts/" + encodeURIComponent(p.bid), ops.patch);
        writes++;
        if (r.status === 200) out.push("mis à jour (" + Object.keys(ops.patch).join(", ") + ")");
        else { out.push("mise à jour refusée " + r.status); failed = failed || r.status >= 500; }
      }
      entry.res = out.join(" · ");
      log.push(entry);
      results[p.id] = failed ? { at: p.bq.at, sig, retry: true } : { at: p.bq.at, sig, bqr, bqe: /refus/.test(entry.res) ? entry.res : "" };
      await new Promise((r) => setTimeout(r, 120));
    }
    const skipped = Math.max(0, todo.length - Object.keys(results).length);

    // Marquer les envois sur les fiches · écriture atomique, réessayée si un téléphone écrit au même moment
    const ids = Object.keys(results).filter((id) => !results[id].retry);
    for (let attempt = 0; attempt < 4 && ids.length; attempt++) {
      const { data: cur } = await admin.from("coach_store").select("data,updated_at").eq("id", "_coach_prospects").maybeSingle();
      // deno-lint-ignore no-explicit-any
      const plist: any[] = (cur?.data?.prospects || []).map((p: any) => {
        const r = results[p?.id];
        if (!r || r.retry || !p.bq || p.bq.at !== r.at) return p; // changé depuis : sera traité au prochain passage
        const n = { ...p, bqs: r.sig };
        if (r.bqr) n.bqr = r.bqr;
        if (r.bqe !== undefined) n.bqe = r.bqe;
        return n;
      });
      const { data: upd } = await admin.from("coach_store")
        .update({ data: { ...(cur?.data || {}), prospects: plist }, updated_at: new Date().toISOString() })
        .eq("id", "_coach_prospects").eq("updated_at", cur?.updated_at).select("id");
      if (upd && upd.length) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    if (Object.keys(results).length) await putRow(admin, "_boost_push", { ...cfg, mode, log: log.slice(-200), last: nowIso });
    return json({ ok: true, mode, en_file: todo.length, traites: Object.keys(results).length, ecritures: writes, reportes: skipped });
  } catch (err) {
    console.error("boost-push", (err as Error).message);
    return json({ error: "Erreur serveur" }, 500);
  }
});
