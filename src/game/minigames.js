"use strict";
/* =========================================================
   BITXO — game/minigames: lógica de los 8 minijuegos de la sala
   Marco común (cuenta atrás, reloj con tensión, combos, salir,
   panel final con estrellas y récord) + reglas de cada juego.
   Todo el tiempo de juego es dt (m.t), nunca performance.now():
   volver de una pestaña en segundo plano no rompe nada.
   ========================================================= */

/* ---------------- SONIDOS PROPIOS ---------------- */
SFX.mgCount = function(i){ tone({f:[523,587,659][i]||523, d:0.13, type:'square', vol:0.05}); tone({f:([523,587,659][i]||523)/2, d:0.1, type:'triangle', vol:0.05}); };
SFX.mgGo = function(){ tone({f:1047, slide:1568, d:0.22, type:'p25', vol:0.06, send:0.2}); tone({f:523, d:0.25, type:'triangle', vol:0.06}); nz(undefined, 0.2, 0.03, 3000, 1, 9000); };
SFX.mgTick = function(s){ tone({f:s<=2?1976:1568, d:0.05, type:'p125', vol:s<=2?0.05:0.035}); };
SFX.mgWhistle = function(){ tone({f:1568, d:0.16, type:'square', vol:0.045, vib:1}); tone({f:1568, d:0.34, type:'square', vol:0.045, vib:1, at:sfxAt(0.2)}); };
SFX.mgStar = function(i){ const f = NOTE(784, [0,4,7][i]||0); tone({f, d:0.18, type:'p25', vol:0.05, send:0.25}); tone({f:f*2, d:0.12, type:'triangle', vol:0.03, at:sfxAt(0.05)}); };
SFX.mgRecord = function(){
  [0,4,7,12].forEach((s,i)=>tone({f:NOTE(523.25,s), d:0.14, type:'p25', vol:0.055, at:sfxAt(i*0.09), send:0.2}));
  [12,16,19].forEach(s=>tone({f:NOTE(523.25,s), d:0.55, type:'square', vol:0.03, at:sfxAt(0.38), vib:1}));
  kick(sfxAt(0.38), 0.1);
};
SFX.mgCountUp = function(){ tone({f:2000+Math.random()*300, d:0.025, type:'p125', vol:0.02}); };
SFX.mgPop = function(){ nz(undefined, 0.18, 0.12, 2500, 0.8, 300); tone({f:600, slide:90, d:0.18, type:'square', vol:0.05}); };
SFX.mgSplash = function(big){ nz(undefined, big?0.4:0.22, big?0.09:0.05, 1400, 0.7, 300); };
SFX.mgWhoosh = function(){ nz(undefined, 0.18, 0.04, 600, 1, 3000); };
SFX.mgBonk = function(gold){ kick(undefined, 0.11); tone({f:gold?880:330, slide:gold?1760:140, d:0.1, type:'square', vol:0.05}); };
SFX.mgBuzz = function(){ tone({f:120, d:0.22, type:'sawtooth', vol:0.05}); tone({f:127, d:0.22, type:'sawtooth', vol:0.04}); };
SFX.mgMiss = function(){ tone({f:330, slide:200, d:0.12, type:'triangle', vol:0.04}); };
SFX.mgSnap = function(){ nz(undefined, 0.08, 0.12, 5000, 2); tone({f:900, slide:120, d:0.2, type:'square', vol:0.04}); };
/* tono de combo: sube por la escala mayor, dos octavas */
const MG_SCALE = [0,2,4,5,7,9,11,12,14,16,17,19,21,23,24];
function comboTone(c, vol){
  const s = MG_SCALE[Math.max(0, Math.min(MG_SCALE.length-1, c-1))];
  tone({f:NOTE(523.25, s), d:0.09, type:'p25', vol:vol||0.045});
  if(c>=10) tone({f:NOTE(1046.5, s), d:0.06, type:'triangle', vol:0.025, at:sfxAt(0.03)});
}

/* ---------------- MARCO COMÚN ---------------- */
const MG_PRE = 450;   /* tarjeta de título antes del 3 (el iris la tapa a medias) */
const MG_TITLES = {mgCatch:'LLUVIA DE MOTAS', mgDance:'BAILE', mgSimon:'SIMON', mgJump:'SALTA', mgTopo:'TOPO', mgPesca:'PESCA', mgMemo:'MEMORIA', mgGlobo:'GLOBO'};
const MG_RULES = {
  mgCatch:['ATRAPA LAS MOTAS','¡NI UNA CACA!'],
  mgDance:['TOCA CUANDO LA NOTA','LLEGUE AL CIRCULO'],
  mgSimon:['MIRA LA SECUENCIA','Y REPITELA'],
  mgJump: ['TOCA PARA SALTAR','LAS VALLAS Y ROCAS'],
  mgTopo: ['¡ZUMBA A LOS RATUCOS!','NO A LOS AZULES'],
  mgPesca:['TOCA AL PICAR','Y MANTEN LA TENSION'],
  mgMemo: ['¡MEMORIZA!','LUEGO BUSCA PAREJAS'],
  mgGlobo:['TOCA EL GLOBO','¡QUE NO CAIGA!']
};
/* umbrales de 1-2-3 estrellas (la 2ª = "victoria" de siempre) */
const MG_STARS = {mgCatch:[7,14,26], mgSimon:[2,4,7], mgJump:[6,12,20], mgTopo:[8,15,26], mgPesca:[3,8,15], mgGlobo:[6,12,22]};

