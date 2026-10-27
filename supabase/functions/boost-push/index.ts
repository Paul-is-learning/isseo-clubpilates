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
// Garde-fous : 30 écritures max par passage (10 au plus pour les nouveaux essais) · Boost
// modifié depuis le changement → on n'écrase pas · jamais de recul depuis « client » ·
// un changement = un envoi · réponse temporaire de Boost (429, délai, redirection, coupure
// réseau) → nouvel essai, de plus en plus espacé, abandonné et signalé au 8e échec ·
// création ou RDV accepté (2xx) jamais renvoyé · un passage plus ancien qui marque en
// dernier ne recouvre jamais un passage plus récent (heures d'écriture bqw).
//
// Champs serveur posés sur les fiches (à garder dans BOOST_FIELDS de coach-sync) :
//   bqw = { s, i, r } : heures de nos dernières écritures notées (statut, coordonnées, RDV)
//   bq.n / bq.nx (idem bqi, bnew) : échecs temporaires du changement en cours, prochain essai
//
// POST ?action=run            (planificateur ou Paul)   x-sync-key
// POST ?action=mode&set=…     (Paul uniquement)         x-sync-key = BOOST_SYNC_KEY
// POST ?action=log            (Paul uniquement)         journal des 50 derniers envois
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRow, putRow, rateLimit, safeEq } from "../_shared/store.ts";
import { bqiSig, bqSig, buildOps, identityPatch } from "../boost-sync/sync.ts";

const BASE = "https://www.app-boost.com/api/v1";
const RW: Record<string, string> = { garenne: "BOOST_RW_TOKEN_GARENNE", lattes: "BOOST_RW_TOKEN_LATTES", defense: "BOOST_RW_TOKEN_DEFENSE" };
const MAX_WRITES = 30;
const MAX_RETRY_WRITES = 10; // part du budget ouverte aux nouveaux essais : un envoi bloqué ne prive jamais les nouveaux
const MAX_TRIES = 8;
const MODES = ["simulation", "test", "live"];

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj, null, 1), { status, headers: { "Content-Type": "application/json" } });
}

