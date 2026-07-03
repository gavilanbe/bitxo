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
function doTrain(kind){
  const p = AP();
  if(p.sleeping){ toast('SHHH... DUERME'); return; }
  if(p.energy<15){ toast('SIN ENERGIA'); SFX.nope(); return; }
  p.energy=Math.max(0,p.energy-15);
  const gain = TRAIN_AFFINITY[p.line]===kind ? 2 : 1;
  p[kind] = Math.min(99, (p[kind]||0) + gain);
  p.weight=Math.max(5,p.weight-1); p.happy=Math.max(0,p.happy-3);
  p.trainT = 1500; gainXP(12);
  const label = {str:'FUE', def:'DEF', spd:'VEL'}[kind];
  UI.floats.push({x:p.rx, y:128, s:'+'+gain+' '+label, col:'#7ac74f', life:1000, vy:-0.025});
  questProg('entrena', 1);
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
  const key = dayKey();
  if(G.daily && G.daily.key===key) return;
  /* 3 misiones al día, elegidas con un LCG sembrado por la fecha:
     todos ven las mismas y no se pueden re-tirar */
  let s = 0; for(const c of key) s = (s*31 + c.charCodeAt(0)) >>> 0;
  /* sin luchador no se pide ganar combates: nada de misiones imposibles */
  const fighter = G.pets.some(q=>q.stage>=STAGES.CHILD);
  const idx = QUESTS.map((_,i)=>i).filter(i=>QUESTS[i].id!=='combate' || fighter);
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
    {kind:'festin', id:'festin', name:'FESTIN',       desc:'TODOS COMEN Y RIEN',cost:80}
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
  if(G.motas < o.cost){ toast('FALTAN MOTAS ✦'); SFX.nope(); return; }
  G.motas -= o.cost; o.sold = true;
  if(o.kind==='hat'){ G.hats[o.id] = true; AP().hat = o.id; toast('¡GORRO NUEVO PUESTO!'); }
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
  for(let n=0;n<8;n++){
    if(!D.pat[n]) continue;
    const off = n*D.step/1000;
    tone({f:NOTE(D.base, D.tune[n]), at:sfxAt(off), d:0.16, type:'p25', vol:0.05, send:0.2});
    kick(sfxAt(off), 0.06);
  }
  SFX.tap();
}
function buySalta(){
  if(G.motas < COST_SALTA){ toast('FALTAN MOTAS ✦'); SFX.nope(); return; }
  G.motas -= COST_SALTA;
  G.games.salta = true;
  toast('¡LA COMBA ES TUYA!');
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
