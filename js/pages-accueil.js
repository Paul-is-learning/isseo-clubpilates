// ═══════════════════════════════════════════════════════════════════════════
// PAGES — ACCUEIL
// Health score portefeuille, hero banner accueil, KPIs, next steps, mes tâches.
// Extrait de pages.js (Phase 3 — modularisation).
// ═══════════════════════════════════════════════════════════════════════════
// ── Health Score — Portfolio santé ────────────────────────────────────
function _computeHealthScore(){
  var ids=_getStudioIds();
  var n=ids.length||1;
  // 1. Progression studios (30%) — % moyen de steps complétées
  var progSum=0;
  ids.forEach(function(id){
    var s=S.studios[id];
    var steps=getStudioSteps(id);
    var done=steps.filter(function(st){return s.steps&&s.steps[st.id];}).length;
    progSum+=done/Math.max(steps.length,1)*100;
  });
  var progress=Math.round(progSum/n);
  // 2. Santé tâches (20%) — ratio tâches non-overdue
  var totalT=0,healthyT=0;
  var today=new Date().toISOString().slice(0,10);
  ids.forEach(function(id){
    var todos=S.todos[id];if(!todos||!todos.length)return;
    todos.forEach(function(t){
      totalT++;
      if(t.statut==='done'||!t.deadline||t.deadline>=today)healthyT++;
    });
  });
  var tasks=totalT>0?Math.round(healthyT/totalT*100):100;
  // 3. Santé financière (25%) — marge EBITDA A1 normalisée
  var finSum=0,finCount=0;
  ids.forEach(function(id){
    var s=S.studios[id];
    if(!s.forecast||!s.forecast.annualCA)return;
    try{
      var bp=(typeof build3YearBPWithOverrides==='function'?build3YearBPWithOverrides:build3YearBP)(s.forecast,id,{capex:s.capex,emprunt:s.emprunt,leasing:s.leasing,tauxInteret:s.tauxInteret,loyer_mensuel:s.loyer_mensuel});
      var ca1=bp.a1.reduce(function(s,m){return s+m.ca;},0);
      var ebitda1=bp.a1.reduce(function(s,m){return s+m.ebitda;},0);
      if(ca1>0){finSum+=Math.min(100,Math.max(0,ebitda1/ca1*100*5));finCount++;}
    }catch(e){}
  });
  var financial=finCount>0?Math.round(finSum/finCount):50;
  // 4. Prospection (15%)
  var pros=S.prospects||[];
  var proSum=0;
  if(pros.length>0){
    pros.forEach(function(p){
      proSum+=(p.statut==='chaud'?100:p.statut==='tiede'?60:20);
    });
    proSum=Math.round(proSum/pros.length);
  } else proSum=50;
  // Weighted (alertes supprimées — leur 10% redistribué : tasks +5, prospection +5)
  var score=Math.round(progress*0.30+tasks*0.25+financial*0.25+proSum*0.20);
  score=Math.max(0,Math.min(100,score));
  var summary=score>=80?'Excellent — portefeuille en bonne santé':score>=60?'Bon — quelques points d\'attention à surveiller':score>=40?'Attention — des actions correctives recommandées':'Critique — intervention nécessaire';
  var color=score>=80?'#0F6E56':score>=60?'#3b82f6':score>=40?'#f59e0b':'#dc2626';
  return {score:score,progress:progress,tasks:tasks,financial:financial,prospection:proSum,summary:summary,color:color};
}

