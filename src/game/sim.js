"use strict";
/* =========================================================
   BITXO — game/sim: simulación en vivo y eclosión
   ========================================================= */
/* ---------------- SIMULACIÓN EN VIVO ---------------- */
let lastT = performance.now();
let saveTimer=0, sparkleTimer=0, motaAcc=0, feederTimer=0, achTimer=0;
const poopTimers = {};
/* reloj de pared del último tick: si rAF se para (pestaña oculta, móvil
   dormido) el hueco se simula con applyElapsed ANTES de autoguardar */
let liveWall = 0;
const ROBOT_EVERY = 90*1000;
function catchUp(){
  if(!G) return;
  const now = Date.now();
  const ref = liveWall || G.lastSeen || now;
  liveWall = now;
  lastT = performance.now();
  if(now - ref > 5000) applyElapsed(now - ref);
}
/* ¿se puede abrir un huevo ya? solo en el prado, sin informes ni cinemáticas */
function hatchOk(){ return UI.mode==='main' && !offlineReport && !UI.expReport && !EVO_QUEUE.length; }
/* recoger una chispa: el MISMO premio al tocarla que con el IMAN */
function collectSparkle(i, auto){
  const s = UI.sparkles[i];
  if(!s) return 0;
  const got = tapYield() * (AP().line==='voltio' && AP().stage>STAGES.EGG ? 2 : 1);
  gainMotas(got, s.x, s.y);
  if(!auto){
    /* la mota estalla y sus chispas vuelan al marcador */
    flyCoins(s.x, s.y, Math.min(8, 2+got));
    burst(s.x, s.y, {n:10, cols:['#ffffff','#ffd94a','#fff8d0'], speed:0.09, g:0.0002, life:420, kind:'spark'});
    ringFx(s.x, s.y, '#fff8d0', 10, 260);
    hitstop(24); vibrate(10);
  }
  gainXP(AP().trait==='CURIOSO'?4:2); SFX.coin();
  questProg('chispas', 1);
  UI.sparkles.splice(i,1);
  return got;
}

