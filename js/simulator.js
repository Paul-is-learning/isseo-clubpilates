// ── Animation barres EBITDA au hover par studio ──
var _bpAnimFrames={};
function animBPBars(idx,enter,evt){
  var g=document.getElementById('bp-bg-'+idx);
  if(!g)return;
  var b1=g.querySelector('.bp-b1'),b2=g.querySelector('.bp-b2'),b3=g.querySelector('.bp-b3'),txt=g.querySelector('.bp-total');
  if(!b1||!b2||!b3)return;
  var yBase=220;
  if(_bpAnimFrames[idx]){cancelAnimationFrame(_bpAnimFrames[idx]);_bpAnimFrames[idx]=null;}
  // Hauteurs originales
  var oh1=+b1.getAttribute('data-th'),oh2=+b2.getAttribute('data-th'),oh3=+b3.getAttribute('data-th');
  var oy1=+b1.getAttribute('data-oy'),oy2=+b2.getAttribute('data-oy'),oy3=+b3.getAttribute('data-oy');

  if(enter){
    // Tooltip
    var desc=g.querySelector('desc');
    if(desc){
      var parts=desc.textContent.split('|');
      var tip=document.getElementById('bp-chart-tooltip');
      if(tip&&parts.length>=7){
        tip.innerHTML='<div style="font-weight:700;font-size:13px;margin-bottom:6px">'+parts[0]+'</div>'
          +'<div style="display:flex;gap:16px"><div><span style="color:rgba(255,255,255,0.5)">A1</span> <b style="color:#15956F">'+parts[1]+'</b></div>'
          +'<div><span style="color:rgba(255,255,255,0.5)">A2</span> <b style="color:#2B7BD4">'+parts[2]+'</b></div>'
          +'<div><span style="color:rgba(255,255,255,0.5)">A3</span> <b style="color:#7B5FD6">'+parts[3]+'</b></div></div>'
          +'<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);display:flex;gap:16px">'
          +'<div><span style="color:rgba(255,255,255,0.5)">Total</span> <b>'+parts[4]+'</b></div>'
          +'<div><span style="color:rgba(255,255,255,0.5)">Marge A3</span> <b style="color:'+parts[6]+'">'+parts[5]+'%</b></div></div>';
        tip.style.display='block';
        tip.style.left=(evt.offsetX-80)+'px';
        tip.style.top=(evt.offsetY-120)+'px';
      }
    }
    // Dim other groups
    document.querySelectorAll('.bp-bar-group').forEach(function(el,j){
      el.style.transition='opacity .3s ease';
      el.style.opacity=j===idx?'1':'0.3';
    });
    // Bounce/pulse animation — barres s'étirent puis rebondissent
    var dur=600,start=null;
    var stretch=0.18;// étirement de 18% max
    function elasticOut(t){var p=0.4;return Math.pow(2,-10*t)*Math.sin((t-p/4)*(2*Math.PI)/p)+1;}
    function step(ts){
      if(!start)start=ts;
      var elapsed=ts-start;
      // Stagger : A1=0ms, A2=60ms, A3=120ms
      var bars=[[b1,oh1,oy1,0],[b2,oh2,oy2,60],[b3,oh3,oy3,120]];
      var done=true;
      // Recalculate cumulative y from bottom up
      var cumH=0;
      bars.forEach(function(arr){
        var el=arr[0],origH=arr[1],delay=arr[3];
        var t=Math.min(1,Math.max(0,(elapsed-delay)/dur));
        var e=elasticOut(t);
        // Scale oscillates: 1 → 1+stretch → bounce back to 1
        var scale=1+stretch*(1-e);
        var newH=Math.max(2,Math.round(origH*scale));
        var newY=yBase-cumH-newH;
        el.setAttribute('height',newH);
        el.setAttribute('y',newY);
        cumH+=newH;
        if(t<1)done=false;
      });
      if(txt)txt.setAttribute('y',yBase-cumH-10);
      if(!done){_bpAnimFrames[idx]=requestAnimationFrame(step);}
      else{
        // Snap to exact original positions
        b1.setAttribute('height',Math.max(oh1,2));b1.setAttribute('y',oy1);
        b2.setAttribute('height',Math.max(oh2,2));b2.setAttribute('y',oy2);
        b3.setAttribute('height',Math.max(oh3,2));b3.setAttribute('y',oy3);
        _bpAnimFrames[idx]=null;
      }
    }
    _bpAnimFrames[idx]=requestAnimationFrame(step);
  } else {
    // Hide tooltip
    var tip=document.getElementById('bp-chart-tooltip');if(tip)tip.style.display='none';
    // Restore original positions smoothly
    b1.setAttribute('height',Math.max(oh1,2));b1.setAttribute('y',oy1);
    b2.setAttribute('height',Math.max(oh2,2));b2.setAttribute('y',oy2);
    b3.setAttribute('height',Math.max(oh3,2));b3.setAttribute('y',oy3);
    if(txt)txt.setAttribute('y',oy3-10);
    // Restore all groups opacity
    document.querySelectorAll('.bp-bar-group').forEach(function(el){
      el.style.transition='opacity .3s ease';
      el.style.opacity='1';
    });
  }
}

function ouvrirAlertesModal(){
  var allAlerts=[];
  Object.keys(S.studios).forEach(function(id){
    var s=S.studios[id];if(!s||!s.alertes)return;
    s.alertes.forEach(function(a){allAlerts.push({studioId:id,studioName:s.name,text:_alerteText(a)});});
  });
  var overlay=document.createElement('div');
  overlay.id='alertes-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  var box='<div style="background:#fff;border-radius:16px;padding:0;width:520px;max-width:92vw;max-height:80vh;box-shadow:0 20px 60px rgba(0,0,0,0.2);display:flex;flex-direction:column;overflow:hidden">';
  // Header
  box+='<div style="padding:20px 24px 16px;border-bottom:1px solid #f0f0ea;display:flex;align-items:center;justify-content:space-between">';
  box+='<div style="display:flex;align-items:center;gap:10px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  box+='<div><div style="font-size:16px;font-weight:700;color:#1a1a1a">Alertes en cours</div>';
  box+='<div style="font-size:11px;color:#888;margin-top:1px">'+allAlerts.length+' alerte'+(allAlerts.length>1?'s':'')+' sur l\u0027ensemble des studios</div></div></div>';
  box+='<button onclick="document.getElementById(\'alertes-modal\').remove()" style="background:none;border:none;font-size:22px;color:#999;cursor:pointer;padding:0;line-height:1">&times;</button>';
  box+='</div>';
  // Body
  box+='<div style="padding:8px 0;overflow-y:auto;flex:1">';
  if(!allAlerts.length){
    box+='<div style="text-align:center;color:#bbb;padding:30px;font-size:13px">Aucune alerte en cours</div>';
  } else {
    // Grouper par studio
    var grouped={};
    allAlerts.forEach(function(a){if(!grouped[a.studioId])grouped[a.studioId]={name:a.studioName,alerts:[]};grouped[a.studioId].alerts.push(a.text);});
    Object.keys(grouped).forEach(function(sid){
      var g=grouped[sid];
      box+='<div style="padding:10px 24px;border-bottom:1px solid #f8f8f4">';
      box+='<div style="font-size:12px;font-weight:700;color:#1a3a6b;margin-bottom:6px;display:flex;align-items:center;gap:6px">';
      box+='<span style="width:8px;height:8px;border-radius:50%;background:#1a3a6b;display:inline-block"></span>';
      box+=g.name;
      box+='<span style="font-size:9px;color:#888;font-weight:400">'+g.alerts.length+' alerte'+(g.alerts.length>1?'s':'')+'</span>';
      box+='</div>';
      g.alerts.forEach(function(a){
        box+='<div onclick="document.getElementById(\'alertes-modal\').remove();openDetail(\''+sid+'\');setTimeout(function(){setDetailTab(\'alertes\')},50)" style="display:flex;align-items:center;gap:8px;padding:6px 0 6px 14px;cursor:pointer;border-radius:6px;transition:background .1s;margin:2px 0" onmouseenter="this.style.background=S.darkMode?\'#2d0d0d\':\'#fef6f6\'" onmouseleave="this.style.background=\'transparent\'">';
        box+='<div style="width:5px;height:5px;border-radius:50%;background:#DC2626;flex-shrink:0"></div>';
        box+='<span style="font-size:12px;color:#854F0B;font-weight:500">'+a+'</span>';
        box+='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" style="margin-left:auto;flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>';
        box+='</div>';
      });
      box+='</div>';
    });
  }
  box+='</div></div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
}
function setMainTab(t){S.mainTab=t;saveNavState();render();}
var _msgPollInterval=null;

