// ═══════════════════════════════════════════════════════════════════════════
// Edge Function — aircall-webhook (Aircall → Sales Coach, en direct)
// ═══════════════════════════════════════════════════════════════════════════
// Reçoit les notifications Aircall (call.ended, transcription.created) et range
// l'appel sur la fiche Boost du même numéro, studio Montpellier Lattes :
// sens, durée, décroché/manqué, conseiller, puis transcription.
// Enrichissement seulement : un numéro inconnu de Boost ne crée pas de fiche.
// Authentification : le champ `token` de chaque notification doit égaler le
// token reçu à la création du webhook (rangé dans coach_store `_aircall`).
// Déployée avec --no-verify-jwt.
// ═══════════════════════════════════════════════════════════════════════════
// deno-lint-ignore-file no-explicit-any

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRow, safeEq } from "../_shared/store.ts";
import { AIRCALL_STUDIO, aircallGet, callMeta, callTs, telKey, transcriptText } from "../_shared/aircall.ts";

const TXT_MAX = 9000;
const sk = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
const ok = (o: unknown = { ok: true }) => new Response(JSON.stringify(o), { status: 200, headers: { "Content-Type": "application/json" } });

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("POST attendu", { status: 405 });
  try {
    const evt = await req.json().catch(() => null);
    if (!evt) return new Response("JSON attendu", { status: 400 });
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const cfg = await getRow(admin, "_aircall");
    if (!cfg.token || !safeEq(String(evt.token || ""), String(cfg.token))) return new Response("Jeton invalide", { status: 401 });

    const event = String(evt.event || "");
    const d = evt.data || {};
    let call: any = null;
    let transcript = "";
    if (event === "call.ended") call = d;
    else if (event === "transcription.created") {
      const callId = d.call_id ?? d.call?.id ?? d.id;
      if (!callId) return ok({ ok: true, ignored: "sans appel" });
      const c = await aircallGet("/calls/" + encodeURIComponent(String(callId)));
      call = c.body?.call || null;
      transcript = transcriptText(d.content || d.utterances ? d : null);
      if (!transcript) { const t = await aircallGet("/calls/" + encodeURIComponent(String(callId)) + "/transcription"); transcript = transcriptText(t.body); }
    } else return ok({ ok: true, ignored: event });
    if (!call?.id) return ok({ ok: true, ignored: "appel introuvable" });
    const key = telKey(call.raw_digits);
    if (key.length < 9) return ok({ ok: true, ignored: "numéro invalide" });

    const entryId = "ac_" + String(call.id).slice(0, 30);
    // Écriture atomique (réessayée si un téléphone écrit au même moment)
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data: row } = await admin.from("coach_store").select("data,updated_at").eq("id", "_coach_prospects").maybeSingle();
      const list: any[] = row?.data?.prospects || [];
      const same = list.filter((p) => telKey(p?.tel) === key && sk(p?.studio) === sk(AIRCALL_STUDIO));
      const f = same.find((p) => p?.bid) || same[0];
      if (!f) return ok({ ok: true, ignored: "numéro absent des fiches de Lattes" });
      f.appels = Array.isArray(f.appels) ? f.appels : [];
      const i = f.appels.findIndex((a: any) => a?.id === entryId);
      const prev = i >= 0 ? String(f.appels[i].txt || "") : "";
      const prevTr = prev.includes("\n\n— Transcription —\n") ? prev.slice(prev.indexOf("\n\n— Transcription —\n")) : "";
      const txt = (callMeta(call) + (transcript ? "\n\n— Transcription —\n" + transcript : prevTr)).slice(0, TXT_MAX);
      const entry = { id: entryId, ts: callTs(call), rx: new Date().toISOString(), sv: 0, txt };
      if (i >= 0) { if (prev === txt) return ok({ ok: true, dedup: true }); f.appels[i] = entry; }
      else { f.appels.push(entry); f.appels.sort((a: any, b: any) => String(a.ts).localeCompare(String(b.ts))); if (f.appels.length > 20) f.appels = f.appels.slice(-20); }
      f.maj = new Date().toISOString();
      const { data: upd } = await admin.from("coach_store")
        .update({ data: { ...(row?.data || {}), prospects: list }, updated_at: new Date().toISOString() })
        .eq("id", "_coach_prospects").eq("updated_at", row?.updated_at).select("id");
      if (upd && upd.length) return ok({ ok: true, matched: true });
      await new Promise((r) => setTimeout(r, 250));
    }
    return new Response("Conflit d'écriture", { status: 503 }); // Aircall renverra la notification
  } catch (err) {
    console.error("aircall-webhook", (err as Error).message);
    return new Response("Erreur serveur", { status: 500 });
  }
});
