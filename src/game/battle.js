"use strict";
/* =========================================================
   BITXO — game/battle: combate v2
   Intro cinemática, golpe con timing, BLOQUEO activo, medidor
   de SUPER con ataque único por línea, hit-stop y enemigos con
   personalidad (pinchos, esfumarse, carga del jefe).
   ========================================================= */
const SUPERS = {
  pradera:{name:'TORMENTA DE HOJAS', col:'#7ac74f', col2:'#c8f0a8', style:'spiral'},
  brasa:  {name:'LLAMARADA',         col:'#e8574c', col2:'#ffd94a', style:'stream'},
  marea:  {name:'OLA GIGANTE',       col:'#4a90d8', col2:'#9adcf0', style:'wave'},
  petrea: {name:'ROCA VIVA',         col:'#8a8a94', col2:'#6a6a78', style:'boulder'},
  astro:  {name:'LLUVIA ESTELAR',    col:'#ffd94a', col2:'#8a6ae8', style:'rain'},
  grimo:  {name:'ZARPA SOMBRIA',     col:'#9d7bd8', col2:'#4a3a9a', style:'rise'}
};
function superOf(p){ return SUPERS[p.form==='grimo' ? 'grimo' : p.line]; }

function startBattle(){
  const p = AP();
  if(p.exped){ toast('ESTA DE EXPEDICION'); SFX.nope(); return; }
  if(p.stage<STAGES.CHILD){ toast('MUY PEQUENO PARA LUCHAR'); SFX.nope(); return; }
  if(p.sleeping){ toast('SHHH... DUERME'); return; }
  if(p.energy<12){ toast('SIN ENERGIA'); SFX.nope(); return; }
  const E = ENEMIES[G.wild.kind];
  const nv = G.wild.nv || Math.max(1, playerPower(p) + 1);
  const elite = !!G.wild.elite;
  UI.bt = {
    kind:G.wild.kind, name:E.name, nv, elite,
    elem:E.elem, quirk:E.quirk,
    mult: elemMult(playerElem(p), E.elem),
    ehp: Math.round((12 + nv*3.4) * (E.hpM||1) * (elite?1.45:1) * (G.wild.boss?2.3:1)),
    eatk: (2.2 + nv*0.85) * (E.atkM||1) * (elite?1.2:1) * (G.wild.boss?1.35:1),
    php: Math.round(24 + p.level*2.5 + p.weight*0.4),
    phase:'intro', t:0, mk:Math.random(), mdir:1,
    dmg:0, crit:false, resolved:false,
    shake:0, stop:0, zoomT:0,
    super:0, superMax:4,
    eCharge:0, bigAtk:false, blocked:false, blockFxT:0,
    bubble: E.quirk==='bubble', burnT:0, stolen:0, willDouble:false,
    ehurtT:0, phurtT:0, dieT:0, fx:[], turnMsg:''
  };
  if(G.wild.boss){ UI.bt.boss = true; }
  UI.bt.emx = UI.bt.ehp; UI.bt.pmx = UI.bt.php;
  G.beast = G.beast || {};
  G.beast[G.wild.kind] = G.beast[G.wild.kind] || {seen:0, wins:0};
  G.beast[G.wild.kind].seen++;
  UI.bt.ehpShow = UI.bt.ehp; UI.bt.phpShow = UI.bt.php;
  p.energy = Math.max(0, p.energy-12);
  UI.mode='battle';
  SFX.train(); vibrate(40);
}

