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

/* ======================= 3) ECLOSIÓN ======================= */
const HATCH_T = {zoom:600, crack1:1000, crack2:1450, crack3:1850, suck:1500, swell:2250, pop:2500, reveal:2850, blink:3350, voice:3600, card:3500, trait:3800, ask:4300};
let HX = null;
/* al nacer, el iris se abre sobre el huevo */
function hatchIntro(p){
  HX = null;
  JUICE.wipe = {t:0, dur:520, cx:Math.round(p.rx - CAM.x), cy:150};
  UI.hatchFrom = {x:p.rx - CAM.x};
}
function hatchTap(x, y){
  if(!HX || UI.hatchT < HATCH_T.pop-40){ UI.hatchT = Math.max(UI.hatchT, HATCH_T.pop-40); return; }
  if(UI.hatchT < HATCH_T.ask) { UI.hatchT = HATCH_T.ask; return; }
  /* ¿le pones nombre? */
  if(y!==undefined && y>=242 && y<=260){
    if(x < 80){ UI.nickBuf = ''; UI.renameFrom = 'hatch'; UI.mode = 'rename'; SFX.tap(); return; }
  }
  UI.mode = 'main'; SFX.tap();
  const p = AP(); p.squashAt = performance.now(); heartsFx(p.rx, 140, 3);
}
function drawHatch(dt){
  if(!HX || UI.hatchT < HX.t) HX = {t:0, fx:[], cracks:0, popped:false, suck:0, beatAt:0, beats:0};
  UI.hatchT += dt;
  const t = UI.hatchT; HX.t = t;
  const p = AP(), now = performance.now();
  const L = LINES[p.line], T = eggTheme(p.line);
  const egg = (SPR['egg_'+p.line]||SPR.egg_mystery)[0];
  const baby = SPR[p.line+'_'+(p.form||'babyA')];
  const FEET = 172, CY = 152;
  const popped = t>=HATCH_T.pop;
  /* zoom: el huevo viaja desde donde estaba en el prado al centro */
  const zk = ease.inOutSine(clamp01(t/HATCH_T.zoom));
  const fromX = UI.hatchFrom ? UI.hatchFrom.x : 80;
  const CX = Math.round(fromX + (80-fromX)*zk);
  const esc = 1 + zk*2;                                  /* 1x → 3x */
  const eFeet = Math.round(161 + (FEET-161)*zk);

  /* fondo: el prado se apaga hasta un foco */
  drawScene(now);
  px(0,196,160,76,'#0c0a1c');
  const dim = popped ? Math.max(0.3, 0.72 - (t-HATCH_T.pop)/1100) : Math.min(0.72, t/700*0.72);
  ctx.fillStyle = 'rgba(8,6,24,'+dim.toFixed(2)+')'; ctx.fillRect(0,0,160,272);
  /* foco de su color */
  const glowT = clamp01((t-HATCH_T.crack1)/(HATCH_T.pop-HATCH_T.crack1));
  glowDisc(CX, CY-6, Math.round(30 + glowT*20 + (popped?16:0)), L.eggSpot, 0.18 + glowT*0.22);
  glowDisc(CX, CY-6, Math.round(16 + glowT*10), '#fff8d0', 0.2 + glowT*0.2);

  if(!popped){
    /* latidos que se aceleran, con golpe de sonido */
    const k = t/HATCH_T.pop;
    const period = Math.max(170, 700 - k*560);
    if(now - HX.beatAt > period && t>HATCH_T.zoom*0.6){ HX.beatAt = now; HX.beats++; SFX.eggBeat(Math.min(1, 0.4+k)); shake(0.05+k*0.12); }
    const bt = now - HX.beatAt, beat = bt<180 ? Math.sin(bt/180*Math.PI) : 0;
    if(!HX.drone && t>HATCH_T.crack1){ HX.drone = true; SFX.eggDrone((HATCH_T.pop-HATCH_T.crack1)/1000); }
    /* grietas por fases */
    const want = t>=HATCH_T.crack3 ? 3 : t>=HATCH_T.crack2 ? 2 : t>=HATCH_T.crack1 ? 1 : 0;
    while(HX.cracks < want){
      HX.cracks++;
      SFX.crack(HX.cracks); shake(0.14+HX.cracks*0.07); vibrate(20); hitstop(40);
      for(let i=0;i<3+HX.cracks;i++) cineP(HX.fx, {x:CX-4+hash01(i+HX.cracks*7)*8, y:CY-8, vx:(hash01(i+3)-0.5)*0.08, vy:-0.06-hash01(i)*0.05, g:0.0003, life:700, col:L.eggShell, kind:'px', size:2, floor:FEET});
    }
    /* la energía de su línea es ABSORBIDA hacia el huevo */
    if(t>HATCH_T.suck){
      const sk = clamp01((t-HATCH_T.suck)/(HATCH_T.pop-HATCH_T.suck));
      if(every(Math.round(90 - sk*70), now)){
        const a = Math.random()*Math.PI*2, r = 60 + Math.random()*30;
        const sx0 = CX + Math.cos(a)*r, sy0 = CY-6 + Math.sin(a)*r*0.8;
        cineP(HX.fx, {x:sx0, y:sy0, vx:(CX-sx0)*0.0022, vy:(CY-6-sy0)*0.0022, life:440, col:T.cols[Math.floor(Math.random()*3)], kind:T.kind==='star'?'star':(T.kind==='spark'?'spark':'px'), size:2});
      }
      /* rayos que se escapan por las grietas */
      ctx.globalAlpha = 0.14 + sk*0.35;
      pxBeams(CX, CY-6, 7, 12, 40+sk*80, -1.57+Math.sin(t/300)*0.05 + t/2400, '#fff8d0', 3);
      ctx.globalAlpha = 1;
    }
    /* temblor y latido del huevo */
    const amp = (k<0.3 ? 0.4 : 1 + k*3) * (0.4 + beat);
    const ox = Math.round(Math.sin(t/26)*amp*zk);
    const swell = t>HATCH_T.swell ? (t-HATCH_T.swell)/(HATCH_T.pop-HATCH_T.swell) : 0;
    const white = swell*0.95;
    softShadow(CX, eFeet, Math.round(12*esc));
    ctx.save();
    ctx.translate(CX+ox, eFeet);
    const bsx = 1 + beat*0.08, bsy = 1 - beat*0.07;
    ctx.scale(esc*bsx*(1+swell*0.12), esc*bsy*(1+swell*0.12));
    ctx.drawImage(egg, -egg.width/2, -egg.height);
    drawEggCracks(ctx, HX.cracks, t>HATCH_T.crack2, t);
    if(white>0){ ctx.globalAlpha = white; ctx.drawImage(silhouette(egg), -egg.width/2, -egg.height); ctx.globalAlpha = 1; }
    ctx.restore();
    cineStep(HX.fx, dt);
    const msg = t<HATCH_T.crack1 ? '¿...?' : (t<HATCH_T.crack3 ? '¡SE MUEVE!' : '¡YA VIENE!');
    if(t>HATCH_T.zoom*0.5) drawTextOC(msg, 80, 56, t<HATCH_T.crack1 ? '#ffffff' : '#ffd94a', t<HATCH_T.crack1 ? 1 : 2);
  } else {
    const rt = t-HATCH_T.pop;
    if(!HX.popped){
      HX.popped = true;
      SFX.hatchPop(); vibrate([40,30,80]);
      shake(0.75); hitstop(90); flash('#ffffff', 1, 300);
      setTimeout(()=>flash(L.eggSpot, 0.45, 260), 120);
      for(let i=0;i<20;i++){
        const a = -Math.PI/2 + (hash01(i)-0.5)*2.9, sp = 0.07+hash01(i+11)*0.11;
        cineP(HX.fx, {x:CX+(hash01(i+5)-0.5)*16, y:CY-4+(hash01(i+8)-0.5)*14, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, g:0.00035, drag:0.0008,
          life:1900+hash01(i+2)*900, col:L.eggShell, spot:i%3===0 ? L.eggSpot : null, kind:'shard', floor:FEET+2+Math.round(hash01(i+4)*6), seed:i});
      }
      /* estallido temático + confeti de su color */
      eggBurst(p.line, CX, CY-6, 34, {speed:0.13, life:1100, up:0.02}, HX.fx);
      for(let i=0;i<26;i++){
        const a = -Math.PI/2 + (Math.random()-0.5)*2.2, sp = 0.06+Math.random()*0.1;
        cineP(HX.fx, {x:CX, y:CY-8, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, g:0.00022, drag:0.0015, life:1600+Math.random()*700,
          col:[L.eggSpot, '#ffd94a', '#ffffff', '#f2a2b8'][i%4], kind:'conf', floor:FEET+4, seed:i});
      }
      HX.rings = [{r:6,a:1},{r:2,a:0.8}];
    }
    /* rayos giratorios detrás */
    ctx.globalAlpha = Math.max(0.08, 0.34 - rt/4000);
    pxBeams(CX, CY-4, 10, 14, 120, now/2400, '#fff8d0', 5);
    ctx.globalAlpha = 1;
    if(HX.rings) for(let i=HX.rings.length-1;i>=0;i--){
      const rg = HX.rings[i]; rg.r += dt*0.13; rg.a -= dt*0.0017;
      if(rg.a<=0){ HX.rings.splice(i,1); continue; }
      ctx.fillStyle = 'rgba(255,248,208,'+rg.a.toFixed(2)+')';
      const n = Math.round(rg.r*1.8)+10;
      for(let j=0;j<n;j++){ const a = j/n*Math.PI*2; ctx.fillRect(Math.round(CX+Math.cos(a)*rg.r), Math.round(CY-4+Math.sin(a)*rg.r*0.85), 2, 2); }
    }
    /* el bebé: silueta blanca que salta, cae, se colorea */
    let yOff = 0, sx = 1, sy = 1;
    if(rt<520){
      const k = rt/520;
      yOff = -Math.sin(k*Math.PI)*28;
      if(k<0.5){ sx = 0.82; sy = 1.22; }
    } else {
      if(!HX.landFx){ HX.landFx = true; shake(0.22); tone({f:392, slide:520, d:0.08, type:'p25', vol:0.04}); for(let i=0;i<8;i++) cineP(HX.fx, {x:CX+(i-3.5)*4, y:FEET-1, vx:(i-3.5)*0.02, vy:-0.02, g:0.0001, life:420, col:'rgba(255,255,255,0.8)', size:1}); }
      const s2 = springSquash(1, 0.32, 1+(rt-520));
      sx = s2[0]; sy = s2[1];
      const hop = (rt-520) % 1300;
      if(rt>1400 && hop<300) yOff = -Math.sin(hop/300*Math.PI)*6;
    }
    /* primer parpadeo y primera palabra */
    const tb = t-HATCH_T.blink;
    const blink = (tb>0 && tb<160) || (t>HATCH_T.blink+600 && (now%2400)<140);
    if(t>HATCH_T.voice && !HX.voiced){ HX.voiced = true; petVoice(p); HX.voiceAt = now; if(typeof SFX.hatch==='function') SFX.hatch(); }
    const spr = baby ? baby[blink?1:0] : currentSprite();
    const shw = Math.round(34 - Math.min(14, -yOff/2));
    softShadow(CX, FEET, shw);
    const sil = rt<350 ? 1 : Math.max(0, 1-(rt-350)/400);
    drawSprAt(spr, CX, FEET+yOff, 3, sx, sy, sil);
    /* bocadillo de su primera palabra */
    if(HX.voiceAt && now-HX.voiceAt < 1400){
      const k = ease.outBack(clamp01((now-HX.voiceAt)/220));
      const bx = CX+22, by = CY-44 - Math.round((1-k)*6);
      px(bx-10, by-7, 20, 12, '#f6efe0'); px(bx-10, by-7, 20, 1, K); px(bx-10, by+4, 20, 1, K); px(bx-11, by-6, 1, 10, K); px(bx+10, by-6, 1, 10, K);
      px(bx-7, by+5, 2, 2, '#f6efe0'); px(bx-8, by+6, 1, 1, K);
      drawTextC('♪!', bx, by-4, '#e2574c');
    }
    if(rt>700){
      for(let i=0;i<4;i++){
        const ph = ((rt/1600) + i*0.25) % 1;
        const hx = CX - 20 + i*13 + Math.round(Math.sin(rt/300+i)*2);
        ctx.globalAlpha = ph<0.8 ? 1 : (1-ph)/0.2;
        drawText('♥', hx, Math.round(CY-18-ph*40), '#f2a2b8');
      }
      ctx.globalAlpha = 1;
    }
    cineStep(HX.fx, dt);

    /* títulos y tarjetas */
    stampText('¡HA NACIDO!', 80, 40, '#ffd94a', rt-80);
    const nm = LINES[p.line].names[p.form||'babyA'];
    const desc = (FORM_DESC[p.line] && FORM_DESC[p.line][p.form||'babyA']) || '';
    if(t>HATCH_T.card){
      const k = ease.outBack(clamp01((t-HATCH_T.card)/320));
      const x = Math.round(-150 + k*156);
      px(x+1, 193, 148, 28, 'rgba(0,0,0,0.35)');
      px(x, 190, 148, 28, '#20243c'); px(x, 190, 148, 1, '#ffd94a'); px(x, 217, 148, 1, K);
      px(x, 190, 4, 28, L.eggSpot);
      drawTextO(nm, x+10, 193, '#ffffff', 2);
      drawText('LINEA '+L.name, x+10, 205, L.eggSpot);
      drawText('GEN '+(p.gen||1), x+144-textW('GEN '+(p.gen||1)), 205, 'rgba(255,255,255,0.6)');
      if(desc) drawText(desc.length>34 ? desc.slice(0,34) : desc, x+10, 211, 'rgba(255,255,255,0.55)');
    }
    if(t>HATCH_T.trait && p.trait){
      const k = ease.outBack(clamp01((t-HATCH_T.trait)/320));
      const x = Math.round(166 - k*160);
      px(x, 220, 148, 13, '#f6efe0'); px(x, 220, 148, 1, K); px(x, 232, 148, 1, K);
      px(x+144, 220, 4, 13, '#f2a2b8');
      drawText(p.trait, x+6, 224, K);
      drawText(TRAITS[p.trait]||'', x+6+textW(p.trait)+6, 224, '#8a6a10');
    }
    /* ¿le pones nombre? */
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
  cineBars(t, 14);
}