function mgBase(o){
  return Object.assign({ph:'play', t:0, score:0, combo:0, maxCombo:0, intro:1, ie:0, introStep:600, cd:-1, cdAt:0, goAt:0,
    shown:0, bumpAt:0, comboBreakAt:0, lastTick:6, mood:null, moodUntil:0, sqAt:0, sqAmp:0, timed:true, hits:0}, o);
}
function mgMood(k, ms){ const m = UI.mg; if(!m) return; m.mood = k; m.moodUntil = performance.now()+(ms||600); }
function mgSquash(amp){ const m = UI.mg; if(!m) return; m.sqAt = performance.now(); m.sqAmp = amp; }
function mgComboUp(){
  const m = UI.mg; m.combo++; m.hits++;
  if(m.combo>m.maxCombo) m.maxCombo = m.combo;
  if(m.combo>0 && m.combo%10===0){ popText(80, 40, 'COMBO X'+m.combo, '#7ac74f', {big:true, life:900}); SFX.coin(); }
}
function mgComboBreak(){
  const m = UI.mg;
  if(m.combo>=3){ m.comboBreakAt = performance.now(); m.brokeCombo = m.combo; }
  m.combo = 0;
}
/* avanza la cuenta atrás; devuelve el dt de juego (0 mientras cuenta o al acabar) */
function mgFrame(dt){
  const m = UI.mg;
  if(!m || m.ph==='end') return 0;
  const now = performance.now();
  if(m.intro){
    m.ie += dt;
    const idx = m.ie < MG_PRE ? -1 : Math.min(3, Math.floor((m.ie-MG_PRE)/m.introStep));
    if(idx!==m.cd){
      m.cd = idx;
      if(idx>=0 && idx<3){ m.cdAt = now; if(!m.silentIntro) SFX.mgCount(idx); }
    }
    if(m.ie >= MG_PRE + 3*m.introStep){
      m.intro = 0; m.goAt = now;
      if(!m.silentIntro) SFX.mgGo();
      shake(0.12);
      if(m.onGo) m.onGo();
    }
    return 0;
  }
  /* tensión: los últimos 5 segundos hacen tic-tac */
  if(m.timed && m.end && m.t < m.end){
    const s = Math.ceil((m.end-m.t)/1000);
    if(s<=5 && s<m.lastTick){ m.lastTick = s; SFX.mgTick(s); if(s<=3) shake(0.05); }
  }
  return dt;
}
function mgRemain(){ const m = UI.mg; return Math.max(0, (m.end||0)-m.t); }

function mgGuard(need){
  const p = AP();
  if(p.sleeping){ toast('SHHH... DUERME'); return false; }
  if(p.energy<need){ toast('SIN ENERGIA'); SFX.nope(); return false; }
  return true;
}
function mgStarsFor(mode, score, m){
  if(m && m.starsOverride!==undefined) return m.starsOverride;
  const th = MG_STARS[mode]; if(!th) return 0;
  return score>=th[2] ? 3 : (score>=th[1] ? 2 : (score>=th[0] ? 1 : 0));
}
function finishMg(title, score, motas, xp, won){
  const p = AP();
  const m = UI.mg;
  if(m.ph==='end') return;
  if(m.quit){ motas = Math.floor(motas/2); xp = Math.floor(xp/2); won = false; }
  if(won){ p.gamesWon++; p.happy=Math.min(100,p.happy+12); }
  else { p.happy=Math.min(100,p.happy+4); }
  p.energy = Math.max(0, p.energy-10);
  if(motas>0) gainMotas(motas);
  const xpG = Math.round(xp*(p.trait==='JUGUETON'?1.5:1));
  gainXP(xpG);
  questProg('juegos', 1);
  weeklyProg('juegos', 1);
  m.ph='end'; m.title=title; m.scoreF=score; m.rMotas=motas; m.rXp=xpG; m.won=won;
  m.endAt = performance.now(); m.endSkip = false; m.fxDone = {};
  m.stars = m.quit ? 0 : mgStarsFor(UI.mode, score, m);
  if(!m.endWhy) m.endWhy = m.quit ? 'ABANDONO' : '¡TIEMPO!';
  G.best = G.best||{};
  m.prevBest = G.best[UI.mode]||0;
  m.newBest = !m.quit && score>0 && score > m.prevBest;
  if(m.newBest) G.best[UI.mode] = score;
  /* las partículas del juego no pisan el panel final */
  if(typeof JUICE!=='undefined'){ JUICE.fx.length = 0; JUICE.pops.length = 0; }
  if(UI.particles) UI.particles.length = 0;
  if(UI.floats) UI.floats.length = 0;
  if(m.quit) SFX.mgMiss(); else SFX.mgWhistle();
  shake(0.25);
  saveGame();
}
/* sube un atributo como premio (lo enseña el panel final, no un toast) */
function mgStatBonus(stat, label){
  const p = AP(); p[stat] = Math.min(99, p[stat]+1);
  UI.mg.bonus = label;
}
/* cómo arrancar otra partida del mismo juego */
const MG_START = {
  mgCatch:()=>startCatch(), mgSimon:()=>startSimon(), mgJump:()=>startJump(), mgTopo:()=>startTopo(),
  mgPesca:()=>startPesca(), mgMemo:()=>startMemo(), mgGlobo:()=>startGlobo(),
  mgDance:()=>startDance(Math.max(0, DISCOS.indexOf(UI.mg.disco)))
};
const MG_FINISH = {
  mgCatch:()=>catchFinish(), mgSimon:()=>simonFinish(), mgJump:()=>jumpFinish(), mgTopo:()=>topoFinish(),
  mgPesca:()=>pescaFinish(), mgMemo:()=>memoFinish(), mgGlobo:()=>globoFinish(), mgDance:()=>danceFinish()
};
/* salir con la X / Escape: antes del ¡YA! no cuesta nada; después, premio a medias */
function mgQuit(){
  const m = UI.mg; if(!m || m.ph==='end') return;
  if(m.intro){ UI.mode = 'games'; UI.mg = null; SFX.tap(); return; }
  m.quit = true; m.endWhy = 'ABANDONO';
  MG_FINISH[UI.mode]();
}
/* ---------------- PANEL FINAL: tiempos y botones ---------------- */
const MG_END_LOCK = 700;
function mgEndTimeline(m){
  /* hitos del panel (ms desde endAt) */
  const T = {banner:0, panel:650, count:900};
  T.countEnd = T.count + Math.min(900, 250 + (m.scoreF||0)*40);
  T.stars = T.countEnd + 120;
  T.rewards = T.stars + (m.stars||0)*300 + 120;
  T.record = T.rewards + 250;
  T.done = T.record + (m.newBest ? 700 : 150);
  return T;
}
function mgEndAge(m){
  const T = mgEndTimeline(m);
  return m.endSkip ? T.done + 1 : performance.now() - m.endAt;
}
const MG_BTN_AGAIN = {x:22, y:204, w:54, h:17}, MG_BTN_EXIT = {x:84, y:204, w:54, h:17};
function mgInRect(x, y, r){ return x>=r.x && x<r.x+r.w && y>=r.y && y<r.y+r.h; }
function mgEndTap(x, y){
  const m = UI.mg;
  const age = performance.now() - m.endAt;
  if(age < MG_END_LOCK) return;                         /* el toque rápido de fin de tiempo no salta el panel */
  const T = mgEndTimeline(m);
  if(!m.endSkip && age < T.done){ m.endSkip = true; SFX.tap(); return; }  /* acelera la animación */
  if(mgInRect(x, y, MG_BTN_AGAIN)){ mgAgain(); return; }
  if(mgInRect(x, y, MG_BTN_EXIT)){ mgExit(); return; }
}
function mgExit(){ UI.mode = 'main'; UI.mg = null; SFX.tap(); }
function mgAgain(){
  const mode = UI.mode, m = UI.mg;
  SFX.tap();
  const f = MG_START[mode];
  if(!f) return mgExit();
  if(AP().sleeping || AP().energy<10){ toast(AP().sleeping ? 'SHHH... DUERME' : 'SIN ENERGIA'); SFX.nope(); return; }
  f();
  if(UI.mode===mode && UI.mg!==m){  /* sin iris: la cuenta empieza ya */
    UI.mg.ie = MG_PRE - 120;
    if(mode==='mgDance') UI.mg.t += MG_PRE - 120;
  }
}
function mgEndReady(){
  const m = UI.mg; if(!m || m.ph!=='end') return false;
  return mgEndAge(m) >= mgEndTimeline(m).done;
}

