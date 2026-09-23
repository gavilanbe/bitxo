"use strict";
/* =========================================================
   BITXO — render/screens/play: juegos, discos, expedición, torre, misiones, buhonero, viajes y confirmaciones
   Construido sobre el kit (render/uikit.js). Las piezas propias llevan prefijo pl_.
   ========================================================= */

/* ---------------- piezas propias ---------------- */
/* dibuja filas de píxeles con paleta (iconos pequeños sin canvas) */
function pl_pix(rows, x, y, pal){
  for(let j=0;j<rows.length;j++){
    const r = rows[j];
    for(let i=0;i<r.length;i++){ const c = pal[r[i]]; if(c) px(x+i, y+j, 1, 1, c); }
  }
}
const PL_STAR = ["..y..",".yyy.","yyyyy",".yyy.",".y.y."];
const PL_STAR3 = [".y.","yyy",".y."];
const PL_STAR4 = ["..y..","yyyyy",".yyy.",".y.y."];
/* texto doble con sombra dura (cifras grandes) */
function pl_big(s, x, y, col, sh){ drawTextS(s, x+1, y+1, sh, 2); drawTextS(s, x, y, col, 2); }
/* sprite centrado y encajado en un cuadro de s px (sin pasar de 1:1) */
function pl_fit(spr, cx, cy, s){
  if(!spr) return;
  const sc = Math.min(1, s/Math.max(spr.width, spr.height));
  if(sc===1){ ctx.drawImage(spr, Math.round(cx-spr.width/2), Math.round(cy-spr.height/2)); return; }
  ctx.save(); ctx.translate(Math.round(cx), Math.round(cy)); ctx.scale(sc, sc);
  ctx.drawImage(spr, -spr.width/2, -spr.height/2); ctx.restore();
}
function pl_petSpr(p){
  const k = p.form==='grimo' ? 'grimo' : p.line+'_'+(p.form||'babyA');
  const f = SPR[k]; return f ? f[0] : null;
}
/* fila-carta con el estilo del kit, para las que dibujan su propio contenido */
function pl_card(x, y, w, h, state, key, stripe){
  const sink = uiPressed(key);
  const bg = {normal:UIC.card, poor:UIC.poor, locked:UIC.locked, owned:UIC.owned, on:UIC.on}[state] || UIC.card;
  if(!sink) px(x+1, y+h, w-2, 1, 'rgba(26,20,40,0.22)');
  uiBox(x, y, w, h, bg, state==='locked' ? '#6a6072' : K);
  if(state!=='locked') px(x+1, y+1, w-2, 1, state==='poor' ? '#f6f0e0' : UIC.cardHi);
  px(x+1, y+h-2, w-2, 1, 'rgba(26,20,40,0.08)');
  if(stripe) px(x+1, y+2, 2, h-4, stripe);
}
/* destellos de pulsar/comprar encima de una carta */
function pl_glow(x, y, w, h, key){
  const g = uiPressGlow(key), f = uiFlashK(key);
  if(g<=0 && f<=0) return;
  ctx.save(); ctx.globalAlpha *= Math.max(g*0.35, f*0.7);
  uiBox(x, y, w, h, f>0 ? '#fff3a8' : '#ffffff', null); ctx.restore();
}
/* envuelve una carta: escalonado + temblor de negación + hundido */
function pl_item(i, key, fn){
  uiStag(i, ()=>{
    ctx.save(); ctx.translate(uiDenyOff(key), uiPressed(key)); fn(); ctx.restore();
  });
}
/* el último "no" de esta pantalla (para el pie): texto o '' */
function pl_denyMsg(prefix){
  const d = UI.uiDeny;
  return d && d.k.indexOf(prefix)===0 && performance.now()-d.t < 1800 ? d.msg : '';
}
/* ¿el toque cae dentro del panel? (los huecos del panel no cierran).
   Rects fijos por pantalla: el toque no depende de lo último dibujado */
const PL_PANEL = {
  games:{x:6, y:28, w:148, h:216}, discos:{x:6, y:40, w:148, h:186}, exped:{x:6, y:28, w:148, h:216},
  tower:{x:8, y:36, w:144, h:204}, quests:{x:8, y:32, w:144, h:206}, buho:{x:8, y:40, w:144, h:176}
};
function pl_travelRect(){ const n = travelOptions(UI.travelDest).length+1; return {x:14, y:54, w:132, h:36 + n*27 + 18}; }
function pl_inPanel(x, y){ const r = UI.mode==='travelPick' ? pl_travelRect() : PL_PANEL[UI.mode]; return uiHit(r, x, y); }
function pl_panel(o){ return uiPanel(Object.assign({}, UI.mode==='travelPick' ? pl_travelRect() : PL_PANEL[UI.mode], o)); }
function pl_clock(x, y, col){
  col = col||K;
  px(x+1, y, 3, 1, col); px(x+1, y+4, 3, 1, col); px(x, y+1, 1, 3, col); px(x+4, y+1, 1, 3, col);
  px(x+2, y+1, 1, 2, col); px(x+3, y+2, 1, 1, col);
}
function pl_gem(x, y){
  pl_pix([".kkk.","kplpk","kpppk",".kpk.","..k.."], x, y, {k:K, p:'#8a6ae8', l:'#e0d4ff'});
}
function pl_egg(x, y, line){
  const L = LINES[line] || {};
  pl_pix([".kk.","kssk","kpsk","kssk",".kk."], x, y, {k:K, s:L.eggShell||'#f6efe0', p:L.eggSpot||'#7ac74f'});
}
function pl_bolt(x, y, col){ pl_pix(["..y","..y",".yy","yy.","y..","y.."].map(r=>r), x, y, {y:col||'#ffd94a'}); }
function pl_heart(x, y, col){ pl_pix([".r.r.","rrrrr","rrrrr",".rrr.","..r.."], x, y, {r:col||'#e2574c'}); }
function pl_mmss(ms){
  const s = Math.max(0, Math.ceil(ms/1000));
  if(s >= 3600) return Math.floor(s/3600)+'H '+Math.floor((s%3600)/60)+'M';
  if(s >= 60) return Math.ceil(s/60)+'M';
  return s+'S';
}
function pl_potion(x, y, col, hi){
  px(x+3, y, 3, 2, '#b08a5a'); px(x+3, y+2, 3, 1, K);
  uiBox(x+1, y+3, 7, 7, col, K); px(x+2, y+4, 1, 2, hi||'#ffffff');
}

/* =========================================================
   CONFIRMACIONES: diálogo claro con SÍ / NO grandes
   (SOLO el botón SÍ confirma; cualquier otro toque cancela)
   ========================================================= */
const PL_YES = {x:18, y:150, w:60, h:24};
const PL_NO  = {x:82, y:150, w:60, h:24};
function pl_dialog(o){
  uiPanel({x:10, y:74, w:140, h:112, title:o.title, icon:o.icon, color:o.color});
  o.body();
  const k = uiStagger(2);
  ctx.save(); ctx.globalAlpha *= k.alpha;
  /* el SÍ respira para invitar; el NO es sobrio */
  const bob = Math.round(Math.sin(performance.now()/260)*0.6);
  uiButton({x:PL_YES.x, y:PL_YES.y+bob, w:PL_YES.w, h:PL_YES.h, label:o.yes, kind:o.yesKind||'primary', key:'dlgYes'});
  uiButton({x:PL_NO.x, y:PL_NO.y, w:PL_NO.w, h:PL_NO.h, label:o.no, kind:'secondary', key:'dlgNo'});
  ctx.restore();
}
function pl_toysRow(ids, cy){
  const n = ids.length, gap = 18, x0 = Math.round(80 - ((n-1)*gap)/2);
  ids.forEach((id, i)=>{
    const s = SPR[id];
    const bob = Math.round(Math.sin(performance.now()/300 + i)*1);
    iconSlot(x0 + i*gap - 8, cy - 8 + bob, (cx2, cy2)=>pl_fit((s && s.width) ? s : UIIC.juguete, cx2, cy2, 14), {s:16});
  });
}
function pl_zoneConfirm(zone, title, lines, toyIds, yes){
  const Z = ZONES[zone];
  const afford = G.motas >= Z.cost;
  pl_dialog({title:'EL SENDERO', icon:IC.map, color:'data', yes, no:'AUN NO', yesKind: afford ? 'good' : 'primary', body:()=>{
    uiStag(0, ()=>{ const tx = Math.round(80 - textW(title)/2); uiTextSh(title, tx, 97, K); });
    uiStag(1, ()=>{
      if(toyIds.length) pl_toysRow(toyIds, 117);
      drawTextC(lines, 80, 129, UIC.muted);
      /* precio: lo que cuesta y lo que tienes */
      const w = textW(fmt(Z.cost))+12;
      pricePill(80 + Math.round(w/2), 137, Z.cost, afford);
    });
  }});
  if(!afford) drawTextC('TIENES ✦'+fmt(G.motas), 80, 177, UIC.redTx);
}
function drawParqueConfirm(){
  const ids = Object.keys(G.toys||{}).filter(t=>G.toys[t] && TOY_ZONE[t]==='parque');
  pl_zoneConfirm('parque', '¿ABRIR EL PARQUE?', 'SUS JUGUETES SE MUDAN ALLI', ids, '¡SI!');
}
function drawHuertaConfirm(){
  const ids = Object.keys(G.toys||{}).filter(t=>G.toys[t] && TOY_ZONE[t]==='huerta');
  pl_zoneConfirm('huerta', '¿ABRIR LA HUERTA?', 'SUS JUGUETES SE MUDAN ALLI', ids, '¡SI!');
}
function drawAscendConfirm(){
  const p = AP(), stars = ascendStars(), now = performance.now();
  pl_dialog({title:'ASCENDER', icon:UIIC.star, color:'collection', yes:'SI ★', no:'NO', body:()=>{
    uiStag(0, ()=>{
      /* el bitxo sube entre rayos */
      const cx = 36, cy = 118;
      for(let r=0;r<8;r++){
        const a = r*Math.PI/4 + now/1800;
        const l = 12 + (r%2)*3;
        for(let d=8; d<l; d+=2) px(Math.round(cx+Math.cos(a)*d), Math.round(cy+Math.sin(a)*d), 1, 1, '#ffd94a');
      }
      px(cx-9, cy-9, 18, 18, 'rgba(255,233,168,0.35)');
      pl_fit(pl_petSpr(p), cx, cy + Math.round(Math.sin(now/400)*1.5), 26);
      for(let k=0;k<3;k++){
        const t = ((now/900 + k/3) % 1);
        pl_pix(PL_STAR3, cx - 10 + k*9, Math.round(cy + 8 - t*22), {y:'#ffd94a'});
      }
    });
    uiStag(1, ()=>{
      const tx = 58;
      drawText(uiFit(currentFormDef().name, 84), tx, 98, K);
      drawText('SERA ESTRELLA', tx, 106, UIC.muted);
      drawText('ETERNA', tx, 113, UIC.muted);
      pl_big('+'+stars+'★', tx, 121, '#ffd94a', '#8a6a10');
      drawText('+'+(stars*10)+'% SIEMPRE', tx, 135, UIC.goldTx);
      drawTextC('SE VA. LO DEMAS SE QUEDA', 80, 142, UIC.redTx);
    });
  }});
}

