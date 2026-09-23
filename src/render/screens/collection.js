"use strict";
/* =========================================================
   BITXO — render/screens/collection: álbum, árbol, logros, reliquias, bestiario, dinastía, diario e informes
   ========================================================= */
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
    if(L.length>9) drawTextC('...Y '+(L.length-9)+' MAS EN EL CIELO', 80, 227, 'rgba(26,20,40,0.45)');
  }
  card(30,224,100,13); drawTextC('★ CONSTELACION', 80, 228, '#8a6a10');
  if(CONSTEL.some(n=>constelState(n)==='ok') && Math.floor(performance.now()/400)%2===0){ px(124,226,3,3,'#e2574c'); }
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
  repOpened(r);
  const rows = [['+'+r.xp+' XP', '#3a7048']];
  if(r.relicName) rows.push(['RELIQUIA: '+r.relicName, '#8a6a10']);
  if(r.extra) rows.push(['+'+r.extra+'✦ EXTRA', '#8a6a10']);
  if(r.eggline) rows.push([r.eggWait ? 'HUEVO '+LINES[r.eggline].name+' EN ESPERA' : '¡HUEVO '+LINES[r.eggline].name+'!', '#a03030']);
  const h = 78 + rows.length*12;
  const y0 = Math.round(132 - h/2);
  panel(12,y0,136,h);
  titleChip(80, y0+6, '¡'+r.name+' HA VUELTO!');
  drawTextC('DEL '+r.dest, 80, y0+18, 'rgba(26,20,40,0.6)');
  drawTextOC('+'+fmt(countUp(r.motas, UI.repT, 1000))+'✦', 80, y0+30, '#ffd94a', 2, '#8a6a10');
  reportRows(rows, y0+50);
  if(performance.now()-UI.repT > 700 && Math.floor(performance.now()/420)%2===0) drawTextC('TOCA PARA SEGUIR', 80, y0+h-11, 'rgba(26,20,40,0.5)');
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
    px(9,y,142,13, seen ? '#f6efe0' : '#d8d0ba');
    px(9,y,142,1,K); px(9,y+12,142,1,K); px(9,y,1,13,K); px(150,y,1,13,K);
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
    drawText(seen ? E.name : '?????', 31, y+2, seen ? K : 'rgba(26,20,40,0.45)');
    if(seen){
      drawText(E.desc.length>26 ? E.desc.slice(0,26) : E.desc, 31, y+7, 'rgba(26,20,40,0.5)');
      drawText('X'+info.wins, 136, y+2, '#3a7048');
    }
  }
  drawTextC('TOCA UNO VISTO: ¡REVANCHA!', 80, 219, '#8a6a10');
  drawTextC('BRASA>PRADERA>MAREA>BRASA', 80, 226, 'rgba(26,20,40,0.55)');
  drawTextC('ASTRO>PETREA>FUNGO>ASTRO', 80, 233, 'rgba(26,20,40,0.55)');
  drawTextC('VOLTIO>MAREA · PETREA>VOLTIO', 80, 240, 'rgba(26,20,40,0.55)');
}
/* cifra que cuenta hacia arriba desde que se abre el informe */
function countUp(v, t0, ms){ const k = ease.outCubic(clamp01((performance.now()-t0)/(ms||900))); return Math.round(v*k); }
function reportRows(rows, y0){
  rows.forEach((r,i)=>{
    const age = performance.now() - (UI.repT||0) - 180 - i*110;
    if(age<0) return;
    const dx = Math.round((1-ease.outBack(clamp01(age/260)))*-14);
    drawTextC(r[0], 80+dx, y0+i*12, r[1]);
    if(age<40 && !r.done){ r.done = true; }
  });
}
function repOpened(key){
  if(UI.repKey!==key){ UI.repKey = key; UI.repT = performance.now(); SFX.coin(); }
}
function drawOfflineReport(){
  const r = offlineReport;
  repOpened(r);
  const rows = [];
  if(r.autofed>0) rows.push(['COMIO SOLO X'+r.autofed, '#3a7048']);
  if(r.lvls>0) rows.push(['CRECIO: +'+r.lvls+' NIVELES', '#8a6a10']);
  if(r.poops>0) rows.push(['CACAS NUEVAS: '+r.poops, '#a03030']);
  if(r.robot>0) rows.push(['EL ROBOT LIMPIO '+r.robot, '#3a7048']);
  if(r.mistakes>0) rows.push(['PASO HAMBRE: +'+r.mistakes+' FALLO', '#a03030']);
  if(r.ranAway && r.ranAway.length) rows.push([r.ranAway[0]+' SE FUE...', '#a03030']);
  if(r.evolved) rows.push(['¡EVOLUCION A LA VISTA!', '#8a6a10']);
  const h = 80 + rows.length*12;
  const y0 = Math.round(132 - h/2);
  panel(12,y0,136,h);
  titleChip(80, y0+6, 'MIENTRAS NO ESTABAS');
  const hrs = Math.floor(r.away/3600000), mins = Math.floor((r.away%3600000)/60000);
  drawTextC((hrs>0? hrs+'H ':'')+mins+'M FUERA'+(r.capped?' (MAX '+Math.round(offlineCap()/3600000)+'H)':''), 80, y0+18, 'rgba(26,20,40,0.6)');
  /* la cifra gorda: motas ganadas contando */
  const mv = countUp(r.motas, UI.repT, 1100);
  drawTextOC('+'+fmt(mv)+'✦', 80, y0+30, '#ffd94a', 2, '#8a6a10');
  reportRows(rows, y0+50);
  if(performance.now()-UI.repT > 700 && Math.floor(performance.now()/420)%2===0) drawTextC('TOCA PARA SEGUIR', 80, y0+h-11, 'rgba(26,20,40,0.5)');
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
  drawTextC(nm, 80, 203, K);
  /* qué es esta forma (solo si ya la conoces) */
  const fdesc = nd.slot==='grimo' ? FORM_DESC.grimo : (FORM_DESC[ln] && FORM_DESC[ln][nd.slot]);
  if(seen && fdesc && typeof fdesc==='string') drawTextC(fdesc, 80, 210, '#8a6a10');
  else if(nd.slot==='egg' && LINE_MOTIF[ln]) drawTextC(LINE_MOTIF[ln], 80, 210, '#8a6a10');
  const reqs = EVO_REQS[nd.slot];
  const cA = G.dex[ln+'_childA'] ? L.names.childA : '???';
  const cB = G.dex[ln+'_childB'] ? L.names.childB : '???';
  if(secret){
    drawTextC('? ? ?', 80, 216, 'rgba(26,20,40,0.5)');
    drawTextC('UN SECRETO POR DESCUBRIR', 80, 225, 'rgba(26,20,40,0.5)');
  } else {
    drawTextC(reqs[0].replace('{cA}',cA).replace('{cB}',cB), 80, 219, 'rgba(26,20,40,0.7)');
    drawTextC(reqs[1].replace('{cA}',cA).replace('{cB}',cB), 80, 227, 'rgba(26,20,40,0.7)');
  }
  const p = AP();
  drawTextC('TU BITXO: FUE '+(p.str||0)+' DEF '+(p.def||0)+' VEL '+(p.spd||0), 80, 238, '#3a7048');
  drawTextC('TOCA FORMAS · < > CAMBIA LINEA', 80, 250, 'rgba(26,20,40,0.45)');
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

/* ---------------- TOQUES de estas pantallas ---------------- */
function tapAlbum(x, y){
  const now = performance.now();

    const r = Math.floor((y-33)/27);
    if(r>=0 && r<LINE_KEYS.length && y>=33 && y<222){
      UI.evoLine = r; UI.evoSel = 0; UI.mode='evotree'; SFX.tap(); return;
    }
    UI.mode='stats'; SFX.tap(); return;
}
SCREEN_TAP.album = tapAlbum;
function tapAch(x, y){
  const now = performance.now();
 UI.mode='stats'; UI.achScroll = 0; SFX.tap(); return;
}
SCREEN_TAP.ach = tapAch;
function tapRelics(x, y){
  const now = performance.now();
 UI.mode='stats'; SFX.tap(); return;
}
SCREEN_TAP.relics = tapRelics;
function tapBeast(x, y){
  const now = performance.now();

    if(x>=9 && x<=151 && y>=35 && y<217){
      const i = Math.floor((y-35)/14);
      if(i>=0 && i<BEAST_ORDER.length){
        const k = BEAST_ORDER[i];
        if(G.beast && G.beast[k] && G.beast[k].seen>0){
          /* revancha: a tu nivel actual +1 */
          const pp2 = playerPower(AP());
          G.wild = {kind:k, nv:Math.max(1,pp2+1), elite:false, boss:!!ENEMIES[k].boss, revenge:true, zone:G.zone,
                    x:110, tx:110, arriveAt:Date.now(), stealAt:Date.now()+9e9, dir:-1};
          startBattle();
          if(UI.mode!=='battle'){ G.wild = null; UI.mode = 'beast'; }
          return;
        }
      }
    }
    UI.mode='stats'; SFX.tap(); return;
}
SCREEN_TAP.beast = tapBeast;
function tapLegacy(x, y){
  const now = performance.now();

    if(y>=222 && y<=238 && x>=30 && x<=130){ openConstel(false); SFX.tap(); return; }
    UI.mode='main'; SFX.tap(); return;
}
SCREEN_TAP.legacy = tapLegacy;
function tapDiary(x, y){
  const now = performance.now();
 UI.mode='stats'; SFX.tap(); return;
}
SCREEN_TAP.diary = tapDiary;
function tapEvotree(x, y){
  const now = performance.now();

    if(y<40 && (x<22 || x>146)){
      if(x<22){ UI.evoLine = ((UI.evoLine||0)+LINE_KEYS.length-1)%LINE_KEYS.length; UI.evoSel=0; SFX.tap(); return; }
      if(x>146){ UI.evoLine = ((UI.evoLine||0)+1)%LINE_KEYS.length; UI.evoSel=0; SFX.tap(); return; }
    }
    let best=-1, bd=15;
    for(let i=0;i<EVO_NODES.length;i++){
      const d = Math.abs(x-EVO_NODES[i].x)+Math.abs(y-EVO_NODES[i].y);
      if(d<bd){ bd=d; best=i; }
    }
    if(best>=0){ UI.evoSel=best; SFX.tap(); return; }
    UI.mode='album'; SFX.tap(); return;
}
SCREEN_TAP.evotree = tapEvotree;
