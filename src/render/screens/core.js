"use strict";
/* =========================================================
   BITXO — render/screens/core: DATOS, TIENDA, DESPENSA, JUGAR y BAUTIZO (dibujo + toques)
   ========================================================= */
function drawStats(){
  panel(8,26,144,214);
  const p = AP();
  const f = currentFormDef();
  titleChip(80, 32, p.nick || (p.stage===STAGES.EGG?'HUEVO':f.name));

  drawTextC('LINEA '+LINES[p.line].name+' - '+LINES[p.line].bonus, 80, 40, 'rgba(26,20,40,0.6)');
  const stageName = ['HUEVO','BEBE','JOVEN','ADULTO'][p.stage];
  const days = p.hatchedAt ? Math.floor((Date.now()-p.hatchedAt)/(24*3600*1000))+1 : 0;
  let y = 50;
  const line = (a,b)=>{ drawText(a, 16, y, K); drawText(String(b), 88, y, K); y+=7; };
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
  line('ESTRELLAS', '★'+G.stars+' (+'+ (G.stars*10) +'%) >');
  y+=2;
  const bar=(label,val,col)=>{
    drawText(label,16,y,K);
    fancyBar(56, y, 80, 4, 'st'+label, val, col, 16, performance.now());
    y+=7;
  };
  bar('HAMBRE',p.hunger,'#e2574c');
  bar('ANIMO',p.happy,'#f0a04b');
  bar('PILAS',p.energy,'#5ec8d8');
  bar('LIMPIO',p.hygiene,'#7ac74f');
  ['ALBUM','LOGRO','RELIQ','BESTIA','DIARIO'].forEach((lb,i)=>{ card(10+i*28,170,27,13); drawTextC(lb, 10+i*28+14, 174, K); });
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
  drawTextC(!p.nick && p.stage>STAGES.EGG ? 'TOCA SU NOMBRE PARA BAUTIZARLO' : 'TOCA FUERA PARA VOLVER', 80, 228, 'rgba(26,20,40,0.5)');
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
      const maxed = lvl>=item.max;
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
    if(FAVES[AP().line]===F.id){ drawText('♥', cx+60, cy+30, '#e2574c'); drawText('FAV', cx+45, cy+30, '#e2574c'); }
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
  /* teclado 7x4: la tecla pulsada se hunde */
  const ka = UI.keyAt && performance.now()-UI.keyAt.t < 140 ? UI.keyAt.i : -2;
  for(let i=0;i<26;i++){
    const cx = 13 + (i%7)*19, cy0 = 86 + Math.floor(i/7)*19;
    const dn = ka===i ? 1 : 0, cy = cy0+dn;
    if(!dn) px(cx+1,cy0+16,16,1,'rgba(26,20,40,0.3)');
    px(cx,cy,17,16, dn ? '#ffd94a' : '#f6efe0');
    px(cx,cy,17,1,K); px(cx,cy+15,17,1,K); px(cx,cy,1,16,K); px(cx+16,cy,1,16,K);
    if(!dn) px(cx+1,cy+1,15,1,'#fffaf0');
    drawTextC(RENAME_KEYS[i], cx+9, cy+5, K);
  }
  /* borrar: fila 4, columnas 6-7 (junto a la Z) */
  const bdn = ka===-1 ? 1 : 0;
  px(108,143+bdn,36,16,bdn ? '#ffd94a' : '#f0d8c8'); px(108,143+bdn,36,1,K); px(108,158+bdn,36,1,K); px(108,143+bdn,1,16,K); px(143,143+bdn,1,16,K);
  drawTextC('< BORRA', 126, 148+bdn, '#a03030');
  card(24,168,112,18);
  drawTextC(buf.length ? '¡LISTO!' : 'SIN NOMBRE (ESPECIE)', 80, 174, buf.length ? '#3a7048' : 'rgba(26,20,40,0.5)');
  drawTextC('MAX 8 LETRAS', 80, 196, 'rgba(26,20,40,0.45)');
  drawTextC('TOCA FUERA PARA CANCELAR', 80, 210, 'rgba(26,20,40,0.45)');
}


