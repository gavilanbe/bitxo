"use strict";
/* =========================================================
   BITXO — input: botonera y gestión de toques
   ========================================================= */
/* ---------------- ENTRADA ---------------- */
const BTNS = [
  {ic:'feed', label:'COMER', fn:()=>{ if(eggGuard()||awayGuard())return; seeSelected(); UI.mode='feed'; }},
  {ic:'play', label:'JUGAR', fn:()=>{ if(eggGuard()||awayGuard())return; seeSelected(); UI.mode='play'; }},
  {ic:'clean',label:'LIMPIAR', fn:()=>{ doClean(); }},
  {ic:'sleep',label:'LUZ', fn:()=>{ if(eggGuard()||awayGuard())return; seeSelected();
    const was = AP().sleeping; doSleepToggle();
    if(was && !AP().sleeping){ SFX.yay(); AP().squashAt = performance.now(); burst(AP().rx, 146, {n:8, cols:['#fff8d0','#ffd94a'], speed:0.06, g:0.0001, kind:'star'}); }
  }},
  {ic:'shop', label:'TIENDA', fn:()=>{ UI.mode='shop'; if(!G.hints.shop){G.hints.shop=true;} }},
  {ic:'stats',label:'DATOS', fn:()=>{ UI.mode='stats'; }}
];
function eggGuard(){ if(AP().stage===STAGES.EGG){ toast('AUN ES UN HUEVO'); return true; } return false; }
function awayGuard(){ if(AP().exped){ toast('ESTA DE EXPEDICION'); return true; } return false; }
/* al GYM no se entra dormido */
function gymOpenGuard(){
  if(eggGuard() || awayGuard()) return false;
  if(AP().sleeping){ toast('SHHH... DUERME'); SFX.nope(); return false; }
  return true;
}
const BTN_Y = 240, BTN_S = 22;

function canvasPos(ev){
  const r = cv.getBoundingClientRect();
  const t = ev.touches ? ev.touches[0] : ev;
  return { x:(t.clientX-r.left)/SCALE, y:(t.clientY-r.top)/SCALE };
}
cv.addEventListener('pointerdown', ev=>{
  ev.preventDefault();
  audio();
  const p = canvasPos(ev);
  tapRipple(p.x, p.y);
  if(UI_SCROLLABLE[UI.mode] || UI.mode==='ach'){
    /* paneles que se deslizan: el toque se decide al soltar */
    shopTouch = {x:p.x, y:p.y, mode:UI.mode, s: UI_SCROLLABLE[UI.mode] ? UI_SCROLLABLE[UI.mode].get() : (UI.achScroll||0), dragged:false};
    return;
  }
  handleTap(p.x, p.y);
  armCarry(p.x, p.y);
  if(UI.mode==='battle') btSwipe = {x:p.x, y:p.y, done:false};
  /* en el prado, arrastrar desplaza la cámara por el mundo ancho */
  if(UI.mode==='main' && !UI.decorEdit && p.y>24 && p.y<196) camDragStart(p.x);
  if(UI.decorEdit && typeof decorEditDown==='function') decorEditDown(toWorldX(p.x), p.y);
});
let shopTouch = null, btSwipe = null;
cv.addEventListener('pointermove', ev=>{
  if(btSwipe && UI.mode==='battle' && !btSwipe.done){
    const q = canvasPos(ev);
    if(Math.abs(q.x-btSwipe.x) + Math.abs(q.y-btSwipe.y) > 16){
      btSwipe.done = true;
      battleSwipe();
    }
    return;
  }
  if(UI.decorEdit && typeof decorEditMove==='function'){ const q3 = canvasPos(ev); decorEditMove(toWorldX(q3.x), q3.y); return; }
  if(CAM.drag){
    const q4 = canvasPos(ev);
    if(camDragMove(q4.x) && carryTimer){ clearTimeout(carryTimer); carryTimer = null; }
    return;
  }
  if(UI.mode.startsWith('mg') && typeof mgDrag==='function' && (ev.buttons||ev.pointerType==='touch')){
    const q2 = canvasPos(ev); mgDrag(q2.x, q2.y); return;
  }
  if(!shopTouch || UI.mode!==shopTouch.mode) return;
  const q = canvasPos(ev);
  const dy = q.y - shopTouch.y;
  if(Math.abs(dy)>4) shopTouch.dragged = true;
  if(shopTouch.dragged){
    const SC = UI_SCROLLABLE[shopTouch.mode];
    if(SC) SC.set(Math.max(0, Math.min(SC.max(), shopTouch.s - dy)));
    else UI.achScroll = Math.max(0, Math.min(achMaxScroll(), shopTouch.s - dy));
  }
});
/* pulsación larga sobre un bitxo: cogerlo en brazos */
let carryTimer = null;
function armCarry(x, y){
  if(carryTimer){ clearTimeout(carryTimer); carryTimer = null; }
  if(UI.mode!=='main' || UI.carry) return;
  if(y<105 || y>190) return;
  x = toWorldX(x);
  let best=-1, bd=27;
  for(let i=0;i<G.pets.length;i++){
    if((G.pets[i].zone||'prado')!==G.zone) continue;
    const d = Math.abs(x-G.pets[i].rx);
    if(d<bd){ bd=d; best=i; }
  }
  if(best<0) return;
  const p = G.pets[best];
  if(p.stage===STAGES.EGG || p.exped || p.sleeping) return;
  carryTimer = setTimeout(()=>{
    carryTimer = null;
    if(UI.mode==='main' && !UI.carry) startCarry(best);
  }, 480);
}
for(const evn of ['pointerup','pointercancel','pointerleave']){
  cv.addEventListener(evn, ev=>{
    if(carryTimer){ clearTimeout(carryTimer); carryTimer = null; }
    btSwipe = null;
    camDragEnd();
    if(UI.decorEdit && typeof decorEditUp==='function') decorEditUp();
    if(shopTouch){
      const t = shopTouch; shopTouch = null;
      if(evn==='pointerup' && !t.dragged) handleTap(t.x, t.y);
    }
  });
}
/* flechas y senderos de los bordes: true si el toque era navegación */
function zoneArrowTap(x, y){
  if(!(y>166 && y<198)) return false;
  if(x>=WORLD_W-16){
    if(G.zone==='prado'){
      if(G.zonesOpen.parque){ askTravel('parque'); return true; }
      if(Object.keys(G.toys).length>=1){ tapSendero(); return true; }
    } else if(G.zone==='huerta'){ askTravel('prado'); return true; }
    return false;
  }
  if(x<=14){
    if(G.zone==='prado'){
      if(G.zonesOpen.huerta){ askTravel('huerta'); return true; }
      if(huertaTeaser()){ tapSenderoHuerta(); return true; }
    } else if(G.zone==='parque'){ askTravel('prado'); return true; }
    return false;
  }
  return false;
}

