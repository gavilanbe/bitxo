"use strict";
/* =========================================================
   BITXO — game/battle: combate v3
   Puesta en escena en diagonal (rival arriba-derecha, tu bitxo
   abajo-izquierda), golpe con timing y combo, defensa con ARO que
   se cierra (bloqueo / PARADA / esquiva), medidor de SUPER con
   cinemática por línea, hitstop real, K.O. a cámara lenta,
   huida con coste, derrota con coste visible y botín que se revela.
   El dibujo vive en render/battle.js.
   ========================================================= */
const SUPERS = {
  pradera:{name:'TORMENTA DE HOJAS', col:'#7ac74f', col2:'#c8f0a8', style:'spiral'},
  brasa:  {name:'LLAMARADA',         col:'#e8574c', col2:'#ffd94a', style:'stream'},
  marea:  {name:'OLA GIGANTE',       col:'#4a90d8', col2:'#9adcf0', style:'wave'},
  petrea: {name:'ROCA VIVA',         col:'#8a8a94', col2:'#6a6a78', style:'boulder'},
  astro:  {name:'LLUVIA ESTELAR',    col:'#ffd94a', col2:'#8a6ae8', style:'rain'},
  voltio: {name:'TORMENTA ELECTRICA',col:'#ffd94a', col2:'#5ec8d8', style:'bolt'},
  fungo:  {name:'NUBE DE ESPORAS',   col:'#c9743a', col2:'#f2e8da', style:'spore'},
  grimo:  {name:'ZARPA SOMBRIA',     col:'#9d7bd8', col2:'#4a3a9a', style:'rise'}
};
function superOf(p){
  if(!p) return SUPERS.pradera;
  return SUPERS[p.form==='grimo' ? 'grimo' : p.line] || SUPERS.pradera;
}

/* geometría y tiempos del combate (ms) */
const BTG = {
  PX:44, PY:170,          /* pies de tu bitxo */
  EX:114, EY:94,          /* pies del rival */
  PIMP:300, PEND:600,     /* tu golpe: impacto / fin */
  SIMP:900, SEND:1350,    /* súper: impacto / fin */
  IMP:150, EEND:560,      /* embestida rival: impacto / fin */
  PARRY:190, BLOCK:430,   /* ventanas (ms antes del impacto) */
  DODGE:320, IDLE:1500
};

/* ------- sonidos propios del combate ------- */
SFX.btWhoosh = function(){ nz(sfxAt(0), 0.12, 0.035, 900, 0.8, 3200); };
SFX.btCombo = function(n){
  const base = [659, 784, 988, 1175][Math.min(3, n)] || 1175;
  tone({f:base, d:0.07, type:'p25', vol:0.045});
  tone({f:base*1.5, at:sfxAt(0.06), d:0.12, type:'p125', vol:0.04, send:0.35});
};
SFX.btParry = function(){
  nz(sfxAt(0), 0.05, 0.08, 5200, 3);
  tone({f:1568, d:0.05, type:'square', vol:0.04});
  tone({f:2093, at:sfxAt(0.04), d:0.3, type:'p125', vol:0.045, send:0.55});
  kick(sfxAt(0), 0.07);
};
SFX.btDodge = function(){
  nz(sfxAt(0), 0.1, 0.03, 2400, 1, 600);
  tone({f:880, slide:1320, d:0.08, type:'p125', vol:0.03});
};
SFX.btKO = function(){
  kick(sfxAt(0), 0.14);
  nz(sfxAt(0), 0.6, 0.07, 1400, 0.7, 180);
  tone({f:330, slide:55, d:0.55, type:'sawtooth', vol:0.05});
};
SFX.btVictory = function(){
  [[523,0,0.09],[659,0.09,0.09],[784,0.18,0.09],[1047,0.27,0.3],[988,0.6,0.08],[1047,0.7,0.45]]
    .forEach(n=>{ tone({f:n[0], at:sfxAt(n[1]), d:n[2]+0.05, type:'p25', vol:0.05, send:0.3});
                  tone({f:n[0]/2, at:sfxAt(n[1]), d:n[2]+0.05, type:'triangle', vol:0.05}); });
  kick(sfxAt(0.27), 0.07); kick(sfxAt(0.7), 0.07);
};
SFX.btLose = function(){
  [[392,0,0.22],[349,0.24,0.22],[311,0.48,0.5]].forEach(n=>
    tone({f:n[0], at:sfxAt(n[1]), d:n[2], type:'triangle', vol:0.05, send:0.25}));
};
SFX.btFlee = function(){
  [0,0.06,0.12].forEach((o,i)=> tone({f:700-i*120, at:sfxAt(o), d:0.05, type:'p125', vol:0.03}));
  nz(sfxAt(0), 0.25, 0.025, 1800, 1, 400);
};
SFX.btArm = function(){ tone({f:440, d:0.06, type:'square', vol:0.03}); };

