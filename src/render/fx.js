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

function drawEvolve(dt){
  UI.evoT += dt;
  const t = UI.evoT;
  px(0,0,160,272,K);
  const spr = t<1300 ? UI.evoFrom : currentSprite();
  const flash = Math.floor(t/120)%2===0 && t<2200;
  ctx.save();
  ctx.translate(80, 160);
  ctx.drawImage(flash ? silhouette(spr) : spr, -spr.width/2, -spr.height);
  ctx.restore();
  for(let i=0;i<10;i++){
    const a = t/300 + i;
    px(80+Math.cos(a)*(30+(t/40)%20), 150+Math.sin(a)*(26+(t/40)%20), 2,2,'#ffd94a');
  }
  drawTextC('¡EVOLUCION!', 80, 60, '#ffffff');
  if(t>1400) drawTextC('AHORA ES '+currentFormDef().name, 80, 220, '#ffd94a');
  if(t>2600) drawTextC('TOCA PARA SEGUIR', 80, 236, 'rgba(255,255,255,0.6)');
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
