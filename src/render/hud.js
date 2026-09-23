"use strict";
/* =========================================================
   BITXO — render/hud: HUD, paneles y pantallas (stats, tienda, álbum...)
   ========================================================= */
/* registro de toques por pantalla: lo rellenan render/screens/*.js y lo usa input.js */
const SCREEN_TAP = {};
/* ------ paneles v2: papel con canto, sombra suave y trama (ver uikit.js) ------ */
function panel(x,y,w,h){
  /* sombra suave desplazada */
  px(x+3,y+h,w-3,1,'rgba(8,9,28,0.30)');
  px(x+2,y+h+1,w-3,1,'rgba(8,9,28,0.16)');
  px(x+w,y+3,1,h-2,'rgba(8,9,28,0.22)');
  px(x+w+1,y+4,1,h-3,'rgba(8,9,28,0.10)');
  /* cuerpo: canto oscuro por dentro del contorno */
  px(x+1,y,w-2,h,'#c9bb98');
  px(x,y+1,w,h-2,'#c9bb98');
  px(x+2,y+1,w-4,h-3,'#e8e0c8');
  px(x+1,y+2,w-2,h-5,'#e8e0c8');
  /* trama de papel muy sutil */
  ctx.globalAlpha = 0.045; ctx.fillStyle = K;
  for(let yy=y+4; yy<y+h-4; yy+=3) for(let xx=x+3+((yy-y)%2)*2; xx<x+w-3; xx+=4) ctx.fillRect(xx,yy,1,1);
  ctx.globalAlpha = 1;
  /* contorno con esquinas redondeadas */
  px(x+2,y,w-4,1,K); px(x+2,y+h-1,w-4,1,K);
  px(x,y+2,1,h-4,K); px(x+w-1,y+2,1,h-4,K);
  px(x+1,y+1,1,1,K); px(x+w-2,y+1,1,1,K);
  px(x+1,y+h-2,1,1,K); px(x+w-2,y+h-2,1,1,K);
  /* luz arriba e izquierda, canto abajo */
  px(x+2,y+1,w-4,1,'#fbf6e6');
  px(x+1,y+2,1,h-5,'#f6efdc');
  px(x+2,y+h-3,w-4,1,'#b8a98a');
  UI.panelRect = {x,y,w,h};
  UI.panelHead = null;
}
function card(x,y,w,h,disabled){
  const bg = disabled ? '#d2c9b1' : '#f6efe0';
  if(!disabled) px(x+1,y+h,w-2,1,'rgba(26,20,40,0.2)');
  px(x+1,y,w-2,h,bg); px(x,y+1,w,h-2,bg);
  px(x+1,y,w-2,1,disabled?'#6a6072':K); px(x+1,y+h-1,w-2,1,disabled?'#6a6072':K);
  px(x,y+1,1,h-2,disabled?'#6a6072':K); px(x+w-1,y+1,1,h-2,disabled?'#6a6072':K);
  if(!disabled){ px(x+1,y+1,w-2,1,'#fffaf0'); px(x+1,y+h-2,w-2,1,'rgba(26,20,40,0.1)'); }
}
/* cinta de título: mismo baseline que el texto que sustituye */
function titleChip(cx,y,text){
  const w = textW(text)+14;
  const x = Math.round(cx-w/2);
  /* colas de cinta */
  px(x-3,y-1,4,7,'#2a2540'); px(x-4,y,1,5,'#2a2540'); px(x-3,y-1,4,1,K); px(x-3,y+5,4,1,K); px(x-4,y,1,1,K); px(x-4,y+4,1,1,K);
  px(x+w-1,y-1,4,7,'#2a2540'); px(x+w+3,y,1,5,'#2a2540'); px(x+w-1,y-1,4,1,K); px(x+w-1,y+5,4,1,K); px(x+w+3,y,1,1,K); px(x+w+3,y+4,1,1,K);
  /* cuerpo */
  px(x+1,y-4,w-2,12,'#443c60');
  px(x,y-3,w,10,'#443c60');
  px(x+1,y-5,w-2,1,K); px(x+1,y+8,w-2,1,K);
  px(x-1,y-3,1,10,K); px(x+w,y-3,1,10,K);
  px(x,y-4,1,1,K); px(x+w-1,y-4,1,1,K); px(x,y+7,1,1,K); px(x+w-1,y+7,1,1,K);
  px(x+1,y-4,w-2,1,'#6a5f8c');
  px(x+1,y+7,w-2,1,'#2e2844');
  px(x+2,y-2,1,1,'#ffd94a'); px(x+w-3,y-2,1,1,'#ffd94a');
  drawTextC(text, cx, y+1, K);
  drawTextC(text, cx, y, '#ffe9a8');
}
/* insignia X de cierre en la esquina del panel activo */
function drawCloseBadge(){
  const r = UI.panelRect; if(!r) return;
  const bx = r.x + r.w - 6, by = r.y + 1;
  const dn = UI.closePressT && performance.now()-UI.closePressT < 130 ? 1 : 0;
  /* sombra */
  px(bx-3,by+7,9,1,'rgba(8,9,28,0.35)');
  const y0 = by+dn;
  px(bx-4,y0-3,11,9,'#e2574c');
  px(bx-3,y0-4,9,11,'#e2574c');
  px(bx-3,y0+5,9,1,'#a8352c'); px(bx-4,y0+4,11,1,'#c8443a');
  px(bx-3,y0-4,9,1,K); px(bx-3,y0+6,9,1,K);
  px(bx-4,y0-3,1,9,K); px(bx+6,y0-3,1,9,K);
  px(bx-3,y0-3,9,1,'#f59a90'); px(bx-3,y0-2,1,5,'#f08a80');
  /* aspa pixel 5x5 */
  const cx = bx-1, cy = y0-1;
  for(let i=0;i<5;i++){ px(cx+i,cy+i+1,1,1,'#8a2a24'); px(cx+4-i,cy+i+1,1,1,'#8a2a24'); }
  for(let i=0;i<5;i++){ px(cx+i,cy+i,1,1,'#ffffff'); px(cx+4-i,cy+i,1,1,'#ffffff'); }
  UI.closeAt = {x:bx+1, y:by+1};
}


