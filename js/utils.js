// ── Alertes (ajout + suppression) ─────────────────────────────────────────────
function _alerteObj(a){
  if(typeof a==='string')return{text:a,auteur:'',date:''};
  return{text:a.text||'',auteur:a.auteur||'',date:a.date||''};
}
function _alerteText(a){return typeof a==='string'?a:(a&&a.text||'');}
function renderAlertes(sid,s){
  var isAdmin=!!S.profile&&!isViewer();
  var h='<div>';
  if(isAdmin){
    h+='<div class="box" style="border:1px dashed #d0d9ec;background:linear-gradient(180deg,#fafbff,#fff)">';
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">';
    h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    h+='<span style="font-weight:700;font-size:14px;color:#1a3a6b">Nouvelle alerte</span>';
    h+='</div>';
    h+='<div style="display:flex;gap:8px">';
    h+='<input id="new-alerte" type="text" placeholder="Ex: Deadline signature bail 15/04/2026" onkeydown="if(event.key===\'Enter\'){event.preventDefault();ajouterAlerte(\''+sid+'\');}" style="flex:1;padding:10px 14px;border:1px solid #d0d9ec;border-radius:10px;font-size:13px;outline:none;transition:border-color .15s" onfocus="this.style.borderColor=\'#1a3a6b\'" onblur="this.style.borderColor=\'#d0d9ec\'"/>';
    h+='<button class="btn btn-primary" onclick="ajouterAlerte(\''+sid+'\')" style="border-radius:10px;padding:10px 20px;font-weight:600">Ajouter</button>';
    h+='</div></div>';
  }
  h+='<div class="box">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  h+='<span style="font-weight:700;font-size:14px;color:#1a1a1a">Alertes actives</span>';
  if(s.alertes.length)h+='<span style="background:#DC2626;color:#fff;font-size:10px;font-weight:700;border-radius:10px;padding:2px 8px">'+s.alertes.length+'</span>';
  h+='</div>';
  if(s.alertes.length===0){
    h+='<div style="text-align:center;padding:2rem;color:#bbb;font-size:13px">';
    h+='<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" style="margin-bottom:8px"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>';
    h+='<div>Aucune alerte \u2014 tout va bien !</div></div>';
  } else {
    s.alertes.forEach(function(a,i){
      var obj=_alerteObj(a);
      h+='<div style="background:#fff;border:1px solid #f0e6d0;border-left:3px solid #DC2626;border-radius:10px;padding:12px 14px;margin-bottom:8px;transition:box-shadow .15s" onmouseenter="this.style.boxShadow=\'0 2px 8px rgba(220,38,38,0.08)\'" onmouseleave="this.style.boxShadow=\'none\'">';
      h+='<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">';
      h+='<div style="flex:1;min-width:0">';
      h+='<div style="font-size:13px;font-weight:600;color:#854F0B;margin-bottom:4px">'+obj.text+'</div>';
      if(obj.auteur||obj.date){
        h+='<div style="display:flex;align-items:center;gap:6px;font-size:10px;color:#999">';
        if(obj.auteur)h+='<span style="display:flex;align-items:center;gap:3px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'+obj.auteur+'</span>';
        if(obj.date)h+='<span style="display:flex;align-items:center;gap:3px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'+obj.date+'</span>';
        h+='</div>';
      }
      h+='</div>';
      h+='<div style="display:flex;align-items:center;gap:4px;flex-shrink:0">';
      h+='<button onclick="acquitterAlerte(\''+sid+'\','+i+')" style="background:#f0fdf4;border:1px solid #bbf7d0;cursor:pointer;font-size:10px;color:#166534;padding:4px 10px;border-radius:6px;font-weight:600;transition:all .15s;display:flex;align-items:center;gap:4px" onmouseenter="this.style.background=\'#dcfce7\';this.style.borderColor=\'#86efac\'" onmouseleave="this.style.background=\'#f0fdf4\';this.style.borderColor=\'#bbf7d0\'">\u2713 Vu</button>';
      if(isAdmin){
        h+='<button onclick="supprimerAlerte(\''+sid+'\','+i+')" style="background:none;border:none;cursor:pointer;font-size:14px;color:#ccc;padding:4px 6px;border-radius:6px;transition:all .15s" onmouseenter="this.style.color=\'#DC2626\';this.style.background=\'#fef2f2\'" onmouseleave="this.style.color=\'#ccc\';this.style.background=\'none\'" title="Supprimer">&times;</button>';
      }
      h+='</div>';
      h+='</div></div>';
    });
  }
  h+='</div></div>';
  return h;
}

