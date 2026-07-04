"use strict";
/* =========================================================
   BITXO — render/hud: HUD, paneles y pantallas (stats, tienda, álbum...)
   ========================================================= */
function statBar(x,y,w,val,col,label){
  drawText(label, x, y, '#1a1428');
  px(x, y+7, w, 4, 'rgba(26,20,40,0.18)');
  px(x, y+7, Math.round(w*Math.max(0,Math.min(100,val))/100), 4, col);
  px(x, y+7, w, 1, 'rgba(26,20,40,0.12)');
}

/* ------ paneles: esquinas recortadas, brillo y sombra ------ */
function panel(x,y,w,h){
  px(x+2,y+h,w-2,2,'rgba(26,20,40,0.28)');
  px(x+w,y+3,1,h-2,'rgba(26,20,40,0.18)');
  px(x+1,y,w-2,h,'#e8e0c8');
  px(x,y+1,w,h-2,'#e8e0c8');
  px(x+2,y,w-4,1,K); px(x+2,y+h-1,w-4,1,K);
  px(x,y+2,1,h-4,K); px(x+w-1,y+2,1,h-4,K);
  px(x+1,y+1,1,1,K); px(x+w-2,y+1,1,1,K);
  px(x+1,y+h-2,1,1,K); px(x+w-2,y+h-2,1,1,K);
  px(x+2,y+1,w-4,1,'#f8f2e0');
  px(x+2,y+h-2,w-4,1,'#d6cdb4');
  UI.panelRect = {x,y,w,h};
}
function card(x,y,w,h,disabled){
  const bg = disabled ? '#d0c8b0' : '#f6efe0';
  px(x+1,y,w-2,h,bg); px(x,y+1,w,h-2,bg);
  px(x+1,y,w-2,1,K); px(x+1,y+h-1,w-2,1,K);
  px(x,y+1,1,h-2,K); px(x+w-1,y+1,1,h-2,K);
  if(!disabled) px(x+1,y+1,w-2,1,'#fffaf0');
}
/* chip oscuro de título: mismo baseline que el texto que sustituye */
function titleChip(cx,y,text){
  const w = textW(text)+12;
  const x = Math.round(cx-w/2);
  px(x+1,y-3,w-2,10,'#3b3552');
  px(x,y-2,1,8,'#3b3552'); px(x+w-1,y-2,1,8,'#3b3552');
  px(x+1,y-4,w-2,1,K); px(x+1,y+7,w-2,1,K);
  px(x,y-3,1,1,K); px(x+w-1,y-3,1,1,K);
  px(x,y+6,1,1,K); px(x+w-1,y+6,1,1,K);
  drawTextC(text, cx, y, '#ffe9a8');
}
/* insignia X de cierre en la esquina del panel activo */
function drawCloseBadge(){
  const r = UI.panelRect; if(!r) return;
  const bx = r.x + r.w - 6, by = r.y + 1;
  px(bx-4,by-3,11,9,'#e2574c');
  px(bx-3,by-4,9,11,'#e2574c');
  px(bx-3,by-4,9,1,K); px(bx-3,by+6,9,1,K);
  px(bx-4,by-3,1,9,K); px(bx+6,by-3,1,9,K);
  px(bx-3,by-3,9,1,'#f08a80');
  drawText('X', bx-1, by-1, '#ffffff');
  UI.closeAt = {x:bx+1, y:by+1};
}


/* ---------------- HUD / PANTALLAS v6 ---------------- */
function drawHUD(t){
  px(0,0,160,19,'rgba(14,16,48,0.62)');
  const p = AP();
  /* retrato enmarcado del bitxo activo */
  px(1,1,17,17,'#141838');
  px(1,1,17,1,'rgba(255,255,255,0.28)');
  px(1,17,17,1,'rgba(0,0,0,0.5)');
  px(1,1,1,17,'rgba(255,255,255,0.12)'); px(17,1,1,17,'rgba(0,0,0,0.3)');
  ctx.save();
  ctx.beginPath(); ctx.rect(2,2,15,15); ctx.clip();
  const ps = currentSprite();
  ctx.drawImage(ps, 2+Math.floor((15-ps.width)/2), 17-ps.height);
  ctx.restore();
  const name = p.nick || (p.stage===STAGES.EGG ? 'HUEVO '+LINES[p.line].name : currentFormDef().name);
  drawText(name, 21, 3, '#ffffff');
  drawText('LV'+p.level+' G'+p.gen, 21, 11, 'rgba(255,255,255,0.65)');
  if(G.stars>0) drawText('★'+G.stars, 52, 11, '#ffd94a');
  if(G.pets.length>1) drawText((G.sel+1)+'/'+G.pets.length, 66, 11, 'rgba(255,255,255,0.65)');
  /* motas con destello al ganar */
  if(UI.lastMotas===undefined) UI.lastMotas = G.motas;
  if(G.motas > UI.lastMotas+0.5){ UI.coinT = performance.now(); }
  UI.lastMotas = G.motas;
  const shiny = performance.now()-(UI.coinT||0) < 220;
  drawTextC('✦'+fmt(G.motas), 92, 3, shiny ? '#fff8d0' : '#ffd94a');
  const boosted = Date.now() < G.boostUntil;
  drawTextC('+'+motaRate().toFixed(1)+'/S'+(boosted?'!':''), 92, 11, boosted?'#7ac74f':'rgba(255,255,255,0.65)');
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
  px(0,19,160,2,'rgba(26,20,40,0.5)');
  px(0,19,Math.round(160*p.xp/xpNeed(p.level)),2,'#7ac74f');
  if(UPDATE_READY && Math.floor(t/500)%4!==3){
    px(28,23,104,12,'#ffd94a');
    px(28,23,104,1,K); px(28,34,104,1,K); px(28,23,1,12,K); px(131,23,1,12,K);
    drawTextC('VERSION NUEVA: TOCA', 80, 26, K);
  }

  px(0,200,160,72,'#e8e0c8');
  px(0,200,160,1,K);
  px(0,202,160,1,'rgba(26,20,40,0.2)');

  statBar(6,206,42,p.hunger,'#e2574c','HAMBRE');
  statBar(58,206,42,p.happy,'#f0a04b','ANIMO');
  statBar(110,206,44,p.energy,'#5ec8d8','PILAS');
  if(p.sleeping && Math.floor(t/600)%2===0) drawText('+', 133, 206, '#5ec8d8');

  px(6,224,148,1,'rgba(26,20,40,0.2)');

  const ACC = ['#e2574c','#f0a04b','#5ec8d8','#8a6ae8','#ffd94a','#7ac74f'];
  const activeBtn = ({feed:0, play:1, games:1, train:1, discos:1, exped:1,
    shop:4, stats:5, album:5, ach:5, relics:5, beast:5, evotree:5, ascendConfirm:5})[UI.mode];
  for(let i=0;i<6;i++){
    const bx = 5 + i*26;
    const hot = UI.flashBtn===i && performance.now()<UI.flashUntil;
    const act = activeBtn===i;
    /* la acción que hace falta te llama: borde dorado y aviso */
    const urgent = (i===0 && p.hunger<25) || (i===1 && p.happy<25) ||
                   (i===2 && G.poops.length>0) || (i===3 && p.energy<15 && !p.sleeping);
    const pulse = urgent && !act && Math.floor(t/320)%2===0;
    const by = BTN_Y + (hot?1:0);
    if(!hot) px(bx+1, BTN_Y+BTN_S, BTN_S-1, 1, 'rgba(26,20,40,0.35)');
    const bg = hot ? '#ffd94a' : (act ? '#fff3d0' : '#f6efe0');
    px(bx+1, by, BTN_S-2, BTN_S, bg);
    px(bx, by+1, BTN_S, BTN_S-2, bg);
    const bc = act ? '#8a6a10' : (pulse ? '#ffd94a' : K);
    px(bx+1, by, BTN_S-2, 1, bc); px(bx+1, by+BTN_S-1, BTN_S-2, 1, bc);
    px(bx, by+1, 1, BTN_S-2, bc); px(bx+BTN_S-1, by+1, 1, BTN_S-2, bc);
    px(bx+1, by+1, BTN_S-2, 1, '#fffaf0');
    px(bx+2, by+BTN_S-3, BTN_S-4, 2, ACC[i]);
    ctx.drawImage(IC[BTNS[i].ic], bx+5, by+4);
    if(pulse) drawTextC('!', bx+11, BTN_Y-9, '#ffd94a');
  }
  if(UI.flashBtn>=0 && performance.now()<UI.flashUntil+900){
    drawTextC(BTNS[UI.flashBtn].label, 80, 265, K);
  }
  if(UI.msg && performance.now()<UI.msgUntil){
    const age = performance.now()-(UI.msgAt||0);
    const pop = Math.min(1, age/130);
    const ty = 96 - Math.round((1-pop)*7);
    const wdt = textW(UI.msg)+12;
    const tx = 80-wdt/2;
    px(tx+1, ty+12, wdt-1, 1, 'rgba(0,0,0,0.4)');
    /* borde crema: legible sobre el cielo nocturno */
    px(tx, ty-1, wdt, 1, 'rgba(246,239,224,0.85)');
    px(tx, ty+11, wdt, 1, 'rgba(246,239,224,0.85)');
    px(tx-1, ty, 1, 11, 'rgba(246,239,224,0.85)');
    px(tx+wdt, ty, 1, 11, 'rgba(246,239,224,0.85)');
    px(tx+1, ty, wdt-2, 11, '#20243c'); px(tx, ty+1, wdt, 9, '#20243c');
    px(tx+1, ty+1, 2, 9, '#ffd94a');
    drawTextC(UI.msg, 80+2, ty+3, '#ffffff');
  }
}