/* campos nuevos del combate v3 (el duelo de actions.js crea su UI.bt sin ellos) */
function btEnsure(b){
  if(b._v3) return b;
  b._v3 = true;
  b.clock = b.clock||0;
  b.fx = b.fx||[]; b.stamps = []; b.amb = []; b.ambAcc = 0;
  b.st = {str:0, def:0, spd:0};
  b.eHitAt = -9999; b.pHitAt = -9999; b.dodgeAt = -9999; b.blockAt = -9999;
  b.evadeAt = -9999; b.comboAt = -9999; b.fleeArm = -9999; b.lockAt = -9999;
  b.healAt = -9999; b.superAcc = 0; b.eKb = 0; b.pKb = 0;
  b.ko = false; b.hits = 0; b.misses = 0; b.guards = 0; b.hurts = 0;
  return b;
}
function btStamp(s, x, y, col, sc){
  const b = UI.bt; if(!b) return;
  btEnsure(b);
  /* un sello nuevo desplaza al anterior en la misma zona */
  for(let i=b.stamps.length-1;i>=0;i--) if(Math.abs(b.stamps[i].y-y)<12 && Math.abs(b.stamps[i].x-x)<40) b.stamps.splice(i,1);
  b.stamps.push({s, x, y, col, sc:sc||2, at:b.clock});
}
/* partículas del combate (espacio de escena: siguen a la cámara y se congelan en el hitstop) */
function btFx(o){
  const b = UI.bt; if(!b) return;
  if(b.fx.length>260) b.fx.shift();
  o.life0 = o.life = o.life||500;
  o.vx = o.vx||0; o.vy = o.vy||0; o.g = o.g||0; o.size = o.size||1;
  b.fx.push(o);
}
function btBurst(x, y, n, cols, speed, o){
  o = o||{};
  for(let i=0;i<n;i++){
    const a = o.angle!==undefined ? o.angle + (Math.random()-0.5)*(o.spread||1) : Math.random()*Math.PI*2;
    const sp = (speed||0.1)*(0.4+Math.random()*0.8);
    btFx({x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-(o.up||0), g:o.g===undefined?0.0003:o.g, drag:o.drag===undefined?0.004:o.drag,
          life:(o.life||420)*(0.7+Math.random()*0.6), col:cols[i%cols.length], size:o.size||(Math.random()<0.3?2:1),
          kind:o.kind||'px', floor:o.floor});
  }
}
/* compat: el combate v2 llamaba a battleBurst */
function battleBurst(x, y, col, n){ btBurst(x, y, n, [col], 0.08); }

function btEScale(b){ return b.boss ? 3 : 2; }
function btESpr(b){ return b.fspr || ESPR[b.kind]; }
function btECenter(b){ const s = btESpr(b); return {x:BTG.EX, y:BTG.EY - Math.round(s.height*btEScale(b)/2)}; }
function btPCenter(){ return {x:BTG.PX, y:BTG.PY - 16}; }

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
    /* +20% de vida: el combo multiplica tu ritmo de daño */
    ehp: Math.round((12 + nv*3.4) * 1.2 * (E.hpM||1) * (elite?1.45:1) * (G.wild.boss?2.3:1)),
    eatk: (2.2 + nv*0.85) * (E.atkM||1) * (elite?1.2:1) * (G.wild.boss?1.35:1),
    php: Math.round(24 + p.level*2.5 + p.weight*0.4),
    phase:'intro', t:0, mk:Math.random(), mdir:1,
    dmg:0, crit:false, resolved:false,
    shake:0, stop:0, zoomT:0,
    super:0, superMax:4,
    eCharge:0, bigAtk:false, blocked:false, blockFxT:0,
    bubble: E.quirk==='bubble', burnT:0, stolen:0, willDouble:false,
    combo:0, comboIdle:0, lastGood:false, miss:false,
    rage:false, rageNow:false, parry:false, parryFxT:0, dodge:false,
    ehurtT:0, phurtT:0, dieT:0, fx:[], turnMsg:'',
    revenge: !!G.wild.revenge, tower: !!G.wild.tower
  };
  if(G.wild.boss){ UI.bt.boss = true; }
  UI.bt.emx = UI.bt.ehp; UI.bt.pmx = UI.bt.php;
  G.beast = G.beast || {};
  G.beast[G.wild.kind] = G.beast[G.wild.kind] || {seen:0, wins:0};
  G.beast[G.wild.kind].seen++;
  UI.bt.ehpShow = UI.bt.ehp; UI.bt.phpShow = UI.bt.php;
  btEnsure(UI.bt);
  p.energy = Math.max(0, p.energy-12);
  UI.mode='battle';
  SFX.train(); vibrate(40);
}

/* daño base de tu bitxo */
function btAtk(p){
  return (4 + p.str*1.3 + p.level*1.2 + [0,0,2,5][p.stage]) * (p.trait==='VALIENTE'?1.25:1) * (G.relics.pluma?1.10:1);
}
/* color del número según la eficacia */
function btDmgCol(b){ return b.mult>1 ? '#a8f07a' : (b.mult<1 ? '#b8bccc' : '#ffffff'); }

