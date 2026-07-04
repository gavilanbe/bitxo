"use strict";
/* =========================================================
   BITXO — game/sim: simulación en vivo y eclosión
   ========================================================= */
/* ---------------- SIMULACIÓN EN VIVO ---------------- */
let lastT = performance.now();
let saveTimer=0, sparkleTimer=0, motaAcc=0, feederTimer=0, achTimer=0;
const poopTimers = {};

function liveUpdate(dtMs){
  if(!G || ['boot','ascendFX'].includes(UI.mode)) return;
  const now = Date.now();
  updateWeather(now);

  for(let i=G.pets.length-1;i>=0;i--){
    const p = G.pets[i];
    if(p.exped){
      if(now >= p.exped.until) resolveExpedition(p);
      continue;
    }
    if(p.stage===STAGES.EGG){
      if(performance.now()-p.dropT < 1100) continue;
      if(now - p.bornAt > T_HATCH || p.tapsOnEgg>=15) hatchPet(i);
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
      if(dayPhase()==='night' && p.energy<25 && UI.mode==='main'){
        p.sleeping = true; if(i===G.sel){ SFX.sleep(); toast('SE HA DORMIDO...'); }
      }
    }
    p.hygiene = Math.max(0, Math.min(100, p.hygiene - G.poops.length*ratePerMs(3)*hygMult(p)*dtMs + (G.poops.length===0? ratePerMs(24)*dtMs:0)));
    if(p.hunger<=0 && !p.hungerZeroSince){ p.hungerZeroSince = now; p.mistakes++; }
    if(p.hunger>0) p.hungerZeroSince=null;
    if(p.happy<=0 && !p.happyZeroSince){ p.happyZeroSince = now; p.mistakes++; }
    if(p.happy>0) p.happyZeroSince=null;
    if(p.hungerZeroSince && now-p.hungerZeroSince > RUNAWAY_AFTER){
      toast(currentNameOf(p)+' SE FUE EN BUSCA DE COMIDA...', 3600);
      SFX.bye(); spawnEgg(i);
      if(G.sel>=G.pets.length) G.sel=0;
      continue;
    }
    /* crecer también es tiempo: XP pasiva hasta el nivel de madurez */
    const lvlGate = p.stage===STAGES.BABY ? EVO_LEVEL.child : (p.stage===STAGES.CHILD ? EVO_LEVEL.adult : 0);
    if(lvlGate && p.level<lvlGate){
      p.xpAcc = (p.xpAcc||0) + XP_TRICKLE_MS*dtMs*(p.sleeping?0.3:1)*(p.sick?0.5:1);
      if(p.xpAcc>=1){
        const w = Math.floor(p.xpAcc); p.xpAcc -= w;
        gainXPFor(p, w);
      }
    }
    checkEvolution(p, false);
    /* --- enfermedad: la lluvia sin cometa y la mugre pasan factura --- */
    if(!p.sick && p.stage>STAGES.EGG && !p.sleeping && !p.exped){
      let riesgo = 0;
      if(p.hygiene<25) riesgo++;
      if(WEATHER.kind==='rain' && !(G.toys && G.toys.cometa)) riesgo++;
      if(riesgo && Math.random() < dtMs*0.0000015*riesgo){
        p.sick = true; p.sickAt = now; p.sickPenal = false;
        diaryLog(petName(p)+' SE PUSO MALITO');
        toast('¡'+petName(p)+' SE HA PUESTO MALITO!', 3200);
        SFX.nope(); vibrate(30);
      }
    }
    if(p.sick){
      if(!p.sickPenal && now-p.sickAt > 4*3600*1000){ p.sickPenal = true; p.mistakes++; }
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
          UI.particles.push({x:p.rx - p.dir*5, y:160, vy:0, life:600, ch:'.', col:'rgba(20,50,35,0.45)'});
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
        }
      }
      if(!found) G.nextBondAt = now + 6000;
    }
  }

  /* juguetes vivos */
  if(G.toys && UI.mode==='main'){
    if(G.toys.pelota && toyZone('pelota')===G.zone){
      G.ballVX = G.ballVX||0;
      if(G.ballX===undefined) G.ballX = 80;
      G.ballX += G.ballVX*dtMs;
      G.ballVX *= Math.exp(-dtMs*0.0018);
      if(G.ballX<16){ G.ballX=16; G.ballVX=Math.abs(G.ballVX)*0.8; if(G.ballVX>0.03) SFX.bounce(); }
      if(G.ballX>144){ G.ballX=144; G.ballVX=-Math.abs(G.ballVX)*0.8; if(-G.ballVX>0.03) SFX.bounce(); }
      if(Math.abs(G.ballVX)<0.005) G.ballVX=0;
      for(const p of G.pets){
        if(p.stage>STAGES.EGG && petHere(p) && !p.sleeping && !p.exped && !p.eatT && !p.swingT &&
           Math.abs(p.rx-G.ballX)<10 && Math.abs(G.ballVX)<0.02 && now>(p.kickAt||0)){
          p.kickAt = now + 9000;
          G.ballVX = (p.dir||1)*(0.08+Math.random()*0.05);
          p.joyAt = performance.now();
          p.happy = Math.min(100, p.happy+3);
          SFX.ballKick();
          break;
        }
      }
    }
    if(G.toys.banera && toyZone('banera')===G.zone){
      for(const p of G.pets){
        if((p.batheT||0)>0){
          p.batheT -= dtMs;
          p.hygiene = Math.min(100, p.hygiene + dtMs*0.012);
          if(p.batheT<=0){ p.batheT=0; p.nextWalk=0; p.tx = 40+Math.random()*90; }
        } else if(p.stage>STAGES.EGG && petHere(p) && !p.sleeping && !p.exped && !p.eatT && !(p.swingT>0) &&
                  p.hygiene<72 && now>(p.batheCd||0) && Math.random() < dtMs*0.00004){
          p.tx = 59;
        }
        if(!(p.batheT>0) && petHere(p) && p.tx===59 && Math.abs(p.rx-59)<4 && p.stage>STAGES.EGG && !p.sleeping && !p.exped){
          p.batheT = 3000; p.batheCd = now + 60000;
          SFX.clean();
        }
      }
    }
    if(G.toys.tambor && toyZone('tambor')===G.zone){
      for(const p of G.pets){
        if(p.stage>STAGES.EGG && petHere(p) && !p.sleeping && !p.exped && !p.eatT && !(p.batheT>0) &&
           Math.abs(p.rx-127)<12 && now>(p.drumAt||0) && Math.random() < dtMs*0.0001){
          p.drumAt = now + 25000;
          p.joyAt = performance.now();
          const base = [262,330,392][Math.floor(Math.random()*3)];
          [0,4,7,12].forEach((sv,j)=> tone({f:NOTE(base,sv), at:sfxAt(j*0.11), d:0.13, type:'p25', vol:0.04, send:0.3}));
          for(let j=0;j<4;j++) UI.particles.push({x:123+Math.random()*8, y:148, vy:-0.028, life:900, ch:'✦', col:'#ffd94a'});
          for(const q of G.pets) if(q!==p && q.stage>STAGES.EGG) q.happy = Math.min(100, q.happy+3);
          p.happy = Math.min(100, p.happy+4);
        }
      }
    }
    if(G.toys.fuente && toyZone('fuente')===G.zone){
      for(const p of G.pets){
        if((p.drinkT||0)>0){
          p.drinkT -= dtMs;
          if(p.drinkT<=0){ p.drinkT=0; p.nextWalk=0; p.tx = 40+Math.random()*90; }
        } else if(p.stage>STAGES.EGG && petHere(p) && !p.sleeping && !p.exped && !p.eatT && !(p.swingT>0) && !(p.batheT>0) &&
                  p.energy<45 && now>(p.drinkCd||0) && Math.random() < dtMs*0.00005){
          p.tx = 12;
        }
        if(!(p.drinkT>0) && petHere(p) && p.tx===12 && Math.abs(p.rx-12)<4 && p.stage>STAGES.EGG && !p.sleeping && !p.exped){
          p.drinkT = 2200; p.drinkCd = now + 120000;
          p.energy = Math.min(100, p.energy+10);
          p.joyAt = performance.now();
          for(let j=0;j<3;j++) UI.particles.push({x:8+Math.random()*10, y:146, vy:-0.02, life:600, ch:'.', col:'#9adcf0'});
        }
      }
    }
    if(G.toys.robot && UI.mode==='main' && toyZone('robot')===G.zone){
      if(UI.robotX===undefined) UI.robotX = 60;
      if(!UI.robotAt) UI.robotAt = 0;
      /* el robot vive en el prado: solo barre la mugre de su zona */
      const pi = G.poops.findIndex(pp=>(pp.zone||'prado')==='prado');
      if(pi>=0 && now>UI.robotAt){
        const target = G.poops[pi].x;
        const d = target - UI.robotX;
        if(Math.abs(d)>2){ UI.robotX += Math.sign(d)*dtMs*0.012; }
        else {
          G.poops.splice(pi,1);
          UI.robotAt = now + 6*60*1000;
          for(let j=0;j<5;j++) UI.particles.push({x:UI.robotX-4+Math.random()*8, y:152, vy:-0.02, life:600, ch:'.', col:'#bdf0f5'});
          SFX.clean();
          for(const p of G.pets) p.hygiene = Math.min(100, p.hygiene+6);
        }
      } else {
        /* patrulla tranquila */
        if(!UI.robotTx || Math.abs(UI.robotX-UI.robotTx)<2){ UI.robotTx = 35+Math.random()*95; }
        UI.robotX += Math.sign(UI.robotTx-UI.robotX)*dtMs*0.004;
      }
    }
    if(G.toys.columpio && toyZone('columpio')===G.zone){
      const someone = G.pets.some(q=>(q.swingT||0)>0);
      for(const p of G.pets){
        if((p.swingT||0)>0){
          p.swingT -= dtMs;
          if(!p.creakAt || now > p.creakAt){ SFX.creak(); p.creakAt = now + 1880; }
          p.happy = Math.min(100, p.happy + dtMs*0.0012);
          p.energy = Math.min(100, p.energy + dtMs*0.0008);
          if(p.swingT<=0){ p.swingT=0; p.nextWalk=0; p.tx = 40+Math.random()*90; }
        } else if(!someone && p.stage>STAGES.EGG && petHere(p) && !p.sleeping && !p.exped && !p.eatT && !p.trainT && Math.random() < dtMs*0.00002){
          p.tx = 27;
        }
        if(!(p.swingT>0) && !someone && petHere(p) && p.tx===27 && Math.abs(p.rx-27)<5 && p.stage>STAGES.EGG && !p.sleeping && !p.exped){
          p.swingT = 6000;
          p.petT = performance.now();
          SFX.yay();
        }
      }
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
    if(!G.hints.sparkle){ G.hints.sparkle=true; toast('¡TOCA LAS MOTAS ✦!', 2600); }
  }
  for(let i=UI.sparkles.length-1;i>=0;i--){
    const s = UI.sparkles[i];
    if(now - s.born > 14000){ UI.sparkles.splice(i,1); continue; }
    if(G.up.iman>0 && now - s.born > 1800){
      gainMotas(tapYield(), s.x, s.y); SFX.coin();
      UI.sparkles.splice(i,1);
    }
  }

  /* comedero */
  if(G.up.comedero>0){
    feederTimer += dtMs;
    if(feederTimer > 20000){
      feederTimer = 0;
      const th = [0,25,40,55][G.up.comedero];
      for(const p of G.pets){
        if(p.stage>STAGES.EGG && !p.sleeping && p.hunger < th && G.motas >= COST_MEAL){
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
    const fighter = G.pets.some(p=>p.stage>=STAGES.CHILD);
    if(!G.wild && fighter){
      if(!nextWildAt) nextWildAt = now + 40000 + Math.random()*120000;
      if(now > nextWildAt){
        const pool = WILD_POOL.filter(e=>G.battlesWon>=e[1]).map(e=>e[0]);
        let kind = pool[Math.floor(Math.random()*pool.length)];
        if(WEATHER.kind==='fog' && pool.includes('sombrio') && Math.random()<0.5) kind='sombrio';
        if(WEATHER.kind==='rain' && pool.includes('burbujon') && Math.random()<0.5) kind='burbujon';
        let boss = false;
        if(G.bossDue){ kind = (G.bossesWon%2===0) ? 'lobruno' : 'reyseto'; boss=true; }
        /* nivel del rival: contra tu MEJOR luchador, con varianza */
        const pp = Math.max(...G.pets.filter(q=>q.stage>=STAGES.CHILD).map(playerPower));
        let nv = Math.max(1, pp + (boss ? 3 : Math.floor(Math.random()*7)-2));
        const elite = !boss && G.battlesWon>=8 && Math.random()<0.10;
        if(elite) nv += 2;
        G.wild = {kind, boss, elite, nv, zone:G.zone, x: Math.random()<0.5? -14:174, tx: 40+Math.random()*80, arriveAt:now, stealAt: now+75000+(G.relics && G.relics.hueso?30000:0)};
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
      if(now > w.stealAt){
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

  /* --- arco de primer día: el prado te va enseñando --- */
  if(G.ascensions===0 && G.gen<=1 && UI.mode==='main'){
    const h2 = G.hints;
    const p0 = G.pets[0];
    if(p0 && p0.stage>STAGES.EGG){
      if(!h2.mimos && Date.now()-(p0.hatchedAt||0)>20000){ h2.mimos=true; toast('ACARICIALO: TOCA A TU BITXO', 3200); }
      else if(!h2.comer && p0.hunger<70){ h2.comer=true; toast('TIENE HAMBRE: BOTON COMER', 3200); }
      else if(!h2.limpiar && G.poops.length>0){ h2.limpiar=true; toast('¡UNA CACA! BOTON LIMPIAR', 3200); }
      else if(!h2.luz && p0.energy<45){ h2.luz=true; toast('ESTA CANSADO: BOTON LUZ', 3200); }
      else if(!h2.gym && p0.stage>=STAGES.CHILD){ h2.gym=true; toast('YA PUEDE ENTRENAR: JUGAR > GYM', 3600); }
      else if(!h2.lucha && G.wild){ h2.lucha=true; toast('¡TOCA AL SALVAJE PARA LUCHAR!', 3600); }
    }
  }

  achTimer += dtMs;
  if(achTimer > 3000){ achTimer=0; checkAchievements(); ensureDaily(); }

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
  SFX.hatch(); vibrate([40,40,40,40,80]);
  saveGame();
}