function setDetailTab(t){
  if(!_checkDirtyBeforeNav()){return;}if(hasDirty())discardAllDirty();
  S.detailTab=t;S.aiResp='';S.editMoisIdx=null;saveNavState();
  // Arrêter le polling précédent
  if(_msgPollInterval){clearInterval(_msgPollInterval);_msgPollInterval=null;}
  // Démarrer le polling si on est sur l'onglet messages
  if(t==='echanges'){S.openTopicId=null;}
  if(t==='echanges'&&S.selectedId){
    rechargerMessages(S.selectedId);
    _msgPollInterval=setInterval(function(){
      if(S.detailTab==='echanges'&&S.selectedId){rechargerMessages(S.selectedId);}
      else{clearInterval(_msgPollInterval);_msgPollInterval=null;}
    },8000); // toutes les 8 secondes
  }
  render();
}
function setFS(s){S.forecastSection=s;S.editMoisIdx=null;render();}
function setForecastYear(y){S.forecastYear=y;S.editMoisIdx=null;render();}
function setAdherentYear(y){S.adherentYear=y;render();}
function toggleNewForm(){S.showNewForm=!S.showNewForm;S.newForm={societe:'P&W Occitanie',annualCA:CA_A1,moisDebut:0,annee:2026};render();}
function setNF(k,v){S.newForm[k]=v;if(k==='loyerMensuel')render();}
function setEV(k,v){S.editVals[k]=v;}
function openEditMois(idx){
  if(isViewer())return;
  S.editMoisIdx=idx;
  var fc=S.studios[S.selectedId].forecast;
  var ak=S.forecastYear===1?'actuel':S.forecastYear===2?'actuel2':'actuel3';
  S.editVals=Object.assign({},fc[ak]&&fc[ak][idx]||{});
  render();
}
function cancelEdit(){S.editMoisIdx=null;render();}

async function toggleStep(sid,stepId){
  if(isViewer())return;
  var s=S.studios[sid];
  var ns=Object.assign({},s.steps);
  ns[stepId]=!s.steps[stepId];
  var newStatut=inferStatut(ns,sid);
  var oldStatut=s.statut;
  await saveStudio(sid,Object.assign({},s,{steps:ns,statut:newStatut}));
  // Notification si changement de statut
  var stepObj=getStudioSteps(sid).find(function(st){return st.id===stepId;});
  var stepLabel=stepObj?stepObj.label:stepId;
  notifyAll({type:'statut',studio_id:sid,title:(ns[stepId]?'\u2705':'\u274c')+' '+stepLabel+' \u2014 '+(s.name||sid),body:oldStatut!==newStatut?'Statut : '+oldStatut+' \u2192 '+newStatut:'\u00c9tape mise \u00e0 jour'});
  toast('Etape mise a jour');
}

function ajouterEtape(sid){
  if(isViewer())return;
  var overlay=document.createElement('div');
  overlay.id='step-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  var box='<div style="background:#fff;border-radius:14px;padding:24px 28px;width:420px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.18)">';
  box+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px"><span style="font-size:16px">+</span><span style="font-size:15px;font-weight:700;color:#1a1a1a">Nouvelle \u00e9tape</span></div>';
  box+='<label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:4px">Nom de l\u0027\u00e9tape <span style="color:#A32D2D">*</span></label>';
  box+='<input id="step-label" placeholder="Ex: Recrutement \u00e9quipe" style="width:100%;padding:10px 12px;border:1px solid #dde;border-radius:8px;font-size:13px;outline:none;font-family:inherit;box-sizing:border-box;margin-bottom:10px">';
  box+='<label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:4px">Description</label>';
  box+='<input id="step-desc" placeholder="D\u00e9tails optionnels\u2026" style="width:100%;padding:10px 12px;border:1px solid #dde;border-radius:8px;font-size:13px;outline:none;font-family:inherit;box-sizing:border-box">';
  box+='<div id="step-err" style="font-size:11px;color:#A32D2D;margin-top:4px;min-height:16px"></div>';
  box+='<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">';
  box+='<button onclick="document.getElementById(\'step-modal\').remove()" style="padding:8px 16px;border:1px solid #dde;border-radius:8px;background:#fff;color:#555;font-size:12px;font-weight:600;cursor:pointer">Annuler</button>';
  box+='<button onclick="_confirmerEtape(\''+sid+'\')" style="padding:8px 16px;background:#1D9E75;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">Ajouter</button>';
  box+='</div></div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
  setTimeout(function(){var el=document.getElementById('step-label');if(el)el.focus();},100);
}

async function _confirmerEtape(sid){
  var label=(document.getElementById('step-label')||{}).value||'';
  if(!label.trim()){
    var err=document.getElementById('step-err');
    if(err)err.textContent='Le nom de l\u0027\u00e9tape est obligatoire.';
    return;
  }
  var desc=(document.getElementById('step-desc')||{}).value||'';
  var s=S.studios[sid];
  ensureCustomSteps(sid);
  var newStep={id:'step_'+Date.now(),label:label.trim(),desc:desc.trim()};
  s.customSteps.push(newStep);
  if(!s.steps)s.steps={};
  s.steps[newStep.id]=false;
  s.statut=inferStatut(s.steps,sid);
  await saveStudio(sid,s);
  var modal=document.getElementById('step-modal');
  if(modal)modal.remove();
  toast('\u00c9tape ajout\u00e9e : '+newStep.label);
}

async function supprimerEtape(sid,stepId){
  if(isViewer())return;
  if(!confirm('Supprimer cette \u00e9tape ?'))return;
  var s=S.studios[sid];
  ensureCustomSteps(sid);
  s.customSteps=s.customSteps.filter(function(st){return st.id!==stepId;});
  if(s.steps)delete s.steps[stepId];
  s.statut=inferStatut(s.steps||{},sid);
  await saveStudio(sid,s);
  toast('\u00c9tape supprim\u00e9e');
}

async function saveMois(){
  if(isViewer())return;
  var s=S.studios[S.selectedId];
  var fc=s.forecast;
  var ak=S.forecastYear===1?'actuel':S.forecastYear===2?'actuel2':'actuel3';
  var newAk=Object.assign({},fc[ak]||{});
  newAk[S.editMoisIdx]=Object.assign({},S.editVals);
  var newFc=Object.assign({},fc);newFc[ak]=newAk;
  await saveStudio(S.selectedId,Object.assign({},s,{forecast:newFc}));
  S.editMoisIdx=null;toast('Saisie enregistree');
}

async function clearMois(){
  var s=S.studios[S.selectedId];
  var fc=s.forecast;
  var ak=S.forecastYear===1?'actuel':S.forecastYear===2?'actuel2':'actuel3';
  var newAk=Object.assign({},fc[ak]||{});
  delete newAk[S.editMoisIdx];
  var newFc=Object.assign({},fc);newFc[ak]=newAk;
  await saveStudio(S.selectedId,Object.assign({},s,{forecast:newFc}));
  S.editMoisIdx=null;toast('Mois efface');
}

async function saisirAdherent(sid,year,moisIdx,val){
  if(isViewer())return;
  if(_isScenarioLocked(sid))return;
  if(!S.adherents[sid])S.adherents[sid]={};
  var key='y'+year+'_m'+moisIdx;
  if(val===''||val===null){delete S.adherents[sid][key];}
  else{S.adherents[sid][key]=num(val);}
  await saveAdherents(sid);
  render();
}

