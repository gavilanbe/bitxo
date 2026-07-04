"use strict";
/* =========================================================
   BITXO — game/actions: cuidar, alimentar, tienda, juguetes, expediciones y ascensión
   ========================================================= */
/* ---------------- ACCIONES ---------------- */
function petAlert(p){
  return p.stage>STAGES.EGG && !p.exped &&
         (p.sick || p.hunger<25 || p.happy<25 || (!p.sleeping && p.energy<15) || p.hygiene<25);
}
function needsAttention(){
  return G.pets.some(petAlert) || G.poops.length>0;
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
    if((p.line==='petrea'||p.line==='fungo') && roll>=0.75) roll = 0.2;
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
  if(F.str) p.str = Math.min(99, p.str + F.str);
  if(F.xp) xp += F.xp;
  if(F.snack){ p.fedSnacks++; if(p.fedSnacks%6===0) p.mistakes++; }
  else p.fedMeals++;
  gainXP(xp);
  questProg('comidas', 1);
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
  questProg('limpia', n);
  SFX.clean(); toast('¡LIMPIO! +'+(2*n)+'✦'); saveGame();
}
function doSleepToggle(){
  const p = AP();
  if(p.sleeping){ p.sleeping=false; toast('¡ARRIBA!'); }
  else { p.sleeping=true; SFX.sleep(); toast('A DORMIR...'); }
  saveGame();
}
/* afinidad de línea: cada una entrena mejor una stat */
const TRAIN_AFFINITY = {brasa:'str', petrea:'def', marea:'spd'};
/* la cuota del parque sube con la stat: sumidero de motas de largo plazo */
function trainCost(p, kind){ return 5 + (p[kind]||0)*2; }
function trainEffect(kind){
  const p = AP();
  if(p.stage===STAGES.EGG){ toast('AUN ES UN HUEVO'); SFX.nope(); return null; }
  if(p.sleeping){ toast('SHHH... DUERME'); return null; }
  if(p.sick){ toast('ESTA MALITO: DALE MEDICINA'); SFX.nope(); return null; }
  if(p.energy<15){ toast('SIN ENERGIA'); SFX.nope(); return null; }
  const cost = trainCost(p, kind);
  if(G.motas < cost){ toast('FALTAN MOTAS ✦'); SFX.nope(); return null; }
  G.motas -= cost;
  p.energy = Math.max(0, p.energy-15);
  const gain = TRAIN_AFFINITY[p.line]===kind ? 2 : 1;
  p[kind] = Math.min(99, (p[kind]||0) + gain);
  p.weight = Math.max(5, p.weight-1);
  p.happy = Math.max(0, p.happy-3);
  gainXP(12);
  questProg('entrena', 1);
  weeklyProg('entrena', 1);
  SFX.train(); vibrate(30);
  saveGame();
  return {gain, kind, cost};
}

function buyToy(i){
  const T = TOYS[i];
  if(G.toys[T.id]){ toast('YA LO TIENES'); return; }
  if(G.motas < T.cost){ toast('FALTAN MOTAS ✦'); SFX.nope(); return; }
  G.motas -= T.cost;
  G.toys[T.id] = true;
  if(T.id==='caja') G.cajaReadyAt = Date.now();
  if(T.id==='huerto') G.huertoReadyAt = Date.now() + huertoCycleMs();
  UI.shopFlash[T.id] = performance.now();
  toast(toyZone(T.id)==='parque' ? '¡NUEVO JUGUETE EN EL PARQUE!' : '¡NUEVO JUGUETE EN EL PRADO!');
  SFX.buy(); vibrate(25); saveGame();
}

/* ---------------- ZONAS: senderos, mudanzas y brazos ---------------- */
/* mientras una zona esté cerrada, sus juguetes viven en el prado (el
   atasco que motiva abrirla); al abrirse, cada juguete se muda sola */
