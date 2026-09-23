"use strict";
/* =========================================================
   BITXO — render/screens/core: DATOS, TIENDA, DESPENSA, JUGAR y BAUTIZO (dibujo + toques)
   Lenguaje visual v2: ver render/uikit.js
   ========================================================= */
/* sonidos de interfaz propios */
SFX.uiTab = function(){ tone({f:520, slide:760, d:0.035, type:'p25', vol:0.03}); };
SFX.uiKey = function(){ tone({f:900+Math.random()*120, slide:700, d:0.025, type:'p125', vol:0.025}); };
SFX.uiDoor = function(){ tone({f:220, slide:420, d:0.08, type:'triangle', vol:0.05}); tone({f:660, slide:990, d:0.06, type:'p25', vol:0.025, at:0.05}); };

/* ==================== DATOS: ficha del bitxo ==================== */
const STATS_L = {
  panel:{x:6, y:24, w:148, h:214},
  well:{x:12, y:46, w:42, h:42},
  name:{x:58, y:44, w:92, h:18},
  stars:{x:80, y:145, w:70, h:10},
  rumbo:{x:10, y:172, w:140, h:24},
  colY:199, colH:13,          /* ALBUM LOGRO RELIQ BESTIA DIARIO: x = 10+i*28, w 27 */
  btnY:216, btnH:15           /* COPIA CARGA FOTO ARO: x = 8+i*37, w 34 */
};
const STATS_COL = ['ALBUM','LOGRO','RELIQ','BESTIA','DIARIO'];
const STATS_COL_MODE = ['album','ach','relics','beast','diary'];
const STATS_BTN = [{l:'COPIA', ic:'copia'},{l:'CARGA', ic:'carga'},{l:'FOTO', ic:'foto'},{l:'ARO', ic:'aro'}];
function statsBtnRect(i){ return {x:8+i*37, y:STATS_L.btnY, w:34, h:STATS_L.btnH}; }
function statsColRect(i){ return {x:10+i*28, y:STATS_L.colY, w:27, h:STATS_L.colH}; }
function petFrame(key){
  const f = SPR[key]; if(!f) return null;
  return Array.isArray(f) ? f[0] : f;
}
/* retrato grande a 2x dentro de un pozo con cielo de su línea */
function drawPortrait(r, p, t){
  const L = LINES[p.line] || {eggSpot:'#7ac74f'};
  const sky = uiMix(L.eggSpot||'#7ac74f', '#20243c', 0.62);
  uiBox(r.x-1, r.y-1, r.w+2, r.h+2, K, null);
  px(r.x, r.y, r.w, r.h, sky);
  for(let i=0;i<4;i++) px(r.x, r.y+i*5, r.w, 5, uiMix(sky, '#101428', 0.25-i*0.06));
  /* estrellitas */
  for(let i=0;i<5;i++){ const sx = r.x+3+((i*13+7)%(r.w-6)), sy = r.y+3+((i*7)%16); if(Math.floor(t/400+i)%3) px(sx, sy, 1, 1, 'rgba(255,255,255,0.6)'); }
  /* suelo */
  px(r.x, r.y+r.h-8, r.w, 8, uiMix(L.eggSpot||'#7ac74f', '#3a3448', 0.45));
  px(r.x, r.y+r.h-8, r.w, 1, uiLight(L.eggSpot||'#7ac74f', 0.2));
  const spr = currentSprite();
  const sc = spr.width>21 || spr.height>21 ? 1 : 2;
  const sq = springSquash(UI.portraitAt, 0.25);
  const w2 = Math.round(spr.width*sc*sq[0]), h2 = Math.round(spr.height*sc*sq[1]);
  const bob = p.sleeping ? 0 : Math.round(Math.sin(t/420));
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  ctx.imageSmoothingEnabled = false;
  px(r.x+Math.round((r.w-spr.width*sc)/2)+2, r.y+r.h-6, spr.width*sc-4, 2, 'rgba(0,0,0,0.25)');
  ctx.drawImage(spr, r.x+Math.round((r.w-w2)/2), r.y+r.h-5-h2+bob, w2, h2);
  ctx.restore();
  /* marco con brillo */
  px(r.x, r.y, r.w, 1, 'rgba(255,255,255,0.25)');
  if(p.sleeping) drawText('Z', r.x+r.w-7, r.y+3+Math.round(Math.sin(t/300)), '#fff8d0');
}
function drawStats(){
  const p = AP(), f = currentFormDef(), t = performance.now();
  const S = STATS_L;
  uiPanel(Object.assign({title:'FICHA', icon:'stats', color:'data', right:'G'+p.gen}, S.panel));
  const egg = p.stage===STAGES.EGG;
  /* ---- retrato + identidad ---- */
  uiStag(0, ()=>drawPortrait(S.well, p, t));
  uiStag(1, ()=>{
    const nm = p.nick || (egg ? 'HUEVO' : f.name);
    const big = textW(nm)*2 <= S.name.w;
    const nameSink = uiPressed('stname');
    if(big) drawTextO(nm, S.name.x, S.name.y+2+nameSink, '#ffffff', 2, K);
    else drawTextO(nm, S.name.x, S.name.y+4+nameSink, '#ffffff', 1, K);
    let y = S.name.y + 15;
    /* chips: etapa, nivel, línea */
    let cx = S.name.x;
    const chip = (s, bg, fg)=>{ const w = textW(s)+5; uiBox(cx, y, w, 8, bg, null); drawText(s, cx+3, y+2, fg); cx += w+2; };
    chip(['HUEVO','BEBE','JOVEN','ADULTO'][p.stage], '#3b3552', '#ffe9a8');
    chip('NV'+p.level, '#5fae45', '#ffffff');
    if(!egg) chip(LINES[p.line].name, uiMix(LINES[p.line].eggSpot||'#7ac74f','#f6efe0',0.55), K);
    y += 11;
    if(p.nick && !egg){ drawText(uiFit(f.name, S.name.w), S.name.x, y, UIC.muted); y += 7; }
    const desc = egg ? 'DALE CALOR Y PACIENCIA. ALGO SE MUEVE DENTRO.' : formDescOfKey(evoKeyOf(p));
    const lines = uiWrap(desc || LINES[p.line].bonus, S.name.w, p.nick ? 2 : 3);
    lines.forEach((l,i)=>drawText(l, S.name.x, y+i*7, 'rgba(26,20,40,0.62)'));
    if(!p.nick && !egg && Math.floor(t/700)%2===0){
      /* lápiz que invita a bautizar */
      const lx = S.name.x + Math.min(S.name.w-6, (big ? textW(nm)*2+2 : textW(nm)) + 3), ly = S.name.y+3;
      px(lx+4, ly, 2, 2, '#f2a2b8'); px(lx+3, ly+2, 2, 2, '#ffd94a'); px(lx+2, ly+3, 2, 2, '#ffd94a'); px(lx+1, ly+5, 2, 2, '#ffd94a'); px(lx, ly+7, 1, 1, K);
    }
  });
  /* ---- stats como filas con icono ---- */
  const sy = 92;
  uiStag(2, ()=>{
    ctx.drawImage(UIIC.nivel, 12, sy-2);
    drawText('NV'+p.level, 25, sy+1, K);
    const need = xpNeed(p.level), xs = fmt(p.xp)+'/'+fmt(need);
    const bx = 25+textW('NV'+p.level)+4, bw = 148-textW(xs)-4-bx;
    uiBar(bx, sy+2, bw, 3, p.xp/need, '#7ac74f');
    drawText(xs, 148-textW(xs), sy+1, UIC.muted);
  });
  const cell = (i, x, y, ic, val, col)=>uiStag(i, ()=>{
    ctx.drawImage(UIIC[ic], x, y); drawText(val, x+13, y+3, col||K);
  });
  /* fuerza/defensa/velocidad */
  const r1 = sy+10;
  cell(3, 12, r1, 'fue', 'FUE '+(p.str||0));
  cell(3, 58, r1, 'def', 'DEF '+(p.def||0));
  cell(3, 104, r1, 'vel', 'VEL '+(p.spd||0));
  const days = p.hatchedAt ? Math.floor((Date.now()-p.hatchedAt)/(24*3600*1000))+1 : 0;
  cell(4, 12, r1+11, 'edad', days+(days===1?' DIA':' DIAS'));
  cell(4, 82, r1+11, 'peso', p.weight+' KG'+(p.weight>40?'!':''), p.weight>40 ? '#a03030' : K);
  cell(5, 12, r1+22, 'cara', uiFit(p.trait||'-', 56));
  cell(5, 82, r1+22, 'trofeo', p.gamesWon+' JUEGOS');
  cell(6, 12, r1+33, 'heart', (G.bond||0)+' +'+Math.min(10,Math.round((G.bond||0)*0.2))+'%');
  cell(6, 82, r1+33, 'fallo', p.mistakes+' FALLOS', p.mistakes>=3 ? '#a03030' : K);
  cell(7, 12, r1+43, 'mota', fmt(G.totalMotas)+' TOT');
  /* estrellas: abre la constelación */
  uiStag(7, ()=>{
    const r = S.stars, dn = uiPressed('ststars');
    uiBox(r.x, r.y+dn, r.w, r.h, '#3b3552', K);
    ctx.drawImage(UIIC.star, r.x+1, r.y+dn);
    drawText(G.stars+' +'+(G.stars*10)+'%', r.x+13, r.y+3+dn, '#ffe9a8');
    drawText('>', r.x+r.w-6+Math.round(Math.abs(Math.sin(t/300))), r.y+3+dn, '#ffd94a');
  });
  /* necesidades: 4 barras compactas */
  uiStag(8, ()=>{
    const by = 158;
    [['HAMBRE',p.hunger,'#e2574c'],['ANIMO',p.happy,'#f0a04b'],['PILAS',p.energy,'#5ec8d8'],['LIMPIO',p.hygiene,'#7ac74f']].forEach((b,i)=>{
      const x = 12 + (i%2)*70, y = by + Math.floor(i/2)*8;
      drawText(b[0], x, y, b[1]<25 && Math.floor(t/260)%2===0 ? '#c0392b' : UIC.muted);
      fancyBar(x+27, y+1, 38, 3, 'st'+b[0], b[1], b[2], 16, t);
    });
  });
  /* ---- RUMBO: la siguiente forma ---- */
  uiStag(9, ()=>drawRumbo(p, t));
  /* ---- colección ---- */
  STATS_COL.forEach((lb,i)=>uiStag(10+i*0.4, ()=>uiButton(Object.assign({label:lb, key:'stcol'+i}, statsColRect(i)))));
  /* ---- utilidades ---- */
  STATS_BTN.forEach((b,i)=>uiStag(12+i*0.4, ()=>uiButton(Object.assign({label:b.l, icon:b.ic, key:'stbtn'+i,
    kind: (i===3 && G.slowRing) ? 'primary' : 'secondary'}, statsBtnRect(i)))));
}
function drawRumbo(p, t){
  const r = STATS_L.rumbo;
  if(canAscend()){
    uiButton({x:r.x, y:r.y, w:r.w, h:r.h, key:'stasc', kind:'primary', label:''});
    const dn = uiPressed('stasc');
    const gl = Math.round(Math.sin(t/200)*1.5);
    drawTextOC('ASCENDER', 80, r.y+6+dn, '#ffffff', 2, '#8a6a10');
    ctx.drawImage(UIIC.star, r.x+6, r.y+6+dn+gl); ctx.drawImage(UIIC.star, r.x+r.w-15, r.y+6+dn-gl);
    return;
  }
  uiBox(r.x, r.y, r.w, r.h, '#20243c', K);
  px(r.x+1, r.y+1, r.w-2, 1, 'rgba(255,255,255,0.12)');
  drawText('RUMBO', r.x+26, r.y+3, '#8fd46a');
  const nx = predictNext(p);
  const well = {x:r.x+3, y:r.y+3, w:19, h:19};
  px(well.x, well.y, well.w, well.h, '#141838');
  px(well.x, well.y, well.w, 1, 'rgba(255,255,255,0.1)');
  if(p.stage===STAGES.ADULT){
    ctx.drawImage(UIIC.star, well.x+4, well.y+5);
    drawText('ASCENSO AL NIVEL 8', r.x+26, r.y+10, '#ffffff');
    uiBar(r.x+26, r.y+18, r.w-30, 2, p.level/8, '#ffd94a', 'rgba(255,255,255,0.15)');
    return;
  }
  if(!nx){ drawText('CRECERA... PACIENCIA', r.x+26, r.y+12, 'rgba(255,255,255,0.7)'); return; }
  /* silueta de la forma prevista (o el huevo que tiembla) */
  let spr = null;
  if(nx.key) spr = petFrame(nx.key);
  else spr = SPR['egg_'+p.line] ? SPR['egg_'+p.line][0] : null;
  if(spr){
    const known = nx.key && G.dex[nx.key];
    const wob = Math.round(Math.sin(t/180)*0.8);
    ctx.save(); ctx.beginPath(); ctx.rect(well.x, well.y, well.w, well.h); ctx.clip();
    const dx = well.x+Math.round((well.w-spr.width)/2)+(nx.key?0:wob), dy = well.y+well.h-1-spr.height;
    /* silueta oscura con filo de luz que late */
    const rim = uiTint(spr, Math.floor(t/500)%2 ? '#8fd46a' : '#bdf0a0');
    ctx.drawImage(rim, dx-1, dy); ctx.drawImage(rim, dx+1, dy); ctx.drawImage(rim, dx, dy-1);
    ctx.drawImage(uiTint(spr, '#2a2e4c'), dx, dy);
    ctx.restore();
    if(!known) drawText('?', well.x+well.w-5, well.y+2, '#ffd94a');
  }
  const mins = Math.ceil(nx.when/60000);
  const tt = nx.when<=1000 ? 'YA MISMO' : (mins>=60 ? Math.floor(mins/60)+'H '+(mins%60)+'M' : mins+'M');
  const verb = p.stage===STAGES.EGG ? 'ECLOSIONA' : 'EVOLUCIONA';
  drawText(tt, r.x+r.w-4-textW(tt), r.y+3, '#ffd94a');
  const nm = nx.key ? (G.dex[nx.key] ? nameOfKey(nx.key) : '?????') : verb;
  drawText(uiFit(nx.key ? verb+': '+nm : verb+' PRONTO', r.w-30), r.x+26, r.y+10, '#ffffff');
  if(nx.lvl){
    uiBar(r.x+26, r.y+18, r.w-50, 3, p.level/nx.lvl, '#8fd46a', 'rgba(255,255,255,0.15)');
    drawText('NV'+p.level+'/'+nx.lvl, r.x+r.w-4-textW('NV'+p.level+'/'+nx.lvl), r.y+17, 'rgba(255,255,255,0.6)');
  } else {
    uiBar(r.x+26, r.y+18, r.w-30, 3, 1-Math.min(1, nx.when/(3600*1000)), '#8fd46a', 'rgba(255,255,255,0.15)');
  }
}

