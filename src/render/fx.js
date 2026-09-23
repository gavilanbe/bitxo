"use strict";
/* =========================================================
   BITXO — render/fx: partículas y cinemáticas (evolución, nacimiento, ascenso)
   ========================================================= */
function drawParticles(dt){
  for(let i=UI.particles.length-1;i>=0;i--){
    const p = UI.particles[i];
    if(p.life0===undefined) p.life0 = p.life;
    if(p.vx) p.x += p.vx*dt;
    if(p.g) p.vy += p.g*dt;
    p.y += p.vy*dt; p.life -= dt;
    if(p.life<=0){ UI.particles.splice(i,1); continue; }
    /* se desvanecen en su último tercio en vez de desaparecer de golpe */
    const k = p.life/p.life0;
    if(k<0.33) ctx.globalAlpha = k/0.33;
    if(p.ch==='.') px(p.x,p.y,2,2,p.col);
    else drawText(p.ch, p.x, p.y, p.col);
    ctx.globalAlpha = 1;
  }
  for(let i=UI.floats.length-1;i>=0;i--){
    const f = UI.floats[i];
    f.y += f.vy*dt; f.life -= dt;
    if(f.life<=0){ UI.floats.splice(i,1); continue; }
    if(f.life0===undefined) f.life0 = f.life;
    /* salto de entrada y contorno: se lee sobre cualquier fondo */
    const age = f.life0 - f.life;
    const jy = age<160 ? Math.round(-3*Math.sin(age/160*Math.PI)) : 0;
    const k2 = f.life/f.life0;
    if(k2<0.3) ctx.globalAlpha = k2/0.3;
    drawTextOC(f.s, f.x, Math.round(f.y)+jy, f.col, 1);
    ctx.globalAlpha = 1;
  }
}

/* =========================================================
   CINEMATICAS — evolución, nacimiento y ascenso
   Todo avanza con el dt de JUEGO (el hitstop las congela) y las
   partículas son propias, para poder ordenarlas por capas.
   ========================================================= */
