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

/* ------ paneles ------ */
function panel(x,y,w,h){
  px(x,y,w,h,'#e8e0c8');
  px(x,y,w,1,K); px(x,y+h-1,w,1,K);
  px(x,y,1,h,K); px(x+w-1,y,1,h,K);
  px(x+1,y+h,w-1,1,'rgba(26,20,40,0.35)');
}
function card(x,y,w,h,disabled){
  px(x,y,w,h, disabled ? '#d0c8b0' : '#f6efe0');
  px(x,y,w,1,K); px(x,y+h-1,w,1,K);
  px(x,y,1,h,K); px(x+w-1,y,1,h,K);
}


/* ---------------- HUD / PANTALLAS v6 ---------------- */
function drawHUD(t){
  px(0,0,160,19,'rgba(14,16,48,0.55)');
  const p = AP();
  const name = p.stage===STAGES.EGG ? 'HUEVO '+LINES[p.line].name : currentFormDef().name;
  drawText(name+' LV'+p.level, 3, 3, '#ffffff');
  drawText('GEN '+p.gen, 3, 11, 'rgba(255,255,255,0.65)');
  if(G.stars>0) drawText('★'+G.stars, 34, 11, '#ffd94a');
  if(G.pets.length>1) drawText((G.sel+1)+'/'+G.pets.length, 56, 11, 'rgba(255,255,255,0.65)');
  const ms = '✦'+fmt(G.motas);
  drawTextC(ms, 88, 3, '#ffd94a');
  const boosted = Date.now() < G.boostUntil;
  drawTextC('+'+motaRate().toFixed(1)+'/S'+(boosted?'!':''), 88, 11, boosted?'#7ac74f':'rgba(255,255,255,0.65)');
  drawText(G.muted?'X':'♥', 150, 3, G.muted ? '#ffffff' : '#f2a2b8');
  if(needsAttention() && Math.floor(t/500)%2===0){
    drawText('!', 138, 3, '#ffd94a');
  }
  px(0,19,160,2,'rgba(26,20,40,0.5)');
  px(0,19,Math.round(160*p.xp/xpNeed(p.level)),2,'#7ac74f');

  px(0,200,160,72,'#e8e0c8');
  px(0,200,160,1,K);
  px(0,202,160,1,'rgba(26,20,40,0.2)');

  statBar(6,206,42,p.hunger,'#e2574c','HAMBRE');
  statBar(58,206,42,p.happy,'#f0a04b','ANIMO');
  statBar(110,206,44,p.energy,'#5ec8d8','PILAS');

  px(6,224,148,1,'rgba(26,20,40,0.2)');

  for(let i=0;i<6;i++){
    const bx = 5 + i*26, by = BTN_Y;
    const hot = UI.flashBtn===i && performance.now()<UI.flashUntil;
    px(bx, by, BTN_S, BTN_S, hot ? '#ffd94a' : '#f6efe0');
    px(bx, by, BTN_S, 1, K); px(bx, by+BTN_S-1, BTN_S,1,K);
    px(bx, by, 1, BTN_S, K); px(bx+BTN_S-1, by, 1, BTN_S, K);
    px(bx+1, by+BTN_S, BTN_S-1, 1, 'rgba(26,20,40,0.35)');
    ctx.drawImage(IC[BTNS[i].ic], bx+6, by+5);
  }
  if(UI.flashBtn>=0 && performance.now()<UI.flashUntil+900){
    drawTextC(BTNS[UI.flashBtn].label, 80, 265, K);
  }
  if(UI.msg && performance.now()<UI.msgUntil){
    const wdt = textW(UI.msg)+8;
    px(80-wdt/2, 96, wdt, 11, K);
    drawTextC(UI.msg, 80, 99, '#ffffff');
  }
}

