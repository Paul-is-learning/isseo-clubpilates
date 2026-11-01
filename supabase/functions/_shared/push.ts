// ═════════════════════════════════════════════════
// Alertes Web Push du Sales Coach : « ⏰ Rappel dans 10 min » sur le téléphone du commercial,
// même application fermée. Abonnements rangés dans coach_store (_coach_push), un par appareil,
// envoyés avec les clés VAPID du projet (mêmes secrets que send-push).
// ═════════════════════════════════════════════════
import webpush from "npm:web-push@3.6.7";

export const ROW_PUSH = "_coach_push";
const OWNER_DEFAULT: Record<string, string> = { lagarennecolombes: "JC", montpellierlattes: "Solène" };
const LEAD_MIN = 12; // fenêtre d'alerte : rappel dans 0 à 12 minutes (planificateur toutes les 5 min)

export const sk = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
const first = (s: unknown) => String(s ?? "").trim().split(/\s+/)[0] || "";

let ready = false;
function setup(): boolean {
  if (ready) return true;
  const pub = Deno.env.get("VAPID_PUBLIC_KEY") || "", priv = Deno.env.get("VAPID_PRIVATE_KEY") || "";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:paul@isseo.fr", pub, priv);
  ready = true;
  return true;
}

// Envoie une notification ; "gone" = abonnement mort (à supprimer)
export async function sendPush(sub: any, payload: unknown): Promise<"ok" | "gone" | "err"> {
  if (!setup()) return "err";
  try { await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 600 }); return "ok"; }
  catch (e) { const st = Number((e as any)?.statusCode || 0); console.error("push", st, String((e as any)?.message || e).slice(0, 120)); return st === 404 || st === 410 ? "gone" : "err"; }
}

// Commercial en charge d'une fiche (même règle que l'outil) : suivi, sinon rappel posé par une personne,
// sinon assignation Boost, sinon le commercial du studio
export function ownerOf(p: any): string {
  const o = first(p?.suivi); if (o) return o;
  const by = first(p?.rappelBy); if (by && !/^(boost|auto|equipe)$/.test(sk(by))) return by;
  return first(p?.rep) || OWNER_DEFAULT[sk(p?.studio)] || "";
}

const parisNow = (d = new Date()) => {
  const parts = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const g = (k: string) => parts.find((x) => x.type === k)?.value || "";
  return { d: `${g("year")}-${g("month")}-${g("day")}`, min: +g("hour") * 60 + +g("minute") };
};
const todoOf = (p: any) => (String(p?.sum?.txt || "").split("\n").find((l) => /^À faire\s*:/i.test(l)) || "").trim();

// Passe du planificateur : une alerte par rappel à l'heure, aux appareils du commercial en charge
export async function rappelPush(admin: any, prospects: any[], nowDate = new Date()) {
  const { data: row } = await admin.from("coach_store").select("data").eq("id", ROW_PUSH).maybeSingle();
  const items: any[] = Array.isArray(row?.data?.items) ? row.data.items : [];
  const sent: Record<string, number> = row?.data?.sent && typeof row.data.sent === "object" ? row.data.sent : {};
  const R = { candidats: 0, envoyes: 0, sans_appareil: 0, morts: 0, erreurs: 0 };
  if (!items.length) return { ...R, note: "aucun appareil abonné" };
  const now = parisNow(nowDate), gone = new Set<string>();
  for (const p of prospects) {
    if (!p || !p.rappel || !p.rappelH || p.noCall || !["rappeler", "essai"].includes(String(p.statut))) continue;
    if (p.rappel !== now.d) continue;
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(p.rappelH)); if (!m) continue;
    const lead = +m[1] * 60 + +m[2] - now.min;
    if (lead < 0 || lead > LEAD_MIN) continue;
    const key = p.id + "|" + p.rappel + " " + p.rappelH;
    if (sent[key]) continue;
    R.candidats++;
    const owner = sk(ownerOf(p));
    const subs = items.filter((it) => sk(it.rep) === owner && (!it.studio || !p.studio || sk(it.studio) === sk(p.studio)));
    if (!subs.length) { R.sans_appareil++; sent[key] = Date.now(); continue; }
    const todo = todoOf(p);
    const payload = { title: "⏰ Rappel à " + p.rappelH + (lead > 1 ? " · dans " + lead + " min" : " · maintenant"), body: String(p.nom || "Prospect") + (p.statut === "essai" ? " · séance d'essai" : "") + (todo ? "\n" + todo : ""), tag: key, data: { open: p.id } };
    for (const it of subs) {
      const r = await sendPush(it.sub, payload);
      if (r === "ok") R.envoyes++; else if (r === "gone") { gone.add(it.endpoint); R.morts++; } else R.erreurs++;
    }
    sent[key] = Date.now();
  }
  const cutoff = Date.now() - 2 * 864e5;
  for (const k of Object.keys(sent)) if (sent[k] < cutoff) delete sent[k];
  await admin.from("coach_store").upsert({ id: ROW_PUSH, data: { items: items.filter((it) => !gone.has(it.endpoint)), sent }, updated_at: new Date().toISOString() });
  return R;
}
