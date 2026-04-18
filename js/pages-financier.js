// ═══════════════════════════════════════════════════════════════════════════
// PAGES — FINANCIER STUDIO (BP3Y, Adhérents, Forecast)
// Onglets financiers d'un studio : infographie BP 3 ans, adhérents mensuels,
// forecast P&L, charts CA.
// Extrait de pages.js (Phase 3 — modularisation).
// ═══════════════════════════════════════════════════════════════════════════

function renderBP3YInfographic(sid,s){
  var bp=(typeof build3YearBPWithOverrides==='function'?build3YearBPWithOverrides:build3YearBP)(s.forecast||{},sid,getStudioBPOpts(sid));
  var annee0=s.forecast&&s.forecast.annee||2026;
  var md=s.forecast&&s.forecast.moisDebut||0;

  // 36 monthly rows BP
  var allRows=bp.a1.concat(bp.a2).concat(bp.a3);
  var caArr=allRows.map(function(r){return r._ca||0;});
  var ebtArr=allRows.map(function(r){return r._ebitda||0;});

  // Annual aggregates (BP)
  var YR=[bp.a1,bp.a2,bp.a3].map(function(rows,yi){
    var ca=0,ebitda=0,rex=0,rnet=0,cashnet=0;
    rows.forEach(function(r){ca+=r._ca;ebitda+=r._ebitda;rex+=r._rex;rnet+=r._result;cashnet+=(r._cashnet||0);});
    var offset=yi*12,mbrs=0,lastMbrs=0;
    for(var i=0;i<12;i++){
      var _bpAy=getBPAdherents(sid);var v=offset+i<_bpAy.length?_bpAy[offset+i]:400;
      mbrs+=v; if(i===11)lastMbrs=v;
    }
    return{ca:ca,ebitda:ebitda,rex:rex,rnet:rnet,cashnet:cashnet,avgMbrs:Math.round(mbrs/12),lastMbrs:lastMbrs,annee:annee0+yi};
  });

  // ── Simulation Adhérents — même logique exacte que l'onglet Adhérents ────────
  var simCfg=S.simConfig&&S.simConfig[sid]||{p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67};
  var actuelWF=S.adherents[sid]||{};
  // ARPU de référence BP (utilisé comme base de calcul proportionnel)
  var BP_ARPU_REF=computeSimARPU({p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67}); // ~156.67
  var simARPU=computeSimARPU(simCfg);
  var arpuRatio=BP_ARPU_REF>0?simARPU/BP_ARPU_REF:1;
  // CA simulé mensuel = CA_BP_mois × (adhérents_réels/adhérents_BP) × (ARPU_custom/ARPU_BP)
  // → garantit que réels=BP + prix=BP → simCA=CA_BP exactement
  var simMonthlyCA=[];
  var lastActualMonth=-1;
  for(var si=0;si<36;si++){
    var ayWF=Math.floor(si/12)+1;
    var mWF=si%12;
    var keyWF='y'+ayWF+'_m'+mWF;
    var _bpSi=getBPAdherents(sid);var bpM=si<_bpSi.length?_bpSi[si]:400;
    var hasActual=actuelWF[keyWF]!==undefined;
    var sm=hasActual?actuelWF[keyWF]:bpM;
    if(hasActual)lastActualMonth=si;
    var bpCAm=caArr[si]||0;
    var adherRatio=bpM>0?sm/bpM:0;
    simMonthlyCA.push(Math.round(bpCAm*adherRatio*arpuRatio));
  }
  var SIM_YR=[0,1,2].map(function(yi){
    var caM=simMonthlyCA.slice(yi*12,(yi+1)*12);
    var caAn=caM.reduce(function(s,v){return s+v;},0);
    var rows=buildBP(caAn,md,null,sid,getStudioBPOpts(sid));
    var eb=rows.reduce(function(s,r){return s+(r._ebitda||0);},0);
    return{ca:caAn,ebitda:eb};
  });

  // ── EBITDA simulé mensuel (delta CA → delta EBITDA, charges fixes) ────────
  var simEbtArr=[];
  for(var sei=0;sei<36;sei++){
    simEbtArr.push(ebtArr[sei]+(simMonthlyCA[sei]-(caArr[sei]||0)));
  }

  // ── SVG Chart 36 mois (redesign) ────────────────────────────────────────────
  var W=620,H=220,PL=52,PR=16,PT=18,PB=28;
  var cW=W-PL-PR,cH=H-PT-PB,N=36;
  var maxV=Math.max(Math.max.apply(null,caArr),Math.max.apply(null,simMonthlyCA))*1.12||1;
  function xp(i){return PL+i*(cW/(N-1));}
  function yv(v){return PT+cH-(Math.max(0,v)/maxV)*cH;}

  // Break-even dynamique (basé sur EBITDA simulé)
  var beM=-1;
  for(var k=1;k<N;k++){if(simEbtArr[k]>0&&simEbtArr[k-1]<=0){beM=k;break;}}
  var beMoiLabel='',beAdherents=0;
  if(beM>=0){
    var beMoisIdx=(md+beM)%12;
    beMoiLabel=MOIS[beMoisIdx]+' '+(annee0+Math.floor(beM/12));
    // Nombre d'adhérents au mois du break-even (réel saisi ou BP)
    var _beAy=Math.floor(beM/12)+1,_beMo=beM%12,_beKey='y'+_beAy+'_m'+_beMo;
    var _bpBe=getBPAdherents(sid);beAdherents=(actuelWF[_beKey]!==undefined)?num(actuelWF[_beKey]):(beM<_bpBe.length?_bpBe[beM]:400);
  }

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block">';

  // Defs : gradients + ombres + clip
  svg+='<defs>';
  svg+='<linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1D9E75" stop-opacity="0.22"/><stop offset="100%" stop-color="#1D9E75" stop-opacity="0.02"/></linearGradient>';
  svg+='<linearGradient id="caGradFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1D9E75" stop-opacity="0.08"/><stop offset="100%" stop-color="#1D9E75" stop-opacity="0.01"/></linearGradient>';
  svg+='<linearGradient id="ebtGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#B8860B" stop-opacity="0.16"/><stop offset="100%" stop-color="#B8860B" stop-opacity="0.02"/></linearGradient>';
  svg+='<linearGradient id="beGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0F6E56" stop-opacity="0.12"/><stop offset="100%" stop-color="#0F6E56" stop-opacity="0"/></linearGradient>';
  svg+='<filter id="glowCA"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  svg+='<filter id="glowDot"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  svg+='<filter id="glowBE"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  svg+='<filter id="badgeShadow"><feDropShadow dx="0" dy="1.5" stdDeviation="2.5" flood-color="#0F6E56" flood-opacity="0.35"/></filter>';
  svg+='</defs>';

  // Fond principal du chart
  svg+='<rect x="'+PL+'" y="'+PT+'" width="'+cW+'" height="'+cH+'" rx="4" fill="#fafaf8"/>';

  // Year bands + séparateurs
  var bandBg=['rgba(29,158,117,0.04)','rgba(15,110,86,0.035)','rgba(184,134,11,0.035)'];
  for(var y=0;y<3;y++){
    var bx0=xp(y*12),bx1=y<2?xp((y+1)*12):W-PR;
    svg+='<rect x="'+bx0+'" y="'+PT+'" width="'+(bx1-bx0)+'" height="'+cH+'" fill="'+bandBg[y]+'"/>';
    if(y>0)svg+='<line x1="'+bx0+'" y1="'+(PT+2)+'" x2="'+bx0+'" y2="'+(PT+cH-2)+'" stroke="#d0d5cf" stroke-width="0.7" stroke-dasharray="3,4" opacity="0.6"/>';
    svg+='<text x="'+((bx0+bx1)/2)+'" y="'+(H-7)+'" text-anchor="middle" font-size="10" fill="#a0a098" font-weight="600" letter-spacing="0.5">A'+(y+1)+' \u00b7 '+(annee0+y)+'</text>';
  }

  // Grid lines (4 niveaux + base)
  [0,0.25,0.5,0.75,1].forEach(function(t){
    var gv=Math.round(maxV*t);
    var gy=yv(gv);
    var isBase=t===0;
    svg+='<line x1="'+PL+'" y1="'+gy+'" x2="'+(W-PR)+'" y2="'+gy+'" stroke="'+(isBase?'#c5c5be':'#ececea')+'" stroke-width="'+(isBase?0.8:0.5)+'"'+(t>0?' stroke-dasharray="2,4"':'')+'/>';
    svg+='<text x="'+(PL-6)+'" y="'+(gy+3.5)+'" text-anchor="end" font-size="9" fill="#b5b5ad" font-weight="500">'+Math.round(gv/1000)+'k</text>';
  });

  // Zone rouge pâle avant break-even
  if(beM>0){
    svg+='<rect x="'+PL+'" y="'+PT+'" width="'+(xp(beM)-PL)+'" height="'+cH+'" fill="rgba(200,50,50,0.025)" rx="3"/>';
  } else if(beM<0){
    svg+='<rect x="'+PL+'" y="'+PT+'" width="'+cW+'" height="'+cH+'" fill="rgba(200,50,50,0.025)" rx="3"/>';
  }

  // ── CA BP — ligne bleue pointillée sur toute la durée ──
  var caL='';caArr.forEach(function(v,i){caL+=(i===0?'M':'L')+xp(i)+' '+yv(v)+' ';});
  svg+='<path d="'+caL+'" fill="none" stroke="#3B6FB6" stroke-width="1.8" stroke-dasharray="7,4" stroke-linecap="round" opacity="0.45"/>';

  // ── Aire gradient complète (réel + BP continuation) ──
  var fullA='M'+xp(0)+' '+(PT+cH);
  simMonthlyCA.forEach(function(v,i){fullA+=' L'+xp(i)+' '+yv(v);});
  fullA+=' L'+xp(N-1)+' '+(PT+cH)+' Z';
  if(lastActualMonth>=0){
    // Aire réelle (opaque) + aire projection (fade)
    var cutX=xp(lastActualMonth);
    svg+='<clipPath id="clipReal"><rect x="'+PL+'" y="0" width="'+(cutX-PL)+'" height="'+H+'"/></clipPath>';
    svg+='<clipPath id="clipProj"><rect x="'+cutX+'" y="0" width="'+(W-cutX)+'" height="'+H+'"/></clipPath>';
    svg+='<path d="'+fullA+'" fill="url(#caGrad)" clip-path="url(#clipReal)"/>';
    svg+='<path d="'+fullA+'" fill="url(#caGradFade)" clip-path="url(#clipProj)"/>';
  } else {
    svg+='<path d="'+fullA+'" fill="url(#caGradFade)"/>';
  }

  // ── CA Réel — ligne verte pleine (uniquement mois renseignés) ──
  if(lastActualMonth>=0){
    var realL='';
    for(var ri=0;ri<=lastActualMonth;ri++){realL+=(ri===0?'M':'L')+xp(ri)+' '+yv(simMonthlyCA[ri])+' ';}
    svg+='<path d="'+realL+'" fill="none" stroke="#1D9E75" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round" filter="url(#glowCA)"/>';
    // Continuation BP après dernier mois réel — vert pointillé léger
    var projL='M'+xp(lastActualMonth)+' '+yv(simMonthlyCA[lastActualMonth]);
    for(var pi=lastActualMonth+1;pi<N;pi++){projL+=' L'+xp(pi)+' '+yv(caArr[pi]);}
    svg+='<path d="'+projL+'" fill="none" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="6,4" stroke-linecap="round" opacity="0.35"/>';
    // Point de transition lumineux
    svg+='<circle cx="'+xp(lastActualMonth)+'" cy="'+yv(simMonthlyCA[lastActualMonth])+'" r="5.5" fill="#1D9E75" opacity="0.15" filter="url(#glowDot)"/>';
    svg+='<circle cx="'+xp(lastActualMonth)+'" cy="'+yv(simMonthlyCA[lastActualMonth])+'" r="4" fill="#fff" stroke="#1D9E75" stroke-width="2"/>';
    svg+='<circle cx="'+xp(lastActualMonth)+'" cy="'+yv(simMonthlyCA[lastActualMonth])+'" r="1.8" fill="#1D9E75"/>';
  } else {
    // Aucune donnée réelle → tout en BP pointillé vert
    var bpOnlyL='';caArr.forEach(function(v,i){bpOnlyL+=(i===0?'M':'L')+xp(i)+' '+yv(v)+' ';});
    svg+='<path d="'+bpOnlyL+'" fill="none" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="6,4" stroke-linecap="round" opacity="0.4"/>';
  }

  // ── EBITDA simulé — aire gradient + ligne dorée ──
  var eseg=null;
  simEbtArr.forEach(function(v,i){
    if(v>0){if(!eseg)eseg='M'+xp(i)+' '+(PT+cH);eseg+=' L'+xp(i)+' '+yv(v);}
    else{if(eseg){eseg+=' L'+xp(i-1)+' '+(PT+cH)+' Z';svg+='<path d="'+eseg+'" fill="url(#ebtGrad)"/>';eseg=null;}}
  });
  if(eseg){eseg+=' L'+xp(N-1)+' '+(PT+cH)+' Z';svg+='<path d="'+eseg+'" fill="url(#ebtGrad)"/>';}
  var ebtL='';simEbtArr.forEach(function(v,i){ebtL+=(i===0?'M':'L')+xp(i)+' '+yv(Math.max(0,v))+' ';});
  svg+='<path d="'+ebtL+'" fill="none" stroke="#B8860B" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';

  // ── Dots : jalons réels (vert) + EBITDA (doré) ──
  [0,11,23,35].forEach(function(di){
    if(di<=lastActualMonth){
      svg+='<circle cx="'+xp(di)+'" cy="'+yv(simMonthlyCA[di])+'" r="3.5" fill="#1D9E75" stroke="#fff" stroke-width="1.5"/>';
    }
    if(simEbtArr[di]>0)svg+='<circle cx="'+xp(di)+'" cy="'+yv(simEbtArr[di])+'" r="2.5" fill="#B8860B" stroke="#fff" stroke-width="1"/>';
  });

  // ── Break-even — ligne glow + badge premium ──
  if(beM>=0){
    var bx=xp(beM);
    // Gradient vertical derrière la ligne
    svg+='<rect x="'+(bx-8)+'" y="'+PT+'" width="16" height="'+cH+'" fill="url(#beGrad)"/>';
    // Ligne verticale avec glow
    svg+='<line x1="'+bx+'" y1="'+(PT+2)+'" x2="'+bx+'" y2="'+(PT+cH)+'" stroke="#0F6E56" stroke-width="1.8" stroke-dasharray="6,3" opacity="0.75" filter="url(#glowBE)"/>';
    // Cercle indicateur sur la baseline
    svg+='<circle cx="'+bx+'" cy="'+(PT+cH)+'" r="4" fill="#0F6E56" stroke="#fff" stroke-width="1.5"/>';
    // Badge premium avec ombre
    var beLabelTxt='BREAK EVEN \u00b7 '+beMoiLabel+' \u00b7 '+beAdherents+' adh.';
    var labelW=beLabelTxt.length*5.2+20;
    var labelX=Math.min(bx-labelW/2,W-PR-labelW);
    labelX=Math.max(PL,labelX);
    var labelY=PT+6;
    svg+='<rect x="'+labelX+'" y="'+labelY+'" width="'+labelW+'" height="20" rx="10" fill="#0F6E56" filter="url(#badgeShadow)"/>';
    svg+='<text x="'+(labelX+labelW/2)+'" y="'+(labelY+13.5)+'" text-anchor="middle" font-size="8.5" fill="#fff" font-weight="700" letter-spacing="0.4">'+beLabelTxt+'</text>';
  }
  svg+='</svg>';

  // ── HTML ────────────────────────────────────────────────────────────────────
  var ACCENTS=['#4d7a5c','#0F6E56','#8a5a0e'];
  var h='<div style="margin-top:16px;border-radius:16px;overflow:hidden;border:0.5px solid #d8d8d0;box-shadow:0 8px 32px rgba(0,0,0,0.08)">';

  // Header style consulting — blanc/bleu navy
  h+='<div style="background:#ffffff;border-bottom:1px solid #e2e8f0;padding:18px 24px 16px">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">';
  // Partie gauche : tag + titre + sous-titre
  h+='<div style="display:flex;align-items:flex-start;gap:0">';
  h+='<div style="border-left:3px solid #1a3a6b;padding-left:14px">';
  h+='<div style="font-size:7.5px;text-transform:uppercase;letter-spacing:2.5px;color:#1a3a6b;font-weight:700;margin-bottom:5px">Projection financi&egrave;re</div>';
  h+='<div style="font-size:17px;font-weight:700;color:#0f1f3d;letter-spacing:-0.5px;line-height:1.2">Performance pr&eacute;visionnelle <span style="font-weight:300;color:#94a3b8">/</span> <span style="color:#1a3a6b">3 ans</span></div>';
  h+='<div style="font-size:10px;color:#94a3b8;margin-top:5px;font-weight:400;letter-spacing:0.1px">Ouverture '+s.ouverture+' &middot; Club Pilates</div>';
  h+='</div></div>';
  // Partie droite : KPI pills style consulting
  h+='<div style="display:flex;gap:8px;flex-wrap:wrap">';
  [{l:'CA A3',v:fmt(YR[2].ca),c:'#0f6e56',bg:'#f0faf6',border:'#b7e0d2'},{l:'EBITDA A3',v:fmt(YR[2].ebitda),c:'#92630a',bg:'#fffbf0',border:'#f0d98a'},{l:'R\u00e9sultat A3',v:fmt(YR[2].rnet),c:'#1a3a6b',bg:'#f0f4fc',border:'#bfcfe8'}].forEach(function(k){
    h+='<div style="background:'+k.bg+';border:1px solid '+k.border+';border-radius:8px;padding:7px 14px;text-align:center;min-width:82px">';
    h+='<div style="font-size:7px;text-transform:uppercase;letter-spacing:1.2px;color:#64748b;margin-bottom:3px;font-weight:600">'+k.l+'</div>';
    h+='<div style="font-size:15px;font-weight:700;color:'+k.c+';letter-spacing:-0.4px">'+k.v+'</div>';
    h+='</div>';
  });
  h+='</div></div></div>';

  // ── Séparateur de section : Business Plan ─────────────────────────────────
  h+='<div style="background:#f0f4fc;border-top:0.5px solid #d0d9ec;border-bottom:0.5px solid #d0d9ec;padding:6px 18px;display:flex;align-items:center;gap:8px">';
  h+='<div style="width:6px;height:6px;border-radius:50%;background:#1a3a6b"></div>';
  h+='<span style="font-size:8.5px;text-transform:uppercase;letter-spacing:2px;color:#1a3a6b;font-weight:700">Business Plan &nbsp;&middot;&nbsp; Donn&eacute;es de r&eacute;f&eacute;rence</span>';
  h+='</div>';

  // Cartes 3 ans
  // Cible max = dernière année (si custom) ou 400 (ref BP dossier)
  var _mbrTarget=(YR[2]&&YR[2].lastMbrs>0)?YR[2].lastMbrs:400;
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;background:#fff">';
  YR.forEach(function(yr,i){
    var accent=ACCENTS[i];
    var eMargin=yr.ca>0?Math.round(yr.ebitda/yr.ca*100):0;
    var rexMargin=yr.ca>0?Math.round(yr.rex/yr.ca*100):0;
    var mbrPct=Math.min(100,Math.round(yr.lastMbrs/_mbrTarget*100));
    var borderR=i<2?'border-right:0.5px solid #ebebE6;':'';
    h+='<div onclick="S.forecastYear='+(i+1)+';setDetailTab(\'forecast\')" style="padding:14px 16px;background:'+(i===2?'#f9f8f5':'#fff')+';'+borderR+'border-bottom:0.5px solid #ebebE6;cursor:pointer;transition:background .15s" onmouseenter="this.style.background=\''+(i===2?'#f2efe8':'#f8faff')+'\'" onmouseleave="this.style.background=\''+(i===2?'#f9f8f5':'#fff')+'\'" title="Voir le Business plan — Année '+(i+1)+'">';

    // En-tête année
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
    h+='<div style="display:flex;align-items:center;gap:6px">';
    h+='<div style="width:22px;height:22px;border-radius:6px;background:'+accent+';display:flex;align-items:center;justify-content:center"><span style="font-size:10px;font-weight:800;color:#fff">A'+(i+1)+'</span></div>';
    h+='<span style="font-size:12px;font-weight:700;color:#1a1a1a">Ann\u00e9e '+(i+1)+'</span>';
    h+='</div>';
    h+='<span style="font-size:11px;color:#ccc">'+yr.annee+'</span>';
    h+='</div>';

    // Jauge membres
    h+='<div style="background:#f5f5f0;border-radius:8px;padding:8px 10px;margin-bottom:10px">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
    h+='<span style="font-size:10px;color:#888;font-weight:500">&#128101; Membres</span>';
    h+='<div><span style="font-size:15px;font-weight:800;color:#1a1a1a">'+yr.lastMbrs+'</span><span style="font-size:9px;color:#bbb;margin-left:2px">fin A'+(i+1)+'</span></div>';
    h+='</div>';
    h+='<div style="height:4px;background:#e6e6e0;border-radius:2px;overflow:hidden">';
    h+='<div style="height:100%;width:'+mbrPct+'%;background:linear-gradient(90deg,'+accent+','+accent+'bb);border-radius:2px"></div>';
    h+='</div>';
    h+='<div style="display:flex;justify-content:space-between;margin-top:3px">';
    h+='<span style="font-size:9px;color:#ccc">moy. '+yr.avgMbrs+'/mois</span>';
    h+='<span style="font-size:9px;color:#ccc">'+mbrPct+'% / '+_mbrTarget+'</span>';
    h+='</div></div>';

    // Métriques financières
    [{label:'CA annuel',value:fmt(yr.ca),sub:null,color:'#1a1a1a',sz:14,fw:700},
     {label:'EBITDA',value:fmt(yr.ebitda),sub:eMargin+'% du CA',color:yr.ebitda>0?'#854F0B':'#A32D2D',sz:12,fw:600},
     {label:'REX',value:fmt(yr.rex),sub:rexMargin+'% marge',color:yr.rex>0?'#0F6E56':'#A32D2D',sz:12,fw:600},
     {label:'R\u00e9sultat net',value:fmt(yr.rnet),sub:null,color:yr.rnet>0?'#6a8a72':'#A32D2D',sz:12,fw:600},
     {label:'Cash net dispo.',value:fmt(yr.cashnet),sub:null,color:yr.cashnet>=0?'#1a3a6b':'#A32D2D',sz:12,fw:600}
    ].forEach(function(m,mi){
      var sep=mi<3?'padding-bottom:6px;margin-bottom:6px;border-bottom:0.5px solid #f2f2ed;':'';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;'+sep+'">';
      h+='<span style="font-size:10.5px;color:#888">'+m.label+'</span>';
      h+='<div style="text-align:right"><div style="font-size:'+m.sz+'px;font-weight:'+m.fw+';color:'+m.color+'">'+m.value+'</div>';
      if(m.sub)h+='<div style="font-size:9px;color:'+m.color+';opacity:0.72">'+m.sub+'</div>';
      h+='</div></div>';
    });

    // Barre marge EBITDA
    h+='<div style="margin-top:8px"><div style="height:3px;background:#f0f0ea;border-radius:2px;overflow:hidden">';
    h+='<div style="height:100%;width:'+Math.min(100,Math.max(0,eMargin*2.2))+'%;background:'+accent+';border-radius:2px"></div>';
    h+='</div>';
    h+='<div style="font-size:9px;color:#ccc;margin-top:2px;text-align:right">Marge EBITDA <strong style="color:'+accent+'">'+eMargin+'%</strong></div>';
    h+='</div></div>';
  });
  h+='</div>';

  // ── Section Simulation / Prévisionnel ajusté ──────────────────────────────
  var p4=num(simCfg.p4,47),p8=num(simCfg.p8,50),pi=num(simCfg.pi,3);
  var px4=num(simCfg.prix4,117),px8=num(simCfg.prix8,206),pxi=num(simCfg.prixi,294);
  var isDefault=(p4===47&&p8===50&&pi===3&&px4===117&&px8===206&&pxi===294);
  // Infos scénario actif
  var _wfScList=(S.scenarios[sid]||[]).slice().sort(function(a,b){return (b.ts||'').localeCompare(a.ts||'');});
  var _wfActiveId=S.activeScenarioId[sid]||(_wfScList.length?_wfScList[0].id:null);
  var _wfActiveSc=_wfActiveId&&_wfActiveId!=='bp_default'?_wfScList.find(function(s){return s.id===_wfActiveId;}):null;
  var _wfScLabel=_wfActiveSc?(_wfActiveSc.auteur+' \u2014 '+_wfActiveSc.date):'BP de r\u00e9f\u00e9rence';
  // Nombre de mois avec données adhérents réels
  var _wfAdhCount=0;
  var _wfAdh=S.adherents[sid]||{};
  for(var _wk in _wfAdh){if(_wfAdh.hasOwnProperty(_wk)&&_wfAdh[_wk]!=null)_wfAdhCount++;}
  // Bande de section : Prévisionnel ajusté
  h+='<div style="background:#f2f7f3;border-top:1px solid #b8d9c4;border-bottom:1px solid #b8d9c4;padding:10px 20px;display:flex;align-items:center;gap:10px">';
  h+='<div style="width:8px;height:8px;border-radius:50%;background:#0F6E56"></div>';
  h+='<span style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#0F6E56;font-weight:700">Pr&eacute;visionnel ajust&eacute; &nbsp;&middot;&nbsp; Simulation adh&eacute;rents</span>';
  h+='</div>';
  h+='<div style="background:linear-gradient(180deg,#f2f5fb 0%,#f7f7f4 100%);padding:18px 22px 20px">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px">';
  h+='<div style="display:flex;align-items:center;gap:12px">';
  h+='<div style="width:36px;height:36px;border-radius:10px;background:#3d5a3a;display:flex;align-items:center;justify-content:center;font-size:18px">&#127890;</div>';
  h+='<div><div style="font-size:15px;font-weight:700;color:#1a1a1a">Simulation personnalis\u00e9e \u2014 Adh\u00e9rents</div>';
  h+='<div style="font-size:13px;color:#666;margin-top:3px">R\u00e9partition : <strong>'+p4+'%&nbsp;/&nbsp;'+p8+'%&nbsp;/&nbsp;'+pi+'%</strong> &nbsp;&middot;&nbsp; Prix&nbsp;: <strong>'+px4+'\u20ac&nbsp;/&nbsp;'+px8+'\u20ac&nbsp;/&nbsp;'+pxi+'\u20ac</strong>&nbsp;HT/mois</div>';
  h+='<div style="font-size:11px;color:#666;margin-top:4px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">';
  h+='<span style="background:'+(isDefault?'#f0f0ea':'linear-gradient(135deg,#e8f0fe,#f0e6ff)')+';padding:3px 10px;border-radius:6px;font-weight:600;font-size:11px;color:'+(isDefault?'#999':'#5a3d8a')+'">'+_wfScLabel+'</span>';
  if(_wfAdhCount>0)h+='<span style="font-size:11px;color:#888">'+_wfAdhCount+' mois saisi'+(_wfAdhCount>1?'s':'')+'</span>';
  else h+='<span style="font-size:11px;color:#bbb;font-style:italic">aucun adh\u00e9rent saisi</span>';
  h+='</div>';
  h+='</div></div>';
  h+='<button onclick="setDetailTab(\'adherents\')" style="background:#3d5a3a;color:#fff;border:none;border-radius:9px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;transition:background .15s" onmouseover="this.style.background=\'#4a6e47\'" onmouseout="this.style.background=\'#3d5a3a\'">Modifier &#8599;</button>';
  h+='</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">';
  SIM_YR.forEach(function(sy,i){
    var accent=['#4d7a5c','#0F6E56','#8a5a0e'][i];
    var gradients=['linear-gradient(135deg,#065f46,#059669)','linear-gradient(135deg,#0F6E56,#22c55e)','linear-gradient(135deg,#78350f,#d97706)'][i];
    var dCA=sy.ca-YR[i].ca,dEB=sy.ebitda-YR[i].ebitda;
    var dCApct=YR[i].ca>0?Math.round((sy.ca/YR[i].ca-1)*100):0;
    var eMargin=sy.ca>0?Math.round(sy.ebitda/sy.ca*100):0;
    var _hasVariation=dCA!==0||dEB!==0;
    var _floatAnim=['simFloat1 5s ease-in-out infinite','simFloat2 6s ease-in-out infinite','simFloat3 5.5s ease-in-out infinite'][i];
    var _cardBorder=_hasVariation?(dCA>=0?'#b8d9c4':'#f0c0c0'):'#e0e0da';
    var _cardBg=_hasVariation?(dCA>=0?'linear-gradient(180deg,#f6fdf9,#fff)':'linear-gradient(180deg,#fef8f8,#fff)'):'#fff';
    h+='<div class="sim-card-wf sim-card-animated" onclick="S.adherentYear='+(i+1)+';setDetailTab(\'adherents\')" style="background:'+_cardBg+';border-radius:16px;padding:16px 18px;border:1.5px solid '+_cardBorder+';box-shadow:0 4px 15px rgba(0,0,0,0.06);cursor:pointer;animation:'+_floatAnim+',simGlow 4s ease-in-out infinite '+(i*0.7)+'s,simBorderShift 6s ease-in-out infinite '+(i*1.2)+'s" onmouseenter="this.style.animationPlayState=\'paused\';this.style.transform=\'translateY(-6px) scale(1.04) rotate(0deg)\';this.style.boxShadow=\'0 12px 35px rgba(0,0,0,0.15),0 0 25px rgba(29,158,117,0.12)\';this.style.borderColor=\''+accent+'\'" onmouseleave="this.style.animationPlayState=\'running\';this.style.transform=\'\';this.style.boxShadow=\'\';this.style.borderColor=\'\'">';
    // Badge A1/A2/A3 avec gradient
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">';
    h+='<div style="width:28px;height:28px;border-radius:8px;background:'+gradients+';display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px '+accent+'40"><span style="font-size:11px;font-weight:800;color:#fff">A'+(i+1)+'</span></div>';
    h+='<span style="font-size:12px;font-weight:700;color:#444">Simul\u00e9</span>';
    if(_hasVariation)h+='<span style="font-size:11px;margin-left:auto;font-weight:800;color:'+(dCA>=0?'#1D9E75':'#A32D2D')+';background:'+(dCA>=0?'#ecfdf5':'#fef2f2')+';padding:2px 8px;border-radius:6px">'+(dCA>=0?'\u25B2':'\u25BC')+'</span>';
    h+='</div>';
    // CA annuel
    h+='<div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #f0f0ea">';
    h+='<div style="font-size:10px;color:#94a3b8;margin-bottom:3px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">CA annuel</div>';
    h+='<div style="font-size:20px;font-weight:800;color:#1a1a1a;letter-spacing:-0.3px">'+fmt(sy.ca)+'</div>';
    h+='<div style="display:flex;align-items:center;gap:4px;margin-top:4px">';
    h+='<span style="font-size:10px;color:#94a3b8">vs BP :</span>';
    h+='<span style="font-size:10px;font-weight:700;color:'+(dCA>=0?'#3B6D11':'#A32D2D')+'">'+(dCA>=0?'+':'')+fmt(dCA)+'&nbsp;('+(dCApct>=0?'+':'')+dCApct+'%)</span>';
    h+='</div></div>';
    // EBITDA
    h+='<div>';
    h+='<div style="font-size:10px;color:#94a3b8;margin-bottom:3px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">EBITDA</div>';
    h+='<div style="font-size:18px;font-weight:800;color:'+(sy.ebitda>0?'#854F0B':'#A32D2D')+';letter-spacing:-0.3px">'+fmt(sy.ebitda)+'</div>';
    h+='<div style="display:flex;justify-content:space-between;margin-top:4px;align-items:center">';
    h+='<span style="font-size:10px;font-weight:700;color:'+(dEB>=0?'#3B6D11':'#A32D2D')+'">'+(dEB>=0?'+':'')+fmt(dEB)+'</span>';
    // Marge en badge pill
    var _marginColor=eMargin>=30?'#166534':eMargin>=15?'#854d0e':'#991b1b';
    var _marginBg=eMargin>=30?'#dcfce7':eMargin>=15?'#fef9c3':'#fee2e2';
    h+='<span style="font-size:12px;font-weight:800;color:'+_marginColor+';background:'+_marginBg+';padding:3px 10px;border-radius:8px">'+eMargin+'%</span>';
    h+='</div></div></div>';
  });
  h+='</div></div>';

  // ── Graphique 36 mois ──────────────────────────────────────────────────────
  h+='<div style="background:linear-gradient(180deg,#f9f9f6 0%,#f3f3ef 100%);border-top:0.5px solid #e8e8e2;padding:16px 20px 14px">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">';
  h+='<div style="font-size:12px;font-weight:700;color:#3a3a38;letter-spacing:-0.2px">Trajectoire CA &amp; EBITDA \u2014 <span style="color:#94a3b8;font-weight:400">36 mois</span></div>';
  h+='<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;background:#fff;border:0.5px solid #e8e8e4;border-radius:8px;padding:5px 12px">';
  h+='<div style="display:flex;align-items:center;gap:4px"><svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#3B6FB6" stroke-width="1.8" stroke-dasharray="5,3" stroke-linecap="round" opacity="0.5"/></svg><span style="font-size:8.5px;color:#777;font-weight:500">CA BP</span></div>';
  h+='<div style="display:flex;align-items:center;gap:5px"><div style="width:16px;height:2.5px;background:#1D9E75;border-radius:2px"></div><span style="font-size:8.5px;color:#777;font-weight:500">CA R\u00e9el</span></div>';
  h+='<div style="display:flex;align-items:center;gap:4px"><svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="5,3" stroke-linecap="round" opacity="0.4"/></svg><span style="font-size:8.5px;color:#777;font-weight:500">Projection</span></div>';
  h+='<div style="display:flex;align-items:center;gap:5px"><div style="width:16px;height:2.5px;background:#B8860B;border-radius:2px"></div><span style="font-size:8.5px;color:#777;font-weight:500">EBITDA</span></div>';
  if(beM>=0)h+='<div style="display:flex;align-items:center;gap:4px"><div style="width:2px;height:12px;background:#0F6E56;border-radius:1px;opacity:0.7"></div><span style="font-size:8.5px;color:#0F6E56;font-weight:700">Break-even</span></div>';
  h+='</div></div>';
  h+=svg;
  h+='</div>';
  h+='</div>';
  return h;
}

