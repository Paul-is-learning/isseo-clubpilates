// ── PAGE: Projets (liste studios) ──────────────────────────────────────
function renderProjets(){
  if(!S._dataLoaded&&typeof skeletonGrid==='function')return '<div class="skeleton-page">'+skeletonGrid(6)+'</div>';
  var allIds=_getStudioIds();
  var isAdmin=!!S.profile&&!isViewer();
  var ids=allIds;
  if(S.dashFilter!=='all')ids=allIds.filter(function(id){return S.studios[id].statut===S.dashFilter;});

  var h='';
  // ── Page header ──
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px">';
  h+='<div><div style="font-size:20px;font-weight:700;color:#1a1a1a">Studios</div><div style="font-size:12px;color:#888;margin-top:2px">'+allIds.length+' studios en suivi</div></div>';
  h+='<div style="display:flex;align-items:center;gap:8px">';
  h+=renderSearchBar();
  h+=userAvatarWidget(S.profile);
  h+='</div></div>';

  // ── Toolbar : vue toggle + filtres + actions ──
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">';
  h+='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">';
  h+=renderViewToggle();
  h+=renderStatusFilters(allIds);
  h+='</div>';
  h+='<div style="display:flex;align-items:center;gap:6px">';
  if(isAdmin)h+='<button class="btn" onclick="toggleNewForm()" style="font-size:11px">'+(S.showNewForm?'Annuler':'+ Nouveau studio')+'</button>';
  h+='</div></div>';

  if(S.showNewForm)h+=renderNewForm();

  // ── Content area ──
  if(S.dashView==='grid'){
    h+='<div class="cards">';
    ids.forEach(function(id){h+=renderCard(id,S.studios[id]);});
    h+='</div>';
    if(!ids.length)h+='<div style="text-align:center;color:#bbb;padding:30px;font-size:13px">Aucun studio avec ce filtre</div>';
  } else if(S.dashView==='cohorte'){
    h+=renderCohorteView(ids);
  } else if(S.dashView==='list'){
    h+=renderListView(ids);
  }
  return h;
}

// ── PAGE: Projets Admin ────────────────────────────────────────────────
var _adminPresenceInterval=null;
function _startAdminPresenceRefresh(){
  _stopAdminPresenceRefresh();
  _adminPresenceInterval=setInterval(async function(){
    if(S.mainTab!=='admin'){_stopAdminPresenceRefresh();return;}
    await loadPresence();
    render();
  },30000);
}
function _stopAdminPresenceRefresh(){
  if(_adminPresenceInterval){clearInterval(_adminPresenceInterval);_adminPresenceInterval=null;}
}
function renderProjetsAdmin(){
  if(!_adminPresenceInterval)_startAdminPresenceRefresh();
  var h='';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">';
  h+='<div><div style="font-size:20px;font-weight:700;color:#1a1a1a">Administration</div><div style="font-size:12px;color:#888;margin-top:2px">Gestion des utilisateurs et paramètres</div></div>';
  h+='<button class="btn" onclick="S.mainTab=\'studios\';_stopAdminPresenceRefresh();render()" style="font-size:11px">← Retour aux projets</button>';
  h+='</div>';
  h+=renderAdminPanel();
  return h;
}

// Legacy wrapper — backward compatibility
function renderDashboard(){
  return '<div class="app">'+renderProjets()+'</div>';
}

