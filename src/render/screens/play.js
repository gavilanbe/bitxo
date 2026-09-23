"use strict";
/* =========================================================
   BITXO — render/screens/play: juegos, discos, expedición, torre, misiones, buhonero, viajes y confirmaciones
   ========================================================= */
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

/* ---------------- SALA DE JUEGOS ---------------- */
function drawGames(){
  panel(6,28,148,216);
  titleChip(80, 34, 'SALA DE JUEGOS');
  G.best = G.best||{};
  for(let i=0;i<MINIGAMES.length;i++){
    const M = MINIGAMES[i];
    const owned = !M.gkey || !!G.games[M.gkey];
    const cx = 10 + (i%3)*47, cy = 46 + Math.floor(i/3)*60;
    card(cx, cy, 44, 56, !owned);
    px(cx+1, cy+1, 42, 14, owned ? M.col : 'rgba(26,20,40,0.15)');
    drawTextC(M.glyph, cx+22, cy+5, owned ? '#ffffff' : 'rgba(26,20,40,0.4)');
    drawTextC(M.name, cx+22, cy+19, owned ? K : 'rgba(26,20,40,0.55)');
    if(owned){
      drawTextC(M.sub, cx+22, cy+29, 'rgba(26,20,40,0.55)');
      const best = G.best[M.id]||0;
      drawTextC(best>0 ? 'REC '+best : 'SIN REC', cx+22, cy+41, best>0 ? '#8a6a10' : 'rgba(26,20,40,0.35)');
    } else {
      drawTextC('✦'+M.cost, cx+22, cy+31, G.motas>=M.cost ? '#8a6a10' : '#a03030');
      drawTextC('COMPRAR', cx+22, cy+43, 'rgba(26,20,40,0.55)');
    }
  }
  drawTextC('LOS JUEGOS TAMBIEN ENTRENAN', 80, 228, 'rgba(26,20,40,0.5)');
  drawTextC('TOCA FUERA PARA SALIR', 80, 237, 'rgba(26,20,40,0.5)');
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
    const em = Math.round(expedMs(E, AP())/60000);
    drawText(em>=60? (Math.round(em/6)/10)+'H' : em+'M', 126, y+2, '#8a6a10');
    drawText('~'+fmt(Math.round(E.motas*mult))+'✦ RELIQ '+Math.round(E.relic*100)+'%', 18, y+10, 'rgba(26,20,40,0.6)');
    if(E.egg) drawText('HUEVO '+LINES[E.egg].name+' '+Math.round(E.eggP*100)+'%', 18, y+18, '#a03030');
    else drawText('VIAJE TRANQUILO', 18, y+18, 'rgba(26,20,40,0.4)');
  }
  drawTextC('TOCA FUERA PARA SALIR', 80, 204, 'rgba(26,20,40,0.5)');
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
  ctx.drawImage(SPR.buhonero[0], 14, 54);
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


