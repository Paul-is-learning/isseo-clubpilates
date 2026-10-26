// ═══════════════════════════════════════════════════════════════════════════
// Stockage commercial réservé au serveur (oct. 2026)
// Les lignes du Sales Coach (_coach_prospects, _coach_access, _coach_stats,
// _ic_data, _training) quittent la table `studios`, lisible par chaque
// session isseo, pour `coach_store` : RLS active, aucune policy, donc
// accessible uniquement avec la clé service role des fonctions serveur.
// Migration douce : à la première lecture d'une ligne absente de
// coach_store, on la recopie depuis `studios` (le nettoyage final est une
// migration SQL lancée par Paul, qui recopie le reste puis supprime).
// ═══════════════════════════════════════════════════════════════════════════

const STORE = "coach_store";

// deno-lint-ignore no-explicit-any
export async function getRow(admin: any, id: string): Promise<any> {
  const { data, error } = await admin.from(STORE).select("data").eq("id", id).maybeSingle();
  if (error) throw new Error("Stockage indisponible");
  if (data) return data.data || {};
  const { data: old } = await admin.from("studios").select("data").eq("id", id).maybeSingle();
  const d = old?.data || {};
  await admin.from(STORE).upsert({ id, data: d, updated_at: new Date().toISOString() }, { onConflict: "id", ignoreDuplicates: true });
  const { data: again } = await admin.from(STORE).select("data").eq("id", id).maybeSingle();
  return again?.data || d;
}

// deno-lint-ignore no-explicit-any
export function putRow(admin: any, id: string, data: unknown) {
  return admin.from(STORE).upsert({ id, data, updated_at: new Date().toISOString() });
}

// Comparaison à temps constant (codes, clés)
export function safeEq(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

// ── Limite d'essais par adresse IP (hachée, jamais stockée en clair) ──
const RL_ROW = "_auth_rl";
const RL_MAX = 8;                    // échecs tolérés…
const RL_WINDOW = 15 * 60 * 1000;    // …sur 15 minutes
const RL_BLOCK = 15 * 60 * 1000;     // puis blocage 15 minutes

async function ipKey(req: Request): Promise<string> {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "inconnue";
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("cp-rl|" + ip));
  return Array.from(new Uint8Array(h)).slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type RateLimit = { blocked: boolean; fail: () => Promise<void>; ok: () => Promise<void> };

// deno-lint-ignore no-explicit-any
export async function rateLimit(admin: any, req: Request): Promise<RateLimit> {
  const key = await ipKey(req);
  const { data } = await admin.from(STORE).select("data").eq("id", RL_ROW).maybeSingle();
  const map: Record<string, { n: number; first: number; until?: number }> = data?.data?.ips || {};
  const now = Date.now();
  const cur = map[key];
  const save = () => {
    for (const k of Object.keys(map)) if (now - (map[k].until || map[k].first) > 24 * 3600 * 1000) delete map[k];
    return putRow(admin, RL_ROW, { ips: map });
  };
  return {
    blocked: !!(cur && cur.until && cur.until > now),
    fail: async () => {
      const e = cur && now - cur.first < RL_WINDOW ? cur : { n: 0, first: now };
      e.n++;
      if (e.n >= RL_MAX) e.until = now + RL_BLOCK;
      map[key] = e;
      await save();
    },
    ok: async () => { if (cur) { delete map[key]; await save(); } },
  };
}
