// ═══════════════════════════════════════════════════════════════════════════
// Contrat d'inscription (fiche + CGV) · nov. 2026
// · envoi d'e-mail par la boîte du studio (SMTP Google Workspace), Resend en secours
// · génération du PDF (pré-rempli, puis signé) à partir du modèle publié sur le site
// · IBAN chiffré au repos (AES-GCM), lisible seulement par un manager
// ═══════════════════════════════════════════════════════════════════════════

import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export const SITE = "https://clubpilates.isseo-dev.com/cp-sales-coach/";
const TEMPLATE_URL = SITE + "contrat-inscription-cgv.pdf";
export const BUCKET = "contrats";

// Boîte e-mail de chaque studio (expéditeur, réponse et copie), clé = studio normalisé (lettres seules)
export const STUDIO_MAIL: Record<string, string> = { lagarennecolombes: "Lagarennecolombes@clubpilates.fr" };
export const skey = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
export const studioMail = (studio: string) => STUDIO_MAIL[skey(studio)] || "";

export type Contrat = {
  token: string; pid: string; studio: string; nom: string; tel: string; email: string; naiss: string; adr: string;
  pack: string; montant: string; date: string; by: string; at: string;
  status: "envoye" | "signe"; signedAt?: string; file?: string; ibanEnc?: string; ibanLast?: string; bic?: string; ipHash?: string;
};
export const PACK_LBL: Record<string, string> = { "1": "Pack 4 classes/mois", "2": "Pack 8 classes/mois", "3": "Pack classes illimitées" };
export const rowId = (token: string) => "_contrat_" + token;
export const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");
export const esc = (t: string) => String(t).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c] || c));
const fr = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? d.slice(8) + "/" + d.slice(5, 7) + "/" + d.slice(0, 4) : "");
// Caractères imprimables par les polices standard (Latin-1 + euro) ; le reste est retiré
const ascii = (t: string) => String(t || "").normalize("NFC").replace(/[^\x20-\x7E\xA0-\xFF\u20AC]/g, "");

// ── E-mail ────────────────────────────────────────────────────────────────
export type Mail = { to: string; cc?: string[]; replyTo?: string; from?: string; subject: string; html: string; text: string; attachments?: { filename: string; base64: string }[] };
// SMTP de la boîte du studio (SMTP_USER / SMTP_PASS = mot de passe d'application Google) ; sinon Resend.
export async function sendMail(m: Mail, studio: string): Promise<{ ok: boolean; how: string; err?: string }> {
  const user = Deno.env.get("SMTP_USER") || "", pass = Deno.env.get("SMTP_PASS") || "";
  const fromName = "Club Pilates " + studio;
  if (user && pass) {
    try {
      const c = new SMTPClient({ connection: { hostname: Deno.env.get("SMTP_HOST") || "smtp.gmail.com", port: Number(Deno.env.get("SMTP_PORT")) || 465, tls: true, auth: { username: user, password: pass } } });
      await c.send({
        from: `${fromName} <${user}>`, to: m.to, cc: m.cc?.filter((x) => x && x.toLowerCase() !== m.to.toLowerCase()), replyTo: m.replyTo || user,
        subject: m.subject, content: m.text, html: m.html,
        attachments: (m.attachments || []).map((a) => ({ filename: a.filename, content: a.base64, encoding: "base64" as const, contentType: "application/pdf" })),
      });
      await c.close();
      return { ok: true, how: "smtp" };
    } catch (e) { console.warn("[contrat mail] smtp", String(e).slice(0, 200)); }
  }
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return { ok: false, how: "none", err: "Aucun service d'e-mail configuré" };
  const payload: Record<string, unknown> = { from: `${fromName} <noreply@isseo-dev.com>`, to: [m.to], subject: m.subject, html: m.html, text: m.text };
  if (m.cc?.length) payload.cc = m.cc;
  if (m.replyTo) payload.reply_to = m.replyTo;
  if (m.attachments?.length) payload.attachments = m.attachments.map((a) => ({ filename: a.filename, content: a.base64 }));
  try {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { console.warn("[contrat mail] resend", r.status, d?.message || ""); return { ok: false, how: "resend", err: "Le service d'e-mail a refusé l'envoi" }; }
    return { ok: true, how: "resend" };
  } catch (e) { console.warn("[contrat mail]", e); return { ok: false, how: "resend", err: "Envoi impossible" }; }
}

