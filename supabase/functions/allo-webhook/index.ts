// ═══════════════════════════════════════════════════════════════════════════
// Edge Function — allo-webhook
// ═══════════════════════════════════════════════════════════════════════════
// Reçoit les webhooks de la téléphonie Allo (withallo.com) et alimente les
// fiches prospects du CP Sales Coach (ligne _coach_prospects), par
// correspondance de numéro (9 derniers chiffres).
//
// Topics gérés (à cocher dans Allo → Settings → Webhooks) :
//  - call.completed  : résumé IA + transcription complète → fiche (créée si
//                      inconnue) ; si ALLO_API_KEY est posé, enrichit avec les
//                      infos captées par l'IA (extracted_data).
//  - sms.received / sms.sent : chaque SMS journalisé sur la fiche (créée sur
//                      SMS entrant inconnu).
//  - contact.created / contact.updated : fiche créée / nom générique amélioré.
//  - summary.updated : résumé corrigé dans Allo → corrigé sur la fiche.
//
// Secrets : ALLO_WEBHOOK_SECRET (signature Svix), ALLO_STUDIO (studio des
// fiches créées), ALLO_API_KEY (optionnel, enrichissement extracted_data).
// Déployée avec --no-verify-jwt. Livraison "at least once" → dédup par id.
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ROW_PROSPECTS = "_coach_prospects";
const TXT_MAX = 9000;
const SEP_TRANSCRIPT = "\n\n— Transcription —\n";

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}

const telKey = (s: unknown) => String(s ?? "").replace(/\D/g, "").slice(-9);
const idEq = (a: unknown, b: unknown) =>
  !!a && !!b && String(a).replace(/[^a-zA-Z0-9]/g, "") === String(b).replace(/[^a-zA-Z0-9]/g, "");

// Allo met VOTRE nom d'entreprise quand le contact est inconnu → on l'écarte
const isRealName = (n: string) => !!n && !/^[+\d\s().-]+$/.test(n) && !/club\s*pilates|allo/i.test(n);
// Correspondance email Allo → prénom du profil d'équipe (Sales Coach).
// Base en dur + extension par secret ALLO_REPS ("cle=Nom,cle2=Nom2",
// clé = début de l'email en minuscules/lettres seules). Inconnu → vide
// (mieux vaut pas de conseiller qu'un nom fantôme dans le classement).
const REP_DEFAULTS: Record<string, string> = { jeancharles: "JC", clement: "Clément", caroline: "Caroline" };
function resolveRep(email: unknown): string {
  const local = String(email || "").split("@")[0].toLowerCase().replace(/[^a-z]/g, "");
  if (!local) return "";
  const map: Record<string, string> = { ...REP_DEFAULTS };
  for (const pair of (Deno.env.get("ALLO_REPS") || "").split(",")) {
    const i = pair.indexOf("=");
    if (i > 0) map[pair.slice(0, i).trim().toLowerCase().replace(/[^a-z]/g, "")] = pair.slice(i + 1).trim();
  }
  for (const k of Object.keys(map)) if (k && local.startsWith(k)) return map[k];
  return "";
}


// Repli d'identification : le commercial se présente en début d'appel.
// On ne scanne que ses répliques (source USER) quand on les a, sinon
// l'ouverture de la transcription (250 premiers caractères).
function guessAuthor(userText: string): string {
  const t = String(userText || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/jean[\s-]?charles/.test(t)) return "JC";
  if (/\bclement\b/.test(t)) return "Clément";
  if (/\bcaroline\b/.test(t)) return "Caroline";
  return "";
}
function userSideText(transcriptions: unknown, fallback: string): string {
  if (Array.isArray(transcriptions)) {
    const mine = transcriptions.filter((x: any) => String(x?.source || "") === "USER").map((x: any) => String(x?.text || "")).join(" ");
    if (mine.trim()) return mine.slice(0, 400);
  }
  return String(fallback || "").slice(0, 250);
}

