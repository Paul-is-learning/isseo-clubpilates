// ═══════════════════════════════════════════════════════════════════════════
// PAGES — ÉCHANGES (Questions & Tâches — onglet studio)
// Messages, topics de discussion, tâches (liste + kanban), modal nouvelle tâche.
// Extrait de pages.js (Phase 3 — modularisation).
// ═══════════════════════════════════════════════════════════════════════════

function renderMessages(sid){
  var msgs=S.messages[sid]||[];
  var me=(S.profile&&S.profile.nom)||'';
  var colors=['#185FA5','#0F6E56','#854F0B','#993C1D','#533AB7','#A32D2D'];
  function aC(name){var h=0;for(var i=0;i<name.length;i++)h=name.charCodeAt(i)+((h<<5)-h);return colors[Math.abs(h)%colors.length];}
  function ini(name){return name.split(' ').map(function(w){return w[0]||'';}).join('').toUpperCase().slice(0,2);}
  var h='<div><div class="box" style="padding:0;overflow:hidden">';
  h+='<div id="msgs-list" style="height:420px;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px">';
  if(msgs.length===0){
    h+='<div style="text-align:center;color:#aaa;font-size:13px;margin:auto">Aucun message</div>';
  } else {
    msgs.forEach(function(m){
      var isMe=m.auteur===me;
      h+='<div style="display:flex;flex-direction:'+(isMe?'row-reverse':'row')+';align-items:flex-end;gap:8px">';
      h+=avatarHTML(m.auteur,32);
      h+='<div style="display:flex;flex-direction:column;align-items:'+(isMe?'flex-end':'flex-start')+';max-width:72%">';
      h+='<div style="font-size:11px;color:#888;margin-bottom:3px;font-weight:500">'+m.auteur+' &mdash; '+m.date+'</div>';
      h+='<div style="background:'+(isMe?'#1a1a1a':'#f0f0ea')+';color:'+(isMe?'#fff':'#1a1a1a')+';padding:10px 14px;border-radius:'+(isMe?'12px 12px 2px 12px':'12px 12px 12px 2px')+';font-size:13px;line-height:1.5">'+htmlEscape(m.texte)+'</div>';
      h+='</div></div>';
    });
  }
  h+='</div>';
  if(isViewer()){
    h+='<div style="border-top:0.5px solid #e0e0d8;padding:10px 16px;background:#f8f9fb;text-align:center;font-size:11px;color:#aaa">👁 Mode lecture seule — envoi de messages désactivé</div>';
  } else {
    h+='<div style="border-top:0.5px solid #e0e0d8;padding:12px 16px;display:flex;gap:8px;background:#fff">';
    h+='<input id="msg-input" type="text" placeholder="Votre message..." onkeydown="if(event.key===\'Enter\'){event.preventDefault();envoyerMessage(\''+sid+'\');}" style="flex:1;padding:8px 12px;border:0.5px solid #ddd;border-radius:8px;font-size:13px;outline:none"/>';
    h+='<button class="btn btn-primary" onclick="envoyerMessage(\''+sid+'\')">Envoyer</button>';
    h+='</div>';
  }
  h+='</div></div>';
  setTimeout(function(){var el=document.getElementById('msgs-list');if(el)el.scrollTop=el.scrollHeight;},50);
  return h;
}

async function envoyerMessage(sid){
  if(isViewer())return;
  var input=document.getElementById('msg-input');
  var texte=input&&input.value&&input.value.trim();
  if(!texte)return;
  if(input)input.value=''; // vider l'input immédiatement
  if(!S.messages[sid])S.messages[sid]=[];
  var now=new Date();
  S.messages[sid].push({
    auteur:(S.profile&&S.profile.nom)||'',
    texte:texte,
    date:now.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' '+now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),
    ts:now.toISOString(),
  });
  // Sauvegarder en lisant d'abord la version Supabase pour ne pas écraser les messages des autres
  var ex=await sb.from('studios').select('data').eq('id',sid+'_messages').maybeSingle();
  var existing=(ex.data&&ex.data.data&&ex.data.data.messages)||[];
  // Fusionner : garder les messages existants + ajouter le nouveau
  var dernierMsg=S.messages[sid][S.messages[sid].length-1];
  var merged=existing.concat([dernierMsg]);
  // Dédupliquer par ts
  var seen=new Set();
  merged=merged.filter(function(m){if(seen.has(m.ts))return false;seen.add(m.ts);return true;});
  merged.sort(function(a,b){return a.ts>b.ts?1:-1;});
  S.messages[sid]=merged;
  await sb.from('studios').upsert({id:sid+'_messages',data:{messages:merged},updated_at:new Date().toISOString()});
  // Notification
  notifyAll({type:'message',studio_id:sid,title:'Nouveau message \u2014 '+(S.studios[sid]?S.studios[sid].name:sid),body:texte.length>80?texte.slice(0,80)+'\u2026':texte});
  render();
  setTimeout(function(){var el=document.getElementById('msgs-list');if(el)el.scrollTop=el.scrollHeight;},50);
}

// Recharger les messages depuis Supabase (pour voir ceux des autres utilisateurs)
async function rechargerMessages(sid){
  var res=await sb.from('studios').select('data').eq('id',sid+'_messages').maybeSingle();
  var msgs=(res.data&&res.data.data&&res.data.data.messages)||[];
  var avant=JSON.stringify(S.messages[sid]||[]);
  S.messages[sid]=msgs;
  // Re-render seulement si nouveaux messages
  if(JSON.stringify(msgs)!==avant){
    render();
    setTimeout(function(){var el=document.getElementById('msgs-list');if(el)el.scrollTop=el.scrollHeight;},50);
  }
}

// ══════════════════════════════════════════════════════════════════════
// ── Échanges : Forum Topics + Tâches ──────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

function renderEchanges(sid){
  // Si un topic est ouvert → vue fil pleine largeur
  if(S.openTopicId)return renderTopicThread(sid,S.openTopicId);

  var topicCount=(S.topics[sid]||[]).length;
  var pendingTasks=(S.todos[sid]||[]).filter(function(t){return t.statut!=='done';}).length;

  var h='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start" class="echanges-grid">';

  // ── Bloc gauche : Discussions ──
  h+='<div style="background:#fff;border:0.5px solid #e0e0d8;border-radius:14px;overflow:hidden">';
  h+='<div style="padding:14px 18px;border-bottom:1px solid #f0f0ea;display:flex;align-items:center;justify-content:space-between">';
  h+='<div style="display:flex;align-items:center;gap:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span style="font-size:14px;font-weight:700;color:#1a1a1a">Discussions</span>';
  if(topicCount>0)h+='<span style="background:#f0f4ff;color:#1a3a6b;font-size:10px;font-weight:600;padding:2px 7px;border-radius:8px">'+topicCount+'</span>';
  h+='</div>';
  if(!isViewer())h+='<button onclick="ouvrirFormTopic(\''+sid+'\')" style="display:flex;align-items:center;gap:4px;padding:5px 12px;background:#1a3a6b;color:#fff;border:none;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;transition:opacity 0.15s" onmouseover="this.style.opacity=\'0.9\'" onmouseout="this.style.opacity=\'1\'"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nouveau</button>';
  h+='</div>';
  h+='<div style="max-height:520px;overflow-y:auto;padding:10px">';
  h+=renderTopicListInline(sid);
  h+='</div></div>';

  // ── Bloc droit : Tâches ──
  h+='<div style="background:#fff;border:0.5px solid #e0e0d8;border-radius:14px;overflow:hidden">';
  h+='<div style="padding:14px 18px;border-bottom:1px solid #f0f0ea;display:flex;align-items:center;justify-content:space-between">';
  h+='<div style="display:flex;align-items:center;gap:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#854F0B" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg><span style="font-size:14px;font-weight:700;color:#1a1a1a">Tâches</span>';
  if(pendingTasks>0)h+='<span style="background:#FEF3C7;color:#854F0B;font-size:10px;font-weight:600;padding:2px 7px;border-radius:8px">'+pendingTasks+'</span>';
  h+='</div>';
  if(!isViewer())h+='<button onclick="ouvrirFormTache(\''+sid+'\')" style="display:flex;align-items:center;gap:4px;padding:5px 12px;background:#1a3a6b;color:#fff;border:none;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;transition:opacity 0.15s" onmouseover="this.style.opacity=\'0.9\'" onmouseout="this.style.opacity=\'1\'"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nouvelle</button>';
  h+='</div>';
  h+='<div style="max-height:520px;overflow-y:auto;padding:10px">';
  h+=renderTachesInline(sid);
  h+='</div></div>';

  h+='</div>';
  return h;
}

// Inline topic list (no outer buttons, compact for side panel)
function renderTopicListInline(sid){
  var topics=(S.topics[sid]||[]).slice().sort(function(a,b){
    if(a.closed!==b.closed)return a.closed?1:-1;
    var aLast=a.messages&&a.messages.length?a.messages[a.messages.length-1].ts:a.ts;
    var bLast=b.messages&&b.messages.length?b.messages[b.messages.length-1].ts:b.ts;
    return (bLast||'').localeCompare(aLast||'');
  });
  if(!topics.length)return '<div style="text-align:center;padding:36px 16px"><div style="width:44px;height:44px;margin:0 auto 10px;border-radius:12px;background:linear-gradient(135deg,#E8F0FE,#D0DFFA);display:flex;align-items:center;justify-content:center"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B6FB6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div style="color:#555;font-size:12px;font-weight:600">Aucune discussion</div><div style="color:#bbb;font-size:11px;margin-top:3px">Lancez un sujet pour collaborer</div></div>';
  var h='';
  topics.forEach(function(t){
    var msgCount=t.messages?t.messages.length:0;
    var lastMsg=msgCount?t.messages[msgCount-1]:null;
    var lastDate=lastMsg?lastMsg.date:t.date;
    h+='<div onclick="S.openTopicId=\''+t.id+'\';render()" style="padding:10px 12px;border-radius:8px;cursor:pointer;transition:all 0.12s;border-bottom:1px solid #f8f8f4;opacity:'+(t.closed?'0.5':'1')+'" onmouseover="this.style.background=S.darkMode?\'#1c2128\':\'#f8f9fb\'" onmouseout="this.style.background=\'transparent\'">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">';
    h+='<div style="font-size:12px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1">'+t.titre+'</div>';
    h+='<div style="display:flex;align-items:center;gap:6px;flex-shrink:0">';
    if(t.closed)h+='<span style="font-size:8px;background:#f0f0ea;color:#888;padding:1px 5px;border-radius:4px">Clôturé</span>';
    h+='<span style="display:flex;align-items:center;gap:2px;font-size:10px;color:#999"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+msgCount+'</span>';
    h+='</div></div>';
    h+='<div style="font-size:10px;color:#999;margin-top:3px">'+t.auteur+' · '+lastDate+'</div>';
    h+='</div>';
  });
  return h;
}

// Inline tasks list (no outer buttons, compact for side panel)
// ─── Rendu "Notion-style" des tâches ───────────────────────────────────────
// Tri d'urgence : en_cours → à faire → bloqué → fait, puis par deadline
function _sortTodos(todos){
  return todos.slice().sort(function(a,b){
    var order={in_progress:0,doing:0,vu:0,todo:1,blocked:2,done:3};
    var sa=a.statut||'todo', sb=b.statut||'todo';
    var oa=order[sa]!=null?order[sa]:1, ob=order[sb]!=null?order[sb]:1;
    if(oa!==ob) return oa-ob;
    // Même groupe : deadline la plus proche en premier, puis ts desc
    if(a.deadline && b.deadline && a.deadline!==b.deadline) return a.deadline.localeCompare(b.deadline);
    if(a.deadline && !b.deadline) return -1;
    if(!a.deadline && b.deadline) return 1;
    return (b.ts||'').localeCompare(a.ts||'');
  });
}