/* ---------------- LLUVIA DE MOTAS (CATCH) ---------------- */
function startCatch(){
  if(!mgGuard(10)) return;
  audio();
  UI.mg = mgBase({end:20000, items:[], splats:[], px:80, tx:80, next:300, vx:0});
  UI.mode='mgCatch';
}
const CATCH_Y = 161;
function catchStep(dt){
  const m = UI.mg;
  if(m.ph!=='play') return;
  m.t += dt;
  const k = Math.min(1, m.t/m.end);
  if(m.t<m.end && m.t>m.next){
    const r = Math.random();
    const kind = r<0.07 ? 'star' : (r<0.30+k*0.08 ? 'poop' : 'mota');
    m.items.push({x:14+Math.random()*132, y:22, vy:(kind==='star'?0.085:0.045)+Math.random()*0.035+k*0.035, kind, sp:Math.random()*6});
    m.next = m.t + (460 - k*170) + Math.random()*(360 - k*140);
  }
  const ox = m.px;
  m.px += (m.tx-m.px)*Math.min(1, dt*0.014);
  m.vx = dt>0 ? (m.px-ox)/dt : m.vx;
  const spr = currentSprite();
  const headY = CATCH_Y - spr.height*2 + 6;
  for(let i=m.items.length-1;i>=0;i--){
    const it = m.items[i];
    it.y += it.vy*dt;
    if(!it.done && it.y>headY && it.y<CATCH_Y && Math.abs(it.x-m.px)<Math.max(11, spr.width-1)){
      it.done = true;
      if(it.kind==='poop'){
        mgComboBreak(); m.score = Math.max(0, m.score-2);
        SFX.mgBuzz(); vibrate(40); shake(0.4); hitstop(90); flash('#a4713a', 0.25, 160);
        burst(it.x, it.y, {n:12, cols:['#a4713a','#6a4a2a','#d8b080'], speed:0.09, g:0.0004});
        popText(it.x, it.y-8, '-2', '#e2574c', {big:true});
        mgMood('dizzy', 900); mgSquash(0.2);
      } else {
        mgComboUp();
        const star = it.kind==='star';
        const v = (star?5:1) * (1+Math.floor(m.combo/10));
        m.score += v;
        comboTone(Math.min(15, m.combo)); if(star) SFX.coin();
        vibrate(star?25:8);
        burst(it.x, it.y, {n:star?16:7, cols:star?['#ffd94a','#ffffff','#f0a04b']:['#ffd94a','#fff8d0'], speed:star?0.11:0.07, kind:star?'star':'px', g:0.0002});
        ringFx(it.x, it.y, star?'#ffd94a':'#fff8d0', star?16:9, 260);
        popText(it.x, it.y-6, '+'+v, star?'#ffd94a':'#ffffff', {big:star});
        mgSquash(star?0.18:0.1); mgMood('happy', 500);
        if(star){ hitstop(60); shake(0.15); }
      }
      m.items.splice(i,1); continue;
    }
    if(it.y>=CATCH_Y){
      if(it.kind!=='poop'){ mgComboBreak(); dustFx(it.x, CATCH_Y, 4, 'rgba(255,217,74,0.8)'); if(Math.random()<0.5) SFX.mgMiss(); }
      else { m.splats.push({x:it.x, t:m.t}); dustFx(it.x, CATCH_Y, 5, 'rgba(164,113,58,0.9)'); }
      m.items.splice(i,1);
    }
  }
  for(let i=m.splats.length-1;i>=0;i--) if(m.t-m.splats[i].t>2500) m.splats.splice(i,1);
  if(m.t>=m.end && m.items.length===0) catchFinish();
}
function catchFinish(){
  const m = UI.mg;
  if(m.ph==='end') return;
  finishMg('LLUVIA DE MOTAS', m.score, m.score, 8+Math.round(m.score/2), m.score>=14);
}
function catchMoveTo(x){ const m = UI.mg; m.tx = Math.max(12, Math.min(148, x)); }

/* ---------------- BAILE (DANCE) ----------------
   reloj de canción propio (m.t, avanzado con dt real acotado): si la
   pestaña se va al fondo la canción se pausa en vez de fallar todo */
