// ═══════════════════════════════════════════════════════════════════════════
// PAGES — PROSPECTION
// Vue prospection studios avec notation, commentaires, suivi.
// Extrait de pages.js (Phase 3 — modularisation).
// ═══════════════════════════════════════════════════════════════════════════
// ── PAGE: Prospection ──────────────────────────────────────────────────
function setProspectView(v){S.prospectView=v;render();}
function setProspectSort(field){
  if(S.prospectSort===field){S.prospectSortDir=S.prospectSortDir==='asc'?'desc':'asc';}
  else{S.prospectSort=field;S.prospectSortDir=field==='date'?'desc':'asc';}
  render();
}
function setProspectFilter(val){S.prospectFilter=val;render();}
function setProspectStatutFilter(val){S.prospectStatutFilter=val;render();}

function _filterAndSortProspects(items){
  var filtered=items;
  // Filtre texte (ville/adresse/titre)
  if(S.prospectFilter){
    var q=S.prospectFilter.toLowerCase();
    filtered=filtered.filter(function(p){
      var hay=((p.adresse||'')+(p.adresse_extraite||'')+(p.titre||'')+(p.url||'')+(p.notes||'')).toLowerCase();
      return hay.indexOf(q)>=0;
    });
  }
  // Filtre statut (fiches uniquement)
  if(S.prospectStatutFilter&&S.prospectStatutFilter!=='all'){
    filtered=filtered.filter(function(p){
      if(p.type==='lien')return true; // liens n'ont pas de statut
      return p.statut===S.prospectStatutFilter;
    });
  }
  // Tri
  var dir=S.prospectSortDir==='asc'?1:-1;
  var field=S.prospectSort||'date';
  filtered.sort(function(a,b){
    if(field==='loyer'){
      var la=parseFloat(a.loyer||a.loyer_manuel||a.loyer_extrait||0);
      var lb=parseFloat(b.loyer||b.loyer_manuel||b.loyer_extrait||0);
      return (la-lb)*dir;
    }
    if(field==='note'){
      return (_prospectAvgRating(a)-_prospectAvgRating(b))*dir;
    }
    // date
    var da=a.date||'';
    var db=b.date||'';
    return da<db?-dir:da>db?dir:0;
  });
  return filtered;
}