function _renderTaskRow(sid,t){
  var status=t.statut||'todo';
  var statusMeta=_getStatusMeta(status);
  var isDone=(status==='done');
  var isDoing=(status==='in_progress'||status==='doing'||status==='vu');
  var isBlocked=(status==='blocked');
  var today=new Date().toISOString().slice(0,10);
  var overdue=t.deadline && t.deadline<today && !isDone;
  var soon=t.deadline && !overdue && !isDone && t.deadline<=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
  var assignees=_getAssignees(t);
  var commentCount=(t.comments||[]).length;
  var priorityMeta=t.priority?_getPriorityMeta(t.priority):null;
  var cbCls='task-checkbox'+(isDone?' done':'')+(isDoing?' doing':'')+(isBlocked?' blocked':'');
  var isNew=(S._newlyCreatedTaskId===t.id);
  var h='<div class="task-row'+(isDone?' done':'')+(isNew?' task-new-entry':'')+'" onclick="openTacheModal(\''+sid+'\',\''+t.id+'\')">';
  // Checkbox
  h+='<button class="'+cbCls+'" onclick="event.stopPropagation();toggleTacheStatut(\''+sid+'\',\''+t.id+'\')" title="'+statusMeta.label+' — clic pour avancer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>';
  // Titre
  h+='<div class="task-row-title">'+_escHtml(t.titre||'(sans titre)');
  if(commentCount>0)h+='<span class="task-row-comments-count"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+commentCount+'</span>';
  h+='</div>';
  // Meta à droite
  h+='<div class="task-row-meta">';
  // Pill statut
  h+='<span class="task-pill task-pill-status" style="background:'+statusMeta.bg+';color:'+statusMeta.color+'">'+statusMeta.label+'</span>';
  // Pill priorité (si définie)
  if(priorityMeta){
    h+='<span class="task-pill task-pill-priority" style="background:'+priorityMeta.bg+';color:'+priorityMeta.color+'" title="Priorité '+priorityMeta.label+'">'+priorityMeta.icon+' '+priorityMeta.label+'</span>';
  }
  // Pill deadline
  if(t.deadline){
    var dl=new Date(t.deadline+'T00:00:00');
    var dlabel=dl.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    var dlCls='task-pill task-pill-deadline'+(overdue?' overdue':(soon?' soon':''));
    h+='<span class="'+dlCls+'">'+(overdue?'⚠ ':'')+dlabel+'</span>';
  }
  // Avatars assignés
  if(assignees.length){
    h+='<span class="task-assignees">'+_avatarStackHtml(assignees,24)+'</span>';
  }
  h+='</div></div>';
  return h;
}

// V2 — Dispatcher : délègue à la vue liste ou kanban selon la préférence utilisateur
function renderTachesInline(sid){
  var todos=S.todos[sid]||[];
  if(!todos.length){
    return '<div class="tasks-empty">'
      +'<div class="tasks-empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>'
      +'<div class="tasks-empty-title">Aucune tâche pour le moment</div>'
      +'<div class="tasks-empty-subtitle">Organise le projet avec des tâches collaboratives</div>'
      +(!isViewer()?'<button class="tasks-add-btn" onclick="ouvrirFormTache(\''+sid+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Créer une tâche</button>':'')
      +'</div>';
  }
  var view=_getTasksView(sid);
  // Segment control : toggle Liste / Kanban
  var h='<div class="tasks-view-tabs"><button class="tasks-view-tab'+(view==='liste'?' active':'')+'" onclick="setTasksView(\''+sid+'\',\'liste\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> Liste</button><button class="tasks-view-tab'+(view==='kanban'?' active':'')+'" onclick="setTasksView(\''+sid+'\',\'kanban\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="11" rx="1"/></svg> Kanban</button></div>';
  if(view==='kanban'){
    h+=_renderTachesKanban(sid);
  } else {
    h+=_renderTachesListe(sid);
  }
  return h;
}

// V2 — Bascule de vue : mémorise en localStorage et rerender l'onglet
function setTasksView(sid,view){
  _setTasksView(sid,view);
  render();
}

// V3 — Inline task creation (Notion-style "＋ Ajouter")
function _startInlineCreate(sid,statut,el){
  if(!el)return;
  var isKanban=el.classList.contains('kanban-add-inline');
  var inp=document.createElement('input');
  inp.type='text';
  inp.className=isKanban?'kanban-add-inline-input':'task-add-inline-input';
  inp.placeholder='Titre de la tâche…';
  el.replaceWith(inp);
  inp.focus();
  inp.addEventListener('keydown',function(e){
    if(e.key==='Enter'){
      e.preventDefault();
      var titre=(inp.value||'').trim();
      if(!titre){inp.blur();return;}
      _inlineCreateTask(sid,statut,titre);
    }
    if(e.key==='Escape'){inp.blur();}
  });
  inp.addEventListener('blur',function(){
    setTimeout(function(){render();},50);
  });
}
// V3 — Tags dans le modal détail
function _addTagToTask(sid,taskId,val){
  var tag=(val||'').trim().replace(/^#/,'');
  if(!tag)return;
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t)return;
  if(!t.tags)t.tags=[];
  if(t.tags.indexOf(tag)>=0)return;
  t.tags.push(tag);
  saveTodos(sid).then(function(){_rerenderTacheModal(sid,taskId);});
}
function _removeTagFromTask(sid,taskId,tag){
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t||!t.tags)return;
  t.tags=t.tags.filter(function(x){return x!==tag;});
  saveTodos(sid).then(function(){_rerenderTacheModal(sid,taskId);});
}

async function _inlineCreateTask(sid,statut,titre){
  var moi=(S.profile&&S.profile.nom)||'';
  if(!S.todos[sid])S.todos[sid]=[];
  var newTask={id:'todo_'+Date.now(),titre:titre,description:'',assignees:[moi],responsable:moi,priority:'P2',tags:[],deadline:'',statut:statut||'todo',auteur:moi,ts:new Date().toISOString(),comments:[]};
  S.todos[sid].push(newTask);
  S._newlyCreatedTaskId=newTask.id;
  await saveTodos(sid);
  toast('Tâche créée');
  render();
}

// V2 — Vue Liste classique (ex-corps de renderTachesInline)
function _renderTachesListe(sid){
  var todos=_sortTodos(S.todos[sid]||[]);
  var doneCount=todos.filter(function(t){return t.statut==='done';}).length;
  var total=todos.length;
  var pct=total?Math.round(doneCount/total*100):0;
  var h='';
  h+='<div class="tasks-progress"><div class="tasks-progress-bar"><div class="tasks-progress-fill" data-pct="'+pct+'" style="width:0%"></div></div><span>'+doneCount+'/'+total+' · '+pct+'%</span></div>';
  // RAF : animer la barre de 0 → pct%
  setTimeout(function(){var bar=document.querySelector('.tasks-progress-fill[data-pct="'+pct+'"]');if(bar)requestAnimationFrame(function(){bar.style.width=pct+'%';});},30);
  h+='<div class="tasks-list">';
  todos.forEach(function(t){h+=_renderTaskRow(sid,t);});
  // Inline add Notion-style
  if(!isViewer()){
    h+='<div class="task-add-inline" onclick="_startInlineCreate(\''+sid+'\',\'todo\',this)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Ajouter une tâche</div>';
  }
  h+='</div>';
  if(S._newlyCreatedTaskId)setTimeout(function(){S._newlyCreatedTaskId=null;},400);
  return h;
}

// V2 — Vue Kanban : 4 colonnes par statut avec drag & drop
function _renderTachesKanban(sid){
  var todos=S.todos[sid]||[];
  var cols=_kanbanColumns();
  // Bucketter les tâches par statut (normalisation legacy → current)
  var buckets={};
  cols.forEach(function(c){buckets[c]=[];});
  todos.forEach(function(t){
    var s=t.statut||'todo';
    if(s==='pending')s='todo';
    if(s==='vu'||s==='doing')s='in_progress';
    if(!buckets[s])s='todo';
    buckets[s].push(t);
  });
  // Tri intra-colonne : deadline la plus proche, puis ts desc
  cols.forEach(function(c){
    buckets[c].sort(function(a,b){
      if(a.deadline&&b.deadline&&a.deadline!==b.deadline)return a.deadline.localeCompare(b.deadline);
      if(a.deadline&&!b.deadline)return -1;
      if(!a.deadline&&b.deadline)return 1;
      return (b.ts||'').localeCompare(a.ts||'');
    });
  });
  var viewer=isViewer();
  var h='<div class="kanban-board">';
  cols.forEach(function(c){
    var meta=_getStatusMeta(c);
    var list=buckets[c];
    h+='<div class="kanban-column" data-statut="'+c+'">';
    h+='<div class="kanban-col-header" style="border-left:3px solid '+meta.color+'"><span class="kanban-col-dot" style="background:'+meta.color+'"></span><span class="kanban-col-title">'+meta.label+'</span><span class="kanban-col-count">'+list.length+'</span></div>';
    h+='<div class="kanban-col-body"'+(viewer?'':' ondragover="_onKanbanDragOver(event)" ondragleave="_onKanbanDragLeave(event)" ondrop="_onKanbanDrop(event,\''+c+'\')"')+'>';
    if(!list.length){
      h+='<div class="kanban-col-empty">Aucune tâche</div>';
    } else {
      list.forEach(function(t){h+=_renderKanbanCard(sid,t,viewer);});
    }
    if(!viewer){
      h+='<div class="kanban-add-inline" onclick="_startInlineCreate(\''+sid+'\',\''+c+'\',this)">＋ Ajouter</div>';
    }
    h+='</div></div>';
  });
  h+='</div>';
  return h;
}

// V2 — Card kanban (forme compacte, draggable)
function _renderKanbanCard(sid,t,viewer){
  var assignees=_getAssignees(t);
  var commentCount=(t.comments||[]).length;
  var priorityMeta=t.priority?_getPriorityMeta(t.priority):null;
  var today=new Date().toISOString().slice(0,10);
  var isDone=(t.statut==='done');
  var overdue=t.deadline&&t.deadline<today&&!isDone;
  var soon=t.deadline&&!overdue&&!isDone&&t.deadline<=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
  var dragAttrs=viewer?'':' draggable="true" ondragstart="_onKanbanDragStart(event,\''+t.id+'\')" ondragend="_onKanbanDragEnd(event)"';
  var isNew=(S._newlyCreatedTaskId===t.id);
  var h='<div class="kanban-card'+(isNew?' task-new-entry':'')+'"'+dragAttrs+' onclick="openTacheModal(\''+sid+'\',\''+t.id+'\')">';
  // Titre
  h+='<div class="kanban-card-title">'+_escHtml(t.titre||'(sans titre)')+'</div>';
  // Description abrégée (si présente)
  if(t.description){
    var desc=String(t.description).slice(0,100);
    h+='<div class="kanban-card-desc">'+_escHtml(desc)+(t.description.length>100?'…':'')+'</div>';
  }
  // Meta row
  h+='<div class="kanban-card-meta">';
  // Priorité
  if(priorityMeta){
    h+='<span class="task-pill task-pill-priority" style="background:'+priorityMeta.bg+';color:'+priorityMeta.color+'" title="Priorité '+priorityMeta.label+'">'+priorityMeta.icon+' '+priorityMeta.label+'</span>';
  }
  // Deadline
  if(t.deadline){
    var dl=new Date(t.deadline+'T00:00:00');
    var dlabel=dl.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    var dlCls='task-pill task-pill-deadline'+(overdue?' overdue':(soon?' soon':''));
    h+='<span class="'+dlCls+'">'+(overdue?'⚠ ':'')+dlabel+'</span>';
  }
  // Commentaires
  if(commentCount>0){
    h+='<span class="task-pill task-pill-comments"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> '+commentCount+'</span>';
  }
  h+='</div>';
  // Footer : avatars
  if(assignees.length){
    h+='<div class="kanban-card-footer">'+_avatarStackHtml(assignees,22)+'</div>';
  }
  h+='</div>';
  return h;
}

