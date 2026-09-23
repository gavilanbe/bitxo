"use strict";
/* =========================================================
   BITXO — render/minigames: dibujo de los minijuegos de la sala
   Marco común: barra superior (X, título, reloj), franja inferior
   (puntos, récord, combo, pista), cuenta atrás y panel final.
   ========================================================= */

/* ---------------- utilidades de pintura ---------------- */
const MG_BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const MG_BG = {};
function mgBake(key, w, h, fn){
  if(!MG_BG[key]){
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    const f = (x,y,w2,h2,col)=>{ g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w2, h2); };
    fn(g, f);
    MG_BG[key] = c;
  }
  return MG_BG[key];
}
/* degradado vertical tramado (Bayer 4x4): pixel art de verdad */
function mgGrad(f, y0, y1, c1, c2, x0, w){
  x0 = x0||0; w = w||160;
  for(let y=y0;y<y1;y++){
    const k = (y-y0+0.5)/(y1-y0);
    f(x0, y, w, 1, c1);
    for(let x=x0;x<x0+w;x++) if(MG_BAYER[(y&3)*4+(x&3)]/16 < k) f(x, y, 1, 1, c2);
  }
}
function mgGradN(f, y0, y1, cols){
  const n = cols.length-1, h = (y1-y0)/n;
  for(let i=0;i<n;i++) mgGrad(f, Math.round(y0+i*h), Math.round(y0+(i+1)*h), cols[i], cols[i+1]);
}
/* sprite teñido, cacheado */
const MG_TINT = {};
function mgTint(spr, col, a, key){
  const k = key + col + a;
  if(!MG_TINT[k]){
    const c = document.createElement('canvas'); c.width = spr.width; c.height = spr.height;
    const g = c.getContext('2d');
    g.drawImage(spr, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
    MG_TINT[k] = c;
  }
  return MG_TINT[k];
}
/* estrella de 7x7 (panel final, objetos dorados) */
const MG_STAR7 = ['...#...','..###..','#######','.#####.','..###..','.##.##.','.#...#.'];
function mgStar(cx, cy, sc, col, oc, hi){
  const x0 = Math.round(cx - 3.5*sc), y0 = Math.round(cy - 3.5*sc);
  if(oc){
    for(let y=0;y<7;y++) for(let x=0;x<7;x++) if(MG_STAR7[y][x]==='#'){
      px(x0+x*sc-1, y0+y*sc, sc+2, sc, oc); px(x0+x*sc, y0+y*sc-1, sc, sc+2, oc);
    }
  }
  for(let y=0;y<7;y++) for(let x=0;x<7;x++) if(MG_STAR7[y][x]==='#') px(x0+x*sc, y0+y*sc, sc, sc, col);
  if(hi){ px(x0+3*sc, y0+sc, sc, sc, hi); px(x0+2*sc, y0+2*sc, sc, sc, hi); }
}
function mgSpark(x, y, col, big){
  x = Math.round(x); y = Math.round(y);
  if(big){ px(x-2,y,5,1,col); px(x,y-2,1,5,col); }
  else { px(x-1,y,3,1,col); px(x,y-1,1,3,col); }
}
function mgBox(x, y, w, h, fill, edge){
  px(x+1, y, w-2, h, fill); px(x, y+1, w, h-2, fill);
  px(x+1, y, w-2, 1, edge||K); px(x+1, y+h-1, w-2, 1, edge||K);
  px(x, y+1, 1, h-2, edge||K); px(x+w-1, y+1, 1, h-2, edge||K);
}

/* ---------------- el bitxo del jugador, expresivo ---------------- */
function mgPetFrames(){
  const p = AP();
  if(p.stage===STAGES.EGG){ const e = SPR['egg_'+p.line][0]; return [e, e]; }
  return SPR[currentFormDef().spr];
}
function drawMgPet(x, y, o){
  o = o||{};
  const m = UI.mg, now = performance.now();
  const mood = (m && m.moodUntil>now) ? m.mood : (o.mood||null);
  const fr = mgPetFrames();
  const spr = (mood==='dizzy' || o.closed) ? fr[1] : currentSprite();
  const w = spr.width, h = spr.height;
  const sq = m ? springSquash(m.sqAt, m.sqAmp, now) : [1,1];
  const z = o.z||1;
  const sx = sq[0]*(o.sx||1)*z, sy = sq[1]*(o.sy||1)*z;
  let hop = 0, wob = 0;
  if(mood==='happy') hop = Math.round(Math.abs(Math.sin(now/85))*2*z);
  if(mood==='dizzy') wob = Math.round(Math.sin(now/55)*1.5*z);
  if(o.shadow!==false){
    const gy = o.gy!==undefined ? o.gy : y;
    const sw = Math.max(4, Math.round((w*z-4)*(o.shadowK||1)));
    px(Math.round(x-sw/2), gy, sw, 2, 'rgba(0,0,0,0.25)');
  }
  ctx.save();
  if(o.alpha!==undefined) ctx.globalAlpha = o.alpha;
  ctx.translate(Math.round(x+wob), Math.round(y-hop));
  ctx.scale((o.flip?-1:1)*sx, sy);
  ctx.drawImage(spr, -Math.round(w/2), -h);
  ctx.restore();
  const top = Math.round(y - h*sy - hop);
  if(mood==='dizzy'){
    for(let i=0;i<3;i++){
      const a = now/150 + i*2.09;
      mgSpark(x+Math.cos(a)*8*z, top-3+Math.sin(a)*2.5, i%2?'#ffd94a':'#ffffff', z>1);
    }
  } else if(mood==='happy'){
    const k = (now%700)/700;
    ctx.globalAlpha = 1-k;
    drawText('♥', Math.round(x+w*z/2-2), top-3-Math.round(k*5), '#f2a2b8');
    ctx.globalAlpha = 1;
  }
  return top;
}

/* ---------------- barra superior: X, título, reloj ---------------- */
function mgTopBar(title, o){
  o = o||{};
  const m = UI.mg, now = performance.now();
  px(0, 0, 160, 16, '#141838');
  px(0, 15, 160, 1, '#2a3060');
  px(0, 16, 160, 1, K);
  /* botón salir */
  const xr = m && m.ph!=='end';
  if(xr){
    mgBox(2, 2, 14, 12, '#e2574c');
    px(3, 3, 12, 1, '#f08a7a');
    drawText('X', 7, 5, '#fff8d0');
  }
  drawTextC(title, 80, 5, '#f6efe0');
  if(o.right) drawText(o.right, 157-textW(o.right), 5, o.rightCol||'#ffd94a');
  if(m && m.timed && m.end){
    const rem = Math.max(0, m.end - m.t), s = Math.ceil(rem/1000);
    const k = rem/m.end;
    const hurry = s<=5 && m.ph!=='end' && !m.intro;
    const blink = hurry && Math.floor(now/160)%2===0;
    if(hurry){
      const bump = (1000 - (rem%1000)) < 120;
      drawTextO(String(s), 157-textWS(String(s), 2)-(bump?1:0), bump?2:3, blink?'#ffffff':'#e2574c', 2);
    } else {
      /* relojito */
      px(135, 4, 5, 7, '#f6efe0'); px(134, 5, 7, 5, '#f6efe0'); px(137, 5, 1, 3, K); px(137, 7, 2, 1, K);
      drawText(s+'S', 143, 5, '#f6efe0');
    }
    px(0, 17, 160, 2, '#0a0c20');
    const bw = Math.round(160*k);
    const col = hurry ? (blink ? '#ffffff' : '#e2574c') : (k<0.3 ? '#f0a04b' : '#5ec8d8');
    px(0, 17, bw, 2, col);
    if(bw>0) px(bw-1, 17, 1, 2, '#ffffff');
  } else if(o.progress!==undefined){
    px(0, 17, 160, 2, '#0a0c20');
    px(0, 17, Math.round(160*clamp01(o.progress)), 2, o.progCol||'#8a6ae8');
  }
}

/* ---------------- franja inferior: puntos, récord, combo, pista ---------------- */
function mgStripBG(){
  return mgBake('strip', 160, 76, (g, f)=>{
    mgGrad(f, 0, 76, '#1a1f48', '#10132e');
    f(0, 0, 160, 1, K); f(0, 1, 160, 1, '#2e3670');
    for(let y=6;y<76;y+=6) for(let x=(y/6%2)*3;x<160;x+=6) f(x, y, 1, 1, '#1e2452');
    f(4, 28, 152, 1, '#0a0c20'); f(4, 29, 152, 1, '#262c5c');
  });
}
function mgBottom(o){
  o = o||{};
  const m = UI.mg, now = performance.now();
  const Y = 196;
  ctx.drawImage(mgStripBG(), 0, Y);
  const score = o.score!==undefined ? o.score : m.score;
  if(score!==m.shown){ m.bumpAt = now; m.bumpUp = score>m.shown; m.shown = score; }
  const bk = now - m.bumpAt;
  const bump = bk < 90;
  const scol = bk<220 ? (m.bumpUp ? '#ffffff' : '#e2574c') : '#ffd94a';
  drawText(o.label||'PUNTOS', 6, Y+4, '#8a90c8');
  const ss = String(score);
  drawTextO(ss, 6, Y+11-(bump?2:0), scol, bump?4:3);
  /* récord */
  G.best = G.best||{};
  const best = G.best[UI.mode]||0;
  const cmp = o.recordScore!==undefined ? o.recordScore : score;
  if(o.record!==false){
    if(cmp>best && best>0 && m.ph!=='end'){
      if(Math.floor(now/250)%2) drawText('¡RECORD!', 154-textW('¡RECORD!'), Y+4, '#7ac74f');
    } else drawText('RECORD', 154-textW('RECORD'), Y+4, '#8a90c8');
    const bs = String(best);
    drawTextO(bs, 154-textWS(bs,2), Y+12, '#c8a040', 2);
  }
  /* medidor de combo: 10 celdas que se llenan y cambian de color por tramo */
  const cy = Y+34;
  const c = m.combo||0, tier = Math.floor(c/10), fill = c===0 ? 0 : (c%10===0 ? 10 : c%10);
  const tc = ['#7ac74f','#ffd94a','#f2a2b8','#5ec8d8','#8a6ae8'][Math.min(4, tier)];
  const tcPrev = ['#2e4a2a','#7ac74f','#ffd94a','#f2a2b8','#5ec8d8'][Math.min(4, tier)];
  const broke = now - (m.comboBreakAt||0) < 450;
  const sh = broke ? Math.round(Math.sin(now/25)*2) : 0;
  drawText(o.comboLabel||'COMBO', 6, cy+1, broke ? '#e2574c' : '#8a90c8');
  for(let i=0;i<10;i++){
    const x = 30 + i*9 + sh;
    const on = i<fill;
    let col = on ? tc : (tier>0 ? tcPrev : '#262c5c');
    if(broke) col = Math.floor(now/70)%2 ? '#e2574c' : '#262c5c';
    px(x, cy, 7, 7, K);
    px(x+1, cy+1, 5, 5, col);
    if(on && !broke) px(x+1, cy+1, 2, 1, '#ffffff');
  }
  const lastOn = now - (m.comboAt||0);
  if(c!==m.comboShown){ if(c>(m.comboShown||0)) m.comboAt = now; m.comboShown = c; }
  if(c>0 && lastOn<120 && !broke){ const x = 30 + (fill-1)*9; px(x-1, cy-1, 9, 9, 'rgba(255,255,255,0.35)'); }
  if(o.mult){
    const mul = 1 + Math.floor(c/10);
    if(mul>1) drawTextO('X'+mul, 154-textWS('X'+mul,2), cy-2, tc, 2);
    else drawText('X'+c, 154-textW('X'+c), cy+1, c>0 ? tc : '#5a6090');
  } else drawText('X'+c, 154-textW('X'+c), cy+1, c>0 ? tc : '#5a6090');
  /* fila propia del juego */
  if(o.extra) o.extra(Y+48);
  /* pista de controles */
  if(o.hint){
    const h = typeof o.hint==='function' ? o.hint() : o.hint;
    drawTextC(h, 80, Y+65, 'rgba(200,205,240,0.55)');
  }
}

/* ---------------- cuenta atrás 3-2-1-¡YA! con tarjeta de reglas ---------------- */
function mgCountdown(){
  const m = UI.mg, now = performance.now();
  if(!m || m.ph==='end') return;
  if(m.intro){
    const rules = MG_RULES[UI.mode]||['',''];
    const title = MG_TITLES[UI.mode]||'';
    ctx.fillStyle = 'rgba(10,8,30,0.45)'; ctx.fillRect(0, 17, 160, 179);
    /* tarjeta */
    const k = ease.outBack(clamp01(m.ie/300));
    const cy = Math.round(46 + (1-k)*-30);
    mgBox(14, cy, 132, 44, '#20264e', K);
    px(15, cy+1, 130, 1, '#3a4280');
    drawTextOC(title, 80, cy+6, '#ffd94a', 2);
    drawTextC(rules[0], 80, cy+22, '#f6efe0');
    drawTextC(rules[1], 80, cy+31, '#9aa0d0');
    if(m.cd>=0 && m.cd<3){
      const age = now - m.cdAt;
      const sc = age<60 ? 7 : (age<130 ? 6 : 5);
      const cols = ['#e2574c','#f0a04b','#ffd94a'];
      const s = String(3-m.cd);
      const a = 1 - clamp01((age - m.introStep*0.7)/(m.introStep*0.3));
      ctx.globalAlpha = a;
      drawTextOC(s, 80, 116 - Math.floor(sc*5/2), cols[m.cd], sc);
      ctx.globalAlpha = 1;
      /* anillo que se abre con cada número */
      const r = 8 + ease.outCubic(clamp01(age/300))*26;
      ctx.globalAlpha = 0.5*(1-clamp01(age/300));
      for(let j=0;j<28;j++){ const an = j/28*Math.PI*2; px(80+Math.cos(an)*r, 116+Math.sin(an)*r*0.8, 1, 1, cols[m.cd]); }
      ctx.globalAlpha = 1;
    }
    return;
  }
  const ga = now - (m.goAt||0);
  if(m.goAt && ga < 600){
    const sc = ga<70 ? 6 : 4;
    ctx.globalAlpha = 1 - clamp01((ga-350)/250);
    drawTextOC('¡YA!', 80, 106 - Math.round(ga*0.03) - sc*2, '#7ac74f', sc);
    ctx.globalAlpha = 1;
  }
}

/* ---------------- PANEL FINAL ---------------- */
function drawMgEnd(){
  const m = UI.mg, now = performance.now();
  const T = mgEndTimeline(m);
  const age = mgEndAge(m);
  const F = m.fxDone || (m.fxDone = {});
  /* 1) cartel de fin: ¡TIEMPO! / ¡FALLO! / ¡COMPLETO! */
  if(age < T.panel + 150){
    const k = clamp01(age/180);
    const bw = Math.round(160*ease.outCubic(k));
    px(80-bw/2, 94, bw, 30, 'rgba(20,24,56,0.9)');
    px(80-bw/2, 94, bw, 1, K); px(80-bw/2, 123, bw, 1, K);
    const sc = age<80 ? 5 : 3;
    const col = m.endWhy==='¡FALLO!'||m.endWhy==='¡PLOF!' ? '#e2574c' : (m.endWhy==='ABANDONO' ? '#9aa0d0' : '#ffd94a');
    ctx.globalAlpha = 1 - clamp01((age - T.panel)/150);
    drawTextOC(m.endWhy||'¡FIN!', 80, 109 - Math.floor(sc*5/2), col, sc);
    ctx.globalAlpha = 1;
    if(age < T.panel) return;
  }
  /* 2) velo y panel que sube con rebote */
  const pk = clamp01((age - T.panel)/320);
  ctx.fillStyle = 'rgba(10,8,30,' + (0.6*pk).toFixed(3) + ')';
  ctx.fillRect(0, 0, LW, LH);
  const oy = Math.round((1-ease.outBack(pk))*90);
  const py = 40 + oy;
  panel(12, py, 136, 188);
  titleChip(80, py+7, m.title);
  const res = m.quit ? 'ABANDONO' : (m.won ? '¡VICTORIA!' : 'CASI...');
  drawTextC(res, 80, py+17, m.quit ? '#6a6480' : (m.won ? '#3a7048' : '#a03030'));
  /* 3) puntos que cuentan hacia arriba */
  const ck = clamp01((age - T.count)/(T.countEnd - T.count));
  const shownScore = Math.round((m.scoreF||0)*ease.outCubic(ck));
  if(ck>0 && ck<1 && now - (F.tickAt||0) > 55){ F.tickAt = now; if(!m.endSkip) SFX.mgCountUp(); }
  drawText('PUNTOS', 80-textW('PUNTOS')/2, py+54, '#8a7a60');
  const done = ck>=1;
  const land = done && age - T.countEnd < 90;
  drawTextOC(String(shownScore), 80, py+62-(land?2:0), done ? '#ffd94a' : '#ffffff', land?4:3, K);
  /* 4) estrellas: pop una a una con tono ascendente */
  for(let i=0;i<3;i++){
    const sx = 50 + i*30, sy = py + 38 - (i===1?3:0);
    const at = T.stars + i*300;
    const got = i < (m.stars||0);
    if(got && age>=at){
      if(!F['s'+i]){ F['s'+i] = 1; if(!m.endSkip || age-at<400){ SFX.mgStar(i); burst(sx, sy, {n:10, cols:['#ffd94a','#ffffff','#f0a04b'], speed:0.1, kind:'star', g:0.0002}); shake(0.12); } }
      const a = age - at;
      const sc = a<60 ? 4 : (a<130 ? 3 : 2);
      mgStar(sx, sy, sc, '#ffd94a', K, '#fff8d0');
    } else {
      mgStar(sx, sy, 2, '#c8bca0', '#8a7a60');
    }
  }
  /* 5) premios */
  if(age >= T.rewards){
    if(!F.rw){ F.rw = 1; if(!m.endSkip){ SFX.coin(); if(m.won) SFX.yay(); } }
    const rk = clamp01((age - T.rewards)/400);
    const mo = Math.round((m.rMotas||0)*rk), xp = Math.round((m.rXp||0)*rk);
    px(20, py+100, 120, 1, '#c8bca0');
    drawTextO('+'+fmt(mo)+'✦', 48-Math.round(textWS('+'+fmt(mo)+'✦',2)/2), py+105, '#ffd94a', 2, '#8a6a10');
    drawTextO('+'+xp+'XP', 112-Math.round(textWS('+'+xp+'XP',2)/2), py+105, '#5ec8d8', 2, '#1c4a5a');
    if(m.bonus) drawTextC(m.bonus, 80, py+121, '#3a7048');
    if(m.maxCombo>=3) drawTextC('COMBO MAX X'+m.maxCombo, 80, py+(m.bonus?130:121), '#8a7a60');
  }
  /* 6) récord: sello que cae con fanfarria */
  if(age >= T.record){
    if(m.newBest){
      if(!F.rec){ F.rec = 1; SFX.mgRecord(); confetti(80, py+84, 40); shake(0.35); flash('#ffd94a', 0.35, 220); vibrate([30,30,60]); }
      const a = age - T.record;
      const sc = a<70 ? 4 : (a<140 ? 3 : 2);
      const s = '¡NUEVO RECORD!';
      const w = textWS(s, sc) + 8;
      const blink = Math.floor(now/300)%2;
      px(80-w/2, py+83-sc*2, w, sc*5+6, blink ? '#e2574c' : '#c83a30');
      px(80-w/2, py+83-sc*2, w, 1, K); px(80-w/2, py+83-sc*2+sc*5+5, w, 1, K);
      drawTextOC(s, 80, py+86-sc*2, '#fff8d0', sc);
    } else if(!m.quit){
      drawTextC('RECORD: '+(m.prevBest||0), 80, py+86, '#8a7a60');
    }
  }
  /* 7) botones: sólo cuando todo ha terminado de contar */
  if(age >= T.done){
    const bk = clamp01((age - T.done)/200);
    const by = Math.round((1-ease.outBack(bk))*8);
    const B1 = MG_BTN_AGAIN, B2 = MG_BTN_EXIT;
    const pulse = Math.floor(now/500)%2;
    px(B1.x+1, B1.y+B1.h+by, B1.w-1, 2, 'rgba(26,20,40,0.35)');
    mgBox(B1.x, B1.y+by, B1.w, B1.h, '#7ac74f');
    px(B1.x+2, B1.y+1+by, B1.w-4, 1, '#a8e080');
    drawTextC('OTRA', B1.x+B1.w/2, B1.y+6+by, K);
    px(B2.x+1, B2.y+B2.h+by, B2.w-1, 2, 'rgba(26,20,40,0.35)');
    mgBox(B2.x, B2.y+by, B2.w, B2.h, pulse ? '#ffd94a' : '#f0c040');
    px(B2.x+2, B2.y+1+by, B2.w-4, 1, '#fff8d0');
    drawTextC('SEGUIR', B2.x+B2.w/2, B2.y+6+by, K);
  } else if(age > MG_END_LOCK){
    drawTextC('TOCA PARA VERLO YA', 80, 210, 'rgba(26,20,40,0.35)');
  }
}

/* =========================================================
   LLUVIA DE MOTAS (CATCH)
   ========================================================= */
function drawCatch(t, dt){
  const m = UI.mg;
  catchStep(mgFrame(dt));
  drawScene(t);
  const now = performance.now();
  /* sombras en el suelo: dicen dónde caerá cada cosa */
  for(const it of m.items){
    const k = clamp01((it.y-22)/(CATCH_Y-22));
    const w = 1 + Math.round(k*5);
    px(Math.round(it.x - w/2), CATCH_Y+1, w, 1, 'rgba(0,0,0,' + (0.1+k*0.25).toFixed(2) + ')');
  }
  for(const s of m.splats){
    ctx.globalAlpha = 1 - clamp01((m.t-s.t-1800)/700);
    px(s.x-4, CATCH_Y-1, 9, 2, '#6a4a2a'); px(s.x-2, CATCH_Y-2, 5, 1, '#8a6a3a');
    ctx.globalAlpha = 1;
  }
  for(const it of m.items){
    const x = Math.round(it.x), y = Math.round(it.y);
    if(it.kind==='poop'){
      ctx.drawImage(SPR.poop, x-4, y-4);
      const w2 = Math.floor(t/150+it.sp)%2;
      px(x-3+w2, y-8, 1, 2, 'rgba(122,199,79,0.7)'); px(x+2-w2, y-9, 1, 2, 'rgba(122,199,79,0.7)');
    } else if(it.kind==='star'){
      px(x, y-10, 1, 4, 'rgba(255,217,74,0.35)');
      const pulse = Math.floor(t/90+it.sp)%2;
      mgStar(x+0.5, y+0.5, 1, pulse ? '#ffd94a' : '#fff8d0', K);
      if(pulse) mgSpark(x+5, y-4, '#ffffff');
    } else {
      px(x, y-7, 1, 3, 'rgba(255,217,74,0.3)');
      const tw = Math.floor(t/110+it.sp)%2;
      if(tw){ px(x, y-3, 1, 7, '#ffd94a'); px(x-3, y, 7, 1, '#ffd94a'); }
      else { px(x, y-2, 1, 5, '#ffd94a'); px(x-2, y, 5, 1, '#ffd94a'); px(x-2,y-2,1,1,'#f0a04b'); px(x+2,y-2,1,1,'#f0a04b'); px(x-2,y+2,1,1,'#f0a04b'); px(x+2,y+2,1,1,'#f0a04b'); }
      px(x-1, y-1, 3, 3, '#fff8d0'); px(x, y, 1, 1, '#ffffff');
    }
  }
  /* el bitxo corre: inclina y estira con la velocidad */
  const spd = Math.abs(m.vx||0);
  const mv = spd > 0.01;
  const ph2 = Math.abs(Math.sin(t/90));
  const lean = Math.min(0.14, spd*1.2);
  if(mv && Math.floor(t/90)%3===0 && dt>0) dustFx(m.px - Math.sign(m.vx)*5, CATCH_Y, 1);
  drawMgPet(m.px, CATCH_Y - (mv?Math.round(ph2*2):0), {z:2, flip:(m.vx||0)<-0.005, sx:1+lean, sy:1-lean*0.6, gy:CATCH_Y});
  mgTopBar('LLUVIA DE MOTAS');
  mgBottom({mult:true, hint:'ARRASTRA · FLECHAS', extra:(y)=>{
    drawText('CAE:', 6, y, '#8a90c8');
    px(26, y-1, 7, 7, 'rgba(0,0,0,0)');
    mgSpark(30, y+2, '#ffd94a', true); drawText('+1', 35, y, '#f6efe0');
    mgStar(55, y+2.5, 1, '#ffd94a', K); drawText('+5', 60, y, '#f6efe0');
    ctx.drawImage(SPR.poop, 76, y-2); drawText('-2', 86, y, '#e2574c');
  }});
  mgCountdown();
  if(m.ph==='end') drawMgEnd();
}

/* =========================================================
   BAILE (DANCE)
   ========================================================= */
function danceBG(){
  return mgBake('dance', 160, 180, (g, f)=>{
    mgGradN(f, 0, 118, ['#0e0a20','#1a1236','#2a1a48','#3a1e52']);
    /* telón lateral */
    for(let x=0;x<14;x+=3){ f(x, 0, 2, 118, '#5a1a3a'); f(146+x, 0, 2, 118, '#5a1a3a'); }
    f(0, 0, 14, 118, 'rgba(0,0,0,0)');
    for(let y=0;y<118;y++){ f(13, y, 1, 1, '#2a0a1a'); f(146, y, 1, 1, '#2a0a1a'); }
    /* suelo de baldosas con perspectiva */
    for(let r=0;r<6;r++){
      const y0 = 118 + [0,5,11,18,26,35][r], y1 = 118 + [5,11,18,26,35,48][r];
      const n = 8 + r*2, w = 160/n;
      for(let c=0;c<n;c++) f(Math.round(c*w), y0, Math.ceil(w), y1-y0, (r+c)%2 ? '#241a3a' : '#2e2248');
      f(0, y0, 160, 1, '#140e24');
    }
    /* carril de notas */
    f(0, 166, 160, 14, '#120c22'); f(0, 166, 160, 1, K); f(0, 179, 160, 1, '#2a2048');
  });
}
const DANCE_TILE_COLS = ['#e2574c','#ffd94a','#5ec8d8','#7ac74f','#f2a2b8','#8a6ae8'];
function drawDance(t, dt){
  const m = UI.mg;
  const now = performance.now();
  if(m.ph==='play'){
    mgFrame(dt);
    danceStep(dt);
    if(m.t >= m.end) danceFinish();
  }
  ctx.drawImage(danceBG(), 0, 16);
  const bk = clamp01((now - (m.beatAt||0))/260);      /* 0 = en el pulso */
  const pulse = 1 - bk;
  /* luces de suelo al ritmo */
  if(m.beatN>=0 && m.ph==='play'){
    for(let i=0;i<5;i++){
      const r = (m.beatN*7 + i*13) % 6, c = (m.beatN*5 + i*11) % (8+r*2);
      const n = 8 + r*2, w = 160/n;
      const y0 = 134 + [0,5,11,18,26,35][r], y1 = 134 + [5,11,18,26,35,48][r];
      ctx.globalAlpha = 0.35 + pulse*0.45;
      px(Math.round(c*w), y0, Math.ceil(w), y1-y0-1, DANCE_TILE_COLS[(m.beatN+i)%6]);
    }
    ctx.globalAlpha = 1;
  }
  /* focos que barren */
  for(let i=0;i<2;i++){
    const a = Math.sin(t/900 + i*2.4)*0.5;
    const ox = i ? 150 : 10, col = i ? 'rgba(242,162,184,0.10)' : 'rgba(94,200,216,0.10)';
    ctx.fillStyle = col;
    for(let y=20;y<150;y+=2){
      const cx = ox + (y-20)*Math.tan(a + (i? -0.5:0.5));
      const w = 4 + (y-20)*0.22;
      ctx.fillRect(Math.round(cx-w/2), y, Math.round(w), 2);
    }
  }
  /* bola de espejos */
  px(79, 17, 1, 6, '#6a6480');
  const bx = 80, by = 30;
  for(let y=-6;y<=6;y++){ const w = Math.round(Math.sqrt(36-y*y))*2; for(let x=-w/2;x<w/2;x+=2) px(bx+x, by+y, 2, 1, ((x+y+Math.floor(t/120))&3)===0 ? '#ffffff' : ((x+y)&2 ? '#a8a0c8' : '#6a6490')); }
  for(let i=0;i<6;i++){
    const a = t/700 + i*1.05, r = 26 + (i%3)*18;
    const sx = bx + Math.cos(a)*r*1.4, sy = by + 20 + Math.sin(a)*r*0.5 + i*6;
    if((Math.floor(t/150)+i)%3) px(sx, sy, 1, 1, '#ffffff');
  }
  /* público: siluetas que botan al pulso */
  for(let i=0;i<9;i++){
    const x = 8 + i*18 + (i%2)*4;
    const hop = Math.round(pulse*((i%3)+1));
    const y = 132 - hop;
    px(x-4, y-5, 9, 7, '#140e24'); px(x-3, y-8, 7, 3, '#140e24');
    if(i%3===1){ px(x-6, y-10-hop, 2, 5, '#140e24'); px(x+5, y-10-hop, 2, 5, '#140e24'); }
  }
  /* bitxo bailando: rebota, se estira y cambia de lado a tempo */
  const side = (m.beatN>=0 ? m.beatN : 0)%2;
  const amp = m.ph==='play' && m.beatN>=0 ? pulse : 0;
  drawMgPet(80, 164 - Math.round(amp*6), {z:2, flip:!!side, sx:1-amp*0.08, sy:1+amp*0.12, gy:164});
  /* carril de notas */
  const LY = 189, TX = 28;
  const hitK = now - (m.lastHitFx||0);
  px(TX-7, LY-7, 15, 15, 'rgba(255,217,74,0.12)');
  for(let j=0;j<24;j++){ const an = j/24*Math.PI*2; px(TX+Math.cos(an)*7, LY+Math.sin(an)*6, 1, 1, pulse>0.6 ? '#ffffff' : '#ffd94a'); }
  for(let x=TX+10;x<160;x+=6) px(x, LY, 2, 1, '#2a2048');
  for(const b of m.beats){
    if(b.hit>0){
      const a = now - (b.hitAt||0);
      if(a<200){ ctx.globalAlpha = 1-a/200; mgBox(TX-5-a/40, LY-5-a/40, 11+a/20, 11+a/20, 'rgba(0,0,0,0)', b.hit===3?'#ffd94a':'#7ac74f'); ctx.globalAlpha = 1; }
      continue;
    }
    const x = Math.round(TX + (b.t-m.t)*0.07);
    if(x<-8 || x>168) continue;
    const miss = b.hit===-1;
    const col = miss ? '#5a4a6a' : (b.i%4===0 ? '#ffd94a' : '#f2a2b8');
    const yy = miss ? LY + Math.min(8, Math.round((m.t-b.t-140)/30)) : LY;
    mgBox(x-4, yy-4, 9, 9, col, K);
    px(x-2, yy-3, 3, 1, 'rgba(255,255,255,0.7)');
    px(x, yy-1, 1, 3, K); px(x+1, yy-2, 1, 1, K);
  }
  /* juicio */
  const ja = now - (m.judgeT||0);
  if(m.judge && ja<520){
    const sc = ja<70 ? 3 : 2;
    const col = m.judgeK===2 ? '#ffd94a' : (m.judgeK===1 ? '#7ac74f' : '#e2574c');
    ctx.globalAlpha = 1 - clamp01((ja-380)/140);
    drawTextOC(m.judge, 80, 88 - Math.round(ja*0.02) - (m.judgeK===0?0:0), col, sc);
    ctx.globalAlpha = 1;
  }
  if(now - (m.missFlashAt||0) < 120){ ctx.fillStyle='rgba(226,87,76,0.15)'; ctx.fillRect(0,17,160,179); }
  const D = m.disco;
  mgTopBar(D ? D.name.replace('DISCO ','') : 'BAILE', {progress: clamp01(m.t/m.end), progCol:'#f2a2b8', right: D && D.mult!==1 ? 'X'+D.mult : ''});
  mgBottom({hint:'TOCA · ESPACIO', extra:(y)=>{
    drawText('PERFECTOS', 6, y, '#8a90c8'); drawText(String(m.perfects||0), 46, y, '#ffd94a');
    const left = m.beats.filter(b=>!b.hit).length;
    drawText('NOTAS '+left, 154-textW('NOTAS '+left), y, '#f2a2b8');
  }});
  mgCountdown();
  if(m.ph==='end') drawMgEnd();
}

/* =========================================================
   SIMON
   ========================================================= */
function simonBG(){
  return mgBake('simon', 160, 180, (g, f)=>{
    mgGradN(f, 0, 180, ['#0a1628','#0e2030','#12303a','#143a3e']);
    for(let i=0;i<30;i++) f((i*53+7)%160, (i*31+5)%60, 1, 1, i%4 ? '#3a5a70' : '#9adcf0');
    /* estanque */
    for(let y=0;y<120;y++){
      const dy = (y-60)/60, w = Math.round(Math.sqrt(Math.max(0,1-dy*dy))*76);
      f(80-w, 64+y, w*2, 1, y<3 ? '#2a6a70' : '#1c4a58');
      for(let x=80-w;x<80+w;x++) if(MG_BAYER[(y&3)*4+(x&3)] < 3 + (y>60?4:0)) f(x, 64+y, 1, 1, '#163e4c');
    }
    /* rocas y juncos del borde */
    for(let i=0;i<8;i++){ const x = [6,20,138,150,10,146,30,128][i], y = [120,150,110,140,172,168,178,176][i]; f(x-4, y, 9, 4, '#3a4a50'); f(x-3, y-1, 7, 1, '#5a6a70'); }
    for(let i=0;i<6;i++){ const x = [4,14,24,136,146,156][i]; f(x, 90+i*3, 1, 30, '#2e5c3a'); f(x, 88+i*3, 1, 3, '#7a5a3a'); }
    /* piedra del bitxo */
    f(64, 70, 32, 7, '#4a5a60'); f(66, 68, 28, 2, '#6a7a80'); f(64, 76, 32, 1, K);
  });
}
function drawFlowerPad(F, i, lit, pressed, now, m){
  const x = F.x, y = F.y + (pressed?1:0);
  /* nenúfar */
  px(x-19, y-14, 38, 30, 'rgba(0,0,0,0.25)');
  for(let r=-15;r<=15;r++){
    const w = Math.round(Math.sqrt(1-(r*r)/(15*15))*19);
    px(x-w, y+r-1, w*2, 1, lit ? '#6ac05a' : '#2e6a3a');
  }
  px(x, y-16, 1, 8, lit ? '#3a8a3a' : '#1c4a28');
  px(x-12, y-12, 6, 1, lit ? '#9ae080' : '#3e7a48');
  /* flor */
  const c = lit ? F.c : F.c;
  const glow = lit ? 1 : 0.35;
  ctx.globalAlpha = glow;
  const s = lit ? 1 : 0;
  px(x-9-s, y-3, 18+s*2, 6, c); px(x-3, y-9-s, 6, 18+s*2, c);
  px(x-7, y-7, 14, 14, c);
  px(x-7, y-7, 3, 3, 'rgba(255,255,255,0.4)');
  ctx.globalAlpha = 1;
  px(x-2, y-2, 4, 4, lit ? '#fff8d0' : '#0e1030');
  if(lit){
    const k = clamp01((now - m.litAt)/330);
    const r = 12 + ease.outCubic(k)*12;
    ctx.globalAlpha = 1-k;
    for(let j=0;j<24;j++){ const an = j/24*Math.PI*2; px(x+Math.cos(an)*r, y+Math.sin(an)*r*0.8, 1, 1, '#ffffff'); }
    ctx.globalAlpha = 1;
  }
  /* número de tecla */
  drawText(String(i+1), x+13, y+9, 'rgba(255,255,255,0.35)');
}
function drawSimon(t, dt){
  const m = UI.mg;
  simonStep(mgFrame(dt));
  const now = performance.now();
  ctx.drawImage(simonBG(), 0, 16);
  /* olas del estanque */
  for(let i=0;i<5;i++){ const y = 100 + i*18, x = 40 + ((t/30 + i*37)%80); px(x, y, 5, 1, 'rgba(154,220,240,0.18)'); }
  for(let i=0;i<4;i++){
    const F = FLOWERS[i];
    const lit = m.lit===i && now-m.litAt<330;
    const pressed = m.pressI===i && now-(m.pressAt||0)<120;
    drawFlowerPad(F, i, lit, pressed, now, m);
  }
  if(m.failT){
    const blink = Math.floor(now/120)%2;
    const W = FLOWERS[m.wrongI], R = FLOWERS[m.rightI];
    if(blink){ drawTextOC('X', W.x, W.y-7, '#e2574c', 3); }
    if(R){ ctx.globalAlpha = blink?0.9:0.3; mgBox(R.x-20, R.y-18, 40, 36, 'rgba(0,0,0,0)', '#ffffff'); ctx.globalAlpha = 1; }
  }
  /* el bitxo mira hacia la flor que brilla */
  const watching = m.ph==='show' && now-m.litAt<300 && m.lit>=0;
  const flip = m.lit>=0 && (m.lit%2===0) && now-m.litAt<600;
  drawMgPet(80, 86 - (watching?2:0), {z:2, flip, gy:86, sy:watching?1.06:1});
  const turn = m.ph==='input' && !m.failT;
  mgTopBar('SIMON', {right:'RONDA '+Math.min(8,m.round)+'/8'});
  mgBottom({label:'RONDAS', comboLabel:'RACHA', hint:turn ? '¡TU TURNO! · TECLAS 1-4' : 'MIRA LA SECUENCIA...', extra:(y)=>{
    const n = m.seq.length;
    const w = n*8;
    for(let i=0;i<n;i++){
      const x = 80 - w/2 + i*8;
      const done = m.ph==='input' ? i<m.idx : i<m.showI;
      const cur = m.ph==='input' && i===m.idx;
      const col = done ? FLOWERS[m.seq[i]].c : (cur && Math.floor(now/200)%2 ? '#ffffff' : '#262c5c');
      px(x, y, 6, 6, K); px(x+1, y+1, 4, 4, m.ph==='show'&&done ? FLOWERS[m.seq[i]].c : col);
    }
  }});
  if(m.ph==='input' && now - (m.inputAt||0) < 700 && !m.failT){
    const a = now - m.inputAt;
    ctx.globalAlpha = 1-clamp01((a-450)/250);
    drawTextOC('¡TU TURNO!', 80, 40, '#ffffff', a<60?3:2);
    ctx.globalAlpha = 1;
  }
  mgCountdown();
  if(m.ph==='end') drawMgEnd();
}

/* =========================================================
   SALTA
   ========================================================= */
function drawJump(t, dt){
  const m = UI.mg;
  jumpStep(mgFrame(dt));
  const now = performance.now();
  drawScene(t);
  const sc = m.scroll||0;
  /* matorrales de fondo (parallax lento) */
  for(let i=0;i<7;i++){
    const x = Math.round(((i*37 - sc*0.35) % 185 + 185) % 185) - 12;
    px(x, 150, 14, 4, '#3e7a48'); px(x+2, 148, 10, 2, '#478a50'); px(x+4, 147, 5, 1, '#57a05e');
  }
  /* camino de tierra que corre */
  px(0, JUMP_GY, 160, 9, '#9a7448');
  px(0, JUMP_GY, 160, 1, '#b89060');
  px(0, JUMP_GY+8, 160, 1, '#7a5a38');
  for(let i=0;i<12;i++){
    const x = Math.round(((i*29 - sc) % 170 + 170) % 170) - 5;
    px(x, JUMP_GY+3+(i%3)*2, i%2?2:1, 1, i%2 ? '#7a5a38' : '#c8a070');
  }
  /* matas en primer plano (rápidas) */
  for(let i=0;i<6;i++){
    const x = Math.round(((i*41 - sc*1.4) % 200 + 200) % 200) - 20;
    const y = 176 + (i%3)*6;
    px(x, y, 1, 3, '#3a7048'); px(x+2, y-1, 1, 4, '#478a50'); px(x+4, y+1, 1, 2, '#3a7048');
  }
  /* líneas de velocidad */
  const spd = jumpSpeed(m.t);
  if(spd>0.085 && m.ph==='play' && !m.intro){
    for(let i=0;i<4;i++){ const x = ((i*53 - sc*2.2) % 190 + 190) % 190 - 20, y = 40 + i*23; px(x, y, 14, 1, 'rgba(255,255,255,0.25)'); }
  }
  /* obstáculos */
  for(const o of m.obs) drawJumpObs(Math.round(o.x), JUMP_GY, o);
  for(const f of m.flying){
    ctx.save();
    ctx.translate(Math.round(f.x), Math.round(f.y - f.h/2));
    ctx.rotate(f.rot);
    drawJumpObs(0, Math.round(f.h/2), f);
    ctx.restore();
  }
  /* el bitxo: se estira al subir, se aplasta al caer */
  const air = m.y<0;
  const run = !air && m.ph==='play' && !m.intro ? Math.round(Math.abs(Math.sin(t/85))*2) : 0;
  const st = air ? clamp01(-m.vy*4) : 0;
  const inv = m.inv>0;
  const alpha = inv ? (Math.floor(t/70)%2 ? 0.35 : 0.9) : 1;
  const hk = clamp01(-m.y/20);
  drawMgPet(JUMP_X, JUMP_GY + m.y - run, {sx:1-st*0.12, sy:1+st*0.18, alpha, gy:JUMP_GY, shadowK:1-hk*0.5});
  mgTopBar('SALTA');
  mgBottom({mult:true, hint:'TOCA · ESPACIO', extra:(y)=>{
    drawText('RASANTES', 6, y, '#8a90c8'); drawText(String(m.closeCalls||0), 42, y, '#5ec8d8');
    const v = Math.round(spd*1000);
    drawText('VEL '+v, 154-textW('VEL '+v), y, v>90?'#f0a04b':'#f6efe0');
  }});
  mgCountdown();
  if(m.ph==='end') drawMgEnd();
}
function drawJumpObs(ox, gy, o){
  const oh = Math.round(o.h);
  if(o.bad){
    /* roca redondeada */
    const w = o.w||10;
    px(ox-w/2+1, gy-oh, w-2, oh, '#7a7a88');
    px(ox-w/2, gy-oh+2, w, oh-2, '#7a7a88');
    px(ox-w/2+1, gy-oh, w-2, 1, K); px(ox-w/2, gy-oh+1, 1, oh-1, K); px(ox+w/2-1, gy-oh+1, 1, oh-1, K);
    px(ox-w/2+2, gy-oh+1, 3, 2, '#b0b0bc'); px(ox+1, gy-3, 3, 2, '#5a5a68');
  } else {
    /* valla de madera */
    px(ox-4, gy-oh, 2, oh, '#8a6a3a'); px(ox+2, gy-oh, 2, oh, '#8a6a3a');
    px(ox-5, gy-oh+1, 10, 2, '#b08850'); px(ox-5, gy-oh+Math.round(oh*0.55), 10, 2, '#b08850');
    px(ox-5, gy-oh+1, 10, 1, '#d0a870');
    px(ox-4, gy-oh-1, 2, 1, K); px(ox+2, gy-oh-1, 2, 1, K);
    px(ox-5, gy-oh+3, 10, 1, '#5a4632');
  }
}

/* =========================================================
   TOPO
   ========================================================= */
function topoBG(){
  return mgBake('topo', 160, 108, (g, f)=>{
    /* parcela de tierra con borde de tablas */
    mgGrad(f, 0, 108, '#7a5a3a', '#6a4a2e', 20, 120);
    for(let i=0;i<40;i++) f(22+(i*37)%116, 2+(i*23)%104, i%3?1:2, 1, i%2 ? '#8a6a4a' : '#5a3e26');
    f(18, 0, 124, 2, '#a07a50'); f(18, 106, 124, 2, '#5a4030');
    f(18, 0, 2, 108, '#a07a50'); f(140, 0, 2, 108, '#5a4030');
    f(17, 0, 1, 108, K); f(142, 0, 1, 108, K); f(18, 108, 124, 1, K);
  });
}
function drawTopo(t, dt){
  const m = UI.mg;
  topoStep(mgFrame(dt));
  const now = performance.now();
  drawScene(t);
  ctx.drawImage(topoBG(), 0, 88);
  /* el bitxo animando desde el borde de arriba */
  drawMgPet(80, 88, {z:2, gy:88});
  for(let i=0;i<9;i++) drawTopoHole(i, m, t, now);
  /* mazo */
  if(m.mallet){
    const a = now - m.mallet.at;
    if(a<170){
      const x = Math.round(m.mallet.x), y = Math.round(m.mallet.y);
      if(a<60){
        px(x+6, y-14, 2, 12, '#8a6a3a'); mgBox(x+1, y-20, 12, 7, '#c8844a'); px(x+2, y-19, 10, 1, '#e8a86a');
      } else {
        px(x+4, y-6, 12, 2, '#8a6a3a'); mgBox(x-6, y-10, 11, 8, '#c8844a'); px(x-5, y-9, 9, 1, '#e8a86a');
        if(a<100){ mgSpark(x-9, y-12, '#ffffff'); mgSpark(x+6, y-13, '#ffffff'); }
      }
    }
  }
  mgTopBar('TOPO');
  mgBottom({mult:true, hint:'TOCA · TECLADO NUMERICO', extra:(y)=>{
    drawText('RATUCO +1', 6, y, '#f6efe0');
    drawText('ORO +3', 58, y, '#ffd94a');
    drawText('AZUL -2', 154-textW('AZUL -2'), y, '#6db1ff');
  }});
  mgCountdown();
  if(m.ph==='end') drawMgEnd();
}
function drawTopoHole(i, m, t, now){
  const P = TOPO_POS[i], h = m.holes[i];
  const x = P.x, y = P.y;
  /* agujero (detrás) */
  px(x-14, y+1, 28, 7, '#2a1c14'); px(x-12, y, 24, 1, '#2a1c14'); px(x-12, y+8, 24, 1, '#2a1c14');
  px(x-11, y+2, 22, 3, '#1a100c');
  /* bicho asomando */
  let kind = h.up, off = 0, sqx = 1, sqy = 1;
  if(kind){
    const k = h.popT===undefined ? 1 : ease.outBack(clamp01((m.t-h.popT)/160));
    off = Math.round((1-k)*26);
    /* aviso: parpadea antes de esconderse */
  } else if(h.bonk){
    kind = h.bonk.k;
    const a = now - h.bonk.at;
    sqx = a<120 ? 1.35 : 1.1; sqy = a<120 ? 0.55 : 0.8;
    off = a<160 ? 0 : Math.round((a-160)/260*26);
  } else if(h.down){
    kind = h.down.k;
    off = Math.round(clamp01((m.t-h.down.t)/220)*26);
  }
  if(kind){
    const spr = kind==='friend' ? SPR.marea_babyA[0] : (kind==='gold' ? mgTint(ESPR.ratuco, '#ffd94a', 0.55, 'ratG') : ESPR.ratuco);
    ctx.save();
    ctx.beginPath(); ctx.rect(x-18, y-44, 36, 50); ctx.clip();
    ctx.translate(x, y+6+off);
    ctx.scale(2*sqx, 2*sqy);
    ctx.drawImage(spr, -Math.round(spr.width/2), -spr.height);
    ctx.restore();
    if(h.up==='gold' && Math.floor(t/150)%2===0) mgSpark(x+12, y-18+off, '#fff8d0', true);
    if(h.up==='friend' && Math.floor(t/300)%2===0) drawText('♥', x+10, y-24+off, '#f2a2b8');
    if(h.bonk && h.bonk.k!=='friend'){ for(let j=0;j<3;j++){ const an = now/120 + j*2.1; mgSpark(x+Math.cos(an)*9, y-12+Math.sin(an)*2, '#ffd94a'); } }
    if(h.down && h.down.laugh && m.t-h.down.t<200) drawText('JE', x+8, y-14, '#f6efe0');
  }
  /* borde delantero de tierra (tapa al bicho) */
  px(x-15, y+6, 30, 4, '#a07a50'); px(x-13, y+10, 26, 2, '#8a6a4a'); px(x-16, y+7, 1, 3, '#8a6a4a'); px(x+15, y+7, 1, 3, '#8a6a4a');
  px(x-13, y+6, 26, 1, '#c09a6a'); px(x-9, y+7, 2, 1, '#d8b080'); px(x+6, y+8, 2, 1, '#6a4a2e'); px(x-2, y+8, 1, 1, '#d8b080');
  px(x-13, y+12, 26, 1, 'rgba(26,20,40,0.35)');
}

/* =========================================================
   PESCA
   ========================================================= */
function pescaBG(){
  const ph = dayPhase(), S = SKY[ph];
  return mgBake('pesca_'+ph, 160, 180, (g, f)=>{
    mgGradN(f, 0, 50, [S.bands[0], S.bands[1], S.bands[2]]);
    /* montañas lejanas */
    for(let x=0;x<160;x++){
      const h = Math.round(10 + Math.sin(x/17)*5 + Math.sin(x/7+1)*2);
      f(x, 50-h, 1, h, ph==='night' ? '#1a2a50' : '#6a8ab8');
      const h2 = Math.round(6 + Math.sin(x/11+2)*3 + Math.sin(x/4)*1);
      f(x, 56-h2, 1, h2, S.hill2);
    }
    /* arboleda */
    for(let x=0;x<160;x+=2){ const h = 3 + ((x*7)%5); f(x, 56-h, 2, h, S.hill); }
    /* agua con profundidad */
    const wt = ph==='night' ? ['#1a3a6a','#142c58','#0e1e40'] : (ph==='dusk' ? ['#5a5a9a','#34407a','#1c2a58'] : ['#5aa0e0','#3a70b8','#1c3a78']);
    mgGradN(f, 56, 180, wt);
    f(0, 56, 160, 1, ph==='night' ? '#3a5a8a' : '#a8d8f8');
    /* embarcadero */
    f(0, 64, 44, 4, '#8a6a3a'); f(0, 64, 44, 1, '#b08850'); f(0, 67, 44, 1, '#5a4030');
    for(let x=0;x<44;x+=7) f(x, 64, 1, 4, '#6a4a2e');
    f(6, 68, 3, 18, '#5a4030'); f(34, 68, 3, 18, '#5a4030');
    f(6, 86, 3, 1, 'rgba(255,255,255,0.3)'); f(34, 86, 3, 1, 'rgba(255,255,255,0.3)');
    /* nenúfares */
    f(128, 150, 10, 3, '#3a7048'); f(130, 149, 6, 1, '#57a05e'); f(18, 166, 8, 3, '#3a7048');
  });
}
function drawPesca(t, dt){
  const m = UI.mg;
  const g = mgFrame(dt);
  if(!m.intro) pescaStep(g);
  const now = performance.now();
  const ph = dayPhase();
  ctx.drawImage(pescaBG(), 0, 16);
  /* reflejos y oleaje animado */
  for(let i=0;i<14;i++){
    const y = 76 + i*8 + (i%2);
    const x = Math.round(((i*47 + t*(0.006+i*0.0008)) % 190)) - 15;
    const a = 0.12 + (14-i)*0.012;
    px(x, y, 6+(i%3)*2, 1, 'rgba(220,240,255,'+a.toFixed(2)+')');
  }
  if(ph!=='night'){
    for(let i=0;i<8;i++){
      const y = 76 + i*6, w = 8 - i + Math.round(Math.sin(t/300+i)*2);
      if((Math.floor(t/200)+i)%3) px(128-w/2, y, w, 1, 'rgba(255,248,208,0.35)');
    }
  }
  /* peces bajo el agua (siluetas) */
  for(let i=0;i<3;i++){
    const dir = i%2 ? -1 : 1;
    const x = Math.round((((t*0.012*(1+i*0.3))*dir + i*70) % 200 + 200) % 200) - 20;
    const y = 140 + i*14 + Math.round(Math.sin(t/700+i)*2);
    px(x-4, y, 9, 3, 'rgba(10,20,50,0.35)'); px(x+(dir>0?-6:5), y-1+Math.floor(t/200+i)%2, 2, 5, 'rgba(10,20,50,0.35)');
  }
  /* bitxo en el embarcadero */
  const reel = m.ph==='reel';
  const tens = reel ? (m.tension-50)/50 : 0;
  const tugging = reel && now - (m.reelAt||0) < 120;
  drawMgPet(20, 80, {z:2, gy:80, sx:tugging?1.06:1, sy:tugging?0.94:1});
  /* cubo con lo pescado */
  px(38, 73, 9, 7, '#6a7a88'); px(37, 73, 11, 1, K); px(38, 79, 9, 1, K); px(39, 74, 7, 1, '#9aaab8');
  px(37, 74, 1, 5, K); px(47, 74, 1, 5, K);
  if(m.caught.length) px(39, 72, 7, 1, m.caught[m.caught.length-1].col);
  /* caña que se dobla con la tensión */
  const tipX = 64, tipY = 38 + Math.round(reel ? 6 + tens*6 + Math.sin(t/60)*1.5 : Math.sin(t/800));
  const bx0 = 32, by0 = 68;
  for(let i=0;i<=16;i++){
    const k = i/16;
    const x = bx0 + (tipX-bx0)*k;
    const y = by0 + (tipY-by0)*k + Math.sin(k*Math.PI)*(reel ? 4+tens*3 : 2);
    px(x, y, k<0.5?2:1, 1, k<0.3 ? '#6a4a2e' : '#8a6a3a');
  }
  px(bx0-1, by0, 3, 3, '#4a3020');
  /* flotador / pez peleando */
  const B = PESCA_BOB;
  const biting = m.ph==='wait' && m.t>m.biteAt && m.t<m.biteAt+PESCA_BITE;
  const hooked = now - (m.hookAt||0);
  let fx2 = B.x, fy = B.y + Math.round(Math.sin(t/500)*1.5);
  if(biting) fy += 3 + Math.round(Math.sin(t/40));
  if(reel){ fx2 = B.x + Math.round(Math.sin(t/140)*6*(0.6+m.fish.pull*10)); fy = B.y + 4 + Math.round(Math.sin(t/90)*2); }
  /* sedal (roto si acaba de partirse) */
  const snapped = now - (m.snapAt||0) < 500;
  const lineEnd = snapped ? 0.45 : 1;
  const sag = reel ? 2 : 10;
  for(let i=0;i<=24*lineEnd;i++){
    const k = i/24;
    const lx = tipX + (fx2-tipX)*k;
    const ly = tipY + (fy-3-tipY)*k + Math.sin(k*Math.PI)*sag + (snapped ? k*k*30 : 0);
    px(lx, ly, 1, 1, reel ? 'rgba(255,255,255,0.8)' : 'rgba(240,240,255,0.55)');
  }
  /* ondas del flotador */
  const rp = (t % 1600)/1600;
  if(!reel){
    const r = 3 + rp*10;
    ctx.globalAlpha = 0.5*(1-rp);
    for(let j=0;j<16;j++){ const an = j/16*Math.PI*2; px(fx2+Math.cos(an)*r, fy+2+Math.sin(an)*r*0.3, 1, 1, '#ffffff'); }
    ctx.globalAlpha = 1;
  }
  if(m.ph==='wait' && !snapped){
    px(fx2-2, fy-5, 4, 3, '#e2574c'); px(fx2-2, fy-2, 4, 2, '#f6efe0'); px(fx2, fy-7, 1, 2, '#f6efe0');
    px(fx2-3, fy-5, 1, 5, K); px(fx2+2, fy-5, 1, 5, K);
    if(biting){
      const bl = Math.floor(t/90)%2;
      drawTextOC('!', fx2, fy-20, bl ? '#ffd94a' : '#ffffff', 2);
      px(fx2-8, fy+1, 4, 1, 'rgba(255,255,255,0.7)'); px(fx2+5, fy+1, 4, 1, 'rgba(255,255,255,0.7)');
    }
  } else if(reel){
    const f = m.fish;
    const spr = f.id==='chico' ? SPR.pescado : mgTint(SPR.pescado, f.col, 0.6, 'fish');
    ctx.save();
    ctx.translate(fx2, fy);
    ctx.scale(Math.sin(t/140)>0 ? 1 : -1, 1);
    ctx.drawImage(spr, -Math.round(spr.width/2), -3);
    ctx.restore();
    if(Math.floor(t/100)%2){ px(fx2-9, fy-1, 3, 1, '#ffffff'); px(fx2+7, fy-2, 2, 1, '#ffffff'); px(fx2-6, fy-4, 1, 1, '#ffffff'); }
    /* medidor de tensión */
    const GX = 146, GY = 60, GH = 110;
    mgBox(GX-2, GY-2, 13, GH+4, '#0e1030', K);
    const redH = Math.round(GH*0.12);
    for(let y=0;y<redH;y++) for(let x=0;x<9;x++) if((x+y)%2===0){ px(GX+x, GY+y, 1, 1, '#a03030'); px(GX+x, GY+GH-1-y, 1, 1, '#a03030'); }
    px(GX, GY+redH, 9, GH-redH*2, '#16304a');
    const danger = m.tension>88 || m.tension<14;
    const th = Math.round(GH*m.tension/100);
    px(GX+2, GY+GH-th, 5, th, danger ? (Math.floor(t/80)%2?'#e2574c':'#ffd94a') : '#7ac74f');
    const my = GY + GH - th;
    px(GX-5, my-1, 4, 3, '#ffffff'); px(GX-6, my, 1, 1, '#ffffff');
    drawText('TENSION', 154-textW('TENSION'), 50, '#ffffff');
    if(danger){ const s = m.tension>88 ? '¡AFLOJA!' : '¡TIRA!'; if(Math.floor(t/150)%2) drawTextOC(s, 118, my-2, '#e2574c', 1); }
    /* barra de captura */
    const hold = Math.min(1, m.holdT/PESCA_HOLD);
    mgBox(40, 132, 82, 7, '#0e1030', K);
    px(41, 133, Math.round(80*hold), 5, f.col);
    px(41, 133, Math.round(80*hold), 1, 'rgba(255,255,255,0.5)');
    ctx.drawImage(SPR.pescado, 36+Math.round(80*hold), 130);
    drawTextC('¡'+f.name+'!', 80, 142, f.col==='#2a4a8a' ? '#9adcf0' : f.col);
  }
  /* pez que vuela al cubo */
  if(m.flyFish){
    const k = clamp01(m.flyFish.t/700);
    const x = B.x + (42-B.x)*k, y = B.y + (70-B.y)*k - Math.sin(k*Math.PI)*50;
    const f = m.flyFish.f;
    const spr = f.id==='chico' ? SPR.pescado : mgTint(SPR.pescado, f.col, 0.6, 'fish');
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(-2, 2); ctx.drawImage(spr, -Math.round(spr.width/2), -3); ctx.restore();
    if(Math.floor(t/60)%2) mgSpark(x+6, y-6, '#ffffff');
  }
  const hint = reel ? 'TOCA RAPIDO: VERDE' : (biting ? '¡TOCA YA!' : 'ESPERA LA PICADA');
  mgTopBar('PESCA');
  mgBottom({comboLabel:'SERIE', hint:hint+' · ESPACIO', extra:(y)=>{
    if(!m.caught.length){ drawText('CUBO VACIO', 6, y, '#5a6090'); return; }
    for(let i=0;i<Math.min(13, m.caught.length);i++){
      const f = m.caught[i];
      const spr = f.id==='chico' ? SPR.pescado : mgTint(SPR.pescado, f.col, 0.6, 'fish');
      ctx.drawImage(spr, 6+i*11, y-1);
    }
  }});
  mgCountdown();
  if(m.ph==='end') drawMgEnd();
}

/* =========================================================
   MEMORIA
   ========================================================= */
function memoBG(){
  return mgBake('memo', 160, 180, (g, f)=>{
    /* despensa: pared con estante y mesa de madera */
    mgGrad(f, 0, 44, '#3a2448', '#2a1a38');
    f(0, 30, 160, 3, '#6a4a2e'); f(0, 30, 160, 1, '#8a6a4a'); f(0, 33, 160, 1, K);
    const jars = [[8,'#e2574c'],[20,'#ffd94a'],[128,'#7ac74f'],[142,'#f2a2b8']];
    for(const [x,c] of jars){ f(x, 20, 8, 10, 'rgba(200,220,255,0.35)'); f(x+1, 23, 6, 7, c); f(x, 18, 8, 2, '#8a6a3a'); f(x, 20, 1, 10, K); f(x+7, 20, 1, 10, K); }
    for(let y=44;y<180;y++){
      const plank = Math.floor((y-44)/12);
      const base = plank%2 ? '#7a4e32' : '#8a5a3a';
      f(0, y, 160, 1, base);
      if((y-44)%12===0) f(0, y, 160, 1, '#5a3822');
      if((y-44)%12===1) f(0, y, 160, 1, '#9a6a48');
    }
    for(let i=0;i<30;i++) f((i*41)%160, 46+(i*29)%130, 4+(i%3)*2, 1, '#6a4228');
    f(0, 44, 160, 2, '#5a3822'); f(0, 44, 160, 1, K);
  });
}
function drawMemoCard(i, m, now){
  const P = MEMO_POS[i], c = m.cards[i];
  const faceTarget = m.intro ? true : (c.flip || c.done);
  const fk = clamp01((now - (c.flipAt||0))/170);
  const inAnim = c.flipAt && fk<1 && now>=c.flipAt;
  let face = faceTarget, wk = 1;
  if(inAnim){ wk = Math.abs(Math.cos(fk*Math.PI)); face = fk<0.5 ? !faceTarget : faceTarget; }
  else if(c.flipAt && now<c.flipAt){ face = !faceTarget; }
  let dx = 0;
  if(now - (c.badAt||0) < 400) dx = Math.round(springOff(c.badAt, 3, now));
  let pop = 1;
  if(c.done && now - c.doneAt < 400){ pop = springSquash(c.doneAt, 0.15, now)[0]; }
  const w = Math.max(2, Math.round(30*wk*pop)), h = Math.round(38*pop);
  const x = P.x + Math.round((30-w)/2) + dx, y = P.y + Math.round((38-h)/2);
  px(x+1, y+h, w, 2, 'rgba(26,20,40,0.35)');
  if(face){
    const sel = c.flip && !c.done;
    const bad = now - (c.badAt||0) < 350;
    mgBox(x, y, w, h, c.done ? '#dff0d0' : '#f6efe0', bad ? '#e2574c' : (c.done ? '#3a7048' : (sel ? '#c8a040' : K)));
    if(w>8){
      px(x+2, y+2, w-4, 1, '#ffffff');
      const spr = SPR[c.k];
      const sw = Math.max(1, Math.round(spr.width*wk));
      ctx.drawImage(spr, x+Math.round((w-sw)/2), y+Math.round((h-spr.height)/2), sw, spr.height);
      if(c.done){ px(x+w-7, y+3, 1, 2, '#3a7048'); px(x+w-6, y+5, 1, 1, '#3a7048'); px(x+w-5, y+2, 1, 3, '#3a7048'); px(x+w-4, y+1, 1, 1, '#3a7048'); }
    }
  } else {
    mgBox(x, y, w, h, '#8a6ae8', K);
    if(w>8){
      px(x+2, y+2, w-4, 1, '#a88af8');
      /* rombos tramados del dorso */
      for(let yy=4;yy<h-4;yy+=2) for(let xx=3;xx<w-3;xx+=2) if(((xx>>1)+(yy>>1))%3===0) px(x+xx, y+yy, 1, 1, '#7a5ad8');
      mgBox(x+Math.round(w/2)-6, y+13, 12, 12, '#6a4ac8', '#4a2a98');
      drawTextC('?', x+w/2, y+17, '#f6efe0');
    }
  }
}
function drawMemo(t, dt){
  const m = UI.mg;
  const g = mgFrame(dt);
  if(!m.intro && m.ph==='play'){
    m.t += g;
    memoStep();
    if(m.ph==='play' && m.t>=m.end){ m.endWhy='¡TIEMPO!'; memoFinish(); }
  }
  const now = performance.now();
  ctx.drawImage(memoBG(), 0, 16);
  /* el bitxo asoma tras la mesa */
  drawMgPet(80, 62, {z:2, shadow:false});
  px(0, 60, 160, 2, '#5a3822'); px(0, 60, 160, 1, K);
  for(let i=0;i<12;i++) drawMemoCard(i, m, now);
  mgTopBar('MEMORIA');
  mgBottom({label:'PAREJAS', score:m.score, recordScore:memoPoints(), comboLabel:'RACHA', hint:m.intro ? '¡MEMORIZA!' : 'TOCA DOS CARTAS', extra:(y)=>{
    drawText('INTENTOS '+m.tries, 6, y, m.tries<=10 ? '#f6efe0' : '#f0a04b');
    const p = m.tries<=10 ? 'PERFECTO: <=10' : 'SIN PERFECTO';
    drawText(p, 154-textW(p), y, m.tries<=10 ? '#7ac74f' : '#5a6090');
  }});
  mgCountdown();
  if(m.ph==='end') drawMgEnd();
}

/* =========================================================
   GLOBO
   ========================================================= */
function drawGlobo(t, dt){
  const m = UI.mg;
  const g = mgFrame(dt);
  if(!m.intro) globoStep(g);
  const now = performance.now();
  drawScene(t);
  /* viento visible: hojas y rayas */
  const wd = Math.sign(m.wind||0.00001), ws = Math.min(1, Math.abs(m.wind||0)/0.00009);
  for(let i=0;i<6;i++){
    const sp = (0.02 + ws*0.05)*wd;
    const x = Math.round((((i*47) + t*sp) % 180 + 180) % 180) - 10;
    const y = 30 + i*22 + Math.round(Math.sin(t/300+i)*3);
    if(ws>0.25) px(x, y, 6+Math.round(ws*6), 1, 'rgba(255,255,255,0.35)');
    px(x+(wd>0?8:-2), y-1, 2, 1, i%2 ? '#7ac74f' : '#f0a04b');
  }
  /* zarzas con pinchos: el suelo que revienta globos */
  const low = m.y>120 && m.ph==='play';
  for(let x=0;x<160;x+=6){
    const h = 5 + (x*7)%4;
    px(x, 186-h, 5, h+10, '#2e5c3a');
    px(x+2, 184-h, 1, 2, '#e8e0c8'); px(x, 188-h, 1, 1, '#e8e0c8'); px(x+4, 187-h, 1, 1, '#e8e0c8');
    if(x%18===0) px(x+1, 188-h, 2, 2, '#e2574c');
  }
  if(low && Math.floor(t/150)%2){ ctx.fillStyle = 'rgba(226,87,76,0.18)'; ctx.fillRect(0, 170, 160, 26); }
  /* el bitxo sigue al globo por debajo, preocupado si baja */
  m.petX = m.petX===undefined ? 80 : m.petX + (m.x - m.petX)*Math.min(1, dt*0.004);
  const worried = m.y>130 && m.ph==='play';
  drawMgPet(m.petX, 195, {gy:195, flip:m.x<m.petX, sy:worried?0.94:1, closed:false});
  if(worried && Math.floor(t/200)%2) drawText('!', Math.round(m.petX)+6, 166, '#e2574c');
  /* el globo: gordito, sombreado, nudo y cordel al viento */
  const alive = m.ph==='play' || m.ph==='end' && m.lives>0;
  const spawnK = clamp01((m.t - m.spawnT)/450);
  if(alive){
    const gx = Math.round(m.x), gy = Math.round(m.y);
    const sq = now-m.hitT<140;
    const s = spawnK<1 ? ease.outBack(spawnK) : 1;
    ctx.save();
    ctx.translate(gx, gy);
    if(s!==1) ctx.scale(s, s);
    const blocks = sq
      ? [[-8,-9,16,2],[-11,-7,22,4],[-13,-3,26,6],[-11,3,22,3],[-8,6,16,2]]
      : [[-6,-12,12,2],[-9,-10,18,3],[-11,-7,22,4],[-12,-3,24,6],[-11,3,22,3],[-9,6,18,3],[-6,9,12,2],[-3,11,6,2]];
    for(const b of blocks) px(b[0]-1, b[1], b[2]+2, b[3], K);
    for(const b of blocks) px(b[0], b[1]+ (b===blocks[0]?1:0), b[2], b[3]-(b===blocks[0]?1:0), '#f78fb3');
    for(const b of blocks) px(b[0]+Math.round(b[2]*0.62), b[1]+1, Math.round(b[2]*0.38), Math.max(1,b[3]-1), '#e070a0');
    px(-7, -8, 4, 4, '#ffd3e2'); px(-8, -6, 2, 3, '#ffd3e2'); px(-6, -9, 2, 1, '#ffffff');
    px(-2, sq?8:13, 4, 2, '#d8578a');
    ctx.restore();
    for(let i=0;i<8;i++) px(gx+Math.round(Math.sin(t/260+i*0.8)*2 - (m.vx||0)*i*8), gy+(sq?10:15)+i*2, 1, 1, 'rgba(246,239,224,0.8)');
    /* sombra en el suelo: indica dónde caerá */
    const hk = clamp01((m.y-30)/140);
    const sw = 4 + Math.round(hk*10);
    px(gx-sw/2, 182, sw, 1, 'rgba(0,0,0,'+(0.1+hk*0.25).toFixed(2)+')');
  }
  mgTopBar('GLOBO');
  mgBottom({hint:'TOCA EL GLOBO · ABAJO VALE +2', extra:(y)=>{
    for(let i=0;i<3;i++){
      const on = i<m.lives;
      const lost = !on && i===m.lives && now-(m.popAt||0)<500;
      drawTextO('♥', 6+i*12, y-(lost?2:0), on ? '#e2574c' : (lost ? '#ffffff' : '#3a3458'), 1);
    }
    const arrows = ws<0.3 ? 'CALMA' : (wd>0 ? 'VIENTO >' + (ws>0.7?'>':'') : (ws>0.7?'<':'') + '< VIENTO');
    drawText(arrows, 154-textW(arrows), y, ws>0.7 ? '#f0a04b' : '#9aa0d0');
  }});
  mgCountdown();
  if(m.ph==='end') drawMgEnd();
}