function saisirAdherentLive(sid,year,moisIdx,val){
  if(isViewer())return;
  if(_isScenarioLocked(sid)){toast('Activez le mode scénario pour modifier les adhérents.','warn');return;}
  // Mise a jour état immédiate
  if(!S.adherents[sid])S.adherents[sid]={};
  var key='y'+year+'_m'+moisIdx;
  if(val===''||val===null){delete S.adherents[sid][key];}
  else{S.adherents[sid][key]=num(val);}

  // Redessine uniquement le SVG du graphique (sans toucher aux inputs)
  var s=S.studios[sid];
  var ay=year;
  var moisDebut=s.forecast&&s.forecast.moisDebut||0;
  var annee=(s.forecast&&s.forecast.annee||2026)+(ay-1);
  var offset=(ay-1)*12;
  var bpArr=[];
  for(var i=0;i<12;i++){
    var idx=offset+i;
    var _bpS=getBPAdherents(sid);bpArr.push(idx<_bpS.length?_bpS[idx]:400);
  }
  var actuel=S.adherents[sid]||{};
  var realArr=[];
  for(var i=0;i<12;i++){
    var k='y'+ay+'_m'+i;
    realArr.push(actuel[k]!=null?num(actuel[k]):null);
  }
  var moisLabels=[];
  for(var i=0;i<12;i++){moisLabels.push(MOIS[(moisDebut+i)%12]);}

  // Mise à jour ecart diff sous l'input courant
  var bp=bpArr[moisIdx];
  var rVal=val!==''&&val!==null?num(val):null;
  var diffEl=document.getElementById('adh-diff-'+moisIdx);
  if(diffEl){
    if(rVal!==null){
      var diff=Math.round(rVal-bp);
      diffEl.textContent=(diff>=0?'+':'')+diff;
      diffEl.style.color=diff>=0?'#3B6D11':'#A32D2D';
    } else {
      diffEl.textContent='';
    }
  }

  // Mise à jour KPI membres réels
  var lastReal=null,nbReal=0;
  for(var i=0;i<realArr.length;i++){if(realArr[i]!==null){lastReal=realArr[i];nbReal=i+1;}}
  var ecart=lastReal!==null&&nbReal>0?Math.round(lastReal-bpArr[nbReal-1]):null;
  var kpiEl=document.getElementById('kpi-adh-real');
  if(kpiEl)kpiEl.textContent=lastReal!==null?lastReal+'':'--';
  var kpiEcEl=document.getElementById('kpi-adh-ecart');
  if(kpiEcEl){
    kpiEcEl.textContent=ecart!==null?(ecart>=0?'+':'')+ecart:'--';
    kpiEcEl.style.color=ecart!==null?(ecart>=0?'#3B6D11':'#A32D2D'):'#888';
  }

  // Redessine le SVG inline
  var svgWrap=document.getElementById('adh-chart-wrap');
  if(svgWrap){
    svgWrap.innerHTML=buildAdherentSVG(moisLabels,bpArr,realArr,annee);
  }

  // Mise à jour simulateur CA en live
  _refreshSimCA(sid,ay);

  // Marquer dirty au lieu de sauvegarder automatiquement
  markDirty('adherents',sid);
}

async function uploadFichier(sid,input){
  if(isViewer())return;
  var files=Array.from(input.files);if(!files.length)return;
  var prog=document.getElementById('uprog-'+sid);if(prog)prog.style.display='block';
  var ex=await sb.from('studios').select('data').eq('id',sid+'_files').maybeSingle();
  var cur=(ex.data&&ex.data.data&&ex.data.data.files)||S.files[sid]||[];
  cur=cur.slice();var added=0;
  for(var i=0;i<files.length;i++){
    var file=files[i];
    var path=sid+'/'+Date.now()+'_'+cleanName(file.name);
    var ur=await sb.storage.from('studio-files').upload(path,file,{upsert:true});
    if(!ur.error){
      var pu=sb.storage.from('studio-files').getPublicUrl(path);
      var size=file.size>1024*1024?(file.size/1024/1024).toFixed(1)+' Mo':(file.size/1024).toFixed(0)+' Ko';
      cur.push({name:file.name,path:path,url:pu.data.publicUrl,date:new Date().toLocaleDateString('fr-FR'),size:size});
      added++;
    }
  }
  await sb.from('studios').upsert({id:sid+'_files',data:{files:cur},updated_at:new Date().toISOString()});
  S.files[sid]=cur;if(prog)prog.style.display='none';
  toast(added+' fichier(s) ajoute(s)');
  if(added>0)notifyAll({type:'document',studio_id:sid,title:'Document ajout\u00e9 \u2014 '+(S.studios[sid]?S.studios[sid].name:sid),body:added+' fichier(s) : '+files.map(function(f){return f.name;}).join(', ')});
  render();
}

async function deleteFichier(sid,path){
  if(isViewer())return;
  if(!confirm('Supprimer ?'))return;
  await sb.storage.from('studio-files').remove([path]);
  S.files[sid]=(S.files[sid]||[]).filter(function(f){return f.path!==path;});
  await sb.from('studios').upsert({id:sid+'_files',data:{files:S.files[sid]},updated_at:new Date().toISOString()});
  toast('Supprime');render();
}

async function archiverStudio(id){
  if(!isSuperAdmin()){toast('Action réservée aux administrateurs principaux.');return;}
  if(!confirm('Archiver ce projet ?'))return;
  await saveStudio(id,Object.assign({},S.studios[id],{statut:'abandonne'}));toast('Archive');
}
async function restaurerStudio(id){
  if(!isSuperAdmin()){toast('Action réservée aux administrateurs principaux.');return;}
  var s=S.studios[id];await saveStudio(id,Object.assign({},s,{statut:inferStatut(s.steps,id)}));toast('Restaure');
}
async function supprimerStudio(id){
  if(!isSuperAdmin()){toast('Action réservée aux administrateurs principaux.');return;}
  if(!confirm('Supprimer définitivement ce projet ? Cette action est irréversible.'))return;
  await sb.from('studios').delete().eq('id',id);
  delete S.studios[id];S.view='dashboard';S.selectedId=null;render();toast('Supprime');
}
async function createStudio(){
  var f=S.newForm;
  if(!f.name||!f.addr||!f.ouverture){toast('Remplissez tous les champs');return;}
  var id='proj_'+Date.now();
  var steps={};STEPS.forEach(function(s){steps[s.id]=false;});
  var ca1=num(f.annualCA,CA_A1);
  var lm=num(f.loyerMensuel,4800);
  await saveStudio(id,{
    name:f.name,addr:f.addr,societe:f.societe||'P&W Occitanie',ouverture:f.ouverture,
    statut:'pipeline',capex:306200,emprunt:214340,alertes:['Nouveau projet'],cohorte:num(f.cohorte,1),steps:steps,
    loyer_mensuel:lm,
    forecast:{annualCA:ca1,annualCA2:Math.round(ca1*1.10),annualCA3:Math.round(ca1*1.21),
      moisDebut:num(f.moisDebut,0),annee:num(f.annee||2026),actuel:{},actuel2:{},actuel3:{}}
  });
  S.showNewForm=false;toast('Studio cree');
}