// V2 — Handlers Drag & Drop HTML5 natifs (desktop uniquement — mobile garde la pill cliquable)
var _dragTaskId=null;
function _onKanbanDragStart(ev,taskId){
  _dragTaskId=taskId;
  try{ev.dataTransfer.effectAllowed='move';ev.dataTransfer.setData('text/plain',taskId);}catch(e){}
  var card=ev.currentTarget||ev.target;
  if(card&&card.classList)card.classList.add('dragging');
}
function _onKanbanDragEnd(ev){
  var card=ev.currentTarget||ev.target;
  if(card&&card.classList)card.classList.remove('dragging');
  document.querySelectorAll('.kanban-column.drop-target').forEach(function(c){c.classList.remove('drop-target');});
  _dragTaskId=null;
}
function _onKanbanDragOver(ev){
  ev.preventDefault();
  try{ev.dataTransfer.dropEffect='move';}catch(e){}
  var col=(ev.currentTarget&&ev.currentTarget.closest)?ev.currentTarget.closest('.kanban-column'):null;
  if(col)col.classList.add('drop-target');
}
function _onKanbanDragLeave(ev){
  var col=(ev.currentTarget&&ev.currentTarget.closest)?ev.currentTarget.closest('.kanban-column'):null;
  if(col&&!col.contains(ev.relatedTarget))col.classList.remove('drop-target');
}
async function _onKanbanDrop(ev,targetStatut){
  ev.preventDefault();
  var col=(ev.currentTarget&&ev.currentTarget.closest)?ev.currentTarget.closest('.kanban-column'):null;
  if(col)col.classList.remove('drop-target');
  var id=_dragTaskId;
  try{if(!id)id=ev.dataTransfer.getData('text/plain');}catch(e){}
  _dragTaskId=null;
  if(!id)return;
  // Retrouver le studio : la colonne est dans un .kanban-board, lui-même dans l'onglet tâches du studio courant
  var sid=(S.currentStudio||'');
  if(!sid){
    // Fallback : chercher la tâche dans tous les studios
    Object.keys(S.todos||{}).forEach(function(k){
      if((S.todos[k]||[]).some(function(t){return t.id===id;}))sid=k;
    });
  }
  if(!sid)return;
  var task=(S.todos[sid]||[]).find(function(t){return t.id===id;});
  if(!task)return;
  // Normaliser l'état courant vers le nouveau schéma pour comparer
  var cur=task.statut||'todo';
  if(cur==='pending')cur='todo';
  if(cur==='vu'||cur==='doing')cur='in_progress';
  if(cur===targetStatut)return;
  // Réutilise _setTaskStatus (V1) qui fait save + trigger email fire-and-forget
  await _setTaskStatus(sid,id,targetStatut);
}

// ── DISCUSSIONS (Forum Topics) ──────────────────────────────────────────

function renderDiscussions(sid){
  if(S.openTopicId)return renderTopicThread(sid,S.openTopicId);
  return renderTopicList(sid);
}

function renderTopicList(sid){
  var topics=(S.topics[sid]||[]).slice().sort(function(a,b){
    // Non-closed first, then by latest activity
    if(a.closed!==b.closed)return a.closed?1:-1;
    var aLast=a.messages&&a.messages.length?a.messages[a.messages.length-1].ts:a.ts;
    var bLast=b.messages&&b.messages.length?b.messages[b.messages.length-1].ts:b.ts;
    return (bLast||'').localeCompare(aLast||'');
  });
  var h='';
  if(!isViewer()){
    h+='<div style="display:flex;justify-content:flex-end;margin-bottom:12px">';
    h+='<button onclick="ouvrirFormTopic(\''+sid+'\')" style="display:flex;align-items:center;gap:5px;padding:8px 16px;background:#1a3a6b;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:opacity 0.15s" onmouseover="this.style.opacity=\'0.9\'" onmouseout="this.style.opacity=\'1\'"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nouveau sujet</button>';
    h+='</div>';
  }
  if(!topics.length){
    h+='<div class="box" style="text-align:center;padding:40px 20px"><div style="width:48px;height:48px;margin:0 auto 10px;border-radius:14px;background:linear-gradient(135deg,#E8F0FE,#D0DFFA);display:flex;align-items:center;justify-content:center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B6FB6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div style="color:#555;font-size:13px;font-weight:600">Aucune discussion pour le moment</div><div style="color:#bbb;font-size:11px;margin-top:4px">Créez un sujet pour lancer la conversation</div></div>';
    return h;
  }
  h+='<div style="display:flex;flex-direction:column;gap:8px">';
  topics.forEach(function(t){
    var msgCount=t.messages?t.messages.length:0;
    var lastMsg=msgCount?t.messages[msgCount-1]:null;
    var lastDate=lastMsg?lastMsg.date:t.date;
    var lastAuteur=lastMsg?lastMsg.auteur:t.auteur;
    h+='<div onclick="S.openTopicId=\''+t.id+'\';render()" style="background:#fff;border:0.5px solid '+(t.closed?'#e8e8e3':'#e0e0d8')+';border-radius:10px;padding:14px 18px;cursor:pointer;transition:all 0.15s;opacity:'+(t.closed?'0.6':'1')+'" onmouseover="this.style.borderColor=\'#bbb\';this.style.boxShadow=\'0 2px 8px rgba(0,0,0,0.04)\'" onmouseout="this.style.borderColor=\''+(t.closed?'#e8e8e3':'#e0e0d8')+'\';this.style.boxShadow=\'none\'">';
    h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">';
    h+='<div style="min-width:0;flex:1">';
    h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span style="font-size:13px;font-weight:600;color:#1a1a1a">'+t.titre+'</span>';
    if(t.closed)h+='<span style="font-size:9px;background:#f0f0ea;color:#888;padding:1px 6px;border-radius:6px">Clôturé</span>';
    h+='</div>';
    h+='<div style="font-size:11px;color:#888">Créé par <span style="font-weight:500;color:#555">'+t.auteur+'</span> · '+t.date+'</div>';
    h+='</div>';
    h+='<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">';
    h+='<div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#888"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> '+msgCount+'</div>';
    h+='<div style="text-align:right"><div style="font-size:10px;color:#bbb">Dernière activité</div><div style="font-size:10px;color:#666;font-weight:500">'+lastDate+'</div></div>';
    h+='</div></div></div>';
  });
  h+='</div>';
  return h;
}

function renderTopicThread(sid,topicId){
  var topics=S.topics[sid]||[];
  var topic=topics.find(function(t){return t.id===topicId;});
  if(!topic)return '<div class="box">Topic introuvable</div>';
  var msgs=topic.messages||[];
  var me=(S.profile&&S.profile.nom)||'';
  var h='';
  // Header
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">';
  h+='<div style="display:flex;align-items:center;gap:10px">';
  h+='<button onclick="S.openTopicId=null;render()" style="background:none;border:none;cursor:pointer;font-size:13px;color:#888;padding:0">← Retour</button>';
  h+='<span style="font-size:15px;font-weight:700;color:#1a1a1a">'+topic.titre+'</span>';
  if(topic.closed){
    if(isSuperAdmin()){
      h+='<span onclick="rouvrirTopic(\''+sid+'\',\''+topicId+'\')" style="font-size:9px;background:#f0f0ea;color:#888;padding:2px 8px;border-radius:6px;cursor:pointer;transition:all 0.15s" onmouseover="this.style.background=\'#DBEAFE\';this.style.color=\'#1D4ED8\'" onmouseout="this.style.background=\'#f0f0ea\';this.style.color=\'#888\'" title="Cliquer pour rouvrir">Clôturé ↺</span>';
    } else {
      h+='<span style="font-size:9px;background:#f0f0ea;color:#888;padding:2px 8px;border-radius:6px">Clôturé</span>';
    }
  }
  h+='</div>';
  if(!topic.closed&&!isViewer()&&(topic.auteur===me||isSuperAdmin())){
    h+='<button onclick="fermerTopic(\''+sid+'\',\''+topicId+'\')" style="font-size:11px;color:#888;background:none;border:1px solid #e0e0da;border-radius:6px;padding:4px 10px;cursor:pointer;transition:all 0.15s" onmouseover="this.style.borderColor=\'#bbb\'" onmouseout="this.style.borderColor=\'#e0e0da\'">Clôturer</button>';
  }
  h+='</div>';
  h+='<div style="font-size:11px;color:#888;margin-bottom:14px">Par '+topic.auteur+' · '+topic.date+'</div>';
  // Messages
  h+='<div class="box" style="padding:0;overflow:hidden">';
  h+='<div id="topic-msgs" style="height:380px;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px">';
  if(!msgs.length)h+=(typeof emptyState==='function')?emptyState('chat','Aucune réponse pour le moment','Soyez le premier à répondre.'):'<div style="text-align:center;color:#aaa;font-size:12px;padding:20px">Aucune réponse pour le moment</div>';
  msgs.forEach(function(m,mi){
    var isMe=m.auteur===me;
    var canEdit=isMe||isSuperAdmin();
    h+='<div style="display:flex;flex-direction:'+(isMe?'row-reverse':'row')+';align-items:flex-end;gap:8px" class="topic-msg-row" onmouseover="var a=this.querySelector(\'.msg-actions\');if(a)a.style.opacity=\'1\'" onmouseout="var a=this.querySelector(\'.msg-actions\');if(a)a.style.opacity=\'0\'">';
    h+=avatarHTML(m.auteur,32);
    h+='<div style="display:flex;flex-direction:column;align-items:'+(isMe?'flex-end':'flex-start')+';max-width:72%">';
    h+='<div style="font-size:11px;color:#888;margin-bottom:3px;font-weight:500">'+m.auteur+' &mdash; '+m.date+(m.edited?' <span style="font-style:italic;color:#bbb">(modifié)</span>':'')+'</div>';
    h+='<div style="position:relative">';
    h+='<div style="background:'+(isMe?'#1a3a6b':'#f0f0ea')+';color:'+(isMe?'#fff':'#1a1a1a')+';padding:10px 14px;border-radius:'+(isMe?'12px 12px 2px 12px':'12px 12px 12px 2px')+';font-size:13px;line-height:1.5">'+htmlEscape(m.texte)+'</div>';
    var within5min=m.ts&&(Date.now()-new Date(m.ts).getTime()<5*60*1000);
    if(canEdit&&!topic.closed&&(within5min||isSuperAdmin())){
      h+='<div class="msg-actions" style="opacity:0;transition:opacity 0.15s;position:absolute;'+(isMe?'left:-60px':'right:-60px')+';top:50%;transform:translateY(-50%);display:flex;gap:2px">';
      h+='<button onclick="event.stopPropagation();modifierMsgTopic(\''+sid+'\',\''+topicId+'\','+mi+')" title="Modifier" style="background:#fff;border:1px solid #e0e0da;border-radius:6px;width:26px;height:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;color:#888;transition:all 0.15s;box-shadow:0 1px 3px rgba(0,0,0,0.06)" onmouseover="this.style.borderColor=\'#1a3a6b\';this.style.color=\'#1a3a6b\'" onmouseout="this.style.borderColor=\'#e0e0da\';this.style.color=\'#888\'">✎</button>';
      h+='<button onclick="event.stopPropagation();supprimerMsgTopic(\''+sid+'\',\''+topicId+'\','+mi+')" title="Supprimer" style="background:#fff;border:1px solid #e0e0da;border-radius:6px;width:26px;height:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;color:#888;transition:all 0.15s;box-shadow:0 1px 3px rgba(0,0,0,0.06)" onmouseover="this.style.borderColor=\'#A32D2D\';this.style.color=\'#A32D2D\'" onmouseout="this.style.borderColor=\'#e0e0da\';this.style.color=\'#888\'">×</button>';
      h+='</div>';
    }
    h+='</div></div></div>';
  });
  h+='</div>';
  // Input
  if(!topic.closed&&!isViewer()){
    h+='<div style="border-top:0.5px solid #e0e0d8;padding:12px 16px;display:flex;gap:8px;background:#fff">';
    h+='<input id="topic-reply-input" type="text" placeholder="Votre réponse..." onkeydown="if(event.key===\'Enter\'){event.preventDefault();repondreTopic(\''+sid+'\',\''+topicId+'\');}" style="flex:1;padding:8px 12px;border:0.5px solid #ddd;border-radius:8px;font-size:13px;outline:none" onfocus="this.style.borderColor=\'#1a3a6b\'" onblur="this.style.borderColor=\'#ddd\'">';
    h+='<button onclick="repondreTopic(\''+sid+'\',\''+topicId+'\')" style="padding:8px 16px;background:#1a3a6b;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:opacity 0.15s;white-space:nowrap" onmouseover="this.style.opacity=\'0.9\'" onmouseout="this.style.opacity=\'1\'">Envoyer</button>';
    h+='</div>';
  } else if(topic.closed){
    h+='<div style="border-top:0.5px solid #e0e0d8;padding:10px 16px;background:#f8f9fb;text-align:center;font-size:11px;color:#aaa">Ce sujet est clôturé</div>';
  }
  h+='</div>';
  setTimeout(function(){var el=document.getElementById('topic-msgs');if(el)el.scrollTop=el.scrollHeight;},50);
  return h;
}

