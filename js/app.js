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
      var _btbh=document.getElementById('bottom-tab-bar');if(_btbh)_btbh.style.display='none';
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
      else if(S.page==='fichiers')pageContent=renderFichiersPage();
      else pageContent=renderAccueil();
      // Classe "page-transition" sur .main-content → déclenche l'anim slide-in (mobile)
      var _pageChanged=window._lastRenderedPage!==S.page||window._lastRenderedView!==S.view;
      window._lastRenderedPage=S.page;window._lastRenderedView=S.view;
      root.innerHTML=renderSidebar()+'<div class="main-content'+(_pageChanged?' page-transition':'')+'"><div class="app">'+pageContent+'</div></div>';
      // Bottom tab bar (mobile) — show if hidden
      var _btbExist=document.getElementById('bottom-tab-bar');
      if(_btbExist)_btbExist.style.display='';
      if(!_btbExist){
        var _btb=document.createElement('div');
        _btb.id='bottom-tab-bar';
        _btb.className='bottom-tab-bar';
        var _btLinks=[
          {id:'accueil',l:'Accueil',svg:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'},
          {id:'projets',l:'Studios',svg:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'},
          {id:'collab',l:'Collab',svg:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'},
          {id:'bp',l:'BP',svg:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'},
          {id:'prospection',l:'Prospect',svg:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'},
          {id:'fichiers',l:'Fichiers',svg:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'}
        ];
        var _btnav='<nav>';
        _btLinks.forEach(function(bl){
          _btnav+='<button class="btab'+(S.page===bl.id?' active':'')+'" data-page="'+bl.id+'" onclick="setPage(\''+bl.id+'\')">';
          _btnav+='<div class="btab-pill"></div>';
          _btnav+=bl.svg;
          _btnav+='<span>'+bl.l+'</span>';
          _btnav+='</button>';
        });
        _btnav+='</nav>';
        _btb.innerHTML=_btnav;
        document.body.appendChild(_btb);
      }
      if(S.view==='detail'&&S.detailTab==='localisation')setTimeout(function(){initLocalisationMap(S.selectedId);},60);
      // Sync hash routing
      _syncHash();
    }
    renderChat();
    // Montage des composants Preact (Phase 5) — appelé après chaque render()
    if(typeof mountNextStepsWidget==='function')mountNextStepsWidget();
    // Montage des file browsers Google Drive (Phase 7) — scan les placeholders
    if(typeof mountGDriveBrowsers==='function')mountGDriveBrowsers();
  }catch(e){console.error('render() error:',e);}
  _rendering=false;
}

// ── Hash routing (#7) ──────────────────────────────────────────────────────
var _firstSync=true;
function _syncHash(){
  if(!S.user)return;
  var h='#/'+S.page;
  if(S.view==='detail'&&S.selectedId){
    var sName=(S.studios[S.selectedId]&&S.studios[S.selectedId].name||S.selectedId).replace(/\s+/g,'-').toLowerCase();
    h='#/studio/'+encodeURIComponent(sName);
    if(S.detailTab&&S.detailTab!=='workflow')h+='/'+S.detailTab;
  }
  if(location.hash!==h){
    try{
      if(_firstSync)history.replaceState(null,'',h);
      else history.pushState(null,'',h);
    }catch(e){}
  }
  _firstSync=false;
}
function _restoreFromHash(){
  var h=(location.hash||'').replace(/^#\/?/,'');
  if(!h||!S.user)return false;
  var parts=h.split('/');
  if(parts[0]==='studio'&&parts[1]){
    var slug=decodeURIComponent(parts[1]).toLowerCase();
    var ids=_getStudioIds();
    var found=ids.filter(function(id){return (S.studios[id].name||'').replace(/\s+/g,'-').toLowerCase()===slug;})[0];
    if(found){
      S.page='projets';S.view='detail';S.selectedId=found;
      S.detailTab=parts[2]||'workflow';
      return true;
    }
  }
  var validPages=['accueil','projets','collab','prospection','bp','engagements'];
  if(validPages.indexOf(parts[0])>=0){S.page=parts[0];S.view='dashboard';return true;}
  return false;
}
window.addEventListener('hashchange',function(){
  if(_restoreFromHash()){saveNavState();render();}
});

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
        S._dataLoaded=true;restoreNavState();if(typeof _restoreFromHash==='function')_restoreFromHash();render();startSync();_startSessionWatcher();startPresenceHeartbeat();recordLastLogin();
        _loadAllProfiles();loadProspects();loadNotifications().then(function(){checkEcheances();checkMondayReport();render();});subscribeNotifications();
        // Deeplink email → ouvre directement la tâche : #tache=SID:TASKID
        try{
          var h=(location.hash||'').replace(/^#/,'');
          var m=/^tache=([^:]+):([^&]+)/.exec(h);
          if(m){
            var _dsid=decodeURIComponent(m[1]);
            var _dtid=decodeURIComponent(m[2]);
            setTimeout(function(){
              if(typeof openDetail==='function')openDetail(_dsid);
              if(typeof setDetailTab==='function')setDetailTab('echanges');
              setTimeout(function(){
                if(typeof openTacheModal==='function')openTacheModal(_dsid,_dtid);
                try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}
              },150);
            },400);
          }
        }catch(e){console.warn('[deeplink]',e);}
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