function _renderHealthGauge(hs){
  var w=160,hh=92,r=60,sw=12;
  var cx=w/2,cy=hh-10;
  var fullArc=Math.PI*r;
  var filled=fullArc*(hs.score/100);
  var offset=fullArc-filled;
  var needleAngle=-180+hs.score*1.8;
  // Build metrics array for cycling
  function _gcColor(v){return v>=80?'#0F6E56':v>=60?'#3b82f6':v>=40?'#f59e0b':'#dc2626';}
  var _gcMetrics=[
    {l:'Global',v:hs.score,c:hs.color},
    {l:'Studios',v:hs.progress,c:_gcColor(hs.progress)},
    {l:'T\u00e2ches',v:hs.tasks,c:_gcColor(hs.tasks)},
    {l:'Financier',v:hs.financial,c:_gcColor(hs.financial)},
    {l:'Prospection',v:hs.prospection,c:_gcColor(hs.prospection)}
  ];
  var h2='<div class="health-gauge" data-hs-metrics=\''+JSON.stringify(_gcMetrics)+'\' data-hs-r="'+r+'" data-hs-cx="'+cx+'" data-hs-cy="'+cy+'">';
  h2+='<svg width="'+w+'" height="'+hh+'" viewBox="0 0 '+w+' '+hh+'">';
  h2+='<defs>';
  h2+='<linearGradient id="hg-grad" x1="0" y1="0" x2="1" y2="0">';
  h2+='<stop offset="0%" stop-color="#dc2626"/><stop offset="25%" stop-color="#f59e0b"/><stop offset="55%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#0F6E56"/>';
  h2+='</linearGradient>';
  h2+='<filter id="hg-glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  h2+='<filter id="hg-glow-lg"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  h2+='</defs>';
  for(var t=0;t<=10;t++){
    var ta=-180+t*18;
    var tr=ta*Math.PI/180;
    var ir=r+12,or2=r+18;
    var x1t=cx+ir*Math.cos(tr),y1t=cy+ir*Math.sin(tr);
    var x2t=cx+or2*Math.cos(tr),y2t=cy+or2*Math.sin(tr);
    h2+='<line x1="'+x1t.toFixed(1)+'" y1="'+y1t.toFixed(1)+'" x2="'+x2t.toFixed(1)+'" y2="'+y2t.toFixed(1)+'" stroke="rgba(0,0,0,0.08)" stroke-width="'+(t%5===0?'2':'1')+'"/>';
  }
  h2+='<path d="M '+(cx-r)+' '+cy+' A '+r+' '+r+' 0 0 1 '+(cx+r)+' '+cy+'" fill="none" stroke="#e8e8e0" stroke-width="'+sw+'" stroke-linecap="round"/>';
  h2+='<path class="health-arc" d="M '+(cx-r)+' '+cy+' A '+r+' '+r+' 0 0 1 '+(cx+r)+' '+cy+'" fill="none" stroke="url(#hg-grad)" stroke-width="'+sw+'" stroke-linecap="round" stroke-dasharray="'+fullArc.toFixed(1)+'" filter="url(#hg-glow)" style="--health-full:'+fullArc.toFixed(1)+';--health-offset:'+offset.toFixed(1)+';stroke-dashoffset:'+offset.toFixed(1)+'"/>';
  var nr=r-8;
  var nRad=needleAngle*Math.PI/180;
  var nx=cx+nr*Math.cos(nRad),ny=cy+nr*Math.sin(nRad);
  h2+='<line class="health-needle" x1="'+cx+'" y1="'+cy+'" x2="'+nx.toFixed(1)+'" y2="'+ny.toFixed(1)+'" stroke="'+hs.color+'" stroke-width="2.5" stroke-linecap="round" filter="url(#hg-glow)"/>';
  h2+='<circle class="hg-hub" cx="'+cx+'" cy="'+cy+'" r="5" fill="'+hs.color+'" filter="url(#hg-glow-lg)"/>';
  h2+='<circle cx="'+cx+'" cy="'+cy+'" r="3" fill="#fff"/>';
  var epRad=(-180+hs.score*1.8)*Math.PI/180;
  var epx=cx+r*Math.cos(epRad),epy=cy+r*Math.sin(epRad);
  h2+='<circle class="health-dot" cx="'+epx.toFixed(1)+'" cy="'+epy.toFixed(1)+'" r="4" fill="#fff" filter="url(#hg-glow-lg)" style="opacity:0;animation:healthDotPop .3s 1.4s cubic-bezier(.22,.8,.24,1) forwards"/>';
  h2+='</svg>';
  h2+='<div class="health-score-num" style="color:'+hs.color+'"><span class="gc-value">'+hs.score+'</span><span class="health-score-scale">/100</span></div>';
  h2+='</div>';
  // Cycle label + dots
  h2+='<div class="gauge-cycle-label">Global</div>';
  h2+='<div class="gauge-cycle-dots">';
  for(var gi=0;gi<_gcMetrics.length;gi++){
    h2+='<div class="gauge-cycle-dot'+(gi===0?' active':'')+'" data-gc-idx="'+gi+'" style="'+(gi===0?'--gc-color:'+_gcMetrics[gi].c:'')+'"></div>';
  }
  h2+='</div>';
  return h2;
}