async function askAI(){
  var q=document.getElementById('aiq');if(!q||!q.value.trim())return;
  S.aiLoading=true;S.aiResp='';render();
  var s=S.studios[S.selectedId];
  var cfg=S.simConfig[S.selectedId]||{};
  var capex=s.capex||333500;
  var emprunt=s.emprunt||230000;
  var leasing=s.leasing||121600;
  var rembtAn=Math.round(emprunt/7);        // remboursement capital/an (7 ans)
  var leasingAn=Math.round(leasing/60*12);  // mensualités leasing annualisées (5 ans)
  var _aiSid=S.selectedId;
  var _aiRef=getStudioResultats(_aiSid);
  var r1=_aiRef[1],r2=_aiRef[2],r3=_aiRef[3];
  var c1=getStudioCharges(_aiSid,1),c2=getStudioCharges(_aiSid,2),c3=getStudioCharges(_aiSid,3);
  var ebitda1=Math.round(r1.rex+c1.amort);
  var ebitda2=Math.round(r2.rex+c2.amort);
  var ebitda3=Math.round(r3.rex+c3.amort);
  // Construction du contexte P&L complet
  var ctx='=== CONTEXTE FINANCIER CLUB PILATES — '+s.name.toUpperCase()+' ===\n';
  ctx+='Société : '+s.societe+' | Ouverture : '+s.ouverture+'\n\n';
  ctx+='--- STRUCTURE INVESTISSEMENT (montants UNIQUES, non récurrents) ---\n';
  ctx+='CAPEX total (investissement initial unique) : '+capex+'€\n';
  ctx+='  dont Emprunt bancaire (remboursé sur 7 ans) : '+emprunt+'€ → '+rembtAn+'€/an en capital\n';
  ctx+='  dont Leasing équipement Pilates (60 mois) : '+leasing+'€ → '+leasingAn+'€/an en mensualités\n';
  ctx+='  dont Fonds propres : '+(capex-emprunt)+'€\n\n';
  ctx+='--- COMPTE DE RÉSULTAT BP ANNUEL (chiffres EXACTS du plan financier) ---\n';
  ctx+='                          A1          A2          A3\n';
  ctx+='CA total (HT)        : '+r1.ca+'€    '+r2.ca+'€    '+r3.ca+'€\n';
  ctx+='Charges opé totales  : '+r1.charges+'€  '+r2.charges+'€  '+r3.charges+'€\n';
  ctx+='  dont Coachs/Salaires: '+c1.coachs+'€     '+c2.coachs+'€     '+c3.coachs+'€\n';
  ctx+='  dont Loyer          : '+c1.loyer+'€      '+c2.loyer+'€      '+c3.loyer+'€\n';
  ctx+='  dont Royalties (9%) : '+Math.round(r1.ca*0.09)+'€      '+Math.round(r2.ca*0.09)+'€      '+Math.round(r3.ca*0.09)+'€\n';
  ctx+='  dont Amortissements : '+c1.amort+'€      '+c2.amort+'€      '+c3.amort+'€\n';
  ctx+='  dont Charges fin.   : '+c1.charges_fin+'€       '+c2.charges_fin+'€       '+c3.charges_fin+'€\n';
  ctx+='EBITDA               : '+ebitda1+'€      '+ebitda2+'€     '+ebitda3+'€\n';
  ctx+='REX (résultat exploit): '+r1.rex+'€      '+r2.rex+'€     '+r3.rex+'€\n';
  ctx+='Résultat net         : '+r1.rnet+'€      '+r2.rnet+'€     '+r3.rnet+'€\n';
  ctx+='CAF                  : '+r1.caf+'€      '+r2.caf+'€     '+r3.caf+'€\n';
  ctx+='Tréso (après rembt)  : '+r1.treso+'€      '+r2.treso+'€     '+r3.treso+'€\n\n';
  // ── Données adhérents & simulateur en temps réel ──────────────────────────
  ctx+='--- ADHÉRENTS & PRICING (SIMULATEUR EN DIRECT) ---\n';
  ctx+='Configuration pricing simulateur :\n';
  ctx+='  Pack4 ('+Math.round(cfg.p4||47)+'% des membres) : '+(cfg.prix4||110)+'€ HT/mois\n';
  ctx+='  Pack8 ('+Math.round(cfg.p8||50)+'% des membres) : '+(cfg.prix8||193.33)+'€ HT/mois\n';
  ctx+='  Illimité ('+Math.round(cfg.pi||3)+'% des membres) : '+(cfg.prixi||276.67)+'€ HT/mois\n\n';
  // Adhérents réels saisis vs BP
  var actuel=S.adherents[S.selectedId]||{};
  var md=s.forecast&&s.forecast.moisDebut||0;
  ctx+='Adhérents par mois (BP cible vs réel saisi) :\n';
  var hasReal=false;
  [1,2,3].forEach(function(ay){
    var offset=(ay-1)*12;
    var bpMois=[],realMois=[],simCaMois=[];
    for(var m=0;m<12;m++){
      var _bpSm=getBPAdherents(sid);var bpM=_bpSm[offset+m]||0;
      var key='y'+ay+'_m'+m;
      var reel=actuel[key]!==undefined?actuel[key]:null;
      var membres=reel!==null?reel:bpM;
      bpMois.push(bpM);
      realMois.push(reel);
      simCaMois.push(computeSimCA(membres,cfg,ay));
      if(reel!==null)hasReal=true;
    }
    var simCaAn=simCaMois.reduce(function(s,v){return s+v;},0);
    var simRows=buildBP(simCaAn,md,null,_aiSid,getStudioBPOpts(_aiSid));
    var simEbitda=simRows.reduce(function(s,r){return s+(r._ebitda||0);},0);
    var simRex=simRows.reduce(function(s,r){return s+(r._rex||0);},0);
    var simRnet=simRows.reduce(function(s,r){return s+(r._result||0);},0);
    var reelFin=realMois[11]!==null?realMois[11]+'(réel)':bpMois[11]+'(BP)';
    ctx+='  A'+ay+' — Adhérents fin année : '+reelFin+' | CA simulé : '+simCaAn+'€ | EBITDA simulé : '+simEbitda+'€ | REX simulé : '+simRex+'€ | RN simulé : '+simRnet+'€\n';
    // Mois avec saisie réelle
    var reelsSaisis=[];
    for(var m=0;m<12;m++){if(realMois[m]!==null)reelsSaisis.push('M'+(m+1)+':'+realMois[m]);}
    if(reelsSaisis.length>0)ctx+='    Saisies réelles A'+ay+' : '+reelsSaisis.join(', ')+'\n';
  });
  if(!hasReal)ctx+='(Aucun adhérent réel saisi encore — projections basées sur BP)\n';
  ctx+='\n';
  try{
    // Récupérer le vrai token JWT de session
    var sessRes=await sb.auth.getSession();
    var jwt=(sessRes.data&&sessRes.data.session&&sessRes.data.session.access_token)||'';
    var ANON_JWT='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmcXRwY3VqdWpxeGdmc2dicHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTc4NjQsImV4cCI6MjA5MDE3Mzg2NH0.nxIQe-02Nts6xDD4SVJY67XnxbsESd27mZj7i3Re4I8';
    var token=jwt||ANON_JWT;
    var r=await fetch(SURL+'/functions/v1/ask-ai',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'apikey':ANON_JWT,
        'Authorization':'Bearer '+token
      },
      body:JSON.stringify({question:q.value.trim(),context:ctx})
    });
    var d=await r.json();
    if(d.error)S.aiResp='⚠️ '+d.error;
    else S.aiResp=d.text||'Pas de réponse.';
  }catch(e){S.aiResp='❌ Erreur : '+e.message;}
  S.aiLoading=false;render();
}

// ── Simulateur CA prévisionnel ────────────────────────────────────────────────
// ARPU total BP par année = CA total / sum(membres.mois)
// Ces valeurs incluent cours + boutique et sont les seules références cohérentes
var SIM_ARPU_TOTAL_BP={
  1: Math.round(448800/2693*100)/100,   // 166.65
  2: Math.round(610190/3854*100)/100,   // 158.33
  3: Math.round(761841/4484*100)/100,   // 169.90
};

// CA BP mensuel de référence = directement issu du dossier (somme = CA annuel exact)
// computeBPCA : membres × ARPU_total_BP
function computeBPCA(membres,ay){
  return Math.round(membres*(SIM_ARPU_TOTAL_BP[ay]||SIM_ARPU_TOTAL_BP[1]));
}

// Prix BP de référence (dossier officiel)
var SIM_PRIX_REF={prix4:110,prix8:193.33,prixi:276.67};

// ARPU packs seuls au défaut BP (sans boutique/privés) = 0.47×110 + 0.50×193.33 + 0.03×276.67
var _BP_PACK_ARPU_DEF=0.47*110+0.50*193.33+0.03*276.67; // ≈ 156.665

