// ═════════════════════════════════════════════════
// 🧭 Situation du prospect : résumé automatique des derniers échanges
// (résumés et transcriptions Allo, notes Boost, commentaires de l'équipe,
// fiche de découverte), rédigé par Mistral et rangé sur la fiche (p.sum).
// Le résumé n'est recalculé que si la matière a changé (empreinte h) :
// une demande sur une fiche inchangée ne coûte aucun appel à l'IA.
// Champ serveur : jamais accepté depuis un téléphone (BOOST_FIELDS).
// ═════════════════════════════════════════════════

export const SUMMARY_STUDIOS = ["lagarennecolombes", "montpellierlattes"]; // déploiement progressif (demande de Paul)
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
const STATUTS: Record<string, string> = { rappeler: "à rappeler / contacté", essai: "séance d'essai réservée", venu: "venu en séance d'essai", abo: "client", unit: "a acheté une classe à l'unité (pas abonné)", perdu: "perdu" };

// Matière du résumé : contexte de la fiche + les 5 derniers échanges, du plus récent au plus ancien
// deno-lint-ignore no-explicit-any
const FR_DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const FR_MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
// « jeudi 29 oct. » depuis AAAA-MM-JJ (dates absolues : un résumé lu trois jours plus tard reste juste)
function frDate(d: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || "");
  if (!m) return d;
  const t = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return FR_DAYS[t.getUTCDay()] + " " + t.getUTCDate() + " " + FR_MONTHS[t.getUTCMonth()];
}
const parisDay = (iso: string) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
// Appel sans échange réel (messagerie, non décroché, moins de 20 s) : compté, jamais décrit
function isVoid(first: string): boolean {
  if (!/^📞/.test(first)) return false;
  if (!/answered|· décroché/.test(first)) return true;
  const m = /· (\d+) ?m(?:in)?(?: (\d+) ?s)?\b|· (\d+) ?s\b/.exec(first);
  if (!m) return false;
  const sec = m[3] ? +m[3] : (+m[1] || 0) * 60 + (+(m[2] || 0));
  return sec < 20;
}
export function buildDigest(p: any, nowIso = new Date().toISOString()): { text: string; n: number } {
  const items: { ts: string; txt: string }[] = [];
  let voids = 0, lastVoid = "";
  for (const a of (p.appels || [])) {
    const raw = String(a?.txt || "");
    const i = raw.indexOf(SEP_TRANSCRIPT);
    const head = (i >= 0 ? raw.slice(0, i) : raw).trim();
    const tr = i >= 0 ? raw.slice(i + SEP_TRANSCRIPT.length).trim() : "";
    const first = head.split("\n")[0];
    const body = head.split("\n").slice(1).join("\n").trim();
    if (isVoid(first) && !tr) { voids++; if (String(a?.ts || "") > lastVoid) lastVoid = String(a?.ts || ""); continue; }
    // La transcription (ce qui a vraiment été dit) avant le résumé automatique d'Allo, parfois approximatif
    let txt = first;
    if (tr) txt += "\nTranscription (source fiable) : " + tr.slice(0, MAX_ITEM - 300);
    if (body) txt += "\nRésumé automatique de l'appel (indicatif) : " + body;
    items.push({ ts: String(a?.ts || ""), txt: txt.slice(0, MAX_ITEM) });
  }
  // Notes Boost (une ligne par note, la plus récente en premier) et commentaires locaux
  const notes = String(p.bnotes || "").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 6);
  if (notes.length) items.push({ ts: "￿", txt: "Notes de l'équipe (la plus récente en premier) :\n" + notes.join("\n").slice(0, MAX_ITEM) });
  if (p.note) items.push({ ts: "￿", txt: "Commentaire : " + String(p.note).slice(0, 400) });
  if (!items.length && !p.fiche) return { text: "", n: 0 };
  items.sort((x, y) => y.ts.localeCompare(x.ts));
  const kept = items.slice(0, MAX_ITEMS);
  const today = parisDay(nowIso);
  const nom = String(p.nom || "").trim();
  const rap = !p.rappel ? "Aucun rappel programmé"
    : p.rappel < today ? "Rappel prévu le " + frDate(p.rappel) + (p.rappelH ? " à " + p.rappelH : "") + " : date passée, il n'a pas eu lieu, ce n'est plus un rendez-vous"
    : "Prochain rappel : " + frDate(p.rappel) + (p.rappelH ? " à " + p.rappelH + " (heure convenue)" : " (heure libre, à choisir par le commercial)");
  const ctx = [
    "Date du jour : " + frDate(today),
    "Prospect : " + nom + " (c'est la seule personne à rappeler ; tout autre prénom dans les échanges est un proche ou une erreur de transcription)",
    "Statut dans l'outil : " + (STATUTS[String(p.statut)] || String(p.statut || "")),
    p.pack ? "Pack : " + (PACKS[String(p.pack)] || p.pack) : "",
    rap,
    voids ? voids + " appel" + (voids > 1 ? "s" : "") + " sans échange (messagerie ou non décroché)" + (lastVoid ? ", le dernier le " + frDate(parisDay(lastVoid)) : "") : "",
    p.obj ? "Objectif noté : " + String(p.obj).slice(0, 200) : "",
    p.prof && Object.values(p.prof).some(Boolean) ? "Profil noté par le commercial : " + [["obj", "objectif"], ["doul", "douleurs/santé"], ["prat", "pratique"], ["contr", "contraintes"]].filter(([k]) => p.prof[k]).map(([k, l]) => l + " = " + String(p.prof[k]).slice(0, 140)).join(" ; ") : "",
    p.fiche ? "Fiche de découverte :\n" + String(p.fiche).slice(0, 1200) : "",
  ].filter(Boolean).join("\n");
  const text = (ctx + "\n\nDerniers échanges (le plus récent en premier) :\n\n" + kept.map((k, i) => "### Échange " + (i + 1) + "\n" + k.txt).join("\n\n")).slice(0, MAX_DIGEST);
  return { text, n: kept.length };
}

