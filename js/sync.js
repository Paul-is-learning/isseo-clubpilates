// ── Sync temps réel : Supabase Realtime + fallback polling 60s ─────────────
var _syncInterval=null;
var _realtimeSub=null;
var _syncTimestamps={}; // {id: updated_at} pour éviter les JSON.stringify inutiles

// Présence et dernières connexions ne s'affichent que dans le panneau Administration (même test que render())
function _presenceShown(){
  return S.view!=='auth'&&S.view!=='detail'&&S.page==='projets'&&S.mainTab==='admin';
}

function _handleRowChange(r){
  if(S.editMoisIdx!==null||S.showNewForm)return false;
  var id=r.id;
  // Optimisation : skip si updated_at identique (évite JSON.stringify coûteux)
  if(r.updated_at&&_syncTimestamps[id]===r.updated_at)return false;
  if(r.updated_at)_syncTimestamps[id]=r.updated_at;
  var changed=false;
  if(id.endsWith('_files')){
    var nv=r.data&&r.data.files||[];
    if(JSON.stringify(nv)!==JSON.stringify(S.files[id.slice(0,-6)]||[])){S.files[id.slice(0,-6)]=nv;changed=true;}
  } else if(id.endsWith('_depenses')){
    var nv=r.data&&r.data.depenses||[];
    if(JSON.stringify(nv)!==JSON.stringify(S.depenses[id.slice(0,-9)]||[])){S.depenses[id.slice(0,-9)]=nv;changed=true;}
  } else if(id.endsWith('_adherents')){
    var _sidAdh=id.slice(0,-10);
    // Ne jamais écraser une saisie locale non enregistrée
    if(S.dirty&&S.dirty['adherents_'+_sidAdh])return false;
    var nv=r.data&&r.data.actuel||{};
    if(JSON.stringify(nv)!==JSON.stringify(S.adherents[_sidAdh]||{})){S.adherents[_sidAdh]=nv;changed=true;}
  } else if(id.endsWith('_scenarios')){
    var nv=r.data&&r.data.scenarios||[];
    if(JSON.stringify(nv)!==JSON.stringify(S.scenarios[id.slice(0,-10)]||[])){S.scenarios[id.slice(0,-10)]=nv;changed=true;}
  } else if(id.endsWith('_todos')){
    // V2 : sync temps réel des tâches (kanban, commentaires, mentions, reactions)
    var sid=id.slice(0,-6);
    var nv=r.data&&r.data.todos||[];
    if(JSON.stringify(nv)!==JSON.stringify(S.todos[sid]||[])){
      S.todos[sid]=nv;
      changed=true;
      // Re-render le modal de tâche s'il est ouvert sur une tâche de ce studio
      try{
        var modal=document.getElementById('tache-detail-modal');
        if(modal&&modal.dataset&&modal.dataset.sid===sid&&typeof _rerenderTacheModal==='function'){
          _rerenderTacheModal(sid,modal.dataset.tid);
        }
      }catch(e){}
    }
  } else if(id==='_people'){
    var nv=r.data&&r.data.people||{};
    if(JSON.stringify(nv)!==JSON.stringify(S.people||{})){S.people=nv;changed=true;}
  } else if(id.endsWith('_shifts')&&!id.endsWith('_shift_templates')&&!id.endsWith('_shift_proposals')){
    var sid=id.slice(0,-7);
    var nv=r.data&&r.data.shifts||[];
    if(JSON.stringify(nv)!==JSON.stringify(S.shifts[sid]||[])){
      if(!S.shifts)S.shifts={};
      S.shifts[sid]=nv;changed=true;
    }
  } else if(id.endsWith('_shift_templates')){
    var sid=id.slice(0,-16);
    var nv=r.data&&r.data.templates||[];
    if(JSON.stringify(nv)!==JSON.stringify(S.shiftTemplates[sid]||[])){
      if(!S.shiftTemplates)S.shiftTemplates={};
      S.shiftTemplates[sid]=nv;changed=true;
    }
  } else if(id.endsWith('_shift_proposals')){
    var sid=id.slice(0,-16);
    var nv=r.data&&r.data.proposals||[];
    if(JSON.stringify(nv)!==JSON.stringify(S.shiftProposals[sid]||[])){
      if(!S.shiftProposals)S.shiftProposals={};
      S.shiftProposals[sid]=nv;changed=true;
    }
  } else if(id.endsWith('_simconfig')){
    var _sidCfg=id.slice(0,-10);
    // Ne jamais écraser un réglage local non enregistré (curseurs/prix en cours)
    if(S.dirty&&S.dirty['sim_'+_sidCfg])return false;
    var nv=r.data&&r.data.config||{};
    if(JSON.stringify(nv)!==JSON.stringify(S.simConfig[_sidCfg]||{})){
      S.simConfig[_sidCfg]=nv;
      try{localStorage.setItem('isseo_sim_'+_sidCfg,JSON.stringify(nv));}catch(e){}
      changed=true;
    }
  } else if(id==='_admin_settings'){
    var nv=Object.assign({blocked:[],roles:{},viewers:[]},r.data&&r.data.settings||{});
    if(JSON.stringify(nv)!==JSON.stringify(S.adminSettings)){
      S.adminSettings=nv;
      if(S.user&&S.profile){
        var newRole=nv.roles&&nv.roles[S.user.id];
        if(newRole){S.profile=Object.assign({},S.profile,{role:newRole});}
      }
      if(S.user&&nv.blocked&&nv.blocked.indexOf(S.user.id)>=0){
        sb.auth.signOut();S.user=null;S.profile=null;S.view='auth';render();return true;
      }
      changed=true;
    }
  } else if(id==='_prospects'){
    var nv=r.data&&r.data.items||[];
    if(JSON.stringify(nv)!==JSON.stringify(S.prospects||[])){
      S.prospects=nv;
      migrateProspects();changed=true;
    }
  } else if(id==='_user_presence'){
    var nv=r.data&&r.data.presence||{};
    // Heartbeat 3 min de chaque utilisateur : S à jour, rendu seulement si l'écran Administration est affiché
    if(JSON.stringify(nv)!==JSON.stringify(S.userPresence)){S.userPresence=nv;changed=_presenceShown();}
  } else if(id.indexOf('_login_')===0){
    // Dernière connexion : rangée dans S.lastLogins (même forme que loadLastLogins), plus dans S.studios
    var _uidLog=id.slice(7);
    if(_uidLog&&r.data&&r.data.ts){
      var nv={ts:r.data.ts,nom:r.data.nom||''};
      if(!S.lastLogins)S.lastLogins={};
      if(JSON.stringify(nv)!==JSON.stringify(S.lastLogins[_uidLog]||{})){S.lastLogins[_uidLog]=nv;changed=_presenceShown();}
    }
  } else if(id==='_avatars'){
    var nv=r.data&&r.data.avatars||{};
    if(JSON.stringify(nv)!==JSON.stringify(S.avatarUrls)){S.avatarUrls=nv;changed=true;}
  } else if(id==='global_chat'){
    var nv=r.data&&r.data.messages||[];
    if(JSON.stringify(nv)!==JSON.stringify(S.globalChat)){
      S.globalChat=nv;
      if(!S.chatOpen)changed=true;
      else{renderChat();}
    }
  } else if(!id.endsWith('_messages')){
    if(r.data&&!_tauxPending[id]){
      var sd=Object.assign({},r.data);
      if(INIT[id]){
        ['capex','emprunt','leasing','ouverture','name','addr','loyerVarPct'].forEach(function(f){
          if(INIT[id][f]!==undefined)sd[f]=INIT[id][f];
        });
        if(INIT[id].loyer_mensuel!==undefined&&!(sd.loyer_mensuel>0))sd.loyer_mensuel=INIT[id].loyer_mensuel;
        if(INIT[id].forecast&&INIT[id].forecast.moisDebut!==undefined&&sd.forecast)
          sd.forecast.moisDebut=INIT[id].forecast.moisDebut;
      }
      if(JSON.stringify(sd)!==JSON.stringify(S.studios[id]||{})){
        S.studios[id]=sd;changed=true;
      }
    }
  }
  return changed;
}

