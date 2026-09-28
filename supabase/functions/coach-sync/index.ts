// ═══════════════════════════════════════════════════════════════════════════
// Edge Function — coach-sync
// ═══════════════════════════════════════════════════════════════════════════
// Stockage central des prospects du CP Sales Coach, SANS compte Supabase pour
// les salariés : l'accès est gardé par un code studio (secret COACH_CODE).
// La fonction ne sait lire/écrire QUE la ligne `_coach_prospects` — aucune
// autre donnée (BP, finances…) n'est accessible par ce chemin.
//
// Body: { code, action: 'ping'|'pull'|'push'|'delete', prospects?, ids? }
//  - ping   : valide le code (ouverture de l'outil)
//  - pull   : renvoie tous les prospects
//  - push   : upsert par id (dernier `maj` gagne)
//  - delete : supprime par ids
//
// Déployée avec --no-verify-jwt (pas de compte requis). Secret: COACH_CODE.
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const ROW_ID = "_coach_prospects";
const MAX_PROSPECTS = 5000;

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { code, action, prospects, ids } = await req.json();

    const COACH_CODE = Deno.env.get("COACH_CODE");
    if (!COACH_CODE) return json({ error: "COACH_CODE non configuré" }, 500);
    if (!code || String(code).trim().toUpperCase() !== COACH_CODE.trim().toUpperCase()) {
      return json({ error: "Code studio invalide" }, 401);
    }

    if (action === "ping") return json({ ok: true });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: row } = await admin.from("studios").select("data").eq("id", ROW_ID).maybeSingle();
    let list: any[] = (row?.data?.prospects as any[]) || [];

    if (action === "pull") return json({ ok: true, prospects: list });

    if (action === "push") {
      const incoming: any[] = Array.isArray(prospects) ? prospects : [];
      for (const p of incoming) {
        if (!p || !p.id) continue;
        // On ne garde que les champs attendus (pas de payload arbitraire)
        const clean = {
          id: String(p.id), nom: String(p.nom || ""), tel: String(p.tel || ""),
          note: String(p.note || ""), statut: String(p.statut || "rappeler"),
          rappel: String(p.rappel || ""), obj: String(p.obj || ""),
          fiche: String(p.fiche || "").slice(0, 4000),
          rep: String(p.rep || ""), studio: String(p.studio || ""),
          ts: String(p.ts || new Date().toISOString()),
          maj: String(p.maj || p.ts || new Date().toISOString()),
        };
        const i = list.findIndex((x) => x.id === clean.id);
        if (i < 0) list.push(clean);
        else if ((clean.maj || "") >= (list[i].maj || "")) list[i] = clean;
      }
      if (list.length > MAX_PROSPECTS) list = list.slice(-MAX_PROSPECTS);
      await admin.from("studios").upsert({ id: ROW_ID, data: { prospects: list }, updated_at: new Date().toISOString() });
      return json({ ok: true, prospects: list });
    }

    if (action === "delete") {
      const rm: string[] = Array.isArray(ids) ? ids.map(String) : [];
      list = list.filter((p) => !rm.includes(p.id));
      await admin.from("studios").upsert({ id: ROW_ID, data: { prospects: list }, updated_at: new Date().toISOString() });
      return json({ ok: true, prospects: list });
    }

    return json({ error: "Action inconnue" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message || "Erreur serveur" }, 500);
  }
});
