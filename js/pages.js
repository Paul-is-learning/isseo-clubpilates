// ── PAGE: Projets (liste studios) ──────────────────────────────────────
function renderProjets(){
  if(!S._dataLoaded&&typeof skeletonGrid==='function')return '<div class="skeleton-page">'+skeletonGrid(6)+'</div>';
  var allIds=_getStudioIds();
  var isAdmin=!!S.profile&&!isViewer();
  var ids=allIds;
  if(S.dashFilter!=='all')ids=allIds.filter(function(id){return S.studios[id].statut===S.dashFilter;});

  var h='';
  // ── Page header ──
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px">';
  h+='<div><div style="font-size:20px;font-weight:700;color:#1a1a1a">Studios</div><div style="font-size:12px;color:#888;margin-top:2px">'+allIds.length+' studios en suivi</div></div>';
  h+='<div style="display:flex;align-items:center;gap:8px">';
  h+=renderSearchBar();
  h+=userAvatarWidget(S.profile);
  h+='</div></div>';

  // ── Toolbar : vue toggle + filtres + actions ──
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">';
  h+='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">';
  h+=renderViewToggle();
  h+=renderStatusFilters(allIds);
  h+='</div>';
  h+='<div style="display:flex;align-items:center;gap:6px">';
  if(isAdmin)h+='<button class="btn" onclick="toggleNewForm()" style="font-size:11px">'+(S.showNewForm?'Annuler':'+ Nouveau studio')+'</button>';
  h+='</div></div>';

  if(S.showNewForm)h+=renderNewForm();

  // ── Content area ──
  if(S.dashView==='grid'){
    h+='<div class="cards">';
    ids.forEach(function(id){h+=renderCard(id,S.studios[id]);});
    h+='</div>';
    if(!ids.length)h+='<div style="text-align:center;color:#bbb;padding:30px;font-size:13px">Aucun studio avec ce filtre</div>';
  } else if(S.dashView==='cohorte'){
    h+=renderCohorteView(ids);
  } else if(S.dashView==='list'){
    h+=renderListView(ids);
  }
  return h;
}

// ── PAGE: Projets Admin ────────────────────────────────────────────────
var _adminPresenceInterval=null;
function _startAdminPresenceRefresh(){
  _stopAdminPresenceRefresh();
  _adminPresenceInterval=setInterval(async function(){
    if(S.mainTab!=='admin'){_stopAdminPresenceRefresh();return;}
    await loadPresence();
    render();
  },30000);
}
function _stopAdminPresenceRefresh(){
  if(_adminPresenceInterval){clearInterval(_adminPresenceInterval);_adminPresenceInterval=null;}
}
function renderProjetsAdmin(){
  if(!_adminPresenceInterval)_startAdminPresenceRefresh();
  var h='';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">';
  h+='<div><div style="font-size:20px;font-weight:700;color:#1a1a1a">Administration</div><div style="font-size:12px;color:#888;margin-top:2px">Gestion des utilisateurs et paramètres</div></div>';
  h+='<button class="btn" onclick="S.mainTab=\'studios\';_stopAdminPresenceRefresh();render()" style="font-size:11px">← Retour aux projets</button>';
  h+='</div>';
  h+=renderAdminPanel();
  return h;
}

// Legacy wrapper — backward compatibility
function renderDashboard(){
  return '<div class="app">'+renderProjets()+'</div>';
}

// ── PAGE: BP Consolidé ─────────────────────────────────────────────────
// Calcule le CA annuel simulé pour un studio à partir du scénario actif
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