function renderProspection(){
  if(!S._dataLoaded&&typeof skeletonGrid==='function')return '<div class="skeleton-page">'+skeletonGrid(4)+'</div>';
  var h='';
  var tab=S.prospectTab||'pw';
  var tabInfo=PROSPECT_TABS.filter(function(t){return t.id===tab;})[0]||PROSPECT_TABS[0];
  var accentColor=tabInfo.color;

  // ── Header ──
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px">';
  h+='<div><div style="font-size:20px;font-weight:700;color:#1a1a1a">Prospection</div><div style="font-size:12px;color:#888;margin-top:2px">Espace coopératif — annonces & prospects partagés entre associés</div></div>';
  h+='<div style="display:flex;align-items:center;gap:8px">'+renderSearchBar()+userAvatarWidget(S.profile)+'</div>';
  h+='</div>';

  // ── Pill tab bar : 3 sociétés ──
  h+='<div class="prospect-tabs">';
  PROSPECT_TABS.forEach(function(t){
    var items=(S.prospects||[]).filter(function(p){return p.societe===t.id;});
    var isActive=tab===t.id;
    h+='<button class="prospect-tab'+(isActive?' active':'')+'" onclick="setProspectTab(\''+t.id+'\')" style="'+(isActive?'color:'+t.color:'')+'">';
    h+='<span style="display:flex;align-items:center;gap:6px">'+t.icon+' '+t.label+'</span>';
    h+='<span class="ptab-count" style="'+(isActive?'background:'+t.color:'')+'">'+items.length+'</span>';
    h+='</button>';
  });
  h+='</div>';

  // ── Items pour l'onglet actif ──
  var allItems=(S.prospects||[]).filter(function(p){return p.societe===tab;});
  var liens=allItems.filter(function(p){return p.type==='lien';});
  var fiches=allItems.filter(function(p){return p.type==='fiche';});

  // ── Mini KPIs ──
  var avgAll=0,voterCount=0;
  allItems.forEach(function(p){
    var a=_prospectAvgRating(p);
    if(a>0){avgAll+=a;voterCount++;}
  });
  var avgTotal=voterCount>0?(avgAll/voterCount).toFixed(1):'—';
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">';
  var kpis=[
    {label:'Liens partagés',val:liens.length,icon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="'+accentColor+'" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'},
    {label:'Fiches prospect',val:fiches.length,icon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="'+accentColor+'" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>'},
    {label:'Note moyenne',val:avgTotal,icon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'}
  ];
  kpis.forEach(function(k){
    h+='<div style="background:#fff;border:1px solid #e8e8e0;border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:10px">';
    h+='<div style="width:36px;height:36px;border-radius:10px;background:'+accentColor+'0D;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+k.icon+'</div>';
    h+='<div><div style="font-size:18px;font-weight:700;color:#1a1a1a">'+k.val+'</div>';
    h+='<div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:500">'+k.label+'</div></div>';
    h+='</div>';
  });
  h+='</div>';

  // ── Toolbar: vue toggle + tri + filtre ──
  var _view=S.prospectView||'cards';
  h+='<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px">';
  // View toggle pills
  h+='<div style="display:flex;background:#f0f0ec;border-radius:8px;overflow:hidden;border:1px solid #e8e8e0">';
  h+='<button onclick="setProspectView(\'cards\')" style="padding:6px 12px;font-size:11px;font-weight:600;border:none;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .15s;'+(_view==='cards'?'background:'+accentColor+';color:#fff':'background:transparent;color:#666')+'">';
  h+='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> Cartes</button>';
  h+='<button onclick="setProspectView(\'table\')" style="padding:6px 12px;font-size:11px;font-weight:600;border:none;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .15s;'+(_view==='table'?'background:'+accentColor+';color:#fff':'background:transparent;color:#666')+'">';
  h+='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> Tableau</button>';
  h+='</div>';
  // Tri pills
  h+='<div style="display:flex;gap:4px;align-items:center;margin-left:4px">';
  h+='<span style="font-size:10px;color:#888;font-weight:500;margin-right:2px">Tri :</span>';
  var _sorts=[{id:'date',label:'Date'},{id:'loyer',label:'Loyer'},{id:'note',label:'Note'}];
  _sorts.forEach(function(s){
    var active=S.prospectSort===s.id;
    var arrow=active?(S.prospectSortDir==='asc'?' ↑':' ↓'):'';
    h+='<button onclick="setProspectSort(\''+s.id+'\')" style="padding:4px 10px;font-size:10px;font-weight:'+(active?'700':'500')+';border:1px solid '+(active?accentColor:'#e0e0dc')+';border-radius:6px;cursor:pointer;transition:all .15s;'+(active?'background:'+accentColor+'15;color:'+accentColor:'background:#fff;color:#666')+'">'+s.label+arrow+'</button>';
  });
  h+='</div>';
  // Filtre statut
  h+='<div style="display:flex;gap:4px;align-items:center;margin-left:4px">';
  h+='<span style="font-size:10px;color:#888;font-weight:500;margin-right:2px">Statut :</span>';
  var _statuts=[{id:'all',label:'Tous'},{id:'chaud',label:'🔴 Chaud'},{id:'tiede',label:'🟡 Tiède'},{id:'froid',label:'⚪ Froid'}];
  _statuts.forEach(function(s){
    var active=(S.prospectStatutFilter||'all')===s.id;
    h+='<button onclick="setProspectStatutFilter(\''+s.id+'\')" style="padding:4px 10px;font-size:10px;font-weight:'+(active?'700':'500')+';border:1px solid '+(active?accentColor:'#e0e0dc')+';border-radius:6px;cursor:pointer;transition:all .15s;'+(active?'background:'+accentColor+'15;color:'+accentColor:'background:#fff;color:#666')+'">'+s.label+'</button>';
  });
  h+='</div>';
  // Recherche
  h+='<div style="margin-left:auto;position:relative">';
  h+='<input type="text" value="'+(S.prospectFilter||'')+'" placeholder="Filtrer par ville/adresse…" oninput="setProspectFilter(this.value)" style="padding:6px 10px 6px 28px;font-size:11px;border:1px solid #e0e0dc;border-radius:8px;width:180px;outline:none;transition:border-color .15s" onfocus="this.style.borderColor=\''+accentColor+'\'" onblur="this.style.borderColor=\'#e0e0dc\'">';
  h+='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" style="position:absolute;left:8px;top:50%;transform:translateY(-50%)"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  h+='</div>';
  h+='</div>';

  // Appliquer filtres + tri sur les liens et fiches
  var liensFiltered=_filterAndSortProspects(liens);
  var fichesFiltered=_filterAndSortProspects(fiches);

  // ══════════════════════════════════════════════
  // VUE TABLEAU
  // ══════════════════════════════════════════════
  if(_view==='table'){
    var allFiltered=_filterAndSortProspects(liens.concat(fiches));
    h+='<div class="box" style="margin-bottom:16px;border-top:3px solid '+accentColor+';overflow-x:auto">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
    h+='<div style="font-size:14px;font-weight:700;color:#1a1a1a">Tableau comparatif <span style="font-weight:400;font-size:11px;color:#888">('+allFiltered.length+' éléments)</span></div>';
    h+='<div style="display:flex;gap:6px">';
    h+='<button class="btn" onclick="ajouterLienProspect()" style="font-size:11px;background:'+accentColor+';color:#fff;border-color:'+accentColor+'">+ Lien</button>';
    h+='<button class="btn" onclick="ajouterFicheProspect()" style="font-size:11px;background:'+accentColor+';color:#fff;border-color:'+accentColor+'">+ Fiche</button>';
    h+='</div></div>';
    if(!allFiltered.length){
      h+='<div style="text-align:center;color:#bbb;padding:28px;font-size:12px">Aucun élément ne correspond aux filtres.</div>';
    } else {
      h+='<table style="width:100%;border-collapse:collapse;font-size:11px">';
      h+='<thead><tr>';
      var _thStyle='style="padding:8px 10px;text-align:left;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#888;border-bottom:2px solid #e8e8e0;white-space:nowrap;background:#fafaf6"';
      h+='<th '+_thStyle+'>Type</th>';
      h+='<th '+_thStyle+'>Titre / Adresse</th>';
      h+='<th '+_thStyle+' style="padding:8px 10px;text-align:right;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#888;border-bottom:2px solid #e8e8e0;white-space:nowrap;background:#fafaf6;cursor:pointer" onclick="setProspectSort(\'loyer\')">Loyer €/mois'+(S.prospectSort==='loyer'?(S.prospectSortDir==='asc'?' ↑':' ↓'):'')+'</th>';
      h+='<th '+_thStyle+'>Surface</th>';
      h+='<th '+_thStyle+' style="padding:8px 10px;text-align:center;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#888;border-bottom:2px solid #e8e8e0;white-space:nowrap;background:#fafaf6;cursor:pointer" onclick="setProspectSort(\'note\')">Note'+(S.prospectSort==='note'?(S.prospectSortDir==='asc'?' ↑':' ↓'):'')+'</th>';
      h+='<th '+_thStyle+'>Statut</th>';
      h+='<th '+_thStyle+'>Auteur</th>';
      h+='<th '+_thStyle+' style="padding:8px 10px;text-align:left;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#888;border-bottom:2px solid #e8e8e0;white-space:nowrap;background:#fafaf6;cursor:pointer" onclick="setProspectSort(\'date\')">Date'+(S.prospectSort==='date'?(S.prospectSortDir==='asc'?' ↑':' ↓'):'')+'</th>';
      h+='<th '+_thStyle+'>Actions</th>';
      h+='</tr></thead><tbody>';
      allFiltered.forEach(function(p,i){
        var gIdx=S.prospects.indexOf(p);
        var isLien=p.type==='lien';
        var loyer=isLien?parseFloat(p.loyer_manuel||p.loyer_extrait||0):parseFloat(p.loyer||0);
        var addr=isLien?(p.adresse_extraite||p.titre||p.url||'—'):(p.adresse||'Sans adresse');
        var surface=p.surface?p.surface+' m²':'—';
        var avg=_prospectAvgRating(p);
        var avgStr=avg>0?avg.toFixed(1)+' ★':'—';
        var statColor=p.statut==='chaud'?'#DC2626':p.statut==='tiede'?'#D97706':'#6B7280';
        var statLabel=isLien?'—':(p.statut==='chaud'?'🔴 Chaud':p.statut==='tiede'?'🟡 Tiède':'⚪ Froid');
        var _rowBg=i%2===0?'#fff':'#fafaf6';
        h+='<tr style="background:'+_rowBg+';transition:background .1s" onmouseenter="this.style.background=\''+(S.darkMode?'#1c2128':'#f0f0ec')+'\'" onmouseleave="this.style.background=\''+_rowBg+'\'">';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;white-space:nowrap"><span style="display:inline-flex;align-items:center;gap:4px;background:'+(isLien?accentColor+'15':'#E0E7FF')+';color:'+(isLien?accentColor:'#3730A3')+';font-size:9px;font-weight:600;padding:2px 8px;border-radius:5px">'+(isLien?'🔗 Lien':'📋 Fiche')+'</span></td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">';
        if(isLien)h+='<a href="'+p.url+'" target="_blank" style="color:'+accentColor+';text-decoration:none;font-weight:500" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">'+addr+'</a>';
        else h+='<span style="font-weight:500;color:#1a1a1a">'+addr+'</span>';
        h+='</td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;text-align:right;font-weight:600;color:'+(loyer>0?'#92400E':'#ccc')+'">'+(loyer>0?loyer.toLocaleString('fr-FR')+' €':'—')+'</td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;color:#666">'+surface+'</td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;text-align:center;color:'+(avg>0?'#F59E0B':'#ccc')+'">'+avgStr+'</td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;font-size:10px">'+statLabel+'</td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;font-size:10px;color:#888">'+(p.auteur||'—')+'</td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;font-size:10px;color:#888;white-space:nowrap">'+(p.date||'—')+'</td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;white-space:nowrap">';
        h+='<button onclick="event.stopPropagation();supprimerProspect('+gIdx+')" style="background:none;border:1px solid #fecaca;color:#DC2626;border-radius:5px;font-size:10px;padding:3px 8px;cursor:pointer;transition:all .15s" onmouseover="this.style.background=S.darkMode?\'#2d0d0d\':\'#fef2f2\'" onmouseout="this.style.background=\'none\'">Supprimer</button>';
        h+='</td></tr>';
      });
      h+='</tbody></table>';
    }
    h+='</div>';
    return h;
  }

  // ══════════════════════════════════════════════
  // VUE CARTES (existante)
  // ══════════════════════════════════════════════

  // ── Section: Liens d'annonces ──
  h+='<div class="box" style="margin-bottom:16px;border-top:3px solid '+accentColor+'">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">';
  h+='<div style="font-size:14px;font-weight:700;color:#1a1a1a;display:flex;align-items:center;gap:8px">';
  h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="'+accentColor+'" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
  h+=' Liens d\'annonces partagés</div>';
  h+='<button class="btn" onclick="ajouterLienProspect()" style="font-size:11px;background:'+accentColor+';color:#fff;border-color:'+accentColor+'">+ Ajouter un lien</button>';
  h+='</div>';

  // Bannière persistante si des analyses sont en cours
  var _loadingCount=_loadingLienCount();
  if(_loadingCount>0){
    h+='<div class="lien-loading-banner">';
    h+='<div class="lien-loading-banner-spinner"></div>';
    h+='<div class="lien-loading-banner-text"><b>'+_loadingCount+' annonce'+(_loadingCount>1?'s':'')+'</b> en cours d\'analyse — titre, image, loyer et adresse extraits automatiquement…</div>';
    h+='</div>';
  }

  if(!liensFiltered.length){
    h+='<div class="lien-empty-state">';
    h+='<div class="lien-empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>';
    if(liens.length&&!liensFiltered.length){
      h+='<div class="lien-empty-title">Aucun lien ne correspond aux filtres</div>';
      h+='<div class="lien-empty-sub">Essayez d\'élargir votre recherche ou de changer de période.</div>';
    } else {
      h+='<div class="lien-empty-title">Partagez votre première annonce pour <b>'+tabInfo.label+'</b></div>';
      h+='<div class="lien-empty-sub">Collez simplement l\'URL d\'une annonce (SeLoger, BureauxLocaux, LeBonCoin…) et Isséo extraira automatiquement le titre, l\'image, le loyer et l\'adresse.</div>';
      h+='<button class="lien-empty-cta" onclick="ajouterLienProspect()" style="background:'+accentColor+'">';
      h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
      h+='Ajouter un lien d\'annonce</button>';
    }
    h+='</div>';
  } else {
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;align-items:start;width:100%">';
    liensFiltered.forEach(function(l){
      var gIdx=S.prospects.indexOf(l);
      var pv=l.preview||{};
      // ── Skeleton : analyse en cours ──
      if(S._loadingLienIds&&S._loadingLienIds[l.id]){
        h+='<div class="lien-card-skeleton" style="border-top:3px solid '+accentColor+'">';
        h+='<div class="lien-card-skeleton-img"><div class="lien-card-spinner" style="border-top-color:'+accentColor+'"></div></div>';
        h+='<div class="lien-card-skeleton-body">';
        h+='<div class="lien-card-skeleton-line" style="width:75%;background:'+accentColor+'22"></div>';
        h+='<div class="lien-card-skeleton-line" style="width:95%"></div>';
        h+='<div class="lien-card-skeleton-line" style="width:60%"></div>';
        h+='<div class="lien-card-skeleton-status">⏳ Analyse automatique en cours…</div>';
        h+='<div style="font-size:9px;color:#aaa;margin-top:6px;word-break:break-all;opacity:0.7">'+((l.titre||l.url||'').substring(0,60))+'</div>';
        h+='<div style="display:flex;justify-content:flex-end;margin-top:6px">';
        h+='<button onclick="event.stopPropagation();supprimerProspect('+gIdx+')" style="background:none;border:none;color:#ccc;cursor:pointer;font-size:14px;padding:2px" title="Annuler">&times;</button>';
        h+='</div>';
        h+='</div>';
        h+='</div>';
        return;
      }
      h+='<div style="background:#fff;border:1px solid #e8e8e0;border-radius:10px;overflow:hidden;transition:all .2s;cursor:pointer;position:relative;border-top:3px solid '+accentColor+';display:flex;flex-direction:column;min-width:0" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 4px 14px rgba(0,0,0,0.08)\'" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'none\'">';
      // Image — hauteur fixe
      if(pv.image){
        h+='<a href="'+l.url+'" target="_blank"><img src="'+pv.image+'" style="width:100%;height:120px;object-fit:cover;display:block" onerror="this.style.display=\'none\'"></a>';
      } else {
        h+='<div style="height:120px;background:'+accentColor+'0D;display:flex;align-items:center;justify-content:center">';
        h+='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="'+accentColor+'" stroke-width="1.5" opacity="0.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>';
      }
      // Content
      h+='<div style="padding:10px 12px;flex:1;display:flex;flex-direction:column">';
      h+='<a href="'+l.url+'" target="_blank" style="font-size:12px;font-weight:600;color:'+accentColor+';text-decoration:none;display:block;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">'+(l.titre||l.url)+'</a>';
      if(pv.description)h+='<div style="font-size:10px;color:#888;line-height:1.3;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+pv.description+'</div>';
      if(pv.publisher)h+='<div style="font-size:9px;color:#999;margin-bottom:3px">'+pv.publisher+'</div>';
      // Badges loyer & adresse extraits
      // Adresse extraite
      if(l.adresse_extraite){
        h+='<div style="margin:3px 0"><span style="display:inline-flex;align-items:center;gap:3px;background:#EDE9FE;color:#5B21B6;font-size:9px;font-weight:500;padding:2px 7px;border-radius:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'+l.adresse_extraite+'</span></div>';
      }
      // Loyer mensuel HT — éditable + conversion annuelle
      var _lienLoyer=l.loyer_extrait||l.loyer_manuel||'';
      h+='<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:5px 8px;margin:4px 0">';
      h+='<div style="display:flex;align-items:center;gap:4px">';
      h+='<span style="font-size:9px;color:#92400E;font-weight:600;white-space:nowrap">Loyer HT</span>';
      h+='<input type="number" value="'+(_lienLoyer)+'" placeholder="—" onclick="event.stopPropagation()" oninput="updateLienLoyer('+gIdx+',this.value)" style="width:70px;padding:2px 5px;border:1px solid #FDE68A;border-radius:4px;font-size:11px;font-weight:700;color:#92400E;background:#fff;outline:none;text-align:right"/>';
      h+='<span style="font-size:9px;color:#B45309">€/mois</span>';
      h+='</div>';
      if(_lienLoyer){
        h+='<div style="font-size:9px;color:#B45309;margin-top:2px">→ '+(parseFloat(_lienLoyer)*12).toLocaleString('fr-FR')+' €/an HT</div>';
      }
      h+='</div>';
      h+='<div style="font-size:9px;color:#aaa">'+((l.auteur||''))+' · '+(l.date||'')+'</div>';
      // Stars
      h+=renderStarRating(l,gIdx);
      // Actions row
      h+='<div style="display:flex;justify-content:flex-end;gap:2px;margin-top:2px">';
      h+='<button onclick="event.stopPropagation();refreshLinkPreview('+gIdx+')" style="background:none;border:none;color:#ccc;cursor:pointer;font-size:12px;padding:2px;transition:color .15s" onmouseover="this.style.color=\''+accentColor+'\'" onmouseout="this.style.color=\'#ccc\'" title="Actualiser">↻</button>';
      h+='<button onclick="event.stopPropagation();supprimerProspect('+gIdx+')" style="background:none;border:none;color:#ccc;cursor:pointer;font-size:14px;padding:2px;transition:color .15s" onmouseover="this.style.color=\'#ef4444\'" onmouseout="this.style.color=\'#ccc\'" title="Supprimer">&times;</button>';
      h+='</div>';
      // Comments
      h+=renderCommentThread(l,gIdx);
      h+='</div>';
      h+='</div>';
    });
    h+='</div>';
  }
  h+='</div>';

  // ── Section: Fiches prospects ──
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
  h+='<div style="font-size:14px;font-weight:700;color:#1a1a1a;display:flex;align-items:center;gap:8px">';
  h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="'+accentColor+'" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>';
  h+=' Fiches prospects</div>';
  h+='<button class="btn" onclick="ajouterFicheProspect()" style="font-size:11px;background:'+accentColor+';color:#fff;border-color:'+accentColor+'">+ Nouvelle fiche</button>';
  h+='</div>';

  if(!fichesFiltered.length){
    h+='<div style="text-align:center;color:#bbb;padding:36px;font-size:12px;background:#fff;border:1px solid #e8e8e0;border-radius:14px">';
    h+='<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" style="margin-bottom:8px"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg><br>';
    h+=(fiches.length&&!fichesFiltered.length)?'Aucune fiche ne correspond aux filtres.':'Aucune fiche prospect pour <b>'+tabInfo.label+'</b>.<br>Cliquez sur "+ Nouvelle fiche" pour commencer.';
    h+='</div>';
  } else {
    h+='<div class="cards">';
    fichesFiltered.forEach(function(f){
      var gIdx=S.prospects.indexOf(f);
      var statColor=f.statut==='chaud'?'#DC2626':f.statut==='tiede'?'#D97706':'#6B7280';
      var statLabel=f.statut==='chaud'?'Chaud':f.statut==='tiede'?'Tiède':'Froid';
      h+='<div class="prospect-card" style="border-left-color:'+accentColor+'">';
      // Header: adresse + statut
      h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">';
      h+='<div style="font-weight:700;font-size:13px;color:#1a1a1a">'+(f.adresse||'Sans adresse')+'</div>';
      h+='<span style="background:'+statColor+'15;color:'+statColor+';font-size:10px;font-weight:600;padding:3px 10px;border-radius:8px;white-space:nowrap">'+statLabel+'</span>';
      h+='</div>';
      // Détails
      if(f.surface||f.loyer){
        h+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">';
        if(f.surface)h+='<div style="font-size:11px;color:#888;display:flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg> '+f.surface+' m²</div>';
        h+='</div>';
      }
      // Loyer mensuel HT + conversion annuelle
      h+='<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:8px 10px;margin-bottom:8px">';
      h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">';
      h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400E" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
      h+='<span style="font-size:10px;font-weight:600;color:#92400E">Loyer mensuel HT</span>';
      h+='</div>';
      h+='<div style="display:flex;align-items:baseline;gap:6px">';
      h+='<input type="number" value="'+(f.loyer||'')+'" placeholder="— €" oninput="updateFicheLoyer('+gIdx+',this.value)" style="width:100px;padding:4px 7px;border:1px solid #FDE68A;border-radius:6px;font-size:13px;font-weight:700;color:#92400E;background:#fff;outline:none"/>';
      h+='<span style="font-size:11px;color:#92400E">€/mois</span>';
      h+='</div>';
      if(f.loyer){
        var annuel=f.loyer*12;
        h+='<div style="font-size:10px;color:#B45309;margin-top:4px">→ '+annuel.toLocaleString('fr-FR')+' €/an HT</div>';
      }
      h+='</div>';
      if(f.notes)h+='<div style="font-size:11px;color:#555;padding:8px 10px;background:#f8f8f4;border-radius:8px;margin-bottom:6px;line-height:1.4">'+f.notes+'</div>';
      // Stars
      h+=renderStarRating(f,gIdx);
      // Auteur + actions
      h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">';
      h+='<div style="font-size:9px;color:#aaa">Par <b>'+(f.auteur||'—')+'</b> · '+(f.date||'')+'</div>';
      h+='<div style="display:flex;gap:6px">';
      h+='<button class="btn" onclick="event.stopPropagation();modifierFicheProspect('+gIdx+')" style="font-size:10px;padding:4px 10px">Modifier</button>';
      h+='<button onclick="event.stopPropagation();supprimerProspect('+gIdx+')" style="background:none;border:1px solid #fecaca;color:#DC2626;border-radius:6px;font-size:10px;padding:4px 10px;cursor:pointer;transition:all .15s" onmouseover="this.style.background=S.darkMode?\'#2d0d0d\':\'#fef2f2\'" onmouseout="this.style.background=\'none\'">Supprimer</button>';
      h+='</div></div>';
      // Comments
      h+=renderCommentThread(f,gIdx);
      h+='</div>';
    });
    h+='</div>';
  }
  return h;
}

// Prospection CRUD functions — state transitoire pour les previews en chargement
if(typeof S!=='undefined'&&!S._loadingLienIds)S._loadingLienIds={};
function _loadingLienCount(){return Object.keys(S._loadingLienIds||{}).length;}

function ajouterLienProspect(){ouvrirFormLien();}

function ouvrirFormLien(){
  var existing=document.getElementById('lien-modal');if(existing)existing.remove();
  var overlay=document.createElement('div');
  overlay.id='lien-modal';
  overlay.className='lien-modal-overlay';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  var box='<div class="lien-modal-box">';
  box+='<div class="lien-modal-header">';
  box+='<div class="lien-modal-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>';
  box+='<div class="lien-modal-titles">';
  box+='<div class="lien-modal-title">Partager une annonce</div>';
  box+='<div class="lien-modal-sub">Collez l\'URL et les infos seront extraites automatiquement</div>';
  box+='</div>';
  box+='<button class="lien-modal-close" onclick="document.getElementById(\'lien-modal\').remove()" aria-label="Fermer">&times;</button>';
  box+='</div>';
  box+='<div class="lien-modal-body">';
  box+='<label class="lien-modal-label">URL de l\'annonce <span style="color:#EF4444">*</span></label>';
  box+='<input id="new-lien-url" type="url" placeholder="https://www.seloger.com/..." class="lien-modal-input" autocomplete="off">';
  box+='<div class="lien-modal-hint">💡 Compatible avec SeLoger, BureauxLocaux, LeBonCoin, Cushman, Savills, etc.</div>';
  box+='<label class="lien-modal-label" style="margin-top:14px">Titre personnalisé <span class="lien-modal-optional">(optionnel)</span></label>';
  box+='<input id="new-lien-titre" type="text" placeholder="Ex: Local 120m² centre-ville" class="lien-modal-input">';
  box+='<div class="lien-modal-hint">Si vide, on utilisera le titre extrait automatiquement</div>';
  box+='<div class="lien-modal-info">';
  box+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  box+='<span>L\'analyse automatique (titre, image, loyer, adresse) prend <b>quelques secondes</b>. La carte apparaîtra immédiatement avec un indicateur de chargement.</span>';
  box+='</div>';
  box+='</div>';
  box+='<div class="lien-modal-footer">';
  box+='<button onclick="document.getElementById(\'lien-modal\').remove()" class="lien-modal-cancel">Annuler</button>';
  box+='<button id="new-lien-submit" onclick="submitLienForm()" class="lien-modal-submit">';
  box+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  box+='Ajouter l\'annonce';
  box+='</button>';
  box+='</div>';
  box+='</div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
  setTimeout(function(){var el=document.getElementById('new-lien-url');if(el)el.focus();},50);
  overlay.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();submitLienForm();}
    if(e.key==='Escape'){overlay.remove();}
  });
}

