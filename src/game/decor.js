"use strict";
/* =========================================================
   BITXO — game/decor: el sitio de cada cosa, el modo EDITAR, los
   NIVELES de los juguetes, la BELLEZA de cada zona y la decoración
   viva (molino, colmena, farola, banco, estatua, setas, banderines,
   frutal, casita, campanilla, macetas).
   Coordenadas: x del MUNDO (0..WORLD_W-1), suelo en y=161.
   Los efectos de juice (fx/burst/popText/flyCoins...) en el prado se
   anclan solos al MUNDO (juice.js fxSpace): se les pasa la x del mundo.
   ========================================================= */

/* ---------------- CATÁLOGO: decoración nueva ---------------- */
/* bel = puntos de BELLEZA; max = copias; w = ancho de su huella */
const DECOR2 = [
 {id:'maceta',     name:'MACETAS',       cost:80,  bel:2,  max:6, desc:'FLORES QUE SE MECEN',       fx:'+2 BELLEZA'},
 {id:'banderines', name:'BANDERINES',    cost:150, bel:3,  max:2, desc:'FIESTA EN LA ZONA',         fx:'ANIMO BAJA -10%', over:true},
 {id:'campanilla', name:'CAMPANA VIENTO',cost:200, bel:3,  max:1, desc:'TOCALA: +ANIMO',            fx:'SUENA CON EL VIENTO'},
 {id:'banco',      name:'BANCO',         cost:250, bel:4,  max:2, desc:'SE SIENTAN: +PILAS',        fx:'DESCANSO +PILAS'},
 {id:'farola',     name:'FAROLA',        cost:300, bel:5,  max:2, desc:'DE NOCHE +10% MOTAS',       fx:'POLILLAS CON MOTAS'},
 {id:'setas',      name:'CORRO DE SETAS',cost:350, bel:6,  max:1, desc:'CHISPAS DE NOCHE',   fx:'CHISPA CADA 70S'},
 {id:'molino',     name:'MOLINO',        cost:450, bel:8,  max:1, desc:'MUELE MOTAS AL VIENTO',   fx:'MOTAS CADA MINUTO'},
 {id:'frutal',     name:'ARBOL FRUTAL',  cost:500, bel:7,  max:1, desc:'FRUTA PARA TODOS',fx:'FRUTA CADA 90 MIN'},
 {id:'colmena',    name:'COLMENA',       cost:600, bel:6,  max:1, desc:'MIEL: +20% MOTAS',   fx:'MIEL CADA 3H'},
 {id:'casita',     name:'CASITA',        cost:700, bel:9,  max:1, desc:'AQUI DUERMEN MEJOR',        fx:'SUENO +35%'},
 {id:'estatua',    name:'ESTATUA',       cost:900, bel:10, max:1, desc:'TU DINASTIA EN PIEDRA',     fx:'+3 BELLEZA/ASCENSO', need:()=>(G.ascensions||0)>=1, needTxt:'ASCIENDE A UN BITXO'}
];
const DECOR2_BY_ID = {};
for(const D of DECOR2) DECOR2_BY_ID[D.id] = D;

/* huellas en el suelo: [izq, der, alto] respecto a x (incluye el hueco
   donde se pone el bitxo que lo usa) */
const ITEM_FP = {
  columpio:[-17,17,36], banera:[-13,13,12], tambor:[-11,16,14], fuente:[-11,20,22],
  huerto:[-14,14,18], caja:[-16,7,14], cometa:[-2,13,10], cartel:[-10,10,26],
  maceta:[-4,4,13], banderines:[-21,21,30], campanilla:[-5,5,31], banco:[-12,12,14],
  farola:[-4,4,36], setas:[-14,15,10], molino:[-12,12,46], frutal:[-13,13,36],
  colmena:[-7,7,21], casita:[-14,14,30], estatua:[-9,9,36]
};
/* se mueven solos: no se colocan (la x es su punto de partida) */
const ITEM_MOBILE = {pelota:true, robot:true};
/* atrezo fijo de cada zona que no se puede pisar [x0,x1] */
const ZONE_RESERVED = {
  prado: [],
  parque:[[0,16],[44,62],[66,90]],
  huerta:[[102,124],[134,156]]
};
/* farolillos del JARDIN 4 (atrezo fijo del prado, entre huecos por defecto) */
const PRADO_LANTERNS = [190, 276];
function zoneReserved(zone){
  const r = (ZONE_RESERVED[zone]||[]).slice();
  if(zone==='prado' && G && G.up && G.up.jardin>=4) for(const lx of PRADO_LANTERNS) r.push([lx-4, lx+6]);
  return r;
}
/* sitio por defecto: repartidos por los 320 px de cada zona */
const PLACE_DEF = {
  prado:  {fuente:22, banera:58, columpio:98, huerto:140, caja:178, tambor:216, cartel:252, cometa:292, robot:160, pelota:120},
  parque: {columpio:116, tambor:160, caja:208, pelota:250, cometa:294},
  huerta: {huerto:86, fuente:176, banera:236}
};
const PLACE_ZONES = ['prado','parque','huerta'];

/* pantalla ↔ mundo (la cámara la pone el lead en render/camera.js) */
function dCamX(){ return (typeof CAM!=='undefined' && CAM) ? CAM.x : 0; }
function dSX(wx){ return Math.round(wx); }   /* juice ya ancla al mundo */
function dWW(){ return typeof WORLD_W!=='undefined' ? WORLD_W : 320; }
function itemType(key){ return String(key).split('#')[0]; }
function isToyId(id){ return typeof TOYS!=='undefined' && TOYS.some(T=>T.id===id); }

/* ---------------- ESTADO GUARDADO ---------------- */
/* G.place  {prado:{key:x}, parque:{}, huerta:{}}  solo lo que se ha movido/comprado
   G.toyXP  {id: usos}
   G.deco2  {inst:{key:zone}, st:{key:{...}}, mielUntil, mielZone}
   G.visit  {day, gift:{zone,x}|null}                                      */
function ensureDecor(){
  if(!G) return;
  if(!G.place || typeof G.place!=='object') G.place = {};
  for(const z of PLACE_ZONES) if(!G.place[z]) G.place[z] = {};
  if(!G.toyXP) G.toyXP = {};
  if(!G.deco2 || typeof G.deco2!=='object') G.deco2 = {inst:{}, st:{}};
  G.deco2.inst = G.deco2.inst||{}; G.deco2.st = G.deco2.st||{};
  if(!G.visit) G.visit = {day:'', gift:null};
}
function decoCount(id){ ensureDecor(); let n=0; for(const k in G.deco2.inst) if(itemType(k)===id) n++; return n; }
function decoSt(key){ ensureDecor(); return G.deco2.st[key] || (G.deco2.st[key] = {}); }
function decoKeysIn(zone, id){
  ensureDecor();
  const r = [];
  for(const k in G.deco2.inst) if(G.deco2.inst[k]===zone && (!id || itemType(k)===id)) r.push(k);
  return r;
}

