"use strict";
/* =========================================================
   BITXO — render/fx: partículas y cinemáticas (evolución, nacimiento, ascenso)
   ========================================================= */
function drawParticles(dt){
  for(let i=UI.particles.length-1;i>=0;i--){
    const p = UI.particles[i];
    if(p.life0===undefined) p.life0 = p.life;
    if(p.vx) p.x += p.vx*dt;
    if(p.g) p.vy += p.g*dt;
    p.y += p.vy*dt; p.life -= dt;
    if(p.life<=0){ UI.particles.splice(i,1); continue; }
    /* se desvanecen en su último tercio en vez de desaparecer de golpe */
    const k = p.life/p.life0;
    if(k<0.33) ctx.globalAlpha = k/0.33;
    if(p.ch==='.') px(p.x,p.y,2,2,p.col);
    else drawText(p.ch, p.x, p.y, p.col);
    ctx.globalAlpha = 1;
  }
  for(let i=UI.floats.length-1;i>=0;i--){
    const f = UI.floats[i];
    f.y += f.vy*dt; f.life -= dt;
    if(f.life<=0){ UI.floats.splice(i,1); continue; }
    if(f.life0===undefined) f.life0 = f.life;
    /* salto de entrada y contorno: se lee sobre cualquier fondo */
    const age = f.life0 - f.life;
    const jy = age<160 ? Math.round(-3*Math.sin(age/160*Math.PI)) : 0;
    const k2 = f.life/f.life0;
    if(k2<0.3) ctx.globalAlpha = k2/0.3;
    drawTextOC(f.s, f.x, Math.round(f.y)+jy, f.col, 1);
    ctx.globalAlpha = 1;
  }
}

/* =========================================================
   CINEMATICAS — evolución, nacimiento y ascenso
   Todo avanza con el dt de JUEGO (el hitstop las congela) y las
   partículas son propias, para poder ordenarlas por capas.
   ========================================================= */
function cineP(list, o){
  o.vx = o.vx||0; o.vy = o.vy||0; o.life0 = o.life = o.life||600;
  list.push(o); return o;
}
function cineStep(list, dt){
  for(let i=list.length-1;i>=0;i--){
    const f = list[i];
    f.life -= dt;
    if(f.life<=0){ list.splice(i,1); continue; }
    if(f.drag){ const k = Math.exp(-f.drag*dt); f.vx*=k; f.vy*=k; }
    f.vy += (f.g||0)*dt;
    f.x += f.vx*dt; f.y += f.vy*dt;
    if(f.floor!==undefined && f.y>f.floor){
      f.y = f.floor; f.vy *= -0.42; f.vx *= 0.62;
      if(Math.abs(f.vy)<0.015) f.vy = 0;
    }
    const k = f.life/f.life0;
    ctx.globalAlpha = f.fade===false ? 1 : Math.min(1, k*3);
    const x = Math.round(f.x), y = Math.round(f.y);
    const kind = f.kind||'px';
    if(kind==='px'){
      ctx.fillStyle = f.col; ctx.fillRect(x, y, f.size||1, f.size||1);
    } else if(kind==='spark'){
      const sp = Math.hypot(f.vx, f.vy)||1, len = Math.min(7, sp*55);
      ctx.fillStyle = f.col;
      for(let j=0;j<=len;j++) ctx.fillRect(Math.round(f.x - f.vx/sp*j), Math.round(f.y - f.vy/sp*j), 1, 1);
    } else if(kind==='star'){
      const r = k>0.5 ? 2 : 1;
      ctx.fillStyle = f.col;
      ctx.fillRect(x-r, y, r*2+1, 1); ctx.fillRect(x, y-r, 1, r*2+1);
    } else if(kind==='shard'){
      /* trozo de cáscara que gira (3 poses) */
      const fr = f.vy===0 && f.vx*f.vx<0.0001 ? 0 : Math.floor(f.life/70 + (f.seed||0))%3;
      const wh = [[4,2],[2,4],[3,3]][fr];
      ctx.fillStyle = K; ctx.fillRect(x-1, y-1, wh[0]+2, wh[1]+2);
      ctx.fillStyle = f.col; ctx.fillRect(x, y, wh[0], wh[1]);
      if(f.spot){ ctx.fillStyle = f.spot; ctx.fillRect(x, y, 1, 1); }
    } else if(kind==='conf'){
      const flip = Math.floor(f.life/90 + (f.seed||0))%2;
      const wx = Math.round(Math.sin(f.life/120 + (f.seed||0))*1.5);
      ctx.fillStyle = f.col; ctx.fillRect(x+wx, y, flip?2:1, flip?1:2);
    } else if(kind==='heart'){
      drawText('♥', x, y, f.col);
    }
  }
  ctx.globalAlpha = 1;
}
/* disco de píxeles (sin antialias): halos y focos */
function pxDisc(cx, cy, r, col, sq){
  sq = sq||1;
  for(let dy=-r; dy<=r; dy++){
    const hw = Math.floor(Math.sqrt(r*r - dy*dy)*(1/sq));
    px(Math.round(cx-hw), Math.round(cy+dy), hw*2+1, 1, col);
  }
}
/* rayos de luz radiales, pixelados */
function pxBeams(cx, cy, n, r0, r1, a0, col, wmax){
  ctx.fillStyle = col;
  for(let i=0;i<n;i++){
    const a = a0 + i*(Math.PI*2/n), ca = Math.cos(a), sa = Math.sin(a);
    for(let r=r0;r<r1;r+=2){
      const w = 1 + Math.floor((r-r0)/(r1-r0)*(wmax||3));
      ctx.fillRect(Math.round(cx+ca*r - w/2), Math.round(cy+sa*r - w/2), w, w);
    }
  }
}
/* hash determinista (nada de Math.random por fotograma) */
function hash01(i){ const x = Math.sin(i*127.1+311.7)*43758.5453; return x - Math.floor(x); }
/* sprite a escala entera con squash opcional, pies en (x,y) */
function drawSprAt(spr, x, y, sc, sx, sy, sil){
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(sc*(sx||1), sc*(sy||1));
  ctx.drawImage(spr, -spr.width/2, -spr.height);
  if(sil>0){ ctx.globalAlpha = Math.min(1, sil); ctx.drawImage(silhouette(spr), -spr.width/2, -spr.height); ctx.globalAlpha = 1; }
  ctx.restore();
}
/* barras de cine que entran al empezar */
function cineBars(t, h){
  const k = ease.outCubic(clamp01(t/350));
  const bh = Math.round((h||22)*k);
  px(0,0,160,bh,'#000000'); px(0,272-bh,160,bh,'#000000');
}
/* texto sello: entra a 3x y se asienta a 2x */
function stampText(s, cx, y, col, age){
  if(age<0) return;
  const sc = age<90 ? 3 : 2;
  const dy = age<90 ? -Math.round((1-age/90)*6) - 2 : 0;
  drawTextOC(s, cx, y+dy, col, sc);
}

