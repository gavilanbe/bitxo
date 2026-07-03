"use strict";
/* =========================================================
   BITXO — main: bucle principal y arranque
   ========================================================= */
/* ---------------- BUCLE ---------------- */
/* pantallas modales sobre el prado: fondo atenuado + deslizamiento al abrir */
const MENU_DRAW = {
  stats:drawStats, album:drawAlbum, ach:drawAch, relics:drawRelics,
  exped:drawExped, ascendConfirm:drawAscendConfirm,
  shop:drawShop, feed:drawFeedMenu, play:drawPlayMenu,
  quests:drawQuests, buho:drawBuhoShop,
  train:drawTrainMenu, discos:drawDiscos, evotree:drawEvoTree
};
function drawModals(now){
  const menuFn = MENU_DRAW[UI.mode] || null;
  const repFn = offlineReport ? drawOfflineReport : (UI.expReport ? drawExpReport : null);
  if(!menuFn && !repFn){ UI.menuKey = null; return; }
  const key = UI.mode + (repFn ? '+rep' : '');
  if(UI.menuKey !== key){ UI.menuKey = key; UI.menuAt = now; }
  const pr = Math.min(1, (now - UI.menuAt)/150);
  const e = 1 - Math.pow(1-pr, 3);
  ctx.fillStyle = 'rgba(8,9,28,' + (0.45*e).toFixed(3) + ')';
  ctx.fillRect(0, 0, LW, LH);
  ctx.save();
  ctx.translate(0, Math.round((1-e)*8));
  if(menuFn) menuFn();
  if(repFn) repFn();
  ctx.restore();
}
function frame(now){
  const dt = Math.min(100, now - lastT);
  lastT = now;
  liveUpdate(dt);

  if(UI.mode==='boot'){
    px(0,0,160,272,K);
    drawTextC('BITXO', 80, 116, '#7ac74f');
    drawTextC('✦ IDLE ✦', 80, 128, '#ffd94a');
    drawTextC('CARGANDO...', 80, 144, 'rgba(255,255,255,0.5)');
  } else if(UI.mode==='evolve'){
    drawEvolve(dt);
  } else if(UI.mode==='hatch'){
    drawHatch(dt);
  } else if(UI.mode==='ascendFX'){
    drawAscendFX(dt);
  } else if(UI.mode==='battle'){
    drawBattle(now, dt);
    drawParticles(dt);
  } else if(UI.mode==='mgCatch'){
    drawCatch(now, dt);
  } else if(UI.mode==='mgDance'){
    drawDance(now, dt);
  } else if(UI.mode==='mgSimon'){
    drawSimon(now, dt);
  } else if(UI.mode==='mgJump'){
    drawJump(now, dt);
  } else {
    drawScene(now);
    drawShoot(now);
    drawPoops(now);
    drawToys(now);
    drawSign(now);
    drawSparkles(now);
    drawWild(now);
    drawBuho(now);
    drawPets(now);
    drawWeather(now);
    if(AP().sleeping) px(0,0,160,200,'rgba(10,8,30,0.35)');
    drawParticles(dt);
    drawHUD(now);
    drawModals(now);
    if(UI.pendingEvoNote){ UI.pendingEvoNote=false; toast('¡ALGUIEN EVOLUCIONO!', 3000); }
  }
  requestAnimationFrame(frame);
}

/* ---------------- ARRANQUE ---------------- */
(async function init(){
  buildAllSprites();
  buildEnemySprites();
  const saved = await loadGame();
  if(saved && saved.v===5){
    G = saved;
    G.wild = null;
    if(!G.sel || G.sel>=G.pets.length) G.sel = 0;
    G.ach = G.ach||{}; G.bond = G.bond||0;
    G.relics = G.relics||{}; G.expedsDone = G.expedsDone||0;
    G.bossesWon = G.bossesWon||0; G.bossDue = G.bossDue||false;
    G.toys = G.toys||{}; G.foodsTried = G.foodsTried||{};
    if(G.ballX===undefined) G.ballX = 80;
    G.ballVX = 0; G.cajaReadyAt = G.cajaReadyAt||0;
    for(const p of G.pets){ p.swingT=0; p.kickAt=0; }
    G.giftStreak = G.giftStreak||0; G.lastGift = G.lastGift||null;
    G.hats = G.hats||{}; G.daily = G.daily||null;
    G.buhoNextAt = G.buhoNextAt||0; G.buho = G.buho||null;
    G.discos = G.discos||{prado:true}; G.disco = G.disco||'prado'; G.games = G.games||{};
    for(const p of G.pets){
      p.hat = p.hat||null;
      if(p.str===undefined) p.str = p.discipline||0;
      p.def = p.def||0; p.spd = p.spd||0;
    }
    for(const p of G.pets){ if(!p.trait) p.trait = TRAIT_KEYS[Math.floor(Math.random()*TRAIT_KEYS.length)]; }
    for(const p of G.pets){ p.rx = p.rx||80; p.dropT=0; p.eatT=0; p.trainT=0; p.petT=0; p.joyAt=0; p.blinkAt=0; }
    const away = Date.now() - (G.lastSeen||Date.now());
    if(away > 5000) applyElapsed(away);
    UI.mode='main';
    saveGame();
  } else if(saved && saved.v>=1 && saved.v<=4){
    G = migrateOld(saved);
    const away = Date.now() - (G.lastSeen||Date.now());
    if(away > 5000) applyElapsed(away);
    UI.mode='main';
    saveGame();
  } else {
    G = freshGame();
    spawnEgg();
    UI.mode='main';
    saveGame();
  }
  checkDailyGift();
  /* aviso de versión nueva: consulta version.json saltándose la caché */
  async function checkUpdate(){
    try{
      const r = await fetch('version.json?t='+Date.now(), {cache:'no-store'});
      if(!r.ok) return;
      const j = await r.json();
      if(j.v && String(j.v)!==GAME_VERSION) UPDATE_READY = true;
    }catch(e){}
  }
  checkUpdate();
  setInterval(checkUpdate, 5*60*1000);
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) checkUpdate(); });
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) saveGame(); });
  window.addEventListener('pagehide', ()=>{ saveGame(); });
  requestAnimationFrame(frame);
})();
