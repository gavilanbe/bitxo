"use strict";
/* =========================================================
   BITXO — render/pets: bitxos, juguetes, salvajes y cacas
   ========================================================= */
/* ---------------- DIBUJO: MASCOTAS Y SALVAJES ---------------- */
/* sombra de óvalo con núcleo más oscuro */
function softShadow(cx, y, w){
  w = Math.max(4, Math.round(w));
  const x = Math.round(cx - w/2);
  px(x+1, y, w-2, 2, 'rgba(10,20,20,0.22)');
  px(x, y+1, w, 1, 'rgba(10,20,20,0.12)');
  px(x+2, y, w-4, 1, 'rgba(10,20,20,0.14)');
}
function petSprKey(p){ return p.form==='grimo' ? 'grimo' : p.line+'_'+(p.form||'babyA'); }
function drawOnePet(p, i, t){
  const baseY = 161;
  const now = performance.now();
  const sel = i===G.sel;
  /* en el columpio: sentado en el asiento, que describe un arco */
  if((p.swingT||0)>0){
    const s = swingSeat(t);
    const fr = SPR[petSprKey(p)];
    const vel = Math.cos(t*2*Math.PI/SWING.per);
    /* en los extremos cierra los ojos de gusto */
    const spr = Math.abs(vel)<0.35 ? fr[1] : fr[0];
    const w2 = spr.width, h2 = spr.height;
    const sx = Math.round(s.x), sy = Math.round(s.y);
    ctx.save();
    ctx.translate(sx, sy+3);
    ctx.scale(vel>=0?1:-1, 1);
    ctx.drawImage(spr, -Math.floor(w2/2), -h2);
    if(p.hat && typeof drawPetHat==='function') drawPetHat(p, spr, -Math.floor(w2/2), -h2, false);
    ctx.restore();
    ctx.drawImage(SPR.columpio_seat, sx-7, sy-1);
    /* se agarra a las cuerdas: el tramo bajo pasa por delante */
    const ropeK = Math.min(9, h2-4);
    for(const side of [-1,1]){
      const ax = SWING.px + side*5, bx = s.x + side*5;
      for(let k=0;k<ropeK;k++){ const f = 1 - k/SWING.L; px(Math.round(ax+(bx-ax)*f), Math.round(SWING.py+(s.y-SWING.py)*f), 1, 1, '#c8a878'); }
    }
    /* viento en la cara al pasar por abajo */
    if(Math.abs(vel)>0.9 && Math.abs(s.a)>0.2){ const d = vel>0?-1:1; px(sx+d*(w2/2+2), sy-6, 3, 1, 'rgba(255,255,255,0.5)'); px(sx+d*(w2/2+3), sy-3, 2, 1, 'rgba(255,255,255,0.4)'); }
    if(sel && Math.floor(t/400)%2===0){ px(sx-1,sy-h2-5,2,2,'#ffd94a'); px(sx-2,sy-h2-7,4,2,'#ffd94a'); }
    return;
  }
  /* en la bañera: medio cuerpo bajo el agua, espuma y pompas */
  if((p.batheT||0)>0){
    const TX = BANERA.x, TY = BANERA.y;
    const fr = SPR[petSprKey(p)];
    const spr3 = (now%2600<1700) ? fr[1] : fr[0];
    const bob = Math.round(Math.sin(t/260)*1);
    const inT = (p.batheDur||4200) - p.batheT;
    /* entra de un salto: cae desde arriba los primeros 260 ms */
    const drop = inT<260 ? Math.round((1-inT/260)*10) : 0;
    ctx.save();
    ctx.beginPath(); ctx.rect(TX-40, 0, 80, TY+3); ctx.clip();
    ctx.translate(TX, TY + 11 + bob - drop);
    ctx.scale(p.dir||1, 1);
    ctx.drawImage(spr3, -Math.floor(spr3.width/2), -spr3.height);
    if(p.hat && typeof drawPetHat==='function') drawPetHat(p, spr3, -Math.floor(spr3.width/2), -spr3.height, false);
    ctx.restore();
    ctx.drawImage(SPR.banera_wf, TX-11, TY);
    /* espuma alrededor */
    const hw = Math.min(9, Math.floor(spr3.width/2)+1);
    for(let k=-1;k<=1;k+=2){
      const fx0 = TX + k*hw + Math.round(Math.sin(t/300+k)*1);
      px(fx0-1, TY+1, 3, 2, '#ffffff'); px(fx0-2, TY+2, 1, 1, '#e8faff'); px(fx0+2, TY+2, 1, 1, '#e8faff');
      px(fx0 + k*3, TY+1, 2, 1, '#ffffff');
    }
    if(every(240, t)) toyFx({kind:'bubble', x:TX-7+Math.random()*14, y:TY, vx:(Math.random()-0.5)*0.01, vy:-0.018-Math.random()*0.012, life:900+Math.random()*500, r:Math.random()<0.35?2:1});
    if(sel && Math.floor(t/400)%2===0){ px(TX-1,TY+9-spr3.height-6,2,2,'#ffd94a'); px(TX-2,TY+9-spr3.height-8,4,2,'#ffd94a'); }
    return;
  }
  if(p.exped){
    px(p.rx-1,147,2,14,'#5a4632');
    px(p.rx-8,139,16,10,'#8a6a3a');
    px(p.rx-8,139,16,1,K); px(p.rx-8,148,16,1,K);
    px(p.rx-8,139,1,10,K); px(p.rx+7,139,1,10,K);
    const left = Math.max(0, Math.ceil((p.exped.until-Date.now())/60000));
    const lbl = left>=60? Math.ceil(left/60)+'H' : left+'M';
    drawTextC(lbl, p.rx, 141, '#f6efe0');
    if(sel && Math.floor(t/400)%2===0){ px(p.rx-1,131,2,2,'#ffd94a'); px(p.rx-2,129,4,2,'#ffd94a'); }
    return;
  }
  if(p.stage===STAGES.EGG){ drawEggWorld(p, i, t); return; }
  const content = p.eatT>0 || (now - (p.petT||0) < 900);
  const def = p.form==='grimo' ? {spr:'grimo'} : {spr:p.line+'_'+(p.form||'babyA')};
  const frames = SPR[def.spr];
  const blinkNow = now < p.blinkAt+140;
  const spr = (p.sleeping || content || blinkNow) ? frames[1] : frames[0];
  const w = spr.width, h = spr.height;

  let sx=1, sy=1, lift=0;
  sy *= 1 + Math.sin(t/420 + i*2)*0.015;
  const walking = Math.abs(p.tx-p.rx)>2 && !p.sleeping && !p.eatT && !p.trainT && UI.mode==='main';
  if(walking){
    const ph = Math.abs(Math.sin(t/220 + i));
    lift = ph*3; sy *= 1+ph*0.05; sx *= 1-ph*0.04;
  }
  if(p.trainT>0){
    const ph = Math.abs(Math.sin(t/90));
    lift = ph*3; sy *= 1+ph*0.09; sx *= 1-ph*0.06;
  }
  if(p.eatT>0){
    const ch = Math.abs(Math.sin(t/110));
    sy *= 1-ch*0.1; sx *= 1+ch*0.07;
  }
  /* bebiendo en la fuente: se inclina a sorbos */
  if(p.drinkT>0){
    const sip = Math.max(0, Math.sin(t/190));
    sy *= 1-sip*0.1; sx *= 1+sip*0.06;
  }
  /* tocando el tambor: salta y cae en cada golpe */
  if(p.drumT>0){
    const k = Math.min(1, (now-(UI.drumHitAt||0))/TAMBOR.beat);
    lift += Math.sin(k*Math.PI)*4;
  }
  /* sujetando la cometa: tira del hilo */
  if(p.kiteT>0){ sx *= 1 - Math.max(0,Math.sin(t/340))*0.04; }
  /* patada: se estira hacia delante */
  const kk = now-(p.kickAnimAt||0);
  if(kk<200){ sx *= 1 + 0.18*Math.sin(kk/200*Math.PI); lift += Math.sin(kk/200*Math.PI)*2; }
  if(!p.sleeping && !p.eatT){
    if(p.hunger<25){ sy*=0.93; sx*=1.05; }
    else if(p.happy<25){ sy*=0.96; }
  }
  if(p.happy>78 && !p.sleeping && !p.eatT && !p.trainT && !walking && UI.mode==='main'){
    if(!p.joyAt || now > p.joyAt + 4500 + (p.joySeed||0)){
      p.joyAt = now; p.joySeed = Math.random()*3500;
      if(Math.random()<0.4 && i===G.sel){ spawnHearts(1); petVoice(p); }
    }
    const jt = now - p.joyAt;
    if(jt < 520){
      const pr = jt/520, arc = Math.sin(pr*Math.PI);
      lift += arc*7; sy *= 1+arc*0.12; sx *= 1-arc*0.08;
      p.joyLand = true;
    } else if(p.joyLand){
      /* aterriza: aplastón y polvo */
      p.joyLand = false; p.squashAt = now; dustFx(p.rx, 161, 4);
    }
  }
  if(p.sleeping){ sy*=0.94; sx*=1.03; lift=0; }
  /* sentado en un banco: sobre el asiento, un pelín achatado y balanceándose */
  if(p.decoUse && typeof decorSeatDY==='function' && decorSeatDY(p)){
    lift = 6 + Math.max(0, Math.sin(t/700))*0.6; sy *= 0.95; sx *= 1.03;
  }
  /* muelle de squash & stretch: caricias, aterrizajes, selección */
  const spq = springSquash(p.squashAt, 0.24, now);
  sx *= spq[0]; sy *= spq[1];

  const tremble = (p.scaredT && Date.now()<p.scaredT) ? Math.round(Math.sin(t/30)) : 0;
  const x = Math.round(p.rx) + tremble;
  /* al amanecer y atardecer las sombras se alargan */
  const phSh = dayPhase();
  const shStretch = (phSh==='dawn' || phSh==='dusk') ? 1.6 : 1;
  const shw = Math.max(6, Math.round((w-4)*sx * (1 - lift*0.04) * shStretch));
  softShadow(x, 161, shw);
  ctx.save();
  ctx.translate(x, baseY - lift);
  ctx.scale(p.dir*sx, sy);
  ctx.drawImage(spr, -w/2, p.sleeping ? -h+3 : -h);
  if(p.hat) drawPetHat(p, spr, -w/2, p.sleeping ? -h+3 : -h, false);
  ctx.restore();

  const yTop = baseY - lift - Math.round(h*sy);

  if(p.sick){
    /* gota verde de fiebre */
    const gy2 = yTop + 2 + Math.round(Math.sin(t/260)*1.5);
    px(x - Math.round(w/2) - 2, gy2, 2, 3, '#8ac77a');
  }

  if(sel && Math.floor(t/400)%2===0){
    px(x-1, yTop-8, 2, 2, '#ffd94a');
    px(x-2, yTop-10, 4, 2, '#ffd94a');
  }

  if(p.sleeping){
    const zi = Math.floor(t/500)%3;
    for(let z=0;z<=zi;z++) drawText('Z', x+8+z*5, yTop-4-z*5, '#eef4ff');
  } else {
    if(p.hunger<25){
      const dy = (t/7)%9;
      px(x + Math.round(w*sx/2)-1, yTop+3+dy, 1, 2, '#bde8f8');
    } else if(p.happy<25){
      const dy = (t/9)%7;
      px(x-3, yTop+6+dy, 1, 2, '#6db1ff');
    }
    let icon = null;
    if(p.sick) icon='sick';
    else if(p.hunger<25) icon='meal';
    else if(G.poops.length>0 && p.hygiene<50) icon='poo';
    else if(p.happy<25) icon='sad';
    else if(p.energy<15) icon='zzz';
    else if(p.thought && performance.now()<p.thought.until) icon = p.thought.icon;
    if(icon && Math.floor(t/600)%3!==2){
      const bx = x+10, by = yTop-14;
      px(bx-2,by-2,14,13,'#f6efe0');
      px(bx-2,by-2,14,1,K); px(bx-2,by+10,14,1,K);
      px(bx-2,by-2,1,13,K); px(bx+11,by-2,1,13,K);
      px(bx-1,by+11,2,2,'#f6efe0');
      if(icon==='meal') ctx.drawImage(SPR.meal, bx, by);
      if(icon==='poo')  ctx.drawImage(SPR.poop, bx+1, by+1);
      if(icon==='sad')  drawText('♥', bx+3, by+2, '#8a8a9a');
      if(icon==='zzz')  drawText('Z', bx+3, by+2, '#5a6aa0');
      if(icon==='ball') ctx.drawImage(SPR.pelota, bx+1, by+1);
      if(icon==='que')  drawText('?', bx+3, by+2, '#6db1ff');
      if(icon==='sick'){ px(bx+2,by+2,5,5,'#8ac77a'); px(bx+3,by+1,3,1,'#8ac77a'); px(bx+4,by+4,1,1,'#3a7048'); }
      if(icon==='love') drawText('♥', bx+3, by+2, '#e2574c');
      if(icon==='note') toyNote(bx+4, by+2, '#5a3fa8');
      if(icon==='fruit') ctx.drawImage(SPR.fruta, bx+1, by+1);
      if(icon==='gift') ctx.drawImage(SPR.caja, bx-1, by-1);
      if(icon==='water'){ px(bx+4,by+2,2,1,'#5e9be0'); px(bx+3,by+3,4,4,'#5e9be0'); px(bx+4,by+7,2,1,'#3a72c4'); px(bx+4,by+3,1,2,'#e8faff'); }
    }
  }
  if(p.eatT>0){
    const spr2 = SPR[p.feedKind] || SPR.meal;
    const bite = Math.floor((1600-p.eatT)/500);
    /* cada mordisco: migas con gravedad y un ñam */
    if(p.lastBite!==bite){ p.lastBite = bite; p.squashAt = now;
      burst(x+15, 152, {n:4, cols:['#e8c890','#c89858','#f6efe0'], speed:0.05, g:0.0003, life:420, up:0.03, floor:161}); }
    ctx.save();
    ctx.beginPath(); ctx.rect(x+10, 140, 12, 22); ctx.clip();
    ctx.drawImage(spr2, x+11, 152+bite*2);
    ctx.restore();
  }
  if(p.trainT>0){
    drawText('!', x-16, yTop-6, '#ffd94a');
    drawText('!', x+13, yTop-6, '#ffd94a');
  }
}
/* ---------------- JUGUETES: sitio de cada uno en su zona ---------------- */
/* la x de cada uno la decide su sitio en la zona (game/decor.js placeX):
   el jugador los recoloca en el modo EDITAR */
