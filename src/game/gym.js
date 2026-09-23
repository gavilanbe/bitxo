"use strict";
/* =========================================================
   BITXO — game/gym: reglas del GYM (cuota, efecto y reps)
   ========================================================= */
/* afinidad de línea: cada una entrena mejor una stat */
const TRAIN_AFFINITY = {brasa:'str', petrea:'def', marea:'spd'};
/* estaciones del parque: x del aparato y a dónde camina el bitxo */
const GYM_KINDS = ['str','def','spd'];
const GYM_TX = {str:35, def:80, spd:128};
/* la cuota del parque sube con la stat: sumidero de motas de largo plazo */
function trainCost(p, kind){ return 5 + (p[kind]||0)*2; }
function trainEffect(kind){
  const p = AP();
  if(p.stage===STAGES.EGG){ toast('AUN ES UN HUEVO'); SFX.nope(); return null; }
  if(p.sleeping){ toast('SHHH... DUERME'); return null; }
  if(p.sick){ toast('ESTA MALITO: DALE MEDICINA'); SFX.nope(); return null; }
  if(p.energy<15){ toast('SIN ENERGIA'); SFX.nope(); return null; }
  const cost = trainCost(p, kind);
  if(G.motas < cost){ toast('FALTAN MOTAS ✦'); SFX.nope(); return null; }
  G.motas -= cost;
  p.energy = Math.max(0, p.energy-15);
  const gain = TRAIN_AFFINITY[p.line]===kind ? 2 : 1;
  p[kind] = Math.min(99, (p[kind]||0) + gain);
  p.weight = Math.max(5, p.weight-1);
  p.happy = Math.max(0, p.happy-3);
  gainXP(12);
  questProg('entrena', 1);
  weeklyProg('entrena', 1);
  SFX.train(); vibrate(30);
  saveGame();
  return {gain, kind, cost};
}

/* posición de la aguja (0..1): el test fija pk.t=471 → clavado */
function gymGauge(t){ return (Math.sin((t||0)/300)+1)/2; }
const GYM_PERFECT = 0.72, GYM_GOOD = 0.45;

/* ---------------- SFX propios del gym ---------------- */
SFX.gymPerfect = function(n){
  const f0 = [784, 988, 1175][Math.min(2, n||0)];
  kick(sfxAt(0), 0.07);
  tone({f:f0, d:0.07, type:'p25', vol:0.05});
  tone({f:f0*1.5, at:sfxAt(0.06), d:0.16, type:'p125', vol:0.04, send:0.35});
  nz(sfxAt(0), 0.05, 0.03, 7000, 3);
};
SFX.gymGood = function(){
  kick(sfxAt(0), 0.06);
  tone({f:523, d:0.07, type:'p25', vol:0.04});
};
SFX.gymMiss = function(){
  tone({f:330, slide:220, d:0.18, type:'triangle', vol:0.05});
  tone({f:262, slide:180, at:sfxAt(0.12), d:0.2, type:'triangle', vol:0.04});
};
SFX.gymTick = function(i){
  tone({f:660+i*140, d:0.06, type:'p25', vol:0.045});
  tone({f:1320+i*280, at:sfxAt(0.03), d:0.05, type:'p125', vol:0.02});
};