function toyZone(id){
  const z = TOY_ZONE[id]||'prado';
  return (z!=='prado' && !G.zonesOpen[z]) ? 'prado' : z;
}
/* ¿este bitxo está en la zona que miras (y no en brazos)? */
function isCarried(p){ return !!UI.carry && G.pets[UI.carry.i]===p; }
function petHere(p){ return (p.zone||'prado')===G.zone && !isCarried(p); }
function parqueEligible(){
  return Object.keys(G.toys).length >= ZONES.parque.toysNeed &&
         G.pets.some(p=>p.stage>=STAGES.CHILD);
}
function tapSendero(){
  if(!parqueEligible()){ toast('EL SENDERO PIDE '+ZONES.parque.toysNeed+' JUGUETES Y UN JOVEN', 2800); SFX.nope(); return; }
  if(G.motas < ZONES.parque.cost){ toast('ABRIR EL SENDERO: ✦'+ZONES.parque.cost, 2600); SFX.nope(); return; }
  UI.mode = 'parqueConfirm'; SFX.tap(); vibrate(10);
}
function openParque(){
  if(G.motas < ZONES.parque.cost){ toast('FALTAN MOTAS ✦'); SFX.nope(); UI.mode='main'; return; }
  G.motas -= ZONES.parque.cost;
  G.zonesOpen.parque = true;
  UI.mode = 'main';
  gotoZone('parque');
  toast('¡EL PARQUE ESTA ABIERTO!', 3200);
  diaryLog('SE ABRIO EL PARQUE');
  for(let i=0;i<14;i++) UI.particles.push({x:20+Math.random()*120, y:120+Math.random()*60, vy:-0.03-Math.random()*0.02, life:1200, ch:'✦', col:['#ffd94a','#7ac74f','#6db1ff'][i%3]});
  SFX.levelup(); vibrate([40,40,80]);
  saveGame();
}
function gotoZone(z){
  const prev = G.zone;
  G.zone = z;
  if(prev!==z){
    /* deslizamiento de cámara estilo Zelda */
    UI.zoneSlide = {from: prev, dir: ZONE_ORDER.indexOf(z) > ZONE_ORDER.indexOf(prev) ? 1 : -1, t:0};
    if(z!=='prado') questProg('visita', 1);
  }
  /* nadie se queda columpiándose en una zona que ya no ves */
  for(const p of G.pets){
    if((p.swingT||0)>0 || (p.batheT||0)>0 || (p.drinkT||0)>0){
      p.swingT=0; p.batheT=0; p.drinkT=0; p.nextWalk=0;
    }
  }
  saveGame();
}
function goWithToast(z){
  gotoZone(z);
  if(z!=='prado' && !G.hints.brazos && G.pets.some(p=>p.stage>STAGES.EGG) &&
     G.pets.every(p=>(p.zone||'prado')==='prado')){
    G.hints.brazos = true;
    toast('MANTEN PULSADO A UN BITXO PARA TRAERLO', 3600);
  } else {
    toast(ZONES[z].name, 1300);
  }
  SFX.tap(); vibrate(10);
}
/* ver al elegido: si vive en otra zona, la vista salta a él */
function seeSelected(){
  const z = AP().zone||'prado';
  if(z!==G.zone) gotoZone(z);
}

/* --- LA HUERTA: el sendero de la izquierda --- */
const HUERTA_TOYS = ['banera','huerto','fuente'];
function huertaTeaser(){
  return !G.zonesOpen.huerta && !!G.zonesOpen.parque && HUERTA_TOYS.some(id=>G.toys[id]);
}
function huertaEligible(){ return huertaTeaser() && (G.expedsDone||0)>=1; }
function tapSenderoHuerta(){
  if(!huertaEligible()){ toast('LA HUERTA PIDE UNA EXPEDICION HECHA', 2800); SFX.nope(); return; }
  if(G.motas < ZONES.huerta.cost){ toast('ABRIR LA HUERTA: ✦'+ZONES.huerta.cost, 2600); SFX.nope(); return; }
  UI.mode = 'huertaConfirm'; SFX.tap(); vibrate(10);
}
function openHuerta(){
  if(G.motas < ZONES.huerta.cost){ toast('FALTAN MOTAS ✦'); SFX.nope(); UI.mode='main'; return; }
  G.motas -= ZONES.huerta.cost;
  G.zonesOpen.huerta = true;
  UI.mode = 'main';
  gotoZone('huerta');
  toast('¡LA HUERTA ESTA ABIERTA!', 3200);
  diaryLog('SE ABRIO LA HUERTA');
  for(let i=0;i<14;i++) UI.particles.push({x:20+Math.random()*120, y:120+Math.random()*60, vy:-0.03-Math.random()*0.02, life:1200, ch:'✦', col:['#ffd94a','#7ac74f','#6db1ff'][i%3]});
  SFX.levelup(); vibrate([40,40,80]);
  saveGame();
}
/* si alguien vive en la huerta, riega: la fruta madura antes */
function huertoCycleMs(){
  const riego = G.pets.some(p=>(p.zone||'prado')==='huerta' && p.stage>STAGES.EGG);
  return (riego ? 90 : 120) * 60 * 1000;
}