function ouvrirFormTopic(sid){
  var overlay=document.createElement('div');
  overlay.id='topic-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  var box='<div style="background:#fff;border-radius:14px;padding:24px 28px;width:420px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.18)">';
  box+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px"><span style="font-size:15px;font-weight:700;color:#1a1a1a">Nouveau sujet</span><button onclick="document.getElementById(\'topic-modal\').remove()" style="background:none;border:none;font-size:20px;color:#999;cursor:pointer;padding:0;line-height:1">&times;</button></div>';
  box+='<label style="font-size:11px;font-weight:600;color:#666;display:block;margin-bottom:4px">Titre du sujet</label>';
  box+='<input id="new-topic-title" type="text" placeholder="Ex: Négociation bail commercial" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;margin-bottom:14px;box-sizing:border-box;outline:none" onfocus="this.style.borderColor=\'#1a3a6b\'" onblur="this.style.borderColor=\'#ddd\'">';
  box+='<label style="font-size:11px;font-weight:600;color:#666;display:block;margin-bottom:4px">Premier message</label>';
  box+='<textarea id="new-topic-body" rows="3" placeholder="Décrivez le sujet..." style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;margin-bottom:18px;box-sizing:border-box;outline:none;resize:vertical;font-family:inherit" onfocus="this.style.borderColor=\'#1a3a6b\'" onblur="this.style.borderColor=\'#ddd\'"></textarea>';
  box+='<button onclick="creerTopic(\''+sid+'\')" style="width:100%;padding:11px;background:#1a3a6b;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:opacity 0.15s" onmouseover="this.style.opacity=\'0.9\'" onmouseout="this.style.opacity=\'1\'">Créer le sujet</button>';
  box+='</div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
  setTimeout(function(){var el=document.getElementById('new-topic-title');if(el)el.focus();},80);
}

async function creerTopic(sid){
  var titre=(document.getElementById('new-topic-title')||{}).value;
  var body=(document.getElementById('new-topic-body')||{}).value;
  if(!titre||!titre.trim()){toast('Saisissez un titre');return;}
  var now=new Date();
  var me=(S.profile&&S.profile.nom)||'';
  var topic={
    id:'topic_'+Date.now(),
    titre:titre.trim(),
    auteur:me,
    date:now.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' '+now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),
    ts:now.toISOString(),
    closed:false,
    messages:[]
  };
  if(body&&body.trim()){
    topic.messages.push({auteur:me,texte:body.trim(),date:topic.date,ts:now.toISOString()});
  }
  if(!S.topics[sid])S.topics[sid]=[];
  S.topics[sid].push(topic);
  await saveTopics(sid);
  var modal=document.getElementById('topic-modal');if(modal)modal.remove();
  S.openTopicId=topic.id;
  notifyAll({type:'message',studio_id:sid,title:'Nouveau sujet — '+(S.studios[sid]?S.studios[sid].name:sid),body:titre.trim()});
  render();
  toast('Sujet créé');
}

async function repondreTopic(sid,topicId){
  var input=document.getElementById('topic-reply-input');
  var texte=input&&input.value&&input.value.trim();
  if(!texte)return;
  if(input)input.value='';
  var topics=S.topics[sid]||[];
  var topic=topics.find(function(t){return t.id===topicId;});
  if(!topic)return;
  var now=new Date();
  topic.messages.push({
    auteur:(S.profile&&S.profile.nom)||'',
    texte:texte,
    date:now.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' '+now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),
    ts:now.toISOString()
  });
  await saveTopics(sid);
  notifyAll({type:'message',studio_id:sid,title:'Réponse — '+topic.titre,body:texte.length>80?texte.slice(0,80)+'…':texte});
  render();
  setTimeout(function(){var el=document.getElementById('topic-msgs');if(el)el.scrollTop=el.scrollHeight;},50);
}

async function fermerTopic(sid,topicId){
  var topics=S.topics[sid]||[];
  var topic=topics.find(function(t){return t.id===topicId;});
  if(!topic)return;
  topic.closed=true;
  await saveTopics(sid);
  toast('Sujet clôturé');
  render();
}

async function rouvrirTopic(sid,topicId){
  if(!isSuperAdmin())return;
  var topics=S.topics[sid]||[];
  var topic=topics.find(function(t){return t.id===topicId;});
  if(!topic)return;
  topic.closed=false;
  await saveTopics(sid);
  toast('Sujet rouvert');
  render();
}

function modifierMsgTopic(sid,topicId,msgIdx){
  var topics=S.topics[sid]||[];
  var topic=topics.find(function(t){return t.id===topicId;});
  if(!topic||!topic.messages[msgIdx])return;
  var m=topic.messages[msgIdx];
  var overlay=document.createElement('div');
  overlay.id='edit-msg-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  var box='<div style="background:#fff;border-radius:14px;padding:24px 28px;width:420px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.18)">';
  box+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><span style="font-size:15px;font-weight:700;color:#1a1a1a">Modifier le message</span><button onclick="document.getElementById(\'edit-msg-modal\').remove()" style="background:none;border:none;font-size:20px;color:#999;cursor:pointer;padding:0;line-height:1">&times;</button></div>';
  box+='<textarea id="edit-msg-text" rows="4" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;margin-bottom:16px;box-sizing:border-box;outline:none;resize:vertical;font-family:inherit" onfocus="this.style.borderColor=\'#1a3a6b\'" onblur="this.style.borderColor=\'#ddd\'">'+m.texte.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</textarea>';
  box+='<button onclick="confirmerModifMsg(\''+sid+'\',\''+topicId+'\','+msgIdx+')" style="width:100%;padding:11px;background:#1a3a6b;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">Enregistrer</button>';
  box+='</div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
  setTimeout(function(){var el=document.getElementById('edit-msg-text');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);}},80);
}

async function confirmerModifMsg(sid,topicId,msgIdx){
  var el=document.getElementById('edit-msg-text');
  var texte=el&&el.value&&el.value.trim();
  if(!texte){toast('Le message ne peut pas être vide');return;}
  var topics=S.topics[sid]||[];
  var topic=topics.find(function(t){return t.id===topicId;});
  if(!topic||!topic.messages[msgIdx])return;
  topic.messages[msgIdx].texte=texte;
  topic.messages[msgIdx].edited=true;
  await saveTopics(sid);
  var modal=document.getElementById('edit-msg-modal');if(modal)modal.remove();
  toast('Message modifié');
  render();
}

async function supprimerMsgTopic(sid,topicId,msgIdx){
  if(!confirm('Supprimer ce message ?'))return;
  var topics=S.topics[sid]||[];
  var topic=topics.find(function(t){return t.id===topicId;});
  if(!topic||!topic.messages[msgIdx])return;
  var msgBody=topic.messages[msgIdx].texte||'';
  topic.messages.splice(msgIdx,1);
  await saveTopics(sid);
  // Supprimer les notifications liées
  if(msgBody)await sb.from('notifications').delete().eq('studio_id',sid).eq('type','message').ilike('body','%'+msgBody.slice(0,60)+'%');
  S.notifications=S.notifications.filter(function(n){return !(n.studio_id===sid&&n.type==='message'&&n.body&&n.body.indexOf(msgBody.slice(0,60))>=0);});
  toast('Message supprimé');
  render();
}

async function saveTopics(sid){
  await sb.from('studios').upsert({id:sid+'_topics',data:{topics:S.topics[sid]||[]},updated_at:new Date().toISOString()});
}

// ── TÂCHES (Todo List) ──────────────────────────────────────────────────

var TACHE_STATUTS={todo:{label:'À faire',bg:'#FEF3C7',text:'#854F0B',icon:'○'},vu:{label:'Vu',bg:'#F3E8FF',text:'#7C3AED',icon:'◉'},doing:{label:'En cours',bg:'#DBEAFE',text:'#1D4ED8',icon:'◐'},done:{label:'Terminé',bg:'#D1FAE5',text:'#065F46',icon:'✓'}};

// Vue complète "Notion-style" — header + liste + progress + CTA nouvelle tâche
function renderTaches(sid){
  var h='<div class="tasks-container">';
  h+='<div class="tasks-header">';
  h+='<div class="tasks-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> Tâches</div>';
  if(!isViewer()){
    h+='<button class="tasks-add-btn" onclick="ouvrirFormTache(\''+sid+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nouvelle tâche</button>';
  }
  h+='</div>';
  h+=renderTachesInline(sid);
  h+='</div>';
  return h;
}

// Liste des profils pour les pickers (assignees, etc.)
// Normalise un nom pour comparer : retire " (ISSEO)", " (xxx)", trim, lowercase
function _normalizeProfileName(n){
  return String(n||'').replace(/\s*\([^)]*\)\s*$/,'').trim().toLowerCase();
}

function _taskProfilesList(){
  var raw=(S._allProfiles||[]).slice();
  var EXPECTED=['Paul Bécaud','Pascal Bécaud','Tom Bécaud','Paul Sabourin','Caroline Coquel','Clément Coquel'];
  // Ajoute les EXPECTED manquants (vérification sur forme normalisée)
  var normSeen={};
  raw.forEach(function(p){if(p&&p.nom)normSeen[_normalizeProfileName(p.nom)]=true;});
  EXPECTED.forEach(function(n){
    var k=_normalizeProfileName(n);
    if(!normSeen[k]){raw.push({nom:n});normSeen[k]=true;}
  });
  // Dédup par nom normalisé : on garde le meilleur doublon (priorité : user_id > email > nom le plus court)
  var byKey={};
  raw.forEach(function(p){
    if(!p||!p.nom||!String(p.nom).trim())return;
    var k=_normalizeProfileName(p.nom);
    var cur=byKey[k];
    if(!cur){byKey[k]=p;return;}
    var curScore=(cur.user_id?2:0)+(cur.email?1:0);
    var newScore=(p.user_id?2:0)+(p.email?1:0);
    if(newScore>curScore){byKey[k]=p;return;}
    if(newScore===curScore){
      // À score égal, préfère la version sans "(…)" ou la plus courte
      var curHasParen=/\(/.test(cur.nom);
      var newHasParen=/\(/.test(p.nom);
      if(curHasParen&&!newHasParen){byKey[k]=p;return;}
      if(!curHasParen&&newHasParen)return;
      if(String(p.nom).length<String(cur.nom).length){byKey[k]=p;return;}
    }
  });
  // Nettoie les suffixes "(ISSEO)" affichés
  var out=Object.keys(byKey).map(function(k){
    var p=Object.assign({},byKey[k]);
    p.nom=String(p.nom||'').replace(/\s*\(ISSEO\)\s*$/i,'').trim();
    return p;
  });
  return out.sort(function(a,b){return a.nom.localeCompare(b.nom);});
}

// Création rapide — modal compact
// ══════════════════════════════════════════════════════════════════════
// V2 : Création rapide — modal Notion-style (assignees multi, priorité pill, presets deadline, tags)
// ══════════════════════════════════════════════════════════════════════

var _newTacheDraft=null; // { sid, titre, desc, assignees:[], priority, tags:[], deadline }
var _newTacheEscHandler=null;

function ouvrirFormTache(sid){
  var moi=(S.profile&&S.profile.nom)||'';
  _newTacheDraft={
    sid:sid,
    titre:'',
    desc:'',
    assignees:moi?[moi]:[],
    priority:'P2',
    tags:[],
    deadline:''
  };
  var overlay=document.createElement('div');
  overlay.id='tache-quick-modal';
  overlay.className='task-modal-overlay';
  overlay.onclick=function(e){if(e.target===overlay)_closeNewTacheModal();};
  overlay.innerHTML=_renderNewTacheModalInner(sid);
  document.body.appendChild(overlay);
  // ESC pour fermer
  _newTacheEscHandler=function(e){if(e.key==='Escape'){e.preventDefault();_closeNewTacheModal();}};
  document.addEventListener('keydown',_newTacheEscHandler);
  // Focus titre + Cmd+Enter submit
  setTimeout(function(){
    var el=document.getElementById('new-tache-titre');
    if(el){
      el.focus();
      el.addEventListener('keydown',function(e){
        if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();creerTache(sid);}
      });
    }
    var descEl=document.getElementById('new-tache-desc');
    if(descEl){
      descEl.addEventListener('keydown',function(e){
        if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();creerTache(sid);}
      });
    }
  },80);
}

