"use strict";
/* =========================================================
   BITXO — render/juice: el "nervio" compartido de todo el juego
   temblor de pantalla por trauma, hitstop, flashes, iris entre
   escenas, partículas con física, textos que saltan, monedas que
   vuelan al marcador y muelles de squash & stretch.
   Todo se llama en tiempo de ejecución: cualquier módulo puede usarlo.
   ========================================================= */
const JUICE = {
  trauma:0, sx:0, sy:0,           /* temblor: trauma 0..1, offset actual */
  flashA:0, flashCol:'#ffffff', flashMs:1,
  stopMs:0,                        /* hitstop global (congela el dt de juego) */
  wipe:null,                       /* iris de transición entre escenas */
  fam:null,                        /* familia de escena del frame anterior */
  fx:[],                           /* partículas v2 */
  pops:[],                         /* textos que saltan */
  coins:[],                        /* motas volando al marcador */
  ripples:[],                      /* ondas de toque */
  coinBumpAt:0,
  reduce:false                     /* modo calma: sin temblores ni flashes */
};

/* ---------- utilidades de easing ---------- */
const ease = {
  outCubic: t=>1-Math.pow(1-t,3),
  inCubic: t=>t*t*t,
  outBack: t=>{ const c1=1.70158, c3=c1+1; return 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2); },
  outElastic: t=>{ if(t<=0) return 0; if(t>=1) return 1; return Math.pow(2,-10*t)*Math.sin((t*10-0.75)*(2*Math.PI)/3)+1; },
  inOutSine: t=>-(Math.cos(Math.PI*t)-1)/2
};
function clamp01(v){ return v<0?0:(v>1?1:v); }

/* ---------- cámara: temblor, flash, hitstop ---------- */
function shake(amt){ if(JUICE.reduce) amt*=0.3; JUICE.trauma = Math.min(1, JUICE.trauma + amt); }
function flash(col, a, ms){
  if(JUICE.reduce) a = (a||0.7)*0.35;
  JUICE.flashCol = col||'#ffffff'; JUICE.flashA = Math.max(JUICE.flashA, a===undefined?0.7:a); JUICE.flashMs = ms||160;
}
function hitstop(ms){ JUICE.stopMs = Math.max(JUICE.stopMs, ms); }
/* avanza el reloj de juice; devuelve el dt de JUEGO (0 durante un hitstop) */
function juiceStep(dt){
  let gdt = dt;
  if(JUICE.stopMs>0){ JUICE.stopMs -= dt; gdt = 0; }
  JUICE.trauma = Math.max(0, JUICE.trauma - dt*0.0022);
  const s = JUICE.trauma*JUICE.trauma;
  const tt = performance.now();
  JUICE.sx = Math.round(s*5*Math.sin(tt*0.091)*Math.cos(tt*0.037));
  JUICE.sy = Math.round(s*4*Math.sin(tt*0.077+1.7));
  if(JUICE.flashA>0) JUICE.flashA = Math.max(0, JUICE.flashA - dt/JUICE.flashMs*0.9);
  return gdt;
}

/* ---------- familias de escena: el iris salta al cambiar de una a otra ---------- */
function sceneFamily(m){
  if(m==='battle') return 'battle';
  if(m==='train') return 'train';
  if(m && m.startsWith('mg')) return 'mg:'+m;
  if(m==='evolve'||m==='hatch'||m==='ascendFX') return 'cine';
  if(m==='boot') return 'boot';
  return 'world';
}
function wipeCheck(){
  const f = sceneFamily(UI.mode);
  if(JUICE.fam && f!==JUICE.fam && JUICE.fam!=='boot' && f!=='cine'){
    JUICE.wipe = {t:0, dur:420, cx:80, cy:136};
  }
  /* una cinemática empieza limpia: nada del prado flotando encima */
  if(f==='cine' && JUICE.fam!=='cine'){ JUICE.pops.length = 0; JUICE.fx.length = 0; }
  JUICE.fam = f;
}
/* iris que se abre en diamante de píxeles (NES) */
function drawWipe(dt){
  const w = JUICE.wipe; if(!w) return;
  w.t += dt;
  const k = clamp01(w.t/w.dur);
  if(k>=1){ JUICE.wipe = null; return; }
  const r = ease.inCubic(k)*230;
  ctx.fillStyle = K;
  for(let y=0;y<LH;y+=4){
    const dy = Math.abs(y+2-w.cy);
    const half = Math.max(0, r - dy);
    const x0 = Math.round(w.cx - half), x1 = Math.round(w.cx + half);
    if(half<=0){ ctx.fillRect(0,y,LW,4); continue; }
    if(x0>0) ctx.fillRect(0,y,x0,4);
    if(x1<LW) ctx.fillRect(x1,y,LW-x1,4);
  }
}

