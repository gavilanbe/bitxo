"use strict";
/* =========================================================
   BITXO — render/egg: el arco del HUEVO, de principio a fin
   1) LLEGADA: franjas de cine, un cometa del color de su línea cruza el
      cielo, la cámara va al sitio, baja una columna de luz y el huevo
      desciende girando dentro de una burbuja; al tocar suelo: onda,
      hierba que salta, sacudida y rótulo.
   2) INCUBACIÓN: late como un corazón (cada vez más deprisa), brilla con
      su color, suelta partículas de su línea al tocarlo o FROTARLO, se
      agrieta por fases y, al final, unos ojitos asoman por la grieta.
   3) ECLOSIÓN: zoom al huevo, latidos y zumbido que suben, la energía de
      la línea es absorbida... ¡POP! en su color, silueta que se colorea,
      primer parpadeo, primera palabra y "¿le pones nombre?".
   ========================================================= */

/* ---- cada línea tiene su partícula ---- */
const EGG_THEME = {
  pradera:{cols:['#7ac74f','#9ae6a0','#57a05e'], kind:'leaf',   g:0.00006,  up:0.03},
  brasa:  {cols:['#ffd94a','#f8a04b','#e8574c'], kind:'spark',  g:-0.00014, up:0.05},
  marea:  {cols:['#9adcf0','#5e9be0','#e8f8ff'], kind:'bubble', g:-0.00009, up:0.03},
  fungo:  {cols:['#f0e0c0','#d8a0e0','#fff8d0'], kind:'px',     g:-0.00003, up:0.015},
  petrea: {cols:['#c8c8d8','#8a8a9a','#f2a2b8'], kind:'px',     g:0.0004,   up:0.07},
  voltio: {cols:['#ffe066','#5ec8d8','#ffffff'], kind:'spark',  g:0,        up:0.04},
  astro:  {cols:['#ffd94a','#c8b8f8','#ffffff'], kind:'star',   g:-0.00003, up:0.02}
};
function eggTheme(line){ return EGG_THEME[line] || EGG_THEME.pradera; }
/* partícula temática: en el mundo (juice) o en una lista cinemática */
function eggP(line, x, y, o, list){
  const T = eggTheme(line);
  const a = o.angle!==undefined ? o.angle + (Math.random()-0.5)*(o.spread||1) : Math.random()*Math.PI*2;
  const sp = (o.speed||0.05)*(0.5+Math.random());
  const q = {x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - (o.up!==undefined ? o.up : T.up), g:o.g!==undefined ? o.g : T.g,
             drag:o.drag!==undefined ? o.drag : 0.0015, life:(o.life||700)*(0.7+Math.random()*0.6),
             col:T.cols[Math.floor(Math.random()*T.cols.length)], size:Math.random()<0.4?2:1, floor:o.floor};
  const kind = T.kind==='leaf' ? 'conf' : (T.kind==='bubble' ? (list ? 'bubble' : 'ring') : T.kind);
  q.kind = kind; q.seed = Math.random()*6;
  if(kind==='ring'){ q.r1 = 3; q.life = 500; q.vy = -0.03; }
  if(list) cineP(list, q); else fx(q);
}
function eggBurst(line, x, y, n, o, list){ for(let i=0;i<n;i++) eggP(line, x, y, o||{}, list); }

