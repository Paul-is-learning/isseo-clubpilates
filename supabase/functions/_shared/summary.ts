// ═════════════════════════════════════════════════
// 🧭 Situation du prospect : résumé automatique des derniers échanges
// (résumés et transcriptions Allo, notes Boost, commentaires de l'équipe,
// fiche de découverte), rédigé par Mistral et rangé sur la fiche (p.sum).
// Le résumé n'est recalculé que si la matière a changé (empreinte h) :
// une demande sur une fiche inchangée ne coûte aucun appel à l'IA.
// Champ serveur : jamais accepté depuis un téléphone (BOOST_FIELDS).
// ═════════════════════════════════════════════════

export const SUMMARY_STUDIOS = ["lagarennecolombes"]; // déploiement progressif (demande de Paul)
const MAX_ITEMS = 5; // derniers échanges retenus
const MAX_ITEM = 1800; // caractères par échange
const MAX_DIGEST = 7000;
const SEP_TRANSCRIPT = "\n\n— Transcription —\n";

export const skStudio = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
export const summaryOn = (studio: unknown) => SUMMARY_STUDIOS.includes(skStudio(studio));

// Tiret long / demi-cadratin : jamais dans un texte affiché
const noDash = (s: string) => s.replace(/\s*[—–]\s*/g, " · ");

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + "." + s.length.toString(36);
}

const PACKS: Record<string, string> = { "1": "Pack 4 (1x/semaine)", "2": "Pack 8 (2x/semaine)", "3": "Pack illimité" };
const STATUTS: Record<string, string> = { rappeler: "à rappeler / contacté", essai: "séance d'essai réservée", venu: "venu en séance d'essai", abo: "client", perdu: "perdu" };

// Matière du résumé : contexte de la fiche + les 5 derniers échanges, du plus récent au plus ancien
// deno-lint-ignore no-explicit-any
export function buildDigest(p: any): { text: string; n: number } {
  const items: { ts: string; txt: string }[] = [];
  for (const a of (p.appels || [])) {
    const raw = String(a?.txt || "");
    const i = raw.indexOf(SEP_TRANSCRIPT);
    const head = (i >= 0 ? raw.slice(0, i) : raw).trim();
    const tr = i >= 0 ? raw.slice(i + SEP_TRANSCRIPT.length).trim() : "";
    const first = head.split("\n")[0];
    const body = head.split("\n").slice(1).join("\n").trim();
    // SMS et appels sans contenu : un simple repère daté
    let txt = first;
    if (body) txt += "\n" + body;
    if (tr) txt += "\nTranscription : " + tr;
    items.push({ ts: String(a?.ts || ""), txt: txt.slice(0, MAX_ITEM) });
  }
  // Notes Boost (une ligne par note, la plus récente en premier) et commentaires locaux
  const notes = String(p.bnotes || "").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 6);
  if (notes.length) items.push({ ts: "￿", txt: "Notes de l'équipe (la plus récente en premier) :\n" + notes.join("\n").slice(0, MAX_ITEM) });
  if (p.note) items.push({ ts: "￿", txt: "Commentaire : " + String(p.note).slice(0, 400) });
  if (!items.length && !p.fiche) return { text: "", n: 0 };
  items.sort((x, y) => y.ts.localeCompare(x.ts));
  const kept = items.slice(0, MAX_ITEMS);
  const ctx = [
    "Prospect : " + String(p.nom || "").trim(),
    "Statut dans l'outil : " + (STATUTS[String(p.statut)] || String(p.statut || "")),
    p.pack ? "Pack : " + (PACKS[String(p.pack)] || p.pack) : "",
    p.rappel ? "Rappel programmé : " + p.rappel + (p.rappelH ? " " + p.rappelH : "") + (p.rappelBy ? " (posé par " + p.rappelBy + ")" : "") : "Aucun rappel programmé",
    p.obj ? "Objectif noté : " + String(p.obj).slice(0, 200) : "",
    p.fiche ? "Fiche de découverte :\n" + String(p.fiche).slice(0, 1200) : "",
  ].filter(Boolean).join("\n");
  const text = (ctx + "\n\nDerniers échanges (le plus récent en premier) :\n\n" + kept.map((k, i) => "### Échange " + (i + 1) + "\n" + k.txt).join("\n\n")).slice(0, MAX_DIGEST);
  return { text, n: kept.length };
}

