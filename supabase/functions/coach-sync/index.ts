// ═══════════════════════════════════════════════════════════════════════════
// Edge Function — coach-sync (v2 : invitations nominatives)
// ═══════════════════════════════════════════════════════════════════════════
// Stockage central des prospects du CP Sales Coach, SANS compte Supabase pour
// les salariés. Deux niveaux d'accès :
//  - COACH_CODE (secret)      → rôle "admin" (Paul) : tout + gestion équipe
//  - code d'invitation perso  → rôle "rep" : prospects uniquement
// Les invitations vivent dans la ligne `_coach_access` de `studios`, les
// prospects dans `_coach_prospects`. Rien d'autre n'est accessible par ce
// chemin — jamais de JWT, donc jamais d'accès au reste de la table.
//
// Body: { code, action, ... }
//  - ping                     : valide le code → { ok, role, rep }
//  - pull | push | delete     : prospects (admin + rep)
//  - team_list                : admin — liste des invitations (avec codes)
//  - team_add { nom }         : admin — crée une invitation, code généré
//  - team_toggle { id, actif }: admin — suspend / réactive
//  - team_del { id }          : admin — supprime l'invitation
//
// Déployée avec --no-verify-jwt. Secret : COACH_CODE (= code maître admin).
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRow, putRow, rateLimit, safeEq } from "../_shared/store.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const ROW_PROSPECTS = "_coach_prospects";
const ROW_ACCESS = "_coach_access";
const ROW_STATS = "_coach_stats";
const ROW_IC = "_ic_data";
const ROW_TRAIN = "_training";
const MAX_IC = 8000;
const MAX_EVENTS = 20000;
const EV_TYPES = ["appel", "essai", "venu", "abo", "perdu"];
const DEFAULT_PRIMES: Record<string, number> = { "1": 10, "2": 25, "3": 50 };
const MAX_PROSPECTS = 5000;
const MAX_INVITES = 50;
// Champs maîtres venus de Fitness Boost (boost-sync) : jamais acceptés depuis un téléphone,
// toujours recopiés depuis la fiche serveur. Sur une fiche liée (bid), nom, tel et commercial
// appartiennent aussi à Boost.
const BOOST_FIELDS = ["bid", "bclub", "bst", "bupd", "email", "src", "bnotes", "bnok", "bclient", "cPhone", "cSms", "cEmail", "cWa", "brap", "bsync", "bset", "bentry", "bq", "bqs", "bqr", "bqe", "bmember"];
// deno-lint-ignore no-explicit-any
function keepBoost(clean: any, ex: any) {
  if (!ex) return;
  for (const f of BOOST_FIELDS) if (f in ex) clean[f] = ex[f];
  if (ex.bid) { clean.nom = ex.nom; clean.tel = ex.tel; clean.rep = String(ex.rep || ""); }
  // Statut changé depuis l'outil : il n'est plus « posé par Boost »
  if (ex.bset && clean.statut !== ex.statut) clean.bset = false;
}
// Changement fait dans l'outil sur une fiche Boost (statut, rappel) : mis en file pour boost-push,
// qui l'écrira dans Boost (bq = à envoyer, bqs = signature du dernier envoi)
// deno-lint-ignore no-explicit-any
function markBq(next: any, ex: any, by: string) {
  if (!ex?.bid) return;
  if (next.statut === ex.statut && String(next.rappel || "") === String(ex.rappel || "") && String(next.rappelH || "") === String(ex.rappelH || "")) return;
  next.bq = { statut: next.statut, rappel: String(next.rappel || ""), rappelH: String(next.rappelH || ""), at: new Date().toISOString(), by: String(by || "").slice(0, 60) };
}
// Refus d'appel noté dans Boost : le numéro ne quitte jamais le serveur
// deno-lint-ignore no-explicit-any
const outP = (p: any) => (p && p.cPhone === false ? { ...p, tel: "", noCall: true } : p);

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
// Saisie tolérante au téléphone : casse, espaces, tiret oublié, O/0 et I/1 confondus
// (« n0ah 1234 » = « NOAH-1234 »). Appliqué aux deux côtés de chaque comparaison.
const norm = (s: unknown) =>
  String(s ?? "").toUpperCase().replace(/[\s-]/g, "").replace(/0/g, "O").replace(/1/g, "I");

// Codes d'invitation : PRÉNOM-XXXX-XXXX, tirage cryptographique, alphabet sans
// caractères ambigus (ni 0/O ni 1/I/L) · ~8·10¹¹ combinaisons par prénom.
const CODE_ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function randChunk(n: number) {
  const b = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(b, (x) => CODE_ABC[x % CODE_ABC.length]).join("");
}
function genCode(nom: string, taken: (c: string) => boolean): string {
  const base = String(nom || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 8) || "CP";
  for (let t = 0; t < 20; t++) {
    const c = base + "-" + randChunk(4) + "-" + randChunk(4);
    if (!taken(c)) return c;
  }
  return "";
}
const DENIED = "Code invalide, ou déjà utilisé sur un autre appareil · voir le responsable";