// Facteur boutique par année : garantit que CA_sim = CA_BP quand prix = prix BP défaut
// À défauts (47/50/3, 110/193.33/276.67) → CA_sim = CA_BP exactement
var SIM_BOUTIQUE_FACTOR={
  1:SIM_ARPU_TOTAL_BP[1]/_BP_PACK_ARPU_DEF,   // ≈ 1.0638
  2:SIM_ARPU_TOTAL_BP[2]/_BP_PACK_ARPU_DEF,   // ≈ 1.0106
  3:SIM_ARPU_TOTAL_BP[3]/_BP_PACK_ARPU_DEF,   // ≈ 1.0845
};

function computeSimARPU(cfg){
  var p4=num(cfg.p4,47)/100, p8=num(cfg.p8,50)/100, pi=num(cfg.pi,3)/100;
  return p4*num(cfg.prix4,SIM_PRIX_REF.prix4) + p8*num(cfg.prix8,SIM_PRIX_REF.prix8) + pi*num(cfg.prixi,SIM_PRIX_REF.prixi);
}

// CA simulé mensuel = membres × ARPU_packs × facteur_boutique(année)
// Cohérence garantie : au défaut BP, CA_sim = CA_BP exact
function computeSimCA(membres,cfg,ay){
  var f=SIM_BOUTIQUE_FACTOR[ay]||SIM_BOUTIQUE_FACTOR[1];
  return Math.round(membres*computeSimARPU(cfg)*f);
}

// ── Étape 2 : Répartition des forfaits ──
function renderStepRepartition(sid,ay,cfg){
  var p4=num(cfg.p4,47),p8=num(cfg.p8,50),pi=num(cfg.pi,3);
  var total=p4+p8+pi;
  var h='<div class="box" style="border-left:4px solid #1D9E75;margin-bottom:12px">';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">';
  h+='<div style="width:28px;height:28px;border-radius:50%;background:#1D9E75;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">2</div>';
  h+='<div>';
  h+='<div style="font-weight:700;font-size:14px;color:#1a1a1a">\u00c9tape 2 — R\u00e9partition des forfaits</div>';
  h+='<div style="font-size:11px;color:#888;margin-top:2px">Quel mix d\'abonnements pr\u00e9voyez-vous ?</div>';
  h+='</div></div>';
  h+='<div style="background:#f0faf5;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#0F6E56;line-height:1.55">';
  h+='<b>💡 Astuce</b> D\u00e9placez les curseurs pour ajuster la r\u00e9partition entre Pack 4, Pack 8 et Illimit\u00e9. Le total doit faire 100%. Les valeurs BP de r\u00e9f\u00e9rence sont 47% / 50% / 3%.';
  h+='</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:6px">';
  var packs=[
    {id:'p4',label:'Pack 4 s\u00e9ances',color:'#5b7fa6',val:p4},
    {id:'p8',label:'Pack 8 s\u00e9ances',color:'#1D9E75',val:p8},
    {id:'pi',label:'Illimit\u00e9',color:'#854F0B',val:pi},
  ];
  packs.forEach(function(pk){
    h+='<div>';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
    h+='<span style="font-size:12px;font-weight:500;color:'+pk.color+'">'+pk.label+'</span>';
    h+='<span id="sim-lbl-'+pk.id+'" style="font-size:13px;font-weight:700;color:'+pk.color+'">'+pk.val+'%</span>';
    h+='</div>';
    h+='<input type="range" min="0" max="100" value="'+pk.val+'" id="sim-rng-'+pk.id+'" oninput="updateSimRep(\''+sid+'\',\''+pk.id+'\',this.value,'+ay+')" style="width:100%;accent-color:'+pk.color+'"/>';
    h+='</div>';
  });
  h+='</div>';
  h+='<div style="display:flex;height:8px;border-radius:6px;overflow:hidden;margin-bottom:4px">';
  h+='<div id="sim-bar-p4" style="width:'+Math.round(p4/total*100)+'%;background:#5b7fa6;transition:width 0.2s"></div>';
  h+='<div id="sim-bar-p8" style="width:'+Math.round(p8/total*100)+'%;background:#1D9E75;transition:width 0.2s"></div>';
  h+='<div id="sim-bar-pi" style="flex:1;background:#854F0B;transition:width 0.2s"></div>';
  h+='</div>';
  h+='<div id="sim-warn" style="font-size:11px;color:#A32D2D;margin-bottom:4px;min-height:16px">'+(total!==100?'⚠️ Total = '+total+'% (doit \u00eatre 100%)':'✅ Total = 100%')+'</div>';
  h+='</div>';
  return h;
}

// ── Étape 3 : Prix des abonnements ──
function renderStepPrix(sid,ay,cfg){
  var h='<div class="box" style="border-left:4px solid #854F0B;margin-bottom:12px">';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">';
  h+='<div style="width:28px;height:28px;border-radius:50%;background:#854F0B;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">3</div>';
  h+='<div>';
  h+='<div style="font-weight:700;font-size:14px;color:#1a1a1a">\u00c9tape 3 — Prix des abonnements</div>';
  h+='<div style="font-size:11px;color:#888;margin-top:2px">Ajustez vos tarifs HT mensuels</div>';
  h+='</div></div>';
  h+='<div style="background:#fef9e7;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#854F0B;line-height:1.55">';
  h+='<b>💡 Conseil</b> Modifiez les prix pour simuler l\'impact sur votre CA. Les prix BP de r\u00e9f\u00e9rence sont : Pack 4 = 110 €, Pack 8 = 193,33 €, Illimit\u00e9 = 276,67 €.';
  h+='</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:8px">';
  var prixCfg=[
    {id:'prix4',label:'Pack 4',ref:110,color:'#5b7fa6',val:num(cfg.prix4,110)},
    {id:'prix8',label:'Pack 8',ref:193.33,color:'#1D9E75',val:num(cfg.prix8,193.33)},
    {id:'prixi',label:'Illimit\u00e9',ref:276.67,color:'#854F0B',val:num(cfg.prixi,276.67)},
  ];
  var _seances={prix4:4,prix8:8,prixi:null};
  prixCfg.forEach(function(px){
    var delta=Math.round((px.val-px.ref)/px.ref*100);
    var ttc=(Math.round(px.val*1.20*100)/100).toFixed(2).replace('.',',');
    var nb=_seances[px.id];
    var unitTTC=nb?( (Math.round(px.val*1.20/nb*100)/100).toFixed(2).replace('.',',') ):null;
    h+='<div>';
    h+='<div style="font-size:11px;color:#888;margin-bottom:4px">'+px.label+' <span style="font-size:10px;color:#aaa">(BP: '+px.ref+' €)</span></div>';
    h+='<div style="display:flex;align-items:center;gap:6px">';
    h+='<input type="number" value="'+px.val+'" step="0.5" id="sim-'+px.id+'" oninput="updateSimPrix(\''+sid+'\',\''+px.id+'\',this.value,'+ay+')" style="width:100%;padding:6px 8px;border:0.5px solid #ddd;border-radius:7px;font-size:13px;font-weight:600;color:'+px.color+';outline:none"/>';
    h+='</div>';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-top:3px">';
    h+='<div id="sim-delta-'+px.id+'" style="font-size:10px;color:'+(delta>=0?'#3B6D11':'#A32D2D')+';font-weight:600">'+(delta!==0?(delta>0?'+':'')+delta+'% vs BP':'= BP')+'</div>';
    if(unitTTC){h+='<div id="sim-unit-'+px.id+'" style="font-size:10px;color:#94a3b8;text-align:right">soit <b style="color:#555">'+unitTTC+'&nbsp;€</b> TTC/s\u00e9ance</div>';}
    h+='</div>';
    h+='<div style="text-align:right;margin-top:1px">';
    h+='<div id="sim-ttc-'+px.id+'" style="font-size:10px;color:#64748b;font-weight:500">→ <b>'+ttc+'&nbsp;€</b> TTC/mois</div>';
    h+='</div>';
    h+='</div>';
  });
  h+='</div></div>';
  return h;
}

