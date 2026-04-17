// ═══════════════════════════════════════════════════════════════════════════
// PAGES — COLLAB (vue cross-studio)
// Tâches et discussions consolidées de tous les studios, filtres puissants.
// Extrait de pages.js (Phase 3 — modularisation).
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// ── PAGE: Collab — Tâches & Discussions consolidés cross-studio ─────────────
// ═══════════════════════════════════════════════════════════════════════════
// Philosophie : un seul endroit pour voir l'ensemble des tâches et discussions
// de tous les studios, avec filtres puissants. Click → navigation vers le
// studio concerné. Reuse total des modals/helpers existants.
// ═══════════════════════════════════════════════════════════════════════════

// État de filtres module-level (pas sérialisé dans S pour éviter les renders
// parasites du realtime — persistance localStorage par user)
var _collabFilters=null;
function _loadCollabFilters(){
  if(_collabFilters)return _collabFilters;
  var def={tab:'tasks',view:'liste',studio:'all',assignee:'all',statut:'active',priority:'all',search:'',sort:'deadline',topicState:'open'};
  try{
    var raw=localStorage.getItem('isseo_collab_filters');
    if(raw){_collabFilters=Object.assign(def,JSON.parse(raw));return _collabFilters;}
  }catch(e){}
  _collabFilters=def;return _collabFilters;
}
function _saveCollabFilters(){
  try{localStorage.setItem('isseo_collab_filters',JSON.stringify(_collabFilters));}catch(e){}
}
function setCollabFilter(k,v){
  _loadCollabFilters();
  _collabFilters[k]=v;
  _saveCollabFilters();
  render();
}
function resetCollabFilters(){
  _collabFilters=null;
  try{localStorage.removeItem('isseo_collab_filters');}catch(e){}
  render();
}

// Collecte toutes les tâches de tous les studios accessibles, enrichies
// avec le contexte studio (studioId, studioName) pour le rendu cross-studio
function _collectAllTasks(){
  var out=[];
  var allIds=_getStudioIds();
  allIds.forEach(function(sid){
    var s=S.studios[sid];if(!s)return;
    (S.todos[sid]||[]).forEach(function(t){
      if(!t||!t.id)return;
      out.push({sid:sid,studioName:s.name||sid,task:t});
    });
  });
  return out;
}

// Applique les filtres courants sur la collecte globale des tâches
function _applyCollabTaskFilters(items){
  var f=_loadCollabFilters();
  var myName=(S.profile&&S.profile.nom)||'';
  var today=new Date().toISOString().slice(0,10);
  var q=(f.search||'').toLowerCase().trim();
  return items.filter(function(x){
    var t=x.task;
    // Studio
    if(f.studio!=='all'&&x.sid!==f.studio)return false;
    // Statut
    if(f.statut==='active'&&t.statut==='done')return false;
    if(f.statut==='done'&&t.statut!=='done')return false;
    if(f.statut==='late'){
      if(t.statut==='done')return false;
      if(!t.deadline||t.deadline>=today)return false;
    }
    if(f.statut==='todo'&&t.statut!=='todo')return false;
    if(f.statut==='doing'&&!(t.statut==='in_progress'||t.statut==='doing'||t.statut==='vu'))return false;
    if(f.statut==='blocked'&&t.statut!=='blocked')return false;
    // Assignee (matching tolérant : "Pascal" ≡ "Pascal Bécaud (ISSEO)")
    if(f.assignee==='me'){
      if(!_taskAssignedTo(t,myName))return false;
    }else if(f.assignee!=='all'){
      if(!_taskAssignedTo(t,f.assignee))return false;
    }
    // Priorité
    if(f.priority!=='all'&&t.priority!==f.priority)return false;
    // Recherche
    if(q){
      var hay=((t.titre||'')+' '+(t.description||'')+' '+(t.tags||[]).join(' ')+' '+x.studioName).toLowerCase();
      if(hay.indexOf(q)<0)return false;
    }
    return true;
  });
}

