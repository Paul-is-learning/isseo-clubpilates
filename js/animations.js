// ── Animations & micro-interactions utilities ──────────────────────────────

// ── 0. Global helper: format EUR compact (1,2 M €, 395 k €, 980 €) ──
// Utilisé par les tiles BP consolidé (mobile-first, digeste)
window.fmtC=function(n){
  var r=Math.round(n||0);
  var abs=Math.abs(r);
  if(abs>=1e6)return (r/1e6).toFixed(abs>=1e7?0:1).replace('.',',').replace(/,0$/,'')+' M €';
  if(abs>=1e3)return Math.round(r/1e3)+' k €';
  return r+' €';
};

// ── 1. Animated number counters ──
// Usage: <span class="counter-anim" data-target="12345" data-format="eur">0</span>
// Formats: 'num' (default), 'eur' (fmt), 'int'
function animateCounters(root){
  var els=(root||document).querySelectorAll('.counter-anim');
  els.forEach(function(el){
    if(el._animated)return;
    // Skip counters inside CA hero cards — they animate via animateCACards()
    if(el.closest&&el.closest('.ca-hero-card:not(.ca-animated)'))return;
    el._animated=true;
    var target=parseFloat(el.getAttribute('data-target'))||0;
    var fmt=el.getAttribute('data-format')||'num';
    var duration=parseInt(el.getAttribute('data-duration')||'1200',10);
    var start=performance.now();
    function ease(t){return 1-Math.pow(1-t,3);} // easeOutCubic
    function fmtCompact(r){
      // Format compact FR : 1.2 M €, 395 k €, 980 €
      var abs=Math.abs(r);
      if(abs>=1e6)return (r/1e6).toFixed(abs>=1e7?0:1).replace('.',',').replace(/,0$/,'')+' M €';
      if(abs>=1e3)return Math.round(r/1e3)+' k €';
      return r+' €';
    }
    function format(v){
      var r=Math.round(v);
      if(fmt==='eur-compact'||(fmt==='eur'&&el.closest&&el.closest('.kpi-card')&&window.innerWidth<=480))return fmtCompact(r);
      if(fmt==='eur'){
        try{return window.fmt?window.fmt(r):(typeof window.fmt!=='undefined'?window.fmt(r):r.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g,' ')+' €');}catch(e){}
        return r.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g,' ')+' €';
      }
      if(fmt==='int')return r.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g,' ');
      return r.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g,' ');
    }
    function tick(now){
      var p=Math.min(1,(now-start)/duration);
      var v=ease(p)*target;
      el.textContent=format(v);
      if(p<1)requestAnimationFrame(tick);
      else el.textContent=format(target);
    }
    requestAnimationFrame(tick);
  });
}

// ── 2. Card 3D tilt ──
function attachCardTilt(){
  var cards=document.querySelectorAll('.card:not([data-tilt-bound])');
  cards.forEach(function(card){
    card.setAttribute('data-tilt-bound','1');
    card.addEventListener('mousemove',function(e){
      var r=card.getBoundingClientRect();
      var x=(e.clientX-r.left)/r.width;
      var y=(e.clientY-r.top)/r.height;
      var rx=(0.5-y)*6; // max 3° each side
      var ry=(x-0.5)*6;
      card.style.transform='perspective(900px) rotateX('+rx.toFixed(2)+'deg) rotateY('+ry.toFixed(2)+'deg) translateY(-4px)';
      card.style.setProperty('--mx',(x*100).toFixed(1)+'%');
      card.style.setProperty('--my',(y*100).toFixed(1)+'%');
    });
    card.addEventListener('mouseleave',function(){
      card.style.transform='';
    });
  });
}

// ── 3. Progress ring SVG ──
// size: diameter in px, pct: 0-100, color
function progressRingSVG(pct,size,color,label){
  size=size||60;
  color=color||'#1D9E75';
  var r=(size/2)-5;
  var c=2*Math.PI*r;
  var offset=c*(1-Math.max(0,Math.min(100,pct))/100);
  var sw=5;
  var html='<svg class="ring-progress" width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" style="--ring-circumference:'+c.toFixed(2)+';--ring-offset:'+offset.toFixed(2)+'">';
  html+='<circle cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+r+'" fill="none" stroke="#e8e8e0" stroke-width="'+sw+'"/>';
  html+='<circle class="ring-fg" cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="'+sw+'" stroke-linecap="round"/>';
  html+='</svg>';
  if(label!==false){
    html='<div style="position:relative;width:'+size+'px;height:'+size+'px;display:inline-block">'+html+'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:'+Math.round(size*0.22)+'px;font-weight:700;color:'+color+'">'+Math.round(pct)+'%</div></div>';
  }
  return html;
}

// ── 4. Confetti explosion ──
function confettiBurst(x,y){
  var canvas=document.getElementById('confetti-canvas');
  if(!canvas){
    canvas=document.createElement('canvas');
    canvas.id='confetti-canvas';
    document.body.appendChild(canvas);
  }
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  var ctx=canvas.getContext('2d');
  x=x==null?window.innerWidth/2:x;
  y=y==null?window.innerHeight/2:y;
  var colors=['#1D9E75','#1a3a6b','#FBBF24','#F87171','#60A5FA','#34D399','#c084fc'];
  var particles=[];
  for(var i=0;i<90;i++){
    var angle=Math.random()*Math.PI*2;
    var speed=6+Math.random()*8;
    particles.push({
      x:x,y:y,
      vx:Math.cos(angle)*speed,
      vy:Math.sin(angle)*speed-4,
      g:0.25,
      size:5+Math.random()*5,
      color:colors[Math.floor(Math.random()*colors.length)],
      rot:Math.random()*Math.PI*2,
      vr:(Math.random()-0.5)*0.3,
      life:0,max:80+Math.random()*40
    });
  }
  function frame(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    var alive=0;
    particles.forEach(function(p){
      p.life++;
      if(p.life>p.max)return;
      alive++;
      p.vy+=p.g;
      p.x+=p.vx;p.y+=p.vy;
      p.rot+=p.vr;
      var op=1-(p.life/p.max);
      ctx.save();
      ctx.globalAlpha=op;
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle=p.color;
      ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*0.6);
      ctx.restore();
    });
    if(alive>0)requestAnimationFrame(frame);
    else{ctx.clearRect(0,0,canvas.width,canvas.height);}
  }
  requestAnimationFrame(frame);
}

// ── 5. Success checkmark overlay ──
function successCheck(message){
  var existing=document.querySelector('.success-check-overlay');
  if(existing)existing.remove();
  var overlay=document.createElement('div');
  overlay.className='success-check-overlay';
  var box='<div class="success-check-box"><svg viewBox="0 0 52 52"><path d="M14 27 L22 35 L38 18"/></svg></div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
  setTimeout(function(){
    overlay.style.animation='checkFadeOut .4s ease forwards';
    setTimeout(function(){if(overlay.parentNode)overlay.remove();},420);
  },900);
}

// ── 6. Global custom tooltips ──
function initTooltips(){
  if(window._tooltipsInitialized)return;
  window._tooltipsInitialized=true;
  var tip=document.createElement('div');
  tip.id='ccd-tooltip';
  document.body.appendChild(tip);
  var showTimer=null;
  document.addEventListener('mouseover',function(e){
    var t=e.target.closest('[title]');
    if(!t)return;
    var text=t.getAttribute('title');
    if(!text)return;
    // Stash original title, remove to suppress native
    t.setAttribute('data-tt',text);
    t.removeAttribute('title');
    clearTimeout(showTimer);
    showTimer=setTimeout(function(){
      tip.textContent=text;
      var r=t.getBoundingClientRect();
      var tw=Math.min(tip.offsetWidth||180,260);
      var th=tip.offsetHeight||28;
      var left=r.left+r.width/2-tw/2;
      var top=r.top-th-10;
      var pos='top';
      if(top<8){top=r.bottom+10;pos='bottom';}
      left=Math.max(8,Math.min(left,window.innerWidth-tw-8));
      tip.style.left=left+'px';
      tip.style.top=top+'px';
      tip.setAttribute('data-pos',pos);
      tip.classList.add('show');
    },280);
  },true);
  document.addEventListener('mouseout',function(e){
    var t=e.target.closest('[data-tt]');
    if(!t)return;
    // Restore title
    var txt=t.getAttribute('data-tt');
    if(txt){t.setAttribute('title',txt);t.removeAttribute('data-tt');}
    clearTimeout(showTimer);
    tip.classList.remove('show');
  },true);
  window.addEventListener('scroll',function(){tip.classList.remove('show');},true);
}

