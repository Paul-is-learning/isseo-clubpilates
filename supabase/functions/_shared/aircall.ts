// ═══════════════════════════════════════════════════════════════════════════
// Aircall (téléphonie de Montpellier Lattes) · outils communs
// Les appels Aircall ENRICHISSENT les fiches Boost (source maîtresse) : jamais
// de fiche créée pour un numéro inconnu.
// ═══════════════════════════════════════════════════════════════════════════
// deno-lint-ignore-file no-explicit-any

export const AIRCALL_BASE = "https://api.aircall.io/v1";
export const AIRCALL_STUDIO = "Montpellier Lattes";

export function aircallHeaders(): Record<string, string> | null {
  const id = Deno.env.get("AIRCALL_API_ID") || "", tok = Deno.env.get("AIRCALL_API_TOKEN") || "";
  if (!id || !tok) return null;
  return { Authorization: "Basic " + btoa(id + ":" + tok), Accept: "application/json" };
}

export async function aircallGet(path: string): Promise<{ status: number; body: any }> {
  const H = aircallHeaders();
  if (!H) return { status: 0, body: null };
  const r = await fetch(AIRCALL_BASE + path, { headers: H, redirect: "manual" });
  if (!r.ok) { await r.body?.cancel(); return { status: r.status, body: null }; }
  try { return { status: r.status, body: await r.json() }; } catch { return { status: r.status, body: null }; }
}

export const telKey = (s: unknown) => String(s ?? "").replace(/\D/g, "").slice(-9);

// « 1 m 57 s », « 45 s »
export function fmtDur(sec: number) {
  const s = Math.max(0, Math.round(sec || 0));
  return s >= 60 ? Math.floor(s / 60) + " m " + (s % 60) + " s" : s + " s";
}

// Ligne de résumé d'un appel, au format des appels Allo (lue par le Sales Coach)
export function callMeta(c: any) {
  const out = c?.direction === "outbound";
  const answered = !!c?.answered_at;
  const who = String(c?.user?.name || "").trim().split(/\s+/)[0];
  const res = answered ? "décroché" : c?.voicemail ? "messagerie" : out ? "sans réponse" : "manqué";
  return "📞 Aircall · " + (out ? "appel sortant" : "appel entrant") + (answered && c?.duration ? " · " + fmtDur(c.duration) : "") + " · " + res + (who ? " · par " + who : "");
}

// Texte lisible d'une transcription Aircall, quelle que soit la forme exacte de la réponse
export function transcriptText(body: any): string {
  const t = body?.transcription ?? body?.data ?? body;
  const utts = t?.content?.utterances ?? t?.utterances ?? t?.content?.segments ?? null;
  if (Array.isArray(utts) && utts.length) {
    return utts.map((u: any) => {
      const who = /agent|internal|user/i.test(String(u?.participant_type ?? u?.speaker ?? "")) ? "Conseiller" : "Client";
      return who + " : " + String(u?.text ?? u?.content ?? "").trim();
    }).filter((l: string) => !/ : $/.test(l)).join("\n");
  }
  if (typeof t?.content === "string") return t.content;
  // Repli : toutes les chaînes « text » trouvées
  const acc: string[] = [];
  const walk = (o: any) => { if (!o || typeof o !== "object") return; for (const [k, v] of Object.entries(o)) { if (k === "text" && typeof v === "string") acc.push(v); else walk(v); } };
  walk(t);
  return acc.join(" ");
}

export const callTs = (c: any) => c?.started_at ? new Date(Number(c.started_at) * 1000).toISOString() : new Date().toISOString();

export async function aircallPost(path: string, body: unknown): Promise<{ status: number; body: any }> {
  const H = aircallHeaders();
  if (!H) return { status: 0, body: null };
  const r = await fetch(AIRCALL_BASE + path, { method: "POST", redirect: "manual", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const txt = await r.text();
  try { return { status: r.status, body: txt ? JSON.parse(txt) : null }; } catch { return { status: r.status, body: null }; }
}

// Utilisateur Aircall d'un conseiller du Sales Coach : mêmes prénoms (« Solène » = « Solène VASSEUR »)
export function matchAircallUser(users: any[], rep: string): any | null {
  const tok = (x: unknown) => String(x ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/[\s-]+/).filter(Boolean);
  const a = tok(rep);
  if (!a.length) return null;
  const pre = (x: string[], y: string[]) => x.length > 0 && x.every((t, i) => y[i] === t);
  return users.find((u) => { const b = tok(u?.name); return b.length && (pre(a, b) || pre(b, a)); }) || null;
}
