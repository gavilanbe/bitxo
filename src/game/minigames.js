"use strict";
/* =========================================================
   BITXO — game/minigames: lógica de atrapa/baile/simón
   ========================================================= */
function mgGuard(need){
  const p = AP();
  if(p.sleeping){ toast('SHHH... DUERME'); return false; }
  if(p.energy<need){ toast('SIN ENERGIA'); SFX.nope(); return false; }
  return true;
}
function finishMg(title, score, motas, xp, won){
  const p = AP();
  if(won){ p.gamesWon++; p.happy=Math.min(100,p.happy+12); SFX.yay(); }
  else { p.happy=Math.min(100,p.happy+4); }
  p.energy = Math.max(0, p.energy-10);
  if(motas>0) gainMotas(motas);
  gainXP(Math.round(xp*(p.trait==='JUGUETON'?1.5:1)));
  const m = UI.mg;
  m.ph='end'; m.title=title; m.scoreF=score; m.rMotas=motas; m.rXp=xp; m.won=won;
  saveGame();
}
function startCatch(){
  if(!mgGuard(10)) return;
  UI.mg = {ph:'play', t:0, end:20000, items:[], score:0, combo:0, px:80, tx:80, next:600};
  UI.mode='mgCatch';
}
function startDance(){
  if(!mgGuard(10)) return;
  audio();
  const step = 280, start = performance.now()+1400;
  const pat = [1,0,1,0,1,1,0,1,1,0,1,1,0,1,0,1];
  const beats = [];
  for(let i=0;i<16;i++) if(pat[i]) beats.push({t:start+i*step, i, hit:0, sched:false});
  UI.mg = {ph:'play', beats, score:0, combo:0, judge:'', judgeT:0, end:start+16*step+450};
  UI.mode='mgDance';
}
const DANCE_TUNE = [12,0,9,0,7,9,0,12, 14,0,12,9, 0,7,4,7];
const FLOWERS = [
 {x:52,y:128,c:'#e2574c',f:262},{x:108,y:128,c:'#ffd94a',f:330},
 {x:52,y:178,c:'#6db1ff',f:392},{x:108,y:178,c:'#f78fb3',f:494}
];
function startSimon(){
  if(!mgGuard(8)) return;
  audio();
  UI.mg = {ph:'show', seq:[Math.floor(Math.random()*4)], showI:0, showT:performance.now()+700, idx:0, lit:-1, litT:0, round:1};
  UI.mode='mgSimon';
}
function simonFinish(){
  const sc = UI.mg.round-1;
  if(sc>=5) AP().discipline = Math.min(99, AP().discipline+1);
  finishMg('SIMON', sc, 5*sc, 7*sc, sc>=4);
}