function handleTap(x,y){
  const now = performance.now();
  if(UI.mode==='boot') return;
  /* informes: solo se leen (y se cierran) en el mundo; el primer toque
     rápido solo termina de contar las cifras */
  if((offlineReport || UI.expReport) && sceneFamily(UI.mode)==='world'){
    if(now-(UI.repT||0) < 700){ UI.repT = now-2000; return; }
    if(offlineReport) offlineReport=null; else UI.expReport=null;
    SFX.tap(); return;
  }
  if(UI.mode==='hatch'){ hatchTap(); return; }
  if(UI.mode==='evolve'){
    if(UI.evoT > 4900){ UI.mode='main'; UI.evo=null; }
    else if(UI.evoT < 3900) UI.evoT = 3900; /* saltar al estallido */
    return;
  }
  if(UI.mode==='ascendFX'){ if(UI.ascT>4200){ finishAscend(); } return; }
  if(UI.mode==='battle'){ battleTap(x, y); return; }
  /* la botonera sigue viva bajo los menús: un toque cambia de menú directamente */
  if(MENU_PARENT[UI.mode] && UI.panelMode===UI.mode && y>=BTN_Y-2 && y<BTN_Y+BTN_S+8 && (!UI.panelRect || UI.panelMode!==UI.mode || UI.panelRect.y+UI.panelRect.h <= BTN_Y-1)){
    const i = Math.floor((x-4)/26);
    if(i>=0 && i<6){
      UI.mode = 'main';
      UI.flashBtn=i; UI.flashUntil=now+150; UI.btnAt[i]=now;
      SFX.tap(); vibrate(15);
      BTNS[i].fn();
      return;
    }
  }
  /* insignia X: cierra cualquier panel hacia su pantalla madre */
  if(MENU_PARENT[UI.mode] && UI.closeAt &&
     Math.abs(x-UI.closeAt.x)<=8 && Math.abs(y-UI.closeAt.y)<=8){
    UI.closePressT = now;
    UI.mode = MENU_PARENT[UI.mode];
    SFX.tap(); vibrate(10);
    return;
  }
  if(UI.mode==='constel'){ constelTap(x,y); return; }
  /* cada pantalla trae sus propios toques (render/screens/*.js) */
  if(SCREEN_TAP[UI.mode]){ SCREEN_TAP[UI.mode](x, y); return; }
  if(UI.mode==='train'){ gymTap(x, y); return; }
  if(UI.mode.startsWith('mg')){ mgTap(x, y); return; }

  /* ---- modo principal ---- */
  if(UPDATE_READY && y>=22 && y<=36 && x>26 && x<134){ applyUpdate(); return; }
  if(x>142 && y<16){
    G.sound = G.sound===undefined ? 1 : (G.sound+2)%3; /* 2→1→0→2 */
    G.muted = G.sound===0;
    applyVolume();
    toast(['SILENCIO','VOLUMEN BAJO','VOLUMEN ALTO'][G.sound]);
    saveGame(); return;
  }

  if(y>BTN_Y-4 && y<BTN_Y+BTN_S+8){
    const i = Math.floor((x-4)/26);
    if(i>=0 && i<6){
      if(UI.carry) UI.carry = null; /* se baja solo donde estaba */
      UI.flashBtn=i; UI.flashUntil=now+150; UI.btnAt[i]=now;
      SFX.tap(); vibrate(15);
      BTNS[i].fn();
      return;
    }
  }
  /* retrato del HUD: la vista salta a donde vive el elegido */
  if(x<20 && y<19){
    seeSelected(); toast(petName(AP()), 1200); SFX.tap();
    return;
  }
  /* con el bitxo en brazos: las flechas navegan, el suelo lo suelta */
  if(UI.carry){
    if(zoneArrowTap(toWorldX(x), y)) return;
    if(y>100 && y<198){ dropCarry(toWorldX(x)); return; }
    UI.carry = null; /* toque al HUD: se baja donde estaba */
  }
  /* la constelación: tu dinastía */
  if(dayPhase()==='night' && G.ascensions>0 && !UI.shoot && y>18 && y<90){
    for(let i=0;i<Math.min(24,G.ascensions);i++){
      const sp = legacyStarPos(i);
      if(Math.abs(x-sp.x)<10 && Math.abs(y-sp.y)<10){ UI.mode='legacy'; SFX.tap(); return; }
    }
  }
  /* estrella fugaz */
  if(UI.shoot && Math.abs(x-UI.shoot.x)<15 && Math.abs(y-UI.shoot.y)<15){
    const g = Math.round(25*legacyMult()) * (G.relics.lagrima?2:1) * (G.starShower?2:1);
    gainMotas(g, toWorldX(UI.shoot.x), UI.shoot.y);
    withScreen(()=>{
      flyCoins(UI.shoot.x, UI.shoot.y, 10);
      burst(UI.shoot.x, UI.shoot.y, {n:22, cols:['#ffffff','#ffd94a','#fff8d0'], speed:0.12, g:0.00008, kind:'star', life:700});
      ringFx(UI.shoot.x, UI.shoot.y, '#fff8d0', 22, 420);
    });
    flash('#fff8d0', 0.35, 220); shake(0.25);
    toast('¡DESEO CONCEDIDO! +'+g+'✦', 2800);
    SFX.wish(); vibrate([20,20,40]);
    UI.shoot = null;
    return;
  }
  /* cinta de objetivo: pista (es HUD: coordenadas de pantalla) */
  if(y>=21 && y<=33 && x>=4 && x<=156 && !UPDATE_READY){ goalTap(); return; }
  /* flechitas del borde: a lo que pasa fuera de cuadro */
  if(camIndicatorTap(x, y)) return;
  /* desde aquí todo es MUNDO: la x de pantalla pasa a x del mundo ancho */
  x = toWorldX(x);
  /* modo EDITAR: los toques los gestiona decorEditDown; decoración viva y bichitos */
  if(UI.decorEdit) return;
  if(typeof decorTap==='function' && decorTap(x, y)) return;
  /* chispas */
  for(let i=UI.sparkles.length-1;i>=0;i--){
    const s = UI.sparkles[i];
    if((s.zone||'prado')!==G.zone) continue;
    if(Math.abs(x-s.x)<11 && Math.abs(y-s.y)<11){
      collectSparkle(i, false);
      return;
    }
  }
  /* toque preciso sobre un bitxo: gana a juguetes, carteles y senderos */
  if(y>132 && y<168){
    const pi = nearestPetAt(x, 9);
    if(pi>=0){ tapPet(pi, now); return; }
  }
  /* juguetes */
  if(G.toys && G.toys.pelota && toyZone('pelota')===G.zone && Math.abs(x-G.ballX)<10 && y>140 && y<170){
    G.ballVX = (x < G.ballX ? 1 : -1) * (0.09+Math.random()*0.05);
    G.ballHopAt = performance.now();
    dustFx(G.ballX, 161, 6); ringFx(G.ballX, 157, '#ffffff', 8, 220);
    SFX.ballKick(); vibrate(12);
    return;
  }
  if(G.toys && G.toys.caja && toyZone('caja')===G.zone && Math.abs(x-placeX('caja'))<10 && y>134 && y<166){
    if(Date.now() >= (G.cajaReadyAt||0)){ openCaja(); if(typeof toyUsed==='function') toyUsed('caja', AP()); }
    else {
      const mns = Math.ceil((G.cajaReadyAt-Date.now())/60000);
      toast('CAJA LISTA EN '+mns+'M');
    }
    return;
  }
  /* huerto: cosechar la fruta */
  if(G.toys && G.toys.huerto && toyZone('huerto')===G.zone && Math.abs(x-placeX('huerto'))<13 && y>134 && y<166 &&
     !G.pets.some(q=>q.stage>STAGES.EGG && Math.abs(x-q.rx)<9)){
    if(Date.now() >= (G.huertoReadyAt||0)){
      const p2 = AP();
      if(p2.stage===STAGES.EGG){ toast('EL HUEVO NO COME'); return; }
      p2.hunger = Math.min(100, p2.hunger+20);
      p2.happy = Math.min(100, p2.happy+4);
      p2.energy = Math.min(100, p2.energy+10);
      p2.eatT = 1600; p2.feedKind = 'fruta';
      gainXP(6);
      G.foodsTried.fruta = true;
      G.harvests = (G.harvests||0)+1;
      questProg('cosecha', 1);
      G.huertoReadyAt = Date.now() + huertoCycleMs();
      /* HUERTO NV3: una fruta de propina */
      if(typeof toyPow==='function' && toyPow('huerto','extra')){ p2.hunger = Math.min(100, p2.hunger+10); gainXP(3); }
      if(typeof toyUsed==='function') toyUsed('huerto', p2);
      toast('¡FRUTA DEL HUERTO!');
      SFX.eatFood('fruta'); vibrate(15); saveGame();
    } else {
      const mns = Math.ceil((G.huertoReadyAt-Date.now())/60000);
      toast('FRUTA EN '+(mns>=60? Math.ceil(mns/60)+'H' : mns+'M'));
    }
    return;
  }
  /* cartel de misiones */
  if(G.zone==='prado' && Math.abs(x-placeX('cartel'))<10 && y>135 && y<165){ UI.mode='quests'; SFX.tap(); vibrate(10); return; }
  /* senderos y flechas: moverse entre zonas */
  if(zoneArrowTap(x, y)) return;
  /* el muñeco de entreno del parque: GYM sin menús (y el ¡VS! del duelo) */
  if(G.zone==='parque' && x>42 && x<64 && y>104 && y<166){
    if(y<120){ startDuel(); return; }
    if(!gymOpenGuard()) return;
    UI.trainFrom = 'parque';
    UI.mode = 'train'; UI.park = {phase:'idle', px:80, t:0};
    SFX.tap(); vibrate(10); return;
  }
  /* el buhonero */
  if(G.buho && G.zone==='prado' && y>118 && y<175 && Math.abs(x-G.buho.x)<13){
    UI.mode='buho'; SFX.tap(); vibrate(10); return;
  }
  /* bicho salvaje */
  if(G.wild && (G.wild.zone||'prado')===G.zone && y>120 && y<175 && Math.abs(x-G.wild.x)<16){
    startBattle();
    return;
  }
  /* toque ancho: el bitxo más cercano */
  if(y>105 && y<190){
    const bi = nearestPetAt(x, 27);
    if(bi>=0) tapPet(bi, now);
  }
}


