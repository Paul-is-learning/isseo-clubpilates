// ════════════════════════════════════════════════════════════════════════════
// ── Page "Comment ça marche" — Launcher minimal ──
// ────────────────────────────────────────────────────────────────────────────
// Décision v4 (2026-04-20) : on remplace le précédent hub didactique animé
// (trop décoratif, pas assez pédagogique) par un launcher qui renvoie vers
// les deux vrais outils d'apprentissage déjà en place :
//   1. Le tour guidé Apple-like (10 slides) — startOnboardingTour()
//   2. Les coach-marks contextuels par page — bouton ❓ en bas de chaque écran
// Les mockups SVG ont été abandonnés au profit de la vraie app.
// ════════════════════════════════════════════════════════════════════════════
(function(){
  'use strict';

  // ── Pages principales accessibles via setPage() ──
  // (liste courte volontairement : les pages où coach-marks existe)
  var QUICK_PAGES=[
    {id:'accueil',label:'Accueil',ico:'🏠',desc:'Briefing du jour · KPIs réseau'},
    {id:'projets',label:'Mes studios',ico:'🏢',desc:'Vue grille + détail studio'},
    {id:'bp',label:'BP consolidé',ico:'📊',desc:'CA réseau · EBITDA global'},
    {id:'prospection',label:'Prospection',ico:'🔍',desc:'Pipeline chaud/tiède/froid'},
    {id:'engagements',label:'Engagements',ico:'📅',desc:'Workflow ouverture studios'},
    {id:'collab',label:'Collab',ico:'💬',desc:'Messages · tâches équipe'},
    {id:'fichiers',label:'Fichiers',ico:'📁',desc:'Docs par studio · Drive'}
  ];

  // ── Styles ─────────────────────────────────────────────────────────────────
  function _ensureStyles(){
    if(document.getElementById('howl-styles'))return;
    var css=''
      +'.howl{max-width:720px;margin:0 auto;padding:32px 20px 120px;animation:howlFade .35s cubic-bezier(.2,.8,.2,1)}'
      +'@keyframes howlFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}'
      // Hero simple
      +'.howl-hero{text-align:center;margin-bottom:32px}'
      +'.howl-eyebrow{font:700 11px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:1.8px;text-transform:uppercase;color:#64748b;margin-bottom:12px}'
      +'body.dark .howl-eyebrow{color:#9ba9ba}'
      +'.howl-title{font:700 clamp(26px,4vw,34px)/1.15 -apple-system,system-ui,"SF Pro Display",Inter,sans-serif;letter-spacing:-.8px;color:#0f1f3d;margin:0 0 10px}'
      +'body.dark .howl-title{color:#f0f6fc}'
      +'.howl-sub{font:400 15px/1.5 -apple-system,system-ui,Inter,sans-serif;color:#64748b;max-width:500px;margin:0 auto}'
      +'body.dark .howl-sub{color:#9ba9ba}'
      // Cards CTA (2 grosses cards : tour guidé + coach-marks)
      +'.howl-ctas{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:36px}'
      +'@media(max-width:600px){.howl-ctas{grid-template-columns:1fr}}'
      +'.howl-cta{position:relative;background:#fff;border:.5px solid rgba(10,14,28,.1);border-radius:18px;padding:22px 20px 20px;cursor:pointer;transition:transform .22s cubic-bezier(.34,1.56,.52,1),box-shadow .22s,border-color .2s;text-align:left;font-family:inherit;color:inherit;box-shadow:0 4px 14px -6px rgba(10,14,28,.12);overflow:hidden}'
      +'body.dark .howl-cta{background:#1c2433;border-color:rgba(255,255,255,.07)}'
      +'.howl-cta:hover{transform:translateY(-3px);box-shadow:0 16px 36px -10px rgba(10,14,28,.22);border-color:var(--ac,#2563eb)}'
      +'.howl-cta:active{transform:scale(.98)}'
      +'.howl-cta-ico{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;background:color-mix(in srgb,var(--ac) 14%,#fff);color:var(--ac);margin-bottom:14px;box-shadow:0 4px 12px -4px color-mix(in srgb,var(--ac) 45%,transparent),inset 0 1px 0 rgba(255,255,255,.85)}'
      +'body.dark .howl-cta-ico{background:color-mix(in srgb,var(--ac) 28%,#21262d)}'
      +'.howl-cta-title{font:700 17px/1.25 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;letter-spacing:-.3px;margin-bottom:5px}'
      +'body.dark .howl-cta-title{color:#f0f6fc}'
      +'.howl-cta-desc{font:400 13px/1.5 -apple-system,system-ui,Inter,sans-serif;color:#64748b;margin-bottom:14px}'
      +'body.dark .howl-cta-desc{color:#9ba9ba}'
      +'.howl-cta-btn{display:inline-flex;align-items:center;gap:7px;background:var(--ac);color:#fff;border:none;border-radius:10px;padding:10px 16px;font:700 13px/1 -apple-system,system-ui,Inter,sans-serif;cursor:pointer;box-shadow:0 4px 12px -3px color-mix(in srgb,var(--ac) 50%,transparent);transition:transform .2s cubic-bezier(.34,1.56,.52,1)}'
      +'.howl-cta-btn:hover{transform:translateY(-1px)}.howl-cta-btn:active{transform:scale(.96)}'
      +'.howl-cta-note{display:inline-flex;align-items:center;gap:6px;font:500 12px/1 -apple-system,system-ui,Inter,sans-serif;color:#64748b}'
      +'body.dark .howl-cta-note{color:#9ba9ba}'
      +'.howl-cta-note b{color:var(--ac);font-weight:700}'
      // Section pages
      +'.howl-section{margin-top:8px}'
      +'.howl-section-title{font:700 11px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:#64748b;margin-bottom:14px;text-align:center}'
      +'body.dark .howl-section-title{color:#9ba9ba}'
      +'.howl-section-sub{font:400 13px/1.5 -apple-system,system-ui,Inter,sans-serif;color:#64748b;text-align:center;margin-bottom:16px;max-width:460px;margin-left:auto;margin-right:auto}'
      +'body.dark .howl-section-sub{color:#9ba9ba}'
      +'.howl-pages{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}'
      +'.howl-page{display:flex;align-items:center;gap:10px;background:#fff;border:.5px solid rgba(10,14,28,.08);border-radius:12px;padding:10px 12px;cursor:pointer;transition:transform .18s,background .15s,border-color .15s;font-family:inherit;text-align:left}'
      +'body.dark .howl-page{background:#1c2433;border-color:rgba(255,255,255,.06)}'
      +'.howl-page:hover{transform:translateY(-1px);background:rgba(37,99,235,.05);border-color:rgba(37,99,235,.25)}'
      +'body.dark .howl-page:hover{background:rgba(37,99,235,.12)}'
      +'.howl-page:active{transform:scale(.98)}'
      +'.howl-page-ico{font-size:18px;line-height:1;flex-shrink:0}'
      +'.howl-page-meta{flex:1;min-width:0}'
      +'.howl-page-label{font:600 13px/1.2 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;margin-bottom:2px}'
      +'body.dark .howl-page-label{color:#f0f6fc}'
      +'.howl-page-desc{font:400 10.5px/1.3 -apple-system,system-ui,Inter,sans-serif;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
      +'body.dark .howl-page-desc{color:#9ba9ba}'
      // Hint ?
      +'.howl-hint{margin-top:24px;padding:14px 16px;background:rgba(59,130,246,.06);border:.5px solid rgba(59,130,246,.15);border-radius:12px;font:500 13px/1.45 -apple-system,system-ui,Inter,sans-serif;color:#1e40af;display:flex;align-items:flex-start;gap:10px}'
      +'body.dark .howl-hint{background:rgba(59,130,246,.12);color:#93c5fd;border-color:rgba(59,130,246,.25)}'
      +'.howl-hint-ico{font-size:16px;line-height:1;flex-shrink:0;margin-top:1px}';
    var s=document.createElement('style');s.id='howl-styles';s.textContent=css;document.head.appendChild(s);
  }

  // ── Rendu ───────────────────────────────────────────────────────────────────
  function renderHowItWorks(){
    _ensureStyles();
    var h='<div class="howl">';

    // ─ Hero ─
    h+='<div class="howl-hero">';
    h+=  '<div class="howl-eyebrow">Apprendre Isseo</div>';
    h+=  '<h1 class="howl-title">Deux façons de maîtriser l\'outil</h1>';
    h+=  '<p class="howl-sub">Un tour guidé pour la vue d\'ensemble, puis un tuto contextuel à la demande sur chaque page que vous visitez.</p>';
    h+='</div>';

    // ─ Cards CTA ─
    h+='<div class="howl-ctas">';
    // CTA 1 : Tour guidé
    h+=  '<button class="howl-cta" style="--ac:#2563eb" onclick="if(typeof startOnboardingTour===\'function\')startOnboardingTour()">';
    h+=    '<div class="howl-cta-ico">▶</div>';
    h+=    '<div class="howl-cta-title">Tour guidé complet</div>';
    h+=    '<div class="howl-cta-desc">10 slides animées qui présentent l\'app en 2 minutes. Idéal pour un premier tour d\'horizon.</div>';
    h+=    '<span class="howl-cta-btn">Lancer le tour →</span>';
    h+=  '</button>';
    // CTA 2 : Coach-marks — bouton play ▶ en bas à gauche de chaque écran
    h+=  '<button class="howl-cta" style="--ac:#6366f1" onclick="(function(){if(typeof startCoachForCurrentPage===\'function\'){setPage(\'accueil\');setTimeout(startCoachForCurrentPage,350);}})()">';
    h+=    '<div class="howl-cta-ico"><svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" style="margin-left:2px"><path d="M8 5v14l11-7z"/></svg></div>';
    h+=    '<div class="howl-cta-title">Tuto contextuel par page</div>';
    h+=    '<div class="howl-cta-desc">Sur chaque écran, un bouton <b>play ▶</b> en bas à gauche (rond indigo) explique les zones importantes. Démarre ici sur l\'Accueil.</div>';
    h+=    '<span class="howl-cta-btn">Ouvrir le tuto Accueil →</span>';
    h+=  '</button>';
    h+='</div>';

    // ─ Accès rapide aux pages (toutes avec coach-marks disponibles) ─
    h+='<div class="howl-section">';
    h+=  '<div class="howl-section-title">Ou aller directement à une page</div>';
    h+=  '<div class="howl-section-sub">Une fois sur la page, cliquez sur le <b>bouton play ▶</b> en bas à gauche pour déclencher le tuto contextuel.</div>';
    h+=  '<div class="howl-pages">';
    QUICK_PAGES.forEach(function(p){
      h+='<button class="howl-page" onclick="setPage(\''+p.id+'\')" title="Aller à '+_esc(p.label)+'">';
      h+=  '<span class="howl-page-ico">'+p.ico+'</span>';
      h+=  '<div class="howl-page-meta"><div class="howl-page-label">'+_esc(p.label)+'</div><div class="howl-page-desc">'+_esc(p.desc)+'</div></div>';
      h+='</button>';
    });
    h+=  '</div>';
    h+='</div>';

    // ─ Hint final ─
    h+='<div class="howl-hint">';
    h+=  '<span class="howl-hint-ico">💡</span>';
    h+=  '<div>Nouveau venu ? Commencez par le <b>tour guidé</b> (2 min). Puis explorez librement — le <b>bouton play ▶ en bas à gauche</b> est là dès que vous en avez besoin.</div>';
    h+='</div>';

    h+='</div>';
    return h;
  }

  // ── Utils ────────────────────────────────────────────────────────────────
  function _esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  // ── Expose ──────────────────────────────────────────────────────────────
  window.renderHowItWorks=renderHowItWorks;
})();
