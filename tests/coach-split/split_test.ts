// Banc d'essai de la bascule « une ligne par fiche » : Postgres embarqué (PGlite), script 013 réel,
// couche _shared/store.ts réelle, client Supabase simulé (uniquement les appels utilisés par store.ts).
//   deno run -A tests/coach-split/split_test.ts
import { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { ficheKey, readProspectsRow, revStr, writeProspectsRow } from "../../supabase/functions/_shared/store.ts";

const SQL013 = await Deno.readTextFile(new URL("../../supabase/migrations/013_coach_prospects_split.sql", import.meta.url));
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v == null ? null : String(v));

// deno-lint-ignore no-explicit-any
function fakeAdmin(db: PGlite): any {
  // deno-lint-ignore no-explicit-any
  const row = (r: any) => (r ? { ...r, updated_at: r.updated_at !== undefined ? iso(r.updated_at) : undefined } : r);
  return {
    from(table: string) {
      const st: { op: string; cols: string; eqs: [string, unknown][]; body?: Record<string, unknown> } = { op: "select", cols: "*", eqs: [] };
      const where = (start: number) => st.eqs.length ? " where " + st.eqs.map(([c], i) => `${c} = $${start + i}`).join(" and ") : "";
      const vals = () => st.eqs.map(([, v]) => v);
      // deno-lint-ignore no-explicit-any
      const api: any = {
        select(cols?: string) { if (st.op === "update") { st.cols = cols || "*"; return run(); } st.cols = cols || "*"; return api; },
        eq(c: string, v: unknown) { st.eqs.push([c, v]); return api; },
        update(body: Record<string, unknown>) { st.op = "update"; st.body = body; return api; },
        async maybeSingle() {
          try { const r = await db.query(`select ${st.cols} from ${table}${where(1)} limit 1`, vals()); return { data: row(r.rows[0]) || null, error: null }; }
          catch (e) { return { data: null, error: e }; }
        },
        upsert(body: Record<string, unknown>) {
          return db.query(`insert into ${table}(id,data,updated_at) values ($1,$2::jsonb,$3::timestamptz) on conflict (id) do update set data=excluded.data, updated_at=excluded.updated_at`, [body.id, JSON.stringify(body.data), body.updated_at])
            .then(() => ({ error: null }), (e) => ({ error: e }));
        },
      };
      const run = async () => {
        try {
          const b = st.body!;
          const r = await db.query(`update ${table} set data=$1::jsonb, updated_at=$2::timestamptz${where(3)} returning ${st.cols}`, [JSON.stringify(b.data), b.updated_at, ...vals()]);
          return { data: r.rows.map(row), error: null };
        } catch (e) { return { data: null, error: e }; }
      };
      return api;
    },
    // deno-lint-ignore no-explicit-any
    async rpc(name: string, a?: any) {
      try {
        if (name === "coach_prospects_read") { const r = await db.query("select public.coach_prospects_read() as r"); return { data: (r.rows[0] as { r: unknown }).r, error: null }; }
        if (name === "coach_prospects_apply") {
          const r = await db.query("select public.coach_prospects_apply($1::timestamptz,$2::jsonb,$3::jsonb,$4::text[]) as r", [a.p_token, JSON.stringify(a.p_meta), JSON.stringify(a.p_upserts), a.p_deletes]);
          return { data: iso((r.rows[0] as { r: unknown }).r), error: null };
        }
        return { data: null, error: new Error("fonction inconnue") };
      } catch (e) { return { data: null, error: e }; }
    },
  };
}

let pass = 0, fail = 0;
const ok = (c: unknown, label: string) => { if (c) pass++; else { fail++; console.log("  ✗ ÉCHEC ·", label); } };
const eq = (a: unknown, b: unknown, label: string) => ok(ficheKey(a) === ficheKey(b), label + (ficheKey(a) === ficheKey(b) ? "" : `\n      obtenu  ${ficheKey(a)?.slice(0, 200)}\n      attendu ${ficheKey(b)?.slice(0, 200)}`));

const N = 400;
const fiche = (i: number) => ({ id: "p_" + i, nom: "Fiche " + i, tel: "06" + String(10000000 + i), statut: "rappeler", studio: i % 2 ? "La Garenne-Colombes" : "Montpellier Lattes", maj: "2026-11-13T10:00:00.000Z", appels: [{ id: "a" + i, ts: "2026-11-12T09:00:00.000Z", txt: "📞 appel · " + "x".repeat(300) }] });

