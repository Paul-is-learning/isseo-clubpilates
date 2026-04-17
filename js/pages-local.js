// ═══════════════════════════════════════════════════════════════════════════
// PAGES — LOCAL & LOCALISATION (onglets studio)
// Onglet Local (plans, équipements) et Localisation (carte, analyse site).
// Extrait de pages.js (Phase 3 — modularisation).
// ═══════════════════════════════════════════════════════════════════════════

function renderLocal(sid,s){
  var planPath='plans/'+sid+'.png';
  var hasPlan=(S._planExists&&S._planExists[sid])===true;
  // Découverte asynchrone de la présence du plan (la première fois)
  if(!S._planExists)S._planExists={};
  if(S._planExists[sid]===undefined){
    S._planExists[sid]='loading';
    (function(_sid,_path){
      var img=new Image();
      img.onload=function(){S._planExists[_sid]=true;if(S.detailTab==='local'&&S.selectedId===_sid)render();};
      img.onerror=function(){S._planExists[_sid]=false;if(S.detailTab==='local'&&S.selectedId===_sid)render();};
      img.src=_path+'?t='+Date.now();
    })(sid,planPath);
  }

  var h='<div class="local-plan-wrap">';

  // ── Header esthétique ──
  h+='<div class="local-plan-header">';
  h+='<div class="local-plan-header-left">';
  h+='<div class="local-plan-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> PLAN MASSE</div>';
  h+='<h2 class="local-plan-title">'+s.name+'</h2>';
  h+='<div class="local-plan-addr"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> '+(s.addr||'')+'</div>';
  h+='</div>';
  h+='<div class="local-plan-stats">';
  h+='<div class="local-plan-stat"><div class="local-plan-stat-val">~135</div><div class="local-plan-stat-lbl">m² utiles</div></div>';
  h+='<div class="local-plan-stat"><div class="local-plan-stat-val">12</div><div class="local-plan-stat-lbl">postes</div></div>';
  h+='<div class="local-plan-stat"><div class="local-plan-stat-val">2,45</div><div class="local-plan-stat-lbl">m HSP</div></div>';
  h+='</div>';
  h+='</div>';

  // ── Stage avec grille blueprint + plan ──
  h+='<div class="local-plan-stage">';
  h+='<div class="local-plan-grid"></div>';
  h+='<div class="local-plan-corner tl"></div><div class="local-plan-corner tr"></div><div class="local-plan-corner bl"></div><div class="local-plan-corner br"></div>';

  // Particules flottantes
  h+='<div class="local-plan-particles">';
  for(var _p=0;_p<9;_p++){
    var _px=(8+Math.round(Math.random()*84));
    var _py=(25+Math.round(Math.random()*70));
    var _pd=(Math.random()*5).toFixed(1);
    var _pr=(4+Math.random()*3).toFixed(1);
    h+='<div class="local-plan-particle" style="left:'+_px+'%;top:'+_py+'%;animation-delay:'+_pd+'s;animation-duration:'+_pr+'s"></div>';
  }
  h+='</div>';

  // Compass
  h+='<div class="local-plan-compass"><div class="local-plan-compass-ring"></div><div class="local-plan-compass-needle"></div><div class="local-plan-compass-center"></div></div>';

  // HUD strip top
  h+='<div class="local-plan-hud"><div class="local-plan-hud-dot"></div>BLUEPRINT · DWG/34970 · REV. 03<div class="local-plan-hud-bar"></div></div>';

  // Footer ticker
  h+='<div class="local-plan-footer">';
  h+='<div class="local-plan-footer-item"><span class="dot"></span>ÉCHELLE 1:100</div>';
  h+='<div class="local-plan-footer-item"><span class="dot"></span>135 m² UTILES</div>';
  h+='<div class="local-plan-footer-item"><span class="dot"></span>12 POSTES</div>';
  h+='</div>';

  if(hasPlan){
    h+='<div class="local-plan-frame">';
    h+='<img src="'+planPath+'" alt="Plan masse '+s.name+'" class="local-plan-img" onclick="openPlanLightbox(\''+planPath+'\',\''+(s.name||'').replace(/\'/g,"\\'")+'\')"/>';
    h+='<div class="local-plan-scan"></div>';
    // Pins dynamiques sur zones-clés (coords relatives au plan)
    var _pins=[
      {x:45,y:68,cls:'primary',label:'Studio 78 m²'},
      {x:82,y:70,cls:'',label:'Accueil'},
      {x:32,y:42,cls:'',label:'PT Room'},
      {x:75,y:40,cls:'',label:'Bureau'}
    ];
    _pins.forEach(function(p,i){
      h+='<div class="local-plan-pin '+p.cls+'" style="left:'+p.x+'%;top:'+p.y+'%;animation-delay:'+(1.6+i*0.15).toFixed(2)+'s,'+(2.2+i*0.15).toFixed(2)+'s"><span class="local-plan-pin-label">'+p.label+'</span></div>';
    });
    h+='</div>';
    h+='<div class="local-plan-hint">🔍 Cliquez sur le plan pour l\'agrandir</div>';
  } else if(S._planExists[sid]==='loading'){
    h+='<div class="local-plan-empty"><div class="local-plan-spinner"></div><div>Chargement du plan…</div></div>';
  } else {
    h+='<div class="local-plan-empty">';
    h+='<svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="opacity:.35"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>';
    h+='<div style="margin-top:12px;font-size:14px;font-weight:600;color:#64748b">Aucun plan masse disponible</div>';
    h+='<div style="margin-top:6px;font-size:11px;color:#94a3b8;max-width:360px;text-align:center;line-height:1.6">Déposez un fichier <code style="background:#f1f5f9;padding:1px 6px;border-radius:4px;color:#475569">'+planPath+'</code> dans le répertoire de l\'application pour l\'afficher ici.</div>';
    h+='</div>';
  }

  h+='</div>'; // /stage

  // ── Légende / infos techniques ──
  if(hasPlan){
    h+='<div class="local-plan-legend">';
    var legends=[
      {c:'#1D9E75',t:'Studio principal',d:'78.66 m²'},
      {c:'#378ADD',t:'Accueil',d:'46.84 m²'},
      {c:'#FBBF24',t:'PT Room',d:'12.82 m²'},
      {c:'#7F77DD',t:'Vestiaire / WC PMR',d:'6.67 m²'},
      {c:'#D85A30',t:'Bureau + Salle Repos',d:'bureau admin'},
      {c:'#94A3B8',t:'Local technique',d:'2.02 m²'}
    ];
    legends.forEach(function(l,i){
      h+='<div class="local-plan-legend-item" style="animation-delay:'+(0.1+i*0.07).toFixed(2)+'s"><span class="local-plan-legend-dot" style="background:'+l.c+'"></span><div><div class="local-plan-legend-title">'+l.t+'</div><div class="local-plan-legend-sub">'+l.d+'</div></div></div>';
    });
    h+='</div>';
  }

  h+='</div>'; // /wrap
  return h;
}

// ─── Lightbox pour zoom plan ──────────────────────────────────────────────────
function openPlanLightbox(src,title){
  var ex=document.getElementById('plan-lightbox');
  if(ex)ex.remove();
  var d=document.createElement('div');
  d.id='plan-lightbox';
  d.className='plan-lightbox';
  d.innerHTML='<div class="plan-lightbox-inner"><div class="plan-lightbox-header"><span>'+title+'</span><button onclick="document.getElementById(\'plan-lightbox\').remove()" class="plan-lightbox-close">✕</button></div><img src="'+src+'" alt="'+title+'"/></div>';
  d.addEventListener('click',function(e){if(e.target===d)d.remove();});
  document.body.appendChild(d);
}

function renderLocalisation(s){
  var ae=encodeURIComponent(s.addr);
  var sv=S.mapStreetView||false;
  var sid=S.selectedId;
  var ld=LOCALISATION_DATA[sid];
  var coords=STUDIO_COORDS[sid];
  var zonesOn=S.mapShowZones!==false;

  var h='<div>';

  // ── Toggle Carte interactive / Street View ──
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">';
  h+='<div style="display:flex;background:#f0f0ea;border-radius:10px;padding:3px;gap:2px">';
  h+='<button onclick="if(S.mapStreetView){S.mapStreetView=false;render();}" style="padding:6px 18px;border-radius:8px;border:none;background:'+(sv?'transparent':'#fff')+';color:'+(sv?'#888':'#1a1a1a')+';font-size:13px;cursor:pointer;font-weight:'+(sv?400:600)+';box-shadow:'+(sv?'none':'0 1px 3px rgba(0,0,0,0.1)')+'">🗺️ Carte interactive</button>';
  h+='<button onclick="if(!S.mapStreetView){toggleStreetView();}" style="padding:6px 18px;border-radius:8px;border:none;background:'+(sv?'#fff':'transparent')+';color:'+(sv?'#1a1a1a':'#888')+';font-size:13px;cursor:pointer;font-weight:'+(sv?600:400)+';box-shadow:'+(sv?'0 1px 3px rgba(0,0,0,0.1)':'none')+'">📸 Street View</button>';
  h+='</div>';
  if(!sv){
    h+='<button onclick="S.mapShowZones='+(zonesOn?'false':'true')+';render();" style="display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;border:0.5px solid '+(zonesOn?'#1D9E75':'#ccc')+';background:'+(zonesOn?'#E1F5EE':'#fff')+';color:'+(zonesOn?'#0F6E56':'#666')+';font-size:12px;cursor:pointer;font-weight:'+(zonesOn?600:400)+'">⭕ Zones de chalandise</button>';
  }
  h+='</div>';

  // ── Bloc adresse éditable ──
  var _isEditingAddr=S._editAddr===true;
  var _canEdit=!!S.profile&&!isViewer();
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:10px 14px;background:#f8fafc;border-radius:10px;border:0.5px solid #e2e8f0;flex-wrap:wrap">';
  h+='<div style="font-size:12px;color:#64748b;font-weight:600;white-space:nowrap">📍 Adresse :</div>';
  if(_isEditingAddr){
    h+='<input id="edit-addr-input" type="text" value="'+(S._editAddrVal||s.addr||'').replace(/"/g,'&quot;')+'" oninput="S._editAddrVal=this.value" style="flex:1;min-width:200px;padding:7px 10px;border:1.5px solid #1D9E75;border-radius:8px;font-size:12px;outline:none;background:#fff" placeholder="Rue, CP Ville"/>';
    h+='<button onclick="updateStudioAddr(\''+sid+'\',S._editAddrVal)" style="padding:5px 12px;border:none;background:#1D9E75;color:#fff;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer">Valider</button>';
    h+='<button onclick="S._editAddr=false;S._editAddrVal=null;render();" style="padding:5px 12px;border:1px solid #ccc;background:#fff;color:#666;border-radius:7px;font-size:11px;cursor:pointer">Annuler</button>';
  } else {
    h+='<div style="flex:1;font-size:12px;color:#1a1a1a">'+(s.addr||'<i style=\"color:#aaa\">Non renseignée</i>')+'</div>';
    if(_canEdit){
      h+='<button onclick="S._editAddr=true;S._editAddrVal=\''+(s.addr||'').replace(/'/g,"\\'")+'\';render();setTimeout(function(){var el=document.getElementById(\'edit-addr-input\');if(el)el.focus();},50);" style="padding:4px 10px;border:1px solid #ddd;background:#fff;color:#64748b;border-radius:7px;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px" onmouseenter="this.style.borderColor=\'#1D9E75\';this.style.color=\'#0F6E56\'" onmouseleave="this.style.borderColor=\'#ddd\';this.style.color=\'#64748b\'">✏️ Modifier</button>';
    }
  }
  h+='</div>';

  if(!sv){
    // ── Mode Carte Leaflet ──
    h+='<div style="display:grid;grid-template-columns:1fr 290px;gap:14px;margin-bottom:16px;align-items:start">';

    // Colonne gauche : carte (toujours affiché, le géocodage se fait en async)
    h+='<div>';
    h+='<div style="border-radius:14px;overflow:hidden;border:0.5px solid #d0dbe8;box-shadow:0 4px 24px rgba(0,0,20,0.1)">';
    h+='<div id="leaflet-map" style="height:430px;width:100%;background:#e8eff7"></div>';
    h+='</div>';
    h+='</div>';

    // Colonne droite : KPI panel
    var _zrMax=isGoldGymStudio(S.selectedId)?10000:5000;
    var zr=S.mapZoneRadius||2000;
    var zrKm=zr>=1000?(zr/1000).toFixed(1)+' km':zr+' m';
    var zrPct=((zr-500)/(_zrMax-500)*100).toFixed(1);
    h+='<div style="display:flex;flex-direction:column;gap:10px">';

    // ── Curseur zone + Population ──
    h+='<div style="background:#fff;border:0.5px solid #d4e8d0;border-radius:14px;padding:14px 16px">';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
    h+='<div style="font-size:9.5px;color:#0F6E56;text-transform:uppercase;letter-spacing:0.06em;font-weight:700">⭕ Zone de chalandise</div>';
    h+='<div style="font-size:13px;font-weight:700;color:#0f1f3d">Rayon : <span id="map-radius-label">'+zrKm+'</span></div>';
    h+='</div>';
    h+='<input type="range" id="map-zone-slider" class="zone-slider" min="500" max="'+_zrMax+'" step="250" value="'+zr+'" '
      +'style="--pct:'+zrPct+'%" oninput="updateZoneRadius(this.value)"/>';
    if(_zrMax>5000){
      h+='<div style="display:flex;justify-content:space-between;font-size:9.5px;color:#94a3b8;margin-top:4px;margin-bottom:12px"><span>500 m</span><span>2 km</span><span>4 km</span><span>7 km</span><span>10 km</span></div>';
    } else {
      h+='<div style="display:flex;justify-content:space-between;font-size:9.5px;color:#94a3b8;margin-top:4px;margin-bottom:12px"><span>500 m</span><span>1 km</span><span>2 km</span><span>3.5 km</span><span>5 km</span></div>';
    }
    h+='<div id="map-pop-estimate" style="background:#f0f7f4;border-radius:10px;padding:12px;text-align:center;min-height:62px;display:flex;align-items:center;justify-content:center">';
    h+='<div style="font-size:11px;color:#94a3b8">Calcul en cours…</div>';
    h+='</div>';
    h+='<div id="map-adherent-pct" style="margin-top:10px;padding:10px 12px;background:#f8faff;border-radius:10px;border:0.5px solid #dde5f5">';
    h+='<div style="font-size:9.5px;color:#5a6e99;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px">🎯 Adhérents cibles vs zone de chalandise</div>';
    h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;text-align:center" id="map-adherent-grid">';
    var _bpAdh=getBPAdherents(S.selectedId);
    h+='<div style="background:#eef2ff;border-radius:8px;padding:7px 4px"><div style="font-size:8px;color:#94a3b8;margin-bottom:2px">Fin A1</div><div style="font-size:13px;font-weight:700;color:#1a3a6b">'+_bpAdh[11]+'</div><div id="map-adh-pct-a1" style="font-size:12px;font-weight:700;color:#94a3b8;margin-top:2px">—</div></div>';
    h+='<div style="background:#eef2ff;border-radius:8px;padding:7px 4px"><div style="font-size:8px;color:#94a3b8;margin-bottom:2px">Fin A2</div><div style="font-size:13px;font-weight:700;color:#1a3a6b">'+_bpAdh[23]+'</div><div id="map-adh-pct-a2" style="font-size:12px;font-weight:700;color:#94a3b8;margin-top:2px">—</div></div>';
    h+='<div style="background:#eef2ff;border-radius:8px;padding:7px 4px"><div style="font-size:8px;color:#94a3b8;margin-bottom:2px">Fin A3</div><div style="font-size:13px;font-weight:700;color:#1a3a6b">'+_bpAdh[35]+'</div><div id="map-adh-pct-a3" style="font-size:12px;font-weight:700;color:#94a3b8;margin-top:2px">—</div></div>';
    h+='</div>';
    h+='</div>';
    h+='<div id="map-age35-card" style="margin-top:10px;padding:11px 13px;background:#f5f3ff;border-radius:10px;border:0.5px solid #d8d0f5;display:flex;align-items:center;justify-content:space-between;gap:8px">';
    h+='<div style="font-size:10px;color:#6555a0;font-weight:600;line-height:1.4">👥 Pop. cible 35+ ans<br><span style="font-size:9px;font-weight:400;color:#94a3b8">53.7% moy. nationale · INSEE</span></div>';
    h+='<div style="text-align:right"><div id="map-age35-abs" style="font-size:9.5px;color:#94a3b8;margin-bottom:1px">—</div><div id="map-age35-pct" style="font-size:16px;font-weight:700;color:#94a3b8">—</div></div>';
    h+='</div>';
    h+='</div>';
    h+='</div>'; // fin colonne droite KPI
    h+='</div>'; // fin grille 2 colonnes carte+KPI

    // ── Cards sous la carte (pleine largeur) ──
    if(ld){
      var hasTrafic=ld.trafic&&ld.trafic[0];
      var revItem=(ld.demo||[]).find(function(d){return /revenu/i.test(d.lbl);});
      var topTags=(ld.tags||[]).filter(function(t){return t.c==='tg';}).slice(0,3);
      var hasTC=ld.transports&&ld.transports.length>0;
      // Grille : Trafic | Revenu | TC+tags
      var cols=[];if(hasTrafic)cols.push('trafic');if(revItem)cols.push('revenu');if(hasTC||topTags.length)cols.push('tc');
      if(cols.length){
        h+='<div style="display:grid;grid-template-columns:repeat('+cols.length+',1fr);gap:10px;margin-bottom:16px">';
        if(hasTrafic){
          var tf=ld.trafic[0];
          var tmjaStr2=tf.kpi;
          var tmjaV=0;var tx1=tmjaStr2.match(/(\d+)[–\-–—](\d+)\s*[Kk]/);
          if(tx1){tmjaV=(parseInt(tx1[1])+parseInt(tx1[2]))/2*1000;}
          else{var tx2=tmjaStr2.match(/~?(\d[\d ]+)/);if(tx2)tmjaV=parseDemographicNum(tx2[1]);}
          var tC2=tmjaV>25000?'#D85A30':tmjaV>15000?'#E89B2A':'#4BA874';
          var tBg2=tmjaV>25000?'#FEF3EF':tmjaV>15000?'#FEF9EF':'#EDF7F2';
          h+='<div style="background:'+tBg2+';border:0.5px solid '+tC2+'44;border-radius:12px;padding:14px 16px;border-left:3px solid '+tC2+'">';
          h+='<div style="font-size:9.5px;color:'+tC2+';text-transform:uppercase;letter-spacing:0.05em;font-weight:700;margin-bottom:6px">🚗 Trafic routier · TMJA</div>';
          h+='<div style="font-size:22px;font-weight:700;color:'+tC2+';line-height:1">'+tmjaStr2+'</div>';
          h+='<div style="font-size:10px;color:#94a3b8;margin-top:4px">véh/jour · '+tf.lbl+'</div>';
          h+='</div>';
        }
        if(revItem){
          h+='<div style="background:#fff;border:0.5px solid #e2e8f0;border-radius:12px;padding:14px 16px;border-left:3px solid '+revItem.col+'">';
          h+='<div style="font-size:9.5px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;margin-bottom:6px">💰 '+revItem.lbl+'</div>';
          h+='<div style="font-size:20px;font-weight:700;color:#0f1f3d;line-height:1.2">'+revItem.kpi+'</div>';
          h+='<div style="font-size:10px;color:#94a3b8;margin-top:4px;line-height:1.4">'+revItem.sub+'</div>';
          h+='</div>';
        }
        if(hasTC||topTags.length){
          h+='<div style="background:#EEF4FB;border:0.5px solid #c5d8ef;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;justify-content:center;gap:8px">';
          if(hasTC){
            h+='<div style="display:flex;align-items:center;gap:8px">';
            h+='<div style="font-size:24px;font-weight:700;color:#185FA5;line-height:1">'+ld.transports.length+'</div>';
            h+='<div style="font-size:11px;color:#2d5a8e;line-height:1.3"><strong>lignes TC</strong><br>desservant le studio</div>';
            h+='</div>';
          }
          if(topTags.length){h+='<div style="display:flex;gap:6px;flex-wrap:wrap">';h+=topTags.map(_locTag).join('');h+='</div>';}
          h+='</div>';
        }
        h+='</div>';
      }
    } else {
      h+='<div class="box" style="color:#999;font-size:12px;text-align:center;padding:24px;margin-bottom:16px">Données de localisation<br>non encore renseignées</div>';
    }
  } else {
    // ── Mode Street View (iframe embed) ──
    var svCoords=S.mapCoords&&sid&&S.mapCoords[sid];
    if(!svCoords&&STUDIO_COORDS[sid])svCoords={lat:STUDIO_COORDS[sid].lat,lon:STUDIO_COORDS[sid].lon};
    var svOpenUrl=svCoords?'https://www.google.com/maps/@'+svCoords.lat+','+svCoords.lon+',3a,75y,0h,90t/data=!3m1!1e1':'https://www.google.com/maps/search/'+ae+'/@'+ae+',17z/data=!3m1!1e1';
    h+='<div style="position:relative;border-radius:14px;overflow:hidden;margin-bottom:14px;border:0.5px solid #e0e0d8;box-shadow:0 4px 20px rgba(0,0,0,0.12);background:#1a1a1a">';
    if(svCoords){
      var iframeSrc='https://maps.google.com/maps?q=&layer=c&cbll='+svCoords.lat+','+svCoords.lon+'&cbp=12,0,,0,0&output=svembed';
      h+='<iframe src="'+iframeSrc+'" style="width:100%;height:440px;border:none;display:block" allowfullscreen loading="lazy"></iframe>';
    } else {
      var iframeSrc='https://maps.google.com/maps?q='+ae+'&layer=c&output=svembed';
      h+='<iframe src="'+iframeSrc+'" style="width:100%;height:440px;border:none;display:block" allowfullscreen loading="lazy"></iframe>';
    }
    h+='<a href="'+svOpenUrl+'" target="_blank" style="position:absolute;bottom:14px;right:14px;text-decoration:none;z-index:10"><div style="background:#fff;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;color:#1a1a1a;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;gap:6px">📍 Ouvrir dans Google Maps</div></a>';
    h+='</div>';
  }

  // ── Liens ──
  var _gmapUrl=coords?'https://www.google.com/maps/@'+coords.lat+','+coords.lon+',17z':'https://www.google.com/maps/search/'+ae;
  var _osmUrl=coords?'https://www.openstreetmap.org/?mlat='+coords.lat+'&mlon='+coords.lon+'#map=17/'+coords.lat+'/'+coords.lon:'https://www.openstreetmap.org/search?query='+ae;
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">';
  h+='<a href="'+_gmapUrl+'" target="_blank" style="text-decoration:none"><div class="box" style="display:flex;align-items:center;gap:12px;margin-bottom:0"><span style="font-size:20px">📍</span><div><div style="font-weight:600;font-size:13px;color:#1a1a1a">Google Maps</div><div style="font-size:11px;color:#888">Ouvrir dans Google Maps</div></div></div></a>';
  h+='<a href="'+_osmUrl+'" target="_blank" style="text-decoration:none"><div class="box" style="display:flex;align-items:center;gap:12px;margin-bottom:0"><span style="font-size:20px">🗺️</span><div><div style="font-weight:600;font-size:13px;color:#1a1a1a">OpenStreetMap</div><div style="font-size:11px;color:#888">Ouvrir dans OSM</div></div></div></a>';
  h+='</div>';
  h+='<div class="box" style="background:#f5f5f0"><div style="font-size:11px;color:#888;margin-bottom:4px">Adresse</div><div style="font-size:14px;font-weight:500">'+s.addr+'</div></div>';

  // ── Analyse de site ──
  if(ld){h+=renderLocalisationData(ld,s);}
  h+='</div>';
  return h;
}