function _closeNewTacheModal(){
  var m=document.getElementById('tache-quick-modal');
  if(!m){_newTacheDraft=null;return;}
  m.classList.add('closing');
  var done=false;
  function fin(){if(done)return;done=true;m.remove();}
  m.addEventListener('animationend',fin);
  setTimeout(fin,280);
  _newTacheDraft=null;
  if(_newTacheEscHandler){
    document.removeEventListener('keydown',_newTacheEscHandler);
    _newTacheEscHandler=null;
  }
  // Fermer d'éventuels pickers flottants
  document.querySelectorAll('.task-picker-dropdown').forEach(function(x){x.remove();});
}

function _rerenderNewTacheModal(){
  var overlay=document.getElementById('tache-quick-modal');
  if(!overlay||!_newTacheDraft)return;
  // Sauvegarder les valeurs des inputs live avant rerender
  var titreEl=document.getElementById('new-tache-titre');
  var descEl=document.getElementById('new-tache-desc');
  if(titreEl)_newTacheDraft.titre=titreEl.value;
  if(descEl)_newTacheDraft.desc=descEl.value;
  overlay.innerHTML=_renderNewTacheModalInner(_newTacheDraft.sid);
  // Rebind Cmd+Enter
  setTimeout(function(){
    var el=document.getElementById('new-tache-titre');
    var deEl=document.getElementById('new-tache-desc');
    [el,deEl].forEach(function(e){
      if(!e)return;
      e.addEventListener('keydown',function(ev){
        if((ev.metaKey||ev.ctrlKey)&&ev.key==='Enter'){ev.preventDefault();creerTache(_newTacheDraft.sid);}
      });
    });
  },20);
}