export function mailEnvoi(c: Contrat, who: string) {
  const first = c.nom.split(/\s+/)[0] || "", link = SITE + "signer.html?t=" + c.token, S = c.studio;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#1F2A44;line-height:1.5">
    <p>Bonjour ${esc(first)},</p>
    <p>Merci pour votre confiance et bienvenue chez <b>Club Pilates ${esc(S)}</b> !</p>
    <p>Votre fiche d'inscription est pré-remplie avec vos informations ; nos conditions générales de vente y sont jointes. Pour finaliser, il vous reste à la vérifier, renseigner vos coordonnées bancaires et signer en ligne, directement depuis votre téléphone :</p>
    <p style="text-align:center;margin:26px 0"><a href="${link}" style="display:inline-block;padding:14px 26px;border-radius:12px;background:#2F4C8A;color:#fff;font-weight:700;text-decoration:none">Vérifier et signer mon contrat</a></p>
    <p style="font-size:13px;color:#6B7590">Ce lien est personnel. Vous recevrez ensuite votre contrat signé en pièce jointe. Si vous préférez le papier, le document joint peut aussi être imprimé, complété et signé au studio.</p>
    <p>Une question ? Répondez simplement à ce message${who ? ", " + esc(who) + " vous répondra" : ""}.</p>
    <p>À très vite sur le Reformer,<br>L'équipe Club Pilates ${esc(S)}</p></div>`;
  const text = `Bonjour ${first},\n\nMerci pour votre confiance et bienvenue chez Club Pilates ${S} !\n\nVotre fiche d'inscription est pré-remplie ; nos conditions générales de vente y sont jointes. Pour finaliser, vérifiez-la, renseignez vos coordonnées bancaires et signez en ligne :\n${link}\n\nCe lien est personnel. Vous recevrez ensuite votre contrat signé en pièce jointe.\n\nUne question ? Répondez simplement à ce message.\n\nL'équipe Club Pilates ${S}`;
  return { subject: "Votre contrat d'inscription · Club Pilates " + S, html, text };
}
export function mailSigne(c: Contrat) {
  const first = c.nom.split(/\s+/)[0] || "", S = c.studio;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#1F2A44;line-height:1.5">
    <p>Bonjour ${esc(first)},</p>
    <p>Votre contrat d'inscription <b>Club Pilates ${esc(S)}</b> est signé. Vous le trouverez en pièce jointe, avec nos conditions générales de vente : conservez-le précieusement.</p>
    <p>Toute l'équipe a hâte de vous accueillir au studio !</p>
    <p>L'équipe Club Pilates ${esc(S)}</p></div>`;
  const text = `Bonjour ${first},\n\nVotre contrat d'inscription Club Pilates ${S} est signé. Vous le trouverez en pièce jointe, avec nos conditions générales de vente.\n\nToute l'équipe a hâte de vous accueillir au studio !\n\nL'équipe Club Pilates ${S}`;
  return { subject: "Votre contrat signé · Club Pilates " + S, html, text };
}
export const fileName = (nom: string) => "Contrat-Club-Pilates-" + ascii(nom).replace(/[^\w-]+/g, "-").slice(0, 40) + ".pdf";

