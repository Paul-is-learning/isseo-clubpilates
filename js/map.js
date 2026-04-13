// ── Carte Leaflet interactive ──────────────────────────────────────────────────
var _leafletMapInst=null;
var _leafletCircles=[];   // références aux cercles de zone (max = [2])

// ── INSEE : population réelle par zone (geo.api.gouv.fr) ──────────────────────
var _inseePopCache={};      // cache {sid_radius: result}
var _inseeDebounceTimer=null;

// Distance en mètres entre deux points GPS (Haversine)
function haversineM(lat1,lon1,lat2,lon2){
  var R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// Aire d'intersection exacte de deux cercles (formule géométrique)
function circleIntersectArea(d,r1,r2){
  if(d>=r1+r2)return 0;                        // Pas de chevauchement
  if(d+r2<=r1)return Math.PI*r2*r2;            // Commune entièrement dans la zone
  if(d+r1<=r2)return Math.PI*r1*r1;            // Zone entièrement dans la commune
  var a=Math.max(-1,Math.min(1,(d*d+r1*r1-r2*r2)/(2*d*r1)));
  var b=Math.max(-1,Math.min(1,(d*d+r2*r2-r1*r1)/(2*d*r2)));
  var alpha=Math.acos(a),beta=Math.acos(b);
  var tri=0.5*Math.sqrt(Math.max(0,(-d+r1+r2)*(d+r1-r2)*(d-r1+r2)*(d+r1+r2)));
  return r1*r1*alpha+r2*r2*beta-tri;
}

// Estimation de population via geo.api.gouv.fr (données INSEE officielles)
// Approche : grille N×N de points dans le cercle → query API "quelle commune est ici ?"
// → fraction exacte sans approximation géométrique, capte les communes adjacentes (Montpellier, etc.)
async function calcPopZoneINSEE(lat,lon,radiusM){
  console.log('[INSEE] START lat='+lat.toFixed(4)+' lon='+lon.toFixed(4)+' r='+radiusM);
  var N=8; // grille 8×8 = 64 pts max, ~50 dans le cercle
  var latDeg=radiusM/111000;
  var lonDeg=radiusM/(111000*Math.cos(lat*Math.PI/180));
  // Générer les points de la grille qui tombent dans le cercle
  var pts=[];
  for(var i=0;i<N;i++){for(var j=0;j<N;j++){
    var pLat=lat-latDeg+(2*latDeg*(i+0.5)/N);
    var pLon=lon-lonDeg+(2*lonDeg*(j+0.5)/N);
    if(haversineM(lat,lon,pLat,pLon)<=radiusM)pts.push({lat:pLat,lon:pLon});
  }}
  if(!pts.length)return null;
  // Requêtes parallèles : pour chaque point, demander à l'API quelle commune l'englobe
  var results=await Promise.all(pts.map(function(pt){
    var url='https://geo.api.gouv.fr/communes?lat='+pt.lat.toFixed(6)+'&lon='+pt.lon.toFixed(6)
           +'&fields=nom,population,surface&format=json';
    return fetch(url)
      .then(function(r){return r.ok?r.json():null;})
      .then(function(d){return d&&d[0]&&d[0].population&&d[0].surface?d[0]:null;})
      .catch(function(){return null;});
  }));
  // Agréger par commune : compter combien de points de la zone sont dans chaque commune
  var communeMap={};
  var validPts=results.filter(function(r){return r!==null;});
  var totalPts=validPts.length;
  if(!totalPts)return null;
  validPts.forEach(function(c){
    var k=c.nom;
    if(!communeMap[k])communeMap[k]={nom:c.nom,population:c.population,surface:c.surface,count:0};
    communeMap[k].count++;
  });
  // Calcul de la contribution : fraction de zone × surface zone / surface commune × population
  var zoneArea=Math.PI*radiusM*radiusM;
  var total=0,details=[];
  Object.keys(communeMap).forEach(function(k){
    var c=communeMap[k];
    var frZone=c.count/totalPts;                         // fraction de la zone dans cette commune
    var frCommune=Math.min(1,frZone*zoneArea/(c.surface*10000)); // fraction de la commune dans la zone
    var contrib=Math.round(c.population*frCommune);
    if(contrib>0){total+=contrib;details.push({nom:c.nom,population:c.population,fraction:Math.round(frCommune*100),contrib:contrib});}
  });
  details.sort(function(a,b){return b.contrib-a.contrib;});
  console.log('[INSEE] END r='+radiusM+' validPts='+totalPts+'/'+pts.length+' communes='+JSON.stringify(Object.keys(communeMap))+' total='+total);
  return total>0?{total:total,communes:details,nbCommunes:Object.keys(communeMap).length,nbPts:totalPts}:null;
}

// Parse une chaîne démographique type "~30 000" ou "16 700" → nombre entier
function parseDemographicNum(str){
  if(!str)return 0;
  var clean=String(str).replace(/[~€≈>< km²]/gi,'').replace(/\s/g,'').replace(/\./g,'');
  var n=parseInt(clean);return isNaN(n)?0:n;
}

// Estime la population dans un cercle de rayon radiusM
function calcPopZone(sid,radiusM){
  var ld=LOCALISATION_DATA[sid];
  if(!ld||!ld.demo)return null;
  var densityItem=(ld.demo||[]).find(function(d){return /densit/i.test(d.lbl);});
  var popItem=(ld.demo||[]).find(function(d){return /population/i.test(d.lbl);});
  if(!densityItem)return null;
  var density=parseDemographicNum(densityItem.kpi);
  if(!density)return null;
  var radiusKm=radiusM/1000;
  var areaKm2=Math.PI*radiusKm*radiusKm;
  var estPop=Math.round(density*areaKm2);
  return{estPop:estPop,density:density,areaKm2:Math.round(areaKm2*10)/10};
}

// Met à jour le cercle + déclenche le calcul INSEE (debounce 500ms)
function updateZoneRadius(val){
  var _maxR=isGoldGymStudio(S.selectedId)?10000:5000;
  var r=Math.max(500,Math.min(_maxR,parseInt(val)||2000));
  S.mapZoneRadius=r;
  // Mise à jour immédiate cercle + UI
  if(_leafletMapInst&&_leafletCircles[2])_leafletCircles[2].setRadius(r);
  var km=r>=1000?(r/1000).toFixed(1)+' km':r+' m';
  var lbl=document.getElementById('map-radius-label');
  if(lbl)lbl.textContent=km;
  var sl=document.getElementById('map-zone-slider');
  if(sl){var pct=((r-500)/(_maxR-500)*100).toFixed(1);sl.style.setProperty('--pct',pct+'%');}
  // Loader pendant le debounce (popEl re-fetché à chaque fois pour éviter référence obsolète)
  (function(){var el=document.getElementById('map-pop-estimate');
    if(el)el.innerHTML='<div style="font-size:11px;color:#94a3b8;display:flex;align-items:center;gap:7px">'
      +'<div style="width:14px;height:14px;border:2px solid #e2e8f0;border-top-color:#0F6E56;border-radius:50%;animation:spin 0.8s linear infinite;flex-shrink:0"></div>'
      +'Données INSEE en cours…</div>';
  })();
  // Debounce : appel API 500ms après arrêt du curseur
  if(_inseeDebounceTimer)clearTimeout(_inseeDebounceTimer);
  _inseeDebounceTimer=setTimeout(function(){
    var sid=S.selectedId;
    var coords=S.mapCoords[sid];
    var cacheKey=sid+'_'+r;
    // Re-fetch popEl ici (évite référence obsolète si render() a été appelé entre-temps)
    var popEl=document.getElementById('map-pop-estimate');
    if(_inseePopCache[cacheKey]){_renderINSEEPop(popEl,_inseePopCache[cacheKey],r);return;}
    if(!coords){_renderDensityPop(popEl,sid,r);return;}
    calcPopZoneINSEE(coords.lat,coords.lon,r).then(function(result){
      // Re-fetch encore une fois après les appels async (peuvent prendre 1-3s)
      var el=document.getElementById('map-pop-estimate');
      if(result&&result.total>0){_inseePopCache[cacheKey]=result;_renderINSEEPop(el,result,r);}
      else{_renderDensityPop(el,sid,r);}
    }).catch(function(e){console.error('[INSEE] erreur:',e);});
  },500);
}

function _renderINSEEPop(popEl,result,radiusM){
  if(!popEl)return;
  var km=radiusM>=1000?(radiusM/1000).toFixed(1)+' km':radiusM+' m';
  var fmt=new Intl.NumberFormat('fr-FR');
  var top=result.communes.slice(0,3).map(function(c){
    return '<span style="white-space:nowrap">'+c.nom+' <b>'+fmt.format(c.contrib)+'</b> ('+c.fraction+'%)</span>';
  }).join(' &middot; ');
  popEl.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;gap:3px;width:100%">'
    +'<div style="font-size:26px;font-weight:700;color:#0f1f3d;line-height:1">'+fmt.format(result.total)+'</div>'
    +'<div style="font-size:10px;color:#64748b;font-weight:500">habitants dans un rayon de '+km+'</div>'
    +'<div style="font-size:9px;background:#E1F5EE;color:#0F6E56;border-radius:20px;padding:2px 9px;margin-top:4px;font-weight:600">📊 Source : INSEE 2021 · '+result.communes.length+' commune'+(result.communes.length>1?'s':'')+'</div>'
    +(top?'<div style="font-size:9px;color:#94a3b8;margin-top:5px;text-align:center;line-height:1.5">'+top+'</div>':'')
    +(result.nbPts?'<div style="font-size:8px;color:#cbd5e1;margin-top:2px">'+result.nbPts+' pts · '+result.communes.length+' commune(s)</div>':'')
    +'</div>';
  _updateAdherentPct(result.total);
}

// Met à jour les badges "Adhérents cibles A1/A2/A3 = X% de la pop cible 35+ zone"
var _PCT_35PLUS=0.537; // 53.7% moyenne nationale INSEE RP2021
function _updateAdherentPct(totalPop){
  var fmt=new Intl.NumberFormat('fr-FR');
  var pop35=totalPop?Math.round(totalPop*_PCT_35PLUS):0;
  // Card pop cible 35+
  var absEl=document.getElementById('map-age35-abs');
  var pctEl=document.getElementById('map-age35-pct');
  if(absEl)absEl.innerHTML=pop35?'<span style="color:#6555a0;font-weight:600">'+fmt.format(pop35)+'</span> hab.':'—';
  if(pctEl){pctEl.style.color=pop35?'#6555a0':'#94a3b8';pctEl.textContent=pop35?'53.7%':'—';}
  // Grille A1/A2/A3 : % adhérents cibles par rapport à pop 35+ de la zone
  var ids=['map-adh-pct-a1','map-adh-pct-a2','map-adh-pct-a3'];
  var _bpA=getBPAdherents(S.selectedId);
  var cibles=[_bpA[11],_bpA[23],_bpA[35]];
  for(var i=0;i<3;i++){
    var el=document.getElementById(ids[i]);
    if(!el)continue;
    if(!pop35){el.style.color='#94a3b8';el.textContent='—';continue;}
    var pct=cibles[i]/pop35*100;
    var pctStr=pct>=1?pct.toFixed(1)+'%':pct.toFixed(2)+'%';
    var col=pct<1?'#0F6E56':pct<3?'#E89B2A':'#D85A30';
    el.style.color=col;
    el.textContent=pctStr;
  }
}

function _renderDensityPop(popEl,sid,radiusM){
  if(!popEl)return;
  var pop=calcPopZone(sid,radiusM);
  var km=radiusM>=1000?(radiusM/1000).toFixed(1)+' km':radiusM+' m';
  var fmt=new Intl.NumberFormat('fr-FR');
  if(pop&&pop.estPop>0){
    popEl.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;gap:3px;width:100%">'
      +'<div style="font-size:26px;font-weight:700;color:#0f1f3d;line-height:1">'+fmt.format(pop.estPop)+'</div>'
      +'<div style="font-size:10px;color:#64748b;font-weight:500">hab. estimés · rayon '+km+'</div>'
      +'<div style="font-size:9px;background:#f0f0ea;color:#888;border-radius:20px;padding:2px 9px;margin-top:4px">Estimation · densité communale</div>'
      +'</div>';
    _updateAdherentPct(pop.estPop);
  } else {
    popEl.innerHTML='<div style="font-size:11px;color:#94a3b8;text-align:center">Données non disponibles</div>';
    _updateAdherentPct(0);
  }
}

async function initLocalisationMap(sid){
  var el=document.getElementById('leaflet-map');
  if(!el||typeof L==='undefined')return;
  var ld=LOCALISATION_DATA[sid];
  var s=S.studios[sid];

  // Vider le cache INSEE pour ce studio (évite les résultats périmés)
  Object.keys(_inseePopCache).forEach(function(k){if(k.startsWith(sid+'_'))delete _inseePopCache[k];});

  // ── Géocodage de l'adresse réelle du studio ──
  if(!S.mapCoords[sid]&&s&&s.addr){
    el.innerHTML='<div style="height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;background:#f0f4f8">'
      +'<div style="width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#0F6E56;border-radius:50%;animation:spin 0.8s linear infinite"></div>'
      +'<div style="font-size:12px;color:#64748b;font-weight:500">Localisation du studio en cours…</div></div>';
    try{
      var res=await fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(s.addr)+'&limit=1&addressdetails=1');
      var data=await res.json();
      if(data&&data[0])S.mapCoords[sid]={lat:parseFloat(data[0].lat),lon:parseFloat(data[0].lon)};
    }catch(e){}
    // Fallback aux coordonnées hardcodées si le géocodage échoue
    if(!S.mapCoords[sid]&&STUDIO_COORDS[sid])S.mapCoords[sid]={lat:STUDIO_COORDS[sid].lat,lon:STUDIO_COORDS[sid].lon};
  }

  var coords=S.mapCoords[sid];
  if(!coords)return;

  // Re-vérifier que l'élément existe encore (l'utilisateur n'a pas changé de tab)
  el=document.getElementById('leaflet-map');
  if(!el)return;
  el.innerHTML='';

  // Détruire l'instance précédente
  if(_leafletMapInst){try{_leafletMapInst.remove();}catch(e){} _leafletMapInst=null;}
  _leafletCircles=[];

  // Initialisation
  var map=L.map('leaflet-map',{center:[coords.lat,coords.lon],zoom:15,zoomControl:false,attributionControl:true});
  _leafletMapInst=map;

  // Tiles CartoDB Positron (libre, sans clé API)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains:'abcd',maxZoom:19,
  }).addTo(map);

  // Contrôle de zoom (bas droite)
  L.control.zoom({position:'bottomright'}).addTo(map);

  // ── Zones de chalandise ──
  // Les 2 premières (500m et 1km) sont fixes. La 3e est ajustable via le curseur.
  var outerR=S.mapZoneRadius||2000;
  var outerColor=outerR<=1500?'#378ADD':outerR<=3000?'#7F77DD':'#9B59B6';
  var zoneDefs=[
    [500,'#1D9E75',0.75,0.07,null],
    [1000,'#378ADD',0.55,0.04,'6 4'],
    [outerR,outerColor,0.5,0.025,'4 3'],
  ];
  if(S.mapShowZones!==false){
    zoneDefs.forEach(function(c,i){
      var circ=L.circle([coords.lat,coords.lon],{radius:c[0],color:c[1],weight:i===2?2.5:1.5,opacity:c[2],fill:true,fillColor:c[1],fillOpacity:c[3],dashArray:c[4]}).addTo(map);
      _leafletCircles.push(circ);
    });
  }

  // ── Visualisation trafic routier ──
  if(ld&&ld.trafic&&ld.trafic[0]){
    var tmjaStr=ld.trafic[0].kpi;
    var tmja=0;
    var tm1=tmjaStr.match(/(\d+)[–\-–—](\d+)\s*[Kk]/);
    if(tm1){tmja=(parseInt(tm1[1])+parseInt(tm1[2]))/2*1000;}
    else{var tm2=tmjaStr.match(/~?(\d[\d ]+)/);if(tm2)tmja=parseDemographicNum(tm2[1]);}
    if(tmja>0){
      var tColor=tmja>25000?'#D85A30':tmja>15000?'#E89B2A':'#5BAD70';
      // Badge TMJA intégré à la carte
      var TmjaCtrl=L.Control.extend({options:{position:'topright'},onAdd:function(){
        var d=L.DomUtil.create('div');
        d.style.cssText='background:rgba(255,255,255,0.94);border-radius:10px;padding:8px 12px;border:0.5px solid rgba(0,0,0,0.1);box-shadow:0 2px 10px rgba(0,0,0,0.12);font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-align:center';
        d.innerHTML='<div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px">Trafic routier</div>'
          +'<div style="font-size:16px;font-weight:700;color:'+tColor+'">'+tmjaStr+'</div>'
          +'<div style="font-size:9px;color:#94a3b8">véh/jour (TMJA)</div>';
        L.DomEvent.disableClickPropagation(d);
        return d;
      }});
      new TmjaCtrl().addTo(map);
    }
  }

  // ── Marqueurs transports ──
  var bearings=[0,90,180,270,45,135,225,315];
  if(ld&&ld.transports){
    ld.transports.forEach(function(t,i){
      // Chercher distance dans kpi ou sub
      var txt=(t.kpi||'')+' '+(t.sub||'');
      var dm=txt.match(/~?(\d+)\s*m\s+(du\s+studio|à\s+pied)/i);
      var dist=dm?parseInt(dm[1]):null;
      if(!dist||dist>2500)return;
      var bearing=bearings[i%bearings.length]*Math.PI/180;
      var dLat=(dist/111320)*Math.cos(bearing);
      var dLon=(dist/(111320*Math.cos(coords.lat*Math.PI/180)))*Math.sin(bearing);
      var em=/tramway|tram/i.test(t.lbl)?'🚋':/transilien|rer/i.test(t.lbl)?'🚆':/métro|metro/i.test(t.lbl)?'Ⓜ':/bus/i.test(t.lbl)?'🚌':'🚉';
      var tc=t.col||'#378ADD';
      var tIcon=L.divIcon({className:'',
        html:'<div style="width:30px;height:30px;background:'+tc+';border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-size:14px;line-height:1">'+em+'</div>',
        iconSize:[30,30],iconAnchor:[15,15],popupAnchor:[0,-18]});
      L.marker([coords.lat+dLat,coords.lon+dLon],{icon:tIcon}).addTo(map)
        .bindPopup('<div style="font-size:12px;font-weight:600;color:#0f1f3d;margin-bottom:3px">'+t.kpi+'</div><div style="font-size:11px;color:#475569">'+t.lbl+'</div><div style="font-size:10px;color:#94a3b8;margin-top:2px">~'+dist+'m du studio</div>',{maxWidth:220});
    });
  }

  // ── Marqueur studio (pulse animé) ──
  var studioIcon=L.divIcon({className:'',
    html:'<div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center">'
      +'<div class="loc-pulse-ring" style="width:32px;height:32px"></div>'
      +'<div style="position:relative;z-index:1;width:14px;height:14px;background:#0F6E56;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>'
      +'</div>',
    iconSize:[32,32],iconAnchor:[16,16],popupAnchor:[0,-18]});
  L.marker([coords.lat,coords.lon],{icon:studioIcon,zIndexOffset:1000}).addTo(map)
    .bindPopup('<div style="font-size:13px;font-weight:700;color:#0f1f3d;margin-bottom:4px">'+(s&&s.name||sid)+'</div><div style="font-size:11px;color:#475569">'+(s&&s.addr||'')+'</div>',{maxWidth:240})
    .openPopup();

  // ── Légende (Leaflet Control bas gauche) ──
  if(S.mapShowZones!==false){
    var outerLabel=outerR>=1000?(outerR/1000).toFixed(1)+' km':outerR+' m';
    var LegCtrl=L.Control.extend({options:{position:'bottomleft'},onAdd:function(){
      var d=L.DomUtil.create('div');
      d.style.cssText='background:rgba(255,255,255,0.94);border-radius:10px;padding:9px 13px;border:0.5px solid rgba(0,0,0,0.1);box-shadow:0 2px 10px rgba(0,0,0,0.12);font-family:-apple-system,BlinkMacSystemFont,sans-serif';
      d.innerHTML='<div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:7px">Zones de chalandise</div>'
        +'<div style="display:flex;align-items:center;gap:7px;margin-bottom:4px"><div style="width:24px;height:2px;background:#1D9E75;border-radius:1px"></div><span style="font-size:10px;color:#475569">500 m — Marche</span></div>'
        +'<div style="display:flex;align-items:center;gap:7px;margin-bottom:4px"><div style="width:24px;height:0;border-top:2px dashed #378ADD;opacity:0.7"></div><span style="font-size:10px;color:#475569">1 km — TC</span></div>'
        +'<div id="loc-leg-outer" style="display:flex;align-items:center;gap:7px"><div style="width:24px;height:0;border-top:2px dashed '+outerColor+';opacity:0.6"></div><span style="font-size:10px;color:#475569">'+outerLabel+' — Zone active</span></div>';
      L.DomEvent.disableClickPropagation(d);
      return d;
    }});
    new LegCtrl().addTo(map);
  }

  // Initialiser l'affichage population après un court délai
  setTimeout(function(){updateZoneRadius(S.mapZoneRadius||2000);},80);

  // ── Badge nom du studio (haut gauche) ──
  var NameCtrl=L.Control.extend({options:{position:'topleft'},onAdd:function(){
    var d=L.DomUtil.create('div');
    d.style.cssText='background:rgba(255,255,255,0.94);border-radius:10px;padding:7px 13px;border:0.5px solid rgba(0,0,0,0.1);box-shadow:0 2px 10px rgba(0,0,0,0.12);display:flex;align-items:center;gap:8px;font-family:-apple-system,BlinkMacSystemFont,sans-serif';
    d.innerHTML='<div style="width:10px;height:10px;background:#0F6E56;border-radius:50%;border:2px solid #fff;flex-shrink:0;box-shadow:0 0 0 3px rgba(15,110,86,0.2)"></div><span style="font-size:12px;font-weight:600;color:#0f1f3d">'+(s&&s.name||sid)+'</span>';
    L.DomEvent.disableClickPropagation(d);
    return d;
  }});
  new NameCtrl().addTo(map);
}