/* ---- sonidos del huevo ---- */
SFX.eggBeat = function(k){
  kick(sfxAt(0), 0.02 + k*0.03);
  tone({f:70+k*30, slide:50, d:0.09, type:'sine', vol:0.03+k*0.03, at:sfxAt(0.13)});
};
SFX.eggWarm = function(k){
  tone({f:520+k*700, slide:700+k*900, d:0.07, type:'p125', vol:0.03});
  nz(sfxAt(0), 0.05, 0.01, 3000+k*4000, 2);
};
SFX.comet = function(){
  nz(sfxAt(0), 1.1, 0.03, 900, 1.5, 7000);
  [0,4,7,12,16].forEach((s,i)=> tone({f:NOTE(1046.5, s), at:sfxAt(0.15+i*0.09), d:0.3, type:'sine', vol:0.02, send:0.6}));
};
SFX.eggDescend = function(){
  const a = typeof musBus==='function' ? musBus() : null;
  if(a) [7,4,7,12,11,12].forEach((s,i)=> INST.musicbox(NOTE(349.23, s), a.currentTime+0.05+i*0.22, 0.3, 0.05, (i%2?0.3:-0.3)));
};
SFX.eggLand = function(){
  kick(sfxAt(0), 0.12); nz(sfxAt(0), 0.4, 0.05, 500, 0.9, 150);
  tone({f:98, slide:55, d:0.35, type:'sine', vol:0.08});
  [0,4,7,12].forEach((s,i)=> tone({f:NOTE(523.25, s), at:sfxAt(0.08+i*0.05), d:0.7, type:'triangle', vol:0.025, send:0.5}));
};
SFX.eggDrone = function(dur){
  tone({f:110, slide:440, d:dur, type:'triangle', vol:0.02, send:0.3});
  tone({f:165, slide:660, d:dur, type:'sine', vol:0.015});
};