function drawStats(){
  panel(8,26,144,214);
  const p = AP();
  const f = currentFormDef();
  titleChip(80, 32, p.nick || (p.stage===STAGES.EGG?'HUEVO':f.name));
  if(!p.nick && p.stage>STAGES.EGG) drawTextC('(TOCA EL NOMBRE PARA BAUTIZAR)', 80, 219, 'rgba(26,20,40,0.4)');
  drawTextC('LINEA '+LINES[p.line].name+' - '+LINES[p.line].bonus, 80, 40, 'rgba(26,20,40,0.6)');
  const stageName = ['HUEVO','BEBE','JOVEN','ADULTO'][p.stage];
  const days = p.hatchedAt ? Math.floor((Date.now()-p.hatchedAt)/(24*3600*1000))+1 : 0;
  let y = 50;
  const line = (a,b)=>{ drawText(a, 16, y, K); drawText(String(b), 88, y, K); y+=8; };
  line('ETAPA', stageName);
  line('CARACTER', p.trait||'-');
  line('EDAD', days+' DIAS');
  line('NIVEL', p.level+' ('+fmt(p.xp)+'/'+fmt(xpNeed(p.level))+')');
  drawText('PESO', 16, y, K);
  drawText(p.weight+' KG'+(p.weight>40?' ¡UF!':''), 88, y, p.weight>40?'#a03030':K); y+=8;
  line('FUE·DEF·VEL', (p.str||0)+' · '+(p.def||0)+' · '+(p.spd||0));
  line('JUEGOS', p.gamesWon);
  line('FALLOS', p.mistakes);
  line('AMISTAD', '♥'+(G.bond||0)+' (+'+Math.min(10,Math.round((G.bond||0)*0.2))+'%)');
  line('MOTAS TOT.', '✦'+fmt(G.totalMotas));
  line('ESTRELLAS', '★'+G.stars+' (+'+ (G.stars*10) +'%)');
  y+=2;
  const bar=(label,val,col)=>{
    drawText(label,16,y,K);
    px(56,y,80,5,'rgba(26,20,40,0.15)');
    px(56,y,Math.round(80*val/100),5,col);
    y+=8;
  };
  bar('HAMBRE',p.hunger,'#e2574c');
  bar('ANIMO',p.happy,'#f0a04b');
  bar('PILAS',p.energy,'#5ec8d8');
  bar('LIMPIO',p.hygiene,'#7ac74f');
  card(4,170,28,13);  drawTextC('ALBUM', 18, 174, K);
  card(34,170,28,13); drawTextC('LOGRO', 48, 174, K);
  card(64,170,28,13); drawTextC('RELIQ', 78, 174, K);
  card(94,170,28,13); drawTextC('BESTIA', 108, 174, K);
  card(124,170,30,13); drawTextC('DIARIO', 139, 174, K);
  if(canAscend()){
    card(28,186,104,16);
    drawTextC('★ ASCENDER ★', 80, 191, '#8a6a10');
  } else if(p.stage===STAGES.ADULT){
    drawTextC('ASCENSO AL NIVEL 8', 80, 191, 'rgba(26,20,40,0.45)');
  } else {
    const nx = predictNext(p);
    if(nx){
      const mins = Math.ceil(nx.when/60000);
      const tt = nx.when<=1000 ? 'AL CAER...' : (mins>=60 ? 'EN '+Math.floor(mins/60)+'H '+(mins%60)+'M' : 'EN '+mins+'M');
      drawTextC((p.stage===STAGES.EGG?'ECLOSIONA ':'EVOLUCIONA ')+tt, 80, 187, '#8a6a10');
      if(nx.key){
        const known = !!G.dex[nx.key];
        const lvTxt = nx.lvl ? ' · NV'+p.level+'/'+nx.lvl : '';
        drawTextC('RUMBO: '+(known ? nameOfKey(nx.key) : '?????')+lvTxt, 80, 195, 'rgba(26,20,40,0.6)');
      }
    } else {
      drawTextC('CRECERA... TEN PACIENCIA', 80, 191, 'rgba(26,20,40,0.45)');
    }
  }
  card(8,206,34,14); drawTextC('COPIA', 25, 210, K);
  card(45,206,34,14); drawTextC('CARGA', 62, 210, K);
  card(82,206,34,14); drawTextC('FOTO', 99, 210, K);
  card(119,206,34,14); drawTextC('ARO', 136, 210, G.slowRing ? '#8a6a10' : K);
  drawTextC('TOCA PARA VOLVER', 80, 228, 'rgba(26,20,40,0.5)');
}

