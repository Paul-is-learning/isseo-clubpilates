// ═══════════════════════════════════════════════════════════════════════════
// Filet de sécurité « golden » : charge toute l'app (scripts de index.html, dans
// l'ordre) dans un navigateur simulé (happy-dom), avec Supabase bouchonné et des
// données de démonstration, puis affiche chaque page et chaque onglet de fiche
// studio. Écrit un instantané HTML normalisé par écran + les erreurs console.
// Usage : node tests/golden/render-snapshot.mjs <dossier-sortie>
// Comparer deux sorties : diff -r avant/ apres/
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.resolve(process.argv[2] || '/tmp/isseo-golden');
fs.mkdirSync(OUT, { recursive: true });

const FIXED_NOW = new Date('2026-10-27T10:00:00Z').getTime();
const win = new Window({ url: 'https://clubpilates.isseo-dev.com/', width: 1440, height: 900 });
const w = win;
const errors = [];
// Horloge et hasard figés : instantanés reproductibles d'un passage à l'autre
w.eval(`(function(){var R=Date,F=${FIXED_NOW};function D(){return arguments.length?new (Function.prototype.bind.apply(R,[null].concat([].slice.call(arguments)))):new R(F);}D.prototype=R.prototype;D.now=function(){return F;};D.UTC=R.UTC;D.parse=R.parse;window.Date=D;var s=42;Math.random=function(){s=(s*16807)%2147483647;return (s-1)/2147483646;};})();`);
w.console.error = (...a) => errors.push('error: ' + a.map(String).join(' ').slice(0, 300));
w.addEventListener('error', (e) => errors.push('uncaught: ' + (e.message || e.error)));
// Supabase bouchonné : toute requête renvoie une liste vide, sans réseau
w.eval(`
(function(){
  function Q(){var q={};['select','eq','neq','in','like','ilike','order','limit','range','gte','lte','lt','gt','is','not','or','match','filter','contains','single','maybeSingle','upsert','insert','update','delete','returns'].forEach(function(k){q[k]=function(){return q;};});
    q.then=function(res){return Promise.resolve({data:[],error:null}).then(res);};return q;}
  var ch={on:function(){return ch;},subscribe:function(cb){return ch;},unsubscribe:function(){}};
  window.supabase={createClient:function(){return {from:function(){return Q();},rpc:function(){return Q();},channel:function(){return ch;},removeChannel:function(){},
    auth:{getSession:function(){return Promise.resolve({data:{session:null}});},onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}};},signOut:function(){return Promise.resolve({});},getUser:function(){return Promise.resolve({data:{user:null}});}},
    storage:{from:function(){return {upload:function(){return Promise.resolve({});},getPublicUrl:function(){return {data:{publicUrl:''}};},list:function(){return Promise.resolve({data:[]});},remove:function(){return Promise.resolve({});}};}},
    functions:{invoke:function(){return Promise.resolve({data:null});}}};}};
  window.L={map:function(){var m={setView:function(){return m;},on:function(){return m;},addLayer:function(){return m;},remove:function(){},invalidateSize:function(){},fitBounds:function(){return m;}};return m;},tileLayer:function(){return {addTo:function(){}};},marker:function(){return {addTo:function(){return this;},bindPopup:function(){return this;},openPopup:function(){return this;}};},circle:function(){return {addTo:function(){return this;}};},divIcon:function(){return {};},latLng:function(a,b){return {lat:a,lng:b};},latLngBounds:function(){return {};}};
  window.IntersectionObserver=window.IntersectionObserver||function(){return {observe:function(){},unobserve:function(){},disconnect:function(){}};};
  window.matchMedia=window.matchMedia||function(){return {matches:false,addListener:function(){},removeListener:function(){},addEventListener:function(){},removeEventListener:function(){}};};
  window.fetch=function(){return Promise.resolve({ok:false,status:0,json:function(){return Promise.resolve({});},text:function(){return Promise.resolve('');}});};
})();`);

// Page de base (sans scripts), puis scripts locaux et inline dans l'ordre de index.html
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const bodyHtml = html.replace(/<script[\s\S]*?<\/script>/g, '');
w.document.write(bodyHtml.replace(/<link[^>]*>/g, ''));
// Un seul bloc : les const/let de haut niveau d'un script classique restent visibles des suivants
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
let bundle = '';
for (const [, attrs, inline] of scripts) {
  const src = (attrs.match(/src="([^"]+)"/) || [])[1];
  if (src && /^https?:/.test(src)) continue;
  bundle += '\n;/* ── ' + (src || 'inline') + ' ── */\n' + (src ? fs.readFileSync(path.join(ROOT, src.split('?')[0]), 'utf8') : inline) + '\n';
}
try { w.eval(bundle); } catch (e) { errors.push('load: ' + e.message); }
await new Promise((r) => setTimeout(r, 300));
if (process.env.GOLDEN_DEBUG) console.log(errors.slice(0, 15).join('\n'), '\nS:', typeof w.S, w.eval('typeof S'));

// Session de démonstration (données INIT embarquées), atterrissage dashboard
w.eval(`S.user={id:'demo',email:'demo@local'};S.profile={nom:'Paul',prenom:'Paul',role:'admin',statut:'actif'};S._dataLoaded=true;S.view='dashboard';`);
const norm = (h) => h
  .replace(/\s(data-tilt-bound|data-stagger-done|data-reveal-done)="[^"]*"/g, '')
  .replace(/style="[^"]*(?:opacity|transform|transition|animation)[^"]*"/g, (m) => m.replace(/(opacity|transform|transition|transition-delay|animation)[^;"]*;?/g, ''))
  .replace(/(<span class="counter-anim"[^>]*>)[^<]*(<\/span>)/g, '$1#$2')
  .replace(/>\s+</g, '><');
const shot = async (name, js) => {
  try { w.eval(js + ';_rendering=false;render();'); } catch (e) { errors.push(name + ': ' + e.message); }
  await new Promise((r) => setTimeout(r, 30));
  const app = w.document.querySelector('#root');
  fs.writeFileSync(path.join(OUT, name + '.html'), norm(app ? app.innerHTML : '(root absent)').replace(/></g, '>\n<'));
};
const PAGES = ['accueil', 'projets', 'collab', 'bp', 'equipe', 'introclass', 'how-it-works', 'engagements'];
for (const p of PAGES) await shot('page-' + p, `S.page='${p}';S.view='dashboard';S.selectedId=null;S.mainTab='studios'`);
await shot('page-admin', `S.page='projets';S.view='dashboard';S.mainTab='admin'`);
const ids = JSON.parse(w.eval('JSON.stringify(Object.keys(S.studios))'));
const TABS = ['workflow', 'adherents', 'forecast', 'engagements', 'echanges', 'localisation', 'local', 'ia'];
for (const id of ids.slice(0, 3)) for (const t of TABS) await shot(`studio-${id}-${t}`, `S.page='projets';S.mainTab='studios';S.view='detail';S.selectedId=${JSON.stringify(id)};S.detailTab='${t}'`);
await shot('auth', `S.view='auth'`);
fs.writeFileSync(path.join(OUT, '_errors.txt'), errors.join('\n') + '\n');
console.log(`${fs.readdirSync(OUT).length - 1} écrans · ${errors.length} erreur(s) → ${OUT}`);
await win.happyDOM.abort(); win.close(); process.exit(0);
