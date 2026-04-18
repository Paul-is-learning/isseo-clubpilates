// ═══════════════════════════════════════════════════════════════════════════
// PAGES — BP CONSOLIDÉ (multi-studios)
// Vue consolidée des Business Plans : CA, EBITDA, REX, marges, membres.
// Inclut les helpers _getScenarioCA / _getScenarioLabel partagés.
// Extrait de pages.js (Phase 3 — modularisation).
// ═══════════════════════════════════════════════════════════════════════════

function _getScenarioCA(sid,ay){
  var s=S.studios[sid];
  if(!s)return 0;
  var BP_CFG={p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67};
  // Si scénario actif = BP par défaut ou aucun scénario, utiliser la config BP de référence
  // pour garantir le même résultat sur tous les appareils
  var scId=S.activeScenarioId[sid]||'bp_default';
  var cfg;
  if(scId==='bp_default'){
    cfg=BP_CFG;
  } else {
    // Scénario custom : chercher sa config enregistrée
    var scList=S.scenarios[sid]||[];
    var sc=scList.find(function(x){return x.id===scId;});
    cfg=(sc&&sc.config)?sc.config:(S.simConfig[sid]||BP_CFG);
  }
  var actuel=S.adherents[sid]||{};
  var offset=(ay-1)*12;
  var total=0;
  for(var i=0;i<12;i++){
    var k='y'+ay+'_m'+i;
    var idx=offset+i;
    var _bpA2=getBPAdherents(sid);
    var bpM=idx<_bpA2.length?_bpA2[idx]:400;
    var membres=actuel[k]!=null?num(actuel[k]):bpM;
    total+=computeSimCA(membres,cfg,ay,sid);
  }
  return total;
}

// Récupère le nom du scénario actif pour un studio
function _getScenarioLabel(sid){
  var scId=S.activeScenarioId[sid];
  if(!scId||scId==='bp_default')return null;
  var scList=S.scenarios[sid]||[];
  var sc=scList.find(function(s){return s.id===scId;});
  return sc?sc.auteur+' — '+sc.date:null;
}

// ── Récapitulatif des engagements consolidé ──────────────────────────────────
function toggleEngView(v){S.engView=v;render();}
function toggleEngSection(v){S.engSection=v;render();}
function toggleFpCohorte(v){S.fpSimActiveCohorte=v;render();}
function setFpSimCohorte(cohorte,societe,nb){S.fpSimCohortes[cohorte][societe]=parseInt(nb)||0;render();}
function toggleEngExpand(k){S.engExpanded[k]=!S.engExpanded[k];render();}

