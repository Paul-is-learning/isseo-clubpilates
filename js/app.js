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
      // Masquer sidebar en mode auth
      var _sb=document.getElementById('app-sidebar');if(_sb)_sb.style.display='none';
      var _hb=document.getElementById('hamburger-btn');if(_hb)_hb.style.display='none';
    } else {
      // Layout avec sidebar
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
      else pageContent=renderAccueil();
      root.innerHTML=renderSidebar()+'<div class="main-content"><div class="app">'+pageContent+'</div></div>';
      if(S.view==='detail'&&S.detailTab==='localisation')setTimeout(function(){initLocalisationMap(S.selectedId);},60);
    }
    renderChat();
  }catch(e){console.error('render() error:',e);}
  _rendering=false;
}

sb.auth.getSession().then(function(res){
  var session=res.data&&res.data.session;
  if(session){
    // Vérifier si la session était inactive depuis plus de 10 min (fermeture onglet)
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
        restoreNavState();render();startSync();_startSessionWatcher();startPresenceHeartbeat();
        _loadAllProfiles();loadProspects();loadNotifications().then(function(){checkEcheances();checkMondayReport();render();});subscribeNotifications();
      });
    });
  } else {render();}
});
// Fermer le panneau notif au clic extérieur
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
  if((e.metaKey||e.ctrlKey)&&e.key==='k'){
    e.preventDefault();
    var el=document.getElementById('global-search-input');
    if(el){el.focus();el.select();}
  }
});
