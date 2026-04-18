// ═══════════════════════════════════════════════════════════════════════════
// Edge Function : send-push
// ═══════════════════════════════════════════════════════════════════════════
// POST { user_ids: string[], title: string, body?: string, data?: object }
//
// Pour chaque user_id, lit toutes ses subscriptions Web Push dans
// `push_subscriptions`, signe un JWT VAPID, encrypte le payload et POST sur
// l'endpoint du navigateur. Si le serveur répond 404/410 (Gone), la
// subscription est supprimée.
//
// Déploiement :
//   supabase secrets set VAPID_PUBLIC_KEY="..." VAPID_PRIVATE_KEY="..." VAPID_SUBJECT="mailto:paul@isseo.fr"
//   supabase functions deploy send-push --no-verify-jwt
// ═══════════════════════════════════════════════════════════════════════════

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:paul@isseo.fr';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('[send-push] VAPID keys missing — set VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY');
}

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.error('[send-push] VAPID setup failed:', e);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { user_ids, title, body, data, tag, url } = await req.json();
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'user_ids required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!title) {
      return new Response(JSON.stringify({ error: 'title required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Récupère toutes les subscriptions pour les user_ids ciblés
    const { data: subs, error } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .in('user_id', user_ids);

    if (error) {
      console.error('[send-push] DB error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'no subscriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({
      title,
      body: body || '',
      data: { ...(data || {}), url: url || '/', ts: Date.now() },
      tag: tag || 'isseo-push',
    });

    let sent = 0;
    let failed = 0;
    const deadEndpoints: string[] = [];

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 60 * 60 * 24 } // 24h max
          );
          sent++;
          // update last_used_at (fire and forget)
          admin
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('endpoint', s.endpoint)
            .then(() => {}, () => {});
        } catch (e: any) {
          failed++;
          const code = e && e.statusCode;
          // 404/410 : endpoint obsolète — on supprime
          if (code === 404 || code === 410) {
            deadEndpoints.push(s.endpoint);
          } else {
            console.warn('[send-push] endpoint failed', code, e?.body?.slice?.(0, 120));
          }
        }
      })
    );

    // Nettoyage des subscriptions mortes
    if (deadEndpoints.length) {
      await admin.from('push_subscriptions').delete().in('endpoint', deadEndpoints);
    }

    return new Response(
      JSON.stringify({ ok: true, sent, failed, pruned: deadEndpoints.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('[send-push] unhandled', e);
    return new Response(JSON.stringify({ error: e?.message || 'unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
