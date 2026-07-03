"use strict";
/* =========================================================
   BITXO — input: botonera y gestión de toques
   ========================================================= */
/* ---------------- ENTRADA ---------------- */
const BTNS = [
  {ic:'feed', label:'COMER', fn:()=>{ if(eggGuard()||awayGuard())return; UI.mode='feed'; }},
  {ic:'play', label:'JUGAR', fn:()=>{ if(eggGuard()||awayGuard())return; UI.mode='play'; }},
  {ic:'clean',label:'LIMPIAR', fn:()=>{ doClean(); }},
  {ic:'sleep',label:'LUZ', fn:()=>{ if(eggGuard()||awayGuard())return; doSleepToggle(); }},
  {ic:'shop', label:'TIENDA', fn:()=>{ UI.mode='shop'; if(!G.hints.shop){G.hints.shop=true;} }},
  {ic:'stats',label:'DATOS', fn:()=>{ UI.mode='stats'; }}
];
function eggGuard(){ if(AP().stage===STAGES.EGG){ toast('AUN ES UN HUEVO'); return true; } return false; }
function awayGuard(){ if(AP().exped){ toast('ESTA DE EXPEDICION'); return true; } return false; }
const BTN_Y = 240, BTN_S = 22;

function canvasPos(ev){
  const r = cv.getBoundingClientRect();
  const t = ev.touches ? ev.touches[0] : ev;
  return { x:(t.clientX-r.left)/SCALE, y:(t.clientY-r.top)/SCALE };
}
cv.addEventListener('pointerdown', ev=>{
  ev.preventDefault();
  audio();
  const p = canvasPos(ev);
  handleTap(p.x, p.y);
});