/* ---------------- ¿QUIÉN VIENE? (viaje entre zonas) ---------------- */
const PL_TRAVEL = {y0:86, step:27, h:24};
function drawTravelPick(){
  const dest = UI.travelDest;
  const opts = travelOptions(dest);
  const n = opts.length+1;
  pl_panel({title:'¿QUIEN VIENE?', icon:IC.map, color:'sky'});
  /* rumbo: de aquí a allí */
  uiStag(0, ()=>{
    const s1 = ZONES[G.zone||'prado'].name, s2 = ZONES[dest].name;
    const w = textW(s1) + 12 + textW(s2), x = Math.round(80 - w/2);
    drawText(s1, x, 75, UIC.muted);
    const ax = x + textW(s1) + 3, ab = Math.round(Math.sin(performance.now()/180));
    px(ax+ab, 77, 5, 1, UIC.goldTx); px(ax+3+ab, 76, 1, 3, UIC.goldTx); px(ax+4+ab, 77, 1, 1, UIC.goldTx);
    drawText(s2, ax + 9, 75, K);
  });
  let y = PL_TRAVEL.y0;
  opts.forEach((o, i)=>{
    const key = 'tv'+i, st = o.block ? 'locked' : 'normal';
    const L = LINES[o.p.line] || {};
    pl_item(i+1, key, ()=>{
      pl_card(22, y, 116, PL_TRAVEL.h, st, key);
      /* retrato enmarcado con el color de su línea */
      const fx0 = 25, fy0 = y+2;
      uiBox(fx0, fy0, 20, 20, o.block ? '#b8b0a0' : uiLight(L.eggSpot||'#7ac74f', 0.55), K);
      px(fx0+1, fy0+14, 18, 5, o.block ? '#a8a090' : uiLight(L.eggSpot||'#7ac74f', 0.25));
      ctx.save(); if(o.block) ctx.globalAlpha *= 0.5;
      pl_fit(pl_petSpr(o.p), fx0+10, fy0+10, 18);
      ctx.restore();
      if(o.block) uiLock(fx0+14, fy0+12);
      drawText(uiFit(petName(o.p), 60), 49, y+5, o.block ? 'rgba(26,20,40,0.5)' : K);
      const msg = uiDenyMsg(key);
      if(o.block || msg) drawText(uiFit(msg || o.block, 86), 49, y+14, UIC.redTx);
      else drawText('LV'+o.p.level+' · '+(L.name||''), 49, y+14, UIC.muted);
      if(!o.block){ const ch = Math.round(Math.sin(performance.now()/200+i)*1); px(130+ch, y+10, 2, 1, UIC.goldTx); px(131+ch, y+9, 1, 3, UIC.goldTx); }
      pl_glow(22, y, 116, PL_TRAVEL.h, key);
    });
    y += PL_TRAVEL.step;
  });
  uiStag(n, ()=>{ uiButton({x:22, y, w:116, h:PL_TRAVEL.h-2, label:'VOY YO SOLO', kind:'secondary', key:'tvSolo'}); });
  uiHint('TOCA FUERA: TE QUEDAS', 80, y + 29);
}

/* =========================================================
   LA TORRE DEL PRADO: una torre de verdad, piso a piso
   ========================================================= */