function drawStats(){
  panel(8,26,144,188);
  const p = AP();
  const f = currentFormDef();
  drawTextC('- '+ (p.stage===STAGES.EGG?'HUEVO':f.name) +' -', 80, 32, K);
  drawTextC('LINEA '+LINES[p.line].name+' - '+LINES[p.line].bonus, 80, 40, 'rgba(26,20,40,0.6)');
  const stageName = ['HUEVO','BEBE','JOVEN','ADULTO'][p.stage];
  const days = p.hatchedAt ? Math.floor((Date.now()-p.hatchedAt)/(24*3600*1000))+1 : 0;
  let y = 50;
  const line = (a,b)=>{ drawText(a, 16, y, K); drawText(String(b), 88, y, K); y+=8; };
  line('ETAPA', stageName);
  line('CARACTER', p.trait||'-');
  line('EDAD', days+' DIAS');
  line('NIVEL', p.level+' ('+fmt(p.xp)+'/'+fmt(xpNeed(p.level))+')');
  line('PESO', p.weight+' KG');
  line('FUE·DEF·VEL', (p.str||0)+' · '+(p.def||0)+' · '+(p.spd||0));
  line('JUEGOS', p.gamesWon);
  line('FALLOS', p.mistakes);
  line('COMBATES', G.battlesWon);
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
  card(6,170,46,13);
  drawTextC('ALBUM', 29, 174, K);
  card(57,170,46,13);
  drawTextC('LOGROS', 80, 174, K);
  card(108,170,46,13);
  let relN=0; for(const r of RELICS) if(G.relics[r.id]) relN++;
  drawTextC('RELIQ '+relN, 131, 174, K);
  if(canAscend()){
    card(28,186,104,16);
    drawTextC('★ ASCENDER ★', 80, 191, '#8a6a10');
  } else if(p.stage===STAGES.ADULT){
    drawTextC('ASCENSO AL NIVEL 8', 80, 191, 'rgba(26,20,40,0.45)');
  } else {
    drawTextC('CRECERA... TEN PACIENCIA', 80, 191, 'rgba(26,20,40,0.45)');
  }
  drawTextC('TOCA PARA VOLVER', 80, 206, 'rgba(26,20,40,0.5)');
}

function drawShop(){
  panel(4,38,152,178);
  drawTextC('- TIENDA -', 80, 42, K);
  drawText('✦'+fmt(G.motas), 116, 42, '#8a6a10');
  const tab = UI.shopTab||0;
  const tabBtn = (x,label,on)=>{
    px(x,50,46,11, on?'#ffd94a':'#d8d0ba');
    px(x,50,46,1,K); px(x,60,46,1,K); px(x,50,1,11,K); px(x+45,50,1,11,K);
    drawTextC(label, x+23, 53, K);
  };
  tabBtn(10,'MEJORAS',tab===0);
  tabBtn(57,'JUGUETES',tab===1);
  tabBtn(104,'GORROS',tab===2);
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
  } else {
    for(let i=0;i<TOYS.length;i++){
      const T = TOYS[i];
      const owned = !!G.toys[T.id];
      const afford = G.motas>=T.cost && !owned;
      const y = 64 + i*26;
      const flash = UI.shopFlash[T.id] && performance.now()-UI.shopFlash[T.id]<250;
      px(10,y,140,23, flash ? '#ffd94a' : (owned? '#d0e8d0' : (afford?'#f6efe0':'#d8d0ba')));
      px(10,y,140,1,K); px(10,y+22,140,1,K); px(10,y,1,23,K); px(149,y,1,23,K);
      const icon = T.id==='pelota'? SPR.pelota : (T.id==='caja'? SPR.caja : null);
      if(icon) ctx.drawImage(icon, 14, y+8);
      else { px(15,y+6,1,12,'#5a4632'); px(24,y+6,1,12,'#5a4632'); px(13,y+5,14,2,'#8a6a3a'); px(17,y+15,6,2,'#8a6a3a'); }
      drawText(T.name, 30, y+3, K);
      drawText(T.desc, 30, y+12, 'rgba(26,20,40,0.55)');
      if(owned) drawText('TUYO', 124, y+8, '#3a7048');
      else drawText('✦'+fmt(T.cost), 118, y+8, afford?'#8a6a10':'#a03030');
    }
    drawTextC('VIVEN EN EL PRADO', 80, 152, 'rgba(26,20,40,0.45)');
  }
  if(tab===2){
    for(let i=0;i<HATS.length;i++){
      const H = HATS[i];
      const owned = !!G.hats[H.id];
      const worn = AP().hat===H.id;
      const afford = G.motas>=H.cost && !owned && !H.buhoOnly;
      const y = 64 + i*24;
      const flash = UI.shopFlash[H.id] && performance.now()-UI.shopFlash[H.id]<250;
      px(10,y,140,21, flash ? '#ffd94a' : (worn ? '#ffe9a8' : (owned ? '#d0e8d0' : (afford?'#f6efe0':'#d8d0ba'))));
      px(10,y,140,1,K); px(10,y+20,140,1,K); px(10,y,1,21,K); px(149,y,1,21,K);
      const hs = SPR['hat_'+H.id];
      if(owned || !H.buhoOnly) ctx.drawImage(hs, 17-Math.floor(hs.width/2), y+Math.round((21-hs.height)/2));
      else drawText('?', 15, y+7, 'rgba(26,20,40,0.45)');
      drawText(owned || !H.buhoOnly ? H.name : '?????', 28, y+3, K);
      drawText(H.desc, 28, y+12, 'rgba(26,20,40,0.55)');
      if(worn) drawText('PUESTO', 116, y+7, '#8a6a10');
      else if(owned) drawText('TUYO', 124, y+7, '#3a7048');
      else if(!H.buhoOnly) drawText('✦'+fmt(H.cost), 118, y+7, afford?'#8a6a10':'#a03030');
    }
    drawTextC('TOCA PARA PONER O QUITAR', 80, 209, 'rgba(26,20,40,0.45)');
  }
  drawTextC('TOCA FUERA PARA SALIR', 80, 222, 'rgba(26,20,40,0.55)');
}