const SWING = {get px(){ return placeX('columpio'); }, py:131, L:19, per:1880};
const BANERA = {get x(){ return placeX('banera'); }, y:150};
const TAMBOR = {get x(){ return placeX('tambor'); }, beat:330};
const FUENTE = {get x(){ return placeX('fuente'); }};
const HUERTO = {get x(){ return placeX('huerto'); }, get plants(){ const x = placeX('huerto'); return [x-7, x, x+7]; }};
const CAJA = {get x(){ return placeX('caja'); }};
const COMETA = {get stake(){ return placeX('cometa'); }};
/* ángulo del columpio: coge vuelo al subirse y se frena al bajarse */
function swingAngle(t){
  const rider = G.pets.find(q=>(q.swingT||0)>0 && (q.zone||'prado')===G.zone);
  let amp = WEATHER.kind==='wind' ? 0.16 : 0.06;
  if(rider){
    const el = (rider.swingDur||6000) - rider.swingT;
    amp = Math.max(amp, 0.6 * Math.min(1, el/1500) * Math.min(1, rider.swingT/1100 + 0.2));
  }
  return amp*Math.sin(t*2*Math.PI/SWING.per);
}
function swingSeat(t){
  const a = swingAngle(t);
  return {x: SWING.px + Math.sin(a)*SWING.L, y: SWING.py + Math.cos(a)*SWING.L, a};
}
/* línea de píxeles (cuerdas, hilos) */
function pxLine(x0, y0, x1, y1, col, step){
  const n = Math.max(Math.abs(x1-x0), Math.abs(y1-y0), 1);
  for(let k=0;k<=n;k+=(step||1)) px(Math.round(x0+(x1-x0)*k/n), Math.round(y0+(y1-y0)*k/n), 1, 1, col);
}
/* nota musical de 3x5 */
function toyNote(x, y, col){
  x = Math.round(x); y = Math.round(y);
  px(x+1,y,2,1,col); px(x+1,y,1,4,col); px(x,y+3,2,2,col); px(x+2,y+1,1,1,col);
}
/* partículas propias de los juguetes (notas, pompas, gotas, hojas): por encima de los bitxos */
function toyFx(o){
  if(!UI.toyFx) UI.toyFx = [];
  if(UI.toyFx.length>90) UI.toyFx.shift();
  o.life0 = o.life = o.life||800; o.vx = o.vx||0; o.vy = o.vy||0; o.g = o.g||0;
  o.zone = G.zone;
  UI.toyFx.push(o);
}
function drawToyFx(t){
  if(!UI.toyFx) return;
  const dt = Math.min(50, Math.max(0, t-(UI.toyFxT||t))); UI.toyFxT = t;
  for(let i=UI.toyFx.length-1;i>=0;i--){
    const f = UI.toyFx[i];
    f.life -= dt;
    if(f.life<=0 || f.zone!==G.zone){ UI.toyFx.splice(i,1); continue; }
    f.vy += f.g*dt; f.x += f.vx*dt; f.y += f.vy*dt;
    if(f.floor!==undefined && f.y>f.floor){ f.y = f.floor; f.vy *= -0.3; f.vx *= 0.5; }
    const k = f.life/f.life0;
    ctx.globalAlpha = Math.min(1, k*2.5);
    const wx = f.wob ? Math.round(Math.sin(f.life/120+f.wob)*1.5) : 0;
    if(f.kind==='note') toyNote(f.x+wx, f.y, f.col||'#ffd94a');
    else if(f.kind==='bubble'){
      const x = Math.round(f.x+Math.sin(f.life/150)*1), y = Math.round(f.y);
      if(f.r>1){ px(x,y-1,2,1,'#e8faff'); px(x-1,y,1,2,'#e8faff'); px(x+2,y,1,2,'#9adcf0'); px(x,y+2,2,1,'#9adcf0'); px(x,y,1,1,'#ffffff'); }
      else { px(x,y,2,2,'#e8faff'); px(x,y,1,1,'#ffffff'); }
      /* al final, ¡plop! */
      if(k<0.12){ px(x-1,y-1,1,1,'#ffffff'); px(x+2,y-1,1,1,'#ffffff'); px(x-1,y+2,1,1,'#ffffff'); px(x+2,y+2,1,1,'#ffffff'); }
    }
    else if(f.kind==='drop'){ px(f.x, f.y, 1, f.vy>0.02?2:1, f.col||'#9adcf0'); }
    else if(f.kind==='leaf'){ px(f.x+wx, f.y, 2, 1, f.col||'#7ac74f'); px(f.x+wx+1, f.y+1, 1, 1, '#2f6a34'); }
    else if(f.kind==='fly'){ px(f.x, f.y, 1, 1, '#1a1428'); }
    ctx.globalAlpha = 1;
  }
}
/* sombra en elipse para juguetes */
function toyShadow(cx, w){ softShadow(cx, 160, w); }

