var S={
  user:null,profile:null,_dataLoaded:false,
  studios:JSON.parse(JSON.stringify(INIT)),
  files:{},depenses:{},messages:{},adherents:{},
  topics:{},todos:{},         // forum topics + todo par studio
  msgSubTab:'discussions',    // 'discussions' | 'taches'
  openTopicId:null,           // topic ouvert (vue fil)
  view:'auth',selectedId:null,
  page:'accueil',  // 'accueil'|'projets'|'prospection'|'bp'
  sidebarOpen:false,
  prospects:[],    // fiches prospection
  prospectTab:'pw', // 'pw'|'cobe'|'sacobe'
  prospectExpandedComments:{}, // {globalIdx: true}
  mainTab:'studios',detailTab:'workflow',
  forecastYear:1,forecastSection:'summary',
  editMoisIdx:null,editVals:{},
  adherentYear:1,
  showNewForm:false,newForm:{},
  aiResp:'',aiLoading:false,
  simConfig:{},  // config simulateur par studio : {p4,p8,pi,prix4,prix8,prixi}
  scenarios:{},  // scénarios enregistrés par studio : [{id,auteur,date,ts,config}]
  activeScenarioId:{}, // ID du scénario actif par studio
  scenarioEditMode:{}, // true si l'utilisateur a activé le mode création de scénario
  dirty:{},  // tracking modifications non sauvegardées {adherents:sid, sim:sid, capex:sid, taux:sid, loyer:sid}
  _dirtyBackup:{},  // backup données avant modification pour annulation
  mapFilter:'default',  // filtre carte localisation
  mapZoom:14,           // niveau de zoom carte (1-20)
  mapStreetView:false,  // mode street view
  mapCoords:{},         // coords geocodées par studio {sid: {lat,lon}}
  mapShowZones:true,    // afficher les zones de chalandise sur la carte
  mapZoneRadius:2000,   // rayon de la zone ajustable (m) — curseur
  showCapexDetail:{},   // toggle détail CAPEX par studio
  globalChat:[],        // messages chat global entre associés
  engView:'societes',   // vue récap engagements : 'societes' | 'actionnaires'
  engSection:'recap',   // volet récap engagements : 'recap' | 'fondspropres' | 'comptescourants'
  engExpanded:{},       // sections dépliées récap engagements {nomGroupe: true}
  fpSimActiveCohorte:'1', // cohorte active dans le volet fonds propres
  fpSimCohortes:{2:{'P&W Occitanie':0,'COBE Society':0,'SACOBE Society':0},3:{'P&W Occitanie':0,'COBE Society':0,'SACOBE Society':0},4:{'P&W Occitanie':0,'COBE Society':0,'SACOBE Society':0}},
  chatOpen:false,       // panneau chat ouvert/fermé
  chatLastSeen:localStorage.getItem('chatLastSeen')||'', // ts du dernier message lu
  adminSettings:{blocked:[],roles:{},viewers:[]}, // contrôle accès utilisateurs
  userPresence:{},      // {userId: {ts:'ISO', nom:'...'}} dernière activité
  lastLogins:{},        // {userId: {ts:'ISO', nom:'...'}} dernière connexion (race-free, 1 ligne/user)
  _presenceInterval:null, // timer heartbeat présence
  avatarUrls:{}, // URLs photos uploadées par chaque utilisateur {nom: url}
  // ── Notifications ──
  notifications:[],     // tableau de notifications chargées depuis Supabase
  notifOpen:false,      // panneau notif ouvert/fermé
  notifFilter:{studio:'all',type:'all',emetteur:'all',period:'all'},
  notifSub:null,        // Supabase Realtime subscription
  // ── Dashboard ──
  dashView:'grid',        // 'grid' | 'cohorte' | 'list'
  dashFilter:'all',       // 'all' | 'preparation' | 'pipeline' | 'debloque' | 'abandonne'
  // ── Recherche globale ──
  searchQuery:'',
  searchOpen:false,
  searchIdx:-1,
  darkMode:localStorage.getItem('isseo_darkMode')==='true',
  // ── Prospection vue/tri/filtre ──
  prospectView:'cards',       // 'cards' | 'table'
  prospectSort:'date',        // 'date' | 'loyer' | 'note'
  prospectSortDir:'desc',     // 'asc' | 'desc'
  prospectFilter:'',          // texte libre filtre ville/adresse
  prospectStatutFilter:'all'  // 'all' | 'chaud' | 'tiede' | 'froid'
};