// ── Résultats simulateur (toujours visible) ──
function renderSimResults(sid,ay,bpArr,realArr,cfg){
  var membres=bpArr.map(function(bp,i){return realArr[i]!==null?realArr[i]:bp;});
  var caArr=membres.map(function(m){return computeSimCA(m,cfg,ay);});
  var caAnnuel=caArr.reduce(function(s,v){return s+v;},0);
  var caBPAnnuel=bpArr.map(function(m){return computeBPCA(m,ay);}).reduce(function(s,v){return s+v;},0);
  var md=(S.studios[sid]&&S.studios[sid].forecast&&S.studios[sid].forecast.moisDebut)||0;
  var _bpOpts=getStudioBPOpts(sid);
  var _caRef=ay===1?CA_A1:ay===2?CA_A2:CA_A3;
  // EBITDA simulé = basé sur le CA simulé (pas le CA BP de référence)
  var simBPRows=buildBPFromDossier(caAnnuel,md,ay,sid,_bpOpts);
  var ebitdaSim=simBPRows.reduce(function(s,r){return s+(r._ebitda||0);},0);
  var cashnetSim=simBPRows.reduce(function(s,r){return s+(r._cashnet||0);},0);
  // EBITDA BP de référence
  var refBPRows=buildBPFromDossier(_caRef,md,ay,sid,_bpOpts);
  var ebitdaBP=refBPRows.reduce(function(s,r){return s+(r._ebitda||0);},0);
  var ebitdaMargin=caAnnuel>0?Math.round(ebitdaSim/caAnnuel*100):0;
  var ebitdaEcart=ebitdaSim-ebitdaBP;
  var caMoyMensuel=Math.round(caAnnuel/12);
  var ecartCA=caAnnuel-caBPAnnuel;
  var lastMembres=membres[membres.length-1];

  var h='<div class="box" id="sim-ca-box" style="margin-top:4px">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>';
  h+='<div style="font-weight:700;font-size:14px;color:#1a3a6b">R\u00e9sultats pr\u00e9visionnels — Ann\u00e9e '+ay+'</div>';
  h+='</div>';
  h+='<div style="background:#f5f5f0;border-radius:10px;padding:14px 16px">';
  h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px">';
  h+='<div><div style="font-size:11px;color:#888;margin-bottom:3px">CA annuel simul\u00e9</div><div id="sim-ca-annuel" style="font-size:18px;font-weight:700;color:#1a1a1a">'+fmt(caAnnuel)+'</div></div>';
  h+='<div><div style="font-size:11px;color:#888;margin-bottom:3px">CA moyen/mois</div><div id="sim-ca-moy" style="font-size:15px;font-weight:600;color:#185FA5">'+fmt(caMoyMensuel)+'</div></div>';
  h+='<div><div style="font-size:11px;color:#888;margin-bottom:3px">\u00c9cart CA vs BP</div>';
  h+='<div id="sim-ca-ecart" style="font-size:15px;font-weight:600;color:'+(ecartCA>=0?'#3B6D11':'#A32D2D')+'">'+(ecartCA>=0?'+':'')+fmt(ecartCA)+'</div></div>';
  h+='<div><div style="font-size:11px;color:#888;margin-bottom:3px">ARPU moyen/mois</div>';
  h+='<div id="sim-arpu" style="font-size:15px;font-weight:600;color:#854F0B">'+(lastMembres>0?fmt(Math.round(computeSimCA(lastMembres,cfg,ay)/lastMembres)):'--')+'</div></div>';
  h+='<div style="border-top:0.5px solid #e0e0d8;grid-column:1/-1;margin:4px 0 -4px"></div>';
  h+='<div><div style="font-size:11px;color:#888;margin-bottom:3px">EBITDA simul\u00e9</div>';
  h+='<div id="sim-ebitda" style="font-size:18px;font-weight:700;color:'+(ebitdaSim>=0?'#854F0B':'#A32D2D')+'">'+fmt(ebitdaSim)+'</div></div>';
  h+='<div><div style="font-size:11px;color:#888;margin-bottom:3px">Marge EBITDA</div>';
  h+='<div id="sim-ebitda-margin" style="font-size:15px;font-weight:600;color:'+(ebitdaMargin>=20?'#3B6D11':ebitdaMargin>=0?'#854F0B':'#A32D2D')+'">'+ebitdaMargin+'%</div></div>';
  h+='<div><div style="font-size:11px;color:#888;margin-bottom:3px">\u00c9cart EBITDA vs BP</div>';
  h+='<div id="sim-ebitda-ecart" style="font-size:15px;font-weight:600;color:'+(ebitdaEcart>=0?'#3B6D11':'#A32D2D')+'">'+(ebitdaEcart>=0?'+':'')+fmt(ebitdaEcart)+'</div></div>';
  h+='<div><div style="font-size:11px;color:#888;margin-bottom:3px">EBITDA BP ref.</div>';
  h+='<div style="font-size:15px;font-weight:600;color:#888">'+fmt(ebitdaBP)+'</div></div>';
  h+='<div style="border-top:0.5px solid #e0e0d8;grid-column:1/-1;margin:4px 0 -4px"></div>';
  h+='<div><div style="font-size:11px;color:#1a3a6b;font-weight:600;margin-bottom:3px">Cash net disponible</div>';
  h+='<div id="sim-cashnet" style="font-size:18px;font-weight:700;color:'+(cashnetSim>=0?'#1a3a6b':'#A32D2D')+'">'+fmt(cashnetSim)+'</div>';
  h+='<div style="font-size:10px;color:#888;margin-top:2px">EBITDA − int\u00e9r\u00eats − rembt. capital − IS</div></div>';
  h+='</div>';
  h+='<div id="sim-comment-zone" style="transition:opacity 0.4s">'+buildSimCommentHTML(sid,cfg,_bpOpts)+'</div>';
  h+='<div style="margin-top:14px">'+buildSimCAChart(caArr,membres,realArr)+'</div>';
  h+='</div>';
  h+='</div>';
  return h;
}

// Legacy wrapper — kept for compatibility
function renderSimCA(sid,ay,bpArr,realArr,cfg){
  return renderStepRepartition(sid,ay,cfg)+renderStepPrix(sid,ay,cfg)+renderSimResults(sid,ay,bpArr,realArr,cfg);
}