const PL_TW = {x:14, w:50, base:228};
function pl_towerFloorY(f){ return PL_TW.base - 20 - f*27; }   /* f = 1..5 */
function pl_towerMaxHp(p){ return Math.round((24 + p.level*2.5 + p.weight*0.4) * (1 + 0.10*perk('caparazon'))); }
function pl_drawTower(now){
  const T = G.tower, cur = T ? T.floor : 0;
  const x = PL_TW.x, w = PL_TW.w, gy = PL_TW.base;
  const wall = '#a8a4b4', wallD = '#8a8698', wallL = '#c4c0d0';
  /* suelo */
  px(x-4, gy, w+8, 3, '#7ac74f'); px(x-4, gy+3, w+8, 2, '#57a05e');
  /* planta baja con la puerta */
  const by = gy-20;
  uiBox(x, by, w, 21, wall, K);
  const open = !T;
  const dx = x + w/2 - 7;
  px(dx+1, by+5, 12, 15, K); px(dx+2, by+4, 10, 1, K); px(dx+4, by+3, 6, 1, K);
  px(dx+2, by+6, 10, 14, open ? '#ffe9a8' : '#3b3552'); px(dx+3, by+5, 8, 1, open ? '#ffe9a8' : '#3b3552');
  if(open){ const g = 0.25 + 0.15*Math.sin(now/300); ctx.save(); ctx.globalAlpha = g; px(dx-2, by+2, 18, 19, '#ffd94a'); ctx.restore(); }
  /* pisos */
  for(let f=1; f<=5; f++){
    const fy = pl_towerFloorY(f);
    const done = T && f < cur, here = T && f === cur;
    uiBox(x+1, fy, w-2, 28, wall, K);
    /* ladrillos */
    for(let r=0;r<5;r++){
      const yy = fy+3+r*5;
      px(x+2, yy, w-4, 1, wallD);
      for(let c=(r%2)*5; c<w-4; c+=10) px(x+2+c, yy+1, 1, 4, wallD);
    }
    px(x+2, fy+1, w-4, 1, wallL);
    /* número del piso */
    uiBox(x+3, fy+9, 9, 9, f===5 ? '#8a6ae8' : '#3b3552', K);
    drawText(String(f), x+6, fy+11, f===5 ? '#ffffff' : '#ffe9a8');
    /* ventana arqueada */
    const wx = x + w/2 - 6, wy = fy + 6;
    const lit = done ? '#ffd94a' : (here ? '#fff3c8' : '#20243c');
    px(wx+2, wy, 8, 1, K); px(wx+1, wy+1, 10, 1, K); px(wx, wy+2, 12, 14, K);
    px(wx+2, wy+1, 8, 1, lit); px(wx+1, wy+2, 10, 13, lit);
    px(wx+6, wy+2, 1, 13, K); px(wx+1, wy+8, 10, 1, K);
    if(done){ uiCheck(wx+3, wy+10); px(wx+2, wy+3, 2, 2, '#fff8d0'); }
    else if(!here){
      /* algo espera dentro: ojitos que parpadean */
      if(Math.floor(now/1400 + f*0.37) % 4 !== 0){ px(wx+2, wy+5, 1, 1, '#e2574c'); px(wx+4, wy+5, 1, 1, '#e2574c'); }
      if(f===5){ px(wx+8, wy+10, 2, 2, '#e2574c'); }
    }
    if(here){
      const g = 0.5 + 0.5*Math.sin(now/200);
      ctx.save(); ctx.globalAlpha = g*0.6;
      px(wx-1, wy-1, 14, 1, '#ffd94a'); px(wx-1, wy+16, 14, 1, '#ffd94a'); px(wx-1, wy, 1, 16, '#ffd94a'); px(wx+12, wy, 1, 16, '#ffd94a');
      ctx.restore();
      pl_fit(pl_petSpr(AP()), wx+6, wy+9 + Math.round(Math.sin(now/300)), 12);
    }
    /* marcas de premio */
    if(f===3){ const bx = x+w-12; pl_pix(["..k..",".kyk.","kyyyk","kykyk","kyyyk",".kkk."], bx, fy+11, {k:K, y:'#ffd94a'}); }
    if(f===5){ const bx = x+w-13; pl_pix(["y.y.y","yyyyy","yryry","yyyyy"], bx, fy+12, {y:'#ffd94a', r:'#e2574c'}); }
  }
  /* almenas y bandera */
  const ty = pl_towerFloorY(5) - 6;
  for(let i=0;i<5;i++) uiBox(x + i*11, ty, 7, 7, wall, K);
  px(x, ty+5, w, 2, wall);
  const fx = x + w/2;
  px(fx, ty-16, 1, 16, K);
  const wv = Math.floor(now/180) % 3;
  const flagCol = G.hats && G.hats.laurel ? '#7ac74f' : '#8a6ae8';
  px(fx+1, ty-16, 10, 6, flagCol); px(fx+11, ty-15 + (wv===1?1:0), 2, 4, flagCol);
  px(fx+1, ty-16, 10, 1, uiLight(flagCol, 0.4)); px(fx+1, ty-11, 10, 1, uiDark(flagCol, 0.3));
}
function pl_rule(i, y, icon, l1, l2, c2){
  uiStag(i, ()=>{
    iconSlot(72, y, icon, {s:14});
    drawText(l1, 90, y+1, K);
    if(l2) drawText(l2, 90, y+8, c2 || UIC.muted);
  });
}
const PL_TWBTN = {x:70, y:156, w:76, h:22};
const PL_TWRUN = {x:70, y:150, w:76, h:22};
const PL_TWQUIT = {x:70, y:178, w:76, h:14};
function drawTower(){
  const now = performance.now();
  pl_panel({title:'LA TORRE', icon:UIIC.trofeo, color:'play', currency:true});
  uiStag(0, ()=>pl_drawTower(now));
  const msg = pl_denyMsg('tw');
  if(!G.tower){
    pl_rule(1, 58, UIIC.fue, '5 COMBATES', 'SEGUIDOS');
    pl_rule(2, 76, UIIC.heart, 'LA VIDA NO', 'SE CURA', UIC.redTx);
    pl_rule(3, 94, UIIC.mota, 'PISO 3', 'BOLSA DE ✦', UIC.goldTx);
    pl_rule(4, 112, SPR.hat_laurel || UIIC.star, 'PISO 5 JEFE', G.hats && G.hats.laurel ? 'RELIQUIA' : 'LAUREL+RELIQ', UIC.goldTx);
    const cool = Date.now() < (G.towerNextAt||0);
    uiStag(5, ()=>{
      if(cool){
        uiButton({x:PL_TWBTN.x, y:PL_TWBTN.y, w:PL_TWBTN.w, h:PL_TWBTN.h, label:'CERRADA', disabled:true, key:'twGo'});
        drawTextC('ABRE EN '+pl_mmss(G.towerNextAt-Date.now()), PL_TWBTN.x+PL_TWBTN.w/2, 182, UIC.muted);
      } else {
        const afford = G.motas >= TOWER.fee;
        uiButton({x:PL_TWBTN.x, y:PL_TWBTN.y, w:PL_TWBTN.w, h:PL_TWBTN.h, label:'ENTRAR', kind: afford ? 'primary' : 'secondary', key:'twGo'});
        const w = textW(fmt(TOWER.fee))+12;
        pricePill(PL_TWBTN.x + PL_TWBTN.w/2 + Math.round(w/2), 181, TOWER.fee, afford);
      }
    });
    if(msg) drawTextC(uiFit(msg, 78), 108, 196, UIC.redTx);
    else { drawTextC('SI PIERDES', 108, 196, UIC.faint); drawTextC('ESTAS FUERA', 108, 203, UIC.faint); }
  } else {
    const p = AP(), T = G.tower;
    uiStag(1, ()=>{
      pl_big('PISO '+T.floor, 72, 60, '#3b3552', 'rgba(26,20,40,0.2)');
      drawText('DE 5', 72, 74, UIC.muted);
    });
    uiStag(2, ()=>{
      const mx = pl_towerMaxHp(p), hp = T.php==null ? mx : Math.ceil(T.php);
      pl_heart(72, 86);
      drawText('VIDA', 80, 86, K);
      drawText(String(hp), 146 - textW(String(hp)), 86, hp < mx*0.3 ? UIC.redTx : UIC.greenTx);
      uiBar(72, 93, 74, 4, uiCount('twhp', hp)/mx, hp < mx*0.3 ? UIC.red : UIC.green);
      pl_bolt(73, 100);
      drawText('PILAS', 80, 101, K);
      const en = Math.round(p.energy);
      drawText(String(en), 146 - textW(String(en)), 101, en < 12 ? UIC.redTx : K);
      uiBar(72, 108, 74, 4, uiCount('twen', en)/100, en < 12 ? UIC.red : UIC.cyan);
    });
    uiStag(3, ()=>{
      const NEXT = ['', 'RIVAL FACIL', 'RIVAL FACIL', 'RIVAL DURO', 'ELITE', 'EL JEFE'];
      drawText('TE ESPERA', 72, 120, UIC.muted);
      drawText(NEXT[T.floor]||'', 72, 128, T.floor>=4 ? UIC.redTx : K);
      if(T.floor===3) drawText('+BOLSA ✦', 72, 136, UIC.goldTx);
    });
    uiStag(4, ()=>{
      uiButton({x:PL_TWRUN.x, y:PL_TWRUN.y, w:PL_TWRUN.w, h:PL_TWRUN.h, label:'¡AL PISO '+T.floor+'!', kind:'danger', key:'twRun'});
      uiButton({x:PL_TWQUIT.x, y:PL_TWQUIT.y, w:PL_TWQUIT.w, h:PL_TWQUIT.h, label:'RENDIRSE', kind:'secondary', key:'twQuit'});
    });
    if(msg) drawTextC(uiFit(msg, 78), 108, 200, UIC.redTx);
    else drawTextC('SI PIERDES SALES', 108, 200, UIC.faint);
  }
}

/* =========================================================
   SALA DE JUEGOS: máquinas recreativas con su minipantalla
   ========================================================= */
