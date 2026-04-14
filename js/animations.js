// ── Animations & micro-interactions utilities ──────────────────────────────

// ── 1. Animated number counters ──
// Usage: <span class="counter-anim" data-target="12345" data-format="eur">0</span>
// Formats: 'num' (default), 'eur' (fmt), 'int'
function animateCounters(root){
  var els=(root||document).querySelectorAll('.counter-anim');
  els.forEach(function(el){
    if(el._animated)return;
    el._animated=true;
    var target=parseFloat(el.getAttribute('data-target'))||0;
    var fmt=el.getAttribute('data-format')||'num';
    var duration=parseInt(el.getAttribute('data-duration')||'1200',10);
    var start=performance.now();
    function ease(t){return 1-Math.pow(1-t,3);} // easeOutCubic
    function format(v){
      if(fmt==='eur')return (typeof window.fmt==='function')?window.fmt(Math.round(v)):Math.round(v).toLocaleString('fr-FR');
      if(fmt==='int')return Math.round(v).toLocaleString('fr-FR');
      return Math.round(v).toLocaleString('fr-FR');
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

// ── Auto-run on render ──
// Hook pour déclencher les animations après chaque render
function afterRenderAnimations(){
  requestAnimationFrame(function(){
    animateCounters();
    attachCardTilt();
    typewriterGreet();
    initTooltips();
  });
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
    } else if(typeof window.render!=='function'){
      setTimeout(_installRenderHook,100);
    }
  };
  _installRenderHook();
}