/* ------- resolución de golpes ------- */
function battleBurst(x, y, col, n){
  const b = UI.bt;
  for(let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2, sp = 0.03+Math.random()*0.06;
    b.fx.push({x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-0.02, g:0.0002, life:400+Math.random()*300, col, size:1+Math.floor(Math.random()*2)});
  }
}
function applyHitToEnemy(b, isSuper){
  const p = AP();
  /* el sombrío se esfuma si no aciertas de lleno */
  if(b.quirk==='evade' && !b.crit && !isSuper &&
     Math.random() < Math.max(0.05, 0.22 - (p.spd||0)*0.008)){
    UI.floats.push({x:112, y:96, s:'SE ESFUMA', col:'#b8a8e8', life:900, vy:-0.03});
    SFX.tap();
    return;
  }
  if(b.quirk==='armor'){ b.dmg = Math.max(1, b.dmg-2); }
  if(b.bubble && !b.crit && !isSuper){
    b.dmg = Math.max(1, Math.ceil(b.dmg/2));
    UI.floats.push({x:112, y:104, s:'BURBUJA', col:'#9adcf0', life:800, vy:-0.03});
  } else if(b.bubble && (b.crit || isSuper)){
    b.bubble = false;
    battleBurst(112, 118, '#9adcf0', 10);
    UI.floats.push({x:112, y:104, s:'¡BURBUJA ROTA!', col:'#9adcf0', life:900, vy:-0.03});
  }
  b.ehp = Math.max(0, b.ehp - b.dmg);
  b.ehurtT = performance.now();
  b.stop = b.crit ? 110 : 70;
  b.shake = performance.now();
  if(b.crit) b.zoomT = 170;
  battleBurst(112, 122, isSuper ? superOf(p).col : (b.crit ? '#ffd94a' : '#ffffff'), b.crit ? 14 : 8);
  UI.floats.push({x:112, y:92, s:'-'+b.dmg+(b.crit && !isSuper ?'!':''), col:b.crit?'#ffd94a':'#ffffff', life:900, vy:-0.035});
  if(isSuper) SFX.superHit(); else SFX.hit(b.crit);
  if(!isSuper) b.super = Math.min(b.superMax, b.super + (b.crit?2:1));
  /* el pinchón devuelve pinchos si no fue crítico */
  if(b.quirk==='thorns' && !b.crit && !isSuper && b.ehp>0){
    const r = Math.max(1, Math.round(2 + G.battlesWon*0.15));
    b.php = Math.max(0, b.php - r);
    b.phurtT = performance.now();
    UI.floats.push({x:46, y:104, s:'-'+r+' PINCHOS', col:'#e2574c', life:900, vy:-0.03});
  }
}
function resolveEnemyHit(b){
  const p = AP();
  if(Math.random() < Math.min(0.25, (p.spd||0)*0.012)){
    UI.floats.push({x:46, y:96, s:'¡ESQUIVA!', col:'#5ec8d8', life:900, vy:-0.03});
    SFX.tap();
    return;
  }
  let raw = b.eatk * (0.7+Math.random()*0.6) * (b.bigAtk ? 1.9 : 1);
  if(b.blocked){ raw *= 0.4; b.blockFxT = performance.now(); SFX.block(); }
  const dmg = Math.max(1, Math.round(raw - (p.def||0)*0.6));
  b.php = Math.max(0, b.php - dmg);
  b.phurtT = performance.now();
  b.shake = performance.now();
  battleBurst(46, 126, b.blocked ? '#5ec8d8' : '#e2574c', b.blocked ? 5 : 8);
  UI.floats.push({x:46, y:92, s:'-'+dmg+(b.blocked?' BLOQ':''), col:b.blocked?'#5ec8d8':'#e2574c', life:900, vy:-0.035});
  if(!b.blocked){
    SFX.hurt(); vibrate(30);
    if(b.quirk==='burn' && Math.random()<0.4){
      b.burnT = 2;
      UI.floats.push({x:46, y:108, s:'¡TE QUEMA!', col:'#f8a04b', life:900, vy:-0.03});
    }
    if(b.quirk==='steal' && G.motas>0){
      const st = Math.min(G.motas, Math.max(3, Math.round(G.motas*0.06)));
      G.motas -= st; b.stolen += st;
      UI.floats.push({x:46, y:108, s:'-'+st+'✦', col:'#ffd94a', life:900, vy:-0.03});
    }
  }
}
function teleDur(b){ return (b.bigAtk ? 950 : 620) + (b.quirk==='armor' ? 160 : 0); }
function toEnemyTurn(b){
  b.resolved = false;
  b.phase = 'eTele'; b.t = 0; b.blocked = false;
  b.bigAtk = b.quirk==='charge' && (++b.eCharge % 3 === 0);
  b.willDouble = b.quirk==='double' && Math.random()<0.35;
  SFX.telegraph(b.bigAtk);
}

