"use strict";
/* =========================================================
   BITXO — render/gym: el GYM del parque (estaciones, reps y aguja)
   ========================================================= */
const PARK_STATIONS = [
  {kind:'str', x:35,  label:'PESAS',   stat:'FUE', col:'#e2574c', dk:'#a03030'},
  {kind:'def', x:80,  label:'MURO',    stat:'DEF', col:'#c8883e', dk:'#7a5020'},
  {kind:'spd', x:125, label:'CARRERA', stat:'VEL', col:'#3fa8c0', dk:'#1f6a80'}
];
const GYM_ST = {}; for(const s of PARK_STATIONS) GYM_ST[s.kind] = s;
/* aguja grande de la franja inferior */
const GYM_GAUGE = {x:12, y:214, w:136, h:10};
const GYM_CARD = {y:238, w:48, h:32, xs:{str:4, def:56, spd:108}};
const GYM_REP_MS = 420;

/* altura de la cabeza del bitxo (para textos y chispas) */
function gymHeadY(){
  const pk = UI.park; if(!pk) return 140;
  const spr = currentSprite();
  return Math.round((pk.gy||176) - (pk.lift||0) - spr.height);
}

/* iconitos 7x5 de cada estación */
function gymIcon(kind, x, y, col){
  if(kind==='str'){ px(x,y,2,5,col); px(x+5,y,2,5,col); px(x+2,y+2,3,1,col); }
  else if(kind==='def'){ px(x+3,y,1,1,col); px(x+2,y+1,3,1,col); px(x+1,y+2,5,1,col); px(x,y+3,7,2,col); }
  else { px(x+4,y,3,1,col); px(x+3,y+1,3,1,col); px(x+1,y+2,5,1,col); px(x+2,y+3,3,1,col); px(x+1,y+4,2,1,col); }
}
function gymBox(x, y, w, h, fill, line){
  px(x, y, w, h, fill);
  px(x, y, w, 1, line||K); px(x, y+h-1, w, 1, line||K);
  px(x, y, 1, h, line||K); px(x+w-1, y, 1, h, line||K);
}

