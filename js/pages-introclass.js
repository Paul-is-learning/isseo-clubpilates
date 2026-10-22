// ═══════════════════════════════════════════════════════════════════════════
// INTRO CLASS — onglet gérants (cdc Tom, oct. 2026)
// Présences, transformation, primes coachs (12 €/signé IC), commissions
// staff (10/25/50, parts 50/50, gérants non commissionnés). Tout est
// CALCULÉ depuis les données saisies par l'équipe dans le Sales Coach :
// rows Supabase `_ic_data` (séances/planning/barèmes), `_coach_stats`
// (journal des ventes), `_coach_access` (équipe + drapeaux).
// Lecture directe de la table `studios` (auth gérant), aucune ressaisie.
// ═══════════════════════════════════════════════════════════════════════════

var _icd=null;      // cache données
var _icdLoading=false;
var _icMonth=(function(){var d=new Date();return d.toISOString().slice(0,7);})();
var _icStudio='';   // ''=tous

function loadIntroClass(force){
  if(_icdLoading)return;
  if(_icd&&!force)return;
  _icdLoading=true;
  sb.from('studios').select('id,data').in('id',['_ic_data','_coach_stats','_coach_access'])
    .then(function(res){
      _icdLoading=false;
      var rows={};(res.data||[]).forEach(function(r){rows[r.id]=r.data||{};});
      _icd={
        slots:(rows['_ic_data']||{}).slots||[],
        sessions:(rows['_ic_data']||{}).sessions||[],
        baremes:(rows['_ic_data']||{}).baremes||[],
        events:(rows['_coach_stats']||{}).events||[],
        invites:(rows['_coach_access']||{}).invites||[]
      };
      if(S.page==='introclass')render();
    });
}

function _icBaremeAt(date){
  var b={coach:12,p1:10,p2:25,p3:50};
  (_icd.baremes||[]).forEach(function(x){if(x.effet<=date)b=x;});
  return b;
}
function _icKey(n){return (n||'').trim().split(' ')[0].toLowerCase();}
function _icEur(n){return (Math.round(n*100)/100).toLocaleString('fr-FR')+' €';}

// Vendeur commissionné ? (invitation existante, non suspendue, sans drapeau nocom)
function _icCommissionne(nom){
  var k=_icKey(nom);
  if(!k||k==='équipe'||k==='equipe')return false;
  var inv=(_icd.invites||[]).find(function(i){return _icKey(i.nom)===k;});
  return !!inv&&inv.nocom!==true;
}

