"use strict";
/* =========================================================
   BITXO — render/fx: partículas y cinemáticas (evolución, nacimiento, ascenso)
   ========================================================= */
function drawParticles(dt){
  for(let i=UI.particles.length-1;i>=0;i--){
    const p = UI.particles[i];
    p.y += p.vy*dt; p.life -= dt;
    if(p.life<=0){ UI.particles.splice(i,1); continue; }
    if(p.ch==='.') px(p.x,p.y,2,2,p.col);
    else drawText(p.ch, p.x, p.y, p.col);
  }
  for(let i=UI.floats.length-1;i>=0;i--){
    const f = UI.floats[i];
    f.y += f.vy*dt; f.life -= dt;
    if(f.life<=0){ UI.floats.splice(i,1); continue; }
    drawTextC(f.s, f.x, f.y, f.col);
  }
}

/* ---- EVOLUCION: cinemática estilo Pokémon ----
   carga de luz → morph de silueta acelerando → estallido → revelación */
const EVO_T = {charge:1000, burst:3900, reveal:4300};
function drawEvolve(dt){
  UI.evoT += dt;
  const t = UI.evoT;
  const e = UI.evo;
  if(!e){ UI.mode='main'; return; }
  const dark = e.dark;
  const now = performance.now();

  /* fondo profundo con viñeta */
  px(0,0,160,272, dark ? '#160c20' : '#101430');
  px(0,0,160,26,'rgba(0,0,0,0.35)'); px(0,246,160,26,'rgba(0,0,0,0.35)');

  /* rayos giratorios durante el morph */
  if(t>EVO_T.charge && t<EVO_T.reveal){
    for(let i=0;i<12;i++){
      const a = i*(Math.PI/6) + t/700;
      const col = dark
        ? (i%2 ? 'rgba(157,123,216,0.16)' : 'rgba(90,60,130,0.10)')
        : (i%2 ? 'rgba(160,150,240,0.18)' : 'rgba(110,100,200,0.10)');
      for(let r=20;r<96;r+=4){
        const w2 = 1 + (r>55 ? 1 : 0);
        px(80+Math.cos(a)*r, 136+Math.sin(a)*r*0.9, w2, w2, col);
      }
    }
  }

  /* anillos de cada cambio de forma */
  for(let i=e.rings.length-1;i>=0;i--){
    const rg = e.rings[i];
    rg.r += dt*0.09; rg.a -= dt*0.0022;
    if(rg.a<=0){ e.rings.splice(i,1); continue; }
    for(let j=0;j<20;j++){
      const a = j*(Math.PI/10);
      px(80+Math.cos(a)*rg.r, 136+Math.sin(a)*rg.r*0.9, 2, 2, 'rgba(255,255,255,'+rg.a.toFixed(2)+')');
    }
  }

  /* partículas propias */
  for(let i=e.fx.length-1;i>=0;i--){
    const f = e.fx[i];
    f.x += f.vx*dt; f.y += f.vy*dt; f.vy += (f.g||0)*dt; f.life -= dt;
    if(f.life<=0){ e.fx.splice(i,1); continue; }
    ctx.fillStyle = f.col;
    ctx.fillRect(Math.round(f.x), Math.round(f.y), f.size, f.size);
  }

  /* qué sprite y cuánta silueta blanca */
  let spr = e.from, silA = 0, scale = 1;
  if(t < EVO_T.charge){
    /* carga: la luz converge hacia el bitxo */
    silA = (t/EVO_T.charge)*0.8;
    if(Math.random() < dt*0.045){
      const a = Math.random()*Math.PI*2, r = 55+Math.random()*30;
      const sx = 80+Math.cos(a)*r, sy = 136+Math.sin(a)*r*0.9;
      e.fx.push({x:sx, y:sy, vx:(80-sx)*0.0016, vy:(136-sy)*0.0016, life:620, col:dark?'#9d7bd8':'#fff3c0', size:1});
    }
  } else if(t < EVO_T.burst){
    /* morph: alterna forma vieja/nueva cada vez más rápido */
    const mt = t - EVO_T.charge;
    const period = Math.max(70, 420*Math.pow(0.5, mt/850));
    e.swapAcc += dt/period;
    const n = Math.floor(e.swapAcc);
    spr = (n%2===1) ? e.to : e.from;
    if(n !== e.lastSwap){
      e.lastSwap = n;
      e.rings.push({r:14, a:0.5});
      tone({f:420+Math.min(14,n)*45, d:0.05, type:'p25', vol:0.035});
    }
    silA = 1;
    scale = 1 + Math.sin(mt/(EVO_T.burst-EVO_T.charge)*Math.PI)*0.1;
  } else if(t < EVO_T.reveal){
    /* estallido en blanco */
    spr = e.to; silA = 1; scale = 1.15;
    if(!e.sfxBurst){ e.sfxBurst = true; SFX.superHit(); vibrate([40,40,90]);
      for(let i=0;i<22;i++){
        const a = Math.random()*Math.PI*2, sp = 0.04+Math.random()*0.07;
        e.fx.push({x:80, y:136, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, g:0.00012, life:600+Math.random()*400, col:dark?'#9d7bd8':'#fff3c0', size:1+Math.floor(Math.random()*2)});
      }
    }
  } else {
    /* revelación con rebote */
    spr = e.to;
    silA = Math.max(0, 1-(t-EVO_T.reveal)/240);
    scale = 1 + Math.max(0, 1-(t-EVO_T.reveal)/320)*0.28;
    if(!e.sfxReveal){ e.sfxReveal = true;
      if(dark){ SFX.nope(); SFX.bye(); } else SFX.evolveFanfare();
      for(let i=0;i<16;i++){
        e.fx.push({x:20+Math.random()*120, y:40+Math.random()*40, vx:0, vy:0.035+Math.random()*0.03, g:0, life:1400,
          col:dark?'#6a4a8a':['#ffd94a','#e2574c','#5ec8d8','#7ac74f'][i%4], size:2});
      }
    }
  }

  /* el bitxo en el centro del foco */
  px(80-18, 162, 36, 3, 'rgba(0,0,0,0.4)');
  ctx.save();
  ctx.translate(80, 160);
  ctx.scale(scale, scale);
  ctx.drawImage(spr, -spr.width/2, -spr.height);
  if(silA>0){
    ctx.globalAlpha = silA;
    ctx.drawImage(silhouette(spr), -spr.width/2, -spr.height);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  /* flash de pantalla completa en el estallido */
  if(t>=EVO_T.burst && t<EVO_T.reveal+120){
    const fa = t<EVO_T.reveal ? 1 : Math.max(0, 1-(t-EVO_T.reveal)/120);
    ctx.fillStyle = 'rgba(255,255,255,'+fa.toFixed(2)+')';
    ctx.fillRect(0,0,160,272);
  }

  /* textos */
  if(t < EVO_T.charge+600){
    drawTextC('¿QUE LE PASA A '+e.fromName+'?', 80, 46, dark?'#b8a8e8':'#ffffff');
  }
  if(t > EVO_T.reveal+320){
    drawTextC(dark ? 'OH NO...' : '¡ENHORABUENA!', 80, 42, dark?'#9d7bd8':'#ffd94a');
    drawTextC('¡'+e.fromName+' EVOLUCIONO', 80, 210, '#ffffff');
    drawTextC('EN '+e.toName+'!', 80, 220, dark?'#9d7bd8':'#ffd94a');
  }
  if(t > EVO_T.reveal+900 && Math.floor(now/400)%2===0){
    drawTextC('TOCA PARA SEGUIR', 80, 244, 'rgba(255,255,255,0.6)');
  }
}

function drawHatch(dt){
  UI.hatchT += dt;
  const t = UI.hatchT;
  if(t<600){
    px(0,0,160,272,'#ffffff');
  } else {
    drawScene(performance.now());
    ctx.save(); ctx.translate(80,160);
    const spr = SPR[AP().line+'_'+AP().form][0];
    ctx.drawImage(spr, -spr.width/2, -spr.height);
    ctx.restore();
    px(0,0,160,272,'rgba(255,255,255,'+Math.max(0,1-(t-600)/500)+')');
    drawTextC('¡HA NACIDO!', 80, 56, K);
    drawTextC(LINES[AP().line].names[AP().form]+' - LINEA '+LINES[AP().line].name, 80, 68, K);
    drawTextC('CARACTER: '+(AP().trait||''), 80, 80, K);
    drawTextC(TRAITS[AP().trait]||'', 80, 88, 'rgba(26,20,40,0.55)');
    if(t>1500) drawTextC('TOCA PARA CUIDARLO', 80, 220, K);
  }
}

function drawAscendFX(dt){
  UI.ascT += dt;
  const t = UI.ascT;
  const ph = Math.min(1, t/2600);
  px(0,0,160,272,'#0e1030');
  for(const st of stars){ if(Math.sin(t/500+st.t)>0) px(st.x, st.y+20, 1,1,'#dfe8ff'); }
  for(let i=0;i<Math.min(24, G.ascensions);i++){
    const p = legacyStarPos(i);
    px(p.x, p.y+20, 2,2,'#ffd94a');
  }
  const spr = currentSprite();
  const y = 200 - ph*160;
  if(t<2600){
    ctx.save(); ctx.translate(80, y);
    ctx.drawImage(t%300<150? spr : silhouette(spr), -spr.width/2, -spr.height);
    ctx.restore();
    for(let i=0;i<6;i++){
      px(80-10+Math.random()*20, y+Math.random()*20, 1,2,'#ffd94a');
    }
  } else {
    const p = legacyStarPos(G.ascensions % 24);
    const big = t<3200 ? 5 : 3;
    px(p.x-big/2+1, p.y+20-big/2+1, big, big, '#ffd94a');
    px(p.x-2, p.y+21, 6,1,'#fff8d0'); px(p.x+1, p.y+18, 1,6,'#fff8d0');
  }
  drawTextC(currentFormDef().name+' ASCIENDE', 80, 60, '#ffffff');
  if(t>2800){
    drawTextC('+'+UI.ascGain+' ★', 80, 120, '#ffd94a');
    drawTextC('SU LUZ GUIARA A LOS', 80, 140, 'rgba(255,255,255,0.7)');
    drawTextC('QUE VENGAN DESPUES', 80, 148, 'rgba(255,255,255,0.7)');
  }
  if(t>4200) drawTextC('TOCA PARA CONTINUAR', 80, 230, 'rgba(255,255,255,0.6)');
}
