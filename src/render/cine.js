"use strict";
/* =========================================================
   BITXO — render/cine: las dos grandes cinemáticas (ECLOSIÓN y EVOLUCIÓN)
   Un motor común: el prado se funde en un "espacio" de energía del color
   de la línea (túnel de anillos, estrellas que salen disparadas, rayos),
   partículas elementales que orbitan en espiral, latidos a tempo con una
   partitura que sube y se acelera, un clímax en silencio y cámara lenta,
   y el estallido con platillo y fanfarria del tema. Sprites a 4x, revelado
   con barrido de color, pose y nombre letra a letra.
   ========================================================= */

/* ---------- partículas propias: pueden orbitar en espiral ---------- */
function cpAdd(list, o){ o.life0 = o.life = o.life||800; o.vx=o.vx||0; o.vy=o.vy||0; list.push(o); return o; }
function cpStep(list, dt, slow){
  const k0 = slow===undefined ? 1 : slow, d = dt*k0;
  for(let i=list.length-1;i>=0;i--){
    const f = list[i];
    f.life -= d;
    if(f.life<=0){ list.splice(i,1); continue; }
    if(f.orb){
      /* órbita: ángulo que avanza y radio que se cierra hacia el centro */
      f.a += f.w*d; f.r = Math.max(0, f.r + f.dr*d);
      f.x = f.cx + Math.cos(f.a)*f.r; f.y = f.cy + Math.sin(f.a)*f.r*(f.flat||0.62);
      if(f.r<=1) f.life = Math.min(f.life, 60);
    } else {
      if(f.drag){ const k = Math.exp(-f.drag*d); f.vx*=k; f.vy*=k; }
      f.vy += (f.g||0)*d; f.x += f.vx*d; f.y += f.vy*d;
      if(f.floor!==undefined && f.y>f.floor){ f.y = f.floor; f.vy *= -0.4; f.vx *= 0.6; if(Math.abs(f.vy)<0.015) f.vy = 0; }
    }
    if(f.behind!==undefined && f.behind !== list._layer) continue;
    const k = f.life/f.life0;
    ctx.globalAlpha = f.fade===false ? 1 : Math.min(1, k*2.5);
    const x = Math.round(f.x), y = Math.round(f.y), kind = f.kind||'px';
    ctx.fillStyle = f.col;
    if(kind==='px'){ ctx.fillRect(x, y, f.size||1, f.size||1); }
    else if(kind==='spark'){
      const vx = f.orb ? -Math.sin(f.a)*f.w*f.r : f.vx, vy = f.orb ? Math.cos(f.a)*f.w*f.r*0.62 : f.vy;
      const sp = Math.hypot(vx, vy)||1, len = Math.min(8, sp*50);
      for(let j=0;j<=len;j++) ctx.fillRect(Math.round(f.x - vx/sp*j), Math.round(f.y - vy/sp*j), 1, 1);
    }
    else if(kind==='star'){ const r = k>0.5 ? 2 : 1; ctx.fillRect(x-r, y, r*2+1, 1); ctx.fillRect(x, y-r, 1, r*2+1); }
    else if(kind==='leaf'){ const fl = Math.floor(f.life/80+(f.seed||0))%3; if(fl===0) ctx.fillRect(x, y, 2, 1); else if(fl===1) ctx.fillRect(x, y, 1, 2); else { ctx.fillRect(x, y, 2, 2); } }
    else if(kind==='bubble'){ ctx.fillRect(x-1, y-2, 3, 1); ctx.fillRect(x-1, y+2, 3, 1); ctx.fillRect(x-2, y-1, 1, 3); ctx.fillRect(x+2, y-1, 1, 3); ctx.fillStyle='#ffffff'; ctx.fillRect(x-1, y-1, 1, 1); }
    else if(kind==='puff'){ const r = 1 + Math.round((1-k)*3); pxDisc(x, y, r, f.col, 1); }
    else if(kind==='shard'){
      const fr = Math.floor(f.life/70 + (f.seed||0))%3, s = f.size||1;
      const wh = [[4*s,2*s],[2*s,4*s],[3*s,3*s]][fr];
      ctx.fillStyle = K; ctx.fillRect(x-1, y-1, wh[0]+2, wh[1]+2);
      ctx.fillStyle = f.col; ctx.fillRect(x, y, wh[0], wh[1]);
      if(f.spot){ ctx.fillStyle = f.spot; ctx.fillRect(x, y, s, s); }
    }
    else if(kind==='conf'){ const flip = Math.floor(f.life/90 + (f.seed||0))%2; const wx = Math.round(Math.sin(f.life/120 + (f.seed||0))*1.5); ctx.fillRect(x+wx, y, flip?2:1, flip?1:2); }
    else if(kind==='heart'){ drawText('♥', x, y, f.col); }
  }
  ctx.globalAlpha = 1;
}
/* capa trasera/delantera: las partículas con behind se pintan en su pasada */
function cpDraw(list, dt, slow, layer){ list._layer = layer; cpStep(list, layer===1 ? 0 : dt, slow); }