/* bitxo más cercano en la zona visible (o -1) */
function nearestPetAt(x, maxD){
  let best=-1, bd=maxD;
  for(let i=0;i<G.pets.length;i++){
    if((G.pets[i].zone||'prado')!==G.zone) continue;
    const d = Math.abs(x-G.pets[i].rx);
    if(d<bd){ bd=d; best=i; }
  }
  return best;
}
/* tocar a un bitxo: seleccionar / acariciar / calentar el huevo */
function tapPet(best, now){
  const p = G.pets[best];
  if(best!==G.sel){
    G.sel = best; petVoice(p); p.squashAt = now;
    ringFx(p.rx, 150, '#ffd94a', 12, 280);
    if(p.stage>STAGES.EGG) p.bubbleT = now;
    toast(currentNameOf(p), 1200);
  } else if(p.exped){
    const m = Math.ceil((p.exped.until-Date.now())/60000);
    toast('VUELVE EN '+(m>=60? Math.ceil(m/60)+'H' : m+'M'));
  } else if(p.stage===STAGES.EGG){
    p.tapsOnEgg++; p.hop=now; p.squashAt=now; SFX.tap(); vibrate(10);
    /* calor: cada toque suelta chispitas y el cascarón cruje más */
    burst(p.rx, 150, {n:4+Math.floor(p.tapsOnEgg/3), cols:['#fff8d0','#ffd94a', LINES[p.line].eggSpot], speed:0.06, g:0.00025, life:420});
    tone({f:300+p.tapsOnEgg*40, d:0.05, type:'p25', vol:0.03});
    if(p.tapsOnEgg%5===0){ shake(0.18); ringFx(p.rx, 152, '#fff8d0', 14, 300); }
  } else if(!p.sleeping){
    p.happy = Math.min(100, p.happy+2);
    spawnHearts(1); petVoice(p); p.petT = now; p.squashAt = now;
    heartsFx(p.rx, 140, 2);
    p.bubbleT = now; /* la burbuja te cuenta cómo está */
    questProg('mimos', 1);
  } else {
    /* dormido: se revuelve un poco y sigue a lo suyo */
    p.squashAt = now; p.bubbleT = now;
    fx({x:p.rx+6, y:138, vy:-0.02, vx:0.01, life:900, kind:'txt', s:'Z', col:'#eef4ff'});
    tone({f:220, slide:180, d:0.12, type:'triangle', vol:0.03});
  }
}