/* --- tienda con scroll: alto del contenido por pestaña --- */
function shopContentH(){
  const tab = UI.shopTab||0;
  if(tab===0) return SHOP.length*19;
  if(tab===1) return TOYS.length*20;
  if(tab===2) return Math.ceil(HATS.length/2)*25;
  return DECOR.length*22;
}
function shopMaxScroll(){ return Math.max(0, shopContentH() - 144); }

/* --- VIAJE CON COMPAÑÍA: al cruzar, elige quién viene --- */
function travelOptions(dest){
  const opts = [];
  for(let i=0;i<G.pets.length;i++){
    const p = G.pets[i];
    if((p.zone||'prado')!==G.zone || p.stage===STAGES.EGG || p.exped || p.sleeping || isCarried(p)) continue;
    let block = null;
    if(dest!=='prado' && p.stage<STAGES.CHILD) block = 'MUY PEQUENO';
    else if(dest!=='prado' && G.pets.filter(q=>q!==p && (q.zone||'prado')===dest).length>=zoneCap(dest)) block = 'ALLI YA VIVEN '+zoneCap(dest);
    opts.push({i, p, block});
  }
  return opts;
}
function askTravel(dest){
  if(!UI.carry && travelOptions(dest).length>=2){
    UI.travelDest = dest;
    UI.mode = 'travelPick';
    SFX.tap(); vibrate(10);
    return;
  }
  goWithToast(dest);
}
function travelWith(idx){
  const dest = UI.travelDest;
  const o = travelOptions(dest).find(t=>t.i===idx);
  if(!o) return;
  if(o.block){ toast(o.block); SFX.nope(); return; }
  const p = o.p;
  const entering = ZONE_ORDER.indexOf(dest) > ZONE_ORDER.indexOf(G.zone) ? 26 : 134;
  p.zone = dest;
  p.rx = entering; p.tx = entering; p.nextWalk = 0;
  p.petT = performance.now(); p.joyAt = performance.now();
  G.sel = idx;
  UI.mode = 'main';
  gotoZone(dest);
  toast(petName(p)+' VIENE CONTIGO', 1800);
  SFX.yay(); vibrate(15);
}

