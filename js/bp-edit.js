// ═══════════════════════════════════════════════════════════════════════════
// BP EDIT — Overrides par studio, recalcul IS/EBITDA/CAF, flow d'approbation Paul
// ═══════════════════════════════════════════════════════════════════════════
// Modèle :
//   s.bpOverrides = { y1: { <line_id>: {<monthIdx>: value, ...}, ... }, y2:..., y3:... }
//   s.bpMeta      = { createdBy, createdAt, lastModifiedBy, lastModifiedAt, auditLog:[] }
//   s.bpProposals = [ {id, by, at, year, line, month, value, status:'pending'|'approved'|'rejected'} ]
//
// Règle d'approbation :
//   - Superadmin (Paul/Tom) : modifications directes → bpOverrides
//   - Autres utilisateurs   : propositions (status pending) → bpProposals
//     Paul les approuve/rejette ; approbation merge vers bpOverrides.
//
// IS (impôt sociétés) toujours recalculé côté annuel :
//   RCAI = CA - charges_expl - charges_fin
//   IS = max(0, 15% × min(42500, RCAI) + 25% × max(0, RCAI-42500))
// ═══════════════════════════════════════════════════════════════════════════

// ── Applique les overrides sur un tableau annuel + recalcule les dérivés ────
function applyBPOverridesToYear(yearArr, overrides){
  if(!yearArr||!yearArr.length)return yearArr;
  overrides=overrides||{};
  // 1) Injecter les overrides (sauf IS — auto-calculé)
  Object.keys(overrides).forEach(function(lineId){
    if(lineId==='is')return;
    var byMonth=overrides[lineId]||{};
    Object.keys(byMonth).forEach(function(mIdx){
      var val=+byMonth[mIdx];
      var i=+mIdx;
      if(!isNaN(val)&&yearArr[i])yearArr[i][lineId]=Math.round(val);
    });
  });
  // 2) Recalculer IS annuel depuis les totaux
  var annualCA=yearArr.reduce(function(s,r){return s+((r.ca_cours||0)+(r.ca_prives||0)+(r.ca_boutique||0));},0);
  var sumCharge=function(id){return yearArr.reduce(function(s,r){return s+(r[id]||0);},0);};
  var totalChargesHorsFinIS=CHARGES.filter(function(l){return l.id!=='is'&&l.id!=='charges_fin';})
    .reduce(function(s,l){return s+sumCharge(l.id);},0);
  var annualChargesFin=sumCharge('charges_fin');
  var rexAnnuel=annualCA-totalChargesHorsFinIS;
  var rcaiAnnuel=rexAnnuel-annualChargesFin;
  var isAnnuel=rcaiAnnuel<=0?0:Math.round(Math.min(rcaiAnnuel,42500)*0.15+Math.max(0,rcaiAnnuel-42500)*0.25);
  var isMensuel=Math.round(isAnnuel/12);
  // 3) Réinjecter IS + recalculer les totaux mensuels
  yearArr.forEach(function(r){
    r.is=isMensuel;
    r._ca=(r.ca_cours||0)+(r.ca_prives||0)+(r.ca_boutique||0);
    r._charges=CHARGES.reduce(function(s,l){return s+(r[l.id]||0);},0);
    var chargesHorsFinIS=CHARGES.filter(function(l){return l.id!=='charges_fin'&&l.id!=='is';})
      .reduce(function(s,l){return s+(r[l.id]||0);},0);
    r._rex=r._ca-chargesHorsFinIS;
    r._result=r._ca-r._charges;
    r._ebitda=r._rex+(r.amort||0);
    r._caf=r._result+(r.amort||0);
    r._cashnet=r._caf-(r._rembt||0);
  });
  return yearArr;
}

// ── Wrapper autour de build3YearBP qui applique les overrides du studio ────
function build3YearBPWithOverrides(fc,sid,opts){
  var base=build3YearBP(fc,sid,opts);
  var s=S.studios[sid];
  var ov=(s&&s.bpOverrides)||{};
  applyBPOverridesToYear(base.a1,ov.y1);
  applyBPOverridesToYear(base.a2,ov.y2);
  applyBPOverridesToYear(base.a3,ov.y3);
  return base;
}