// Agrégats du mois (et de la saison sept→août)
function _icCompute(){
  var month=_icMonth;
  var seasonStart=(+month.slice(0,4)-(month.slice(5,7)<'09'?1:0))+'-09';
  var inMonth=function(d){return (d||'').slice(0,7)===month;};
  var inSeason=function(d){d=(d||'').slice(0,7);return d>=seasonStart&&d<=month;};
  var stuOk=function(s){return !_icStudio||s===_icStudio;};

  var sessions=(_icd.sessions||[]).filter(function(s){return stuOk(s.studio)&&s.statut!=='annulee';});
  var sessById={};sessions.forEach(function(s){sessById[s.id]=s;});
  var sMois=sessions.filter(function(s){return inMonth(s.date);});
  var sSaison=sessions.filter(function(s){return inSeason(s.date);});

  // Ventes = événements abo du journal (nom, pack, vendeurs, IC, date)
  var ventes=(_icd.events||[]).filter(function(e){return e.type==='abo';})
    .map(function(e){
      var ic=e.icId?sessById[e.icId]:null;
      return {nom:e.nom||'?',date:(e.ts||'').slice(0,10),pack:+e.pack||0,rep:e.rep||'',v2:e.v2||'',
        fullCom:e.fullCom===true,icId:e.icId||'',ic:ic,studio:ic?ic.studio:''};
    })
    .filter(function(v){return !_icStudio||!v.ic||v.ic.studio===_icStudio;});
  var vMois=ventes.filter(function(v){return inMonth(v.date);});
  var vSaison=ventes.filter(function(v){return inSeason(v.date);});

  function agg(sess,vts){
    var a={booked:0,show:0,signesIC:0,horsIC:0,packs:{1:0,2:0,3:0},primesCoach:{},commissions:{},nonCom:0,total:0};
    sess.forEach(function(s){a.booked+=(+s.booked||0);a.show+=(+s.show||0);});
    vts.forEach(function(v){
      a.total++;if(v.pack)a.packs[v.pack]=(a.packs[v.pack]||0)+1;
      var bar=_icBaremeAt(v.date);
      if(v.ic){a.signesIC++;
        var coach=v.ic.coach||'?';
        a.primesCoach[coach]=(a.primesCoach[coach]||0)+(+bar.coach||0);
      } else a.horsIC++;
      var com=+bar['p'+v.pack]||0;
      var parts=[];
      if(!v.v2)parts=[[v.rep,1]];
      else if(v.fullCom)parts=[[v.v2,1]];
      else parts=[[v.rep,.5],[v.v2,.5]];
      parts.forEach(function(p){
        if(_icCommissionne(p[0])){var k=p[0].split(' ')[0];a.commissions[k]=(a.commissions[k]||0)+com*p[1];}
        else a.nonCom+=com*p[1];
      });
    });
    a.showPct=a.booked?Math.round(a.show/a.booked*100):0;
    a.conv=a.show?Math.round(a.signesIC/a.show*100):0;
    return a;
  }
  return {sMois:sMois,vMois:vMois,mois:agg(sMois,vMois),saison:agg(sSaison,vSaison),sessById:sessById,seasonStart:seasonStart};
}

function _icMonthNav(delta){
  var d=new Date(_icMonth+'-15T12:00:00');d.setMonth(d.getMonth()+delta);
  _icMonth=d.toISOString().slice(0,7);render();
}
function _icSetStudio(v){_icStudio=v;render();}

function _icStudios(){
  var set={};
  (_icd.sessions||[]).forEach(function(s){if(s.studio)set[s.studio]=1;});
  (_icd.invites||[]).forEach(function(i){if(i.studio)set[i.studio]=1;});
  return Object.keys(set).sort();
}

function _icMonthLabel(m){
  return new Date(m+'-15T12:00:00').toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
}