/* --- EN BRAZOS: mantener pulsado coge, tocar el suelo suelta --- */
function zoneCap(z){ return z==='prado' ? 9 : 2; }
function startCarry(i){
  const p = G.pets[i];
  if(!p || p.stage===STAGES.EGG || p.exped || p.sleeping || UI.mode!=='main') return;
  UI.carry = {i};
  G.sel = i;
  p.swingT=0; p.batheT=0; p.drinkT=0;
  petVoice(p); vibrate([15,25,15]);
  toast('EN BRAZOS: TOCA EL SUELO PARA DEJARLO', 2600);
}
function dropCarry(x){
  const p = G.pets[UI.carry.i];
  if(!p){ UI.carry = null; return; }
  if(p.stage<STAGES.CHILD && G.zone!=='prado'){ toast('MUY PEQUENO PARA VIVIR FUERA'); SFX.nope(); return; }
  const vecinos = G.pets.filter(q=>q!==p && (q.zone||'prado')===G.zone).length;
  if(vecinos>=zoneCap(G.zone)){ toast('AQUI YA VIVEN '+zoneCap(G.zone)); SFX.nope(); return; }
  const moved = (p.zone||'prado')!==G.zone;
  p.zone = G.zone;
  p.rx = Math.max(22, Math.min(138, x)); p.tx = p.rx; p.nextWalk = 0;
  p.petT = performance.now(); p.joyAt = performance.now();
  UI.carry = null;
  spawnHearts(1);
  if(moved) diaryLog(petName(p)+' SE MUDO: '+ZONES[G.zone].name);
  toast(moved ? 'AQUI VIVE '+petName(p) : petName(p), 1600);
  SFX.yay(); vibrate(15); saveGame();
}
function openCaja(){
  const r = Math.random();
  if(r<0.55){
    const g = Math.round((30+Math.random()*50)*legacyMult());
    gainMotas(g, 106, 140);
    toast('¡CAJA: +'+g+'✦!', 2600);
  } else if(r<0.8){
    for(let i=0;i<5;i++) UI.sparkles.push({x:20+Math.random()*120, y:130+Math.random()*50, born:Date.now(), t:Math.random()*7, zone:G.zone});
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
  p.exped = {dest:i, until: Date.now() + Math.round(E.mins*60000*(p.line==='fungo'?0.8:1))};
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
  const p = AP();
  G.legacy = G.legacy||[];
  G.legacy.push({name: petName(p), key: evoKeyOf(p), lv: p.level, gen: p.gen, stars: UI.ascGain});
  diaryLog(petName(p)+' ASCENDIO AL CIELO +'+UI.ascGain+'★');
  G.stars += UI.ascGain;
  G.ascensions++;
  const i = G.sel;
  spawnEgg(i);
  G.sel = i;
  UI.sparkles=[]; UI.mode='main';
  saveGame();
}

/* ---------------- MISIONES DEL DÍA ---------------- */
function dayKey(){ const d = new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function ensureDaily(){
  ensureWeekly();
  const key = dayKey();
  if(G.daily && G.daily.key===key) return;
  /* 3 misiones al día, elegidas con un LCG sembrado por la fecha:
     todos ven las mismas y no se pueden re-tirar */
  let s = 0; for(const c of key) s = (s*31 + c.charCodeAt(0)) >>> 0;
  /* nada de misiones imposibles: cada una exige tener su sistema a mano */
  const fighter = G.pets.some(q=>q.stage>=STAGES.CHILD);
  const QUEST_OK = {
    combate: fighter, combo: fighter, parada: fighter,
    cosecha: !!G.toys.huerto,
    visita: !!(G.zonesOpen.parque || G.zonesOpen.huerta)
  };
  const idx = QUESTS.map((_,i)=>i).filter(i=>{
    const ok = QUEST_OK[QUESTS[i].id];
    return ok===undefined ? true : ok;
  });
  for(let i=idx.length-1;i>0;i--){
    s = (s*1664525 + 1013904223) >>> 0;
    const j = s % (i+1);
    const tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp;
  }
  G.daily = {key, ids: idx.slice(0,3), prog:{}, claimed:{}};
}
function questProg(id, n){
  if(!G || !G.daily) return;
  if(!G.daily.ids.some(i=>QUESTS[i].id===id)) return;
  if(G.daily.claimed[id]) return;
  G.daily.prog[id] = (G.daily.prog[id]||0) + n;
}
function questClaimable(){
  ensureDaily();
  return G.daily.ids.some(i=>{
    const q = QUESTS[i];
    return !G.daily.claimed[q.id] && (G.daily.prog[q.id]||0) >= q.n;
  });
}
function claimQuest(i){
  const q = QUESTS[G.daily.ids[i]];
  if(G.daily.claimed[q.id]){ SFX.tap(); return; }
  if((G.daily.prog[q.id]||0) < q.n){ SFX.tap(); return; }
  G.daily.claimed[q.id] = true;
  gainMotas(q.m); gainXP(q.xp);
  toast('¡MISION LISTA! +'+q.m+'✦', 2600);
  SFX.buy(); vibrate(25);
  for(let j=0;j<8;j++) UI.particles.push({x:60+Math.random()*40,y:100+Math.random()*20,vy:0.02,life:1000,ch:'.',col:'#ffd94a'});
  saveGame();
}

/* ---------------- EL BUHONERO ---------------- */
function buhoOffers(){
  const offers = [];
  if(!G.hats.buho) offers.push({kind:'hat', id:'buho', name:'GORRO BUHO', desc:'SOLO AQUI', cost:250});
  const rl = relicRoll();
  if(rl && Math.random()<0.4) offers.push({kind:'relic', id:rl.id, name:rl.name, desc:rl.desc, cost:500});
  const pool = [
    {kind:'boost',  id:'boost',  name:'BOTIN X1.5',   desc:'30 MIN DE MOTAS',   cost:100},
    {kind:'xp',     id:'xp',     name:'POCION SABIA', desc:'+60 XP AL INSTANTE',cost:90},
    {kind:'siesta', id:'siesta', name:'CAFE DEL ALBA',desc:'PILAS AL MAXIMO',   cost:60},
    {kind:'festin', id:'festin', name:'FESTIN',       desc:'TODOS COMEN Y RIEN',cost:80},
    {kind:'item',   id:'pocion', name:'POCION ROJA',  desc:'MOCHILA: +VIDA EN LUCHA', cost:120},
    {kind:'item',   id:'chispa', name:'CHISPA PICANTE',desc:'MOCHILA: SUPER +2', cost:110}
  ];
  while(offers.length<3 && pool.length){
    const i = Math.floor(Math.random()*pool.length);
    offers.push(pool.splice(i,1)[0]);
  }
  return offers.slice(0,3);
}
function buyBuhoOffer(i){
  const o = G.buho && G.buho.offers[i];
  if(!o || o.sold){ SFX.tap(); return; }
  if(o.kind==='item' && (G.items||[]).length>=3){ toast('MOCHILA LLENA (3 HUECOS)'); SFX.nope(); return; }
  if(G.motas < o.cost){ toast('FALTAN MOTAS ✦'); SFX.nope(); return; }
  G.motas -= o.cost; o.sold = true;
  if(o.kind==='item'){ G.items = G.items||[]; G.items.push(o.id); toast('A LA MOCHILA: '+o.name, 2400); }
  else if(o.kind==='hat'){ G.hats[o.id] = true; AP().hat = o.id; toast('¡GORRO NUEVO PUESTO!'); }
  else if(o.kind==='relic'){ G.relics[o.id] = true; toast('RELIQUIA: '+o.name, 2800); }
  else if(o.kind==='boost'){ G.boostUntil = Date.now() + 30*60*1000; toast('¡BOTIN ACTIVADO 30 MIN!'); }
  else if(o.kind==='xp'){ gainXP(60); toast('+60 XP'); }
  else if(o.kind==='siesta'){ for(const p of G.pets){ if(p.stage>STAGES.EGG) p.energy = 100; } toast('¡PILAS A TOPE!'); }
  else if(o.kind==='festin'){
    for(const p of G.pets){ if(p.stage>STAGES.EGG){ p.hunger = Math.min(100, p.hunger+50); p.happy = Math.min(100, p.happy+20); } }
    toast('¡FESTIN PARA TODOS!'); spawnHearts(3);
  }
  SFX.buy(); vibrate(25); saveGame();
}

/* ---------------- DUELO AMISTOSO (en el parque) ---------------- */
function startDuel(){
  const duo = G.pets.filter(q=>(q.zone||'prado')==='parque' && q.stage>=STAGES.CHILD && !q.sleeping && !q.exped && !isCarried(q));
  if(duo.length<2){ toast('HACEN FALTA 2 BITXOS EN EL PARQUE'); SFX.nope(); return; }
  const a = duo[0], r = duo[1];
  if(a.energy<8 || r.energy<8){ toast('SIN ENERGIA PARA JUGAR'); SFX.nope(); return; }
  G.sel = G.pets.indexOf(a);
  const nv = Math.max(1, playerPower(r));
  UI.bt = {
    kind:'duelo', name:petName(r).slice(0,9), nv, elite:false,
    elem: playerElem(r), quirk:null,
    mult: elemMult(playerElem(a), playerElem(r)),
    friendly:true, rival:r,
    fspr: SPR[r.form==='grimo' ? 'grimo' : r.line+'_'+(r.form||'babyA')][0],
    ehp: Math.round(14 + nv*2.6), eatk: 1.8 + nv*0.6,
    php: Math.round(24 + a.level*2.5 + a.weight*0.4),
    phase:'intro', t:0, mk:Math.random(), mdir:1,
    dmg:0, crit:false, resolved:false, shake:0, stop:0, zoomT:0,
    super:0, superMax:4,
    eCharge:0, bigAtk:false, blocked:false, blockFxT:0,
    bubble:false, burnT:0, stolen:0, willDouble:false,
    combo:0, comboIdle:0, lastGood:false, miss:false,
    rage:false, rageNow:false, parry:false, parryFxT:0, dodge:false,
    ehurtT:0, phurtT:0, dieT:0, fx:[], turnMsg:''
  };
  UI.bt.emx = UI.bt.ehp; UI.bt.pmx = UI.bt.php;
  UI.bt.ehpShow = UI.bt.ehp; UI.bt.phpShow = UI.bt.php;
  a.energy = Math.max(0, a.energy-8);
  r.energy = Math.max(0, r.energy-8);
  UI.mode = 'battle';
  SFX.train(); vibrate(30);
}

/* ---------------- MOCHILA: usar objeto en combate ---------------- */
function useBattleItem(i){
  const b = UI.bt; if(!b || b.phase!=='timing') return;
  const it = (G.items||[])[i]; if(!it) return;
  G.items.splice(i, 1);
  if(it==='pocion'){
    const heal = Math.round(b.pmx*0.4);
    b.php = Math.min(b.pmx, b.php+heal);
    UI.floats.push({x:46, y:96, s:'+'+heal, col:'#7ac74f', life:900, vy:-0.03});
    SFX.eat();
  } else if(it==='chispa'){
    b.super = Math.min(b.superMax, b.super+2);
    UI.floats.push({x:46, y:96, s:'SUPER +2', col:'#ffd94a', life:900, vy:-0.03});
    SFX.coin();
  }
  vibrate(15); saveGame();
}

/* ---------------- GYM: la rep se clava con el dedo ---------------- */
function gymRepTap(){
  const pk = UI.park;
  if(!pk || pk.phase!=='train' || (pk.repAnim||0)>0 || (pk.rep||0)>=3) return;
  const gauge = (Math.sin((pk.t||0)/300)+1)/2;
  const perfect = gauge > 0.72;
  pk.lastPerfect = perfect;
  if(perfect) pk.perfects = (pk.perfects||0)+1;
  pk.repAnim = 420;
  UI.floats.push({x:pk.px, y:116, s: perfect ? '¡CLAVADO!' : 'BIEN', col: perfect ? '#ffd94a' : '#f6efe0', life:520, vy:-0.04});
  if(perfect){ SFX.coin(); vibrate([10,20]); } else { SFX.tap(); vibrate(8); }
}

/* ---------------- LOGROS: scroll del panel ---------------- */
function achMaxScroll(){ return Math.max(0, ACH.length*11 - 165); }

/* ---------------- GORROS ---------------- */
function tapHat(i){
  const H = HATS[i];
  const p = AP();
  if(G.hats[H.id]){
    p.hat = (p.hat===H.id) ? null : H.id;
    toast(p.hat ? '¡'+H.name+' PUESTO!' : 'GORRO GUARDADO');
    SFX.tap(); saveGame(); return;
  }
  if(H.buhoOnly){ toast('SOLO LO VENDE EL BUHONERO'); SFX.nope(); return; }
  if(H.towerOnly){ toast('SOLO LA TORRE LO OTORGA'); SFX.nope(); return; }
  if(G.motas < H.cost){ toast('FALTAN MOTAS ✦'); SFX.nope(); return; }
  G.motas -= H.cost; G.hats[H.id] = true; p.hat = H.id;
  UI.shopFlash[H.id] = performance.now();
  toast('¡GORRO NUEVO PUESTO!'); SFX.buy(); vibrate(25); saveGame();
}

/* ---------------- DISCOS Y JUEGOS NUEVOS ---------------- */
function buyDisco(i){
  const D = DISCOS[i];
  if(G.discos[D.id]){ return false; }
  if(G.motas < D.cost){ toast('FALTAN MOTAS ✦'); SFX.nope(); return true; }
  G.motas -= D.cost;
  G.discos[D.id] = true; G.disco = D.id;
  toast('¡DISCO NUEVO! DALE AL BAILE');
  SFX.buy(); vibrate(25); saveGame();
  return true;
}
function previewDisco(i){
  const D = DISCOS[i];
  audio();
  /* la banda sonora calla mientras suena la preescucha (y no se pisan) */
  const nowP = performance.now();
  if(nowP < (UI.previewUntil||0)){ SFX.tap(); return; }
  const durMs = 8*D.step + 500;
  UI.previewUntil = nowP + durMs;
  holdMusic(durMs + 900);
  for(let n=0;n<8;n++){
    if(!D.pat[n]) continue;
    const off = n*D.step/1000;
    tone({f:NOTE(D.base, D.tune[n]), at:sfxAt(off), d:0.16, type:'p25', vol:0.05, send:0.2});
    kick(sfxAt(off), 0.06);
  }
  SFX.tap();
}
function buyGame(gkey, cost){
  if(G.motas < cost){ toast('FALTAN MOTAS ✦'); SFX.nope(); return; }
  G.motas -= cost;
  G.games[gkey] = true;
  toast('¡JUEGO NUEVO DESBLOQUEADO!');
  SFX.buy(); vibrate(25); saveGame();
}

/* ---------------- COPIA DE SEGURIDAD DE LA PARTIDA ---------------- */
async function exportSave(){
  try{
    await saveGame();
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(G))));
    await navigator.clipboard.writeText(code);
    toast('CODIGO COPIADO: GUARDALO BIEN', 3000);
    SFX.coin();
  }catch(e){ toast('NO SE PUDO COPIAR'); SFX.nope(); }
}
async function importSave(){
  try{
    const code = ((await navigator.clipboard.readText())||'').trim();
    const data = JSON.parse(decodeURIComponent(escape(atob(code))));
    if(!data || !data.v || !Array.isArray(data.pets)) throw 0;
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    toast('¡PARTIDA CARGADA!', 2000);
    SFX.buy();
    setTimeout(()=>location.reload(), 700);
  }catch(e){ toast('EL PORTAPAPELES NO TRAE UN CODIGO VALIDO', 2600); SFX.nope(); }
}

