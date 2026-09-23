"use strict";
/* =========================================================
   BITXO — render/minigames: dibujo de los minijuegos de la sala
   ========================================================= */
function drawMgEnd(){
  const m = UI.mg;
  panel(20,84,120,90);
  titleChip(80, 91, m.title);
  drawTextC('PUNTOS: '+m.scoreF, 80, 106, K);
  drawTextC('+'+fmt(m.rMotas)+'✦  +'+m.rXp+' XP', 80, 120, '#8a6a10');
  drawTextC(m.won? '¡VICTORIA!' : 'CASI...', 80, 136, m.won? '#3a7048':'#a03030');
  drawTextC('TOCA PARA SALIR', 80, 158, 'rgba(26,20,40,0.5)');
}
function drawCatch(t, dt){
  const m = UI.mg;
  drawScene(t);
  if(m.ph==='play'){
    m.t += dt;
    if(m.t<m.end && m.t>m.next){
      m.items.push({x:16+Math.random()*128, y:52, vy:0.05+Math.random()*0.05, bad:Math.random()<0.28});
      m.next = m.t + 400 + Math.random()*380;
    }
    m.px += (m.tx-m.px)*Math.min(1, dt*0.012);
    for(let i=m.items.length-1;i>=0;i--){
      const it = m.items[i];
      it.y += it.vy*dt;
      if(it.y>146 && Math.abs(it.x-m.px)<14){
        if(it.bad){
          m.combo=0; m.score=Math.max(0,m.score-2);
          SFX.nope(); vibrate(30);
          UI.particles.push({x:it.x,y:150,vy:-0.02,life:600,ch:'.',col:'#a4713a'});
        } else {
          m.combo++;
          const v = 1+Math.floor(m.combo/5);
          m.score += v;
          SFX.coin();
          UI.floats.push({x:it.x,y:140,s:'+'+v,col:'#ffd94a',life:600,vy:-0.03});
        }
        m.items.splice(i,1); continue;
      }
      if(it.y>170){ if(!it.bad) m.combo=0; m.items.splice(i,1); }
    }
    if(m.t>=m.end && m.items.length===0){
      finishMg('LLUVIA DE MOTAS', m.score, m.score, 8+Math.round(m.score/2), m.score>=14);
    }
  }
  for(const it of m.items){
    if(it.bad) ctx.drawImage(SPR.poop, Math.round(it.x)-4, Math.round(it.y)-4);
    else {
      px(it.x, it.y-3, 1, 7, '#ffd94a');
      px(it.x-3, it.y, 7, 1, '#ffd94a');
      px(it.x-1, it.y-1, 3, 3, '#fff8d0');
    }
  }
  const spr = currentSprite(), w=spr.width, h=spr.height;
  const mv = Math.abs(m.tx-m.px)>3, ph2 = Math.abs(Math.sin(t/120));
  px(m.px-w/2+2, 161, w-4, 2, 'rgba(0,0,0,0.25)');
  ctx.save();
  ctx.translate(Math.round(m.px), 161-(mv?ph2*3:0));
  ctx.scale((m.tx>=m.px?1:-1)*(mv?1-ph2*0.05:1), mv?1+ph2*0.06:1);
  ctx.drawImage(spr, -w/2, -h);
  ctx.restore();
  px(0,0,160,20,'rgba(14,16,48,0.55)');
  drawText('✦'+m.score, 5, 4, '#ffd94a');
  if(m.combo>2) drawTextC('COMBO X'+m.combo, 80, 4, '#7ac74f');
  drawText(Math.ceil(Math.max(0,(m.end-m.t))/1000)+'S', 138, 4, '#ffffff');
  px(0,20,Math.round(160*Math.max(0,1-m.t/m.end)),2,'#5ec8d8');
  if(m.t<2600 && m.ph==='play') drawTextC('TOCA PARA MOVERTE', 80, 34, '#ffffff');
  drawParticles(dt);
  if(m.ph==='end') drawMgEnd();
}
function drawDance(t, dt){
  const m = UI.mg;
  const now = performance.now();
  px(0,0,160,272,'#1a1428');
  for(let i=0;i<14;i++){
    const on = Math.floor(t/240+i)%3===0;
    px((i*41+9)%160, (i*29+6)%70, 1,1, on?'#8a6ae8':'#3a3458');
  }
  px(0,150,160,60,'#2a2440');
  if(m.ph==='play'){
    let nb = null, nd = 1e9;
    for(const b of m.beats){
      if(!b.sched && b.t-now<420){
        b.sched = true;
        const off = Math.max(0,(b.t-now)/1000);
        tone({f:NOTE(m.disco.base, m.disco.tune[b.i%16]), at:sfxAt(off), d:0.17, type:'p25', vol:0.055, send:0.15});
        kick(sfxAt(off), 0.08);
        nz(sfxAt(off+0.14), 0.03, 0.015, 9000, 3);
      }
      if(!b.hit && now>b.t+150){ b.hit=-1; m.combo=0; m.judge='FALLO'; m.judgeT=now; }
      if(!b.hit){ const d=Math.abs(b.t-now); if(d<nd){ nd=d; nb=b; } }
    }
    if(now > m.end){
      const max = m.beats.length*3;
      finishMg('BAILE', m.score, Math.round(m.score*(m.disco?m.disco.mult:1)), 12+m.score, m.score >= max*0.55);
      if(m.disco && m.disco.id==='nana'){
        const p2 = AP();
        if(!p2.sleeping){ p2.sleeping = true; SFX.sleep(); toast('LA NANA LE CIERRA LOS OJOS...', 2800); }
      }
    }
  }
  /* pista */
  px(20,198,120,26,'rgba(255,255,255,0.06)');
  px(24,200,16,22,'rgba(255,217,74,0.35)');
  px(30,198,4,26,'rgba(255,217,74,0.6)');
  for(const b of m.beats){
    if(b.hit) continue;
    const x = 32 + (b.t-now)*0.075;
    if(x>-8 && x<164){
      px(x-2, 204, 5, 14, '#ffd94a');
      px(x-1, 206, 3, 10, '#fff8d0');
    }
  }
  /* bitxo bailando */
  const spr = currentSprite(), w=spr.width, h=spr.height;
  let amp = 0;
  for(const b of m.beats){ const d=Math.abs(b.t-now); if(d<140) amp=Math.max(amp,1-d/140); }
  ctx.save();
  ctx.translate(80, 150 - amp*6);
  ctx.scale((Math.floor(now/560)%2? -1:1)*(1-amp*0.08), 1+amp*0.12);
  ctx.drawImage(spr, -w/2, -h);
  ctx.restore();
  drawTextC('- '+(m.disco?m.disco.name.replace('DISCO ',''):'BAILE')+' -', 80, 8, '#ffffff');
  drawTextC('✦'+m.score+'  COMBO X'+m.combo, 80, 18, '#ffd94a');
  if(m.judge && now-m.judgeT<500){
    drawTextC(m.judge, 80, 60, m.judge==='¡PERFECTO!'?'#ffd94a':(m.judge==='BIEN'?'#7ac74f':'#e2574c'));
  }
  drawTextC('TOCA CUANDO LLEGUE', 80, 232, 'rgba(255,255,255,0.5)');
  drawTextC('A LA ZONA DORADA', 80, 240, 'rgba(255,255,255,0.5)');
  drawParticles(dt);
  if(m.ph==='end') drawMgEnd();
}
function drawSimon(t, dt){
  const m = UI.mg;
  const now = performance.now();
  px(0,0,160,272,'#12242a');
  px(0,0,160,20,'rgba(14,16,48,0.6)');
  drawTextC('- SIMON -', 80, 4, '#ffffff');
  drawTextC('RONDA '+m.round, 80, 12, '#ffd94a');
  if(m.ph==='show' && now>m.showT){
    if(m.showI < m.seq.length){
      m.lit = m.seq[m.showI]; m.litT = now;
      beep(FLOWERS[m.lit].f, 0.28, 0, 'triangle', 0.08);
      m.showI++; m.showT = now + 560;
    } else {
      m.ph='input'; m.idx=0;
    }
  }
  const spr = currentSprite(), w=spr.width, h=spr.height;
  ctx.save(); ctx.translate(80, 96);
  const watch = m.ph==='show' && now-m.litT<300;
  ctx.scale(1, watch?1.06:1);
  ctx.drawImage(spr, -w/2, -h);
  ctx.restore();
  for(let i=0;i<4;i++){
    const F = FLOWERS[i];
    const lit = m.lit===i && now-m.litT<330;
    px(F.x-20, F.y-20, 40, 40, lit? '#f6efe0' : '#1c3a42');
    px(F.x-20,F.y-20,40,1,K); px(F.x-20,F.y+19,40,1,K);
    px(F.x-20,F.y-20,1,40,K); px(F.x+19,F.y-20,1,40,K);
    const c = lit? F.c : F.c+'88';
    ctx.fillStyle = lit? F.c : 'rgba(255,255,255,0.25)';
    px(F.x-6,F.y-2,12,4, c); px(F.x-2,F.y-6,4,12, c);
    px(F.x-4,F.y-4,8,8, c);
    px(F.x-1,F.y-1,2,2, lit? '#ffffff' : '#0e1030');
  }
  if(m.ph==='input') drawTextC('¡REPITE LA SECUENCIA!', 80, 216, '#ffffff');
  if(m.ph==='show') drawTextC('MIRA CON ATENCION...', 80, 216, 'rgba(255,255,255,0.6)');
  drawParticles(dt);
  if(m.ph==='end') drawMgEnd();
}