/* ---------------- ¿DÓNDE ESTÁ CADA COSA? ---------------- */
function zoneOfItem(key){
  const id = itemType(key);
  if(id==='cartel') return 'prado';
  if(isToyId(id)) return typeof toyZone==='function' ? toyZone(id) : 'prado';
  ensureDecor();
  return G.deco2.inst[key] || null;
}
/* x del mundo de una cosa en SU zona (o en la zona pedida) */
function placeX(key, zone){
  zone = zone || zoneOfItem(key) || 'prado';
  const P = G && G.place && G.place[zone];
  if(P && P[key]!==undefined) return P[key];
  const D = PLACE_DEF[zone];
  if(D && D[key]!==undefined) return D[key];
  const Dp = PLACE_DEF.prado[key];
  return Dp!==undefined ? Dp : Math.round(dWW()/2);
}
/* todo lo colocable que hay ahora en una zona */
function itemsInZone(zone){
  ensureDecor();
  const r = [];
  if(zone==='prado') r.push('cartel');
  if(G.toys) for(const id in G.toys) if(G.toys[id] && !ITEM_MOBILE[id] && ITEM_FP[id] && toyZone(id)===zone) r.push(id);
  for(const k of decoKeysIn(zone)) r.push(k);
  return r;
}
function itemSpan(key, x){ const f = ITEM_FP[itemType(key)] || [-6,6,12]; return [x+f[0], x+f[1]]; }
/* ¿cabe aquí? sin salirse, sin pisar a otro ni al atrezo */
function placeFits(zone, key, x, skip){
  const s = itemSpan(key, x);
  if(s[0] < 8 || s[1] > dWW()-8) return false;
  for(const r of zoneReserved(zone)) if(s[1] > r[0] && s[0] < r[1]) return false;
  const over = DECOR2_BY_ID[itemType(key)] && DECOR2_BY_ID[itemType(key)].over;
  if(over) return true;
  for(const o of itemsInZone(zone)){
    if(o===key || (skip && skip[o])) continue;
    const od = DECOR2_BY_ID[itemType(o)];
    if(od && od.over) continue;
    const q = itemSpan(o, placeX(o, zone));
    if(s[1] > q[0] && s[0] < q[1]) return false;
  }
  return true;
}
/* el hueco libre más cercano a "want" (paso de 2 px) o null */
function findFreeX(zone, key, want, skip){
  want = Math.round(want/2)*2;
  for(let d=0; d<dWW(); d+=2){
    if(placeFits(zone, key, want+d, skip)) return want+d;
    if(d && placeFits(zone, key, want-d, skip)) return want-d;
  }
  return null;
}
/* recoloca lo que se pise (p. ej. al abrirse una zona, los juguetes llegan
   a su sitio por defecto y puede haber decoración allí) */
function placeFix(zone){
  ensureDecor();
  const items = itemsInZone(zone);
  /* primero lo que ya estaba colocado a mano, luego por defecto */
  items.sort((a,b)=> (G.place[zone][b]!==undefined) - (G.place[zone][a]!==undefined));
  const done = {};
  let moved = 0;
  for(const k of items){
    const x = placeX(k, zone);
    const skip = {}; for(const o of items) if(!done[o] && o!==k) skip[o] = true;
    if(!placeFits(zone, k, x, skip)){
      const nx = findFreeX(zone, k, x, skip);
      if(nx!==null){ G.place[zone][k] = nx; moved++; }
    }
    done[k] = true;
  }
  return moved;
}
let _placeSig = '';
function placeSig(){
  let s = '';
  for(const z of PLACE_ZONES) s += z+':'+itemsInZone(z).join(',')+';';
  return s;
}

/* ---------------- NIVELES DE JUGUETE ---------------- */
/* usos para llegar a NV2 y NV3 */
const TOY_LV_AT = [0, 5, 20];
/* qué mejora cada nivel [NV1, NV2, NV3] (lo leen sim.js/actions.js) */
const TOY_LV_FX = {
  pelota:  {kick:[3,4,5]},                               /* ánimo por patada */
  caja:    {every:[45,38,30]},                           /* minutos entre premios */
  columpio:{dur:[6000,7500,9000], rate:[1,1.3,1.6]},     /* rato y ánimo/pilas por ms */
  banera:  {hyg:[1,1.4,1.8], happy:[0,4,8]},             /* higiene x, ánimo al salir */
  tambor:  {dur:[2640,3300,3960], others:[3,5,7]},       /* concierto y ánimo al público */
  huerto:  {cycle:[1,0.85,0.7], extra:[0,0,1]},          /* ciclo x, fruta extra */
  cometa:  {dur:[7000,9000,11000], rate:[1,1.3,1.6]},
  fuente:  {energy:[10,16,22], cd:[120000,90000,60000]}, /* pilas por trago y espera */
  robot:   {every:[1,0.75,0.5], speed:[1,1.25,1.5]}      /* barre más a menudo y más rápido */
};
const TOY_LV_TXT = {
  pelota:  ['PATADA +3 ANIMO','PATADA +4 ANIMO','PATADA +5 ANIMO'],
  caja:    ['PREMIO CADA 45 MIN','PREMIO CADA 38 MIN','PREMIO CADA 30 MIN'],
  columpio:['VUELO NORMAL','VUELO +25% Y +30%','VUELO +50% Y +60%'],
  banera:  ['BANO NORMAL','LIMPIA +40% +ANIMO','LIMPIA +80% ++ANIMO'],
  tambor:  ['PUBLICO +3 ANIMO','PUBLICO +5 Y MAS RATO','PUBLICO +7 Y MAS RATO'],
  huerto:  ['FRUTA CADA 2H','CRECE -15%','CRECE -30% +1 FRUTA'],
  cometa:  ['VUELO NORMAL','VUELO +30%','VUELO +60%'],
  fuente:  ['TRAGO +10 PILAS','TRAGO +16 PILAS','TRAGO +22 PILAS'],
  robot:   ['BARRE CADA 90S','BARRE +RAPIDO','BARRE EL DOBLE']
};
function toyLevel(id){
  const u = (G && G.toyXP && G.toyXP[id]) || 0;
  return u>=TOY_LV_AT[2] ? 3 : (u>=TOY_LV_AT[1] ? 2 : 1);
}
function toyPow(id, k){
  const a = TOY_LV_FX[id] && TOY_LV_FX[id][k];
  return a ? a[toyLevel(id)-1] : 1;
}
/* 0..1 hacia el siguiente nivel (1 en NV3) */
function toyLvProg(id){
  const u = (G.toyXP && G.toyXP[id]) || 0, L = toyLevel(id);
  if(L>=3) return 1;
  return (u - TOY_LV_AT[L-1]) / (TOY_LV_AT[L] - TOY_LV_AT[L-1]);
}
/* dónde está el juguete ahora (los que se mueven, donde estén) */
function toyWX(id){
  if(id==='pelota') return (G.ballX!==undefined ? G.ballX : placeX('pelota'));
  if(id==='robot') return (UI.robotX!==undefined ? UI.robotX : placeX('robot'));
  return placeX(id);
}
/* motas por uso: crece con el nivel y con tu producción (≈ 3-9 s de motas) */
function toyReward(id){
  const L = toyLevel(id);
  const r = typeof motaRate==='function' ? motaRate() : 0.3;
  return Math.max(1, Math.round(L * (1 + r*3)));
}
/* HOOK: el código de cada juguete lo llama al terminar un uso.
   Cuenta XP (máx. 1 uso por juguete cada 12 s), sube de nivel y suelta
   un premio visible desde el juguete. Devuelve las motas dadas. */
