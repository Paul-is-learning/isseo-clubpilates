import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // Vérifier que l'appelant est authentifié
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Client avec service_role pour les opérations admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Client avec le token de l'appelant pour vérifier ses droits
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Vérifier que l'appelant est un super admin
    const { data: { user: caller } } = await supabaseUser.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Session invalide" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const callerEmail = (caller.email || "").toLowerCase();
    const isSuperAdmin = callerEmail === "paulbecaud@isseo-dev.com" || callerEmail === "tombecaud@isseo-dev.com";
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Accès réservé aux super admins" }), {
        status: 403,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { action, email, password, nom, role, userId } = await req.json();

    // ── CREATE USER ─────────────────────────────────────────────────────
    if (action === "create") {
      if (!email || !password || !nom) {
        return new Response(JSON.stringify({ error: "email, password et nom requis" }), {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      // Créer l'utilisateur avec confirmation automatique (pas d'email)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nom },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      // Insérer le profil
      await supabaseAdmin.from("profiles").upsert({
        id: newUser.user.id,
        nom,
        email,
        role: role || "admin",
      });

      return new Response(JSON.stringify({
        success: true,
        userId: newUser.user.id,
        message: "Compte créé pour " + nom
      }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ── DELETE USER ─────────────────────────────────────────────────────
    if (action === "delete") {
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId requis" }), {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      // Interdire l'auto-suppression
      if (userId === caller.id) {
        return new Response(JSON.stringify({ error: "Impossible de supprimer votre propre compte" }), {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      // Supprimer le profil
      await supabaseAdmin.from("profiles").delete().eq("id", userId);

      // Supprimer le compte auth
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Compte supprimé"
      }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ── RESET PASSWORD ──────────────────────────────────────────────────
    if (action === "reset-password") {
      if (!userId || !password) {
        return new Response(JSON.stringify({ error: "userId et password requis" }), {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
      });

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Mot de passe mis à jour"
      }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Action inconnue: " + action }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