function _renderNewTacheModalInner(sid){
  var d=_newTacheDraft||{titre:'',desc:'',assignees:[],priority:'P2',tags:[],deadline:''};
  var moi=(S.profile&&S.profile.nom)||'';
  var today=new Date();
  var todayISO=today.toISOString().slice(0,10);
  var tomorrow=new Date(today.getTime()+86400000).toISOString().slice(0,10);
  var nextMonday=new Date(today.getTime()+((8-today.getDay())%7||7)*86400000).toISOString().slice(0,10);
  var endWeek=new Date(today.getTime()+((5-today.getDay()+7)%7||5)*86400000).toISOString().slice(0,10);

  var h='<div class="task-modal-box new-tache-modal" onclick="event.stopPropagation()">';

  // Topbar minimal
  h+='<div class="task-modal-topbar">';
  h+='<div style="display:flex;align-items:center;gap:8px"><span class="nt-badge">✦</span><span style="font-size:13px;font-weight:700;color:#1a1a1a">Nouvelle tâche</span></div>';
  h+='<button onclick="_closeNewTacheModal()" class="task-modal-close" title="Fermer">&times;</button>';
  h+='</div>';

  h+='<div class="nt-body">';

  // Titre
  h+='<input id="new-tache-titre" type="text" class="nt-title" placeholder="Titre de la tâche…" value="'+_escHtml(d.titre||'').replace(/"/g,'&quot;')+'" />';

  // Description
  h+='<textarea id="new-tache-desc" class="nt-desc" rows="2" placeholder="Ajoute une description (optionnel)…">'+_escHtml(d.desc||'')+'</textarea>';

  // Assignees
  h+='<div class="nt-field">';
  h+='<div class="nt-label">👥 Assigné à</div>';
  h+='<div class="nt-assignees-row">';
  if(d.assignees.length){
    d.assignees.forEach(function(nom){
      h+='<span class="nt-assignee-chip">'+_avatarHtml(nom,22)+'<span>'+_escHtml(nom.split(' ')[0])+'</span><button onclick="_nt_removeAssignee(\''+nom.replace(/'/g,"\\'")+'\')" title="Retirer">&times;</button></span>';
    });
  } else {
    h+='<span class="nt-assignee-empty">Personne — la tâche sera partagée à toute l\'équipe</span>';
  }
  h+='<button class="nt-add-btn" onclick="_nt_openAssigneePicker(event)" title="Ajouter un assigné">+</button>';
  h+='</div></div>';

  // Priorité en pills
  h+='<div class="nt-field">';
  h+='<div class="nt-label">⚑ Priorité</div>';
  h+='<div class="nt-pills">';
  var prios=[
    {id:'P0',icon:'🔥',label:'Urgent',color:'#DC2626',bg:'#FEE2E2'},
    {id:'P1',icon:'▲',label:'Haute',color:'#D97706',bg:'#FEF3C7'},
    {id:'P2',icon:'●',label:'Normale',color:'#6B7280',bg:'#F3F4F6'},
    {id:'P3',icon:'▽',label:'Basse',color:'#9CA3AF',bg:'#F9FAFB'}
  ];
  prios.forEach(function(p){
    var active=(d.priority===p.id);
    h+='<button class="nt-pill'+(active?' active':'')+'" onclick="_nt_setPriority(\''+p.id+'\')" style="'+(active?'background:'+p.bg+';border-color:'+p.color+';color:'+p.color+'':'')+'">'+p.icon+' '+p.label+'</button>';
  });
  h+='</div></div>';

  // Deadline : presets + date picker
  h+='<div class="nt-field">';
  h+='<div class="nt-label">📅 Deadline</div>';
  h+='<div class="nt-deadline-row">';
  var presets=[
    {label:'Aujourd\'hui',val:todayISO},
    {label:'Demain',val:tomorrow},
    {label:'Fin de semaine',val:endWeek},
    {label:'Lundi prochain',val:nextMonday}
  ];
  presets.forEach(function(p){
    var active=(d.deadline===p.val);
    h+='<button class="nt-preset'+(active?' active':'')+'" onclick="_nt_setDeadline(\''+(active?'':p.val)+'\')">'+p.label+'</button>';
  });
  h+='<input type="date" class="nt-date-input" value="'+(d.deadline||'')+'" onchange="_nt_setDeadline(this.value)" title="Choisir une date"/>';
  if(d.deadline){
    h+='<button class="nt-clear" onclick="_nt_setDeadline(\'\')" title="Effacer la deadline">×</button>';
  }
  h+='</div>';
  if(d.deadline){
    var dl=new Date(d.deadline+'T00:00:00');
    var dlLabel=dl.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
    var daysLeft=Math.round((dl-new Date(todayISO+'T00:00:00'))/86400000);
    var dlHint=daysLeft===0?'aujourd\'hui':(daysLeft===1?'demain':(daysLeft>0?'dans '+daysLeft+' jours':'il y a '+(-daysLeft)+' jours'));
    h+='<div class="nt-deadline-hint">📍 '+dlLabel+' · '+dlHint+'</div>';
  }
  h+='</div>';

  // Tags
  h+='<div class="nt-field">';
  h+='<div class="nt-label">🏷 Tags</div>';
  h+='<div class="nt-tags-row">';
  d.tags.forEach(function(t){
    h+='<span class="nt-tag-chip">#'+_escHtml(t)+'<button onclick="_nt_removeTag(\''+t.replace(/'/g,"\\'")+'\')">&times;</button></span>';
  });
  h+='<input type="text" class="nt-tag-input" placeholder="+ tag (Entrée)" onkeydown="_nt_handleTagKey(event)" />';
  h+='</div></div>';

  h+='</div>'; // end nt-body

  // Footer
  h+='<div class="task-modal-footer" style="justify-content:space-between">';
  h+='<div style="font-size:11px;color:#9ca3af">⌘↵ pour créer · ⎋ pour fermer</div>';
  h+='<div style="display:flex;gap:8px">';
  h+='<button class="task-modal-close-btn" onclick="_closeNewTacheModal()">Annuler</button>';
  h+='<button class="nt-submit" onclick="creerTache(\''+sid+'\')">Créer la tâche</button>';
  h+='</div></div>';

  h+='</div>';
  return h;
}

// Handlers state mutations ─────────────────────────────────────────────
function _nt_setPriority(p){
  if(!_newTacheDraft)return;
  _newTacheDraft.priority=p;
  _rerenderNewTacheModal();
}
function _nt_setDeadline(d){
  if(!_newTacheDraft)return;
  _newTacheDraft.deadline=d||'';
  _rerenderNewTacheModal();
}
function _nt_removeAssignee(nom){
  if(!_newTacheDraft)return;
  _newTacheDraft.assignees=(_newTacheDraft.assignees||[]).filter(function(n){return n!==nom;});
  _rerenderNewTacheModal();
}
function _nt_toggleAssignee(nom){
  if(!_newTacheDraft)return;
  var cur=_newTacheDraft.assignees||[];
  var i=cur.indexOf(nom);
  if(i>=0)cur.splice(i,1); else cur.push(nom);
  _newTacheDraft.assignees=cur;
  // Fermer le picker
  document.querySelectorAll('#nt-assignee-picker').forEach(function(m){m.remove();});
  _rerenderNewTacheModal();
}
function _nt_openAssigneePicker(ev){
  ev.stopPropagation();
  document.querySelectorAll('#nt-assignee-picker').forEach(function(m){m.remove();});
  if(!_newTacheDraft)return;
  var profiles=_taskProfilesList();
  var menu=document.createElement('div');
  menu.className='task-picker-dropdown';
  menu.id='nt-assignee-picker';
  var cur=_newTacheDraft.assignees||[];
  profiles.forEach(function(p){
    var nom=p.nom;
    var active=cur.indexOf(nom)>=0;
    var safe=nom.replace(/'/g,"\\'");
    menu.innerHTML+='<div class="task-picker-item'+(active?' active':'')+'" onclick="_nt_toggleAssignee(\''+safe+'\')">'+_avatarHtml(nom,22)+'<span style="flex:1">'+_escHtml(nom)+'</span>'+(active?'<span style="color:#16a34a;font-weight:700">✓</span>':'')+'</div>';
  });
  _positionPicker(menu,ev.currentTarget||ev.target);
  document.body.appendChild(menu);
  setTimeout(function(){
    document.addEventListener('click',function h(e){
      if(!menu.contains(e.target)){menu.remove();document.removeEventListener('click',h);}
    });
  },10);
}
function _nt_handleTagKey(e){
  if(e.key==='Enter'){
    e.preventDefault();
    var v=(e.target.value||'').trim().replace(/^#/,'');
    if(!v)return;
    if(!_newTacheDraft.tags)_newTacheDraft.tags=[];
    if(_newTacheDraft.tags.indexOf(v)<0)_newTacheDraft.tags.push(v);
    e.target.value='';
    _rerenderNewTacheModal();
  }
}
function _nt_removeTag(t){
  if(!_newTacheDraft)return;
  _newTacheDraft.tags=(_newTacheDraft.tags||[]).filter(function(x){return x!==t;});
  _rerenderNewTacheModal();
}

async function creerTache(sid){
  // Lire les valeurs live des inputs (titre/desc) + le reste depuis le draft
  var titreEl=document.getElementById('new-tache-titre');
  var descEl=document.getElementById('new-tache-desc');
  var titre=(titreEl&&titreEl.value)||(_newTacheDraft&&_newTacheDraft.titre)||'';
  var desc=(descEl&&descEl.value)||(_newTacheDraft&&_newTacheDraft.desc)||'';
  if(!titre||!titre.trim()){toast('Saisissez un titre');if(titreEl)titreEl.focus();return;}
  var draft=_newTacheDraft||{assignees:[],priority:'P2',tags:[],deadline:''};
  var assignees=(draft.assignees||[]).slice();
  var priority=draft.priority||'P2';
  var tags=(draft.tags||[]).slice();
  var deadline=draft.deadline||'';
  var now=new Date();
  var moi=(S.profile&&S.profile.nom)||'';
  if(!S.todos[sid])S.todos[sid]=[];
  var newTask={
    id:'todo_'+Date.now(),
    titre:titre.trim(),
    description:(desc||'').trim(),
    assignees:assignees,
    responsable:assignees[0]||'',
    priority:priority,
    tags:tags,
    deadline:deadline,
    statut:'todo',
    auteur:moi,
    ts:now.toISOString(),
    comments:[]
  };
  S.todos[sid].push(newTask);
  await saveTodos(sid);
  _closeNewTacheModal();
  var studioName=(S.studios[sid]?S.studios[sid].name:sid);
  var prenomCreator=moi.split(' ')[0]||'Quelqu\'un';
  var dlTxt='';
  if(deadline){
    var _dl=new Date(deadline+'T00:00:00');
    dlTxt=' · échéance '+_dl.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
  }
  // Notifs in-app à chaque assigné (hors créateur)
  var others=assignees.filter(function(n){return n && !_namesMatch(n,moi);});
  if(others.length){
    var bodyResp=titre.trim()+dlTxt+(desc?'\n'+desc.trim():'');
    others.forEach(function(nom){
      notifyUserByNom(nom,{type:'statut',studio_id:sid,title:'🎯 '+prenomCreator+' t\'a assigné une tâche — '+studioName,body:bodyResp});
    });
  } else if(!assignees.length){
    notifyAll({type:'statut',studio_id:sid,title:'📌 Nouvelle tâche non assignée — '+studioName,body:titre.trim()+dlTxt});
  }
  // Email fire-and-forget
  if(assignees.length){
    try{sb.functions.invoke('task-notify',{body:{sid:sid,taskId:newTask.id,event:'assigned',actorName:moi}}).catch(function(e){console.warn('[task-notify]',e);});}catch(e){console.warn('[task-notify]',e);}
  }
  S._newlyCreatedTaskId=newTask.id;
  var toastMsg='Tâche créée';
  if(others.length===1)toastMsg+=' — '+others[0].split(' ')[0]+' a été notifié(e)';
  else if(others.length>1)toastMsg+=' — '+others.length+' personnes notifiées';
  toast(toastMsg,3500);
  render();
}

// Cycle le statut : todo → in_progress → done → todo (blocked géré via le modal)
async function toggleTacheStatut(sid,todoId){
  var todos=S.todos[sid]||[];
  var t=todos.find(function(x){return x.id===todoId;});
  if(!t)return;
  var cur=t.statut||'todo';
  if(cur==='vu'||cur==='doing')cur='in_progress';
  var cycle={todo:'in_progress',in_progress:'done',done:'todo',blocked:'todo'};
  var newStatut=cycle[cur]||'todo';
  var wasDone=(newStatut==='done');
  t.statut=newStatut;
  // Pulse animation si on passe en done
  if(wasDone){
    var el=document.querySelector('.task-row[onclick*="'+todoId+'"]')||document.querySelector('.kanban-card[ondragstart*="'+todoId+'"]');
    if(el){el.classList.add('task-completing');setTimeout(function(){el.classList.remove('task-completing');},550);}
  }
  await saveTodos(sid);
  if(wasDone)notifyAll({type:'statut',studio_id:sid,title:'✓ Tâche terminée — '+(S.studios[sid]?S.studios[sid].name:sid),body:t.titre});
  try{
    var moi=(S.profile&&S.profile.nom)||'';
    sb.functions.invoke('task-notify',{body:{sid:sid,taskId:todoId,event:'status_changed',actorName:moi,extra:{statut:t.statut}}}).catch(function(e){console.warn('[task-notify]',e);});
  }catch(e){}
  setTimeout(function(){render();if(document.getElementById('tache-detail-modal'))_rerenderTacheModal(sid,todoId);},wasDone?400:0);
}

function supprimerTache(sid,todoId){
  // Inline confirm dans le footer du modal
  var footer=document.querySelector('.task-modal-footer');
  if(!footer)return;
  if(footer.querySelector('.task-confirm-bar'))return;
  var bar=document.createElement('div');
  bar.className='task-confirm-bar';
  bar.style.width='100%';
  bar.innerHTML='<span class="confirm-label">Supprimer cette tâche ?</span><button class="confirm-yes" onclick="_doDeleteTask(\''+sid+'\',\''+todoId+'\')">Supprimer</button><button class="confirm-no" onclick="this.parentNode.remove()">Annuler</button>';
  footer.appendChild(bar);
}
async function _doDeleteTask(sid,todoId){
  var tache=(S.todos[sid]||[]).find(function(t){return t.id===todoId;});
  var titreTache=tache?tache.titre:'';
  S.todos[sid]=(S.todos[sid]||[]).filter(function(t){return t.id!==todoId;});
  await saveTodos(sid);
  if(titreTache){
    await sb.from('notifications').delete().eq('studio_id',sid).eq('type','statut').ilike('body','%'+titreTache.slice(0,60)+'%');
    S.notifications=S.notifications.filter(function(n){return !(n.studio_id===sid&&n.type==='statut'&&n.body&&n.body.indexOf(titreTache.slice(0,60))>=0);});
  }
  closeTacheModal();
  toast('Tâche supprimée');
  render();
}

// ── Modal détail Notion-style ─────────────────────────────────────────────

function openTacheModal(sid,taskId){
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t)return;
  if(!t.assignees)t.assignees=t.responsable?[t.responsable]:[];
  if(!t.comments)t.comments=[];
  if(!t.priority)t.priority='P2';
  var existing=document.getElementById('tache-detail-modal');
  if(existing)existing.remove();
  var overlay=document.createElement('div');
  overlay.id='tache-detail-modal';
  overlay.className='task-modal-overlay';
  overlay.setAttribute('data-sid',sid);
  overlay.setAttribute('data-tid',taskId);
  overlay.onclick=function(e){if(e.target===overlay)closeTacheModal();};
  overlay.innerHTML=_tacheModalInnerHtml(sid,t);
  document.body.appendChild(overlay);
  setTimeout(function(){
    var titleEl=document.getElementById('task-modal-title');
    if(titleEl && !(t.titre||'').trim())titleEl.focus();
  },80);
}

function closeTacheModal(){
  var m=document.getElementById('tache-detail-modal');
  if(!m)return;
  m.classList.add('closing');
  var done=false;
  function fin(){if(done)return;done=true;m.remove();}
  m.addEventListener('animationend',fin);
  setTimeout(fin,280);
}

function _rerenderTacheModal(sid,taskId){
  var overlay=document.getElementById('tache-detail-modal');
  if(!overlay)return;
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t){closeTacheModal();return;}
  overlay.innerHTML=_tacheModalInnerHtml(sid,t);
}

function _tacheModalInnerHtml(sid,t){
  var readOnly=isViewer();
  var statusMeta=_getStatusMeta(t.statut||'todo');
  var priorityMeta=_getPriorityMeta(t.priority||'P2');
  var assignees=_getAssignees(t);
  var comments=(t.comments||[]).slice().sort(function(a,b){return (a.ts||'').localeCompare(b.ts||'');});
  var studioName=(S.studios[sid]&&S.studios[sid].name)||sid;
  var moi=(S.profile&&S.profile.nom)||'';
  var today=new Date().toISOString().slice(0,10);
  var overdue=t.deadline && t.deadline<today && t.statut!=='done';

  var h='<div class="task-modal-box" onclick="event.stopPropagation()">';
  h+='<div class="task-modal-topbar">';
  h+='<div style="font-size:11px;color:#9ca3af;font-weight:500">'+_escHtml(studioName)+' · Tâche</div>';
  h+='<button onclick="closeTacheModal()" class="task-modal-close" title="Fermer">&times;</button>';
  h+='</div>';

  h+='<div class="task-modal-scroll">';

  var isDone=(t.statut==='done');
  var isDoing=(t.statut==='in_progress'||t.statut==='doing'||t.statut==='vu');
  var isBlocked=(t.statut==='blocked');
  var cbCls='task-checkbox task-checkbox-lg'+(isDone?' done':'')+(isDoing?' doing':'')+(isBlocked?' blocked':'');
  h+='<div class="task-modal-header">';
  h+='<button class="'+cbCls+'" '+(readOnly?'disabled':'onclick="toggleTacheStatut(\''+sid+'\',\''+t.id+'\')"')+' title="Marquer comme fait"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>';
  h+='<div id="task-modal-title" class="task-modal-title'+(isDone?' done':'')+'"'+(t.titre?'':' data-empty="true"')+' '+(readOnly?'':'contenteditable="true"')+' data-placeholder="Titre de la tâche…" oninput="this.dataset.empty=this.innerText.trim()?\'false\':\'true\'" onblur="_updateTacheField(\''+sid+'\',\''+t.id+'\',\'titre\',this.innerText)">'+_escHtml(t.titre||'')+'</div>';
  h+='</div>';

  h+='<div class="task-modal-meta">';

  h+='<div class="task-meta-row"><div class="task-meta-label">Statut</div>';
  h+='<div class="task-meta-value">';
  h+='<button class="task-meta-pill-btn" '+(readOnly?'disabled':'onclick="_toggleTaskStatusMenu(event,\''+sid+'\',\''+t.id+'\')"')+' style="background:'+statusMeta.bg+';color:'+statusMeta.color+'"><span class="task-pill-dot" style="background:'+statusMeta.dot+'"></span>'+statusMeta.label+'</button>';
  h+='</div></div>';

  h+='<div class="task-meta-row"><div class="task-meta-label">Assigné à</div>';
  h+='<div class="task-meta-value"><div class="task-meta-assignees">';
  assignees.forEach(function(nom){
    h+='<span class="task-meta-assignee-chip">'+_avatarHtml(nom,20)+'<span>'+_escHtml(nom)+'</span>'+(readOnly?'':'<button onclick="_toggleAssignee(\''+sid+'\',\''+t.id+'\',\''+nom.replace(/'/g,"\\'")+'\')" title="Retirer">&times;</button>')+'</span>';
  });
  if(!readOnly){
    h+='<button class="task-meta-add-assignee" onclick="_toggleAssigneePicker(event,\''+sid+'\',\''+t.id+'\')">+ Ajouter</button>';
  }
  if(!assignees.length && readOnly){
    h+='<span style="font-size:12px;color:#9ca3af;font-style:italic">Personne</span>';
  }
  h+='</div></div></div>';

  h+='<div class="task-meta-row"><div class="task-meta-label">Priorité</div>';
  h+='<div class="task-meta-value">';
  h+='<button class="task-meta-pill-btn" '+(readOnly?'disabled':'onclick="_toggleTaskPriorityMenu(event,\''+sid+'\',\''+t.id+'\')"')+' style="background:'+priorityMeta.bg+';color:'+priorityMeta.color+'">'+priorityMeta.icon+' '+priorityMeta.label+'</button>';
  h+='</div></div>';

  h+='<div class="task-meta-row"><div class="task-meta-label">Deadline</div>';
  h+='<div class="task-meta-value">';
  if(readOnly){
    h+='<span style="font-size:13px;color:#374151">'+(t.deadline?new Date(t.deadline+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'long',year:'numeric'}):'—')+'</span>';
  } else {
    h+='<input type="date" value="'+(t.deadline||'')+'" onchange="_updateTacheField(\''+sid+'\',\''+t.id+'\',\'deadline\',this.value)" style="padding:6px 10px;border:1px solid #e5e7eb;border-radius:7px;font-size:12px;color:'+(overdue?'#dc2626':'#374151')+';background:'+(overdue?'#fef2f2':'#fff')+';outline:none;font-family:inherit;cursor:pointer" />';
    if(overdue)h+='<span style="font-size:10px;font-weight:600;color:#dc2626;margin-left:6px">⚠ En retard</span>';
  }
  h+='</div></div>';

  h+='<div class="task-meta-row"><div class="task-meta-label">Créée par</div>';
  h+='<div class="task-meta-value"><span style="font-size:12px;color:#6b7280;display:inline-flex;align-items:center;gap:6px">'+_avatarHtml(t.auteur||'?',18)+' '+_escHtml(t.auteur||'—')+' · '+_relTime(t.ts)+'</span></div></div>';

  // Tags row
  h+='<div class="task-meta-row"><div class="task-meta-label">Tags</div>';
  h+='<div class="task-meta-value"><div class="task-meta-tags">';
  (t.tags||[]).forEach(function(tag){
    h+='<span class="task-meta-tag-chip">#'+_escHtml(tag);
    if(!readOnly)h+='<button onclick="event.stopPropagation();_removeTagFromTask(\''+sid+'\',\''+t.id+'\',\''+tag.replace(/'/g,"\\'")+'\')">&times;</button>';
    h+='</span>';
  });
  if(!readOnly){
    h+='<input class="task-meta-tag-input" placeholder="+ tag…" onkeydown="if(event.key===\'Enter\'){event.preventDefault();_addTagToTask(\''+sid+'\',\''+t.id+'\',this.value);this.value=\'\';}" />';
  }
  if(!(t.tags||[]).length && readOnly) h+='<span style="font-size:12px;color:#9ca3af;font-style:italic">Aucun</span>';
  h+='</div></div></div>';

  h+='</div>';

  h+='<div class="task-modal-description">';
  if(readOnly){
    h+='<div style="font-size:13px;color:#374151;white-space:pre-wrap;line-height:1.55">'+(t.description?_escHtml(t.description):'<span style="color:#9ca3af;font-style:italic">Pas de description</span>')+'</div>';
  } else {
    h+='<textarea class="task-modal-description-input" placeholder="Ajoute une description…" oninput="_autosizeTextarea(this)" onblur="_updateTacheField(\''+sid+'\',\''+t.id+'\',\'description\',this.value)">'+_escHtml(t.description||'')+'</textarea>';
  }
  h+='</div>';

  h+='<div class="task-modal-separator"></div>';

  h+='<div class="task-modal-comments">';
  h+='<div class="task-modal-comments-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Commentaires'+(comments.length?' <span style="color:#9ca3af;font-weight:500">('+comments.length+')</span>':'')+'</div>';
  if(!comments.length){
    h+='<div class="task-comments-empty">Aucun commentaire pour le moment.</div>';
  } else {
    comments.forEach(function(c){
      var canDelete=!readOnly && c.auteur===moi;
      h+='<div class="task-comment" data-cmt-id="'+c.id+'">';
      h+='<div style="flex-shrink:0">'+_avatarHtml(c.auteur||'?',32)+'</div>';
      h+='<div class="task-comment-body">';
      h+='<div class="task-comment-header"><span class="task-comment-author">'+_escHtml(c.auteur||'—')+'</span><span class="task-comment-time">'+_relTime(c.ts)+'</span>';
      if(canDelete)h+='<button class="task-comment-delete" onclick="_deleteCommentFromTache(\''+sid+'\',\''+t.id+'\',\''+c.id+'\')" title="Supprimer">&times;</button>';
      h+='</div>';
      // V2 : rendu mentions inline + preserve line breaks
      h+='<div class="task-comment-text">'+_renderMentionsHtml(c.body||'').replace(/\n/g,'<br>')+'</div>';
      // V2 : réactions emoji (chips + bouton add)
      h+='<div class="comment-reactions">';
      var rx=c.reactions||{};
      Object.keys(rx).forEach(function(emoji){
        var users=rx[emoji]||[];
        if(!users.length)return;
        var reacted=users.indexOf(moi)>=0;
        var tip=users.join(', ');
        h+='<button class="reaction-chip'+(reacted?' reacted':'')+'" title="'+_escHtml(tip)+'" onclick="event.stopPropagation();_toggleReaction(\''+sid+'\',\''+t.id+'\',\''+c.id+'\',\''+emoji+'\')">'+emoji+' <span class="reaction-count">'+users.length+'</span></button>';
      });
      if(!readOnly){
        h+='<button class="reaction-add-btn" onclick="event.stopPropagation();_openReactionPicker(event,\''+sid+'\',\''+t.id+'\',\''+c.id+'\')">+ Réagir</button>';
      }
      h+='</div>';
      h+='</div></div>';
    });
  }
  if(!readOnly){
    h+='<div class="task-comment-input-wrap">';
    h+='<div style="flex-shrink:0">'+_avatarHtml(moi,32)+'</div>';
    h+='<div style="flex:1;min-width:0">';
    h+='<textarea id="task-new-comment" class="task-comment-input" placeholder="Ajoute un commentaire… @pour mentionner — Cmd+Entrée pour envoyer" oninput="_autosizeTextarea(this);_handleMentionInput(event,\''+sid+'\',\''+t.id+'\')" onkeydown="_handleCommentKeydown(event,\''+sid+'\',\''+t.id+'\')" onblur="setTimeout(_closeMentionPicker,200)"></textarea>';
    h+='<div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="task-comment-submit" onclick="_submitCommentFromModal(\''+sid+'\',\''+t.id+'\')">Commenter</button></div>';
    h+='</div></div>';
  }
  h+='</div>';

  h+='</div>';

  if(!readOnly){
    h+='<div class="task-modal-footer">';
    h+='<button class="task-modal-delete-btn" onclick="supprimerTache(\''+sid+'\',\''+t.id+'\')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Supprimer</button>';
    h+='<button class="task-modal-close-btn" onclick="closeTacheModal()">Fermer</button>';
    h+='</div>';
  }

  h+='</div>';
  return h;
}

// ── CRUD helpers ─────────────────────────────────────────────────────────

async function updateTache(sid,taskId,patch){
  var todos=S.todos[sid]||[];
  var t=todos.find(function(x){return x.id===taskId;});
  if(!t)return;
  Object.keys(patch).forEach(function(k){t[k]=patch[k];});
  if(patch.assignees)t.responsable=patch.assignees[0]||'';
  await saveTodos(sid);
  render();
  if(document.getElementById('tache-detail-modal'))_rerenderTacheModal(sid,taskId);
}

async function _updateTacheField(sid,taskId,field,value){
  var todos=S.todos[sid]||[];
  var t=todos.find(function(x){return x.id===taskId;});
  if(!t)return;
  var trimmed=(typeof value==='string')?value.trim():value;
  if(field==='titre' && !trimmed){toast('Le titre ne peut pas être vide');_rerenderTacheModal(sid,taskId);return;}
  if(t[field]===trimmed)return;
  t[field]=trimmed;
  await saveTodos(sid);
  render();
}

async function addCommentToTache(sid,taskId,body){
  if(!body||!body.trim())return;
  var todos=S.todos[sid]||[];
  var t=todos.find(function(x){return x.id===taskId;});
  if(!t)return;
  if(!t.comments)t.comments=[];
  var moi=(S.profile&&S.profile.nom)||'';
  var trimmed=body.trim();
  // V2 : parse les @mentions à l'écriture (stables)
  var mentions=(typeof _parseMentions==='function')?_parseMentions(trimmed):[];
  var c={id:'cmt_'+Date.now(),auteur:moi,ts:new Date().toISOString(),body:trimmed,mentions:mentions,reactions:{}};
  t.comments.push(c);
  await saveTodos(sid);
  var studioName=(S.studios[sid]&&S.studios[sid].name)||sid;
  // Notifs in-app aux assignés (hors auteur et hors personnes déjà mentionnées)
  var others=_getAssignees(t).filter(function(n){return n && !_namesMatch(n,moi) && mentions.indexOf(n)<0;});
  if(others.length){
    others.forEach(function(nom){
      notifyUserByNom(nom,{type:'message',studio_id:sid,title:'💬 '+moi.split(' ')[0]+' a commenté — '+studioName,body:t.titre+' : '+trimmed.slice(0,120)});
    });
  }
  // V2 : notifs mentions (in-app + fire-and-forget email via task-notify)
  if(mentions.length){
    mentions.filter(function(n){return n && !_namesMatch(n,moi);}).forEach(function(nom){
      notifyUserByNom(nom,{type:'mention',studio_id:sid,title:'@mention — '+t.titre,body:moi.split(' ')[0]+' t\'a mentionné : "'+trimmed.slice(0,120)+'"'});
    });
    try{sb.functions.invoke('task-notify',{body:{sid:sid,taskId:taskId,event:'mentioned',actorName:moi,extra:{body:trimmed,mentions:mentions}}}).catch(function(e){console.warn('[task-notify mention]',e);});}catch(e){}
  }
  // Email classique "commented" pour les assignés (inchangé V1)
  try{sb.functions.invoke('task-notify',{body:{sid:sid,taskId:taskId,event:'commented',actorName:moi,extra:{body:trimmed}}}).catch(function(e){console.warn('[task-notify]',e);});}catch(e){}
  _rerenderTacheModal(sid,taskId);
  render();
}

function _deleteCommentFromTache(sid,taskId,cmtId){
  // Inline confirm au lieu de window.confirm()
  var cmtEl=document.querySelector('[data-cmt-id="'+cmtId+'"]');
  if(!cmtEl)return;
  if(cmtEl.querySelector('.task-confirm-bar'))return; // déjà affiché
  var bar=document.createElement('div');
  bar.className='task-confirm-bar';
  bar.innerHTML='<span class="confirm-label">Supprimer ce commentaire ?</span><button class="confirm-yes" onclick="_doDeleteComment(\''+sid+'\',\''+taskId+'\',\''+cmtId+'\')">Supprimer</button><button class="confirm-no" onclick="this.parentNode.remove()">Annuler</button>';
  cmtEl.appendChild(bar);
}
async function _doDeleteComment(sid,taskId,cmtId){
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t||!t.comments)return;
  t.comments=t.comments.filter(function(c){return c.id!==cmtId;});
  await saveTodos(sid);
  _rerenderTacheModal(sid,taskId);
  render();
}

function _submitCommentFromModal(sid,taskId){
  var el=document.getElementById('task-new-comment');
  if(!el)return;
  var v=el.value;
  if(!v||!v.trim())return;
  el.value='';
  addCommentToTache(sid,taskId,v);
}

function _handleCommentKeydown(e,sid,taskId){
  if((e.metaKey||e.ctrlKey) && e.key==='Enter'){
    e.preventDefault();
    _submitCommentFromModal(sid,taskId);
  }
}

function _autosizeTextarea(el){
  el.style.height='auto';
  el.style.height=Math.min(el.scrollHeight,400)+'px';
}

// ══════════════════════════════════════════════════════════════════════
// V2 : Mentions @user dans les commentaires
// ══════════════════════════════════════════════════════════════════════

var _mentionInsertPos=-1;   // position dans la textarea où commencer à remplacer (le @)
var _mentionActiveIdx=0;    // index hover/keyboard dans le picker

function _handleMentionInput(ev,sid,taskId){
  var ta=ev.target;
  if(!ta)return;
  var caret=ta.selectionStart;
  var before=ta.value.slice(0,caret);
  // Match un @ en cours de saisie (pas de retour à la ligne, pas plus d'une trentaine de caractères)
  var m=/(^|[\s\n])@([^\s@\n]{0,30})$/.exec(before);
  if(!m){_closeMentionPicker();return;}
  var query=m[2]||'';
  var startPos=caret-query.length-1; // position du @
  _mentionInsertPos=startPos;
  _openMentionPicker(sid,taskId,query,ta);
}

function _openMentionPicker(sid,taskId,query,anchorEl){
  _closeMentionPicker();
  var profiles=(S._allProfiles||[]).filter(function(p){return p&&p.nom;});
  var q=(query||'').toLowerCase().trim();
  var matches=profiles.filter(function(p){
    if(!q)return true;
    return (p.nom||'').toLowerCase().indexOf(q)>=0;
  }).slice(0,6);
  var menu=document.createElement('div');
  menu.className='mention-picker';
  menu.id='mention-picker';
  if(!matches.length){
    menu.innerHTML='<div class="mention-picker-empty">Aucun profil trouvé</div>';
  } else {
    matches.forEach(function(p,i){
      var nom=p.nom||'';
      var avatarUrl=(S.avatarUrls&&S.avatarUrls[nom])||'';
      var initials=nom.split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
      var avatarHtml=avatarUrl
        ?'<img class="mp-avatar" src="'+avatarUrl+'" alt="">'
        :'<div class="mp-avatar-fallback">'+_escHtml(initials)+'</div>';
      var safe=nom.replace(/'/g,"\\'");
      menu.innerHTML+='<div class="mention-picker-item'+(i===0?' active':'')+'" onmousedown="event.preventDefault();_insertMention(\''+safe+'\')">'+avatarHtml+'<div class="mp-name">'+_escHtml(nom)+'</div></div>';
    });
  }
  document.body.appendChild(menu);
  // Positionner sous la textarea
  try{
    var r=anchorEl.getBoundingClientRect();
    var top=r.bottom+window.scrollY+4;
    var left=r.left+window.scrollX;
    // Clamp right
    var mw=menu.offsetWidth||260;
    if(left+mw>window.innerWidth-10)left=window.innerWidth-mw-10;
    menu.style.top=top+'px';
    menu.style.left=left+'px';
  }catch(e){}
  _mentionActiveIdx=0;
}

function _closeMentionPicker(){
  var m=document.getElementById('mention-picker');
  if(m)m.remove();
  _mentionInsertPos=-1;
}

function _insertMention(nom){
  var ta=document.getElementById('task-new-comment');
  if(!ta||_mentionInsertPos<0){_closeMentionPicker();return;}
  var before=ta.value.slice(0,_mentionInsertPos);
  var after=ta.value.slice(ta.selectionStart);
  var insert='@'+nom+' ';
  ta.value=before+insert+after;
  var newCaret=(before+insert).length;
  ta.focus();
  try{ta.setSelectionRange(newCaret,newCaret);}catch(e){}
  _autosizeTextarea(ta);
  _closeMentionPicker();
}

// ══════════════════════════════════════════════════════════════════════
// V2 : Réactions emoji sur commentaires
// ══════════════════════════════════════════════════════════════════════

function _openReactionPicker(ev,sid,taskId,cmtId){
  if(ev&&ev.stopPropagation)ev.stopPropagation();
  _closeAllTaskPickers();
  // Fermer tout reaction-picker déjà ouvert
  document.querySelectorAll('.reaction-picker').forEach(function(m){m.remove();});
  var menu=document.createElement('div');
  menu.className='reaction-picker';
  menu.id='reaction-picker';
  var palette=(typeof TASK_REACTIONS!=='undefined')?TASK_REACTIONS:['👍','❤️','🎉','🚀','👀','😄'];
  palette.forEach(function(e){
    menu.innerHTML+='<button class="reaction-picker-btn" onclick="event.stopPropagation();_toggleReaction(\''+sid+'\',\''+taskId+'\',\''+cmtId+'\',\''+e+'\')">'+e+'</button>';
  });
  document.body.appendChild(menu);
  _positionPicker(menu,ev.currentTarget||ev.target);
  // Outside-click close
  setTimeout(function(){
    document.addEventListener('click',function h(e){
      if(!menu.contains(e.target)){menu.remove();document.removeEventListener('click',h);}
    });
  },10);
}

async function _toggleReaction(sid,taskId,cmtId,emoji){
  var todos=S.todos[sid]||[];
  var t=todos.find(function(x){return x.id===taskId;});
  if(!t||!t.comments)return;
  var c=t.comments.find(function(x){return x.id===cmtId;});
  if(!c)return;
  if(!c.reactions)c.reactions={};
  var moi=(S.profile&&S.profile.nom)||'Moi';
  if(!c.reactions[emoji])c.reactions[emoji]=[];
  var idx=c.reactions[emoji].indexOf(moi);
  var added=false;
  if(idx<0){c.reactions[emoji].push(moi);added=true;}
  else{c.reactions[emoji].splice(idx,1);if(!c.reactions[emoji].length)delete c.reactions[emoji];}
  // Fermer le picker
  document.querySelectorAll('.reaction-picker').forEach(function(m){m.remove();});
  await saveTodos(sid);
  _rerenderTacheModal(sid,taskId);
  // Notif in-app discrète à l'auteur (uniquement sur add, pas sur remove, pas d'email)
  if(added && c.auteur && c.auteur!==moi){
    try{
      notifyUserByNom(c.auteur,{
        type:'reaction',
        studio_id:sid,
        title:emoji+' réaction — '+t.titre,
        body:moi.split(' ')[0]+' a réagi '+emoji+' à : "'+(c.body||'').slice(0,80)+'"'
      });
    }catch(e){}
  }
}

// ── Pickers (status / priority / assignees) ─────────────────────────────

function _toggleTaskStatusMenu(ev,sid,taskId){
  ev.stopPropagation();
  _closeAllTaskPickers();
  var btn=ev.currentTarget;
  var menu=document.createElement('div');
  menu.className='task-picker-dropdown';
  menu.id='task-status-picker';
  ['todo','in_progress','done','blocked'].forEach(function(s){
    var m=_getStatusMeta(s);
    menu.innerHTML+='<div class="task-picker-item" onclick="_setTaskStatus(\''+sid+'\',\''+taskId+'\',\''+s+'\')"><span class="task-pill-dot" style="background:'+m.dot+'"></span>'+m.label+'</div>';
  });
  _positionPicker(menu,btn);
  document.body.appendChild(menu);
  setTimeout(function(){document.addEventListener('click',_closeAllTaskPickers,{once:true});},10);
}

function _toggleTaskPriorityMenu(ev,sid,taskId){
  ev.stopPropagation();
  _closeAllTaskPickers();
  var btn=ev.currentTarget;
  var menu=document.createElement('div');
  menu.className='task-picker-dropdown';
  menu.id='task-priority-picker';
  ['P0','P1','P2','P3'].forEach(function(p){
    var m=_getPriorityMeta(p);
    menu.innerHTML+='<div class="task-picker-item" onclick="_setTaskPriority(\''+sid+'\',\''+taskId+'\',\''+p+'\')"><span style="color:'+m.color+'">'+m.icon+'</span>'+m.label+'</div>';
  });
  _positionPicker(menu,btn);
  document.body.appendChild(menu);
  setTimeout(function(){document.addEventListener('click',_closeAllTaskPickers,{once:true});},10);
}

function _toggleAssigneePicker(ev,sid,taskId){
  ev.stopPropagation();
  _closeAllTaskPickers();
  var btn=ev.currentTarget;
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t)return;
  var current=_getAssignees(t);
  var profiles=_taskProfilesList();
  var menu=document.createElement('div');
  menu.className='task-picker-dropdown';
  menu.id='task-assignee-picker';
  menu.style.minWidth='220px';
  profiles.forEach(function(p){
    var isAssigned=current.indexOf(p.nom)>=0;
    menu.innerHTML+='<div class="task-picker-item'+(isAssigned?' selected':'')+'" onclick="_toggleAssignee(\''+sid+'\',\''+taskId+'\',\''+p.nom.replace(/'/g,"\\'")+'\')">'+_avatarHtml(p.nom,22)+'<span style="flex:1">'+_escHtml(p.nom)+'</span>'+(isAssigned?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':'')+'</div>';
  });
  _positionPicker(menu,btn);
  document.body.appendChild(menu);
  setTimeout(function(){document.addEventListener('click',_closeAllTaskPickers,{once:true});},10);
}

function _positionPicker(menu,anchor){
  var r=anchor.getBoundingClientRect();
  menu.style.position='fixed';
  menu.style.top=(r.bottom+6)+'px';
  menu.style.left=r.left+'px';
  menu.style.zIndex='10100';
}

function _closeAllTaskPickers(){
  ['task-status-picker','task-priority-picker','task-assignee-picker'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.remove();
  });
}

async function _setTaskStatus(sid,taskId,status){
  _closeAllTaskPickers();
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t||t.statut===status)return;
  t.statut=status;
  await saveTodos(sid);
  try{
    var moi=(S.profile&&S.profile.nom)||'';
    sb.functions.invoke('task-notify',{body:{sid:sid,taskId:taskId,event:'status_changed',actorName:moi,extra:{statut:status}}}).catch(function(e){console.warn('[task-notify]',e);});
  }catch(e){}
  render();
  _rerenderTacheModal(sid,taskId);
}

async function _setTaskPriority(sid,taskId,priority){
  _closeAllTaskPickers();
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t||t.priority===priority)return;
  t.priority=priority;
  await saveTodos(sid);
  render();
  _rerenderTacheModal(sid,taskId);
}

async function _toggleAssignee(sid,taskId,nom){
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t)return;
  if(!t.assignees)t.assignees=t.responsable?[t.responsable]:[];
  var idx=t.assignees.indexOf(nom);
  var wasNew=false;
  if(idx>=0){
    t.assignees.splice(idx,1);
  } else {
    t.assignees.push(nom);
    wasNew=true;
  }
  t.responsable=t.assignees[0]||'';
  await saveTodos(sid);
  if(wasNew){
    var moi=(S.profile&&S.profile.nom)||'';
    if(!_namesMatch(nom,moi)){
      var studioName=(S.studios[sid]&&S.studios[sid].name)||sid;
      notifyUserByNom(nom,{type:'statut',studio_id:sid,title:'🎯 '+(moi.split(' ')[0]||'Quelqu\'un')+' t\'a assigné une tâche — '+studioName,body:t.titre});
    }
    try{sb.functions.invoke('task-notify',{body:{sid:sid,taskId:taskId,event:'assigned',actorName:moi,extra:{newAssignee:nom}}}).catch(function(e){console.warn('[task-notify]',e);});}catch(e){}
  }
  _closeAllTaskPickers();
  render();
  _rerenderTacheModal(sid,taskId);
}