/* ---------------- TOQUES de estas pantallas ---------------- */
function tapAscendConfirm(x, y){
  const now = performance.now();
  /* SOLO la tarjeta del SÍ confirma; cualquier otro toque cancela */
  const onYes = (x>=24 && x<=76 && y>=152 && y<=172);

    if(onYes){ doAscend(); } else { UI.mode='stats'; SFX.tap(); }
    return;
}
SCREEN_TAP.ascendConfirm = tapAscendConfirm;
function tapParqueConfirm(x, y){
  const now = performance.now();
  /* SOLO la tarjeta del SÍ confirma; cualquier otro toque cancela */
  const onYes = (x>=24 && x<=76 && y>=152 && y<=172);

    if(onYes){ openParque(); } else { UI.mode='main'; SFX.tap(); }
    return;
}
SCREEN_TAP.parqueConfirm = tapParqueConfirm;
function tapHuertaConfirm(x, y){
  const now = performance.now();
  /* SOLO la tarjeta del SÍ confirma; cualquier otro toque cancela */
  const onYes = (x>=24 && x<=76 && y>=152 && y<=172);

    if(onYes){ openHuerta(); } else { UI.mode='main'; SFX.tap(); }
    return;
}
SCREEN_TAP.huertaConfirm = tapHuertaConfirm;
function tapTravelPick(x, y){
  const now = performance.now();

    const opts = travelOptions(UI.travelDest);
    if(x>=22 && x<=138 && y>=86 && y<86+(opts.length+1)*27){
      const i = Math.floor((y-86)/27);
      if(i<opts.length){ travelWith(opts[i].i); return; }
      const d = UI.travelDest;
      UI.mode='main'; goWithToast(d);
      return;
    }
    UI.mode='main'; SFX.tap(); return;
}
SCREEN_TAP.travelPick = tapTravelPick;
function tapTower(x, y){
  const now = performance.now();

    if(!G.tower){
      if(x>=60 && x<=140 && y>=160 && y<=178){ towerEnter(); return; }
    } else {
      if(x>=60 && x<=140 && y>=130 && y<=148){ towerLaunch(); return; }
      if(x>=60 && x<=140 && y>=152 && y<=166){ towerAbandon(); return; }
    }
    UI.mode='play'; SFX.tap(); return;
}
SCREEN_TAP.tower = tapTower;
function tapGames(x, y){
  const now = performance.now();

    if(x>=10 && x<=151 && y>=46 && y<226){
      const col = Math.floor((x-10)/47), row = Math.floor((y-46)/60);
      const i = row*3 + col;
      if(col>=0 && col<3 && row>=0 && row<3 && i<MINIGAMES.length){
        const M = MINIGAMES[i];
        const owned = !M.gkey || !!G.games[M.gkey];
        if(!owned){ buyGame(M.gkey, M.cost); return; }
        if(M.id==='mgCatch') startCatch();
        else if(M.id==='mgDance') UI.mode='discos';
        else if(M.id==='mgSimon') startSimon();
        else if(M.id==='mgJump') startJump();
        else if(M.id==='mgTopo') startTopo();
        else if(M.id==='mgPesca') startPesca();
        else if(M.id==='mgMemo') startMemo();
        else if(M.id==='mgGlobo') startGlobo();
        SFX.tap(); return;
      }
    }
    UI.mode='play'; SFX.tap(); return;
}
SCREEN_TAP.games = tapGames;
function tapExped(x, y){
  const now = performance.now();

    if(x>14 && x<146 && y>66 && y<206){
      const i = Math.floor((y-66)/28);
      if(i>=0 && i<EXPEDS.length){ sendExpedition(i); return; }
    }
    UI.mode='play'; SFX.tap(); return;
}
SCREEN_TAP.exped = tapExped;
function tapQuests(x, y){
  const now = performance.now();

    if(x>=16 && x<=144 && y>=62 && y<146){
      const i = Math.floor((y-62)/28);
      if(i>=0 && i<3){ claimQuest(i); return; }
    }
    if(x>=16 && x<=144 && y>=158 && y<=183){ claimWeekly(); return; }
    UI.mode='main'; SFX.tap(); return;
}
SCREEN_TAP.quests = tapQuests;
function tapBuho(x, y){
  const now = performance.now();

    if(!G.buho){ UI.mode='main'; return; }
    if(x>=14 && x<=146 && y>=78 && y<168){
      const i = Math.floor((y-78)/30);
      if(i>=0 && i<G.buho.offers.length){ buyBuhoOffer(i); return; }
    }
    UI.mode='main'; SFX.tap(); return;
}
SCREEN_TAP.buho = tapBuho;
function tapDiscos(x, y){
  const now = performance.now();

    if(x>=14 && x<=146 && y>=71 && y<196){
      const i = Math.floor((y-71)/25);
      if(i>=0 && i<DISCOS.length){
        if(x>=126){ previewDisco(i); return; }
        if(G.discos[DISCOS[i].id]){ G.disco = DISCOS[i].id; startDance(i); saveGame(); return; }
        buyDisco(i); return;
      }
    }
    UI.mode='games'; SFX.tap(); return;
}
SCREEN_TAP.discos = tapDiscos;