SFX.crack = function(n){
  nz(sfxAt(0), 0.04, 0.05, 3200+n*600, 2);
  tone({f:900+n*220, slide:600+n*150, d:0.05, type:'square', vol:0.03});
};
SFX.hatchPop = function(){
  kick(sfxAt(0), 0.12);
  nz(sfxAt(0), 0.25, 0.06, 2600, 0.8, 9000);
  [784,988,1175,1568].forEach((f,i)=> tone({f, at:sfxAt(0.06+i*0.06), d:0.2, type:'p25', vol:0.045, send:0.35}));
  [2093,2637].forEach((f,i)=> tone({f, at:sfxAt(0.34+i*0.05), d:0.3, type:'p125', vol:0.025, send:0.55}));
};
SFX.starLock = function(){
  [1047,1319,1568,2093].forEach((f,i)=> tone({f, at:sfxAt(i*0.07), d:0.6, type:'p125', vol:0.035, vib:true, send:0.6}));
  nz(sfxAt(0), 0.6, 0.012, 9500, 5);
};

/* ---- EVOLUCION: cinemática estilo Pokémon ----
   carga de luz → morph de silueta acelerando → estallido → revelación
   (toques: <3900 salta al estallido, >4900 sale) */
const EVO_T = {charge:1000, burst:3900, reveal:4300};
function drawEvolve(dt){
  UI.evoT += dt;
  const t = UI.evoT;
  const e = UI.evo;
  if(!e){ UI.mode='main'; return; }
  const dark = e.dark;
  const now = performance.now();
  const CX = 80, FEET = 174, CY = 150;
  const cMain = dark ? '#9d7bd8' : '#fff3c0';
  const cGold = dark ? '#9d7bd8' : '#ffd94a';

  /* fondo profundo en bandas + foco */
  px(0,0,160,272, dark ? '#120a1c' : '#0c1030');
  px(0,90,160,120, dark ? '#180e26' : '#121842');
  px(0,120,160,60, dark ? '#1e1230' : '#161e52');
  const charge = clamp01(t/EVO_T.charge);
  const glowK = t<EVO_T.burst ? 0.35+charge*0.4+(t>EVO_T.charge ? (t-EVO_T.charge)/(EVO_T.burst-EVO_T.charge)*0.3 : 0) : 0.9;
  ctx.globalAlpha = 0.10*glowK; pxDisc(CX, CY, 62, dark ? '#6a4a9a' : '#6a78e8');
  ctx.globalAlpha = 0.14*glowK; pxDisc(CX, CY, 44, dark ? '#8a5ab8' : '#8a9af0');
  ctx.globalAlpha = 0.20*glowK; pxDisc(CX, CY, 28, dark ? '#b08ae0' : '#c8d0ff');
  ctx.globalAlpha = 1;
  /* suelo luminoso bajo el bitxo */
  px(CX-30, FEET+1, 60, 1, dark ? 'rgba(157,123,216,0.35)' : 'rgba(255,243,192,0.35)');
  px(CX-20, FEET+2, 40, 1, dark ? 'rgba(157,123,216,0.2)' : 'rgba(255,243,192,0.2)');

  /* rayos de luz: giran cada vez más rápido */
  if(t>EVO_T.charge*0.5){
    const mt = Math.max(0, t-EVO_T.charge);
    const spin = t/900 + mt*mt/2.6e6;
    const a = clamp01((t-EVO_T.charge*0.5)/600);
    ctx.globalAlpha = a*(t<EVO_T.reveal ? 0.18 : 0.12);
    pxBeams(CX, CY, 8, 16, 120, spin, dark ? '#b08ae0' : '#c8d0ff', 5);
    ctx.globalAlpha = a*0.10;
    pxBeams(CX, CY, 8, 16, 110, -spin*0.7 + 0.4, dark ? '#6a4a9a' : '#fff3c0', 3);
    ctx.globalAlpha = 1;
  }

  /* anillos de cada cambio de forma */
  for(let i=e.rings.length-1;i>=0;i--){
    const rg = e.rings[i];
    rg.r += dt*0.09; rg.a -= dt*0.0022;
    if(rg.a<=0){ e.rings.splice(i,1); continue; }
    ctx.fillStyle = 'rgba(255,255,255,'+rg.a.toFixed(2)+')';
    const n = Math.max(16, Math.round(rg.r*1.6));
    for(let j=0;j<n;j++){
      const a = j*(Math.PI*2/n);
      ctx.fillRect(Math.round(CX+Math.cos(a)*rg.r), Math.round(CY+Math.sin(a)*rg.r*0.9), 2, 2);
    }
  }

  /* líneas de velocidad hacia el centro en el último tramo */
  if(t>EVO_T.burst-1300 && t<EVO_T.burst){
    const k = (t-(EVO_T.burst-1300))/1300;
    ctx.fillStyle = dark ? 'rgba(200,170,255,0.55)' : 'rgba(255,255,255,0.6)';
    const n = 10 + Math.floor(k*14);
    for(let i=0;i<n;i++){
      const a = hash01(i)*Math.PI*2;
      const ph = ((t/260 + hash01(i+50)) % 1);
      const r = 120 - ph*80, len = 6 + k*14;
      const ca = Math.cos(a), sa = Math.sin(a);
      for(let j=0;j<len;j+=1) ctx.fillRect(Math.round(CX+ca*(r+j)), Math.round(CY+sa*(r+j)), 1, 1);
    }
    /* temblor creciente de la cámara */
    if(k>0.5) shake(dt*0.0032*k);
  }

  /* partículas de fondo */
  cineStep(e.fx, dt);

  /* qué sprite y cuánta silueta blanca */
  let spr = e.from, silA = 0, sc = 3, sqx = 1, sqy = 1, jit = 0;
  if(t < EVO_T.charge){
    /* carga: la luz converge hacia el bitxo */
    silA = charge*0.85;
    jit = t>600 && Math.floor(t/45)%2 ? 1 : 0;
    if(Math.random() < dt*0.05){
      const a = Math.random()*Math.PI*2, r = 60+Math.random()*30;
      const sx = CX+Math.cos(a)*r, sy = CY+Math.sin(a)*r*0.9;
      cineP(e.fx, {x:sx, y:sy, vx:(CX-sx)*0.0016, vy:(CY-sy)*0.0016, life:600, col:cMain, kind:'spark'});
    }
  } else if(t < EVO_T.burst){
    /* morph: alterna forma vieja/nueva cada vez más rápido */
    const mt = t - EVO_T.charge;
    const period = Math.max(60, 420*Math.pow(0.5, mt/850));
    e.swapAcc += dt/period;
    const n = Math.floor(e.swapAcc);
    spr = (n%2===1) ? e.to : e.from;
    if(n !== e.lastSwap){
      e.lastSwap = n; e.swapAt = t;
      e.rings.push({r:14, a:0.5});
      tone({f:420+Math.min(14,n)*45, d:0.05, type:'p25', vol:0.035});
      if(Math.random()<0.7) cineP(e.fx, {x:CX+(Math.random()-0.5)*30, y:CY+(Math.random()-0.5)*30, vy:-0.02, life:500, col:cMain, kind:'star'});
    }
    silA = 1;
    /* golpe breve de escala en cada cambio */
    const since = t-(e.swapAt||0);
    if(since<70){ sqx = 1.12; sqy = 0.9; }
    jit = Math.floor(t/35)%2 ? Math.min(2, Math.floor(mt/1200)) : 0;
    if(Math.random() < dt*0.03){
      const a = Math.random()*Math.PI*2, r = 70+Math.random()*20;
      const sx = CX+Math.cos(a)*r, sy = CY+Math.sin(a)*r*0.9;
      cineP(e.fx, {x:sx, y:sy, vx:(CX-sx)*0.0022, vy:(CY-sy)*0.0022, life:420, col:cMain, kind:'spark'});
    }
  } else if(t < EVO_T.reveal){
    /* estallido en blanco */
    spr = e.to; silA = 1; sqx = sqy = 1.2;
    if(!e.sfxBurst){ e.sfxBurst = true; SFX.superHit(); vibrate([40,40,90]); }
    if(!e.burstFx){
      e.burstFx = true; shake(0.85); hitstop(60);
      for(let i=0;i<34;i++){
        const a = i/34*Math.PI*2 + hash01(i)*0.3, sp = 0.06+hash01(i+9)*0.09;
        cineP(e.fx, {x:CX, y:CY, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, g:0.00008, drag:0.0015, life:700+hash01(i+3)*500, col:i%3 ? cMain : cGold, kind:i%2?'spark':'star'});
      }
      e.rings.push({r:10, a:0.9}); e.rings.push({r:4, a:0.7});
    }
  } else {
    /* revelación con rebote */
    spr = e.to;
    const rt = t-EVO_T.reveal;
    silA = Math.max(0, 1-rt/260);
    const sq = springSquash(1, 0.22, 1+rt);
    sqx = sq[0]; sqy = sq[1];
    if(!e.sfxReveal){ e.sfxReveal = true; if(dark){ SFX.nope(); SFX.bye(); } else SFX.evolveFanfare(); }
    if(!e.revealFx){
      e.revealFx = true;
      if(dark){
        for(let i=0;i<26;i++) cineP(e.fx, {x:30+hash01(i)*100, y:FEET-hash01(i+4)*30, vy:-0.015-hash01(i+7)*0.02, vx:(hash01(i+2)-0.5)*0.01, life:1800, col:i%2?'#3a2850':'#6a4a8a', size:2});
      } else {
        const C = ['#ffd94a','#e2574c','#5ec8d8','#7ac74f','#f2a2b8','#8a6ae8'];
        for(let i=0;i<60;i++){
          const side = i%2 ? 1 : -1;
          cineP(e.fx, {x:side>0 ? 4 : 156, y:120+hash01(i)*40, vx:side*(0.05+hash01(i+1)*0.08), vy:-0.12-hash01(i+2)*0.1, g:0.00022, drag:0.0012,
            life:2200+hash01(i+5)*1200, col:C[i%6], kind:'conf', floor:249, seed:i});
        }
        /* lluvia de confeti desde arriba */
        for(let i=0;i<50;i++){
          cineP(e.fx, {x:hash01(i+70)*160, y:10-hash01(i+80)*60, vx:(hash01(i+90)-0.5)*0.02, vy:0.02+hash01(i+60)*0.03, g:0.00003,
            life:3500, col:C[(i+3)%6], kind:'conf', floor:249, seed:i+7});
        }
        for(let i=0;i<16;i++){
          const a = i/16*Math.PI*2;
          cineP(e.fx, {x:CX, y:CY, vx:Math.cos(a)*0.08, vy:Math.sin(a)*0.07, drag:0.003, life:800, col:'#ffd94a', kind:'star'});
        }
      }
    }
  }

  /* halo que late detrás de la forma nueva */
  if(t>=EVO_T.reveal){
    const pulse = Math.round(Math.sin(now/220)*2);
    ctx.globalAlpha = 0.18; pxDisc(CX, CY, 26+pulse, cGold); ctx.globalAlpha = 1;
  }
  /* el bitxo: sombra, contorno de luz y cuerpo */
  px(CX-24, FEET, 48, 3, 'rgba(0,0,0,0.45)');
  if(silA>0.5){
    ctx.globalAlpha = 0.35;
    const sil = silhouette(spr);
    for(const d of [[-3,0],[3,0],[0,-3],[0,3]]) drawSprAt(sil, CX+jit+d[0], FEET+d[1], sc, sqx, sqy, 0);
    ctx.globalAlpha = 1;
  }
  drawSprAt(spr, CX+jit, FEET, sc, sqx, sqy, silA);

  /* destellos fijos alrededor de la forma nueva */
  if(t>EVO_T.reveal+200){
    for(let i=0;i<6;i++){
      const ph = (now/700 + hash01(i)) % 1;
      if(ph>0.5) continue;
      const a = hash01(i+20)*Math.PI*2, r = 30+hash01(i+30)*14;
      const x = Math.round(CX+Math.cos(a)*r), y = Math.round(CY+Math.sin(a)*r);
      const s = ph<0.25 ? 2 : 1;
      px(x-s, y, s*2+1, 1, '#ffffff'); px(x, y-s, 1, s*2+1, '#ffffff');
    }
  }

  /* flash de pantalla completa en el estallido */
  if(t>=EVO_T.burst && t<EVO_T.reveal+160){
    const fa = t<EVO_T.reveal ? 1 : Math.max(0, 1-(t-EVO_T.reveal)/160);
    ctx.fillStyle = 'rgba(255,255,255,'+fa.toFixed(2)+')';
    ctx.fillRect(0,0,160,272);
  }

  cineBars(t, 22);

  /* textos */
  if(t < EVO_T.charge+700){
    const a = t<200 ? t/200 : (t>EVO_T.charge+400 ? Math.max(0, 1-(t-EVO_T.charge-400)/300) : 1);
    ctx.globalAlpha = a;
    drawTextOC('¿QUE LE PASA A', 80, 40, dark?'#b8a8e8':'#ffffff', 1);
    drawTextOC(e.fromName+'?', 80, 50, dark?'#b8a8e8':'#ffd94a', 2);
    ctx.globalAlpha = 1;
  }
  if(t > EVO_T.reveal+120){
    const rt = t-EVO_T.reveal;
    stampText(dark ? 'OH NO...' : '¡ENHORABUENA!', 80, 38, dark?'#9d7bd8':'#ffd94a', rt-120);
    if(rt>320){
      const k = ease.outCubic(clamp01((rt-320)/250));
      ctx.globalAlpha = k;
      drawTextOC('¡'+e.fromName+' EVOLUCIONO EN', 80, 192 + Math.round((1-k)*6), '#ffffff', 1);
      ctx.globalAlpha = 1;
    }
    stampText(e.toName+'!', 80, 204, dark?'#b08ae0':'#ffd94a', rt-480);
    if(rt>760 && e.toDesc){
      ctx.globalAlpha = ease.outCubic(clamp01((rt-760)/300));
      drawTextOC(e.toDesc, 80, 222, dark?'#c8b8f0':'#fff8d0', 1);
      ctx.globalAlpha = 1;
    }
    if(rt>480 && !e.stampFx){ e.stampFx = true; shake(0.25); tone({f:1568, d:0.12, type:'p25', vol:0.04}); }
  }
  if(t > EVO_T.reveal+900 && Math.floor(now/400)%2===0){
    drawTextOC('TOCA PARA SEGUIR', 80, 234, '#ffffff', 1);
  }
}