function toyUsed(id, p){
  if(!G || !id) return 0;
  ensureDecor();
  const now = performance.now();
  UI.toyUseAt = UI.toyUseAt || {};
  if(now - (UI.toyUseAt[id]||-1e9) < 12000) return 0;
  UI.toyUseAt[id] = now;
  const L0 = toyLevel(id);
  G.toyXP[id] = (G.toyXP[id]||0) + 1;
  const L1 = toyLevel(id);
  const wx = toyWX(id);
  const see = (zoneOfItem(id)===G.zone) && UI.mode==='main';
  const n = toyReward(id);
  gainMotas(n);
  if(see){
    const sx = dSX(wx);
    popText(sx, 134, '+'+n+'✦', '#ffd94a');
    flyCoins(sx, 146, Math.min(6, 1 + L1));
    burst(sx, 150, {n:4+L1*2, cols:['#ffd94a','#fff0a0'], speed:0.06, kind:'star', life:420, up:0.04});
  }
  /* a veces, algo más: corazón o XP */
  const r = Math.random();
  if(p && r < 0.14){
    p.happy = Math.min(100, (p.happy||0) + 6);
    if(see) heartsFx(dSX(p.rx), 140, 2);
  } else if(p && r < 0.22 && typeof gainXPFor==='function'){
    gainXPFor(p, 1 + L1);
    if(see) popText(dSX(p.rx), 128, '+XP', '#9adcf0');
  }
  if(L1 > L0){
    const T = TOYS.find(t=>t.id===id);
    toast('¡'+(T?T.name:id.toUpperCase())+' NV'+L1+'! '+TOY_LV_TXT[id][L1-1], 3000);
    if(see){
      const sx = dSX(wx);
      popText(sx, 120, 'NV'+L1+'!', '#ffd94a', {big:true});
      confetti(sx, 140, 22); ringFx(sx, 148, '#fff8d0', 18, 420);
      shake(0.18);
    }
    SFX.toyLv();
    UI.decoBounce = {key:id, at:now};
    bellezaDirty();
    if(typeof saveGame==='function') saveGame();
  }
  return n;
}

/* ---------------- BELLEZA ---------------- */
const BEL_TOY = {pelota:1, caja:2, columpio:4, banera:3, tambor:3, huerto:5, cometa:3, fuente:5, robot:2};
const BEL_BASE = {prado:2, parque:4, huerta:4};
const BEL_TIERS = [10, 25, 50, 90];
const BEL_TIER_FX = [
  {name:'SENCILLO',   mult:1,    bugs:0},
  {name:'BONITO',     mult:1.1,  bugs:2},
  {name:'PRECIOSO',   mult:1.2,  bugs:3, gold:0.2},
  {name:'ENCANTADOR', mult:1.3,  bugs:4, gold:0.25, visit:true},
  {name:'DE ENSUENO', mult:1.5,  bugs:5, gold:0.35, visit:true}
];
function decoBel(key){
  const id = itemType(key), D = DECOR2_BY_ID[id];
  if(!D) return 0;
  if(id==='estatua') return D.bel + 3*Math.min(10, G.ascensions||0);
  return D.bel;
}
let _belCache = {t:-1e9, v:{}};
function bellezaDirty(){ _belCache.t = -1e9; }
function bellezaCalc(zone){
  let b = BEL_BASE[zone]||0;
  if(G.toys) for(const id in G.toys){
    if(!G.toys[id] || toyZone(id)!==zone) continue;
    b += (BEL_TOY[id]||1) + (toyLevel(id)-1);
  }
  if(zone==='prado'){
    const d = G.decor||{};
    if(d.flores && d.flores!=='clasico') b += 2;
    if(d.owned) b += (d.owned.flores_pastel?1:0) + (d.owned.flores_fuego?1:0);
    if(d.valla) b += 3;
    if(d.camino) b += 3;
    if(d.cielo) b += 2;
    b += (G.up && G.up.jardin) || 0;
  }
  for(const k of decoKeysIn(zone)) b += decoBel(k);
  return b;
}
function belleza(zone){
  if(!G) return 0;
  zone = zone || G.zone || 'prado';
  const now = performance.now();
  if(now - _belCache.t > 1000){ _belCache = {t:now, v:{}}; }
  if(_belCache.v[zone]===undefined) _belCache.v[zone] = bellezaCalc(zone);
  return _belCache.v[zone];
}
function bellezaTier(zone){
  const b = belleza(zone);
  let t = 0; for(const th of BEL_TIERS) if(b >= th) t++;
  return t;
}
/* 0..1 hacia el siguiente escalón */
function bellezaProg(zone){
  const b = belleza(zone), t = bellezaTier(zone);
  if(t>=BEL_TIERS.length) return 1;
  const lo = t ? BEL_TIERS[t-1] : 0;
  return (b-lo)/(BEL_TIERS[t]-lo);
}
function bellezaNext(zone){ const t = bellezaTier(zone); return t>=BEL_TIERS.length ? null : BEL_TIERS[t]; }
function isNightish(){ const ph = dayPhase(); return ph==='night' || ph==='dusk'; }
/* HOOK economía (petRate): multiplicador de motas de los bitxos de esa zona */
function bellezaMotaMult(zone){
  if(!G) return 1;
  zone = zone || 'prado';
  let m = BEL_TIER_FX[bellezaTier(zone)].mult;
  ensureDecor();
  if(G.deco2.mielZone===zone && Date.now() < (G.deco2.mielUntil||0)) m += 0.2;
  if(isNightish()) m += 0.1*Math.min(2, decoKeysIn(zone,'farola').length);
  return m;
}
/* HOOK happyDecayRate: los banderines alegran la zona */
function decorHappyMult(zone){ return G ? 1 - 0.1*Math.min(2, decoKeysIn(zone||'prado','banderines').length) : 1; }
/* HOOK sleepRegen: con casita se duerme mejor */
function decorSleepMult(zone){ return G && decoKeysIn(zone||'prado','casita').length ? 1.35 : 1; }

/* ---------------- COMPRAR DECORACIÓN ---------------- */
/* ¿se puede comprar ahora? {ok, why} */
function decorCanBuy(id){
  const D = DECOR2_BY_ID[id];
  if(!D) return {ok:false, why:'?'};
  if(D.need && !D.need()) return {ok:false, why:D.needTxt||'BLOQUEADO', lock:true};
  if(decoCount(id) >= D.max) return {ok:false, why:'MAX', max:true};
  if(G.motas < D.cost) return {ok:false, why:'FALTAN '+(D.cost-Math.floor(G.motas))+'✦', poor:true};
  const want = dCamX() + LW/2;
  if(findFreeX(G.zone, id+'#probe', want)===null && findFreeX(G.zone, id, want)===null) return {ok:false, why:'NO CABE AQUI'};
  return {ok:true};
}
function decorBuy(id){
  const c = decorCanBuy(id);
  if(!c.ok){ toast(c.why==='MAX' ? 'YA TIENES LAS QUE CABEN' : c.why); SFX.nope(); return false; }
  const D = DECOR2_BY_ID[id];
  const n = decoCount(id);
  let key = id; if(n>0){ let i = 2; while(G.deco2.inst[id+'#'+i]) i++; key = id+'#'+i; }
  const x = findFreeX(G.zone, key, dCamX() + LW/2);
  if(x===null){ toast('NO CABE AQUI'); SFX.nope(); return false; }
  G.motas -= D.cost;
  G.deco2.inst[key] = G.zone;
  G.place[G.zone][key] = x;
  decoInit(key);
  bellezaDirty(); _placeSig = placeSig();
  UI.decoNew = {key, at:performance.now()};
  UI.decoBounce = {key, at:performance.now()+450, drop:true};
  toast('¡'+D.name+' EN '+ZONES[G.zone].name+'!', 2400);
  SFX.buy(); vibrate(25);
  if(typeof saveGame==='function') saveGame();
  return key;
}
/* estado inicial de cada cosa viva */
function decoInit(key){
  const st = decoSt(key), id = itemType(key), now = Date.now();
  if(id==='colmena') st.readyAt = now + 3*3600*1000;
  if(id==='frutal') st.readyAt = now + 90*60*1000;
  if(id==='molino') st.acc = 0;
}

