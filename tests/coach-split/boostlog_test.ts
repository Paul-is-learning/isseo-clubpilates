// Journal des échanges dans les notes Boost · deno run -A tests/coach-split/boostlog_test.ts
import { boostJournal, callDetail } from "../../supabase/functions/_shared/boostlog.ts";
let pass = 0, fail = 0;
const ok = (c: unknown, l: string) => { if (c) pass++; else { fail++; console.log("  ✗ ÉCHEC ·", l); } };

ok(callDetail("📞 Allo · appel sortant · 1 m 49 s · décroché · par Noa\nrésumé…") === "appel sortant · 1 m 49 s · décroché · Noa", "ligne d'appel Allo");
ok(callDetail("📞 Aircall · appel entrant · manqué") === "appel entrant · manqué", "ligne d'appel Aircall");

// deno-lint-ignore no-explicit-any
const p: any = { id: "x", bid: "b1", nom: "Test", tel: "0600000000", bnotes: "20/11 10:00 · Caroline : préfère le soir", bqi: { badge: "chaud" } };
ok(boostJournal(p, "appel", "2026-11-24T13:32:00.000Z", "appel sortant · 3 m 12 s · décroché · Caroline"), "ligne ajoutée");
ok(p.bnotes.split("\n")[0] === "📞 24/11 14:32 · appel sortant · 3 m 12 s · décroché · Caroline", "en tête, heure de Paris : " + p.bnotes.split("\n")[0]);
ok(p.bnotes.endsWith("20/11 10:00 · Caroline : préfère le soir"), "note de l'équipe conservée");
ok(p.bqi.notes === p.bnotes && p.bqi.badge === "chaud" && p.bqi.by === "journal", "envoi mis en file, badge conservé");
ok(!boostJournal(p, "appel", "2026-11-24T13:32:00.000Z", "appel sortant · 3 m 12 s · décroché · Caroline"), "même ligne : pas de doublon");
ok(!boostJournal({ id: "y", nom: "Sans Boost" }, "sms", new Date().toISOString(), "SMS envoyé"), "fiche non liée à Boost : rien");

for (let i = 0; i < 30; i++) boostJournal(p, i % 2 ? "sms" : "email", new Date(Date.UTC(2026, 10, 25, 8, i)).toISOString(), i % 2 ? "SMS envoyé · Noa" : "contrat d'inscription envoyé · Paul");
const L = p.bnotes.split("\n");
ok(L.filter((l: string) => /^(📞|💬|✉️) /u.test(l)).length === 12, "12 lignes de journal au plus");
ok(L[L.length - 1] === "20/11 10:00 · Caroline : préfère le soir", "note de l'équipe toujours là");
ok(L[0].includes("25/11 09:29"), "la plus récente en tête : " + L[0]);

// notes de l'équipe déjà pleines : on ne coupe rien, on n'ajoute rien
// deno-lint-ignore no-explicit-any
const full: any = { id: "z", bid: "b2", nom: "Plein", tel: "06", bnotes: "n".repeat(1990) };
ok(!boostJournal(full, "appel", new Date().toISOString(), "appel sortant · sans réponse") && full.bnotes.length === 1990 && !full.bqi, "notes pleines : intactes");
// notes longues + journal : les vieilles lignes de journal cèdent la place
// deno-lint-ignore no-explicit-any
const long: any = { id: "w", bid: "b3", nom: "Long", tel: "06", bnotes: "📞 01/11 10:00 · appel sortant · sans réponse\n" + "n".repeat(1930) };
ok(boostJournal(long, "appel", "2026-11-24T13:32:00.000Z", "appel sortant · 2 m · décroché · Noa") && long.bnotes.length <= 2000 && !long.bnotes.includes("01/11 10:00") && long.bnotes.includes("n".repeat(1930)), "ancienne ligne retirée, note intacte");

console.log(`\n${pass} vérifications réussies, ${fail} en échec`);
if (fail) Deno.exit(1);