/* ---------------- TOQUES de estas pantallas ---------------- */
function tapStats(x, y){
  const now = performance.now();

    if(y>168 && y<184 && x>=10 && x<150){
      UI.mode = ['album','ach','relics','beast','diary'][Math.min(4, Math.floor((x-10)/28))];
      SFX.tap(); return;
    }
    if(y>=26 && y<=40 && x>40 && x<120 && AP().stage>STAGES.EGG){
      UI.nickBuf = AP().nick || '';
      UI.mode = 'rename'; SFX.tap(); return;
    }
    if(canAscend() && y>186 && y<204){ UI.mode='ascendConfirm'; SFX.tap(); return; }
    if(y>=119 && y<=127 && x>=14 && x<=146){ openConstel(false); SFX.tap(); return; }
    if(y>=205 && y<=222){
      if(x>=8 && x<43){ exportSave(); return; }
      if(x>=45 && x<80){ importSave(); return; }
      if(x>=82 && x<117){ takePhoto(); return; }
      if(x>=119 && x<154){
        G.slowRing = !G.slowRing;
        toast(G.slowRing ? 'ARO TRANQUILO EN COMBATE' : 'ARO A VELOCIDAD NORMAL', 2600);
        SFX.tap(); saveGame(); return;
      }
    }
    UI.mode='main'; SFX.tap(); return;
}
SCREEN_TAP.stats = tapStats;
function tapShop(x, y){
  const now = performance.now();

    if(y>=50 && y<=61 && x>=8 && x<=154){ UI.shopTab = x<45?0:(x<82?1:(x<119?2:3)); UI.shopScroll = 0; SFX.tap(); return; }
    if(y<38 || y>216){ UI.mode='main'; SFX.tap(); return; }
    if(y<64 || y>208 || x<10 || x>150) return; /* pestañas, pie y márgenes: sin lista */
    const tab = UI.shopTab||0;
    const ly = y + (UI.shopScroll||0);
    if(tab===0){
      const i = Math.floor((ly-64)/19);
      if(i>=0 && i<SHOP.length) buyUpgrade(i);
    } else if(tab===1){
      const i = Math.floor((ly-64)/20);
      if(i>=0 && i<TOYS.length) buyToy(i);
    } else if(tab===2){
      const col = x<80 ? 0 : 1;
      const row = Math.floor((ly-64)/25);
      const i = row*2 + col;
      if(row>=0 && i>=0 && i<HATS.length) tapHat(i);
    } else {
      const i = Math.floor((ly-64)/22);
      if(i>=0 && i<DECOR.length) tapDecor(i);
    }
    return;
}
SCREEN_TAP.shop = tapShop;
function tapFeed(x, y){
  const now = performance.now();

    if(y>=216 && y<=229 && x>=10 && x<=150){ giveMedicine(); return; }
    const col = x>=10 && x<78 ? 0 : (x>=82 && x<150 ? 1 : -1);
    const row = Math.floor((y-46)/42);
    if(col>=0 && row>=0 && row<4 && y>=46 && y<214){
      doFeed(row*2+col);
    } else { UI.mode='main'; }
    SFX.tap(); return;
}
SCREEN_TAP.feed = tapFeed;
function tapPlay(x, y){
  const now = performance.now();

    if(x>=26 && x<=134 && y>=80 && y<228){
      const i = Math.floor((y-80)/38);
      if(i===0){ if(!gymOpenGuard()) return; UI.mode='train'; SFX.tap(); return; }
      if(i===1){ UI.mode='games'; SFX.tap(); return; }
      if(i===2){
        if(AP().stage<STAGES.CHILD){ toast('AUN ES MUY PEQUENO'); SFX.nope(); return; }
        UI.mode='exped'; SFX.tap(); return;
      }
      if(i===3){
        if(G.battlesWon < TOWER.unlockWins){ toast('GANA '+TOWER.unlockWins+' COMBATES ANTES'); SFX.nope(); return; }
        UI.mode='tower'; SFX.tap(); return;
      }
    }
    UI.mode='main'; SFX.tap(); return;
}
SCREEN_TAP.play = tapPlay;
function tapRename(x, y){
  const now = performance.now();

    const buf = UI.nickBuf||'';
    if(y>=86 && y<162 && x>=13 && x<=146){
      /* teclas 7x4: la última fila lleva V-Z y el borrado en las columnas 5-6 */
      const col = Math.floor((x-13)/19), row = Math.floor((y-86)/19);
      const i = row*7 + col;
      if(row===3 && col>=5){ UI.nickBuf = buf.slice(0,-1); UI.keyAt = {i:-1, t:performance.now()}; SFX.tap(); return; }
      if(col>=0 && col<7 && i<26 && buf.length<8){
        UI.nickBuf = buf + RENAME_KEYS[i];
        UI.keyAt = {i, t:performance.now()};
        SFX.tap(); vibrate(8);
      } else if(buf.length>=8){ SFX.nope(); UI.denyAt = performance.now(); }
      return;
    }
    if(y>=168 && y<=186 && x>=24 && x<=136){
      AP().nick = buf.length ? buf : null;
      toast(buf.length ? '¡SE LLAMA '+buf+'!' : 'NOMBRE DE ESPECIE');
      if(buf.length) diaryLog('BAUTIZADO COMO '+buf);
      SFX.yay(); saveGame();
      UI.mode = 'stats'; return;
    }
    UI.mode='stats'; SFX.tap(); return;
}
SCREEN_TAP.rename = tapRename;