function battleTap(){
  const b = UI.bt;
  if(b.phase==='intro'){ b.t = 9999; return; }
  if(b.phase==='timing'){
    const p = AP();
    if(b.super >= b.superMax){
      b.super = 0;
      const atk = (4 + p.str*1.3 + p.level*1.2 + [0,0,2,5][p.stage]) * (p.trait==='VALIENTE'?1.25:1) * (G.relics.pluma?1.10:1);
      b.dmg = Math.max(2, Math.round(atk*2.2*b.mult));
      b.crit = true;
      b.phase = 'superAnim'; b.t = 0; b.resolved = false; b.boulderDone = false;
      SFX.superCharge(); vibrate([30,30,80]);
      return;
    }
    const dist = Math.abs(b.mk-0.5)*2;
    const mult = 0.6 + 1.7*(1-dist);
    const atk = (4 + p.str*1.3 + p.level*1.2 + [0,0,2,5][p.stage]) * (p.trait==='VALIENTE'?1.25:1) * (G.relics.pluma?1.10:1);
    b.dmg = Math.max(1, Math.round(atk*mult*b.mult));
    b.crit = dist<0.18;
    b.phase='panim'; b.t=0; b.resolved=false;
    /* polvo al arrancar */
    for(let i=0;i<3;i++) b.fx.push({x:40-i*3, y:148+Math.random()*4, vx:-0.01-Math.random()*0.01, vy:-0.01, g:0.00005, life:350, col:'rgba(200,200,190,0.7)', size:2});
    if(b.crit){ SFX.yay(); vibrate([30,30,60]); } else { SFX.tap(); vibrate(20); }
  } else if(b.phase==='eTele' || b.phase==='eanim'){
    /* bloqueo: arma el escudo justo antes del impacto */
    const dur = teleDur(b);
    const canArm = (b.phase==='eanim' && b.t<320) || (b.phase==='eTele' && b.t > dur-180);
    if(!b.blocked && canArm){ b.blocked = true; SFX.tap(); vibrate(15); }
  } else if(b.phase==='end' && b.t>800){
    G.wild = null;
    nextWildAt = Date.now() + 120000 + Math.random()*180000;
    UI.mode='main';
    saveGame();
  }
}

function battleStep(dt){
  const b = UI.bt; if(!b) return;
  /* hit-stop: el mundo se congela un instante en el impacto */
  if(b.stop>0){ b.stop -= dt; return; }
  b.t += dt;
  if(b.zoomT>0) b.zoomT -= dt;
  b.ehpShow += (b.ehp - b.ehpShow) * Math.min(1, dt*0.012);
  b.phpShow += (b.php - b.phpShow) * Math.min(1, dt*0.012);
  /* partículas propias del combate */
  for(let i=b.fx.length-1;i>=0;i--){
    const f = b.fx[i];
    f.x += f.vx*dt; f.y += f.vy*dt; f.vy += (f.g||0)*dt; f.life -= dt;
    if(f.life<=0) b.fx.splice(i,1);
  }
  if(b.phase==='intro'){
    if(b.t>1150){ b.phase='timing'; b.t=0; b.mk=Math.random(); }
  } else if(b.phase==='timing'){
    b.mk += b.mdir * dt/(650*(1 + Math.min(0.35, (AP().spd||0)*0.015)) * (b.quirk==='spore' ? 0.78 : 1));
    if(b.mk>1){ b.mk=1; b.mdir=-1; }
    if(b.mk<0){ b.mk=0; b.mdir=1; }
  } else if(b.phase==='panim'){
    if(b.t>300 && !b.resolved){ b.resolved = true; applyHitToEnemy(b, false); }
    if(b.t>600){
      if(b.ehp<=0){ endBattle(true); return; }
      toEnemyTurn(b);
    }
  } else if(b.phase==='superAnim'){
    spawnSuperFx(b);
    if(b.t>900 && !b.resolved){ b.resolved = true; applyHitToEnemy(b, true); }
    if(b.t>1350){
      if(b.ehp<=0){ endBattle(true); return; }
      toEnemyTurn(b);
    }
  } else if(b.phase==='eTele'){
    if(b.t>teleDur(b)){ b.phase='eanim'; b.t=0; }
  } else if(b.phase==='eanim'){
    if(b.t>300 && !b.resolved){ b.resolved = true; resolveEnemyHit(b); }
    if(b.t>440 && b.willDouble && !b.resolved2){
      b.resolved2 = true;
      const saved = b.eatk; b.eatk *= 0.55;
      resolveEnemyHit(b);
      b.eatk = saved;
    }
    if(b.t>640){
      if(b.php<=0){ endBattle(false); return; }
      b.resolved = false; b.resolved2 = false;
      /* la quemadura arde al empezar tu turno */
      if(b.burnT>0){
        b.burnT--;
        const bd = Math.max(1, Math.round(1 + b.nv*0.08));
        b.php = Math.max(0, b.php - bd);
        b.phurtT = performance.now();
        UI.floats.push({x:46, y:96, s:'QUEMA -'+bd, col:'#f8a04b', life:900, vy:-0.03});
        if(b.php<=0){ endBattle(false); return; }
      }
      b.phase='timing'; b.t=0; b.mk=Math.random();
    }
  }
}