function drawShop(){
  panel(4,38,152,178);
  titleChip(64, 42, 'TIENDA');
  drawText('✦'+fmt(G.motas), 116, 42, '#8a6a10');
  const tab = UI.shopTab||0;
  const tabBtn = (x,label,on)=>{
    px(x,50,35,11, on?'#ffd94a':'#d8d0ba');
    px(x,50,35,1,K); px(x,60,35,1,K); px(x,50,1,11,K); px(x+34,50,1,11,K);
    drawTextC(label, x+18, 53, K);
  };
  tabBtn(8,'MEJORA',tab===0);
  tabBtn(45,'JUGUETE',tab===1);
  tabBtn(82,'GORROS',tab===2);
  tabBtn(119,'PRADO',tab===3);
  /* lista con scroll: se desliza con el dedo y se recorta al panel */
  const sc = Math.min(UI.shopScroll||0, shopMaxScroll());
  UI.shopScroll = sc;
  ctx.save();
  ctx.beginPath(); ctx.rect(5,63,150,145); ctx.clip();
  ctx.translate(0, -sc);
  if(tab===0){
    for(let i=0;i<SHOP.length;i++){
      const item = SHOP[i];
      const lvl = G.up[item.id];
      const maxed = lvl>=item.max || (item.id==='nido' && G.pets.length>=3);
      const cost = maxed? 0 : upCost(item, lvl);
      const afford = G.motas>=cost && !maxed;
      const y = 64 + i*19;
      const flash = UI.shopFlash[item.id] && performance.now()-UI.shopFlash[item.id]<250;
      px(10,y,140,17, flash ? '#ffd94a' : (afford ? '#f6efe0' : '#d8d0ba'));
      px(10,y,140,1,K); px(10,y+16,140,1,K); px(10,y,1,17,K); px(149,y,1,17,K);
      drawText(item.name, 14, y+2, K);
      drawText(item.desc, 14, y+9, 'rgba(26,20,40,0.55)');
      if(maxed) drawText('MAX', 124, y+5, '#3a7048');
      else {
        drawText('✦'+fmt(cost), 112, y+2, afford ? '#8a6a10' : '#a03030');
        drawText('LV'+lvl, 112, y+9, 'rgba(26,20,40,0.55)');
      }
    }
  } else if(tab===1){
    for(let i=0;i<TOYS.length;i++){
      const T = TOYS[i];
      const owned = !!G.toys[T.id];
      const afford = G.motas>=T.cost && !owned;
      const y = 64 + i*20;
      const flash = UI.shopFlash[T.id] && performance.now()-UI.shopFlash[T.id]<250;
      px(10,y,140,18, flash ? '#ffd94a' : (owned? '#d0e8d0' : (afford?'#f6efe0':'#d8d0ba')));
      px(10,y,140,1,K); px(10,y+17,140,1,K); px(10,y,1,18,K); px(149,y,1,18,K);
      if(T.id==='pelota') ctx.drawImage(SPR.pelota, 14, y+5);
      else if(T.id==='caja') ctx.drawImage(SPR.caja, 13, y+5);
      else if(T.id==='banera') ctx.drawImage(SPR.banera, 12, y+6);
      else if(T.id==='tambor') ctx.drawImage(SPR.tambor, 13, y+5);
      else if(T.id==='columpio'){ px(14,y+5,1,8,'#5a4632'); px(23,y+5,1,8,'#5a4632'); px(12,y+4,13,2,'#8a6a3a'); px(16,y+11,6,2,'#8a6a3a'); }
      else if(T.id==='huerto'){ px(12,y+11,14,3,'#5a4632'); px(17,y+6,2,5,'#57a05e'); px(20,y+7,3,3,'#e2574c'); }
      else if(T.id==='cometa'){ px(17,y+4,3,3,'#e2574c'); px(15,y+6,3,3,'#e2574c'); px(19,y+6,3,3,'#ffd94a'); px(17,y+8,3,3,'#e2574c'); px(15,y+11,2,2,'#f0a04b'); px(19,y+12,2,2,'#f0a04b'); }
      else if(T.id==='fuente'){ px(13,y+11,13,3,'#9a9aa4'); px(17,y+6,4,5,'#8a8a94'); px(16,y+4,6,2,'#5e9be0'); px(14,y+7,2,3,'#9adcf0'); px(23,y+7,2,3,'#9adcf0'); }
      else if(T.id==='robot'){ px(15,y+5,8,7,'#8a8a94'); px(17,y+7,2,2,'#5ec8d8'); px(20,y+7,1,2,'#5ec8d8'); px(14,y+12,10,2,'#3a3448'); }
      drawText(T.name, 30, y+3, K);
      drawText(T.desc, 30, y+10, 'rgba(26,20,40,0.55)');
      if(owned) drawText('TUYO', 124, y+6, '#3a7048');
      else drawText('✦'+fmt(T.cost), 118, y+6, afford?'#8a6a10':'#a03030');
    }
  } else if(tab===2){
    for(let i=0;i<HATS.length;i++){
      const H = HATS[i];
      const owned = !!G.hats[H.id];
      const worn = AP().hat===H.id;
      const afford = G.motas>=H.cost && !owned && !H.buhoOnly;
      const x = 10 + (i%2)*71, y = 64 + Math.floor(i/2)*25;
      const flash = UI.shopFlash[H.id] && performance.now()-UI.shopFlash[H.id]<250;
      px(x,y,69,22, flash ? '#ffd94a' : (worn ? '#ffe9a8' : (owned ? '#d0e8d0' : (afford?'#f6efe0':'#d8d0ba'))));
      px(x,y,69,1,K); px(x,y+21,69,1,K); px(x,y,1,22,K); px(x+68,y,1,22,K);
      const hs = SPR['hat_'+H.id];
      const secretH = (H.buhoOnly || H.towerOnly) && !owned;
      if(!secretH) ctx.drawImage(hs, x+9-Math.floor(hs.width/2), y+Math.round((22-hs.height)/2));
      else drawText('?', x+7, y+8, 'rgba(26,20,40,0.45)');
      drawText(!secretH ? H.name : '?????', x+19, y+3, K);
      if(worn) drawText('PUESTO', x+19, y+12, '#8a6a10');
      else if(owned) drawText('TUYO', x+19, y+12, '#3a7048');
      else if(H.buhoOnly) drawText('BUHONERO', x+19, y+12, 'rgba(26,20,40,0.45)');
      else if(H.towerOnly) drawText('LA TORRE', x+19, y+12, 'rgba(26,20,40,0.45)');
      else drawText('✦'+fmt(H.cost), x+19, y+12, afford?'#8a6a10':'#a03030');
    }
  } else if(tab===3){
    G.decor = G.decor || {owned:{}, flores:'clasico'};
    for(let i=0;i<DECOR.length;i++){
      const D = DECOR[i];
      const owned = !!G.decor.owned[D.id];
      const active = D.kind==='flores' ? G.decor.flores===D.val : !!G.decor[D.id];
      const afford = G.motas>=D.cost && !owned;
      const y = 64 + i*22;
      const flash = UI.shopFlash[D.id] && performance.now()-UI.shopFlash[D.id]<250;
      px(10,y,140,19, flash ? '#ffd94a' : (owned ? (active ? '#ffe9a8' : '#d0e8d0') : (afford?'#f6efe0':'#d8d0ba')));
      px(10,y,140,1,K); px(10,y+18,140,1,K); px(10,y,1,19,K); px(149,y,1,19,K);
      drawText(D.name, 14, y+3, K);
      drawText(D.desc, 14, y+11, 'rgba(26,20,40,0.55)');
      if(owned) drawText(active ? 'PUESTO' : 'TUYO', 118, y+6, active ? '#8a6a10' : '#3a7048');
      else drawText('✦'+fmt(D.cost), 118, y+6, afford?'#8a6a10':'#a03030');
    }
  }
  ctx.restore();
  /* barrita de scroll cuando hay más de lo que cabe */
  if(shopMaxScroll()>0){
    const vh = 145, ch = shopContentH();
    const bh = Math.max(10, Math.round(vh*vh/ch));
    const by = 64 + Math.round((vh-bh) * (sc/shopMaxScroll()));
    px(152, 64, 2, vh, 'rgba(26,20,40,0.12)');
    px(152, by, 2, bh, 'rgba(26,20,40,0.4)');
  }
  if(tab===2) drawTextC('TOCA PARA PONER O QUITAR', 80, 210, 'rgba(26,20,40,0.45)');
  if(tab===3) drawTextC('TU PRADO, A TU GUSTO', 80, 210, 'rgba(26,20,40,0.45)');
  drawTextC('TOCA FUERA PARA SALIR', 80, 222, 'rgba(26,20,40,0.55)');
}

