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
/* avisos en COLA: ninguno pisa al anterior; los repetidos se funden */
const TOASTQ = [];
function toast(s, ms=2000){
  const now = performance.now();
  s = String(s);
  /* un "no" siempre se nota: el panel abierto tiembla */
  if(/FALTAN|NO TIENE|SIN MOTAS|SIN ENERGIA|AL MAXIMO|LLENA|AUN NO|NO PUEDE|MUY PEQUE/.test(s)){
    UI.denyAt = now;
    /* los paneles rediseñados ya dicen el porqué en la fila: sin aviso doble */
    if(typeof MENU_DRAW!=='undefined' && MENU_DRAW[UI.mode] && ['shop','feed','play','games','discos','exped','tower','buho','quests'].includes(UI.mode)) return;
  }
  if(UI.msg===s && now<UI.msgUntil){ UI.msgUntil = Math.max(UI.msgUntil, now+Math.min(ms,1400)); return; }
  if(TOASTQ.some(q=>q.s===s)) return;
  if(UI.msg && now<UI.msgUntil){
    TOASTQ.push({s, ms});
    if(TOASTQ.length>3) TOASTQ.shift();
    /* el actual cede el paso pronto (pero se deja leer) */
    UI.msgUntil = Math.min(UI.msgUntil, Math.max(now+550, UI.msgAt+900));
    return;
  }
  showToast(s, ms);
}
function showToast(s, ms){ UI.msg=s; UI.msgUntil=performance.now()+ms; UI.msgAt=performance.now(); }
function toastTick(){
  if(TOASTQ.length && (!UI.msg || performance.now()>=UI.msgUntil+180)){
    const q = TOASTQ.shift(); showToast(q.s, q.ms);
  }
}
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
      toDesc: formDescOfKey(q.toKey),
      toSlot: q.toKey==='grimo' ? 'grimo' : q.toKey.slice(q.toKey.indexOf('_')+1),
      dark: q.toKey==='grimo',
      swapAcc:0, lastSwap:-1, fx:[], rings:[], sfxBurst:false, sfxReveal:false
    };
    UI.evoT = 0; UI.mode = 'evolve';
    diaryLog(UI.evo.fromName+' EVOLUCIONO EN '+UI.evo.toName);
    SFX.evolve(); vibrate([60,60,60,60,120]);
    return true;
  }
  return false;
}
/* descripción de una forma por su clave 'linea_slot' (o 'grimo') */
function formDescOfKey(key){
  if(key==='grimo') return (typeof FORM_DESC.grimo==='string') ? FORM_DESC.grimo : '';
  const i = key.indexOf('_'), ln = key.slice(0,i), sl = key.slice(i+1);
  return (FORM_DESC[ln] && FORM_DESC[ln][sl]) || '';
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