export const digestHash = (text: string) => hash(text);

const SYSTEM = `Tu es l'assistant commercial d'un studio Club Pilates (Reformer) en France. On te donne les derniers échanges avec un prospect (résumés et transcriptions d'appels, notes de l'équipe). Rédige la situation du prospect en 4 à 6 lignes courtes, en français, pour qu'un commercial sache en 10 secondes où il en est avant de le rappeler.
Ordre : 1) où en est le prospect et pourquoi (intéressé, hésite, attend, refuse) ; 2) son profil utile à la vente (pratique actuelle, objectif, contraintes, budget) ; 3) ce qui a été promis ou convenu (pack, offre, rappel, séance d'essai) ; 4) la prochaine action conseillée, en une phrase qui commence par « À faire : ».
Règles absolues : n'invente rien, ne cite que ce qui est dans les échanges ; le plus récent prime en cas de contradiction ; pas de chiffres qui ne figurent pas dans le texte ; pas de formule de politesse, pas de titre, pas de puces, une idée par ligne ; n'utilise jamais le tiret long ni le demi-cadratin (écris « · » ou une virgule) ; 90 mots maximum ; « vous » désigne l'équipe du studio. Si la matière est trop mince, écris une seule ligne factuelle.`;

// Appel Mistral : renvoie le texte, ou lève une erreur (clé absente, API en erreur)
export class RateLimited extends Error { constructor() { super("Mistral 429"); } }
export async function summarize(digest: string): Promise<string> {
  const key = Deno.env.get("MISTRAL_API_KEY");
  if (!key) throw new Error("Clé Mistral absente");
  // Plan gratuit Mistral : 1 requête par seconde. Un 429 est retenté une fois après 2 s
  for (let attempt = 0; ; attempt++) {
    try { return await mistralCall(key, digest); }
    catch (e) { if (e instanceof RateLimited && attempt === 0) { await new Promise((r) => setTimeout(r, 2000)); continue; } throw e; }
  }
}
async function mistralCall(key: string, digest: string): Promise<string> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "mistral-small-latest", messages: [{ role: "system", content: SYSTEM }, { role: "user", content: digest }], max_tokens: 320, temperature: 0.2 }),
      signal: ctl.signal,
    });
    if (r.status === 429) throw new RateLimited();
    if (!r.ok) throw new Error("Mistral " + r.status);
    const d = await r.json();
    const text = noDash(String(d?.choices?.[0]?.message?.content || "").trim()).replace(/^[-•*]\s*/gm, "").replace(/\n{2,}/g, "\n").trim();
    if (!text) throw new Error("Réponse vide");
    return text.slice(0, 900);
  } finally { clearTimeout(t); }
}

// Met à jour p.sum si nécessaire. Renvoie : "same" (matière inchangée), "empty" (rien à résumer),
// "updated" (nouveau résumé). force = recalcul demandé par l'équipe même si rien n'a changé.
// p.sum = { txt, h (empreinte de la matière), n (échanges retenus), at (date du résumé) }
// deno-lint-ignore no-explicit-any
export async function refreshSummary(p: any, force = false): Promise<"same" | "empty" | "updated"> {
  const now = new Date().toISOString();
  const { text, n } = buildDigest(p);
  if (!text) { if (p.sum) delete p.sum; return "empty"; }
  const h = digestHash(text);
  if (!force && p.sum && p.sum.h === h) return "same"; // rien à enregistrer
  const txt = await summarize(text);
  p.sum = { txt, h, n, at: now };
  return "updated";
}
