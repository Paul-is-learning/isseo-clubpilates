// ════════════════════════════════════════════════════════════════════════════
// ── Page "Comment ça marche" v2 — 10/10 immersive learning hub ──
// ════════════════════════════════════════════════════════════════════════════
(function(){
  'use strict';

  // ── LocalStorage helpers ─────────────────────────────────────────────────
  function _lsGet(k){try{return JSON.parse(localStorage.getItem(k)||'null');}catch(e){return null;}}
  function _lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}

  var FAV_KEY='isseo_how_favs';
  var PROG_KEY='isseo_how_prog';

  function _getFavs(){return _lsGet(FAV_KEY)||{};}
  function _toggleFav(id){var f=_getFavs();f[id]=!f[id];if(!f[id])delete f[id];_lsSet(FAV_KEY,f);}
  function _isFav(id){return !!_getFavs()[id];}
  function _getProgress(){return _lsGet(PROG_KEY)||{};}
  function _markDone(id){var p=_getProgress();p[id]=true;_lsSet(PROG_KEY,p);}
  function _isDone(id){return !!_getProgress()[id];}

  // ── Styles ───────────────────────────────────────────────────────────────
  function _ensureStyles(){
    if(document.getElementById('how2-styles'))return;
    var css=''
      // ── Page wrapper ──
      +'.how2{max-width:1200px;margin:0 auto;padding:0 20px 100px;animation:how2Fade .45s cubic-bezier(.2,.8,.2,1)}'
      +'@keyframes how2Fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'
      // ── Hero ──
      +'.how2-hero{position:relative;margin:0 -20px 0;padding:72px 40px 56px;overflow:hidden;text-align:center;background:linear-gradient(145deg,#06111f 0%,#0d1f40 35%,#1a1650 65%,#0f1a35 100%);color:#fff}'
      +'.how2-hero-canvas{position:absolute;inset:0;pointer-events:none;overflow:hidden}'
      +'.how2-orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:.55;animation:how2OrbFloat var(--dur,12s) ease-in-out infinite alternate}'
      +'.how2-orb.o1{width:420px;height:420px;background:radial-gradient(closest-side,#3b4ff8,transparent);top:-120px;left:-60px;--dur:13s}'
      +'.how2-orb.o2{width:380px;height:380px;background:radial-gradient(closest-side,#7c3aed,transparent);top:-80px;right:-80px;--dur:17s}'
      +'.how2-orb.o3{width:300px;height:300px;background:radial-gradient(closest-side,#0891b2,transparent);bottom:-60px;left:35%;--dur:15s}'
      +'@keyframes how2OrbFloat{from{transform:translate(0,0) scale(1)}to{transform:translate(30px,20px) scale(1.08)}}'
      +'.how2-grid-lines{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,#000 30%,transparent 100%)}'
      +'.how2-hero-content{position:relative;z-index:2}'
      +'.how2-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.1);border:.5px solid rgba(255,255,255,.2);padding:6px 14px;border-radius:999px;font:700 10.5px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:1.8px;text-transform:uppercase;color:rgba(255,255,255,.8);margin-bottom:22px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}'
      +'.how2-badge-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80;animation:how2Blink 2s ease-in-out infinite}'
      +'@keyframes how2Blink{0%,100%{opacity:1}50%{opacity:.4}}'
      +'.how2-hero-title{font:700 clamp(32px,5.5vw,58px)/1.06 -apple-system,system-ui,"SF Pro Display",Inter,sans-serif;letter-spacing:-1.5px;margin:0 0 18px;background:linear-gradient(180deg,#fff 0%,rgba(255,255,255,.75) 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}'
      +'.how2-hero-sub{font:400 clamp(15px,1.9vw,19px)/1.55 -apple-system,system-ui,Inter,sans-serif;color:rgba(255,255,255,.68);max-width:580px;margin:0 auto 32px}'
      // ── Search bar ──
      +'.how2-search-wrap{position:relative;max-width:500px;margin:0 auto 0;display:flex;align-items:center}'
      +'.how2-search{width:100%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:13px 48px 13px 20px;font:500 15px/1 -apple-system,system-ui,Inter,sans-serif;color:#fff;outline:none;transition:background .2s,border-color .2s;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);-webkit-appearance:none;appearance:none}'
      +'.how2-search::placeholder{color:rgba(255,255,255,.45)}'
      +'.how2-search:focus{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.35)}'
      +'.how2-search-ico{position:absolute;right:15px;color:rgba(255,255,255,.45);pointer-events:none}'
      +'.how2-search-ico svg{width:18px;height:18px}'
      // ── Stats bar ──
      +'.how2-stats{display:flex;gap:24px;justify-content:center;margin-top:28px;flex-wrap:wrap}'
      +'.how2-stat{display:flex;flex-direction:column;align-items:center;gap:3px}'
      +'.how2-stat b{font:700 22px/1 -apple-system,system-ui,Inter,sans-serif;color:#fff;font-variant-numeric:tabular-nums}'
      +'.how2-stat span{font:500 11px/1 -apple-system,system-ui,Inter,sans-serif;color:rgba(255,255,255,.5);letter-spacing:.3px;text-transform:uppercase}'
      +'.how2-stat-sep{width:1px;height:30px;background:rgba(255,255,255,.12);align-self:center}'
      // ── Quick-start use cases ──
      +'.how2-quickstart{padding:28px 0 0}'
      +'.how2-qs-label{font:700 11px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:#64748b;margin-bottom:12px}'
      +'body.dark .how2-qs-label{color:#6b7280}'
      +'.how2-qs-row{display:flex;gap:8px;flex-wrap:wrap}'
      +'.how2-qs-btn{display:inline-flex;align-items:center;gap:7px;background:#fff;border:.5px solid rgba(10,14,28,.1);border-radius:12px;padding:9px 14px;font:500 13px/1 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;cursor:pointer;transition:transform .2s cubic-bezier(.34,1.56,.52,1),box-shadow .2s,background .15s;box-shadow:0 2px 8px -3px rgba(10,14,28,.12);white-space:nowrap}'
      +'.how2-qs-btn:hover{transform:translateY(-2px);box-shadow:0 8px 22px -6px rgba(10,14,28,.18)}'
      +'.how2-qs-btn:active{transform:scale(.97)}'
      +'body.dark .how2-qs-btn{background:#1c2433;border-color:rgba(255,255,255,.07);color:#e6edf3}'
      +'.how2-qs-btn .how2-qs-ico{font-size:16px;line-height:1}'
      // ── Category sections ──
      +'.how2-section{margin-top:36px}'
      +'.how2-section-head{display:flex;align-items:baseline;gap:10px;margin-bottom:16px}'
      +'.how2-section-title{font:700 12px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:1.8px;text-transform:uppercase;color:#64748b}'
      +'body.dark .how2-section-title{color:#6b7280}'
      +'.how2-section-count{font:600 11px/1 -apple-system,system-ui,Inter,sans-serif;color:rgba(120,120,128,.55);letter-spacing:.3px}'
      // ── Card grid ──
      +'.how2-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:14px}'
      // ── Card ──
      +'.how2-card{position:relative;border-radius:22px;overflow:hidden;background:#fff;border:.5px solid rgba(10,14,28,.07);box-shadow:0 3px 12px -5px rgba(10,14,28,.1);cursor:pointer;transition:transform .35s cubic-bezier(.22,.96,.36,1),box-shadow .35s,border-color .25s;display:flex;flex-direction:column;padding:22px 20px 18px;opacity:0;animation:how2CardIn .5s cubic-bezier(.34,1.56,.52,1) var(--cd,.05s) forwards}'
      +'body.dark .how2-card{background:#1c2433;border-color:rgba(255,255,255,.055)}'
      +'.how2-card:hover{transform:translateY(-5px) scale(1.005);box-shadow:0 20px 48px -14px rgba(10,14,28,.28),0 0 0 1px color-mix(in srgb,var(--ac) 28%,transparent)}'
      +'.how2-card:active{transform:translateY(-2px) scale(.99)}'
      +'@keyframes how2CardIn{from{opacity:0;transform:translateY(18px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}'
      // Grid span helpers
      +'.how2-c3{grid-column:span 3}.how2-c4{grid-column:span 4}.how2-c6{grid-column:span 6}.how2-c8{grid-column:span 8}'
      // ── Card tint / glow ──
      +'.how2-card-glow{position:absolute;inset:-60% -40% auto;height:240px;background:radial-gradient(closest-side,color-mix(in srgb,var(--ac) 22%,transparent),transparent 72%);filter:blur(12px);pointer-events:none;opacity:.9}'
      // ── Card content ──
      +'.how2-card-top{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px}'
      +'.how2-card-ico{width:44px;height:44px;border-radius:13px;flex-shrink:0;background:linear-gradient(135deg,color-mix(in srgb,var(--ac) 16%,#fff),#fff);color:var(--ac);display:flex;align-items:center;justify-content:center;box-shadow:0 5px 14px -5px color-mix(in srgb,var(--ac) 40%,transparent),inset 0 1px 0 rgba(255,255,255,.85)}'
      +'body.dark .how2-card-ico{background:linear-gradient(135deg,color-mix(in srgb,var(--ac) 28%,#21262d),#21262d)}'
      +'.how2-card-ico svg{width:24px;height:24px}'
      +'.how2-card-meta{flex:1;min-width:0}'
      +'.how2-card-eyebrow{font:700 10px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:1.3px;text-transform:uppercase;color:var(--ac);margin-bottom:4px}'
      +'.how2-card-title{font:700 17px/1.25 -apple-system,system-ui,"SF Pro Display",Inter,sans-serif;letter-spacing:-.3px;color:#0f1f3d;margin:0}'
      +'body.dark .how2-card-title{color:#f0f6fc}'
      +'.how2-card-desc{font:400 13.5px/1.5 -apple-system,system-ui,Inter,sans-serif;color:#4b5563;margin:0 0 auto;flex:1}'
      +'body.dark .how2-card-desc{color:#9ba9ba}'
      +'.how2-card-footer{display:flex;align-items:center;gap:6px;margin-top:14px}'
      +'.how2-card-pill{display:inline-flex;align-items:center;gap:4px;background:rgba(120,120,128,.1);color:#64748b;font:600 10.5px/1 -apple-system,system-ui,Inter,sans-serif;padding:5px 9px;border-radius:10px;letter-spacing:.15px}'
      +'body.dark .how2-card-pill{background:rgba(255,255,255,.07);color:#9ba9ba}'
      +'.how2-card-pill svg{width:10px;height:10px}'
      +'.how2-card-arrow{margin-left:auto;color:var(--ac);opacity:.75;transition:transform .2s,opacity .2s}'
      +'.how2-card:hover .how2-card-arrow{opacity:1;transform:translateX(3px)}'
      +'.how2-card-arrow svg{width:15px;height:15px}'
      // ── Done / Fav badges ──
      +'.how2-card-done{position:absolute;top:12px;right:40px;width:20px;height:20px;border-radius:50%;background:#22c55e;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff,0 2px 6px rgba(34,197,94,.4)}'
      +'body.dark .how2-card-done{box-shadow:0 0 0 2px #1c2433}'
      +'.how2-card-done svg{width:11px;height:11px;color:#fff}'
      +'.how2-card-fav{position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:50%;background:rgba(120,120,128,.1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#94a3b8;transition:background .2s,transform .2s,color .2s;z-index:4}'
      +'.how2-card-fav:hover{background:rgba(239,68,68,.12);color:#ef4444;transform:scale(1.12)}'
      +'.how2-card-fav.active{background:rgba(239,68,68,.12);color:#ef4444}'
      +'.how2-card-fav svg{width:13px;height:13px}'
      +'body.dark .how2-card-fav{background:rgba(255,255,255,.07)}'
      // ── Favorites filter ──
      +'.how2-fav-bar{display:flex;gap:8px;align-items:center;margin:6px 0 0}'
      +'.how2-filter-btn{display:inline-flex;align-items:center;gap:5px;background:rgba(120,120,128,.1);border:none;border-radius:10px;padding:7px 12px;font:600 11.5px/1 -apple-system,system-ui,Inter,sans-serif;color:#64748b;cursor:pointer;transition:background .2s,color .2s}'
      +'.how2-filter-btn.active{background:color-mix(in srgb,#ef4444 12%,transparent);color:#ef4444}'
      +'body.dark .how2-filter-btn{background:rgba(255,255,255,.07);color:#9ba9ba}'
      +'.how2-filter-btn svg{width:12px;height:12px}'
      +'.how2-progress-label{margin-left:auto;font:600 11.5px/1 -apple-system,system-ui,Inter,sans-serif;color:#94a3b8;display:flex;align-items:center;gap:6px}'
      +'.how2-progress-bar{width:80px;height:5px;border-radius:999px;background:rgba(120,120,128,.15);overflow:hidden}'
      +'.how2-progress-fill{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:999px;transition:width .6s cubic-bezier(.22,.96,.36,1)}'
      // ── No results ──
      +'.how2-empty{text-align:center;padding:40px 20px;color:#94a3b8;font:500 14px/1.5 -apple-system,system-ui,Inter,sans-serif}'
      // ── Modal ──
      +'.how2-modal{position:fixed;inset:0;height:100vh;height:100dvh;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(8,12,24,.78);backdrop-filter:blur(32px) saturate(1.5);-webkit-backdrop-filter:blur(32px) saturate(1.5);animation:how2Fade .3s cubic-bezier(.2,.8,.2,1);padding:max(14px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))}'
      +'.how2-modal-card{position:relative;width:min(880px,100%);max-height:min(880px,100dvh);background:linear-gradient(180deg,#fff,#f8faff);border-radius:28px;box-shadow:0 40px 100px -20px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.6) inset;overflow:hidden;display:flex;flex-direction:column;animation:how2ModalPop .55s cubic-bezier(.34,1.6,.52,1)}'
      +'body.dark .how2-modal-card{background:linear-gradient(180deg,#1c2433,#141c28);box-shadow:0 40px 100px -20px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.07) inset}'
      +'@keyframes how2ModalPop{0%{opacity:0;transform:scale(.9) translateY(24px)}60%{opacity:1}100%{opacity:1;transform:none}}'
      // Modal tint
      +'.how2-modal-tint{position:absolute;inset:-50% -30% auto;height:420px;background:radial-gradient(closest-side,var(--ac) 55,transparent 70%);opacity:.45;filter:blur(18px);pointer-events:none;transition:background 1.2s;z-index:0}'
      // Modal header
      +'.how2-modal-hdr{position:relative;z-index:2;display:flex;align-items:center;gap:12px;padding:20px 22px 14px;border-bottom:.5px solid rgba(120,120,128,.13)}'
      +'body.dark .how2-modal-hdr{border-bottom-color:rgba(255,255,255,.07)}'
      +'.how2-modal-hdr-ico{width:38px;height:38px;border-radius:12px;background:color-mix(in srgb,var(--ac) 14%,#fff);color:var(--ac);display:flex;align-items:center;justify-content:center;flex-shrink:0}'
      +'body.dark .how2-modal-hdr-ico{background:color-mix(in srgb,var(--ac) 24%,#21262d)}'
      +'.how2-modal-hdr-ico svg{width:21px;height:21px}'
      +'.how2-modal-hdr-text{flex:1;min-width:0}'
      +'.how2-modal-hdr-ey{font:700 10.5px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:1.3px;text-transform:uppercase;color:var(--ac);margin-bottom:3px}'
      +'.how2-modal-hdr-title{font:700 17.5px/1.2 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;letter-spacing:-.3px}'
      +'body.dark .how2-modal-hdr-title{color:#f0f6fc}'
      +'.how2-modal-hdr-acts{display:flex;align-items:center;gap:6px}'
      +'.how2-modal-fav{background:rgba(120,120,128,.1);border:none;width:34px;height:34px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#94a3b8;transition:background .2s,color .2s,transform .18s}'
      +'.how2-modal-fav:hover{background:rgba(239,68,68,.12);color:#ef4444}'
      +'.how2-modal-fav.active{background:rgba(239,68,68,.12);color:#ef4444}'
      +'.how2-modal-fav svg{width:15px;height:15px}'
      +'.how2-modal-close{background:rgba(120,120,128,.12);border:none;width:34px;height:34px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#3c3c43;transition:background .2s,transform .15s}'
      +'.how2-modal-close:hover{background:rgba(120,120,128,.22)}.how2-modal-close:active{transform:scale(.9)}'
      +'body.dark .how2-modal-close,.body.dark .how2-modal-fav{background:rgba(255,255,255,.09);color:#c9d1d9}'
      +'.how2-modal-close svg{width:15px;height:15px}'
      // Progress strip
      +'.how2-modal-prog{position:absolute;top:0;left:0;right:0;height:3px;background:transparent;overflow:hidden;z-index:5}'
      +'.how2-modal-prog-fill{height:100%;background:linear-gradient(90deg,var(--ac),color-mix(in srgb,var(--ac) 55%,#fff));transition:width .5s cubic-bezier(.22,.96,.36,1);box-shadow:0 0 12px color-mix(in srgb,var(--ac) 60%,transparent)}'
      // Modal body
      +'.how2-modal-body{position:relative;z-index:1;flex:1;overflow-y:auto;overflow-x:hidden;padding:22px 24px 8px;min-height:0;-webkit-overflow-scrolling:touch;scrollbar-width:none}'
      +'.how2-modal-body::-webkit-scrollbar{display:none}'
      // Stage
      +'.how2-stage{position:relative;width:100%;aspect-ratio:16/9;border-radius:18px;overflow:hidden;background:linear-gradient(135deg,color-mix(in srgb,var(--ac) 5%,#f5f7fb),#fff);border:.5px solid rgba(10,14,28,.06);display:flex;align-items:center;justify-content:center;padding:22px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.8),0 10px 36px -14px rgba(10,14,28,.18)}'
      +'body.dark .how2-stage{background:linear-gradient(135deg,color-mix(in srgb,var(--ac) 10%,#161e2e),#141c28);border-color:rgba(255,255,255,.045)}'
      // Step slides
      +'.how2-step{position:absolute;inset:22px;display:flex;align-items:center;justify-content:center;opacity:0;transform:translateX(28px);transition:opacity .38s cubic-bezier(.2,.8,.2,1),transform .5s cubic-bezier(.22,.96,.36,1)}'
      +'.how2-step.active{opacity:1;transform:none}'
      +'.how2-step.past{opacity:0;transform:translateX(-28px);transition-duration:.28s,.38s}'
      // Caption
      +'.how2-caption{margin-top:14px;padding:0 4px}'
      +'.how2-caption-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}'
      +'.how2-caption-num{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--ac);color:#fff;font:700 12px/1 -apple-system,system-ui,Inter,sans-serif;flex-shrink:0}'
      +'.how2-caption-ttl{font:700 16.5px/1.25 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;letter-spacing:-.25px}'
      +'body.dark .how2-caption-ttl{color:#f0f6fc}'
      +'.how2-caption-txt{font:400 14px/1.55 -apple-system,system-ui,Inter,sans-serif;color:#4b5563;max-width:680px}'
      +'body.dark .how2-caption-txt{color:#9ba9ba}'
      // Controls
      +'.how2-modal-ctrl{position:relative;z-index:2;padding:10px 22px max(18px,env(safe-area-inset-bottom));display:flex;align-items:center;gap:8px;border-top:.5px solid rgba(120,120,128,.12)}'
      +'body.dark .how2-modal-ctrl{border-top-color:rgba(255,255,255,.07)}'
      +'.how2-ctrl-btn{background:rgba(120,120,128,.12);border:none;width:38px;height:38px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#1a3a6b;transition:background .18s,transform .15s}'
      +'.how2-ctrl-btn:hover{background:rgba(120,120,128,.2)}.how2-ctrl-btn:active{transform:scale(.91)}'
      +'.how2-ctrl-btn:disabled{opacity:.3;cursor:not-allowed}'
      +'body.dark .how2-ctrl-btn{background:rgba(255,255,255,.09);color:#e6edf3}'
      +'.how2-ctrl-btn svg{width:16px;height:16px}'
      +'.how2-dots{flex:1;display:flex;gap:5px;justify-content:center}'
      +'.how2-dot{width:6px;height:6px;border-radius:999px;background:rgba(120,120,128,.28);border:none;cursor:pointer;transition:all .32s cubic-bezier(.34,1.56,.52,1);padding:0}'
      +'.how2-dot.active{width:20px;background:var(--ac);box-shadow:0 0 10px color-mix(in srgb,var(--ac) 50%,transparent)}'
      +'body.dark .how2-dot{background:rgba(255,255,255,.16)}'
      +'.how2-cta-btn{background:linear-gradient(180deg,var(--ac),color-mix(in srgb,var(--ac) 80%,#000));color:#fff;border:none;padding:10px 18px;border-radius:13px;font:600 13.5px/1 -apple-system,system-ui,Inter,sans-serif;cursor:pointer;box-shadow:0 6px 18px -5px color-mix(in srgb,var(--ac) 60%,transparent),inset 0 1px 0 rgba(255,255,255,.22);transition:transform .18s cubic-bezier(.34,1.56,.52,1),box-shadow .18s;display:flex;align-items:center;gap:6px;flex-shrink:0;white-space:nowrap}'
      +'.how2-cta-btn:hover{transform:translateY(-1px)}.how2-cta-btn:active{transform:scale(.97)}'
      +'.how2-cta-btn svg{width:13px;height:13px}'
      // ── Keyboard hint ──
      +'.how2-key-hint{display:flex;gap:10px;align-items:center;justify-content:center;padding:8px 0 2px;flex-wrap:wrap}'
      +'.how2-key{display:inline-flex;align-items:center;gap:4px;font:500 11.5px/1 -apple-system,system-ui,Inter,sans-serif;color:#94a3b8}'
      +'.how2-kbd{background:rgba(120,120,128,.1);border:.5px solid rgba(120,120,128,.2);border-radius:5px;padding:2px 6px;font:600 11px/1.4 -apple-system,system-ui,Inter,sans-serif}'
      +'body.dark .how2-key{color:#6b7280}'
      +'body.dark .how2-kbd{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1)}'
      // ── Stage demo components ──
      +'.sb2-kpi-row{display:flex;gap:10px;width:100%;max-width:560px}'
      +'.sb2-kpi{flex:1;background:rgba(255,255,255,.88);border:.5px solid rgba(10,14,28,.08);border-radius:14px;padding:13px 15px;opacity:0;animation:sb2Up .5s cubic-bezier(.34,1.56,.52,1) var(--d,0s) forwards;text-align:left}'
      +'body.dark .sb2-kpi{background:rgba(30,38,52,.75);border-color:rgba(255,255,255,.06)}'
      +'.sb2-kpi .lbl{font:700 9.5px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:.8px;text-transform:uppercase;color:var(--ac);opacity:.8;margin-bottom:5px}'
      +'.sb2-kpi .val{font:700 clamp(18px,3vw,24px)/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:-.3px;color:#0f1f3d;font-variant-numeric:tabular-nums}'
      +'body.dark .sb2-kpi .val{color:#f0f6fc}'
      +'@keyframes sb2Up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}'
      +'.sb2-list{display:flex;flex-direction:column;gap:7px;width:100%;max-width:440px}'
      +'.sb2-item{background:rgba(255,255,255,.88);border:.5px solid rgba(10,14,28,.08);border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:10px;opacity:0;animation:sb2Up .45s cubic-bezier(.34,1.56,.52,1) var(--d,0s) forwards}'
      +'body.dark .sb2-item{background:rgba(30,38,52,.75);border-color:rgba(255,255,255,.06)}'
      +'.sb2-item .dot{width:7px;height:7px;border-radius:50%;background:var(--ac);flex-shrink:0;box-shadow:0 0 0 3px color-mix(in srgb,var(--ac) 18%,transparent)}'
      +'.sb2-item .txt{font:500 13px/1.35 -apple-system,system-ui,Inter,sans-serif;color:#0f1f3d;flex:1}'
      +'body.dark .sb2-item .txt{color:#e6edf3}'
      +'.sb2-item .val{font:700 13px/1 -apple-system,system-ui,Inter,sans-serif;color:var(--ac);font-variant-numeric:tabular-nums}'
      +'.sb2-pulse{width:100px;height:100px;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--ac) 38%,transparent),transparent 65%);animation:sb2Pulse 2.2s ease-in-out infinite;display:flex;align-items:center;justify-content:center}'
      +'.sb2-pulse::after{content:"";position:absolute;width:36px;height:36px;border-radius:50%;background:var(--ac);box-shadow:0 0 0 4px #fff,0 0 32px color-mix(in srgb,var(--ac) 55%,transparent)}'
      +'body.dark .sb2-pulse::after{box-shadow:0 0 0 4px #141c28,0 0 32px color-mix(in srgb,var(--ac) 55%,transparent)}'
      +'@keyframes sb2Pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}'
      +'.sb2-chart{width:100%;max-width:500px;height:150px}'
      +'.sb2-chart svg{width:100%;height:100%}'
      +'.sb2-chart-line{stroke-dasharray:700;stroke-dashoffset:700;animation:sb2Draw 1.8s cubic-bezier(.2,.8,.2,1) .15s forwards}'
      +'@keyframes sb2Draw{to{stroke-dashoffset:0}}'
      +'.sb2-rings{position:relative;width:200px;height:200px;display:flex;align-items:center;justify-content:center}'
      +'.sb2-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);border-radius:50%;border:1.5px dashed var(--ac);background:radial-gradient(closest-side,color-mix(in srgb,var(--ac) 10%,transparent),transparent 72%);animation:sb2RingPop .85s cubic-bezier(.34,1.56,.52,1) var(--d,0s) forwards,sb2RingBreathe 3s ease-in-out calc(var(--d,0s) + 1s) infinite}'
      +'.sb2-ring.r1{width:60px;height:60px;border-style:solid}'
      +'.sb2-ring.r2{width:120px;height:120px}'
      +'.sb2-ring.r3{width:196px;height:196px}'
      +'@keyframes sb2RingPop{to{opacity:1;transform:translate(-50%,-50%) scale(1)}}'
      +'@keyframes sb2RingBreathe{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.04)}}'
      +'.sb2-ring-lbl{position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:#fff;color:var(--ac);font:700 9.5px/1 -apple-system,system-ui,Inter,sans-serif;padding:3px 7px;border-radius:9px;white-space:nowrap;border:.5px solid var(--ac);opacity:.9}'
      +'body.dark .sb2-ring-lbl{background:#141c28}'
      +'.sb2-timeline{display:flex;align-items:flex-start;justify-content:space-between;width:100%;max-width:560px;position:relative}'
      +'.sb2-tl-track{position:absolute;top:15px;left:0;right:0;height:2px;background:rgba(120,120,128,.15);z-index:0}'
      +'.sb2-tl-fill{height:100%;background:linear-gradient(90deg,var(--ac),color-mix(in srgb,var(--ac) 40%,transparent));transform-origin:left;transform:scaleX(0);animation:sb2TlFill .8s cubic-bezier(.2,.8,.2,1) .2s forwards}'
      +'@keyframes sb2TlFill{to{transform:scaleX(1)}}'
      +'.sb2-tl-node{display:flex;flex-direction:column;align-items:center;gap:5px;flex:0 0 auto;opacity:0;animation:sb2Up .45s cubic-bezier(.34,1.56,.52,1) var(--d,0s) forwards;z-index:1;position:relative}'
      +'.sb2-tl-circle{width:30px;height:30px;border-radius:50%;background:var(--ac);color:#fff;display:flex;align-items:center;justify-content:center;font:700 12px/1 -apple-system,system-ui,Inter,sans-serif;box-shadow:0 2px 10px color-mix(in srgb,var(--ac) 45%,transparent),0 0 0 3px #fff;position:relative}'
      +'body.dark .sb2-tl-circle{box-shadow:0 2px 10px color-mix(in srgb,var(--ac) 45%,transparent),0 0 0 3px #141c28}'
      +'.sb2-tl-lbl{font:600 9.5px/1.3 -apple-system,system-ui,Inter,sans-serif;color:#475569;text-align:center;max-width:65px}'
      +'body.dark .sb2-tl-lbl{color:#9ba9ba}'
      +'.sb2-chat{display:flex;flex-direction:column;gap:6px;width:100%;max-width:400px}'
      +'.sb2-bubble{padding:8px 12px;border-radius:14px;font:500 13px/1.4 -apple-system,system-ui,Inter,sans-serif;max-width:80%;opacity:0;animation:sb2Up .4s cubic-bezier(.34,1.56,.52,1) var(--d,0s) forwards}'
      +'.sb2-bubble.l{align-self:flex-start;background:rgba(120,120,128,.12);color:#0f1f3d;border-bottom-left-radius:5px}'
      +'.sb2-bubble.r{align-self:flex-end;background:var(--ac);color:#fff;border-bottom-right-radius:5px}'
      +'body.dark .sb2-bubble.l{background:rgba(255,255,255,.09);color:#e6edf3}'
      +'.sb2-bubble b{display:block;font-size:9.5px;font-weight:700;opacity:.65;letter-spacing:.4px;text-transform:uppercase;margin-bottom:2px}'
      +'.sb2-form{width:100%;max-width:310px;background:rgba(255,255,255,.92);border:.5px solid rgba(10,14,28,.1);border-radius:14px;padding:14px}'
      +'body.dark .sb2-form{background:rgba(25,32,45,.8);border-color:rgba(255,255,255,.06)}'
      +'.sb2-field{margin-bottom:9px;opacity:0;animation:sb2Up .45s cubic-bezier(.34,1.56,.52,1) var(--d,0s) forwards}'
      +'.sb2-field label{display:block;font:700 9px/1 -apple-system,system-ui,Inter,sans-serif;letter-spacing:.6px;text-transform:uppercase;color:#64748b;margin-bottom:4px}'
      +'body.dark .sb2-field label{color:#9ba9ba}'
      +'.sb2-field input{width:100%;background:#fff;border:1px solid rgba(10,14,28,.12);border-radius:9px;padding:7px 10px;font:600 15px/1 -apple-system,system-ui,Inter,sans-serif;color:var(--ac);box-sizing:border-box;font-variant-numeric:tabular-nums;outline:none}'
      +'body.dark .sb2-field input{background:rgba(16,22,34,.9);border-color:rgba(255,255,255,.09);color:var(--ac)}'
      +'.sb2-phone{width:90px;background:linear-gradient(180deg,#1a1f2e,#0f1320);border-radius:18px;padding:10px 7px;box-shadow:0 12px 40px -8px rgba(0,0,0,.6),0 0 0 1.5px rgba(255,255,255,.08);display:flex;flex-direction:column;gap:5px;align-items:center}'
      +'.sb2-phone-notch{width:30px;height:6px;background:rgba(255,255,255,.12);border-radius:3px;margin-bottom:4px}'
      +'.sb2-phone-card{width:100%;background:color-mix(in srgb,var(--ac) 20%,rgba(30,38,52,.9));border-radius:10px;padding:8px;opacity:0;animation:sb2Up .5s cubic-bezier(.34,1.56,.52,1) var(--d,0s) forwards}'
      +'.sb2-phone-card .plbl{font:600 8px/1 -apple-system,system-ui,Inter,sans-serif;text-transform:uppercase;letter-spacing:.5px;color:var(--ac);opacity:.8;margin-bottom:4px}'
      +'.sb2-phone-card .pval{font:700 16px/1 -apple-system,system-ui,Inter,sans-serif;color:#fff;font-variant-numeric:tabular-nums}'
      +'.sb2-badge{display:inline-flex;align-items:center;gap:5px;background:color-mix(in srgb,var(--ac) 14%,#fff);border:.5px solid color-mix(in srgb,var(--ac) 30%,transparent);color:var(--ac);font:700 11.5px/1 -apple-system,system-ui,Inter,sans-serif;padding:7px 12px;border-radius:10px;opacity:0;animation:sb2Up .45s cubic-bezier(.34,1.56,.52,1) var(--d,0s) forwards}'
      +'body.dark .sb2-badge{background:color-mix(in srgb,var(--ac) 20%,#21262d)}'
      // ── Responsive ──
      +'@media(max-width:960px){.how2-grid{grid-template-columns:repeat(6,1fr)}.how2-c3{grid-column:span 3}.how2-c4{grid-column:span 3}.how2-c6{grid-column:span 3}.how2-c8{grid-column:span 6}}'
      +'@media(max-width:640px){.how2{padding:0 14px 100px}.how2-hero{margin:0 -14px;padding:60px 24px 44px}.how2-hero-title{font-size:clamp(28px,8vw,38px)}.how2-stats{gap:16px}.how2-qs-row{gap:6px}.how2-qs-btn{padding:8px 11px;font-size:12px}.how2-grid{grid-template-columns:1fr!important;gap:10px}.how2-c3,.how2-c4,.how2-c6,.how2-c8{grid-column:span 1!important}.how2-modal-card{border-radius:22px;max-height:calc(100dvh - 12px)}.how2-modal-hdr{padding:14px 16px 12px}.how2-modal-body{padding:16px 14px 6px}.how2-stage{border-radius:14px;padding:14px}.how2-step{inset:14px}.how2-modal-ctrl{padding:8px 14px max(14px,env(safe-area-inset-bottom))}.how2-key-hint{display:none}}'
      +'@media(prefers-reduced-motion:reduce){.how2-hero-canvas,.how2-orb,.how2-card,.how2-modal-card,.how2-step{animation:none!important;transition:none!important}}';
    var s=document.createElement('style');s.id='how2-styles';s.textContent=css;document.head.appendChild(s);
  }

  // ── Icons ────────────────────────────────────────────────────────────────
  var I={
    dashboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    studio:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-8h6v8"/></svg>',
    bp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="6" y="12" width="3" height="7" rx="1"/><rect x="11" y="7" width="3" height="12" rx="1"/><rect x="16" y="4" width="3" height="15" rx="1"/></svg>',
    map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
    engage:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/><path d="M8 14l3 3 5-6"/></svg>',
    collab:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    sim:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12h4l2-4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
    files:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    notif:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    local:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    workflow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    financier:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
    prev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    next:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    star:'<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    starOutline:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    heart:'<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    heartOutline:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
  };

  // ── Chapter data ─────────────────────────────────────────────────────────
  var SECTIONS=[
    {
      id:'fondamentaux',label:'Fondamentaux',
      chapters:[
        {
          id:'accueil',icon:I.dashboard,accent:'#2563eb',span:'how2-c8',
          cat:'fondamentaux',
          eyebrow:'Tableau de bord',title:'Accueil',
          desc:'Le pouls du réseau en un coup d\'œil. KPIs consolidés, alertes prioritaires, et raccourcis intelligents vers l\'action.',
          tags:['KPI','alertes','dashboard'],
          steps:[
            {title:'KPIs réseau en direct',text:'Studios actifs, CAPEX total, CA prévisionnel A1 — recalculés automatiquement dès qu\'un BP change.',
             render:function(){return '<div class="sb2-kpi-row" style="--ac:#2563eb"><div class="sb2-kpi" style="--d:.08s"><div class="lbl">Studios</div><div class="val">15</div></div><div class="sb2-kpi" style="--d:.22s"><div class="lbl">CAPEX</div><div class="val">4,8 M€</div></div><div class="sb2-kpi" style="--d:.36s"><div class="lbl">CA A1</div><div class="val">11,2 M€</div></div></div>';}},
            {title:'Briefing du jour',text:'Chaque matin : priorités remontées automatiquement. Retards, signatures imminentes, rendez-vous — classés par urgence.',
             render:function(){return '<div class="sb2-list" style="--ac:#2563eb"><div class="sb2-item" style="--d:.05s"><span class="dot"></span><span class="txt">Compromis à signer — Lattes</span><span class="val">J-2</span></div><div class="sb2-item" style="--d:.18s"><span class="dot"></span><span class="txt">BP à valider — Garches</span><span class="val">Aujourd\'hui</span></div><div class="sb2-item" style="--d:.31s"><span class="dot"></span><span class="txt">Réunion cohorte 3</span><span class="val">16:00</span></div></div>';}},
            {title:'Navigation zéro friction',text:'Cliquez sur n\'importe quelle alerte → l\'app ouvre directement le bon onglet du bon studio. Fini les clics inutiles.',
             render:function(){return '<div class="sb2-pulse" style="--ac:#2563eb;position:relative"><div style="position:absolute;top:-24px;left:50%;transform:translateX(-50%);white-space:nowrap;font:600 11px/1 -apple-system,system-ui,Inter,sans-serif;color:#2563eb;opacity:.8">Cliquez → navigation directe</div></div>';}}
          ]
        },
        {
          id:'studios',icon:I.studio,accent:'#0891b2',span:'how2-c4',
          cat:'fondamentaux',
          eyebrow:'Vos studios',title:'Vue réseau',
          desc:'Tous vos studios sur une grille fluide. Filtrez par statut, cohorte, région.',
          tags:['studios','liste','filtres'],
          steps:[
            {title:'Grille unifiée',text:'Recherche full-text, tri dynamique, filtres par statut (Prospect, Compromis, Travaux, Ouvert). Tout en une vue.',
             render:function(){return '<div class="sb2-list" style="--ac:#0891b2"><div class="sb2-item" style="--d:.05s"><span class="dot"></span><span class="txt">Montpellier — Lattes</span><span class="val">Travaux</span></div><div class="sb2-item" style="--d:.18s"><span class="dot"></span><span class="txt">Paris — Garches</span><span class="val">Ouvert</span></div><div class="sb2-item" style="--d:.31s"><span class="dot"></span><span class="txt">Lyon — Part-Dieu</span><span class="val">Prospect</span></div></div>';}},
            {title:'Création guidée',text:'Nouveau studio en 30 secondes : nom, ville, cohorte, et les objectifs adhérents A1/A2/A3. Le BP se génère tout seul.',
             render:function(){return '<div class="sb2-form" style="--ac:#0891b2"><div class="sb2-field" style="--d:.06s"><label>Nom du studio</label><input value="Montpellier — Lattes" readonly/></div><div class="sb2-field" style="--d:.2s"><label>Adhérents fin A1</label><input value="320" readonly/></div><div class="sb2-field" style="--d:.34s"><label>Cohorte</label><input value="Cohorte 3" readonly/></div></div>';}},
            {title:'9 onglets par studio',text:'Workflow · BP · Adhérents · Chalandise · Engagements · Fichiers · Échanges · Collab · Financier. Tout le dossier en un endroit.',
             render:function(){return '<div class="sb2-list" style="--ac:#0891b2;max-width:340px"><div class="sb2-item" style="--d:.05s"><span class="dot"></span><span class="txt">Workflow</span><span class="val">→</span></div><div class="sb2-item" style="--d:.14s"><span class="dot"></span><span class="txt">Business Plan</span><span class="val">→</span></div><div class="sb2-item" style="--d:.23s"><span class="dot"></span><span class="txt">Chalandise</span><span class="val">→</span></div><div class="sb2-item" style="--d:.32s"><span class="dot"></span><span class="txt">Engagements</span><span class="val">→</span></div></div>';}}
          ]
        }
      ]
    },
    {
      id:'finance',label:'Finance',
      chapters:[
        {
          id:'bp',icon:I.bp,accent:'#047857',span:'how2-c4',
          cat:'finance',
          eyebrow:'Business Plan',title:'BP didactique',
          desc:'Trois chiffres. Trente-six mois. La puissance du modèle Club Pilates, sans Excel.',
          tags:['BP','excel','prévisionnel','adhérents'],
          steps:[
            {title:'3 chiffres suffisent',text:'Saisissez les objectifs adhérents fin A1, A2 et A3. L\'algorithme calcule tout le reste : ARPU, pack mix, EBITDA, cash.',
             render:function(){return '<div class="sb2-form" style="--ac:#047857"><div class="sb2-field" style="--d:.05s"><label>Adhérents fin A1</label><input value="320" readonly/></div><div class="sb2-field" style="--d:.2s"><label>Adhérents fin A2</label><input value="480" readonly/></div><div class="sb2-field" style="--d:.35s"><label>Adhérents fin A3</label><input value="540" readonly/></div></div>';}},
            {title:'Courbe CA 36 mois',text:'Chaque mois détaillé : CA mensuel, EBITDA, trésorerie nette. La progression vers la rentabilité, visualisée.',
             render:function(){return '<div class="sb2-chart" style="--ac:#047857"><svg viewBox="0 0 480 150" preserveAspectRatio="none"><defs><linearGradient id="sbg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#047857" stop-opacity=".25"/><stop offset="100%" stop-color="#047857" stop-opacity="0"/></linearGradient></defs><path d="M0 145 L60 132 L120 118 L180 94 L240 80 L300 54 L360 38 L420 20 L480 10 L480 150 L0 150 Z" fill="url(#sbg2)"/><path class="sb2-chart-line" d="M0 145 L60 132 L120 118 L180 94 L240 80 L300 54 L360 38 L420 20 L480 10" fill="none" stroke="#047857" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';}},
            {title:'Vue réel vs initial',text:'Injectez les vraies données mois par mois. L\'app trace l\'écart entre le BP initial et la réalité terrain.',
             render:function(){return '<div class="sb2-kpi-row" style="--ac:#047857"><div class="sb2-kpi" style="--d:.08s"><div class="lbl">BP Initial</div><div class="val">320</div></div><div class="sb2-kpi" style="--d:.22s"><div class="lbl">Réel</div><div class="val" style="color:#047857">338</div></div><div class="sb2-kpi" style="--d:.36s"><div class="lbl">Écart</div><div class="val" style="color:#16a34a">+5,6%</div></div></div>';}}
          ]
        },
        {
          id:'simulator',icon:I.sim,accent:'#0d9488',span:'how2-c4',
          cat:'finance',
          eyebrow:'Simulateur',title:'Scénarios adhérents',
          desc:'Faites varier loyer, charges et répartition des packs. Voyez l\'impact sur le cash en temps réel.',
          tags:['simulation','scénarios','cash','packs'],
          steps:[
            {title:'Étape 1 — Loyer & charges',text:'Renseignez le loyer mensuel et les charges au m². Ce sont les seules variables que vous contrôlez vraiment.',
             render:function(){return '<div class="sb2-form" style="--ac:#0d9488"><div class="sb2-field" style="--d:.06s"><label>Loyer mensuel</label><input value="6 500 €" readonly/></div><div class="sb2-field" style="--d:.2s"><label>Charges / m²</label><input value="18 €" readonly/></div><div class="sb2-field" style="--d:.34s"><label>Surface</label><input value="320 m²" readonly/></div></div>';}},
            {title:'Étape 2 — Répartition packs',text:'Premium, Classic, Intro — glissez les curseurs pour tester la distribution. L\'ARPU recalcule en direct.',
             render:function(){return '<div class="sb2-list" style="--ac:#0d9488;max-width:380px"><div class="sb2-item" style="--d:.05s"><span class="dot"></span><span class="txt">Premium (34€/sem)</span><span class="val">45%</span></div><div class="sb2-item" style="--d:.16s"><span class="dot"></span><span class="txt">Classic (25€/sem)</span><span class="val">40%</span></div><div class="sb2-item" style="--d:.27s"><span class="dot"></span><span class="txt">Intro (18€/sem)</span><span class="val">15%</span></div></div>';}},
            {title:'Étape 3 — ARPU & résultat',text:'L\'ARPU pondéré et le résultat net s\'affichent instantanément. Comparez les scénarios sans toucher au BP.',
             render:function(){return '<div class="sb2-kpi-row" style="--ac:#0d9488"><div class="sb2-kpi" style="--d:.08s"><div class="lbl">ARPU</div><div class="val">28,3€</div></div><div class="sb2-kpi" style="--d:.22s"><div class="lbl">CA/mois</div><div class="val">9 056€</div></div><div class="sb2-kpi" style="--d:.36s"><div class="lbl">Résultat net</div><div class="val" style="color:#0d9488">+1 640€</div></div></div>';}}
          ]
        },
        {
          id:'financier',icon:I.financier,accent:'#b45309',span:'how2-c4',
          cat:'finance',
          eyebrow:'Suivi financier',title:'Réel vs Prévisionnel',
          desc:'Comparez chaque mois le réel terrain et le BP initial. Détectez les écarts avant qu\'ils deviennent des problèmes.',
          tags:['financier','suivi','écarts','mensuel'],
          steps:[
            {title:'Tableau de bord financier',text:'Chaque ligne : mois, adhérents réels, CA réel, EBITDA. En vert si on est au-dessus du BP, rouge si en dessous.',
             render:function(){return '<div class="sb2-list" style="--ac:#b45309"><div class="sb2-item" style="--d:.05s"><span class="dot"></span><span class="txt">Mois 6</span><span class="val" style="color:#16a34a">+4%</span></div><div class="sb2-item" style="--d:.16s"><span class="dot"></span><span class="txt">Mois 9</span><span class="val">0%</span></div><div class="sb2-item" style="--d:.27s"><span class="dot"></span><span class="txt">Mois 12</span><span class="val" style="color:#dc2626">-3%</span></div></div>';}},
            {title:'Saisie mensuelle rapide',text:'Un formulaire ultra-simple : adhérents ce mois, CA encaissé. L\'app calcule l\'écart vs prévisionnel automatiquement.',
             render:function(){return '<div class="sb2-form" style="--ac:#b45309"><div class="sb2-field" style="--d:.06s"><label>Adhérents réels</label><input value="310" readonly/></div><div class="sb2-field" style="--d:.2s"><label>CA encaissé (€)</label><input value="43 800" readonly/></div></div>';}},
            {title:'Alertes EBITDA',text:'Si l\'EBITDA glisse sous le seuil de rentabilité, une notification push arrive sur votre téléphone. Réagissez avant la zone rouge.',
             render:function(){return '<div style="display:flex;flex-direction:column;align-items:center;gap:12px"><div class="sb2-badge" style="--ac:#b45309;--d:.1s">⚠ EBITDA sous seuil — Lattes</div><div class="sb2-badge" style="--ac:#16a34a;--d:.3s">✓ EBITDA OK — Garches</div></div>';}}
          ]
        }
      ]
    },
    {
      id:'terrain',label:'Terrain',
      chapters:[
        {
          id:'chalandise',icon:I.map,accent:'#7c3aed',span:'how2-c4',
          cat:'terrain',
          eyebrow:'Étude locale',title:'Zone de chalandise',
          desc:'500m · 1km · 2km. Population, densité, CSP+, transports — la data pour valider un emplacement.',
          tags:['chalandise','carte','population','démographie'],
          steps:[
            {title:'Trois cercles concentriques',text:'Les zones 500m, 1km, 2km s\'affichent automatiquement autour de l\'adresse du studio. Animation live sur la carte.',
             render:function(){return '<div class="sb2-rings" style="--ac:#7c3aed"><div class="sb2-ring r1" style="--d:.1s"><span class="sb2-ring-lbl">500m</span></div><div class="sb2-ring r2" style="--d:.3s"><span class="sb2-ring-lbl">1km</span></div><div class="sb2-ring r3" style="--d:.55s"><span class="sb2-ring-lbl">2km</span></div></div>';}},
            {title:'Données socio-démographiques',text:'Pour chaque rayon : habitants, densité/km², revenu médian, part CSP+, âge médian. La data nécessaire pour défendre un dossier bancaire.',
             render:function(){return '<div class="sb2-kpi-row" style="--ac:#7c3aed"><div class="sb2-kpi" style="--d:.08s"><div class="lbl">Population</div><div class="val">24k</div></div><div class="sb2-kpi" style="--d:.22s"><div class="lbl">CSP+</div><div class="val">38%</div></div><div class="sb2-kpi" style="--d:.36s"><div class="lbl">Rev. médian</div><div class="val">2 640€</div></div></div>';}},
            {title:'Transports & concurrence',text:'Arrêts de bus, métro, tramway à portée de marche. Et les concurrents fitness dans la zone — pour anticiper.',
             render:function(){return '<div class="sb2-list" style="--ac:#7c3aed"><div class="sb2-item" style="--d:.05s"><span class="dot"></span><span class="txt">Métro ligne 1 — 280m</span><span class="val">🚇</span></div><div class="sb2-item" style="--d:.18s"><span class="dot"></span><span class="txt">Tram T2 — 420m</span><span class="val">🚊</span></div><div class="sb2-item" style="--d:.31s"><span class="dot"></span><span class="txt">Concurrents directs</span><span class="val">2</span></div></div>';}}
          ]
        },
        {
          id:'local',icon:I.local,accent:'#6d28d9',span:'how2-c4',
          cat:'terrain',
          eyebrow:'Local & travaux',title:'Suivi du local',
          desc:'Superficie, loyer, planning travaux, photos de chantier. Tout le dossier immobilier en un onglet.',
          tags:['local','travaux','superficie','loyer'],
          steps:[
            {title:'Fiche locale complète',text:'Adresse, superficie, loyer au m², type de bail, propriétaire. Tout est accessible en un clic.',
             render:function(){return '<div class="sb2-list" style="--ac:#6d28d9;max-width:380px"><div class="sb2-item" style="--d:.05s"><span class="dot"></span><span class="txt">Superficie</span><span class="val">320 m²</span></div><div class="sb2-item" style="--d:.16s"><span class="dot"></span><span class="txt">Loyer mensuel</span><span class="val">6 500 €</span></div><div class="sb2-item" style="--d:.27s"><span class="dot"></span><span class="txt">Bail commercial</span><span class="val">3·6·9</span></div></div>';}},
            {title:'Avancement travaux',text:'Chaque lot de travaux (plomberie, électricité, peinture, signalétique) avec son % d\'avancement et sa date de fin prévue.',
             render:function(){return '<div class="sb2-list" style="--ac:#6d28d9;max-width:380px"><div class="sb2-item" style="--d:.05s"><span class="dot"></span><span class="txt">Gros œuvre</span><span class="val">100%</span></div><div class="sb2-item" style="--d:.16s"><span class="dot"></span><span class="txt">Électricité</span><span class="val">65%</span></div><div class="sb2-item" style="--d:.27s"><span class="txt">Signalétique</span><span class="val">0%</span></div></div>';}},
            {title:'Photos de chantier',text:'Uploadez les photos directement depuis mobile. Archivées par date, accessibles par toute l\'équipe.',
             render:function(){return '<div style="display:flex;gap:8px;justify-content:center"><div style="width:80px;height:80px;border-radius:12px;background:linear-gradient(135deg,#6d28d9 0%,#4c1d95 100%);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;opacity:0;animation:sb2Up .5s cubic-bezier(.34,1.56,.52,1) .1s forwards">📷</div><div style="width:80px;height:80px;border-radius:12px;background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;opacity:0;animation:sb2Up .5s cubic-bezier(.34,1.56,.52,1) .25s forwards">🏗️</div><div style="width:80px;height:80px;border-radius:12px;background:rgba(120,120,128,.12);display:flex;align-items:center;justify-content:center;color:#94a3b8;font:600 11px/1 -apple-system,system-ui,Inter,sans-serif;text-align:center;opacity:0;animation:sb2Up .5s cubic-bezier(.34,1.56,.52,1) .4s forwards">Ajouter</div></div>';}}
          ]
        },
        {
          id:'engagements',icon:I.engage,accent:'#b45309',span:'how2-c4',
          cat:'terrain',
          eyebrow:'Workflow',title:'Engagements',
          desc:'Du compromis à l\'ouverture : timeline, check-list, alertes J-7. Zéro échéance oubliée.',
          tags:['workflow','timeline','échéances','compromis'],
          steps:[
            {title:'Timeline ouverture',text:'Toutes les étapes clés d\'un studio Club Pilates — de la signature du compromis au jour J. Linéaire, limpide.',
             render:function(){return '<div class="sb2-timeline" style="--ac:#b45309"><div class="sb2-tl-track"><div class="sb2-tl-fill"></div></div><div class="sb2-tl-node" style="--d:.05s"><div class="sb2-tl-circle">1</div><div class="sb2-tl-lbl">Compromis</div></div><div class="sb2-tl-node" style="--d:.18s"><div class="sb2-tl-circle">2</div><div class="sb2-tl-lbl">Permis</div></div><div class="sb2-tl-node" style="--d:.31s"><div class="sb2-tl-circle">3</div><div class="sb2-tl-lbl">Travaux</div></div><div class="sb2-tl-node" style="--d:.44s"><div class="sb2-tl-circle">4</div><div class="sb2-tl-lbl">Formation</div></div><div class="sb2-tl-node" style="--d:.57s"><div class="sb2-tl-circle">5</div><div class="sb2-tl-lbl">Ouverture</div></div></div>';}},
            {title:'Dates prévues vs réelles',text:'Saisissez la date réelle dès qu\'une étape est franchie. L\'app calcule automatiquement le décalage sur les étapes suivantes.',
             render:function(){return '<div class="sb2-list" style="--ac:#b45309"><div class="sb2-item" style="--d:.05s"><span class="dot"></span><span class="txt">Compromis signé</span><span class="val">✓ J0</span></div><div class="sb2-item" style="--d:.18s"><span class="dot"></span><span class="txt">Permis accordé</span><span class="val">✓ +28j</span></div><div class="sb2-item" style="--d:.31s"><span class="dot"></span><span class="txt">Fin travaux</span><span class="val">En cours</span></div></div>';}},
            {title:'Alertes préventives',text:'À J-7 de chaque échéance : notification push sur mobile + email récap. Vous ne pouvez plus manquer une deadline.',
             render:function(){return '<div class="sb2-phone" style="--ac:#b45309"><div class="sb2-phone-notch"></div><div class="sb2-phone-card" style="--d:.12s"><div class="plbl">⚠ Alerte ISSEO</div><div class="pval" style="font-size:11px;line-height:1.4;color:rgba(255,255,255,.85);font-weight:500">Dépôt PC dans 7 jours — Lattes</div></div><div class="sb2-phone-card" style="--d:.3s"><div class="plbl">✓ Complété</div><div class="pval" style="font-size:11px;line-height:1.4;color:rgba(255,255,255,.85);font-weight:500">Compromis signé — Garches</div></div></div>';}}
          ]
        }
      ]
    },
    {
      id:'collab',label:'Collab & Intelligence',
      chapters:[
        {
          id:'collab',icon:I.collab,accent:'#db2777',span:'how2-c4',
          cat:'collab',
          eyebrow:'Travail en équipe',title:'Collaboration',
          desc:'Messages par studio, tâches assignées, notifications temps réel. L\'équipe ISSEO toujours dans la boucle.',
          tags:['messages','tâches','équipe','temps réel'],
          steps:[
            {title:'Fil de discussion par studio',text:'Chaque studio a son propre fil. Plus de WhatsApp mélangés. Tout est archivé, retrouvable, cité.',
             render:function(){return '<div class="sb2-chat" style="--ac:#db2777"><div class="sb2-bubble l" style="--d:.05s"><b>Paul</b>Permis accordé ✅ Lattes</div><div class="sb2-bubble r" style="--d:.28s"><b>Clément</b>Parfait, on démarre les travaux 🚀</div><div class="sb2-bubble l" style="--d:.51s"><b>Paul</b>Je t\'assigne la commande équipements.</div></div>';}},
            {title:'Tâches & assignation',text:'Créez une tâche en 2 secondes, assignez à un membre. La tâche apparaît dans son briefing du matin.',
             render:function(){return '<div class="sb2-list" style="--ac:#db2777"><div class="sb2-item" style="--d:.05s"><span class="dot"></span><span class="txt">Commande équipements</span><span class="val">@Clément</span></div><div class="sb2-item" style="--d:.18s"><span class="dot"></span><span class="txt">Valider planning</span><span class="val">@Paul</span></div><div class="sb2-item" style="--d:.31s"><span class="dot"></span><span class="txt">Formation coachs</span><span class="val">J-30</span></div></div>';}},
            {title:'Notifications push',text:'Dès qu\'une tâche est mise à jour ou qu\'un message vous mentionne, une push arrive sur votre mobile en moins de 2 secondes.',
             render:function(){return '<div class="sb2-phone" style="--ac:#db2777"><div class="sb2-phone-notch"></div><div class="sb2-phone-card" style="--d:.1s"><div class="plbl">Nouveau message</div><div class="pval" style="font-size:11px;line-height:1.4;color:rgba(255,255,255,.85);font-weight:500">Clément — Lattes</div></div><div class="sb2-phone-card" style="--d:.28s"><div class="plbl">Tâche complétée</div><div class="pval" style="font-size:11px;line-height:1.4;color:rgba(255,255,255,.85);font-weight:500">Commande équipements ✓</div></div></div>';}}
          ]
        },
        {
          id:'fichiers',icon:I.files,accent:'#0891b2',span:'how2-c4',
          cat:'collab',
          eyebrow:'Documents',title:'Fichiers',
          desc:'Contrats, permis, plans, photos — uploadés une fois, accessibles partout, classés par studio.',
          tags:['fichiers','documents','google drive','upload'],
          steps:[
            {title:'Bibliothèque par studio',text:'Chaque studio a sa propre bibliothèque de fichiers. Contrats, permis de construire, plans, photos de chantier — tout est là.',
             render:function(){return '<div class="sb2-list" style="--ac:#0891b2;max-width:380px"><div class="sb2-item" style="--d:.05s"><span class="dot"></span><span class="txt">Compromis_Lattes_2024.pdf</span><span class="val">📄</span></div><div class="sb2-item" style="--d:.16s"><span class="dot"></span><span class="txt">PC_Lattes_accordé.pdf</span><span class="val">✓</span></div><div class="sb2-item" style="--d:.27s"><span class="dot"></span><span class="txt">Plan_Lattes_v3.dwg</span><span class="val">📐</span></div></div>';}},
            {title:'Upload mobile direct',text:'Prenez une photo du contrat depuis votre iPhone, elle est uploadée et classée dans la seconde. Sans passer par un PC.',
             render:function(){return '<div class="sb2-phone" style="--ac:#0891b2"><div class="sb2-phone-notch"></div><div class="sb2-phone-card" style="--d:.1s"><div class="plbl">Upload en cours</div><div class="pval" style="font-size:11px;color:rgba(255,255,255,.85);font-weight:500">Contrat_signé.pdf → Lattes</div></div><div class="sb2-phone-card" style="--d:.28s"><div class="plbl">✓ Enregistré</div><div class="pval" style="font-size:11px;color:rgba(255,255,255,.85);font-weight:500">Google Drive synchronisé</div></div></div>';}},
            {title:'Google Drive synchronisé',text:'Activez l\'intégration Drive : tous les fichiers uploadés sont automatiquement copiés dans le dossier Drive du studio.',
             render:function(){return '<div style="display:flex;flex-direction:column;align-items:center;gap:14px"><div class="sb2-badge" style="--ac:#0891b2;--d:.1s">🔗 Google Drive connecté</div><div class="sb2-badge" style="--ac:#0891b2;--d:.3s">📁 3 fichiers synchronisés</div></div>';}}
          ]
        },
        {
          id:'echanges',icon:I.notif,accent:'#7c3aed',span:'how2-c4',
          cat:'collab',
          eyebrow:'Historique',title:'Échanges & notes',
          desc:'Toutes les notes de réunion, appels téléphoniques, échanges email — tracés et horodatés.',
          tags:['notes','échanges','historique','logs'],
          steps:[
            {title:'Journal d\'activité',text:'Chaque action sur un studio est loguée : appel téléphonique, note de réunion, email envoyé. Horodaté, attribué à un membre.',
             render:function(){return '<div class="sb2-list" style="--ac:#7c3aed"><div class="sb2-item" style="--d:.05s"><span class="dot"></span><span class="txt">Appel banque BNP</span><span class="val">Hier</span></div><div class="sb2-item" style="--d:.16s"><span class="dot"></span><span class="txt">Réunion cohorte 3</span><span class="val">Lundi</span></div><div class="sb2-item" style="--d:.27s"><span class="dot"></span><span class="txt">Note : PC en attente</span><span class="val">J-3</span></div></div>';}},
            {title:'Note rapide en 10 secondes',text:'Tapez votre note en sortant d\'un appel. Elle est liée au studio, horodatée, et visible par toute l\'équipe. Plus de post-its.',
             render:function(){return '<div class="sb2-form" style="--ac:#7c3aed"><div class="sb2-field" style="--d:.06s"><label>Type</label><input value="📞 Appel téléphonique" readonly/></div><div class="sb2-field" style="--d:.2s"><label>Résumé</label><input value="Banque OK, dossier validé" readonly/></div></div>';}},
            {title:'Recherche plein texte',text:'Retrouvez n\'importe quelle note en 2 mots. La recherche cherche dans tous les échanges de tous les studios simultanément.',
             render:function(){return '<div class="sb2-list" style="--ac:#7c3aed;max-width:360px"><div class="sb2-item" style="--d:.05s"><span class="dot"></span><span class="txt">Résultats pour "banque"</span><span class="val">4 notes</span></div><div class="sb2-item" style="--d:.16s"><span class="dot"></span><span class="txt">Lattes · BNP · J-1</span><span class="val">→</span></div></div>';}}
          ]
        }
      ]
    }
  ];

  // Flatten chapters for search
  var ALL_CHAPTERS=[];
  SECTIONS.forEach(function(s){s.chapters.forEach(function(c){ALL_CHAPTERS.push(c);});});

  // ── Quick-start use cases ─────────────────────────────────────────────────
  var QS=[
    {ico:'📝',label:'Préparer un RDV banque',ids:['bp','chalandise','financier']},
    {ico:'🔑',label:'Compromis vient d\'être signé',ids:['engagements','local','collab']},
    {ico:'📊',label:'Valider un business plan',ids:['bp','simulator','financier']},
    {ico:'🏗️',label:'Suivre un chantier',ids:['local','engagements','fichiers']},
    {ico:'👥',label:'Former mon équipe',ids:['collab','echanges','studios']}
  ];

  // ── State ─────────────────────────────────────────────────────────────────
  var _search='';
  var _favOnly=false;
  var _modal={ov:null,chapter:null,step:0,playing:true,timer:null,_sy:0,_bs:null};
  var STEP_MS=5500;

  // ── Render page ───────────────────────────────────────────────────────────
  function renderHowItWorks(){
    _ensureStyles();
    var done=_getProgress();var total=ALL_CHAPTERS.length;
    var doneCount=Object.keys(done).length;
    var favs=_getFavs();var favCount=Object.keys(favs).length;
    var h='<div class="how2">';
    // ── Hero ──
    h+='<div class="how2-hero">';
    h+='<div class="how2-hero-canvas"><div class="how2-orb o1"></div><div class="how2-orb o2"></div><div class="how2-orb o3"></div><div class="how2-grid-lines"></div></div>';
    h+='<div class="how2-hero-content">';
    h+='<div class="how2-badge"><span class="how2-badge-dot"></span>Guide interactif</div>';
    h+='<h1 class="how2-hero-title">Maîtrisez chaque<br/>fonctionnalité.</h1>';
    h+='<p class="how2-hero-sub">'+total+' modules animés. Chaque rubrique expliquée par la démo. Cliquez, explorez, essayez dans l\'app.</p>';
    h+='<div class="how2-search-wrap"><input class="how2-search" type="search" placeholder="Rechercher une fonctionnalité…" value="'+_esc(_search)+'" oninput="window._how2Search(this.value)" autocomplete="off" autocorrect="off" spellcheck="false"/><span class="how2-search-ico">'+I.search+'</span></div>';
    h+='<div class="how2-stats">';
    h+='<div class="how2-stat"><b>'+total+'</b><span>modules</span></div>';
    h+='<div class="how2-stat-sep"></div>';
    h+='<div class="how2-stat"><b>'+doneCount+'/'+total+'</b><span>vus</span></div>';
    h+='<div class="how2-stat-sep"></div>';
    h+='<div class="how2-stat"><b>'+(favCount||'—')+'</b><span>favoris</span></div>';
    h+='</div>';
    h+='</div></div>'; // hero-content / hero
    // ── Quick start ──
    h+='<div class="how2-quickstart">';
    h+='<div class="how2-fav-bar">';
    h+='<div class="how2-qs-label">Je veux…</div>';
    h+='<button class="how2-filter-btn'+(favCount>0&&_favOnly?' active':'')+'" onclick="window._how2ToggleFav()">'+(favCount>0&&_favOnly?I.heart:I.heartOutline)+' Favoris'+(favCount?' ('+favCount+')':'')+'</button>';
    h+='<div class="how2-progress-label"><div class="how2-progress-bar"><div class="how2-progress-fill" style="width:'+(doneCount/total*100).toFixed(1)+'%"></div></div>'+doneCount+'/'+total+'</div>';
    h+='</div>';
    h+='<div class="how2-qs-row">';
    QS.forEach(function(q){
      h+='<button class="how2-qs-btn" onclick="window._how2QS(\''+q.ids.join(',')+'\')" title="'+_esc(q.label)+'"><span class="how2-qs-ico">'+q.ico+'</span>'+_esc(q.label)+'</button>';
    });
    h+='</div>';
    h+='</div>';
    // ── Sections ──
    var query=_search.trim().toLowerCase();
    var anyVisible=false;
    SECTIONS.forEach(function(sec){
      var visible=sec.chapters.filter(function(c){
        if(_favOnly&&!_isFav(c.id))return false;
        if(!query)return true;
        return (c.title+' '+c.desc+' '+c.eyebrow+' '+(c.tags||[]).join(' ')).toLowerCase().indexOf(query)>=0;
      });
      if(!visible.length)return;
      anyVisible=true;
      h+='<div class="how2-section" id="how2-sec-'+sec.id+'">';
      h+='<div class="how2-section-head"><span class="how2-section-title">'+sec.label+'</span><span class="how2-section-count">'+visible.length+' module'+(visible.length>1?'s':'')+'</span></div>';
      h+='<div class="how2-grid">';
      visible.forEach(function(c,i){
        var fav=_isFav(c.id);var done=_isDone(c.id);
        h+='<div class="how2-card '+(c.span||'how2-c4')+'" data-how2-id="'+c.id+'" style="--ac:'+c.accent+';--cd:'+(0.05+i*0.07)+'s" onclick="window.openHowChapter(\''+c.id+'\')">';
        h+='<div class="how2-card-glow"></div>';
        if(done)h+='<div class="how2-card-done">'+I.check+'</div>';
        h+='<button class="how2-card-fav'+(fav?' active':'')+'" onclick="event.stopPropagation();window._how2Fav(\''+c.id+'\')" aria-label="Favori">'+(fav?I.heart:I.heartOutline)+'</button>';
        h+='<div class="how2-card-top">';
        h+='<div class="how2-card-ico">'+c.icon+'</div>';
        h+='<div class="how2-card-meta"><div class="how2-card-eyebrow">'+c.eyebrow+'</div><h3 class="how2-card-title">'+c.title+'</h3></div>';
        h+='</div>';
        h+='<p class="how2-card-desc">'+c.desc+'</p>';
        h+='<div class="how2-card-footer">';
        h+='<span class="how2-card-pill">'+I.clock+' '+c.steps.length+' étapes</span>';
        if(done)h+='<span class="how2-card-pill" style="color:#16a34a;background:rgba(22,163,74,.1)">'+I.check+' Vu</span>';
        h+='<span class="how2-card-arrow">'+I.arrow+'</span>';
        h+='</div>';
        h+='</div>';
      });
      h+='</div></div>';
    });
    if(!anyVisible){
      h+='<div class="how2-empty">Aucun résultat pour "<strong>'+_esc(query)+'</strong>".<br/>Essayez BP, adhérents, chalandise…</div>';
    }
    h+='</div>';
    return h;
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  function openHowChapter(id){
    _ensureStyles();
    var chap=ALL_CHAPTERS.find(function(c){return c.id===id;});
    if(!chap)return;
    if(_modal.ov)_closeImmediate();
    _modal.chapter=chap;_modal.step=0;_modal.playing=true;
    _modal._sy=window.scrollY||document.documentElement.scrollTop||0;
    _modal._bs={pos:document.body.style.position,top:document.body.style.top,left:document.body.style.left,right:document.body.style.right,w:document.body.style.width,ov:document.body.style.overflow};
    document.body.style.cssText='position:fixed;top:-'+_modal._sy+'px;left:0;right:0;width:100%;overflow:hidden';
    var fav=_isFav(id);
    var ov=document.createElement('div');
    ov.className='how2-modal';
    ov.innerHTML=''
      +'<div class="how2-modal-card" style="--ac:'+chap.accent+'">'
      +  '<div class="how2-modal-prog"><div class="how2-modal-prog-fill" style="width:0%"></div></div>'
      +  '<div class="how2-modal-tint"></div>'
      +  '<div class="how2-modal-hdr">'
      +    '<div class="how2-modal-hdr-ico">'+chap.icon+'</div>'
      +    '<div class="how2-modal-hdr-text"><div class="how2-modal-hdr-ey">'+chap.eyebrow+'</div><div class="how2-modal-hdr-title">'+chap.title+'</div></div>'
      +    '<div class="how2-modal-hdr-acts">'
      +      '<button class="how2-modal-fav'+(fav?' active':'')+'" id="how2mfav" aria-label="Favori">'+(fav?I.heart:I.heartOutline)+'</button>'
      +      '<button class="how2-modal-close" aria-label="Fermer">'+I.close+'</button>'
      +    '</div>'
      +  '</div>'
      +  '<div class="how2-modal-body">'
      +    '<div class="how2-stage"></div>'
      +    '<div class="how2-caption"><div class="how2-caption-row"><span class="how2-caption-num"></span><span class="how2-caption-ttl"></span></div><p class="how2-caption-txt"></p></div>'
      +    '<div class="how2-key-hint">'
      +      '<span class="how2-key"><kbd class="how2-kbd">←</kbd><kbd class="how2-kbd">→</kbd> Naviguer</span>'
      +      '<span class="how2-key"><kbd class="how2-kbd">Espace</kbd> Pause/Play</span>'
      +      '<span class="how2-key"><kbd class="how2-kbd">Esc</kbd> Fermer</span>'
      +    '</div>'
      +  '</div>'
      +  '<div class="how2-modal-ctrl">'
      +    '<button class="how2-ctrl-btn how2-prev" aria-label="Précédent">'+I.prev+'</button>'
      +    '<button class="how2-ctrl-btn how2-play" aria-label="Pause">'+I.pause+'</button>'
      +    '<div class="how2-dots"></div>'
      +    '<button class="how2-ctrl-btn how2-next" aria-label="Suivant">'+I.next+'</button>'
      +    '<button class="how2-cta-btn">'+_cta(chap).label+I.arrow+'</button>'
      +  '</div>'
      +'</div>';
    document.body.appendChild(ov);
    _modal.ov=ov;
    ov.querySelector('.how2-modal-close').onclick=closeHowChapter;
    ov.querySelector('.how2-prev').onclick=function(){_goto(_modal.step-1);};
    ov.querySelector('.how2-next').onclick=function(){_goto(_modal.step+1);};
    ov.querySelector('.how2-play').onclick=_togglePlay;
    ov.querySelector('#how2mfav').onclick=function(){
      _toggleFav(id);var f=_isFav(id);
      this.className='how2-modal-fav'+(f?' active':'');
      this.innerHTML=f?I.heart:I.heartOutline;
      var cardFav=document.querySelector('[data-how2-id="'+id+'"] .how2-card-fav');
      if(cardFav){cardFav.className='how2-card-fav'+(f?' active':'');cardFav.innerHTML=f?I.heart:I.heartOutline;}
      try{if(navigator.vibrate)navigator.vibrate(8);}catch(e){}
    };
    ov.querySelector('.how2-cta-btn').onclick=function(){
      closeHowChapter();
      var action=_cta(chap).action;
      if(action)setTimeout(function(){try{eval(action);}catch(e){}},380);
    };
    _bindSwipe(ov.querySelector('.how2-modal-card'));
    document.addEventListener('keydown',_onKey);
    _renderStep();
    _startTimer();
    try{if(navigator.vibrate)navigator.vibrate(10);}catch(e){}
  }

  function _renderStep(){
    if(!_modal.ov||!_modal.chapter)return;
    var chap=_modal.chapter,s=chap.steps[_modal.step];
    var card=_modal.ov.querySelector('.how2-modal-card');
    var stage=card.querySelector('.how2-stage');
    var capNum=card.querySelector('.how2-caption-num');
    var capTtl=card.querySelector('.how2-caption-ttl');
    var capTxt=card.querySelector('.how2-caption-txt');
    var dots=card.querySelector('.how2-dots');
    var prog=card.querySelector('.how2-modal-prog-fill');
    stage.innerHTML='<div class="how2-step active" style="--ac:'+chap.accent+'">'+s.render()+'</div>';
    capNum.textContent=_modal.step+1;
    capTtl.textContent=s.title;
    capTxt.textContent=s.text;
    dots.innerHTML='';
    chap.steps.forEach(function(st,i){
      var d=document.createElement('button');
      d.className='how2-dot'+(i===_modal.step?' active':'');
      d.setAttribute('aria-label','Étape '+(i+1));
      d.onclick=function(){_goto(i);};
      dots.appendChild(d);
    });
    prog.style.width=((_modal.step+1)/chap.steps.length*100)+'%';
    card.querySelector('.how2-prev').disabled=_modal.step===0;
    card.querySelector('.how2-next').disabled=_modal.step===chap.steps.length-1;
  }

  function _goto(idx){
    if(!_modal.chapter)return;
    if(idx<0||idx>=_modal.chapter.steps.length||idx===_modal.step)return;
    _modal.step=idx;_renderStep();
    try{if(navigator.vibrate)navigator.vibrate(6);}catch(e){}
    _startTimer();
  }

  function _startTimer(){
    _stopTimer();
    if(!_modal.playing)return;
    _modal.timer=setTimeout(function(){
      if(!_modal.chapter)return;
      var n=_modal.step+1;
      if(n>=_modal.chapter.steps.length){_modal.playing=false;_updatePlay();return;}
      _goto(n);
    },STEP_MS);
  }
  function _stopTimer(){if(_modal.timer){clearTimeout(_modal.timer);_modal.timer=null;}}

  function _togglePlay(){
    _modal.playing=!_modal.playing;_updatePlay();
    if(_modal.playing){
      if(_modal.step>=_modal.chapter.steps.length-1){_modal.step=0;_renderStep();}
      _startTimer();
    }else _stopTimer();
  }
  function _updatePlay(){
    if(!_modal.ov)return;
    var b=_modal.ov.querySelector('.how2-play');
    if(b)b.innerHTML=_modal.playing?I.pause:I.play;
  }

  function _onKey(e){
    if(!_modal.ov)return;
    if(e.key==='Escape')closeHowChapter();
    else if(e.key==='ArrowRight')_goto(_modal.step+1);
    else if(e.key==='ArrowLeft')_goto(_modal.step-1);
    else if(e.key===' '){e.preventDefault();_togglePlay();}
  }

  function _bindSwipe(el){
    var sx=0,sy=0,tk=false;
    el.addEventListener('touchstart',function(e){var t=e.touches[0];sx=t.clientX;sy=t.clientY;tk=true;},{passive:true});
    el.addEventListener('touchend',function(e){
      if(!tk)return;tk=false;
      var t=e.changedTouches[0];var dx=t.clientX-sx;var dy=t.clientY-sy;
      if(Math.abs(dy)>Math.abs(dx)&&dy>90){closeHowChapter();return;}
      if(Math.abs(dx)<44||Math.abs(dy)>Math.abs(dx)*.75)return;
      if(dx<0)_goto(_modal.step+1);else _goto(_modal.step-1);
    },{passive:true});
  }

  function _closeImmediate(){
    _stopTimer();
    if(_modal.ov&&_modal.ov.parentNode)_modal.ov.parentNode.removeChild(_modal.ov);
    _modal.ov=null;_modal.chapter=null;
    document.removeEventListener('keydown',_onKey);
    var bs=_modal._bs||{};
    document.body.style.position=bs.pos||'';document.body.style.top=bs.top||'';
    document.body.style.left=bs.left||'';document.body.style.right=bs.right||'';
    document.body.style.width=bs.w||'';document.body.style.overflow=bs.ov||'';
    if(typeof _modal._sy==='number')window.scrollTo(0,_modal._sy);
  }

  function closeHowChapter(){
    if(!_modal.ov)return;
    _stopTimer();
    // Mark done
    if(_modal.chapter)_markDone(_modal.chapter.id);
    _modal.ov.style.animation='how2Fade .25s cubic-bezier(.2,.8,.2,1) reverse forwards';
    setTimeout(_closeImmediate,260);
  }

  // ── Quick start modal — highlight cards for use case ─────────────────────
  function _how2QS(idsStr){
    var ids=idsStr.split(',');
    // Open first chapter immediately, show others highlighted
    openHowChapter(ids[0]);
  }

  // ── Search + filter ───────────────────────────────────────────────────────
  function _how2Search(v){
    _search=v;
    var el=document.getElementById('root');
    if(el)el.innerHTML=renderHowItWorks();
  }
  function _how2ToggleFav(){
    _favOnly=!_favOnly;
    var el=document.getElementById('root');
    if(el)el.innerHTML=renderHowItWorks();
  }
  function _how2Fav(id){
    _toggleFav(id);
    // Refresh page without closing anything
    var root=document.getElementById('root');
    if(root){root.innerHTML=renderHowItWorks();}
  }

  // ── CTA defaults per chapter ──────────────────────────────────────────────
  var CTA_MAP={
    accueil:{label:'Ouvrir l\'accueil',action:"setPage('accueil')"},
    studios:{label:'Voir mes studios',action:"setPage('projets')"},
    bp:{label:'Ouvrir un BP',action:"setPage('projets')"},
    simulator:{label:'Lancer le simulateur',action:"setPage('projets')"},
    financier:{label:'Suivi financier',action:"setPage('projets')"},
    chalandise:{label:'Explorer une zone',action:"setPage('projets')"},
    local:{label:'Fiche locale',action:"setPage('projets')"},
    engagements:{label:'Voir les engagements',action:"setPage('engagements')"},
    collab:{label:'Ouvrir Collab',action:"setPage('collab')"},
    fichiers:{label:'Accéder aux fichiers',action:"setPage('projets')"},
    echanges:{label:'Voir les échanges',action:"setPage('projets')"}
  };
  function _cta(chap){return chap.cta||CTA_MAP[chap.id]||{label:'Essayer',action:"setPage('projets')";};}

  // ── Utils ─────────────────────────────────────────────────────────────────
  function _esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  // ── Expose globals ────────────────────────────────────────────────────────
  window.renderHowItWorks=renderHowItWorks;
  window.openHowChapter=openHowChapter;
  window.closeHowChapter=closeHowChapter;
  window._how2Search=_how2Search;
  window._how2ToggleFav=_how2ToggleFav;
  window._how2Fav=_how2Fav;
  window._how2QS=_how2QS;
})();
