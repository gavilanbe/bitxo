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
  if(UI.mode==='evolve'){
    if(UI.evoT > 4900){ UI.mode='main'; UI.evo=null; }
    else if(UI.evoT < 3900) UI.evoT = 3900; /* saltar al estallido */
    return;
  }
  if(UI.mode==='ascendFX'){ if(UI.ascT>4200){ finishAscend(); } return; }
  if(UI.mode==='battle'){ battleTap(); return; }
  if(UI.mode==='album'){
    const r = Math.floor((y-33)/27);
    if(r>=0 && r<LINE_KEYS.length && y>=33 && y<222){
      UI.evoLine = r; UI.evoSel = 0; UI.mode='evotree'; SFX.tap(); return;
    }
    UI.mode='stats'; SFX.tap(); return;
  }
  if(UI.mode==='ach'){ UI.mode='stats'; SFX.tap(); return; }
  if(UI.mode==='relics'){ UI.mode='stats'; SFX.tap(); return; }
  if(UI.mode==='quests'){
    if(x>=16 && x<=144 && y>=62 && y<146){
      const i = Math.floor((y-62)/28);
      if(i>=0 && i<3){ claimQuest(i); return; }
    }
    if(x>=16 && x<=144 && y>=158 && y<=183){ claimWeekly(); return; }
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
  /* insignia X: cierra cualquier panel hacia su pantalla madre */
  if(MENU_PARENT[UI.mode] && UI.closeAt &&
     Math.abs(x-UI.closeAt.x)<=8 && Math.abs(y-UI.closeAt.y)<=8){
    UI.mode = MENU_PARENT[UI.mode];
    SFX.tap(); vibrate(10);
    return;
  }
  if(UI.mode==='ascendConfirm'){
    if(y>150 && y<175){
      if(x<80){ doAscend(); } else { UI.mode='stats'; SFX.tap(); }
    } else { UI.mode='stats'; SFX.tap(); }
    return;
  }
  if(UI.mode==='parqueConfirm'){
    if(y>150 && y<174){
      if(x<80){ openParque(); } else { UI.mode='main'; SFX.tap(); }
    } else { UI.mode='main'; SFX.tap(); }
    return;
  }
  if(UI.mode==='beast'){
    if(x>=9 && x<=151 && y>=35 && y<217){
      const i = Math.floor((y-35)/14);
      if(i>=0 && i<BEAST_ORDER.length){
        const k = BEAST_ORDER[i];
        if(G.beast && G.beast[k] && G.beast[k].seen>0){
          /* revancha: a tu nivel actual +1 */
          const pp2 = playerPower(AP());
          G.wild = {kind:k, nv:Math.max(1,pp2+1), elite:false, boss:!!ENEMIES[k].boss, revenge:true, zone:G.zone,
                    x:110, tx:110, arriveAt:Date.now(), stealAt:Date.now()+9e9, dir:-1};
          startBattle();
          if(UI.mode!=='battle'){ G.wild = null; UI.mode = 'beast'; }
          return;
        }
      }
    }
    UI.mode='stats'; SFX.tap(); return;
  }
  if(UI.mode==='stats'){
    if(y>168 && y<184){
      UI.mode = x<33 ? 'album' : (x<63 ? 'ach' : (x<93 ? 'relics' : (x<123 ? 'beast' : 'diary')));
      SFX.tap(); return;
    }
    if(y>=26 && y<=40 && x>40 && x<120 && AP().stage>STAGES.EGG){
      UI.nickBuf = AP().nick || '';
      UI.mode = 'rename'; SFX.tap(); return;
    }
    if(canAscend() && y>186 && y<204){ UI.mode='ascendConfirm'; SFX.tap(); return; }
    if(y>=205 && y<=222){
      if(x>=12 && x<56){ exportSave(); return; }
      if(x>=58 && x<102){ importSave(); return; }
      if(x>=104 && x<148){ takePhoto(); return; }
    }
    UI.mode='main'; SFX.tap(); return;
  }
  if(UI.mode==='shop'){
    if(y>=50 && y<=61 && x>=8 && x<=154){ UI.shopTab = x<45?0:(x<82?1:(x<119?2:3)); SFX.tap(); return; }
    if(y<38 || y>216){ UI.mode='main'; SFX.tap(); return; }
    const tab = UI.shopTab||0;
    if(tab===0){
      const i = Math.floor((y-64)/19);
      if(i>=0 && i<SHOP.length) buyUpgrade(i);
    } else if(tab===1){
      const i = Math.floor((y-64)/16);
      if(i>=0 && i<TOYS.length) buyToy(i);
    } else if(tab===2){
      const col = x<80 ? 0 : 1;
      const row = Math.floor((y-64)/25);
      const i = row*2 + col;
      if(row>=0 && i>=0 && i<HATS.length) tapHat(i);
    } else {
      const i = Math.floor((y-64)/22);
      if(i>=0 && i<DECOR.length) tapDecor(i);
    }
    return;
  }
  if(UI.mode==='feed'){
    if(y>=216 && y<=229 && x>=10 && x<=150){ giveMedicine(); return; }
    const col = x>=10 && x<78 ? 0 : (x>=82 && x<150 ? 1 : -1);
    const row = Math.floor((y-46)/42);
    if(col>=0 && row>=0 && row<4 && y>=46 && y<214){
      doFeed(row*2+col);
    } else { UI.mode='main'; }
    SFX.tap(); return;
  }
  if(UI.mode==='play'){
    if(x>=26 && x<=134 && y>=80 && y<228){
      const i = Math.floor((y-80)/38);
      if(i===0){ UI.mode='train'; SFX.tap(); return; }
      if(i===1){ UI.mode='games'; SFX.tap(); return; }
      if(i===2){
        if(AP().stage<STAGES.CHILD){ toast('AUN ES MUY PEQUENO'); SFX.nope(); return; }
        UI.mode='exped'; SFX.tap(); return;
      }
      if(i===3){
        if(G.battlesWon < TOWER.unlockWins){ toast('GANA '+TOWER.unlockWins+' COMBATES ANTES'); SFX.nope(); return; }
        UI.mode='tower'; SFX.tap(); return;
      }
    }
    UI.mode='main'; SFX.tap(); return;
  }
  if(UI.mode==='tower'){
    if(!G.tower){
      if(x>=60 && x<=140 && y>=160 && y<=178){ towerEnter(); return; }
    } else {
      if(x>=60 && x<=140 && y>=130 && y<=148){ towerLaunch(); return; }
      if(x>=60 && x<=140 && y>=152 && y<=166){ towerAbandon(); return; }
    }
    UI.mode='play'; SFX.tap(); return;
  }
  if(UI.mode==='legacy'){ UI.mode='main'; SFX.tap(); return; }
  if(UI.mode==='diary'){ UI.mode='stats'; SFX.tap(); return; }
  if(UI.mode==='rename'){
    const buf = UI.nickBuf||'';
    if(y>=86 && y<162 && x>=13 && x<=146){
      /* teclas */
      if(y<143){
        const col = Math.floor((x-13)/19), row = Math.floor((y-86)/19);
        const i = row*7 + col;
        if(col>=0 && col<7 && i<26 && buf.length<8){
          UI.nickBuf = buf + RENAME_KEYS[i];
          SFX.tap(); vibrate(8);
        }
        return;
      }
      if(y>=143 && y<=159 && x>=89 && x<=115){
        UI.nickBuf = buf.slice(0,-1); SFX.tap(); return;
      }
      return;
    }
    if(y>=168 && y<=186 && x>=24 && x<=136){
      AP().nick = buf.length ? buf : null;
      toast(buf.length ? '¡SE LLAMA '+buf+'!' : 'NOMBRE DE ESPECIE');
      if(buf.length) diaryLog('BAUTIZADO COMO '+buf);
      SFX.yay(); saveGame();
      UI.mode = 'stats'; return;
    }
    UI.mode='stats'; SFX.tap(); return;
  }
  if(UI.mode==='games'){
    if(x>=10 && x<=151 && y>=72 && y<192){
      const col = Math.floor((x-10)/47), row = Math.floor((y-72)/62);
      const i = row*3 + col;
      if(col>=0 && col<3 && row>=0 && row<2 && i<MINIGAMES.length){
        const M = MINIGAMES[i];
        const owned = !M.gkey || !!G.games[M.gkey];
        if(!owned){ buyGame(M.gkey, M.cost); return; }
        if(M.id==='mgCatch') startCatch();
        else if(M.id==='mgDance') UI.mode='discos';
        else if(M.id==='mgSimon') startSimon();
        else if(M.id==='mgJump') startJump();
        else if(M.id==='mgTopo') startTopo();
        else if(M.id==='mgPesca') startPesca();
        SFX.tap(); return;
      }
    }
    UI.mode='play'; SFX.tap(); return;
  }
  if(UI.mode==='train'){
    if(y<16 && x<48){ UI.mode='play'; UI.park=null; SFX.tap(); return; }
    const pk = UI.park || (UI.park = {phase:'idle', px:80, t:0});
    if(pk.phase==='idle' && y>=104 && y<=180){
      let kind=null, tx=0;
      if(x>=18 && x<52){ kind='str'; tx=36; }
      else if(x>=64 && x<100){ kind='def'; tx=76; }
      else if(x>=106 && x<146){ kind='spd'; tx=118; }
      if(kind){
        const r = trainEffect(kind);
        if(r){ pk.phase='walk'; pk.kind=kind; pk.tx=tx; pk.t=0; pk.gain=r.gain; SFX.tap(); }
        return;
      }
    }
    return;
  }
  if(UI.mode==='discos'){
    if(x>=14 && x<=146 && y>=71 && y<196){
      const i = Math.floor((y-71)/25);
      if(i>=0 && i<DISCOS.length){
        if(x>=126){ previewDisco(i); return; }
        if(G.discos[DISCOS[i].id]){ G.disco = DISCOS[i].id; startDance(i); saveGame(); return; }
        buyDisco(i); return;
      }
    }
    UI.mode='games'; SFX.tap(); return;
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
  if(UI.mode==='mgTopo'){ topoTap(x, y); return; }
  if(UI.mode==='mgPesca'){ pescaTap(); return; }
  if(UI.mode==='exped'){
    if(x>14 && x<146 && y>66 && y<206){
      const i = Math.floor((y-66)/28);
      if(i>=0 && i<EXPEDS.length){ sendExpedition(i); return; }
    }
    UI.mode='play'; SFX.tap(); return;
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
  if(UPDATE_READY && y>=22 && y<=36 && x>26 && x<134){ saveGame(); location.reload(); return; }
  if(x>142 && y<16){
    G.sound = G.sound===undefined ? 1 : (G.sound+2)%3; /* 2→1→0→2 */
    G.muted = G.sound===0;
    applyVolume();
    toast(['SILENCIO','VOLUMEN BAJO','VOLUMEN ALTO'][G.sound]);
    saveGame(); return;
  }

  if(y>BTN_Y-4 && y<BTN_Y+BTN_S+8){
    const i = Math.floor((x-4)/26);
    if(i>=0 && i<6){
      UI.flashBtn=i; UI.flashUntil=now+150;
      SFX.tap(); vibrate(15);
      BTNS[i].fn();
      return;
    }
  }
  /* la constelación: tu dinastía */
  if(y>18 && y<62 && G.ascensions>0 && !UI.shoot){
    UI.mode='legacy'; SFX.tap(); return;
  }
  /* estrella fugaz */
  if(UI.shoot && Math.abs(x-UI.shoot.x)<15 && Math.abs(y-UI.shoot.y)<15){
    const g = Math.round(25*legacyMult()) * (G.relics.lagrima?2:1) * (G.starShower?2:1);
    gainMotas(g, UI.shoot.x, UI.shoot.y);
    toast('¡DESEO CONCEDIDO! +'+g+'✦', 2800);
    SFX.wish(); vibrate([20,20,40]);
    UI.shoot = null;
    return;
  }
  /* juguetes */
  if(G.toys && G.toys.pelota && toyZone('pelota')===G.zone && Math.abs(x-G.ballX)<10 && y>140 && y<170){
    G.ballVX = (x < G.ballX ? 1 : -1) * (0.09+Math.random()*0.05);
    SFX.ballKick(); vibrate(12);
    return;
  }
  if(G.toys && G.toys.caja && toyZone('caja')===G.zone && x>96 && x<116 && y>134 && y<166){
    if(Date.now() >= (G.cajaReadyAt||0)){ openCaja(); }
    else {
      const mns = Math.ceil((G.cajaReadyAt-Date.now())/60000);
      toast('CAJA LISTA EN '+mns+'M');
    }
    return;
  }
  /* huerto: cosechar la fruta */
  if(G.toys && G.toys.huerto && toyZone('huerto')===G.zone && x>72 && x<98 && y>134 && y<166 &&
     !G.pets.some(q=>q.stage>STAGES.EGG && Math.abs(x-q.rx)<9)){
    if(Date.now() >= (G.huertoReadyAt||0)){
      const p2 = AP();
      if(p2.stage===STAGES.EGG){ toast('EL HUEVO NO COME'); return; }
      p2.hunger = Math.min(100, p2.hunger+20);
      p2.happy = Math.min(100, p2.happy+4);
      p2.energy = Math.min(100, p2.energy+10);
      p2.eatT = 1600; p2.feedKind = 'fruta';
      gainXP(6);
      G.foodsTried.fruta = true;
      G.huertoReadyAt = Date.now() + 2*3600*1000;
      toast('¡FRUTA DEL HUERTO!');
      SFX.eatFood('fruta'); vibrate(15); saveGame();
    } else {
      const mns = Math.ceil((G.huertoReadyAt-Date.now())/60000);
      toast('FRUTA EN '+(mns>=60? Math.ceil(mns/60)+'H' : mns+'M'));
    }
    return;
  }
  /* cartel de misiones */
  if(G.zone==='prado' && x>141 && y>135 && y<165){ UI.mode='quests'; SFX.tap(); vibrate(10); return; }
  /* sendero y flechas: ir y volver del parque */
  if(y>166 && y<198){
    if(G.zone==='prado' && x>=144){
      if(G.zonesOpen.parque){
        gotoZone('parque'); toast(ZONES.parque.name, 1300); SFX.tap(); vibrate(10);
        return;
      }
      if(Object.keys(G.toys).length>=1){ tapSendero(); return; }
    }
    if(G.zone==='parque' && x<=14){
      gotoZone('prado'); toast(ZONES.prado.name, 1300); SFX.tap(); vibrate(10);
      return;
    }
  }
  /* chispas */
  for(let i=UI.sparkles.length-1;i>=0;i--){
    const s = UI.sparkles[i];
    if((s.zone||'prado')!==G.zone) continue;
    if(Math.abs(x-s.x)<11 && Math.abs(y-s.y)<11){
      gainMotas(tapYield() * (AP().line==='voltio' && AP().stage>STAGES.EGG ? 2 : 1), s.x, s.y);
      gainXP(AP().trait==='CURIOSO'?4:2); SFX.coin(); vibrate(10);
      questProg('chispas', 1);
      UI.sparkles.splice(i,1);
      return;
    }
  }
  /* el buhonero */
  if(G.buho && G.zone==='prado' && y>118 && y<175 && Math.abs(x-G.buho.x)<13){
    UI.mode='buho'; SFX.tap(); vibrate(10); return;
  }
  /* bicho salvaje */
  if(G.wild && (G.wild.zone||'prado')===G.zone && y>120 && y<175 && Math.abs(x-G.wild.x)<16){
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

/* ---------------- TECLADO (escritorio) ---------------- */
document.addEventListener('keydown', ev=>{
  if(!G || UI.mode==='boot') return;
  const k = ev.key;
  if(k>='1' && k<='6' && UI.mode==='main'){
    audio();
    const i = +k-1;
    UI.flashBtn = i; UI.flashUntil = performance.now()+150;
    SFX.tap(); BTNS[i].fn();
  } else if(k==='m' || k==='M'){
    handleTap(150, 8);
  } else if(k==='ArrowRight' && UI.mode==='main' && G.zone==='prado' && G.zonesOpen.parque){
    audio();
    gotoZone('parque'); toast(ZONES.parque.name, 1300); SFX.tap();
  } else if(k==='ArrowLeft' && UI.mode==='main' && G.zone==='parque'){
    audio();
    gotoZone('prado'); toast(ZONES.prado.name, 1300); SFX.tap();
  } else if(k==='Escape' && MENU_PARENT[UI.mode]){
    UI.mode = MENU_PARENT[UI.mode];
    SFX.tap();
  }
});