/* ---------------- SALTA: DIBUJO ---------------- */
function drawJump(t, dt){
  const m = UI.mg;
  drawScene(t);
  if(m.ph==='play'){
    m.t += dt;
    /* física del salto */
    if(m.y<0 || m.vy!==0){
      m.vy += 0.0009*dt;
      m.y = Math.min(0, m.y + m.vy*dt);
      if(m.y===0) m.vy = 0;
    }
    /* obstáculos que llegan más rápido cada vez */
    const speed = 0.055 + Math.min(0.05, m.t*0.0000022);
    if(m.t<m.end && m.t>m.next){
      m.obs.push({x:172, h:8+Math.random()*5, bad:Math.random()<0.3});
      m.next = m.t + Math.max(520, 1150 - m.t*0.02);
    }
    if(m.inv>0) m.inv -= dt;
    for(let i=m.obs.length-1;i>=0;i--){
      const o = m.obs[i];
      o.x -= speed*dt;
      if(!o.passed && o.x < 40-6){
        o.passed = true;
        if(-m.y > o.h){
          m.combo++; m.score++;
          SFX.coin();
          UI.floats.push({x:44, y:140, s:'+1', col:'#ffd94a', life:500, vy:-0.03});
        } else if(m.inv<=0){
          m.combo=0; m.score=Math.max(0,m.score-1); m.inv=700;
          SFX.nope(); vibrate(40);
        }
      }
      if(o.x<-12) m.obs.splice(i,1);
    }
    if(m.t>=m.end && m.obs.length===0) jumpFinish();
  }
  /* obstáculos */
  for(const o of m.obs){
    const ox = Math.round(o.x), oh = Math.round(o.h);
    px(ox-4, 161-oh, 8, oh, o.bad ? '#6a6a78' : '#8a6a3a');
    px(ox-4, 161-oh, 8, 1, K); px(ox-4, 161-oh, 1, oh, K); px(ox+3, 161-oh, 1, oh, K);
    if(o.bad){ px(ox-2, 161-oh-3, 4, 3, '#9a9aa4'); }
  }
  /* el bitxo corre en el sitio y salta */
  const spr = currentSprite(), w=spr.width, h=spr.height;
  const run = m.y===0 ? Math.abs(Math.sin(t/110))*2 : 0;
  const blink2 = m.inv>0 && Math.floor(t/80)%2===0;
  px(40-w/2+2, 161, w-4, 2, 'rgba(0,0,0,0.25)');
  if(!blink2){
    ctx.save();
    ctx.translate(40, Math.round(161 + m.y - run));
    ctx.drawImage(spr, -w/2, -h);
    ctx.restore();
  }
  px(0,0,160,20,'rgba(14,16,48,0.55)');
  drawText('✦'+m.score, 5, 4, '#ffd94a');
  if(m.combo>2) drawTextC('RACHA X'+m.combo, 80, 4, '#7ac74f');
  drawText(Math.ceil(Math.max(0,(m.end-m.t))/1000)+'S', 138, 4, '#ffffff');
  px(0,20,Math.round(160*Math.max(0,1-m.t/m.end)),2,'#5ec8d8');
  if(m.t<2600 && m.ph==='play') drawTextC('TOCA PARA SALTAR', 80, 34, '#ffffff');
  drawParticles(dt);
  if(m.ph==='end') drawMgEnd();
}