function drawPark(t, dt){
  const pk = UI.park || (UI.park = {phase:'idle', px:80, t:0});
  const p = AP();
  const ph = dayPhase(), S = SKY[ph];
  const now = performance.now();

  /* ---------- fondo: cielo, colinas, banderines, valla, césped ---------- */
  px(0,0,160,56,S.bands[0]);
  px(0,56,160,26,S.bands[1]);
  px(0,82,160,22,S.bands[2]);
  for(let x=0;x<160;x+=2){
    const hy = Math.round(88 + Math.sin(x/19)*4 + Math.sin(x/7+1)*1.5);
    px(x, hy, 2, 104-hy, S.hill2);
  }
  for(let x=0;x<160;x+=2){
    const hy = Math.round(94 + Math.sin(x/27+2)*3);
    px(x, hy, 2, 104-hy, S.hill);
  }
  /* nubes lentas */
  for(let i=0;i<3;i++){
    const cx = Math.round(((t/(90+i*40) + i*70) % 200) - 20), cy = 40+i*14;
    px(cx, cy, 16-i*3, 3, 'rgba(255,255,255,0.8)'); px(cx+3, cy-2, 8-i*2, 2, 'rgba(255,255,255,0.8)');
  }
  /* banderines de fiesta que ondean */
  const BF = ['#e2574c','#ffd94a','#5ec8d8','#7ac74f','#f2a2b8'];
  for(let i=0;i<14;i++){
    const fx0 = 4+i*11, sag = Math.round(Math.sin(i/13*Math.PI)*6);
    const sw = Math.round(Math.sin(t/400+i)*1);
    px(fx0, 26+sag, 11, 1, 'rgba(26,20,40,0.5)');
    px(fx0+3+sw, 27+sag, 5, 2, BF[i%5]); px(fx0+4+sw, 29+sag, 3, 1, BF[i%5]); px(fx0+5+sw, 30+sag, 1, 1, BF[i%5]);
  }
  for(let x=4;x<160;x+=18){ px(x,88,3,16,'#8a6a3a'); px(x,88,3,1,K); }
  px(0,92,160,2,'#a4834e'); px(0,98,160,2,'#a4834e');
  px(0,104,160,94,S.grass);
  for(let x=0;x<160;x+=6) px(x,104,3,2,S.grass2);
  for(let i=0;i<9;i++) px((i*37+11)%156, 126+(i*23)%16, 2, 1, S.grass2);
  /* pista de tierra */
  px(0,172,160,20,'#c2a26a');
  px(0,172,160,1,'#8a6a3a'); px(0,191,160,1,'#8a6a3a');
  for(let i=0;i<12;i++) px((i*29+7)%158, 176+(i*7)%13, 2, 1, '#a88a58');
  px(0,192,160,5,S.grass2);

  /* ---------- lógica de la sesión ---------- */
  let spr = currentSprite();
  const w = spr.width, h = spr.height;
  let bx = pk.px, lift=0, sx=1, sy=1, dir=1, arc=0, effort=false, pr=0, gy=176, jx=0;
  if(pk.phase==='walk'){
    const d = pk.tx - pk.px;
    pk.px += Math.sign(d)*Math.min(Math.abs(d), dt*0.075);
    dir = Math.sign(d)||1;
    const phw = Math.abs(Math.sin(t/110));
    lift = phw*3; sy = 1+phw*0.06; sx = 1-phw*0.04;
    if(dt>0 && Math.floor(t/220)!==Math.floor((t-dt)/220)) dustFx(pk.px, 176, 2);
    if(Math.abs(pk.tx-pk.px)<2){
      pk.px = pk.tx;
      pk.phase='train'; pk.t=0; pk.rep=0; pk.perfects=0; pk.repAnim=0; pk.autoAt=1800; pk.reps=[];
      pk.startAt = now;
      popText(pk.px, 112, '¡3 REPS!', '#ffffff', {life:700});
      if(pk.kind==='spd') dustFx(pk.px, 170, 5);
      SFX.gymGood();
    }
    bx = pk.px;
  } else if(pk.phase==='train'){
    pk.t += dt;
    pk.rep = pk.rep||0; pk.perfects = pk.perfects||0; pk.repAnim = pk.repAnim||0;
    pk.reps = pk.reps||[];
    if(pk.autoAt===undefined) pk.autoAt = pk.t + 1800;
    /* si no tocas, la rep sale sola (sin clavar) */
    if(pk.repAnim<=0 && pk.rep<3 && pk.t>pk.autoAt){
      pk.lastPerfect = false; pk.lastGrade = 'a'; pk.lastG = undefined; pk.reps[pk.rep] = 'a'; pk.repAnim = GYM_REP_MS;
      popText(pk.px, gymHeadY()-6, 'TARDE...', '#9aa4c8', {life:760, vy:0.004});
      fx({x:pk.px+6, y:gymHeadY()+2, vx:0.01, vy:-0.02, g:0.0003, life:520, col:'#9adcf0', size:1, floor:176});
      SFX.gymMiss();
    }
    if(pk.repAnim>0){
      const prevPr = 1 - Math.max(0, pk.repAnim)/GYM_REP_MS;
      pk.repAnim -= dt;
      pr = 1 - Math.max(0, pk.repAnim)/GYM_REP_MS;
      const pow = pk.lastPerfect ? 1.15 : (pk.lastGrade==='b' ? 1 : 0.7);
      arc = Math.sin(pr*Math.PI) * pow;
      effort = arc>0.35;
      /* momento cumbre de la rep */
      if(prevPr<0.5 && pr>=0.5) gymPeak(pk, bx);
      if(pk.repAnim<=0){
        pk.rep++;
        pk.autoAt = pk.t + 1800;
        dustFx(bx, pk.kind==='spd' ? 170 : 176, 3);
        if(pk.rep>=3) gymFinish(pk, p, bx);
      }
    }
  } else {
    sy = 1 + Math.sin(t/420)*0.03; sx = 1 - Math.sin(t/420)*0.02;
    if(pk.res && pk.res.t<700){
      /* saltito de alegría al terminar */
      const k = pk.res.t/700;
      lift = Math.abs(Math.sin(k*Math.PI*2))*7*(1-k);
    }
  }

  /* pose por estación */
  if(pk.phase==='train'){
    if(pk.kind==='str'){
      /* anticipación: se aplasta y tiembla; luego empuja la barra arriba */
      const pow = pk.lastPerfect ? 1.15 : (pk.lastGrade==='b' ? 1 : 0.6);
      if(pk.repAnim>0 && pr<0.3){
        const a = pr/0.3;
        sy = 1-a*0.2; sx = 1+a*0.14; effort = true;
        jx = Math.sin(t/22)>0 ? 1 : 0;
      } else if(pk.repAnim>0){
        const a2 = Math.sin((pr-0.3)/0.7*Math.PI)*pow;
        lift = a2*9; sy = 1+a2*0.16; sx = 1-a2*0.1;
        arc = a2; effort = a2>0.3;
      } else {
        /* aguantando la barra: leve aplaste y temblor ocasional */
        sy = 0.94; sx = 1.05;
        if(Math.sin(t/700)>0.6) jx = Math.sin(t/30)>0 ? 1 : 0;
      }
      if(effort && dt>0 && Math.random()<dt*0.01) fx({x:bx+(Math.random()<0.5?-7:6), y:176-h*sy+3, vx:(Math.random()-0.5)*0.04, vy:-0.03, g:0.0003, life:520, col:'#9adcf0', floor:176});
    } else if(pk.kind==='def'){
      /* trepa por el muro: sube y se estira */
      lift = arc*(pk.lastPerfect ? 32 : 24);
      jx = Math.round(Math.sin(pr*Math.PI*2)*2);
      sy = 1+arc*0.08; sx = 1-arc*0.06;
      if(effort && dt>0 && Math.random()<dt*0.006) fx({x:bx-5+Math.random()*10, y:176-lift, vx:(Math.random()-0.5)*0.02, vy:0.01, g:0.0001, life:500, col:'rgba(246,239,224,0.9)'});
    } else {
      gy = 170;
      const fast = effort || pk.repAnim>0;
      const trot = Math.abs(Math.sin(pk.t/(fast?55:110)));
      lift = trot*(2+arc*3); sy = 1+trot*0.07; sx = 1-trot*0.04;
      if(dt>0 && Math.random()<dt*(fast?0.02:0.006)) fx({x:bx-8, y:169, vx:-0.03-Math.random()*0.02, vy:-0.012, g:0.00005, life:380, col:'rgba(194,162,106,0.9)', size:1});
      if(effort && dt>0 && Math.random()<dt*0.008) fx({x:bx+5, y:170-h+3, vx:-0.03, vy:-0.02, g:0.0003, life:420, col:'#9adcf0', floor:176});
    }
  }
  pk.gy = gy; pk.lift = lift;

  /* ---------- aparatos (detrás del bitxo) ---------- */
  /* carteles de las estaciones */
  for(const st of PARK_STATIONS){
    const active = pk.kind===st.kind && pk.phase!=='idle';
    const sgY = 106, sw = 15+textW(st.label), sx0 = Math.round(st.x-sw/2);
    px(st.x-1, sgY+9, 2, 5, '#5a4632');
    gymBox(sx0, sgY, sw, 10, active ? '#fff8d0' : '#f6efe0');
    gymIcon(st.kind, sx0+3, sgY+3, st.col);
    drawText(st.label, sx0+12, sgY+3, K);
    if(TRAIN_AFFINITY[p.line]===st.kind){
      const bob = Math.round(Math.sin(t/260)*1);
      gymBox(sx0+sw-6, sgY-6+bob, 11, 7, '#ffd94a');
      drawText('X2', sx0+sw-5, sgY-5+bob, K);
    }
  }
  /* PESAS: rack */
  px(19,136,3,40,'#3a3448'); px(49,136,3,40,'#3a3448');
  px(19,136,3,1,'#5a5468'); px(49,136,3,1,'#5a5468');
  px(17,146,6,2,'#8a8a94'); px(48,146,6,2,'#8a8a94');
  px(15,176,40,3,'#4a4456');
  /* MURO de escalada con campana arriba */
  px(64,122,2,54,'#5a4632'); px(94,122,2,54,'#5a4632');
  px(66,122,28,54,'#8a8a94');
  for(let r=0;r<9;r++){
    const o = r%2 ? 7 : 0;
    for(let c=-1;c<3;c++){
      const x0 = Math.max(66, 66+o+c*14), x1 = Math.min(94, 66+o+c*14+14);
      if(x1>x0) px(x0, 122+r*6, x1-x0, 6, (r+c)%2 ? '#9a9aa4' : '#8a8a94');
      if(66+o+c*14>66 && 66+o+c*14<94) px(66+o+c*14, 122+r*6, 1, 6, 'rgba(26,20,40,0.25)');
    }
  }
  for(let r=0;r<9;r++) px(66,122+r*6,28,1,'rgba(26,20,40,0.25)');
  const HOLDS = [[69,127,'#e2574c'],[86,131,'#ffd94a'],[74,137,'#5ec8d8'],[89,143,'#7ac74f'],[70,149,'#ffd94a'],[83,154,'#e2574c'],[76,161,'#5ec8d8'],[88,166,'#f2a2b8'],[68,169,'#7ac74f']];
  for(const hd of HOLDS){ px(hd[0], hd[1], 3, 2, hd[2]); px(hd[0], hd[1]+2, 3, 1, 'rgba(26,20,40,0.4)'); }
  px(63,121,34,2,'#8a6a3a');
  /* campana: suena al clavar arriba */
  const bellK = pk.bellAt ? clamp01((now-pk.bellAt)/700) : 1;
  const bsw = bellK<1 ? Math.round(Math.sin(bellK*Math.PI*6)*2*(1-bellK)) : 0;
  px(79,114,2,7,'#5a4632');
  px(76+bsw,114,8,5,'#ffd94a'); px(75+bsw,118,10,2,'#ffd94a'); px(77+bsw,114,2,3,'#fff8d0');
  px(79+bsw,120,2,1,K);
  if(bellK<0.6){ px(71,113,2,1,'#fff8d0'); px(87,113,2,1,'#fff8d0'); px(70,116,1,1,'#fff8d0'); px(89,116,1,1,'#fff8d0'); }
  px(62,176,36,3,'#4a4456');
  /* CINTA de correr */
  const running = pk.phase==='train' && pk.kind==='spd';
  px(146,140,3,32,'#8a8a94'); px(146,140,3,1,'#b8b8c4');
  gymBox(141,134,14,9,'#20243c');
  const vbars = running ? (effort?4:(pk.repAnim>0?3:2)) : 0;
  for(let i2=0;i2<4;i2++) px(143+i2*3, 140-i2, 2, 1+i2, i2<vbars ? (i2>2?'#ffd94a':'#7ac74f') : 'rgba(255,255,255,0.18)');
  px(108,148,40,2,'#b8b8c4'); px(108,148,2,24,'#8a8a94');
  px(104,170,50,6,'#3a3448'); px(104,176,50,1,K);
  px(106,168,44,3,'#5a5468'); px(106,168,44,1,'#7a7a8c');
  const beltOff = Math.floor(t/(running ? (effort?30:60) : 240))%8;
  for(let sx2=106+8-beltOff; sx2<148; sx2+=8) px(sx2,169,4,1,'#8a8a94');
  px(104,171,4,4,'#8a8a94'); px(150,171,4,4,'#8a8a94');

  /* ---------- el bitxo ---------- */
  bx = Math.round(bx);
  if(pk.phase==='train' && effort && p.stage>STAGES.EGG) spr = SPR[currentFormDef().spr][1];
  const shw = Math.max(4, Math.round((w-4)*(1-lift/60)));
  px(bx-(shw>>1), gy, shw, 2, 'rgba(0,0,0,0.3)');
  /* líneas de velocidad detrás del corredor */
  if(running){
    const n = effort ? 5 : 3;
    for(let i2=0;i2<n;i2++){
      const ly = gy-4-((i2*5+3)%(h));
      const off = Math.floor((t/(effort?20:40)+i2*13)%24);
      const ln = effort ? 10 : 6;
      px(bx-w/2-4-off-ln, ly, ln, 1, 'rgba(255,255,255,'+(effort?0.7:0.4)+')');
    }
  }
  ctx.save();
  ctx.translate(bx+jx, Math.round(gy-lift));
  ctx.scale(dir*sx, sy);
  ctx.drawImage(spr, -w/2, -h);
  ctx.restore();
  /* PESAS: la barra (delante del bitxo) */
  const plateW = 3 + Math.min(4, Math.floor((p.str||0)/6));
  const plateCol = (p.str||0)>=30 ? '#ffd94a' : (p.str||0)>=12 ? '#3fa8c0' : '#e2574c';
  if(pk.phase==='train' && pk.kind==='str'){
    const barY = Math.round(gy - lift - h*sy - 2 - arc*6);
    gymBarbell(bx+jx, barY, plateW, arc>0.9 && pk.lastPerfect, t, plateCol);
  } else {
    gymBarbell(35, 169, plateW, false, t, plateCol);
  }

  /* ---------- aguja pequeña sobre la cabeza ---------- */
  if(pk.phase==='train' && pk.rep<3 && pk.repAnim<=0){
    const gg = gymGauge(pk.t);
    const my = Math.max(20, gymHeadY()-(pk.kind==='str' ? 16 : 11));
    const mx = bx-13;
    gymBox(mx-1, my-1, 28, 5, '#3a3448');
    px(mx+Math.round(GYM_PERFECT*26), my, 26-Math.round(GYM_PERFECT*26), 3, Math.floor(t/150)%2 ? '#ffd94a' : '#fff3a0');
    const nx = mx + Math.round(gg*25);
    px(nx-1, my-3, 3, 9, K); px(nx, my-2, 1, 7, '#ffffff');
  }

  /* ---------- cabecera ---------- */
  px(0,0,160,15,'#20243c'); px(0,15,160,1,K);
  const backHot = false;
  gymBox(2,2,41,11, backHot ? '#ffd94a' : '#f6efe0');
  px(3,11,39,1,'#c8c0a8');
  drawText('< VOLVER', 6, 5, K);
  drawTextO('GYM', 60, 5, '#ffd94a', 1);
  drawText('DEL PRADO', 74, 5, '#f6efe0');
  const ms = '✦'+fmt(G.motas);
  drawText(ms, 157-textW(ms), 5, '#ffd94a');

  /* ---------- franja inferior de información ---------- */
  gymStrip(pk, p, t, dt, now);

  drawParticles(dt);
}

