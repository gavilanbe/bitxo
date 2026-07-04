"use strict";
/* =========================================================
   BITXO — render/minigames: dibujo de combate y minijuegos
   ========================================================= */
/* ---------------- COMBATE: DIBUJO ---------------- */
/* aro de puntería: elipse punteada de píxeles */
function battleRing(cx, cy, r, col){
  for(let a=0;a<20;a++){
    const ang = a/20*Math.PI*2;
    px(Math.round(cx+Math.cos(ang)*r), Math.round(cy+Math.sin(ang)*r*0.82), 1, 1, col);
  }
}
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

  /* ----- escenario: el prado, teñido por el elemento del rival ----- */
  px(-8,0,176,58,S.bands[0]);
  px(-8,58,176,46,S.bands[1]);
  px(-8,104,176,36,S.bands[2]);
  if(ph==='night' || b.elem==='astro'){ for(const st of stars) if(Math.sin(t/600+st.t)>0.2) px(st.x, st.y, 1,1,'#dfe8ff'); }
  /* colinas en silueta */
  for(let x=-8;x<168;x+=8){ const hh = 9+Math.round(6*Math.sin(x/17+2)); px(x,140-hh,8,hh,'rgba(18,22,38,0.75)'); }
  const GROUNDS = {brasa:'#3a221c', marea:'#1a3040', petrea:'#2e2c34', fungo:'#2c3324', voltio:'#2e2a1e', sombra:'#201c30'};
  px(-8,140,176,132, GROUNDS[b.elem] || (ph==='night' ? '#131b2c' : (ph==='day' ? '#2c4636' : '#26303a')));
  px(-8,140,176,2,'rgba(0,0,0,0.35)');
  /* atrezzo del bioma */
  if(b.elem==='brasa'){
    if(Math.random()<0.15) b.fx.push({x:Math.random()*160, y:150, vx:0, vy:-0.02-Math.random()*0.015, life:900, col:Math.random()<0.5?'#f8a04b':'#e8574c', size:1});
  } else if(b.elem==='marea'){
    px(84,146,56,8,'#2a5a7a'); px(88,145,48,2,'#3a7a9a');
    const wv = Math.floor(t/500)%2;
    px(94+wv*8,148,8,1,'#9adcf0');
  } else if(b.elem==='petrea'){
    px(8,120,12,20,'rgba(18,22,38,0.9)'); px(12,112,6,10,'rgba(18,22,38,0.9)');
    px(142,124,14,16,'rgba(18,22,38,0.9)');
  } else if(b.elem==='fungo'){
    px(6,128,3,10,'#e8d8b8'); px(3,124,9,5,'#8a4438'); px(5,125,2,2,'#f6efe0');
    px(148,132,3,7,'#e8d8b8'); px(146,129,7,4,'#8a4438');
  } else if(b.elem==='voltio'){
    if(Math.random()<0.006){ ctx.fillStyle='rgba(255,240,180,0.35)'; ctx.fillRect(-8,0,176,272); }
    px(20,18,26,7,'#3a3a52'); px(28,14,16,6,'#3a3a52');
  } else if(b.elem==='sombra'){
    ctx.fillStyle='rgba(20,12,32,0.25)'; ctx.fillRect(-8,0,176,140);
  }
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
  /* furia: le fallaste y viene con todo */
  if(b.phase==='eTele' && b.rageNow && !b.bigAtk && Math.floor(t/160)%2===0){
    ctx.fillStyle='rgba(226,87,76,0.09)'; ctx.fillRect(-8,0,176,272);
  }

  /* ----- luchadores ----- */
  const pd = currentFormDef();
  const pspr = SPR[pd.spr][0];
  const espr = b.fspr || ESPR[b.kind];
  const bob = Math.sin(t/300)*1.2;

  let pox=0, eox=0, eleanX=0;
  if(b.phase==='panim') pox = Math.sin(Math.min(1,b.t/600)*Math.PI)*50;
  if(b.phase==='superAnim') pox = Math.sin(Math.min(1,b.t/1350)*Math.PI)*10;
  if(b.phase==='eanim') eox = -Math.sin(Math.min(1,b.t/600)*Math.PI)*50;
  if(b.phase==='eTele') eleanX = Math.sin(b.t/60)*(b.bigAtk?2.5:1.5);

  /* líneas de velocidad de la embestida */
  if(b.phase==='panim' && b.t<320 && pox>6){
    for(let i=0;i<3;i++){
      px(Math.round(46+pox)-16-i*8, 128+i*7, 10, 1, 'rgba(255,255,255,'+(0.4-i*0.11).toFixed(2)+')');
    }
  }
  if(b.phase==='eanim' && b.t<320 && eox<-6){
    for(let i=0;i<3;i++){
      px(Math.round(112+eox)+8+i*8, 128+i*7, 10, 1, 'rgba(255,180,170,'+(0.35-i*0.1).toFixed(2)+')');
    }
  }

  /* jugador */
  const pHurt = now-b.phurtT<130;
  ctx.save();
  ctx.translate(Math.round(46+pox), Math.round(150+(b.phase==='timing'?bob:0)));
  ctx.drawImage(pHurt ? silhouette(pspr) : pspr, -pspr.width/2, -pspr.height);
  if(p.hat && SPR['hat_'+p.hat]){
    const hs = SPR['hat_'+p.hat];
    const hdy = (HAT_BY_ID[p.hat] && HAT_BY_ID[p.hat].dy) || 0;
    ctx.drawImage(hs, -Math.floor(hs.width/2), -pspr.height - hs.height + 2 + hdy);
  }
  ctx.restore();
  /* escudo del bloqueo */
  const blockWin = (b.phase==='eanim' && b.t<320 ) || (b.phase==='eTele' && b.t > teleDur(b)-180);
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
    drawTextC(b.bigAtk?'¡¡CARGA!!':(b.rageNow?'¡GRR!':'!'), 112, 150-espr.height-12, '#e2574c');
  }
  /* aro de puntería: toca cuando abrace al rival */
  if(b.phase==='timing'){
    const rdist = Math.abs(b.mk-0.5)*2;
    const er = Math.max(espr.width, espr.height)/2 + 3;
    const rr = er + rdist*26;
    const rcy = 150 - Math.round(espr.height/2);
    const rcol = rdist<0.18 ? '#ffd94a' : (rdist<0.35 ? '#fff8d0' : 'rgba(255,255,255,0.5)');
    battleRing(112, rcy, rr, rcol);
    if(rdist<0.18) battleRing(112, rcy, rr+1.5, 'rgba(255,217,74,0.45)');
  }
  /* ¡K.O.! */
  if(b.phase==='end' && b.win && b.t<700 && Math.floor(t/120)%2===0){
    drawTextC('¡K.O.!', 112, 92, '#ffd94a');
  }

  /* esporas del REY SETO a la deriva */
  if(b.quirk==='spore' && Math.random()<0.12){
    b.fx.push({x:Math.random()*160, y:30+Math.random()*80, vx:-0.008, vy:0.012, life:1600, col:'rgba(201,116,58,0.8)', size:1});
  }
  /* partículas del combate */
  for(const f of b.fx){
    ctx.fillStyle = f.col;
    ctx.fillRect(Math.round(f.x), Math.round(f.y), f.size, f.size);
  }

  ctx.restore(); /* fin zoom/shake */

  /* destellos de impacto: crítico y parada perfecta */
  if(now-b.ehurtT<50 && b.crit){ ctx.fillStyle='rgba(255,255,255,0.28)'; ctx.fillRect(0,0,LW,LH); }
  if(now-(b.parryFxT||0)<130){ ctx.fillStyle='rgba(190,240,255,0.30)'; ctx.fillRect(0,0,LW,LH); }

  /* ----- placas de nombre y vida ----- */
  const plate = (x, name, hp, hpShow, mx, isPlayer)=>{
    px(x,166,66,24,'rgba(14,16,40,0.72)');
    px(x,166,66,1,'rgba(255,255,255,0.18)');
    drawText(name, x+4, 169, '#ffffff');
    const w = 58, pct = Math.max(0, hp/mx), pctShow = Math.max(0, hpShow/mx);
    px(x+4,177,w,5,'rgba(255,255,255,0.14)');
    /* barra fantasma: el trozo perdido se desvanece detrás */
    px(x+4,177,Math.round(w*pctShow),5,'rgba(255,248,208,0.5)');
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
  plate(6, (p.nick||pd.name).slice(0,9), b.php, b.phpShow, b.pmx, true);
  plate(88, (b.boss?'JEFE ':'')+b.name, b.ehp, b.ehpShow, b.emx, false);
  drawText('N'+b.nv, 88+38, 184, b.elite ? '#ffd94a' : 'rgba(255,255,255,0.75)');
  px(88+58, 170, 4, 4, ELEM_COLS[b.elem]||'#c8c0b0');
  if(b.elite && Math.floor(t/300)%2===0) drawText('★', 88-6, 169, '#ffd94a');

  /* ----- zona de mando (abajo) ----- */
  px(0,196,160,76,'#12141f');
  px(0,196,160,1,'rgba(255,255,255,0.14)');
  if(b.phase==='intro'){
    const pr = Math.min(1, b.t/500);
    px(0,0,160,Math.round(60*(1-pr)),'#0a0b14');
    px(0,272-Math.round(76*(1-pr)),160,Math.round(76*(1-pr))+1,'#0a0b14');
    const bx = 160-(Math.min(1,b.t/450))*140;
    drawTextC(b.friendly ? '¡DUELO: '+b.name+'!' : (b.boss ? '¡¡EL JEFE '+b.name+'!!' : '¡'+b.name+' SALVAJE!'), Math.round(bx+60), 216, b.boss?'#e2574c':'#ffffff');
    drawTextC(b.friendly ? 'SIN RENCORES...' : 'PREPARATE...', 80, 232, 'rgba(255,255,255,0.5)');
  } else if(b.phase==='timing'){
    if(b.super>=b.superMax){
      /* botón de súper: o lo desatas, o sigues a golpes */
      const on = Math.floor(t/220)%2===0;
      px(28,204,104,18, on ? '#ffd94a' : '#c9a227');
      px(28,204,104,1,K); px(28,221,104,1,K); px(28,204,1,18,K); px(131,204,1,18,K);
      drawTextC('★ ¡SUPER! ★', 80, 210, K);
      drawTextC(superOf(p).name, 80, 226, superOf(p).col);
      drawTextC('O TOCA AL RIVAL: GOLPE NORMAL', 80, 240, 'rgba(255,255,255,0.35)');
    } else {
      if(b.combo>0){
        drawTextC('¡COMBO X'+(b.combo+1)+'! ¿SIGUES?', 80, 204, '#ffd94a');
        drawTextC('FALLAR LO ENFURECE...', 80, 216, 'rgba(255,255,255,0.55)');
        drawTextC('O DEJA PASAR EL ARO Y PLANTATE', 80, 228, 'rgba(94,200,216,0.6)');
      } else {
        drawTextC('¡TOCA CUANDO EL ARO', 80, 204, '#ffd94a');
        drawTextC('ABRACE AL RIVAL!', 80, 214, '#ffd94a');
      }
      if(b.mult>1) drawTextC('VENTAJA DE LINEA: DAÑO +30%', 80, 240, '#7ac74f');
      else if(b.mult<1) drawTextC('TE RESISTE: DAÑO -25%', 80, 240, '#e2574c');
      else drawTextC('ARO DORADO = CRITICO', 80, 240, 'rgba(255,255,255,0.35)');
    }
    /* la mochila: chips de objetos usables */
    for(let i2=0;i2<(G.items||[]).length;i2++){
      const ix = 4+i2*18;
      px(ix,248,16,16,'#1e2130');
      px(ix,248,16,1,'rgba(255,255,255,0.25)'); px(ix,263,16,1,K);
      px(ix,248,1,16,K); px(ix+15,248,1,16,K);
      if(G.items[i2]==='pocion'){ px(ix+6,251,4,3,'#f6efe0'); px(ix+5,254,6,7,'#e2574c'); px(ix+6,255,2,2,'#ff9a90'); }
      else { px(ix+8,250,2,6,'#ffd94a'); px(ix+5,255,4,2,'#ffd94a'); px(ix+7,257,2,5,'#ffd94a'); }
    }
  } else if(b.phase==='eTele' || b.phase==='eanim'){
    if(b.parry) drawTextC('¡PARADA PERFECTA!', 80, 210, '#ffffff');
    else if(b.blocked) drawTextC('ESCUDO ARRIBA', 80, 210, '#5ec8d8');
    else if(blockWin && Math.floor(t/140)%2===0) drawTextC('¡¡BLOQUEA: TOCA YA!!', 80, 210, '#5ec8d8');
    else drawTextC(b.bigAtk ? '¡ATAQUE CARGADO!' : (b.rageNow ? '¡VIENE FURIOSO!' : 'AHI VIENE...'), 80, 210, (b.bigAtk||b.rageNow)?'#e2574c':'rgba(255,255,255,0.6)');
    drawTextC('TOCA JUSTO ANTES DEL GOLPE', 80, 234, 'rgba(255,255,255,0.35)');
    drawTextC('CLAVADO AL IMPACTO: ¡PARADA!', 80, 243, 'rgba(94,200,216,0.55)');
    drawTextC('O DESLIZA PARA ESQUIVAR', 80, 252, 'rgba(94,200,216,0.4)');
  } else if(b.phase==='superAnim'){
    if(Math.floor(t/150)%2===0) drawTextC('¡'+superOf(p).name+'!', 80, 214, superOf(p).col);
  } else if(b.phase==='end'){
    if(b.friendly){
      drawTextC(b.win ? '¡BUEN DUELO!' : 'HA GANADO '+b.name, 80, 202, '#ffd94a');
      drawTextC('AMISTAD +3 · AMBOS FELICES', 80, 214, '#ffffff');
      drawTextC('SIN RENCORES EN EL PARQUE', 80, 224, 'rgba(255,255,255,0.6)');
    } else if(b.win){
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
const PARK_STATIONS = [
  {kind:'str', x:35,  label:'PESAS'},
  {kind:'def', x:80,  label:'MURO'},
  {kind:'spd', x:125, label:'CARRERA'}
];
function drawPark(t, dt){
  const pk = UI.park || (UI.park = {phase:'idle', px:80, t:0});
  const p = AP();
  const ph = dayPhase(), S = SKY[ph];
  /* cielo, valla y césped del parque */
  px(0,0,160,70,S.bands[1]);
  px(0,70,160,34,S.bands[2]);
  for(let x=4;x<160;x+=18){ px(x,86,3,18,'#8a6a3a'); px(x,86,3,1,K); }
  px(0,91,160,2,'#a4834e'); px(0,97,160,2,'#a4834e');
  px(0,104,160,92,S.grass);
  for(let x=0;x<160;x+=6) px(x,104,3,2,S.grass2);
  /* pista de tierra */
  px(0,146,160,32,'#c2a26a');
  px(0,146,160,2,'#8a6a3a'); px(0,176,160,2,'#8a6a3a');
  px(0,196,160,4,K);

  /* estaciones + carteles con la cuota */
  for(const st of PARK_STATIONS){
    px(st.x-1,126,2,10,'#5a4632');
    px(st.x-16,108,32,19,'#f6efe0');
    px(st.x-16,108,32,1,K); px(st.x-16,126,32,1,K);
    px(st.x-16,108,1,19,K); px(st.x+15,108,1,19,K);
    const cost = trainCost(p, st.kind);
    drawTextC(st.label, st.x, 111, K);
    drawTextC('✦'+cost, st.x, 119, G.motas>=cost ? '#8a6a10' : '#a03030');
    if(TRAIN_AFFINITY[p.line]===st.kind){
      px(st.x+8,104,14,8,'#ffd94a');
      px(st.x+8,104,14,1,K); px(st.x+8,111,14,1,K); px(st.x+8,104,1,8,K); px(st.x+21,104,1,8,K);
      drawTextC('X2', st.x+15, 106, K);
    }
  }
  /* pesas */
  px(22,158,6,10,'#3a3448'); px(46,158,6,10,'#3a3448');
  px(27,161,20,3,'#8a8a94');
  /* muro (tiembla al empujarlo) */
  const shake = (pk.phase==='train' && pk.kind==='def') ? Math.round(Math.sin(t/50)) : 0;
  for(let r=0;r<4;r++) for(let c=0;c<3;c++){
    px(88+shake+c*8, 152+r*5, 7, 4, (r+c)%2 ? '#9a9aa4' : '#8a8a94');
  }
  px(88+shake,152,24,1,K); px(88+shake,171,24,1,K); px(88+shake,152,1,20,K); px(111+shake,152,1,20,K);
  /* conos de carrera */
  for(const cx of [112,140]){
    px(cx+1,160,2,2,'#f0a04b'); px(cx,162,4,2,'#f0a04b'); px(cx-1,164,6,2,'#e2574c'); px(cx-2,166,8,2,K);
  }
  for(let x=116;x<138;x+=6) px(x,164,3,1,'rgba(59,47,47,0.4)');

  /* el bitxo entrenando */
  const spr = currentSprite(), w=spr.width, h=spr.height;
  let bx = pk.px, lift=0, sx=1, sy=1, dir=1;
  if(pk.phase==='walk'){
    const d = pk.tx - pk.px;
    pk.px += Math.sign(d)*Math.min(Math.abs(d), dt*0.07);
    dir = Math.sign(d)||1;
    const phw = Math.abs(Math.sin(t/150));
    lift = phw*2; sy = 1+phw*0.04;
    if(Math.abs(d)<2){ pk.phase='train'; pk.t=0; }
    bx = pk.px;
  } else if(pk.phase==='train'){
    pk.t += dt;
    if(pk.kind==='str'){
      const ph2 = Math.abs(Math.sin(pk.t/260));
      sy = 1-ph2*0.16; sx = 1+ph2*0.10;
      /* la barra sube y baja con él */
      const by2 = 150 - ph2*14;
      px(24,by2,4,6,'#3a3448'); px(46,by2,4,6,'#3a3448'); px(28,by2+2,18,2,'#8a8a94');
      if(Math.random()<dt*0.006) pk.sweat = {x:bx-8+Math.random()*16, y:132};
    } else if(pk.kind==='def'){
      sx = 1.12; sy = 0.92; dir = 1;
      bx = pk.px + Math.abs(Math.sin(pk.t/180))*2;
      if(Math.random()<dt*0.006) pk.sweat = {x:bx-10, y:134};
    } else {
      bx = 125 + Math.sin(pk.t/240)*13;
      dir = Math.cos(pk.t/240)>=0 ? 1 : -1;
      const ph2 = Math.abs(Math.sin(pk.t/90));
      lift = ph2*3; sy = 1+ph2*0.05;
      if(Math.random()<dt*0.01) UI.particles.push({x:bx-dir*6, y:170, vy:-0.01, life:350, ch:'.', col:'rgba(194,162,106,0.9)'});
    }
    if(pk.sweat){
      px(pk.sweat.x, pk.sweat.y, 1, 2, '#9adcf0');
      pk.sweat.y += dt*0.05;
      if(pk.sweat.y>150) pk.sweat = null;
    }
    if(pk.t>2200){
      pk.phase='idle';
      UI.floats.push({x:bx, y:126, s:'+'+pk.gain+' '+({str:'FUE',def:'DEF',spd:'VEL'})[pk.kind], col:'#7ac74f', life:1200, vy:-0.025});
      petVoice(p);
    }
  } else {
    sy = 1 + Math.sin(t/420)*0.02;
  }
  px(Math.round(bx)-w/2+2, 176, w-4, 2, 'rgba(0,0,0,0.3)');
  ctx.save();
  ctx.translate(Math.round(bx), Math.round(176-lift));
  ctx.scale(dir*sx, sy);
  ctx.drawImage(spr, -w/2, -h);
  ctx.restore();
  if(pk.phase==='train' && Math.floor(t/300)%2===0){
    drawText('!', Math.round(bx)+10, 176-h-8, '#ffd94a');
  }

  /* pie económico */
  px(0,200,160,72,'#e8e0c8'); px(0,200,160,1,K); px(0,202,160,1,'rgba(26,20,40,0.2)');
  drawText('FUE '+(p.str||0), 8, 208, '#e2574c');
  drawText('DEF '+(p.def||0), 48, 208, '#8a6a3a');
  drawText('VEL '+(p.spd||0), 88, 208, '#5ec8d8');
  drawText('PILAS '+Math.round(p.energy), 122, 208, K);
  px(6,218,148,1,'rgba(26,20,40,0.2)');
  drawTextC('CADA SESION: -15 PILAS Y SU CUOTA', 80, 224, 'rgba(26,20,40,0.55)');
  drawTextC('LA CUOTA SUBE CON LA STAT', 80, 233, 'rgba(26,20,40,0.45)');
  /* cabecera */
  px(0,0,160,14,'rgba(14,16,48,0.6)');
  drawText('< VOLVER', 4, 4, '#ffffff');
  drawText('✦'+fmt(G.motas), 122, 4, '#ffd94a');
  drawParticles(dt);
}
