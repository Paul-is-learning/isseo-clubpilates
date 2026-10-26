// ═══════════════════════════════════════════════════════════════════════════
// boost-sync · moteur de rapprochement Boost → Sales Coach (fonction pure,
// testable sans réseau). Boost est la source maîtresse : identité, téléphone,
// email, source, commercial et consentement viennent toujours de Boost ; le
// Sales Coach garde son enrichissement (appels Allo, fiche, notes, ventes).
// Règles validées par Paul le 26 oct. 2026 (voir README.md).
// ═══════════════════════════════════════════════════════════════════════════
// deno-lint-ignore-file no-explicit-any

export const telKey = (s: unknown) => String(s ?? "").replace(/\D/g, "").slice(-9);
// Format du Sales Coach : 0612345678 (numéros français), sinon chiffres bruts
export const telFr = (s: unknown) => {
  const d = String(s ?? "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("33")) return "0" + d.slice(2);
  if (d.length === 10 && d.startsWith("0")) return d;
  return d ? "+" + d : "";
};
const sk = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
const first = (s: unknown) => sk(String(s ?? "").trim().split(/\s+/)[0]);

// Date + heure de Paris depuis un horodatage UTC
export function parisDT(iso: string): { d: string; h: string } | null {
  const t = Date.parse(iso);
  if (isNaN(t)) return null;
  const parts = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(t));
  const g = (k: string) => parts.find((p) => p.type === k)?.value || "";
  return { d: `${g("year")}-${g("month")}-${g("day")}`, h: `${g("hour")}:${g("minute")}` };
}

// Statuts Boost qu'on n'importe pas comme nouveaux leads (une fiche déjà liée est seulement mise à jour)
const NO_CREATE = new Set(["client", "ancien_client", "archive"]);

// Activité planifiée la plus proche par contact : essai (seance_essai) ou rappel (rappel / rdv)
export function plannedByContact(acts: any[], nowIso: string) {
  const out = new Map<string, { at: string; essai: boolean }>();
  for (const a of acts) {
    if (!a?.prospect_id || a.status !== "planifie" || !a.scheduled_at) continue;
    const essai = a.action_type === "seance_essai" || a.rdv_type === "seance_essai";
    if (!essai && !["rappel", "rdv"].includes(String(a.action_type))) continue;
    if (String(a.scheduled_at) < nowIso.slice(0, 10)) continue; // passé : ignoré
    const cur = out.get(a.prospect_id);
    if (!cur || String(a.scheduled_at) < cur.at) out.set(a.prospect_id, { at: String(a.scheduled_at), essai });
  }
  return out;
}

// Statut Sales Coach + date de rappel déduits d'un contact Boost
export function mapStatus(c: any, planned?: { at: string; essai: boolean }) {
  const st = String(c?.status || "");
  let statut = "rappeler";
  if (st === "rdv_venu") statut = "venu";
  else if (st === "perdu") statut = "perdu";
  else if (planned?.essai) statut = "essai";
  let when = "";
  if (planned) when = planned.at;
  else if (st === "rdv_planifie") when = String(c?.next_rdv || c?.date_relance || c?.date_rdv || "");
  const dt = when ? parisDT(when) : null;
  return { statut, rappel: dt?.d || "", rappelH: dt && /T\d/.test(when) ? dt.h : "", nok: st === "rdv_nok", client: st === "client" };
}

export type Ctx = {
  studio: string; club: string; nowIso: string;
  contacts: any[]; acts: any[]; users: any[]; invites: any[]; deletedIds: string[];
};