function startDance(di){
  if(!mgGuard(10)) return;
  audio();
  const D = DISCOS[di===undefined ? 0 : di] || DISCOS[0];
  const step = D.step, cstep = step*2;
  const lead = 2*step;
  const beats = [];
  for(let i=0;i<16;i++) if(D.pat[i]) beats.push({t:lead+i*step, i, hit:0, sched:false});
  UI.mg = mgBase({beats, disco:D, step, lead, introStep:cstep, silentIntro:true, timed:false,
    judge:'', judgeT:0, judgeK:0, end:lead+16*step+450, nextStep:-8, beatN:-99, beatAt:0, perfects:0});
  UI.mg.t = -(MG_PRE + 3*cstep);
  UI.mode='mgDance';
}
function danceStep(rdt){
  const m = UI.mg;
  if(m.ph!=='play') return;
  m.t += rdt;
  const D = m.disco, step = m.step;
  /* programa audio con 150 ms de margen: cuenta de entrada, bajo, charles y guía */
  while(m.lead + m.nextStep*step - m.t < 150 && m.nextStep < 16){
    const s = m.nextStep, st = m.lead + s*step;
    const off = Math.max(0, (st - m.t)/1000);
    if(st - m.t < -60){ m.nextStep++; continue; }   /* ya pasó: no suena todo de golpe */
    if(s<0){
      if(s%2===0) tone({f:s===-2?1568:1175, d:0.05, type:'p125', vol:0.04, at:sfxAt(off)});
    } else {
      if(s%4===0) kick(sfxAt(off), 0.09);
      nz(sfxAt(off+(s%2?0:0.005)), 0.03, s%2?0.012:0.02, 9000, 3);
      if(D.pat[s]) tone({f:NOTE(D.base, D.tune[s]), at:sfxAt(off), d:0.16, type:'triangle', vol:0.028, send:0.15});
      if(s%4===0) tone({f:NOTE(D.base/2, D.tune[s]||0), at:sfxAt(off), d:step/1000*1.6, type:'triangle', vol:0.03});
    }
    m.nextStep++;
  }
  /* cuenta de entrada visual sincronizada: el marco sólo mira m.ie */
  for(const b of m.beats){
    if(!b.hit && m.t > b.t+140){
      b.hit = -1; m.judge = 'FALLO'; m.judgeT = performance.now(); m.judgeK = 0;
      mgComboBreak(); mgMood('dizzy', 450); m.missFlashAt = performance.now();
    }
  }
  /* el último pulso cercano: para que el bitxo bote a tiempo */
  const bn = Math.floor((m.t - m.lead)/step);
  if(bn!==m.beatN){ m.beatN = bn; m.beatAt = performance.now(); }
}
function danceHit(){
  const m = UI.mg;
  if(m.ph!=='play' || m.intro) return;
  let best=null, bd=1e9;
  for(const b of m.beats){ if(!b.hit){ const d=Math.abs(m.t-b.t); if(d<bd){bd=d; best=b;} } }
  const now = performance.now();
  if(best && bd<130){
    const perfect = bd<55;
    best.hit = perfect ? 3 : 1; best.hitAt = now;
    m.score += best.hit; mgComboUp();
    if(perfect) m.perfects++;
    m.judge = perfect ? '¡PERFECTO!' : 'BIEN'; m.judgeT = now; m.judgeK = perfect?2:1;
    const f = NOTE(m.disco.base*2, m.disco.tune[best.i%16]);
    tone({f, d:0.14, type:'p25', vol:perfect?0.06:0.045, send:0.2});
    if(perfect) tone({f:f*2, d:0.08, type:'triangle', vol:0.03});
    vibrate(perfect?25:12);
    burst(28, 184, {n:perfect?14:7, cols:perfect?['#ffd94a','#ffffff','#f2a2b8']:['#7ac74f','#fff8d0'], speed:perfect?0.12:0.08, kind:perfect?'star':'px', g:0.0002});
    ringFx(28, 184, perfect?'#ffd94a':'#7ac74f', perfect?18:12, 300);
    mgSquash(perfect?0.28:0.16); mgMood('happy', 400);
    if(perfect) shake(0.08);
  } else {
    mgComboBreak(); m.judge = 'FALLO'; m.judgeT = now; m.judgeK = 0;
    m.score = Math.max(0, m.score-1);   /* aporrear no sirve: cada toque al aire resta */
    SFX.mgMiss(); mgMood('dizzy', 400); m.missFlashAt = now;
  }
}
function danceFinish(){
  const m = UI.mg;
  if(m.ph==='end') return;
  const max = m.beats.length*3;
  m.starsOverride = m.score>=max*0.85 ? 3 : (m.score>=max*0.55 ? 2 : (m.score>=max*0.3 ? 1 : 0));
  m.endWhy = m.quit ? 'ABANDONO' : '¡FIN!';
  finishMg('BAILE', m.score, Math.round(m.score*(m.disco?m.disco.mult:1)), 12+m.score, m.score >= max*0.55);
  if(m.disco && m.disco.id==='nana'){
    const p2 = AP();
    if(!p2.sleeping){ p2.sleeping = true; SFX.sleep(); m.bonus = 'SE HA DORMIDO...'; }
  }
}

/* ---------------- SIMON ---------------- */
const FLOWERS = [
 {x:52,y:116,c:'#e2574c',f:262},{x:108,y:116,c:'#ffd94a',f:330},
 {x:52,y:164,c:'#6db1ff',f:392},{x:108,y:164,c:'#f78fb3',f:494}
];
function startSimon(){
  if(!mgGuard(8)) return;
  audio();
  UI.mg = mgBase({ph:'show', seq:[Math.floor(Math.random()*4)], showI:0, showT:300, idx:0, lit:-1, litAt:0, litT:0, round:1, timed:false, failT:0});
  UI.mode='mgSimon';
}
function simonGap(){ return Math.max(340, 580 - UI.mg.round*30); }
function simonStep(dt){
  const m = UI.mg;
  if(m.ph==='end') return;
  m.t += dt;
  if(m.failT){ if(m.t>m.failT) simonFinish(); return; }
  if(m.ph==='show' && m.t>m.showT){
    if(m.showI < m.seq.length){
      m.lit = m.seq[m.showI]; m.litAt = performance.now(); m.litT = m.t;
      beep(FLOWERS[m.lit].f, 0.28, 0, 'triangle', 0.08);
      m.showI++; m.showT = m.t + simonGap();
    } else {
      m.ph='input'; m.idx=0; m.inputAt = performance.now();
      tone({f:1318, d:0.06, type:'p125', vol:0.03});
    }
  }
}
function simonPress(i){
  const m = UI.mg;
  if(m.ph!=='input' || m.failT) return;
  const F = FLOWERS[i];
  m.lit = i; m.litAt = performance.now(); m.litT = m.t; m.pressAt = m.litAt; m.pressI = i;
  beep(F.f, 0.22, 0, 'triangle', 0.08); vibrate(12);
  if(i === m.seq[m.idx]){
    m.idx++;
    burst(F.x, F.y, {n:6, cols:[F.c,'#ffffff'], speed:0.06, kind:'star', g:0});
    mgSquash(0.1);
    if(m.idx === m.seq.length){
      m.round++; m.score = m.round-1; mgComboUp();
      if(m.round>8){ m.endWhy='¡COMPLETO!'; confetti(80, 120, 30); simonFinish(); return; }
      m.seq.push(Math.floor(Math.random()*4));
      m.ph='show'; m.showI=0; m.showT=m.t+900;
      popText(80, 58, '¡BIEN!', '#7ac74f', {big:true, life:800});
      [0,4,7].forEach((s,j)=>tone({f:NOTE(784,s), d:0.1, type:'p25', vol:0.04, at:sfxAt(j*0.07)}));
      mgMood('happy', 700); mgSquash(0.3);
    }
  } else {
    SFX.mgBuzz(); vibrate(60); shake(0.5); hitstop(120); flash('#e2574c', 0.3, 200);
    m.wrongI = i; m.rightI = m.seq[m.idx];
    mgMood('dizzy', 1400);
    m.failT = m.t + 1100; m.endWhy = '¡FALLO!';
  }
}
function simonFinish(){
  const m = UI.mg;
  if(m.ph==='end') return;
  const sc = m.round-1;
  if(sc>=5 && !m.quit) mgStatBonus('def', '+1 DEF POR CONCENTRARSE');
  finishMg('SIMON', sc, 6*sc + (sc>=8?20:0), 7*sc, sc>=4);
}