/* ------- resolución de golpes ------- */
function applyHitToEnemy(b, isSuper){
  btEnsure(b);
  const p = AP();
  const c = btECenter(b);
  /* el sombrío se esfuma si no aciertas de lleno */
  if(b.quirk==='evade' && !b.crit && !isSuper &&
     Math.random() < Math.max(0.05, 0.22 - (p.spd||0)*0.008)){
    b.evadeAt = b.clock;
    popText(c.x, c.y-14, 'SE ESFUMA', '#b8a8e8');
    btBurst(c.x, c.y, 8, ['#4a3a6a','#8a6ae8'], 0.05, {g:-0.0001});
    SFX.btDodge();
    return;
  }
  if(b.quirk==='armor'){ b.dmg = Math.max(1, b.dmg-2); }
  if(b.bubble && !b.crit && !isSuper){
    b.dmg = Math.max(1, Math.ceil(b.dmg/2));
    popText(c.x+18, c.y-4, 'BURBUJA', '#9adcf0');
    btFx({x:c.x, y:c.y, kind:'ring', r1:20, col:'#9adcf0', life:260});
  } else if(b.bubble && (b.crit || isSuper)){
    b.bubble = false;
    btBurst(c.x, c.y, 18, ['#9adcf0','#ffffff','#4a90d8'], 0.13);
    btStamp('¡BURBUJA ROTA!', 80, 44, '#9adcf0', 1);
  }
  if(!isSuper && b.combo===2){ G.combos3 = (G.combos3||0)+1; questProg('combo', 1); }
  b.ehp = Math.max(0, b.ehp - b.dmg);
  b.hits++;
  if(b.crit && !isSuper) b.st.str++;
  b.ehurtT = performance.now();
  b.eHitAt = b.clock;
  const k = Math.min(1, b.dmg/Math.max(1, b.emx));
  b.eKb = isSuper ? 16 : (b.crit ? 10 : 6) + Math.round(k*8);
  if(b.crit) b.zoomT = 170;
  /* impacto: hitstop 40-90 ms según la fuerza, temblor por el daño */
  hitstop(isSuper ? 120 : Math.round(b.crit ? 85 : 40 + k*80));
  shake(Math.min(0.9, (isSuper ? 0.6 : (b.crit ? 0.38 : 0.2)) + k*0.9));
  const S = superOf(p);
  const cols = isSuper ? [S.col, S.col2, '#ffffff'] : (b.crit ? ['#ffd94a','#fff8d0','#ffffff'] : ['#ffffff','#fff8d0', btDmgCol(b)]);
  btBurst(c.x-6, c.y, isSuper ? 26 : (b.crit ? 18 : 10), cols, b.crit||isSuper ? 0.16 : 0.11, {kind:'spark', g:0.0002, angle:-0.35, spread:3.4});
  btBurst(c.x-6, c.y, 6, ['#ffffff'], 0.05, {kind:'star', g:0});
  btFx({x:c.x-6, y:c.y, kind:'ring', r1: b.crit||isSuper ? 26 : 16, col: b.crit||isSuper ? '#ffd94a' : '#ffffff', life:260});
  if(b.crit || isSuper) flash('#ffffff', isSuper ? 0.55 : 0.25, 120);
  /* número de daño: grande en crítico, color por eficacia */
  popText(c.x+4, c.y-18, '-'+b.dmg+(b.crit && !isSuper ? '!' : ''), b.crit||isSuper ? '#ffd94a' : btDmgCol(b), {big: b.crit || isSuper || b.dmg>=12, life:1000});
  if(b.crit && !isSuper) btStamp('¡CRITICO!', 110, 30, '#ffd94a', 2);
  if(b.hits===1 && b.mult!==1){
    if(b.mult>1) btStamp('¡VENTAJA!', 110, 46, '#a8f07a', 1);
    else btStamp('TE RESISTE...', 110, 46, '#b8bccc', 1);
  }
  if(isSuper) SFX.superHit(); else SFX.hit(b.crit);
  vibrate(b.crit||isSuper ? [20,20,50] : 25);
  if(!isSuper) b.super = Math.min(b.superMax, b.super + (b.crit?2:1));
  /* el pinchón devuelve pinchos si no fue crítico */
  if(b.quirk==='thorns' && !b.crit && !isSuper && b.ehp>0){
    const r = Math.max(1, Math.round(2 + G.battlesWon*0.15));
    b.php = Math.max(0, b.php - r);
    b.phurtT = performance.now(); b.pHitAt = b.clock; b.pKb = 3;
    popText(BTG.PX+40, BTG.PY-60, '-'+r+' PINCHOS', '#e2574c');
  }
  /* K.O.: cámara lenta, destello y sello */
  if(b.ehp<=0 && !b.ko){
    b.ko = true;
    hitstop(200);
    shake(1);
    flash('#ffffff', 0.7, 260);
    b.eKb = 22;
    btBurst(c.x, c.y, 30, ['#ffffff','#ffd94a','#f0a04b'], 0.2, {kind:'spark', g:0.00015});
    btStamp('¡K.O.!', 80, 112, '#ffd94a', 3);
    SFX.btKO();
    vibrate([40,40,120]);
  }
}
function resolveEnemyHit(b){
  btEnsure(b);
  const p = AP();
  const pc = btPCenter();
  /* esquiva armada con un deslizamiento: el golpe pasa de largo */
  if(b.dodge){
    b.dodge = false;
    b.st.spd += 2;
    btStamp('¡ESQUIVA!', 48, 118, '#5ec8d8', 2);
    btBurst(pc.x+10, pc.y, 8, ['#9adcf0','#ffffff'], 0.07, {g:0});
    SFX.btDodge();
    return;
  }
  if(Math.random() < Math.min(0.25, (p.spd||0)*0.012)){
    b.dodgeAt = b.clock;
    b.st.spd++;
    popText(pc.x, pc.y-26, '¡ESQUIVA!', '#5ec8d8');
    SFX.btDodge();
    return;
  }
  let raw = b.eatk * (0.7+Math.random()*0.6) * (b.bigAtk ? 1.9 : 1);
  if(b.blocked){
    raw *= b.parry ? (b.bigAtk ? 0.28 : 0.1) : (b.quirk==='fly' ? 0.62 : 0.4);
    b.blockFxT = performance.now(); b.blockAt = b.clock;
  }
  const dmg = Math.max(1, Math.round(raw - (p.def||0)*0.6));
  b.php = Math.max(0, b.php - dmg);
  b.phurtT = performance.now();
  b.pHitAt = b.clock;
  const k = Math.min(1, dmg/Math.max(1, b.pmx));
  b.pKb = b.parry ? 1 : (b.blocked ? 3 : 6 + Math.round(k*10));
  if(b.parry){
    /* la parada perfecta carga el súper y hace retroceder al rival */
    b.super = Math.min(b.superMax, b.super+1);
    G.parries = (G.parries||0)+1;
    questProg('parada', 1);
    b.st.def += 2; b.guards++;
    b.eHitAt = b.clock; b.eKb = 10;
    hitstop(95); shake(0.35);
    flash('#bff0ff', 0.35, 140);
    btBurst(pc.x+14, pc.y-2, 16, ['#ffffff','#bff0ff','#5ec8d8'], 0.15, {kind:'spark', angle:-0.4, spread:2.6, g:0.0001});
    btFx({x:pc.x+14, y:pc.y-2, kind:'ring', r1:24, col:'#ffffff', life:300});
    btStamp('¡PARADA!', 58, 116, '#ffffff', 2);
    popText(pc.x, pc.y-24, '-'+dmg, '#bff0ff');
    SFX.btParry(); vibrate([15,15,40]);
  } else if(b.blocked){
    b.st.def++; b.guards++;
    hitstop(55); shake(0.18 + k*0.5);
    btBurst(pc.x+14, pc.y-2, 8, ['#5ec8d8','#ffffff'], 0.09, {kind:'spark', angle:-0.4, spread:2.2});
    popText(pc.x, pc.y-24, '-'+dmg+' BLOQ', '#5ec8d8');
    SFX.block(); vibrate(20);
  } else {
    b.hurts++;
    hitstop(Math.round(50 + k*50)); shake(Math.min(0.85, 0.28 + k*1.2));
    flash('#e2574c', 0.18 + k*0.3, 140);
    btBurst(pc.x+4, pc.y, 12, ['#e2574c','#ffffff','#f0a04b'], 0.12, {kind:'spark', angle:Math.PI*0.85, spread:2});
    popText(pc.x, pc.y-24, '-'+dmg, '#ff7a6a', {big: k>0.18, life:1000});
    SFX.hurt(); vibrate(30);
    if(b.quirk==='burn' && Math.random()<0.4){
      b.burnT = 2;
      popText(pc.x, pc.y-8, '¡TE QUEMA!', '#f8a04b', {delay:180});
    }
    if(b.quirk==='paralyze' && Math.random()<0.3){
      b.paraT = 1;
      popText(pc.x, pc.y-8, '¡PARALIZADO!', '#f0c030', {delay:180});
    }
    if(b.quirk==='steal' && G.motas>0){
      const st = Math.min(G.motas, Math.max(3, Math.round(G.motas*0.06)));
      G.motas -= st; b.stolen += st;
      popText(pc.x+20, pc.y-40, '-'+st+'✦', '#ffd94a', {delay:260});
      btBurst(pc.x, pc.y-6, 6, ['#ffd94a','#fff8d0'], 0.08, {angle:-0.6, spread:0.8, g:0.0002});
    }
  }
}
/* furioso (le fallaste un combo): telegraph un 30% más corto */
function teleDur(b){ return Math.round(((b.bigAtk ? 950 : 620) + (b.quirk==='armor' ? 160 : 0)) * (b.rageNow ? 0.7 : 1)); }
/* ms que faltan para que el golpe rival conecte */
function btTTI(b){
  if(b.phase==='eTele') return teleDur(b) - b.t + BTG.IMP;
  if(b.phase==='eanim') return BTG.IMP - b.t;
  return 99999;
}
function toEnemyTurn(b){
  btEnsure(b);
  if(b.quirk==='regen' && b.ehp>0 && b.ehp<b.emx){
    const heal = 2 + Math.round(b.nv*0.06);
    b.ehp = Math.min(b.emx, b.ehp+heal);
    b.healAt = b.clock;
    const c = btECenter(b);
    popText(c.x, c.y-20, '+'+heal, '#7ac74f');
    btBurst(c.x, c.y+8, 8, ['#7ac74f','#c8f0a8'], 0.03, {g:-0.00012, drag:0.002, life:700});
  }
  b.resolved = false; b.resolved2 = false;
  b.phase = 'eTele'; b.t = 0; b.blocked = false; b.parry = false; b.dodge = false;
  b.rageNow = b.rage; b.rage = false;
  if(b.rageNow) btStamp('¡FURIA!', 114, 40, '#e2574c', 2);
  b.bigAtk = b.quirk==='charge' && (++b.eCharge % 3 === 0);
  if(b.bigAtk) btStamp('¡¡CARGA!!', 114, 40, '#e2574c', 2);
  b.willDouble = b.quirk==='double' && Math.random()<0.35;
  SFX.telegraph(b.bigAtk);
}

