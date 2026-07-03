"use strict";
/* =========================================================
   BITXO — render/pets: bitxos, juguetes, salvajes y cacas
   ========================================================= */
/* ---------------- DIBUJO: MASCOTAS Y SALVAJES ---------------- */
function drawOnePet(p, i, t){
  const baseY = 161;
  const now = performance.now();
  const sel = i===G.sel;
  if((p.swingT||0)>0){
    const sw = Math.sin(performance.now()/300)*6;
    const def2 = p.form==='grimo' ? 'grimo' : p.line+'_'+(p.form||'babyA');
    const spr2 = SPR[def2][1];
    const w2=spr2.width, h2=spr2.height;
    ctx.save();
    ctx.translate(Math.round(27+sw), 149);
    ctx.scale(sw>=0?1:-1, 1);
    ctx.drawImage(spr2, -w2/2, -h2+2);
    ctx.restore();
    if(sel && Math.floor(t/400)%2===0){ px(26,149-h2-6,2,2,'#ffd94a'); px(25,149-h2-8,4,2,'#ffd94a'); }
    return;
  }
  if(p.exped){
    px(p.rx-1,147,2,14,'#5a4632');
    px(p.rx-8,139,16,10,'#8a6a3a');
    px(p.rx-8,139,16,1,K); px(p.rx-8,148,16,1,K);
    px(p.rx-8,139,1,10,K); px(p.rx+7,139,1,10,K);
    const left = Math.max(0, Math.ceil((p.exped.until-Date.now())/60000));
    const lbl = left>=60? Math.ceil(left/60)+'H' : left+'M';
    drawTextC(lbl, p.rx, 141, '#f6efe0');
    if(sel && Math.floor(t/400)%2===0){ px(p.rx-1,131,2,2,'#ffd94a'); px(p.rx-2,129,4,2,'#ffd94a'); }
    return;
  }
  if(p.stage===STAGES.EGG){
    let ey = 160, dropping = now-p.dropT < 1100;
    if(dropping){
      const pr = Math.min(1, (now-p.dropT)/1100);
      ey = -30 + 190*(pr*pr);
      if(Math.random()<0.4) UI.particles.push({x:p.rx-6+Math.random()*12, y:ey-8, vy:0.01, life:450, ch:'.', col:'#ffd94a'});
    }
    const wob = (!dropping && now-p.hop < 300) ? Math.sin(t/30)*2 : (dropping?0:Math.sin(t/300)*1);
    if(!dropping) px(p.rx-8,161,16,2,'rgba(0,0,0,0.25)');
    ctx.save();
    ctx.translate(Math.round(p.rx+wob), Math.round(ey));
    ctx.drawImage(SPR['egg_'+p.line][0], -6, -13);
    if(p.tapsOnEgg>6 || Date.now()-p.bornAt > T_HATCH*0.6) ctx.drawImage(SPR.eggCrack, -6, -13);
    ctx.restore();
    if(sel && !dropping && Math.floor(t/400)%2===0){
      px(p.rx-1, ey-22, 2, 2, '#ffd94a');
      px(p.rx-2, ey-24, 4, 2, '#ffd94a');
    }
    return;
  }
  const content = p.eatT>0 || (now - (p.petT||0) < 900);
  const def = p.form==='grimo' ? {spr:'grimo'} : {spr:p.line+'_'+(p.form||'babyA')};
  const frames = SPR[def.spr];
  const blinkNow = now < p.blinkAt+140;
  const spr = (p.sleeping || content || blinkNow) ? frames[1] : frames[0];
  const w = spr.width, h = spr.height;

  let sx=1, sy=1, lift=0;
  sy *= 1 + Math.sin(t/420 + i*2)*0.015;
  const walking = Math.abs(p.tx-p.rx)>2 && !p.sleeping && !p.eatT && !p.trainT && UI.mode==='main';
  if(walking){
    const ph = Math.abs(Math.sin(t/220 + i));
    lift = ph*3; sy *= 1+ph*0.05; sx *= 1-ph*0.04;
  }
  if(p.trainT>0){
    const ph = Math.abs(Math.sin(t/90));
    lift = ph*3; sy *= 1+ph*0.09; sx *= 1-ph*0.06;
  }
  if(p.eatT>0){
    const ch = Math.abs(Math.sin(t/110));
    sy *= 1-ch*0.1; sx *= 1+ch*0.07;
  }
  if(!p.sleeping && !p.eatT){
    if(p.hunger<25){ sy*=0.93; sx*=1.05; }
    else if(p.happy<25){ sy*=0.96; }
  }
  if(p.happy>78 && !p.sleeping && !p.eatT && !p.trainT && !walking && UI.mode==='main'){
    if(!p.joyAt || now > p.joyAt + 4500 + (p.joySeed||0)){
      p.joyAt = now; p.joySeed = Math.random()*3500;
      if(Math.random()<0.4 && i===G.sel){ spawnHearts(1); petVoice(p); }
    }
    const jt = now - p.joyAt;
    if(jt < 520){
      const pr = jt/520, arc = Math.sin(pr*Math.PI);
      lift += arc*7; sy *= 1+arc*0.12; sx *= 1-arc*0.08;
    }
  }
  if(p.sleeping){ sy*=0.94; sx*=1.03; lift=0; }

  const x = Math.round(p.rx);
  const shw = Math.max(6, Math.round((w-4)*sx * (1 - lift*0.04)));
  px(x-shw/2, 161, shw, 2, 'rgba(0,0,0,0.25)');
  ctx.save();
  ctx.translate(x, baseY - lift);
  ctx.scale(p.dir*sx, sy);
  ctx.drawImage(spr, -w/2, p.sleeping ? -h+3 : -h);
  if(p.hat && SPR['hat_'+p.hat]){
    const hs = SPR['hat_'+p.hat];
    ctx.drawImage(hs, -Math.floor(hs.width/2), (p.sleeping ? -h+3 : -h) - hs.height + 2);
  }
  ctx.restore();

  const yTop = baseY - lift - Math.round(h*sy);

  if(sel && Math.floor(t/400)%2===0){
    px(x-1, yTop-8, 2, 2, '#ffd94a');
    px(x-2, yTop-10, 4, 2, '#ffd94a');
  }

  if(p.sleeping){
    const zi = Math.floor(t/500)%3;
    for(let z=0;z<=zi;z++) drawText('Z', x+8+z*5, yTop-4-z*5, '#eef4ff');
  } else {
    if(p.hunger<25){
      const dy = (t/7)%9;
      px(x + Math.round(w*sx/2)-1, yTop+3+dy, 1, 2, '#bde8f8');
    } else if(p.happy<25){
      const dy = (t/9)%7;
      px(x-3, yTop+6+dy, 1, 2, '#6db1ff');
    }
    let icon = null;
    if(p.hunger<25) icon='meal';
    else if(G.poops.length>0 && p.hygiene<50) icon='poo';
    else if(p.happy<25) icon='sad';
    else if(p.energy<15) icon='zzz';
    if(icon && Math.floor(t/600)%3!==2){
      const bx = x+10, by = yTop-14;
      px(bx-2,by-2,14,13,'#f6efe0');
      px(bx-2,by-2,14,1,K); px(bx-2,by+10,14,1,K);
      px(bx-2,by-2,1,13,K); px(bx+11,by-2,1,13,K);
      px(bx-1,by+11,2,2,'#f6efe0');
      if(icon==='meal') ctx.drawImage(SPR.meal, bx, by);
      if(icon==='poo')  ctx.drawImage(SPR.poop, bx+1, by+1);
      if(icon==='sad')  drawText('♥', bx+3, by+2, '#8a8a9a');
      if(icon==='zzz')  drawText('Z', bx+3, by+2, '#5a6aa0');
    }
  }
  if(p.eatT>0){
    const spr2 = SPR[p.feedKind] || SPR.meal;
    const bite = Math.floor((1600-p.eatT)/500);
    ctx.save();
    ctx.beginPath(); ctx.rect(x+10, 140, 12, 22); ctx.clip();
    ctx.drawImage(spr2, x+11, 152+bite*2);
    ctx.restore();
  }
  if(p.trainT>0){
    drawText('!', x-16, yTop-6, '#ffd94a');
    drawText('!', x+13, yTop-6, '#ffd94a');
  }
}
function drawToys(t){
  if(!G.toys) return;
  if(G.toys.columpio){
    px(15,128,2,32,'#5a4632');
    px(38,128,2,32,'#5a4632');
    px(13,126,29,3,'#8a6a3a');
    const sw = Math.sin(t/300)*6;
    px(Math.round(22+sw),131,1,17,'#3b2f2f');
    px(Math.round(31+sw),131,1,17,'#3b2f2f');
    px(Math.round(20+sw),148,14,3,'#8a6a3a');
  }
  if(G.toys.pelota && G.ballX!==undefined){
    px(Math.round(G.ballX)-3,160,7,2,'rgba(0,0,0,0.25)');
    ctx.drawImage(SPR.pelota, Math.round(G.ballX)-3, 153);
  }
  if(G.toys.caja){
    const ready = Date.now() >= (G.cajaReadyAt||0);
    const hop = ready? Math.abs(Math.sin(t/200))*2 : 0;
    px(100,159,12,2,'rgba(0,0,0,0.25)');
    ctx.drawImage(SPR.caja, 101, Math.round(152-hop));
    if(ready && Math.floor(t/300)%2===0) drawText('!', 105, 138, '#ffd94a');
  }
}
function drawPets(t){
  const order = G.pets.map((p,i)=>i).sort((a,b)=>G.pets[a].rx-G.pets[b].rx);
  for(const i of order) drawOnePet(G.pets[i], i, t);
}
function drawWild(t){
  if(!G.wild) return;
  const w = G.wild;
  const spr = ESPR[w.kind];
  const shake = Math.sin(t/60)*0.8;
  px(w.x-spr.width/2+2, 161, spr.width-4, 2, 'rgba(0,0,0,0.25)');
  ctx.save();
  ctx.translate(Math.round(w.x+shake), 161);
  if(w.dir<0){} else { ctx.scale(-1,1); }
  ctx.drawImage(spr, -spr.width/2, -spr.height);
  ctx.restore();
  if(Math.floor(t/350)%2===0){
    drawText('!', w.x-1, 161-spr.height-9, '#e2574c');
  }
  /* nivel visible: lee el peligro antes de entrar */
  const fighters = G.pets.filter(q=>q.stage>=STAGES.CHILD);
  if(w.nv && fighters.length){
    const ref = AP().stage>=STAGES.CHILD ? AP() : fighters.reduce((a,b)=>playerPower(a)>=playerPower(b)?a:b);
    const d = w.nv - playerPower(ref);
    const col = d<=-2 ? '#7ac74f' : (d<=1 ? '#f6efe0' : (d<=3 ? '#f0a04b' : '#e2574c'));
    drawTextC((w.elite?'★':'')+'NV'+w.nv, w.x, 161-spr.height-17, w.elite ? '#ffd94a' : col);
  }
  const left = Math.max(0, Math.ceil((w.stealAt-Date.now())/1000));
  if(left<20) drawTextC(String(left), w.x, 161-spr.height-25, '#e2574c');
}

