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
const isRealName = (n: string) => !!n && !/^[+\d\s().-]+$/.test(n) && !/club\s*pilates|allo/i.test(n);

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
          if (li.id && p.appels.some((a: any) => idEq(a?.id, li.id))) { dedup++; continue; }
          const meta = "📞 Allo · " + (li.direction === "OUTBOUND" ? "appel sortant" : "appel entrant")
            + (li.duration ? " · " + Math.round(li.duration / 60) + " min" : "")
            + (li.result ? " · " + String(li.result).toLowerCase() : "") + " · import historique";
          let txt = meta + (summary ? "\n" + summary : "");
          if (transcript) {
            const room = TXT_MAX - txt.length - 40;
            if (room > 200) txt += "\n\n— Transcription —\n" + (transcript.length > room ? transcript.slice(0, room) + "\n…[transcription tronquée]" : transcript);
          }
          p.appels.push({ id: String(li.id || "").slice(0, 40), ts: String(li.date || now()).slice(0, 30), txt: txt.slice(0, TXT_MAX) });
          if (p.appels.length > 20) p.appels = p.appels.slice(-20);
          p.maj = now();
          added++;
        }
        if (!body?.pagination?.has_more) break;
      }
    }

    await admin.from("studios").upsert({ id: ROW_PROSPECTS, data: { ...(row?.data || {}), prospects: list }, updated_at: new Date().toISOString() });
    return json({ ok: true, numeros: alloNumbers, conversations: convs, fichesCreees: created, resumesAjoutes: added, dejaPresents: dedup, ignores: skipped });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
