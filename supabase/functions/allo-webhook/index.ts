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
import { getRow, putRow } from "../_shared/store.ts";

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




// ── Détection d'une demande de rappel dans ce qui s'est dit ──
// « rappelez-moi demain à 14h », « plutôt vendredi en fin de journée »…
// Fenêtre de 140 caractères après un verbe de rappel pour éviter les faux
// positifs (« j'ai cours à 14h »). N'applique que des dates aujourd'hui/futures.
const DAYS_FR: Record<string, number> = { dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6 };
function detectRappel(text: string, baseIso: string): { date: string; h: string } | null {
  const t = String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const base = baseIso ? new Date(baseIso) : new Date();
  if (isNaN(base.getTime())) return null;
  const re = /(rappel|rappeler|rappelez|rappelle|recontact|relanc|joignable|disponible)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const win = t.slice(m.index, m.index + 140);
    let dayOff: number | null = null;
    let h = "";
    if (/apres[- ]demain/.test(win)) dayOff = 2;
    else if (/\bdemain\b/.test(win)) dayOff = 1;
    else if (/semaine prochaine/.test(win)) dayOff = 7;
    else {
      const dm = win.match(/\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/);
      if (dm) { const target = DAYS_FR[dm[1]]; dayOff = ((target - base.getDay()) + 7) % 7 || 7; }
    }
    const hm = win.match(/(\d{1,2})\s*h\s*(\d{2})?/) || win.match(/(\d{1,2}):(\d{2})/);
    if (hm) { const hh = Math.min(23, +hm[1]); const mm = hm[2] ? Math.min(59, +hm[2]) : 0; if (hh >= 7 && hh <= 21) h = String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0"); }
    if (!h) {
      if (/fin de journee|ce soir|en soiree/.test(win)) h = "18:00";
      else if (/fin de matinee/.test(win)) h = "11:30";
      else if (/\bmidi\b/.test(win)) h = "12:00";
      else if (/apres[- ]midi/.test(win)) h = "14:30";
      else if (/\bmatin\b/.test(win)) h = "10:00";
    }
    if (dayOff === null && !h) continue;
    const d2 = new Date(base);
    d2.setDate(d2.getDate() + (dayOff ?? 0));
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    if (d2.getTime() < today.getTime()) continue;
    const dateS = new Date(d2.getTime() + 2 * 3600000).toISOString().slice(0, 10); // ≈ heure de Paris
    return { date: dateS, h };
  }
  return null;
}


// Instant d'un horodatage Allo à la minute : UTC, « Z » présent ou non
// (10:13:45Z et 10:13:45 désignent le même appel).
const tsMin = (s: unknown): string => {
  let x = String(s || "");
  if (!/[zZ]|[+-]\d\d:?\d\d$/.test(x)) x += "Z";
  const t = Date.parse(x);
  return isNaN(t) ? x.slice(0, 16) : String(Math.floor(t / 60000));
};

// Propriétaire de la ligne Allo : identification déterministe fournie par Paul.
// Ligne 01 88 83 34 18 → JC · ligne 07 45 80 42 39 → Caroline.
// Extensible par secret ALLO_LINES ("33612345678=Nom,…", chiffres seuls).
const LINE_DEFAULTS: Record<string, string> = { "33188833418": "JC", "33745804239": "Caroline" };
function lineOwner(num: unknown): string {
  const k = String(num || "").replace(/\D/g, "");
  if (k.length < 9) return "";
  const map: Record<string, string> = { ...LINE_DEFAULTS };
  for (const pair of (Deno.env.get("ALLO_LINES") || "").split(",")) {
    const i = pair.indexOf("=");
    if (i > 0) map[pair.slice(0, i).replace(/\D/g, "")] = pair.slice(i + 1).trim();
  }
  for (const key of Object.keys(map)) {
    if (key && (k.endsWith(key.slice(-9)) || key.endsWith(k.slice(-9)))) return map[key];
  }
  return "";
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
    const STUDIO = Deno.env.get("ALLO_STUDIO") || "La Garenne-Colombes";

    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const row = { data: await getRow(admin, ROW_PROSPECTS) };
    const list: any[] = (row?.data?.prospects as any[]) || [];
    const save = () =>
      putRow(admin, ROW_PROSPECTS, { ...(row?.data || {}), prospects: list });
    // Préférer la fiche du studio de la ligne ; une fiche trouvée sans studio y est rattachée
    const findByKey = (k: string) => {
      const same = list.filter((p) => telKey(p?.tel) === k);
      const f = same.find((p) => String(p?.studio || "") === STUDIO) || same[0];
      if (f && !String(f.studio || "").trim()) f.studio = STUDIO;
      return f;
    };
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
      // Identification par la LIGNE utilisée (01 → JC, 07 → Caroline) ; email en repli
      const author = lineOwner(d.type === "OUTBOUND" ? d.from_number : d.to) || resolveRep(d.user_email);
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

      const rdv = detectRappel(summary + " " + transcript, String(d.start_date || evt.timestamp || ""));
      if (rdv) extraInfo += "\n⏰ Rappel demandé : " + rdv.date + (rdv.h ? " à " + rdv.h : "");
      const applyRdv = (p: any) => {
        if (!rdv) return;
        if (p.statut !== "rappeler" && p.statut !== "essai") return;
        const todayS = new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 10);
        if (p.rappel && p.rappel >= todayS && !(p.rappel === rdv.date)) return; // rappel futur posé à la main → on ne touche pas
        p.rappel = rdv.date;
        if (rdv.h) p.rappelH = rdv.h;
        p.rappelBy = "auto";
      };
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
            ? [{ id: callId, ts: String(d.start_date || evt.timestamp || now()).slice(0, 30), rx: now(), txt: entryTxt(meta0, summary + extraInfo, transcript) }]
            : [],
          rep: author || "", studio: STUDIO, ts: now(), maj: now(),
        };
        applyRdv(p);
        list.push(p);
        await save();
        return json({ ok: true, created: true, prospect: p.nom });
      }

      if (!summary && !transcript) return json({ ok: true, matched: true, ignored: "sans contenu" });
      applyRdv(match);
      match.appels = Array.isArray(match.appels) ? match.appels : [];
      const entryTs = String(d.start_date || evt.timestamp || now()).slice(0, 30);
      if ((callId && match.appels.some((a: any) => idEq(a?.id, callId)))
        || match.appels.some((a: any) => !String(a?.txt || "").startsWith("💬") && tsMin(a?.ts) === tsMin(entryTs))) return json({ ok: true, dedup: true });
      match.appels.push({ id: callId, ts: entryTs, rx: now(), txt: entryTxt(meta0, summary + extraInfo, transcript) });
      if (match.appels.length > 20) match.appels = match.appels.slice(-20);
      if (/^Contact 0/.test(String(match.nom || "")) && isRealName(extractedName)) match.nom = extractedName.slice(0, 80);
      if (!String(match.rep || "") && author) match.rep = author;
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
      const smsAuthor = lineOwner(inbound ? d.to_number : d.from_number) || resolveRep(d.user_email);
      const meta = inbound ? "💬 SMS reçu" : "💬 SMS envoyé" + (smsAuthor ? " par " + smsAuthor : "");
      const entry = { id: msgId, ts: String(d.sent_at || evt.timestamp || now()).slice(0, 30), rx: now(), txt: (meta + "\n" + content).slice(0, TXT_MAX) };
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
        appels: [entry], rep: smsAuthor || "", studio: STUDIO, ts: now(), maj: now(),
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
