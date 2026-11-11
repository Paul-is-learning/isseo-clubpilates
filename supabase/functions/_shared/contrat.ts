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
const ascii = (t: string) => String(t || "").normalize("NFC").replace(/[^\x20-\x7E\xA0-\xFF\u20AC\u2022]/g, "");

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
    <p>Votre contrat d'inscription <b>Club Pilates ${esc(S)}</b> est signé. Vous le trouverez en pièce jointe, avec nos conditions générales de vente : conservez-le précieusement. Par sécurité, votre IBAN y est partiellement masqué.</p>
    <p>Toute l'équipe a hâte de vous accueillir au studio !</p>
    <p>L'équipe Club Pilates ${esc(S)}</p></div>`;
  const text = `Bonjour ${first},\n\nVotre contrat d'inscription Club Pilates ${S} est signé. Vous le trouverez en pièce jointe, avec nos conditions générales de vente. Par sécurité, votre IBAN y est partiellement masqué.\n\nToute l'équipe a hâte de vous accueillir au studio !\n\nL'équipe Club Pilates ${S}`;
  return { subject: "Votre contrat signé · Club Pilates " + S, html, text };
}
export const fileName = (nom: string) => "Contrat-Club-Pilates-" + ascii(nom).replace(/[^\w-]+/g, "-").slice(0, 40) + ".pdf";

