"use strict";
/* =========================================================
   BITXO — game/world: clima y fase del día
   ========================================================= */
/* --- clima --- */
let WEATHER = {kind:'clear', until:0};
function updateWeather(now){
  if(now < WEATHER.until) return;
  const prev = WEATHER.kind;
  const r = Math.random();
  let kind = 'clear';
  if(r<0.20) kind='rain'; else if(r<0.35) kind='wind'; else if(r<0.45) kind='fog';
  WEATHER = {kind, until: now + (5+Math.random()*7)*60*1000};
  if(kind!==prev){
    if(kind==='rain') toast('EMPIEZA A LLOVER...', 2400);
    else if(kind==='wind') toast('SE LEVANTA VIENTO...', 2400);
    else if(kind==='fog') toast('BAJA LA NIEBLA...', 2400);
    else if(prev!=='clear') toast('VUELVE LA CALMA', 2000);
  }
}
function weatherHappyMult(p){
  if(WEATHER.kind==='rain') return p.line==='marea'?0.9:1.2;
  return 1;
}
function traitWeatherMult(p){
  let m = 1;
  if(p.trait==='TIMIDO' && WEATHER.kind==='clear' && !G.wild) m*=1.1;
  if(WEATHER.kind==='rain' && p.line==='pradera') m*=1.1;
  if(WEATHER.kind==='fog' && p.line==='astro') m*=1.1;
  return m;
}

/* ---------------- DÍA / NOCHE ---------------- */
function dayPhase(){
  const h = new Date().getHours() + new Date().getMinutes()/60;
  if(h>=21 || h<6.5) return 'night';
  if(h<9) return 'dawn';
  if(h<18.5) return 'day';
  return 'dusk';
}
