"use strict";
/* =========================================================
   BITXO — game/gym: reglas del GYM (cuota, efecto y reps)
   ========================================================= */
/* afinidad de línea: cada una entrena mejor una stat */
const TRAIN_AFFINITY = {brasa:'str', petrea:'def', marea:'spd'};
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

/* ---------------- GYM: la rep se clava con el dedo ---------------- */
function gymRepTap(){
  const pk = UI.park;
  if(!pk || pk.phase!=='train' || (pk.repAnim||0)>0 || (pk.rep||0)>=3) return;
  const gauge = (Math.sin((pk.t||0)/300)+1)/2;
  const perfect = gauge > 0.72;
  pk.lastPerfect = perfect;
  if(perfect) pk.perfects = (pk.perfects||0)+1;
  pk.repAnim = 420;
  UI.floats.push({x:pk.px, y:116, s: perfect ? '¡CLAVADO!' : 'BIEN', col: perfect ? '#ffd94a' : '#f6efe0', life:520, vy:-0.04});
  if(perfect){ SFX.coin(); vibrate([10,20]); } else { SFX.tap(); vibrate(8); }
}

