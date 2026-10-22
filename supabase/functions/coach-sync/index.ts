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

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
const norm = (s: unknown) => String(s ?? "").trim().toUpperCase();

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

    // ── Résolution du code : maître ou invitation active ──
    const { data: accRow } = await admin.from("studios").select("data").eq("id", ROW_ACCESS).maybeSingle();
    let invites: any[] = (accRow?.data?.invites as any[]) || [];
    let primes: Record<string, number> = { ...DEFAULT_PRIMES, ...((accRow?.data?.primes as Record<string, number>) || {}) };
    const saveInvites = () =>
      admin.from("studios").upsert({ id: ROW_ACCESS, data: { invites, primes, adminAvatar: accRow?.data?.adminAvatar ?? null }, updated_at: new Date().toISOString() });

    let role = "";
    let rep = "";
    let mgr = false;
    if (norm(code) && norm(code) === norm(COACH_CODE)) {
      role = "admin";
      mgr = true;
    } else {
      const inv = invites.find((i) => i && i.actif !== false && norm(i.code) === norm(code));
      if (inv) {
        role = "rep";
        rep = String(inv.nom || "");
        mgr = inv.manager === true;
        if (action === "ping") { inv.lastSeen = new Date().toISOString(); await saveInvites(); }
      }
    }
    if (!role) return json({ error: "Code invalide" }, 401);

    let myAvatar = "";
    let myStudio = "";
    if (role === "admin") myAvatar = String(accRow?.data?.adminAvatar?.avatar || "");
    else { const inv = invites.find((i) => norm(i.code) === norm(code)); myAvatar = String(inv?.avatar || ""); myStudio = String(inv?.studio || ""); }

    if (action === "ping") return json({ ok: true, role, rep, manager: mgr, primes, avatar: myAvatar, studio: myStudio });

    // ── Avatars : chacun définit le sien, tout le monde voit ceux des autres ──
    if (action === "avatar_set") {
      const av = String(body.avatar || "");
      const okI = av.startsWith("I|") && av.length < 20 && /^[\w-]+$/.test(av.slice(2));
      if (av && !okI && !(av.startsWith("E|") && av.length < 40) && !(av.startsWith("P|data:image/") && av.length <= 14000))
        return json({ error: "Avatar invalide" }, 400);
      if (role === "admin") {
        (accRow?.data || {});
        const adminAvatar = av ? { nom: String(body.nom || "").slice(0, 60), avatar: av } : null;
        await admin.from("studios").upsert({ id: ROW_ACCESS, data: { invites, primes, adminAvatar }, updated_at: new Date().toISOString() });
      } else {
        const inv = invites.find((i) => norm(i.code) === norm(code));
        if (inv) { inv.avatar = av; await saveInvites(); }
      }
      return json({ ok: true });
    }

    if (action === "avatars") {
      const map: Record<string, string> = {};
      for (const i of invites) {
        const k = String(i.nom || "").trim().split(" ")[0].toLowerCase();
        if (k && i.avatar) map[k] = String(i.avatar);
      }
      const aa = accRow?.data?.adminAvatar;
      if (aa && aa.avatar) { const k = String(aa.nom || "").trim().split(" ")[0].toLowerCase(); if (k) map[k] = String(aa.avatar); }
      return json({ ok: true, avatars: map });
    }

    // ── Journal de performance (immuable : les stats survivent aux fiches) ──
    // ── Intro Class : _ic_data = { slots, sessions, baremes } ──
    if (action === "ic_pull" || action === "ic_push" || action === "ic_del" || action === "ic_bareme_set") {
      const { data: icRow } = await admin.from("studios").select("data").eq("id", ROW_IC).maybeSingle();
      const ic = icRow?.data || {};
      let slots: any[] = ic.slots || [];
      let sessions: any[] = ic.sessions || [];
      let baremes: any[] = ic.baremes || [];
      let coachs: any[] = ic.coachs || [];
      const saveIC = () =>
        admin.from("studios").upsert({ id: ROW_IC, data: { slots, sessions, baremes, coachs }, updated_at: new Date().toISOString() });

      if (action === "ic_pull") return json({ ok: true, slots, sessions, baremes, coachs });

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
          if (i < 0) sessions.push(clean); else if ((clean.maj || "") >= (sessions[i].maj || "")) sessions[i] = clean;
        }
        const inCoachs: any[] = Array.isArray(body.coachs) ? body.coachs : [];
        for (const c of inCoachs) {
          if (!c || !c.id || !c.nom) continue;
          const clean = { id: String(c.id).slice(0, 60), nom: String(c.nom).slice(0, 60),
            studio: String(c.studio || "").slice(0, 60), maj: String(c.maj || new Date().toISOString()) };
          const i = coachs.findIndex((x) => x.id === clean.id);
          if (i < 0) coachs.push(clean); else if ((clean.maj || "") >= (coachs[i].maj || "")) coachs[i] = clean;
        }
        if (coachs.length > 200) coachs = coachs.slice(-200);
        if (sessions.length > MAX_IC) sessions = sessions.slice(-MAX_IC);
        await saveIC();
        return json({ ok: true, slots, sessions, baremes, coachs });
      }

      if (action === "ic_del") {
        if (role !== "admin" && !mgr) return json({ error: "Réservé aux recruteurs" }, 403);
        const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
        slots = slots.filter((s) => !ids.includes(s.id));
        sessions = sessions.filter((s) => !ids.includes(s.id));
        coachs = coachs.filter((c) => !ids.includes(c.id));
        await saveIC();
        return json({ ok: true, slots, sessions, baremes, coachs });
      }
    }

    // ── Formation : scores du parcours de cas pratiques, par salarié ──
    // Le serveur attribue le score au code CONNECTÉ (un salarié ne peut pas
    // valider la formation d'un autre). Meilleur score conservé.
    if (action === "train_push" || action === "train_pull" || action === "train_del") {
      const { data: tRow } = await admin.from("studios").select("data").eq("id", ROW_TRAIN).maybeSingle();
      const map: Record<string, Record<string, { s: number; ts: string }>> = (tRow?.data?.map as any) || {};

      if (action === "train_del") {
        if (role !== "admin") return json({ error: "Réservé au responsable" }, 403);
        const who = String(body.who || "").trim().toLowerCase();
        if (who && map[who]) delete map[who];
        await admin.from("studios").upsert({ id: ROW_TRAIN, data: { map }, updated_at: new Date().toISOString() });
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
        await admin.from("studios").upsert({ id: ROW_TRAIN, data: { map }, updated_at: new Date().toISOString() });
      }
      return json({ ok: true, map });
    }

    if (action === "stats_del") {
      if (role !== "admin" && !mgr) return json({ error: "Réservé aux recruteurs" }, 403);
      const { data: stRow } = await admin.from("studios").select("data").eq("id", ROW_STATS).maybeSingle();
      let events: any[] = (stRow?.data?.events as any[]) || [];
      const ks: string[] = Array.isArray(body.ks) ? body.ks.map(String) : [];
      const pfx = String(body.prefix || "");
      events = events.filter((e) => !ks.includes(e.k) && !(pfx && String(e.k).startsWith(pfx)));
      await admin.from("studios").upsert({ id: ROW_STATS, data: { events }, updated_at: new Date().toISOString() });
      return json({ ok: true, events });
    }

    if (action === "stats_pull" || action === "stats_push") {
      const { data: stRow } = await admin.from("studios").select("data").eq("id", ROW_STATS).maybeSingle();
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
          if (i < 0) events.push(clean);
          else if ((clean.ts || "") >= (events[i].ts || "")) events[i] = clean;
        }
        if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
        await admin.from("studios").upsert({ id: ROW_STATS, data: { events }, updated_at: new Date().toISOString() });
      }
      return json({ ok: true, events });
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

      // Seul le code maître promeut ou rétrograde un recruteur
      if (action === "team_manager") {
        if (role !== "admin") return json({ error: "Réservé au responsable" }, 403);
        const inv = invites.find((i) => i.id === String(body.id));
        if (!inv) return json({ error: "Invitation introuvable" }, 404);
        inv.manager = body.manager === true;
        await saveInvites();
        return json({ ok: true, invites });
      }

      // Drapeaux métier (admin) : coach (donne des IC) · nocom (non commissionné, ex. associé)
      if (action === "team_flag") {
        if (role !== "admin") return json({ error: "Réservé au responsable" }, 403);
        const inv = invites.find((i) => i.id === String(body.id));
        if (!inv) return json({ error: "Invitation introuvable" }, 404);
        if (typeof body.coach === "boolean") inv.coach = body.coach;
        if (typeof body.nocom === "boolean") inv.nocom = body.nocom;
        await saveInvites();
        return json({ ok: true, invites });
      }

      // Un recruteur ne peut pas suspendre/supprimer un autre recruteur
      if (role !== "admin" && (action === "team_toggle" || action === "team_del")) {
        const target = invites.find((i) => i.id === String(body.id));
        if (target && target.manager === true) return json({ error: "Invitation d'un recruteur · réservé au responsable" }, 403);
      }

      if (action === "team_list") return json({ ok: true, invites });

      if (action === "team_add") {
        const nom = String(body.nom || "").trim().slice(0, 60);
        const studio = String(body.studio || "").trim().slice(0, 60);
        if (!nom) return json({ error: "Nom requis" }, 400);
        if (invites.length >= MAX_INVITES) return json({ error: "Limite d'invitations atteinte" }, 400);
        const base = nom.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 8) || "CP";
        let newCode = "";
        for (let t = 0; t < 20 && !newCode; t++) {
          const c = base + "-" + String(Math.floor(1000 + Math.random() * 9000));
          if (norm(c) !== norm(COACH_CODE) && !invites.some((i) => norm(i.code) === norm(c))) newCode = c;
        }
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
        return json({ ok: true, invites });
      }

      if (action === "team_del") {
        invites = invites.filter((i) => i.id !== String(body.id));
        await saveInvites();
        return json({ ok: true, invites });
      }

      return json({ error: "Action inconnue" }, 400);
    }

    // ── Prospects (admin + rep) ──
    const { data: row } = await admin.from("studios").select("data").eq("id", ROW_PROSPECTS).maybeSingle();
    let list: any[] = (row?.data?.prospects as any[]) || [];
    const epoch: number = Number(row?.data?.epoch) || 0;
    const saveList = () =>
      admin.from("studios").upsert({ id: ROW_PROSPECTS, data: { prospects: list, epoch }, updated_at: new Date().toISOString() });

    // Remise à zéro administrative : date la purge pour que chaque appareil
    // vide son stock local au lieu de re-pousser d'anciennes fiches.
    if (action === "purge_all") {
      if (role !== "admin") return json({ error: "Réservé au responsable" }, 403);
      const newEpoch = Date.now();
      await admin.from("studios").upsert({ id: ROW_PROSPECTS, data: { prospects: [], epoch: newEpoch }, updated_at: new Date().toISOString() });
      return json({ ok: true, prospects: [], epoch: newEpoch });
    }

    if (action === "pull") return json({ ok: true, prospects: list, epoch });

    if (action === "push") {
      const incoming: any[] = Array.isArray(body.prospects) ? body.prospects : [];
      for (const p of incoming) {
        if (!p || !p.id) continue;
        // On ne garde que les champs attendus (pas de payload arbitraire)
        const clean = {
          id: String(p.id), nom: String(p.nom || ""), tel: String(p.tel || ""),
          note: String(p.note || ""), statut: String(p.statut || "rappeler"),
          rappel: String(p.rappel || ""), obj: String(p.obj || ""),
          fiche: String(p.fiche || "").slice(0, 4000),
          pack: String(p.pack || ""),
          v2: String(p.v2 || "").slice(0, 60),
          fullCom: p.fullCom === true,
          icId: String(p.icId || "").slice(0, 60),
          rep: String(p.rep || rep), studio: String(p.studio || ""),
          ts: String(p.ts || new Date().toISOString()),
          maj: String(p.maj || p.ts || new Date().toISOString()),
        };
        const i = list.findIndex((x) => x.id === clean.id);
        if (i < 0) list.push(clean);
        else if ((clean.maj || "") >= (list[i].maj || "")) list[i] = clean;
      }
      if (list.length > MAX_PROSPECTS) list = list.slice(-MAX_PROSPECTS);
      await saveList();
      return json({ ok: true, prospects: list, epoch });
    }

    if (action === "delete") {
      const rm: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
      list = list.filter((p) => !rm.includes(p.id));
      await saveList();
      return json({ ok: true, prospects: list, epoch });
    }

    return json({ error: "Action inconnue" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message || "Erreur serveur" }, 500);
  }
});
