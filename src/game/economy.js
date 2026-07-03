"use strict";
/* =========================================================
   BITXO — game/economy: tasas, motas, XP, evolución, logros y regalo diario
   ========================================================= */
/* ---------------- ECONOMIA ---------------- */
function ratePerMs(hoursToEmpty){ return 100/(hoursToEmpty*3600*1000); }
const R_HUNGER = ratePerMs(5);
const R_ENERGY = ratePerMs(16);
const R_SLEEPREGEN = ratePerMs(8);
function energyRate(p){ return R_ENERGY * (p.line==='marea'?0.8:1) * (p.trait==='DORMILON'?1.15:1) * (WEATHER.kind==='wind'?1.1:1) * (G.relics && G.relics.caracola?0.9:1); }
function hungerRate(p){ return R_HUNGER * (p.trait==='GLOTON'?1.25:1); }
function poopEvery(p){ return POOP_EVERY * (p.line==='petrea'?1.6:1); }
function hygMult(p){ return p.line==='petrea'?0.7:1; }
function happyDecayRate(p){ return ratePerMs(6) * (1 - 0.1*G.up.juguete) * (p.trait==='JUGUETON'?0.8:1) * weatherHappyMult(p) * (G.relics && G.relics.corona?0.9:1); }
function sleepRegen(p){ return R_SLEEPREGEN * (1 + 0.15*G.up.cama) * (p.trait==='DORMILON'?1.3:1); }
function gardenMult(){ return 1 + 0.25*G.up.jardin + (G.relics && G.relics.seta ? 0.1 : 0); }
function legacyMult(){ return 1 + 0.1*G.stars; }
function boostMult(){ return Date.now() < G.boostUntil ? 1.5 : 1; }
function petRate(p){
  if(p.stage===STAGES.EGG || p.exped) return 0;
  const mood = 0.5 + (p.happy/100);
  const stageM = [0,1,1.5,2.2][p.stage]||1;
  let r = (0.15 + 0.25*G.up.aura) * mood * gardenMult() * legacyMult() * stageM * (1+0.04*(p.level-1)) * (p.line==='pradera'?1.15:1) * traitWeatherMult(p);
  if(p.sleeping) r *= 0.3;
  return r;
}
function motaRate(){
  let r=0; for(const p of G.pets) r += petRate(p);
  return r * boostMult() * (G.relics && G.relics.trebol ? 1.05 : 1);
}
function tapYield(){ return Math.max(1, Math.round((1 + G.up.cosecha) * legacyMult())) + (G.relics && G.relics.campanilla ? 1 : 0); }
function gainMotas(n, x, y){
  G.motas += n; G.totalMotas += n;
  if(x!==undefined) UI.floats.push({x, y, s:'+'+fmt(n), col:'#ffd94a', life:900, vy:-0.025});
}
function xpNeed(l){ return Math.round(25 * Math.pow(1.35, l-1)); }
function gainXPFor(p, n){
  if(p.stage===STAGES.EGG) return;
  n = Math.round(n * (G.relics && G.relics.cristal ? 1.1 : 1));
  p.xp += n;
  while(p.xp >= xpNeed(p.level)){
    p.xp -= xpNeed(p.level); p.level++;
    p.happy = Math.min(100, p.happy+8);
    SFX.levelup(); toast('¡NIVEL '+p.level+'!');
    for(let i=0;i<14;i++) UI.particles.push({x:p.rx-14+Math.random()*28,y:150-Math.random()*30,vy:0.02+Math.random()*0.03,life:1200,ch:'.',col:['#ffd94a','#e2574c','#5ec8d8','#7ac74f'][i%4]});
  }
}
function gainXP(n){ gainXPFor(AP(), n); }
function canAscend(){ return AP().stage===STAGES.ADULT && AP().level>=8 && !AP().exped; }
function ascendStars(){
  const p = AP();
  return Math.max(1, Math.floor(p.level/4) + Math.floor(Math.log10(G.totalMotas+1)) - 1) + (p.line==='astro'?1:0);
}
function dexCount(){ let n=0; for(const k in G.dex) n++; return n; }
const DEX_TOTAL = LINE_KEYS.length*SLOT_KEYS.length + 1;
function markDex(key){ if(G && !G.dex[key]) G.dex[key]=true; }