// Tri : deadline asc, puis priorité desc, puis récents
function _sortCollabTasks(items){
  var f=_loadCollabFilters();
  var priorityRank={P1:0,P2:1,P3:2,P4:3};
  return items.slice().sort(function(a,b){
    var ta=a.task,tb=b.task;
    if(f.sort==='priority'){
      var pa=priorityRank[ta.priority]!=null?priorityRank[ta.priority]:4;
      var pb=priorityRank[tb.priority]!=null?priorityRank[tb.priority]:4;
      if(pa!==pb)return pa-pb;
    }
    if(f.sort==='recent'){
      return (tb.ts||'').localeCompare(ta.ts||'');
    }
    // Par défaut : deadline asc (sans deadline à la fin)
    if(ta.deadline&&tb.deadline&&ta.deadline!==tb.deadline)return ta.deadline.localeCompare(tb.deadline);
    if(ta.deadline&&!tb.deadline)return -1;
    if(!ta.deadline&&tb.deadline)return 1;
    return (tb.ts||'').localeCompare(ta.ts||'');
  });
}

// Collecte toutes les discussions (topics) avec contexte studio
function _collectAllTopics(){
  var out=[];
  var allIds=_getStudioIds();
  allIds.forEach(function(sid){
    var s=S.studios[sid];if(!s)return;
    (S.topics[sid]||[]).forEach(function(t){
      if(!t||!t.id)return;
      out.push({sid:sid,studioName:s.name||sid,topic:t});
    });
  });
  return out;
}
function _applyCollabTopicFilters(items){
  var f=_loadCollabFilters();
  var q=(f.search||'').toLowerCase().trim();
  return items.filter(function(x){
    if(f.studio!=='all'&&x.sid!==f.studio)return false;
    if(f.topicState==='open'&&x.topic.closed)return false;
    if(f.topicState==='closed'&&!x.topic.closed)return false;
    if(q){
      var lastMsgText='';
      if(x.topic.messages&&x.topic.messages.length){
        var lm=x.topic.messages[x.topic.messages.length-1];
        lastMsgText=lm.texte||lm.text||'';
      }
      var hay=((x.topic.titre||'')+' '+(x.topic.auteur||'')+' '+lastMsgText+' '+x.studioName).toLowerCase();
      if(hay.indexOf(q)<0)return false;
    }
    return true;
  });
}
function _sortCollabTopics(items){
  return items.slice().sort(function(a,b){
    // Ouverts d'abord, puis par dernier message desc
    if(a.topic.closed!==b.topic.closed)return a.topic.closed?1:-1;
    var aLast=a.topic.messages&&a.topic.messages.length?a.topic.messages[a.topic.messages.length-1].ts:a.topic.ts;
    var bLast=b.topic.messages&&b.topic.messages.length?b.topic.messages[b.topic.messages.length-1].ts:b.topic.ts;
    return (bLast||'').localeCompare(aLast||'');
  });
}

// Compte les tâches de chaque studio pour la liste déroulante
function _collabStudioCounts(){
  var out={};
  _getStudioIds().forEach(function(sid){
    var all=S.todos[sid]||[];
    out[sid]=all.filter(function(t){return t.statut!=='done';}).length;
  });
  return out;
}