/* ---------------- HUD / PANTALLAS v7 ---------------- */
/* barras con valor mostrado que persigue al real: sube con destello,
   baja dejando un fantasma rojo que se consume detrás */
const BARV = {};
function animBar(key, val, dt){
  let b = BARV[key];
  if(!b){ b = BARV[key] = {v:val, ghost:val, gainAt:0, lossAt:0}; return b; }
  if(val > b.v + 0.8){ b.gainAt = performance.now(); }
  if(val < b.v - 0.8){ b.lossAt = performance.now(); if(b.ghost < b.v) b.ghost = b.v; }
  const k = 1 - Math.exp(-dt/110);
  b.v += (val - b.v)*k;
  if(performance.now() - b.lossAt > 380) b.ghost += (b.v - b.ghost)*(1-Math.exp(-dt/160));
  if(b.ghost < b.v) b.ghost = b.v;
  return b;
}
function fancyBar(x, y, w, h, key, val, col, dt, t){
  const b = animBar(key, Math.max(0, Math.min(100, val)), dt||16);
  const now = performance.now();
  const fw = Math.round(w*b.v/100), gw = Math.round(w*b.ghost/100);
  /* canal */
  px(x, y, w, h, 'rgba(26,20,40,0.22)');
  px(x, y+h, w, 1, 'rgba(255,255,255,0.35)');
  if(gw>fw) px(x+fw, y, gw-fw, h, '#e2574c');
  const low = val<25;
  const pulse = low && Math.floor(t/260)%2===0;
  px(x, y, fw, h, pulse ? '#ff8a7a' : col);
  if(fw>1){
    px(x, y, fw, 1, 'rgba(255,255,255,0.45)');
    px(x, y+h-1, fw, 1, 'rgba(0,0,0,0.18)');
  }
  /* muescas cada cuarto */
  for(let q=1;q<4;q++) px(x+Math.round(w*q/4), y+1, 1, h-1, 'rgba(26,20,40,0.18)');
  /* destello al subir */
  const ga = now - b.gainAt;
  if(ga < 300){
    ctx.globalAlpha = 1-ga/300; px(x, y, fw, h, '#ffffff'); ctx.globalAlpha = 1;
  }
  /* brillo que recorre las barras llenas */
  if(b.v>98){
    const sx = Math.floor((t/14)%(w+40))-20;
    if(sx>=0 && sx<w) px(x+sx, y, 2, h, 'rgba(255,255,255,0.55)');
  }
  return b;
}
function statBar(x,y,w,val,col,label,t,dt){
  const low = val<25 && Math.floor((t||0)/260)%2===0;
  drawText(label, x, y, low ? '#c0392b' : '#1a1428');
  fancyBar(x, y+7, w, 4, label, val, col, dt, t||0);
}
UI.btnAt = [0,0,0,0,0,0];
function drawHUD(t){
  const dt = Math.min(100, t - (UI.hudT||t)); UI.hudT = t;
  /* barra superior: cristal oscuro con filo de luz */
  px(0,0,160,19,'rgba(14,16,48,0.82)');
  px(0,0,160,1,'rgba(255,255,255,0.10)');
  const p = AP();
  /* retrato enmarcado del bitxo activo (borde dorado si está feliz) */
  const rim = p.stage>STAGES.EGG && p.happy>70 ? '#c8a04b' : '#3b3552';
  px(1,1,17,17,rim);
  px(2,2,15,15,'#141838');
  px(2,2,15,1,'rgba(255,255,255,0.18)');
  ctx.save();
  ctx.beginPath(); ctx.rect(2,2,15,15); ctx.clip();
  const ps = currentSprite();
  const pbob = Math.round(Math.sin(t/500)*0.6);
  ctx.drawImage(ps, 2+Math.floor((15-ps.width)/2), 17-ps.height+pbob+1);
  ctx.restore();
  const name = p.nick || (p.stage===STAGES.EGG ? 'HUEVO '+LINES[p.line].name : currentFormDef().name);
  drawText(name, 21, 3, '#ffffff');
  /* chip de nivel */
  const lvS = 'LV'+p.level;
  px(20,10,textW(lvS)+3,7,'#3b3552'); drawText(lvS, 22, 11, '#bde8a8');
  let hx = 22+textW(lvS)+4;
  drawText('G'+p.gen, hx, 11, 'rgba(255,255,255,0.55)'); hx += textW('G'+p.gen)+4;
  if(G.stars>0){ drawText('★'+G.stars, hx, 11, '#ffd94a'); hx += textW('★'+G.stars)+4; }
  if(G.pets.length>1 && hx+textW((G.sel+1)+'/'+G.pets.length) < 104-textW('+'+motaRate().toFixed(1)+'/S!')-3) drawText((G.sel+1)+'/'+G.pets.length, hx, 11, 'rgba(255,255,255,0.55)');
  /* motas: el contador salta cuando llegan monedas */
  if(UI.lastMotas===undefined) UI.lastMotas = G.motas;
  if(G.motas > UI.lastMotas+0.5){ UI.coinT = performance.now(); }
  if(G.motas < UI.lastMotas-0.5){
    UI.coinLossT = performance.now();
    /* gastar también se ve: la cifra perdida cae del marcador */
    const lost = Math.round(UI.lastMotas - G.motas);
    if(lost>=1) popText(96, 14, '-'+fmt(lost), '#ff8a7a', {vy:0.02, life:800, screen:true});
  }
  UI.lastMotas = G.motas;
  const bumpT = performance.now() - Math.max(UI.coinT||0, JUICE.coinBumpAt||0);
  const bump = bumpT < 200 ? Math.round(-2*Math.sin(bumpT/200*Math.PI)) : 0;
  const loss = performance.now()-(UI.coinLossT||0) < 260;
  const mS = fmt(G.motas);
  const mx = 104 - textW(mS);
  /* icono de mota que gira */
  const spin = Math.floor(t/140)%4;
  const cx0 = mx-7, cy0 = 5+bump;
  px(cx0+1, cy0-1, 1, 7, '#ffd94a'); px(cx0-2, cy0+2, 7, 1, '#ffd94a');
  if(spin%2===0){ px(cx0, cy0+1, 3, 3, '#ffd94a'); } else { px(cx0+1, cy0, 1, 5, '#fff8d0'); }
  px(cx0+1, cy0+2, 1, 1, '#ffffff');
  drawText(mS, mx, 3+bump, loss ? '#ff8a7a' : (bumpT<200 ? '#ffffff' : '#ffd94a'));
  COIN_TARGET.x = cx0+1; COIN_TARGET.y = cy0+2;
  const boosted = Date.now() < G.boostUntil;
  const rS = '+'+motaRate().toFixed(1)+'/S'+(boosted?'!':'');
  drawText(rS, 104-textW(rS), 11, boosted?'#7ac74f':'rgba(255,255,255,0.55)');
  /* altavoz con nivel */
  px(146,5,2,4,'#d8d4e8'); px(148,4,2,6,'#d8d4e8'); px(150,3,1,8,'#d8d4e8');
  const snd = G.sound===undefined ? 2 : G.sound;
  if(snd===0){ drawText('X', 153, 4, '#e2574c'); }
  else {
    px(152,5,1,1,'#5ec8d8'); px(152,8,1,1,'#5ec8d8');
    if(snd===2){ px(154,4,1,2,'#5ec8d8'); px(154,8,1,2,'#5ec8d8'); px(155,6,1,2,'#5ec8d8'); }
  }
  if(needsAttention() && Math.floor(t/500)%2===0){
    drawText('!', 138, 3, '#ffd94a');
  }
  /* barra de XP con brillo */
  px(0,19,160,2,'rgba(26,20,40,0.7)');
  const xw = Math.round(160*Math.min(1, p.xp/xpNeed(p.level)));
  px(0,19,xw,2,'#7ac74f'); px(0,19,xw,1,'#bdf0a0');
  if(xw>2){ const sh = Math.floor(t/20)%200; if(sh<xw) px(sh,19,3,1,'#ffffff'); }
  if(sceneFamily(UI.mode)==='world' && !MENU_DRAW[UI.mode]) drawGoalRibbon(t);
  if(UPDATE_READY && Math.floor(t/500)%4!==3){
    px(28,23,104,12,'#ffd94a');
    px(28,23,104,1,K); px(28,34,104,1,K); px(28,23,1,12,K); px(131,23,1,12,K);
    drawTextC('VERSION NUEVA: TOCA', 80, 26, K);
  }

  /* ---- consola inferior ---- */
  px(0,200,160,72,'#e8e0c8');
  px(0,200,160,1,K);
  px(0,201,160,1,'#f8f2e0');
  px(0,202,160,1,'rgba(26,20,40,0.12)');
  /* trama sutil de papel */
  ctx.globalAlpha = 0.05; ctx.fillStyle = K;
  for(let yy=204; yy<272; yy+=3) for(let xx=(yy%2)*2; xx<160; xx+=4) ctx.fillRect(xx,yy,1,1);
  ctx.globalAlpha = 1;

  statBar(6,206,42,p.hunger,'#e2574c','HAMBRE',t,dt);
  statBar(58,206,42,p.happy,'#f0a04b','ANIMO',t,dt);
  statBar(110,206,44,p.energy,'#5ec8d8','PILAS',t,dt);
  if(p.sleeping && Math.floor(t/600)%2===0) drawText('+', 133, 206, '#5ec8d8');

  px(6,223,148,1,'rgba(26,20,40,0.16)');

  /* ficha siempre visible: carita, limpieza, peso, edad, nivel y amistad.
     Al tocar a tu bitxo, la ficha da un saltito */
  /* con un menú abierto la ficha se calla: los pies de panel respiran */
  const menuOpen = !!MENU_DRAW[UI.mode];
  if(menuOpen){}
  else if(p.stage>STAGES.EGG && !p.exped){
    const fb = p.bubbleT ? springOff(p.bubbleT, 2.5) : 0;
    const face = p.sick ? 0 : (p.happy>66 ? 2 : (p.happy>33 ? 1 : 0));
    const fx2 = 8, fy2 = 227 + Math.round(fb);
    px(fx2,fy2,9,9,['#e2574c','#f0a04b','#7ac74f'][face]);
    px(fx2,fy2,9,1,K); px(fx2,fy2+8,9,1,K); px(fx2,fy2,1,9,K); px(fx2+8,fy2,1,9,K);
    px(fx2+1,fy2+1,7,1,'rgba(255,255,255,0.4)');
    const bl = Math.floor(t/2600)%9===0 && (t%2600)<130;
    px(fx2+2,fy2+3,1,bl?1:2,K); px(fx2+6,fy2+3,1,bl?1:2,K);
    if(face===2){ px(fx2+2,fy2+6,1,1,K); px(fx2+3,fy2+7,3,1,K); px(fx2+6,fy2+6,1,1,K); }
    else if(face===1){ px(fx2+3,fy2+7,3,1,K); }
    else { px(fx2+3,fy2+6,3,1,K); px(fx2+2,fy2+7,1,1,K); px(fx2+6,fy2+7,1,1,K); }
    statBar(24,226,40,p.hygiene,'#7ac74f','LIMPIO',t,dt);
    drawText('PESO '+p.weight+'KG', 72, 226, p.weight>40 ? '#a03030' : K);
    const dias = p.hatchedAt ? Math.floor((Date.now()-p.hatchedAt)/(24*3600*1000))+1 : 0;
    drawText('EDAD '+dias+'D', 72, 233, 'rgba(26,20,40,0.55)');
    drawText('NV'+p.level, 124, 226, '#8a6a10');
    drawText('♥'+(G.bond||0), 124, 233, '#e2574c');
    if(p.sick && Math.floor(t/400)%2===0) drawText('MALITO', 72, 233, '#3a7048');
  } else if(p.stage===STAGES.EGG){
    const left = Math.max(0, T_HATCH-(Date.now()-p.bornAt));
    const k = Math.min(1, Math.max(p.tapsOnEgg/15, 1-left/T_HATCH));
    drawText('ECLOSION', 8, 227, K);
    fancyBar(44, 228, 108, 4, 'egg', k*100, '#ffd94a', dt, t);
    drawTextC('TOCA EL HUEVO PARA DARLE CALOR', 80, 235, 'rgba(26,20,40,0.5)');
  } else {
    const m = Math.max(0, Math.ceil((p.exped.until-Date.now())/60000));
    drawTextC('DE EXPEDICION · VUELVE EN '+(m>=60? Math.ceil(m/60)+'H' : m+'M'), 80, 229, 'rgba(26,20,40,0.6)');
  }

  const ACC = ['#e2574c','#f0a04b','#5ec8d8','#8a6ae8','#ffd94a','#7ac74f'];
  const activeBtn = ({feed:0, play:1, games:1, train:1, discos:1, exped:1,
    shop:4, stats:5, album:5, ach:5, relics:5, beast:5, evotree:5, ascendConfirm:5})[UI.mode];
  for(let i=0;i<6;i++){
    const bx = 5 + i*26;
    const hot = UI.flashBtn===i && performance.now()<UI.flashUntil;
    if(hot && UI.btnAt[i] < UI.flashUntil-150) UI.btnAt[i] = UI.flashUntil-150;
    const act = activeBtn===i;
    /* la acción que hace falta te llama: borde dorado y aviso */
    const hinted = UI.hintBtn && UI.hintBtn.i===i && performance.now()<UI.hintBtn.until;
    const urgent = hinted || (i===0 && p.hunger<25) || (i===1 && p.happy<25) ||
                   (i===2 && G.poops.some(pp=>(pp.zone||'prado')===G.zone)) || (i===3 && p.energy<15 && !p.sleeping);
    const pulse = urgent && !act && Math.floor(t/320)%2===0;
    const sq = springSquash(UI.btnAt[i], 0.22);
    const press = hot ? 2 : 0;
    const by = BTN_Y + press + (urgent && !act ? Math.round(Math.abs(Math.sin(t/200))*-1.5) : 0);
    /* sombra sólida (botón físico) */
    px(bx+1, BTN_Y+BTN_S, BTN_S-2, 2, 'rgba(26,20,40,0.35)');
    const bg = hot ? '#ffd94a' : (act ? '#fff3d0' : '#f6efe0');
    const w2 = Math.round(BTN_S*sq[0]), h2 = Math.round(BTN_S*sq[1]);
    const ox = bx + Math.round((BTN_S-w2)/2), oy = by + (BTN_S-h2);
    px(ox+1, oy, w2-2, h2, bg);
    px(ox, oy+1, w2, h2-2, bg);
    const bc = act ? '#8a6a10' : (pulse ? '#ffd94a' : K);
    px(ox+1, oy, w2-2, 1, bc); px(ox+1, oy+h2-1, w2-2, 1, bc);
    px(ox, oy+1, 1, h2-2, bc); px(ox+w2-1, oy+1, 1, h2-2, bc);
    px(ox+1, oy+1, w2-2, 1, '#fffaf0');
    px(ox+2, oy+h2-3, w2-4, 2, ACC[i]);
    ctx.drawImage(IC[BTNS[i].ic], ox+Math.round((w2-IC[BTNS[i].ic].width)/2), oy+4);
    if(pulse) drawTextOC('!', bx+11, BTN_Y-10, '#ffd94a');
  }
  if(UI.flashBtn>=0 && performance.now()<UI.flashUntil+900){
    const age = performance.now() - (UI.flashUntil-150);
    const jy = age<180 ? Math.round(-2*Math.sin(age/180*Math.PI)) : 0;
    drawTextC(BTNS[UI.flashBtn].label, 80, 265+jy, K);
  }
}
/* ---- cinta de OBJETIVO: siempre sabes qué hacer ahora ---- */
function drawGoalRibbon(t){
  if(!G.goal && typeof currentGoal!=='function') return;
  const now = performance.now();
  const since = UI.goalDoneAt ? now - UI.goalDoneAt : 1e9;
  const x0 = 4, y0 = 22, w = 152, h = 10;
  /* recién cumplido: la cinta se vuelve dorada con ✓ y luego entra la siguiente */
  if(since < 1600 && G.goal && G.goal.lastT){
    const k = ease.outBack(clamp01(since/220));
    const jy = Math.round((1-k)*-4);
    px(x0, y0+jy, w, h, '#ffd94a'); px(x0, y0+jy, w, 1, '#fff8d0'); px(x0, y0+h-1+jy, w, 1, '#c8a04b');
    drawTextC('★ '+G.goal.lastT+(G.goal.lastM?'  +'+G.goal.lastM+'✦':''), 80, y0+3+jy, K);
    return;
  }
  const g = currentGoal();
  const inK = ease.outBack(clamp01((since-1600)/300));
  const ox = Math.round((1-inK)*-160);
  const pr = goalProgress(g);
  ctx.globalAlpha = 0.9;
  px(x0+ox, y0, w, h, '#20243c');
  ctx.globalAlpha = 1;
  px(x0+ox, y0, w, 1, 'rgba(255,255,255,0.12)');
  if(pr){
    const f = Math.max(0, Math.min(1, pr[0]/Math.max(1,pr[1])));
    px(x0+ox+1, y0+h-2, Math.round((w-2)*f), 1, '#7ac74f');
  }
  /* flecha que late: "esto es lo siguiente" */
  const nud = Math.round(Math.abs(Math.sin(t/300))*1.5);
  drawText('>', x0+ox+3+nud, y0+2, '#ffd94a');
  let txt = g.t;
  if(pr && !g.xpBar) txt += ' '+Math.min(pr[0],pr[1])+'/'+pr[1];
  drawText(txt.length>34 ? txt.slice(0,34) : txt, x0+ox+10, y0+2, '#ffffff');
  UI.goalRect = {x:x0, y:y0, w, h};
}
/* aviso: cinta que cae desde el HUD con rebote y se recoge al irse */
function toastTone(s){
  if(/ROBO|SE FUE|MALITO|FALTAN|SIN ENERGIA|DERROTA|NO PUEDE|HUYE|OH NO|CUIDADO|HAMBRE/.test(s)) return '#e2574c';
  if(/^¡|LOGRO|NIVEL|REGALO|DESEO|BOTIN|NUEVO/.test(s)) return '#ffd94a';
  return '#5ec8d8';
}
function wrapToast(s){
  if(textW(s)<=144) return [s];
  const words = s.split(' '); const L = ['',''];
  for(const w of words){
    const tgt = textW((L[0]+' '+w).trim())<=144 && !L[1] ? 0 : 1;
    L[tgt] = (L[tgt]+' '+w).trim();
  }
  return L;
}
function drawToast(t){
  /* en una cinemática los avisos esperan (congelados) a que termine */
  const pdt = Math.min(100, t-(UI.toastT||t)); UI.toastT = t;
  if(sceneFamily(UI.mode)==='cine' || UI.mode==='eggArrive'){ if(UI.msg){ UI.msgAt += pdt; UI.msgUntil += pdt; } return; }
  toastTick();
  if(!UI.msg) return;
  const now = performance.now();
  const age = now-(UI.msgAt||0), left = UI.msgUntil-now;
  if(left < -180) return;
  const inK = ease.outBack(clamp01(age/260));
  const outK = left<0 ? clamp01(-left/180) : 0;
  const lines = wrapToast(UI.msg);
  const h = 9 + lines.length*7;
  const wdt = Math.max(...lines.map(textW))+14;
  const tx = Math.round(80-wdt/2);
  /* con un menú abierto el aviso sube desde abajo (no tapa el título) */
  const low = UI.toastY!==undefined ? null : (MENU_DRAW[UI.mode] || offlineReport || UI.expReport || sceneFamily(UI.mode)!=='world');
  const baseY = UI.toastY!==undefined ? UI.toastY : (low ? 252 - h : (sceneFamily(UI.mode)==='world' ? 35 : 248 - h));
  const ty = low ? Math.round(baseY + (1-inK)*16 + outK*14) : Math.round(baseY - (1-inK)*16 - outK*14);
  ctx.globalAlpha = 1-outK;
  const acc = toastTone(UI.msg);
  px(tx+1, ty+h, wdt-1, 1, 'rgba(0,0,0,0.4)');
  px(tx, ty-1, wdt, 1, 'rgba(246,239,224,0.9)');
  px(tx, ty+h-1, wdt, 1, 'rgba(246,239,224,0.9)');
  px(tx-1, ty, 1, h-1, 'rgba(246,239,224,0.9)');
  px(tx+wdt, ty, 1, h-1, 'rgba(246,239,224,0.9)');
  px(tx, ty, wdt, h-1, '#20243c');
  px(tx, ty, wdt, 1, 'rgba(255,255,255,0.12)');
  px(tx+1, ty+1, 2, h-3, acc);
  /* destello de entrada */
  if(age<160){ ctx.globalAlpha = (1-age/160)*0.6*(1-outK); px(tx, ty, wdt, h-1, '#ffffff'); ctx.globalAlpha = 1-outK; }
  lines.forEach((l,i)=>drawTextC(l, 80+2, ty+3+i*7, '#ffffff'));
  /* barrita de tiempo */
  const tot = UI.msgUntil-UI.msgAt;
  if(tot>0 && left>0) px(tx+4, ty+h-3, Math.round((wdt-8)*left/tot), 1, 'rgba(255,255,255,0.18)');
  ctx.globalAlpha = 1;
}