/* ==================== TIENDA ==================== */
const SHOP_L = { panel:{x:4, y:28, w:152, h:190}, tabs:{x:8, y:50, w:144}, view:{x:8, y:64, w:142, h:144} };
const SHOP_TABS = ['MEJORA','JUGUETE','GORROS','PRADO'];
const SHOP_HINT = ['MEJORAS PARA SIEMPRE','JUGUETES PARA TU PRADO','TOCA PARA PONER O QUITAR','TU PRADO, A TU GUSTO'];
/* pitch por pestaña (en sincronía con shopContentH de game/actions.js) */
const SHOP_PITCH = [19, 20, 25, 22];
UI_SCROLLABLE.shop = {get:()=>UI.shopScroll||0, set:v=>{ UI.shopScroll = v; }, max:()=>shopMaxScroll()};
function shopRowRect(tab, i){
  const V = SHOP_L.view, pch = SHOP_PITCH[tab];
  if(tab===2) return {x:V.x+2+(i%2)*71, y:V.y+Math.floor(i/2)*pch, w:69, h:pch-2};
  return {x:V.x+1, y:V.y+i*pch, w:140, h:pch-1};
}
/* dibujos de juguetes (los que no tienen sprite), centrados en cx,cy */
function toyIcon(id){
  /* los juguetes nuevos traen su icono de tienda (data/art/toys.js) */
  if(SPR['ico_'+id]) return SPR['ico_'+id];
  const S = SPR[id];
  if(S && id!=='columpio' && id!=='huerto' && id!=='cometa' && id!=='fuente' && id!=='robot') return S;
  return (cx, cy)=>{
    const ox = Math.round(cx)-19, y = Math.round(cy)-9;
    if(id==='columpio'){ px(ox+14,y+5,1,8,'#5a4632'); px(ox+23,y+5,1,8,'#5a4632'); px(ox+12,y+4,13,2,'#8a6a3a'); px(ox+16,y+11,6,2,'#8a6a3a'); }
    else if(id==='huerto'){ px(ox+12,y+11,14,3,'#5a4632'); px(ox+17,y+6,2,5,'#57a05e'); px(ox+20,y+7,3,3,'#e2574c'); }
    else if(id==='cometa'){ px(ox+17,y+4,3,3,'#e2574c'); px(ox+15,y+6,3,3,'#e2574c'); px(ox+19,y+6,3,3,'#ffd94a'); px(ox+17,y+8,3,3,'#e2574c'); px(ox+15,y+11,2,2,'#f0a04b'); px(ox+19,y+12,2,2,'#f0a04b'); }
    else if(id==='fuente'){ px(ox+13,y+11,13,3,'#9a9aa4'); px(ox+17,y+6,4,5,'#8a8a94'); px(ox+16,y+4,6,2,'#5e9be0'); px(ox+14,y+7,2,3,'#9adcf0'); px(ox+23,y+7,2,3,'#9adcf0'); }
    else if(id==='robot'){ px(ox+15,y+5,8,7,'#8a8a94'); px(ox+17,y+7,2,2,'#5ec8d8'); px(ox+20,y+7,1,2,'#5ec8d8'); px(ox+14,y+12,10,2,'#3a3448'); }
  };
}
/* ---- PRADO: cabecera de BELLEZA + EDITAR, luego decoración ---- */
const SHOP_PRADO_HEAD = 30;
function shopPradoH(){ return SHOP_PRADO_HEAD + (DECOR2.length + DECOR.length)*22; }
function shopPradoRect(i){ const V = SHOP_L.view; return {x:V.x+1, y:V.y+SHOP_PRADO_HEAD+i*22, w:140, h:21}; }
function shopEditRect(){ const V = SHOP_L.view; return {x:V.x+99, y:V.y+3, w:40, h:22}; }
function shopPradoHint(){
  const z = G.zone, t = bellezaTier(z), nx = bellezaNext(z);
  return nx ? ('A '+nx+'♥: '+['+10% MOTAS','+20% Y DORADA','+30% Y VISITA','+50% MOTAS'][t]) : '¡BELLEZA MAXIMA!';
}
function drawShopPradoHead(V, sc){
  const z = G.zone, b = belleza(z), t = bellezaTier(z), nx = bellezaNext(z);
  const y = V.y, x = V.x+1, w = 140, pn = performance.now();
  uiStag(0, ()=>{
    px(x, y, w, 27, '#2a2046'); px(x, y, w, 1, 'rgba(255,255,255,0.14)'); px(x, y+26, w, 1, 'rgba(0,0,0,0.3)');
    drawText(ZONES[z].name, x+4, y+3, '#f6efe0');
    /* corazón que late con la belleza */
    const beat = Math.floor(pn/600)%2 ? 1 : 0;
    drawText(b+'♥', x+4, y+10, beat ? '#ffd0dc' : '#f2a2b8');
    drawText(BEL_TIER_FX[t].name, x+4+textW(b+'♥')+4, y+10, t ? '#ffd94a' : UIC.muted);
    /* barra hacia el siguiente escalón */
    const bw = 90, pr = bellezaProg(z);
    px(x+4, y+18, bw, 4, '#120e24'); px(x+4, y+18, Math.round(bw*pr), 4, '#f2a2b8'); px(x+4, y+18, Math.round(bw*pr), 1, '#ffd0dc');
    for(let i=0;i<4;i++){ const tx = x+4+Math.round(bw*(i+1)/4)-1; px(tx, y+17, 1, 6, i<t ? '#ffd94a' : '#4a4070'); }
    /* botón EDITAR con martillito */
    const R = shopEditRect(), d = uiPressed('shopEdit');
    px(R.x, R.y+d, R.w, R.h, '#e0ac2c'); px(R.x, R.y+d, R.w, 1, '#ffe08a'); px(R.x, R.y+R.h-1+d, R.w, 1, '#8a5a14');
    const hx = R.x+R.w/2-3, hy = R.y+3+d + (Math.floor(pn/900)%4===0 ? -1 : 0);
    px(hx+1, hy+3, 2, 6, '#6e4a2a'); px(hx-1, hy, 7, 3, '#46445a'); px(hx-1, hy, 7, 1, '#9494ac');
    drawTextC('EDITAR', R.x+R.w/2, R.y+13+d, '#3a2208');
  });
}
function drawShop(){
  const L = SHOP_L;
  uiPanel(Object.assign({title:'TIENDA', icon:'shop', color:'shop', currency:true}, L.panel));
  const tab = UI.shopTab||0;
  uiTabs(L.tabs.x, L.tabs.y, L.tabs.w, SHOP_TABS, tab, 'shop');
  /* lista con inercia: se desliza con el dedo, rebota y se recorta */
  const max = shopMaxScroll();
  UI.shopScroll = uiScrollTick('shop', UI.shopScroll||0, max, uiDragging('shop'));
  const sc = UI.shopScroll;
  const V = L.view;
  uiScrollBegin(V, sc, 'shop');
  const vis = r => r.y+r.h >= V.y+sc-2 && r.y <= V.y+sc+V.h+2;
  if(tab===0){
    SHOP.forEach((item, i)=>{
      const r = shopRowRect(0, i); if(!vis(r)) return;
      const lvl = G.up[item.id], maxed = lvl>=item.max;
      const cost = maxed ? 0 : upCost(item, lvl), afford = !maxed && G.motas>=cost;
      uiRow(Object.assign({key:'up'+i, i, icon:UIIC[item.id], title:item.name, sub:item.desc,
        state: maxed ? 'owned' : (afford ? 'normal' : 'poor'), stripe: maxed ? '#7ac74f' : (lvl>0 ? '#ffd94a' : null),
        right:(xr)=>{
          const xl = maxed ? badge(xr, r.y+2, 'MAX') : pricePill(xr, r.y+2, cost, afford);
          if(item.max>10){ const s = 'NV'+lvl; drawText(s, xr-textW(s), r.y+11, UIC.muted); return Math.min(xl, xr-textW(s)); }
          const pw = item.max*4-1; uiPips(xr-pw, r.y+12, lvl, item.max, maxed ? '#5fae45' : '#e0ac2c');
          return Math.min(xl, xr-pw);
        }}, r));
    });
  } else if(tab===1){
    TOYS.forEach((T, i)=>{
      const r = shopRowRect(1, i); if(!vis(r)) return;
      const owned = !!G.toys[T.id], afford = !owned && G.motas>=T.cost;
      uiRow(Object.assign({key:'toy'+i, i, icon:toyIcon(T.id), title:T.name, sub:T.desc,
        state: owned ? 'owned' : (afford ? 'normal' : 'poor'), stripe: owned ? '#7ac74f' : null},
        owned ? {badge:'TUYO'} : {price:T.cost, afford}, r));
    });
  } else if(tab===2){
    const wornId = AP().hat;
    HATS.forEach((H, i)=>{
      const r = shopRowRect(2, i); if(!vis(r)) return;
      const owned = !!G.hats[H.id], worn = wornId===H.id;
      const secret = (H.buhoOnly || H.towerOnly) && !owned;
      const afford = !owned && !secret && G.motas>=H.cost;
      uiRow(Object.assign({key:'hat'+i, i:Math.floor(i/2)+(i%2)*0.5, icon:SPR['hat_'+H.id], iconO:{sil:secret, lock:secret},
        title: secret ? '?????' : H.name,
        subFn:(tx, ty)=>{
          if(worn) badge(tx+33, ty-1, 'PUESTO');
          else if(owned) badge(tx+25, ty-1, 'TUYO');
          else if(secret) badge(tx+(H.buhoOnly?38:30), ty-1, 'LOCK', H.buhoOnly ? 'BUHO' : 'TORRE');
          else pricePill(tx+textW(fmt(H.cost))+12, ty-1, H.cost, afford);
        },
        state: worn ? 'on' : (owned ? 'owned' : (secret ? 'locked' : (afford ? 'normal' : 'poor'))),
        stripe: worn ? '#ffd94a' : (owned ? '#7ac74f' : null)}, r));
    });
  } else {
    G.decor = G.decor || {owned:{}, flores:'clasico'};
    drawShopPradoHead(V, sc);
    DECOR2.forEach((D, i)=>{
      const r = shopPradoRect(i); if(!vis(r)) return;
      const n = decoCount(D.id), maxed = n>=D.max;
      const locked = D.need && !D.need();
      const afford = !maxed && !locked && G.motas>=D.cost;
      const bel = D.id==='estatua' ? decoBel('estatua') : D.bel;
      uiRow({key:'d2'+i, i, x:r.x, y:r.y, w:r.w, h:r.h, icon:SPR['ico_d_'+D.id], iconO:{sil:locked, lock:locked},
        title: D.name + (D.max>1 ? ' '+n+'/'+D.max : ''), sub: locked ? D.needTxt : D.desc,
        state: maxed ? 'owned' : (locked ? 'locked' : (afford ? 'normal' : 'poor')),
        stripe: maxed ? '#7ac74f' : (n>0 ? '#f2a2b8' : null),
        right:(xr)=>{
          const xl = maxed ? badge(xr, r.y+2, D.max>1 ? 'MAX' : 'TUYO') : (locked ? badge(xr, r.y+2, 'LOCK') : pricePill(xr, r.y+2, D.cost, afford));
          const bs = '+'+bel+'♥';
          drawText(bs, xr-textW(bs), r.y+12, '#f2a2b8');
          return Math.min(xl, xr-textW(bs));
        }});
    });
    DECOR.forEach((D, i)=>{
      const r = shopPradoRect(DECOR2.length + i); if(!vis(r)) return;
      const owned = !!G.decor.owned[D.id];
      const active = D.kind==='flores' ? G.decor.flores===D.val : !!G.decor[D.id];
      const afford = !owned && G.motas>=D.cost;
      uiRow(Object.assign({key:'dec'+i, i:DECOR2.length+i, icon:UIIC[D.id], title:D.name, sub:D.desc,
        state: owned ? (active ? 'on' : 'owned') : (afford ? 'normal' : 'poor'),
        stripe: owned ? (active ? '#ffd94a' : '#7ac74f') : null},
        owned ? {badge: active ? 'PUESTO' : 'TUYO'} : {price:D.cost, afford}, r));
    });
  }
  uiScrollEnd(V, sc, tab===3 ? shopPradoH() : shopContentH());
  uiHint(tab===3 ? shopPradoHint() : SHOP_HINT[tab], 80, 210);
}