// ── Génération HTML des commentaires hypothèses vs BP ─────────────────────────
function buildSimCommentHTML(sid,cfg,bpOpts){
  var h='';
  var _hyp=[];
  var _CAPEX_REF=333500,_LEASING_REF=121600,_EMPRUNT_REF=230000,_TAUX_REF=3.73,_LM_REF=4800;
  var _bpO=bpOpts||{};
  if(_bpO.lm&&Math.round(_bpO.lm)!==_LM_REF){
    var _dlm=_bpO.lm-_LM_REF,_dlmpct=Math.round(_dlm/_LM_REF*100);
    _hyp.push({icon:'🏠',text:'Loyer mensuel <b>'+fmt(_bpO.lm)+'/mois</b> (BP&nbsp;: '+fmt(_LM_REF)+') — '+(_dlm>0?'+':'')+fmt(_dlm)+'/mois ('+(_dlmpct>0?'+':'')+_dlmpct+'%)'});
  }
  if(_bpO.capex&&Math.round(_bpO.capex)!==_CAPEX_REF){
    var _dcp=_bpO.capex-_CAPEX_REF,_dcpct=Math.round(_dcp/_CAPEX_REF*100);
    _hyp.push({icon:'🏗️',text:'CAPEX <b>'+fmt(_bpO.capex)+'</b> (BP&nbsp;: '+fmt(_CAPEX_REF)+') — '+(_dcp>0?'+':'')+fmt(_dcp)+' ('+(_dcpct>0?'+':'')+_dcpct+'%) → amortissements ajustés'});
  }
  if(_bpO.leasing&&Math.round(_bpO.leasing)!==_LEASING_REF){
    var _dls=_bpO.leasing-_LEASING_REF,_dlspct=Math.round(_dls/_LEASING_REF*100);
    _hyp.push({icon:'📦',text:'Leasing <b>'+fmt(_bpO.leasing)+'</b> (BP&nbsp;: '+fmt(_LEASING_REF)+') — crédit-bail '+(_dlspct>0?'+':'')+_dlspct+'%'});
  }
  if(_bpO.emprunt&&Math.round(_bpO.emprunt)!==_EMPRUNT_REF){
    var _dem=_bpO.emprunt-_EMPRUNT_REF,_dempct=Math.round(_dem/_EMPRUNT_REF*100);
    _hyp.push({icon:'🏦',text:'Emprunt <b>'+fmt(_bpO.emprunt)+'</b> (BP&nbsp;: '+fmt(_EMPRUNT_REF)+') — '+(_dempct>0?'+':'')+_dempct+'% → charges fin. ajustées'});
  }
  var _tsRaw=S.studios[sid]&&S.studios[sid].tauxInteret!=null?S.studios[sid].tauxInteret:null;
  var _ts=(_tsRaw!=null&&_tsRaw>=0.01)?_tsRaw:null; // ignorer valeurs corrompues (<1%)
  if(_ts!=null&&Math.abs(_ts-_TAUX_REF/100)>0.0001){
    var _tp=Math.round(_ts*10000)/100,_dt=_tp-_TAUX_REF;
    _hyp.push({icon:'📈',text:'Taux d\'intérêt <b>'+_tp+'%</b> (BP&nbsp;: '+_TAUX_REF+'%) — '+(_dt>0?'+':'')+_dt.toFixed(2)+'pts → charges financières ajustées'});
  }
  var _c=cfg||{};
  var _p4=num(_c.p4,47),_p8=num(_c.p8,50),_pi=num(_c.pi,3);
  if(_p4!==47||_p8!==50||_pi!==3)
    _hyp.push({icon:'👥',text:'Répartition <b>'+_p4+'% Pack4 / '+_p8+'% Pack8 / '+_pi+'% Illimité</b> (BP : 47/50/3)'});
  var _px4=num(_c.prix4,110),_px8=num(_c.prix8,193.33),_pxi=num(_c.prixi,276.67);
  var _pl=[];
  if(Math.abs(_px4-110)>0.5)_pl.push('Pack4 <b>'+_px4+'€</b> vs 110€ ('+((_px4-110)>0?'+':'')+Math.round((_px4-110)/110*100)+'%)');
  if(Math.abs(_px8-193.33)>0.5)_pl.push('Pack8 <b>'+_px8+'€</b> vs 193€ ('+((_px8-193.33)>0?'+':'')+Math.round((_px8-193.33)/193.33*100)+'%)');
  if(Math.abs(_pxi-276.67)>0.5)_pl.push('Illimité <b>'+_pxi+'€</b> vs 277€ ('+((_pxi-276.67)>0?'+':'')+Math.round((_pxi-276.67)/276.67*100)+'%)');
  if(_pl.length>0)_hyp.push({icon:'💶',text:'Prix ajustés — '+_pl.join(' &nbsp;|&nbsp; ')});
  if(_hyp.length>0){
    h+='<div style="background:#f8f9fb;border:0.5px solid #d8dde8;border-radius:10px;padding:12px 14px;margin-top:12px">';
    h+='<div style="font-size:10px;font-weight:700;color:#1a3a6b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">🔍 Hypothèses modifiées vs Business Plan</div>';
    _hyp.forEach(function(n){
      h+='<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;padding-bottom:6px;border-bottom:0.5px solid #eef0f5">';
      h+='<span style="font-size:13px;flex-shrink:0;margin-top:1px">'+n.icon+'</span>';
      h+='<div style="font-size:10.5px;color:#444;line-height:1.45">'+n.text+'</div>';
      h+='</div>';
    });
    h+='<div style="font-size:9.5px;color:#94a3b8;margin-top:2px">Ces variations expliquent l\'écart vs BP de référence.</div>';
    h+='</div>';
  } else {
    h+='<div style="background:#f0faf5;border:0.5px solid #b7e0d2;border-radius:10px;padding:10px 14px;margin-top:12px;display:flex;align-items:center;gap:8px">';
    h+='<span style="font-size:14px">✅</span>';
    h+='<div style="font-size:10.5px;color:#0F6E56;font-weight:600">Toutes les hypothèses sont conformes au Business Plan de référence.</div>';
    h+='</div>';
  }
  return h;
}
// Debounce commentaires : 5s après la dernière modif simulateur
var _commentTimeout={};
function _scheduleSimComment(sid,ay){
  // Placeholder immédiat
  var cz=document.getElementById('sim-comment-zone');
  if(cz){
    cz.style.opacity='0.35';
    cz.innerHTML='<div style="background:#f8f9fb;border:0.5px solid #e0e4ed;border-radius:10px;padding:10px 14px;margin-top:12px;display:flex;align-items:center;gap:10px">'
      +'<span style="font-size:16px">⏳</span>'
      +'<div style="font-size:10.5px;color:#94a3b8">Analyse en cours… affichage dans quelques secondes.</div>'
      +'</div>';
    cz.style.opacity='1';
  }
  if(_commentTimeout[sid])clearTimeout(_commentTimeout[sid]);
  _commentTimeout[sid]=setTimeout(function(){
    var cz2=document.getElementById('sim-comment-zone');
    if(!cz2)return;
    var cfg=S.simConfig[sid]||{p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67};
    var bpOpts=getStudioBPOpts(sid);
    cz2.style.opacity='0';
    setTimeout(function(){
      cz2.innerHTML=buildSimCommentHTML(sid,cfg,bpOpts);
      cz2.style.opacity='1';
    },200);
  },5000);
}

function buildSimCAChart(caArr,membres,realArr){
  var W=620,H=100,PL=52,PR=10,PT=10,PB=20;
  var cW=W-PL-PR,cH=H-PT-PB;
  var maxCA=Math.max.apply(null,caArr)*1.15||1;
  function xp(i){return PL+i*(cW/(caArr.length-1));}
  function yp(v){return PT+cH-(v/maxCA)*cH;}
  var h='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block" id="sim-chart-svg">';
  // Grid
  for(var g=0;g<=3;g++){
    var gv=Math.round(maxCA*g/3);
    var gy=yp(gv);
    h+='<line x1="'+PL+'" y1="'+gy+'" x2="'+(W-PR)+'" y2="'+gy+'" stroke="#e0e0d8" stroke-width="1"/>';
    h+='<text x="'+(PL-4)+'" y="'+(gy+3)+'" text-anchor="end" font-size="8" fill="#bbb">'+fmt(gv)+'</text>';
  }
  // Area fill
  var area='M'+xp(0)+' '+yp(0);
  caArr.forEach(function(v,i){area+=' L'+xp(i)+' '+yp(v);});
  area+=' L'+xp(caArr.length-1)+' '+yp(0)+' Z';
  h+='<path d="'+area+'" fill="#1D9E75" opacity="0.10"/>';
  // Ligne CA
  var line='M';
  caArr.forEach(function(v,i){line+=(i>0?' L':'')+xp(i)+' '+yp(v);});
  h+='<path d="'+line+'" fill="none" stroke="#1D9E75" stroke-width="2"/>';
  // Points : vert foncé si réel saisi, vert clair si BP
  caArr.forEach(function(v,i){
    var isReal=realArr[i]!==null;
    h+='<circle cx="'+xp(i)+'" cy="'+yp(v)+'" r="3.5" fill="'+(isReal?'#0F6E56':'#1D9E75')+'" opacity="'+(isReal?1:0.5)+'"/>';
    h+='<text x="'+xp(i)+'" y="'+(yp(v)-6)+'" text-anchor="middle" font-size="7.5" fill="#0F6E56" font-weight="600">'+fmt(v)+'</text>';
  });
  h+='</svg>';
  h+='<div style="font-size:10px;color:#888;margin-top:3px">Points fonces = mois avec adherents reels saisis &middot; Points clairs = projection BP</div>';
  return h;
}