// ── 7. Skeleton loader HTML ──
function skeletonLine(height,width){
  return '<span class="skeleton skeleton-line'+(height==='lg'?' lg':height==='sm'?' sm':'')+'" style="width:'+(width||'100%')+'"></span>';
}
function skeletonCard(){
  var h='<div class="skeleton-card">';
  h+=skeletonLine('lg','60%');
  h+=skeletonLine('','40%');
  h+='<div style="display:flex;align-items:center;gap:14px;margin-top:16px">';
  h+='<div class="skeleton" style="width:56px;height:56px;border-radius:50%"></div>';
  h+='<div style="flex:1">'+skeletonLine('','50%')+skeletonLine('sm','30%')+'</div></div>';
  h+='</div>';
  return h;
}
function skeletonGrid(n){
  n=n||4;
  var h='<div class="cards">';
  for(var i=0;i<n;i++)h+=skeletonCard();
  h+='</div>';
  return h;
}

// ── 8. Typewriter effect ──
function typewriter(el,text,duration,onDone){
  if(!el)return;
  duration=duration||1100;
  var delay=duration/Math.max(text.length,1);
  el.textContent='';
  var caret=document.createElement('span');
  caret.className='typewriter-caret';
  el.appendChild(caret);
  var i=0;
  var iv=setInterval(function(){
    i++;
    if(i>text.length){
      clearInterval(iv);
      setTimeout(function(){if(caret.parentNode)caret.remove();},600);
      if(onDone)onDone();
      return;
    }
    if(caret.parentNode)el.removeChild(caret);
    el.textContent=text.slice(0,i);
    el.appendChild(caret);
  },delay);
}
function typewriterGreet(){
  var el=document.querySelector('[data-typewriter-greet]');
  if(!el||el._typed)return;
  el._typed=true;
  var text=el.getAttribute('data-typewriter-text')||el.textContent;
  typewriter(el,text,900);
}

// ── 9. Sparkline SVG ──
function sparkline(values,opts){
  opts=opts||{};
  var w=opts.width||180;
  var h=opts.height||40;
  var stroke=opts.stroke||'rgba(255,255,255,0.75)';
  var fill=opts.fill||'rgba(255,255,255,0.15)';
  var pad=3;
  var min=Math.min.apply(null,values);
  var max=Math.max.apply(null,values);
  var range=max-min||1;
  var step=(w-pad*2)/Math.max(values.length-1,1);
  var pts=values.map(function(v,i){
    var x=pad+i*step;
    var y=pad+(h-pad*2)*(1-(v-min)/range);
    return x.toFixed(1)+','+y.toFixed(1);
  });
  var poly=pts.join(' ');
  var areaPoly=pts[0].split(',')[0]+','+(h-pad)+' '+poly+' '+pts[pts.length-1].split(',')[0]+','+(h-pad);
  var pathLen=0;
  // approximate path length for draw animation
  for(var i=1;i<pts.length;i++){
    var a=pts[i-1].split(',').map(parseFloat),b=pts[i].split(',').map(parseFloat);
    pathLen+=Math.hypot(b[0]-a[0],b[1]-a[1]);
  }
  var id='spk_'+Math.random().toString(36).slice(2,7);
  var svg='<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" style="display:block;overflow:visible">';
  svg+='<defs><linearGradient id="'+id+'" x1="0" x2="0" y1="0" y2="1">';
  svg+='<stop offset="0%" stop-color="'+stroke.replace('0.75','0.3')+'"/>';
  svg+='<stop offset="100%" stop-color="'+stroke.replace('0.75','0')+'"/>';
  svg+='</linearGradient></defs>';
  svg+='<polygon points="'+areaPoly+'" fill="url(#'+id+')"/>';
  svg+='<polyline points="'+poly+'" fill="none" stroke="'+stroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:'+pathLen.toFixed(0)+';stroke-dashoffset:'+pathLen.toFixed(0)+';animation:sparkDraw 1.4s .3s cubic-bezier(.2,.8,.2,1) forwards"/>';
  // last point dot
  var last=pts[pts.length-1].split(',');
  svg+='<circle cx="'+last[0]+'" cy="'+last[1]+'" r="3" fill="#fff" style="opacity:0;animation:sparkDot .3s 1.6s forwards"/>';
  svg+='</svg>';
  return svg;
}

// ── 10. Donut chart SVG (animated) ──
function donutChart(pct,opts){
  opts=opts||{};
  var size=opts.size||80;
  var sw=opts.stroke||8;
  var color=opts.color||'#1D9E75';
  var bg=opts.bg||'#e8e8e0';
  var label=opts.label==null?true:opts.label;
  var centerText=opts.centerText||(Math.round(pct)+'%');
  var centerColor=opts.centerColor||color;
  var r=(size-sw)/2;
  var c=2*Math.PI*r;
  var offset=c*(1-Math.max(0,Math.min(100,pct))/100);
  var svg='<svg class="donut-ring ring-progress" width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" style="--ring-circumference:'+c.toFixed(2)+';--ring-offset:'+offset.toFixed(2)+'">';
  svg+='<circle cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+r+'" fill="none" stroke="'+bg+'" stroke-width="'+sw+'"/>';
  svg+='<circle class="ring-fg" cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="'+sw+'" stroke-linecap="round"/>';
  svg+='</svg>';
  if(label){
    svg='<div style="position:relative;width:'+size+'px;height:'+size+'px;display:inline-block">'+svg+'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:'+Math.round(size*0.18)+'px;font-weight:700;color:'+centerColor+';letter-spacing:-0.3px">'+centerText+'</div></div>';
  }
  return svg;
}

// ── 11. Empty state illustrated ──
function emptyState(icon,title,sub){
  var icons={
    'inbox':'<svg width="64" height="64" viewBox="0 0 64 64" fill="none"><rect x="8" y="14" width="48" height="36" rx="4" stroke="#cbd5e1" stroke-width="2"/><path d="M8 34 L24 34 L28 42 L36 42 L40 34 L56 34" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="48" cy="20" r="8" fill="#dbeafe"/><path d="M44 20 L47 23 L52 17" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    'tasks':'<svg width="64" height="64" viewBox="0 0 64 64" fill="none"><rect x="12" y="10" width="40" height="48" rx="4" stroke="#cbd5e1" stroke-width="2"/><line x1="20" y1="22" x2="44" y2="22" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/><line x1="20" y1="32" x2="38" y2="32" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/><line x1="20" y1="42" x2="40" y2="42" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/><circle cx="48" cy="46" r="10" fill="#d1fae5"/><path d="M43 46 L47 50 L53 42" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    'chat':'<svg width="64" height="64" viewBox="0 0 64 64" fill="none"><path d="M10 18 a4 4 0 0 1 4-4 h36 a4 4 0 0 1 4 4 v24 a4 4 0 0 1 -4 4 h-16 l-10 8 v-8 h-10 a4 4 0 0 1 -4 -4 z" stroke="#cbd5e1" stroke-width="2" fill="#f1f5f9"/><circle cx="22" cy="30" r="2" fill="#94a3b8"/><circle cx="32" cy="30" r="2" fill="#94a3b8"/><circle cx="42" cy="30" r="2" fill="#94a3b8"/></svg>',
    'alert':'<svg width="64" height="64" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="22" fill="#d1fae5"/><path d="M22 32 L29 39 L42 25" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    'search':'<svg width="64" height="64" viewBox="0 0 64 64" fill="none"><circle cx="28" cy="28" r="16" stroke="#cbd5e1" stroke-width="2.5"/><line x1="40" y1="40" x2="52" y2="52" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/><path d="M22 28 L34 28" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/></svg>',
    'folder':'<svg width="64" height="64" viewBox="0 0 64 64" fill="none"><path d="M8 18 a4 4 0 0 1 4-4 h12 l4 6 h28 a4 4 0 0 1 4 4 v26 a4 4 0 0 1 -4 4 h-44 a4 4 0 0 1 -4 -4 z" stroke="#cbd5e1" stroke-width="2" fill="#f1f5f9"/></svg>',
    'money':'<svg width="64" height="64" viewBox="0 0 64 64" fill="none"><rect x="10" y="18" width="44" height="30" rx="4" stroke="#cbd5e1" stroke-width="2" fill="#f8fafc"/><circle cx="32" cy="33" r="8" stroke="#94a3b8" stroke-width="2"/><path d="M30 30 L34 30 M30 36 L34 36 M32 28 L32 38" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/></svg>'
  };
  var ic=icons[icon]||icons.inbox;
  return '<div class="empty-state">'+ic+'<div class="es-title">'+title+'</div>'+(sub?'<div class="es-sub">'+sub+'</div>':'')+'</div>';
}