function drawToys(t){
  if(!G.toys) return;
  const pn = performance.now();
  /* cada juguete en su sitio; decorWrap lo levanta al arrastrarlo en
     el modo EDITAR y lo hace rebotar al soltarlo o subir de nivel */
  const W = (id, fn)=>{ if(G.toys[id] && toyZone(id)===G.zone) decorWrap(id, placeX(id), fn); };
  W('columpio', ()=>drawSwingToy(t));
  W('fuente', ()=>drawFountainToy(t));
  W('banera', ()=>{
    toyShadow(BANERA.x, 22);
    ctx.drawImage(SPR.banera_w, BANERA.x-11, BANERA.y);
    /* reflejo que se mueve en el agua */
    const gx = BANERA.x-8 + Math.floor(t/260)%16;
    if(!G.pets.some(q=>q.batheT>0)) px(gx, BANERA.y+2, 2, 1, '#e8faff');
  });
  W('huerto', ()=>drawHuertoToy(t, pn));
  W('tambor', ()=>drawDrumToy(t, pn));
  W('caja', ()=>drawCajaToy(t, pn));
  W('cometa', ()=>drawKiteToy(t));
  if(G.toys.robot && toyZone('robot')===G.zone) drawRobotToy(t, pn);
  if(G.toys.pelota && G.ballX!==undefined && toyZone('pelota')===G.zone) drawBallToy(t, pn);
  drawToyLevels(t);
}
/* estrellitas de nivel bajo cada juguete (NV2 ★, NV3 ★★) */
function drawToyLevels(t){
  if(typeof toyLevel!=='function') return;
  for(const id in G.toys){
    if(!G.toys[id] || toyZone(id)!==G.zone || ITEM_MOBILE[id]) continue;
    const L = toyLevel(id); if(L<2) continue;
    const x = placeX(id), y = 163;
    for(let k=0;k<L-1;k++){
      const sx = x - (L-2)*3 + k*6;
      const tw = Math.floor(t/300 + k + x)%6===0;
      px(sx, y-1, 1, 5, K); px(sx-2, y+1, 5, 1, K); px(sx-1, y, 3, 3, K);
      px(sx, y, 1, 3, '#ffd94a'); px(sx-1, y+1, 3, 1, '#ffd94a');
      px(sx, y+1, 1, 1, tw ? '#ffffff' : '#fff0a0');
    }
  }
}
function drawSwingToy(t){
  ctx.drawImage(SPR.columpio, SWING.px-17, 126);
  const s = swingSeat(t);
  for(const side of [-1,1]) pxLine(SWING.px+side*5, SWING.py, s.x+side*5, s.y, '#8a6a4a');
  if(!G.pets.some(q=>(q.swingT||0)>0 && (q.zone||'prado')===G.zone)) ctx.drawImage(SPR.columpio_seat, Math.round(s.x)-7, Math.round(s.y)-1);
}
function drawFountainToy(t){
  const x0 = FUENTE.x-10, y0 = 142;
  toyShadow(FUENTE.x, 20);
  ctx.drawImage(SPR.fuente, x0, y0);
  const W = TA.water;
  /* surtidor de arriba */
  const jh = 3 + Math.round(Math.sin(t/180));
  px(FUENTE.x-1, y0+1-jh, 2, jh, W[3]); px(FUENTE.x-1, y0+1-jh, 1, 1, W[4]);
  /* chorros que caen del cuenco a la pila */
  for(let j=0;j<4;j++){
    const ph = ((t/520) + j/4) % 1;
    const yy = y0 + 6 + ph*ph*8;
    px(x0 + 4 - Math.round(ph*3), Math.round(yy), 1, 2, j%2 ? W[3] : W[4]);
    px(x0 + 15 + Math.round(ph*3), Math.round(yy), 1, 2, j%2 ? W[4] : W[3]);
    const tp = ((t/400) + j/4) % 1;
    px(FUENTE.x-2 + (j<2?0:3) + (j%2?-1:1)*Math.round(tp*2), Math.round(y0 + 1 - jh + tp*tp*6), 1, 1, W[4]);
  }
  /* ondas en la pila */
  const rp = (t % 900)/900;
  px(x0 + 2 + Math.round(rp*2), y0 + 14, 2, 1, W[4]);
  px(x0 + 16 - Math.round(rp*2), y0 + 14, 2, 1, W[4]);
  if(Math.floor(t/300)%3===0) px(x0 + 8 + Math.floor(t/300)%4, y0 + 14, 1, 1, '#ffffff');
}
function drawDrumToy(t, pn){
  const hit = pn-(UI.drumHitAt||0);
  const sq = springSquash(UI.drumHitAt, 0.22, pn);
  toyShadow(TAMBOR.x, 13);
  ctx.save(); ctx.translate(TAMBOR.x, 161); ctx.scale(sq[0], sq[1]);
  ctx.drawImage(SPR.tambor, -6, -10);
  ctx.restore();
  /* la piel vibra un instante tras el golpe */
  if(hit<140){ px(TAMBOR.x-4, 152, 8, 1, '#ffffff'); ringFxOnce(UI, 'drumRingAt', UI.drumHitAt, TAMBOR.x, 152, '#fff8d0', 8); }
  /* baquetas apoyadas si nadie toca */
  if(!G.pets.some(q=>q.drumT>0 && (q.zone||'prado')===G.zone)) ctx.drawImage(SPR.baqueta, TAMBOR.x-10, 150);
}
/* dispara un efecto una sola vez por marca de tiempo */
function ringFxOnce(o, key, at, x, y, col, r){
  if(!at || o[key]===at) return;
  o[key] = at; ringFx(x, y, col, r, 260);
}
function drawCajaToy(t, pn){
  const cx = CAJA.x;
  const ready = Date.now() >= (G.cajaReadyAt||0);
  const oT = pn - (UI.cajaOpenAt||-99999);
  let jx = 0, hop = 0;
  if(ready && oT>1400){
    /* nerviosa: se agita cada poco, como si algo quisiera salir */
    const c = pn % 1700;
    if(c<380){ jx = Math.round(Math.sin(c/24)); hop = c<200 ? Math.round(Math.sin(c/200*Math.PI)*2) : 0; }
    if(c<20 && every(1700, pn)) dustFx(cx, 160, 3);
  }
  const csq = springSquash(UI.cajaOpenAt, 0.35, pn);
  toyShadow(cx, 12 - hop);
  ctx.save(); ctx.translate(cx+jx, 161-hop); ctx.scale(csq[0], csq[1]);
  ctx.drawImage(SPR.caja_body, -6, -7);
  ctx.restore();
  const bodyTop = 161-hop-7;
  /* ¡sorpresa! muelle con estrella que sale disparado */
  if(oT < 1300){
    const up = oT<700 ? ease.outElastic(Math.min(1, oT/420)) : Math.max(0, 1-(oT-700)/600);
    const hh = Math.round(up*14);
    for(let y=0;y<hh;y+=2) px(cx-1 + ((y/2)%2?1:-1), bodyTop-y, 3, 1, '#c2c2d4');
    const sy = bodyTop - hh - 3;
    if(hh>2){
      px(cx-1,sy-3,3,7,'#ffd94a'); px(cx-3,sy-1,7,3,'#ffd94a'); px(cx-2,sy-2,5,5,'#ffd94a');
      px(cx-1,sy-1,1,1,K); px(cx+1,sy-1,1,1,K); px(cx,sy+1,1,1,'#e2574c'); px(cx-1,sy-3,1,1,'#fff0a0');
    }
  }
  /* la tapa vuela y vuelve a caer */
  let ly = 0, la = 0;
  if(oT < 1300){
    const tt = oT;
    ly = Math.max(0, 0.1*tt - 0.0000769*tt*tt);
    la = Math.sin(tt/70)*0.45*(1-tt/1300);
    if(tt>1260) ringFxOnce(UI, 'cajaLandAt', UI.cajaOpenAt, cx, bodyTop, '#ffffff', 7);
  }
  ctx.save(); ctx.translate(cx+jx, bodyTop+1-Math.round(ly)); ctx.rotate(la);
  ctx.drawImage(SPR.caja_lid, -6, -6);
  ctx.restore();
  if(ready && oT>1400){
    const b = Math.round(Math.abs(Math.sin(t/220))*-2);
    drawTextOC('!', cx, 138+b, '#ffd94a');
    if(every(420, t)) fx({x:cx-6+Math.random()*12, y:150-Math.random()*6, vy:-0.02, life:500, col:'#fff0a0', kind:'star'});
  }
}
/* una mata procedural: brote → mata → flor → fruto */
function drawPlant(x, gy, st, t, i, pop){
  const L = TA.leaf;
  const sw = st>=2 ? Math.round(Math.sin(t/900+i*1.7)*0.6) : 0;
  const psq = springSquash(pop, 0.3, performance.now());
  const hS = st===0 ? 0 : (st===1 ? 3 : (st===2 ? 7 : 10));
  const H = Math.max(1, Math.round(hS*psq[1]));
  if(st===0){ px(x-1,gy-1,3,1,TA.soil[3]); px(x,gy-2,1,1,L[3]); return; }
  /* tallo */
  for(let y=0;y<H;y++) px(x + (y>H/2?sw:0), gy-1-y, 1, 1, L[2]);
  const leaf = (lx, ly, d, big)=>{
    px(lx, ly, 2, 1, L[3]); px(lx+(d>0?2:-1), ly-1, 1, 1, L[3]);
    px(lx, ly+1, 2, 1, L[1]);
    if(big){ px(lx+(d>0?1:-1), ly-1, 2, 1, L[4]); px(lx+(d>0?3:-2), ly-2, 1, 1, L[3]); }
  };
  if(st===1){ leaf(x-2, gy-3, -1, false); leaf(x+1, gy-4, 1, false); return; }
  leaf(x-3, gy-3, -1, true); leaf(x+1, gy-4, 1, true);
  leaf(x-3+sw, gy-6, -1, st>=3); leaf(x+1+sw, gy-7, 1, st>=3);
  if(st===2){ px(x-1+sw, gy-9, 3, 2, '#f6efe0'); px(x+sw, gy-9, 1, 1, '#ffd94a'); return; }
  leaf(x-2+sw, gy-9, -1, false); leaf(x+1+sw, gy-10, 1, false);
  /* frutos maduros con brillo y contorno */
  const bob = Math.round(Math.sin(t/400+i)*0.5);
  const fruit = (fx0, fy)=>{
    px(fx0, fy, 3, 3, '#e2574c'); px(fx0-1, fy+1, 1, 1, K); px(fx0+3, fy+1, 1, 1, K);
    px(fx0, fy+3, 3, 1, K); px(fx0+2, fy+2, 1, 1, '#a03030'); px(fx0, fy, 1, 1, '#ffd0c4');
    px(fx0+1, fy-1, 1, 1, L[1]);
  };
  fruit(x-4+sw, gy-8+bob); fruit(x+2+sw, gy-6+bob); fruit(x-1+sw, gy-13+bob);
}
function drawHuertoToy(t, pn){
  const left = (G.huertoReadyAt||0) - Date.now();
  const ready = left<=0;
  /* ¿alguien acaba de cosechar? la fruta salta hacia el bitxo */
  if(UI.huertoLast!==undefined && UI.huertoLast>0 && G.huertoReadyAt>UI.huertoLast && UI.huertoWasReady){
    UI.harvestAt = pn;
    for(const px0 of HUERTO.plants){
      burst(px0, 146, {n:5, cols:['#7ac74f','#4f9a42','#b4ec84'], speed:0.06, g:0.0003, life:520, up:0.04, floor:158});
      ringFx(px0, 146, '#fff8d0', 6, 240);
    }
    const ap = AP();
    if(ap && ap.stage>STAGES.EGG && petHere(ap)){
      UI.throwFood = {x0:HUERTO.x, y0:144, x1:ap.rx+16, y1:155, at:pn, spr:'fruta'};
    }
    popText(HUERTO.x, 136, '+FRUTA', '#ffd94a');
    shake(0.12);
  }
  UI.huertoLast = G.huertoReadyAt; UI.huertoWasReady = ready;
  const total = typeof huertoCycleMs==='function' ? huertoCycleMs() : 7200000;
  const prog = 1 - left/total;
  const st = ready ? 3 : (prog<0.3 ? 0 : (prog<0.65 ? 1 : 2));
  toyShadow(HUERTO.x, 26);
  ctx.drawImage(SPR.bancal, HUERTO.x-13, 153);
  HUERTO.plants.forEach((x0, i)=> drawPlant(x0, 156, st, t, i, UI.harvestAt));
  if(ready){
    if(every(500, t)) fx({x:HUERTO.x-10+Math.random()*20, y:140+Math.random()*8, vy:-0.015, life:600, col:'#fff0a0', kind:'star'});
    const b = Math.round(Math.abs(Math.sin(t/240))*-2);
    drawTextOC('!', HUERTO.x, 128+b, '#ffd94a');
  }
}
/* la cometa: con viento vuela (y a veces la sujeta un bitxo); sin él, descansa */
function kitePos(t){
  return {x: COMETA.stake - 34 + Math.sin(t/1300)*14 + Math.sin(t/370)*2, y: 74 + Math.sin(t/800)*7 + Math.sin(t/290)*1.5};
}
function drawKiteToy(t){
  const S = COMETA.stake;
  /* estaca */
  px(S, 152, 2, 9, TA.wood[2]); px(S, 152, 1, 9, TA.wood[3]); px(S-1, 152, 4, 1, K);
  if(WEATHER.kind!=='wind'){
    /* tumbada junto a la estaca, con la cola en la hierba */
    ctx.drawImage(SPR.cometa, S+3, 152);
    const cols = ['#e2574c','#ffd94a','#5ec8d8'];
    for(let k=0;k<3;k++) px(S+2-k*3, 160 - (k%2), 2, 1, cols[k%3]);
    pxLine(S+5, 157, S+1, 154, 'rgba(250,250,255,0.55)');
    return;
  }
  const holder = G.pets.find(q=>q.kiteT>0 && (q.zone||'prado')===G.zone);
  const k = kitePos(t);
  let hx = S+1, hy = 152;
  if(holder){
    const hs = SPR[petSprKey(holder)][0];
    hx = Math.round(holder.rx + (holder.dir||1)*(hs.width/2-1)); hy = 161 - Math.round(hs.height*0.55);
  }
  /* hilo con comba */
  const kx = k.x, ky = k.y+4;
  const mx = (hx+kx)/2, my = (hy+ky)/2 + 9;
  const n = 40;
  for(let s=0;s<=n;s++){
    const u = s/n, a = (1-u)*(1-u), b = 2*u*(1-u), c = u*u;
    px(Math.round(a*hx+b*mx+c*kx), Math.round(a*hy+b*my+c*ky), 1, 1, 'rgba(250,250,255,0.7)');
  }
  /* cola que sigue la trayectoria con retraso */
  const cols = ['#e2574c','#ffd94a','#5ec8d8','#e2574c','#ffd94a'];
  let prev = {x:kx, y:ky};
  for(let s=1;s<=5;s++){
    const q = kitePos(t - s*110);
    const tx = q.x + 3 + s*1.2 + Math.sin(t/150+s)*1.5, ty = q.y + 4 + s*4;
    pxLine(prev.x, prev.y, tx, ty, 'rgba(26,20,40,0.5)');
    px(Math.round(tx)-1, Math.round(ty), 3, 1, cols[s-1]); px(Math.round(tx), Math.round(ty)-1, 1, 3, cols[s-1]);
    prev = {x:tx, y:ty};
  }
  ctx.drawImage(SPR.cometa, Math.round(k.x)-4, Math.round(k.y)-4);
}
function drawRobotToy(t, pn){
  if(UI.robotX===undefined) UI.robotX = placeX('robot');
  const rx = Math.round(UI.robotX);
  const dir = UI.robotDir||1;
  const sw = UI.robotSweep && pn - UI.robotSweep.at < 900 ? UI.robotSweep : null;
  /* la caca que está barriendo: encoge y se esfuma */
  if(sw){
    const k = (pn - sw.at)/900;
    const hh = Math.max(0, Math.round(8*(1-k)));
    if(hh>0) ctx.drawImage(SPR.poop, 0, 8-hh, 10, hh, Math.round(sw.x)-5, 161-hh, 10, hh);
    if(every(90, pn)) fx({x:sw.x-4+Math.random()*8, y:157, vx:(Math.random()-0.5)*0.04, vy:-0.02, life:380, col:'rgba(230,220,190,0.8)', size:2});
    if(every(160, pn)) fx({x:sw.x-5+Math.random()*10, y:150+Math.random()*8, vy:-0.02, life:500, col:'#bdf0f5', kind:'star'});
  }
  const moving = !sw && Math.abs((UI.robotVX||0))>0.001;
  const bob = moving ? Math.round(Math.abs(Math.sin(t/90))*0.6) : 0;
  toyShadow(rx, 12);
  const fr = SPR.robot[moving ? Math.floor(t/110)%2 : 0];
  ctx.save(); ctx.translate(rx, 146-bob); ctx.scale(dir, 1);
  ctx.drawImage(fr, -7, 0);
  ctx.restore();
  /* ojos en el visor: miran a donde va; parpadean */
  const blink = Math.floor(t/900)%5===0 && (t%900)<120;
  const ey = 146-bob+4;
  if(!blink){ px(rx-2+dir, ey, 1, 2, '#5ec8d8'); px(rx+1+dir, ey, 1, 2, '#5ec8d8'); }
  else { px(rx-2+dir, ey+1, 1, 1, '#5ec8d8'); px(rx+1+dir, ey+1, 1, 1, '#5ec8d8'); }
  /* luz de la antena */
  px(rx-(dir>0?1:0), 146-bob, 2, 1, Math.floor(t/500)%2 ? '#e2574c' : '#ff8a74');
  /* brazo con cepillo: guardado al patrullar, frotando al barrer */
  const ax = rx + dir*6, ay = 146-bob+8;
  if(sw){
    const bx = rx + dir*9 + Math.round(Math.sin(pn/45)*2), by = 158;
    pxLine(ax, ay, bx, by-1, '#6a6a82');
    px(bx-2, by, 5, 2, '#ffd94a'); px(bx-2, by+1, 5, 1, '#c9a227'); px(bx-2, by-1, 5, 1, K);
  } else {
    px(ax, ay, 1, 3, '#6a6a82'); px(ax-(dir>0?0:2), ay+3, 3, 1, '#ffd94a');
  }
}
function drawBallToy(t, pn){
  const z = UI.ballZ||0;
  const x = Math.round(G.ballX);
  const sw = Math.max(3, 8 - Math.round(z/3));
  ctx.globalAlpha = Math.max(0.35, 1 - z/30);
  toyShadow(x, sw);
  ctx.globalAlpha = 1;
  const sq = springSquash(UI.ballSquashAt, 0.3, pn);
  /* gira a cuartos de vuelta según lo que rueda */
  const rot = Math.floor((UI.ballRot||0)/5) % 4;
  ctx.save();
  ctx.translate(x, 161 - Math.round(z));
  ctx.scale(sq[0], sq[1]);
  ctx.translate(0, -5);
  ctx.rotate(((rot+4)%4)*Math.PI/2);
  ctx.drawImage(SPR.pelota, -5, -5);
  ctx.restore();
  /* estela de velocidad */
  if(Math.abs(G.ballVX||0)>0.07){
    const d = -Math.sign(G.ballVX);
    ctx.globalAlpha = 0.4;
    px(x + d*7, 161-Math.round(z)-6, 3, 1, '#ffffff'); px(x + d*8, 161-Math.round(z)-3, 2, 1, '#ffffff');
    ctx.globalAlpha = 1;
  }
}
/* comida lanzada desde la despensa: parábola con giro */
function drawThrownFood(){
  const f = UI.throwFood; if(!f) return;
  const k = (performance.now()-f.at)/320;
  if(k>=1){ UI.throwFood = null; burst(f.x1, f.y1, {n:5, cols:['#fff8d0','#ffd94a'], speed:0.05, kind:'star', life:300}); return; }
  const x = f.x0 + (f.x1-f.x0)*k, y = f.y0 + (f.y1-f.y0)*k - Math.sin(k*Math.PI)*46;
  const spr = SPR[f.spr] || SPR.meal;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(Math.round(k*4)*Math.PI/2);
  ctx.drawImage(spr, -Math.floor(spr.width/2), -Math.floor(spr.height/2));
  ctx.restore();
}
function drawPets(t){
  const order = G.pets.map((p,i)=>i)
    .filter(i=>(G.pets[i].zone||'prado')===G.zone && !(UI.carry && UI.carry.i===i))
    .sort((a,b)=>G.pets[a].rx-G.pets[b].rx);
  for(const i of order) drawOnePet(G.pets[i], i, t);
  drawCarried(t);
  drawThrownFood();
  drawToyFx(t);
}
/* el bitxo en brazos: flota contigo hasta que toques el suelo */
function drawCarried(t){
  if(!UI.carry) return;
  const p = G.pets[UI.carry.i];
  if(!p) return;
  const def = p.form==='grimo' ? 'grimo' : p.line+'_'+(p.form||'babyA');
  const spr = SPR[def][1];
  const bob = Math.round(Math.sin(t/240)*2);
  /* colgando en brazos: se balancea y patalea un poco */
  /* en brazos: siempre en el centro de la PANTALLA (el mundo está desplazado) */
  const x = Math.round(CAM.x) + 80 + Math.round(Math.sin(t/520)), y = 192 + bob;
  const kick = Math.sin(t/110)*0.03;
  px(x-9, 193, 18, 2, 'rgba(0,0,0,0.2)');
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1+kick, 1-kick);
  ctx.drawImage(spr, -Math.floor(spr.width/2), -spr.height);
  if(p.hat) drawPetHat(p, spr, -Math.floor(spr.width/2), -spr.height, false);
  ctx.restore();
  if(Math.floor(t/400)%2===0){
    px(x-1, y-spr.height-8, 2, 2, '#ffd94a');
    px(x-2, y-spr.height-10, 4, 2, '#ffd94a');
  }
  if(Math.floor(t/500)%3===0) drawText('♥', x+10, y-spr.height-4, '#f2a2b8');
}
/* anillo de píxeles (r=5) empezando arriba y en sentido horario, para la cuenta atrás del robo */
const WILD_RING = (()=>{
  const out = [], seen = new Set();
  for(let a=0;a<360;a+=4){
    const r = (a-90)*Math.PI/180, x = Math.round(Math.cos(r)*5), y = Math.round(Math.sin(r)*5);
    const k = x+','+y; if(seen.has(k)) continue; seen.add(k); out.push([x, y]);
  }
  return out;
})();
const WILD_FLY = {cuervillo:1, polillux:1, sombrio:1, chispin:1};
const _wildRim = new Map();
function wildRim(spr, col){
  const k = col; let m = _wildRim.get(spr);
  if(!m){ m = {}; _wildRim.set(spr, m); }
  if(!m[k]){
    const c = document.createElement('canvas'); c.width = spr.width; c.height = spr.height;
    const g = c.getContext('2d'); g.drawImage(spr, 0, 0);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
    m[k] = c;
  }
  return m[k];
}
function drawWild(t){
  if(!G.wild || (G.wild.zone||'prado')!==G.zone) return;
  const w = G.wild;
  const A = ESPR[w.kind]; if(!A) return;
  const B = ESPR[w.kind+'_b'] || A;
  const pn = performance.now();
  /* primera vez en pantalla: "!" enorme, polvo y un respingo */
  if(!w.shownAt){ w.shownAt = pn; popText(w.x, 120, '!', '#e2574c', {big:true, life:700, vy:-0.01}); shake(0.15); }
  if(w.shownAt > pn) w.shownAt = pn - 3000;   /* guardado de otra sesión */
  const age = pn - w.shownAt;
  const moving = Math.abs((w.tx===undefined ? w.x : w.tx) - w.x) > 1;
  const fly = !!WILD_FLY[w.kind];
  /* cuenta atrás del robo (sim.js la descuenta; aquí solo se lee) */
  const leftMs = w.stealMs!==undefined ? w.stealMs : (w.stealAt||0) - Date.now();
  const timed = leftMs < 1e7;
  const tot = Math.max(leftMs, 75000 + (G.relics && G.relics.hueso ? 30000 : 0));
  const frac = timed ? Math.max(0, Math.min(1, leftMs/tot)) : 1;
  const urgent = timed && leftMs < 20000;

  /* mirada: hacia donde va; parado, olfatea y vigila a los lados */
  let face = (w.dir||-1) >= 0 ? 1 : -1;
  const ip = t % 3600;
  if(!moving && !urgent && ip > 2300 && ip < 3000) face = -face;
  /* fotograma: carrera alterna rápido; en reposo, doble olfateo / parpadeo */
  let spr = A;
  if(moving) spr = Math.floor(t/130)%2 ? B : A;
  else if(urgent) spr = Math.floor(t/260)%2 ? B : A;
  else spr = (ip < 160 || (ip > 300 && ip < 440)) ? B : A;

  /* saltitos al correr, flotar si vuela, sigilo si va a robar */
  let oy = 0, ox = 0;
  if(fly) oy = Math.round(Math.sin(t/240)*1.5) - 4;
  else if(moving) oy = -Math.round(Math.abs(Math.sin(t/85))*2);
  if(urgent && !moving) ox = Math.floor(t/90)%2 ? 1 : 0;   /* se frota las manos, impaciente */
  const entering = age < 1100;
  if(moving && !fly && every(entering ? 70 : 150, t)) dustFx(w.x - face*5, 161, entering ? 3 : 1, '#d8c8a0');
  if(entering && moving && every(60, t)) fx({x:w.x - face*(8+Math.random()*6), y:161 - 3 - Math.random()*A.height*0.7, vx:-face*0.05, life:220, col:'rgba(255,255,255,0.8)', kind:'spark'});

  const X = Math.round(w.x + ox), Y = 161 + oy;
  softShadow(w.x, 161, (A.width - 4) * (fly ? 0.7 : 1));
  const draw = (img, dx, dy)=>{
    ctx.save(); ctx.translate(X + dx, Y + dy); if(face<0) ctx.scale(-1, 1);
    ctx.drawImage(img, -Math.floor(img.width/2), -img.height); ctx.restore();
  };
  if(w.boss){
    /* aura de jefe: halo rojo que late y brasas oscuras que suben */
    ctx.globalAlpha = 0.3 + 0.15*Math.sin(t/200);
    const rim = wildRim(spr, '#e2574c');
    draw(rim, -1, 0); draw(rim, 1, 0); draw(rim, 0, -1);
    ctx.globalAlpha = 1;
    if(every(140, t)) fx({x:w.x - spr.width/2 + Math.random()*spr.width, y:Y - Math.random()*spr.height*0.6, vy:-0.03, life:600, col:'#8a2e2a', size:1});
  }
  if(w.elite){
    /* élite: contorno dorado que late */
    ctx.globalAlpha = 0.55 + 0.3*Math.sin(t/150);
    const rim = wildRim(spr, '#ffd94a');
    draw(rim, -1, 0); draw(rim, 1, 0); draw(rim, 0, -1);
    ctx.globalAlpha = 1;
    if(every(260, t)) fx({x:w.x - spr.width/2 + Math.random()*spr.width, y:Y - Math.random()*spr.height, vy:-0.02, life:500, col:'#ffd94a', kind:'star'});
  }
  draw(spr, 0, 0);
  /* olfateo: bocanada junto al hocico */
  if(!moving && !fly && ip < 440 && every(140, t)) fx({x:w.x + face*(spr.width/2+1), y:Y - spr.height*0.45, vx:face*0.02, vy:-0.01, life:300, col:'rgba(255,255,255,0.7)', size:1});
  /* va a robar: motas que se le escapan hacia él */
  if(urgent && every(380, t)){
    const sx = w.x + (Math.random()<0.5 ? -1 : 1)*(14+Math.random()*10);
    fx({x:sx, y:150 - Math.random()*14, vx:(w.x - sx)/500, vy:0.005, life:480, col:'#ffd94a', kind:'star'});
  }

  /* ---- cartel sobre la cabeza: "!", NIVEL y anillo del robo ---- */
  const top = Y - spr.height;
  const fighters = G.pets.filter(q=>q.stage>=STAGES.CHILD);
  let tag = '', tcol = '#f6efe0';
  if(w.nv && fighters.length){
    const ref = AP().stage>=STAGES.CHILD ? AP() : fighters.reduce((a,b)=>playerPower(a)>=playerPower(b)?a:b);
    const d = w.nv - playerPower(ref);
    tcol = d<=-2 ? '#7ac74f' : (d<=1 ? '#f6efe0' : (d<=3 ? '#f0a04b' : '#e2574c'));
    tag = (w.elite?'★':'')+'NV'+w.nv;
    if(w.elite) tcol = '#ffd94a';
  }
  if(w.boss) tag = 'JEFE' + (tag ? ' '+tag : '');
  const tw = tag ? tag.length*4-1 : 0;
  const ringW = timed ? 11 : 0;
  const gap = tag && ringW ? 3 : 0;
  const tot2 = tw + gap + ringW;
  const lx = Math.round(w.x - tot2/2);
  const ty = top - 10;
  if(tag){
    px(lx-2, ty-2, tw+4, 9, 'rgba(26,20,40,0.78)');
    px(lx-1, ty-3, tw+2, 1, 'rgba(26,20,40,0.78)'); px(lx-1, ty+7, tw+2, 1, 'rgba(26,20,40,0.78)');
    if(w.boss){ drawText('JEFE', lx, ty, '#e2574c'); if(tag.length>4) drawText(tag.slice(5), lx+20, ty, tcol); }
    else drawText(tag, lx, ty, tcol);
  }
  if(timed){
    const rcx = lx + tw + gap + 5, rcy = ty + 2;
    const col = frac > 0.5 ? '#ffd94a' : (frac > 0.27 ? '#f0a04b' : '#e2574c');
    const blinkOff = urgent && leftMs < 6000 && Math.floor(t/120)%2;
    /* disco de fondo */
    for(let yy=-4; yy<=4; yy++){ const hw = Math.round(Math.sqrt(Math.max(0, 16.5 - yy*yy))); px(rcx-hw, rcy+yy, hw*2+1, 1, 'rgba(26,20,40,0.78)'); }
    const n = WILD_RING.length, on = Math.ceil(frac*n);
    for(let i=0;i<n;i++){
      const [dx, dy] = WILD_RING[i];
      px(rcx+dx, rcy+dy, 1, 1, i<on ? (blinkOff ? '#ffffff' : col) : 'rgba(26,20,40,0.55)');
    }
    if(urgent){
      const s = String(Math.max(0, Math.ceil(leftMs/1000)));
      drawText(s, rcx - Math.floor((s.length*4-1)/2), rcy-2, blinkOff ? '#ffffff' : '#ff8a7a');
    } else {
      drawText('✦', rcx-1, rcy-2, col);
    }
  }
  /* "!" que salta: fuerte al llegar, luego un aviso cada poco (siempre si va a robar) */
  const alertOn = age < 2600 || urgent || (t % 2400) < 500;
  if(alertOn){
    const bj = Math.round(-Math.abs(Math.sin(t/110))*2);
    if(age < 1400) drawTextOC('!', w.x, ty - 15 + bj, '#e2574c', 2);
    else drawTextOC('!', w.x, ty - 10 + bj, '#e2574c');
  }
}