async function loadAll(){
  var res=await sb.from('studios').select('id,data');
  if(res.error){console.error('loadAll error:',res.error);toast('Erreur chargement données: '+res.error.message);return;}
  var data=res.data||[];
  var studios={};
  S.files={};S.depenses={};S.messages={};S.adherents={};S.topics={};S.todos={};
  data.forEach(function(r){
    var id=r.id;
    if(id.endsWith('_files')){S.files[id.slice(0,-6)]=r.data&&r.data.files||[];}
    else if(id.endsWith('_depenses')){S.depenses[id.slice(0,-9)]=r.data&&r.data.depenses||[];}
    else if(id==='global_chat'){S.globalChat=r.data&&r.data.messages||[];}
    else if(id==='_admin_settings'){S.adminSettings=Object.assign({blocked:[],roles:{},viewers:[]},r.data&&r.data.settings||{});}
    else if(id==='_avatars'){S.avatarUrls=r.data&&r.data.avatars||{};}
    else if(id==='_user_presence'){S.userPresence=r.data&&r.data.presence||{};}
    else if(id.endsWith('_messages')){S.messages[id.slice(0,-9)]=r.data&&r.data.messages||[];}
    else if(id.endsWith('_topics')){S.topics[id.slice(0,-7)]=r.data&&r.data.topics||[];}
    else if(id.endsWith('_todos')){S.todos[id.slice(0,-6)]=r.data&&r.data.todos||[];}
    else if(id.endsWith('_adherents')){S.adherents[id.slice(0,-10)]=r.data&&r.data.actuel||{};}
    else if(id.endsWith('_scenarios')){S.scenarios[id.slice(0,-10)]=r.data&&r.data.scenarios||[];}
    else if(id.endsWith('_simconfig')){
      var sc=r.data&&r.data.config||{};
      if(Object.keys(sc).length>0){
        // Reset complet si les prix sauvegardés sont les anciens defaults incorrects (117/206/294)
        if(sc.prix4===117&&sc.prix8===206&&sc.prixi===294){
          sc.prix4=110;sc.prix8=193.33;sc.prixi=276.67;
          sc.p4=47;sc.p8=50;sc.pi=3; // Reset aussi les proportions au BP
        }
        S.simConfig[id.slice(0,-10)]=sc;
        try{localStorage.setItem('isseo_sim_'+id.slice(0,-10),JSON.stringify(sc));}catch(e){}
      }
    }
    else{studios[id]=r.data;}
  });
  if(Object.keys(studios).length>0)S.studios=studios;
  // Migration : encoder les mots de passe en clair existants
  if(S.adminSettings.passwords){
    var _pwdDirty=false;
    Object.keys(S.adminSettings.passwords).forEach(function(uid){
      var v=S.adminSettings.passwords[uid];
      if(v&&!v.match(/^[A-Za-z0-9+/=]+$/)){ // pas encore encodé en base64
        S.adminSettings.passwords[uid]=encodePwd(v);_pwdDirty=true;
      }
    });
    if(_pwdDirty)sb.from('studios').upsert({id:'_admin_settings',data:{settings:S.adminSettings},updated_at:new Date().toISOString()});
  }
  // Fallback localStorage pour studios sans simConfig Supabase
  Object.keys(S.studios).forEach(function(k){
    if(!S.simConfig[k]||Object.keys(S.simConfig[k]).length===0){
      try{
        var lc=JSON.parse(localStorage.getItem('isseo_sim_'+k)||'null');
        if(lc){
          // Purge cache localStorage si anciens prix incorrects
          if(lc.prix4===117&&lc.prix8===206&&lc.prixi===294){
            lc.prix4=110;lc.prix8=193.33;lc.prixi=276.67;lc.p4=47;lc.p8=50;lc.pi=3;
            localStorage.setItem('isseo_sim_'+k,JSON.stringify(lc));
          }
          S.simConfig[k]=lc;
        }
      }catch(e){}
    }
  });
  // Initialiser activeScenarioId au dernier scénario enregistré pour chaque studio
  Object.keys(S.scenarios).forEach(function(sid){
    var scList=S.scenarios[sid]||[];
    if(scList.length&&!S.activeScenarioId[sid]){
      var sorted=scList.slice().sort(function(a,b){return (b.ts||'').localeCompare(a.ts||'');});
      S.activeScenarioId[sid]=sorted[0].id;
      // Charger la config du dernier scénario si elle diffère de la config actuelle
      var lastCfg=sorted[0].config;
      if(lastCfg)S.simConfig[sid]=JSON.parse(JSON.stringify(lastCfg));
    }
  });
  // Inject INIT studios missing from Supabase + patch config fields
  Object.keys(INIT).forEach(function(k){
    if(!S.studios[k]){
      // Studio défini dans INIT mais absent de Supabase → l'injecter
      S.studios[k]=JSON.parse(JSON.stringify(INIT[k]));
      sb.from('studios').upsert({id:k,data:S.studios[k],updated_at:new Date().toISOString()});
      return;
    }
    var changed=false;
    ['ouverture','capex','emprunt','leasing'].forEach(function(f){
      if(INIT[k][f]!==undefined&&S.studios[k][f]!==INIT[k][f]){S.studios[k][f]=INIT[k][f];changed=true;}
    });
    if(INIT[k].forecast&&INIT[k].forecast.moisDebut!==undefined&&S.studios[k].forecast&&S.studios[k].forecast.moisDebut!==INIT[k].forecast.moisDebut){
      S.studios[k].forecast.moisDebut=INIT[k].forecast.moisDebut;changed=true;
    }
    if(changed)sb.from('studios').upsert({id:k,data:S.studios[k],updated_at:new Date().toISOString()});
  });
}

