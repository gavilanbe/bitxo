"use strict";
/* =========================================================
   BITXO — game/goals: OBJETIVOS encadenados
   Siempre hay una meta visible bajo el HUD ("¿y ahora qué?"). La cadena
   enseña el juego paso a paso; al acabarla, el prado propone hitos sin fin
   (formas del álbum, combates, ascensos...). Cada meta paga al cumplirse.
   ========================================================= */
const lifeN = id => (G.life && G.life[id]) || 0;
const maxLevel = () => Math.max(...G.pets.map(p=>p.level||1));
const maxStage = () => Math.max(...G.pets.map(p=>p.stage||0));
/* btn: botón de la botonera que se ilumina al pedir pista */
const GOALS = [
  {id:'nace',   t:'HAZ QUE NAZCA EL HUEVO',     h:'TOCA EL HUEVO PARA DARLE CALOR',
   done:()=>maxStage()>0, prog:()=>{ const p=G.pets[0]; return [Math.min(15, p?p.tapsOnEgg||0:0), 15]; }, m:10},
  {id:'mimos',  t:'ACARICIALO 3 VECES',         h:'TOCA A TU BITXO',            done:()=>lifeN('mimos')>=3, prog:()=>[lifeN('mimos'),3], m:10, xp:5},
  {id:'come',   t:'DALE DE COMER',              h:'BOTON COMER',                done:()=>lifeN('comidas')>=1, m:10, btn:0},
  {id:'chispa', t:'RECOGE 5 MOTAS DEL PRADO',   h:'TOCA LAS CHISPAS DORADAS',   done:()=>lifeN('chispas')>=5, prog:()=>[lifeN('chispas'),5], m:15},
  {id:'nv2',    t:'LLEGA A NIVEL 2',            h:'MIMOS, COMIDA Y MOTAS DAN XP', done:()=>maxLevel()>=2, xpBar:true, m:15},
  {id:'gym',    t:'ENTRENA EN EL GYM',          h:'JUGAR > GYM: ENTRENAR DECIDE SU FORMA', done:()=>lifeN('entrena')>=1, m:20, btn:1},
  {id:'juego',  t:'JUEGA UN MINIJUEGO',         h:'JUGAR > JUEGOS',             done:()=>lifeN('juegos')>=1, m:20, btn:1},
  {id:'evo',    t:'EVOLUCIONA: NIVEL 3',        h:'CRECE SOLO... O JUEGA Y VA MAS RAPIDO', done:()=>maxStage()>=2, xpBar:true, m:40},
  {id:'limpia', t:'LIMPIA UNA CACA',            h:'BOTON LIMPIAR',              done:()=>lifeN('limpia')>=1, m:15, btn:2},
  {id:'lucha',  t:'GANA TU PRIMER COMBATE',     h:'TOCA A UN SALVAJE CUANDO APAREZCA', done:()=>(G.battlesWon||0)>=1, m:40},
  {id:'toy',    t:'COMPRA UN JUGUETE',          h:'TIENDA > JUGUETE',           done:()=>Object.keys(G.toys||{}).length>=1, m:30, btn:4},
  {id:'mejora', t:'COMPRA UNA MEJORA',          h:'TIENDA > MEJORA',            done:()=>Object.values(G.up).some(v=>v>0), m:30, btn:4},
  {id:'mision', t:'COBRA UNA MISION',           h:'TOCA EL CARTEL DEL PRADO',   done:()=>lifeN('misiones')>=1, m:30},
  {id:'parque', t:'ABRE EL PARQUE',             h:'SENDERO DE LA DERECHA (✦500)', done:()=>!!(G.zonesOpen&&G.zonesOpen.parque),
   prog:()=>[Math.min(500, Math.floor(G.motas)), 500], m:50},
  {id:'adulto', t:'HAZLO ADULTO: NIVEL 6',      h:'SU FORMA DEPENDE DE COMO LO CRIES', done:()=>maxStage()>=3, xpBar:true, m:80},
  {id:'expe',   t:'MANDALO DE EXPEDICION',      h:'JUGAR > EXPLORACION',        done:()=>(G.expedsDone||0)>=1, m:50, btn:1},
  {id:'nido',   t:'COMPRA UN NIDO',             h:'TIENDA > MEJORA > NIDO',     done:()=>(G.up.nido||0)>=1, m:60, btn:4},
  {id:'win5',   t:'GANA 5 COMBATES',            h:'LOS SALVAJES VIENEN SOLOS',  done:()=>(G.battlesWon||0)>=5, prog:()=>[G.battlesWon||0,5], m:60},
  {id:'nv8',    t:'LLEGA A NIVEL 8',            h:'ENTRENA, LUCHA Y JUEGA',     done:()=>maxLevel()>=8, xpBar:true, m:100},
  {id:'asc',    t:'ASCIENDE A LAS ESTRELLAS',   h:'DATOS > ASCENDER: FUNDA TU DINASTIA', done:()=>(G.ascensions||0)>=1, m:200, btn:5}
];
/* hitos sin fin tras la cadena: se elige el más cercano y se FIJA
   (G.goal.e) hasta cumplirse */