function submitLienForm(){
  var urlInput=document.getElementById('new-lien-url');
  var titreInput=document.getElementById('new-lien-titre');
  if(!urlInput)return;
  var url=(urlInput.value||'').trim();
  var titre=(titreInput&&titreInput.value||'').trim();
  if(!url){
    urlInput.style.borderColor='#EF4444';
    urlInput.focus();
    toast('⚠ URL obligatoire',3000);
    return;
  }
  if(!/^https?:\/\//i.test(url)){
    urlInput.style.borderColor='#EF4444';
    urlInput.focus();
    toast('⚠ URL invalide — doit commencer par http:// ou https://',3500);
    return;
  }
  var modal=document.getElementById('lien-modal');if(modal)modal.remove();
  var prenom=(S.profile&&S.profile.nom||'').split(' ')[0]||'';
  if(!S.prospects)S.prospects=[];
  var item={
    id:'p_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
    type:'lien',url:url,titre:titre,auteur:prenom,
    date:new Date().toLocaleDateString('fr-FR'),
    societe:S.prospectTab,ratings:{},comments:[],preview:null
  };
  S.prospects.push(item);
  if(!S._loadingLienIds)S._loadingLienIds={};
  S._loadingLienIds[item.id]=true;
  saveProspects();render();
  toast('⏳ Annonce ajoutée — analyse en cours…',5000);
  fetchLinkPreview(item);
  var _tabLabel=(PROSPECT_TABS.filter(function(t){return t.id===S.prospectTab;})[0]||{}).label||S.prospectTab;
  notifyAll({type:'prospect',title:prenom+' a partagé une annonce ('+_tabLabel+')',body:titre||url});
}
function _parseAmount(raw){
  if(!raw)return NaN;
  return parseFloat(raw.replace(/[\s\u00a0\u202f]/g,'').replace(',','.'));
}
function _extractLoyerAdresse(text,extraData){
  var result={loyer:null,loyer_type:null,adresse:null};
  if(!text&&!extraData)return result;
  var t=(text||'').replace(/\u00a0/g,' ');

  // ─── LOYER ─────────────────────────────────────────────────────────
  var candidates=[];
  // (A) Données structurées Microlink (priorité maximale)
  if(extraData){
    ['prix','price','loyer','rent'].forEach(function(k){
      if(extraData[k]){
        var n=_parseAmount(extraData[k]);
        if(!isNaN(n)&&n>0)candidates.push({v:n,annual:false,pri:0,src:'microlink_'+k});
      }
    });
  }
  // (B) Loyer annuel explicite → diviser par 12
  var pAn=/(\d[\d\s\u00a0.,]*)\s*(?:€|eur(?:os?)?)\s*(?:\/\s*an|par\s+an|annuel|\/an)/gi;
  var m;while((m=pAn.exec(t))!==null){
    var n=_parseAmount(m[1]);
    if(n>=20000&&n<=120000)candidates.push({v:Math.round(n/12),annual:true,pri:1,src:'annuel'});
  }
  var pAn2=/loyer\s*annuel\s*[:=]?\s*(\d[\d\s\u00a0.,]*)\s*(?:€|eur(?:os?)?)?/gi;
  while((m=pAn2.exec(t))!==null){
    var n=_parseAmount(m[1]);
    if(n>=20000&&n<=120000)candidates.push({v:Math.round(n/12),annual:true,pri:0,src:'loyer_annuel'});
  }
  // (C) "loyer" / "loyer mensuel" + montant (très fiable)
  var pLoy=/loyer\s*(?:mensuel|commercial|hc|ht)?\s*[:=\-]?\s*(\d[\d\s\u00a0.,]*)\s*(?:€|eur(?:os?)?)/gi;
  while((m=pLoy.exec(t))!==null){
    var n=_parseAmount(m[1]);
    if(n>=3000&&n<=8000)candidates.push({v:n,annual:false,pri:1,src:'loyer_kw'});
  }
  // (D) Montant + €/mois ou €HC/HT
  var pMois=/(\d[\d\s\u00a0.,]*)\s*(?:€|eur(?:os?)?)\s*(?:\/\s*mois|par\s+mois|mensuel|HC|HT|hors\s+charges|hors\s+taxes|charges\s+comprises|CC)/gi;
  while((m=pMois.exec(t))!==null){
    var n=_parseAmount(m[1]);
    if(n>=3000&&n<=8000)candidates.push({v:n,annual:false,pri:2,src:'mois_hc'});
  }
  // (E) Tout montant €  dans la plage 3000-8000
  var pEur=/(\d[\d\s\u00a0.,]*)\s*(?:€|eur(?:os?)?)/gi;
  while((m=pEur.exec(t))!==null){
    var n=_parseAmount(m[1]);
    if(n>=3000&&n<=8000)candidates.push({v:n,annual:false,pri:3,src:'euro_gen'});
  }
  // (F) Montant annuel € dans 36000-96000 sans mot-clé annuel explicite
  var pEurAn=/(\d[\d\s\u00a0.,]*)\s*(?:€|eur(?:os?)?)/gi;
  while((m=pEurAn.exec(t))!==null){
    var n=_parseAmount(m[1]);
    if(n>=36000&&n<=96000)candidates.push({v:Math.round(n/12),annual:true,pri:4,src:'euro_annuel_guess'});
  }
  // (G) Nombre seul 3000-8000 précédé de contexte prix/loyer/coût
  var pCtx=/(?:prix|loyer|co[uû]t|mensualit[eé]|budget)\D{0,20}(\d[\d\s\u00a0.,]*)/gi;
  while((m=pCtx.exec(t))!==null){
    var n=_parseAmount(m[1]);
    if(n>=3000&&n<=8000)candidates.push({v:n,annual:false,pri:5,src:'ctx_kw'});
  }
  // Dédupliquer et prendre le meilleur
  if(candidates.length){
    candidates.sort(function(a,b){return a.pri-b.pri;});
    result.loyer=candidates[0].v;
    result.loyer_type=candidates[0].annual?'annuel':'mensuel';
    console.log('[Loyer extract]',candidates[0].src,candidates[0].v,'€/mois','(from',candidates.length,'candidates)');
  }

  // ─── ADRESSE ───────────────────────────────────────────────────────
  // (A) Données structurées
  if(extraData){
    ['adresse','address','location','lieu'].forEach(function(k){
      if(extraData[k]&&!result.adresse)result.adresse=extraData[k].substring(0,60);
    });
  }
  if(!result.adresse){
    var addrPatterns=[
      // Numéro + type voie + nom
      /(\d{1,4}\s*,?\s*(?:rue|avenue|av\.?|boulevard|boul\.?|bd\.?|place|pl\.?|impasse|imp\.?|allée|all\.?|chemin|ch\.?|cours|passage|quai|route|rte\.?|square|sq\.?|parvis|esplanade|galerie|résidence|r[eé]s\.?)\s+[A-ZÀ-Üa-zà-ü\-']+(?:\s+[A-ZÀ-Üa-zà-ü\-']+){0,5})/i,
      // Type voie sans numéro
      /((?:rue|avenue|boulevard|place|impasse|allée|chemin|cours|passage|quai)\s+(?:du|de\s+la|de\s+l'|des|de|d')\s*[A-ZÀ-Üa-zà-ü\-']+(?:\s+[A-ZÀ-Üa-zà-ü\-']+){0,4})/i,
      // Code postal + ville
      /(\d{5})\s+([A-ZÀ-Ü][a-zà-ü\-']+(?:[\s-]+[A-ZÀ-Üa-zà-ü\-']+){0,3})/i,
      // Ville connue (IDF + grandes villes)
      /((?:Paris|Lyon|Marseille|Toulouse|Nice|Nantes|Strasbourg|Montpellier|Bordeaux|Lille|Versailles|Montreuil|Boulogne[\s-]Billancourt|Levallois[\s-]Perret|Neuilly[\s-]sur[\s-]Seine|Issy[\s-]les[\s-]Moulineaux|Saint[\s-][A-ZÀ-Ü][a-zà-ü\-']+|Rueil[\s-]Malmaison|Courbevoie|Puteaux|Suresnes|Clichy|Vincennes|Fontenay|Nogent|Charenton|Ivry|Vitry|Créteil|Colombes|Asnières|Gennevilliers|Nanterre|Argenteuil|Cergy|Pontoise|Massy|Orly|Rungis|Antony|Clamart|Meudon|Sèvres|Chatou|Maisons[\s-]Laffitte|Le\s+Chesnay|Vélizy)(?:\s+\d{1,2}(?:e|er|[eè]me))?)/i
    ];
    for(var i=0;i<addrPatterns.length;i++){
      var m=addrPatterns[i].exec(t);
      if(m){result.adresse=m[0].trim().replace(/\s+/g,' ').substring(0,60);break;}
    }
  }
  return result;
}

