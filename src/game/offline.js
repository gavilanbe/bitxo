"use strict";
/* =========================================================
   BITXO — game/offline: progreso mientras no estabas
   ========================================================= */
/* ---------------- OFFLINE ---------------- */
let offlineReport = null;
function applyElapsed(ms){
  const dt = Math.min(ms, OFFLINE_CAP);
  const now = Date.now();
  const rep = {away:ms, motas:0, autofed:0, poops:0, lvls:0, evolved:false, capped: ms>OFFLINE_CAP};
  const STEPS = 24, sdt = dt/STEPS;
  for(let i=0;i<STEPS;i++){
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
      if(G.up.comedero>0){
        const th = [0,25,40,55][G.up.comedero];
        if(p.hunger < th && G.motas >= COST_MEAL){
          G.motas -= COST_MEAL; p.hunger = Math.min(100, p.hunger+35);
          p.weight = Math.min(99, p.weight+1); rep.autofed++;
        }
      }
      /* el goteo de XP también corre fuera (a media marcha, como las motas) */
      const lg = p.stage===STAGES.BABY ? EVO_LEVEL.child : (p.stage===STAGES.CHILD ? EVO_LEVEL.adult : 0);
      if(lg && p.level<lg){
        p.xpAcc = (p.xpAcc||0) + XP_TRICKLE_MS*sdt*0.5*(p.sleeping?0.3:1)*(p.sick?0.5:1);
        if(p.xpAcc>=1){
          const w = Math.floor(p.xpAcc); p.xpAcc -= w; p.xp += w;
          while(p.xp >= xpNeed(p.level) && p.level<lg){ p.xp -= xpNeed(p.level); p.level++; rep.lvls++; }
        }
      }
      const gain = petRate(p) * (sdt/1000) * 0.5;
      G.motas += gain; G.totalMotas += gain; rep.motas += gain;
      p.hygiene = Math.max(0, Math.min(100, p.hygiene - G.poops.length*ratePerMs(3)*hygMult(p)*sdt + (G.poops.length===0? ratePerMs(24)*sdt:0)));
      if(p.hunger<=0 && !p.hungerZeroSince) p.hungerZeroSince = now - dt*0.4;
      if(p.hunger>0) p.hungerZeroSince = null;
    }
  }
  for(let i=G.pets.length-1;i>=0;i--){
    const p = G.pets[i];
    if(p.hungerZeroSince && (now - p.hungerZeroSince) > RUNAWAY_AFTER && p.stage>STAGES.EGG){
      toast(currentNameOf(p)+' SE FUE...', 3200);
      spawnEgg(i);
    } else {
      const st0 = p.stage;
      checkEvolution(p, true);
      if(p.stage!==st0) rep.evolved = true;
    }
  }
  if(G.sel >= G.pets.length) G.sel = 0;
  if(ms > 2*60*1000) offlineReport = rep;
}
function currentNameOf(p){
  if(p.nick) return p.nick;
  if(p.form==='grimo') return 'GRIMO';
  if(p.stage===STAGES.EGG) return 'EL HUEVO';
  return LINES[p.line].names[p.form||'babyA'];
}