const PL_GRID = {x:10, y:50, cw:44, ch:56, sx:47, sy:60};
/* minipantallas (36x22) de cada juego */
const PL_PREV = {
  mgCatch(x, y, t){
    px(x, y, 36, 22, '#2a3a7a'); px(x, y+11, 36, 11, '#34488a');
    px(x, y+19, 36, 3, '#57a05e'); px(x, y+19, 36, 1, '#7ac74f');
    for(let k=0;k<3;k++){
      const fy = Math.floor((t/28 + k*8) % 20);
      const fx = x + 6 + k*11;
      px(fx, y+fy, 2, 2, '#ffd94a'); px(fx, y+fy, 1, 1, '#ffffff');
    }
    const bx = x + 15 + Math.round(Math.sin(t/420)*11);
    px(bx, y+15, 7, 4, '#7ac74f'); px(bx+1, y+14, 5, 1, '#7ac74f');
    px(bx+2, y+16, 1, 1, K); px(bx+4, y+16, 1, 1, K);
  },
  mgDance(x, y, t){
    px(x, y, 36, 22, '#3a1f4a');
    const beat = Math.floor(t/280);
    const cols = ['#e2574c','#ffd94a','#5ec8d8','#f2a2b8'];
    for(let i=0;i<6;i++) for(let j=0;j<2;j++) px(x+i*6, y+14+j*4, 6, 4, cols[(i+j+beat)%4]);
    for(let i=0;i<6;i++) px(x+i*6, y+14, 1, 8, 'rgba(0,0,0,0.25)');
    const b = beat%2 ? 1 : 0;
    drawText('♥', x+16, y+5-b*2, '#ff9ab0');
    px(x+6, y+2+(beat%3), 1, 4, '#ffffff'); px(x+7, y+2+(beat%3), 2, 1, '#ffffff');
    px(x+28, y+3+((beat+1)%3), 1, 4, '#ffffff'); px(x+29, y+3+((beat+1)%3), 2, 1, '#ffffff');
  },
  mgSimon(x, y, t){
    px(x, y, 36, 22, '#20243c');
    const C = [['#e2574c','#ff9a90'],['#5ec8d8','#c8f4fa'],['#7ac74f','#c8f0a8'],['#ffd94a','#fff8c0']];
    const lit = [0,2,1,3,2][Math.floor(t/380)%5];
    const P = [[4,2],[19,2],[4,12],[19,12]];
    P.forEach((q, i)=>{
      const on = i===lit && (t%380)<260;
      uiBox(x+q[0], y+q[1], 13, 8, on ? C[i][1] : uiDark(C[i][0], 0.35), K);
    });
  },
  mgJump(x, y, t){
    px(x, y, 36, 22, '#8fd8e8'); px(x+24, y+3, 6, 2, '#ffffff'); px(x+25, y+2, 4, 1, '#ffffff');
    px(x, y+18, 36, 4, '#57a05e'); px(x, y+18, 36, 1, '#7ac74f');
    const p = (t % 1100)/1100;
    const ox = Math.round(x + 38 - p*46);
    px(ox, y+13, 3, 5, '#3a7048'); px(ox-1, y+15, 1, 2, '#3a7048');
    const jp = p > 0.58 && p < 0.84 ? Math.sin((p-0.58)/0.26*Math.PI) : 0;
    const ry = y + 13 - Math.round(jp*8);
    px(x+7, ry, 5, 5, '#f0a04b'); px(x+10, ry+1, 1, 1, K);
  },
  mgTopo(x, y, t){
    px(x, y, 36, 22, '#7ac74f'); px(x, y, 36, 3, '#8fd06a');
    const k = Math.floor(t/650)%3, ph = (t%650)/650;
    const up = Math.round(Math.sin(ph*Math.PI)*6);
    for(let i=0;i<3;i++){
      const hx = x + 3 + i*11;
      px(hx, y+14, 9, 3, '#3b2f2f');
      if(i===k && up>0){
        px(hx+2, y+14-up, 5, up, '#a4713a');
        px(hx+3, y+15-up, 1, 1, K); px(hx+5, y+15-up, 1, 1, K);
        px(hx+4, y+16-up, 1, 1, '#f2a2b8');
      }
      px(hx-1, y+16, 11, 2, '#57a05e');
    }
  },
  mgPesca(x, y, t){
    px(x, y, 36, 7, '#bfe6f0'); px(x, y+7, 36, 15, '#4a90d8');
    const w = Math.floor(t/200)%4;
    for(let i=0;i<36;i+=4) px(x+i+(w%2), y+7, 2, 1, '#9adcf0');
    const bob = Math.round(Math.sin(t/260)*1);
    px(x+17, y+1, 1, 6+bob, '#ffffff');
    px(x+16, y+6+bob, 3, 2, '#e2574c'); px(x+16, y+8+bob, 3, 1, '#ffffff');
    const fx = x + Math.round(((t/40) % 44) - 6);
    px(fx, y+15, 6, 3, '#2f6aa8'); px(fx-2, y+14, 2, 5, '#2f6aa8');
  },
  mgMemo(x, y, t){
    px(x, y, 36, 22, '#3b2f5a');
    const f = Math.floor(t/500)%8;
    for(let i=0;i<8;i++){
      const cx = x + 2 + (i%4)*9, cy = y + 2 + Math.floor(i/4)*10;
      const up = i===f || i===(f+3)%8 && (t%500)>250;
      uiBox(cx, cy, 7, 8, up ? '#f6efe0' : '#8a6ae8', K);
      if(up) pl_pix([".r.r.","rrrrr",".rrr.","..r.."], cx+1, cy+2, {r: i%2 ? '#e2574c' : '#5ec8d8'});
      else px(cx+3, cy+3, 1, 2, '#c8b8f8');
    }
  },
  mgGlobo(x, y, t){
    px(x, y, 36, 22, '#bfe6f0'); px(x, y+12, 36, 10, '#d8f0f8');
    px(x+3, y+4, 7, 2, '#ffffff'); px(x+26, y+8, 6, 2, '#ffffff');
    const gy = y + 5 + Math.round(Math.sin(t/300)*3), gx = x + 15 + Math.round(Math.sin(t/700)*4);
    px(gx+1, gy, 5, 1, '#f78fb3'); px(gx, gy+1, 7, 5, '#f78fb3'); px(gx+1, gy+6, 5, 1, '#f78fb3');
    px(gx+1, gy+1, 2, 2, '#ffd3e2'); px(gx+3, gy+7, 1, 4, K);
    for(let i=0;i<36;i+=4){ px(x+i+1, y+19, 2, 1, '#6a6a78'); px(x+i, y+20, 4, 2, '#6a6a78'); }
  }
};
function pl_cabinet(i, M, now){
  const x = PL_GRID.x + (i%3)*PL_GRID.sx, y = PL_GRID.y + Math.floor(i/3)*PL_GRID.sy;
  const key = 'cab'+i;
  const owned = !M.gkey || !!G.games[M.gkey];
  const afford = G.motas >= (M.cost||0);
  const best = G.best[M.id]||0;
  const th = MG_STARS[M.id];
  const stars = th ? mgStarsFor(M.id, best) : -1;
  pl_item(i, key, ()=>{
    const base = owned ? M.col : '#a09a8a';
    const body = uiDark(base, 0.5);
    px(x+2, y+56, 42, 1, 'rgba(26,20,40,0.25)');
    uiBox(x, y, 44, 56, body, K);
    px(x+1, y+2, 1, 52, uiDark(base, 0.3)); px(x+42, y+2, 1, 52, uiDark(base, 0.68));
    /* marquesina */
    uiBox(x+2, y+2, 40, 10, base, K);
    px(x+3, y+3, 38, 1, uiLight(base, 0.45));
    drawTextOC(M.name, x+22, y+4, owned ? '#ffffff' : '#ece4d0', 1, uiDark(base, 0.62));
    /* pantalla */
    px(x+3, y+13, 38, 24, K);
    ctx.save();
    ctx.beginPath(); ctx.rect(x+4, y+14, 36, 22); ctx.clip();
    (PL_PREV[M.id] || ((a,b)=>px(a,b,36,22,'#20243c')))(x+4, y+14, owned ? now + i*137 : 1200 + i*300);
    ctx.globalAlpha *= 0.12;
    for(let yy=y+15; yy<y+36; yy+=2) px(x+4, yy, 36, 1, '#000000');
    ctx.restore();
    px(x+5, y+15, 5, 1, 'rgba(255,255,255,0.45)'); px(x+5, y+16, 2, 1, 'rgba(255,255,255,0.3)');
    if(!owned){
      px(x+4, y+14, 36, 22, 'rgba(20,16,32,0.55)');
      pl_pix([".kkkkk.","kk...kk","k.....k","kkkkkkk","kyyyyyk","kyykyyk","kyykyyk","kkkkkkk"], x+19, y+21, {k:K, y:afford ? '#ffd94a' : '#c8c0b0'});
      px(x+20, y+22, 5, 1, '#c8c0b0'); px(x+20, y+23, 1, 1, '#c8c0b0'); px(x+24, y+23, 1, 1, '#c8c0b0');
    }
    /* el porqué de un "no", en la propia pantalla de la máquina */
    const dm = uiDenyMsg(key);
    if(dm){
      const L = uiWrap(dm, 36, 2);
      const bh = L.length*7 + 3, by = y + 14 + Math.round((22-bh)/2);
      px(x+4, by, 36, bh, 'rgba(160,48,48,0.92)');
      L.forEach((l, k)=>drawTextC(l, x+22, by+2+k*7, '#ffffff'));
    }
    /* panel de mandos: qué entrena */
    drawTextC(M.sub, x+22, y+39, owned ? '#f6efe0' : 'rgba(246,239,224,0.55)');
    /* placa: récord y estrellas, o precio */
    if(owned){
      uiBox(x+3, y+46, 38, 8, '#1e1a2e', K);
      pl_pix(["yyyyy",".yyy.","..y..",".yyy."], x+5, y+48, {y: best>0 ? '#ffd94a' : '#5a5070'});
      drawText(best>0 ? String(best) : 'NUEVO', x+11, y+48, best>0 ? '#ffffff' : '#8a90c8');
      if(stars>=0 && best>0) for(let s=0;s<3;s++) pl_pix(PL_STAR4, x+23+s*5, y+48, {y: s<stars ? '#ffd94a' : '#4a4460'});
    } else {
      const w = textW(fmt(M.cost))+12;
      pricePill(x + 22 + Math.round(w/2), y+45, M.cost, afford);
    }
    /* comprable: un brillo recorre la marquesina */
    if(!owned && afford){
      const sh = ((now/8 + i*40) % 160) - 20;
      if(sh >= 0 && sh < 38){ ctx.save(); ctx.globalAlpha *= 0.55; px(x+3+Math.round(sh), y+3, 2, 8, '#ffffff'); ctx.restore(); }
    }
    pl_glow(x, y, 44, 56, key);
  });
}
function drawGames(){
  const now = performance.now();
  pl_panel({title:'SALA DE JUEGOS', icon:IC.play, color:'play', currency:true});
  G.best = G.best||{};
  for(let i=0;i<MINIGAMES.length;i++) pl_cabinet(i, MINIGAMES[i], now);
  /* la novena casilla: el marcador de la sala */
  const i = MINIGAMES.length;
  if(i < 9){
    const x = PL_GRID.x + (i%3)*PL_GRID.sx, y = PL_GRID.y + Math.floor(i/3)*PL_GRID.sy;
    let got = 0, max = 0;
    for(const M of MINIGAMES){
      if(!MG_STARS[M.id]) continue;
      max += 3;
      if(!M.gkey || G.games[M.gkey]) got += mgStarsFor(M.id, G.best[M.id]||0);
    }
    uiStag(i, ()=>{
      uiBox(x, y, 44, 56, UIC.well, UIC.wellLo);
      px(x+1, y+1, 42, 1, UIC.wellLo);
      ctx.drawImage(UIIC.trofeo, x+18, y+5);
      drawTextC('★'+got+'/'+max, x+22, y+18, UIC.goldTx);
      drawTextC('JUGAR', x+22, y+30, UIC.muted);
      drawTextC('TAMBIEN', x+22, y+37, UIC.muted);
      drawTextC('ENTRENA', x+22, y+44, UIC.muted);
    });
  }
  const msg = pl_denyMsg('cab');
  if(msg) drawTextC(msg, 80, 232, UIC.redTx);
  else { const p = AP(); drawTextC('PILAS '+Math.round(p.energy)+'  ·  CADA JUEGO -10', 80, 232, UIC.faint); }
}

