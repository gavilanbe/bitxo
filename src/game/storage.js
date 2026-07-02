"use strict";
/* =========================================================
   BITXO — game/storage: guardado/carga en localStorage
   ========================================================= */
const SAVE_KEY = 'bitxo-save';
/* memFallback cubre navegación privada / localStorage bloqueado */
let memFallback = null;
async function saveGame(){
  if(!G) return;
  G.lastSeen = Date.now();
  const data = JSON.stringify(G);
  memFallback = data;
  try{ localStorage.setItem(SAVE_KEY, data); }catch(e){}
}
async function loadGame(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return memFallback ? JSON.parse(memFallback) : null;
}