// ── Rendu principal ────────────────────────────────────────────────────────
function renderCollab(){
  if(!S._dataLoaded&&typeof skeletonGrid==='function')return '<div class="skeleton-page">'+skeletonGrid(4)+'</div>';
  var f=_loadCollabFilters();
  var dm=S.darkMode;
  var myName=(S.profile&&S.profile.nom)||'';
  var today=new Date().toISOString().slice(0,10);

  // Stats globales (indépendantes des filtres, vue d'ensemble)
  var allTasks=_collectAllTasks();
  var totalActive=allTasks.filter(function(x){return x.task.statut!=='done';}).length;
  var totalMine=allTasks.filter(function(x){
    if(x.task.statut==='done')return false;
    return _taskAssignedTo(x.task,myName);
  }).length;
  var totalLate=allTasks.filter(function(x){
    return x.task.statut!=='done'&&x.task.deadline&&x.task.deadline<today;
  }).length;
  var totalDoneWeek=allTasks.filter(function(x){
    if(x.task.statut!=='done')return false;
    if(!x.task.ts)return false;
    var ageDays=(Date.now()-new Date(x.task.ts).getTime())/(86400000);
    return ageDays>=0&&ageDays<=7;
  }).length;
  var topicsAll=_collectAllTopics();
  var topicsOpen=topicsAll.filter(function(x){return !x.topic.closed;}).length;

  var h='<div class="collab-page">';

  // ═══ Bandeau hero ═══
  h+='<div class="collab-hero">';
  h+='<div class="collab-hero-inner">';
  h+='<div class="collab-hero-head">';
  h+='<div class="collab-hero-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>';
  h+='<div><div class="collab-hero-title">Collab — Tâches & Discussions</div><div class="collab-hero-sub">Toutes les tâches et discussions de tes studios, en un seul endroit</div></div>';
  h+='</div>';
  // KPI cards
  h+='<div class="collab-kpis">';
  h+=_collabKpiCard('Tâches actives',totalActive,'#3B6FB6','📋');
  h+=_collabKpiCard('Mes tâches',totalMine,'#7C3AED','👤');
  h+=_collabKpiCard('En retard',totalLate,totalLate>0?'#DC2626':'#94A3B8','⚠');
  h+=_collabKpiCard('Discussions ouvertes',topicsOpen,'#0E7490','💬');
  h+='</div>';
  h+='</div></div>';

  // ═══ Segment control : Tâches / Discussions ═══
  h+='<div class="collab-segment">';
  h+='<button class="collab-seg-btn'+(f.tab==='tasks'?' active':'')+'" onclick="setCollabFilter(\'tab\',\'tasks\')">';
  h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
  h+='<span>Tâches</span>';
  h+='<span class="collab-seg-count">'+totalActive+'</span>';
  h+='</button>';
  h+='<button class="collab-seg-btn'+(f.tab==='discussions'?' active':'')+'" onclick="setCollabFilter(\'tab\',\'discussions\')">';
  h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  h+='<span>Discussions</span>';
  h+='<span class="collab-seg-count">'+topicsOpen+'</span>';
  h+='</button>';
  h+='</div>';

  // ═══ Barre de filtres ═══
  h+=_collabFiltersBar(f);

  // ═══ Contenu selon onglet ═══
  if(f.tab==='tasks'){
    h+=_collabTasksContent(allTasks,f);
  }else{
    h+=_collabTopicsContent(topicsAll,f);
  }

  h+='</div>';
  return h;
}

// KPI mini-card (sur fond hero navy)
function _collabKpiCard(label,value,accent,emoji){
  var h='<div class="collab-kpi">';
  h+='<div class="collab-kpi-top"><span class="collab-kpi-emoji">'+emoji+'</span><span class="collab-kpi-label">'+label+'</span></div>';
  h+='<div class="collab-kpi-value" style="color:'+accent+'">'+value+'</div>';
  h+='</div>';
  return h;
}