export function reconcile(prospects: any[], ctx: Ctx) {
  const list = prospects.map((p) => ({ ...p }));
  const planned = plannedByContact(ctx.acts, ctx.nowIso);
  const userName = new Map(ctx.users.map((u: any) => [String(u?.id), String(u?.name || "")]));
  // Commercial Boost → nom du conseiller dans le Sales Coach (même prénom), sinon nom Boost
  const repOf = (uid: unknown) => {
    const n = userName.get(String(uid || "")) || "";
    if (!n) return "";
    // Mêmes prénoms, tirets et espaces confondus, l'un prolongeant l'autre (« Jean-Charles » =
    // « Jean Charles Colley », « Caroline B » = « Caroline »), ou initiales (« Jean-Charles » = « JC » ou « JC Colley »)
    const tok = (x: unknown) => String(x ?? "").trim().split(/[\s-]+/).map(sk).filter(Boolean);
    const a = tok(n);
    const initials = String(n).trim().split(/\s+/)[0].split("-").map((x) => sk(x).slice(0, 1)).join("");
    const pre = (x: string[], y: string[]) => x.length > 0 && x.every((t, i) => y[i] === t);
    const inv = ctx.invites.find((i: any) => {
      const b = tok(i?.nom);
      return b.length > 0 && (pre(a, b) || pre(b, a) || (initials.length > 1 && b[0] === initials));
    });
    return inv ? String(inv.nom) : n;
  };
  const R = {
    contacts: ctx.contacts.length, lies_deja: 0, lies_nouveaux: 0, crees: 0, non_importes: 0,
    statut_change: 0, rappel_maj: 0, ecarts_premier_lien: {} as Record<string, number>,
    doublons_sales_coach: 0, doublons_boost: 0, refus_appel: 0, supprimes: 0, sans_telephone: 0,
    orphelins_sales_coach: 0, commerciaux: {} as Record<string, number>,
  };
  const seenKey = new Map<string, number>();
  for (const c of ctx.contacts) { const k = telKey(c?.phone); if (k.length === 9) seenKey.set(k, (seenKey.get(k) || 0) + 1); }
  R.doublons_boost = [...seenKey.values()].filter((n) => n > 1).length;

  const sameStudio = (p: any) => sk(p.studio) === sk(ctx.studio);
  const hist = (p: any) => (p.appels?.length || 0) * 10 + (p.statut && p.statut !== "rappeler" ? 5 : 0) + (p.fiche ? 2 : 0);

  for (const c of ctx.contacts) {
    if (!c?.id) continue;
    const bid = String(c.id);
    const key = telKey(c.phone);
    if (key.length !== 9) R.sans_telephone++;
    let p = list.find((x) => x.bid === bid);
    let fresh = false;
    if (!p && key.length === 9) {
      // Même numéro dans le studio du club, ou fiche Allo rangée ailleurs par défaut
      const cands = list.filter((x) => !x.bid && telKey(x.tel) === key && (sameStudio(x) || /^p_allo/.test(String(x.id))));
      if (cands.length > 1) R.doublons_sales_coach++;
      p = cands.sort((a, b) => hist(b) - hist(a))[0];
      if (p) { fresh = true; R.lies_nouveaux++; }
    } else if (p) R.lies_deja++;

    const m = mapStatus(c, planned.get(bid));
    const rep = repOf(c.assigned_to);
    if (rep) R.commerciaux[rep] = (R.commerciaux[rep] || 0) + 1;

    if (!p) {
      if (NO_CREATE.has(String(c.status)) || c.archived === true) { R.non_importes++; continue; }
      p = { id: "p_fb_" + ctx.club + "_" + bid.replace(/[^A-Za-z0-9]/g, "").slice(0, 32), rep: "", note: "", fiche: "", obj: "", pack: "", appels: [],
        statut: m.statut, rappel: m.rappel, rappelH: m.rappelH, rappelBy: m.rappel ? "Boost" : "", ts: String(c.created_at || ctx.nowIso), maj: ctx.nowIso, bset: true, brap: m.rappel + " " + m.rappelH };
      list.push(p);
      R.crees++;
    } else if (fresh) {
      // Premier lien : le statut local est conservé (référence Boost mémorisée), écart compté
      if (m.statut !== p.statut) { const g = (p.statut || "?") + " → " + String(c.status); R.ecarts_premier_lien[g] = (R.ecarts_premier_lien[g] || 0) + 1; }
      // Un rappel convenu dans Boost est repris si la fiche n'en a pas
      if (m.rappel && !p.rappel) { p.rappel = m.rappel; p.rappelH = m.rappelH; p.rappelBy = "Boost"; p.maj = ctx.nowIso; R.rappel_maj++; }
      p.brap = m.rappel + " " + m.rappelH;
    } else {
      // Fiche déjà liée : Boost gagne dès que son statut ou son rappel change
      const rap = m.rappel + " " + m.rappelH;
      if (String(c.status) !== String(p.bst) && !NO_CREATE.has(String(c.status))) {
        if (p.statut !== m.statut) { p.statut = m.statut; p.bset = true; p.maj = ctx.nowIso; R.statut_change++; }
      }
      if (rap.trim() && rap !== p.brap) {
        p.rappel = m.rappel; p.rappelH = m.rappelH; p.rappelBy = "Boost"; p.brap = rap; p.maj = ctx.nowIso; R.rappel_maj++;
      }
    }
    // Champs maîtres Boost (réservés au serveur)
    p.bid = bid; p.bclub = ctx.club; p.bst = String(c.status || ""); p.bupd = String(c.updated_at || "");
    p.bentry = String(c.effective_entry_at || c.last_entry_at || c.created_at || ""); // arrivée du lead (tri « Leads récents »)
    p.nom = String(c.name || p.nom || "").slice(0, 80);
    if (key.length === 9) p.tel = telFr(c.phone);
    p.email = String(c.email || "").slice(0, 120);
    p.src = String(c.source || "").slice(0, 40);
    p.bnotes = String(c.notes || "").slice(0, 2000);
    p.bnok = m.nok; p.bclient = m.client;
    if (rep) p.rep = rep;
    p.studio = ctx.studio;
    p.cPhone = c.phone_consent === false ? false : null;
    p.cSms = c.sms_consent === false || c.sms_opt_out === true ? false : null;
    p.cEmail = c.email_consent === false || c.email_opt_out === true ? false : null;
    p.cWa = c.whatsapp_consent === false ? false : null;
    if (p.cPhone === false) R.refus_appel++;
  }

  // Suppressions Boost : la fiche disparaît (RGPD), son id part en pierre tombale
  const del = new Set(ctx.deletedIds.map(String));
  const tomb: string[] = [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].bid && del.has(String(list[i].bid))) { tomb.push(list[i].id); list.splice(i, 1); R.supprimes++; }
  }
  const bidsSeen = new Set(ctx.contacts.map((c: any) => String(c?.id)));
  R.orphelins_sales_coach = list.filter((p) => sameStudio(p) && !p.bid).length;
  // Fiche liée dont le contact n'est plus renvoyé par Boost (archivé hors liste…) : signalée
  const disparus = list.filter((p) => p.bid && p.bclub === ctx.club && !bidsSeen.has(String(p.bid))).length;
  return { list, tomb, report: { ...R, lies_mais_absents_de_boost: disparus } };
}
