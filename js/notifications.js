// ── NOTIFICATIONS ENGINE ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
var NOTIF_TYPES={message:{icon:'\uD83D\uDCAC',label:'Message',color:'#3B6FB6'},document:{icon:'\uD83D\uDCC4',label:'Document',color:'#0F6E56'},depense:{icon:'\uD83D\uDCB3',label:'D\u00e9pense',color:'#B8860B'},statut:{icon:'\uD83D\uDD04',label:'Statut',color:'#7C3AED'},echeance:{icon:'\u23F0',label:'\u00c9ch\u00e9ance',color:'#DC2626'},prospect:{icon:'\uD83C\uDFE0',label:'Prospection',color:'#F59E0B'},rapport:{icon:'\uD83D\uDCCB',label:'Rapport',color:'#0E7490'}};
async function loadNotifications(){
  if(!S.user)return;
  var res=await sb.from('notifications').select('*').eq('user_id',S.user.id).order('created_at',{ascending:false}).limit(100);
  S.notifications=(res.data||[]);
  _updateNotifBadge();
}
async function createNotification(opts){
  // opts: {type,studio_id,title,body,target_user_ids:[]}
  if(!S.user||!opts.target_user_ids||!opts.target_user_ids.length)return;
  var rows=opts.target_user_ids.filter(function(uid){return uid!==S.user.id;}).map(function(uid){
    return{type:opts.type,user_id:uid,source_user_id:S.user.id,studio_id:opts.studio_id,title:opts.title,body:opts.body||'',read:false};
  });
  if(!rows.length)return;
  await sb.from('notifications').insert(rows);
}
async function markNotifRead(notifId){
  await sb.from('notifications').update({read:true}).eq('id',notifId);
  var n=S.notifications.find(function(x){return x.id===notifId;});
  if(n)n.read=true;
  _updateNotifBadge();render();
}
async function markAllNotifsRead(){
  if(!S.user)return;
  await sb.from('notifications').update({read:true}).eq('user_id',S.user.id).eq('read',false);
  S.notifications.forEach(function(n){n.read=true;});
  _updateNotifBadge();render();
}
function _updateNotifBadge(){
  var count=S.notifications.filter(function(n){return!n.read;}).length;
  var el=document.getElementById('notif-badge');
  if(el){el.textContent=count>99?'99+':count;el.style.display=count>0?'flex':'none';}
}
function subscribeNotifications(){
  if(!S.user||S.notifSub)return;
  S.notifSub=sb.channel('notif-'+S.user.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'user_id=eq.'+S.user.id},function(payload){
    S.notifications.unshift(payload.new);
    _updateNotifBadge();
    // Toast éphémère
    var nt=NOTIF_TYPES[payload.new.type]||{icon:'',label:''};
    toast(nt.icon+' '+payload.new.title);
    render();
  }).subscribe();
}
function unsubscribeNotifications(){
  if(S.notifSub){sb.removeChannel(S.notifSub);S.notifSub=null;}
}
function toggleNotifPanel(){S.notifOpen=!S.notifOpen;render();}
function setNotifFilter(key,val){S.notifFilter[key]=val;render();}
function _getAllUserIds(){
  // Retourne les IDs de tous les profils connus (pour broadcaster)
  if(!S._allProfiles)return[];
  return S._allProfiles.map(function(p){return p.id;});
}
async function _loadAllProfiles(){
  var res=await sb.from('profiles').select('id,nom');
  S._allProfiles=res.data||[];
}
// Notifier tous les utilisateurs sauf l'émetteur
async function notifyAll(opts){
  if(!S._allProfiles)await _loadAllProfiles();
  opts.target_user_ids=S._allProfiles.map(function(p){return p.id;});
  await createNotification(opts);
}
// ── Rapport hebdomadaire du lundi matin ─────────────────────────────────────
async function checkMondayReport(){
  if(!S.user)return;
  var now=new Date();
  if(now.getDay()!==1)return; // lundi uniquement
  var todayStr=now.toISOString().slice(0,10);
  var reportKey='isseo_monday_report_'+todayStr;
  if(localStorage.getItem(reportKey))return; // déjà envoyé aujourd'hui
  localStorage.setItem(reportKey,'1');

  // ── 1. Tâches en cours ──
  var ids=Object.keys(S.studios);
  var tasksDoing=[],tasksTodo=[],tasksVu=[];
  var todayISO=now.toISOString().slice(0,10);
  var overdueTasks=[];
  ids.forEach(function(sid){
    (S.todos[sid]||[]).forEach(function(t){
      if(t.statut==='done')return;
      var sName=S.studios[sid]?S.studios[sid].name:sid;
      var entry=t.titre+' ('+sName+(t.responsable?' — '+t.responsable:'')+')';
      if(t.statut==='doing')tasksDoing.push(entry);
      else if(t.statut==='vu')tasksVu.push(entry);
      else tasksTodo.push(entry);
      if(t.deadline&&t.deadline<todayISO)overdueTasks.push(entry);
    });
  });

  // ── 2. Activité de la semaine passée ──
  var weekAgo=new Date(now.getTime()-7*24*60*60*1000);
  var weekNotifs=S.notifications.filter(function(n){return new Date(n.created_at)>=weekAgo;});
  var countByType={};
  weekNotifs.forEach(function(n){
    var label=(NOTIF_TYPES[n.type]||{}).label||n.type;
    countByType[label]=(countByType[label]||0)+1;
  });
  var activityLines=Object.keys(countByType).map(function(k){return countByType[k]+' '+k.toLowerCase()+'(s)';});

  // ── 3. Échéances à venir (14 jours) ──
  var upcomingDeadlines=[];
  ids.forEach(function(sid){
    (S.todos[sid]||[]).forEach(function(t){
      if(t.statut==='done'||!t.deadline)return;
      var dl=new Date(t.deadline+'T00:00:00');
      var diff=Math.ceil((dl-now)/(1000*60*60*24));
      if(diff>=0&&diff<=14){
        var sName=S.studios[sid]?S.studios[sid].name:sid;
        upcomingDeadlines.push(t.titre+' — '+sName+' (dans '+diff+'j)');
      }
    });
  });

  // ── 4. Prospects récents ──
  var newProspects=(S.prospects||[]).filter(function(p){
    if(!p.date)return false;
    var parts=p.date.split('/');
    if(parts.length<3)return false;
    var d=new Date(parts[2],parts[1]-1,parts[0]);
    return d>=weekAgo;
  }).length;

  // ── Construire le body du rapport ──
  var body='';
  if(tasksDoing.length){
    body+='🔵 EN COURS ('+tasksDoing.length+') : '+tasksDoing.slice(0,5).join(' · ');
    if(tasksDoing.length>5)body+=' (+' +(tasksDoing.length-5)+')';
    body+='\n';
  }
  if(tasksVu.length){
    body+='🟣 VU ('+tasksVu.length+') : '+tasksVu.slice(0,3).join(' · ');
    if(tasksVu.length>3)body+=' (+' +(tasksVu.length-3)+')';
    body+='\n';
  }
  if(tasksTodo.length){
    body+='🟡 À FAIRE ('+tasksTodo.length+') : '+tasksTodo.slice(0,3).join(' · ');
    if(tasksTodo.length>3)body+=' (+' +(tasksTodo.length-3)+')';
    body+='\n';
  }
  if(overdueTasks.length){
    body+='🔴 EN RETARD ('+overdueTasks.length+') : '+overdueTasks.slice(0,3).join(' · ')+'\n';
  }
  if(activityLines.length){
    body+='📊 Semaine passée : '+activityLines.join(', ')+'\n';
  }
  if(upcomingDeadlines.length){
    body+='⏰ Échéances à venir : '+upcomingDeadlines.slice(0,3).join(' · ')+'\n';
  }
  if(newProspects>0){
    body+='🏠 '+newProspects+' nouveau(x) prospect(s) cette semaine';
  }
  if(!body)body='Aucune activité notable cette semaine. Bon lundi !';

  // Créer la notif pour l'utilisateur courant
  await sb.from('notifications').insert({
    type:'rapport',
    user_id:S.user.id,
    source_user_id:S.user.id,
    title:'📋 Rapport hebdo — semaine du '+now.toLocaleDateString('fr-FR',{day:'numeric',month:'long'}),
    body:body.trim(),
    read:false
  });
  // Recharger les notifs pour l'afficher
  await loadNotifications();
  render();
}

