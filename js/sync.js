// ── Sync temps réel : Supabase Realtime + fallback polling 60s ─────────────
var _syncInterval=null;
var _realtimeSub=null;
var _syncTimestamps={}; // {id: updated_at} pour éviter les JSON.stringify inutiles

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
    var nv=r.data&&r.data.actuel||{};
    if(JSON.stringify(nv)!==JSON.stringify(S.adherents[id.slice(0,-10)]||{})){S.adherents[id.slice(0,-10)]=nv;changed=true;}
  } else if(id.endsWith('_scenarios')){
    var nv=r.data&&r.data.scenarios||[];
    if(JSON.stringify(nv)!==JSON.stringify(S.scenarios[id.slice(0,-10)]||[])){S.scenarios[id.slice(0,-10)]=nv;changed=true;}
  } else if(id.endsWith('_simconfig')){
    var nv=r.data&&r.data.config||{};
    if(JSON.stringify(nv)!==JSON.stringify(S.simConfig[id.slice(0,-10)]||{})){
      S.simConfig[id.slice(0,-10)]=nv;
      try{localStorage.setItem('isseo_sim_'+id.slice(0,-10),JSON.stringify(nv));}catch(e){}
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
    if(JSON.stringify(nv)!==JSON.stringify(S.userPresence)){S.userPresence=nv;changed=true;}
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
        ['capex','emprunt','leasing','ouverture'].forEach(function(f){
          if(INIT[id][f]!==undefined)sd[f]=INIT[id][f];
        });
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
        console.log('[Realtime] Connecté — sync instantanée active');
      } else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){
        console.warn('[Realtime] Erreur — fallback polling actif');
      }
    });
}

// Fallback : polling complet toutes les 60s (en cas de déconnexion Realtime)
async function syncDataFallback(){
  if(S.editMoisIdx!==null||S.showNewForm)return;
  try{
    var res=await sb.from('studios').select('id,data,updated_at');
    if(res.error){console.warn('Sync fallback error:',res.error.message);return;}
    var rows=res.data||[];
    var changed=false;
    rows.forEach(function(r){
      if(_handleRowChange(r))changed=true;
    });
    if(changed)_tryRender();
  }catch(e){console.warn('Sync fallback exception:',e.message);}
}

function startSync(){
  if(_syncInterval)clearInterval(_syncInterval);
  subscribeDataChanges();
  _syncInterval=setInterval(syncDataFallback,60000);
}