/* ---------------- LA TORRE DEL PRADO ---------------- */
function towerLaunch(){
  const t2 = G.tower;
  const p = AP();
  const pp = playerPower(p);
  const floor = t2.floor;
  let kind, boss = false, elite = false;
  if(floor>=TOWER.floors){
    kind = (G.bossesWon%2===0) ? 'lobruno' : 'reyseto'; boss = true;
  } else if(floor===4){
    kind = TOWER_POOL_HIGH[Math.floor(Math.random()*TOWER_POOL_HIGH.length)]; elite = true;
  } else {
    const pool = floor<=2 ? TOWER_POOL_LOW : TOWER_POOL_HIGH;
    kind = pool[Math.floor(Math.random()*pool.length)];
  }
  const nv = Math.max(1, pp + [-1,0,2,3,4][floor-1]);
  G.wild = {kind, nv, elite, boss, tower:true, x:110, tx:110, arriveAt:Date.now(), stealAt:Date.now()+9e9, dir:-1};
  startBattle();
  if(UI.mode!=='battle'){ G.wild = null; return false; } /* guardas (pilas...) */
  if(t2.php!=null){ UI.bt.php = Math.min(UI.bt.pmx, t2.php); UI.bt.phpShow = UI.bt.php; }
  return true;
}
function towerEnter(){
  const p = AP();
  if(p.stage<STAGES.CHILD){ toast('MUY PEQUENO PARA LA TORRE'); SFX.nope(); return; }
  if(Date.now() < (G.towerNextAt||0)){
    const mns = Math.ceil((G.towerNextAt-Date.now())/60000);
    toast('LA TORRE ABRE EN '+(mns>=60? Math.ceil(mns/60)+'H' : mns+'M')); SFX.nope(); return;
  }
  if(G.motas < TOWER.fee){ toast('FALTAN MOTAS ✦'); SFX.nope(); return; }
  G.motas -= TOWER.fee;
  G.tower = {floor:1, php:null};
  saveGame();
  towerLaunch();
}
function towerAbandon(){
  G.tower = null;
  G.towerNextAt = Date.now() + TOWER.cooldown;
  toast('LA TORRE ESPERARA...');
  SFX.bye(); saveGame();
  UI.mode = 'main';
}
/* al ganar un piso (lo llama battleTap al salir del combate) */
function towerAdvance(b){
  const t2 = G.tower;
  t2.php = Math.min(b.pmx, b.php + Math.round(b.pmx*TOWER.heal));
  t2.floor++;
  if(t2.floor===4){
    const bono = 200 + playerPower(AP())*8;
    gainMotas(bono);
    toast('¡PISO 3 SUPERADO! +'+bono+'✦', 3000);
  }
  if(t2.floor > TOWER.floors){
    /* campeón */
    const premio = 500 + playerPower(AP())*20;
    gainMotas(premio);
    const rl = relicRoll();
    if(rl) G.relics[rl.id] = true;
    let hatMsg = '';
    if(!G.hats.laurel){ G.hats.laurel = true; AP().hat = 'laurel'; hatMsg = ' ¡Y EL LAUREL!'; }
    diaryLog(petName(AP())+' CORONO LA TORRE');
    G.tower = null;
    G.towerNextAt = Date.now() + TOWER.cooldown;
    toast('¡CAMPEON DE LA TORRE! +'+premio+'✦'+hatMsg, 4200);
    SFX.evolveFanfare(); vibrate([60,60,60,60,150]);
    saveGame();
    UI.mode = 'main';
    return;
  }
  saveGame();
  UI.mode = 'tower';
}