/* ---------------- GYM: la rep se clava con el dedo ---------------- */
function gymRepTap(){
  const pk = UI.park;
  if(!pk || pk.phase!=='train' || (pk.repAnim||0)>0 || (pk.rep||0)>=3) return;
  const gauge = gymGauge(pk.t);
  const perfect = gauge > GYM_PERFECT;
  const grade = perfect ? 'p' : (gauge > GYM_GOOD ? 'b' : 'f');
  pk.lastPerfect = perfect;
  pk.lastGrade = grade;
  pk.lastG = gauge;
  pk.reps = pk.reps || [];
  pk.reps[pk.rep||0] = grade;
  pk.repAnim = 420;
  pk.tapAt = performance.now();
  const hy = (typeof gymHeadY==='function') ? gymHeadY() : 140;
  const gx = (typeof GYM_GAUGE!=='undefined') ? GYM_GAUGE.x + Math.round(gauge*(GYM_GAUGE.w-3)) + 1 : 80;
  const gy = (typeof GYM_GAUGE!=='undefined') ? GYM_GAUGE.y + 5 : 219;
  if(perfect){
    const n = pk.perfects||0;
    pk.perfects = n+1;
    popText(pk.px, hy-8, '¡CLAVADO!', '#ffd94a', {big:true, life:760, vy:-0.02});
    hitstop(70); shake(0.22);
    flash('#fff8d0', 0.22, 90);
    burst(gx, gy, {n:14, cols:['#ffd94a','#fff8d0','#ffffff'], speed:0.11, g:0.0002, life:420, kind:'spark'});
    ringFx(gx, gy, '#ffd94a', 16, 320);
    burst(pk.px, hy+4, {n:10, cols:['#ffd94a','#fff8d0'], speed:0.08, g:0.00015, life:500, kind:'star'});
    SFX.gymPerfect(n); vibrate([10,20]);
  } else if(grade==='b'){
    popText(pk.px, hy-6, 'BIEN', '#f6efe0', {life:600});
    burst(gx, gy, {n:5, cols:['#f6efe0','#b8b8c4'], speed:0.05, g:0.0002, life:300});
    shake(0.06);
    SFX.gymGood(); vibrate(8);
  } else {
    popText(pk.px, hy-6, 'FLOJO...', '#9aa4c8', {life:700, vy:0.004});
    SFX.gymMiss(); vibrate(8);
  }
}

/* ---------------- GYM: empezar sesión / salir ---------------- */
function gymStart(kind){
  const pk = UI.park || (UI.park = {phase:'idle', px:80, t:0});
  if(pk.phase!=='idle') return false;
  const r = trainEffect(kind);
  pk.pressAt = pk.pressAt || {};
  pk.pressAt[kind] = performance.now();
  if(!r){ pk.denyAt = pk.denyAt || {}; pk.denyAt[kind] = performance.now(); return false; }
  pk.phase='walk'; pk.kind=kind; pk.tx=GYM_TX[kind]; pk.t=0; pk.gain=r.gain;
  pk.rep=0; pk.perfects=0; pk.repAnim=0; pk.reps=[]; pk.res=null; pk.lastGrade=null;
  popText(pk.px, 130, '-✦'+r.cost, '#ffd94a', {life:700});
  SFX.tap();
  return true;
}
function gymBack(){
  UI.mode = UI.trainFrom==='parque' ? 'main' : 'play';
  UI.trainFrom = null; UI.park = null; SFX.tap();
}

/* ---------------- GYM: toques ---------------- */
function gymTap(x, y){
  if(y<16 && x<48){ gymBack(); return; }
  const pk = UI.park || (UI.park = {phase:'idle', px:80, t:0});
  if(pk.phase==='train'){ gymRepTap(); return; }
  /* tocar mientras camina: llega ya (sin tiempos muertos) */
  if(pk.phase==='walk'){ pk.px = pk.tx; return; }
  let kind = null;
  /* aparatos del parque */
  if(y>=100 && y<=184){
    if(x>=14 && x<56) kind='str';
    else if(x>=60 && x<100) kind='def';
    else if(x>=102 && x<156) kind='spd';
  }
  /* tarjetas de la franja de abajo */
  if(y>=234 && y<272){
    if(x>=4 && x<52) kind='str';
    else if(x>=56 && x<104) kind='def';
    else if(x>=108 && x<156) kind='spd';
  }
  if(kind) gymStart(kind);
}

/* ---------------- GYM: teclado ---------------- */
function gymKey(k){
  if(UI.mode!=='train') return false;
  const pk = UI.park || (UI.park = {phase:'idle', px:80, t:0});
  if(k===' ' || k==='Enter'){
    if(pk.phase==='train') gymRepTap();
    else if(pk.phase==='walk') pk.px = pk.tx;
    return true;
  }
  if(k==='1' || k==='2' || k==='3'){ gymStart(GYM_KINDS[+k-1]); return true; }
  if(k==='Escape' || k==='Backspace'){ gymBack(); return true; }
  return false;
}