function drawAscendConfirm(){
  panel(12,86,136,104);
  drawTextC('¿ASCENDER A '+currentFormDef().name+'?', 80, 94, K);
  drawTextC('SE CONVERTIRA EN', 80, 108, K);
  drawTextC('ESTRELLA ETERNA', 80, 116, K);
  drawTextC('GANAS ★'+ascendStars()+' (+'+(ascendStars()*10)+'% SIEMPRE)', 80, 128, '#8a6a10');
  drawTextC('SE VA, LO DEMAS SE QUEDA', 80, 140, '#a03030');
  card(24,152,52,20); drawTextC('SI ★', 50, 159, K);
  card(84,152,52,20); drawTextC('NO', 110, 159, K);
}

function drawParqueConfirm(){
  panel(12,82,136,112);
  titleChip(80, 88, 'EL SENDERO');
  drawTextC('¿ABRIR EL PARQUE?', 80, 102, K);
  drawTextC('LOS JUGUETES DE JUGAR', 80, 116, 'rgba(26,20,40,0.6)');
  drawTextC('SE MUDAN ALLI', 80, 124, 'rgba(26,20,40,0.6)');
  drawTextC('CUESTA ✦'+ZONES.parque.cost, 80, 138, G.motas>=ZONES.parque.cost ? '#8a6a10' : '#a03030');
  card(24,152,52,20); drawTextC('¡SI!', 50, 159, '#3a7048');
  card(84,152,52,20); drawTextC('AUN NO', 110, 159, K);
}

function drawHuertaConfirm(){
  panel(12,82,136,112);
  titleChip(80, 88, 'EL SENDERO');
  drawTextC('¿ABRIR LA HUERTA?', 80, 102, K);
  drawTextC('HUERTO, FUENTE Y BANERA', 80, 116, 'rgba(26,20,40,0.6)');
  drawTextC('SE MUDAN ALLI', 80, 124, 'rgba(26,20,40,0.6)');
  drawTextC('CUESTA ✦'+ZONES.huerta.cost, 80, 138, G.motas>=ZONES.huerta.cost ? '#8a6a10' : '#a03030');
  card(24,152,52,20); drawTextC('¡SI!', 50, 159, '#3a7048');
  card(84,152,52,20); drawTextC('AUN NO', 110, 159, K);
}

/* ---------------- ¿QUIÉN VIENE? (viaje entre zonas) ---------------- */
function drawTravelPick(){
  const dest = UI.travelDest;
  const opts = travelOptions(dest);
  panel(14, 56, 132, 46 + (opts.length+1)*27 + 10);
  titleChip(80, 62, '¿QUIEN VIENE?');
  drawTextC('RUMBO: '+ZONES[dest].name, 80, 74, 'rgba(26,20,40,0.6)');
  let y = 86;
  for(const o of opts){
    card(22, y, 116, 23, !!o.block);
    const frames = SPR[o.p.form==='grimo' ? 'grimo' : o.p.line+'_'+(o.p.form||'babyA')];
    const spr = frames[0];
    const sc = Math.min(1, 17/Math.max(spr.width, spr.height));
    ctx.save();
    ctx.translate(34, y+12);
    ctx.scale(sc, sc);
    ctx.drawImage(spr, -spr.width/2, -spr.height/2);
    ctx.restore();
    drawText(petName(o.p), 48, y+4, o.block ? 'rgba(26,20,40,0.5)' : K);
    if(o.block) drawText(o.block, 48, y+13, '#a03030');
    else drawText('LV'+o.p.level, 48, y+13, 'rgba(26,20,40,0.55)');
    y += 27;
  }
  card(22, y, 116, 23);
  drawTextC('VOY YO SOLO', 80, y+8, K);
  drawTextC('TOCA FUERA: TE QUEDAS', 80, y+31, 'rgba(26,20,40,0.5)');
}

function drawFeedMenu(){
  panel(6,32,148,200);
  titleChip(62, 37, 'DESPENSA');
  drawText('✦'+fmt(G.motas), 112, 37, '#8a6a10');
  for(let i=0;i<FOODS.length;i++){
    const F = FOODS[i];
    const col = i%2, row = Math.floor(i/2);
    const cx = 10 + col*72, cy = 46 + row*42;
    const afford = G.motas>=F.cost;
    px(cx,cy,68,39, afford?'#f6efe0':'#d8d0ba');
    px(cx,cy,68,1,K); px(cx,cy+38,68,1,K); px(cx,cy,1,39,K); px(cx+67,cy,1,39,K);
    const spr = SPR[F.spr];
    ctx.drawImage(spr, cx+4, cy+Math.round((39-spr.height)/2));
    drawText(F.name, cx+17, cy+4, K);
    drawText('✦'+F.cost, cx+17, cy+13, afford?'#8a6a10':'#a03030');
    drawText(F.desc, cx+17, cy+22, 'rgba(26,20,40,0.55)');
    if(FAVES[AP().line]===F.id) drawText('♥', cx+58, cy+3, '#f2a2b8');
  }
  /* medicina: solo brilla si alguien está malito */
  const enfermo = AP().sick;
  px(10,216,140,13, enfermo ? '#d8f0d0' : '#d8d0ba');
  px(10,216,140,1,K); px(10,228,140,1,K); px(10,216,1,13,K); px(149,216,1,13,K);
  px(14,219,7,7,'#8ac77a'); px(16,218,3,2,'#8ac77a'); px(17,222,1,1,'#3a7048');
  drawText('MEDICINA', 26, 219, enfermo ? K : 'rgba(26,20,40,0.45)');
  drawText(enfermo ? '¡LO CURA!' : 'NADIE ENFERMO', 66, 219, enfermo ? '#3a7048' : 'rgba(26,20,40,0.4)');
  drawText('✦'+COST_MEDICINA, 126, 219, enfermo ? '#8a6a10' : 'rgba(26,20,40,0.4)');
}
function drawPlayMenu(){
  panel(20,62,120,178);
  titleChip(80, 68, '¿QUE HACEIS?');
  const cat = (y, ic, name, sub, accent, locked)=>{
    card(26,y,108,34, locked);
    px(27,y+1,3,32, locked ? 'rgba(26,20,40,0.2)' : accent);
    if(ic) ctx.drawImage(IC[ic], 34, y+11);
    drawText(name, 52, y+8, locked ? 'rgba(26,20,40,0.5)' : K);
    drawText(sub, 52, y+18, 'rgba(26,20,40,0.55)');
    if(!locked) drawText('>', 124, y+13, accent);
  };
  cat(80,  'gym',  'GYM',        'FUE · DEF · VEL',   '#e2574c');
  cat(118, 'play', 'JUEGOS',     'PREMIOS Y RECORDS', '#f0a04b');
  cat(156, 'map',  'EXPLORACION','TESOROS LEJANOS',   '#7ac74f');
  const towerLocked = G.battlesWon < TOWER.unlockWins;
  cat(194, null, 'LA TORRE', towerLocked ? 'GANA '+TOWER.unlockWins+' COMBATES' : 'RETO DE 5 PISOS', '#8a6ae8', towerLocked);
  /* torrecita dibujada */
  px(36,197,10,26,'#9a9aa4'); px(36,197,10,1,K); px(35,196,12,2,'#6a6a78');
  px(34,194,3,3,'#6a6a78'); px(40,194,3,3,'#6a6a78'); px(45,194,3,3,'#6a6a78');
  px(39,205,4,6,'#3a3448'); px(38,214,2,2,'#3a3448'); px(42,214,2,2,'#3a3448');
  drawTextC('TOCA FUERA PARA SALIR', 80, 233, 'rgba(26,20,40,0.5)');
}