/* ---------------- TOPO: DIBUJO ---------------- */
function drawTopo(t, dt){
  const m = UI.mg;
  drawScene(t);
  if(m.ph==='play'){
    m.t += dt;
    if(m.t<m.end && m.t>m.next){
      const empty = [];
      for(let i=0;i<9;i++) if(!m.holes[i].up) empty.push(i);
      if(empty.length){
        const i = empty[Math.floor(Math.random()*empty.length)];
        const r = Math.random();
        m.holes[i].up = r<0.14 ? 'friend' : (r<0.28 ? 'gold' : 'ratuco');
        m.holes[i].hideAt = m.t + (m.holes[i].up==='gold' ? 750 : 1150) - Math.min(400, m.t*0.014);
      }
      m.next = m.t + Math.max(420, 850 - m.t*0.016);
    }
    for(const h of m.holes){
      if(h.up && m.t>h.hideAt){ if(h.up!=='friend'){ m.combo=0; } h.up=null; }
    }
    if(m.t>=m.end) topoFinish();
  }
  /* madrigueras y bichos */
  for(let i=0;i<9;i++){
    const P = TOPO_POS[i], h = m.holes[i];
    px(P.x-13, P.y+7, 26, 5, 'rgba(26,20,40,0.5)');
    px(P.x-11, P.y+6, 22, 3, '#5a4632');
    if(h.up){
      const spr = h.up==='friend' ? SPR.marea_babyA[0] : ESPR.ratuco;
      ctx.save();
      ctx.beginPath(); ctx.rect(P.x-14, P.y-18, 28, 26); ctx.clip();
      if(h.up==='gold'){
        ctx.drawImage(spr, P.x-spr.width/2, P.y+8-spr.height);
        ctx.globalCompositeOperation='source-atop';
        ctx.fillStyle='rgba(255,217,74,0.45)';
        ctx.fillRect(P.x-14, P.y-18, 28, 26);
        ctx.globalCompositeOperation='source-over';
      } else {
        ctx.drawImage(spr, P.x-spr.width/2, P.y+8-spr.height);
      }
      ctx.restore();
      if(h.up==='gold' && Math.floor(t/200)%2===0) drawTextC('✦', P.x+10, P.y-16, '#ffd94a');
      if(h.up==='friend' && Math.floor(t/300)%2===0) drawTextC('♥', P.x+10, P.y-16, '#f2a2b8');
    } else if(performance.now()-h.bopT < 220){
      px(P.x-4, P.y-8, 8, 2, '#ffd94a');
      px(P.x-7, P.y-4, 3, 3, '#fff8d0'); px(P.x+5, P.y-4, 3, 3, '#fff8d0');
    }
  }
  px(0,0,160,20,'rgba(14,16,48,0.55)');
  drawText('✦'+m.score, 5, 4, '#ffd94a');
  if(m.combo>2) drawTextC('RACHA X'+m.combo, 80, 4, '#7ac74f');
  drawText(Math.ceil(Math.max(0,(m.end-m.t))/1000)+'S', 138, 4, '#ffffff');
  px(0,20,Math.round(160*Math.max(0,1-m.t/m.end)),2,'#a4713a');
  if(m.t<2600 && m.ph==='play') drawTextC('¡ZUMBALES! CUIDA A LOS AZULES', 80, 34, '#ffffff');
  drawParticles(dt);
  if(m.ph==='end') drawMgEnd();
}

