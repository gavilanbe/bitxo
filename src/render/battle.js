"use strict";
/* =========================================================
   BITXO — render/battle: dibujo del combate
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