/* ---- NACIMIENTO: el huevo tiembla, se agrieta, deja escapar luz y ¡POP! ----
   toques: antes del POP salta al POP; después de HATCH_T.exit vuelve al prado */
const HATCH_T = {crack1:450, crack2:850, crack3:1200, glow:1350, pop:1700, card:2150, trait:2450, exit:2900};
const EGG_CRACKS = [
  [[5,2],[6,3],[5,4],[6,5]],
  [[7,5],[8,6],[9,5],[4,5],[3,6],[4,7],[2,7]],
  [[9,7],[8,8],[9,9],[6,6],[5,7],[6,8],[5,9],[2,4],[3,3]]
];
let HX = null;
function hatchTap(){
  if(UI.hatchT < HATCH_T.pop-40){ UI.hatchT = HATCH_T.pop-40; return; }
  if(UI.hatchT > HATCH_T.exit) UI.mode = 'main';
}
function drawHatch(dt){
  if(!HX || UI.hatchT < HX.t) HX = {t:0, fx:[], cracks:0, popped:false};
  UI.hatchT += dt;
  const t = UI.hatchT;
  HX.t = t;
  const p = AP();
  const now = performance.now();
  const L = LINES[p.line];
  const egg = (SPR['egg_'+p.line]||SPR.egg_mystery)[0];
  const baby = SPR[p.line+'_'+(p.form||'babyA')];
  const CX = 80, FEET = 172, CY = 152;
  const popped = t>=HATCH_T.pop;

  /* el prado de fondo, oscurecido: foco en el huevo */
  drawScene(now);
  px(0,196,160,76,'#23402e'); px(0,196,160,1,'#2e5c3a');
  const dim = popped ? Math.max(0.25, 0.62 - (t-HATCH_T.pop)/900) : Math.min(0.62, t/400*0.62);
  ctx.fillStyle = 'rgba(10,8,30,'+dim.toFixed(2)+')'; ctx.fillRect(0,0,160,272);
  /* foco de luz */
  const glowT = clamp01((t-HATCH_T.crack2)/(HATCH_T.pop-HATCH_T.crack2));
  ctx.globalAlpha = 0.10 + glowT*0.12 + (popped ? 0.1 : 0); pxDisc(CX, CY, 46, '#fff3c0', 1);
  ctx.globalAlpha = 0.12 + glowT*0.14; pxDisc(CX, CY, 30, '#fff8d0', 1);
  ctx.globalAlpha = 1;

  if(!popped){
    /* grietas por fases con chasquido */
    const want = t>=HATCH_T.crack3 ? 3 : t>=HATCH_T.crack2 ? 2 : t>=HATCH_T.crack1 ? 1 : 0;
    while(HX.cracks < want){
      HX.cracks++;
      SFX.crack(HX.cracks); shake(0.12+HX.cracks*0.06); vibrate(20);
      for(let i=0;i<3+HX.cracks;i++) cineP(HX.fx, {x:CX-4+hash01(i+HX.cracks*7)*8, y:CY-8, vx:(hash01(i+3)-0.5)*0.08, vy:-0.06-hash01(i)*0.05, g:0.0003, life:700, col:L.eggShell, kind:'px', size:2, floor:FEET});
    }
    /* luz que se escapa por las grietas */
    if(t>HATCH_T.crack2){
      const k = clamp01((t-HATCH_T.crack2)/(HATCH_T.pop-HATCH_T.crack2));
      ctx.globalAlpha = 0.12+k*0.3;
      pxBeams(CX, CY-4, 7, 12, 40+k*70, -1.57+Math.sin(t/300)*0.05, '#fff8d0', 3);
      ctx.globalAlpha = 1;
    }
    /* temblor por pulsos, cada vez más fuerte y seguido */
    const k = t/HATCH_T.pop;
    const freq = 0.004 + k*0.02;
    const pulse = Math.max(0, Math.sin(t*freq*Math.PI*0.5));
    const amp = (k<0.2 ? 0.6 : 1 + k*3) * pulse;
    const ox = Math.round(Math.sin(t/28)*amp);
    const sq = 1 + pulse*k*0.08;
    /* hinchado antes del POP */
    const swell = t>HATCH_T.glow ? (t-HATCH_T.glow)/(HATCH_T.pop-HATCH_T.glow) : 0;
    const white = t>HATCH_T.glow ? swell*0.9 : 0;
    px(CX-16, FEET, 32, 3, 'rgba(0,0,0,0.4)');
    ctx.save();
    ctx.translate(CX+ox, FEET);
    ctx.scale(3*(1/sq)*(1+swell*0.1), 3*sq*(1+swell*0.1));
    ctx.drawImage(egg, -egg.width/2, -egg.height);
    /* grietas: primero oscuras, luego brillan por dentro */
    const lit = t>HATCH_T.crack2;
    for(let c=0;c<HX.cracks;c++){
      for(const pt of EGG_CRACKS[c]){
        ctx.fillStyle = lit ? (Math.floor(t/90+pt[0])%3 ? '#fff8d0' : '#ffd94a') : K;
        ctx.fillRect(pt[0]-egg.width/2, pt[1]-egg.height, 1, 1);
      }
    }
    if(white>0){ ctx.globalAlpha = white; ctx.drawImage(silhouette(egg), -egg.width/2, -egg.height); ctx.globalAlpha = 1; }
    ctx.restore();
    cineStep(HX.fx, dt);
    drawTextOC(t<HATCH_T.crack2 ? '¿...?' : '¡SE MUEVE!', 80, 60, '#ffffff', t<HATCH_T.crack2 ? 1 : 2);
    if(t>HATCH_T.crack2) drawTextOC('¡VA A NACER!', 80, 76, '#ffd94a', 1);
  } else {
    const rt = t-HATCH_T.pop;
    if(!HX.popped){
      HX.popped = true;
      SFX.hatchPop(); vibrate([40,30,80]);
      shake(0.6); hitstop(70); flash('#ffffff', 1, 260);
      /* trozos de cáscara con física */
      for(let i=0;i<18;i++){
        const a = -Math.PI/2 + (hash01(i)-0.5)*2.8, sp = 0.07+hash01(i+11)*0.1;
        cineP(HX.fx, {x:CX+(hash01(i+5)-0.5)*16, y:CY-4+(hash01(i+8)-0.5)*14, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, g:0.00035, drag:0.0008,
          life:1800+hash01(i+2)*900, col:L.eggShell, spot:i%3===0 ? L.eggSpot : null, kind:'shard', floor:FEET+2+Math.round(hash01(i+4)*6), seed:i});
      }
      for(let i=0;i<24;i++){
        const a = i/24*Math.PI*2, sp = 0.05+hash01(i+40)*0.08;
        cineP(HX.fx, {x:CX, y:CY-6, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, drag:0.002, life:600+hash01(i)*400, col:i%2?'#ffd94a':'#ffffff', kind:i%3?'spark':'star'});
      }
      HX.rings = [{r:6,a:1}];
    }
    /* rayos giratorios detrás */
    ctx.globalAlpha = Math.max(0.08, 0.3 - rt/4000);
    pxBeams(CX, CY-4, 10, 14, 110, now/2400, '#fff8d0', 5);
    ctx.globalAlpha = 1;
    /* anillo de onda */
    if(HX.rings) for(let i=HX.rings.length-1;i>=0;i--){
      const rg = HX.rings[i]; rg.r += dt*0.12; rg.a -= dt*0.0018;
      if(rg.a<=0){ HX.rings.splice(i,1); continue; }
      ctx.fillStyle = 'rgba(255,248,208,'+rg.a.toFixed(2)+')';
      const n = Math.round(rg.r*1.8)+10;
      for(let j=0;j<n;j++){ const a = j/n*Math.PI*2; ctx.fillRect(Math.round(CX+Math.cos(a)*rg.r), Math.round(CY-4+Math.sin(a)*rg.r*0.85), 2, 2); }
    }
    /* el bebé: sale disparado, cae y rebota */
    let yOff = 0, sx = 1, sy = 1;
    if(rt<520){
      const k = rt/520;
      yOff = -Math.sin(k*Math.PI)*26;
      if(k<0.5){ sx = 0.85; sy = 1.2; }
    } else {
      if(!HX.landFx){ HX.landFx = true; shake(0.2); tone({f:392, slide:520, d:0.08, type:'p25', vol:0.04}); for(let i=0;i<6;i++) cineP(HX.fx, {x:CX+(i-2.5)*4, y:FEET-1, vx:(i-2.5)*0.02, vy:-0.02, g:0.0001, life:400, col:'rgba(255,255,255,0.8)', size:1}); }
      const s2 = springSquash(1, 0.3, 1+(rt-520));
      sx = s2[0]; sy = s2[1];
      /* saltitos de alegría */
      const hop = (rt-520) % 1300;
      if(rt>1200 && hop<300) yOff = -Math.sin(hop/300*Math.PI)*6;
    }
    const blink = (now%2200)<140;
    const spr = baby ? baby[blink?1:0] : currentSprite();
    const shw = Math.round(32 - Math.min(14, -yOff/2));
    px(CX-(shw>>1), FEET, shw, 3, 'rgba(0,0,0,0.4)');
    drawSprAt(spr, CX, FEET+yOff, 3, sx, sy, rt<200 ? 1-rt/200 : 0);
    /* corazones que suben */
    if(rt>600){
      for(let i=0;i<4;i++){
        const ph = ((rt/1600) + i*0.25) % 1;
        const hx = CX - 20 + i*13 + Math.round(Math.sin(rt/300+i)*2);
        ctx.globalAlpha = ph<0.8 ? 1 : (1-ph)/0.2;
        drawText('♥', hx, Math.round(CY-18-ph*40), '#f2a2b8');
      }
      ctx.globalAlpha = 1;
    }
    cineStep(HX.fx, dt);

    /* títulos y tarjetas */
    stampText('¡HA NACIDO!', 80, 42, '#ffd94a', rt-60);
    const nm = LINES[p.line].names[p.form||'babyA'];
    if(t>HATCH_T.card){
      const k = ease.outBack(clamp01((t-HATCH_T.card)/320));
      const x = Math.round(-150 + k*156);
      px(x+1, 199, 148, 26, 'rgba(0,0,0,0.35)');
      px(x, 196, 148, 26, '#20243c'); px(x, 196, 148, 1, '#ffd94a'); px(x, 221, 148, 1, K);
      px(x, 196, 4, 26, L.eggSpot);
      drawTextO(nm, x+10, 200, '#ffffff', 2);
      drawText('LINEA '+L.name, x+10, 213, L.eggSpot);
      drawText('GEN '+(p.gen||1), x+144-textW('GEN '+(p.gen||1)), 213, 'rgba(255,255,255,0.6)');
    }
    if(t>HATCH_T.trait && p.trait){
      const k = ease.outBack(clamp01((t-HATCH_T.trait)/320));
      const x = Math.round(166 - k*160);
      px(x+1, 229, 148, 20, 'rgba(0,0,0,0.35)');
      px(x, 226, 148, 20, '#f6efe0'); px(x, 226, 148, 1, K); px(x, 245, 148, 1, K);
      px(x+144, 226, 4, 20, '#f2a2b8');
      drawText('CARACTER', x+6, 230, 'rgba(26,20,40,0.55)');
      drawText(p.trait, x+42, 230, K);
      drawText(TRAITS[p.trait]||'', x+6, 238, '#8a6a10');
    }
    if(t>HATCH_T.exit && Math.floor(now/420)%2===0) drawTextOC('TOCA PARA CUIDARLO', 80, 254, '#ffffff', 1);
  }
  cineBars(t, 14);
}