function fetchLinkPreview(item){
  // Appel Microlink avec data selectors pour extraire prix/adresse du DOM
  var apiUrl='https://api.microlink.io?url='+encodeURIComponent(item.url);
  // Sélecteurs CSS courants pour les sites immobiliers
  apiUrl+='&data.prix.selector=.price,.prix,.Price,.amount,.listing-price,[class*=price],[class*=Price],[class*=loyer],[class*=Loyer],[data-price],span.red,.value-price,.detail-price,.offer-price,h2.price&data.prix.attr=text';
  apiUrl+='&data.adresse.selector=.address,.adresse,.location,.ville,.city,.listing-address,[class*=address],[class*=Address],[class*=location],[class*=localisation],[data-address],.detail-address,.offer-address&data.adresse.attr=text';
  function _finishLoad(success){
    if(S._loadingLienIds&&S._loadingLienIds[item.id]){
      delete S._loadingLienIds[item.id];
    }
    saveProspects();render();
    if(success){
      var _title=(item.titre||item.preview&&item.preview.title||'').substring(0,40);
      toast('✓ Analyse terminée'+(_title?' — '+_title:''),3000);
    }
  }
  fetch(apiUrl)
    .then(function(r){return r.json();})
    .then(function(data){
      if(data.status==='success'&&data.data){
        var d=data.data;
        item.preview={
          title:d.title||'',
          description:d.description||'',
          image:d.image&&d.image.url||'',
          publisher:d.publisher||''
        };
        if(!item.titre&&d.title)item.titre=d.title;
        // Données structurées extraites par Microlink
        var extraData={};
        if(d.prix)extraData.prix=d.prix;
        if(d.adresse)extraData.adresse=d.adresse;
        console.log('[LinkPreview]',item.url,'\n  title:',d.title,'\n  desc:',d.description,'\n  prix(DOM):',d.prix,'\n  adresse(DOM):',d.adresse);
        // Extraction loyer & adresse (DOM + regex fallback)
        var fullText=(d.title||'')+' '+(d.description||'')+' '+(item.url||'');
        var extracted=_extractLoyerAdresse(fullText,extraData);
        if(extracted.loyer){item.loyer_extrait=extracted.loyer;item.loyer_type=extracted.loyer_type;}
        if(extracted.adresse)item.adresse_extraite=extracted.adresse;
        _finishLoad(true);
      } else {
        // Microlink a répondu mais sans data — marquer comme terminé
        if(!item.preview)item.preview={title:'',description:'',image:'',publisher:''};
        _finishLoad(false);
        toast('⚠ Aperçu indisponible pour ce site — vous pouvez saisir les infos manuellement',4000);
      }
    })
    .catch(function(e){
      console.warn('LinkPreview error:',e);
      if(!item.preview)item.preview={title:'',description:'',image:'',publisher:''};
      _finishLoad(false);
      toast('⚠ Erreur réseau — lien enregistré sans aperçu',4000);
    });
}
function refreshLinkPreview(idx){
  var p=S.prospects[idx];if(!p||p.type!=='lien')return;
  toast('Actualisation…');fetchLinkPreview(p);
}
function ajouterFicheProspect(){ouvrirFormFiche();}

