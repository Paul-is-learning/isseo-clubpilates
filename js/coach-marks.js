// ════════════════════════════════════════════════════════════════════════════
// ── Coach Marks — tuto contextuel Apple-like par page (mobile + web) ──
// ════════════════════════════════════════════════════════════════════════════
// Bouton FAB play en bas à gauche → lance un tuto contextuel de la page
// courante. Spotlight sur les éléments clés, tooltips didactiques positionnés
// intelligemment, navigation clavier + tactile, haptic. iOS-safe.

(function(){
  'use strict';

  // ── Styles injectés une fois ──────────────────────────────────────────
  function _ensureStyles(){
    if(document.getElementById('cm-styles'))return;
    var css=''
      // ── FAB bouton "Guide" ──
      +'.cm-fab{position:fixed;left:max(18px,env(safe-area-inset-left));bottom:max(22px,env(safe-area-inset-bottom));z-index:8500;width:52px;height:52px;border-radius:50%;border:none;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 28px -8px rgba(79,70,229,.55),0 4px 12px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.2);transition:transform .2s cubic-bezier(.34,1.56,.52,1),box-shadow .2s;animation:cmFabIn .5s cubic-bezier(.34,1.56,.52,1) .4s both}'
      +'.cm-fab:hover{transform:translateY(-2px) scale(1.05);box-shadow:0 14px 36px -8px rgba(79,70,229,.65),0 6px 16px rgba(0,0,0,.2)}'
      +'.cm-fab:active{transform:scale(.94)}'
      +'.cm-fab svg{width:22px;height:22px;margin-left:2px}'
      +'.cm-fab::before{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px solid rgba(99,102,241,.45);animation:cmFabPulse 2.5s ease-out infinite;pointer-events:none}'
      +'.cm-fab-label{position:absolute;left:60px;background:#0f1f3d;color:#fff;padding:7px 12px;border-radius:10px;font:600 12px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:.2px;white-space:nowrap;opacity:0;pointer-events:none;transform:translateX(-6px);transition:opacity .2s,transform .2s}'
      +'.cm-fab-label::before{content:"";position:absolute;left:-5px;top:50%;transform:translateY(-50%);border:5px solid transparent;border-right-color:#0f1f3d}'
      +'.cm-fab:hover .cm-fab-label{opacity:1;transform:translateX(0)}'
      +'@keyframes cmFabIn{from{opacity:0;transform:translateY(12px) scale(.8)}to{opacity:1;transform:translateY(0) scale(1)}}'
      +'@keyframes cmFabPulse{0%{transform:scale(1);opacity:.6}70%,100%{transform:scale(1.35);opacity:0}}'
      +'body.dark .cm-fab{background:linear-gradient(135deg,#7c7ff3,#6366f1)}'
      +'body.dark .cm-fab-label{background:#21262d}'
      +'body.dark .cm-fab-label::before{border-right-color:#21262d}'
      // Masque : FAB invisible quand coach actif (évite chevauchement)
      +'body.cm-active .cm-fab{opacity:0;pointer-events:none;transform:scale(.8)}'
      // Sur mobile — dessus du bottom-tab-bar si présent
      +'@media(max-width:768px){.cm-fab{width:48px;height:48px;bottom:calc(74px + env(safe-area-inset-bottom));left:14px}.cm-fab svg{width:20px;height:20px}.cm-fab-label{display:none}}'
      // ── Overlay + spotlight SVG ──
      +'.cm-overlay{position:fixed;inset:0;height:100vh;height:100dvh;z-index:9500;pointer-events:auto;animation:cmFade .3s cubic-bezier(.2,.8,.2,1)}'
      +'@keyframes cmFade{from{opacity:0}to{opacity:1}}'
      +'.cm-overlay svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}'
      +'.cm-overlay-dim{position:absolute;inset:0;background:rgba(10,14,28,.72);backdrop-filter:blur(2px) saturate(1.1);-webkit-backdrop-filter:blur(2px) saturate(1.1);transition:clip-path .55s cubic-bezier(.22,.96,.36,1);will-change:clip-path}'
      +'.cm-halo{position:absolute;border-radius:14px;pointer-events:none;box-shadow:0 0 0 2px rgba(255,255,255,.85),0 0 0 6px rgba(99,102,241,.25),0 0 36px rgba(99,102,241,.55);transition:all .55s cubic-bezier(.22,.96,.36,1);will-change:top,left,width,height,border-radius;z-index:9510}'
      +'.cm-halo::before{content:"";position:absolute;inset:-6px;border-radius:inherit;border:2px solid rgba(255,255,255,.65);animation:cmHaloPulse 2s ease-in-out infinite;pointer-events:none}'
      +'@keyframes cmHaloPulse{0%,100%{transform:scale(1);opacity:.45}50%{transform:scale(1.06);opacity:0}}'
      // ── Tooltip ──
      +'.cm-tooltip{position:fixed;z-index:9520;width:min(340px,calc(100vw - 32px));background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,250,255,.96));border-radius:18px;box-shadow:0 20px 48px -12px rgba(10,14,28,.55),0 0 0 1px rgba(255,255,255,.65) inset,0 0 0 .5px rgba(10,14,28,.08);padding:18px 18px 12px;pointer-events:auto;transition:top .45s cubic-bezier(.22,.96,.36,1),left .45s cubic-bezier(.22,.96,.36,1),opacity .25s;animation:cmTipIn .5s cubic-bezier(.34,1.56,.52,1);will-change:top,left}'
      +'body.dark .cm-tooltip{background:linear-gradient(180deg,#1c2433,#151b28);box-shadow:0 20px 48px -12px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.08) inset}'
      +'@keyframes cmTipIn{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}'
      +'.cm-tip-arrow{position:absolute;width:14px;height:14px;background:inherit;transform:rotate(45deg);box-shadow:0 0 0 .5px rgba(10,14,28,.08)}'
      +'body.dark .cm-tip-arrow{box-shadow:0 0 0 1px rgba(255,255,255,.08)}'
      +'.cm-tip-arrow.top{top:-7px;left:50%;margin-left:-7px;border-radius:3px 0 0 0}'
      +'.cm-tip-arrow.bottom{bottom:-7px;left:50%;margin-left:-7px;border-radius:0 0 3px 0}'
      +'.cm-tip-arrow.left{left:-7px;top:50%;margin-top:-7px;border-radius:3px 0 0 3px}'
      +'.cm-tip-arrow.right{right:-7px;top:50%;margin-top:-7px;border-radius:0 3px 3px 0}'
      +'.cm-tip-header{display:flex;align-items:center;gap:8px;margin-bottom:8px}'
      +'.cm-tip-num{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font:700 11.5px/1 -apple-system,system-ui,Inter,sans-serif;flex-shrink:0;box-shadow:0 2px 6px -2px rgba(79,70,229,.55)}'
      +'.cm-tip-eyebrow{font:700 10px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:#6366f1;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
      +'.cm-tip-close{background:rgba(120,120,128,.14);border:none;width:26px;height:26px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#3c3c43;transition:background .2s,transform .15s;flex-shrink:0}'
      +'.cm-tip-close:hover{background:rgba(120,120,128,.24)}.cm-tip-close:active{transform:scale(.92)}'
      +'body.dark .cm-tip-close{background:rgba(255,255,255,.1);color:#c9d1d9}'
      +'.cm-tip-close svg{width:12px;height:12px}'
      +'.cm-tip-title{font:700 16.5px/1.25 -apple-system,system-ui,"SF Pro Display",Inter,sans-serif;letter-spacing:-.3px;color:#0f1f3d;margin:0 0 6px}'
      +'body.dark .cm-tip-title{color:#f0f6fc}'
      +'.cm-tip-text{font:400 13.8px/1.5 -apple-system,system-ui,Inter,sans-serif;color:#4b5563;margin:0 0 14px}'
      +'body.dark .cm-tip-text{color:#9ba9ba}'
      +'.cm-tip-actions{display:flex;align-items:center;gap:8px;padding-top:10px;border-top:.5px solid rgba(120,120,128,.15)}'
      +'body.dark .cm-tip-actions{border-top-color:rgba(255,255,255,.08)}'
      +'.cm-tip-dots{flex:1;display:flex;gap:4px;justify-content:center}'
      +'.cm-tip-dot{width:5px;height:5px;border-radius:50%;background:rgba(120,120,128,.3);transition:all .3s cubic-bezier(.34,1.56,.52,1)}'
      +'.cm-tip-dot.active{width:18px;background:#6366f1;border-radius:3px}'
      +'body.dark .cm-tip-dot{background:rgba(255,255,255,.18)}'
      +'.cm-tip-btn{padding:9px 14px;border-radius:10px;border:none;cursor:pointer;font:600 12.5px/1 -apple-system,system-ui,Inter,sans-serif;transition:transform .15s cubic-bezier(.34,1.56,.52,1),background .2s;letter-spacing:.15px;min-height:36px}'
      +'.cm-tip-btn-ghost{background:rgba(120,120,128,.14);color:#3c3c43}'
      +'.cm-tip-btn-ghost:hover{background:rgba(120,120,128,.22)}'
      +'body.dark .cm-tip-btn-ghost{background:rgba(255,255,255,.08);color:#c9d1d9}'
      +'.cm-tip-btn-primary{background:linear-gradient(180deg,#6366f1,#4f46e5);color:#fff;box-shadow:0 4px 12px -4px rgba(79,70,229,.55),inset 0 1px 0 rgba(255,255,255,.2)}'
      +'.cm-tip-btn-primary:hover{transform:translateY(-1px)}'
      +'.cm-tip-btn:active{transform:scale(.95)}'
      +'.cm-tip-btn svg{width:12px;height:12px;vertical-align:-1px;margin-left:2px}'
      // ── Indicateur progress (haut tooltip) ──
      +'.cm-tip-progress{position:absolute;top:0;left:0;right:0;height:3px;background:rgba(99,102,241,.14);border-radius:18px 18px 0 0;overflow:hidden}'
      +'.cm-tip-progress-bar{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);transition:width .45s cubic-bezier(.22,.96,.36,1);box-shadow:0 0 10px rgba(99,102,241,.55)}'
      // ── Toast "no flow" (page sans coach marks) ──
      +'.cm-no-flow{position:fixed;left:50%;bottom:100px;transform:translateX(-50%);background:rgba(15,31,61,.95);color:#fff;padding:10px 16px;border-radius:14px;font:600 12.5px/1.4 -apple-system,system-ui,Inter,sans-serif;z-index:9700;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);animation:cmFade .3s cubic-bezier(.2,.8,.2,1);pointer-events:none;max-width:300px;text-align:center}'
      // ── Responsive ──
      +'@media(max-width:480px){.cm-tooltip{width:calc(100vw - 24px);padding:16px 16px 10px}.cm-tip-title{font-size:15.5px}.cm-tip-text{font-size:13.2px}}'
      +'@media(prefers-reduced-motion:reduce){.cm-overlay-dim,.cm-halo,.cm-tooltip{transition:none!important;animation:none!important}.cm-halo::before,.cm-fab::before{animation:none!important}}';
    var s=document.createElement('style');s.id='cm-styles';s.textContent=css;document.head.appendChild(s);
  }

  // ── Flows par page ─────────────────────────────────────────────────────
  // Chaque step : { selector, fallback?, title, text, placement? ('auto'|'top'|'bottom'|'left'|'right') }
  // Si selector ne matche pas, le step est skippé (fallback optionnel).
  var FLOWS={
    accueil:[
      {selector:'.sidebar .sidebar-logo, #hamburger-btn',title:'Bienvenue chez vous',text:'Votre cockpit Club Pilates. Ici, tout ce qui compte — à portée de clic.',placement:'auto'},
      {selector:'.kpi-card, .kpi-reveal',all:true,title:'KPIs en direct',text:'Studios, CAPEX, CA prévisionnel… chaque carte s\u2019actualise quand vous modifiez un BP. Cliquez pour filtrer.',placement:'bottom'},
      {selector:'.today-briefing, .focus-today, [class*="today"]',title:'Priorités du jour',text:'Vos tâches en retard, rendez-vous proches et signatures imminentes, remontées automatiquement chaque matin.',placement:'bottom'},
      {selector:'.sidebar-link, .sidebar-nav',title:'Navigation rapide',text:'Studios, Collab, BP consolidé, Engagements… basculez d\u2019une section à l\u2019autre en un clic (ou via le menu du bas sur mobile).',placement:'right'},
      {selector:'#bottom-tab-bar, .bottom-tab-bar',title:'Menu mobile',text:'Sur mobile, la barre du bas remplace la sidebar. Un seul tap pour changer de section.',placement:'top'},
      {selector:'.cm-fab',title:'Ce bouton vous suit',text:'Chaque page a son propre tuto. Relancez-le quand vous voulez — il s\u2019adapte à l\u2019endroit où vous êtes.',placement:'right'}
    ],
    projets:[
      {selector:'.card[data-studio-id], .card',all:true,title:'Vos studios',text:'Un par carte : statut, cohorte, avancement workflow. Cliquez pour ouvrir le détail avec une transition fluide.',placement:'auto'},
      {selector:'[onclick*="toggleNewForm"], .newform-toggle, .btn-primary',title:'Créer un studio',text:'Ouvrez le formulaire didactique : renseignez les adhérents fin A1/A2/A3, on calcule le reste automatiquement.',placement:'bottom'},
      {selector:'input[placeholder*="Recherche"], .search-input, .collab-search',title:'Rechercher',text:'Filtrez par nom, ville, société ou statut. La recherche est instantanée.',placement:'bottom'},
      {selector:'select, .filter-select',title:'Filtres',text:'Cohortes, statuts, régions — raffinez la liste selon ce que vous cherchez.',placement:'bottom'}
    ],
    detail:[
      {selector:'.breadcrumb, .bc-item',title:'Fil d\u2019Ariane',text:'Retour rapide à la liste des studios ou à l\u2019accueil. Le chemin actuel reste visible.',placement:'bottom'},
      {selector:'.tabs',title:'Les 9 onglets',text:'Workflow, adhérents, BP, engagements, chalandise, collab… tout sur ce studio à un clic. Scrollez horizontalement sur mobile.',placement:'bottom'},
      {selector:'.tab.active',title:'Onglet actif',text:'Le contenu s\u2019affiche juste en dessous. Swipez gauche/droite sur mobile pour changer d\u2019onglet rapidement.',placement:'bottom'},
      {selector:'button[onclick*="Export"], [onclick*="export"], .export-btn',title:'Exports',text:'PDF complet, synthèse financière, CAPEX, adhérents, Excel… tous les formats, en un clic.',placement:'bottom'},
      {selector:'.studio-actions',title:'Actions admin',text:'Archiver un studio obsolète ou le supprimer définitivement. Réservé aux super-admins.',placement:'top'}
    ],
    collab:[
      {selector:'.collab-hero, .collab-hero-inner',title:'Vue d\u2019ensemble',text:'Tâches actives, vos tâches, retards, discussions ouvertes — cross-studio, en un coup d\u2019œil.',placement:'bottom'},
      {selector:'.collab-kpi-clickable, .collab-kpi',title:'Filtrer en un tap',text:'Cliquez sur une KPI pour ne voir que les éléments correspondants. "Mes tâches" focalise sur ce qui vous concerne.',placement:'bottom'},
      {selector:'.collab-segment, .collab-seg-btn',title:'Tâches ou Discussions',text:'Deux onglets pour deux flux de collaboration : actions à mener vs conversations ouvertes.',placement:'bottom'},
      {selector:'.collab-new-task-btn',title:'Nouvelle tâche',text:'Créez une tâche cross-studio : choisissez le studio, assignez à un coéquipier, ajoutez une deadline. Notifications push incluses.',placement:'bottom'},
      {selector:'.collab-filters, .collab-filter-select',title:'Filtres puissants',text:'Assigné, statut, priorité, studio, recherche, tri… combinez les filtres pour trouver ce que vous cherchez en 2 secondes.',placement:'bottom'},
      {selector:'.collab-view-toggle',title:'Liste ou Kanban',text:'Basculez entre vue liste (dense) et vue kanban (par statut). Parfait pour vos revues hebdo.',placement:'left'}
    ],
    prospection:[
      {selector:'.prospection-hero, [class*="prospect"]',title:'Pipeline prospects',text:'Tous vos leads en un seul endroit. Cartographiés, qualifiés, priorisés.',placement:'auto'},
      {selector:'.leaflet-container, .map-container, [class*="map"]',title:'Carte interactive',text:'Chaque prospect localisé. Cliquez sur un pin pour voir sa fiche, son potentiel, son avancement.',placement:'auto'}
    ],
    bp:[
      {selector:'.bp-hero, .bp-consolide, [class*="bp-"]',title:'BP consolidé réseau',text:'Agrégation automatique de tous vos studios. CA total, EBITDA réseau, trajectoire cash.',placement:'bottom'},
      {selector:'.bp-subtab, .bp-tabs',title:'Vues multiples',text:'Synthèse, détail par studio, comparaison cohortes, trajectoire 36 mois. Naviguez à votre rythme.',placement:'bottom'}
    ],
    engagements:[
      {selector:'.engagements-hero, [class*="engage"]',title:'Récap engagements',text:'Compromis, permis, travaux, formations, ouvertures — tous les jalons de tous les studios, au même endroit.',placement:'bottom'},
      {selector:'.task-row[data-task-id], .engagement-row',title:'Swipe pour valider',text:'Sur mobile, swipez une étape vers la gauche pour la marquer faite. Haptic feedback pour confirmer.',placement:'bottom'}
    ],
    fichiers:[
      {selector:'.folder-grid, .folder-card',title:'Fichiers par studio',text:'Chaque studio a son dossier Google Drive synchronisé. Plans, photos, contrats — tout centralisé.',placement:'bottom'}
    ],
    'how-it-works':[
      {selector:'.how-hero',title:'La visite guidée',text:'Un chapitre par feature, avec animation. Cliquez sur une carte pour voir la démo en storyboard.',placement:'bottom'},
      {selector:'.how-card',all:true,title:'6 chapitres',text:'Chaque chapitre dure ~15 secondes. À la fin, un bouton vous emmène directement dans la vraie feature.',placement:'auto'}
    ]
  };

  // ── State & logique ────────────────────────────────────────────────────
  var _state={overlay:null,tooltip:null,idx:0,steps:null,target:null,_resizeHandler:null,_scrollY:0,_bodyStyles:null};

  function _haptic(n){try{if(navigator.vibrate)navigator.vibrate(n||10);}catch(e){}}

  function _getCurrentFlowKey(){
    if(typeof S==='undefined')return null;
    if(S.view==='detail')return 'detail';
    return S.page||'accueil';
  }

  function _getStepsForCurrentPage(){
    var key=_getCurrentFlowKey();
    if(!key)return null;
    return FLOWS[key]||null;
  }

  // Résolution de target : cherche selector, puis fallbacks, skip si introuvable
  function _resolveTarget(step){
    if(!step||!step.selector)return null;
    var selectors=step.selector.split(',').map(function(s){return s.trim();});
    for(var i=0;i<selectors.length;i++){
      var sel=selectors[i];
      var el=step.all?document.querySelector(sel):document.querySelector(sel);
      if(el&&_isVisible(el))return el;
    }
    if(step.fallback){
      var fb=document.querySelector(step.fallback);
      if(fb&&_isVisible(fb))return fb;
    }
    return null;
  }

  function _isVisible(el){
    if(!el)return false;
    var r=el.getBoundingClientRect();
    if(r.width<1||r.height<1)return false;
    var cs=getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)<.01)return false;
    return true;
  }

  function _scrollIntoViewSoft(el){
    var r=el.getBoundingClientRect();
    var vh=window.innerHeight;
    // Si l'élément n'est pas dans les 75% supérieurs du viewport, scroll
    if(r.top<60||r.bottom>vh-60){
      try{el.scrollIntoView({behavior:'smooth',block:'center'});}
      catch(e){window.scrollTo(0,window.scrollY+r.top-vh/3);}
    }
  }

  function _positionTooltip(tip,targetRect,placement){
    var tr=targetRect;
    var tw=tip.offsetWidth||320;
    var th=tip.offsetHeight||160;
    var vw=window.innerWidth,vh=window.innerHeight;
    var margin=14;
    var pos='bottom';
    // Calcule l'espace disponible de chaque côté
    var spaceTop=tr.top;
    var spaceBottom=vh-tr.bottom;
    var spaceLeft=tr.left;
    var spaceRight=vw-tr.right;
    if(placement&&placement!=='auto'){
      pos=placement;
    } else {
      // Auto : choisit le plus grand espace, priorité bottom
      if(spaceBottom>th+margin)pos='bottom';
      else if(spaceTop>th+margin)pos='top';
      else if(spaceRight>tw+margin)pos='right';
      else if(spaceLeft>tw+margin)pos='left';
      else pos='bottom';
    }
    // Fallback si placement demande trop d'espace
    if(pos==='bottom'&&spaceBottom<th+margin)pos='top';
    if(pos==='top'&&spaceTop<th+margin)pos='bottom';
    if(pos==='right'&&spaceRight<tw+margin)pos='left';
    if(pos==='left'&&spaceLeft<tw+margin)pos='right';

    var top=0,left=0;
    if(pos==='bottom'){top=tr.bottom+margin;left=tr.left+tr.width/2-tw/2;}
    else if(pos==='top'){top=tr.top-th-margin;left=tr.left+tr.width/2-tw/2;}
    else if(pos==='right'){top=tr.top+tr.height/2-th/2;left=tr.right+margin;}
    else if(pos==='left'){top=tr.top+tr.height/2-th/2;left=tr.left-tw-margin;}
    // Clamp dans viewport
    left=Math.max(12,Math.min(left,vw-tw-12));
    top=Math.max(12,Math.min(top,vh-th-12));
    tip.style.top=top+'px';
    tip.style.left=left+'px';
    // Position de la flèche
    var arrow=tip.querySelector('.cm-tip-arrow');
    if(arrow){
      arrow.className='cm-tip-arrow '+pos;
      // Recalibrer pour pointer vers target
      if(pos==='top'||pos==='bottom'){
        var arrowLeft=tr.left+tr.width/2-left-7;
        arrow.style.left=Math.max(14,Math.min(arrowLeft,tw-21))+'px';
        arrow.style.marginLeft='0';
      } else {
        var arrowTop=tr.top+tr.height/2-top-7;
        arrow.style.top=Math.max(14,Math.min(arrowTop,th-21))+'px';
        arrow.style.marginTop='0';
      }
    }
  }

  function _positionHalo(halo,targetRect){
    var r=targetRect;
    var pad=6;
    halo.style.top=(r.top-pad)+'px';
    halo.style.left=(r.left-pad)+'px';
    halo.style.width=(r.width+pad*2)+'px';
    halo.style.height=(r.height+pad*2)+'px';
    // border-radius adaptatif
    var cs=_state.target?getComputedStyle(_state.target):null;
    var br=cs?parseFloat(cs.borderRadius)||0:0;
    halo.style.borderRadius=(br+pad)+'px';
  }

  function _updateSpotlight(){
    if(!_state.overlay||!_state.target)return;
    var r=_state.target.getBoundingClientRect();
    // Met à jour clip-path sur le dim
    var pad=8;
    var top=r.top-pad,left=r.left-pad,right=r.right+pad,bottom=r.bottom+pad;
    var vw=window.innerWidth,vh=window.innerHeight;
    var cs=_state.target?getComputedStyle(_state.target):null;
    var br=cs?parseFloat(cs.borderRadius)||0:0;
    // Pas de clip-path inverse supporté universellement avec rx — utilise polygon approx
    var dim=_state.overlay.querySelector('.cm-overlay-dim');
    if(dim){
      // Use clip-path polygon to carve a hole (rectangle approx)
      var poly='polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 '+top+'px, '+left+'px '+top+'px, '+left+'px '+bottom+'px, '+right+'px '+bottom+'px, '+right+'px '+top+'px, 0 '+top+'px)';
      dim.style.clipPath=poly;
      dim.style.webkitClipPath=poly;
    }
    var halo=_state.overlay.querySelector('.cm-halo');
    if(halo)_positionHalo(halo,r);
    var tip=_state.tooltip;
    if(tip)_positionTooltip(tip,r,_state.steps[_state.idx].placement||'auto');
  }

  function _renderStep(){
    if(!_state.overlay||!_state.steps)return;
    var step=_state.steps[_state.idx];
    // Résoudre la cible ; si absente, passer au suivant
    var target=_resolveTarget(step);
    if(!target){
      // Skip ce step si target introuvable (UI variable selon l'état)
      if(_state.idx+1<_state.steps.length){_state.idx++;return _renderStep();}
      return _endCoach();
    }
    _state.target=target;
    _scrollIntoViewSoft(target);
    // Laisser au scroll le temps de se poser
    setTimeout(function(){
      _updateSpotlight();
      // Contenu tooltip
      var tip=_state.tooltip;
      if(!tip)return;
      var total=_state.steps.length;
      tip.innerHTML=''
        +'<div class="cm-tip-progress"><div class="cm-tip-progress-bar" style="width:'+((_state.idx+1)/total*100)+'%"></div></div>'
        +'<div class="cm-tip-arrow"></div>'
        +'<div class="cm-tip-header">'
        +  '<span class="cm-tip-num">'+(_state.idx+1)+'</span>'
        +  '<span class="cm-tip-eyebrow">'+(step.eyebrow||_flowLabel())+'</span>'
        +  '<button class="cm-tip-close" aria-label="Fermer">'
        +    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        +  '</button>'
        +'</div>'
        +'<h3 class="cm-tip-title">'+_esc(step.title||'')+'</h3>'
        +'<p class="cm-tip-text">'+_esc(step.text||'')+'</p>'
        +'<div class="cm-tip-actions">'
        +  (_state.idx>0?'<button class="cm-tip-btn cm-tip-btn-ghost" data-cm-action="prev">Précédent</button>':'')
        +  '<div class="cm-tip-dots">'+_renderDots(total)+'</div>'
        +  '<button class="cm-tip-btn cm-tip-btn-primary" data-cm-action="next">'+(_state.idx===total-1?'Terminer':'Suivant')+'</button>'
        +'</div>';
      tip.querySelector('.cm-tip-close').onclick=_endCoach;
      [].slice.call(tip.querySelectorAll('[data-cm-action]')).forEach(function(b){
        b.onclick=function(){var a=b.getAttribute('data-cm-action');if(a==='next')_nextStep();else if(a==='prev')_prevStep();};
      });
      _positionTooltip(tip,target.getBoundingClientRect(),step.placement||'auto');
    },250);
  }

  function _renderDots(total){
    var out='';
    for(var i=0;i<total;i++){
      out+='<span class="cm-tip-dot'+(i===_state.idx?' active':'')+'"></span>';
    }
    return out;
  }

  function _esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  function _flowLabel(){
    var key=_getCurrentFlowKey();
    var labels={accueil:'Accueil',projets:'Studios',detail:'Détail studio',collab:'Collab',prospection:'Prospection',bp:'BP consolidé',engagements:'Engagements',fichiers:'Fichiers','how-it-works':'Comment ça marche'};
    return labels[key]||'Guide';
  }

  function _nextStep(){
    _haptic(8);
    if(_state.idx+1>=_state.steps.length)return _endCoach();
    _state.idx++;_renderStep();
  }
  function _prevStep(){
    _haptic(6);
    if(_state.idx<=0)return;
    _state.idx--;_renderStep();
  }

  function _startCoach(steps){
    _ensureStyles();
    if(_state.overlay)_endCoach();
    _state.steps=steps;_state.idx=0;
    // Lock scroll iOS-safe
    _state._scrollY=window.scrollY||document.documentElement.scrollTop||0;
    document.body.classList.add('cm-active');
    // Overlay dim
    var ov=document.createElement('div');
    ov.className='cm-overlay';
    ov.innerHTML='<div class="cm-overlay-dim"></div><div class="cm-halo"></div>';
    document.body.appendChild(ov);
    _state.overlay=ov;
    // Tooltip (détaché de l'overlay pour bouger librement)
    var tip=document.createElement('div');
    tip.className='cm-tooltip';
    tip.setAttribute('role','dialog');
    tip.setAttribute('aria-modal','true');
    document.body.appendChild(tip);
    _state.tooltip=tip;
    // Clic sur overlay (hors tooltip) = next
    ov.addEventListener('click',function(e){if(e.target===ov||e.target.classList.contains('cm-overlay-dim'))_nextStep();});
    // Keyboard
    document.addEventListener('keydown',_onKey);
    // Resize / scroll listener
    _state._resizeHandler=function(){if(_state.target)_updateSpotlight();};
    window.addEventListener('resize',_state._resizeHandler);
    window.addEventListener('scroll',_state._resizeHandler,{passive:true});
    // Swipe tactile
    _bindSwipe(tip);
    _haptic(10);
    _renderStep();
  }

  function _endCoach(){
    _haptic(5);
    if(_state.overlay&&_state.overlay.parentNode){
      _state.overlay.style.animation='cmFade .3s cubic-bezier(.2,.8,.2,1) reverse forwards';
      setTimeout(function(){if(_state.overlay&&_state.overlay.parentNode)_state.overlay.parentNode.removeChild(_state.overlay);_state.overlay=null;},320);
    }
    if(_state.tooltip&&_state.tooltip.parentNode){
      _state.tooltip.style.animation='cmFade .2s cubic-bezier(.2,.8,.2,1) reverse forwards';
      setTimeout(function(){if(_state.tooltip&&_state.tooltip.parentNode)_state.tooltip.parentNode.removeChild(_state.tooltip);_state.tooltip=null;},220);
    }
    document.body.classList.remove('cm-active');
    document.removeEventListener('keydown',_onKey);
    if(_state._resizeHandler){
      window.removeEventListener('resize',_state._resizeHandler);
      window.removeEventListener('scroll',_state._resizeHandler);
      _state._resizeHandler=null;
    }
    _state.steps=null;_state.idx=0;_state.target=null;
  }

  function _onKey(e){
    if(!_state.overlay)return;
    if(e.key==='Escape'){e.preventDefault();_endCoach();}
    else if(e.key==='ArrowRight'){e.preventDefault();_nextStep();}
    else if(e.key==='ArrowLeft'){e.preventDefault();_prevStep();}
  }

  function _bindSwipe(el){
    var sx=0,sy=0,tracking=false;
    el.addEventListener('touchstart',function(e){var t=e.touches[0];sx=t.clientX;sy=t.clientY;tracking=true;},{passive:true});
    el.addEventListener('touchend',function(e){
      if(!tracking)return;tracking=false;
      var t=e.changedTouches[0];var dx=t.clientX-sx;var dy=t.clientY-sy;
      if(Math.abs(dx)<50||Math.abs(dy)>Math.abs(dx)*0.7)return;
      if(dx<0)_nextStep();else _prevStep();
    },{passive:true});
  }

  function startCoachForCurrentPage(){
    _ensureStyles();
    var steps=_getStepsForCurrentPage();
    if(!steps||!steps.length){
      _showNoFlowToast();
      return;
    }
    _startCoach(steps);
  }

  function _showNoFlowToast(){
    var t=document.createElement('div');
    t.className='cm-no-flow';
    t.textContent='Tuto bientôt disponible pour cette page — merci de votre patience';
    document.body.appendChild(t);
    setTimeout(function(){t.style.transition='opacity .3s';t.style.opacity='0';setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},320);},2800);
  }

  // ── FAB bouton play ────────────────────────────────────────────────────
  function renderCoachFab(){
    _ensureStyles();
    var existing=document.getElementById('cm-fab-btn');
    // Ne montre que si user connecté
    var authed=typeof S!=='undefined'&&S.user;
    if(!authed){
      if(existing)existing.remove();
      return;
    }
    if(existing)return; // déjà présent
    var btn=document.createElement('button');
    btn.id='cm-fab-btn';
    btn.className='cm-fab';
    btn.setAttribute('aria-label','Lancer le tuto de cette page');
    btn.setAttribute('title','Guide de cette page');
    btn.innerHTML=''
      +'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>'
      +'<span class="cm-fab-label">Tuto de la page</span>';
    btn.onclick=function(){_haptic(12);startCoachForCurrentPage();};
    document.body.appendChild(btn);
  }

  function hideCoachFab(){
    var e=document.getElementById('cm-fab-btn');
    if(e)e.remove();
  }

  // Expose
  window.startCoachForCurrentPage=startCoachForCurrentPage;
  window.renderCoachFab=renderCoachFab;
  window.hideCoachFab=hideCoachFab;
  window.endCoachMarks=_endCoach;
})();