/* ---------------- MODO EDITAR ---------------- */
const DECOR_EDIT_BTN = {x:118, y:181, w:38, h:13};
function decorEditStart(){
  ensureDecor();
  placeFix(G.zone);
  UI.decorEdit = {zone:G.zone, drag:null, sel:null, at:performance.now()};
  /* nadie juega mientras se mueven los muebles */
  for(const p of G.pets){ if(p.toyGo) p.toyGo = null; }
  if(UI.mode!=='main') UI.mode = 'main';
  toast('ARRASTRA LAS COSAS POR EL SUELO', 2600);
  SFX.decoLift();
}
function decorEditEnd(){
  if(!UI.decorEdit) return;
  const d = UI.decorEdit;
  if(d.drag) decorEditUp();
  UI.decorEdit = null;
  bellezaDirty();
  toast('¡'+ZONES[G.zone].name+' A TU GUSTO!', 1800);
  SFX.buy();
  if(typeof saveGame==='function') saveGame();
}
function decorHit(wx, y, zone){
  let best = null, bd = 1e9;
  for(const k of itemsInZone(zone)){
    const x = placeX(k, zone), f = ITEM_FP[itemType(k)];
    if(!f) continue;
    if(wx < x+f[0]-2 || wx > x+f[1]+2) continue;
    if(y < 161-f[2]-3 || y > 166) continue;
    const d = Math.abs(wx-x);
    if(d < bd){ bd = d; best = k; }
  }
  return best;
}
/* toque en modo editar: true si lo usa (si no, que arrastre la cámara) */
function decorEditDown(wx, y){
  const E = UI.decorEdit; if(!E) return false;
  const sx = wx - dCamX(), B = DECOR_EDIT_BTN;
  if(sx>=B.x && sx<B.x+B.w && y>=B.y && y<B.y+B.h){ UI.decoBtnAt = performance.now(); decorEditEnd(); return true; }
  if(UI.mode!=='main') return false;
  const k = decorHit(wx, y, E.zone);
  if(!k){
    E.sel = null;
    /* suelo vacío: se arrastra la cámara, como fuera del modo editar */
    if(y>24 && y<196 && typeof camDragStart==='function') camDragStart(sx);
    return false;
  }
  const x = placeX(k, E.zone);
  E.sel = k;
  E.drag = {key:k, off:wx - x, x0:x, valid:x, want:x, sx, at:performance.now()};
  SFX.decoLift(); vibrate(8);
  return true;
}
function decorEditMove(wx, y){
  const E = UI.decorEdit; if(!E) return false;
  if(!E.drag){
    if(typeof CAM!=='undefined' && CAM.drag && typeof camDragMove==='function') camDragMove(wx - dCamX());
    return false;
  }
  const d = E.drag;
  d.sx = wx - dCamX();
  decorDragTo(wx - d.off);
  return true;
}
function decorDragTo(want){
  const E = UI.decorEdit, d = E.drag;
  const f = ITEM_FP[itemType(d.key)] || [-6,6];
  want = Math.round(want/2)*2;
  want = Math.max(8 - f[0], Math.min(dWW()-8 - f[1], want));
  if(want!==d.want){
    /* tic de rejilla al pasar por cada casilla */
    if(Math.abs(want - d.want) >= 2 && performance.now() - (d.tickAt||0) > 45){ tone({f:1400+Math.random()*200, d:0.015, type:'p125', vol:0.012}); d.tickAt = performance.now(); }
    d.want = want;
  }
  d.ok = placeFits(E.zone, d.key, want);
  if(d.ok) d.valid = want;
  G.place[E.zone][d.key] = want;
}
function decorEditUp(){
  const E = UI.decorEdit; if(!E || !E.drag) return false;
  const d = E.drag, z = E.zone;
  const fin = placeFits(z, d.key, d.want) ? d.want : d.valid;
  G.place[z][d.key] = fin;
  const pn = performance.now();
  UI.decoBounce = {key:d.key, at:pn, drop:true};
  if(fin!==d.want){ UI.decoSnapBack = {key:d.key, from:d.want, to:fin, at:pn}; SFX.nope(); }
  const sx = dSX(fin), f = ITEM_FP[itemType(d.key)] || [-6,6];
  dustFx(sx + f[0] + 2, 161, 3); dustFx(sx + f[1] - 2, 161, 3); dustFx(sx, 161, 2);
  SFX.decoDrop(); shake(0.05); vibrate(12);
  E.drag = null;
  bellezaDirty();
  return true;
}
/* borde de pantalla mientras arrastras: la cámara se desliza sola */
function decorEditAuto(dt){
  const E = UI.decorEdit; if(!E || !E.drag || typeof CAM==='undefined') return;
  const d = E.drag;
  let v = 0;
  if(d.sx < 22) v = -(22-d.sx)*0.012;
  else if(d.sx > LW-22) v = (d.sx-(LW-22))*0.012;
  if(!v) return;
  const nx = Math.max(0, Math.min(dWW()-LW, CAM.x + v*dt));
  if(nx!==CAM.x){ CAM.x = nx; CAM.manualUntil = performance.now() + 5000; decorDragTo(nx + d.sx - d.off); }
}
/* envoltorio de dibujo: levanta lo que arrastras y rebota lo que sueltas */
function decorWrap(key, x, fn){
  const pn = performance.now();
  const E = UI.decorEdit;
  const lifted = E && E.drag && E.drag.key===key;
  const B = UI.decoBounce && UI.decoBounce.key===key ? UI.decoBounce : null;
  const sq = B ? springSquash(B.at, B.drop ? 0.28 : 0.2, pn) : [1,1];
  let lift = lifted ? 4 + Math.round(Math.sin(pn/120)) : 0;
  /* recién comprado: cae del cielo y rebota (el aterrizaje hace polvo) */
  const N = UI.decoNew && UI.decoNew.key===key ? pn - UI.decoNew.at : 1e9;
  if(N < 450){ const k = N/450; lift = Math.round((1-k*k)*90); }
  else if(N < 1e8 && !UI.decoNew.landed){
    UI.decoNew.landed = true;
    const f = ITEM_FP[itemType(key)] || [-6,6];
    dustFx(x+f[0]+2, 161, 5); dustFx(x+f[1]-2, 161, 5); ringFx(x, 158, '#fff8d0', 14, 300);
    shake(0.12); SFX.decoDrop();
  }
  if(!lift && sq[0]===1 && sq[1]===1){ fn(); return; }
  if(lift){ ctx.globalAlpha = 0.35; softShadow(x, 160, 18); ctx.globalAlpha = 1; }
  ctx.save();
  ctx.translate(x, 161 - lift); ctx.scale(sq[0], sq[1]); ctx.translate(-x, -161);
  fn();
  ctx.restore();
}
/* HOOK dibujo (dentro de la cámara): contornos, rejilla y cartel de LISTO */
function drawDecorEditOverlay(t){
  const E = UI.decorEdit; if(!E) return;
  /* cambiar de zona o abrir un menú cierra el modo editar (guardando) */
  if(E.zone!==G.zone || (typeof MENU_DRAW!=='undefined' && MENU_DRAW[UI.mode])){
    if(E.drag) decorEditUp();
    UI.decorEdit = null; bellezaDirty();
    if(typeof saveGame==='function') saveGame();
    return;
  }
  const dt = Math.min(50, t - (E.lastT||t)); E.lastT = t;
  decorEditAuto(dt);
  const ants = Math.floor(t/90);
  for(const k of itemsInZone(G.zone)){
    const x = placeX(k), f = ITEM_FP[itemType(k)]; if(!f) continue;
    const drag = E.drag && E.drag.key===k;
    const col = drag ? (E.drag.ok===false ? '#e2574c' : '#ffd94a') : (E.sel===k ? '#fff0a0' : 'rgba(255,255,255,0.7)');
    const lift = drag ? 4 : 0;
    const x0 = x+f[0], x1 = x+f[1], y0 = 161-f[2]-1-lift, y1 = 162-lift;
    /* hormigas en marcha alrededor de la huella */
    for(let xx=x0; xx<=x1; xx++){ if(((xx+ants)&3)<2){ px(xx, y0, 1, 1, col); px(xx, y1, 1, 1, col); } }
    for(let yy=y0; yy<=y1; yy++){ if(((yy+ants)&3)<2){ px(x0, yy, 1, 1, col); px(x1, yy, 1, 1, col); } }
    /* esquinas marcadas */
    for(const [cx, cy] of [[x0,y0],[x1-1,y0],[x0,y1-1],[x1-1,y1-1]]) px(cx, cy, 2, 2, col);
    /* flechitas ◄ ► sobre lo que tocas */
    if(drag || E.sel===k){
      const b = Math.round(Math.sin(t/140));
      const ay = y0 - 6;
      px(x-7-b, ay+1, 1, 1, col); px(x-6-b, ay, 1, 3, col); px(x-5-b, ay-1, 1, 5, col);
      px(x+5+b, ay-1, 1, 5, col); px(x+6+b, ay, 1, 3, col); px(x+7+b, ay+1, 1, 1, col);
      const bel = isToyId(itemType(k)) ? (BEL_TOY[itemType(k)]||1) + toyLevel(itemType(k)) - 1 : (itemType(k)==='cartel' ? 0 : decoBel(k));
      if(bel) drawTextOC('+'+bel+'♥', x, ay-8, '#f2a2b8');
    }
    /* en el suelo, dónde caerá */
    if(drag){
      const v = E.drag.ok===false ? E.drag.valid : E.drag.want;
      ctx.globalAlpha = 0.5;
      px(v+f[0], 162, f[1]-f[0], 1, E.drag.ok===false ? '#e2574c' : '#fff8d0');
      ctx.globalAlpha = 1;
    }
  }
  /* rejilla en el suelo, muy tenue */
  ctx.globalAlpha = 0.18;
  const c0 = Math.floor(dCamX()/8)*8;
  for(let xx=c0; xx<c0+LW+8; xx+=8) px(xx, 163, 1, 2, '#fff8d0');
  ctx.globalAlpha = 1;
  /* ---- en pantalla: banda de título, belleza y botón LISTO ---- */
  ctx.save(); ctx.translate(Math.round(dCamX()), 0);
  const B = DECOR_EDIT_BTN;
  px(4, B.y, 112, B.h, 'rgba(20,24,56,0.82)'); px(4, B.y, 112, 1, 'rgba(255,255,255,0.18)');
  drawText('EDITAR', 8, B.y+4, '#ffd94a');
  const z = G.zone, bt = bellezaTier(z), bv = belleza(z);
  drawText(bv+'♥', 36, B.y+4, '#f2a2b8');
  /* barrita hacia el siguiente escalón */
  const bw = 34, bx = 58, pr = bellezaProg(z);
  px(bx, B.y+5, bw, 3, '#0e0c20'); px(bx, B.y+5, Math.round(bw*pr), 3, '#f2a2b8'); px(bx, B.y+5, Math.round(bw*pr), 1, '#ffd0dc');
  for(let i=0;i<4;i++) px(96+i*5, B.y+4, 4, 4, i<bt ? '#ffd94a' : '#3a3458');
  const pr2 = uiPressedSafe('decoBtn');
  px(B.x, B.y+pr2, B.w, B.h, '#7ac74f'); px(B.x, B.y+pr2, B.w, 1, '#b4ec84'); px(B.x, B.y+B.h-1+pr2, B.w, 1, '#3f7f3a');
  drawTextC('LISTO', B.x+B.w/2, B.y+4+pr2, '#10301a');
  if(!E.drag && Math.floor(t/600)%3!==2) drawTextOC('ARRASTRA PARA MOVER', 80, 40, '#fff8d0');
  ctx.restore();
}
function uiPressedSafe(){ return performance.now() - (UI.decoBtnAt||-1e9) < 130 ? 1 : 0; }

