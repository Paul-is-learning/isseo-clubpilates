// ═══════════════════════════════════════════════════════════════════════════
// Edge Function — allo-webhook
// ═══════════════════════════════════════════════════════════════════════════
// Reçoit les webhooks de la téléphonie Allo (withallo.com) et dépose le
// résumé IA de chaque appel terminé (topic call.completed) sur la fiche
// prospect correspondante du CP Sales Coach (ligne _coach_prospects),
// par correspondance de numéro de téléphone (9 derniers chiffres).
//
// Sécurité : signature HMAC-SHA256 façon Svix (headers webhook-id /
// webhook-timestamp / webhook-signature), secret ALLO_WEBHOOK_SECRET
// (format whsec_<base64>) fourni par Allo à la création du webhook.
//
// Déployée avec --no-verify-jwt (Allo ne porte pas de JWT Supabase).
// Config Allo : Settings → Webhooks → URL de cette fonction, événement
// call.completed. Livraison "at least once" → déduplication par id d'appel.
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ROW_PROSPECTS = "_coach_prospects";

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Clé de correspondance téléphone : 9 derniers chiffres
// (0612345678 et +33612345678 donnent la même clé)
const telKey = (s: unknown) => String(s ?? "").replace(/\D/g, "").slice(-9);

async function verifySignature(req: Request, raw: string, secret: string): Promise<boolean> {
  const id = req.headers.get("webhook-id") || "";
  const ts = req.headers.get("webhook-timestamp") || "";
  const sigHeader = req.headers.get("webhook-signature") || "";
  if (!id || !ts || !sigHeader) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false; // anti-rejeu 5 min
  const b64 = secret.split("_")[1] || "";
  const keyBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${raw}`));
  const computed = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return sigHeader.split(" ").map((s) => s.split(",")[1]).some((s) => s === computed);
}

serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST attendu" }, 405);
  try {
    const secret = Deno.env.get("ALLO_WEBHOOK_SECRET") || "";
    if (!secret) return json({ error: "ALLO_WEBHOOK_SECRET non configuré" }, 500);

    const raw = await req.text();
    if (!(await verifySignature(req, raw, secret))) return json({ error: "Signature invalide" }, 401);

    const evt = JSON.parse(raw);
    if (evt.topic !== "call.completed") return json({ ok: true, ignored: evt.topic });

    const d = evt.data || {};
    const summary = String(d.summary || "").trim();
    if (!summary) return json({ ok: true, ignored: "sans résumé" });

    // Numéro du prospect : l'autre bout du fil
    const phone = d.type === "OUTBOUND" ? d.to : d.from_number;
    const key = telKey(phone);
    if (key.length < 9) return json({ ok: true, ignored: "numéro invalide" });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: row } = await admin.from("studios").select("data").eq("id", ROW_PROSPECTS).maybeSingle();
    const list: any[] = (row?.data?.prospects as any[]) || [];
    const match = list.find((p) => telKey(p?.tel) === key);
    if (!match) return json({ ok: true, matched: false });

    const callId = String(d.id || "").slice(0, 40);
    match.appels = Array.isArray(match.appels) ? match.appels : [];
    if (callId && match.appels.some((a: any) => a?.id === callId)) {
      return json({ ok: true, dedup: true }); // livraison "at least once"
    }

    const meta = "📞 Allo · " + (d.type === "OUTBOUND" ? "appel sortant" : "appel entrant")
      + (d.length ? " · " + d.length : "") + (d.result ? " · " + String(d.result).toLowerCase() : "");
    match.appels.push({
      id: callId,
      ts: String(d.start_date || evt.timestamp || new Date().toISOString()).slice(0, 30),
      txt: (meta + "\n" + summary).slice(0, 5000),
    });
    if (match.appels.length > 20) match.appels = match.appels.slice(-20);
    match.maj = new Date().toISOString();

    await admin.from("studios").upsert({ id: ROW_PROSPECTS, data: { ...(row?.data || {}), prospects: list }, updated_at: new Date().toISOString() });
    return json({ ok: true, matched: true, prospect: String(match.nom || "") });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