function renderPageEngagements(){
  if(!S._dataLoaded&&typeof skeletonGrid==='function')return '<div class="skeleton-page">'+skeletonGrid(4)+'</div>';
  var allIds=_getStudioIds();
  var dm=S.darkMode;
  var cardBg=dm?'#161b22':'#fff';
  var borderC=dm?'#30363d':'#e8e8e0';
  var txtMain=dm?'#e6edf3':'#1a1a1a';
  var txtSub=dm?'#8b949e':'#888';
  var subtleBg=dm?'#21262d':'#f8f9fb';

  // ── Mapping données ──
  // Bloc 1 : Sociétés porteuses des projets (groupement par S.studios[id].societe)
  var SOCIETES_PORTEUSES=[
    {societe:'P&W Occitanie',short:'P&W Occitanie',color:'#1a3a6b',desc:'Montpellier Lattes & Toulouse'},
    {societe:'COBE Society',short:'COBE Society',color:'#0F6E56',desc:'La Garenne-Colombes & Levallois-Perret'},
    {societe:'SACOBE Society',short:'SACOBE Society',color:'#854F0B',desc:'Issy-les-Moulineaux'},
  ];
  // Bloc 2 : Actionnaires des sociétés porteuses (groupement par engage_par)
  // avatarNom = nom utilisé pour chercher la photo dans PHOTO_MAP
  var ACTIONNAIRES=[
    {nom:'Moovi-moov',contributors:['Moovi-moov'],avatarNom:'Clément Coquel',desc:'Holding Clément Coquel',color:'#854F0B'},
    {nom:'Pilatine',contributors:['Pilatine'],avatarNom:'Caroline Coquel',desc:'Holding Caroline Coquel',color:'#7C3AED'},
    {nom:'SAS Isséo',contributors:['SAS Isséo'],avatarNom:'Pascal Bécaud',desc:'Holding famille Bécaud',color:'#0F6E56'},
    {nom:'Paul Bécaud',contributors:['Paul Bécaud'],avatarNom:'Paul Bécaud',desc:'À titre personnel',color:'#1a3a6b'},
    {nom:'SAS P&W Studios',contributors:['SAS P&W Studios'],avatarNom:'Tom Bécaud',desc:'Holding Tom Bécaud',color:'#1a3a6b'},
    {nom:'Paul Sabourin',contributors:['Paul Sabourin'],avatarNom:'Paul Sabourin',desc:'À titre personnel',color:'#B45309'},
  ];

  // ── Agrégation ──
  var allDeps=[];
  allIds.forEach(function(id){
    (S.depenses[id]||[]).forEach(function(d){
      allDeps.push({dep:d,studioId:id,studioName:(S.studios[id]||{}).name||id});
    });
  });
  var totalEngage=0,totalDebloque=0,totalAttente=0;
  allDeps.forEach(function(e){
    var v=num(e.dep.ttc);
    totalEngage+=v;
    if(e.dep.deblocage==='debloque')totalDebloque+=v;
    else if(e.dep.deblocage==='demande')totalAttente+=v;
  });
  var nbProjets=allIds.filter(function(id){return (S.depenses[id]||[]).length>0;}).length;

  var h='';

  // ── Page header ──
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px">';
  h+='<div><div style="font-size:20px;font-weight:700;color:'+txtMain+'">Récapitulatif des engagements</div><div style="font-size:12px;color:'+txtSub+';margin-top:2px">Vision consolidée des dépenses engagées par société et par actionnaire — '+allIds.length+' studios</div></div>';
  h+='<div style="display:flex;align-items:center;gap:8px">'+renderSearchBar()+userAvatarWidget(S.profile)+'</div>';
  h+='</div>';

  // ── Navigation 3 volets ──
  var engSections=[
    {id:'recap',label:'Récap\' engagements',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',gradient:'linear-gradient(135deg,#92630a 0%,#d4a843 100%)',activeColor:'#92630a',activeBg:'#fef3c7'},
    {id:'fondspropres',label:'Fonds propres',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',gradient:'linear-gradient(135deg,#1a3a6b 0%,#3b7dd8 100%)',activeColor:'#1a3a6b',activeBg:'#dbeafe'},
    {id:'comptescourants',label:'Comptes courants',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',gradient:'linear-gradient(135deg,#0F6E56 0%,#22c55e 100%)',activeColor:'#0F6E56',activeBg:'#d1fae5'}
  ];

  h+='<div style="display:flex;gap:8px;margin-bottom:20px;background:'+(dm?'#161b22':'#f8f9fb')+';padding:6px;border-radius:14px;border:1px solid '+borderC+'">';
  engSections.forEach(function(sec){
    var active=S.engSection===sec.id;
    h+='<button onclick="toggleEngSection(\''+sec.id+'\')" style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:'+(active?'700':'500')+';cursor:pointer;transition:all .25s;border:none;';
    if(active){
      h+='background:'+sec.activeBg+';color:'+sec.activeColor+';box-shadow:0 2px 8px rgba(0,0,0,0.08)"';
    } else {
      h+='background:transparent;color:'+(dm?'#8b949e':'#888')+'"';
    }
    h+=' onmouseover="if(!'+active+')this.style.background=\''+(dm?'#21262d':'#f0f0ea')+'\'" onmouseout="if(!'+active+')this.style.background=\''+( active?sec.activeBg:'transparent')+'\'">';
    h+=sec.icon+'<span>'+sec.label+'</span>';
    h+='</button>';
  });
  h+='</div>';

  // ════════════════════════════════════════════════════════════════════════════
  // VOLET 1 : Récap' engagements
  // ════════════════════════════════════════════════════════════════════════════
  if(S.engSection==='recap'){

  // ── Pré-calcul données par société ──
  var socData=[];
  SOCIETES_PORTEUSES.forEach(function(soc){
    var socStudioIds=allIds.filter(function(id){return S.studios[id]&&S.studios[id].societe===soc.societe;});
    var socDeps=[];
    socStudioIds.forEach(function(id){
      (S.depenses[id]||[]).forEach(function(d){socDeps.push({dep:d,studioId:id,studioName:(S.studios[id]||{}).name||id});});
    });
    var socTotal=socDeps.reduce(function(s,e){return s+num(e.dep.ttc);},0);
    var socDebloque=socDeps.filter(function(e){return e.dep.deblocage==='debloque';}).reduce(function(s,e){return s+num(e.dep.ttc);},0);
    var socAttente=socDeps.filter(function(e){return e.dep.deblocage==='demande';}).reduce(function(s,e){return s+num(e.dep.ttc);},0);
    var byStudio={};
    socDeps.forEach(function(e){
      if(!byStudio[e.studioId])byStudio[e.studioId]={name:e.studioName,total:0,debloque:0,deps:[],bySource:{}};
      byStudio[e.studioId].total+=num(e.dep.ttc);
      if(e.dep.deblocage==='debloque')byStudio[e.studioId].debloque+=num(e.dep.ttc);
      byStudio[e.studioId].deps.push(e.dep);
      var src=e.dep.engage_par||'Non renseign\u00e9';
      byStudio[e.studioId].bySource[src]=(byStudio[e.studioId].bySource[src]||0)+num(e.dep.ttc);
    });
    socData.push({soc:soc,studioIds:socStudioIds,deps:socDeps,total:socTotal,debloque:socDebloque,attente:socAttente,byStudio:byStudio});
  });

  // Pré-calcul données par actionnaire
  var actData=[];
  ACTIONNAIRES.forEach(function(act){
    var actDeps=allDeps.filter(function(e){return act.contributors.indexOf(e.dep.engage_par)>=0;});
    var actTotal=actDeps.reduce(function(s,e){return s+num(e.dep.ttc);},0);
    var actDebloque=actDeps.filter(function(e){return e.dep.deblocage==='debloque';}).reduce(function(s,e){return s+num(e.dep.ttc);},0);
    var byStudio={};
    actDeps.forEach(function(e){
      if(!byStudio[e.studioId])byStudio[e.studioId]={name:e.studioName,total:0,debloque:0,deps:[]};
      byStudio[e.studioId].total+=num(e.dep.ttc);
      if(e.dep.deblocage==='debloque')byStudio[e.studioId].debloque+=num(e.dep.ttc);
      byStudio[e.studioId].deps.push(e.dep);
    });
    actData.push({act:act,deps:actDeps,total:actTotal,debloque:actDebloque,byStudio:byStudio});
  });
  var maxActTotal=Math.max.apply(null,actData.map(function(a){return a.total;}));

  // ── Header gradient gold ──
  h+='<div style="background:linear-gradient(135deg,#92630a 0%,#b8860b 50%,#d4a843 100%);border-radius:16px;padding:24px 28px;margin-bottom:20px;position:relative;overflow:hidden">';
  h+='<div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.08)"></div>';
  h+='<div style="position:absolute;bottom:-30px;left:40%;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.05)"></div>';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">';
  h+='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';
  h+='<span style="font-size:16px;font-weight:700;color:#fff;letter-spacing:-0.3px">Synth\u00e8se des engagements</span></div>';
  h+='<div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:14px">O\u00f9 en sont les d\u00e9penses engag\u00e9es ? Vue consolid\u00e9e de '+allIds.length+' studios</div>';

  // KPIs en ligne
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">';
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:12px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Total engag\u00e9</div><div style="font-size:22px;font-weight:800;color:#fff">'+fmt(totalEngage)+'</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px">'+nbProjets+' projet(s) actif(s)</div></div>';
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:12px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">D\u00e9bloqu\u00e9</div><div style="font-size:22px;font-weight:800;color:#d1fae5">'+fmt(totalDebloque)+'</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px">'+(totalEngage?Math.round(totalDebloque/totalEngage*100):0)+'% du total</div></div>';
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:12px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">En attente</div><div style="font-size:22px;font-weight:800;color:#fef3c7">'+fmt(totalAttente)+'</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px">demandes de d\u00e9blocage</div></div>';
  h+='</div>';

  // Barre de répartition par société (stacked bar)
  if(totalEngage>0){
    h+='<div>';
    h+='<div style="font-size:9px;color:rgba(255,255,255,0.5);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">R\u00e9partition par soci\u00e9t\u00e9</div>';
    h+='<div style="height:10px;border-radius:5px;overflow:hidden;display:flex;gap:2px">';
    socData.forEach(function(sd){
      var pct=Math.max(1,Math.round(sd.total/totalEngage*100));
      h+='<div title="'+sd.soc.short+' : '+fmt(sd.total)+'" style="width:'+pct+'%;background:'+sd.soc.color+';border-radius:3px;transition:width .3s"></div>';
    });
    h+='</div>';
    h+='<div style="display:flex;gap:12px;margin-top:6px">';
    socData.forEach(function(sd){
      h+='<div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:2px;background:'+sd.soc.color+'"></div><span style="font-size:9px;color:rgba(255,255,255,0.7)">'+sd.soc.short+' '+fmt(sd.total)+'</span></div>';
    });
    h+='</div></div>';
  }
  h+='</div>';

  // ── Toggle Soci\u00e9t\u00e9s / Actionnaires ──
  h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:14px">';
  var tabs=[
    {id:'societes',label:'Par soci\u00e9t\u00e9',icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'},
    {id:'actionnaires',label:'Par actionnaire',icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'}
  ];
  tabs.forEach(function(tab){
    var active=S.engView===tab.id;
    h+='<button onclick="toggleEngView(\''+tab.id+'\')" style="display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:'+(active?'700':'500')+';cursor:pointer;transition:all .2s;border:'+(active?'none':'1px solid '+borderC)+';background:'+(active?(dm?'#e6edf3':'#92630a'):(dm?'#21262d':'#fff'))+';color:'+(active?'#fff':(dm?'#8b949e':'#666'))+'">';
    h+=tab.icon+'<span>'+tab.label+'</span></button>';
  });
  h+='<div style="flex:1"></div>';
  h+='<div style="font-size:11px;color:'+txtSub+'">Cliquez pour acc\u00e9der au d\u00e9tail</div>';
  h+='</div>';

  if(S.engView==='societes'){
    // ═══ VUE SOCIÉTÉS : tableau consolidé ═══
    socData.forEach(function(sd,socIdx){
      var soc=sd.soc;
      var pctDeb=sd.total?Math.round(sd.debloque/sd.total*100):0;
      var pctOfTotal=totalEngage?Math.round(sd.total/totalEngage*100):0;

      h+='<div style="background:'+cardBg+';border:1px solid '+borderC+';border-radius:14px;overflow:hidden;margin-bottom:12px;transition:all .3s" onmouseenter="this.style.boxShadow=\'0 4px 16px rgba(0,0,0,'+(dm?'0.3':'0.08')+')\'" onmouseleave="this.style.boxShadow=\'none\'">';

      // En-tête société avec bande couleur
      h+='<div style="border-left:4px solid '+soc.color+';padding:16px 20px">';
      h+='<div style="display:flex;align-items:center;gap:12px">';
      h+='<div style="width:40px;height:40px;border-radius:10px;background:'+soc.color+'15;color:'+soc.color+';display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px">'+soc.short.split(' ').map(function(w){return w.charAt(0);}).join('')+'</div>';
      h+='<div style="flex:1"><div style="font-size:14px;font-weight:700;color:'+txtMain+'">'+soc.short+'</div>';
      h+='<div style="font-size:10px;color:'+txtSub+'">'+soc.desc+' \u00b7 '+sd.studioIds.length+' studio(s)</div></div>';
      h+='<div style="text-align:right"><div style="font-size:22px;font-weight:800;color:'+soc.color+'">'+fmt(sd.total)+'</div>';
      h+='<div style="font-size:10px;color:'+txtSub+'">'+pctOfTotal+'% du total</div></div>';
      h+='</div>';

      // Barre de progression + statuts
      h+='<div style="margin-top:12px">';
      h+='<div style="height:6px;border-radius:3px;background:'+(dm?'#30363d':'#f0f0ea')+';overflow:hidden;display:flex;gap:1px">';
      var pctDeb2=sd.total?Math.round(sd.debloque/sd.total*100):0;
      var pctAtt=sd.total?Math.round(sd.attente/sd.total*100):0;
      if(pctDeb2>0)h+='<div style="width:'+pctDeb2+'%;background:#0F6E56;border-radius:3px"></div>';
      if(pctAtt>0)h+='<div style="width:'+pctAtt+'%;background:#d4a843;border-radius:3px"></div>';
      h+='</div>';
      h+='<div style="display:flex;gap:16px;margin-top:6px">';
      h+='<div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:#0F6E56"></div><span style="font-size:10px;color:'+txtSub+'">D\u00e9bloqu\u00e9 '+fmt(sd.debloque)+'</span></div>';
      if(sd.attente>0)h+='<div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:#d4a843"></div><span style="font-size:10px;color:'+txtSub+'">En attente '+fmt(sd.attente)+'</span></div>';
      var nonDebloque=sd.total-sd.debloque-sd.attente;
      if(nonDebloque>0)h+='<div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:'+(dm?'#30363d':'#e0e0d8')+'"></div><span style="font-size:10px;color:'+txtSub+'">\u00c0 venir '+fmt(nonDebloque)+'</span></div>';
      h+='</div></div>';
      h+='</div>';

      // Détail par studio
      h+='<div style="border-top:1px solid '+borderC+'">';
      var stIds=Object.keys(sd.byStudio);
      if(!stIds.length){
        h+='<div style="padding:14px 20px;text-align:center;font-size:11px;color:'+txtSub+'">Aucune d\u00e9pense enregistr\u00e9e</div>';
      } else {
        stIds.forEach(function(sid,idx){
          var st=sd.byStudio[sid];
          var pctSt=sd.total?Math.round(st.total/sd.total*100):0;
          h+='<div onclick="openDetail(\''+sid+'\');setTimeout(function(){setDetailTab(\'engagements\')},50)" style="padding:12px 20px;cursor:pointer;transition:background .15s;border-bottom:'+(idx<stIds.length-1?'1px solid '+borderC:'none')+'" onmouseover="this.style.background=\''+(dm?'#1c2128':'#f8f9fb')+'\'" onmouseout="this.style.background=\'transparent\'">';
          h+='<div style="display:flex;align-items:center;gap:12px">';
          h+='<div style="width:32px;height:32px;border-radius:8px;background:'+(dm?'#21262d':'#f0f0ea')+';display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+soc.color+'" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>';
          h+='<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:'+txtMain+'">'+st.name+'</div>';
          h+='<div style="font-size:10px;color:'+txtSub+'">'+st.deps.length+' d\u00e9pense(s)</div></div>';
          // Barre proportionnelle
          h+='<div style="width:100px">';
          h+='<div style="height:4px;border-radius:2px;background:'+(dm?'#30363d':'#f0f0ea')+';overflow:hidden"><div style="width:'+pctSt+'%;height:100%;background:'+soc.color+';border-radius:2px"></div></div>';
          h+='<div style="font-size:9px;color:'+txtSub+';text-align:right;margin-top:2px">'+pctSt+'%</div>';
          h+='</div>';
          h+='<div style="text-align:right;min-width:90px"><div style="font-size:13px;font-weight:700;color:'+soc.color+'">'+fmt(st.total)+'</div></div>';
          h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+txtSub+'" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
          h+='</div>';
          // Breakdown par source
          var sources=Object.keys(st.bySource);
          if(sources.length>0){
            h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;padding-left:44px">';
            sources.forEach(function(src){
              h+='<span style="font-size:9px;padding:2px 8px;border-radius:4px;background:'+(dm?'#21262d':'#f0f0ea')+';color:'+txtSub+';font-weight:500">'+src+' : '+fmt(st.bySource[src])+'</span>';
            });
            h+='</div>';
          }
          h+='</div>';
        });
      }
      // Studios sans dépenses
      var emptyStudios=sd.studioIds.filter(function(id){return !sd.byStudio[id];});
      emptyStudios.forEach(function(sid){
        h+='<div onclick="openDetail(\''+sid+'\');setTimeout(function(){setDetailTab(\'engagements\')},50)" style="padding:8px 20px;cursor:pointer;display:flex;align-items:center;gap:12px;opacity:0.4;border-top:1px solid '+borderC+'" onmouseover="this.style.opacity=\'0.7\'" onmouseout="this.style.opacity=\'0.4\'">';
        h+='<div style="width:32px;height:32px;border-radius:8px;background:'+(dm?'#21262d':'#f0f0ea')+';display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>';
        h+='<span style="font-size:11px;color:'+txtSub+'">'+(S.studios[sid]?S.studios[sid].name:sid)+'</span>';
        h+='<span style="font-size:9px;color:'+txtSub+';margin-left:auto">Aucune d\u00e9pense</span>';
        h+='</div>';
      });
      h+='</div>';
      h+='</div>';
    });

  } else {
    // ═══ VUE ACTIONNAIRES : barres proportionnelles ═══
    h+='<div style="background:'+cardBg+';border:1px solid '+borderC+';border-radius:14px;overflow:hidden">';
    h+='<div style="padding:16px 20px;border-bottom:1px solid '+borderC+';display:flex;align-items:center;gap:8px">';
    h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92630a" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>';
    h+='<span style="font-size:14px;font-weight:700;color:'+txtMain+'">Engagements par actionnaire</span>';
    h+='</div>';

    actData.forEach(function(ad,idx){
      var act=ad.act;
      var pctDeb=ad.total?Math.round(ad.debloque/ad.total*100):0;
      var barPct=maxActTotal>0?Math.max(3,Math.round(ad.total/maxActTotal*100)):0;
      var expanded=S.engExpanded['act_'+act.nom];

      h+='<div style="border-bottom:'+(idx<actData.length-1?'1px solid '+borderC:'none')+'">';

      // Ligne principale
      h+='<div onclick="toggleEngExpand(\'act_'+act.nom+'\')" style="padding:14px 20px;cursor:pointer;transition:background .15s" onmouseover="this.style.background=\''+(dm?'#1c2128':'#f8f9fb')+'\'" onmouseout="this.style.background=\'transparent\'">';
      h+='<div style="display:flex;align-items:center;gap:12px">';
      h+=avatarHTML(act.avatarNom||act.nom,40);
      h+='<div style="min-width:120px"><div style="font-size:13px;font-weight:600;color:'+txtMain+'">'+act.nom+'</div>';
      h+='<div style="font-size:10px;color:'+txtSub+'">'+act.desc+'</div></div>';

      // Barre proportionnelle
      h+='<div style="flex:1;display:flex;flex-direction:column;gap:2px">';
      h+='<div style="height:8px;border-radius:4px;background:'+(dm?'#21262d':'#f0f0ea')+';overflow:hidden">';
      h+='<div style="width:'+barPct+'%;height:100%;background:linear-gradient(90deg,'+act.color+'cc,'+act.color+');border-radius:4px;transition:width .3s"></div>';
      h+='</div>';
      if(ad.total>0){
        h+='<div style="display:flex;gap:8px;font-size:9px">';
        h+='<span style="color:#0F6E56">'+pctDeb+'% d\u00e9bloqu\u00e9</span>';
        h+='<span style="color:'+txtSub+'">'+Object.keys(ad.byStudio).length+' projet(s)</span>';
        h+='</div>';
      }
      h+='</div>';

      // Montant
      h+='<div style="text-align:right;min-width:100px"><div style="font-size:18px;font-weight:800;color:'+act.color+'">'+fmt(ad.total)+'</div></div>';
      h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+txtSub+'" stroke-width="2" style="transform:rotate('+(expanded?'180':'0')+'deg);transition:transform .2s;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>';
      h+='</div></div>';

      // Détail accordion
      if(expanded){
        h+='<div style="padding:0 20px 14px;background:'+(dm?'#0d1117':'#fafbfc')+'">';
        var stIds=Object.keys(ad.byStudio);
        stIds.forEach(function(sid){
          var st=ad.byStudio[sid];
          h+='<div onclick="openDetail(\''+sid+'\');setTimeout(function(){setDetailTab(\'engagements\')},50)" style="padding:8px 0;cursor:pointer;display:flex;align-items:center;gap:10px;font-size:11px">';
          h+='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="'+act.color+'" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
          h+='<span style="font-weight:600;color:'+txtMain+'">'+st.name+'</span>';
          h+='<span style="color:'+txtSub+'">'+st.deps.length+' d\u00e9p.</span>';
          h+='<span style="margin-left:auto;font-weight:700;color:'+act.color+'">'+fmt(st.total)+'</span>';
          h+='<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
          h+='</div>';
        });
        h+='</div>';
      }
      h+='</div>';
    });
    h+='</div>';
  }

  h+='<div style="text-align:center;margin-top:14px;font-size:11px;color:'+txtSub+'">';
  h+='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
  h+='Pour saisir ou modifier les d\u00e9penses, rendez-vous dans l\'onglet <b>Engagements</b> de chaque studio</div>';

  } // fin volet recap

  // ════════════════════════════════════════════════════════════════════════════
  // VOLET 2 : Fonds propres à injecter par actionnaire
  // ════════════════════════════════════════════════════════════════════════════
  if(S.engSection==='fondspropres'){

  var OWNERSHIP=OWNERSHIP_MAP;

  // FP par défaut par studio (capex standard - emprunt standard)
  var FP_DEFAUT=333500-230000; // 103 500 €

  // ── Cohorte 1 : données réelles ──
  var fpByStudio={};
  allIds.forEach(function(id){
    var s=S.studios[id];
    if(!s)return;
    var _capexDet=getCapexDetailForStudio(id);
    var _capexTots=computeCapexTotals(_capexDet);
    var capex=_capexTots.capex||s.capex||333500;
    var _hasCustomCapex=s.capexDetail&&Object.keys(s.capexDetail||{}).length>0;
    var emprunt=_hasCustomCapex?Math.round(capex*0.70):(s.emprunt||230000);
    var fp=capex-emprunt;
    fpByStudio[id]={name:s.name,societe:s.societe,capex:capex,emprunt:emprunt,fp:fp,cohorte:s.cohorte||1};
  });

  // ── Calcul FP par cohorte ──
  // Fonction pour agréger par actionnaire pour une cohorte donnée
  function computeFPForCohorte(coh){
    var result={};
    if(coh===1){
      // Données réelles
      allIds.forEach(function(id){
        var info=fpByStudio[id];
        if(!info||info.cohorte!==1)return;
        var owners=OWNERSHIP[info.societe]||[];
        owners.forEach(function(o){
          if(!result[o.nom])result[o.nom]={nom:o.nom,desc:o.desc,color:o.color,avatarNom:o.avatarNom,total:0,details:[]};
          var share=Math.round(info.fp*o.pct/100);
          result[o.nom].total+=share;
          result[o.nom].details.push({studio:info.name,studioId:id,societe:info.societe,pct:o.pct,type:o.type,fpStudio:info.fp,share:share});
        });
      });
    } else {
      // Simulation : nb studios × FP_DEFAUT × ownership%
      var simData=S.fpSimCohortes[coh]||{};
      SOCIETES_PORTEUSES.forEach(function(soc){
        var nb=simData[soc.societe]||0;
        if(nb<=0)return;
        var owners=OWNERSHIP[soc.societe]||[];
        owners.forEach(function(o){
          if(!result[o.nom])result[o.nom]={nom:o.nom,desc:o.desc,color:o.color,avatarNom:o.avatarNom,total:0,details:[]};
          var share=Math.round(FP_DEFAUT*o.pct/100*nb);
          result[o.nom].total+=share;
          result[o.nom].details.push({studio:nb+' studio(s) '+soc.short,studioId:null,societe:soc.societe,pct:o.pct,type:o.type,fpStudio:FP_DEFAUT*nb,share:share});
        });
      });
    }
    return result;
  }

  // Calcul pour chaque cohorte
  var fpParCohorte={};
  var totalFPGlobal=0;
  [1,2,3,4].forEach(function(c){
    fpParCohorte[c]=computeFPForCohorte(c);
    var tot=Object.keys(fpParCohorte[c]).reduce(function(s,k){return s+fpParCohorte[c][k].total;},0);
    fpParCohorte[c]._total=tot;
    totalFPGlobal+=tot;
  });

  // Agréger tous les actionnaires (toutes cohortes)
  var actionnaireFPGlobal={};
  [1,2,3,4].forEach(function(c){
    Object.keys(fpParCohorte[c]).forEach(function(k){
      if(k==='_total')return;
      if(!actionnaireFPGlobal[k])actionnaireFPGlobal[k]={nom:fpParCohorte[c][k].nom,total:0};
      actionnaireFPGlobal[k].total+=fpParCohorte[c][k].total;
    });
  });

  // ── Header gradient bleu ──
  h+='<div style="background:linear-gradient(135deg,#1a3a6b 0%,#2d5a8e 50%,#3b7dd8 100%);border-radius:16px;padding:22px 28px;margin-bottom:20px;position:relative;overflow:hidden">';
  h+='<div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.06)"></div>';
  h+='<div style="position:absolute;bottom:-30px;left:30%;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.04)"></div>';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">';
  h+='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
  h+='<span style="font-size:16px;font-weight:700;color:#fff">Combien chaque associ\u00e9 doit-il injecter ?</span></div>';
  h+='<div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:14px">Fonds propres = CAPEX \u2212 Emprunt, r\u00e9partis selon les quotes-parts de d\u00e9tention \u00b7 FP standard : '+fmt(FP_DEFAUT)+' / studio</div>';

  // KPIs
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">';
  h+='<div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:12px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Total global</div><div style="font-size:24px;font-weight:800;color:#fff">'+fmt(totalFPGlobal)+'</div><div style="font-size:10px;color:rgba(255,255,255,0.5)">toutes cohortes</div></div>';
  // Nb studios + nb actionnaires
  var nbStudiosC1=allIds.filter(function(id){return (S.studios[id]||{}).cohorte===1||!(S.studios[id]||{}).cohorte;}).length;
  var nbActFP=Object.keys(actionnaireFPGlobal).length;
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:12px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Cohorte 1</div><div style="font-size:24px;font-weight:800;color:#fff">'+fmt(fpParCohorte[1]._total)+'</div><div style="font-size:10px;color:rgba(255,255,255,0.5)">'+nbStudiosC1+' studio(s) r\u00e9els</div></div>';
  var simTotal=totalFPGlobal-fpParCohorte[1]._total;
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:12px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Cohortes 2\u20134</div><div style="font-size:24px;font-weight:800;color:'+(simTotal>0?'#93c5fd':'rgba(255,255,255,0.4)')+'">'+fmt(simTotal)+'</div><div style="font-size:10px;color:rgba(255,255,255,0.5)">simulation</div></div>';
  h+='</div>';

  // Barre de répartition par actionnaire (stacked)
  if(totalFPGlobal>0){
    h+='<div>';
    h+='<div style="font-size:9px;color:rgba(255,255,255,0.5);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">R\u00e9partition par actionnaire</div>';
    h+='<div style="height:10px;border-radius:5px;overflow:hidden;display:flex;gap:2px">';
    var fpSorted=Object.keys(actionnaireFPGlobal).sort(function(a,b){return actionnaireFPGlobal[b].total-actionnaireFPGlobal[a].total;});
    var barColors=['#3b82f6','#8b5cf6','#06b6d4','#f59e0b','#ef4444','#10b981'];
    fpSorted.forEach(function(k,i){
      var pct=Math.max(1,Math.round(actionnaireFPGlobal[k].total/totalFPGlobal*100));
      h+='<div title="'+k+' : '+fmt(actionnaireFPGlobal[k].total)+'" style="width:'+pct+'%;background:'+barColors[i%barColors.length]+';border-radius:3px"></div>';
    });
    h+='</div>';
    h+='<div style="display:flex;gap:10px;margin-top:6px;flex-wrap:wrap">';
    fpSorted.forEach(function(k,i){
      var pct=Math.round(actionnaireFPGlobal[k].total/totalFPGlobal*100);
      h+='<div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:2px;background:'+barColors[i%barColors.length]+'"></div><span style="font-size:9px;color:rgba(255,255,255,0.7)">'+k+' '+fmt(actionnaireFPGlobal[k].total)+' ('+pct+'%)</span></div>';
    });
    h+='</div></div>';
  }
  h+='</div>';

  // ── Onglets cohortes ──
  h+='<div style="display:flex;gap:6px;margin-bottom:14px">';
  [1,2,3,4].forEach(function(c){
    var active=S.fpSimActiveCohorte===(''+c);
    var hasData=fpParCohorte[c]._total>0;
    var cohIcon=c===1?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>':'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
    h+='<button onclick="toggleFpCohorte(\''+c+'\')" style="display:flex;align-items:center;gap:5px;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:'+(active?'700':'500')+';cursor:pointer;transition:all .2s;border:'+(active?'none':'1px solid '+borderC)+';background:'+(active?(dm?'#3b7dd8':'#1a3a6b'):(dm?'#21262d':'#fff'))+';color:'+(active?'#fff':(dm?'#8b949e':'#666'))+'">';
    h+=cohIcon+' C'+c;
    if(c===1)h+=' <span style="font-size:9px;opacity:0.7">(r\u00e9el)</span>';
    if(hasData&&!active)h+=' <span style="font-size:9px;opacity:0.6">'+fmt(fpParCohorte[c]._total)+'</span>';
    h+='</button>';
  });
  h+='</div>';

  // ── Contenu de la cohorte sélectionnée ──
  var activeCoh=parseInt(S.fpSimActiveCohorte)||1;
  var actionnaireFP=fpParCohorte[activeCoh];
  var totalFPCohorte=actionnaireFP._total||0;

  // Pour cohortes 2-4 : tableau de simulation
  if(activeCoh>=2){
    var simData=S.fpSimCohortes[activeCoh]||{};
    h+='<div style="background:'+cardBg+';border:1px solid '+borderC+';border-radius:14px;overflow:hidden;margin-bottom:16px">';
    h+='<div style="padding:16px 20px;border-bottom:1px solid '+borderC+';display:flex;align-items:center;gap:8px">';
    h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>';
    h+='<span style="font-size:14px;font-weight:700;color:'+txtMain+'">Simulateur Cohorte '+activeCoh+'</span>';
    h+='<span style="font-size:11px;color:'+txtSub+'">Combien de studios souhaitez-vous ouvrir ?</span>';
    h+='</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0">';
    SOCIETES_PORTEUSES.forEach(function(soc,si){
      var nb=simData[soc.societe]||0;
      var fpSoc=FP_DEFAUT*nb;
      h+='<div style="padding:20px;text-align:center;border-right:'+(si<2?'1px solid '+borderC:'none')+'">';
      h+='<div style="width:36px;height:36px;border-radius:10px;background:'+soc.color+'15;color:'+soc.color+';display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;margin:0 auto 8px">'+soc.short.split(' ').map(function(w){return w.charAt(0);}).join('')+'</div>';
      h+='<div style="font-size:12px;font-weight:600;color:'+txtMain+';margin-bottom:10px">'+soc.short+'</div>';
      h+='<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px">';
      h+='<button onclick="setFpSimCohorte('+activeCoh+',\''+soc.societe+'\',Math.max(0,'+(nb-1)+'))" style="width:32px;height:32px;border-radius:8px;border:1px solid '+borderC+';background:'+cardBg+';color:'+txtMain+';font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s" onmouseover="this.style.background=\''+(dm?'#30363d':'#f0f0ea')+'\'" onmouseout="this.style.background=\''+cardBg+'\'">-</button>';
      h+='<span style="font-size:28px;font-weight:800;color:'+soc.color+';min-width:36px">'+nb+'</span>';
      h+='<button onclick="setFpSimCohorte('+activeCoh+',\''+soc.societe+'\','+(nb+1)+')" style="width:32px;height:32px;border-radius:8px;border:1px solid '+borderC+';background:'+cardBg+';color:'+txtMain+';font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s" onmouseover="this.style.background=\''+(dm?'#30363d':'#f0f0ea')+'\'" onmouseout="this.style.background=\''+cardBg+'\'">+</button>';
      h+='</div>';
      h+='<div style="font-size:10px;color:'+txtSub+';margin-bottom:4px">studio(s) \u00e0 ouvrir</div>';
      if(nb>0)h+='<div style="font-size:14px;font-weight:700;color:'+soc.color+';margin-top:6px;padding:4px 10px;background:'+soc.color+'10;border-radius:6px;display:inline-block">'+fmt(fpSoc)+' FP</div>';
      h+='</div>';
    });
    h+='</div></div>';
  }

  // ═══ Tableau consolidé par actionnaire (barres proportionnelles) ═══
  var fpActifs=Object.keys(actionnaireFP).filter(function(k){return k!=='_total'&&actionnaireFP[k].total>0;});
  var maxFPAct=fpActifs.length>0?Math.max.apply(null,fpActifs.map(function(k){return actionnaireFP[k].total;})):0;

  if(fpActifs.length===0){
    h+='<div class="box" style="text-align:center;padding:2rem;color:#aaa;font-size:13px">';
    if(activeCoh===1)h+='Aucun studio en cohorte 1';
    else h+='Ajustez le nombre d\'ouvertures ci-dessus pour simuler les fonds propres n\u00e9cessaires.';
    h+='</div>';
  } else {
    // Trier par montant décroissant
    fpActifs.sort(function(a,b){return actionnaireFP[b].total-actionnaireFP[a].total;});

    h+='<div style="background:'+cardBg+';border:1px solid '+borderC+';border-radius:14px;overflow:hidden">';
    h+='<div style="padding:16px 20px;border-bottom:1px solid '+borderC+';display:flex;align-items:center;gap:8px">';
    h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>';
    h+='<span style="font-size:14px;font-weight:700;color:'+txtMain+'">Fonds propres par actionnaire</span>';
    h+='<span style="font-size:11px;color:'+txtSub+'">\u2014 Cohorte '+activeCoh+(activeCoh===1?' (donn\u00e9es r\u00e9elles)':' (simulation)')+'</span>';
    if(totalFPCohorte>0)h+='<span style="margin-left:auto;font-size:13px;font-weight:700;color:#1a3a6b">Total : '+fmt(totalFPCohorte)+'</span>';
    h+='</div>';

    fpActifs.forEach(function(k,idx){
      var a=actionnaireFP[k];
      var pctOfCoh=totalFPCohorte?Math.round(a.total/totalFPCohorte*100):0;
      var barPct=maxFPAct>0?Math.max(5,Math.round(a.total/maxFPAct*100)):0;
      var expanded=S.engExpanded['fp_'+a.nom+'_c'+activeCoh];

      h+='<div style="border-bottom:'+(idx<fpActifs.length-1?'1px solid '+borderC:'none')+'">';

      // Ligne principale
      h+='<div onclick="toggleEngExpand(\'fp_'+a.nom+'_c'+activeCoh+'\')" style="padding:14px 20px;cursor:pointer;transition:background .15s" onmouseover="this.style.background=\''+(dm?'#1c2128':'#f8f9fb')+'\'" onmouseout="this.style.background=\'transparent\'">';
      h+='<div style="display:flex;align-items:center;gap:12px">';
      h+=avatarHTML(a.avatarNom||a.nom,40);
      h+='<div style="min-width:120px"><div style="font-size:13px;font-weight:600;color:'+txtMain+'">'+a.nom+'</div>';
      h+='<div style="font-size:10px;color:'+txtSub+'">'+a.desc+'</div></div>';

      // Barre proportionnelle avec segments par société
      h+='<div style="flex:1;display:flex;flex-direction:column;gap:3px">';
      h+='<div style="height:10px;border-radius:5px;background:'+(dm?'#21262d':'#f0f0ea')+';overflow:hidden;display:flex;gap:1px">';
      // Segments colorés par société
      a.details.forEach(function(d){
        var socColor=SOCIETES_PORTEUSES.filter(function(s){return s.societe===d.societe;})[0];
        var segPct=a.total>0?Math.max(1,Math.round(d.share/maxFPAct*100)):0;
        h+='<div title="'+d.societe+' : '+fmt(d.share)+' ('+d.pct+'%)" style="width:'+segPct+'%;background:'+(socColor?socColor.color:'#64748b')+';border-radius:3px;transition:width .3s"></div>';
      });
      h+='</div>';
      // Légende société sous la barre
      h+='<div style="display:flex;gap:6px">';
      a.details.forEach(function(d){
        var socColor=SOCIETES_PORTEUSES.filter(function(s){return s.societe===d.societe;})[0];
        h+='<span style="font-size:9px;color:'+txtSub+'"><span style="display:inline-block;width:6px;height:6px;border-radius:2px;background:'+(socColor?socColor.color:'#64748b')+';vertical-align:middle;margin-right:2px"></span>'+d.pct+'%</span>';
      });
      h+='</div>';
      h+='</div>';

      // Montant + pourcentage
      h+='<div style="text-align:right;min-width:110px">';
      h+='<div style="font-size:18px;font-weight:800;color:#1a3a6b">'+fmt(a.total)+'</div>';
      h+='<span style="background:'+(dm?'#1a3a6b33':'#dbeafe')+';color:#1a3a6b;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:600">'+pctOfCoh+'% du total</span>';
      h+='</div>';

      // Chevron
      h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+txtSub+'" stroke-width="2" style="transform:rotate('+(expanded?'180':'0')+'deg);transition:transform .2s;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>';
      h+='</div></div>';

      // Détail accordion
      if(expanded){
        h+='<div style="padding:0 20px 14px;background:'+(dm?'#0d1117':'#fafbfc')+'">';
        a.details.forEach(function(d){
          var socColor=SOCIETES_PORTEUSES.filter(function(s){return s.societe===d.societe;})[0];
          var clickAttr=d.studioId?'onclick="openDetail(\''+d.studioId+'\');setTimeout(function(){setDetailTab(\'engagements\')},50)" style="cursor:pointer"':'';
          h+='<div '+clickAttr+' style="display:flex;align-items:center;gap:10px;padding:8px 0;font-size:11px">';
          h+='<div style="width:4px;height:24px;border-radius:2px;background:'+(socColor?socColor.color:'#64748b')+'"></div>';
          h+='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="'+(socColor?socColor.color:'#64748b')+'" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
          h+='<div style="flex:1"><span style="font-weight:600;color:'+txtMain+'">'+d.studio+'</span>';
          h+='<div style="font-size:10px;color:'+txtSub+'">'+d.societe+' \u00b7 '+d.type+' \u00b7 '+d.pct+'% de '+fmt(d.fpStudio)+'</div></div>';
          h+='<span style="font-weight:700;color:#1a3a6b">'+fmt(d.share)+'</span>';
          if(d.studioId)h+='<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
          h+='</div>';
        });
        h+='</div>';
      }
      h+='</div>';
    });
    h+='</div>';
  }

  } // fin volet fondspropres

  // ════════════════════════════════════════════════════════════════════════════
  // VOLET 3 : Comptes courants d'associés (auto-split via OWNERSHIP)
  // ════════════════════════════════════════════════════════════════════════════
  if(S.engSection==='comptescourants'){

  // Pour chaque dépense marquée "avance", le montant est ventilé entre les
  // associés concernés proportionnellement à leurs quotes-parts de détention.
  // Le payeur est toujours inclus dans le dénominateur pour normaliser.
  // Ex COBE : MM(40%)+Pilatine(20%) → Pilatine doit 21600×20/60 = 7200 €
  // Ex COBE tous : 21600×20/100 = 4320 € par associé à 20%
  var ccDetails=[]; // {creancier, debiteur, montant, studio, societe, desc, date, depTTC}

  allIds.forEach(function(id){
    var deps=S.depenses[id]||[];
    var sName=S.studios[id]?S.studios[id].name:id;
    var sSociete=S.studios[id]?S.studios[id].societe:'';
    var owners=OWNERSHIP_MAP[sSociete]||[];
    deps.forEach(function(d){
      if(!d.avance||!d.engage_par)return;
      var montantTotal=num(d.ttc);
      if(montantTotal<=0)return;
      var payeur=d.engage_par;
      // Déterminer les autres associés concernés (hors payeur)
      var concernes=d.avance_concernes&&d.avance_concernes.length>0?d.avance_concernes:owners.filter(function(o){return o.nom!==payeur;}).map(function(o){return o.nom;});
      // Calculer totalPct : somme des % du payeur + des concernés
      var totalPct=0;
      owners.forEach(function(o){
        if(o.nom===payeur||concernes.indexOf(o.nom)>=0)totalPct+=o.pct;
      });
      if(totalPct<=0)return;
      // Chaque concerné (hors payeur) doit : montant × son_pct / totalPct
      owners.forEach(function(o){
        if(o.nom===payeur)return;
        if(concernes.indexOf(o.nom)<0)return;
        var share=Math.round(montantTotal*o.pct/totalPct);
        if(share<=0)return;
        ccDetails.push({creancier:payeur,debiteur:o.nom,montant:share,studio:sName,societe:sSociete,desc:d.description||d.categorie,date:d.date||'',depTTC:montantTotal});
      });
    });
  });

  // Agréger par associé
  var ccAssocies={};
  ACTIONNAIRES.forEach(function(a){
    ccAssocies[a.nom]={nom:a.nom,avatarNom:a.avatarNom||a.nom,desc:a.desc,color:a.color,avancePar:0,avancePour:0,solde:0,detailsCreances:[],detailsDettes:[]};
  });
  DEPENSE_CONTRIBUTORS.forEach(function(c){
    if(!ccAssocies[c])ccAssocies[c]={nom:c,avatarNom:c,desc:'',color:'#64748b',avancePar:0,avancePour:0,solde:0,detailsCreances:[],detailsDettes:[]};
  });

  ccDetails.forEach(function(f){
    if(ccAssocies[f.creancier]){
      ccAssocies[f.creancier].avancePar+=f.montant;
      ccAssocies[f.creancier].detailsCreances.push(f);
    }
    if(ccAssocies[f.debiteur]){
      ccAssocies[f.debiteur].avancePour+=f.montant;
      ccAssocies[f.debiteur].detailsDettes.push(f);
    }
  });

  var totalAvances=0;
  var totalCreancesNettes=0;
  var totalDettesNettes=0;
  Object.keys(ccAssocies).forEach(function(k){
    var a=ccAssocies[k];
    a.solde=a.avancePar-a.avancePour;
    if(a.solde>0)totalCreancesNettes+=a.solde;
    if(a.solde<0)totalDettesNettes+=Math.abs(a.solde);
    totalAvances+=a.avancePar;
  });

  var ccActifs=Object.keys(ccAssocies).filter(function(k){
    return ccAssocies[k].avancePar>0||ccAssocies[k].avancePour>0;
  }).map(function(k){return ccAssocies[k];});

  // ── Header gradient vert avec KPIs + barre d'équilibre ──
  h+='<div style="background:linear-gradient(135deg,#0F6E56 0%,#1a9e7a 50%,#22c55e 100%);border-radius:16px;padding:22px 28px;margin-bottom:20px;position:relative;overflow:hidden">';
  h+='<div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.06)"></div>';
  h+='<div style="position:absolute;bottom:-30px;left:30%;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.04)"></div>';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">';
  h+='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
  h+='<span style="font-size:16px;font-weight:700;color:#fff">Comptes courants d\'associ\u00e9s</span></div>';
  h+='<div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:14px">Qui doit quoi \u00e0 qui ? R\u00e9partition automatique selon les quotes-parts de d\u00e9tention</div>';
  // KPIs
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">';
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:10px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Total avanc\u00e9</div><div style="font-size:22px;font-weight:800;color:#fff">'+fmt(totalAvances)+'</div></div>';
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:10px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Cr\u00e9ances</div><div style="font-size:22px;font-weight:800;color:#d1fae5">'+fmt(totalCreancesNettes)+'</div></div>';
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:10px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Dettes</div><div style="font-size:22px;font-weight:800;color:#fef3c7">'+fmt(totalDettesNettes)+'</div></div>';
  h+='</div>';
  // Barre d'équilibre créanciers/débiteurs
  if(totalCreancesNettes>0||totalDettesNettes>0){
    var barTotal=totalCreancesNettes+totalDettesNettes;
    var pctCreances=Math.round(totalCreancesNettes/barTotal*100);
    h+='<div style="margin-top:4px">';
    h+='<div style="display:flex;justify-content:space-between;font-size:9px;color:rgba(255,255,255,0.6);margin-bottom:4px"><span>Cr\u00e9anciers</span><span>D\u00e9biteurs</span></div>';
    h+='<div style="height:8px;border-radius:4px;background:rgba(255,255,255,0.1);overflow:hidden;display:flex">';
    h+='<div style="width:'+pctCreances+'%;background:#d1fae5;border-radius:4px 0 0 4px;transition:width .3s"></div>';
    h+='<div style="width:'+(100-pctCreances)+'%;background:#fbbf24;border-radius:0 4px 4px 0;transition:width .3s"></div>';
    h+='</div></div>';
  }
  h+='</div>';

  if(ccActifs.length===0){
    h+='<div class="box" style="text-align:center;padding:2rem;color:#aaa;font-size:13px">Aucune avance inter-associ\u00e9s enregistr\u00e9e.<br><span style="font-size:11px">Pour enregistrer une avance, cochez \u00ab R\u00e9partir entre associ\u00e9s \u00bb lors de la saisie d\'une d\u00e9pense.</span></div>';
  } else {

    // ═══ SECTION 1 : Tableau de flux — Qui doit quoi à qui ? ═══
    h+='<div style="background:'+cardBg+';border:1px solid '+borderC+';border-radius:14px;overflow:hidden;margin-bottom:20px">';
    h+='<div style="padding:16px 20px;border-bottom:1px solid '+borderC+';display:flex;align-items:center;gap:8px">';
    h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/></svg>';
    h+='<span style="font-size:14px;font-weight:700;color:'+txtMain+'">Flux de dettes</span>';
    h+='<span style="font-size:11px;color:'+txtSub+';margin-left:4px">'+ccDetails.length+' op\u00e9ration(s)</span>';
    h+='</div>';

    // Trouver le max montant pour proportionnalité des barres
    var maxFlux=Math.max.apply(null,ccDetails.map(function(f){return f.montant;}));

    ccDetails.forEach(function(f,idx){
      var pctBar=maxFlux>0?Math.max(10,Math.round(f.montant/maxFlux*100)):50;
      // Trouver couleur et avatarNom pour débiteur et créancier
      var debInfo=ccAssocies[f.debiteur]||{};
      var creInfo=ccAssocies[f.creancier]||{};

      h+='<div style="padding:14px 20px;border-bottom:'+(idx<ccDetails.length-1?'1px solid '+borderC:'none')+';transition:background .15s" onmouseover="this.style.background=\''+(dm?'#1c2128':'#f8f9fb')+'\'" onmouseout="this.style.background=\'transparent\'">';

      // Ligne principale : débiteur → montant → créancier
      h+='<div style="display:flex;align-items:center;gap:12px">';

      // Débiteur (à gauche)
      h+='<div style="display:flex;align-items:center;gap:8px;min-width:130px">';
      h+=avatarHTML(debInfo.avatarNom||f.debiteur,32);
      h+='<div><div style="font-size:12px;font-weight:600;color:'+txtMain+'">'+f.debiteur+'</div>';
      h+='<div style="font-size:9px;color:#B45309;font-weight:500">doit</div></div>';
      h+='</div>';

      // Flèche + montant (centre)
      h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;position:relative">';
      h+='<div style="font-size:15px;font-weight:800;color:'+txtMain+'">'+fmt(f.montant)+'</div>';
      // Barre animée
      h+='<div style="width:100%;height:4px;background:'+(dm?'#21262d':'#f0f0ea')+';border-radius:2px;position:relative;overflow:hidden">';
      h+='<div style="position:absolute;left:0;top:0;height:100%;width:'+pctBar+'%;background:linear-gradient(90deg,#B45309,#0F6E56);border-radius:2px"></div>';
      h+='</div>';
      // Flèche
      h+='<svg width="20" height="10" viewBox="0 0 20 10" style="color:'+txtSub+'"><path d="M0 5h16M13 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
      h+='</div>';

      // Créancier (à droite)
      h+='<div style="display:flex;align-items:center;gap:8px;min-width:130px;justify-content:flex-end">';
      h+='<div style="text-align:right"><div style="font-size:12px;font-weight:600;color:'+txtMain+'">'+f.creancier+'</div>';
      h+='<div style="font-size:9px;color:#0F6E56;font-weight:500">cr\u00e9ancier</div></div>';
      h+=avatarHTML(creInfo.avatarNom||f.creancier,32);
      h+='</div>';

      h+='</div>';

      // Sous-texte : description + société + studio
      h+='<div style="text-align:center;margin-top:4px;font-size:10px;color:'+txtSub+'">';
      h+=(f.desc||'')+' \u00b7 '+f.societe+' \u2014 '+f.studio;
      if(f.date)h+=' \u00b7 '+f.date;
      h+='</div>';

      h+='</div>';
    });
    h+='</div>';

    // ═══ SECTION 2 : Soldes nets par associé (barres horizontales) ═══
    h+='<div style="background:'+cardBg+';border:1px solid '+borderC+';border-radius:14px;overflow:hidden">';
    h+='<div style="padding:16px 20px;border-bottom:1px solid '+borderC+';display:flex;align-items:center;gap:8px">';
    h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>';
    h+='<span style="font-size:14px;font-weight:700;color:'+txtMain+'">Soldes nets par associ\u00e9</span>';
    h+='</div>';

    // Trier : créanciers d'abord (solde décroissant), puis débiteurs
    var ccSorted=ccActifs.slice().sort(function(a,b){return b.solde-a.solde;});
    var maxSolde=Math.max.apply(null,ccSorted.map(function(a){return Math.abs(a.solde);}));

    ccSorted.forEach(function(a,idx){
      var soldeColor=a.solde>0?'#0F6E56':a.solde<0?'#B45309':'#64748b';
      var soldeLabel=a.solde>0?'Cr\u00e9ancier':a.solde<0?'D\u00e9biteur':'\u00c9quilibr\u00e9';
      var soldeBg=a.solde>0?(dm?'#052e16':'#d1fae5'):a.solde<0?(dm?'#451a03':'#fef3c7'):(dm?'#21262d':'#f0f0ea');
      var barPct=maxSolde>0?Math.max(5,Math.round(Math.abs(a.solde)/maxSolde*100)):0;
      var expanded=S.engExpanded['cc_'+a.nom];

      h+='<div style="border-bottom:'+(idx<ccSorted.length-1?'1px solid '+borderC:'none')+'">';

      // Ligne principale cliquable
      h+='<div onclick="toggleEngExpand(\'cc_'+a.nom+'\')" style="padding:14px 20px;cursor:pointer;transition:background .15s" onmouseover="this.style.background=\''+(dm?'#1c2128':'#f8f9fb')+'\'" onmouseout="this.style.background=\'transparent\'">';
      h+='<div style="display:flex;align-items:center;gap:12px">';

      // Avatar + nom
      h+=avatarHTML(a.avatarNom,36);
      h+='<div style="min-width:120px"><div style="font-size:13px;font-weight:600;color:'+txtMain+'">'+a.nom+'</div>';
      h+='<div style="font-size:10px;color:'+txtSub+'">'+a.desc+'</div></div>';

      // Barre de solde (centrée sur zéro)
      h+='<div style="flex:1;display:flex;align-items:center;gap:0">';
      if(a.solde<0){
        // Débiteur : barre orange à gauche
        h+='<div style="flex:1;display:flex;justify-content:flex-end"><div style="width:'+barPct+'%;height:10px;background:linear-gradient(90deg,#fbbf2440,#B45309);border-radius:5px;transition:width .3s"></div></div>';
        h+='<div style="width:2px;height:16px;background:'+borderC+';margin:0 4px;flex-shrink:0"></div>';
        h+='<div style="flex:1"></div>';
      } else if(a.solde>0){
        // Créancier : barre verte à droite
        h+='<div style="flex:1"></div>';
        h+='<div style="width:2px;height:16px;background:'+borderC+';margin:0 4px;flex-shrink:0"></div>';
        h+='<div style="flex:1"><div style="width:'+barPct+'%;height:10px;background:linear-gradient(90deg,#0F6E56,#22c55e80);border-radius:5px;transition:width .3s"></div></div>';
      } else {
        h+='<div style="flex:1"></div><div style="width:2px;height:16px;background:'+borderC+';margin:0 4px"></div><div style="flex:1"></div>';
      }
      h+='</div>';

      // Montant + badge
      h+='<div style="text-align:right;min-width:110px">';
      h+='<div style="font-size:16px;font-weight:800;color:'+soldeColor+'">'+fmt(Math.abs(a.solde))+'</div>';
      h+='<span style="background:'+soldeBg+';color:'+soldeColor+';padding:2px 8px;border-radius:4px;font-size:9px;font-weight:600">'+soldeLabel+'</span>';
      h+='</div>';

      // Chevron
      h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+txtSub+'" stroke-width="2" style="transform:rotate('+(expanded?'180':'0')+'deg);transition:transform .2s;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>';

      h+='</div></div>';

      // Détail accordion
      if(expanded){
        h+='<div style="padding:0 20px 14px;background:'+(dm?'#0d1117':'#fafbfc')+'">';
        h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">';
        h+='<div style="text-align:center;padding:6px;background:'+(dm?'#21262d':'#f0f0ea')+';border-radius:8px"><div style="font-size:9px;color:'+txtSub+'">Avanc\u00e9 par lui</div><div style="font-size:13px;font-weight:700;color:#0F6E56">'+fmt(a.avancePar)+'</div></div>';
        h+='<div style="text-align:center;padding:6px;background:'+(dm?'#21262d':'#f0f0ea')+';border-radius:8px"><div style="font-size:9px;color:'+txtSub+'">Avanc\u00e9 pour lui</div><div style="font-size:13px;font-weight:700;color:#B45309">'+fmt(a.avancePour)+'</div></div>';
        h+='<div style="text-align:center;padding:6px;background:'+soldeBg+';border-radius:8px"><div style="font-size:9px;color:'+txtSub+'">Solde net</div><div style="font-size:13px;font-weight:700;color:'+soldeColor+'">'+fmt(Math.abs(a.solde))+'</div></div>';
        h+='</div>';
        if(a.detailsCreances.length>0){
          h+='<div style="font-size:10px;font-weight:600;color:#0F6E56;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Avances effectu\u00e9es</div>';
          a.detailsCreances.forEach(function(f){
            h+='<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11px">';
            h+='<span style="color:#0F6E56;font-size:12px">\u2191</span>';
            h+='<span style="font-weight:600;color:'+txtMain+'">'+fmt(f.montant)+'</span> <span style="color:'+txtSub+'">pour</span> <span style="font-weight:500;color:'+txtMain+'">'+f.debiteur+'</span>';
            h+='<span style="margin-left:auto;font-size:10px;color:'+txtSub+'">'+f.societe+' \u2014 '+f.studio+'</span>';
            h+='</div>';
          });
        }
        if(a.detailsDettes.length>0){
          h+='<div style="font-size:10px;font-weight:600;color:#B45309;text-transform:uppercase;letter-spacing:0.5px;margin:'+(a.detailsCreances.length>0?'8px':'0')+' 0 4px">Dettes</div>';
          a.detailsDettes.forEach(function(f){
            h+='<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11px">';
            h+='<span style="color:#B45309;font-size:12px">\u2193</span>';
            h+='<span style="font-weight:600;color:'+txtMain+'">'+fmt(f.montant)+'</span> <span style="color:'+txtSub+'">de</span> <span style="font-weight:500;color:'+txtMain+'">'+f.creancier+'</span>';
            h+='<span style="margin-left:auto;font-size:10px;color:'+txtSub+'">'+f.societe+' \u2014 '+f.studio+'</span>';
            h+='</div>';
          });
        }
        h+='</div>';
      }
      h+='</div>';
    });
    h+='</div>';
  }

  } // fin volet comptescourants

  return h;
}

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
  h+='<div style="position:relative;border-radius:20px;overflow:hidden;margin-bottom:20px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 40%,#334155 100%);padding:32px 36px;color:#fff">';
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
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:20px">';
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
    h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px">';
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

  h+='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:22px">';
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

function renderCard(id,s){
  var dir=getStudioDirector(s);
  var dirSection='';
  if(dir){
    dirSection='<div style="display:flex;align-items:center;gap:9px;margin-top:12px;padding-top:10px;border-top:1px solid #f0f0ea">'
      +'<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;flex-shrink:0;background:'+_aC(dir.nom)+';border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.13)">'
      +'<img src="'+dir.photo+'" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block" onerror="this.style.display=\'none\'">'
      +'</div>'
      +'<div><div style="font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Dir. opérationnel</div>'
      +'<div style="font-size:12px;font-weight:600;color:#333">'+dir.nom+'</div></div>'
      +'</div>';
  }
  // Progress ring — % d'étapes workflow complétées
  var _stSrc=(typeof getStudioSteps==='function')?getStudioSteps(id):STEPS;
  var _doneCount=_stSrc.filter(function(st){return s.steps&&s.steps[st.id];}).length;
  var _pctWf=Math.round(_doneCount/_stSrc.length*100);
  var _ringColor=_pctWf>=100?'#1D9E75':_pctWf>=50?'#1a3a6b':'#FBBF24';
  var _ringHtml=(typeof progressRingSVG==='function')?progressRingSVG(_pctWf,56,_ringColor):progBar(s.steps,id);

  return '<div class="card" onclick="openDetail(\''+id+'\')">'+
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:10px">'+
      '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:14px">'+s.name+'</div><div style="font-size:12px;color:#888;margin-top:2px">'+s.societe+'</div></div>'+
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">'+badge(s.statut)+'<span style="background:#f0f4ff;color:#1a3a6b;font-size:9px;font-weight:600;padding:2px 6px;border-radius:8px">C'+(s.cohorte||1)+'</span></div>'+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:10px">'+
      _ringHtml+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Workflow</div>'+
        '<div style="font-size:12px;color:#555;font-weight:600">'+_doneCount+'/'+_stSrc.length+' étapes</div>'+
        '<div style="font-size:11px;color:#888;margin-top:3px">Ouv. <strong>'+s.ouverture+'</strong></div>'+
      '</div>'+
    '</div>'+
    dirSection+
    '</div>';
}

// ── Activité récente — 2 colonnes : Tâches | Chat ──────────────
function renderActivityFeed(ids){
  // ── 1. Collecter toutes les tâches actives (non done) ──
  var allTasks=[];
  var today=new Date().toISOString().slice(0,10);
  ids.forEach(function(id){
    (S.todos[id]||[]).forEach(function(t){
      if(t.statut==='done')return;
      var overdue=t.deadline&&t.deadline<today;
      var soon=t.deadline&&!overdue&&t.deadline<=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
      allTasks.push({studioId:id,studioName:S.studios[id].name,task:t,overdue:overdue,soon:soon});
    });
  });
  var taskOrder={doing:0,vu:1,todo:2};
  allTasks.sort(function(a,b){
    var oa=taskOrder[a.task.statut]!=null?taskOrder[a.task.statut]:2;
    var ob=taskOrder[b.task.statut]!=null?taskOrder[b.task.statut]:2;
    if(oa!==ob)return oa-ob;
    if(a.task.deadline&&b.task.deadline)return a.task.deadline.localeCompare(b.task.deadline);
    if(a.task.deadline)return -1;if(b.task.deadline)return 1;
    return (b.task.ts||'').localeCompare(a.task.ts||'');
  });
  allTasks=allTasks.slice(0,6);

  // ── 2. Chat commun — derniers messages ──
  var chatMsgs=(S.globalChat||[]).slice(-5).reverse();

  var h='<div class="activity-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">';

  // ═══ Bloc 1 : Tâches actives ═══
  h+='<div style="background:'+(S.darkMode?'#161b22':'#fff')+';border:0.5px solid '+(S.darkMode?'#30363d':'#e0e0d8')+';border-radius:12px;padding:16px 18px;min-height:80px">';
  h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">';
  h+='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
  h+='<span style="font-size:12px;font-weight:700;color:#1a1a1a">Tâches actives</span>';
  if(allTasks.length)h+='<span style="background:#DBEAFE;color:#1D4ED8;font-size:9px;font-weight:700;border-radius:8px;padding:1px 6px;min-width:14px;text-align:center">'+allTasks.length+'</span>';
  h+='</div>';
  if(!allTasks.length){
    h+=(typeof emptyState==='function')?emptyState('tasks','Aucune tâche en cours','Tout est sous contrôle.'):'<div style="font-size:11px;color:#bbb;text-align:center;padding:12px 0">Aucune tâche en cours</div>';
  } else {
    allTasks.forEach(function(item){
      var t=item.task;
      var st=TACHE_STATUTS[t.statut]||TACHE_STATUTS.todo;
      h+='<div onclick="openDetail(\''+item.studioId+'\');setTimeout(function(){setDetailTab(\'echanges\')},50)" style="display:flex;gap:9px;padding:7px 0;border-bottom:1px solid '+(S.darkMode?'#30363d':'#f5f5f0')+';cursor:pointer;transition:background 0.1s" onmouseover="this.style.background=S.darkMode?\'#1c2128\':\'#f8f9fb\'" onmouseout="this.style.background=\'transparent\'">';
      // Status icon (clickable to cycle)
      h+='<div onclick="event.stopPropagation();toggleTacheStatut(\''+item.studioId+'\',\''+t.id+'\')" title="Changer le statut" style="width:22px;height:22px;border-radius:50%;border:2px solid '+st.text+';background:'+st.bg+';color:'+st.text+';font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;line-height:1;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s" onmouseover="this.style.transform=\'scale(1.2)\';this.style.boxShadow=\'0 0 0 3px '+st.text+'22\'" onmouseout="this.style.transform=\'scale(1)\';this.style.boxShadow=\'none\'">'+st.icon+'</div>';
      h+='<div style="min-width:0;flex:1">';
      // Titre + badge statut
      h+='<div style="display:flex;align-items:center;gap:6px"><span style="font-size:11px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;flex:1">'+t.titre+'</span>';
      h+='<span onclick="event.stopPropagation();toggleTacheStatut(\''+item.studioId+'\',\''+t.id+'\')" title="Changer le statut" style="font-size:8px;font-weight:600;padding:1px 5px;border-radius:4px;background:'+st.bg+';color:'+st.text+';white-space:nowrap;flex-shrink:0;cursor:pointer;transition:opacity 0.15s" onmouseover="this.style.opacity=\'0.7\'" onmouseout="this.style.opacity=\'1\'">'+st.label+'</span></div>';
      // Description
      if(t.description)h+='<div style="font-size:10px;color:#888;margin-top:2px;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">'+t.description+'</div>';
      // Responsable + deadline + studio
      var _dR3=t.responsable||t.auteur||'';
      h+='<div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap">';
      if(_dR3){
        h+='<div style="display:flex;align-items:center;gap:3px">'+avatarHTML(_dR3,16);
        h+='<span style="font-size:10px;color:#555;font-weight:500">'+_dR3+'</span></div>';
      }
      if(t.deadline){
        var dlabel=new Date(t.deadline+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
        var dStyle=item.overdue?'color:#991B1B;font-weight:600':item.soon?'color:#854F0B;font-weight:600':'color:#888';
        h+='<span style="font-size:9px;'+dStyle+';display:flex;align-items:center;gap:2px"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'+dlabel+'</span>';
      }
      h+='</div>';
      // Studio name
      h+='<div style="font-size:10px;color:#3B6FB6;margin-top:2px;display:flex;align-items:center;gap:3px"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'+item.studioName+'</div>';
      h+='</div></div>';
    });
  }
  h+='</div>';

  // ═══ Bloc 2 : Chat commun ═══
  h+='<div style="background:'+(S.darkMode?'#161b22':'#fff')+';border:0.5px solid '+(S.darkMode?'#30363d':'#e0e0d8')+';border-radius:12px;padding:16px 18px;min-height:80px;display:flex;flex-direction:column">';
  h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">';
  h+='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f1f3d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  h+='<span style="font-size:12px;font-weight:700;color:#1a1a1a">Chat commun</span>';
  if(chatMsgs.length)h+='<span style="background:#e8ecf4;color:#0f1f3d;font-size:9px;font-weight:700;border-radius:8px;padding:1px 6px;min-width:14px;text-align:center">'+(S.globalChat||[]).length+'</span>';
  h+='</div>';
  if(!chatMsgs.length){
    h+='<div style="font-size:11px;color:#bbb;text-align:center;padding:12px 0;flex:1;display:flex;align-items:center;justify-content:center">Aucun message</div>';
  } else {
    h+='<div style="flex:1">';
    chatMsgs.forEach(function(m){
      var me=(S.profile&&S.profile.nom)||'';
      h+='<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid #f5f5f0">';
      h+=avatarHTML(m.auteur||'?',22);
      h+='<div style="min-width:0;flex:1">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:10px;font-weight:600;color:#333">'+((m.auteur||'').split(' ')[0])+'</span><span style="font-size:9px;color:#ccc">'+(m.date||'')+'</span></div>';
      h+='<div style="font-size:11px;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">'+htmlEscape((m.texte||'').substring(0,50))+(m.texte&&m.texte.length>50?'…':'')+'</div>';
      h+='</div></div>';
    });
    h+='</div>';
  }
  h+='<button onclick="toggleChat()" style="margin-top:10px;width:100%;padding:6px;background:'+(S.darkMode?'#21262d':'#f0f2f8')+';color:'+(S.darkMode?'#e6edf3':'#0f1f3d')+';border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;transition:background 0.15s" onmouseover="this.style.background=S.darkMode?\'#30363d\':\'#e2e6f0\'" onmouseout="this.style.background=S.darkMode?\'#21262d\':\'#f0f2f8\'">Ouvrir le chat</button>';
  h+='</div>';
  h+='</div>';
  return h;
}

// ── Vue toggle (grid/cohorte/list) ──────────────────────────────────────────
function renderViewToggle(){
  var views=[
    {id:'grid',label:'Grille',svg:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>'},
    {id:'cohorte',label:'Cohortes',svg:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'},
    {id:'list',label:'Liste',svg:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="20" y2="14"/><line x1="4" y1="18" x2="20" y2="18"/></svg>'}
  ];
  var h='<div style="display:flex;background:#f0f0ea;border-radius:8px;padding:2px;gap:1px">';
  views.forEach(function(v){
    var active=S.dashView===v.id;
    h+='<button onclick="setDashView(\''+v.id+'\')" title="'+v.label+'" style="display:flex;align-items:center;gap:4px;padding:5px 10px;border:none;border-radius:6px;font-size:11px;font-weight:'+(active?'600':'400')+';cursor:pointer;transition:all 0.15s;background:'+(active?'#fff':'transparent')+';color:'+(active?'#1a1a1a':'#888')+';box-shadow:'+(active?'0 1px 3px rgba(0,0,0,0.08)':'none')+'">'+v.svg+'<span>'+v.label+'</span></button>';
  });
  h+='</div>';
  return h;
}

// ── Filtres statut ──────────────────────────────────────────────────────────
function renderStatusFilters(ids){
  var counts={all:ids.length};
  Object.keys(STATUT_CFG).forEach(function(k){counts[k]=0;});
  ids.forEach(function(id){var st=S.studios[id]&&S.studios[id].statut;if(st&&counts[st]!==undefined)counts[st]++;});
  var filters=[{id:'all',label:'Tous'}];
  Object.keys(STATUT_CFG).forEach(function(k){if(counts[k]>0)filters.push({id:k,label:STATUT_CFG[k].label});});
  var h='<div style="display:flex;gap:5px;flex-wrap:wrap">';
  filters.forEach(function(f){
    var active=S.dashFilter===f.id;
    var cfg=STATUT_CFG[f.id];
    h+='<button onclick="setDashFilter(\''+f.id+'\')" style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:'+(active?'600':'400')+';cursor:pointer;transition:all 0.15s;border:1px solid '+(active?(cfg?cfg.text:'#1a3a6b'):'#e0e0da')+';background:'+(active?(cfg?cfg.bg:'#f0f4ff'):'transparent')+';color:'+(active?(cfg?cfg.text:'#1a3a6b'):'#888')+'">'+f.label+' <span style="font-size:10px;opacity:0.7">'+counts[f.id]+'</span></button>';
  });
  h+='</div>';
  return h;
}

function setDashView(v){S.dashView=v;render();}
function setDashFilter(f){S.dashFilter=f;render();}

// ── Vue Cohorte ─────────────────────────────────────────────────────────────
function renderCohorteView(ids){
  // Group studios by cohorte value
  var groups={};
  ids.forEach(function(id){
    var c=(S.studios[id]&&S.studios[id].cohorte)||1;
    if(!groups[c])groups[c]=[];
    groups[c].push(id);
  });
  var cohortNums=Object.keys(groups).map(Number).sort();
  var h='';
  cohortNums.forEach(function(cn){
    var cIds=groups[cn];
    // Compute cohort-level stats
    var totalCapex=cIds.reduce(function(s,id){return s+S.studios[id].capex;},0);
    var totalCA=cIds.reduce(function(s,id){return s+(S.studios[id].forecast&&S.studios[id].forecast.annualCA||0);},0);
    var avgProgress=Math.round(cIds.reduce(function(s,id){
      var _ST=getStudioSteps(id);
      var done=_ST.filter(function(st){return S.studios[id].steps[st.id];}).length;
      return s+(done/_ST.length*100);
    },0)/cIds.length);

    h+='<div style="background:#fff;border:0.5px solid #e0e0d8;border-radius:12px;padding:18px 20px;margin-bottom:14px">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">';
    h+='<div style="display:flex;align-items:center;gap:10px"><span style="font-size:14px;font-weight:700;color:#1a1a1a">Cohorte '+cn+'</span><span style="font-size:11px;color:#888;background:#f0f0ea;padding:2px 8px;border-radius:10px">'+cIds.length+' studio'+(cIds.length>1?'s':'')+'</span></div>';
    h+='<div style="display:flex;gap:14px;font-size:11px;color:#888"><span>CAPEX '+fmt(totalCapex)+'</span><span>CA BP '+fmt(totalCA)+'</span><span>Avancement '+avgProgress+'%</span></div>';
    h+='</div>';
    h+='<div class="cards">';
    cIds.forEach(function(id){h+=renderCard(id,S.studios[id]);});
    h+='</div></div>';
  });
  if(!cohortNums.length)h+='<div style="text-align:center;color:#bbb;padding:30px;font-size:13px">Aucun studio dans cette vue</div>';
  return h;
}

// ── Vue Liste ───────────────────────────────────────────────────────────────
function renderListView(ids){
  var h='<div style="background:#fff;border:0.5px solid #e0e0d8;border-radius:12px;overflow:hidden">';
  h+='<table style="width:100%;border-collapse:collapse;font-size:12px">';
  h+='<thead><tr style="background:#f8f8f4;border-bottom:1px solid #e0e0d8">';
  h+='<th style="text-align:left;padding:10px 14px;font-weight:600;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Studio</th>';
  h+='<th style="text-align:left;padding:10px 14px;font-weight:600;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Société</th>';
  h+='<th style="text-align:left;padding:10px 14px;font-weight:600;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Statut</th>';
  h+='<th style="text-align:left;padding:10px 14px;font-weight:600;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Cohorte</th>';
  h+='<th style="text-align:left;padding:10px 14px;font-weight:600;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Ouverture</th>';
  h+='<th style="text-align:left;padding:10px 14px;font-weight:600;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">CAPEX</th>';
  h+='<th style="text-align:left;padding:10px 14px;font-weight:600;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Avancement</th>';
  h+='</tr></thead><tbody>';
  ids.forEach(function(id){
    var s=S.studios[id];
    if(!s)return;
    var _ST2=getStudioSteps(id);
    var done=_ST2.filter(function(st){return s.steps&&s.steps[st.id];}).length;
    var p=Math.round(done/_ST2.length*100);
    h+='<tr onclick="openDetail(\''+id+'\')" style="border-bottom:1px solid #f0f0ea;cursor:pointer;transition:background 0.1s" onmouseover="this.style.background=S.darkMode?\'#1c2128\':\'#fafaf6\'" onmouseout="this.style.background=\'transparent\'">';
    h+='<td style="padding:10px 14px;font-weight:600;color:#1a1a1a">'+s.name+'</td>';
    h+='<td style="padding:10px 14px;color:#666">'+s.societe+'</td>';
    h+='<td style="padding:10px 14px">'+badge(s.statut)+'</td>';
    h+='<td style="padding:10px 14px"><span style="background:#f0f4ff;color:#1a3a6b;font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px">C'+(s.cohorte||1)+'</span></td>';
    h+='<td style="padding:10px 14px;color:#666">'+s.ouverture+'</td>';
    h+='<td style="padding:10px 14px;font-weight:500">'+fmt(s.capex)+'</td>';
    h+='<td style="padding:10px 14px"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;background:#e8e8e0;border-radius:4px;height:5px;min-width:60px"><div style="width:'+p+'%;background:#1D9E75;border-radius:4px;height:5px"></div></div><span style="font-size:10px;color:#888;white-space:nowrap">'+p+'%</span></div></td>';
    h+='</tr>';
  });
  h+='</tbody></table></div>';
  return h;
}

function renderDetail(){
  var s=S.studios[S.selectedId];
  if(!s)return '';
  var isAdmin=!!S.profile&&!isViewer();
  var tabs=[['workflow','Workflow'],['adherents','Adhérents & Prévisionnels'],['forecast','Business plan'],['engagements','Engagements'],['echanges','Questions & Tâches'],['localisation','Localisation'],['local','Local'],['fichiers','Fichiers'],['ia','IA']];
  // Filtrage onglets pour viewers avec permissions granulaires
  if(isViewer()&&S.user&&S.adminSettings&&S.adminSettings.viewerPerms&&S.adminSettings.viewerPerms[S.user.id]){
    var _allowedTabs=S.adminSettings.viewerPerms[S.user.id].tabs||[];
    if(_allowedTabs.length>0){
      tabs=tabs.filter(function(t){return _allowedTabs.indexOf(t[0])>=0;});
      // Si l'onglet courant n'est pas autorisé, basculer sur le premier disponible
      var _tabIds=tabs.map(function(t){return t[0];});
      if(_tabIds.indexOf(S.detailTab)<0&&tabs.length>0)S.detailTab=tabs[0][0];
    }
  }
  var content='';
  if(S.detailTab==='workflow')content=renderWorkflow(s);
  else if(S.detailTab==='adherents')content=renderAdherents(S.selectedId,s);
  else if(S.detailTab==='forecast')content=renderForecast(S.selectedId,s);
  else if(S.detailTab==='engagements')content=renderEngagements(S.selectedId,s);
  else if(S.detailTab==='echanges')content=renderEchanges(S.selectedId);
  else if(S.detailTab==='localisation')content=renderLocalisation(s);
  else if(S.detailTab==='local')content=renderLocal(S.selectedId,s);
  else if(S.detailTab==='fichiers')content=renderFichiers(S.selectedId);
  else if(S.detailTab==='ia')content=renderAI(s);
  var h='';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">';
  h+='<nav class="breadcrumb" aria-label="Fil d\'Ariane">';
  h+='<button class="bc-item" onclick="setPage(\'accueil\')" style="animation-delay:.05s">Accueil</button>';
  h+='<span class="bc-chevron" style="animation-delay:.1s">›</span>';
  h+='<button class="bc-item" onclick="retourProjets()" style="animation-delay:.15s">Studios</button>';
  h+='<span class="bc-chevron" style="animation-delay:.2s">›</span>';
  h+='<span class="bc-item current" style="animation-delay:.25s">'+s.name+'</span>';
  h+='</nav>';
  h+='<div style="display:flex;align-items:center;gap:8px">';
  h+=renderSearchBar();
  h+=userAvatarWidget(S.profile);
  h+='</div>';
  h+='</div>';
  if(isViewer())h+='<div style="display:inline-flex;align-items:center;gap:5px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:6px;padding:4px 10px;font-size:11px;color:#1D4ED8;font-weight:600;margin-bottom:10px">👁 Mode lecture seule — consultation uniquement</div>';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><span style="font-size:18px;font-weight:600">'+s.name+'</span>'+badge(s.statut);
  if(isAdmin)h+='<select onchange="setStudioCohorte(\''+S.selectedId+'\',parseInt(this.value))" style="font-size:10px;font-weight:600;padding:2px 6px;border-radius:8px;border:1px solid #dde;background:#f0f4ff;color:#1a3a6b;cursor:pointer">';
  if(isAdmin)for(var ci=1;ci<=10;ci++)h+='<option value="'+ci+'"'+((s.cohorte||1)===ci?' selected':'')+'>Cohorte '+ci+'</option>';
  if(isAdmin)h+='</select>';
  if(!isAdmin)h+='<span style="background:#f0f4ff;color:#1a3a6b;font-size:10px;font-weight:600;padding:2px 8px;border-radius:8px">C'+(s.cohorte||1)+'</span>';
  h+='</div>';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">';
  h+='<div style="font-size:13px;color:#888"><a href="javascript:void(0)" onclick="setDetailTab(\'localisation\')" style="color:#888;text-decoration:none;border-bottom:1px dashed #ccc;cursor:pointer;transition:color 0.15s,border-color 0.15s" onmouseover="this.style.color=\'#1a3a6b\';this.style.borderColor=\'#1a3a6b\'" onmouseout="this.style.color=\'#888\';this.style.borderColor=\'#ccc\'">'+s.addr+'</a> &middot; '+s.societe+' &middot; '+s.ouverture+'</div>';
  h+='<div style="position:relative;display:inline-block">';
  h+='<button onclick="toggleExportMenu(event)" style="background:#1a3a6b;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;white-space:nowrap;transition:background .15s" onmouseover="this.style.background=\'#254d8a\'" onmouseout="this.style.background=\'#1a3a6b\'">&#128196; Exporter <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg></button>';
  h+='<div id="export-menu" style="display:none;position:absolute;right:0;top:100%;margin-top:4px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.15);min-width:220px;z-index:999;overflow:hidden;animation:fadeIn .15s ease">';
  h+='<div style="padding:6px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #f1f5f9">PDF</div>';
  var _sid=S.selectedId;
  var _pdfItems=[
    {l:'Rapport complet',icon:'&#128196;',act:'generateReport(\''+_sid+'\')'},
    {l:'Synth\u00e8se financi\u00e8re',icon:'&#128202;',act:'generateReport(\''+_sid+'\',[\'synthese\'])'},
    {l:'BP d\u00e9taill\u00e9',icon:'&#128203;',act:'generateReport(\''+_sid+'\',[\'bp\'])'},
    {l:'CAPEX & Financement',icon:'&#128176;',act:'generateReport(\''+_sid+'\',[\'capex\'])'},
    {l:'Adh\u00e9rents',icon:'&#128101;',act:'generateReport(\''+_sid+'\',[\'adherents\'])'},
    {l:'Localisation',icon:'&#128205;',act:'generateReport(\''+_sid+'\',[\'localisation\'])'}
  ];
  _pdfItems.forEach(function(it){
    h+='<button onclick="'+it.act+';closeExportMenu()" style="display:flex;align-items:center;gap:8px;width:100%;padding:8px 14px;border:none;background:none;cursor:pointer;font-size:11px;font-weight:500;color:#1e293b;text-align:left;transition:background .1s" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'none\'">'+it.icon+' '+it.l+'</button>';
  });
  h+='<div style="height:1px;background:#e2e8f0;margin:2px 0"></div>';
  h+='<div style="padding:6px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Donn\u00e9es</div>';
  h+='<button onclick="exportStudioCSV(\''+_sid+'\');closeExportMenu()" style="display:flex;align-items:center;gap:8px;width:100%;padding:8px 14px;border:none;background:none;cursor:pointer;font-size:11px;font-weight:500;color:#1e293b;text-align:left;transition:background .1s" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'none\'">&#128229; Export CSV</button>';
  h+='<button onclick="exportStudioExcel(\''+_sid+'\');closeExportMenu()" style="display:flex;align-items:center;gap:8px;width:100%;padding:8px 14px;border:none;background:none;cursor:pointer;font-size:11px;font-weight:500;color:#1e293b;text-align:left;transition:background .1s" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'none\'">&#128229; Export Excel</button>';
  h+='</div></div>';
  h+='</div>';
  if(isSuperAdmin()){
    h+='<div style="display:flex;gap:8px;margin-bottom:14px">';
    h+=(s.statut!=='abandonne'?'<button class="btn" style="color:#854F0B" onclick="archiverStudio(\''+S.selectedId+'\')">Archiver</button>':'<button class="btn" style="color:#185FA5" onclick="restaurerStudio(\''+S.selectedId+'\')">Restaurer</button>');
    h+='<button class="btn" style="color:#A32D2D" onclick="supprimerStudio(\''+S.selectedId+'\')">Supprimer</button></div>';
  }
  h+='<div class="tabs">';
  tabs.forEach(function(t){h+='<button class="tab '+(S.detailTab===t[0]?'active':'')+'" onclick="setDetailTab(\''+t[0]+'\')">'+t[1]+'</button>';});
  h+='</div><div class="tab-content-anim" key="tab-'+S.detailTab+'">'+content+'</div>';
  return h;
}

function renderWorkflow(s){
  var canEdit=!!S.profile&&!isViewer();
  var sid=S.selectedId;
  var WF_STEPS=getStudioSteps(sid);
  // Infographie en tête de page
  var h=renderBP3YInfographic(sid,s);
  var _steps=s.steps||{};
  h+='<div class="box" style="margin-top:16px">'+progBar(_steps,sid)+'<div style="margin-top:16px">';
  WF_STEPS.forEach(function(step,i){
    var done=_steps[step.id];
    var unlocked=i===0||_steps[WF_STEPS[i-1].id];
    // Toujours autoriser le toggle si l'étape est déjà cochée (permet de revenir en arrière)
    // ou si elle est débloquée par la séquence
    var canToggle=canEdit&&(done||unlocked);
    var bg=done?'#1D9E75':'transparent';
    var border=done?'#1D9E75':unlocked?'#aaa':'#ddd';
    var cursor=canToggle?'pointer':'default';
    var click=canToggle?'onclick="toggleStep(\''+sid+'\',\''+step.id+'\')">':'>';
    h+='<div style="display:flex;gap:12px;margin-bottom:10px;opacity:'+((!done&&!unlocked)?0.4:1)+';align-items:flex-start">';
    h+='<div style="display:flex;flex-direction:column;align-items:center">';
    h+='<div class="step-dot" style="background:'+bg+';border:2px solid '+border+';color:'+(done?'#fff':'#aaa')+';cursor:'+cursor+'" '+click+(done?'&#10003;':'')+'</div>';
    if(i<WF_STEPS.length-1)h+='<div style="width:2px;flex:1;min-height:14px;background:'+(done?'#1D9E75':'#e0e0d8')+';margin-top:2px"></div>';
    h+='</div><div style="flex:1;padding-bottom:8px"><div style="font-size:13px;font-weight:'+(done?600:400)+'">'+step.label+'</div><div style="font-size:11px;color:#888;margin-top:2px">'+step.desc+'</div></div>';
    if(canEdit)h+='<button onclick="event.stopPropagation();supprimerEtape(\''+sid+'\',\''+step.id+'\')" title="Supprimer cette \u00e9tape" style="background:none;border:none;color:#ccc;font-size:14px;cursor:pointer;padding:2px 6px;border-radius:4px;transition:color .15s,background .15s;flex-shrink:0;margin-top:2px" onmouseenter="this.style.color=\'#A32D2D\';this.style.background=\'#fef2f2\'" onmouseleave="this.style.color=\'#ccc\';this.style.background=\'none\'">\u2715</button>';
    h+='</div>';
  });
  if(canEdit){
    h+='<div style="margin-top:8px;padding-top:8px;border-top:1px dashed #e8e8e0">';
    h+='<button onclick="ajouterEtape(\''+sid+'\')" style="display:flex;align-items:center;gap:6px;background:none;border:1px dashed #ccc;color:#888;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;width:100%" onmouseenter="this.style.borderColor=\'#1D9E75\';this.style.color=\'#1D9E75\';this.style.background=\'#f0fdf4\'" onmouseleave="this.style.borderColor=\'#ccc\';this.style.color=\'#888\';this.style.background=\'none\'"><span style="font-size:16px;line-height:1">+</span> Ajouter une \u00e9tape</button>';
    h+='</div>';
  }
  h+='</div></div>';
  return h;
}

// ── Infographie KPIs prévisionnels 3 ans — onglet Workflow ────────────────────
function renderEngagements(sid,s){
  var deps=S.depenses[sid]||[];
  // Utiliser le détail CAPEX custom si défini (règle ii), sinon valeurs INIT
  var _capexDet=getCapexDetailForStudio(sid);
  var _capexTots=computeCapexTotals(_capexDet);
  var capex=_capexTots.capex||s.capex||333500;
  var leasing=_capexTots.leasing||s.leasing||121600;
  // Emprunt : si CAPEX customisé, on scale à 70% du CAPEX (ratio dossier de référence)
  var _hasCustomCapex=s.capexDetail&&Object.keys(s.capexDetail||{}).length>0;
  var emprunt=_hasCustomCapex?Math.round(capex*0.70):(s.emprunt||230000);
  var fp=capex-emprunt; // Fonds propres = 30% du CAPEX si custom, sinon valeur sauvegardée
  var totalInvest=capex+leasing;
  // Répartition financement CAPEX (barres proportionnelles)
  var pctEmprunt=Math.round(emprunt/capex*100);
  var pctFP=100-pctEmprunt;
  var pctLeasingTotal=Math.round(leasing/totalInvest*100);
  var pctCapexTotal=100-pctLeasingTotal;
  // Suivi dépenses
  var engage=deps.reduce(function(sum,d){return sum+num(d.ttc);},0);
  var debloque=deps.filter(function(d){return d.deblocage==='debloque';}).reduce(function(sum,d){return sum+num(d.ttc);},0);
  var demande=deps.filter(function(d){return d.deblocage==='demande';}).reduce(function(sum,d){return sum+num(d.ttc);},0);
  var pctE=Math.min(100,Math.round(engage/capex*100));
  var pctD=Math.min(100,Math.round(debloque/capex*100));
  var isAdmin=!!S.profile&&!isViewer();
  var h='<div>';

  // ── Panneau : Structure de financement ──────────────────────────────────────
  h+='<div class="box" style="padding:0;overflow:hidden;margin-bottom:14px">';
  // Header blanc uniforme + investissement total mis en valeur
  h+='<div style="background:#f8f9fb;border-bottom:1px solid #e8eaf0;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">';
  h+='<div style="display:flex;align-items:center;gap:10px">';
  h+='<div style="width:3px;height:20px;border-radius:2px;background:#1a3a6b;flex-shrink:0"></div>';
  h+='<div style="font-size:12px;font-weight:700;color:#1a3a6b;letter-spacing:0.2px">Structure de financement</div>';
  h+='</div>';
  h+='<div style="text-align:right">';
  h+='<div style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:600;margin-bottom:2px">Investissement total</div>';
  h+='<div style="font-size:22px;font-weight:800;color:#0f1f3d;letter-spacing:-0.5px">'+fmt(totalInvest)+'</div>';
  h+='</div>';
  h+='</div>';
  h+='<div style="padding:18px 20px">';

  // Barre globale : CAPEX | Leasing
  h+='<div style="margin-bottom:18px">';
  h+='<div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:6px"><span>R&eacute;partition de l\'investissement</span><span>'+fmt(totalInvest)+'</span></div>';
  h+='<div style="display:flex;height:10px;border-radius:6px;overflow:hidden;gap:2px">';
  h+='<div style="width:'+pctCapexTotal+'%;background:#1a3a6b;border-radius:4px 0 0 4px" title="CAPEX '+fmt(capex)+'"></div>';
  h+='<div style="width:'+pctLeasingTotal+'%;background:#d4a017;border-radius:0 4px 4px 0" title="Leasing '+fmt(leasing)+'"></div>';
  h+='</div>';
  h+='<div style="display:flex;gap:16px;margin-top:6px;font-size:10px">';
  h+='<span style="display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:10px;height:10px;background:#1a3a6b;border-radius:2px"></span><b>CAPEX</b> '+fmt(capex)+' ('+pctCapexTotal+'%)</span>';
  h+='<span style="display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:10px;height:10px;background:#d4a017;border-radius:2px"></span><b style="color:#92630a">Leasing &eacute;quipement</b> '+fmt(leasing)+' ('+pctLeasingTotal+'%)</span>';
  h+='</div></div>';

  // 3 blocs : CAPEX detail + Leasing highlight + résumé
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">';

  // Bloc CAPEX (cliquable → détail)
  var capexOpen=!!(S.showCapexDetail&&S.showCapexDetail[sid]);
  h+='<div style="border:1px solid #d0d9ec;border-radius:10px;padding:14px 16px;cursor:pointer;transition:box-shadow .2s,transform .2s,border-color .2s" onclick="toggleCapexDetail(\''+sid+'\')" title="Cliquer pour voir le d\u00e9tail du budget" onmouseenter="this.style.boxShadow=\'0 4px 16px rgba(26,58,107,0.15)\';this.style.transform=\'translateY(-2px)\';this.style.borderColor=\'#1a3a6b\'" onmouseleave="this.style.boxShadow=\'none\';this.style.transform=\'none\';this.style.borderColor=\'#d0d9ec\'">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
  h+='<div style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#1a3a6b;font-weight:700">CAPEX</div>';
  h+='<div style="font-size:10px;color:#1a3a6b;font-weight:600;background:#e8eef8;padding:2px 8px;border-radius:20px">'+(capexOpen?'▲ Réduire':'▼ Détail')+'</div>';
  h+='</div>';
  h+='<div style="font-size:20px;font-weight:700;color:#0f1f3d;letter-spacing:-0.5px;margin-bottom:12px">'+fmt(capex)+'</div>';
  // Mini barre emprunt/FP
  h+='<div style="height:6px;border-radius:4px;overflow:hidden;display:flex;gap:1px;margin-bottom:8px">';
  h+='<div style="width:'+pctEmprunt+'%;background:#1a3a6b"></div>';
  h+='<div style="width:'+pctFP+'%;background:#0F6E56"></div>';
  h+='</div>';
  h+='<div style="font-size:10px;color:#555;display:flex;flex-direction:column;gap:4px">';
  h+='<div style="display:flex;justify-content:space-between"><span style="color:#1a3a6b;font-weight:600">Emprunt bancaire</span><span>'+fmt(emprunt)+'</span></div>';
  h+='<div style="display:flex;justify-content:space-between"><span style="color:#0F6E56;font-weight:600">Fonds propres</span><span>'+fmt(fp)+'</span></div>';
  h+='</div></div>';

  // Bloc Leasing (highlight)
  h+='<div style="border:2px solid #f0c040;border-radius:10px;padding:14px 16px;background:#fffdf0;position:relative">';
  h+='<div style="position:absolute;top:10px;right:10px;background:#f0c040;color:#7a5200;font-size:8px;font-weight:700;padding:2px 7px;border-radius:20px;text-transform:uppercase;letter-spacing:1px">Leasing</div>';
  h+='<div style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#92630a;font-weight:700;margin-bottom:10px">&Eacute;quipement Pilates</div>';
  h+='<div style="font-size:20px;font-weight:700;color:#7a5200;letter-spacing:-0.5px;margin-bottom:8px">'+fmt(leasing)+'</div>';
  h+='<div style="font-size:10px;color:#92630a;line-height:1.5">Pris en cr&eacute;dit-bail &mdash; hors CAPEX.<br>Mensualit&eacute;s s&eacute;par&eacute;es du financement principal.</div>';
  h+='</div>';

  // Bloc résumé
  h+='<div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;background:#f8f9fb">';
  h+='<div style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:700;margin-bottom:10px">R&eacute;sum&eacute;</div>';
  h+='<div style="display:flex;flex-direction:column;gap:7px;font-size:11px">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#555">Investissement total</span><b style="color:#0f1f3d">'+fmt(totalInvest)+'</b></div>';
  h+='<div style="border-top:1px solid #e2e8f0;padding-top:7px;display:flex;justify-content:space-between;align-items:center"><span style="color:#1a3a6b">Emprunt bancaire</span><b>'+fmt(emprunt)+'</b></div>';
  h+='<div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#0F6E56">Fonds propres</span><b>'+fmt(fp)+'</b></div>';
  h+='<div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#92630a">Leasing</span><b>'+fmt(leasing)+'</b></div>';
  // Taux d'intérêt
  var _tauxRawStored=S.studios[sid]&&S.studios[sid].tauxInteret!=null?S.studios[sid].tauxInteret:0;
  // Ignorer les valeurs corrompues (< 1%) et revenir au défaut BP
  var _tauxRaw=(_tauxRawStored>=0.01)?_tauxRawStored:0.0373;
  var _tauxPct=Math.round(_tauxRaw*10000)/100;
  h+='<div style="border-top:1px solid #e2e8f0;padding-top:8px;margin-top:2px">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center">';
  h+='<span style="color:#555;font-size:10.5px">Taux d\'int&eacute;r&ecirc;t</span>';
  if(isAdmin){
    h+='<div style="display:flex;align-items:center;gap:3px">';
    h+='<input type="number" value="'+_tauxPct+'" min="1" max="15" step="0.1" id="eng-taux-input" onchange="saveTauxInteret(\''+sid+'\',+this.value)" style="width:50px;padding:3px 6px;border:1px solid #d0d9ec;border-radius:6px;font-size:12px;font-weight:700;color:#1a3a6b;text-align:right;outline:none;background:#f5f7fd">';
    h+='<span style="font-size:11px;color:#64748b;font-weight:600">%</span>';
    h+='</div>';
  }else{
    h+='<b style="color:#1a3a6b">'+_tauxPct+'%</b>';
  }
  h+='</div>';
  h+='<div style="font-size:9px;color:#94a3b8;margin-top:3px">Impact direct sur charges financières &amp; BP</div>';
  h+='</div>';
  h+='</div></div>';
  h+='</div>';

  // ── Détail CAPEX expandable ──────────────────────────────────────────────────
  if(capexOpen){
    var _capexGross=_capexDet.reduce(function(s,r){return s+(r.montant>0?r.montant:0);},0);
    var _capexNet=_capexTots.capex; // hors leasing, hors remises
    var _capexViewer=isViewer();
    h+='<div style="margin:14px 0 0;border:1px solid #d0d9ec;border-radius:10px;overflow:hidden">';
    h+='<div style="background:#f0f4fa;padding:10px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #d0d9ec;flex-wrap:wrap">';
    h+='<div style="width:3px;height:16px;background:#1a3a6b;border-radius:2px;flex-shrink:0"></div>';
    h+='<div style="font-size:11px;font-weight:700;color:#1a3a6b">Détail du budget CAPEX</div>';
    if(!_capexViewer)h+='<div style="font-size:10px;color:#92630a;margin-left:4px">✎ modifiable</div>';
    h+='<div style="margin-left:auto;font-size:10px;color:#64748b">Hors leasing : <b style="color:#0f1f3d">'+fmt(_capexNet)+'</b> &nbsp;|&nbsp; Leasing : <b style="color:#92630a">'+fmt(_capexTots.leasing)+'</b></div>';
    h+='</div>';
    h+='<div style="padding:4px 0">';
    h+='<table style="width:100%;border-collapse:collapse">';
    h+='<tr style="background:#f8f9fb"><th style="text-align:left;padding:8px 16px;font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.8px">Poste</th>';
    h+='<th style="text-align:right;padding:8px 16px;font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.8px">Montant</th>';
    h+='<th style="text-align:center;padding:8px 16px;font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.8px">Financement</th></tr>';
    _capexDet.forEach(function(row,idx){
      var rowBg=row.remise?'#f0fdf4':row.leasing?'#fffdf0':idx%2===0?'#ffffff':'#fafafa';
      var amtColor=row.remise?'#0F6E56':row.leasing?'#92630a':'#0f1f3d';
      var amtPrefix=row.remise?'− ':'';
      var finBadge='';
      if(row.fin==='Crédit-bail (leasing)') finBadge='<span style="background:#fef3c7;color:#92630a;font-size:9px;font-weight:700;padding:2px 7px;border-radius:12px">Leasing</span>';
      else if(row.fin==='Emprunt bancaire') finBadge='<span style="background:#dbeafe;color:#1a3a6b;font-size:9px;font-weight:700;padding:2px 7px;border-radius:12px">Emprunt</span>';
      else if(row.fin==='Fonds propres') finBadge='<span style="background:#d1fae5;color:#065f46;font-size:9px;font-weight:700;padding:2px 7px;border-radius:12px">Fonds propres</span>';
      else finBadge='<span style="background:#fef3c7;color:#0F6E56;font-size:9px;font-weight:700;padding:2px 7px;border-radius:12px">Remise</span>';
      h+='<tr style="background:'+rowBg+';border-top:1px solid #f0f0f0">';
      h+='<td style="padding:9px 16px;font-size:12px;color:#1a1a2e">'+row.label+(row.leasing?' <span style="font-size:9px;color:#92630a">(leasing)</span>':'')+(row.remise?' <span style="font-size:9px;color:#0F6E56">✓ remise groupe</span>':'')+'</td>';
      if(_capexViewer||row.remise){
        h+='<td style="padding:9px 16px;font-size:12px;font-weight:700;color:'+amtColor+';text-align:right">'+amtPrefix+fmt(Math.abs(row.montant))+'</td>';
      } else {
        h+='<td style="padding:6px 12px;text-align:right">';
        h+='<input type="number" min="0" step="100" value="'+Math.abs(row.montant)+'" '
          +'onchange="saveCapexLine(\''+sid+'\','+idx+','+(row.remise?'-':'')+'+this.value)" '
          +'style="width:100px;padding:3px 7px;border:1px solid #d0d9ec;border-radius:5px;font-size:12px;font-weight:700;color:'+amtColor+';text-align:right;background:'+(row.leasing?'#fffdf0':row.remise?'#f0fdf4':'#fff')+';outline:none">';
        h+='</td>';
      }
      h+='<td style="padding:9px 16px;text-align:center">'+finBadge+'</td>';
      h+='</tr>';
    });
    // Total row
    h+='<tr style="background:#f0f4fa;border-top:2px solid #d0d9ec">';
    h+='<td style="padding:10px 16px;font-size:12px;font-weight:700;color:#0f1f3d">Total CAPEX (hors leasing)</td>';
    h+='<td style="padding:10px 16px;font-size:14px;font-weight:700;color:#1a3a6b;text-align:right">'+fmt(capex)+'</td>';
    h+='<td style="padding:10px 16px;text-align:center"><span style="font-size:10px;color:#64748b">réf. 333 500 €</span></td>';
    h+='</tr>';
    h+='<tr style="background:#fffdf0;border-top:1px solid #e8e0c0">';
    h+='<td style="padding:10px 16px;font-size:12px;font-weight:700;color:#92630a">Total Leasing</td>';
    h+='<td style="padding:10px 16px;font-size:14px;font-weight:700;color:#92630a;text-align:right">'+fmt(leasing)+'</td>';
    h+='<td style="padding:10px 16px;text-align:center"><span style="font-size:10px;color:#64748b">réf. 121 600 €</span></td>';
    h+='</tr>';
    h+='</table></div></div>';
  }
  h+='</div></div>';

  // ── Suivi des dépenses ──────────────────────────────────────────────────────
  h+='<div class="box" style="margin-bottom:14px">';
  h+='<div style="font-size:12px;font-weight:700;color:#1a3a6b;margin-bottom:14px">Suivi des d&eacute;penses CAPEX</div>';
  h+='<div class="kpis" style="margin-bottom:14px">';
  h+='<div class="kpi"><div class="kpi-label">Budget CAPEX</div><div class="kpi-val">'+fmt(capex)+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">Engag&eacute;</div><div class="kpi-val" style="color:#1a3a6b">'+fmt(engage)+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">D&eacute;bloqu&eacute;</div><div class="kpi-val" style="color:#0F6E56">'+fmt(debloque)+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">En attente</div><div class="kpi-val" style="color:#854F0B">'+fmt(demande)+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">Reste</div><div class="kpi-val">'+fmt(Math.max(0,capex-engage))+'</div></div>';
  h+='</div>';
  h+='<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:11px;color:#888;margin-bottom:4px"><span>Engag&eacute; / Budget</span><span style="font-weight:600">'+pctE+'%</span></div><div class="prog-bar"><div style="width:'+pctE+'%;background:#1a3a6b;border-radius:4px;height:6px"></div></div></div>';
  h+='<div><div style="display:flex;justify-content:space-between;font-size:11px;color:#888;margin-bottom:4px"><span>D&eacute;bloqu&eacute; / Budget</span><span style="font-weight:600">'+pctD+'%</span></div><div class="prog-bar"><div style="width:'+pctD+'%;background:#0F6E56;border-radius:4px;height:6px"></div></div></div>';
  // Répartition par mode de financement
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid #f0f0ea">';
  DEPENSE_FINS.forEach(function(f){
    var fe=deps.filter(function(d){return d.financement===f;}).reduce(function(s,d){return s+num(d.ttc);},0);
    var fd=deps.filter(function(d){return d.financement===f&&d.deblocage==='debloque';}).reduce(function(s,d){return s+num(d.ttc);},0);
    var fc=f==='Credit-bail'?'#92630a':f==='Emprunt bancaire'?'#1a3a6b':'#0F6E56';
    h+='<div style="text-align:center;padding:8px;background:#f8f9fb;border-radius:8px">';
    h+='<div style="font-size:10px;color:#64748b;margin-bottom:4px;font-weight:500">'+f+'</div>';
    h+='<div style="font-size:14px;font-weight:700;color:'+fc+'">'+fmt(fe)+'</div>';
    h+='<div style="font-size:10px;color:#0F6E56;margin-top:2px">'+fmt(fd)+' d&eacute;bloqu&eacute;</div>';
    h+='</div>';
  });
  h+='</div></div>';

  if(isAdmin)h+='<div style="display:flex;justify-content:flex-end;margin-bottom:12px"><button class="btn btn-primary" onclick="ouvrirFormDepense(\''+sid+'\')">+ Ajouter une d&eacute;pense</button></div>';
  h+='<div id="form-depense-'+sid+'"></div>';
  if(deps.length===0){
    h+=(typeof emptyState==='function')?('<div class="box" style="padding:10px">'+emptyState('money','Aucune dépense saisie','Ajoutez votre première dépense pour suivre votre budget.')+'</div>'):'<div class="box" style="text-align:center;padding:2rem;color:#aaa;font-size:13px">Aucune d&eacute;pense saisie</div>';
  } else {
    h+='<div style="overflow-x:auto"><table style="min-width:700px">';
    h+='<tr><th style="text-align:left;padding-left:8px">Cat&eacute;gorie</th><th style="text-align:left">Description</th><th>TTC</th><th>Financement</th><th>Par</th><th>Date</th><th>D&eacute;blocage</th><th>Justif</th><th></th></tr>';
    var _currentUser=(S.profile&&S.profile.nom)||'';
    deps.forEach(function(d,i){
      var st=DEBLOCAGE[d.deblocage]||DEBLOCAGE.attente;
      var isLeas=d.financement==='Credit-bail';
      var canEdit=isAdmin||(d.saisi_par&&d.saisi_par===_currentUser);
      h+='<tr'+(isLeas?' style="background:#fffdf0"':'')+'>';
      h+='<td style="padding:8px;font-size:12px;font-weight:500;text-align:left">'+d.categorie+'</td>';
      h+='<td style="padding:8px;font-size:12px;color:#555;text-align:left">'+(d.description||'--')+'</td>';
      h+='<td style="padding:8px;font-size:12px;font-weight:600">'+fmt(num(d.ttc))+'</td>';
      var fbc=isLeas?'background:#fef3c7;color:#92630a':d.financement==='Emprunt bancaire'?'background:#dbeafe;color:#1a3a6b':'background:#d1fae5;color:#065f46';
      h+='<td style="padding:8px"><span style="'+fbc+';padding:2px 7px;border-radius:5px;font-size:10px;font-weight:600">'+d.financement+'</span></td>';
      h+='<td style="padding:8px;font-size:11px">'+(d.engage_par||'--');
      if(d.avance&&d.avance_concernes&&d.avance_concernes.length>0){
        var _concList=d.avance_concernes.filter(function(c){return c!==(d.engage_par||'');});
        if(_concList.length>0)h+='<div style="margin-top:2px"><span style="background:#fef3c7;color:#92630a;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:600" title="'+_concList.join(', ')+'">Avance &rarr; '+(_concList.length===1?_concList[0]:_concList.length+' assoc.')+'</span></div>';
      }
      h+='</td>';
      h+='<td style="padding:8px;font-size:11px;color:#888">'+(d.date||'--')+'</td>';
      h+='<td style="padding:8px"><span style="background:'+st.bg+';color:'+st.color+';padding:2px 7px;border-radius:5px;font-size:11px;cursor:'+(isAdmin?'pointer':'default')+'" '+(isAdmin?'onclick="changerDeblocage(\''+sid+'\','+i+')"':'')+'>'+st.label+'</span>';
      if(d.deblocage==='demande')h+='<div style="font-size:10px;color:#888">'+(d.date_demande||'')+'</div>';
      if(d.deblocage==='debloque')h+='<div style="font-size:10px;color:#0F6E56">'+(d.date_deblocage||'')+'</div>';
      h+='</td>';
      h+='<td style="padding:8px;text-align:center">';
      if(d.fichierUrl)h+='<a href="'+d.fichierUrl+'" target="_blank" style="font-size:11px;color:#1a3a6b;text-decoration:none">doc</a> ';
      if(canEdit)h+='<label style="cursor:pointer;font-size:13px">+<input type="file" style="display:none" onchange="uploadJustif(\''+sid+'\','+i+',this)"/></label>';
      h+='</td>';
      if(isAdmin||canEdit){
        h+='<td style="padding:8px;white-space:nowrap">';
        if(canEdit)h+='<button class="btn" style="font-size:11px;padding:3px 8px;color:#1a3a6b" onclick="modifierDepense(\''+sid+'\','+i+')" title="Modifier"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>';
        if(isAdmin)h+='<button class="btn" style="font-size:11px;padding:3px 8px;color:#A32D2D" onclick="supprimerDepense(\''+sid+'\','+i+')">&times;</button>';
        h+='</td>';
      }
      h+='</tr>';
    });
    h+='</table></div>';
  }
  h+='</div>';
  return h;
}

function toggleCapexDetail(sid){
  if(!S.showCapexDetail)S.showCapexDetail={};
  S.showCapexDetail[sid]=!S.showCapexDetail[sid];
  render();
}

function _rebuildConcernes(sid,existingConcernes){
  var inner=document.getElementById('dep-concernes-inner');
  if(!inner)return;
  var payeur=(document.getElementById('dep-par')||{}).value||'';
  var soc=S.studios[sid]?S.studios[sid].societe:'';
  var owners=OWNERSHIP_MAP[soc]||[];
  var h='<div style="font-size:11px;color:#555;font-weight:500;margin-bottom:6px">Autres associ&eacute;s concern&eacute;s (hors payeur) :</div>';
  var hasAny=false;
  owners.forEach(function(o){
    if(o.nom===payeur)return;
    hasAny=true;
    var chk=!existingConcernes||existingConcernes.length===0||existingConcernes.indexOf(o.nom)>=0;
    h+='<label style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;font-size:12px;color:#333">';
    h+='<input type="checkbox" class="dep-concerne-cb" value="'+o.nom+'"'+(chk?' checked':'')+'/>';
    h+='<span style="font-weight:500">'+o.nom+'</span><span style="color:#888;font-size:10px">('+o.pct+'%)</span>';
    h+='</label>';
  });
  if(!hasAny)h+='<div style="font-size:11px;color:#aaa">Sélectionnez d\'abord le payeur ci-dessus</div>';
  inner.innerHTML=h;
}

function ouvrirFormDepense(sid){
  if(isViewer())return;
  var div=document.getElementById('form-depense-'+sid);
  if(!div)return;
  var h='<div class="box"><div style="font-weight:600;font-size:14px;margin-bottom:12px">Nouvelle depense</div><div class="form-grid">';
  h+='<div class="fg"><label>Categorie</label><select id="dep-cat"><option value="">Selectionner...</option>';
  DEPENSE_CATS.forEach(function(c){h+='<option>'+c+'</option>';});
  h+='</select></div><div class="fg"><label>Description</label><input id="dep-desc" placeholder="Ex: Devis ISOSPACE"/></div>';
  h+='<div class="fg"><label>Montant HT</label><input id="dep-ht" type="number" placeholder="0" oninput="calcTTC()"/></div>';
  h+='<div class="fg"><label>TVA</label><select id="dep-tva" onchange="calcTTC()"><option value="20">20%</option><option value="10">10%</option><option value="0">0%</option></select></div>';
  h+='<div class="fg"><label>Montant TTC</label><input id="dep-ttc" type="number" placeholder="0"/></div>';
  h+='<div class="fg"><label>Financement</label><select id="dep-fin">';
  DEPENSE_FINS.forEach(function(f){h+='<option>'+f+'</option>';});
  h+='</select></div>';
  h+='<div class="fg"><label>Engag&eacute; par</label><select id="dep-par" onchange="_rebuildConcernes(\''+sid+'\')"><option value="">Sélectionner...</option>';
  DEPENSE_CONTRIBUTORS.forEach(function(c){h+='<option>'+c+'</option>';});
  h+='</select></div>';
  h+='<div class="fg"><label>Date</label><input id="dep-date" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>';
  h+='</div>';
  // Répartition entre associés
  var _soc=S.studios[sid]?S.studios[sid].societe:'';
  var _owners=OWNERSHIP_MAP[_soc]||[];
  if(_owners.length>1){
    h+='<div style="margin:12px 0;padding:12px 16px;background:#f8f9fb;border-radius:10px;border:1px solid #e5e7eb">';
    h+='<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:500;color:#333"><input type="checkbox" id="dep-avance" onchange="document.getElementById(\'dep-concernes-wrap\').style.display=this.checked?\'block\':\'none\'"/> R&eacute;partir entre associ&eacute;s (avance)</label>';
    h+='<div style="font-size:10px;color:#888;margin-top:4px;margin-left:24px">Chaque associ&eacute; concern&eacute; devra sa quote-part (% de d&eacute;tention) &mdash; <b>'+_soc+'</b></div>';
    h+='<div id="dep-concernes-wrap" style="display:none;margin-top:10px">';
    h+='<div id="dep-concernes-inner"></div>';
    h+='</div></div>';
  }
  h+='<div style="display:flex;gap:8px"><button class="btn btn-primary" onclick="sauvegarderDepense(\''+sid+'\')">Enregistrer</button>';
  h+='<button class="btn" onclick="document.getElementById(\'form-depense-'+sid+'\').innerHTML=\'\'">Annuler</button></div></div>';
  div.innerHTML=h;
  _rebuildConcernes(sid);
}

function modifierDepense(sid,idx){
  var d=(S.depenses[sid]||[])[idx];
  if(!d)return;
  var _currentUser=(S.profile&&S.profile.nom)||'';
  var isAdmin=!!S.profile&&!isViewer();
  if(!isAdmin&&d.saisi_par!==_currentUser){toast('Seul l\'auteur de la dépense peut la modifier');return;}
  var div=document.getElementById('form-depense-'+sid);
  if(!div)return;
  var h='<div class="box"><div style="font-weight:600;font-size:14px;margin-bottom:12px;display:flex;align-items:center;gap:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Modifier la d&eacute;pense</div><div class="form-grid">';
  h+='<div class="fg"><label>Categorie</label><select id="dep-cat"><option value="">Selectionner...</option>';
  DEPENSE_CATS.forEach(function(c){h+='<option'+(c===d.categorie?' selected':'')+'>'+c+'</option>';});
  h+='</select></div><div class="fg"><label>Description</label><input id="dep-desc" value="'+(d.description||'').replace(/"/g,'&quot;')+'"/></div>';
  h+='<div class="fg"><label>Montant HT</label><input id="dep-ht" type="number" value="'+(d.ht||0)+'" oninput="calcTTC()"/></div>';
  h+='<div class="fg"><label>TVA</label><select id="dep-tva" onchange="calcTTC()"><option value="20"'+(num(d.tva)===20?' selected':'')+'>20%</option><option value="10"'+(num(d.tva)===10?' selected':'')+'>10%</option><option value="0"'+(num(d.tva)===0?' selected':'')+'>0%</option></select></div>';
  h+='<div class="fg"><label>Montant TTC</label><input id="dep-ttc" type="number" value="'+(d.ttc||0)+'"/></div>';
  h+='<div class="fg"><label>Financement</label><select id="dep-fin">';
  DEPENSE_FINS.forEach(function(f){h+='<option'+(f===d.financement?' selected':'')+'>'+f+'</option>';});
  h+='</select></div>';
  h+='<div class="fg"><label>Engag&eacute; par</label><select id="dep-par" onchange="_rebuildConcernes(\''+sid+'\',window._depEditConcernes)"><option value="">Sélectionner...</option>';
  DEPENSE_CONTRIBUTORS.forEach(function(c){h+='<option'+(c===d.engage_par?' selected':'')+'>'+c+'</option>';});
  h+='</select></div>';
  h+='<div class="fg"><label>Date</label><input id="dep-date" type="date" value="'+(d.date||'')+'"/></div>';
  h+='</div>';
  // Répartition entre associés
  var _isAvance=!!d.avance;
  var _concernes=d.avance_concernes||[];
  window._depEditConcernes=_concernes;
  var _soc=S.studios[sid]?S.studios[sid].societe:'';
  var _owners=OWNERSHIP_MAP[_soc]||[];
  if(_owners.length>1){
    h+='<div style="margin:12px 0;padding:12px 16px;background:#f8f9fb;border-radius:10px;border:1px solid #e5e7eb">';
    h+='<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:500;color:#333"><input type="checkbox" id="dep-avance"'+(_isAvance?' checked':'')+' onchange="document.getElementById(\'dep-concernes-wrap\').style.display=this.checked?\'block\':\'none\'"/> R&eacute;partir entre associ&eacute;s (avance)</label>';
    h+='<div style="font-size:10px;color:#888;margin-top:4px;margin-left:24px">Chaque associ&eacute; concern&eacute; devra sa quote-part (% de d&eacute;tention) &mdash; <b>'+_soc+'</b></div>';
    h+='<div id="dep-concernes-wrap" style="display:'+(_isAvance?'block':'none')+';margin-top:10px">';
    h+='<div id="dep-concernes-inner"></div>';
    h+='</div></div>';
  }
  h+='<div style="display:flex;gap:8px"><button class="btn btn-primary" onclick="sauvegarderModifDepense(\''+sid+'\','+idx+')">Enregistrer</button>';
  h+='<button class="btn" onclick="document.getElementById(\'form-depense-'+sid+'\').innerHTML=\'\'">Annuler</button></div></div>';
  div.innerHTML=h;
  _rebuildConcernes(sid,_concernes);
  div.scrollIntoView({behavior:'smooth',block:'nearest'});
}

async function sauvegarderModifDepense(sid,idx){
  var d=(S.depenses[sid]||[])[idx];
  if(!d){toast('Dépense introuvable');return;}
  var cat=document.getElementById('dep-cat')&&document.getElementById('dep-cat').value;
  if(!cat){toast('Selectionnez une categorie');return;}
  d.categorie=cat;
  d.description=(document.getElementById('dep-desc')&&document.getElementById('dep-desc').value)||'';
  d.ht=num(document.getElementById('dep-ht')&&document.getElementById('dep-ht').value);
  d.tva=num(document.getElementById('dep-tva')&&document.getElementById('dep-tva').value,20);
  d.ttc=num(document.getElementById('dep-ttc')&&document.getElementById('dep-ttc').value);
  d.financement=(document.getElementById('dep-fin')&&document.getElementById('dep-fin').value)||'Emprunt bancaire';
  d.engage_par=(document.getElementById('dep-par')&&document.getElementById('dep-par').value)||'';
  d.date=(document.getElementById('dep-date')&&document.getElementById('dep-date').value)||'';
  d.avance=!!(document.getElementById('dep-avance')&&document.getElementById('dep-avance').checked);
  d.avance_concernes=(function(){if(!d.avance)return[];var cbs=document.querySelectorAll('.dep-concerne-cb:checked');var arr=[];cbs.forEach(function(cb){arr.push(cb.value);});return arr;})();
  await saveDepenses(sid);
  toast('Dépense modifiée');render();
}

function calcTTC(){
  var ht=num(document.getElementById('dep-ht')&&document.getElementById('dep-ht').value);
  var tva=num(document.getElementById('dep-tva')&&document.getElementById('dep-tva').value,20);
  var el=document.getElementById('dep-ttc');
  if(el)el.value=Math.round(ht*(1+tva/100));
}

async function sauvegarderDepense(sid){
  var cat=document.getElementById('dep-cat')&&document.getElementById('dep-cat').value;
  if(!cat){toast('Selectionnez une categorie');return;}
  if(!S.depenses[sid])S.depenses[sid]=[];
  S.depenses[sid].push({
    categorie:cat,
    description:(document.getElementById('dep-desc')&&document.getElementById('dep-desc').value)||'',
    ht:num(document.getElementById('dep-ht')&&document.getElementById('dep-ht').value),
    tva:num(document.getElementById('dep-tva')&&document.getElementById('dep-tva').value,20),
    ttc:num(document.getElementById('dep-ttc')&&document.getElementById('dep-ttc').value),
    financement:(document.getElementById('dep-fin')&&document.getElementById('dep-fin').value)||'Emprunt bancaire',
    engage_par:(document.getElementById('dep-par')&&document.getElementById('dep-par').value)||'',
    date:(document.getElementById('dep-date')&&document.getElementById('dep-date').value)||'',
    deblocage:'attente',fichierUrl:null,fichierPath:null,date_demande:null,date_deblocage:null,
    saisi_par:(S.profile&&S.profile.nom)||'',
    avance:!!(document.getElementById('dep-avance')&&document.getElementById('dep-avance').checked),
    avance_concernes:(function(){if(!(document.getElementById('dep-avance')&&document.getElementById('dep-avance').checked))return[];var cbs=document.querySelectorAll('.dep-concerne-cb:checked');var arr=[];cbs.forEach(function(cb){arr.push(cb.value);});return arr;})(),
  });
  await saveDepenses(sid);
  var depTTC=num(document.getElementById('dep-ttc')&&document.getElementById('dep-ttc').value);
  notifyAll({type:'depense',studio_id:sid,title:'Nouvelle d\u00e9pense \u2014 '+(S.studios[sid]?S.studios[sid].name:sid),body:cat+' \u2014 '+fmt(depTTC)});
  toast('Depense enregistree');render();
}

async function supprimerDepense(sid,idx){
  if(isViewer())return;
  if(!confirm('Supprimer ?'))return;
  S.depenses[sid].splice(idx,1);
  await saveDepenses(sid);render();
}

async function changerDeblocage(sid,idx){
  if(isViewer())return;
  var d=S.depenses[sid][idx];
  var today=new Date().toLocaleDateString('fr-FR');
  if(d.deblocage==='attente'){d.deblocage='demande';d.date_demande=today;}
  else if(d.deblocage==='demande'){d.deblocage='debloque';d.date_deblocage=today;}
  else{d.deblocage='attente';d.date_demande=null;d.date_deblocage=null;}
  await saveDepenses(sid);render();
}

async function uploadJustif(sid,idx,input){
  if(isViewer())return;
  var file=input.files[0];if(!file)return;
  var path=sid+'/justif_'+Date.now()+'_'+cleanName(file.name);
  var res=await sb.storage.from('studio-files').upload(path,file,{upsert:true});
  if(res.error){toast('Erreur upload');return;}
  var pu=sb.storage.from('studio-files').getPublicUrl(path);
  S.depenses[sid][idx].fichierUrl=pu.data.publicUrl;
  S.depenses[sid][idx].fichierPath=path;
  await saveDepenses(sid);render();
}

