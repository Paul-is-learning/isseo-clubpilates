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

// ── 5. Auto-run on render ──
// Hook pour déclencher les animations après chaque render
function afterRenderAnimations(){
  requestAnimationFrame(function(){
    animateCounters();
    attachCardTilt();
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
