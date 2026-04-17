// ── Sécurité : échappement HTML pour prévenir XSS ───────────────────────────
function htmlEscape(text){
  if(!text)return '';
  var d=document.createElement('div');
  d.textContent=text;
  return d.innerHTML;
}

// ── Obfuscation mots de passe (XOR + base64) ───────────────────────────────
var _PWD_KEY='iss30_s3cur3';
function _xorEncode(str,key){
  var r='';for(var i=0;i<str.length;i++)r+=String.fromCharCode(str.charCodeAt(i)^key.charCodeAt(i%key.length));
  return r;
}
function encodePwd(plain){if(!plain)return'';return btoa(_xorEncode(plain,_PWD_KEY));}
function decodePwd(encoded){if(!encoded)return'';try{return _xorEncode(atob(encoded),_PWD_KEY);}catch(e){return encoded;}}

var _tauxTimeout={};
var _tauxPending={}; // bloque l'écrasement par syncData pendant le debounce
function saveTauxInteret(sid,valPct){
  if(!valPct||isNaN(valPct)||valPct<1||valPct>15)return;
  var taux=valPct/100;
  if(!S.studios[sid])return;
  S.studios[sid].tauxInteret=taux;
  _tauxPending[sid]=true;
  markDirty('taux',sid);
  render();
}

function toast(msg,duration){
  var t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;t.classList.add('show');
  if(t._hideTimer)clearTimeout(t._hideTimer);
  t._hideTimer=setTimeout(function(){t.classList.remove('show');},duration||2500);
}
function badge(statut){
  var s=STATUT_CFG[statut]||STATUT_CFG.pipeline;
  return '<span class="badge" style="background:'+s.bg+';color:'+s.text+'">'+s.label+'</span>';
}
function progBar(steps,sid){
  var ST=sid?getStudioSteps(sid):STEPS;
  var done=ST.filter(function(s){return steps[s.id];}).length;
  var p=Math.round(done/ST.length*100);
  return '<div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px;color:#888"><span>'+done+'/'+ST.length+'</span><span>'+p+'%</span></div><div class="prog-bar"><div style="width:'+p+'%;background:#1D9E75;border-radius:4px;height:6px"></div></div>';
}

var LI='<img src="logo-black.png" style="height:42px;width:auto;display:block" alt="Isseo">';
var LI_LOGIN='<img src="logo-black.png" style="height:60px;width:auto;display:block;margin:0 auto" alt="Isseo">';
var LC='<img src="logo-cp.webp" style="height:36px;width:auto;display:block" alt="Club Pilates">';
var LC_LOGIN='<img src="logo-cp.webp" style="height:52px;width:auto;display:block" alt="Club Pilates">';
var COLLAB_SEP='<span style="font-size:18px;font-weight:300;color:#b0b8c8;letter-spacing:1px;line-height:1;user-select:none">&times;</span>';

// ── Photos utilisateurs ──────────────────────────────────────────────────────
// Mapping email → photo (pour les utilisateurs sans nom dans la DB)
var EMAIL_PHOTO_MAP={
  'caro.falzon@gmail.com':    'photos/caroline.jpg',
  'clementcoquel@yahoo.fr':   'photos/clement.jpg',
  'paulsabourin3@gmail.com':  'photos/paul-s.jpg',
};
var PHOTO_MAP={
  'pascal':            'photos/pascal.jpg',
  'pascal bécaud':     'photos/pascal.jpg',
  'paul bécaud':       'photos/paul-b.jpg',
  'paul':              'photos/paul-b.jpg',
  'tom':               'photos/tom.jpg',
  'tom bécaud':        'photos/tom.jpg',
  'caroline':          'photos/caroline.jpg',
  'caroline coquel':   'photos/caroline.jpg',
  'clement':           'photos/clement.jpg',
  'clément':           'photos/clement.jpg',
  'clément coquel':    'photos/clement.jpg',
  'clement coquel':    'photos/clement.jpg',
  'paul sabourin':     'photos/paul-s.jpg',
  'paul s':            'photos/paul-s.jpg',
};
// Directeurs opérationnels par studio (matching sur nom ou société)
var STUDIO_DIRECTOR=[
  {match:'sacobe', nom:'Paul S.',   photo:'photos/paul-s.jpg'},
  {match:'p&w',    nom:'Tom',       photo:'photos/tom.jpg'},
  {match:'cobe',   nom:'Caroline',  photo:'photos/caroline.jpg'},
];
function getStudioDirector(s){
  var key=((s.name||'')+' '+(s.societe||'')).toLowerCase();
  for(var i=0;i<STUDIO_DIRECTOR.length;i++){if(key.indexOf(STUDIO_DIRECTOR[i].match)>=0)return STUDIO_DIRECTOR[i];}
  return null;
}
var _AV_COLORS=['#185FA5','#0F6E56','#854F0B','#993C1D','#533AB7','#A32D2D'];
function _aC(n){var h=0;for(var i=0;i<(n||'').length;i++)h=n.charCodeAt(i)+((h<<5)-h);return _AV_COLORS[Math.abs(h)%_AV_COLORS.length];}
function _ini(n){return (n||'').split(' ').map(function(w){return w[0]||'';}).join('').toUpperCase().slice(0,2);}
function avatarHTML(nom,size){
  size=size||32;
  var key=(nom||'').toLowerCase().trim();
  // Chercher par nom complet, puis prénom, puis clé nettoyée (sans suffixe parenthèses)
  var cleanKey=key.replace(/\s*\(.*\)\s*$/,'').trim();
  var firstName=key.split(' ')[0];
  var photo=(S.avatarUrls&&(S.avatarUrls[key]||S.avatarUrls[cleanKey]||S.avatarUrls[firstName]))||PHOTO_MAP[key]||PHOTO_MAP[cleanKey]||PHOTO_MAP[firstName]||null;
  var bg=_aC(nom||'?');var txt=_ini(nom||'?');
  var fs=Math.round(size*0.34);
  // Style commun — pas de position:relative ici pour éviter tout conflit de stacking
  var circle='width:'+size+'px;height:'+size+'px;border-radius:50%;flex-shrink:0;overflow:hidden;';
  if(photo){
    // Conteneur simple overflow:hidden + image 100% — aucun élément positionné à l'intérieur
    return '<div style="'+circle+'background:'+bg+'">'
      +'<img src="'+photo+'" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block" '
      +'onerror="this.style.display=\'none\'">'
      +'</div>';
  }
  return '<div style="'+circle+'background:'+bg+';display:flex;align-items:center;justify-content:center;color:#fff;font-size:'+fs+'px;font-weight:700">'+txt+'</div>';
}
// Version enrichie pour le panel admin : cherche aussi par email si le nom est vide
function avatarHTMLForUser(u,size){
  var emailKey=(u.email||'').toLowerCase().trim();
  var emailPhoto=(S.avatarUrls&&S.avatarUrls[emailKey])||EMAIL_PHOTO_MAP[emailKey]||null;
  if(emailPhoto){
    size=size||32;
    var bg=_aC(u.nom||u.email||'?');
    var circle='width:'+size+'px;height:'+size+'px;border-radius:50%;flex-shrink:0;overflow:hidden;';
    return '<div style="'+circle+'background:'+bg+'">'
      +'<img src="'+emailPhoto+'" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block" '
      +'onerror="this.style.display=\'none\'">'
      +'</div>';
  }
  return avatarHTML(u.nom||u.email||'?',size);
}
var COLLAB_SEP_LOGIN='<span style="font-size:26px;font-weight:300;color:#b0b8c8;letter-spacing:1px;line-height:1;user-select:none">&times;</span>';

// ── Toggle son vidéo d'arrière-plan login ────────────────────────────────────
function toggleAuthSound(){
  var v=document.getElementById('auth-bg-video');
  var ic=document.getElementById('auth-sound-icon');
  var btn=document.getElementById('auth-sound-btn');
  if(!v)return;
  v.muted=!v.muted;
  if(!v.muted){
    // Les navigateurs exigent une interaction user pour activer le son — c'est le cas ici (click)
    v.play().catch(function(){});
    if(ic)ic.textContent='🔊';
    if(btn){btn.classList.add('active');btn.setAttribute('title','Couper le son');btn.setAttribute('aria-label','Couper le son');}
  } else {
    if(ic)ic.textContent='🔇';
    if(btn){btn.classList.remove('active');btn.setAttribute('title','Activer le son');btn.setAttribute('aria-label','Activer le son');}
  }
}

function renderAuth(){
  return '<div class="auth-wrap">'
    // ── Background vidéo cinematic ────────────────────────────────────────
    +'<video class="auth-bg-video" id="auth-bg-video" autoplay muted loop playsinline preload="auto" poster="video/login-bg-poster.jpg">'
    +'<source src="video/login-bg.mp4" type="video/mp4">'
    +'</video>'
    // Overlay sombre radial : assombrit les bords, laisse le centre respirer
    +'<div class="auth-bg-overlay"></div>'
    // Bouton mute/unmute (discret, en bas à droite)
    +'<button class="auth-sound-btn" id="auth-sound-btn" onclick="toggleAuthSound()" aria-label="Activer le son" title="Activer le son"><span id="auth-sound-icon">🔇</span></button>'
    // Particules décoratives (conservées, plus subtiles au-dessus de la vidéo)
    +'<div style="position:absolute;top:15%;left:10%;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(26,58,107,0.07) 0%,transparent 70%);pointer-events:none;z-index:2"></div>'
    +'<div style="position:absolute;bottom:10%;right:15%;width:250px;height:250px;border-radius:50%;background:radial-gradient(circle,rgba(15,110,86,0.05) 0%,transparent 70%);pointer-events:none;z-index:2"></div>'
    +'<div class="auth-box">'
    // Logos en blanc — animés
    +'<div class="auth-logos">'
    +'<div class="auth-logo-wrap isseo-wrap"><div class="auth-logo-halo"></div><img src="logo-black.png" class="auth-logo" alt="Isseo"></div>'
    +'<span class="auth-sep">&times;</span>'
    +'<div class="auth-logo-wrap cp-wrap"><div class="auth-logo-halo"></div><img src="logo-cp.webp" class="auth-logo auth-logo-cp" alt="Club Pilates"></div>'
    +'</div>'
    // Sous-titre
    +'<div style="text-align:center;font-size:12px;color:rgba(255,255,255,0.35);margin-bottom:6px;letter-spacing:2px;text-transform:uppercase;font-weight:500">Plateforme de suivi</div>'
    +'<div style="text-align:center;font-size:11px;color:rgba(255,255,255,0.2);margin-bottom:28px">Gestion de projets Club Pilates</div>'
    // Séparateur subtil
    +'<div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);margin-bottom:28px"></div>'
    // Champs
    +'<label style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px">Email</label>'
    +'<input id="ae" type="email" placeholder="votre@email.com" autocomplete="email"/>'
    +'<label style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px">Mot de passe</label>'
    +'<input id="ap" type="password" placeholder="••••••••" autocomplete="current-password"/>'
    +'<div id="aerr" style="font-size:12px;color:#ef4444;margin-bottom:10px;display:none;background:rgba(239,68,68,0.1);padding:8px 12px;border-radius:8px;border:1px solid rgba(239,68,68,0.2)"></div>'
    // Bouton
    +'<button onclick="doLogin()" style="width:100%;padding:14px;background:linear-gradient(135deg,#fff,#e8e8e8);color:#0a0a0a;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s ease;letter-spacing:0.5px;margin-top:4px" onmouseover="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 8px 25px rgba(255,255,255,0.15)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'none\'">Se connecter</button>'
    // Footer
    +'<div style="text-align:center;margin-top:24px;font-size:10px;color:rgba(255,255,255,0.15)">ISSEO × Club Pilates · Espace sécurisé</div>'
    +'</div></div>';
}

