"use strict";
/* =========================================================
   BITXO — game/ui: estado de interfaz, toasts y sprite actual
   ========================================================= */
/* ---------------- UI ---------------- */
const UI = {
  mode:'boot', msg:null, msgUntil:0,
  flashBtn:-1, flashUntil:0,
  evoT:0, evoFrom:null, hatchT:0, ascT:0,
  pendingEvoNote:false, mini:null, bt:null,
  particles:[], floats:[], sparkles:[],
  sweepT:0, feedKind:null, shopFlash:{}, ascGain:0
};
function toast(s, ms=2000){ UI.msg=s; UI.msgUntil=performance.now()+ms; }
function vibrate(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }

/* cola de evoluciones: NINGUNA pasa sin verse — las de fuera de
   pantalla (offline, menús) se reproducen al volver al prado */
const EVO_QUEUE = [];
function queueEvolution(pet, fromKey, toKey){
  EVO_QUEUE.push({pet, fromKey, toKey});
}
function playNextEvo(){
  while(EVO_QUEUE.length){
    const q = EVO_QUEUE.shift();
    const i = G.pets.indexOf(q.pet);
    if(i<0) continue; /* ya no está (se fue o ascendió) */
    G.sel = i;
    UI.evo = {
      from: SPR[q.fromKey][0], to: SPR[q.toKey][0],
      fromName: nameOfKey(q.fromKey), toName: nameOfKey(q.toKey),
      dark: q.toKey==='grimo',
      swapAcc:0, lastSwap:-1, fx:[], rings:[], sfxBurst:false, sfxReveal:false
    };
    UI.evoT = 0; UI.mode = 'evolve';
    SFX.evolve(); vibrate([60,60,60,60,120]);
    return true;
  }
  return false;
}
function currentFormDef(){
  const p = AP();
  if(p.form==='grimo') return {spr:'grimo', name:'GRIMO'};
  const slot = p.form||'babyA';
  return {spr:p.line+'_'+slot, name:LINES[p.line].names[slot]};
}
function currentSprite(){
  const p = AP();
  if(p.stage===STAGES.EGG) return SPR['egg_'+p.line][0];
  const frames = SPR[currentFormDef().spr];
  if(p.sleeping) return frames[1];
  const blink = performance.now() < p.blinkAt+140;
  return frames[blink?1:0];
}
