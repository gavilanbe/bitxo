"use strict";
/* =========================================================
   BITXO — main: bucle principal y arranque
   ========================================================= */
/* ---------------- BUCLE ---------------- */
/* pantallas modales sobre el prado: fondo atenuado + deslizamiento al abrir */
/* a dónde vuelve cada pantalla al cerrarse con la X */
const MENU_PARENT = {
  stats:'main', album:'stats', ach:'stats', relics:'stats', beast:'stats',
  ascendConfirm:'stats', shop:'main', feed:'main', play:'main',
  quests:'main', buho:'main', discos:'games',
  games:'play', exped:'play', tower:'play', legacy:'main'
};
const MENU_DRAW = {
  stats:drawStats, album:drawAlbum, ach:drawAch, relics:drawRelics,
  exped:drawExped, ascendConfirm:drawAscendConfirm,
  shop:drawShop, feed:drawFeedMenu, play:drawPlayMenu,
  quests:drawQuests, buho:drawBuhoShop,
  discos:drawDiscos, evotree:drawEvoTree,
  beast:drawBeast, games:drawGames,
  tower:drawTower, legacy:drawLegacy
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
  if(menuFn){
    menuFn();
    if(MENU_PARENT[UI.mode]) drawCloseBadge();
    else UI.closeAt = null;
  } else UI.closeAt = null;
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
  } else if(UI.mode==='mgTopo'){
    drawTopo(now, dt);
  } else if(UI.mode==='mgPesca'){
    drawPesca(now, dt);
  } else if(UI.mode==='train'){
    drawPark(now, dt);
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
    drawSeason(now);
    if(AP().sleeping) px(0,0,160,200,'rgba(10,8,30,0.35)');
    drawParticles(dt);
    drawHUD(now);
    drawModals(now);
    if(UI.mode==='main' && !offlineReport && !UI.expReport && EVO_QUEUE.length) playNextEvo();
  }
  requestAnimationFrame(frame);
}

/* ---------------- ARRANQUE ---------------- */
/* aplica TODOS los valores por defecto a una partida cargada.
   Único lugar donde se hace — el arnés lo prueba con guardados viejos */
function normalizeSave(g){
  g.wild = null;
  if(!g.sel || g.sel>=g.pets.length) g.sel = 0;
  g.ach = g.ach||{}; g.bond = g.bond||0;
  g.relics = g.relics||{}; g.expedsDone = g.expedsDone||0;
  g.bossesWon = g.bossesWon||0; g.bossDue = g.bossDue||false;
  g.toys = g.toys||{}; g.foodsTried = g.foodsTried||{};
  if(g.ballX===undefined) g.ballX = 80;
  g.ballVX = 0; g.cajaReadyAt = g.cajaReadyAt||0;
  g.giftStreak = g.giftStreak||0; g.lastGift = g.lastGift||null;
  g.hats = g.hats||{}; g.daily = g.daily||null;
  g.buhoNextAt = g.buhoNextAt||0; g.buho = g.buho||null;
  g.discos = g.discos||{prado:true}; g.disco = g.disco||'prado'; g.games = g.games||{};
  g.beast = g.beast||{}; g.best = g.best||{}; g.huertoReadyAt = g.huertoReadyAt||0;
  g.tower = g.tower||null; g.towerNextAt = g.towerNextAt||0;
  if(g.sound===undefined) g.sound = g.muted ? 0 : 2;
  g.weekly = g.weekly||null; g.legacy = g.legacy||[];
  for(const p of g.pets){
    p.swingT=0; p.kickAt=0;
    p.hat = p.hat||null;
    if(p.str===undefined) p.str = p.discipline||0;
    p.def = p.def||0; p.spd = p.spd||0;
    if(!p.trait) p.trait = TRAIT_KEYS[Math.floor(Math.random()*TRAIT_KEYS.length)];
    p.rx = p.rx||80; p.dropT=0; p.eatT=0; p.trainT=0; p.petT=0; p.joyAt=0; p.blinkAt=0;
  }
  return g;
}

(async function init(){
  buildAllSprites();
  buildEnemySprites();
  const saved = await loadGame();
  if(saved && saved.v===5){
    G = normalizeSave(saved);
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
  if('serviceWorker' in navigator && location.protocol==='https:'){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) checkUpdate(); });
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) saveGame(); });
  window.addEventListener('pagehide', ()=>{ saveGame(); });
  requestAnimationFrame(frame);
})();