// ── PDF ───────────────────────────────────────────────────────────────────
// Page 1 dessinée en vectoriel (lisible, moderne), page 2 = CGV du modèle publié sur le site.
export type Signature = { pngBase64: string; iban: string; bic?: string; at: string; ipHash: string; mask?: boolean };
// mask : copie e-mail · seuls les 4 premiers et 3 derniers caractères de l'IBAN restent lisibles (le contrat complet est dans le coffre).
export const STUDIO_LEGAL: Record<string, string> = {
  lagarennecolombes: "COBE LGC, EURL au capital de 100 €, siège 10 rue William Shakespeare, 78280 Guyancourt, SIREN 108 756 263, RCS Versailles, TVA FR86108756263, gérante Caroline Coquel",
};
const ENGAGEMENT = [
  "Engagement initial de 6 mois, puis reconduction tacite pour une durée indéterminée (préavis de 1 mois).",
  "Frais de résiliation pendant la période d'engagement : 100 € TTC, sauf motif légitime justifié.",
  "Annulation d'un cours gratuite jusqu'à 12 h avant · gel possible une fois par an (voir CGV, page 2).",
];
export async function buildPdf(c: Contrat, sig?: Signature): Promise<Uint8Array> {
  const [tr, lr] = await Promise.all([fetch(TEMPLATE_URL), fetch(SITE + "logo-cp.png")]);
  if (!tr.ok) throw new Error("Modèle de contrat indisponible");
  const tpl = await PDFDocument.load(await tr.arrayBuffer());
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold), ital = await doc.embedFont(StandardFonts.HelveticaOblique);
  const W = 595.32, H = 841.92, pg = doc.addPage([W, H]);
  const BLUE = rgb(.29, .47, .74), DEEP = rgb(.18, .3, .54), INK = rgb(.12, .16, .28), MUTED = rgb(.42, .47, .58), LINE = rgb(.80, .85, .92), PANEL = rgb(.95, .97, .99), WHITE = rgb(1, 1, 1);
  const M = 44, CW = W - 2 * M; // marge, largeur utile
  const y = (top: number) => H - top;
  const txt = (t: string, x: number, top: number, size: number, f = font, color = INK) => { if (t) pg.drawText(ascii(t), { x, y: y(top), size, font: f, color }); };
  const w = (t: string, size: number, f = font) => f.widthOfTextAtSize(ascii(t), size);
  const right = (t: string, xr: number, top: number, size: number, f = font, color = INK) => txt(t, xr - w(t, size, f), top, size, f, color);
  const rect = (x: number, top: number, wd: number, ht: number, o: { fill?: ReturnType<typeof rgb>; stroke?: ReturnType<typeof rgb>; bw?: number }) =>
    pg.drawRectangle({ x, y: y(top) - ht, width: wd, height: ht, color: o.fill, borderColor: o.stroke, borderWidth: o.stroke ? (o.bw ?? .8) : 0 });
  const section = (n: string, title: string, top: number) => {
    rect(M, top, 16, 16, { fill: BLUE }); right(n, M + 11.5, top + 12, 9.5, bold, WHITE);
    txt(title.toUpperCase(), M + 24, top + 12, 10.5, bold, DEEP);
    pg.drawLine({ start: { x: M + 30 + w(title.toUpperCase(), 10.5, bold), y: y(top + 8) }, end: { x: W - M, y: y(top + 8) }, thickness: .6, color: LINE });
  };
  const field = (label: string, value: string, x: number, top: number, wd: number) => {
    txt(label.toUpperCase(), x, top + 7, 6.6, bold, MUTED);
    txt(value || "", x, top + 22, 10.5, bold, INK);
    pg.drawLine({ start: { x, y: y(top + 27) }, end: { x: x + wd, y: y(top + 27) }, thickness: .6, color: value ? LINE : BLUE });
  };
  const box = (x: number, top: number, on: boolean, size = 11) => { rect(x, top, size, size, { fill: on ? BLUE : WHITE, stroke: BLUE, bw: 1 }); if (on) txt("X", x + 2.4, top + size - 2.2, size - 2, bold, WHITE); };
  const fit = (t: string, maxW: number, size: number, f = font) => { let s = ascii(t); while (s.length > 3 && f.widthOfTextAtSize(s, size) > maxW) s = s.slice(0, -2); return s === ascii(t) ? t : s.replace(/\s?\S*$/, "") + "…"; };

  // ── En-tête ──
  try { const logo = await doc.embedPng(await lr.arrayBuffer()); const lw = 150, lh = lw * logo.height / logo.width; pg.drawImage(logo, { x: M - 6, y: y(40) - lh, width: lw, height: lh }); } catch { txt("CLUB PILATES", M, 62, 18, bold, BLUE); }
  right("Contrat d'adhésion", W - M, 60, 21, bold, DEEP);
  right("Club Pilates " + c.studio, W - M, 76, 10.5, font, MUTED);
  right("Date : " + fr(c.date) + "   ·   Réf. " + c.token.slice(0, 10).toUpperCase(), W - M, 90, 8.5, font, MUTED);
  pg.drawLine({ start: { x: M, y: y(104) }, end: { x: W - M, y: y(104) }, thickness: 1.2, color: BLUE });

  // ── 1 · Adhérent ──
  section("1", "Adhérent(e)", 118);
  const col2 = M + CW / 2 + 10, half = CW / 2 - 10;
  field("Nom et prénom", c.nom, M, 142, half); field("Date de naissance", fr(c.naiss), col2, 142, half);
  field("Adresse", fit(c.adr, CW, 10.5, bold), M, 178, CW);
  field("Téléphone", c.tel, M, 214, half); field("E-mail", c.email, col2, 214, half);

  // ── 2 · Abonnement ──
  section("2", "Abonnement mensuel", 262);
  const opts: [string, string, string][] = [["1", "Pack 4", "4 classes par mois"], ["2", "Pack 8", "8 classes par mois"], ["3", "Illimité", "1 classe par jour"]];
  const ow = (CW - 2 * 10) / 3;
  opts.forEach(([k, t, d], i) => { const x = M + i * (ow + 10), on = c.pack === k, top = 284;
    rect(x, top, ow, 44, { fill: on ? PANEL : WHITE, stroke: on ? BLUE : LINE, bw: on ? 1.4 : .8 });
    box(x + 12, top + 16, on, 12); txt(t, x + 32, top + 19, 11.5, bold, on ? DEEP : INK); txt(d, x + 32, top + 33, 8.5, font, MUTED); });
  txt("Montant mensuel", M, 349, 6.6, bold, MUTED);
  txt(c.montant || "", M, 366, 13, bold, DEEP);
  pg.drawLine({ start: { x: M, y: y(372) }, end: { x: W - M, y: y(372) }, thickness: .6, color: c.montant ? LINE : BLUE });

  // ── 3 · Engagement ──
  section("3", "Engagement et résiliation", 396);
  ENGAGEMENT.forEach((l, i) => { const top = 420 + i * 15; pg.drawCircle({ x: M + 4, y: y(top) + 3, size: 1.6, color: BLUE }); txt(l, M + 14, top + 3, 9.2, font, INK); });

  // ── 4 · Prélèvement SEPA ──
  section("4", "Prélèvement mensuel", 482);
  txt("Le montant de l'abonnement est prélevé chaque mois sur le compte ci-dessous.", M, 506, 9.2, font, INK);
  txt("IBAN", M, 532, 6.6, bold, MUTED);
  const full = (sig?.iban || "").replace(/\s+/g, "").toUpperCase(), bw = 13.6, gap = 6, groups = [4, 4, 4, 4, 4, 4, 3];
  const iban = sig?.mask && full ? full.replace(/^(.{4})(.*)(.{3})$/, (_m, a, b, c) => a + b.replace(/./g, "\u2022") + c) : full;
  let bx = M, idx = 0;
  groups.forEach((n) => { for (let k = 0; k < n; k++) { rect(bx, 538, bw, 18, { fill: WHITE, stroke: iban ? LINE : BLUE, bw: .8 }); if (iban[idx]) txt(iban[idx], bx + 3.4, 551, 10.5, bold, INK); bx += bw; idx++; } bx += gap; });
  if (sig?.mask) txt("IBAN masqué sur cette copie · l'original complet est conservé par le studio.", M, 568, 7.2, ital, MUTED);

  // ── 5 · Acceptation et signature ──
  section("5", "Acceptation et signature", 582);
  box(M, 604, !!sig, 11); txt("J'ai lu et j'accepte les conditions générales de vente (page 2), l'engagement et les frais de résiliation ci-dessus.", M + 18, 613, 9.2, font, INK);
  txt("Mention « Lu et approuvé »", M, 636, 6.6, bold, MUTED);
  if (sig) txt("Lu et approuvé", M, 653, 12, ital, INK);
  pg.drawLine({ start: { x: M, y: y(658) }, end: { x: M + half, y: y(658) }, thickness: .6, color: sig ? LINE : BLUE });
  field("Fait à", c.studio, M, 672, half / 2 - 6); field("Le", sig ? fr(sig.at.slice(0, 10)) : "", M + half / 2 + 6, 672, half / 2 - 6);
  const sx = col2, sTop = 628, sW = half, sH = 84;
  rect(sx, sTop, sW, sH, { fill: WHITE, stroke: BLUE, bw: 1 }); txt("SIGNATURE", sx + 8, sTop + 11, 6.6, bold, MUTED);
  if (sig) {
    try { const png = await doc.embedPng(Uint8Array.from(atob(sig.pngBase64), (ch) => ch.charCodeAt(0))); const maxW = sW - 20, maxH = sH - 22, sc = Math.min(maxW / png.width, maxH / png.height);
      pg.drawImage(png, { x: sx + 10 + (maxW - png.width * sc) / 2, y: y(sTop + sH - 6) , width: png.width * sc, height: png.height * sc }); } catch (e) { console.warn("[contrat pdf] signature", e); }
  }

  // ── Pied de page ──
  const legal = STUDIO_LEGAL[skey(c.studio)] || "";
  pg.drawLine({ start: { x: M, y: y(776) }, end: { x: W - M, y: y(776) }, thickness: .6, color: LINE });
  const wrap = (t: string, maxW: number, size: number) => { const out: string[] = []; let line = ""; for (const word of t.split(" ")) { const tr = line ? line + " " + word : word; if (w(tr, size) > maxW && line) { out.push(line); line = word; } else line = tr; } if (line) out.push(line); return out; };
  let ft = 786;
  wrap((legal ? legal + ". " : "") + "Le Site est exploité par TMCP FITNESS FRANCE · conditions générales de vente en page 2.", CW, 6.6).slice(0, 3).forEach((l) => { txt(l, M, ft, 6.6, font, MUTED); ft += 9; });
  if (sig) txt(`Signé électroniquement le ${new Date(sig.at).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })} (Paris) par ${c.nom} <${c.email}> · empreinte ${sig.ipHash.slice(0, 12)} · réf. ${c.token.slice(0, 10)}`, M, ft + 3, 6.2, font, rgb(.45, .5, .6));

  // ── Page 2 : CGV ──
  if (tpl.getPageCount() > 1) { const [p2] = await doc.copyPages(tpl, [1]); doc.addPage(p2); }
  doc.setTitle("Contrat d'adhésion Club Pilates · " + c.nom); doc.setSubject(sig ? "Contrat signé électroniquement" : "Contrat d'adhésion et CGV");
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