/* ------- acciones del jugador ------- */
function btAttack(b){
  const p = AP();
  const dist = Math.abs(b.mk-0.5)*2;
  const decay = [1, 0.7, 0.55][b.combo] || 0.55;
  const atk = btAtk(p);
  b.miss = dist > 0.6;
  b.lastGood = dist < 0.35;
  if(b.miss){
    /* golpe fallido: daño mínimo y el rival se enfurece */
    b.dmg = Math.max(1, Math.round(atk*0.4*decay*b.mult));
    b.crit = false;
    b.rage = true;
    b.misses++;
    const c = btECenter(b);
    popText(c.x, c.y-30, '¡CASI!', '#e2574c');
  } else {
    const mult = (0.6 + 1.7*(1-dist)) * decay;
    b.dmg = Math.max(1, Math.round(atk*mult*b.mult));
    b.crit = dist<0.18;
  }
  if(b.paraT){
    b.dmg = Math.max(1, Math.round(b.dmg*0.7)); b.paraT = 0;
    popText(BTG.PX, BTG.PY-40, 'LENTO...', '#f0c030');
  }
  b.phase='panim'; b.t=0; b.resolved=false;
  /* polvo al arrancar */
  btBurst(BTG.PX-6, BTG.PY, 5, ['rgba(230,220,190,0.8)'], 0.04, {angle:Math.PI, spread:1.2, g:0.00005, up:0.02});
  if(b.crit){ SFX.yay(); vibrate([30,30,60]); } else { SFX.tap(); vibrate(20); }
}
function btSuper(b){
  const p = AP();
  b.super = 0; b.combo = 0;
  b.dmg = Math.max(2, Math.round(btAtk(p)*2.2*b.mult));
  if(b.paraT){ b.dmg = Math.max(1, Math.round(b.dmg*0.7)); b.paraT = 0; }
  b.crit = true;
  b.phase = 'superAnim'; b.t = 0; b.resolved = false; b.boulderDone = false; b.superAcc = 0;
  SFX.superCharge(); vibrate([30,30,80]);
}
function btGuard(b){
  const now = performance.now();
  if(b.blocked) return;
  if(now - b.lockAt < 260) return;
  const tti = btTTI(b);
  if(tti <= BTG.BLOCK && tti >= -40){
    b.blocked = true;
    b.blockAt = b.clock;
    if(tti <= BTG.PARRY){ b.parry = true; b.parryFxT = now; }
    SFX.tap(); vibrate(15);
  } else if(tti > BTG.BLOCK){
    /* demasiado pronto: un respiro de bloqueo para que machacar no sirva */
    b.lockAt = now;
    popText(BTG.PX, BTG.PY-44, '¡PRONTO!', '#b8bccc', {life:500});
    SFX.nope();
  }
}
function btUseItem(slot){
  const b = UI.bt;
  const it = G.items[slot];
  const php0 = b.php, sup0 = b.super;
  useBattleItem(slot);
  UI.floats.length = 0; /* el texto lo ponemos aquí, más grande */
  const pc = btPCenter();
  if(b.php>php0){
    b.healAt = b.clock;
    popText(pc.x, pc.y-26, '+'+(b.php-php0), '#7ac74f', {big:true});
    btBurst(pc.x, pc.y+10, 14, ['#7ac74f','#c8f0a8','#ffffff'], 0.04, {g:-0.00015, drag:0.002, life:800});
    btFx({x:pc.x, y:pc.y, kind:'ring', r1:22, col:'#7ac74f', life:360});
  } else if(b.super>sup0 || it==='chispa'){
    popText(pc.x, pc.y-26, 'SUPER +2', '#ffd94a', {big:true});
    btBurst(pc.x, pc.y, 14, ['#ffd94a','#fff8d0'], 0.12, {kind:'star', g:0});
  }
}
function btFlee(){
  const b = UI.bt; if(!b || b.phase!=='timing') return;
  const now = performance.now();
  if(now - b.fleeArm > 1800){
    b.fleeArm = now;
    SFX.btArm(); vibrate(10);
    return;
  }
  b.fleeArm = -9999;
  SFX.btFlee(); vibrate(20);
  btBurst(BTG.PX, BTG.PY, 8, ['rgba(230,220,190,0.8)'], 0.06, {angle:Math.PI*0.1, spread:1, up:0.02});
  endBattle(false, true);
}
function btExit(b){
  if(b.friendly){ UI.mode='main'; saveGame(); return; }
  const wasTower = G.wild && G.wild.tower;
  G.wild = null;
  nextWildAt = Date.now() + 120000 + Math.random()*180000;
  if(wasTower && G.tower){
    if(b.win){ towerAdvance(b); }
    else {
      G.tower = null;
      G.towerNextAt = Date.now() + TOWER.cooldown;
      toast('LA TORRE TE ESCUPE... VUELVE MAS FUERTE', 3200);
      UI.mode='main';
    }
  } else {
    UI.mode='main';
  }
  saveGame();
}