// Vérification échéances (appelée au login)
async function checkEcheances(){
  if(!S.user)return;
  var now=new Date();var ids=Object.keys(S.studios);
  ids.forEach(function(sid){
    var s=S.studios[sid];if(!s||!s.alertes)return;
    s.alertes.forEach(function(a){
      // Chercher des dates dans les alertes (format DD/MM/YYYY)
      var m=a.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if(!m)return;
      var d=new Date(m[3],m[2]-1,m[1]);
      var diff=Math.ceil((d-now)/(1000*60*60*24));
      if(diff>=0&&diff<=14){
        // Vérifier si déjà notifié aujourd'hui
        var todayStr=now.toISOString().slice(0,10);
        var already=S.notifications.find(function(n){return n.type==='echeance'&&n.studio_id===sid&&n.body===a&&n.created_at&&n.created_at.slice(0,10)===todayStr;});
        if(!already){
          sb.from('notifications').insert({type:'echeance',user_id:S.user.id,source_user_id:S.user.id,studio_id:sid,title:'\u00c9ch\u00e9ance dans '+diff+'j — '+s.name,body:a,read:false});
        }
      }
    });
  });
}
function renderNotifPanel(){
  var notifs=S.notifications.slice();
  var f=S.notifFilter;
  // Filtres
  if(f.studio!=='all')notifs=notifs.filter(function(n){return n.studio_id===f.studio;});
  if(f.type!=='all')notifs=notifs.filter(function(n){return n.type===f.type;});
  if(f.emetteur!=='all')notifs=notifs.filter(function(n){return n.source_user_id===f.emetteur;});
  if(f.period!=='all'){
    var cutoff=new Date();
    if(f.period==='today')cutoff.setHours(0,0,0,0);
    else if(f.period==='7d')cutoff.setDate(cutoff.getDate()-7);
    else if(f.period==='30d')cutoff.setDate(cutoff.getDate()-30);
    notifs=notifs.filter(function(n){return new Date(n.created_at)>=cutoff;});
  }
  var unread=S.notifications.filter(function(n){return!n.read;}).length;
  var h='<div id="notif-dropdown" style="position:absolute;top:44px;right:0;width:400px;max-height:520px;background:#fff;border-radius:12px;box-shadow:0 12px 48px rgba(0,0,0,0.18);border:1px solid #e2e8f0;z-index:10000;overflow:hidden;display:flex;flex-direction:column" onclick="event.stopPropagation()">';
  // Header
  h+='<div style="padding:14px 16px 10px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center">';
  h+='<div style="font-size:14px;font-weight:700;color:#0f1f3d">Notifications'+(unread>0?' <span style="background:#dc2626;color:#fff;font-size:10px;padding:1px 7px;border-radius:10px;font-weight:600;margin-left:4px">'+unread+'</span>':'')+'</div>';
  if(unread>0)h+='<button onclick="markAllNotifsRead()" style="background:none;border:none;cursor:pointer;font-size:10px;color:#3B6FB6;font-weight:600">Tout marquer lu</button>';
  h+='</div>';
  // Filtres
  h+='<div style="padding:8px 12px;border-bottom:1px solid #f1f5f9;display:flex;gap:6px;flex-wrap:wrap">';
  // Filtre type
  h+='<select onchange="setNotifFilter(\'type\',this.value)" style="font-size:9px;padding:3px 6px;border:1px solid #e2e8f0;border-radius:6px;color:#64748b;background:#fff;cursor:pointer">';
  h+='<option value="all"'+(f.type==='all'?' selected':'')+'>Tous types</option>';
  Object.keys(NOTIF_TYPES).forEach(function(t){h+='<option value="'+t+'"'+(f.type===t?' selected':'')+'>'+NOTIF_TYPES[t].icon+' '+NOTIF_TYPES[t].label+'</option>';});
  h+='</select>';
  // Filtre studio
  h+='<select onchange="setNotifFilter(\'studio\',this.value)" style="font-size:9px;padding:3px 6px;border:1px solid #e2e8f0;border-radius:6px;color:#64748b;background:#fff;cursor:pointer">';
  h+='<option value="all"'+(f.studio==='all'?' selected':'')+'>Tous studios</option>';
  Object.keys(S.studios).forEach(function(sid){if(!S.studios[sid]||!S.studios[sid].name)return;h+='<option value="'+sid+'"'+(f.studio===sid?' selected':'')+'>'+S.studios[sid].name+'</option>';});
  h+='</select>';
  // Filtre période
  h+='<select onchange="setNotifFilter(\'period\',this.value)" style="font-size:9px;padding:3px 6px;border:1px solid #e2e8f0;border-radius:6px;color:#64748b;background:#fff;cursor:pointer">';
  h+='<option value="all"'+(f.period==='all'?' selected':'')+'>Toute p\u00e9riode</option>';
  h+='<option value="today"'+(f.period==='today'?' selected':'')+'>Aujourd\'hui</option>';
  h+='<option value="7d"'+(f.period==='7d'?' selected':'')+'>7 derniers jours</option>';
  h+='<option value="30d"'+(f.period==='30d'?' selected':'')+'>30 derniers jours</option>';
  h+='</select>';
  h+='</div>';
  // Liste
  h+='<div style="overflow-y:auto;flex:1;max-height:380px">';
  if(!notifs.length){
    h+='<div style="text-align:center;padding:40px 20px;color:#94a3b8;font-size:12px">Aucune notification</div>';
  }else{
    // Grouper par date
    var groups={};
    notifs.forEach(function(n){
      var d=new Date(n.created_at);
      var key=d.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
      if(!groups[key])groups[key]=[];
      groups[key].push(n);
    });
    Object.keys(groups).forEach(function(dateKey){
      h+='<div style="padding:6px 16px 4px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;background:#f8fafc;border-bottom:1px solid #f1f5f9">'+dateKey+'</div>';
      groups[dateKey].forEach(function(n){
        var nt=NOTIF_TYPES[n.type]||{icon:'\uD83D\uDD14',label:'',color:'#666'};
        var sName=S.studios[n.studio_id]?S.studios[n.studio_id].name:n.studio_id;
        var time=new Date(n.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
        var srcName='';
        if(n.source_user_id&&S._allProfiles){var p=S._allProfiles.find(function(x){return x.id===n.source_user_id;});if(p)srcName=p.nom;}
        var _nBgDefault=n.read?(S.darkMode?'#161b22':'#fff'):(S.darkMode?'#0d1f3d':'#f0f7ff');
        var _nBgHover=S.darkMode?'#1c2128':'#f8fafc';
        h+='<div onclick="handleNotifClick(\''+n.id+'\',\''+n.studio_id+'\',\''+n.type+'\')" style="padding:10px 16px;border-bottom:1px solid '+(S.darkMode?'#21262d':'#f8fafc')+';cursor:pointer;display:flex;gap:10px;align-items:flex-start;background:'+_nBgDefault+';transition:background 0.15s" onmouseover="this.style.background=\''+_nBgHover+'\'" onmouseout="this.style.background=\''+_nBgDefault+'\'">';
        // Icon
        h+='<div style="width:32px;height:32px;border-radius:8px;background:'+nt.color+'12;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">'+nt.icon+'</div>';
        // Content
        h+='<div style="flex:1;min-width:0">';
        h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:6px">';
        h+='<div style="font-size:11px;font-weight:'+(n.read?'500':'700')+';color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+n.title+'</div>';
        h+='<span style="font-size:8px;color:#94a3b8;white-space:nowrap">'+time+'</span>';
        h+='</div>';
        if(n.body){var _multiline=n.body.indexOf('\n')>=0;h+='<div style="font-size:10px;color:#64748b;margin-top:2px;'+(_multiline?'white-space:pre-line;line-height:1.5':'white-space:nowrap;overflow:hidden;text-overflow:ellipsis')+'">'+n.body+'</div>';}
        h+='<div style="display:flex;gap:6px;margin-top:3px;align-items:center">';
        h+='<span style="font-size:8px;padding:1px 6px;border-radius:4px;background:'+nt.color+'15;color:'+nt.color+';font-weight:600">'+nt.label+'</span>';
        h+='<span style="font-size:8px;color:#94a3b8">'+sName+'</span>';
        if(srcName)h+='<span style="font-size:8px;color:#94a3b8">\u00b7 '+srcName+'</span>';
        h+='</div>';
        h+='</div>';
        // Unread dot
        if(!n.read)h+='<div style="width:8px;height:8px;border-radius:50%;background:#3B6FB6;flex-shrink:0;margin-top:4px"></div>';
        h+='</div>';
      });
    });
  }
  h+='</div></div>';
  return h;
}
function handleNotifClick(notifId,studioId,type){
  markNotifRead(notifId);
  S.notifOpen=false;
  if(type==='prospect'){
    S.page='prospection';render();return;
  }
  if(type==='rapport'){
    // Le rapport hebdo n'a pas de page dédiée, juste marquer comme lu
    render();return;
  }
  if(!studioId&&type==='message'){
    // Chat global
    toggleChat();render();return;
  }
  if(S.studios[studioId]){
    S.selectedId=studioId;S.view='detail';
    if(type==='message')S.detailTab='echanges';
    else if(type==='document')S.detailTab='fichiers';
    else if(type==='depense')S.detailTab='engagements';
    else if(type==='statut')S.detailTab='workflow';
    else if(type==='echeance')S.detailTab='alertes';
    render();
  }
}

async function saveStudio(id,studio){
  S.studios[id]=studio;
  await sb.from('studios').upsert({id:id,data:studio,updated_at:new Date().toISOString()});
  render();
}
async function setStudioCohorte(sid,val){
  if(!S.studios[sid])return;
  S.studios[sid].cohorte=val;
  await saveStudio(sid,S.studios[sid]);
  toast('Cohorte mise à jour : C'+val);
}
async function saveDepenses(sid){
  await sb.from('studios').upsert({id:sid+'_depenses',data:{depenses:S.depenses[sid]},updated_at:new Date().toISOString()});
}
async function saveAdherents(sid){
  await sb.from('studios').upsert({id:sid+'_adherents',data:{actuel:S.adherents[sid]||{}},updated_at:new Date().toISOString()});
}