function drawAscendConfirm(){
  panel(12,86,136,104);
  drawTextC('¿ASCENDER A '+currentFormDef().name+'?', 80, 94, K);
  drawTextC('SE CONVERTIRA EN', 80, 108, K);
  drawTextC('ESTRELLA ETERNA', 80, 116, K);
  drawTextC('GANAS ★'+ascendStars()+' (+'+(ascendStars()*10)+'% SIEMPRE)', 80, 128, '#8a6a10');
  drawTextC('TODO SE REINICIA', 80, 140, '#a03030');
  card(24,152,52,20); drawTextC('SI ★', 50, 159, K);
  card(84,152,52,20); drawTextC('NO', 110, 159, K);
}

function drawFeedMenu(){
  panel(6,32,148,184);
  drawTextC('- DESPENSA -  ✦'+fmt(G.motas), 80, 37, K);
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
  drawTextC('TOCA FUERA PARA SALIR', 80, 220, 'rgba(26,20,40,0.5)');
}
function drawPlayMenu(){
  panel(8,80,144,118);
  drawTextC('¿QUE HACEIS?', 80, 85, K);
  card(12,94,42,38);  drawTextC('✦', 33, 99, '#8a6a10'); drawTextC('MOTAS', 33, 110, K); drawTextC('ATRAPA', 33, 120, 'rgba(26,20,40,0.55)');
  card(59,94,42,38);  drawTextC('♥', 80, 99, '#e2574c'); drawTextC('BAILE', 80, 110, K); drawTextC('DISCOS', 80, 120, 'rgba(26,20,40,0.55)');
  card(106,94,42,38); drawTextC('?', 127, 99, '#6db1ff'); drawTextC('SIMON', 127, 110, K); drawTextC('+DEF', 127, 120, 'rgba(26,20,40,0.55)');
  const salta = !!G.games.salta;
  card(12,136,42,38, !salta);
  if(salta){ drawTextC('>>', 33, 141, '#5ec8d8'); drawTextC('SALTA', 33, 152, K); drawTextC('+VEL', 33, 162, 'rgba(26,20,40,0.55)'); }
  else { drawTextC('SALTA', 33, 143, 'rgba(26,20,40,0.6)'); drawTextC('✦'+COST_SALTA, 33, 153, G.motas>=COST_SALTA?'#8a6a10':'#a03030'); drawTextC('COMPRAR', 33, 162, 'rgba(26,20,40,0.55)'); }
  card(59,136,42,38);  drawTextC('!', 80, 141, '#e2574c'); drawTextC('ENTRENO', 80, 152, K); drawTextC('STATS', 80, 162, 'rgba(26,20,40,0.55)');
  card(106,136,42,38); drawTextC('>', 127, 141, '#8a6a10'); drawTextC('VIAJE', 127, 152, K); drawTextC('TESOROS', 127, 162, 'rgba(26,20,40,0.55)');
  drawTextC('TOCA FUERA PARA SALIR', 80, 187, 'rgba(26,20,40,0.5)');
}
function drawExped(){
  panel(8,44,144,168);
  drawTextC('- EXPEDICION -', 80, 49, K);
  drawTextC('DESTINO PARA '+currentNameOf(AP()), 80, 58, 'rgba(26,20,40,0.6)');
  const mult = (1+0.3*G.ascensions)*legacyMult();
  for(let i=0;i<EXPEDS.length;i++){
    const E = EXPEDS[i], y = 68+i*32;
    px(14,y,132,29,'#f6efe0');
    px(14,y,132,1,K); px(14,y+28,132,1,K); px(14,y,1,29,K); px(145,y,1,29,K);
    drawText(E.name, 18, y+3, K);
    drawText(E.mins>=60? (E.mins/60)+'H' : E.mins+'M', 126, y+3, '#8a6a10');
    drawText('~'+fmt(Math.round(E.motas*mult))+'✦ RELIQ '+Math.round(E.relic*100)+'%', 18, y+12, 'rgba(26,20,40,0.6)');
    if(E.egg) drawText('HUEVO '+LINES[E.egg].name+' '+Math.round(E.eggP*100)+'%', 18, y+21, '#a03030');
    else drawText('VIAJE TRANQUILO', 18, y+21, 'rgba(26,20,40,0.4)');
  }
  drawTextC('TOCA FUERA PARA SALIR', 80, 204, 'rgba(26,20,40,0.5)');
}
function drawRelics(){
  panel(4,26,152,196);
  let n=0; for(const r of RELICS) if(G.relics[r.id]) n++;
  drawTextC('- RELIQUIAS '+n+'/'+RELICS.length+' -', 80, 31, K);
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
  panel(4,26,152,196);
  drawTextC('- ALBUM '+dexCount()+'/'+DEX_TOTAL+' -', 80, 31, K);
  for(let r=0;r<LINE_KEYS.length;r++){
    const ln = LINE_KEYS[r];
    const y0 = 40 + r*31;
    drawText(LINES[ln].name, 10, y0, 'rgba(26,20,40,0.5)');
    for(let c=0;c<SLOT_KEYS.length;c++){
      const key = ln+'_'+SLOT_KEYS[c];
      const spr = SPR[key][0];
      const cx = 14+c*16, cy = y0+16;
      if(G.dex[key]){
        ctx.drawImage(spr, Math.round(cx-spr.width/2), Math.round(cy-spr.height/2));
      } else {
        ctx.drawImage(darkSilhouette(spr), Math.round(cx-spr.width/2), Math.round(cy-spr.height/2));
        drawTextC('?', cx, cy-2, 'rgba(246,239,224,0.85)');
      }
    }
  }
  const gs = SPR.grimo[0];
  const gy = 196;
  if(G.dex.grimo){
    ctx.drawImage(gs, Math.round(80-gs.width/2), gy);
  } else {
    ctx.drawImage(darkSilhouette(gs), Math.round(80-gs.width/2), gy);
    drawTextC('?', 80, gy+5, 'rgba(246,239,224,0.85)');
  }
  drawTextC('TOCA UNA LINEA: SU ARBOL', 80, 215, 'rgba(26,20,40,0.5)');
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
  if(r.poops>0){ drawTextC('CACAS NUEVAS: '+r.poops, 80, y, '#a03030'); y+=12; }
  if(r.evolved){ drawTextC('¡HA EVOLUCIONADO!', 80, y, '#8a6a10'); y+=12; }
  drawTextC('TOCA PARA SEGUIR', 80, 176, 'rgba(26,20,40,0.5)');
}