/* ---------------- BICHITOS DE LA BELLEZA ---------------- */
/* mariposas (de día), luciérnagas (de noche), polillas junto a la farola
   y una MARIPOSA DORADA rara: tócalos y sueltan motas */
function bugCount(){
  const z = G.zone;
  let n = BEL_TIER_FX[bellezaTier(z)].bugs;
  if(isNightish()) n += 2*Math.min(2, decoKeysIn(z,'farola').length);
  return n;
}
function bugSpawn(kind, fromEdge){
  const cx = dCamX();
  const b = {kind, zone:G.zone, a:Math.random()*7, born:performance.now(),
    x: fromEdge ? (Math.random()<0.5 ? cx-8 : cx+LW+8) : cx + 12 + Math.random()*(LW-24),
    y: 118 + Math.random()*40, vx:0, vy:0, hx:0, hy:0};
  if(kind==='moth'){
    const fl = decoKeysIn(G.zone,'farola');
    b.home = fl.length ? fl[Math.floor(Math.random()*fl.length)] : null;
  }
  b.hx = b.x; b.hy = b.y;
  return b;
}
function bugsStep(dt, pn){
  const L = UI.bugs = (UI.bugs||[]).filter(b=>b.zone===G.zone);
  const night = isNightish();
  const want = bugCount();
  const nMoth = night ? 2*Math.min(2, decoKeysIn(G.zone,'farola').length) : 0;
  const plain = L.filter(b=>b.kind!=='gold');
  UI.bugNext = UI.bugNext||0;
  if(plain.length < want && pn > UI.bugNext){
    const moths = plain.filter(b=>b.kind==='moth').length;
    L.push(bugSpawn(moths < nMoth ? 'moth' : (night ? 'fly' : 'bfly'), L.length>0));
    UI.bugNext = pn + (L.length>=want ? 40000 + Math.random()*20000 : 1500);
  }
  while(plain.length > want){ const b = plain.pop(); L.splice(L.indexOf(b),1); }
  /* la dorada: rara, se va si no la pillas */
  const T = BEL_TIER_FX[bellezaTier(G.zone)];
  UI.goldRoll = UI.goldRoll||pn+20000;
  if(pn > UI.goldRoll){
    UI.goldRoll = pn + 90000;
    if(T.gold && !night && !L.some(b=>b.kind==='gold') && Math.random() < T.gold){
      L.push(bugSpawn('gold', true));
      tone({f:1568, d:0.08, type:'p125', vol:0.02, send:0.5}); tone({f:2093, at:sfxAt(0.08), d:0.2, type:'p125', vol:0.02, send:0.5});
    }
  }
  for(let i=L.length-1;i>=0;i--){
    const b = L[i];
    if(b.fled){ b.x += b.vx*dt; b.y += b.vy*dt; b.vy -= 0.00004*dt; if(pn - b.fled > 1400){ L.splice(i,1); } continue; }
    if(b.kind==='gold' && pn - b.born > 30000){ b.fled = pn; b.vx = (Math.random()<0.5?-1:1)*0.05; b.vy = -0.04; continue; }
    let hx = b.hx, hy = b.hy;
    if(b.kind==='moth' && b.home){ hx = placeX(b.home, G.zone); hy = 126; }
    const sp = b.kind==='gold' ? 1.6 : (b.kind==='moth' ? 1.3 : 1);
    const tt = pn/1000*sp + b.a;
    const rx = b.kind==='moth' ? 7 : 22, ry = b.kind==='moth' ? 5 : 9;
    b.x = hx + Math.sin(tt*0.9)*rx + Math.sin(tt*2.3)*2;
    b.y = hy + Math.cos(tt*1.3)*ry + Math.sin(tt*3.1);
    /* el ancla deriva despacio por el mundo */
    if(b.kind!=='moth'){ b.hx += Math.sin(tt*0.13)*0.004*dt; b.hx = Math.max(12, Math.min(dWW()-12, b.hx)); }
  }
}
function bugTap(wx, y){
  const L = UI.bugs||[];
  for(const b of L){
    if(b.fled || b.zone!==G.zone) continue;
    if(Math.abs(wx-b.x) > 7 || Math.abs(y-b.y) > 7) continue;
    const r = typeof motaRate==='function' ? motaRate() : 0.3;
    const gold = b.kind==='gold';
    const n = gold ? Math.max(25, Math.round(r*240)) : Math.max(1, Math.round(r*3));
    gainMotas(n);
    const sx = dSX(b.x);
    b.fled = performance.now(); b.vx = (Math.random()<0.5?-1:1)*0.06; b.vy = -0.05;
    popText(sx, b.y-6, '+'+n+'✦', '#ffd94a', gold ? {big:true} : undefined);
    flyCoins(sx, b.y, gold ? 8 : 2);
    const cols = gold ? ['#ffd94a','#fff0a0','#ffffff'] : (b.kind==='bfly' ? ['#f2a2b8','#9adcf0','#fff8d0'] : ['#fff0a0','#d8d0b8']);
    burst(sx, b.y, {n: gold ? 18 : 7, cols, speed: gold ? 0.1 : 0.06, kind:'star', life: gold ? 700 : 420});
    if(gold){ confetti(sx, b.y, 18); shake(0.15); ringFx(sx, b.y, '#fff0a0', 16, 380); toast('¡MARIPOSA DORADA! +'+n+'✦', 2400); }
    SFX.flutter(gold);
    UI.bugNext = Math.max(UI.bugNext||0, performance.now() + 20000);
    return true;
  }
  return false;
}