var _adminUsers=[];// cache liste utilisateurs chargée async

async function loadAdminUsers(){
  var res=await sb.from('profiles').select('*');
  _adminUsers=(res.data||[]).sort(function(a,b){return (a.nom||'').localeCompare(b.nom||'');});
  await loadPresence();
  await loadLastLogins();
  // Nettoyer les IDs orphelins dans adminSettings (utilisateurs supprimés/recréés)
  var validIds=new Set(_adminUsers.map(function(u){return u.id;}));
  var dirty=false;
  ['blocked','viewers'].forEach(function(key){
    if(S.adminSettings[key]&&S.adminSettings[key].length){
      var clean=S.adminSettings[key].filter(function(uid){return validIds.has(uid);});
      if(clean.length!==S.adminSettings[key].length){S.adminSettings[key]=clean;dirty=true;}
    }
  });
  ['roles','passwords'].forEach(function(key){
    if(S.adminSettings[key]){
      Object.keys(S.adminSettings[key]).forEach(function(uid){
        if(!validIds.has(uid)){delete S.adminSettings[key][uid];dirty=true;}
      });
    }
  });
  // Nettoyer la présence orpheline
  if(S.userPresence){
    Object.keys(S.userPresence).forEach(function(uid){
      if(!validIds.has(uid)){delete S.userPresence[uid];dirty=true;}
    });
  }
  if(dirty){
    saveAdminSettings();
    sb.from('studios').upsert({id:'_user_presence',data:{presence:S.userPresence},updated_at:new Date().toISOString()});
    console.log('[Admin] IDs orphelins nettoyés');
  }
  render();
}

const ROLE_LABELS={
  admin:'Admin complet',
  tom:'Admin complet',
  pascal:'Admin complet',
  viewer:'Lecture seule',
  coquel:'COBE + SACOBE',
  sabourin:'SACOBE uniquement',
  caroline:'COBE uniquement',
};

function renderAdminPanel(){
  var blocked=S.adminSettings.blocked||[];
  var roles=S.adminSettings.roles||{};
  var h='<div class="box" style="padding:0;overflow:hidden">';
  h+='<div style="background:#fff;border-bottom:1px solid #e8eaf0;padding:14px 20px;display:flex;align-items:center;justify-content:space-between">';
  h+='<div><div style="color:#0f1f3d;font-weight:700;font-size:14px">⚙ Gestion des accès utilisateurs</div>';
  h+='<div style="color:#888;font-size:11px;margin-top:2px">Activer / désactiver l\'accès ou restreindre les droits de chaque utilisateur</div></div>';
  h+='<div style="display:flex;gap:8px">';
  h+='<button onclick="showCreateUserModal()" style="background:#0f1f3d;color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:11px;cursor:pointer;font-weight:600">+ Nouveau compte</button>';
  h+='<button onclick="loadAdminUsers();loadPresence()" style="background:#f0f0ea;border:1px solid #dce1ea;color:#444;border-radius:6px;padding:5px 11px;font-size:11px;cursor:pointer">↻ Actualiser</button>';
  h+='</div>';
  h+='</div>';
  if(_adminUsers.length===0){
    h+='<div style="padding:40px;text-align:center;color:#aaa">';
    h+='<div style="font-size:24px;margin-bottom:8px">👥</div>';
    h+='<div style="font-weight:600;margin-bottom:4px">Chargement des utilisateurs…</div>';
    h+='<button onclick="loadAdminUsers()" style="background:#0f1f3d;color:#fff;border:none;border-radius:6px;padding:7px 16px;font-size:12px;cursor:pointer;margin-top:8px">Charger la liste</button>';
    h+='</div>';
  } else {
    h+='<table style="width:100%;border-collapse:collapse">';
    h+='<thead><tr style="background:#f8f9fb;border-bottom:1px solid #e8eaf0">';
    h+='<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px">Utilisateur</th>';
    h+='<th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px">Statut</th>';
    h+='<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px">Rôle / Périmètre</th>';
    h+='<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px">Mot de passe</th>';
    h+='<th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px">Lecture seule</th>';
    h+='<th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px">Accès</th>';
    h+='<th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px"></th>';
    h+='</tr></thead><tbody>';
    var viewers=S.adminSettings.viewers||[];
    _adminUsers.forEach(function(u,i){
      var uid=u.id;
      var isMe=S.user&&S.user.id===uid;
      var isBlocked=blocked.indexOf(uid)>=0;
      var isViewerUser=viewers.indexOf(uid)>=0;
      var roleOverride=roles[uid]||u.role||'admin';
      var bg=i%2===0?'#fff':'#fafafa';
      h+='<tr style="border-bottom:1px solid #f0f0ea;background:'+bg+(isMe?';background:#fffbe6':'')+(isBlocked?';background:#fff5f5;opacity:0.8':'')+'">';
      // Nom
      h+='<td style="padding:12px 16px">';
      h+='<div style="display:flex;align-items:center;gap:10px">';
      h+=avatarHTMLForUser(u,34);
      h+='<div><div style="font-weight:600;font-size:13px">'+(u.nom||'—')+(isMe?' <span style="font-size:10px;color:#854F0B;font-weight:400">(vous)</span>':'')+'</div>';
      h+='<div style="font-size:11px;color:#999">'+(u.email||u.id||'')+'</div></div>';
      h+='</div></td>';
      // Statut connexion (présence heartbeat + last_login par user, race-free)
      var _pres=S.userPresence[uid];
      var _ll=(S.lastLogins||{})[uid];
      var _pl=_presenceLabel(_pres&&_pres.ts,_ll&&_ll.ts);
      h+='<td style="padding:12px 16px;text-align:center">';
      h+='<div style="display:flex;align-items:center;justify-content:center;gap:5px">';
      h+='<div style="width:8px;height:8px;border-radius:50%;background:'+_pl.color+';flex-shrink:0'+(_pl.online?';box-shadow:0 0 0 3px '+_pl.color+'33;animation:pulse-dot 2s infinite':'')+'"></div>';
      h+='<span style="font-size:10px;font-weight:600;color:'+_pl.color+'">'+_pl.text+'</span>';
      h+='</div></td>';
      // Rôle
      h+='<td style="padding:12px 16px">';
      if(isMe){
        h+='<span style="font-size:12px;color:#666;background:#f0f0ea;padding:3px 8px;border-radius:4px">'+(ROLE_LABELS[roleOverride]||roleOverride)+'</span>';
      } else {
        h+='<select onchange="setUserRole(\''+uid+'\',this.value)" style="border:1px solid #dce1ea;border-radius:6px;padding:5px 8px;font-size:12px;background:#fff;cursor:pointer">';
        ['admin','pascal','coquel','sabourin','caroline'].forEach(function(r){
          h+='<option value="'+r+'"'+(roleOverride===r?' selected':'')+'>'+r+' — '+(ROLE_LABELS[r]||r)+'</option>';
        });
        h+='</select>';
      }
      h+='</td>';
      // Mot de passe
      var _pwds=S.adminSettings.passwords||{};
      var _curPwd=_pwds[uid]||'';
      h+='<td style="padding:12px 16px">';
      if(isMe){
        h+='<span style="font-size:11px;color:#aaa">—</span>';
      } else {
        h+='<div style="display:flex;align-items:center;gap:6px">';
        h+='<div id="pwd-display-'+uid+'" style="font-size:12px;font-family:monospace;color:#555;background:#f8f9fb;padding:4px 8px;border-radius:6px;border:1px solid #e8eaf0;min-width:80px">';
        if(_curPwd){
          h+='<span id="pwd-text-'+uid+'" style="letter-spacing:1px">••••••</span>';
        } else {
          h+='<span style="color:#ccc;font-style:italic;font-family:inherit">Non défini</span>';
        }
        h+='</div>';
        if(_curPwd){
          h+='<button onclick="toggleShowPwd(\''+uid+'\')" title="Voir/cacher" style="background:none;border:none;cursor:pointer;padding:2px;color:#888;transition:color .15s" onmouseover="this.style.color=\'#333\'" onmouseout="this.style.color=\'#888\'">';
          h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
          h+='</button>';
        }
        h+='<button onclick="editUserPassword(\''+uid+'\',\''+(u.nom||'').replace(/'/g,"\\'")+'\')" title="Modifier le mot de passe" style="background:none;border:none;cursor:pointer;padding:2px;color:#888;transition:color .15s" onmouseover="this.style.color=\'#1a3a6b\'" onmouseout="this.style.color=\'#888\'">';
        h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
        h+='</button>';
        h+='</div>';
      }
      h+='</td>';
      // Toggle lecture seule (viewer)
      h+='<td style="padding:12px 16px;text-align:center">';
      if(isMe){
        h+='<span style="font-size:11px;color:#aaa">—</span>';
      } else {
        var vChecked=isViewerUser?'checked':'';
        var vBg=isViewerUser?'#EFF6FF':'#f8f9fb';
        var vBorder=isViewerUser?'#BFDBFE':'#dce1ea';
        h+='<label style="display:inline-flex;align-items:center;gap:7px;cursor:pointer;background:'+vBg+';border:1px solid '+vBorder+';border-radius:8px;padding:5px 10px;transition:all .15s">';
        h+='<input type="checkbox" '+vChecked+' onchange="toggleViewer(\''+uid+'\',this.checked)" style="width:15px;height:15px;cursor:pointer;accent-color:#1D4ED8">';
        h+='<span style="font-size:11px;font-weight:600;color:'+(isViewerUser?'#1D4ED8':'#888')+'">👁 Viewer</span>';
        h+='</label>';
      }
      h+='</td>';
      // Toggle accès (actif/suspendu)
      h+='<td style="padding:12px 16px;text-align:center">';
      if(isMe){
        h+='<span style="font-size:11px;color:#aaa">—</span>';
      } else if(isBlocked){
        h+='<div style="display:flex;flex-direction:column;align-items:center;gap:4px">';
        h+='<span style="font-size:10px;color:#c53030;font-weight:600;background:#fed7d7;padding:2px 7px;border-radius:10px">Suspendu</span>';
        h+='<button onclick="toggleUserAccess(\''+uid+'\',false)" style="background:#276749;color:#fff;border:none;border-radius:5px;padding:4px 10px;font-size:11px;cursor:pointer;margin-top:2px">✓ Réactiver</button>';
        h+='</div>';
      } else {
        h+='<div style="display:flex;flex-direction:column;align-items:center;gap:4px">';
        h+='<span style="font-size:10px;color:#276749;font-weight:600;background:#c6f6d5;padding:2px 7px;border-radius:10px">Actif</span>';
        h+='<button onclick="toggleUserAccess(\''+uid+'\',true)" style="background:#c53030;color:#fff;border:none;border-radius:5px;padding:4px 10px;font-size:11px;cursor:pointer;margin-top:2px">⊘ Suspendre</button>';
        h+='</div>';
      }
      h+='</td>';
      // Bouton supprimer
      h+='<td style="padding:12px 16px;text-align:center">';
      if(isMe){
        h+='';
      } else {
        h+='<button onclick="confirmDeleteUser(\''+uid+'\',\''+(u.nom||'').replace(/'/g,"\\'")+'\')" title="Supprimer le compte" style="background:none;border:none;cursor:pointer;padding:6px;color:#ccc;transition:color .15s;border-radius:6px" onmouseover="this.style.color=\'#c53030\';this.style.background=\'#fff5f5\'" onmouseout="this.style.color=\'#ccc\';this.style.background=\'none\'">';
        h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
        h+='</button>';
      }
      h+='</td></tr>';
    });
    h+='</tbody></table>';
  }
  // ── Section invitations ──
  if(typeof renderInvitationsSection==='function'){
    h+=renderInvitationsSection();
  }

  h+='</div>';
  return h;
}

async function saveAdminSettings(){
  var res=await sb.from('studios').upsert({id:'_admin_settings',data:{settings:S.adminSettings},updated_at:new Date().toISOString()});
  if(res.error){toast('Erreur sauvegarde: '+res.error.message);return false;}
  return true;
}

async function toggleUserAccess(uid,block){
  if(!isSuperAdmin())return;
  var blocked=S.adminSettings.blocked||[];
  if(block){if(blocked.indexOf(uid)<0)blocked.push(uid);}
  else{blocked=blocked.filter(function(id){return id!==uid;});}
  S.adminSettings.blocked=blocked;
  var ok=await saveAdminSettings();
  if(ok)toast(block?'Accès suspendu.':'Accès réactivé.');
  render();
}

// ── Admin: gestion mots de passe ─────────────────────────────────────────────
function toggleShowPwd(uid){
  var el=document.getElementById('pwd-text-'+uid);
  if(!el)return;
  var pwds=S.adminSettings.passwords||{};
  var pwd=decodePwd(pwds[uid]||'');
  if(el.dataset.visible==='1'){
    el.textContent='••••••';
    el.style.letterSpacing='1px';
    el.dataset.visible='0';
  } else {
    el.textContent=pwd;
    el.style.letterSpacing='0';
    el.dataset.visible='1';
  }
}

async function editUserPassword(uid,nom){
  var pwds=S.adminSettings.passwords||{};
  var current=decodePwd(pwds[uid]||'');
  var newPwd=prompt('Nouveau mot de passe pour '+nom+' :'+(current?'\n(actuel : '+current+')':''),current);
  if(newPwd===null)return;
  newPwd=newPwd.trim();
  if(!newPwd){toast('Mot de passe vide non autorisé');return;}
  if(newPwd.length<6){toast('Le mot de passe doit contenir au moins 6 caractères');return;}
  toast('Mise à jour du mot de passe…');
  try{
    // Appel fetch direct pour contrôler l'extraction du message d'erreur
    var sess=await sb.auth.getSession();
    var token=sess.data&&sess.data.session&&sess.data.session.access_token;
    if(!token){toast('Échec : session expirée, reconnecte-toi');return;}
    var r=await fetch(SURL+'/functions/v1/manage-user',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+token,
        'apikey':SKEY
      },
      body:JSON.stringify({action:'reset-password',userId:uid,password:newPwd})
    });
    var bodyText=await r.text();
    var bodyJson={};try{bodyJson=JSON.parse(bodyText);}catch(e){}
    if(!r.ok){
      var msg=bodyJson.error||bodyJson.message||bodyText||('HTTP '+r.status);
      console.error('[resetPassword]',r.status,bodyText);
      toast('Échec ('+r.status+') : '+msg);
      return;
    }
    if(bodyJson.error){toast('Échec : '+bodyJson.error);return;}
  }catch(err){
    console.error('[resetPassword] exception',err);
    toast('Échec : '+(err.message||'Edge Function indisponible'));
    return;
  }
  // Mise à jour du mémo local (affichage dans le panneau admin)
  if(!S.adminSettings.passwords)S.adminSettings.passwords={};
  S.adminSettings.passwords[uid]=encodePwd(newPwd);
  saveAdminSettings().then(function(ok){
    if(ok){toast('Mot de passe mis à jour pour '+nom+' ✓');render();}
    else{toast('Mot de passe changé côté auth mais mémo non sauvegardé');}
  });
}