// ── Navigation persistante ─────────────────────────────────────────────────────
function saveNavState(){
  try{localStorage.setItem('isseo_nav',JSON.stringify({view:S.view,page:S.page,sid:S.selectedId,tab:S.detailTab,main:S.mainTab}));}catch(e){}
}
function restoreNavState(){
  try{
    var n=JSON.parse(localStorage.getItem('isseo_nav')||'{}');
    S.page=n.page||'accueil';
    if(n.page==='projets'&&n.sid&&S.studios[n.sid]){
      S.view='detail';S.selectedId=n.sid;S.detailTab=n.tab||'workflow';
      S.adherentYear=1;S.forecastYear=1;S.forecastSection='summary';
    } else {
      S.view='dashboard';S.mainTab=n.main||'studios';
    }
  }catch(e){S.view='dashboard';S.page='accueil';}
}

// ── Save avec détection de conflit ────────────────────────────────────────────
var _lastKnownTimestamps={};
async function safeSave(id,data){
  var now=new Date().toISOString();
  // Vérifier si les données ont été modifiées par un autre utilisateur
  if(_lastKnownTimestamps[id]){
    var check=await sb.from('studios').select('updated_at').eq('id',id).maybeSingle();
    if(check.data&&check.data.updated_at&&check.data.updated_at>_lastKnownTimestamps[id]){
      toast('Données modifiées par un autre utilisateur — rechargement...');
      await syncDataFallback();
      return false;
    }
  }
  var res=await sb.from('studios').upsert({id:id,data:data,updated_at:now});
  if(res.error){toast('Erreur sauvegarde: '+res.error.message);return false;}
  _lastKnownTimestamps[id]=now;
  return true;
}