function ouvrirFormFiche(existingIdx){
  var existing=document.getElementById('fiche-modal');if(existing)existing.remove();
  var editing=typeof existingIdx==='number';
  var f=editing?S.prospects[existingIdx]:{adresse:'',surface:'',loyer:'',notes:'',statut:'froid'};
  if(editing&&!f)return;
  var overlay=document.createElement('div');
  overlay.id='fiche-modal';
  overlay.className='lien-modal-overlay';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  var box='<div class="lien-modal-box" style="max-width:480px">';
  box+='<div class="lien-modal-header">';
  box+='<div class="lien-modal-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>';
  box+='<div class="lien-modal-titles">';
  box+='<div class="lien-modal-title">'+(editing?'Modifier la fiche':'Nouvelle fiche prospect')+'</div>';
  box+='<div class="lien-modal-sub">Saisissez les infos d\'un local repéré en direct</div>';
  box+='</div>';
  box+='<button class="lien-modal-close" onclick="document.getElementById(\'fiche-modal\').remove()">&times;</button>';
  box+='</div>';
  box+='<div class="lien-modal-body">';
  box+='<label class="lien-modal-label">Adresse du local <span style="color:#EF4444">*</span></label>';
  box+='<input id="new-fiche-adresse" type="text" value="'+(f.adresse||'').replace(/"/g,'&quot;')+'" placeholder="Ex: 12 rue de la République, 34000 Montpellier" class="lien-modal-input">';
  box+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px">';
  box+='<div>';
  box+='<label class="lien-modal-label">Surface <span class="lien-modal-optional">(m²)</span></label>';
  box+='<input id="new-fiche-surface" type="number" value="'+(f.surface||'')+'" placeholder="120" class="lien-modal-input">';
  box+='</div>';
  box+='<div>';
  box+='<label class="lien-modal-label">Loyer mensuel HT <span class="lien-modal-optional">(€)</span></label>';
  box+='<input id="new-fiche-loyer" type="number" value="'+(f.loyer||'')+'" placeholder="4500" class="lien-modal-input">';
  box+='</div>';
  box+='</div>';
  box+='<label class="lien-modal-label" style="margin-top:14px">Statut</label>';
  box+='<div class="lien-modal-statut-group" id="new-fiche-statut-group">';
  ['chaud','tiede','froid'].forEach(function(st){
    var lbl=st==='chaud'?'🔴 Chaud':st==='tiede'?'🟡 Tiède':'⚪ Froid';
    var active=(f.statut||'froid')===st;
    box+='<button type="button" class="lien-modal-statut'+(active?' active':'')+'" data-statut="'+st+'" onclick="document.querySelectorAll(\'.lien-modal-statut\').forEach(function(b){b.classList.remove(\'active\');});this.classList.add(\'active\');">'+lbl+'</button>';
  });
  box+='</div>';
  box+='<label class="lien-modal-label" style="margin-top:14px">Notes <span class="lien-modal-optional">(optionnel)</span></label>';
  box+='<textarea id="new-fiche-notes" rows="3" placeholder="Contact, rendez-vous, particularités…" class="lien-modal-input" style="resize:vertical;font-family:inherit">'+(f.notes||'').replace(/</g,'&lt;')+'</textarea>';
  box+='</div>';
  box+='<div class="lien-modal-footer">';
  box+='<button onclick="document.getElementById(\'fiche-modal\').remove()" class="lien-modal-cancel">Annuler</button>';
  box+='<button onclick="submitFicheForm('+(editing?existingIdx:'-1')+')" class="lien-modal-submit">';
  box+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
  box+=(editing?'Enregistrer':'Créer la fiche');
  box+='</button>';
  box+='</div>';
  box+='</div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
  setTimeout(function(){var el=document.getElementById('new-fiche-adresse');if(el)el.focus();},50);
  overlay.addEventListener('keydown',function(e){if(e.key==='Escape')overlay.remove();});
}

function submitFicheForm(idx){
  var adresse=(document.getElementById('new-fiche-adresse').value||'').trim();
  var surface=(document.getElementById('new-fiche-surface').value||'').trim();
  var loyer=(document.getElementById('new-fiche-loyer').value||'').trim();
  var notes=(document.getElementById('new-fiche-notes').value||'').trim();
  var statutBtn=document.querySelector('#new-fiche-statut-group .lien-modal-statut.active');
  var statut=statutBtn?statutBtn.getAttribute('data-statut'):'froid';
  if(!adresse){
    var el=document.getElementById('new-fiche-adresse');
    if(el){el.style.borderColor='#EF4444';el.focus();}
    toast('⚠ Adresse obligatoire',3000);
    return;
  }
  var modal=document.getElementById('fiche-modal');if(modal)modal.remove();
  var editing=idx>=0;
  var prenom=(S.profile&&S.profile.nom||'').split(' ')[0]||'';
  if(!S.prospects)S.prospects=[];
  if(editing){
    var f=S.prospects[idx];if(!f)return;
    f.adresse=adresse;f.surface=surface;f.loyer=parseFloat(loyer)||0;f.notes=notes;f.statut=statut;
    saveProspects();render();toast('✓ Fiche mise à jour',3000);
    var _tabLabel=(PROSPECT_TABS.filter(function(t){return t.id===f.societe;})[0]||{}).label||f.societe;
    notifyAll({type:'prospect',title:_myProspectName()+' a modifié une fiche ('+_tabLabel+')',body:adresse});
  } else {
    S.prospects.push({
      id:'p_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      type:'fiche',adresse:adresse,surface:surface,
      loyer:parseFloat(loyer)||0,notes:notes,statut:statut,
      auteur:prenom,date:new Date().toLocaleDateString('fr-FR'),
      societe:S.prospectTab,ratings:{},comments:[]
    });
    saveProspects();render();toast('✓ Fiche prospect créée',3000);
    var _tabLabel=(PROSPECT_TABS.filter(function(t){return t.id===S.prospectTab;})[0]||{}).label||S.prospectTab;
    notifyAll({type:'prospect',title:prenom+' a ajouté une fiche prospect ('+_tabLabel+')',body:adresse+(loyer?' — '+loyer+' €/mois':'')});
  }
}
var _lienLoyerTimer=null;
function updateLienLoyer(idx,val){
  var p=S.prospects[idx];if(!p)return;
  p.loyer_manuel=parseFloat(val)||0;
  if(!p.loyer_manuel)delete p.loyer_manuel;
  clearTimeout(_lienLoyerTimer);
  _lienLoyerTimer=setTimeout(function(){saveProspects();render();},800);
}
var _ficheLoyerTimer=null;
function updateFicheLoyer(idx,val){
  var f=S.prospects[idx];if(!f)return;
  f.loyer=parseFloat(val)||0;
  // Update annuel display sans re-render complet
  var card=document.querySelectorAll('.prospect-card')[0];
  clearTimeout(_ficheLoyerTimer);
  _ficheLoyerTimer=setTimeout(function(){saveProspects();render();},800);
}
function modifierFicheProspect(idx){
  ouvrirFormFiche(idx);
}
function supprimerProspect(idx){
  if(!confirm('Supprimer cet élément ?'))return;
  S.prospects.splice(idx,1);
  saveProspects();render();toast('Élément supprimé');
}
async function saveProspects(){
  try{
    migrateProspects(); // assure IDs + déduplique
    var res=await sb.from('studios').upsert({id:'_prospects',data:{items:S.prospects},updated_at:new Date().toISOString()});
    if(res.error){console.error('saveProspects error:',res.error);toast('⚠ Erreur sauvegarde prospects : '+res.error.message);return false;}
    return true;
  }catch(e){console.error('saveProspects error:',e);toast('⚠ Erreur sauvegarde prospects');return false;}
}
async function loadProspects(){
  try{
    var res=await sb.from('studios').select('data').eq('id','_prospects').single();
    if(res.data&&res.data.data&&res.data.data.items){
      S.prospects=res.data.data.items;
      var before=S.prospects.length;
      migrateProspects();
      // Si des doublons ont été supprimés, sauvegarder le nettoyage
      if(S.prospects.length<before){saveProspects();console.log('[Prospects] Dédupliqué : '+before+' → '+S.prospects.length);}
      fetchMissingPreviews();
    }
  }catch(e){}
}
function fetchMissingPreviews(){
  var changed=false;
  (S.prospects||[]).forEach(function(p){
    if(p.type==='lien'&&!p.preview&&p.url){fetchLinkPreview(p);return;}
    // Re-extraire loyer/adresse avec regex améliorée
    if(p.type==='lien'&&p.preview){
      var fullText=(p.preview.title||'')+' '+(p.preview.description||'')+' '+(p.url||'');
      var extracted=_extractLoyerAdresse(fullText,null);
      if(extracted.loyer&&extracted.loyer!==p.loyer_extrait){p.loyer_extrait=extracted.loyer;p.loyer_type=extracted.loyer_type;changed=true;}
      else if(!extracted.loyer&&p.loyer_extrait){delete p.loyer_extrait;delete p.loyer_type;changed=true;}
      if(extracted.adresse&&extracted.adresse!==p.adresse_extraite){p.adresse_extraite=extracted.adresse;changed=true;}
    }
  });
  if(changed){saveProspects();render();}
}

// ── Prospection: helpers ───────────────────────────────────────────────
function migrateProspects(){
  (S.prospects||[]).forEach(function(p){
    if(!p.societe)p.societe='pw';
    if(!p.ratings)p.ratings={};
    if(!p.comments)p.comments=[];
    if(!p.id)p.id='p_'+((p.date||'').replace(/\//g,''))+'_'+((p.url||p.adresse||'').slice(0,20).replace(/\W/g,''))+'_'+(p.auteur||'').slice(0,5).replace(/\W/g,'');
  });
  // Dédupliquer par ID
  var seen={};
  S.prospects=(S.prospects||[]).filter(function(p){
    if(!p.id)return true;
    if(seen[p.id])return false;
    seen[p.id]=true;
    return true;
  });
  // Dédupliquer par contenu (même url ou même adresse+auteur+date)
  var sigSeen={};
  S.prospects=S.prospects.filter(function(p){
    var sig=p.type==='lien'?(p.url||''):(p.adresse||'');
    sig+=':'+(p.auteur||'')+':'+(p.date||'')+':'+(p.societe||'');
    if(sigSeen[sig])return false;
    sigSeen[sig]=true;
    return true;
  });
}
function setProspectTab(id){S.prospectTab=id;S.prospectExpandedComments={};render();}
function _myProspectName(){return (S.profile&&S.profile.nom||'').split(' ')[0]||'Anon';}

function rateProspect(idx,stars){
  var p=S.prospects[idx];if(!p)return;
  var me=_myProspectName();
  if(p.ratings[me]===stars)delete p.ratings[me];// toggle off
  else p.ratings[me]=stars;
  saveProspects();render();
  var _tabLabel=(PROSPECT_TABS.filter(function(t){return t.id===p.societe;})[0]||{}).label||p.societe;
  var _pLabel=p.type==='lien'?(p.titre||p.url||'Annonce'):(p.adresse||'Fiche');
  notifyAll({type:'prospect',title:_myProspectName()+' a noté '+stars+'★ ('+_tabLabel+')',body:_pLabel});
}
function toggleProspectComments(idx){
  S.prospectExpandedComments[idx]=!S.prospectExpandedComments[idx];render();
}
function addProspectComment(idx){
  var text=prompt('Votre commentaire :');if(!text)return;
  var p=S.prospects[idx];if(!p)return;
  p.comments.push({auteur:_myProspectName(),text:text,date:new Date().toLocaleDateString('fr-FR')});
  S.prospectExpandedComments[idx]=true;
  saveProspects();render();toast('Commentaire ajouté');
  var _tabLabel=(PROSPECT_TABS.filter(function(t){return t.id===p.societe;})[0]||{}).label||p.societe;
  var _pLabel=p.type==='lien'?(p.titre||p.url||'Annonce'):(p.adresse||'Fiche');
  notifyAll({type:'prospect',title:_myProspectName()+' a commenté un prospect ('+_tabLabel+')',body:_pLabel+' — '+text.slice(0,60)});
}
function deleteProspectComment(pIdx,cIdx){
  var p=S.prospects[pIdx];if(!p||!p.comments[cIdx])return;
  var c=p.comments[cIdx];var me=_myProspectName();
  if(c.auteur!==me&&!isSuperAdmin()){toast('Seul l\'auteur peut supprimer');return;}
  if(!confirm('Supprimer ce commentaire ?'))return;
  p.comments.splice(cIdx,1);
  saveProspects();render();toast('Commentaire supprimé');
}

function _prospectAvgRating(p){
  var vals=Object.values(p.ratings||{});
  if(!vals.length)return 0;
  return vals.reduce(function(s,v){return s+v;},0)/vals.length;
}

function renderStarRating(p,globalIdx){
  var me=_myProspectName();
  var myRating=p.ratings&&p.ratings[me]||0;
  var avg=_prospectAvgRating(p);
  var voters=Object.keys(p.ratings||{}).length;
  var h='<div style="display:flex;align-items:center;gap:6px;margin:6px 0">';
  for(var s=1;s<=3;s++){
    var filled=s<=myRating;
    h+='<button class="star-btn'+(filled?'':' empty')+'" onclick="event.stopPropagation();rateProspect('+globalIdx+','+s+')" title="'+(filled?'Retirer ma note':'Noter '+s+'/3')+'">';
    h+='★</button>';
  }
  if(voters>0){
    h+='<span style="font-size:11px;color:#888;margin-left:4px">';
    h+='<b style="color:#F59E0B">'+avg.toFixed(1)+'</b>';
    h+=' <span style="color:#bbb">·</span> '+voters+' vote'+(voters>1?'s':'');
    // Qui a voté — mini avatars
    h+='</span>';
    h+='<div style="display:flex;margin-left:6px">';
    Object.keys(p.ratings).forEach(function(name,vi){
      var color=['#1a3a6b','#0F6E56','#854F0B','#533AB7','#DC2626'][vi%5];
      h+='<div title="'+name+' : '+p.ratings[name]+'★" style="width:20px;height:20px;border-radius:50%;background:'+color+';color:#fff;font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-left:'+(vi>0?'-4px':'0')+';border:2px solid #fff;cursor:default">'+name.charAt(0).toUpperCase()+'</div>';
    });
    h+='</div>';
  }
  h+='</div>';
  return h;
}

function renderCommentThread(p,globalIdx){
  var comments=p.comments||[];
  var n=comments.length;
  var expanded=!!S.prospectExpandedComments[globalIdx];
  var h='<div style="margin-top:8px;padding-top:8px;border-top:1px solid #f0f0ea">';
  // Toggle + add button
  h+='<div style="display:flex;align-items:center;gap:8px">';
  h+='<button onclick="event.stopPropagation();toggleProspectComments('+globalIdx+')" style="background:none;border:none;cursor:pointer;font-size:11px;color:#888;display:flex;align-items:center;gap:5px;padding:2px 0;transition:color .2s" onmouseover="this.style.color=\'#555\'" onmouseout="this.style.color=\'#888\'">';
  h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  h+=n>0?('<b>'+n+'</b> commentaire'+(n>1?'s':'')):'Commenter';
  if(expanded)h+=' <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>';
  else h+=' <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';
  h+='</button>';
  h+='<button onclick="event.stopPropagation();addProspectComment('+globalIdx+')" style="background:none;border:1px solid #e0e0d8;border-radius:6px;cursor:pointer;font-size:10px;color:#888;padding:3px 8px;transition:all .15s" onmouseover="this.style.background=S.darkMode?\'#21262d\':\'#f5f5f0\';this.style.color=S.darkMode?\'#c9d1d9\':\'#555\'" onmouseout="this.style.background=\'none\';this.style.color=\'#888\'">+ Ajouter</button>';
  h+='</div>';
  // Thread expanded
  if(expanded&&n>0){
    h+='<div class="comment-thread" style="margin-top:8px;display:flex;flex-direction:column;gap:6px">';
    comments.forEach(function(c,ci){
      var isMe=c.auteur===_myProspectName();
      var initColor=['#1a3a6b','#0F6E56','#854F0B','#533AB7','#DC2626'][c.auteur.charCodeAt(0)%5];
      h+='<div style="display:flex;gap:8px;align-items:flex-start;padding:8px 10px;background:'+(isMe?'#f0f4ff':'#fafaf8')+';border-radius:10px;position:relative">';
      // Mini avatar
      h+='<div style="width:24px;height:24px;border-radius:50%;background:'+initColor+';color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+c.auteur.charAt(0).toUpperCase()+'</div>';
      h+='<div style="flex:1;min-width:0">';
      h+='<div style="font-size:10px;margin-bottom:2px"><b style="color:#333">'+c.auteur+'</b> <span style="color:#bbb">· '+c.date+'</span></div>';
      h+='<div style="font-size:12px;color:#444;line-height:1.4">'+htmlEscape(c.text)+'</div>';
      h+='</div>';
      if(isMe||isSuperAdmin()){
        h+='<button onclick="event.stopPropagation();deleteProspectComment('+globalIdx+','+ci+')" style="background:none;border:none;color:#ccc;cursor:pointer;font-size:14px;padding:0 2px;position:absolute;top:6px;right:8px;transition:color .15s" onmouseover="this.style.color=\'#ef4444\'" onmouseout="this.style.color=\'#ccc\'" title="Supprimer">&times;</button>';
      }
      h+='</div>';
    });
    h+='</div>';
  }
  h+='</div>';
  return h;
}

