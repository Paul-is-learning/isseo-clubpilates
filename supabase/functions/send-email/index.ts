// ═══════════════════════════════════════════════════════════════════════════
// Edge Function — send-email
// ═══════════════════════════════════════════════════════════════════════════
// Wrapper générique Resend. Authentification JWT requise.
// Body: { to: string|string[], subject, html, text?, replyTo?, from? }
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_FROM = 'ISSEO <noreply@isseo-dev.com>';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // ── Vérifier l'appelant (JWT) ─────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Non autorisé" }, 401);
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller } } = await supabaseUser.auth.getUser();
    if (!caller) {
      return json({ error: "Session invalide" }, 401);
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const { to, subject, html, text, replyTo, from } = await req.json();
    if (!to || !subject || !html) {
      return json({ error: "to, subject et html requis" }, 400);
    }

    // ── Resend ────────────────────────────────────────────────────────────
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return json({ error: "RESEND_API_KEY non configuré" }, 500);
    }

    const payload: Record<string, unknown> = {
      from: from || DEFAULT_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };
    if (text) payload.text = text;
    if (replyTo) payload.reply_to = replyTo;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[send-email] Resend error:", data);
      return json({ error: data.message || "Resend error", details: data }, 500);
    }

    return json({ success: true, messageId: data.id });

  } catch (err) {
    console.error("[send-email]", err);
    return json({ error: err.message || "Erreur serveur" }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