/* barra de pesas: discos crecen con tu FUE */
function gymBarbell(cx, y, pw, gleam, t, pc){
  pc = pc || '#e2574c';
  px(cx-17, y, 34, 2, '#8a8a94'); px(cx-17, y, 34, 1, '#b8b8c4');
  for(const sd of [-1,1]){
    const x0 = sd<0 ? cx-17-pw+3 : cx+14;
    px(x0, y-4, pw, 10, pc); px(x0+1, y-3, 1, 8, 'rgba(255,255,255,0.35)');
    px(x0, y-4, 1, 10, K); px(x0+pw-1, y-4, 1, 10, K); px(x0, y+5, pw, 1, K);
  }
  if(gleam){
    const gx = cx-17-pw, gx2 = cx+17+pw;
    px(gx-2, y-6, 1, 3, '#fff8d0'); px(gx-3, y-5, 3, 1, '#fff8d0');
    px(gx2+1, y-6, 1, 3, '#fff8d0'); px(gx2, y-5, 3, 1, '#fff8d0');
  }
}

/* momento cumbre de cada rep: el aparato responde */
function gymPeak(pk, bx){
  const hy = gymHeadY();
  if(pk.kind==='def'){
    if(pk.lastPerfect){ pk.bellAt = performance.now(); tone({f:1568, d:0.35, type:'p125', vol:0.035, send:0.5}); tone({f:2093, at:sfxAt(0.02), d:0.3, type:'p125', vol:0.02, send:0.5}); }
    for(let i=0;i<4;i++) fx({x:bx-4+i*3, y:hy+6, vx:(i-1.5)*0.02, vy:0.02, g:0.0002, life:420, col:'rgba(246,239,224,0.9)'});
  } else if(pk.kind==='str'){
    if(pk.lastPerfect) burst(bx, hy-18, {n:8, cols:['#fff8d0','#ffd94a'], speed:0.07, g:0.0001, life:360, kind:'star'});
    shake(pk.lastPerfect ? 0.12 : 0.05);
  } else {
    if(pk.lastPerfect) for(let i=0;i<5;i++) fx({x:bx-10, y:hy+4+i*3, vx:-0.12-i*0.01, vy:0, life:260, col:'#ffffff', kind:'spark'});
  }
}