/* ---------------- PESCA: DIBUJO ---------------- */
function drawPesca(t, dt){
  const m = UI.mg;
  pescaStep(dt);
  const ph = dayPhase(), S = SKY[ph];
  /* cielo y lago */
  px(0,0,160,64,S.bands[1]);
  px(0,64,160,20,S.bands[2]);
  px(0,84,160,120,'#2a4a8a');
  px(0,84,160,3,'#3a6bb0');
  for(let i=0;i<7;i++){
    const wy = 96+i*14 + Math.sin(t/900+i)*2;
    px((i*43+t*0.01)%160, wy, 8, 1, 'rgba(154,220,240,0.35)');
  }
  px(0,204,160,68,'#1c3a2e');
  /* orilla y bitxo pescando */
  px(0,84,44,10,'#3a7048'); px(0,80,38,6,'#57a05e');
  const spr = currentSprite(), w=spr.width, h=spr.height;
  ctx.save();
  ctx.translate(20, 84);
  ctx.drawImage(spr, -w/2, -h);
  ctx.restore();
  /* caña en las manos, hacia el agua */
  px(24,74,2,2,'#8a6a3a'); px(26,71,2,3,'#8a6a3a'); px(28,68,2,3,'#8a6a3a');
  px(30,64,2,4,'#8a6a3a'); px(32,59,2,5,'#8a6a3a'); px(34,54,2,5,'#8a6a3a');
  const fx2 = 100, fy = m.ph==='reel' ? 118+Math.sin(t/90)*3 : 112+Math.sin(t/500)*2;
  /* sedal */
  const steps = 14;
  for(let i=0;i<=steps;i++){
    const lx = 35 + (fx2-35)*i/steps;
    const ly = 55 + (fy-8-55)*Math.pow(i/steps, 1.6);
    px(lx, ly, 1, 1, 'rgba(240,240,255,0.55)');
  }
  /* flotador o pez luchando */
  if(m.ph==='wait'){
    const biting = m.t>m.biteAt && m.t<m.biteAt+420;
    px(fx2-2, fy-6+(biting?3:0), 4, 4, '#e2574c');
    px(fx2-2, fy-2+(biting?3:0), 4, 2, '#f6efe0');
    if(biting){
      drawTextC('¡!', fx2, fy-22, '#ffd94a');
      px(fx2-8, fy+2, 4, 1, 'rgba(255,255,255,0.6)'); px(fx2+5, fy+2, 4, 1, 'rgba(255,255,255,0.6)');
    }
  } else if(m.ph==='reel'){
    const f = m.fish;
    ctx.save();
    ctx.translate(fx2+Math.sin(t/120)*4, fy);
    ctx.scale(Math.sin(t/240)>0?1:-1, 1);
    ctx.drawImage(SPR.pescado, -5, -3);
    ctx.restore();
    px(fx2-10, fy+6, 4, 1, 'rgba(255,255,255,0.5)'); px(fx2+7, fy+5, 5, 1, 'rgba(255,255,255,0.5)');
    /* barra de tensión con zonas de peligro visibles */
    px(146,84,10,110,'rgba(0,0,0,0.4)');
    px(147,85,8,108,'#1c3a42');
    const th = Math.round(108*m.tension/100);
    px(147, 85+108-th, 8, th, m.tension>88||m.tension<14 ? '#e2574c' : '#7ac74f');
    ctx.fillStyle = 'rgba(226,87,76,0.55)';
    ctx.fillRect(147, 85, 8, Math.round(108*0.12));
    ctx.fillRect(147, 85+Math.round(108*0.88), 8, Math.round(108*0.12));
    drawTextC('TENSION', 126, 88, '#ffffff');
    const hold = Math.min(1, m.holdT/3400);
    px(20,196,120,5,'rgba(0,0,0,0.4)');
    px(21,197,Math.round(118*hold),3, m.fish.col);
  }
  /* peces ya pescados */
  for(let i=0;i<m.caught.length;i++){
    px(6+i*12, 210, 9, 5, m.caught[i].col);
    px(6+i*12+9, 211, 2, 3, m.caught[i].col);
  }
  px(0,0,160,20,'rgba(14,16,48,0.55)');
  drawText('✦'+m.score, 5, 4, '#ffd94a');
  drawText(Math.ceil(Math.max(0,(m.end-m.t))/1000)+'S', 138, 4, '#ffffff');
  px(0,20,Math.round(160*Math.max(0,1-m.t/m.end)),2,'#4a90d8');
  const hint2 = m.ph==='reel' ? 'TOCA: TENSION EN VERDE' : (m.t<2600 ? 'TOCA CUANDO PIQUE' : null);
  if(hint2){
    const hw = textW(hint2)+8;
    px(80-hw/2, 31, hw, 9, 'rgba(14,16,48,0.6)');
    drawTextC(hint2, 80, 33, '#ffffff');
  }
  drawParticles(dt);
  if(m.ph==='end') drawMgEnd();
}