/* ---------------- MISION SEMANAL ---------------- */
function ensureWeekly(){
  const key = Math.floor(Date.now()/(7*86400000));
  if(G.weekly && G.weekly.key===key) return;
  G.weekly = {key, id: WEEKLY[key % WEEKLY.length].id, prog:0, claimed:false};
}
function weeklyDef(){ ensureWeekly(); return WEEKLY.find(w=>w.id===G.weekly.id); }
function weeklyProg(kind, n){
  if(!G || !G.weekly) return;
  if(G.weekly.claimed || G.weekly.id!==kind) return;
  G.weekly.prog += n;
}
function claimWeekly(){
  const W = weeklyDef();
  if(G.weekly.claimed || G.weekly.prog < W.n){ SFX.tap(); return; }
  G.weekly.claimed = true;
  gainMotas(W.m); gainXP(W.xp);
  toast('¡SEMANAL CUMPLIDA! +'+W.m+'✦', 3000);
  SFX.buy(); vibrate(30); saveGame();
}

/* ---------------- POSTAL: foto para compartir ---------------- */
async function takePhoto(){
  try{
    const sc = 4, m = 24;
    const o = document.createElement('canvas');
    o.width = 160*sc + m*2; o.height = 272*sc + m*2 + 56;
    const g2 = o.getContext('2d');
    g2.imageSmoothingEnabled = false;
    g2.fillStyle = '#e8e0c8'; g2.fillRect(0,0,o.width,o.height);
    g2.fillStyle = '#d6cdb4'; g2.fillRect(0,o.height-4,o.width,4);
    g2.fillStyle = '#1a1428'; g2.fillRect(m-4, m-4, 160*sc+8, 272*sc+8);
    g2.drawImage(cv, m, m, 160*sc, 272*sc);
    const p = AP();
    const d = new Date();
    const who = p.nick || (p.stage===STAGES.EGG ? 'HUEVO '+LINES[p.line].name : currentFormDef().name);
    const label = 'BITXO · '+who+' · '+d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear();
    drawTextAt(g2, label, Math.round((o.width - label.length*4*3)/2), o.height-42, '#3b3552', 3);
    /* todo síncrono hasta share: así el gesto del toque sigue vivo (iOS) */
    const dataURL = o.toDataURL('image/png');
    const bin = atob(dataURL.split(',')[1]);
    const bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], {type:'image/png'});
    const file = new File([blob], 'bitxo-postal.png', {type:'image/png'});
    let shared = false;
    if(navigator.canShare && navigator.canShare({files:[file]})){
      try{ await navigator.share({files:[file], title:'BITXO'}); shared = true; }
      catch(e){ if(e && e.name==='AbortError') return false; /* canceló */ }
    }
    if(!shared){
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'bitxo-postal.png';
      a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
    }
    toast('¡POSTAL LISTA!');
    SFX.coin();
    return true;
  }catch(e){
    toast('NO SE PUDO HACER LA FOTO'); SFX.nope();
    return false;
  }
}