/* ==================== DESPENSA ==================== */
const FEED_L = { panel:{x:6, y:28, w:148, h:208}, gx:10, gy:50, cw:68, ch:39, px:72, py:41, med:{x:10, y:215, w:140, h:17} };
function feedCardRect(i){ const L = FEED_L; return {x:L.gx+(i%2)*L.px, y:L.gy+Math.floor(i/2)*L.py, w:L.cw, h:L.ch}; }
function feedStats(F){
  const S = [];
  if(F.gamble){ S.push(['???', '#8a6ae8']); return S; }
  if(F.hunger) S.push(['+'+F.hunger, '#e2574c']);
  if(F.happy) S.push(['+'+F.happy, '#f0a04b']);
  if(F.energy) S.push(['+'+F.energy, '#5ec8d8']);
  if(F.str) S.push(['+1FUE', '#a03030', true]);
  if(F.xp) S.push(['+XP', '#5fae45', true]);
  return S;
}
function drawFeedMenu(){
  const L = FEED_L, p = AP(), t = performance.now();
  uiPanel(Object.assign({title:'DESPENSA', icon:'feed', color:'food', currency:true}, L.panel));
  FOODS.forEach((F, i)=>uiStag(i, ()=>{
    const r = feedCardRect(i), key = 'food'+i;
    const afford = G.motas>=F.cost, fav = FAVES[p.line]===F.id;
    const dn = uiPressed(key), off = uiDenyOff(key), glow = uiPressGlow(key);
    ctx.save(); ctx.translate(off, dn);
    if(!dn) px(r.x+1, r.y+r.h, r.w-2, 1, 'rgba(26,20,40,0.22)');
    uiBox(r.x, r.y, r.w, r.h, afford ? (fav ? '#fdeef0' : UIC.card) : UIC.poor, fav ? '#c04860' : K);
    px(r.x+1, r.y+1, r.w-2, 1, UIC.cardHi);
    /* nombre arriba, a lo ancho */
    drawText(uiFit(F.name, r.w-(fav?14:6)), r.x+4, r.y+3, K);
    if(fav){ const hb = Math.round(Math.abs(Math.sin(t/260))); ctx.drawImage(UIIC.heart, r.x+r.w-11, r.y+1-hb); }
    /* comida grande a 2x */
    const well = {x:r.x+3, y:r.y+10, w:26, h:26};
    iconSlot(well.x, well.y, (cx, cy)=>{
      const s = SPR[F.spr]; ctx.imageSmoothingEnabled = false;
      const wob = glow>0 ? Math.round(Math.sin(t/30)*glow) : 0;
      ctx.drawImage(s, Math.round(cx - s.width), Math.round(cy - s.height)+wob, s.width*2, s.height*2);
    }, {s:26, dim:!afford});
    /* efectos: cuadradito de color + valor */
    const S = feedStats(F);
    const dm = uiDenyMsg(key);
    let sx = r.x+32, sy = r.y+11;
    if(dm) uiWrap(dm, r.w-35, 2).forEach((l,j)=>drawText(l, r.x+32, r.y+11+j*7, UIC.redTx));
    else S.forEach(st=>{
      const w = textW(st[0]) + (st[2] ? 0 : 4);
      if(sx + w > r.x+r.w-2){ sx = r.x+32; sy += 7; }
      if(!st[2]) px(sx, sy+1, 3, 3, st[1]);
      drawText(st[0], sx+(st[2]?0:4), sy, st[2] ? st[1] : K);
      sx += w + 3;
    });
    if(!dm && sy===r.y+11 && (F.spicy || F.snack)) drawText(F.spicy ? 'PICA' : 'CAPRICHO', r.x+32, r.y+18, UIC.faint);
    pricePill(r.x+r.w-3, r.y+r.h-12, F.cost, afford);
    if(glow>0){ ctx.globalAlpha = glow*0.35; uiBox(r.x, r.y, r.w, r.h, '#ffffff', null); }
    ctx.restore();
  }));
  /* medicina: solo brilla si alguien está malito */
  const sick = p.sick;
  uiRow(Object.assign({key:'med', i:8, title:'MEDICINA', sub: sick ? '¡LO CURA!' : 'NADIE ENFERMO',
    subCol: sick ? UIC.greenTx : UIC.faint,
    icon: SPR.medicina,
    state: sick ? (G.motas>=COST_MEDICINA ? 'owned' : 'poor') : 'locked', stripe: sick && Math.floor(t/300)%2 ? '#7ac74f' : null,
    price:COST_MEDICINA, afford: sick && G.motas>=COST_MEDICINA}, L.med));
}