/* ======================= 1) LLEGADA ======================= */
const EGG_ARRIVE = [];
const ARR_T = {comet:300, cometEnd:1400, beam:1100, drop:1500, land:2800, card:2950, exit:4700};
let EA = null;
function queueEggArrive(p){ p.arriving = true; EGG_ARRIVE.push(p); }
function startEggArrive(){
  while(EGG_ARRIVE.length){
    const p = EGG_ARRIVE.shift();
    if(G.pets.indexOf(p)<0 || p.stage!==STAGES.EGG){ p.arriving = false; continue; }
    if((p.zone||'prado')!==G.zone) gotoZone(p.zone||'prado');
    G.sel = G.pets.indexOf(p);
    EA = {p, t:0, fx:[], landed:false, comet:false, desc:false};
    camLookAt(p.rx, true);
    UI.mode = 'eggArrive';
    holdMusic(ARR_T.exit+600);
    return true;
  }
  return false;
}
function eggArriveTap(){
  if(!EA) { UI.mode='main'; return; }
  if(EA.t < ARR_T.land-250) EA.t = ARR_T.land-250;          /* salta al aterrizaje */
  else if(EA.t > ARR_T.card+700) endEggArrive();
}
function endEggArrive(){
  if(EA){ EA.p.arriving = false; EA.p.landed = true; EA.p.squashAt = performance.now(); }
  EA = null; UI.mode = 'main';
}
function drawEggArrive(dt){
  if(!EA){ UI.mode = 'main'; return; }
  EA.t += dt;
  const t = EA.t, now = performance.now();
  const p = EA.p, T = eggTheme(p.line), L = LINES[p.line];
  const sx = p.rx - CAM.x;                 /* aterrizaje en pantalla */
  /* el mundo detrás, con la luz bajando a azul de cuento */
  drawWorldScene(now);
  drawWeather(now);
  const dim = t<ARR_T.land ? Math.min(0.5, t/600*0.5) : Math.max(0.12, 0.5 - (t-ARR_T.land)/1400);
  ctx.fillStyle = 'rgba(12,14,46,'+dim.toFixed(3)+')'; ctx.fillRect(0,0,LW,196);

  /* cometa del color de la línea */
  if(t>ARR_T.comet && t<ARR_T.cometEnd+400){
    if(!EA.comet){ EA.comet = true; SFX.comet(); }
    const k = clamp01((t-ARR_T.comet)/(ARR_T.cometEnd-ARR_T.comet));
    const e = ease.inOutSine(k);
    const cx = 175 - e*(175 - (sx+6)), cy = 6 + e*60;
    const fade = k<1 ? 1 : Math.max(0, 1-(t-ARR_T.cometEnd)/400);
    /* estela ancha con su color, que se afina hacia atrás */
    for(let i=0;i<26;i++){
      const tx = cx + i*2.6, ty = cy - i*0.95;
      const w = i<4 ? 3 : (i<12 ? 2 : 1);
      ctx.globalAlpha = (1-i/26)*fade;
      px(tx, ty - (w>>1), w, w, i<3 ? '#ffffff' : T.cols[i%T.cols.length]);
    }
    ctx.globalAlpha = 1;
    if(k<1){
      glowDisc(Math.round(cx), Math.round(cy), 7, '#fff8d0', 0.45);
      px(cx-2, cy-1, 5, 3, '#ffffff'); px(cx-1, cy-2, 3, 5, '#ffffff');
      if(every(30, now)) eggP(p.line, cx+4, cy, {speed:0.025, up:0, life:600}, EA.fx);
    }
  }
  /* columna de luz sobre el sitio */
  if(t>ARR_T.beam){
    const k = clamp01((t-ARR_T.beam)/400), fade = t>ARR_T.land ? Math.max(0, 1-(t-ARR_T.land)/700) : 1;
    const w = Math.round(6 + k*10 + Math.sin(t/120)*1.5);
    ctx.globalAlpha = 0.22*k*fade;
    px(sx-w, 0, w*2, 162, '#fff8d0');
    ctx.globalAlpha = 0.35*k*fade;
    px(sx-Math.round(w/3), 0, Math.round(w/3)*2, 162, '#ffffff');
    ctx.globalAlpha = 1;
    glowDisc(Math.round(sx), 160, 14, L.eggSpot, 0.35*k*fade);
  }
  /* el huevo baja girando dentro de su burbuja */
  const egg = SPR['egg_'+p.line][0];
  let ey = 161, spin = 1;
  if(t < ARR_T.land){
    if(t>ARR_T.drop && !EA.desc){ EA.desc = true; SFX.eggDescend(); }
    const k = clamp01((t-ARR_T.drop)/(ARR_T.land-ARR_T.drop));
    ey = t<ARR_T.drop ? -20 : -20 + ease.inOutSine(k)*181;
    spin = Math.cos(t/140);
    if(t>ARR_T.drop){
      /* burbuja y chispas en órbita */
      const bx = Math.round(sx), by = Math.round(ey-7);
      ctx.globalAlpha = 0.5;
      for(let a=0;a<28;a++){ const an = a/28*Math.PI*2; px(bx+Math.cos(an)*12, by+Math.sin(an)*12, 1, 1, '#e8f8ff'); }
      ctx.globalAlpha = 0.12; pxDisc(bx, by, 11, '#fff8d0', 1); ctx.globalAlpha = 1;
      px(bx-7, by-7, 2, 2, 'rgba(255,255,255,0.8)');
      for(let i=0;i<4;i++){ const an = t/260 + i*Math.PI/2; px(bx+Math.cos(an)*15, by+Math.sin(an)*6, 2, 2, T.cols[i%3]); }
      if(every(70, now)) eggP(p.line, bx+(Math.random()-0.5)*16, by+10, {angle:Math.PI/2, spread:1, speed:0.02, up:0, life:700}, EA.fx);
    }
  } else if(!EA.landed){
    /* ¡PUM! aterrizaje */
    EA.landed = true;
    SFX.eggLand(); hitstop(80); shake(0.5); flash('#fff8d0', 0.5, 220); vibrate([30,40,60]);
    EA.landAt = t; EA.landNow = performance.now();
    for(let i=0;i<18;i++){ const d = i%2?1:-1; cineP(EA.fx, {x:sx+d*(2+Math.random()*6), y:160, vx:d*(0.03+Math.random()*0.07), vy:-0.05-Math.random()*0.07, g:0.0003, life:700+Math.random()*300, col:['#7ac74f','#57a05e','#9ae6a0'][i%3], kind:'conf', floor:163, seed:i}); }
    for(let i=0;i<10;i++){ const d = i%2?1:-1; cineP(EA.fx, {x:sx+d*4, y:160, vx:d*(0.02+Math.random()*0.05), vy:-0.02, g:0.00005, drag:0.004, life:500, col:'rgba(235,225,200,0.85)', size:2}); }
    eggBurst(p.line, sx, 150, 26, {speed:0.1, life:900}, EA.fx);
    EA.rings = [{r:4,a:1},{r:1,a:0.8}];
  }
  /* onda sobre la hierba */
  if(EA.rings) for(let i=EA.rings.length-1;i>=0;i--){
    const rg = EA.rings[i]; rg.r += dt*0.11; rg.a -= dt*0.0016;
    if(rg.a<=0){ EA.rings.splice(i,1); continue; }
    ctx.fillStyle = 'rgba(255,248,208,'+rg.a.toFixed(2)+')';
    const n = Math.round(rg.r*2)+10;
    for(let j=0;j<n;j++){ const an = j/n*Math.PI*2; ctx.fillRect(Math.round(sx+Math.cos(an)*rg.r), Math.round(161+Math.sin(an)*rg.r*0.28), 2, 1); }
  }
  /* sombra que crece al acercarse */
  const sh = Math.round(4 + clamp01((ey+20)/181)*10);
  softShadow(sx, 161, sh);
  const sq = EA.landed ? springSquash(EA.landNow, 0.35) : [Math.max(0.2, Math.abs(spin)), 1];
  ctx.save(); ctx.translate(Math.round(sx), Math.round(ey)); ctx.scale(sq[0]*(spin<0&&!EA.landed?-1:1), sq[1]);
  ctx.drawImage(egg, -6, -13);
  ctx.restore();
  cineStep(EA.fx, dt);

  /* rótulo: qué huevo es y qué hacer */
  if(t>ARR_T.card){
    const rt = t-ARR_T.card;
    stampText('¡UN HUEVO!', 80, 36, '#ffffff', rt);
    const k = ease.outBack(clamp01((rt-220)/320));
    const cy = 60 - Math.round((1-k)*10);
    if(rt>220){
      ctx.globalAlpha = clamp01((rt-220)/200);
      drawTextOC('LINEA '+L.name, 80, cy, L.eggSpot, 2);
      if(LINE_MOTIF[p.line]) drawTextOC(LINE_MOTIF[p.line], 80, cy+14, '#fff8d0', 1);
      ctx.globalAlpha = 1;
    }
  }
  /* franjas de cine y pie de foto */
  const bar = Math.round(ease.outCubic(clamp01(t/400))*24 * (t>ARR_T.exit-300 ? Math.max(0, (ARR_T.exit-t)/300) : 1));
  px(0,0,LW,bar,'#07060f');
  px(0,196-bar,LW,bar+76,'#07060f');
  px(0,196,LW,76,'#07060f');
  if(t>ARR_T.land+300){
    ctx.globalAlpha = clamp01((t-ARR_T.land-300)/300);
    drawTextOC('TOCALO O FROTALO', 80, 214, '#ffd94a', 1);
    drawTextOC('PARA DARLE CALOR', 80, 224, '#ffd94a', 1);
    ctx.globalAlpha = 1;
  }
  if(t>ARR_T.card+700 && Math.floor(now/420)%2===0) drawTextOC('TOCA PARA SEGUIR', 80, 250, 'rgba(255,255,255,0.7)', 1);
  if(t>ARR_T.exit+2500) endEggArrive();   /* por si nadie toca */
}

