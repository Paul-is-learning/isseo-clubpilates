// ═══════════════════════════════════════════════════════════════════════════
// PAGES — DÉTAIL STUDIO
// Cartes studios, feed activité, toggles vue, filtres, render détail + workflow.
// Extrait de pages.js (Phase 3 — modularisation).
// ═══════════════════════════════════════════════════════════════════════════

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
    var _icArchive='<svg class="btn-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><line x1="10" y1="12" x2="14" y2="12"/></svg>';
    var _icRestore='<svg class="btn-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>';
    var _icTrash='<svg class="btn-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>';
    h+='<div class="studio-actions" style="display:flex;gap:8px;margin-bottom:14px">';
    h+=(s.statut!=='abandonne'?'<button class="btn btn-sa" style="color:#854F0B" onclick="archiverStudio(\''+S.selectedId+'\')" aria-label="Archiver" title="Archiver">'+_icArchive+'<span class="btn-lbl">Archiver</span></button>':'<button class="btn btn-sa" style="color:#185FA5" onclick="restaurerStudio(\''+S.selectedId+'\')" aria-label="Restaurer" title="Restaurer">'+_icRestore+'<span class="btn-lbl">Restaurer</span></button>');
    h+='<button class="btn btn-sa" style="color:#A32D2D" onclick="supprimerStudio(\''+S.selectedId+'\')" aria-label="Supprimer" title="Supprimer">'+_icTrash+'<span class="btn-lbl">Supprimer</span></button></div>';
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