// ── SimConfig persistence ──────────────────────────────────────────────────────
var _simSaveTimeout={};
function saveSimConfig(sid){
  // 1. localStorage immédiat — survit au refresh même si Supabase échoue
  try{localStorage.setItem('isseo_sim_'+sid,JSON.stringify(S.simConfig[sid]));}catch(e){}
  // 2. Supabase avec debounce 500ms — partage inter-utilisateurs
  if(_simSaveTimeout[sid])clearTimeout(_simSaveTimeout[sid]);
  _simSaveTimeout[sid]=setTimeout(function(){
    sb.from('studios').upsert({id:sid+'_simconfig',data:{config:S.simConfig[sid]},updated_at:new Date().toISOString()});
  },500);
}
// ── DIRTY STATE : modifications non sauvegardées ─────────────────────────────
function markDirty(type,sid){
  var key=type+'_'+sid;
  if(!S.dirty[key]){
    // Backup avant première modification
    if(type==='adherents'&&!S._dirtyBackup[key])S._dirtyBackup[key]=JSON.parse(JSON.stringify(S.adherents[sid]||{}));
    if(type==='sim'&&!S._dirtyBackup[key])S._dirtyBackup[key]=JSON.parse(JSON.stringify(S.simConfig[sid]||{}));
    if(type==='taux'&&!S._dirtyBackup[key])S._dirtyBackup[key]=S.studios[sid]?S.studios[sid].tauxInteret:null;
    if(type==='loyer'&&!S._dirtyBackup[key])S._dirtyBackup[key]=S.studios[sid]?S.studios[sid].loyer_mensuel:null;
    if(type==='capex'&&!S._dirtyBackup[key])S._dirtyBackup[key]=S.studios[sid]?JSON.parse(JSON.stringify(S.studios[sid].capexDetail||{})):{};
    S.dirty[key]=true;
    _showDirtyBar();
  }
}
function clearDirty(type,sid){
  var key=type+'_'+sid;
  delete S.dirty[key];
  delete S._dirtyBackup[key];
  if(!hasDirty())_hideDirtyBar();
}
function hasDirty(){return Object.keys(S.dirty).some(function(k){return S.dirty[k];});}

async function saveAllDirty(){
  try{
    var keys=Object.keys(S.dirty).filter(function(k){return S.dirty[k];});
    for(var i=0;i<keys.length;i++){
      var parts=keys[i].split('_');var type=parts[0];var sid=parts.slice(1).join('_');
      if(type==='adherents')await saveAdherents(sid);
      if(type==='sim'){saveSimConfig(sid);}
      if(type==='taux'){_tauxPending[sid]=false;await sb.from('studios').upsert({id:sid,data:S.studios[sid],updated_at:new Date().toISOString()});}
      if(type==='loyer'){var ex=await sb.from('studios').select('data').eq('id',sid).maybeSingle();var d=Object.assign({},ex.data&&ex.data.data||{});d.loyer_mensuel=S.studios[sid].loyer_mensuel;await sb.from('studios').upsert({id:sid,data:d,updated_at:new Date().toISOString()});}
      if(type==='capex'){var ex2=await sb.from('studios').select('data').eq('id',sid).maybeSingle();var d2=Object.assign({},ex2.data&&ex2.data.data||{});d2.capexDetail=S.studios[sid].capexDetail;await sb.from('studios').upsert({id:sid,data:d2,updated_at:new Date().toISOString()});}
    }
    S.dirty={};S._dirtyBackup={};
    _hideDirtyBar();
    if(typeof successCheck==='function')successCheck();else toast('Modifications enregistrées ✓');
    render();
  }catch(e){console.error('saveAllDirty error:',e);toast('Erreur sauvegarde: '+e.message);}
}

