// ════════════════════════════════════════════════════════════════════════════
// ── Page "Comment ça marche" — didactique immersive (mobile + web) ──
// ════════════════════════════════════════════════════════════════════════════
// Page d'accueil de découverte : hero immersif + grille bento de 6 chapitres.
// Chaque chapitre ouvre une modal fullscreen avec un storyboard animé
// (3 étapes) qui explique la feature + CTA pour la tester dans la vraie app.

(function(){
  function _ensureHowStyles(){
    if(document.getElementById('how-styles'))return;
    var css=''
      // ── Hero page ──
      +'.how-page{max-width:1200px;margin:0 auto;padding:16px 20px 80px;animation:howFade .5s cubic-bezier(.2,.8,.2,1)}'
      +'@keyframes howFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}'
      +'.how-hero{position:relative;padding:64px 28px 48px;border-radius:28px;overflow:hidden;margin-bottom:32px;text-align:center;background:linear-gradient(135deg,#0f1f3d,#1e3a8a);color:#fff;box-shadow:0 24px 60px -18px rgba(10,14,28,.45)}'
      +'body.dark .how-hero{background:linear-gradient(135deg,#0a1628,#1a2d52)}'
      +'.how-hero::before{content:"";position:absolute;inset:-30%;background:radial-gradient(closest-side at 30% 20%,rgba(88,166,255,.35),transparent 55%),radial-gradient(closest-side at 75% 80%,rgba(236,72,153,.22),transparent 60%);animation:howHeroOrbit 14s linear infinite;pointer-events:none}'
      +'@keyframes howHeroOrbit{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}'
      +'.how-hero-eyebrow{position:relative;font:700 11px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:2.2px;text-transform:uppercase;color:rgba(255,255,255,.65);margin-bottom:14px}'
      +'.how-hero-title{position:relative;font:700 clamp(30px,5.5vw,52px)/1.08 -apple-system,system-ui,"SF Pro Display",Inter,sans-serif;letter-spacing:-1.2px;margin:0 0 16px;background:linear-gradient(180deg,#fff,#a5c9ff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:howTitleIn .7s cubic-bezier(.34,1.56,.52,1) .1s both}'
      +'@keyframes howTitleIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}'
      +'.how-hero-sub{position:relative;font:400 clamp(15px,1.8vw,18px)/1.5 -apple-system,system-ui,Inter,sans-serif;color:rgba(255,255,255,.78);max-width:620px;margin:0 auto 28px;animation:howTitleIn .7s cubic-bezier(.34,1.56,.52,1) .22s both}'
      +'.how-hero-cta{position:relative;display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.95);color:#0f1f3d;border:none;padding:13px 22px;border-radius:14px;font:600 14.5px/1 -apple-system,system-ui,Inter,sans-serif;cursor:pointer;box-shadow:0 10px 30px -10px rgba(0,0,0,.5);transition:transform .2s cubic-bezier(.34,1.56,.52,1),box-shadow .2s;animation:howTitleIn .7s cubic-bezier(.34,1.56,.52,1) .35s both}'
      +'.how-hero-cta:hover{transform:translateY(-2px);box-shadow:0 18px 42px -12px rgba(0,0,0,.55)}'
      +'.how-hero-cta:active{transform:scale(.97)}'
      +'.how-hero-cta svg{width:16px;height:16px}'
      // Floating particles hero
      +'.how-hero-particle{position:absolute;width:6px;height:6px;border-radius:50%;background:#fff;opacity:.25;pointer-events:none;animation:howParticle 6s ease-in-out infinite}'
      +'@keyframes howParticle{0%,100%{transform:translateY(0) scale(1);opacity:.15}50%{transform:translateY(-14px) scale(1.25);opacity:.4}}'
      // ── Grille bento ──
      +'.how-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:16px}'
      +'.how-card{position:relative;border-radius:22px;overflow:hidden;background:#fff;border:.5px solid rgba(10,14,28,.08);box-shadow:0 4px 14px -6px rgba(10,14,28,.1);cursor:pointer;transition:transform .35s cubic-bezier(.22,.96,.36,1),box-shadow .35s,border-color .25s;min-height:260px;display:flex;flex-direction:column;padding:22px 20px 20px;opacity:0;animation:howCardIn .55s cubic-bezier(.34,1.56,.52,1) forwards}'
      +'body.dark .how-card{background:linear-gradient(180deg,#1c2433,#151b28);border-color:rgba(255,255,255,.06)}'
      +'.how-card:hover{transform:translateY(-6px) scale(1.01);box-shadow:0 22px 48px -18px rgba(10,14,28,.32),0 0 0 1px color-mix(in srgb,var(--ac,#2563eb) 35%,transparent)}'
      +'.how-card:active{transform:translateY(-2px) scale(.99)}'
      +'.how-card:nth-child(1){animation-delay:.05s}.how-card:nth-child(2){animation-delay:.12s}.how-card:nth-child(3){animation-delay:.19s}.how-card:nth-child(4){animation-delay:.26s}.how-card:nth-child(5){animation-delay:.33s}.how-card:nth-child(6){animation-delay:.40s}'
      +'@keyframes howCardIn{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}'
      +'.how-card.sz-2{grid-column:span 2}.how-card.sz-3{grid-column:span 3}.how-card.sz-4{grid-column:span 4}'
      +'.how-card-tint{position:absolute;inset:-30% -30% auto -30%;height:180px;background:radial-gradient(closest-side,color-mix(in srgb,var(--ac,#2563eb) 25%,transparent),transparent 72%);opacity:.85;pointer-events:none;filter:blur(8px)}'
      +'.how-card-ico{position:relative;width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,color-mix(in srgb,var(--ac,#2563eb) 18%,#fff),#fff);color:var(--ac,#2563eb);display:flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 6px 16px -6px color-mix(in srgb,var(--ac,#2563eb) 45%,transparent),inset 0 1px 0 rgba(255,255,255,.85)}'
      +'body.dark .how-card-ico{background:linear-gradient(135deg,color-mix(in srgb,var(--ac,#2563eb) 30%,#21262d),#21262d);box-shadow:0 6px 16px -6px color-mix(in srgb,var(--ac,#2563eb) 50%,transparent),inset 0 1px 0 rgba(255,255,255,.06)}'
      +'.how-card-ico svg{width:26px;height:26px}'
      +'.how-card-eyebrow{position:relative;font:700 10.5px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:var(--ac,#2563eb);margin-bottom:6px}'
      +'.how-card-title{position:relative;font:700 20px/1.2 -apple-system,system-ui,"SF Pro Display",Inter,sans-serif;letter-spacing:-.35px;color:#0f1f3d;margin:0 0 8px}'
      +'body.dark .how-card-title{color:#f0f6fc}'
      +'.how-card-desc{position:relative;font:400 14px/1.5 -apple-system,system-ui,Inter,sans-serif;color:#4b5563;margin:0 0 auto;max-width:420px}'
      +'body.dark .how-card-desc{color:#9ba9ba}'
      +'.how-card-arrow{position:relative;margin-top:16px;display:inline-flex;align-items:center;gap:6px;font:600 13px/1 -apple-system,system-ui,Inter,sans-serif;color:var(--ac,#2563eb);transition:gap .2s}'
      +'.how-card:hover .how-card-arrow{gap:10px}'
      +'.how-card-arrow svg{width:14px;height:14px;transition:transform .2s}'
      +'.how-card:hover .how-card-arrow svg{transform:translateX(3px)}'
      +'.how-card-duration{position:absolute;top:14px;right:14px;background:rgba(120,120,128,.12);color:#64748b;font:600 10.5px/1 -apple-system,system-ui,Inter,sans-serif;padding:5px 9px;border-radius:10px;letter-spacing:.2px;display:flex;align-items:center;gap:4px}'
      +'body.dark .how-card-duration{background:rgba(255,255,255,.08);color:#9ba9ba}'
      +'.how-card-duration svg{width:10px;height:10px}'
      // ── Modal fullscreen storyboard ──
      +'.how-modal{position:fixed;inset:0;height:100vh;height:100dvh;z-index:9999;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 30% 20%,rgba(26,58,107,.55),rgba(10,14,28,.82));backdrop-filter:blur(28px) saturate(1.4);-webkit-backdrop-filter:blur(28px) saturate(1.4);animation:howFade .35s cubic-bezier(.2,.8,.2,1);padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))}'
      +'.how-modal-card{position:relative;width:min(860px,100%);max-height:min(860px,100vh);max-height:min(860px,100dvh);background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,250,255,.94));border-radius:28px;box-shadow:0 32px 80px -16px rgba(10,14,28,.6),0 0 0 1px rgba(255,255,255,.6) inset;overflow:hidden;display:flex;flex-direction:column;animation:howModalPop .6s cubic-bezier(.34,1.6,.52,1)}'
      +'body.dark .how-modal-card{background:linear-gradient(180deg,#1c2433,#151b28);color:#e6edf3;box-shadow:0 32px 80px -16px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.08) inset}'
      +'@keyframes howModalPop{0%{opacity:0;transform:scale(.92) translateY(20px)}55%{opacity:1}100%{opacity:1;transform:scale(1) translateY(0)}}'
      +'.how-modal-tint{position:absolute;inset:-30% -30% auto -30%;height:360px;background:radial-gradient(closest-side,var(--ac,#2563eb)55,transparent 70%);opacity:.55;filter:blur(14px);pointer-events:none;transition:background 1s}'
      +'.how-modal-header{position:relative;z-index:2;display:flex;align-items:center;gap:12px;padding:20px 24px 14px;border-bottom:.5px solid rgba(120,120,128,.15)}'
      +'body.dark .how-modal-header{border-bottom-color:rgba(255,255,255,.08)}'
      +'.how-modal-ico{width:36px;height:36px;border-radius:11px;background:color-mix(in srgb,var(--ac,#2563eb) 14%,#fff);color:var(--ac,#2563eb);display:flex;align-items:center;justify-content:center;flex-shrink:0}'
      +'body.dark .how-modal-ico{background:color-mix(in srgb,var(--ac,#2563eb) 22%,#21262d)}'
      +'.how-modal-ico svg{width:20px;height:20px}'
      +'.how-modal-titles{flex:1;min-width:0}'
      +'.how-modal-eyebrow{font:700 10.5px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:var(--ac,#2563eb);margin-bottom:3px}'
      +'.how-modal-title{font:700 18px/1.2 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;letter-spacing:-.3px}'
      +'body.dark .how-modal-title{color:#f0f6fc}'
      +'.how-modal-close{background:rgba(120,120,128,.14);border:none;width:34px;height:34px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#3c3c43;transition:background .2s,transform .15s;flex-shrink:0}'
      +'.how-modal-close:hover{background:rgba(120,120,128,.24)}.how-modal-close:active{transform:scale(.92)}'
      +'body.dark .how-modal-close{background:rgba(255,255,255,.10);color:#c9d1d9}'
      +'.how-modal-close svg{width:16px;height:16px}'
      +'.how-modal-body{position:relative;z-index:1;flex:1;overflow-y:auto;overflow-x:hidden;padding:24px 24px 8px;min-height:0;display:flex;flex-direction:column;gap:20px;-webkit-overflow-scrolling:touch;scrollbar-width:none}'
      +'.how-modal-body::-webkit-scrollbar{display:none}'
      +'.how-stage{position:relative;width:100%;aspect-ratio:16/9;border-radius:18px;overflow:hidden;background:linear-gradient(135deg,color-mix(in srgb,var(--ac,#2563eb) 6%,#f5f7fb),#fff);border:.5px solid rgba(10,14,28,.06);display:flex;align-items:center;justify-content:center;padding:20px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.8),0 12px 40px -18px rgba(10,14,28,.2)}'
      +'body.dark .how-stage{background:linear-gradient(135deg,color-mix(in srgb,var(--ac,#2563eb) 12%,#1a2030),#151b28);border-color:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px rgba(255,255,255,.04),0 12px 40px -18px rgba(0,0,0,.5)}'
      +'.how-step{position:absolute;inset:20px;display:flex;align-items:center;justify-content:center;opacity:0;transform:translateX(30px);transition:opacity .4s cubic-bezier(.2,.8,.2,1),transform .55s cubic-bezier(.22,.96,.36,1)}'
      +'.how-step.active{opacity:1;transform:translateX(0)}'
      +'.how-step.past{opacity:0;transform:translateX(-30px);transition:opacity .3s,transform .4s}'
      +'.how-caption{text-align:center;padding:0 10px}'
      +'.how-caption-num{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--ac,#2563eb);color:#fff;font:700 12px/1 -apple-system,system-ui,Inter,sans-serif;margin-right:8px;vertical-align:middle}'
      +'.how-caption-title{font:700 17px/1.3 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;margin:0 0 6px;letter-spacing:-.2px;display:inline-block}'
      +'body.dark .how-caption-title{color:#f0f6fc}'
      +'.how-caption-text{font:400 14.5px/1.55 -apple-system,system-ui,Inter,sans-serif;color:#4b5563;max-width:620px;margin:0 auto}'
      +'body.dark .how-caption-text{color:#9ba9ba}'
      +'.how-modal-controls{position:relative;z-index:2;padding:12px 22px max(22px,env(safe-area-inset-bottom));display:flex;align-items:center;gap:10px;border-top:.5px solid rgba(120,120,128,.15)}'
      +'body.dark .how-modal-controls{border-top-color:rgba(255,255,255,.08)}'
      +'.how-dots{display:flex;gap:6px;flex:1;justify-content:center}'
      +'.how-dot{width:7px;height:7px;border-radius:999px;background:rgba(120,120,128,.3);border:none;cursor:pointer;transition:all .35s cubic-bezier(.34,1.56,.52,1);padding:0}'
      +'.how-dot.active{width:22px;background:var(--ac,#2563eb);box-shadow:0 0 10px color-mix(in srgb,var(--ac,#2563eb) 55%,transparent)}'
      +'body.dark .how-dot{background:rgba(255,255,255,.18)}'
      +'.how-ctrl-btn{background:rgba(120,120,128,.14);border:none;width:38px;height:38px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#1a3a6b;transition:background .2s,transform .15s}'
      +'.how-ctrl-btn:hover{background:rgba(120,120,128,.22)}.how-ctrl-btn:active{transform:scale(.92)}'
      +'.how-ctrl-btn:disabled{opacity:.35;cursor:not-allowed}'
      +'body.dark .how-ctrl-btn{background:rgba(255,255,255,.1);color:#e6edf3}'
      +'.how-ctrl-btn svg{width:16px;height:16px}'
      +'.how-cta{background:linear-gradient(180deg,var(--ac,#2563eb),color-mix(in srgb,var(--ac,#2563eb) 82%,#000));color:#fff;border:none;padding:10px 18px;border-radius:13px;font:600 13.5px/1 -apple-system,system-ui,Inter,sans-serif;cursor:pointer;box-shadow:0 6px 18px -6px color-mix(in srgb,var(--ac,#2563eb) 65%,transparent),inset 0 1px 0 rgba(255,255,255,.22);transition:transform .2s cubic-bezier(.34,1.56,.52,1),box-shadow .2s;display:flex;align-items:center;gap:6px;flex-shrink:0}'
      +'.how-cta:hover{transform:translateY(-1px)}.how-cta:active{transform:scale(.97)}'
      +'.how-cta svg{width:13px;height:13px}'
      +'.how-progress-bar{position:absolute;top:0;left:0;right:0;height:3px;background:rgba(120,120,128,.12);overflow:hidden;z-index:3}'
      +'.how-progress-fill{height:100%;width:0%;background:linear-gradient(90deg,var(--ac,#2563eb),color-mix(in srgb,var(--ac,#2563eb) 55%,#fff));transition:width .15s linear;box-shadow:0 0 12px color-mix(in srgb,var(--ac,#2563eb) 60%,transparent)}'
      // ── Responsive ──
      +'@media(max-width:900px){.how-grid{grid-template-columns:repeat(2,1fr)}.how-card.sz-2,.how-card.sz-3,.how-card.sz-4{grid-column:span 1}}'
      +'@media(max-width:640px){.how-page{padding:14px 14px 100px}.how-hero{padding:48px 22px 36px;border-radius:22px}.how-grid{grid-template-columns:1fr;gap:12px}.how-card{min-height:220px;padding:18px 16px}.how-card-title{font-size:18px}.how-modal-card{border-radius:22px;max-height:calc(100dvh - 20px)}.how-modal-header{padding:16px 18px 12px}.how-modal-title{font-size:16px}.how-modal-body{padding:18px 16px 6px;gap:14px}.how-stage{border-radius:14px;padding:14px}.how-step{inset:14px}.how-caption-title{font-size:15.5px}.how-caption-text{font-size:13.5px}.how-modal-controls{padding:10px 14px max(14px,env(safe-area-inset-bottom))}}'
      +'@media(prefers-reduced-motion:reduce){.how-hero::before,.how-hero-particle,.how-card,.how-modal-card,.how-step{animation:none!important;transition:none!important}}'
      // ── Styles des démos (stage content) ──
      +'.sb-kpi-row{display:flex;gap:10px;width:100%;max-width:560px}'
      +'.sb-kpi{flex:1;background:rgba(255,255,255,.85);border:.5px solid rgba(10,14,28,.08);border-radius:12px;padding:12px 14px;opacity:0;animation:sbFadeUp .5s cubic-bezier(.34,1.56,.52,1) var(--dl,0s) forwards;text-align:left;color:var(--ac,#2563eb)}'
      +'body.dark .sb-kpi{background:rgba(32,40,55,.7);border-color:rgba(255,255,255,.06)}'
      +'.sb-kpi b{display:block;font:700 22px/1.1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:-.3px;margin-top:4px;font-variant-numeric:tabular-nums}'
      +'.sb-kpi span{font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;opacity:.72}'
      +'@keyframes sbFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'
      +'.sb-pulse{width:110px;height:110px;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--ac,#2563eb) 40%,transparent),transparent 65%);animation:sbPulse 2s ease-in-out infinite;position:relative;display:flex;align-items:center;justify-content:center}'
      +'.sb-pulse::after{content:"";position:absolute;inset:20%;background:var(--ac,#2563eb);border-radius:50%;box-shadow:0 0 0 4px #fff,0 0 30px color-mix(in srgb,var(--ac,#2563eb) 55%,transparent)}'
      +'body.dark .sb-pulse::after{box-shadow:0 0 0 4px #151b28,0 0 30px color-mix(in srgb,var(--ac,#2563eb) 55%,transparent)}'
      +'@keyframes sbPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}'
      +'.sb-list{display:flex;flex-direction:column;gap:8px;width:100%;max-width:420px}'
      +'.sb-list-item{background:rgba(255,255,255,.85);border:.5px solid rgba(10,14,28,.08);border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:10px;opacity:0;animation:sbFadeUp .5s cubic-bezier(.34,1.56,.52,1) var(--dl,0s) forwards}'
      +'body.dark .sb-list-item{background:rgba(32,40,55,.7);border-color:rgba(255,255,255,.06)}'
      +'.sb-list-item .sb-bullet{width:8px;height:8px;border-radius:50%;background:var(--ac,#2563eb);flex-shrink:0;box-shadow:0 0 0 3px color-mix(in srgb,var(--ac,#2563eb) 20%,transparent)}'
      +'.sb-list-item .sb-txt{font:500 13.5px/1.35 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;flex:1}'
      +'body.dark .sb-list-item .sb-txt{color:#e6edf3}'
      +'.sb-list-item .sb-val{font:700 13.5px/1 -apple-system,system-ui,Inter,sans-serif;color:var(--ac,#2563eb);font-variant-numeric:tabular-nums}'
      +'.sb-chart{width:100%;max-width:480px;height:160px;position:relative}'
      +'.sb-chart svg{width:100%;height:100%}'
      +'.sb-chart .sb-chart-line{stroke-dasharray:640;stroke-dashoffset:640;animation:sbDraw 1.6s cubic-bezier(.2,.8,.2,1) .2s forwards}'
      +'@keyframes sbDraw{to{stroke-dashoffset:0}}'
      +'.sb-rings{position:relative;width:220px;height:220px;display:flex;align-items:center;justify-content:center;color:var(--ac,#7c3aed)}'
      +'.sb-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);border-radius:50%;border:1.8px dashed currentColor;background:radial-gradient(closest-side,color-mix(in srgb,currentColor 12%,transparent),transparent 72%);animation:sbRingPop .9s cubic-bezier(.34,1.56,.52,1) var(--dl,0s) forwards,sbRingBreathe 3.2s ease-in-out calc(var(--dl,0s) + 1.2s) infinite}'
      +'.sb-ring.r1{width:70px;height:70px;border-style:solid}'
      +'.sb-ring.r2{width:135px;height:135px}'
      +'.sb-ring.r3{width:210px;height:210px}'
      +'.sb-ring-lbl{position:absolute;top:-9px;background:#fff;color:currentColor;font:600 10px/1 -apple-system,system-ui,Inter,sans-serif;padding:3px 8px;border-radius:10px;white-space:nowrap;border:.5px solid currentColor}'
      +'body.dark .sb-ring-lbl{background:#151b28}'
      +'@keyframes sbRingPop{0%{opacity:0;transform:translate(-50%,-50%) scale(0)}60%{opacity:1}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}'
      +'@keyframes sbRingBreathe{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.035)}}'
      +'.sb-timeline{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:560px}'
      +'.sb-tl-node{display:flex;flex-direction:column;align-items:center;gap:6px;flex:0 0 auto;opacity:0;animation:sbFadeUp .5s cubic-bezier(.34,1.56,.52,1) var(--dl,0s) forwards;position:relative}'
      +'.sb-tl-circle{width:30px;height:30px;border-radius:50%;background:var(--ac,#b45309);color:#fff;display:flex;align-items:center;justify-content:center;font:700 12px/1 -apple-system,system-ui,Inter,sans-serif;box-shadow:0 3px 10px color-mix(in srgb,var(--ac,#b45309) 45%,transparent);border:2.5px solid #fff;z-index:2;position:relative}'
      +'body.dark .sb-tl-circle{border-color:#151b28}'
      +'.sb-tl-lbl{font:700 10px/1.15 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;text-align:center;max-width:70px}'
      +'body.dark .sb-tl-lbl{color:#e6edf3}'
      +'.sb-tl-line{position:absolute;top:15px;left:50%;width:calc(100%);height:2px;background:linear-gradient(90deg,var(--ac,#b45309),color-mix(in srgb,var(--ac,#b45309) 35%,transparent));transform-origin:left;transform:scaleX(0);animation:sbTlLine .5s cubic-bezier(.2,.8,.2,1) calc(var(--dl,0s) + .2s) forwards;z-index:1}'
      +'.sb-tl-node:last-child .sb-tl-line{display:none}'
      +'@keyframes sbTlLine{to{transform:scaleX(1)}}'
      +'.sb-chat{display:flex;flex-direction:column;gap:6px;width:100%;max-width:400px}'
      +'.sb-bubble{padding:8px 12px;border-radius:14px;font:500 13px/1.4 -apple-system,system-ui,Inter,sans-serif;max-width:78%;opacity:0;animation:sbBubbleIn .45s cubic-bezier(.34,1.56,.52,1) var(--dl,0s) forwards}'
      +'.sb-bubble.left{align-self:flex-start;background:rgba(120,120,128,.14);color:#0f1f3d;border-bottom-left-radius:6px}'
      +'.sb-bubble.right{align-self:flex-end;background:var(--ac,#db2777);color:#fff;border-bottom-right-radius:6px}'
      +'body.dark .sb-bubble.left{background:rgba(255,255,255,.1);color:#e6edf3}'
      +'.sb-bubble b{display:block;font-size:10px;font-weight:700;opacity:.7;letter-spacing:.3px;text-transform:uppercase;margin-bottom:2px}'
      +'@keyframes sbBubbleIn{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}'
      +'.sb-form{width:100%;max-width:320px;background:rgba(255,255,255,.92);border:.5px solid rgba(10,14,28,.1);border-radius:14px;padding:14px;text-align:left}'
      +'body.dark .sb-form{background:rgba(32,40,55,.75);border-color:rgba(255,255,255,.06)}'
      +'.sb-form-row{margin-bottom:8px;opacity:0;animation:sbFadeUp .5s cubic-bezier(.34,1.56,.52,1) var(--dl,0s) forwards}'
      +'.sb-form-row label{display:block;font:600 9.5px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:.5px;text-transform:uppercase;color:#64748b;margin-bottom:3px}'
      +'body.dark .sb-form-row label{color:#9ba9ba}'
      +'.sb-form-row input{width:100%;background:#fff;border:1px solid rgba(10,14,28,.12);border-radius:9px;padding:7px 10px;font:600 15px/1 -apple-system,system-ui,Inter,sans-serif;color:var(--ac,#0d9488);box-sizing:border-box;font-variant-numeric:tabular-nums}'
      +'body.dark .sb-form-row input{background:rgba(20,26,38,.9);border-color:rgba(255,255,255,.08);color:#f0f6fc}';
    var s=document.createElement('style');s.id='how-styles';s.textContent=css;document.head.appendChild(s);
  }

  // ── Icônes ─────────────────────────────────────────────────────────────
  var IC={
    dashboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    studios:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-8h6v8"/></svg>',
    bp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="6" y="12" width="3" height="7" rx="1"/><rect x="11" y="7" width="3" height="12" rx="1"/><rect x="16" y="4" width="3" height="15" rx="1"/></svg>',
    chalandise:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
    engage:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/><path d="M8 14l3 3 5-6"/></svg>',
    collab:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    play:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
    prev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    next:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
  };

  // ── Chapitres : data + storyboards ─────────────────────────────────────
  var CHAPTERS=[
    {
      id:'accueil',icon:IC.dashboard,accent:'#2563eb',size:'sz-4',
      eyebrow:'Tableau de bord',
      title:'Accueil',
      desc:'Le pouls du réseau. KPIs, alertes, tâches du jour — tout ce qui compte, au premier regard.',
      cta:{label:'Ouvrir mon accueil',action:"setPage('accueil')"},
      steps:[
        {title:'KPIs en direct',text:'Nombre de studios, CAPEX, CA prévisionnel A1 — actualisés dès qu\u2019un BP change.',render:function(){return ''
          +'<div class="sb-kpi-row" style="--ac:#2563eb">'
          +'  <div class="sb-kpi" style="--dl:.1s"><span>Studios</span><b>15</b></div>'
          +'  <div class="sb-kpi" style="--dl:.25s"><span>CAPEX</span><b>4,8 M€</b></div>'
          +'  <div class="sb-kpi" style="--dl:.4s"><span>CA A1</span><b>11,2 M€</b></div>'
          +'</div>';}},
        {title:'Today briefing',text:'Chaque matin, les priorités du jour remontées automatiquement : retards, alertes, rendez-vous.',render:function(){return ''
          +'<div class="sb-list" style="--ac:#2563eb">'
          +'  <div class="sb-list-item" style="--dl:.05s"><span class="sb-bullet"></span><span class="sb-txt">Compromis à signer — Lattes</span><span class="sb-val">J-2</span></div>'
          +'  <div class="sb-list-item" style="--dl:.2s"><span class="sb-bullet"></span><span class="sb-txt">BP à valider — Garches</span><span class="sb-val">Aujourd\u2019hui</span></div>'
          +'  <div class="sb-list-item" style="--dl:.35s"><span class="sb-bullet"></span><span class="sb-txt">Réunion cohorte 3</span><span class="sb-val">16:00</span></div>'
          +'</div>';}},
        {title:'Raccourcis intelligents',text:'Cliquez sur une alerte pour aller directement sur le bon onglet du bon studio. Zéro friction.',render:function(){return '<div class="sb-pulse" style="--ac:#2563eb"></div>';}}
      ]
    },
    {
      id:'studios',icon:IC.studios,accent:'#0891b2',size:'sz-2',
      eyebrow:'Vos studios',
      title:'Studios',
      desc:'Toute la France, chaque studio avec son statut, sa cohorte et son BP.',
      cta:{label:'Voir mes studios',action:"setPage('projets')"},
      steps:[
        {title:'Liste unifiée',text:'Une grille Apple-like. Recherche, tri, filtres — tout est fluide.',render:function(){return ''
          +'<div class="sb-list" style="--ac:#0891b2;max-width:400px">'
          +'  <div class="sb-list-item" style="--dl:.05s"><span class="sb-bullet"></span><span class="sb-txt">Montpellier — Lattes</span><span class="sb-val">En chantier</span></div>'
          +'  <div class="sb-list-item" style="--dl:.18s"><span class="sb-bullet"></span><span class="sb-txt">Paris — Garches</span><span class="sb-val">Ouvert</span></div>'
          +'  <div class="sb-list-item" style="--dl:.31s"><span class="sb-bullet"></span><span class="sb-txt">Toulouse — Cépière</span><span class="sb-val">Prospect</span></div>'
          +'</div>';}},
        {title:'Création rapide',text:'Un formulaire didactique : entrez les adhérents fin A1/A2/A3, le reste se déduit tout seul.',render:function(){return ''
          +'<div class="sb-form" style="--ac:#0891b2">'
          +'  <div class="sb-form-row" style="--dl:.05s"><label>Nom du studio</label><input value="Montpellier — Lattes"/></div>'
          +'  <div class="sb-form-row" style="--dl:.2s"><label>Adhérents fin A1</label><input value="320"/></div>'
          +'  <div class="sb-form-row" style="--dl:.35s"><label>Adhérents fin A3</label><input value="540"/></div>'
          +'</div>';}},
        {title:'Détail complet',text:'Neuf onglets pour tout piloter : workflow, adhérents, BP, engagements, chalandise, fichiers…',render:function(){return '<div class="sb-pulse" style="--ac:#0891b2"></div>';}}
      ]
    },
    {
      id:'bp',icon:IC.bp,accent:'#047857',size:'sz-2',
      eyebrow:'Business Plan',
      title:'BP didactique',
      desc:'Trois chiffres à saisir, 36 mois à l\u2019arrivée. On calcule, vous décidez.',
      cta:{label:'Ouvrir un BP',action:"setPage('projets')"},
      steps:[
        {title:'Saisie intuitive',text:'Adhérents fin A1, A2, A3. Trois inputs. C\u2019est tout ce qu\u2019il vous faut.',render:function(){return ''
          +'<div class="sb-form" style="--ac:#047857">'
          +'  <div class="sb-form-row" style="--dl:.05s"><label>Adhérents fin A1</label><input value="320"/></div>'
          +'  <div class="sb-form-row" style="--dl:.22s"><label>Adhérents fin A2</label><input value="480"/></div>'
          +'  <div class="sb-form-row" style="--dl:.39s"><label>Adhérents fin A3</label><input value="540"/></div>'
          +'</div>';}},
        {title:'Calcul automatique',text:'Pack mix, ARPU, CA mensuel, EBITDA, cash net. Tous les indicateurs, à la volée.',render:function(){return ''
          +'<div class="sb-chart" style="--ac:#047857">'
          +'  <svg viewBox="0 0 480 160" preserveAspectRatio="none"><defs><linearGradient id="sbG1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".3"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>'
          +'    <path class="sb-chart-area" d="M0 140 L60 125 L120 110 L180 85 L240 75 L300 50 L360 40 L420 22 L480 12 L480 160 L0 160 Z" fill="url(#sbG1)"/>'
          +'    <path class="sb-chart-line" d="M0 140 L60 125 L120 110 L180 85 L240 75 L300 50 L360 40 L420 22 L480 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
          +'  </svg>'
          +'</div>';}},
        {title:'Vue 36 mois',text:'Chaque mois détaillé, modifiable individuellement si vous avez des données réelles à injecter.',render:function(){return ''
          +'<div class="sb-list" style="--ac:#047857">'
          +'  <div class="sb-list-item" style="--dl:.05s"><span class="sb-bullet"></span><span class="sb-txt">Mois 1</span><span class="sb-val">—</span></div>'
          +'  <div class="sb-list-item" style="--dl:.15s"><span class="sb-bullet"></span><span class="sb-txt">Mois 12 (A1)</span><span class="sb-val">320 adh.</span></div>'
          +'  <div class="sb-list-item" style="--dl:.25s"><span class="sb-bullet"></span><span class="sb-txt">Mois 24 (A2)</span><span class="sb-val">480 adh.</span></div>'
          +'  <div class="sb-list-item" style="--dl:.35s"><span class="sb-bullet"></span><span class="sb-txt">Mois 36 (A3)</span><span class="sb-val">540 adh.</span></div>'
          +'</div>';}}
      ]
    },
    {
      id:'chalandise',icon:IC.chalandise,accent:'#7c3aed',size:'sz-2',
      eyebrow:'Étude locale',
      title:'Chalandise',
      desc:'500m, 1km, 2km autour du studio. Population, trafic, transports, socio-démo — en live.',
      cta:{label:'Explorer une zone',action:"setPage('projets')"},
      steps:[
        {title:'Trois rayons concentriques',text:'La zone de chalandise classique du Club Pilates, visualisée en cercles animés.',render:function(){return ''
          +'<div class="sb-rings">'
          +'  <div class="sb-ring r1" style="--dl:.1s"></div>'
          +'  <div class="sb-ring r2" style="--dl:.3s"></div>'
          +'  <div class="sb-ring r3" style="--dl:.5s"></div>'
          +'</div>';}},
        {title:'Population & transports',text:'Pour chaque rayon : habitants, densité, arrêts de bus/métro/tram à proximité.',render:function(){return ''
          +'<div class="sb-list" style="--ac:#7c3aed">'
          +'  <div class="sb-list-item" style="--dl:.05s"><span class="sb-bullet"></span><span class="sb-txt">Rayon 500m</span><span class="sb-val">habitants</span></div>'
          +'  <div class="sb-list-item" style="--dl:.18s"><span class="sb-bullet"></span><span class="sb-txt">Rayon 1km</span><span class="sb-val">+ transports</span></div>'
          +'  <div class="sb-list-item" style="--dl:.31s"><span class="sb-bullet"></span><span class="sb-txt">Rayon 2km</span><span class="sb-val">+ socio-démo</span></div>'
          +'</div>';}},
        {title:'Socio-démo détaillée',text:'Revenu médian, part des CSP+, âge moyen, ménages type. Les ingrédients d\u2019une ouverture réussie.',render:function(){return ''
          +'<div class="sb-kpi-row" style="--ac:#7c3aed">'
          +'  <div class="sb-kpi" style="--dl:.1s"><span>Revenu</span><b>médian</b></div>'
          +'  <div class="sb-kpi" style="--dl:.25s"><span>CSP+</span><b>%</b></div>'
          +'  <div class="sb-kpi" style="--dl:.4s"><span>Densité</span><b>/km²</b></div>'
          +'</div>';}}
      ]
    },
    {
      id:'engagements',icon:IC.engage,accent:'#b45309',size:'sz-3',
      eyebrow:'Workflow',
      title:'Engagements',
      desc:'Du compromis à l\u2019ouverture, une timeline claire. Zéro échéance oubliée, zéro relance manuelle.',
      cta:{label:'Voir le récap',action:"setPage('engagements')"},
      steps:[
        {title:'Timeline visuelle',text:'Toutes les étapes clés d\u2019une ouverture de studio, sur une seule ligne lisible.',render:function(){return ''
          +'<div class="sb-timeline">'
          +'  <div class="sb-tl-node" style="--dl:.05s;--ac:#b45309"><div class="sb-tl-circle">1</div><div class="sb-tl-lbl">Compromis</div><div class="sb-tl-line"></div></div>'
          +'  <div class="sb-tl-node" style="--dl:.18s;--ac:#b45309"><div class="sb-tl-circle">2</div><div class="sb-tl-lbl">Permis</div><div class="sb-tl-line"></div></div>'
          +'  <div class="sb-tl-node" style="--dl:.31s;--ac:#b45309"><div class="sb-tl-circle">3</div><div class="sb-tl-lbl">Travaux</div><div class="sb-tl-line"></div></div>'
          +'  <div class="sb-tl-node" style="--dl:.44s;--ac:#b45309"><div class="sb-tl-circle">4</div><div class="sb-tl-lbl">Formation</div><div class="sb-tl-line"></div></div>'
          +'  <div class="sb-tl-node" style="--dl:.57s;--ac:#b45309"><div class="sb-tl-circle">5</div><div class="sb-tl-lbl">Ouverture</div></div>'
          +'</div>';}},
        {title:'Check-list intelligente',text:'Chaque étape : date prévue vs date réelle. L\u2019app calcule les décalages toute seule.',render:function(){return ''
          +'<div class="sb-list" style="--ac:#b45309">'
          +'  <div class="sb-list-item" style="--dl:.05s"><span class="sb-bullet"></span><span class="sb-txt">Compromis signé</span><span class="sb-val">✓</span></div>'
          +'  <div class="sb-list-item" style="--dl:.18s"><span class="sb-bullet"></span><span class="sb-txt">Permis accordé</span><span class="sb-val">✓</span></div>'
          +'  <div class="sb-list-item" style="--dl:.31s"><span class="sb-bullet"></span><span class="sb-txt">Travaux</span><span class="sb-val">En cours</span></div>'
          +'</div>';}},
        {title:'Alertes préventives',text:'Un ping sur votre mobile à J-7 de chaque échéance. Impossible de laisser glisser un dossier.',render:function(){return '<div class="sb-pulse" style="--ac:#b45309"></div>';}}
      ]
    },
    {
      id:'collab',icon:IC.collab,accent:'#db2777',size:'sz-3',
      eyebrow:'Équipe',
      title:'Collab',
      desc:'Messages, tâches, notifications push. Tout le réseau dans votre poche, synchronisé en temps réel.',
      cta:{label:'Ouvrir Collab',action:"setPage('collab')"},
      steps:[
        {title:'Conversation par studio',text:'Un fil de discussion dédié à chaque projet. Plus de WhatsApp mélangés.',render:function(){return ''
          +'<div class="sb-chat">'
          +'  <div class="sb-bubble left"  style="--dl:.05s;--ac:#db2777"><b>Paul</b>Le permis est accordé ✅</div>'
          +'  <div class="sb-bubble right" style="--dl:.28s;--ac:#db2777"><b>Clément</b>Parfait, on lance les travaux 🚀</div>'
          +'  <div class="sb-bubble left"  style="--dl:.51s;--ac:#db2777"><b>Paul</b>Je t\u2019assigne la commande équipements.</div>'
          +'</div>';}},
        {title:'Tâches assignées',text:'Créer, assigner à un membre, valider en un swipe. Mobile-first.',render:function(){return ''
          +'<div class="sb-list" style="--ac:#db2777">'
          +'  <div class="sb-list-item" style="--dl:.05s"><span class="sb-bullet"></span><span class="sb-txt">Commande équipements</span><span class="sb-val">@Clément</span></div>'
          +'  <div class="sb-list-item" style="--dl:.18s"><span class="sb-bullet"></span><span class="sb-txt">Valider planning travaux</span><span class="sb-val">@Paul</span></div>'
          +'  <div class="sb-list-item" style="--dl:.31s"><span class="sb-bullet"></span><span class="sb-txt">Formation coachs</span><span class="sb-val">J-30</span></div>'
          +'</div>';}},
        {title:'Notifications push',text:'Dès qu\u2019une tâche bouge, tout le monde le sait. Mobile + desktop.',render:function(){return '<div class="sb-pulse" style="--ac:#db2777"></div>';}}
      ]
    }
  ];

  // ── Rendu page principale ─────────────────────────────────────────────
  function renderHowItWorks(){
    _ensureHowStyles();
    var h='<div class="how-page">';
    // Hero
    h+='<div class="how-hero">';
    for(var i=0;i<8;i++){
      var top=10+Math.random()*80, left=5+Math.random()*90, dl=Math.random()*3;
      h+='<span class="how-hero-particle" style="top:'+top+'%;left:'+left+'%;animation-delay:'+dl.toFixed(2)+'s"></span>';
    }
    h+='<div class="how-hero-eyebrow">Comment ça marche</div>';
    h+='<h1 class="how-hero-title">L\u2019app expliquée,<br/>en animations.</h1>';
    h+='<p class="how-hero-sub">Une démo didactique de chaque rubrique. Cliquez sur un chapitre pour voir la feature en action, puis essayez-la dans la vraie app.</p>';
    h+='<button class="how-hero-cta" onclick="openHowChapter(\''+CHAPTERS[0].id+'\')">'+IC.play+'Lancer la visite</button>';
    h+='</div>';
    // Grille bento
    h+='<div class="how-grid">';
    CHAPTERS.forEach(function(c,idx){
      h+='<div class="how-card '+(c.size||'sz-2')+'" data-how-id="'+c.id+'" onclick="openHowChapter(\''+c.id+'\')" style="--ac:'+c.accent+'">';
      h+=  '<div class="how-card-tint"></div>';
      h+=  '<div class="how-card-duration">'+IC.clock+c.steps.length+' étapes</div>';
      h+=  '<div class="how-card-ico">'+c.icon+'</div>';
      h+=  '<div class="how-card-eyebrow">'+c.eyebrow+'</div>';
      h+=  '<h3 class="how-card-title">'+c.title+'</h3>';
      h+=  '<p class="how-card-desc">'+c.desc+'</p>';
      h+=  '<span class="how-card-arrow">Voir l\u2019animation '+IC.arrow+'</span>';
      h+='</div>';
    });
    h+='</div>';
    h+='</div>';
    return h;
  }

  // ── Modal storyboard ───────────────────────────────────────────────────
  var _modalState={overlay:null,chapter:null,step:0,playing:true,timer:null,_bodyStyles:null,_scrollY:0};
  var STEP_DURATION=5200; // ms par étape

  function openHowChapter(id){
    _ensureHowStyles();
    var chap=CHAPTERS.find(function(c){return c.id===id;});
    if(!chap)return;
    if(_modalState.overlay)_closeModalImmediate();
    _modalState.chapter=chap;_modalState.step=0;_modalState.playing=true;
    // Lock scroll iOS-safe
    _modalState._scrollY=window.scrollY||document.documentElement.scrollTop||0;
    _modalState._bodyStyles={position:document.body.style.position,top:document.body.style.top,left:document.body.style.left,right:document.body.style.right,width:document.body.style.width,overflow:document.body.style.overflow};
    document.body.style.position='fixed';document.body.style.top='-'+_modalState._scrollY+'px';document.body.style.left='0';document.body.style.right='0';document.body.style.width='100%';document.body.style.overflow='hidden';
    var ov=document.createElement('div');
    ov.className='how-modal';
    ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label',chap.title);
    ov.innerHTML=''
      +'<div class="how-modal-card" style="--ac:'+chap.accent+'">'
      +  '<div class="how-progress-bar"><div class="how-progress-fill"></div></div>'
      +  '<div class="how-modal-tint"></div>'
      +  '<div class="how-modal-header">'
      +    '<div class="how-modal-ico">'+chap.icon+'</div>'
      +    '<div class="how-modal-titles"><div class="how-modal-eyebrow">'+chap.eyebrow+'</div><div class="how-modal-title">'+chap.title+'</div></div>'
      +    '<button class="how-modal-close" aria-label="Fermer">'+IC.close+'</button>'
      +  '</div>'
      +  '<div class="how-modal-body">'
      +    '<div class="how-stage"></div>'
      +    '<div class="how-caption"><h4 class="how-caption-title"></h4><p class="how-caption-text"></p></div>'
      +  '</div>'
      +  '<div class="how-modal-controls">'
      +    '<button class="how-ctrl-btn how-prev" aria-label="Précédent">'+IC.prev+'</button>'
      +    '<button class="how-ctrl-btn how-play" aria-label="Pause/Play">'+IC.pause+'</button>'
      +    '<div class="how-dots"></div>'
      +    '<button class="how-ctrl-btn how-next" aria-label="Suivant">'+IC.next+'</button>'
      +    '<button class="how-cta">'+chap.cta.label+IC.arrow+'</button>'
      +  '</div>'
      +'</div>';
    document.body.appendChild(ov);
    _modalState.overlay=ov;
    ov.querySelector('.how-modal-close').onclick=closeHowChapter;
    ov.querySelector('.how-prev').onclick=function(){_goto(_modalState.step-1);};
    ov.querySelector('.how-next').onclick=function(){_goto(_modalState.step+1);};
    ov.querySelector('.how-play').onclick=_togglePlay;
    ov.querySelector('.how-cta').onclick=function(){
      closeHowChapter();
      setTimeout(function(){try{eval(chap.cta.action);}catch(e){console.warn('[how cta]',e);}},380);
    };
    // Swipe close + nav
    _bindSwipe(ov.querySelector('.how-modal-card'));
    // Keyboard
    document.addEventListener('keydown',_onKey);
    // Initial render
    _renderStep();
    _startTimer();
    try{if(navigator.vibrate)navigator.vibrate(8);}catch(e){}
  }

  function _renderStep(){
    if(!_modalState.overlay||!_modalState.chapter)return;
    var chap=_modalState.chapter, step=chap.steps[_modalState.step];
    var card=_modalState.overlay.querySelector('.how-modal-card');
    var stage=card.querySelector('.how-stage');
    var title=card.querySelector('.how-caption-title');
    var text=card.querySelector('.how-caption-text');
    var dots=card.querySelector('.how-dots');
    var prog=card.querySelector('.how-progress-fill');
    var tint=card.querySelector('.how-modal-tint');
    if(tint)tint.style.background='radial-gradient(closest-side,'+chap.accent+'66,transparent 70%)';
    // Render step with transition
    stage.innerHTML='<div class="how-step active">'+step.render()+'</div>';
    title.innerHTML='<span class="how-caption-num">'+(_modalState.step+1)+'</span>'+step.title;
    text.textContent=step.text;
    // Dots
    dots.innerHTML='';
    chap.steps.forEach(function(s,i){
      var d=document.createElement('button');
      d.className='how-dot'+(i===_modalState.step?' active':'');
      d.setAttribute('aria-label','Étape '+(i+1));
      d.onclick=function(){_goto(i);};
      dots.appendChild(d);
    });
    // Progress
    prog.style.width=((_modalState.step+1)/chap.steps.length*100)+'%';
    // Prev/Next disabled states
    card.querySelector('.how-prev').disabled=_modalState.step===0;
    card.querySelector('.how-next').disabled=_modalState.step===chap.steps.length-1;
  }

  function _goto(idx){
    if(!_modalState.chapter)return;
    var max=_modalState.chapter.steps.length;
    if(idx<0||idx>=max||idx===_modalState.step)return;
    _modalState.step=idx;
    _renderStep();
    try{if(navigator.vibrate)navigator.vibrate(6);}catch(e){}
    _startTimer();
  }

  function _startTimer(){
    _stopTimer();
    if(!_modalState.playing)return;
    _modalState.timer=setTimeout(function(){
      if(!_modalState.chapter)return;
      var next=_modalState.step+1;
      if(next>=_modalState.chapter.steps.length){
        // Fin du storyboard : stop auto-play, reste sur dernière étape
        _modalState.playing=false;_updatePlayBtn();return;
      }
      _goto(next);
    },STEP_DURATION);
  }
  function _stopTimer(){if(_modalState.timer){clearTimeout(_modalState.timer);_modalState.timer=null;}}

  function _togglePlay(){
    _modalState.playing=!_modalState.playing;
    _updatePlayBtn();
    if(_modalState.playing){
      if(_modalState.step>=_modalState.chapter.steps.length-1){_modalState.step=0;_renderStep();}
      _startTimer();
    } else _stopTimer();
  }
  function _updatePlayBtn(){
    if(!_modalState.overlay)return;
    var btn=_modalState.overlay.querySelector('.how-play');
    if(btn)btn.innerHTML=_modalState.playing?IC.pause:IC.play;
  }

  function _onKey(e){
    if(!_modalState.overlay)return;
    if(e.key==='Escape')closeHowChapter();
    else if(e.key==='ArrowRight')_goto(_modalState.step+1);
    else if(e.key==='ArrowLeft')_goto(_modalState.step-1);
    else if(e.key===' '){e.preventDefault();_togglePlay();}
  }

  function _bindSwipe(el){
    var sx=0,sy=0,tracking=false;
    el.addEventListener('touchstart',function(e){var t=e.touches[0];sx=t.clientX;sy=t.clientY;tracking=true;},{passive:true});
    el.addEventListener('touchend',function(e){
      if(!tracking)return;tracking=false;
      var t=e.changedTouches[0];var dx=t.clientX-sx;var dy=t.clientY-sy;
      if(Math.abs(dy)>Math.abs(dx)&&dy>80){closeHowChapter();return;}
      if(Math.abs(dx)<50||Math.abs(dy)>Math.abs(dx)*0.7)return;
      if(dx<0)_goto(_modalState.step+1);else _goto(_modalState.step-1);
    },{passive:true});
  }

  function _closeModalImmediate(){
    _stopTimer();
    if(_modalState.overlay&&_modalState.overlay.parentNode)_modalState.overlay.parentNode.removeChild(_modalState.overlay);
    _modalState.overlay=null;_modalState.chapter=null;
    document.removeEventListener('keydown',_onKey);
    var bs=_modalState._bodyStyles||{};
    document.body.style.position=bs.position||'';document.body.style.top=bs.top||'';document.body.style.left=bs.left||'';document.body.style.right=bs.right||'';document.body.style.width=bs.width||'';document.body.style.overflow=bs.overflow||'';
    if(typeof _modalState._scrollY==='number')window.scrollTo(0,_modalState._scrollY);
  }

  function closeHowChapter(){
    if(!_modalState.overlay)return;
    _stopTimer();
    _modalState.overlay.style.animation='howFade .3s cubic-bezier(.2,.8,.2,1) reverse forwards';
    setTimeout(_closeModalImmediate,300);
  }

  // Expose
  window.renderHowItWorks=renderHowItWorks;
  window.openHowChapter=openHowChapter;
  window.closeHowChapter=closeHowChapter;
})();