function drawPoops(t){
  for(const p of G.poops){
    if((p.zone||'prado')!==G.zone) continue;
    const x = Math.round(p.x);
    softShadow(x, 160, 10);
    ctx.drawImage(SPR.poop, x-5, 153);
    /* olor: tres hilillos ondulantes que suben y se deshacen */
    const ph = (p.x*7)%6;
    for(let k=0;k<3;k++){
      const oy = ((t/32 + k*9 + ph*5)%24);
      ctx.globalAlpha = 0.5*(1-oy/24);
      const ox = x-3+k*3 + Math.round(Math.sin(t/200+k*2+oy/4)*1.5);
      px(ox, 150-oy, 1, 2, '#a8b87a');
      ctx.globalAlpha = 1;
    }
    /* dos moscas en ochos, con alas que zumban */
    for(let m=0;m<2;m++){
      const fa = t/(150+m*40) + ph + m*2.4;
      const fxp = Math.round(x + Math.sin(fa)*(6+m*2)), fyp = Math.round(146 + m*3 + Math.sin(fa*2)*3);
      px(fxp, fyp, 1, 1, '#1a1428');
      if(Math.floor(t/40+m)%2){ px(fxp-1, fyp-1, 1, 1, 'rgba(255,255,255,0.8)'); px(fxp+1, fyp-1, 1, 1, 'rgba(255,255,255,0.8)'); }
    }
  }
  if(UI.sweepT && performance.now()-UI.sweepT < 500){
    const k = (performance.now()-UI.sweepT)/500;
    px(160-k*180, 150, 14, 14, 'rgba(190,240,245,0.6)');
  }
}