function discardAllDirty(){
  var keys=Object.keys(S.dirty).filter(function(k){return S.dirty[k];});
  keys.forEach(function(key){
    var parts=key.split('_');var type=parts[0];var sid=parts.slice(1).join('_');
    if(type==='adherents'&&S._dirtyBackup[key])S.adherents[sid]=S._dirtyBackup[key];
    if(type==='sim'&&S._dirtyBackup[key])S.simConfig[sid]=S._dirtyBackup[key];
    if(type==='taux'&&S._dirtyBackup[key]!==undefined&&S.studios[sid])S.studios[sid].tauxInteret=S._dirtyBackup[key];
    if(type==='loyer'&&S._dirtyBackup[key]!==undefined&&S.studios[sid])S.studios[sid].loyer_mensuel=S._dirtyBackup[key];
    if(type==='capex'&&S._dirtyBackup[key]&&S.studios[sid])S.studios[sid].capexDetail=S._dirtyBackup[key];
  });
  // Cancel pending debounce timers
  Object.keys(_simSaveTimeout).forEach(function(k){clearTimeout(_simSaveTimeout[k]);});
  Object.keys(_tauxTimeout).forEach(function(k){clearTimeout(_tauxTimeout[k]);});
  S.dirty={};S._dirtyBackup={};
  _hideDirtyBar();
  toast('Modifications annulées');
  render();
}

function _showDirtyBar(){
  var el=document.getElementById('dirty-bar');
  if(el)el.style.transform='translateY(0)';
}
function _hideDirtyBar(){
  var el=document.getElementById('dirty-bar');
  if(el)el.style.transform='translateY(100%)';
}

function _checkDirtyBeforeNav(){
  if(!hasDirty())return true;
  return confirm('⚠ Vous avez des modifications non enregistrées.\n\nQuitter sans sauvegarder ?');
}

// ── SCÉNARIOS SIMULATEUR ─────────────────────────────────────────────────────
async function saveScenarios(sid){
  await sb.from('studios').upsert({id:sid+'_scenarios',data:{scenarios:S.scenarios[sid]||[]},updated_at:new Date().toISOString()});
}

function enregistrerScenario(sid){
  // Modale pour saisir un commentaire obligatoire
  var overlay=document.createElement('div');
  overlay.id='scenario-modal';
  overlay.className='modal-backdrop-anim';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  var box='<div class="modal-spring" style="background:#fff;border-radius:14px;padding:24px 28px;width:420px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.18)">';
  box+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span style="font-size:15px;font-weight:700;color:#1a1a1a">Enregistrer le scénario</span></div>';
  var _scName=S._scenarioName||'';
  box+='<label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:6px">Nom du scénario</label>';
  box+='<input id="scenario-name-final" type="text" value="'+_scName.replace(/"/g,'&quot;')+'" style="width:100%;padding:8px 12px;border:1px solid #dde;border-radius:8px;font-size:12px;outline:none;font-family:inherit;box-sizing:border-box;margin-bottom:10px;font-weight:600;color:#1a3a6b" placeholder="Nom du scénario"/>';
  box+='<label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:6px">Description / hypothèses <span style="font-weight:400;color:#aaa">(optionnel)</span></label>';
  box+='<textarea id="scenario-comment" rows="3" placeholder="Ex: Prix augmentés de 15%, adhérents conservateurs…" style="width:100%;padding:10px 12px;border:1px solid #dde;border-radius:8px;font-size:12px;resize:vertical;outline:none;font-family:inherit;box-sizing:border-box"></textarea>';
  box+='<div id="scenario-err" style="font-size:11px;color:#A32D2D;margin-top:4px;min-height:16px"></div>';
  box+='<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">';
  box+='<button onclick="document.getElementById(\'scenario-modal\').remove()" style="padding:8px 16px;border:1px solid #dde;border-radius:8px;background:#fff;color:#555;font-size:12px;font-weight:600;cursor:pointer">Annuler</button>';
  box+='<button onclick="_confirmerScenario(\''+sid+'\')" style="padding:8px 16px;background:#1a3a6b;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">Enregistrer</button>';
  box+='</div></div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
  setTimeout(function(){var ta=document.getElementById('scenario-comment');if(ta)ta.focus();},100);
}

async function _confirmerScenario(sid){
  var scenarioName=(document.getElementById('scenario-name-final')||{}).value||S._scenarioName||'';
  var comment=(document.getElementById('scenario-comment')||{}).value||'';
  if(!scenarioName.trim()){
    var err=document.getElementById('scenario-err');
    if(err)err.textContent='Le nom du scénario est obligatoire.';
    return;
  }
  var fullComment=scenarioName.trim()+(comment.trim()?' — '+comment.trim():'');
  var cfg=S.simConfig[sid]||{p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67};
  var now=new Date();
  var sc={
    id:'sc_'+Date.now(),
    auteur:(S.profile&&S.profile.nom)||'Admin',
    name:scenarioName.trim(),
    comment:fullComment,
    date:now.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' '+now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),
    ts:now.toISOString(),
    config:JSON.parse(JSON.stringify(cfg)),
    adherents:JSON.parse(JSON.stringify(S.adherents[sid]||{}))
  };
  if(!S.scenarios[sid])S.scenarios[sid]=[];
  S.scenarios[sid].push(sc);
  S.activeScenarioId[sid]=sc.id;
  S._scenarioName=null;
  await saveScenarios(sid);
  saveSimConfig(sid);
  var modal=document.getElementById('scenario-modal');
  if(modal)modal.remove();
  toast('Scénario "'+sc.name+'" enregistré');
  if(typeof confettiBurst==='function')confettiBurst();
  render();
}

