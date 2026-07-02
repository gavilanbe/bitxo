"use strict";
/* =========================================================
   BITXO — game/actions: cuidar, alimentar, tienda, juguetes, expediciones y ascensión
   ========================================================= */
/* ---------------- ACCIONES ---------------- */
function needsAttention(){
  return G.pets.some(p=>p.stage>STAGES.EGG && (p.hunger<25 || p.happy<25 || p.energy<15 || p.hygiene<25)) || G.poops.length>0;
}
function spawnHearts(n){
  const p = AP();
  for(let i=0;i<n;i++) UI.particles.push({x:p.rx-8+Math.random()*16, y:150+Math.random()*10, vy:-0.02-Math.random()*0.02, life:1400, ch:'♥', col:'#e2574c'});
}
function doFeed(fi){
  const p = AP();
  const F = FOODS[fi];
  if(!F) return;
  if(p.sleeping){ toast('SHHH... DUERME'); return; }
  if(G.motas < F.cost){ toast('SIN MOTAS ✦'); SFX.nope(); return; }
  if(F.hunger>=30 && p.hunger>92 && !F.gamble){ toast('NO TIENE HAMBRE'); SFX.nope(); return; }
  G.motas -= F.cost;
  G.foodsTried[F.id] = true;
  const glot = p.trait==='GLOTON'?1.25:1;
  let hh=F.hunger, ha=F.happy, en=F.energy, xp = F.snack?4:6;
  if(F.gamble){
    let roll = Math.random();
    if(p.line==='petrea' && roll>=0.75) roll = 0.2;
    if(roll<0.45){ hh=25; ha=25; en=25; xp+=8; toast('¡SETA BUENA!', 2200); }
    else if(roll<0.75){ hh=15; toast('SABE A SETA.', 1800); }
    else { ha=-10; toast('¡PUAJ! SETA MALA', 2200); SFX.nope(); p.trainT=700; }
  }
  if(F.spicy){
    if(p.line==='brasa'){ ha+=6; }
    else if(Math.random()<0.25){ ha-=8; toast('¡LE PICA!', 1800); p.trainT=800; vibrate(40); }
  }
  if(FAVES[p.line]===F.id){
    ha+=10; xp+=6;
    toast('¡SU COMIDA FAVORITA!', 2200);
    spawnHearts(3);
  }
  p.hunger = Math.max(0, Math.min(100, p.hunger + hh*glot));
  p.happy  = Math.max(0, Math.min(100, p.happy + ha));
  p.energy = Math.max(0, Math.min(100, p.energy + en));
  p.weight = Math.max(5, Math.min(99, p.weight + F.weight));
  if(F.str) p.discipline = Math.min(99, p.discipline + F.str);
  if(F.xp) xp += F.xp;
  if(F.snack){ p.fedSnacks++; if(p.fedSnacks%6===0) p.mistakes++; }
  else p.fedMeals++;
  gainXP(xp);
  p.eatT = 1600; p.feedKind = F.spr;
  SFX.eatFood(F.id); if(ha>0) spawnHearts(1);
  UI.mode='main'; saveGame();
}
function doClean(){
  if(G.poops.length===0){ toast('TODO LIMPIO'); return; }
  const n = G.poops.length;
  G.poops = [];
  for(const p of G.pets) p.hygiene = Math.min(100, p.hygiene+40);
  UI.sweepT = performance.now();
  gainXP(6*n); gainMotas(2*n, 80, 150);
  SFX.clean(); toast('¡LIMPIO! +'+(2*n)+'✦'); saveGame();
}
function doSleepToggle(){
  const p = AP();
  if(p.sleeping){ p.sleeping=false; toast('¡ARRIBA!'); }
  else { p.sleeping=true; SFX.sleep(); toast('A DORMIR...'); }
  saveGame();
}
function doTrain(){
  const p = AP();
  if(p.sleeping){ toast('SHHH... DUERME'); return; }
  if(p.energy<15){ toast('SIN ENERGIA'); SFX.nope(); return; }
  p.energy=Math.max(0,p.energy-15);
  p.discipline=Math.min(99,p.discipline+(p.line==='brasa'?2:1));
  p.weight=Math.max(5,p.weight-1); p.happy=Math.max(0,p.happy-3);
  p.trainT = 1500; gainXP(12);
  SFX.train(); vibrate(30); UI.mode='main'; saveGame();
}