function _isBPDefault(sid){return (S.activeScenarioId[sid]||'bp_default')==='bp_default';}
function _isScenarioLocked(sid){return _isBPDefault(sid)&&!S.scenarioEditMode[sid];}
function toggleScenarioEditMode(sid){
  S.scenarioEditMode[sid]=!S.scenarioEditMode[sid];
  if(S.scenarioEditMode[sid]&&!S.simConfig[sid]){
    S.simConfig[sid]={p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67};
  }
  render();
}
function nouveauScenario(sid){
  // Créer un nouveau scénario vierge (valeurs BP par défaut) sans toucher aux existants
  S.simConfig[sid]={p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67};
  S.adherents[sid]={};
  S.activeScenarioId[sid]='bp_default';
  S.scenarioEditMode[sid]=true;
  toast('Nouveau scénario — configurez vos hypothèses');
  render();
}
function updateSimRep(sid,field,val,ay){
  if(_isScenarioLocked(sid)){toast('Activez le mode scénario pour modifier','warn');return;}
  if(!S.simConfig[sid])S.simConfig[sid]={p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67};
  S.simConfig[sid][field]=num(val);
  var lbl=document.getElementById('sim-lbl-'+field);
  if(lbl)lbl.textContent=Math.round(num(val))+'%';
  markDirty('sim',sid);
  _refreshSimCA(sid,ay);
}

function updateSimPrix(sid,field,val,ay){
  if(_isScenarioLocked(sid)){toast('Activez le mode scénario pour modifier','warn');return;}
  if(!S.simConfig[sid])S.simConfig[sid]={p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67};
  S.simConfig[sid][field]=num(val);
  markDirty('sim',sid);
  // Mettre à jour delta vs BP
  var refs={prix4:110,prix8:193.33,prixi:276.67};
  var ref=refs[field];
  var delta=ref?Math.round((num(val)-ref)/ref*100):0;
  var el=document.getElementById('sim-delta-'+field);
  if(el){
    el.textContent=delta!==0?(delta>0?'+':'')+delta+'% vs BP':'= BP';
    el.style.color=delta>=0?'#3B6D11':'#A32D2D';
  }
  // Mise à jour TTC + coût unitaire live
  var _v=num(val);
  var elTtc=document.getElementById('sim-ttc-'+field);
  if(elTtc){elTtc.innerHTML='→ <b>'+(Math.round(_v*1.20*100)/100).toFixed(2).replace('.',',')+'&nbsp;€</b> TTC';}
  var _nbSeances={prix4:4,prix8:8};
  var elUnit=document.getElementById('sim-unit-'+field);
  if(elUnit&&_nbSeances[field]){
    elUnit.innerHTML='soit <b style="color:#555">'+(Math.round(_v*1.20/_nbSeances[field]*100)/100).toFixed(2).replace('.',',')+'&nbsp;€</b> TTC/séance';
  }
  _refreshSimCA(sid,ay);
}

function _refreshSimCA(sid,ay){
  var cfg=S.simConfig[sid]||{p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67};
  var p4=num(cfg.p4,47),p8=num(cfg.p8,50),pi=num(cfg.pi,3);
  var total=p4+p8+pi;

  // Barre de répartition
  var bp4=document.getElementById('sim-bar-p4');
  var bp8=document.getElementById('sim-bar-p8');
  if(bp4)bp4.style.width=Math.round(p4/total*100)+'%';
  if(bp8)bp8.style.width=Math.round(p8/total*100)+'%';

  // Avertissement total != 100
  var warn=document.getElementById('sim-warn');
  if(warn)warn.textContent=total!==100?'Total = '+total+'% (doit etre 100%)':'';

  // Recalculer CA
  var s=S.studios[sid];
  var moisDebut=s.forecast&&s.forecast.moisDebut||0;
  var offset=(ay-1)*12;
  var bpArr=[];
  for(var i=0;i<12;i++){
    var idx=offset+i;
    var _bpS=getBPAdherents(sid);bpArr.push(idx<_bpS.length?_bpS[idx]:400);
  }
  var actuel=S.adherents[sid]||{};
  var realArr=[];
  for(var i=0;i<12;i++){
    var k='y'+ay+'_m'+i;
    realArr.push(actuel[k]!=null?num(actuel[k]):null);
  }
  var membres=bpArr.map(function(bp,i){return realArr[i]!==null?realArr[i]:bp;});
  var caArr=membres.map(function(m){return computeSimCA(m,cfg,ay);});
  var caAnnuel=caArr.reduce(function(s,v){return s+v;},0);
  var caMensuelRef=ay===1?CA_MENSUEL_A1:ay===2?CA_MENSUEL_A2:CA_MENSUEL_A3;
  var caBPAnnuel=caMensuelRef.reduce(function(s,v){return s+v;},0);

  // Mise à jour DOM résultats
  var elCA=document.getElementById('sim-ca-annuel');
  var elMoy=document.getElementById('sim-ca-moy');
  var elEcart=document.getElementById('sim-ca-ecart');
  var elARPU=document.getElementById('sim-arpu');
  if(elCA)elCA.textContent=fmt(caAnnuel);
  if(elMoy)elMoy.textContent=fmt(Math.round(caAnnuel/12));
  var ecartCA=caAnnuel-caBPAnnuel;
  if(elEcart){elEcart.textContent=(ecartCA>=0?'+':'')+fmt(ecartCA);elEcart.style.color=ecartCA>=0?'#3B6D11':'#A32D2D';}
  var lastM=membres[membres.length-1];
  if(elARPU)elARPU.textContent=lastM>0?fmt(Math.round(computeSimCA(lastM,cfg,ay)/lastM)):'--';
  // Mise à jour EBITDA / Cash net en live — basé sur le CA simulé
  var _liveSid=S.selectedId;
  var _liveOpts=getStudioBPOpts(_liveSid);
  var _caRefLive=ay===1?CA_A1:ay===2?CA_A2:CA_A3;
  // EBITDA simulé = CA simulé
  var simBPRowsLive=buildBPFromDossier(caAnnuel,moisDebut,ay,_liveSid,_liveOpts);
  var ebitdaSimLive=simBPRowsLive.reduce(function(s,r){return s+(r._ebitda||0);},0);
  var cashnetSimLive=simBPRowsLive.reduce(function(s,r){return s+(r._cashnet||0);},0);
  // EBITDA BP ref
  var refBPRowsLive=buildBPFromDossier(_caRefLive,moisDebut,ay,_liveSid,_liveOpts);
  var ebitdaBPLive=refBPRowsLive.reduce(function(s,r){return s+(r._ebitda||0);},0);
  var ebitdaMarginLive=caAnnuel>0?Math.round(ebitdaSimLive/caAnnuel*100):0;
  var ebitdaEcartLive=ebitdaSimLive-ebitdaBPLive;
  var elEb=document.getElementById('sim-ebitda');
  var elEbM=document.getElementById('sim-ebitda-margin');
  var elEbE=document.getElementById('sim-ebitda-ecart');
  var elCN=document.getElementById('sim-cashnet');
  if(elEb){elEb.textContent=fmt(ebitdaSimLive);elEb.style.color=ebitdaSimLive>=0?'#854F0B':'#A32D2D';}
  if(elEbM){elEbM.textContent=ebitdaMarginLive+'%';elEbM.style.color=ebitdaMarginLive>=20?'#3B6D11':ebitdaMarginLive>=0?'#854F0B':'#A32D2D';}
  if(elEbE){elEbE.textContent=(ebitdaEcartLive>=0?'+':'')+fmt(ebitdaEcartLive);elEbE.style.color=ebitdaEcartLive>=0?'#3B6D11':'#A32D2D';}
  if(elCN){elCN.textContent=fmt(cashnetSimLive);elCN.style.color=cashnetSimLive>=0?'#1a3a6b':'#A32D2D';}

  // Redessine graphique CA simulé
  var chartWrap=document.getElementById('sim-chart-svg');
  if(chartWrap&&chartWrap.parentNode){
    chartWrap.parentNode.innerHTML=buildSimCAChart(caArr,membres,realArr);
  }
  // Commentaires : placeholder immédiat → contenu réel après 5s
  _scheduleSimComment(sid,ay);
}