/* =========================================================
   DISCOTECA: vinilos con preescucha
   ========================================================= */
const PL_DZ = {y0:61, step:30, h:27};
const PL_DZ_COL = {prado:'#7ac74f', verbena:'#e2574c', luna:'#8a6ae8', nana:'#5ec8d8', maquina:'#ffd94a'};
function pl_vinyl(cx, cy, r, lab, ang, playing){
  for(let dy=-r; dy<=r; dy++){
    const w = Math.floor(Math.sqrt(r*r - dy*dy + r*0.8));
    px(cx-w, cy+dy, 2*w+1, 1, '#1e1a28');
  }
  /* surcos */
  for(const gr of [r-2, r-4]){
    for(let a=0; a<Math.PI*2; a+=0.35){
      px(Math.round(cx+Math.cos(a)*gr), Math.round(cy+Math.sin(a)*gr), 1, 1, '#3a3450');
    }
  }
  /* brillo que gira con el disco */
  for(const off of [0, Math.PI]){
    const a = ang + off;
    for(let d=r-4; d<=r-1; d++) px(Math.round(cx+Math.cos(a)*d), Math.round(cy+Math.sin(a)*d), 1, 1, playing ? '#a8a0c8' : '#6a6288');
  }
  /* etiqueta */
  px(cx-3, cy-2, 7, 5, lab); px(cx-2, cy-3, 5, 7, lab);
  px(cx-2, cy-2, 2, 1, uiLight(lab, 0.5));
  px(cx, cy, 1, 1, '#f6efe0');
}
function drawDiscos(){
  const now = performance.now();
  pl_panel({title:'DISCOTECA', icon:UIIC.aro, color:'play', currency:true});
  const playing = now < (UI.previewUntil||0) ? UI.plPrevI : -1;
  for(let i=0;i<DISCOS.length;i++){
    const D = DISCOS[i], key = 'dz'+i;
    const owned = !!G.discos[D.id];
    const afford = G.motas >= D.cost;
    const on = G.disco===D.id;
    const y = PL_DZ.y0 + i*PL_DZ.step;
    const lab = PL_DZ_COL[D.id] || '#f0a04b';
    pl_item(i, key, ()=>{
      pl_card(10, y, 140, PL_DZ.h, owned ? (on ? 'on' : 'normal') : (afford ? 'normal' : 'poor'), key, on ? UIC.gold : null);
      /* funda (si no es tuyo) y vinilo */
      const vx = 25, vy = y + 13;
      const pop = uiFlashK(key);
      const isP = playing===i;
      const ang = isP ? now/90 : 0.6;
      if(!owned){
        pl_vinyl(vx+5, vy, 10, lab, ang, isP);
        uiBox(vx-12, vy-11, 20, 22, uiDark(lab, 0.15), K);
        px(vx-11, vy-10, 18, 1, uiLight(lab, 0.4));
        px(vx-9, vy-6, 12, 2, uiLight(lab, 0.5)); px(vx-9, vy-2, 8, 1, uiDark(lab, 0.35));
        drawText(D.name.replace('DISCO ','').slice(0,1), vx-4, vy+3, '#ffffff');
      } else {
        pl_vinyl(vx - Math.round(pop*6), vy, 11, lab, ang, isP);
      }
      /* botón de preescucha */
      const bx = vx+4, by = vy+3;
      uiBox(bx, by, 9, 9, isP ? UIC.green : UIC.gold, K);
      if(isP){ px(bx+3, by+3, 3, 3, K); }
      else { px(bx+3, by+2, 1, 5, K); px(bx+4, by+3, 1, 3, K); px(bx+5, by+4, 1, 1, K); }
      /* texto */
      const nm = D.name.replace('DISCO ','');
      drawText(nm, 40, y+5, owned ? K : 'rgba(26,20,40,0.75)');
      if(isP){
        for(let b=0;b<4;b++){
          const hgt = 1 + Math.floor((Math.sin(now/90 + b*1.7)+1)*2.2);
          px(42 + textW(nm) + b*3, y+10-hgt, 2, hgt, UIC.greenTx);
        }
      }
      const msg = uiDenyMsg(key);
      drawText(uiFit(msg || D.desc, owned ? 69 : 68), 40, y+14, msg ? UIC.redTx : UIC.muted);
      if(owned){
        uiButton({x:112, y:y+6, w:34, h:15, label:on ? '♥ BAILA' : 'BAILAR', kind:'good', key:key+'b'});
      } else {
        pricePill(146, y+9, D.cost, afford);
      }
      pl_glow(10, y, 140, PL_DZ.h, key);
    });
  }
  const msg = pl_denyMsg('dz');
  uiHint(msg ? '' : 'TOCA EL DISCO PARA OIRLO', 80, 214);
}

/* =========================================================
   EXPEDICIÓN: mapa de destinos + quién anda de viaje
   ========================================================= */