/* ---------------- TECLADO (escritorio) ---------------- */
document.addEventListener('keydown', ev=>{
  if(!G || UI.mode==='boot') return;
  const k = ev.key;
  /* un informe encima: cualquier tecla lo cierra, y nada más */
  if(offlineReport || UI.expReport){
    if(k==='Escape' || k==='Enter' || k===' '){ offlineReport = null; UI.expReport = null; SFX.tap(); }
    return;
  }
  /* bautizo con teclado de verdad */
  if(UI.mode==='rename'){
    const buf = UI.nickBuf||'';
    if(/^[a-zA-ZñÑ]$/.test(k) && buf.length<8){ UI.nickBuf = buf + normText(k); SFX.tap(); }
    else if(k==='Backspace'){ UI.nickBuf = buf.slice(0,-1); SFX.tap(); }
    else if(k==='Enter'){ handleTap(80, 176); }
    else if(k==='Escape'){ UI.mode='stats'; SFX.tap(); }
    ev.preventDefault();
    return;
  }
  if(k>='1' && k<='6' && UI.mode==='main'){
    audio();
    const i = +k-1;
    UI.flashBtn = i; UI.flashUntil = performance.now()+150; UI.btnAt[i] = performance.now();
    SFX.tap(); BTNS[i].fn();
  } else if(k==='m' || k==='M'){
    G.sound = G.sound===undefined ? 1 : (G.sound+2)%3;
    G.muted = G.sound===0; applyVolume();
    toast(['SILENCIO','VOLUMEN BAJO','VOLUMEN ALTO'][G.sound]); saveGame();
  } else if(UI.mode.startsWith('mg') && typeof mgKey==='function' && mgKey(k)){
    ev.preventDefault();
  } else if(UI.mode==='battle' && typeof battleKey==='function' && battleKey(k)){
    ev.preventDefault();
  } else if(UI.mode==='train' && typeof gymKey==='function' && gymKey(k)){
    ev.preventDefault();
  } else if((k==='ArrowRight' || k==='ArrowLeft') && UI.mode==='main'){
    const idx = ZONE_ORDER.indexOf(G.zone) + (k==='ArrowRight' ? 1 : -1);
    const z = ZONE_ORDER[idx];
    if(z && (z==='prado' || G.zonesOpen[z])){ audio(); askTravel(z); }
  } else if(UI.mode==='constel' && constelKey(k)){
    ev.preventDefault();
  } else if(k==='Escape' && MENU_PARENT[UI.mode]){
    UI.mode = MENU_PARENT[UI.mode];
    SFX.tap();
  }
});
