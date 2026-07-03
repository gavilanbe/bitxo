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
  questProg('juegos', 1);
  const m = UI.mg;
  m.ph='end'; m.title=title; m.scoreF=score; m.rMotas=motas; m.rXp=xp; m.won=won;
  saveGame();
}
function startCatch(){
  if(!mgGuard(10)) return;
  UI.mg = {ph:'play', t:0, end:20000, items:[], score:0, combo:0, px:80, tx:80, next:600};
  UI.mode='mgCatch';
}
function startDance(di){
  if(!mgGuard(10)) return;
  audio();
  const D = DISCOS[di===undefined ? 0 : di];
  const step = D.step, start = performance.now()+1400;
  const beats = [];
  for(let i=0;i<16;i++) if(D.pat[i]) beats.push({t:start+i*step, i, hit:0, sched:false});
  UI.mg = {ph:'play', beats, score:0, combo:0, judge:'', judgeT:0, end:start+16*step+450, disco:D};
  UI.mode='mgDance';
}
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
  if(sc>=5){ AP().def = Math.min(99, AP().def+1); toast('+1 DEF POR CONCENTRARSE', 2200); }
  finishMg('SIMON', sc, 5*sc, 7*sc, sc>=4);
}

/* --- SALTA: la comba — esquiva obstáculos, entrena VELOCIDAD --- */
function startJump(){
  if(!mgGuard(10)) return;
  UI.mg = {ph:'play', t:0, end:25000, obs:[], score:0, combo:0, y:0, vy:0, next:1100, inv:0};
  UI.mode='mgJump';
}
function jumpTap(){
  const m = UI.mg;
  if(m.ph==='play'){
    if(m.y===0){ m.vy = -0.165; SFX.boing(); vibrate(10); }
  } else if(m.ph==='end'){ UI.mode='main'; SFX.tap(); }
}
function jumpFinish(){
  const m = UI.mg;
  const fast = m.score>=12;
  if(fast){ AP().spd = Math.min(99, AP().spd+1); toast('+1 VEL POR ESE RITMO', 2200); }
  finishMg('SALTA', m.score, m.score*2, 8+Math.round(m.score/2), fast);
}
