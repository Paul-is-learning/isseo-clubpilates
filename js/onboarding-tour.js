// ════════════════════════════════════════════════════════════════════════════
// ── Onboarding Tour — style Apple premium, 10 slides, animations live ──
// ════════════════════════════════════════════════════════════════════════════
// Affiche un tuto dynamique à la connexion, pour les 10 premiers passages de
// chaque utilisateur sur chaque appareil (compteur localStorage).
// Slides avec mini-démos animées : dashboard, carte de chalandise, timeline,
// chat, etc. Le tout en glassmorphism Apple-like, spring physics, haptic.

(function(){
  var LS_COUNT_PREFIX='isseo_tour_count_';
  var LS_DISMISS_PREFIX='isseo_tour_dismissed_';
  var MAX_SHOWS=10;

  function _uid(){return (typeof S!=='undefined'&&S.user&&S.user.id)||'anon';}
  function _count(){try{return parseInt(localStorage.getItem(LS_COUNT_PREFIX+_uid())||'0',10)||0;}catch(e){return 0;}}
  function _setCount(n){try{localStorage.setItem(LS_COUNT_PREFIX+_uid(),String(n));}catch(e){}}
  function _dismissed(){try{return localStorage.getItem(LS_DISMISS_PREFIX+_uid())==='1';}catch(e){return false;}}
  function _dismiss(){try{localStorage.setItem(LS_DISMISS_PREFIX+_uid(),'1');}catch(e){}}

  // ── Définition des 10 slides ─────────────────────────────────────────────
  var STEPS=[
    {key:'welcome',     eyebrow:'ISSEO × Club Pilates', title:'Pilotez votre réseau.', subtitle:'Tous vos studios, un seul cockpit. Bienvenue.', tint:'#1a3a6b', demo:'welcome'},
    {key:'accueil',     eyebrow:'Accueil',              title:'Le pouls, en un coup d\u2019\u0153il.', subtitle:'KPIs, alertes et prochaines échéances — pour tout le réseau, en temps réel.', tint:'#2563eb', demo:'dashboard'},
    {key:'studios',     eyebrow:'Vos studios',          title:'Toute la France.', subtitle:'Chaque studio, son statut, sa cohorte, son business plan.', tint:'#0891b2', demo:'map'},
    {key:'newform',     eyebrow:'Création',             title:'Saisissez vos adhérents.', subtitle:'Fin d\u2019année 1, 2 et 3. L\u2019app en déduit CA, pack mix et ARPU automatiquement.', tint:'#0d9488', demo:'newform'},
    {key:'bp',          eyebrow:'Business Plan',        title:'Chiffres qui parlent.', subtitle:'CA, EBITDA, cash net — mis à jour à chaque clic. 36 mois détaillés.', tint:'#047857', demo:'chart'},
    {key:'chalandise',  eyebrow:'Étude locale',         title:'Zone de chalandise, en live.', subtitle:'3 rayons, population, trafic, transports, socio-démographie. Tout, carte à l\u2019appui.', tint:'#7c3aed', demo:'chalandise'},
    {key:'engagements', eyebrow:'Engagements',          title:'Du compromis à l\u2019ouverture.', subtitle:'Une timeline claire. Zéro échéance oubliée, zéro relance manuelle.', tint:'#b45309', demo:'timeline'},
    {key:'collab',      eyebrow:'Collaboration',        title:'Votre équipe, connectée.', subtitle:'Messages, tâches, fichiers, notifications push. Tout le réseau au même endroit.', tint:'#db2777', demo:'chat'},
    {key:'mobile',      eyebrow:'Mobile-first',         title:'Installable. Hors ligne.', subtitle:'Ajoutez à l\u2019écran d\u2019accueil. Swipe, haptics, dark mode. Comme une vraie app.', tint:'#475569', demo:'mobile'},
    {key:'ready',       eyebrow:'\u2728 Prêt',          title:'Bonne gestion.', subtitle:'Et bons cours de Pilates !', tint:'#1a3a6b', demo:'sparkles', isLast:true}
  ];

  // ── Démos inline : chaque fonction retourne du HTML + déclenche anim ────
  var DEMOS={
    welcome:function(){
      return ''
        +'<div class="dmo-welcome">'
        +  '<div class="dmo-logo">'
        +    '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        +      '<circle cx="60" cy="60" r="44" class="dmo-ring"/>'
        +      '<circle cx="60" cy="60" r="30" class="dmo-ring2"/>'
        +      '<circle cx="60" cy="42" r="6" fill="currentColor" class="dmo-dot"/>'
        +      '<path d="M36 74c6-12 16-18 24-18s18 6 24 18" class="dmo-smile"/>'
        +    '</svg>'
        +  '</div>'
        +  '<div class="dmo-sparks"><span></span><span></span><span></span><span></span><span></span></div>'
        +'</div>';
    },
    dashboard:function(){
      return ''
        +'<div class="dmo-dash">'
        +  '<div class="dmo-dash-row">'
        +    '<div class="dmo-kpi" style="--c:#047857"><div class="dmo-kpi-lbl">CA réseau</div><div class="dmo-kpi-val" data-target="2840000" data-prefix="" data-suffix=" €">0 €</div><div class="dmo-kpi-spark"><svg viewBox="0 0 80 24"><polyline points="0,18 12,14 24,16 36,10 48,12 60,6 72,8 80,4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="dmo-kpi-spark-line"/></svg></div></div>'
        +    '<div class="dmo-kpi" style="--c:#2563eb"><div class="dmo-kpi-lbl">Studios</div><div class="dmo-kpi-val" data-target="15" data-suffix="">0</div><div class="dmo-kpi-spark"><svg viewBox="0 0 80 24"><polyline points="0,20 16,18 32,14 48,10 64,8 80,4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="dmo-kpi-spark-line"/></svg></div></div>'
        +  '</div>'
        +  '<div class="dmo-dash-row">'
        +    '<div class="dmo-kpi" style="--c:#b45309"><div class="dmo-kpi-lbl">Adhérents A1</div><div class="dmo-kpi-val" data-target="8640" data-suffix="">0</div><div class="dmo-kpi-spark"><svg viewBox="0 0 80 24"><polyline points="0,20 12,16 24,18 36,12 48,14 60,8 72,10 80,6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="dmo-kpi-spark-line"/></svg></div></div>'
        +    '<div class="dmo-kpi" style="--c:#db2777"><div class="dmo-kpi-lbl">EBITDA moy.</div><div class="dmo-kpi-val" data-target="27" data-suffix=" %">0 %</div><div class="dmo-kpi-spark"><svg viewBox="0 0 80 24"><polyline points="0,16 16,14 32,10 48,12 64,6 80,4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="dmo-kpi-spark-line"/></svg></div></div>'
        +  '</div>'
        +'</div>';
    },
    map:function(){
      // Carte France métropolitaine — path Natural Earth simplifié (contour réaliste)
      // ViewBox calibré sur lat/lon : x=(lon+5)/13, y=(51.5-lat)/10.5, scale*100
      // Villes positionnées aux coordonnées GPS exactes → projection linéaire
      function lonlat(lon,lat){
        return {x:((lon+5)/13*80+10).toFixed(2),y:((51.5-lat)/10.5*80+10).toFixed(2)};
      }
      var paris=lonlat(2.35,48.86);          // 44.52, 30.10
      var toulouse=lonlat(1.44,43.60);       // 43.96, 70.21
      var montpellier=lonlat(3.88,43.61);    // 58.97, 70.13
      var highlights=[
        {x:paris.x,y:paris.y,l:'Paris',ly:'top'},
        {x:toulouse.x,y:toulouse.y,l:'Toulouse',ly:'top'},     // label au-dessus
        {x:montpellier.x,y:montpellier.y,l:'Montpellier',ly:'bottom'} // label en dessous
      ];
      var h='<div class="dmo-map"><svg viewBox="0 0 100 100" class="dmo-map-svg" preserveAspectRatio="xMidYMid meet">';
      h+='<defs><radialGradient id="dmoFrFill" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="currentColor" stop-opacity=".09"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>';
      // ── Contour France métropolitaine : chaque point = ville réelle projetée ──
      // Départ Dunkerque (nord) → sens horaire : Manche, Atlantique, Pyrénées,
      // Méditerranée, Alpes, frontière Est, Nord. Même projection que les villes.
      function p(lon,lat){var c=lonlat(lon,lat);return c.x+' '+c.y;}
      var frPath='M '+p(2.38,51.05)                    // Dunkerque
        +' L '+p(1.85,50.95)                           // Calais
        +' Q '+p(1.0,50.3)+' '+p(0.11,49.49)           // Boulogne → Le Havre
        +' L '+p(-1.62,49.64)                          // Cherbourg
        +' Q '+p(-1.85,48.9)+' '+p(-2.03,48.65)        // Granville → Saint-Malo
        +' L '+p(-4.49,48.39)                          // Brest
        +' L '+p(-4.10,47.99)                          // Quimper
        +' L '+p(-3.37,47.75)                          // Lorient
        +' L '+p(-2.21,47.28)                          // Saint-Nazaire
        +' Q '+p(-1.95,46.5)+' '+p(-1.15,46.16)        // Sables → La Rochelle
        +' L '+p(-0.98,45.63)                          // Royan
        +' L '+p(-0.58,44.84)                          // Bordeaux
        +' L '+p(-1.17,44.66)                          // Arcachon
        +' Q '+p(-1.50,44.0)+' '+p(-1.56,43.48)        // → Biarritz
        +' L '+p(-1.78,43.36)                          // Hendaye
        +' L '+p(-0.37,43.30)                          // Pau
        +' L '+p(1.61,42.97)                           // Foix (Pyrénées)
        +' L '+p(2.90,42.70)                           // Perpignan
        +' L '+p(3.00,43.18)                           // Narbonne
        +' L '+p(3.69,43.40)                           // Sète
        +' L '+p(4.80,43.40)                           // Camargue
        +' L '+p(5.37,43.30)                           // Marseille
        +' L '+p(5.93,43.12)                           // Toulon
        +' L '+p(6.64,43.27)                           // Saint-Tropez
        +' L '+p(7.02,43.55)                           // Cannes
        +' L '+p(7.27,43.70)                           // Nice
        +' L '+p(7.50,43.78)                           // Menton
        +' Q '+p(7.56,44.17)+' '+p(6.87,45.92)         // Col de Tende → Chamonix
        +' L '+p(6.15,46.20)                           // Genève (frontière)
        +' L '+p(6.02,47.24)                           // Besançon
        +' L '+p(7.34,47.75)                           // Mulhouse
        +' L '+p(7.75,48.58)                           // Strasbourg
        +' L '+p(7.95,49.04)                           // Wissembourg
        +' L '+p(5.77,49.52)                           // Longwy
        +' L '+p(4.94,49.70)                           // Sedan
        +' L '+p(3.97,50.28)                           // Maubeuge
        +' L '+p(3.06,50.63)                           // Lille
        +' Z';
      h+='<path class="dmo-map-fill" d="'+frPath+'" fill="url(#dmoFrFill)" stroke="none"/>';
      h+='<path class="dmo-map-outline" d="'+frPath+'" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"/>';
      // Corse (projetée depuis coords GPS : ~42.7°N-41.3°N, 8.5°E-9.6°E)
      var corsePath='M '+p(9.15,43.00)+' L '+p(9.56,42.82)+' L '+p(9.46,42.0)+' L '+p(9.16,41.55)+' L '+p(8.80,41.60)+' L '+p(8.75,42.57)+' Z';
      h+='<path class="dmo-map-outline dmo-map-corse" d="'+corsePath+'" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>';
      // Villes : pin halo + pulse + dot (positions GPS exactes)
      highlights.forEach(function(p,i){
        var labelY=p.ly==='top'?(parseFloat(p.y)-4.8):(parseFloat(p.y)+4.2);
        h+='<g class="dmo-hl" style="--dl:'+(i*0.18+0.9)+'s" transform="translate('+p.x+' '+p.y+')">';
        h+=  '<circle r="6" class="dmo-hl-halo"/>';
        h+=  '<circle r="4" class="dmo-hl-pulse"/>';
        h+=  '<circle r="2.4" class="dmo-hl-dot"/>';
        h+='</g>';
        h+='<text class="dmo-hl-label" x="'+p.x+'" y="'+labelY+'" text-anchor="middle" style="--dl:'+(i*0.18+1.25)+'s">'+p.l+'</text>';
      });
      h+='</svg><div class="dmo-map-badge"><span data-target="15">0</span> studios · objectif</div></div>';
      return h;
    },
    newform:function(){
      return ''
        +'<div class="dmo-newform">'
        +  '<div class="dmo-nf-header"><span class="dmo-nf-title">Nouveau studio</span><span class="dmo-nf-pill">Lattes</span></div>'
        +  '<div class="dmo-nf-field" style="--dl:.1s"><label>Adhérents fin A1</label><div class="dmo-nf-input"><span class="dmo-nf-typer" data-text="320">0</span><i class="dmo-nf-caret"></i></div><div class="dmo-nf-bar" style="--w:35%"></div></div>'
        +  '<div class="dmo-nf-field" style="--dl:.45s"><label>Adhérents fin A2</label><div class="dmo-nf-input"><span class="dmo-nf-typer" data-text="480">0</span><i class="dmo-nf-caret"></i></div><div class="dmo-nf-bar" style="--w:62%"></div></div>'
        +  '<div class="dmo-nf-field" style="--dl:.8s"><label>Adhérents fin A3</label><div class="dmo-nf-input"><span class="dmo-nf-typer" data-text="540">0</span><i class="dmo-nf-caret"></i></div><div class="dmo-nf-bar" style="--w:78%"></div></div>'
        +  '<div class="dmo-nf-result" style="--dl:1.1s"><div class="dmo-nf-row"><span>CA A3</span><b data-target="1017360" data-suffix=" €">0</b></div><div class="dmo-nf-row"><span>ARPU</span><b>157 €/mois</b></div></div>'
        +'</div>';
    },
    chart:function(){
      return ''
        +'<div class="dmo-chart">'
        +  '<svg viewBox="0 0 320 180" preserveAspectRatio="none">'
        +    '<defs>'
        +      '<linearGradient id="dmoGrad1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".35"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient>'
        +    '</defs>'
        +    '<g class="dmo-grid" stroke="currentColor" stroke-width=".5" opacity=".12">'
        +      '<line x1="0" y1="40" x2="320" y2="40"/><line x1="0" y1="80" x2="320" y2="80"/><line x1="0" y1="120" x2="320" y2="120"/><line x1="0" y1="160" x2="320" y2="160"/>'
        +    '</g>'
        +    '<path class="dmo-area" d="M 0 160 L 40 140 L 80 130 L 120 105 L 160 95 L 200 70 L 240 55 L 280 35 L 320 20 L 320 180 L 0 180 Z" fill="url(#dmoGrad1)"/>'
        +    '<path class="dmo-line" d="M 0 160 L 40 140 L 80 130 L 120 105 L 160 95 L 200 70 L 240 55 L 280 35 L 320 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
        +    '<circle class="dmo-chart-tip" cx="320" cy="20" r="4" fill="currentColor"/>'
        +    '<circle cx="320" cy="20" r="9" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".4" class="dmo-chart-pulse"/>'
        +  '</svg>'
        +  '<div class="dmo-chart-legend"><span><i></i>EBITDA cumulé</span><b data-target="487000" data-suffix=" €">0 €</b></div>'
        +'</div>';
    },
    chalandise:function(){
      // Mini-carte chalandise avec 3 cercles concentriques + pin pulsant + badges
      return ''
        +'<div class="dmo-chal">'
        +  '<div class="dmo-chal-map">'
        +    '<div class="dmo-chal-grid"></div>'
        +    '<svg class="dmo-chal-streets" viewBox="0 0 200 200" preserveAspectRatio="none">'
        +      '<path d="M0 100 L200 100 M100 0 L100 200 M0 60 L200 60 M0 140 L200 140 M60 0 L60 200 M140 0 L140 200" stroke="currentColor" stroke-width=".4" opacity=".14"/>'
        +      '<path d="M20 40 Q 80 60 140 50 T 200 70 M 0 170 Q 60 150 120 160 T 200 140" stroke="currentColor" stroke-width=".7" opacity=".22" fill="none"/>'
        +    '</svg>'
        +    '<div class="dmo-chal-ring r1" style="--c:#1D9E75"><span class="dmo-chal-lbl">500 m · 3 400 hab</span></div>'
        +    '<div class="dmo-chal-ring r2" style="--c:#378ADD"><span class="dmo-chal-lbl">1 km · 14 200 hab</span></div>'
        +    '<div class="dmo-chal-ring r3" style="--c:#9B59B6"><span class="dmo-chal-lbl">2 km · 48 600 hab</span></div>'
        +    '<div class="dmo-chal-pin"><span class="dmo-chal-pulse"></span><span class="dmo-chal-pulse d2"></span><span class="dmo-chal-pin-core"></span></div>'
        +    '<div class="dmo-chal-marker" style="top:22%;left:68%;--c:#D85A30" title="Tramway">🚋</div>'
        +    '<div class="dmo-chal-marker" style="top:70%;left:28%;--c:#378ADD" title="Métro">Ⓜ</div>'
        +    '<div class="dmo-chal-marker" style="top:30%;left:22%;--c:#E89B2A" title="Bus">🚌</div>'
        +    '<div class="dmo-chal-tmja">TMJA · <b data-target="22500" data-suffix="">0</b> véh/j</div>'
        +  '</div>'
        +  '<div class="dmo-chal-stats">'
        +    '<div class="dmo-chal-stat"><div class="dmo-chal-stat-lbl">Revenu médian</div><div class="dmo-chal-stat-val" data-target="38400" data-suffix=" €">0 €</div></div>'
        +    '<div class="dmo-chal-stat"><div class="dmo-chal-stat-lbl">Densité</div><div class="dmo-chal-stat-val" data-target="4800" data-suffix="/km²">0</div></div>'
        +    '<div class="dmo-chal-stat"><div class="dmo-chal-stat-lbl">Ménages CSP+</div><div class="dmo-chal-stat-val" data-target="41" data-suffix=" %">0 %</div></div>'
        +  '</div>'
        +'</div>';
    },
    timeline:function(){
      var steps=[{l:'Compromis',d:'J-180'},{l:'Permis',d:'J-120'},{l:'Travaux',d:'J-90'},{l:'Formation',d:'J-30'},{l:'Ouverture',d:'J0'}];
      var h='<div class="dmo-tl">';
      steps.forEach(function(s,i){
        h+='<div class="dmo-tl-step" style="--dl:'+(i*0.18+0.1)+'s">';
        h+=  '<div class="dmo-tl-node"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 10l4 4 8-8"/></svg></div>';
        h+=  '<div class="dmo-tl-txt"><div class="dmo-tl-lbl">'+s.l+'</div><div class="dmo-tl-date">'+s.d+'</div></div>';
        if(i<steps.length-1)h+='<div class="dmo-tl-line"></div>';
        h+='</div>';
      });
      h+='</div>';
      return h;
    },
    chat:function(){
      return ''
        +'<div class="dmo-chat">'
        +  '<div class="dmo-chat-typing left" style="--dl:.05s;--hide:.5s"><b>Paul</b><div class="dmo-chat-dots"><span></span><span></span><span></span></div></div>'
        +  '<div class="dmo-chat-bubble left"  style="--dl:.55s"><b>Paul</b><span>Le permis est accordé pour Lattes ✅</span></div>'
        +  '<div class="dmo-chat-typing right" style="--dl:.75s;--hide:.5s"><b>Clément</b><div class="dmo-chat-dots"><span></span><span></span><span></span></div></div>'
        +  '<div class="dmo-chat-bubble right" style="--dl:1.25s"><b>Clément</b><span>Parfait, je lance les travaux lundi 🚀</span></div>'
        +  '<div class="dmo-chat-bubble left"  style="--dl:1.7s"><b>Paul</b><span>J\u2019assigne la tâche « Commande équipements ».</span></div>'
        +  '<div class="dmo-chat-task" style="--dl:2.1s"><span class="dmo-chat-task-ico">📋</span><div class="dmo-chat-task-body"><div class="dmo-chat-task-title">Commander équipements Pilates</div><div class="dmo-chat-task-meta">@Clément · échéance 10 mai</div></div><span class="dmo-chat-task-check">✓</span></div>'
        +'</div>';
    },
    mobile:function(){
      return ''
        +'<div class="dmo-mobile">'
        +  '<div class="dmo-phone">'
        +    '<div class="dmo-phone-notch"></div>'
        +    '<div class="dmo-phone-screen">'
        +      '<div class="dmo-phone-status">18:47</div>'
        +      '<div class="dmo-phone-card"><div class="dmo-phone-title">Montpellier — Lattes</div><div class="dmo-phone-chip">En chantier</div></div>'
        +      '<div class="dmo-phone-tabs"><span class="active">Workflow</span><span>Adhérents</span><span>BP</span></div>'
        +      '<div class="dmo-phone-kpi"><div><small>CA A3</small><b>1,02 M€</b></div><div><small>EBITDA</small><b>27 %</b></div></div>'
        +      '<div class="dmo-phone-nav"><span class="active">🏠</span><span>📂</span><span>💬</span><span>🔍</span></div>'
        +    '</div>'
        +    '<div class="dmo-phone-tap"></div>'
        +  '</div>'
        +'</div>';
    },
    sparkles:function(){
      var h='<div class="dmo-ready"><svg viewBox="0 0 140 140" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="dmo-ready-svg">';
      h+='<circle cx="70" cy="70" r="46" class="dmo-ready-ring"/>';
      h+='<path d="M55 70l10 10 22-24" class="dmo-ready-check"/>';
      h+='</svg>';
      // Confettis / sparks
      for(var i=0;i<14;i++){
        var ang=(i/14)*360,len=60+Math.random()*20,sz=4+Math.random()*5,dl=Math.random()*.3;
        h+='<span class="dmo-ready-spark" style="--a:'+ang+'deg;--l:'+len+'px;--s:'+sz+'px;--dl:'+dl.toFixed(2)+'s"></span>';
      }
      h+='</div>';
      return h;
    }
  };

  // ── Animations post-render : compteurs et typers ─────────────────────────
  // Cache des valeurs finales déjà jouées pour chaque slide (éviter re-count)
  var _counterCache=Object.create(null);
  function _animateCounters(root){
    var slideKey=STEPS[_state.idx]&&STEPS[_state.idx].key||'_';
    var targets=root.querySelectorAll('[data-target]');
    targets.forEach(function(el,idx){
      var to=parseFloat(el.getAttribute('data-target'))||0;
      var suf=el.getAttribute('data-suffix')||'';
      var pre=el.getAttribute('data-prefix')||'';
      var cacheKey=slideKey+':'+idx+':'+to;
      function fmt(v){
        var s=Math.round(v).toString();
        if(to>=1000)s=s.replace(/\B(?=(\d{3})+(?!\d))/g,' ');
        return pre+s+suf;
      }
      // Si déjà joué : affiche direct la valeur finale (pas de re-count au retour)
      if(_counterCache[cacheKey]){el.textContent=fmt(to);return;}
      var dur=1100+Math.random()*400;
      var start=performance.now();
      function tick(now){
        var t=Math.min(1,(now-start)/dur);
        var e=1-Math.pow(1-t,3);
        el.textContent=fmt(to*e);
        if(t<1)requestAnimationFrame(tick);
        else _counterCache[cacheKey]=true;
      }
      requestAnimationFrame(tick);
    });
    var typers=root.querySelectorAll('.dmo-nf-typer[data-text]');
    typers.forEach(function(el){
      var txt=el.getAttribute('data-text');
      var dly=parseFloat((el.parentNode.parentNode&&el.parentNode.parentNode.style.getPropertyValue('--dl'))||'0')*1000||0;
      setTimeout(function(){
        var i=0;el.textContent='';
        var iv=setInterval(function(){
          i++;el.textContent=txt.slice(0,i);
          if(i>=txt.length)clearInterval(iv);
        },70);
      },dly+80);
    });
  }

  // ── Styles (injectés une fois) ────────────────────────────────────────────
  function _ensureStyles(){
    if(document.getElementById('onb-tour-style'))return;
    var css=''
      // ── Overlay & glass card ──
      +'.onb-overlay{position:fixed;inset:0;height:100vh;height:100dvh;z-index:99999;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 30% 20%,rgba(26,58,107,.55),rgba(10,14,28,.78));backdrop-filter:blur(28px) saturate(1.5);-webkit-backdrop-filter:blur(28px) saturate(1.5);animation:onbFade .4s cubic-bezier(.2,.8,.2,1);padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))}'
      +'.onb-overlay::before{content:"";position:absolute;inset:0;background:radial-gradient(closest-side at var(--mx,30%) var(--my,20%),var(--onb-tint,#1a3a6b)22,transparent 62%),radial-gradient(closest-side at 80% 85%,#ff4d9f1f,transparent 55%);pointer-events:none;transition:background .9s cubic-bezier(.2,.8,.2,1);opacity:.9}'
      +'.onb-card{position:relative;width:min(480px,100%);max-height:min(780px,100vh);max-height:min(780px,100dvh);background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(248,250,255,.92));border-radius:32px;box-shadow:0 32px 80px -16px rgba(10,14,28,.6),0 12px 28px rgba(10,14,28,.28),0 0 0 1px rgba(255,255,255,.65) inset,0 0 0 .5px rgba(10,14,28,.08);overflow:hidden;display:flex;flex-direction:column;animation:onbPop .65s cubic-bezier(.34,1.6,.52,1)}'
      +'body.dark .onb-card{background:linear-gradient(180deg,rgba(32,40,55,.95),rgba(20,26,38,.98));color:#e6edf3;box-shadow:0 32px 80px -16px rgba(0,0,0,.7),0 12px 28px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.08) inset}'
      +'.onb-tint{position:absolute;inset:-35% -35% auto -35%;height:420px;background:radial-gradient(closest-side,var(--onb-tint,#1a3a6b)55,transparent 70%);opacity:.6;filter:blur(12px);pointer-events:none;transition:background 1.1s ease,opacity 1.1s ease;z-index:0}'
      +'.onb-tint2{position:absolute;inset:auto -40% -45% -40%;height:380px;background:radial-gradient(closest-side,var(--onb-tint,#1a3a6b)33,transparent 72%);opacity:.4;filter:blur(18px);pointer-events:none;transition:background 1.1s ease;z-index:0}'
      // ── Header ──
      +'.onb-skip-wrap{position:absolute;top:12px;right:12px;z-index:3;display:flex;gap:4px;align-items:center;background:rgba(255,255,255,.7);border-radius:22px;padding:3px;backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4);box-shadow:0 2px 10px rgba(10,14,28,.08),inset 0 0 0 .5px rgba(10,14,28,.05);transition:background .25s}'
      +'body.dark .onb-skip-wrap{background:rgba(32,40,55,.72);box-shadow:0 2px 10px rgba(0,0,0,.25),inset 0 0 0 .5px rgba(255,255,255,.08)}'
      +'.onb-skip{background:transparent;border:none;color:#3c3c43;font:600 12.5px/1 -apple-system,system-ui,Inter,sans-serif;padding:7px 11px;border-radius:18px;cursor:pointer;transition:background .2s,transform .15s;letter-spacing:.2px;white-space:nowrap}'
      +'.onb-skip:hover{background:rgba(120,120,128,.18)}.onb-skip:active{transform:scale(.95)}'
      +'body.dark .onb-skip{color:#c9d1d9}'
      +'.onb-skip-confirm{display:flex;gap:4px;align-items:center;animation:onbTextIn .25s cubic-bezier(.2,.8,.2,1)}'
      +'.onb-skip-q{font:500 11px/1 -apple-system,system-ui,Inter,sans-serif;color:#64748b;padding:0 6px 0 10px;white-space:nowrap}'
      +'body.dark .onb-skip-q{color:#9ba9ba}'
      +'.onb-skip-yes{background:rgba(220,38,38,.15);color:#dc2626;padding:6px 10px;border:none;border-radius:14px;font:600 11.5px/1 -apple-system,system-ui,Inter,sans-serif;cursor:pointer;transition:background .15s,transform .12s}'
      +'.onb-skip-yes:hover{background:rgba(220,38,38,.25)}.onb-skip-yes:active{transform:scale(.93)}'
      +'body.dark .onb-skip-yes{background:rgba(248,113,113,.18);color:#f87171}'
      +'.onb-skip-no{background:var(--onb-tint,#1a3a6b);color:#fff;padding:6px 10px;border:none;border-radius:14px;font:600 11.5px/1 -apple-system,system-ui,Inter,sans-serif;cursor:pointer;transition:background .15s,transform .12s}'
      +'.onb-skip-no:active{transform:scale(.93)}'
      // ── Progress bar ──
      +'.onb-progress{position:absolute;top:0;left:0;right:0;height:3px;background:rgba(120,120,128,.12);overflow:hidden;z-index:3}'
      +'.onb-progress-bar{height:100%;width:0%;background:linear-gradient(90deg,var(--onb-tint,#1a3a6b),color-mix(in srgb,var(--onb-tint,#1a3a6b) 50%,#fff));transition:width .6s cubic-bezier(.2,.8,.2,1);box-shadow:0 0 14px color-mix(in srgb,var(--onb-tint,#1a3a6b) 60%,transparent)}'
      // ── Body / slide ──
      +'.onb-body{position:relative;z-index:1;padding:48px 28px 16px;display:flex;flex-direction:column;align-items:center;text-align:center;flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;touch-action:pan-y;scrollbar-width:none}'
      +'.onb-body::-webkit-scrollbar{display:none}'
      +'.onb-demo{width:100%;max-width:360px;margin:0 auto 22px;min-height:160px;display:flex;align-items:center;justify-content:center;color:var(--onb-tint,#1a3a6b)}'
      +'.onb-eyebrow{font:700 10.5px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:var(--onb-tint,#1a3a6b);opacity:.88;margin-bottom:10px;animation:onbTextIn .6s cubic-bezier(.34,1.56,.64,1) .42s both}'
      +'.onb-title{font:700 28px/1.16 -apple-system,system-ui,"SF Pro Display",Inter,sans-serif;letter-spacing:-.6px;color:#0f1f3d;margin:0 0 12px;background:linear-gradient(180deg,#0f1f3d,color-mix(in srgb,#0f1f3d 75%,var(--onb-tint,#1a3a6b)));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:onbTextIn .6s cubic-bezier(.34,1.56,.64,1) .58s both}'
      +'body.dark .onb-title{background:linear-gradient(180deg,#f0f6fc,color-mix(in srgb,#f0f6fc 72%,var(--onb-tint,#58a6ff)));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}'
      +'.onb-subtitle{font:400 15.5px/1.52 -apple-system,system-ui,Inter,sans-serif;color:#4b5563;max-width:360px;margin:0 0 6px;animation:onbTextIn .6s cubic-bezier(.34,1.56,.64,1) .74s both}'
      +'body.dark .onb-subtitle{color:#9ba9ba}'
      // Les démos patientent la fin du slide-in avant de démarrer
      +'.onb-demo{opacity:0;transition:opacity .45s cubic-bezier(.2,.8,.2,1)}'
      +'.onb-demo.ready{opacity:1}'
      +'.onb-demo [class^="dmo-"],.onb-demo [class*=" dmo-"]{animation-play-state:paused}'
      +'.onb-demo.ready [class^="dmo-"],.onb-demo.ready [class*=" dmo-"]{animation-play-state:running}'
      // ── Dots + actions ──
      +'.onb-dots{display:flex;gap:6px;justify-content:center;padding:12px 0 4px;position:relative;z-index:1}'
      +'.onb-dot{width:6px;height:6px;border-radius:999px;background:rgba(120,120,128,.3);transition:all .45s cubic-bezier(.34,1.56,.64,1);cursor:pointer;border:none;padding:0}'
      +'.onb-dot.active{width:22px;background:var(--onb-tint,#1a3a6b);box-shadow:0 0 10px color-mix(in srgb,var(--onb-tint,#1a3a6b) 50%,transparent)}'
      +'body.dark .onb-dot{background:rgba(255,255,255,.18)}'
      +'.onb-actions{position:relative;z-index:1;display:flex;gap:10px;padding:10px 22px max(22px,env(safe-area-inset-bottom));align-items:center;border-top:.5px solid rgba(120,120,128,.15)}'
      +'body.dark .onb-actions{border-top-color:rgba(255,255,255,.08)}'
      +'.onb-btn{flex:1;padding:14px 18px;border-radius:14px;border:none;cursor:pointer;font:600 15px/1 -apple-system,system-ui,Inter,sans-serif;transition:transform .18s cubic-bezier(.34,1.56,.64,1),background .2s,box-shadow .2s;letter-spacing:.1px;min-height:48px}'
      +'.onb-btn-ghost{background:rgba(120,120,128,.12);color:#1a3a6b}.onb-btn-ghost:hover{background:rgba(120,120,128,.22)}'
      +'body.dark .onb-btn-ghost{background:rgba(255,255,255,.08);color:#c9d1d9}'
      +'.onb-btn-primary{background:linear-gradient(180deg,var(--onb-tint,#1a3a6b),color-mix(in srgb,var(--onb-tint,#1a3a6b) 82%,#000));color:#fff;box-shadow:0 8px 22px -6px color-mix(in srgb,var(--onb-tint,#1a3a6b) 70%,transparent),inset 0 1px 0 rgba(255,255,255,.22)}'
      +'.onb-btn-primary:hover{transform:translateY(-1px);box-shadow:0 12px 28px -6px color-mix(in srgb,var(--onb-tint,#1a3a6b) 78%,transparent)}'
      +'.onb-btn:active{transform:scale(.96)}'
      // ── Slide transitions ──
      +'.onb-slide{animation:onbSlideIn .48s cubic-bezier(.22,.96,.36,1)}'
      +'.onb-slide.exit-left{animation:onbSlideOutL .3s cubic-bezier(.5,0,.75,.4) forwards}'
      +'.onb-slide.exit-right{animation:onbSlideOutR .3s cubic-bezier(.5,0,.75,.4) forwards}'
      // ── Keyframes ──
      +'@keyframes onbFade{from{opacity:0}to{opacity:1}}'
      +'@keyframes onbPop{0%{opacity:0;transform:scale(.88) translateY(24px)}55%{opacity:1}100%{opacity:1;transform:scale(1) translateY(0)}}'
      // Fallback visuel haptic pour iOS (micro-bounce du card)
      +'.onb-card.onb-pop{animation:onbVisualHaptic .22s cubic-bezier(.2,.8,.2,1)}'
      +'@keyframes onbVisualHaptic{0%{transform:scale(1)}40%{transform:scale(1.012)}100%{transform:scale(1)}}'
      +'@keyframes onbTextIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}'
      +'@keyframes onbSlideIn{from{opacity:0;transform:translateX(34px) scale(.98)}to{opacity:1;transform:translateX(0) scale(1)}}'
      +'@keyframes onbSlideOutL{to{opacity:0;transform:translateX(-34px) scale(.98)}}'
      +'@keyframes onbSlideOutR{to{opacity:0;transform:translateX(34px) scale(.98)}}'
      // ╔══════════════════════════════════════════════════════════════╗
      // ║  DÉMOS — styles spécifiques par slide                       ║
      // ╚══════════════════════════════════════════════════════════════╝
      // ── Welcome (logo animé) ──
      +'.dmo-welcome{position:relative;width:150px;height:150px;display:flex;align-items:center;justify-content:center}'
      +'.dmo-logo svg{width:130px;height:130px;color:var(--onb-tint,#1a3a6b);filter:drop-shadow(0 10px 24px color-mix(in srgb,var(--onb-tint,#1a3a6b) 35%,transparent))}'
      +'.dmo-logo .dmo-ring{stroke-dasharray:276;stroke-dashoffset:276;animation:dmoDraw 1.1s cubic-bezier(.2,.8,.2,1) .15s forwards}'
      +'.dmo-logo .dmo-ring2{stroke-dasharray:188;stroke-dashoffset:188;opacity:.55;animation:dmoDraw 1.1s cubic-bezier(.2,.8,.2,1) .3s forwards}'
      +'.dmo-logo .dmo-dot{opacity:0;animation:dmoPop .5s cubic-bezier(.34,1.56,.64,1) .9s forwards}'
      +'.dmo-logo .dmo-smile{stroke-dasharray:72;stroke-dashoffset:72;animation:dmoDraw .8s cubic-bezier(.2,.8,.2,1) 1.1s forwards}'
      +'.dmo-sparks span{position:absolute;width:5px;height:5px;border-radius:50%;background:var(--onb-tint,#1a3a6b);opacity:0;animation:dmoSpark 1.6s cubic-bezier(.2,.8,.2,1) infinite}'
      +'.dmo-sparks span:nth-child(1){top:10%;left:20%;animation-delay:.2s}'
      +'.dmo-sparks span:nth-child(2){top:22%;right:12%;animation-delay:.5s;background:#ff4d9f}'
      +'.dmo-sparks span:nth-child(3){bottom:20%;left:14%;animation-delay:.8s;background:#2563eb}'
      +'.dmo-sparks span:nth-child(4){bottom:12%;right:22%;animation-delay:1.1s;background:#047857}'
      +'.dmo-sparks span:nth-child(5){top:48%;right:4%;animation-delay:1.4s;background:#b45309}'
      +'@keyframes dmoDraw{to{stroke-dashoffset:0}}'
      +'@keyframes dmoPop{0%{opacity:0;transform:scale(0)}60%{opacity:1;transform:scale(1.25)}100%{opacity:1;transform:scale(1)}}'
      +'@keyframes dmoSpark{0%,100%{opacity:0;transform:scale(.5)}40%{opacity:1;transform:scale(1.4)}60%{opacity:.8;transform:scale(1)}}'
      // ── Dashboard ──
      +'.dmo-dash{width:100%;display:flex;flex-direction:column;gap:10px}'
      +'.dmo-dash-row{display:flex;gap:10px}'
      +'.dmo-kpi{flex:1;background:rgba(255,255,255,.78);border:.5px solid rgba(10,14,28,.08);border-radius:14px;padding:12px 12px 10px;position:relative;overflow:hidden;color:var(--c,#1a3a6b);box-shadow:0 4px 14px -6px rgba(10,14,28,.1);animation:dmoKpiIn .55s cubic-bezier(.34,1.56,.64,1) both;text-align:left}'
      +'body.dark .dmo-kpi{background:rgba(32,40,55,.72);border-color:rgba(255,255,255,.06)}'
      +'.dmo-dash-row:nth-child(1) .dmo-kpi:nth-child(1){animation-delay:.1s}.dmo-dash-row:nth-child(1) .dmo-kpi:nth-child(2){animation-delay:.2s}.dmo-dash-row:nth-child(2) .dmo-kpi:nth-child(1){animation-delay:.3s}.dmo-dash-row:nth-child(2) .dmo-kpi:nth-child(2){animation-delay:.4s}'
      +'.dmo-kpi-lbl{font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;opacity:.72}'
      +'.dmo-kpi-val{font:700 20px/1.1 -apple-system,system-ui,"SF Pro Display",Inter,sans-serif;margin-top:3px;letter-spacing:-.4px;font-variant-numeric:tabular-nums}'
      +'.dmo-kpi-spark{position:absolute;bottom:8px;right:8px;width:68px;height:22px;opacity:.85}'
      +'.dmo-kpi-spark svg{width:100%;height:100%;overflow:visible}'
      +'.dmo-kpi-spark-line{stroke-dasharray:120;stroke-dashoffset:120;animation:dmoDraw 1.1s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:inherit}'
      +'.dmo-dash-row:nth-child(1) .dmo-kpi:nth-child(1) .dmo-kpi-spark-line{animation-delay:.55s}'
      +'.dmo-dash-row:nth-child(1) .dmo-kpi:nth-child(2) .dmo-kpi-spark-line{animation-delay:.65s}'
      +'.dmo-dash-row:nth-child(2) .dmo-kpi:nth-child(1) .dmo-kpi-spark-line{animation-delay:.75s}'
      +'.dmo-dash-row:nth-child(2) .dmo-kpi:nth-child(2) .dmo-kpi-spark-line{animation-delay:.85s}'
      +'@keyframes dmoKpiIn{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}'
      // ── Map France ──
      +'.dmo-map{width:100%;height:200px;position:relative;color:var(--onb-tint,#1a3a6b)}'
      +'.dmo-map-svg{width:100%;height:100%}'
      +'.dmo-map-outline{opacity:0;animation:dmoMapOutline 1.4s cubic-bezier(.2,.8,.2,1) .1s forwards;stroke-dasharray:360;stroke-dashoffset:360}'
      +'.dmo-map-corse{animation-delay:.9s;stroke-dasharray:40;stroke-dashoffset:40}'
      +'.dmo-map-fill{opacity:0;animation:dmoFade .8s cubic-bezier(.2,.8,.2,1) 1.1s forwards}'
      +'@keyframes dmoMapOutline{to{opacity:.75;stroke-dashoffset:0}}'
      // Highlights villes (pin gros + halo pulsant + label)
      +'.dmo-hl{opacity:0;animation:dmoPinIn .55s cubic-bezier(.34,1.6,.52,1) var(--dl,0s) forwards}'
      +'.dmo-hl-dot{fill:var(--onb-tint,#0891b2);stroke:#fff;stroke-width:.6}'
      +'.dmo-hl-pulse{fill:var(--onb-tint,#0891b2);opacity:.35;transform-origin:center;transform-box:fill-box;animation:dmoHlPulse 2s ease-out infinite;animation-delay:var(--dl,0s)}'
      +'.dmo-hl-halo{fill:var(--onb-tint,#0891b2);opacity:.15}'
      +'@keyframes dmoHlPulse{0%{transform:scale(.6);opacity:.5}100%{transform:scale(2.2);opacity:0}}'
      +'.dmo-hl-label{font:700 3.2px/1 -apple-system,system-ui,Inter,sans-serif;fill:#0f1f3d;letter-spacing:.15px;opacity:0;animation:dmoFade .5s cubic-bezier(.2,.8,.2,1) var(--dl,0s) forwards;paint-order:stroke;stroke:#fff;stroke-width:.7px;stroke-linejoin:round}'
      +'body.dark .dmo-hl-label{fill:#f0f6fc;stroke:#151b28}'
      +'.dmo-pin{opacity:0;transform-origin:center;animation:dmoPinIn .55s cubic-bezier(.34,1.6,.52,1) var(--dl,0s) forwards}'
      +'.dmo-pin-ring{animation:dmoPinRing 2.2s ease-in-out infinite;animation-delay:var(--dl,0s);transform-origin:center;transform-box:fill-box}'
      +'@keyframes dmoPinIn{0%{opacity:0;transform:scale(0) translateY(-4px)}60%{opacity:1;transform:scale(1.3)}100%{opacity:1;transform:scale(1)}}'
      +'@keyframes dmoPinRing{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.9);opacity:0}}'
      +'.dmo-map-badge{position:absolute;top:8px;left:8px;background:rgba(255,255,255,.92);border:.5px solid rgba(10,14,28,.08);border-radius:10px;padding:7px 11px;font-size:11px;font-weight:600;color:#0f1f3d;box-shadow:0 3px 10px rgba(10,14,28,.08);font-variant-numeric:tabular-nums}'
      +'body.dark .dmo-map-badge{background:rgba(32,40,55,.9);color:#e6edf3;border-color:rgba(255,255,255,.08)}'
      // ── Newform ──
      +'.dmo-newform{width:100%;background:rgba(255,255,255,.85);border:.5px solid rgba(10,14,28,.08);border-radius:16px;padding:16px 16px 14px;color:#0f1f3d;text-align:left;box-shadow:0 6px 20px -8px rgba(10,14,28,.15)}'
      +'body.dark .dmo-newform{background:rgba(32,40,55,.8);border-color:rgba(255,255,255,.06);color:#e6edf3}'
      +'.dmo-nf-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}'
      +'.dmo-nf-title{font-size:13px;font-weight:700}'
      +'.dmo-nf-pill{font-size:10px;padding:3px 8px;border-radius:10px;background:color-mix(in srgb,var(--onb-tint,#1a3a6b) 12%,transparent);color:var(--onb-tint,#1a3a6b);font-weight:700;letter-spacing:.3px}'
      +'.dmo-nf-field{margin-bottom:9px;opacity:0;animation:dmoNfIn .5s cubic-bezier(.2,.8,.2,1) var(--dl,0s) forwards}'
      +'.dmo-nf-field label{display:block;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}'
      +'body.dark .dmo-nf-field label{color:#9ba9ba}'
      +'.dmo-nf-input{background:#fff;border:1px solid rgba(10,14,28,.12);border-radius:10px;padding:8px 10px;font:600 18px/1.2 -apple-system,system-ui,Inter,sans-serif;color:var(--onb-tint,#1a3a6b);font-variant-numeric:tabular-nums;min-height:36px;display:flex;align-items:center;gap:2px}'
      +'body.dark .dmo-nf-input{background:rgba(20,26,38,.9);border-color:rgba(255,255,255,.08);color:#f0f6fc}'
      +'.dmo-nf-caret{display:inline-block;width:2px;height:18px;background:var(--onb-tint,#1a3a6b);border-radius:1px;animation:dmoCaret 1.05s step-end infinite;vertical-align:middle;opacity:.85}'
      +'@keyframes dmoCaret{0%,50%{opacity:.9}51%,100%{opacity:0}}'
      +'.dmo-nf-bar{height:4px;border-radius:3px;background:rgba(120,120,128,.15);margin-top:6px;overflow:hidden;position:relative}'
      +'.dmo-nf-bar::after{content:"";position:absolute;inset:0;width:0;background:linear-gradient(90deg,var(--onb-tint,#1a3a6b),color-mix(in srgb,var(--onb-tint,#1a3a6b) 60%,#fff));border-radius:3px;animation:dmoNfBar .8s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:calc(var(--dl,0s) + .3s)}'
      +'.dmo-nf-field{--w:50%}'
      +'@keyframes dmoNfIn{to{opacity:1}}'
      +'@keyframes dmoNfBar{to{width:var(--w,50%)}}'
      +'.dmo-nf-result{margin-top:10px;padding:10px 12px;background:linear-gradient(135deg,color-mix(in srgb,var(--onb-tint,#1a3a6b) 12%,transparent),color-mix(in srgb,var(--onb-tint,#1a3a6b) 6%,transparent));border-radius:10px;opacity:0;animation:dmoNfIn .55s cubic-bezier(.2,.8,.2,1) var(--dl,1.1s) forwards}'
      +'.dmo-nf-row{display:flex;justify-content:space-between;align-items:center;font-size:11.5px;padding:3px 0;color:#64748b}'
      +'.dmo-nf-row b{color:var(--onb-tint,#1a3a6b);font-weight:700;font-size:14px;font-variant-numeric:tabular-nums}'
      +'body.dark .dmo-nf-row{color:#9ba9ba}'
      // ── Chart ──
      +'.dmo-chart{width:100%;color:var(--onb-tint,#1a3a6b);position:relative}'
      +'.dmo-chart svg{width:100%;height:auto;filter:drop-shadow(0 8px 20px color-mix(in srgb,var(--onb-tint,#1a3a6b) 30%,transparent))}'
      +'.dmo-line{stroke-dasharray:640;stroke-dashoffset:640;animation:dmoDraw 1.6s cubic-bezier(.2,.8,.2,1) .15s forwards}'
      +'.dmo-area{opacity:0;animation:dmoFade .7s cubic-bezier(.2,.8,.2,1) 1s forwards}'
      +'.dmo-chart-tip{opacity:0;animation:dmoPop .45s cubic-bezier(.34,1.56,.64,1) 1.5s forwards}'
      +'.dmo-chart-pulse{transform-origin:center;transform-box:fill-box;animation:dmoPulse 2s ease-in-out 1.6s infinite}'
      +'@keyframes dmoFade{to{opacity:1}}'
      +'@keyframes dmoPulse{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(2.2);opacity:0}}'
      +'.dmo-chart-legend{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:11px;color:#64748b;padding:0 4px}'
      +'.dmo-chart-legend i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:6px;vertical-align:middle;background:var(--onb-tint,#047857)}'
      +'.dmo-chart-legend b{font-size:15px;color:var(--onb-tint,#1a3a6b);font-weight:700;font-variant-numeric:tabular-nums}'
      // ── Chalandise (carte live) ──
      +'.dmo-chal{width:100%;display:flex;flex-direction:column;gap:10px;color:var(--onb-tint,#7c3aed)}'
      +'.dmo-chal-map{position:relative;height:210px;background:linear-gradient(135deg,#f4f7fb,#eef2f8);border-radius:16px;overflow:hidden;border:.5px solid rgba(10,14,28,.08);box-shadow:0 10px 30px -10px rgba(10,14,28,.2)}'
      +'body.dark .dmo-chal-map{background:linear-gradient(135deg,#1a2030,#151b28);border-color:rgba(255,255,255,.06)}'
      +'.dmo-chal-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(10,14,28,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(10,14,28,.05) 1px,transparent 1px);background-size:22px 22px;opacity:.9}'
      +'body.dark .dmo-chal-grid{background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)}'
      +'.dmo-chal-streets{position:absolute;inset:0;width:100%;height:100%;color:#1a3a6b}'
      +'body.dark .dmo-chal-streets{color:#79b8ff}'
      +'.dmo-chal-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);border-radius:50%;border:1.8px dashed var(--c,#9B59B6);background:radial-gradient(closest-side,color-mix(in srgb,var(--c,#9B59B6) 10%,transparent),transparent 70%);animation:dmoChalRing .9s cubic-bezier(.34,1.6,.52,1) forwards,dmoChalBreathe 3.2s ease-in-out 2s infinite;display:flex;align-items:flex-start;justify-content:center;pointer-events:none;will-change:transform,opacity}'
      +'.dmo-chal-ring.r1{width:68px;height:68px;border-style:solid;animation-delay:.3s,2s}'
      +'.dmo-chal-ring.r2{width:130px;height:130px;animation-delay:.55s,2.4s}'
      +'.dmo-chal-ring.r3{width:200px;height:200px;animation-delay:.8s,2.8s}'
      +'@keyframes dmoChalBreathe{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.035)}}'
      +'.dmo-chal-lbl{position:absolute;top:-11px;background:#fff;border:.5px solid color-mix(in srgb,var(--c,#9B59B6) 40%,transparent);color:var(--c,#9B59B6);font:600 9.5px/1 -apple-system,system-ui,Inter,sans-serif;padding:3px 8px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 8px rgba(10,14,28,.1);opacity:0;animation:dmoFade .5s cubic-bezier(.2,.8,.2,1) 1.2s forwards}'
      +'body.dark .dmo-chal-lbl{background:rgba(32,40,55,.95)}'
      +'@keyframes dmoChalRing{0%{opacity:0;transform:translate(-50%,-50%) scale(0)}60%{opacity:1}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}'
      +'.dmo-chal-pin{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;display:flex;align-items:center;justify-content:center;z-index:2;animation:dmoPop .5s cubic-bezier(.34,1.6,.52,1) .2s both}'
      +'.dmo-chal-pin-core{width:16px;height:16px;background:#0F6E56;border:3px solid #fff;border-radius:50%;box-shadow:0 3px 10px rgba(15,110,86,.45);z-index:3}'
      +'.dmo-chal-pulse{position:absolute;width:16px;height:16px;border-radius:50%;background:#0F6E56;opacity:.45;animation:dmoPinRingBig 2s ease-out infinite}'
      +'.dmo-chal-pulse.d2{animation-delay:1s}'
      +'@keyframes dmoPinRingBig{0%{transform:scale(1);opacity:.55}100%{transform:scale(4.5);opacity:0}}'
      +'.dmo-chal-marker{position:absolute;width:26px;height:26px;border-radius:50%;background:var(--c,#378ADD);border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;box-shadow:0 3px 10px rgba(10,14,28,.25);opacity:0;transform:scale(0);animation:dmoPop .5s cubic-bezier(.34,1.6,.52,1) forwards}'
      +'.dmo-chal-marker:nth-of-type(4){animation-delay:1.3s}'
      +'.dmo-chal-marker:nth-of-type(5){animation-delay:1.45s}'
      +'.dmo-chal-marker:nth-of-type(6){animation-delay:1.6s}'
      +'.dmo-chal-tmja{position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,.94);border:.5px solid rgba(10,14,28,.08);border-radius:10px;padding:5px 9px;font-size:10px;font-weight:600;color:#0f1f3d;opacity:0;animation:dmoFade .5s cubic-bezier(.2,.8,.2,1) 1.7s forwards;font-variant-numeric:tabular-nums}'
      +'.dmo-chal-tmja b{color:#D85A30}'
      +'body.dark .dmo-chal-tmja{background:rgba(32,40,55,.92);color:#e6edf3;border-color:rgba(255,255,255,.08)}'
      +'.dmo-chal-stats{display:flex;gap:8px}'
      +'.dmo-chal-stat{flex:1;background:rgba(255,255,255,.85);border:.5px solid rgba(10,14,28,.08);border-radius:12px;padding:9px 10px;text-align:left;opacity:0;animation:dmoKpiIn .5s cubic-bezier(.34,1.6,.52,1) forwards}'
      +'.dmo-chal-stat:nth-child(1){animation-delay:1.4s}.dmo-chal-stat:nth-child(2){animation-delay:1.55s}.dmo-chal-stat:nth-child(3){animation-delay:1.7s}'
      +'body.dark .dmo-chal-stat{background:rgba(32,40,55,.72);border-color:rgba(255,255,255,.06)}'
      +'.dmo-chal-stat-lbl{font-size:9.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#64748b;margin-bottom:2px}'
      +'.dmo-chal-stat-val{font:700 15px/1.1 -apple-system,system-ui,Inter,sans-serif;color:var(--onb-tint,#7c3aed);font-variant-numeric:tabular-nums}'
      +'body.dark .dmo-chal-stat-lbl{color:#9ba9ba}'
      // ── Timeline ──
      +'.dmo-tl{width:100%;display:flex;align-items:center;justify-content:space-between;padding:0 4px;position:relative}'
      +'.dmo-tl-step{display:flex;flex-direction:column;align-items:center;flex:0 0 auto;position:relative;opacity:0;animation:dmoTlStepIn .6s cubic-bezier(.34,1.6,.52,1) var(--dl,0s) forwards}'
      +'.dmo-tl-node{width:32px;height:32px;border-radius:50%;background:var(--onb-tint,#b45309);border:3px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 12px color-mix(in srgb,var(--onb-tint,#b45309) 40%,transparent);z-index:2}'
      +'body.dark .dmo-tl-node{border-color:#151b28}'
      +'.dmo-tl-node svg{width:18px;height:18px;stroke-dasharray:22;stroke-dashoffset:22;animation:dmoDraw .4s cubic-bezier(.2,.8,.2,1) calc(var(--dl,0s) + .4s) forwards}'
      +'.dmo-tl-txt{margin-top:8px;text-align:center}'
      +'.dmo-tl-lbl{font-size:10.5px;font-weight:700;color:#0f1f3d;letter-spacing:.1px}'
      +'body.dark .dmo-tl-lbl{color:#e6edf3}'
      +'.dmo-tl-date{font-size:9px;color:#94a3b8;font-weight:600;margin-top:1px;font-variant-numeric:tabular-nums}'
      +'.dmo-tl-line{position:absolute;top:16px;left:100%;width:calc(100% * .54);height:2px;background:linear-gradient(90deg,var(--onb-tint,#b45309),color-mix(in srgb,var(--onb-tint,#b45309) 40%,transparent));transform-origin:left;transform:scaleX(0);animation:dmoTlLine .5s cubic-bezier(.2,.8,.2,1) calc(var(--dl,0s) + .3s) forwards;z-index:1}'
      +'@keyframes dmoTlStepIn{0%{opacity:0;transform:scale(.6) translateY(8px)}60%{opacity:1;transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}'
      +'@keyframes dmoTlLine{to{transform:scaleX(1)}}'
      // ── Chat ──
      +'.dmo-chat{width:100%;display:flex;flex-direction:column;gap:6px;text-align:left}'
      +'.dmo-chat-bubble{max-width:78%;padding:8px 12px;border-radius:14px;font-size:12.5px;line-height:1.4;opacity:0;animation:dmoChatIn .45s cubic-bezier(.34,1.6,.52,1) var(--dl,0s) forwards;position:relative}'
      +'.dmo-chat-bubble b{display:block;font-size:10px;font-weight:700;margin-bottom:2px;opacity:.7;letter-spacing:.3px;text-transform:uppercase}'
      +'.dmo-chat-bubble.left{align-self:flex-start;background:rgba(120,120,128,.14);color:#0f1f3d;border-bottom-left-radius:6px}'
      +'.dmo-chat-bubble.right{align-self:flex-end;background:var(--onb-tint,#db2777);color:#fff;border-bottom-right-radius:6px;box-shadow:0 4px 14px -4px color-mix(in srgb,var(--onb-tint,#db2777) 60%,transparent)}'
      +'body.dark .dmo-chat-bubble.left{background:rgba(255,255,255,.10);color:#e6edf3}'
      +'@keyframes dmoChatIn{0%{opacity:0;transform:translateY(10px) scale(.95)}60%{opacity:1;transform:translateY(0) scale(1.02)}100%{opacity:1;transform:translateY(0) scale(1)}}'
      // Typing indicator (3 dots qui sautent)
      +'.dmo-chat-typing{display:flex;align-items:center;gap:6px;padding:8px 12px;background:rgba(120,120,128,.14);border-radius:14px;max-width:78%;opacity:0;animation:dmoChatIn .35s cubic-bezier(.34,1.56,.64,1) var(--dl,0s) forwards,dmoChatFade .3s ease-out calc(var(--dl,0s) + var(--hide,.5s)) forwards}'
      +'.dmo-chat-typing.left{align-self:flex-start;border-bottom-left-radius:6px}'
      +'.dmo-chat-typing.right{align-self:flex-end;border-bottom-right-radius:6px;background:color-mix(in srgb,var(--onb-tint,#db2777) 18%,transparent)}'
      +'body.dark .dmo-chat-typing.left{background:rgba(255,255,255,.10)}'
      +'.dmo-chat-typing b{font-size:10px;font-weight:700;opacity:.7;letter-spacing:.3px;text-transform:uppercase;color:#0f1f3d}'
      +'body.dark .dmo-chat-typing b{color:#e6edf3}'
      +'.dmo-chat-typing.right b{color:var(--onb-tint,#db2777)}'
      +'.dmo-chat-dots{display:flex;gap:3px;align-items:center}'
      +'.dmo-chat-dots span{width:5px;height:5px;background:#6b7280;border-radius:50%;animation:dmoDotBounce 1s ease-in-out infinite}'
      +'.dmo-chat-typing.right .dmo-chat-dots span{background:var(--onb-tint,#db2777)}'
      +'.dmo-chat-dots span:nth-child(2){animation-delay:.15s}.dmo-chat-dots span:nth-child(3){animation-delay:.3s}'
      +'@keyframes dmoDotBounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-3px);opacity:1}}'
      +'@keyframes dmoChatFade{to{opacity:0;transform:scale(.85);height:0;padding:0;margin:0;overflow:hidden}}'
      +'.dmo-chat-task{display:flex;align-items:center;gap:10px;margin-top:4px;padding:10px 12px;background:#fff;border:.5px solid rgba(10,14,28,.1);border-radius:12px;box-shadow:0 4px 14px -4px rgba(10,14,28,.12);opacity:0;animation:dmoChatIn .5s cubic-bezier(.34,1.6,.52,1) var(--dl,0s) forwards;align-self:stretch}'
      +'body.dark .dmo-chat-task{background:rgba(32,40,55,.9);border-color:rgba(255,255,255,.08)}'
      +'.dmo-chat-task-ico{font-size:20px}'
      +'.dmo-chat-task-body{flex:1;text-align:left}'
      +'.dmo-chat-task-title{font-size:12.5px;font-weight:700;color:#0f1f3d}'
      +'body.dark .dmo-chat-task-title{color:#e6edf3}'
      +'.dmo-chat-task-meta{font-size:10px;color:#94a3b8;margin-top:1px}'
      +'.dmo-chat-task-check{width:24px;height:24px;border-radius:50%;background:var(--onb-tint,#db2777);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}'
      // ── Mobile / Phone mockup ──
      +'.dmo-mobile{display:flex;align-items:center;justify-content:center;width:100%;height:220px}'
      +'.dmo-phone{width:130px;height:220px;background:#0f1f3d;border-radius:24px;padding:6px;box-shadow:0 20px 50px -10px rgba(10,14,28,.5),inset 0 0 0 1px rgba(255,255,255,.08);position:relative;animation:dmoPhoneIn .7s cubic-bezier(.34,1.6,.52,1) both}'
      +'@keyframes dmoPhoneIn{from{opacity:0;transform:translateY(16px) rotate(-6deg) scale(.9)}to{opacity:1;transform:translateY(0) rotate(-3deg) scale(1)}}'
      +'.dmo-phone-notch{position:absolute;top:6px;left:50%;transform:translateX(-50%);width:42px;height:10px;background:#000;border-radius:0 0 8px 8px;z-index:2}'
      +'.dmo-phone-screen{width:100%;height:100%;background:linear-gradient(180deg,#f7faff,#eef3f8);border-radius:18px;overflow:hidden;position:relative;padding:18px 8px 4px;display:flex;flex-direction:column;gap:5px}'
      +'body.dark .dmo-phone-screen{background:linear-gradient(180deg,#1a2030,#151b28)}'
      +'.dmo-phone-status{font-size:8.5px;color:#64748b;text-align:center;font-weight:700;letter-spacing:.3px}'
      +'.dmo-phone-card{background:#fff;border-radius:8px;padding:5px 7px;box-shadow:0 2px 6px rgba(10,14,28,.06);display:flex;justify-content:space-between;align-items:center}'
      +'body.dark .dmo-phone-card{background:rgba(32,40,55,.9)}'
      +'.dmo-phone-title{font-size:8px;font-weight:700;color:#0f1f3d}'
      +'body.dark .dmo-phone-title{color:#e6edf3}'
      +'.dmo-phone-chip{font-size:7px;padding:2px 5px;background:#d1fae5;color:#065f46;border-radius:6px;font-weight:700;letter-spacing:.2px}'
      +'.dmo-phone-tabs{display:flex;gap:2px;background:rgba(120,120,128,.15);padding:2px;border-radius:6px}'
      +'.dmo-phone-tabs span{flex:1;text-align:center;font-size:7px;font-weight:600;color:#64748b;padding:3px 2px;border-radius:4px}'
      +'.dmo-phone-tabs .active{background:#fff;color:#0f1f3d;box-shadow:0 1px 2px rgba(10,14,28,.08)}'
      +'body.dark .dmo-phone-tabs .active{background:rgba(88,166,255,.15);color:#e6edf3}'
      +'.dmo-phone-kpi{display:flex;gap:4px}'
      +'.dmo-phone-kpi>div{flex:1;background:#fff;border-radius:6px;padding:4px 5px;box-shadow:0 1px 3px rgba(10,14,28,.05)}'
      +'body.dark .dmo-phone-kpi>div{background:rgba(32,40,55,.9)}'
      +'.dmo-phone-kpi small{font-size:6.5px;color:#94a3b8;display:block;text-transform:uppercase;font-weight:700;letter-spacing:.3px}'
      +'.dmo-phone-kpi b{font-size:9px;color:var(--onb-tint,#475569);font-weight:700}'
      +'.dmo-phone-nav{display:flex;gap:4px;margin-top:auto;padding:4px 2px;background:rgba(255,255,255,.75);border-radius:8px;backdrop-filter:blur(8px)}'
      +'body.dark .dmo-phone-nav{background:rgba(32,40,55,.7)}'
      +'.dmo-phone-nav span{flex:1;text-align:center;font-size:11px;padding:3px 0;filter:grayscale(1);opacity:.5}'
      +'.dmo-phone-nav .active{filter:none;opacity:1}'
      +'.dmo-phone-tap{position:absolute;bottom:10%;left:50%;transform:translateX(-50%);width:22px;height:22px;border-radius:50%;background:radial-gradient(closest-side,rgba(26,58,107,.65),rgba(26,58,107,.1));border:1.5px solid rgba(26,58,107,.7);animation:dmoTap 1.8s cubic-bezier(.2,.8,.2,1) 1s infinite;opacity:0;z-index:3;pointer-events:none}'
      +'body.dark .dmo-phone-tap{background:radial-gradient(closest-side,rgba(255,255,255,.7),rgba(255,255,255,.1));border-color:rgba(255,255,255,.6)}'
      +'@keyframes dmoTap{0%,100%{opacity:0;transform:translateX(-50%) scale(.6)}20%{opacity:.95;transform:translateX(-50%) scale(1)}40%{opacity:.55;transform:translateX(-50%) scale(1.5)}60%{opacity:0;transform:translateX(-50%) scale(1.9)}}'
      // ── Ready / Sparkles ──
      +'.dmo-ready{position:relative;width:160px;height:160px;display:flex;align-items:center;justify-content:center;color:var(--onb-tint,#1a3a6b)}'
      +'.dmo-ready-svg{width:140px;height:140px;filter:drop-shadow(0 10px 30px color-mix(in srgb,var(--onb-tint,#1a3a6b) 50%,transparent))}'
      +'.dmo-ready-ring{stroke-dasharray:289;stroke-dashoffset:289;animation:dmoDraw 1s cubic-bezier(.2,.8,.2,1) .1s forwards}'
      +'.dmo-ready-check{stroke-dasharray:48;stroke-dashoffset:48;animation:dmoDraw .6s cubic-bezier(.2,.8,.2,1) 1s forwards}'
      +'.dmo-ready-spark{position:absolute;top:50%;left:50%;width:var(--s,6px);height:var(--s,6px);margin-top:calc(var(--s,6px) / -2);margin-left:calc(var(--s,6px) / -2);background:var(--onb-tint,#1a3a6b);border-radius:50%;transform:rotate(var(--a,0deg)) translateX(0);opacity:0;animation:dmoSparkFly 1.2s cubic-bezier(.22,.96,.36,1) calc(1.2s + var(--dl,0s)) forwards}'
      +'.dmo-ready-spark:nth-child(2n){background:#ff4d9f}.dmo-ready-spark:nth-child(3n){background:#2563eb}.dmo-ready-spark:nth-child(5n){background:#047857}.dmo-ready-spark:nth-child(7n){background:#b45309}'
      +'@keyframes dmoSparkFly{0%{opacity:0;transform:rotate(var(--a,0deg)) translateX(0) scale(.3)}30%{opacity:1;transform:rotate(var(--a,0deg)) translateX(calc(var(--l,60px) * .5)) scale(1)}100%{opacity:0;transform:rotate(var(--a,0deg)) translateX(var(--l,60px)) scale(.4)}}'
      // ── Célébration finale (flash + burst confettis) ──
      +'.onb-flash{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(255,255,255,.85),transparent 70%);pointer-events:none;z-index:18;opacity:0;animation:onbFlash .9s cubic-bezier(.2,.8,.2,1) forwards;border-radius:inherit}'
      +'body.dark .onb-flash{background:radial-gradient(ellipse at center,rgba(255,255,255,.35),transparent 70%)}'
      +'@keyframes onbFlash{0%{opacity:0}20%{opacity:1}100%{opacity:0}}'
      +'.onb-burst{position:fixed;inset:0;pointer-events:none;z-index:100000;display:flex;align-items:center;justify-content:center;overflow:visible}'
      +'.onb-burst span{position:absolute;top:50%;left:50%;width:var(--s,8px);height:var(--s,8px);margin-top:calc(var(--s,8px) / -2);margin-left:calc(var(--s,8px) / -2);border-radius:2px;transform:rotate(var(--a,0deg)) translateX(0) scale(0);opacity:0;animation:onbBurst 1.1s cubic-bezier(.22,.96,.36,1) var(--dl,0s) forwards}'
      +'.onb-burst span:nth-child(3n){border-radius:50%}.onb-burst span:nth-child(5n){border-radius:1px;width:calc(var(--s,8px) * 1.8);height:calc(var(--s,8px) * .35)}'
      +'@keyframes onbBurst{0%{opacity:0;transform:rotate(var(--a,0deg)) translateX(0) scale(.3) rotate(0)}20%{opacity:1;transform:rotate(var(--a,0deg)) translateX(calc(var(--l,80px) * .3)) scale(1.1) rotate(120deg)}100%{opacity:0;transform:rotate(var(--a,0deg)) translateX(var(--l,80px)) scale(.4) rotate(720deg) translateY(40px)}}'
      // ── Responsive & accessibilité ──
      +'@media(max-width:480px){.onb-card{width:100%;max-width:none;border-radius:26px}.onb-body{padding:42px 20px 14px}.onb-title{font-size:24px}.onb-subtitle{font-size:14.5px}.onb-actions{padding:10px 16px max(16px,env(safe-area-inset-bottom))}.onb-demo{min-height:140px}.dmo-map{height:170px}.dmo-chal-map{height:190px}.dmo-mobile{height:200px}.dmo-phone{width:118px;height:200px}.dmo-welcome,.dmo-ready{width:130px;height:130px}.dmo-logo svg,.dmo-ready-svg{width:112px;height:112px}}'
      +'@media(prefers-reduced-motion:reduce){.onb-overlay,.onb-card,.onb-slide,[class^="dmo-"],[class*=" dmo-"]{animation:none!important;transition:none!important}.dmo-line,.dmo-ready-ring,.dmo-ready-check,.dmo-logo .dmo-ring,.dmo-logo .dmo-ring2,.dmo-logo .dmo-smile{stroke-dashoffset:0!important}[class*="-pulse"],[class*="-ring"]{animation:none!important}}';
    var st=document.createElement('style');
    st.id='onb-tour-style';st.textContent=css;
    document.head.appendChild(st);
  }

  var _state={idx:0,overlay:null,done:false};

  // Haptic avec fallback visuel sur iOS Safari (pas de Vibration API)
  var _hasVibrate=!!navigator.vibrate&&!(/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream);
  function _haptic(n){
    try{
      if(_hasVibrate&&navigator.vibrate)navigator.vibrate(n||10);
      else _visualHaptic();
    }catch(e){}
  }
  function _visualHaptic(){
    // Micro scale-pop sur le card, imite la sensation d'haptic sur iOS
    if(!_state.overlay)return;
    var card=_state.overlay.querySelector('.onb-card');
    if(!card)return;
    card.classList.remove('onb-pop');void card.offsetWidth;
    card.classList.add('onb-pop');
  }

  function _renderSlide(){
    var step=STEPS[_state.idx];
    var card=_state.overlay.querySelector('.onb-card');
    card.style.setProperty('--onb-tint',step.tint);
    _state.overlay.style.setProperty('--onb-tint',step.tint);
    // Orbit contrôlé : la tint tourne lentement autour du centre selon l'index
    var a=(_state.idx/STEPS.length)*Math.PI*2;
    var mx=50+Math.cos(a)*28,my=35+Math.sin(a)*20;
    _state.overlay.style.setProperty('--mx',mx.toFixed(1)+'%');
    _state.overlay.style.setProperty('--my',my.toFixed(1)+'%');
    var tint=card.querySelector('.onb-tint');tint.style.background='radial-gradient(closest-side,'+step.tint+'66,transparent 70%)';
    var tint2=card.querySelector('.onb-tint2');if(tint2)tint2.style.background='radial-gradient(closest-side,'+step.tint+'33,transparent 72%)';
    var slide=card.querySelector('.onb-slide');
    var demoHtml=(DEMOS[step.demo]&&DEMOS[step.demo]())||'';
    slide.innerHTML=''
      +(demoHtml?'<div class="onb-demo">'+demoHtml+'</div>':'')
      +'<div class="onb-eyebrow">'+step.eyebrow+'</div>'
      +'<h2 class="onb-title">'+step.title+'</h2>'
      +'<p class="onb-subtitle">'+step.subtitle+'</p>';
    // Décale le démarrage des animations de démo pour qu'elles commencent après le slide-in
    var demoEl=slide.querySelector('.onb-demo');
    if(demoEl){
      setTimeout(function(){
        demoEl.classList.add('ready');
        _animateCounters(demoEl);
      },380);
    }
    // Dots
    var dotsWrap=card.querySelector('.onb-dots');
    dotsWrap.innerHTML='';
    STEPS.forEach(function(s,i){
      var d=document.createElement('button');
      d.className='onb-dot'+(i===_state.idx?' active':'');
      d.setAttribute('aria-label','\u00c9tape '+(i+1)+' sur '+STEPS.length);
      d.onclick=function(){_goto(i);};
      dotsWrap.appendChild(d);
    });
    // Progress
    var prog=card.querySelector('.onb-progress-bar');
    prog.style.width=((_state.idx+1)/STEPS.length*100)+'%';
    // Buttons
    var actions=card.querySelector('.onb-actions');
    actions.innerHTML='';
    if(_state.idx>0){
      var back=document.createElement('button');back.className='onb-btn onb-btn-ghost';back.textContent='Retour';
      back.onclick=function(){_goto(_state.idx-1);};
      actions.appendChild(back);
    }
    var next=document.createElement('button');next.className='onb-btn onb-btn-primary';
    next.textContent=step.isLast?'Commencer':'Continuer';
    next.onclick=function(){
      if(step.isLast)_celebrateAndFinish();
      else _goto(_state.idx+1);
    };
    actions.appendChild(next);
  }

  function _goto(i){
    if(i<0||i>=STEPS.length||i===_state.idx)return;
    _haptic(10);
    var slide=_state.overlay.querySelector('.onb-slide');
    var dir=i>_state.idx?'left':'right';
    slide.classList.add('exit-'+dir);
    setTimeout(function(){
      _state.idx=i;
      slide.classList.remove('exit-left','exit-right','onb-slide');
      void slide.offsetWidth;
      slide.classList.add('onb-slide');
      _renderSlide();
    },240);
  }

  function _celebrateAndFinish(){
    if(!_state.overlay)return;
    // Haptic pattern court-court-long pour "victoire" (fallback visuel iOS)
    try{
      if(_hasVibrate&&navigator.vibrate)navigator.vibrate([18,50,18,50,40]);
      else{_visualHaptic();setTimeout(_visualHaptic,90);setTimeout(_visualHaptic,200);}
    }catch(e){}
    var card=_state.overlay.querySelector('.onb-card');
    // Flash blanc léger (clipé dans le card)
    var flash=document.createElement('div');
    flash.className='onb-flash';
    card.appendChild(flash);
    // Burst de confettis (attaché à l'overlay pour que ça sorte du card)
    var burst=document.createElement('div');burst.className='onb-burst';
    var colors=['#1a3a6b','#ff4d9f','#2563eb','#047857','#b45309','#7c3aed','#0891b2','#db2777'];
    for(var i=0;i<40;i++){
      var p=document.createElement('span');
      var ang=Math.random()*360;
      var dist=100+Math.random()*180;
      var sz=5+Math.random()*6;
      var dl=Math.random()*.18;
      var c=colors[Math.floor(Math.random()*colors.length)];
      p.style.cssText='--a:'+ang+'deg;--l:'+dist+'px;--s:'+sz+'px;--dl:'+dl.toFixed(2)+'s;background:'+c;
      burst.appendChild(p);
    }
    _state.overlay.appendChild(burst);
    setTimeout(function(){_finish();},900);
  }

  function _finish(){
    _haptic(18);
    if(!_state.overlay)return;
    _state.overlay.style.animation='onbFade .35s cubic-bezier(.2,.8,.2,1) reverse forwards';
    setTimeout(function(){
      if(_state.overlay&&_state.overlay.parentNode)_state.overlay.parentNode.removeChild(_state.overlay);
      // Retirer aussi les bursts éventuellement attachés à body
      var strayBurst=document.querySelectorAll('.onb-burst');
      strayBurst.forEach(function(b){if(b.parentNode)b.parentNode.removeChild(b);});
      _state.overlay=null;_state.done=true;
      document.removeEventListener('keydown',_onKey);
      // Restore scroll body iOS-safe : restaure styles ET scrollTop
      var bs=_state._bodyStyles||{};
      document.body.style.position=bs.position||'';
      document.body.style.top=bs.top||'';
      document.body.style.left=bs.left||'';
      document.body.style.right=bs.right||'';
      document.body.style.width=bs.width||'';
      document.body.style.overflow=bs.overflow||'';
      document.documentElement.style.overflow=_state._htmlOv||'';
      if(typeof _state._scrollY==='number')window.scrollTo(0,_state._scrollY);
    },320);
  }

  function _onKey(e){
    if(!_state.overlay)return;
    if(e.key==='Escape'){
      // Escape toujours dismiss (raccourci expert)
      _finish();_dismiss();
    }
    else if(e.key==='ArrowRight')_goto(_state.idx+1);
    else if(e.key==='ArrowLeft')_goto(_state.idx-1);
  }

  function _onSkipClick(e){
    if(!_state.overlay)return;
    var wrap=_state.overlay.querySelector('.onb-skip-wrap');
    var tgt=e.target;
    // Ignore clics qui ne sont pas sur un bouton du wrap
    if(!tgt||!tgt.closest)return;
    if(tgt.closest('.onb-skip-yes')){_finish();_dismiss();return;}
    if(tgt.closest('.onb-skip-no')){_renderSkipIdle(wrap);_haptic(8);return;}
    if(tgt.closest('.onb-skip')){
      _haptic(10);
      wrap.innerHTML=''
        +'<div class="onb-skip-confirm">'
        +  '<span class="onb-skip-q">Sûr ?</span>'
        +  '<button class="onb-skip-yes" aria-label="Oui, passer">Oui</button>'
        +  '<button class="onb-skip-no" aria-label="Non, continuer">Non</button>'
        +'</div>';
      // Auto-rollback après 3.5s sans action
      clearTimeout(_state._skipTimer);
      _state._skipTimer=setTimeout(function(){
        if(_state.overlay&&wrap.querySelector('.onb-skip-confirm'))_renderSkipIdle(wrap);
      },3500);
    }
  }

  function _renderSkipIdle(wrap){
    clearTimeout(_state._skipTimer);
    wrap.innerHTML='<button class="onb-skip" aria-label="Passer le tutoriel">Passer</button>';
  }

  function _bindSwipe(el){
    var sx=0,sy=0,tracking=false;
    el.addEventListener('touchstart',function(e){
      var t=e.touches[0];sx=t.clientX;sy=t.clientY;tracking=true;
    },{passive:true});
    el.addEventListener('touchend',function(e){
      if(!tracking)return;tracking=false;
      var t=e.changedTouches[0];var dx=t.clientX-sx;var dy=t.clientY-sy;
      if(Math.abs(dx)<50||Math.abs(dy)>Math.abs(dx)*0.7)return;
      if(dx<0)_goto(_state.idx+1);else _goto(_state.idx-1);
    },{passive:true});
  }

  function startOnboardingTour(){
    if(_state.overlay)return;
    _ensureStyles();
    _state.idx=0;_state.done=false;
    var ov=document.createElement('div');
    ov.className='onb-overlay';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Pr\u00e9sentation ISSEO');
    ov.innerHTML=''
      +'<div class="onb-card">'
      +  '<div class="onb-progress"><div class="onb-progress-bar"></div></div>'
      +  '<div class="onb-tint"></div>'
      +  '<div class="onb-tint2"></div>'
      +  '<div class="onb-skip-wrap">'
      +    '<button class="onb-skip" aria-label="Passer le tutoriel">Passer</button>'
      +  '</div>'
      +  '<div class="onb-body"><div class="onb-slide"></div></div>'
      +  '<div class="onb-dots"></div>'
      +  '<div class="onb-actions"></div>'
      +'</div>';
    document.body.appendChild(ov);
    _state.overlay=ov;
    // Lock scroll iOS-safe : save scrollY et position:fixed body (Safari ne respecte pas overflow:hidden seul)
    _state._scrollY=window.scrollY||document.documentElement.scrollTop||0;
    _state._bodyStyles={
      position:document.body.style.position,
      top:document.body.style.top,
      left:document.body.style.left,
      right:document.body.style.right,
      width:document.body.style.width,
      overflow:document.body.style.overflow
    };
    _state._htmlOv=document.documentElement.style.overflow;
    document.body.style.position='fixed';
    document.body.style.top='-'+_state._scrollY+'px';
    document.body.style.left='0';
    document.body.style.right='0';
    document.body.style.width='100%';
    document.body.style.overflow='hidden';
    document.documentElement.style.overflow='hidden';
    ov.querySelector('.onb-skip-wrap').addEventListener('click',_onSkipClick);
    _renderSlide();
    document.addEventListener('keydown',_onKey);
    _bindSwipe(ov.querySelector('.onb-card'));
  }

  function maybeStartOnboardingTour(){
    if(_state.overlay||_state.done)return;
    if(_dismissed())return;
    if(typeof S==='undefined'||!S.user)return;
    var c=_count();
    if(c>=MAX_SHOWS)return;
    _setCount(c+1);
    setTimeout(startOnboardingTour,650);
  }

  window.startOnboardingTour=startOnboardingTour;
  window.maybeStartOnboardingTour=maybeStartOnboardingTour;
  window.resetOnboardingTour=function(){try{localStorage.removeItem(LS_COUNT_PREFIX+_uid());localStorage.removeItem(LS_DISMISS_PREFIX+_uid());}catch(e){}return 'reset';};
})();