// ── 12. Page transitions — direction-aware cinematic ──
var _lastPageKey=null;
var _NAV_ORDER=['accueil','projets','collab','prospection','bp','engagements'];
function triggerPageTransition(){
  var root=document.getElementById('root');
  if(!root)return;
  var pageKey=(window.S&&S.page?S.page:'')+'|'+(window.S&&S.selectedId?S.selectedId:'')+'|'+(window.S&&S.view?S.view:'');
  if(pageKey===_lastPageKey)return;
  _lastPageKey=pageKey;
  var mc=root.querySelector('.main-content');
  if(!mc)mc=root;
  mc.classList.remove('page-enter','page-slide-up','page-slide-down');
  void mc.offsetWidth;
  var prev=window._prevPage||'';
  var cur=window.S&&S.page?S.page:'';
  var pi=_NAV_ORDER.indexOf(prev);
  var ci=_NAV_ORDER.indexOf(cur);
  if(pi>=0&&ci>=0&&pi!==ci){
    mc.classList.add(ci>pi?'page-slide-up':'page-slide-down');
  } else {
    mc.classList.add('page-enter');
  }
}

// ── 12b. Stagger children above fold ──
function staggerChildren(){
  var mc=document.querySelector('.main-content');
  if(!mc)return;
  var els=mc.querySelectorAll('.card:not([data-stagger-done]),.box:not([data-stagger-done]),.health-score-card:not([data-stagger-done])');
  if(!els.length)return;
  var vh=window.innerHeight;
  var idx=0;
  for(var i=0;i<els.length;i++){
    var el=els[i];
    var r=el.getBoundingClientRect();
    if(r.top>=vh)continue;
    el.setAttribute('data-stagger-done','1');
    el.style.opacity='0';
    el.style.transform='translateY(14px)';
    el.style.transition='opacity .45s cubic-bezier(.22,.8,.24,1),transform .45s cubic-bezier(.22,.8,.24,1)';
    el.style.transitionDelay=(50*Math.min(idx,12))+'ms';
    idx++;
    (function(e){
      requestAnimationFrame(function(){requestAnimationFrame(function(){
        e.style.opacity='1';e.style.transform='translateY(0)';
      });});
    })(el);
  }
}

// ── 12c. Sidebar morphing pill ──
function morphSidebarPill(){
  var pill=document.getElementById('sidebar-pill');
  if(!pill)return;
  var active=document.querySelector('.sidebar-link.active');
  if(!active)return;
  var nav=pill.parentElement;
  if(!nav)return;
  var navRect=nav.getBoundingClientRect();
  var linkRect=active.getBoundingClientRect();
  var top=linkRect.top-navRect.top;
  var h=linkRect.height;
  if(!pill._initialized){
    pill.style.transition='none';
    pill.style.transform='translateY('+top+'px)';
    pill.style.height=h+'px';
    pill.style.opacity='1';
    requestAnimationFrame(function(){
      pill.style.transition='transform .35s cubic-bezier(.22,.8,.24,1),height .25s ease,opacity .3s ease';
      pill._initialized=true;
    });
  } else {
    pill.style.transform='translateY('+top+'px)';
    pill.style.height=h+'px';
  }
}

// ── 13. Scroll reveal ──
var _revealObserver=null;
function initScrollReveal(){
  if(!window.IntersectionObserver)return;
  if(!_revealObserver){
    _revealObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          e.target.classList.add('reveal-in');
          _revealObserver.unobserve(e.target);
        }
      });
    },{threshold:0.08,rootMargin:'0px 0px -40px 0px'});
  }
  // Observe targets : .card, .box, .cards > div
  var targets=document.querySelectorAll('.card:not([data-reveal-bound]),.box:not([data-reveal-bound])');
  targets.forEach(function(el,i){
    el.setAttribute('data-reveal-bound','1');
    el.classList.add('reveal');
    // subtle stagger — up to 6 items
    el.style.transitionDelay=Math.min(i,6)*40+'ms';
    _revealObserver.observe(el);
  });
}

// ── 14. Command palette ⌘K ──
function openCommandPalette(){
  if(document.getElementById('cmd-palette'))return;
  var overlay=document.createElement('div');
  overlay.id='cmd-palette';
  overlay.className='cmd-palette-overlay';
  // Build items list
  var items=_buildCommandItems();
  var box='<div class="cmd-palette-box">';
  box+='<div class="cmd-input-wrap">';
  box+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  box+='<input id="cmd-input" type="text" placeholder="Rechercher studios, pages, actions..." autocomplete="off"/>';
  box+='<span class="cmd-kbd">Esc</span></div>';
  box+='<div class="cmd-results" id="cmd-results"></div>';
  box+='<div class="cmd-footer"><span><span class="cmd-kbd">↑↓</span> naviguer</span><span><span class="cmd-kbd">↵</span> valider</span><span><span class="cmd-kbd">⌘K</span> fermer</span></div>';
  box+='</div>';
  overlay.innerHTML=box;
  document.body.appendChild(overlay);
  var input=document.getElementById('cmd-input');
  var results=document.getElementById('cmd-results');
  var filtered=items.slice();
  var sel=0;
  function renderResults(){
    if(!filtered.length){results.innerHTML='<div class="cmd-empty">Aucun résultat</div>';return;}
    var h='';
    filtered.slice(0,20).forEach(function(it,i){
      h+='<div class="cmd-item'+(i===sel?' selected':'')+'" data-idx="'+i+'">';
      h+='<div class="cmd-icon" style="background:'+it.color+'18;color:'+it.color+'">'+it.icon+'</div>';
      h+='<div class="cmd-text"><div class="cmd-label">'+it.label+'</div>';
      if(it.sub)h+='<div class="cmd-sub">'+it.sub+'</div>';
      h+='</div>';
      h+='<div class="cmd-cat">'+it.cat+'</div>';
      h+='</div>';
    });
    results.innerHTML=h;
    // bind click
    results.querySelectorAll('.cmd-item').forEach(function(el){
      el.addEventListener('click',function(){
        var i=parseInt(el.getAttribute('data-idx'),10);
        if(filtered[i])runCommandItem(filtered[i]);
      });
    });
  }
  function filter(){
    var q=(input.value||'').toLowerCase().trim();
    if(!q)filtered=items.slice();
    else filtered=items.filter(function(it){return (it.label+' '+(it.sub||'')+' '+it.cat).toLowerCase().indexOf(q)>=0;});
    sel=0;renderResults();
  }
  function close(){if(overlay.parentNode)overlay.remove();document.removeEventListener('keydown',keyHandler);}
  function runCommandItem(it){close();if(it.action)setTimeout(it.action,20);}
  function keyHandler(e){
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(sel+1,Math.min(filtered.length-1,19));renderResults();_scrollSelIntoView();return;}
    if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(sel-1,0);renderResults();_scrollSelIntoView();return;}
    if(e.key==='Enter'){e.preventDefault();if(filtered[sel])runCommandItem(filtered[sel]);return;}
  }
  function _scrollSelIntoView(){
    var el=results.querySelector('.cmd-item.selected');
    if(el&&el.scrollIntoView)el.scrollIntoView({block:'nearest'});
  }
  overlay.addEventListener('click',function(e){if(e.target===overlay)close();});
  input.addEventListener('input',filter);
  document.addEventListener('keydown',keyHandler);
  renderResults();
  setTimeout(function(){input.focus();},50);
}
function _buildCommandItems(){
  var items=[];
  // Pages
  var pages=[
    {l:'Accueil',p:'accueil',c:'#3b82f6',i:'🏠'},
    {l:'Studios',p:'projets',c:'#10b981',i:'📂'},
    {l:'Collab — Tâches & Discussions',p:'collab',c:'#7C3AED',i:'✨'},
    {l:'Prospection',p:'prospection',c:'#0F6E56',i:'🔍'},
    {l:'BP Consolidé',p:'bp',c:'#854F0B',i:'📊'},
    {l:'Récap engagements',p:'engagements',c:'#92630a',i:'📋'}
  ];
  pages.forEach(function(p){
    items.push({label:p.l,sub:'Naviguer vers '+p.l,icon:p.i,color:p.c,cat:'Page',action:function(){if(typeof setPage==='function')setPage(p.p);}});
  });
  // Studios
  if(window.S&&S.studios){
    Object.keys(S.studios).forEach(function(id){
      var st=S.studios[id];
      items.push({label:st.nom||id,sub:'Ouvrir le studio',icon:'🏢',color:'#6366f1',cat:'Studio',action:function(){if(typeof openDetail==='function')openDetail(id);}});
    });
  }
  // Actions
  items.push({label:'Basculer mode sombre / clair',sub:'Toggle thème',icon:'🌓',color:'#8b5cf6',cat:'Action',action:function(){if(typeof toggleDarkMode==='function')toggleDarkMode();}});
  items.push({label:'Nouveau studio',sub:'Créer un studio',icon:'➕',color:'#22c55e',cat:'Action',action:function(){if(typeof setPage==='function'){setPage('projets');setTimeout(function(){if(typeof toggleNewForm==='function')toggleNewForm();},200);}}});
  return items;
}
function initCommandPaletteShortcut(){
  if(window._cmdKInit)return;
  window._cmdKInit=true;
  document.addEventListener('keydown',function(e){
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){
      e.preventDefault();
      openCommandPalette();
    }
  });
}