function _tryRender(){
  var ae=document.activeElement;
  var skipRender=ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA')&&ae.id!=='global-chat-input';
  if(!skipRender)render();
}

// Supabase Realtime : écoute les changements sur la table studios en temps réel
function subscribeDataChanges(){
  if(_realtimeSub)return;
  _realtimeSub=sb.channel('studios-sync')
    .on('postgres_changes',{
      event:'INSERT',
      schema:'public',
      table:'studios'
    },function(payload){
      if(payload.new&&_handleRowChange(payload.new))_tryRender();
    })
    .on('postgres_changes',{
      event:'UPDATE',
      schema:'public',
      table:'studios'
    },function(payload){
      if(payload.new&&_handleRowChange(payload.new))_tryRender();
    })
    .on('postgres_changes',{
      event:'DELETE',
      schema:'public',
      table:'studios'
    },function(payload){
      // Suppression : nettoyer l'entrée correspondante
      var id=payload.old&&payload.old.id;
      if(id&&S.studios[id]){delete S.studios[id];_tryRender();}
    })
    .subscribe(function(status){
      if(status==='SUBSCRIBED'){
        console.log('[Realtime] Connect\u00e9 \u2014 sync instantan\u00e9e active');
        _rtBackoff=0;
        // Rattraper les changements manqués pendant la déconnexion
        syncDataFallback();
        // Restaurer polling normal
        if(_syncInterval)clearInterval(_syncInterval);
        _syncInterval=setInterval(syncDataFallback,SYNC_POLL_OK);
      } else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){
        console.warn('[Realtime] Erreur \u2014 reconnexion...');
        // Polling rapide pendant la coupure
        if(_syncInterval)clearInterval(_syncInterval);
        _syncInterval=setInterval(syncDataFallback,SYNC_POLL_DOWN);
        // Reconnexion avec backoff exponentiel
        _rtBackoff=Math.min((_rtBackoff||5)*2,30);
        if(_realtimeSub){try{sb.removeChannel(_realtimeSub);}catch(e){}_realtimeSub=null;}
        setTimeout(subscribeDataChanges,_rtBackoff*1000);
      }
    });
}