function battleTap(x, y){
  const b = UI.bt; if(!b) return;
  btEnsure(b);
  if(b.phase==='intro'){ b.t = 9999; return; }
  if(b.phase==='timing'){
    if(x!==undefined && y!==undefined){
      /* mochila: los chips de la esquina usan un objeto sin gastar turno */
      if(y>=246 && x<58 && (G.items||[]).length){
        const slot = Math.floor((x-4)/18);
        if(slot>=0 && slot<G.items.length){ btUseItem(slot); return; }
      }
      if(y>=242 && x>=114){ btFlee(); return; }
    }
    /* con el medidor lleno ELIGES: panel de abajo = súper; el aro = seguir a golpes */
    if(b.super >= b.superMax && (y===undefined || y>196)){ btSuper(b); return; }
    btAttack(b);
  } else if(b.phase==='eTele' || b.phase==='eanim'){
    /* bloqueo: ARO que se cierra. Clavado al impacto = PARADA */
    btGuard(b);
  } else if(b.phase==='end' && b.t>800){
    btExit(b);
  }
}
/* teclado: espacio/enter = acción, S = súper, Esc = huir, flechas = esquivar, 1-3 = mochila */
function battleKey(k){
  const b = UI.bt; if(!b) return false;
  btEnsure(b);
  if(k===' ' || k==='Enter'){
    if(b.phase==='timing') battleTap(BTG.EX, 70);
    else battleTap();
    return true;
  }
  if(k==='s' || k==='S'){
    if(b.phase==='timing' && b.super>=b.superMax) btSuper(b);
    return true;
  }
  if(k==='Escape'){ if(b.phase==='timing') btFlee(); else if(b.phase==='end') battleTap(); return true; }
  if(k==='ArrowLeft' || k==='ArrowRight' || k==='ArrowUp' || k==='ArrowDown'){ battleSwipe(); return true; }
  if(k>='1' && k<='3' && b.phase==='timing'){
    const i = +k-1;
    if(i < (G.items||[]).length) btUseItem(i);
    return true;
  }
  return false;
}

