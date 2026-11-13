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

// ═══════════════════════════════════════════════════════════════════════════
// Fiches prospects : une ligne par fiche (nov. 2026)
// Avant : toutes les fiches dans la seule ligne `_coach_prospects` (plusieurs Mo), réécrite en
// entier à chaque changement d'une fiche → quota d'écriture disque dépassé, base redémarrée.
// Après la bascule (SQL lancé par Paul) : table `coach_prospects` (une ligne par fiche) ; la ligne
// `_coach_prospects` ne garde que les réglages (epoch…) + `split:true`, et sa date reste la
// version de la liste (rev des téléphones, jeton d'écriture conditionnelle).
// Les fonctions gardent leur logique « lire la liste, la modifier, l'écrire si personne n'a écrit
// entre-temps » : seule cette couche sait où sont rangées les fiches. Tant que la bascule n'est
// pas faite, elle se comporte exactement comme avant (ligne unique).
// ═══════════════════════════════════════════════════════════════════════════
const ROW_P = "_coach_prospects";
// deno-lint-ignore no-explicit-any
export type PRow = { data: any; updated_at: string | null; split: boolean; snap: Map<string, string>; meta: string };

// Version de la liste, même écriture partout (les téléphones comparent des chaînes)
export const revStr = (x: unknown): string => { const t = x ? Date.parse(String(x)) : NaN; return isNaN(t) ? "" : new Date(t).toISOString(); };

// Empreinte d'une fiche insensible à l'ordre des champs (jsonb les réordonne) : deux fiches au
// même contenu ont la même empreinte, donc une fiche inchangée n'est jamais réécrite
// deno-lint-ignore no-explicit-any
const canon = (v: any): string => JSON.stringify(v, (_k, x) =>
  x && typeof x === "object" && !Array.isArray(x) ? Object.keys(x).sort().reduce((o: Record<string, unknown>, k) => { o[k] = x[k]; return o; }, {}) : x);
export const ficheKey = canon;

// deno-lint-ignore no-explicit-any
const metaOf = (data: any): Record<string, unknown> => { const m = { ...(data || {}) }; delete m.prospects; delete m.split; return m; };

// deno-lint-ignore no-explicit-any
export async function readProspectsRow(admin: any, tries = 0): Promise<PRow> {
  // Après la bascule : réglages + toutes les fiches en une seule lecture cohérente
  const { data: j, error: rerr } = await admin.rpc("coach_prospects_read");
  if (!rerr && j && j.meta && j.meta.split === true) {
    // deno-lint-ignore no-explicit-any
    const list: any[] = Array.isArray(j.prospects) ? j.prospects : [];
    const snap = new Map<string, string>();
    for (const p of list) if (p && p.id) snap.set(String(p.id), canon(p));
    const meta = metaOf(j.meta);
    return { data: { ...meta, prospects: list }, updated_at: j.updated_at ? String(j.updated_at) : null, split: true, snap, meta: canon(meta) };
  }
  // Avant la bascule : ligne unique (absente : migration douce depuis studios)
  const read = () => admin.from(STORE).select("data,updated_at").eq("id", ROW_P).maybeSingle();
  let { data: r, error } = await read();
  if (error) throw new Error("Stockage indisponible");
  if (!r) { await getRow(admin, ROW_P); ({ data: r } = await read()); }
  // La bascule est passée entre les deux lectures : on relit au nouveau format
  // (ou la lecture groupée a échoué alors que la bascule est faite). Jamais de liste vide par
  // défaut : après quelques essais, on s'arrête en erreur et l'appelant ne lit ni n'écrit rien.
  if (r?.data?.split === true) {
    if (tries >= 4) throw new Error("Stockage indisponible");
    await new Promise((res) => setTimeout(res, 250));
    return readProspectsRow(admin, tries + 1);
  }
  return { data: r?.data || {}, updated_at: r?.updated_at ? String(r.updated_at) : null, split: false, snap: new Map(), meta: "" };
}

// Écrit la liste si personne n'a écrit depuis `row` (lecture). Rend la nouvelle version, ou null
// en cas d'écriture concurrente (l'appelant relit et rejoue). Après la bascule, seules les fiches
// réellement modifiées, ajoutées ou retirées sont écrites.
// deno-lint-ignore no-explicit-any
export async function writeProspectsRow(admin: any, row: PRow, data: any): Promise<string | null> {
  if (!row.split) {
    if (!row.updated_at) { const at = new Date().toISOString(); const { error } = await putRow(admin, ROW_P, data); if (error) throw new Error("Stockage indisponible"); return at; }
    // Nouvelle version toujours différente de celle lue, même à la milliseconde (horloges décalées)
    const last = Date.parse(row.updated_at);
    const at = new Date(isNaN(last) ? Date.now() : Math.max(Date.now(), last + 1)).toISOString();
    const { data: upd, error } = await admin.from(STORE).update({ data, updated_at: at })
      .eq("id", ROW_P).eq("updated_at", row.updated_at).select("id,updated_at");
    if (error) throw new Error("Stockage indisponible");
    return upd && upd.length ? String(upd[0].updated_at || at) : null;
  }
  // deno-lint-ignore no-explicit-any
  const list: any[] = Array.isArray(data?.prospects) ? data.prospects : [];
  // deno-lint-ignore no-explicit-any
  const ups = new Map<string, any>();
  const seen = new Set<string>();
  for (const p of list) {
    if (!p || !p.id) continue;
    const id = String(p.id);
    seen.add(id);
    if (row.snap.get(id) !== canon(p)) ups.set(id, p); else ups.delete(id); // doublon d'id : le dernier l'emporte
  }
  const dels: string[] = [];
  for (const id of row.snap.keys()) if (!seen.has(id)) dels.push(id);
  const meta = metaOf(data);
  // Rien n'a changé : aucune écriture, la version reste celle lue
  if (!ups.size && !dels.length && canon(meta) === row.meta) return row.updated_at || new Date().toISOString();
  const { data: rev, error } = await admin.rpc("coach_prospects_apply", { p_token: row.updated_at, p_meta: meta, p_upserts: [...ups.values()], p_deletes: dels });
  if (error) throw new Error("Stockage indisponible");
  return rev ? String(rev) : null;
}