function _locTag(tag){
  var cols={tg:{bg:'#EAF3DE',c:'#3B6D11'},ta:{bg:'#FAEEDA',c:'#854F0B'},tr:{bg:'#FCEBEB',c:'#A32D2D'},tb:{bg:'#E6F1FB',c:'#185FA5'},tp:{bg:'#EEEDFE',c:'#534AB7'}};
  var col=cols[tag.c]||cols.tb;
  return '<span style="display:inline-block;font-size:10.5px;padding:2px 9px;border-radius:12px;background:'+col.bg+';color:'+col.c+';margin:2px 2px 0 0;font-weight:500">'+tag.t+'</span>';
}

function _locCard(item,wide){
  var h='<div style="background:#f8f9fb;border:1px solid #e2e8f0;border-radius:12px;padding:13px 16px;border-left:3px solid '+item.col+';'+(wide?'grid-column:1/-1':'')+'">';
  h+='<div style="font-size:10.5px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:4px">'+item.lbl+'</div>';
  h+='<div style="font-size:'+(item.kpi.length>10?'15':'18')+'px;font-weight:700;color:#0f1f3d;margin:3px 0 5px">'+item.kpi+'</div>';
  h+='<div style="font-size:11.5px;color:#64748b;line-height:1.5">'+item.sub+'</div>';
  if(item.tags&&item.tags.length)h+='<div style="margin-top:6px">'+item.tags.map(_locTag).join('')+'</div>';
  h+='</div>';
  return h;
}

