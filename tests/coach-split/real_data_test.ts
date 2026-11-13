// Rejoue la bascule 013 sur une copie réelle de la ligne `_coach_prospects` (fichier JSON local, jamais versionné).
//   deno run -A tests/coach-split/real_data_test.ts /chemin/vers/sauvegarde.json
import { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { ficheKey } from "../../supabase/functions/_shared/store.ts";
const SQL013 = await Deno.readTextFile(new URL("../../supabase/migrations/013_coach_prospects_split.sql", import.meta.url));
// deno-lint-ignore no-explicit-any
const find = (o: any): any => { if (o && Array.isArray(o.prospects)) return o; if (o && typeof o === "object") for (const v of Object.values(o)) { const f = find(v); if (f) return f; } return null; };
const src = find(JSON.parse(await Deno.readTextFile(Deno.args[0])));
if (!src) { console.log("Aucune liste de fiches dans ce fichier"); Deno.exit(1); }
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role;
  create table public.coach_store (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());`);
await db.query("insert into coach_store(id,data) values ('_coach_prospects',$1::jsonb)", [JSON.stringify(src)]);
const t0 = performance.now();
await db.exec(SQL013);
const ms = Math.round(performance.now() - t0);
// deno-lint-ignore no-explicit-any
const out = ((await db.query("select public.coach_prospects_read() as r")).rows[0] as any).r;
const same = ficheKey(out.prospects) === ficheKey(src.prospects);
const size = await db.query("select pg_size_pretty(pg_total_relation_size('coach_prospects')) t, (select round(avg(octet_length(data::text))) from coach_prospects) moy");
console.log({ fiches_source: src.prospects.length, fiches_table: out.prospects.length, identique_et_meme_ordre: same, reglages: out.meta, duree_ms: ms, table: size.rows[0] });
if (!same || out.prospects.length !== src.prospects.length) Deno.exit(1);