function battleStep(dt){
  const b = UI.bt; if(!b) return;
  btEnsure(b);
  if(b.hold) dt = 0;           /* congelado (capturas de prueba) */
  if(b.stop>0){ b.stop -= dt; return; }
  /* K.O.: el último golpe va a cámara lenta */
  if(b.ko && (b.phase==='panim' || b.phase==='superAnim')) dt *= 0.4;
  b.t += dt; b.clock += dt;
  if(b.zoomT>0) b.zoomT -= dt;
  /* barra fantasma: aguanta un instante y luego se vacía */
  if(b.ehp>b.ehpShow) b.ehpShow = b.ehp;
  else if(b.clock - b.eHitAt > 380) b.ehpShow += (b.ehp - b.ehpShow) * Math.min(1, dt*0.008);
  if(b.php>b.phpShow) b.phpShow += (b.php - b.phpShow) * Math.min(1, dt*0.01);
  else if(b.clock - b.pHitAt > 380) b.phpShow += (b.php - b.phpShow) * Math.min(1, dt*0.008);
  /* partículas propias del combate */
  for(let i=b.fx.length-1;i>=0;i--){
    const f = b.fx[i];
    if(f.life0===undefined) f.life0 = f.life;
    if(f.drag){ const kk = Math.exp(-f.drag*dt); f.vx *= kk; f.vy *= kk; }
    f.vy += (f.g||0)*dt;
    f.x += (f.vx||0)*dt; f.y += (f.vy||0)*dt; f.life -= dt;
    if(f.floor!==undefined && f.y>f.floor){ f.y = f.floor; f.vy *= -0.3; f.vx *= 0.6; }
    if(f.life<=0) b.fx.splice(i,1);
  }
  for(let i=b.stamps.length-1;i>=0;i--) if(b.clock - b.stamps[i].at > 1000) b.stamps.splice(i,1);

  if(b.phase==='intro'){
    /* el rival se presenta con un saltito (y el jefe hace temblar la escena) */
    if(!b.cried && b.t>560 && b.t<2000){
      b.cried = true;
      SFX.telegraph(!!b.boss);
      if(b.boss){ shake(0.6); flash('#e2574c', 0.25, 200); }
    }
    if(b.t>1150){ b.phase='timing'; b.t=0; b.mk=Math.random(); }
  } else if(b.phase==='timing'){
    /* cada eslabón del combo hace el aro más rápido (ARO tranquilo: opción en DATOS) */
    b.mk += b.mdir * dt * (1 + b.combo*0.4) / (650*(1 + Math.min(0.35, (AP().spd||0)*0.015)) * (b.quirk==='spore' ? 0.78 : 1) * (G.slowRing ? 1.45 : 1));
    if(b.mk>1){ b.mk=1; b.mdir=-1; }
    if(b.mk<0){ b.mk=0; b.mdir=1; }
    if(b.combo>0){
      /* plantarse: dejar pasar el aro guarda el turno sin castigo */
      b.comboIdle += dt;
      if(b.comboIdle > BTG.IDLE){
        popText(BTG.PX, BTG.PY-44, 'TURNO GUARDADO', '#5ec8d8');
        toEnemyTurn(b);
      }
    }
  } else if(b.phase==='panim'){
    if(b.t>BTG.PIMP && !b.resolved){ b.resolved = true; applyHitToEnemy(b, false); }
    if(b.t>BTG.PEND){
      if(b.ehp<=0){ endBattle(true); return; }
      if(b.lastGood && !b.miss && b.combo<2){
        b.combo++; b.comboIdle = 0; b.comboAt = b.clock;
        b.phase='timing'; b.t=0; b.mk=Math.random();
        btStamp('COMBO X'+(b.combo+1), 116, 22, b.combo>1 ? '#f0a04b' : '#ffd94a', 2);
        SFX.btCombo(b.combo);
        return;
      }
      toEnemyTurn(b);
    }
  } else if(b.phase==='superAnim'){
    spawnSuperFx(b, dt);
    if(b.t>BTG.SIMP && !b.resolved){ b.resolved = true; applyHitToEnemy(b, true); }
    if(b.t>BTG.SEND){
      if(b.ehp<=0){ endBattle(true); return; }
      toEnemyTurn(b);
    }
  } else if(b.phase==='eTele'){
    if(b.t>teleDur(b)){ b.phase='eanim'; b.t=0; SFX.btWhoosh(); }
  } else if(b.phase==='eanim'){
    if(b.t>=BTG.IMP && !b.resolved){ b.resolved = true; resolveEnemyHit(b); }
    if(b.t>400 && b.willDouble && !b.resolved2 && !b.parry){
      b.resolved2 = true;
      const saved = b.eatk; b.eatk *= 0.55;
      resolveEnemyHit(b);
      b.eatk = saved;
    }
    if(b.t>BTG.EEND){
      if(b.php<=0){ endBattle(false); return; }
      b.resolved = false; b.resolved2 = false;
      b.combo = 0; b.comboIdle = 0;
      /* la quemadura arde al empezar tu turno */
      if(b.burnT>0){
        b.burnT--;
        const bd = Math.max(1, Math.round(1 + b.nv*0.08));
        b.php = Math.max(0, b.php - bd);
        b.phurtT = performance.now(); b.pHitAt = b.clock; b.pKb = 2;
        const pc = btPCenter();
        popText(pc.x, pc.y-26, 'QUEMA -'+bd, '#f8a04b');
        btBurst(pc.x, pc.y+6, 8, ['#f8a04b','#e8574c','#ffd94a'], 0.03, {g:-0.0002, drag:0.001, life:600});
        if(b.php<=0){ endBattle(false); return; }
      }
      b.phase='timing'; b.t=0; b.mk=Math.random();
    }
  } else if(b.phase==='end'){
    btEndStep(b, dt);
  }
}

