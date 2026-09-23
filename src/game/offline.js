"use strict";
/* =========================================================
   BITXO — game/offline: progreso mientras no estabas
   ========================================================= */
/* ---------------- OFFLINE ---------------- */
let offlineReport = null;
/* simula la ausencia en 24 pasos. La ventana simulada son las primeras
   OFFLINE_CAP del hueco; el resto cuenta como tiempo real para la fuga */
function applyElapsed(ms){
  const CAP = offlineCap(); /* SUENO LARGO alarga la ventana */
  const dt = Math.min(ms, CAP);
  const now = Date.now(), leave = now - ms;
  const rep = {away:ms, motas:0, autofed:0, poops:0, lvls:0, evolved:false, capped: ms>CAP, ranAway:[], robot:0, mistakes:0};
  const STEPS = 24, sdt = dt/STEPS;
  const rz = (G.toys && G.toys.robot) ? toyZone('robot') : null;
  let robotBudget = 0;
  /* la enfermedad no suma fallo mientras no estás */
  for(const p of G.pets) if(p.sick) p.sickAway = (p.sickAway||0) + ms;
  for(let i=0;i<STEPS;i++){
    const tStep = leave + (i+1)*sdt;
    let rate = 0;
    for(const p of G.pets){
      if(p.exped){
        if(now >= p.exped.until && i===STEPS-1) resolveExpedition(p);
        continue;
      }
      if(p.stage===STAGES.EGG) continue;
      const drowse = p.sleeping ? 0.3 : 1;
      p.hunger = Math.max(0, p.hunger - hungerRate(p)*sdt*drowse);
      p.happy  = Math.max(0, p.happy - happyDecayRate(p)*sdt*drowse);
      if(p.sleeping){
        p.energy = Math.min(100, p.energy + sleepRegen(p)*sdt);
        if(p.energy>=100) p.sleeping=false;
      } else {
        p.energy = Math.max(0, p.energy - energyRate(p)*sdt);
        if(Math.random() < sdt/poopEvery(p) && G.poops.length<5){
          G.poops.push({x:20+Math.random()*110, zone:p.zone||'prado'}); rep.poops++;
        }
      }
      /* el comedero no despierta a nadie: igual que en vivo */
      if(G.up.comedero>0 && !p.sleeping){
        const th = [0,25,40,55][G.up.comedero];
        if(p.hunger < th && G.motas >= COST_MEAL){
          G.motas -= COST_MEAL; p.hunger = Math.min(100, p.hunger+35);
          p.weight = Math.min(99, p.weight+1); rep.autofed++;
        }
      }
      /* el goteo de XP también corre fuera (a media marcha, como las motas) */
      const lg = p.stage===STAGES.BABY ? EVO_LEVEL.child : (p.stage===STAGES.CHILD ? EVO_LEVEL.adult : 0);
      if(lg && p.level<lg){
        p.xpAcc = (p.xpAcc||0) + XP_TRICKLE_MS*trickleMult(p)*constelXpMult()*sdt*0.5*(p.sleeping?0.3:1)*(p.sick?0.5:1);
        if(p.xpAcc>=1){
          const w = Math.floor(p.xpAcc); p.xpAcc -= w; p.xp += w;
          while(p.xp >= xpNeed(p.level) && p.level<lg){ p.xp -= xpNeed(p.level); p.level++; rep.lvls++; }
        }
      }
      rate += petRate(p);
      p.hygiene = Math.max(0, Math.min(100, p.hygiene - G.poops.length*ratePerMs(3)*hygMult(p)*sdt + (G.poops.length===0? ratePerMs(24)*sdt:0)));
      /* hambre a cero: el fallo cuenta también fuera, y desde cuándo */
      if(p.hunger<=0 && !p.hungerZeroSince){ p.hungerZeroSince = tStep; p.mistakes++; rep.mistakes++; }
      if(p.hunger>0) p.hungerZeroSince = null;
    }
    /* mismas reglas que motaRate (botín, trébol, amistad), a media marcha */
    const gain = rate * motaMult(tStep) * (sdt/1000) * 0.5 * offlineRateMult();
    G.motas += gain; G.totalMotas += gain; rep.motas += gain;
    /* el robot sigue barriendo su zona */
    if(rz){
      robotBudget += sdt;
      let pi;
      while(robotBudget >= ROBOT_EVERY && (pi = G.poops.findIndex(pp=>(pp.zone||'prado')===rz))>=0){
        G.poops.splice(pi,1); robotBudget -= ROBOT_EVERY; rep.robot++;
      }
      robotBudget = Math.min(robotBudget, ROBOT_EVERY);
    }
  }
  if(rep.robot) for(const p of G.pets) p.hygiene = Math.min(100, p.hygiene + 6*rep.robot);
  for(let i=G.pets.length-1;i>=0;i--){
    const p = G.pets[i];
    if(p.hungerZeroSince && (now - p.hungerZeroSince) > RUNAWAY_AFTER && p.stage>STAGES.EGG){
      const nm = currentNameOf(p);
      rep.ranAway.push(nm);
      diaryLog(nm+' SE FUE EN BUSCA DE COMIDA');
      toast(nm+' SE FUE...', 3200);
      spawnEgg(i, true); /* el informe ya lo cuenta: sin '¡HUEVO!' encima */
    } else {
      const st0 = p.stage;
      checkEvolution(p, true);
      if(p.stage!==st0) rep.evolved = true;
    }
  }
  if(G.sel >= G.pets.length) G.sel = 0;
  if(ms > 2*60*1000 || rep.ranAway.length){
    /* dos ausencias seguidas sin cerrar el informe: se suman */
    const o = offlineReport;
    if(o){
      rep.away += o.away; rep.motas += o.motas; rep.autofed += o.autofed; rep.poops += o.poops;
      rep.lvls += o.lvls; rep.evolved = rep.evolved || o.evolved; rep.capped = rep.capped || o.capped;
      rep.ranAway = (o.ranAway||[]).concat(rep.ranAway); rep.robot += o.robot||0; rep.mistakes += o.mistakes||0;
    }
    offlineReport = rep;
  }
}
function currentNameOf(p){
  if(p.nick) return p.nick;
  if(p.form==='grimo') return 'GRIMO';
  if(p.stage===STAGES.EGG) return 'EL HUEVO';
  return LINES[p.line].names[p.form||'babyA'];
}
