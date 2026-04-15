// ── PAGE: Accueil ──────────────────────────────────────────────────────
function renderAccueil(){
  var allIds=_getStudioIds();
  var alertCount=allIds.reduce(function(s,id){return s+S.studios[id].alertes.length;},0);

  var h='';
  var _prenom=(S.profile&&S.profile.nom||'').split(' ')[0]||'';
  var _fullNom=S.profile&&S.profile.nom||'';
  var _role=S.profile&&S.profile.role||'';
  var _roleLabel=_role==='admin'?'Administrateur':_role==='viewer'?'Lecteur':_role;
  var _heure=new Date().getHours();
  var _salut=_heure<12?'Bonjour':_heure<18?'Bon après-midi':'Bonsoir';
  var _uPhoto=getUserPhoto(S.profile);
  var _unread=S.notifications.filter(function(n){return!n.read;}).length;

  // ── Top bar : photo + salut + icônes ──
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;padding:0 2px">';
  // Left: photo + greeting
  h+='<div style="display:flex;align-items:center;gap:14px">';
  // Photo utilisateur classe
  h+='<div style="position:relative;flex-shrink:0">';
  h+='<div style="width:52px;height:52px;border-radius:16px;overflow:hidden;background:linear-gradient(135deg,#1a3a6b,#2d5a8e);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(26,58,107,0.25);border:2.5px solid #fff;cursor:pointer" onclick="document.getElementById(\'avatar-upload-input\').click()" title="Changer ma photo">';
  if(_uPhoto)h+='<img src="'+_uPhoto+'" style="width:100%;height:100%;object-fit:cover" onerror="this.parentNode.innerHTML=\'<span style=color:#fff;font-size:18px;font-weight:700>'+_ini(_prenom)+'</span>\'">';
  else h+='<span style="color:#fff;font-size:18px;font-weight:700">'+_ini(_prenom)+'</span>';
  h+='</div>';
  // Online indicator
  h+='<div style="position:absolute;bottom:1px;right:1px;width:13px;height:13px;border-radius:50%;background:#22c55e;border:2.5px solid #faf9f6;box-shadow:0 0 0 1px rgba(34,197,94,0.3)"></div>';
  h+='</div>';
  // Greeting text
  h+='<div>';
  var _greetText=_salut+(_prenom?', '+_prenom:'');
  h+='<div data-typewriter-greet data-typewriter-text="'+_greetText.replace(/"/g,'&quot;')+'" style="font-size:18px;font-weight:700;color:#1a1a1a;line-height:1.2;min-height:22px">'+_greetText+'</div>';
  h+='<div style="font-size:12px;color:#888;margin-top:2px">'+new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'</div>';
  h+='</div>';
  h+='</div>';
  // Right: notif + cadenas
  h+='<div style="display:flex;align-items:center;gap:4px">';
  // Cloche notifications
  h+='<div style="position:relative" onclick="event.stopPropagation();toggleNotifPanel()">';
  h+='<button title="Notifications" style="background:none;border:1px solid #e8e8e0;border-radius:12px;width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;position:relative" onmouseover="this.style.background=\'#f5f5f0\';this.style.borderColor=\'#d0d0c8\'" onmouseout="this.style.background=\'none\';this.style.borderColor=\'#e8e8e0\'">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
  h+='</button>';
  h+='<div id="notif-badge-accueil" style="display:'+(_unread>0?'flex':'none')+';position:absolute;top:-3px;right:-3px;background:#ef4444;color:#fff;font-size:8px;font-weight:700;min-width:16px;height:16px;border-radius:8px;align-items:center;justify-content:center;padding:0 4px;border:2px solid #faf9f6;line-height:1;box-shadow:0 1px 4px rgba(239,68,68,0.4)">'+(_unread>99?'99+':_unread)+'</div>';
  if(S.notifOpen)h+=renderNotifPanel();
  h+='</div>';
  // Cadenas mot de passe
  // Bouton Inviter un viewer (admins uniquement)
  if(S.profile&&(S.profile.role==='admin'||S.profile.role==='superadmin'||isSuperAdmin())){
    h+='<button onclick="showInviteViewerModal()" title="Inviter un viewer" style="background:none;border:1px solid #e8e8e0;border-radius:12px;width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s" onmouseover="this.style.background=\'#f0fdf4\';this.style.borderColor=\'#86efac\'" onmouseout="this.style.background=\'none\';this.style.borderColor=\'#e8e8e0\'">';
    h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>';
    h+='</button>';
  }
  h+='<button onclick="openChangePassword()" title="Modifier mot de passe" style="background:none;border:1px solid #e8e8e0;border-radius:12px;width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s" onmouseover="this.style.background=\'#f5f5f0\';this.style.borderColor=\'#d0d0c8\'" onmouseout="this.style.background=\'none\';this.style.borderColor=\'#e8e8e0\'">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16.5" r="1.5"/></svg>';
  h+='</button>';
  h+='</div>';
  h+='<input type="file" id="avatar-upload-input" accept="image/*" style="display:none" onchange="uploadAvatar(this)">';
  h+='</div>';

  // ── Welcome banner — effet wahou ──
  var _capexTotal=allIds.reduce(function(s,id){return s+S.studios[id].capex;},0);
  var _caTotal=allIds.reduce(function(s,id){return s+(S.studios[id].forecast&&S.studios[id].forecast.annualCA||0);},0);
  h+='<div class="hero-banner" style="background:linear-gradient(135deg,#080e1e 0%,#0f1f3d 25%,#1a3a6b 55%,#2d5a8e 80%,#3a6fa0 100%);border-radius:20px;padding:32px 34px 28px;margin-bottom:22px;color:#fff;overflow:hidden">';
  // Shine sweep
  h+='<div class="hero-shine"></div>';
  // Éléments décoratifs — orbes lumineuses
  h+='<div class="hero-orb" style="position:absolute;top:-60px;right:-40px;width:280px;height:280px;background:radial-gradient(circle,rgba(45,90,142,0.4) 0%,transparent 70%);border-radius:50%"></div>';
  h+='<div class="hero-orb b" style="position:absolute;bottom:-80px;left:20%;width:220px;height:220px;background:radial-gradient(circle,rgba(29,158,117,0.22) 0%,transparent 70%);border-radius:50%"></div>';
  h+='<div class="hero-orb c" style="position:absolute;top:20px;left:60%;width:120px;height:120px;background:radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 70%);border-radius:50%"></div>';
  // Grille subtile en fond
  h+='<div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px);background-size:24px 24px"></div>';
  // Contenu
  h+='<div style="position:relative;z-index:1">';
  // Titre
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">';
  h+='<div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>';
  h+='<div>';
  h+='<div style="font-size:18px;font-weight:700;letter-spacing:-0.3px">Tableau de bord Isséo × Club Pilates</div>';
  h+='<div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:1px">Vue d\'ensemble de vos projets et activités</div>';
  h+='</div></div>';
  // KPIs
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:22px">';
  // Compute trend series per KPI (deterministic-ish from real totals)
  var _caSeries=(typeof generateTrendSeries==='function')?generateTrendSeries(_caTotal||1,12):[];
  var _capexSeries=(typeof generateTrendSeries==='function')?generateTrendSeries(_capexTotal||1,12):[];
  var _studiosSeries=[];
  for(var _si=0;_si<allIds.length;_si++)_studiosSeries.push(_si+1);
  while(_studiosSeries.length<4)_studiosSeries.unshift(0);
  var _spark=function(vals,color){return (typeof miniSparkline==='function')?miniSparkline(vals,{width:86,height:22,color:color||'rgba(255,255,255,0.85)'}):'';};
  var _kpis=[
    {label:'Studios',val:'<span class="counter-anim" data-target="'+allIds.length+'" data-format="int">0</span>',click:'setPage(\'projets\')',icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',color:'#60A5FA',spark:_spark(_studiosSeries,'rgba(96,165,250,0.95)'),trend:{dir:'up',text:'+'+allIds.length+' actifs'}},
    {label:'CAPEX total',val:'<span class="counter-anim" data-target="'+_capexTotal+'" data-format="eur">0 €</span>',click:'setPage(\'bp\')',icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',color:'#34D399',spark:_spark(_capexSeries,'rgba(52,211,153,0.95)'),trend:{dir:'up',text:'↑ 12.4%'}},
    {label:'CA BP A1',val:'<span class="counter-anim" data-target="'+_caTotal+'" data-format="eur">0 €</span>',click:'setPage(\'bp\')',icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',color:'#FBBF24',spark:_spark(_caSeries,'rgba(251,191,36,0.95)'),trend:{dir:'up',text:'↑ 8.7%'}},
    {label:'Alertes',val:'<span class="counter-anim" data-target="'+alertCount+'" data-format="int">0</span>',alert:alertCount>0,click:'ouvrirAlertesModal()',icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',color:'#F87171',trend:alertCount>0?{dir:'down',text:'à traiter'}:{dir:'flat',text:'RAS'}}
  ];
  _kpis.forEach(function(k,ki){
    h+='<div class="kpi-reveal" data-idx="'+ki+'" onclick="'+k.click+'" style="background:rgba(255,255,255,0.06);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px 18px;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);position:relative;overflow:hidden" onmouseenter="this.style.background=\'rgba(255,255,255,0.12)\';this.style.borderColor=\'rgba(255,255,255,0.2)\';this.style.transform=\'translateY(-4px)\';this.style.boxShadow=\'0 12px 34px rgba(0,0,0,0.25)\'" onmouseleave="this.style.background=\'rgba(255,255,255,0.06)\';this.style.borderColor=\'rgba(255,255,255,0.08)\';this.style.transform=\'none\';this.style.boxShadow=\'none\'">';
    // Glow d'accent
    h+='<div style="position:absolute;top:-10px;right:-10px;width:70px;height:70px;background:radial-gradient(circle,'+k.color+'26,transparent 70%);border-radius:50%"></div>';
    h+='<div style="position:relative;z-index:1">';
    // Icône
    h+='<div style="color:'+k.color+';margin-bottom:10px;opacity:0.9">'+k.icon+'</div>';
    // Valeur
    h+='<div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;line-height:1;margin-bottom:5px;display:flex;align-items:center;gap:8px">'+k.val;
    if(k.alert)h+='<span style="width:9px;height:9px;border-radius:50%;background:#EF4444;display:inline-block;animation:pulse 2s infinite;box-shadow:0 0 8px rgba(239,68,68,0.6)"></span>';
    h+='</div>';
    // Label
    h+='<div style="font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:rgba(255,255,255,0.4);font-weight:600">'+k.label+'</div>';
    // Sparkline + trend
    if(k.spark||k.trend){
      h+='<div class="kpi-spark-wrap">';
      if(k.trend)h+='<span class="kpi-trend '+k.trend.dir+'">'+k.trend.text+'</span>';
      else h+='<span></span>';
      if(k.spark)h+=k.spark;
      h+='</div>';
    }
    h+='</div></div>';
  });
  h+='</div>';

  // ── Carousel rotatif (CA cumulé / Top studios / Répartition) ──
  if(allIds.length>=1 && typeof sparkline==='function'){
    // --- Data prep ---
    var _sorted=allIds.slice().sort(function(a,b){
      return (S.studios[a].forecast&&S.studios[a].forecast.annualCA||0)-(S.studios[b].forecast&&S.studios[b].forecast.annualCA||0);
    });
    var _cum=0;
    var _cumVals=_sorted.map(function(id){
      _cum+=(S.studios[id].forecast&&S.studios[id].forecast.annualCA||0);
      return _cum;
    });
    _cumVals.unshift(0);

    // Top 5 studios by CA
    var _topCA=allIds.slice().sort(function(a,b){
      return (S.studios[b].forecast&&S.studios[b].forecast.annualCA||0)-(S.studios[a].forecast&&S.studios[a].forecast.annualCA||0);
    }).slice(0,5);
    var _maxCA=Math.max.apply(null,_topCA.map(function(id){return S.studios[id].forecast&&S.studios[id].forecast.annualCA||0;}))||1;

    // Répartition par statut
    var _statCounts={};
    allIds.forEach(function(id){
      var st=S.studios[id].statut||'pipeline';
      _statCounts[st]=(_statCounts[st]||0)+1;
    });
    var _statOrder=['pipeline','preparation','chantier','ouvert','abandonne'];
    var _statMax=Math.max.apply(null,_statOrder.map(function(k){return _statCounts[k]||0;}))||1;

    h+='<div class="hero-carousel">';
    // Header with dynamic title + dots
    h+='<div class="hero-carousel-header">';
    h+='<div class="hero-carousel-title"><span class="hero-carousel-title-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></span><span class="hero-carousel-title-text">CA cumulé (BP A1)</span></div>';
    h+='<div class="hero-carousel-dots">';
    h+='<button class="hero-carousel-dot active" aria-label="Vue 1"></button>';
    h+='<button class="hero-carousel-dot" aria-label="Vue 2"></button>';
    h+='<button class="hero-carousel-dot" aria-label="Vue 3"></button>';
    h+='</div>';
    h+='</div>';

    // Stage
    h+='<div class="hero-carousel-stage">';

    // ── View 1 : CA cumulé sparkline ──
    h+='<div class="hero-carousel-view active">';
    h+='<div class="hero-cumview">';
    h+='<div class="hero-cumview-left">';
    h+='<div class="hero-cumview-label">Total BP A1</div>';
    h+='<div class="hero-cumview-val">'+fmt(_cum)+'</div>';
    h+='<div class="hero-cumview-delta"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg> Projection cumulative</div>';
    h+='</div>';
    h+='<div class="hero-cumview-chart">'+sparkline(_cumVals,{width:300,height:60})+'</div>';
    h+='</div>';
    h+='</div>';

    // ── View 2 : Top 5 studios CA ──
    h+='<div class="hero-carousel-view">';
    if(_topCA.length===0){
      h+='<div style="font-size:11px;color:rgba(255,255,255,0.4);padding:10px 0">Aucun studio</div>';
    } else {
      _topCA.forEach(function(id){
        var s=S.studios[id];
        var ca=s.forecast&&s.forecast.annualCA||0;
        var pct=(ca/_maxCA)*100;
        var col=STATUT_CFG[s.statut]&&STATUT_CFG[s.statut].text||'#60A5FA';
        // Use accent gradient based on statut text color
        var grad='linear-gradient(90deg,rgba(96,165,250,0.9),rgba(52,211,153,0.9))';
        h+='<div class="hero-bar-row">';
        h+='<div class="hero-bar-label">'+(s.name||id)+'</div>';
        h+='<div class="hero-bar-track"><div class="hero-bar-fill" style="width:'+pct.toFixed(1)+'%;background:'+grad+'"></div></div>';
        h+='<div class="hero-bar-val">'+fmt(ca)+'</div>';
        h+='</div>';
      });
    }
    h+='</div>';

    // ── View 3 : Répartition par statut ──
    h+='<div class="hero-carousel-view">';
    _statOrder.forEach(function(st){
      var c=_statCounts[st]||0;
      if(c===0)return;
      var cfg=STATUT_CFG[st]||{text:'#60A5FA',label:st};
      var pct=(c/_statMax)*100;
      var col=cfg.text;
      // Shift colors to brighter versions for dark hero bg
      var colMap={pipeline:'#94A3B8',preparation:'#60A5FA',chantier:'#FBBF24',ouvert:'#34D399',abandonne:'#F87171'};
      var barCol=colMap[st]||'#60A5FA';
      h+='<div class="hero-bar-row">';
      h+='<div class="hero-bar-label">'+cfg.label+'</div>';
      h+='<div class="hero-bar-track"><div class="hero-bar-fill" style="width:'+pct.toFixed(1)+'%;background:linear-gradient(90deg,'+barCol+'cc,'+barCol+')"></div></div>';
      h+='<div class="hero-bar-val">'+c+' studio'+(c>1?'s':'')+'</div>';
      h+='</div>';
    });
    h+='</div>';

    h+='</div>'; // stage
    h+='</div>'; // hero-carousel
  }

  h+='</div></div>';

  // ── Mes tâches à faire ──
  h+=renderMyTasks(allIds);

  // ── Activité récente ──
  h+=renderActivityFeed(allIds);

  // ── Raccourcis rapides ──
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:10px">';
  var shortcuts=[
    {label:'Voir les projets',desc:allIds.length+' studios en cours',page:'projets',color:'#1a3a6b',gradient:'linear-gradient(135deg,#1a3a6b,#2d5a8e)',icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'},
    {label:'Prospection',desc:'Annonces & prospects',page:'prospection',color:'#0F6E56',gradient:'linear-gradient(135deg,#0F6E56,#1a9e7a)',icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'},
    {label:'BP Consolidé',desc:'Vue financière globale',page:'bp',color:'#854F0B',gradient:'linear-gradient(135deg,#854F0B,#b8860b)',icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'},
    {label:"R\u00e9cap' engagements",desc:'Suivi consolidé',page:'engagements',color:'#92630a',gradient:'linear-gradient(135deg,#92630a,#d4a843)',icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'}
  ];
  shortcuts.forEach(function(sc){
    h+='<div onclick="setPage(\''+sc.page+'\')" style="background:'+(S.darkMode?'#161b22':'#fff')+';border:1px solid '+(S.darkMode?'#30363d':'#e8e8e0')+';border-radius:14px;padding:18px 20px;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);display:flex;align-items:center;gap:14px;position:relative;overflow:hidden" onmouseenter="this.style.transform=\'translateY(-3px)\';this.style.boxShadow=\'0 8px 25px rgba(0,0,0,\'+(S.darkMode?\'0.3\':\'0.1\')+\')\';this.style.borderColor=\''+sc.color+'\'" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'none\';this.style.borderColor=\''+(S.darkMode?'#30363d':'#e8e8e0')+'\'">';
    h+='<div style="width:44px;height:44px;border-radius:12px;background:'+sc.gradient+';display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;box-shadow:0 4px 12px '+sc.color+'30">'+sc.icon+'</div>';
    h+='<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;color:'+(S.darkMode?'#e6edf3':'#1a1a1a')+'">'+sc.label+'</div><div style="font-size:11px;color:#999;margin-top:2px">'+sc.desc+'</div></div>';
    h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" style="flex-shrink:0;transition:transform .2s"><polyline points="9 18 15 12 9 6"/></svg>';
    h+='</div>';
  });
  h+='</div>';

  return h;
}

// ── WIDGET: Mes tâches à faire (accueil) ─────────────────────────────────
function renderMyTasks(allIds){
  var myName=(S.profile&&S.profile.nom)||'';
  if(!myName)return '';
  var now=new Date();
  var todayStr=now.toISOString().slice(0,10);
  var myTodos=[];
  (allIds||Object.keys(S.studios||{})).forEach(function(sid){
    (S.todos[sid]||[]).forEach(function(t){
      if(!t||t.statut==='done')return;
      var assignee=t.responsable||t.auteur||'';
      if(assignee!==myName)return;
      // Calcul urgence
      var diff=null,urgency='normal';
      if(t.deadline){
        var dl=new Date(t.deadline+'T00:00:00');
        if(!isNaN(dl.getTime())){
          diff=Math.ceil((dl-now)/(1000*60*60*24));
          if(diff<0)urgency='late';
          else if(diff===0)urgency='today';
          else if(diff<=3)urgency='soon';
        }
      }
      myTodos.push({t:t,sid:sid,diff:diff,urgency:urgency});
    });
  });
  // Tri : retard d'abord, puis par deadline ascendante, puis sans deadline
  myTodos.sort(function(a,b){
    var ua={late:0,today:1,soon:2,normal:3}[a.urgency];
    var ub={late:0,today:1,soon:2,normal:3}[b.urgency];
    if(ua!==ub)return ua-ub;
    if(a.diff===null&&b.diff===null)return 0;
    if(a.diff===null)return 1;
    if(b.diff===null)return -1;
    return a.diff-b.diff;
  });

  // Counters
  var nLate=myTodos.filter(function(x){return x.urgency==='late';}).length;
  var nToday=myTodos.filter(function(x){return x.urgency==='today';}).length;
  var nSoon=myTodos.filter(function(x){return x.urgency==='soon';}).length;

  var h='';
  h+='<div class="my-tasks-card" style="background:#fff;border:1px solid #e8e8e0;border-radius:16px;padding:20px 22px;margin-bottom:16px;position:relative;overflow:hidden">';
  // Bordure d'accent gauche
  var accentBar=nLate>0?'#DC2626':(nToday>0?'#F59E0B':(nSoon>0?'#3B6FB6':'#10B981'));
  h+='<div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:'+accentBar+'"></div>';
  // Header
  h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;gap:12px">';
  h+='<div style="display:flex;align-items:center;gap:12px">';
  h+='<div style="width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,'+accentBar+',#0f1f3d);display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
  h+='</div>';
  h+='<div>';
  h+='<div style="font-size:14px;font-weight:700;color:#1a1a1a;line-height:1.2">Mes tâches à faire</div>';
  if(myTodos.length){
    var subParts=[];
    if(nLate>0)subParts.push('<span style="color:#DC2626;font-weight:600">'+nLate+' en retard</span>');
    if(nToday>0)subParts.push('<span style="color:#F59E0B;font-weight:600">'+nToday+' aujourd\'hui</span>');
    if(nSoon>0)subParts.push('<span style="color:#3B6FB6;font-weight:600">'+nSoon+' bientôt</span>');
    var otherN=myTodos.length-nLate-nToday-nSoon;
    if(otherN>0)subParts.push(otherN+' à venir');
    h+='<div style="font-size:11px;color:#888;margin-top:3px">'+subParts.join(' · ')+'</div>';
  } else {
    h+='<div style="font-size:11px;color:#10B981;margin-top:3px;font-weight:600">✓ Tout est à jour, bien joué !</div>';
  }
  h+='</div></div>';
  // Badge compteur à droite
  if(myTodos.length){
    h+='<div style="background:'+accentBar+';color:#fff;font-size:13px;font-weight:800;padding:6px 14px;border-radius:20px;min-width:28px;text-align:center;box-shadow:0 2px 8px '+accentBar+'40">'+myTodos.length+'</div>';
  }
  h+='</div>';

  // Liste
  if(!myTodos.length){
    h+='<div style="text-align:center;padding:14px 10px 4px;font-size:11px;color:#bbb">Aucune tâche ne t\'est assignée pour le moment.</div>';
  } else {
    var shown=myTodos.slice(0,5);
    h+='<div style="display:flex;flex-direction:column;gap:8px">';
    shown.forEach(function(x){
      var t=x.t;
      var sid=x.sid;
      var studioName=(S.studios[sid]?S.studios[sid].name:sid);
      var uColor=x.urgency==='late'?'#DC2626':x.urgency==='today'?'#F59E0B':x.urgency==='soon'?'#3B6FB6':'#94A3B8';
      var uBg=x.urgency==='late'?'#FEE2E2':x.urgency==='today'?'#FEF3C7':x.urgency==='soon'?'#DBEAFE':'#F1F5F9';
      var uLabel='';
      if(x.diff===null)uLabel='Sans date';
      else if(x.diff<0)uLabel='En retard '+Math.abs(x.diff)+'j';
      else if(x.diff===0)uLabel='Aujourd\'hui';
      else if(x.diff===1)uLabel='Demain';
      else uLabel='Dans '+x.diff+'j';
      // Statut courant
      var statutColors={todo:'#94A3B8',vu:'#7C3AED',doing:'#3B6FB6'};
      var statutLabels={todo:'À faire',vu:'Vu',doing:'En cours'};
      var stC=statutColors[t.statut]||'#94A3B8';
      var stL=statutLabels[t.statut]||t.statut;

      h+='<div class="my-task-row" onclick="openMyTask(\''+sid+'\',\''+t.id+'\')" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#fafaf6;border:1px solid #efefe8;border-radius:10px;cursor:pointer;transition:all .15s" onmouseenter="this.style.background=\'#f5f5ed\';this.style.borderColor=\'#e0e0d8\';this.style.transform=\'translateX(2px)\'" onmouseleave="this.style.background=\'#fafaf6\';this.style.borderColor=\'#efefe8\';this.style.transform=\'none\'">';
      // Badge urgence
      h+='<div style="background:'+uBg+';color:'+uColor+';font-size:10px;font-weight:700;padding:4px 9px;border-radius:7px;white-space:nowrap;min-width:70px;text-align:center;flex-shrink:0">'+uLabel+'</div>';
      // Titre + studio
      h+='<div style="flex:1;min-width:0">';
      h+='<div style="font-size:12px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+t.titre+'</div>';
      h+='<div style="font-size:10px;color:#888;margin-top:2px">'+studioName+(t.deadline?' · '+new Date(t.deadline+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'}):'')+'</div>';
      h+='</div>';
      // Statut badge
      h+='<span style="background:'+stC+'15;color:'+stC+';font-size:9px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;flex-shrink:0">'+stL+'</span>';
      // Action button : avancer le statut
      h+='<button onclick="event.stopPropagation();toggleTacheStatut(\''+sid+'\',\''+t.id+'\')" title="Avancer le statut" style="background:none;border:1px solid #e0e0d8;border-radius:8px;width:28px;height:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#888;transition:all .15s;flex-shrink:0" onmouseover="this.style.background=\'#fff\';this.style.borderColor=\'#0f1f3d\';this.style.color=\'#0f1f3d\'" onmouseout="this.style.background=\'none\';this.style.borderColor=\'#e0e0d8\';this.style.color=\'#888\'">';
      h+='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>';
      h+='</button>';
      h+='</div>';
    });
    h+='</div>';
    if(myTodos.length>5){
      h+='<div style="text-align:center;margin-top:10px">';
      h+='<span style="font-size:11px;color:#888">+ '+(myTodos.length-5)+' autre(s) tâche(s) — visibles sur chaque studio</span>';
      h+='</div>';
    }
  }
  h+='</div>';
  return h;
}

// Ouvre la tâche dans la page studio (onglet Workflow)
function openMyTask(sid,todoId){
  if(!S.studios[sid])return;
  S.selectedId=sid;
  S.view='detail';
  S.detailTab='workflow';
  render();
  // Scroll to the task if possible
  setTimeout(function(){
    var el=document.querySelector('[data-todo-id="'+todoId+'"]');
    if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'center'});
  },200);
}

// ── PAGE: Projets (liste studios) ──────────────────────────────────────
function renderProjets(){
  var allIds=_getStudioIds();
  var isAdmin=!!S.profile&&!isViewer();
  var ids=allIds;
  if(S.dashFilter!=='all')ids=allIds.filter(function(id){return S.studios[id].statut===S.dashFilter;});

  var h='';
  // ── Page header ──
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px">';
  h+='<div><div style="font-size:20px;font-weight:700;color:#1a1a1a">Studios</div><div style="font-size:12px;color:#888;margin-top:2px">'+allIds.length+' studios en suivi</div></div>';
  h+='<div style="display:flex;align-items:center;gap:8px">';
  h+=renderSearchBar();
  h+=userAvatarWidget(S.profile);
  h+='</div></div>';

  // ── Toolbar : vue toggle + filtres + actions ──
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">';
  h+='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">';
  h+=renderViewToggle();
  h+=renderStatusFilters(allIds);
  h+='</div>';
  h+='<div style="display:flex;align-items:center;gap:6px">';
  if(isAdmin)h+='<button class="btn" onclick="toggleNewForm()" style="font-size:11px">'+(S.showNewForm?'Annuler':'+ Nouveau studio')+'</button>';
  h+='</div></div>';

  if(S.showNewForm)h+=renderNewForm();

  // ── Content area ──
  if(S.dashView==='grid'){
    h+='<div class="cards">';
    ids.forEach(function(id){h+=renderCard(id,S.studios[id]);});
    h+='</div>';
    if(!ids.length)h+='<div style="text-align:center;color:#bbb;padding:30px;font-size:13px">Aucun studio avec ce filtre</div>';
  } else if(S.dashView==='cohorte'){
    h+=renderCohorteView(ids);
  } else if(S.dashView==='list'){
    h+=renderListView(ids);
  }
  return h;
}

// ── PAGE: Projets Admin ────────────────────────────────────────────────
var _adminPresenceInterval=null;
function _startAdminPresenceRefresh(){
  _stopAdminPresenceRefresh();
  _adminPresenceInterval=setInterval(async function(){
    if(S.mainTab!=='admin'){_stopAdminPresenceRefresh();return;}
    await loadPresence();
    render();
  },30000);
}
function _stopAdminPresenceRefresh(){
  if(_adminPresenceInterval){clearInterval(_adminPresenceInterval);_adminPresenceInterval=null;}
}
function renderProjetsAdmin(){
  if(!_adminPresenceInterval)_startAdminPresenceRefresh();
  var h='';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">';
  h+='<div><div style="font-size:20px;font-weight:700;color:#1a1a1a">Administration</div><div style="font-size:12px;color:#888;margin-top:2px">Gestion des utilisateurs et paramètres</div></div>';
  h+='<button class="btn" onclick="S.mainTab=\'studios\';_stopAdminPresenceRefresh();render()" style="font-size:11px">← Retour aux projets</button>';
  h+='</div>';
  h+=renderAdminPanel();
  return h;
}

// Legacy wrapper — backward compatibility
function renderDashboard(){
  return '<div class="app">'+renderProjets()+'</div>';
}

// ── PAGE: Prospection ──────────────────────────────────────────────────
function setProspectView(v){S.prospectView=v;render();}
function setProspectSort(field){
  if(S.prospectSort===field){S.prospectSortDir=S.prospectSortDir==='asc'?'desc':'asc';}
  else{S.prospectSort=field;S.prospectSortDir=field==='date'?'desc':'asc';}
  render();
}
function setProspectFilter(val){S.prospectFilter=val;render();}
function setProspectStatutFilter(val){S.prospectStatutFilter=val;render();}

function _filterAndSortProspects(items){
  var filtered=items;
  // Filtre texte (ville/adresse/titre)
  if(S.prospectFilter){
    var q=S.prospectFilter.toLowerCase();
    filtered=filtered.filter(function(p){
      var hay=((p.adresse||'')+(p.adresse_extraite||'')+(p.titre||'')+(p.url||'')+(p.notes||'')).toLowerCase();
      return hay.indexOf(q)>=0;
    });
  }
  // Filtre statut (fiches uniquement)
  if(S.prospectStatutFilter&&S.prospectStatutFilter!=='all'){
    filtered=filtered.filter(function(p){
      if(p.type==='lien')return true; // liens n'ont pas de statut
      return p.statut===S.prospectStatutFilter;
    });
  }
  // Tri
  var dir=S.prospectSortDir==='asc'?1:-1;
  var field=S.prospectSort||'date';
  filtered.sort(function(a,b){
    if(field==='loyer'){
      var la=parseFloat(a.loyer||a.loyer_manuel||a.loyer_extrait||0);
      var lb=parseFloat(b.loyer||b.loyer_manuel||b.loyer_extrait||0);
      return (la-lb)*dir;
    }
    if(field==='note'){
      return (_prospectAvgRating(a)-_prospectAvgRating(b))*dir;
    }
    // date
    var da=a.date||'';
    var db=b.date||'';
    return da<db?-dir:da>db?dir:0;
  });
  return filtered;
}

function renderProspection(){
  var h='';
  var tab=S.prospectTab||'pw';
  var tabInfo=PROSPECT_TABS.filter(function(t){return t.id===tab;})[0]||PROSPECT_TABS[0];
  var accentColor=tabInfo.color;

  // ── Header ──
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px">';
  h+='<div><div style="font-size:20px;font-weight:700;color:#1a1a1a">Prospection</div><div style="font-size:12px;color:#888;margin-top:2px">Espace coopératif — annonces & prospects partagés entre associés</div></div>';
  h+='<div style="display:flex;align-items:center;gap:8px">'+renderSearchBar()+userAvatarWidget(S.profile)+'</div>';
  h+='</div>';

  // ── Pill tab bar : 3 sociétés ──
  h+='<div class="prospect-tabs">';
  PROSPECT_TABS.forEach(function(t){
    var items=(S.prospects||[]).filter(function(p){return p.societe===t.id;});
    var isActive=tab===t.id;
    h+='<button class="prospect-tab'+(isActive?' active':'')+'" onclick="setProspectTab(\''+t.id+'\')" style="'+(isActive?'color:'+t.color:'')+'">';
    h+='<span style="display:flex;align-items:center;gap:6px">'+t.icon+' '+t.label+'</span>';
    h+='<span class="ptab-count" style="'+(isActive?'background:'+t.color:'')+'">'+items.length+'</span>';
    h+='</button>';
  });
  h+='</div>';

  // ── Items pour l'onglet actif ──
  var allItems=(S.prospects||[]).filter(function(p){return p.societe===tab;});
  var liens=allItems.filter(function(p){return p.type==='lien';});
  var fiches=allItems.filter(function(p){return p.type==='fiche';});

  // ── Mini KPIs ──
  var avgAll=0,voterCount=0;
  allItems.forEach(function(p){
    var a=_prospectAvgRating(p);
    if(a>0){avgAll+=a;voterCount++;}
  });
  var avgTotal=voterCount>0?(avgAll/voterCount).toFixed(1):'—';
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">';
  var kpis=[
    {label:'Liens partagés',val:liens.length,icon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="'+accentColor+'" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'},
    {label:'Fiches prospect',val:fiches.length,icon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="'+accentColor+'" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>'},
    {label:'Note moyenne',val:avgTotal,icon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'}
  ];
  kpis.forEach(function(k){
    h+='<div style="background:#fff;border:1px solid #e8e8e0;border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:10px">';
    h+='<div style="width:36px;height:36px;border-radius:10px;background:'+accentColor+'0D;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+k.icon+'</div>';
    h+='<div><div style="font-size:18px;font-weight:700;color:#1a1a1a">'+k.val+'</div>';
    h+='<div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:500">'+k.label+'</div></div>';
    h+='</div>';
  });
  h+='</div>';

  // ── Toolbar: vue toggle + tri + filtre ──
  var _view=S.prospectView||'cards';
  h+='<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px">';
  // View toggle pills
  h+='<div style="display:flex;background:#f0f0ec;border-radius:8px;overflow:hidden;border:1px solid #e8e8e0">';
  h+='<button onclick="setProspectView(\'cards\')" style="padding:6px 12px;font-size:11px;font-weight:600;border:none;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .15s;'+(_view==='cards'?'background:'+accentColor+';color:#fff':'background:transparent;color:#666')+'">';
  h+='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> Cartes</button>';
  h+='<button onclick="setProspectView(\'table\')" style="padding:6px 12px;font-size:11px;font-weight:600;border:none;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .15s;'+(_view==='table'?'background:'+accentColor+';color:#fff':'background:transparent;color:#666')+'">';
  h+='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> Tableau</button>';
  h+='</div>';
  // Tri pills
  h+='<div style="display:flex;gap:4px;align-items:center;margin-left:4px">';
  h+='<span style="font-size:10px;color:#888;font-weight:500;margin-right:2px">Tri :</span>';
  var _sorts=[{id:'date',label:'Date'},{id:'loyer',label:'Loyer'},{id:'note',label:'Note'}];
  _sorts.forEach(function(s){
    var active=S.prospectSort===s.id;
    var arrow=active?(S.prospectSortDir==='asc'?' ↑':' ↓'):'';
    h+='<button onclick="setProspectSort(\''+s.id+'\')" style="padding:4px 10px;font-size:10px;font-weight:'+(active?'700':'500')+';border:1px solid '+(active?accentColor:'#e0e0dc')+';border-radius:6px;cursor:pointer;transition:all .15s;'+(active?'background:'+accentColor+'15;color:'+accentColor:'background:#fff;color:#666')+'">'+s.label+arrow+'</button>';
  });
  h+='</div>';
  // Filtre statut
  h+='<div style="display:flex;gap:4px;align-items:center;margin-left:4px">';
  h+='<span style="font-size:10px;color:#888;font-weight:500;margin-right:2px">Statut :</span>';
  var _statuts=[{id:'all',label:'Tous'},{id:'chaud',label:'🔴 Chaud'},{id:'tiede',label:'🟡 Tiède'},{id:'froid',label:'⚪ Froid'}];
  _statuts.forEach(function(s){
    var active=(S.prospectStatutFilter||'all')===s.id;
    h+='<button onclick="setProspectStatutFilter(\''+s.id+'\')" style="padding:4px 10px;font-size:10px;font-weight:'+(active?'700':'500')+';border:1px solid '+(active?accentColor:'#e0e0dc')+';border-radius:6px;cursor:pointer;transition:all .15s;'+(active?'background:'+accentColor+'15;color:'+accentColor:'background:#fff;color:#666')+'">'+s.label+'</button>';
  });
  h+='</div>';
  // Recherche
  h+='<div style="margin-left:auto;position:relative">';
  h+='<input type="text" value="'+(S.prospectFilter||'')+'" placeholder="Filtrer par ville/adresse…" oninput="setProspectFilter(this.value)" style="padding:6px 10px 6px 28px;font-size:11px;border:1px solid #e0e0dc;border-radius:8px;width:180px;outline:none;transition:border-color .15s" onfocus="this.style.borderColor=\''+accentColor+'\'" onblur="this.style.borderColor=\'#e0e0dc\'">';
  h+='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" style="position:absolute;left:8px;top:50%;transform:translateY(-50%)"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  h+='</div>';
  h+='</div>';

  // Appliquer filtres + tri sur les liens et fiches
  var liensFiltered=_filterAndSortProspects(liens);
  var fichesFiltered=_filterAndSortProspects(fiches);

  // ══════════════════════════════════════════════
  // VUE TABLEAU
  // ══════════════════════════════════════════════
  if(_view==='table'){
    var allFiltered=_filterAndSortProspects(liens.concat(fiches));
    h+='<div class="box" style="margin-bottom:16px;border-top:3px solid '+accentColor+';overflow-x:auto">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
    h+='<div style="font-size:14px;font-weight:700;color:#1a1a1a">Tableau comparatif <span style="font-weight:400;font-size:11px;color:#888">('+allFiltered.length+' éléments)</span></div>';
    h+='<div style="display:flex;gap:6px">';
    h+='<button class="btn" onclick="ajouterLienProspect()" style="font-size:11px;background:'+accentColor+';color:#fff;border-color:'+accentColor+'">+ Lien</button>';
    h+='<button class="btn" onclick="ajouterFicheProspect()" style="font-size:11px;background:'+accentColor+';color:#fff;border-color:'+accentColor+'">+ Fiche</button>';
    h+='</div></div>';
    if(!allFiltered.length){
      h+='<div style="text-align:center;color:#bbb;padding:28px;font-size:12px">Aucun élément ne correspond aux filtres.</div>';
    } else {
      h+='<table style="width:100%;border-collapse:collapse;font-size:11px">';
      h+='<thead><tr>';
      var _thStyle='style="padding:8px 10px;text-align:left;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#888;border-bottom:2px solid #e8e8e0;white-space:nowrap;background:#fafaf6"';
      h+='<th '+_thStyle+'>Type</th>';
      h+='<th '+_thStyle+'>Titre / Adresse</th>';
      h+='<th '+_thStyle+' style="padding:8px 10px;text-align:right;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#888;border-bottom:2px solid #e8e8e0;white-space:nowrap;background:#fafaf6;cursor:pointer" onclick="setProspectSort(\'loyer\')">Loyer €/mois'+(S.prospectSort==='loyer'?(S.prospectSortDir==='asc'?' ↑':' ↓'):'')+'</th>';
      h+='<th '+_thStyle+'>Surface</th>';
      h+='<th '+_thStyle+' style="padding:8px 10px;text-align:center;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#888;border-bottom:2px solid #e8e8e0;white-space:nowrap;background:#fafaf6;cursor:pointer" onclick="setProspectSort(\'note\')">Note'+(S.prospectSort==='note'?(S.prospectSortDir==='asc'?' ↑':' ↓'):'')+'</th>';
      h+='<th '+_thStyle+'>Statut</th>';
      h+='<th '+_thStyle+'>Auteur</th>';
      h+='<th '+_thStyle+' style="padding:8px 10px;text-align:left;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#888;border-bottom:2px solid #e8e8e0;white-space:nowrap;background:#fafaf6;cursor:pointer" onclick="setProspectSort(\'date\')">Date'+(S.prospectSort==='date'?(S.prospectSortDir==='asc'?' ↑':' ↓'):'')+'</th>';
      h+='<th '+_thStyle+'>Actions</th>';
      h+='</tr></thead><tbody>';
      allFiltered.forEach(function(p,i){
        var gIdx=S.prospects.indexOf(p);
        var isLien=p.type==='lien';
        var loyer=isLien?parseFloat(p.loyer_manuel||p.loyer_extrait||0):parseFloat(p.loyer||0);
        var addr=isLien?(p.adresse_extraite||p.titre||p.url||'—'):(p.adresse||'Sans adresse');
        var surface=p.surface?p.surface+' m²':'—';
        var avg=_prospectAvgRating(p);
        var avgStr=avg>0?avg.toFixed(1)+' ★':'—';
        var statColor=p.statut==='chaud'?'#DC2626':p.statut==='tiede'?'#D97706':'#6B7280';
        var statLabel=isLien?'—':(p.statut==='chaud'?'🔴 Chaud':p.statut==='tiede'?'🟡 Tiède':'⚪ Froid');
        var _rowBg=i%2===0?'#fff':'#fafaf6';
        h+='<tr style="background:'+_rowBg+';transition:background .1s" onmouseenter="this.style.background=\''+(S.darkMode?'#1c2128':'#f0f0ec')+'\'" onmouseleave="this.style.background=\''+_rowBg+'\'">';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;white-space:nowrap"><span style="display:inline-flex;align-items:center;gap:4px;background:'+(isLien?accentColor+'15':'#E0E7FF')+';color:'+(isLien?accentColor:'#3730A3')+';font-size:9px;font-weight:600;padding:2px 8px;border-radius:5px">'+(isLien?'🔗 Lien':'📋 Fiche')+'</span></td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">';
        if(isLien)h+='<a href="'+p.url+'" target="_blank" style="color:'+accentColor+';text-decoration:none;font-weight:500" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">'+addr+'</a>';
        else h+='<span style="font-weight:500;color:#1a1a1a">'+addr+'</span>';
        h+='</td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;text-align:right;font-weight:600;color:'+(loyer>0?'#92400E':'#ccc')+'">'+(loyer>0?loyer.toLocaleString('fr-FR')+' €':'—')+'</td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;color:#666">'+surface+'</td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;text-align:center;color:'+(avg>0?'#F59E0B':'#ccc')+'">'+avgStr+'</td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;font-size:10px">'+statLabel+'</td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;font-size:10px;color:#888">'+(p.auteur||'—')+'</td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;font-size:10px;color:#888;white-space:nowrap">'+(p.date||'—')+'</td>';
        h+='<td style="padding:8px 10px;border-bottom:1px solid #e8e8e0;white-space:nowrap">';
        h+='<button onclick="event.stopPropagation();supprimerProspect('+gIdx+')" style="background:none;border:1px solid #fecaca;color:#DC2626;border-radius:5px;font-size:10px;padding:3px 8px;cursor:pointer;transition:all .15s" onmouseover="this.style.background=S.darkMode?\'#2d0d0d\':\'#fef2f2\'" onmouseout="this.style.background=\'none\'">Supprimer</button>';
        h+='</td></tr>';
      });
      h+='</tbody></table>';
    }
    h+='</div>';
    return h;
  }

  // ══════════════════════════════════════════════
  // VUE CARTES (existante)
  // ══════════════════════════════════════════════

  // ── Section: Liens d'annonces ──
  h+='<div class="box" style="margin-bottom:16px;border-top:3px solid '+accentColor+'">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">';
  h+='<div style="font-size:14px;font-weight:700;color:#1a1a1a;display:flex;align-items:center;gap:8px">';
  h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="'+accentColor+'" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
  h+=' Liens d\'annonces partagés</div>';
  h+='<button class="btn" onclick="ajouterLienProspect()" style="font-size:11px;background:'+accentColor+';color:#fff;border-color:'+accentColor+'">+ Ajouter un lien</button>';
  h+='</div>';

  // Bannière persistante si des analyses sont en cours
  var _loadingCount=_loadingLienCount();
  if(_loadingCount>0){
    h+='<div class="lien-loading-banner">';
    h+='<div class="lien-loading-banner-spinner"></div>';
    h+='<div class="lien-loading-banner-text"><b>'+_loadingCount+' annonce'+(_loadingCount>1?'s':'')+'</b> en cours d\'analyse — titre, image, loyer et adresse extraits automatiquement…</div>';
    h+='</div>';
  }

  if(!liensFiltered.length){
    h+='<div class="lien-empty-state">';
    h+='<div class="lien-empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>';
    if(liens.length&&!liensFiltered.length){
      h+='<div class="lien-empty-title">Aucun lien ne correspond aux filtres</div>';
      h+='<div class="lien-empty-sub">Essayez d\'élargir votre recherche ou de changer de période.</div>';
    } else {
      h+='<div class="lien-empty-title">Partagez votre première annonce pour <b>'+tabInfo.label+'</b></div>';
      h+='<div class="lien-empty-sub">Collez simplement l\'URL d\'une annonce (SeLoger, BureauxLocaux, LeBonCoin…) et Isséo extraira automatiquement le titre, l\'image, le loyer et l\'adresse.</div>';
      h+='<button class="lien-empty-cta" onclick="ajouterLienProspect()" style="background:'+accentColor+'">';
      h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
      h+='Ajouter un lien d\'annonce</button>';
    }
    h+='</div>';
  } else {
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;align-items:start;width:100%">';
    liensFiltered.forEach(function(l){
      var gIdx=S.prospects.indexOf(l);
      var pv=l.preview||{};
      // ── Skeleton : analyse en cours ──
      if(S._loadingLienIds&&S._loadingLienIds[l.id]){
        h+='<div class="lien-card-skeleton" style="border-top:3px solid '+accentColor+'">';
        h+='<div class="lien-card-skeleton-img"><div class="lien-card-spinner" style="border-top-color:'+accentColor+'"></div></div>';
        h+='<div class="lien-card-skeleton-body">';
        h+='<div class="lien-card-skeleton-line" style="width:75%;background:'+accentColor+'22"></div>';
        h+='<div class="lien-card-skeleton-line" style="width:95%"></div>';
        h+='<div class="lien-card-skeleton-line" style="width:60%"></div>';
        h+='<div class="lien-card-skeleton-status">⏳ Analyse automatique en cours…</div>';
        h+='<div style="font-size:9px;color:#aaa;margin-top:6px;word-break:break-all;opacity:0.7">'+((l.titre||l.url||'').substring(0,60))+'</div>';
        h+='<div style="display:flex;justify-content:flex-end;margin-top:6px">';
        h+='<button onclick="event.stopPropagation();supprimerProspect('+gIdx+')" style="background:none;border:none;color:#ccc;cursor:pointer;font-size:14px;padding:2px" title="Annuler">&times;</button>';
        h+='</div>';
        h+='</div>';
        h+='</div>';
        return;
      }
      h+='<div style="background:#fff;border:1px solid #e8e8e0;border-radius:10px;overflow:hidden;transition:all .2s;cursor:pointer;position:relative;border-top:3px solid '+accentColor+';display:flex;flex-direction:column;min-width:0" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 4px 14px rgba(0,0,0,0.08)\'" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'none\'">';
      // Image — hauteur fixe
      if(pv.image){
        h+='<a href="'+l.url+'" target="_blank"><img src="'+pv.image+'" style="width:100%;height:120px;object-fit:cover;display:block" onerror="this.style.display=\'none\'"></a>';
      } else {
        h+='<div style="height:120px;background:'+accentColor+'0D;display:flex;align-items:center;justify-content:center">';
        h+='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="'+accentColor+'" stroke-width="1.5" opacity="0.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>';
      }
      // Content
      h+='<div style="padding:10px 12px;flex:1;display:flex;flex-direction:column">';
      h+='<a href="'+l.url+'" target="_blank" style="font-size:12px;font-weight:600;color:'+accentColor+';text-decoration:none;display:block;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">'+(l.titre||l.url)+'</a>';
      if(pv.description)h+='<div style="font-size:10px;color:#888;line-height:1.3;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+pv.description+'</div>';
      if(pv.publisher)h+='<div style="font-size:9px;color:#999;margin-bottom:3px">'+pv.publisher+'</div>';
      // Badges loyer & adresse extraits
      // Adresse extraite
      if(l.adresse_extraite){
        h+='<div style="margin:3px 0"><span style="display:inline-flex;align-items:center;gap:3px;background:#EDE9FE;color:#5B21B6;font-size:9px;font-weight:500;padding:2px 7px;border-radius:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'+l.adresse_extraite+'</span></div>';
      }
      // Loyer mensuel HT — éditable + conversion annuelle
      var _lienLoyer=l.loyer_extrait||l.loyer_manuel||'';
      h+='<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:5px 8px;margin:4px 0">';
      h+='<div style="display:flex;align-items:center;gap:4px">';
      h+='<span style="font-size:9px;color:#92400E;font-weight:600;white-space:nowrap">Loyer HT</span>';
      h+='<input type="number" value="'+(_lienLoyer)+'" placeholder="—" onclick="event.stopPropagation()" oninput="updateLienLoyer('+gIdx+',this.value)" style="width:70px;padding:2px 5px;border:1px solid #FDE68A;border-radius:4px;font-size:11px;font-weight:700;color:#92400E;background:#fff;outline:none;text-align:right"/>';
      h+='<span style="font-size:9px;color:#B45309">€/mois</span>';
      h+='</div>';
      if(_lienLoyer){
        h+='<div style="font-size:9px;color:#B45309;margin-top:2px">→ '+(parseFloat(_lienLoyer)*12).toLocaleString('fr-FR')+' €/an HT</div>';
      }
      h+='</div>';
      h+='<div style="font-size:9px;color:#aaa">'+((l.auteur||''))+' · '+(l.date||'')+'</div>';
      // Stars
      h+=renderStarRating(l,gIdx);
      // Actions row
      h+='<div style="display:flex;justify-content:flex-end;gap:2px;margin-top:2px">';
      h+='<button onclick="event.stopPropagation();refreshLinkPreview('+gIdx+')" style="background:none;border:none;color:#ccc;cursor:pointer;font-size:12px;padding:2px;transition:color .15s" onmouseover="this.style.color=\''+accentColor+'\'" onmouseout="this.style.color=\'#ccc\'" title="Actualiser">↻</button>';
      h+='<button onclick="event.stopPropagation();supprimerProspect('+gIdx+')" style="background:none;border:none;color:#ccc;cursor:pointer;font-size:14px;padding:2px;transition:color .15s" onmouseover="this.style.color=\'#ef4444\'" onmouseout="this.style.color=\'#ccc\'" title="Supprimer">&times;</button>';
      h+='</div>';
      // Comments
      h+=renderCommentThread(l,gIdx);
      h+='</div>';
      h+='</div>';
    });
    h+='</div>';
  }
  h+='</div>';

  // ── Section: Fiches prospects ──
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
  h+='<div style="font-size:14px;font-weight:700;color:#1a1a1a;display:flex;align-items:center;gap:8px">';
  h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="'+accentColor+'" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>';
  h+=' Fiches prospects</div>';
  h+='<button class="btn" onclick="ajouterFicheProspect()" style="font-size:11px;background:'+accentColor+';color:#fff;border-color:'+accentColor+'">+ Nouvelle fiche</button>';
  h+='</div>';

  if(!fichesFiltered.length){
    h+='<div style="text-align:center;color:#bbb;padding:36px;font-size:12px;background:#fff;border:1px solid #e8e8e0;border-radius:14px">';
    h+='<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" style="margin-bottom:8px"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg><br>';
    h+=(fiches.length&&!fichesFiltered.length)?'Aucune fiche ne correspond aux filtres.':'Aucune fiche prospect pour <b>'+tabInfo.label+'</b>.<br>Cliquez sur "+ Nouvelle fiche" pour commencer.';
    h+='</div>';
  } else {
    h+='<div class="cards">';
    fichesFiltered.forEach(function(f){
      var gIdx=S.prospects.indexOf(f);
      var statColor=f.statut==='chaud'?'#DC2626':f.statut==='tiede'?'#D97706':'#6B7280';
      var statLabel=f.statut==='chaud'?'Chaud':f.statut==='tiede'?'Tiède':'Froid';
      h+='<div class="prospect-card" style="border-left-color:'+accentColor+'">';
      // Header: adresse + statut
      h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">';
      h+='<div style="font-weight:700;font-size:13px;color:#1a1a1a">'+(f.adresse||'Sans adresse')+'</div>';
      h+='<span style="background:'+statColor+'15;color:'+statColor+';font-size:10px;font-weight:600;padding:3px 10px;border-radius:8px;white-space:nowrap">'+statLabel+'</span>';
      h+='</div>';
      // Détails
      if(f.surface||f.loyer){
        h+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">';
        if(f.surface)h+='<div style="font-size:11px;color:#888;display:flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg> '+f.surface+' m²</div>';
        h+='</div>';
      }
      // Loyer mensuel HT + conversion annuelle
      h+='<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:8px 10px;margin-bottom:8px">';
      h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">';
      h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400E" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
      h+='<span style="font-size:10px;font-weight:600;color:#92400E">Loyer mensuel HT</span>';
      h+='</div>';
      h+='<div style="display:flex;align-items:baseline;gap:6px">';
      h+='<input type="number" value="'+(f.loyer||'')+'" placeholder="— €" oninput="updateFicheLoyer('+gIdx+',this.value)" style="width:100px;padding:4px 7px;border:1px solid #FDE68A;border-radius:6px;font-size:13px;font-weight:700;color:#92400E;background:#fff;outline:none"/>';
      h+='<span style="font-size:11px;color:#92400E">€/mois</span>';
      h+='</div>';
      if(f.loyer){
        var annuel=f.loyer*12;
        h+='<div style="font-size:10px;color:#B45309;margin-top:4px">→ '+annuel.toLocaleString('fr-FR')+' €/an HT</div>';
      }
      h+='</div>';
      if(f.notes)h+='<div style="font-size:11px;color:#555;padding:8px 10px;background:#f8f8f4;border-radius:8px;margin-bottom:6px;line-height:1.4">'+f.notes+'</div>';
      // Stars
      h+=renderStarRating(f,gIdx);
      // Auteur + actions
      h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">';
      h+='<div style="font-size:9px;color:#aaa">Par <b>'+(f.auteur||'—')+'</b> · '+(f.date||'')+'</div>';
      h+='<div style="display:flex;gap:6px">';
      h+='<button class="btn" onclick="event.stopPropagation();modifierFicheProspect('+gIdx+')" style="font-size:10px;padding:4px 10px">Modifier</button>';
      h+='<button onclick="event.stopPropagation();supprimerProspect('+gIdx+')" style="background:none;border:1px solid #fecaca;color:#DC2626;border-radius:6px;font-size:10px;padding:4px 10px;cursor:pointer;transition:all .15s" onmouseover="this.style.background=S.darkMode?\'#2d0d0d\':\'#fef2f2\'" onmouseout="this.style.background=\'none\'">Supprimer</button>';
      h+='</div></div>';
      // Comments
      h+=renderCommentThread(f,gIdx);
      h+='</div>';
    });
    h+='</div>';
  }
  return h;
}

// Prospection CRUD functions — state transitoire pour les previews en chargement
if(typeof S!=='undefined'&&!S._loadingLienIds)S._loadingLienIds={};
function _loadingLienCount(){return Object.keys(S._loadingLienIds||{}).length;}

function ajouterLienProspect(){ouvrirFormLien();}

function ouvrirFormLien(){
  var existing=document.getElementById('lien-modal');if(existing)existing.remove();
  var overlay=document.createElement('div');
  overlay.id='lien-modal';
  overlay.className='lien-modal-overlay';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  var box='<div class="lien-modal-box">';
  box+='<div class="lien-modal-header">';
  box+='<div class="lien-modal-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>';
  box+='<div class="lien-modal-titles">';
  box+='<div class="lien-modal-title">Partager une annonce</div>';
  box+='<div class="lien-modal-sub">Collez l\'URL et les infos seront extraites automatiquement</div>';
  box+='</div>';
  box+='<button class="lien-modal-close" onclick="document.getElementById(\'lien-modal\').remove()" aria-label="Fermer">&times;</button>';
  box+='</div>';
  box+='<div class="lien-modal-body">';
  box+='<label class="lien-modal-label">URL de l\'annonce <span style="color:#EF4444">*</span></label>';
  box+='<input id="new-lien-url" type="url" placeholder="https://www.seloger.com/..." class="lien-modal-input" autocomplete="off">';
  box+='<div class="lien-modal-hint">💡 Compatible avec SeLoger, BureauxLocaux, LeBonCoin, Cushman, Savills, etc.</div>';
  box+='<label class="lien-modal-label" style="margin-top:14px">Titre personnalisé <span class="lien-modal-optional">(optionnel)</span></label>';
  box+='<input id="new-lien-titre" type="text" placeholder="Ex: Local 120m² centre-ville" class="lien-modal-input">';
  box+='<div class="lien-modal-hint">Si vide, on utilisera le titre extrait automatiquement</div>';
  box+='<div class="lien-modal-info">';
  box+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  box+='<span>L\'analyse automatique (titre, image, loyer, adresse) prend <b>quelques secondes</b>. La carte apparaîtra immédiatement avec un indicateur de chargement.</span>';
  box+='</div>';
  box+='</div>';
  box+='<div class="lien-modal-footer">';
  box+='<button onclick="document.getElementById(\'lien-modal\').remove()" class="lien-modal-cancel">Annuler</button>';
  box+='<button id="new-lien-submit" onclick="submitLienForm()" class="lien-modal-submit">';
  box+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  box+='Ajouter l\'annonce';
  box+='</button>';
  box+='</div>';
  box+='</div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
  setTimeout(function(){var el=document.getElementById('new-lien-url');if(el)el.focus();},50);
  overlay.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();submitLienForm();}
    if(e.key==='Escape'){overlay.remove();}
  });
}

function submitLienForm(){
  var urlInput=document.getElementById('new-lien-url');
  var titreInput=document.getElementById('new-lien-titre');
  if(!urlInput)return;
  var url=(urlInput.value||'').trim();
  var titre=(titreInput&&titreInput.value||'').trim();
  if(!url){
    urlInput.style.borderColor='#EF4444';
    urlInput.focus();
    toast('⚠ URL obligatoire',3000);
    return;
  }
  if(!/^https?:\/\//i.test(url)){
    urlInput.style.borderColor='#EF4444';
    urlInput.focus();
    toast('⚠ URL invalide — doit commencer par http:// ou https://',3500);
    return;
  }
  var modal=document.getElementById('lien-modal');if(modal)modal.remove();
  var prenom=(S.profile&&S.profile.nom||'').split(' ')[0]||'';
  if(!S.prospects)S.prospects=[];
  var item={
    id:'p_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
    type:'lien',url:url,titre:titre,auteur:prenom,
    date:new Date().toLocaleDateString('fr-FR'),
    societe:S.prospectTab,ratings:{},comments:[],preview:null
  };
  S.prospects.push(item);
  if(!S._loadingLienIds)S._loadingLienIds={};
  S._loadingLienIds[item.id]=true;
  saveProspects();render();
  toast('⏳ Annonce ajoutée — analyse en cours…',5000);
  fetchLinkPreview(item);
  var _tabLabel=(PROSPECT_TABS.filter(function(t){return t.id===S.prospectTab;})[0]||{}).label||S.prospectTab;
  notifyAll({type:'prospect',title:prenom+' a partagé une annonce ('+_tabLabel+')',body:titre||url});
}
function _parseAmount(raw){
  if(!raw)return NaN;
  return parseFloat(raw.replace(/[\s\u00a0\u202f]/g,'').replace(',','.'));
}
function _extractLoyerAdresse(text,extraData){
  var result={loyer:null,loyer_type:null,adresse:null};
  if(!text&&!extraData)return result;
  var t=(text||'').replace(/\u00a0/g,' ');

  // ─── LOYER ─────────────────────────────────────────────────────────
  var candidates=[];
  // (A) Données structurées Microlink (priorité maximale)
  if(extraData){
    ['prix','price','loyer','rent'].forEach(function(k){
      if(extraData[k]){
        var n=_parseAmount(extraData[k]);
        if(!isNaN(n)&&n>0)candidates.push({v:n,annual:false,pri:0,src:'microlink_'+k});
      }
    });
  }
  // (B) Loyer annuel explicite → diviser par 12
  var pAn=/(\d[\d\s\u00a0.,]*)\s*(?:€|eur(?:os?)?)\s*(?:\/\s*an|par\s+an|annuel|\/an)/gi;
  var m;while((m=pAn.exec(t))!==null){
    var n=_parseAmount(m[1]);
    if(n>=20000&&n<=120000)candidates.push({v:Math.round(n/12),annual:true,pri:1,src:'annuel'});
  }
  var pAn2=/loyer\s*annuel\s*[:=]?\s*(\d[\d\s\u00a0.,]*)\s*(?:€|eur(?:os?)?)?/gi;
  while((m=pAn2.exec(t))!==null){
    var n=_parseAmount(m[1]);
    if(n>=20000&&n<=120000)candidates.push({v:Math.round(n/12),annual:true,pri:0,src:'loyer_annuel'});
  }
  // (C) "loyer" / "loyer mensuel" + montant (très fiable)
  var pLoy=/loyer\s*(?:mensuel|commercial|hc|ht)?\s*[:=\-]?\s*(\d[\d\s\u00a0.,]*)\s*(?:€|eur(?:os?)?)/gi;
  while((m=pLoy.exec(t))!==null){
    var n=_parseAmount(m[1]);
    if(n>=3000&&n<=8000)candidates.push({v:n,annual:false,pri:1,src:'loyer_kw'});
  }
  // (D) Montant + €/mois ou €HC/HT
  var pMois=/(\d[\d\s\u00a0.,]*)\s*(?:€|eur(?:os?)?)\s*(?:\/\s*mois|par\s+mois|mensuel|HC|HT|hors\s+charges|hors\s+taxes|charges\s+comprises|CC)/gi;
  while((m=pMois.exec(t))!==null){
    var n=_parseAmount(m[1]);
    if(n>=3000&&n<=8000)candidates.push({v:n,annual:false,pri:2,src:'mois_hc'});
  }
  // (E) Tout montant €  dans la plage 3000-8000
  var pEur=/(\d[\d\s\u00a0.,]*)\s*(?:€|eur(?:os?)?)/gi;
  while((m=pEur.exec(t))!==null){
    var n=_parseAmount(m[1]);
    if(n>=3000&&n<=8000)candidates.push({v:n,annual:false,pri:3,src:'euro_gen'});
  }
  // (F) Montant annuel € dans 36000-96000 sans mot-clé annuel explicite
  var pEurAn=/(\d[\d\s\u00a0.,]*)\s*(?:€|eur(?:os?)?)/gi;
  while((m=pEurAn.exec(t))!==null){
    var n=_parseAmount(m[1]);
    if(n>=36000&&n<=96000)candidates.push({v:Math.round(n/12),annual:true,pri:4,src:'euro_annuel_guess'});
  }
  // (G) Nombre seul 3000-8000 précédé de contexte prix/loyer/coût
  var pCtx=/(?:prix|loyer|co[uû]t|mensualit[eé]|budget)\D{0,20}(\d[\d\s\u00a0.,]*)/gi;
  while((m=pCtx.exec(t))!==null){
    var n=_parseAmount(m[1]);
    if(n>=3000&&n<=8000)candidates.push({v:n,annual:false,pri:5,src:'ctx_kw'});
  }
  // Dédupliquer et prendre le meilleur
  if(candidates.length){
    candidates.sort(function(a,b){return a.pri-b.pri;});
    result.loyer=candidates[0].v;
    result.loyer_type=candidates[0].annual?'annuel':'mensuel';
    console.log('[Loyer extract]',candidates[0].src,candidates[0].v,'€/mois','(from',candidates.length,'candidates)');
  }

  // ─── ADRESSE ───────────────────────────────────────────────────────
  // (A) Données structurées
  if(extraData){
    ['adresse','address','location','lieu'].forEach(function(k){
      if(extraData[k]&&!result.adresse)result.adresse=extraData[k].substring(0,60);
    });
  }
  if(!result.adresse){
    var addrPatterns=[
      // Numéro + type voie + nom
      /(\d{1,4}\s*,?\s*(?:rue|avenue|av\.?|boulevard|boul\.?|bd\.?|place|pl\.?|impasse|imp\.?|allée|all\.?|chemin|ch\.?|cours|passage|quai|route|rte\.?|square|sq\.?|parvis|esplanade|galerie|résidence|r[eé]s\.?)\s+[A-ZÀ-Üa-zà-ü\-']+(?:\s+[A-ZÀ-Üa-zà-ü\-']+){0,5})/i,
      // Type voie sans numéro
      /((?:rue|avenue|boulevard|place|impasse|allée|chemin|cours|passage|quai)\s+(?:du|de\s+la|de\s+l'|des|de|d')\s*[A-ZÀ-Üa-zà-ü\-']+(?:\s+[A-ZÀ-Üa-zà-ü\-']+){0,4})/i,
      // Code postal + ville
      /(\d{5})\s+([A-ZÀ-Ü][a-zà-ü\-']+(?:[\s-]+[A-ZÀ-Üa-zà-ü\-']+){0,3})/i,
      // Ville connue (IDF + grandes villes)
      /((?:Paris|Lyon|Marseille|Toulouse|Nice|Nantes|Strasbourg|Montpellier|Bordeaux|Lille|Versailles|Montreuil|Boulogne[\s-]Billancourt|Levallois[\s-]Perret|Neuilly[\s-]sur[\s-]Seine|Issy[\s-]les[\s-]Moulineaux|Saint[\s-][A-ZÀ-Ü][a-zà-ü\-']+|Rueil[\s-]Malmaison|Courbevoie|Puteaux|Suresnes|Clichy|Vincennes|Fontenay|Nogent|Charenton|Ivry|Vitry|Créteil|Colombes|Asnières|Gennevilliers|Nanterre|Argenteuil|Cergy|Pontoise|Massy|Orly|Rungis|Antony|Clamart|Meudon|Sèvres|Chatou|Maisons[\s-]Laffitte|Le\s+Chesnay|Vélizy)(?:\s+\d{1,2}(?:e|er|[eè]me))?)/i
    ];
    for(var i=0;i<addrPatterns.length;i++){
      var m=addrPatterns[i].exec(t);
      if(m){result.adresse=m[0].trim().replace(/\s+/g,' ').substring(0,60);break;}
    }
  }
  return result;
}

function fetchLinkPreview(item){
  // Appel Microlink avec data selectors pour extraire prix/adresse du DOM
  var apiUrl='https://api.microlink.io?url='+encodeURIComponent(item.url);
  // Sélecteurs CSS courants pour les sites immobiliers
  apiUrl+='&data.prix.selector=.price,.prix,.Price,.amount,.listing-price,[class*=price],[class*=Price],[class*=loyer],[class*=Loyer],[data-price],span.red,.value-price,.detail-price,.offer-price,h2.price&data.prix.attr=text';
  apiUrl+='&data.adresse.selector=.address,.adresse,.location,.ville,.city,.listing-address,[class*=address],[class*=Address],[class*=location],[class*=localisation],[data-address],.detail-address,.offer-address&data.adresse.attr=text';
  function _finishLoad(success){
    if(S._loadingLienIds&&S._loadingLienIds[item.id]){
      delete S._loadingLienIds[item.id];
    }
    saveProspects();render();
    if(success){
      var _title=(item.titre||item.preview&&item.preview.title||'').substring(0,40);
      toast('✓ Analyse terminée'+(_title?' — '+_title:''),3000);
    }
  }
  fetch(apiUrl)
    .then(function(r){return r.json();})
    .then(function(data){
      if(data.status==='success'&&data.data){
        var d=data.data;
        item.preview={
          title:d.title||'',
          description:d.description||'',
          image:d.image&&d.image.url||'',
          publisher:d.publisher||''
        };
        if(!item.titre&&d.title)item.titre=d.title;
        // Données structurées extraites par Microlink
        var extraData={};
        if(d.prix)extraData.prix=d.prix;
        if(d.adresse)extraData.adresse=d.adresse;
        console.log('[LinkPreview]',item.url,'\n  title:',d.title,'\n  desc:',d.description,'\n  prix(DOM):',d.prix,'\n  adresse(DOM):',d.adresse);
        // Extraction loyer & adresse (DOM + regex fallback)
        var fullText=(d.title||'')+' '+(d.description||'')+' '+(item.url||'');
        var extracted=_extractLoyerAdresse(fullText,extraData);
        if(extracted.loyer){item.loyer_extrait=extracted.loyer;item.loyer_type=extracted.loyer_type;}
        if(extracted.adresse)item.adresse_extraite=extracted.adresse;
        _finishLoad(true);
      } else {
        // Microlink a répondu mais sans data — marquer comme terminé
        if(!item.preview)item.preview={title:'',description:'',image:'',publisher:''};
        _finishLoad(false);
        toast('⚠ Aperçu indisponible pour ce site — vous pouvez saisir les infos manuellement',4000);
      }
    })
    .catch(function(e){
      console.warn('LinkPreview error:',e);
      if(!item.preview)item.preview={title:'',description:'',image:'',publisher:''};
      _finishLoad(false);
      toast('⚠ Erreur réseau — lien enregistré sans aperçu',4000);
    });
}
function refreshLinkPreview(idx){
  var p=S.prospects[idx];if(!p||p.type!=='lien')return;
  toast('Actualisation…');fetchLinkPreview(p);
}
function ajouterFicheProspect(){ouvrirFormFiche();}

function ouvrirFormFiche(existingIdx){
  var existing=document.getElementById('fiche-modal');if(existing)existing.remove();
  var editing=typeof existingIdx==='number';
  var f=editing?S.prospects[existingIdx]:{adresse:'',surface:'',loyer:'',notes:'',statut:'froid'};
  if(editing&&!f)return;
  var overlay=document.createElement('div');
  overlay.id='fiche-modal';
  overlay.className='lien-modal-overlay';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  var box='<div class="lien-modal-box" style="max-width:480px">';
  box+='<div class="lien-modal-header">';
  box+='<div class="lien-modal-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>';
  box+='<div class="lien-modal-titles">';
  box+='<div class="lien-modal-title">'+(editing?'Modifier la fiche':'Nouvelle fiche prospect')+'</div>';
  box+='<div class="lien-modal-sub">Saisissez les infos d\'un local repéré en direct</div>';
  box+='</div>';
  box+='<button class="lien-modal-close" onclick="document.getElementById(\'fiche-modal\').remove()">&times;</button>';
  box+='</div>';
  box+='<div class="lien-modal-body">';
  box+='<label class="lien-modal-label">Adresse du local <span style="color:#EF4444">*</span></label>';
  box+='<input id="new-fiche-adresse" type="text" value="'+(f.adresse||'').replace(/"/g,'&quot;')+'" placeholder="Ex: 12 rue de la République, 34000 Montpellier" class="lien-modal-input">';
  box+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px">';
  box+='<div>';
  box+='<label class="lien-modal-label">Surface <span class="lien-modal-optional">(m²)</span></label>';
  box+='<input id="new-fiche-surface" type="number" value="'+(f.surface||'')+'" placeholder="120" class="lien-modal-input">';
  box+='</div>';
  box+='<div>';
  box+='<label class="lien-modal-label">Loyer mensuel HT <span class="lien-modal-optional">(€)</span></label>';
  box+='<input id="new-fiche-loyer" type="number" value="'+(f.loyer||'')+'" placeholder="4500" class="lien-modal-input">';
  box+='</div>';
  box+='</div>';
  box+='<label class="lien-modal-label" style="margin-top:14px">Statut</label>';
  box+='<div class="lien-modal-statut-group" id="new-fiche-statut-group">';
  ['chaud','tiede','froid'].forEach(function(st){
    var lbl=st==='chaud'?'🔴 Chaud':st==='tiede'?'🟡 Tiède':'⚪ Froid';
    var active=(f.statut||'froid')===st;
    box+='<button type="button" class="lien-modal-statut'+(active?' active':'')+'" data-statut="'+st+'" onclick="document.querySelectorAll(\'.lien-modal-statut\').forEach(function(b){b.classList.remove(\'active\');});this.classList.add(\'active\');">'+lbl+'</button>';
  });
  box+='</div>';
  box+='<label class="lien-modal-label" style="margin-top:14px">Notes <span class="lien-modal-optional">(optionnel)</span></label>';
  box+='<textarea id="new-fiche-notes" rows="3" placeholder="Contact, rendez-vous, particularités…" class="lien-modal-input" style="resize:vertical;font-family:inherit">'+(f.notes||'').replace(/</g,'&lt;')+'</textarea>';
  box+='</div>';
  box+='<div class="lien-modal-footer">';
  box+='<button onclick="document.getElementById(\'fiche-modal\').remove()" class="lien-modal-cancel">Annuler</button>';
  box+='<button onclick="submitFicheForm('+(editing?existingIdx:'-1')+')" class="lien-modal-submit">';
  box+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
  box+=(editing?'Enregistrer':'Créer la fiche');
  box+='</button>';
  box+='</div>';
  box+='</div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
  setTimeout(function(){var el=document.getElementById('new-fiche-adresse');if(el)el.focus();},50);
  overlay.addEventListener('keydown',function(e){if(e.key==='Escape')overlay.remove();});
}

function submitFicheForm(idx){
  var adresse=(document.getElementById('new-fiche-adresse').value||'').trim();
  var surface=(document.getElementById('new-fiche-surface').value||'').trim();
  var loyer=(document.getElementById('new-fiche-loyer').value||'').trim();
  var notes=(document.getElementById('new-fiche-notes').value||'').trim();
  var statutBtn=document.querySelector('#new-fiche-statut-group .lien-modal-statut.active');
  var statut=statutBtn?statutBtn.getAttribute('data-statut'):'froid';
  if(!adresse){
    var el=document.getElementById('new-fiche-adresse');
    if(el){el.style.borderColor='#EF4444';el.focus();}
    toast('⚠ Adresse obligatoire',3000);
    return;
  }
  var modal=document.getElementById('fiche-modal');if(modal)modal.remove();
  var editing=idx>=0;
  var prenom=(S.profile&&S.profile.nom||'').split(' ')[0]||'';
  if(!S.prospects)S.prospects=[];
  if(editing){
    var f=S.prospects[idx];if(!f)return;
    f.adresse=adresse;f.surface=surface;f.loyer=parseFloat(loyer)||0;f.notes=notes;f.statut=statut;
    saveProspects();render();toast('✓ Fiche mise à jour',3000);
    var _tabLabel=(PROSPECT_TABS.filter(function(t){return t.id===f.societe;})[0]||{}).label||f.societe;
    notifyAll({type:'prospect',title:_myProspectName()+' a modifié une fiche ('+_tabLabel+')',body:adresse});
  } else {
    S.prospects.push({
      id:'p_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      type:'fiche',adresse:adresse,surface:surface,
      loyer:parseFloat(loyer)||0,notes:notes,statut:statut,
      auteur:prenom,date:new Date().toLocaleDateString('fr-FR'),
      societe:S.prospectTab,ratings:{},comments:[]
    });
    saveProspects();render();toast('✓ Fiche prospect créée',3000);
    var _tabLabel=(PROSPECT_TABS.filter(function(t){return t.id===S.prospectTab;})[0]||{}).label||S.prospectTab;
    notifyAll({type:'prospect',title:prenom+' a ajouté une fiche prospect ('+_tabLabel+')',body:adresse+(loyer?' — '+loyer+' €/mois':'')});
  }
}
var _lienLoyerTimer=null;
function updateLienLoyer(idx,val){
  var p=S.prospects[idx];if(!p)return;
  p.loyer_manuel=parseFloat(val)||0;
  if(!p.loyer_manuel)delete p.loyer_manuel;
  clearTimeout(_lienLoyerTimer);
  _lienLoyerTimer=setTimeout(function(){saveProspects();render();},800);
}
var _ficheLoyerTimer=null;
function updateFicheLoyer(idx,val){
  var f=S.prospects[idx];if(!f)return;
  f.loyer=parseFloat(val)||0;
  // Update annuel display sans re-render complet
  var card=document.querySelectorAll('.prospect-card')[0];
  clearTimeout(_ficheLoyerTimer);
  _ficheLoyerTimer=setTimeout(function(){saveProspects();render();},800);
}
function modifierFicheProspect(idx){
  ouvrirFormFiche(idx);
}
function supprimerProspect(idx){
  if(!confirm('Supprimer cet élément ?'))return;
  S.prospects.splice(idx,1);
  saveProspects();render();toast('Élément supprimé');
}
async function saveProspects(){
  try{
    migrateProspects(); // assure IDs + déduplique
    var res=await sb.from('studios').upsert({id:'_prospects',data:{items:S.prospects},updated_at:new Date().toISOString()});
    if(res.error){console.error('saveProspects error:',res.error);toast('⚠ Erreur sauvegarde prospects : '+res.error.message);return false;}
    return true;
  }catch(e){console.error('saveProspects error:',e);toast('⚠ Erreur sauvegarde prospects');return false;}
}
async function loadProspects(){
  try{
    var res=await sb.from('studios').select('data').eq('id','_prospects').single();
    if(res.data&&res.data.data&&res.data.data.items){
      S.prospects=res.data.data.items;
      var before=S.prospects.length;
      migrateProspects();
      // Si des doublons ont été supprimés, sauvegarder le nettoyage
      if(S.prospects.length<before){saveProspects();console.log('[Prospects] Dédupliqué : '+before+' → '+S.prospects.length);}
      fetchMissingPreviews();
    }
  }catch(e){}
}
function fetchMissingPreviews(){
  var changed=false;
  (S.prospects||[]).forEach(function(p){
    if(p.type==='lien'&&!p.preview&&p.url){fetchLinkPreview(p);return;}
    // Re-extraire loyer/adresse avec regex améliorée
    if(p.type==='lien'&&p.preview){
      var fullText=(p.preview.title||'')+' '+(p.preview.description||'')+' '+(p.url||'');
      var extracted=_extractLoyerAdresse(fullText,null);
      if(extracted.loyer&&extracted.loyer!==p.loyer_extrait){p.loyer_extrait=extracted.loyer;p.loyer_type=extracted.loyer_type;changed=true;}
      else if(!extracted.loyer&&p.loyer_extrait){delete p.loyer_extrait;delete p.loyer_type;changed=true;}
      if(extracted.adresse&&extracted.adresse!==p.adresse_extraite){p.adresse_extraite=extracted.adresse;changed=true;}
    }
  });
  if(changed){saveProspects();render();}
}

// ── Prospection: helpers ───────────────────────────────────────────────
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
function setProspectTab(id){S.prospectTab=id;S.prospectExpandedComments={};render();}
function _myProspectName(){return (S.profile&&S.profile.nom||'').split(' ')[0]||'Anon';}

function rateProspect(idx,stars){
  var p=S.prospects[idx];if(!p)return;
  var me=_myProspectName();
  if(p.ratings[me]===stars)delete p.ratings[me];// toggle off
  else p.ratings[me]=stars;
  saveProspects();render();
  var _tabLabel=(PROSPECT_TABS.filter(function(t){return t.id===p.societe;})[0]||{}).label||p.societe;
  var _pLabel=p.type==='lien'?(p.titre||p.url||'Annonce'):(p.adresse||'Fiche');
  notifyAll({type:'prospect',title:_myProspectName()+' a noté '+stars+'★ ('+_tabLabel+')',body:_pLabel});
}
function toggleProspectComments(idx){
  S.prospectExpandedComments[idx]=!S.prospectExpandedComments[idx];render();
}
function addProspectComment(idx){
  var text=prompt('Votre commentaire :');if(!text)return;
  var p=S.prospects[idx];if(!p)return;
  p.comments.push({auteur:_myProspectName(),text:text,date:new Date().toLocaleDateString('fr-FR')});
  S.prospectExpandedComments[idx]=true;
  saveProspects();render();toast('Commentaire ajouté');
  var _tabLabel=(PROSPECT_TABS.filter(function(t){return t.id===p.societe;})[0]||{}).label||p.societe;
  var _pLabel=p.type==='lien'?(p.titre||p.url||'Annonce'):(p.adresse||'Fiche');
  notifyAll({type:'prospect',title:_myProspectName()+' a commenté un prospect ('+_tabLabel+')',body:_pLabel+' — '+text.slice(0,60)});
}
function deleteProspectComment(pIdx,cIdx){
  var p=S.prospects[pIdx];if(!p||!p.comments[cIdx])return;
  var c=p.comments[cIdx];var me=_myProspectName();
  if(c.auteur!==me&&!isSuperAdmin()){toast('Seul l\'auteur peut supprimer');return;}
  if(!confirm('Supprimer ce commentaire ?'))return;
  p.comments.splice(cIdx,1);
  saveProspects();render();toast('Commentaire supprimé');
}

function _prospectAvgRating(p){
  var vals=Object.values(p.ratings||{});
  if(!vals.length)return 0;
  return vals.reduce(function(s,v){return s+v;},0)/vals.length;
}

function renderStarRating(p,globalIdx){
  var me=_myProspectName();
  var myRating=p.ratings&&p.ratings[me]||0;
  var avg=_prospectAvgRating(p);
  var voters=Object.keys(p.ratings||{}).length;
  var h='<div style="display:flex;align-items:center;gap:6px;margin:6px 0">';
  for(var s=1;s<=3;s++){
    var filled=s<=myRating;
    h+='<button class="star-btn'+(filled?'':' empty')+'" onclick="event.stopPropagation();rateProspect('+globalIdx+','+s+')" title="'+(filled?'Retirer ma note':'Noter '+s+'/3')+'">';
    h+='★</button>';
  }
  if(voters>0){
    h+='<span style="font-size:11px;color:#888;margin-left:4px">';
    h+='<b style="color:#F59E0B">'+avg.toFixed(1)+'</b>';
    h+=' <span style="color:#bbb">·</span> '+voters+' vote'+(voters>1?'s':'');
    // Qui a voté — mini avatars
    h+='</span>';
    h+='<div style="display:flex;margin-left:6px">';
    Object.keys(p.ratings).forEach(function(name,vi){
      var color=['#1a3a6b','#0F6E56','#854F0B','#533AB7','#DC2626'][vi%5];
      h+='<div title="'+name+' : '+p.ratings[name]+'★" style="width:20px;height:20px;border-radius:50%;background:'+color+';color:#fff;font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-left:'+(vi>0?'-4px':'0')+';border:2px solid #fff;cursor:default">'+name.charAt(0).toUpperCase()+'</div>';
    });
    h+='</div>';
  }
  h+='</div>';
  return h;
}

function renderCommentThread(p,globalIdx){
  var comments=p.comments||[];
  var n=comments.length;
  var expanded=!!S.prospectExpandedComments[globalIdx];
  var h='<div style="margin-top:8px;padding-top:8px;border-top:1px solid #f0f0ea">';
  // Toggle + add button
  h+='<div style="display:flex;align-items:center;gap:8px">';
  h+='<button onclick="event.stopPropagation();toggleProspectComments('+globalIdx+')" style="background:none;border:none;cursor:pointer;font-size:11px;color:#888;display:flex;align-items:center;gap:5px;padding:2px 0;transition:color .2s" onmouseover="this.style.color=\'#555\'" onmouseout="this.style.color=\'#888\'">';
  h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  h+=n>0?('<b>'+n+'</b> commentaire'+(n>1?'s':'')):'Commenter';
  if(expanded)h+=' <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>';
  else h+=' <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';
  h+='</button>';
  h+='<button onclick="event.stopPropagation();addProspectComment('+globalIdx+')" style="background:none;border:1px solid #e0e0d8;border-radius:6px;cursor:pointer;font-size:10px;color:#888;padding:3px 8px;transition:all .15s" onmouseover="this.style.background=S.darkMode?\'#21262d\':\'#f5f5f0\';this.style.color=S.darkMode?\'#c9d1d9\':\'#555\'" onmouseout="this.style.background=\'none\';this.style.color=\'#888\'">+ Ajouter</button>';
  h+='</div>';
  // Thread expanded
  if(expanded&&n>0){
    h+='<div class="comment-thread" style="margin-top:8px;display:flex;flex-direction:column;gap:6px">';
    comments.forEach(function(c,ci){
      var isMe=c.auteur===_myProspectName();
      var initColor=['#1a3a6b','#0F6E56','#854F0B','#533AB7','#DC2626'][c.auteur.charCodeAt(0)%5];
      h+='<div style="display:flex;gap:8px;align-items:flex-start;padding:8px 10px;background:'+(isMe?'#f0f4ff':'#fafaf8')+';border-radius:10px;position:relative">';
      // Mini avatar
      h+='<div style="width:24px;height:24px;border-radius:50%;background:'+initColor+';color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+c.auteur.charAt(0).toUpperCase()+'</div>';
      h+='<div style="flex:1;min-width:0">';
      h+='<div style="font-size:10px;margin-bottom:2px"><b style="color:#333">'+c.auteur+'</b> <span style="color:#bbb">· '+c.date+'</span></div>';
      h+='<div style="font-size:12px;color:#444;line-height:1.4">'+htmlEscape(c.text)+'</div>';
      h+='</div>';
      if(isMe||isSuperAdmin()){
        h+='<button onclick="event.stopPropagation();deleteProspectComment('+globalIdx+','+ci+')" style="background:none;border:none;color:#ccc;cursor:pointer;font-size:14px;padding:0 2px;position:absolute;top:6px;right:8px;transition:color .15s" onmouseover="this.style.color=\'#ef4444\'" onmouseout="this.style.color=\'#ccc\'" title="Supprimer">&times;</button>';
      }
      h+='</div>';
    });
    h+='</div>';
  }
  h+='</div>';
  return h;
}

// ── PAGE: BP Consolidé ─────────────────────────────────────────────────
// Calcule le CA annuel simulé pour un studio à partir du scénario actif
function _getScenarioCA(sid,ay){
  var s=S.studios[sid];
  if(!s)return 0;
  var BP_CFG={p4:47,p8:50,pi:3,prix4:110,prix8:193.33,prixi:276.67};
  // Si scénario actif = BP par défaut ou aucun scénario, utiliser la config BP de référence
  // pour garantir le même résultat sur tous les appareils
  var scId=S.activeScenarioId[sid]||'bp_default';
  var cfg;
  if(scId==='bp_default'){
    cfg=BP_CFG;
  } else {
    // Scénario custom : chercher sa config enregistrée
    var scList=S.scenarios[sid]||[];
    var sc=scList.find(function(x){return x.id===scId;});
    cfg=(sc&&sc.config)?sc.config:(S.simConfig[sid]||BP_CFG);
  }
  var actuel=S.adherents[sid]||{};
  var offset=(ay-1)*12;
  var total=0;
  for(var i=0;i<12;i++){
    var k='y'+ay+'_m'+i;
    var idx=offset+i;
    var _bpA2=getBPAdherents(sid);
    var bpM=idx<_bpA2.length?_bpA2[idx]:400;
    var membres=actuel[k]!=null?num(actuel[k]):bpM;
    total+=computeSimCA(membres,cfg,ay,sid);
  }
  return total;
}

// Récupère le nom du scénario actif pour un studio
function _getScenarioLabel(sid){
  var scId=S.activeScenarioId[sid];
  if(!scId||scId==='bp_default')return null;
  var scList=S.scenarios[sid]||[];
  var sc=scList.find(function(s){return s.id===scId;});
  return sc?sc.auteur+' — '+sc.date:null;
}

// ── Récapitulatif des engagements consolidé ──────────────────────────────────
function toggleEngView(v){S.engView=v;render();}
function toggleEngSection(v){S.engSection=v;render();}
function toggleFpCohorte(v){S.fpSimActiveCohorte=v;render();}
function setFpSimCohorte(cohorte,societe,nb){S.fpSimCohortes[cohorte][societe]=parseInt(nb)||0;render();}
function toggleEngExpand(k){S.engExpanded[k]=!S.engExpanded[k];render();}

function renderPageEngagements(){
  var allIds=_getStudioIds();
  var dm=S.darkMode;
  var cardBg=dm?'#161b22':'#fff';
  var borderC=dm?'#30363d':'#e8e8e0';
  var txtMain=dm?'#e6edf3':'#1a1a1a';
  var txtSub=dm?'#8b949e':'#888';
  var subtleBg=dm?'#21262d':'#f8f9fb';

  // ── Mapping données ──
  // Bloc 1 : Sociétés porteuses des projets (groupement par S.studios[id].societe)
  var SOCIETES_PORTEUSES=[
    {societe:'P&W Occitanie',short:'P&W Occitanie',color:'#1a3a6b',desc:'Montpellier Lattes & Toulouse'},
    {societe:'COBE Society',short:'COBE Society',color:'#0F6E56',desc:'La Garenne-Colombes & Levallois-Perret'},
    {societe:'SACOBE Society',short:'SACOBE Society',color:'#854F0B',desc:'Issy-les-Moulineaux'},
  ];
  // Bloc 2 : Actionnaires des sociétés porteuses (groupement par engage_par)
  // avatarNom = nom utilisé pour chercher la photo dans PHOTO_MAP
  var ACTIONNAIRES=[
    {nom:'Moovi-moov',contributors:['Moovi-moov'],avatarNom:'Clément Coquel',desc:'Holding Clément Coquel',color:'#854F0B'},
    {nom:'Pilatine',contributors:['Pilatine'],avatarNom:'Caroline Coquel',desc:'Holding Caroline Coquel',color:'#7C3AED'},
    {nom:'SAS Isséo',contributors:['SAS Isséo'],avatarNom:'Pascal Bécaud',desc:'Holding famille Bécaud',color:'#0F6E56'},
    {nom:'Paul Bécaud',contributors:['Paul Bécaud'],avatarNom:'Paul Bécaud',desc:'À titre personnel',color:'#1a3a6b'},
    {nom:'SAS P&W Studios',contributors:['SAS P&W Studios'],avatarNom:'Tom Bécaud',desc:'Holding Tom Bécaud',color:'#1a3a6b'},
    {nom:'Paul Sabourin',contributors:['Paul Sabourin'],avatarNom:'Paul Sabourin',desc:'À titre personnel',color:'#B45309'},
  ];

  // ── Agrégation ──
  var allDeps=[];
  allIds.forEach(function(id){
    (S.depenses[id]||[]).forEach(function(d){
      allDeps.push({dep:d,studioId:id,studioName:(S.studios[id]||{}).name||id});
    });
  });
  var totalEngage=0,totalDebloque=0,totalAttente=0;
  allDeps.forEach(function(e){
    var v=num(e.dep.ttc);
    totalEngage+=v;
    if(e.dep.deblocage==='debloque')totalDebloque+=v;
    else if(e.dep.deblocage==='demande')totalAttente+=v;
  });
  var nbProjets=allIds.filter(function(id){return (S.depenses[id]||[]).length>0;}).length;

  var h='';

  // ── Page header ──
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px">';
  h+='<div><div style="font-size:20px;font-weight:700;color:'+txtMain+'">Récapitulatif des engagements</div><div style="font-size:12px;color:'+txtSub+';margin-top:2px">Vision consolidée des dépenses engagées par société et par actionnaire — '+allIds.length+' studios</div></div>';
  h+='<div style="display:flex;align-items:center;gap:8px">'+renderSearchBar()+userAvatarWidget(S.profile)+'</div>';
  h+='</div>';

  // ── Navigation 3 volets ──
  var engSections=[
    {id:'recap',label:'Récap\' engagements',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',gradient:'linear-gradient(135deg,#92630a 0%,#d4a843 100%)',activeColor:'#92630a',activeBg:'#fef3c7'},
    {id:'fondspropres',label:'Fonds propres',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',gradient:'linear-gradient(135deg,#1a3a6b 0%,#3b7dd8 100%)',activeColor:'#1a3a6b',activeBg:'#dbeafe'},
    {id:'comptescourants',label:'Comptes courants',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',gradient:'linear-gradient(135deg,#0F6E56 0%,#22c55e 100%)',activeColor:'#0F6E56',activeBg:'#d1fae5'}
  ];

  h+='<div style="display:flex;gap:8px;margin-bottom:20px;background:'+(dm?'#161b22':'#f8f9fb')+';padding:6px;border-radius:14px;border:1px solid '+borderC+'">';
  engSections.forEach(function(sec){
    var active=S.engSection===sec.id;
    h+='<button onclick="toggleEngSection(\''+sec.id+'\')" style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:'+(active?'700':'500')+';cursor:pointer;transition:all .25s;border:none;';
    if(active){
      h+='background:'+sec.activeBg+';color:'+sec.activeColor+';box-shadow:0 2px 8px rgba(0,0,0,0.08)"';
    } else {
      h+='background:transparent;color:'+(dm?'#8b949e':'#888')+'"';
    }
    h+=' onmouseover="if(!'+active+')this.style.background=\''+(dm?'#21262d':'#f0f0ea')+'\'" onmouseout="if(!'+active+')this.style.background=\''+( active?sec.activeBg:'transparent')+'\'">';
    h+=sec.icon+'<span>'+sec.label+'</span>';
    h+='</button>';
  });
  h+='</div>';

  // ════════════════════════════════════════════════════════════════════════════
  // VOLET 1 : Récap' engagements
  // ════════════════════════════════════════════════════════════════════════════
  if(S.engSection==='recap'){

  // ── Pré-calcul données par société ──
  var socData=[];
  SOCIETES_PORTEUSES.forEach(function(soc){
    var socStudioIds=allIds.filter(function(id){return S.studios[id]&&S.studios[id].societe===soc.societe;});
    var socDeps=[];
    socStudioIds.forEach(function(id){
      (S.depenses[id]||[]).forEach(function(d){socDeps.push({dep:d,studioId:id,studioName:(S.studios[id]||{}).name||id});});
    });
    var socTotal=socDeps.reduce(function(s,e){return s+num(e.dep.ttc);},0);
    var socDebloque=socDeps.filter(function(e){return e.dep.deblocage==='debloque';}).reduce(function(s,e){return s+num(e.dep.ttc);},0);
    var socAttente=socDeps.filter(function(e){return e.dep.deblocage==='demande';}).reduce(function(s,e){return s+num(e.dep.ttc);},0);
    var byStudio={};
    socDeps.forEach(function(e){
      if(!byStudio[e.studioId])byStudio[e.studioId]={name:e.studioName,total:0,debloque:0,deps:[],bySource:{}};
      byStudio[e.studioId].total+=num(e.dep.ttc);
      if(e.dep.deblocage==='debloque')byStudio[e.studioId].debloque+=num(e.dep.ttc);
      byStudio[e.studioId].deps.push(e.dep);
      var src=e.dep.engage_par||'Non renseign\u00e9';
      byStudio[e.studioId].bySource[src]=(byStudio[e.studioId].bySource[src]||0)+num(e.dep.ttc);
    });
    socData.push({soc:soc,studioIds:socStudioIds,deps:socDeps,total:socTotal,debloque:socDebloque,attente:socAttente,byStudio:byStudio});
  });

  // Pré-calcul données par actionnaire
  var actData=[];
  ACTIONNAIRES.forEach(function(act){
    var actDeps=allDeps.filter(function(e){return act.contributors.indexOf(e.dep.engage_par)>=0;});
    var actTotal=actDeps.reduce(function(s,e){return s+num(e.dep.ttc);},0);
    var actDebloque=actDeps.filter(function(e){return e.dep.deblocage==='debloque';}).reduce(function(s,e){return s+num(e.dep.ttc);},0);
    var byStudio={};
    actDeps.forEach(function(e){
      if(!byStudio[e.studioId])byStudio[e.studioId]={name:e.studioName,total:0,debloque:0,deps:[]};
      byStudio[e.studioId].total+=num(e.dep.ttc);
      if(e.dep.deblocage==='debloque')byStudio[e.studioId].debloque+=num(e.dep.ttc);
      byStudio[e.studioId].deps.push(e.dep);
    });
    actData.push({act:act,deps:actDeps,total:actTotal,debloque:actDebloque,byStudio:byStudio});
  });
  var maxActTotal=Math.max.apply(null,actData.map(function(a){return a.total;}));

  // ── Header gradient gold ──
  h+='<div style="background:linear-gradient(135deg,#92630a 0%,#b8860b 50%,#d4a843 100%);border-radius:16px;padding:24px 28px;margin-bottom:20px;position:relative;overflow:hidden">';
  h+='<div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.08)"></div>';
  h+='<div style="position:absolute;bottom:-30px;left:40%;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.05)"></div>';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">';
  h+='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';
  h+='<span style="font-size:16px;font-weight:700;color:#fff;letter-spacing:-0.3px">Synth\u00e8se des engagements</span></div>';
  h+='<div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:14px">O\u00f9 en sont les d\u00e9penses engag\u00e9es ? Vue consolid\u00e9e de '+allIds.length+' studios</div>';

  // KPIs en ligne
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">';
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:12px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Total engag\u00e9</div><div style="font-size:22px;font-weight:800;color:#fff">'+fmt(totalEngage)+'</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px">'+nbProjets+' projet(s) actif(s)</div></div>';
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:12px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">D\u00e9bloqu\u00e9</div><div style="font-size:22px;font-weight:800;color:#d1fae5">'+fmt(totalDebloque)+'</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px">'+(totalEngage?Math.round(totalDebloque/totalEngage*100):0)+'% du total</div></div>';
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:12px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">En attente</div><div style="font-size:22px;font-weight:800;color:#fef3c7">'+fmt(totalAttente)+'</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px">demandes de d\u00e9blocage</div></div>';
  h+='</div>';

  // Barre de répartition par société (stacked bar)
  if(totalEngage>0){
    h+='<div>';
    h+='<div style="font-size:9px;color:rgba(255,255,255,0.5);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">R\u00e9partition par soci\u00e9t\u00e9</div>';
    h+='<div style="height:10px;border-radius:5px;overflow:hidden;display:flex;gap:2px">';
    socData.forEach(function(sd){
      var pct=Math.max(1,Math.round(sd.total/totalEngage*100));
      h+='<div title="'+sd.soc.short+' : '+fmt(sd.total)+'" style="width:'+pct+'%;background:'+sd.soc.color+';border-radius:3px;transition:width .3s"></div>';
    });
    h+='</div>';
    h+='<div style="display:flex;gap:12px;margin-top:6px">';
    socData.forEach(function(sd){
      h+='<div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:2px;background:'+sd.soc.color+'"></div><span style="font-size:9px;color:rgba(255,255,255,0.7)">'+sd.soc.short+' '+fmt(sd.total)+'</span></div>';
    });
    h+='</div></div>';
  }
  h+='</div>';

  // ── Toggle Soci\u00e9t\u00e9s / Actionnaires ──
  h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:14px">';
  var tabs=[
    {id:'societes',label:'Par soci\u00e9t\u00e9',icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'},
    {id:'actionnaires',label:'Par actionnaire',icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'}
  ];
  tabs.forEach(function(tab){
    var active=S.engView===tab.id;
    h+='<button onclick="toggleEngView(\''+tab.id+'\')" style="display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:'+(active?'700':'500')+';cursor:pointer;transition:all .2s;border:'+(active?'none':'1px solid '+borderC)+';background:'+(active?(dm?'#e6edf3':'#92630a'):(dm?'#21262d':'#fff'))+';color:'+(active?'#fff':(dm?'#8b949e':'#666'))+'">';
    h+=tab.icon+'<span>'+tab.label+'</span></button>';
  });
  h+='<div style="flex:1"></div>';
  h+='<div style="font-size:11px;color:'+txtSub+'">Cliquez pour acc\u00e9der au d\u00e9tail</div>';
  h+='</div>';

  if(S.engView==='societes'){
    // ═══ VUE SOCIÉTÉS : tableau consolidé ═══
    socData.forEach(function(sd,socIdx){
      var soc=sd.soc;
      var pctDeb=sd.total?Math.round(sd.debloque/sd.total*100):0;
      var pctOfTotal=totalEngage?Math.round(sd.total/totalEngage*100):0;

      h+='<div style="background:'+cardBg+';border:1px solid '+borderC+';border-radius:14px;overflow:hidden;margin-bottom:12px;transition:all .3s" onmouseenter="this.style.boxShadow=\'0 4px 16px rgba(0,0,0,'+(dm?'0.3':'0.08')+')\'" onmouseleave="this.style.boxShadow=\'none\'">';

      // En-tête société avec bande couleur
      h+='<div style="border-left:4px solid '+soc.color+';padding:16px 20px">';
      h+='<div style="display:flex;align-items:center;gap:12px">';
      h+='<div style="width:40px;height:40px;border-radius:10px;background:'+soc.color+'15;color:'+soc.color+';display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px">'+soc.short.split(' ').map(function(w){return w.charAt(0);}).join('')+'</div>';
      h+='<div style="flex:1"><div style="font-size:14px;font-weight:700;color:'+txtMain+'">'+soc.short+'</div>';
      h+='<div style="font-size:10px;color:'+txtSub+'">'+soc.desc+' \u00b7 '+sd.studioIds.length+' studio(s)</div></div>';
      h+='<div style="text-align:right"><div style="font-size:22px;font-weight:800;color:'+soc.color+'">'+fmt(sd.total)+'</div>';
      h+='<div style="font-size:10px;color:'+txtSub+'">'+pctOfTotal+'% du total</div></div>';
      h+='</div>';

      // Barre de progression + statuts
      h+='<div style="margin-top:12px">';
      h+='<div style="height:6px;border-radius:3px;background:'+(dm?'#30363d':'#f0f0ea')+';overflow:hidden;display:flex;gap:1px">';
      var pctDeb2=sd.total?Math.round(sd.debloque/sd.total*100):0;
      var pctAtt=sd.total?Math.round(sd.attente/sd.total*100):0;
      if(pctDeb2>0)h+='<div style="width:'+pctDeb2+'%;background:#0F6E56;border-radius:3px"></div>';
      if(pctAtt>0)h+='<div style="width:'+pctAtt+'%;background:#d4a843;border-radius:3px"></div>';
      h+='</div>';
      h+='<div style="display:flex;gap:16px;margin-top:6px">';
      h+='<div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:#0F6E56"></div><span style="font-size:10px;color:'+txtSub+'">D\u00e9bloqu\u00e9 '+fmt(sd.debloque)+'</span></div>';
      if(sd.attente>0)h+='<div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:#d4a843"></div><span style="font-size:10px;color:'+txtSub+'">En attente '+fmt(sd.attente)+'</span></div>';
      var nonDebloque=sd.total-sd.debloque-sd.attente;
      if(nonDebloque>0)h+='<div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:'+(dm?'#30363d':'#e0e0d8')+'"></div><span style="font-size:10px;color:'+txtSub+'">\u00c0 venir '+fmt(nonDebloque)+'</span></div>';
      h+='</div></div>';
      h+='</div>';

      // Détail par studio
      h+='<div style="border-top:1px solid '+borderC+'">';
      var stIds=Object.keys(sd.byStudio);
      if(!stIds.length){
        h+='<div style="padding:14px 20px;text-align:center;font-size:11px;color:'+txtSub+'">Aucune d\u00e9pense enregistr\u00e9e</div>';
      } else {
        stIds.forEach(function(sid,idx){
          var st=sd.byStudio[sid];
          var pctSt=sd.total?Math.round(st.total/sd.total*100):0;
          h+='<div onclick="openDetail(\''+sid+'\');setTimeout(function(){setDetailTab(\'engagements\')},50)" style="padding:12px 20px;cursor:pointer;transition:background .15s;border-bottom:'+(idx<stIds.length-1?'1px solid '+borderC:'none')+'" onmouseover="this.style.background=\''+(dm?'#1c2128':'#f8f9fb')+'\'" onmouseout="this.style.background=\'transparent\'">';
          h+='<div style="display:flex;align-items:center;gap:12px">';
          h+='<div style="width:32px;height:32px;border-radius:8px;background:'+(dm?'#21262d':'#f0f0ea')+';display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+soc.color+'" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>';
          h+='<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:'+txtMain+'">'+st.name+'</div>';
          h+='<div style="font-size:10px;color:'+txtSub+'">'+st.deps.length+' d\u00e9pense(s)</div></div>';
          // Barre proportionnelle
          h+='<div style="width:100px">';
          h+='<div style="height:4px;border-radius:2px;background:'+(dm?'#30363d':'#f0f0ea')+';overflow:hidden"><div style="width:'+pctSt+'%;height:100%;background:'+soc.color+';border-radius:2px"></div></div>';
          h+='<div style="font-size:9px;color:'+txtSub+';text-align:right;margin-top:2px">'+pctSt+'%</div>';
          h+='</div>';
          h+='<div style="text-align:right;min-width:90px"><div style="font-size:13px;font-weight:700;color:'+soc.color+'">'+fmt(st.total)+'</div></div>';
          h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+txtSub+'" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
          h+='</div>';
          // Breakdown par source
          var sources=Object.keys(st.bySource);
          if(sources.length>0){
            h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;padding-left:44px">';
            sources.forEach(function(src){
              h+='<span style="font-size:9px;padding:2px 8px;border-radius:4px;background:'+(dm?'#21262d':'#f0f0ea')+';color:'+txtSub+';font-weight:500">'+src+' : '+fmt(st.bySource[src])+'</span>';
            });
            h+='</div>';
          }
          h+='</div>';
        });
      }
      // Studios sans dépenses
      var emptyStudios=sd.studioIds.filter(function(id){return !sd.byStudio[id];});
      emptyStudios.forEach(function(sid){
        h+='<div onclick="openDetail(\''+sid+'\');setTimeout(function(){setDetailTab(\'engagements\')},50)" style="padding:8px 20px;cursor:pointer;display:flex;align-items:center;gap:12px;opacity:0.4;border-top:1px solid '+borderC+'" onmouseover="this.style.opacity=\'0.7\'" onmouseout="this.style.opacity=\'0.4\'">';
        h+='<div style="width:32px;height:32px;border-radius:8px;background:'+(dm?'#21262d':'#f0f0ea')+';display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>';
        h+='<span style="font-size:11px;color:'+txtSub+'">'+(S.studios[sid]?S.studios[sid].name:sid)+'</span>';
        h+='<span style="font-size:9px;color:'+txtSub+';margin-left:auto">Aucune d\u00e9pense</span>';
        h+='</div>';
      });
      h+='</div>';
      h+='</div>';
    });

  } else {
    // ═══ VUE ACTIONNAIRES : barres proportionnelles ═══
    h+='<div style="background:'+cardBg+';border:1px solid '+borderC+';border-radius:14px;overflow:hidden">';
    h+='<div style="padding:16px 20px;border-bottom:1px solid '+borderC+';display:flex;align-items:center;gap:8px">';
    h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92630a" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>';
    h+='<span style="font-size:14px;font-weight:700;color:'+txtMain+'">Engagements par actionnaire</span>';
    h+='</div>';

    actData.forEach(function(ad,idx){
      var act=ad.act;
      var pctDeb=ad.total?Math.round(ad.debloque/ad.total*100):0;
      var barPct=maxActTotal>0?Math.max(3,Math.round(ad.total/maxActTotal*100)):0;
      var expanded=S.engExpanded['act_'+act.nom];

      h+='<div style="border-bottom:'+(idx<actData.length-1?'1px solid '+borderC:'none')+'">';

      // Ligne principale
      h+='<div onclick="toggleEngExpand(\'act_'+act.nom+'\')" style="padding:14px 20px;cursor:pointer;transition:background .15s" onmouseover="this.style.background=\''+(dm?'#1c2128':'#f8f9fb')+'\'" onmouseout="this.style.background=\'transparent\'">';
      h+='<div style="display:flex;align-items:center;gap:12px">';
      h+=avatarHTML(act.avatarNom||act.nom,40);
      h+='<div style="min-width:120px"><div style="font-size:13px;font-weight:600;color:'+txtMain+'">'+act.nom+'</div>';
      h+='<div style="font-size:10px;color:'+txtSub+'">'+act.desc+'</div></div>';

      // Barre proportionnelle
      h+='<div style="flex:1;display:flex;flex-direction:column;gap:2px">';
      h+='<div style="height:8px;border-radius:4px;background:'+(dm?'#21262d':'#f0f0ea')+';overflow:hidden">';
      h+='<div style="width:'+barPct+'%;height:100%;background:linear-gradient(90deg,'+act.color+'cc,'+act.color+');border-radius:4px;transition:width .3s"></div>';
      h+='</div>';
      if(ad.total>0){
        h+='<div style="display:flex;gap:8px;font-size:9px">';
        h+='<span style="color:#0F6E56">'+pctDeb+'% d\u00e9bloqu\u00e9</span>';
        h+='<span style="color:'+txtSub+'">'+Object.keys(ad.byStudio).length+' projet(s)</span>';
        h+='</div>';
      }
      h+='</div>';

      // Montant
      h+='<div style="text-align:right;min-width:100px"><div style="font-size:18px;font-weight:800;color:'+act.color+'">'+fmt(ad.total)+'</div></div>';
      h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+txtSub+'" stroke-width="2" style="transform:rotate('+(expanded?'180':'0')+'deg);transition:transform .2s;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>';
      h+='</div></div>';

      // Détail accordion
      if(expanded){
        h+='<div style="padding:0 20px 14px;background:'+(dm?'#0d1117':'#fafbfc')+'">';
        var stIds=Object.keys(ad.byStudio);
        stIds.forEach(function(sid){
          var st=ad.byStudio[sid];
          h+='<div onclick="openDetail(\''+sid+'\');setTimeout(function(){setDetailTab(\'engagements\')},50)" style="padding:8px 0;cursor:pointer;display:flex;align-items:center;gap:10px;font-size:11px">';
          h+='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="'+act.color+'" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
          h+='<span style="font-weight:600;color:'+txtMain+'">'+st.name+'</span>';
          h+='<span style="color:'+txtSub+'">'+st.deps.length+' d\u00e9p.</span>';
          h+='<span style="margin-left:auto;font-weight:700;color:'+act.color+'">'+fmt(st.total)+'</span>';
          h+='<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
          h+='</div>';
        });
        h+='</div>';
      }
      h+='</div>';
    });
    h+='</div>';
  }

  h+='<div style="text-align:center;margin-top:14px;font-size:11px;color:'+txtSub+'">';
  h+='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
  h+='Pour saisir ou modifier les d\u00e9penses, rendez-vous dans l\'onglet <b>Engagements</b> de chaque studio</div>';

  } // fin volet recap

  // ════════════════════════════════════════════════════════════════════════════
  // VOLET 2 : Fonds propres à injecter par actionnaire
  // ════════════════════════════════════════════════════════════════════════════
  if(S.engSection==='fondspropres'){

  var OWNERSHIP=OWNERSHIP_MAP;

  // FP par défaut par studio (capex standard - emprunt standard)
  var FP_DEFAUT=333500-230000; // 103 500 €

  // ── Cohorte 1 : données réelles ──
  var fpByStudio={};
  allIds.forEach(function(id){
    var s=S.studios[id];
    if(!s)return;
    var _capexDet=getCapexDetailForStudio(id);
    var _capexTots=computeCapexTotals(_capexDet);
    var capex=_capexTots.capex||s.capex||333500;
    var _hasCustomCapex=s.capexDetail&&Object.keys(s.capexDetail||{}).length>0;
    var emprunt=_hasCustomCapex?Math.round(capex*0.70):(s.emprunt||230000);
    var fp=capex-emprunt;
    fpByStudio[id]={name:s.name,societe:s.societe,capex:capex,emprunt:emprunt,fp:fp,cohorte:s.cohorte||1};
  });

  // ── Calcul FP par cohorte ──
  // Fonction pour agréger par actionnaire pour une cohorte donnée
  function computeFPForCohorte(coh){
    var result={};
    if(coh===1){
      // Données réelles
      allIds.forEach(function(id){
        var info=fpByStudio[id];
        if(!info||info.cohorte!==1)return;
        var owners=OWNERSHIP[info.societe]||[];
        owners.forEach(function(o){
          if(!result[o.nom])result[o.nom]={nom:o.nom,desc:o.desc,color:o.color,avatarNom:o.avatarNom,total:0,details:[]};
          var share=Math.round(info.fp*o.pct/100);
          result[o.nom].total+=share;
          result[o.nom].details.push({studio:info.name,studioId:id,societe:info.societe,pct:o.pct,type:o.type,fpStudio:info.fp,share:share});
        });
      });
    } else {
      // Simulation : nb studios × FP_DEFAUT × ownership%
      var simData=S.fpSimCohortes[coh]||{};
      SOCIETES_PORTEUSES.forEach(function(soc){
        var nb=simData[soc.societe]||0;
        if(nb<=0)return;
        var owners=OWNERSHIP[soc.societe]||[];
        owners.forEach(function(o){
          if(!result[o.nom])result[o.nom]={nom:o.nom,desc:o.desc,color:o.color,avatarNom:o.avatarNom,total:0,details:[]};
          var share=Math.round(FP_DEFAUT*o.pct/100*nb);
          result[o.nom].total+=share;
          result[o.nom].details.push({studio:nb+' studio(s) '+soc.short,studioId:null,societe:soc.societe,pct:o.pct,type:o.type,fpStudio:FP_DEFAUT*nb,share:share});
        });
      });
    }
    return result;
  }

  // Calcul pour chaque cohorte
  var fpParCohorte={};
  var totalFPGlobal=0;
  [1,2,3,4].forEach(function(c){
    fpParCohorte[c]=computeFPForCohorte(c);
    var tot=Object.keys(fpParCohorte[c]).reduce(function(s,k){return s+fpParCohorte[c][k].total;},0);
    fpParCohorte[c]._total=tot;
    totalFPGlobal+=tot;
  });

  // Agréger tous les actionnaires (toutes cohortes)
  var actionnaireFPGlobal={};
  [1,2,3,4].forEach(function(c){
    Object.keys(fpParCohorte[c]).forEach(function(k){
      if(k==='_total')return;
      if(!actionnaireFPGlobal[k])actionnaireFPGlobal[k]={nom:fpParCohorte[c][k].nom,total:0};
      actionnaireFPGlobal[k].total+=fpParCohorte[c][k].total;
    });
  });

  // ── Header gradient bleu ──
  h+='<div style="background:linear-gradient(135deg,#1a3a6b 0%,#2d5a8e 50%,#3b7dd8 100%);border-radius:16px;padding:22px 28px;margin-bottom:20px;position:relative;overflow:hidden">';
  h+='<div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.06)"></div>';
  h+='<div style="position:absolute;bottom:-30px;left:30%;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.04)"></div>';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">';
  h+='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
  h+='<span style="font-size:16px;font-weight:700;color:#fff">Combien chaque associ\u00e9 doit-il injecter ?</span></div>';
  h+='<div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:14px">Fonds propres = CAPEX \u2212 Emprunt, r\u00e9partis selon les quotes-parts de d\u00e9tention \u00b7 FP standard : '+fmt(FP_DEFAUT)+' / studio</div>';

  // KPIs
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">';
  h+='<div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:12px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Total global</div><div style="font-size:24px;font-weight:800;color:#fff">'+fmt(totalFPGlobal)+'</div><div style="font-size:10px;color:rgba(255,255,255,0.5)">toutes cohortes</div></div>';
  // Nb studios + nb actionnaires
  var nbStudiosC1=allIds.filter(function(id){return (S.studios[id]||{}).cohorte===1||!(S.studios[id]||{}).cohorte;}).length;
  var nbActFP=Object.keys(actionnaireFPGlobal).length;
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:12px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Cohorte 1</div><div style="font-size:24px;font-weight:800;color:#fff">'+fmt(fpParCohorte[1]._total)+'</div><div style="font-size:10px;color:rgba(255,255,255,0.5)">'+nbStudiosC1+' studio(s) r\u00e9els</div></div>';
  var simTotal=totalFPGlobal-fpParCohorte[1]._total;
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:12px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Cohortes 2\u20134</div><div style="font-size:24px;font-weight:800;color:'+(simTotal>0?'#93c5fd':'rgba(255,255,255,0.4)')+'">'+fmt(simTotal)+'</div><div style="font-size:10px;color:rgba(255,255,255,0.5)">simulation</div></div>';
  h+='</div>';

  // Barre de répartition par actionnaire (stacked)
  if(totalFPGlobal>0){
    h+='<div>';
    h+='<div style="font-size:9px;color:rgba(255,255,255,0.5);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">R\u00e9partition par actionnaire</div>';
    h+='<div style="height:10px;border-radius:5px;overflow:hidden;display:flex;gap:2px">';
    var fpSorted=Object.keys(actionnaireFPGlobal).sort(function(a,b){return actionnaireFPGlobal[b].total-actionnaireFPGlobal[a].total;});
    var barColors=['#3b82f6','#8b5cf6','#06b6d4','#f59e0b','#ef4444','#10b981'];
    fpSorted.forEach(function(k,i){
      var pct=Math.max(1,Math.round(actionnaireFPGlobal[k].total/totalFPGlobal*100));
      h+='<div title="'+k+' : '+fmt(actionnaireFPGlobal[k].total)+'" style="width:'+pct+'%;background:'+barColors[i%barColors.length]+';border-radius:3px"></div>';
    });
    h+='</div>';
    h+='<div style="display:flex;gap:10px;margin-top:6px;flex-wrap:wrap">';
    fpSorted.forEach(function(k,i){
      var pct=Math.round(actionnaireFPGlobal[k].total/totalFPGlobal*100);
      h+='<div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:2px;background:'+barColors[i%barColors.length]+'"></div><span style="font-size:9px;color:rgba(255,255,255,0.7)">'+k+' '+fmt(actionnaireFPGlobal[k].total)+' ('+pct+'%)</span></div>';
    });
    h+='</div></div>';
  }
  h+='</div>';

  // ── Onglets cohortes ──
  h+='<div style="display:flex;gap:6px;margin-bottom:14px">';
  [1,2,3,4].forEach(function(c){
    var active=S.fpSimActiveCohorte===(''+c);
    var hasData=fpParCohorte[c]._total>0;
    var cohIcon=c===1?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>':'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
    h+='<button onclick="toggleFpCohorte(\''+c+'\')" style="display:flex;align-items:center;gap:5px;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:'+(active?'700':'500')+';cursor:pointer;transition:all .2s;border:'+(active?'none':'1px solid '+borderC)+';background:'+(active?(dm?'#3b7dd8':'#1a3a6b'):(dm?'#21262d':'#fff'))+';color:'+(active?'#fff':(dm?'#8b949e':'#666'))+'">';
    h+=cohIcon+' C'+c;
    if(c===1)h+=' <span style="font-size:9px;opacity:0.7">(r\u00e9el)</span>';
    if(hasData&&!active)h+=' <span style="font-size:9px;opacity:0.6">'+fmt(fpParCohorte[c]._total)+'</span>';
    h+='</button>';
  });
  h+='</div>';

  // ── Contenu de la cohorte sélectionnée ──
  var activeCoh=parseInt(S.fpSimActiveCohorte)||1;
  var actionnaireFP=fpParCohorte[activeCoh];
  var totalFPCohorte=actionnaireFP._total||0;

  // Pour cohortes 2-4 : tableau de simulation
  if(activeCoh>=2){
    var simData=S.fpSimCohortes[activeCoh]||{};
    h+='<div style="background:'+cardBg+';border:1px solid '+borderC+';border-radius:14px;overflow:hidden;margin-bottom:16px">';
    h+='<div style="padding:16px 20px;border-bottom:1px solid '+borderC+';display:flex;align-items:center;gap:8px">';
    h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>';
    h+='<span style="font-size:14px;font-weight:700;color:'+txtMain+'">Simulateur Cohorte '+activeCoh+'</span>';
    h+='<span style="font-size:11px;color:'+txtSub+'">Combien de studios souhaitez-vous ouvrir ?</span>';
    h+='</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0">';
    SOCIETES_PORTEUSES.forEach(function(soc,si){
      var nb=simData[soc.societe]||0;
      var fpSoc=FP_DEFAUT*nb;
      h+='<div style="padding:20px;text-align:center;border-right:'+(si<2?'1px solid '+borderC:'none')+'">';
      h+='<div style="width:36px;height:36px;border-radius:10px;background:'+soc.color+'15;color:'+soc.color+';display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;margin:0 auto 8px">'+soc.short.split(' ').map(function(w){return w.charAt(0);}).join('')+'</div>';
      h+='<div style="font-size:12px;font-weight:600;color:'+txtMain+';margin-bottom:10px">'+soc.short+'</div>';
      h+='<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px">';
      h+='<button onclick="setFpSimCohorte('+activeCoh+',\''+soc.societe+'\',Math.max(0,'+(nb-1)+'))" style="width:32px;height:32px;border-radius:8px;border:1px solid '+borderC+';background:'+cardBg+';color:'+txtMain+';font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s" onmouseover="this.style.background=\''+(dm?'#30363d':'#f0f0ea')+'\'" onmouseout="this.style.background=\''+cardBg+'\'">-</button>';
      h+='<span style="font-size:28px;font-weight:800;color:'+soc.color+';min-width:36px">'+nb+'</span>';
      h+='<button onclick="setFpSimCohorte('+activeCoh+',\''+soc.societe+'\','+(nb+1)+')" style="width:32px;height:32px;border-radius:8px;border:1px solid '+borderC+';background:'+cardBg+';color:'+txtMain+';font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s" onmouseover="this.style.background=\''+(dm?'#30363d':'#f0f0ea')+'\'" onmouseout="this.style.background=\''+cardBg+'\'">+</button>';
      h+='</div>';
      h+='<div style="font-size:10px;color:'+txtSub+';margin-bottom:4px">studio(s) \u00e0 ouvrir</div>';
      if(nb>0)h+='<div style="font-size:14px;font-weight:700;color:'+soc.color+';margin-top:6px;padding:4px 10px;background:'+soc.color+'10;border-radius:6px;display:inline-block">'+fmt(fpSoc)+' FP</div>';
      h+='</div>';
    });
    h+='</div></div>';
  }

  // ═══ Tableau consolidé par actionnaire (barres proportionnelles) ═══
  var fpActifs=Object.keys(actionnaireFP).filter(function(k){return k!=='_total'&&actionnaireFP[k].total>0;});
  var maxFPAct=fpActifs.length>0?Math.max.apply(null,fpActifs.map(function(k){return actionnaireFP[k].total;})):0;

  if(fpActifs.length===0){
    h+='<div class="box" style="text-align:center;padding:2rem;color:#aaa;font-size:13px">';
    if(activeCoh===1)h+='Aucun studio en cohorte 1';
    else h+='Ajustez le nombre d\'ouvertures ci-dessus pour simuler les fonds propres n\u00e9cessaires.';
    h+='</div>';
  } else {
    // Trier par montant décroissant
    fpActifs.sort(function(a,b){return actionnaireFP[b].total-actionnaireFP[a].total;});

    h+='<div style="background:'+cardBg+';border:1px solid '+borderC+';border-radius:14px;overflow:hidden">';
    h+='<div style="padding:16px 20px;border-bottom:1px solid '+borderC+';display:flex;align-items:center;gap:8px">';
    h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>';
    h+='<span style="font-size:14px;font-weight:700;color:'+txtMain+'">Fonds propres par actionnaire</span>';
    h+='<span style="font-size:11px;color:'+txtSub+'">\u2014 Cohorte '+activeCoh+(activeCoh===1?' (donn\u00e9es r\u00e9elles)':' (simulation)')+'</span>';
    if(totalFPCohorte>0)h+='<span style="margin-left:auto;font-size:13px;font-weight:700;color:#1a3a6b">Total : '+fmt(totalFPCohorte)+'</span>';
    h+='</div>';

    fpActifs.forEach(function(k,idx){
      var a=actionnaireFP[k];
      var pctOfCoh=totalFPCohorte?Math.round(a.total/totalFPCohorte*100):0;
      var barPct=maxFPAct>0?Math.max(5,Math.round(a.total/maxFPAct*100)):0;
      var expanded=S.engExpanded['fp_'+a.nom+'_c'+activeCoh];

      h+='<div style="border-bottom:'+(idx<fpActifs.length-1?'1px solid '+borderC:'none')+'">';

      // Ligne principale
      h+='<div onclick="toggleEngExpand(\'fp_'+a.nom+'_c'+activeCoh+'\')" style="padding:14px 20px;cursor:pointer;transition:background .15s" onmouseover="this.style.background=\''+(dm?'#1c2128':'#f8f9fb')+'\'" onmouseout="this.style.background=\'transparent\'">';
      h+='<div style="display:flex;align-items:center;gap:12px">';
      h+=avatarHTML(a.avatarNom||a.nom,40);
      h+='<div style="min-width:120px"><div style="font-size:13px;font-weight:600;color:'+txtMain+'">'+a.nom+'</div>';
      h+='<div style="font-size:10px;color:'+txtSub+'">'+a.desc+'</div></div>';

      // Barre proportionnelle avec segments par société
      h+='<div style="flex:1;display:flex;flex-direction:column;gap:3px">';
      h+='<div style="height:10px;border-radius:5px;background:'+(dm?'#21262d':'#f0f0ea')+';overflow:hidden;display:flex;gap:1px">';
      // Segments colorés par société
      a.details.forEach(function(d){
        var socColor=SOCIETES_PORTEUSES.filter(function(s){return s.societe===d.societe;})[0];
        var segPct=a.total>0?Math.max(1,Math.round(d.share/maxFPAct*100)):0;
        h+='<div title="'+d.societe+' : '+fmt(d.share)+' ('+d.pct+'%)" style="width:'+segPct+'%;background:'+(socColor?socColor.color:'#64748b')+';border-radius:3px;transition:width .3s"></div>';
      });
      h+='</div>';
      // Légende société sous la barre
      h+='<div style="display:flex;gap:6px">';
      a.details.forEach(function(d){
        var socColor=SOCIETES_PORTEUSES.filter(function(s){return s.societe===d.societe;})[0];
        h+='<span style="font-size:9px;color:'+txtSub+'"><span style="display:inline-block;width:6px;height:6px;border-radius:2px;background:'+(socColor?socColor.color:'#64748b')+';vertical-align:middle;margin-right:2px"></span>'+d.pct+'%</span>';
      });
      h+='</div>';
      h+='</div>';

      // Montant + pourcentage
      h+='<div style="text-align:right;min-width:110px">';
      h+='<div style="font-size:18px;font-weight:800;color:#1a3a6b">'+fmt(a.total)+'</div>';
      h+='<span style="background:'+(dm?'#1a3a6b33':'#dbeafe')+';color:#1a3a6b;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:600">'+pctOfCoh+'% du total</span>';
      h+='</div>';

      // Chevron
      h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+txtSub+'" stroke-width="2" style="transform:rotate('+(expanded?'180':'0')+'deg);transition:transform .2s;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>';
      h+='</div></div>';

      // Détail accordion
      if(expanded){
        h+='<div style="padding:0 20px 14px;background:'+(dm?'#0d1117':'#fafbfc')+'">';
        a.details.forEach(function(d){
          var socColor=SOCIETES_PORTEUSES.filter(function(s){return s.societe===d.societe;})[0];
          var clickAttr=d.studioId?'onclick="openDetail(\''+d.studioId+'\');setTimeout(function(){setDetailTab(\'engagements\')},50)" style="cursor:pointer"':'';
          h+='<div '+clickAttr+' style="display:flex;align-items:center;gap:10px;padding:8px 0;font-size:11px">';
          h+='<div style="width:4px;height:24px;border-radius:2px;background:'+(socColor?socColor.color:'#64748b')+'"></div>';
          h+='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="'+(socColor?socColor.color:'#64748b')+'" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
          h+='<div style="flex:1"><span style="font-weight:600;color:'+txtMain+'">'+d.studio+'</span>';
          h+='<div style="font-size:10px;color:'+txtSub+'">'+d.societe+' \u00b7 '+d.type+' \u00b7 '+d.pct+'% de '+fmt(d.fpStudio)+'</div></div>';
          h+='<span style="font-weight:700;color:#1a3a6b">'+fmt(d.share)+'</span>';
          if(d.studioId)h+='<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
          h+='</div>';
        });
        h+='</div>';
      }
      h+='</div>';
    });
    h+='</div>';
  }

  } // fin volet fondspropres

  // ════════════════════════════════════════════════════════════════════════════
  // VOLET 3 : Comptes courants d'associés (auto-split via OWNERSHIP)
  // ════════════════════════════════════════════════════════════════════════════
  if(S.engSection==='comptescourants'){

  // Pour chaque dépense marquée "avance", le montant est ventilé entre les
  // associés concernés proportionnellement à leurs quotes-parts de détention.
  // Le payeur est toujours inclus dans le dénominateur pour normaliser.
  // Ex COBE : MM(40%)+Pilatine(20%) → Pilatine doit 21600×20/60 = 7200 €
  // Ex COBE tous : 21600×20/100 = 4320 € par associé à 20%
  var ccDetails=[]; // {creancier, debiteur, montant, studio, societe, desc, date, depTTC}

  allIds.forEach(function(id){
    var deps=S.depenses[id]||[];
    var sName=S.studios[id]?S.studios[id].name:id;
    var sSociete=S.studios[id]?S.studios[id].societe:'';
    var owners=OWNERSHIP_MAP[sSociete]||[];
    deps.forEach(function(d){
      if(!d.avance||!d.engage_par)return;
      var montantTotal=num(d.ttc);
      if(montantTotal<=0)return;
      var payeur=d.engage_par;
      // Déterminer les autres associés concernés (hors payeur)
      var concernes=d.avance_concernes&&d.avance_concernes.length>0?d.avance_concernes:owners.filter(function(o){return o.nom!==payeur;}).map(function(o){return o.nom;});
      // Calculer totalPct : somme des % du payeur + des concernés
      var totalPct=0;
      owners.forEach(function(o){
        if(o.nom===payeur||concernes.indexOf(o.nom)>=0)totalPct+=o.pct;
      });
      if(totalPct<=0)return;
      // Chaque concerné (hors payeur) doit : montant × son_pct / totalPct
      owners.forEach(function(o){
        if(o.nom===payeur)return;
        if(concernes.indexOf(o.nom)<0)return;
        var share=Math.round(montantTotal*o.pct/totalPct);
        if(share<=0)return;
        ccDetails.push({creancier:payeur,debiteur:o.nom,montant:share,studio:sName,societe:sSociete,desc:d.description||d.categorie,date:d.date||'',depTTC:montantTotal});
      });
    });
  });

  // Agréger par associé
  var ccAssocies={};
  ACTIONNAIRES.forEach(function(a){
    ccAssocies[a.nom]={nom:a.nom,avatarNom:a.avatarNom||a.nom,desc:a.desc,color:a.color,avancePar:0,avancePour:0,solde:0,detailsCreances:[],detailsDettes:[]};
  });
  DEPENSE_CONTRIBUTORS.forEach(function(c){
    if(!ccAssocies[c])ccAssocies[c]={nom:c,avatarNom:c,desc:'',color:'#64748b',avancePar:0,avancePour:0,solde:0,detailsCreances:[],detailsDettes:[]};
  });

  ccDetails.forEach(function(f){
    if(ccAssocies[f.creancier]){
      ccAssocies[f.creancier].avancePar+=f.montant;
      ccAssocies[f.creancier].detailsCreances.push(f);
    }
    if(ccAssocies[f.debiteur]){
      ccAssocies[f.debiteur].avancePour+=f.montant;
      ccAssocies[f.debiteur].detailsDettes.push(f);
    }
  });

  var totalAvances=0;
  var totalCreancesNettes=0;
  var totalDettesNettes=0;
  Object.keys(ccAssocies).forEach(function(k){
    var a=ccAssocies[k];
    a.solde=a.avancePar-a.avancePour;
    if(a.solde>0)totalCreancesNettes+=a.solde;
    if(a.solde<0)totalDettesNettes+=Math.abs(a.solde);
    totalAvances+=a.avancePar;
  });

  var ccActifs=Object.keys(ccAssocies).filter(function(k){
    return ccAssocies[k].avancePar>0||ccAssocies[k].avancePour>0;
  }).map(function(k){return ccAssocies[k];});

  // ── Header gradient vert avec KPIs + barre d'équilibre ──
  h+='<div style="background:linear-gradient(135deg,#0F6E56 0%,#1a9e7a 50%,#22c55e 100%);border-radius:16px;padding:22px 28px;margin-bottom:20px;position:relative;overflow:hidden">';
  h+='<div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.06)"></div>';
  h+='<div style="position:absolute;bottom:-30px;left:30%;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.04)"></div>';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">';
  h+='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
  h+='<span style="font-size:16px;font-weight:700;color:#fff">Comptes courants d\'associ\u00e9s</span></div>';
  h+='<div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:14px">Qui doit quoi \u00e0 qui ? R\u00e9partition automatique selon les quotes-parts de d\u00e9tention</div>';
  // KPIs
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">';
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:10px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Total avanc\u00e9</div><div style="font-size:22px;font-weight:800;color:#fff">'+fmt(totalAvances)+'</div></div>';
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:10px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Cr\u00e9ances</div><div style="font-size:22px;font-weight:800;color:#d1fae5">'+fmt(totalCreancesNettes)+'</div></div>';
  h+='<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:10px 14px;text-align:center"><div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Dettes</div><div style="font-size:22px;font-weight:800;color:#fef3c7">'+fmt(totalDettesNettes)+'</div></div>';
  h+='</div>';
  // Barre d'équilibre créanciers/débiteurs
  if(totalCreancesNettes>0||totalDettesNettes>0){
    var barTotal=totalCreancesNettes+totalDettesNettes;
    var pctCreances=Math.round(totalCreancesNettes/barTotal*100);
    h+='<div style="margin-top:4px">';
    h+='<div style="display:flex;justify-content:space-between;font-size:9px;color:rgba(255,255,255,0.6);margin-bottom:4px"><span>Cr\u00e9anciers</span><span>D\u00e9biteurs</span></div>';
    h+='<div style="height:8px;border-radius:4px;background:rgba(255,255,255,0.1);overflow:hidden;display:flex">';
    h+='<div style="width:'+pctCreances+'%;background:#d1fae5;border-radius:4px 0 0 4px;transition:width .3s"></div>';
    h+='<div style="width:'+(100-pctCreances)+'%;background:#fbbf24;border-radius:0 4px 4px 0;transition:width .3s"></div>';
    h+='</div></div>';
  }
  h+='</div>';

  if(ccActifs.length===0){
    h+='<div class="box" style="text-align:center;padding:2rem;color:#aaa;font-size:13px">Aucune avance inter-associ\u00e9s enregistr\u00e9e.<br><span style="font-size:11px">Pour enregistrer une avance, cochez \u00ab R\u00e9partir entre associ\u00e9s \u00bb lors de la saisie d\'une d\u00e9pense.</span></div>';
  } else {

    // ═══ SECTION 1 : Tableau de flux — Qui doit quoi à qui ? ═══
    h+='<div style="background:'+cardBg+';border:1px solid '+borderC+';border-radius:14px;overflow:hidden;margin-bottom:20px">';
    h+='<div style="padding:16px 20px;border-bottom:1px solid '+borderC+';display:flex;align-items:center;gap:8px">';
    h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/></svg>';
    h+='<span style="font-size:14px;font-weight:700;color:'+txtMain+'">Flux de dettes</span>';
    h+='<span style="font-size:11px;color:'+txtSub+';margin-left:4px">'+ccDetails.length+' op\u00e9ration(s)</span>';
    h+='</div>';

    // Trouver le max montant pour proportionnalité des barres
    var maxFlux=Math.max.apply(null,ccDetails.map(function(f){return f.montant;}));

    ccDetails.forEach(function(f,idx){
      var pctBar=maxFlux>0?Math.max(10,Math.round(f.montant/maxFlux*100)):50;
      // Trouver couleur et avatarNom pour débiteur et créancier
      var debInfo=ccAssocies[f.debiteur]||{};
      var creInfo=ccAssocies[f.creancier]||{};

      h+='<div style="padding:14px 20px;border-bottom:'+(idx<ccDetails.length-1?'1px solid '+borderC:'none')+';transition:background .15s" onmouseover="this.style.background=\''+(dm?'#1c2128':'#f8f9fb')+'\'" onmouseout="this.style.background=\'transparent\'">';

      // Ligne principale : débiteur → montant → créancier
      h+='<div style="display:flex;align-items:center;gap:12px">';

      // Débiteur (à gauche)
      h+='<div style="display:flex;align-items:center;gap:8px;min-width:130px">';
      h+=avatarHTML(debInfo.avatarNom||f.debiteur,32);
      h+='<div><div style="font-size:12px;font-weight:600;color:'+txtMain+'">'+f.debiteur+'</div>';
      h+='<div style="font-size:9px;color:#B45309;font-weight:500">doit</div></div>';
      h+='</div>';

      // Flèche + montant (centre)
      h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;position:relative">';
      h+='<div style="font-size:15px;font-weight:800;color:'+txtMain+'">'+fmt(f.montant)+'</div>';
      // Barre animée
      h+='<div style="width:100%;height:4px;background:'+(dm?'#21262d':'#f0f0ea')+';border-radius:2px;position:relative;overflow:hidden">';
      h+='<div style="position:absolute;left:0;top:0;height:100%;width:'+pctBar+'%;background:linear-gradient(90deg,#B45309,#0F6E56);border-radius:2px"></div>';
      h+='</div>';
      // Flèche
      h+='<svg width="20" height="10" viewBox="0 0 20 10" style="color:'+txtSub+'"><path d="M0 5h16M13 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
      h+='</div>';

      // Créancier (à droite)
      h+='<div style="display:flex;align-items:center;gap:8px;min-width:130px;justify-content:flex-end">';
      h+='<div style="text-align:right"><div style="font-size:12px;font-weight:600;color:'+txtMain+'">'+f.creancier+'</div>';
      h+='<div style="font-size:9px;color:#0F6E56;font-weight:500">cr\u00e9ancier</div></div>';
      h+=avatarHTML(creInfo.avatarNom||f.creancier,32);
      h+='</div>';

      h+='</div>';

      // Sous-texte : description + société + studio
      h+='<div style="text-align:center;margin-top:4px;font-size:10px;color:'+txtSub+'">';
      h+=(f.desc||'')+' \u00b7 '+f.societe+' \u2014 '+f.studio;
      if(f.date)h+=' \u00b7 '+f.date;
      h+='</div>';

      h+='</div>';
    });
    h+='</div>';

    // ═══ SECTION 2 : Soldes nets par associé (barres horizontales) ═══
    h+='<div style="background:'+cardBg+';border:1px solid '+borderC+';border-radius:14px;overflow:hidden">';
    h+='<div style="padding:16px 20px;border-bottom:1px solid '+borderC+';display:flex;align-items:center;gap:8px">';
    h+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>';
    h+='<span style="font-size:14px;font-weight:700;color:'+txtMain+'">Soldes nets par associ\u00e9</span>';
    h+='</div>';

    // Trier : créanciers d'abord (solde décroissant), puis débiteurs
    var ccSorted=ccActifs.slice().sort(function(a,b){return b.solde-a.solde;});
    var maxSolde=Math.max.apply(null,ccSorted.map(function(a){return Math.abs(a.solde);}));

    ccSorted.forEach(function(a,idx){
      var soldeColor=a.solde>0?'#0F6E56':a.solde<0?'#B45309':'#64748b';
      var soldeLabel=a.solde>0?'Cr\u00e9ancier':a.solde<0?'D\u00e9biteur':'\u00c9quilibr\u00e9';
      var soldeBg=a.solde>0?(dm?'#052e16':'#d1fae5'):a.solde<0?(dm?'#451a03':'#fef3c7'):(dm?'#21262d':'#f0f0ea');
      var barPct=maxSolde>0?Math.max(5,Math.round(Math.abs(a.solde)/maxSolde*100)):0;
      var expanded=S.engExpanded['cc_'+a.nom];

      h+='<div style="border-bottom:'+(idx<ccSorted.length-1?'1px solid '+borderC:'none')+'">';

      // Ligne principale cliquable
      h+='<div onclick="toggleEngExpand(\'cc_'+a.nom+'\')" style="padding:14px 20px;cursor:pointer;transition:background .15s" onmouseover="this.style.background=\''+(dm?'#1c2128':'#f8f9fb')+'\'" onmouseout="this.style.background=\'transparent\'">';
      h+='<div style="display:flex;align-items:center;gap:12px">';

      // Avatar + nom
      h+=avatarHTML(a.avatarNom,36);
      h+='<div style="min-width:120px"><div style="font-size:13px;font-weight:600;color:'+txtMain+'">'+a.nom+'</div>';
      h+='<div style="font-size:10px;color:'+txtSub+'">'+a.desc+'</div></div>';

      // Barre de solde (centrée sur zéro)
      h+='<div style="flex:1;display:flex;align-items:center;gap:0">';
      if(a.solde<0){
        // Débiteur : barre orange à gauche
        h+='<div style="flex:1;display:flex;justify-content:flex-end"><div style="width:'+barPct+'%;height:10px;background:linear-gradient(90deg,#fbbf2440,#B45309);border-radius:5px;transition:width .3s"></div></div>';
        h+='<div style="width:2px;height:16px;background:'+borderC+';margin:0 4px;flex-shrink:0"></div>';
        h+='<div style="flex:1"></div>';
      } else if(a.solde>0){
        // Créancier : barre verte à droite
        h+='<div style="flex:1"></div>';
        h+='<div style="width:2px;height:16px;background:'+borderC+';margin:0 4px;flex-shrink:0"></div>';
        h+='<div style="flex:1"><div style="width:'+barPct+'%;height:10px;background:linear-gradient(90deg,#0F6E56,#22c55e80);border-radius:5px;transition:width .3s"></div></div>';
      } else {
        h+='<div style="flex:1"></div><div style="width:2px;height:16px;background:'+borderC+';margin:0 4px"></div><div style="flex:1"></div>';
      }
      h+='</div>';

      // Montant + badge
      h+='<div style="text-align:right;min-width:110px">';
      h+='<div style="font-size:16px;font-weight:800;color:'+soldeColor+'">'+fmt(Math.abs(a.solde))+'</div>';
      h+='<span style="background:'+soldeBg+';color:'+soldeColor+';padding:2px 8px;border-radius:4px;font-size:9px;font-weight:600">'+soldeLabel+'</span>';
      h+='</div>';

      // Chevron
      h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+txtSub+'" stroke-width="2" style="transform:rotate('+(expanded?'180':'0')+'deg);transition:transform .2s;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>';

      h+='</div></div>';

      // Détail accordion
      if(expanded){
        h+='<div style="padding:0 20px 14px;background:'+(dm?'#0d1117':'#fafbfc')+'">';
        h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">';
        h+='<div style="text-align:center;padding:6px;background:'+(dm?'#21262d':'#f0f0ea')+';border-radius:8px"><div style="font-size:9px;color:'+txtSub+'">Avanc\u00e9 par lui</div><div style="font-size:13px;font-weight:700;color:#0F6E56">'+fmt(a.avancePar)+'</div></div>';
        h+='<div style="text-align:center;padding:6px;background:'+(dm?'#21262d':'#f0f0ea')+';border-radius:8px"><div style="font-size:9px;color:'+txtSub+'">Avanc\u00e9 pour lui</div><div style="font-size:13px;font-weight:700;color:#B45309">'+fmt(a.avancePour)+'</div></div>';
        h+='<div style="text-align:center;padding:6px;background:'+soldeBg+';border-radius:8px"><div style="font-size:9px;color:'+txtSub+'">Solde net</div><div style="font-size:13px;font-weight:700;color:'+soldeColor+'">'+fmt(Math.abs(a.solde))+'</div></div>';
        h+='</div>';
        if(a.detailsCreances.length>0){
          h+='<div style="font-size:10px;font-weight:600;color:#0F6E56;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Avances effectu\u00e9es</div>';
          a.detailsCreances.forEach(function(f){
            h+='<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11px">';
            h+='<span style="color:#0F6E56;font-size:12px">\u2191</span>';
            h+='<span style="font-weight:600;color:'+txtMain+'">'+fmt(f.montant)+'</span> <span style="color:'+txtSub+'">pour</span> <span style="font-weight:500;color:'+txtMain+'">'+f.debiteur+'</span>';
            h+='<span style="margin-left:auto;font-size:10px;color:'+txtSub+'">'+f.societe+' \u2014 '+f.studio+'</span>';
            h+='</div>';
          });
        }
        if(a.detailsDettes.length>0){
          h+='<div style="font-size:10px;font-weight:600;color:#B45309;text-transform:uppercase;letter-spacing:0.5px;margin:'+(a.detailsCreances.length>0?'8px':'0')+' 0 4px">Dettes</div>';
          a.detailsDettes.forEach(function(f){
            h+='<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11px">';
            h+='<span style="color:#B45309;font-size:12px">\u2193</span>';
            h+='<span style="font-weight:600;color:'+txtMain+'">'+fmt(f.montant)+'</span> <span style="color:'+txtSub+'">de</span> <span style="font-weight:500;color:'+txtMain+'">'+f.creancier+'</span>';
            h+='<span style="margin-left:auto;font-size:10px;color:'+txtSub+'">'+f.societe+' \u2014 '+f.studio+'</span>';
            h+='</div>';
          });
        }
        h+='</div>';
      }
      h+='</div>';
    });
    h+='</div>';
  }

  } // fin volet comptescourants

  return h;
}

function renderBPConsolide(){
  var allIds=_getStudioIds();
  var h='';
  // Header
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px">';
  h+='<div><div style="font-size:20px;font-weight:700;color:#1a1a1a">BP Consolidé</div><div style="font-size:12px;color:#888;margin-top:2px">Agrégation automatique des Business Plans de '+allIds.length+' studios — basé sur les scénarios actifs</div></div>';
  h+='<div style="display:flex;align-items:center;gap:8px">'+renderSearchBar()+userAvatarWidget(S.profile)+'</div>';
  h+='</div>';

  if(!allIds.length){
    h+=(typeof emptyState==='function')?emptyState('folder','Aucun studio disponible','Créez votre premier studio pour commencer.'):'<div style="text-align:center;color:#bbb;padding:40px;font-size:13px">Aucun studio disponible</div>';
    return h;
  }

  // Aggregate data from active scenarios
  var totCapex=0,totCA1=0,totCA2=0,totCA3=0,totMembres=0;
  var totEbitda1=0,totEbitda2=0,totEbitda3=0;
  var totRex1=0,totRex2=0,totRex3=0;
  var totRN1=0,totRN2=0,totRN3=0;
  var totCashNet1=0,totCashNet2=0,totCashNet3=0;
  var studioRows=[];

  allIds.forEach(function(id){
    var s=S.studios[id];
    if(!s)return;
    var md=(s.forecast&&s.forecast.moisDebut)||0;
    var bpOpts=getStudioBPOpts(id);

    // CA depuis le scénario actif (pas le BP initial)
    var ca1=_getScenarioCA(id,1);
    var ca2=_getScenarioCA(id,2);
    var ca3=_getScenarioCA(id,3);

    // Construire les BP détaillés avec le CA du scénario actif
    var bp1,bp2,bp3;
    try{
      bp1=buildBPFromDossier(ca1,md,1,id,bpOpts);
      bp2=buildBPFromDossier(ca2,md,2,id,bpOpts);
      bp3=buildBPFromDossier(ca3,md,3,id,bpOpts);
    }catch(e){
      bp1=[];bp2=[];bp3=[];
    }

    // Agréger les indicateurs depuis les BP mensuels
    var ebitda1=bp1.reduce(function(s,r){return s+(r._ebitda||0);},0);
    var ebitda2=bp2.reduce(function(s,r){return s+(r._ebitda||0);},0);
    var ebitda3=bp3.reduce(function(s,r){return s+(r._ebitda||0);},0);
    var rex1=bp1.reduce(function(s,r){return s+(r._rex||0);},0);
    var rex2=bp2.reduce(function(s,r){return s+(r._rex||0);},0);
    var rex3=bp3.reduce(function(s,r){return s+(r._rex||0);},0);
    var rn1=bp1.reduce(function(s,r){return s+(r._result||0);},0);
    var rn2=bp2.reduce(function(s,r){return s+(r._result||0);},0);
    var rn3=bp3.reduce(function(s,r){return s+(r._result||0);},0);
    var cashnet1=bp1.reduce(function(s,r){return s+(r._cashnet||0);},0);
    var cashnet2=bp2.reduce(function(s,r){return s+(r._cashnet||0);},0);
    var cashnet3=bp3.reduce(function(s,r){return s+(r._cashnet||0);},0);

    // Membres fin d'année 3
    var actuel=S.adherents[id]||{};
    var membresFinA3=actuel['y3_m11']!=null?num(actuel['y3_m11']):(getBPAdherents(id)[35]||400);

    totCapex+=s.capex||0;
    totCA1+=ca1;totCA2+=ca2;totCA3+=ca3;
    totEbitda1+=ebitda1;totEbitda2+=ebitda2;totEbitda3+=ebitda3;
    totRex1+=rex1;totRex2+=rex2;totRex3+=rex3;
    totRN1+=rn1;totRN2+=rn2;totRN3+=rn3;
    totCashNet1+=cashnet1;totCashNet2+=cashnet2;totCashNet3+=cashnet3;
    totMembres+=membresFinA3;

    var scLabel=_getScenarioLabel(id);
    studioRows.push({
      id:id,name:s.name,societe:s.societe,statut:s.statut,capex:s.capex||0,
      ca1:ca1,ca2:ca2,ca3:ca3,
      ebitda1:ebitda1,ebitda2:ebitda2,ebitda3:ebitda3,
      rex1:rex1,rex2:rex2,rex3:rex3,
      rn1:rn1,rn2:rn2,rn3:rn3,
      cashnet1:cashnet1,cashnet2:cashnet2,cashnet3:cashnet3,
      membres:membresFinA3,
      margeEbitda1:ca1>0?Math.round(ebitda1/ca1*100):0,
      margeEbitda3:ca3>0?Math.round(ebitda3/ca3*100):0,
      scenario:scLabel
    });
  });

  var margeEbitda1Tot=totCA1>0?Math.round(totEbitda1/totCA1*100):0;
  var margeEbitda2Tot=totCA2>0?Math.round(totEbitda2/totCA2*100):0;
  var margeEbitda3Tot=totCA3>0?Math.round(totEbitda3/totCA3*100):0;

  // ══════════════════════════════════════════════
  // HERO BANNER — CA consolidé avec gradient premium
  // ══════════════════════════════════════════════
  h+='<div style="position:relative;border-radius:20px;overflow:hidden;margin-bottom:20px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 40%,#334155 100%);padding:32px 36px;color:#fff">';
  // Orbes décoratifs
  h+='<div style="position:absolute;top:-40px;right:-30px;width:180px;height:180px;background:radial-gradient(circle,rgba(99,102,241,0.15),transparent 70%);border-radius:50%;pointer-events:none"></div>';
  h+='<div style="position:absolute;bottom:-50px;left:20%;width:200px;height:200px;background:radial-gradient(circle,rgba(16,185,129,0.1),transparent 70%);border-radius:50%;pointer-events:none"></div>';
  h+='<div style="position:absolute;top:20px;left:50%;width:100px;height:100px;background:radial-gradient(circle,rgba(139,92,246,0.12),transparent 70%);border-radius:50%;pointer-events:none"></div>';
  // Dot grid subtle
  h+='<div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:20px 20px;pointer-events:none"></div>';
  // Title
  h+='<div style="position:relative;z-index:1">';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">';
  h+='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>';
  h+='<span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#818cf8">Chiffre d\'affaires consolidé</span>';
  h+='</div>';
  // CA Cards row
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:20px">';
  var _caCards=[
    {l:'Année 1',sub:'Lancement',v:totCA1,grad:'linear-gradient(135deg,#065f46,#059669)',glow:'rgba(16,185,129,0.25)',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg>'},
    {l:'Année 2',sub:'Croissance',v:totCA2,grad:'linear-gradient(135deg,#1e40af,#3b82f6)',glow:'rgba(59,130,246,0.25)',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>'},
    {l:'Année 3',sub:'Croisière',v:totCA3,grad:'linear-gradient(135deg,#5b21b6,#8b5cf6)',glow:'rgba(139,92,246,0.3)',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'},
    {l:'CAPEX Total',sub:'Investissement',v:totCapex,grad:'linear-gradient(135deg,#78350f,#d97706)',glow:'rgba(217,119,6,0.2)',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'}
  ];
  _caCards.forEach(function(k){
    h+='<div style="background:'+k.grad+';border-radius:16px;padding:18px 20px;position:relative;overflow:hidden;transition:all .3s;cursor:default;box-shadow:0 4px 20px '+k.glow+'" onmouseenter="this.style.transform=\'translateY(-4px) scale(1.02)\';this.style.boxShadow=\'0 8px 30px '+k.glow+'\'" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'0 4px 20px '+k.glow+'\'">';
    h+='<div style="position:absolute;top:-15px;right:-15px;width:60px;height:60px;background:rgba(255,255,255,0.06);border-radius:50%"></div>';
    h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">'+k.icon+'<span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.7)">'+k.l+'</span></div>';
    h+='<div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;line-height:1">'+fmt(k.v)+'</div>';
    h+='<div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:4px;font-weight:500">'+k.sub+'</div>';
    h+='</div>';
  });
  h+='</div></div></div>';

  // ══════════════════════════════════════════════
  // RENTABILITÉ A3 — Glassmorphism cards
  // ══════════════════════════════════════════════
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
  h+='<span style="font-size:12px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:1px">Rentabilité consolidée — Année 3</span>';
  h+='<span style="font-size:10px;color:#94a3b8;font-weight:500">(croisière)</span>';
  h+='</div>';

  // ── Donuts visuels : marges clés ──
  if(typeof donutChart==='function' && totCA3>0){
    var _rexMargin=Math.round(totRex3/totCA3*100);
    var _cashMargin=Math.round(totCashNet3/totCA3*100);
    var _donuts=[
      {p:Math.max(0,margeEbitda3Tot),color:'#10b981',label:'Marge EBITDA',sub:'sur CA A3'},
      {p:Math.max(0,_rexMargin),color:'#f59e0b',label:'Marge REX',sub:'sur CA A3'},
      {p:Math.max(0,_cashMargin),color:'#3b82f6',label:'Ratio Cash',sub:'sur CA A3'}
    ];
    h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px">';
    _donuts.forEach(function(d){
      h+='<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px;display:flex;align-items:center;gap:18px;box-shadow:0 1px 3px rgba(0,0,0,0.03)">';
      h+=donutChart(d.p,{size:84,stroke:9,color:d.color});
      h+='<div style="flex:1"><div style="font-size:11px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.6px">'+d.label+'</div>';
      h+='<div style="font-size:10px;color:#94a3b8;margin-top:3px">'+d.sub+'</div>';
      h+='<div style="font-size:18px;font-weight:800;color:'+d.color+';margin-top:4px;letter-spacing:-0.3px">'+d.p+'%</div>';
      h+='</div></div>';
    });
    h+='</div>';
  }

  h+='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:22px">';
  var _rentaCards=[
    {l:'EBITDA',v:fmt(totEbitda3),pos:totEbitda3>=0,accent:'#10b981',bg:'linear-gradient(135deg,#ecfdf5,#d1fae5)',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>'},
    {l:'Marge EBITDA',v:margeEbitda3Tot+'%',pos:margeEbitda3Tot>=0,accent:'#6366f1',bg:'linear-gradient(135deg,#eef2ff,#e0e7ff)',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>',pbar:true,pval:Math.min(margeEbitda3Tot,60)},
    {l:'REX',v:fmt(totRex3),pos:totRex3>=0,accent:'#f59e0b',bg:'linear-gradient(135deg,#fffbeb,#fef3c7)',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'},
    {l:'Cash Net',v:fmt(totCashNet3),pos:totCashNet3>=0,accent:'#3b82f6',bg:'linear-gradient(135deg,#eff6ff,#dbeafe)',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>'},
    {l:'Membres',v:totMembres.toLocaleString('fr-FR'),pos:true,accent:'#8b5cf6',bg:'linear-gradient(135deg,#f5f3ff,#ede9fe)',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'}
  ];
  _rentaCards.forEach(function(k){
    h+='<div style="background:'+k.bg+';border:1px solid '+(k.pos?k.accent+'20':'#fecaca')+';border-radius:16px;padding:16px 18px;transition:all .3s;cursor:default;position:relative;overflow:hidden" onmouseenter="this.style.transform=\'translateY(-3px)\';this.style.boxShadow=\'0 8px 25px '+k.accent+'18\'" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'none\'">';
    h+='<div style="position:absolute;top:-10px;right:-10px;width:50px;height:50px;background:'+k.accent+'08;border-radius:50%"></div>';
    h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">'+k.icon+'<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748b">'+k.l+'</span></div>';
    h+='<div style="font-size:22px;font-weight:800;color:'+(k.pos?k.accent:'#dc2626')+';letter-spacing:-0.3px">'+k.v+'</div>';
    // Progress bar for marge
    if(k.pbar){
      var pw=Math.max(0,Math.min(k.pval/60*100,100));
      h+='<div style="margin-top:10px;height:5px;background:#e2e8f0;border-radius:3px;overflow:hidden">';
      h+='<div style="width:'+pw+'%;height:100%;background:linear-gradient(90deg,'+k.accent+','+k.accent+'88);border-radius:3px;transition:width .6s ease"></div>';
      h+='</div>';
      h+='<div style="font-size:8px;color:#94a3b8;margin-top:3px;text-align:right">obj. 60%</div>';
    }
    h+='</div>';
  });
  h+='</div>';

  // ══════════════════════════════════════════════
  // SYNTHÈSE P&L — Premium table avec barres de contexte
  // ══════════════════════════════════════════════
  h+='<div style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:24px 28px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">';
  h+='<div style="display:flex;align-items:center;gap:10px">';
  h+='<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>';
  h+='<div><div style="font-size:15px;font-weight:700;color:#1a1a1a">Synthèse P&L consolidée</div>';
  h+='<div style="font-size:10px;color:#94a3b8;font-weight:500">Évolution sur 3 ans</div></div></div>';
  // Year pills legend
  h+='<div style="display:flex;gap:6px">';
  [{l:'A1',c:'#10b981'},{l:'A2',c:'#3b82f6'},{l:'A3',c:'#8b5cf6'}].forEach(function(y){
    h+='<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:8px;background:'+y.c+'10;font-size:10px;font-weight:600;color:'+y.c+'"><span style="width:6px;height:6px;border-radius:50%;background:'+y.c+'"></span>'+y.l+'</span>';
  });
  h+='</div></div>';

  h+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:separate;border-spacing:0">';
  h+='<thead><tr style="background:linear-gradient(90deg,#f8fafc,#f1f5f9)">';
  h+='<th style="text-align:left;padding:12px 16px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;border-bottom:2px solid #e2e8f0;border-radius:10px 0 0 0">Indicateur</th>';
  h+='<th style="padding:12px 20px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#10b981;font-weight:700;border-bottom:2px solid #e2e8f0;text-align:center">Année 1</th>';
  h+='<th style="padding:12px 20px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#3b82f6;font-weight:700;border-bottom:2px solid #e2e8f0;text-align:center">Année 2</th>';
  h+='<th style="padding:12px 20px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#8b5cf6;font-weight:700;border-bottom:2px solid #e2e8f0;text-align:center;border-radius:0 10px 0 0">Année 3</th>';
  h+='<th style="padding:12px 16px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;border-bottom:2px solid #e2e8f0;text-align:center;width:120px">Tendance</th>';
  h+='</tr></thead><tbody>';
  var synthRows=[
    {l:'Chiffre d\'affaires',v:[totCA1,totCA2,totCA3],bold:true,icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>'},
    {l:'EBITDA',v:[totEbitda1,totEbitda2,totEbitda3],bold:true,icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>'},
    {l:'Marge EBITDA',v:[margeEbitda1Tot,margeEbitda2Tot,margeEbitda3Tot],pct:true,icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>'},
    {l:'REX',v:[totRex1,totRex2,totRex3],icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'},
    {l:'Résultat net',v:[totRN1,totRN2,totRN3],icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'},
    {l:'Cash net disponible',v:[totCashNet1,totCashNet2,totCashNet3],bold:true,icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>'}
  ];
  var _yearColors=['#10b981','#3b82f6','#8b5cf6'];
  synthRows.forEach(function(r,ri){
    var isLast=ri===synthRows.length-1;
    h+='<tr style="transition:background .15s" onmouseenter="this.style.background=\''+(S.darkMode?'#1c2128':'#f8fafc')+'\'" onmouseleave="this.style.background=\'transparent\'">';
    h+='<td style="padding:12px 16px;font-weight:'+(r.bold?'700':'500')+';font-size:12px;color:#1e293b;border-bottom:'+(isLast?'none':'1px solid #f1f5f9')+'"><div style="display:flex;align-items:center;gap:8px">'+r.icon+r.l+'</div></td>';
    r.v.forEach(function(v,vi){
      var color=r.pct?(v>=0?_yearColors[vi]:'#dc2626'):(v>=0?'#1e293b':'#dc2626');
      var display=r.pct?(v+'%'):fmt(v);
      var fw=r.bold?'700':'600';
      h+='<td style="padding:12px 20px;font-weight:'+fw+';color:'+color+';text-align:center;font-size:13px;border-bottom:'+(isLast?'none':'1px solid #f1f5f9')+(v<0?';background:#fef2f2':'')+'">'+display+'</td>';
    });
    // Sparkline tendance (mini 3-point)
    var vals=r.v;
    var _max=Math.max.apply(null,vals.map(function(x){return Math.abs(x);}));
    if(_max===0)_max=1;
    var pts=vals.map(function(v,i){return (10+i*25)+','+(25-Math.round(v/_max*20));});
    var trendUp=vals[2]>vals[0];
    h+='<td style="padding:12px 16px;text-align:center;border-bottom:'+(isLast?'none':'1px solid #f1f5f9')+'">';
    h+='<svg width="70" height="30" viewBox="0 0 70 30" style="vertical-align:middle">';
    h+='<polyline points="'+pts.join(' ')+'" fill="none" stroke="'+(trendUp?'#10b981':'#ef4444')+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    vals.forEach(function(v,i){
      h+='<circle cx="'+(10+i*25)+'" cy="'+(25-Math.round(v/_max*20))+'" r="3" fill="'+_yearColors[i]+'"/>';
    });
    h+='</svg>';
    h+='<div style="font-size:8px;font-weight:600;color:'+(trendUp?'#10b981':'#ef4444')+'">'+(trendUp?'▲':'▼')+' '+(r.pct?(vals[2]-vals[0])+'pts':fmt(vals[2]-vals[0]))+'</div>';
    h+='</td>';
    h+='</tr>';
  });
  h+='</tbody></table></div></div>';

  // ── Graphique barres interactif ──
  h+='<div class="box" style="margin-bottom:16px;position:relative">';
  // Header du graphique
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">';
  h+='<div>';
  h+='<div style="font-size:15px;font-weight:700;color:#1a1a1a">EBITDA par studio</div>';
  h+='<div style="font-size:11px;color:#999;margin-top:2px">Répartition sur 3 ans (A1 · A2 · A3)</div>';
  h+='</div>';
  // Légende inline
  h+='<div style="display:flex;align-items:center;gap:16px">';
  h+='<div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:3px;background:linear-gradient(135deg,#0F6E56,#15956F)"></div><span style="font-size:10px;color:#888;font-weight:500">A1</span></div>';
  h+='<div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:3px;background:linear-gradient(135deg,#185FA5,#2B7BD4)"></div><span style="font-size:10px;color:#888;font-weight:500">A2</span></div>';
  h+='<div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:3px;background:linear-gradient(135deg,#533AB7,#7B5FD6)"></div><span style="font-size:10px;color:#888;font-weight:500">A3</span></div>';
  h+='</div></div>';
  // Tooltip
  h+='<div id="bp-chart-tooltip" style="display:none;position:absolute;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:12px 16px;border-radius:12px;font-size:11px;pointer-events:none;z-index:10;box-shadow:0 8px 30px rgba(0,0,0,0.25);white-space:nowrap;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.08);line-height:1.6"></div>';
  var maxEbitda=studioRows.reduce(function(m,r){return Math.max(m,Math.abs(r.ebitda1)+Math.abs(r.ebitda2)+Math.abs(r.ebitda3));},1);
  var nBars=studioRows.length;
  var chartW=Math.max(500,nBars*120);
  var barW=Math.min(56,Math.floor((chartW-60)/(nBars))-20);
  var groupW=barW+20;
  var totalGroupsW=nBars*groupW;
  var offsetX=Math.round((chartW-totalGroupsW)/2);
  var svgH=280;
  var chartH=180;
  var yBase=220;
  h+='<div style="overflow-x:auto;display:flex;justify-content:center">';
  h+='<svg width="'+chartW+'" height="'+svgH+'" viewBox="0 0 '+chartW+' '+svgH+'" style="overflow:visible">';
  // Defs: gradients pour les barres
  h+='<defs>';
  h+='<linearGradient id="grad-a1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#15956F"/><stop offset="100%" stop-color="#0F6E56"/></linearGradient>';
  h+='<linearGradient id="grad-a2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2B7BD4"/><stop offset="100%" stop-color="#185FA5"/></linearGradient>';
  h+='<linearGradient id="grad-a3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7B5FD6"/><stop offset="100%" stop-color="#533AB7"/></linearGradient>';
  h+='<filter id="bar-shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1"/></filter>';
  h+='</defs>';
  // Grid lines horizontales subtiles
  for(var gi=0;gi<=4;gi++){
    var gy=yBase-gi*(chartH/4);
    h+='<line x1="'+offsetX+'" y1="'+gy+'" x2="'+(offsetX+totalGroupsW)+'" y2="'+gy+'" stroke="#f0f0ea" stroke-width="1" stroke-dasharray="'+(gi===0?'0':'4,4')+'"/>';
    if(gi>0){
      var gVal=Math.round(maxEbitda*gi/4);
      h+='<text x="'+(offsetX-8)+'" y="'+(gy+3)+'" text-anchor="end" font-size="8" fill="#bbb" font-weight="400">'+fmt(gVal)+'</text>';
    }
  }
  studioRows.forEach(function(r,i){
    var x=offsetX+i*groupW+10;
    var h1=Math.round(Math.max(0,r.ebitda1)/maxEbitda*chartH);
    var h2=Math.round(Math.max(0,r.ebitda2)/maxEbitda*chartH);
    var h3=Math.round(Math.max(0,r.ebitda3)/maxEbitda*chartH);
    var totalEbitda=r.ebitda1+r.ebitda2+r.ebitda3;
    var safeName=r.name.replace(/'/g,"\\&#39;");
    var gId='bp-bg-'+i;
    // Groupe interactif — barres commencent plates (3px), animées au hover
    h+='<g id="'+gId+'" class="bp-bar-group" style="cursor:pointer" onmouseenter="animBPBars('+i+',true,event)" onmousemove="(function(e){var t=document.getElementById(\'bp-chart-tooltip\');t.style.left=(e.offsetX-80)+\'px\';t.style.top=(e.offsetY-120)+\'px\'})(event)" onmouseleave="animBPBars('+i+',false,event)">';
    // Zone de hover invisible
    h+='<rect x="'+x+'" y="20" width="'+barW+'" height="'+(yBase-20)+'" fill="transparent"/>';
    // Barres empilées — affichées à taille réelle
    h+='<rect class="bp-b1" x="'+x+'" y="'+(yBase-h1)+'" width="'+barW+'" height="'+Math.max(h1,2)+'" rx="4" ry="4" fill="url(#grad-a1)" filter="url(#bar-shadow)" data-th="'+h1+'" data-oy="'+(yBase-h1)+'"/>';
    h+='<rect class="bp-b2" x="'+x+'" y="'+(yBase-h1-h2)+'" width="'+barW+'" height="'+Math.max(h2,2)+'" rx="4" ry="4" fill="url(#grad-a2)" filter="url(#bar-shadow)" data-th="'+h2+'" data-oy="'+(yBase-h1-h2)+'"/>';
    h+='<rect class="bp-b3" x="'+x+'" y="'+(yBase-h1-h2-h3)+'" width="'+barW+'" height="'+Math.max(h3,2)+'" rx="4" ry="4" fill="url(#grad-a3)" filter="url(#bar-shadow)" data-th="'+h3+'" data-oy="'+(yBase-h1-h2-h3)+'"/>';
    // Montant total — visible
    h+='<text class="bp-total" x="'+(x+barW/2)+'" y="'+(yBase-h1-h2-h3-10)+'" text-anchor="middle" font-size="9" font-weight="700" fill="#1a1a1a" style="opacity:0.7">'+fmt(totalEbitda)+'</text>';
    // Nom du studio
    h+='<text x="'+(x+barW/2)+'" y="'+(yBase+16)+'" text-anchor="middle" font-size="10" fill="#666" font-weight="600">'+r.name.substring(0,12)+'</text>';
    if(r.name.length>12)h+='<text x="'+(x+barW/2)+'" y="'+(yBase+28)+'" text-anchor="middle" font-size="8" fill="#aaa" font-weight="400">'+r.name.substring(12,22)+'</text>';
    // Tooltip data
    h+='<desc>'+safeName+'|'+fmt(r.ebitda1)+'|'+fmt(r.ebitda2)+'|'+fmt(r.ebitda3)+'|'+fmt(totalEbitda)+'|'+r.margeEbitda3+'|'+(r.margeEbitda3>=20?'#22c55e':r.margeEbitda3>=10?'#eab308':'#ef4444')+'</desc>';
    h+='</g>';
  });
  h+='</svg></div></div>';

  // ── Tableau détaillé par studio — Premium ──
  h+='<div style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:24px 28px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">';
  h+='<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#1e40af,#3b82f6);display:flex;align-items:center;justify-content:center">';
  h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>';
  h+='<div><div style="font-size:15px;font-weight:700;color:#1a1a1a">Détail par studio</div>';
  h+='<div style="font-size:10px;color:#94a3b8;font-weight:500">Cliquez sur un studio pour voir son BP détaillé</div></div></div>';
  h+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:separate;border-spacing:0">';
  h+='<thead><tr style="background:linear-gradient(90deg,#f8fafc,#f1f5f9)">';
  var _detailCols=[
    {l:'Studio',align:'left'},{l:'Scénario',align:'left'},{l:'CA A1',align:'right',c:'#10b981'},{l:'CA A3',align:'right',c:'#8b5cf6'},
    {l:'EBITDA A1',align:'right'},{l:'EBITDA A3',align:'right'},{l:'Marge A3',align:'center'},
    {l:'REX A3',align:'right'},{l:'RN A3',align:'right'},{l:'Cash Net A3',align:'right'},{l:'Membres',align:'center'}
  ];
  _detailCols.forEach(function(c,ci){
    var isFirst=ci===0;var isLast=ci===_detailCols.length-1;
    h+='<th style="text-align:'+c.align+';padding:10px 12px;font-size:9px;text-transform:uppercase;letter-spacing:0.8px;color:'+(c.c||'#64748b')+';font-weight:700;white-space:nowrap;border-bottom:2px solid #e2e8f0;'+(isFirst?'border-radius:10px 0 0 0':'')+(isLast?'border-radius:0 10px 0 0':'')+'">'+c.l+'</th>';
  });
  h+='</tr></thead><tbody>';
  studioRows.forEach(function(r,ri){
    var hoverBg=S.darkMode?'#1c2128':'#f8fafc';
    h+='<tr style="border-bottom:1px solid #f1f5f9;transition:all .15s" onmouseenter="this.style.background=\''+hoverBg+'\'" onmouseleave="this.style.background=\'transparent\'">';
    h+='<td style="padding:10px 12px;white-space:nowrap">';
    h+='<a onclick="openDetail(\''+r.id+'\')" style="font-weight:700;color:#1e40af;cursor:pointer;text-decoration:none;font-size:12px;display:flex;align-items:center;gap:6px" onmouseover="this.style.color=\'#3b82f6\'" onmouseout="this.style.color=\'#1e40af\'">';
    h+='<div style="width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#dbeafe,#bfdbfe);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>';
    h+=r.name+'</a></td>';
    h+='<td style="padding:10px 12px;font-size:10px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+(r.scenario||'BP de référence')+'">';
    h+='<span style="background:'+(r.scenario?'#fef3c7':'#f1f5f9')+';color:'+(r.scenario?'#854F0B':'#94a3b8')+';padding:3px 8px;border-radius:6px;font-size:9px;font-weight:600">'+(r.scenario||'BP réf.')+'</span></td>';
    h+='<td style="padding:10px 12px;color:#10b981;font-weight:600;text-align:right;font-size:12px">'+fmt(r.ca1)+'</td>';
    h+='<td style="padding:10px 12px;color:#8b5cf6;font-weight:600;text-align:right;font-size:12px">'+fmt(r.ca3)+'</td>';
    h+='<td style="padding:10px 12px;font-weight:600;text-align:right;font-size:12px;color:'+(r.ebitda1>=0?'#10b981':'#dc2626')+'">'+fmt(r.ebitda1)+'</td>';
    h+='<td style="padding:10px 12px;font-weight:600;text-align:right;font-size:12px;color:'+(r.ebitda3>=0?'#10b981':'#dc2626')+'">'+fmt(r.ebitda3)+'</td>';
    // Marge avec badge coloré
    var _margeBg=r.margeEbitda3>=30?'#dcfce7':r.margeEbitda3>=15?'#fef9c3':'#fee2e2';
    var _margeC=r.margeEbitda3>=30?'#166534':r.margeEbitda3>=15?'#854d0e':'#991b1b';
    h+='<td style="padding:10px 12px;text-align:center"><span style="background:'+_margeBg+';color:'+_margeC+';padding:4px 10px;border-radius:8px;font-size:11px;font-weight:700">'+r.margeEbitda3+'%</span></td>';
    h+='<td style="padding:10px 12px;text-align:right;font-size:12px;color:'+(r.rex3>=0?'#1e293b':'#dc2626')+';font-weight:500">'+fmt(r.rex3)+'</td>';
    h+='<td style="padding:10px 12px;text-align:right;font-size:12px;color:'+(r.rn3>=0?'#1e293b':'#dc2626')+';font-weight:500">'+fmt(r.rn3)+'</td>';
    h+='<td style="padding:10px 12px;text-align:right;font-size:12px;font-weight:700;color:'+(r.cashnet3>=0?'#10b981':'#dc2626')+'">'+fmt(r.cashnet3)+'</td>';
    h+='<td style="padding:10px 12px;text-align:center;font-weight:600;font-size:12px">'+r.membres+'</td>';
    h+='</tr>';
  });
  // Total row — premium
  h+='<tr style="background:linear-gradient(90deg,#0f172a,#1e293b);color:#fff">';
  h+='<td style="padding:12px;font-weight:800;font-size:12px;border-radius:0 0 0 12px" colspan="2"><span style="display:flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>TOTAL CONSOLIDÉ</span></td>';
  h+='<td style="padding:12px;font-weight:700;text-align:right;color:#6ee7b7">'+fmt(totCA1)+'</td>';
  h+='<td style="padding:12px;font-weight:700;text-align:right;color:#c4b5fd">'+fmt(totCA3)+'</td>';
  h+='<td style="padding:12px;font-weight:700;text-align:right;color:'+(totEbitda1>=0?'#6ee7b7':'#fca5a5')+'">'+fmt(totEbitda1)+'</td>';
  h+='<td style="padding:12px;font-weight:700;text-align:right;color:'+(totEbitda3>=0?'#6ee7b7':'#fca5a5')+'">'+fmt(totEbitda3)+'</td>';
  h+='<td style="padding:12px;text-align:center"><span style="background:rgba(255,255,255,0.1);padding:4px 10px;border-radius:8px;font-weight:800;font-size:11px">'+margeEbitda3Tot+'%</span></td>';
  h+='<td style="padding:12px;font-weight:700;text-align:right;color:'+(totRex3>=0?'#e2e8f0':'#fca5a5')+'">'+fmt(totRex3)+'</td>';
  h+='<td style="padding:12px;font-weight:700;text-align:right;color:'+(totRN3>=0?'#e2e8f0':'#fca5a5')+'">'+fmt(totRN3)+'</td>';
  h+='<td style="padding:12px;font-weight:800;text-align:right;color:'+(totCashNet3>=0?'#6ee7b7':'#fca5a5')+'">'+fmt(totCashNet3)+'</td>';
  h+='<td style="padding:12px;text-align:center;font-weight:700;border-radius:0 0 12px 0">'+totMembres+'</td>';
  h+='</tr>';
  h+='</tbody></table></div></div>';
  return h;
}

function renderCard(id,s){
  var dir=getStudioDirector(s);
  var dirSection='';
  if(dir){
    dirSection='<div style="display:flex;align-items:center;gap:9px;margin-top:12px;padding-top:10px;border-top:1px solid #f0f0ea">'
      +'<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;flex-shrink:0;background:'+_aC(dir.nom)+';border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.13)">'
      +'<img src="'+dir.photo+'" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block" onerror="this.style.display=\'none\'">'
      +'</div>'
      +'<div><div style="font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Dir. opérationnel</div>'
      +'<div style="font-size:12px;font-weight:600;color:#333">'+dir.nom+'</div></div>'
      +'</div>';
  }
  // Progress ring — % d'étapes workflow complétées
  var _stSrc=(typeof getStudioSteps==='function')?getStudioSteps(id):STEPS;
  var _doneCount=_stSrc.filter(function(st){return s.steps&&s.steps[st.id];}).length;
  var _pctWf=Math.round(_doneCount/_stSrc.length*100);
  var _ringColor=_pctWf>=100?'#1D9E75':_pctWf>=50?'#1a3a6b':'#FBBF24';
  var _ringHtml=(typeof progressRingSVG==='function')?progressRingSVG(_pctWf,56,_ringColor):progBar(s.steps,id);

  return '<div class="card" onclick="openDetail(\''+id+'\')">'+
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:10px">'+
      '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:14px">'+s.name+'</div><div style="font-size:12px;color:#888;margin-top:2px">'+s.societe+'</div></div>'+
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">'+badge(s.statut)+'<span style="background:#f0f4ff;color:#1a3a6b;font-size:9px;font-weight:600;padding:2px 6px;border-radius:8px">C'+(s.cohorte||1)+'</span></div>'+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:10px">'+
      _ringHtml+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:2px">Workflow</div>'+
        '<div style="font-size:12px;color:#555;font-weight:600">'+_doneCount+'/'+_stSrc.length+' étapes</div>'+
        '<div style="font-size:11px;color:#888;margin-top:3px">Ouv. <strong>'+s.ouverture+'</strong></div>'+
      '</div>'+
    '</div>'+
    (s.alertes.length>0?'<div style="margin-top:4px;font-size:11px;color:#854F0B;background:#FAEEDA;border-radius:6px;padding:4px 8px">! '+_alerteText(s.alertes[0])+'</div>':'')+
    dirSection+
    '</div>';
}

// ── Activité récente — 3 colonnes : Tâches | Chat | Alertes ──────────────
function renderActivityFeed(ids){
  // ── 1. Collecter toutes les tâches actives (non done) ──
  var allTasks=[];
  var today=new Date().toISOString().slice(0,10);
  ids.forEach(function(id){
    (S.todos[id]||[]).forEach(function(t){
      if(t.statut==='done')return;
      var overdue=t.deadline&&t.deadline<today;
      var soon=t.deadline&&!overdue&&t.deadline<=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
      allTasks.push({studioId:id,studioName:S.studios[id].name,task:t,overdue:overdue,soon:soon});
    });
  });
  var taskOrder={doing:0,vu:1,todo:2};
  allTasks.sort(function(a,b){
    var oa=taskOrder[a.task.statut]!=null?taskOrder[a.task.statut]:2;
    var ob=taskOrder[b.task.statut]!=null?taskOrder[b.task.statut]:2;
    if(oa!==ob)return oa-ob;
    if(a.task.deadline&&b.task.deadline)return a.task.deadline.localeCompare(b.task.deadline);
    if(a.task.deadline)return -1;if(b.task.deadline)return 1;
    return (b.task.ts||'').localeCompare(a.task.ts||'');
  });
  allTasks=allTasks.slice(0,6);

  // ── 2. Chat commun — derniers messages ──
  var chatMsgs=(S.globalChat||[]).slice(-5).reverse();

  // ── 3. Alertes ──
  var allAlerts=[];
  ids.forEach(function(id){
    (S.studios[id].alertes||[]).forEach(function(a){
      allAlerts.push({studioId:id,studioName:S.studios[id].name,text:_alerteText(a)});
    });
  });

  var h='<div class="activity-grid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:18px">';

  // ═══ Bloc 1 : Tâches actives ═══
  h+='<div style="background:'+(S.darkMode?'#161b22':'#fff')+';border:0.5px solid '+(S.darkMode?'#30363d':'#e0e0d8')+';border-radius:12px;padding:16px 18px;min-height:80px">';
  h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">';
  h+='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
  h+='<span style="font-size:12px;font-weight:700;color:#1a1a1a">Tâches actives</span>';
  if(allTasks.length)h+='<span style="background:#DBEAFE;color:#1D4ED8;font-size:9px;font-weight:700;border-radius:8px;padding:1px 6px;min-width:14px;text-align:center">'+allTasks.length+'</span>';
  h+='</div>';
  if(!allTasks.length){
    h+=(typeof emptyState==='function')?emptyState('tasks','Aucune tâche en cours','Tout est sous contrôle.'):'<div style="font-size:11px;color:#bbb;text-align:center;padding:12px 0">Aucune tâche en cours</div>';
  } else {
    allTasks.forEach(function(item){
      var t=item.task;
      var st=TACHE_STATUTS[t.statut]||TACHE_STATUTS.todo;
      h+='<div onclick="openDetail(\''+item.studioId+'\');setTimeout(function(){setDetailTab(\'echanges\')},50)" style="display:flex;gap:9px;padding:7px 0;border-bottom:1px solid '+(S.darkMode?'#30363d':'#f5f5f0')+';cursor:pointer;transition:background 0.1s" onmouseover="this.style.background=S.darkMode?\'#1c2128\':\'#f8f9fb\'" onmouseout="this.style.background=\'transparent\'">';
      // Status icon (clickable to cycle)
      h+='<div onclick="event.stopPropagation();toggleTacheStatut(\''+item.studioId+'\',\''+t.id+'\')" title="Changer le statut" style="width:22px;height:22px;border-radius:50%;border:2px solid '+st.text+';background:'+st.bg+';color:'+st.text+';font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;line-height:1;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s" onmouseover="this.style.transform=\'scale(1.2)\';this.style.boxShadow=\'0 0 0 3px '+st.text+'22\'" onmouseout="this.style.transform=\'scale(1)\';this.style.boxShadow=\'none\'">'+st.icon+'</div>';
      h+='<div style="min-width:0;flex:1">';
      // Titre + badge statut
      h+='<div style="display:flex;align-items:center;gap:6px"><span style="font-size:11px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;flex:1">'+t.titre+'</span>';
      h+='<span onclick="event.stopPropagation();toggleTacheStatut(\''+item.studioId+'\',\''+t.id+'\')" title="Changer le statut" style="font-size:8px;font-weight:600;padding:1px 5px;border-radius:4px;background:'+st.bg+';color:'+st.text+';white-space:nowrap;flex-shrink:0;cursor:pointer;transition:opacity 0.15s" onmouseover="this.style.opacity=\'0.7\'" onmouseout="this.style.opacity=\'1\'">'+st.label+'</span></div>';
      // Description
      if(t.description)h+='<div style="font-size:10px;color:#888;margin-top:2px;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">'+t.description+'</div>';
      // Responsable + deadline + studio
      var _dR3=t.responsable||t.auteur||'';
      h+='<div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap">';
      if(_dR3){
        h+='<div style="display:flex;align-items:center;gap:3px">'+avatarHTML(_dR3,16);
        h+='<span style="font-size:10px;color:#555;font-weight:500">'+_dR3+'</span></div>';
      }
      if(t.deadline){
        var dlabel=new Date(t.deadline+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
        var dStyle=item.overdue?'color:#991B1B;font-weight:600':item.soon?'color:#854F0B;font-weight:600':'color:#888';
        h+='<span style="font-size:9px;'+dStyle+';display:flex;align-items:center;gap:2px"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'+dlabel+'</span>';
      }
      h+='</div>';
      // Studio name
      h+='<div style="font-size:10px;color:#3B6FB6;margin-top:2px;display:flex;align-items:center;gap:3px"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'+item.studioName+'</div>';
      h+='</div></div>';
    });
  }
  h+='</div>';

  // ═══ Bloc 2 : Chat commun ═══
  h+='<div style="background:'+(S.darkMode?'#161b22':'#fff')+';border:0.5px solid '+(S.darkMode?'#30363d':'#e0e0d8')+';border-radius:12px;padding:16px 18px;min-height:80px;display:flex;flex-direction:column">';
  h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">';
  h+='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f1f3d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  h+='<span style="font-size:12px;font-weight:700;color:#1a1a1a">Chat commun</span>';
  if(chatMsgs.length)h+='<span style="background:#e8ecf4;color:#0f1f3d;font-size:9px;font-weight:700;border-radius:8px;padding:1px 6px;min-width:14px;text-align:center">'+(S.globalChat||[]).length+'</span>';
  h+='</div>';
  if(!chatMsgs.length){
    h+='<div style="font-size:11px;color:#bbb;text-align:center;padding:12px 0;flex:1;display:flex;align-items:center;justify-content:center">Aucun message</div>';
  } else {
    h+='<div style="flex:1">';
    chatMsgs.forEach(function(m){
      var me=(S.profile&&S.profile.nom)||'';
      h+='<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid #f5f5f0">';
      h+=avatarHTML(m.auteur||'?',22);
      h+='<div style="min-width:0;flex:1">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:10px;font-weight:600;color:#333">'+((m.auteur||'').split(' ')[0])+'</span><span style="font-size:9px;color:#ccc">'+(m.date||'')+'</span></div>';
      h+='<div style="font-size:11px;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">'+htmlEscape((m.texte||'').substring(0,50))+(m.texte&&m.texte.length>50?'…':'')+'</div>';
      h+='</div></div>';
    });
    h+='</div>';
  }
  h+='<button onclick="toggleChat()" style="margin-top:10px;width:100%;padding:6px;background:'+(S.darkMode?'#21262d':'#f0f2f8')+';color:'+(S.darkMode?'#e6edf3':'#0f1f3d')+';border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;transition:background 0.15s" onmouseover="this.style.background=S.darkMode?\'#30363d\':\'#e2e6f0\'" onmouseout="this.style.background=S.darkMode?\'#21262d\':\'#f0f2f8\'">Ouvrir le chat</button>';
  h+='</div>';

  // ═══ Bloc 3 : Alertes actives ═══
  h+='<div style="background:'+(S.darkMode?'#161b22':'#fff')+';border:0.5px solid '+(S.darkMode?'#30363d':'#e0e0d8')+';border-radius:12px;padding:16px 18px;min-height:80px">';
  h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span style="font-size:12px;font-weight:700;color:#1a1a1a">Alertes actives</span><span style="background:#DC2626;color:#fff;font-size:9px;font-weight:700;border-radius:8px;padding:1px 6px;min-width:14px;text-align:center">'+allAlerts.length+'</span></div>';
  if(!allAlerts.length){
    h+=(typeof emptyState==='function')?emptyState('alert','Aucune alerte','Tous vos studios sont au vert.'):'<div style="font-size:11px;color:#bbb;text-align:center;padding:12px 0">Aucune alerte</div>';
  } else {
    allAlerts.forEach(function(a){
      h+='<div onclick="openDetail(\''+a.studioId+'\');setTimeout(function(){setDetailTab(\'alertes\')},50)" style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid '+(S.darkMode?'#30363d':'#f5f5f0')+';cursor:pointer;transition:background 0.1s" onmouseover="this.style.background=S.darkMode?\'#1c2128\':\'#fef6f6\'" onmouseout="this.style.background=\'transparent\'">';
      h+='<div style="flex-shrink:0;width:6px;height:6px;border-radius:50%;background:#DC2626"></div>';
      h+='<div style="min-width:0;flex:1"><div style="font-size:11px;color:#854F0B;font-weight:500">'+a.text+'</div>';
      h+='<div style="font-size:10px;color:#999;margin-top:1px">'+a.studioName+'</div>';
      h+='</div></div>';
    });
  }
  h+='</div>';
  h+='</div>';
  return h;
}

// ── Vue toggle (grid/cohorte/list) ──────────────────────────────────────────
function renderViewToggle(){
  var views=[
    {id:'grid',label:'Grille',svg:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>'},
    {id:'cohorte',label:'Cohortes',svg:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'},
    {id:'list',label:'Liste',svg:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="20" y2="14"/><line x1="4" y1="18" x2="20" y2="18"/></svg>'}
  ];
  var h='<div style="display:flex;background:#f0f0ea;border-radius:8px;padding:2px;gap:1px">';
  views.forEach(function(v){
    var active=S.dashView===v.id;
    h+='<button onclick="setDashView(\''+v.id+'\')" title="'+v.label+'" style="display:flex;align-items:center;gap:4px;padding:5px 10px;border:none;border-radius:6px;font-size:11px;font-weight:'+(active?'600':'400')+';cursor:pointer;transition:all 0.15s;background:'+(active?'#fff':'transparent')+';color:'+(active?'#1a1a1a':'#888')+';box-shadow:'+(active?'0 1px 3px rgba(0,0,0,0.08)':'none')+'">'+v.svg+'<span>'+v.label+'</span></button>';
  });
  h+='</div>';
  return h;
}

// ── Filtres statut ──────────────────────────────────────────────────────────
function renderStatusFilters(ids){
  var counts={all:ids.length};
  Object.keys(STATUT_CFG).forEach(function(k){counts[k]=0;});
  ids.forEach(function(id){var st=S.studios[id]&&S.studios[id].statut;if(st&&counts[st]!==undefined)counts[st]++;});
  var filters=[{id:'all',label:'Tous'}];
  Object.keys(STATUT_CFG).forEach(function(k){if(counts[k]>0)filters.push({id:k,label:STATUT_CFG[k].label});});
  var h='<div style="display:flex;gap:5px;flex-wrap:wrap">';
  filters.forEach(function(f){
    var active=S.dashFilter===f.id;
    var cfg=STATUT_CFG[f.id];
    h+='<button onclick="setDashFilter(\''+f.id+'\')" style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:'+(active?'600':'400')+';cursor:pointer;transition:all 0.15s;border:1px solid '+(active?(cfg?cfg.text:'#1a3a6b'):'#e0e0da')+';background:'+(active?(cfg?cfg.bg:'#f0f4ff'):'transparent')+';color:'+(active?(cfg?cfg.text:'#1a3a6b'):'#888')+'">'+f.label+' <span style="font-size:10px;opacity:0.7">'+counts[f.id]+'</span></button>';
  });
  h+='</div>';
  return h;
}

function setDashView(v){S.dashView=v;render();}
function setDashFilter(f){S.dashFilter=f;render();}

// ── Vue Cohorte ─────────────────────────────────────────────────────────────
function renderCohorteView(ids){
  // Group studios by cohorte value
  var groups={};
  ids.forEach(function(id){
    var c=(S.studios[id]&&S.studios[id].cohorte)||1;
    if(!groups[c])groups[c]=[];
    groups[c].push(id);
  });
  var cohortNums=Object.keys(groups).map(Number).sort();
  var h='';
  cohortNums.forEach(function(cn){
    var cIds=groups[cn];
    // Compute cohort-level stats
    var totalCapex=cIds.reduce(function(s,id){return s+S.studios[id].capex;},0);
    var totalCA=cIds.reduce(function(s,id){return s+(S.studios[id].forecast&&S.studios[id].forecast.annualCA||0);},0);
    var avgProgress=Math.round(cIds.reduce(function(s,id){
      var _ST=getStudioSteps(id);
      var done=_ST.filter(function(st){return S.studios[id].steps[st.id];}).length;
      return s+(done/_ST.length*100);
    },0)/cIds.length);

    h+='<div style="background:#fff;border:0.5px solid #e0e0d8;border-radius:12px;padding:18px 20px;margin-bottom:14px">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">';
    h+='<div style="display:flex;align-items:center;gap:10px"><span style="font-size:14px;font-weight:700;color:#1a1a1a">Cohorte '+cn+'</span><span style="font-size:11px;color:#888;background:#f0f0ea;padding:2px 8px;border-radius:10px">'+cIds.length+' studio'+(cIds.length>1?'s':'')+'</span></div>';
    h+='<div style="display:flex;gap:14px;font-size:11px;color:#888"><span>CAPEX '+fmt(totalCapex)+'</span><span>CA BP '+fmt(totalCA)+'</span><span>Avancement '+avgProgress+'%</span></div>';
    h+='</div>';
    h+='<div class="cards">';
    cIds.forEach(function(id){h+=renderCard(id,S.studios[id]);});
    h+='</div></div>';
  });
  if(!cohortNums.length)h+='<div style="text-align:center;color:#bbb;padding:30px;font-size:13px">Aucun studio dans cette vue</div>';
  return h;
}

// ── Vue Liste ───────────────────────────────────────────────────────────────
function renderListView(ids){
  var h='<div style="background:#fff;border:0.5px solid #e0e0d8;border-radius:12px;overflow:hidden">';
  h+='<table style="width:100%;border-collapse:collapse;font-size:12px">';
  h+='<thead><tr style="background:#f8f8f4;border-bottom:1px solid #e0e0d8">';
  h+='<th style="text-align:left;padding:10px 14px;font-weight:600;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Studio</th>';
  h+='<th style="text-align:left;padding:10px 14px;font-weight:600;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Société</th>';
  h+='<th style="text-align:left;padding:10px 14px;font-weight:600;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Statut</th>';
  h+='<th style="text-align:left;padding:10px 14px;font-weight:600;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Cohorte</th>';
  h+='<th style="text-align:left;padding:10px 14px;font-weight:600;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Ouverture</th>';
  h+='<th style="text-align:left;padding:10px 14px;font-weight:600;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">CAPEX</th>';
  h+='<th style="text-align:left;padding:10px 14px;font-weight:600;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Avancement</th>';
  h+='</tr></thead><tbody>';
  ids.forEach(function(id){
    var s=S.studios[id];
    if(!s)return;
    var _ST2=getStudioSteps(id);
    var done=_ST2.filter(function(st){return s.steps&&s.steps[st.id];}).length;
    var p=Math.round(done/_ST2.length*100);
    h+='<tr onclick="openDetail(\''+id+'\')" style="border-bottom:1px solid #f0f0ea;cursor:pointer;transition:background 0.1s" onmouseover="this.style.background=S.darkMode?\'#1c2128\':\'#fafaf6\'" onmouseout="this.style.background=\'transparent\'">';
    h+='<td style="padding:10px 14px;font-weight:600;color:#1a1a1a">'+s.name+'</td>';
    h+='<td style="padding:10px 14px;color:#666">'+s.societe+'</td>';
    h+='<td style="padding:10px 14px">'+badge(s.statut)+'</td>';
    h+='<td style="padding:10px 14px"><span style="background:#f0f4ff;color:#1a3a6b;font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px">C'+(s.cohorte||1)+'</span></td>';
    h+='<td style="padding:10px 14px;color:#666">'+s.ouverture+'</td>';
    h+='<td style="padding:10px 14px;font-weight:500">'+fmt(s.capex)+'</td>';
    h+='<td style="padding:10px 14px"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;background:#e8e8e0;border-radius:4px;height:5px;min-width:60px"><div style="width:'+p+'%;background:#1D9E75;border-radius:4px;height:5px"></div></div><span style="font-size:10px;color:#888;white-space:nowrap">'+p+'%</span></div></td>';
    h+='</tr>';
  });
  h+='</tbody></table></div>';
  return h;
}

function renderDetail(){
  var s=S.studios[S.selectedId];
  if(!s)return '';
  var isAdmin=!!S.profile&&!isViewer();
  var tabs=[['workflow','Workflow'],['adherents','Adhérents & Prévisionnels'],['forecast','Forecast'],['engagements','Engagements'],['echanges','Questions & Tâches'],['localisation','Localisation'],['local','Local'],['fichiers','Fichiers'],['alertes','Alertes'],['ia','IA']];
  // Filtrage onglets pour viewers avec permissions granulaires
  if(isViewer()&&S.user&&S.adminSettings&&S.adminSettings.viewerPerms&&S.adminSettings.viewerPerms[S.user.id]){
    var _allowedTabs=S.adminSettings.viewerPerms[S.user.id].tabs||[];
    if(_allowedTabs.length>0){
      tabs=tabs.filter(function(t){return _allowedTabs.indexOf(t[0])>=0;});
      // Si l'onglet courant n'est pas autorisé, basculer sur le premier disponible
      var _tabIds=tabs.map(function(t){return t[0];});
      if(_tabIds.indexOf(S.detailTab)<0&&tabs.length>0)S.detailTab=tabs[0][0];
    }
  }
  var content='';
  if(S.detailTab==='workflow')content=renderWorkflow(s);
  else if(S.detailTab==='adherents')content=renderAdherents(S.selectedId,s);
  else if(S.detailTab==='forecast')content=renderForecast(S.selectedId,s);
  else if(S.detailTab==='engagements')content=renderEngagements(S.selectedId,s);
  else if(S.detailTab==='echanges')content=renderEchanges(S.selectedId);
  else if(S.detailTab==='localisation')content=renderLocalisation(s);
  else if(S.detailTab==='local')content=renderLocal(S.selectedId,s);
  else if(S.detailTab==='fichiers')content=renderFichiers(S.selectedId);
  else if(S.detailTab==='alertes')content=renderAlertes(S.selectedId,s);
  else if(S.detailTab==='ia')content=renderAI(s);
  var h='';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">';
  h+='<div onclick="retourProjets()" style="background:#f5f5f0;border:1px solid #e8e8e0;cursor:pointer;font-size:12px;color:#555;padding:8px 16px;border-radius:8px;font-weight:600;display:inline-flex;align-items:center;gap:6px;position:relative;z-index:100;-webkit-tap-highlight-color:transparent" onmouseenter="this.style.background=S.darkMode?\'#30363d\':\'#e8e8e0\'" onmouseleave="this.style.background=S.darkMode?\'#21262d\':\'#f5f5f0\'">← Studios</div>';
  h+='<div style="display:flex;align-items:center;gap:8px">';
  h+=renderSearchBar();
  h+=userAvatarWidget(S.profile);
  h+='</div>';
  h+='</div>';
  if(isViewer())h+='<div style="display:inline-flex;align-items:center;gap:5px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:6px;padding:4px 10px;font-size:11px;color:#1D4ED8;font-weight:600;margin-bottom:10px">👁 Mode lecture seule — consultation uniquement</div>';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><span style="font-size:18px;font-weight:600">'+s.name+'</span>'+badge(s.statut);
  if(isAdmin)h+='<select onchange="setStudioCohorte(\''+S.selectedId+'\',parseInt(this.value))" style="font-size:10px;font-weight:600;padding:2px 6px;border-radius:8px;border:1px solid #dde;background:#f0f4ff;color:#1a3a6b;cursor:pointer">';
  if(isAdmin)for(var ci=1;ci<=10;ci++)h+='<option value="'+ci+'"'+((s.cohorte||1)===ci?' selected':'')+'>Cohorte '+ci+'</option>';
  if(isAdmin)h+='</select>';
  if(!isAdmin)h+='<span style="background:#f0f4ff;color:#1a3a6b;font-size:10px;font-weight:600;padding:2px 8px;border-radius:8px">C'+(s.cohorte||1)+'</span>';
  h+='</div>';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">';
  h+='<div style="font-size:13px;color:#888"><a href="javascript:void(0)" onclick="setDetailTab(\'localisation\')" style="color:#888;text-decoration:none;border-bottom:1px dashed #ccc;cursor:pointer;transition:color 0.15s,border-color 0.15s" onmouseover="this.style.color=\'#1a3a6b\';this.style.borderColor=\'#1a3a6b\'" onmouseout="this.style.color=\'#888\';this.style.borderColor=\'#ccc\'">'+s.addr+'</a> &middot; '+s.societe+' &middot; '+s.ouverture+'</div>';
  h+='<div style="position:relative;display:inline-block">';
  h+='<button onclick="toggleExportMenu(event)" style="background:#1a3a6b;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;white-space:nowrap;transition:background .15s" onmouseover="this.style.background=\'#254d8a\'" onmouseout="this.style.background=\'#1a3a6b\'">&#128196; Exporter <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg></button>';
  h+='<div id="export-menu" style="display:none;position:absolute;right:0;top:100%;margin-top:4px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.15);min-width:220px;z-index:999;overflow:hidden;animation:fadeIn .15s ease">';
  h+='<div style="padding:6px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #f1f5f9">PDF</div>';
  var _sid=S.selectedId;
  var _pdfItems=[
    {l:'Rapport complet',icon:'&#128196;',act:'generateReport(\''+_sid+'\')'},
    {l:'Synth\u00e8se financi\u00e8re',icon:'&#128202;',act:'generateReport(\''+_sid+'\',[\'synthese\'])'},
    {l:'BP d\u00e9taill\u00e9',icon:'&#128203;',act:'generateReport(\''+_sid+'\',[\'bp\'])'},
    {l:'CAPEX & Financement',icon:'&#128176;',act:'generateReport(\''+_sid+'\',[\'capex\'])'},
    {l:'Adh\u00e9rents',icon:'&#128101;',act:'generateReport(\''+_sid+'\',[\'adherents\'])'},
    {l:'Localisation',icon:'&#128205;',act:'generateReport(\''+_sid+'\',[\'localisation\'])'}
  ];
  _pdfItems.forEach(function(it){
    h+='<button onclick="'+it.act+';closeExportMenu()" style="display:flex;align-items:center;gap:8px;width:100%;padding:8px 14px;border:none;background:none;cursor:pointer;font-size:11px;font-weight:500;color:#1e293b;text-align:left;transition:background .1s" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'none\'">'+it.icon+' '+it.l+'</button>';
  });
  h+='<div style="height:1px;background:#e2e8f0;margin:2px 0"></div>';
  h+='<div style="padding:6px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Donn\u00e9es</div>';
  h+='<button onclick="exportStudioCSV(\''+_sid+'\');closeExportMenu()" style="display:flex;align-items:center;gap:8px;width:100%;padding:8px 14px;border:none;background:none;cursor:pointer;font-size:11px;font-weight:500;color:#1e293b;text-align:left;transition:background .1s" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'none\'">&#128229; Export CSV</button>';
  h+='<button onclick="exportStudioExcel(\''+_sid+'\');closeExportMenu()" style="display:flex;align-items:center;gap:8px;width:100%;padding:8px 14px;border:none;background:none;cursor:pointer;font-size:11px;font-weight:500;color:#1e293b;text-align:left;transition:background .1s" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'none\'">&#128229; Export Excel</button>';
  h+='</div></div>';
  h+='</div>';
  if(isSuperAdmin()){
    h+='<div style="display:flex;gap:8px;margin-bottom:14px">';
    h+=(s.statut!=='abandonne'?'<button class="btn" style="color:#854F0B" onclick="archiverStudio(\''+S.selectedId+'\')">Archiver</button>':'<button class="btn" style="color:#185FA5" onclick="restaurerStudio(\''+S.selectedId+'\')">Restaurer</button>');
    h+='<button class="btn" style="color:#A32D2D" onclick="supprimerStudio(\''+S.selectedId+'\')">Supprimer</button></div>';
  }
  h+='<div class="tabs">';
  tabs.forEach(function(t){h+='<button class="tab '+(S.detailTab===t[0]?'active':'')+'" onclick="setDetailTab(\''+t[0]+'\')">'+t[1]+'</button>';});
  h+='</div><div class="tab-content-anim" key="tab-'+S.detailTab+'">'+content+'</div>';
  return h;
}

function renderWorkflow(s){
  var canEdit=!!S.profile&&!isViewer();
  var sid=S.selectedId;
  var WF_STEPS=getStudioSteps(sid);
  // Infographie en tête de page
  var h=renderBP3YInfographic(sid,s);
  var _steps=s.steps||{};
  h+='<div class="box" style="margin-top:16px">'+progBar(_steps,sid)+'<div style="margin-top:16px">';
  WF_STEPS.forEach(function(step,i){
    var done=_steps[step.id];
    var unlocked=i===0||_steps[WF_STEPS[i-1].id];
    var bg=done?'#1D9E75':'transparent';
    var border=done?'#1D9E75':unlocked?'#aaa':'#ddd';
    var cursor=unlocked&&canEdit?'pointer':'default';
    var click=unlocked&&canEdit?'onclick="toggleStep(\''+sid+'\',\''+step.id+'\')">':'>';
    h+='<div style="display:flex;gap:12px;margin-bottom:10px;opacity:'+((!done&&!unlocked)?0.4:1)+';align-items:flex-start">';
    h+='<div style="display:flex;flex-direction:column;align-items:center">';
    h+='<div class="step-dot" style="background:'+bg+';border:2px solid '+border+';color:'+(done?'#fff':'#aaa')+';cursor:'+cursor+'" '+click+(done?'&#10003;':'')+'</div>';
    if(i<WF_STEPS.length-1)h+='<div style="width:2px;flex:1;min-height:14px;background:'+(done?'#1D9E75':'#e0e0d8')+';margin-top:2px"></div>';
    h+='</div><div style="flex:1;padding-bottom:8px"><div style="font-size:13px;font-weight:'+(done?600:400)+'">'+step.label+'</div><div style="font-size:11px;color:#888;margin-top:2px">'+step.desc+'</div></div>';
    if(canEdit)h+='<button onclick="event.stopPropagation();supprimerEtape(\''+sid+'\',\''+step.id+'\')" title="Supprimer cette \u00e9tape" style="background:none;border:none;color:#ccc;font-size:14px;cursor:pointer;padding:2px 6px;border-radius:4px;transition:color .15s,background .15s;flex-shrink:0;margin-top:2px" onmouseenter="this.style.color=\'#A32D2D\';this.style.background=\'#fef2f2\'" onmouseleave="this.style.color=\'#ccc\';this.style.background=\'none\'">\u2715</button>';
    h+='</div>';
  });
  if(canEdit){
    h+='<div style="margin-top:8px;padding-top:8px;border-top:1px dashed #e8e8e0">';
    h+='<button onclick="ajouterEtape(\''+sid+'\')" style="display:flex;align-items:center;gap:6px;background:none;border:1px dashed #ccc;color:#888;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;width:100%" onmouseenter="this.style.borderColor=\'#1D9E75\';this.style.color=\'#1D9E75\';this.style.background=\'#f0fdf4\'" onmouseleave="this.style.borderColor=\'#ccc\';this.style.color=\'#888\';this.style.background=\'none\'"><span style="font-size:16px;line-height:1">+</span> Ajouter une \u00e9tape</button>';
    h+='</div>';
  }
  h+='</div></div>';
  return h;
}

// ── Infographie KPIs prévisionnels 3 ans — onglet Workflow ────────────────────
function renderBP3YInfographic(sid,s){
  var bp=build3YearBP(s.forecast||{},sid,getStudioBPOpts(sid));
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
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;background:#fff">';
  YR.forEach(function(yr,i){
    var accent=ACCENTS[i];
    var eMargin=yr.ca>0?Math.round(yr.ebitda/yr.ca*100):0;
    var rexMargin=yr.ca>0?Math.round(yr.rex/yr.ca*100):0;
    var mbrPct=Math.min(100,Math.round(yr.lastMbrs/400*100));
    var borderR=i<2?'border-right:0.5px solid #ebebE6;':'';
    h+='<div style="padding:14px 16px;background:'+(i===2?'#f9f8f5':'#fff')+';'+borderR+'border-bottom:0.5px solid #ebebE6">';

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
    h+='<span style="font-size:9px;color:#ccc">'+mbrPct+'% / 400</span>';
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
  var bps3=build3YearBP(s.forecast||{},sid,getStudioBPOpts(sid));
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
  var fs=S.forecastSection||'summary';
  var fc=s.forecast||{};
  var bps=build3YearBP(fc,sid,getStudioBPOpts(sid));
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

  h+='<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">';
  h+='<button class="tab '+(fs==='summary'?'active':'')+'" onclick="setFS(\'summary\')">Synthese</button>';
  h+='<button class="tab '+(fs==='detail'?'active':'')+'" onclick="setFS(\'detail\')">Detail complet</button>';
  h+='<button class="tab '+(fs==='saisie'?'active':'')+'" onclick="setFS(\'saisie\')">Saisie mensuelle</button>';
  h+='<button class="tab '+(fs==='recap3'?'active':'')+'" onclick="setFS(\'recap3\')">Recap 3 ans</button>';
  h+='</div>';

  if(fs==='summary'){
    var rows=[
      {l:'CA BP',vals:totals.map(function(t){return t.bpCA;}),tot:cumBPCA,bold:true},
      {l:'CA Reel',vals:totals.map(function(t){return t.aCA;}),tot:cumActCA,blue:true},
      {l:'REX BP (Res. Expl.)',vals:totals.map(function(t){return t.bpREX;}),tot:cumBPREX,bold:true,green:true},
      {l:'EBITDA BP (REX+Amort)',vals:totals.map(function(t){return t.bpEBITDA;}),tot:cumBPEBITDA,orange:true},
      {l:'Charges BP',vals:totals.map(function(t){return t.bpCharges;}),tot:totals.reduce(function(s,t){return s+t.bpCharges;},0)},
      {l:'Resultat Net BP',vals:totals.map(function(t){return t.bpResult;}),tot:cumBPRes,bold:true},
      {l:'CAF BP',vals:totals.map(function(t){return t.bpCAF;}),tot:cumBPCAF,bold:true},
      {l:'Cash net disponible',vals:totals.map(function(t){return t.bpCashnet||0;}),tot:cumBPCashnet,bold:true,blue:true},
      {l:'Resultat Net Reel',vals:totals.map(function(t){return t.aResult;}),tot:cumActRes,blue:true,res:true},
    ];
    h+='<div style="overflow-x:auto"><table>';
    h+='<tr><th style="text-align:left;padding-left:8px">Ligne</th>';
    moisLabels.forEach(function(m){h+='<th>'+m+'</th>';});
    h+='<th>Total</th></tr>';
    rows.forEach(function(row){
      h+='<tr style="background:'+(row.green?'#f0faf5':row.orange?'#fff8f0':row.bold?'#f5f5f0':'')+'">';
      h+='<td class="lbl" style="font-weight:'+(row.bold||row.green||row.orange?600:400)+';color:'+(row.green?'#0F6E56':row.orange?'#854F0B':'inherit')+'">'+row.l+'</td>';
      row.vals.forEach(function(v){
        var c='inherit';
        if(row.green&&v!==null)c='#0F6E56';
        else if(row.orange&&v!==null)c='#854F0B';
        else if(row.blue&&v!==null)c=row.res?(v>=0?'#3B6D11':'#A32D2D'):'#185FA5';
        h+='<td style="color:'+c+'">'+(v===null?'<span style="color:#ddd">--</span>':fmtN(v))+'</td>';
      });
      var totColor=row.green?'#0F6E56':row.orange?'#854F0B':row.res?(row.tot>=0?'#3B6D11':'#A32D2D'):'inherit';
      h+='<td style="font-weight:700;color:'+totColor+'">'+fmtN(row.tot)+'</td></tr>';
    });
    h+='</table></div>';
    h+='<div style="font-size:10px;color:#888;margin-top:6px">Noir/gris = BP &middot; Bleu = Reel saisi &middot; Vert = EBITDA</div>';
  }

  if(fs==='detail'){
    h+='<div style="overflow-x:auto"><table>';
    h+='<tr><th style="text-align:left;padding-left:8px;min-width:150px">Ligne</th>';
    moisLabels.forEach(function(m){h+='<th>'+m+'</th>';});
    h+='<th style="font-weight:700">Total</th></tr>';
    // Produits
    h+='<tr style="background:#e8f0f8"><td class="lbl" colspan="14" style="font-weight:700;color:#185FA5;padding:6px 8px">PRODUITS</td></tr>';
    PRODUITS.forEach(function(l){
      var tot=0;
      h+='<tr><td class="lbl" style="padding-left:16px">'+l.label+'</td>';
      bp.forEach(function(r,i){
        var bv=r[l.id];tot+=bv;
        var a=actuel[i]&&actuel[i][l.id]!=null?actuel[i][l.id]:null;
        h+='<td><div style="font-size:10px;color:#444">'+fmtN(bv)+'</div>'+(a!==null?'<div style="font-size:10px;color:#185FA5;font-weight:600">'+fmtN(a)+'</div>':'')+'</td>';
      });
      h+='<td style="font-weight:600;font-size:10px">'+fmtN(tot)+'</td></tr>';
    });
    // EBITDA
    h+='<tr style="background:#f0faf5"><td class="lbl" colspan="14" style="font-weight:700;color:#0F6E56;padding:6px 8px">EBITDA</td></tr>';
    h+='<tr style="background:#f0faf5"><td class="lbl" style="padding-left:16px;font-weight:600;color:#0F6E56">EBITDA mensuel</td>';
    var totEB=0;
    totals.forEach(function(t){
      totEB+=t.bpEBITDA;
      h+='<td><div style="font-size:10px;font-weight:600;color:#0F6E56">'+fmtN(t.bpEBITDA)+'</div>';
      if(t.hasReal)h+='<div style="font-size:10px;color:'+(t.aEBITDA>=0?'#3B6D11':'#A32D2D')+';font-weight:600">'+fmtN(t.aEBITDA)+'</div>';
      h+='</td>';
    });
    h+='<td style="font-weight:700;color:#0F6E56">'+fmtN(totEB)+'</td></tr>';
    // Charges
    h+='<tr style="background:#fafafa"><td class="lbl" colspan="14" style="font-weight:700;color:#555;padding:6px 8px">CHARGES</td></tr>';
    CHARGES.forEach(function(l){
      var tot=0;
      h+='<tr><td class="lbl" style="padding-left:16px">'+l.label+'</td>';
      bp.forEach(function(r,i){
        var bv=r[l.id];tot+=bv;
        var a=actuel[i]&&actuel[i][l.id]!=null?actuel[i][l.id]:null;
        h+='<td><div style="font-size:10px;color:#444">'+fmtN(bv)+'</div>'+(a!==null?'<div style="font-size:10px;color:#185FA5;font-weight:600">'+fmtN(a)+'</div>':'')+'</td>';
      });
      h+='<td style="font-weight:600;font-size:10px">'+fmtN(tot)+'</td></tr>';
    });
    // Resultat
    h+='<tr style="background:#f5f5f0"><td class="lbl" style="font-weight:700">RESULTAT NET</td>';
    var totRN=0;
    totals.forEach(function(t){
      totRN+=t.bpResult;
      h+='<td><div style="font-size:10px;font-weight:700">'+fmtN(t.bpResult)+'</div>';
      if(t.hasReal)h+='<div style="font-size:10px;color:'+(t.aResult>=0?'#3B6D11':'#A32D2D')+';font-weight:600">'+fmtN(t.aResult)+'</div>';
      h+='</td>';
    });
    h+='<td style="font-weight:700">'+fmtN(totRN)+'</td></tr>';
    h+='</table></div>';
    h+='<div style="font-size:10px;color:#888;margin-top:6px">Gris/noir = BP &middot; Bleu = Reel saisi</div>';
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
function renderEngagements(sid,s){
  var deps=S.depenses[sid]||[];
  // Utiliser le détail CAPEX custom si défini (règle ii), sinon valeurs INIT
  var _capexDet=getCapexDetailForStudio(sid);
  var _capexTots=computeCapexTotals(_capexDet);
  var capex=_capexTots.capex||s.capex||333500;
  var leasing=_capexTots.leasing||s.leasing||121600;
  // Emprunt : si CAPEX customisé, on scale à 70% du CAPEX (ratio dossier de référence)
  var _hasCustomCapex=s.capexDetail&&Object.keys(s.capexDetail||{}).length>0;
  var emprunt=_hasCustomCapex?Math.round(capex*0.70):(s.emprunt||230000);
  var fp=capex-emprunt; // Fonds propres = 30% du CAPEX si custom, sinon valeur sauvegardée
  var totalInvest=capex+leasing;
  // Répartition financement CAPEX (barres proportionnelles)
  var pctEmprunt=Math.round(emprunt/capex*100);
  var pctFP=100-pctEmprunt;
  var pctLeasingTotal=Math.round(leasing/totalInvest*100);
  var pctCapexTotal=100-pctLeasingTotal;
  // Suivi dépenses
  var engage=deps.reduce(function(sum,d){return sum+num(d.ttc);},0);
  var debloque=deps.filter(function(d){return d.deblocage==='debloque';}).reduce(function(sum,d){return sum+num(d.ttc);},0);
  var demande=deps.filter(function(d){return d.deblocage==='demande';}).reduce(function(sum,d){return sum+num(d.ttc);},0);
  var pctE=Math.min(100,Math.round(engage/capex*100));
  var pctD=Math.min(100,Math.round(debloque/capex*100));
  var isAdmin=!!S.profile&&!isViewer();
  var h='<div>';

  // ── Panneau : Structure de financement ──────────────────────────────────────
  h+='<div class="box" style="padding:0;overflow:hidden;margin-bottom:14px">';
  // Header blanc uniforme + investissement total mis en valeur
  h+='<div style="background:#f8f9fb;border-bottom:1px solid #e8eaf0;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">';
  h+='<div style="display:flex;align-items:center;gap:10px">';
  h+='<div style="width:3px;height:20px;border-radius:2px;background:#1a3a6b;flex-shrink:0"></div>';
  h+='<div style="font-size:12px;font-weight:700;color:#1a3a6b;letter-spacing:0.2px">Structure de financement</div>';
  h+='</div>';
  h+='<div style="text-align:right">';
  h+='<div style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:600;margin-bottom:2px">Investissement total</div>';
  h+='<div style="font-size:22px;font-weight:800;color:#0f1f3d;letter-spacing:-0.5px">'+fmt(totalInvest)+'</div>';
  h+='</div>';
  h+='</div>';
  h+='<div style="padding:18px 20px">';

  // Barre globale : CAPEX | Leasing
  h+='<div style="margin-bottom:18px">';
  h+='<div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:6px"><span>R&eacute;partition de l\'investissement</span><span>'+fmt(totalInvest)+'</span></div>';
  h+='<div style="display:flex;height:10px;border-radius:6px;overflow:hidden;gap:2px">';
  h+='<div style="width:'+pctCapexTotal+'%;background:#1a3a6b;border-radius:4px 0 0 4px" title="CAPEX '+fmt(capex)+'"></div>';
  h+='<div style="width:'+pctLeasingTotal+'%;background:#d4a017;border-radius:0 4px 4px 0" title="Leasing '+fmt(leasing)+'"></div>';
  h+='</div>';
  h+='<div style="display:flex;gap:16px;margin-top:6px;font-size:10px">';
  h+='<span style="display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:10px;height:10px;background:#1a3a6b;border-radius:2px"></span><b>CAPEX</b> '+fmt(capex)+' ('+pctCapexTotal+'%)</span>';
  h+='<span style="display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:10px;height:10px;background:#d4a017;border-radius:2px"></span><b style="color:#92630a">Leasing &eacute;quipement</b> '+fmt(leasing)+' ('+pctLeasingTotal+'%)</span>';
  h+='</div></div>';

  // 3 blocs : CAPEX detail + Leasing highlight + résumé
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">';

  // Bloc CAPEX (cliquable → détail)
  var capexOpen=!!(S.showCapexDetail&&S.showCapexDetail[sid]);
  h+='<div style="border:1px solid #d0d9ec;border-radius:10px;padding:14px 16px;cursor:pointer;transition:box-shadow .2s,transform .2s,border-color .2s" onclick="toggleCapexDetail(\''+sid+'\')" title="Cliquer pour voir le d\u00e9tail du budget" onmouseenter="this.style.boxShadow=\'0 4px 16px rgba(26,58,107,0.15)\';this.style.transform=\'translateY(-2px)\';this.style.borderColor=\'#1a3a6b\'" onmouseleave="this.style.boxShadow=\'none\';this.style.transform=\'none\';this.style.borderColor=\'#d0d9ec\'">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
  h+='<div style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#1a3a6b;font-weight:700">CAPEX</div>';
  h+='<div style="font-size:10px;color:#1a3a6b;font-weight:600;background:#e8eef8;padding:2px 8px;border-radius:20px">'+(capexOpen?'▲ Réduire':'▼ Détail')+'</div>';
  h+='</div>';
  h+='<div style="font-size:20px;font-weight:700;color:#0f1f3d;letter-spacing:-0.5px;margin-bottom:12px">'+fmt(capex)+'</div>';
  // Mini barre emprunt/FP
  h+='<div style="height:6px;border-radius:4px;overflow:hidden;display:flex;gap:1px;margin-bottom:8px">';
  h+='<div style="width:'+pctEmprunt+'%;background:#1a3a6b"></div>';
  h+='<div style="width:'+pctFP+'%;background:#0F6E56"></div>';
  h+='</div>';
  h+='<div style="font-size:10px;color:#555;display:flex;flex-direction:column;gap:4px">';
  h+='<div style="display:flex;justify-content:space-between"><span style="color:#1a3a6b;font-weight:600">Emprunt bancaire</span><span>'+fmt(emprunt)+'</span></div>';
  h+='<div style="display:flex;justify-content:space-between"><span style="color:#0F6E56;font-weight:600">Fonds propres</span><span>'+fmt(fp)+'</span></div>';
  h+='</div></div>';

  // Bloc Leasing (highlight)
  h+='<div style="border:2px solid #f0c040;border-radius:10px;padding:14px 16px;background:#fffdf0;position:relative">';
  h+='<div style="position:absolute;top:10px;right:10px;background:#f0c040;color:#7a5200;font-size:8px;font-weight:700;padding:2px 7px;border-radius:20px;text-transform:uppercase;letter-spacing:1px">Leasing</div>';
  h+='<div style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#92630a;font-weight:700;margin-bottom:10px">&Eacute;quipement Pilates</div>';
  h+='<div style="font-size:20px;font-weight:700;color:#7a5200;letter-spacing:-0.5px;margin-bottom:8px">'+fmt(leasing)+'</div>';
  h+='<div style="font-size:10px;color:#92630a;line-height:1.5">Pris en cr&eacute;dit-bail &mdash; hors CAPEX.<br>Mensualit&eacute;s s&eacute;par&eacute;es du financement principal.</div>';
  h+='</div>';

  // Bloc résumé
  h+='<div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;background:#f8f9fb">';
  h+='<div style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:700;margin-bottom:10px">R&eacute;sum&eacute;</div>';
  h+='<div style="display:flex;flex-direction:column;gap:7px;font-size:11px">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#555">Investissement total</span><b style="color:#0f1f3d">'+fmt(totalInvest)+'</b></div>';
  h+='<div style="border-top:1px solid #e2e8f0;padding-top:7px;display:flex;justify-content:space-between;align-items:center"><span style="color:#1a3a6b">Emprunt bancaire</span><b>'+fmt(emprunt)+'</b></div>';
  h+='<div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#0F6E56">Fonds propres</span><b>'+fmt(fp)+'</b></div>';
  h+='<div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#92630a">Leasing</span><b>'+fmt(leasing)+'</b></div>';
  // Taux d'intérêt
  var _tauxRawStored=S.studios[sid]&&S.studios[sid].tauxInteret!=null?S.studios[sid].tauxInteret:0;
  // Ignorer les valeurs corrompues (< 1%) et revenir au défaut BP
  var _tauxRaw=(_tauxRawStored>=0.01)?_tauxRawStored:0.0373;
  var _tauxPct=Math.round(_tauxRaw*10000)/100;
  h+='<div style="border-top:1px solid #e2e8f0;padding-top:8px;margin-top:2px">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center">';
  h+='<span style="color:#555;font-size:10.5px">Taux d\'int&eacute;r&ecirc;t</span>';
  if(isAdmin){
    h+='<div style="display:flex;align-items:center;gap:3px">';
    h+='<input type="number" value="'+_tauxPct+'" min="1" max="15" step="0.1" id="eng-taux-input" onchange="saveTauxInteret(\''+sid+'\',+this.value)" style="width:50px;padding:3px 6px;border:1px solid #d0d9ec;border-radius:6px;font-size:12px;font-weight:700;color:#1a3a6b;text-align:right;outline:none;background:#f5f7fd">';
    h+='<span style="font-size:11px;color:#64748b;font-weight:600">%</span>';
    h+='</div>';
  }else{
    h+='<b style="color:#1a3a6b">'+_tauxPct+'%</b>';
  }
  h+='</div>';
  h+='<div style="font-size:9px;color:#94a3b8;margin-top:3px">Impact direct sur charges financières &amp; BP</div>';
  h+='</div>';
  h+='</div></div>';
  h+='</div>';

  // ── Détail CAPEX expandable ──────────────────────────────────────────────────
  if(capexOpen){
    var _capexGross=_capexDet.reduce(function(s,r){return s+(r.montant>0?r.montant:0);},0);
    var _capexNet=_capexTots.capex; // hors leasing, hors remises
    var _capexViewer=isViewer();
    h+='<div style="margin:14px 0 0;border:1px solid #d0d9ec;border-radius:10px;overflow:hidden">';
    h+='<div style="background:#f0f4fa;padding:10px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #d0d9ec;flex-wrap:wrap">';
    h+='<div style="width:3px;height:16px;background:#1a3a6b;border-radius:2px;flex-shrink:0"></div>';
    h+='<div style="font-size:11px;font-weight:700;color:#1a3a6b">Détail du budget CAPEX</div>';
    if(!_capexViewer)h+='<div style="font-size:10px;color:#92630a;margin-left:4px">✎ modifiable</div>';
    h+='<div style="margin-left:auto;font-size:10px;color:#64748b">Hors leasing : <b style="color:#0f1f3d">'+fmt(_capexNet)+'</b> &nbsp;|&nbsp; Leasing : <b style="color:#92630a">'+fmt(_capexTots.leasing)+'</b></div>';
    h+='</div>';
    h+='<div style="padding:4px 0">';
    h+='<table style="width:100%;border-collapse:collapse">';
    h+='<tr style="background:#f8f9fb"><th style="text-align:left;padding:8px 16px;font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.8px">Poste</th>';
    h+='<th style="text-align:right;padding:8px 16px;font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.8px">Montant</th>';
    h+='<th style="text-align:center;padding:8px 16px;font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.8px">Financement</th></tr>';
    _capexDet.forEach(function(row,idx){
      var rowBg=row.remise?'#f0fdf4':row.leasing?'#fffdf0':idx%2===0?'#ffffff':'#fafafa';
      var amtColor=row.remise?'#0F6E56':row.leasing?'#92630a':'#0f1f3d';
      var amtPrefix=row.remise?'− ':'';
      var finBadge='';
      if(row.fin==='Crédit-bail (leasing)') finBadge='<span style="background:#fef3c7;color:#92630a;font-size:9px;font-weight:700;padding:2px 7px;border-radius:12px">Leasing</span>';
      else if(row.fin==='Emprunt bancaire') finBadge='<span style="background:#dbeafe;color:#1a3a6b;font-size:9px;font-weight:700;padding:2px 7px;border-radius:12px">Emprunt</span>';
      else if(row.fin==='Fonds propres') finBadge='<span style="background:#d1fae5;color:#065f46;font-size:9px;font-weight:700;padding:2px 7px;border-radius:12px">Fonds propres</span>';
      else finBadge='<span style="background:#fef3c7;color:#0F6E56;font-size:9px;font-weight:700;padding:2px 7px;border-radius:12px">Remise</span>';
      h+='<tr style="background:'+rowBg+';border-top:1px solid #f0f0f0">';
      h+='<td style="padding:9px 16px;font-size:12px;color:#1a1a2e">'+row.label+(row.leasing?' <span style="font-size:9px;color:#92630a">(leasing)</span>':'')+(row.remise?' <span style="font-size:9px;color:#0F6E56">✓ remise groupe</span>':'')+'</td>';
      if(_capexViewer||row.remise){
        h+='<td style="padding:9px 16px;font-size:12px;font-weight:700;color:'+amtColor+';text-align:right">'+amtPrefix+fmt(Math.abs(row.montant))+'</td>';
      } else {
        h+='<td style="padding:6px 12px;text-align:right">';
        h+='<input type="number" min="0" step="100" value="'+Math.abs(row.montant)+'" '
          +'onchange="saveCapexLine(\''+sid+'\','+idx+','+(row.remise?'-':'')+'+this.value)" '
          +'style="width:100px;padding:3px 7px;border:1px solid #d0d9ec;border-radius:5px;font-size:12px;font-weight:700;color:'+amtColor+';text-align:right;background:'+(row.leasing?'#fffdf0':row.remise?'#f0fdf4':'#fff')+';outline:none">';
        h+='</td>';
      }
      h+='<td style="padding:9px 16px;text-align:center">'+finBadge+'</td>';
      h+='</tr>';
    });
    // Total row
    h+='<tr style="background:#f0f4fa;border-top:2px solid #d0d9ec">';
    h+='<td style="padding:10px 16px;font-size:12px;font-weight:700;color:#0f1f3d">Total CAPEX (hors leasing)</td>';
    h+='<td style="padding:10px 16px;font-size:14px;font-weight:700;color:#1a3a6b;text-align:right">'+fmt(capex)+'</td>';
    h+='<td style="padding:10px 16px;text-align:center"><span style="font-size:10px;color:#64748b">réf. 333 500 €</span></td>';
    h+='</tr>';
    h+='<tr style="background:#fffdf0;border-top:1px solid #e8e0c0">';
    h+='<td style="padding:10px 16px;font-size:12px;font-weight:700;color:#92630a">Total Leasing</td>';
    h+='<td style="padding:10px 16px;font-size:14px;font-weight:700;color:#92630a;text-align:right">'+fmt(leasing)+'</td>';
    h+='<td style="padding:10px 16px;text-align:center"><span style="font-size:10px;color:#64748b">réf. 121 600 €</span></td>';
    h+='</tr>';
    h+='</table></div></div>';
  }
  h+='</div></div>';

  // ── Suivi des dépenses ──────────────────────────────────────────────────────
  h+='<div class="box" style="margin-bottom:14px">';
  h+='<div style="font-size:12px;font-weight:700;color:#1a3a6b;margin-bottom:14px">Suivi des d&eacute;penses CAPEX</div>';
  h+='<div class="kpis" style="margin-bottom:14px">';
  h+='<div class="kpi"><div class="kpi-label">Budget CAPEX</div><div class="kpi-val">'+fmt(capex)+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">Engag&eacute;</div><div class="kpi-val" style="color:#1a3a6b">'+fmt(engage)+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">D&eacute;bloqu&eacute;</div><div class="kpi-val" style="color:#0F6E56">'+fmt(debloque)+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">En attente</div><div class="kpi-val" style="color:#854F0B">'+fmt(demande)+'</div></div>';
  h+='<div class="kpi"><div class="kpi-label">Reste</div><div class="kpi-val">'+fmt(Math.max(0,capex-engage))+'</div></div>';
  h+='</div>';
  h+='<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:11px;color:#888;margin-bottom:4px"><span>Engag&eacute; / Budget</span><span style="font-weight:600">'+pctE+'%</span></div><div class="prog-bar"><div style="width:'+pctE+'%;background:#1a3a6b;border-radius:4px;height:6px"></div></div></div>';
  h+='<div><div style="display:flex;justify-content:space-between;font-size:11px;color:#888;margin-bottom:4px"><span>D&eacute;bloqu&eacute; / Budget</span><span style="font-weight:600">'+pctD+'%</span></div><div class="prog-bar"><div style="width:'+pctD+'%;background:#0F6E56;border-radius:4px;height:6px"></div></div></div>';
  // Répartition par mode de financement
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid #f0f0ea">';
  DEPENSE_FINS.forEach(function(f){
    var fe=deps.filter(function(d){return d.financement===f;}).reduce(function(s,d){return s+num(d.ttc);},0);
    var fd=deps.filter(function(d){return d.financement===f&&d.deblocage==='debloque';}).reduce(function(s,d){return s+num(d.ttc);},0);
    var fc=f==='Credit-bail'?'#92630a':f==='Emprunt bancaire'?'#1a3a6b':'#0F6E56';
    h+='<div style="text-align:center;padding:8px;background:#f8f9fb;border-radius:8px">';
    h+='<div style="font-size:10px;color:#64748b;margin-bottom:4px;font-weight:500">'+f+'</div>';
    h+='<div style="font-size:14px;font-weight:700;color:'+fc+'">'+fmt(fe)+'</div>';
    h+='<div style="font-size:10px;color:#0F6E56;margin-top:2px">'+fmt(fd)+' d&eacute;bloqu&eacute;</div>';
    h+='</div>';
  });
  h+='</div></div>';

  if(isAdmin)h+='<div style="display:flex;justify-content:flex-end;margin-bottom:12px"><button class="btn btn-primary" onclick="ouvrirFormDepense(\''+sid+'\')">+ Ajouter une d&eacute;pense</button></div>';
  h+='<div id="form-depense-'+sid+'"></div>';
  if(deps.length===0){
    h+=(typeof emptyState==='function')?('<div class="box" style="padding:10px">'+emptyState('money','Aucune dépense saisie','Ajoutez votre première dépense pour suivre votre budget.')+'</div>'):'<div class="box" style="text-align:center;padding:2rem;color:#aaa;font-size:13px">Aucune d&eacute;pense saisie</div>';
  } else {
    h+='<div style="overflow-x:auto"><table style="min-width:700px">';
    h+='<tr><th style="text-align:left;padding-left:8px">Cat&eacute;gorie</th><th style="text-align:left">Description</th><th>TTC</th><th>Financement</th><th>Par</th><th>Date</th><th>D&eacute;blocage</th><th>Justif</th><th></th></tr>';
    var _currentUser=(S.profile&&S.profile.nom)||'';
    deps.forEach(function(d,i){
      var st=DEBLOCAGE[d.deblocage]||DEBLOCAGE.attente;
      var isLeas=d.financement==='Credit-bail';
      var canEdit=isAdmin||(d.saisi_par&&d.saisi_par===_currentUser);
      h+='<tr'+(isLeas?' style="background:#fffdf0"':'')+'>';
      h+='<td style="padding:8px;font-size:12px;font-weight:500;text-align:left">'+d.categorie+'</td>';
      h+='<td style="padding:8px;font-size:12px;color:#555;text-align:left">'+(d.description||'--')+'</td>';
      h+='<td style="padding:8px;font-size:12px;font-weight:600">'+fmt(num(d.ttc))+'</td>';
      var fbc=isLeas?'background:#fef3c7;color:#92630a':d.financement==='Emprunt bancaire'?'background:#dbeafe;color:#1a3a6b':'background:#d1fae5;color:#065f46';
      h+='<td style="padding:8px"><span style="'+fbc+';padding:2px 7px;border-radius:5px;font-size:10px;font-weight:600">'+d.financement+'</span></td>';
      h+='<td style="padding:8px;font-size:11px">'+(d.engage_par||'--');
      if(d.avance&&d.avance_concernes&&d.avance_concernes.length>0){
        var _concList=d.avance_concernes.filter(function(c){return c!==(d.engage_par||'');});
        if(_concList.length>0)h+='<div style="margin-top:2px"><span style="background:#fef3c7;color:#92630a;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:600" title="'+_concList.join(', ')+'">Avance &rarr; '+(_concList.length===1?_concList[0]:_concList.length+' assoc.')+'</span></div>';
      }
      h+='</td>';
      h+='<td style="padding:8px;font-size:11px;color:#888">'+(d.date||'--')+'</td>';
      h+='<td style="padding:8px"><span style="background:'+st.bg+';color:'+st.color+';padding:2px 7px;border-radius:5px;font-size:11px;cursor:'+(isAdmin?'pointer':'default')+'" '+(isAdmin?'onclick="changerDeblocage(\''+sid+'\','+i+')"':'')+'>'+st.label+'</span>';
      if(d.deblocage==='demande')h+='<div style="font-size:10px;color:#888">'+(d.date_demande||'')+'</div>';
      if(d.deblocage==='debloque')h+='<div style="font-size:10px;color:#0F6E56">'+(d.date_deblocage||'')+'</div>';
      h+='</td>';
      h+='<td style="padding:8px;text-align:center">';
      if(d.fichierUrl)h+='<a href="'+d.fichierUrl+'" target="_blank" style="font-size:11px;color:#1a3a6b;text-decoration:none">doc</a> ';
      if(canEdit)h+='<label style="cursor:pointer;font-size:13px">+<input type="file" style="display:none" onchange="uploadJustif(\''+sid+'\','+i+',this)"/></label>';
      h+='</td>';
      if(isAdmin||canEdit){
        h+='<td style="padding:8px;white-space:nowrap">';
        if(canEdit)h+='<button class="btn" style="font-size:11px;padding:3px 8px;color:#1a3a6b" onclick="modifierDepense(\''+sid+'\','+i+')" title="Modifier"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>';
        if(isAdmin)h+='<button class="btn" style="font-size:11px;padding:3px 8px;color:#A32D2D" onclick="supprimerDepense(\''+sid+'\','+i+')">&times;</button>';
        h+='</td>';
      }
      h+='</tr>';
    });
    h+='</table></div>';
  }
  h+='</div>';
  return h;
}

function toggleCapexDetail(sid){
  if(!S.showCapexDetail)S.showCapexDetail={};
  S.showCapexDetail[sid]=!S.showCapexDetail[sid];
  render();
}

function _rebuildConcernes(sid,existingConcernes){
  var inner=document.getElementById('dep-concernes-inner');
  if(!inner)return;
  var payeur=(document.getElementById('dep-par')||{}).value||'';
  var soc=S.studios[sid]?S.studios[sid].societe:'';
  var owners=OWNERSHIP_MAP[soc]||[];
  var h='<div style="font-size:11px;color:#555;font-weight:500;margin-bottom:6px">Autres associ&eacute;s concern&eacute;s (hors payeur) :</div>';
  var hasAny=false;
  owners.forEach(function(o){
    if(o.nom===payeur)return;
    hasAny=true;
    var chk=!existingConcernes||existingConcernes.length===0||existingConcernes.indexOf(o.nom)>=0;
    h+='<label style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;font-size:12px;color:#333">';
    h+='<input type="checkbox" class="dep-concerne-cb" value="'+o.nom+'"'+(chk?' checked':'')+'/>';
    h+='<span style="font-weight:500">'+o.nom+'</span><span style="color:#888;font-size:10px">('+o.pct+'%)</span>';
    h+='</label>';
  });
  if(!hasAny)h+='<div style="font-size:11px;color:#aaa">Sélectionnez d\'abord le payeur ci-dessus</div>';
  inner.innerHTML=h;
}

function ouvrirFormDepense(sid){
  if(isViewer())return;
  var div=document.getElementById('form-depense-'+sid);
  if(!div)return;
  var h='<div class="box"><div style="font-weight:600;font-size:14px;margin-bottom:12px">Nouvelle depense</div><div class="form-grid">';
  h+='<div class="fg"><label>Categorie</label><select id="dep-cat"><option value="">Selectionner...</option>';
  DEPENSE_CATS.forEach(function(c){h+='<option>'+c+'</option>';});
  h+='</select></div><div class="fg"><label>Description</label><input id="dep-desc" placeholder="Ex: Devis ISOSPACE"/></div>';
  h+='<div class="fg"><label>Montant HT</label><input id="dep-ht" type="number" placeholder="0" oninput="calcTTC()"/></div>';
  h+='<div class="fg"><label>TVA</label><select id="dep-tva" onchange="calcTTC()"><option value="20">20%</option><option value="10">10%</option><option value="0">0%</option></select></div>';
  h+='<div class="fg"><label>Montant TTC</label><input id="dep-ttc" type="number" placeholder="0"/></div>';
  h+='<div class="fg"><label>Financement</label><select id="dep-fin">';
  DEPENSE_FINS.forEach(function(f){h+='<option>'+f+'</option>';});
  h+='</select></div>';
  h+='<div class="fg"><label>Engag&eacute; par</label><select id="dep-par" onchange="_rebuildConcernes(\''+sid+'\')"><option value="">Sélectionner...</option>';
  DEPENSE_CONTRIBUTORS.forEach(function(c){h+='<option>'+c+'</option>';});
  h+='</select></div>';
  h+='<div class="fg"><label>Date</label><input id="dep-date" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>';
  h+='</div>';
  // Répartition entre associés
  var _soc=S.studios[sid]?S.studios[sid].societe:'';
  var _owners=OWNERSHIP_MAP[_soc]||[];
  if(_owners.length>1){
    h+='<div style="margin:12px 0;padding:12px 16px;background:#f8f9fb;border-radius:10px;border:1px solid #e5e7eb">';
    h+='<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:500;color:#333"><input type="checkbox" id="dep-avance" onchange="document.getElementById(\'dep-concernes-wrap\').style.display=this.checked?\'block\':\'none\'"/> R&eacute;partir entre associ&eacute;s (avance)</label>';
    h+='<div style="font-size:10px;color:#888;margin-top:4px;margin-left:24px">Chaque associ&eacute; concern&eacute; devra sa quote-part (% de d&eacute;tention) &mdash; <b>'+_soc+'</b></div>';
    h+='<div id="dep-concernes-wrap" style="display:none;margin-top:10px">';
    h+='<div id="dep-concernes-inner"></div>';
    h+='</div></div>';
  }
  h+='<div style="display:flex;gap:8px"><button class="btn btn-primary" onclick="sauvegarderDepense(\''+sid+'\')">Enregistrer</button>';
  h+='<button class="btn" onclick="document.getElementById(\'form-depense-'+sid+'\').innerHTML=\'\'">Annuler</button></div></div>';
  div.innerHTML=h;
  _rebuildConcernes(sid);
}

function modifierDepense(sid,idx){
  var d=(S.depenses[sid]||[])[idx];
  if(!d)return;
  var _currentUser=(S.profile&&S.profile.nom)||'';
  var isAdmin=!!S.profile&&!isViewer();
  if(!isAdmin&&d.saisi_par!==_currentUser){toast('Seul l\'auteur de la dépense peut la modifier');return;}
  var div=document.getElementById('form-depense-'+sid);
  if(!div)return;
  var h='<div class="box"><div style="font-weight:600;font-size:14px;margin-bottom:12px;display:flex;align-items:center;gap:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Modifier la d&eacute;pense</div><div class="form-grid">';
  h+='<div class="fg"><label>Categorie</label><select id="dep-cat"><option value="">Selectionner...</option>';
  DEPENSE_CATS.forEach(function(c){h+='<option'+(c===d.categorie?' selected':'')+'>'+c+'</option>';});
  h+='</select></div><div class="fg"><label>Description</label><input id="dep-desc" value="'+(d.description||'').replace(/"/g,'&quot;')+'"/></div>';
  h+='<div class="fg"><label>Montant HT</label><input id="dep-ht" type="number" value="'+(d.ht||0)+'" oninput="calcTTC()"/></div>';
  h+='<div class="fg"><label>TVA</label><select id="dep-tva" onchange="calcTTC()"><option value="20"'+(num(d.tva)===20?' selected':'')+'>20%</option><option value="10"'+(num(d.tva)===10?' selected':'')+'>10%</option><option value="0"'+(num(d.tva)===0?' selected':'')+'>0%</option></select></div>';
  h+='<div class="fg"><label>Montant TTC</label><input id="dep-ttc" type="number" value="'+(d.ttc||0)+'"/></div>';
  h+='<div class="fg"><label>Financement</label><select id="dep-fin">';
  DEPENSE_FINS.forEach(function(f){h+='<option'+(f===d.financement?' selected':'')+'>'+f+'</option>';});
  h+='</select></div>';
  h+='<div class="fg"><label>Engag&eacute; par</label><select id="dep-par" onchange="_rebuildConcernes(\''+sid+'\',window._depEditConcernes)"><option value="">Sélectionner...</option>';
  DEPENSE_CONTRIBUTORS.forEach(function(c){h+='<option'+(c===d.engage_par?' selected':'')+'>'+c+'</option>';});
  h+='</select></div>';
  h+='<div class="fg"><label>Date</label><input id="dep-date" type="date" value="'+(d.date||'')+'"/></div>';
  h+='</div>';
  // Répartition entre associés
  var _isAvance=!!d.avance;
  var _concernes=d.avance_concernes||[];
  window._depEditConcernes=_concernes;
  var _soc=S.studios[sid]?S.studios[sid].societe:'';
  var _owners=OWNERSHIP_MAP[_soc]||[];
  if(_owners.length>1){
    h+='<div style="margin:12px 0;padding:12px 16px;background:#f8f9fb;border-radius:10px;border:1px solid #e5e7eb">';
    h+='<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:500;color:#333"><input type="checkbox" id="dep-avance"'+(_isAvance?' checked':'')+' onchange="document.getElementById(\'dep-concernes-wrap\').style.display=this.checked?\'block\':\'none\'"/> R&eacute;partir entre associ&eacute;s (avance)</label>';
    h+='<div style="font-size:10px;color:#888;margin-top:4px;margin-left:24px">Chaque associ&eacute; concern&eacute; devra sa quote-part (% de d&eacute;tention) &mdash; <b>'+_soc+'</b></div>';
    h+='<div id="dep-concernes-wrap" style="display:'+(_isAvance?'block':'none')+';margin-top:10px">';
    h+='<div id="dep-concernes-inner"></div>';
    h+='</div></div>';
  }
  h+='<div style="display:flex;gap:8px"><button class="btn btn-primary" onclick="sauvegarderModifDepense(\''+sid+'\','+idx+')">Enregistrer</button>';
  h+='<button class="btn" onclick="document.getElementById(\'form-depense-'+sid+'\').innerHTML=\'\'">Annuler</button></div></div>';
  div.innerHTML=h;
  _rebuildConcernes(sid,_concernes);
  div.scrollIntoView({behavior:'smooth',block:'nearest'});
}

async function sauvegarderModifDepense(sid,idx){
  var d=(S.depenses[sid]||[])[idx];
  if(!d){toast('Dépense introuvable');return;}
  var cat=document.getElementById('dep-cat')&&document.getElementById('dep-cat').value;
  if(!cat){toast('Selectionnez une categorie');return;}
  d.categorie=cat;
  d.description=(document.getElementById('dep-desc')&&document.getElementById('dep-desc').value)||'';
  d.ht=num(document.getElementById('dep-ht')&&document.getElementById('dep-ht').value);
  d.tva=num(document.getElementById('dep-tva')&&document.getElementById('dep-tva').value,20);
  d.ttc=num(document.getElementById('dep-ttc')&&document.getElementById('dep-ttc').value);
  d.financement=(document.getElementById('dep-fin')&&document.getElementById('dep-fin').value)||'Emprunt bancaire';
  d.engage_par=(document.getElementById('dep-par')&&document.getElementById('dep-par').value)||'';
  d.date=(document.getElementById('dep-date')&&document.getElementById('dep-date').value)||'';
  d.avance=!!(document.getElementById('dep-avance')&&document.getElementById('dep-avance').checked);
  d.avance_concernes=(function(){if(!d.avance)return[];var cbs=document.querySelectorAll('.dep-concerne-cb:checked');var arr=[];cbs.forEach(function(cb){arr.push(cb.value);});return arr;})();
  await saveDepenses(sid);
  toast('Dépense modifiée');render();
}

function calcTTC(){
  var ht=num(document.getElementById('dep-ht')&&document.getElementById('dep-ht').value);
  var tva=num(document.getElementById('dep-tva')&&document.getElementById('dep-tva').value,20);
  var el=document.getElementById('dep-ttc');
  if(el)el.value=Math.round(ht*(1+tva/100));
}

async function sauvegarderDepense(sid){
  var cat=document.getElementById('dep-cat')&&document.getElementById('dep-cat').value;
  if(!cat){toast('Selectionnez une categorie');return;}
  if(!S.depenses[sid])S.depenses[sid]=[];
  S.depenses[sid].push({
    categorie:cat,
    description:(document.getElementById('dep-desc')&&document.getElementById('dep-desc').value)||'',
    ht:num(document.getElementById('dep-ht')&&document.getElementById('dep-ht').value),
    tva:num(document.getElementById('dep-tva')&&document.getElementById('dep-tva').value,20),
    ttc:num(document.getElementById('dep-ttc')&&document.getElementById('dep-ttc').value),
    financement:(document.getElementById('dep-fin')&&document.getElementById('dep-fin').value)||'Emprunt bancaire',
    engage_par:(document.getElementById('dep-par')&&document.getElementById('dep-par').value)||'',
    date:(document.getElementById('dep-date')&&document.getElementById('dep-date').value)||'',
    deblocage:'attente',fichierUrl:null,fichierPath:null,date_demande:null,date_deblocage:null,
    saisi_par:(S.profile&&S.profile.nom)||'',
    avance:!!(document.getElementById('dep-avance')&&document.getElementById('dep-avance').checked),
    avance_concernes:(function(){if(!(document.getElementById('dep-avance')&&document.getElementById('dep-avance').checked))return[];var cbs=document.querySelectorAll('.dep-concerne-cb:checked');var arr=[];cbs.forEach(function(cb){arr.push(cb.value);});return arr;})(),
  });
  await saveDepenses(sid);
  var depTTC=num(document.getElementById('dep-ttc')&&document.getElementById('dep-ttc').value);
  notifyAll({type:'depense',studio_id:sid,title:'Nouvelle d\u00e9pense \u2014 '+(S.studios[sid]?S.studios[sid].name:sid),body:cat+' \u2014 '+fmt(depTTC)});
  toast('Depense enregistree');render();
}

async function supprimerDepense(sid,idx){
  if(isViewer())return;
  if(!confirm('Supprimer ?'))return;
  S.depenses[sid].splice(idx,1);
  await saveDepenses(sid);render();
}

async function changerDeblocage(sid,idx){
  if(isViewer())return;
  var d=S.depenses[sid][idx];
  var today=new Date().toLocaleDateString('fr-FR');
  if(d.deblocage==='attente'){d.deblocage='demande';d.date_demande=today;}
  else if(d.deblocage==='demande'){d.deblocage='debloque';d.date_deblocage=today;}
  else{d.deblocage='attente';d.date_demande=null;d.date_deblocage=null;}
  await saveDepenses(sid);render();
}

async function uploadJustif(sid,idx,input){
  if(isViewer())return;
  var file=input.files[0];if(!file)return;
  var path=sid+'/justif_'+Date.now()+'_'+cleanName(file.name);
  var res=await sb.storage.from('studio-files').upload(path,file,{upsert:true});
  if(res.error){toast('Erreur upload');return;}
  var pu=sb.storage.from('studio-files').getPublicUrl(path);
  S.depenses[sid][idx].fichierUrl=pu.data.publicUrl;
  S.depenses[sid][idx].fichierPath=path;
  await saveDepenses(sid);render();
}

function renderMessages(sid){
  var msgs=S.messages[sid]||[];
  var me=(S.profile&&S.profile.nom)||'';
  var colors=['#185FA5','#0F6E56','#854F0B','#993C1D','#533AB7','#A32D2D'];
  function aC(name){var h=0;for(var i=0;i<name.length;i++)h=name.charCodeAt(i)+((h<<5)-h);return colors[Math.abs(h)%colors.length];}
  function ini(name){return name.split(' ').map(function(w){return w[0]||'';}).join('').toUpperCase().slice(0,2);}
  var h='<div><div class="box" style="padding:0;overflow:hidden">';
  h+='<div id="msgs-list" style="height:420px;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px">';
  if(msgs.length===0){
    h+='<div style="text-align:center;color:#aaa;font-size:13px;margin:auto">Aucun message</div>';
  } else {
    msgs.forEach(function(m){
      var isMe=m.auteur===me;
      h+='<div style="display:flex;flex-direction:'+(isMe?'row-reverse':'row')+';align-items:flex-end;gap:8px">';
      h+=avatarHTML(m.auteur,32);
      h+='<div style="display:flex;flex-direction:column;align-items:'+(isMe?'flex-end':'flex-start')+';max-width:72%">';
      h+='<div style="font-size:11px;color:#888;margin-bottom:3px;font-weight:500">'+m.auteur+' &mdash; '+m.date+'</div>';
      h+='<div style="background:'+(isMe?'#1a1a1a':'#f0f0ea')+';color:'+(isMe?'#fff':'#1a1a1a')+';padding:10px 14px;border-radius:'+(isMe?'12px 12px 2px 12px':'12px 12px 12px 2px')+';font-size:13px;line-height:1.5">'+htmlEscape(m.texte)+'</div>';
      h+='</div></div>';
    });
  }
  h+='</div>';
  if(isViewer()){
    h+='<div style="border-top:0.5px solid #e0e0d8;padding:10px 16px;background:#f8f9fb;text-align:center;font-size:11px;color:#aaa">👁 Mode lecture seule — envoi de messages désactivé</div>';
  } else {
    h+='<div style="border-top:0.5px solid #e0e0d8;padding:12px 16px;display:flex;gap:8px;background:#fff">';
    h+='<input id="msg-input" type="text" placeholder="Votre message..." onkeydown="if(event.key===\'Enter\'){event.preventDefault();envoyerMessage(\''+sid+'\');}" style="flex:1;padding:8px 12px;border:0.5px solid #ddd;border-radius:8px;font-size:13px;outline:none"/>';
    h+='<button class="btn btn-primary" onclick="envoyerMessage(\''+sid+'\')">Envoyer</button>';
    h+='</div>';
  }
  h+='</div></div>';
  setTimeout(function(){var el=document.getElementById('msgs-list');if(el)el.scrollTop=el.scrollHeight;},50);
  return h;
}

async function envoyerMessage(sid){
  if(isViewer())return;
  var input=document.getElementById('msg-input');
  var texte=input&&input.value&&input.value.trim();
  if(!texte)return;
  if(input)input.value=''; // vider l'input immédiatement
  if(!S.messages[sid])S.messages[sid]=[];
  var now=new Date();
  S.messages[sid].push({
    auteur:(S.profile&&S.profile.nom)||'',
    texte:texte,
    date:now.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' '+now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),
    ts:now.toISOString(),
  });
  // Sauvegarder en lisant d'abord la version Supabase pour ne pas écraser les messages des autres
  var ex=await sb.from('studios').select('data').eq('id',sid+'_messages').maybeSingle();
  var existing=(ex.data&&ex.data.data&&ex.data.data.messages)||[];
  // Fusionner : garder les messages existants + ajouter le nouveau
  var dernierMsg=S.messages[sid][S.messages[sid].length-1];
  var merged=existing.concat([dernierMsg]);
  // Dédupliquer par ts
  var seen=new Set();
  merged=merged.filter(function(m){if(seen.has(m.ts))return false;seen.add(m.ts);return true;});
  merged.sort(function(a,b){return a.ts>b.ts?1:-1;});
  S.messages[sid]=merged;
  await sb.from('studios').upsert({id:sid+'_messages',data:{messages:merged},updated_at:new Date().toISOString()});
  // Notification
  notifyAll({type:'message',studio_id:sid,title:'Nouveau message \u2014 '+(S.studios[sid]?S.studios[sid].name:sid),body:texte.length>80?texte.slice(0,80)+'\u2026':texte});
  render();
  setTimeout(function(){var el=document.getElementById('msgs-list');if(el)el.scrollTop=el.scrollHeight;},50);
}

// Recharger les messages depuis Supabase (pour voir ceux des autres utilisateurs)
async function rechargerMessages(sid){
  var res=await sb.from('studios').select('data').eq('id',sid+'_messages').maybeSingle();
  var msgs=(res.data&&res.data.data&&res.data.data.messages)||[];
  var avant=JSON.stringify(S.messages[sid]||[]);
  S.messages[sid]=msgs;
  // Re-render seulement si nouveaux messages
  if(JSON.stringify(msgs)!==avant){
    render();
    setTimeout(function(){var el=document.getElementById('msgs-list');if(el)el.scrollTop=el.scrollHeight;},50);
  }
}

// ══════════════════════════════════════════════════════════════════════
// ── Échanges : Forum Topics + Tâches ──────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

function renderEchanges(sid){
  // Si un topic est ouvert → vue fil pleine largeur
  if(S.openTopicId)return renderTopicThread(sid,S.openTopicId);

  var topicCount=(S.topics[sid]||[]).length;
  var pendingTasks=(S.todos[sid]||[]).filter(function(t){return t.statut!=='done';}).length;

  var h='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start" class="echanges-grid">';

  // ── Bloc gauche : Discussions ──
  h+='<div style="background:#fff;border:0.5px solid #e0e0d8;border-radius:14px;overflow:hidden">';
  h+='<div style="padding:14px 18px;border-bottom:1px solid #f0f0ea;display:flex;align-items:center;justify-content:space-between">';
  h+='<div style="display:flex;align-items:center;gap:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span style="font-size:14px;font-weight:700;color:#1a1a1a">Discussions</span>';
  if(topicCount>0)h+='<span style="background:#f0f4ff;color:#1a3a6b;font-size:10px;font-weight:600;padding:2px 7px;border-radius:8px">'+topicCount+'</span>';
  h+='</div>';
  if(!isViewer())h+='<button onclick="ouvrirFormTopic(\''+sid+'\')" style="display:flex;align-items:center;gap:4px;padding:5px 12px;background:#1a3a6b;color:#fff;border:none;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;transition:opacity 0.15s" onmouseover="this.style.opacity=\'0.9\'" onmouseout="this.style.opacity=\'1\'"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nouveau</button>';
  h+='</div>';
  h+='<div style="max-height:520px;overflow-y:auto;padding:10px">';
  h+=renderTopicListInline(sid);
  h+='</div></div>';

  // ── Bloc droit : Tâches ──
  h+='<div style="background:#fff;border:0.5px solid #e0e0d8;border-radius:14px;overflow:hidden">';
  h+='<div style="padding:14px 18px;border-bottom:1px solid #f0f0ea;display:flex;align-items:center;justify-content:space-between">';
  h+='<div style="display:flex;align-items:center;gap:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#854F0B" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg><span style="font-size:14px;font-weight:700;color:#1a1a1a">Tâches</span>';
  if(pendingTasks>0)h+='<span style="background:#FEF3C7;color:#854F0B;font-size:10px;font-weight:600;padding:2px 7px;border-radius:8px">'+pendingTasks+'</span>';
  h+='</div>';
  if(!isViewer())h+='<button onclick="ouvrirFormTache(\''+sid+'\')" style="display:flex;align-items:center;gap:4px;padding:5px 12px;background:#1a3a6b;color:#fff;border:none;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;transition:opacity 0.15s" onmouseover="this.style.opacity=\'0.9\'" onmouseout="this.style.opacity=\'1\'"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nouvelle</button>';
  h+='</div>';
  h+='<div style="max-height:520px;overflow-y:auto;padding:10px">';
  h+=renderTachesInline(sid);
  h+='</div></div>';

  h+='</div>';
  return h;
}

// Inline topic list (no outer buttons, compact for side panel)
function renderTopicListInline(sid){
  var topics=(S.topics[sid]||[]).slice().sort(function(a,b){
    if(a.closed!==b.closed)return a.closed?1:-1;
    var aLast=a.messages&&a.messages.length?a.messages[a.messages.length-1].ts:a.ts;
    var bLast=b.messages&&b.messages.length?b.messages[b.messages.length-1].ts:b.ts;
    return (bLast||'').localeCompare(aLast||'');
  });
  if(!topics.length)return '<div style="text-align:center;padding:36px 16px"><div style="width:44px;height:44px;margin:0 auto 10px;border-radius:12px;background:linear-gradient(135deg,#E8F0FE,#D0DFFA);display:flex;align-items:center;justify-content:center"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B6FB6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div style="color:#555;font-size:12px;font-weight:600">Aucune discussion</div><div style="color:#bbb;font-size:11px;margin-top:3px">Lancez un sujet pour collaborer</div></div>';
  var h='';
  topics.forEach(function(t){
    var msgCount=t.messages?t.messages.length:0;
    var lastMsg=msgCount?t.messages[msgCount-1]:null;
    var lastDate=lastMsg?lastMsg.date:t.date;
    h+='<div onclick="S.openTopicId=\''+t.id+'\';render()" style="padding:10px 12px;border-radius:8px;cursor:pointer;transition:all 0.12s;border-bottom:1px solid #f8f8f4;opacity:'+(t.closed?'0.5':'1')+'" onmouseover="this.style.background=S.darkMode?\'#1c2128\':\'#f8f9fb\'" onmouseout="this.style.background=\'transparent\'">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">';
    h+='<div style="font-size:12px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1">'+t.titre+'</div>';
    h+='<div style="display:flex;align-items:center;gap:6px;flex-shrink:0">';
    if(t.closed)h+='<span style="font-size:8px;background:#f0f0ea;color:#888;padding:1px 5px;border-radius:4px">Clôturé</span>';
    h+='<span style="display:flex;align-items:center;gap:2px;font-size:10px;color:#999"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+msgCount+'</span>';
    h+='</div></div>';
    h+='<div style="font-size:10px;color:#999;margin-top:3px">'+t.auteur+' · '+lastDate+'</div>';
    h+='</div>';
  });
  return h;
}

// Inline tasks list (no outer buttons, compact for side panel)
// ─── Rendu "Notion-style" des tâches ───────────────────────────────────────
// Tri d'urgence : en_cours → à faire → bloqué → fait, puis par deadline
function _sortTodos(todos){
  return todos.slice().sort(function(a,b){
    var order={in_progress:0,doing:0,vu:0,todo:1,blocked:2,done:3};
    var sa=a.statut||'todo', sb=b.statut||'todo';
    var oa=order[sa]!=null?order[sa]:1, ob=order[sb]!=null?order[sb]:1;
    if(oa!==ob) return oa-ob;
    // Même groupe : deadline la plus proche en premier, puis ts desc
    if(a.deadline && b.deadline && a.deadline!==b.deadline) return a.deadline.localeCompare(b.deadline);
    if(a.deadline && !b.deadline) return -1;
    if(!a.deadline && b.deadline) return 1;
    return (b.ts||'').localeCompare(a.ts||'');
  });
}

function _renderTaskRow(sid,t){
  var status=t.statut||'todo';
  var statusMeta=_getStatusMeta(status);
  var isDone=(status==='done');
  var isDoing=(status==='in_progress'||status==='doing'||status==='vu');
  var isBlocked=(status==='blocked');
  var today=new Date().toISOString().slice(0,10);
  var overdue=t.deadline && t.deadline<today && !isDone;
  var soon=t.deadline && !overdue && !isDone && t.deadline<=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
  var assignees=_getAssignees(t);
  var commentCount=(t.comments||[]).length;
  var priorityMeta=t.priority?_getPriorityMeta(t.priority):null;
  var cbCls='task-checkbox'+(isDone?' done':'')+(isDoing?' doing':'')+(isBlocked?' blocked':'');
  var h='<div class="task-row'+(isDone?' done':'')+'" onclick="openTacheModal(\''+sid+'\',\''+t.id+'\')">';
  // Checkbox
  h+='<button class="'+cbCls+'" onclick="event.stopPropagation();toggleTacheStatut(\''+sid+'\',\''+t.id+'\')" title="'+statusMeta.label+' — clic pour avancer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>';
  // Titre
  h+='<div class="task-row-title">'+_escHtml(t.titre||'(sans titre)');
  if(commentCount>0)h+='<span class="task-row-comments-count"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+commentCount+'</span>';
  h+='</div>';
  // Meta à droite
  h+='<div class="task-row-meta">';
  // Pill statut
  h+='<span class="task-pill task-pill-status" style="background:'+statusMeta.bg+';color:'+statusMeta.color+'">'+statusMeta.label+'</span>';
  // Pill priorité (si définie)
  if(priorityMeta){
    h+='<span class="task-pill task-pill-priority" style="background:'+priorityMeta.bg+';color:'+priorityMeta.color+'" title="Priorité '+priorityMeta.label+'">'+priorityMeta.icon+' '+priorityMeta.label+'</span>';
  }
  // Pill deadline
  if(t.deadline){
    var dl=new Date(t.deadline+'T00:00:00');
    var dlabel=dl.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    var dlCls='task-pill task-pill-deadline'+(overdue?' overdue':(soon?' soon':''));
    h+='<span class="'+dlCls+'">'+(overdue?'⚠ ':'')+dlabel+'</span>';
  }
  // Avatars assignés
  if(assignees.length){
    h+='<span class="task-assignees">'+_avatarStackHtml(assignees,24)+'</span>';
  }
  h+='</div></div>';
  return h;
}

// V2 — Dispatcher : délègue à la vue liste ou kanban selon la préférence utilisateur
function renderTachesInline(sid){
  var todos=S.todos[sid]||[];
  if(!todos.length){
    return '<div class="tasks-empty">'
      +'<div class="tasks-empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>'
      +'<div class="tasks-empty-title">Aucune tâche pour le moment</div>'
      +'<div class="tasks-empty-subtitle">Organise le projet avec des tâches collaboratives</div>'
      +(!isViewer()?'<button class="tasks-add-btn" onclick="ouvrirFormTache(\''+sid+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Créer une tâche</button>':'')
      +'</div>';
  }
  var view=_getTasksView(sid);
  // Segment control : toggle Liste / Kanban
  var h='<div class="tasks-view-tabs"><button class="tasks-view-tab'+(view==='liste'?' active':'')+'" onclick="setTasksView(\''+sid+'\',\'liste\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> Liste</button><button class="tasks-view-tab'+(view==='kanban'?' active':'')+'" onclick="setTasksView(\''+sid+'\',\'kanban\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="11" rx="1"/></svg> Kanban</button></div>';
  if(view==='kanban'){
    h+=_renderTachesKanban(sid);
  } else {
    h+=_renderTachesListe(sid);
  }
  return h;
}

// V2 — Bascule de vue : mémorise en localStorage et rerender l'onglet
function setTasksView(sid,view){
  _setTasksView(sid,view);
  render();
}

// V2 — Vue Liste classique (ex-corps de renderTachesInline)
function _renderTachesListe(sid){
  var todos=_sortTodos(S.todos[sid]||[]);
  var doneCount=todos.filter(function(t){return t.statut==='done';}).length;
  var total=todos.length;
  var pct=total?Math.round(doneCount/total*100):0;
  var h='';
  h+='<div class="tasks-progress"><div class="tasks-progress-bar"><div class="tasks-progress-fill" style="width:'+pct+'%"></div></div><span>'+doneCount+'/'+total+' · '+pct+'%</span></div>';
  h+='<div class="tasks-list">';
  todos.forEach(function(t){h+=_renderTaskRow(sid,t);});
  h+='</div>';
  return h;
}

// V2 — Vue Kanban : 4 colonnes par statut avec drag & drop
function _renderTachesKanban(sid){
  var todos=S.todos[sid]||[];
  var cols=_kanbanColumns();
  // Bucketter les tâches par statut (normalisation legacy → current)
  var buckets={};
  cols.forEach(function(c){buckets[c]=[];});
  todos.forEach(function(t){
    var s=t.statut||'todo';
    if(s==='pending')s='todo';
    if(s==='vu'||s==='doing')s='in_progress';
    if(!buckets[s])s='todo';
    buckets[s].push(t);
  });
  // Tri intra-colonne : deadline la plus proche, puis ts desc
  cols.forEach(function(c){
    buckets[c].sort(function(a,b){
      if(a.deadline&&b.deadline&&a.deadline!==b.deadline)return a.deadline.localeCompare(b.deadline);
      if(a.deadline&&!b.deadline)return -1;
      if(!a.deadline&&b.deadline)return 1;
      return (b.ts||'').localeCompare(a.ts||'');
    });
  });
  var viewer=isViewer();
  var h='<div class="kanban-board">';
  cols.forEach(function(c){
    var meta=_getStatusMeta(c);
    var list=buckets[c];
    h+='<div class="kanban-column" data-statut="'+c+'">';
    h+='<div class="kanban-col-header" style="border-left:3px solid '+meta.color+'"><span class="kanban-col-dot" style="background:'+meta.color+'"></span><span class="kanban-col-title">'+meta.label+'</span><span class="kanban-col-count">'+list.length+'</span></div>';
    h+='<div class="kanban-col-body"'+(viewer?'':' ondragover="_onKanbanDragOver(event)" ondragleave="_onKanbanDragLeave(event)" ondrop="_onKanbanDrop(event,\''+c+'\')"')+'>';
    if(!list.length){
      h+='<div class="kanban-col-empty">Aucune tâche</div>';
    } else {
      list.forEach(function(t){h+=_renderKanbanCard(sid,t,viewer);});
    }
    h+='</div></div>';
  });
  h+='</div>';
  return h;
}

// V2 — Card kanban (forme compacte, draggable)
function _renderKanbanCard(sid,t,viewer){
  var assignees=_getAssignees(t);
  var commentCount=(t.comments||[]).length;
  var priorityMeta=t.priority?_getPriorityMeta(t.priority):null;
  var today=new Date().toISOString().slice(0,10);
  var isDone=(t.statut==='done');
  var overdue=t.deadline&&t.deadline<today&&!isDone;
  var soon=t.deadline&&!overdue&&!isDone&&t.deadline<=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
  var dragAttrs=viewer?'':' draggable="true" ondragstart="_onKanbanDragStart(event,\''+t.id+'\')" ondragend="_onKanbanDragEnd(event)"';
  var h='<div class="kanban-card"'+dragAttrs+' onclick="openTacheModal(\''+sid+'\',\''+t.id+'\')">';
  // Titre
  h+='<div class="kanban-card-title">'+_escHtml(t.titre||'(sans titre)')+'</div>';
  // Description abrégée (si présente)
  if(t.description){
    var desc=String(t.description).slice(0,100);
    h+='<div class="kanban-card-desc">'+_escHtml(desc)+(t.description.length>100?'…':'')+'</div>';
  }
  // Meta row
  h+='<div class="kanban-card-meta">';
  // Priorité
  if(priorityMeta){
    h+='<span class="task-pill task-pill-priority" style="background:'+priorityMeta.bg+';color:'+priorityMeta.color+'" title="Priorité '+priorityMeta.label+'">'+priorityMeta.icon+' '+priorityMeta.label+'</span>';
  }
  // Deadline
  if(t.deadline){
    var dl=new Date(t.deadline+'T00:00:00');
    var dlabel=dl.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    var dlCls='task-pill task-pill-deadline'+(overdue?' overdue':(soon?' soon':''));
    h+='<span class="'+dlCls+'">'+(overdue?'⚠ ':'')+dlabel+'</span>';
  }
  // Commentaires
  if(commentCount>0){
    h+='<span class="task-pill task-pill-comments"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> '+commentCount+'</span>';
  }
  h+='</div>';
  // Footer : avatars
  if(assignees.length){
    h+='<div class="kanban-card-footer">'+_avatarStackHtml(assignees,22)+'</div>';
  }
  h+='</div>';
  return h;
}

// V2 — Handlers Drag & Drop HTML5 natifs (desktop uniquement — mobile garde la pill cliquable)
var _dragTaskId=null;
function _onKanbanDragStart(ev,taskId){
  _dragTaskId=taskId;
  try{ev.dataTransfer.effectAllowed='move';ev.dataTransfer.setData('text/plain',taskId);}catch(e){}
  var card=ev.currentTarget||ev.target;
  if(card&&card.classList)card.classList.add('dragging');
}
function _onKanbanDragEnd(ev){
  var card=ev.currentTarget||ev.target;
  if(card&&card.classList)card.classList.remove('dragging');
  document.querySelectorAll('.kanban-column.drop-target').forEach(function(c){c.classList.remove('drop-target');});
  _dragTaskId=null;
}
function _onKanbanDragOver(ev){
  ev.preventDefault();
  try{ev.dataTransfer.dropEffect='move';}catch(e){}
  var col=(ev.currentTarget&&ev.currentTarget.closest)?ev.currentTarget.closest('.kanban-column'):null;
  if(col)col.classList.add('drop-target');
}
function _onKanbanDragLeave(ev){
  var col=(ev.currentTarget&&ev.currentTarget.closest)?ev.currentTarget.closest('.kanban-column'):null;
  if(col&&!col.contains(ev.relatedTarget))col.classList.remove('drop-target');
}
async function _onKanbanDrop(ev,targetStatut){
  ev.preventDefault();
  var col=(ev.currentTarget&&ev.currentTarget.closest)?ev.currentTarget.closest('.kanban-column'):null;
  if(col)col.classList.remove('drop-target');
  var id=_dragTaskId;
  try{if(!id)id=ev.dataTransfer.getData('text/plain');}catch(e){}
  _dragTaskId=null;
  if(!id)return;
  // Retrouver le studio : la colonne est dans un .kanban-board, lui-même dans l'onglet tâches du studio courant
  var sid=(S.currentStudio||'');
  if(!sid){
    // Fallback : chercher la tâche dans tous les studios
    Object.keys(S.todos||{}).forEach(function(k){
      if((S.todos[k]||[]).some(function(t){return t.id===id;}))sid=k;
    });
  }
  if(!sid)return;
  var task=(S.todos[sid]||[]).find(function(t){return t.id===id;});
  if(!task)return;
  // Normaliser l'état courant vers le nouveau schéma pour comparer
  var cur=task.statut||'todo';
  if(cur==='pending')cur='todo';
  if(cur==='vu'||cur==='doing')cur='in_progress';
  if(cur===targetStatut)return;
  // Réutilise _setTaskStatus (V1) qui fait save + trigger email fire-and-forget
  await _setTaskStatus(sid,id,targetStatut);
}

// ── DISCUSSIONS (Forum Topics) ──────────────────────────────────────────

function renderDiscussions(sid){
  if(S.openTopicId)return renderTopicThread(sid,S.openTopicId);
  return renderTopicList(sid);
}

function renderTopicList(sid){
  var topics=(S.topics[sid]||[]).slice().sort(function(a,b){
    // Non-closed first, then by latest activity
    if(a.closed!==b.closed)return a.closed?1:-1;
    var aLast=a.messages&&a.messages.length?a.messages[a.messages.length-1].ts:a.ts;
    var bLast=b.messages&&b.messages.length?b.messages[b.messages.length-1].ts:b.ts;
    return (bLast||'').localeCompare(aLast||'');
  });
  var h='';
  if(!isViewer()){
    h+='<div style="display:flex;justify-content:flex-end;margin-bottom:12px">';
    h+='<button onclick="ouvrirFormTopic(\''+sid+'\')" style="display:flex;align-items:center;gap:5px;padding:8px 16px;background:#1a3a6b;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:opacity 0.15s" onmouseover="this.style.opacity=\'0.9\'" onmouseout="this.style.opacity=\'1\'"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nouveau sujet</button>';
    h+='</div>';
  }
  if(!topics.length){
    h+='<div class="box" style="text-align:center;padding:40px 20px"><div style="width:48px;height:48px;margin:0 auto 10px;border-radius:14px;background:linear-gradient(135deg,#E8F0FE,#D0DFFA);display:flex;align-items:center;justify-content:center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B6FB6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div style="color:#555;font-size:13px;font-weight:600">Aucune discussion pour le moment</div><div style="color:#bbb;font-size:11px;margin-top:4px">Créez un sujet pour lancer la conversation</div></div>';
    return h;
  }
  h+='<div style="display:flex;flex-direction:column;gap:8px">';
  topics.forEach(function(t){
    var msgCount=t.messages?t.messages.length:0;
    var lastMsg=msgCount?t.messages[msgCount-1]:null;
    var lastDate=lastMsg?lastMsg.date:t.date;
    var lastAuteur=lastMsg?lastMsg.auteur:t.auteur;
    h+='<div onclick="S.openTopicId=\''+t.id+'\';render()" style="background:#fff;border:0.5px solid '+(t.closed?'#e8e8e3':'#e0e0d8')+';border-radius:10px;padding:14px 18px;cursor:pointer;transition:all 0.15s;opacity:'+(t.closed?'0.6':'1')+'" onmouseover="this.style.borderColor=\'#bbb\';this.style.boxShadow=\'0 2px 8px rgba(0,0,0,0.04)\'" onmouseout="this.style.borderColor=\''+(t.closed?'#e8e8e3':'#e0e0d8')+'\';this.style.boxShadow=\'none\'">';
    h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">';
    h+='<div style="min-width:0;flex:1">';
    h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span style="font-size:13px;font-weight:600;color:#1a1a1a">'+t.titre+'</span>';
    if(t.closed)h+='<span style="font-size:9px;background:#f0f0ea;color:#888;padding:1px 6px;border-radius:6px">Clôturé</span>';
    h+='</div>';
    h+='<div style="font-size:11px;color:#888">Créé par <span style="font-weight:500;color:#555">'+t.auteur+'</span> · '+t.date+'</div>';
    h+='</div>';
    h+='<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">';
    h+='<div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#888"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> '+msgCount+'</div>';
    h+='<div style="text-align:right"><div style="font-size:10px;color:#bbb">Dernière activité</div><div style="font-size:10px;color:#666;font-weight:500">'+lastDate+'</div></div>';
    h+='</div></div></div>';
  });
  h+='</div>';
  return h;
}

function renderTopicThread(sid,topicId){
  var topics=S.topics[sid]||[];
  var topic=topics.find(function(t){return t.id===topicId;});
  if(!topic)return '<div class="box">Topic introuvable</div>';
  var msgs=topic.messages||[];
  var me=(S.profile&&S.profile.nom)||'';
  var h='';
  // Header
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">';
  h+='<div style="display:flex;align-items:center;gap:10px">';
  h+='<button onclick="S.openTopicId=null;render()" style="background:none;border:none;cursor:pointer;font-size:13px;color:#888;padding:0">← Retour</button>';
  h+='<span style="font-size:15px;font-weight:700;color:#1a1a1a">'+topic.titre+'</span>';
  if(topic.closed){
    if(isSuperAdmin()){
      h+='<span onclick="rouvrirTopic(\''+sid+'\',\''+topicId+'\')" style="font-size:9px;background:#f0f0ea;color:#888;padding:2px 8px;border-radius:6px;cursor:pointer;transition:all 0.15s" onmouseover="this.style.background=\'#DBEAFE\';this.style.color=\'#1D4ED8\'" onmouseout="this.style.background=\'#f0f0ea\';this.style.color=\'#888\'" title="Cliquer pour rouvrir">Clôturé ↺</span>';
    } else {
      h+='<span style="font-size:9px;background:#f0f0ea;color:#888;padding:2px 8px;border-radius:6px">Clôturé</span>';
    }
  }
  h+='</div>';
  if(!topic.closed&&!isViewer()&&(topic.auteur===me||isSuperAdmin())){
    h+='<button onclick="fermerTopic(\''+sid+'\',\''+topicId+'\')" style="font-size:11px;color:#888;background:none;border:1px solid #e0e0da;border-radius:6px;padding:4px 10px;cursor:pointer;transition:all 0.15s" onmouseover="this.style.borderColor=\'#bbb\'" onmouseout="this.style.borderColor=\'#e0e0da\'">Clôturer</button>';
  }
  h+='</div>';
  h+='<div style="font-size:11px;color:#888;margin-bottom:14px">Par '+topic.auteur+' · '+topic.date+'</div>';
  // Messages
  h+='<div class="box" style="padding:0;overflow:hidden">';
  h+='<div id="topic-msgs" style="height:380px;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px">';
  if(!msgs.length)h+=(typeof emptyState==='function')?emptyState('chat','Aucune réponse pour le moment','Soyez le premier à répondre.'):'<div style="text-align:center;color:#aaa;font-size:12px;padding:20px">Aucune réponse pour le moment</div>';
  msgs.forEach(function(m,mi){
    var isMe=m.auteur===me;
    var canEdit=isMe||isSuperAdmin();
    h+='<div style="display:flex;flex-direction:'+(isMe?'row-reverse':'row')+';align-items:flex-end;gap:8px" class="topic-msg-row" onmouseover="var a=this.querySelector(\'.msg-actions\');if(a)a.style.opacity=\'1\'" onmouseout="var a=this.querySelector(\'.msg-actions\');if(a)a.style.opacity=\'0\'">';
    h+=avatarHTML(m.auteur,32);
    h+='<div style="display:flex;flex-direction:column;align-items:'+(isMe?'flex-end':'flex-start')+';max-width:72%">';
    h+='<div style="font-size:11px;color:#888;margin-bottom:3px;font-weight:500">'+m.auteur+' &mdash; '+m.date+(m.edited?' <span style="font-style:italic;color:#bbb">(modifié)</span>':'')+'</div>';
    h+='<div style="position:relative">';
    h+='<div style="background:'+(isMe?'#1a3a6b':'#f0f0ea')+';color:'+(isMe?'#fff':'#1a1a1a')+';padding:10px 14px;border-radius:'+(isMe?'12px 12px 2px 12px':'12px 12px 12px 2px')+';font-size:13px;line-height:1.5">'+htmlEscape(m.texte)+'</div>';
    var within5min=m.ts&&(Date.now()-new Date(m.ts).getTime()<5*60*1000);
    if(canEdit&&!topic.closed&&(within5min||isSuperAdmin())){
      h+='<div class="msg-actions" style="opacity:0;transition:opacity 0.15s;position:absolute;'+(isMe?'left:-60px':'right:-60px')+';top:50%;transform:translateY(-50%);display:flex;gap:2px">';
      h+='<button onclick="event.stopPropagation();modifierMsgTopic(\''+sid+'\',\''+topicId+'\','+mi+')" title="Modifier" style="background:#fff;border:1px solid #e0e0da;border-radius:6px;width:26px;height:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;color:#888;transition:all 0.15s;box-shadow:0 1px 3px rgba(0,0,0,0.06)" onmouseover="this.style.borderColor=\'#1a3a6b\';this.style.color=\'#1a3a6b\'" onmouseout="this.style.borderColor=\'#e0e0da\';this.style.color=\'#888\'">✎</button>';
      h+='<button onclick="event.stopPropagation();supprimerMsgTopic(\''+sid+'\',\''+topicId+'\','+mi+')" title="Supprimer" style="background:#fff;border:1px solid #e0e0da;border-radius:6px;width:26px;height:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;color:#888;transition:all 0.15s;box-shadow:0 1px 3px rgba(0,0,0,0.06)" onmouseover="this.style.borderColor=\'#A32D2D\';this.style.color=\'#A32D2D\'" onmouseout="this.style.borderColor=\'#e0e0da\';this.style.color=\'#888\'">×</button>';
      h+='</div>';
    }
    h+='</div></div></div>';
  });
  h+='</div>';
  // Input
  if(!topic.closed&&!isViewer()){
    h+='<div style="border-top:0.5px solid #e0e0d8;padding:12px 16px;display:flex;gap:8px;background:#fff">';
    h+='<input id="topic-reply-input" type="text" placeholder="Votre réponse..." onkeydown="if(event.key===\'Enter\'){event.preventDefault();repondreTopic(\''+sid+'\',\''+topicId+'\');}" style="flex:1;padding:8px 12px;border:0.5px solid #ddd;border-radius:8px;font-size:13px;outline:none" onfocus="this.style.borderColor=\'#1a3a6b\'" onblur="this.style.borderColor=\'#ddd\'">';
    h+='<button onclick="repondreTopic(\''+sid+'\',\''+topicId+'\')" style="padding:8px 16px;background:#1a3a6b;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:opacity 0.15s;white-space:nowrap" onmouseover="this.style.opacity=\'0.9\'" onmouseout="this.style.opacity=\'1\'">Envoyer</button>';
    h+='</div>';
  } else if(topic.closed){
    h+='<div style="border-top:0.5px solid #e0e0d8;padding:10px 16px;background:#f8f9fb;text-align:center;font-size:11px;color:#aaa">Ce sujet est clôturé</div>';
  }
  h+='</div>';
  setTimeout(function(){var el=document.getElementById('topic-msgs');if(el)el.scrollTop=el.scrollHeight;},50);
  return h;
}

function ouvrirFormTopic(sid){
  var overlay=document.createElement('div');
  overlay.id='topic-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  var box='<div style="background:#fff;border-radius:14px;padding:24px 28px;width:420px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.18)">';
  box+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px"><span style="font-size:15px;font-weight:700;color:#1a1a1a">Nouveau sujet</span><button onclick="document.getElementById(\'topic-modal\').remove()" style="background:none;border:none;font-size:20px;color:#999;cursor:pointer;padding:0;line-height:1">&times;</button></div>';
  box+='<label style="font-size:11px;font-weight:600;color:#666;display:block;margin-bottom:4px">Titre du sujet</label>';
  box+='<input id="new-topic-title" type="text" placeholder="Ex: Négociation bail commercial" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;margin-bottom:14px;box-sizing:border-box;outline:none" onfocus="this.style.borderColor=\'#1a3a6b\'" onblur="this.style.borderColor=\'#ddd\'">';
  box+='<label style="font-size:11px;font-weight:600;color:#666;display:block;margin-bottom:4px">Premier message</label>';
  box+='<textarea id="new-topic-body" rows="3" placeholder="Décrivez le sujet..." style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;margin-bottom:18px;box-sizing:border-box;outline:none;resize:vertical;font-family:inherit" onfocus="this.style.borderColor=\'#1a3a6b\'" onblur="this.style.borderColor=\'#ddd\'"></textarea>';
  box+='<button onclick="creerTopic(\''+sid+'\')" style="width:100%;padding:11px;background:#1a3a6b;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:opacity 0.15s" onmouseover="this.style.opacity=\'0.9\'" onmouseout="this.style.opacity=\'1\'">Créer le sujet</button>';
  box+='</div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
  setTimeout(function(){var el=document.getElementById('new-topic-title');if(el)el.focus();},80);
}

async function creerTopic(sid){
  var titre=(document.getElementById('new-topic-title')||{}).value;
  var body=(document.getElementById('new-topic-body')||{}).value;
  if(!titre||!titre.trim()){toast('Saisissez un titre');return;}
  var now=new Date();
  var me=(S.profile&&S.profile.nom)||'';
  var topic={
    id:'topic_'+Date.now(),
    titre:titre.trim(),
    auteur:me,
    date:now.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' '+now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),
    ts:now.toISOString(),
    closed:false,
    messages:[]
  };
  if(body&&body.trim()){
    topic.messages.push({auteur:me,texte:body.trim(),date:topic.date,ts:now.toISOString()});
  }
  if(!S.topics[sid])S.topics[sid]=[];
  S.topics[sid].push(topic);
  await saveTopics(sid);
  var modal=document.getElementById('topic-modal');if(modal)modal.remove();
  S.openTopicId=topic.id;
  notifyAll({type:'message',studio_id:sid,title:'Nouveau sujet — '+(S.studios[sid]?S.studios[sid].name:sid),body:titre.trim()});
  render();
  toast('Sujet créé');
}

async function repondreTopic(sid,topicId){
  var input=document.getElementById('topic-reply-input');
  var texte=input&&input.value&&input.value.trim();
  if(!texte)return;
  if(input)input.value='';
  var topics=S.topics[sid]||[];
  var topic=topics.find(function(t){return t.id===topicId;});
  if(!topic)return;
  var now=new Date();
  topic.messages.push({
    auteur:(S.profile&&S.profile.nom)||'',
    texte:texte,
    date:now.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' '+now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),
    ts:now.toISOString()
  });
  await saveTopics(sid);
  notifyAll({type:'message',studio_id:sid,title:'Réponse — '+topic.titre,body:texte.length>80?texte.slice(0,80)+'…':texte});
  render();
  setTimeout(function(){var el=document.getElementById('topic-msgs');if(el)el.scrollTop=el.scrollHeight;},50);
}

async function fermerTopic(sid,topicId){
  var topics=S.topics[sid]||[];
  var topic=topics.find(function(t){return t.id===topicId;});
  if(!topic)return;
  topic.closed=true;
  await saveTopics(sid);
  toast('Sujet clôturé');
  render();
}

async function rouvrirTopic(sid,topicId){
  if(!isSuperAdmin())return;
  var topics=S.topics[sid]||[];
  var topic=topics.find(function(t){return t.id===topicId;});
  if(!topic)return;
  topic.closed=false;
  await saveTopics(sid);
  toast('Sujet rouvert');
  render();
}

function modifierMsgTopic(sid,topicId,msgIdx){
  var topics=S.topics[sid]||[];
  var topic=topics.find(function(t){return t.id===topicId;});
  if(!topic||!topic.messages[msgIdx])return;
  var m=topic.messages[msgIdx];
  var overlay=document.createElement('div');
  overlay.id='edit-msg-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  var box='<div style="background:#fff;border-radius:14px;padding:24px 28px;width:420px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.18)">';
  box+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><span style="font-size:15px;font-weight:700;color:#1a1a1a">Modifier le message</span><button onclick="document.getElementById(\'edit-msg-modal\').remove()" style="background:none;border:none;font-size:20px;color:#999;cursor:pointer;padding:0;line-height:1">&times;</button></div>';
  box+='<textarea id="edit-msg-text" rows="4" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;margin-bottom:16px;box-sizing:border-box;outline:none;resize:vertical;font-family:inherit" onfocus="this.style.borderColor=\'#1a3a6b\'" onblur="this.style.borderColor=\'#ddd\'">'+m.texte.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</textarea>';
  box+='<button onclick="confirmerModifMsg(\''+sid+'\',\''+topicId+'\','+msgIdx+')" style="width:100%;padding:11px;background:#1a3a6b;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">Enregistrer</button>';
  box+='</div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
  setTimeout(function(){var el=document.getElementById('edit-msg-text');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);}},80);
}

async function confirmerModifMsg(sid,topicId,msgIdx){
  var el=document.getElementById('edit-msg-text');
  var texte=el&&el.value&&el.value.trim();
  if(!texte){toast('Le message ne peut pas être vide');return;}
  var topics=S.topics[sid]||[];
  var topic=topics.find(function(t){return t.id===topicId;});
  if(!topic||!topic.messages[msgIdx])return;
  topic.messages[msgIdx].texte=texte;
  topic.messages[msgIdx].edited=true;
  await saveTopics(sid);
  var modal=document.getElementById('edit-msg-modal');if(modal)modal.remove();
  toast('Message modifié');
  render();
}

async function supprimerMsgTopic(sid,topicId,msgIdx){
  if(!confirm('Supprimer ce message ?'))return;
  var topics=S.topics[sid]||[];
  var topic=topics.find(function(t){return t.id===topicId;});
  if(!topic||!topic.messages[msgIdx])return;
  var msgBody=topic.messages[msgIdx].texte||'';
  topic.messages.splice(msgIdx,1);
  await saveTopics(sid);
  // Supprimer les notifications liées
  if(msgBody)await sb.from('notifications').delete().eq('studio_id',sid).eq('type','message').ilike('body','%'+msgBody.slice(0,60)+'%');
  S.notifications=S.notifications.filter(function(n){return !(n.studio_id===sid&&n.type==='message'&&n.body&&n.body.indexOf(msgBody.slice(0,60))>=0);});
  toast('Message supprimé');
  render();
}

async function saveTopics(sid){
  await sb.from('studios').upsert({id:sid+'_topics',data:{topics:S.topics[sid]||[]},updated_at:new Date().toISOString()});
}

// ── TÂCHES (Todo List) ──────────────────────────────────────────────────

var TACHE_STATUTS={todo:{label:'À faire',bg:'#FEF3C7',text:'#854F0B',icon:'○'},vu:{label:'Vu',bg:'#F3E8FF',text:'#7C3AED',icon:'◉'},doing:{label:'En cours',bg:'#DBEAFE',text:'#1D4ED8',icon:'◐'},done:{label:'Terminé',bg:'#D1FAE5',text:'#065F46',icon:'✓'}};

// Vue complète "Notion-style" — header + liste + progress + CTA nouvelle tâche
function renderTaches(sid){
  var h='<div class="tasks-container">';
  h+='<div class="tasks-header">';
  h+='<div class="tasks-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> Tâches</div>';
  if(!isViewer()){
    h+='<button class="tasks-add-btn" onclick="ouvrirFormTache(\''+sid+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nouvelle tâche</button>';
  }
  h+='</div>';
  h+=renderTachesInline(sid);
  h+='</div>';
  return h;
}

// Liste des profils pour les pickers (assignees, etc.)
// Normalise un nom pour comparer : retire " (ISSEO)", " (xxx)", trim, lowercase
function _normalizeProfileName(n){
  return String(n||'').replace(/\s*\([^)]*\)\s*$/,'').trim().toLowerCase();
}

function _taskProfilesList(){
  var raw=(S._allProfiles||[]).slice();
  var EXPECTED=['Paul Bécaud','Pascal Bécaud','Tom Bécaud','Paul Sabourin','Caroline Coquel','Clément Coquel'];
  // Ajoute les EXPECTED manquants (vérification sur forme normalisée)
  var normSeen={};
  raw.forEach(function(p){if(p&&p.nom)normSeen[_normalizeProfileName(p.nom)]=true;});
  EXPECTED.forEach(function(n){
    var k=_normalizeProfileName(n);
    if(!normSeen[k]){raw.push({nom:n});normSeen[k]=true;}
  });
  // Dédup par nom normalisé : on garde le meilleur doublon (priorité : user_id > email > nom le plus court)
  var byKey={};
  raw.forEach(function(p){
    if(!p||!p.nom||!String(p.nom).trim())return;
    var k=_normalizeProfileName(p.nom);
    var cur=byKey[k];
    if(!cur){byKey[k]=p;return;}
    var curScore=(cur.user_id?2:0)+(cur.email?1:0);
    var newScore=(p.user_id?2:0)+(p.email?1:0);
    if(newScore>curScore){byKey[k]=p;return;}
    if(newScore===curScore){
      // À score égal, préfère la version sans "(…)" ou la plus courte
      var curHasParen=/\(/.test(cur.nom);
      var newHasParen=/\(/.test(p.nom);
      if(curHasParen&&!newHasParen){byKey[k]=p;return;}
      if(!curHasParen&&newHasParen)return;
      if(String(p.nom).length<String(cur.nom).length){byKey[k]=p;return;}
    }
  });
  // Nettoie les suffixes "(ISSEO)" affichés
  var out=Object.keys(byKey).map(function(k){
    var p=Object.assign({},byKey[k]);
    p.nom=String(p.nom||'').replace(/\s*\(ISSEO\)\s*$/i,'').trim();
    return p;
  });
  return out.sort(function(a,b){return a.nom.localeCompare(b.nom);});
}

// Création rapide — modal compact
// ══════════════════════════════════════════════════════════════════════
// V2 : Création rapide — modal Notion-style (assignees multi, priorité pill, presets deadline, tags)
// ══════════════════════════════════════════════════════════════════════

var _newTacheDraft=null; // { sid, titre, desc, assignees:[], priority, tags:[], deadline }
var _newTacheEscHandler=null;

function ouvrirFormTache(sid){
  var moi=(S.profile&&S.profile.nom)||'';
  _newTacheDraft={
    sid:sid,
    titre:'',
    desc:'',
    assignees:moi?[moi]:[],
    priority:'P2',
    tags:[],
    deadline:''
  };
  var overlay=document.createElement('div');
  overlay.id='tache-quick-modal';
  overlay.className='task-modal-overlay';
  overlay.onclick=function(e){if(e.target===overlay)_closeNewTacheModal();};
  overlay.innerHTML=_renderNewTacheModalInner(sid);
  document.body.appendChild(overlay);
  // ESC pour fermer
  _newTacheEscHandler=function(e){if(e.key==='Escape'){e.preventDefault();_closeNewTacheModal();}};
  document.addEventListener('keydown',_newTacheEscHandler);
  // Focus titre + Cmd+Enter submit
  setTimeout(function(){
    var el=document.getElementById('new-tache-titre');
    if(el){
      el.focus();
      el.addEventListener('keydown',function(e){
        if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();creerTache(sid);}
      });
    }
    var descEl=document.getElementById('new-tache-desc');
    if(descEl){
      descEl.addEventListener('keydown',function(e){
        if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();creerTache(sid);}
      });
    }
  },80);
}

function _closeNewTacheModal(){
  var m=document.getElementById('tache-quick-modal');
  if(m)m.remove();
  _newTacheDraft=null;
  if(_newTacheEscHandler){
    document.removeEventListener('keydown',_newTacheEscHandler);
    _newTacheEscHandler=null;
  }
  // Fermer d'éventuels pickers flottants
  document.querySelectorAll('.task-picker-dropdown').forEach(function(x){x.remove();});
}

function _rerenderNewTacheModal(){
  var overlay=document.getElementById('tache-quick-modal');
  if(!overlay||!_newTacheDraft)return;
  // Sauvegarder les valeurs des inputs live avant rerender
  var titreEl=document.getElementById('new-tache-titre');
  var descEl=document.getElementById('new-tache-desc');
  if(titreEl)_newTacheDraft.titre=titreEl.value;
  if(descEl)_newTacheDraft.desc=descEl.value;
  overlay.innerHTML=_renderNewTacheModalInner(_newTacheDraft.sid);
  // Rebind Cmd+Enter
  setTimeout(function(){
    var el=document.getElementById('new-tache-titre');
    var deEl=document.getElementById('new-tache-desc');
    [el,deEl].forEach(function(e){
      if(!e)return;
      e.addEventListener('keydown',function(ev){
        if((ev.metaKey||ev.ctrlKey)&&ev.key==='Enter'){ev.preventDefault();creerTache(_newTacheDraft.sid);}
      });
    });
  },20);
}

function _renderNewTacheModalInner(sid){
  var d=_newTacheDraft||{titre:'',desc:'',assignees:[],priority:'P2',tags:[],deadline:''};
  var moi=(S.profile&&S.profile.nom)||'';
  var today=new Date();
  var todayISO=today.toISOString().slice(0,10);
  var tomorrow=new Date(today.getTime()+86400000).toISOString().slice(0,10);
  var nextMonday=new Date(today.getTime()+((8-today.getDay())%7||7)*86400000).toISOString().slice(0,10);
  var endWeek=new Date(today.getTime()+((5-today.getDay()+7)%7||5)*86400000).toISOString().slice(0,10);

  var h='<div class="task-modal-box new-tache-modal" onclick="event.stopPropagation()">';

  // Topbar minimal
  h+='<div class="task-modal-topbar">';
  h+='<div style="display:flex;align-items:center;gap:8px"><span class="nt-badge">✦</span><span style="font-size:13px;font-weight:700;color:#1a1a1a">Nouvelle tâche</span></div>';
  h+='<button onclick="_closeNewTacheModal()" class="task-modal-close" title="Fermer">&times;</button>';
  h+='</div>';

  h+='<div class="nt-body">';

  // Titre
  h+='<input id="new-tache-titre" type="text" class="nt-title" placeholder="Titre de la tâche…" value="'+_escHtml(d.titre||'').replace(/"/g,'&quot;')+'" />';

  // Description
  h+='<textarea id="new-tache-desc" class="nt-desc" rows="2" placeholder="Ajoute une description (optionnel)…">'+_escHtml(d.desc||'')+'</textarea>';

  // Assignees
  h+='<div class="nt-field">';
  h+='<div class="nt-label">👥 Assigné à</div>';
  h+='<div class="nt-assignees-row">';
  if(d.assignees.length){
    d.assignees.forEach(function(nom){
      h+='<span class="nt-assignee-chip">'+_avatarHtml(nom,22)+'<span>'+_escHtml(nom.split(' ')[0])+'</span><button onclick="_nt_removeAssignee(\''+nom.replace(/'/g,"\\'")+'\')" title="Retirer">&times;</button></span>';
    });
  } else {
    h+='<span class="nt-assignee-empty">Personne — la tâche sera partagée à toute l\'équipe</span>';
  }
  h+='<button class="nt-add-btn" onclick="_nt_openAssigneePicker(event)" title="Ajouter un assigné">+</button>';
  h+='</div></div>';

  // Priorité en pills
  h+='<div class="nt-field">';
  h+='<div class="nt-label">⚑ Priorité</div>';
  h+='<div class="nt-pills">';
  var prios=[
    {id:'P0',icon:'🔥',label:'Urgent',color:'#DC2626',bg:'#FEE2E2'},
    {id:'P1',icon:'▲',label:'Haute',color:'#D97706',bg:'#FEF3C7'},
    {id:'P2',icon:'●',label:'Normale',color:'#6B7280',bg:'#F3F4F6'},
    {id:'P3',icon:'▽',label:'Basse',color:'#9CA3AF',bg:'#F9FAFB'}
  ];
  prios.forEach(function(p){
    var active=(d.priority===p.id);
    h+='<button class="nt-pill'+(active?' active':'')+'" onclick="_nt_setPriority(\''+p.id+'\')" style="'+(active?'background:'+p.bg+';border-color:'+p.color+';color:'+p.color+'':'')+'">'+p.icon+' '+p.label+'</button>';
  });
  h+='</div></div>';

  // Deadline : presets + date picker
  h+='<div class="nt-field">';
  h+='<div class="nt-label">📅 Deadline</div>';
  h+='<div class="nt-deadline-row">';
  var presets=[
    {label:'Aujourd\'hui',val:todayISO},
    {label:'Demain',val:tomorrow},
    {label:'Fin de semaine',val:endWeek},
    {label:'Lundi prochain',val:nextMonday}
  ];
  presets.forEach(function(p){
    var active=(d.deadline===p.val);
    h+='<button class="nt-preset'+(active?' active':'')+'" onclick="_nt_setDeadline(\''+p.val+'\')">'+p.label+'</button>';
  });
  h+='<input type="date" class="nt-date-input" value="'+(d.deadline||'')+'" onchange="_nt_setDeadline(this.value)" title="Choisir une date"/>';
  if(d.deadline){
    h+='<button class="nt-clear" onclick="_nt_setDeadline(\'\')" title="Effacer la deadline">×</button>';
  }
  h+='</div>';
  if(d.deadline){
    var dl=new Date(d.deadline+'T00:00:00');
    var dlLabel=dl.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
    var daysLeft=Math.round((dl-new Date(todayISO+'T00:00:00'))/86400000);
    var dlHint=daysLeft===0?'aujourd\'hui':(daysLeft===1?'demain':(daysLeft>0?'dans '+daysLeft+' jours':'il y a '+(-daysLeft)+' jours'));
    h+='<div class="nt-deadline-hint">📍 '+dlLabel+' · '+dlHint+'</div>';
  }
  h+='</div>';

  // Tags
  h+='<div class="nt-field">';
  h+='<div class="nt-label">🏷 Tags</div>';
  h+='<div class="nt-tags-row">';
  d.tags.forEach(function(t){
    h+='<span class="nt-tag-chip">#'+_escHtml(t)+'<button onclick="_nt_removeTag(\''+t.replace(/'/g,"\\'")+'\')">&times;</button></span>';
  });
  h+='<input type="text" class="nt-tag-input" placeholder="+ tag (Entrée)" onkeydown="_nt_handleTagKey(event)" />';
  h+='</div></div>';

  h+='</div>'; // end nt-body

  // Footer
  h+='<div class="task-modal-footer" style="justify-content:space-between">';
  h+='<div style="font-size:11px;color:#9ca3af">⌘↵ pour créer · ⎋ pour fermer</div>';
  h+='<div style="display:flex;gap:8px">';
  h+='<button class="task-modal-close-btn" onclick="_closeNewTacheModal()">Annuler</button>';
  h+='<button class="nt-submit" onclick="creerTache(\''+sid+'\')">Créer la tâche</button>';
  h+='</div></div>';

  h+='</div>';
  return h;
}

// Handlers state mutations ─────────────────────────────────────────────
function _nt_setPriority(p){
  if(!_newTacheDraft)return;
  _newTacheDraft.priority=p;
  _rerenderNewTacheModal();
}
function _nt_setDeadline(d){
  if(!_newTacheDraft)return;
  _newTacheDraft.deadline=d||'';
  _rerenderNewTacheModal();
}
function _nt_removeAssignee(nom){
  if(!_newTacheDraft)return;
  _newTacheDraft.assignees=(_newTacheDraft.assignees||[]).filter(function(n){return n!==nom;});
  _rerenderNewTacheModal();
}
function _nt_toggleAssignee(nom){
  if(!_newTacheDraft)return;
  var cur=_newTacheDraft.assignees||[];
  var i=cur.indexOf(nom);
  if(i>=0)cur.splice(i,1); else cur.push(nom);
  _newTacheDraft.assignees=cur;
  // Fermer le picker
  document.querySelectorAll('#nt-assignee-picker').forEach(function(m){m.remove();});
  _rerenderNewTacheModal();
}
function _nt_openAssigneePicker(ev){
  ev.stopPropagation();
  document.querySelectorAll('#nt-assignee-picker').forEach(function(m){m.remove();});
  if(!_newTacheDraft)return;
  var profiles=_taskProfilesList();
  var menu=document.createElement('div');
  menu.className='task-picker-dropdown';
  menu.id='nt-assignee-picker';
  var cur=_newTacheDraft.assignees||[];
  profiles.forEach(function(p){
    var nom=p.nom;
    var active=cur.indexOf(nom)>=0;
    var safe=nom.replace(/'/g,"\\'");
    menu.innerHTML+='<div class="task-picker-item'+(active?' active':'')+'" onclick="_nt_toggleAssignee(\''+safe+'\')">'+_avatarHtml(nom,22)+'<span style="flex:1">'+_escHtml(nom)+'</span>'+(active?'<span style="color:#16a34a;font-weight:700">✓</span>':'')+'</div>';
  });
  _positionPicker(menu,ev.currentTarget||ev.target);
  document.body.appendChild(menu);
  setTimeout(function(){
    document.addEventListener('click',function h(e){
      if(!menu.contains(e.target)){menu.remove();document.removeEventListener('click',h);}
    });
  },10);
}
function _nt_handleTagKey(e){
  if(e.key==='Enter'){
    e.preventDefault();
    var v=(e.target.value||'').trim().replace(/^#/,'');
    if(!v)return;
    if(!_newTacheDraft.tags)_newTacheDraft.tags=[];
    if(_newTacheDraft.tags.indexOf(v)<0)_newTacheDraft.tags.push(v);
    e.target.value='';
    _rerenderNewTacheModal();
  }
}
function _nt_removeTag(t){
  if(!_newTacheDraft)return;
  _newTacheDraft.tags=(_newTacheDraft.tags||[]).filter(function(x){return x!==t;});
  _rerenderNewTacheModal();
}

async function creerTache(sid){
  // Lire les valeurs live des inputs (titre/desc) + le reste depuis le draft
  var titreEl=document.getElementById('new-tache-titre');
  var descEl=document.getElementById('new-tache-desc');
  var titre=(titreEl&&titreEl.value)||(_newTacheDraft&&_newTacheDraft.titre)||'';
  var desc=(descEl&&descEl.value)||(_newTacheDraft&&_newTacheDraft.desc)||'';
  if(!titre||!titre.trim()){toast('Saisissez un titre');if(titreEl)titreEl.focus();return;}
  var draft=_newTacheDraft||{assignees:[],priority:'P2',tags:[],deadline:''};
  var assignees=(draft.assignees||[]).slice();
  var priority=draft.priority||'P2';
  var tags=(draft.tags||[]).slice();
  var deadline=draft.deadline||'';
  var now=new Date();
  var moi=(S.profile&&S.profile.nom)||'';
  if(!S.todos[sid])S.todos[sid]=[];
  var newTask={
    id:'todo_'+Date.now(),
    titre:titre.trim(),
    description:(desc||'').trim(),
    assignees:assignees,
    responsable:assignees[0]||'',
    priority:priority,
    tags:tags,
    deadline:deadline,
    statut:'todo',
    auteur:moi,
    ts:now.toISOString(),
    comments:[]
  };
  S.todos[sid].push(newTask);
  await saveTodos(sid);
  _closeNewTacheModal();
  var studioName=(S.studios[sid]?S.studios[sid].name:sid);
  var prenomCreator=moi.split(' ')[0]||'Quelqu\'un';
  var dlTxt='';
  if(deadline){
    var _dl=new Date(deadline+'T00:00:00');
    dlTxt=' · échéance '+_dl.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
  }
  // Notifs in-app à chaque assigné (hors créateur)
  var others=assignees.filter(function(n){return n && n!==moi;});
  if(others.length){
    var bodyResp=titre.trim()+dlTxt+(desc?'\n'+desc.trim():'');
    others.forEach(function(nom){
      notifyUserByNom(nom,{type:'statut',studio_id:sid,title:'🎯 '+prenomCreator+' t\'a assigné une tâche — '+studioName,body:bodyResp});
    });
  } else if(!assignees.length){
    notifyAll({type:'statut',studio_id:sid,title:'📌 Nouvelle tâche non assignée — '+studioName,body:titre.trim()+dlTxt});
  }
  // Email — debug mode : on affiche la réponse pour diagnostiquer
  if(assignees.length){
    try{
      sb.functions.invoke('task-notify',{body:{sid:sid,taskId:newTask.id,event:'assigned',actorName:moi}}).then(function(r){
        console.log('[task-notify assigned] response:',r);
        if(r && r.error){
          toast('❌ task-notify: '+(r.error.message||JSON.stringify(r.error)),6000);
        } else if(r && r.data){
          var dbg=r.data.debug||{};
          if(r.data.skipped){
            toast('⚠️ Skipped — '+(r.data.reason||'?')+' | recipients calc: '+JSON.stringify(dbg),8000);
          } else if(r.data.results && r.data.results.length){
            var ok=r.data.results.filter(function(x){return x.messageId;}).length;
            var no=r.data.results.filter(function(x){return x.skipped==='no-email';}).map(function(x){return x.nom;});
            var err=r.data.results.filter(function(x){return x.error;});
            if(ok) toast('✉️ '+ok+' email(s) envoyé(s) — profilesFound='+dbg.profilesFound,5000);
            if(no.length) toast('⚠️ Pas d\'email BDD pour : '+no.join(', ')+' (profilesFound='+dbg.profilesFound+'/'+(dbg.recipients||[]).length+')',9000);
            if(err.length) toast('❌ Resend: '+JSON.stringify(err[0]),9000);
          } else {
            toast('task-notify: '+JSON.stringify(r.data).slice(0,200),7000);
          }
        }
      }).catch(function(e){console.warn('[task-notify]',e);toast('❌ task-notify: '+(e.message||e),5000);});
    }catch(e){console.warn('[task-notify]',e);}
  }
  var toastMsg='Tâche créée';
  if(others.length===1)toastMsg+=' — '+others[0].split(' ')[0]+' a été notifié(e)';
  else if(others.length>1)toastMsg+=' — '+others.length+' personnes notifiées';
  toast(toastMsg,3500);
  render();
}

// Cycle le statut : todo → in_progress → done → todo (blocked géré via le modal)
async function toggleTacheStatut(sid,todoId){
  var todos=S.todos[sid]||[];
  var t=todos.find(function(x){return x.id===todoId;});
  if(!t)return;
  var cur=t.statut||'todo';
  if(cur==='vu'||cur==='doing')cur='in_progress';
  var cycle={todo:'in_progress',in_progress:'done',done:'todo',blocked:'todo'};
  t.statut=cycle[cur]||'todo';
  await saveTodos(sid);
  if(t.statut==='done')notifyAll({type:'statut',studio_id:sid,title:'✓ Tâche terminée — '+(S.studios[sid]?S.studios[sid].name:sid),body:t.titre});
  try{
    var moi=(S.profile&&S.profile.nom)||'';
    sb.functions.invoke('task-notify',{body:{sid:sid,taskId:todoId,event:'status_changed',actorName:moi,extra:{statut:t.statut}}}).catch(function(e){console.warn('[task-notify]',e);});
  }catch(e){}
  render();
  if(document.getElementById('tache-detail-modal'))_rerenderTacheModal(sid,todoId);
}

async function supprimerTache(sid,todoId){
  if(!confirm('Supprimer cette tâche ?'))return;
  var tache=(S.todos[sid]||[]).find(function(t){return t.id===todoId;});
  var titreTache=tache?tache.titre:'';
  S.todos[sid]=(S.todos[sid]||[]).filter(function(t){return t.id!==todoId;});
  await saveTodos(sid);
  if(titreTache){
    await sb.from('notifications').delete().eq('studio_id',sid).eq('type','statut').ilike('body','%'+titreTache.slice(0,60)+'%');
    S.notifications=S.notifications.filter(function(n){return !(n.studio_id===sid&&n.type==='statut'&&n.body&&n.body.indexOf(titreTache.slice(0,60))>=0);});
  }
  closeTacheModal();
  toast('Tâche supprimée');
  render();
}

// ── Modal détail Notion-style ─────────────────────────────────────────────

function openTacheModal(sid,taskId){
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t)return;
  if(!t.assignees)t.assignees=t.responsable?[t.responsable]:[];
  if(!t.comments)t.comments=[];
  if(!t.priority)t.priority='P2';
  var existing=document.getElementById('tache-detail-modal');
  if(existing)existing.remove();
  var overlay=document.createElement('div');
  overlay.id='tache-detail-modal';
  overlay.className='task-modal-overlay';
  overlay.setAttribute('data-sid',sid);
  overlay.setAttribute('data-tid',taskId);
  overlay.onclick=function(e){if(e.target===overlay)closeTacheModal();};
  overlay.innerHTML=_tacheModalInnerHtml(sid,t);
  document.body.appendChild(overlay);
  setTimeout(function(){
    var titleEl=document.getElementById('task-modal-title');
    if(titleEl && !(t.titre||'').trim())titleEl.focus();
  },80);
}

function closeTacheModal(){
  var m=document.getElementById('tache-detail-modal');
  if(m)m.remove();
}

function _rerenderTacheModal(sid,taskId){
  var overlay=document.getElementById('tache-detail-modal');
  if(!overlay)return;
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t){closeTacheModal();return;}
  overlay.innerHTML=_tacheModalInnerHtml(sid,t);
}

function _tacheModalInnerHtml(sid,t){
  var readOnly=isViewer();
  var statusMeta=_getStatusMeta(t.statut||'todo');
  var priorityMeta=_getPriorityMeta(t.priority||'P2');
  var assignees=_getAssignees(t);
  var comments=(t.comments||[]).slice().sort(function(a,b){return (a.ts||'').localeCompare(b.ts||'');});
  var studioName=(S.studios[sid]&&S.studios[sid].name)||sid;
  var moi=(S.profile&&S.profile.nom)||'';
  var today=new Date().toISOString().slice(0,10);
  var overdue=t.deadline && t.deadline<today && t.statut!=='done';

  var h='<div class="task-modal-box" onclick="event.stopPropagation()">';
  h+='<div class="task-modal-topbar">';
  h+='<div style="font-size:11px;color:#9ca3af;font-weight:500">'+_escHtml(studioName)+' · Tâche</div>';
  h+='<button onclick="closeTacheModal()" class="task-modal-close" title="Fermer">&times;</button>';
  h+='</div>';

  h+='<div class="task-modal-scroll">';

  var isDone=(t.statut==='done');
  var isDoing=(t.statut==='in_progress'||t.statut==='doing'||t.statut==='vu');
  var isBlocked=(t.statut==='blocked');
  var cbCls='task-checkbox task-checkbox-lg'+(isDone?' done':'')+(isDoing?' doing':'')+(isBlocked?' blocked':'');
  h+='<div class="task-modal-header">';
  h+='<button class="'+cbCls+'" '+(readOnly?'disabled':'onclick="toggleTacheStatut(\''+sid+'\',\''+t.id+'\')"')+' title="Marquer comme fait"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>';
  h+='<div id="task-modal-title" class="task-modal-title'+(isDone?' done':'')+'" '+(readOnly?'':'contenteditable="true"')+' data-placeholder="Titre de la tâche…" onblur="_updateTacheField(\''+sid+'\',\''+t.id+'\',\'titre\',this.innerText)">'+_escHtml(t.titre||'')+'</div>';
  h+='</div>';

  h+='<div class="task-modal-meta">';

  h+='<div class="task-meta-row"><div class="task-meta-label">Statut</div>';
  h+='<div class="task-meta-value">';
  h+='<button class="task-meta-pill-btn" '+(readOnly?'disabled':'onclick="_toggleTaskStatusMenu(event,\''+sid+'\',\''+t.id+'\')"')+' style="background:'+statusMeta.bg+';color:'+statusMeta.color+'"><span class="task-pill-dot" style="background:'+statusMeta.dot+'"></span>'+statusMeta.label+'</button>';
  h+='</div></div>';

  h+='<div class="task-meta-row"><div class="task-meta-label">Assigné à</div>';
  h+='<div class="task-meta-value"><div class="task-meta-assignees">';
  assignees.forEach(function(nom){
    h+='<span class="task-meta-assignee-chip">'+_avatarHtml(nom,20)+'<span>'+_escHtml(nom)+'</span>'+(readOnly?'':'<button onclick="_toggleAssignee(\''+sid+'\',\''+t.id+'\',\''+nom.replace(/'/g,"\\'")+'\')" title="Retirer">&times;</button>')+'</span>';
  });
  if(!readOnly){
    h+='<button class="task-meta-add-assignee" onclick="_toggleAssigneePicker(event,\''+sid+'\',\''+t.id+'\')">+ Ajouter</button>';
  }
  if(!assignees.length && readOnly){
    h+='<span style="font-size:12px;color:#9ca3af;font-style:italic">Personne</span>';
  }
  h+='</div></div></div>';

  h+='<div class="task-meta-row"><div class="task-meta-label">Priorité</div>';
  h+='<div class="task-meta-value">';
  h+='<button class="task-meta-pill-btn" '+(readOnly?'disabled':'onclick="_toggleTaskPriorityMenu(event,\''+sid+'\',\''+t.id+'\')"')+' style="background:'+priorityMeta.bg+';color:'+priorityMeta.color+'">'+priorityMeta.icon+' '+priorityMeta.label+'</button>';
  h+='</div></div>';

  h+='<div class="task-meta-row"><div class="task-meta-label">Deadline</div>';
  h+='<div class="task-meta-value">';
  if(readOnly){
    h+='<span style="font-size:13px;color:#374151">'+(t.deadline?new Date(t.deadline+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'long',year:'numeric'}):'—')+'</span>';
  } else {
    h+='<input type="date" value="'+(t.deadline||'')+'" onchange="_updateTacheField(\''+sid+'\',\''+t.id+'\',\'deadline\',this.value)" style="padding:6px 10px;border:1px solid #e5e7eb;border-radius:7px;font-size:12px;color:'+(overdue?'#dc2626':'#374151')+';background:'+(overdue?'#fef2f2':'#fff')+';outline:none;font-family:inherit;cursor:pointer" />';
    if(overdue)h+='<span style="font-size:10px;font-weight:600;color:#dc2626;margin-left:6px">⚠ En retard</span>';
  }
  h+='</div></div>';

  h+='<div class="task-meta-row"><div class="task-meta-label">Créée par</div>';
  h+='<div class="task-meta-value"><span style="font-size:12px;color:#6b7280;display:inline-flex;align-items:center;gap:6px">'+_avatarHtml(t.auteur||'?',18)+' '+_escHtml(t.auteur||'—')+' · '+_relTime(t.ts)+'</span></div></div>';

  h+='</div>';

  h+='<div class="task-modal-description">';
  if(readOnly){
    h+='<div style="font-size:13px;color:#374151;white-space:pre-wrap;line-height:1.55">'+(t.description?_escHtml(t.description):'<span style="color:#9ca3af;font-style:italic">Pas de description</span>')+'</div>';
  } else {
    h+='<textarea class="task-modal-description-input" placeholder="Ajoute une description…" oninput="_autosizeTextarea(this)" onblur="_updateTacheField(\''+sid+'\',\''+t.id+'\',\'description\',this.value)">'+_escHtml(t.description||'')+'</textarea>';
  }
  h+='</div>';

  h+='<div class="task-modal-separator"></div>';

  h+='<div class="task-modal-comments">';
  h+='<div class="task-modal-comments-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Commentaires'+(comments.length?' <span style="color:#9ca3af;font-weight:500">('+comments.length+')</span>':'')+'</div>';
  if(!comments.length){
    h+='<div class="task-comments-empty">Aucun commentaire pour le moment.</div>';
  } else {
    comments.forEach(function(c){
      var canDelete=!readOnly && c.auteur===moi;
      h+='<div class="task-comment">';
      h+='<div style="flex-shrink:0">'+_avatarHtml(c.auteur||'?',32)+'</div>';
      h+='<div class="task-comment-body">';
      h+='<div class="task-comment-header"><span class="task-comment-author">'+_escHtml(c.auteur||'—')+'</span><span class="task-comment-time">'+_relTime(c.ts)+'</span>';
      if(canDelete)h+='<button class="task-comment-delete" onclick="_deleteCommentFromTache(\''+sid+'\',\''+t.id+'\',\''+c.id+'\')" title="Supprimer">&times;</button>';
      h+='</div>';
      // V2 : rendu mentions inline + preserve line breaks
      h+='<div class="task-comment-text">'+_renderMentionsHtml(c.body||'').replace(/\n/g,'<br>')+'</div>';
      // V2 : réactions emoji (chips + bouton add)
      h+='<div class="comment-reactions">';
      var rx=c.reactions||{};
      Object.keys(rx).forEach(function(emoji){
        var users=rx[emoji]||[];
        if(!users.length)return;
        var reacted=users.indexOf(moi)>=0;
        var tip=users.join(', ');
        h+='<button class="reaction-chip'+(reacted?' reacted':'')+'" title="'+_escHtml(tip)+'" onclick="event.stopPropagation();_toggleReaction(\''+sid+'\',\''+t.id+'\',\''+c.id+'\',\''+emoji+'\')">'+emoji+' <span class="reaction-count">'+users.length+'</span></button>';
      });
      if(!readOnly){
        h+='<button class="reaction-add-btn" onclick="event.stopPropagation();_openReactionPicker(event,\''+sid+'\',\''+t.id+'\',\''+c.id+'\')">+ Réagir</button>';
      }
      h+='</div>';
      h+='</div></div>';
    });
  }
  if(!readOnly){
    h+='<div class="task-comment-input-wrap">';
    h+='<div style="flex-shrink:0">'+_avatarHtml(moi,32)+'</div>';
    h+='<div style="flex:1;min-width:0">';
    h+='<textarea id="task-new-comment" class="task-comment-input" placeholder="Ajoute un commentaire… @pour mentionner — Cmd+Entrée pour envoyer" oninput="_autosizeTextarea(this);_handleMentionInput(event,\''+sid+'\',\''+t.id+'\')" onkeydown="_handleCommentKeydown(event,\''+sid+'\',\''+t.id+'\')" onblur="setTimeout(_closeMentionPicker,200)"></textarea>';
    h+='<div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="task-comment-submit" onclick="_submitCommentFromModal(\''+sid+'\',\''+t.id+'\')">Commenter</button></div>';
    h+='</div></div>';
  }
  h+='</div>';

  h+='</div>';

  if(!readOnly){
    h+='<div class="task-modal-footer">';
    h+='<button class="task-modal-delete-btn" onclick="supprimerTache(\''+sid+'\',\''+t.id+'\')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Supprimer</button>';
    h+='<button class="task-modal-close-btn" onclick="closeTacheModal()">Fermer</button>';
    h+='</div>';
  }

  h+='</div>';
  return h;
}

// ── CRUD helpers ─────────────────────────────────────────────────────────

async function updateTache(sid,taskId,patch){
  var todos=S.todos[sid]||[];
  var t=todos.find(function(x){return x.id===taskId;});
  if(!t)return;
  Object.keys(patch).forEach(function(k){t[k]=patch[k];});
  if(patch.assignees)t.responsable=patch.assignees[0]||'';
  await saveTodos(sid);
  render();
  if(document.getElementById('tache-detail-modal'))_rerenderTacheModal(sid,taskId);
}

async function _updateTacheField(sid,taskId,field,value){
  var todos=S.todos[sid]||[];
  var t=todos.find(function(x){return x.id===taskId;});
  if(!t)return;
  var trimmed=(typeof value==='string')?value.trim():value;
  if(field==='titre' && !trimmed){toast('Le titre ne peut pas être vide');_rerenderTacheModal(sid,taskId);return;}
  if(t[field]===trimmed)return;
  t[field]=trimmed;
  await saveTodos(sid);
  render();
}

async function addCommentToTache(sid,taskId,body){
  if(!body||!body.trim())return;
  var todos=S.todos[sid]||[];
  var t=todos.find(function(x){return x.id===taskId;});
  if(!t)return;
  if(!t.comments)t.comments=[];
  var moi=(S.profile&&S.profile.nom)||'';
  var trimmed=body.trim();
  // V2 : parse les @mentions à l'écriture (stables)
  var mentions=(typeof _parseMentions==='function')?_parseMentions(trimmed):[];
  var c={id:'cmt_'+Date.now(),auteur:moi,ts:new Date().toISOString(),body:trimmed,mentions:mentions,reactions:{}};
  t.comments.push(c);
  await saveTodos(sid);
  var studioName=(S.studios[sid]&&S.studios[sid].name)||sid;
  // Notifs in-app aux assignés (hors auteur et hors personnes déjà mentionnées)
  var others=_getAssignees(t).filter(function(n){return n && n!==moi && mentions.indexOf(n)<0;});
  if(others.length){
    others.forEach(function(nom){
      notifyUserByNom(nom,{type:'message',studio_id:sid,title:'💬 '+moi.split(' ')[0]+' a commenté — '+studioName,body:t.titre+' : '+trimmed.slice(0,120)});
    });
  }
  // V2 : notifs mentions (in-app + fire-and-forget email via task-notify)
  if(mentions.length){
    mentions.filter(function(n){return n && n!==moi;}).forEach(function(nom){
      notifyUserByNom(nom,{type:'mention',studio_id:sid,title:'@mention — '+t.titre,body:moi.split(' ')[0]+' t\'a mentionné : "'+trimmed.slice(0,120)+'"'});
    });
    try{sb.functions.invoke('task-notify',{body:{sid:sid,taskId:taskId,event:'mentioned',actorName:moi,extra:{body:trimmed,mentions:mentions}}}).catch(function(e){console.warn('[task-notify mention]',e);});}catch(e){}
  }
  // Email classique "commented" pour les assignés (inchangé V1)
  try{sb.functions.invoke('task-notify',{body:{sid:sid,taskId:taskId,event:'commented',actorName:moi,extra:{body:trimmed}}}).catch(function(e){console.warn('[task-notify]',e);});}catch(e){}
  _rerenderTacheModal(sid,taskId);
  render();
}

async function _deleteCommentFromTache(sid,taskId,cmtId){
  if(!confirm('Supprimer ce commentaire ?'))return;
  var todos=S.todos[sid]||[];
  var t=todos.find(function(x){return x.id===taskId;});
  if(!t||!t.comments)return;
  t.comments=t.comments.filter(function(c){return c.id!==cmtId;});
  await saveTodos(sid);
  _rerenderTacheModal(sid,taskId);
  render();
}

function _submitCommentFromModal(sid,taskId){
  var el=document.getElementById('task-new-comment');
  if(!el)return;
  var v=el.value;
  if(!v||!v.trim())return;
  el.value='';
  addCommentToTache(sid,taskId,v);
}

function _handleCommentKeydown(e,sid,taskId){
  if((e.metaKey||e.ctrlKey) && e.key==='Enter'){
    e.preventDefault();
    _submitCommentFromModal(sid,taskId);
  }
}

function _autosizeTextarea(el){
  el.style.height='auto';
  el.style.height=Math.min(el.scrollHeight,400)+'px';
}

// ══════════════════════════════════════════════════════════════════════
// V2 : Mentions @user dans les commentaires
// ══════════════════════════════════════════════════════════════════════

var _mentionInsertPos=-1;   // position dans la textarea où commencer à remplacer (le @)
var _mentionActiveIdx=0;    // index hover/keyboard dans le picker

function _handleMentionInput(ev,sid,taskId){
  var ta=ev.target;
  if(!ta)return;
  var caret=ta.selectionStart;
  var before=ta.value.slice(0,caret);
  // Match un @ en cours de saisie (pas de retour à la ligne, pas plus d'une trentaine de caractères)
  var m=/(^|[\s\n])@([^\s@\n]{0,30})$/.exec(before);
  if(!m){_closeMentionPicker();return;}
  var query=m[2]||'';
  var startPos=caret-query.length-1; // position du @
  _mentionInsertPos=startPos;
  _openMentionPicker(sid,taskId,query,ta);
}

function _openMentionPicker(sid,taskId,query,anchorEl){
  _closeMentionPicker();
  var profiles=(S._allProfiles||[]).filter(function(p){return p&&p.nom;});
  var q=(query||'').toLowerCase().trim();
  var matches=profiles.filter(function(p){
    if(!q)return true;
    return (p.nom||'').toLowerCase().indexOf(q)>=0;
  }).slice(0,6);
  var menu=document.createElement('div');
  menu.className='mention-picker';
  menu.id='mention-picker';
  if(!matches.length){
    menu.innerHTML='<div class="mention-picker-empty">Aucun profil trouvé</div>';
  } else {
    matches.forEach(function(p,i){
      var nom=p.nom||'';
      var avatarUrl=(S.avatarUrls&&S.avatarUrls[nom])||'';
      var initials=nom.split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
      var avatarHtml=avatarUrl
        ?'<img class="mp-avatar" src="'+avatarUrl+'" alt="">'
        :'<div class="mp-avatar-fallback">'+_escHtml(initials)+'</div>';
      var safe=nom.replace(/'/g,"\\'");
      menu.innerHTML+='<div class="mention-picker-item'+(i===0?' active':'')+'" onmousedown="event.preventDefault();_insertMention(\''+safe+'\')">'+avatarHtml+'<div class="mp-name">'+_escHtml(nom)+'</div></div>';
    });
  }
  document.body.appendChild(menu);
  // Positionner sous la textarea
  try{
    var r=anchorEl.getBoundingClientRect();
    var top=r.bottom+window.scrollY+4;
    var left=r.left+window.scrollX;
    // Clamp right
    var mw=menu.offsetWidth||260;
    if(left+mw>window.innerWidth-10)left=window.innerWidth-mw-10;
    menu.style.top=top+'px';
    menu.style.left=left+'px';
  }catch(e){}
  _mentionActiveIdx=0;
}

function _closeMentionPicker(){
  var m=document.getElementById('mention-picker');
  if(m)m.remove();
  _mentionInsertPos=-1;
}

function _insertMention(nom){
  var ta=document.getElementById('task-new-comment');
  if(!ta||_mentionInsertPos<0){_closeMentionPicker();return;}
  var before=ta.value.slice(0,_mentionInsertPos);
  var after=ta.value.slice(ta.selectionStart);
  var insert='@'+nom+' ';
  ta.value=before+insert+after;
  var newCaret=(before+insert).length;
  ta.focus();
  try{ta.setSelectionRange(newCaret,newCaret);}catch(e){}
  _autosizeTextarea(ta);
  _closeMentionPicker();
}

// ══════════════════════════════════════════════════════════════════════
// V2 : Réactions emoji sur commentaires
// ══════════════════════════════════════════════════════════════════════

function _openReactionPicker(ev,sid,taskId,cmtId){
  if(ev&&ev.stopPropagation)ev.stopPropagation();
  _closeAllTaskPickers();
  // Fermer tout reaction-picker déjà ouvert
  document.querySelectorAll('.reaction-picker').forEach(function(m){m.remove();});
  var menu=document.createElement('div');
  menu.className='reaction-picker';
  menu.id='reaction-picker';
  var palette=(typeof TASK_REACTIONS!=='undefined')?TASK_REACTIONS:['👍','❤️','🎉','🚀','👀','😄'];
  palette.forEach(function(e){
    menu.innerHTML+='<button class="reaction-picker-btn" onclick="event.stopPropagation();_toggleReaction(\''+sid+'\',\''+taskId+'\',\''+cmtId+'\',\''+e+'\')">'+e+'</button>';
  });
  document.body.appendChild(menu);
  _positionPicker(menu,ev.currentTarget||ev.target);
  // Outside-click close
  setTimeout(function(){
    document.addEventListener('click',function h(e){
      if(!menu.contains(e.target)){menu.remove();document.removeEventListener('click',h);}
    });
  },10);
}

async function _toggleReaction(sid,taskId,cmtId,emoji){
  var todos=S.todos[sid]||[];
  var t=todos.find(function(x){return x.id===taskId;});
  if(!t||!t.comments)return;
  var c=t.comments.find(function(x){return x.id===cmtId;});
  if(!c)return;
  if(!c.reactions)c.reactions={};
  var moi=(S.profile&&S.profile.nom)||'Moi';
  if(!c.reactions[emoji])c.reactions[emoji]=[];
  var idx=c.reactions[emoji].indexOf(moi);
  var added=false;
  if(idx<0){c.reactions[emoji].push(moi);added=true;}
  else{c.reactions[emoji].splice(idx,1);if(!c.reactions[emoji].length)delete c.reactions[emoji];}
  // Fermer le picker
  document.querySelectorAll('.reaction-picker').forEach(function(m){m.remove();});
  await saveTodos(sid);
  _rerenderTacheModal(sid,taskId);
  // Notif in-app discrète à l'auteur (uniquement sur add, pas sur remove, pas d'email)
  if(added && c.auteur && c.auteur!==moi){
    try{
      notifyUserByNom(c.auteur,{
        type:'reaction',
        studio_id:sid,
        title:emoji+' réaction — '+t.titre,
        body:moi.split(' ')[0]+' a réagi '+emoji+' à : "'+(c.body||'').slice(0,80)+'"'
      });
    }catch(e){}
  }
}

// ── Pickers (status / priority / assignees) ─────────────────────────────

function _toggleTaskStatusMenu(ev,sid,taskId){
  ev.stopPropagation();
  _closeAllTaskPickers();
  var btn=ev.currentTarget;
  var menu=document.createElement('div');
  menu.className='task-picker-dropdown';
  menu.id='task-status-picker';
  ['todo','in_progress','done','blocked'].forEach(function(s){
    var m=_getStatusMeta(s);
    menu.innerHTML+='<div class="task-picker-item" onclick="_setTaskStatus(\''+sid+'\',\''+taskId+'\',\''+s+'\')"><span class="task-pill-dot" style="background:'+m.dot+'"></span>'+m.label+'</div>';
  });
  _positionPicker(menu,btn);
  document.body.appendChild(menu);
  setTimeout(function(){document.addEventListener('click',_closeAllTaskPickers,{once:true});},10);
}

function _toggleTaskPriorityMenu(ev,sid,taskId){
  ev.stopPropagation();
  _closeAllTaskPickers();
  var btn=ev.currentTarget;
  var menu=document.createElement('div');
  menu.className='task-picker-dropdown';
  menu.id='task-priority-picker';
  ['P0','P1','P2','P3'].forEach(function(p){
    var m=_getPriorityMeta(p);
    menu.innerHTML+='<div class="task-picker-item" onclick="_setTaskPriority(\''+sid+'\',\''+taskId+'\',\''+p+'\')"><span style="color:'+m.color+'">'+m.icon+'</span>'+m.label+'</div>';
  });
  _positionPicker(menu,btn);
  document.body.appendChild(menu);
  setTimeout(function(){document.addEventListener('click',_closeAllTaskPickers,{once:true});},10);
}

function _toggleAssigneePicker(ev,sid,taskId){
  ev.stopPropagation();
  _closeAllTaskPickers();
  var btn=ev.currentTarget;
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t)return;
  var current=_getAssignees(t);
  var profiles=_taskProfilesList();
  var menu=document.createElement('div');
  menu.className='task-picker-dropdown';
  menu.id='task-assignee-picker';
  menu.style.minWidth='220px';
  profiles.forEach(function(p){
    var isAssigned=current.indexOf(p.nom)>=0;
    menu.innerHTML+='<div class="task-picker-item'+(isAssigned?' selected':'')+'" onclick="_toggleAssignee(\''+sid+'\',\''+taskId+'\',\''+p.nom.replace(/'/g,"\\'")+'\')">'+_avatarHtml(p.nom,22)+'<span style="flex:1">'+_escHtml(p.nom)+'</span>'+(isAssigned?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':'')+'</div>';
  });
  _positionPicker(menu,btn);
  document.body.appendChild(menu);
  setTimeout(function(){document.addEventListener('click',_closeAllTaskPickers,{once:true});},10);
}

function _positionPicker(menu,anchor){
  var r=anchor.getBoundingClientRect();
  menu.style.position='fixed';
  menu.style.top=(r.bottom+6)+'px';
  menu.style.left=r.left+'px';
  menu.style.zIndex='10100';
}

function _closeAllTaskPickers(){
  ['task-status-picker','task-priority-picker','task-assignee-picker'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.remove();
  });
}

async function _setTaskStatus(sid,taskId,status){
  _closeAllTaskPickers();
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t||t.statut===status)return;
  t.statut=status;
  await saveTodos(sid);
  try{
    var moi=(S.profile&&S.profile.nom)||'';
    sb.functions.invoke('task-notify',{body:{sid:sid,taskId:taskId,event:'status_changed',actorName:moi,extra:{statut:status}}}).catch(function(e){console.warn('[task-notify]',e);});
  }catch(e){}
  render();
  _rerenderTacheModal(sid,taskId);
}

async function _setTaskPriority(sid,taskId,priority){
  _closeAllTaskPickers();
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t||t.priority===priority)return;
  t.priority=priority;
  await saveTodos(sid);
  render();
  _rerenderTacheModal(sid,taskId);
}

async function _toggleAssignee(sid,taskId,nom){
  var t=(S.todos[sid]||[]).find(function(x){return x.id===taskId;});
  if(!t)return;
  if(!t.assignees)t.assignees=t.responsable?[t.responsable]:[];
  var idx=t.assignees.indexOf(nom);
  var wasNew=false;
  if(idx>=0){
    t.assignees.splice(idx,1);
  } else {
    t.assignees.push(nom);
    wasNew=true;
  }
  t.responsable=t.assignees[0]||'';
  await saveTodos(sid);
  if(wasNew){
    var moi=(S.profile&&S.profile.nom)||'';
    if(nom!==moi){
      var studioName=(S.studios[sid]&&S.studios[sid].name)||sid;
      notifyUserByNom(nom,{type:'statut',studio_id:sid,title:'🎯 '+(moi.split(' ')[0]||'Quelqu\'un')+' t\'a assigné une tâche — '+studioName,body:t.titre});
    }
    try{sb.functions.invoke('task-notify',{body:{sid:sid,taskId:taskId,event:'assigned',actorName:moi,extra:{newAssignee:nom}}}).catch(function(e){console.warn('[task-notify]',e);});}catch(e){}
  }
  _closeAllTaskPickers();
  render();
  _rerenderTacheModal(sid,taskId);
}

async function saveTodos(sid){
  await sb.from('studios').upsert({id:sid+'_todos',data:{todos:S.todos[sid]||[]},updated_at:new Date().toISOString()});
}

var MAP_FILTERS=[
  {id:'default',  label:'Vue générale',    icon:'🗺️', q:null},
  {id:'commerces',label:'Commerces',       icon:'🛍️', q:'commerces restaurants cafés boutiques'},
  {id:'bureaux',  label:'Bureaux & Orgs',  icon:'🏢', q:'bureaux coworking entreprises organisations entreprise'},
  {id:'transports',label:'Transports',     icon:'🚇', q:'métro bus RER station tramway transport'},
  {id:'pilates',  label:'Pilates & Fitness',icon:'🏋️',q:'pilates reformer fitness salle de sport'},
];

function setMapFilter(f){S.mapFilter=f;render();}
function setMapZoom(delta){S.mapZoom=Math.min(19,Math.max(10,S.mapZoom+delta));render();}
async function toggleStreetView(){
  S.mapStreetView=!S.mapStreetView;
  // Si on passe en Street View, utiliser STUDIO_COORDS en priorité puis Nominatim
  if(S.mapStreetView&&S.selectedId&&!S.mapCoords[S.selectedId]){
    var sid=S.selectedId;
    if(STUDIO_COORDS[sid]){
      S.mapCoords[sid]={lat:STUDIO_COORDS[sid].lat,lon:STUDIO_COORDS[sid].lon};
    } else {
      var addr=S.studios[sid]&&S.studios[sid].addr;
      if(addr){
        try{
          var res=await fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(addr)+'&limit=1');
          var data=await res.json();
          if(data&&data[0])S.mapCoords[sid]={lat:parseFloat(data[0].lat),lon:parseFloat(data[0].lon)};
        }catch(e){}
      }
    }
  }
  render();
}

async function updateStudioAddr(sid,newAddr){
  if(!newAddr||!newAddr.trim()){toast('Adresse vide');return;}
  S.studios[sid].addr=newAddr.trim();
  delete S.mapCoords[sid]; // force re-géocodage
  // Vider cache INSEE
  if(typeof _inseePopCache!=='undefined')Object.keys(_inseePopCache).forEach(function(k){if(k.startsWith(sid+'_'))delete _inseePopCache[k];});
  S._editAddr=false;S._editAddrVal=null;
  await saveStudio(sid,S.studios[sid]);
  toast('Adresse mise à jour — relocalisation en cours');
  render();
}

// ─── Onglet Local : plan masse du site ────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════
// ── PAGE: Collab — Tâches & Discussions consolidés cross-studio ─────────────
// ═══════════════════════════════════════════════════════════════════════════
// Philosophie : un seul endroit pour voir l'ensemble des tâches et discussions
// de tous les studios, avec filtres puissants. Click → navigation vers le
// studio concerné. Reuse total des modals/helpers existants.
// ═══════════════════════════════════════════════════════════════════════════

// État de filtres module-level (pas sérialisé dans S pour éviter les renders
// parasites du realtime — persistance localStorage par user)
var _collabFilters=null;
function _loadCollabFilters(){
  if(_collabFilters)return _collabFilters;
  var def={tab:'tasks',view:'liste',studio:'all',assignee:'all',statut:'active',priority:'all',search:'',sort:'deadline',topicState:'open'};
  try{
    var raw=localStorage.getItem('isseo_collab_filters');
    if(raw){_collabFilters=Object.assign(def,JSON.parse(raw));return _collabFilters;}
  }catch(e){}
  _collabFilters=def;return _collabFilters;
}
function _saveCollabFilters(){
  try{localStorage.setItem('isseo_collab_filters',JSON.stringify(_collabFilters));}catch(e){}
}
function setCollabFilter(k,v){
  _loadCollabFilters();
  _collabFilters[k]=v;
  _saveCollabFilters();
  render();
}
function resetCollabFilters(){
  _collabFilters=null;
  try{localStorage.removeItem('isseo_collab_filters');}catch(e){}
  render();
}

// Collecte toutes les tâches de tous les studios accessibles, enrichies
// avec le contexte studio (studioId, studioName) pour le rendu cross-studio
function _collectAllTasks(){
  var out=[];
  var allIds=_getStudioIds();
  allIds.forEach(function(sid){
    var s=S.studios[sid];if(!s)return;
    (S.todos[sid]||[]).forEach(function(t){
      if(!t||!t.id)return;
      out.push({sid:sid,studioName:s.name||sid,task:t});
    });
  });
  return out;
}

// Applique les filtres courants sur la collecte globale des tâches
function _applyCollabTaskFilters(items){
  var f=_loadCollabFilters();
  var myName=(S.profile&&S.profile.nom)||'';
  var today=new Date().toISOString().slice(0,10);
  var q=(f.search||'').toLowerCase().trim();
  return items.filter(function(x){
    var t=x.task;
    // Studio
    if(f.studio!=='all'&&x.sid!==f.studio)return false;
    // Statut
    if(f.statut==='active'&&t.statut==='done')return false;
    if(f.statut==='done'&&t.statut!=='done')return false;
    if(f.statut==='late'){
      if(t.statut==='done')return false;
      if(!t.deadline||t.deadline>=today)return false;
    }
    if(f.statut==='todo'&&t.statut!=='todo')return false;
    if(f.statut==='doing'&&!(t.statut==='in_progress'||t.statut==='doing'||t.statut==='vu'))return false;
    if(f.statut==='blocked'&&t.statut!=='blocked')return false;
    // Assignee
    if(f.assignee==='me'){
      var assignees=_getAssignees(t);
      if(assignees.indexOf(myName)<0)return false;
    }else if(f.assignee!=='all'){
      var a2=_getAssignees(t);
      if(a2.indexOf(f.assignee)<0)return false;
    }
    // Priorité
    if(f.priority!=='all'&&t.priority!==f.priority)return false;
    // Recherche
    if(q){
      var hay=((t.titre||'')+' '+(t.description||'')+' '+(t.tags||[]).join(' ')+' '+x.studioName).toLowerCase();
      if(hay.indexOf(q)<0)return false;
    }
    return true;
  });
}

// Tri : deadline asc, puis priorité desc, puis récents
function _sortCollabTasks(items){
  var f=_loadCollabFilters();
  var priorityRank={P1:0,P2:1,P3:2,P4:3};
  return items.slice().sort(function(a,b){
    var ta=a.task,tb=b.task;
    if(f.sort==='priority'){
      var pa=priorityRank[ta.priority]!=null?priorityRank[ta.priority]:4;
      var pb=priorityRank[tb.priority]!=null?priorityRank[tb.priority]:4;
      if(pa!==pb)return pa-pb;
    }
    if(f.sort==='recent'){
      return (tb.ts||'').localeCompare(ta.ts||'');
    }
    // Par défaut : deadline asc (sans deadline à la fin)
    if(ta.deadline&&tb.deadline&&ta.deadline!==tb.deadline)return ta.deadline.localeCompare(tb.deadline);
    if(ta.deadline&&!tb.deadline)return -1;
    if(!ta.deadline&&tb.deadline)return 1;
    return (tb.ts||'').localeCompare(ta.ts||'');
  });
}

// Collecte toutes les discussions (topics) avec contexte studio
function _collectAllTopics(){
  var out=[];
  var allIds=_getStudioIds();
  allIds.forEach(function(sid){
    var s=S.studios[sid];if(!s)return;
    (S.topics[sid]||[]).forEach(function(t){
      if(!t||!t.id)return;
      out.push({sid:sid,studioName:s.name||sid,topic:t});
    });
  });
  return out;
}
function _applyCollabTopicFilters(items){
  var f=_loadCollabFilters();
  var q=(f.search||'').toLowerCase().trim();
  return items.filter(function(x){
    if(f.studio!=='all'&&x.sid!==f.studio)return false;
    if(f.topicState==='open'&&x.topic.closed)return false;
    if(f.topicState==='closed'&&!x.topic.closed)return false;
    if(q){
      var lastMsgText='';
      if(x.topic.messages&&x.topic.messages.length){
        var lm=x.topic.messages[x.topic.messages.length-1];
        lastMsgText=lm.texte||lm.text||'';
      }
      var hay=((x.topic.titre||'')+' '+(x.topic.auteur||'')+' '+lastMsgText+' '+x.studioName).toLowerCase();
      if(hay.indexOf(q)<0)return false;
    }
    return true;
  });
}
function _sortCollabTopics(items){
  return items.slice().sort(function(a,b){
    // Ouverts d'abord, puis par dernier message desc
    if(a.topic.closed!==b.topic.closed)return a.topic.closed?1:-1;
    var aLast=a.topic.messages&&a.topic.messages.length?a.topic.messages[a.topic.messages.length-1].ts:a.topic.ts;
    var bLast=b.topic.messages&&b.topic.messages.length?b.topic.messages[b.topic.messages.length-1].ts:b.topic.ts;
    return (bLast||'').localeCompare(aLast||'');
  });
}

// Compte les tâches de chaque studio pour la liste déroulante
function _collabStudioCounts(){
  var out={};
  _getStudioIds().forEach(function(sid){
    var all=S.todos[sid]||[];
    out[sid]=all.filter(function(t){return t.statut!=='done';}).length;
  });
  return out;
}

// ── Rendu principal ────────────────────────────────────────────────────────
function renderCollab(){
  var f=_loadCollabFilters();
  var dm=S.darkMode;
  var myName=(S.profile&&S.profile.nom)||'';
  var today=new Date().toISOString().slice(0,10);

  // Stats globales (indépendantes des filtres, vue d'ensemble)
  var allTasks=_collectAllTasks();
  var totalActive=allTasks.filter(function(x){return x.task.statut!=='done';}).length;
  var totalMine=allTasks.filter(function(x){
    if(x.task.statut==='done')return false;
    return _getAssignees(x.task).indexOf(myName)>=0;
  }).length;
  var totalLate=allTasks.filter(function(x){
    return x.task.statut!=='done'&&x.task.deadline&&x.task.deadline<today;
  }).length;
  var totalDoneWeek=allTasks.filter(function(x){
    if(x.task.statut!=='done')return false;
    if(!x.task.ts)return false;
    var ageDays=(Date.now()-new Date(x.task.ts).getTime())/(86400000);
    return ageDays>=0&&ageDays<=7;
  }).length;
  var topicsAll=_collectAllTopics();
  var topicsOpen=topicsAll.filter(function(x){return !x.topic.closed;}).length;

  var h='<div class="collab-page">';

  // ═══ Bandeau hero ═══
  h+='<div class="collab-hero">';
  h+='<div class="collab-hero-inner">';
  h+='<div class="collab-hero-head">';
  h+='<div class="collab-hero-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>';
  h+='<div><div class="collab-hero-title">Collab — Tâches & Discussions</div><div class="collab-hero-sub">Toutes les tâches et discussions de tes studios, en un seul endroit</div></div>';
  h+='</div>';
  // KPI cards
  h+='<div class="collab-kpis">';
  h+=_collabKpiCard('Tâches actives',totalActive,'#3B6FB6','📋');
  h+=_collabKpiCard('Mes tâches',totalMine,'#7C3AED','👤');
  h+=_collabKpiCard('En retard',totalLate,totalLate>0?'#DC2626':'#94A3B8','⚠');
  h+=_collabKpiCard('Discussions ouvertes',topicsOpen,'#0E7490','💬');
  h+='</div>';
  h+='</div></div>';

  // ═══ Segment control : Tâches / Discussions ═══
  h+='<div class="collab-segment">';
  h+='<button class="collab-seg-btn'+(f.tab==='tasks'?' active':'')+'" onclick="setCollabFilter(\'tab\',\'tasks\')">';
  h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
  h+='<span>Tâches</span>';
  h+='<span class="collab-seg-count">'+totalActive+'</span>';
  h+='</button>';
  h+='<button class="collab-seg-btn'+(f.tab==='discussions'?' active':'')+'" onclick="setCollabFilter(\'tab\',\'discussions\')">';
  h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  h+='<span>Discussions</span>';
  h+='<span class="collab-seg-count">'+topicsOpen+'</span>';
  h+='</button>';
  h+='</div>';

  // ═══ Barre de filtres ═══
  h+=_collabFiltersBar(f);

  // ═══ Contenu selon onglet ═══
  if(f.tab==='tasks'){
    h+=_collabTasksContent(allTasks,f);
  }else{
    h+=_collabTopicsContent(topicsAll,f);
  }

  h+='</div>';
  return h;
}

// KPI mini-card (sur fond hero navy)
function _collabKpiCard(label,value,accent,emoji){
  var h='<div class="collab-kpi">';
  h+='<div class="collab-kpi-top"><span class="collab-kpi-emoji">'+emoji+'</span><span class="collab-kpi-label">'+label+'</span></div>';
  h+='<div class="collab-kpi-value" style="color:'+accent+'">'+value+'</div>';
  h+='</div>';
  return h;
}

// Barre de filtres : studio, assignee, statut, priorité, recherche, tri, vue
function _collabFiltersBar(f){
  var h='<div class="collab-filters">';

  // Studio select — avec compteur entre parenthèses
  var counts=_collabStudioCounts();
  h+='<select class="collab-filter-select" onchange="setCollabFilter(\'studio\',this.value)">';
  h+='<option value="all"'+(f.studio==='all'?' selected':'')+'>Tous les studios</option>';
  _getStudioIds().forEach(function(sid){
    var s=S.studios[sid];if(!s)return;
    var c=counts[sid]||0;
    h+='<option value="'+sid+'"'+(f.studio===sid?' selected':'')+'>'+_escHtml(s.name||sid)+(c>0?' ('+c+')':'')+'</option>';
  });
  h+='</select>';

  if(f.tab==='tasks'){
    // Assignee
    h+='<select class="collab-filter-select" onchange="setCollabFilter(\'assignee\',this.value)">';
    h+='<option value="all"'+(f.assignee==='all'?' selected':'')+'>👥 Tous assignés</option>';
    h+='<option value="me"'+(f.assignee==='me'?' selected':'')+'>⭐ Moi uniquement</option>';
    // Liste déduite de tous les assignés visibles
    var seen={};
    _collectAllTasks().forEach(function(x){
      _getAssignees(x.task).forEach(function(n){if(n)seen[n]=true;});
    });
    Object.keys(seen).sort().forEach(function(n){
      h+='<option value="'+_escHtml(n)+'"'+(f.assignee===n?' selected':'')+'>'+_escHtml(n)+'</option>';
    });
    h+='</select>';

    // Statut
    h+='<select class="collab-filter-select" onchange="setCollabFilter(\'statut\',this.value)">';
    var statuts=[['active','⚡ En cours'],['late','⚠ En retard'],['todo','○ À faire'],['doing','▶ Actives'],['blocked','⛔ Bloquées'],['done','✓ Terminées'],['all','Tous statuts']];
    statuts.forEach(function(s){h+='<option value="'+s[0]+'"'+(f.statut===s[0]?' selected':'')+'>'+s[1]+'</option>';});
    h+='</select>';

    // Priorité
    h+='<select class="collab-filter-select" onchange="setCollabFilter(\'priority\',this.value)">';
    h+='<option value="all"'+(f.priority==='all'?' selected':'')+'>Toutes priorités</option>';
    ['P1','P2','P3','P4'].forEach(function(p){
      var m=typeof _getPriorityMeta==='function'?_getPriorityMeta(p):{label:p};
      h+='<option value="'+p+'"'+(f.priority===p?' selected':'')+'>'+(m.icon||'')+' '+m.label+'</option>';
    });
    h+='</select>';

    // Tri
    h+='<select class="collab-filter-select" onchange="setCollabFilter(\'sort\',this.value)">';
    h+='<option value="deadline"'+(f.sort==='deadline'?' selected':'')+'>Tri : Deadline</option>';
    h+='<option value="priority"'+(f.sort==='priority'?' selected':'')+'>Tri : Priorité</option>';
    h+='<option value="recent"'+(f.sort==='recent'?' selected':'')+'>Tri : Récent</option>';
    h+='</select>';
  }else{
    // Discussions : état
    h+='<select class="collab-filter-select" onchange="setCollabFilter(\'topicState\',this.value)">';
    h+='<option value="open"'+(f.topicState==='open'?' selected':'')+'>💬 Ouvertes</option>';
    h+='<option value="closed"'+(f.topicState==='closed'?' selected':'')+'>✕ Clôturées</option>';
    h+='<option value="all"'+(f.topicState==='all'?' selected':'')+'>Toutes</option>';
    h+='</select>';
  }

  // Recherche
  h+='<div class="collab-search">';
  h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  h+='<input type="text" placeholder="Rechercher…" value="'+_escHtml(f.search||'')+'" oninput="setCollabFilter(\'search\',this.value)">';
  h+='</div>';

  // Toggle Liste/Kanban (tâches seulement)
  if(f.tab==='tasks'){
    h+='<div class="collab-view-toggle">';
    h+='<button class="collab-view-btn'+(f.view==='liste'?' active':'')+'" onclick="setCollabFilter(\'view\',\'liste\')" title="Vue liste"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/></svg></button>';
    h+='<button class="collab-view-btn'+(f.view==='kanban'?' active':'')+'" onclick="setCollabFilter(\'view\',\'kanban\')" title="Vue kanban"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="10"/></svg></button>';
    h+='</div>';
  }

  h+='</div>';
  return h;
}

// ── Rendu onglet Tâches ────────────────────────────────────────────────────
function _collabTasksContent(allTasks,f){
  var filtered=_sortCollabTasks(_applyCollabTaskFilters(allTasks));
  if(!filtered.length){
    return _collabEmptyState('Aucune tâche ne correspond aux filtres',
      'Essaie d\'élargir les critères, ou supprime les filtres actifs.',
      '<button class="collab-empty-btn" onclick="resetCollabFilters()">🔄 Réinitialiser les filtres</button>');
  }

  if(f.view==='kanban'){
    return _collabRenderKanban(filtered);
  }
  return _collabRenderListe(filtered);
}

// Vue liste : lignes plates, responsive, avec studio badge
function _collabRenderListe(items){
  var today=new Date().toISOString().slice(0,10);
  var h='<div class="collab-list">';
  h+='<div class="collab-list-head">';
  h+='<div class="collab-col-studio">Studio</div>';
  h+='<div class="collab-col-title">Tâche</div>';
  h+='<div class="collab-col-assignees">Assignés</div>';
  h+='<div class="collab-col-status">Statut</div>';
  h+='<div class="collab-col-priority">Prio</div>';
  h+='<div class="collab-col-deadline">Deadline</div>';
  h+='</div>';
  items.forEach(function(x){
    var t=x.task;var sid=x.sid;
    var statusMeta=_getStatusMeta(t.statut||'todo');
    var priorityMeta=t.priority?_getPriorityMeta(t.priority):null;
    var assignees=_getAssignees(t);
    var overdue=t.deadline&&t.deadline<today&&t.statut!=='done';
    var soon=t.deadline&&!overdue&&t.statut!=='done'&&t.deadline<=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
    var dlLabel='';
    if(t.deadline){
      var dl=new Date(t.deadline+'T00:00:00');
      dlLabel=dl.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    }
    h+='<div class="collab-list-row'+(t.statut==='done'?' done':'')+'" onclick="openTacheModal(\''+sid+'\',\''+t.id+'\')">';
    // Studio pill (couleur stable par sid)
    h+='<div class="collab-col-studio"><span class="collab-studio-pill" style="background:'+_collabStudioColor(sid)+'22;color:'+_collabStudioColor(sid)+'">'+_escHtml(x.studioName)+'</span></div>';
    // Titre + description tronquée
    h+='<div class="collab-col-title">';
    h+='<div class="collab-task-title">'+_escHtml(t.titre||'(sans titre)')+'</div>';
    if(t.description){
      h+='<div class="collab-task-desc">'+_escHtml((t.description||'').slice(0,140))+'</div>';
    }
    h+='</div>';
    // Assignés (avatar stack)
    h+='<div class="collab-col-assignees">';
    if(assignees.length){h+=_avatarStackHtml(assignees,24);}
    else{h+='<span class="collab-none">—</span>';}
    h+='</div>';
    // Statut
    h+='<div class="collab-col-status"><span class="task-pill task-pill-status" style="background:'+statusMeta.bg+';color:'+statusMeta.color+'">'+statusMeta.label+'</span></div>';
    // Priorité
    h+='<div class="collab-col-priority">';
    if(priorityMeta)h+='<span class="task-pill task-pill-priority" style="background:'+priorityMeta.bg+';color:'+priorityMeta.color+'">'+priorityMeta.icon+'</span>';
    else h+='<span class="collab-none">—</span>';
    h+='</div>';
    // Deadline
    h+='<div class="collab-col-deadline">';
    if(dlLabel){
      var dlCls='collab-deadline'+(overdue?' overdue':(soon?' soon':''));
      h+='<span class="'+dlCls+'">'+(overdue?'⚠ ':'')+dlLabel+'</span>';
    }else{
      h+='<span class="collab-none">Sans date</span>';
    }
    h+='</div>';
    h+='</div>';
  });
  h+='</div>';
  return h;
}

// Vue Kanban cross-studio : 4 colonnes par statut
function _collabRenderKanban(items){
  var cols=[
    {key:'todo',label:'À faire',match:function(s){return s==='todo';},accent:'#94A3B8'},
    {key:'in_progress',label:'En cours',match:function(s){return s==='in_progress'||s==='doing'||s==='vu';},accent:'#3B6FB6'},
    {key:'done',label:'Terminées',match:function(s){return s==='done';},accent:'#10B981'},
    {key:'blocked',label:'Bloquées',match:function(s){return s==='blocked';},accent:'#DC2626'}
  ];
  var h='<div class="collab-kanban">';
  cols.forEach(function(col){
    var cards=items.filter(function(x){return col.match(x.task.statut||'todo');});
    h+='<div class="collab-kanban-col">';
    h+='<div class="collab-kanban-head" style="border-top-color:'+col.accent+'">';
    h+='<span class="collab-kanban-dot" style="background:'+col.accent+'"></span>';
    h+='<span class="collab-kanban-label">'+col.label+'</span>';
    h+='<span class="collab-kanban-count">'+cards.length+'</span>';
    h+='</div>';
    h+='<div class="collab-kanban-body">';
    if(!cards.length){
      h+='<div class="collab-kanban-empty">Vide</div>';
    }else{
      cards.forEach(function(x){
        h+=_collabKanbanCard(x);
      });
    }
    h+='</div></div>';
  });
  h+='</div>';
  return h;
}

function _collabKanbanCard(x){
  var t=x.task;var sid=x.sid;
  var today=new Date().toISOString().slice(0,10);
  var overdue=t.deadline&&t.deadline<today&&t.statut!=='done';
  var assignees=_getAssignees(t);
  var priorityMeta=t.priority?_getPriorityMeta(t.priority):null;
  var h='<div class="collab-kcard" onclick="openTacheModal(\''+sid+'\',\''+t.id+'\')">';
  // Studio pill
  h+='<div class="collab-kcard-studio"><span class="collab-studio-pill" style="background:'+_collabStudioColor(sid)+'22;color:'+_collabStudioColor(sid)+'">'+_escHtml(x.studioName)+'</span>';
  if(priorityMeta)h+='<span class="task-pill task-pill-priority" style="background:'+priorityMeta.bg+';color:'+priorityMeta.color+'">'+priorityMeta.icon+'</span>';
  h+='</div>';
  // Titre
  h+='<div class="collab-kcard-title">'+_escHtml(t.titre||'(sans titre)')+'</div>';
  // Meta footer : assignees + deadline
  h+='<div class="collab-kcard-foot">';
  if(assignees.length)h+='<div class="collab-kcard-assignees">'+_avatarStackHtml(assignees,22)+'</div>';
  else h+='<div></div>';
  if(t.deadline){
    var dl=new Date(t.deadline+'T00:00:00');
    var lbl=dl.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    h+='<span class="collab-kcard-deadline'+(overdue?' overdue':'')+'">'+(overdue?'⚠ ':'📅 ')+lbl+'</span>';
  }
  // Commentaires
  if(t.comments&&t.comments.length){
    h+='<span class="collab-kcard-comments"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+t.comments.length+'</span>';
  }
  h+='</div>';
  h+='</div>';
  return h;
}

// ── Rendu onglet Discussions ───────────────────────────────────────────────
function _collabTopicsContent(allTopics,f){
  var filtered=_sortCollabTopics(_applyCollabTopicFilters(allTopics));
  if(!filtered.length){
    return _collabEmptyState('Aucune discussion à afficher',
      'Ouvre une discussion depuis un studio pour collaborer avec l\'équipe.',
      '');
  }
  var h='<div class="collab-topics">';
  filtered.forEach(function(x){
    var t=x.topic;
    var msgCount=t.messages?t.messages.length:0;
    var lastMsg=msgCount?t.messages[msgCount-1]:null;
    var lastDate=lastMsg?(lastMsg.date||lastMsg.ts||''):(t.date||t.ts||'');
    var lastTxt=lastMsg?(lastMsg.texte||lastMsg.text||''):'';
    h+='<div class="collab-topic-row'+(t.closed?' closed':'')+'" onclick="_collabOpenTopic(\''+x.sid+'\',\''+t.id+'\')">';
    h+='<div class="collab-topic-main">';
    h+='<div class="collab-topic-head">';
    h+='<span class="collab-studio-pill" style="background:'+_collabStudioColor(x.sid)+'22;color:'+_collabStudioColor(x.sid)+'">'+_escHtml(x.studioName)+'</span>';
    if(t.closed)h+='<span class="collab-topic-closed">Clôturé</span>';
    h+='<span class="collab-topic-title">'+_escHtml(t.titre||'(sans titre)')+'</span>';
    h+='</div>';
    if(lastTxt){
      h+='<div class="collab-topic-preview"><strong>'+_escHtml(lastMsg.auteur||'')+'</strong> : '+_escHtml((lastTxt||'').slice(0,160))+'</div>';
    }
    h+='<div class="collab-topic-meta">';
    h+='<span>par '+_escHtml(t.auteur||'')+'</span>';
    h+='<span>·</span>';
    h+='<span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> '+msgCount+' message'+(msgCount>1?'s':'')+'</span>';
    if(lastDate){h+='<span>·</span><span>'+_escHtml(lastDate)+'</span>';}
    h+='</div>';
    h+='</div>';
    h+='<div class="collab-topic-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>';
    h+='</div>';
  });
  h+='</div>';
  return h;
}

// Ouvre la discussion directement dans le studio cible, sur l'onglet échanges
function _collabOpenTopic(sid,topicId){
  if(typeof openDetail==='function'){
    openDetail(sid);
    setTimeout(function(){
      S.detailTab='echanges';
      S.openTopicId=topicId;
      render();
    },50);
  }
}

// État vide ré-utilisable
function _collabEmptyState(title,sub,cta){
  var h='<div class="collab-empty">';
  h+='<div class="collab-empty-icon"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>';
  h+='<div class="collab-empty-title">'+title+'</div>';
  h+='<div class="collab-empty-sub">'+sub+'</div>';
  if(cta)h+=cta;
  h+='</div>';
  return h;
}

// Couleur stable par studio (hash simple de l'id) — 8 couleurs palette
function _collabStudioColor(sid){
  var palette=['#3B6FB6','#0F6E56','#7C3AED','#854F0B','#DC2626','#0E7490','#92630a','#BE185D'];
  var sum=0;for(var i=0;i<sid.length;i++)sum+=sid.charCodeAt(i);
  return palette[sum%palette.length];
}