async function ajouterAlerte(sid){
  if(isViewer())return;
  var input=document.getElementById('new-alerte');
  var texte=input&&input.value&&input.value.trim();
  if(!texte){toast('Saisissez une alerte');return;}
  var now=new Date();
  var alerte={
    text:texte,
    auteur:(S.profile&&S.profile.nom)||'Admin',
    date:now.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})+' '+now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})
  };
  var s=Object.assign({},S.studios[sid]);
  s.alertes=s.alertes.slice();
  s.alertes.push(alerte);
  await saveStudio(sid,s);
  notifyAll({type:'statut',studio_id:sid,title:'\u26A0\uFE0F Nouvelle alerte \u2014 '+(S.studios[sid].name||sid),body:texte});
  toast('Alerte ajout\u00e9e');
}

async function acquitterAlerte(sid,idx){
  var s=Object.assign({},S.studios[sid]);
  s.alertes=s.alertes.slice();
  var alerte=s.alertes[idx];
  var texte=_alerteText(alerte);
  s.alertes.splice(idx,1);
  await saveStudio(sid,s);
  toast('\u2713 Alerte acquitt\u00e9e : '+texte);
}

async function supprimerAlerte(sid,idx){
  if(isViewer())return;
  if(!confirm('Supprimer cette alerte ?'))return;
  var s=Object.assign({},S.studios[sid]);
  s.alertes=s.alertes.slice();
  s.alertes.splice(idx,1);
  await saveStudio(sid,s);
  toast('Alerte supprimee');
}

