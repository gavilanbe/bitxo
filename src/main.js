"use strict";
/* =========================================================
   BITXO — main: bucle principal y arranque
   ========================================================= */
/* ---------------- BUCLE ---------------- */
/* pantallas modales sobre el prado: fondo atenuado + deslizamiento al abrir */
/* a dónde vuelve cada pantalla al cerrarse con la X */
const MENU_PARENT = {
  stats:'main', album:'stats', ach:'stats', relics:'stats', beast:'stats',
  ascendConfirm:'stats', parqueConfirm:'main', huertaConfirm:'main', travelPick:'main',
  shop:'main', feed:'main', play:'main',
  quests:'main', buho:'main', discos:'games',
  games:'play', exped:'play', tower:'play', legacy:'main',
  diary:'stats', rename:'stats', constel:'main'
};
const MENU_DRAW = {
  stats:drawStats, album:drawAlbum, ach:drawAch, relics:drawRelics,
  exped:drawExped, ascendConfirm:drawAscendConfirm, parqueConfirm:drawParqueConfirm,
  huertaConfirm:drawHuertaConfirm, travelPick:drawTravelPick,
  shop:drawShop, feed:drawFeedMenu, play:drawPlayMenu,
  quests:drawQuests, buho:drawBuhoShop,
  discos:drawDiscos, evotree:drawEvoTree,
  beast:drawBeast, games:drawGames,
  tower:drawTower, legacy:drawLegacy,
  diary:drawDiary, rename:drawRename, constel:drawConstel
};
/* el mundo visible: escena + habitantes de la zona actual */
function drawWorldScene(now){
  drawScene(now);
  drawShoot(now);
  drawPoops(now);
  drawToys(now);
  drawSign(now);
  drawSparkles(now);
  drawWild(now);
  drawBuho(now);
  drawPets(now);
}
function drawModals(now){
  const menuFn = MENU_DRAW[UI.mode] || null;
  const repFn = offlineReport ? drawOfflineReport : (UI.expReport ? drawExpReport : null);
  if(!menuFn && !repFn){ UI.menuKey = null; return; }
  const key = UI.mode + (repFn ? '+rep' : '');
  if(UI.menuKey !== key){
    /* cada panel entra con un "fuu" de papel */
    if(!UI.menuKey) nz(sfxAt(0), 0.09, 0.018, 1800, 0.8, 4200);
    else tone({f:700, slide:900, d:0.04, type:'p125', vol:0.015});
    UI.menuKey = key; UI.menuAt = now;
  }
  const pr = Math.min(1, (now - UI.menuAt)/150);
  const e = 1 - Math.pow(1-pr, 3);
  ctx.fillStyle = 'rgba(8,9,28,' + (0.5*e).toFixed(3) + ')';
  ctx.fillRect(0, 0, LW, LH);
  ctx.save();
  /* entra desde abajo con rebote; si algo se deniega, el panel dice que no */
  const pe = ease.outBack(Math.min(1, (now - UI.menuAt)/260));
  const deny = Math.round(springOff(UI.denyAt, 3, now));
  ctx.translate(deny, Math.round((1-pe)*18));
  if(menuFn){
    menuFn();
    UI.panelMode = UI.mode;
    if(MENU_PARENT[UI.mode]) drawCloseBadge();
    else UI.closeAt = null;
  } else UI.closeAt = null;
  if(repFn) repFn();
  ctx.restore();
}
function frame(now){
  const rdt = Math.min(100, now - lastT);
  lastT = now;
  /* dt de JUEGO: se congela durante un hitstop; el juice usa el real */
  const dt = juiceStep(rdt);
  wipeCheck();
  liveUpdate(dt);
  const shaking = JUICE.sx!==0 || JUICE.sy!==0;
  if(shaking) px(0,0,LW,LH,K);
  ctx.save();
  ctx.translate(JUICE.sx, JUICE.sy);

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
  } else if(UI.mode==='mgMemo'){
    drawMemo(now, dt);
  } else if(UI.mode==='mgGlobo'){
    drawGlobo(now, dt);
  } else if(UI.mode==='train'){
    drawPark(now, dt);
  } else {
    if(UI.zoneSlide){
      /* cambio de zona: la cámara se desliza estilo Zelda */
      UI.zoneSlide.t += dt;
      const spr = Math.min(1, UI.zoneSlide.t/280);
      const se = 1 - Math.pow(1-spr, 3);
      const sdir = UI.zoneSlide.dir;
      ctx.save();
      ctx.beginPath(); ctx.rect(0,0,LW,196); ctx.clip();
      const realZone = G.zone;
      ctx.save();
      ctx.translate(Math.round(-sdir*se*LW), 0);
      G.zone = UI.zoneSlide.from; drawWorldScene(now); G.zone = realZone;
      ctx.restore();
      ctx.save();
      ctx.translate(Math.round(sdir*(1-se)*LW), 0);
      drawWorldScene(now);
      ctx.restore();
      ctx.restore();
      if(spr>=1) UI.zoneSlide = null;
    } else {
      drawWorldScene(now);
    }
    drawWeather(now);
    drawSeason(now);
    /* la noche del cuarto baja y sube despacio */
    UI.dimA = (UI.dimA||0) + ((AP().sleeping?0.38:0) - (UI.dimA||0))*Math.min(1, rdt/260);
    if(UI.dimA>0.01) px(0,0,160,196,'rgba(10,8,30,'+UI.dimA.toFixed(3)+')');
    drawVignette();
    drawParticles(dt);
    drawFx(rdt); JUICE.fxDrawn = true;
    /* el HUD no tiembla: se lee siempre */
    ctx.restore(); ctx.save();
    drawHUD(now);
    drawModals(now);
    if(UI.mode==='main' && !offlineReport && !UI.expReport && EVO_QUEUE.length) playNextEvo();
  }
  ctx.restore();
  /* los avisos van por encima de TODO: menús, combate y minijuegos */
  if(UI.mode!=='boot') drawToast(now);
  drawJuiceOverlay(rdt);
  updateTick(now);
  requestAnimationFrame(frame);
}