const ENDLESS = {
  dex:    {t:'DESCUBRE {n} FORMAS',   h:'ALBUM: CRIA OTRAS LINEAS Y RAMAS', cur:()=>dexCount(), s:5},
  win:    {t:'GANA {n} COMBATES',     h:'LOS SALVAJES VIENEN SOLOS',        cur:()=>G.battlesWon||0, s:10},
  asc:    {t:'ASCIENDE {n} VECES',    h:'DATOS > ASCENDER',                 cur:()=>G.ascensions||0, s:1},
  nvl:    {t:'LLEGA A NIVEL {n}',     h:'ENTRENA, LUCHA Y JUEGA',           cur:()=>maxLevel(), s:5},
  juegos: {t:'JUEGA {n} MINIJUEGOS',  h:'JUGAR > JUEGOS',                   cur:()=>lifeN('juegos'), s:10}
};
function endlessGoal(){
  if(!G.goal.e){
    let best = null, bk = -1;
    for(const k in ENDLESS){
      const E = ENDLESS[k], c = E.cur(), n = (Math.floor(c/E.s)+1)*E.s;
      const r = c/n;
      if(r > bk){ bk = r; best = {k, n}; }
    }
    G.goal.e = best;
  }
  const e = G.goal.e, E = ENDLESS[e.k], lv = Math.max(1, maxLevel());
  return {id:'e_'+e.k+'_'+e.n, t:E.t.replace('{n}', e.n), h:E.h, endless:true,
          prog:()=>[Math.min(e.n, E.cur()), e.n], m:Math.round(60 + 20*lv), xp:10+lv*2};
}
function currentGoal(){
  if(!G.goal) goalInit();
  if(G.goal.i < GOALS.length) return GOALS[G.goal.i];
  return endlessGoal();
}
/* partidas viejas: se saltan en silencio las metas ya cumplidas */
function goalInit(){
  G.goal = {i:0};
  while(G.goal.i < GOALS.length && GOALS[G.goal.i].done()) G.goal.i++;
}
function goalProgress(g){
  if(g.prog) return g.prog();
  if(g.xpBar){ const p = G.pets.reduce((a,b)=>(b.level||1)>(a.level||1)?b:a); return [p.xp, xpNeed(p.level)]; }
  return null;
}
function goalComplete(g){
  if(g.m) gainMotas(g.m);
  if(g.xp) gainXP(g.xp);
  UI.goalDoneAt = performance.now();
  G.goal.lastT = g.t; G.goal.lastM = g.m||0;
  if(G.goal.i < GOALS.length) G.goal.i++;
  else { G.goal.endlessDone = (G.goal.endlessDone||0)+1; G.goal.e = null; }
  diaryLog('OBJETIVO: '+g.t.slice(0,28));
  /* celebración: la cinta estalla y las motas vuelan al marcador */
  if(sceneFamily(UI.mode)==='world'){
    confetti(80, 28, 26); ringFx(80, 28, '#ffd94a', 40, 420);
    if(g.m) flyCoins(80, 28, Math.min(10, 3+Math.round(g.m/20)));
    flash('#ffd94a', 0.15, 180);
  }
  SFX.buy(); vibrate([20,30,40]);
  saveGame();
}
let goalTimer = 0;
function goalsTick(){
  if(!G || UI.mode==='boot') return;
  const now = performance.now();
  if(now - goalTimer < 400) return;
  goalTimer = now;
  /* un objetivo por vez, con un respiro para que se vea la celebración */
  if(UI.goalDoneAt && now - UI.goalDoneAt < 1600) return;
  const g = currentGoal();
  let ok = false;
  if(g.endless){ const pr = g.prog(); ok = pr[0] >= pr[1]; }
  else ok = g.done();
  if(ok) goalComplete(g);
}
/* tocar la cinta: pista y el botón que toca se ilumina */
function goalTap(){
  const g = currentGoal();
  toast(g.h || g.t, 3200);
  if(g.btn!==undefined){ UI.hintBtn = {i:g.btn, until:performance.now()+3500}; }
  SFX.tap();
}
