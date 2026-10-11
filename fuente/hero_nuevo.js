/* ---------- Escena de portada: paralaje, inclinación del emblema y destellos en red (sistema complejo) ---------- */
(function(){
  const esc=document.getElementById('escena'), cv=document.getElementById('chispas'); if(!esc||!cv) return;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx=cv.getContext('2d'); let W=0,H=0,dpr=1;
  const ajusta=()=>{ dpr=Math.min(2,window.devicePixelRatio||1); W=esc.clientWidth; H=esc.clientHeight; cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); };
  ajusta(); addEventListener('resize',ajusta);
  const flt=[...esc.querySelectorAll('.flt')], emb=document.getElementById('emblema');
  const P=[]; const COL=['127,240,216','180,140,255','255,211,110','255,154,184','131,196,172'];
  let mx=-1e4, my=-1e4, activo=false, ultimo=0;
  function nace(x,y,n){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, v=0.4+Math.random()*1.6;
    P.push({x:x+(Math.random()-.5)*30, y:y+(Math.random()-.5)*30, vx:Math.cos(a)*v, vy:Math.sin(a)*v, r:1.4+Math.random()*2.6, vida:1, c:COL[(Math.random()*COL.length)|0]}); }
    if(P.length>170) P.splice(0,P.length-170); }
  esc.addEventListener('pointermove',e=>{ const r=esc.getBoundingClientRect(); mx=e.clientX-r.left; my=e.clientY-r.top; activo=true;
    const dx=(mx/W-.5), dy=(my/H-.5);
    flt.forEach(f=>{ const p=+f.dataset.p; f.style.transform=`translate(${dx*p}px,${dy*p}px) rotate(${dx*p*.25}deg)`; });
    if(emb) emb.style.transform=`perspective(900px) rotateY(${dx*14}deg) rotateX(${-dy*14}deg)`;
    const t=performance.now(); if(!quieto && t-ultimo>28){ nace(mx,my,3); ultimo=t; } });
  esc.addEventListener('pointerleave',()=>{ activo=false; mx=my=-1e4; flt.forEach(f=>f.style.transform=''); if(emb) emb.style.transform=''; });
  esc.addEventListener('click',e=>{ const r=esc.getBoundingClientRect(); nace(e.clientX-r.left, e.clientY-r.top, 40); });
  if(emb) emb.addEventListener('mouseenter',()=>{ const r=emb.getBoundingClientRect(), s=esc.getBoundingClientRect(); nace(r.left-s.left+r.width/2, r.top-s.top+r.height/2, 50); });
  function cuadro(){ ctx.clearRect(0,0,W,H);
    // núcleos fijos: las imágenes flotantes también son nodos del sistema
    const nodos=flt.map(f=>{ const r=f.getBoundingClientRect(), s=esc.getBoundingClientRect(); return {x:r.left-s.left+r.width/2, y:r.top-s.top+r.height/2}; });
    for(const p of P){ p.x+=p.vx; p.y+=p.vy; p.vx*=.985; p.vy*=.985; p.vy+=.006; p.vida-=.008; }
    for(let i=P.length-1;i>=0;i--) if(P[i].vida<=0) P.splice(i,1);
    // vínculos entre chispas cercanas (grafo de proximidad)
    ctx.lineWidth=1;
    for(let i=0;i<P.length;i++){ const a=P[i];
      for(let j=i+1;j<P.length;j++){ const b=P[j], d=Math.hypot(a.x-b.x,a.y-b.y); if(d<95){ ctx.strokeStyle=`rgba(${a.c},${(1-d/95)*Math.min(a.vida,b.vida)*.7})`; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } }
      for(const n of nodos){ const d=Math.hypot(a.x-n.x,a.y-n.y); if(d<170){ ctx.strokeStyle=`rgba(${a.c},${(1-d/170)*a.vida*.55})`; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(n.x,n.y); ctx.stroke(); ctx.setLineDash([]); } } }
    for(const p of P){ const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4); g.addColorStop(0,`rgba(${p.c},${p.vida})`); g.addColorStop(1,`rgba(${p.c},0)`);
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=`rgba(255,255,255,${p.vida})`; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*.6,0,Math.PI*2); ctx.fill(); }
    // destello en estrella junto al puntero
    if(activo){ ctx.save(); ctx.translate(mx,my); ctx.rotate(performance.now()/600); ctx.strokeStyle='rgba(255,236,170,.75)'; ctx.lineWidth=1.4;
      for(let k=0;k<4;k++){ ctx.rotate(Math.PI/4); ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(9,0); ctx.stroke(); } ctx.restore(); }
    requestAnimationFrame(cuadro); }
  if(!quieto) requestAnimationFrame(cuadro);
})();
/* ---------- Carrusel de aplicaciones (3D, automático, con flechas, puntos, teclado y deslizamiento) ---------- */
(function(){
  const carr=document.getElementById('carr'); if(!carr) return;
  const d=[...carr.querySelectorAll('.diapo')], n=d.length, pts=document.getElementById('puntos'); let i=0, t=null;
  pts.innerHTML=d.map((_,k)=>`<button aria-label="${k+1}"></button>`).join('');
  const pon=()=>{ d.forEach((el,k)=>{ let o=((k-i)%n+n)%n; if(o>n/2) o-=n; const a=Math.abs(o);
      el.style.transform=`translateX(${o*58}%) translateZ(${-a*260}px) rotateY(${-o*28}deg)`; el.style.opacity=a>1?0:a?0.55:1; el.style.filter=a?'blur(1.5px) saturate(.8)':'none'; el.style.zIndex=10-a; el.classList.toggle('act',a===0); el.setAttribute('aria-hidden',a?'true':'false'); });
    [...pts.children].forEach((b,k)=>b.classList.toggle('on',k===i)); };
  const ir=(k)=>{ i=((k%n)+n)%n; pon(); };
  const auto=()=>{ clearInterval(t); t=setInterval(()=>ir(i+1),6000); };
  document.getElementById('cAnt').onclick=()=>{ ir(i-1); auto(); }; document.getElementById('cSig').onclick=()=>{ ir(i+1); auto(); };
  [...pts.children].forEach((b,k)=>b.onclick=()=>{ ir(k); auto(); });
  d.forEach((el,k)=>el.addEventListener('click',e=>{ if(!el.classList.contains('act')){ e.preventDefault(); ir(k); auto(); } }));
  carr.addEventListener('mouseenter',()=>clearInterval(t)); carr.addEventListener('mouseleave',auto);
  carr.addEventListener('keydown',e=>{ if(e.key==='ArrowLeft'){ ir(i-1); auto(); } if(e.key==='ArrowRight'){ ir(i+1); auto(); } });
  let x0=null; carr.addEventListener('touchstart',e=>{ x0=e.touches[0].clientX; },{passive:true});
  carr.addEventListener('touchend',e=>{ if(x0==null) return; const dx=e.changedTouches[0].clientX-x0; if(Math.abs(dx)>40){ ir(i+(dx<0?1:-1)); auto(); } x0=null; });
  pon(); if(!matchMedia('(prefers-reduced-motion: reduce)').matches) auto();
})();