const PL_EX = {y0:57, step:29, h:27};
const PL_EXART = {
  prado(x, y, t){
    px(x, y, 30, 23, '#8fd8e8');
    px(x+22, y+3, 4, 4, '#ffd94a');
    for(let i=0;i<30;i++){ const h = Math.round(9 + Math.sin(i/5)*3); px(x+i, y+23-h, 1, h, '#7ac74f'); }
    for(let i=0;i<30;i++){ const h = Math.round(5 + Math.sin(i/4+2)*2); px(x+i, y+23-h, 1, h, '#57a05e'); }
    px(x+8, y+15, 1, 1, '#f2a2b8'); px(x+18, y+17, 1, 1, '#ffffff');
  },
  pico(x, y, t){
    px(x, y, 30, 23, '#f0a04b'); px(x, y, 30, 8, '#e2805c');
    for(let i=0;i<24;i++){ const h = Math.min(i, 24-i)+4; px(x+3+i, y+23-h, 1, h, '#6a4a4a'); }
    px(x+13, y+11, 4, 2, '#e2574c'); px(x+14, y+13, 2, 3, '#e2574c');
    const s = Math.floor(t/400)%3;
    px(x+13+s, y+6-s, 3, 2, 'rgba(90,80,90,0.7)'); px(x+16-s, y+3, 2, 2, 'rgba(90,80,90,0.5)');
  },
  costa(x, y, t){
    px(x, y, 30, 23, '#bfe6f0'); px(x, y+10, 30, 9, '#4a90d8');
    const w = Math.floor(t/250)%4;
    for(let i=0;i<30;i+=5) px(x+i+w, y+12+(i%2)*3, 3, 1, '#9adcf0');
    px(x, y+18, 30, 5, '#f6d186'); px(x, y+18, 30, 1, '#fff0c0');
    px(x+24, y+8, 1, 10, '#8a6a3a'); px(x+21, y+7, 7, 2, '#57a05e');
  },
  cima(x, y, t){
    px(x, y, 30, 23, '#20243c');
    for(let k=0;k<5;k++) if((Math.floor(t/300)+k)%3) px(x+3+k*6, y+2+(k%2)*3, 1, 1, '#ffffff');
    for(let i=0;i<30;i++){ const h = Math.min(i, 29-i)+3; px(x+i, y+23-h, 1, h, '#453e60'); }
    for(let i=11;i<19;i++){ const h = Math.min(i, 29-i)+3; px(x+i, y+23-h, 1, 3, '#f6efe0'); }
    px(x+22, y+3, 3, 3, '#ffd94a');
  },
  trueno(x, y, t){
    px(x, y, 30, 23, '#3b3552');
    for(let i=0;i<30;i++){ const h = Math.min(i+2, 28-i)+2; px(x+i, y+23-h, 1, h, '#6a6a78'); }
    px(x+2, y+2, 12, 4, '#5a5470'); px(x+14, y+1, 12, 5, '#5a5470');
    if(Math.floor(t/150)%12===0){ px(x, y, 30, 23, 'rgba(255,255,255,0.35)'); }
    if(Math.floor(t/150)%12<2) pl_pix(["..y","..y",".yy","yy.","y..","y.."], x+19, y+6, {y:'#ffd94a'});
  }
};
function pl_expedReason(p){
  if(p.exped) return 'YA ESTA DE VIAJE';
  if(p.stage<STAGES.CHILD) return 'AUN ES MUY PEQUENO';
  if(p.sleeping) return 'ESTA DURMIENDO';
  if(p.energy<20) return 'SIN PILAS (MIN 20)';
  return '';
}
function drawExped(){
  const now = performance.now();
  pl_panel({title:'EXPEDICION', icon:IC.map, color:'play'});
  const p = AP();
  const why = pl_expedReason(p);
  const msg = pl_denyMsg('ex');
  uiStag(0, ()=>{
    if(why || msg) drawTextC(uiFit(msg || why, 136), 80, 49, UIC.redTx);
    else drawTextC(uiFit('¿A DONDE VA '+currentNameOf(p)+'?', 136), 80, 49, UIC.muted);
  });
  const mult = expedMult();
  for(let i=0;i<EXPEDS.length;i++){
    const E = EXPEDS[i], key = 'ex'+i;
    const y = PL_EX.y0 + i*PL_EX.step;
    pl_item(i+1, key, ()=>{
      pl_card(10, y, 140, PL_EX.h, why ? 'locked' : 'normal', key);
      /* estampa del destino */
      px(12, y+2, 32, 23, K);
      ctx.save(); ctx.beginPath(); ctx.rect(13, y+2, 30, 23); ctx.clip();
      if(why) ctx.globalAlpha *= 0.55;
      (PL_EXART[E.id] || PL_EXART.prado)(13, y+2, now + i*500);
      ctx.restore();
      /* nombre y duración */
      drawText(uiFit(E.name, 66), 47, y+3, why ? 'rgba(26,20,40,0.55)' : K);
      const em = Math.round(expedMs(E, p)/60000);
      const ts = em>=60 ? (Math.round(em/6)/10)+'H' : em+'M';
      const tw = textW(ts);
      uiBox(146-tw-9, y+2, tw+9, 8, '#3b3552', K);
      pl_clock(146-tw-7, y+3, '#ffe9a8');
      drawText(ts, 146-tw-1, y+4, '#ffe9a8');
      /* premios */
      uiCoin(47, y+11);
      drawText('~'+fmt(Math.round(E.motas*mult)), 53, y+11, UIC.goldTx);
      pl_gem(88, y+11);
      drawText(Math.round(E.relic*100)+'%', 95, y+11, '#6a4ab8');
      if(E.egg){
        pl_egg(47, y+18, E.egg);
        drawText(uiFit(LINES[E.egg].name+' '+Math.round(E.eggP*100)+'%', 90), 53, y+19, '#a03030');
      }
      pl_glow(10, y, 140, PL_EX.h, key);
    });
  }
  /* quién anda de viaje, con su barra */
  const away = G.pets.filter(q=>q.exped);
  const sy = PL_EX.y0 + EXPEDS.length*PL_EX.step + 1;
  if(away.length){
    uiStag(7, ()=>{
      uiSection(12, sy, 136, 'DE VIAJE', UIC.muted);
      away.slice(0, 2).forEach((q, k)=>{
        const yy = sy + 8 + k*13;
        const E = EXPEDS[q.exped.dest];
        const dur = expedMs(E, q), left = Math.max(0, q.exped.until - Date.now());
        const pr = clamp01(1 - left/dur);
        pl_fit(pl_petSpr(q), 18, yy+5, 11);
        drawText(uiFit(currentNameOf(q), 36), 26, yy+3, K);
        uiBar(64, yy+3, 50, 5, pr, left<=0 ? UIC.green : UIC.cyan, 'rgba(26,20,40,0.18)');
        /* el bitxo camina por la barra */
        px(64 + Math.round(pr*48), yy+1 + (Math.floor(now/200)%2), 2, 2, K);
        drawText(left<=0 ? '¡YA!' : pl_mmss(left), 118, yy+3, left<=0 ? UIC.greenTx : UIC.muted);
      });
      if(away.length>2) drawText('+'+(away.length-2), 140, sy, UIC.muted);
    });
  } else {
    uiHint('CADA VIAJE GASTA 15 PILAS', 80, sy + 6);
    uiHint('Y VUELVE CON BOTIN', 80, sy + 14);
  }
}

/* =========================================================
   MISIONES: tablón de corcho con papeles clavados
   ========================================================= */
const PL_Q = {x:16, y0:56, step:36, h:32, w:128, wy:168, wh:36};
const PL_QOFF = [1, -1, 2];
function pl_qIcon(id){
  const m = {
    chispas: UIIC.mota, comidas: SPR.meal, juegos: IC.play, combate: UIIC.fue, limpia: IC.clean,
    mimos: UIIC.heart, entrena: IC.gym, combo: UIIC.star, parada: UIIC.def, cosecha: UIIC.cosecha,
    visita: IC.map, combates: UIIC.fue, elites: UIIC.trofeo
  };
  return m[id] || UIIC.star;
}
function pl_cork(x, y, w, h){
  px(x, y, w, h, '#c69a64');
  for(let k=0;k<140;k++){
    const hx = (k*73 + (k*k)%17*5) % w, hy = (k*41 + (k*7)%13*3) % h;
    px(x+hx, y+hy, 1, 1, k%3 ? '#b4864f' : '#d8b07a');
  }
  px(x, y, w, 1, '#8a5a32'); px(x, y, 1, h, '#8a5a32');
  px(x, y+h-1, w, 1, '#e0bc88'); px(x+w-1, y, 1, h, '#e0bc88');
}
function pl_pin(cx, y, col){
  px(cx-2, y, 5, 4, K); px(cx-1, y-1, 3, 6, K);
  px(cx-1, y, 3, 4, col); px(cx-2, y+1, 5, 2, col);
  px(cx-1, y, 1, 1, '#ffffff');
  px(cx+1, y+5, 1, 2, 'rgba(26,20,40,0.35)');
}
function pl_paper(x, y, w, h, col, pinCol){
  px(x+2, y+2, w, h, 'rgba(60,34,14,0.35)');
  px(x, y, w, h, col);
  px(x, y, w, 1, 'rgba(26,20,40,0.5)'); px(x, y+h-1, w, 1, 'rgba(26,20,40,0.5)');
  px(x, y, 1, h, 'rgba(26,20,40,0.5)'); px(x+w-1, y, 1, h, 'rgba(26,20,40,0.5)');
  /* esquina doblada */
  px(x+w-5, y+h-5, 4, 4, uiDark(col, 0.12)); px(x+w-5, y+h-5, 1, 4, 'rgba(26,20,40,0.3)'); px(x+w-5, y+h-5, 4, 1, 'rgba(26,20,40,0.3)');
  px(x+w-1, y+h-5, 1, 5, '#c69a64'); px(x+w-5, y+h-1, 5, 1, '#c69a64');
  pl_pin(x + (w>>1), y-1, pinCol||'#e2574c');
}
/* un encargo: icono, nombre, barra, premio y botón / sello */
function pl_questBody(x, y, w, q, prog, done, ready, key, popAt, top){
  const t = top||0;
  iconSlot(x+5, y+7+t, pl_qIcon(q.id), {s:16, dim:done});
  drawText(uiFit(q.name, w-30), x+25, y+5+t, done ? UIC.muted : K);
  const shown = uiCount(key+'p', prog);
  uiBar(x+25, y+13+t, 58, 5, shown/q.n, done ? UIC.green : (ready ? UIC.gold : UIC.orange), 'rgba(26,20,40,0.15)');
  px(x+25, y+13+t, 58, 1, 'rgba(26,20,40,0.12)');
  if(!ready) drawText(Math.min(q.n, shown)+'/'+q.n, x+87, y+13+t, done ? UIC.greenTx : UIC.muted);
  uiCoin(x+25, y+21+t);
  drawText('+'+q.m, x+31, y+21+t, UIC.goldTx);
  const msg = uiDenyMsg(key);
  if(msg) drawText(uiFit(msg, 60), x+50, y+21+t, UIC.redTx);
  if(ready){
    const bob = Math.round(Math.sin(performance.now()/160)*1);
    uiButton({x:x+w-50, y:y+18+t+bob, w:44, h:12, label:'¡COBRAR!', kind:'primary', key:key+'b'});
  } else if(done){
    /* sello que cae con fuerza al cobrar */
    const age = popAt ? performance.now()-popAt : 1e9;
    const sc = age < 260 ? 1 + (1-ease.outCubic(age/260))*1.5 : 1;
    const sx = x+w-30, sy = y+19+t;
    ctx.save(); ctx.translate(sx+12, sy+4); ctx.scale(sc, sc); ctx.translate(-(sx+12), -(sy+4));
    uiBox(sx, sy, 25, 9, 'rgba(122,199,79,0.25)', UIC.greenTx);
    drawText('HECHA', sx+3, sy+2, UIC.greenTx);
    ctx.restore();
  }
}
function drawQuests(){
  ensureDaily();
  const now = performance.now();
  pl_panel({title:'MISIONES', icon:UIIC.brote, color:'data'});
  pl_cork(11, 50, 138, 185);
  for(let i=0;i<3;i++){
    const q = QUESTS[G.daily.ids[i]], key = 'q'+i;
    const done = !!G.daily.claimed[q.id];
    const prog = Math.min(q.n, G.daily.prog[q.id]||0);
    const ready = !done && prog>=q.n;
    const x = PL_Q.x + PL_QOFF[i], y = PL_Q.y0 + i*PL_Q.step;
    const pa = UI.questAt && UI.questAt.i===i ? UI.questAt.t : 0;
    pl_item(i, key, ()=>{
      const sq = pa ? springSquash(pa, 0.12, now) : [1,1];
      ctx.save();
      if(sq[0]!==1){ ctx.translate(x+PL_Q.w/2, y+PL_Q.h/2); ctx.scale(sq[0], sq[1]); ctx.translate(-(x+PL_Q.w/2), -(y+PL_Q.h/2)); }
      pl_paper(x, y, PL_Q.w, PL_Q.h, done ? '#e6f2da' : (ready ? '#fff1c2' : '#f6efe0'), done ? '#7ac74f' : (ready ? '#ffd94a' : '#e2574c'));
      pl_questBody(x, y, PL_Q.w, q, prog, done, ready, key, pa);
      pl_glow(x, y, PL_Q.w, PL_Q.h, key);
      ctx.restore();
    });
  }
  /* la semanal: papel dorado con cinta */
  const W = weeklyDef();
  const wDone = G.weekly.claimed;
  const wProg = Math.min(W.n, G.weekly.prog);
  const wReady = !wDone && wProg>=W.n;
  pl_item(3, 'qw', ()=>{
    const x = PL_Q.x, y = PL_Q.wy;
    const pa = UI.plWeeklyAt||0;
    const sq = pa ? springSquash(pa, 0.12, now) : [1,1];
    ctx.save();
    if(sq[0]!==1){ ctx.translate(x+PL_Q.w/2, y+PL_Q.wh/2); ctx.scale(sq[0], sq[1]); ctx.translate(-(x+PL_Q.w/2), -(y+PL_Q.wh/2)); }
    pl_paper(x, y, PL_Q.w, PL_Q.wh, wDone ? '#e6f2da' : '#ffe9a8', '#8a6ae8');
    /* cinta */
    px(x+4, y+2, 36, 7, '#e2574c'); px(x+4, y+8, 36, 1, '#a03030');
    px(x+40, y+2, 2, 7, '#e2574c'); px(x+42, y+3, 1, 5, '#e2574c');
    drawText('SEMANAL', x+7, y+3, '#ffffff');
    pl_questBody(x, y, PL_Q.w, W, wProg, wDone, wReady, 'qw', pa, 5);
    pl_glow(x, y, PL_Q.w, PL_Q.wh, 'qw');
    ctx.restore();
  });
  /* cuándo llegan las nuevas */
  const mid = new Date(); mid.setHours(24,0,0,0);
  const s = 'NUEVAS EN '+pl_mmss(mid.getTime()-Date.now());
  const w = textW(s)+10;
  uiBox(80-(w>>1), 219, w, 11, '#8a5a32', K);
  px(80-(w>>1)+1, 220, w-2, 1, '#a4713a');
  drawTextC(s, 80, 222, '#ffe9a8');
}

