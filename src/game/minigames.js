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
  weeklyProg('juegos', 1);
  const m = UI.mg;
  m.ph='end'; m.title=title; m.scoreF=score; m.rMotas=motas; m.rXp=xp; m.won=won;
  G.best = G.best||{};
  m.newBest = score > (G.best[UI.mode]||0);
  if(m.newBest) G.best[UI.mode] = score;
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

/* --- TOPO: ratucos al asalto — golpéalos, no a los amigos --- */
function startTopo(){
  if(!mgGuard(10)) return;
  UI.mg = {ph:'play', t:0, end:25000, holes:[], score:0, combo:0, next:600};
  for(let i=0;i<9;i++) UI.mg.holes.push({up:null, hideAt:0, bopT:0});
  UI.mode='mgTopo';
}
const TOPO_POS = [];
for(let r=0;r<3;r++) for(let c=0;c<3;c++) TOPO_POS.push({x:44+c*36, y:108+r*34});
function topoTap(x,y){
  const m = UI.mg;
  if(m.ph==='end'){ UI.mode='main'; SFX.tap(); return; }
  if(m.ph!=='play') return;
  for(let i=0;i<9;i++){
    const P = TOPO_POS[i], h = m.holes[i];
    if(Math.abs(x-P.x)<=17 && Math.abs(y-P.y)<=16 && h.up){
      if(h.up==='friend'){
        m.score = Math.max(0, m.score-2); m.combo = 0;
        UI.floats.push({x:P.x, y:P.y-14, s:'¡AY! -2', col:'#e2574c', life:700, vy:-0.03});
        SFX.nope(); vibrate(40);
      } else {
        const v = h.up==='gold' ? 3 : 1;
        m.combo++; m.score += v;
        UI.floats.push({x:P.x, y:P.y-14, s:'+'+v, col:h.up==='gold'?'#ffd94a':'#ffffff', life:600, vy:-0.03});
        SFX.hit(h.up==='gold'); vibrate(12);
      }
      h.up = null; h.bopT = performance.now();
      return;
    }
  }
}
function topoFinish(){
  const m = UI.mg;
  const strong = m.score>=15;
  if(strong){ AP().str = Math.min(99, AP().str+1); toast('+1 FUE POR ESOS BRAZOS', 2200); }
  finishMg('TOPO', m.score, m.score*2, 8+Math.round(m.score/2), strong);
}

/* --- PESCA: espera la picada y domina la tensión del sedal --- */
function startPesca(){
  if(!mgGuard(10)) return;
  UI.mg = {ph:'wait', t:0, end:25000, biteAt: 1500+Math.random()*3000, biteT:0,
           tension:50, holdT:0, fish:null, caught:[], score:0, splashT:0};
  UI.mode='mgPesca';
}
const FISH_KINDS = [
 {id:'chico',   name:'PECECILLO', v:1, pull:0.020, col:'#9adcf0'},
 {id:'mediano', name:'PEZ RICO',  v:2, pull:0.030, col:'#4a90d8'},
 {id:'grande',  name:'PEZ GORDO', v:4, pull:0.045, col:'#2a4a8a'},
 {id:'dorado',  name:'PEZ DORADO',v:10,pull:0.060, col:'#ffd94a'}
];
function rollFish(){
  const r = Math.random();
  const bonus = AP().line==='marea' ? 0.06 : 0;
  if(r < 0.08+bonus) return FISH_KINDS[3];
  if(r < 0.30+bonus) return FISH_KINDS[2];
  if(r < 0.62) return FISH_KINDS[1];
  return FISH_KINDS[0];
}
function pescaTap(){
  const m = UI.mg;
  if(m.ph==='end'){ UI.mode='main'; SFX.tap(); return; }
  if(m.ph==='wait'){
    if(m.t >= m.biteAt && m.t < m.biteAt+420){
      m.fish = rollFish();
      m.ph='reel'; m.tension=55; m.holdT=0;
      SFX.boing(); vibrate(25);
    } else if(m.t < m.biteAt){
      UI.floats.push({x:112, y:120, s:'PRONTO...', col:'#9adcf0', life:600, vy:-0.02});
      SFX.tap();
    }
  } else if(m.ph==='reel'){
    m.tension = Math.min(100, m.tension+11);
    SFX.tap();
  }
}
function pescaStep(dt){
  const m = UI.mg;
  m.t += dt;
  if(m.ph==='wait'){
    if(m.t > m.biteAt && !m.biteT){ m.biteT = performance.now(); SFX.coin(); vibrate([20,20]); }
    if(m.t > m.biteAt+420){
      /* se escapó la picada: otra oportunidad */
      m.biteAt = m.t + 1200+Math.random()*2600; m.biteT = 0;
    }
    if(m.t >= m.end) pescaFinish();
  } else if(m.ph==='reel'){
    const f = m.fish;
    m.tension -= dt*(0.028 + f.pull*Math.abs(Math.sin(m.t/400)));
    m.holdT += dt;
    if(m.tension<=6){
      UI.floats.push({x:100, y:110, s:'SE ESCAPO...', col:'#e2574c', life:900, vy:-0.02});
      SFX.nope(); m.ph='wait'; m.fish=null; m.biteAt = m.t + 1400+Math.random()*2000; m.biteT=0;
    } else if(m.tension>=98){
      UI.floats.push({x:100, y:110, s:'¡SEDAL ROTO!', col:'#e2574c', life:900, vy:-0.02});
      SFX.nope(); vibrate(50); m.ph='wait'; m.fish=null; m.biteAt = m.t + 1400+Math.random()*2000; m.biteT=0;
    } else if(m.holdT>3400){
      m.caught.push(f); m.score += f.v; m.splashT = performance.now();
      UI.floats.push({x:100, y:104, s:'¡'+f.name+'!', col:f.col, life:1100, vy:-0.025});
      SFX.yay(); vibrate([20,20,40]);
      m.ph='wait'; m.fish=null; m.biteAt = m.t + 1200+Math.random()*2200; m.biteT=0;
    }
    if(m.t >= m.end) pescaFinish();
  }
}
function pescaFinish(){
  const m = UI.mg;
  const gold = m.caught.some(f=>f.id==='dorado');
  finishMg('PESCA', m.score, m.score*3, 8+m.score, m.score>=8 || gold);
}