/* ---------------- PARQUE DE ENTRENO ---------------- */
/* ---------------- MEMORIA: parejas de la despensa ---------------- */
function drawMemo(t, dt){
  const m = UI.mg;
  m.t += dt;
  memoStep();
  if(m.ph==='play' && m.t>=m.end) memoFinish();
  drawScene(t);
  ctx.fillStyle='rgba(10,12,32,0.55)'; ctx.fillRect(0,0,LW,LH);
  drawTextC('MEMORIA', 80, 22, '#ffffff');
  px(20,32,120,4,'rgba(255,255,255,0.15)');
  px(20,32,Math.round(120*Math.max(0,(m.end-m.t))/m.end),4,'#8a6ae8');
  drawTextC('PAREJAS '+m.score+'/6 · INTENTOS '+m.tries, 80, 42, 'rgba(255,255,255,0.7)');
  for(let i=0;i<12;i++){
    const P = MEMO_POS[i], c = m.cards[i];
    if(c.done){
      px(P.x,P.y,30,38,'rgba(122,199,79,0.18)');
      const spr = SPR[c.k];
      ctx.globalAlpha = 0.45;
      ctx.drawImage(spr, P.x+Math.round((30-spr.width)/2), P.y+Math.round((38-spr.height)/2));
      ctx.globalAlpha = 1;
    } else if(c.flip){
      px(P.x,P.y,30,38,'#f6efe0');
      px(P.x,P.y,30,1,K); px(P.x,P.y+37,30,1,K); px(P.x,P.y,1,38,K); px(P.x+29,P.y,1,38,K);
      const spr = SPR[c.k];
      ctx.drawImage(spr, P.x+Math.round((30-spr.width)/2), P.y+Math.round((38-spr.height)/2));
    } else {
      px(P.x,P.y,30,38,'#8a6ae8');
      px(P.x,P.y,30,1,K); px(P.x,P.y+37,30,1,K); px(P.x,P.y,1,38,K); px(P.x+29,P.y,1,38,K);
      px(P.x+2,P.y+2,26,1,'#a88af8');
      drawTextC('?', P.x+15, P.y+16, '#f6efe0');
    }
  }
  drawTextC('ENCUENTRA LAS PAREJAS', 80, 204, 'rgba(255,255,255,0.5)');
  if(m.ph==='end') drawMgEnd();
  drawParticles(dt);
}

