// ═══════════════════════════════════════════════════════════════════════════
// Edge Function — admin-users
// ═══════════════════════════════════════════════════════════════════════════
// Création / suppression de comptes utilisateurs, réservée aux super-admins.
// Remplace le sb.auth.signUp() côté client, ce qui permet de DÉSACTIVER
// l'inscription publique dans le dashboard (Authentication → Sign In / Up)
// sans casser l'écran « Créer un compte » de l'app gérants.
//
// L'appelant est identifié par son JWT (Authorization), vérifié côté serveur,
// et doit être dans ADMIN_EMAILS (équivalent serveur de isSuperAdmin()).
//
// Body: { action, ... }
//  - create { email, password, nom, role } → crée le compte (email confirmé
//    d'office, plus besoin du mail de confirmation) + fiche profiles avec rôle
//  - delete { uid }                        → supprime le compte auth + profil
//
// Réponses toujours en HTTP 200 : { ok:true, ... } ou { error:"..." }
// (sauf 401/403 d'authentification). Déployée AVEC vérification JWT.
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_EMAILS = ["paulbecaud@isseo-dev.com", "tombecaud@isseo-dev.com"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Non authentifié" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: caller, error: callerErr } = await admin.auth.getUser(jwt);
    if (callerErr || !caller?.user) return json({ error: "Session invalide" }, 401);
    const callerEmail = (caller.user.email || "").toLowerCase();
    if (!ADMIN_EMAILS.includes(callerEmail)) {
      return json({ error: "Réservé aux administrateurs" }, 403);
    }

    const body = await req.json();

    if (body.action === "create") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const nom = String(body.nom || "").trim();
      const role = String(body.role || "viewer");
      if (!email || password.length < 6) {
        return json({ error: "Email et mot de passe (6 caractères min.) requis" });
      }
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nom },
      });
      if (error) return json({ error: error.message });
      const uid = data.user.id;
      // Le trigger on_auth_user_created a pu créer la fiche : on pose le bon rôle
      const { error: profErr } = await admin
        .from("profiles")
        .upsert({ id: uid, nom, email, role });
      if (profErr) return json({ error: "Compte créé mais profil en erreur : " + profErr.message, uid });
      return json({ ok: true, uid });
    }

    if (body.action === "delete") {
      const uid = String(body.uid || "");
      if (!uid) return json({ error: "uid requis" });
      if (uid === caller.user.id) return json({ error: "Impossible de supprimer son propre compte" });
      const { error } = await admin.auth.admin.deleteUser(uid);
      if (error) return json({ error: error.message });
      await admin.from("profiles").delete().eq("id", uid);
      return json({ ok: true });
    }

    return json({ error: "Action inconnue" });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