/* ---------------- ACTUALIZAR SIN SUSTOS ---------------- */
function safeToReload(){
  return sceneFamily(UI.mode)==='world' && !MENU_DRAW[UI.mode] && !offlineReport && !UI.expReport &&
         !EVO_QUEUE.length && !UI.carry && !UI.zoneSlide;
}
function applyUpdate(){
  if(UI.updating) return;
  UI.updating = performance.now();
  try{ sessionStorage.setItem('bitxo-upd', String(UPDATE_READY)); }catch(e){}
  saveGame();
  setTimeout(()=>{ location.replace(location.pathname + '?u=' + encodeURIComponent(UPDATE_READY)); }, 450);
}
function updateTick(now){
  if(UI.autoUpdate && UPDATE_READY && safeToReload()) applyUpdate();
  if(!UI.updating) return;
  /* telón: el prado se funde y aparece el aviso */
  const k = Math.min(1, (now-UI.updating)/300);
  ctx.fillStyle = 'rgba(14,16,48,'+(0.85*k).toFixed(3)+')'; ctx.fillRect(0,0,LW,LH);
  drawTextOC('ACTUALIZANDO', 80, 124, '#ffd94a', 2);
  const d = Math.floor(now/200)%4;
  drawTextC('EL PRADO SE PONE GUAPO'+'...'.slice(0,d), 80, 142, '#f6efe0');
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
  g.decor = g.decor||{owned:{}, flores:'clasico', valla:false, camino:false, cielo:false};
  g.diary = g.diary||[];
  g.zonesOpen = g.zonesOpen||{};
  if(!g.zone || (g.zone!=='prado' && !g.zonesOpen[g.zone])) g.zone = 'prado';
  g.combos3 = g.combos3||0; g.parries = g.parries||0; g.harvests = g.harvests||0;
  g.items = g.items||[]; g.criaNextAt = g.criaNextAt||0; g.slowRing = !!g.slowRing;
  g.eggWaiting = g.eggWaiting||null;
  /* CONSTELACION: partidas de antes reciben polvo = estrellas ya ganadas */
  if(!g.constel || typeof g.constel!=='object') g.constel = {pts: g.stars||0, nodes:{}, guide:null};
  g.constel.nodes = g.constel.nodes||{}; g.constel.pts = g.constel.pts||0;
  if(g.constel.guide===undefined) g.constel.guide = null;
  g.poops = g.poops||[];
  for(const pp of g.poops) pp.zone = pp.zone||'prado';
  for(const p of g.pets){
    p.swingT=0; p.kickAt=0; p.wokeAt = p.wokeAt||0; p.sickAway = p.sickAway||0;
    p.hat = p.hat||null;
    if(p.str===undefined) p.str = p.discipline||0;
    p.def = p.def||0; p.spd = p.spd||0;
    if(!p.trait) p.trait = TRAIT_KEYS[Math.floor(Math.random()*TRAIT_KEYS.length)];
    p.rx = p.rx||80; p.dropT=0; p.eatT=0; p.trainT=0; p.petT=0; p.joyAt=0; p.blinkAt=0;
    if(!p.zone || (p.zone!=='prado' && !g.zonesOpen[p.zone])) p.zone = 'prado';
  }
  return g;
}