/* ---------------- MEDICINA ---------------- */
const COST_MEDICINA = 30;
function giveMedicine(){
  const p = AP();
  if(!p.sick){ toast('NO ESTA ENFERMO'); SFX.tap(); return; }
  if(G.motas < COST_MEDICINA){ toast('FALTAN MOTAS ✦'); SFX.nope(); return; }
  G.motas -= COST_MEDICINA;
  p.sick = false; p.sickPenal = false;
  diaryLog(petName(p)+' SE CURO CON LA MEDICINA');
  p.happy = Math.min(100, p.happy+8);
  p.eatT = 1600; p.feedKind = 'sopa';
  toast('¡'+petName(p)+' ESTA COMO NUEVO!', 2800);
  SFX.yay(); vibrate(20); saveGame();
}

/* ---------------- DECORAR EL PRADO ---------------- */
function tapDecor(i){
  const D = DECOR[i];
  G.decor = G.decor || {owned:{}, flores:'clasico'};
  if(G.decor.owned[D.id]){
    if(D.kind==='flores'){
      G.decor.flores = (G.decor.flores===D.val) ? 'clasico' : D.val;
      toast(G.decor.flores===D.val ? '¡FLORES NUEVAS!' : 'FLORES DE SIEMPRE');
    } else {
      G.decor[D.id] = !G.decor[D.id];
      toast(G.decor[D.id] ? '¡PUESTO EN EL PRADO!' : 'GUARDADO');
    }
    SFX.tap(); saveGame(); return;
  }
  if(G.motas < D.cost){ toast('FALTAN MOTAS ✦'); SFX.nope(); return; }
  G.motas -= D.cost;
  G.decor.owned[D.id] = true;
  if(D.kind==='flores') G.decor.flores = D.val;
  else G.decor[D.id] = true;
  UI.shopFlash[D.id] = performance.now();
  toast('¡EL PRADO ESTA MAS BONITO!');
  SFX.buy(); vibrate(25); saveGame();
}

/* ---------------- DIARIO ---------------- */
function diaryLog(txt){
  if(!G) return;
  G.diary = G.diary || [];
  if(G.diary.length && G.diary[G.diary.length-1].txt===txt) return;
  const d = new Date();
  G.diary.push({d: d.getDate()+'/'+(d.getMonth()+1), txt});
  if(G.diary.length>40) G.diary.shift();
}