/* ==================== JUGAR: cuatro puertas ==================== */
const PLAY_L = { panel:{x:8, y:46, w:144, h:190}, dx:14, dy:68, dw:64, dh:78, gx:68, gy:82 };
function playDoorRect(i){ const L = PLAY_L; return {x:L.dx+(i%2)*L.gx, y:L.dy+Math.floor(i/2)*L.gy, w:L.dw, h:L.dh}; }
function playDoors(){
  const p = AP();
  const towerLocked = G.battlesWon < TOWER.unlockWins;
  const expLocked = p.stage < STAGES.CHILD;
  return [
    {name:'GYM', sub:'FUE DEF VEL', col:'#e2574c', art:'gym'},
    {name:'JUEGOS', sub:'PREMIOS', col:'#f0943b', art:'games'},
    {name:'EXPLORAR', sub: expLocked ? 'CUANDO CREZCA' : 'TESOROS', col:'#5fae45', art:'map', locked:expLocked},
    {name:'LA TORRE', sub: towerLocked ? 'GANA '+TOWER.unlockWins+' COMB.' : '5 PISOS', col:'#8a6ae8', art:'tower', locked:towerLocked,
     prog: towerLocked ? G.battlesWon/TOWER.unlockWins : null}
  ];
}
function drawDoorArt(D, a, t){
  const cx = a.x + (a.w>>1), gy = a.y + a.h - 6;
  const bob = Math.round(Math.sin(t/380 + a.x));
  if(D.art==='gym'){
    /* estera y pesa a 2x */
    px(a.x, gy, a.w, 6, '#8a4a3a'); px(a.x, gy, a.w, 1, '#c07060');
    for(let i=0;i<a.w;i+=6) px(a.x+i, gy+3, 3, 1, '#6a3a2e');
    ctx.drawImage(IC.gym, cx-12, gy-20+bob, 24, 24);
    if(Math.floor(t/500)%2) { px(cx-15, gy-18, 1, 3, '#ffffff'); px(cx+15, gy-16, 1, 3, '#ffffff'); }
  } else if(D.art==='games'){
    px(a.x, gy, a.w, 6, '#6a4a8a'); px(a.x, gy, a.w, 1, '#9a7ac0');
    ctx.drawImage(IC.play, cx-12, gy-22+Math.round(Math.abs(Math.sin(t/260))*-4), 24, 24);
    const cols = ['#ffd94a','#5ec8d8','#f2a2b8','#7ac74f'];
    for(let i=0;i<6;i++){ const yy = a.y+4+((t/30 + i*9)%(a.h-12)); px(a.x+4+i*8, Math.round(yy), 2, 2, cols[i%4]); }
  } else if(D.art==='map'){
    px(a.x, gy-6, a.w, 12, '#57a05e');
    px(a.x+4, gy-12, 14, 6, '#57a05e'); px(a.x+2, gy-9, 20, 3, '#57a05e');
    px(a.x+a.w-24, gy-10, 20, 4, '#4a8a50');
    px(a.x, gy-6, a.w, 1, '#8fd46a');
    px(a.x+a.w-12, a.y+4, 6, 6, '#ffd94a'); px(a.x+a.w-11, a.y+3, 4, 8, '#ffd94a');
    ctx.drawImage(IC.map, cx-10, gy-26+bob, 24, 24);
  } else if(D.art==='tower'){
    for(let i=0;i<5;i++) if(Math.floor(t/300+i)%4) px(a.x+4+((i*17)%(a.w-8)), a.y+3+((i*5)%14), 1, 1, '#ffffff');
    const tx = cx-10, ty = a.y+6;
    ctx.save(); ctx.translate(tx, ty); ctx.scale(2, 2);
    px(2,3,10,24,'#9a9aa4'); px(2,3,10,1,K); px(1,2,12,2,'#6a6a78');
    px(0,0,3,3,'#6a6a78'); px(6,0,3,3,'#6a6a78'); px(11,0,3,3,'#6a6a78');
    px(5,11,4,6,'#3a3448'); px(4,20,2,2,'#3a3448'); px(8,20,2,2,'#3a3448');
    if(!D.locked && Math.floor(t/400)%2) px(6,13,2,2,'#ffd94a');
    ctx.restore();
  }
}
function drawPlayMenu(){
  const t = performance.now();
  uiPanel(Object.assign({title:'¿QUE HACEIS?', icon:'play', color:'play'}, PLAY_L.panel));
  playDoors().forEach((D, i)=>uiStag(i, ()=>{
    const r = playDoorRect(i), key = 'door'+i;
    const dn = uiPressed(key), off = uiDenyOff(key), glow = uiPressGlow(key);
    ctx.save(); ctx.translate(off, dn);
    const col = D.locked ? '#7a7086' : D.col;
    /* marco de puerta con arco */
    if(!dn) px(r.x+2, r.y+r.h, r.w-3, 2, 'rgba(26,20,40,0.28)');
    const frame = uiDark(col, 0.25);
    px(r.x+4, r.y, r.w-8, r.h, frame); px(r.x+2, r.y+1, r.w-4, r.h-1, frame); px(r.x+1, r.y+2, r.w-2, r.h-2, frame); px(r.x, r.y+4, r.w, r.h-4, frame);
    px(r.x+4, r.y, r.w-8, 1, K); px(r.x+2, r.y+1, 2, 1, K); px(r.x+r.w-4, r.y+1, 2, 1, K);
    px(r.x+1, r.y+2, 1, 2, K); px(r.x+r.w-2, r.y+2, 1, 2, K);
    px(r.x, r.y+4, 1, r.h-4, K); px(r.x+r.w-1, r.y+4, 1, r.h-4, K); px(r.x, r.y+r.h-1, r.w, 1, K);
    px(r.x+4, r.y+1, r.w-8, 1, uiLight(col, 0.35));
    /* hueco de la puerta: escena */
    const a = {x:r.x+4, y:r.y+4, w:r.w-8, h:r.h-26};
    const sky = D.locked ? '#3a3448' : uiMix(col, '#20243c', 0.5);
    ctx.save(); ctx.beginPath();
    ctx.rect(a.x+2, a.y, a.w-4, a.h); ctx.rect(a.x, a.y+2, a.w, a.h-2); ctx.clip();
    px(a.x, a.y, a.w, a.h, sky);
    px(a.x, a.y, a.w, a.h>>1, uiMix(sky, '#ffffff', 0.08));
    if(D.locked) ctx.globalAlpha = 0.35;
    drawDoorArt(D, a, t);
    ctx.globalAlpha = 1;
    if(D.locked){
      /* cadenas en X */
      for(let k=0;k<a.w;k+=3){ const yy = Math.round(k*a.h/a.w); px(a.x+k, a.y+yy, 2, 2, '#b4b4bc'); px(a.x+a.w-2-k, a.y+yy, 2, 2, '#b4b4bc'); }
      uiBox(a.x+(a.w>>1)-6, a.y+(a.h>>1)-7, 13, 14, '#ffd94a', K);
      uiLock(a.x+(a.w>>1)-2, a.y+(a.h>>1)-4, K);
    }
    ctx.restore();
    px(a.x, a.y+a.h, a.w, 1, 'rgba(0,0,0,0.3)');
    /* placa con nombre */
    const pl = {x:r.x+3, y:r.y+r.h-21, w:r.w-6, h:18};
    uiBox(pl.x, pl.y, pl.w, pl.h, D.locked ? '#d2c9b1' : '#f6efe0', K);
    px(pl.x+1, pl.y+1, pl.w-2, 1, '#fffaf0');
    drawTextC(D.name, r.x+(r.w>>1), pl.y+3, D.locked ? UIC.muted : K);
    const dm = uiDenyMsg(key);
    drawTextC(uiFit(dm || D.sub, pl.w-4), r.x+(r.w>>1), pl.y+10, dm ? UIC.redTx : UIC.muted);
    if(D.prog!=null) uiBar(pl.x+3, pl.y+pl.h-2, pl.w-6, 1, D.prog, '#8a6ae8');
    if(glow>0){ ctx.globalAlpha = glow*0.4; px(r.x+1, r.y+2, r.w-2, r.h-3, '#ffffff'); }
    ctx.restore();
  }));
}

