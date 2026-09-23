"use strict";
/* =========================================================
   BITXO — render/gym: el GYM del parque (estaciones, reps y aguja)
   ========================================================= */
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
  /* ----- primero la lógica de la sesión, luego el dibujo ----- */
  let bx = pk.px, lift=0, sx=1, sy=1, dir=1, arc=0, effort=false;
  if(pk.phase==='walk'){
    const d = pk.tx - pk.px;
    pk.px += Math.sign(d)*Math.min(Math.abs(d), dt*0.07);
    dir = Math.sign(d)||1;
    const phw = Math.abs(Math.sin(t/150));
    lift = phw*2; sy = 1+phw*0.04;
    if(Math.abs(d)<2){ pk.phase='train'; pk.t=0; pk.rep=0; pk.perfects=0; pk.repAnim=0; pk.autoAt=1800; }
    bx = pk.px;
  } else if(pk.phase==='train'){
    pk.t += dt;
    pk.rep = pk.rep||0; pk.perfects = pk.perfects||0; pk.repAnim = pk.repAnim||0;
    if(pk.autoAt===undefined) pk.autoAt = pk.t + 1800;
    /* si no tocas, la rep sale sola (sin clavar) */
    if(pk.repAnim<=0 && pk.rep<3 && pk.t>pk.autoAt){ pk.lastPerfect = false; pk.repAnim = 420; }
    if(pk.repAnim>0){
      pk.repAnim -= dt;
      const pr = 1 - Math.max(0, pk.repAnim)/420;
      arc = Math.sin(pr*Math.PI) * (pk.lastPerfect ? 1.15 : 1);
      effort = arc>0.35;
      if(pk.repAnim<=0){
        pk.rep++;
        pk.autoAt = pk.t + 1800;
        if(pk.rep>=3){
          /* fin de sesión: 3 clavados = punto extra */
          pk.phase='idle';
          const kindN = ({str:'FUE',def:'DEF',spd:'VEL'})[pk.kind];
          let total = pk.gain;
          if(pk.perfects>=3){
            p[pk.kind] = Math.min(99, (p[pk.kind]||0)+1);
            total++;
            UI.floats.push({x:bx, y:112, s:'¡SESION PERFECTA!', col:'#ffd94a', life:1600, vy:-0.02});
          }
          UI.floats.push({x:bx, y:124, s:'¡+'+total+' '+kindN+'!', col:'#7ac74f', life:1400, vy:-0.025});
          for(let i2=0;i2<8;i2++) UI.particles.push({x:bx-12+Math.random()*24, y:150-Math.random()*20, vy:-0.02-Math.random()*0.02, life:900, ch:'✦', col:'#ffd94a'});
          petVoice(p); SFX.yay(); vibrate([15,15,30]);
          saveGame();
        }
      }
    }
    if(pk.kind==='str'){
      sy = 1-arc*0.18; sx = 1+arc*0.12;
      if(effort && Math.random()<dt*0.008) pk.sweat = {x:bx-8+Math.random()*16, y:130};
    } else if(pk.kind==='def'){
      sx = 1.12+arc*0.06; sy = 0.92; dir = 1;
      bx = pk.px + arc*4;
      if(arc>0.8 && Math.random()<dt*0.05) UI.particles.push({x:88+Math.random()*24, y:170, vy:-0.015, life:400, ch:'.', col:'rgba(154,154,164,0.8)'});
      if(effort && Math.random()<dt*0.008) pk.sweat = {x:bx-10, y:132};
    } else {
      bx = 128;
      const trot = Math.abs(Math.sin(pk.t/(effort?55:110)));
      lift = trot*(2+arc*3); sy = 1+trot*0.06;
      if(Math.random()<dt*(effort?0.02:0.006)) UI.particles.push({x:112, y:166, vy:-0.012, life:350, ch:'.', col:'rgba(194,162,106,0.9)'});
      if(effort && Math.random()<dt*0.008) pk.sweat = {x:bx-6+Math.random()*12, y:130};
    }
  } else {
    sy = 1 + Math.sin(t/420)*0.02;
  }

  /* ----- aparatos ----- */
  /* grada y barra de dominadas de atrezzo */
  px(4,136,26,3,'#a4834e'); px(4,136,26,1,'#c8a04b');
  px(6,139,2,7,'#5a4632'); px(26,139,2,7,'#5a4632');
  px(143,116,2,26,'#5a4632'); px(157,116,2,26,'#5a4632'); px(142,114,18,2,'#8a6a3a');
  /* esterillas de goma */
  for(const st of PARK_STATIONS) px(st.x-17,148,34,3,'#4a4456');
  /* PESAS: rack y barra con discos que crecen con tu FUE */
  const plateW = 5 + Math.min(4, Math.floor((p.str||0)/6));
  px(24,152,3,18,'#3a3448'); px(47,152,3,18,'#3a3448');
  const strLift = (pk.phase==='train' && pk.kind==='str') ? arc*18 : 0;
  const by2 = Math.round(152 - strLift);
  px(24-(plateW>>1)+1, by2-4, plateW, 10, '#5a5468');
  px(25-(plateW>>1)+1, by2-3, 2, 4, '#7a7a8c');
  px(47-(plateW>>1)+1, by2-4, plateW, 10, '#5a5468');
  px(48-(plateW>>1)+1, by2-3, 2, 4, '#7a7a8c');
  px(28,by2,18,2,'#8a8a94'); px(28,by2-1,18,1,'#b8b8c4');
  if(strLift>14){ px(20,by2-7,2,2,'#fff8d0'); px(52,by2-7,2,2,'#fff8d0'); }
  /* MURO de escalada: presas de colores, se inclina y agrieta */
  const push = (pk.phase==='train' && pk.kind==='def') ? arc : 0;
  for(let r=0;r<4;r++){
    const shx = Math.round(push * (3-r) * 2.4);
    for(let c=0;c<3;c++) px(88+shx+c*8, 150+r*5, 7, 4, (r+c)%2 ? '#9a9aa4' : '#8a8a94');
    px(88+shx,150+r*5,1,4,K); px(111+shx,150+r*5,1,4,K);
  }
  px(88,170,24,1,K);
  const HOLDS = [[91,153,'#e2574c'],[99,152,'#ffd94a'],[106,157,'#5ec8d8'],[93,162,'#ffd94a'],[103,166,'#e2574c']];
  for(const hd of HOLDS){
    const shx2 = Math.round(push * (3-Math.floor((hd[1]-150)/5)) * 2.4);
    px(hd[0]+shx2, hd[1], 2, 2, hd[2]);
  }
  if(pk.phase==='train' && pk.kind==='def'){
    if(pk.rep>=1){ px(96,153,1,4,K); }
    if(pk.rep>=2){ px(101,158,1,4,K); px(92,163,1,3,K); }
  }
  /* CINTA: lona en marcha, barandilla y velocímetro */
  px(106,156,48,14,'#3a3448');
  px(108,158,44,8,'#5a5468'); px(108,158,44,1,'#7a7a8c');
  const running = pk.phase==='train' && pk.kind==='spd';
  const beltOff = Math.floor(t/(running ? (effort?38:90) : 240))%8;
  for(let sx2=108+8-beltOff; sx2<150; sx2+=8) px(sx2,162,4,2,'#8a8a94');
  px(107,146,2,12,'#8a8a94'); px(151,146,2,12,'#8a8a94');
  px(107,145,46,2,'#b8b8c4');
  px(140,159,11,7,'#20243c');
  const vbars = running ? (effort?3:2) : 0;
  for(let i2=0;i2<3;i2++) px(142+i2*3, 164-(i2+1), 2, 2+i2, i2<vbars ? '#7ac74f' : 'rgba(255,255,255,0.2)');
  /* líneas de velocidad del esprint */
  if(running && effort){
    for(let i2=0;i2<3;i2++) px(104-i2*7, 144+i2*4, 6, 1, 'rgba(255,255,255,'+(0.35-i2*0.1).toFixed(2)+')');
  }

  /* aguja de ritmo: toca cuando esté en lo dorado */
  if(pk.phase==='train' && pk.rep<3 && pk.repAnim<=0){
    const st = PARK_STATIONS.find(s2=>s2.kind===pk.kind);
    const g0 = st.x-14;
    px(g0,130,28,4,'rgba(20,22,40,0.55)');
    px(g0+20,130,8,4,'rgba(255,217,74,0.5)');
    const gauge = (Math.sin(pk.t/300)+1)/2;
    px(g0+Math.round(gauge*26),128,2,8,'#ffffff');
    if(Math.floor(t/240)%2===0) drawTextC('¡TOCA!', st.x, 138, '#ffd94a');
  }
  /* pips de la sesión: reps hechas y clavados */
  if(pk.phase==='train'){
    for(let i2=0;i2<3;i2++){
      px(64+i2*10, 183, 6, 6, i2<pk.rep ? '#ffd94a' : 'rgba(255,255,255,0.25)');
      px(64+i2*10, 183, 6, 1, K); px(64+i2*10, 188, 6, 1, K);
    }
    drawText('★'+(pk.perfects||0), 96, 183, '#ffd94a');
  }
  /* gotitas de sudor */
  if(pk.sweat){
    px(pk.sweat.x, pk.sweat.y, 1, 2, '#9adcf0');
    pk.sweat.y += dt*0.05;
    if(pk.sweat.y>150) pk.sweat = null;
  }

  /* el bitxo: con cara de esfuerzo en plena rep */
  let spr = currentSprite();
  if(pk.phase==='train' && effort && p.stage>STAGES.EGG) spr = SPR[currentFormDef().spr][1];
  const w = spr.width, h = spr.height;
  px(Math.round(bx)-w/2+2, 176, w-4, 2, 'rgba(0,0,0,0.3)');
  ctx.save();
  ctx.translate(Math.round(bx), Math.round(176-lift));
  ctx.scale(dir*sx, sy);
  ctx.drawImage(spr, -w/2, -h);
  ctx.restore();

  /* pie económico */
  px(0,200,160,72,'#e8e0c8'); px(0,200,160,1,K); px(0,202,160,1,'rgba(26,20,40,0.2)');
  const blinkStat = pk.phase==='train' && Math.floor(t/280)%2===0;
  drawText('FUE '+(p.str||0), 8, 208, (blinkStat && pk.kind==='str') ? '#ffd94a' : '#e2574c');
  drawText('DEF '+(p.def||0), 48, 208, (blinkStat && pk.kind==='def') ? '#ffd94a' : '#8a6a3a');
  drawText('VEL '+(p.spd||0), 88, 208, (blinkStat && pk.kind==='spd') ? '#ffd94a' : '#5ec8d8');
  drawText('PILAS '+Math.round(p.energy), 122, 208, K);
  px(6,218,148,1,'rgba(26,20,40,0.2)');
  if(pk.phase==='train'){
    drawTextC('¡TOCA CON LA AGUJA EN LO DORADO!', 80, 224, '#8a6a10');
    drawTextC('3 CLAVADOS: +1 EXTRA', 80, 233, 'rgba(26,20,40,0.55)');
  } else {
    drawTextC('ELIGE ESTACION: 3 REPS A TU RITMO', 80, 224, 'rgba(26,20,40,0.55)');
    drawTextC('CUESTA SU CUOTA Y -15 PILAS', 80, 233, 'rgba(26,20,40,0.45)');
  }
  /* cabecera */
  px(0,0,160,14,'rgba(14,16,48,0.6)');
  drawText('< VOLVER', 4, 4, '#ffffff');
  drawTextC('GYM DEL PRADO', 84, 4, '#ffd94a');
  drawText('✦'+fmt(G.motas), 126, 4, '#ffffff');
  drawParticles(dt);
}