/* ---------------- GLOBO: que no toque el suelo ---------------- */
function drawGlobo(t, dt){
  const m = UI.mg;
  globoStep(dt);
  drawScene(t);
  ctx.fillStyle='rgba(10,12,32,0.35)'; ctx.fillRect(0,0,LW,LH);
  drawTextC('GLOBO', 80, 22, '#ffffff');
  px(20,32,120,4,'rgba(255,255,255,0.15)');
  px(20,32,Math.round(120*Math.max(0,(m.end-m.t))/m.end),4,'#f78fb3');
  drawText('TOQUES '+m.score, 12, 42, '#ffffff');
  for(let i=0;i<3;i++) drawText(i<m.lives?'♥':'.', 122+i*10, 42, i<m.lives?'#e2574c':'rgba(255,255,255,0.3)');
  px(0,170,160,1,'rgba(226,87,76,0.5)');
  /* el globo: gordito, con brillo, nudo y cordel al viento */
  const gx = Math.round(m.x), gy = Math.round(m.y);
  const sq = performance.now()-m.hitT<120;
  const blocks = sq
    ? [[-7,-8,14,2],[-10,-6,20,4],[-12,-2,24,6],[-10,4,20,3],[-7,7,14,2]]
    : [[-6,-11,12,2],[-9,-9,18,4],[-11,-5,22,9],[-9,4,18,4],[-6,8,12,3],[-3,11,6,2]];
  for(const b2 of blocks) px(gx+b2[0], gy+b2[1], b2[2], b2[3], '#f78fb3');
  px(gx-6,gy-7,4,5,'#ffd3e2');
  px(gx-2,gy+(sq?9:13),4,2,'#d8578a');
  for(let i=0;i<7;i++) px(gx+Math.round(Math.sin(t/280+i)*2), gy+(sq?12:16)+i*2, 1, 1, 'rgba(246,239,224,0.7)');
  drawTextC('¡QUE NO TOQUE EL SUELO!', 80, 204, 'rgba(255,255,255,0.5)');
  if(m.ph==='end') drawMgEnd();
  drawParticles(dt);
}