function careScore(p){
  let s = 60;
  s -= p.mistakes*8;
  s += Math.min(20, (p.str||0)+(p.def||0)+(p.spd||0));
  s -= Math.max(0, p.weight-40)/2;
  s += Math.min(10, p.gamesWon);
  return Math.max(0, Math.min(100, s));
}
function checkEvolution(p, silent){
  if(!p.hatchedAt) return;
  const age = Date.now() - p.hatchedAt;
  if(p.stage===STAGES.BABY && age > T_CHILD){
    p.stage = STAGES.CHILD;
    p.form = (((p.str||0)+(p.def||0)+(p.spd||0))>=4 || careScore(p)>=65) ? 'childA' : 'childB';
    markDex(p.line+'_'+p.form);
    if(!silent){ G.sel = G.pets.indexOf(p); startEvolveFX(); } else UI.pendingEvoNote = true;
  }
  if(p.stage===STAGES.CHILD && age > T_ADULT){
    p.stage = STAGES.ADULT;
    const cs = careScore(p);
    if(p.mistakes>=5 || cs<35) p.form='grimo';
    else if(cs>=85 && p.str>=6 && p.def>=6 && p.spd>=6 && p.gamesWon>=5 && p.mistakes===0) p.form='adultS';
    else if(p.form==='childA') p.form = (p.str>=5 && p.str>=p.def) ? 'adultA' : 'adultB';
    else p.form = (p.spd>=5 || p.gamesWon>=3) ? 'adultC' : 'adultD';
    markDex(p.form==='grimo' ? 'grimo' : p.line+'_'+p.form);
    if(!silent){ G.sel = G.pets.indexOf(p); startEvolveFX(); } else UI.pendingEvoNote = true;
  }
}

function checkAchievements(){
  for(const a of ACH){
    if(!G.ach[a.id] && a.cond()){
      G.ach[a.id] = true;
      if(a.m){ gainMotas(a.m); toast('¡LOGRO: '+a.name+'! +'+a.m+'✦', 3200); }
      else { G.stars += a.s; toast('¡LOGRO: '+a.name+'! +'+a.s+'★', 3200); }
      SFX.levelup();
      for(let i=0;i<10;i++) UI.particles.push({x:60+Math.random()*40,y:80+Math.random()*20,vy:0.02,life:1200,ch:'.',col:'#ffd94a'});
      break;
    }
  }
}
function checkDailyGift(){
  const d = new Date();
  const key = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
  if(G.lastGift===key) return;
  const yd = new Date(Date.now()-86400000);
  const ykey = yd.getFullYear()+'-'+(yd.getMonth()+1)+'-'+yd.getDate();
  G.giftStreak = (G.lastGift===ykey) ? Math.min(7,(G.giftStreak||0)+1) : 1;
  G.lastGift = key;
  const gift = 25 + 25*G.giftStreak;
  gainMotas(gift);
  toast('¡REGALO DIARIO! +'+gift+'✦ (DIA '+G.giftStreak+')', 3400);
  SFX.buy();
  saveGame();
}

/* poder de combate del bitxo: nivel + entreno + etapa */
function playerPower(p){
  return p.level + Math.floor(((p.str||0)+(p.def||0)+(p.spd||0))/6) + p.stage*2;
}
function playerElem(p){ return p.form==='grimo' ? 'sombra' : p.line; }
function elemMult(pe, ee){
  if(ELEM_BEATS[pe]===ee || (pe==='astro' && ee==='sombra')) return 1.3;
  if(ELEM_BEATS[ee]===pe) return 0.75;
  return 1;
}
