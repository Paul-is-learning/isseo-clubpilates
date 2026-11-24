// ═══════════════════════════════════════════════════════════════════════════
// Journal des échanges dans les notes Boost (demande de Paul, 24 nov. 2026)
// L'API de Fitness Boost n'a pas d'entrée pour enregistrer un appel, un SMS ou un e-mail :
// en attendant, chaque échange passé depuis nos outils ajoute UNE ligne en tête des notes du
// contact Boost, par exemple « 📞 24/11 14:32 · appel sortant · 3 m 12 s · décroché · Caroline ».
// Jamais de résumé, de transcription ni de contenu de message : uniquement le fait et sa durée.
//
// Les notes Boost sont limitées à 2 000 caractères : au plus 12 lignes de journal sont gardées,
// les plus anciennes sont retirées en premier, et une note écrite par l'équipe n'est jamais coupée.
// L'envoi lui-même est fait par boost-push (file p.bqi, comme une note saisie dans l'outil).
// ═══════════════════════════════════════════════════════════════════════════
const OURS = /^(?:📞|💬|✉️) \d{2}\/\d{2} \d{2}:\d{2} · /u;
const MAX_LINES = 12, MAX_LEN = 2000;

const stampOf = (ts: unknown): string => {
  const t = new Date(String(ts || "")), d = isNaN(t.getTime()) ? new Date() : t;
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d).replace(",", "");
};

// « 📞 Allo · appel sortant · 1 m 49 s · décroché · par Noa » → « appel sortant · 1 m 49 s · décroché · Noa »
export const callDetail = (meta: unknown): string =>
  String(meta || "").split("\n")[0].replace(/^📞\s*(?:Allo|Aircall)\s*·\s*/u, "").replace(/ · import historique/, "").replace(/ · par /, " · ").trim().slice(0, 120);

// Ajoute la ligne aux notes Boost de la fiche et met l'envoi en file. Rend false si rien n'est à faire
// (fiche non liée à Boost, ligne déjà présente, ou notes de l'équipe trop longues pour accueillir la ligne).
// deno-lint-ignore no-explicit-any
export function boostJournal(p: any, kind: "appel" | "sms" | "email", ts: unknown, detail: string): boolean {
  if (!p || !p.bid) return false;
  const ic = kind === "appel" ? "📞" : kind === "sms" ? "💬" : "✉️";
  const line = (ic + " " + stampOf(ts) + " · " + String(detail || "").replace(/\s+/g, " ").trim()).slice(0, 160);
  const lines = String(p.bnotes || "").split("\n");
  if (lines.includes(line)) return false;
  let out = [line, ...lines.filter((l) => l !== "")];
  const ours = () => out.map((l, i) => (OURS.test(l) ? i : -1)).filter((i) => i >= 0);
  // Les plus anciennes lignes de journal (les plus basses) partent en premier
  while (ours().length > MAX_LINES || (out.join("\n").length > MAX_LEN && ours().length > 1)) { const o = ours(); out.splice(o[o.length - 1], 1); }
  if (out.join("\n").length > MAX_LEN) return false; // notes de l'équipe déjà pleines : on ne coupe rien
  if (out[0] !== line) return false;
  p.bnotes = out.join("\n");
  p.bqi = { ...(p.bqi || {}), nom: p.nom, tel: p.tel, email: p.email || "", notes: p.bnotes, at: new Date().toISOString(), by: "journal" };
  return true;
}