function _locSection(title){
  return '<div style="font-size:12.5px;font-weight:600;color:#64748b;margin:20px 0 10px;padding-bottom:5px;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.06em">'+title+'</div>';
}

function renderLocalisationData(ld,s){
  var h='<div style="margin-top:16px">';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">';
  h+='<div style="width:3px;height:20px;background:#1a3a6b;border-radius:2px"></div>';
  h+='<div style="font-size:14px;font-weight:700;color:#0f1f3d">Analyse du site</div>';
  h+='<div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#1a3a6b;background:#f0f4fc;border:1px solid #d0d9ec;border-radius:20px;padding:3px 10px;margin-left:auto;font-weight:600">Data</div>';
  h+='</div>';

  // Trafic routier
  if(ld.trafic&&ld.trafic.length){
    h+=_locSection('Trafic routier');
    h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:4px">';
    ld.trafic.forEach(function(item){h+=_locCard(item,false);});
    h+='</div>';
  }

  // Transports
  if(ld.transports&&ld.transports.length){
    h+=_locSection('Transports en commun — desserte');
    var cols=ld.transports.length<=2?'repeat(2,1fr)':'repeat(2,1fr)';
    h+='<div style="display:grid;grid-template-columns:'+cols+';gap:10px;margin-bottom:4px">';
    ld.transports.forEach(function(item){h+=_locCard(item,false);});
    h+='</div>';
  }

  // Démographie
  if(ld.demo&&ld.demo.length){
    h+=_locSection('Profil socio-démographique — zone de chalandise');
    h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:4px">';
    ld.demo.forEach(function(item){h+=_locCard(item,false);});
    h+='</div>';
  }

  // Comparaison barres
  if(ld.comparaison&&ld.comparaison.length){
    h+=_locSection('Comparaison vs portefeuille');
    h+='<div style="background:#f8f9fb;border:1px solid #e2e8f0;border-radius:12px;padding:14px 18px;margin-bottom:4px">';
    ld.comparaison.forEach(function(item){
      h+='<div style="display:flex;align-items:center;gap:10px;margin:7px 0">';
      h+='<div style="width:130px;flex-shrink:0;font-size:11.5px;color:#555;font-weight:500">'+item.lbl+'</div>';
      h+='<div style="flex:1;height:7px;background:#e2e8f0;border-radius:4px;overflow:hidden"><div style="width:'+item.pct+'%;height:100%;background:'+item.col+';border-radius:4px"></div></div>';
      h+='<div style="font-size:11px;color:#64748b;min-width:180px">'+item.note+'</div>';
      h+='</div>';
    });
    h+='</div>';
  }

  // Synthèse + tags
  if(ld.tags&&ld.tags.length){
    h+=_locSection('Synthèse — attractivité commerciale');
    h+='<div style="background:#f8f9fb;border:1px solid #e2e8f0;border-radius:12px;padding:14px 18px">';
    h+='<div style="margin-bottom:10px">'+ld.tags.map(_locTag).join('')+'</div>';
    if(ld.synthese)h+='<div style="font-size:12px;color:#475569;line-height:1.6">'+ld.synthese+'</div>';
    h+='</div>';
  }
  h+='</div>';
  return h;
}

