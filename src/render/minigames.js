"use strict";
/* =========================================================
   BITXO — render/minigames: dibujo de combate y minijuegos
   ========================================================= */
/* ---------------- COMBATE: DIBUJO ---------------- */
function drawBattle(t, dt){
  battleStep(dt);
  const b = UI.bt; if(!b) return;
  px(0,0,160,272,'#1a1428');
  for(let i=0;i<12;i++){ px((i*47+13)%160, (i*31+7)%80, 1,1,'#3a3458'); }
  px(0,150,160,60,'#2a2440');
  px(0,150,160,2,'#3a3458');
  drawTextC('- COMBATE -', 80, 8, '#ffffff');

  const p = AP();
  const pd = currentFormDef();
  const pspr = SPR[pd.spr][0];
  const espr = ESPR[b.kind];

  let pox=0, eox=0;
  if(b.phase==='panim'){ const pr=Math.min(1,b.t/450); pox = Math.sin(pr*Math.PI)*44; }
  if(b.phase==='eanim'){ const pr=Math.min(1,b.t/450); eox = -Math.sin(pr*Math.PI)*44; }
  const shk = (performance.now()-b.shake<200) ? Math.sin(t/20)*2 : 0;

  /* jugador (izq) */
  ctx.save();
  ctx.translate(Math.round(46+pox+shk), 150);
  ctx.drawImage(pspr, -pspr.width/2, -pspr.height);
  if(p.hat && SPR['hat_'+p.hat]){
    const hs = SPR['hat_'+p.hat];
    ctx.drawImage(hs, -Math.floor(hs.width/2), -pspr.height - hs.height + 2);
  }
  ctx.restore();
  /* enemigo (der) mirando al jugador */
  ctx.save();
  ctx.translate(Math.round(112+eox), 150);
  ctx.scale(-1,1);
  const flash = (b.phase==='panim' && b.t>380);
  ctx.drawImage(flash? silhouette(espr): espr, -espr.width/2, -espr.height);
  ctx.restore();

  drawTextC(pd.name, 46, 158, '#ffffff');
  drawTextC((b.boss?'JEFE ':'')+b.name, 112, 158, '#e2574c');
  /* barras HP */
  const hpbar = (x,val,mx,col)=>{
    px(x-24,168,48,6,'rgba(255,255,255,0.15)');
    px(x-24,168,Math.round(48*val/mx),6,col);
  };
  hpbar(46, b.php, b.pmx, '#7ac74f');
  hpbar(112, b.ehp, b.emx, '#e2574c');
  drawTextC(fmt(b.php), 46, 176, 'rgba(255,255,255,0.6)');
  drawTextC(fmt(b.ehp), 112, 176, 'rgba(255,255,255,0.6)');

  if(b.phase==='timing'){
    drawTextC('¡TOCA EN EL CENTRO!', 80, 196, '#ffd94a');
    px(20,208,120,10,'rgba(255,255,255,0.12)');
    px(20,208,120,1,K); px(20,217,120,1,K);
    px(74,206,12,14,'rgba(255,217,74,0.3)');
    px(78,204,4,18,'rgba(255,217,74,0.5)');
    const mx = 20 + b.mk*116;
    px(mx,206,3,14,'#ffffff');
  } else if(b.phase==='end'){
    if(b.win){
      drawTextC('¡VICTORIA!', 80, 196, '#ffd94a');
      drawTextC('+'+b.reward+'✦  +15XP  +1 FUERZA', 80, 208, '#ffffff');
      drawTextC('BOTIN ACTIVADO', 80, 218, '#7ac74f');
      if(b.relicName) drawTextC('RELIQUIA: '+b.relicName, 80, 226, '#8a6a10');
    } else {
      drawTextC('DERROTA...', 80, 196, '#e2574c');
      drawTextC('ENTRENA MAS Y VUELVE', 80, 208, 'rgba(255,255,255,0.7)');
    }
    if(b.t>800) drawTextC('TOCA PARA SEGUIR', 80, 234, 'rgba(255,255,255,0.5)');
  } else {
    drawTextC('...', 80, 200, 'rgba(255,255,255,0.5)');
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
        tone({f:NOTE(349.23, DANCE_TUNE[b.i%16]), at:sfxAt(off), d:0.17, type:'p25', vol:0.055, send:0.15});
        kick(sfxAt(off), 0.08);
        nz(sfxAt(off+0.14), 0.03, 0.015, 9000, 3);
      }
      if(!b.hit && now>b.t+150){ b.hit=-1; m.combo=0; m.judge='FALLO'; m.judgeT=now; }
      if(!b.hit){ const d=Math.abs(b.t-now); if(d<nd){ nd=d; nb=b; } }
    }
    if(now > m.end){
      const max = m.beats.length*3;
      finishMg('BAILE', m.score, m.score, 12+m.score, m.score >= max*0.55);
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
  drawTextC('- BAILE -', 80, 8, '#ffffff');
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
