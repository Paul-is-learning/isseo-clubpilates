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
// Règles de Paul (26 oct. 2026) : seuls les leads arrivés depuis 60 jours entrent dans l'outil,
// et un rappel au-delà de J+30 n'est pas traité (ignoré)
export const MAX_AGE_DAYS = 60;
export const RAPPEL_HORIZON_DAYS = 30;
// Un rappel passé depuis plus de 14 jours est périmé : ni date affichée, ni motif d'import
export const STALE_DAYS = 14;
const horizon = (nowIso: string) => new Date(Date.parse(nowIso) + RAPPEL_HORIZON_DAYS * 864e5).toISOString();

export function plannedByContact(acts: any[], nowIso: string) {
  // Un rappel posé par une personne (est_auto = false) passe toujours avant les rappels automatiques
  // des séquences Boost (« Rappel J3 — Appel + Mail nouveau lead »…)
  const out = new Map<string, { at: string; essai: boolean; created: string; auto: boolean }>();
  for (const a of acts) {
    if (!a?.prospect_id || a.status !== "planifie" || !a.scheduled_at) continue;
    const essai = a.action_type === "seance_essai" || a.rdv_type === "seance_essai";
    if (!essai && !["rappel", "rdv"].includes(String(a.action_type))) continue;
    if (String(a.scheduled_at) < nowIso.slice(0, 10)) continue; // passé : ignoré
    if (String(a.scheduled_at) > horizon(nowIso)) continue; // au-delà de J+30 : non traité
    const cur = out.get(a.prospect_id);
    const auto = a.est_auto === true;
    const better = !cur || (cur.auto && !auto) || (cur.auto === auto && String(a.scheduled_at) < cur.at);
    if (better) out.set(a.prospect_id, { at: String(a.scheduled_at), essai, created: String(a.created_at || ""), auto });
  }
  return out;
}

// Statut Sales Coach + date de rappel déduits d'un contact Boost
export function mapStatus(c: any, planned?: { at: string; essai: boolean; created?: string; auto?: boolean }, nowIso?: string) {
  const st = String(c?.status || "");
  let statut = "rappeler";
  if (st === "rdv_venu") statut = "venu";
  else if (st === "perdu") statut = "perdu";
  else if (planned?.essai) statut = "essai";
  let when = "";
  let auto = false; // rappel issu d'une séquence automatique Boost (et non posé par une personne)
  // Date de relance (écrite par le Sales Coach ou dans Boost) contre activité planifiée : la plus
  // récemment posée l'emporte ; une séance d'essai planifiée garde toujours sa date
  const rel = String(c?.date_relance || "");
  // Un rappel automatique ne remplace jamais une date de relance posée par l'équipe
  if (planned && (planned.essai || !rel || (!planned.auto && String(planned.created || "") > String(c?.updated_at || "")))) { when = planned.at; auto = !!planned.auto && !planned.essai; }
  else if (rel) when = rel;
  else if (st === "rdv_planifie") when = String(c?.next_rdv || c?.date_rdv || "");
  if (when && nowIso && when > horizon(nowIso)) when = ""; // rappel au-delà de J+30 : non traité
  if (when && nowIso && when < new Date(Date.parse(nowIso) - STALE_DAYS * 864e5).toISOString()) when = ""; // rappel périmé
  const dt = when ? parisDT(when) : null;
  return { statut, rappel: dt?.d || "", rappelH: dt && /T\d/.test(when) ? dt.h : "", nok: st === "rdv_nok", client: st === "client", auto: !!dt && auto };
}

// Rappel de la fiche déjà passé (heure de Paris ; sans heure = fin de journée)
function rappelPast(p: any, nowIso: string) {
  const n = parisDT(nowIso);
  if (!p?.rappel || !n) return false;
  return String(p.rappel) + " " + String(p.rappelH || "23:59") < n.d + " " + n.h;
}
// Changement de statut ou de rappel fait dans l'outil, pas encore écrit dans Boost
const pendingTool = (p: any) => !!(p?.bq && [p.bq.statut, p.bq.rappel, p.bq.rappelH].join("|") !== p.bqs);