/* =========================================================
   EL BUHONERO: puesto ambulante con toldo
   ========================================================= */
const PL_BU = {y0:100, step:30, h:27};
function pl_buhoIcon(o){
  if(o.kind==='hat') return SPR['hat_'+o.id] || UIIC.star;
  if(o.kind==='relic') return (cx, cy)=>{ pl_pix([".kkkkk.","kplllpk","kpplppk",".kpppk.","..kpk..","...k..."], Math.round(cx-3), Math.round(cy-3), {k:K, p:'#8a6ae8', l:'#e0d4ff'}); };
  if(o.kind==='boost') return (cx, cy)=>{ ctx.drawImage(UIIC.mota, Math.round(cx-6), Math.round(cy-6)); drawText('X', Math.round(cx+1), Math.round(cy+1), '#a03030'); };
  if(o.kind==='xp') return (cx, cy)=>pl_potion(Math.round(cx-4), Math.round(cy-5), '#5ec8d8');
  if(o.kind==='siesta') return (cx, cy)=>{ const x = Math.round(cx-5), y = Math.round(cy-3); uiBox(x, y, 8, 7, '#f6efe0', K); px(x+1, y+1, 6, 2, '#7a4e28'); px(x+8, y+2, 2, 3, K); px(x+2, y-3, 1, 2, '#b4b4bc'); px(x+5, y-4, 1, 2, '#b4b4bc'); };
  if(o.kind==='festin') return SPR.pastel || UIIC.heart;
  if(o.kind==='item' && o.id==='pocion') return (cx, cy)=>pl_potion(Math.round(cx-4), Math.round(cy-5), '#e2574c', '#ff9a90');
  if(o.kind==='item') return SPR.picante || UIIC.fue;
  return UIIC.star;
}
function drawBuhoShop(){
  const b = G.buho;
  if(!b) return;
  const now = performance.now();
  pl_panel({title:'EL BUHONERO', icon:IC.shop, color:'shop', currency:true});
  /* toldo a rayas */
  const ay = 57;
  for(let i=0;i<14;i++){
    const col = i%2 ? '#f6efe0' : '#8a6ae8';
    px(10+i*10, ay, 10, 6, col);
    px(11+i*10, ay+6, 8, 2, col); px(12+i*10, ay+8, 6, 1, col);
    px(10+i*10, ay+6, 1, 1, K); px(11+i*10, ay+8, 1, 1, K); px(12+i*10, ay+9, 6, 1, K); px(18+i*10, ay+8, 1, 1, K); px(19+i*10, ay+6, 1, 1, K);
  }
  px(10, ay, 140, 1, 'rgba(26,20,40,0.35)');
  /* el buhonero y su pregón */
  uiStag(0, ()=>{
    const spr = SPR.buhonero[0];
    const hop = Math.floor(now/500)%6===0 ? 1 : 0;
    ctx.drawImage(spr, 14, 94 - spr.height - hop);
    const bx = 44, by = 70;
    uiBox(bx, by, 102, 20, '#ffffff', K);
    px(bx-3, by+10, 3, 1, K); px(bx-2, by+9, 2, 1, '#ffffff'); px(bx-2, by+11, 2, 1, K); px(bx-1, by+9, 1, 3, '#ffffff');
    drawText('¡RAREZAS DE PASO!', bx+4, by+4, K);
    const sold = b.offers.filter(o=>o.sold).length;
    drawText(sold===b.offers.length ? '¡ME LO HAS COMPRADO TODO!' : 'NO VUELVO HASTA OTRO DIA', bx+4, by+12, UIC.muted);
  });
  /* mostrador */
  px(10, 94, 140, 3, '#a4713a'); px(10, 97, 140, 1, '#6a4a2a'); px(10, 94, 140, 1, '#c8955a');
  b.offers.forEach((o, i)=>{
    const afford = G.motas>=o.cost;
    const key = 'bu'+i;
    uiRow({x:12, y:PL_BU.y0 + i*PL_BU.step, w:136, h:PL_BU.h, key, i:i+1,
      icon: pl_buhoIcon(o), title:o.name, sub:o.desc || (o.kind==='item' ? 'PARA LA MOCHILA' : ''),
      state: o.sold ? 'owned' : (afford ? 'normal' : 'poor'),
      price: o.sold ? undefined : o.cost, afford, badge: o.sold ? {text:'VENDIDO', bg:'#c8ecb0', fg:'#2a5a30', rim:'#5a9a48'} : undefined});
  });
  /* reloj de arena: se va */
  const left = Math.max(0, b.until-Date.now());
  const k = clamp01(left/150000);
  const urgent = left < 30000;
  const y = PL_BU.y0 + 3*PL_BU.step + 2;
  uiStag(5, ()=>{
    pl_pix(["kkkkk",".kyk.","..k..",".kyk.","kyyyk","kkkkk"], 16, y, {k:K, y:'#ffd94a'});
    const s = 'SE VA EN '+pl_mmss(left);
    const blink = urgent && Math.floor(now/250)%2;
    drawText(s, 24, y+1, blink ? '#e2574c' : (urgent ? UIC.redTx : K));
    uiBar(24 + textW(s) + 5, y+2, 140 - (24 + textW(s) + 5) + 4, 3, k, urgent ? UIC.red : UIC.purple, 'rgba(26,20,40,0.15)');
  });
  const it = (G.items||[]).length;
  uiHint('MOCHILA '+it+'/3', 80, y+13);
}