// ── Page Intro Class d'isseo : gérant connecté (jeton Supabase), jamais de code ──
// Renvoie le planning IC, le journal des ventes et l'équipe SANS les codes ni
// les appareils. Le barème ne s'écrit qu'avec un profil isseo administrateur.
// deno-lint-ignore no-explicit-any
async function isseoIC(admin: any, req: Request, body: any, action: string) {
  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: u } = await admin.auth.getUser(jwt);
  const uid = u?.user?.id;
  if (!uid) return json({ error: "Session isseo requise" }, 401);
  const { data: prof } = await admin.from("profiles").select("role").eq("id", uid).maybeSingle();
  if (!prof) return json({ error: "Accès refusé" }, 403);
  const ic = await getRow(admin, ROW_IC);
  if (action === "isseo_ic_bareme") {
    if (prof.role !== "admin") return json({ error: "Réservé aux administrateurs" }, 403);
    const b = body.bareme || {};
    const clean = {
      id: "bar_" + Date.now(),
      effet: String(b.effet || new Date().toISOString().slice(0, 10)).slice(0, 10),
      coach: Math.max(0, Math.min(1000, Number(b.coach) || 0)),
      p1: Math.max(0, Math.min(1000, Number(b.p1) || 0)),
      p2: Math.max(0, Math.min(1000, Number(b.p2) || 0)),
      p3: Math.max(0, Math.min(1000, Number(b.p3) || 0)),
    };
    // deno-lint-ignore no-explicit-any
    ic.baremes = [...(ic.baremes || []), clean].sort((a: any, b2: any) => (a.effet < b2.effet ? -1 : 1));
    await putRow(admin, ROW_IC, ic);
  }
  const st = await getRow(admin, ROW_STATS);
  const acc = await getRow(admin, ROW_ACCESS);
  // deno-lint-ignore no-explicit-any
  const invites = ((acc.invites as any[]) || []).map((i) => ({
    nom: String(i?.nom || ""), studio: String(i?.studio || ""), actif: i?.actif !== false, nocom: i?.nocom === true, coach: i?.coach === true,
  }));
  return json({ ok: true, slots: ic.slots || [], sessions: ic.sessions || [], baremes: ic.baremes || [], events: st.events || [], invites });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body = await req.json();
    const { code, action } = body;

    const COACH_CODE = Deno.env.get("COACH_CODE");
    if (!COACH_CODE) return json({ error: "COACH_CODE non configuré" }, 500);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (action === "isseo_ic" || action === "isseo_ic_bareme") return await isseoIC(admin, req, body, action);

    // ── Limite d'essais : 8 échecs en 15 min depuis une même adresse → blocage 15 min ──
    const rl = await rateLimit(admin, req);
    if (rl.blocked) return json({ error: "Trop d'essais · réessayez dans 15 minutes" }, 429);

    // ── Résolution du code : maître ou invitation active ──
    const accRow = { data: await getRow(admin, ROW_ACCESS) };
    let invites: any[] = (accRow?.data?.invites as any[]) || [];
    let primes: Record<string, number> = { ...DEFAULT_PRIMES, ...((accRow?.data?.primes as Record<string, number>) || {}) };
    const saveInvites = () =>
      putRow(admin, ROW_ACCESS, { invites, primes, adminAvatar: accRow?.data?.adminAvatar ?? null });

    let role = "";
    let rep = "";
    let mgr = false;
    if (norm(code) && safeEq(norm(code), norm(COACH_CODE))) {
      role = "admin";
      mgr = true;
    } else {
      const inv = invites.find((i) => i && i.actif !== false && norm(i.code) === norm(code));
      if (inv) {
        // 1 code = 1 appareil : le premier appareil qui utilise le code le réclame ;
        // tout autre appareil est refusé (l'admin peut libérer via team_device_reset).
        // Identifiant d'appareil obligatoire (sinon le verrou se contournait en l'omettant),
        // et même réponse qu'un code faux : rien n'indique de l'extérieur qu'un code existe.
        const dev = String(body.device || "").slice(0, 80);
        if (!dev || (inv.device && inv.device !== dev)) { await rl.fail(); return json({ error: DENIED }, 401); }
        if (!inv.device) { inv.device = dev; inv.deviceAt = new Date().toISOString(); await saveInvites(); }
        role = "rep";
        rep = String(inv.nom || "");
        mgr = inv.manager === true;
        if (action === "ping") { inv.lastSeen = new Date().toISOString(); await saveInvites(); }
      }
    }
    if (!role) { await rl.fail(); return json({ error: DENIED }, 401); }
    await rl.ok();

    let myAvatar = "";
    let myStudio = "";
    if (role === "admin") myAvatar = String(accRow?.data?.adminAvatar?.avatar || "");
    else { const inv = invites.find((i) => norm(i.code) === norm(code)); myAvatar = String(inv?.avatar || ""); myStudio = String(inv?.studio || ""); }

    // ── Cloisonnement par studio ──
    // Code maître : tous les studios. Salarié / recruteur : uniquement le studio de son
    // invitation (lecture ET écriture). Invitation sans studio (héritage) : accès complet,
    // signalé dans Équipe pour être corrigé.
    const sk = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
    const STUDIOS = ["La Garenne-Colombes", "Montpellier Lattes", "La Défense"];
    const canon = (s: unknown) => {
      const k = sk(s);
      if (!k) return "";
      return STUDIOS.find((x) => sk(x) === k) || (k.length >= 5 ? STUDIOS.find((x) => sk(x).includes(k) || k.includes(sk(x))) : "") || "";
    };
    if (myStudio && canon(myStudio)) myStudio = canon(myStudio);
    const scoped = role !== "admin" && !!sk(myStudio);
    const inMine = (x: any) => !scoped || sk(x?.studio) === sk(myStudio);
    // Élément envoyé par un salarié cloisonné : toujours estampillé à SON studio (jamais refusé
    // en silence, sinon la fiche ou la vente serait perdue) ; modifier un élément existant d'un
    // autre studio reste interdit (garde « i >= 0 && !inMine(existant) » à chaque écriture).
    // existing = la version serveur de l'élément (si elle existe) : une copie sans studio ou mal
    // orthographiée n'efface jamais le studio déjà connu ; un élément neuf n'est jamais orphelin.
    const ownStudio = (x: any, existing?: any) => {
      if (scoped) { x.studio = myStudio; return true; }
      x.studio = canon(x?.studio) || canon(existing?.studio) || String(existing?.studio || "") || STUDIOS[0];
      return true;
    };

    if (action === "ping") return json({ ok: true, role, rep, manager: mgr, primes, avatar: myAvatar, studio: myStudio, scoped });

    // ── Avatars : chacun définit le sien, tout le monde voit ceux des autres ──
    if (action === "avatar_set") {
      const av = String(body.avatar || "");
      const okI = av.startsWith("I|") && av.length < 20 && /^[\w-]+$/.test(av.slice(2));
      if (av && !okI && !(av.startsWith("E|") && av.length < 40) && !(av.startsWith("P|data:image/") && av.length <= 14000))
        return json({ error: "Avatar invalide" }, 400);
      if (role === "admin") {
        (accRow?.data || {});
        const adminAvatar = av ? { nom: String(body.nom || "").slice(0, 60), avatar: av } : null;
        await putRow(admin, ROW_ACCESS, { invites, primes, adminAvatar });
      } else {
        const inv = invites.find((i) => norm(i.code) === norm(code));
        if (inv) { inv.avatar = av; await saveInvites(); }
      }
      return json({ ok: true });
    }

    if (action === "avatars") {
      const map: Record<string, string> = {};
      const putKey = (nom: unknown, avatar: string) => {
        const first = String(nom || "").trim().split(" ")[0].toLowerCase();
        if (!first || !avatar) return;
        map[first] = avatar;
        const plain = first.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (plain && plain !== first) map[plain] = avatar;
      };
      for (const i of invites) if (i.avatar) putKey(i.nom, String(i.avatar));
      const aa = accRow?.data?.adminAvatar;
      if (aa && aa.avatar) putKey(aa.nom, String(aa.avatar));
      return json({ ok: true, avatars: map });
    }

    // ── Journal de performance (immuable : les stats survivent aux fiches) ──
    // ── Intro Class : _ic_data = { slots, sessions, baremes } ──
    if (action === "ic_pull" || action === "ic_push" || action === "ic_del" || action === "ic_bareme_set") {
      const icRow = { data: await getRow(admin, ROW_IC) };
      const ic = icRow?.data || {};
      let slots: any[] = ic.slots || [];
      let sessions: any[] = ic.sessions || [];
      let baremes: any[] = ic.baremes || [];
      let coachs: any[] = ic.coachs || [];
      const saveIC = () =>
        putRow(admin, ROW_IC, { slots, sessions, baremes, coachs });

      const icOut = () => json({ ok: true, slots: slots.filter(inMine), sessions: sessions.filter(inMine), baremes, coachs: coachs.filter(inMine) });
      if (action === "ic_pull") return icOut();

      if (action === "ic_bareme_set") {
        if (role !== "admin") return json({ error: "Réservé au responsable" }, 403);
        const b = body.bareme || {};
        const clean = {
          id: "bar_" + Date.now(),
          effet: String(b.effet || new Date().toISOString().slice(0, 10)).slice(0, 10),
          coach: Math.max(0, Math.min(1000, Number(b.coach) || 0)),
          p1: Math.max(0, Math.min(1000, Number(b.p1) || 0)),
          p2: Math.max(0, Math.min(1000, Number(b.p2) || 0)),
          p3: Math.max(0, Math.min(1000, Number(b.p3) || 0)),
        };
        baremes.push(clean);
        baremes.sort((a, b2) => (a.effet < b2.effet ? -1 : 1));
        await saveIC();
        return json({ ok: true, baremes });
      }

      if (action === "ic_push") {
        const inSlots: any[] = Array.isArray(body.slots) ? body.slots : [];
        const inSess: any[] = Array.isArray(body.sessions) ? body.sessions : [];
        for (const s of inSlots) {
          if (!s || !s.id) continue;
          const clean = { id: String(s.id).slice(0, 60), studio: String(s.studio || "").slice(0, 60),
            jour: Math.max(0, Math.min(6, Number(s.jour) || 0)), heure: String(s.heure || "").slice(0, 5),
            coach: String(s.coach || "").slice(0, 60), actif: s.actif !== false,
            maj: String(s.maj || new Date().toISOString()) };
          const i = slots.findIndex((x) => x.id === clean.id);
          if (i >= 0 && !inMine(slots[i])) continue;
          ownStudio(clean, i >= 0 ? slots[i] : null);
          if (i < 0) slots.push(clean); else if ((clean.maj || "") >= (slots[i].maj || "")) slots[i] = clean;
        }
        for (const s of inSess) {
          if (!s || !s.id) continue;
          const clean = { id: String(s.id).slice(0, 60), studio: String(s.studio || "").slice(0, 60),
            date: String(s.date || "").slice(0, 10), heure: String(s.heure || "").slice(0, 5),
            coach: String(s.coach || "").slice(0, 60),
            statut: ["prevue", "faite", "annulee"].includes(String(s.statut)) ? String(s.statut) : "prevue",
            booked: Math.max(0, Math.min(99, Number(s.booked) || 0)),
            show: Math.max(0, Math.min(99, Number(s.show) || 0)),
            maj: String(s.maj || new Date().toISOString()) };
          const i = sessions.findIndex((x) => x.id === clean.id);
          if (i >= 0 && !inMine(sessions[i])) continue;
          ownStudio(clean, i >= 0 ? sessions[i] : null);
          if (i < 0) sessions.push(clean); else if ((clean.maj || "") >= (sessions[i].maj || "")) sessions[i] = clean;
        }
        const inCoachs: any[] = Array.isArray(body.coachs) ? body.coachs : [];
        for (const c of inCoachs) {
          if (!c || !c.id || !c.nom) continue;
          const clean = { id: String(c.id).slice(0, 60), nom: String(c.nom).slice(0, 60),
            studio: String(c.studio || "").slice(0, 60), maj: String(c.maj || new Date().toISOString()) };
          const i = coachs.findIndex((x) => x.id === clean.id);
          if (i >= 0 && !inMine(coachs[i])) continue;
          ownStudio(clean, i >= 0 ? coachs[i] : null);
          if (i < 0) coachs.push(clean); else if ((clean.maj || "") >= (coachs[i].maj || "")) coachs[i] = clean;
        }
        if (coachs.length > 200) coachs = coachs.slice(-200);
        if (sessions.length > MAX_IC) sessions = sessions.slice(-MAX_IC);
        await saveIC();
        return icOut();
      }

      if (action === "ic_del") {
        if (role !== "admin" && !mgr) return json({ error: "Réservé aux recruteurs" }, 403);
        const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
        const keep = (x: any) => !ids.includes(x.id) || !inMine(x);
        slots = slots.filter(keep);
        sessions = sessions.filter(keep);
        coachs = coachs.filter(keep);
        await saveIC();
        return icOut();
      }
    }

    // ── Formation : scores du parcours de cas pratiques, par salarié ──
    // Le serveur attribue le score au code CONNECTÉ (un salarié ne peut pas
    // valider la formation d'un autre). Meilleur score conservé.
    if (action === "train_push" || action === "train_pull" || action === "train_del") {
      const tRow = { data: await getRow(admin, ROW_TRAIN) };
      const map: Record<string, Record<string, { s: number; ts: string }>> = (tRow?.data?.map as any) || {};

      if (action === "train_del") {
        if (role !== "admin") return json({ error: "Réservé au responsable" }, 403);
        const who = String(body.who || "").trim().toLowerCase();
        if (who && map[who]) delete map[who];
        await putRow(admin, ROW_TRAIN, { map });
        return json({ ok: true, map });
      }

      if (action === "train_push") {
        const who = (role === "admin" ? String(body.nom || "admin") : rep).trim().split(" ")[0].toLowerCase();
        const scen = String(body.scen || "").slice(0, 24);
        const score = Math.max(0, Math.min(100, Math.round(Number(body.score) || 0)));
        if (!who || !scen) return json({ error: "Scénario manquant" }, 400);
        map[who] = map[who] || {};
        const prev = map[who][scen];
        if (!prev || score > prev.s) map[who][scen] = { s: score, ts: new Date().toISOString() };
        await putRow(admin, ROW_TRAIN, { map });
      }
      return json({ ok: true, map });
    }

    if (action === "stats_del") {
      if (role !== "admin" && !mgr) return json({ error: "Réservé aux recruteurs" }, 403);
      const stRow = { data: await getRow(admin, ROW_STATS) };
      let events: any[] = (stRow?.data?.events as any[]) || [];
      const ks: string[] = Array.isArray(body.ks) ? body.ks.map(String) : [];
      const pfx = String(body.prefix || "");
      events = events.filter((e) => !inMine(e) || (!ks.includes(e.k) && !(pfx && String(e.k).startsWith(pfx))));
      await putRow(admin, ROW_STATS, { events });
      return json({ ok: true, events: events.filter(inMine) });
    }

    if (action === "stats_pull" || action === "stats_push") {
      const stRow = { data: await getRow(admin, ROW_STATS) };
      let events: any[] = (stRow?.data?.events as any[]) || [];

      if (action === "stats_push") {
        const incoming: any[] = Array.isArray(body.events) ? body.events : [];
        for (const e of incoming) {
          if (!e || !e.k || !EV_TYPES.includes(String(e.type))) continue;
          const clean = {
            k: String(e.k).slice(0, 80), type: String(e.type),
            rep: String(e.rep || rep).slice(0, 60), nom: String(e.nom || "").slice(0, 80),
            pack: String(e.pack || "").slice(0, 2),
            v2: String(e.v2 || "").slice(0, 60),
            fullCom: e.fullCom === true,
            icId: String(e.icId || "").slice(0, 60),
            studio: String(e.studio || "").slice(0, 60),
            prime: Math.max(0, Math.min(1000, Number(e.prime) || 0)),
            dur: Math.max(0, Math.min(14400, Math.round(Number(e.dur) || 0))),
            ts: String(e.ts || new Date().toISOString()),
          };
          const i = events.findIndex((x) => x.k === clean.k);
          if (i >= 0 && !inMine(events[i])) continue;
          ownStudio(clean, i >= 0 ? events[i] : null);
          if (i < 0) events.push(clean);
          else if ((clean.ts || "") >= (events[i].ts || "")) events[i] = clean;
        }
        if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
        await putRow(admin, ROW_STATS, { events });
      }
      return json({ ok: true, events: events.filter(inMine) });
    }

    // ── Barème des primes (admin uniquement) ──
    if (action === "primes_set") {
      if (role !== "admin") return json({ error: "Réservé au responsable" }, 403);
      const p = body.primes || {};
      for (const k of ["1", "2", "3"]) {
        const v = Number(p[k]);
        if (!isNaN(v)) primes[k] = Math.max(0, Math.min(1000, v));
      }
      await saveInvites();
      return json({ ok: true, primes });
    }

    // ── Gestion de l'équipe (admin uniquement) ──
    if (String(action).startsWith("team_")) {
      if (role !== "admin" && !mgr) return json({ error: "Réservé aux recruteurs" }, 403);

      const taken = (c: string) => norm(c) === norm(COACH_CODE) || invites.some((i) => norm(i.code) === norm(c));

      // Seul le code maître promeut ou rétrograde un recruteur
      if (action === "team_manager") {
        if (role !== "admin") return json({ error: "Réservé au responsable" }, 403);
        const inv = invites.find((i) => i.id === String(body.id));
        if (!inv) return json({ error: "Invitation introuvable" }, 404);
        inv.manager = body.manager === true;
        await saveInvites();
        return json({ ok: true, invites: invites.filter(inMine) });
      }

      // Drapeaux métier (admin) : coach (donne des IC) · nocom (non commissionné, ex. associé)
      if (action === "team_flag") {
        if (role !== "admin") return json({ error: "Réservé au responsable" }, 403);
        const inv = invites.find((i) => i.id === String(body.id));
        if (!inv) return json({ error: "Invitation introuvable" }, 404);
        if (typeof body.coach === "boolean") inv.coach = body.coach;
        if (typeof body.nocom === "boolean") inv.nocom = body.nocom;
        await saveInvites();
        return json({ ok: true, invites: invites.filter(inMine) });
      }

      // Un recruteur ne peut pas suspendre/supprimer un autre recruteur, ni toucher un autre studio
      if (role !== "admin" && (action === "team_toggle" || action === "team_del" || action === "team_device_reset" || action === "team_regen")) {
        const target = invites.find((i) => i.id === String(body.id));
        if (target && target.manager === true) return json({ error: "Invitation d'un recruteur · réservé au responsable" }, 403);
        if (target && !inMine(target)) return json({ error: "Invitation d'un autre studio" }, 403);
      }

      // Studio d'affectation (code maître) : c'est lui qui définit ce qu'une personne voit
      if (action === "team_studio") {
        if (role !== "admin") return json({ error: "Réservé au responsable" }, 403);
        const inv = invites.find((i) => i.id === String(body.id));
        if (!inv) return json({ error: "Invitation introuvable" }, 404);
        const st = canon(body.studio);
        if (!st) return json({ error: "Studio inconnu · choisir parmi : " + STUDIOS.join(", ") }, 400);
        inv.studio = st;
        await saveInvites();
        return json({ ok: true, invites: invites.filter(inMine) });
      }

      if (action === "team_list") return json({ ok: true, invites: invites.filter(inMine) });

      // Nouveau code pour une invitation (fuite, doute) : l'ancien cesse de marcher, l'appareil est libéré
      if (action === "team_regen") {
        const inv = invites.find((i) => i.id === String(body.id));
        if (!inv) return json({ error: "Invitation introuvable" }, 404);
        const c = genCode(inv.nom, taken);
        if (!c) return json({ error: "Génération du code impossible" }, 500);
        inv.code = c; delete inv.device; delete inv.deviceAt; inv.regen = new Date().toISOString();
        await saveInvites();
        return json({ ok: true, invites: invites.filter(inMine) });
      }

      // Renouvellement de TOUS les codes (code maître uniquement)
      if (action === "team_regen_all") {
        if (role !== "admin") return json({ error: "Réservé au responsable" }, 403);
        for (const inv of invites) {
          const c = genCode(inv.nom, taken);
          if (!c) return json({ error: "Génération du code impossible" }, 500);
          inv.code = c; delete inv.device; delete inv.deviceAt; inv.regen = new Date().toISOString();
        }
        await saveInvites();
        return json({ ok: true, invites: invites.filter(inMine) });
      }

      if (action === "team_add") {
        const nom = String(body.nom || "").trim().slice(0, 60);
        const studio = scoped ? myStudio : canon(body.studio);
        if (!nom) return json({ error: "Nom requis" }, 400);
        if (!studio) return json({ error: "Studio d'affectation obligatoire · choisir parmi : " + STUDIOS.join(", ") }, 400);
        if (invites.length >= MAX_INVITES) return json({ error: "Limite d'invitations atteinte" }, 400);
        const newCode = genCode(nom, taken);
        if (!newCode) return json({ error: "Génération du code impossible" }, 500);
        const inv = { id: "inv_" + Date.now(), nom, studio, code: newCode, actif: true, manager: false, created: new Date().toISOString(), lastSeen: "" };
        invites.push(inv);
        await saveInvites();
        return json({ ok: true, invite: inv });
      }

      if (action === "team_toggle") {
        const inv = invites.find((i) => i.id === String(body.id));
        if (!inv) return json({ error: "Invitation introuvable" }, 404);
        inv.actif = body.actif !== false;
        await saveInvites();
        return json({ ok: true, invites: invites.filter(inMine) });
      }

      if (action === "team_device_reset") {
        const inv2 = invites.find((i) => i.id === String(body.id));
        if (!inv2) return json({ error: "Invitation introuvable" }, 404);
        delete inv2.device; delete inv2.deviceAt;
        await saveInvites();
        return json({ ok: true, invites: invites.filter(inMine) });
      }

      if (action === "team_del") {
        const gone = invites.find((i) => i.id === String(body.id));
        invites = invites.filter((i) => i.id !== String(body.id));
        await saveInvites();
        // Disparition définitive : scores de formation + événements du journal
        if (gone && gone.nom) {
          const nomLc = String(gone.nom).trim().toLowerCase();
          const who = nomLc.split(" ")[0];
          try {
            const tRow = { data: await getRow(admin, ROW_TRAIN) };
            const tmap: Record<string, unknown> = (tRow?.data?.map as any) || {};
            if (tmap[who]) {
              delete tmap[who];
              await putRow(admin, ROW_TRAIN, { map: tmap });
            }
          } catch (_e) { /* best effort */ }
          try {
            const stRow = { data: await getRow(admin, ROW_STATS) };
            const evts: any[] = (stRow?.data?.events as any[]) || [];
            const kept = evts.filter((ev) => String(ev.rep || "").trim().toLowerCase() !== nomLc);
            if (kept.length !== evts.length) {
              await putRow(admin, ROW_STATS, { events: kept });
            }
          } catch (_e) { /* best effort */ }
        }
        return json({ ok: true, invites: invites.filter(inMine) });
      }

      return json({ error: "Action inconnue" }, 400);
    }

    // ── Prospects (admin + rep) ──
    const row = { data: await getRow(admin, ROW_PROSPECTS) };
    let list: any[] = (row?.data?.prospects as any[]) || [];
    const epoch: number = Number(row?.data?.epoch) || 0;
    const saveList = () =>
      putRow(admin, ROW_PROSPECTS, { prospects: list, epoch });

    // Remise à zéro administrative : date la purge pour que chaque appareil
    // vide son stock local au lieu de re-pousser d'anciennes fiches.
    if (action === "purge_all") {
      if (role !== "admin") return json({ error: "Réservé au responsable" }, 403);
      const newEpoch = Date.now();
      await putRow(admin, ROW_PROSPECTS, { prospects: [], epoch: newEpoch });
      return json({ ok: true, prospects: [], epoch: newEpoch });
    }

    const tomb: string[] = ((await getRow(admin, "_coach_tomb")).ids as string[]) || [];
    const tombSet = new Set(tomb);
    if (action === "pull") return json({ ok: true, prospects: list.filter(inMine).map(outP), epoch, studio: myStudio, scoped, tomb });

    // ── Historique Boost d'une fiche (appels + durée, SMS, emails, WhatsApp, RDV…) ──
    // Lu à la demande avec le token LECTURE SEULE du club ; rien n'est stocké.
    if (action === "boost_history") {
      const p = list.find((x) => x.id === String(body.id || ""));
      if (!p || !inMine(p)) return json({ error: "Fiche introuvable" }, 404);
      if (!p.bid) return json({ ok: true, boost: false, items: [] });
      const TOK: Record<string, string> = { garenne: "BOOST_TOKEN_GARENNE", lattes: "BOOST_TOKEN_LATTES", defense: "BOOST_TOKEN_DEFENSE" };
      const token = Deno.env.get(TOK[p.bclub] || "") || "";
      if (!token) return json({ ok: true, boost: false, items: [] });
      const H = { Authorization: "Bearer " + token, Accept: "application/json" };
      const B = "https://www.app-boost.com/api/v1";
      const [ra, ru] = await Promise.all([
        fetch(B + "/activities?prospect_id=" + encodeURIComponent(p.bid) + "&limit=200", { headers: H, redirect: "manual" }),
        fetch(B + "/users", { headers: H, redirect: "manual" }),
      ]);
      if (ra.status !== 200) { await ra.body?.cancel(); await ru.body?.cancel(); return json({ ok: false, boost: true, http: ra.status, items: [] }); }
      // deno-lint-ignore no-explicit-any
      const acts: any[] = (await ra.json().catch(() => ({})))?.data || [];
      // deno-lint-ignore no-explicit-any
      const users: any[] = ru.status === 200 ? ((await ru.json().catch(() => ({})))?.data || []) : [];
      if (ru.status !== 200) await ru.body?.cancel();
      const uname = new Map(users.map((u) => [String(u?.id), String(u?.name || "")]));
      const items = acts.map((a) => ({
        at: String(a?.created_at || ""), sched: String(a?.scheduled_at || ""), type: String(a?.action_type || ""),
        rdv: String(a?.rdv_type || ""), st: String(a?.status || ""), dur: Number(a?.duration) || 0,
        title: String(a?.title || "").slice(0, 120), txt: String(a?.description || a?.content || "").slice(0, 800),
        who: uname.get(String(a?.user_id || "")) || "", auto: a?.est_auto === true, venu: a?.est_venu ?? null,
        ds: String(a?.delivery_status || ""),
      }));
      return json({ ok: true, boost: true, items });
    }

    if (action === "push") {
      const incoming: any[] = Array.isArray(body.prospects) ? body.prospects : [];
      for (const p of incoming) {
        if (!p || !p.id || tombSet.has(String(p.id))) continue;
        // On ne garde que les champs attendus (pas de payload arbitraire)
        const clean = {
          id: String(p.id), nom: String(p.nom || ""), tel: String(p.tel || ""),
          note: String(p.note || ""), statut: String(p.statut || "rappeler"),
          rappel: String(p.rappel || ""), rappelH: String(p.rappelH || "").slice(0, 5), rappelBy: String(p.rappelBy || "").slice(0, 30), obj: String(p.obj || ""),
          fiche: String(p.fiche || "").slice(0, 4000),
          pack: String(p.pack || ""),
          v2: String(p.v2 || "").slice(0, 60),
          fullCom: p.fullCom === true,
          icId: String(p.icId || "").slice(0, 60),
          // Résumés IA des appels (plateforme Allo) : {ts, txt}, 20 max, 5000 car.
          appels: Array.isArray(p.appels)
            ? p.appels.slice(-20).map((a: any) => ({ id: String(a?.id || "").slice(0, 40), ts: String(a?.ts || "").slice(0, 30), rx: String(a?.rx || "").slice(0, 30), sv: Number(a?.sv) || 0, txt: String(a?.txt || "").slice(0, 9000) })).filter((a: any) => a.txt)
            : [],
          rep: String(p.rep || rep), studio: String(p.studio || ""),
          ts: String(p.ts || new Date().toISOString()),
          maj: String(p.maj || p.ts || new Date().toISOString()),
        };
        const i = list.findIndex((x) => x.id === clean.id);
        if (i >= 0 && !inMine(list[i])) continue;
        ownStudio(clean, i >= 0 ? list[i] : null);
        if (i >= 0) {
          keepBoost(clean, list[i]);
          if ((clean.maj || "") >= (list[i].maj || "")) {
            markBq(clean, list[i], rep);
            // Les appels arrivés côté serveur (webhook Allo) ne sont jamais écrasés par une copie client plus ancienne
            const seen = new Set(clean.appels.map((a: any) => String(a.ts).slice(0, 16)));
            for (const a of (list[i].appels || [])) if (!seen.has(String(a.ts).slice(0, 16))) clean.appels.push(a);
            clean.appels.sort((x: any, y: any) => String(x.ts).localeCompare(String(y.ts)));
            if (clean.appels.length > 20) clean.appels = clean.appels.slice(-20);
            list[i] = clean;
          }
          continue;
        }
        // Nouvelle fiche avec le même numéro qu'une fiche existante (ex. créée par Allo
        // pendant que le commercial menait l'appel dans l'assistant) : fusion, pas de doublon.
        const tk = (s: unknown) => String(s || "").replace(/\D/g, "").slice(-9);
        const k = tk(clean.tel);
        // Fusion par numéro, au sein du même studio uniquement
        const sameStudio = (x: any) => !sk(x.studio) || !sk(clean.studio) || sk(x.studio) === sk(clean.studio);
        const j = k.length === 9 ? list.findIndex((x) => tk(x.tel) === k && sameStudio(x) && inMine(x)) : -1;
        if (j < 0) { list.push(clean); continue; }
        const ex = list[j];
        const newer = (clean.maj || "") >= (ex.maj || "");
        const base = newer ? clean : ex, other = newer ? ex : clean;
        const merged: any = { ...other, ...base };
        merged.id = clean.id; // l'id de la fiche de l'assistant (porte les événements de vente)
        if (ex.bid) { for (const f of BOOST_FIELDS) if (f in ex) merged[f] = ex[f]; merged.nom = ex.nom; merged.tel = ex.tel; merged.rep = String(ex.rep || ""); markBq(merged, ex, rep); }
        if (/^Contact 0/.test(String(merged.nom || "")) && other.nom && !/^Contact 0/.test(String(other.nom))) merged.nom = other.nom;
        merged.rep = base.rep || other.rep;
        merged.studio = base.studio || other.studio;
        merged.ts = String(ex.ts || clean.ts) < String(clean.ts || ex.ts) ? ex.ts : clean.ts;
        merged.note = [ex.note, clean.note].filter(Boolean).filter((v: string, n: number, a: string[]) => a.indexOf(v) === n).join(" · ").slice(0, 300);
        const all = [...(ex.appels || []), ...(clean.appels || [])];
        const byMin = new Map<string, any>();
        for (const a of all) {
          const km = String(a.ts).slice(0, 16);
          const prev = byMin.get(km);
          if (!prev || String(a.txt || "").length > String(prev.txt || "").length) byMin.set(km, { ...a, rx: a.rx || prev?.rx || "" });
        }
        merged.appels = [...byMin.values()].sort((x: any, y: any) => String(x.ts).localeCompare(String(y.ts))).slice(-20);
        list[j] = merged;
      }
      if (list.length > MAX_PROSPECTS) list = list.slice(-MAX_PROSPECTS);
      await saveList();
      return json({ ok: true, prospects: list.filter(inMine).map(outP), epoch, studio: myStudio, scoped, tomb });
    }

    if (action === "delete") {
      const rm: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
      list = list.filter((p) => !rm.includes(p.id) || !inMine(p));
      await saveList();
      return json({ ok: true, prospects: list.filter(inMine).map(outP), epoch, tomb });
    }

    return json({ error: "Action inconnue" }, 400);
  } catch (err) {
    console.error("coach-sync", (err as Error).message);
    return json({ error: "Erreur serveur" }, 500);
  }
});
