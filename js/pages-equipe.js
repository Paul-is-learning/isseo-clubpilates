// ════════════════════════════════════════════════════════════════════════════
// ── Page "Équipe" — Employés (accueil) + Coachs (freelance) ──
// ────────────────────────────────────────────────────────────────────────────
// V1 : trombinoscope CRUD + planning hebdo visuel + templates récurrents
//      + propositions par email (mailto:) + synthèse coûts (associés only).
// Coachs n'ont PAS accès à l'app — tout est géré par les gérants/associés.
// Sync via Supabase : table `studios` avec suffixes d'ID
//   _people (annuaire global), {sid}_shifts, {sid}_shift_templates,
//   {sid}_shift_proposals
// ════════════════════════════════════════════════════════════════════════════
(function(){
  'use strict';

  // ── Constantes ─────────────────────────────────────────────────────────────
  var ROLE_META={
    employe:{label:'Employé',color:'#2563eb',ico:'🛎️',bg:'rgba(37,99,235,.1)'},
    coach:{label:'Coach',color:'#7c3aed',ico:'🧘',bg:'rgba(124,58,237,.1)'}
  };
  var SHIFT_TYPE={
    accueil:{label:'Accueil',color:'#3b82f6',bg:'rgba(59,130,246,.18)',border:'#2563eb',ico:'🛎️'},
    cours:{label:'Cours',color:'#7c3aed',bg:'rgba(124,58,237,.18)',border:'#6d28d9',ico:'🧘'},
    menage:{label:'Ménage',color:'#64748b',bg:'rgba(100,116,139,.18)',border:'#475569',ico:'🧹'},
    admin:{label:'Admin',color:'#f59e0b',bg:'rgba(245,158,11,.18)',border:'#d97706',ico:'📋'}
  };
  var DAYS=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

  // ── Catalogue officiel Club Pilates (cours · niveaux · couleurs) ───────────
  // Chaque cours = 1h sauf Intro Class (30 min). Niveaux : 1, 1.5, 2, 2.5.
  // Modifiable côté UI : l'utilisateur peut ajuster nom/horaires/coach par créneau.
  var COURS_TYPES=[
    {id:'intro',label:'Intro Class',short:'Intro',desc:'Initiation gratuite 30 min',levels:[1],duration:30,color:'#6366f1'},
    {id:'reformer-flow',label:'Reformer Flow',short:'Reformer',desc:'Pilates Reformer contemporain',levels:[1,1.5,2,2.5],duration:60,color:'#7c3aed'},
    {id:'cardio-sculpt',label:'Cardio Sculpt',short:'Cardio',desc:'Cardio low-impact Jumpboard',levels:[1,1.5,2],duration:60,color:'#ef4444'},
    {id:'center-balance',label:'Center + Balance',short:'C+B',desc:'Étirements profonds',levels:[1,1.5,2],duration:60,color:'#10b981'},
    {id:'control',label:'Control',short:'Control',desc:'Debout au Springboard',levels:[1.5,2],duration:60,color:'#0ea5e9'},
    {id:'restore',label:'Restore',short:'Restore',desc:'Rouleaux + myofascial',levels:[1,1.5],duration:60,color:'#a855f7'},
    {id:'suspend',label:'Suspend',short:'Suspend',desc:'TRX + Reformer',levels:[1.5,2],duration:60,color:'#f59e0b'},
    {id:'fit',label:'F.I.T.',short:'FIT',desc:'HIIT cardio Pilates',levels:[2,2.5],duration:60,color:'#dc2626'},
    {id:'teen',label:'Teen',short:'Teen',desc:'Ados 14-19 ans',levels:[1,1.5],duration:60,color:'#06b6d4'}
  ];
  function _coursType(id){return COURS_TYPES.find(function(c){return c.id===id;});}
  function _formatNiv(n){return n===1?'N1':n===1.5?'N1.5':n===2?'N2':n===2.5?'N2.5':'N'+n;}
  function _coursLabel(classId,niveau){
    var c=_coursType(classId);
    if(!c)return '';
    if(c.levels.length===1)return c.label;
    return c.label+' '+_formatNiv(niveau||c.levels[0]);
  }

  // (STARTER_SCHEDULE retiré v3 — remplacé par WEEK_SLOTS + CLASS_POOLS dynamique
  //  pour génération aléatoire variée par studio dans _seedPlanning)
  var SLOT_PX=30;       // pixels par tranche 30min
  var DAY_START=6;      // heure début affichage
  var DAY_END=22;       // heure fin affichage
  var WORKING_HOURS=Math.max(1,DAY_END-DAY_START);

  // ── State accessors ────────────────────────────────────────────────────────
  function _people(){if(!S.people)S.people={};return S.people;}
  function _shifts(sid){if(!S.shifts)S.shifts={};if(!S.shifts[sid])S.shifts[sid]=[];return S.shifts[sid];}
  function _templates(sid){if(!S.shiftTemplates)S.shiftTemplates={};if(!S.shiftTemplates[sid])S.shiftTemplates[sid]=[];return S.shiftTemplates[sid];}
  function _proposals(sid){if(!S.shiftProposals)S.shiftProposals={};if(!S.shiftProposals[sid])S.shiftProposals[sid]=[];return S.shiftProposals[sid];}
  function _allShifts(){
    var out=[];
    Object.keys(S.shifts||{}).forEach(function(sid){_shifts(sid).forEach(function(s){out.push(Object.assign({_sid:sid},s));});});
    return out;
  }
  function _isAssocie(){return typeof isSuperAdmin==='function'&&isSuperAdmin();}

  // ── Helpers : dates ────────────────────────────────────────────────────────
  function _today(){var d=new Date();d.setHours(0,0,0,0);return d;}
  function _weekStart(d){d=d?new Date(d):_today();var dow=d.getDay();var diff=dow===0?-6:1-dow;d.setDate(d.getDate()+diff);d.setHours(0,0,0,0);return d;}
  function _addDays(d,n){d=new Date(d);d.setDate(d.getDate()+n);return d;}
  function _ymd(d){var y=d.getFullYear(),m=d.getMonth()+1,j=d.getDate();return y+'-'+(m<10?'0':'')+m+'-'+(j<10?'0':'')+j;}
  function _parseYmd(s){if(!s)return null;var p=s.split('-');return new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));}
  function _hm(s){if(!s)return 0;var p=s.split(':');return parseInt(p[0])*60+parseInt(p[1]||0);}
  function _shiftDuration(sh){return Math.max(0,_hm(sh.fin)-_hm(sh.debut))/60;}
  function _formatWeek(d){
    var ws=new Date(d);
    var we=_addDays(ws,6);
    var mLabel=we.toLocaleDateString('fr-FR',{month:'short'});
    var sameMonth=ws.getMonth()===we.getMonth();
    if(sameMonth)return ws.getDate()+'→'+we.getDate()+' '+mLabel;
    return ws.getDate()+' '+ws.toLocaleDateString('fr-FR',{month:'short'})+' → '+we.getDate()+' '+mLabel;
  }
  function _formatDay(d){return d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});}

  // ── Helpers : ID & save ────────────────────────────────────────────────────
  function _uid(p){return (p||'p')+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
  function _now(){return new Date().toISOString();}

  // ── Saves async avec error handling (sinon les modifs disparaissent au sync) ─
  async function _savePeople(){
    if(typeof sb==='undefined')return false;
    try{
      var res=await sb.from('studios').upsert({id:'_people',data:{people:S.people||{}},updated_at:_now()});
      if(res.error){console.error('[Équipe] _savePeople:',res.error);toast('⚠ Erreur sauvegarde équipe : '+res.error.message);return false;}
      return true;
    }catch(e){console.error('[Équipe] _savePeople exception:',e);toast('⚠ Erreur sauvegarde équipe : '+(e.message||e));return false;}
  }
  async function _saveShifts(sid){
    if(typeof sb==='undefined')return false;
    try{
      var res=await sb.from('studios').upsert({id:sid+'_shifts',data:{shifts:_shifts(sid)},updated_at:_now()});
      if(res.error){console.error('[Équipe] _saveShifts ('+sid+'):',res.error);toast('⚠ Erreur sauvegarde planning : '+res.error.message);return false;}
      return true;
    }catch(e){console.error('[Équipe] _saveShifts exception:',e);toast('⚠ Erreur sauvegarde planning : '+(e.message||e));return false;}
  }
  async function _saveTemplates(sid){
    if(typeof sb==='undefined')return false;
    try{
      var res=await sb.from('studios').upsert({id:sid+'_shift_templates',data:{templates:_templates(sid)},updated_at:_now()});
      if(res.error){console.error('[Équipe] _saveTemplates ('+sid+'):',res.error);toast('⚠ Erreur sauvegarde templates : '+res.error.message);return false;}
      return true;
    }catch(e){console.error('[Équipe] _saveTemplates exception:',e);toast('⚠ Erreur sauvegarde templates : '+(e.message||e));return false;}
  }
  async function _saveProposals(sid){
    if(typeof sb==='undefined')return false;
    try{
      var res=await sb.from('studios').upsert({id:sid+'_shift_proposals',data:{proposals:_proposals(sid)},updated_at:_now()});
      if(res.error){console.error('[Équipe] _saveProposals ('+sid+'):',res.error);toast('⚠ Erreur sauvegarde propositions : '+res.error.message);return false;}
      return true;
    }catch(e){console.error('[Équipe] _saveProposals exception:',e);toast('⚠ Erreur sauvegarde propositions : '+(e.message||e));return false;}
  }

  // ── Studios accessibles ────────────────────────────────────────────────────
  function _studioIds(){
    if(typeof _getStudioIds==='function')return _getStudioIds();
    return Object.keys(S.studios||{});
  }
  function _studioName(sid){return (S.studios&&S.studios[sid]&&S.studios[sid].name)||sid;}

  // ── Stats ──────────────────────────────────────────────────────────────────
  function _personWeekHours(personId,weekStartYmd){
    var ws=weekStartYmd;
    var we=_ymd(_addDays(_parseYmd(ws),6));
    var t=0;
    _allShifts().forEach(function(s){
      if(s.person_id!==personId)return;
      if(s.date<ws||s.date>we)return;
      t+=_shiftDuration(s);
    });
    return t;
  }
  function _personMonthHours(personId,y,m){
    var t=0;
    _allShifts().forEach(function(s){
      if(s.person_id!==personId)return;
      var d=_parseYmd(s.date);if(!d)return;
      if(d.getFullYear()===y&&d.getMonth()===m)t+=_shiftDuration(s);
    });
    return t;
  }
  function _personMonthCost(personId,y,m){
    var p=_people()[personId];if(!p)return 0;
    return _personMonthHours(personId,y,m)*(parseFloat(p.tarif_horaire)||0);
  }

  // ── Filter accessors (UI state) ────────────────────────────────────────────
  function _curWeekYmd(){
    if(!S.equipeWeekStart)S.equipeWeekStart=_ymd(_weekStart());
    return S.equipeWeekStart;
  }
  function _curStudioFilter(){return S.equipeStudioFilter||'all';}
  function _curRoleFilter(){return S.equipeRoleFilter||'all';}

  // ════════════════════════════════════════════════════════════════════════════
  // ── STYLES ──────────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  function _ensureStyles(){
    if(document.getElementById('eq-styles'))return;
    var css=''
      // ── Wrapper ──
      +'.eq{max-width:1280px;margin:0 auto;padding:0 16px 120px;animation:eqFade .35s cubic-bezier(.2,.8,.2,1)}'
      +'@keyframes eqFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'
      // ── Hero ──
      +'.eq-hero{position:relative;margin:0 -16px 16px;padding:48px 32px 36px;overflow:hidden;background:linear-gradient(140deg,#0a0e2a 0%,#1a1450 35%,#3a1280 70%,#0a0e2a 100%);color:#fff;border-radius:0 0 28px 28px}'
      +'.eq-hero-canvas{position:absolute;inset:0;pointer-events:none;overflow:hidden}'
      +'.eq-orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:.6;animation:eqOrbFloat var(--dur,14s) ease-in-out infinite alternate}'
      +'.eq-orb.o1{width:380px;height:380px;background:radial-gradient(closest-side,#6366f1,transparent);top:-100px;left:-50px;--dur:14s}'
      +'.eq-orb.o2{width:340px;height:340px;background:radial-gradient(closest-side,#a855f7,transparent);top:-60px;right:-60px;--dur:18s}'
      +'.eq-orb.o3{width:280px;height:280px;background:radial-gradient(closest-side,#06b6d4,transparent);bottom:-80px;left:35%;--dur:16s}'
      +'@keyframes eqOrbFloat{from{transform:translate(0,0) scale(1)}to{transform:translate(28px,18px) scale(1.07)}}'
      +'.eq-hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:50px 50px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,#000 30%,transparent 100%)}'
      +'.eq-hero-content{position:relative;z-index:2}'
      +'.eq-hero-eyebrow{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.12);border:.5px solid rgba(255,255,255,.2);padding:6px 14px;border-radius:999px;font:700 10.5px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,255,255,.85);margin-bottom:14px;backdrop-filter:blur(8px)}'
      +'.eq-hero-eyebrow .dot{width:6px;height:6px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80;animation:eqBlink 2s ease-in-out infinite}'
      +'@keyframes eqBlink{0%,100%{opacity:1}50%{opacity:.4}}'
      +'.eq-hero-title{font:700 clamp(26px,4vw,38px)/1.1 -apple-system,system-ui,"SF Pro Display",Inter,sans-serif;letter-spacing:-1.2px;margin:0 0 8px;background:linear-gradient(180deg,#fff 0%,rgba(255,255,255,.78) 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}'
      +'.eq-hero-sub{font:400 14px/1.45 -apple-system,system-ui,Inter,sans-serif;color:rgba(255,255,255,.7);max-width:580px;margin:0 0 22px}'
      +'.eq-hero-stats{display:flex;flex-wrap:wrap;gap:14px}'
      +'.eq-stat{padding:11px 16px;background:rgba(255,255,255,.08);border:.5px solid rgba(255,255,255,.12);border-radius:13px;backdrop-filter:blur(14px);min-width:120px}'
      +'.eq-stat .v{font:700 22px/1 -apple-system,system-ui,Inter,sans-serif;color:#fff;font-variant-numeric:tabular-nums;display:block;margin-bottom:4px}'
      +'.eq-stat .l{font:600 10px/1 -apple-system,system-ui,Inter,sans-serif;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.6px}'
      // ── Sub-tabs ──
      +'.eq-tabs{display:flex;gap:4px;background:rgba(120,120,128,.08);padding:4px;border-radius:14px;margin-bottom:18px;overflow-x:auto;scrollbar-width:none}'
      +'.eq-tabs::-webkit-scrollbar{display:none}'
      +'body.dark .eq-tabs{background:rgba(255,255,255,.04)}'
      +'.eq-tab{flex:1;min-width:auto;background:transparent;border:none;padding:10px 14px;border-radius:10px;font:600 13px/1 -apple-system,system-ui,Inter,sans-serif;color:#64748b;cursor:pointer;transition:all .2s cubic-bezier(.34,1.56,.52,1);display:flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap}'
      +'body.dark .eq-tab{color:#9ba9ba}'
      +'.eq-tab.active{background:#fff;color:#0f1f3d;box-shadow:0 2px 6px -2px rgba(10,14,28,.15);transform:translateY(-1px)}'
      +'body.dark .eq-tab.active{background:#1c2433;color:#f0f6fc}'
      +'.eq-tab-badge{background:rgba(120,120,128,.18);color:#475569;font:700 10px/1 -apple-system,system-ui,Inter,sans-serif;padding:3px 7px;border-radius:8px}'
      +'.eq-tab.active .eq-tab-badge{background:rgba(37,99,235,.15);color:#2563eb}'
      // ── Body ──
      +'.eq-body{animation:eqFade .35s cubic-bezier(.2,.8,.2,1)}'
      // ── Toolbar (planning) ──
      +'.eq-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:14px;padding:12px 14px;background:#fff;border:.5px solid rgba(10,14,28,.07);border-radius:14px;box-shadow:0 2px 10px -4px rgba(10,14,28,.08)}'
      +'body.dark .eq-toolbar{background:#1c2433;border-color:rgba(255,255,255,.06)}'
      +'.eq-nav{display:flex;align-items:center;gap:6px}'
      +'.eq-nav-btn{background:rgba(120,120,128,.1);border:none;width:34px;height:34px;border-radius:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#0f1f3d;transition:background .2s,transform .15s}'
      +'.eq-nav-btn:hover{background:rgba(120,120,128,.18)}.eq-nav-btn:active{transform:scale(.92)}'
      +'body.dark .eq-nav-btn{background:rgba(255,255,255,.07);color:#e6edf3}'
      +'.eq-nav-btn svg{width:16px;height:16px}'
      +'.eq-week-label{font:700 14px/1 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;padding:0 8px;font-variant-numeric:tabular-nums;min-width:170px;text-align:center}'
      +'body.dark .eq-week-label{color:#f0f6fc}'
      +'.eq-today-btn{background:rgba(37,99,235,.1);color:#2563eb;border:none;padding:8px 14px;border-radius:9px;font:700 12px/1 -apple-system,system-ui,Inter,sans-serif;cursor:pointer;transition:background .2s}'
      +'.eq-today-btn:hover{background:rgba(37,99,235,.18)}'
      +'.eq-spacer{flex:1}'
      +'.eq-select{background:#fff;border:.5px solid rgba(10,14,28,.12);border-radius:9px;padding:8px 28px 8px 12px;font:600 12px/1 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;cursor:pointer;outline:none;-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\'><polyline points=\'6 9 12 15 18 9\'/></svg>");background-repeat:no-repeat;background-position:right 8px center;background-size:14px}'
      +'body.dark .eq-select{background-color:#1c2433;color:#e6edf3;border-color:rgba(255,255,255,.1)}'
      +'.eq-add-btn{background:linear-gradient(180deg,#2563eb,#1e40af);color:#fff;border:none;padding:10px 16px;border-radius:10px;font:700 13px/1 -apple-system,system-ui,Inter,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:7px;box-shadow:0 4px 12px -3px rgba(37,99,235,.5);transition:transform .15s cubic-bezier(.34,1.56,.52,1)}'
      +'.eq-add-btn:hover{transform:translateY(-1px)}.eq-add-btn:active{transform:scale(.97)}'
      +'.eq-add-btn svg{width:14px;height:14px}'
      // ── Planning grid ──
      +'.eq-plan{background:#fff;border:.5px solid rgba(10,14,28,.07);border-radius:16px;overflow:hidden;box-shadow:0 4px 16px -6px rgba(10,14,28,.1)}'
      +'body.dark .eq-plan{background:#1c2433;border-color:rgba(255,255,255,.06)}'
      +'.eq-plan-hdr{display:grid;grid-template-columns:60px repeat(7,1fr);background:linear-gradient(180deg,#fafbfd,#f3f5f9);border-bottom:.5px solid rgba(10,14,28,.08);position:sticky;top:0;z-index:5}'
      +'body.dark .eq-plan-hdr{background:linear-gradient(180deg,#21293a,#1a2130);border-bottom-color:rgba(255,255,255,.05)}'
      +'.eq-plan-hdr-cell{padding:11px 8px 10px;text-align:center;font:700 10.5px/1.2 -apple-system,system-ui,Inter,sans-serif;color:#64748b;text-transform:uppercase;letter-spacing:.6px;border-right:.5px solid rgba(10,14,28,.05)}'
      +'.eq-plan-hdr-cell:last-child{border-right:none}'
      +'body.dark .eq-plan-hdr-cell{color:#9ba9ba;border-right-color:rgba(255,255,255,.04)}'
      +'.eq-plan-hdr-cell.today{background:rgba(37,99,235,.08);color:#2563eb}'
      +'body.dark .eq-plan-hdr-cell.today{background:rgba(37,99,235,.18);color:#93c5fd}'
      +'.eq-plan-hdr-cell .day{display:block;font-size:9.5px;letter-spacing:1px}'
      +'.eq-plan-hdr-cell .num{display:block;font-size:18px;font-weight:800;color:#0f1f3d;letter-spacing:-.3px;margin-top:3px;font-variant-numeric:tabular-nums}'
      +'body.dark .eq-plan-hdr-cell .num{color:#f0f6fc}'
      +'.eq-plan-hdr-cell.today .num{color:#2563eb}'
      +'.eq-plan-grid{display:grid;grid-template-columns:60px repeat(7,1fr);position:relative}'
      +'.eq-plan-hours{display:flex;flex-direction:column;border-right:.5px solid rgba(10,14,28,.06)}'
      +'body.dark .eq-plan-hours{border-right-color:rgba(255,255,255,.04)}'
      +'.eq-hour-row{height:'+SLOT_PX+'px;display:flex;align-items:flex-start;justify-content:flex-end;padding:2px 8px 0 0;font:600 10px/1 -apple-system,system-ui,Inter,sans-serif;color:#94a3b8;font-variant-numeric:tabular-nums;border-top:.5px solid rgba(10,14,28,.03)}'
      +'.eq-hour-row.h-major{border-top:.5px solid rgba(10,14,28,.07);font-weight:700;color:#475569}'
      +'body.dark .eq-hour-row{color:#6b7280;border-top-color:rgba(255,255,255,.025)}'
      +'body.dark .eq-hour-row.h-major{color:#9ba9ba;border-top-color:rgba(255,255,255,.05)}'
      +'.eq-day-col{position:relative;border-right:.5px solid rgba(10,14,28,.05);min-height:'+(WORKING_HOURS*SLOT_PX*2)+'px}'
      +'.eq-day-col:last-child{border-right:none}'
      +'body.dark .eq-day-col{border-right-color:rgba(255,255,255,.04)}'
      +'.eq-day-col.today{background:rgba(37,99,235,.025)}'
      +'body.dark .eq-day-col.today{background:rgba(37,99,235,.05)}'
      +'.eq-day-slot{position:absolute;left:0;right:0;height:'+SLOT_PX+'px;border-top:.5px dashed transparent;cursor:pointer;transition:background .15s}'
      +'.eq-day-slot:hover{background:rgba(37,99,235,.06)}'
      +'.eq-day-slot.h-major{border-top-color:rgba(10,14,28,.05)}'
      +'body.dark .eq-day-slot.h-major{border-top-color:rgba(255,255,255,.035)}'
      // ── Mobile elements cachés par défaut (desktop) ──
      +'.eq-day-col-mobile-hdr,.eq-day-col-mobile-list{display:none}'
      // ── Shift cards ──
      +'.eq-shift{position:absolute;left:3px;right:3px;border-radius:8px;padding:5px 7px;font-family:-apple-system,system-ui,Inter,sans-serif;cursor:pointer;overflow:hidden;transition:transform .15s,box-shadow .15s,filter .15s;border-left:3px solid;background:var(--bg);color:var(--c);box-shadow:0 1px 3px rgba(10,14,28,.08);animation:eqShiftIn .35s cubic-bezier(.34,1.56,.52,1)}'
      +'@keyframes eqShiftIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}'
      +'.eq-shift:hover{transform:translateY(-1px) scale(1.01);box-shadow:0 4px 12px -2px rgba(10,14,28,.18);z-index:3;filter:brightness(1.04)}'
      +'.eq-shift.proposed{opacity:.65;border-left-style:dashed}'
      +'.eq-shift.unassigned{background:rgba(220,38,38,.1)!important;color:#991b1b!important;border-left-color:#dc2626!important;animation:eqUnassPulse 2.4s ease-in-out infinite}'
      +'@keyframes eqUnassPulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.4)}50%{box-shadow:0 0 0 4px rgba(220,38,38,0)}}'
      +'body.dark .eq-shift.unassigned{color:#fca5a5!important}'
      +'.eq-shift-time{font-size:9.5px;font-weight:700;letter-spacing:.2px;font-variant-numeric:tabular-nums;opacity:.85;margin-bottom:1px}'
      +'.eq-shift-title{font-size:11.5px;font-weight:700;letter-spacing:-.1px;line-height:1.15;margin-bottom:1px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}'
      +'.eq-shift-person{font-size:10.5px;font-weight:600;opacity:.85;display:flex;align-items:center;gap:3px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}'
      +'.eq-shift-status{position:absolute;top:3px;right:3px;font-size:9px;padding:1px 4px;border-radius:5px;font-weight:700;letter-spacing:.3px}'
      +'.eq-shift-status.confirme{background:rgba(22,163,74,.2);color:#166534}'
      +'.eq-shift-status.propose{background:rgba(245,158,11,.22);color:#92400e}'
      +'.eq-shift-status.refuse{background:rgba(220,38,38,.2);color:#991b1b}'
      // ── Mobile : planning vertical par jour ──
      +'@media(max-width:780px){'
        +'.eq-plan-hdr{display:none}'
        +'.eq-plan-grid{grid-template-columns:1fr;display:block}'
        +'.eq-plan-hours{display:none}'
        +'.eq-day-col{border-right:none;border-bottom:.5px solid rgba(10,14,28,.07);min-height:auto;padding:8px 0}'
        +'body.dark .eq-day-col{border-bottom-color:rgba(255,255,255,.05)}'
        +'.eq-day-slot{display:none}' // pas de slots cliquables vides en mobile
        +'.eq-shift{display:none}' // les shifts desktop sont aussi cachés (utilise versions mobile)
        +'.eq-day-col-mobile-hdr{display:flex!important;align-items:center;justify-content:space-between;padding:8px 14px 6px;font:700 12px/1 -apple-system,system-ui,Inter,sans-serif;color:#64748b;text-transform:uppercase;letter-spacing:.6px}'
        +'.eq-day-col-mobile-hdr.today{color:#2563eb}'
        +'.eq-day-col-mobile-hdr .num{font-size:16px;color:#0f1f3d;letter-spacing:-.3px}'
        +'body.dark .eq-day-col-mobile-hdr .num{color:#f0f6fc}'
        +'.eq-day-col-mobile-list{padding:0 12px 8px;display:flex!important;flex-direction:column;gap:6px}'
        +'.eq-shift-mobile{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:var(--bg);border-left:3px solid var(--c);cursor:pointer}'
        +'.eq-shift-mobile-time{font:700 11.5px/1 -apple-system,system-ui,Inter,sans-serif;color:var(--c);min-width:74px;font-variant-numeric:tabular-nums}'
        +'.eq-shift-mobile-meta{flex:1;min-width:0}'
        +'.eq-shift-mobile-title{font:700 13px/1.2 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d}'
        +'body.dark .eq-shift-mobile-title{color:#f0f6fc}'
        +'.eq-shift-mobile-person{font:500 11px/1.2 -apple-system,system-ui,Inter,sans-serif;color:#64748b;margin-top:2px}'
        +'body.dark .eq-shift-mobile-person{color:#9ba9ba}'
        +'.eq-day-empty{padding:14px 16px;text-align:center;font:500 12px/1.4 -apple-system,system-ui,Inter,sans-serif;color:#94a3b8;border:.5px dashed rgba(120,120,128,.25);border-radius:10px;margin:0 12px}'
      +'}'
      // ── Trombinoscope ──
      +'.eq-trombi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}'
      +'.eq-trombi-card{position:relative;background:#fff;border:.5px solid rgba(10,14,28,.08);border-radius:18px;padding:18px;box-shadow:0 3px 12px -5px rgba(10,14,28,.1);transition:transform .22s cubic-bezier(.34,1.56,.52,1),box-shadow .22s;animation:eqShiftIn .4s cubic-bezier(.34,1.56,.52,1)}'
      +'body.dark .eq-trombi-card{background:#1c2433;border-color:rgba(255,255,255,.06)}'
      +'.eq-trombi-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px -10px rgba(10,14,28,.2)}'
      +'.eq-trombi-card.archived{opacity:.55}'
      +'.eq-trombi-head{display:flex;align-items:center;gap:12px;margin-bottom:14px}'
      +'.eq-avatar{width:54px;height:54px;border-radius:14px;background:linear-gradient(135deg,var(--ac),color-mix(in srgb,var(--ac) 60%,#000));color:#fff;display:flex;align-items:center;justify-content:center;font:700 19px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:-.5px;flex-shrink:0;box-shadow:0 6px 14px -4px color-mix(in srgb,var(--ac) 50%,transparent)}'
      +'.eq-avatar img{width:100%;height:100%;object-fit:cover;border-radius:14px}'
      +'.eq-trombi-meta{flex:1;min-width:0}'
      +'.eq-trombi-name{font:700 16px/1.2 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;letter-spacing:-.3px;margin-bottom:3px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}'
      +'body.dark .eq-trombi-name{color:#f0f6fc}'
      +'.eq-role-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:7px;font:700 10px/1 -apple-system,system-ui,Inter,sans-serif;background:var(--bg);color:var(--ac);letter-spacing:.4px;text-transform:uppercase}'
      +'.eq-trombi-info{display:flex;flex-direction:column;gap:7px;margin-bottom:14px}'
      +'.eq-trombi-row{display:flex;align-items:center;gap:8px;font:500 12.5px/1.3 -apple-system,system-ui,Inter,sans-serif;color:#475569}'
      +'body.dark .eq-trombi-row{color:#9ba9ba}'
      +'.eq-trombi-row svg{width:13px;height:13px;color:#94a3b8;flex-shrink:0}'
      +'.eq-trombi-row a{color:inherit;text-decoration:none}'
      +'.eq-trombi-row a:hover{color:var(--ac);text-decoration:underline}'
      +'.eq-trombi-stats{display:flex;gap:8px;padding-top:12px;border-top:.5px solid rgba(10,14,28,.06)}'
      +'body.dark .eq-trombi-stats{border-top-color:rgba(255,255,255,.05)}'
      +'.eq-trombi-stat{flex:1;text-align:center}'
      +'.eq-trombi-stat .v{font:800 17px/1 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;font-variant-numeric:tabular-nums;letter-spacing:-.3px}'
      +'body.dark .eq-trombi-stat .v{color:#f0f6fc}'
      +'.eq-trombi-stat .l{font:600 9.5px/1 -apple-system,system-ui,Inter,sans-serif;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-top:3px;display:block}'
      +'.eq-trombi-actions{position:absolute;top:14px;right:14px;display:flex;gap:4px;opacity:0;transition:opacity .2s}'
      +'.eq-trombi-card:hover .eq-trombi-actions{opacity:1}'
      +'.eq-icon-btn{background:rgba(120,120,128,.12);border:none;width:30px;height:30px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;transition:background .15s,color .15s}'
      +'.eq-icon-btn:hover{background:rgba(37,99,235,.15);color:#2563eb}'
      +'.eq-icon-btn.danger:hover{background:rgba(220,38,38,.15);color:#dc2626}'
      +'body.dark .eq-icon-btn{background:rgba(255,255,255,.07);color:#9ba9ba}'
      +'.eq-icon-btn svg{width:14px;height:14px}'
      // ── Empty state ──
      +'.eq-empty{text-align:center;padding:60px 20px;color:#94a3b8;font:500 14px/1.5 -apple-system,system-ui,Inter,sans-serif;background:#fff;border:.5px dashed rgba(120,120,128,.25);border-radius:16px}'
      +'body.dark .eq-empty{background:#1c2433;border-color:rgba(255,255,255,.07)}'
      +'.eq-empty-ico{font-size:38px;margin-bottom:12px;opacity:.45}'
      +'.eq-empty-cta{margin-top:18px;display:inline-flex}'
      // ── Tables (templates / propositions / costs) ──
      +'.eq-table-wrap{background:#fff;border:.5px solid rgba(10,14,28,.07);border-radius:14px;overflow:hidden;box-shadow:0 3px 12px -5px rgba(10,14,28,.08)}'
      +'body.dark .eq-table-wrap{background:#1c2433;border-color:rgba(255,255,255,.06)}'
      +'.eq-table{width:100%;border-collapse:separate;border-spacing:0;font:500 13px/1.4 -apple-system,system-ui,Inter,sans-serif;font-variant-numeric:tabular-nums}'
      +'.eq-table th{font-weight:700;color:#64748b;text-align:left;padding:10px 14px;font-size:10.5px;letter-spacing:.7px;text-transform:uppercase;border-bottom:.5px solid rgba(10,14,28,.08);background:#fafbfd}'
      +'body.dark .eq-table th{color:#9ba9ba;border-bottom-color:rgba(255,255,255,.06);background:#21293a}'
      +'.eq-table td{padding:11px 14px;color:#0f1f3d;border-bottom:.5px solid rgba(10,14,28,.05)}'
      +'body.dark .eq-table td{color:#e6edf3;border-bottom-color:rgba(255,255,255,.04)}'
      +'.eq-table tr:last-child td{border-bottom:none}'
      +'.eq-table tr:hover td{background:rgba(37,99,235,.04)}'
      +'body.dark .eq-table tr:hover td{background:rgba(37,99,235,.08)}'
      +'.eq-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:7px;font:700 10.5px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:.3px;text-transform:uppercase}'
      +'.eq-pill.ok{background:rgba(22,163,74,.12);color:#166534}'
      +'.eq-pill.pending{background:rgba(245,158,11,.14);color:#92400e}'
      +'.eq-pill.ko{background:rgba(220,38,38,.12);color:#991b1b}'
      +'.eq-pill.draft{background:rgba(120,120,128,.14);color:#475569}'
      // ── Costs ──
      +'.eq-costs-grand{margin-top:14px;padding:18px 22px;background:linear-gradient(135deg,#1e40af,#7c3aed);color:#fff;border-radius:16px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 8px 24px -6px rgba(124,58,237,.45)}'
      +'.eq-costs-grand-l{font:700 12px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:6px}'
      +'.eq-costs-grand-v{font:800 32px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:-1px;font-variant-numeric:tabular-nums}'
      // ── Modal (overlay générique) ──
      +'.eq-modal{position:fixed;inset:0;height:100vh;height:100dvh;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(8,12,24,.6);backdrop-filter:blur(20px) saturate(1.4);animation:eqFade .25s cubic-bezier(.2,.8,.2,1);padding:max(14px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))}'
      +'.eq-modal-card{position:relative;width:min(560px,100%);max-height:min(720px,100dvh);background:#fff;border-radius:22px;box-shadow:0 30px 80px -20px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.6) inset;display:flex;flex-direction:column;overflow:hidden;animation:eqModalPop .42s cubic-bezier(.34,1.56,.52,1)}'
      +'body.dark .eq-modal-card{background:#1c2433;box-shadow:0 30px 80px -20px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.07) inset}'
      +'@keyframes eqModalPop{from{opacity:0;transform:scale(.94) translateY(20px)}to{opacity:1;transform:none}}'
      +'.eq-modal-hdr{padding:20px 22px 14px;border-bottom:.5px solid rgba(120,120,128,.13);display:flex;align-items:center;gap:10px}'
      +'body.dark .eq-modal-hdr{border-bottom-color:rgba(255,255,255,.07)}'
      +'.eq-modal-title{flex:1;font:700 17px/1.2 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;letter-spacing:-.3px}'
      +'body.dark .eq-modal-title{color:#f0f6fc}'
      +'.eq-modal-close{background:rgba(120,120,128,.12);border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#475569;transition:background .15s}'
      +'.eq-modal-close:hover{background:rgba(120,120,128,.2)}'
      +'body.dark .eq-modal-close{background:rgba(255,255,255,.07);color:#c9d1d9}'
      +'.eq-modal-close svg{width:14px;height:14px}'
      +'.eq-modal-body{flex:1;overflow-y:auto;padding:18px 22px;-webkit-overflow-scrolling:touch}'
      +'.eq-modal-foot{padding:14px 22px max(18px,env(safe-area-inset-bottom));border-top:.5px solid rgba(120,120,128,.13);display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}'
      +'body.dark .eq-modal-foot{border-top-color:rgba(255,255,255,.07)}'
      // ── Photo upload (modal personne) ──
      +'.eq-photo-upload{display:flex;align-items:center;gap:14px;padding:14px;background:rgba(120,120,128,.05);border:.5px solid rgba(10,14,28,.06);border-radius:12px;margin-bottom:18px}'
      +'body.dark .eq-photo-upload{background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.05)}'
      +'.eq-photo-preview{width:72px;height:72px;border-radius:18px;background:linear-gradient(135deg,var(--ac,#2563eb),color-mix(in srgb,var(--ac,#2563eb) 65%,#000));display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;overflow:hidden;box-shadow:0 8px 18px -6px color-mix(in srgb,var(--ac,#2563eb) 50%,transparent)}'
      +'.eq-photo-preview svg{width:34px;height:34px;opacity:.85}'
      +'.eq-photo-preview img{width:100%;height:100%;object-fit:cover;border-radius:18px}'
      +'.eq-photo-meta{flex:1;min-width:0}'
      +'.eq-photo-title{font:700 14px/1 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;margin-bottom:3px}'
      +'body.dark .eq-photo-title{color:#f0f6fc}'
      +'.eq-photo-sub{font:500 11.5px/1.4 -apple-system,system-ui,Inter,sans-serif;color:#94a3b8;margin-bottom:8px}'
      +'.eq-photo-actions{display:flex;gap:6px;flex-wrap:wrap}'
      +'.eq-photo-actions .eq-btn{padding:7px 12px;font-size:12px}'
      // ── Avatar dans shift card (desktop) ──
      +'.eq-shift-pavatar{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:var(--c,#3b82f6);color:#fff;font:700 9px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:-.3px;flex-shrink:0;overflow:hidden;border:1.5px solid rgba(255,255,255,.6)}'
      +'.eq-shift-pavatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}'
      // ── Avatar dans shift card mobile ──
      +'.eq-shift-mobile-avatar{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 65%,#000));color:#fff;display:flex;align-items:center;justify-content:center;font:700 14px/1 -apple-system,system-ui,Inter,sans-serif;flex-shrink:0;overflow:hidden;box-shadow:0 4px 10px -3px color-mix(in srgb,var(--c) 50%,transparent)}'
      +'.eq-shift-mobile-avatar img{width:100%;height:100%;object-fit:cover;border-radius:12px}'
      +'.eq-shift-mobile-avatar.unassigned{background:linear-gradient(135deg,#dc2626,#991b1b);font-size:18px}'
      // ── Form ──
      +'.eq-field{margin-bottom:14px}'
      +'.eq-field label{display:block;font:700 10.5px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:.7px;text-transform:uppercase;color:#64748b;margin-bottom:6px}'
      +'body.dark .eq-field label{color:#9ba9ba}'
      +'.eq-field input,.eq-field select,.eq-field textarea{width:100%;background:#fff;border:.5px solid rgba(10,14,28,.13);border-radius:10px;padding:10px 12px;font:500 14px/1.4 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;outline:none;box-sizing:border-box;transition:border-color .15s,box-shadow .15s}'
      +'.eq-field input:focus,.eq-field select:focus,.eq-field textarea:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.14)}'
      +'body.dark .eq-field input,body.dark .eq-field select,body.dark .eq-field textarea{background:rgba(16,22,34,.7);border-color:rgba(255,255,255,.1);color:#e6edf3}'
      +'.eq-field-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
      +'@media(max-width:480px){.eq-field-row{grid-template-columns:1fr}}'
      +'.eq-checks{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}'
      +'.eq-check{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;background:rgba(120,120,128,.08);border:.5px solid rgba(10,14,28,.08);border-radius:9px;font:600 12px/1 -apple-system,system-ui,Inter,sans-serif;color:#475569;cursor:pointer;user-select:none;transition:all .15s}'
      +'body.dark .eq-check{background:rgba(255,255,255,.05);color:#c9d1d9;border-color:rgba(255,255,255,.07)}'
      +'.eq-check.active{background:rgba(37,99,235,.12);color:#2563eb;border-color:rgba(37,99,235,.3)}'
      +'.eq-check input{display:none}'
      // ── Buttons ──
      +'.eq-btn{display:inline-flex;align-items:center;gap:7px;background:#fff;color:#0f1f3d;border:.5px solid rgba(10,14,28,.13);border-radius:10px;padding:9px 16px;font:700 13px/1 -apple-system,system-ui,Inter,sans-serif;cursor:pointer;transition:all .15s}'
      +'.eq-btn:hover{background:rgba(120,120,128,.05);border-color:rgba(10,14,28,.22)}'
      +'body.dark .eq-btn{background:#1c2433;color:#e6edf3;border-color:rgba(255,255,255,.1)}'
      +'.eq-btn.primary{background:linear-gradient(180deg,#2563eb,#1e40af);color:#fff;border-color:transparent;box-shadow:0 4px 12px -3px rgba(37,99,235,.5)}'
      +'.eq-btn.primary:hover{transform:translateY(-1px)}.eq-btn.primary:active{transform:scale(.97)}'
      +'.eq-btn.danger{background:#dc2626;color:#fff;border-color:transparent}'
      +'.eq-btn.ghost{background:transparent;border-color:transparent}'
      +'.eq-btn svg{width:14px;height:14px}'
      // ── Photo lightbox (cliquable Apple-like, FLIP transition) ──
      +'.eq-photo-lb{position:fixed;inset:0;z-index:10000;background:rgba(6,10,22,0);backdrop-filter:blur(0);-webkit-backdrop-filter:blur(0);transition:background .55s cubic-bezier(.32,1.5,.4,1),backdrop-filter .55s cubic-bezier(.32,1.5,.4,1),-webkit-backdrop-filter .55s cubic-bezier(.32,1.5,.4,1);cursor:zoom-out;overflow:hidden}'
      +'.eq-photo-lb.active{background:rgba(6,10,22,.86);backdrop-filter:blur(40px) saturate(1.7);-webkit-backdrop-filter:blur(40px) saturate(1.7)}'
      +'.eq-photo-lb-img{position:fixed;background-size:cover;background-position:center center;box-shadow:0 0 0 1px rgba(255,255,255,.06);transition:top .58s cubic-bezier(.32,1.5,.4,1),left .58s cubic-bezier(.32,1.5,.4,1),width .58s cubic-bezier(.32,1.5,.4,1),height .58s cubic-bezier(.32,1.5,.4,1),border-radius .58s cubic-bezier(.32,1.5,.4,1),box-shadow .55s cubic-bezier(.32,1.5,.4,1)}'
      +'.eq-photo-lb.active .eq-photo-lb-img{box-shadow:0 30px 100px -15px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.12)}'
      +'.eq-photo-lb-caption{position:fixed;left:0;right:0;bottom:max(40px,env(safe-area-inset-bottom));text-align:center;color:#fff;opacity:0;transform:translateY(8px);transition:opacity .35s cubic-bezier(.32,1.5,.4,1) .2s,transform .35s cubic-bezier(.32,1.5,.4,1) .2s;pointer-events:none;padding:0 24px}'
      +'.eq-photo-lb.active .eq-photo-lb-caption{opacity:1;transform:none}'
      +'.eq-photo-lb-name{font:700 22px/1.2 -apple-system,system-ui,"SF Pro Display",Inter,sans-serif;letter-spacing:-.5px;background:linear-gradient(180deg,#fff 0%,rgba(255,255,255,.78) 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px}'
      +'.eq-photo-lb-role{font:500 13.5px/1.3 -apple-system,system-ui,Inter,sans-serif;color:rgba(255,255,255,.55);letter-spacing:.2px}'
      +'.eq-photo-lb-hint{position:fixed;top:max(28px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);color:rgba(255,255,255,.45);font:500 11.5px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:.5px;opacity:0;transition:opacity .35s cubic-bezier(.32,1.5,.4,1) .35s;pointer-events:none;display:flex;align-items:center;gap:8px}'
      +'.eq-photo-lb.active .eq-photo-lb-hint{opacity:1}'
      +'.eq-photo-lb-hint kbd{background:rgba(255,255,255,.1);border:.5px solid rgba(255,255,255,.18);border-radius:6px;padding:3px 8px;font:600 11px/1 -apple-system,system-ui,Inter,sans-serif;color:rgba(255,255,255,.75)}'
      // Avatar cliquable (cursor zoom-in)
      +'.eq-avatar.clickable{cursor:zoom-in;transition:transform .22s cubic-bezier(.34,1.56,.52,1)}'
      +'.eq-avatar.clickable:hover{transform:scale(1.06)}'
      +'.eq-avatar.clickable:active{transform:scale(.96)}'
      +'.eq-shift-pavatar.clickable{cursor:zoom-in}'
      +'.eq-shift-mobile-avatar.clickable{cursor:zoom-in;transition:transform .18s cubic-bezier(.34,1.56,.52,1)}'
      +'.eq-shift-mobile-avatar.clickable:active{transform:scale(.94)}'
      // ── Selection mode (planning) ──
      +'.eq-shift.selected{outline:3px solid #f59e0b;outline-offset:1px;z-index:4}'
      +'.eq-selection-bar{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#0f1f3d;color:#fff;padding:11px 18px;border-radius:14px;box-shadow:0 12px 30px -8px rgba(0,0,0,.5);display:flex;align-items:center;gap:14px;font:600 13px/1 -apple-system,system-ui,Inter,sans-serif;z-index:9000;animation:eqSelBarIn .3s cubic-bezier(.34,1.56,.52,1)}'
      +'@keyframes eqSelBarIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}'
      +'.eq-selection-bar .eq-btn{background:#fff;color:#0f1f3d}'
      +'.eq-selection-bar .eq-btn.ghost{background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.15)}'
      ;
    var s=document.createElement('style');s.id='eq-styles';s.textContent=css;document.head.appendChild(s);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── HERO ────────────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  function _renderHero(){
    var ppl=_people();
    var ids=Object.keys(ppl).filter(function(id){return ppl[id].statut!=='archive';});
    var nbCoachs=ids.filter(function(id){return ppl[id].type==='coach';}).length;
    var nbEmpl=ids.filter(function(id){return ppl[id].type==='employe';}).length;
    var ws=_curWeekYmd();
    var hCours=0,hAccueil=0;
    var unassigned=0;
    var wsd=_parseYmd(ws),we=_ymd(_addDays(wsd,6));
    _allShifts().forEach(function(sh){
      if(sh.date<ws||sh.date>we)return;
      var d=_shiftDuration(sh);
      if(sh.type==='cours')hCours+=d;
      else if(sh.type==='accueil')hAccueil+=d;
      if(!sh.person_id)unassigned++;
    });

    var h='<div class="eq-hero">';
    h+=  '<div class="eq-hero-canvas"><div class="eq-orb o1"></div><div class="eq-orb o2"></div><div class="eq-orb o3"></div><div class="eq-hero-grid"></div></div>';
    h+=  '<div class="eq-hero-content">';
    h+=    '<div class="eq-hero-eyebrow"><span class="dot"></span>Équipe & Planning</div>';
    h+=    '<h1 class="eq-hero-title">Pilote ton équipe terrain</h1>';
    h+=    '<p class="eq-hero-sub">Employés à l\'accueil, coachs freelance pour les cours. Planning visuel, propositions par email, suivi heures et coûts.</p>';
    h+=    '<div class="eq-hero-stats">';
    h+=      '<div class="eq-stat"><span class="v">'+ids.length+'</span><span class="l">Personnes actives</span></div>';
    h+=      '<div class="eq-stat"><span class="v">'+nbEmpl+'</span><span class="l">Employés accueil</span></div>';
    h+=      '<div class="eq-stat"><span class="v">'+nbCoachs+'</span><span class="l">Coachs freelance</span></div>';
    h+=      '<div class="eq-stat"><span class="v">'+Math.round(hCours)+'h</span><span class="l">Cours / semaine</span></div>';
    h+=      '<div class="eq-stat"><span class="v">'+Math.round(hAccueil)+'h</span><span class="l">Accueil / semaine</span></div>';
    if(unassigned>0)h+='<div class="eq-stat" style="background:rgba(220,38,38,.18);border-color:rgba(220,38,38,.4)"><span class="v" style="color:#fca5a5">'+unassigned+'</span><span class="l">À pourvoir</span></div>';
    h+=    '</div>';
    h+=  '</div>';
    h+='</div>';
    return h;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── SUB-TABS ────────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  function _renderSubTabs(active){
    var ppl=_people();
    var nbActive=Object.keys(ppl).filter(function(id){return ppl[id].statut!=='archive';}).length;
    var nbProposalsPending=0;
    Object.keys(S.shiftProposals||{}).forEach(function(sid){
      _proposals(sid).forEach(function(p){if(p.statut==='envoye')nbProposalsPending++;});
    });
    var tabs=[
      {id:'planning',label:'Planning',ico:'📅'},
      {id:'trombi',label:'Trombinoscope',ico:'👥',badge:nbActive},
      {id:'templates',label:'Templates',ico:'🔁'},
      {id:'propositions',label:'Propositions',ico:'✉️',badge:nbProposalsPending}
    ];
    if(_isAssocie())tabs.push({id:'costs',label:'Coûts & paie',ico:'💰'});
    var h='<div class="eq-tabs" role="tablist">';
    tabs.forEach(function(t){
      h+='<button class="eq-tab'+(active===t.id?' active':'')+'" onclick="window._eqSetSub(\''+t.id+'\')" role="tab"><span>'+t.ico+'</span><span>'+t.label+'</span>';
      if(t.badge>0)h+='<span class="eq-tab-badge">'+t.badge+'</span>';
      h+='</button>';
    });
    h+='</div>';
    return h;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── PLANNING ────────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  function _renderPlanning(){
    var wsYmd=_curWeekYmd();
    var wsDate=_parseYmd(wsYmd);
    var todayYmd=_ymd(_today());
    var sf=_curStudioFilter();
    var rf=_curRoleFilter();
    var sids=_studioIds();

    var h='';
    // ── Toolbar ──
    h+='<div class="eq-toolbar">';
    h+=  '<div class="eq-nav">';
    h+=    '<button class="eq-nav-btn" onclick="window._eqWeek(-1)" aria-label="Semaine précédente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>';
    h+=    '<div class="eq-week-label">'+_formatWeek(wsDate)+'</div>';
    h+=    '<button class="eq-nav-btn" onclick="window._eqWeek(1)" aria-label="Semaine suivante"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg></button>';
    h+=    '<button class="eq-today-btn" onclick="window._eqWeek(0)">Aujourd\'hui</button>';
    h+=  '</div>';
    h+=  '<div class="eq-spacer"></div>';
    h+=  '<select class="eq-select" onchange="window._eqStudioFilter(this.value)">';
    h+=    '<option value="all"'+(sf==='all'?' selected':'')+'>Tous studios</option>';
    sids.forEach(function(sid){
      h+='<option value="'+sid+'"'+(sf===sid?' selected':'')+'>'+_esc(_studioName(sid))+'</option>';
    });
    h+=  '</select>';
    h+=  '<select class="eq-select" onchange="window._eqRoleFilter(this.value)">';
    ['all','accueil','cours','menage','admin'].forEach(function(r){
      var lbl=r==='all'?'Tous types':SHIFT_TYPE[r].label;
      h+='<option value="'+r+'"'+(rf===r?' selected':'')+'>'+lbl+'</option>';
    });
    h+=  '</select>';
    h+=  '<button class="eq-btn" onclick="window._eqSeedPlanning()" style="background:linear-gradient(180deg,#7c3aed,#5b21b6);color:#fff;border-color:transparent" title="Pré-remplit 45h/sem × 26 sem pour chaque studio (cours aléatoires variés, à pourvoir, modifiables)">🧘 Pré-remplir planning Club Pilates</button>';
    h+=  '<button class="eq-add-btn" onclick="window._eqOpenShift(null)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Nouveau créneau</button>';
    h+='</div>';

    // ── Grille ──
    h+='<div class="eq-plan">';
    // Header (desktop only via CSS)
    h+='<div class="eq-plan-hdr">';
    h+='<div class="eq-plan-hdr-cell"></div>';
    for(var i=0;i<7;i++){
      var d=_addDays(wsDate,i);
      var ymd=_ymd(d);
      var isToday=ymd===todayYmd;
      h+='<div class="eq-plan-hdr-cell'+(isToday?' today':'')+'"><span class="day">'+DAYS[i]+'</span><span class="num">'+d.getDate()+'</span></div>';
    }
    h+='</div>';

    // Body
    h+='<div class="eq-plan-grid">';
    // Hours column (desktop)
    h+='<div class="eq-plan-hours">';
    for(var hr=DAY_START;hr<DAY_END;hr++){
      h+='<div class="eq-hour-row h-major">'+hr+'h</div>';
      h+='<div class="eq-hour-row">'+hr+':30</div>';
    }
    h+='</div>';

    // 7 day columns
    for(var di=0;di<7;di++){
      var dDate=_addDays(wsDate,di);
      var dYmd=_ymd(dDate);
      var isTd=dYmd===todayYmd;
      h+='<div class="eq-day-col'+(isTd?' today':'')+'" data-date="'+dYmd+'">';
      // Mobile header
      h+='<div class="eq-day-col-mobile-hdr'+(isTd?' today':'')+'"><span>'+_formatDay(dDate)+'</span></div>';
      // Slot grid (clickable empty slots — desktop)
      var slotIdx=0;
      for(var hr2=DAY_START;hr2<DAY_END;hr2++){
        for(var m=0;m<2;m++){
          var hh=(hr2<10?'0':'')+hr2+':'+(m===0?'00':'30');
          var top=slotIdx*SLOT_PX;
          h+='<div class="eq-day-slot'+(m===0?' h-major':'')+'" style="top:'+top+'px" data-time="'+hh+'" data-date="'+dYmd+'" onclick="window._eqOpenShift(null,\''+dYmd+'\',\''+hh+'\')"></div>';
          slotIdx++;
        }
      }
      // Shifts for this day
      var dayShifts=_dayShifts(dYmd,sf,rf);
      // Mobile list
      h+='<div class="eq-day-col-mobile-list">';
      if(dayShifts.length===0){
        h+='<div class="eq-day-empty">Aucun créneau · cliquez pour ajouter</div>';
      }else{
        dayShifts.forEach(function(sh){h+=_renderShiftMobile(sh);});
      }
      h+='</div>';
      // Desktop absolute positioning
      dayShifts.forEach(function(sh){h+=_renderShiftDesktop(sh);});
      h+='</div>';
    }
    h+='</div>';
    h+='</div>';

    // ── Selection bar (if any selected) ──
    if(S.equipeSelectedShifts&&S.equipeSelectedShifts.length){
      var n=S.equipeSelectedShifts.length;
      h+='<div class="eq-selection-bar">';
      h+=  '<span>'+n+' créneau'+(n>1?'x':'')+' sélectionné'+(n>1?'s':'')+'</span>';
      h+=  '<button class="eq-btn ghost" onclick="window._eqClearSelection()">Annuler</button>';
      h+=  '<button class="eq-btn primary" onclick="window._eqOpenProposeFromSelection()">✉️ Proposer à un coach</button>';
      h+='</div>';
    }
    return h;
  }

  function _dayShifts(ymd,studioFilter,roleFilter){
    var out=[];
    _allShifts().forEach(function(sh){
      if(sh.date!==ymd)return;
      if(studioFilter!=='all'&&sh._sid!==studioFilter)return;
      if(roleFilter!=='all'&&sh.type!==roleFilter)return;
      out.push(sh);
    });
    out.sort(function(a,b){return _hm(a.debut)-_hm(b.debut);});
    return out;
  }

  function _shiftPositionStyle(sh){
    var startMin=_hm(sh.debut)-DAY_START*60;
    var durMin=_hm(sh.fin)-_hm(sh.debut);
    var top=Math.max(0,startMin)/30*SLOT_PX;
    var height=Math.max(SLOT_PX*0.7,durMin/30*SLOT_PX-1);
    return 'top:'+top+'px;height:'+height+'px';
  }

  function _personInitials(p){
    if(!p)return '?';
    return ((p.prenom||'?').charAt(0)+(p.nom||'').charAt(0)).toUpperCase();
  }

  function _shiftColors(sh){
    var t=SHIFT_TYPE[sh.type]||SHIFT_TYPE.accueil;
    // Si cours avec class_id défini, utilise la couleur de la classe
    if(sh.type==='cours'&&sh.cours&&sh.cours.class_id){
      var c=_coursType(sh.cours.class_id);
      if(c){
        return {color:c.color,bg:'color-mix(in srgb,'+c.color+' 18%,transparent)',border:c.color,ico:t.ico};
      }
    }
    return {color:t.color,bg:t.bg,border:t.border,ico:t.ico};
  }

  function _renderShiftDesktop(sh){
    var t=SHIFT_TYPE[sh.type]||SHIFT_TYPE.accueil;
    var col=_shiftColors(sh);
    var p=_people()[sh.person_id];
    var unassigned=!sh.person_id;
    var statusCls=sh.statut==='confirme'?'confirme':sh.statut==='propose'?'propose':sh.statut==='refuse'?'refuse':'';
    var label=sh.cours&&sh.cours.nom?sh.cours.nom:t.label;
    var personLbl=unassigned?'⚠ À pourvoir':(p?(p.prenom+(p.nom?' '+p.nom.charAt(0)+'.':'')):'???');
    var sel=(S.equipeSelectedShifts||[]).indexOf(sh.id)>=0;
    // Avatar (photo ou initiales) — uniquement si personne assignée
    var avatarHtml='';
    if(p){
      if(p.photo){
        avatarHtml='<span class="eq-shift-pavatar clickable" style="--c:'+col.color+'" onclick="event.stopPropagation();window._eqOpenPhotoLB(\''+sh.person_id+'\',this)" title="Voir la photo de '+_esc(p.prenom)+'"><img src="'+_esc(p.photo)+'" alt=""/></span>';
      }else{
        avatarHtml='<span class="eq-shift-pavatar" style="--c:'+col.color+'">'+_personInitials(p)+'</span>';
      }
    }
    var html='<div class="eq-shift'+(unassigned?' unassigned':'')+(sh.statut==='propose'?' proposed':'')+(sel?' selected':'')+'" '
      +'style="--bg:'+col.bg+';--c:'+col.color+';border-left-color:'+col.border+';'+_shiftPositionStyle(sh)+'" '
      +'onclick="event.stopPropagation();window._eqOpenShift(\''+sh.id+'\',\''+sh._sid+'\')" '
      +'oncontextmenu="event.preventDefault();window._eqToggleSelectShift(\''+sh.id+'\')">';
    if(statusCls)html+='<span class="eq-shift-status '+statusCls+'">'+(sh.statut==='confirme'?'✓':sh.statut==='propose'?'…':'✕')+'</span>';
    html+='<div class="eq-shift-time">'+sh.debut+'–'+sh.fin+'</div>';
    html+='<div class="eq-shift-title">'+_esc(label)+'</div>';
    html+='<div class="eq-shift-person" style="display:flex;align-items:center;gap:4px">'+avatarHtml+'<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_esc(personLbl)+'</span></div>';
    html+='</div>';
    return html;
  }

  function _renderShiftMobile(sh){
    var t=SHIFT_TYPE[sh.type]||SHIFT_TYPE.accueil;
    var col=_shiftColors(sh);
    var p=_people()[sh.person_id];
    var unassigned=!sh.person_id;
    var label=sh.cours&&sh.cours.nom?sh.cours.nom:t.label;
    var personLbl=unassigned?'⚠ À pourvoir':(p?(p.prenom+' '+p.nom):'???');
    // Avatar mobile : grand cube avec photo ou initiales (ou ⚠ si à pourvoir)
    var avatarContent;
    if(unassigned)avatarContent='⚠';
    else if(p&&p.photo)avatarContent='<img src="'+_esc(p.photo)+'" alt=""/>';
    else avatarContent=_personInitials(p);
    return '<div class="eq-shift-mobile'+(unassigned?' unassigned':'')+'" '
      +'style="--bg:'+col.bg+';--c:'+col.color+'" '
      +'onclick="window._eqOpenShift(\''+sh.id+'\',\''+sh._sid+'\')">'
      +'<div class="eq-shift-mobile-avatar'+(unassigned?' unassigned':'')+(p&&p.photo?' clickable':'')+'" style="--c:'+col.color+'"'+(p&&p.photo?' onclick="event.stopPropagation();window._eqOpenPhotoLB(\''+sh.person_id+'\',this)" title="Voir la photo"':'')+'>'+avatarContent+'</div>'
      +'<div class="eq-shift-mobile-meta">'
      +'<div class="eq-shift-mobile-title">'+t.ico+' '+_esc(label)+' · '+sh.debut+'–'+sh.fin+'</div>'
      +'<div class="eq-shift-mobile-person">'+_esc(personLbl)+' · '+_esc(_studioName(sh._sid))+'</div>'
      +'</div>'
      +'</div>';
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── TROMBINOSCOPE ───────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  function _renderTrombi(){
    var ppl=_people();
    var ids=Object.keys(ppl);
    ids.sort(function(a,b){
      var pa=ppl[a],pb=ppl[b];
      // Actifs d'abord, puis archivés
      if((pa.statut==='archive')!==(pb.statut==='archive'))return pa.statut==='archive'?1:-1;
      // Puis par type (employés d'abord)
      if(pa.type!==pb.type)return pa.type==='employe'?-1:1;
      // Puis alphabétique
      return ((pa.prenom||'')+(pa.nom||'')).localeCompare((pb.prenom||'')+(pb.nom||''));
    });
    var sf=_curStudioFilter();
    if(sf!=='all'){
      ids=ids.filter(function(id){
        var p=ppl[id];
        if(p.sid===sf)return true;
        return (p.studios||[]).indexOf(sf)>=0;
      });
    }

    var h='';
    h+='<div class="eq-toolbar">';
    h+=  '<select class="eq-select" onchange="window._eqStudioFilter(this.value)">';
    h+=    '<option value="all"'+(sf==='all'?' selected':'')+'>Tous studios</option>';
    _studioIds().forEach(function(sid){
      h+='<option value="'+sid+'"'+(sf===sid?' selected':'')+'>'+_esc(_studioName(sid))+'</option>';
    });
    h+=  '</select>';
    h+=  '<div class="eq-spacer"></div>';
    h+=  '<button class="eq-add-btn" onclick="window._eqOpenPerson(null)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Nouvelle personne</button>';
    h+='</div>';

    if(ids.length===0){
      h+='<div class="eq-empty">';
      h+=  '<div class="eq-empty-ico">👥</div>';
      h+=  '<div><b>Aucune personne enregistrée</b><br/>Ajoutez vos employés d\'accueil et vos coachs freelance pour commencer.</div>';
      h+=  '<div class="eq-empty-cta"><button class="eq-add-btn" onclick="window._eqOpenPerson(null)" style="margin-top:14px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Ajouter une personne</button></div>';
      h+='</div>';
      return h;
    }

    h+='<div class="eq-trombi-grid">';
    var ws=_curWeekYmd();
    var now=new Date();
    ids.forEach(function(id){
      var p=ppl[id];
      var meta=ROLE_META[p.type]||ROLE_META.employe;
      var initials=((p.prenom||'?').charAt(0)+(p.nom||'').charAt(0)).toUpperCase();
      var weekH=_personWeekHours(id,ws);
      var monthH=_personMonthHours(id,now.getFullYear(),now.getMonth());
      h+='<div class="eq-trombi-card'+(p.statut==='archive'?' archived':'')+'">';
      h+=  '<div class="eq-trombi-actions">';
      h+=    '<button class="eq-icon-btn" onclick="window._eqOpenPerson(\''+id+'\')" title="Modifier"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>';
      h+=    '<button class="eq-icon-btn danger" onclick="window._eqArchivePerson(\''+id+'\')" title="'+(p.statut==='archive'?'Réactiver':'Archiver')+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg></button>';
      h+=  '</div>';
      h+=  '<div class="eq-trombi-head">';
      h+=    '<div class="eq-avatar'+(p.photo?' clickable':'')+'" style="--ac:'+meta.color+'"'+(p.photo?' onclick="event.stopPropagation();window._eqOpenPhotoLB(\''+id+'\',this)" title="Voir la photo en grand"':'')+'>';
      if(p.photo)h+='<img src="'+_esc(p.photo)+'" alt="'+_esc(p.prenom)+'"/>';
      else h+=initials;
      h+=    '</div>';
      h+=    '<div class="eq-trombi-meta">';
      h+=      '<div class="eq-trombi-name">'+_esc((p.prenom||'')+' '+(p.nom||''))+'</div>';
      h+=      '<span class="eq-role-pill" style="--ac:'+meta.color+';--bg:'+meta.bg+'">'+meta.ico+' '+meta.label+(p.contrat?' · '+p.contrat:'')+'</span>';
      h+=    '</div>';
      h+=  '</div>';
      h+=  '<div class="eq-trombi-info">';
      if(p.tel)h+='<div class="eq-trombi-row" style="--ac:'+meta.color+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><a href="tel:'+_esc(p.tel)+'">'+_esc(p.tel)+'</a></div>';
      if(p.email)h+='<div class="eq-trombi-row" style="--ac:'+meta.color+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><a href="mailto:'+_esc(p.email)+'">'+_esc(p.email)+'</a></div>';
      var studiosList=(p.studios&&p.studios.length?p.studios:(p.sid?[p.sid]:[])).map(_studioName).join(', ');
      if(studiosList)h+='<div class="eq-trombi-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'+_esc(studiosList)+'</div>';
      if(p.type==='coach'&&p.certifs)h+='<div class="eq-trombi-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>'+_esc(p.certifs)+'</div>';
      h+=  '</div>';
      h+=  '<div class="eq-trombi-stats">';
      h+=    '<div class="eq-trombi-stat"><div class="v">'+weekH.toFixed(1)+'h</div><div class="l">Cette sem.</div></div>';
      h+=    '<div class="eq-trombi-stat"><div class="v">'+monthH.toFixed(0)+'h</div><div class="l">Ce mois</div></div>';
      if(_isAssocie()&&p.tarif_horaire){
        var monthCost=_personMonthCost(id,now.getFullYear(),now.getMonth());
        h+='<div class="eq-trombi-stat"><div class="v" style="color:#7c3aed">'+_fmt(monthCost)+'</div><div class="l">Coût/mois</div></div>';
      }
      h+=  '</div>';
      h+='</div>';
    });
    h+='</div>';
    return h;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── TEMPLATES ───────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  function _renderTemplates(){
    var sf=_curStudioFilter();
    var sids=sf==='all'?_studioIds():[sf];
    var allTpls=[];
    sids.forEach(function(sid){_templates(sid).forEach(function(t){allTpls.push(Object.assign({_sid:sid},t));});});
    allTpls.sort(function(a,b){return a.jour-b.jour||_hm(a.debut)-_hm(b.debut);});

    var h='';
    h+='<div class="eq-toolbar">';
    h+=  '<select class="eq-select" onchange="window._eqStudioFilter(this.value)">';
    h+=    '<option value="all"'+(sf==='all'?' selected':'')+'>Tous studios</option>';
    _studioIds().forEach(function(sid){
      h+='<option value="'+sid+'"'+(sf===sid?' selected':'')+'>'+_esc(_studioName(sid))+'</option>';
    });
    h+=  '</select>';
    h+=  '<button class="eq-btn" onclick="window._eqApplyTemplates()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/></svg>Générer 4 sem.</button>';
    h+=  '<div class="eq-spacer"></div>';
    h+=  '<button class="eq-add-btn" onclick="window._eqOpenTemplate(null)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Nouveau pattern</button>';
    h+='</div>';

    if(allTpls.length===0){
      h+='<div class="eq-empty"><div class="eq-empty-ico">🔁</div><div><b>Aucun template récurrent</b><br/>Définissez des créneaux qui reviennent toutes les semaines (ex : "Lundi 7h-13h Léa accueil", "Mardi 18h Reformer Sarah").</div><div class="eq-empty-cta"><button class="eq-add-btn" onclick="window._eqOpenTemplate(null)" style="margin-top:14px">Créer mon premier pattern</button></div></div>';
      return h;
    }

    h+='<div class="eq-table-wrap">';
    h+='<table class="eq-table">';
    h+='<thead><tr><th>Jour</th><th>Horaire</th><th>Type</th><th>Personne</th><th>Studio</th><th></th></tr></thead>';
    h+='<tbody>';
    var ppl=_people();
    allTpls.forEach(function(t){
      var meta=SHIFT_TYPE[t.type]||SHIFT_TYPE.accueil;
      var p=ppl[t.person_id];
      var personLbl=p?(p.prenom+' '+p.nom):'<span style="color:#dc2626">⚠ À pourvoir</span>';
      // Affichage : si type=cours et class_id défini, utiliser couleur classe + label spécifique
      var coursTypeObj=t.cours_class?_coursType(t.cours_class):null;
      var pillBg=coursTypeObj?'color-mix(in srgb,'+coursTypeObj.color+' 14%,#fff)':meta.bg;
      var pillColor=coursTypeObj?coursTypeObj.color:meta.color;
      var pillLabel=coursTypeObj?(meta.ico+' '+t.cours_nom):(meta.ico+' '+meta.label);
      h+='<tr>';
      h+=  '<td><b>'+DAYS[t.jour]+'</b></td>';
      h+=  '<td style="font-variant-numeric:tabular-nums">'+t.debut+' → '+t.fin+'</td>';
      h+=  '<td><span class="eq-pill" style="background:'+pillBg+';color:'+pillColor+'">'+_esc(pillLabel)+'</span></td>';
      h+=  '<td>'+personLbl+'</td>';
      h+=  '<td>'+_esc(_studioName(t._sid))+'</td>';
      h+=  '<td style="text-align:right;white-space:nowrap"><button class="eq-icon-btn" onclick="window._eqOpenTemplate(\''+t.id+'\',\''+t._sid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button> <button class="eq-icon-btn danger" onclick="window._eqDeleteTemplate(\''+t.id+'\',\''+t._sid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></button></td>';
      h+='</tr>';
    });
    h+='</tbody></table>';
    h+='</div>';
    return h;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── PROPOSITIONS ────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  function _renderPropositions(){
    var all=[];
    Object.keys(S.shiftProposals||{}).forEach(function(sid){
      _proposals(sid).forEach(function(pr){all.push(Object.assign({_sid:sid},pr));});
    });
    all.sort(function(a,b){return (b.date_envoi||'').localeCompare(a.date_envoi||'');});

    var h='';
    h+='<div class="eq-toolbar">';
    h+=  '<div style="font:600 13px/1 -apple-system,system-ui,Inter,sans-serif;color:#64748b">Historique des propositions envoyées aux coachs</div>';
    h+='</div>';

    if(all.length===0){
      h+='<div class="eq-empty"><div class="eq-empty-ico">✉️</div><div><b>Aucune proposition envoyée</b><br/>Sélectionnez des créneaux dans le planning (clic droit) puis "Proposer à un coach".</div></div>';
      return h;
    }

    h+='<div class="eq-table-wrap">';
    h+='<table class="eq-table">';
    h+='<thead><tr><th>Coach</th><th>Studio</th><th>Période</th><th>Créneaux</th><th>Heures</th><th>Statut</th><th>Envoyé</th><th></th></tr></thead>';
    h+='<tbody>';
    var ppl=_people();
    all.forEach(function(pr){
      var coach=ppl[pr.coach_id];
      var coachLbl=coach?(coach.prenom+' '+coach.nom):'???';
      var nbShifts=(pr.shift_ids||[]).length;
      var totalH=0;
      (pr.shift_ids||[]).forEach(function(sid){
        var sh=_shifts(pr._sid).find(function(s){return s.id===sid;});
        if(sh)totalH+=_shiftDuration(sh);
      });
      var statutCls=pr.statut==='accepte'?'ok':pr.statut==='refuse'?'ko':pr.statut==='envoye'?'pending':'draft';
      var statutLbl=pr.statut==='accepte'?'Accepté':pr.statut==='refuse'?'Refusé':pr.statut==='envoye'?'En attente':'Brouillon';
      h+='<tr>';
      h+=  '<td><b>'+_esc(coachLbl)+'</b></td>';
      h+=  '<td>'+_esc(_studioName(pr._sid))+'</td>';
      h+=  '<td>'+_esc(pr.periode||'—')+'</td>';
      h+=  '<td>'+nbShifts+'</td>';
      h+=  '<td>'+totalH.toFixed(1)+'h</td>';
      h+=  '<td><span class="eq-pill '+statutCls+'">'+statutLbl+'</span></td>';
      h+=  '<td style="font-variant-numeric:tabular-nums">'+(pr.date_envoi?pr.date_envoi.slice(0,10):'—')+'</td>';
      h+=  '<td style="text-align:right;white-space:nowrap">';
      if(pr.statut==='envoye'){
        h+='<button class="eq-btn" style="padding:5px 10px;font-size:11px" onclick="window._eqMarkProposal(\''+pr.id+'\',\''+pr._sid+'\',\'accepte\')">✓ Accepté</button> ';
        h+='<button class="eq-btn" style="padding:5px 10px;font-size:11px" onclick="window._eqMarkProposal(\''+pr.id+'\',\''+pr._sid+'\',\'refuse\')">✕ Refusé</button>';
      }
      h+='<button class="eq-icon-btn danger" onclick="window._eqDeleteProposal(\''+pr.id+'\',\''+pr._sid+'\')" style="margin-left:5px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></button>';
      h+=  '</td>';
      h+='</tr>';
    });
    h+='</tbody></table>';
    h+='</div>';
    return h;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── COSTS (associés only) ───────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  function _renderCosts(){
    if(!_isAssocie()){
      return '<div class="eq-empty"><div class="eq-empty-ico">🔒</div><div><b>Réservé aux associés</b><br/>Cette vue contient les tarifs et coûts. Accessible uniquement aux super-admins (Paul, Tom).</div></div>';
    }
    var now=new Date();
    var y=S.equipeCostYear||now.getFullYear();
    var m=S.equipeCostMonth!=null?S.equipeCostMonth:now.getMonth();
    var monthLabel=new Date(y,m,1).toLocaleDateString('fr-FR',{month:'long',year:'numeric'});

    var ppl=_people();
    var rows=[];
    var totalCost=0,totalH=0;
    Object.keys(ppl).forEach(function(id){
      var p=ppl[id];
      if(p.statut==='archive')return;
      var hours=_personMonthHours(id,y,m);
      if(hours===0)return;
      var rate=parseFloat(p.tarif_horaire)||0;
      var cost=hours*rate;
      totalCost+=cost;totalH+=hours;
      rows.push({id:id,p:p,h:hours,rate:rate,cost:cost});
    });
    rows.sort(function(a,b){return b.cost-a.cost;});

    var h='';
    h+='<div class="eq-toolbar">';
    h+=  '<div class="eq-nav">';
    h+=    '<button class="eq-nav-btn" onclick="window._eqCostMonth(-1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"/></svg></button>';
    h+=    '<div class="eq-week-label" style="text-transform:capitalize">'+monthLabel+'</div>';
    h+=    '<button class="eq-nav-btn" onclick="window._eqCostMonth(1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg></button>';
    h+=  '</div>';
    h+=  '<div class="eq-spacer"></div>';
    h+=  '<div style="font:600 12px/1 -apple-system,system-ui,Inter,sans-serif;color:#94a3b8">'+rows.length+' personnes · '+totalH.toFixed(1)+'h</div>';
    h+='</div>';

    if(rows.length===0){
      h+='<div class="eq-empty"><div class="eq-empty-ico">📊</div><div><b>Aucune heure travaillée ce mois</b><br/>Les coûts apparaîtront ici dès qu\'un créneau sera enregistré.</div></div>';
      return h;
    }

    h+='<div class="eq-table-wrap">';
    h+='<table class="eq-table">';
    h+='<thead><tr><th>Personne</th><th>Type</th><th>Heures</th><th>Tarif</th><th>Coût total</th></tr></thead>';
    h+='<tbody>';
    rows.forEach(function(r){
      var meta=ROLE_META[r.p.type]||ROLE_META.employe;
      h+='<tr>';
      h+=  '<td><b>'+_esc((r.p.prenom||'')+' '+(r.p.nom||''))+'</b></td>';
      h+=  '<td><span class="eq-pill" style="background:'+meta.bg+';color:'+meta.color+'">'+meta.ico+' '+meta.label+'</span></td>';
      h+=  '<td>'+r.h.toFixed(1)+'h</td>';
      h+=  '<td>'+r.rate.toFixed(2)+' €/h</td>';
      h+=  '<td><b>'+_fmt(r.cost)+'</b></td>';
      h+='</tr>';
    });
    h+='</tbody></table>';
    h+='</div>';

    h+='<div class="eq-costs-grand">';
    h+=  '<div><div class="eq-costs-grand-l">Total masse salariale</div><div style="font:500 13px/1 -apple-system,system-ui,Inter,sans-serif;color:rgba(255,255,255,.7);margin-top:6px">'+totalH.toFixed(1)+'h travaillées</div></div>';
    h+=  '<div class="eq-costs-grand-v">'+_fmt(totalCost)+'</div>';
    h+='</div>';
    return h;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── MODAL : Personne ────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  function _openPerson(personId){
    _ensureStyles();
    var ppl=_people();
    var p=personId?ppl[personId]:null;
    var isNew=!p;
    var data=isNew?{type:'employe',contrat:'CDI',studios:[],statut:'actif'}:Object.assign({},p);
    if(!data.studios)data.studios=data.sid?[data.sid]:[];

    var ov=document.createElement('div');
    ov.className='eq-modal';
    ov.innerHTML=''
      +'<div class="eq-modal-card">'
      +  '<div class="eq-modal-hdr">'
      +    '<div class="eq-modal-title">'+(isNew?'Nouvelle personne':'Modifier la personne')+'</div>'
      +    '<button class="eq-modal-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
      +  '</div>'
      +  '<div class="eq-modal-body">'
      +    '<div class="eq-photo-upload">'
      +      '<div class="eq-photo-preview" id="eq-photo-preview" style="--ac:'+(ROLE_META[data.type]||ROLE_META.employe).color+'">'
      +        (data.photo?'<img src="'+_esc(data.photo)+'" alt=""/>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>')
      +      '</div>'
      +      '<div class="eq-photo-meta">'
      +        '<div class="eq-photo-title">Photo</div>'
      +        '<div class="eq-photo-sub">JPG / PNG · max 8 Mo · idéal carré (auto redim 800px)</div>'
      +        '<div class="eq-photo-actions">'
      +          '<label class="eq-btn" style="cursor:pointer"><input type="file" id="eq-photo-input" accept="image/*" style="display:none"/>📷 '+(data.photo?'Changer':'Téléverser')+'</label>'
      +          (data.photo?'<button class="eq-btn ghost" data-eq-photo-clear style="color:#dc2626">Retirer</button>':'')
      +        '</div>'
      +      '</div>'
      +    '</div>'
      +    '<div class="eq-field"><label>Type</label>'
      +      '<div class="eq-checks">'
      +        '<label class="eq-check'+(data.type==='employe'?' active':'')+'"><input type="radio" name="eq-type" value="employe"'+(data.type==='employe'?' checked':'')+'/>🛎️ Employé accueil</label>'
      +        '<label class="eq-check'+(data.type==='coach'?' active':'')+'"><input type="radio" name="eq-type" value="coach"'+(data.type==='coach'?' checked':'')+'/>🧘 Coach freelance</label>'
      +      '</div>'
      +    '</div>'
      +    '<div class="eq-field-row">'
      +      '<div class="eq-field"><label>Prénom *</label><input id="eq-prenom" value="'+_esc(data.prenom||'')+'" placeholder="Léa"/></div>'
      +      '<div class="eq-field"><label>Nom *</label><input id="eq-nom" value="'+_esc(data.nom||'')+'" placeholder="Martin"/></div>'
      +    '</div>'
      +    '<div class="eq-field-row">'
      +      '<div class="eq-field"><label>Téléphone</label><input id="eq-tel" value="'+_esc(data.tel||'')+'" placeholder="06 XX XX XX XX"/></div>'
      +      '<div class="eq-field"><label>Email</label><input id="eq-email" type="email" value="'+_esc(data.email||'')+'" placeholder="lea@…"/></div>'
      +    '</div>'
      +    '<div class="eq-field-row">'
      +      '<div class="eq-field"><label>Contrat</label><select id="eq-contrat">'
      +        ['CDI','CDD','Extra','Freelance','Stage'].map(function(c){return '<option value="'+c+'"'+(data.contrat===c?' selected':'')+'>'+c+'</option>';}).join('')
      +      '</select></div>'
      +      '<div class="eq-field"><label>Tarif horaire (€)</label><input id="eq-tarif" type="number" step="0.5" value="'+_esc(data.tarif_horaire||'')+'" placeholder="14"/></div>'
      +    '</div>'
      +    '<div class="eq-field"><label>Studios où la personne intervient *</label>'
      +      '<div class="eq-checks">'
      +        _studioIds().map(function(sid){
                 var checked=(data.studios||[]).indexOf(sid)>=0;
                 return '<label class="eq-check'+(checked?' active':'')+'"><input type="checkbox" data-eq-studio value="'+sid+'"'+(checked?' checked':'')+'/>'+_esc(_studioName(sid))+'</label>';
               }).join('')
      +      '</div>'
      +    '</div>'
      +    '<div class="eq-field"><label>Certifications (coach uniquement)</label><input id="eq-certifs" value="'+_esc(data.certifs||'')+'" placeholder="STOTT · BASI · Polestar…"/></div>'
      +    '<div class="eq-field"><label>Notes</label><textarea id="eq-notes" rows="2" placeholder="Disponibilités préférentielles, infos utiles…">'+_esc(data.notes||'')+'</textarea></div>'
      +  '</div>'
      +  '<div class="eq-modal-foot">'
      +    (isNew?'':'<button class="eq-btn ghost" data-eq-archive style="margin-right:auto;color:#dc2626">'+(data.statut==='archive'?'Réactiver':'Archiver')+'</button>')
      +    '<button class="eq-btn" data-eq-cancel>Annuler</button>'
      +    '<button class="eq-btn primary" data-eq-save>'+(isNew?'Créer':'Enregistrer')+'</button>'
      +  '</div>'
      +'</div>';
    document.body.appendChild(ov);

    // Wire events
    function close(){if(ov.parentNode)ov.parentNode.removeChild(ov);}
    ov.querySelector('.eq-modal-close').onclick=close;
    ov.querySelector('[data-eq-cancel]').onclick=close;
    ov.addEventListener('click',function(e){if(e.target===ov)close();});

    // Type radios visual + recolore le preview photo
    Array.from(ov.querySelectorAll('input[name=eq-type]')).forEach(function(r){
      r.addEventListener('change',function(){
        Array.from(ov.querySelectorAll('label.eq-check')).filter(function(l){return l.querySelector('input[name=eq-type]');}).forEach(function(l){
          l.classList.toggle('active',l.querySelector('input').checked);
        });
        // Update photo preview accent color
        var newType=ov.querySelector('input[name=eq-type]:checked').value;
        var preview=ov.querySelector('#eq-photo-preview');
        if(preview)preview.style.setProperty('--ac',(ROLE_META[newType]||ROLE_META.employe).color);
      });
    });
    // Photo upload : file → base64 redimensionné qualité haute (lightbox-friendly)
    // Max source 8 Mo · downscale 800px max · JPEG q=0.9 + smoothing 'high'
    // Pour très grandes photos : downscale en 2 passes pour préserver la netteté
    var photoInput=ov.querySelector('#eq-photo-input');
    if(photoInput){
      photoInput.addEventListener('change',function(e){
        var f=e.target.files&&e.target.files[0];if(!f)return;
        if(f.size>8*1024*1024){toast('Photo trop lourde (max 8 Mo)');return;}
        var reader=new FileReader();
        reader.onload=function(ev){
          var img=new Image();
          img.onload=function(){
            var TARGET=800; // taille suffisante pour lightbox ~640px en retina
            var w=img.width,h=img.height;
            // Calcul taille finale (préserve ratio, ne grossit jamais)
            var scale=1;
            if(w>TARGET||h>TARGET)scale=w>h?TARGET/w:TARGET/h;
            var finalW=Math.round(w*scale),finalH=Math.round(h*scale);
            // Downscale en plusieurs passes si réduction > 50% (preserve netteté)
            var srcCanvas=document.createElement('canvas');
            srcCanvas.width=w;srcCanvas.height=h;
            var srcCtx=srcCanvas.getContext('2d');
            srcCtx.imageSmoothingEnabled=true;
            srcCtx.imageSmoothingQuality='high';
            srcCtx.drawImage(img,0,0,w,h);
            var curCanvas=srcCanvas,curW=w,curH=h;
            while(curW>finalW*2){
              var nextW=Math.round(curW/2),nextH=Math.round(curH/2);
              var next=document.createElement('canvas');
              next.width=nextW;next.height=nextH;
              var nctx=next.getContext('2d');
              nctx.imageSmoothingEnabled=true;
              nctx.imageSmoothingQuality='high';
              nctx.drawImage(curCanvas,0,0,nextW,nextH);
              curCanvas=next;curW=nextW;curH=nextH;
            }
            // Pass finale → taille cible
            var c=document.createElement('canvas');
            c.width=finalW;c.height=finalH;
            var cx=c.getContext('2d');
            cx.imageSmoothingEnabled=true;
            cx.imageSmoothingQuality='high';
            cx.drawImage(curCanvas,0,0,finalW,finalH);
            var dataUrl=c.toDataURL('image/jpeg',0.9);
            data.photo=dataUrl;
            // Refresh preview
            var preview=ov.querySelector('#eq-photo-preview');
            if(preview)preview.innerHTML='<img src="'+dataUrl+'" alt=""/>';
            // Feedback poids final pour l'utilisateur
            var sizeKB=Math.round(dataUrl.length*0.75/1024); // base64 → bytes approx
            toast('✓ Photo prête ('+finalW+'×'+finalH+'px · ~'+sizeKB+' Ko)',2500);
          };
          img.src=ev.target.result;
        };
        reader.readAsDataURL(f);
      });
    }
    var photoClearBtn=ov.querySelector('[data-eq-photo-clear]');
    if(photoClearBtn){
      photoClearBtn.addEventListener('click',function(e){
        e.preventDefault();
        data.photo='';
        var preview=ov.querySelector('#eq-photo-preview');
        if(preview)preview.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
        photoClearBtn.style.display='none';
      });
    }
    // Studios checks visual
    Array.from(ov.querySelectorAll('input[data-eq-studio]')).forEach(function(c){
      c.addEventListener('change',function(){c.closest('label').classList.toggle('active',c.checked);});
    });

    var archBtn=ov.querySelector('[data-eq-archive]');
    if(archBtn){
      archBtn.onclick=async function(){
        var prev=p.statut;
        p.statut=p.statut==='archive'?'actif':'archive';
        var ok=await _savePeople();
        if(ok){render();close();}
        else{p.statut=prev;} // rollback
      };
    }

    ov.querySelector('[data-eq-save]').onclick=async function(){
      var prenom=ov.querySelector('#eq-prenom').value.trim();
      var nom=ov.querySelector('#eq-nom').value.trim();
      if(!prenom||!nom){toast('Prénom et nom requis');return;}
      var type=(ov.querySelector('input[name=eq-type]:checked')||{}).value||'employe';
      var studios=Array.from(ov.querySelectorAll('input[data-eq-studio]:checked')).map(function(i){return i.value;});
      if(studios.length===0){toast('Au moins un studio requis');return;}
      var rec={
        type:type,prenom:prenom,nom:nom,
        photo:data.photo||'',
        tel:ov.querySelector('#eq-tel').value.trim(),
        email:ov.querySelector('#eq-email').value.trim(),
        contrat:ov.querySelector('#eq-contrat').value,
        tarif_horaire:parseFloat(ov.querySelector('#eq-tarif').value)||0,
        studios:studios,
        sid:studios[0],
        certifs:ov.querySelector('#eq-certifs').value.trim(),
        notes:ov.querySelector('#eq-notes').value.trim(),
        statut:data.statut||'actif',
        date_modif:_now()
      };
      // Snapshot pour rollback en cas d'échec save Supabase
      var rollback;
      if(isNew){
        rec.id=_uid('person');
        rec.date_entree=_now();
        ppl[rec.id]=rec;
        rollback=function(){delete ppl[rec.id];};
      }else{
        var prev=JSON.parse(JSON.stringify(p));
        Object.assign(p,rec);
        rollback=function(){Object.keys(p).forEach(function(k){delete p[k];});Object.assign(p,prev);};
      }
      // Save Supabase + await pour s'assurer que les modifs persistent
      var saveBtn=this;saveBtn.disabled=true;saveBtn.textContent='Enregistrement…';
      var ok=await _savePeople();
      saveBtn.disabled=false;
      if(ok){
        toast('✓ '+(isNew?'Personne ajoutée':'Mise à jour'));
        close();render();
      }else{
        // L'erreur a déjà été toastée par _savePeople — on rollback et on garde le modal ouvert
        rollback();
        saveBtn.textContent=isNew?'Créer':'Enregistrer';
      }
    };
  }

  // ── Photo Lightbox Apple-like (FLIP shared element transition) ────────────
  function _openPhotoLightbox(personId,sourceEl){
    var p=_people()[personId];
    if(!p||!p.photo)return;
    _ensureStyles();
    var rect=sourceEl?sourceEl.getBoundingClientRect():{left:window.innerWidth/2-30,top:window.innerHeight/2-30,width:60,height:60};
    var srcRadius=14;
    if(sourceEl){var cs=getComputedStyle(sourceEl);srcRadius=parseFloat(cs.borderRadius)||14;}
    var role=ROLE_META[p.type]||ROLE_META.employe;
    var ov=document.createElement('div');
    ov.className='eq-photo-lb';
    ov.innerHTML=''
      +'<div class="eq-photo-lb-img" id="eq-lb-img" style="background-image:url(\''+_esc(p.photo)+'\')"></div>'
      +'<div class="eq-photo-lb-caption">'
      +  '<div class="eq-photo-lb-name">'+_esc((p.prenom||'')+' '+(p.nom||''))+'</div>'
      +  '<div class="eq-photo-lb-role">'+role.ico+' '+role.label+(p.contrat?' · '+_esc(p.contrat):'')+'</div>'
      +'</div>'
      +'<div class="eq-photo-lb-hint"><kbd>Esc</kbd> ou clic pour fermer</div>';
    document.body.appendChild(ov);
    var img=ov.querySelector('#eq-lb-img');
    // Position INITIALE = source rect (FLIP "First")
    img.style.top=rect.top+'px';
    img.style.left=rect.left+'px';
    img.style.width=rect.width+'px';
    img.style.height=rect.height+'px';
    img.style.borderRadius=srcRadius+'px';
    // Force layout puis animation vers le centre (FLIP "Last")
    void ov.offsetHeight;
    requestAnimationFrame(function(){
      ov.classList.add('active');
      var size=Math.min(window.innerWidth*0.86,window.innerHeight*0.7,640);
      img.style.top=Math.round((window.innerHeight-size)/2-30)+'px';
      img.style.left=Math.round((window.innerWidth-size)/2)+'px';
      img.style.width=size+'px';
      img.style.height=size+'px';
      img.style.borderRadius='32px';
    });
    try{if(navigator.vibrate)navigator.vibrate(8);}catch(e){}
    var closed=false;
    function close(){
      if(closed)return;closed=true;
      ov.classList.remove('active');
      img.style.top=rect.top+'px';
      img.style.left=rect.left+'px';
      img.style.width=rect.width+'px';
      img.style.height=rect.height+'px';
      img.style.borderRadius=srcRadius+'px';
      setTimeout(function(){
        if(ov.parentNode)ov.parentNode.removeChild(ov);
        document.removeEventListener('keydown',onKey);
      },580);
    }
    function onKey(e){if(e.key==='Escape'||e.key==='Enter'||e.key===' ')close();}
    ov.addEventListener('click',close);
    document.addEventListener('keydown',onKey);
  }

  async function _archivePerson(id){
    var p=_people()[id];if(!p)return;
    var prev=p.statut;
    p.statut=p.statut==='archive'?'actif':'archive';
    var ok=await _savePeople();
    if(ok)render();
    else{p.statut=prev;}
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── MODAL : Créneau (shift) ─────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  function _openShift(shiftId,sidOrDateYmd,timeHm){
    _ensureStyles();
    var sid,sh,isNew=!shiftId;
    if(shiftId){
      // Trouver le shift dans n'importe quel studio
      var found=null;
      Object.keys(S.shifts||{}).forEach(function(s){
        _shifts(s).forEach(function(x){if(x.id===shiftId)found={sid:s,sh:x};});
      });
      if(!found){toast('Créneau introuvable');return;}
      sid=found.sid;sh=found.sh;
    }else{
      // Nouveau créneau : sid = paramètre (ou 1er studio dispo), date/heure depuis click
      sid=sidOrDateYmd&&S.studios[sidOrDateYmd]?sidOrDateYmd:_studioIds()[0];
      var dYmd=(typeof sidOrDateYmd==='string'&&!S.studios[sidOrDateYmd])?sidOrDateYmd:_curWeekYmd();
      sh={
        type:'accueil',date:dYmd,
        debut:timeHm||'09:00',fin:_addTime(timeHm||'09:00',60),
        person_id:'',cours:{},statut:'brouillon'
      };
    }
    var ppl=_people();
    var allowedStudios=_studioIds();

    var ov=document.createElement('div');
    ov.className='eq-modal';
    ov.innerHTML=''
      +'<div class="eq-modal-card">'
      +  '<div class="eq-modal-hdr">'
      +    '<div class="eq-modal-title">'+(isNew?'Nouveau créneau':'Modifier le créneau')+'</div>'
      +    '<button class="eq-modal-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
      +  '</div>'
      +  '<div class="eq-modal-body">'
      +    '<div class="eq-field-row">'
      +      '<div class="eq-field"><label>Studio</label><select id="eq-sid">'
      +        allowedStudios.map(function(s){return '<option value="'+s+'"'+(sid===s?' selected':'')+'>'+_esc(_studioName(s))+'</option>';}).join('')
      +      '</select></div>'
      +      '<div class="eq-field"><label>Type</label><select id="eq-type">'
      +        Object.keys(SHIFT_TYPE).map(function(t){return '<option value="'+t+'"'+(sh.type===t?' selected':'')+'>'+SHIFT_TYPE[t].ico+' '+SHIFT_TYPE[t].label+'</option>';}).join('')
      +      '</select></div>'
      +    '</div>'
      +    '<div class="eq-field"><label>Date</label><input id="eq-date" type="date" value="'+_esc(sh.date)+'"/></div>'
      +    '<div class="eq-field-row">'
      +      '<div class="eq-field"><label>Début</label><input id="eq-debut" type="time" value="'+_esc(sh.debut)+'"/></div>'
      +      '<div class="eq-field"><label>Fin</label><input id="eq-fin" type="time" value="'+_esc(sh.fin)+'"/></div>'
      +    '</div>'
      +    '<div class="eq-field"><label>Personne assignée</label><select id="eq-person">'
      +      '<option value="">⚠ À pourvoir</option>'
      +      Object.keys(ppl).filter(function(id){return ppl[id].statut!=='archive';}).map(function(id){
                var p=ppl[id];
                return '<option value="'+id+'"'+(sh.person_id===id?' selected':'')+'>'+ROLE_META[p.type].ico+' '+_esc(p.prenom+' '+p.nom)+'</option>';
              }).join('')
      +    '</select></div>'
      +    '<div id="eq-cours-fields" style="'+(sh.type==='cours'?'':'display:none')+'">'
      +      '<div class="eq-field-row">'
      +        '<div class="eq-field"><label>Type de cours</label><select id="eq-cours-class">'
      +          '<option value="">— Personnalisé —</option>'
      +          COURS_TYPES.map(function(c){return '<option value="'+c.id+'"'+(sh.cours&&sh.cours.class_id===c.id?' selected':'')+'>'+_esc(c.label)+'</option>';}).join('')
      +        '</select></div>'
      +        '<div class="eq-field"><label>Niveau</label><select id="eq-cours-niveau"></select></div>'
      +      '</div>'
      +      '<div class="eq-field-row">'
      +        '<div class="eq-field"><label>Nom affiché</label><input id="eq-cours-nom" value="'+_esc(sh.cours&&sh.cours.nom||'')+'" placeholder="Reformer Flow N1.5"/></div>'
      +        '<div class="eq-field"><label>Capacité</label><input id="eq-cours-cap" type="number" value="'+_esc(sh.cours&&sh.cours.capacite||12)+'"/></div>'
      +      '</div>'
      +    '</div>'
      +    '<div class="eq-field"><label>Statut</label><select id="eq-statut">'
      +      ['brouillon','propose','confirme','refuse','fait'].map(function(s){
                var lbl={brouillon:'Brouillon',propose:'Proposé au coach',confirme:'Confirmé',refuse:'Refusé',fait:'Effectué'}[s];
                return '<option value="'+s+'"'+(sh.statut===s?' selected':'')+'>'+lbl+'</option>';
              }).join('')
      +    '</select></div>'
      +    '<div class="eq-field"><label>Notes</label><textarea id="eq-notes" rows="2">'+_esc(sh.notes||'')+'</textarea></div>'
      +  '</div>'
      +  '<div class="eq-modal-foot">'
      +    (isNew?'':'<button class="eq-btn ghost" data-eq-delete style="margin-right:auto;color:#dc2626">Supprimer</button>')
      +    '<button class="eq-btn" data-eq-cancel>Annuler</button>'
      +    '<button class="eq-btn primary" data-eq-save>'+(isNew?'Créer':'Enregistrer')+'</button>'
      +  '</div>'
      +'</div>';
    document.body.appendChild(ov);

    function close(){if(ov.parentNode)ov.parentNode.removeChild(ov);}
    ov.querySelector('.eq-modal-close').onclick=close;
    ov.querySelector('[data-eq-cancel]').onclick=close;
    ov.addEventListener('click',function(e){if(e.target===ov)close();});

    // Toggle cours fields
    ov.querySelector('#eq-type').addEventListener('change',function(e){
      ov.querySelector('#eq-cours-fields').style.display=e.target.value==='cours'?'':'none';
    });

    // Sélecteur classe → restreint les niveaux + auto-fill nom + ajuste durée
    function _populateNiveaux(classId,selectedNiveau){
      var nivSel=ov.querySelector('#eq-cours-niveau');
      var c=_coursType(classId);
      if(!c){
        nivSel.innerHTML='<option value="">—</option>';
        nivSel.disabled=true;
        return;
      }
      nivSel.disabled=false;
      nivSel.innerHTML=c.levels.map(function(n){
        return '<option value="'+n+'"'+(selectedNiveau==n?' selected':'')+'>'+_formatNiv(n)+'</option>';
      }).join('');
    }
    var classSel=ov.querySelector('#eq-cours-class');
    if(classSel){
      _populateNiveaux(classSel.value,sh.cours&&sh.cours.niveau);
      classSel.addEventListener('change',function(){
        var c=_coursType(classSel.value);
        _populateNiveaux(classSel.value);
        // Auto-fill nom et durée si c'est un type catalogue
        if(c){
          var niv=ov.querySelector('#eq-cours-niveau').value;
          ov.querySelector('#eq-cours-nom').value=_coursLabel(classSel.value,niv);
          // Ajuste fin selon durée du cours (ex: Intro = 30 min)
          var debut=ov.querySelector('#eq-debut').value;
          if(debut){ov.querySelector('#eq-fin').value=_addTime(debut,c.duration);}
        }
      });
      ov.querySelector('#eq-cours-niveau').addEventListener('change',function(e){
        var c=_coursType(classSel.value);
        if(c)ov.querySelector('#eq-cours-nom').value=_coursLabel(classSel.value,e.target.value);
      });
    }

    var delBtn=ov.querySelector('[data-eq-delete]');
    if(delBtn){
      delBtn.onclick=async function(){
        if(!confirm('Supprimer ce créneau ?'))return;
        var arr=_shifts(sid);
        var idx=arr.findIndex(function(x){return x.id===shiftId;});
        if(idx<0)return;
        var removed=arr.splice(idx,1)[0];
        var ok=await _saveShifts(sid);
        if(ok){toast('✓ Créneau supprimé');close();render();}
        else{arr.splice(idx,0,removed);} // rollback
      };
    }

    ov.querySelector('[data-eq-save]').onclick=async function(){
      var newSid=ov.querySelector('#eq-sid').value;
      var rec={
        type:ov.querySelector('#eq-type').value,
        date:ov.querySelector('#eq-date').value,
        debut:ov.querySelector('#eq-debut').value,
        fin:ov.querySelector('#eq-fin').value,
        person_id:ov.querySelector('#eq-person').value,
        statut:ov.querySelector('#eq-statut').value,
        notes:ov.querySelector('#eq-notes').value.trim()
      };
      if(rec.type==='cours'){
        var classId=ov.querySelector('#eq-cours-class').value;
        var niveau=parseFloat(ov.querySelector('#eq-cours-niveau').value)||null;
        rec.cours={
          nom:ov.querySelector('#eq-cours-nom').value.trim()||'Cours',
          capacite:parseInt(ov.querySelector('#eq-cours-cap').value)||12,
          class_id:classId||'',
          niveau:niveau
        };
      }
      if(_hm(rec.fin)<=_hm(rec.debut)){toast('Heure de fin doit être après début');return;}

      var saveBtn=this;saveBtn.disabled=true;saveBtn.textContent='Enregistrement…';
      var ok=true;
      if(isNew){
        rec.id=_uid('shift');
        rec.date_creation=_now();
        _shifts(newSid).push(rec);
        ok=await _saveShifts(newSid);
        if(!ok){_shifts(newSid).pop();} // rollback
      }else{
        // Si studio changé : retirer ancien, ajouter nouveau
        if(newSid!==sid){
          var oldArr=_shifts(sid);
          var idx=oldArr.findIndex(function(x){return x.id===shiftId;});
          var removed=idx>=0?oldArr.splice(idx,1)[0]:null;
          rec.id=shiftId;
          _shifts(newSid).push(rec);
          var ok1=await _saveShifts(sid);
          var ok2=await _saveShifts(newSid);
          ok=ok1&&ok2;
          if(!ok){
            // Rollback : remettre dans l'ancien studio
            _shifts(newSid).pop();
            if(removed)_shifts(sid).push(removed);
          }
        }else{
          var prev=JSON.parse(JSON.stringify(sh));
          Object.assign(sh,rec);
          ok=await _saveShifts(sid);
          if(!ok){Object.keys(sh).forEach(function(k){delete sh[k];});Object.assign(sh,prev);}
        }
      }
      saveBtn.disabled=false;
      if(ok){
        toast('✓ '+(isNew?'Créneau créé':'Mis à jour'));
        close();render();
      }else{
        saveBtn.textContent=isNew?'Créer':'Enregistrer';
      }
    };
  }

  function _addTime(hm,minutes){
    var t=_hm(hm)+minutes;
    if(t>=24*60)t=23*60+59;
    var h=Math.floor(t/60),m=t%60;
    return (h<10?'0':'')+h+':'+(m<10?'0':'')+m;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── MODAL : Template ────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  function _openTemplate(tplId,sid){
    _ensureStyles();
    var tpl,isNew=!tplId;
    if(tplId){
      var arr=_templates(sid);
      tpl=arr.find(function(t){return t.id===tplId;});
      if(!tpl){toast('Template introuvable');return;}
    }else{
      tpl={type:'accueil',jour:0,debut:'07:00',fin:'13:00',person_id:'',weeks:'all'};
      sid=sid||_studioIds()[0];
    }
    var ppl=_people();

    var ov=document.createElement('div');
    ov.className='eq-modal';
    ov.innerHTML=''
      +'<div class="eq-modal-card">'
      +  '<div class="eq-modal-hdr">'
      +    '<div class="eq-modal-title">'+(isNew?'Nouveau template':'Modifier le template')+'</div>'
      +    '<button class="eq-modal-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
      +  '</div>'
      +  '<div class="eq-modal-body">'
      +    '<div class="eq-field-row">'
      +      '<div class="eq-field"><label>Studio</label><select id="eq-sid">'
      +        _studioIds().map(function(s){return '<option value="'+s+'"'+(sid===s?' selected':'')+'>'+_esc(_studioName(s))+'</option>';}).join('')
      +      '</select></div>'
      +      '<div class="eq-field"><label>Jour</label><select id="eq-jour">'
      +        DAYS.map(function(d,i){return '<option value="'+i+'"'+(tpl.jour===i?' selected':'')+'>'+d+'</option>';}).join('')
      +      '</select></div>'
      +    '</div>'
      +    '<div class="eq-field-row">'
      +      '<div class="eq-field"><label>Début</label><input id="eq-debut" type="time" value="'+_esc(tpl.debut)+'"/></div>'
      +      '<div class="eq-field"><label>Fin</label><input id="eq-fin" type="time" value="'+_esc(tpl.fin)+'"/></div>'
      +    '</div>'
      +    '<div class="eq-field-row">'
      +      '<div class="eq-field"><label>Type</label><select id="eq-type">'
      +        Object.keys(SHIFT_TYPE).map(function(t){return '<option value="'+t+'"'+(tpl.type===t?' selected':'')+'>'+SHIFT_TYPE[t].ico+' '+SHIFT_TYPE[t].label+'</option>';}).join('')
      +      '</select></div>'
      +      '<div class="eq-field"><label>Personne par défaut</label><select id="eq-person">'
      +        '<option value="">À pourvoir</option>'
      +        Object.keys(ppl).filter(function(id){return ppl[id].statut!=='archive';}).map(function(id){
                  var p=ppl[id];
                  return '<option value="'+id+'"'+(tpl.person_id===id?' selected':'')+'>'+ROLE_META[p.type].ico+' '+_esc(p.prenom+' '+p.nom)+'</option>';
                }).join('')
      +      '</select></div>'
      +    '</div>'
      +    '<div id="eq-tpl-cours-fields" style="'+(tpl.type==='cours'?'':'display:none')+'">'
      +      '<div class="eq-field-row">'
      +        '<div class="eq-field"><label>Type de cours</label><select id="eq-cours-class">'
      +          '<option value="">— Personnalisé —</option>'
      +          COURS_TYPES.map(function(c){return '<option value="'+c.id+'"'+(tpl.cours_class===c.id?' selected':'')+'>'+_esc(c.label)+'</option>';}).join('')
      +        '</select></div>'
      +        '<div class="eq-field"><label>Niveau</label><select id="eq-cours-niveau"></select></div>'
      +      '</div>'
      +      '<div class="eq-field"><label>Nom affiché</label><input id="eq-cours-nom" value="'+_esc(tpl.cours_nom||'')+'" placeholder="Reformer Flow N1.5"/></div>'
      +    '</div>'
      +    '<div class="eq-field"><label>Récurrence</label>'
      +      '<div class="eq-checks">'
      +        '<label class="eq-check'+(tpl.weeks==='all'?' active':'')+'"><input type="radio" name="eq-weeks" value="all"'+(tpl.weeks==='all'?' checked':'')+'/>Toutes semaines</label>'
      +        '<label class="eq-check'+(tpl.weeks==='paires'?' active':'')+'"><input type="radio" name="eq-weeks" value="paires"'+(tpl.weeks==='paires'?' checked':'')+'/>Sem. paires</label>'
      +        '<label class="eq-check'+(tpl.weeks==='impaires'?' active':'')+'"><input type="radio" name="eq-weeks" value="impaires"'+(tpl.weeks==='impaires'?' checked':'')+'/>Sem. impaires</label>'
      +      '</div>'
      +    '</div>'
      +  '</div>'
      +  '<div class="eq-modal-foot">'
      +    '<button class="eq-btn" data-eq-cancel>Annuler</button>'
      +    '<button class="eq-btn primary" data-eq-save>'+(isNew?'Créer':'Enregistrer')+'</button>'
      +  '</div>'
      +'</div>';
    document.body.appendChild(ov);

    function close(){if(ov.parentNode)ov.parentNode.removeChild(ov);}
    ov.querySelector('.eq-modal-close').onclick=close;
    ov.querySelector('[data-eq-cancel]').onclick=close;
    ov.addEventListener('click',function(e){if(e.target===ov)close();});

    Array.from(ov.querySelectorAll('input[name=eq-weeks]')).forEach(function(r){
      r.addEventListener('change',function(){
        Array.from(ov.querySelectorAll('label.eq-check')).filter(function(l){return l.querySelector('input[name=eq-weeks]');}).forEach(function(l){
          l.classList.toggle('active',l.querySelector('input').checked);
        });
      });
    });
    // Toggle cours fields selon type
    ov.querySelector('#eq-type').addEventListener('change',function(e){
      var f=ov.querySelector('#eq-tpl-cours-fields');
      if(f)f.style.display=e.target.value==='cours'?'':'none';
    });
    // Sélecteur classe → restreint niveaux + auto-fill nom + ajuste durée
    function _populateNiveauxTpl(classId,selNiv){
      var nivSel=ov.querySelector('#eq-cours-niveau');if(!nivSel)return;
      var c=_coursType(classId);
      if(!c){nivSel.innerHTML='<option value="">—</option>';nivSel.disabled=true;return;}
      nivSel.disabled=false;
      nivSel.innerHTML=c.levels.map(function(n){return '<option value="'+n+'"'+(selNiv==n?' selected':'')+'>'+_formatNiv(n)+'</option>';}).join('');
    }
    var tplClassSel=ov.querySelector('#eq-cours-class');
    if(tplClassSel){
      _populateNiveauxTpl(tplClassSel.value,tpl.cours_niveau);
      tplClassSel.addEventListener('change',function(){
        var c=_coursType(tplClassSel.value);
        _populateNiveauxTpl(tplClassSel.value);
        if(c){
          var niv=ov.querySelector('#eq-cours-niveau').value;
          ov.querySelector('#eq-cours-nom').value=_coursLabel(tplClassSel.value,niv);
          var debut=ov.querySelector('#eq-debut').value;
          if(debut)ov.querySelector('#eq-fin').value=_addTime(debut,c.duration);
        }
      });
      ov.querySelector('#eq-cours-niveau').addEventListener('change',function(e){
        var c=_coursType(tplClassSel.value);
        if(c)ov.querySelector('#eq-cours-nom').value=_coursLabel(tplClassSel.value,e.target.value);
      });
    }

    ov.querySelector('[data-eq-save]').onclick=async function(){
      var newSid=ov.querySelector('#eq-sid').value;
      var coursClassEl=ov.querySelector('#eq-cours-class');
      var coursNivEl=ov.querySelector('#eq-cours-niveau');
      var rec={
        type:ov.querySelector('#eq-type').value,
        jour:parseInt(ov.querySelector('#eq-jour').value),
        debut:ov.querySelector('#eq-debut').value,
        fin:ov.querySelector('#eq-fin').value,
        person_id:ov.querySelector('#eq-person').value,
        cours_nom:ov.querySelector('#eq-cours-nom').value.trim(),
        cours_class:coursClassEl?coursClassEl.value:'',
        cours_niveau:coursNivEl?(parseFloat(coursNivEl.value)||null):null,
        weeks:(ov.querySelector('input[name=eq-weeks]:checked')||{}).value||'all'
      };
      if(_hm(rec.fin)<=_hm(rec.debut)){toast('Heure de fin doit être après début');return;}
      var saveBtn=this;saveBtn.disabled=true;saveBtn.textContent='Enregistrement…';
      var ok=true;
      if(isNew){
        rec.id=_uid('tpl');
        _templates(newSid).push(rec);
        ok=await _saveTemplates(newSid);
        if(!ok)_templates(newSid).pop();
      }else{
        if(newSid!==sid){
          var oldArr=_templates(sid);
          var idx=oldArr.findIndex(function(t){return t.id===tplId;});
          var removed=idx>=0?oldArr.splice(idx,1)[0]:null;
          rec.id=tplId;
          _templates(newSid).push(rec);
          var ok1=await _saveTemplates(sid);
          var ok2=await _saveTemplates(newSid);
          ok=ok1&&ok2;
          if(!ok){_templates(newSid).pop();if(removed)_templates(sid).push(removed);}
        }else{
          var prev=JSON.parse(JSON.stringify(tpl));
          Object.assign(tpl,rec);
          ok=await _saveTemplates(sid);
          if(!ok){Object.keys(tpl).forEach(function(k){delete tpl[k];});Object.assign(tpl,prev);}
        }
      }
      saveBtn.disabled=false;
      if(ok){
        toast('✓ Template '+(isNew?'créé':'mis à jour'));
        close();render();
      }else{
        saveBtn.textContent=isNew?'Créer':'Enregistrer';
      }
    };
  }

  async function _deleteTemplate(tplId,sid){
    if(!confirm('Supprimer ce template ?'))return;
    var arr=_templates(sid);
    var idx=arr.findIndex(function(t){return t.id===tplId;});
    if(idx<0)return;
    var removed=arr.splice(idx,1)[0];
    var ok=await _saveTemplates(sid);
    if(ok)render();
    else arr.splice(idx,0,removed);
  }

  function _applyTemplates(){
    var sf=_curStudioFilter();
    var sids=sf==='all'?_studioIds():[sf];
    if(!confirm('Générer les créneaux des 4 prochaines semaines à partir des templates ?\n\nLes créneaux existants ne seront pas écrasés.'))return;
    var ws=_weekStart();
    var created=0;
    sids.forEach(function(sid){
      var tpls=_templates(sid);
      if(!tpls.length)return;
      for(var w=0;w<4;w++){
        var weekStart=_addDays(ws,w*7);
        var weekNum=_getWeekNumber(weekStart);
        var isPaire=weekNum%2===0;
        tpls.forEach(function(tpl){
          if(tpl.weeks==='paires'&&!isPaire)return;
          if(tpl.weeks==='impaires'&&isPaire)return;
          var dt=_addDays(weekStart,tpl.jour);
          var dymd=_ymd(dt);
          // Skip si conflit (même date+heure+studio)
          var exists=_shifts(sid).some(function(s){return s.date===dymd&&s.debut===tpl.debut;});
          if(exists)return;
          var sh={
            id:_uid('shift'),
            type:tpl.type,
            date:dymd,
            debut:tpl.debut,
            fin:tpl.fin,
            person_id:tpl.person_id||'',
            statut:tpl.person_id?'confirme':'brouillon',
            date_creation:_now(),
            from_template:tpl.id
          };
          if(tpl.type==='cours'){
            sh.cours={
              nom:tpl.cours_nom||_coursLabel(tpl.cours_class,tpl.cours_niveau)||'Cours',
              capacite:12,
              class_id:tpl.cours_class||'',
              niveau:tpl.cours_niveau||null
            };
          }
          _shifts(sid).push(sh);
          created++;
        });
      }
      _saveShifts(sid); // fire-and-forget OK ici (batch)
    });
    toast('✓ '+created+' créneaux générés');
    render();
  }

  // ── Time slots fixes pour les 45h hebdo (Lun-Sam · 7-14h + 17-21h) ────────
  // Lun-Jeu : 8 cours/jour · Ven : 7 · Sam : 6 = 45 ✓
  var WEEK_SLOTS=(function(){
    var s=[];
    [0,1,2,3].forEach(function(d){
      [{h:'07:00',e:'08:00',pool:'morning_early'},
       {h:'08:00',e:'09:00',pool:'morning_early'},
       {h:'09:00',e:'10:00',pool:'morning_mid'},
       {h:'10:00',e:'11:00',pool:'morning_mid'},
       {h:'12:00',e:'13:00',pool:'midday'},
       {h:'18:00',e:'19:00',pool:'evening_early'},
       {h:'19:00',e:'20:00',pool:'evening_late'},
       {h:'20:00',e:'21:00',pool:'evening_late'}].forEach(function(sl){
        s.push({jour:d,debut:sl.h,fin:sl.e,pool:sl.pool});
      });
    });
    // Vendredi (7 cours)
    [{h:'07:00',e:'08:00',pool:'morning_early'},
     {h:'08:00',e:'09:00',pool:'morning_early'},
     {h:'09:00',e:'10:00',pool:'morning_mid'},
     {h:'10:00',e:'11:00',pool:'morning_mid'},
     {h:'18:00',e:'19:00',pool:'evening_early'},
     {h:'19:00',e:'20:00',pool:'evening_late'},
     {h:'20:00',e:'21:00',pool:'evening_late'}].forEach(function(sl){
      s.push({jour:4,debut:sl.h,fin:sl.e,pool:sl.pool});
    });
    // Samedi (6 cours · matin uniquement, démarre par Intro)
    s.push({jour:5,debut:'08:00',fin:'09:00',pool:'sat_intro'});
    s.push({jour:5,debut:'09:00',fin:'10:00',pool:'morning_mid'});
    s.push({jour:5,debut:'10:00',fin:'11:00',pool:'morning_mid'});
    s.push({jour:5,debut:'11:00',fin:'12:00',pool:'morning_mid'});
    s.push({jour:5,debut:'12:00',fin:'13:00',pool:'midday'});
    s.push({jour:5,debut:'13:00',fin:'14:00',pool:'sat_cooldown'});
    return s;
  })();

  // ── Pools de cours par tranche horaire (logique : matin = niveaux bas, ──
  // ── soir = niveaux hauts ; Reformer Flow = dominant ; FIT/Suspend = soir uniquement)
  var CLASS_POOLS={
    morning_early:[ // 7h-9h : public matinal, démarrage doux
      ['reformer-flow',1],['reformer-flow',1],['reformer-flow',1.5],
      ['cardio-sculpt',1],['cardio-sculpt',1.5],
      ['center-balance',1]
    ],
    morning_mid:[ // 9h-11h : niveaux variés, cœur de l'offre
      ['reformer-flow',1.5],['reformer-flow',1.5],['reformer-flow',2],
      ['cardio-sculpt',1.5],['cardio-sculpt',2],
      ['center-balance',1],['center-balance',1.5],['center-balance',2],
      ['control',1.5],['restore',1],['restore',1.5]
    ],
    midday:[ // 12h-14h : pause déjeuner, restore + niveaux moyens
      ['reformer-flow',2],['reformer-flow',1.5],
      ['restore',1],['restore',1.5],
      ['control',2],['center-balance',2]
    ],
    evening_early:[ // 18h-19h : sortie boulot, niveaux 1.5-2
      ['reformer-flow',1],['reformer-flow',1.5],['reformer-flow',2],
      ['cardio-sculpt',1.5],['cardio-sculpt',2],
      ['center-balance',1.5]
    ],
    evening_late:[ // 19h-21h : intensité forte, FIT/Suspend
      ['reformer-flow',2],['reformer-flow',2],['reformer-flow',2.5],
      ['fit',2],['fit',2.5],
      ['suspend',1.5],['suspend',2],
      ['cardio-sculpt',2],['control',2]
    ],
    sat_intro:[['intro',1]], // Samedi 8h fixé sur Intro Class (cours d'essai)
    sat_cooldown:[['restore',1],['restore',1.5]] // Samedi 13h = récupération
  };

  function _pickClassFromPool(poolName){
    var pool=CLASS_POOLS[poolName]||CLASS_POOLS.morning_mid;
    var pick=pool[Math.floor(Math.random()*pool.length)];
    return {class_id:pick[0],niveau:pick[1]};
  }

  // Seed le planning Club Pilates : génère 45 cours/sem × N semaines × M studios
  // → directement dans S.shifts (visible page Planning), randomisé par studio
  function _seedPlanning(){
    var sf=_curStudioFilter();
    var sids=sf==='all'?_studioIds():[sf];
    if(sids.length===0){toast('Aucun studio disponible');return;}
    var nbWeeks=26; // 6 mois à venir
    var nbShiftsPerWeek=WEEK_SLOTS.length; // 45
    var totalEstime=sids.length*nbWeeks*nbShiftsPerWeek;
    var sidLabel=sf==='all'?'TOUS les studios ('+sids.length+')':_studioName(sf);
    if(!confirm('Pré-remplir le planning Club Pilates pour '+sidLabel+' ?\n\n• 45h de cours par semaine\n• 26 semaines à venir (6 mois)\n• Lun-Sam, 7h-14h + 17h-21h\n• ~'+totalEstime+' créneaux générés\n• Cours variés et aléatoires (tous "À pourvoir")\n\nVous pourrez modifier chaque créneau (cours, niveau, horaire, coach) en cliquant dessus. Les créneaux déjà existants ne seront pas écrasés.'))return;

    var ws=_weekStart(); // semaine courante
    var totalAdded=0,skipped=0;
    sids.forEach(function(sid){
      var arr=_shifts(sid);
      for(var w=0;w<nbWeeks;w++){
        var weekStart=_addDays(ws,w*7);
        WEEK_SLOTS.forEach(function(slot){
          var dt=_addDays(weekStart,slot.jour);
          var dymd=_ymd(dt);
          // Skip si shift existant à cette date+heure dans ce studio
          var exists=arr.some(function(s){return s.date===dymd&&s.debut===slot.debut;});
          if(exists){skipped++;return;}
          var pick=_pickClassFromPool(slot.pool);
          var sh={
            id:_uid('shift'),
            type:'cours',
            date:dymd,
            debut:slot.debut,
            fin:slot.fin,
            person_id:'',
            statut:'brouillon',
            date_creation:_now(),
            cours:{
              nom:_coursLabel(pick.class_id,pick.niveau),
              capacite:12,
              class_id:pick.class_id,
              niveau:pick.niveau
            }
          };
          arr.push(sh);
          totalAdded++;
        });
      }
      _saveShifts(sid);
    });
    toast('✓ '+totalAdded+' créneaux générés'+(skipped>0?' ('+skipped+' déjà existants ignorés)':''));
    // Repositionner sur la semaine courante pour que l'utilisateur voie immédiatement
    S.equipeWeekStart=_ymd(ws);
    render();
  }

  function _getWeekNumber(d){
    var date=new Date(d.getTime());
    date.setHours(0,0,0,0);
    date.setDate(date.getDate()+3-(date.getDay()+6)%7);
    var week1=new Date(date.getFullYear(),0,4);
    return 1+Math.round(((date.getTime()-week1.getTime())/86400000-3+(week1.getDay()+6)%7)/7);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── PROPOSITIONS — Sélection multi + Mailto ─────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  function _toggleSelectShift(shId){
    if(!S.equipeSelectedShifts)S.equipeSelectedShifts=[];
    var idx=S.equipeSelectedShifts.indexOf(shId);
    if(idx>=0)S.equipeSelectedShifts.splice(idx,1);
    else S.equipeSelectedShifts.push(shId);
    render();
  }
  function _clearSelection(){S.equipeSelectedShifts=[];render();}

  function _openProposeFromSelection(){
    var ids=S.equipeSelectedShifts||[];
    if(ids.length===0){toast('Aucun créneau sélectionné');return;}
    // Récupère shifts
    var shifts=[];
    Object.keys(S.shifts||{}).forEach(function(sid){
      _shifts(sid).forEach(function(sh){
        if(ids.indexOf(sh.id)>=0)shifts.push(Object.assign({_sid:sid},sh));
      });
    });
    if(shifts.length===0)return;
    // Group by sid (pour 1 proposition par studio)
    var bySid={};
    shifts.forEach(function(sh){if(!bySid[sh._sid])bySid[sh._sid]=[];bySid[sh._sid].push(sh);});
    if(Object.keys(bySid).length>1){
      toast('Sélection multi-studios non supportée — choisis 1 studio à la fois');
      return;
    }
    _openProposeModal(shifts);
  }

  function _openProposeModal(shifts){
    _ensureStyles();
    var sid=shifts[0]._sid;
    var ppl=_people();
    var coachs=Object.keys(ppl).filter(function(id){
      var p=ppl[id];
      if(p.statut==='archive'||p.type!=='coach')return false;
      var st=p.studios||(p.sid?[p.sid]:[]);
      return st.indexOf(sid)>=0;
    });
    if(coachs.length===0){toast('Aucun coach actif sur ce studio');return;}

    shifts.sort(function(a,b){return (a.date+a.debut).localeCompare(b.date+b.debut);});
    var totalH=shifts.reduce(function(s,sh){return s+_shiftDuration(sh);},0);
    var dates=shifts.map(function(sh){return sh.date;});
    var periode=dates[0]+(dates.length>1?' → '+dates[dates.length-1]:'');

    var ov=document.createElement('div');
    ov.className='eq-modal';
    ov.innerHTML=''
      +'<div class="eq-modal-card">'
      +  '<div class="eq-modal-hdr">'
      +    '<div class="eq-modal-title">Proposer '+shifts.length+' créneau'+(shifts.length>1?'x':'')+' à un coach</div>'
      +    '<button class="eq-modal-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
      +  '</div>'
      +  '<div class="eq-modal-body">'
      +    '<div class="eq-field"><label>Coach</label><select id="eq-coach">'
      +      coachs.map(function(id){var p=ppl[id];return '<option value="'+id+'">'+_esc(p.prenom+' '+p.nom)+(p.email?' · '+p.email:' (sans email)')+'</option>';}).join('')
      +    '</select></div>'
      +    '<div class="eq-field"><label>Récap des créneaux ('+totalH.toFixed(1)+'h · '+periode+')</label>'
      +      '<div style="background:rgba(120,120,128,.06);border:.5px solid rgba(10,14,28,.07);border-radius:10px;padding:10px 14px;font:500 12.5px/1.5 -apple-system,system-ui,Inter,sans-serif;max-height:200px;overflow-y:auto;font-variant-numeric:tabular-nums">'
      +        shifts.map(function(sh){
                 var t=SHIFT_TYPE[sh.type]||SHIFT_TYPE.cours;
                 var lbl=sh.cours&&sh.cours.nom?sh.cours.nom:t.label;
                 return '<div style="padding:3px 0;border-bottom:.5px solid rgba(10,14,28,.05)"><b>'+sh.date+'</b> · '+sh.debut+'–'+sh.fin+' · '+t.ico+' '+_esc(lbl)+'</div>';
               }).join('')
      +      '</div>'
      +    '</div>'
      +    '<div class="eq-field"><label>Message personnalisé (optionnel)</label><textarea id="eq-msg" rows="3" placeholder="Salut Marc, voici ta semaine du… Merci de me dire si OK !"></textarea></div>'
      +  '</div>'
      +  '<div class="eq-modal-foot">'
      +    '<button class="eq-btn" data-eq-cancel>Annuler</button>'
      +    '<button class="eq-btn primary" data-eq-send>✉️ Ouvrir email + Enregistrer</button>'
      +  '</div>'
      +'</div>';
    document.body.appendChild(ov);

    function close(){if(ov.parentNode)ov.parentNode.removeChild(ov);}
    ov.querySelector('.eq-modal-close').onclick=close;
    ov.querySelector('[data-eq-cancel]').onclick=close;
    ov.addEventListener('click',function(e){if(e.target===ov)close();});

    ov.querySelector('[data-eq-send]').onclick=async function(){
      var coachId=ov.querySelector('#eq-coach').value;
      var coach=ppl[coachId];if(!coach){toast('Coach invalide');return;}
      var msg=ov.querySelector('#eq-msg').value.trim();
      var subject='Proposition agenda · '+_studioName(sid)+' · '+periode;
      var totalRevenu=0;
      var rate=parseFloat(coach.tarif_horaire)||0;
      totalRevenu=totalH*rate;
      var body='Salut '+coach.prenom+',\n\n';
      if(msg)body+=msg+'\n\n';
      body+='Voici la proposition d\'agenda pour '+_studioName(sid)+' :\n\n';
      shifts.forEach(function(sh){
        var t=SHIFT_TYPE[sh.type]||SHIFT_TYPE.cours;
        var lbl=sh.cours&&sh.cours.nom?sh.cours.nom:t.label;
        body+='• '+sh.date+' · '+sh.debut+'–'+sh.fin+' · '+lbl+'\n';
      });
      body+='\nTotal : '+totalH.toFixed(1)+'h';
      if(rate>0)body+=' · '+totalRevenu.toFixed(0)+' € (à '+rate+' €/h)';
      body+='\n\nMerci de me confirmer en répondant à cet email.\n\nÀ bientôt,\n'+(S.profile&&S.profile.nom||'');

      // Ouvre mailto:
      var mailto='mailto:'+encodeURIComponent(coach.email||'')+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
      window.location.href=mailto;

      // Enregistre la proposition
      var prop={
        id:_uid('prop'),
        coach_id:coachId,
        shift_ids:shifts.map(function(s){return s.id;}),
        date_envoi:_now(),
        statut:'envoye',
        periode:periode,
        message:msg,
        total_h:totalH,
        total_cost:totalRevenu
      };
      _proposals(sid).push(prop);

      // Marquer les shifts comme proposés
      shifts.forEach(function(sh){
        var src=_shifts(sid).find(function(x){return x.id===sh.id;});
        if(src){src.statut='propose';src.person_id=coachId;}
      });
      // Save async + await pour s'assurer que ça persiste
      var ok1=await _saveProposals(sid);var ok2=await _saveShifts(sid);
      S.equipeSelectedShifts=[];
      if(ok1&&ok2){toast('✓ Email ouvert · proposition enregistrée');close();render();}
      else{close();render();} // au moins fermer le modal — l'erreur est déjà toastée
    };
  }

  async function _markProposal(propId,sid,statut){
    var arr=_proposals(sid);
    var pr=arr.find(function(p){return p.id===propId;});
    if(!pr)return;
    pr.statut=statut;
    pr.date_reponse=_now();
    // Mettre à jour les shifts associés
    (pr.shift_ids||[]).forEach(function(shId){
      var sh=_shifts(sid).find(function(x){return x.id===shId;});
      if(sh)sh.statut=statut==='accepte'?'confirme':'refuse';
    });
    var ok1=await _saveProposals(sid);var ok2=await _saveShifts(sid);
    if(ok1&&ok2){toast('✓ Proposition marquée comme '+statut);render();}
  }

  async function _deleteProposal(propId,sid){
    if(!confirm('Supprimer cette proposition ?'))return;
    var arr=_proposals(sid);
    var idx=arr.findIndex(function(p){return p.id===propId;});
    if(idx<0)return;
    var removed=arr.splice(idx,1)[0];
    var ok=await _saveProposals(sid);
    if(ok)render();
    else arr.splice(idx,0,removed);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── STATE SETTERS (UI) ──────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  function _setSub(sub){S.equipeSubTab=sub;render();}
  function _navWeek(dir){
    if(dir===0){S.equipeWeekStart=_ymd(_weekStart());}
    else{
      var ws=_parseYmd(_curWeekYmd());
      ws=_addDays(ws,dir*7);
      S.equipeWeekStart=_ymd(ws);
    }
    render();
  }
  function _setStudioFilter(v){S.equipeStudioFilter=v;render();}
  function _setRoleFilter(v){S.equipeRoleFilter=v;render();}
  function _navCostMonth(dir){
    var now=new Date();
    var y=S.equipeCostYear||now.getFullYear();
    var m=S.equipeCostMonth!=null?S.equipeCostMonth:now.getMonth();
    m+=dir;
    if(m<0){m=11;y--;}else if(m>11){m=0;y++;}
    S.equipeCostYear=y;S.equipeCostMonth=m;
    render();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── RENDER ROOT ─────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  function renderEquipe(){
    _ensureStyles();
    var sub=S.equipeSubTab||'planning';
    var h='<div class="eq">';
    h+=_renderHero();
    h+=_renderSubTabs(sub);
    h+='<div class="eq-body">';
    if(sub==='planning')h+=_renderPlanning();
    else if(sub==='trombi')h+=_renderTrombi();
    else if(sub==='templates')h+=_renderTemplates();
    else if(sub==='propositions')h+=_renderPropositions();
    else if(sub==='costs')h+=_renderCosts();
    h+='</div>';
    h+='</div>';
    return h;
  }

  // ── Utils ──────────────────────────────────────────────────────────────────
  function _esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function _fmt(n){
    if(typeof fmt==='function')return fmt(n);
    if(n==null||isNaN(n))return '—';
    return Math.round(n).toLocaleString('fr-FR')+' €';
  }

  // ── Expose API ─────────────────────────────────────────────────────────────
  window.renderEquipe=renderEquipe;
  window._eqSetSub=_setSub;
  window._eqWeek=_navWeek;
  window._eqStudioFilter=_setStudioFilter;
  window._eqRoleFilter=_setRoleFilter;
  window._eqOpenPerson=_openPerson;
  window._eqArchivePerson=_archivePerson;
  window._eqOpenPhotoLB=_openPhotoLightbox;
  window._eqOpenShift=_openShift;
  window._eqOpenTemplate=_openTemplate;
  window._eqDeleteTemplate=_deleteTemplate;
  window._eqApplyTemplates=_applyTemplates;
  window._eqSeedPlanning=_seedPlanning;
  window._eqToggleSelectShift=_toggleSelectShift;
  window._eqClearSelection=_clearSelection;
  window._eqOpenProposeFromSelection=_openProposeFromSelection;
  window._eqMarkProposal=_markProposal;
  window._eqDeleteProposal=_deleteProposal;
  window._eqCostMonth=_navCostMonth;
})();