function cineP(list, o){
  o.vx = o.vx||0; o.vy = o.vy||0; o.life0 = o.life = o.life||600;
  list.push(o); return o;
}
function cineStep(list, dt){
  for(let i=list.length-1;i>=0;i--){
    const f = list[i];
    f.life -= dt;
    if(f.life<=0){ list.splice(i,1); continue; }
    if(f.drag){ const k = Math.exp(-f.drag*dt); f.vx*=k; f.vy*=k; }
    f.vy += (f.g||0)*dt;
    f.x += f.vx*dt; f.y += f.vy*dt;
    if(f.floor!==undefined && f.y>f.floor){
      f.y = f.floor; f.vy *= -0.42; f.vx *= 0.62;
      if(Math.abs(f.vy)<0.015) f.vy = 0;
    }
    const k = f.life/f.life0;
    ctx.globalAlpha = f.fade===false ? 1 : Math.min(1, k*3);
    const x = Math.round(f.x), y = Math.round(f.y);
    const kind = f.kind||'px';
    if(kind==='px'){
      ctx.fillStyle = f.col; ctx.fillRect(x, y, f.size||1, f.size||1);
    } else if(kind==='spark'){
      const sp = Math.hypot(f.vx, f.vy)||1, len = Math.min(7, sp*55);
      ctx.fillStyle = f.col;
      for(let j=0;j<=len;j++) ctx.fillRect(Math.round(f.x - f.vx/sp*j), Math.round(f.y - f.vy/sp*j), 1, 1);
    } else if(kind==='star'){
      const r = k>0.5 ? 2 : 1;
      ctx.fillStyle = f.col;
      ctx.fillRect(x-r, y, r*2+1, 1); ctx.fillRect(x, y-r, 1, r*2+1);
    } else if(kind==='shard'){
      /* trozo de cáscara que gira (3 poses) */
      const fr = f.vy===0 && f.vx*f.vx<0.0001 ? 0 : Math.floor(f.life/70 + (f.seed||0))%3;
      const wh = [[4,2],[2,4],[3,3]][fr];
      ctx.fillStyle = K; ctx.fillRect(x-1, y-1, wh[0]+2, wh[1]+2);
      ctx.fillStyle = f.col; ctx.fillRect(x, y, wh[0], wh[1]);
      if(f.spot){ ctx.fillStyle = f.spot; ctx.fillRect(x, y, 1, 1); }
    } else if(kind==='conf'){
      const flip = Math.floor(f.life/90 + (f.seed||0))%2;
      const wx = Math.round(Math.sin(f.life/120 + (f.seed||0))*1.5);
      ctx.fillStyle = f.col; ctx.fillRect(x+wx, y, flip?2:1, flip?1:2);
    } else if(kind==='heart'){
      drawText('♥', x, y, f.col);
    } else if(kind==='bubble'){
      /* burbuja: aro de 4 píxeles con brillo */
      ctx.fillStyle = f.col;
      ctx.fillRect(x-1, y-2, 3, 1); ctx.fillRect(x-1, y+2, 3, 1); ctx.fillRect(x-2, y-1, 1, 3); ctx.fillRect(x+2, y-1, 1, 3);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x-1, y-1, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}
/* disco de píxeles (sin antialias): halos y focos */
function pxDisc(cx, cy, r, col, sq){
  sq = sq||1;
  for(let dy=-r; dy<=r; dy++){
    const hw = Math.floor(Math.sqrt(r*r - dy*dy)*(1/sq));
    px(Math.round(cx-hw), Math.round(cy+dy), hw*2+1, 1, col);
  }
}
/* rayos de luz radiales, pixelados */
function pxBeams(cx, cy, n, r0, r1, a0, col, wmax){
  ctx.fillStyle = col;
  for(let i=0;i<n;i++){
    const a = a0 + i*(Math.PI*2/n), ca = Math.cos(a), sa = Math.sin(a);
    for(let r=r0;r<r1;r+=2){
      const w = 1 + Math.floor((r-r0)/(r1-r0)*(wmax||3));
      ctx.fillRect(Math.round(cx+ca*r - w/2), Math.round(cy+sa*r - w/2), w, w);
    }
  }
}
/* hash determinista (nada de Math.random por fotograma) */
function hash01(i){ const x = Math.sin(i*127.1+311.7)*43758.5453; return x - Math.floor(x); }
/* sprite a escala entera con squash opcional, pies en (x,y) */
function drawSprAt(spr, x, y, sc, sx, sy, sil){
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(sc*(sx||1), sc*(sy||1));
  ctx.drawImage(spr, -spr.width/2, -spr.height);
  if(sil>0){ ctx.globalAlpha = Math.min(1, sil); ctx.drawImage(silhouette(spr), -spr.width/2, -spr.height); ctx.globalAlpha = 1; }
  ctx.restore();
}
/* barras de cine que entran al empezar */
function cineBars(t, h){
  const k = ease.outCubic(clamp01(t/350));
  const bh = Math.round((h||22)*k);
  px(0,0,160,bh,'#000000'); px(0,272-bh,160,bh,'#000000');
}
/* texto sello: entra a 3x y se asienta a 2x */
function stampText(s, cx, y, col, age){
  if(age<0) return;
  const sc = age<90 ? 3 : 2;
  const dy = age<90 ? -Math.round((1-age/90)*6) - 2 : 0;
  drawTextOC(s, cx, y+dy, col, sc);
}

SFX.crack = function(n){
  nz(sfxAt(0), 0.04, 0.05, 3200+n*600, 2);
  tone({f:900+n*220, slide:600+n*150, d:0.05, type:'square', vol:0.03});
};
SFX.hatchPop = function(){
  kick(sfxAt(0), 0.12);
  nz(sfxAt(0), 0.25, 0.06, 2600, 0.8, 9000);
  [784,988,1175,1568].forEach((f,i)=> tone({f, at:sfxAt(0.06+i*0.06), d:0.2, type:'p25', vol:0.045, send:0.35}));
  [2093,2637].forEach((f,i)=> tone({f, at:sfxAt(0.34+i*0.05), d:0.3, type:'p125', vol:0.025, send:0.55}));
};
SFX.starLock = function(){
  [1047,1319,1568,2093].forEach((f,i)=> tone({f, at:sfxAt(i*0.07), d:0.6, type:'p125', vol:0.035, vib:true, send:0.6}));
  nz(sfxAt(0), 0.6, 0.012, 9500, 5);
};

/* ---- ASCENSO: sube entre luz, se vuelve estrella y se une a su constelación ---- */
const ASC_T = {star:2600, line:2700, msg:2900, exit:4200};
let AX = null;
function drawAscendFX(dt){
  if(!AX || UI.ascT < AX.t) AX = {t:0, fx:[], locked:false, trail:[]};
  UI.ascT += dt;
  const t = UI.ascT;
  AX.t = t;
  const now = performance.now();
  const p = AP();
  const n = G.ascensions||0;
  const tgt = legacyStarPos(n % 24);
  const TX = tgt.x+1, TY = tgt.y+21;

  /* cielo nocturno en bandas */
  px(0,0,160,272,'#0a0c26');
  px(0,90,160,90,'#0e1030');
  px(0,150,160,80,'#141646');
  px(0,200,160,72,'#1b1f5c');
  /* estrellas de fondo: titilan con su fase propia */
  for(const st of stars){
    const tw = Math.sin(now/500+st.t);
    if(tw>-0.3) px(st.x, st.y+20, 1, 1, tw>0.7 ? '#ffffff' : '#8a90c8');
  }
  for(let i=0;i<40;i++){
    const x = Math.floor(hash01(i)*160), y = Math.floor(hash01(i+99)*180)+10;
    if(Math.sin(now/700+i)>0.2) px(x, y, 1, 1, 'rgba(223,232,255,0.5)');
  }
  /* constelación de la dinastía: ascensos anteriores unidos */
  const prev = Math.min(24, n);
  ctx.fillStyle = 'rgba(255,217,74,0.28)';
  for(let i=1;i<prev;i++){
    const a = legacyStarPos(i-1), b = legacyStarPos(i);
    pxLine(a.x+1, a.y+21, b.x+1, b.y+21);
  }
  for(let i=0;i<prev;i++){
    const q = legacyStarPos(i);
    const tw = Math.sin(now/400+i*1.7) > 0.5;
    px(q.x, q.y+20, 2, 2, '#ffd94a');
    if(tw){ px(q.x-1, q.y+20, 4, 2, 'rgba(255,217,74,0.5)'); px(q.x, q.y+19, 2, 4, 'rgba(255,217,74,0.5)'); }
  }
  /* colinas del prado abajo */
  for(let x=0;x<160;x+=2){
    const hy = Math.round(236 + Math.sin(x/21)*5 + Math.sin(x/9)*2);
    px(x, hy, 2, 272-hy, '#0c1a28');
  }

  const spr = currentSprite();
  if(t < ASC_T.star){
    /* subida: ease in-out hacia su estrella */
    const k = ease.inOutSine(clamp01(t/ASC_T.star));
    const x = 80 + (TX-80)*k;
    const y = 232 - (232-TY)*k;
    const sc = k<0.55 ? 2 : 1;
    /* columna de luz desde el suelo */
    ctx.globalAlpha = 0.14*(1-k*0.5);
    px(Math.round(x)-8, Math.round(y), 16, 272-Math.round(y), '#fff3c0');
    ctx.globalAlpha = 0.18*(1-k*0.5);
    px(Math.round(x)-3, Math.round(y), 6, 272-Math.round(y), '#fff8d0');
    ctx.globalAlpha = 1;
    /* estela de ecos */
    for(let i=4;i>=1;i--){
      const kk = ease.inOutSine(clamp01((t-i*70)/ASC_T.star));
      const ex = 80 + (TX-80)*kk, ey = 232 - (232-TY)*kk;
      ctx.globalAlpha = 0.12*(5-i)/4;
      drawSprAt(silhouette(spr), ex, ey, kk<0.55 ? 2 : 1, 1, 1, 0);
    }
    ctx.globalAlpha = 1;
    /* chispas que orbitan (deterministas) */
    for(let i=0;i<8;i++){
      const a = now/300 + i*Math.PI/4;
      const r = (sc===2 ? 18 : 11) + Math.sin(now/200+i)*2;
      const ox = Math.round(Math.cos(a)*r), oy = Math.round(Math.sin(a)*r*0.5);
      px(Math.round(x)+ox, Math.round(y)-spr.height*sc/2+oy, 1, 1, i%2 ? '#ffd94a' : '#ffffff');
    }
    /* el bitxo, volviéndose luz */
    const glowA = clamp01((t-800)/1600);
    drawSprAt(spr, x, y, sc, 1, 1, glowA);
    /* motas que caen de la estela */
    if(Math.floor(t/60)!==Math.floor((t-dt)/60)){
      const i = Math.floor(t/60);
      cineP(AX.fx, {x:x-6+hash01(i)*12, y:y-2, vx:(hash01(i+1)-0.5)*0.01, vy:0.02+hash01(i+2)*0.02, life:900, col:i%2?'#ffd94a':'#fff8d0', size:1});
    }
  } else {
    /* se vuelve estrella: fogonazo y latido */
    if(!AX.locked){
      AX.locked = true;
      SFX.starLock(); shake(0.35); flash('#fff8d0', 0.6, 240); vibrate([30,30,60]);
      for(let i=0;i<20;i++){
        const a = i/20*Math.PI*2, sp = 0.04+hash01(i)*0.05;
        cineP(AX.fx, {x:TX, y:TY, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, drag:0.003, life:700+hash01(i+5)*400, col:i%2?'#ffd94a':'#ffffff', kind:i%3?'spark':'star'});
      }
      AX.ring = 0;
    }
    const st = t-ASC_T.star;
    AX.ring += dt*0.06;
    if(AX.ring<40){
      ctx.fillStyle = 'rgba(255,248,208,'+Math.max(0, 0.8-AX.ring/50).toFixed(2)+')';
      const m = Math.round(AX.ring*1.6)+8;
      for(let j=0;j<m;j++){ const a = j/m*Math.PI*2; ctx.fillRect(Math.round(TX+Math.cos(a)*AX.ring), Math.round(TY+Math.sin(a)*AX.ring), 1, 1); }
    }
    /* línea de constelación hacia la estrella anterior */
    if(n>0 && t>ASC_T.line){
      const a = legacyStarPos((n-1)%24);
      const k = ease.outCubic(clamp01((t-ASC_T.line)/600));
      ctx.fillStyle = 'rgba(255,217,74,0.7)';
      pxLine(a.x+1, a.y+21, a.x+1+(TX-a.x-1)*k, a.y+21+(TY-a.y-21)*k);
    }
    /* la estrella nueva, grande y latiendo */
    const big = st<500 ? 4 : (Math.floor(now/300)%2 ? 3 : 2);
    px(TX-big, TY, big*2+1, 1, '#fff8d0'); px(TX, TY-big, 1, big*2+1, '#fff8d0');
    px(TX-1, TY-1, 3, 3, '#ffd94a'); px(TX, TY, 1, 1, '#ffffff');
    if(st<600){ ctx.globalAlpha = 0.3*(1-st/600); pxDisc(TX, TY, 8, '#fff8d0'); ctx.globalAlpha = 1; }
  }
  cineStep(AX.fx, dt);
  cineBars(t, 14);

  /* textos */
  const nm = petName(p);
  if(t<ASC_T.star+200){
    /* se aparta cuando el bitxo sube a su altura */
    const py = 232 - (232-TY)*ease.inOutSine(clamp01(t/ASC_T.star));
    const a = Math.min(t<300 ? t/300 : 1, clamp01((py-150)/40));
    ctx.globalAlpha = a;
    drawTextOC(nm, 80, 126, '#ffffff', 2);
    drawTextOC('ASCIENDE AL CIELO', 80, 140, '#ffd94a', 1);
    ctx.globalAlpha = 1;
  }
  if(t>ASC_T.msg){
    const mt = t-ASC_T.msg;
    stampText('+'+UI.ascGain+' ★', 80, 120, '#ffd94a', mt);
    const k = clamp01((mt-300)/400);
    if(k>0){
      ctx.globalAlpha = k;
      drawTextOC('SU LUZ GUIARA A LOS', 80, 146, '#dfe8ff', 1);
      drawTextOC('QUE VENGAN DESPUES', 80, 154, '#dfe8ff', 1);
      ctx.globalAlpha = 1;
    }
    const k2 = clamp01((mt-700)/400);
    if(k2>0){
      ctx.globalAlpha = k2;
      const dyn = 'DINASTIA: '+(n+1)+(n+1===1 ? ' ESTRELLA' : ' ESTRELLAS');
      drawTextOC(dyn, 80, 172, '#ffd94a', 1);
      drawTextOC('GEN '+(p.gen||1)+' · '+nm, 80, 181, 'rgba(223,232,255,0.7)', 1);
      ctx.globalAlpha = 1;
    }
  }
  if(t>ASC_T.exit && Math.floor(now/420)%2===0) drawTextOC('TOCA PARA CONTINUAR', 80, 246, '#ffffff', 1);
}
/* línea de píxeles (Bresenham simple) con el fillStyle actual */
function pxLine(x0, y0, x1, y1){
  x0=Math.round(x0); y0=Math.round(y0); x1=Math.round(x1); y1=Math.round(y1);
  const dx = Math.abs(x1-x0), dy = -Math.abs(y1-y0), sx = x0<x1?1:-1, sy = y0<y1?1:-1;
  let err = dx+dy, guard = 0;
  while(guard++<400){
    ctx.fillRect(x0, y0, 1, 1);
    if(x0===x1 && y0===y1) break;
    const e2 = 2*err;
    if(e2>=dy){ err+=dy; x0+=sx; }
    if(e2<=dx){ err+=dx; y0+=sy; }
  }
}
