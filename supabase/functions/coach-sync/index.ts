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
const MAX_EVENTS = 20000;
const EV_TYPES = ["appel", "essai", "venu", "abo", "perdu"];
const DEFAULT_PRIMES: Record<string, number> = { "1": 15, "2": 30, "3": 45 };
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
      admin.from("studios").upsert({ id: ROW_ACCESS, data: { invites, primes }, updated_at: new Date().toISOString() });

    let role = "";
    let rep = "";
    if (norm(code) && norm(code) === norm(COACH_CODE)) {
      role = "admin";
    } else {
      const inv = invites.find((i) => i && i.actif !== false && norm(i.code) === norm(code));
      if (inv) {
        role = "rep";
        rep = String(inv.nom || "");
        if (action === "ping") { inv.lastSeen = new Date().toISOString(); await saveInvites(); }
      }
    }
    if (!role) return json({ error: "Code invalide" }, 401);

    if (action === "ping") return json({ ok: true, role, rep, primes });

    // ── Journal de performance (immuable : les stats survivent aux fiches) ──
    if (action === "stats_del") {
      if (role !== "admin") return json({ error: "Réservé au responsable" }, 403);
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
            prime: Math.max(0, Math.min(1000, Number(e.prime) || 0)),
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
      if (role !== "admin") return json({ error: "Réservé au responsable" }, 403);

      if (action === "team_list") return json({ ok: true, invites });

      if (action === "team_add") {
        const nom = String(body.nom || "").trim().slice(0, 60);
        if (!nom) return json({ error: "Nom requis" }, 400);
        if (invites.length >= MAX_INVITES) return json({ error: "Limite d'invitations atteinte" }, 400);
        const base = nom.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 8) || "CP";
        let newCode = "";
        for (let t = 0; t < 20 && !newCode; t++) {
          const c = base + "-" + String(Math.floor(1000 + Math.random() * 9000));
          if (norm(c) !== norm(COACH_CODE) && !invites.some((i) => norm(i.code) === norm(c))) newCode = c;
        }
        if (!newCode) return json({ error: "Génération du code impossible" }, 500);
        const inv = { id: "inv_" + Date.now(), nom, code: newCode, actif: true, created: new Date().toISOString(), lastSeen: "" };
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
    const saveList = () =>
      admin.from("studios").upsert({ id: ROW_PROSPECTS, data: { prospects: list }, updated_at: new Date().toISOString() });

    if (action === "pull") return json({ ok: true, prospects: list });

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
      return json({ ok: true, prospects: list });
    }

    if (action === "delete") {
      const rm: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
      list = list.filter((p) => !rm.includes(p.id));
      await saveList();
      return json({ ok: true, prospects: list });
    }

    return json({ error: "Action inconnue" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message || "Erreur serveur" }, 500);
  }
});