// ── Avatar utilisateur connecté ──────────────────────────────────────────────
function userAvatarWidget(profile){
  if(!profile)return '';
  var nom=profile.nom||'';
  var unread=S.notifications.filter(function(n){return!n.read;}).length;
  var h='<div style="display:flex;align-items:center;gap:6px">';
  // 1. Cloche notifications (SVG moderne)
  h+='<div style="position:relative" onclick="event.stopPropagation();toggleNotifPanel()">';
  h+='<button title="Notifications" aria-label="Notifications" role="button" style="background:none;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;position:relative" onmouseover="this.style.background=\'rgba(26,58,107,0.08)\'" onmouseout="this.style.background=\'none\'">';
  h+='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
  h+='</button>';
  h+='<div id="notif-badge" style="display:'+(unread>0?'flex':'none')+';position:absolute;top:1px;right:1px;background:#ef4444;color:#fff;font-size:8px;font-weight:700;min-width:16px;height:16px;border-radius:8px;align-items:center;justify-content:center;padding:0 4px;border:2px solid #faf9f6;line-height:1;box-shadow:0 1px 3px rgba(239,68,68,0.4)">'+(unread>99?'99+':unread)+'</div>';
  if(S.notifOpen)h+=renderNotifPanel();
  h+='</div>';
  // 2. Cadenas mot de passe (SVG moderne)
  h+='<button onclick="openChangePassword()" title="Modifier mot de passe" style="background:none;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s" onmouseover="this.style.background=\'rgba(26,58,107,0.08)\'" onmouseout="this.style.background=\'none\'">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16.5" r="1.5"/></svg>';
  h+='</button>';
  // 3. Avatar cliquable (sans nom)
  h+='<div style="position:relative;cursor:pointer;flex-shrink:0" onclick="document.getElementById(\'avatar-upload-input\').click()" title="Changer ma photo de profil">';
  h+=avatarHTML(nom,36);
  h+='<div style="position:absolute;bottom:-1px;right:-1px;background:#1a3a6b;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center;border:1.5px solid #faf9f6">';
  h+='<svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
  h+='</div>';
  h+='</div>';
  h+='<input type="file" id="avatar-upload-input" accept="image/*" style="display:none" onchange="uploadAvatar(this)">';
  h+='</div>';
  return h;
}

async function uploadAvatar(input){
  var file=input.files&&input.files[0];
  if(!file||!S.user||!S.profile)return;
  if(file.size>8*1024*1024){toast('Fichier trop volumineux (max 8MB)');return;}
  var nom=(S.profile.nom||'').toLowerCase().trim();
  var ext=file.name.split('.').pop().toLowerCase()||'jpg';
  var path='avatars/'+S.user.id+'.'+ext;
  toast('Chargement de la photo…');
  var up=await sb.storage.from('studio-files').upload(path,file,{upsert:true,contentType:file.type});
  if(up.error){toast('Erreur upload : '+up.error.message);return;}
  var pu=sb.storage.from('studio-files').getPublicUrl(path);
  var url=pu.data&&pu.data.publicUrl;
  if(!url){toast('Erreur URL publique');return;}
  // Cache-bust URL pour forcer le rechargement du navigateur
  url=url.split('?')[0]+'?v='+Date.now();
  S.avatarUrls[nom]=url;
  // Persister en Supabase
  var ex=await sb.from('studios').select('data').eq('id','_avatars').maybeSingle();
  var existing=(ex.data&&ex.data.data&&ex.data.data.avatars)||{};
  existing[nom]=url;
  await sb.from('studios').upsert({id:'_avatars',data:{avatars:existing},updated_at:new Date().toISOString()});
  toast('Photo mise à jour ! ✓');
  render();renderChat();
  // Reset input pour permettre un re-upload du même fichier
  input.value='';
}

