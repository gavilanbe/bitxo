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

function startEvolveFX(){
  UI.evoFrom = currentSprite();
  UI.mode='evolve'; UI.evoT=0;
  SFX.evolve(); vibrate([60,60,60,60,120]);
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