function liveUpdate(dtMs){
  if(!G || UI.mode==='boot') return;
  const now = Date.now();
  if(liveWall && now - liveWall > 5000) catchUp();
  liveWall = now;
  if(UI.mode==='ascendFX') return;
  updateWeather(now);

  for(let i=G.pets.length-1;i>=0;i--){
    const p = G.pets[i];
    if(p.exped){
      if(now >= p.exped.until) resolveExpedition(p);
      continue;
    }
    if(p.stage===STAGES.EGG){
      if(performance.now()-p.dropT < 1100) continue;
      if((now - p.bornAt > T_HATCH || p.tapsOnEgg>=15) && hatchOk()) hatchPet(i);
      continue;
    }
    /* dormido se consume mucho menos: el sueño repara, no castiga */
    const drowse = p.sleeping ? 0.3 : 1;
    p.hunger = Math.max(0, p.hunger - hungerRate(p)*dtMs*drowse);
    p.happy  = Math.max(0, p.happy - happyDecayRate(p)*dtMs*drowse);
    if(p.sleeping){
      p.energy = Math.min(100, p.energy + sleepRegen(p)*dtMs);
      if(p.energy>=100){ p.sleeping=false; if(i===G.sel){ toast('¡BUENOS DIAS!'); SFX.yay(); } }
    } else {
      p.energy = Math.max(0, p.energy - energyRate(p)*dtMs);
      poopTimers[i] = (poopTimers[i]||0) + dtMs;
      if(poopTimers[i] > poopEvery(p)){
        poopTimers[i] = 0;
        if(G.poops.length<5){ G.poops.push({x:20+Math.random()*110, zone:p.zone||'prado'}); SFX.nope(); }
      }
      if(dayPhase()==='night' && p.energy<25 && UI.mode==='main' && now-(p.wokeAt||0) > 180000){
        p.sleeping = true; if(i===G.sel){ SFX.sleep(); toast('SE HA DORMIDO...'); }
      }
    }
    p.hygiene = Math.max(0, Math.min(100, p.hygiene - G.poops.length*ratePerMs(3)*hygMult(p)*dtMs + (G.poops.length===0? ratePerMs(24)*dtMs:0)));
    if(p.hunger<=0 && !p.hungerZeroSince){ p.hungerZeroSince = now; p.mistakes++; }
    if(p.hunger>0) p.hungerZeroSince=null;
    if(p.happy<=0 && !p.happyZeroSince){ p.happyZeroSince = now; p.mistakes++; }
    if(p.happy>0) p.happyZeroSince=null;
    if(p.hungerZeroSince && now-p.hungerZeroSince > RUNAWAY_AFTER){
      const nm = currentNameOf(p);
      toast(nm+' SE FUE EN BUSCA DE COMIDA...', 3600);
      diaryLog(nm+' SE FUE EN BUSCA DE COMIDA');
      SFX.bye(); spawnEgg(i, true); /* sin '¡HUEVO!' encima del adiós */
      if(G.sel>=G.pets.length) G.sel=0;
      continue;
    }
    /* la evolución espera a que estés en el prado: nada de transformarse
       en mitad del gym o de un minijuego */
    const evoOk = UI.mode==='main';
    /* crecer también es tiempo: XP pasiva hasta el nivel de madurez */
    const lvlGate = p.stage===STAGES.BABY ? EVO_LEVEL.child : (p.stage===STAGES.CHILD ? EVO_LEVEL.adult : 0);
    if(lvlGate && p.level<lvlGate){
      p.xpAcc = (p.xpAcc||0) + XP_TRICKLE_MS*trickleMult(p)*dtMs*(p.sleeping?0.3:1)*(p.sick?0.5:1);
      if(p.xpAcc>=1){
        const w = Math.floor(p.xpAcc); p.xpAcc -= w;
        gainXPFor(p, w);
      }
    }
    if(evoOk) checkEvolution(p, false);
    /* --- enfermedad: la lluvia sin cometa y la mugre pasan factura --- */
    if(!p.sick && p.stage>STAGES.EGG && !p.sleeping && !p.exped){
      let riesgo = 0;
      if(p.hygiene<25) riesgo++;
      if(WEATHER.kind==='rain' && !(G.toys && G.toys.cometa)) riesgo++;
      if(riesgo && Math.random() < dtMs*0.0000003*riesgo){
        p.sick = true; p.sickAt = now; p.sickPenal = false; p.sickAway = 0;
        diaryLog(petName(p)+' SE PUSO MALITO');
        toast('¡'+petName(p)+' SE HA PUESTO MALITO!', 3200);
        SFX.nope(); vibrate(30);
      }
    }
    if(p.sick){
      /* el fallo por enfermedad cuenta solo el tiempo que estabas aquí */
      if(!p.sickPenal && now-p.sickAt-(p.sickAway||0) > 4*3600*1000){ p.sickPenal = true; p.mistakes++; }
      if(now-p.sickAt > 10*3600*1000){ p.sick = false; } /* se cura solo, tarde */
    }
    /* --- el carácter se ve en el prado --- */
    if(UI.mode==='main' && petHere(p) && p.stage>STAGES.EGG && !p.sleeping && !p.exped && !p.eatT &&
       !(p.swingT>0) && !(p.batheT>0) && !(p.drinkT>0)){
      if(now > (p.traitAt||0)){
        p.traitAt = now + 9000 + Math.random()*14000;
        if(p.trait==='GLOTON' && p.hunger<85){
          p.thought = {icon:'meal', until: performance.now()+2000};
        } else if(p.trait==='JUGUETON'){
          if(dayPhase()!=='night'){ p.tx = 24+Math.random()*112; p.joyAt = performance.now(); }
          else p.thought = {icon:'ball', until: performance.now()+2000};
        } else if(p.trait==='DORMILON'){
          p.thought = {icon:'zzz', until: performance.now()+2000};
        } else if(p.trait==='CURIOSO'){
          const sp2 = UI.sparkles.find(s2=>(s2.zone||'prado')===G.zone);
          p.tx = sp2 ? Math.max(22,Math.min(138,sp2.x)) : 130;
          p.thought = {icon:'que', until: performance.now()+2000};
        } else if(p.trait==='VALIENTE' && !G.wild){
          p.joyAt = performance.now();
        }
      }
      if(G.wild && (G.wild.zone||'prado')===G.zone){
        if(p.trait==='VALIENTE' && Math.random() < dtMs*0.0004){
          p.tx = Math.max(22, Math.min(138, G.wild.x + (p.rx<G.wild.x ? -14 : 14)));
        }
        if(p.trait==='TIMIDO'){
          p.scaredT = now + 600;
          if(Math.random() < dtMs*0.0006){
            p.tx = G.wild.x < 80 ? 130 : 26; /* huye al lado contrario */
          }
        }
      }
    }
    /* destellos de anticipación: algo está a punto de pasar */
    if(UI.mode==='main' && petHere(p) && p.stage<STAGES.ADULT){
      const nx = predictNext(p);
      if(nx && nx.when>0 && nx.when<90000 && Math.random() < dtMs*0.004){
        UI.particles.push({x:p.rx-9+Math.random()*18, y:152-Math.random()*16, vy:-0.02, life:900, ch:'.', col:'#ffd94a'});
      }
    }
    /* paseo */
    if(!p.sleeping && !p.eatT && !p.trainT && !(p.swingT>0) && !(p.batheT>0) && !(p.drinkT>0) && !isCarried(p) && UI.mode==='main'){
      if(now > p.nextWalk){
        if(G.pets.length>1 && Math.random()<0.25){
          const others = G.pets.filter(o=>o!==p && o.stage>STAGES.EGG && (o.zone||'prado')===(p.zone||'prado'));
          if(others.length){
            const o = others[Math.floor(Math.random()*others.length)];
            p.tx = Math.max(22, Math.min(138, o.rx + (Math.random()<0.5?-12:12)));
          } else p.tx = 22 + Math.random()*116;
        } else p.tx = 22 + Math.random()*116;
        p.nextWalk = now + 2500 + Math.random()*4000;
      }
      const d = p.tx - p.rx;
      if(Math.abs(d)>1){
        p.rx += Math.sign(d)*Math.min(Math.abs(d), dtMs*0.018);
        p.dir = Math.sign(d)||1;
        if(Math.random() < dtMs*0.006){
          /* en invierno las pisadas quedan marcadas en la nieve */
          const nieve = season()==='invierno';
          UI.particles.push({x:p.rx - p.dir*5, y:160, vy:0, life: nieve?2600:600, ch:'.', col: nieve?'rgba(240,246,255,0.7)':'rgba(20,50,35,0.45)'});
        }
      }
    }
    if(Math.random() < dtMs*0.0006) p.blinkAt = performance.now();
    if(p.eatT>0) p.eatT -= dtMs;
    if(p.trainT>0) p.trainT -= dtMs;
  }

  /* amistad entre bitxos */
  if(UI.mode==='main' && G.pets.length>1){
    if(!G.nextBondAt) G.nextBondAt = now + 15000;
    if(now > G.nextBondAt){
      let found = false;
      for(let a=0;a<G.pets.length && !found;a++) for(let b=a+1;b<G.pets.length && !found;b++){
        const PA=G.pets[a], PB=G.pets[b];
        if(PA.stage>STAGES.EGG && PB.stage>STAGES.EGG && petHere(PA) && petHere(PB) &&
           !PA.sleeping && !PB.sleeping && !PA.eatT && !PB.eatT && Math.abs(PA.rx-PB.rx)<26){
          found = true;
          const pn = performance.now();
          PA.petT=pn; PB.petT=pn; PA.joyAt=pn; PB.joyAt=pn;
          PA.happy=Math.min(100,PA.happy+4); PB.happy=Math.min(100,PB.happy+4);
          const mx=(PA.rx+PB.rx)/2;
          for(let i=0;i<4;i++) UI.particles.push({x:mx-8+Math.random()*16,y:138+Math.random()*8,vy:-0.02,life:1300,ch:'♥',col:'#f2a2b8'});
          G.bond=(G.bond||0)+1;
          G.nextBondAt = now + 18000 + Math.random()*15000;
          SFX.yay();
          if(G.bond===1) toast('¡SE HAN HECHO AMIGOS!', 2600);
          /* cría: dos adultos que viven juntos y se quieren mucho */
          /* (el nido admite un huevo invitado; si está lleno, el huevo espera) */
          if(PA.stage===STAGES.ADULT && PB.stage===STAGES.ADULT && (G.bond||0)>=25 &&
             !G.eggWaiting && now > (G.criaNextAt||0)){
            G.criaNextAt = now + 24*3600*1000;
            const r = giftEgg(Math.random()<0.5 ? PA.line : PB.line);
            if(r && r.egg){
              const egg = r.egg;
              if(Math.random()<0.6) egg.trait = Math.random()<0.5 ? PA.trait : PB.trait;
              egg.zone = 'prado';
              for(let j2=0;j2<10;j2++) UI.particles.push({x:mx-12+Math.random()*24, y:128+Math.random()*16, vy:-0.03, life:1600, ch:'♥', col:'#f2a2b8'});
              toast('¡'+petName(PA)+' Y '+petName(PB)+' HAN HECHO UN NIDO!', 3800);
              diaryLog('LLEGO UN HUEVO DE '+petName(PA)+' Y '+petName(PB));
              SFX.hatch(); vibrate([30,30,60]);
            }
          }
        }
      }
      if(!found) G.nextBondAt = now + 6000;
    }
  }

  /* el huevo que esperaba sitio sale en cuanto hay hueco */
  if(G.eggWaiting && eggRoom() && UI.mode==='main'){
    const ln = G.eggWaiting;
    const e = spawnEgg();
    if(e) diaryLog('EL HUEVO '+LINES[ln].name+' YA TIENE SITIO');
  }

  /* juguetes vivos */
  toyLife(dtMs, now);
  /* sin mirarlo, el robot sigue barriendo su zona (1 caca cada ~90 s) */
  if(G.toys && G.toys.robot && !(UI.mode==='main' && toyZone('robot')===G.zone) && now>(UI.robotAt||0)){
    const rz = toyZone('robot');
    const pi = G.poops.findIndex(pp=>(pp.zone||'prado')===rz);
    if(pi>=0){
      G.poops.splice(pi,1);
      UI.robotAt = now + ROBOT_EVERY;
      for(const p of G.pets) p.hygiene = Math.min(100, p.hygiene+6);
    }
  }
  /* estrella fugaz nocturna */
  if(UI.mode==='main' && dayPhase()==='night'){
    if(!UI.shoot && Math.random() < dtMs*0.000005){
      UI.shoot = {x:-8, y:8+Math.random()*44};
      SFX.starWhistle();
    }
  }
  if(UI.shoot){
    UI.shoot.x += dtMs*0.10; UI.shoot.y += dtMs*0.028;
    if(UI.shoot.x>185) UI.shoot=null;
  }

  /* producción pasiva */
  motaAcc += motaRate() * (dtMs/1000);
  if(motaAcc >= 1){
    const whole = Math.floor(motaAcc);
    motaAcc -= whole;
    G.motas += whole; G.totalMotas += whole;
  }

  /* chispas */
  sparkleTimer += dtMs;
  const active = G.pets.some(p=>p.stage>STAGES.EGG && !p.sleeping);
  let spawnEvery = active ? 7000 : 16000;
  if(WEATHER.kind==='rain') spawnEvery *= 0.6;
  if(sparkleTimer > spawnEvery && UI.sparkles.length < 5 && UI.mode==='main'){
    sparkleTimer = 0;
    UI.sparkles.push({x:20+Math.random()*120, y:130+Math.random()*50, born:now, t:Math.random()*7, zone:G.zone});

  }
  for(let i=UI.sparkles.length-1;i>=0;i--){
    const s = UI.sparkles[i];
    if(now - s.born > 14000){ UI.sparkles.splice(i,1); continue; }
    if(G.up.iman>0 && now - s.born > 1800) collectSparkle(i, true);
  }

  /* comedero */
  if(G.up.comedero>0){
    feederTimer += dtMs;
    if(feederTimer > 20000){
      feederTimer = 0;
      const th = [0,25,40,55][G.up.comedero];
      for(const p of G.pets){
        if(p.stage>STAGES.EGG && !p.sleeping && !p.exped && p.hunger < th && G.motas >= COST_MEAL){
          G.motas -= COST_MEAL; p.hunger = Math.min(100, p.hunger+35);
          p.weight = Math.min(99, p.weight+1);
          p.eatT = 1600; p.feedKind='meal'; SFX.eat();
          UI.floats.push({x:p.rx, y:130, s:'AUTO', col:'#7ac74f', life:900, vy:-0.02});
          break;
        }
      }
    }
  }

  /* bichos salvajes */
  if(UI.mode==='main'){
    /* solo aparece si alguien de ESTA zona puede plantarle cara */
    const fighters = G.pets.filter(p=>p.stage>=STAGES.CHILD && !p.sleeping && !p.exped && (p.zone||'prado')===G.zone && p.energy>=12);
    if(!G.wild && fighters.length){
      if(!nextWildAt) nextWildAt = now + 40000 + Math.random()*120000;
      if(now > nextWildAt){
        const pool = WILD_POOL.filter(e=>G.battlesWon>=e[1]).map(e=>e[0]);
        let kind = pool[Math.floor(Math.random()*pool.length)];
        if(WEATHER.kind==='fog' && pool.includes('sombrio') && Math.random()<0.5) kind='sombrio';
        if(WEATHER.kind==='rain' && pool.includes('burbujon') && Math.random()<0.5) kind='burbujon';
        let boss = false;
        if(G.bossDue){ kind = (G.bossesWon%2===0) ? 'lobruno' : 'reyseto'; boss=true; }
        /* nivel del rival: contra tu MEJOR luchador, con varianza */
        const pp = Math.max(...fighters.map(playerPower));
        let nv = Math.max(1, pp + (boss ? 3 : Math.floor(Math.random()*7)-2));
        const elite = !boss && G.battlesWon>=8 && Math.random()<0.10;
        if(elite) nv += 2;
        const stealMs = 75000+(G.relics && G.relics.hueso?30000:0);
        G.wild = {kind, boss, elite, nv, zone:G.zone, x: Math.random()<0.5? -14:174, tx: 40+Math.random()*80, arriveAt:now, stealMs, stealAt: now+stealMs};
        G.wild.dir = G.wild.x<80? 1:-1;
        toast(boss? '¡EL JEFE '+ENEMIES[kind].name+'!' : (elite? '¡'+ENEMIES[kind].name+' ELITE NV'+nv+'!' : '¡UN '+ENEMIES[kind].name+' NV'+nv+'!'), 2600);
        SFX.nope(); vibrate([40,40,40]);
        for(const p of G.pets) if(p.trait==='TIMIDO' && p.stage>STAGES.EGG) p.happy=Math.max(0,p.happy-5);
      }
    }
    if(G.wild){
      const w = G.wild;
      const d = w.tx - w.x;
      if(Math.abs(d)>1){ w.x += Math.sign(d)*dtMs*0.02; w.dir = Math.sign(d)||w.dir; }
      else if(Math.random()<dtMs*0.0004){ w.tx = 30+Math.random()*100; }
      /* la cuenta atrás del robo solo corre mientras lo estás viendo;
         stealAt se deriva de ella (partidas viejas / arnés la fijan) */
      if(w.stealMs===undefined) w.stealMs = Math.max(0, (w.stealAt||now+75000) - now);
      if((w.zone||'prado')===G.zone) w.stealMs -= dtMs;
      w.stealAt = now + w.stealMs;
      if(w.stealMs <= 0){
        const steal = Math.max(5, Math.floor(G.motas*0.05));
        G.motas = Math.max(0, G.motas - steal);
        toast('¡EL '+ENEMIES[w.kind].name+' ROBO '+steal+'✦!', 3000);
        SFX.nope(); G.wild = null;
        nextWildAt = now + 120000 + Math.random()*180000;
      }
    }
  }

  /* el buhonero llega y se va */
  if(UI.mode==='main' || UI.mode==='buho'){
    if(!G.buhoNextAt) G.buhoNextAt = now + 20*60*1000;
    if(!G.buho && now > G.buhoNextAt && UI.mode==='main'){
      G.buho = {until: now + 150000, x: -14, tx: 128, dir: 1, offers: buhoOffers()};
      toast('¡EL BUHONERO HA LLEGADO!', 3000);
      SFX.buy(); vibrate(30);
    }
    if(G.buho){
      const b = G.buho;
      const d = b.tx - b.x;
      if(Math.abs(d)>1){ b.x += Math.sign(d)*dtMs*0.015; b.dir = Math.sign(d)||1; }
      else if(Math.random() < dtMs*0.0003){ b.tx = 118 + Math.random()*20; }
      if(now > b.until){
        G.buho = null;
        G.buhoNextAt = now + (2 + Math.random()*3)*3600*1000;
        if(UI.mode==='buho') UI.mode = 'main';
        toast('EL BUHONERO SE MARCHA...', 2400);
        saveGame();
      }
    }
  }

  /* --- citas con el prado: cosas que pasan a SU hora --- */
  {
    const hh = new Date().getHours(), mm = new Date().getMinutes();
    /* mercadillo de mediodía: el buhonero acude fijo */
    if(hh===12 && mm<15 && !G.buho && G.eventBuhoDay!==dayKey() && UI.mode==='main'){
      G.eventBuhoDay = dayKey();
      G.buhoNextAt = now - 1;
      toast('MEDIODIA: ¡MERCADILLO!', 2600);
    }
    /* lluvia de estrellas a las 22:00 */
    G.starShower = (hh===22 && mm<10);
    if(G.starShower && G.showerDay!==dayKey()){
      G.showerDay = dayKey();
      toast('¡LLUVIA DE ESTRELLAS! PIDE DESEOS', 3600);
      SFX.wish();
    }
    if(G.starShower && UI.mode==='main' && !UI.shoot && Math.random() < dtMs*0.00025){
      UI.shoot = {x:-8, y:8+Math.random()*44};
      SFX.starWhistle();
    }
  }

  /* el arco de primer día ahora lo guían los OBJETIVOS (game/goals.js) */
  goalsTick();

  achTimer += dtMs;
  if(achTimer > 3000){ achTimer=0; checkAchievements(); ensureDaily(); if(UI.mode==='main') checkDailyGift(); }

  saveTimer += dtMs;
  if(saveTimer > 12000){ saveTimer=0; saveGame(); }
}