/* ---------------- CARTEL DE MISIONES Y BUHONERO ---------------- */
function drawSign(t){
  if(G.zone!=='prado') return;
  const ready = questClaimable();
  /* con premio pendiente, el cartel se agita y brilla */
  const wig = ready ? Math.round(Math.sin(t/90)*(Math.floor(t/1400)%2===0?1:0)) : 0;
  softShadow(placeX('cartel'), 160, 10);
  const sx = placeX('cartel') - 9 + wig;
  ctx.drawImage(SPR.cartel, sx, 136);
  /* papelitos clavados: el de la misión, y uno más viejo detrás */
  px(sx+11, 142, 4, 5, '#d8cdb0'); px(sx+11, 146, 4, 1, '#b8ac90');
  const pc = ready ? '#fff4b0' : '#f6efe0';
  px(sx+4, 141, 8, 8, pc); px(sx+4, 148, 8, 1, '#d6cdb4'); px(sx+11, 141, 1, 1, '#d6cdb4');
  px(sx+7, 141, 2, 1, '#e2574c');
  px(sx+5,143,6,1,'rgba(26,20,40,0.45)'); px(sx+5,145,5,1,'rgba(26,20,40,0.45)'); px(sx+5,147,3,1,'rgba(26,20,40,0.35)');
  if(ready){
    const b = Math.round(Math.abs(Math.sin(t/200))*-2);
    drawTextOC('!', sx+9, 128+b, '#ffd94a');
    if(every(300, t)) fx({x:sx+3+Math.random()*12, y:140, vy:-0.02, life:500, col:'#ffd94a', kind:'star'});
  }
}
function drawBuho(t){
  if(!G.buho || G.zone!=='prado') return;
  const b = G.buho;
  const pn = performance.now();
  const bx = Math.round(b.x);
  const dir = b.dir<0 ? -1 : 1;
  const walking = Math.abs((b.tx===undefined?b.x:b.tx) - b.x) > 1;
  /* el carro va detrás, tirado por el buhonero */
  const cx = bx - dir*19;
  const cb = walking ? Math.round(Math.abs(Math.sin(t/120))) : 0;
  softShadow(cx, 160, 24);
  ctx.save(); ctx.translate(cx, 161-cb); ctx.scale(dir, 1);
  ctx.drawImage(SPR.carro, -13, -24);
  ctx.restore();
  /* rueda con radios que giran al andar */
  const wx = cx - dir*1, wy = 157;
  const ang = walking ? (b.x/3) : 0;
  px(wx-3, wy-3, 7, 7, K); px(wx-2, wy-2, 5, 5, TA.wood[2]); px(wx-2, wy-2, 5, 1, TA.wood[3]);
  px(wx-4, wy-2, 1, 5, K); px(wx+4, wy-2, 1, 5, K); px(wx-2, wy-4, 5, 1, K); px(wx-2, wy+4, 5, 1, K);
  for(let s=0;s<2;s++){ const a = ang + s*Math.PI/2; px(Math.round(wx+Math.cos(a)*2), Math.round(wy+Math.sin(a)*2), 1, 1, TA.wood[0]); px(Math.round(wx-Math.cos(a)*2), Math.round(wy-Math.sin(a)*2), 1, 1, TA.wood[0]); }
  px(wx, wy, 1, 1, TA.stone[3]);
  /* el buhonero: andares con saltito, parpadeo */
  const spr = SPR.buhonero[(t%3200)<140 ? 1 : 0];
  const hop = walking ? Math.round(Math.abs(Math.sin(t/140))*2) : 0;
  const sq = walking ? 1 + Math.abs(Math.sin(t/140))*0.05 : 1 + Math.sin(t/420)*0.015;
  softShadow(bx, 160, 12);
  ctx.save();
  ctx.translate(bx, 161-hop);
  ctx.scale(dir, sq);
  ctx.drawImage(spr, -spr.width/2, -spr.height);
  ctx.restore();
  if(walking && every(160, t)) dustFx(bx - dir*4, 161, 1, '#d8c8a0');
  /* reclamo: un destello sobre la mercancía */
  if(!walking && every(700, pn)) fx({x:cx-8+Math.random()*16, y:146+Math.random()*4, vy:-0.018, life:600, col:'#fff0a0', kind:'star'});
  if(Math.floor(t/600)%3!==2) drawTextOC('✦', bx, 133 - (Math.floor(t/300)%2), '#ffd94a');
  const left = Math.max(0, Math.ceil((b.until-Date.now())/1000));
  if(left<30) drawTextC(String(left), bx, 125, '#e2574c');
}