// ── Recherche globale ──────────────────────────────────────────────────────
function globalSearch(query){
  if(!query||query.length<2)return[];
  var q=query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  var results=[];
  var filter=ROLE_FILTER[S.profile&&S.profile.role];
  var ids=Object.keys(S.studios).filter(function(id){var st=S.studios[id];return st&&st.name&&(!filter||filter(st));});
  ids.forEach(function(id){
    var s=S.studios[id];
    // Studios
    var fields=[s.name,s.societe,s.addr||'',s.ouverture||''].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(fields.indexOf(q)>=0)results.push({type:'studio',icon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',title:s.name,subtitle:s.societe+' · '+s.ouverture,studioId:id,tab:null,color:'#1a3a6b'});
    // Étapes workflow non complétées
    getStudioSteps(id).forEach(function(step){
      if(!s.steps[step.id]){
        var ln=step.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        if(ln.indexOf(q)>=0)results.push({type:'workflow',icon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',title:step.label,subtitle:s.name+' · En attente',studioId:id,tab:'workflow',color:'#7C3AED'});
      }
    });
    // Messages
    (S.messages[id]||[]).forEach(function(m){
      var mt=(m.text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if(mt.indexOf(q)>=0)results.push({type:'message',icon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',title:(m.text||'').substring(0,60)+(m.text&&m.text.length>60?'…':''),subtitle:s.name+' · '+(m.user||''),studioId:id,tab:'echanges',color:'#3B6FB6'});
    });
    // Documents
    (S.files[id]||[]).forEach(function(f){
      var fn=(f.name||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if(fn.indexOf(q)>=0)results.push({type:'document',icon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',title:f.name,subtitle:s.name,studioId:id,tab:'fichiers',color:'#0F6E56'});
    });
    // Dépenses
    (S.depenses[id]||[]).forEach(function(d){
      var dl=(d.label||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if(dl.indexOf(q)>=0)results.push({type:'depense',icon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',title:d.label,subtitle:s.name+' · '+fmt(d.montant||0),studioId:id,tab:'engagements',color:'#B8860B'});
    });
    // Tâches
    (S.todos[id]||[]).forEach(function(t){
      if(t.statut==='done')return;
      var tt=(t.titre||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if(tt.indexOf(q)>=0){
        var _st=TACHE_STATUTS[t.statut]||TACHE_STATUTS.todo;
        results.push({type:'tache',icon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',title:t.titre,subtitle:s.name+' · '+_st.label,studioId:id,tab:'workflow',color:'#3B6D11'});
      }
    });
    // Scénarios BP
    (S.scenarios[id]||[]).forEach(function(sc){
      var st=(sc.auteur+' '+(sc.comment||'')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if(st.indexOf(q)>=0)results.push({type:'scenario',icon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',title:(sc.comment||'').substring(0,50)+((sc.comment||'').length>50?'…':''),subtitle:s.name+' · '+sc.auteur+' — '+sc.date,studioId:id,tab:'adherents',color:'#854F0B',scenarioId:sc.id});
    });
  });
  // Prospects (liens + fiches)
  (S.prospects||[]).forEach(function(p){
    var txt='';
    if(p.type==='lien')txt=(p.titre||'')+' '+(p.url||'');
    else if(p.type==='fiche')txt=(p.adresse||'')+' '+(p.notes||'');
    var pn=txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(pn.indexOf(q)>=0){
      var _tl=p.type==='lien'?(p.titre||p.url||'Lien'):(p.adresse||'Fiche');
      var _ts2=p.type==='lien'?'Annonce · '+(p.societe||''):'Prospect · '+(p.societe||'');
      results.push({type:'prospect',icon:p.type==='lien'?'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>':'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',title:_tl.substring(0,55)+(_tl.length>55?'…':''),subtitle:_ts2,tab:null,color:'#F59E0B',prospectSociete:p.societe});
    }
  });
  // Pages de navigation rapide
  var _pages=[
    {label:'Accueil',pageId:'accueil',desc:'Page d\'accueil'},
    {label:'Studios',pageId:'projets',desc:'Tous les studios'},
    {label:'Collab',pageId:'collab',desc:'Tâches & discussions consolidés'},
    {label:'Prospection',pageId:'prospection',desc:'Recherche de locaux'},
    {label:'BP Consolide',pageId:'bp',desc:'Business plan consolidé'},
    {label:'Recap engagements',pageId:'engagements',desc:'Récapitulatif des engagements'},
  ];
  _pages.forEach(function(pg){
    var pn=pg.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(pn.indexOf(q)>=0)results.push({type:'page',icon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',title:pg.label,subtitle:pg.desc,tab:null,color:'#555',pageId:pg.pageId});
  });
  return results.slice(0,12);
}

function handleSearchNav(idx){
  var results=globalSearch(S.searchQuery);
  var r=results[idx];
  if(!r)return;
  S.searchQuery='';S.searchOpen=false;S.searchIdx=-1;
  var _sInp=document.getElementById('global-search-input');if(_sInp)_sInp.value='';
  var _sDd=document.getElementById('search-dropdown');if(_sDd)_sDd.style.display='none';
  if(r.type==='page'){
    setPage(r.pageId);
  }else if(r.type==='prospect'){
    S.page='prospection';S.view='dashboard';
    if(r.prospectSociete){S.prospectTab=r.prospectSociete;}
    saveNavState();render();
  }else if(r.type==='scenario'){
    S.page='projets';S.view='detail';S.selectedId=r.studioId;S.detailTab='adherents';
    saveNavState();
    if(r.scenarioId)chargerScenario(r.studioId,r.scenarioId);
    render();
  }else if(r.tab){
    S.page='projets';S.view='detail';S.selectedId=r.studioId;S.detailTab=r.tab;
    saveNavState();render();
  }else{
    openDetail(r.studioId);
  }
}

function onSearchInput(el){
  S.searchQuery=el.value;
  S.searchIdx=-1;
  S.searchOpen=el.value.length>=2;
  // Re-render just the dropdown
  var dd=document.getElementById('search-dropdown');
  if(dd){
    if(S.searchOpen){dd.innerHTML=renderSearchResultsInner();dd.style.display='block';}
    else{dd.style.display='none';}
  }
}

function onSearchKeydown(e){
  if(!S.searchOpen)return;
  var results=globalSearch(S.searchQuery);
  if(e.key==='ArrowDown'){e.preventDefault();S.searchIdx=Math.min(S.searchIdx+1,results.length-1);var dd=document.getElementById('search-dropdown');if(dd)dd.innerHTML=renderSearchResultsInner();}
  else if(e.key==='ArrowUp'){e.preventDefault();S.searchIdx=Math.max(S.searchIdx-1,-1);var dd=document.getElementById('search-dropdown');if(dd)dd.innerHTML=renderSearchResultsInner();}
  else if(e.key==='Enter'&&S.searchIdx>=0){e.preventDefault();handleSearchNav(S.searchIdx);}
  else if(e.key==='Escape'){S.searchQuery='';S.searchOpen=false;S.searchIdx=-1;e.target.value='';e.target.blur();var dd=document.getElementById('search-dropdown');if(dd)dd.style.display='none';}
}

function renderSearchResultsInner(){
  var results=globalSearch(S.searchQuery);
  if(!results.length)return '<div style="padding:16px 20px;text-align:center;color:#999;font-size:12px">Aucun résultat pour « '+S.searchQuery+' »</div>';
  var h='';
  var lastType='';
  var TYPE_LABELS={studio:'Studios',workflow:'Workflow',message:'Messages',document:'Documents',depense:'Dépenses',tache:'Tâches',scenario:'Scénarios',prospect:'Prospection',page:'Navigation'};
  results.forEach(function(r,i){
    if(r.type!==lastType){
      lastType=r.type;
      h+='<div style="padding:6px 16px 4px;font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.5px'+(i>0?';border-top:1px solid #f0f0ea;margin-top:2px':'')+'">'+TYPE_LABELS[r.type]+'</div>';
    }
    var sel=i===S.searchIdx;
    h+='<div onclick="handleSearchNav('+i+')" onmouseover="S.searchIdx='+i+';var dd=document.getElementById(\'search-dropdown\');if(dd)dd.innerHTML=renderSearchResultsInner()" style="display:flex;align-items:center;gap:10px;padding:8px 16px;cursor:pointer;border-radius:6px;margin:1px 6px;transition:background 0.1s;background:'+(sel?'#f0f4ff':'transparent')+'" '+(sel?'':'')+'>';
    h+='<div style="flex-shrink:0;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:'+(sel?r.color+'15':r.color+'10')+';color:'+r.color+'">'+r.icon+'</div>';
    h+='<div style="min-width:0;flex:1"><div style="font-size:12px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+highlightMatch(r.title,S.searchQuery)+'</div>';
    h+='<div style="font-size:11px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+r.subtitle+'</div></div>';
    h+='</div>';
  });
  return h;
}

function highlightMatch(text,query){
  if(!query)return text;
  var idx=text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').indexOf(query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
  if(idx<0)return text;
  return text.substring(0,idx)+'<mark style="background:#FBBF24;color:#1a1a1a;border-radius:2px;padding:0 1px">'+text.substring(idx,idx+query.length)+'</mark>'+text.substring(idx+query.length);
}

function renderSearchBar(){
  var h='<div style="position:relative;flex:1;max-width:340px;min-width:160px" id="search-container">';
  h+='<div style="position:relative">';
  h+='<svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  h+='<input id="global-search-input" type="text" placeholder="Rechercher…" value="'+S.searchQuery.replace(/"/g,'&quot;')+'" oninput="onSearchInput(this)" onkeydown="onSearchKeydown(event)" style="width:100%;padding:8px 12px 8px 34px;border:1px solid #e8e8e3;border-radius:10px;font-size:12px;background:#faf9f6;outline:none;transition:all 0.2s;box-sizing:border-box;color:#333" onfocus="this.style.borderColor=\'#1a3a6b\';this.style.background=\'#fff\';this.style.boxShadow=\'0 2px 8px rgba(26,58,107,0.1)\'" onblur="this.style.borderColor=\'#e8e8e3\';this.style.background=\'#faf9f6\';this.style.boxShadow=\'none\'">';
  h+='<kbd style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:10px;color:#bbb;background:#f0f0ea;border:1px solid #e0e0da;border-radius:4px;padding:1px 5px;font-family:system-ui;pointer-events:none">⌘K</kbd>';
  h+='</div>';
  h+='<div id="search-dropdown" style="display:'+(S.searchOpen?'block':'none')+';position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border:1px solid #e8e8e3;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.12);z-index:9999;max-height:380px;overflow-y:auto;padding:4px 0">';
  if(S.searchOpen)h+=renderSearchResultsInner();
  h+='</div>';
  h+='</div>';
  return h;
}

// ── Changement de mot de passe ──────────────────────────────────────────────
function openChangePassword(){
  var overlay=document.createElement('div');
  overlay.id='pwd-modal-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  var box='<div style="background:#fff;border-radius:16px;padding:28px 32px;width:380px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.2)">';
  box+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">';
  box+='<div style="font-size:16px;font-weight:700;color:#1a1a1a">Modifier le mot de passe</div>';
  box+='<button onclick="document.getElementById(\'pwd-modal-overlay\').remove()" style="background:none;border:none;font-size:20px;color:#999;cursor:pointer;padding:0;line-height:1">&times;</button>';
  box+='</div>';
  box+='<div id="pwd-error" style="display:none;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:8px 12px;font-size:11px;color:#b91c1c;margin-bottom:14px"></div>';
  box+='<label style="font-size:11px;font-weight:600;color:#666;display:block;margin-bottom:4px">Mot de passe actuel</label>';
  box+='<input id="pwd-old" type="password" autocomplete="current-password" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;margin-bottom:14px;box-sizing:border-box;outline:none;transition:border 0.2s" onfocus="this.style.borderColor=\'#1D9E75\'" onblur="this.style.borderColor=\'#ddd\'">';
  box+='<label style="font-size:11px;font-weight:600;color:#666;display:block;margin-bottom:4px">Nouveau mot de passe</label>';
  box+='<input id="pwd-new" type="password" autocomplete="new-password" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;margin-bottom:14px;box-sizing:border-box;outline:none;transition:border 0.2s" onfocus="this.style.borderColor=\'#1D9E75\'" onblur="this.style.borderColor=\'#ddd\'">';
  box+='<label style="font-size:11px;font-weight:600;color:#666;display:block;margin-bottom:4px">Confirmer le nouveau mot de passe</label>';
  box+='<input id="pwd-confirm" type="password" autocomplete="new-password" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;margin-bottom:20px;box-sizing:border-box;outline:none;transition:border 0.2s" onfocus="this.style.borderColor=\'#1D9E75\'" onblur="this.style.borderColor=\'#ddd\'">';
  box+='<button id="pwd-submit-btn" onclick="doChangePassword()" style="width:100%;padding:11px;background:#1a3a6b;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:opacity 0.2s" onmouseover="this.style.opacity=\'0.9\'" onmouseout="this.style.opacity=\'1\'">Enregistrer</button>';
  box+='<div style="font-size:10px;color:#aaa;text-align:center;margin-top:10px">Minimum 8 caract\u00e8res</div>';
  box+='</div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
  setTimeout(function(){var el=document.getElementById('pwd-old');if(el)el.focus();},80);
}

async function doChangePassword(){
  var errEl=document.getElementById('pwd-error');
  var btn=document.getElementById('pwd-submit-btn');
  var oldPwd=document.getElementById('pwd-old').value;
  var newPwd=document.getElementById('pwd-new').value;
  var confirmPwd=document.getElementById('pwd-confirm').value;
  function showErr(msg){errEl.textContent=msg;errEl.style.display='block';}
  errEl.style.display='none';
  if(!oldPwd){showErr('Veuillez saisir votre mot de passe actuel.');return;}
  if(newPwd.length<8){showErr('Le nouveau mot de passe doit contenir au moins 8 caract\u00e8res.');return;}
  if(newPwd!==confirmPwd){showErr('Les deux mots de passe ne correspondent pas.');return;}
  btn.textContent='V\u00e9rification...';btn.disabled=true;btn.style.opacity='0.6';
  // Vérifier l'ancien mot de passe
  var email=S.user&&S.user.email;
  if(!email){showErr('Erreur : email utilisateur introuvable.');btn.textContent='Enregistrer';btn.disabled=false;btn.style.opacity='1';return;}
  var check=await sb.auth.signInWithPassword({email:email,password:oldPwd});
  if(check.error){showErr('Mot de passe actuel incorrect.');btn.textContent='Enregistrer';btn.disabled=false;btn.style.opacity='1';return;}
  // Mettre à jour
  btn.textContent='Mise \u00e0 jour...';
  var upd=await sb.auth.updateUser({password:newPwd});
  if(upd.error){showErr('Erreur : '+upd.error.message);btn.textContent='Enregistrer';btn.disabled=false;btn.style.opacity='1';return;}
  var overlay=document.getElementById('pwd-modal-overlay');
  if(overlay)overlay.remove();
  toast('Mot de passe modifi\u00e9 avec succ\u00e8s \u2713');
}

async function toggleViewer(uid,enable){
  if(!isSuperAdmin())return;
  var viewers=S.adminSettings.viewers||[];
  if(enable){if(viewers.indexOf(uid)<0)viewers.push(uid);}
  else{viewers=viewers.filter(function(id){return id!==uid;});}
  S.adminSettings.viewers=viewers;
  var ok=await saveAdminSettings();
  if(ok)toast(enable?'Mode lecture seule activé.':'Mode lecture seule désactivé.');
  render();
}

async function setUserRole(uid,role){
  if(!isSuperAdmin())return;
  if(!S.adminSettings.roles)S.adminSettings.roles={};
  S.adminSettings.roles[uid]=role;
  var ok=await saveAdminSettings();
  var label=ROLE_LABELS[role]||role;
  if(ok)toast('Rôle mis à jour : '+label+'. Effectif sous 5s pour l\'utilisateur.');
}

// ── Admin: création de compte ───────────────────────────────────────────────
function showCreateUserModal(){
  if(!isSuperAdmin())return;
  var overlay=document.createElement('div');
  overlay.id='create-user-overlay';
  overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML='<div role="dialog" aria-label="Créer un compte" style="background:#fff;border-radius:12px;padding:28px;width:420px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.3)">'
    +'<div style="font-weight:700;font-size:16px;color:#0f1f3d;margin-bottom:4px">Créer un compte utilisateur</div>'
    +'<div style="color:#888;font-size:12px;margin-bottom:20px">Le nouvel utilisateur pourra se connecter avec ces identifiants</div>'
    +'<div style="display:flex;flex-direction:column;gap:14px">'
    +'<div><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Nom complet</label>'
    +'<input id="cu-nom" type="text" placeholder="Ex: Jean Dupont" style="width:100%;padding:9px 12px;border:1px solid #dce1ea;border-radius:8px;font-size:13px;box-sizing:border-box"></div>'
    +'<div><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Email</label>'
    +'<input id="cu-email" type="email" placeholder="jean@example.com" style="width:100%;padding:9px 12px;border:1px solid #dce1ea;border-radius:8px;font-size:13px;box-sizing:border-box"></div>'
    +'<div><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Mot de passe</label>'
    +'<input id="cu-pwd" type="text" placeholder="Mot de passe initial" style="width:100%;padding:9px 12px;border:1px solid #dce1ea;border-radius:8px;font-size:13px;box-sizing:border-box"></div>'
    +'<div><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Rôle</label>'
    +'<select id="cu-role" style="width:100%;padding:9px 12px;border:1px solid #dce1ea;border-radius:8px;font-size:13px;box-sizing:border-box;background:#fff">'
    +'<option value="admin">admin — Admin complet</option>'
    +'<option value="coquel">coquel — COBE + SACOBE</option>'
    +'<option value="sabourin">sabourin — SACOBE uniquement</option>'
    +'<option value="caroline">caroline — COBE uniquement</option>'
    +'<option value="viewer">viewer — Lecture seule</option>'
    +'</select></div>'
    +'<div id="cu-error" style="display:none;color:#c53030;font-size:12px;background:#fff5f5;padding:8px 12px;border-radius:6px"></div>'
    +'<div style="display:flex;gap:10px;margin-top:6px">'
    +'<button onclick="document.getElementById(\'create-user-overlay\').remove()" style="flex:1;padding:10px;border:1px solid #dce1ea;background:#f8f9fb;color:#555;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600">Annuler</button>'
    +'<button id="cu-submit" onclick="submitCreateUser()" style="flex:1;padding:10px;border:none;background:#0f1f3d;color:#fff;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600">Créer le compte</button>'
    +'</div></div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});
  document.getElementById('cu-nom').focus();
}

async function submitCreateUser(){
  if(!isSuperAdmin())return;
  var nom=document.getElementById('cu-nom').value.trim();
  var email=document.getElementById('cu-email').value.trim().toLowerCase();
  var pwd=document.getElementById('cu-pwd').value.trim();
  var role=document.getElementById('cu-role').value;
  var errEl=document.getElementById('cu-error');
  var btn=document.getElementById('cu-submit');
  if(!nom||!email||!pwd){errEl.textContent='Tous les champs sont requis.';errEl.style.display='block';return;}
  if(pwd.length<6){errEl.textContent='Le mot de passe doit contenir au moins 6 caractères.';errEl.style.display='block';return;}
  btn.textContent='Création en cours...';btn.disabled=true;
  // Sauvegarder la session actuelle
  var currentSession=await sb.auth.getSession();
  // Créer le compte via signUp
  var res=await sb.auth.signUp({email:email,password:pwd,options:{data:{nom:nom}}});
  if(res.error){errEl.textContent='Erreur: '+res.error.message;errEl.style.display='block';btn.textContent='Créer le compte';btn.disabled=false;return;}
  var newUid=res.data.user&&res.data.user.id;
  if(!newUid){errEl.textContent='Erreur: impossible de récupérer l\'ID utilisateur.';errEl.style.display='block';btn.textContent='Créer le compte';btn.disabled=false;return;}
  // Restaurer la session admin (signUp peut changer la session)
  if(currentSession.data&&currentSession.data.session){
    await sb.auth.setSession({access_token:currentSession.data.session.access_token,refresh_token:currentSession.data.session.refresh_token});
  }
  // Insérer le profil
  await sb.from('profiles').upsert({id:newUid,nom:nom,email:email,role:role});
  // Sauvegarder le rôle et le mot de passe dans adminSettings
  if(!S.adminSettings.roles)S.adminSettings.roles={};
  if(!S.adminSettings.passwords)S.adminSettings.passwords={};
  S.adminSettings.roles[newUid]=role;
  S.adminSettings.passwords[newUid]=encodePwd(pwd);
  await saveAdminSettings();
  // Fermer la modale et rafraîchir
  var overlay=document.getElementById('create-user-overlay');
  if(overlay)overlay.remove();
  toast('Compte créé pour '+nom+' ('+email+')');
  await loadAdminUsers();
  render();
}

// ── Admin: suppression de compte ────────────────────────────────────────────
function confirmDeleteUser(uid,nom){
  if(!isSuperAdmin())return;
  if(S.user&&S.user.id===uid){toast('Vous ne pouvez pas supprimer votre propre compte.');return;}
  var overlay=document.createElement('div');
  overlay.id='delete-user-overlay';
  overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML='<div role="dialog" aria-label="Supprimer le compte" style="background:#fff;border-radius:12px;padding:28px;width:400px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.3)">'
    +'<div style="font-weight:700;font-size:16px;color:#c53030;margin-bottom:8px">Supprimer le compte</div>'
    +'<div style="color:#555;font-size:13px;margin-bottom:20px">Voulez-vous vraiment supprimer le compte de <strong>'+nom+'</strong> ? Cette action est irréversible.</div>'
    +'<div style="display:flex;gap:10px">'
    +'<button onclick="document.getElementById(\'delete-user-overlay\').remove()" style="flex:1;padding:10px;border:1px solid #dce1ea;background:#f8f9fb;color:#555;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600">Annuler</button>'
    +'<button onclick="executeDeleteUser(\''+uid+'\')" style="flex:1;padding:10px;border:none;background:#c53030;color:#fff;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600">Supprimer</button>'
    +'</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});
}

async function executeDeleteUser(uid){
  if(!isSuperAdmin())return;
  // 1. Bloquer l'accès
  var blocked=S.adminSettings.blocked||[];
  if(blocked.indexOf(uid)<0)blocked.push(uid);
  S.adminSettings.blocked=blocked;
  // 2. Nettoyer adminSettings
  if(S.adminSettings.roles)delete S.adminSettings.roles[uid];
  if(S.adminSettings.passwords)delete S.adminSettings.passwords[uid];
  if(S.adminSettings.viewers){
    S.adminSettings.viewers=S.adminSettings.viewers.filter(function(id){return id!==uid;});
  }
  await saveAdminSettings();
  // 3. Supprimer le profil
  await sb.from('profiles').delete().eq('id',uid);
  // 4. Supprimer la présence
  if(S.userPresence&&S.userPresence[uid]){
    delete S.userPresence[uid];
    await sb.from('studios').upsert({id:'_user_presence',data:{presence:S.userPresence},updated_at:new Date().toISOString()});
  }
  // Fermer la modale et rafraîchir
  var overlay=document.getElementById('delete-user-overlay');
  if(overlay)overlay.remove();
  toast('Compte supprimé.');
  await loadAdminUsers();
  render();
}

function renderSidebar(){
  var p=S.page;
  var prenom=(S.profile&&S.profile.nom||'').split(' ')[0]||'Utilisateur';
  var role=S.profile&&S.profile.role||'';
  var roleLabel=role==='admin'?'Administrateur':role==='viewer'?'Lecteur':role;
  // Compteurs pour badges
  var _allIds=_getStudioIds();
  var _unreadNotif=S.notifications.filter(function(n){return!n.read;}).length;
  var _prospectCount=(S.prospects||[]).length;
  // Badge Collab : mes tâches actives assignées (non done)
  var _myName=(S.profile&&S.profile.nom)||'';
  var _collabCount=0;
  if(_myName){
    _allIds.forEach(function(id){
      (S.todos[id]||[]).forEach(function(t){
        if(!t||t.statut==='done')return;
        var asg=(t.assignees&&t.assignees.length?t.assignees:[t.responsable||t.auteur||'']).filter(Boolean);
        if(asg.indexOf(_myName)>=0)_collabCount++;
      });
    });
  }
  var links=[
    {id:'accueil',label:'Accueil',badge:_unreadNotif,badgeColor:'#3B82F6',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'},
    {id:'projets',label:'Studios',badge:0,icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'},
    {id:'collab',label:'Collab',badge:_collabCount,badgeColor:'#7C3AED',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'},
    {id:'prospection',label:'Prospection',badge:_prospectCount,badgeColor:'#F59E0B',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'},
    {id:'bp',label:'BP Consolidé',badge:0,icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'},
    {id:'engagements',label:"R\u00e9cap' engagements",badge:0,badgeColor:'#92630a',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'},
    {id:'fichiers',label:'Fichiers',badge:_allIds.reduce(function(s,id){return s+(S.files[id]||[]).length;},0),badgeColor:'#6366f1',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'}
  ];
  var h='<div class="sidebar" id="app-sidebar">';
  // Logo
  h+='<div class="sidebar-logo"><img src="logo-white.png" style="height:28px;width:auto" onerror="this.src=\'logo-black.png\';this.style.filter=\'brightness(0) invert(1)\'" alt="Isseo"><span style="font-size:14px;font-weight:300;color:rgba(255,255,255,0.3);margin:0 2px">&times;</span><img src="logo-cp.webp" style="height:24px;width:auto;filter:brightness(0) invert(1)" alt="CP"></div>';
  // Nav links
  h+='<div class="sidebar-nav">';
  h+='<div style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.25);font-weight:600;padding:8px 14px 6px">Navigation</div>';
  h+='<div class="sidebar-pill" id="sidebar-pill"></div>';
  links.forEach(function(l,li){
    var active=p===l.id;
    h+='<button class="sidebar-link '+(active?'active':'')+'" data-nav-idx="'+li+'" onclick="setPage(\''+l.id+'\')" style="position:relative">';
    h+=l.icon+'<span>'+l.label+'</span>';
    // Badge compteur
    if(l.badge>0)h+='<span style="margin-left:auto;background:'+l.badgeColor+';color:#fff;font-size:9px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 5px;line-height:1">'+l.badge+'</span>';
    h+='</button>';
  });
  // Admin link for super admins
  if(isSuperAdmin()){
    var _adminActive=S.mainTab==='admin'&&p==='projets';
    h+='<div style="margin-top:auto;padding-top:12px;border-top:1px solid rgba(255,255,255,0.05)">';
    h+='<button class="sidebar-link '+(_adminActive?'active':'')+'" onclick="S.page=\'projets\';S.mainTab=\'admin\';S.view=\'dashboard\';S.selectedId=null;saveNavState();render()" style="position:relative">';
    h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span>Administration</span></button>';
    h+='</div>';
  }
  h+='</div>';
  // Bottom user info — modernisé
  h+='<div class="sidebar-bottom" style="flex-direction:column;gap:12px">';
  // Carte utilisateur
  h+='<div style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;background:rgba(255,255,255,0.06);border-radius:10px;border:1px solid rgba(255,255,255,0.06)">';
  // Avatar avec indicateur en ligne
  h+='<div style="position:relative;flex-shrink:0">';
  h+='<div style="width:36px;height:36px;border-radius:10px;overflow:hidden;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center">';
  var _uPhoto=getUserPhoto(S.profile);
  if(_uPhoto)h+='<img src="'+_uPhoto+'" style="width:100%;height:100%;object-fit:cover" onerror="this.parentNode.innerHTML=\'<span style=font-size:13px;font-weight:700;color:#fff>'+_ini(prenom)+'</span>\'">';
  else h+='<span style="font-size:13px;font-weight:700;color:#fff">'+_ini(prenom)+'</span>';
  h+='</div>';
  h+='<div style="position:absolute;bottom:-1px;right:-1px;width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid #0f1f3d"></div>';
  h+='</div>';
  // Nom + rôle
  h+='<div style="flex:1;min-width:0"><div class="sb-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+prenom+'</div><div class="sb-role">'+roleLabel+'</div></div>';
  h+='</div>';
  // Boutons d'action
  h+='<div style="display:flex;gap:4px;width:100%">';
  h+='<button onclick="toggleDarkMode()" title="'+(S.darkMode?'Mode clair':'Mode sombre')+'" style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.06);cursor:pointer;padding:7px;border-radius:8px;transition:background .2s;display:flex;align-items:center;justify-content:center" onmouseenter="this.style.background=\'rgba(255,255,255,0.12)\'" onmouseleave="this.style.background=\'rgba(255,255,255,0.06)\'">';
  h+=S.darkMode?'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>':'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  h+='</button>';
  h+='<button onclick="doLogout()" title="Déconnexion" style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.06);cursor:pointer;padding:7px;border-radius:8px;transition:background .2s;display:flex;align-items:center;justify-content:center" onmouseenter="this.style.background=\'rgba(239,68,68,0.15)\'" onmouseleave="this.style.background=\'rgba(255,255,255,0.06)\'">';
  h+='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
  h+='</button>';
  h+='</div>';
  h+='</div></div>';
  return h;
}

function getUserPhoto(profile){
  if(!profile)return null;
  var key=(profile.nom||'').toLowerCase().trim();
  var cleanKey=key.replace(/\s*\(.*\)\s*$/,'').trim();
  var firstName=key.split(' ')[0];
  return (S.avatarUrls&&(S.avatarUrls[key]||S.avatarUrls[cleanKey]||S.avatarUrls[firstName]))||PHOTO_MAP[key]||PHOTO_MAP[cleanKey]||PHOTO_MAP[firstName]||(EMAIL_PHOTO_MAP[(profile.email||'').toLowerCase()])||null;
}

// Helper: get all filtered studio IDs
function _getStudioIds(){
  var filter=ROLE_FILTER[S.profile&&S.profile.role];
  var ids=Object.keys(S.studios).filter(function(id){var st=S.studios[id];return st&&st.name&&(!filter||filter(st));});
  // Viewer granulaire : filtrer par studios autorisés
  if(isViewer()&&S.user&&S.adminSettings.viewerPerms&&S.adminSettings.viewerPerms[S.user.id]){
    var allowed=S.adminSettings.viewerPerms[S.user.id].studios||[];
    if(allowed.length>0)ids=ids.filter(function(id){return allowed.indexOf(id)>=0;});
  }
  return ids;
}

// ── Invitation Viewer system ─────────────────────────────────────────────────

function _generatePassword(){
  var chars='abcdefghijkmnpqrstuvwxyz23456789';
  var pwd='';for(var i=0;i<8;i++)pwd+=chars[Math.floor(Math.random()*chars.length)];
  return pwd;
}

function showInviteViewerModal(){
  var overlay=document.createElement('div');
  overlay.id='invite-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  var allStudios=Object.keys(S.studios).filter(function(id){var st=S.studios[id];return st&&st.name;});
  var allTabs=[['workflow','Workflow'],['adherents','Adhérents & Prév.'],['forecast','Forecast'],['engagements','Engagements'],['echanges','Questions & Tâches'],['localisation','Localisation'],['local','Local'],['fichiers','Fichiers'],['ia','IA']];
  var box='<div style="background:#fff;border-radius:16px;padding:28px 32px;width:540px;max-width:92vw;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2)">';
  box+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:20px"><div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#1a3a6b,#2a5a9b);display:flex;align-items:center;justify-content:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg></div>';
  box+='<div><div style="font-size:16px;font-weight:700;color:#1a1a1a">Inviter un viewer</div>';
  box+='<div style="font-size:11px;color:#888">L\'invitation sera soumise à Paul Bécaud pour approbation</div></div></div>';
  // Nom + Email
  box+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">';
  box+='<div><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Nom complet *</label>';
  box+='<input id="inv-nom" type="text" placeholder="Jean Dupont" style="width:100%;padding:9px 12px;border:1px solid #dde;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box"/></div>';
  box+='<div><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Email *</label>';
  box+='<input id="inv-email" type="email" placeholder="jean@email.com" style="width:100%;padding:9px 12px;border:1px solid #dde;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box"/></div>';
  box+='</div>';
  // Studios checkboxes
  box+='<div style="margin-bottom:14px"><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:6px">Projets accessibles *</label>';
  box+='<div style="display:flex;flex-wrap:wrap;gap:6px;max-height:120px;overflow-y:auto;padding:8px;background:#f8f9fb;border-radius:8px;border:1px solid #eee">';
  allStudios.forEach(function(id){
    var st=S.studios[id];
    box+='<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#333;cursor:pointer;padding:3px 8px;background:#fff;border-radius:6px;border:1px solid #e8e8e0;white-space:nowrap"><input type="checkbox" class="inv-studio-cb" value="'+id+'" style="accent-color:#1a3a6b"/> '+st.name+'</label>';
  });
  box+='</div>';
  box+='<button onclick="_invSelectAllStudios()" style="font-size:10px;color:#1a3a6b;background:none;border:none;cursor:pointer;margin-top:4px;text-decoration:underline">Tout sélectionner</button>';
  box+='</div>';
  // Tabs checkboxes
  box+='<div style="margin-bottom:16px"><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:6px">Onglets accessibles *</label>';
  box+='<div style="display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#f8f9fb;border-radius:8px;border:1px solid #eee">';
  allTabs.forEach(function(t){
    box+='<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#333;cursor:pointer;padding:3px 8px;background:#fff;border-radius:6px;border:1px solid #e8e8e0"><input type="checkbox" class="inv-tab-cb" value="'+t[0]+'" checked style="accent-color:#1a3a6b"/> '+t[1]+'</label>';
  });
  box+='</div>';
  box+='<button onclick="_invSelectAllTabs()" style="font-size:10px;color:#1a3a6b;background:none;border:none;cursor:pointer;margin-top:4px;text-decoration:underline">Tout sélectionner</button>';
  box+='</div>';
  // Error + buttons
  box+='<div id="inv-err" style="font-size:11px;color:#A32D2D;min-height:16px;margin-bottom:8px"></div>';
  box+='<div style="display:flex;justify-content:flex-end;gap:8px">';
  box+='<button onclick="document.getElementById(\'invite-modal\').remove()" style="padding:9px 18px;border:1px solid #dde;border-radius:10px;background:#fff;color:#555;font-size:12px;font-weight:600;cursor:pointer">Annuler</button>';
  box+='<button onclick="submitInvitation()" style="padding:9px 18px;background:linear-gradient(135deg,#1a3a6b,#2a5a9b);color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(26,58,107,0.2)">Envoyer la demande</button>';
  box+='</div></div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
  setTimeout(function(){var el=document.getElementById('inv-nom');if(el)el.focus();},100);
}

function _invSelectAllStudios(){
  document.querySelectorAll('.inv-studio-cb').forEach(function(cb){cb.checked=true;});
}
function _invSelectAllTabs(){
  document.querySelectorAll('.inv-tab-cb').forEach(function(cb){cb.checked=true;});
}

async function submitInvitation(){
  var nom=(document.getElementById('inv-nom')||{}).value||'';
  var email=(document.getElementById('inv-email')||{}).value||'';
  var studios=[];document.querySelectorAll('.inv-studio-cb:checked').forEach(function(cb){studios.push(cb.value);});
  var tabs=[];document.querySelectorAll('.inv-tab-cb:checked').forEach(function(cb){tabs.push(cb.value);});
  var errEl=document.getElementById('inv-err');
  if(!nom.trim()||!email.trim()){if(errEl)errEl.textContent='Nom et email sont obligatoires.';return;}
  if(studios.length===0){if(errEl)errEl.textContent='Sélectionnez au moins un projet.';return;}
  if(tabs.length===0){if(errEl)errEl.textContent='Sélectionnez au moins un onglet.';return;}
  var inv={
    id:'inv_'+Date.now(),
    nom:nom.trim(),
    email:email.trim().toLowerCase(),
    invitedBy:S.user?S.user.id:'',
    invitedByName:(S.profile&&S.profile.nom)||'Admin',
    studios:studios,
    tabs:tabs,
    status:'pending',
    createdAt:new Date().toISOString(),
    approvedAt:null,
    userId:null,
    password:null
  };
  if(!S.adminSettings.invitations)S.adminSettings.invitations=[];
  S.adminSettings.invitations.push(inv);
  await saveAdminSettings();
  var modal=document.getElementById('invite-modal');
  if(modal)modal.remove();
  // ── Email à Paul Bécaud (super-admin) ───────────────────────────────────
  try{
    var studioNames=(inv.studios||[]).map(function(sid){var st=S.studios[sid];return st?st.name:sid;}).join(', ');
    var tabNames=(inv.tabs||[]).join(', ');
    var appUrl=window.location.origin+window.location.pathname;
    var body=''
      +'<div style="font-size:14px;line-height:1.6;color:#333">'
      +'<p style="margin:0 0 14px">Bonjour Paul,</p>'
      +'<p style="margin:0 0 18px"><b>'+inv.invitedByName+'</b> vient de soumettre une demande d\'invitation viewer qui attend ton approbation.</p>'
      +'<div style="background:#f8f9fb;border-left:3px solid #1a3a6b;border-radius:8px;padding:16px 18px;margin-bottom:22px">'
      +'<div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:600;margin-bottom:8px">Détails de l\'invitation</div>'
      +'<div style="margin-bottom:6px"><span style="color:#666">Invité&nbsp;:</span> <b>'+inv.nom+'</b> <span style="color:#888">('+inv.email+')</span></div>'
      +'<div style="margin-bottom:6px"><span style="color:#666">Projets&nbsp;:</span> '+(studioNames||'<i style="color:#aaa">aucun</i>')+'</div>'
      +'<div><span style="color:#666">Onglets&nbsp;:</span> '+(tabNames||'<i style="color:#aaa">aucun</i>')+'</div>'
      +'</div>'
      +'<div style="text-align:center;margin:28px 0 14px">'+_emailBtn('Ouvrir le panneau admin',appUrl,'#1a3a6b')+'</div>'
      +'<p style="margin:18px 0 0;font-size:12px;color:#888">Tu peux approuver ou rejeter cette demande depuis le panneau admin.</p>'
      +'</div>';
    var html=_emailLayout({
      title:'🎟️ Nouvelle invitation viewer',
      preheader:inv.invitedByName+' a invité '+inv.nom+' en lecture seule',
      body:body
    });
    sendEmail({
      to:'paulbecaud@isseo-dev.com',
      subject:'🎟️ Nouvelle invitation viewer — '+inv.nom,
      html:html
    });
  }catch(e){console.warn('[invite-email]',e);}
  toast('Demande d\'invitation envoyée à Paul Bécaud pour validation');
  render();
}

async function approveInvitation(invId){
  if(!isSuperAdmin())return;
  var invs=S.adminSettings.invitations||[];
  var inv=invs.find(function(i){return i.id===invId;});
  if(!inv){toast('Invitation introuvable');return;}
  // Générer mot de passe
  var pwd=_generatePassword();
  // Créer le compte Supabase
  var currentSession=await sb.auth.getSession();
  var res=await sb.auth.signUp({email:inv.email,password:pwd,options:{data:{nom:inv.nom}}});
  if(res.error){toast('Erreur création compte: '+res.error.message);return;}
  var newUid=res.data.user?res.data.user.id:null;
  if(!newUid){toast('Erreur: UID non obtenu');return;}
  // Restaurer session admin
  if(currentSession.data&&currentSession.data.session){
    await sb.auth.setSession({access_token:currentSession.data.session.access_token,refresh_token:currentSession.data.session.refresh_token});
  }
  // Profil
  await sb.from('profiles').upsert({id:newUid,nom:inv.nom,email:inv.email,role:'viewer'});
  // Ajouter comme viewer
  var viewers=S.adminSettings.viewers||[];
  if(viewers.indexOf(newUid)<0)viewers.push(newUid);
  S.adminSettings.viewers=viewers;
  // Rôle
  if(!S.adminSettings.roles)S.adminSettings.roles={};
  S.adminSettings.roles[newUid]='viewer';
  // Permissions granulaires
  if(!S.adminSettings.viewerPerms)S.adminSettings.viewerPerms={};
  S.adminSettings.viewerPerms[newUid]={studios:inv.studios,tabs:inv.tabs};
  // Password
  if(!S.adminSettings.passwords)S.adminSettings.passwords={};
  S.adminSettings.passwords[newUid]=encodePwd(pwd);
  // Update invitation
  inv.status='approved';
  inv.approvedAt=new Date().toISOString();
  inv.userId=newUid;
  inv.password=encodePwd(pwd);
  await saveAdminSettings();
  await loadAdminUsers();
  // ── Emails : à l'invité (identifiants) + à l'admin inviteur si différent ─
  try{
    var appUrl=window.location.origin+window.location.pathname;
    var studioNames=(inv.studios||[]).map(function(sid){var st=S.studios[sid];return st?st.name:sid;}).join(', ');
    var tabNames=(inv.tabs||[]).join(', ');
    // 1. Email à l'invité
    var guestBody=''
      +'<div style="font-size:14px;line-height:1.6;color:#333">'
      +'<p style="margin:0 0 14px">Bonjour <b>'+inv.nom+'</b>,</p>'
      +'<p style="margin:0 0 18px">Ton accès à la plateforme <b>ISSEO Club Pilates</b> vient d\'être activé par Paul Bécaud. Tu peux dès maintenant te connecter en lecture seule aux projets qui te sont partagés.</p>'
      +'<div style="background:linear-gradient(135deg,#f0fdf4,#ffffff);border:1px solid #bbf7d0;border-radius:12px;padding:20px 22px;margin-bottom:22px">'
      +'<div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#16A34A;font-weight:700;margin-bottom:10px">🔐 Tes identifiants</div>'
      +'<div style="font-family:\'SF Mono\',Menlo,monospace;font-size:13px;background:#fff;padding:12px 14px;border-radius:8px;border:1px dashed #bbf7d0">'
      +'<div><span style="color:#888">Email&nbsp;:</span> <b>'+inv.email+'</b></div>'
      +'<div style="margin-top:4px"><span style="color:#888">Mot de passe&nbsp;:</span> <b>'+pwd+'</b></div>'
      +'</div>'
      +'<div style="font-size:11px;color:#666;margin-top:10px">Tu pourras changer ton mot de passe depuis l\'app (icône cadenas en haut à droite).</div>'
      +'</div>'
      +'<div style="background:#f8f9fb;border-radius:10px;padding:14px 16px;margin-bottom:22px">'
      +'<div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:600;margin-bottom:6px">Tes accès</div>'
      +'<div style="font-size:12px;color:#555;margin-bottom:4px"><b>Projets&nbsp;:</b> '+(studioNames||'—')+'</div>'
      +'<div style="font-size:12px;color:#555"><b>Onglets&nbsp;:</b> '+(tabNames||'—')+'</div>'
      +'</div>'
      +'<div style="text-align:center;margin:22px 0 10px">'+_emailBtn('Se connecter à ISSEO',appUrl,'#16A34A')+'</div>'
      +'<p style="margin:18px 0 0;font-size:11px;color:#aaa;text-align:center">Besoin d\'aide ? Réponds à cet email ou contacte Paul directement.</p>'
      +'</div>';
    sendEmail({
      to:inv.email,
      subject:'🎉 Bienvenue sur ISSEO Club Pilates — tes accès sont prêts',
      html:_emailLayout({title:'Bienvenue sur ISSEO',preheader:'Tes identifiants d\'accès à la plateforme',body:guestBody}),
      replyTo:'paulbecaud@isseo-dev.com'
    });
    // 2. Email à l'admin inviteur (si différent du super-admin)
    if(inv.invitedBy && inv.invitedBy!==S.user.id){
      var inviter=(S._allProfiles||[]).find(function(p){return p.id===inv.invitedBy;});
      if(inviter && inviter.email){
        var inviterBody=''
          +'<div style="font-size:14px;line-height:1.6;color:#333">'
          +'<p style="margin:0 0 14px">Bonjour '+(inviter.nom||'').split(' ')[0]+',</p>'
          +'<p style="margin:0 0 18px">Bonne nouvelle&nbsp;! Ta demande d\'invitation pour <b>'+inv.nom+'</b> (<span style="color:#888">'+inv.email+'</span>) vient d\'être <b style="color:#16A34A">approuvée</b> par Paul Bécaud.</p>'
          +'<p style="margin:0 0 22px">L\'invité a reçu ses identifiants par email. Tu peux aussi les lui partager directement depuis le panneau admin si besoin.</p>'
          +'<div style="text-align:center">'+_emailBtn('Ouvrir le panneau admin',appUrl,'#1a3a6b')+'</div>'
          +'</div>';
        sendEmail({
          to:inviter.email,
          subject:'✅ Invitation approuvée — '+inv.nom,
          html:_emailLayout({title:'Invitation approuvée',preheader:inv.nom+' a maintenant accès à la plateforme',body:inviterBody})
        });
      }
    }
  }catch(e){console.warn('[approve-email]',e);}
  toast('Invitation approuvée — compte créé pour '+inv.nom);
  render();
}

async function rejectInvitation(invId){
  if(!isSuperAdmin())return;
  var invs=S.adminSettings.invitations||[];
  var inv=invs.find(function(i){return i.id===invId;});
  if(!inv)return;
  inv.status='rejected';
  await saveAdminSettings();
  toast('Invitation rejetée');
  render();
}

function copyInviteLink(invId){
  var invs=S.adminSettings.invitations||[];
  var inv=invs.find(function(i){return i.id===invId;});
  if(!inv||inv.status!=='approved')return;
  var pwd=inv.password?decodePwd(inv.password):'(voir admin)';
  var url=window.location.origin+window.location.pathname;
  var text='🔗 Accès ISSEO Club Pilates\n\nURL : '+url+'\nEmail : '+inv.email+'\nMot de passe : '+pwd+'\n\n👁 Accès en lecture seule';
  navigator.clipboard.writeText(text).then(function(){toast('Lien copié dans le presse-papier');});
}

function deleteInvitation(invId){
  if(!isSuperAdmin())return;
  var invs=S.adminSettings.invitations||[];
  S.adminSettings.invitations=invs.filter(function(i){return i.id!==invId;});
  saveAdminSettings();
  toast('Invitation supprimée');
  render();
}

function renderInvitationsSection(){
  var invs=(S.adminSettings.invitations||[]).slice().sort(function(a,b){return (b.createdAt||'').localeCompare(a.createdAt||'');});
  if(!invs.length)return '';
  var pending=invs.filter(function(i){return i.status==='pending';});
  var approved=invs.filter(function(i){return i.status==='approved';});
  var rejected=invs.filter(function(i){return i.status==='rejected';});
  var h='<div style="margin-top:24px;padding-top:20px;border-top:2px solid #e8e8e0">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">';
  h+='<div style="font-size:15px;font-weight:700;color:#1a1a1a;display:flex;align-items:center;gap:8px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> Invitations viewers</div>';
  if(pending.length>0)h+='<span style="background:#FEF3C7;color:#92400E;font-size:10px;font-weight:600;padding:3px 8px;border-radius:6px">'+pending.length+' en attente</span>';
  h+='</div>';
  // Pending
  if(pending.length>0){
    h+='<div style="margin-bottom:14px">';
    pending.forEach(function(inv){
      h+='<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:12px 14px;margin-bottom:8px">';
      h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">';
      h+='<div><div style="font-weight:600;font-size:13px;color:#1a1a1a">'+inv.nom+' <span style="font-weight:400;color:#888;font-size:11px">'+inv.email+'</span></div>';
      h+='<div style="font-size:10px;color:#888;margin-top:2px">Invité par <b>'+inv.invitedByName+'</b> · '+new Date(inv.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+'</div>';
      h+='<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:6px">';
      inv.studios.forEach(function(sid){var st=S.studios[sid];if(st)h+='<span style="font-size:9px;background:#EEF2FF;color:#3730A3;padding:2px 6px;border-radius:4px">'+st.name+'</span>';});
      h+='</div>';
      h+='<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">';
      inv.tabs.forEach(function(t){h+='<span style="font-size:9px;background:#F0FDF4;color:#166534;padding:2px 6px;border-radius:4px">'+t+'</span>';});
      h+='</div></div>';
      h+='<div style="display:flex;gap:6px;flex-shrink:0">';
      if(isSuperAdmin()){
        h+='<button onclick="approveInvitation(\''+inv.id+'\')" style="padding:6px 14px;background:#16A34A;color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">Approuver</button>';
        h+='<button onclick="rejectInvitation(\''+inv.id+'\')" style="padding:6px 14px;background:none;border:1px solid #E5E7EB;color:#6B7280;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">Rejeter</button>';
      } else {
        h+='<span style="font-size:10px;color:#92400E;font-weight:600;padding:6px 10px;background:#FEF3C7;border-radius:8px">⏳ En attente d\'approbation</span>';
      }
      h+='</div></div></div>';
    });
    h+='</div>';
  }
  // Approved
  if(approved.length>0){
    h+='<div style="margin-bottom:14px">';
    approved.forEach(function(inv){
      h+='<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:12px 14px;margin-bottom:8px">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">';
      h+='<div><div style="font-weight:600;font-size:13px;color:#1a1a1a">✅ '+inv.nom+' <span style="font-weight:400;color:#888;font-size:11px">'+inv.email+'</span></div>';
      h+='<div style="font-size:10px;color:#888;margin-top:2px">Approuvé · '+inv.studios.length+' projet'+(inv.studios.length>1?'s':'')+' · '+inv.tabs.length+' onglet'+(inv.tabs.length>1?'s':'')+'</div></div>';
      h+='<div style="display:flex;gap:6px">';
      h+='<button onclick="copyInviteLink(\''+inv.id+'\')" style="padding:5px 12px;background:#1a3a6b;color:#fff;border:none;border-radius:7px;font-size:10px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier lien</button>';
      if(isSuperAdmin())h+='<button onclick="deleteInvitation(\''+inv.id+'\')" style="padding:5px 8px;background:none;border:1px solid #e0e0da;border-radius:7px;font-size:10px;color:#A32D2D;cursor:pointer" title="Supprimer">✕</button>';
      h+='</div></div></div>';
    });
    h+='</div>';
  }
  // Rejected
  if(rejected.length>0){
    h+='<details style="margin-bottom:8px"><summary style="font-size:11px;color:#888;cursor:pointer;margin-bottom:6px">'+rejected.length+' invitation'+(rejected.length>1?'s':'')+' rejetée'+(rejected.length>1?'s':'')+'</summary>';
    rejected.forEach(function(inv){
      h+='<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:8px 12px;margin-bottom:4px;font-size:11px;color:#991B1B;display:flex;justify-content:space-between;align-items:center">';
      h+='<span>❌ '+inv.nom+' ('+inv.email+') — par '+inv.invitedByName+'</span>';
      if(isSuperAdmin())h+='<button onclick="deleteInvitation(\''+inv.id+'\')" style="background:none;border:none;color:#ccc;cursor:pointer;font-size:12px">✕</button>';
      h+='</div>';
    });
    h+='</details>';
  }
  h+='</div>';
  return h;
}