export type Ctx = {
  studio: string; club: string; nowIso: string;
  contacts: any[]; acts: any[]; users: any[]; invites: any[]; deletedIds: string[];
  toolDeleted?: string[]; // fiches supprimées dans l'outil : jamais réimportées depuis Boost
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
    contacts: ctx.contacts.length, lies_deja: 0, lies_nouveaux: 0, crees: 0, adherents: 0, non_importes: 0, trop_anciens: 0, rappels_perimes: 0, retires_anciens: 0,
    statut_change: 0, rappel_maj: 0, ecarts_premier_lien: {} as Record<string, number>,
    doublons_sales_coach: 0, doublons_boost: 0, refus_appel: 0, supprimes: 0, supprimes_outil: 0, sans_telephone: 0,
    orphelins_sales_coach: 0, commerciaux: {} as Record<string, number>,
    crees_par_mois: {} as Record<string, number>, crees_par_source: {} as Record<string, number>, crees_par_statut: {} as Record<string, number>,
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

    const m = mapStatus(c, planned.get(bid), ctx.nowIso);
    const rep = repOf(c.assigned_to);

    if (!p) {
      // Adhérents (« client » dans Boost) : tous importés, quel que soit leur ancienneté (demande de Paul)
      const member = String(c.status) === "client" && c.archived !== true;
      if (!member && (NO_CREATE.has(String(c.status)) || c.archived === true)) { R.non_importes++; continue; }
      // Lead trop ancien (plus de 60 jours) sans rappel dans les 30 jours : il reste dans Boost
      const arr = String(c.effective_entry_at || c.last_entry_at || c.created_at || "");
      const recent = !arr || Date.parse(arr) >= Date.parse(ctx.nowIso) - MAX_AGE_DAYS * 864e5;
      if (!member && !recent && !m.rappel) { R.trop_anciens++; continue; }
      const newId = "p_fb_" + ctx.club + "_" + bid.replace(/[^A-Za-z0-9]/g, "").slice(0, 32);
      if ((ctx.toolDeleted || []).includes(newId)) { R.supprimes_outil++; continue; } // supprimée dans l'outil par l'équipe
      p = { id: newId, rep: "", note: "", fiche: "", obj: "", pack: "", appels: [],
        statut: member ? "abo" : m.statut, rappel: member ? "" : m.rappel, rappelH: m.rappelH, rappelBy: m.rappel ? "Boost" : "", ts: String(c.created_at || ctx.nowIso), maj: ctx.nowIso, bset: true, brap: m.rappel + " " + m.rappelH };
      list.push(p);
      if (member) R.adherents++; // adhérent : hors statistiques de leads
      else {
        R.crees++;
        const inc = (o: Record<string, number>, k: string) => { o[k] = (o[k] || 0) + 1; };
        inc(R.crees_par_mois, String(c.effective_entry_at || c.last_entry_at || c.created_at || "?").slice(0, 7));
        inc(R.crees_par_source, String(c.source || "?"));
        inc(R.crees_par_statut, String(c.status || "?"));
      }
    } else if (fresh) {
      // Premier lien : le statut local est conservé (référence Boost mémorisée), écart compté
      if (m.statut !== p.statut) { const g = (p.statut || "?") + " → " + String(c.status); R.ecarts_premier_lien[g] = (R.ecarts_premier_lien[g] || 0) + 1; }
      // Un rappel convenu dans Boost est repris si la fiche n'en a pas, ou si le sien est déjà passé
      if (m.rappel && (!p.rappel || rappelPast(p, ctx.nowIso)) && !pendingTool(p)) { p.rappel = m.rappel; p.rappelH = m.rappelH; p.rappelBy = "Boost"; p.maj = ctx.nowIso; R.rappel_maj++; }
      p.brap = m.rappel + " " + m.rappelH;
    } else {
      // Fiche déjà liée : Boost gagne dès que son statut ou son rappel change
      const rap = m.rappel + " " + m.rappelH;
      if (String(c.status) !== String(p.bst) && !NO_CREATE.has(String(c.status))) {
        if (p.statut !== m.statut) { p.statut = m.statut; p.bset = true; p.maj = ctx.nowIso; R.statut_change++; }
      }
      // Boost gagne quand son rappel change, ou quand celui de la fiche est passé alors qu'un rappel
      // à venir existe dans Boost (jamais quand un changement fait dans l'outil attend son envoi)
      const cur = String(p.rappel || "") + " " + String(p.rappelH || "");
      if (rap.trim() && cur !== rap && !pendingTool(p) && (rap !== p.brap || !p.rappel || rappelPast(p, ctx.nowIso))) {
        p.rappel = m.rappel; p.rappelH = m.rappelH; p.rappelBy = "Boost"; p.brap = rap; p.maj = ctx.nowIso; R.rappel_maj++;
      }
    }
    // Champs maîtres Boost (réservés au serveur) · sauf des coordonnées modifiées dans l'outil
    // et pas encore écrites dans Boost : elles ne sont pas écrasées en attendant
    const idPending = !!(p.bqi && bqiSig(p.bqi) !== p.bqis);
    p.bid = bid; p.bclub = ctx.club; p.bst = String(c.status || ""); p.bupd = String(c.updated_at || "");
    p.bauto = m.auto; // le rappel Boost (brap) vient d'une séquence automatique : un lead jamais appelé reste « Nouveau lead »
    p.bentry = String(c.effective_entry_at || c.last_entry_at || c.created_at || ""); // arrivée du lead (tri « Leads récents »)
    if (!idPending) {
      p.nom = String(c.name || p.nom || "").slice(0, 80);
      if (key.length === 9) p.tel = telFr(c.phone);
      p.email = String(c.email || "").slice(0, 120);
    }
    p.src = String(c.source || "").slice(0, 40);
    if (!idPending) p.bnotes = String(c.notes || "").slice(0, 2000);
    // Badge Boost (chaud / tiède / froid) : changé dans Boost → la température de la fiche suit
    if (!idPending) {
      const b = ["chaud", "tiede", "froid"].includes(String(c.badge)) ? String(c.badge) : "";
      if (b !== String(p.btemp || "") && p.btemp !== undefined) p.temp = b;
      p.btemp = b;
    }
    p.bnok = m.nok; p.bclient = m.client;
    p.bmember = String(c.status) === "client"; // adhérent : hors tournée d'appels, jamais de vente déclarable
    if (rep) p.rep = rep;
    p.studio = ctx.studio;
    p.cPhone = c.phone_consent === false ? false : null;
    p.cSms = c.sms_consent === false || c.sms_opt_out === true ? false : null;
    p.cEmail = c.email_consent === false || c.email_opt_out === true ? false : null;
    p.cWa = c.whatsapp_consent === false ? false : null;
    if (p.cPhone === false) R.refus_appel++;
    if (rep) R.commerciaux[rep] = (R.commerciaux[rep] || 0) + 1;
  }

  // Rappels posés par Boost et périmés : on les retire de la fiche (jamais ceux posés dans l'outil)
  const staleIso = new Date(Date.parse(ctx.nowIso) - STALE_DAYS * 864e5).toISOString().slice(0, 10);
  for (const p of list) {
    if (p.bclub === ctx.club && p.rappelBy === "Boost" && p.rappel && p.rappel < staleIso && !pendingTool(p)) {
      p.rappel = ""; p.rappelH = ""; p.rappelBy = ""; p.brap = ""; p.maj = ctx.nowIso; R.rappels_perimes++;
    }
  }
  // Fiches importées qui ne passent plus les règles (lead de plus de 60 jours, sans rappel à venir)
  // et que personne n'a travaillées dans l'outil : retirées, elles restent dans Boost
  const ageIso = new Date(Date.parse(ctx.nowIso) - MAX_AGE_DAYS * 864e5).toISOString();
  const keep = (p: any) => {
    if (!String(p.id).startsWith("p_fb_" + ctx.club + "_") || p.bmember) return true;
    if ((p.appels || []).length || p.bq || p.fiche || p.note || p.obj || p.pack || p.rappel) return true;
    if (p.statut !== "rappeler" && !p.bset) return true;
    return String(p.bentry || p.ts || "") >= ageIso;
  };
  const pruned: string[] = [];
  for (let i = list.length - 1; i >= 0; i--) if (!keep(list[i])) { pruned.push(list[i].id); list.splice(i, 1); R.retires_anciens++; }

  // Suppressions Boost : la fiche disparaît (RGPD), son id part en pierre tombale
  const del = new Set(ctx.deletedIds.map(String));
  const tomb: string[] = [...pruned]; // retirées : un téléphone ne doit pas les repousser
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].bid && del.has(String(list[i].bid))) { tomb.push(list[i].id); list.splice(i, 1); R.supprimes++; }
  }
  const bidsSeen = new Set(ctx.contacts.map((c: any) => String(c?.id)));
  R.orphelins_sales_coach = list.filter((p) => sameStudio(p) && !p.bid).length;
  // Fiche liée dont le contact n'est plus renvoyé par Boost (archivé hors liste…) : signalée
  const disparus = list.filter((p) => p.bid && p.bclub === ctx.club && !bidsSeen.has(String(p.bid))).length;
  return { list, tomb, report: { ...R, lies_mais_absents_de_boost: disparus } };
}