/* ---------------- SALTA: la comba — esquiva obstáculos, entrena VELOCIDAD ---------------- */
const JUMP_X = 40, JUMP_GY = 161, JUMP_V = -0.19, JUMP_G = 0.001;
function startJump(){
  if(!mgGuard(10)) return;
  audio();
  UI.mg = mgBase({end:25000, obs:[], flying:[], y:0, vy:0, next:600, inv:0, jbuf:0, scroll:0, landAt:0, closeCalls:0});
  UI.mode='mgJump';
}
function jumpTap(){
  const m = UI.mg;
  if(m.ph==='play'){
    if(m.y===0){
      m.vy = JUMP_V; SFX.boing(); vibrate(10);
      mgSquash(-0.3); dustFx(JUMP_X, JUMP_GY, 5);
    } else if(m.vy>0 && m.y>-7){ m.jbuf = 140; }       /* salto en búfer: tocar justo antes de aterrizar cuenta */
  } else if(m.ph==='end'){ mgEndTap(80, 212); }
}
function jumpSpeed(t){ return 0.06 + Math.min(0.05, t*0.0000024); }
function jumpStep(dt){
  const m = UI.mg;
  if(m.ph!=='play') return;
  m.t += dt;
  /* física */
  if(m.y<0 || m.vy!==0){
    m.vy += JUMP_G*dt;
    m.y = Math.min(0, m.y + m.vy*dt);
    if(m.y===0){
      m.vy = 0; m.landAt = performance.now();
      mgSquash(0.28); dustFx(JUMP_X, JUMP_GY, 4);
      if(m.jbuf>0){ m.jbuf = 0; jumpTap(); }
    }
  }
  if(m.jbuf>0) m.jbuf -= dt;
  const speed = jumpSpeed(m.t);
  m.scroll += speed*dt;
  if(m.t<m.end && m.t>m.next){
    const rock = Math.random()<0.32;
    m.obs.push({x:172, h:rock ? 9+Math.floor(Math.random()*4) : 7+Math.floor(Math.random()*4), bad:rock, w:rock?10:8});
    /* a veces una pareja seguida: exige ritmo */
    const pair = m.t>8000 && Math.random()<0.18;
    m.next = m.t + (pair ? 430 : Math.max(560, 1150 - m.t*0.02) + Math.random()*260);
  }
  if(m.inv>0) m.inv -= dt;
  const feet = -m.y;
  for(let i=m.obs.length-1;i>=0;i--){
    const o = m.obs[i];
    o.x -= speed*dt;
    const overlap = Math.abs(o.x - JUMP_X) < (o.w/2 + 4);
    if(overlap && !o.hit && feet < o.h-1 && m.inv<=0){
      /* choque: el obstáculo sale volando, no se atraviesa */
      o.hit = true;
      mgComboBreak(); m.score = Math.max(0, m.score-1); m.inv = 900;
      SFX.hurt ? SFX.hurt() : SFX.nope(); vibrate(40);
      shake(0.45); hitstop(80); flash('#ffffff', 0.25, 120);
      burst(o.x, JUMP_GY-o.h/2, {n:12, cols:o.bad?['#9a9aa4','#6a6a78','#ffffff']:['#8a6a3a','#c8a060','#5a4632'], speed:0.1, g:0.0004, floor:JUMP_GY+2});
      popText(JUMP_X, JUMP_GY-30, '-1', '#e2574c', {big:true});
      mgMood('dizzy', 1000); mgSquash(0.4);
      m.flying.push({x:o.x, y:JUMP_GY, h:o.h, w:o.w, bad:o.bad, vx:0.09, vy:-0.16, rot:0, vr:0.018});
      m.obs.splice(i,1); continue;
    }
    if(!o.passed && !o.hit && o.x < JUMP_X-(o.w/2+4)){
      o.passed = true;
      mgComboUp();
      let v = 1 + Math.floor(m.combo/10);
      const close = feet - o.h < 3;
      if(close){ v++; m.closeCalls++; popText(JUMP_X+8, JUMP_GY-38, '¡RASANTE!', '#5ec8d8', {life:700}); }
      m.score += v;
      comboTone(Math.min(15, m.combo));
      popText(JUMP_X, JUMP_GY-28-Math.round(feet), '+'+v, '#ffd94a');
      burst(JUMP_X, JUMP_GY+m.y-8, {n:5, cols:['#ffd94a','#fff8d0'], speed:0.06, kind:'star', g:0});
    }
    if(o.x<-12) m.obs.splice(i,1);
  }
  for(let i=m.flying.length-1;i>=0;i--){
    const f = m.flying[i];
    f.vy += 0.0006*dt; f.x += f.vx*dt; f.y += f.vy*dt; f.rot += f.vr*dt;
    if(f.y>290 || f.x>190) m.flying.splice(i,1);
  }
  if(m.t>=m.end && m.obs.length===0){ m.endWhy='¡META!'; jumpFinish(); }
}
function jumpFinish(){
  const m = UI.mg;
  if(m.ph==='end') return;
  const fast = m.score>=12;
  if(fast && !m.quit) mgStatBonus('spd', '+1 VEL POR ESE RITMO');
  finishMg('SALTA', m.score, m.score*2, 8+Math.round(m.score/2), fast);
}