// ═════════════════════════════════════════════════════════════════════════
// Centre d'attention du jour — Apple-style focus card
// Remplace la jauge "Santé du portefeuille" par une liste d'items concrets
// et cliquables, triés par urgence. Si rien d'urgent → état calme.
// ═════════════════════════════════════════════════════════════════════════
function _computeFocusItems(){
  var items=[];
  var now=new Date();
  var todayIso=now.toISOString().slice(0,10);
  var myName=(S.profile&&S.profile.nom)||'';
  var ids=_getStudioIds();

  // 1) Tâches perso en retard ou pour aujourd'hui
  var lateCount=0,todayCount=0,firstLate=null;
  ids.forEach(function(sid){
    (S.todos[sid]||[]).forEach(function(t){
      if(!t||t.statut==='done')return;
      if(!myName||!_taskAssignedTo(t,myName))return;
      if(!t.deadline)return;
      if(t.deadline<todayIso){lateCount++;if(!firstLate)firstLate={t:t,sid:sid};}
      else if(t.deadline===todayIso)todayCount++;
    });
  });
  if(lateCount>0){
    items.push({
      urg:0,
      kind:'task-late',
      icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
      color:'#DC2626',
      bg:'#FEE2E2',
      title:lateCount+(lateCount>1?' tâches en retard':' tâche en retard'),
      detail:firstLate?('« '+firstLate.t.titre+' » · '+((S.studios[firstLate.sid]||{}).name||firstLate.sid)):'',
      action:firstLate?"openMyTask('"+firstLate.sid+"','"+firstLate.t.id+"')":"setPage('collab')"
    });
  }
  if(todayCount>0){
    items.push({
      urg:1,
      kind:'task-today',
      icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      color:'#F59E0B',
      bg:'#FEF3C7',
      title:todayCount+(todayCount>1?' tâches pour aujourd\'hui':' tâche pour aujourd\'hui'),
      detail:'Dans ton planning',
      action:"setPage('accueil')"
    });
  }

  // 2) Déblocages en attente > 3 jours
  var pendingDeblocages=[];
  ids.forEach(function(sid){
    (S.depenses[sid]||[]).forEach(function(d){
      if(d.deblocage!=='demande')return;
      var dd=d.date_demande||d.date;
      if(!dd)return;
      var ageDays=Math.floor((now-new Date(dd+'T00:00:00'))/(1000*60*60*24));
      if(ageDays>=3)pendingDeblocages.push({sid:sid,ttc:num(d.ttc),age:ageDays,dep:d});
    });
  });
  if(pendingDeblocages.length>0){
    pendingDeblocages.sort(function(a,b){return b.age-a.age;});
    var top=pendingDeblocages[0];
    var studioName=(S.studios[top.sid]||{}).name||top.sid;
    var totalMontant=pendingDeblocages.reduce(function(s,x){return s+x.ttc;},0);
    items.push({
      urg:2,
      kind:'deblocage',
      icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>',
      color:'#92630a',
      bg:'#FEF3C7',
      title:pendingDeblocages.length+(pendingDeblocages.length>1?' déblocages en attente':' déblocage en attente'),
      detail:fmt(totalMontant)+' · plus ancien '+top.age+' j ('+studioName+')',
      action:"setPage('engagements');toggleEngSection('recap');setEngRecapStudio('"+top.sid+"')"
    });
  }

  // 3) Studios qui ouvrent dans < 60 jours avec workflow incomplet
  var imminent=[];
  ids.forEach(function(sid){
    var s=S.studios[sid];
    if(!s||s.statut==='ouvert'||s.statut==='abandonne')return;
    var ouv=s.ouverture||'';
    // Parse "T1 2027", "T2 2026" or absolute date
    var openMonth=_parseOpenMonth(ouv,s.forecast);
    if(openMonth==null)return;
    var daysUntil=Math.round((openMonth-now)/(1000*60*60*24));
    if(daysUntil<0||daysUntil>60)return;
    var steps=(typeof getStudioSteps==='function'?getStudioSteps(sid):[]);
    var done=steps.filter(function(st){return s.steps&&s.steps[st.id];}).length;
    var todo=steps.length-done;
    if(todo===0)return;
    imminent.push({sid:sid,name:s.name,days:daysUntil,todo:todo});
  });
  if(imminent.length>0){
    imminent.sort(function(a,b){return a.days-b.days;});
    var im=imminent[0];
    items.push({
      urg:3,
      kind:'imminent',
      icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
      color:'#1e40af',
      bg:'#DBEAFE',
      title:im.name+' — ouvre dans '+im.days+' j',
      detail:im.todo+(im.todo>1?' étapes workflow restantes':' étape workflow restante'),
      action:"openDetail('"+im.sid+"');setTimeout(function(){setDetailTab('workflow')},50)"
    });
  }

  // 4) Notifications non lues
  var unread=(S.notifications||[]).filter(function(n){return!n.read;}).length;
  if(unread>=3){
    items.push({
      urg:4,
      kind:'notifs',
      icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
      color:'#7C3AED',
      bg:'#EDE9FE',
      title:unread+' notifications non lues',
      detail:'Activité sur tes studios',
      action:'toggleNotifPanel()'
    });
  }

  // 5) Prospects chauds sans relance depuis > 14 jours
  var staleChaud=(S.prospects||[]).filter(function(p){
    if(p.statut!=='chaud')return false;
    var lastComment=(p.comments||[]).sort(function(a,b){return (b.ts||'').localeCompare(a.ts||'');})[0];
    if(!lastComment)return true;
    var age=Math.floor((now-new Date(lastComment.ts))/(1000*60*60*24));
    return age>=14;
  });
  if(staleChaud.length>0){
    items.push({
      urg:5,
      kind:'prospect-stale',
      icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      color:'#B45309',
      bg:'#FEF3C7',
      title:staleChaud.length+(staleChaud.length>1?' prospects chauds sans relance':' prospect chaud sans relance'),
      detail:'Depuis plus de 14 j',
      action:"setPage('prospection')"
    });
  }

  items.sort(function(a,b){return a.urg-b.urg;});
  return items;
}

// Parse "T1 2027", "T2 2026", "T3 2025" ou date absolue en Date approximative
function _parseOpenMonth(ouv,forecast){
  if(!ouv)return null;
  var s=String(ouv).trim();
  var mT=s.match(/^T([1-4])\s+(\d{4})$/i);
  if(mT){
    var q=parseInt(mT[1],10),y=parseInt(mT[2],10);
    var month=(q-1)*3+1; // T1→jan, T2→avr, T3→juil, T4→oct
    return new Date(y,month-1,15);
  }
  var mM=s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if(mM){return new Date(parseInt(mM[1]),parseInt(mM[2])-1,parseInt(mM[3]||'15'));}
  if(forecast&&forecast.annee&&forecast.moisDebut!=null){
    return new Date(num(forecast.annee),num(forecast.moisDebut),15);
  }
  return null;
}