// ── 15. Toast redesign ──
// Remplace window.toast pour empiler en bas droite
function initToastStack(){
  if(window._toastEnhanced)return;
  window._toastEnhanced=true;
  var stack=document.createElement('div');
  stack.id='toast-stack';
  document.body.appendChild(stack);
  var _origToast=window.toast;
  window.toast=function(msg,opts){
    opts=opts||{};
    // Auto-detect type from content
    var type=opts.type||'info';
    var s=(msg||'').toString();
    if(/erreur|error|échec|échec/i.test(s))type='error';
    else if(/✓|enregistr|sauvegard|ajout|cré[eé]|succ[eè]s|mis à jour|activ[eé]/i.test(s))type='success';
    else if(/attention|warn|avertissement/i.test(s))type='warn';
    var icons={
      success:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      error:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warn:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    var el=document.createElement('div');
    el.className='toast-new toast-'+type;
    el.innerHTML='<div class="toast-icon">'+(icons[type]||icons.info)+'</div><div class="toast-msg">'+msg+'</div><button class="toast-close" aria-label="Fermer">×</button><div class="toast-progress"></div>';
    stack.appendChild(el);
    var dur=opts.duration||3200;
    var start=Date.now();
    var pb=el.querySelector('.toast-progress');
    var raf;
    function tick(){
      var elapsed=Date.now()-start;
      var p=Math.min(1,elapsed/dur);
      if(pb)pb.style.transform='scaleX('+(1-p)+')';
      if(p<1)raf=requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    function dismiss(){
      el.classList.add('out');
      cancelAnimationFrame(raf);
      setTimeout(function(){if(el.parentNode)el.remove();},320);
    }
    el.querySelector('.toast-close').addEventListener('click',dismiss);
    setTimeout(dismiss,dur);
    // Also update legacy #toast element to stay in sync
    var legacy=document.getElementById('toast');
    if(legacy){legacy.textContent='';legacy.classList.remove('show');}
  };
}

// ── 16. Ripple effect ──
function initRipple(){
  if(window._rippleInit)return;
  window._rippleInit=true;
  // Ripple sur boutons d'action ; haptic universel sur tous les éléments cliquables
  var RIPPLE_SEL='.btn,button.btn-primary,button.btn-secondary,.sidebar-link,.tab,.bp-subtab,.focus-item,.focus-today-pill,.focus-today-next,.kpi-card';
  var HAPTIC_SEL=RIPPLE_SEL+',.btab,.icon-btn,.bc-item,.yr-tab,.month-btn,.folder-card-premium,.folder-card,.next-steps-widget__item,.bp-sa,.btn-sa';
  document.addEventListener('click',function(e){
    // Haptic tap léger (8ms) sur tout clic d'action
    try{
      var hel=e.target.closest(HAPTIC_SEL);
      if(hel&&!hel.disabled&&navigator.vibrate)navigator.vibrate(8);
    }catch(_){}
    // Ripple visible sur boutons principaux
    var btn=e.target.closest(RIPPLE_SEL);
    if(!btn||btn.disabled)return;
    var r=btn.getBoundingClientRect();
    var size=Math.max(r.width,r.height)*2;
    var ripple=document.createElement('span');
    ripple.className='ripple';
    ripple.style.width=ripple.style.height=size+'px';
    ripple.style.left=(e.clientX-r.left-size/2)+'px';
    ripple.style.top=(e.clientY-r.top-size/2)+'px';
    if(getComputedStyle(btn).position==='static')btn.style.position='relative';
    // N'impose pas overflow:hidden sur les sidebar-link/tab/kpi-card qui ont déjà leur style
    if(!btn.classList.contains('kpi-card')&&!btn.classList.contains('focus-today-pill'))btn.style.overflow='hidden';
    btn.appendChild(ripple);
    setTimeout(function(){if(ripple.parentNode)ripple.remove();},650);
  },true);
}

// ── 15. Mini sparkline for KPI cards ──
function miniSparkline(values,opts){
  opts=opts||{};
  var w=opts.width||80;
  var h=opts.height||22;
  var color=opts.color||'rgba(255,255,255,0.85)';
  var pad=2;
  if(!values||!values.length)return '';
  var min=Math.min.apply(null,values);
  var max=Math.max.apply(null,values);
  var range=max-min||1;
  var step=(w-pad*2)/Math.max(values.length-1,1);
  var pts=values.map(function(v,i){
    var x=pad+i*step;
    var y=pad+(h-pad*2)*(1-(v-min)/range);
    return x.toFixed(1)+','+y.toFixed(1);
  });
  var poly=pts.join(' ');
  var len=0;
  for(var i=1;i<pts.length;i++){
    var a=pts[i-1].split(',').map(parseFloat),b=pts[i].split(',').map(parseFloat);
    len+=Math.hypot(b[0]-a[0],b[1]-a[1]);
  }
  var last=pts[pts.length-1].split(',');
  return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" style="display:block;overflow:visible">'
    +'<polyline points="'+poly+'" fill="none" stroke="'+color+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:'+len.toFixed(0)+';stroke-dashoffset:'+len.toFixed(0)+';animation:sparkDraw 1.2s .5s cubic-bezier(.22,.9,.22,1) forwards"/>'
    +'<circle cx="'+last[0]+'" cy="'+last[1]+'" r="2" fill="'+color+'" style="opacity:0;animation:sparkDot .3s 1.55s forwards"/>'
    +'</svg>';
}

// ── 16. Generate smooth trend series for KPI sparkline ──
function generateTrendSeries(target,points){
  points=points||12;
  if(target<=0)return Array(points).fill(0);
  var vals=[];
  var cur=target*0.58;
  var avgStep=(target-cur)/(points-1);
  for(var i=0;i<points;i++){
    var noise=(Math.random()-0.3)*target*0.06;
    cur+=avgStep+noise;
    if(cur<0)cur=Math.abs(cur)*0.3;
    vals.push(cur);
  }
  vals[vals.length-1]=target;
  return vals;
}

// ── 17. Hero KPI carousel rotation ──
var _heroCarouselTimer=null;
function startHeroCarousel(){
  if(_heroCarouselTimer){clearInterval(_heroCarouselTimer);_heroCarouselTimer=null;}
  var wrap=document.querySelector('.hero-carousel');
  if(!wrap||wrap._bound)return;
  wrap._bound=true;
  var views=wrap.querySelectorAll('.hero-carousel-view');
  var dots=wrap.querySelectorAll('.hero-carousel-dot');
  var titles=[
    {icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',text:'CA cumulé (BP A1)'},
    {icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',text:'Top studios — CA prévisionnel'},
    {icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10H12z" fill="currentColor" fill-opacity=".35"/></svg>',text:'Répartition par statut'}
  ];
  var titleEl=wrap.querySelector('.hero-carousel-title');
  var titleIcon=wrap.querySelector('.hero-carousel-title-icon');
  if(!views.length)return;
  var idx=0;
  function show(i){
    // Reset bar animations on the new active view by clone trick
    views.forEach(function(v,j){
      var wasActive=v.classList.contains('active');
      v.classList.toggle('active',j===i);
      if(j===i && !wasActive){
        // Re-trigger bar animations
        var fills=v.querySelectorAll('.hero-bar-fill, .hero-cumview-chart');
        fills.forEach(function(f){
          var p=f.parentNode;var n=f.nextSibling;var c=f.cloneNode(true);
          p.removeChild(f);p.insertBefore(c,n);
        });
      }
    });
    dots.forEach(function(d,j){d.classList.toggle('active',j===i);});
    if(titleEl && titles[i]){
      var node=titleEl.querySelector('.hero-carousel-title-text');
      if(node)node.textContent=titles[i].text;
      if(titleIcon)titleIcon.innerHTML=titles[i].icon;
    }
    idx=i;
  }
  dots.forEach(function(d,j){
    d.addEventListener('click',function(){show(j);resetTimer();});
  });
  function resetTimer(){
    if(_heroCarouselTimer)clearInterval(_heroCarouselTimer);
    _heroCarouselTimer=setInterval(function(){
      show((idx+1)%views.length);
    },5400);
  }
  // Stop when sidebar changes page (observer on root dataset or just interval check)
  resetTimer();
}

// ── 17b. Gauge metric cycling ──
var _gaugeCycleTimer=null;
function startGaugeCycle(){
  var gauge=document.querySelector('.health-gauge[data-hs-metrics]');
  if(!gauge||gauge._gcBound)return;
  gauge._gcBound=true;
  var metrics;
  try{metrics=JSON.parse(gauge.getAttribute('data-hs-metrics'));}catch(e){return;}
  if(!metrics||!metrics.length)return;
  var r=parseFloat(gauge.getAttribute('data-hs-r'))||85;
  var cx=parseFloat(gauge.getAttribute('data-hs-cx'))||110;
  var cy=parseFloat(gauge.getAttribute('data-hs-cy'))||120;
  var fullArc=Math.PI*r;
  var nr=r-8;
  var svg=gauge.querySelector('svg');
  var arc=gauge.querySelector('.health-arc');
  var needle=gauge.querySelector('.health-needle');
  var hub=gauge.querySelector('.hg-hub');
  var dot=gauge.querySelector('.health-dot');
  var valEl=gauge.querySelector('.gc-value');
  var numEl=gauge.querySelector('.health-score-num');
  var label=gauge.parentNode?gauge.parentNode.querySelector('.gauge-cycle-label'):null;
  if(!label)label=gauge.closest('.health-score-card')?gauge.closest('.health-score-card').querySelector('.gauge-cycle-label'):null;
  var dotsWrap=label?label.nextElementSibling:null;
  var dotEls=dotsWrap?dotsWrap.querySelectorAll('.gauge-cycle-dot'):[];
  var idx=0;
  var curVal=metrics[0].v;
  function ease(t){return 1-Math.pow(1-t,3);}
  function show(i){
    var m=metrics[i];
    var fromVal=curVal;
    var toVal=m.v;
    var newAngle=-180+toVal*1.8;
    var newOffset=fullArc-fullArc*(toVal/100);
    var newNRad=newAngle*Math.PI/180;
    var newNx=cx+nr*Math.cos(newNRad);
    var newNy=cy+nr*Math.sin(newNRad);
    var epRad=newNRad;
    var newEpx=cx+r*Math.cos(epRad);
    var newEpy=cy+r*Math.sin(epRad);
    // Animate needle, arc, dot, counter over 600ms
    var oldNx=parseFloat(needle.getAttribute('x2'));
    var oldNy=parseFloat(needle.getAttribute('y2'));
    var oldOffset=parseFloat(arc.style.strokeDashoffset)||0;
    var oldEpx=parseFloat(dot.getAttribute('cx'));
    var oldEpy=parseFloat(dot.getAttribute('cy'));
    var start=performance.now();
    var dur=600;
    function tick(now){
      var p=Math.min(1,(now-start)/dur);
      var e2=ease(p);
      // Needle position
      needle.setAttribute('x2',(oldNx+(newNx-oldNx)*e2).toFixed(1));
      needle.setAttribute('y2',(oldNy+(newNy-oldNy)*e2).toFixed(1));
      // Arc fill
      arc.style.strokeDashoffset=(oldOffset+(newOffset-oldOffset)*e2).toFixed(1);
      // Endpoint dot
      dot.setAttribute('cx',(oldEpx+(newEpx-oldEpx)*e2).toFixed(1));
      dot.setAttribute('cy',(oldEpy+(newEpy-oldEpy)*e2).toFixed(1));
      // Counter
      var cv=Math.round(fromVal+(toVal-fromVal)*e2);
      if(valEl)valEl.textContent=cv;
      if(p<1)requestAnimationFrame(tick);
      else curVal=toVal;
    }
    requestAnimationFrame(tick);
    // Colors
    needle.setAttribute('stroke',m.c);
    if(hub)hub.setAttribute('fill',m.c);
    if(numEl)numEl.style.color=m.c;
    // Label fade
    if(label){
      label.style.opacity='0';
      setTimeout(function(){label.textContent=m.l;label.style.opacity='1';},200);
    }
    // Dots
    for(var d2=0;d2<dotEls.length;d2++){
      dotEls[d2].classList.toggle('active',d2===i);
      dotEls[d2].style.setProperty('--gc-color',d2===i?m.c:'');
    }
    idx=i;
  }
  // Dot click handlers
  for(var di=0;di<dotEls.length;di++){
    (function(j){
      dotEls[j].addEventListener('click',function(){show(j);resetTimer();});
    })(di);
  }
  // Pause on hover
  gauge.addEventListener('mouseenter',function(){
    if(_gaugeCycleTimer){clearInterval(_gaugeCycleTimer);_gaugeCycleTimer=null;}
  });
  gauge.addEventListener('mouseleave',function(){resetTimer();});
  function resetTimer(){
    if(_gaugeCycleTimer)clearInterval(_gaugeCycleTimer);
    _gaugeCycleTimer=setInterval(function(){
      show((idx+1)%metrics.length);
    },4000);
  }
  // Start after initial arc animation completes (~1.5s)
  setTimeout(function(){resetTimer();},2000);
}

// ── 18. Health sub-scores sequential reveal ──
function animateHealthSubScores(){
  var items=document.querySelectorAll('.hs-item:not([data-hs-animated])');
  if(!items.length)return;
  // Mark all immediately to prevent re-runs
  for(var k=0;k<items.length;k++)items[k].setAttribute('data-hs-animated','1');
  // Sequential reveal: each item appears 280ms after the previous
  var baseDelay=600; // wait for gauge arc animation to start
  for(var i=0;i<items.length;i++){
    (function(el,idx){
      var delay=baseDelay+idx*280;
      var barW=el.getAttribute('data-hs-bar')||'0';
      var targetVal=parseInt(el.getAttribute('data-hs-bar'))||0;
      var valEl=el.querySelector('[data-hs-val]');
      var barEl=el.querySelector('.hs-bar');
      setTimeout(function(){
        // 1. Reveal the item (slide up + fade in)
        el.style.opacity='1';
        el.style.transform='translateY(0)';
        // 2. Animate the number count-up
        if(valEl){
          var start=Date.now();var dur=600;
          (function tick(){
            var p=Math.min(1,(Date.now()-start)/dur);
            var eased=1-Math.pow(1-p,3); // easeOutCubic
            valEl.textContent=Math.round(targetVal*eased);
            if(p<1)requestAnimationFrame(tick);
          })();
        }
        // 3. Fill the progress bar (slightly delayed for drama)
        setTimeout(function(){
          if(barEl)barEl.style.width=barW+'%';
        },120);
      },delay);
    })(items[i],i);
  }
}

// ── 19. CA Hero Cards staggered pop-in ──
function animateCACards(){
  var cards=document.querySelectorAll('.ca-hero-card:not([data-ca-animated])');
  if(!cards.length)return;
  // Mark immediately to prevent re-runs
  for(var k=0;k<cards.length;k++)cards[k].setAttribute('data-ca-animated','1');
  var baseDelay=250;
  for(var i=0;i<cards.length;i++){
    (function(card,idx){
      var delay=baseDelay+idx*180;
      // Set shimmer delay to match card entrance
      card.style.animationDelay='0s';
      card.style.setProperty('--ca-shimmer-delay',(delay/1000+0.5)+'s');
      setTimeout(function(){
        card.classList.add('ca-animated');
        // Trigger counter-anim inside after card lands
        var ctr=card.querySelector('.counter-anim');
        if(ctr&&!ctr.getAttribute('data-counted')){
          ctr.setAttribute('data-counted','1');
          var target=parseInt(ctr.getAttribute('data-target'))||0;
          var fmt=ctr.getAttribute('data-format');
          var dur=parseInt(ctr.getAttribute('data-duration'))||1200;
          var start=Date.now();
          (function tick(){
            var p=Math.min(1,(Date.now()-start)/dur);
            var eased=1-Math.pow(1-p,3);
            var val=Math.round(target*eased);
            if(fmt==='eur'){
              ctr.textContent=val.toLocaleString('fr-FR')+' €';
            } else {
              ctr.textContent=val.toLocaleString('fr-FR');
            }
            if(p<1)requestAnimationFrame(tick);
          })();
        }
      },delay);
    })(cards[i],i);
  }
}

// ── 20. Magnetic cursor on primary buttons ──
function initMagneticButtons(){
  if(window._magneticInit)return;
  window._magneticInit=true;
  document.addEventListener('mousemove',function(e){
    var btns=document.querySelectorAll('.btn-primary');
    for(var i=0;i<btns.length;i++){
      var b=btns[i];
      var r=b.getBoundingClientRect();
      var cx=r.left+r.width/2;
      var cy=r.top+r.height/2;
      var dx=e.clientX-cx;
      var dy=e.clientY-cy;
      var dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<60){
        var pull=Math.min(4,(1-dist/60)*4);
        var tx=(dx/dist)*pull;
        var ty=(dy/dist)*pull;
        b.style.transform='translate('+tx.toFixed(1)+'px,'+ty.toFixed(1)+'px)';
      } else if(b.style.transform){
        b.style.transform='';
      }
    }
  },{passive:true});
}

// ── 19. Easter egg — triple-click logo ──
function initLogoEasterEgg(){
  if(window._eggInit)return;
  window._eggInit=true;
  var _clicks=0;var _timer=null;
  document.addEventListener('click',function(e){
    if(!e.target.closest('.sidebar-logo'))return;
    _clicks++;
    if(_timer)clearTimeout(_timer);
    _timer=setTimeout(function(){_clicks=0;},600);
    if(_clicks>=3){
      _clicks=0;
      if(typeof confettiBurst==='function')confettiBurst();
      if(typeof toast==='function')toast('🎉 Easter egg trouvé ! Bravo 👏');
    }
  });
}

// ── 21. Tab underline morph ──
function morphTabIndicator(){
  var tabs=document.querySelector('.tabs');
  if(!tabs)return;
  var active=tabs.querySelector('.tab.active');
  if(!active)return;
  var indicator=tabs.querySelector('.tab-indicator');
  if(!indicator){
    indicator=document.createElement('div');
    indicator.className='tab-indicator';
    tabs.appendChild(indicator);
  }
  var tabsRect=tabs.getBoundingClientRect();
  var activeRect=active.getBoundingClientRect();
  var left=activeRect.left-tabsRect.left;
  var width=activeRect.width;
  if(!indicator._init){
    indicator.style.transition='none';
    indicator._init=true;
    indicator.style.left=left+'px';
    indicator.style.width=width+'px';
    requestAnimationFrame(function(){indicator.style.transition='';});
  } else {
    indicator.style.left=left+'px';
    indicator.style.width=width+'px';
  }
}

// ── 22. Swipe gestures (mobile) ──
function initSwipeGestures(){
  if(window._swipeInit)return;
  window._swipeInit=true;
  var startX=0,startY=0,swiping=false,startedInTabs=false;
  document.addEventListener('touchstart',function(e){
    var t=e.touches[0];
    startX=t.clientX;startY=t.clientY;swiping=true;
    // Si le geste démarre dans la barre d'onglets (ou tout conteneur scrollable horizontal),
    // on laisse le scroll natif gérer — sinon on bloque la navigation horizontale.
    var tgt=e.target;
    startedInTabs=!!(tgt&&tgt.closest&&(tgt.closest('.tabs')||tgt.closest('[data-no-swipe-nav]')));
  },{passive:true});
  document.addEventListener('touchend',function(e){
    if(!swiping)return;swiping=false;
    if(startedInTabs){startedInTabs=false;return;}
    var t=e.changedTouches[0];
    var dx=t.clientX-startX;
    var dy=t.clientY-startY;
    if(Math.abs(dx)<60||Math.abs(dy)>Math.abs(dx)*0.7)return; // too short or too vertical
    // Detail tabs swipe
    if(typeof S!=='undefined'&&S.view==='detail'&&S.selectedId){
      var tabEls=document.querySelectorAll('.tabs .tab');
      if(tabEls.length<2)return;
      var ids=[];tabEls.forEach(function(el){
        var oc=el.getAttribute('onclick')||'';
        var m=oc.match(/setDetailTab\('([^']+)'\)/);
        if(m)ids.push(m[1]);
      });
      var ci=ids.indexOf(S.detailTab);
      if(ci<0)return;
      var ni=dx<0?ci+1:ci-1;
      if(ni>=0&&ni<ids.length&&typeof setDetailTab==='function'){
        setDetailTab(ids[ni]);
      }
      return;
    }
    // Main page swipe — edge swipe from left opens sidebar
    if(dx>0&&startX<30&&typeof toggleSidebar==='function'&&!S.sidebarOpen){
      toggleSidebar();
    }
  },{passive:true});
}

// ── 23b. Swipe-to-delete + Long-press sur tâches (mobile) ──
// Handlers globaux qui ciblent .task-row[data-task-id] via closest().
function initTaskGestures(){
  if(window._taskGesturesInit)return;
  window._taskGesturesInit=true;
  var activeRow=null,startX=0,startY=0,currentX=0,moved=false,suppressClick=false;
  var longTimer=null,longFired=false;
  var THRESH_DELETE=120,THRESH_REVEAL=50;

  function _findRow(target){return target.closest?target.closest('.task-row[data-task-id]'):null;}
  function _clearLong(){if(longTimer){clearTimeout(longTimer);longTimer=null;}}
  function _resetRow(row){if(row){row.style.transition='transform .22s cubic-bezier(.2,.8,.2,1)';row.style.transform='';row.classList.remove('swiping','ready-delete');}}

  document.addEventListener('touchstart',function(e){
    var row=_findRow(e.target);
    if(!row)return;
    activeRow=row;
    var t=e.touches[0];
    startX=t.clientX;startY=t.clientY;currentX=startX;
    moved=false;longFired=false;suppressClick=false;
    row.style.transition='';
    // Long-press timer
    _clearLong();
    longTimer=setTimeout(function(){
      if(moved||!activeRow)return;
      longFired=true;
      suppressClick=true;
      try{if(navigator.vibrate)navigator.vibrate([20,40,30]);}catch(e){}
      showTaskContextMenu(row);
    },480);
  },{passive:true});

  document.addEventListener('touchmove',function(e){
    if(!activeRow)return;
    var t=e.touches[0];
    currentX=t.clientX;
    var dx=currentX-startX,dy=t.clientY-startY;
    if(Math.abs(dx)>5||Math.abs(dy)>5)moved=true;
    // Cancel long-press si on bouge
    if(moved&&longTimer){_clearLong();}
    // Scroll vertical détecté → bail out du swipe
    if(Math.abs(dy)>Math.abs(dx)*1.2){
      if(activeRow.classList.contains('swiping')){_resetRow(activeRow);activeRow=null;}
      return;
    }
    // Swipe horizontal gauche uniquement (droite = navigation naturelle)
    if(dx<-10){
      activeRow.classList.add('swiping');
      var pull=Math.max(dx,-180);
      activeRow.style.transform='translateX('+pull+'px)';
      if(pull<=-THRESH_DELETE)activeRow.classList.add('ready-delete');
      else activeRow.classList.remove('ready-delete');
    } else if(activeRow.classList.contains('swiping')){
      activeRow.style.transform='';
      activeRow.classList.remove('ready-delete');
    }
  },{passive:true});

  document.addEventListener('touchend',function(){
    _clearLong();
    if(!activeRow){return;}
    var row=activeRow;activeRow=null;
    var dx=currentX-startX;
    if(dx<=-THRESH_DELETE){
      // Confirmer la suppression
      suppressClick=true;
      var sid=row.getAttribute('data-task-sid');
      var tid=row.getAttribute('data-task-id');
      row.style.transition='transform .25s ease,opacity .25s ease';
      row.style.transform='translateX(-100%)';
      row.style.opacity='0';
      setTimeout(function(){
        if(typeof confirmDeleteTask==='function'){confirmDeleteTask(sid,tid,row);}
        else{_resetRow(row);}
      },200);
    } else {
      _resetRow(row);
    }
  },{passive:true});

  // Bloque le click qui suit un long-press ou un swipe-delete
  document.addEventListener('click',function(e){
    if(suppressClick){e.stopPropagation();e.preventDefault();suppressClick=false;}
  },true);
}

// Context menu bottom-sheet pour une tâche (déclenché par long-press)
function showTaskContextMenu(row){
  var sid=row.getAttribute('data-task-sid');
  var tid=row.getAttribute('data-task-id');
  // Retire le menu existant
  var old=document.getElementById('task-ctx-sheet');if(old)old.remove();
  var sheet=document.createElement('div');
  sheet.id='task-ctx-sheet';
  sheet.className='task-ctx-overlay';
  sheet.innerHTML=
    '<div class="task-ctx-box" role="menu">'+
    '<div class="task-ctx-handle"></div>'+
    '<div class="task-ctx-title">Actions rapides</div>'+
    '<button class="task-ctx-item" data-action="done">'+
      '<span class="task-ctx-ic" style="color:#059669">✓</span>'+
      '<span>Marquer comme termin&eacute;e</span></button>'+
    '<button class="task-ctx-item" data-action="priority-high">'+
      '<span class="task-ctx-ic" style="color:#dc2626">🔥</span>'+
      '<span>Priorit&eacute; haute</span></button>'+
    '<button class="task-ctx-item" data-action="priority-normal">'+
      '<span class="task-ctx-ic" style="color:#64748b">●</span>'+
      '<span>Priorit&eacute; normale</span></button>'+
    '<button class="task-ctx-item danger" data-action="delete">'+
      '<span class="task-ctx-ic" style="color:#dc2626">🗑</span>'+
      '<span>Supprimer la t&acirc;che</span></button>'+
    '<button class="task-ctx-cancel" data-action="cancel">Annuler</button>'+
    '</div>';
  document.body.appendChild(sheet);
  requestAnimationFrame(function(){sheet.classList.add('open');});
  sheet.addEventListener('click',function(e){
    var btn=e.target.closest('[data-action]');
    var action=btn?btn.getAttribute('data-action'):(e.target===sheet?'cancel':null);
    if(!action)return;
    function close(){sheet.classList.remove('open');setTimeout(function(){sheet.remove();},250);}
    if(action==='cancel'){close();return;}
    if(action==='done'){
      var td=(S.todos&&S.todos[sid]||[]).filter(function(x){return x.id===tid;})[0];
      if(td&&typeof saveTodos==='function'){
        td.statut='done';
        saveTodos(sid);
        if(typeof toast==='function')toast('T&acirc;che termin&eacute;e ✓');
        if(typeof render==='function')render();
      }
    }
    else if(action==='priority-high'||action==='priority-normal'){
      var td2=(S.todos&&S.todos[sid]||[]).filter(function(x){return x.id===tid;})[0];
      if(td2&&typeof saveTodos==='function'){
        td2.priority=action==='priority-high'?'haute':'normale';
        saveTodos(sid);
        if(typeof toast==='function')toast('Priorit&eacute; mise &agrave; jour');
        if(typeof render==='function')render();
      }
    }
    else if(action==='delete'){
      if(typeof confirmDeleteTask==='function')confirmDeleteTask(sid,tid,row);
    }
    close();
  });
}

// Suppression effective d'une tâche (helper réutilisé par swipe + long-press)
async function confirmDeleteTask(sid,tid,rowEl){
  if(typeof S==='undefined'||!S.todos||!S.todos[sid])return;
  var td=S.todos[sid].filter(function(x){return x.id===tid;})[0];
  if(!td)return;
  if(!confirm('Supprimer la t\u00e2che \u00ab '+(td.titre||'sans titre')+' \u00bb ?'))return;
  S.todos[sid]=S.todos[sid].filter(function(x){return x.id!==tid;});
  if(typeof saveTodos==='function'){
    try{await saveTodos(sid);}catch(e){}
  }
  if(typeof toast==='function')toast('T\u00e2che supprim\u00e9e');
  try{if(navigator.vibrate)navigator.vibrate(20);}catch(e){}
  if(typeof render==='function')render();
}

// ── Swipe sur les "Prochaines étapes" — swipe gauche = valider l'étape ──
function initNextStepsSwipe(){
  if(window._nsSwipeInit)return;
  window._nsSwipeInit=true;
  var activeItem=null,startX=0,startY=0,currentX=0,moved=false,suppressClick=false;
  var THRESH_VALIDATE=110,THRESH_REVEAL=30;

  function _find(target){return target.closest?target.closest('.next-steps-widget__item[data-studio-id]'):null;}
  function _reset(el){if(!el)return;el.style.transition='transform .25s cubic-bezier(.2,.8,.2,1)';el.style.transform='';el.classList.remove('swiping','ready-validate');}

  document.addEventListener('touchstart',function(e){
    var it=_find(e.target);
    if(!it)return;
    activeItem=it;
    var t=e.touches[0];
    startX=t.clientX;startY=t.clientY;currentX=startX;
    moved=false;suppressClick=false;
    it.style.transition='';
  },{passive:true});

  document.addEventListener('touchmove',function(e){
    if(!activeItem)return;
    var t=e.touches[0];
    currentX=t.clientX;
    var dx=currentX-startX,dy=t.clientY-startY;
    if(Math.abs(dx)>5||Math.abs(dy)>5)moved=true;
    if(Math.abs(dy)>Math.abs(dx)*1.2){
      if(activeItem.classList.contains('swiping')){_reset(activeItem);activeItem=null;}
      return;
    }
    if(dx<-10){
      activeItem.classList.add('swiping');
      var pull=Math.max(dx,-160);
      activeItem.style.transform='translateX('+pull+'px)';
      if(pull<=-THRESH_VALIDATE){
        if(!activeItem.classList.contains('ready-validate')){
          activeItem.classList.add('ready-validate');
          try{if(navigator.vibrate)navigator.vibrate(12);}catch(e){}
        }
      } else {
        activeItem.classList.remove('ready-validate');
      }
    } else if(activeItem.classList.contains('swiping')){
      activeItem.style.transform='';
      activeItem.classList.remove('ready-validate');
    }
  },{passive:true});

  document.addEventListener('touchend',function(){
    if(!activeItem)return;
    var it=activeItem;activeItem=null;
    var dx=currentX-startX;
    if(dx<=-THRESH_VALIDATE){
      suppressClick=true;
      var sid=it.getAttribute('data-studio-id');
      var stepId=it.getAttribute('data-step-id');
      it.style.transition='transform .28s ease,opacity .28s ease';
      it.style.transform='translateX(-110%)';
      it.style.opacity='0';
      try{if(navigator.vibrate)navigator.vibrate([15,30,20]);}catch(e){}
      setTimeout(function(){
        if(typeof toggleStep==='function'&&sid&&stepId)toggleStep(sid,stepId);
        else _reset(it);
      },220);
    } else {
      _reset(it);
    }
  },{passive:true});

  document.addEventListener('click',function(e){
    if(suppressClick){e.stopPropagation();e.preventDefault();suppressClick=false;}
  },true);
}

// ── 23. Pull-to-refresh (mobile) ──
// Quand l'utilisateur tire vers le bas depuis le haut de la page, re-sync.
function initPullToRefresh(){
  if(window._ptrInit)return;
  window._ptrInit=true;
  var startY=0,currentY=0,pulling=false,ready=false;
  var THRESHOLD=70;
  var ind=null;
  function ensureIndicator(){
    if(ind)return ind;
    ind=document.createElement('div');
    ind.id='ptr-indicator';
    ind.innerHTML='<div class="ptr-icon"></div><span class="ptr-txt">Tirez pour rafraîchir</span>';
    document.body.appendChild(ind);
    return ind;
  }
  document.addEventListener('touchstart',function(e){
    if(window.scrollY>5)return;
    if(!S||!S.user||S.view==='auth')return;
    var t=e.touches[0];
    startY=t.clientY;currentY=startY;pulling=true;ready=false;
  },{passive:true});
  document.addEventListener('touchmove',function(e){
    if(!pulling)return;
    var t=e.touches[0];
    currentY=t.clientY;
    var dy=currentY-startY;
    if(dy<=0){pulling=false;if(ind)ind.classList.remove('show');return;}
    var i=ensureIndicator();
    var pulled=Math.min(dy*0.5,100);
    i.style.height=pulled+'px';
    i.classList.add('show');
    // Icon progresse
    var icon=i.querySelector('.ptr-icon');
    var txt=i.querySelector('.ptr-txt');
    if(pulled>=THRESHOLD){
      ready=true;
      if(icon)icon.style.transform='rotate(180deg)';
      if(txt)txt.textContent='Relâchez pour rafraîchir';
    } else {
      ready=false;
      if(icon)icon.style.transform='rotate('+(pulled/THRESHOLD*180)+'deg)';
      if(txt)txt.textContent='Tirez pour rafraîchir';
    }
  },{passive:true});
  document.addEventListener('touchend',function(){
    if(!pulling){return;}
    pulling=false;
    if(!ind)return;
    if(ready){
      ind.classList.add('ready');
      ind.style.height='60px';
      var txt=ind.querySelector('.ptr-txt');
      if(txt)txt.textContent='Rafraîchissement…';
      try{if(navigator.vibrate)navigator.vibrate(15);}catch(e){}
      // Re-sync des données via Supabase
      (typeof loadAll==='function'?loadAll():Promise.resolve()).then(function(){
        if(typeof render==='function')render();
        setTimeout(function(){
          ind.classList.remove('show','ready');
          ind.style.height='';
          if(typeof toast==='function')toast('Données à jour ✓');
        },300);
      }).catch(function(){
        ind.classList.remove('show','ready');
        ind.style.height='';
      });
    } else {
      ind.classList.remove('show');
      ind.style.height='';
    }
  },{passive:true});
}

// ── 23. Radar chart animation ──
function animateRadarChart(){
  var poly=document.querySelector('.radar-polygon:not([data-radar-done])');
  if(!poly)return;
  poly.setAttribute('data-radar-done','1');
  // Dots stagger
  var dots=document.querySelectorAll('.radar-dot');
  dots.forEach(function(d,i){
    d.style.animationDelay=(0.6+i*0.12)+'s';
  });
}

// ── 24. Unified modal helper ──
function openModalUnified(title,bodyHtml,opts){
  opts=opts||{};
  var overlay=document.createElement('div');
  overlay.className='modal-overlay-u';
  overlay.onclick=function(e){if(e.target===overlay){overlay.remove();if(opts.onClose)opts.onClose();}};
  var box=document.createElement('div');
  box.className='modal-box-u';
  if(opts.width)box.style.maxWidth=opts.width;
  var hdr='<div class="modal-hdr-u"><h3>'+(opts.icon||'')+title+'</h3><button class="modal-close-u" onclick="this.closest(\'.modal-overlay-u\').remove()">✕</button></div>';
  var body='<div class="modal-body-u">'+bodyHtml+'</div>';
  var foot='';
  if(opts.footer)foot='<div class="modal-foot-u">'+opts.footer+'</div>';
  box.innerHTML=hdr+body+foot;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  // Close on Escape
  var escH=function(e){if(e.key==='Escape'){overlay.remove();document.removeEventListener('keydown',escH);if(opts.onClose)opts.onClose();}};
  document.addEventListener('keydown',escH);
  return overlay;
}

// ── 25. Bottom tab bar active sync ──
function syncBottomTabBar(){
  var bar=document.getElementById('bottom-tab-bar');
  if(!bar)return;
  var btns=bar.querySelectorAll('.btab');
  btns.forEach(function(b){
    var pid=b.getAttribute('data-page');
    b.classList.toggle('active',pid===S.page);
  });
}

// ── Auto-run on render ──
// Hook pour déclencher les animations après chaque render
function afterRenderAnimations(){
  // Synchronous inits (idempotent, safe to run many times)
  try{initTooltips();}catch(e){}
  try{initCommandPaletteShortcut();}catch(e){}
  try{initToastStack();}catch(e){}
  try{initRipple();}catch(e){}
  try{initMagneticButtons();}catch(e){}
  try{initLogoEasterEgg();}catch(e){}
  try{triggerPageTransition();}catch(e){}
  try{staggerChildren();}catch(e){}
  try{morphSidebarPill();}catch(e){}
  try{morphTabIndicator();}catch(e){}
  try{syncBottomTabBar();}catch(e){}
  try{initSwipeGestures();}catch(e){}
  try{initPullToRefresh();}catch(e){}
  try{initTaskGestures();}catch(e){}
  try{initNextStepsSwipe();}catch(e){}
  try{initScrollReveal();}catch(e){}
  // Stop hero carousel & gauge cycle if we left the Accueil page
  if(!document.querySelector('.hero-carousel')){
    if(_heroCarouselTimer){clearInterval(_heroCarouselTimer);_heroCarouselTimer=null;}
  }
  if(!document.querySelector('.health-gauge')){
    if(_gaugeCycleTimer){clearInterval(_gaugeCycleTimer);_gaugeCycleTimer=null;}
  }
  // Per-element scanners — defer one frame for layout, fallback to setTimeout
  var _run=function(){
    try{animateCounters();}catch(e){}
    try{animateHealthSubScores();}catch(e){}
    try{animateCACards();}catch(e){}
    try{animateRadarChart();}catch(e){}
    try{attachCardTilt();}catch(e){}
    try{typewriterGreet();}catch(e){}
    try{startHeroCarousel();}catch(e){}
    try{startGaugeCycle();}catch(e){}
  };
  if(typeof requestAnimationFrame==='function'){
    var _fired=false;
    requestAnimationFrame(function(){if(_fired)return;_fired=true;_run();});
    setTimeout(function(){if(_fired)return;_fired=true;_run();},50);
  } else {
    setTimeout(_run,0);
  }
}

// Wrap de render() si dispo
if(typeof window!=='undefined'){
  var _oldRender=window.render;
  var _installRenderHook=function(){
    if(typeof window.render==='function'&&!window.render._animHooked){
      var orig=window.render;
      var wrapped=function(){var r=orig.apply(this,arguments);afterRenderAnimations();return r;};
      wrapped._animHooked=true;
      window.render=wrapped;
      // Ensure inits run even if a render happened before wrapping
      afterRenderAnimations();
    } else if(typeof window.render!=='function'){
      setTimeout(_installRenderHook,30);
    }
  };
  _installRenderHook();
  // Safety net: also run once on DOMContentLoaded
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){afterRenderAnimations();});
  } else {
    setTimeout(afterRenderAnimations,0);
  }
}
