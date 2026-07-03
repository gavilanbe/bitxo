"use strict";
/* =========================================================
   BITXO — game/state: estado global G, mascotas, huevos y migraciones
   ========================================================= */
let G = null;
let nextWildAt = 0;

function makePet(line, gen){
  return {
    line: line, gen: gen,
    trait: TRAIT_KEYS[Math.floor(Math.random()*TRAIT_KEYS.length)],
    stage: STAGES.EGG, form: null,
    bornAt: Date.now(), hatchedAt: null,
    hunger:100, happy:100, energy:100, hygiene:100,
    weight:10, discipline:0, str:0, def:0, spd:0, mistakes:0,
    hungerZeroSince:null, happyZeroSince:null,
    sleeping:false, tapsOnEgg:0,
    fedMeals:0, fedSnacks:0, gamesWon:0,
    level:1, xp:0,
    rx: 30+Math.random()*100, tx: 80, dir:1, nextWalk:0,
    blinkAt:0, eatT:0, trainT:0, petT:0, joyAt:0, joySeed:0, hop:0,
    dropT: performance.now(), feedKind:'meal'
  };
}
function AP(){ return G.pets[G.sel]; }
function maxPets(){ return 1 + G.up.nido; }

function rollLine(){
  if(G && G.nextEggLine){ const ln = G.nextEggLine; G.nextEggLine = null; return ln; }
  const keep = {stars:G? G.stars:0, ascensions:G? G.ascensions:0};
  const pool = LINE_KEYS.filter(ln=>LINES[ln].unlock(keep));
  let tot=0; for(const ln of pool) tot+=LINES[ln].w;
  let r=Math.random()*tot;
  for(const ln of pool){ r-=LINES[ln].w; if(r<=0) return ln; }
  return pool[0];
}
function spawnEgg(slotIdx){
  const ln = rollLine();
  G.gen++;
  const p = makePet(ln, G.gen);
  p.rx = 30 + (slotIdx!==undefined? slotIdx: G.pets.length)*45 + Math.random()*20;
  if(slotIdx!==undefined && slotIdx < G.pets.length) G.pets[slotIdx] = p;
  else G.pets.push(p);
  toast('¡HUEVO '+LINES[ln].name+'!', 2600);
  SFX.coin();
  return p;
}

function freshGame(){
  return {
    v:5, gen:0, sel:0, pets:[],
    motas:30, totalMotas:0,
    up:{cosecha:0,aura:0,iman:0,comedero:0,juguete:0,cama:0,jardin:0,nido:0},
    stars:0, ascensions:0, dex:{}, muted:false,
    battlesWon:0, boostUntil:0,
    ach:{}, bond:0, lastGift:null, giftStreak:0,
    relics:{}, expedsDone:0, bossesWon:0, bossDue:false, nextEggLine:null,
    toys:{}, ballX:80, ballVX:0, cajaReadyAt:0, foodsTried:{},
    hats:{}, daily:null, buhoNextAt:0, buho:null,
    discos:{prado:true}, disco:'prado', games:{}, beast:{},
    poops:[], lastSeen:Date.now(),
    hints:{sparkle:false, shop:false}
  };
}
function migrateOld(o){
  const g = freshGame();
  g.gen = o.gen||1;
  g.motas = o.motas!==undefined? o.motas : 40;
  g.totalMotas = o.totalMotas||0;
  g.up = Object.assign(g.up, o.up||{});
  g.stars = o.stars||0; g.ascensions = o.ascensions||0;
  g.dex = o.dex||{}; g.muted = o.muted||false;
  g.poops = o.poops||[];
  const p = makePet(o.line||'pradera', o.gen||1);
  for(const k of ['stage','form','bornAt','hatchedAt','hunger','happy','energy','hygiene','weight','discipline','mistakes','sleeping','tapsOnEgg','fedMeals','fedSnacks','gamesWon','level','xp']){
    if(o[k]!==undefined) p[k]=o[k];
  }
  p.str = p.discipline||0;
  if(p.form==='baby') p.form='babyA';
  if(p.form==='adultC' && (o.v||1)<3) p.form='grimo';
  const nd={}; for(const k in g.dex) nd[k.endsWith('_baby')? k+'A':k]=true; g.dex=nd;
  p.dropT = 0;
  g.pets = [p];
  return g;
}