function chargerScenario(sid,scenarioId){
  if(scenarioId==='bp_default'){
    S.simConfig[sid]={p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67};
    S.activeScenarioId[sid]='bp_default';
    S.adherents[sid]={};
    S.scenarioEditMode[sid]=false;
  } else {
    var scenarios=S.scenarios[sid]||[];
    var sc=scenarios.find(function(s){return s.id===scenarioId;});
    if(!sc)return;
    S.simConfig[sid]=JSON.parse(JSON.stringify(sc.config));
    S.activeScenarioId[sid]=scenarioId;
    S.adherents[sid]=sc.adherents?JSON.parse(JSON.stringify(sc.adherents)):{};
    S.scenarioEditMode[sid]=true;
  }
  // Sauvegarder immédiatement (pas de debounce) pour éviter les conflits
  try{localStorage.setItem('isseo_sim_'+sid,JSON.stringify(S.simConfig[sid]));}catch(e){}
  sb.from('studios').upsert({id:sid+'_simconfig',data:{config:S.simConfig[sid]},updated_at:new Date().toISOString()});
  saveAdherents(sid);
  toast(scenarioId==='bp_default'?'Valeurs BP par défaut restaurées':'Scénario chargé');
  render();
}

async function supprimerScenario(sid,scenarioId){
  if(!confirm('Supprimer ce scénario ?'))return;
  S.scenarios[sid]=(S.scenarios[sid]||[]).filter(function(s){return s.id!==scenarioId;});
  // Si c'était le scénario actif, revenir au dernier restant ou BP par défaut
  if(S.activeScenarioId[sid]===scenarioId){
    var remaining=(S.scenarios[sid]||[]).slice().sort(function(a,b){return (b.ts||'').localeCompare(a.ts||'');});
    if(remaining.length){
      S.activeScenarioId[sid]=remaining[0].id;
      S.simConfig[sid]=JSON.parse(JSON.stringify(remaining[0].config));
      S.adherents[sid]=remaining[0].adherents?JSON.parse(JSON.stringify(remaining[0].adherents)):{};
    } else {
      S.activeScenarioId[sid]='bp_default';
      S.simConfig[sid]={p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67};
      S.adherents[sid]={};
      S.scenarioEditMode[sid]=false;
    }
    saveSimConfig(sid);
    saveAdherents(sid);
  }
  await saveScenarios(sid);
  toast('Scénario supprimé');
  render();
}

// ══════════════════════════════════════════════════════════════════════════════