/* ======================= 2) INCUBACIÓN ======================= */
function eggProgress(p){ return clamp01(Math.max((p.tapsOnEgg||0)/15, (Date.now()-p.bornAt)/T_HATCH)); }
/* grietas por fases (coordenadas dentro del sprite 12x13) */
const EGG_CRACKS = [
  [[5,2],[6,3],[5,4],[6,5]],
  [[7,5],[8,6],[9,5],[4,5],[3,6],[4,7],[2,7]],
  [[9,7],[8,8],[9,9],[6,6],[5,7],[6,8],[5,9],[2,4],[3,3]]
];
function drawEggCracks(ctx2, stage, lit, t){
  for(let c=0;c<stage;c++) for(const pt of EGG_CRACKS[c]){
    ctx2.fillStyle = lit ? (Math.floor(t/90+pt[0])%3 ? '#fff8d0' : '#ffd94a') : K;
    ctx2.fillRect(pt[0]-6, pt[1]-13, 1, 1);
  }
}
/* el huevo en el prado (lo llama drawOnePet) */
function drawEggWorld(p, i, t){
  if(p.arriving) return;                      /* lo pinta la cinemática */
  const now = performance.now();
  const sel = i===G.sel;
  const L = LINES[p.line], T = eggTheme(p.line);
  let ey = 160;
  /* huevos que llegan sin cinemática (cría, expedición): caída simple */
  const dropping = now - p.dropT < 900 && !p.landed;
  if(dropping){ const pr = Math.min(1, (now-p.dropT)/900); ey = -30 + 190*(pr*pr); }
  if(!dropping && !p.landed){ p.landed = true; p.squashAt = now; dustFx(p.rx, 161, 8); shake(0.2); }
  const k = eggProgress(p);
  /* latido: cada vez más rápido */
  const period = 1500 - 1050*k;
  p.beatPh = (p.beatPh||0) + 16.7/period;
  if(p.beatPh >= 1){
    p.beatPh -= 1; p.beatAt = now;
    if(sel && k>0.35 && UI.mode==='main' && Math.abs(p.rx-CAM.x-80)<90) SFX.eggBeat(k);
    if(k>0.5) eggP(p.line, p.rx, ey-8, {speed:0.03, life:600}, null);
  }
  const bt = now - (p.beatAt||0);
  const beat = bt < 260 ? Math.sin(bt/260*Math.PI) : 0;
  /* halo de su color que late */
  if(!dropping) glowDisc(Math.round(p.rx), Math.round(ey-7), Math.round(8 + k*6 + beat*3), L.eggSpot, 0.14 + k*0.18 + beat*0.12);
  /* temblor al final; aplastón al latir y al tocar */
  const jitter = k>0.75 ? Math.sin(t/25)*(Math.floor(t/700)%3===0 ? 1.5 : 0.4) : 0;
  const wob = (!dropping && now-p.hop < 300) ? Math.sin(t/30)*2 : (dropping ? 0 : Math.sin(t/300)*0.8 + jitter);
  if(!dropping) softShadow(p.rx, 161, 14);
  const esq = springSquash(p.squashAt, 0.28, now);
  const bsx = 1 + beat*0.07*(0.4+k), bsy = 1 - beat*0.06*(0.4+k);
  ctx.save();
  ctx.translate(Math.round(p.rx+wob), Math.round(ey));
  ctx.scale(esq[0]*bsx, esq[1]*bsy);
  ctx.drawImage(SPR['egg_'+p.line][0], -6, -13);
  const stage = k>0.8 ? 3 : (k>0.6 ? 2 : (k>0.4 ? 1 : 0));
  drawEggCracks(ctx, stage, k>0.7, t);
  /* ojitos que asoman por la grieta */
  if(k>0.85 && !((now/1700|0)%4===0 && (now%1700)<160)){
    ctx.fillStyle = K; ctx.fillRect(-2, -8, 1, 1); ctx.fillRect(1, -8, 1, 1);
  }
  ctx.restore();
  /* motas de su línea que flotan alrededor */
  if(!dropping && every(Math.round(900 - k*650), now)) eggP(p.line, p.rx+(Math.random()-0.5)*12, ey-4-Math.random()*8, {speed:0.015, life:900}, null);
  if(sel && !dropping && Math.floor(t/400)%2===0){
    px(p.rx-1, ey-24, 2, 2, '#ffd94a');
    px(p.rx-2, ey-26, 4, 2, '#ffd94a');
  }
}
/* darle calor: tocar (1) o frotar (fracciones) */
function eggWarm(p, amt, rub){
  const before = eggProgress(p);
  p.tapsOnEgg = Math.min(15, (p.tapsOnEgg||0) + amt);
  const k = eggProgress(p), now = performance.now();
  p.hop = now; p.squashAt = now;
  eggBurst(p.line, p.rx, 150, rub ? 2 : 5 + Math.floor(k*6), {speed:rub?0.04:0.07, life:600}, null);
  if(!rub){ ringFx(p.rx, 152, LINES[p.line].eggSpot, 10 + k*8, 300); vibrate(10); }
  if(!rub || every(120, now)) SFX.eggWarm(k);
  /* cruzar una fase: crujido, pausa y sacudida */
  for(const th of [0.4, 0.6, 0.8]){
    if(before < th && k >= th){ hitstop(50); shake(0.22); SFX.crack && SFX.crack(th===0.4?1:(th===0.6?2:3)); flash('#fff8d0', 0.18, 140);
      popText(p.rx, 128, th===0.8 ? '¡YA CASI!' : '¡CRAC!', '#ffd94a', {life:800}); }
  }
}

/* la ECLOSIÓN vive en render/cine.js (motor común con la evolución) */