/* ---------------- LA TORRE DEL PRADO ---------------- */
function drawTower(){
  panel(14,56,132,158);
  titleChip(80, 62, 'LA TORRE DEL PRADO');
  /* la torre con pisos iluminados */
  const floor = G.tower ? G.tower.floor : 0;
  for(let f=0; f<5; f++){
    const y = 176 - f*18;
    const lit = G.tower && floor > f;
    const cur = G.tower && floor === f+1;
    px(28, y, 26, 16, lit ? '#ffe9a8' : (cur ? '#f6efe0' : '#b8b2a0'));
    px(28, y, 26, 1, K); px(28, y+15, 26, 1, K); px(28, y, 1, 16, K); px(53, y, 1, 16, K);
    drawTextC(String(f+1), 41, y+5, cur ? '#a03030' : K);
    if(f===4){ px(30,y-4,22,4,'#8a6ae8'); px(30,y-4,22,1,K); }
  }
  if(!G.tower){
    drawText('5 COMBATES SEGUIDOS', 62, 92, K);
    drawText('LA VIDA NO SE CURA', 62, 102, 'rgba(26,20,40,0.6)');
    drawText('(SOLO UN RESPIRO', 62, 110, 'rgba(26,20,40,0.6)');
    drawText('ENTRE PISOS)', 62, 118, 'rgba(26,20,40,0.6)');
    drawText('PISO 3: MOTAS', 62, 132, '#8a6a10');
    drawText('PISO 5: RELIQUIA', 62, 140, '#8a6a10');
    drawText('Y EL LAUREL', 62, 148, '#8a6a10');
    const cool = Date.now() < (G.towerNextAt||0);
    card(60,160,80,18, cool);
    if(cool){
      const mns = Math.ceil((G.towerNextAt-Date.now())/60000);
      drawTextC('ABRE EN '+(mns>=60? Math.ceil(mns/60)+'H' : mns+'M'), 100, 166, 'rgba(26,20,40,0.5)');
    } else {
      drawTextC('ENTRAR ✦'+TOWER.fee, 100, 166, G.motas>=TOWER.fee ? '#8a6a10' : '#a03030');
    }
    drawTextC('TOCA FUERA PARA SALIR', 80, 202, 'rgba(26,20,40,0.5)');
  } else {
    drawText('PISO '+G.tower.floor+' DE 5', 62, 92, K);
    const p = AP();
    const hpTxt = G.tower.php==null ? 'VIDA COMPLETA' : 'VIDA: '+Math.ceil(G.tower.php);
    drawText(hpTxt, 62, 104, G.tower.php!=null && G.tower.php<15 ? '#a03030' : '#3a7048');
    drawText('PILAS: '+Math.round(p.energy), 62, 114, p.energy<12 ? '#a03030' : K);
    card(60,130,80,18);
    drawTextC('¡AL PISO '+G.tower.floor+'!', 100, 136, '#a03030');
    card(60,152,80,14);
    drawTextC('RENDIRSE', 100, 156, 'rgba(26,20,40,0.55)');
    drawText('SI PIERDES,', 62, 172, 'rgba(26,20,40,0.5)');
    drawText('ESTAS FUERA', 62, 180, 'rgba(26,20,40,0.5)');
    drawTextC('TOCA FUERA PARA SALIR', 80, 202, 'rgba(26,20,40,0.5)');
  }
}

/* ---------------- DINASTIA ---------------- */
function drawLegacy(){
  panel(8,30,144,214);
  titleChip(80, 35, 'DINASTIA ★'+G.stars);
  const L = G.legacy||[];
  if(L.length===0){
    drawTextC('AUN NADIE HA ASCENDIDO', 80, 110, 'rgba(26,20,40,0.55)');
    drawTextC('CRIA UN ADULTO AL NIVEL 8', 80, 122, 'rgba(26,20,40,0.45)');
    drawTextC('Y TOCA ASCENDER EN DATOS', 80, 130, 'rgba(26,20,40,0.45)');
  } else {
    const show = L.slice(-9).reverse();
    for(let i=0;i<show.length;i++){
      const e = show[i];
      const y = 46 + i*20;
      px(13,y,134,18,'#f6efe0');
      px(13,y,134,1,K); px(13,y+17,134,1,K); px(13,y,1,18,K); px(146,y,1,18,K);
      const spr = SPR[e.key] ? SPR[e.key][0] : SPR.grimo[0];
      const sc = Math.min(1, 14/Math.max(spr.width,spr.height));
      ctx.save(); ctx.translate(22, y+9); ctx.scale(sc,sc);
      ctx.drawImage(spr, -spr.width/2, -spr.height/2);
      ctx.restore();
      drawText(e.name, 32, y+2, K);
      drawText('LV'+e.lv+' · GEN '+e.gen, 32, y+10, 'rgba(26,20,40,0.55)');
      drawText('+'+(e.stars||1)+'★', 122, y+6, '#8a6a10');
    }
    if(L.length>9) drawTextC('...Y '+(L.length-9)+' MAS EN EL CIELO', 80, 232, 'rgba(26,20,40,0.45)');
  }
  drawTextC('SU LUZ GUIA A LOS QUE VIENEN', 80, 235, 'rgba(26,20,40,0.5)');
}

/* ---------------- SALA DE JUEGOS ---------------- */
function drawGames(){
  panel(6,54,148,166);
  titleChip(80, 60, 'SALA DE JUEGOS');
  G.best = G.best||{};
  for(let i=0;i<MINIGAMES.length;i++){
    const M = MINIGAMES[i];
    const owned = !M.gkey || !!G.games[M.gkey];
    const cx = 10 + (i%3)*47, cy = 72 + Math.floor(i/3)*62;
    card(cx, cy, 44, 58, !owned);
    px(cx+1, cy+1, 42, 14, owned ? M.col : 'rgba(26,20,40,0.15)');
    drawTextC(M.glyph, cx+22, cy+5, owned ? '#ffffff' : 'rgba(26,20,40,0.4)');
    drawTextC(M.name, cx+22, cy+20, owned ? K : 'rgba(26,20,40,0.55)');
    if(owned){
      drawTextC(M.sub, cx+22, cy+30, 'rgba(26,20,40,0.55)');
      const best = G.best[M.id]||0;
      drawTextC(best>0 ? 'REC '+best : 'SIN REC', cx+22, cy+42, best>0 ? '#8a6a10' : 'rgba(26,20,40,0.35)');
    } else {
      drawTextC('✦'+M.cost, cx+22, cy+32, G.motas>=M.cost ? '#8a6a10' : '#a03030');
      drawTextC('COMPRAR', cx+22, cy+44, 'rgba(26,20,40,0.55)');
    }
  }
  drawTextC('LOS JUEGOS TAMBIEN ENTRENAN', 80, 200, 'rgba(26,20,40,0.5)');
  drawTextC('TOCA FUERA PARA SALIR', 80, 210, 'rgba(26,20,40,0.5)');
}
function drawExped(){
  panel(8,44,144,168);
  titleChip(80, 49, 'EXPEDICION');
  drawTextC('DESTINO PARA '+currentNameOf(AP()), 80, 58, 'rgba(26,20,40,0.6)');
  const mult = (1+0.3*G.ascensions)*legacyMult();
  for(let i=0;i<EXPEDS.length;i++){
    const E = EXPEDS[i], y = 66+i*28;
    px(14,y,132,25,'#f6efe0');
    px(14,y,132,1,K); px(14,y+24,132,1,K); px(14,y,1,25,K); px(145,y,1,25,K);
    drawText(E.name, 18, y+2, K);
    drawText(E.mins>=60? (E.mins/60)+'H' : E.mins+'M', 126, y+2, '#8a6a10');
    drawText('~'+fmt(Math.round(E.motas*mult))+'✦ RELIQ '+Math.round(E.relic*100)+'%', 18, y+10, 'rgba(26,20,40,0.6)');
    if(E.egg) drawText('HUEVO '+LINES[E.egg].name+' '+Math.round(E.eggP*100)+'%', 18, y+18, '#a03030');
    else drawText('VIAJE TRANQUILO', 18, y+18, 'rgba(26,20,40,0.4)');
  }
  drawTextC('TOCA FUERA PARA SALIR', 80, 204, 'rgba(26,20,40,0.5)');
}
function drawRelics(){
  panel(4,26,152,196);
  let n=0; for(const r of RELICS) if(G.relics[r.id]) n++;
  titleChip(80, 31, 'RELIQUIAS '+n+'/'+RELICS.length);
  for(let i=0;i<RELICS.length;i++){
    const r = RELICS[i], got = !!G.relics[r.id];
    const y = 42 + i*17;
    px(10,y,140,15, got?'#f6efe0':'#d8d0ba');
    px(10,y,140,1,K); px(10,y+14,140,1,K); px(10,y,1,15,K); px(149,y,1,15,K);
    drawText(got? r.name : '?????', 14, y+2, got? K : 'rgba(26,20,40,0.45)');
    drawText(r.desc, 14, y+9, got? '#3a7048' : 'rgba(26,20,40,0.45)');
  }
  drawTextC('EXPLORA Y VENCE JEFES', 80, 215, 'rgba(26,20,40,0.5)');
}
function drawExpReport(){
  const r = UI.expReport;
  panel(12,74,136,116);
  drawTextC('¡'+r.name+' HA VUELTO!', 80, 82, K);
  drawTextC('DEL '+r.dest, 80, 92, 'rgba(26,20,40,0.6)');
  let y = 106;
  drawTextC('✦ +'+fmt(r.motas), 80, y, '#8a6a10'); y+=12;
  drawTextC('+'+r.xp+' XP', 80, y, '#3a7048'); y+=12;
  if(r.relicName){ drawTextC('RELIQUIA: '+r.relicName, 80, y, '#8a6a10'); y+=12; }
  if(r.extra){ drawTextC('+'+r.extra+'✦ EXTRA', 80, y, '#8a6a10'); y+=12; }
  if(r.eggline){ drawTextC('¡HUEVO '+LINES[r.eggline].name+'!', 80, y, '#a03030'); y+=12; }
  drawTextC('TOCA PARA SEGUIR', 80, 178, 'rgba(26,20,40,0.5)');
}

