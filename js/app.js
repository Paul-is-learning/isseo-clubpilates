// ── Détection réseau offline/online ──────────────────────────────────────────
var _isOffline=!navigator.onLine;
function _showOfflineBanner(offline){
  _isOffline=offline;
  var existing=document.getElementById('offline-banner');
  if(offline){
    if(!existing){
      var b=document.createElement('div');
      b.id='offline-banner';
      b.style.cssText='position:fixed;top:0;left:0;width:100%;background:#c53030;color:#fff;text-align:center;padding:8px;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 2px 8px rgba(0,0,0,0.2)';
      b.textContent='Hors ligne — Les modifications ne seront pas synchronisées';
      document.body.appendChild(b);
    }
  } else {
    if(existing)existing.remove();
    // Resync au retour en ligne
    if(typeof syncDataFallback==='function')syncDataFallback();
  }
}
window.addEventListener('offline',function(){_showOfflineBanner(true);});
window.addEventListener('online',function(){_showOfflineBanner(false);toast('Connexion rétablie ✓');});
if(_isOffline)_showOfflineBanner(true);

// ── Render principal ────────────────────────────────────────────────────────
var _rendering=false;
function render(){
  if(_rendering)return;
  _rendering=true;
  try{
    var root=document.getElementById('root');
    if(!root){_rendering=false;return;}
    document.body.classList.toggle('dark',!!S.darkMode);
    if(S.view==='auth'){
      root.innerHTML=renderAuth();
      var _sb=document.getElementById('app-sidebar');if(_sb)_sb.style.display='none';
      var _hb=document.getElementById('hamburger-btn');if(_hb)_hb.style.display='none';
    } else {
      var pageContent='';
      if(S.page==='accueil')pageContent=renderAccueil();
      else if(S.page==='projets'){
        if(S.view==='detail')pageContent=renderDetail();
        else if(S.mainTab==='admin')pageContent=renderProjetsAdmin();
        else pageContent=renderProjets();
      }
      else if(S.page==='prospection')pageContent=renderProspection();
      else if(S.page==='bp')pageContent=renderBPConsolide();
      else if(S.page==='engagements')pageContent=renderPageEngagements();
      else if(S.page==='collab')pageContent=renderCollab();
      else pageContent=renderAccueil();
      root.innerHTML=renderSidebar()+'<div class="main-content"><div class="app">'+pageContent+'</div></div>';
      if(S.view==='detail'&&S.detailTab==='localisation')setTimeout(function(){initLocalisationMap(S.selectedId);},60);
    }
    renderChat();
  }catch(e){console.error('render() error:',e);}
  _rendering=false;
}

// ── Init session ────────────────────────────────────────────────────────────
sb.auth.getSession().then(function(res){
  var session=res.data&&res.data.session;
  if(session){
    var hiddenAt=0;
    try{hiddenAt=parseInt(localStorage.getItem('isseo_hidden_at')||'0');}catch(e){}
    if(hiddenAt&&Date.now()-hiddenAt>_INACTIVITY_MS){
      try{localStorage.removeItem('isseo_hidden_at');localStorage.removeItem('isseo_nav');}catch(e){}
      sb.auth.signOut();render();return;
    }
    try{localStorage.removeItem('isseo_hidden_at');}catch(e){}
    S.user=session.user;
    sb.from('profiles').select('*').eq('id',session.user.id).single().then(function(r){
      S.profile=r.data;
      loadAll().then(function(){
        if(S.adminSettings.roles&&S.adminSettings.roles[session.user.id])
          S.profile=Object.assign({},S.profile,{role:S.adminSettings.roles[session.user.id]});
        if(S.adminSettings.blocked&&S.adminSettings.blocked.indexOf(session.user.id)>=0){
          sb.auth.signOut();S.user=null;S.profile=null;render();return;
        }
        restoreNavState();render();startSync();_startSessionWatcher();startPresenceHeartbeat();recordLastLogin();
        _loadAllProfiles();loadProspects();loadNotifications().then(function(){checkEcheances();checkMondayReport();render();});subscribeNotifications();
      });
    });
  } else {render();}
});

// ── Events globaux ──────────────────────────────────────────────────────────
document.addEventListener('click',function(e){
  if(S.notifOpen&&!e.target.closest('#notif-dropdown')&&!e.target.closest('[title="Notifications"]')){
    S.notifOpen=false;
    var nd=document.getElementById('notif-dropdown');if(nd)nd.style.display='none';
  }
  if(S.searchOpen&&!e.target.closest('#search-container')){
    S.searchOpen=false;S.searchIdx=-1;
    var dd=document.getElementById('search-dropdown');if(dd)dd.style.display='none';
  }
});
document.addEventListener('keydown',function(e){
  // Cmd+K : command palette (fallback : focus search input)
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){
    if(typeof openCommandPalette==='function'&&S.view!=='auth'){
      e.preventDefault();openCommandPalette();return;
    }
    var el=document.getElementById('global-search-input');
    if(el){e.preventDefault();el.focus();el.select();}
  }
});