async function call(token: string, method: string, path: string, body?: unknown) {
  let r: Response;
  try {
    r = await fetch(BASE + path, {
      method, redirect: "manual",
      headers: { Authorization: "Bearer " + token, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch { return { status: 0, data: null }; } // coupure réseau : statut 0, la fiche est réessayée, le passage continue
  // Corps perdu après la réponse : le statut reste connu (un 2xx sur une création veut dire « fait »)
  let txt = "";
  try { txt = await r.text(); } catch { /* corps illisible */ }
  // deno-lint-ignore no-explicit-any
  let data: any = null;
  try { data = JSON.parse(txt)?.data ?? null; } catch { /* corps non JSON */ }
  return { status: r.status, data };
}
const ok2 = (s: number) => s >= 200 && s < 300;
// Réponse temporaire de Boost (réseau, redirection, délai, trop de requêtes, panne) : nouvel essai (voir again).
// Les autres refus (400, 404, 422...) sont définitifs : marqués, avec l'erreur.
const temp = (s: number) => s === 0 || (s >= 300 && s < 400) || s === 408 || s === 425 || s === 429 || s >= 500;
const code = (s: number) => (s === 200 ? "illisible" : s ? String(s) : "réseau");
// Boost horodate aussi nos propres écritures : un statut changé dans Boost avant la fin de notre dernière
// écriture (q.w, marge pour l'écart d'horloge et l'arrondi à la seconde) n'est pas une modification faite dans Boost
const OWN_MARGIN_MS = 5000;
const ownWrite = (sc: string, w: unknown) => { const t = Date.parse(String(w || "")); return !!t && Date.parse(sc) <= t + OWN_MARGIN_MS; };
// deno-lint-ignore no-explicit-any
function editedInBoost(c: any, q: any) {
  const sc = String(c?.status_changed_at || "");
  if (!(sc > String(q.at))) return false;
  return !ownWrite(sc, q.w); // sinon : c'est notre propre écriture
}
// La plus récente de deux heures ISO ("" si aucune)
const later = (a: unknown, b: unknown) => { const x = String(a || ""), y = String(b || ""); return x > y ? x : y; };
// Échec temporaire : nouvel essai, le 1er au passage suivant puis espacé (2, 4, 8... min, 1 h au plus) ;
// au 8e échec, abandon signalé dans le journal et sur la fiche (bqe) jusqu'au prochain changement
// deno-lint-ignore no-explicit-any
function again(entry: { res: string }, n: number, res: any) {
  const t = (n || 0) + 1;
  if (t >= MAX_TRIES) { entry.res += " · abandon après " + t + " essais"; return { ...res, bqe: entry.res }; }
  return { ...res, retry: true, n: t, nx: t < 2 ? "" : new Date(Date.now() + Math.min(2 ** (t - 1), 60) * 60000).toISOString() };
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
    const log0 = log.length; // entrées ajoutées par ce passage = log.slice(log0)

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
    // Veille : la liste n'a pas bougé depuis un passage entièrement traité → rien à envoyer,
    // la grosse ligne n'est même pas lue. Tout écrivain de la liste change sa date (putRow ou
    // écriture conditionnelle), donc aucun changement ne peut passer inaperçu.
    const { data: head, error: herr } = await admin.from("coach_store").select("updated_at").eq("id", "_coach_prospects").maybeSingle();
    if (herr || !head) return json({ error: "Liste des fiches illisible" }, 503);
    // Marqueur de veille rangé à part (_boost_push_rev) : un passage ne réécrit jamais la ligne des réglages pour lui
    const revRow = await getRow(admin, "_boost_push_rev");
    if (revRow.cleanRev && revRow.cleanRev === head.updated_at && url.searchParams.get("force") !== "1") return json({ ok: true, mode, idle: true });
    const { data: row, error: rerr } = await admin.from("coach_store").select("data,updated_at").eq("id", "_coach_prospects").maybeSingle();
    if (rerr || !row) return json({ error: "Liste des fiches illisible" }, 503); // rien n'est noté : le passage suivant reprendra
    const readRev = String(row.updated_at || "");
    // deno-lint-ignore no-explicit-any
    const list: any[] = row?.data?.prospects || [];
    // Budget du passage, commun aux trois étapes : 30 écritures, dont 10 au plus pour les nouveaux essais
    let writes = 0, rwrites = 0;
    const room = (n: number) => writes < MAX_WRITES && (!n || rwrites < MAX_RETRY_WRITES);
    const spend = (n: number) => { writes++; if (n) rwrites++; };
    // Changements à traiter : hors attente d'un nouvel essai (nx), les jamais essayés en premier
    // deno-lint-ignore no-explicit-any
    const due = (arr: any[], k: string) => arr.filter((p) => !(String(p[k].nx || "") > nowIso)).sort((a, b) => (a[k].n || 0) - (b[k].n || 0));
    // Résultat par fiche · at, sig : changement traité · g : heure de lecture du contact Boost · w : heure de notre
    // dernière écriture réussie · rw : heure du RDV créé (bqr) · sc : « modifié dans Boost » vu · retry, n, nx : nouvel essai
    // deno-lint-ignore no-explicit-any
    type Res = Record<string, any>;

    // 0. Prospects créés dans l'outil : créés dans Boost (ou rattachés si le numéro / l'email y existe déjà)
    const CLUB_OF: Record<string, string> = { lagarennecolombes: "garenne", montpellierlattes: "lattes", ladefense: "defense" };
    const skey = (x: unknown) => String(x ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
    const index = await getRow(admin, "_boost_index");
    const ntodo = list.filter((p) => !p?.bid && p.bnew && p.bnews !== p.bnew.at);
    const nresults: Record<string, Res> = {};
    for (const p of due(ntodo, "bnew")) {
      const nb = p.bnew.n || 0;
      if (!room(nb)) continue;
      const club = CLUB_OF[skey(p.studio)] || "";
      const token = Deno.env.get(RW[club] || "") || "";
      const entry = { at: nowIso, mode, fiche: p.id, statut: "création", par: p.bnew.by || "", res: "" };
      if (!token) { entry.res = "pas de token d'écriture pour ce club"; log.push(entry); nresults[p.id] = { at: p.bnew.at, bqe: entry.res }; continue; }
      if (mode === "test" && !/^test\b/i.test(String(p.bnew.nom || "").trim())) { entry.res = "ignoré (mode test : seuls les contacts « TEST… »)"; log.push(entry); nresults[p.id] = { at: p.bnew.at }; continue; }
      const k9 = String(p.bnew.tel || "").replace(/\D/g, "").slice(-9);
      const known = (k9.length === 9 && index?.[club]?.tel?.[k9]) || (p.bnew.email && index?.[club]?.mail?.[String(p.bnew.email).toLowerCase()]) || "";
      if (known) { entry.res = "déjà dans Boost : fiche rattachée, aucun doublon créé"; log.push(entry); nresults[p.id] = { at: p.bnew.at, bid: String(known), club }; continue; }
      const d = String(p.bnew.tel || "").replace(/\D/g, "");
      const phone = d.length === 10 && d.startsWith("0") ? "+33" + d.slice(1) : d ? "+" + d : undefined;
      const payload: Record<string, unknown> = { name: p.bnew.nom, status: "a_traiter", source: p.bnew.source || "autre", ext_lead_id: p.id };
      if (phone) payload.phone = phone;
      if (p.bnew.email) payload.email = p.bnew.email;
      if (mode === "simulation") { entry.res = "simulé : création (" + Object.keys(payload).filter((x) => x !== "ext_lead_id").join(", ") + ")"; log.push(entry); nresults[p.id] = { at: p.bnew.at }; continue; }
      const r = await call(token, "POST", "/contacts", payload);
      spend(nb);
      const nid = r.data?.id ? String(r.data.id) : "";
      if ((r.status === 200 || r.status === 201) && nid) {
        entry.res = r.status === 200 ? "déjà dans Boost (même email) : fiche rattachée" : "créé dans Boost";
        if (p.bnew.note) { await call(token, "PATCH", "/contacts/" + encodeURIComponent(nid), { notes: p.bnew.note }); spend(nb); }
        log.push(entry); nresults[p.id] = { at: p.bnew.at, bid: nid, club };
      } else if (ok2(r.status)) {
        // Accepté par Boost sans identifiant lisible : jamais recréé (pas de doublon), la synchro le relie par son
        // numéro, sinon lien à faire à la main
        entry.res = "création acceptée par Boost, réponse illisible · à vérifier dans Boost"; log.push(entry); nresults[p.id] = { at: p.bnew.at, bqe: entry.res };
      } else {
        entry.res = "création refusée " + code(r.status);
        nresults[p.id] = temp(r.status) ? again(entry, nb, { at: p.bnew.at }) : { at: p.bnew.at, bqe: entry.res };
        log.push(entry);
      }
      await new Promise((res) => setTimeout(res, 120));
    }

    // 1. Coordonnées modifiées dans l'outil (nom, téléphone, email, notes)
    const itodo = list.filter((p) => p?.bid && p.bqi && bqiSig(p.bqi) !== p.bqis);
    const iresults: Record<string, Res> = {};
    for (const p of due(itodo, "bqi")) {
      const ni = p.bqi.n || 0;
      if (!room(ni)) continue;
      const token = Deno.env.get(RW[p.bclub] || "") || "";
      const base = { at: p.bqi.at, sig: bqiSig(p.bqi) };
      const entry = { at: nowIso, mode, fiche: p.id, statut: "coordonnées", par: p.bqi.by || "", res: "" };
      if (!token) { entry.res = "pas de token d'écriture pour ce club"; log.push(entry); iresults[p.id] = { ...base, bqe: entry.res }; continue; }
      const g = new Date().toISOString();
      const got = await call(token, "GET", "/contacts/" + encodeURIComponent(p.bid));
      if (got.status !== 200 || !got.data) { entry.res = "lecture Boost " + code(got.status); iresults[p.id] = got.status === 404 ? { ...base, bqe: entry.res } : again(entry, ni, base); log.push(entry); continue; }
      const c = got.data, seen = { ...base, g };
      if (mode === "test" && !/^test\b/i.test(String(c.name || "").trim())) { entry.res = "ignoré (mode test : seuls les contacts « TEST… »)"; log.push(entry); iresults[p.id] = seen; continue; }
      const patch = identityPatch(p.bqi, c);
      if (!Object.keys(patch).length) { entry.res = "déjà à jour dans Boost"; log.push(entry); iresults[p.id] = seen; continue; }
      if (mode === "simulation") { entry.res = "simulé : champs " + Object.keys(patch).join(", "); log.push(entry); iresults[p.id] = seen; continue; }
      const r = await call(token, "PATCH", "/contacts/" + encodeURIComponent(p.bid), patch);
      spend(ni);
      entry.res = r.status === 200 ? "coordonnées mises à jour (" + Object.keys(patch).join(", ") + ")" : "mise à jour refusée " + code(r.status);
      // w : heure de notre écriture réussie dans Boost (Boost détient alors sig, même si la fiche a changé depuis)
      iresults[p.id] = temp(r.status) ? again(entry, ni, seen)
        : { ...seen, bqe: r.status === 200 ? "" : entry.res, w: r.status === 200 ? new Date().toISOString() : undefined };
      log.push(entry);
      await new Promise((res) => setTimeout(res, 120));
    }

    // 2. Statuts et rappels
    const todo = list.filter((p) => p?.bid && p.bq && bqSig(p.bq) !== p.bqs);
    const results: Record<string, Res> = {};
    for (const p of due(todo, "bq")) {
      const nq = p.bq.n || 0;
      if (!room(nq)) continue;
      const token = Deno.env.get(RW[p.bclub] || "") || "";
      const base = { at: p.bq.at, sig: bqSig(p.bq) };
      const entry = { at: nowIso, mode, fiche: p.id, statut: p.bq.statut, par: p.bq.by || "", res: "" };
      if (!token) { entry.res = "pas de token d'écriture pour ce club"; log.push(entry); results[p.id] = { ...base, bqe: entry.res }; continue; }
      const g = new Date().toISOString();
      const got = await call(token, "GET", "/contacts/" + encodeURIComponent(p.bid));
      if (got.status !== 200 || !got.data) {
        entry.res = "lecture Boost " + code(got.status);
        // 404 : contact supprimé → on n'insiste pas ; autre erreur → nouvel essai
        results[p.id] = got.status === 404 ? { ...base, bqe: entry.res } : again(entry, nq, base);
        log.push(entry);
        continue;
      }
      const c = got.data, seen = { ...base, g };
      if (mode === "test" && !/^test\b/i.test(String(c.name || "").trim())) {
        entry.res = "ignoré (mode test : seuls les contacts « TEST… »)"; log.push(entry); results[p.id] = seen; continue;
      }
      // Boost a changé ce contact après le changement fait dans l'outil (hors notre propre écriture) : Boost reste maître.
      // L'heure vue (sc) est revérifiée au marquage : ce peut être l'écriture d'un autre passage, pas encore notée
      if (editedInBoost(c, p.bq)) {
        entry.res = "ignoré (modifié dans Boost entre-temps)"; log.push(entry); results[p.id] = { ...seen, sc: String(c.status_changed_at || "") }; continue;
      }
      const ops = buildOps(p.bq, c, nowIso, p.bqr);
      if ("skip" in ops) { entry.res = String(ops.skip); log.push(entry); results[p.id] = seen; continue; }
      if (mode === "simulation") {
        entry.res = "simulé : " + JSON.stringify({ patch: ops.patch, rdv: ops.rdv ? { titre: ops.rdv.title, le: ops.rdv.scheduled_at } : null });
        log.push(entry); results[p.id] = seen; continue;
      }
      const out: string[] = [];
      let bqr: string | undefined, w: string | undefined, rw: string | undefined;
      let failed = false;
      if (ops.rdv) {
        const r = await call(token, "POST", "/contacts/" + encodeURIComponent(p.bid) + "/rdv", ops.rdv);
        spend(nq);
        // 2xx : RDV créé, même si la réponse est illisible (jamais de second RDV)
        if (ok2(r.status)) { out.push("RDV créé"); bqr = "essai|" + ops.rdv.scheduled_at; rw = w = new Date().toISOString(); }
        else { out.push("RDV refusé " + code(r.status)); failed = temp(r.status); }
      }
      if (ops.patch) {
        const r = await call(token, "PATCH", "/contacts/" + encodeURIComponent(p.bid), ops.patch);
        spend(nq);
        if (r.status === 200) { out.push("mis à jour (" + Object.keys(ops.patch).join(", ") + ")"); w = new Date().toISOString(); }
        else { out.push("mise à jour refusée " + code(r.status)); failed = failed || temp(r.status); }
      }
      entry.res = out.join(" · ");
      // Nouvel essai : le RDV déjà créé (bqr) et l'heure d'écriture (w) sont quand même notés, jamais de second RDV
      // (part : écriture partielle, une partie faite et l'autre en échec temporaire)
      const res = { ...seen, bqr, w, rw };
      results[p.id] = failed ? again(entry, nq, { ...res, part: !!w }) : { ...res, bqe: /refus/.test(entry.res) ? entry.res : "" };
      log.push(entry);
      await new Promise((r) => setTimeout(r, 120));
    }
    const skipped = Math.max(0, todo.length - Object.keys(results).length);

    // Marquage d'une fiche relue. Garde de fraîcheur : un résultat n'est appliqué que s'il est plus récent que
    // ce qui est déjà noté (bqw, bq.w, bqi.w) ; un passage plus ancien qui marque après un plus récent ne
    // recule jamais bqs, bqr ni l'heure d'écriture (sinon double envoi ou changement perdu)
    // deno-lint-ignore no-explicit-any
    const mark = (p: any) => {
      // deno-lint-ignore no-explicit-any
      let n: any = p;
      const set = () => (n === p ? (n = { ...p }) : n);
      const bw = { ...(p?.bqw || {}) };
      let bwc = false;
      const r = results[p?.id], ir = iresults[p?.id], nr = nresults[p?.id];
      if (r && p.bq) {
        // Fiche changée depuis la lecture (correction rapide) : si Boost a été entièrement écrit, on note ce qu'il
        // détient (bqs), la nouvelle valeur reste en file et lui sera comparée ; sans écriture, rien n'est noté
        const same = p.bq.at === r.at, W = later(bw.s, p.bq.w);
        // Sans écriture : constat fait avant une écriture notée depuis, ou « modifié dans Boost » qui était
        // l'écriture d'un autre passage → rien n'est noté, le passage suivant revoit la fiche
        const fresh = r.w ? !(W && r.w <= W) : same && !(r.g && W > r.g) && !(r.sc && ownWrite(r.sc, p.bq.w));
        if (fresh) {
          const q = { ...p.bq };
          // Écriture partielle (RDV créé, statut en échec temporaire) : jamais notée comme envoi complet ;
          // abandonnée au 8e échec, elle n'est notée que si la fiche n'a pas changé depuis
          if (!r.retry && (same || !r.part)) { set().bqs = r.sig; if (r.bqe !== undefined) n.bqe = r.bqe; }
          // Heure de notre écriture : dans bq (recopiée par coach-sync, remplacée au changement suivant) et dans bqw
          if (r.w) { q.w = r.w; bw.s = r.w; bwc = true; }
          if (r.retry && same) { q.n = Math.max(q.n || 0, r.n); q.nx = r.nx; }
          if (r.w || (r.retry && same)) set().bq = q;
        }
        // RDV créé : noté s'il est le plus récent (jamais de second RDV)
        if (r.bqr && !(bw.r && r.rw <= bw.r)) { set().bqr = r.bqr; bw.r = r.rw; bwc = true; }
      }
      if (ir && p.bqi) {
        const same = p.bqi.at === ir.at, W = later(bw.i, p.bqi.w);
        if (ir.w ? !(W && ir.w <= W) : same && !(ir.g && W > ir.g)) {
          const q = { ...p.bqi };
          if (!ir.retry) { set().bqis = ir.sig; if (ir.bqe) n.bqe = ir.bqe; }
          if (ir.w) { q.w = ir.w; bw.i = ir.w; bwc = true; }
          if (ir.retry && same) { q.n = Math.max(q.n || 0, ir.n); q.nx = ir.nx; }
          if (ir.w || (ir.retry && same)) set().bqi = q;
        }
      }
      // Contact créé ou rattaché dans Boost : toujours lié, même si la demande a changé depuis (jamais de doublon)
      if (nr && p.bnew && !p.bid) {
        if (!nr.retry && (p.bnew.at === nr.at || nr.bid)) {
          set().bnews = nr.at;
          if (nr.bid) { n.bid = nr.bid; n.bclub = nr.club; n.bst = "a_traiter"; }
          if (nr.bqe) n.bqe = nr.bqe;
        } else if (nr.retry && p.bnew.at === nr.at) set().bnew = { ...p.bnew, n: Math.max(p.bnew.n || 0, nr.n), nx: nr.nx };
      }
      if (bwc) set().bqw = bw;
      return n;
    };

    // Marquer les envois sur les fiches · écriture atomique, réessayée si un téléphone écrit au même moment
    const nres = Object.keys(results).length + Object.keys(iresults).length + Object.keys(nresults).length;
    // Version « propre » : la liste telle qu'elle est après ce passage, seulement si personne
    // d'autre ne l'a modifiée entre la lecture et le marquage (sinon : pas de veille, on repasse)
    let cleanRev: string | null = nres ? null : readRev;
    for (let attempt = 0; attempt < 4 && nres; attempt++) {
      const { data: cur } = await admin.from("coach_store").select("data,updated_at").eq("id", "_coach_prospects").maybeSingle();
      let dirty = false;
      // deno-lint-ignore no-explicit-any
      const plist: any[] = (cur?.data?.prospects || []).map((p: any) => { const n = mark(p); if (n !== p) dirty = true; return n; });
      if (!dirty) break; // rien à noter (résultats dépassés par un passage plus récent) : aucune écriture
      const { data: upd } = await admin.from("coach_store")
        .update({ data: { ...(cur?.data || {}), prospects: plist }, updated_at: new Date().toISOString() })
        .eq("id", "_coach_prospects").eq("updated_at", cur?.updated_at).select("id,updated_at");
      if (upd && upd.length) { if (attempt === 0 && cur?.updated_at === readRev) cleanRev = String(upd[0].updated_at || "") || null; break; }
      await new Promise((r) => setTimeout(r, 300));
    }
    // Tout est traité (aucun report, aucun nouvel essai, rien en attente) : la version propre est notée pour la veille
    const fin = (m: Record<string, Res>) => Object.values(m).filter((x) => !x.retry).length;
    const left = (ntodo.length - fin(nresults)) + (itodo.length - fin(iresults)) + (todo.length - fin(results));
    const nextClean = !left && cleanRev ? cleanRev : null;
    if (Object.keys(results).length || Object.keys(iresults).length || Object.keys(nresults).length) {
      // Journal fusionné sur une relecture fraîche, sans réécrire le mode : un changement de mode fait pendant le passage est conservé
      const fresh = await getRow(admin, "_boost_push");
      const newLog = log.slice(log0);
      await putRow(admin, "_boost_push", { ...fresh, log: [...(Array.isArray(fresh.log) ? fresh.log : []), ...newLog].slice(-200), last: nowIso });
    }
    if ((revRow.cleanRev || null) !== nextClean) await putRow(admin, "_boost_push_rev", { cleanRev: nextClean, at: nowIso });
    return json({ ok: true, mode, creations: Object.keys(nresults).length, coordonnees: Object.keys(iresults).length, en_file: todo.length, traites: Object.keys(results).length, ecritures: writes, reportes: skipped });
  } catch (err) {
    console.error("boost-push", (err as Error).message);
    return json({ error: "Erreur serveur" }, 500);
  }
});