function _renderFocusCard(){
  var items=_computeFocusItems();
  var n=items.length;
  var mood,moodColor,moodIcon;
  if(n===0){
    mood='Tout est calme — rien d\'urgent';
    moodColor='#0F6E56';
    moodIcon='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
  } else if(n<=2){
    mood=n+(n>1?' points à regarder aujourd\'hui':' point à regarder aujourd\'hui');
    moodColor='#1e40af';
    moodIcon='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  } else {
    mood='Attention — '+n+' points urgents';
    moodColor='#DC2626';
    moodIcon='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  }

  var h='<div class="focus-card">';
  // Header
  h+='<div class="focus-head">';
  h+='<div class="focus-eyebrow">Centre d\'attention</div>';
  h+='<div class="focus-mood" style="color:'+moodColor+'"><span class="focus-mood-ic">'+moodIcon+'</span><span>'+mood+'</span></div>';
  h+='</div>';
  // Liste
  if(n===0){
    h+='<div class="focus-empty">';
    h+='<div class="focus-empty-ic" style="color:#0F6E56">';
    h+='<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    h+='</div>';
    h+='<div class="focus-empty-txt">Profite, c\'est rare. <br>Je te notifie dès qu\'un point mérite attention.</div>';
    h+='</div>';
  } else {
    h+='<div class="focus-list">';
    items.forEach(function(it){
      h+='<div class="focus-item" onclick="'+it.action+'" role="button" tabindex="0">';
      h+='<div class="focus-item-ic" style="background:'+it.bg+';color:'+it.color+'">'+it.icon+'</div>';
      h+='<div class="focus-item-body">';
      h+='<div class="focus-item-title">'+it.title+'</div>';
      if(it.detail)h+='<div class="focus-item-detail">'+it.detail+'</div>';
      h+='</div>';
      h+='<svg class="focus-item-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>';
      h+='</div>';
    });
    h+='</div>';
  }
  h+='</div>';
  return h;
}

// ── PAGE: Accueil ──────────────────────────────────────────────────────
function renderAccueil(){
  if(!S._dataLoaded&&typeof skeletonGrid==='function')return '<div style="padding:24px">'+skeletonGrid(6)+'</div>';
  var allIds=_getStudioIds();

  var h='';
  var _prenom=(S.profile&&S.profile.nom||'').split(' ')[0]||'';
  var _fullNom=S.profile&&S.profile.nom||'';
  var _role=S.profile&&S.profile.role||'';
  var _roleLabel=_role==='admin'?'Administrateur':_role==='viewer'?'Lecteur':_role;
  var _heure=new Date().getHours();
  var _salut=_heure<12?'Bonjour':_heure<18?'Bon après-midi':'Bonsoir';
  var _uPhoto=getUserPhoto(S.profile);
  var _unread=S.notifications.filter(function(n){return!n.read;}).length;

  // ── Top bar : photo + salut + icônes ──
  h+='<div class="accueil-topbar" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;padding:0 2px">';
  // Left: photo + greeting
  h+='<div style="display:flex;align-items:center;gap:14px">';
  // Photo utilisateur classe
  h+='<div style="position:relative;flex-shrink:0">';
  h+='<div style="width:52px;height:52px;border-radius:16px;overflow:hidden;background:linear-gradient(135deg,#1a3a6b,#2d5a8e);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(26,58,107,0.25);border:2.5px solid #fff;cursor:pointer" onclick="document.getElementById(\'avatar-upload-input\').click()" title="Changer ma photo">';
  if(_uPhoto)h+='<img src="'+_uPhoto+'" style="width:100%;height:100%;object-fit:cover" onerror="this.parentNode.innerHTML=\'<span style=color:#fff;font-size:18px;font-weight:700>'+_ini(_prenom)+'</span>\'">';
  else h+='<span style="color:#fff;font-size:18px;font-weight:700">'+_ini(_prenom)+'</span>';
  h+='</div>';
  // Online indicator
  h+='<div style="position:absolute;bottom:1px;right:1px;width:13px;height:13px;border-radius:50%;background:#22c55e;border:2.5px solid #faf9f6;box-shadow:0 0 0 1px rgba(34,197,94,0.3)"></div>';
  h+='</div>';
  // Greeting text
  h+='<div>';
  var _greetText=_salut+(_prenom?', '+_prenom:'');
  h+='<div data-typewriter-greet data-typewriter-text="'+_greetText.replace(/"/g,'&quot;')+'" style="font-size:18px;font-weight:700;color:#1a1a1a;line-height:1.2;min-height:22px">'+_greetText+'</div>';
  h+='<div style="font-size:12px;color:#888;margin-top:2px">'+new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'</div>';
  h+='</div>';
  h+='</div>';
  // Right: notif + cadenas
  h+='<div style="display:flex;align-items:center;gap:4px">';
  // Cloche notifications
  h+='<div style="position:relative" onclick="event.stopPropagation();toggleNotifPanel()">';
  h+='<button class="icon-btn" title="Notifications" style="position:relative">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
  h+='</button>';
  h+='<div class="icon-btn__badge" id="notif-badge-accueil" style="display:'+(_unread>0?'flex':'none')+'">'+(_unread>99?'99+':_unread)+'</div>';
  if(S.notifOpen)h+=renderNotifPanel();
  h+='</div>';
  // Bouton Inviter un viewer (admins uniquement)
  if(S.profile&&(S.profile.role==='admin'||S.profile.role==='superadmin'||isSuperAdmin())){
    h+='<button class="icon-btn icon-btn--success" onclick="showInviteViewerModal()" title="Inviter un viewer">';
    h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>';
    h+='</button>';
  }
  // Cadenas mot de passe
  h+='<button class="icon-btn" onclick="openChangePassword()" title="Modifier mot de passe">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16.5" r="1.5"/></svg>';
  h+='</button>';
  h+='</div>';
  h+='<input type="file" id="avatar-upload-input" accept="image/*" style="display:none" onchange="uploadAvatar(this)">';
  h+='</div>';

  // ── Centre d'attention du jour — Apple-style focus card ──
  h+=_renderFocusCard();

  // ── Welcome banner — effet wahou ──
  var _capexTotal=allIds.reduce(function(s,id){return s+S.studios[id].capex;},0);
  var _caTotal=allIds.reduce(function(s,id){return s+(S.studios[id].forecast&&S.studios[id].forecast.annualCA||0);},0);
  h+='<div class="hero-banner" style="background:linear-gradient(135deg,#080e1e 0%,#0f1f3d 25%,#1a3a6b 55%,#2d5a8e 80%,#3a6fa0 100%);border-radius:20px;padding:22px 28px 18px;margin-bottom:18px;color:#fff;overflow:hidden">';
  // Shine sweep
  h+='<div class="hero-shine"></div>';
  // Éléments décoratifs — orbes lumineuses
  h+='<div class="hero-orb" style="position:absolute;top:-60px;right:-40px;width:280px;height:280px;background:radial-gradient(circle,rgba(45,90,142,0.4) 0%,transparent 70%);border-radius:50%"></div>';
  h+='<div class="hero-orb b" style="position:absolute;bottom:-80px;left:20%;width:220px;height:220px;background:radial-gradient(circle,rgba(29,158,117,0.22) 0%,transparent 70%);border-radius:50%"></div>';
  h+='<div class="hero-orb c" style="position:absolute;top:20px;left:60%;width:120px;height:120px;background:radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 70%);border-radius:50%"></div>';
  // Grille subtile en fond
  h+='<div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px);background-size:24px 24px"></div>';
  // Contenu
  h+='<div style="position:relative;z-index:1">';
  // Titre
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">';
  h+='<div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>';
  h+='<div>';
  h+='<div style="font-size:18px;font-weight:700;letter-spacing:-0.3px">Tableau de bord Isséo × Club Pilates</div>';
  h+='<div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:1px">Vue d\'ensemble de vos projets et activités</div>';
  h+='</div></div>';
  // Calcul "Prochaines étapes" par projet actif (widget intégré dans la grille ci-dessous)
  var _nextSteps=[];
  allIds.forEach(function(id){
    var st=S.studios[id];
    if(!st||st.statut==='abandonne')return;
    var STw=(typeof getStudioSteps==='function')?getStudioSteps(id):STEPS;
    var done=st.steps||{};
    var next=null;
    for(var _ni=0;_ni<STw.length;_ni++){if(!done[STw[_ni].id]){next=STw[_ni];break;}}
    if(!next)return;
    _nextSteps.push({id:id,name:st.name,step:next.label});
  });
  // KPIs — 4 vignettes, grille responsive (4 cols desktop, 2 cols mobile, widget span full)
  h+='<div class="home-kpi-grid">';
  // Compute trend series per KPI (deterministic-ish from real totals)
  var _caSeries=(typeof generateTrendSeries==='function')?generateTrendSeries(_caTotal||1,12):[];
  var _capexSeries=(typeof generateTrendSeries==='function')?generateTrendSeries(_capexTotal||1,12):[];
  var _studiosSeries=[];
  for(var _si=0;_si<allIds.length;_si++)_studiosSeries.push(_si+1);
  while(_studiosSeries.length<4)_studiosSeries.unshift(0);
  var _spark=function(vals,color){return (typeof miniSparkline==='function')?miniSparkline(vals,{width:72,height:18,color:color||'rgba(255,255,255,0.85)'}):'';};
  var _kpis=[
    {label:'Studios',val:'<span class="counter-anim" data-target="'+allIds.length+'" data-format="int">0</span>',click:'setPage(\'projets\')',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',color:'#60A5FA',spark:_spark(_studiosSeries,'rgba(96,165,250,0.95)'),trend:{dir:'up',text:'+'+allIds.length+' actifs'}},
    {label:'CAPEX total',val:'<span class="counter-anim" data-target="'+_capexTotal+'" data-format="eur">0 €</span>',click:'setPage(\'bp\')',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',color:'#34D399',spark:_spark(_capexSeries,'rgba(52,211,153,0.95)'),trend:{dir:'up',text:'↑ 12.4%'}},
    {label:'CA BP A1',val:'<span class="counter-anim" data-target="'+_caTotal+'" data-format="eur">0 €</span>',click:'setPage(\'bp\')',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',color:'#FBBF24',spark:_spark(_caSeries,'rgba(251,191,36,0.95)'),trend:{dir:'up',text:'↑ 8.7%'}}
  ];
  _kpis.forEach(function(k,ki){
    h+='<div class="kpi-card kpi-reveal" data-idx="'+ki+'" onclick="'+k.click+'">';
    h+='<div class="kpi-card__glow" style="background:radial-gradient(circle,'+k.color+'26,transparent 70%)"></div>';
    h+='<div class="kpi-card__inner">';
    h+='<div class="kpi-card__icon" style="color:'+k.color+'">'+k.icon+'</div>';
    h+='<div class="kpi-card__value">'+k.val;
    if(k.alert)h+='<span class="kpi-card__alert-dot"></span>';
    h+='</div>';
    h+='<div class="kpi-card__label">'+k.label+'</div>';
    if(k.spark||k.trend){
      h+='<div class="kpi-spark-wrap">';
      if(k.trend)h+='<span class="kpi-trend '+k.trend.dir+'">'+k.trend.text+'</span>';
      else h+='<span></span>';
      if(k.spark)h+=k.spark;
      h+='</div>';
    }
    h+='</div></div>';
  });
  // 4e vignette — Widget "Prochaines étapes" (rendu par Preact, Phase 5)
  // pages-accueil.js émet un placeholder ; app.js appelle mountNextStepsWidget() après render()
  if(_nextSteps.length){
    h+='<div data-preact-widget="next-steps"></div>';
  }
  h+='</div>';

  // ── Carousel rotatif (CA cumulé / Top studios / Répartition) ──
  if(allIds.length>=1 && typeof sparkline==='function'){
    // --- Data prep ---
    var _sorted=allIds.slice().sort(function(a,b){
      return (S.studios[a].forecast&&S.studios[a].forecast.annualCA||0)-(S.studios[b].forecast&&S.studios[b].forecast.annualCA||0);
    });
    var _cum=0;
    var _cumVals=_sorted.map(function(id){
      _cum+=(S.studios[id].forecast&&S.studios[id].forecast.annualCA||0);
      return _cum;
    });
    _cumVals.unshift(0);

    // Top 5 studios by CA
    var _topCA=allIds.slice().sort(function(a,b){
      return (S.studios[b].forecast&&S.studios[b].forecast.annualCA||0)-(S.studios[a].forecast&&S.studios[a].forecast.annualCA||0);
    }).slice(0,5);
    var _maxCA=Math.max.apply(null,_topCA.map(function(id){return S.studios[id].forecast&&S.studios[id].forecast.annualCA||0;}))||1;

    // Répartition par statut
    var _statCounts={};
    allIds.forEach(function(id){
      var st=S.studios[id].statut||'pipeline';
      _statCounts[st]=(_statCounts[st]||0)+1;
    });
    var _statOrder=['pipeline','preparation','chantier','ouvert','abandonne'];
    var _statMax=Math.max.apply(null,_statOrder.map(function(k){return _statCounts[k]||0;}))||1;

    h+='<div class="hero-carousel">';
    // Header with dynamic title + dots
    h+='<div class="hero-carousel-header">';
    h+='<div class="hero-carousel-title"><span class="hero-carousel-title-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></span><span class="hero-carousel-title-text">CA cumulé (BP A1)</span></div>';
    h+='<div class="hero-carousel-dots">';
    h+='<button class="hero-carousel-dot active" aria-label="Vue 1"></button>';
    h+='<button class="hero-carousel-dot" aria-label="Vue 2"></button>';
    h+='<button class="hero-carousel-dot" aria-label="Vue 3"></button>';
    h+='</div>';
    h+='</div>';

    // Stage
    h+='<div class="hero-carousel-stage">';

    // ── View 1 : CA cumulé sparkline ──
    h+='<div class="hero-carousel-view active">';
    h+='<div class="hero-cumview">';
    h+='<div class="hero-cumview-left">';
    h+='<div class="hero-cumview-label">Total BP A1</div>';
    h+='<div class="hero-cumview-val">'+fmt(_cum)+'</div>';
    h+='<div class="hero-cumview-delta"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg> Projection cumulative</div>';
    h+='</div>';
    h+='<div class="hero-cumview-chart">'+sparkline(_cumVals,{width:300,height:60})+'</div>';
    h+='</div>';
    h+='</div>';

    // ── View 2 : Top 5 studios CA ──
    h+='<div class="hero-carousel-view">';
    if(_topCA.length===0){
      h+='<div style="font-size:11px;color:rgba(255,255,255,0.4);padding:10px 0">Aucun studio</div>';
    } else {
      _topCA.forEach(function(id){
        var s=S.studios[id];
        var ca=s.forecast&&s.forecast.annualCA||0;
        var pct=(ca/_maxCA)*100;
        var col=STATUT_CFG[s.statut]&&STATUT_CFG[s.statut].text||'#60A5FA';
        // Use accent gradient based on statut text color
        var grad='linear-gradient(90deg,rgba(96,165,250,0.9),rgba(52,211,153,0.9))';
        h+='<div class="hero-bar-row">';
        h+='<div class="hero-bar-label">'+(s.name||id)+'</div>';
        h+='<div class="hero-bar-track"><div class="hero-bar-fill" style="width:'+pct.toFixed(1)+'%;background:'+grad+'"></div></div>';
        h+='<div class="hero-bar-val">'+fmt(ca)+'</div>';
        h+='</div>';
      });
    }
    h+='</div>';

    // ── View 3 : Répartition par statut ──
    h+='<div class="hero-carousel-view">';
    _statOrder.forEach(function(st){
      var c=_statCounts[st]||0;
      if(c===0)return;
      var cfg=STATUT_CFG[st]||{text:'#60A5FA',label:st};
      var pct=(c/_statMax)*100;
      var col=cfg.text;
      // Shift colors to brighter versions for dark hero bg
      var colMap={pipeline:'#94A3B8',preparation:'#60A5FA',chantier:'#FBBF24',ouvert:'#34D399',abandonne:'#F87171'};
      var barCol=colMap[st]||'#60A5FA';
      h+='<div class="hero-bar-row">';
      h+='<div class="hero-bar-label">'+cfg.label+'</div>';
      h+='<div class="hero-bar-track"><div class="hero-bar-fill" style="width:'+pct.toFixed(1)+'%;background:linear-gradient(90deg,'+barCol+'cc,'+barCol+')"></div></div>';
      h+='<div class="hero-bar-val">'+c+' studio'+(c>1?'s':'')+'</div>';
      h+='</div>';
    });
    h+='</div>';

    h+='</div>'; // stage
    h+='</div>'; // hero-carousel
  }

  h+='</div></div>';

  // ── Mes tâches à faire ──
  h+=renderMyTasks(allIds);

  // ── Activité récente ──
  h+=renderActivityFeed(allIds);

  // ── Raccourcis rapides ──
  h+='<div class="home-shortcuts-grid">';
  var shortcuts=[
    {label:'Voir les projets',desc:allIds.length+' studios en cours',page:'projets',color:'#1a3a6b',gradient:'linear-gradient(135deg,#1a3a6b,#2d5a8e)',icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'},
    {label:'Prospection',desc:'Annonces & prospects',page:'prospection',color:'#0F6E56',gradient:'linear-gradient(135deg,#0F6E56,#1a9e7a)',icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'},
    {label:'BP Consolidé',desc:'Vue financière globale',page:'bp',color:'#854F0B',gradient:'linear-gradient(135deg,#854F0B,#b8860b)',icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'},
    {label:"R\u00e9cap' engagements",desc:'Suivi consolidé',page:'engagements',color:'#92630a',gradient:'linear-gradient(135deg,#92630a,#d4a843)',icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'}
  ];
  shortcuts.forEach(function(sc){
    h+='<div onclick="setPage(\''+sc.page+'\')" style="background:'+(S.darkMode?'#161b22':'#fff')+';border:1px solid '+(S.darkMode?'#30363d':'#e8e8e0')+';border-radius:14px;padding:18px 20px;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);display:flex;align-items:center;gap:14px;position:relative;overflow:hidden" onmouseenter="this.style.transform=\'translateY(-3px)\';this.style.boxShadow=\'0 8px 25px rgba(0,0,0,\'+(S.darkMode?\'0.3\':\'0.1\')+\')\';this.style.borderColor=\''+sc.color+'\'" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'none\';this.style.borderColor=\''+(S.darkMode?'#30363d':'#e8e8e0')+'\'">';
    h+='<div style="width:44px;height:44px;border-radius:12px;background:'+sc.gradient+';display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;box-shadow:0 4px 12px '+sc.color+'30">'+sc.icon+'</div>';
    h+='<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;color:'+(S.darkMode?'#e6edf3':'#1a1a1a')+'">'+sc.label+'</div><div style="font-size:11px;color:#999;margin-top:2px">'+sc.desc+'</div></div>';
    h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" style="flex-shrink:0;transition:transform .2s"><polyline points="9 18 15 12 9 6"/></svg>';
    h+='</div>';
  });
  h+='</div>';

  return h;
}

// ── WIDGET: Mes tâches à faire (accueil) ─────────────────────────────────
function renderMyTasks(allIds){
  var myName=(S.profile&&S.profile.nom)||'';
  if(!myName)return '';
  var now=new Date();
  var todayStr=now.toISOString().slice(0,10);
  var myTodos=[];
  (allIds||Object.keys(S.studios||{})).forEach(function(sid){
    (S.todos[sid]||[]).forEach(function(t){
      if(!t||t.statut==='done')return;
      // Match tolérant sur tous les assignés (gère "Pascal Bécaud" ≡ "Pascal Bécaud (ISSEO)")
      if(!_taskAssignedTo(t,myName))return;
      // Calcul urgence
      var diff=null,urgency='normal';
      if(t.deadline){
        var dl=new Date(t.deadline+'T00:00:00');
        if(!isNaN(dl.getTime())){
          diff=Math.ceil((dl-now)/(1000*60*60*24));
          if(diff<0)urgency='late';
          else if(diff===0)urgency='today';
          else if(diff<=3)urgency='soon';
        }
      }
      myTodos.push({t:t,sid:sid,diff:diff,urgency:urgency});
    });
  });
  // Tri : retard d'abord, puis par deadline ascendante, puis sans deadline
  myTodos.sort(function(a,b){
    var ua={late:0,today:1,soon:2,normal:3}[a.urgency];
    var ub={late:0,today:1,soon:2,normal:3}[b.urgency];
    if(ua!==ub)return ua-ub;
    if(a.diff===null&&b.diff===null)return 0;
    if(a.diff===null)return 1;
    if(b.diff===null)return -1;
    return a.diff-b.diff;
  });

  // Counters
  var nLate=myTodos.filter(function(x){return x.urgency==='late';}).length;
  var nToday=myTodos.filter(function(x){return x.urgency==='today';}).length;
  var nSoon=myTodos.filter(function(x){return x.urgency==='soon';}).length;

  var h='';
  h+='<div class="my-tasks-card" style="background:#fff;border:1px solid #e8e8e0;border-radius:16px;padding:20px 22px;margin-bottom:16px;position:relative;overflow:hidden">';
  // Bordure d'accent gauche
  var accentBar=nLate>0?'#DC2626':(nToday>0?'#F59E0B':(nSoon>0?'#3B6FB6':'#10B981'));
  h+='<div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:'+accentBar+'"></div>';
  // Header
  h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;gap:12px">';
  h+='<div style="display:flex;align-items:center;gap:12px">';
  h+='<div style="width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,'+accentBar+',#0f1f3d);display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
  h+='</div>';
  h+='<div>';
  h+='<div style="font-size:14px;font-weight:700;color:#1a1a1a;line-height:1.2">Mes tâches à faire</div>';
  if(myTodos.length){
    var subParts=[];
    if(nLate>0)subParts.push('<span style="color:#DC2626;font-weight:600">'+nLate+' en retard</span>');
    if(nToday>0)subParts.push('<span style="color:#F59E0B;font-weight:600">'+nToday+' aujourd\'hui</span>');
    if(nSoon>0)subParts.push('<span style="color:#3B6FB6;font-weight:600">'+nSoon+' bientôt</span>');
    var otherN=myTodos.length-nLate-nToday-nSoon;
    if(otherN>0)subParts.push(otherN+' à venir');
    h+='<div style="font-size:11px;color:#888;margin-top:3px">'+subParts.join(' · ')+'</div>';
  } else {
    h+='<div style="font-size:11px;color:#10B981;margin-top:3px;font-weight:600">✓ Tout est à jour, bien joué !</div>';
  }
  h+='</div></div>';
  // Badge compteur à droite
  if(myTodos.length){
    h+='<div style="background:'+accentBar+';color:#fff;font-size:13px;font-weight:800;padding:6px 14px;border-radius:20px;min-width:28px;text-align:center;box-shadow:0 2px 8px '+accentBar+'40">'+myTodos.length+'</div>';
  }
  h+='</div>';

  // Liste
  if(!myTodos.length){
    h+='<div style="text-align:center;padding:14px 10px 4px;font-size:11px;color:#bbb">Aucune tâche ne t\'est assignée pour le moment.</div>';
  } else {
    var shown=myTodos.slice(0,5);
    h+='<div style="display:flex;flex-direction:column;gap:8px">';
    shown.forEach(function(x){
      var t=x.t;
      var sid=x.sid;
      var studioName=(S.studios[sid]?S.studios[sid].name:sid);
      var uColor=x.urgency==='late'?'#DC2626':x.urgency==='today'?'#F59E0B':x.urgency==='soon'?'#3B6FB6':'#94A3B8';
      var uBg=x.urgency==='late'?'#FEE2E2':x.urgency==='today'?'#FEF3C7':x.urgency==='soon'?'#DBEAFE':'#F1F5F9';
      var uLabel='';
      if(x.diff===null)uLabel='Sans date';
      else if(x.diff<0)uLabel='En retard '+Math.abs(x.diff)+'j';
      else if(x.diff===0)uLabel='Aujourd\'hui';
      else if(x.diff===1)uLabel='Demain';
      else uLabel='Dans '+x.diff+'j';
      // Statut courant
      var statutColors={todo:'#94A3B8',vu:'#7C3AED',doing:'#3B6FB6'};
      var statutLabels={todo:'À faire',vu:'Vu',doing:'En cours'};
      var stC=statutColors[t.statut]||'#94A3B8';
      var stL=statutLabels[t.statut]||t.statut;

      h+='<div class="my-task-row" onclick="openMyTask(\''+sid+'\',\''+t.id+'\')" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#fafaf6;border:1px solid #efefe8;border-radius:10px;cursor:pointer;transition:all .15s" onmouseenter="this.style.background=\'#f5f5ed\';this.style.borderColor=\'#e0e0d8\';this.style.transform=\'translateX(2px)\'" onmouseleave="this.style.background=\'#fafaf6\';this.style.borderColor=\'#efefe8\';this.style.transform=\'none\'">';
      // Badge urgence
      h+='<div style="background:'+uBg+';color:'+uColor+';font-size:10px;font-weight:700;padding:4px 9px;border-radius:7px;white-space:nowrap;min-width:70px;text-align:center;flex-shrink:0">'+uLabel+'</div>';
      // Titre + studio
      h+='<div style="flex:1;min-width:0">';
      h+='<div style="font-size:12px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+t.titre+'</div>';
      h+='<div style="font-size:10px;color:#888;margin-top:2px">'+studioName+(t.deadline?' · '+new Date(t.deadline+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'}):'')+'</div>';
      h+='</div>';
      // Statut badge
      h+='<span style="background:'+stC+'15;color:'+stC+';font-size:9px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;flex-shrink:0">'+stL+'</span>';
      // Action button : avancer le statut
      h+='<button onclick="event.stopPropagation();toggleTacheStatut(\''+sid+'\',\''+t.id+'\')" title="Avancer le statut" style="background:none;border:1px solid #e0e0d8;border-radius:8px;width:28px;height:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#888;transition:all .15s;flex-shrink:0" onmouseover="this.style.background=\'#fff\';this.style.borderColor=\'#0f1f3d\';this.style.color=\'#0f1f3d\'" onmouseout="this.style.background=\'none\';this.style.borderColor=\'#e0e0d8\';this.style.color=\'#888\'">';
      h+='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>';
      h+='</button>';
      h+='</div>';
    });
    h+='</div>';
    if(myTodos.length>5){
      h+='<div style="text-align:center;margin-top:10px">';
      h+='<span style="font-size:11px;color:#888">+ '+(myTodos.length-5)+' autre(s) tâche(s) — visibles sur chaque studio</span>';
      h+='</div>';
    }
  }
  h+='</div>';
  // ── Fichiers partagés hub ──
  h+=renderFichiersHub();
  return h;
}