// ── Adherents ─────────────────────────────────────────────────────────────────
function renderAdherents(sid,s){
  var ay=S.adherentYear||1;
  var actuel=S.adherents[sid]||{};
  var moisDebut=s.forecast&&s.forecast.moisDebut||0;
  var annee=(s.forecast&&s.forecast.annee||2026)+(ay-1);
  var offset=(ay-1)*12;
  var bpArr=[],churnArr=[];
  for(var i=0;i<12;i++){
    var idx=offset+i;
    var _bpRa=getBPAdherents(sid);bpArr.push(idx<_bpRa.length?_bpRa[idx]:400);
    churnArr.push(idx<BP_CHURN.length?BP_CHURN[idx]:0);
  }
  var realArr=[];
  for(var i=0;i<12;i++){
    var key='y'+ay+'_m'+i;
    realArr.push(actuel[key]!=null?num(actuel[key]):null);
  }
  var lastReal=null;
  var nbReal=0;
  for(var i=0;i<realArr.length;i++){if(realArr[i]!==null){lastReal=realArr[i];nbReal=i+1;}}
  var bpCible=bpArr[11];
  var ecart=lastReal!==null&&nbReal>0?Math.round(lastReal-bpArr[nbReal-1]):null;
  var moisLabels=[];
  for(var i=0;i<12;i++){moisLabels.push(MOIS[(moisDebut+i)%12]);}

  var h='<div>';
  h+='<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">';
  var bps3=(typeof build3YearBPWithOverrides==='function'?build3YearBPWithOverrides:build3YearBP)(s.forecast||{},sid,getStudioBPOpts(sid));
  [1,2,3].forEach(function(y){
    var ys=y===1?bps3.a1:y===2?bps3.a2:bps3.a3;
    var yCA=ys.reduce(function(s,r){return s+r._ca;},0);
    h+='<button class="yr-tab '+(ay===y?'active':'')+'" onclick="setAdherentYear('+y+')" style="text-align:left;padding:6px 14px">';
    h+='<div style="font-weight:600">Annee '+y+' ('+((s.forecast&&s.forecast.annee||2026)+(y-1))+')</div>';
    h+='<div style="font-size:10px;opacity:0.8">CA BP '+fmt(yCA)+'</div>';
    h+='</button>';
  });
  h+='</div>';
  h+='<div class="kpis" style="margin-bottom:16px">';
  h+='<div class="kpi"><div class="kpi-label">Cible BP fin A'+ay+'</div><div class="kpi-val">'+bpCible+' mbr</div></div>';
  h+='<div class="kpi"><div class="kpi-label">Membres reels</div><div class="kpi-val" style="color:#185FA5" id="kpi-adh-real">'+(lastReal!==null?lastReal+'':'--')+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">Ecart vs BP</div><div class="kpi-val" id="kpi-adh-ecart" style="color:'+(ecart!==null?(ecart>=0?'#3B6D11':'#A32D2D'):'#888')+'">'+(ecart!==null?(ecart>=0?'+':'')+ecart:'--')+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">Seuil rentabilite</div><div class="kpi-val">150-200</div></div>';
  h+='<div class="kpi"><div class="kpi-label">Pack4/Pack8/Illim.</div><div class="kpi-val" style="font-size:11px">47% / 50% / 3%</div></div>';
  h+='</div>';
  h+=renderAdherentChart(moisLabels,bpArr,realArr,annee);
  h+='<div class="box" style="background:#f5f5f0;margin-bottom:12px">';
  h+='<div style="font-weight:600;font-size:12px;margin-bottom:8px;color:#555">Churn mensuel BP (source Plan Financier)</div>';
  h+='<div style="display:flex;flex-wrap:wrap;gap:6px">';
  for(var i=0;i<12;i++){
    var c=churnArr[i];
    h+='<div style="text-align:center;min-width:44px;background:#fff;border-radius:6px;padding:4px 6px">';
    h+='<div style="font-size:10px;color:#888">'+moisLabels[i]+'</div>';
    h+='<div style="font-size:12px;font-weight:600;color:'+(c<0?'#A32D2D':'#888')+'">'+c+'</div></div>';
  }
  h+='</div></div>';
  // ── Wizard Scénario ──────────────────────────────────────────────────────
  var _scList=(S.scenarios[sid]||[]).slice().sort(function(a,b){return (b.ts||'').localeCompare(a.ts||'');});
  var _activeId=S.activeScenarioId[sid]||'bp_default';
  var _isDefault=_isBPDefault(sid);
  var _editMode=!!S.scenarioEditMode[sid];
  var _wizardOpen=_editMode||!_isDefault;
  var _locked=_isDefault&&!_editMode;
  var simCfg=S.simConfig&&S.simConfig[sid]||{p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67};

  // ── A. Ligne sélecteur de scénarios ──
  var _lastSc=_scList.length?_scList[0]:null; // dernier enregistré = référence active
  h+='<div class="box" style="background:#f8f9fb;padding:14px 16px;margin-bottom:12px">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">';
  h+='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">';
  h+='<span style="font-size:11px;font-weight:600;color:#555">Sc\u00e9nario actif :</span>';
  h+='<select onchange="chargerScenario(\''+sid+'\',this.value)" style="padding:7px 12px;border:1px solid #dde;border-radius:8px;font-size:12px;font-weight:500;color:#1a3a6b;background:#fff;cursor:pointer;max-width:280px">';
  h+='<option value="bp_default"'+(_activeId==='bp_default'?' selected':'')+'>📊 BP de r\u00e9f\u00e9rence (lecture seule)</option>';
  _scList.forEach(function(sc,idx){
    var isLast=idx===0;
    var scLabel=sc.name||sc.comment||'Sans nom';
    if(scLabel.length>30)scLabel=scLabel.slice(0,30)+'…';
    var lbl=(isLast?'⭐ ':'')+scLabel+' — '+sc.auteur.split(' ')[0]+' · '+sc.date;
    h+='<option value="'+sc.id+'"'+(_activeId===sc.id?' selected':'')+'>'+lbl+'</option>';
  });
  h+='</select>';
  if(_scList.length>0){
    h+='<span style="font-size:10px;color:#888">'+_scList.length+' sc\u00e9nario'+(_scList.length>1?'s':'')+'</span>';
  }
  h+='</div>';
  h+='<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">';
  // Bouton nouveau scénario (toujours visible si pas viewer et si déjà un scénario chargé)
  if(!isViewer()&&!_isDefault){
    h+='<button onclick="nouveauScenario(\''+sid+'\')" style="padding:6px 12px;background:#fff;border:1px solid #1a3a6b;border-radius:8px;font-size:11px;color:#1a3a6b;cursor:pointer;display:flex;align-items:center;gap:4px;font-weight:600;transition:all 0.15s" onmouseover="this.style.background=\'#1a3a6b\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'#fff\';this.style.color=\'#1a3a6b\'" title="Cr\u00e9er un nouveau sc\u00e9nario"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nouveau</button>';
  }
  // Bouton supprimer (si scénario non-BP actif)
  if(!isViewer()&&!_isDefault){
    h+='<button onclick="supprimerScenario(\''+sid+'\',\''+_activeId+'\')" style="padding:6px 10px;background:none;border:1px solid #e0e0da;border-radius:8px;font-size:11px;color:#A32D2D;cursor:pointer;display:flex;align-items:center;gap:4px" title="Supprimer ce sc\u00e9nario"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>';
  }
  h+='</div>';
  h+='</div>';
  // Indicateur dernier scénario = référence
  if(_lastSc&&_activeId!==_lastSc.id){
    h+='<div style="background:#f0f7ff;border:1px solid #d0dffa;border-radius:8px;padding:8px 12px;margin-top:8px;display:flex;align-items:center;gap:8px;font-size:11px;color:#1a3a6b">';
    h+='<span>⭐</span><span>Derni\u00e8re version : <b>'+(_lastSc.name||_lastSc.comment||'Sans nom')+'</b> par '+_lastSc.auteur+' — '+_lastSc.date+'</span>';
    h+='<button onclick="chargerScenario(\''+sid+'\',\''+_lastSc.id+'\')" style="padding:3px 10px;background:#1a3a6b;color:#fff;border:none;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer;margin-left:auto">Charger</button>';
    h+='</div>';
  }
  h+='</div>';

  // ── B. Toggle CTA — Créer un nouveau scénario ──
  if(_isDefault&&!_editMode&&!isViewer()){
    h+='<div onclick="toggleScenarioEditMode(\''+sid+'\')" style="background:linear-gradient(135deg,#f0f7ff,#e6f0fd);border:2px dashed #a0c4f0;border-radius:14px;padding:24px 20px;margin-bottom:16px;cursor:pointer;transition:all 0.25s;text-align:center" onmouseover="this.style.borderColor=\'#1a3a6b\';this.style.background=\'linear-gradient(135deg,#e6f0fd,#dbe8fa)\';this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 8px 24px rgba(26,58,107,0.12)\'" onmouseout="this.style.borderColor=\'#a0c4f0\';this.style.background=\'linear-gradient(135deg,#f0f7ff,#e6f0fd)\';this.style.transform=\'none\';this.style.boxShadow=\'none\'">';
    h+='<div style="font-size:28px;margin-bottom:8px">✨</div>';
    h+='<div style="font-size:15px;font-weight:700;color:#1a3a6b;margin-bottom:6px">Cr\u00e9er un nouveau sc\u00e9nario</div>';
    h+='<div style="font-size:12px;color:#5b7fa6;max-width:460px;margin:0 auto;line-height:1.5">Personnalisez votre business plan en 3 \u00e9tapes : nombre d\'adh\u00e9rents r\u00e9els, r\u00e9partition des forfaits, puis prix des abonnements.</div>';
    h+='<div style="display:inline-flex;align-items:center;gap:6px;margin-top:14px;padding:10px 24px;background:#1a3a6b;color:#fff;border-radius:10px;font-size:13px;font-weight:600"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Commencer</div>';
    h+='</div>';
  }

  // ── C. Wizard 3 étapes ──
  if(_wizardOpen){
    // ─── En-tête scénario en cours ───
    if(S._scenarioName){
      h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:12px 16px;background:linear-gradient(135deg,#f0f7ff,#e6f0fd);border-radius:12px;border:1px solid #d0dffa">';
      h+='<div style="font-size:20px">✨</div>';
      h+='<div><div style="font-size:14px;font-weight:700;color:#1a3a6b">'+S._scenarioName+'</div>';
      h+='<div style="font-size:11px;color:#5b7fa6;margin-top:2px">Configurez votre scénario en 3 étapes ci-dessous</div></div></div>';
    }

    // Compteur mois remplis
    var _nbRemplis=0;
    for(var _ri=0;_ri<12;_ri++){var _rk='y'+ay+'_m'+_ri;if(actuel[_rk]!=null&&actuel[_rk]!=='')_nbRemplis++;}

    // ─── Étape 1 : Adhérents réels ───
    h+='<div class="box" style="border-left:4px solid #185FA5;margin-bottom:12px">';
    h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">';
    h+='<div style="width:28px;height:28px;border-radius:50%;background:#185FA5;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">1</div>';
    h+='<div>';
    h+='<div style="font-weight:700;font-size:14px;color:#1a1a1a">\u00c9tape 1 — Adh\u00e9rents r\u00e9els</div>';
    h+='<div style="font-size:11px;color:#888;margin-top:2px">Ann\u00e9e '+ay+' ('+annee+')</div>';
    h+='</div></div>';
    h+='<div style="background:#f0f7ff;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#1a3a6b;line-height:1.55">';
    h+='<b>💡 Comment \u00e7a marche ?</b> Renseignez vos adh\u00e9rents r\u00e9els mois par mois. Les mois non remplis restent cal\u00e9s sur le budget BP.';
    if(_nbRemplis>0&&_nbRemplis<12){
      h+='<br><span style="font-weight:600;color:#185FA5">→ Actuellement : '+_nbRemplis+' mois r\u00e9el'+ (_nbRemplis>1?'s':'') +' + '+(12-_nbRemplis)+' mois budget BP</span>';
    } else if(_nbRemplis===12){
      h+='<br><span style="font-weight:600;color:#3B6D11">→ 12 mois r\u00e9els renseign\u00e9s ✓</span>';
    } else {
      h+='<br><span style="color:#888">Ex : 4 mois saisis = 4 mois r\u00e9els + 8 mois budget.</span>';
    }
    h+='</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px">';
    for(var i=0;i<12;i++){
      var key='y'+ay+'_m'+i;
      var rVal=actuel[key]!=null?actuel[key]:'';
      var bp=bpArr[i];
      var diff=rVal!==''?num(rVal)-bp:null;
      var diffColor=diff!==null?(diff>=0?'#3B6D11':'#A32D2D'):'#888';
      var _hasVal=rVal!=='';
      h+='<div style="background:'+(_hasVal?'#eef6ff':'#f5f5f0')+';border-radius:8px;padding:8px;border:1px solid '+(_hasVal?'#b8d4f0':'transparent')+';transition:all 0.15s">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">';
      h+='<span style="font-size:11px;font-weight:600">'+moisLabels[i]+'</span>';
      if(_hasVal)h+='<span style="font-size:8px;background:#185FA5;color:#fff;padding:1px 5px;border-radius:4px;font-weight:600">R\u00c9EL</span>';
      else h+='<span style="font-size:8px;background:#ddd;color:#888;padding:1px 5px;border-radius:4px;font-weight:500">BP</span>';
      h+='</div>';
      h+='<div style="font-size:10px;color:#888;margin-bottom:3px">BP: '+bp+' (churn '+churnArr[i]+')</div>';
      h+='<input type="number" value="'+rVal+'" placeholder="'+bp+'" oninput="saisirAdherentLive(\''+sid+'\','+ay+','+i+',this.value)" style="width:100%;padding:5px 7px;border:0.5px solid '+(_hasVal?'#185FA5':'#ddd')+';border-radius:6px;font-size:12px;outline:none;background:#fff;font-weight:'+(_hasVal?'600':'400')+'"/>';
      if(diff!==null)h+='<div id="adh-diff-'+i+'" style="font-size:10px;color:'+diffColor+';margin-top:3px;font-weight:600">'+(diff>=0?'+':'')+diff+'</div>';
      else h+='<div id="adh-diff-'+i+'" style="font-size:10px;margin-top:3px;font-weight:600"></div>';
      h+='</div>';
    }
    h+='</div></div>';

    // ─── Étape 2 : Répartition des forfaits ───
    h+=renderStepRepartition(sid,ay,simCfg);

    // ─── Étape 3 : Prix des abonnements ───
    h+=renderStepPrix(sid,ay,simCfg);

    // ─── Bouton Enregistrer ───
    if(!isViewer()){
      h+='<div style="text-align:center;margin:16px 0">';
      h+='<button onclick="enregistrerScenario(\''+sid+'\')" style="display:inline-flex;align-items:center;gap:8px;padding:12px 32px;background:linear-gradient(135deg,#1a3a6b,#2a5a9b);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 16px rgba(26,58,107,0.25)" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 8px 24px rgba(26,58,107,0.35)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'0 4px 16px rgba(26,58,107,0.25)\'">';
      h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';
      h+='Enregistrer le sc\u00e9nario</button>';
      if(_isDefault&&_editMode){
        h+='<div style="margin-top:8px"><button onclick="toggleScenarioEditMode(\''+sid+'\')" style="padding:6px 16px;background:none;border:1px solid #dde;border-radius:8px;font-size:11px;color:#888;cursor:pointer">Annuler</button></div>';
      }
      h+='</div>';
    }
  }

  // ── D. Résultats (toujours visibles) ──
  h+=renderSimResults(sid,ay,bpArr,realArr,simCfg);
  h+='</div>';
  return h;
}

function buildAdherentSVG(labels,bp,real,annee){
  var W=680,H=240,PL=44,PR=20,PT=20,PB=30;
  var cW=W-PL-PR,cH=H-PT-PB;
  var allVals=bp.concat(real.filter(function(v){return v!==null;}));
  var maxV=Math.max.apply(null,allVals)*1.12;
  function xPos(i){return PL+i*(cW/(labels.length-1));}
  function yPos(v){return PT+cH-(v/maxV)*cH;}
  var h='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block">';
  for(var g=0;g<=5;g++){
    var gv=Math.round(maxV*g/5);
    var gy=yPos(gv);
    h+='<line x1="'+PL+'" y1="'+gy+'" x2="'+(W-PR)+'" y2="'+gy+'" stroke="#e8e8e0" stroke-width="1"/>';
    h+='<text x="'+(PL-5)+'" y="'+(gy+4)+'" text-anchor="end" font-size="9" fill="#aaa">'+gv+'</text>';
  }
  var yR150=yPos(150),yR200=yPos(200);
  h+='<rect x="'+PL+'" y="'+yR200+'" width="'+cW+'" height="'+(yR150-yR200)+'" fill="#E1F5EE" opacity="0.5"/>';
  h+='<text x="'+(PL+4)+'" y="'+(yR200-3)+'" font-size="8" fill="#0F6E56">Seuil 150-200</text>';
  labels.forEach(function(l,i){h+='<text x="'+xPos(i)+'" y="'+(H-5)+'" text-anchor="middle" font-size="9" fill="#888">'+l+'</text>';});
  var bpPath='M';
  bp.forEach(function(v,i){bpPath+=(i>0?' L':'')+xPos(i)+' '+yPos(v);});
  h+='<path d="'+bpPath+'" fill="none" stroke="#5b7fa6" stroke-width="2" stroke-dasharray="6,3"/>';
  var realPoints=[];
  real.forEach(function(v,i){if(v!==null)realPoints.push({x:xPos(i),y:yPos(v),v:v});});
  if(realPoints.length>1){
    var rPath='M';
    realPoints.forEach(function(p,i){rPath+=(i>0?' L':'')+p.x+' '+p.y;});
    h+='<path d="'+rPath+'" fill="none" stroke="#1D9E75" stroke-width="2.5"/>';
  }
  bp.forEach(function(v,i){h+='<circle cx="'+xPos(i)+'" cy="'+yPos(v)+'" r="3" fill="#5b7fa6" opacity="0.6"/>';});
  realPoints.forEach(function(p){
    h+='<circle cx="'+p.x+'" cy="'+p.y+'" r="5" fill="#1D9E75" stroke="#fff" stroke-width="1.5"/>';
    h+='<text x="'+p.x+'" y="'+(p.y-10)+'" text-anchor="middle" font-size="9" fill="#0F6E56" font-weight="600">'+p.v+'</text>';
  });
  h+='<line x1="'+(W-130)+'" y1="14" x2="'+(W-110)+'" y2="14" stroke="#5b7fa6" stroke-width="2" stroke-dasharray="6,3"/>';
  h+='<text x="'+(W-106)+'" y="17" font-size="9" fill="#5b7fa6">BP Plan Fin.</text>';
  h+='<line x1="'+(W-130)+'" y1="27" x2="'+(W-110)+'" y2="27" stroke="#1D9E75" stroke-width="2.5"/>';
  h+='<text x="'+(W-106)+'" y="30" font-size="9" fill="#1D9E75">Realise</text>';
  h+='</svg>';
  return h;
}

function renderAdherentChart(labels,bp,real,annee){
  var h='<div class="box" style="margin-bottom:12px;padding:1rem">';
  h+='<div style="font-weight:600;font-size:13px;margin-bottom:12px">Evolution adherents &mdash; '+annee+' &nbsp; BP vs Realise</div>';
  h+='<div id="adh-chart-wrap">'+buildAdherentSVG(labels,bp,real,annee)+'</div>';
  h+='</div>';
  return h;
}

// ── Forecast ──────────────────────────────────────────────────────────────────
function renderForecast(sid,s){
  var fy=S.forecastYear||1;
  var fs=S.forecastSection||'detail';
  // Retro-compat : 'summary' n'existe plus — bascule vers 'detail'
  if(fs==='summary')fs='detail';
  var fc=s.forecast||{};
  var bps=(typeof build3YearBPWithOverrides==='function'?build3YearBPWithOverrides:build3YearBP)(fc,sid,getStudioBPOpts(sid));
  var bp=fy===1?bps.a1:fy===2?bps.a2:bps.a3;
  var actuelKey=fy===1?'actuel':fy===2?'actuel2':'actuel3';
  var actuel=fc[actuelKey]||{};
  var annee=(fc.annee||2026)+(fy-1);
  var moisDebut=fc.moisDebut||0;
  var annualCA=fy===1?CA_A1:fy===2?CA_A2:CA_A3; // toujours depuis les constantes dossier

  var totals=bp.map(function(r,idx){
    var a=actuel[idx]||{};
    var hasReal=Object.keys(a).length>0;
    var aCA=hasReal?num(a.ca_cours)+num(a.ca_prives)+num(a.ca_boutique):null;
    var aCharges=hasReal?CHARGES.reduce(function(sum,l){return sum+num(a[l.id]!=null?a[l.id]:r[l.id]);},0):null;
    var aEBITDA=hasReal?(aCA+num(a.amort!=null?a.amort:r.amort)-CHARGES_NO_AMORT.reduce(function(sum,l){return sum+num(a[l.id]!=null?a[l.id]:r[l.id]);},0)):null;
    var aREX=hasReal?(aCA-CHARGES.filter(function(l){return l.id!=='charges_fin'&&l.id!=='is';}).reduce(function(sum,l){return sum+num(a[l.id]!=null?a[l.id]:r[l.id]);},0)):null;
    return{
      bpCA:r._ca,bpCharges:r._charges,bpResult:r._result,
      bpEBITDA:r._ebitda,bpREX:r._rex,bpCAF:r._caf,bpCashnet:r._cashnet||0,
      aCA:aCA,aCharges:aCharges,aResult:hasReal?aCA-aCharges:null,
      aEBITDA:aEBITDA,aREX:aREX,hasReal:hasReal
    };
  });

  var rm=totals.filter(function(t){return t.hasReal;});
  var cumBPCA=totals.reduce(function(s,t){return s+t.bpCA;},0);
  var cumActCA=rm.reduce(function(s,t){return s+t.aCA;},0);
  var cumBPRes=totals.reduce(function(s,t){return s+t.bpResult;},0);
  var cumActRes=rm.reduce(function(s,t){return s+t.aResult;},0);
  var cumBPEBITDA=totals.reduce(function(s,t){return s+t.bpEBITDA;},0);
  var cumBPREX=totals.reduce(function(s,t){return s+t.bpREX;},0);
  var cumBPCAF=totals.reduce(function(s,t){return s+t.bpCAF;},0);
  var cumBPCashnet=totals.reduce(function(s,t){return s+(t.bpCashnet||0);},0);
  var cumActEBITDA=rm.reduce(function(s,t){return s+t.aEBITDA;},0);
  var refCA=rm.reduce(function(s,t){return s+t.bpCA;},0);
  var ecartCA=refCA?Math.round((cumActCA/refCA-1)*100):0;
  // Référence dossier pour l'année sélectionnée
  var refDossier=(getStudioResultats(sid))[fy]||(getStudioResultats(sid))[1];
  var moisLabels=[];
  for(var i=0;i<12;i++){moisLabels.push(MOIS[(moisDebut+i)%12]);}

  var h='<div>';
  // ── Réglage loyer mensuel (règle i) ─────────────────────────────────────────
  if(!isViewer()){
    var lmDefault=isLattesStudio(sid)?Math.round(38850/12):4800;
    var lmCurrent=s.loyer_mensuel>0?s.loyer_mensuel:lmDefault;
    h+='<div style="display:flex;align-items:center;gap:10px;background:#f8f9fb;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:14px;flex-wrap:wrap">';
    h+='<div style="width:3px;height:16px;background:#1a3a6b;border-radius:2px;flex-shrink:0"></div>';
    h+='<span style="font-size:12px;font-weight:600;color:#1a3a6b;white-space:nowrap">Loyer mensuel HT</span>';
    h+='<input type="number" min="0" step="100" value="'+lmCurrent+'" '
      +'onchange="saveLoyerMensuel(\''+sid+'\',+this.value)" '
      +'style="width:110px;padding:4px 8px;border:1px solid #dce1ea;border-radius:6px;font-size:13px;font-weight:600;text-align:right;outline:none"> €/mois';
    h+='<span style="font-size:11px;color:#888;margin-left:4px">→ Loyer annuel BP : <b style="color:#0f1f3d">'+fmt(lmCurrent*12)+'</b>&nbsp;&nbsp;Référence : <b>'+fmt(lmDefault*12)+'</b></span>';
    h+='</div>';
  }
  h+='<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">';
  // Utiliser la somme réelle des 12 mois pour chaque année — cohérent avec le tableau
  [1,2,3].forEach(function(y){
    var ys=y===1?bps.a1:y===2?bps.a2:bps.a3;
    var yCAtotal=ys.reduce(function(s,r){return s+r._ca;},0);
    var yRex=ys.reduce(function(s,r){return s+r._rex;},0);
    var yRN=ys.reduce(function(s,r){return s+r._result;},0);
    var isActive=fy===y;
    h+='<button class="yr-tab '+(isActive?'active':'')+'" onclick="setForecastYear('+y+')" style="text-align:left;padding:6px 14px">';
    h+='<div style="font-weight:600">A'+y+' ('+(( fc.annee||2026)+(y-1))+')</div>';
    h+='<div style="font-size:10px;opacity:0.8">CA '+fmt(yCAtotal)+' &middot; RN '+(yRN>=0?'+':'')+fmt(yRN)+'</div>';
    h+='</button>';
  });
  h+='</div>';

  // KPIs enrichis avec les 5 indicateurs clés du dossier
  h+='<div class="kpis" style="margin-bottom:16px">';
  h+='<div class="kpi"><div class="kpi-label">CA BP (dossier : '+fmt(refDossier.ca)+')</div><div class="kpi-val">'+fmt(cumBPCA)+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">CA reel saisi</div><div class="kpi-val" style="color:#185FA5">'+fmt(cumActCA)+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">Ecart CA</div><div class="kpi-val" style="color:'+(ecartCA>=0?'#3B6D11':'#A32D2D')+'">'+(ecartCA>=0?'+':'')+ecartCA+'%</div></div>';
  h+='<div class="kpi"><div class="kpi-label">REX BP (dossier : '+fmt(refDossier.rex)+')</div><div class="kpi-val" style="color:#0F6E56">'+fmt(cumBPREX)+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">EBITDA BP</div><div class="kpi-val" style="color:#854F0B">'+fmt(cumBPEBITDA)+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">RN BP (dossier : '+fmt(refDossier.rnet)+')</div><div class="kpi-val">'+fmt(cumBPRes)+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">CAF BP (dossier : '+fmt(refDossier.caf)+')</div><div class="kpi-val">'+fmt(cumBPCAF)+'</div></div>';
  h+='<div class="kpi" style="border:1.5px solid #d0d9ec;background:#f0f4fc"><div class="kpi-label" style="color:#1a3a6b;font-weight:600">Cash net disponible</div><div class="kpi-val" style="color:'+(cumBPCashnet>=0?'#1a3a6b':'#A32D2D')+'">'+fmt(cumBPCashnet)+'</div></div>';
  h+='</div>';

  // ── Sub-tabs BP (3D, dynamiques) ────────────────────────────────────────────
  h+='<div class="bp-subtabs">';
  h+='<button class="bp-subtab '+(fs==='detail'?'active':'')+'" onclick="setFS(\'detail\')">';
  h+='<span class="bp-subtab-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v4H3z"/><path d="M3 11h18v4H3z"/><path d="M3 19h18v2H3z"/></svg></span>';
  h+='<span class="bp-subtab-label">Detail complet</span>';
  h+='<span class="bp-subtab-sub">CA, charges, IS &mdash; Y'+fy+'</span></button>';
  h+='<button class="bp-subtab '+(fs==='saisie'?'active':'')+'" onclick="setFS(\'saisie\')">';
  h+='<span class="bp-subtab-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z"/></svg></span>';
  h+='<span class="bp-subtab-label">Saisie mensuelle</span>';
  h+='<span class="bp-subtab-sub">R&eacute;el saisi par mois</span></button>';
  h+='<button class="bp-subtab '+(fs==='recap3'?'active':'')+'" onclick="setFS(\'recap3\')">';
  h+='<span class="bp-subtab-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><polyline points="7 14 11 10 15 14 21 8"/></svg></span>';
  h+='<span class="bp-subtab-label">R&eacute;cap 3 ans</span>';
  h+='<span class="bp-subtab-sub">Y1 &middot; Y2 &middot; Y3</span></button>';
  h+='</div>';

  if(fs==='detail'){
    var _bpEdit=isSuperAdmin()||(!isViewer());

    // ── Bandeau didactique : comment saisir ? ─────────────────────────────
    if(_bpEdit){
      h+='<div class="bp-help-banner">';
      h+='<div class="bp-help-ic">💡</div>';
      h+='<div style="flex:1">';
      h+='<div class="bp-help-title">Comment modifier le BP ?</div>';
      h+='<div class="bp-help-txt">Saisissez un <b>montant annuel</b> dans la colonne <b>Total</b> à droite — l\'app répartit automatiquement sur les 12 mois. '
        +'Pour le <b>CA</b>, la saisonnalité du dossier (ramp-up) est conservée ; pour les charges fixes, le montant est divisé par 12. '
        +'<b>IS</b>, <b>EBITDA</b> et <b>CAF</b> se recalculent en direct.</div>';
      h+='</div></div>';
    }

    // ── Toggle "Détail mois" (mobile uniquement, ≤ 640px) ─────────────────
    var _showMonths=!!S.bpShowMonthsMobile;
    h+='<button class="bp-months-toggle'+(_showMonths?' active':'')+'" onclick="toggleBPMonthsMobile()" type="button">';
    h+='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
    h+=(_showMonths?'Masquer le d&eacute;tail mois':'Voir le d&eacute;tail mois');
    h+='</button>';

    h+='<div class="bp-detail-wrap'+(_showMonths?' bp-detail-show-months':'')+'" style="overflow-x:auto"><table class="bp-detail-table">';
    h+='<tr><th style="text-align:left;padding-left:8px;min-width:180px">Ligne</th>';
    moisLabels.forEach(function(m){h+='<th>'+m+'</th>';});
    h+='<th class="bp-total-col-head">Total annuel'+(_bpEdit?' <span class="bp-edit-hint">✎</span>':'')+'</th></tr>';

    // ── Produits ──
    h+='<tr class="bp-section-head produits"><td colspan="14">PRODUITS</td></tr>';
    var monthProd=Array(12).fill(0);
    PRODUITS.forEach(function(l){
      var tot=0;
      h+='<tr class="bp-line"><td class="lbl" style="padding-left:18px">'+l.label+'</td>';
      bp.forEach(function(r,i){
        var bv=r[l.id];tot+=bv;monthProd[i]+=bv;
        var a=actuel[i]&&actuel[i][l.id]!=null?actuel[i][l.id]:null;
        h+='<td class="bp-cell"><div class="bp-val">'+fmtN(bv)+'</div>';
        if(a!==null)h+='<div class="bp-actual">'+fmtN(a)+'</div>';
        h+='</td>';
      });
      // Colonne Total = input annuel éditable
      h+='<td class="bp-total-cell">';
      if(_bpEdit){
        h+='<input type="number" class="bp-annual-input" value="'+tot+'" '
          +'onchange="onEditBPAnnual(\''+sid+'\',\''+l.id+'\','+fy+',this.value)" '
          +'title="Montant annuel Y'+fy+' — r&eacute;parti sur 12 mois (saisonnalit&eacute; CA pr&eacute;serv&eacute;e)" />';
      } else {
        h+='<div class="bp-total">'+fmtN(tot)+'</div>';
      }
      h+='</td></tr>';
    });
    // Sum row Produits (non éditable — c'est une somme)
    var totProd=monthProd.reduce(function(s,v){return s+v;},0);
    h+='<tr class="bp-sum-row produits"><td class="lbl">Total Produits</td>';
    monthProd.forEach(function(v){h+='<td>'+fmtN(v)+'</td>';});
    h+='<td class="bp-total">'+fmtN(totProd)+'</td></tr>';

    // ── Charges ──
    h+='<tr class="bp-section-head charges"><td colspan="14">CHARGES</td></tr>';
    var monthCh=Array(12).fill(0);
    CHARGES.forEach(function(l){
      var tot=0;
      // IS est auto-calculé — verrouillé (read-only)
      var isReadonly=(l.id==='is');
      h+='<tr class="bp-line'+(isReadonly?' bp-line-readonly':'')+'"><td class="lbl" style="padding-left:18px">'+l.label;
      if(isReadonly)h+=' <span class="bp-auto-badge" title="Calcul&eacute; automatiquement (15% jusqu\'&agrave; 42 500 &euro;, 25% au-del&agrave;)">auto</span>';
      h+='</td>';
      bp.forEach(function(r,i){
        var bv=r[l.id];tot+=bv;monthCh[i]+=bv;
        var a=actuel[i]&&actuel[i][l.id]!=null?actuel[i][l.id]:null;
        h+='<td class="bp-cell"><div class="bp-val'+(isReadonly?' bp-val-auto':'')+'">'+fmtN(bv)+'</div>';
        if(a!==null)h+='<div class="bp-actual">'+fmtN(a)+'</div>';
        h+='</td>';
      });
      // Colonne Total éditable (sauf IS)
      h+='<td class="bp-total-cell">';
      if(_bpEdit&&!isReadonly){
        h+='<input type="number" class="bp-annual-input" value="'+tot+'" '
          +'onchange="onEditBPAnnual(\''+sid+'\',\''+l.id+'\','+fy+',this.value)" '
          +'title="Montant annuel Y'+fy+' — r&eacute;parti sur 12 mois" />';
      } else {
        h+='<div class="bp-total'+(isReadonly?' bp-val-auto':'')+'">'+fmtN(tot)+'</div>';
      }
      h+='</td></tr>';
    });
    // Sum row Charges
    var totCh=monthCh.reduce(function(s,v){return s+v;},0);
    h+='<tr class="bp-sum-row charges"><td class="lbl">Total Charges</td>';
    monthCh.forEach(function(v){h+='<td>'+fmtN(v)+'</td>';});
    h+='<td class="bp-total">'+fmtN(totCh)+'</td></tr>';

    // ── Indicateurs dérivés (EBITDA, RN, CAF) ──
    h+='<tr class="bp-section-head indicateurs"><td colspan="14">INDICATEURS (recalcul&eacute;s)</td></tr>';

    // EBITDA mensuel = REX + Amort (CA - charges hors amort/IS/charges_fin)
    var totEB=0;
    h+='<tr class="bp-indic ebitda"><td class="lbl">EBITDA <span class="bp-auto-badge">auto</span></td>';
    totals.forEach(function(t){
      totEB+=t.bpEBITDA;
      h+='<td><div class="bp-val-indic">'+fmtN(t.bpEBITDA)+'</div>';
      if(t.hasReal)h+='<div class="bp-actual '+(t.aEBITDA>=0?'pos':'neg')+'">'+fmtN(t.aEBITDA)+'</div>';
      h+='</td>';
    });
    h+='<td class="bp-total">'+fmtN(totEB)+'</td></tr>';

    // REX
    var totREX=0;
    h+='<tr class="bp-indic rex"><td class="lbl">R&eacute;sultat d\'exploitation <span class="bp-auto-badge">auto</span></td>';
    totals.forEach(function(t){
      totREX+=t.bpREX;
      h+='<td><div class="bp-val-indic">'+fmtN(t.bpREX)+'</div></td>';
    });
    h+='<td class="bp-total">'+fmtN(totREX)+'</td></tr>';

    // Résultat Net
    var totRN=0;
    h+='<tr class="bp-indic rn"><td class="lbl">R&eacute;sultat net <span class="bp-auto-badge">auto</span></td>';
    totals.forEach(function(t){
      totRN+=t.bpResult;
      h+='<td><div class="bp-val-indic strong">'+fmtN(t.bpResult)+'</div>';
      if(t.hasReal)h+='<div class="bp-actual '+(t.aResult>=0?'pos':'neg')+'">'+fmtN(t.aResult)+'</div>';
      h+='</td>';
    });
    h+='<td class="bp-total">'+fmtN(totRN)+'</td></tr>';

    // CAF apparent = RN + Amort
    var totCAF=0;
    h+='<tr class="bp-indic caf"><td class="lbl">CAF apparente <span class="bp-auto-badge">auto</span></td>';
    totals.forEach(function(t){
      totCAF+=t.bpCAF;
      h+='<td><div class="bp-val-indic">'+fmtN(t.bpCAF)+'</div></td>';
    });
    h+='<td class="bp-total">'+fmtN(totCAF)+'</td></tr>';

    h+='</table></div>';

    // Panel propositions en attente (si existe)
    if(typeof renderBPProposalsPanel==='function')h+=renderBPProposalsPanel(sid);

    // Légende + metadata
    var bpMeta=(s.bpMeta||{});
    var metaTxt=bpMeta.createdBy?('BP initial enregistr&eacute; par <b>'+bpMeta.createdBy+'</b>'+(bpMeta.createdAt?' &middot; '+new Date(bpMeta.createdAt).toLocaleDateString('fr-FR'):'')):'BP par d&eacute;faut (mod&egrave;le La Garenne-Colombes)';
    if(bpMeta.lastModifiedBy&&bpMeta.lastModifiedBy!==bpMeta.createdBy){
      metaTxt+=' &middot; derni&egrave;re modif : '+bpMeta.lastModifiedBy+(bpMeta.lastModifiedAt?' le '+new Date(bpMeta.lastModifiedAt).toLocaleDateString('fr-FR'):'');
    }
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;flex-wrap:wrap;gap:10px">';
    h+='<div style="font-size:11px;color:#888">'+metaTxt+'</div>';
    h+='<div style="display:flex;gap:8px;align-items:center">';
    h+='<div style="font-size:10px;color:#888">Cellules &eacute;ditables &middot; <span class="bp-auto-badge">auto</span> = recalcul&eacute; (IS 15/25%, EBITDA, CAF)</div>';
    if(isSuperAdmin()){
      h+='<button class="btn" style="font-size:10px;padding:4px 10px;color:#6b7280" onclick="resetBPYear(\''+sid+'\','+fy+')" title="Revenir aux valeurs La Garenne-Colombes pour l\'ann&eacute;e Y'+fy+'">Reset Y'+fy+'</button>';
    }
    h+='</div></div>';
  }

  if(fs==='saisie'){
    h+='<div class="months-grid">';
    for(var i=0;i<12;i++){
      var ok=actuel[i]&&Object.keys(actuel[i]).length>0;
      h+='<button class="month-btn '+(ok?'ok':'')+'" onclick="openEditMois('+i+')">'+moisLabels[i]+' '+(ok?'&#10003;':'')+'</button>';
    }
    h+='</div>';
    if(S.editMoisIdx!==null){
      var r=bp[S.editMoisIdx];
      h+='<div class="box"><div style="font-weight:600;font-size:14px;margin-bottom:4px">Saisie &mdash; '+moisLabels[S.editMoisIdx]+' '+annee+'</div>';
      h+='<div class="sec-title">Produits</div><div class="edit-grid">';
      PRODUITS.forEach(function(l){
        h+='<div><label style="font-size:11px;color:#888;display:block;margin-bottom:3px">'+l.label+' (BP: '+fmtN(r[l.id])+')</label>';
        h+='<input type="number" value="'+(S.editVals[l.id]||'')+'" oninput="setEV(\''+l.id+'\',this.value)" placeholder="'+r[l.id]+'" style="width:100%;padding:7px;border:0.5px solid #ddd;border-radius:7px;font-size:12px;outline:none"/></div>';
      });
      h+='</div><div class="sec-title">Charges</div><div class="edit-grid">';
      CHARGES.forEach(function(l){
        h+='<div><label style="font-size:11px;color:#888;display:block;margin-bottom:3px">'+l.label+' (BP: '+fmtN(r[l.id])+')</label>';
        h+='<input type="number" value="'+(S.editVals[l.id]||'')+'" oninput="setEV(\''+l.id+'\',this.value)" placeholder="'+r[l.id]+'" style="width:100%;padding:7px;border:0.5px solid #ddd;border-radius:7px;font-size:12px;outline:none"/></div>';
      });
      h+='</div><div style="display:flex;gap:8px;margin-top:12px">';
      h+='<button class="btn btn-primary" onclick="saveMois()">Enregistrer</button>';
      h+='<button class="btn" onclick="clearMois()">Effacer</button>';
      h+='<button class="btn" onclick="cancelEdit()">Annuler</button>';
      h+='</div></div>';
    }
  }

  if(fs==='recap3'){
    var a1s=bps.a1,a2s=bps.a2,a3s=bps.a3;
    function sumF(arr,f){return arr.reduce(function(s,r){return s+r[f];},0);}
    var sCA1=sumF(a1s,'_ca'),sCA2=sumF(a2s,'_ca'),sCA3=sumF(a3s,'_ca');
    var sEB1=sumF(a1s,'_ebitda'),sEB2=sumF(a2s,'_ebitda'),sEB3=sumF(a3s,'_ebitda');
    var sRN1=sumF(a1s,'_result'),sRN2=sumF(a2s,'_result'),sRN3=sumF(a3s,'_result');
    var sCH1=sumF(a1s,'_charges'),sCH2=sumF(a2s,'_charges'),sCH3=sumF(a3s,'_charges');
    // CAF = RN + Amort (source dossier p.9)
    var sAM1=sumF(a1s,'amort'),sAM2=sumF(a2s,'amort'),sAM3=sumF(a3s,'amort');
    var sCAF1=sRN1+sAM1,sCAF2=sRN2+sAM2,sCAF3=sRN3+sAM3;
    // Remboursement capital = emprunt effectif / 7 ans (dynamique selon CAPEX custom)
    var _opts3y=getStudioBPOpts(sid);
    var _emprunt3y=_opts3y.emprunt||(isLattesStudio(sid)?214340:230000);
    var rembt=Math.round(_emprunt3y/7);
    var sTreso1=sCAF1-rembt,sTreso2=sCAF2-rembt,sTreso3=sCAF3-rembt;
    // Valeurs dossier pour comparaison
    var ref=getStudioResultats(sid);
    h+='<div class="box">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">';
    h+='<div style="font-weight:600;font-size:14px">Recapitulatif 3 ans &mdash; Dossier Financement</div>';
    h+='<div style="font-size:11px;color:#888;background:#f0f0ea;padding:3px 10px;border-radius:6px">'+(isLattesStudio(sid)?'Ref. Lattes p.9':'Loyer 4 800€/mois')+'</div>';
    h+='</div>';
    h+='<div style="overflow-x:auto"><table>';
    h+='<tr><th style="text-align:left;padding-left:8px;min-width:200px">Indicateur</th>';
    h+='<th>A1 ('+(fc.annee||2026)+')</th><th>A2 ('+(fc.annee?fc.annee+1:2027)+')</th><th>A3 ('+(fc.annee?fc.annee+2:2028)+')</th><th>Cumule 3 ans</th></tr>';
    var lines3=[
      {l:'CA annuel',v:[sCA1,sCA2,sCA3],ref:[ref[1].ca,ref[2].ca,ref[3].ca],cur:true,bold:true},
      {l:'Charges totales',v:[sCH1,sCH2,sCH3],ref:[ref[1].charges,ref[2].charges,ref[3].charges],cur:true},
      {l:'Rex (Expl.)',v:[sCA1-sCH1+sRN1-(sCA1-sCH1+sRN1-(sCA1-sCH1)),sCA2-sCH2+sRN2-(sCA2-sCH2+sRN2-(sCA2-sCH2)),sCA3-sCH3+sRN3-(sCA3-sCH3+sRN3-(sCA3-sCH3))],ref:[ref[1].rex,ref[2].rex,ref[3].rex],cur:true,green:true},
      {l:'Marge exploitation',v:[Math.round((sCA1-sCH1)/sCA1*100),Math.round((sCA2-sCH2)/sCA2*100),Math.round((sCA3-sCH3)/sCA3*100)],ref:[Math.round(ref[1].marge_rex*100),Math.round(ref[2].marge_rex*100),Math.round(ref[3].marge_rex*100)],pct:true},
      {l:'Resultat net',v:[sRN1,sRN2,sRN3],ref:[ref[1].rnet,ref[2].rnet,ref[3].rnet],cur:true,bold:true},
      {l:'Marge nette',v:[Math.round(sRN1/sCA1*100),Math.round(sRN2/sCA2*100),Math.round(sRN3/sCA3*100)],ref:[Math.round(ref[1].marge_nette*100),Math.round(ref[2].marge_nette*100),Math.round(ref[3].marge_nette*100)],pct:true},
      {l:'CAF',v:[sCAF1,sCAF2,sCAF3],ref:[ref[1].caf,ref[2].caf,ref[3].caf],cur:true},
      {l:'Cash net disponible',v:[sumF(a1s,'_cashnet'),sumF(a2s,'_cashnet'),sumF(a3s,'_cashnet')],ref:[ref[1].treso,ref[2].treso,ref[3].treso],cur:true,treso:true},
      {l:'Adherents fin annee',v:[getBPAdherents(sid)[11],getBPAdherents(sid)[23],getBPAdherents(sid)[35]],adh:true},
    ];
    lines3.forEach(function(row){
      var isPct=row.pct===true,isAdh=row.adh===true,isTreso=row.treso===true,isGreen=row.green===true;
      var cum=isPct||isAdh?'--':(row.v[0]+row.v[1]+row.v[2]);
      h+='<tr style="background:'+(isGreen?'#f0faf5':row.bold?'#f8f8f4':'')+'">';
      h+='<td class="lbl" style="font-weight:'+(row.bold||isGreen?600:400)+';color:'+(isGreen?'#0F6E56':'inherit')+'">'+row.l+'</td>';
      row.v.forEach(function(v,vi){
        var disp=isPct?(v+'%'):isAdh?fmtN(v):fmt(v);
        var refV=row.ref&&row.ref[vi];
        var diffTxt='';
        if(refV!=null&&!isAdh){
          var diffPct=isPct?(v-refV):(Math.round((v/refV-1)*100));
          if(diffPct!==0)diffTxt='<div style="font-size:9px;color:'+(diffPct>=0?'#3B6D11':'#A32D2D')+'">'+(diffPct>0?'+':'')+diffPct+(isPct?'pp':'%')+' vs ref</div>';
        }
        h+='<td style="color:'+(isGreen?'#0F6E56':isTreso?(v>=0?'#0F6E56':'#A32D2D'):'inherit')+';font-weight:'+(row.bold||isGreen?600:400)+'"><div>'+disp+'</div>'+diffTxt+'</td>';
      });
      h+='<td style="font-weight:700;color:'+(isGreen?'#0F6E56':isTreso?((cum)>=0?'#0F6E56':'#A32D2D'):'inherit')+'">'+(isPct||isAdh?'--':fmt(cum))+'</td></tr>';
    });
    h+='</table></div>';
    h+='<div style="font-size:10px;color:#888;margin-top:8px">Ecarts % vs valeurs de reference du Dossier Financement Lattes (p.9) &mdash; remboursement emprunt : '+fmt(rembt)+'/an</div>';
    h+='</div>';
    // Graphique CA 3 ans
    h+=renderCA3Chart(a1s,a2s,a3s,fc);
  }
  h+='</div>';
  return h;
}

function renderCA3Chart(a1s,a2s,a3s,fc){
  // Mode superposé : 3 courbes sur le même axe X (12 mois), chacune représente une année
  // Beaucoup plus lisible que 36 points en séquence avec un pic M2 dominant
  var years=[a1s,a2s,a3s];
  var colors=['#5b7fa6','#1D9E75','#854F0B'];
  var labels=['A1 ('+(fc.annee||2026)+')','A2 ('+(fc.annee?fc.annee+1:2027)+')','A3 ('+(fc.annee?fc.annee+2:2028)+')'];
  var W=680,H=200,PL=56,PR=16,PT=20,PB=36;
  var cW=W-PL-PR,cH=H-PT-PB;

  // Max sur toutes les courbes (hors M2 A1 pour ne pas écraser les autres)
  var allVals=[].concat(a1s,a2s,a3s).map(function(r){return r._ca;});
  // Exclure le pic M2 A1 du calcul du max pour un meilleur scaling
  var valsNoSpike=allVals.filter(function(v,i){return i!==1;});
  var maxNorm=Math.max.apply(null,valsNoSpike)*1.15;
  var maxV=Math.max(maxNorm,allVals[1]*0.6); // garde le pic visible mais pas écrasant

  function xp(i){return PL+i*(cW/11);}
  function yp(v){return PT+cH-Math.min((v/maxV)*cH,cH);}

  var MOIS_SHORT=['J','F','M','A','M','J','J','A','S','O','N','D'];
  var moisDebut=fc.moisDebut||0;

  var h='<div class="box">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
  h+='<div style="font-weight:600;font-size:13px">CA mensuel &mdash; 3 ans superposes</div>';
  h+='<div style="display:flex;gap:14px">';
  years.forEach(function(ys,yi){
    var caAn=ys.reduce(function(s,r){return s+r._ca;},0);
    h+='<div style="display:flex;align-items:center;gap:5px">';
    h+='<div style="width:16px;height:3px;background:'+colors[yi]+';border-radius:2px"></div>';
    h+='<span style="font-size:11px;color:'+colors[yi]+';font-weight:600">'+labels[yi]+'</span>';
    h+='<span style="font-size:10px;color:#aaa">'+fmt(caAn)+'</span>';
    h+='</div>';
  });
  h+='</div></div>';
  h+='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block">';

  // Grilles horizontales
  for(var g=0;g<=4;g++){
    var gv=Math.round(maxV*g/4);
    var gy=yp(gv);
    h+='<line x1="'+PL+'" y1="'+gy+'" x2="'+(W-PR)+'" y2="'+gy+'" stroke="#e8e8e0" stroke-width="1"/>';
    h+='<text x="'+(PL-4)+'" y="'+(gy+3)+'" text-anchor="end" font-size="8" fill="#bbb">'+fmt(gv)+'</text>';
  }

  // Labels mois en bas
  for(var i=0;i<12;i++){
    var ml=MOIS_SHORT[(moisDebut+i)%12];
    h+='<text x="'+xp(i)+'" y="'+(H-8)+'" text-anchor="middle" font-size="9" fill="#aaa">'+ml+'</text>';
  }
  // Grilles verticales légères
  for(var i=0;i<12;i++){
    h+='<line x1="'+xp(i)+'" y1="'+PT+'" x2="'+xp(i)+'" y2="'+(H-PB)+'" stroke="#f0f0e8" stroke-width="1"/>';
  }

  // EBITDA zones (en dessous des courbes) - seulement A2 et A3 pour ne pas surcharger
  [1,2].forEach(function(yi){
    var ys=years[yi];
    var area='M'+xp(0)+' '+yp(0);
    ys.forEach(function(r,i){area+=' L'+xp(i)+' '+yp(r._ebitda);});
    area+=' L'+xp(11)+' '+yp(0)+' Z';
    h+='<path d="'+area+'" fill="'+colors[yi]+'" opacity="0.07"/>';
  });

  // Courbes
  years.forEach(function(ys,yi){
    var path='M';
    ys.forEach(function(r,i){path+=(i>0?' L':'')+xp(i)+' '+yp(r._ca);});
    h+='<path d="'+path+'" fill="none" stroke="'+colors[yi]+'" stroke-width="'+(yi===0?'1.5':'2')+'" stroke-dasharray="'+(yi===0?'5,3':'none')+'"/>';
    // Points
    ys.forEach(function(r,i){
      h+='<circle cx="'+xp(i)+'" cy="'+yp(r._ca)+'" r="3" fill="'+colors[yi]+'" opacity="0.8"/>';
    });
    // Valeur fin d'année (M12)
    var lastR=ys[11];
    h+='<text x="'+(xp(11)+6)+'" y="'+(yp(lastR._ca)+3)+'" font-size="8" fill="'+colors[yi]+'" font-weight="600">'+fmt(lastR._ca)+'</text>';
  });

  // Note sur le pic A1 M2
  var peakA1=a1s[1]._ca;
  h+='<text x="'+xp(1)+'" y="'+(PT-5)+'" text-anchor="middle" font-size="7.5" fill="#5b7fa6" opacity="0.7">Opening</text>';

  h+='</svg>';
  h+='<div style="font-size:10px;color:#aaa;margin-top:6px">A1 pointille = rampe opening &middot; A2/A3 plein = croisiere &middot; Zones = EBITDA A2/A3</div>';
  h+='</div>';
  return h;
}

// ── Engagements ───────────────────────────────────────────────────────────────