// ═══ Sens inverse : Sales Coach → Boost (boost-push) ═══

// Heure de Paris (AAAA-MM-JJ + HH:MM) → instant UTC ISO
export function parisToUtc(d: string, h: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || "");
  if (!m) return "";
  const [hh, mm] = (/^\d{1,2}:\d{2}$/.test(h || "") ? h : "09:00").split(":").map(Number);
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], hh, mm);
  const p = parisDT(new Date(guess).toISOString());
  if (!p) return "";
  const [ph, pm] = p.h.split(":").map(Number);
  const shown = Date.UTC(+p.d.slice(0, 4), +p.d.slice(5, 7) - 1, +p.d.slice(8, 10), ph, pm);
  return new Date(guess - (shown - guess)).toISOString();
}

// Signature d'un changement à envoyer (évite tout double envoi)
export const bqSig = (q: any) => [q?.statut, q?.rappel, q?.rappelH].join("|");

// Ce qu'on écrit dans Boost pour un changement fait dans le Sales Coach (q = p.bq)
export function buildOps(q: any, contact: any, nowIso: string, lastRdvSig?: string) {
  const bst = String(contact?.status || "");
  const patch: Record<string, unknown> = {};
  let rdv: Record<string, unknown> | null = null;
  const when = q.rappel ? parisToUtc(q.rappel, q.rappelH) : "";
  if (bst === "client" && q.statut !== "abo") return { skip: "déjà client dans Boost (statut définitif)" };
  switch (q.statut) {
    case "abo": patch.status = "client"; patch.date_inscription = nowIso; break;
    case "perdu": patch.status = "perdu"; break;
    case "venu": patch.status = "rdv_venu"; patch.est_venu = true; patch.date_last_rdv_venu = nowIso; break;
    case "essai":
      patch.status = "rdv_planifie";
      if (when && lastRdvSig !== "essai|" + when) rdv = { scheduled_at: when, user_id: contact?.assigned_to || null, title: "Séance d'essai", duration: 50 };
      break;
    case "rappeler":
      if (when) { patch.status = "rdv_planifie"; patch.date_relance = when; }
      else if (["a_traiter", "rdv_planifie", "rdv_nok"].includes(bst)) { patch.status = "contacte"; if (contact?.date_relance) patch.date_relance = null; }
      break;
    default: return { skip: "statut inconnu" };
  }
  if (patch.status === bst) delete patch.status;
  if (rdv && !rdv.user_id) { rdv = null; }
  if (!Object.keys(patch).length && !rdv) return { skip: "déjà à jour dans Boost" };
  return { patch: Object.keys(patch).length ? patch : null, rdv };
}

