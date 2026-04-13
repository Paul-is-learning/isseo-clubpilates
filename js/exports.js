// ── EXPORT PDF — Rapport studio consulting-grade ────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function toggleExportMenu(e){
  if(e)e.stopPropagation();
  var m=document.getElementById('export-menu');
  if(!m)return;
  var show=m.style.display==='none';
  m.style.display=show?'block':'none';
  if(show){setTimeout(function(){document.addEventListener('click',closeExportMenu,{once:true});},10);}
}
function closeExportMenu(){
  var m=document.getElementById('export-menu');
  if(m)m.style.display='none';
}

function generateReport(sid,sections){
  var _allSections=!sections||!sections.length;
  function _incl(id){return _allSections||sections.indexOf(id)>=0;}
  var s=S.studios[sid];if(!s)return;
  var f=s.forecast||{};
  var md=f.moisDebut||0;
  var annee0=f.annee||2026;
  var opts=getStudioBPOpts(sid);
  var bp=build3YearBP(f,sid,opts);
  var allRows=bp.a1.concat(bp.a2,bp.a3);
  var caArr=allRows.map(function(r){return r._ca;});
  var ebtArr=allRows.map(function(r){return r._ebitda;});
  var YR=[0,1,2].map(function(yi){
    var rows=yi===0?bp.a1:yi===1?bp.a2:bp.a3;
    var ca=rows.reduce(function(s,r){return s+r._ca;},0);
    var charges=rows.reduce(function(s,r){return s+r._charges;},0);
    var rex=rows.reduce(function(s,r){return s+r._rex;},0);
    var ebitda=rows.reduce(function(s,r){return s+r._ebitda;},0);
    var rnet=rows.reduce(function(s,r){return s+r._result;},0);
    var caf=rows.reduce(function(s,r){return s+r._caf;},0);
    return{ca:ca,charges:charges,rex:rex,ebitda:ebitda,rnet:rnet,caf:caf,annee:annee0+yi};
  });
  var beM=-1;
  for(var k=1;k<36;k++){if(ebtArr[k]>0&&ebtArr[k-1]<=0){beM=k;break;}}
  var _bpE=getBPAdherents(sid);var beAdh2=beM>=0?(beM<_bpE.length?_bpE[beM]:400):0;
  var beMoiLabel=beM>=0?(MOIS[(md+beM)%12]+' '+(annee0+Math.floor(beM/12))+' \u00b7 '+beAdh2+' adh.'):'N/A';
  var capexDet=getCapexDetailForStudio(sid);
  var capexTots=computeCapexTotals(capexDet);
  var emprunt=opts.emprunt||s.emprunt||230000;
  var fondsPropres=capexTots.capex-emprunt;
  var deps=S.depenses&&S.depenses[sid]||[];
  var depEngage=deps.reduce(function(s,d){return s+(d.ttc||0);},0);
  var depDebloque=deps.filter(function(d){return d.deblocage==='debloque';}).reduce(function(s,d){return s+(d.ttc||0);},0);
  var depDemande=deps.filter(function(d){return d.deblocage==='demande';}).reduce(function(s,d){return s+(d.ttc||0);},0);
  var ld=LOCALISATION_DATA[sid];
  var _STS=getStudioSteps(sid);
  var stepsDone=_STS.filter(function(st){return s.steps&&s.steps[st.id];}).length;
  var now=new Date();
  var dateStr=now.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
  var actuelWF=S.adherents&&S.adherents[sid]||{};
  var simCfg=S.simConfig&&S.simConfig[sid]||{p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67};

  // ── SVG chart builder ──
  var W=520,H=170,PL=44,PR=12,PT=14,PB=24,cW=W-PL-PR,cH=H-PT-PB;
  var maxV=Math.max.apply(null,caArr)*1.12||1;
  function rxp(i){return PL+i*(cW/35);}
  function ryv(v){return PT+cH-(Math.max(0,v)/maxV)*cH;}
  var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block">';
  svg+='<defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1a3a6b" stop-opacity="0.12"/><stop offset="100%" stop-color="#1a3a6b" stop-opacity="0.01"/></linearGradient></defs>';
  [0,0.25,0.5,0.75,1].forEach(function(t){
    var gv=Math.round(maxV*t),gy=ryv(gv);
    svg+='<line x1="'+PL+'" y1="'+gy+'" x2="'+(W-PR)+'" y2="'+gy+'" stroke="#e2e8f0" stroke-width="0.5"'+(t>0?' stroke-dasharray="2,4"':'')+'/>';
    svg+='<text x="'+(PL-4)+'" y="'+(gy+3)+'" text-anchor="end" font-size="7.5" fill="#94a3b8" font-family="sans-serif">'+Math.round(gv/1000)+'k</text>';
  });
  for(var y=0;y<3;y++){
    var bx0=rxp(y*12),bx1=y<2?rxp((y+1)*12):W-PR;
    if(y>0)svg+='<line x1="'+bx0+'" y1="'+PT+'" x2="'+bx0+'" y2="'+(PT+cH)+'" stroke="#cbd5e1" stroke-width="0.5" stroke-dasharray="3,4"/>';
    svg+='<text x="'+((bx0+bx1)/2)+'" y="'+(H-5)+'" text-anchor="middle" font-size="8.5" fill="#94a3b8" font-weight="600" font-family="sans-serif">A'+(y+1)+' \u00b7 '+(annee0+y)+'</text>';
  }
  var caP='M'+rxp(0)+' '+(PT+cH);caArr.forEach(function(v,i){caP+=' L'+rxp(i)+' '+ryv(v);});caP+=' L'+rxp(35)+' '+(PT+cH)+' Z';
  svg+='<path d="'+caP+'" fill="url(#rg)"/>';
  var caLine='';caArr.forEach(function(v,i){caLine+=(i===0?'M':'L')+rxp(i)+' '+ryv(v)+' ';});
  svg+='<path d="'+caLine+'" fill="none" stroke="#1a3a6b" stroke-width="2.2" stroke-linejoin="round"/>';
  var ebtLine='';ebtArr.forEach(function(v,i){ebtLine+=(i===0?'M':'L')+rxp(i)+' '+ryv(Math.max(0,v))+' ';});
  svg+='<path d="'+ebtLine+'" fill="none" stroke="#B8860B" stroke-width="1.6" stroke-linejoin="round" stroke-dasharray="5,3"/>';
  if(beM>=0){
    svg+='<line x1="'+rxp(beM)+'" y1="'+PT+'" x2="'+rxp(beM)+'" y2="'+(PT+cH)+'" stroke="#0F6E56" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.6"/>';
    svg+='<circle cx="'+rxp(beM)+'" cy="'+(PT+cH)+'" r="3.5" fill="#0F6E56" stroke="#fff" stroke-width="1.5"/>';
    var blTxt='Break-even \u00b7 '+beMoiLabel;var blW=blTxt.length*4.3+14;
    svg+='<rect x="'+Math.max(PL,rxp(beM)-blW/2)+'" y="'+(PT+3)+'" width="'+blW+'" height="14" rx="7" fill="#0F6E56"/>';
    svg+='<text x="'+Math.max(PL+blW/2,rxp(beM))+'" y="'+(PT+13)+'" text-anchor="middle" font-size="7" fill="#fff" font-weight="700" font-family="sans-serif">'+blTxt+'</text>';
  }
  [0,11,23,35].forEach(function(di){svg+='<circle cx="'+rxp(di)+'" cy="'+ryv(caArr[di])+'" r="2.5" fill="#1a3a6b" stroke="#fff" stroke-width="1.2"/>';});
  svg+='</svg>';

  // ── Build HTML ──
  var h='<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport \u2014 '+s.name+'</title>';
  h+='<style>';
  // Page & print
  h+='@page{size:A4;margin:0}';
  h+='*{box-sizing:border-box;margin:0;padding:0}';
  h+='body{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;color:#1e293b;font-size:10.5px;line-height:1.55;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}';
  h+='.slide{width:210mm;min-height:297mm;padding:0;position:relative;page-break-after:always;overflow:hidden}';
  h+='.slide:last-child{page-break-after:auto}';
  // Top bar
  h+='.top-bar{height:6px;background:linear-gradient(90deg,#0f1f3d 0%,#1a3a6b 40%,#1D9E75 100%)}';
  // Section header
  h+='.sec-hdr{background:#0f1f3d;color:#fff;padding:14px 40px 12px;display:flex;align-items:center;justify-content:space-between}';
  h+='.sec-hdr h2{font-size:15px;font-weight:700;letter-spacing:-0.3px;margin:0;border:none;padding:0;color:#fff}';
  h+='.sec-hdr .sub{font-size:9px;color:rgba(255,255,255,0.5);font-weight:400}';
  // Content area
  h+='.content{padding:20px 40px 24px}';
  // KPIs
  h+='.kpi-row{display:flex;gap:12px;margin:14px 0}';
  h+='.kpi-card{flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;position:relative;overflow:hidden}';
  h+='.kpi-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px}';
  h+='.kpi-card .kl{font-size:8px;text-transform:uppercase;letter-spacing:1.2px;color:#64748b;font-weight:700;margin-bottom:6px}';
  h+='.kpi-card .kv{font-size:20px;font-weight:800;letter-spacing:-0.5px}';
  h+='.kpi-card .ks{font-size:9px;color:#94a3b8;margin-top:3px}';
  // Tables
  h+='table{width:100%;border-collapse:collapse;font-size:9.5px;margin:8px 0}';
  h+='th{background:#f1f5f9;color:#334155;font-weight:700;text-align:left;padding:7px 10px;border-bottom:2px solid #e2e8f0;font-size:8.5px;text-transform:uppercase;letter-spacing:0.5px}';
  h+='td{padding:6px 10px;border-bottom:1px solid #f1f5f9}';
  h+='tr:hover td{background:#f8fafc}';
  h+='.tr-total td{background:#f1f5f9!important;font-weight:700;border-top:2px solid #e2e8f0}';
  // Tags
  h+='.tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:8.5px;font-weight:600;margin:1px 2px}';
  h+='.tag-tg{background:#dcfce7;color:#166534}.tag-tb{background:#dbeafe;color:#1e40af}';
  h+='.tag-ta{background:#fef3c7;color:#92400e}.tag-tr{background:#fee2e2;color:#991b1b}';
  // Misc
  h+='.divider{height:1px;background:#e2e8f0;margin:14px 0}';
  h+='.callout{background:#f8fafc;border-left:3px solid #1a3a6b;padding:12px 16px;border-radius:0 6px 6px 0;font-size:10px;line-height:1.7;color:#334155;margin:10px 0}';
  h+='.footer-bar{position:absolute;bottom:0;left:0;right:0;padding:8px 40px;display:flex;justify-content:space-between;font-size:7.5px;color:#94a3b8;border-top:1px solid #f1f5f9}';
  h+='h3{font-size:11.5px;font-weight:700;color:#1e293b;margin:16px 0 8px;padding-left:10px;border-left:3px solid #1a3a6b}';
  h+='@media print{.no-print{display:none!important}}';
  h+='@media screen{.slide{box-shadow:0 4px 24px rgba(0,0,0,0.1);margin:20px auto;border-radius:2px}}';
  h+='</style></head><body>';

  var pageNum=0;
  function pageFooter(){pageNum++;return '<div class="footer-bar"><span>Confidentiel \u2014 '+s.societe+'</span><span>'+s.name+' \u2014 Rapport '+dateStr+'</span><span>'+pageNum+'</span></div>';}

  // ═══ SLIDE 1 : COUVERTURE ═══
  h+='<div class="slide" style="display:flex;flex-direction:column">';
  h+='<div class="top-bar"></div>';
  h+='<div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px">';
  h+='<div style="font-size:10px;text-transform:uppercase;letter-spacing:6px;color:#94a3b8;font-weight:700;margin-bottom:24px">Dossier d\'implantation</div>';
  h+='<div style="font-size:42px;font-weight:800;color:#0f1f3d;letter-spacing:-1.5px;line-height:1.1;margin-bottom:12px">'+s.name+'</div>';
  h+='<div style="font-size:14px;color:#64748b;margin-bottom:6px">'+s.addr+'</div>';
  h+='<div style="width:60px;height:3px;background:linear-gradient(90deg,#1a3a6b,#1D9E75);border-radius:2px;margin:28px auto"></div>';
  h+='<div style="margin-top:28px">';
  h+='<div style="font-size:13px;font-weight:700;color:#1a3a6b">'+s.societe+'</div>';
  h+='<div style="font-size:12px;color:#64748b;margin-top:4px">Ouverture pr\u00e9visionnelle : '+s.ouverture+'</div>';
  h+='</div>';
  // Status pills
  h+='<div style="display:flex;gap:12px;margin-top:36px">';
  h+='<div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:20px;padding:8px 20px;font-size:11px"><span style="color:#64748b">Statut</span> <strong style="color:#1a3a6b">'+s.statut.charAt(0).toUpperCase()+s.statut.slice(1)+'</strong></div>';
  h+='<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:8px 20px;font-size:11px"><span style="color:#64748b">Avancement</span> <strong style="color:#166534">'+stepsDone+'/'+_STS.length+'</strong></div>';
  h+='</div>';
  h+='</div>';
  // Steps grid at bottom
  h+='<div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px">';
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px 16px;font-size:9.5px">';
  _STS.forEach(function(st){
    var done=s.steps&&s.steps[st.id];
    h+='<div style="display:flex;align-items:center;gap:6px;color:'+(done?'#166534':'#cbd5e1')+'">';
    h+='<div style="width:16px;height:16px;border-radius:50%;background:'+(done?'#166534':'#fff')+';border:1.5px solid '+(done?'#166534':'#e2e8f0')+';display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;flex-shrink:0">'+(done?'\u2713':'')+'</div>';
    h+='<span style="font-weight:'+(done?'600':'400')+'">'+st.label+'</span></div>';
  });
  h+='</div></div>';
  h+=pageFooter()+'</div>';

  // ═══ SLIDE 2 : SYNTHESE FINANCIERE ═══
  if(_incl('synthese')){
  h+='<div class="slide"><div class="top-bar"></div>';
  h+='<div class="sec-hdr"><h2>Synth\u00e8se financi\u00e8re</h2><div class="sub">Business Plan \u2014 Projection 3 ans</div></div>';
  h+='<div class="content">';
  // KPI cards
  h+='<div class="kpi-row">';
  [{l:'CA Ann\u00e9e 3',v:fmt(YR[2].ca),c:'#1a3a6b',bc:'#1a3a6b'},{l:'EBITDA Ann\u00e9e 3',v:fmt(YR[2].ebitda),c:'#B8860B',bc:'#B8860B'},{l:'R\u00e9sultat Net A3',v:fmt(YR[2].rnet),c:YR[2].rnet>=0?'#166534':'#dc2626',bc:YR[2].rnet>=0?'#166534':'#dc2626'},{l:'Break-even',v:beMoiLabel,c:'#0F6E56',bc:'#0F6E56'}].forEach(function(k){
    h+='<div class="kpi-card" style="border-top:3px solid '+k.bc+'"><div class="kl">'+k.l+'</div><div class="kv" style="color:'+k.c+'">'+k.v+'</div></div>';
  });
  h+='</div>';
  // Summary table
  h+='<table>';
  h+='<tr><th></th><th style="text-align:right">A1 \u2014 '+YR[0].annee+'</th><th style="text-align:right">A2 \u2014 '+YR[1].annee+'</th><th style="text-align:right">A3 \u2014 '+YR[2].annee+'</th></tr>';
  [{l:'Chiffre d\'affaires',k:'ca',bold:true},{l:'Charges totales',k:'charges'},{l:'EBITDA',k:'ebitda',bold:true},{l:'R\u00e9sultat d\'exploitation',k:'rex'},{l:'R\u00e9sultat net',k:'rnet',bold:true},{l:'CAF',k:'caf'}].forEach(function(row){
    h+='<tr'+(row.bold?' style="background:#f8fafc"':'')+'><td style="font-weight:'+(row.bold?'700':'500')+'">'+row.l+'</td>';
    YR.forEach(function(yr){
      var v=yr[row.k];var color=row.k==='charges'?'#1e293b':(v>=0?'#166534':'#dc2626');
      h+='<td style="text-align:right;font-weight:'+(row.bold?'700':'500')+';color:'+color+'">'+fmt(v)+'</td>';
    });
    h+='</tr>';
  });
  h+='<tr class="tr-total"><td>Marge EBITDA</td>';
  YR.forEach(function(yr){h+='<td style="text-align:right">'+Math.round(yr.ebitda/yr.ca*100)+'%</td>';});
  h+='</tr>';
  h+='<tr class="tr-total"><td>Marge nette</td>';
  YR.forEach(function(yr){h+='<td style="text-align:right">'+Math.round(yr.rnet/yr.ca*100)+'%</td>';});
  h+='</tr></table>';
  // Chart
  h+='<h3>Trajectoire CA & EBITDA</h3>';
  h+='<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-top:6px">';
  h+=svg;
  h+='<div style="display:flex;gap:16px;justify-content:center;margin-top:6px;font-size:8px;color:#64748b">';
  h+='<span><span style="display:inline-block;width:12px;height:2px;background:#1a3a6b;vertical-align:middle;margin-right:4px"></span>CA</span>';
  h+='<span><span style="display:inline-block;width:12px;height:2px;background:#B8860B;vertical-align:middle;margin-right:4px;border-top:1.5px dashed #B8860B;height:0"></span>EBITDA</span>';
  h+='<span><span style="display:inline-block;width:1px;height:10px;background:#0F6E56;vertical-align:middle;margin-right:4px"></span>Break-even</span>';
  h+='</div></div>';
  h+='</div>'+pageFooter()+'</div>';
  }

  // ═══ SLIDE 3 : BP DETAILLE ═══
  if(_incl('bp')){
  h+='<div class="slide"><div class="top-bar"></div>';
  h+='<div class="sec-hdr"><h2>Business Plan d\u00e9taill\u00e9</h2><div class="sub">Charges & Revenus mensuels</div></div>';
  h+='<div class="content">';
  for(var yi=0;yi<3;yi++){
    var rows=yi===0?bp.a1:yi===1?bp.a2:bp.a3;
    h+='<h3>Ann\u00e9e '+(yi+1)+' \u2014 '+(annee0+yi)+'</h3>';
    h+='<table style="font-size:8.5px">';
    h+='<tr><th style="min-width:55px"></th>';
    for(var mi=0;mi<12;mi++){h+='<th style="text-align:right;min-width:34px;font-size:7.5px;padding:5px 4px">'+MOIS[(md+mi)%12]+'</th>';}
    h+='<th style="text-align:right;background:#e8f0fe;font-size:7.5px;padding:5px 6px">TOTAL</th></tr>';
    [{l:'CA',k:'_ca',c:'#166534',bg:'#f0fdf4'},{l:'Charges',k:'_charges',c:'#1e293b',bg:''},{l:'EBITDA',k:'_ebitda',c:'#B8860B',bg:'#fffbeb'},{l:'R\u00e9sultat',k:'_result',c:'#1a3a6b',bg:''}].forEach(function(row){
      var total=rows.reduce(function(s,r){return s+(r[row.k]||0);},0);
      h+='<tr'+(row.bg?' style="background:'+row.bg+'"':'')+'><td style="font-weight:700;color:'+row.c+'">'+row.l+'</td>';
      rows.forEach(function(r){var v=r[row.k]||0;h+='<td style="text-align:right;color:'+(v<0?'#dc2626':row.c)+';font-weight:600;font-size:8px">'+Math.round(v/1000)+'k</td>';});
      h+='<td style="text-align:right;font-weight:700;color:'+row.c+';background:#f1f5f9">'+fmt(total)+'</td></tr>';
    });
    h+='</table>';
    if(yi<2)h+='<div style="height:6px"></div>';
  }
  h+='</div>'+pageFooter()+'</div>';
  }

  // ═══ SLIDE 4 : CAPEX + FINANCEMENT ═══
  if(_incl('capex')){
  h+='<div class="slide"><div class="top-bar"></div>';
  h+='<div class="sec-hdr"><h2>Plan d\'investissement</h2><div class="sub">CAPEX & Structure de financement</div></div>';
  h+='<div class="content">';
  h+='<div class="kpi-row">';
  [{l:'CAPEX',v:fmt(capexTots.capex),c:'#1a3a6b'},{l:'Cr\u00e9dit-bail',v:fmt(capexTots.leasing),c:'#B8860B'},{l:'Total investissement',v:fmt(capexTots.capex+capexTots.leasing),c:'#0f1f3d'}].forEach(function(k){
    h+='<div class="kpi-card" style="border-top:3px solid '+k.c+'"><div class="kl">'+k.l+'</div><div class="kv" style="color:'+k.c+'">'+k.v+'</div></div>';
  });
  h+='</div>';
  h+='<h3>D\u00e9tail par poste</h3>';
  h+='<table><tr><th>Poste</th><th style="text-align:right">Montant</th><th>Source</th></tr>';
  capexDet.forEach(function(line){
    var rem=line.remise;
    h+='<tr><td'+(rem?' style="color:#166534;font-style:italic"':'')+'>'+line.label+'</td>';
    h+='<td style="text-align:right;font-weight:700;color:'+(rem?'#166534':'#1e293b')+'">'+fmt(line.montant)+'</td>';
    h+='<td style="color:#64748b">'+(line.fin||'\u2014')+(line.leasing?' (leasing)':'')+'</td></tr>';
  });
  h+='</table>';
  h+='<h3>Structure de financement</h3>';
  h+='<div style="display:flex;gap:12px;margin:8px 0">';
  var totalInvest=capexTots.capex+capexTots.leasing;
  [{l:'Emprunt bancaire',v:emprunt,c:'#1a3a6b'},{l:'Cr\u00e9dit-bail',v:capexTots.leasing,c:'#B8860B'},{l:'Fonds propres',v:fondsPropres,c:'#166534'}].forEach(function(fi){
    var pct=Math.round(fi.v/totalInvest*100);
    h+='<div style="flex:1;text-align:center">';
    h+='<div style="font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;margin-bottom:6px">'+fi.l+'</div>';
    h+='<div style="font-size:18px;font-weight:800;color:'+fi.c+'">'+fmt(fi.v)+'</div>';
    h+='<div style="margin:6px auto;width:100%;height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:'+fi.c+';border-radius:3px"></div></div>';
    h+='<div style="font-size:10px;font-weight:700;color:'+fi.c+'">'+pct+'%</div>';
    h+='</div>';
  });
  h+='</div>';
  if(deps.length>0){
    h+='<div class="divider"></div>';
    h+='<h3>Suivi des engagements</h3>';
    h+='<div class="kpi-row">';
    h+='<div class="kpi-card" style="border-top:3px solid #1a3a6b"><div class="kl">Engag\u00e9</div><div class="kv" style="color:#1a3a6b">'+fmt(depEngage)+'</div><div class="ks">'+Math.round(depEngage/totalInvest*100)+'% du budget</div></div>';
    h+='<div class="kpi-card" style="border-top:3px solid #166534"><div class="kl">D\u00e9bloqu\u00e9</div><div class="kv" style="color:#166534">'+fmt(depDebloque)+'</div></div>';
    h+='<div class="kpi-card" style="border-top:3px solid #B8860B"><div class="kl">En demande</div><div class="kv" style="color:#B8860B">'+fmt(depDemande)+'</div></div>';
    h+='</div>';
  }
  h+='</div>'+pageFooter()+'</div>';
  }

  // ═══ SLIDE 5 : ADHERENTS ═══
  if(_incl('adherents')){
  h+='<div class="slide"><div class="top-bar"></div>';
  h+='<div class="sec-hdr"><h2>Strat\u00e9gie adh\u00e9rents</h2><div class="sub">Objectifs, progression & simulation</div></div>';
  h+='<div class="content">';
  h+='<div class="kpi-row">';
  var _bpEx=getBPAdherents(sid);[{l:'Cible fin A1',v:_bpEx[11],s:'membres'},{l:'Cible fin A2',v:_bpEx[23],s:'membres'},{l:'Cible fin A3',v:_bpEx[35],s:'membres'}].forEach(function(k){
    h+='<div class="kpi-card" style="border-top:3px solid #1a3a6b"><div class="kl">'+k.l+'</div><div class="kv" style="color:#1a3a6b">'+k.v+'</div><div class="ks">'+k.s+'</div></div>';
  });
  h+='</div>';
  for(var ayi=0;ayi<3;ayi++){
    h+='<h3>Ann\u00e9e '+(ayi+1)+' \u2014 '+(annee0+ayi)+'</h3>';
    h+='<table><tr><th></th>';
    for(var mi=0;mi<12;mi++){h+='<th style="text-align:center;font-size:7.5px;padding:5px 3px">'+MOIS[(md+mi)%12]+'</th>';}
    h+='</tr><tr style="background:#f8fafc"><td style="font-weight:700;color:#64748b;font-size:8px">BP</td>';
    for(var mi=0;mi<12;mi++){h+='<td style="text-align:center;font-size:9px">'+_bpEx[ayi*12+mi]+'</td>';}
    h+='</tr><tr><td style="font-weight:700;color:#166534;font-size:8px">R\u00e9el</td>';
    for(var mi=0;mi<12;mi++){
      var key='y'+(ayi+1)+'_m'+mi;var val=actuelWF[key];
      if(val!==undefined){var delta=val-_bpEx[ayi*12+mi];
        h+='<td style="text-align:center;font-weight:700;color:'+(delta>=0?'#166534':'#dc2626')+';font-size:9px">'+val+'</td>';
      }else{h+='<td style="text-align:center;color:#e2e8f0;font-size:9px">\u2014</td>';}
    }
    h+='</tr></table>';
  }
  h+='<div class="divider"></div>';
  h+='<h3>Configuration tarifaire</h3>';
  h+='<div style="display:flex;gap:12px">';
  [{l:'Pack 4x/sem',p:simCfg.p4,px:simCfg.prix4},{l:'Pack 8x/sem',p:simCfg.p8,px:simCfg.prix8},{l:'Illimit\u00e9',p:simCfg.pi,px:simCfg.prixi}].forEach(function(r){
    h+='<div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center">';
    h+='<div style="font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700">'+r.l+'</div>';
    h+='<div style="font-size:18px;font-weight:800;color:#1a3a6b;margin:4px 0">'+r.p+'%</div>';
    h+='<div style="font-size:10px;color:#64748b">'+Math.round(r.px)+' \u20ac HT/mois</div></div>';
  });
  h+='</div>';
  h+='</div>'+pageFooter()+'</div>';
  }

  // ═══ SLIDE 6 : LOCALISATION ═══
  if(_incl('localisation')&&ld){
    h+='<div class="slide"><div class="top-bar"></div>';
    h+='<div class="sec-hdr"><h2>Analyse de march\u00e9</h2><div class="sub">Localisation, accessibilit\u00e9 & d\u00e9mographie</div></div>';
    h+='<div class="content">';
    h+='<div style="font-size:10px;color:#64748b;margin-bottom:10px">'+s.addr+'</div>';
    if(ld.trafic&&ld.trafic.length){
      h+='<h3>Trafic routier</h3><table><tr><th>Indicateur</th><th style="text-align:right">Valeur</th><th>D\u00e9tail</th></tr>';
      ld.trafic.forEach(function(t){h+='<tr><td>'+t.lbl+'</td><td style="text-align:right;font-weight:700;color:'+t.col+'">'+t.kpi+'</td><td style="color:#64748b;font-size:8.5px">'+t.sub+'</td></tr>';});
      h+='</table>';
    }
    if(ld.transports&&ld.transports.length){
      h+='<h3>Transports en commun</h3><table><tr><th>Ligne</th><th>Arr\u00eat</th><th>D\u00e9tail</th></tr>';
      ld.transports.forEach(function(t){
        var tagH='';if(t.tags)t.tags.forEach(function(tg){tagH+=' <span class="tag tag-'+tg.c+'">'+tg.t+'</span>';});
        h+='<tr><td style="font-weight:600;color:'+t.col+'">'+t.lbl+'</td><td>'+t.kpi+'</td><td style="color:#64748b;font-size:8.5px">'+t.sub+tagH+'</td></tr>';
      });
      h+='</table>';
    }
    if(ld.demo&&ld.demo.length){
      h+='<h3>D\u00e9mographie</h3><table><tr><th>Indicateur</th><th style="text-align:right">Valeur</th><th>D\u00e9tail</th></tr>';
      ld.demo.forEach(function(d){h+='<tr><td>'+d.lbl+'</td><td style="text-align:right;font-weight:700;color:'+d.col+'">'+d.kpi+'</td><td style="color:#64748b;font-size:8.5px">'+d.sub+'</td></tr>';});
      h+='</table>';
    }
    if(ld.comparaison&&ld.comparaison.length){
      h+='<h3>Benchmark concurrentiel</h3><table><tr><th>Crit\u00e8re</th><th style="text-align:center;width:100px">Score</th><th>Analyse</th></tr>';
      ld.comparaison.forEach(function(c){
        h+='<tr><td style="font-weight:600">'+c.lbl+'</td><td style="text-align:center"><div style="display:flex;align-items:center;gap:6px;justify-content:center"><div style="width:50px;height:5px;background:#f1f5f9;border-radius:3px;overflow:hidden"><div style="width:'+c.pct+'%;height:100%;background:'+c.col+'"></div></div><span style="font-size:9px;font-weight:700;color:'+c.col+'">'+c.pct+'</span></div></td><td style="color:#64748b;font-size:8.5px">'+c.note+'</td></tr>';
      });
      h+='</table>';
    }
    if(ld.tags&&ld.tags.length){
      h+='<div style="margin:12px 0">';ld.tags.forEach(function(tg){h+='<span class="tag tag-'+tg.c+'">'+tg.t+'</span> ';});h+='</div>';
    }
    if(ld.synthese){h+='<div class="callout">'+ld.synthese+'</div>';}
    h+='</div>'+pageFooter()+'</div>';
  }

  // Alertes
  if(s.alertes&&s.alertes.length>0){
    h+='<div style="padding:0 40px;margin-top:-20px"><div style="background:#fef3c7;border:1px solid #fde68a;border-radius:6px;padding:10px 14px">';
    h+='<div style="font-size:9px;font-weight:700;color:#92400e;margin-bottom:4px">ALERTES</div>';
    s.alertes.forEach(function(a){h+='<div style="font-size:9.5px;color:#92400e;padding:2px 0">\u26a0 '+_alerteText(a)+'</div>';});
    h+='</div></div>';
  }

  // Print button
  h+='<div class="no-print" style="position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;gap:10px">';
  h+='<button onclick="window.print()" style="background:#0f1f3d;color:#fff;border:none;border-radius:10px;padding:12px 24px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(15,31,61,0.3);display:flex;align-items:center;gap:8px">';
  h+='<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>';
  h+='Enregistrer PDF</button></div>';

  h+='</body></html>';

  // Ouvrir via Blob URL (fix PDF blanc)
  var blob=new Blob([h],{type:'text/html;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  window.open(url,'_blank');
}

// ══════════════════════════════════════════════════════════════════════════════
// ── EXPORT CSV ──────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function exportStudioCSV(sid){
  var s=S.studios[sid];if(!s)return;
  var f=s.forecast||{};
  var md=f.moisDebut||0;
  var annee0=f.annee||2026;
  var opts=getStudioBPOpts(sid);
  var bp=build3YearBP(f,sid,opts);
  var actuelWF=S.adherents&&S.adherents[sid]||{};
  var capexDet=getCapexDetailForStudio(sid);
  var sep=';'; // Excel-friendly separator

  function esc(v){var str=String(v==null?'':v);if(str.indexOf(sep)>=0||str.indexOf('"')>=0||str.indexOf('\n')>=0)return '"'+str.replace(/"/g,'""')+'"';return str;}
  var lines=[];
  function row(){lines.push(Array.prototype.slice.call(arguments).map(esc).join(sep));}

  // ── Synthèse 3 ans ──
  row('=== SYNTHESE FINANCIERE 3 ANS ===');
  row('','Ann\u00e9e 1 ('+annee0+')','Ann\u00e9e 2 ('+(annee0+1)+')','Ann\u00e9e 3 ('+(annee0+2)+')');
  var YR=[bp.a1,bp.a2,bp.a3].map(function(rows){
    return{ca:rows.reduce(function(s,r){return s+r._ca;},0),charges:rows.reduce(function(s,r){return s+r._charges;},0),ebitda:rows.reduce(function(s,r){return s+r._ebitda;},0),rex:rows.reduce(function(s,r){return s+r._rex;},0),rnet:rows.reduce(function(s,r){return s+r._result;},0),caf:rows.reduce(function(s,r){return s+r._caf;},0)};
  });
  [{l:'Chiffre d\'affaires',k:'ca'},{l:'Charges totales',k:'charges'},{l:'EBITDA',k:'ebitda'},{l:'REX',k:'rex'},{l:'R\u00e9sultat net',k:'rnet'},{l:'CAF',k:'caf'}].forEach(function(r){
    row(r.l,Math.round(YR[0][r.k]),Math.round(YR[1][r.k]),Math.round(YR[2][r.k]));
  });
  [{l:'Marge EBITDA',fn:function(yr){return yr.ca>0?Math.round(yr.ebitda/yr.ca*100)+'%':'0%';}},{l:'Marge nette',fn:function(yr){return yr.ca>0?Math.round(yr.rnet/yr.ca*100)+'%':'0%';}}].forEach(function(r){
    row(r.l,r.fn(YR[0]),r.fn(YR[1]),r.fn(YR[2]));
  });

  // ── BP mensuel détaillé ──
  row('');row('=== BP MENSUEL DETAILLE ===');
  [0,1,2].forEach(function(yi){
    var rows=yi===0?bp.a1:yi===1?bp.a2:bp.a3;
    row('');row('Ann\u00e9e '+(yi+1)+' ('+( annee0+yi)+')');
    var hdr=[''];for(var mi=0;mi<12;mi++){hdr.push(MOIS[(md+mi)%12]);}hdr.push('TOTAL');
    row.apply(null,hdr);
    [{l:'CA',k:'_ca'},{l:'Charges',k:'_charges'},{l:'EBITDA',k:'_ebitda'},{l:'R\u00e9sultat',k:'_result'}].forEach(function(r){
      var vals=[r.l];var total=0;
      rows.forEach(function(m){var v=Math.round(m[r.k]||0);vals.push(v);total+=v;});
      vals.push(total);
      row.apply(null,vals);
    });
  });

  // ── Adhérents ──
  row('');row('=== ADHERENTS ===');
  [0,1,2].forEach(function(yi){
    row('');row('Ann\u00e9e '+(yi+1));
    var hdr=[''];for(var mi=0;mi<12;mi++){hdr.push(MOIS[(md+mi)%12]);}
    row.apply(null,hdr);
    var bpRow=['BP'];for(var mi=0;mi<12;mi++){bpRow.push(_bpE[yi*12+mi]);}
    row.apply(null,bpRow);
    var realRow=['R\u00e9el'];for(var mi=0;mi<12;mi++){var key='y'+(yi+1)+'_m'+mi;var val=actuelWF[key];realRow.push(val!==undefined?val:'');}
    row.apply(null,realRow);
  });

  // ── CAPEX ──
  row('');row('=== CAPEX ===');
  row('Poste','Montant','Source');
  capexDet.forEach(function(c){row(c.label,Math.round(c.montant),c.fin||'');});

  // Télécharger
  var csv='\uFEFF'+lines.join('\r\n');
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=(s.name||'studio').replace(/\s+/g,'_')+'_export.csv';
  a.click();
  toast('Export CSV t\u00e9l\u00e9charg\u00e9');
}

// ══════════════════════════════════════════════════════════════════════════════
// ── EXPORT EXCEL (SpreadsheetML XML) ────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function exportStudioExcel(sid){
  var s=S.studios[sid];if(!s)return;
  var f=s.forecast||{};
  var md=f.moisDebut||0;
  var annee0=f.annee||2026;
  var opts=getStudioBPOpts(sid);
  var bp=build3YearBP(f,sid,opts);
  var actuelWF=S.adherents&&S.adherents[sid]||{};
  var capexDet=getCapexDetailForStudio(sid);

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function numCell(v){return '<Cell><Data ss:Type="Number">'+Math.round(v)+'</Data></Cell>';}
  function strCell(v){return '<Cell><Data ss:Type="String">'+esc(v)+'</Data></Cell>';}
  function pctCell(v){return '<Cell><Data ss:Type="String">'+v+'%</Data></Cell>';}

  var xml='<?xml version="1.0" encoding="UTF-8"?>\n';
  xml+='<?mso-application progid="Excel.Sheet"?>\n';
  xml+='<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml+='<Styles><Style ss:ID="hdr"><Font ss:Bold="1"/><Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/></Style>';
  xml+='<Style ss:ID="bold"><Font ss:Bold="1"/></Style>';
  xml+='<Style ss:ID="neg"><Font ss:Bold="1" ss:Color="#DC2626"/></Style></Styles>\n';

  var YR=[bp.a1,bp.a2,bp.a3].map(function(rows){
    return{ca:rows.reduce(function(s,r){return s+r._ca;},0),charges:rows.reduce(function(s,r){return s+r._charges;},0),ebitda:rows.reduce(function(s,r){return s+r._ebitda;},0),rex:rows.reduce(function(s,r){return s+r._rex;},0),rnet:rows.reduce(function(s,r){return s+r._result;},0),caf:rows.reduce(function(s,r){return s+r._caf;},0)};
  });

  // ── Onglet 1 : Synthèse ──
  xml+='<Worksheet ss:Name="Synth\u00e8se"><Table>\n';
  xml+='<Row ss:StyleID="hdr">'+strCell('')+strCell('Ann\u00e9e 1 ('+annee0+')')+strCell('Ann\u00e9e 2 ('+(annee0+1)+')')+strCell('Ann\u00e9e 3 ('+(annee0+2)+')')+'</Row>\n';
  [{l:'Chiffre d\'affaires',k:'ca'},{l:'Charges totales',k:'charges'},{l:'EBITDA',k:'ebitda'},{l:'REX',k:'rex'},{l:'R\u00e9sultat net',k:'rnet'},{l:'CAF',k:'caf'}].forEach(function(r){
    xml+='<Row>'+strCell(r.l)+numCell(YR[0][r.k])+numCell(YR[1][r.k])+numCell(YR[2][r.k])+'</Row>\n';
  });
  xml+='<Row>'+strCell('Marge EBITDA');
  YR.forEach(function(yr){xml+=pctCell(yr.ca>0?Math.round(yr.ebitda/yr.ca*100):0);});
  xml+='</Row>\n';
  xml+='<Row>'+strCell('Marge nette');
  YR.forEach(function(yr){xml+=pctCell(yr.ca>0?Math.round(yr.rnet/yr.ca*100):0);});
  xml+='</Row>\n';
  xml+='</Table></Worksheet>\n';

  // ── Onglet 2 : BP Détaillé ──
  xml+='<Worksheet ss:Name="BP D\u00e9taill\u00e9"><Table>\n';
  [0,1,2].forEach(function(yi){
    var rows=yi===0?bp.a1:yi===1?bp.a2:bp.a3;
    xml+='<Row ss:StyleID="bold">'+strCell('Ann\u00e9e '+(yi+1)+' ('+(annee0+yi)+')');for(var z=0;z<13;z++)xml+=strCell('');xml+='</Row>\n';
    xml+='<Row ss:StyleID="hdr">'+strCell('');
    for(var mi=0;mi<12;mi++){xml+=strCell(MOIS[(md+mi)%12]);}
    xml+=strCell('TOTAL')+'</Row>\n';
    [{l:'CA',k:'_ca'},{l:'Charges',k:'_charges'},{l:'EBITDA',k:'_ebitda'},{l:'R\u00e9sultat',k:'_result'}].forEach(function(r){
      xml+='<Row>'+strCell(r.l);
      var total=0;
      rows.forEach(function(m){var v=Math.round(m[r.k]||0);xml+=numCell(v);total+=v;});
      xml+=numCell(total)+'</Row>\n';
    });
    xml+='<Row></Row>\n'; // empty row separator
  });
  xml+='</Table></Worksheet>\n';

  // ── Onglet 3 : Adhérents ──
  xml+='<Worksheet ss:Name="Adh\u00e9rents"><Table>\n';
  [0,1,2].forEach(function(yi){
    xml+='<Row ss:StyleID="bold">'+strCell('Ann\u00e9e '+(yi+1));for(var z=0;z<12;z++)xml+=strCell('');xml+='</Row>\n';
    xml+='<Row ss:StyleID="hdr">'+strCell('');
    for(var mi=0;mi<12;mi++){xml+=strCell(MOIS[(md+mi)%12]);}
    xml+='</Row>\n';
    xml+='<Row>'+strCell('BP');
    for(var mi=0;mi<12;mi++){xml+=numCell(_bpE[yi*12+mi]);}
    xml+='</Row>\n';
    xml+='<Row>'+strCell('R\u00e9el');
    for(var mi=0;mi<12;mi++){var key='y'+(yi+1)+'_m'+mi;var val=actuelWF[key];xml+=(val!==undefined?numCell(val):strCell('\u2014'));}
    xml+='</Row>\n';
    xml+='<Row></Row>\n';
  });
  xml+='</Table></Worksheet>\n';

  // ── Onglet 4 : CAPEX ──
  xml+='<Worksheet ss:Name="CAPEX"><Table>\n';
  xml+='<Row ss:StyleID="hdr">'+strCell('Poste')+strCell('Montant')+strCell('Source')+'</Row>\n';
  var capexTotal=0;
  capexDet.forEach(function(c){
    xml+='<Row>'+strCell(c.label)+numCell(c.montant)+strCell(c.fin||'\u2014')+'</Row>\n';
    capexTotal+=c.montant;
  });
  xml+='<Row ss:StyleID="bold">'+strCell('TOTAL')+numCell(capexTotal)+strCell('')+'</Row>\n';
  xml+='</Table></Worksheet>\n';

  xml+='</Workbook>';

  var blob=new Blob([xml],{type:'application/vnd.ms-excel;charset=utf-8'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=(s.name||'studio').replace(/\s+/g,'_')+'_export.xls';
  a.click();
  toast('Export Excel t\u00e9l\u00e9charg\u00e9');
}

async function doLogout(){
  _clearInactivityTimers();_removeInactivityWarn();
  unsubscribeNotifications();stopPresenceHeartbeat();
  try{localStorage.removeItem('isseo_hidden_at');}catch(e){}
  await sb.auth.signOut();
  S.user=null;S.profile=null;S.view='auth';S.selectedId=null;S.notifications=[];S.notifOpen=false;
  try{localStorage.removeItem('isseo_nav');}catch(e){}
  render();
}
function openDetail(id){if(!_checkDirtyBeforeNav()){return;}if(hasDirty())discardAllDirty();S.page='projets';S.view='detail';S.selectedId=id;S.detailTab='workflow';S.aiResp='';S.forecastYear=1;S.forecastSection='summary';S.adherentYear=1;saveNavState();render();}
function retourProjets(){if(!_checkDirtyBeforeNav()){return;}if(hasDirty())discardAllDirty();S.view='dashboard';S.selectedId=null;S.page='projets';saveNavState();render();}
function retourAccueil(){retourProjets();}
function setPage(p){if(!_checkDirtyBeforeNav()){return;}if(hasDirty())discardAllDirty();S.page=p;S.view='dashboard';S.selectedId=null;S.sidebarOpen=false;S.mainTab='studios';saveNavState();render();}
function toggleSidebar(){S.sidebarOpen=!S.sidebarOpen;var sb=document.querySelector('.sidebar');var ov=document.getElementById('sidebar-overlay');if(sb)sb.classList.toggle('open',S.sidebarOpen);if(ov)ov.classList.toggle('show',S.sidebarOpen);}
function toggleDarkMode(){S.darkMode=!S.darkMode;try{localStorage.setItem('isseo_darkMode',S.darkMode);}catch(e){}document.body.classList.toggle('dark',S.darkMode);render();}