function entryTxt(meta: string, body: string, transcript: string): string {
  let t = meta + (body ? "\n" + body : "");
  if (transcript) {
    const room = TXT_MAX - t.length - 40;
    if (room > 200) {
      t += SEP_TRANSCRIPT + (transcript.length > room ? transcript.slice(0, room) + "\n…[transcription tronquée]" : transcript);
    }
  }
  return t.slice(0, TXT_MAX);
}

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
    const topic = String(evt.topic || "");
    const d = evt.data || {};
    const STUDIO = Deno.env.get("ALLO_STUDIO") || "";

    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: row } = await admin.from("studios").select("data").eq("id", ROW_PROSPECTS).maybeSingle();
    const list: any[] = (row?.data?.prospects as any[]) || [];
    const save = () =>
      admin.from("studios").upsert({ id: ROW_PROSPECTS, data: { ...(row?.data || {}), prospects: list }, updated_at: new Date().toISOString() });
    const findByKey = (k: string) => list.find((p) => telKey(p?.tel) === k);
    const now = () => new Date().toISOString();

    // ── 📞 Appel terminé : résumé + transcription (+ infos extraites via API) ──
    if (topic === "call.completed") {
      const summary = String(d.summary || "").trim();
      const transcript = String(d.concatenated_transcript || "").trim();
      const phone = d.type === "OUTBOUND" ? d.to : d.from_number;
      const key = telKey(phone);
      if (key.length < 9) return json({ ok: true, ignored: "numéro invalide" });
      const callId = String(d.id || "").slice(0, 40);
      const result = String(d.result || "");
      const author = resolveRep(d.user_email) || guessAuthor(userSideText(d.transcriptions, transcript));
      const meta0 = "📞 Allo · " + (d.type === "OUTBOUND" ? "appel sortant" : "appel entrant")
        + (d.length ? " · " + d.length : "") + (result ? " · " + result.toLowerCase() : "")
        + (author ? " · par " + author : "");

      // Enrichissement : infos que l'IA a captées pendant l'appel (clé API requise)
      let extraInfo = "";
      let extractedName = "";
      const apiKey = Deno.env.get("ALLO_API_KEY") || "";
      if (apiKey && callId) {
        try {
          const r = await fetch("https://api.withallo.com/v2/api/conversations/items/" + encodeURIComponent(callId), {
            headers: { Authorization: "Api-Key " + apiKey },
          });
          if (r.ok) {
            const body = await r.json();
            const it = body?.data ?? body;
            const c = it?.extracted_data?.contact;
            if (c) {
              const lines: string[] = [];
              if (c.name) { lines.push("Nom : " + c.name); extractedName = String(c.name); }
              if (Array.isArray(c.emails) && c.emails.filter(Boolean).length) lines.push("Email : " + c.emails.filter(Boolean).join(", "));
              if (c.company) lines.push("Société : " + c.company);
              if (c.address) lines.push("Adresse : " + c.address);
              if (lines.length) extraInfo = "\nℹ️ Captées par l'IA · " + lines.join(" · ");
            }
          }
        } catch (_e) { /* best effort */ }
      }

      const match = findByKey(key);
      if (!match) {
        const creatable =
          (d.type === "OUTBOUND" && !["BLOCKED", "FAILED", "FAILED_EXTERNAL", "CLOSED"].includes(result)) ||
          (d.type === "INBOUND" && ["ANSWERED", "VOICEMAIL", "TRANSFERRED_AI"].includes(result));
        if (!creatable) return json({ ok: true, matched: false, created: false });
        const telFr = key.length === 9 ? "0" + key : String(phone || "");
        const rawName = String((d.type === "OUTBOUND" ? d.to_name : d.from_name) || "").trim();
        const nom = isRealName(rawName) ? rawName : (isRealName(extractedName) ? extractedName : "Contact " + telFr);
        const voicemail = result === "VOICEMAIL";
        const p: any = {
          id: "p_allo_" + (callId || crypto.randomUUID().replace(/-/g, "").slice(0, 12)),
          nom: nom.slice(0, 80), tel: telFr,
          note: "Importé d'Allo" + (voicemail ? " · messagerie laissée" : ""),
          statut: "rappeler",
          rappel: voicemail ? new Date(Date.now() + 864e5).toISOString().slice(0, 10) : "",
          obj: "", fiche: "", pack: "", v2: "", fullCom: false, icId: "",
          appels: (summary || transcript)
            ? [{ id: callId, ts: String(d.start_date || evt.timestamp || now()).slice(0, 30), txt: entryTxt(meta0, summary + extraInfo, transcript) }]
            : [],
          rep: resolveRep(d.user_email), studio: STUDIO, ts: now(), maj: now(),
        };
        list.push(p);
        await save();
        return json({ ok: true, created: true, prospect: p.nom });
      }

      if (!summary && !transcript) return json({ ok: true, matched: true, ignored: "sans contenu" });
      match.appels = Array.isArray(match.appels) ? match.appels : [];
      const entryTs = String(d.start_date || evt.timestamp || now()).slice(0, 30);
      if ((callId && match.appels.some((a: any) => idEq(a?.id, callId)))
        || match.appels.some((a: any) => String(a?.ts || "") === entryTs)) return json({ ok: true, dedup: true });
      match.appels.push({ id: callId, ts: entryTs, txt: entryTxt(meta0, summary + extraInfo, transcript) });
      if (match.appels.length > 20) match.appels = match.appels.slice(-20);
      if (/^Contact 0/.test(String(match.nom || "")) && isRealName(extractedName)) match.nom = extractedName.slice(0, 80);
      match.maj = now();
      await save();
      return json({ ok: true, matched: true, prospect: String(match.nom || "") });
    }

    // ── 💬 SMS entrant / sortant : journalisé sur la fiche ──
    if (topic === "sms.received" || topic === "sms.sent") {
      const inbound = String(d.direction || "") === "INBOUND" || topic === "sms.received";
      const phone = inbound ? d.from_number : d.to_number;
      const key = telKey(phone);
      const content = String(d.content || "").trim();
      if (key.length < 9 || !content) return json({ ok: true, ignored: "sms sans contenu/numéro" });
      const msgId = String(d.id || "").slice(0, 40);
      const meta = inbound ? "💬 SMS reçu" : "💬 SMS envoyé" + (resolveRep(d.user_email) ? " par " + resolveRep(d.user_email) : "");
      const entry = { id: msgId, ts: String(d.sent_at || evt.timestamp || now()).slice(0, 30), txt: (meta + "\n" + content).slice(0, TXT_MAX) };
      const match = findByKey(key);
      if (match) {
        match.appels = Array.isArray(match.appels) ? match.appels : [];
        if (msgId && match.appels.some((a: any) => idEq(a?.id, msgId))) return json({ ok: true, dedup: true });
        match.appels.push(entry);
        if (match.appels.length > 20) match.appels = match.appels.slice(-20);
        match.maj = now();
        await save();
        return json({ ok: true, matched: true });
      }
      if (!inbound) return json({ ok: true, ignored: "sms sortant vers inconnu" });
      const telFr = "0" + key;
      const rawName = String(d.from_name || "").trim();
      const p: any = {
        id: "p_allo_" + (msgId || crypto.randomUUID().replace(/-/g, "").slice(0, 12)),
        nom: isRealName(rawName) ? rawName.slice(0, 80) : "Contact " + telFr,
        tel: telFr, note: "Importé d'Allo · SMS entrant", statut: "rappeler",
        rappel: new Date().toISOString().slice(0, 10),
        obj: "", fiche: "", pack: "", v2: "", fullCom: false, icId: "",
        appels: [entry], rep: resolveRep(d.user_email), studio: STUDIO, ts: now(), maj: now(),
      };
      list.push(p);
      await save();
      return json({ ok: true, created: true, prospect: p.nom });
    }

    // ── 👤 Contact Allo créé / modifié ──
    if (topic === "contact.created" || topic === "contact.updated") {
      const numbers: string[] = Array.isArray(d.numbers) ? d.numbers : [];
      const key = numbers.map(telKey).find((k) => k.length >= 9) || "";
      if (!key) return json({ ok: true, ignored: "contact sans numéro" });
      const nomC = (String(d.name || "") + " " + String(d.last_name || "")).trim();
      const match = findByKey(key);
      if (match) {
        if (/^Contact 0/.test(String(match.nom || "")) && isRealName(nomC)) {
          match.nom = nomC.slice(0, 80);
          match.maj = now();
          await save();
          return json({ ok: true, matched: true, renamed: nomC });
        }
        return json({ ok: true, matched: true });
      }
      if (topic !== "contact.created") return json({ ok: true, ignored: "contact inconnu modifié" });
      const email = Array.isArray(d.emails) && d.emails[0] ? String(d.emails[0]) : "";
      const p: any = {
        id: "p_alloc_" + String(d.id || crypto.randomUUID()).replace(/[^a-zA-Z0-9]/g, "").slice(-12),
        nom: isRealName(nomC) ? nomC.slice(0, 80) : "Contact 0" + key,
        tel: "0" + key,
        note: "Contact Allo" + (d.company ? " · " + String(d.company).slice(0, 40) : "") + (email ? " · " + email.slice(0, 60) : ""),
        statut: "rappeler", rappel: "",
        obj: "", fiche: "", pack: "", v2: "", fullCom: false, icId: "",
        appels: [], rep: "", studio: STUDIO, ts: now(), maj: now(),
      };
      list.push(p);
      await save();
      return json({ ok: true, created: true, prospect: p.nom });
    }

    // ── ✏️ Résumé corrigé dans Allo → corrigé sur la fiche ──
    if (topic === "summary.updated") {
      const cid = String(d.call_id || "");
      const content = String(d.content || "").trim();
      if (!cid || !content) return json({ ok: true, ignored: "sans contenu" });
      for (const p of list) {
        const a = (Array.isArray(p?.appels) ? p.appels : []).find((x: any) => idEq(x?.id, cid));
        if (!a) continue;
        if (a.sv && Number(a.sv) >= Number(d.version || 0)) return json({ ok: true, dedup: "version plus ancienne" });
        const old = String(a.txt || "");
        const metaLine = old.split("\n")[0] || "📞 Allo";
        const tIdx = old.indexOf(SEP_TRANSCRIPT);
        const transcriptPart = tIdx >= 0 ? old.slice(tIdx) : "";
        a.txt = (metaLine + "\n" + content + "\n✏️ Résumé corrigé dans Allo" + transcriptPart).slice(0, TXT_MAX);
        a.sv = Number(d.version || 1);
        p.maj = now();
        await save();
        return json({ ok: true, updated: true, prospect: String(p.nom || "") });
      }
      return json({ ok: true, matched: false });
    }

    return json({ ok: true, ignored: topic });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