/* ---------- el ESPACIO de energía ---------- */
const SPACE_STARS = [];
function drawSpace(t, dt, cx, cy, colA, colB, inten, dark){
  /* base: degradado radial tramado del color de la línea */
  ctx.fillStyle = dark ? '#0c0616' : '#080a1e'; ctx.fillRect(0,0,LW,LH);
  glowDisc(cx, cy, 70, colA, 0.16 + inten*0.16);
  glowDisc(cx, cy, 40, colB, 0.14 + inten*0.2);
  /* túnel: anillos que nacen en el centro y se expanden */
  const speed = 0.02 + inten*0.07;
  for(let i=0;i<9;i++){
    const r = ((t*speed + i*18) % 162);
    if(r<4) continue;
    const a = Math.min(1, r/30) * (1 - r/162) * (0.35 + inten*0.5);
    ctx.globalAlpha = a; ctx.fillStyle = i%2 ? colA : colB;
    const n = Math.round(r*2.2)+12;
    for(let j=0;j<n;j++){ if((j+i)%3===0) continue; const an = j/n*Math.PI*2; ctx.fillRect(Math.round(cx+Math.cos(an)*r), Math.round(cy+Math.sin(an)*r*0.72), 1+(r>90?1:0), 1); }
  }
  ctx.globalAlpha = 1;
  /* estrellas que salen disparadas (warp) */
  while(SPACE_STARS.length < 70) SPACE_STARS.push({a:Math.random()*Math.PI*2, r:Math.random()*10, v:0.02+Math.random()*0.05});
  for(const s of SPACE_STARS){
    s.r += s.v*dt*(0.4 + inten*2.2)*(1 + s.r/50);
    if(s.r>170){ s.r = Math.random()*6; s.a = Math.random()*Math.PI*2; }
    const x = cx + Math.cos(s.a)*s.r, y = cy + Math.sin(s.a)*s.r*0.72;
    const len = Math.min(10, 1 + s.r/14*inten*2.5);
    ctx.fillStyle = s.r>60 ? '#ffffff' : colB;
    ctx.globalAlpha = Math.min(1, s.r/40);
    for(let j=0;j<len;j++) ctx.fillRect(Math.round(x - Math.cos(s.a)*j), Math.round(y - Math.sin(s.a)*j*0.72), 1, 1);
  }
  ctx.globalAlpha = 1;
}
/* rayo quebrado de píxeles */
function pxBolt(x0, y0, x1, y1, col, seed){
  ctx.fillStyle = col;
  const n = 7; let px0 = x0, py0 = y0;
  for(let i=1;i<=n;i++){
    const k = i/n, jx = i<n ? (hash01(seed*13+i)-0.5)*14 : 0, jy = i<n ? (hash01(seed*7+i*3)-0.5)*10 : 0;
    const x = x0 + (x1-x0)*k + jx, y = y0 + (y1-y0)*k + jy;
    const steps = Math.max(Math.abs(x-px0), Math.abs(y-py0));
    for(let s=0;s<=steps;s++) ctx.fillRect(Math.round(px0 + (x-px0)*s/steps), Math.round(py0 + (y-py0)*s/steps), 1, 1);
    px0 = x; py0 = y;
  }
}
/* ---------- lo ELEMENTAL de cada línea ---------- */
const ELEM = {
  pradera:{cols:['#7ac74f','#9ae6a0','#f2a2b8'], kind:'leaf'},
  brasa:  {cols:['#ffd94a','#f8a04b','#e8574c'], kind:'spark'},
  marea:  {cols:['#9adcf0','#5e9be0','#e8f8ff'], kind:'bubble'},
  fungo:  {cols:['#f0e0c0','#d8a0e0','#fff8d0'], kind:'puff'},
  petrea: {cols:['#c8c8d8','#8a8a9a','#f2a2b8'], kind:'shard'},
  voltio: {cols:['#ffe066','#5ec8d8','#ffffff'], kind:'spark'},
  astro:  {cols:['#ffd94a','#c8b8f8','#ffffff'], kind:'star'},
  grimo:  {cols:['#9d7bd8','#6b4fa3','#3a2a5a'], kind:'puff'}
};
function elemOf(line){ return ELEM[line] || ELEM.pradera; }
/* partícula que orbita cerrándose sobre el centro */
function elemOrbit(list, line, cx, cy, r, inten){
  const E = elemOf(line);
  cpAdd(list, {orb:true, cx, cy, a:Math.random()*Math.PI*2, r, w:(0.002+inten*0.006)*(Math.random()<0.5?1:1), dr:-(0.01+inten*0.04),
    life:1400, col:E.cols[Math.floor(Math.random()*E.cols.length)], kind:E.kind, size:E.kind==='shard'?1:(Math.random()<0.5?2:1), seed:Math.random()*6,
    behind: Math.random()<0.5 ? 0 : 1});
}
/* estallido elemental */
function elemBurst(list, line, cx, cy, n, sp){
  const E = elemOf(line);
  for(let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2, s = sp*(0.4+Math.random());
    cpAdd(list, {x:cx, y:cy, vx:Math.cos(a)*s, vy:Math.sin(a)*s*0.8, drag:0.0018, g:E.kind==='spark'&&line==='brasa' ? -0.00008 : 0.00004,
      life:900+Math.random()*900, col:E.cols[i%E.cols.length], kind:E.kind, size:E.kind==='shard'?2:(Math.random()<0.5?2:1), seed:i});
  }
}
/* ---------- sonido de las cinemáticas ---------- */
SFX.cineBeat = function(step, k){
  kick(sfxAt(0), 0.05+k*0.05);
  const a = typeof musBus==='function' ? musBus() : null;
  const scale = [0,2,4,5,7,9,11,12,14,16,17,19,21,23,24];
  if(a) INST.kalimba(NOTE(261.63, scale[Math.min(scale.length-1, step)]), a.currentTime+0.01, 0.2, 0.07+k*0.04, 0);
};
SFX.cineSwap = function(step){
  const a = typeof musBus==='function' ? musBus() : null;
  if(a) INST.musicbox(NOTE(349.23, Math.min(24, step)), a.currentTime+0.01, 0.12, 0.06, step%2?0.3:-0.3);
  nz(sfxAt(0), 0.04, 0.012, 5000+step*300, 3);
};
SFX.cineRise = function(dur){
  tone({f:220, slide:1760, d:dur, type:'triangle', vol:0.03, send:0.4});
  nz(sfxAt(0), dur, 0.02, 400, 1, 9000);
};
SFX.cineCrash = function(){
  kick(sfxAt(0), 0.16);
  nz(sfxAt(0), 1.4, 0.07, 7000, 0.6, 3000);          /* platillo */
  nz(sfxAt(0), 0.3, 0.06, 300, 0.8, 90);             /* bombo gordo */
  const a = typeof musBus==='function' ? musBus() : null;
  if(a){
    const t0 = a.currentTime + 0.05;
    /* fanfarria: la cabeza del tema con acorde enorme */
    [[7,0],[4,0.1],[7,0.18],[12,0.28]].forEach(n=> INST.flute(NOTE(523.25, n[0]), t0+n[1], n[0]===12?0.9:0.1, 0.12, 0));
    for(const s of [0,4,7,12,16]) INST.pad(NOTE(261.63, s), t0+0.28, 1.6, 0.03, 0);
    INST.musicbox(NOTE(523.25, 19), t0+0.3, 1, 0.07, 0.3);
  }
};
SFX.cineDark = function(){
  kick(sfxAt(0), 0.14);
  nz(sfxAt(0), 1.0, 0.05, 900, 0.6, 200);
  tone({f:220, slide:110, d:1.2, type:'sawtooth', vol:0.03, send:0.4});
  tone({f:233, slide:116, d:1.2, type:'triangle', vol:0.03});
};