function drawAch(){
  panel(4,26,152,196);
  let done=0; for(const a of ACH) if(G.ach[a.id]) done++;
  drawTextC('- LOGROS '+done+'/'+ACH.length+' -', 80, 31, K);
  for(let i=0;i<ACH.length;i++){
    const a = ACH[i], got = !!G.ach[a.id];
    const y = 40 + i*11;
    px(10,y,7,7, got?'#7ac74f':'rgba(26,20,40,0.12)');
    px(10,y,7,1,K); px(10,y+6,7,1,K); px(10,y,1,7,K); px(16,y,1,7,K);
    drawText(a.name, 21, y+1, got? K : 'rgba(26,20,40,0.55)');
    const rw = a.m ? '+'+a.m+'✦' : '+'+a.s+'★';
    drawText(rw, 122, y+1, got? '#3a7048' : '#8a6a10');
  }
  drawTextC('TOCA PARA VOLVER', 80, 214, 'rgba(26,20,40,0.5)');
}


/* ---------------- MISIONES DEL DIA ---------------- */
function drawQuests(){
  ensureDaily();
  panel(10,58,140,134);
  drawTextC('- MISIONES DEL DIA -', 80, 64, K);
  for(let i=0;i<3;i++){
    const q = QUESTS[G.daily.ids[i]];
    const y = 76 + i*28;
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
  drawTextC('NUEVAS CADA DIA', 80, 168, 'rgba(26,20,40,0.5)');
  drawTextC('TOCA FUERA PARA SALIR', 80, 186, 'rgba(26,20,40,0.5)');
}

/* ---------------- TIENDA DEL BUHONERO ---------------- */
function drawBuhoShop(){
  const b = G.buho;
  if(!b) return;
  panel(8,50,144,144);
  ctx.drawImage(SPR.grimo[0], 14, 54);
  drawTextC('- EL BUHONERO -', 84, 56, K);
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

/* ---------------- ENTRENO POR STAT ---------------- */
function drawTrainMenu(){
  const p = AP();
  panel(12,66,136,124);
  drawTextC('- ENTRENO -', 80, 72, K);
  drawTextC('PILAS: '+Math.round(p.energy)+'  (CADA SESION -15)', 80, 81, 'rgba(26,20,40,0.6)');
  const rows = [
    {kind:'str', name:'PESAS',   label:'FUERZA',    val:p.str||0, col:'#e2574c', hint:'PEGA MAS FUERTE'},
    {kind:'def', name:'MURO',    label:'DEFENSA',   val:p.def||0, col:'#8a6a3a', hint:'ENCAJA LOS GOLPES'},
    {kind:'spd', name:'CARRERA', label:'VELOCIDAD', val:p.spd||0, col:'#5ec8d8', hint:'ESQUIVA Y APUNTA'}
  ];
  for(let i=0;i<3;i++){
    const r = rows[i], y = 92 + i*28;
    const afin = TRAIN_AFFINITY[p.line]===r.kind;
    px(18,y,124,25,'#f6efe0');
    px(18,y,124,1,K); px(18,y+24,124,1,K); px(18,y,1,25,K); px(141,y,1,25,K);
    drawText(r.name, 22, y+4, K);
    drawText(r.hint, 22, y+14, 'rgba(26,20,40,0.55)');
    drawText(r.label.slice(0,3)+' '+r.val, 104, y+4, r.col);
    if(afin) drawText('X2', 104, y+14, '#3a7048');
  }
  drawTextC('TOCA FUERA PARA SALIR', 80, 182, 'rgba(26,20,40,0.5)');
}

/* ---------------- DISCOS DEL BAILE ---------------- */
function drawDiscos(){
  panel(8,50,144,148);
  drawTextC('- DISCOTECA -  ✦'+fmt(G.motas), 80, 56, K);
  drawTextC('ELIGE DISCO Y A BAILAR', 80, 65, 'rgba(26,20,40,0.6)');
  for(let i=0;i<DISCOS.length;i++){
    const D = DISCOS[i];
    const owned = !!G.discos[D.id];
    const y = 76 + i*27;
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
  drawTextC('TOCA ♥ PARA OIRLO ANTES', 80, 188, 'rgba(26,20,40,0.5)');
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
  drawTextC('- LINEA '+L.name+' -', 80, 29, K);
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