function drawAlbum(){
  panel(4,24,152,230);
  titleChip(80, 29, 'ALBUM '+dexCount()+'/'+DEX_TOTAL);
  for(let r=0;r<LINE_KEYS.length;r++){
    const ln = LINE_KEYS[r];
    const y0 = 35 + r*27;
    drawText(LINES[ln].name, 10, y0, 'rgba(26,20,40,0.5)');
    for(let c=0;c<SLOT_KEYS.length;c++){
      const key = ln+'_'+SLOT_KEYS[c];
      const spr = SPR[key][0];
      const cx = 14+c*16, cy = y0+15;
      if(G.dex[key]){
        ctx.drawImage(spr, Math.round(cx-spr.width/2), Math.round(cy-spr.height/2));
      } else {
        ctx.drawImage(darkSilhouette(spr), Math.round(cx-spr.width/2), Math.round(cy-spr.height/2));
        drawTextC('?', cx, cy-2, 'rgba(246,239,224,0.85)');
      }
    }
  }
  const gs = SPR.grimo[0];
  const gy = 226;
  drawText('¿?', 10, 229, 'rgba(26,20,40,0.5)');
  if(G.dex.grimo){
    ctx.drawImage(gs, Math.round(80-gs.width/2), gy);
  } else {
    ctx.drawImage(darkSilhouette(gs), Math.round(80-gs.width/2), gy);
    drawTextC('?', 80, gy+5, 'rgba(246,239,224,0.85)');
  }
  drawTextC('TOCA UNA LINEA: SU ARBOL', 80, 244, 'rgba(26,20,40,0.5)');
}

/* ---------------- BESTIARIO ---------------- */
function drawBeast(){
  panel(4,22,152,234);
  G.beast = G.beast || {};
  let n=0; for(const k of BEAST_ORDER) if(G.beast[k] && G.beast[k].seen>0) n++;
  titleChip(80, 27, 'BESTIARIO '+n+'/'+BEAST_ORDER.length);
  for(let i=0;i<BEAST_ORDER.length;i++){
    const k = BEAST_ORDER[i];
    const E = ENEMIES[k];
    const info = G.beast[k];
    const seen = info && info.seen>0;
    const y = 35 + i*14;
    px(9,y,142,12, seen ? '#f6efe0' : '#d8d0ba');
    px(9,y,142,1,K); px(9,y+11,142,1,K); px(9,y,1,12,K); px(150,y,1,12,K);
    const spr = ESPR[k];
    if(seen){
      const sc = Math.min(1, 10/Math.max(spr.width,spr.height));
      ctx.save();
      ctx.translate(16, y+6);
      ctx.scale(sc, sc);
      ctx.drawImage(spr, -spr.width/2, -spr.height/2);
      ctx.restore();
    } else {
      drawTextC('?', 16, y+4, 'rgba(26,20,40,0.4)');
    }
    px(24, y+4, 4, 4, seen ? (ELEM_COLS[E.elem]||'#c8c0b0') : 'rgba(26,20,40,0.2)');
    drawText(seen ? E.name : '?????', 31, y+1, seen ? K : 'rgba(26,20,40,0.45)');
    if(seen){
      drawText(E.desc.length>26 ? E.desc.slice(0,26) : E.desc, 31, y+7, 'rgba(26,20,40,0.5)');
      drawText('X'+info.wins, 136, y+1, '#3a7048');
    }
  }
  drawTextC('BRASA>PRADERA>MAREA>BRASA', 80, 221, 'rgba(26,20,40,0.55)');
  drawTextC('ASTRO>PETREA>FUNGO>ASTRO', 80, 230, 'rgba(26,20,40,0.55)');
  drawTextC('VOLTIO>MAREA · PETREA>VOLTIO', 80, 239, 'rgba(26,20,40,0.55)');
}
function drawOfflineReport(){
  const r = offlineReport;
  panel(12,70,136,120);
  drawTextC('MIENTRAS NO ESTABAS', 80, 78, K);
  const hrs = Math.floor(r.away/3600000), mins = Math.floor((r.away%3600000)/60000);
  let y = 94;
  drawTextC((hrs>0? hrs+'H ':'')+mins+'M FUERA'+(r.capped?' (MAX 14H)':''), 80, y, 'rgba(26,20,40,0.6)'); y+=14;
  drawTextC('✦ +'+fmt(r.motas)+' MOTAS', 80, y, '#8a6a10'); y+=12;
  if(r.autofed>0){ drawTextC('COMIO SOLO X'+r.autofed, 80, y, '#3a7048'); y+=12; }
  if(r.lvls>0){ drawTextC('CRECIO: +'+r.lvls+' NIVELES', 80, y, '#8a6a10'); y+=12; }
  if(r.poops>0){ drawTextC('CACAS NUEVAS: '+r.poops, 80, y, '#a03030'); y+=12; }
  if(r.evolved){ drawTextC('EVOLUCION A LA VISTA...', 80, y, '#8a6a10'); y+=12; }
  drawTextC('TOCA PARA SEGUIR', 80, 176, 'rgba(26,20,40,0.5)');
}