function renderIntroClass(){
  if(!_icd){loadIntroClass();return '<div class="box" style="text-align:center;padding:60px;color:#888">⏳ Chargement des Intro Class…</div>';}
  var c=_icCompute();
  var studios=_icStudios();
  var h='';

  // ── En-tête : mois + studio + refresh ──
  h+='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px">';
  h+='<div><h2 style="margin:0;font-size:22px;color:#0f1f3d">🗓️ Intro Class</h2><div style="font-size:12px;color:#888">Présences, transformation, primes & commissions · calculés, jamais tapés</div></div>';
  h+='<div style="margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap">';
  h+='<select onchange="_icSetStudio(this.value)" style="padding:8px 10px;border:1px solid #dde1ea;border-radius:8px;font-size:12.5px;background:#fff">'+
     '<option value="">Tous les studios</option>'+studios.map(function(s){return '<option value="'+s+'"'+(s===_icStudio?' selected':'')+'>'+s+'</option>';}).join('')+'</select>';
  h+='<div style="display:flex;align-items:center;gap:4px;background:#fff;border:1px solid #dde1ea;border-radius:8px;padding:3px">';
  h+='<button onclick="_icMonthNav(-1)" style="border:none;background:none;cursor:pointer;font-size:15px;padding:4px 9px;color:#4F6FA0;font-weight:700">‹</button>';
  h+='<b style="font-size:13px;color:#0f1f3d;min-width:118px;text-align:center;text-transform:capitalize">'+_icMonthLabel(_icMonth)+'</b>';
  h+='<button onclick="_icMonthNav(1)" style="border:none;background:none;cursor:pointer;font-size:15px;padding:4px 9px;color:#4F6FA0;font-weight:700">›</button></div>';
  h+='<button onclick="loadIntroClass(true);render()" title="Actualiser" style="padding:8px 11px;border:1px solid #dde1ea;border-radius:8px;background:#fff;cursor:pointer;font-size:12px">↻</button>';
  h+='</div></div>';

  // ── KPIs mois (+ saison en petit) ──
  var kpi=function(lbl,v,sub,color){return '<div style="background:#fff;border:1px solid #e8eaf0;border-radius:12px;padding:13px 15px;min-width:100px;flex:1">'+
    '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#888">'+lbl+'</div>'+
    '<div style="font-size:23px;font-weight:800;color:'+(color||'#0f1f3d')+';margin-top:2px">'+v+'</div>'+
    (sub?'<div style="font-size:10.5px;color:#aab;margin-top:1px">'+sub+'</div>':'')+'</div>';};
  var m=c.mois,sa=c.saison;
  h+='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">';
  h+=kpi('Booked',m.booked,'saison : '+sa.booked);
  h+=kpi('Show',m.show,'saison : '+sa.show);
  h+=kpi('Show %',m.showPct+' %',sa.booked?('saison : '+sa.showPct+' %'):'' ,m.showPct>=80?'#1F9E75':m.showPct>=60?'#C9871F':'#c0392b');
  h+=kpi('Signés IC',m.signesIC,'conversion show : '+m.conv+' %','#1F9E75');
  h+=kpi('Hors IC',m.horsIC,'total signés : '+m.total);
  h+=kpi('Primes coachs',_icEur(Object.values(m.primesCoach).reduce(function(s,x){return s+x;},0)),'saison : '+_icEur(Object.values(sa.primesCoach).reduce(function(s,x){return s+x;},0)),'#854F0B');
  h+=kpi('Commissions staff',_icEur(Object.values(m.commissions).reduce(function(s,x){return s+x;},0)),m.nonCom?('non commissionné : '+_icEur(m.nonCom)):'','#854F0B');
  h+='</div>';

  // ── Primes coachs ──
  var coachRows=Object.keys(m.primesCoach).sort(function(a,b){return m.primesCoach[b]-m.primesCoach[a];});
  h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;margin-bottom:16px">';
  h+='<div class="box" style="padding:16px 18px"><div style="font-weight:700;color:#0f1f3d;font-size:14px;margin-bottom:10px">🧘 Primes instructeurs <span style="font-weight:600;color:#999;font-size:11px">· 12 € par signé dans SON IC · rien hors IC</span></div>';
  if(coachRows.length){
    h+='<table style="width:100%;border-collapse:collapse;font-size:13px">';
    h+='<tr style="color:#888;font-size:10.5px;text-transform:uppercase"><th style="text-align:left;padding:4px 0">Coach</th><th style="text-align:right">Signés IC</th><th style="text-align:right">Prime</th></tr>';
    coachRows.forEach(function(cn){
      var nb=c.vMois.filter(function(v){return v.ic&&(v.ic.coach||'?')===cn;}).length;
      h+='<tr style="border-top:1px solid #f0f2f6"><td style="padding:7px 0;font-weight:600;color:#0f1f3d">'+cn+'</td><td style="text-align:right">'+nb+'</td><td style="text-align:right;font-weight:800;color:#854F0B">'+_icEur(m.primesCoach[cn])+'</td></tr>';
    });
    h+='</table>';
  } else h+='<div style="color:#aab;font-size:13px;padding:10px 0">Aucun signé en IC ce mois-ci.</div>';
  h+='</div>';

  // ── Commissions staff ──
  var comRows=Object.keys(m.commissions).sort(function(a,b){return m.commissions[b]-m.commissions[a];});
  h+='<div class="box" style="padding:16px 18px"><div style="font-weight:700;color:#0f1f3d;font-size:14px;margin-bottom:10px">💰 Commissions staff <span style="font-weight:600;color:#999;font-size:11px">· 10/25/50 € par pack · 50/50 à deux · associés exclus</span></div>';
  if(comRows.length){
    h+='<table style="width:100%;border-collapse:collapse;font-size:13px">';
    h+='<tr style="color:#888;font-size:10.5px;text-transform:uppercase"><th style="text-align:left;padding:4px 0">Vendeur</th><th style="text-align:right">Ventes (parts)</th><th style="text-align:right">Commission</th></tr>';
    comRows.forEach(function(vn){
      var nb=0;c.vMois.forEach(function(v){var parts=!v.v2?[[v.rep,1]]:(v.fullCom?[[v.v2,1]]:[[v.rep,.5],[v.v2,.5]]);parts.forEach(function(p){if(p[0].split(' ')[0]===vn)nb+=p[1];});});
      h+='<tr style="border-top:1px solid #f0f2f6"><td style="padding:7px 0;font-weight:600;color:#0f1f3d">'+vn+'</td><td style="text-align:right">'+nb+'</td><td style="text-align:right;font-weight:800;color:#854F0B">'+_icEur(m.commissions[vn])+'</td></tr>';
    });
    h+='</table>';
    if(m.nonCom)h+='<div style="font-size:11px;color:#999;margin-top:8px">Parts des associés / « Équipe » (non versées) : '+_icEur(m.nonCom)+'</div>';
  } else h+='<div style="color:#aab;font-size:13px;padding:10px 0">Aucune vente commissionnée ce mois-ci.</div>';
  h+='</div></div>';

  // ── Récap nominatif des signés (cdc p.14) ──
  h+='<div class="box" style="padding:16px 18px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><div style="font-weight:700;color:#0f1f3d;font-size:14px">📋 Récap des signés · '+_icMonthLabel(_icMonth)+'</div>';
  h+='<button onclick="_icExport()" style="margin-left:auto;padding:7px 13px;border:1px solid #dde1ea;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;font-weight:600">⬇️ Export CSV (paie)</button></div>';
  if(c.vMois.length){
    h+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12.5px;min-width:560px">';
    h+='<tr style="color:#888;font-size:10.5px;text-transform:uppercase"><th style="text-align:left;padding:5px 6px">Signé le</th><th style="text-align:left">Client</th><th style="text-align:left">Pack</th><th style="text-align:left">IC du</th><th style="text-align:left">Coach</th><th style="text-align:left">Vendu par</th></tr>';
    c.vMois.sort(function(a,b){return a.date<b.date?-1:1;}).forEach(function(v){
      var pk=v.pack===3?'Illimité':'Pack '+(v.pack===1?'4':'8');
      h+='<tr style="border-top:1px solid #f0f2f6"><td style="padding:7px 6px">'+v.date.slice(8,10)+'/'+v.date.slice(5,7)+'</td><td style="font-weight:600;color:#0f1f3d">'+v.nom+'</td><td>'+pk+'</td>'+
         '<td>'+(v.ic?(v.ic.date.slice(8,10)+'/'+v.ic.date.slice(5,7)):'<span style="color:#aab">hors IC</span>')+'</td>'+
         '<td>'+(v.ic?(v.ic.coach||'?'):'<span style="color:#aab">aucun</span>')+'</td>'+
         '<td>'+v.rep.split(' ')[0]+(v.v2?' + '+v.v2.split(' ')[0]+(v.fullCom?' (100 %)':' (50/50)'):'')+'</td></tr>';
    });
    h+='</table></div>';
  } else h+='<div style="color:#aab;font-size:13px;padding:10px 0">Aucun signé ce mois-ci pour l\'instant.</div>';
  h+='</div>';

  // ── Barèmes datés ──
  h+='<div class="box" style="padding:16px 18px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><div style="font-weight:700;color:#0f1f3d;font-size:14px">⚖️ Barèmes <span style="font-weight:600;color:#999;font-size:11px">· datés : un changement ne touche jamais les mois passés</span></div>';
  h+='<button onclick="_icAddBareme()" style="margin-left:auto;padding:7px 13px;border:1px solid #dde1ea;border-radius:8px;background:#0f1f3d;color:#fff;cursor:pointer;font-size:12px;font-weight:600">+ Nouveau barème</button></div>';
  h+='<table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="color:#888;font-size:10.5px;text-transform:uppercase"><th style="text-align:left;padding:4px 0">Effet</th><th style="text-align:right">Prime coach</th><th style="text-align:right">Pack 4</th><th style="text-align:right">Pack 8</th><th style="text-align:right">Illimité</th></tr>';
  (_icd.baremes||[]).slice().reverse().forEach(function(b){
    h+='<tr style="border-top:1px solid #f0f2f6"><td style="padding:7px 0;font-weight:600">'+b.effet.split('-').reverse().join('/')+'</td><td style="text-align:right">'+b.coach+' €</td><td style="text-align:right">'+b.p1+' €</td><td style="text-align:right">'+b.p2+' €</td><td style="text-align:right">'+b.p3+' €</td></tr>';
  });
  h+='</table></div>';

  return h;
}