/* ---------------- EL VISITANTE (belleza 50+): un JUGLAR ---------------- */
function todayKey(){ const d = new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function visitorStep(dt, pn){
  ensureDecor();
  const V = UI.visitor;
  if(!V){
    if(UI.mode!=='main' || UI.decorEdit || G.visit.day===todayKey() || G.visit.gift) return;
    if(!BEL_TIER_FX[bellezaTier(G.zone)].visit) return;
    UI.zoneSince = UI.zoneSince && UI.zoneSinceZ===G.zone ? UI.zoneSince : (UI.zoneSinceZ = G.zone, pn);
    if(pn - UI.zoneSince < 15000 || Math.random() > dt*0.00005) return;
    const left = Math.random()<0.5;
    const cx = dCamX();
    const tx = Math.round(Math.max(20, Math.min(dWW()-20, cx + 60 + Math.random()*40)));
    UI.visitor = {zone:G.zone, x: left ? cx-12 : cx+LW+12, tx, dir: left?1:-1, st:'in', at:pn, n:0};
    G.visit.day = todayKey();
    toast('¡UN JUGLAR VIENE DE VISITA!', 2600);
    if(typeof saveGame==='function') saveGame();
    return;
  }
  if(V.zone!==G.zone){
    /* te fuiste: deja el regalo igual */
    if(V.st!=='out' && !G.visit.gift) G.visit.gift = {zone:V.zone, x:V.tx};
    UI.visitor = null; return;
  }
  if(V.st==='in'){
    const d = V.tx - V.x;
    if(Math.abs(d) < 1){ V.st = 'play'; V.at = pn; V.next = pn; }
    else { V.x += Math.sign(d)*Math.min(Math.abs(d), dt*0.022); V.dir = Math.sign(d); }
  } else if(V.st==='play'){
    /* rasguea una copla del tema y todos bailan */
    if(pn >= V.next){
      const sc = [0,4,7,9,12,9,7,4,5,9,12,14,12,7,4,0];
      const s = sc[V.n % sc.length];
      tone({f:NOTE(392, s), d:0.16, type:'triangle', vol:0.04, send:0.35});
      if(V.n%4===0) tone({f:NOTE(196, s%12), d:0.3, type:'p25', vol:0.02});
      V.strumAt = pn; V.n++; V.next = pn + 300;
      if(typeof toyFx==='function' && V.n%2===0) toyFx({kind:'note', x:V.x + V.dir*5, y:142, vx:(Math.random()-0.5)*0.02, vy:-0.03, life:1100, col:['#ffd94a','#f2a2b8','#9adcf0'][V.n%3], wob:V.n});
      if(V.n%4===0) for(const p of G.pets) if((p.zone||'prado')===G.zone && p.stage>STAGES.EGG && !p.sleeping){ p.joyAt = pn; p.happy = Math.min(100, p.happy+1); }
    }
    if(pn - V.at > 16000){
      V.st = 'out';
      G.visit.gift = {zone:V.zone, x:V.tx};
      UI.giftDropAt = pn;
      const sx = dSX(V.tx);
      burst(sx, 150, {n:10, cols:['#ffd94a','#f2a2b8','#fff8d0'], speed:0.07, kind:'star', life:500, up:0.05});
      SFX.giftDrop();
      popText(sx, 124, '¡UN REGALO!', '#ffd94a');
      if(typeof saveGame==='function') saveGame();
    }
  } else {
    const ex = V.dir>0 ? dCamX()+LW+14 : dCamX()-14;
    V.dir = V.x < ex ? 1 : -1;
    V.x += V.dir*dt*0.03;
    if((V.dir>0 && V.x>=ex) || (V.dir<0 && V.x<=ex) || V.x<-20 || V.x>dWW()+20) UI.visitor = null;
  }
}
function visitorTap(wx, y){
  ensureDecor();
  const g = G.visit.gift;
  if(g && g.zone===G.zone && Math.abs(wx-g.x) < 8 && y > 145 && y < 166){
    const t = bellezaTier(G.zone);
    const r = typeof motaRate==='function' ? motaRate() : 0.3;
    const n = Math.max(60, Math.round(r * (t>=4 ? 900 : 600)));
    gainMotas(n);
    const p = AP();
    if(p && p.stage>STAGES.EGG && typeof gainXPFor==='function') gainXPFor(p, 10);
    G.visit.gift = null;
    const sx = dSX(g.x);
    popText(sx, 130, '+'+n+'✦', '#ffd94a', {big:true});
    flyCoins(sx, 150, 10); confetti(sx, 148, 30); ringFx(sx, 152, '#fff8d0', 20, 420);
    flash('#fff8d0', 0.25, 120); shake(0.2); hitstop(60);
    SFX.buy(); vibrate([20,30,40]);
    toast('REGALO DEL JUGLAR: +'+n+'✦ +10 XP', 2800);
    if(typeof saveGame==='function') saveGame();
    return true;
  }
  const V = UI.visitor;
  if(V && Math.abs(wx-V.x) < 8 && y > 140 && y < 164){
    V.hiAt = performance.now();
    heartsFx(dSX(V.x), 138, 3);
    tone({f:880, slide:1320, d:0.1, type:'p25', vol:0.035});
    return true;
  }
  return false;
}

/* ---------------- DECORACIÓN VIVA: producción y toques ---------------- */
function decoTap(wx, y){
  /* un bitxo delante gana al mueble */
  if(y>132 && typeof nearestPetAt==='function' && nearestPetAt(wx, 9)>=0) return false;
  const k = decorHit(wx, y, G.zone);
  if(!k || isToyId(itemType(k)) || itemType(k)==='cartel') return false;
  const id = itemType(k), st = decoSt(k), x = placeX(k), sx = dSX(x), pn = performance.now(), now = Date.now();
  UI.decoBounce = {key:k, at:pn};
  const petsHere = G.pets.filter(p=>(p.zone||'prado')===G.zone && p.stage>STAGES.EGG && !p.exped);
  switch(id){
    case 'colmena':
      if(now >= (st.readyAt||0)){
        st.readyAt = now + 3*3600*1000;
        G.deco2.mielUntil = now + 30*60*1000; G.deco2.mielZone = G.zone;
        for(const p of petsHere){ p.hunger = Math.min(100, p.hunger+15); p.happy = Math.min(100, p.happy+15); p.joyAt = pn; }
        popText(sx, 124, '¡MIEL!', '#ffd94a', {big:true});
        burst(sx, 146, {n:14, cols:['#ffd94a','#f0a04b','#fff0a0'], speed:0.08, g:0.0003, life:600, up:0.05});
        ringFx(sx, 148, '#ffd94a', 14, 360); shake(0.1);
        SFX.honey();
        toast('MIEL: +20% MOTAS AQUI 30 MIN', 2600);
        bellezaDirty();
        if(typeof saveGame==='function') saveGame();
      } else {
        UI.beeAngryAt = pn;
        const m = Math.ceil(((st.readyAt||0)-now)/60000);
        popText(sx, 132, m>=60 ? Math.ceil(m/60)+'H' : m+'M', '#f6efe0');
        nz(sfxAt(0), 0.25, 0.02, 300, 3, 420);
      }
      return true;
    case 'frutal':
      UI.treeShakeAt = UI.treeShakeAt||{}; UI.treeShakeAt[k] = pn;
      for(let i=0;i<3;i++) if(typeof toyFx==='function') toyFx({kind:'leaf', x:x-8+Math.random()*16, y:132+Math.random()*8, vx:(Math.random()-0.5)*0.03, vy:0.012, life:1400, col:['#7ac74f','#b4ec84','#4f9a42'][i], wob:i*2});
      nz(sfxAt(0), 0.2, 0.03, 2400, 0.6, 900);
      if(now >= (st.readyAt||0)){
        st.readyAt = now + 90*60*1000;
        UI.fruitDrop = {key:k, at:pn, x};
        for(const p of petsHere){ p.hunger = Math.min(100, p.hunger+12); p.happy = Math.min(100, p.happy+6); p.joyAt = pn + 500; }
        const n = Math.max(3, Math.round((typeof motaRate==='function' ? motaRate() : 0.3)*20));
        gainMotas(n);
        popText(sx, 120, '+FRUTA', '#e2574c', {big:true});
        popText(sx, 136, '+'+n+'✦', '#ffd94a', {delay:200});
        flyCoins(sx, 140, 4);
        SFX.fruitFall(); shake(0.08);
        if(typeof saveGame==='function') saveGame();
      }
      return true;
    case 'campanilla': {
      UI.chimeAt = UI.chimeAt||{}; UI.chimeAt[k] = pn;
      SFX.chime(5);
      if(pn > (st.cdAt||0)){
        st.cdAt = pn + 20000;
        for(const p of petsHere){ if(!p.sleeping){ p.happy = Math.min(100, p.happy+3); p.joyAt = pn + 200; } }
        if(petsHere.length) heartsFx(sx, 132, 2);
      }
      return true;
    }
    case 'estatua': {
      const L = G.legacy && G.legacy.length ? G.legacy[G.legacy.length-1] : null;
      popText(sx, 118, L ? L.name : '¿?', '#e8e8f4');
      if(L) popText(sx, 128, 'GEN '+L.gen+' · NV'+L.lv, '#c2c2d4', {delay:150});
      burst(sx, 130, {n:6, cols:['#eeeef8','#fff8d0'], speed:0.05, kind:'star', life:500});
      tone({f:523, d:0.3, type:'triangle', vol:0.035, send:0.5}); tone({f:784, at:sfxAt(0.12), d:0.4, type:'triangle', vol:0.03, send:0.5});
      return true;
    }
    case 'molino':
      st.spinAt = pn;
      nz(sfxAt(0), 0.4, 0.025, 900, 0.5, 2400);
      return true;
    case 'casita':
      UI.doorAt = pn;
      tone({f:660, d:0.06, type:'p25', vol:0.03}); tone({f:520, at:sfxAt(0.08), d:0.08, type:'p25', vol:0.03});
      return true;
    default:
      tone({f:700+Math.random()*300, slide:1100, d:0.06, type:'p25', vol:0.03});
      return true;
  }
}
/* producción en vivo (el reloj corre aunque mires otra zona) */
function decoProduce(dt, pn){
  const wind = WEATHER.kind==='wind';
  const night = isNightish();
  for(const k in G.deco2.inst){
    const id = itemType(k), z = G.deco2.inst[k], st = decoSt(k);
    const see = z===G.zone && UI.mode==='main';
    if(id==='molino'){
      st.acc = (st.acc||0) + dt*(wind ? 3 : 1);
      if(st.acc >= 60000){
        st.acc -= 60000;
        const n = Math.max(1, Math.round((typeof motaRate==='function' ? motaRate() : 0.3)*5));
        gainMotas(n);
        if(see){
          const x = placeX(k, z), sx = dSX(x);
          if(sx > -10 && sx < LW+10){
            popText(sx, 108, '+'+n+'✦', '#ffd94a'); flyCoins(sx, 118, 2);
            burst(sx, 118, {n:6, cols:['#ffd94a','#fff0a0'], speed:0.05, kind:'star', life:400});
            tone({f:1175, d:0.05, type:'p125', vol:0.02}); tone({f:1568, at:sfxAt(0.05), d:0.12, type:'p125', vol:0.02});
          }
        }
      }
    } else if(id==='setas'){
      if(!night || !see){ continue; }
      st.acc = (st.acc||0) + dt;
      if(st.acc >= 70000 && UI.sparkles && UI.sparkles.length < 6){
        st.acc = 0;
        const x = placeX(k, z);
        UI.sparkles.push({x, y:150, born:Date.now(), t:Math.random()*7, zone:z});
        UI.ringPopAt = pn;
      }
    } else if(id==='campanilla'){
      if(wind && see && pn > (UI.chimeAuto||0)){
        UI.chimeAuto = pn + 2500 + Math.random()*4000;
        UI.chimeAt = UI.chimeAt||{}; UI.chimeAt[k] = pn;
        SFX.chime(2, 0.5);
      }
    }
  }
}
/* HOOK: llamar desde liveUpdate(dtMs) */
function decorUpdate(dtMs){
  if(!G) return;
  ensureDecor();
  const pn = performance.now();
  const sig = placeSig();
  if(sig!==_placeSig){ for(const z of PLACE_ZONES) placeFix(z); _placeSig = sig; bellezaDirty(); }
  decoProduce(dtMs, pn);
  if(sceneFamily(UI.mode)!=='world') return;
  bugsStep(dtMs, pn);
  visitorStep(dtMs, pn);
}
/* HOOK: toque en el mundo (x del mundo). true si lo gestiona */
function decorTap(wx, y){
  if(!G || UI.decorEdit) return false;
  if(visitorTap(wx, y)) return true;
  if(bugTap(wx, y)) return true;
  if(decoTap(wx, y)) return true;
  return false;
}

/* ---------------- BANCO: los bitxos se sientan ---------------- */
/* opciones para toyPick: add('@'+key, peso) */
function decorPickOpts(p, now, add){
  for(const k of decoKeysIn(G.zone,'banco')){
    if(G.pets.some(q=>q!==p && ((q.decoUse && q.decoUse.key===k) || (q.toyGo && q.toyGo.id==='@'+k)))) continue;
    if(now < (p.benchCd||0)) continue;
    add('@'+k, p.energy < 55 ? 3 : 0.8);
  }
}
function decorSpot(key, p){ return placeX(key); }
function decorUseStart(p, key, now){
  const id = itemType(key);
  if(id==='banco'){
    p.decoUse = {key, t:6500, dur:6500};
    p.benchCd = now + 60000;
    p.dir = Math.random()<0.5 ? -1 : 1;
    p.thought = {icon:'love', until: performance.now()+1200};
    tone({f:330, slide:262, d:0.12, type:'triangle', vol:0.03});
  }
}
/* devuelve true mientras siga ocupado */
function decorUseTick(p, dtMs, now){
  const u = p.decoUse; if(!u) return false;
  u.t -= dtMs;
  p.energy = Math.min(100, p.energy + dtMs*0.0016);
  p.happy = Math.min(100, p.happy + dtMs*0.0005);
  const pn = performance.now();
  if(every(1800, pn) && typeof toyFx==='function') toyFx({kind:'note', x:p.rx+3, y:140, vy:-0.02, life:900, col:'#9adcf0'});
  if(u.t<=0 || !G.deco2.inst[u.key] || G.deco2.inst[u.key]!==G.zone){
    p.decoUse = null;
    p.squashAt = pn;
    if(typeof toyLeave==='function') toyLeave(p, now, true);
    return false;
  }
  return true;
}
/* cuánto sube el bitxo sentado (para drawOnePet) */
function decorSeatDY(p){ return p.decoUse && itemType(p.decoUse.key)==='banco' ? -4 : 0; }

/* ---------------- DIBUJO DE TODO LO COLOCADO ---------------- */
/* HOOK (lo llama drawWorldScene dentro de la cámara) */
function drawDecorWorld(t){
  if(!G) return;
  ensureDecor();
  const z = G.zone, cx = dCamX();
  for(const k of decoKeysIn(z)){
    const x = placeX(k, z), f = ITEM_FP[itemType(k)] || [-20,20];
    if(x + f[1] + 30 < cx || x + f[0] - 30 > cx + LW) continue;
    decorWrap(k, x, ()=> drawDecorItem(itemType(k), x, t, z, k));
  }
  drawDecorLife(t);
}
function drawDecorLife(t){
  /* regalo del juglar */
  const g = G.visit && G.visit.gift;
  if(g && g.zone===G.zone){
    const pn = performance.now();
    const k = UI.giftDropAt ? Math.min(1, (pn-UI.giftDropAt)/500) : 1;
    const drop = Math.round((1-ease.outBack(k))*20);
    const hop = Math.floor(pn/1500)%2===0 && (pn%1500)<260 ? Math.round(Math.sin((pn%1500)/260*Math.PI)*2) : 0;
    softShadow(g.x, 160, 10);
    if(SPR.dc_regalo) ctx.drawImage(SPR.dc_regalo, Math.round(g.x)-5, 151-drop-hop);
    if(every(600, pn)) fx({x:dSX(g.x)-5+Math.random()*10, y:146, vy:-0.02, life:500, col:'#fff0a0', kind:'star'});
    drawTextOC('!', g.x, 138 - Math.round(Math.abs(Math.sin(t/200))*2), '#ffd94a');
  }
  if(UI.visitor && UI.visitor.zone===G.zone) drawJuglar(UI.visitor, t);
  for(const b of (UI.bugs||[])) if(b.zone===G.zone) drawBug(b, t);
}

/* ---------------- SFX propios ---------------- */
SFX.decoLift = function(){ tone({f:520, slide:780, d:0.07, type:'p25', vol:0.035}); nz(sfxAt(0), 0.04, 0.015, 3000, 1); };
SFX.decoDrop = function(){ kick(sfxAt(0), 0.07); nz(sfxAt(0), 0.08, 0.03, 900, 0.8, 300); tone({f:196, slide:130, d:0.08, type:'triangle', vol:0.04}); tone({f:988, at:sfxAt(0.07), d:0.05, type:'p125', vol:0.02}); };
SFX.toyLv = function(){ [523,659,784,1047,1319].forEach((f,i)=> tone({f, at:sfxAt(i*0.06), d:0.12, type:'p25', vol:0.045, send:i>2?0.35:0.1})); nz(sfxAt(0.3), 0.2, 0.02, 7000, 2); };
SFX.flutter = function(gold){
  nz(sfxAt(0), 0.1, 0.02, 4000, 3, 7000);
  tone({f:gold?1568:1175, slide:gold?2349:1568, d:0.08, type:'p125', vol:0.03});
  tone({f:gold?2093:1760, at:sfxAt(0.07), d:gold?0.35:0.14, type:'p125', vol:0.025, send:0.4});
};
SFX.chime = function(n, vol){
  const pent = [0,2,4,7,9,12,14];
  for(let i=0;i<(n||4);i++) tone({f:NOTE(1047, pent[Math.floor(Math.random()*pent.length)]), at:sfxAt(i*0.09+Math.random()*0.04), d:0.5, type:'triangle', vol:0.018*(vol||1), send:0.6});
};
SFX.honey = function(){ [392,494,587,784].forEach((f,i)=> tone({f, at:sfxAt(i*0.07), d:0.18, type:'triangle', vol:0.04, send:0.3})); nz(sfxAt(0), 0.3, 0.015, 280, 4, 360); };
SFX.fruitFall = function(){ [0,0.12,0.22].forEach((o,i)=>{ kick(sfxAt(0.25+o), 0.04); tone({f:300-i*30, slide:180, d:0.06, type:'triangle', vol:0.035, at:sfxAt(0.25+o)}); }); };
SFX.giftDrop = function(){ tone({f:784, d:0.08, type:'p25', vol:0.04}); tone({f:1047, at:sfxAt(0.08), d:0.08, type:'p25', vol:0.04}); tone({f:1568, at:sfxAt(0.16), d:0.3, type:'p25', vol:0.04, send:0.4}); kick(sfxAt(0.02), 0.05); };