/* ---------- partículas v2: velocidad, gravedad, rozamiento, fundido ---------- */
/* kinds: 'px' (cuadrado), 'spark' (estela), 'star' (cruz), 'ring', 'heart', 'txt' */
function fx(o){
  if(JUICE.fx.length>420) JUICE.fx.shift();
  o.life0 = o.life = o.life||600;
  o.vx = o.vx||0; o.vy = o.vy||0; o.g = o.g||0; o.drag = o.drag===undefined?0:o.drag;
  o.size = o.size||1; o.kind = o.kind||'px';
  JUICE.fx.push(o);
  return o;
}
/* estallido radial */
function burst(x, y, o){
  o = o||{};
  const n = o.n||10, cols = o.cols||['#ffd94a','#fff8d0'];
  for(let i=0;i<n;i++){
    const a = (o.angle!==undefined ? o.angle + (Math.random()-0.5)*(o.spread||Math.PI*2)
             : Math.random()*Math.PI*2);
    const sp = (o.speed||0.08)*(0.45+Math.random()*0.8);
    fx({x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - (o.up||0), g:o.g===undefined?0.00018:o.g,
        drag:o.drag===undefined?0.002:o.drag, life:(o.life||520)*(0.7+Math.random()*0.6),
        size:o.size||(Math.random()<0.35?2:1), col:cols[i%cols.length], kind:o.kind||'px',
        floor:o.floor});
  }
}
/* confeti con gravedad y rebote en el suelo */
function confetti(x, y, n){
  const cols = ['#ffd94a','#e2574c','#5ec8d8','#7ac74f','#f2a2b8','#8a6ae8'];
  for(let i=0;i<(n||24);i++){
    const a = -Math.PI/2 + (Math.random()-0.5)*1.9;
    const sp = 0.07+Math.random()*0.11;
    fx({x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, g:0.00022, drag:0.0015,
        life:1300+Math.random()*700, size:Math.random()<0.5?2:1, col:cols[i%cols.length], kind:'px', floor:192, wob:Math.random()*6});
  }
}
function ringFx(x, y, col, r1, life){ fx({x, y, kind:'ring', col:col||'#ffffff', r1:r1||14, life:life||320}); }
function heartsFx(x, y, n){
  for(let i=0;i<(n||3);i++) fx({x:x-6+Math.random()*12, y:y-Math.random()*6, vx:(Math.random()-0.5)*0.02, vy:-0.03-Math.random()*0.02,
    g:0, drag:0, life:900+Math.random()*400, kind:'heart', col:'#f2a2b8', wob:Math.random()*6});
}
/* polvo al pisar / aterrizar */
function dustFx(x, y, n, col){
  for(let i=0;i<(n||5);i++){
    const d = i%2 ? 1 : -1;
    fx({x:x+d*(1+Math.random()*4), y:y-1, vx:d*(0.015+Math.random()*0.03), vy:-0.01-Math.random()*0.02,
        g:0.00005, drag:0.004, life:380+Math.random()*200, size:Math.random()<0.4?2:1, col:col||'rgba(230,220,190,0.8)'});
  }
}
function drawFx(dt){
  for(let i=JUICE.fx.length-1;i>=0;i--){
    const p = JUICE.fx[i];
    p.life -= dt;
    if(p.life<=0){ JUICE.fx.splice(i,1); continue; }
    if(p.drag){ const k = Math.exp(-p.drag*dt); p.vx*=k; p.vy*=k; }
    p.vy += p.g*dt;
    p.x += p.vx*dt; p.y += p.vy*dt;
    if(p.floor!==undefined && p.y>p.floor){ p.y = p.floor; p.vy *= -0.35; p.vx *= 0.6; }
    const k = p.life/p.life0; /* 1 → 0 */
    const a = p.fade===false ? 1 : Math.min(1, k*2.2);
    ctx.globalAlpha = a;
    if(p.kind==='px'){
      const s = p.shrink ? Math.max(1, Math.round(p.size*k)) : p.size;
      const wx = p.wob!==undefined ? Math.round(Math.sin(p.life/90+p.wob)) : 0;
      ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x)+wx, Math.round(p.y), s, s);
    } else if(p.kind==='spark'){
      ctx.fillStyle = p.col;
      const len = Math.min(5, Math.hypot(p.vx,p.vy)*40);
      const nx = p.vx/(Math.hypot(p.vx,p.vy)||1), ny = p.vy/(Math.hypot(p.vx,p.vy)||1);
      for(let j=0;j<=len;j++) ctx.fillRect(Math.round(p.x-nx*j), Math.round(p.y-ny*j), 1, 1);
    } else if(p.kind==='star'){
      ctx.fillStyle = p.col;
      const r = k>0.5 ? 2 : 1;
      ctx.fillRect(Math.round(p.x)-r, Math.round(p.y), r*2+1, 1);
      ctx.fillRect(Math.round(p.x), Math.round(p.y)-r, 1, r*2+1);
    } else if(p.kind==='ring'){
      const r = ease.outCubic(1-k)*p.r1 + 1;
      ctx.fillStyle = p.col;
      const n = Math.max(8, Math.round(r*2.4));
      for(let j=0;j<n;j++){
        const an = j/n*Math.PI*2;
        ctx.fillRect(Math.round(p.x+Math.cos(an)*r), Math.round(p.y+Math.sin(an)*r*0.8), 1, 1);
      }
    } else if(p.kind==='heart'){
      const wx = Math.round(Math.sin(p.life/140+(p.wob||0))*1.5);
      drawText('♥', Math.round(p.x)+wx, Math.round(p.y), p.col);
    } else if(p.kind==='txt'){
      drawText(p.s, Math.round(p.x), Math.round(p.y), p.col);
    }
  }
  ctx.globalAlpha = 1;
}