function drawAch(){
  panel(4,26,152,196);
  let done=0; for(const a of ACH) if(G.ach[a.id]) done++;
  titleChip(80, 31, 'LOGROS '+done+'/'+ACH.length);
  const sc = Math.min(UI.achScroll||0, achMaxScroll());
  UI.achScroll = sc;
  ctx.save();
  ctx.beginPath(); ctx.rect(5,37,150,168); ctx.clip();
  ctx.translate(0, -sc);
  for(let i=0;i<ACH.length;i++){
    const a = ACH[i], got = !!G.ach[a.id];
    const y = 40 + i*11;
    px(10,y,7,7, got?'#7ac74f':'rgba(26,20,40,0.12)');
    px(10,y,7,1,K); px(10,y+6,7,1,K); px(10,y,1,7,K); px(16,y,1,7,K);
    drawText(a.name, 21, y+1, got? K : 'rgba(26,20,40,0.55)');
    const rw = a.m ? '+'+a.m+'✦' : '+'+a.s+'★';
    drawText(rw, 122, y+1, got? '#3a7048' : '#8a6a10');
  }
  ctx.restore();
  if(achMaxScroll()>0){
    const vh = 168, ch2 = ACH.length*11;
    const bh = Math.max(10, Math.round(vh*vh/ch2));
    const by = 37 + Math.round((vh-bh) * (sc/achMaxScroll()));
    px(152, 37, 2, vh, 'rgba(26,20,40,0.12)');
    px(152, by, 2, bh, 'rgba(26,20,40,0.4)');
  }
  drawTextC('DESLIZA · TOCA PARA VOLVER', 80, 212, 'rgba(26,20,40,0.5)');
}


/* ---------------- MISIONES DEL DIA ---------------- */
function drawQuests(){
  ensureDaily();
  panel(10,44,140,178);
  titleChip(80, 50, 'MISIONES');
  for(let i=0;i<3;i++){
    const q = QUESTS[G.daily.ids[i]];
    const y = 62 + i*28;
    const done = !!G.daily.claimed[q.id];
    const prog = Math.min(q.n, G.daily.prog[q.id]||0);
    const ready = !done && prog>=q.n;
    px(16,y,128,25, done ? '#d0e8d0' : (ready ? '#ffe9a8' : '#f6efe0'));
    px(16,y,128,1,K); px(16,y+24,128,1,K); px(16,y,1,25,K); px(143,y,1,25,K);
    drawText(q.name, 20, y+4, K);
    if(done) drawText('HECHA', 20, y+14, '#3a7048');
    else drawText(prog+'/'+q.n, 20, y+14, ready ? '#8a6a10' : 'rgba(26,20,40,0.55)');
    if(ready) drawTextC('¡COBRAR!', 88, y+14, '#a03030');
    drawText('+'+q.m+'✦', 118, y+14, '#8a6a10');
  }
  /* la semanal */
  const W = weeklyDef();
  const wDone = G.weekly.claimed;
  const wProg = Math.min(W.n, G.weekly.prog);
  const wReady = !wDone && wProg>=W.n;
  drawText('SEMANAL', 16, 150, 'rgba(26,20,40,0.5)');
  px(16,158,128,25, wDone ? '#d0e8d0' : (wReady ? '#ffe9a8' : '#efe6d0'));
  px(16,158,128,1,K); px(16,182,128,1,K); px(16,158,1,25,K); px(143,158,1,25,K);
  drawText(W.name, 20, 162, K);
  if(wDone) drawText('HECHA', 20, 172, '#3a7048');
  else drawText(wProg+'/'+W.n, 20, 172, wReady ? '#8a6a10' : 'rgba(26,20,40,0.55)');
  if(wReady) drawTextC('¡COBRAR!', 88, 172, '#a03030');
  drawText('+'+W.m+'✦', 118, 172, '#8a6a10');
  drawTextC('DIARIAS NUEVAS CADA DIA', 80, 192, 'rgba(26,20,40,0.5)');
  drawTextC('TOCA FUERA PARA SALIR', 80, 206, 'rgba(26,20,40,0.5)');
}

/* ---------------- TIENDA DEL BUHONERO ---------------- */
function drawBuhoShop(){
  const b = G.buho;
  if(!b) return;
  panel(8,50,144,144);
  ctx.drawImage(SPR.grimo[0], 14, 54);
  titleChip(84, 56, 'EL BUHONERO');
  drawTextC('RAREZAS DE PASO  ✦'+fmt(G.motas), 84, 65, 'rgba(26,20,40,0.6)');
  for(let i=0;i<b.offers.length;i++){
    const o = b.offers[i];
    const y = 78 + i*30;
    const afford = G.motas>=o.cost && !o.sold;
    px(14,y,132,27, o.sold ? '#d0e8d0' : (afford ? '#f6efe0' : '#d8d0ba'));
    px(14,y,132,1,K); px(14,y+26,132,1,K); px(14,y,1,27,K); px(145,y,1,27,K);
    drawText(o.name, 18, y+4, K);
    drawText(o.desc, 18, y+14, 'rgba(26,20,40,0.55)');
    if(o.sold) drawText('VENDIDO', 110, y+9, '#3a7048');
    else drawText('✦'+fmt(o.cost), 116, y+9, afford ? '#8a6a10' : '#a03030');
  }
  const left = Math.max(0, Math.ceil((b.until-Date.now())/1000));
  drawTextC('SE VA EN '+(left>60? Math.ceil(left/60)+' MIN' : left+'S'), 80, 172, '#a03030');
  drawTextC('TOCA FUERA PARA SALIR', 80, 184, 'rgba(26,20,40,0.5)');
}

/* ---------------- DISCOS DEL BAILE ---------------- */
function drawDiscos(){
  panel(8,46,144,164);
  titleChip(64, 52, 'DISCOTECA');
  drawText('✦'+fmt(G.motas), 112, 52, '#8a6a10');
  drawTextC('ELIGE DISCO Y A BAILAR', 80, 61, 'rgba(26,20,40,0.6)');
  for(let i=0;i<DISCOS.length;i++){
    const D = DISCOS[i];
    const owned = !!G.discos[D.id];
    const y = 71 + i*25;
    const afford = G.motas>=D.cost;
    px(14,y,132,24, owned ? '#f6efe0' : (afford ? '#efe6d0' : '#d8d0ba'));
    px(14,y,132,1,K); px(14,y+23,132,1,K); px(14,y,1,24,K); px(145,y,1,24,K);
    /* vinilo */
    px(18,y+6,11,11, owned ? '#2a2438' : 'rgba(42,36,56,0.4)');
    px(22,y+10,3,3, owned ? '#e2574c' : 'rgba(226,87,76,0.4)');
    drawText(D.name.replace('DISCO ',''), 34, y+4, owned ? K : 'rgba(26,20,40,0.6)');
    drawText(D.desc, 34, y+14, 'rgba(26,20,40,0.55)');
    if(owned) drawText('BAILAR', 104, y+9, '#3a7048');
    else drawText('✦'+D.cost, 106, y+9, afford ? '#8a6a10' : '#a03030');
    /* botón OIR */
    px(128,y+4,16,16,'#ffd94a');
    px(128,y+4,16,1,K); px(128,y+19,16,1,K); px(128,y+4,1,16,K); px(143,y+4,1,16,K);
    drawTextC('♥', 136, y+9, K);
  }
  drawTextC('TOCA ♥ PARA OIRLO ANTES', 80, 200, 'rgba(26,20,40,0.5)');
}