// Barre de filtres : studio, assignee, statut, priorité, recherche, tri, vue
function _collabFiltersBar(f){
  var h='<div class="collab-filters">';

  // Studio select — avec compteur entre parenthèses
  var counts=_collabStudioCounts();
  h+='<select class="collab-filter-select" onchange="setCollabFilter(\'studio\',this.value)">';
  h+='<option value="all"'+(f.studio==='all'?' selected':'')+'>Tous les studios</option>';
  _getStudioIds().forEach(function(sid){
    var s=S.studios[sid];if(!s)return;
    var c=counts[sid]||0;
    h+='<option value="'+sid+'"'+(f.studio===sid?' selected':'')+'>'+_escHtml(s.name||sid)+(c>0?' ('+c+')':'')+'</option>';
  });
  h+='</select>';

  if(f.tab==='tasks'){
    // Assignee
    h+='<select class="collab-filter-select" onchange="setCollabFilter(\'assignee\',this.value)">';
    h+='<option value="all"'+(f.assignee==='all'?' selected':'')+'>👥 Tous assignés</option>';
    h+='<option value="me"'+(f.assignee==='me'?' selected':'')+'>⭐ Moi uniquement</option>';
    // Liste déduite de tous les assignés visibles
    var seen={};
    _collectAllTasks().forEach(function(x){
      _getAssignees(x.task).forEach(function(n){if(n)seen[n]=true;});
    });
    Object.keys(seen).sort().forEach(function(n){
      h+='<option value="'+_escHtml(n)+'"'+(f.assignee===n?' selected':'')+'>'+_escHtml(n)+'</option>';
    });
    h+='</select>';

    // Statut
    h+='<select class="collab-filter-select" onchange="setCollabFilter(\'statut\',this.value)">';
    var statuts=[['active','⚡ En cours'],['late','⚠ En retard'],['todo','○ À faire'],['doing','▶ Actives'],['blocked','⛔ Bloquées'],['done','✓ Terminées'],['all','Tous statuts']];
    statuts.forEach(function(s){h+='<option value="'+s[0]+'"'+(f.statut===s[0]?' selected':'')+'>'+s[1]+'</option>';});
    h+='</select>';

    // Priorité
    h+='<select class="collab-filter-select" onchange="setCollabFilter(\'priority\',this.value)">';
    h+='<option value="all"'+(f.priority==='all'?' selected':'')+'>Toutes priorités</option>';
    ['P1','P2','P3','P4'].forEach(function(p){
      var m=typeof _getPriorityMeta==='function'?_getPriorityMeta(p):{label:p};
      h+='<option value="'+p+'"'+(f.priority===p?' selected':'')+'>'+(m.icon||'')+' '+m.label+'</option>';
    });
    h+='</select>';

    // Tri
    h+='<select class="collab-filter-select" onchange="setCollabFilter(\'sort\',this.value)">';
    h+='<option value="deadline"'+(f.sort==='deadline'?' selected':'')+'>Tri : Deadline</option>';
    h+='<option value="priority"'+(f.sort==='priority'?' selected':'')+'>Tri : Priorité</option>';
    h+='<option value="recent"'+(f.sort==='recent'?' selected':'')+'>Tri : Récent</option>';
    h+='</select>';
  }else{
    // Discussions : état
    h+='<select class="collab-filter-select" onchange="setCollabFilter(\'topicState\',this.value)">';
    h+='<option value="open"'+(f.topicState==='open'?' selected':'')+'>💬 Ouvertes</option>';
    h+='<option value="closed"'+(f.topicState==='closed'?' selected':'')+'>✕ Clôturées</option>';
    h+='<option value="all"'+(f.topicState==='all'?' selected':'')+'>Toutes</option>';
    h+='</select>';
  }

  // Recherche
  h+='<div class="collab-search">';
  h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  h+='<input type="text" placeholder="Rechercher…" value="'+_escHtml(f.search||'')+'" oninput="setCollabFilter(\'search\',this.value)">';
  h+='</div>';

  // Toggle Liste/Kanban (tâches seulement)
  if(f.tab==='tasks'){
    h+='<div class="collab-view-toggle">';
    h+='<button class="collab-view-btn'+(f.view==='liste'?' active':'')+'" onclick="setCollabFilter(\'view\',\'liste\')" title="Vue liste"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/></svg></button>';
    h+='<button class="collab-view-btn'+(f.view==='kanban'?' active':'')+'" onclick="setCollabFilter(\'view\',\'kanban\')" title="Vue kanban"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="10"/></svg></button>';
    h+='</div>';
  }

  h+='</div>';
  return h;
}

// ── Rendu onglet Tâches ────────────────────────────────────────────────────
function _collabTasksContent(allTasks,f){
  var filtered=_sortCollabTasks(_applyCollabTaskFilters(allTasks));
  if(!filtered.length){
    return _collabEmptyState('Aucune tâche ne correspond aux filtres',
      'Essaie d\'élargir les critères, ou supprime les filtres actifs.',
      '<button class="collab-empty-btn" onclick="resetCollabFilters()">🔄 Réinitialiser les filtres</button>');
  }

  if(f.view==='kanban'){
    return _collabRenderKanban(filtered);
  }
  return _collabRenderListe(filtered);
}