/* ---- ASCENSO: sube entre luz, se vuelve estrella y se une a su constelación ---- */
const ASC_T = {star:2600, line:2700, msg:2900, exit:4200};
let AX = null;
function drawAscendFX(dt){
  if(!AX || UI.ascT < AX.t) AX = {t:0, fx:[], locked:false, trail:[]};
  UI.ascT += dt;
  const t = UI.ascT;
  AX.t = t;
  const now = performance.now();
  const p = AP();
  const n = G.ascensions||0;
  const tgt = legacyStarPos(n % 24);
  const TX = tgt.x+1, TY = tgt.y+21;

  /* cielo nocturno en bandas */
  px(0,0,160,272,'#0a0c26');
  px(0,90,160,90,'#0e1030');
  px(0,150,160,80,'#141646');
  px(0,200,160,72,'#1b1f5c');
  /* estrellas de fondo: titilan con su fase propia */
  for(const st of stars){
    const tw = Math.sin(now/500+st.t);
    if(tw>-0.3) px(st.x, st.y+20, 1, 1, tw>0.7 ? '#ffffff' : '#8a90c8');
  }
  for(let i=0;i<40;i++){
    const x = Math.floor(hash01(i)*160), y = Math.floor(hash01(i+99)*180)+10;
    if(Math.sin(now/700+i)>0.2) px(x, y, 1, 1, 'rgba(223,232,255,0.5)');
  }
  /* constelación de la dinastía: ascensos anteriores unidos */
  const prev = Math.min(24, n);
  ctx.fillStyle = 'rgba(255,217,74,0.28)';
  for(let i=1;i<prev;i++){
    const a = legacyStarPos(i-1), b = legacyStarPos(i);
    pxLine(a.x+1, a.y+21, b.x+1, b.y+21);
  }
  for(let i=0;i<prev;i++){
    const q = legacyStarPos(i);
    const tw = Math.sin(now/400+i*1.7) > 0.5;
    px(q.x, q.y+20, 2, 2, '#ffd94a');
    if(tw){ px(q.x-1, q.y+20, 4, 2, 'rgba(255,217,74,0.5)'); px(q.x, q.y+19, 2, 4, 'rgba(255,217,74,0.5)'); }
  }
  /* colinas del prado abajo */
  for(let x=0;x<160;x+=2){
    const hy = Math.round(236 + Math.sin(x/21)*5 + Math.sin(x/9)*2);
    px(x, hy, 2, 272-hy, '#0c1a28');
  }

  const spr = currentSprite();
  if(t < ASC_T.star){
    /* subida: ease in-out hacia su estrella */
    const k = ease.inOutSine(clamp01(t/ASC_T.star));
    const x = 80 + (TX-80)*k;
    const y = 232 - (232-TY)*k;
    const sc = k<0.55 ? 2 : 1;
    /* columna de luz desde el suelo */
    ctx.globalAlpha = 0.14*(1-k*0.5);
    px(Math.round(x)-8, Math.round(y), 16, 272-Math.round(y), '#fff3c0');
    ctx.globalAlpha = 0.18*(1-k*0.5);
    px(Math.round(x)-3, Math.round(y), 6, 272-Math.round(y), '#fff8d0');
    ctx.globalAlpha = 1;
    /* estela de ecos */
    for(let i=4;i>=1;i--){
      const kk = ease.inOutSine(clamp01((t-i*70)/ASC_T.star));
      const ex = 80 + (TX-80)*kk, ey = 232 - (232-TY)*kk;
      ctx.globalAlpha = 0.12*(5-i)/4;
      drawSprAt(silhouette(spr), ex, ey, kk<0.55 ? 2 : 1, 1, 1, 0);
    }
    ctx.globalAlpha = 1;
    /* chispas que orbitan (deterministas) */
    for(let i=0;i<8;i++){
      const a = now/300 + i*Math.PI/4;
      const r = (sc===2 ? 18 : 11) + Math.sin(now/200+i)*2;
      const ox = Math.round(Math.cos(a)*r), oy = Math.round(Math.sin(a)*r*0.5);
      px(Math.round(x)+ox, Math.round(y)-spr.height*sc/2+oy, 1, 1, i%2 ? '#ffd94a' : '#ffffff');
    }
    /* el bitxo, volviéndose luz */
    const glowA = clamp01((t-800)/1600);
    drawSprAt(spr, x, y, sc, 1, 1, glowA);
    /* motas que caen de la estela */
    if(Math.floor(t/60)!==Math.floor((t-dt)/60)){
      const i = Math.floor(t/60);
      cineP(AX.fx, {x:x-6+hash01(i)*12, y:y-2, vx:(hash01(i+1)-0.5)*0.01, vy:0.02+hash01(i+2)*0.02, life:900, col:i%2?'#ffd94a':'#fff8d0', size:1});
    }
  } else {
    /* se vuelve estrella: fogonazo y latido */
    if(!AX.locked){
      AX.locked = true;
      SFX.starLock(); shake(0.35); flash('#fff8d0', 0.6, 240); vibrate([30,30,60]);
      for(let i=0;i<20;i++){
        const a = i/20*Math.PI*2, sp = 0.04+hash01(i)*0.05;
        cineP(AX.fx, {x:TX, y:TY, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, drag:0.003, life:700+hash01(i+5)*400, col:i%2?'#ffd94a':'#ffffff', kind:i%3?'spark':'star'});
      }
      AX.ring = 0;
    }
    const st = t-ASC_T.star;
    AX.ring += dt*0.06;
    if(AX.ring<40){
      ctx.fillStyle = 'rgba(255,248,208,'+Math.max(0, 0.8-AX.ring/50).toFixed(2)+')';
      const m = Math.round(AX.ring*1.6)+8;
      for(let j=0;j<m;j++){ const a = j/m*Math.PI*2; ctx.fillRect(Math.round(TX+Math.cos(a)*AX.ring), Math.round(TY+Math.sin(a)*AX.ring), 1, 1); }
    }
    /* línea de constelación hacia la estrella anterior */
    if(n>0 && t>ASC_T.line){
      const a = legacyStarPos((n-1)%24);
      const k = ease.outCubic(clamp01((t-ASC_T.line)/600));
      ctx.fillStyle = 'rgba(255,217,74,0.7)';
      pxLine(a.x+1, a.y+21, a.x+1+(TX-a.x-1)*k, a.y+21+(TY-a.y-21)*k);
    }
    /* la estrella nueva, grande y latiendo */
    const big = st<500 ? 4 : (Math.floor(now/300)%2 ? 3 : 2);
    px(TX-big, TY, big*2+1, 1, '#fff8d0'); px(TX, TY-big, 1, big*2+1, '#fff8d0');
    px(TX-1, TY-1, 3, 3, '#ffd94a'); px(TX, TY, 1, 1, '#ffffff');
    if(st<600){ ctx.globalAlpha = 0.3*(1-st/600); pxDisc(TX, TY, 8, '#fff8d0'); ctx.globalAlpha = 1; }
  }
  cineStep(AX.fx, dt);
  cineBars(t, 14);

  /* textos */
  const nm = petName(p);
  if(t<ASC_T.star+200){
    /* se aparta cuando el bitxo sube a su altura */
    const py = 232 - (232-TY)*ease.inOutSine(clamp01(t/ASC_T.star));
    const a = Math.min(t<300 ? t/300 : 1, clamp01((py-150)/40));
    ctx.globalAlpha = a;
    drawTextOC(nm, 80, 126, '#ffffff', 2);
    drawTextOC('ASCIENDE AL CIELO', 80, 140, '#ffd94a', 1);
    ctx.globalAlpha = 1;
  }
  if(t>ASC_T.msg){
    const mt = t-ASC_T.msg;
    stampText('+'+UI.ascGain+' ★', 80, 120, '#ffd94a', mt);
    const k = clamp01((mt-300)/400);
    if(k>0){
      ctx.globalAlpha = k;
      drawTextOC('SU LUZ GUIARA A LOS', 80, 146, '#dfe8ff', 1);
      drawTextOC('QUE VENGAN DESPUES', 80, 154, '#dfe8ff', 1);
      ctx.globalAlpha = 1;
    }
    const k2 = clamp01((mt-700)/400);
    if(k2>0){
      ctx.globalAlpha = k2;
      const dyn = 'DINASTIA: '+(n+1)+(n+1===1 ? ' ESTRELLA' : ' ESTRELLAS');
      drawTextOC(dyn, 80, 172, '#ffd94a', 1);
      drawTextOC('GEN '+(p.gen||1)+' · '+nm, 80, 181, 'rgba(223,232,255,0.7)', 1);
      ctx.globalAlpha = 1;
    }
  }
  if(t>ASC_T.exit && Math.floor(now/420)%2===0) drawTextOC('TOCA PARA CONTINUAR', 80, 246, '#ffffff', 1);
}
/* línea de píxeles (Bresenham simple) con el fillStyle actual */
function pxLine(x0, y0, x1, y1){
  x0=Math.round(x0); y0=Math.round(y0); x1=Math.round(x1); y1=Math.round(y1);
  const dx = Math.abs(x1-x0), dy = -Math.abs(y1-y0), sx = x0<x1?1:-1, sy = y0<y1?1:-1;
  let err = dx+dy, guard = 0;
  while(guard++<400){
    ctx.fillRect(x0, y0, 1, 1);
    if(x0===x1 && y0===y1) break;
    const e2 = 2*err;
    if(e2>=dy){ err+=dy; x0+=sx; }
    if(e2<=dx){ err+=dx; y0+=sy; }
  }
}