// Filet de sécurité du temps réel : relevé léger (identifiants + dates de mise à jour),
// puis téléchargement des seules lignes modifiées. Onglet caché : aucune requête,
// rattrapage dès le retour sur l'onglet. (Avant : toute la table toutes les 60 s, 10 s en panne.)
var SYNC_POLL_OK=5*60*1000, SYNC_POLL_DOWN=30000;
var _syncBusy=false;
async function syncDataFallback(){
  if(S.editMoisIdx!==null||S.showNewForm)return;
  if(document.hidden||_syncBusy)return;
  _syncBusy=true;
  try{
    var head=await sb.from('studios').select('id,updated_at');
    if(head.error){console.warn('Sync fallback error:',head.error.message);return;}
    var ids=(head.data||[]).filter(function(r){return !r.updated_at||_syncTimestamps[r.id]!==r.updated_at;}).map(function(r){return r.id;});
    var changed=false;
    for(var i=0;i<ids.length;i+=40){
      var res=await sb.from('studios').select('id,data,updated_at').in('id',ids.slice(i,i+40));
      if(res.error){console.warn('Sync fallback error:',res.error.message);return;}
      (res.data||[]).forEach(function(r){if(_handleRowChange(r))changed=true;});
    }
    if(changed)_tryRender();
  }catch(e){console.warn('Sync fallback exception:',e.message);}
  finally{_syncBusy=false;}
}
document.addEventListener('visibilitychange',function(){if(!document.hidden&&S.user&&S._dataLoaded)syncDataFallback();});

function startSync(){
  if(_syncInterval)clearInterval(_syncInterval);
  subscribeDataChanges();
  _syncInterval=setInterval(syncDataFallback,SYNC_POLL_OK);
}

function stopSync(){
  if(_realtimeSub){try{sb.removeChannel(_realtimeSub);}catch(e){}_realtimeSub=null;}
  if(_syncInterval){clearInterval(_syncInterval);_syncInterval=null;}
  _rtBackoff=0;
}

// Copie conforme de pages-prospection.js : appelée sans garde ci-dessus (_prospects), pour pouvoir retirer ce fichier plus tard
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