/* fin de sesión: sello +N que vuela a su tarjeta */
function gymFinish(pk, p, bx){
  pk.phase='idle';
  const st = GYM_ST[pk.kind];
  let total = pk.gain||1;
  const perfect = pk.perfects>=3;
  if(perfect){
    p[pk.kind] = Math.min(99, (p[pk.kind]||0)+1);
    total++;
  }
  const hy = gymHeadY();
  pk.res = {t:0, kind:pk.kind, total, to:p[pk.kind], from:p[pk.kind]-total, perfect, x:bx, y:Math.max(40, hy-18), counted:0, ticks:0, perfects:pk.perfects};
  if(perfect){
    popText(80, 58, '¡SESION PERFECTA!', '#ffd94a', {big:true, life:1700, vy:-0.004});
    confetti(bx, hy, 40);
    flash('#fff8d0', 0.35, 160); shake(0.3); hitstop(90);
    SFX.levelup();
  } else {
    burst(bx, hy, {n:10, cols:[st.col,'#ffffff'], speed:0.07, life:500});
    SFX.yay();
  }
  petVoice(p); vibrate(perfect ? [15,15,15,15,60] : [15,15,30]);
  saveGame();
}

/* stat que enseñan las tarjetas (con cuenta progresiva al terminar) */
function gymShownStat(pk, p, kind){
  const v = p[kind]||0;
  if((pk.phase==='walk' || pk.phase==='train') && pk.kind===kind) return Math.max(0, v-(pk.gain||0));
  if(pk.res && pk.res.kind===kind && pk.res.counted<pk.res.total) return Math.max(0, pk.res.from + pk.res.counted);
  return v;
}