/* efectos del SUPER, con el estilo de cada línea (a ritmo de dt, sin azar por frame) */
function spawnSuperFx(b, dt){
  btEnsure(b);
  if(dt===undefined) dt = 18;
  const S = superOf(AP());
  const t = b.t;
  if(t<380 || t>BTG.SIMP) { b.superAcc = 0; return; }
  const pc = btPCenter(), ec = btECenter(b);
  const pick = i => (i%3===0) ? S.col2 : S.col;
  b.superAcc += dt;
  const every = S.style==='bolt' ? 110 : (S.style==='boulder' ? 9999 : 14);
  if(S.style==='boulder' && !b.boulderDone && t>420){
    b.boulderDone = true;
    btFx({x:pc.x+6, y:pc.y-6, vx:0.13, vy:-0.2, g:0.00058, life:560, col:S.col, size:12, kind:'rock'});
  }
  let n = 0;
  while(b.superAcc >= every){
    b.superAcc -= every; n++;
    const i = (b.fx.length + n);
    const r = ((i*37)%100)/100, r2 = ((i*61)%100)/100;
    if(S.style==='stream'){
      /* chorro de fuego que se abre en abanico hacia el rival */
      const a = Math.atan2(ec.y-pc.y, ec.x-pc.x) + (r-0.5)*0.35;
      btFx({x:pc.x+8, y:pc.y-4, vx:Math.cos(a)*0.2, vy:Math.sin(a)*0.2, life:520, col:pick(i), size:r2<0.4?4:3, kind:'px', drag:0.002});
      if(r2<0.5) btFx({x:pc.x+8, y:pc.y-4, vx:Math.cos(a)*0.17, vy:Math.sin(a)*0.17-0.02, life:600, col:'#fff3c0', size:1, kind:'spark'});
    } else if(S.style==='wave'){
      const wx = 8 + (t-380)/(BTG.SIMP-380)*112;
      btFx({x:wx + r*10, y:BTG.PY-4 - r2*16, vx:0.06, vy:-0.1-r2*0.08, g:0.0005, life:420, col:pick(i), size:2});
      btFx({x:wx + r2*8, y:BTG.PY+4 - r*6, vx:0.05, vy:-0.04, g:0.0003, life:300, col:'#ffffff', size:1});
    } else if(S.style==='rain'){
      btFx({x:ec.x-30+r*70, y:-4, vx:-0.05, vy:0.24+r2*0.06, life:380, col:pick(i), size:2, kind:'star', floor:BTG.EY});
    } else if(S.style==='spiral'){
      const k = (t-380)/(BTG.SIMP-380);
      const a = t*0.03 + i;
      const cx = pc.x + (ec.x-pc.x)*k, cy = pc.y + (ec.y-pc.y)*k;
      btFx({x:cx+Math.cos(a)*14, y:cy+Math.sin(a)*10, vx:0.04, vy:-0.03, g:0.00005, life:460, col:pick(i), size:2, kind:'leaf'});
    } else if(S.style==='bolt'){
      btFx({x:ec.x-10+r*20, y:ec.y, life:130, col:pick(i), kind:'bolt', seed:i});
      btBurst(ec.x-10+r*20, BTG.EY-2, 4, ['#ffffff', S.col], 0.08, {kind:'spark', up:0.05});
      flash('#fff8c0', 0.18, 80);
    } else if(S.style==='spore'){
      const a = r*Math.PI*2;
      btFx({x:ec.x+Math.cos(a)*34, y:ec.y+Math.sin(a)*24, vx:-Math.cos(a)*0.06, vy:-Math.sin(a)*0.05, life:620, col:pick(i), size:r2<0.4?4:3, kind:'px', drag:0.001});
      if(n%3===0) btFx({x:ec.x, y:ec.y, kind:'ring', r1:18+r*16, col:S.col2, life:360});
    } else { /* rise: zarpas de sombra desde el suelo */
      btFx({x:ec.x-20+r*40, y:BTG.EY+2, vx:0, vy:-0.09-r2*0.06, life:520, col:pick(i), size:2, kind:'spark'});
    }
    if(n>6) break;
  }
}

/* esquiva: deslizar durante la ventana defensiva */
function battleSwipe(){
  const b = UI.bt; if(!b) return;
  btEnsure(b);
  if(b.phase!=='eTele' && b.phase!=='eanim') return;
  const tti = btTTI(b);
  const can = !b.resolved && tti <= BTG.DODGE && tti >= -20;
  if(can && !b.dodge && !b.blocked){
    b.dodge = true;
    b.dodgeAt = b.clock;
    SFX.btDodge(); vibrate(12);
    btBurst(BTG.PX+8, BTG.PY, 6, ['rgba(230,220,190,0.8)'], 0.07, {angle:0, spread:1, up:0.02});
  }
}

/* elige la estadística que ganó la pelea: parar = DEF, esquivar = VEL, críticos = FUE */
function btFightStat(b){
  const s = b.st || {str:0, def:0, spd:0};
  let best = 'str', v = s.str;
  if(s.def > v){ best = 'def'; v = s.def; }
  if(s.spd > v){ best = 'spd'; v = s.spd; }
  return best;
}
const BT_STAT_N = {str:'FUE', def:'DEF', spd:'VEL'};