// Vue liste : lignes plates, responsive, avec studio badge
function _collabRenderListe(items){
  var today=new Date().toISOString().slice(0,10);
  var h='<div class="collab-list">';
  h+='<div class="collab-list-head">';
  h+='<div class="collab-col-studio">Studio</div>';
  h+='<div class="collab-col-title">Tâche</div>';
  h+='<div class="collab-col-assignees">Assignés</div>';
  h+='<div class="collab-col-status">Statut</div>';
  h+='<div class="collab-col-priority">Prio</div>';
  h+='<div class="collab-col-deadline">Deadline</div>';
  h+='</div>';
  items.forEach(function(x){
    var t=x.task;var sid=x.sid;
    var statusMeta=_getStatusMeta(t.statut||'todo');
    var priorityMeta=t.priority?_getPriorityMeta(t.priority):null;
    var assignees=_getAssignees(t);
    var overdue=t.deadline&&t.deadline<today&&t.statut!=='done';
    var soon=t.deadline&&!overdue&&t.statut!=='done'&&t.deadline<=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
    var dlLabel='';
    if(t.deadline){
      var dl=new Date(t.deadline+'T00:00:00');
      dlLabel=dl.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    }
    h+='<div class="collab-list-row'+(t.statut==='done'?' done':'')+'" onclick="openTacheModal(\''+sid+'\',\''+t.id+'\')">';
    // Studio pill (couleur stable par sid)
    h+='<div class="collab-col-studio"><span class="collab-studio-pill" style="background:'+_collabStudioColor(sid)+'22;color:'+_collabStudioColor(sid)+'">'+_escHtml(x.studioName)+'</span></div>';
    // Titre + description tronquée
    h+='<div class="collab-col-title">';
    h+='<div class="collab-task-title">'+_escHtml(t.titre||'(sans titre)')+'</div>';
    if(t.description){
      h+='<div class="collab-task-desc">'+_escHtml((t.description||'').slice(0,140))+'</div>';
    }
    h+='</div>';
    // Assignés (avatar stack)
    h+='<div class="collab-col-assignees">';
    if(assignees.length){h+=_avatarStackHtml(assignees,24);}
    else{h+='<span class="collab-none">—</span>';}
    h+='</div>';
    // Statut
    h+='<div class="collab-col-status"><span class="task-pill task-pill-status" style="background:'+statusMeta.bg+';color:'+statusMeta.color+'">'+statusMeta.label+'</span></div>';
    // Priorité
    h+='<div class="collab-col-priority">';
    if(priorityMeta)h+='<span class="task-pill task-pill-priority" style="background:'+priorityMeta.bg+';color:'+priorityMeta.color+'">'+priorityMeta.icon+'</span>';
    else h+='<span class="collab-none">—</span>';
    h+='</div>';
    // Deadline
    h+='<div class="collab-col-deadline">';
    if(dlLabel){
      var dlCls='collab-deadline'+(overdue?' overdue':(soon?' soon':''));
      h+='<span class="'+dlCls+'">'+(overdue?'⚠ ':'')+dlLabel+'</span>';
    }else{
      h+='<span class="collab-none">Sans date</span>';
    }
    h+='</div>';
    h+='</div>';
  });
  h+='</div>';
  return h;
}

// Vue Kanban cross-studio : 4 colonnes par statut
function _collabRenderKanban(items){
  var cols=[
    {key:'todo',label:'À faire',match:function(s){return s==='todo';},accent:'#94A3B8'},
    {key:'in_progress',label:'En cours',match:function(s){return s==='in_progress'||s==='doing'||s==='vu';},accent:'#3B6FB6'},
    {key:'done',label:'Terminées',match:function(s){return s==='done';},accent:'#10B981'},
    {key:'blocked',label:'Bloquées',match:function(s){return s==='blocked';},accent:'#DC2626'}
  ];
  var h='<div class="collab-kanban">';
  cols.forEach(function(col){
    var cards=items.filter(function(x){return col.match(x.task.statut||'todo');});
    h+='<div class="collab-kanban-col">';
    h+='<div class="collab-kanban-head" style="border-top-color:'+col.accent+'">';
    h+='<span class="collab-kanban-dot" style="background:'+col.accent+'"></span>';
    h+='<span class="collab-kanban-label">'+col.label+'</span>';
    h+='<span class="collab-kanban-count">'+cards.length+'</span>';
    h+='</div>';
    h+='<div class="collab-kanban-body">';
    if(!cards.length){
      h+='<div class="collab-kanban-empty">Vide</div>';
    }else{
      cards.forEach(function(x){
        h+=_collabKanbanCard(x);
      });
    }
    h+='</div></div>';
  });
  h+='</div>';
  return h;
}