/* ---------------- BAUTIZO: teclado pixel ---------------- */
const RENAME_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const RENAME_L = { panel:{x:8, y:40, w:144, h:188}, ok:{x:24, y:168, w:112, h:18} };
function drawRename(){
  const t = performance.now(), p = AP();
  uiPanel(Object.assign({title:'BAUTIZO', icon:'heart', color:'data'}, RENAME_L.panel));
  const buf = UI.nickBuf||'';
  /* retrato + casillas de letras */
  const off = uiDenyOff('nick');
  ctx.save(); ctx.translate(off, 0);
  const pw = {x:13, y:62, w:18, h:18};
  uiBox(pw.x-1, pw.y-1, pw.w+2, pw.h+2, K, null);
  px(pw.x, pw.y, pw.w, pw.h, '#20243c');
  const spr = currentSprite();
  ctx.save(); ctx.beginPath(); ctx.rect(pw.x, pw.y, pw.w, pw.h); ctx.clip();
  const sq = springSquash(UI.keyAt && UI.keyAt.t, 0.18);
  const w2 = Math.round(spr.width*sq[0]), h2 = Math.round(spr.height*sq[1]);
  ctx.drawImage(spr, pw.x+Math.round((pw.w-w2)/2), pw.y+pw.h-h2, w2, h2);
  ctx.restore();
  for(let i=0;i<8;i++){
    const sx = 36+i*14, sy = 63;
    const has = i < buf.length, cur = i===buf.length;
    uiBox(sx, sy, 12, 16, has ? '#fffaf0' : '#dcd2b8', cur ? '#c8a04b' : (has ? K : '#b8a98a'));
    if(has){
      /* la última letra entra con un saltito */
      const age = i===buf.length-1 && UI.keyAt ? t-UI.keyAt.t : 1e9;
      const jy = age<200 ? Math.round(-3*Math.sin(age/200*Math.PI)) : 0;
      drawText(buf[i], sx+5-1, sy+6+jy, K);
      px(sx+2, sy+13, 8, 1, 'rgba(26,20,40,0.2)');
    } else if(cur && Math.floor(t/400)%2===0) px(sx+3, sy+12, 6, 1, '#8a6a10');
  }
  ctx.restore();
  /* teclado 7x4: cada tecla es un botoncito con canto */
  const ka = UI.keyAt && t-UI.keyAt.t < 140 ? UI.keyAt.i : -2;
  for(let i=0;i<26;i++){
    const cx = 13 + (i%7)*19, cy0 = 86 + Math.floor(i/7)*19;
    const dn = ka===i ? 1 : 0;
    uiStag(Math.floor(i/7)+1, ()=>{
      px(cx+1, cy0+17, 15, 1, 'rgba(26,20,40,0.25)');
      uiBox(cx, cy0+1, 17, 16, '#b8a98a', K);
      uiBox(cx, cy0+dn, 17, 16-dn, dn ? '#ffd94a' : '#f6efe0', K);
      if(!dn) px(cx+1, cy0+1, 15, 1, '#fffaf0');
      drawTextC(RENAME_KEYS[i], cx+9, cy0+5+dn, K);
    });
  }
  /* borrar: fila 4, columnas 5-6 */
  uiStag(4, ()=>{
    const bdn = ka===-1 ? 1 : 0;
    px(109, 160, 35, 1, 'rgba(26,20,40,0.25)');
    uiBox(108, 144, 36, 16, '#8a2a24', K);
    uiBox(108, 143+bdn, 36, 16-bdn, bdn ? '#ff9a90' : '#e2574c', K);
    px(109, 144+bdn, 34, 1, '#f59088');
    drawTextC('< BORRA', 126, 148+bdn, '#ffffff');
  });
  const ok = RENAME_L.ok;
  uiStag(5, ()=>uiButton(Object.assign({key:'rnok', kind: buf.length ? 'primary' : 'secondary',
    label: buf.length ? '¡LISTO!' : 'SIN NOMBRE (ESPECIE)'}, ok)));
  const full = buf.length>=8;
  drawTextC(buf.length+'/8 LETRAS', 80, 193, full ? (uiDenyMsg('nick') ? UIC.redTx : UIC.goldTx) : UIC.faint);
  uiHint('FUERA PARA CANCELAR', 80, 212);
}