/* ---------------- ARBOL EVOLUTIVO (estilo Digimon World) ---------------- */
const EVO_NODES = [
  {slot:'egg',    x:17,  y:106},
  {slot:'babyA',  x:53,  y:66}, {slot:'babyB',  x:53,  y:146},
  {slot:'childA', x:89,  y:66}, {slot:'childB', x:89,  y:146},
  {slot:'adultA', x:133, y:40}, {slot:'adultB', x:133, y:76},
  {slot:'adultS', x:133, y:112},
  {slot:'adultC', x:133, y:148}, {slot:'adultD', x:133, y:184},
  {slot:'grimo',  x:17,  y:180}
];
function evoSprite(ln, slot){
  if(slot==='egg') return SPR['egg_'+ln][0];
  if(slot==='grimo') return SPR.grimo[0];
  return SPR[ln+'_'+slot][0];
}
function evoKey(ln, slot){
  if(slot==='egg') return null;
  if(slot==='grimo') return 'grimo';
  return ln+'_'+slot;
}
function drawEvoTree(){
  const ln = LINE_KEYS[UI.evoLine||0];
  const L = LINES[ln];
  panel(2,24,156,236);
  titleChip(80, 29, 'LINEA '+L.name);
  drawText('<', 8, 29, '#8a6a10');
  drawText('>', 148, 29, '#8a6a10');
  const lc = 'rgba(26,20,40,0.35)';
  /* conexiones huevo → bebés */
  px(24,106,10,1,lc); px(34,66,1,41,lc); px(34,66,11,1,lc); px(34,146,11,1,lc); px(34,106,1,41,lc);
  /* bebés → jóvenes */
  px(60,66,22,1,lc); px(60,146,22,1,lc);
  px(70,66,1,81,lc);
  /* jóvenes → adultos */
  px(96,66,14,1,lc); px(110,40,1,73,lc);
  px(110,40,15,1,lc); px(110,76,15,1,lc); px(110,112,15,1,lc);
  px(96,146,14,1,lc); px(109,112,1,73,lc);
  px(109,148,16,1,lc); px(109,184,16,1,lc);
  /* nodos */
  const sel = UI.evoSel||0;
  for(let i=0;i<EVO_NODES.length;i++){
    const nd = EVO_NODES[i];
    const key = evoKey(ln, nd.slot);
    const seen = !key || !!G.dex[key];
    const spr = evoSprite(ln, nd.slot);
    const dx = Math.round(nd.x - spr.width/2), dy = Math.round(nd.y - spr.height/2);
    if(seen) ctx.drawImage(spr, dx, dy);
    else {
      ctx.drawImage(darkSilhouette(spr), dx, dy);
      drawTextC('?', nd.x, nd.y-2, 'rgba(246,239,224,0.85)');
    }
    /* marca de tu forma actual y del rumbo previsto */
    if(LINE_KEYS[UI.evoLine||0]===AP().line || AP().form==='grimo'){
      const pcur = AP();
      const nx2 = predictNext(pcur);
      if(key && key===evoKeyOf(pcur)){
        drawTextC('AQUI', nd.x, nd.y+11, '#3a7048');
      } else if(nx2 && nx2.key===key && Math.floor(performance.now()/400)%2===0){
        drawTextC('RUMBO', nd.x, nd.y+11, '#8a6a10');
      }
    }
    if(i===sel && Math.floor(performance.now()/300)%2===0){
      const r = Math.ceil(Math.max(spr.width,spr.height)/2)+2;
      px(nd.x-r, nd.y-r, 3, 1, '#a03030'); px(nd.x-r, nd.y-r, 1, 3, '#a03030');
      px(nd.x+r-2, nd.y-r, 3, 1, '#a03030'); px(nd.x+r, nd.y-r, 1, 3, '#a03030');
      px(nd.x-r, nd.y+r, 3, 1, '#a03030'); px(nd.x-r, nd.y+r-2, 1, 3, '#a03030');
      px(nd.x+r-2, nd.y+r, 3, 1, '#a03030'); px(nd.x+r, nd.y+r-2, 1, 3, '#a03030');
    }
  }
  /* ficha del nodo elegido */
  const nd = EVO_NODES[sel];
  const key = evoKey(ln, nd.slot);
  const seen = !key || !!G.dex[key];
  const secret = (nd.slot==='adultS' || nd.slot==='grimo') && !seen;
  px(6,200,148,1,'rgba(26,20,40,0.25)');
  let nm = 'HUEVO '+L.name;
  if(nd.slot==='grimo') nm = seen ? 'GRIMO' : '?????';
  else if(nd.slot!=='egg') nm = seen ? L.names[nd.slot] : '?????';
  drawTextC(nm, 80, 205, K);
  const reqs = EVO_REQS[nd.slot];
  const cA = G.dex[ln+'_childA'] ? L.names.childA : '???';
  const cB = G.dex[ln+'_childB'] ? L.names.childB : '???';
  if(secret){
    drawTextC('? ? ?', 80, 216, 'rgba(26,20,40,0.5)');
    drawTextC('UN SECRETO POR DESCUBRIR', 80, 225, 'rgba(26,20,40,0.5)');
  } else {
    drawTextC(reqs[0].replace('{cA}',cA).replace('{cB}',cB), 80, 216, 'rgba(26,20,40,0.7)');
    drawTextC(reqs[1].replace('{cA}',cA).replace('{cB}',cB), 80, 225, 'rgba(26,20,40,0.7)');
  }
  const p = AP();
  drawTextC('TU BITXO: FUE '+(p.str||0)+' DEF '+(p.def||0)+' VEL '+(p.spd||0), 80, 238, '#3a7048');
  drawTextC('TOCA FORMAS · < > CAMBIA LINEA', 80, 250, 'rgba(26,20,40,0.45)');
}

/* ---------------- BAUTIZO: teclado pixel ---------------- */
const RENAME_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function drawRename(){
  panel(8,44,144,180);
  titleChip(80, 50, 'BAUTIZO');
  /* el nombre en construcción */
  px(30,62,100,16,'#f6efe0');
  px(30,62,100,1,K); px(30,77,100,1,K); px(30,62,1,16,K); px(129,62,1,16,K);
  const buf = UI.nickBuf||'';
  drawTextC(buf + (Math.floor(performance.now()/400)%2===0 ? '_' : ''), 80, 67, K);
  /* teclado 7x4 */
  for(let i=0;i<26;i++){
    const cx = 13 + (i%7)*19, cy = 86 + Math.floor(i/7)*19;
    px(cx,cy,17,16,'#f6efe0');
    px(cx,cy,17,1,K); px(cx,cy+15,17,1,K); px(cx,cy,1,16,K); px(cx+16,cy,1,16,K);
    drawTextC(RENAME_KEYS[i], cx+9, cy+5, K);
  }
  /* borrar y listo */
  px(89,143,26,16,'#f0d8c8'); px(89,143,26,1,K); px(89,158,26,1,K); px(89,143,1,16,K); px(114,143,1,16,K);
  drawTextC('<', 102, 148, '#a03030');
  card(24,168,112,18);
  drawTextC(buf.length ? '¡LISTO!' : 'SIN NOMBRE (ESPECIE)', 80, 174, buf.length ? '#3a7048' : 'rgba(26,20,40,0.5)');
  drawTextC('MAX 8 LETRAS', 80, 196, 'rgba(26,20,40,0.45)');
  drawTextC('TOCA FUERA PARA CANCELAR', 80, 210, 'rgba(26,20,40,0.45)');
}

/* ---------------- DIARIO ---------------- */
function drawDiary(){
  panel(6,28,148,216);
  titleChip(80, 33, 'DIARIO DEL PRADO');
  const D = G.diary||[];
  if(D.length===0){
    drawTextC('AUN NO HAY RECUERDOS', 80, 110, 'rgba(26,20,40,0.55)');
    drawTextC('VIVE Y SE ESCRIBIRAN SOLOS', 80, 122, 'rgba(26,20,40,0.45)');
  } else {
    const show = D.slice(-13).reverse();
    for(let i=0;i<show.length;i++){
      const e = show[i];
      const y = 44 + i*14;
      drawText(e.d, 12, y, '#8a6a10');
      drawText(e.txt.length>30 ? e.txt.slice(0,30) : e.txt, 34, y, K);
      px(12,y+9,136,1,'rgba(26,20,40,0.12)');
    }
  }
  drawTextC('TOCA PARA VOLVER', 80, 234, 'rgba(26,20,40,0.5)');
}