function handleTap(x,y){
  const now = performance.now();
  if(UI.mode==='boot') return;
  if(offlineReport){ offlineReport=null; SFX.tap(); return; }
  if(UI.expReport){ UI.expReport=null; SFX.tap(); return; }
  if(UI.mode==='hatch'){ if(UI.hatchT>1500) UI.mode='main'; return; }
  if(UI.mode==='evolve'){ if(UI.evoT>2600) UI.mode='main'; return; }
  if(UI.mode==='ascendFX'){ if(UI.ascT>4200){ finishAscend(); } return; }
  if(UI.mode==='battle'){ battleTap(); return; }
  if(UI.mode==='album'){
    const r = Math.floor((y-38)/31);
    if(r>=0 && r<LINE_KEYS.length && y>=38 && y<195){
      UI.evoLine = r; UI.evoSel = 0; UI.mode='evotree'; SFX.tap(); return;
    }
    UI.mode='stats'; SFX.tap(); return;
  }
  if(UI.mode==='ach'){ UI.mode='stats'; SFX.tap(); return; }
  if(UI.mode==='relics'){ UI.mode='stats'; SFX.tap(); return; }
  if(UI.mode==='quests'){
    if(x>=16 && x<=144 && y>=76 && y<160){
      const i = Math.floor((y-76)/28);
      if(i>=0 && i<3){ claimQuest(i); return; }
    }
    UI.mode='main'; SFX.tap(); return;
  }
  if(UI.mode==='buho'){
    if(!G.buho){ UI.mode='main'; return; }
    if(x>=14 && x<=146 && y>=78 && y<168){
      const i = Math.floor((y-78)/30);
      if(i>=0 && i<G.buho.offers.length){ buyBuhoOffer(i); return; }
    }
    UI.mode='main'; SFX.tap(); return;
  }
  if(UI.mode==='ascendConfirm'){
    if(y>150 && y<175){
      if(x<80){ doAscend(); } else { UI.mode='stats'; SFX.tap(); }
    } else { UI.mode='stats'; SFX.tap(); }
    return;
  }
  if(UI.mode==='stats'){
    if(y>168 && y<184){ UI.mode = x<54 ? 'album' : (x<105 ? 'ach' : 'relics'); SFX.tap(); return; }
    if(canAscend() && y>186 && y<204){ UI.mode='ascendConfirm'; SFX.tap(); return; }
    UI.mode='main'; SFX.tap(); return;
  }
  if(UI.mode==='shop'){
    if(y>=50 && y<=61 && x>=10 && x<=150){ UI.shopTab = x<57?0:(x<104?1:2); SFX.tap(); return; }
    if(y<38 || y>216){ UI.mode='main'; SFX.tap(); return; }
    const tab = UI.shopTab||0;
    if(tab===0){
      const i = Math.floor((y-64)/19);
      if(i>=0 && i<SHOP.length) buyUpgrade(i);
    } else if(tab===1){
      const i = Math.floor((y-64)/26);
      if(i>=0 && i<TOYS.length) buyToy(i);
    } else {
      const i = Math.floor((y-64)/24);
      if(i>=0 && i<HATS.length) tapHat(i);
    }
    return;
  }
  if(UI.mode==='feed'){
    const col = x>=10 && x<78 ? 0 : (x>=82 && x<150 ? 1 : -1);
    const row = Math.floor((y-46)/42);
    if(col>=0 && row>=0 && row<4 && y>=46 && y<214){
      doFeed(row*2+col);
    } else { UI.mode='main'; }
    SFX.tap(); return;
  }
  if(UI.mode==='play'){
    if(y>=94 && y<132){
      if(x<56) startCatch();
      else if(x<104) UI.mode='discos';
      else startSimon();
    } else if(y>=136 && y<174){
      if(x<56){ if(G.games.salta) startJump(); else buySalta(); }
      else if(x<104) UI.mode='train';
      else {
        if(AP().stage<STAGES.CHILD){ toast('AUN ES MUY PEQUENO'); SFX.nope(); }
        else UI.mode='exped';
      }
    }
    else { UI.mode='main'; }
    SFX.tap(); return;
  }
  if(UI.mode==='train'){
    if(x>=18 && x<=142 && y>=92 && y<176){
      const i = Math.floor((y-92)/28);
      if(i>=0 && i<3){ doTrain(['str','def','spd'][i]); return; }
    }
    UI.mode='play'; SFX.tap(); return;
  }
  if(UI.mode==='discos'){
    if(x>=14 && x<=146 && y>=76 && y<184){
      const i = Math.floor((y-76)/27);
      if(i>=0 && i<DISCOS.length){
        if(x>=126){ previewDisco(i); return; }
        if(G.discos[DISCOS[i].id]){ G.disco = DISCOS[i].id; startDance(i); saveGame(); return; }
        buyDisco(i); return;
      }
    }
    UI.mode='play'; SFX.tap(); return;
  }
  if(UI.mode==='evotree'){
    if(y<40){
      if(x<30){ UI.evoLine = ((UI.evoLine||0)+LINE_KEYS.length-1)%LINE_KEYS.length; UI.evoSel=0; SFX.tap(); return; }
      if(x>130){ UI.evoLine = ((UI.evoLine||0)+1)%LINE_KEYS.length; UI.evoSel=0; SFX.tap(); return; }
    }
    let best=-1, bd=15;
    for(let i=0;i<EVO_NODES.length;i++){
      const d = Math.abs(x-EVO_NODES[i].x)+Math.abs(y-EVO_NODES[i].y);
      if(d<bd){ bd=d; best=i; }
    }
    if(best>=0){ UI.evoSel=best; SFX.tap(); return; }
    UI.mode='album'; SFX.tap(); return;
  }
  if(UI.mode==='mgJump'){ jumpTap(); return; }
  if(UI.mode==='exped'){
    if(x>14 && x<146 && y>68 && y<196){
      const i = Math.floor((y-68)/32);
      if(i>=0 && i<EXPEDS.length){ sendExpedition(i); return; }
    }
    UI.mode='main'; SFX.tap(); return;
  }
  if(UI.mode==='mgCatch'){
    const m = UI.mg;
    if(m.ph==='play'){ m.tx = Math.max(16, Math.min(144, x)); }
    else if(m.ph==='end'){ UI.mode='main'; SFX.tap(); }
    return;
  }
  if(UI.mode==='mgDance'){
    const m = UI.mg;
    if(m.ph==='play'){
      const now = performance.now();
      let best=null, bd=1e9;
      for(const b of m.beats){ if(!b.hit){ const d=Math.abs(now-b.t); if(d<bd){bd=d; best=b;} } }
      if(best && bd<150){
        best.hit = bd<65? 3:1;
        m.score += best.hit; m.combo++;
        m.judge = bd<65? '¡PERFECTO!' : 'BIEN'; m.judgeT = now;
        tone({f:bd<65?1568:1175, d:0.1, vol:0.05, echo:bd<65?1:0, echoT:0.09});
        vibrate(bd<65?25:12);
      } else {
        m.combo=0; m.judge='FALLO'; m.judgeT=now; SFX.nope();
      }
    } else if(m.ph==='end'){ UI.mode='main'; SFX.tap(); }
    return;
  }
  if(UI.mode==='mgSimon'){
    const m = UI.mg;
    if(m.ph==='end'){ UI.mode='main'; SFX.tap(); return; }
    if(m.ph!=='input') return;
    for(let i=0;i<4;i++){
      const F = FLOWERS[i];
      if(Math.abs(x-F.x)<=20 && Math.abs(y-F.y)<=20){
        m.lit = i; m.litT = performance.now();
        beep(F.f, 0.22, 0, 'triangle', 0.08); vibrate(12);
        if(i === m.seq[m.idx]){
          m.idx++;
          if(m.idx === m.seq.length){
            m.round++;
            if(m.round>8){ simonFinish(); return; }
            m.seq.push(Math.floor(Math.random()*4));
            m.ph='show'; m.showI=0; m.showT=performance.now()+800;
            SFX.coin();
          }
        } else {
          SFX.nope(); vibrate(60);
          simonFinish();
        }
        return;
      }
    }
    return;
  }

  /* ---- modo principal ---- */
  if(x>142 && y<16){ G.muted=!G.muted; toast(G.muted?'SILENCIO':'SONIDO ON'); saveGame(); return; }

  if(y>BTN_Y-4 && y<BTN_Y+BTN_S+8){
    const i = Math.floor((x-4)/26);
    if(i>=0 && i<6){
      UI.flashBtn=i; UI.flashUntil=now+150;
      SFX.tap(); vibrate(15);
      BTNS[i].fn();
      return;
    }
  }
  /* estrella fugaz */
  if(UI.shoot && Math.abs(x-UI.shoot.x)<15 && Math.abs(y-UI.shoot.y)<15){
    const g = Math.round(25*legacyMult()) * (G.relics.lagrima?2:1);
    gainMotas(g, UI.shoot.x, UI.shoot.y);
    toast('¡DESEO CONCEDIDO! +'+g+'✦', 2800);
    SFX.wish(); vibrate([20,20,40]);
    UI.shoot = null;
    return;
  }
  /* juguetes */
  if(G.toys && G.toys.pelota && Math.abs(x-G.ballX)<10 && y>140 && y<170){
    G.ballVX = (x < G.ballX ? 1 : -1) * (0.09+Math.random()*0.05);
    SFX.ballKick(); vibrate(12);
    return;
  }
  if(G.toys && G.toys.caja && x>96 && x<116 && y>134 && y<166){
    if(Date.now() >= (G.cajaReadyAt||0)){ openCaja(); }
    else {
      const mns = Math.ceil((G.cajaReadyAt-Date.now())/60000);
      toast('CAJA LISTA EN '+mns+'M');
    }
    return;
  }
  /* cartel de misiones */
  if(x>141 && y>135 && y<165){ UI.mode='quests'; SFX.tap(); vibrate(10); return; }
  /* chispas */
  for(let i=UI.sparkles.length-1;i>=0;i--){
    const s = UI.sparkles[i];
    if(Math.abs(x-s.x)<11 && Math.abs(y-s.y)<11){
      gainMotas(tapYield(), s.x, s.y);
      gainXP(AP().trait==='CURIOSO'?4:2); SFX.coin(); vibrate(10);
      questProg('chispas', 1);
      UI.sparkles.splice(i,1);
      return;
    }
  }
  /* el buhonero */
  if(G.buho && y>118 && y<175 && Math.abs(x-G.buho.x)<13){
    UI.mode='buho'; SFX.tap(); vibrate(10); return;
  }
  /* bicho salvaje */
  if(G.wild && y>120 && y<175 && Math.abs(x-G.wild.x)<16){
    startBattle();
    return;
  }
  /* mascotas: seleccionar / acariciar / tocar huevo */
  if(y>105 && y<190){
    let best=-1, bd=27;
    for(let i=0;i<G.pets.length;i++){
      const d = Math.abs(x-G.pets[i].rx);
      if(d<bd){ bd=d; best=i; }
    }
    if(best>=0){
      const p = G.pets[best];
      if(best!==G.sel){
        G.sel = best; petVoice(p);
        toast(currentNameOf(p), 1200);
      } else if(p.exped){
        const m = Math.ceil((p.exped.until-Date.now())/60000);
        toast('VUELVE EN '+(m>=60? Math.ceil(m/60)+'H' : m+'M'));
      } else if(p.stage===STAGES.EGG){
        p.tapsOnEgg++; p.hop=now; SFX.tap(); vibrate(10);
      } else if(!p.sleeping){
        p.happy = Math.min(100, p.happy+2);
        spawnHearts(1); petVoice(p); p.petT = now;
        questProg('mimos', 1);
      }
    }
  }
}