/* ---------------- TOPO: ratucos al asalto — golpéalos, no a los amigos ---------------- */
function startTopo(){
  if(!mgGuard(10)) return;
  audio();
  UI.mg = mgBase({end:25000, holes:[], next:300, mallet:null});
  for(let i=0;i<9;i++) UI.mg.holes.push({up:null, hideAt:0, popT:undefined, bonk:null, down:null});
  UI.mode='mgTopo';
}
const TOPO_POS = [];
for(let r=0;r<3;r++) for(let c=0;c<3;c++) TOPO_POS.push({x:44+c*36, y:112+r*32});
function topoTap(x,y){
  const m = UI.mg;
  if(m.ph==='end'){ mgEndTap(x, y); return; }
  if(m.ph!=='play') return;
  m.mallet = {x, y, at:performance.now()};
  for(let i=0;i<9;i++){
    const P = TOPO_POS[i], h = m.holes[i];
    if(Math.abs(x-P.x)<=17 && Math.abs(y-P.y+4)<=18){
      if(h.up){ topoWhack(i); return; }
      /* golpe al aire: tierra y nada más */
      dustFx(P.x, P.y+6, 4, 'rgba(120,90,60,0.9)'); tone({f:180, d:0.05, type:'triangle', vol:0.04});
      return;
    }
  }
}
function topoWhack(i){
  const m = UI.mg, P = TOPO_POS[i], h = m.holes[i];
  const kind = h.up;
  if(kind==='friend'){
    m.score = Math.max(0, m.score-2); mgComboBreak();
    popText(P.x, P.y-22, '¡AY! -2', '#e2574c', {big:true});
    SFX.mgBuzz(); vibrate(40); shake(0.45); hitstop(100); flash('#e2574c', 0.25, 180);
    heartsFx(P.x, P.y-10, 3);
    mgMood('dizzy', 1100);
  } else {
    const gold = kind==='gold';
    mgComboUp();
    const v = (gold ? 3 : 1) * (1+Math.floor(m.combo/10));
    m.score += v;
    popText(P.x, P.y-22, '+'+v, gold?'#ffd94a':'#ffffff', {big:gold});
    SFX.mgBonk(gold); comboTone(Math.min(15, m.combo), 0.03); vibrate(gold?25:12);
    hitstop(gold?80:40); shake(gold?0.28:0.12);
    burst(P.x, P.y-8, {n:gold?14:8, cols:gold?['#ffd94a','#ffffff','#f0a04b']:['#ffffff','#ffd94a'], speed:gold?0.11:0.08, kind:'star', g:0.0002});
    ringFx(P.x, P.y-6, gold?'#ffd94a':'#ffffff', gold?16:11, 240);
    mgMood('happy', 500); mgSquash(0.2);
  }
  h.bonk = {k:kind, at:performance.now()};
  h.up = null; h.bopT = performance.now();
}
function topoStep(dt){
  const m = UI.mg;
  if(m.ph!=='play') return;
  m.t += dt;
  if(m.t<m.end && m.t>m.next){
    const empty = [];
    for(let i=0;i<9;i++) if(!m.holes[i].up && !m.holes[i].bonk) empty.push(i);
    if(empty.length){
      const i = empty[Math.floor(Math.random()*empty.length)];
      const r = Math.random();
      const h = m.holes[i];
      h.up = r<0.15 ? 'friend' : (r<0.28 ? 'gold' : 'ratuco');
      h.popT = m.t; h.down = null;
      h.hideAt = m.t + (h.up==='gold' ? 800 : 1200) - Math.min(420, m.t*0.016);
    }
    m.next = m.t + Math.max(380, 820 - m.t*0.017) + Math.random()*120;
  }
  for(const h of m.holes){
    if(h.up && m.t>h.hideAt){
      if(h.up!=='friend'){ mgComboBreak(); }
      h.down = {k:h.up, t:m.t, laugh:h.up!=='friend'}; h.up = null;
    }
    if(h.bonk && performance.now()-h.bonk.at>420) h.bonk = null;
    if(h.down && m.t-h.down.t>220) h.down = null;
  }
  if(m.t>=m.end) topoFinish();
}
function topoFinish(){
  const m = UI.mg;
  if(m.ph==='end') return;
  const strong = m.score>=15;
  if(strong && !m.quit) mgStatBonus('str', '+1 FUE POR ESOS BRAZOS');
  finishMg('TOPO', m.score, m.score*2, 8+Math.round(m.score/2), strong);
}