// ── Handler édition cellule BP ──────────────────────────────────────────────
async function onEditBP(sid,lineId,monthIdx,year,value){
  var s=S.studios[sid];
  if(!s){toast('Studio introuvable');return;}
  if(isViewer()){toast('Lecture seule');return;}
  var num=+value;
  if(isNaN(num)){toast('Valeur invalide');return;}
  num=Math.round(num);
  var who=(S.profile&&S.profile.nom)||(S.user&&S.user.email)||'Utilisateur';
  var nowIso=new Date().toISOString();
  var isPaul=isSuperAdmin();

  // Non-superadmin : demander confirmation puis stocker comme proposition
  if(!isPaul){
    var ok=confirm('Cette modification du BP initial doit être validée par Paul (superadmin).\n\n'
      +'Votre proposition sera envoyée pour approbation.\n\n'
      +'Continuer ?');
    if(!ok){render();return;}
    var proposals=(s.bpProposals||[]).slice();
    proposals.push({id:'p_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      by:who,at:nowIso,year:year,line:lineId,month:monthIdx,value:num,status:'pending'});
    var meta1=Object.assign({createdBy:'Paul',createdAt:nowIso},s.bpMeta||{});
    meta1.lastModifiedBy=who;meta1.lastModifiedAt=nowIso;
    await saveStudio(sid,Object.assign({},s,{bpProposals:proposals,bpMeta:meta1}));
    if(typeof notifyAll==='function'){
      notifyAll({type:'bp_proposal',studio_id:sid,
        title:'Proposition BP — '+(s.name||sid),
        body:who+' propose : '+lineId+' · Y'+year+' · mois '+monthIdx+' = '+fmt(num)+'€'});
    }
    toast('Proposition envoyée à Paul pour validation');
    return;
  }

  // Superadmin : application directe
  var ov=JSON.parse(JSON.stringify(s.bpOverrides||{}));
  var yKey='y'+year;
  ov[yKey]=ov[yKey]||{};
  ov[yKey][lineId]=ov[yKey][lineId]||{};
  ov[yKey][lineId][monthIdx]=num;
  var meta=Object.assign({createdBy:s.bpMeta&&s.bpMeta.createdBy||'Paul',createdAt:s.bpMeta&&s.bpMeta.createdAt||nowIso},s.bpMeta||{});
  meta.lastModifiedBy=who;meta.lastModifiedAt=nowIso;
  meta.auditLog=(meta.auditLog||[]).slice(-49); // garde les 49 derniers
  meta.auditLog.push({by:who,at:nowIso,year:year,line:lineId,month:monthIdx,value:num});
  await saveStudio(sid,Object.assign({},s,{bpOverrides:ov,bpMeta:meta}));
  toast('BP mis à jour');
}

// ── Approbation / rejet d'une proposition (Paul uniquement) ─────────────────
async function approveBPProposal(sid,propId){
  if(!isSuperAdmin()){toast('Réservé à Paul');return;}
  var s=S.studios[sid];if(!s)return;
  var proposals=(s.bpProposals||[]).slice();
  var p=proposals.filter(function(x){return x.id===propId;})[0];
  if(!p||p.status!=='pending')return;
  // Merger dans bpOverrides
  var ov=JSON.parse(JSON.stringify(s.bpOverrides||{}));
  var yKey='y'+p.year;
  ov[yKey]=ov[yKey]||{};
  ov[yKey][p.line]=ov[yKey][p.line]||{};
  ov[yKey][p.line][p.month]=p.value;
  p.status='approved';p.approvedBy=(S.profile&&S.profile.nom)||'Paul';p.approvedAt=new Date().toISOString();
  var meta=Object.assign({},s.bpMeta||{});
  meta.lastModifiedBy=p.approvedBy;meta.lastModifiedAt=p.approvedAt;
  meta.auditLog=(meta.auditLog||[]).slice(-49);
  meta.auditLog.push({by:p.approvedBy,at:p.approvedAt,year:p.year,line:p.line,month:p.month,value:p.value,approvedFrom:p.by});
  await saveStudio(sid,Object.assign({},s,{bpOverrides:ov,bpProposals:proposals,bpMeta:meta}));
  toast('Proposition de '+p.by+' approuvée');
}

async function rejectBPProposal(sid,propId){
  if(!isSuperAdmin()){toast('Réservé à Paul');return;}
  var s=S.studios[sid];if(!s)return;
  var proposals=(s.bpProposals||[]).slice();
  var p=proposals.filter(function(x){return x.id===propId;})[0];
  if(!p||p.status!=='pending')return;
  p.status='rejected';p.rejectedBy=(S.profile&&S.profile.nom)||'Paul';p.rejectedAt=new Date().toISOString();
  await saveStudio(sid,Object.assign({},s,{bpProposals:proposals}));
  toast('Proposition de '+p.by+' rejetée');
}

// ── Réinitialise le BP d'une année (efface les overrides + proposals de cette année) ──
async function resetBPYear(sid,year){
  if(!isSuperAdmin()){toast('Réservé à Paul');return;}
  var s=S.studios[sid];if(!s)return;
  if(!confirm('Réinitialiser le BP de l\'année '+year+' au modèle La Garenne-Colombes ?\nToutes les modifications de cette année seront perdues.'))return;
  var ov=Object.assign({},s.bpOverrides||{});
  delete ov['y'+year];
  var proposals=(s.bpProposals||[]).filter(function(p){return p.year!==year;});
  var meta=Object.assign({},s.bpMeta||{});
  meta.lastModifiedBy=(S.profile&&S.profile.nom)||'Paul';meta.lastModifiedAt=new Date().toISOString();
  await saveStudio(sid,Object.assign({},s,{bpOverrides:ov,bpProposals:proposals,bpMeta:meta}));
  toast('BP Y'+year+' réinitialisé');
}

// ── Panel propositions en attente (visible si des propositions pending existent) ────
function renderBPProposalsPanel(sid){
  var s=S.studios[sid];if(!s)return '';
  var pending=(s.bpProposals||[]).filter(function(p){return p.status==='pending';});
  if(!pending.length)return '';
  var isPaul=isSuperAdmin();
  var h='<div class="bp-proposals-panel">';
  h+='<div class="bp-proposals-head">';
  h+='<div style="display:flex;align-items:center;gap:8px">';
  h+='<span style="font-size:18px">⏳</span>';
  h+='<div><div style="font-weight:700;color:#92400e">'+pending.length+' proposition'+(pending.length>1?'s':'')+' en attente</div>';
  h+='<div style="font-size:11px;color:#78716c">'+(isPaul?'À valider par vous (superadmin)':'En attente de validation par Paul')+'</div></div>';
  h+='</div></div>';
  h+='<div class="bp-proposals-list">';
  pending.forEach(function(p){
    var lineDef=BP_LINES.filter(function(l){return l.id===p.line;})[0];
    var lineLabel=lineDef?lineDef.label:p.line;
    var mois=MOIS[(((s.forecast&&s.forecast.moisDebut)||0)+p.month)%12];
    h+='<div class="bp-proposal-row">';
    h+='<div style="flex:1;min-width:0">';
    h+='<div style="font-size:12px;font-weight:600;color:#1f2937">'+lineLabel+' · Y'+p.year+' · '+mois+'</div>';
    h+='<div style="font-size:11px;color:#6b7280;margin-top:2px">'+p.by+' · '+new Date(p.at).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})+' · propose <b>'+fmt(p.value)+' €</b></div>';
    h+='</div>';
    if(isPaul){
      h+='<div style="display:flex;gap:6px;flex-shrink:0">';
      h+='<button class="btn btn-approve" onclick="approveBPProposal(\''+sid+'\',\''+p.id+'\')">Approuver</button>';
      h+='<button class="btn btn-reject" onclick="rejectBPProposal(\''+sid+'\',\''+p.id+'\')">Rejeter</button>';
      h+='</div>';
    }
    h+='</div>';
  });
  h+='</div></div>';
  return h;
}

// ── Seed retroactif : attribue Paul comme créateur initial pour studios sans bpMeta ─
function seedBPMetaIfMissing(){
  if(!S.studios)return;
  var changed=[];
  Object.keys(S.studios).forEach(function(sid){
    var s=S.studios[sid];
    if(!s.bpMeta||!s.bpMeta.createdBy){
      s.bpMeta=Object.assign({createdBy:'Paul',createdAt:new Date().toISOString()},s.bpMeta||{});
      changed.push(sid);
    }
  });
  // Save en background — ne bloque pas le render
  if(changed.length&&typeof sb!=='undefined'){
    changed.forEach(function(sid){
      try{sb.from('studios').upsert({id:sid,data:S.studios[sid],updated_at:new Date().toISOString()});}catch(e){}
    });
  }
}