/* ---------- texto a escala entera sobre el lienzo principal ---------- */
function drawTextS(s, x, y, col, sc){
  if(sc===1){ drawText(s, x, y, col); return; }
  drawTextAt(ctx, s, Math.round(x), Math.round(y), col, sc);
}
function textWS(s, sc){ return String(s).length*4*sc - sc; }
/* texto con contorno oscuro de 1px: legible sobre cualquier fondo */
function drawTextO(s, x, y, col, sc, oc){
  sc = sc||1; oc = oc||K;
  for(const d of [[-1,0],[1,0],[0,-1],[0,1],[1,1]]) drawTextS(s, x+d[0], y+d[1], oc, sc);
  drawTextS(s, x, y, col, sc);
}
function drawTextOC(s, cx, y, col, sc, oc){ drawTextO(s, Math.round(cx - textWS(s, sc||1)/2), y, col, sc, oc); }

/* ---------- textos que saltan (daño, +motas, ¡NIVEL!) ---------- */
function popText(x, y, s, col, o){
  o = o||{};
  JUICE.pops.push({x, y, s:String(s), col:col||'#ffffff', t:0, life:o.life||900, sc:o.big?2:1, vy:o.vy===undefined?-0.018:o.vy, delay:o.delay||0});
}
function drawPops(dt){
  for(let i=JUICE.pops.length-1;i>=0;i--){
    const p = JUICE.pops[i];
    if(p.delay>0){ p.delay -= dt; continue; }
    p.t += dt;
    if(p.t>=p.life){ JUICE.pops.splice(i,1); continue; }
    const k = p.t/p.life;
    /* sube con salto elástico y se desvanece al final */
    const jump = ease.outBack(clamp01(p.t/220));
    const y = p.y + p.vy*p.t - (1-jump)*-4 - jump*3;
    ctx.globalAlpha = k>0.75 ? (1-k)/0.25 : 1;
    const sc = (p.sc===2 && p.t<90) ? 3 : p.sc;
    drawTextOC(p.s, p.x, Math.round(y), p.col, sc);
    ctx.globalAlpha = 1;
  }
}

/* ---------- motas que vuelan al marcador del HUD ---------- */
const COIN_TARGET = {x:78, y:5};
function flyCoins(x, y, n){
  n = Math.min(12, Math.max(1, n|0));
  for(let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2, sp = 0.04+Math.random()*0.05;
    JUICE.coins.push({x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-0.03, t:0, delay:i*35, wait:170+Math.random()*90, sx:0, sy:0});
  }
}
function drawCoins(dt){
  for(let i=JUICE.coins.length-1;i>=0;i--){
    const c = JUICE.coins[i];
    if(c.delay>0){ c.delay -= dt; continue; }
    c.t += dt;
    if(c.t < c.wait){
      /* primero salta hacia fuera... */
      c.x += c.vx*dt; c.y += c.vy*dt; c.vy += 0.0002*dt;
      c.vx *= Math.exp(-0.004*dt); c.vy *= Math.exp(-0.004*dt);
      c.sx = c.x; c.sy = c.y;
    } else {
      /* ...y luego es atraído al marcador con curva */
      const k = clamp01((c.t-c.wait)/380);
      const e = ease.inCubic(k);
      const mx = (c.sx+COIN_TARGET.x)/2 + 18, my = Math.min(c.sy, COIN_TARGET.y) - 10;
      const u = 1-e;
      c.x = u*u*c.sx + 2*u*e*mx + e*e*COIN_TARGET.x;
      c.y = u*u*c.sy + 2*u*e*my + e*e*COIN_TARGET.y;
      if(k>=1){
        JUICE.coins.splice(i,1);
        JUICE.coinBumpAt = performance.now();
        if(Math.random()<0.5) tone({f:1500+Math.random()*500, d:0.035, type:'p125', vol:0.022});
        continue;
      }
    }
    const blink = Math.floor((c.t+i*37)/80)%2;
    px(c.x-1, c.y, 3, 1, blink?'#fff8d0':'#ffd94a');
    px(c.x, c.y-1, 1, 3, blink?'#fff8d0':'#ffd94a');
    if(c.t>c.wait) px(c.x, c.y, 1, 1, '#ffffff');
  }
}