function _collabKanbanCard(x){
  var t=x.task;var sid=x.sid;
  var today=new Date().toISOString().slice(0,10);
  var overdue=t.deadline&&t.deadline<today&&t.statut!=='done';
  var assignees=_getAssignees(t);
  var priorityMeta=t.priority?_getPriorityMeta(t.priority):null;
  var h='<div class="collab-kcard" onclick="openTacheModal(\''+sid+'\',\''+t.id+'\')">';
  // Studio pill
  h+='<div class="collab-kcard-studio"><span class="collab-studio-pill" style="background:'+_collabStudioColor(sid)+'22;color:'+_collabStudioColor(sid)+'">'+_escHtml(x.studioName)+'</span>';
  if(priorityMeta)h+='<span class="task-pill task-pill-priority" style="background:'+priorityMeta.bg+';color:'+priorityMeta.color+'">'+priorityMeta.icon+'</span>';
  h+='</div>';
  // Titre
  h+='<div class="collab-kcard-title">'+_escHtml(t.titre||'(sans titre)')+'</div>';
  // Meta footer : assignees + deadline
  h+='<div class="collab-kcard-foot">';
  if(assignees.length)h+='<div class="collab-kcard-assignees">'+_avatarStackHtml(assignees,22)+'</div>';
  else h+='<div></div>';
  if(t.deadline){
    var dl=new Date(t.deadline+'T00:00:00');
    var lbl=dl.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    h+='<span class="collab-kcard-deadline'+(overdue?' overdue':'')+'">'+(overdue?'⚠ ':'📅 ')+lbl+'</span>';
  }
  // Commentaires
  if(t.comments&&t.comments.length){
    h+='<span class="collab-kcard-comments"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+t.comments.length+'</span>';
  }
  h+='</div>';
  h+='</div>';
  return h;
}

// ── Rendu onglet Discussions ───────────────────────────────────────────────
function _collabTopicsContent(allTopics,f){
  var filtered=_sortCollabTopics(_applyCollabTopicFilters(allTopics));
  if(!filtered.length){
    return _collabEmptyState('Aucune discussion à afficher',
      'Ouvre une discussion depuis un studio pour collaborer avec l\'équipe.',
      '');
  }
  var h='<div class="collab-topics">';
  filtered.forEach(function(x){
    var t=x.topic;
    var msgCount=t.messages?t.messages.length:0;
    var lastMsg=msgCount?t.messages[msgCount-1]:null;
    var lastDate=lastMsg?(lastMsg.date||lastMsg.ts||''):(t.date||t.ts||'');
    var lastTxt=lastMsg?(lastMsg.texte||lastMsg.text||''):'';
    h+='<div class="collab-topic-row'+(t.closed?' closed':'')+'" onclick="_collabOpenTopic(\''+x.sid+'\',\''+t.id+'\')">';
    h+='<div class="collab-topic-main">';
    h+='<div class="collab-topic-head">';
    h+='<span class="collab-studio-pill" style="background:'+_collabStudioColor(x.sid)+'22;color:'+_collabStudioColor(x.sid)+'">'+_escHtml(x.studioName)+'</span>';
    if(t.closed)h+='<span class="collab-topic-closed">Clôturé</span>';
    h+='<span class="collab-topic-title">'+_escHtml(t.titre||'(sans titre)')+'</span>';
    h+='</div>';
    if(lastTxt){
      h+='<div class="collab-topic-preview"><strong>'+_escHtml(lastMsg.auteur||'')+'</strong> : '+_escHtml((lastTxt||'').slice(0,160))+'</div>';
    }
    h+='<div class="collab-topic-meta">';
    h+='<span>par '+_escHtml(t.auteur||'')+'</span>';
    h+='<span>·</span>';
    h+='<span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> '+msgCount+' message'+(msgCount>1?'s':'')+'</span>';
    if(lastDate){h+='<span>·</span><span>'+_escHtml(lastDate)+'</span>';}
    h+='</div>';
    h+='</div>';
    h+='<div class="collab-topic-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>';
    h+='</div>';
  });
  h+='</div>';
  return h;
}

// Ouvre la discussion directement dans le studio cible, sur l'onglet échanges
function _collabOpenTopic(sid,topicId){
  if(typeof openDetail==='function'){
    openDetail(sid);
    setTimeout(function(){
      S.detailTab='echanges';
      S.openTopicId=topicId;
      render();
    },50);
  }
}

// État vide ré-utilisable
function _collabEmptyState(title,sub,cta){
  var h='<div class="collab-empty">';
  h+='<div class="collab-empty-icon"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>';
  h+='<div class="collab-empty-title">'+title+'</div>';
  h+='<div class="collab-empty-sub">'+sub+'</div>';
  if(cta)h+=cta;
  h+='</div>';
  return h;
}

// Couleur stable par studio (hash simple de l'id) — 8 couleurs palette
function _collabStudioColor(sid){
  var palette=['#3B6FB6','#0F6E56','#7C3AED','#854F0B','#DC2626','#0E7490','#92630a','#BE185D'];
  var sum=0;for(var i=0;i<sid.length;i++)sum+=sid.charCodeAt(i);
  return palette[sum%palette.length];
}