/* ---------- utilidades de puesta en escena ---------- */
/* sprite a escala con barrido de color: por encima de 'scan' en color, debajo blanco */
function drawSprReveal(spr, x, y, sc, sx, sy, scan, white){
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(sc*sx, sc*sy);
  const w = spr.width, h = spr.height, cut = Math.round(h*scan);
  ctx.drawImage(spr, -w/2, -h);
  if(cut < h){ ctx.drawImage(silhouette(spr), 0, cut, w, h-cut, -w/2, -h+cut, w, h-cut); }
  if(white>0){ ctx.globalAlpha = Math.min(1, white); ctx.drawImage(silhouette(spr), -w/2, -h); ctx.globalAlpha = 1; }
  ctx.restore();
  /* línea de barrido brillante */
  if(scan>0 && scan<1){
    const yy = Math.round(y - h*sc*sy + cut*sc*sy);
    ctx.globalAlpha = 0.8; px(x - w*sc*sx/2 - 4, yy, w*sc*sx + 8, 1, '#ffffff'); ctx.globalAlpha = 1;
  }
}
/* silueta de ENERGÍA: blanca, con borde de luz de su color y franjas que la recorren */
const _energyCv = document.createElement('canvas');
function drawEnergySil(spr, x, y, sc, sx, sy, col, t){
  const w = spr.width, h = spr.height;
  _energyCv.width = w; _energyCv.height = h;
  const g = _energyCv.getContext('2d');
  g.clearRect(0,0,w,h);
  g.drawImage(silhouette(spr), 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = col;
  /* una banda de energía que barre de abajo arriba, suave */
  const band = h - ((t/45) % (h+6));
  g.globalAlpha = 0.28; g.fillRect(0, Math.round(band), w, 2);
  g.globalAlpha = 0.14; g.fillRect(0, Math.round(band)+2, w, 2);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  const tint = cineTintSil(spr, col);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  /* borde de luz: la silueta teñida desplazada 1px de pantalla en cruz */
  for(const d of [[-1,0],[1,0],[0,-1],[0,1],[-2,0],[2,0]]){
    ctx.save(); ctx.translate(d[0], d[1]); ctx.scale(sc*sx, sc*sy);
    ctx.globalAlpha = Math.abs(d[0])===2 ? 0.35 : 0.9; ctx.drawImage(tint, -w/2, -h); ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.scale(sc*sx, sc*sy);
  ctx.drawImage(_energyCv, -w/2, -h);
  ctx.restore();
}
const _cineTint = new Map();
function cineTintSil(spr, col){
  const key = col; let m = _cineTint.get(spr);
  if(!m){ m = {}; _cineTint.set(spr, m); }
  if(m[key]) return m[key];
  const c = document.createElement('canvas'); c.width = spr.width; c.height = spr.height;
  const g = c.getContext('2d'); g.drawImage(spr, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0,0,c.width,c.height);
  m[key] = c; return c;
}
/* nombre que entra letra a letra con rebote */
function typeName(s, cx, y, col, age, sc){
  sc = sc||2;
  const n = s.length, W = textWS(s, sc);
  let x = Math.round(cx - W/2);
  for(let i=0;i<n;i++){
    const a = age - i*55;
    if(a<0) break;
    const k = ease.outBack(clamp01(a/220));
    const dy = Math.round((1-k)*-10);
    drawTextO(s[i], x, y+dy, col, sc);
    x += 4*sc;
  }
}
/* halo pulsante + rayos giratorios del revelado */
function drawAura(cx, cy, col, t, k){
  ctx.globalAlpha = 0.18*k; pxBeams(cx, cy, 12, 16, 120, t/2600, col, 6); ctx.globalAlpha = 1;
  glowDisc(cx, cy, Math.round(30 + Math.sin(t/200)*3), col, 0.3*k);
}
/* etiqueta de la rama evolutiva */
const BRANCH_LABEL = {babyA:'BEBE', babyB:'BEBE', childA:'DISCIPLINADO', childB:'DESPREOCUPADO',
  adultA:'GUERRERO', adultB:'TANQUE', adultC:'AGIL', adultD:'TRANQUILO', adultS:'¡LEYENDA!', grimo:'OLVIDADO'};

/* ================================================================
   ECLOSIÓN
   ================================================================ */
const HATCH_T = {zoom:700, build:700, climax:3500, pop:4000, land:4600, blink:5100, voice:5350, plate:5300, trait:5900, ask:6400};
let HX = null;
function hatchIntro(p){
  HX = null;
  JUICE.wipe = {t:0, dur:520, cx:Math.round(p.rx - CAM.x), cy:150};
  UI.hatchFrom = {x:p.rx - CAM.x};
}
function hatchTap(x, y){
  const t = UI.hatchT;
  if(!HX){ return; }
  if(t < HATCH_T.zoom){ UI.hatchT = HATCH_T.zoom; return; }
  /* durante la tensión: ¡ayúdale! cada toque es un latido extra y una grieta */
  if(t < HATCH_T.climax){ HX.help = (HX.help||0)+1; HX.forceBeat = true; UI.hatchT = Math.min(HATCH_T.climax, t + 170); return; }
  if(t < HATCH_T.pop){ UI.hatchT = HATCH_T.pop; return; }
  if(t < HATCH_T.ask){ UI.hatchT = HATCH_T.ask; return; }
  if(y!==undefined && y>=242 && y<=260 && x < 80){ UI.nickBuf = ''; UI.renameFrom = 'hatch'; UI.mode = 'rename'; SFX.tap(); return; }
  UI.mode = 'main'; SFX.tap();
  const p = AP(); p.squashAt = performance.now(); heartsFx(p.rx, 140, 3);
}
/* grietas procedurales sobre el huevo (coordenadas del sprite 12x13) */
function crackPath(n){
  const segs = [];
  let x = 6, y = 1;
  for(let i=0;i<n;i++){
    const dir = hash01(i*3+1) < 0.5 ? -1 : 1;
    const nx = Math.max(1, Math.min(10, x + dir*(1+Math.floor(hash01(i*5+2)*2)))), ny = Math.min(11, y + 1);
    segs.push([x,y,nx,ny]); x = nx; y = ny;
    if(y>=10){ x = 2 + Math.floor(hash01(i*7)*8); y = 2 + Math.floor(hash01(i*11)*4); }
  }
  return segs;
}
function drawHatch(dt){
  if(!HX || UI.hatchT < HX.t) HX = {t:0, fx:[], beats:0, nextBeat:HATCH_T.build+300, popped:false, cracks:0, rings:[], help:0};
  UI.hatchT += dt;
  const t = UI.hatchT; HX.t = t;
  const p = AP(), now = performance.now();
  const L = LINES[p.line], E = elemOf(p.line);
  const egg = (SPR['egg_'+p.line]||SPR.egg_mystery)[0];
  const baby = SPR[p.line+'_'+(p.form||'babyA')];
  const CY = 150, FEET = 176;
  /* zoom desde el prado */
  const zk = ease.inOutSine(clamp01(t/HATCH_T.zoom));
  const fromX = UI.hatchFrom ? UI.hatchFrom.x : 80;
  const CX = Math.round(fromX + (80-fromX)*zk);
  const esc = 1 + zk*3;                                   /* 1x → 4x */
  const eFeet = Math.round(161 + (FEET-161)*zk);
  const build = clamp01((t-HATCH_T.build)/(HATCH_T.climax-HATCH_T.build));
  const popped = t >= HATCH_T.pop;
  const inten = popped ? Math.max(0.2, 1 - (t-HATCH_T.pop)/1800) : (t<HATCH_T.climax ? build*0.8 : 1);
  const slow = (t>HATCH_T.climax && !popped) ? 0.25 : 1;

  /* fondo: el prado se funde en el espacio de energía */
  if(zk<1){ drawScene(now); ctx.globalAlpha = zk; }
  drawSpace(t, dt*slow, CX, CY-10, L.eggSpot, '#fff8d0', inten, false);
  ctx.globalAlpha = 1;
  /* suelo de luz */
  glowDisc(CX, FEET, 26, L.eggSpot, 0.25*zk);

  cpDraw(HX.fx, dt, slow, 0);   /* partículas detrás */

  if(!popped){
    /* latidos a tempo: cada vez más seguidos (y tus toques añaden) */
    if(t > HATCH_T.build && t < HATCH_T.climax && (t >= HX.nextBeat || HX.forceBeat)){
      HX.forceBeat = false; HX.beats++; HX.beatAt = now;
      HX.nextBeat = t + Math.max(140, 520 - build*380);
      SFX.cineBeat(HX.beats, build); shake(0.08 + build*0.2); vibrate(12);
      HX.cracks = Math.min(22, HX.cracks + 1 + (HX.help>0 ? 1 : 0));
      HX.rings.push({r:10, a:0.8});
      for(let i=0;i<2;i++) cpAdd(HX.fx, {x:CX+(Math.random()-0.5)*20, y:CY-14, vx:(Math.random()-0.5)*0.1, vy:-0.08-Math.random()*0.05, g:0.0003, life:700, col:L.eggShell, kind:'px', size:2, floor:FEET});
    }
    /* la energía de la línea orbita y se cierra sobre el huevo */
    if(t>HATCH_T.build && every(Math.round(110 - build*85), now)) elemOrbit(HX.fx, p.line, CX, CY-12, 70+Math.random()*20, build);
    /* rayo de voltio / chispas de brasa extra en el pico */
    if(p.line==='voltio' && build>0.5 && every(260, now)){ ctx.globalAlpha = 0.8; pxBolt(CX+(Math.random()<0.5?-70:70), 30+Math.random()*60, CX, CY-12, '#ffe066', Math.floor(now/260)); ctx.globalAlpha = 1; }
    /* clímax: silencio, zumbido que sube y todo a cámara lenta */
    if(t>=HATCH_T.climax && !HX.rise){ HX.rise = true; SFX.cineRise((HATCH_T.pop-HATCH_T.climax)/1000); }
    const bt = now - (HX.beatAt||0), beat = bt<200 ? Math.sin(bt/200*Math.PI) : 0;
    const swell = t>HATCH_T.climax ? (t-HATCH_T.climax)/(HATCH_T.pop-HATCH_T.climax) : 0;
    const amp = zk*(0.5 + build*2.5 + beat*2);
    const ox = Math.round(Math.sin(t/24)*amp*(t>HATCH_T.climax ? 0.3 : 1));
    /* rayos que salen por las grietas */
    if(build>0.25){ ctx.globalAlpha = 0.12 + build*0.3 + swell*0.3; pxBeams(CX, CY-14, 9, 14, 50+build*90, -1.57 + t/1800, '#fff8d0', 4); ctx.globalAlpha = 1; }
    /* el huevo */
    softShadow(CX, eFeet, Math.round(12*esc));
    ctx.save();
    ctx.translate(CX+ox, eFeet);
    const bsx = 1 + beat*0.08 + swell*0.14, bsy = 1 - beat*0.07 + swell*0.14;
    ctx.scale(esc*bsx, esc*bsy);
    ctx.drawImage(egg, -egg.width/2, -egg.height);
    /* grietas que brillan desde dentro */
    const segs = crackPath(HX.cracks);
    for(const s of segs){
      const steps = Math.max(Math.abs(s[2]-s[0]), Math.abs(s[3]-s[1]));
      for(let k=0;k<=steps;k++){
        ctx.fillStyle = build>0.4 ? (Math.floor(t/80+k+s[0])%3 ? '#fff8d0' : L.eggSpot) : K;
        ctx.fillRect(Math.round(s[0]+(s[2]-s[0])*k/steps)-egg.width/2, Math.round(s[1]+(s[3]-s[1])*k/steps)-egg.height, 1, 1);
      }
    }
    if(swell>0){ ctx.globalAlpha = Math.min(1, swell*1.1); ctx.drawImage(silhouette(egg), -egg.width/2, -egg.height); ctx.globalAlpha = 1; }
    ctx.restore();
    /* anillos de cada latido */
    for(let i=HX.rings.length-1;i>=0;i--){
      const rg = HX.rings[i]; rg.r += dt*0.09; rg.a -= dt*0.002;
      if(rg.a<=0){ HX.rings.splice(i,1); continue; }
      ctx.fillStyle = L.eggSpot; ctx.globalAlpha = rg.a;
      const n = Math.round(rg.r*2)+10;
      for(let j=0;j<n;j++){ const an = j/n*Math.PI*2; ctx.fillRect(Math.round(CX+Math.cos(an)*rg.r), Math.round(CY-12+Math.sin(an)*rg.r*0.8), 1, 1); }
      ctx.globalAlpha = 1;
    }
    cpDraw(HX.fx, dt, slow, 1);   /* partículas delante */
    /* textos */
    if(t>HATCH_T.zoom*0.6 && t<HATCH_T.climax){
      drawTextOC(build<0.35 ? '¿...?' : (build<0.75 ? '¡SE MUEVE!' : '¡YA VIENE!'), 80, 34, build<0.35 ? '#ffffff' : '#ffd94a', build<0.35 ? 1 : 2);
      if(t>HATCH_T.build+400 && Math.floor(now/300)%2===0) drawTextOC('¡TOCA PARA AYUDARLE!', 80, 238, '#fff8d0', 1);
    }
  } else {
    const rt = t - HATCH_T.pop;
    if(!HX.popped){
      HX.popped = true;
      SFX.hatchPop(); SFX.cineCrash(); vibrate([50,30,90]);
      shake(0.9); hitstop(120); flash('#ffffff', 1, 320);
      setTimeout(()=>flash(L.eggSpot, 0.55, 300), 140);
      for(let i=0;i<22;i++){
        const a = -Math.PI/2 + (hash01(i)-0.5)*3, sp = 0.08+hash01(i+11)*0.13;
        cpAdd(HX.fx, {x:CX+(hash01(i+5)-0.5)*30, y:CY-14+(hash01(i+8)-0.5)*24, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, g:0.00035, drag:0.0008,
          life:2200+hash01(i+2)*900, col:L.eggShell, spot:i%3===0 ? L.eggSpot : null, kind:'shard', size:2, floor:FEET+3+Math.round(hash01(i+4)*8), seed:i});
      }
      elemBurst(HX.fx, p.line, CX, CY-14, 44, 0.16);
      for(let i=0;i<40;i++) cpAdd(HX.fx, {x:Math.random()*160, y:-5-Math.random()*60, vx:(Math.random()-0.5)*0.02, vy:0.03+Math.random()*0.04, life:2600+Math.random()*1200,
        col:[L.eggSpot,'#ffd94a','#ffffff','#f2a2b8','#5ec8d8'][i%5], kind:'conf', seed:i});
      HX.rings = [{r:8,a:1},{r:3,a:0.9},{r:0,a:0.7}];
    }
    /* aura y rayos del revelado */
    drawAura(CX, CY-18, L.eggSpot, now, Math.max(0.35, 1 - rt/3000));
    for(let i=HX.rings.length-1;i>=0;i--){
      const rg = HX.rings[i]; rg.r += dt*(0.12+i*0.03); rg.a -= dt*0.0015;
      if(rg.a<=0){ HX.rings.splice(i,1); continue; }
      ctx.fillStyle = 'rgba(255,248,208,'+rg.a.toFixed(2)+')';
      const n = Math.round(rg.r*1.8)+10;
      for(let j=0;j<n;j++){ const an = j/n*Math.PI*2; ctx.fillRect(Math.round(CX+Math.cos(an)*rg.r), Math.round(CY-14+Math.sin(an)*rg.r*0.8), 2, 2); }
    }
    cpDraw(HX.fx, dt, 1, 0);
    /* el bebé: flota en la luz, cae con rebote, el color baja como un telón */
    let yOff = 0, sx = 1, sy = 1;
    const landT = HATCH_T.land - HATCH_T.pop;
    if(rt < landT){
      const k = rt/landT;
      yOff = -34 + ease.inCubic(k)*34 - Math.sin(k*Math.PI)*6;
      sx = 1 - Math.sin(k*Math.PI)*0.06; sy = 1 + Math.sin(k*Math.PI)*0.08;
    } else {
      if(!HX.landFx){ HX.landFx = true; shake(0.3); kick(sfxAt(0), 0.08); for(let i=0;i<10;i++) cpAdd(HX.fx, {x:CX+(i-4.5)*5, y:FEET-1, vx:(i-4.5)*0.025, vy:-0.03, g:0.00012, life:500, col:'rgba(255,255,255,0.85)', size:2}); }
      const s2 = springSquash(1, 0.34, 1+(rt-landT));
      sx = s2[0]; sy = s2[1];
      const hop = (rt-landT) % 1400;
      if(rt>landT+900 && hop<320) yOff = -Math.sin(hop/320*Math.PI)*8;
    }
    const tb = t-HATCH_T.blink;
    const blink = (tb>0 && tb<170) || (t>HATCH_T.blink+700 && (now%2400)<140);
    if(t>HATCH_T.voice && !HX.voiced){ HX.voiced = true; petVoice(p); HX.voiceAt = now; if(typeof SFX.hatch==='function') SFX.hatch(); }
    const spr = baby ? baby[blink?1:0] : currentSprite();
    softShadow(CX, FEET, Math.round(40 - Math.min(16, -yOff/2)));
    const scan = clamp01((rt-250)/650);
    if(rt<250) drawEnergySil(spr, CX, FEET+yOff, 4, sx, sy, L.eggSpot, t);
    else drawSprReveal(spr, CX, FEET+yOff, 4, sx, sy, scan, 0);
    if(HX.voiceAt && now-HX.voiceAt < 1500){
      const k = ease.outBack(clamp01((now-HX.voiceAt)/220));
      const bx = CX+30, by = CY-58 - Math.round((1-k)*6);
      px(bx-11, by-8, 22, 13, '#f6efe0'); px(bx-11, by-8, 22, 1, K); px(bx-11, by+4, 22, 1, K); px(bx-12, by-7, 1, 11, K); px(bx+11, by-7, 1, 11, K);
      px(bx-8, by+5, 2, 2, '#f6efe0'); px(bx-9, by+6, 1, 1, K);
      drawTextC('♪!', bx, by-4, '#e2574c');
    }
    cpDraw(HX.fx, dt, 1, 1);
    /* rótulos */
    stampText('¡HA NACIDO!', 80, 30, '#ffd94a', rt-80);
    const nm = LINES[p.line].names[p.form||'babyA'];
    const desc = (FORM_DESC[p.line] && FORM_DESC[p.line][p.form||'babyA']) || '';
    if(t>HATCH_T.plate){
      const age = t-HATCH_T.plate;
      const k = ease.outCubic(clamp01(age/260));
      ctx.globalAlpha = 0.85*k; px(0, 186, 160, 50, '#0a0818'); ctx.globalAlpha = 1;
      px(0, 186, Math.round(160*k), 1, L.eggSpot); px(160-Math.round(160*k), 235, Math.round(160*k), 1, L.eggSpot);
      typeName(nm, 80, 191, '#ffffff', age, 2);
      if(age>nm.length*55+120){
        ctx.globalAlpha = clamp01((age-nm.length*55-120)/250);
        drawTextC('LINEA '+L.name+' · GEN '+(p.gen||1), 80, 206, L.eggSpot);
        if(desc) drawTextC(desc, 80, 214, 'rgba(255,255,255,0.7)');
        ctx.globalAlpha = 1;
      }
    }
    if(t>HATCH_T.trait && p.trait){
      ctx.globalAlpha = clamp01((t-HATCH_T.trait)/250);
      drawTextC('CARACTER '+p.trait+': '+(TRAITS[p.trait]||''), 80, 225, '#f2a2b8');
      ctx.globalAlpha = 1;
    }
    if(t>HATCH_T.ask){
      const k = ease.outBack(clamp01((t-HATCH_T.ask)/300));
      const oy = Math.round((1-k)*20);
      const btn = (x, w, label, bg, fg)=>{
        px(x+1, 256+oy, w-1, 2, 'rgba(0,0,0,0.4)');
        px(x, 244+oy, w, 13, bg); px(x, 244+oy, w, 1, 'rgba(255,255,255,0.4)');
        px(x, 244+oy, w, 1, K); px(x, 256+oy, w, 1, K); px(x, 244+oy, 1, 13, K); px(x+w-1, 244+oy, 1, 13, K);
        drawTextC(label, x+w/2, 248+oy, fg);
      };
      btn(10, 66, '¡BAUTIZAR!', '#ffd94a', K);
      btn(84, 66, 'LUEGO', '#f6efe0', K);
      drawTextOC('¿LE PONES NOMBRE?', 80, 236+oy, Math.floor(now/500)%2===0 ? '#ffffff' : '#ffd94a', 1);
    }
  }
  cineBars(t, 12);
}

/* ================================================================
   EVOLUCIÓN
   ================================================================ */
const EVO_T = {space:700, morph:1300, climax:4400, burst:5000, pose:5700, plate:5900, exit:6900, skipTo:4700};
let EVX = null;
function evolveTap(){
  if(UI.evoT > EVO_T.exit){ evolveEnd(); return; }
  if(UI.evoT < EVO_T.skipTo) UI.evoT = EVO_T.skipTo;       /* saltar al estallido */
  else if(UI.evoT < EVO_T.plate) UI.evoT = EVO_T.plate;
}
function evolveEnd(){
  const e = UI.evo;
  UI.mode = 'main'; UI.evo = null;
  const p = AP();
  if(p){ p.squashAt = performance.now(); burst(p.rx, 146, {n:18, cols:['#ffd94a','#fff8d0','#ffffff'], speed:0.1, kind:'star'}); ringFx(p.rx, 150, '#ffd94a', 20, 400); }
}
function drawEvolve(dt){
  const e = UI.evo;
  if(!e){ UI.mode = 'main'; return; }
  if(!EVX || EVX.e !== e){ EVX = {e, fx:[], swaps:0, lastSwap:-1, acc:0, burst:false, rings:[], bolts:[]}; SPACE_STARS.length = 0; }
  UI.evoT += dt;
  const t = UI.evoT, now = performance.now();
  const dark = e.dark;
  const p = AP();
  const line = dark ? 'grimo' : (p ? p.line : 'pradera');
  const L = LINES[p ? p.line : 'pradera'];
  const colA = dark ? '#6b4fa3' : L.eggSpot, colB = dark ? '#9d7bd8' : '#fff8d0';
  const CX = 80, FEET = 172, CY = 138;
  const morph = clamp01((t-EVO_T.morph)/(EVO_T.climax-EVO_T.morph));
  const done = t >= EVO_T.burst;
  const inten = done ? Math.max(0.25, 1-(t-EVO_T.burst)/1800) : (t<EVO_T.morph ? t/EVO_T.morph*0.3 : 0.3 + morph*0.7);
  const slow = (t>EVO_T.climax && !done) ? 0.2 : 1;
  const sk = ease.inOutSine(clamp01(t/EVO_T.space));
  /* fondo: prado → espacio */
  if(sk<1){ drawScene(now); ctx.globalAlpha = sk; }
  drawSpace(t, dt*slow, CX, CY-8, colA, colB, inten, dark);
  ctx.globalAlpha = 1;
  if(dark && every(120, now) && Math.random()<0.5){ /* fallo de imagen */ const gy = Math.floor(Math.random()*260); ctx.drawImage(cv, 0, gy, LW, 6, (Math.random()-0.5)*8, gy, LW, 6); }
  glowDisc(CX, FEET, 30, colA, 0.25*sk);
  cpDraw(EVX.fx, dt, slow, 0);

  /* ¿qué forma y cuánta luz? */
  let spr = e.from, white = 0, sc = 3 + sk, sx = 1, sy = 1, lift = 0;
  if(t < EVO_T.morph){
    white = clamp01((t-300)/900)*0.9;
    if(every(60, now) && t>300) elemOrbit(EVX.fx, line, CX, CY-10, 60+Math.random()*30, 0.2);
  } else if(!done){
    /* el cambio de forma: alterna cada vez más rápido, con nota y anillo */
    const mt = t - EVO_T.morph;
    const period = Math.max(55, 480*Math.pow(0.5, mt/900));
    EVX.acc += (dt*slow)/period;
    const n = Math.floor(EVX.acc);
    spr = (n%2===1) ? e.to : e.from;
    if(n !== EVX.lastSwap && t < EVO_T.climax){
      EVX.lastSwap = n; EVX.swaps++;
      SFX.cineSwap(EVX.swaps); EVX.rings.push({r:14, a:0.7});
      shake(0.04 + morph*0.16);
    }
    white = 1;
    const pulse = Math.sin(mt/(EVO_T.climax-EVO_T.morph)*Math.PI);
    sc = 4; sx = sy = 1 + pulse*0.08;
    if(every(Math.round(90 - morph*75), now)) elemOrbit(EVX.fx, line, CX, CY-10, 70+Math.random()*25, morph);
    /* capullo de energía: aros que se cierran */
    if(morph>0.3){ ctx.globalAlpha = 0.14 + morph*0.3; pxBeams(CX, CY-14, 10, 18, 40+morph*100, t/900, colB, 4); ctx.globalAlpha = 1; }
    if((line==='voltio' || dark || morph>0.7) && every(dark?200:160, now)){ EVX.bolts.push({t:now, seed:Math.floor(Math.random()*999), x:Math.random()<0.5?-10:170, y:20+Math.random()*120}); }
    if(t>=EVO_T.climax && !EVX.rise){ EVX.rise = true; SFX.cineRise((EVO_T.burst-EVO_T.climax)/1000); }
    if(t>EVO_T.climax){ const c = (t-EVO_T.climax)/(EVO_T.burst-EVO_T.climax); sx = sy = 1 + c*0.25; }
  } else {
    const rt = t - EVO_T.burst;
    if(!EVX.burst){
      EVX.burst = true;
      if(dark){ SFX.cineDark(); flash('#2a1a40', 0.8, 400); } else { SFX.cineCrash(); SFX.evolveFanfare && setTimeout(()=>SFX.evolveFanfare(), 450); flash('#ffffff', 1, 360); setTimeout(()=>flash(colA, 0.5, 300), 150); }
      shake(1); hitstop(150); vibrate([60,40,120]);
      elemBurst(EVX.fx, line, CX, CY-16, 60, 0.18);
      for(let i=0;i<24;i++){ const a = i/24*Math.PI*2; cpAdd(EVX.fx, {x:CX, y:CY-16, vx:Math.cos(a)*0.14, vy:Math.sin(a)*0.11, drag:0.002, life:700, col:colB, kind:'spark'}); }
      if(!dark) for(let i=0;i<46;i++) cpAdd(EVX.fx, {x:Math.random()*160, y:-5-Math.random()*70, vx:(Math.random()-0.5)*0.02, vy:0.03+Math.random()*0.04, life:3000+Math.random()*1200,
        col:[colA,'#ffd94a','#ffffff','#f2a2b8','#5ec8d8','#7ac74f'][i%6], kind:'conf', seed:i});
      EVX.rings = [{r:8,a:1},{r:3,a:0.9},{r:0,a:0.8},{r:-8,a:0.7}];
    }
    spr = e.to; sc = 4;
    white = rt<100 ? 1 : 0;
    /* pose: salto con aplastón */
    const pk = clamp01(rt/600);
    if(rt<600){ lift = Math.sin(pk*Math.PI)*16; sx = 1 - Math.sin(pk*Math.PI)*0.1; sy = 1 + Math.sin(pk*Math.PI)*0.14; }
    else { if(!EVX.landed){ EVX.landed = true; shake(0.3); kick(sfxAt(0), 0.1); if(p) petVoice(p); } const s2 = springSquash(1, 0.3, 1+(rt-600)); sx = s2[0]; sy = s2[1]; }
    drawAura(CX, CY-20, colA, now, Math.max(0.4, 1-rt/3500));
  }
  /* anillos */
  for(let i=EVX.rings.length-1;i>=0;i--){
    const rg = EVX.rings[i]; rg.r += dt*(done ? 0.13+i*0.03 : 0.08); rg.a -= dt*(done ? 0.0015 : 0.0022);
    if(rg.a<=0){ EVX.rings.splice(i,1); continue; }
    if(rg.r<0) continue;
    ctx.fillStyle = colB; ctx.globalAlpha = rg.a;
    const n = Math.round(rg.r*1.8)+10;
    for(let j=0;j<n;j++){ const an = j/n*Math.PI*2; ctx.fillRect(Math.round(CX+Math.cos(an)*rg.r), Math.round(CY-16+Math.sin(an)*rg.r*0.8), done?2:1, done?2:1); }
    ctx.globalAlpha = 1;
  }
  /* rayos que caen sobre el capullo */
  for(let i=EVX.bolts.length-1;i>=0;i--){
    const b = EVX.bolts[i], age = now - b.t;
    if(age>140){ EVX.bolts.splice(i,1); continue; }
    ctx.globalAlpha = 1 - age/140;
    pxBolt(b.x, b.y, CX, CY-16, dark ? '#c8a8ff' : '#fff8d0', b.seed);
    ctx.globalAlpha = 1;
  }
  /* el bitxo */
  softShadow(CX, FEET, Math.round(spr.width*sc*0.8 - lift));
  const scan = done ? clamp01((t-EVO_T.burst-150)/600) : 1;
  if(!done && white>=1) drawEnergySil(spr, CX, FEET - lift, sc, sx, sy, colA, t);
  else {
    drawSprReveal(spr, CX, FEET - lift, sc, sx, sy, scan, white);
    if(!done && white>0.3){ ctx.globalAlpha = (white-0.3); drawEnergySil(spr, CX, FEET - lift, sc, sx, sy, colA, t); ctx.globalAlpha = 1; }
  }
  cpDraw(EVX.fx, dt, slow, 1);

  /* textos */
  if(t < EVO_T.morph+500){
    const a = t<200 ? t/200 : (t>EVO_T.morph ? Math.max(0, 1-(t-EVO_T.morph)/500) : 1);
    ctx.globalAlpha = a;
    drawTextOC('¿QUE LE PASA A', 80, 30, dark?'#b8a8e8':'#ffffff', 1);
    drawTextOC(e.fromName+'?', 80, 40, dark?'#b8a8e8':'#ffd94a', 2);
    ctx.globalAlpha = 1;
  }
  if(!done && t>EVO_T.morph+600 && t<EVO_T.climax) drawTextOC(dark ? '...' : '¡ESTA EVOLUCIONANDO!', 80, 34, dark ? '#9d7bd8' : '#ffffff', 1);
  if(done){
    const rt = t - EVO_T.burst;
    stampText(dark ? 'OH NO...' : '¡ENHORABUENA!', 80, 28, dark?'#9d7bd8':'#ffd94a', rt-100);
  }
  if(t > EVO_T.plate){
    const age = t - EVO_T.plate;
    const k = ease.outCubic(clamp01(age/260));
    ctx.globalAlpha = 0.85*k; px(0, 184, 160, 62, dark ? '#140a20' : '#0a0818'); ctx.globalAlpha = 1;
    px(0, 184, Math.round(160*k), 1, colA); px(160-Math.round(160*k), 245, Math.round(160*k), 1, colA);
    ctx.globalAlpha = clamp01(age/200);
    drawTextC(e.fromName+' EVOLUCIONO EN', 80, 188, 'rgba(255,255,255,0.75)');
    ctx.globalAlpha = 1;
    typeName(e.toName+'!', 80, 197, dark ? '#c8a8ff' : '#ffd94a', age-150, 2);
    const slot = e.toSlot || '';
    const lab = BRANCH_LABEL[slot];
    const after = age - 150 - (e.toName.length+1)*55;
    if(after > 80){
      const kk = ease.outBack(clamp01((after-80)/260));
      if(lab){
        const w = textW(lab)+10, bx = Math.round(80 - w/2);
        const by = 213 + Math.round((1-kk)*6);
        px(bx, by, w, 9, slot==='adultS' ? '#ffd94a' : (dark ? '#6b4fa3' : colA)); px(bx, by, w, 1, 'rgba(255,255,255,0.4)');
        drawTextC(lab, 80, by+2, slot==='adultS' ? K : '#ffffff');
      }
      if(e.toDesc){ ctx.globalAlpha = clamp01((after-200)/250); drawTextC(e.toDesc, 80, 226, 'rgba(255,255,255,0.75)'); ctx.globalAlpha = 1; }
    }
  }
  if(t > EVO_T.exit && Math.floor(now/400)%2===0) drawTextOC('TOCA PARA SEGUIR', 80, 250, '#ffffff', 1);
  cineBars(t, 12);
}
