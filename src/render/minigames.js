"use strict";
/* =========================================================
   BITXO — render/minigames: dibujo de combate y minijuegos
   ========================================================= */
/* ---------------- COMBATE: DIBUJO ---------------- */
function drawBattle(t, dt){
  battleStep(dt);
  const b = UI.bt; if(!b) return;
  const p = AP();
  const ph = dayPhase(), S = SKY[ph];
  const now = performance.now();

  ctx.save();
  /* zoom de crítico: golpe de cámara */
  if(b.zoomT>0){
    const z = 1 + 0.09*Math.min(1, b.zoomT/170);
    ctx.translate(80, 120); ctx.scale(z, z); ctx.translate(-80, -120);
  }
  const shk = (now-b.shake<220) ? Math.sin(t/16)*(b.crit?3:2) : 0;
  ctx.translate(Math.round(shk), 0);

  /* ----- escenario: el prado al atardecer/noche/día ----- */
  px(-8,0,176,58,S.bands[0]);
  px(-8,58,176,46,S.bands[1]);
  px(-8,104,176,36,S.bands[2]);
  if(ph==='night'){ for(const st of stars) if(Math.sin(t/600+st.t)>0.2) px(st.x, st.y, 1,1,'#dfe8ff'); }
  /* colinas en silueta */
  for(let x=-8;x<168;x+=8){ const hh = 9+Math.round(6*Math.sin(x/17+2)); px(x,140-hh,8,hh,'rgba(18,22,38,0.75)'); }
  px(-8,140,176,132, ph==='night' ? '#131b2c' : (ph==='day' ? '#2c4636' : '#26303a'));
  px(-8,140,176,2,'rgba(0,0,0,0.35)');
  /* plataformas de combate */
  const plat = (cx,cy)=>{
    px(cx-20,cy,40,3,'rgba(0,0,0,0.35)');
    px(cx-16,cy+3,32,2,'rgba(0,0,0,0.22)');
  };
  plat(46,152); plat(112,152);
  /* aviso rojo de carga del jefe */
  if(b.phase==='eTele' && b.bigAtk && Math.floor(t/120)%2===0){
    ctx.fillStyle='rgba(226,87,76,0.16)'; ctx.fillRect(-8,0,176,272);
  }

  /* ----- luchadores ----- */
  const pd = currentFormDef();
  const pspr = SPR[pd.spr][0];
  const espr = ESPR[b.kind];
  const bob = Math.sin(t/300)*1.2;

  let pox=0, eox=0, eleanX=0;
  if(b.phase==='panim') pox = Math.sin(Math.min(1,b.t/600)*Math.PI)*50;
  if(b.phase==='superAnim') pox = Math.sin(Math.min(1,b.t/1350)*Math.PI)*10;
  if(b.phase==='eanim') eox = -Math.sin(Math.min(1,b.t/600)*Math.PI)*50;
  if(b.phase==='eTele') eleanX = Math.sin(b.t/60)*(b.bigAtk?2.5:1.5);

  /* jugador */
  const pHurt = now-b.phurtT<130;
  ctx.save();
  ctx.translate(Math.round(46+pox), Math.round(150+(b.phase==='timing'?bob:0)));
  ctx.drawImage(pHurt ? silhouette(pspr) : pspr, -pspr.width/2, -pspr.height);
  if(p.hat && SPR['hat_'+p.hat]){
    const hs = SPR['hat_'+p.hat];
    ctx.drawImage(hs, -Math.floor(hs.width/2), -pspr.height - hs.height + 2);
  }
  ctx.restore();
  /* escudo del bloqueo */
  const blockWin = (b.phase==='eanim' && b.t<320 ) || (b.phase==='eTele' && b.t > (b.bigAtk?950:620)-180);
  if(b.blocked && (b.phase==='eTele'||b.phase==='eanim'||now-b.blockFxT<250)){
    const bx=60, c = now-b.blockFxT<250 ? '#ffffff' : '#5ec8d8';
    px(bx,118,2,26,c); px(bx+2,116,1,2,c); px(bx+2,144,1,2,c);
  } else if(blockWin && !b.blocked && Math.floor(t/100)%2===0){
    px(60,118,2,26,'rgba(94,200,216,0.45)');
  }

  /* enemigo */
  const eHurt = now-b.ehurtT<130;
  const dying = b.phase==='end' && b.win;
  ctx.save();
  ctx.translate(Math.round(112+eox+eleanX), Math.round(150+(b.phase==='timing'?-bob:0)));
  ctx.scale(-1,1);
  if(dying){
    const pr = Math.min(1, b.t/700);
    ctx.globalAlpha = 1-pr;
    ctx.translate(0, pr*6);
    ctx.scale(1-pr*0.3, 1-pr*0.3);
  }
  ctx.drawImage(eHurt ? silhouette(espr) : espr, -espr.width/2, -espr.height);
  ctx.restore();
  if(b.phase==='eTele' && Math.floor(t/150)%2===0){
    drawTextC(b.bigAtk?'¡¡CARGA!!':'!', 112, 150-espr.height-12, '#e2574c');
  }

  /* partículas del combate */
  for(const f of b.fx){
    ctx.fillStyle = f.col;
    ctx.fillRect(Math.round(f.x), Math.round(f.y), f.size, f.size);
  }

  ctx.restore(); /* fin zoom/shake */

  /* ----- placas de nombre y vida ----- */
  const plate = (x, name, hp, hpShow, mx, isPlayer)=>{
    px(x,166,66,24,'rgba(14,16,40,0.72)');
    px(x,166,66,1,'rgba(255,255,255,0.18)');
    drawText(name, x+4, 169, '#ffffff');
    const w = 58, pct = Math.max(0, hpShow/mx);
    px(x+4,177,w,5,'rgba(255,255,255,0.14)');
    const col = pct>0.5 ? '#7ac74f' : (pct>0.25 ? '#ffd94a' : ((Math.floor(t/200)%2===0)?'#e2574c':'#a03030'));
    px(x+4,177,Math.round(w*pct),5,col);
    drawText(fmt(Math.ceil(hp)), x+4, 184, 'rgba(255,255,255,0.75)');
    if(isPlayer){
      for(let i=0;i<b.superMax;i++){
        const full = b.super>i;
        px(x+30+i*8,184,6,5, full ? '#ffd94a' : 'rgba(255,255,255,0.18)');
        if(full) px(x+31+i*8,185,4,3,'#fff3c0');
      }
    }
  };
  plate(6, pd.name, b.php, b.phpShow, b.pmx, true);
  plate(88, (b.boss?'JEFE ':'')+b.name, b.ehp, b.ehpShow, b.emx, false);

  /* ----- zona de mando (abajo) ----- */
  px(0,196,160,76,'#12141f');
  px(0,196,160,1,'rgba(255,255,255,0.14)');
  if(b.phase==='intro'){
    const pr = Math.min(1, b.t/500);
    px(0,0,160,Math.round(60*(1-pr)),'#0a0b14');
    px(0,272-Math.round(76*(1-pr)),160,Math.round(76*(1-pr))+1,'#0a0b14');
    const bx = 160-(Math.min(1,b.t/450))*140;
    drawTextC(b.boss ? '¡¡EL JEFE '+b.name+'!!' : '¡'+b.name+' SALVAJE!', Math.round(bx+60), 216, b.boss?'#e2574c':'#ffffff');
    drawTextC('PREPARATE...', 80, 232, 'rgba(255,255,255,0.5)');
  } else if(b.phase==='timing'){
    if(b.super>=b.superMax){
      if(Math.floor(t/220)%2===0) drawTextC('★ ¡SUPER LISTO! TOCA ★', 80, 204, '#ffd94a');
      else drawTextC(superOf(p).name, 80, 204, superOf(p).col);
    } else {
      drawTextC('¡TOCA EN EL CENTRO!', 80, 204, '#ffd94a');
    }
    px(20,216,120,12,'rgba(255,255,255,0.10)');
    px(20,216,120,1,K); px(20,227,120,1,K);
    px(72,214,16,16,'rgba(255,217,74,0.25)');
    px(78,212,4,20,'rgba(255,217,74,0.55)');
    const mx = 20 + b.mk*116;
    px(mx,214,3,16,'#ffffff');
    px(mx+1,212,1,2,'#ffffff'); px(mx+1,230,1,2,'#ffffff');
    drawTextC('CRITICO EN LA FRANJA DORADA', 80, 240, 'rgba(255,255,255,0.35)');
  } else if(b.phase==='eTele' || b.phase==='eanim'){
    if(b.blocked) drawTextC('ESCUDO ARRIBA', 80, 210, '#5ec8d8');
    else if(blockWin && Math.floor(t/140)%2===0) drawTextC('¡¡BLOQUEA: TOCA YA!!', 80, 210, '#5ec8d8');
    else drawTextC(b.bigAtk ? '¡ATAQUE CARGADO!' : 'AHI VIENE...', 80, 210, b.bigAtk?'#e2574c':'rgba(255,255,255,0.6)');
    drawTextC('TOCA JUSTO ANTES DEL GOLPE', 80, 240, 'rgba(255,255,255,0.35)');
  } else if(b.phase==='superAnim'){
    if(Math.floor(t/150)%2===0) drawTextC('¡'+superOf(p).name+'!', 80, 214, superOf(p).col);
  } else if(b.phase==='end'){
    if(b.win){
      drawTextC('¡VICTORIA!', 80, 202, '#ffd94a');
      drawTextC('+'+b.reward+'✦   +15 XP   +1 FUE', 80, 214, '#ffffff');
      drawTextC('BOTIN X1.5 ACTIVADO', 80, 224, '#7ac74f');
      if(b.relicName) drawTextC('RELIQUIA: '+b.relicName, 80, 234, '#ffd94a');
    } else {
      drawTextC('DERROTA...', 80, 204, '#e2574c');
      drawTextC('ENTRENA MURO Y VUELVE', 80, 216, 'rgba(255,255,255,0.7)');
    }
    if(b.t>800 && Math.floor(t/400)%2===0) drawTextC('TOCA PARA SEGUIR', 80, 252, 'rgba(255,255,255,0.5)');
  }
}
function drawMgEnd(){
  const m = UI.mg;
  panel(20,84,120,90);
  drawTextC('- '+m.title+' -', 80, 91, K);
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