// ═══ Coordonnées modifiées dans le Sales Coach (nom, téléphone, email, notes Boost) ═══
export const bqiSig = (q: any) => [q?.nom, q?.tel, q?.email, q?.notes, q?.badge].join("|");
export const toE164 = (t: unknown) => {
  const d = String(t ?? "").replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("0")) return "+33" + d.slice(1);
  if (d.length === 11 && d.startsWith("33")) return "+" + d;
  return d.length >= 8 ? "+" + d : "";
};
export function identityPatch(q: any, c: any) {
  const patch: Record<string, unknown> = {};
  if (q.nom && q.nom !== String(c?.name || "")) patch.name = q.nom;
  const e = toE164(q.tel);
  if (e && telKey(e) !== telKey(c?.phone)) patch.phone = e;
  if ((q.email || "") !== String(c?.email || "")) patch.email = q.email || null;
  if (typeof q.notes === "string" && q.notes !== String(c?.notes || "")) patch.notes = q.notes;
  // Température → badge Boost (chaud / tiede / froid ; vide = retire le badge)
  // (Boost connaît « chaud » et « froid » ; « tiède » n'est pas envoyé pour ne pas faire refuser la mise à jour)
  if (typeof q.badge === "string" && q.badge !== "tiede" && q.badge !== String(c?.badge || "")) patch.badge = q.badge || null;
  return patch;
}