/* efectos del SUPER, con el estilo de cada línea */
function spawnSuperFx(b){
  const S = superOf(AP());
  const t = b.t;
  if(t>850) return;
  if(S.style==='stream'){
    b.fx.push({x:52, y:124+Math.random()*10-5, vx:0.09+Math.random()*0.04, vy:(Math.random()-0.5)*0.01, life:700, col:Math.random()<0.5?S.col:S.col2, size:2});
  } else if(S.style==='wave'){
    for(let i=0;i<2;i++) b.fx.push({x:40+t*0.075, y:108+Math.random()*34, vx:0.05, vy:0, life:300, col:Math.random()<0.6?S.col:S.col2, size:2});
  } else if(S.style==='rain'){
    b.fx.push({x:92+Math.random()*44, y:20, vx:0, vy:0.11+Math.random()*0.05, life:1000, col:Math.random()<0.6?S.col:S.col2, size:2});
  } else if(S.style==='boulder'){
    if(!b.boulderDone && t>150){
      b.boulderDone = true;
      b.fx.push({x:50, y:120, vx:0.075, vy:-0.11, g:0.00035, life:900, col:S.col, size:7});
      b.fx.push({x:52, y:122, vx:0.075, vy:-0.11, g:0.00035, life:900, col:S.col2, size:5});
    }
  } else if(S.style==='spiral'){
    const a = t*0.02;
    b.fx.push({x:52+t*0.068, y:122+Math.sin(a)*14, vx:0.02, vy:0, life:500, col:Math.random()<0.6?S.col:S.col2, size:2});
  } else { /* rise: sombras desde el suelo */
    b.fx.push({x:100+Math.random()*26, y:150, vx:0, vy:-0.07-Math.random()*0.04, life:600, col:Math.random()<0.6?S.col:S.col2, size:2});
  }
}

function endBattle(win){
  const b = UI.bt; const p = AP();
  b.phase='end'; b.t=0; b.win=win;
  if(win){
    b.dieT = performance.now();
    battleBurst(112, 130, '#ffffff', 16);
    const pp = playerPower(p);
    let reward = Math.round((12 + b.nv*4) * (b.elite?2:1) * (b.boss?3:1));
    if(b.nv>pp) reward = Math.round(reward * (1 + 0.12*Math.min(6, b.nv-pp)));
    if(b.stolen){ b.recovered = b.stolen*2; reward += b.recovered; }
    b.reward = reward;
    gainMotas(reward);
    gainXP(10 + b.nv);
    G.beast[b.kind].wins++;
    if(b.elite && !b.boss && Math.random()<0.3){
      const rl = relicRoll();
      if(rl){ G.relics[rl.id]=true; b.relicName = rl.name; }
    }
    p.str = Math.min(99, p.str+1);
    p.happy = Math.min(100, p.happy+10);
    G.battlesWon++;
    questProg('combate', 1);
    if(b.boss){
      G.bossesWon = (G.bossesWon||0)+1;
      G.bossDue = false;
      const rl = relicRoll();
      if(rl){ G.relics[rl.id]=true; b.relicName = rl.name; }
      else { gainMotas(500); b.relicName = '+500✦'; }
    } else if(G.battlesWon % 10 === 0){
      G.bossDue = true;
      toast('ALGO GRANDE SE ACERCA...', 3000);
    }
    G.boostUntil = Date.now() + (G.relics.ojo?20:10)*60*1000;
    SFX.evolve();
  } else {
    p.happy = Math.max(0, p.happy-15);
    SFX.bye();
  }
}
