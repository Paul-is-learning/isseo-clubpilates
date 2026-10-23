// ═══════════════════════════════════════════════════════════════════════════
// Edge Function — allo-backfill (import rétroactif, à lancer à la main)
// ═══════════════════════════════════════════════════════════════════════════
// Parcourt l'historique des conversations Allo via leur API REST et remplit
// les fiches prospects : dernière activité de chaque contact (résumé +
// transcription du dernier appel), fiche créée si le numéro est inconnu.
//
// Auth d'appel : header `x-admin-code` = secret COACH_CODE (le code maître).
// Secrets requis : ALLO_API_KEY (scope CONVERSATIONS_READ), ALLO_STUDIO.
// Déployée avec --no-verify-jwt. Relançable sans doublons (dédup par id).
//
// Usage :
//   curl -X POST https://<ref>.supabase.co/functions/v1/allo-backfill \
//        -H "x-admin-code: VOTRE_CODE_MAITRE"
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ROW_PROSPECTS = "_coach_prospects";
const TXT_MAX = 9000;
const API = "https://api.withallo.com";

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
const telKey = (s: unknown) => String(s ?? "").replace(/\D/g, "").slice(-9);
const idEq = (a: unknown, b: unknown) =>
  !!a && !!b && String(a).replace(/[^a-zA-Z0-9]/g, "") === String(b).replace(/[^a-zA-Z0-9]/g, "");

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


serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST attendu" }, 405);
  try {
    const codeOk = (req.headers.get("x-admin-code") || "").trim().toUpperCase() ===
      (Deno.env.get("COACH_CODE") || "").trim().toUpperCase() && !!Deno.env.get("COACH_CODE");
    if (!codeOk) return json({ error: "Code administrateur invalide" }, 401);
    const apiKey = Deno.env.get("ALLO_API_KEY") || "";
    if (!apiKey) return json({ error: "ALLO_API_KEY non configuré" }, 500);
    const STUDIO = Deno.env.get("ALLO_STUDIO") || "";
    const H = { Authorization: "Api-Key " + apiKey };

    // 1. Les numéros Allo : passés en paramètre (?number=+33…), sinon via l'API
    //    (GET /numbers demande un scope supplémentaire → 403 avec une clé
    //    « lecture des conversations » seule, d'où le paramètre).
    let alloNumbers: string[] = [];
    const qNum = (new URL(req.url)).searchParams.get("number") || "";
    if (qNum) {
      alloNumbers = [qNum.startsWith("+") ? qNum : "+" + qNum.replace(/\D/g, "")];
    } else {
      const rNum = await fetch(API + "/v2/api/numbers", { headers: H });
      if (!rNum.ok) return json({ error: "GET /numbers → " + rNum.status + " · ajoutez ?number=%2B33XXXXXXXXX (votre ligne Allo) à l'URL, ou le scope numéros à la clé" }, 502);
      const numsBody = await rNum.text();
      alloNumbers = [...new Set(numsBody.match(/\+\d{8,15}/g) || [])].slice(0, 5);
    }
    if (!alloNumbers.length) return json({ error: "Aucun numéro Allo trouvé" }, 404);

    // 2. Les fiches actuelles
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: row } = await admin.from("studios").select("data").eq("id", ROW_PROSPECTS).maybeSingle();
    const list: any[] = (row?.data?.prospects as any[]) || [];
    const now = () => new Date().toISOString();

    let convs = 0, created = 0, added = 0, dedup = 0, skipped = 0;

    for (const alloNum of alloNumbers) {
      for (let page = 1; page <= 20; page++) {
        const r = await fetch(API + "/v2/api/conversations?allo_number=" + encodeURIComponent(alloNum)
          + "&page=" + page + "&size=50&extend=transcript", { headers: H });
        if (!r.ok) break;
        const body = await r.json();
        const data: any[] = body?.data || [];
        if (!data.length) break;
        for (const conv of data) {
          convs++;
          const li = conv?.last_item;
          const key = telKey(conv?.contact_number);
          if (key.length < 9) { skipped++; continue; }
          if (!li || li.type !== "CALL") { skipped++; continue; }
          const summary = String(li.summary || "").trim();
          let transcript = "";
          const t = li.transcript;
          if (typeof t === "string") transcript = t.trim();
          else if (Array.isArray(t)) transcript = t.map((x: any) => String(x?.text || x || "")).filter(Boolean).join("\n").trim();
          // Détail de l'appel : transcription + nom/email que l'IA a captés
          let exName = "", exEmail = "", author = "";
          if (li.id) {
            try {
              const rIt = await fetch(API + "/v2/api/conversations/items/" + encodeURIComponent(li.id) + "?extend=transcript", { headers: H });
              if (rIt.ok) {
                const bIt = await rIt.json();
                const it = bIt?.data ?? bIt;
                if (!transcript) {
                  const ct = it?.concatenated_transcript;
                  const tr = it?.transcript ?? it?.transcriptions;
                  if (typeof ct === "string" && ct.trim()) transcript = ct.trim();
                  else if (typeof tr === "string") transcript = tr.trim();
                  else if (Array.isArray(tr)) transcript = tr.map((x: any) => String(x?.text || x || "")).filter(Boolean).join("\n").trim();
                }
                author = resolveRep(it?.user_email)
                  || guessAuthor(userSideText(it?.transcriptions ?? it?.transcript, String(it?.concatenated_transcript || "")));
                const c = it?.extracted_data?.contact;
                if (c) {
                  exName = String(c.name || "").trim();
                  exEmail = Array.isArray(c.emails) ? String(c.emails.filter(Boolean)[0] || "") : "";
                }
              }
            } catch (_e) { /* best effort */ }
          }
          if (!summary && !transcript) { skipped++; continue; }

          let p = list.find((x) => telKey(x?.tel) === key);
          if (!p) {
            const cName = String(conv?.contacts?.[0]?.name || "").trim();
            p = {
              id: "p_allo_" + String(li.id || crypto.randomUUID()).replace(/[^a-zA-Z0-9]/g, "").slice(-12),
              nom: isRealName(cName) ? cName.slice(0, 80) : "Contact 0" + key,
              tel: "0" + key, note: "Importé d'Allo · historique", statut: "rappeler", rappel: "",
              obj: "", fiche: "", pack: "", v2: "", fullCom: false, icId: "",
              appels: [], rep: "", studio: STUDIO, ts: String(li.date || now()).slice(0, 30), maj: now(),
            };
            list.push(p);
            created++;
          }
          p.appels = Array.isArray(p.appels) ? p.appels : [];
          const existing = (li.id ? p.appels.find((a: any) => idEq(a?.id, li.id)) : null)
            || p.appels.find((a: any) => String(a?.ts || "") === String(li.date || "").slice(0, 30));
          if (/^Contact 0/.test(String(p.nom || "")) && isRealName(exName)) { p.nom = exName.slice(0, 80); p.maj = now(); }
          if (existing) {
            // Auteur manquant sur une entrée déjà importée → on complète la ligne méta
            if (author && String(existing.txt || "").split("\n")[0].indexOf("· par ") < 0) {
              const lines = String(existing.txt || "").split("\n");
              lines[0] = lines[0] + " · par " + author;
              existing.txt = lines.join("\n").slice(0, TXT_MAX);
              p.maj = now();
            }
            if (transcript && String(existing.txt || "").indexOf("— Transcription —") < 0) {
              const room = TXT_MAX - String(existing.txt).length - 40;
              if (room > 200) {
                existing.txt = (existing.txt + "\n\n— Transcription —\n" + (transcript.length > room ? transcript.slice(0, room) + "\n…[transcription tronquée]" : transcript)).slice(0, TXT_MAX);
                p.maj = now();
                added++;
                continue;
              }
            }
            dedup++;
            continue;
          }
          const meta = "📞 Allo · " + (li.direction === "OUTBOUND" ? "appel sortant" : "appel entrant")
            + (li.duration ? " · " + Math.round(li.duration / 60) + " min" : "")
            + (li.result ? " · " + String(li.result).toLowerCase() : "")
            + (author ? " · par " + author : "") + " · import historique";
          let txt = meta + (summary ? "\n" + summary : "");
          if (transcript) {
            const room = TXT_MAX - txt.length - 40;
            if (room > 200) txt += "\n\n— Transcription —\n" + (transcript.length > room ? transcript.slice(0, room) + "\n…[transcription tronquée]" : transcript);
          }
          p.appels.push({ id: String(li.id || "").slice(0, 40), ts: String(li.date || now()).slice(0, 30), txt: txt.slice(0, TXT_MAX) });
          if (p.appels.length > 20) p.appels = p.appels.slice(-20);
          if (/^Contact 0/.test(String(p.nom || "")) && isRealName(exName)) p.nom = exName.slice(0, 80);
          if (exEmail && String(p.note || "").indexOf("@") < 0) p.note = (String(p.note || "") + " · " + exEmail).slice(0, 200);
          p.maj = now();
          added++;
        }
        if (!body?.pagination?.has_more) break;
      }
    }

    // Nettoyage : doublons d'entrées (même horodatage) → on garde la plus riche
    let dedupliques = 0;
    for (const p of list) {
      if (!Array.isArray(p?.appels) || p.appels.length < 2) continue;
      const byTs = new Map<string, any>();
      for (const a of p.appels) {
        const k = String(a?.ts || "") + "|" + String(a?.txt || "").split("\n")[0].slice(0, 50);
        const prev = byTs.get(k);
        if (!prev) { byTs.set(k, a); continue; }
        dedupliques++;
        const richer = String(a?.txt || "").length > String(prev?.txt || "").length ? a : prev;
        if (!richer.id && (a?.id || prev?.id)) richer.id = a?.id || prev?.id;
        byTs.set(k, richer);
      }
      if (byTs.size !== p.appels.length) {
        p.appels = [...byTs.values()].sort((x: any, y: any) => String(x?.ts || "").localeCompare(String(y?.ts || "")));
        p.maj = new Date().toISOString();
      }
    }

    // Réparation : les conseillers fantômes fabriqués depuis un email Allo
    // (ex. « Jeancharlesclubpilates ») sont remappés vers le vrai prénom, ou vidés.
    let repares = 0;
    for (const p of list) {
      const r = String(p?.rep || "");
      if (!r || /\s/.test(r) || r.length <= 12) continue;
      const mapped = resolveRep(r + "@x");
      if (mapped && mapped !== r) { p.rep = mapped; p.maj = new Date().toISOString(); repares++; }
      else if (/clubpilates|allo/i.test(r)) { p.rep = ""; p.maj = new Date().toISOString(); repares++; }
    }
    await admin.from("studios").upsert({ id: ROW_PROSPECTS, data: { ...(row?.data || {}), prospects: list }, updated_at: new Date().toISOString() });
    return json({ ok: true, numeros: alloNumbers, conversations: convs, fichesCreees: created, resumesAjoutes: added, dejaPresents: dedup, ignores: skipped, conseillersRepares: repares, appelsDedupliques: dedupliques });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