function renderAI(s){
  var suggestions=[
    'Quand atteindre le seuil de rentabilité ?',
    'Quel CA minimum pour couvrir le remboursement emprunt ?',
    'Analyse des risques financiers principaux',
    'Simulation à 300 adhérents en A1 : impact sur EBITDA ?',
    'Quelle stratégie de pricing optimiser en priorité ?',
  ];
  var h='<div>';
  // Header
  h+='<div class="box" style="padding:0;overflow:hidden;margin-bottom:14px">';
  h+='<div style="background:#fff;border-bottom:1px solid #e2e8f0;padding:16px 22px;display:flex;align-items:center;gap:14px">';
  h+='<div style="width:38px;height:38px;background:#f0f4fc;border:1px solid #d0d9ec;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;color:#1a3a6b;flex-shrink:0">✦</div>';
  h+='<div style="flex:1">';
  h+='<div style="font-size:15px;font-weight:700;color:#0f1f3d;letter-spacing:-0.3px">Analyste IA &mdash; <span style="color:#1a3a6b">'+s.name+'</span></div>';
  h+='<div style="font-size:10.5px;color:#94a3b8;margin-top:2px;letter-spacing:0.1px">Propuls&eacute; par Mistral AI &middot; Contexte financier int&eacute;gr&eacute;</div>';
  h+='</div>';
  h+='<div style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#1a3a6b;font-weight:700;background:#f0f4fc;border:1px solid #d0d9ec;border-radius:20px;padding:4px 10px">IA</div>';
  h+='</div>';
  // Zone saisie
  h+='<div style="padding:16px 20px 20px">';
  h+='<div style="display:flex;gap:8px;margin-bottom:12px">';
  h+='<input id="aiq" type="text" placeholder="Ex: Quand atteindre le seuil de rentabilité ?" onkeydown="if(event.key===\'Enter\')askAI()" style="flex:1;padding:9px 13px;border:1px solid #d0d9ec;border-radius:8px;font-size:13px;outline:none;color:#0f1f3d"/>';
  h+='<button onclick="askAI()" '+(S.aiLoading?'disabled':'')+' style="background:#1a3a6b;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:'+(S.aiLoading?'wait':'pointer')+';white-space:nowrap;opacity:'+(S.aiLoading?'0.7':'1')+'">'+(S.aiLoading?'<span style="display:inline-flex;align-items:center;gap:6px"><span style="animation:spin 1s linear infinite;display:inline-block">⟳</span> Analyse...</span>':'Analyser →')+'</button>';
  h+='</div>';
  // Suggestions rapides
  h+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">';
  suggestions.forEach(function(sg){
    h+='<button onclick="document.getElementById(\'aiq\').value=\''+sg.replace(/'/g,"\\'")+'\';askAI();" style="background:#f0f4fc;color:#1a3a6b;border:1px solid #d0d9ec;border-radius:20px;padding:4px 11px;font-size:11px;cursor:pointer;font-weight:500">'+sg+'</button>';
  });
  h+='</div>';
  // Réponse
  if(S.aiResp){
    h+='<div style="background:#f8f9fb;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px">';
    h+='<div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#1a3a6b;font-weight:700;margin-bottom:8px">Analyse</div>';
    h+='<div style="font-size:13px;line-height:1.7;color:#2d3748;white-space:pre-wrap">'+S.aiResp+'</div>';
    h+='</div>';
  }
  h+='</div></div></div>';
  return h;
}

function renderNewForm(){
  var f=S.newForm;
  var h='<div class="box"><div style="font-weight:600;font-size:15px;margin-bottom:14px">Nouveau studio</div><div class="form-grid">';
  h+='<div class="fg"><label>Nom</label><input value="'+(f.name||'')+'" oninput="setNF(\'name\',this.value)" placeholder="Ex: Paris 16e"/></div>';
  h+='<div class="fg"><label>Adresse</label><input value="'+(f.addr||'')+'" oninput="setNF(\'addr\',this.value)" placeholder="Rue, CP Ville"/></div>';
  h+='<div class="fg"><label>Societe</label><select onchange="setNF(\'societe\',this.value)"><option>P&amp;W Occitanie</option><option>COBE Society</option><option>SACOBE Society</option></select></div>';
  h+='<div class="fg"><label>Ouverture</label><input value="'+(f.ouverture||'')+'" oninput="setNF(\'ouverture\',this.value)" placeholder="Ex: T2 2027"/></div>';
  h+='<div class="fg"><label>CA annuel A1</label><input type="number" value="'+(f.annualCA||CA_A1)+'" oninput="setNF(\'annualCA\',this.value)"/></div>';
  h+='<div class="fg"><label>Mois ouverture</label><select onchange="setNF(\'moisDebut\',this.value)">';
  MOIS.forEach(function(m,i){h+='<option value="'+i+'" '+((f.moisDebut||0)==i?'selected':'')+'>'+m+'</option>';});
  h+='</select></div>';
  h+='<div class="fg"><label>Cohorte</label><select onchange="setNF(\'cohorte\',+this.value)">';
  for(var nci=1;nci<=10;nci++)h+='<option value="'+nci+'"'+((f.cohorte||1)===nci?' selected':'')+'>Cohorte '+nci+'</option>';
  h+='</select></div>';
  h+='<div class="fg"><label>Loyer mensuel HT (€)</label><input type="number" min="0" step="100" value="'+(f.loyerMensuel||4800)+'" oninput="setNF(\'loyerMensuel\',+this.value)" placeholder="4800"/></div>';
  h+='<div class="fg"><div style="font-size:11px;color:#64748b;padding-top:22px">→ Loyer annuel BP : <b style="color:#1a3a6b">'+fmt((f.loyerMensuel||4800)*12)+'</b> &nbsp;•&nbsp; Impact direct sur EBITDA / REX / Résultat net</div></div>';
  h+='</div>';
  h+='<div class="info-box">CA A2 et A3 calcules automatiquement sur base A1 (+10% / +21%). Repartition et churn BP issus du Plan Financier CP.</div>';
  h+='<div style="display:flex;gap:8px"><button class="btn btn-primary" onclick="createStudio()">Creer</button><button class="btn" onclick="toggleNewForm()">Annuler</button></div></div>';
  return h;
}

// ── Sécurité session : déconnexion automatique ───────────────────────────
// Super-admins (archivage / suppression de projets)
function isSuperAdmin(){
  var nom=(S.profile&&S.profile.nom||'').toLowerCase().trim().split(' ')[0];
  var email=(S.user&&S.user.email||'').toLowerCase();
  return nom==='paul'||nom==='tom'
    ||email==='tombecaud@isseo-dev.com'
    ||email==='paulbecaud@isseo-dev.com';
}
function isViewer(){
  if(!S.user||!S.adminSettings)return false;
  return !!(S.adminSettings.viewers&&S.adminSettings.viewers.indexOf(S.user.id)>=0);
}

var _inactivityTimer=null;
var _inactivityWarnTimer=null;
var _INACTIVITY_MS=5*60*1000; // 5 minutes

function _clearInactivityTimers(){
  if(_inactivityTimer)clearTimeout(_inactivityTimer);
  if(_inactivityWarnTimer)clearTimeout(_inactivityWarnTimer);
  _inactivityTimer=null;_inactivityWarnTimer=null;
}
function _removeInactivityWarn(){
  var el=document.getElementById('isseo-inactivity-warn');if(el)el.remove();
}
function _resetInactivityTimer(){
  if(!S.user)return;
  _clearInactivityTimers();
  _removeInactivityWarn();
  // Avertissement 1 minute avant
  _inactivityWarnTimer=setTimeout(function(){
    if(!S.user)return;
    _removeInactivityWarn();
    var w=document.createElement('div');
    w.id='isseo-inactivity-warn';
    w.style.cssText='position:fixed;bottom:24px;right:24px;background:#1d2d1d;color:#f0f0ed;padding:14px 18px 12px;border-radius:12px;font-size:13px;z-index:9999;border-left:3px solid #c8a84b;box-shadow:0 6px 24px rgba(0,0,0,0.35);line-height:1.4;max-width:280px';
    w.innerHTML='<div style="font-weight:600;margin-bottom:3px">Session bient\u00f4t expir\u00e9e</div><div style="font-size:11.5px;color:rgba(255,255,255,0.55)">Inactivit\u00e9 d\u00e9tect\u00e9e. D\u00e9connexion automatique dans <b style="color:#c8a84b">1 minute</b>.</div><div style="margin-top:8px"><button onclick="_resetInactivityTimer()" style="background:#4d7a5c;color:#fff;border:none;border-radius:6px;padding:4px 12px;font-size:11px;cursor:pointer">Rester connect\u00e9</button></div>';
    document.body.appendChild(w);
  },_INACTIVITY_MS-60000);
  // Déconnexion effective à 5 min
  _inactivityTimer=setTimeout(function(){
    if(!S.user)return;
    _removeInactivityWarn();
    doLogout();
  },_INACTIVITY_MS);
}
// ── Présence utilisateur (heartbeat) ─────────────────────────────────────────
async function updatePresence(){
  if(!S.user)return;
  var now=new Date().toISOString();
  var nom=(S.profile&&S.profile.nom)||'';
  // Charger la présence existante pour merge
  var ex=await sb.from('studios').select('data').eq('id','_user_presence').maybeSingle();
  var presence=(ex.data&&ex.data.data&&ex.data.data.presence)||{};
  presence[S.user.id]={ts:now,nom:nom};
  S.userPresence=presence;
  await sb.from('studios').upsert({id:'_user_presence',data:{presence:presence},updated_at:now});
}
async function loadPresence(){
  var res=await sb.from('studios').select('data').eq('id','_user_presence').maybeSingle();
  S.userPresence=(res.data&&res.data.data&&res.data.data.presence)||{};
}
function startPresenceHeartbeat(){
  if(S._presenceInterval)clearInterval(S._presenceInterval);
  updatePresence();
  S._presenceInterval=setInterval(updatePresence,3*60*1000); // toutes les 3 min
}
function stopPresenceHeartbeat(){
  if(S._presenceInterval){clearInterval(S._presenceInterval);S._presenceInterval=null;}
}
function _presenceLabel(ts){
  if(!ts)return{text:'Jamais connecté',color:'#ccc',online:false};
  var diff=Date.now()-new Date(ts).getTime();
  var mins=Math.floor(diff/60000);
  if(mins<5)return{text:'En ligne',color:'#16A34A',online:true};
  if(mins<60)return{text:'Il y a '+mins+' min',color:'#F59E0B',online:false};
  var hrs=Math.floor(mins/60);
  if(hrs<24)return{text:'Il y a '+hrs+'h',color:'#F59E0B',online:false};
  var days=Math.floor(hrs/24);
  if(days===1)return{text:'Hier',color:'#94A3B8',online:false};
  if(days<7)return{text:'Il y a '+days+'j',color:'#94A3B8',online:false};
  return{text:new Date(ts).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}),color:'#94A3B8',online:false};
}