/* ---------------- PESCA: espera la picada y domina la tensión del sedal ---------------- */
const PESCA_BITE = 520, PESCA_HOLD = 3400;
function startPesca(){
  if(!mgGuard(10)) return;
  audio();
  UI.mg = mgBase({ph:'wait', end:25000, biteAt: 1500+Math.random()*2500, biteT:0,
           tension:50, holdT:0, fish:null, caught:[], splashT:0, flyFish:null, snapAt:0, hookAt:0});
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
const PESCA_BOB = {x:104, y:112};
function pescaTap(){
  const m = UI.mg;
  if(m.ph==='end'){ mgEndTap(80, 212); return; }
  if(m.ph==='wait'){
    if(m.t >= m.biteAt && m.t < m.biteAt+PESCA_BITE){
      m.fish = rollFish();
      m.ph='reel'; m.tension=55; m.holdT=0; m.hookAt = performance.now();
      SFX.boing(); SFX.mgSplash(); vibrate(25);
      hitstop(70); shake(0.25);
      burst(PESCA_BOB.x, PESCA_BOB.y, {n:14, cols:['#ffffff','#9adcf0','#5ec8d8'], speed:0.1, angle:-Math.PI/2, spread:2.2, g:0.0005});
      popText(PESCA_BOB.x, PESCA_BOB.y-26, '¡ENGANCHADO!', '#ffd94a');
      mgSquash(-0.25);
    } else if(m.t < m.biteAt){
      popText(PESCA_BOB.x, PESCA_BOB.y-20, 'PRONTO...', '#9adcf0', {life:600});
      tone({f:300, d:0.05, type:'triangle', vol:0.03});
      /* tirar antes de hora espanta al pez: la picada se retrasa */
      m.biteAt = Math.max(m.biteAt, m.t + 700 + Math.random()*900);
    }
  } else if(m.ph==='reel'){
    m.tension = Math.min(100, m.tension+11);
    m.reelAt = performance.now();
    tone({f:500+m.tension*8, d:0.035, type:'p125', vol:0.03});
    mgSquash(0.08);
  }
}
function pescaReset(){ const m = UI.mg; m.ph='wait'; m.fish=null; m.biteT=0; }
function pescaStep(dt){
  const m = UI.mg;
  if(m.ph==='end') return;
  m.t += dt;
  if(m.flyFish){ m.flyFish.t += dt; if(m.flyFish.t>700) m.flyFish = null; }
  if(m.ph==='wait'){
    if(m.t > m.biteAt && !m.biteT){
      m.biteT = performance.now(); SFX.coin(); SFX.mgSplash(); vibrate([20,20]);
      popText(PESCA_BOB.x, PESCA_BOB.y-24, '!', '#ffd94a', {big:true, life:500});
      burst(PESCA_BOB.x, PESCA_BOB.y+2, {n:8, cols:['#ffffff','#9adcf0'], speed:0.07, angle:-Math.PI/2, spread:2.4, g:0.0004});
    }
    if(m.t > m.biteAt+PESCA_BITE){
      /* se escapó la picada: otra oportunidad */
      if(m.biteT) popText(PESCA_BOB.x, PESCA_BOB.y-18, 'SE FUE...', '#9adcf0', {life:600});
      m.biteAt = m.t + 1200+Math.random()*2400; m.biteT = 0;
    }
    if(m.t >= m.end) pescaFinish();
  } else if(m.ph==='reel'){
    const f = m.fish;
    m.tension -= dt*(0.028 + f.pull*Math.abs(Math.sin(m.t/400)));
    m.holdT += dt;
    if(m.tension<=6){
      popText(PESCA_BOB.x, PESCA_BOB.y-18, 'SE ESCAPO...', '#e2574c');
      SFX.mgMiss(); mgMood('dizzy', 800); mgComboBreak();
      m.biteAt = m.t + 1400+Math.random()*2000; pescaReset();
      burst(PESCA_BOB.x, PESCA_BOB.y+4, {n:6, cols:['#9adcf0','#ffffff'], speed:0.05, angle:-Math.PI/2, spread:2});
    } else if(m.tension>=98){
      popText(80, PESCA_BOB.y-24, '¡SEDAL ROTO!', '#e2574c', {big:true});
      SFX.mgSnap(); vibrate(50); shake(0.5); hitstop(90); mgMood('dizzy', 1100); mgComboBreak();
      m.snapAt = performance.now();
      burst(70, 70, {n:10, cols:['#f6efe0','#ffffff'], speed:0.08, kind:'spark', g:0.0003});
      m.biteAt = m.t + 1400+Math.random()*2000; pescaReset();
    } else if(m.holdT>PESCA_HOLD){
      m.caught.push(f); m.score += f.v; m.splashT = performance.now(); mgComboUp();
      if(f.id==='dorado'){ diaryLog(petName(AP())+' PESCO UN PEZ DORADO'); confetti(80, 90, 26); }
      popText(80, 60, '¡'+f.name+'!', f.col==='#2a4a8a'?'#9adcf0':f.col, {big:true, life:1100});
      popText(PESCA_BOB.x, PESCA_BOB.y-30, '+'+f.v, '#ffd94a', {delay:250});
      SFX.yay(); SFX.mgSplash(true); vibrate([20,20,40]);
      hitstop(90); shake(0.3);
      burst(PESCA_BOB.x, PESCA_BOB.y, {n:18, cols:['#ffffff','#9adcf0','#5ec8d8'], speed:0.12, angle:-Math.PI/2, spread:2, g:0.0005});
      m.flyFish = {f, t:0};
      mgMood('happy', 1200); mgSquash(0.35);
      m.biteAt = m.t + 1200+Math.random()*2200; pescaReset();
    }
    if(m.t >= m.end) pescaFinish();
  }
}
function pescaFinish(){
  const m = UI.mg;
  if(m.ph==='end') return;
  const gold = m.caught.some(f=>f.id==='dorado');
  if(gold && !m.quit) m.starsOverride = Math.max(2, mgStarsFor('mgPesca', m.score));
  finishMg('PESCA', m.score, m.score*3, 8+m.score, m.score>=8 || gold);
}

/* ---------------- MEMORIA: parejas de la despensa ---------------- */
const MEMO_SPRS = ['meal','snack','fruta','pescado','picante','setita'];
const MEMO_POS = [];
for(let r=0;r<3;r++) for(let c=0;c<4;c++) MEMO_POS.push({x:14+c*34, y:66+r*42});
function startMemo(){
  if(!mgGuard(8)) return;
  audio();
  const deck = [];
  for(const k of MEMO_SPRS){ deck.push(k, k); }
  for(let i=deck.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    const tmp = deck[i]; deck[i]=deck[j]; deck[j]=tmp;
  }
  UI.mg = mgBase({end:60000, cards:deck.map(k=>({k, flip:false, done:false, flipAt:0, doneAt:0, badAt:0})), sel:[], lockT:0, tries:0, streak:0, introStep:750});
  UI.mg.onGo = ()=>{ SFX.mgWhoosh(); for(const c of UI.mg.cards) c.flipAt = performance.now(); };
  UI.mode='mgMemo';
}
function memoTap(x, y){
  const m = UI.mg;
  if(m.ph==='end'){ mgEndTap(x, y); return; }
  if(m.ph!=='play' || m.lockT) return;
  for(let i=0;i<12;i++){
    const P = MEMO_POS[i], c = m.cards[i];
    if(x>=P.x && x<P.x+30 && y>=P.y && y<P.y+38 && !c.flip && !c.done){
      c.flip = true; c.flipAt = performance.now(); m.sel.push(i);
      SFX.tap(); tone({f:700+m.sel.length*200, d:0.04, type:'p125', vol:0.025}); vibrate(8);
      if(m.sel.length===2){ m.tries++; m.lockT = performance.now()+650; }
      return;
    }
  }
}
function memoStep(){
  const m = UI.mg;
  if(m.ph==='play' && m.lockT && performance.now()>m.lockT){
    const a = m.sel[0], b = m.sel[1];
    const now = performance.now();
    if(m.cards[a].k===m.cards[b].k){
      m.cards[a].done = m.cards[b].done = true;
      m.cards[a].doneAt = m.cards[b].doneAt = now;
      m.score++; m.streak++; mgComboUp();
      const P = MEMO_POS[b], Q = MEMO_POS[a];
      popText(P.x+15, P.y+4, m.streak>1 ? '¡PAREJA X'+m.streak+'!' : '¡PAREJA!', '#7ac74f');
      comboTone(Math.min(15, m.streak*2)); SFX.coin(); vibrate(12);
      burst(P.x+15, P.y+19, {n:8, cols:['#7ac74f','#ffd94a','#ffffff'], speed:0.08, kind:'star', g:0.0001});
      burst(Q.x+15, Q.y+19, {n:8, cols:['#7ac74f','#ffd94a','#ffffff'], speed:0.08, kind:'star', g:0.0001});
      hitstop(40); mgMood('happy', 600); mgSquash(0.25);
    } else {
      m.cards[a].flip = m.cards[b].flip = false;
      m.cards[a].badAt = m.cards[b].badAt = now;
      m.cards[a].flipAt = m.cards[b].flipAt = now + 200;
      m.streak = 0; mgComboBreak();
      SFX.mgMiss(); shake(0.12); mgMood('dizzy', 500);
    }
    m.sel = []; m.lockT = 0;
    if(m.score===6){ m.endWhy='¡COMPLETO!'; confetti(80, 120, 30); memoFinish(); }
  }
}
function memoPoints(){
  const m = UI.mg;
  let p = m.score*10;
  if(m.score===6) p += Math.max(0, 40 - (m.tries-6)*4) + Math.floor(mgRemain()/2000);
  return p;
}
function memoFinish(){
  const m = UI.mg;
  if(m.ph==='end') return;
  const perfect = m.score===6 && m.tries<=10;
  if(perfect && !m.quit) mgStatBonus('def', '+1 DEF POR ESA MEMORIA');
  m.starsOverride = perfect ? 3 : (m.score===6 ? 2 : (m.score>=3 ? 1 : 0));
  finishMg('MEMORIA', memoPoints(), m.score*10 + (perfect?20:0), 6+m.score*2, m.score===6);
}

/* ---------------- GLOBO: que no toque el suelo — toques y viento traicionero ---------------- */
const GLOBO_FLOOR = 168;
function startGlobo(){
  if(!mgGuard(8)) return;
  audio();
  UI.mg = mgBase({end:35000, x:80, y:90, vx:0.015, vy:0, lives:3, hitT:0, spawnT:-1e9, popAt:0, popX:0, wind:0});
  UI.mode='mgGlobo';
}
function globoTap(x, y){
  const m = UI.mg;
  if(m.ph==='end'){ mgEndTap(x, y); return; }
  if(m.ph!=='play') return;
  if(m.t-m.spawnT<450) return;
  if(Math.abs(x-m.x)<15 && Math.abs(y-m.y)<17){
    m.vy = -0.135 - Math.random()*0.02;
    m.vx += (m.x-x)*0.006;
    const low = m.y>130;
    const v = low ? 2 : 1;
    m.score += v; mgComboUp();
    m.hitT = performance.now();
    popText(m.x, m.y-18, low ? '¡AL LIMITE! +2' : '+1', low?'#ffd94a':'#f78fb3', {big:low});
    SFX.boing(); comboTone(Math.min(15, m.combo), 0.03); vibrate(8);
    ringFx(x, y, '#ffffff', 10, 200);
    burst(m.x, m.y+10, {n:low?10:5, cols:['#ffd3e2','#ffffff'], speed:0.06, g:0.0002});
    if(low){ hitstop(50); shake(0.12); }
    mgMood('happy', 400);
  } else {
    tone({f:260, d:0.04, type:'triangle', vol:0.02});
  }
}
function globoStep(dt){
  const m = UI.mg;
  if(m.ph!=='play') return;
  m.t += dt;
  if(m.t-m.spawnT<450) return;   /* el globo nuevo se está inflando */
  const k = Math.min(1, m.t/m.end);
  m.wind = Math.sin(m.t/900)*(0.00005 + k*0.00004);
  m.vy += (0.00022 + k*0.00004)*dt;
  m.vx += m.wind*dt;
  m.vx = Math.max(-0.09, Math.min(0.09, m.vx));
  m.x += m.vx*dt; m.y += m.vy*dt;
  if(m.x<14){ m.x=14; m.vx=Math.abs(m.vx)*0.7; }
  if(m.x>146){ m.x=146; m.vx=-Math.abs(m.vx)*0.7; }
  if(m.y<30){ m.y=30; m.vy=Math.abs(m.vy)*0.4; }
  if(m.y>GLOBO_FLOOR){
    m.lives--;
    m.popAt = performance.now(); m.popX = m.x;
    popText(m.x, 150, '¡PLOF!', '#e2574c', {big:true});
    SFX.mgPop(); vibrate(40); shake(0.5); hitstop(90); flash('#ffffff', 0.3, 120);
    burst(m.x, m.y, {n:16, cols:['#f78fb3','#ffd3e2','#d8578a'], speed:0.12, g:0.0004, floor:188, size:2});
    mgComboBreak(); mgMood('dizzy', 1000);
    if(m.lives<=0){ m.endWhy='¡PLOF!'; globoFinish(); return; }
    m.x = 40+Math.random()*80; m.y = 60; m.vy = 0; m.vx = (Math.random()<0.5?-1:1)*0.015; m.spawnT = m.t;
  }
  if(m.t>=m.end) globoFinish();
}
function globoFinish(){
  const m = UI.mg;
  if(m.ph==='end') return;
  finishMg('GLOBO', m.score, m.score*2, 6+Math.round(m.score/2), m.score>=12);
}

/* ---------------- TOQUES, ARRASTRES Y TECLAS ---------------- */
function mgHitX(x, y){ return x<20 && y<18; }
function mgTap(x, y){
  const m = UI.mg; if(!m) return;
  if(m.ph==='end'){ mgEndTap(x, y); return; }
  if(mgHitX(x, y)){ mgQuit(); return; }
  if(m.intro) return;                     /* durante la cuenta atrás no se juega */
  const mode = UI.mode;
  if(mode==='mgJump'){ jumpTap(); return; }
  if(mode==='mgTopo'){ topoTap(x, y); return; }
  if(mode==='mgPesca'){ pescaTap(); return; }
  if(mode==='mgMemo'){ memoTap(x, y); return; }
  if(mode==='mgGlobo'){ globoTap(x, y); return; }
  if(mode==='mgCatch'){ if(m.ph==='play') catchMoveTo(x); return; }
  if(mode==='mgDance'){ danceHit(); return; }
  if(mode==='mgSimon'){
    for(let i=0;i<4;i++){
      const F = FLOWERS[i];
      if(Math.abs(x-F.x)<=22 && Math.abs(y-F.y)<=22){ simonPress(i); return; }
    }
  }
}
function mgDrag(x, y){
  const m = UI.mg; if(!m || m.ph!=='play') return;
  if(UI.mode==='mgCatch' && !m.intro) catchMoveTo(x);
}
const TOPO_KEYS = {'7':0,'8':1,'9':2,'4':3,'5':4,'6':5,'1':6,'2':7,'3':8};
function mgKey(k){
  const m = UI.mg; if(!m) return false;
  const primary = k===' ' || k==='Enter';
  if(m.ph==='end'){
    if(k==='Escape' || primary){
      if(performance.now()-m.endAt < MG_END_LOCK) return true;
      if(!mgEndReady()){ m.endSkip = true; return true; }
      mgExit(); return true;
    }
    if((k==='r' || k==='R') && mgEndReady()){ mgAgain(); return true; }
    return false;
  }
  if(k==='Escape'){ mgQuit(); return true; }
  if(m.intro) return primary || k.startsWith('Arrow');
  const mode = UI.mode;
  if(mode==='mgJump' && (primary || k==='ArrowUp' || k==='w')){ jumpTap(); return true; }
  if(mode==='mgPesca' && (primary || k==='ArrowUp')){ pescaTap(); return true; }
  if(mode==='mgDance' && (primary || k.startsWith('Arrow'))){ danceHit(); return true; }
  if(mode==='mgCatch'){
    if(k==='ArrowLeft' || k==='a'){ catchMoveTo(m.tx-22); return true; }
    if(k==='ArrowRight' || k==='d'){ catchMoveTo(m.tx+22); return true; }
  }
  if(mode==='mgTopo' && TOPO_KEYS[k]!==undefined){
    const P = TOPO_POS[TOPO_KEYS[k]]; topoTap(P.x, P.y-4); return true;
  }
  if(mode==='mgSimon' && k>='1' && k<='4'){ simonPress(+k-1); return true; }
  if(mode==='mgGlobo' && primary){
    /* teclado: cabezazo si el globo está a tiro (mitad baja) */
    if(m.y>100) globoTap(m.x, m.y); else tone({f:260, d:0.04, type:'triangle', vol:0.02});
    return true;
  }
  return primary;
}