function endBattle(win, fled){
  const b = UI.bt; const p = AP();
  btEnsure(b);
  b.phase='end'; b.t=0; b.win=win; b.fled=!!fled;
  b.loot = [];
  b.xp0 = p.xp; b.lv0 = p.level; b.xpGain = 0;
  if(b.friendly){
    /* duelo amistoso: nadie pierde de verdad */
    b.reward = 0;
    if(fled){ b.loot.push({s:'TABLAS: OTRO DIA SERA', col:'#e8e0c8'}); SFX.btFlee(); return; }
    if(win){ b.dieT = performance.now(); }
    const r = b.rival;
    G.bond = (G.bond||0) + 3;
    p.happy = Math.min(100, p.happy+10);
    if(r) r.happy = Math.min(100, r.happy+10);
    gainXP(8); b.xpGain = 8;
    b.loot.push({s:'AMISTAD +3', col:'#f2a2b8', icon:'heart'});
    b.loot.push({s:'+8 XP', col:'#5ec8d8', icon:'xp'});
    b.loot.push({s:'AMBOS MAS FELICES', col:'#e8e0c8'});
    SFX.btVictory();
    return;
  }
  const rev = !!b.revenge;
  if(win){
    b.dieT = performance.now();
    const pp = playerPower(p);
    let reward = Math.round((12 + b.nv*4) * (b.elite?2:1) * (b.boss?3:1));
    if(b.nv>pp) reward = Math.round(reward * (1 + 0.12*Math.min(6, b.nv-pp)));
    /* revancha del bestiario: botín reducido, sin jefe ni reliquias (no se farmea) */
    if(rev) reward = Math.max(3, Math.round(reward*0.35));
    if(b.stolen){ b.recovered = b.stolen*2; reward += b.recovered; }
    b.reward = reward;
    gainMotas(reward);
    const xp = rev ? Math.round((10 + b.nv)*0.5) : 10 + b.nv;
    gainXP(xp); b.xpGain = xp;
    if(G.beast[b.kind]) G.beast[b.kind].wins++;
    b.loot.push({s:'+'+fmt(reward)+'✦', col:'#ffd94a', icon:'mota', n:reward});
    b.loot.push({s:'+'+xp+' XP', col:'#5ec8d8', icon:'xp'});
    if(b.recovered) b.loot.push({s:'RECUPERAS '+b.stolen+'✦ X2', col:'#ffd94a'});
    p.happy = Math.min(100, p.happy + (rev ? 5 : 10));
    if(!rev){
      if(b.elite && !b.boss && Math.random()<0.3){
        const rl = relicRoll();
        if(rl){ G.relics[rl.id]=true; b.relicName = rl.name; }
      }
      /* +1 a la estadística con la que ganaste (antes siempre FUE) */
      const stat = btFightStat(b);
      p[stat] = Math.min(99, (p[stat]||0)+1);
      b.statGain = stat;
      b.loot.push({s:'+1 '+BT_STAT_N[stat], col:'#7ac74f', icon:'stat'});
      G.battlesWon++;
      questProg('combate', 1);
      weeklyProg('combates', 1);
      if(b.elite) weeklyProg('elites', 1);
      if(b.elite && !G.diary.some(e=>e.txt.includes('PRIMER ELITE'))) diaryLog(petName(p)+' VENCIO A SU PRIMER ELITE');
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
      /* el botín x1.5 nunca recorta un impulso más largo ya comprado */
      const mins = G.relics.ojo ? 20 : 10;
      G.boostUntil = Math.max(G.boostUntil||0, Date.now() + mins*60*1000);
      b.loot.push({s:'BOTIN X1.5 · '+mins+' MIN', col:'#7ac74f'});
      if(b.relicName) b.loot.push({s:'RELIQUIA: '+b.relicName, col:'#ffd94a', icon:'relic'});
    } else {
      b.loot.push({s:'REVANCHA: BOTIN MENOR', col:'rgba(232,224,200,0.6)'});
    }
    SFX.btVictory();
    vibrate([30,40,30,40,90]);
  } else {
    /* perder (o huir) tiene un coste visible, menor que ignorar al salvaje (5%) */
    let lost = 0;
    if(!b.tower && !rev && G.motas>0){
      const pct = fled ? 0.02 : 0.03;
      lost = Math.min(G.motas, Math.max(fled ? 2 : 3, Math.round(G.motas*pct)));
      G.motas -= lost;
    }
    b.lost = lost;
    p.happy = Math.max(0, p.happy - (fled ? 3 : 8));
    if(lost) b.loot.push({s:b.name.slice(0,11)+' SE LLEVA '+fmt(lost)+'✦', col:'#ffd94a'});
    if(b.stolen) b.loot.push({s:'Y YA TE HABIA ROBADO '+b.stolen+'✦', col:'#f0a04b'});
    if(b.tower) b.loot.push({s:'FIN DE LA TORRE', col:'#e2574c'});
    b.loot.push({s:'ANIMO -'+(fled?3:8), col:'#b8bccc'});
    if(fled) SFX.btFlee(); else { SFX.btLose(); vibrate([60,80,60]); }
  }
  b.xp1 = p.xp; b.lv1 = p.level;
}
/* resultado: los premios se revelan uno a uno con motas volando */
function btEndStep(b, dt){
  if(b.win && !b.confetti && b.t>430){ b.confetti = true; confetti(80, 30, b.friendly ? 18 : 34); }
  const reveal = Math.floor((b.t-700)/260);
  b.lootShown = b.lootShown||0;
  while(b.loot && b.lootShown < b.loot.length && b.lootShown <= reveal){
    const L = b.loot[b.lootShown];
    if(L.icon==='mota'){
      tone({f:1320, d:0.06, type:'p125', vol:0.035});
      for(let i=0;i<Math.min(12, 3+Math.floor((L.n||0)/15));i++){
        const a = -Math.PI/2 + (i/6-1)*0.9;
        btFx({x:80, y:60, vx:Math.cos(a)*0.09, vy:Math.sin(a)*0.09, g:0.0004, drag:0.001, life:900+i*30, col:i%2?'#ffd94a':'#fff8d0', size:2, kind:'mota', li:b.lootShown});
      }
    } else if(L.icon==='stat'){
      tone({f:988, d:0.1, type:'p25', vol:0.04}); tone({f:1319, at:sfxAt(0.08), d:0.16, type:'p25', vol:0.04});
    } else if(L.icon==='relic'){
      SFX.yay(); flash('#ffd94a', 0.3, 200);
    } else {
      tone({f:880 + b.lootShown*110, d:0.05, type:'p125', vol:0.03});
    }
    b.lootShown++;
  }
}