(async function init(){
  buildAllSprites();
  buildEnemySprites();
  /* arte que vive en su propio archivo (data/art/): pisa lo anterior */
  if(typeof buildToyArt==='function') buildToyArt();
  if(typeof buildEnemyArt==='function') buildEnemyArt();
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
  /* la PWA actualiza en silencio (SW red-primero): al arrancar con una
     versión nueva, que se note — aviso con la novedad y entrada en el diario */
  try{
    const seen = localStorage.getItem('bitxo-ver');
    if(seen && seen !== GAME_VERSION){
      toast('¡PRADO ACTUALIZADO!', 3000);
      diaryLog('EL PRADO SE ACTUALIZO');
      fetch('version.json?t='+Date.now(), {cache:'no-store'})
        .then(r=>r.json())
        .then(j=>{ if(j.note){ const n = String(j.note).toUpperCase(); toast('NOVEDAD: '+n, 5200); diaryLog('NOVEDAD: '+n.slice(0,30)); saveGame(); } })
        .catch(()=>{});
      saveGame();
    }
    localStorage.setItem('bitxo-ver', GAME_VERSION);
    /* la URL de recarga forzada (?u=) no se queda en la barra */
    if(/[?&]u=/.test(location.search)) history.replaceState(null, '', location.pathname);
  }catch(e){}
  /* ---- actualizaciones ----
     version.json (sin caché) dice si hay versión nueva. Al ENTRAR o VOLVER
     a la app se aplica sola en cuanto es seguro (en el prado, sin paneles ni
     cinemáticas): guarda, muestra "ACTUALIZANDO" y recarga saltándose la
     caché HTTP. A mitad de partida solo aparece el aviso para tocar. */
  async function checkUpdate(auto){
    try{
      const r = await fetch('version.json?t='+Date.now(), {cache:'no-store'});
      if(!r.ok) return;
      const j = await r.json();
      if(j.v && String(j.v)!==GAME_VERSION){
        UPDATE_READY = String(j.v);
        /* un solo intento automático por versión: si la CDN aún sirve lo
           viejo, no entramos en bucle (queda el aviso manual) */
        let tried = null; try{ tried = sessionStorage.getItem('bitxo-upd'); }catch(e){}
        if(auto && tried!==UPDATE_READY) UI.autoUpdate = true;
      }
      if('serviceWorker' in navigator){
        navigator.serviceWorker.getRegistration().then(g=>{ if(g) g.update(); }).catch(()=>{});
      }
    }catch(e){}
  }
  checkUpdate(true);
  setInterval(()=>checkUpdate(false), 5*60*1000);
  if('serviceWorker' in navigator && location.protocol==='https:'){
    navigator.serviceWorker.register('sw.js', {updateViaCache:'none'}).catch(()=>{});
  }
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) checkUpdate(true); });
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) saveGame(); });
  /* al volver (pestaña/PWA): simula el hueco con applyElapsed y guarda */
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden || !G || UI.mode==='boot') return;
    catchUp(); saveGame();
  });
  window.addEventListener('pagehide', ()=>{ saveGame(); });
  requestAnimationFrame(frame);
})();