function hatchPet(i){
  const p = G.pets[i];
  p.stage = STAGES.BABY;
  p.form = Math.random()<0.5 ? 'babyA' : 'babyB';
  markDex(p.line+'_'+p.form);
  p.hatchedAt = Date.now();
  p.hunger=80; p.happy=90; p.energy=100; p.hygiene=100;
  G.sel = i;
  UI.mode='hatch'; UI.hatchT=0;
  diaryLog('NACIO '+LINES[p.line].names[p.form]+' (GEN '+p.gen+')');
   vibrate([40,40,40,40,80]);
  saveGame();
}

/* =========================================================
   JUGUETES VIVOS: los bitxos eligen un juguete, van, lo usan y se van
   (con un corazoncito). Estados por bitxo: swingT, batheT, drinkT,
   drumT, kiteT (en uso) y toyGo {id,x,until} (de camino).
   ========================================================= */
function petHalfW(p){ const f = SPR[p.form==='grimo' ? 'grimo' : p.line+'_'+(p.form||'babyA')]; return f ? Math.floor(f[0].width/2) : 6; }
function toyBusy(p){ return (p.swingT>0)||(p.batheT>0)||(p.drinkT>0)||(p.drumT>0)||(p.kiteT>0); }
function toyFree(p){
  return p.stage>STAGES.EGG && petHere(p) && !p.sleeping && !p.exped && !p.eatT && !p.trainT && !toyBusy(p);
}
function toyHere(id){ return !!(G.toys && G.toys[id]) && toyZone(id)===G.zone; }
/* dónde se pone cada bitxo para usar cada juguete */
function toySpot(id, p){
  const hw = petHalfW(p);
  switch(id){
    case 'columpio': return SWING.px;
    case 'banera':   return 59;
    case 'fuente':   return 21 + hw;
    case 'tambor':   return TAMBOR.x + 6 + hw;
    case 'cometa':   return 158 - hw;
    case 'huerto':   return 85;
    case 'caja':     return 107 - 7 - hw;
    case 'pelota':   return G.ballX + (p.rx < G.ballX ? -(hw+3) : (hw+3));
  }
  return p.rx;
}
function toyLeave(p, now, happy){
  p.toyGo = null;
  const away = (Math.random()<0.5?-1:1)*(24+Math.random()*30);
  p.tx = Math.max(22, Math.min(138, p.rx + away));
  if(Math.abs(p.tx-p.rx)<12) p.tx = p.rx < 80 ? p.rx+30 : p.rx-30;
  p.nextWalk = now + 3000 + Math.random()*2500;
  if(happy){
    const pn = performance.now();
    p.thought = {icon:'love', until: pn+1800};
    p.squashAt = pn;
    fx({x:p.rx, y:140, vy:-0.03, life:900, kind:'heart', col:'#f2a2b8'});
  }
}
/* elige juguete según lo que necesita (sucio → bañera, cansado → fuente...) */
function toyPick(p, now){
  const opts = [];
  const add = (id, w)=>{ if(w>0 && toyHere(id)) opts.push([id, w]); };
  const busyBy = id=>G.pets.some(q=>q!==p && q.toyGo && q.toyGo.id===id);
  add('banera', now>(p.batheCd||0) && !G.pets.some(q=>q.batheT>0) && !busyBy('banera') ? (p.hygiene<72 ? 4 : 0.5) : 0);
  add('fuente', now>(p.drinkCd||0) && !G.pets.some(q=>q.drinkT>0) && !busyBy('fuente') ? (p.energy<45 ? 4 : 0.7) : 0);
  add('columpio', !G.pets.some(q=>q.swingT>0) && !busyBy('columpio') ? 1.5 : 0);
  add('tambor', now>(p.drumCd||0) && !G.pets.some(q=>q.drumT>0) && !busyBy('tambor') ? 1.3 : 0);
  add('pelota', (UI.ballZ||0)<1 ? (p.trait==='JUGUETON' ? 2.5 : 1) : 0);
  add('cometa', WEATHER.kind==='wind' && !G.pets.some(q=>q.kiteT>0) && !busyBy('cometa') ? 2.5 : 0);
  add('caja', Date.now()>=(G.cajaReadyAt||0) ? 0.8 : 0);
  add('huerto', Date.now()>=(G.huertoReadyAt||0) ? 0.8 : 0);
  if(!opts.length) return;
  let r = Math.random()*opts.reduce((a,o)=>a+o[1],0), id = opts[0][0];
  for(const o of opts){ r -= o[1]; if(r<=0){ id = o[0]; break; } }
  toyGo(p, id, now);
}
function toyGo(p, id, now){
  const x = toySpot(id, p);
  p.toyGo = {id, x, until: now + 9000};
  p.tx = Math.max(10, Math.min(146, x)); p.nextWalk = now + 9000;
}
/* patada: con destino (pase a un amigo) o al azar */
function ballKick(p, target){
  const pn = performance.now();
  const dir = p.rx < G.ballX ? 1 : -1;
  let vx;
  if(target!==null && target!==undefined && Math.sign(target-G.ballX)===dir){
    vx = (target - G.ballX)*0.0019;
    vx = Math.sign(vx)*Math.max(0.045, Math.min(0.15, Math.abs(vx)));
  } else vx = dir*(0.08+Math.random()*0.05);
  G.ballVX = vx;
  UI.ballVZ = 0.08 + Math.random()*0.05; UI.ballZ = Math.max(UI.ballZ||0, 0.5);
  p.dir = dir; p.squashAt = pn; p.kickAnimAt = pn;
  p.happy = Math.min(100, p.happy+3);
  SFX.ballKick();
  dustFx(G.ballX - dir*3, 161, 4); ringFx(G.ballX, 156, '#ffffff', 6, 200);
}
function toyLife(dtMs, now){
  if(!G.toys || UI.mode!=='main') return;
  const pn = performance.now();

  /* ---- pelota: física con bote, giro y rozamiento ---- */
  if(toyHere('pelota')){
    G.ballVX = G.ballVX||0;
    if(G.ballX===undefined) G.ballX = 80;
    if(G.ballHopAt && G.ballHopAt!==UI.ballHopSeen){ UI.ballHopSeen = G.ballHopAt; UI.ballVZ = 0.12; UI.ballZ = Math.max(UI.ballZ||0, 0.5); UI.ballRally = 0; }
    UI.ballZ = UI.ballZ||0; UI.ballVZ = UI.ballVZ||0;
    G.ballX += G.ballVX*dtMs;
    UI.ballRot = (UI.ballRot||0) + G.ballVX*dtMs;
    if(UI.ballZ>0 || UI.ballVZ>0){
      UI.ballVZ -= 0.0005*dtMs;
      UI.ballZ += UI.ballVZ*dtMs;
      if(UI.ballZ<=0){
        UI.ballZ = 0;
        if(UI.ballVZ < -0.04){ UI.ballVZ = -UI.ballVZ*0.5; UI.ballSquashAt = pn; SFX.bounce(); dustFx(G.ballX, 161, 2); }
        else UI.ballVZ = 0;
      }
      G.ballVX *= Math.exp(-dtMs*0.0004);
    } else G.ballVX *= Math.exp(-dtMs*0.0018);
    if(G.ballX<16){ G.ballX=16; G.ballVX=Math.abs(G.ballVX)*0.8; if(G.ballVX>0.03){ SFX.bounce(); UI.ballSquashAt = pn; } }
    if(G.ballX>144){ G.ballX=144; G.ballVX=-Math.abs(G.ballVX)*0.8; if(-G.ballVX>0.03){ SFX.bounce(); UI.ballSquashAt = pn; } }
    if(Math.abs(G.ballVX)<0.005) G.ballVX=0;
    const slow = Math.abs(G.ballVX)<0.03 && UI.ballZ<3;
    for(const p of G.pets){
      if(!toyFree(p)) continue;
      const hw = petHalfW(p);
      const chasing = p.toyGo && p.toyGo.id==='pelota';
      /* quien va a por la pelota ajusta el rumbo mientras rueda */
      if(chasing){ p.toyGo.x = toySpot('pelota', p); p.tx = Math.max(10, Math.min(146, p.toyGo.x)); p.nextWalk = now + 3000; }
      const near = Math.abs(p.rx-G.ballX) < hw+5;
      if(near && slow && (chasing || now>(p.kickAt||0))){
        /* ¿hay un amigo libre para pasársela? */
        const mates = G.pets.filter(q=>q!==p && toyFree(q) && Math.abs(q.rx-G.ballX)>24 && !(q.toyGo && q.toyGo.id!=='pelota'));
        const rally = UI.ballRally||0;
        let mate = null;
        if(mates.length && rally < 5 + Math.floor(Math.random()*3) && Math.random()<0.8) mate = mates[Math.floor(Math.random()*mates.length)];
        const dir = p.rx < G.ballX ? 1 : -1;
        if(mate && Math.sign(mate.rx-G.ballX)!==dir) mate = null;
        ballKick(p, mate ? mate.rx - dir*(petHalfW(mate)+3) : null);
        p.kickAt = now + (chasing ? 2500 : 9000);
        if(mate){
          UI.ballRally = rally+1;
          toyGo(mate, 'pelota', now); mate.toyGo.until = now + 7000;
          mate.thought = {icon:'ball', until: pn+900};
          if(UI.ballRally>=3 && UI.ballRally%3===0){ p.happy = Math.min(100,p.happy+2); mate.happy = Math.min(100,mate.happy+2); fx({x:(p.rx+mate.rx)/2, y:136, vy:-0.03, life:900, kind:'heart', col:'#f2a2b8'}); }
          p.toyGo = null; p.tx = p.rx; p.nextWalk = now + 2000;
        } else {
          if((UI.ballRally||0)>=2){ toyLeave(p, now, true); for(const q of G.pets) if(q!==p && q.toyGo && q.toyGo.id==='pelota') toyLeave(q, now, true); }
          else if(chasing){ p.toyGo = null; p.thought = {icon:'love', until: pn+1400}; }
          UI.ballRally = 0;
        }
        break;
      }
    }
  }

  /* ---- bitxos que usan, van o eligen juguete ---- */
  for(const p of G.pets){
    if(p.stage===STAGES.EGG) continue;
    const here = petHere(p);
    /* fuera de la vista, dormido o en brazos: se acabó el juego */
    if(!here || p.sleeping || p.exped){
      if(p.drumT>0) p.drumT = 0;
      if(p.kiteT>0) p.kiteT = 0;
      if(p.toyGo) p.toyGo = null;
      continue;
    }
    if(toyBusy(p)){
      p.tx = p.rx; p.nextWalk = now + 1500;
      if(p.swingT>0){
        p.swingT -= dtMs;
        if(!p.creakAt || now > p.creakAt){ SFX.creak(); p.creakAt = now + 940; }
        p.happy = Math.min(100, p.happy + dtMs*0.0012);
        p.energy = Math.min(100, p.energy + dtMs*0.0008);
        if(p.swingT<=0 || !toyHere('columpio')){
          p.swingT = 0;
          /* salta del asiento */
          p.rx = Math.round(swingSeat(pn).x); p.squashAt = pn; dustFx(p.rx, 161, 5);
          toyLeave(p, now, true);
        }
      } else if(p.batheT>0){
        p.batheT -= dtMs;
        p.hygiene = Math.min(100, p.hygiene + dtMs*0.012);
        if(every(700, pn)) toyFx({kind:'drop', x:59-8+Math.random()*16, y:150, vx:(Math.random()-0.5)*0.05, vy:-0.07, g:0.0003, life:600, floor:160});
        if(p.batheT<=0 || !toyHere('banera')){
          p.batheT = 0;
          /* sale y se sacude el agua */
          p.rx = 59 + (Math.random()<0.5?-16:16); p.dir = p.rx<59 ? -1 : 1; p.squashAt = pn;
          burst(p.rx, 150, {n:12, cols:['#9adcf0','#e8faff','#5e9be0'], speed:0.09, g:0.0004, life:520, up:0.04, floor:160});
          toyLeave(p, now, true);
        }
      } else if(p.drinkT>0){
        p.drinkT -= dtMs;
        p.dir = -1;
        if(every(380, pn)) toyFx({kind:'drop', x:19, y:155, vx:0.02, vy:-0.05, g:0.0003, life:420});
        if(p.drinkT<=0 || !toyHere('fuente')){ p.drinkT = 0; toyLeave(p, now, true); }
      } else if(p.drumT>0){
        p.drumT -= dtMs;
        p.dir = -1;
        if(now >= (p.drumNext||0)){
          const n = p.drumBeatN = (p.drumBeatN||0)+1;
          p.drumNext = now + 330;
          UI.drumHitAt = pn; p.squashAt = pn;
          const scale = [0,4,7,12,7,4,7,12];
          const base = p.drumBase || 262;
          tone({f:NOTE(base, scale[(n-1)%scale.length]), d:0.12, type:'p25', vol:0.045, send:0.3});
          kick(sfxAt(0), 0.05);
          toyFx({kind:'note', x:TAMBOR.x-4+Math.random()*6, y:146, vx:(Math.random()-0.3)*0.02, vy:-0.03, life:1000, col:['#ffd94a','#f2a2b8','#5ec8d8','#7ac74f'][n%4], wob:Math.random()*6});
          /* los demás bailan un saltito */
          if(n%2===0) for(const q of G.pets) if(q!==p && petHere(q) && q.stage>STAGES.EGG && !q.sleeping && !toyBusy(q)) q.joyAt = pn;
        }
        if(p.drumT<=0 || !toyHere('tambor')){
          p.drumT = 0; p.drumCd = now + 25000;
          /* acorde final */
          [0,4,7,12].forEach((sv,j)=> tone({f:NOTE(p.drumBase||262, sv), at:sfxAt(j*0.02), d:0.35, type:'p25', vol:0.03, send:0.4}));
          for(let j=0;j<4;j++) toyFx({kind:'note', x:TAMBOR.x-9+Math.random()*16, y:144, vx:(Math.random()-0.5)*0.04, vy:-0.035, life:1200, col:'#ffd94a', wob:j*2});
          for(const q of G.pets) if(q!==p && q.stage>STAGES.EGG && petHere(q)) q.happy = Math.min(100, q.happy+3);
          p.happy = Math.min(100, p.happy+4);
          toyLeave(p, now, true);
          p.thought = {icon:'note', until: pn+1800};
        }
      } else if(p.kiteT>0){
        p.kiteT -= dtMs;
        p.dir = -1;
        p.happy = Math.min(100, p.happy + dtMs*0.0008);
        if(p.kiteT<=0 || WEATHER.kind!=='wind' || !toyHere('cometa')){ p.kiteT = 0; toyLeave(p, now, true); }
      }
      continue;
    }
    if(!toyFree(p)){ if(p.toyGo && (p.eatT||p.trainT)) p.toyGo = null; continue; }
    /* de camino a un juguete */
    if(p.toyGo){
      const g = p.toyGo;
      if(now > g.until || !toyHere(g.id)){ p.toyGo = null; continue; }
      if(g.id==='pelota') continue;   /* la pelota se resuelve arriba */
      p.tx = Math.max(10, Math.min(146, g.x)); p.nextWalk = Math.max(p.nextWalk||0, now + 1000);
      if(Math.abs(p.rx - g.x) < 2.5){
        p.rx = g.x; p.tx = g.x;
        p.toyGo = null;
        toyStart(p, g.id, now, pn);
      }
      continue;
    }
    /* ¿le apetece jugar con algo? */
    if(UI.mode==='main' && Math.random() < dtMs*0.00007) toyPick(p, now);
  }

  /* ---- el robot: patrulla y barre las cacas de su zona ---- */
  if(toyHere('robot')){
    if(UI.robotX===undefined) UI.robotX = 60;
    if(!UI.robotAt) UI.robotAt = 0;
    const x0 = UI.robotX;
    const sweeping = UI.robotSweep && pn - UI.robotSweep.at < 900;
    const rz = toyZone('robot');
    const pi = G.poops.findIndex(pp=>(pp.zone||'prado')===rz);
    if(sweeping){ /* frotando: quieto */ }
    else if(pi>=0 && now>UI.robotAt){
      const target = G.poops[pi].x;
      const d = target - UI.robotX;
      if(Math.abs(d)>2){ UI.robotX += Math.sign(d)*Math.min(Math.abs(d), dtMs*0.012); UI.robotDir = Math.sign(d); }
      else {
        UI.robotSweep = {x: G.poops[pi].x, at: pn};
        G.poops.splice(pi,1);
        UI.robotAt = now + ROBOT_EVERY;
        SFX.clean();
        tone({f:880, slide:1320, d:0.08, type:'p125', vol:0.03, at:sfxAt(0.75)});
        for(const p of G.pets) p.hygiene = Math.min(100, p.hygiene+6);
      }
    } else {
      /* patrulla tranquila, con paradas */
      if(!UI.robotTx || Math.abs(UI.robotX-UI.robotTx)<2){
        if(!UI.robotWait) UI.robotWait = now + 1200 + Math.random()*2500;
        if(now > UI.robotWait){ UI.robotTx = 35+Math.random()*95; UI.robotWait = 0; }
      } else {
        UI.robotX += Math.sign(UI.robotTx-UI.robotX)*dtMs*0.006;
        UI.robotDir = Math.sign(UI.robotTx-UI.robotX)||1;
      }
    }
    UI.robotVX = (UI.robotX - x0)/Math.max(1, dtMs);
  }
}
/* llega al juguete y empieza a usarlo */
function toyStart(p, id, now, pn){
  switch(id){
    case 'columpio':
      if(G.pets.some(q=>q.swingT>0)) return toyLeave(p, now, false);
      p.swingT = p.swingDur = 6000; p.petT = pn; SFX.yay(); break;
    case 'banera':
      if(G.pets.some(q=>q.batheT>0)) return toyLeave(p, now, false);
      p.batheT = p.batheDur = 4200; p.batheCd = now + 60000;
      SFX.clean(); nz(sfxAt(0.05), 0.18, 0.05, 1400, 1, 500);
      burst(59, 150, {n:14, cols:['#9adcf0','#e8faff','#5e9be0'], speed:0.1, g:0.0004, life:560, up:0.06, floor:160});
      ringFx(59, 152, '#e8faff', 10, 280);
      break;
    case 'fuente':
      if(G.pets.some(q=>q.drinkT>0)) return toyLeave(p, now, false);
      p.drinkT = 2400; p.drinkCd = now + 120000; p.dir = -1;
      p.energy = Math.min(100, p.energy+10);
      p.thought = {icon:'water', until: pn+900};
      break;
    case 'tambor':
      if(G.pets.some(q=>q.drumT>0)) return toyLeave(p, now, false);
      p.drumT = 2640; p.drumBeatN = 0; p.drumNext = now + 120; p.dir = -1;
      p.drumBase = [262,294,330,392][Math.floor(Math.random()*4)];
      break;
    case 'cometa':
      if(WEATHER.kind!=='wind' || G.pets.some(q=>q.kiteT>0)) return toyLeave(p, now, false);
      p.kiteT = 7000; p.dir = -1; SFX.yay(); break;
    case 'caja':
      p.dir = 1; p.thought = {icon:'gift', until: pn+2600}; p.joyAt = pn;
      p.tx = p.rx; p.nextWalk = now + 2600;
      break;
    case 'huerto':
      p.thought = {icon:'fruit', until: pn+2600}; p.joyAt = pn;
      p.tx = p.rx; p.nextWalk = now + 2600;
      break;
  }
}