async function saveTodos(sid){
  await sb.from('studios').upsert({id:sid+'_todos',data:{todos:S.todos[sid]||[]},updated_at:new Date().toISOString()});
}

var MAP_FILTERS=[
  {id:'default',  label:'Vue générale',    icon:'🗺️', q:null},
  {id:'commerces',label:'Commerces',       icon:'🛍️', q:'commerces restaurants cafés boutiques'},
  {id:'bureaux',  label:'Bureaux & Orgs',  icon:'🏢', q:'bureaux coworking entreprises organisations entreprise'},
  {id:'transports',label:'Transports',     icon:'🚇', q:'métro bus RER station tramway transport'},
  {id:'pilates',  label:'Pilates & Fitness',icon:'🏋️',q:'pilates reformer fitness salle de sport'},
];

function setMapFilter(f){S.mapFilter=f;render();}
function setMapZoom(delta){S.mapZoom=Math.min(19,Math.max(10,S.mapZoom+delta));render();}
async function toggleStreetView(){
  S.mapStreetView=!S.mapStreetView;
  // Si on passe en Street View, utiliser STUDIO_COORDS en priorité puis Nominatim
  if(S.mapStreetView&&S.selectedId&&!S.mapCoords[S.selectedId]){
    var sid=S.selectedId;
    if(STUDIO_COORDS[sid]){
      S.mapCoords[sid]={lat:STUDIO_COORDS[sid].lat,lon:STUDIO_COORDS[sid].lon};
    } else {
      var addr=S.studios[sid]&&S.studios[sid].addr;
      if(addr){
        try{
          var res=await fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(addr)+'&limit=1');
          var data=await res.json();
          if(data&&data[0])S.mapCoords[sid]={lat:parseFloat(data[0].lat),lon:parseFloat(data[0].lon)};
        }catch(e){}
      }
    }
  }
  render();
}

async function updateStudioAddr(sid,newAddr){
  if(!newAddr||!newAddr.trim()){toast('Adresse vide');return;}
  S.studios[sid].addr=newAddr.trim();
  delete S.mapCoords[sid]; // force re-géocodage
  // Vider cache INSEE
  if(typeof _inseePopCache!=='undefined')Object.keys(_inseePopCache).forEach(function(k){if(k.startsWith(sid+'_'))delete _inseePopCache[k];});
  S._editAddr=false;S._editAddrVal=null;
  await saveStudio(sid,S.studios[sid]);
  toast('Adresse mise à jour — relocalisation en cours');
  render();
}