/* ---------------- TOQUES de estas pantallas ---------------- */
function tapStats(x, y){
  const S = STATS_L, p = AP();
  for(let i=0;i<5;i++) if(uiHit(statsColRect(i), x, y)){
    uiPress('stcol'+i); UI.mode = STATS_COL_MODE[i]; SFX.tap(); return;
  }
  if(uiHit(S.name, x, y) && p.stage>STAGES.EGG){
    uiPress('stname'); UI.nickBuf = p.nick || ''; UI.mode = 'rename'; SFX.tap(); return;
  }
  if(uiHit(S.well, x, y)){
    UI.portraitAt = performance.now();
    if(p.stage>STAGES.EGG && !p.sleeping){ heartsFx(S.well.x+S.well.w/2, S.well.y+10, 2); SFX.boing ? SFX.boing() : SFX.tap(); }
    else SFX.tap();
    return;
  }
  if(uiHit(S.rumbo, x, y)){
    if(canAscend()){ uiPress('stasc'); UI.mode='ascendConfirm'; SFX.tap(); return; }
    return;
  }
  if(uiHit(S.stars, x, y)){ uiPress('ststars'); openConstel(false); SFX.tap(); return; }
  for(let i=0;i<4;i++) if(uiHit(statsBtnRect(i), x, y)){
    uiPress('stbtn'+i);
    if(i===0){ exportSave(); return; }
    if(i===1){ importSave(); return; }
    if(i===2){ takePhoto(); return; }
    G.slowRing = !G.slowRing;
    toast(G.slowRing ? 'ARO TRANQUILO EN COMBATE' : 'ARO A VELOCIDAD NORMAL', 2600);
    SFX.tap(); saveGame(); return;
  }
  if(!uiHit(S.panel, x, y)){ UI.mode='main'; SFX.tap(); }
}
SCREEN_TAP.stats = tapStats;
function tapShop(x, y){
  const L = SHOP_L;
  if(y>=L.tabs.y && y<=L.tabs.y+12 && x>=L.tabs.x && x<=L.tabs.x+L.tabs.w){
    const R = uiTabRects(L.tabs.x, L.tabs.y, L.tabs.w, 4);
    let i = R.findIndex(r=>x < r.x+r.w+1); if(i<0) i = 3;
    if(i!==(UI.shopTab||0)){ uiRestagger(); SFX.uiTab(); } else SFX.tap();
    uiPress('tab'+i+SHOP_TABS[i]);
    UI.shopTab = i; UI.shopScroll = 0; return;
  }
  if(!uiHit(L.panel, x, y)){ UI.mode='main'; SFX.tap(); return; }
  const V = L.view;
  if(y<V.y || y>V.y+V.h || x<V.x || x>V.x+V.w) return; /* cabecera, pestañas y pie: sin lista */
  const tab = UI.shopTab||0;
  const ly = y + (UI.shopScroll||0);
  const pch = SHOP_PITCH[tab];
  let i;
  if(tab===2){ const row = Math.floor((ly-V.y)/pch); i = row*2 + (x<80 ? 0 : 1); if(row<0) return; }
  else i = Math.floor((ly-V.y)/pch);
  const sparkle = key=>{
    uiFlash(key);
    const r = shopRowRect(tab, i);
    burst(r.x+12, r.y+r.h/2-(UI.shopScroll||0), {n:10, cols:['#ffd94a','#fff8d0','#ffffff'], speed:0.08, g:0.00012, kind:'star', life:500});
  };
  if(tab===0){
    if(i<0 || i>=SHOP.length) return;
    const item = SHOP[i], key = 'up'+i, lvl = G.up[item.id];
    uiPress(key);
    if(lvl>=item.max){ uiDeny(key, 'YA ESTA AL MAXIMO'); }
    else { const cost = upCost(item, lvl); if(G.motas<cost) uiDeny(key, 'FALTAN '+fmt(cost-G.motas)+'✦'); }
    buyUpgrade(i);
    if(G.up[item.id] > lvl) sparkle(key);
  } else if(tab===1){
    if(i<0 || i>=TOYS.length) return;
    const T = TOYS[i], key = 'toy'+i, had = !!G.toys[T.id];
    uiPress(key);
    if(had) uiDeny(key, 'YA ES TUYO');
    else if(G.motas<T.cost) uiDeny(key, 'FALTAN '+fmt(T.cost-G.motas)+'✦');
    buyToy(i);
    if(!had && G.toys[T.id]) sparkle(key);
  } else if(tab===2){
    if(i<0 || i>=HATS.length) return;
    const H = HATS[i], key = 'hat'+i, had = !!G.hats[H.id];
    uiPress(key);
    if(!had){
      if(H.buhoOnly) uiDeny(key, 'BUHONERO');
      else if(H.towerOnly) uiDeny(key, 'LA TORRE');
      else if(G.motas<H.cost) uiDeny(key, 'FALTAN '+fmt(H.cost-G.motas)+'✦');
    }
    tapHat(i);
    if(!had && G.hats[H.id]) sparkle(key);
  } else {
    const ly3 = ly - V.y;
    if(ly3 < SHOP_PRADO_HEAD){
      const R = shopEditRect();
      if(uiHit({x:R.x, y:R.y - (UI.shopScroll||0), w:R.w, h:R.h}, x, y)){
        uiPress('shopEdit'); SFX.tap();
        UI.mode = 'main'; decorEditStart();
      }
      return;
    }
    const k = Math.floor((ly3 - SHOP_PRADO_HEAD)/22);
    if(k < DECOR2.length){
      if(k<0) return;
      const D = DECOR2[k], key2 = 'd2'+k;
      uiPress(key2);
      const c = decorCanBuy(D.id);
      if(!c.ok){ uiDeny(key2, c.max ? (D.max>1 ? 'NO CABEN MAS' : 'YA ES TUYO') : c.why); SFX.nope(); return; }
      const got = decorBuy(D.id);
      if(got){
        uiFlash(key2);
        /* a verlo caer en el prado */
        UI.mode = 'main';
        if(typeof camLookAt==='function') camLookAt(placeX(got), false);
      }
      return;
    }
    i = k - DECOR2.length;
    if(i<0 || i>=DECOR.length) return;
    const D = DECOR[i], key = 'dec'+i;
    G.decor = G.decor || {owned:{}, flores:'clasico'};
    const had = !!G.decor.owned[D.id];
    uiPress(key);
    if(!had && G.motas<D.cost) uiDeny(key, 'FALTAN '+fmt(D.cost-G.motas)+'✦');
    tapDecor(i);
    if(!had && G.decor.owned[D.id]){ uiFlash(key); if(typeof bellezaDirty==='function') bellezaDirty(); }
  }
}
SCREEN_TAP.shop = tapShop;
function tapFeed(x, y){
  const L = FEED_L, p = AP();
  if(uiHit({x:L.med.x, y:L.med.y-1, w:L.med.w, h:L.med.h+2}, x, y)){
    uiPress('med');
    if(!p.sick) uiDeny('med', 'NADIE ESTA ENFERMO');
    else if(G.motas<COST_MEDICINA) uiDeny('med', 'FALTAN '+fmt(COST_MEDICINA-G.motas)+'✦');
    giveMedicine(); return;
  }
  for(let i=0;i<FOODS.length;i++){
    const r = feedCardRect(i);
    if(uiHit({x:r.x-2, y:r.y-1, w:r.w+4, h:r.h+2}, x, y)){
      const F = FOODS[i], key = 'food'+i;
      uiPress(key);
      if(p.sleeping){ uiDeny(key, 'DUERME'); }
      else if(G.motas < F.cost) uiDeny(key, 'FALTAN '+fmt(F.cost-G.motas)+'✦');
      else if(F.hunger>=30 && p.hunger>92 && !F.gamble) uiDeny(key, 'ESTA LLENO');
      doFeed(i);
      SFX.tap(); return;
    }
  }
  if(!uiHit(L.panel, x, y)){ UI.mode='main'; SFX.tap(); }
}
SCREEN_TAP.feed = tapFeed;
function tapPlay(x, y){
  for(let i=0;i<4;i++){
    if(!uiHit(playDoorRect(i), x, y)) continue;
    const key = 'door'+i;
    uiPress(key);
    if(i===0){ if(!gymOpenGuard()){ uiDeny(key, AP().sleeping ? 'DUERME' : 'AHORA NO'); return; } UI.mode='train'; SFX.uiDoor(); return; }
    if(i===1){ UI.mode='games'; SFX.uiDoor(); return; }
    if(i===2){
      if(AP().stage<STAGES.CHILD){ uiDeny(key, 'AUN PEQUENO'); toast('AUN ES MUY PEQUENO'); SFX.nope(); return; }
      UI.mode='exped'; SFX.uiDoor(); return;
    }
    if(G.battlesWon < TOWER.unlockWins){ uiDeny(key, 'FALTAN '+(TOWER.unlockWins-G.battlesWon)); toast('GANA '+TOWER.unlockWins+' COMBATES ANTES'); SFX.nope(); return; }
    UI.mode='tower'; SFX.uiDoor(); return;
  }
  if(!uiHit(PLAY_L.panel, x, y)){ UI.mode='main'; SFX.tap(); }
}
SCREEN_TAP.play = tapPlay;
function tapRename(x, y){
  const buf = UI.nickBuf||'';
  if(y>=86 && y<162 && x>=13 && x<=146){
    /* teclas 7x4: la última fila lleva V-Z y el borrado en las columnas 5-6 */
    const col = Math.floor((x-13)/19), row = Math.floor((y-86)/19);
    const i = row*7 + col;
    if(row===3 && col>=5){
      if(!buf.length){ uiDeny('nick', ''); SFX.nope(); return; }
      UI.nickBuf = buf.slice(0,-1); UI.keyAt = {i:-1, t:performance.now()}; SFX.uiKey(); return;
    }
    if(col>=0 && col<7 && i<26 && buf.length<8){
      UI.nickBuf = buf + RENAME_KEYS[i];
      UI.keyAt = {i, t:performance.now()};
      SFX.uiKey(); vibrate(8);
    } else if(buf.length>=8){ SFX.nope(); uiDeny('nick', 'MAX'); }
    return;
  }
  if(uiHit(RENAME_L.ok, x, y)){
    uiPress('rnok');
    AP().nick = buf.length ? buf : null;
    toast(buf.length ? '¡SE LLAMA '+buf+'!' : 'NOMBRE DE ESPECIE');
    if(buf.length){ diaryLog('BAUTIZADO COMO '+buf); confetti(80, 70, 18); }
    SFX.yay(); saveGame();
    UI.mode = UI.renameFrom==='hatch' ? 'main' : 'stats'; UI.renameFrom = null; return;
  }
  if(!uiHit(RENAME_L.panel, x, y)){ UI.mode = UI.renameFrom==='hatch' ? 'main' : 'stats'; UI.renameFrom = null; SFX.tap(); }
}
SCREEN_TAP.rename = tapRename;