/* ---------------- TOQUES de estas pantallas ---------------- */
function tapAscendConfirm(x, y){
  /* SOLO el botón del SÍ confirma; cualquier otro toque cancela */
  if(uiHit(PL_YES, x, y)){ uiPress('dlgYes'); doAscend(); }
  else { UI.mode='stats'; SFX.tap(); }
}
SCREEN_TAP.ascendConfirm = tapAscendConfirm;
function tapParqueConfirm(x, y){
  /* SOLO el botón del SÍ confirma; cualquier otro toque cancela */
  if(uiHit(PL_YES, x, y)){ uiPress('dlgYes'); openParque(); if(G.zonesOpen.parque) confetti(80, 140, 24); }
  else { UI.mode='main'; SFX.tap(); }
}
SCREEN_TAP.parqueConfirm = tapParqueConfirm;
function tapHuertaConfirm(x, y){
  /* SOLO el botón del SÍ confirma; cualquier otro toque cancela */
  if(uiHit(PL_YES, x, y)){ uiPress('dlgYes'); openHuerta(); if(G.zonesOpen.huerta) confetti(80, 140, 24); }
  else { UI.mode='main'; SFX.tap(); }
}
SCREEN_TAP.huertaConfirm = tapHuertaConfirm;
function tapTravelPick(x, y){
  const opts = travelOptions(UI.travelDest);
  const T = PL_TRAVEL;
  if(x>=22 && x<=138 && y>=T.y0 && y<T.y0+(opts.length+1)*T.step){
    const i = Math.floor((y-T.y0)/T.step);
    if(i<opts.length){
      uiPress('tv'+i);
      if(opts[i].block){ uiDeny('tv'+i, opts[i].block); }
      travelWith(opts[i].i); return;
    }
    uiPress('tvSolo');
    const d = UI.travelDest;
    UI.mode='main'; goWithToast(d);
    return;
  }
  if(pl_inPanel(x, y)) return;
  UI.mode='main'; SFX.tap();
}
SCREEN_TAP.travelPick = tapTravelPick;
function pl_towerWhy(){
  const p = AP();
  if(p.stage<STAGES.CHILD) return 'MUY PEQUENO';
  if(Date.now() < (G.towerNextAt||0)) return 'AUN CERRADA';
  if(G.motas < TOWER.fee) return 'FALTAN ✦'+fmt(TOWER.fee-G.motas);
  if(p.sleeping) return 'ESTA DURMIENDO';
  return 'SIN PILAS';
}
function tapTower(x, y){
  const pad = (r)=>({x:r.x, y:r.y-2, w:r.w, h:r.h+4});
  if(!G.tower){
    if(uiHit(pad(PL_TWBTN), x, y)){
      uiPress('twGo');
      const why = pl_towerWhy();
      towerEnter();
      if(UI.mode==='tower') uiDeny('twGo', why);
      return;
    }
  } else {
    if(uiHit(pad(PL_TWRUN), x, y)){
      uiPress('twRun');
      const why = pl_towerWhy();
      towerLaunch();
      if(UI.mode==='tower') uiDeny('twRun', why);
      return;
    }
    if(uiHit(PL_TWQUIT, x, y)){ uiPress('twQuit'); towerAbandon(); return; }
  }
  if(pl_inPanel(x, y)) return;
  UI.mode='play'; SFX.tap();
}
SCREEN_TAP.tower = tapTower;
function tapGames(x, y){
  const R = PL_GRID;
  if(x>=R.x && x<R.x+3*R.sx && y>=R.y && y<R.y+3*R.sy){
    const col = Math.floor((x-R.x)/R.sx), row = Math.floor((y-R.y)/R.sy);
    const i = row*3 + col;
    if(col>=0 && col<3 && row>=0 && row<3 && i<MINIGAMES.length){
      const M = MINIGAMES[i], key = 'cab'+i;
      const owned = !M.gkey || !!G.games[M.gkey];
      uiPress(key);
      if(!owned){
        const short = M.cost - G.motas;
        buyGame(M.gkey, M.cost);
        const cx = R.x + col*R.sx + 22, cy = R.y + row*R.sy + 26;
        if(G.games[M.gkey]){
          uiFlash(key); confetti(cx, cy, 22); ringFx(cx, cy, '#ffd94a', 26, 380);
          popText(cx, cy-14, '¡NUEVO!', '#ffd94a', {big:true});
        } else uiDeny(key, 'FALTAN ✦'+fmt(short));
        return;
      }
      if(M.id==='mgCatch') startCatch();
      else if(M.id==='mgDance') UI.mode='discos';
      else if(M.id==='mgSimon') startSimon();
      else if(M.id==='mgJump') startJump();
      else if(M.id==='mgTopo') startTopo();
      else if(M.id==='mgPesca') startPesca();
      else if(M.id==='mgMemo') startMemo();
      else if(M.id==='mgGlobo') startGlobo();
      if(UI.mode==='games') uiDeny(key, AP().sleeping ? 'ESTA DURMIENDO' : 'SIN PILAS');
      SFX.tap(); return;
    }
  }
  if(pl_inPanel(x, y)) return;
  UI.mode='play'; SFX.tap();
}
SCREEN_TAP.games = tapGames;
function tapExped(x, y){
  const R = PL_EX;
  if(x>=10 && x<150 && y>=R.y0 && y<R.y0+EXPEDS.length*R.step){
    const i = Math.floor((y-R.y0)/R.step);
    if(i>=0 && i<EXPEDS.length && (y-R.y0)-i*R.step < R.h){
      const key = 'ex'+i;
      uiPress(key);
      const why = pl_expedReason(AP());
      sendExpedition(i);
      if(UI.mode==='exped'){ uiDeny(key, why || 'NO PUEDE IR'); SFX.nope(); }
      return;
    }
  }
  if(pl_inPanel(x, y)) return;
  UI.mode='play'; SFX.tap();
}
SCREEN_TAP.exped = tapExped;
function tapQuests(x, y){
  const Q = PL_Q;
  for(let i=0;i<3;i++){
    const qx = Q.x + PL_QOFF[i], qy = Q.y0 + i*Q.step;
    if(x>=qx && x<qx+Q.w && y>=qy-2 && y<qy+Q.h+2){
      const q = QUESTS[G.daily.ids[i]], key = 'q'+i;
      uiPress(key);
      if(G.daily.claimed[q.id]){ SFX.tap(); return; }
      const prog = G.daily.prog[q.id]||0;
      if(prog < q.n){ uiDeny(key, 'FALTAN '+(q.n-prog)); SFX.nope(); return; }
      claimQuest(i);
      uiFlash(key);
      ringFx(qx+Q.w-28, qy+24, '#ffd94a', 22, 360);
      popText(qx+Q.w-28, qy+12, '+'+q.m+'✦', '#ffd94a', {big:true});
      return;
    }
  }
  if(x>=Q.x && x<Q.x+Q.w && y>=Q.wy-2 && y<Q.wy+Q.wh+2){
    uiPress('qw');
    const W = weeklyDef();
    if(G.weekly.claimed){ SFX.tap(); return; }
    if(G.weekly.prog < W.n){ uiDeny('qw', 'FALTAN '+(W.n-G.weekly.prog)); SFX.nope(); return; }
    claimWeekly();
    if(G.weekly.claimed){
      UI.plWeeklyAt = performance.now(); uiFlash('qw');
      confetti(80, Q.wy+18, 26); flyCoins(120, Q.wy+18, 10); ringFx(Q.x+Q.w-28, Q.wy+28, '#ffd94a', 26, 400);
      popText(Q.x+Q.w-28, Q.wy+14, '+'+W.m+'✦', '#ffd94a', {big:true});
    }
    return;
  }
  if(pl_inPanel(x, y)) return;
  UI.mode='main'; SFX.tap();
}
SCREEN_TAP.quests = tapQuests;
function tapBuho(x, y){
  if(!G.buho){ UI.mode='main'; return; }
  const R = PL_BU;
  if(x>=12 && x<148 && y>=R.y0 && y<R.y0+G.buho.offers.length*R.step){
    const i = Math.floor((y-R.y0)/R.step);
    if(i>=0 && i<G.buho.offers.length && (y-R.y0)-i*R.step < R.h){
      const o = G.buho.offers[i], key = 'bu'+i;
      uiPress(key);
      if(o.sold){ SFX.tap(); return; }
      const full = o.kind==='item' && (G.items||[]).length>=3;
      const short = o.cost - G.motas;
      buyBuhoOffer(i);
      if(o.sold){
        const cy = R.y0 + i*R.step + 13;
        uiFlash(key); confetti(120, cy, 16); ringFx(24, cy, '#ffd94a', 18, 320);
      } else uiDeny(key, full ? 'MOCHILA LLENA' : 'FALTAN ✦'+fmt(short));
      return;
    }
  }
  if(pl_inPanel(x, y)) return;
  UI.mode='main'; SFX.tap();
}
SCREEN_TAP.buho = tapBuho;
function tapDiscos(x, y){
  const R = PL_DZ;
  if(x>=10 && x<150 && y>=R.y0 && y<R.y0+DISCOS.length*R.step){
    const i = Math.floor((y-R.y0)/R.step);
    if(i>=0 && i<DISCOS.length && (y-R.y0)-i*R.step < R.h){
      const D = DISCOS[i], key = 'dz'+i;
      /* el vinilo (izquierda) es la preescucha */
      if(x < 38){
        uiPress(key);
        const before = UI.previewUntil||0;
        previewDisco(i);
        if((UI.previewUntil||0) !== before) UI.plPrevI = i;
        return;
      }
      if(G.discos[D.id]){ uiPress(key+'b'); G.disco = D.id; startDance(i); saveGame(); return; }
      uiPress(key);
      const short = D.cost - G.motas;
      buyDisco(i);
      if(G.discos[D.id]){
        uiFlash(key); confetti(40, R.y0 + i*R.step + 13, 18);
        ringFx(25, R.y0 + i*R.step + 13, '#ffd94a', 20, 360);
      } else uiDeny(key, 'FALTAN ✦'+fmt(short));
      return;
    }
  }
  if(pl_inPanel(x, y)) return;
  UI.mode='games'; SFX.tap();
}
SCREEN_TAP.discos = tapDiscos;