async function freshDb() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create table public.coach_store (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
    create table public.studios (id text primary key, data jsonb);`);
  const list = Array.from({ length: N }, (_, i) => fiche(i));
  await db.query("insert into coach_store(id,data,updated_at) values ('_coach_prospects',$1::jsonb,'2026-11-13T10:00:00.000Z')", [JSON.stringify({ epoch: 42, prospects: list })]);
  return { db, admin: fakeAdmin(db), list };
}
const count = async (db: PGlite, sql: string, p: unknown[] = []) => Number((((await db.query(sql, p)).rows[0]) as { n: unknown }).n);

// ── 1. Avant la bascule : comportement d'origine (ligne unique) ──
console.log("1 · avant bascule (ligne unique)");
{
  const { db, admin, list } = await freshDb();
  const r = await readProspectsRow(admin);
  ok(r.split === false, "mode ligne unique");
  eq(r.data.prospects.length, N, "toutes les fiches lues");
  eq(r.data.epoch, 42, "epoch lu");
  r.data.prospects[3].note = "modif";
  const rev = await writeProspectsRow(admin, r, { ...r.data, prospects: r.data.prospects });
  ok(rev && rev !== r.updated_at, "écriture acceptée, version changée");
  const again = await writeProspectsRow(admin, r, { ...r.data, prospects: r.data.prospects });
  eq(again, null, "écriture avec une version périmée refusée");
  const r2 = await readProspectsRow(admin);
  eq(r2.data.prospects[3].note, "modif", "modification relue");
  eq(r2.data.prospects.map((p: { id: string }) => p.id), list.map((p) => p.id), "ordre conservé");
  await db.close();
}

// ── 2. Bascule : script 013 réel ──
console.log("2 · bascule (script 013)");
const { db, admin, list } = await freshDb();
const before = await readProspectsRow(admin);
await db.exec(SQL013);
eq(await count(db, "select count(*) n from coach_prospects"), N, "une ligne par fiche");
const metaRow = (await db.query("select data from coach_store where id='_coach_prospects'")).rows[0] as { data: Record<string, unknown> };
eq(metaRow.data, { epoch: 42, split: true }, "la ligne d'origine ne garde que les réglages");
eq(await count(db, "select jsonb_array_length(data->'prospects') n from coach_store where id='_coach_prospects_avant_split'"), N, "sauvegarde complète avant bascule");
const stale = await writeProspectsRow(admin, before, { ...before.data, prospects: before.data.prospects });
eq(stale, null, "une écriture lancée avant la bascule est refusée (elle sera rejouée au nouveau format)");
await db.exec(SQL013);
eq(await count(db, "select count(*) n from coach_prospects"), N, "script relançable sans effet");

// ── 3. Après la bascule ──
console.log("3 · après bascule (une ligne par fiche)");
let r = await readProspectsRow(admin);
ok(r.split === true, "mode une ligne par fiche");
eq(r.data.prospects, list, "liste identique, même ordre, même contenu");
eq(r.data.epoch, 42, "epoch conservé");
ok(!("split" in r.data), "le marqueur technique n'est pas exposé aux fonctions");

const same = await writeProspectsRow(admin, r, { ...r.data, prospects: r.data.prospects });
eq(revStr(same), revStr(r.updated_at), "rien n'a changé : aucune écriture, même version");

const reordered = r.data.prospects.map((p: Record<string, unknown>) => Object.keys(p).reverse().reduce((o: Record<string, unknown>, k) => { o[k] = p[k]; return o; }, {}));
eq(revStr(await writeProspectsRow(admin, r, { ...r.data, prospects: reordered })), revStr(r.updated_at), "fiches reconstruites à l'identique (champs dans un autre ordre) : aucune écriture");

r.data.prospects[5].note = "une seule fiche modifiée";            // modification en place
r.data.prospects[5].maj = "2026-11-13T12:00:00.000Z";
const rev1 = await writeProspectsRow(admin, r, { ...r.data, prospects: r.data.prospects });
ok(rev1 && revStr(rev1) > revStr(r.updated_at), "écriture acceptée, version strictement plus récente");
eq(await count(db, "select count(*) n from coach_prospects where updated_at = $1::timestamptz", [rev1]), 1, "UNE seule ligne réécrite");
const metaRev = iso(((await db.query("select updated_at from coach_store where id='_coach_prospects'")).rows[0] as { updated_at: unknown }).updated_at);
eq(revStr(metaRev), revStr(rev1), "la version lue par les téléphones (rev) suit l'écriture");

eq(await writeProspectsRow(admin, r, { ...r.data, prospects: r.data.prospects.map((p: Record<string, unknown>, i: number) => i === 9 ? { ...p, note: "conflit" } : p) }), null, "écriture avec une version périmée refusée");
eq(await count(db, "select count(*) n from coach_prospects where data->>'note' = 'conflit'"), 0, "rien n'est écrit en cas de conflit");

r = await readProspectsRow(admin);
eq(r.data.prospects[5].note, "une seule fiche modifiée", "modification relue");
// ajout + suppression + changement de réglage dans la même écriture
const nouvelle = { id: "p_new", nom: "Nouvelle", tel: "0699999999", statut: "rappeler", maj: "2026-11-13T13:00:00.000Z" };
const next = r.data.prospects.filter((p: { id: string }) => p.id !== "p_7").concat([nouvelle]);
const rev2 = await writeProspectsRow(admin, r, { ...r.data, epoch: 43, prospects: next });
ok(rev2, "ajout + suppression + réglage acceptés");
r = await readProspectsRow(admin);
eq(r.data.prospects.length, N, "une ajoutée, une retirée");
ok(!r.data.prospects.some((p: { id: string }) => p.id === "p_7"), "fiche retirée absente");
eq(r.data.prospects[r.data.prospects.length - 1], nouvelle, "nouvelle fiche en fin de liste");
eq(r.data.epoch, 43, "réglage mis à jour");

// deux écrivains partis de la même lecture, sur deux fiches différentes : le second est refusé, rejoue, et rien n'est perdu
const a = await readProspectsRow(admin), b = await readProspectsRow(admin);
a.data.prospects[20].note = "écrivain A";
b.data.prospects[30].note = "écrivain B";
ok(await writeProspectsRow(admin, a, a.data), "écrivain A accepté");
eq(await writeProspectsRow(admin, b, b.data), null, "écrivain B refusé (version périmée)");
const b2 = await readProspectsRow(admin);
b2.data.prospects[30].note = "écrivain B";
ok(await writeProspectsRow(admin, b2, b2.data), "écrivain B accepté après relecture");
r = await readProspectsRow(admin);
ok(r.data.prospects[20].note === "écrivain A" && r.data.prospects[30].note === "écrivain B", "les deux modifications sont présentes");

// identifiant en double dans une liste : pas d'erreur, la dernière version gagne
const dup = await readProspectsRow(admin);
const rev3 = await writeProspectsRow(admin, dup, { ...dup.data, prospects: dup.data.prospects.concat([{ ...dup.data.prospects[1], note: "doublon" }]) });
ok(rev3, "liste avec identifiant en double acceptée");
eq(await count(db, "select count(*) n from coach_prospects where id = 'p_1'"), 1, "toujours une seule ligne pour cet identifiant");

// purge administrative
const pg = await readProspectsRow(admin);
ok(await writeProspectsRow(admin, pg, { prospects: [], epoch: 99 }), "purge acceptée");
r = await readProspectsRow(admin);
eq([r.data.prospects.length, r.data.epoch, r.split], [0, 99, true], "liste vide, nouvel epoch, format conservé");
await db.close();

// lecture groupée en panne alors que la bascule est faite : erreur franche, jamais une liste vide
console.log("4 · lecture groupée indisponible après bascule");
{
  const broken = { rpc: () => Promise.resolve({ data: null, error: new Error("panne") }),
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { data: { epoch: 1, split: true }, updated_at: "2026-11-13T10:00:00.000Z" }, error: null }) }) }) }) };
  let threw = false, got: unknown = null;
  try { got = await readProspectsRow(broken); } catch (_e) { threw = true; }
  ok(threw && got === null, "erreur levée, aucune liste vide rendue");
}

console.log(`\n${pass} vérifications réussies, ${fail} en échec`);
if (fail) Deno.exit(1);