function renderBPConsolide(){
  if(!S._dataLoaded&&typeof skeletonGrid==='function')return '<div class="skeleton-page">'+skeletonGrid(4)+'</div>';
  var allIds=_getStudioIds();
  var h='';
  // Header
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px">';
  h+='<div><div style="font-size:20px;font-weight:700;color:#1a1a1a">BP Consolidé</div><div style="font-size:12px;color:#888;margin-top:2px">Agrégation automatique des Business Plans de '+allIds.length+' studios — basé sur les scénarios actifs</div></div>';
  h+='<div style="display:flex;align-items:center;gap:8px">'+renderSearchBar()+userAvatarWidget(S.profile)+'</div>';
  h+='</div>';

  if(!allIds.length){
    h+=(typeof emptyState==='function')?emptyState('folder','Aucun studio disponible','Créez votre premier studio pour commencer.'):'<div style="text-align:center;color:#bbb;padding:40px;font-size:13px">Aucun studio disponible</div>';
    return h;
  }

  // Aggregate data from active scenarios
  var totCapex=0,totCA1=0,totCA2=0,totCA3=0,totMembres=0;
  var totEbitda1=0,totEbitda2=0,totEbitda3=0;
  var totRex1=0,totRex2=0,totRex3=0;
  var totRN1=0,totRN2=0,totRN3=0;
  var totCashNet1=0,totCashNet2=0,totCashNet3=0;
  var studioRows=[];

  allIds.forEach(function(id){
    var s=S.studios[id];
    if(!s)return;
    var md=(s.forecast&&s.forecast.moisDebut)||0;
    var bpOpts=getStudioBPOpts(id);

    // CA depuis le scénario actif (pas le BP initial)
    var ca1=_getScenarioCA(id,1);
    var ca2=_getScenarioCA(id,2);
    var ca3=_getScenarioCA(id,3);

    // Construire les BP détaillés avec le CA du scénario actif
    var bp1,bp2,bp3;
    try{
      bp1=buildBPFromDossier(ca1,md,1,id,bpOpts);
      bp2=buildBPFromDossier(ca2,md,2,id,bpOpts);
      bp3=buildBPFromDossier(ca3,md,3,id,bpOpts);
    }catch(e){
      bp1=[];bp2=[];bp3=[];
    }

    // Agréger les indicateurs depuis les BP mensuels
    var ebitda1=bp1.reduce(function(s,r){return s+(r._ebitda||0);},0);
    var ebitda2=bp2.reduce(function(s,r){return s+(r._ebitda||0);},0);
    var ebitda3=bp3.reduce(function(s,r){return s+(r._ebitda||0);},0);
    var rex1=bp1.reduce(function(s,r){return s+(r._rex||0);},0);
    var rex2=bp2.reduce(function(s,r){return s+(r._rex||0);},0);
    var rex3=bp3.reduce(function(s,r){return s+(r._rex||0);},0);
    var rn1=bp1.reduce(function(s,r){return s+(r._result||0);},0);
    var rn2=bp2.reduce(function(s,r){return s+(r._result||0);},0);
    var rn3=bp3.reduce(function(s,r){return s+(r._result||0);},0);
    var cashnet1=bp1.reduce(function(s,r){return s+(r._cashnet||0);},0);
    var cashnet2=bp2.reduce(function(s,r){return s+(r._cashnet||0);},0);
    var cashnet3=bp3.reduce(function(s,r){return s+(r._cashnet||0);},0);

    // Membres fin d'année 3
    var actuel=S.adherents[id]||{};
    var membresFinA3=actuel['y3_m11']!=null?num(actuel['y3_m11']):(getBPAdherents(id)[35]||400);

    totCapex+=s.capex||0;
    totCA1+=ca1;totCA2+=ca2;totCA3+=ca3;
    totEbitda1+=ebitda1;totEbitda2+=ebitda2;totEbitda3+=ebitda3;
    totRex1+=rex1;totRex2+=rex2;totRex3+=rex3;
    totRN1+=rn1;totRN2+=rn2;totRN3+=rn3;
    totCashNet1+=cashnet1;totCashNet2+=cashnet2;totCashNet3+=cashnet3;
    totMembres+=membresFinA3;

    var scLabel=_getScenarioLabel(id);
    studioRows.push({
      id:id,name:s.name,societe:s.societe,statut:s.statut,capex:s.capex||0,
      ca1:ca1,ca2:ca2,ca3:ca3,
      ebitda1:ebitda1,ebitda2:ebitda2,ebitda3:ebitda3,
      rex1:rex1,rex2:rex2,rex3:rex3,
      rn1:rn1,rn2:rn2,rn3:rn3,
      cashnet1:cashnet1,cashnet2:cashnet2,cashnet3:cashnet3,
      membres:membresFinA3,
      margeEbitda1:ca1>0?Math.round(ebitda1/ca1*100):0,
      margeEbitda3:ca3>0?Math.round(ebitda3/ca3*100):0,
      scenario:scLabel
    });
  });

  var margeEbitda1Tot=totCA1>0?Math.round(totEbitda1/totCA1*100):0;
  var margeEbitda2Tot=totCA2>0?Math.round(totEbitda2/totCA2*100):0;
  var margeEbitda3Tot=totCA3>0?Math.round(totEbitda3/totCA3*100):0;

  // ══════════════════════════════════════════════
  // HERO BANNER — CA consolidé avec gradient premium
  // ══════════════════════════════════════════════
  h+='<div class="bp-hero-banner" style="position:relative;border-radius:20px;overflow:hidden;margin-bottom:20px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 40%,#334155 100%);padding:32px 36px;color:#fff">';
  // Orbes décoratifs
  h+='<div style="position:absolute;top:-40px;right:-30px;width:180px;height:180px;background:radial-gradient(circle,rgba(99,102,241,0.15),transparent 70%);border-radius:50%;pointer-events:none"></div>';
  h+='<div style="position:absolute;bottom:-50px;left:20%;width:200px;height:200px;background:radial-gradient(circle,rgba(16,185,129,0.1),transparent 70%);border-radius:50%;pointer-events:none"></div>';

  // Dot grid subtle
  h+='<div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:20px 20px;pointer-events:none"></div>';
  // Title
  h+='<div style="position:relative;z-index:1">';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">';
  h+='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>';
  h+='<span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#818cf8">Chiffre d\'affaires consolidé</span>';
  h+='</div>';
  // CA Cards row
  h+='<div class="bp-ca-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:20px">';
  var _caCards=[
    {l:'Année 1',sub:'Lancement',v:totCA1,grad:'linear-gradient(135deg,#0F6E56,#1D9E75)',glow:'rgba(15,110,86,0.25)',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg>'},
    {l:'Année 2',sub:'Croissance',v:totCA2,grad:'linear-gradient(135deg,#1e40af,#3b82f6)',glow:'rgba(59,130,246,0.25)',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>'},
    {l:'Année 3',sub:'Croisière',v:totCA3,grad:'linear-gradient(135deg,#312e81,#4338ca)',glow:'rgba(67,56,202,0.25)',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'},
    {l:'CAPEX Total',sub:'Investissement',v:totCapex,grad:'linear-gradient(135deg,#1a3a6b,#2d5a9e)',glow:'rgba(26,58,107,0.2)',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'}
  ];
  _caCards.forEach(function(k,ci){
    h+='<div class="ca-hero-card" data-ca-idx="'+ci+'" style="background:'+k.grad+';border-radius:16px;padding:18px 20px;position:relative;overflow:hidden;cursor:default;box-shadow:0 4px 20px '+k.glow+'" onmouseenter="this.style.transform=\'translateY(-4px) scale(1.02)\';this.style.boxShadow=\'0 8px 30px '+k.glow+'\'" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'0 4px 20px '+k.glow+'\'">';
    h+='<div style="position:absolute;top:-15px;right:-15px;width:60px;height:60px;background:rgba(255,255,255,0.06);border-radius:50%"></div>';
    h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">'+k.icon+'<span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.7)">'+k.l+'</span></div>';
    h+='<div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;line-height:1"><span class="counter-anim" data-target="'+Math.round(k.v)+'" data-format="eur" data-duration="1400">0</span></div>';
    h+='<div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:4px;font-weight:500">'+k.sub+'</div>';
    h+='</div>';
  });
  h+='</div></div></div>';

  // ══════════════════════════════════════════════
  // RENTABILITÉ A3 — Glassmorphism cards
  // ══════════════════════════════════════════════
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
  h+='<span style="font-size:12px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:1px">Rentabilité consolidée — Année 3</span>';
  h+='<span style="font-size:10px;color:#94a3b8;font-weight:500">(croisière)</span>';
  h+='</div>';

  // ── Donuts visuels : marges clés ──
  if(typeof donutChart==='function' && totCA3>0){
    var _rexMargin=Math.round(totRex3/totCA3*100);
    var _cashMargin=Math.round(totCashNet3/totCA3*100);
    var _donuts=[
      {p:Math.max(0,margeEbitda3Tot),color:'#0F6E56',label:'Marge EBITDA',sub:'sur CA A3'},
      {p:Math.max(0,_rexMargin),color:'#1e40af',label:'Marge REX',sub:'sur CA A3'},
      {p:Math.max(0,_cashMargin),color:'#3b82f6',label:'Ratio Cash',sub:'sur CA A3'}
    ];
    h+='<div class="bp-donuts-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px">';
    _donuts.forEach(function(d){
      h+='<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px;display:flex;align-items:center;gap:18px;box-shadow:0 1px 3px rgba(0,0,0,0.03)">';
      h+=donutChart(d.p,{size:84,stroke:9,color:d.color});
      h+='<div style="flex:1"><div style="font-size:11px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.6px">'+d.label+'</div>';
      h+='<div style="font-size:10px;color:#94a3b8;margin-top:3px">'+d.sub+'</div>';
      h+='<div style="font-size:18px;font-weight:800;color:'+d.color+';margin-top:4px;letter-spacing:-0.3px">'+d.p+'%</div>';
      h+='</div></div>';
    });
    h+='</div>';
  }

  h+='<div class="bp-renta-grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:22px">';
  var _rentaCards=[
    {l:'EBITDA',v:fmt(totEbitda3),pos:totEbitda3>=0,accent:'#0F6E56',bg:'linear-gradient(135deg,#f0fdf4,#E1F5EE)',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>'},
    {l:'Marge EBITDA',v:margeEbitda3Tot+'%',pos:margeEbitda3Tot>=0,accent:'#6366f1',bg:'linear-gradient(135deg,#eef2ff,#e0e7ff)',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>',pbar:true,pval:Math.min(margeEbitda3Tot,60)},
    {l:'REX',v:fmt(totRex3),pos:totRex3>=0,accent:'#1e40af',bg:'linear-gradient(135deg,#eff6ff,#dbeafe)',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e40af" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'},
    {l:'Cash Net',v:fmt(totCashNet3),pos:totCashNet3>=0,accent:'#3b82f6',bg:'linear-gradient(135deg,#eff6ff,#dbeafe)',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>'},
    {l:'Membres',v:totMembres.toLocaleString('fr-FR'),pos:true,accent:'#6366f1',bg:'linear-gradient(135deg,#eef2ff,#e0e7ff)',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'}
  ];
  _rentaCards.forEach(function(k){
    h+='<div style="background:'+k.bg+';border:1px solid '+(k.pos?k.accent+'20':'#fecaca')+';border-radius:16px;padding:16px 18px;transition:all .3s;cursor:default;position:relative;overflow:hidden" onmouseenter="this.style.transform=\'translateY(-3px)\';this.style.boxShadow=\'0 8px 25px '+k.accent+'18\'" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'none\'">';
    h+='<div style="position:absolute;top:-10px;right:-10px;width:50px;height:50px;background:'+k.accent+'08;border-radius:50%"></div>';
    h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">'+k.icon+'<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748b">'+k.l+'</span></div>';
    h+='<div style="font-size:22px;font-weight:800;color:'+(k.pos?k.accent:'#dc2626')+';letter-spacing:-0.3px">'+k.v+'</div>';
    // Progress bar for marge
    if(k.pbar){
      var pw=Math.max(0,Math.min(k.pval/60*100,100));
      h+='<div style="margin-top:10px;height:5px;background:#e2e8f0;border-radius:3px;overflow:hidden">';
      h+='<div style="width:'+pw+'%;height:100%;background:linear-gradient(90deg,'+k.accent+','+k.accent+'88);border-radius:3px;transition:width .6s ease"></div>';
      h+='</div>';
      h+='<div style="font-size:8px;color:#94a3b8;margin-top:3px;text-align:right">obj. 60%</div>';
    }
    h+='</div>';
  });
  h+='</div>';

  // ══════════════════════════════════════════════
  // SYNTHÈSE P&L — Premium table avec barres de contexte
  // ══════════════════════════════════════════════
  h+='<div style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:24px 28px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">';
  h+='<div style="display:flex;align-items:center;gap:10px">';
  h+='<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#4338ca,#6366f1);display:flex;align-items:center;justify-content:center">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>';
  h+='<div><div style="font-size:15px;font-weight:700;color:#1a1a1a">Synthèse P&L consolidée</div>';
  h+='<div style="font-size:10px;color:#94a3b8;font-weight:500">Évolution sur 3 ans</div></div></div>';
  // Year pills legend
  h+='<div style="display:flex;gap:6px">';
  [{l:'A1',c:'#0F6E56'},{l:'A2',c:'#3b82f6'},{l:'A3',c:'#6366f1'}].forEach(function(y){
    h+='<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:8px;background:'+y.c+'10;font-size:10px;font-weight:600;color:'+y.c+'"><span style="width:6px;height:6px;border-radius:50%;background:'+y.c+'"></span>'+y.l+'</span>';
  });
  h+='</div></div>';

  h+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:separate;border-spacing:0">';
  h+='<thead><tr style="background:linear-gradient(90deg,#f8fafc,#f1f5f9)">';
  h+='<th style="text-align:left;padding:12px 16px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;border-bottom:2px solid #e2e8f0;border-radius:10px 0 0 0">Indicateur</th>';
  h+='<th style="padding:12px 20px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#0F6E56;font-weight:700;border-bottom:2px solid #e2e8f0;text-align:center">Année 1</th>';
  h+='<th style="padding:12px 20px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#3b82f6;font-weight:700;border-bottom:2px solid #e2e8f0;text-align:center">Année 2</th>';
  h+='<th style="padding:12px 20px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6366f1;font-weight:700;border-bottom:2px solid #e2e8f0;text-align:center;border-radius:0 10px 0 0">Année 3</th>';
  h+='<th style="padding:12px 16px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;border-bottom:2px solid #e2e8f0;text-align:center;width:120px">Tendance</th>';
  h+='</tr></thead><tbody>';
  var synthRows=[
    {l:'Chiffre d\'affaires',v:[totCA1,totCA2,totCA3],bold:true,icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>'},
    {l:'EBITDA',v:[totEbitda1,totEbitda2,totEbitda3],bold:true,icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>'},
    {l:'Marge EBITDA',v:[margeEbitda1Tot,margeEbitda2Tot,margeEbitda3Tot],pct:true,icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>'},
    {l:'REX',v:[totRex1,totRex2,totRex3],icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'},
    {l:'Résultat net',v:[totRN1,totRN2,totRN3],icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'},
    {l:'Cash net disponible',v:[totCashNet1,totCashNet2,totCashNet3],bold:true,icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>'}
  ];
  var _yearColors=['#0F6E56','#3b82f6','#6366f1'];
  synthRows.forEach(function(r,ri){
    var isLast=ri===synthRows.length-1;
    h+='<tr style="transition:background .15s" onmouseenter="this.style.background=\''+(S.darkMode?'#1c2128':'#f8fafc')+'\'" onmouseleave="this.style.background=\'transparent\'">';
    h+='<td style="padding:12px 16px;font-weight:'+(r.bold?'700':'500')+';font-size:12px;color:#1e293b;border-bottom:'+(isLast?'none':'1px solid #f1f5f9')+'"><div style="display:flex;align-items:center;gap:8px">'+r.icon+r.l+'</div></td>';
    r.v.forEach(function(v,vi){
      var color=r.pct?(v>=0?_yearColors[vi]:'#dc2626'):(v>=0?'#1e293b':'#dc2626');
      var display=r.pct?(v+'%'):fmt(v);
      var fw=r.bold?'700':'600';
      h+='<td style="padding:12px 20px;font-weight:'+fw+';color:'+color+';text-align:center;font-size:13px;border-bottom:'+(isLast?'none':'1px solid #f1f5f9')+(v<0?';background:#fef2f2':'')+'">'+display+'</td>';
    });
    // Sparkline tendance (mini 3-point)
    var vals=r.v;
    var _max=Math.max.apply(null,vals.map(function(x){return Math.abs(x);}));
    if(_max===0)_max=1;
    var pts=vals.map(function(v,i){return (10+i*25)+','+(25-Math.round(v/_max*20));});
    var trendUp=vals[2]>vals[0];
    h+='<td style="padding:12px 16px;text-align:center;border-bottom:'+(isLast?'none':'1px solid #f1f5f9')+'">';
    h+='<svg width="70" height="30" viewBox="0 0 70 30" style="vertical-align:middle">';
    h+='<polyline points="'+pts.join(' ')+'" fill="none" stroke="'+(trendUp?'#0F6E56':'#ef4444')+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    vals.forEach(function(v,i){
      h+='<circle cx="'+(10+i*25)+'" cy="'+(25-Math.round(v/_max*20))+'" r="3" fill="'+_yearColors[i]+'"/>';
    });
    h+='</svg>';
    h+='<div style="font-size:8px;font-weight:600;color:'+(trendUp?'#0F6E56':'#ef4444')+'">'+(trendUp?'▲':'▼')+' '+(r.pct?(vals[2]-vals[0])+'pts':fmt(vals[2]-vals[0]))+'</div>';
    h+='</td>';
    h+='</tr>';
  });
  h+='</tbody></table></div></div>';

  // ── Graphique barres interactif ──
  h+='<div class="box" style="margin-bottom:16px;position:relative">';
  // Header du graphique
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">';
  h+='<div>';
  h+='<div style="font-size:15px;font-weight:700;color:#1a1a1a">EBITDA par studio</div>';
  h+='<div style="font-size:11px;color:#999;margin-top:2px">Répartition sur 3 ans (A1 · A2 · A3)</div>';
  h+='</div>';
  // Légende inline
  h+='<div style="display:flex;align-items:center;gap:16px">';
  h+='<div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:3px;background:linear-gradient(135deg,#0F6E56,#15956F)"></div><span style="font-size:10px;color:#888;font-weight:500">A1</span></div>';
  h+='<div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:3px;background:linear-gradient(135deg,#185FA5,#2B7BD4)"></div><span style="font-size:10px;color:#888;font-weight:500">A2</span></div>';
  h+='<div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:3px;background:linear-gradient(135deg,#4338ca,#6366f1)"></div><span style="font-size:10px;color:#888;font-weight:500">A3</span></div>';
  h+='</div></div>';
  // Tooltip
  h+='<div id="bp-chart-tooltip" style="display:none;position:absolute;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:12px 16px;border-radius:12px;font-size:11px;pointer-events:none;z-index:10;box-shadow:0 8px 30px rgba(0,0,0,0.25);white-space:nowrap;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.08);line-height:1.6"></div>';
  var maxEbitda=studioRows.reduce(function(m,r){return Math.max(m,Math.abs(r.ebitda1)+Math.abs(r.ebitda2)+Math.abs(r.ebitda3));},1);
  var nBars=studioRows.length;
  var chartW=Math.max(600,nBars*160);
  var barW=Math.min(72,Math.floor((chartW-60)/(nBars))-24);
  var groupW=barW+24;
  var totalGroupsW=nBars*groupW;
  var offsetX=Math.round((chartW-totalGroupsW)/2);
  var svgH=280;
  var chartH=180;
  var yBase=220;
  h+='<div style="overflow-x:auto;display:flex;justify-content:center">';
  h+='<svg width="'+chartW+'" height="'+svgH+'" viewBox="0 0 '+chartW+' '+svgH+'" style="overflow:visible">';
  // Defs: gradients pour les barres
  h+='<defs>';
  h+='<linearGradient id="grad-a1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#15956F"/><stop offset="100%" stop-color="#0F6E56"/></linearGradient>';
  h+='<linearGradient id="grad-a2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2B7BD4"/><stop offset="100%" stop-color="#185FA5"/></linearGradient>';
  h+='<linearGradient id="grad-a3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#4338ca"/></linearGradient>';
  h+='<filter id="bar-shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1"/></filter>';
  h+='</defs>';
  // Grid lines horizontales subtiles
  for(var gi=0;gi<=4;gi++){
    var gy=yBase-gi*(chartH/4);
    h+='<line x1="'+offsetX+'" y1="'+gy+'" x2="'+(offsetX+totalGroupsW)+'" y2="'+gy+'" stroke="#f0f0ea" stroke-width="1" stroke-dasharray="'+(gi===0?'0':'4,4')+'"/>';
    if(gi>0){
      var gVal=Math.round(maxEbitda*gi/4);
      h+='<text x="'+(offsetX-8)+'" y="'+(gy+3)+'" text-anchor="end" font-size="8" fill="#bbb" font-weight="400">'+fmt(gVal)+'</text>';
    }
  }
  studioRows.forEach(function(r,i){
    var x=offsetX+i*groupW+10;
    var h1=Math.round(Math.max(0,r.ebitda1)/maxEbitda*chartH);
    var h2=Math.round(Math.max(0,r.ebitda2)/maxEbitda*chartH);
    var h3=Math.round(Math.max(0,r.ebitda3)/maxEbitda*chartH);
    var totalEbitda=r.ebitda1+r.ebitda2+r.ebitda3;
    var safeName=r.name.replace(/'/g,"\\&#39;");
    var gId='bp-bg-'+i;
    // Groupe interactif — barres commencent plates (3px), animées au hover
    h+='<g id="'+gId+'" class="bp-bar-group" style="cursor:pointer" onmouseenter="animBPBars('+i+',true,event)" onmousemove="(function(e){var t=document.getElementById(\'bp-chart-tooltip\');t.style.left=(e.offsetX-80)+\'px\';t.style.top=(e.offsetY-120)+\'px\'})(event)" onmouseleave="animBPBars('+i+',false,event)">';
    // Zone de hover invisible
    h+='<rect x="'+x+'" y="20" width="'+barW+'" height="'+(yBase-20)+'" fill="transparent"/>';
    // Barres empilées — affichées à taille réelle
    h+='<rect class="bp-b1" x="'+x+'" y="'+(yBase-h1)+'" width="'+barW+'" height="'+Math.max(h1,2)+'" rx="4" ry="4" fill="url(#grad-a1)" filter="url(#bar-shadow)" data-th="'+h1+'" data-oy="'+(yBase-h1)+'"/>';
    h+='<rect class="bp-b2" x="'+x+'" y="'+(yBase-h1-h2)+'" width="'+barW+'" height="'+Math.max(h2,2)+'" rx="4" ry="4" fill="url(#grad-a2)" filter="url(#bar-shadow)" data-th="'+h2+'" data-oy="'+(yBase-h1-h2)+'"/>';
    h+='<rect class="bp-b3" x="'+x+'" y="'+(yBase-h1-h2-h3)+'" width="'+barW+'" height="'+Math.max(h3,2)+'" rx="4" ry="4" fill="url(#grad-a3)" filter="url(#bar-shadow)" data-th="'+h3+'" data-oy="'+(yBase-h1-h2-h3)+'"/>';
    // Montant total — visible
    h+='<text class="bp-total" x="'+(x+barW/2)+'" y="'+(yBase-h1-h2-h3-10)+'" text-anchor="middle" font-size="9" font-weight="700" fill="#1a1a1a" style="opacity:0.7">'+fmt(totalEbitda)+'</text>';
    // Nom du studio
    h+='<text x="'+(x+barW/2)+'" y="'+(yBase+16)+'" text-anchor="middle" font-size="10" fill="#666" font-weight="600">'+r.name.substring(0,18)+'</text>';
    if(r.name.length>18)h+='<text x="'+(x+barW/2)+'" y="'+(yBase+28)+'" text-anchor="middle" font-size="8" fill="#aaa" font-weight="400">'+r.name.substring(18,32)+'</text>';
    // Tooltip data
    h+='<desc>'+safeName+'|'+fmt(r.ebitda1)+'|'+fmt(r.ebitda2)+'|'+fmt(r.ebitda3)+'|'+fmt(totalEbitda)+'|'+r.margeEbitda3+'|'+(r.margeEbitda3>=20?'#22c55e':r.margeEbitda3>=10?'#eab308':'#ef4444')+'</desc>';
    h+='</g>';
  });
  h+='</svg></div></div>';

  // ── Tableau détaillé par studio — Premium ──
  h+='<div style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:24px 28px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">';
  h+='<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#1e40af,#3b82f6);display:flex;align-items:center;justify-content:center">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>';
  h+='<div><div style="font-size:15px;font-weight:700;color:#1a1a1a">Détail par studio</div>';
  h+='<div style="font-size:10px;color:#94a3b8;font-weight:500">Cliquez sur un studio pour voir son BP détaillé</div></div></div>';
  h+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:separate;border-spacing:0">';
  h+='<thead><tr style="background:linear-gradient(90deg,#f8fafc,#f1f5f9)">';
  var _detailCols=[
    {l:'Studio',align:'left'},{l:'Scénario',align:'left'},{l:'CA A1',align:'right',c:'#0F6E56'},{l:'CA A3',align:'right',c:'#6366f1'},
    {l:'EBITDA A1',align:'right'},{l:'EBITDA A3',align:'right'},{l:'Marge A3',align:'center'},
    {l:'REX A3',align:'right'},{l:'RN A3',align:'right'},{l:'Cash Net A3',align:'right'},{l:'Membres',align:'center'}
  ];
  _detailCols.forEach(function(c,ci){
    var isFirst=ci===0;var isLast=ci===_detailCols.length-1;
    h+='<th style="text-align:'+c.align+';padding:10px 12px;font-size:9px;text-transform:uppercase;letter-spacing:0.8px;color:'+(c.c||'#64748b')+';font-weight:700;white-space:nowrap;border-bottom:2px solid #e2e8f0;'+(isFirst?'border-radius:10px 0 0 0':'')+(isLast?'border-radius:0 10px 0 0':'')+'">'+c.l+'</th>';
  });
  h+='</tr></thead><tbody>';
  var _mcMax=studioRows.reduce(function(m,r){return Math.max(m,Math.abs(r.ca1),Math.abs(r.ca3));},1);
  studioRows.forEach(function(r,ri){
    var hoverBg=S.darkMode?'#1c2128':'#f8fafc';
    h+='<tr style="border-bottom:1px solid #f1f5f9;transition:all .15s" onmouseenter="this.style.background=\''+hoverBg+'\'" onmouseleave="this.style.background=\'transparent\'">';
    h+='<td style="padding:10px 12px;white-space:nowrap">';
    h+='<a onclick="openDetail(\''+r.id+'\')" style="font-weight:700;color:#1e40af;cursor:pointer;text-decoration:none;font-size:12px;display:flex;align-items:center;gap:6px" onmouseover="this.style.color=\'#3b82f6\'" onmouseout="this.style.color=\'#1e40af\'">';
    h+='<div style="width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#dbeafe,#bfdbfe);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>';
    h+=r.name+'</a></td>';
    h+='<td style="padding:10px 12px;font-size:10px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+(r.scenario||'BP de référence')+'">';
    h+='<span style="background:'+(r.scenario?'#eef2ff':'#f1f5f9')+';color:'+(r.scenario?'#4338ca':'#94a3b8')+';padding:3px 8px;border-radius:6px;font-size:9px;font-weight:600">'+(r.scenario||'BP réf.')+'</span></td>';
    var _mcW1=Math.round(Math.abs(r.ca1)/_mcMax*100);
    h+='<td style="padding:10px 12px;color:#0F6E56;font-weight:600;text-align:right;font-size:12px"><div style="display:flex;align-items:center;gap:6px;justify-content:flex-end">'+fmt(r.ca1)+'<div style="width:40px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;flex-shrink:0"><div style="width:'+_mcW1+'%;height:100%;background:#0F6E56;border-radius:3px;transition:width .6s ease"></div></div></div></td>';
    var _mcW3=Math.round(Math.abs(r.ca3)/_mcMax*100);
    h+='<td style="padding:10px 12px;color:#6366f1;font-weight:600;text-align:right;font-size:12px"><div style="display:flex;align-items:center;gap:6px;justify-content:flex-end">'+fmt(r.ca3)+'<div style="width:40px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;flex-shrink:0"><div style="width:'+_mcW3+'%;height:100%;background:#6366f1;border-radius:3px;transition:width .6s ease"></div></div></div></td>';
    h+='<td style="padding:10px 12px;font-weight:600;text-align:right;font-size:12px;color:'+(r.ebitda1>=0?'#0F6E56':'#dc2626')+'">'+fmt(r.ebitda1)+'</td>';
    h+='<td style="padding:10px 12px;font-weight:600;text-align:right;font-size:12px;color:'+(r.ebitda3>=0?'#0F6E56':'#dc2626')+'">'+fmt(r.ebitda3)+'</td>';
    // Marge avec badge coloré
    var _margeBg=r.margeEbitda3>=30?'#dcfce7':r.margeEbitda3>=15?'#dbeafe':'#fee2e2';
    var _margeC=r.margeEbitda3>=30?'#166534':r.margeEbitda3>=15?'#1e40af':'#991b1b';
    h+='<td style="padding:10px 12px;text-align:center"><span style="background:'+_margeBg+';color:'+_margeC+';padding:4px 10px;border-radius:8px;font-size:11px;font-weight:700">'+r.margeEbitda3+'%</span></td>';
    h+='<td style="padding:10px 12px;text-align:right;font-size:12px;color:'+(r.rex3>=0?'#1e293b':'#dc2626')+';font-weight:500">'+fmt(r.rex3)+'</td>';
    h+='<td style="padding:10px 12px;text-align:right;font-size:12px;color:'+(r.rn3>=0?'#1e293b':'#dc2626')+';font-weight:500">'+fmt(r.rn3)+'</td>';
    h+='<td style="padding:10px 12px;text-align:right;font-size:12px;font-weight:700;color:'+(r.cashnet3>=0?'#0F6E56':'#dc2626')+'">'+fmt(r.cashnet3)+'</td>';
    h+='<td style="padding:10px 12px;text-align:center;font-weight:600;font-size:12px">'+r.membres+'</td>';
    h+='</tr>';
  });
  // Total row — premium
  h+='<tr style="background:linear-gradient(90deg,#0f172a,#1e293b);color:#fff">';
  h+='<td style="padding:12px;font-weight:800;font-size:12px;border-radius:0 0 0 12px" colspan="2"><span style="display:flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>TOTAL CONSOLIDÉ</span></td>';
  h+='<td style="padding:12px;font-weight:700;text-align:right;color:#6ee7b7">'+fmt(totCA1)+'</td>';
  h+='<td style="padding:12px;font-weight:700;text-align:right;color:#a5b4fc">'+fmt(totCA3)+'</td>';
  h+='<td style="padding:12px;font-weight:700;text-align:right;color:'+(totEbitda1>=0?'#6ee7b7':'#fca5a5')+'">'+fmt(totEbitda1)+'</td>';
  h+='<td style="padding:12px;font-weight:700;text-align:right;color:'+(totEbitda3>=0?'#6ee7b7':'#fca5a5')+'">'+fmt(totEbitda3)+'</td>';
  h+='<td style="padding:12px;text-align:center"><span style="background:rgba(255,255,255,0.1);padding:4px 10px;border-radius:8px;font-weight:800;font-size:11px">'+margeEbitda3Tot+'%</span></td>';
  h+='<td style="padding:12px;font-weight:700;text-align:right;color:'+(totRex3>=0?'#e2e8f0':'#fca5a5')+'">'+fmt(totRex3)+'</td>';
  h+='<td style="padding:12px;font-weight:700;text-align:right;color:'+(totRN3>=0?'#e2e8f0':'#fca5a5')+'">'+fmt(totRN3)+'</td>';
  h+='<td style="padding:12px;font-weight:800;text-align:right;color:'+(totCashNet3>=0?'#6ee7b7':'#fca5a5')+'">'+fmt(totCashNet3)+'</td>';
  h+='<td style="padding:12px;text-align:center;font-weight:700;border-radius:0 0 12px 0">'+totMembres+'</td>';
  h+='</tr>';
  h+='</tbody></table></div></div>';
  return h;
}