function _icExport(){
  var c=_icCompute(),m=c.mois;
  var lines=['Récap Intro Class;'+_icMonthLabel(_icMonth)+';'+(_icStudio||'Tous studios'),''];
  lines.push('SIGNÉS;;;;;');
  lines.push('Signé le;Client;Pack;IC du;Coach;Vendu par');
  c.vMois.forEach(function(v){
    var pk=v.pack===3?'Illimité':'Pack '+(v.pack===1?'4':'8');
    lines.push([v.date,v.nom,pk,(v.ic?v.ic.date:'hors IC'),(v.ic?v.ic.coach:''),v.rep+(v.v2?' + '+v.v2+(v.fullCom?' (100%)':' (50/50)'):'')].join(';'));
  });
  lines.push('');lines.push('PRIMES COACHS;;');lines.push('Coach;Prime');
  Object.keys(m.primesCoach).forEach(function(cn){lines.push(cn+';'+String(m.primesCoach[cn]).replace('.',','));});
  lines.push('');lines.push('COMMISSIONS STAFF;;');lines.push('Vendeur;Commission');
  Object.keys(m.commissions).forEach(function(vn){lines.push(vn+';'+String(m.commissions[vn]).replace('.',','));});
  var blob=new Blob(['﻿'+lines.join('\n')],{type:'text/csv;charset=utf-8'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='introclass_'+_icMonth+(_icStudio?'_'+_icStudio.replace(/\s+/g,'-'):'')+'.csv';
  a.click();URL.revokeObjectURL(a.href);
  if(typeof toast==='function')toast('Export CSV téléchargé ✓');
}

function _icAddBareme(){
  var effet=prompt('Date d\'effet (AAAA-MM-JJ) :',new Date().toISOString().slice(0,10));if(!effet)return;
  var coach=prompt('Prime coach par signé IC (€) :','12');if(coach===null)return;
  var p1=prompt('Commission Pack 4 (€) :','10');if(p1===null)return;
  var p2=prompt('Commission Pack 8 (€) :','25');if(p2===null)return;
  var p3=prompt('Commission Illimité (€) :','50');if(p3===null)return;
  // écrit via la table (gérant authentifié)
  sb.from('studios').select('data').eq('id','_ic_data').maybeSingle().then(function(res){
    var d=(res.data&&res.data.data)||{};
    d.baremes=(d.baremes||[]);
    d.baremes.push({id:'bar_'+Date.now(),effet:effet.slice(0,10),coach:+coach||0,p1:+p1||0,p2:+p2||0,p3:+p3||0});
    d.baremes.sort(function(a,b){return a.effet<b.effet?-1:1;});
    return sb.from('studios').upsert({id:'_ic_data',data:d,updated_at:new Date().toISOString()});
  }).then(function(){if(typeof toast==='function')toast('Barème enregistré ✓');loadIntroClass(true);});
}