function renderFichiers(sid){
  var files=S.files[sid]||[];
  var h='<div class="box"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  h+='<span style="font-weight:600;font-size:14px">Documents ('+files.length+')</span>';
  h+='<label class="btn btn-primary" style="cursor:pointer;font-size:12px">+ Ajouter<input type="file" style="display:none" onchange="uploadFichier(\''+sid+'\',this)" multiple/></label>';
  h+='</div><div id="uprog-'+sid+'" style="display:none;font-size:12px;color:#5b7fa6;margin-bottom:10px">Upload en cours...</div>';
  if(files.length===0){h+='<div style="text-align:center;padding:2rem;color:#aaa;font-size:13px">Aucun document</div>';}
  else{
    files.forEach(function(f){
      h+='<div class="file-row"><div style="display:flex;align-items:center;gap:10px">';
      h+='<span style="font-size:12px;background:#f0f0ea;padding:4px 8px;border-radius:6px">'+f.name.split('.').pop().toUpperCase()+'</span>';
      h+='<div><div style="font-size:13px;font-weight:500">'+f.name+'</div><div style="font-size:11px;color:#888">'+f.date+' &mdash; '+f.size+'</div></div></div>';
      h+='<div style="display:flex;gap:8px"><a href="'+f.url+'" target="_blank" class="btn" style="font-size:12px;text-decoration:none">Ouvrir</a>';
      h+='<button class="btn" style="font-size:12px;color:#A32D2D" onclick="deleteFichier(\''+sid+'\',\''+f.path+'\')">&#10005;</button></div></div>';
    });
  }
  h+='</div>';
  return h;
}

