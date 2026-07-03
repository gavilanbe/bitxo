"use strict";
/* =========================================================
   BITXO — game/battle: combate contra bichos salvajes y jefes
   ========================================================= */
/* ---------------- COMBATE ---------------- */
function startBattle(){
  const p = AP();
  if(p.exped){ toast('ESTA DE EXPEDICION'); SFX.nope(); return; }
  if(p.stage<STAGES.CHILD){ toast('MUY PEQUENO PARA LUCHAR'); SFX.nope(); return; }
  if(p.sleeping){ toast('SHHH... DUERME'); return; }
  if(p.energy<12){ toast('SIN ENERGIA'); SFX.nope(); return; }
  const E = ENEMIES[G.wild.kind];
  const scale = G.battlesWon;
  UI.bt = {
    kind:G.wild.kind, name:E.name,
    ehp: Math.round(18 + scale*2 + p.level*1.5), 
    eatk: E.base + scale*1.1 + p.level*0.7,
    php: Math.round(24 + p.level*2.5 + p.weight*0.4),
    phase:'timing', t:0, mk:Math.random(), mdir:1, dmg:0, shake:0, turnMsg:''
  };
  if(G.wild.boss){ UI.bt.boss = true; UI.bt.ehp = Math.round(UI.bt.ehp*2.5); UI.bt.eatk *= 1.8; }
  UI.bt.emx = UI.bt.ehp; UI.bt.pmx = UI.bt.php;
  p.energy = Math.max(0, p.energy-12);
  UI.mode='battle';
  SFX.train(); vibrate(40);
}
function battleTap(){
  const b = UI.bt;
  if(b.phase==='timing'){
    const p = AP();
    const dist = Math.abs(b.mk-0.5)*2;
    const mult = 0.6 + 1.7*(1-dist);
    const atk = (4 + p.discipline*1.3 + p.level*1.2 + [0,0,2,5][p.stage]) * (p.trait==='VALIENTE'?1.25:1) * (G.relics.pluma?1.10:1);
    b.dmg = Math.max(1, Math.round(atk*mult));
    b.crit = dist<0.18;
    b.phase='panim'; b.t=0;
    if(b.crit){ SFX.yay(); vibrate([30,30,60]); } else { SFX.tap(); vibrate(20); }
  } else if(b.phase==='end' && b.t>800){
    G.wild = null;
    nextWildAt = Date.now() + 120000 + Math.random()*180000;
    UI.mode='main';
    saveGame();
  }
}
function battleStep(dt){
  const b = UI.bt; if(!b) return;
  b.t += dt;
  if(b.phase==='timing'){
    b.mk += b.mdir * dt/650;
    if(b.mk>1){ b.mk=1; b.mdir=-1; }
    if(b.mk<0){ b.mk=0; b.mdir=1; }
  } else if(b.phase==='panim'){
    if(b.t>450){
      b.ehp = Math.max(0, b.ehp - b.dmg);
      UI.floats.push({x:112, y:96, s:'-'+b.dmg+(b.crit?'!':''), col:b.crit?'#ffd94a':'#ffffff', life:800, vy:-0.03});
      if(b.ehp<=0){ endBattle(true); return; }
      b.phase='eanim'; b.t=0;
      SFX.hit(b.crit);
    }
  } else if(b.phase==='eanim'){
    if(b.t>450){
      const p = AP();
      const dmg = Math.max(1, Math.round(b.eatk * (0.7+Math.random()*0.6)));
      b.php = Math.max(0, b.php - dmg);
      b.shake = performance.now();
      UI.floats.push({x:46, y:96, s:'-'+dmg, col:'#e2574c', life:800, vy:-0.03});
      SFX.hurt(); vibrate(30);
      if(b.php<=0){ endBattle(false); return; }
      b.phase='timing'; b.t=0; b.mk=Math.random(); 
    }
  }
}
function endBattle(win){
  const b = UI.bt; const p = AP();
  b.phase='end'; b.t=0; b.win=win;
  if(win){
    let reward = 15 + G.battlesWon*6;
    if(b.boss) reward *= 3;
    b.reward = reward;
    gainMotas(reward);
    gainXP(15);
    p.discipline = Math.min(99, p.discipline+1);
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