export const digestHash = (text: string) => hash(text);

const SYSTEM = `Tu es l'assistant commercial d'un studio Club Pilates (Reformer) en France. On te donne les derniers échanges avec un prospect (résumés et transcriptions d'appels, notes de l'équipe). Rédige la situation du prospect en 4 à 6 lignes courtes (la ligne « Profil : » et la ligne « À faire : » sont toujours présentes), en français, pour qu'un commercial sache en 10 secondes où il en est avant de le rappeler.
Ordre : 1) où en est le prospect et pourquoi (intéressé, hésite, attend, refuse) ; 2) OBLIGATOIRE, une ligne qui commence par « Profil : » et qui rassemble ce que l'on sait de la personne pour bien la suivre et la fidéliser : objectifs (se remuscler, perdre du poids, posture, souplesse, stress…), douleurs ou blessures, grossesse ou post-partum, état de santé évoqué, pratique sportive actuelle ou passée, centres d'intérêt, contraintes (horaires, budget, distance, enfants) ; si les échanges ne disent rien de tout cela, écris exactement « Profil : objectifs, douleurs et pratique pas encore connus · à demander au prochain échange » ; 3) ce qui a été promis ou convenu (pack, offre, rappel, séance d'essai) ; 4) la prochaine action conseillée, en une phrase qui commence par « À faire : ».
Règles absolues : n'invente rien, ne cite que ce qui est dans les échanges ; le plus récent prime en cas de contradiction ; toute date est absolue (« jeudi 29 oct. »), n'écris jamais « aujourd'hui », « hier », « demain », « ce soir » ou « cette semaine » ; ne propose jamais de rappeler à une date ou une heure déjà passée ; la ligne « À faire » nomme uniquement le prospect indiqué, jamais un autre prénom ; si un prochain rappel est indiqué, « À faire » le reprend tel quel ; pas de chiffres qui ne figurent pas dans le texte ; pas de formule de politesse, pas de titre, pas de puces ; une idée par ligne, chaque ligne séparée par un retour à la ligne (jamais tout sur une seule ligne) ; n'utilise jamais le tiret long ni le demi-cadratin (écris « · » ou une virgule) ; 110 mots maximum ; « vous » désigne l'équipe du studio. Si la matière est trop mince, écris une ligne factuelle, puis la ligne « Profil : » et la ligne « À faire : ».`;

// Tout sur une ligne malgré la consigne : une phrase par ligne, « À faire : » toujours isolé
export function splitLines(t: string): string {
  if (t.includes("\n")) return t;
  const parts = t.replace(/\s+(À faire\s*:)/i, "\n$1").split("\n");
  return parts.map((seg, i) => i === parts.length - 1 && /^À faire/i.test(seg) ? seg : seg.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÝÉÈ«(])/).join("\n")).join("\n");
}
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
      body: JSON.stringify({ model: "mistral-small-latest", messages: [{ role: "system", content: SYSTEM }, { role: "user", content: digest }], max_tokens: 400, temperature: 0.2 }),
      signal: ctl.signal,
    });
    if (!r.ok) {
      // Détail de la réponse Mistral (sans clé) dans les journaux : quota, capacité du modèle, plan…
      const body = (await r.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 300);
      console.error("mistral", r.status, body);
      if (r.status === 429) throw new RateLimited();
      throw new Error("Mistral " + r.status);
    }
    const d = await r.json();
    const text = noDash(String(d?.choices?.[0]?.message?.content || "").trim()).replace(/^[-•*]\s*/gm, "").replace(/\n{2,}/g, "\n").trim();
    if (!text) throw new Error("Réponse vide");
    return splitLines(text).slice(0, 1000);
  } finally { clearTimeout(t); }
}

// Met à jour p.sum si nécessaire. Renvoie : "same" (matière inchangée), "empty" (rien à résumer),
// "updated" (nouveau résumé). force = recalcul demandé par l'équipe même si rien n'a changé.
// p.sum = { txt, h (empreinte de la matière), n (échanges retenus), at (date du résumé) }
// deno-lint-ignore no-explicit-any
const RELATIVE = /\b(aujourd'hui|hier|demain|ce soir|ce matin|cet après-midi|cette semaine)\b/i;
export async function refreshSummary(p: any, force = false): Promise<"same" | "empty" | "updated"> {
  const now = new Date().toISOString();
  const { text, n } = buildDigest(p, now);
  if (!text) { if (p.sum) delete p.sum; return "empty"; }
  const h = digestHash(text);
  if (!force && p.sum && p.sum.h === h) return "same"; // rien à enregistrer
  let txt = await summarize(text);
  // Garde-fou gratuit : une formule relative (« aujourd'hui »…) devient fausse dès le lendemain → une seule nouvelle demande
  if (RELATIVE.test(txt)) {
    const again = await summarize(text + "\n\nRappel de consigne : la version précédente contenait « " + (RELATIVE.exec(txt) || [""])[0] + " ». Réécris avec des dates absolues uniquement.").catch(() => "");
    if (again && !RELATIVE.test(again)) txt = again;
    else if (p.sum && p.sum.txt) { p.sum = { ...p.sum, h, at: now }; return "updated"; } // on garde l'ancien texte, matière marquée vue
  }
  p.sum = { txt, h, n, at: now };
  return "updated";
}