function drawPoops(t){
  for(const p of G.poops){
    ctx.drawImage(SPR.poop, Math.round(p.x)-4, 156);
    if(Math.floor(t/400)%2===0){
      px(p.x-1, 150,1,1,'#8a9b6a');
      px(p.x+3, 148,1,1,'#8a9b6a');
    }
  }
  if(UI.sweepT && performance.now()-UI.sweepT < 500){
    const k = (performance.now()-UI.sweepT)/500;
    px(160-k*180, 150, 14, 14, 'rgba(190,240,245,0.6)');
  }
}


/* ---------------- CARTEL DE MISIONES Y BUHONERO ---------------- */
function drawSign(t){
  px(149,148,2,13,'#5a4632');
  px(143,138,14,11,'#8a6a3a');
  px(143,138,14,1,K); px(143,148,14,1,K);
  px(143,138,1,11,K); px(156,138,1,11,K);
  if(questClaimable() && Math.floor(t/400)%2===0) drawTextC('!', 150, 141, '#ffd94a');
  else drawTextC('M', 150, 141, '#f6efe0');
}
function drawBuho(t){
  if(!G.buho) return;
  const b = G.buho;
  const spr = SPR.grimo[0];
  const bx = Math.round(b.x);
  px(bx-6, 161, 12, 2, 'rgba(0,0,0,0.25)');
  /* hatillo al hombro */
  const hx = bx + (b.dir<0 ? 8 : -10);
  px(hx, 143, 2, 9, '#5a4632');
  px(hx-2, 139, 6, 5, '#c8a04b');
  px(hx-2, 139, 6, 1, K); px(hx-2, 143, 6, 1, K);
  px(hx-2, 139, 1, 5, K); px(hx+3, 139, 1, 5, K);
  ctx.save();
  ctx.translate(bx, 161);
  ctx.scale(b.dir<0 ? -1 : 1, 1 + Math.sin(t/420)*0.015);
  ctx.drawImage(spr, -spr.width/2, -spr.height);
  ctx.restore();
  if(Math.floor(t/600)%3!==2) drawTextC('✦', bx, 138, '#ffd94a');
  const left = Math.max(0, Math.ceil((b.until-Date.now())/1000));
  if(left<30) drawTextC(String(left), bx, 130, '#e2574c');
}