function _startSessionWatcher(){
  ['mousemove','keydown','mousedown','click','scroll','touchstart'].forEach(function(ev){
    document.addEventListener(ev,_resetInactivityTimer,{passive:true});
  });
  _resetInactivityTimer();
  // Déconnexion si l'onglet/page a été fermé plus de 10 min
  document.addEventListener('visibilitychange',function(){
    if(!S.user)return;
    if(document.visibilityState==='hidden'){
      try{localStorage.setItem('isseo_hidden_at',String(Date.now()));}catch(e){}
    } else {
      try{
        var t=parseInt(localStorage.getItem('isseo_hidden_at')||'0');
        localStorage.removeItem('isseo_hidden_at');
        if(t&&Date.now()-t>_INACTIVITY_MS){doLogout();return;}
      }catch(e){}
      _resetInactivityTimer();
    }
  });
}

async function doLogin(){
  var email=(document.getElementById('ae').value||'').trim().toLowerCase();
  var pwd=document.getElementById('ap').value||'';
  var err=document.getElementById('aerr');
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){err.style.display='block';err.textContent='Veuillez saisir un email valide.';return;}
  if(!pwd){err.style.display='block';err.textContent='Veuillez saisir votre mot de passe.';return;}
  // Loading state sur le bouton
  var btn=document.querySelector('#auth-form button[type="submit"],#auth-form button[onclick]');
  var btnOrig=btn?btn.textContent:'';
  if(btn){btn.textContent='Connexion...';btn.disabled=true;}
  try{
  var res=await sb.auth.signInWithPassword({email:email,password:pwd});
  if(res.error){err.style.display='block';err.textContent=res.error.message;return;}
  S.user=res.data.user;
  var prof=await sb.from('profiles').select('*').eq('id',res.data.user.id).single();
  S.profile=prof.data;
  await loadAll();
  // Auto-mapping email→rôle pour utilisateurs recréés
  var _emailRoleMap={'clementcoquel@yahoo.fr':'coquel','paul@isseo.fr':'admin'};
  if(S.adminSettings.roles&&!S.adminSettings.roles[S.user.id]&&S.user.email&&_emailRoleMap[S.user.email]){
    S.adminSettings.roles=S.adminSettings.roles||{};
    S.adminSettings.roles[S.user.id]=_emailRoleMap[S.user.email];
    sb.from('studios').upsert({id:'_admin_settings',data:S.adminSettings,updated_at:new Date().toISOString()});
  }
  // Appliquer override de rôle si défini par l'admin
  if(S.adminSettings.roles&&S.adminSettings.roles[S.user.id]){
    S.profile=Object.assign({},S.profile,{role:S.adminSettings.roles[S.user.id]});
  }
  // Vérifier si l'accès est bloqué par l'admin
  if(S.adminSettings.blocked&&S.adminSettings.blocked.indexOf(S.user.id)>=0){
    await sb.auth.signOut();S.user=null;S.profile=null;
    var er=document.getElementById('aerr');
    if(er){er.style.display='block';er.textContent='Votre accès à la plateforme a été suspendu. Contactez l\'administrateur.';}
    return;
  }
  restoreNavState();render();
  _startSessionWatcher();
  startPresenceHeartbeat();
  // Notifications
  _loadAllProfiles();
  loadNotifications().then(function(){checkEcheances();checkMondayReport();render();});
  subscribeNotifications();
  }catch(e){console.error('Login error:',e);if(err){err.style.display='block';err.textContent='Erreur de connexion: '+e.message;}}
  finally{if(btn){btn.textContent=btnOrig;btn.disabled=false;}}
}
// ══════════════════════════════════════════════════════════════════════════════