function buyToy(i){
  const T = TOYS[i];
  if(G.toys[T.id]){ toast('YA LO TIENES'); return; }
  if(G.motas < T.cost){ toast('FALTAN MOTAS ✦'); SFX.nope(); return; }
  G.motas -= T.cost;
  G.toys[T.id] = true;
  if(T.id==='caja') G.cajaReadyAt = Date.now();
  UI.shopFlash[T.id] = performance.now();
  toast('¡NUEVO JUGUETE EN EL PRADO!');
  SFX.buy(); vibrate(25); saveGame();
}
function openCaja(){
  const r = Math.random();
  if(r<0.55){
    const g = Math.round((30+Math.random()*50)*legacyMult());
    gainMotas(g, 106, 140);
    toast('¡CAJA: +'+g+'✦!', 2600);
  } else if(r<0.8){
    for(let i=0;i<5;i++) UI.sparkles.push({x:20+Math.random()*120, y:130+Math.random()*50, born:Date.now(), t:Math.random()*7});
    toast('¡LLUVIA DE CHISPAS!', 2600);
  } else {
    gainXP(20);
    toast('¡CAJA: +20 XP!', 2600);
  }
  for(let i=0;i<10;i++) UI.particles.push({x:98+Math.random()*16,y:140,vy:-0.03-Math.random()*0.02,life:1000,ch:'.',col:['#ffd94a','#e2574c','#6db1ff'][i%3]});
  G.cajaReadyAt = Date.now() + 45*60*1000;
  SFX.boing(); vibrate([20,20,40]);
  saveGame();
}
function relicRoll(){
  const pool = RELICS.filter(r=>!G.relics[r.id]);
  if(!pool.length) return null;
  return pool[Math.floor(Math.random()*pool.length)];
}
function sendExpedition(i){
  const p = AP(), E = EXPEDS[i];
  if(p.exped) return;
  if(p.stage<STAGES.CHILD){ toast('AUN ES MUY PEQUENO'); SFX.nope(); return; }
  if(p.sleeping){ toast('SHHH... DUERME'); return; }
  if(p.energy<20){ toast('SIN ENERGIA'); SFX.nope(); return; }
  p.energy -= 15;
  p.exped = {dest:i, until: Date.now() + E.mins*60000};
  toast('¡'+currentNameOf(p)+' PARTE AL '+E.name+'!', 3000);
  SFX.train(); vibrate(30);
  UI.mode='main'; saveGame();
}
function resolveExpedition(p){
  const E = EXPEDS[p.exped.dest];
  const mult = (1+0.3*G.ascensions)*legacyMult();
  const motas = Math.round(E.motas*mult*(0.85+Math.random()*0.3));
  gainMotas(motas);
  gainXPFor(p, E.xp);
  let relicName = null, extra = 0;
  if(Math.random() < E.relic){
    const rl = relicRoll();
    if(rl){ G.relics[rl.id]=true; relicName = rl.name; }
    else { extra = 200; gainMotas(200); }
  }
  let eggline = null;
  if(E.egg && Math.random() < E.eggP){
    G.nextEggLine = E.egg; eggline = E.egg;
    if(G.pets.length < maxPets()) spawnEgg();
  }
  p.exped = null;
  p.happy = Math.min(100, p.happy+10);
  p.hunger = Math.max(10, p.hunger-20);
  G.expedsDone = (G.expedsDone||0)+1;
  UI.expReport = {name:currentNameOf(p), dest:E.name, motas, xp:E.xp, relicName, extra, eggline};
  SFX.buy();
}

function buyUpgrade(i){
  const item = SHOP[i];
  const lvl = G.up[item.id];
  if(lvl >= item.max){ toast('AL MAXIMO'); return; }
  const cost = upCost(item, lvl);
  if(G.motas < cost){ toast('FALTAN MOTAS ✦'); SFX.nope(); return; }
  G.motas -= cost;
  G.up[item.id]++;
  UI.shopFlash[item.id] = performance.now();
  SFX.buy(); vibrate(25);
  if(item.id==='jardin') toast('¡EL PRADO CRECE!');
  if(item.id==='nido'){ spawnEgg(); }
  saveGame();
}
function doAscend(){
  UI.ascGain = ascendStars();
  UI.mode='ascendFX'; UI.ascT=0;
  SFX.ascend(); vibrate([80,60,80,60,200]);
}
function finishAscend(){
  G.stars += UI.ascGain;
  G.ascensions++;
  const i = G.sel;
  spawnEgg(i);
  G.sel = i;
  UI.sparkles=[]; UI.mode='main';
  saveGame();
}