// ── PDF ───────────────────────────────────────────────────────────────────
// Mêmes repères que dans l'assistant (index.html, contratBuild) : x en points, y mesuré depuis le haut de la page A4.
export type Signature = { pngBase64: string; iban: string; bic: string; at: string; ipHash: string };
export async function buildPdf(c: Contrat, sig?: Signature): Promise<Uint8Array> {
  const r = await fetch(TEMPLATE_URL);
  if (!r.ok) throw new Error("Modèle de contrat indisponible");
  const doc = await PDFDocument.load(await r.arrayBuffer());
  const font = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold), ital = await doc.embedFont(StandardFonts.HelveticaOblique);
  const pg = doc.getPages()[0], H = pg.getSize().height, ink = rgb(.12, .16, .28), bleu = rgb(.29, .47, .74);
  const T = (t: string, x: number, yTop: number, s = 10, f = font) => { if (t) pg.drawText(ascii(t), { x, y: H - yTop, size: s, font: f, color: ink }); };
  T(fr(c.date), 98, 51, 10, bold);
  T(c.nom, 172, 147, 11, bold); T(fr(c.naiss), 180, 173); T(c.adr, 135, 200); T(c.tel, 147, 228); T(c.email, 110, 255);
  const by = ({ "1": 342, "2": 366, "3": 389 } as Record<string, number>)[c.pack];
  if (by) pg.drawText("X", { x: 516, y: H - by, size: 13, font: bold, color: bleu });
  T(c.montant, 135, 587, 10, bold);
  T(c.studio, 352, 659, 7); T(fr(c.date), 470, 659, 7);
  if (sig) {
    pg.drawText("X", { x: 516, y: H - 518, size: 13, font: bold, color: bleu }); // J'accepte les CGV
    // IBAN : 27 cases en groupes de 4 (le dernier de 3), BIC : 11 cases
    const iban = sig.iban.replace(/\s+/g, "").toUpperCase();
    for (let i = 0; i < Math.min(iban.length, 27); i++) { const g = Math.floor(i / 4), k = i % 4, x = (118 + 81 * g + 18 * k + 5.5) / 1.25; pg.drawText(iban[i], { x, y: H - 630, size: 10, font: bold, color: ink }); }
    const bic = (sig.bic || "").replace(/\s+/g, "").toUpperCase(); // facultatif (le studio le retrouve depuis l'IBAN)
    for (let i = 0; i < Math.min(bic.length, 11); i++) { const x = (118 + 17.7 * i + 5.5) / 1.25; pg.drawText(bic[i], { x, y: H - 668, size: 10, font: bold, color: ink }); }
    pg.drawText("Lu et approuvé", { x: 95, y: H - 716, size: 11, font: ital, color: ink });
    try {
      const png = await doc.embedPng(Uint8Array.from(atob(sig.pngBase64), (ch) => ch.charCodeAt(0)));
      const maxW = 185, maxH = 58, sc = Math.min(maxW / png.width, maxH / png.height);
      pg.drawImage(png, { x: 330, y: H - 762, width: png.width * sc, height: png.height * sc });
    } catch (e) { console.warn("[contrat pdf] signature", e); }
    const foot = `Signé électroniquement le ${new Date(sig.at).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })} (Paris) par ${ascii(c.nom)} <${c.email}> · empreinte ${sig.ipHash.slice(0, 12)} · ref ${c.token.slice(0, 10)}`;
    pg.drawText(foot, { x: 40, y: 16, size: 6.2, font, color: rgb(.45, .5, .6) });
  }
  doc.setTitle("Contrat d'inscription Club Pilates · " + c.nom); doc.setSubject(sig ? "Contrat signe electroniquement" : "Fiche d'inscription et CGV");
  return await doc.save();
}
export const b64 = (u: Uint8Array) => { let s = ""; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); };

// ── IBAN / BIC ────────────────────────────────────────────────────────────
export function ibanOk(raw: string): string | null {
  const s = String(raw || "").replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s)) return null;
  const t = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  let m = 0; for (const d of t) m = (m * 10 + Number(d)) % 97;
  return m === 1 ? s : null;
}
export const bicOk = (raw: string) => { const s = String(raw || "").replace(/\s+/g, "").toUpperCase(); return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(s) ? s : null; };

// ── Chiffrement de l'IBAN au repos (AES-GCM, clé dérivée d'un secret serveur) ──
async function aesKey() {
  const secret = Deno.env.get("CONTRAT_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("cp-contrat|" + secret));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encrypt(t: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12)), k = await aesKey();
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(t)));
  return b64(iv) + "." + b64(ct);
}
export async function decrypt(s: string): Promise<string> {
  const [a, b] = String(s || "").split("."); if (!a || !b) return "";
  const un = (x: string) => Uint8Array.from(atob(x), (ch) => ch.charCodeAt(0));
  try { return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: un(a) }, await aesKey(), un(b))); } catch { return ""; }
}
export async function ipHash(req: Request): Promise<string> {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "inconnue";
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("cp-contrat-ip|" + ip));
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