function gymStrip(pk, p, t, dt, now){
  const Y0 = 197;
  px(0,Y0,160,75,'#e8e0c8'); px(0,Y0,160,1,K); px(0,Y0+1,160,1,'#f6efe0');
  px(0,Y0+37,160,1,'rgba(26,20,40,0.15)');
  const GG = GYM_GAUGE;
  const res = pk.res;
  if(res) res.t += dt;

  if(pk.phase==='train' || pk.phase==='walk'){
    const st = GYM_ST[pk.kind];
    /* cabecera: estación y pips de las reps */
    gymIcon(st.kind, 6, 202, st.dk);
    drawText(st.label, 16, 202, K);
    const reps = pk.reps||[];
    for(let i=0;i<3;i++){
      const x0 = 84+i*12, gr = reps[i] || (i<(pk.rep||0) ? 'b' : null);
      const cur = pk.phase==='train' && i===(pk.rep||0);
      const fill = gr==='p' ? '#ffd94a' : gr==='b' ? '#f6efe0' : gr ? '#9aa4c8' : (cur && Math.floor(t/200)%2 ? '#fff8d0' : '#c8c0a8');
      gymBox(x0, 201, 10, 8, fill);
      if(gr==='p') drawText('★', x0+3, 202, K);
      else if(gr==='f' || gr==='a') px(x0+3, 204, 4, 1, K);
      else if(gr==='b') px(x0+4, 203, 2, 3, K);
    }
    drawText('★'+(pk.perfects||0)+'/3', 124, 202, '#8a6a10');

    /* la aguja grande */
    const walking = pk.phase==='walk';
    const frozen = pk.repAnim>0;
    const gg = frozen && pk.lastG!==undefined ? pk.lastG : gymGauge(pk.t);
    gymBox(GG.x-2, GG.y-2, GG.w+4, GG.h+4, K);
    px(GG.x, GG.y, GG.w, GG.h, '#3a3448');
    const gzB = GG.x + Math.round(GYM_GOOD*GG.w), gzP = GG.x + Math.round(GYM_PERFECT*GG.w);
    px(gzB, GG.y, gzP-gzB, GG.h, '#5a5468');
    const pulse = (Math.sin(t/110)+1)/2;
    const gold = walking ? '#8a7a40' : (pulse>0.5 ? '#ffd94a' : '#ffe680');
    px(gzP, GG.y, GG.x+GG.w-gzP, GG.h, gold);
    px(gzP, GG.y, GG.x+GG.w-gzP, 1, walking ? '#8a7a40' : '#fff8d0');
    if(!walking && !frozen){
      /* el halo de la zona dorada respira */
      ctx.globalAlpha = 0.25+pulse*0.35;
      px(gzP-1, GG.y-4, GG.x+GG.w-gzP+2, 1, '#ffd94a');
      px(gzP-1, GG.y+GG.h+3, GG.x+GG.w-gzP+2, 1, '#ffd94a');
      ctx.globalAlpha = 1;
    }
    for(let i=1;i<8;i++) px(GG.x+Math.round(i*GG.w/8), GG.y+GG.h-3, 1, 3, 'rgba(255,255,255,0.25)');
    drawText('★', gzP + ((GG.x+GG.w-gzP)>>1) - 1, GG.y+3, walking ? '#5a4a20' : K);
    if(!walking){
      const nxOf = g=>GG.x + Math.round(g*(GG.w-3));
      if(!frozen){
        /* estela de la aguja */
        for(let k=1;k<=3;k++){
          ctx.globalAlpha = 0.35 - k*0.09;
          px(nxOf(gymGauge(pk.t-k*28)), GG.y, 3, GG.h, '#ffffff');
        }
        ctx.globalAlpha = 1;
      }
      const nx = nxOf(gg);
      const inGold = gg>GYM_PERFECT;
      const ncol = frozen ? (pk.lastGrade==='p' ? '#ffd94a' : pk.lastGrade==='b' ? '#ffffff' : '#9aa4c8') : (inGold ? '#fff8d0' : '#ffffff');
      px(nx-1, GG.y-5, 5, GG.h+10, K);
      px(nx, GG.y-4, 3, GG.h+8, ncol);
      px(nx-2, GG.y-6, 7, 2, K); px(nx-1, GG.y-6, 5, 1, ncol);
    }
    /* instrucciones */
    let msg, mcol = K;
    if(walking){ msg = 'CALENTANDO... TOCA PARA IR YA'; mcol = 'rgba(26,20,40,0.55)'; }
    else if(frozen){
      msg = pk.lastGrade==='p' ? '¡CLAVADO!' : pk.lastGrade==='b' ? 'BIEN: CASI EN LO DORADO' : pk.lastGrade==='a' ? 'SE TE PASO: ¡NO TE DUERMAS!' : 'FLOJO: ESPERA LO DORADO';
      mcol = pk.lastGrade==='p' ? '#8a6a10' : 'rgba(26,20,40,0.7)';
    } else {
      msg = '¡TOCA CON LA AGUJA EN LO DORADO!';
      mcol = Math.floor(t/300)%2 ? K : '#8a6a10';
    }
    drawTextC(msg, 80, 229, mcol);
  } else if(res && !(res.t>1300+res.total*200+2600)){
    /* resumen de la sesión recién terminada */
    const st = GYM_ST[res.kind] || GYM_ST.str;
    drawTextC(res.perfect ? '¡SESION PERFECTA!' : 'SESION COMPLETA', 80, 202, res.perfect ? '#8a6a10' : K);
    for(let i=0;i<3;i++){
      const on = i<res.perfects;
      drawText('★', 68+i*9, 212, on ? '#e8b020' : '#c8c0a8');
    }
    drawTextC(res.perfect ? '3 CLAVADOS: +1 EXTRA' : 'CLAVA LAS 3 PARA +1 EXTRA', 80, 221, 'rgba(26,20,40,0.6)');
    drawTextC('+'+res.total+' '+st.stat+'  ·  PILAS '+Math.round(p.energy), 80, 229, st.dk);
  } else {
    drawText('ELIGE ESTACION', 6, 202, K);
    const en = Math.round(p.energy);
    drawText('PILAS', 92, 202, 'rgba(26,20,40,0.6)');
    gymBox(113, 201, 42, 7, '#3a3448');
    px(114, 202, Math.round(40*clamp01(en/100)), 5, en<15 ? '#e2574c' : en<40 ? '#f0a04b' : '#7ac74f');
    px(114+Math.round(40*0.15), 202, 1, 5, 'rgba(255,255,255,0.5)');
    drawText('· 3 REPS AL RITMO DE LA AGUJA', 6, 212, 'rgba(26,20,40,0.65)');
    drawText('· CADA UNA: CUOTA ✦ Y -15 PILAS', 6, 220, 'rgba(26,20,40,0.65)');
    const aff = TRAIN_AFFINITY[p.line];
    if(aff) drawText('· TU LINEA: X2 EN '+GYM_ST[aff].stat, 6, 228, '#8a6a10');
    else drawText('· 3 CLAVADOS: +1 EXTRA', 6, 228, '#8a6a10');
  }

  /* ---------- tarjetas de estación ---------- */
  for(const st of PARK_STATIONS){
    const cx0 = GYM_CARD.xs[st.kind];
    let cy = GYM_CARD.y;
    const active = pk.kind===st.kind && (pk.phase==='train' || pk.phase==='walk');
    const busy = pk.phase==='train' || pk.phase==='walk';
    const cost = trainCost(p, st.kind);
    const afford = G.motas>=cost && p.energy>=15;
    let ox = 0;
    if(pk.denyAt && pk.denyAt[st.kind]) ox = Math.round(springOff(pk.denyAt[st.kind], 3, now));
    if(pk.pressAt && pk.pressAt[st.kind]) cy += Math.round(Math.max(0, springOff(pk.pressAt[st.kind], 2, now)));
    if(res && res.kind===st.kind && res.bumpAt) cy -= Math.round(Math.abs(springOff(res.bumpAt, 4, now)));
    if(active) cy -= 2;
    const x = cx0 + ox;
    if(busy && !active) ctx.globalAlpha = 0.5;
    px(x+1, cy+GYM_CARD.h, GYM_CARD.w-1, 1, 'rgba(26,20,40,0.3)');
    gymBox(x, cy, GYM_CARD.w, GYM_CARD.h, '#f6efe0', active ? '#8a6a10' : K);
    px(x+1, cy+1, GYM_CARD.w-2, 9, st.col);
    px(x+1, cy+9, GYM_CARD.w-2, 1, st.dk);
    gymIcon(st.kind, x+3, cy+3, '#ffffff');
    drawText(st.label, x+12, cy+3, '#ffffff');
    /* stat actual en grande */
    const v = gymShownStat(pk, p, st.kind);
    drawText(st.stat, x+4, cy+14, 'rgba(26,20,40,0.55)');
    drawTextO(String(v), x+GYM_CARD.w-4-textWS(String(v),2), cy+12, st.col, 2);
    /* cuota */
    drawText('✦'+cost, x+4, cy+24, G.motas>=cost ? '#8a6a10' : '#c03030');
    if(TRAIN_AFFINITY[p.line]===st.kind){ gymBox(x+34, cy+23, 11, 7, '#ffd94a'); drawText('X2', x+35, cy+24, K); }
    else if(!busy) drawText(String(GYM_KINDS.indexOf(st.kind)+1), x+41, cy+24, 'rgba(26,20,40,0.3)');
    if(!afford && !busy){
      ctx.globalAlpha = 0.35; px(x+1, cy+10, GYM_CARD.w-2, GYM_CARD.h-11, '#e8e0c8'); ctx.globalAlpha = 1;
      if(p.energy<15) drawTextO('SIN PILAS', x+5, cy+16, '#e2574c', 1, '#f6efe0');
    }
    if(active){
      /* marco dorado que late */
      if(Math.floor(t/250)%2){ px(x-1, cy-1, GYM_CARD.w+2, 1, '#ffd94a'); px(x-1, cy+GYM_CARD.h, GYM_CARD.w+2, 1, '#ffd94a'); }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- sello +N que vuela a su tarjeta y cuenta ---------- */
  if(res && GYM_ST[res.kind]){
    const st = GYM_ST[res.kind];
    const tx = GYM_CARD.xs[res.kind] + GYM_CARD.w/2, ty = GYM_CARD.y + 12;
    const s = '+'+res.total+' '+st.stat;
    const FLY0 = 750, FLY1 = 1100;
    if(res.t < FLY0){
      const sc = res.t<120 ? 3 : 2;
      const dy = res.t<120 ? -Math.round((1-res.t/120)*8) : 0;
      /* sello: aparece grande y se asienta */
      drawTextOC(s, res.x, res.y+dy, res.perfect ? '#ffd94a' : '#7ac74f', sc);
      if(!res.rung){ res.rung = true; ringFx(res.x, res.y+5, '#ffffff', 22, 300); }
    } else if(res.t < FLY1){
      const k = ease.inCubic((res.t-FLY0)/(FLY1-FLY0));
      const x = res.x + (tx-res.x)*k;
      const y = res.y + (ty-res.y)*k - Math.sin(k*Math.PI)*24;
      drawTextOC(s, x, Math.round(y), res.perfect ? '#ffd94a' : '#7ac74f', k<0.6 ? 2 : 1);
      if(dt>0) fx({x, y:y+3, vx:0, vy:0.005, life:260, col:res.perfect ? '#ffd94a' : '#b8f0a0', size:1});
    } else {
      /* llega: la tarjeta salta y el número cuenta */
      if(!res.landed){
        res.landed = true; res.bumpAt = performance.now();
        burst(tx, ty+4, {n:12, cols:[st.col,'#ffffff','#ffd94a'], speed:0.08, g:0.0002, life:420, kind:'spark'});
        ringFx(tx, ty+4, st.col, 20, 320);
      }
      const want = Math.min(res.total, 1+Math.floor((res.t-FLY1)/200));
      while(res.counted < want){
        res.counted++;
        res.bumpAt = performance.now();
        SFX.gymTick(res.counted-1);
        popText(tx, GYM_CARD.y-4, '+1', '#ffd94a', {life:600});
        burst(tx+10, ty+6, {n:6, cols:['#ffd94a','#fff8d0'], speed:0.06, life:300, kind:'star'});
      }
    }
  }
}