/* ---------- ondas de toque: cada dedo deja huella ---------- */
function tapRipple(x, y){
  JUICE.ripples.push({x, y, t:0});
  if(JUICE.ripples.length>6) JUICE.ripples.shift();
}
function drawRipples(dt){
  for(let i=JUICE.ripples.length-1;i>=0;i--){
    const r = JUICE.ripples[i];
    r.t += dt;
    if(r.t>260){ JUICE.ripples.splice(i,1); continue; }
    const k = r.t/260, rad = 2 + ease.outCubic(k)*7;
    ctx.globalAlpha = 0.75*(1-k);
    ctx.fillStyle = '#ffffff';
    for(let j=0;j<12;j++){
      const an = j/12*Math.PI*2;
      ctx.fillRect(Math.round(r.x+Math.cos(an)*rad), Math.round(r.y+Math.sin(an)*rad), 1, 1);
    }
    ctx.globalAlpha = 1;
  }
}

/* ---------- muelle de squash & stretch (para bitxos, botones, iconos) ---------- */
/* devuelve [sx, sy] para un impulso lanzado en 'at' con fuerza 'amp' */
function springSquash(at, amp, now){
  if(!at) return [1,1];
  const t = (now||performance.now()) - at;
  if(t<0 || t>700) return [1,1];
  const v = amp*Math.exp(-t/150)*Math.cos(t/42);
  return [1+v, 1-v];
}
function springOff(at, amp, now){
  if(!at) return 0;
  const t = (now||performance.now()) - at;
  if(t<0 || t>600) return 0;
  return amp*Math.exp(-t/120)*Math.sin(t/38);
}

/* ---------- viñeta suave cacheada ---------- */
let _vignette = null;
function drawVignette(h){
  if(!_vignette){
    _vignette = document.createElement('canvas'); _vignette.width = LW; _vignette.height = 196;
    const g = _vignette.getContext('2d');
    const gr = g.createRadialGradient(80, 118, 50, 80, 118, 150);
    gr.addColorStop(0, 'rgba(10,8,30,0)');
    gr.addColorStop(1, 'rgba(10,8,30,0.34)');
    g.fillStyle = gr; g.fillRect(0,0,LW,196);
    /* posteriza la viñeta en bandas con tramado: sigue siendo pixel art */
    const id = g.getImageData(0,0,LW,196), d = id.data;
    const B = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
    for(let y=0;y<196;y++) for(let x=0;x<LW;x++){
      const o = (y*LW+x)*4, n = (d[o+3]/255)/0.34;
      const lv = Math.min(4, Math.floor(n*4 + B[(y%4)*4+(x%4)]/16));
      d[o+3] = Math.round(lv/4*0.34*255);
    }
    g.putImageData(id,0,0);
  }
  ctx.drawImage(_vignette, 0, 0, LW, h||196, 0, 0, LW, h||196);
}

/* ---------- capa final: se pinta tras todo lo demás ---------- */
function drawJuiceOverlay(dt){
  /* en el prado las partículas van bajo el HUD (ya pintadas) */
  if(!JUICE.fxDrawn) drawFx(dt);
  JUICE.fxDrawn = false;
  drawPops(dt);
  drawCoins(dt);
  drawRipples(dt);
  if(JUICE.flashA>0.01){
    ctx.globalAlpha = Math.min(1, JUICE.flashA);
    ctx.fillStyle = JUICE.flashCol; ctx.fillRect(0,0,LW,LH);
    ctx.globalAlpha = 1;
  }
  drawWipe(dt);
}

/* true una vez cada 'ms' (en el frame que cruza la frontera): para
   emitir partículas desde código de dibujo sin depender de los Hz */
function every(ms, t){ return Math.floor(t/ms) !== Math.floor((t-16.7)/ms); }
