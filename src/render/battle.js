"use strict";
/* =========================================================
   BITXO — render/battle: combate v3
   Escenario por elemento (cielo tramado, suelo en perspectiva,
   atrezzo y marco), luchadores a escala 2x/3x, placas de vida con
   barra fantasma, aro de ataque y aro de defensa, cinemática de
   SUPER, marco de impacto en el K.O. y tarjeta de resultado.
   ========================================================= */
const BT_HZ = 78;       /* línea del horizonte */
const BT_AH = 190;      /* alto de la arena (debajo: panel de mando) */

/* paletas del escenario por elemento del rival */
const BT_THEMES = {
  brasa: {sky:['#2a1224','#8a2e2a','#f0a04b'], far:'#3a1620', mid:'#5a2222', g1:'#5a2c22', g2:'#4a221a', rim:'#2a1210', plat:'#9a5236', platD:'#4a2418', fg:'#1a0a0e', prop:'volcano', amb:'ember'},
  marea: {sky:['#2a5a98','#5aa8d8','#bfe8f0'], far:'#2a5a8a', mid:'#3a86b0', g1:'#e6d6a4', g2:'#d6c490', rim:'#a8966a', plat:'#f2e6ba', platD:'#a89868', fg:'#16364a', prop:'sea', amb:'glint'},
  petrea:{sky:['#4e4c6a','#8e8aa6','#d6ccd0'], far:'#5e5870', mid:'#4c485c', g1:'#7a7482', g2:'#6a6474', rim:'#44404e', plat:'#aaa2ac', platD:'#56505e', fg:'#221e2a', prop:'mesa', amb:'dust'},
  astro: {sky:['#0a0822','#22164e','#54367e'], far:'#1e1644', mid:'#161034', g1:'#2c2458', g2:'#241c4a', rim:'#120c28', plat:'#6a5aa8', platD:'#2a2254', fg:'#08061a', prop:'moon', amb:'twinkle'},
  fungo: {sky:['#1e2a22','#4a5a36','#a8a462'], far:'#2e3c26', mid:'#26321e', g1:'#4a5a2a', g2:'#3e4c24', rim:'#232c16', plat:'#7e8c46', platD:'#3a4424', fg:'#121a0e', prop:'shroom', amb:'spore'},
  voltio:{sky:['#12121e','#2e2e46','#6e6850'], far:'#24243a', mid:'#2e2e44', g1:'#4a4638', g2:'#3e3a2e', rim:'#24221a', plat:'#8a8262', platD:'#46402e', fg:'#0e0e18', prop:'storm', amb:'storm'},
  sombra:{sky:['#0c0818','#241634','#46304e'], far:'#1c1226', mid:'#261a32', g1:'#2c2236', g2:'#241c2e', rim:'#120c1a', plat:'#5c4a6c', platD:'#2a2034', fg:'#06040c', prop:'ruins', amb:'fog'}
};
function btTheme(b){
  if(BT_THEMES[b.elem]) return {key:b.elem, ...BT_THEMES[b.elem]};
  const ph = dayPhase(), S = SKY[ph];
  const night = ph==='night';
  return {key:'prado_'+ph+(b.elem==='pradera'?'_f':''), sky:S.bands, far:S.hill2, mid:S.hill, g1:S.grass, g2:S.grass2,
          rim: night ? '#0e2a22' : '#2e5a36', plat: night ? '#3a6a52' : '#8ac866', platD: night ? '#1a3a2c' : '#3e7a42',
          fg: night ? '#06140e' : '#1a3a22', prop:'tree', amb: b.elem==='pradera' ? 'petal' : (night ? 'firefly' : 'cloud'),
          flowers: b.elem==='pradera', night};
}

/* ---------- utilidades ---------- */
const BT_BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function btBay(x, y){ return (BT_BAYER[(y&3)*4+(x&3)]+0.5)/16; }
function btRng(seed){ let s = seed>>>0; return ()=>{ s = (s + 0x6D2B79F5)>>>0; let t = s; t = Math.imul(t ^ t>>>15, t | 1); t ^= t + Math.imul(t ^ t>>>7, t | 61); return ((t ^ t>>>14)>>>0)/4294967296; }; }
function btHash(n){ const s = Math.sin(n*12.9898)*43758.5453; return s - Math.floor(s); }
function btEll(g, cx, cy, rx, ry, col){
  g.fillStyle = col;
  for(let y=-ry;y<=ry;y++){
    const w = Math.round(rx*Math.sqrt(Math.max(0, 1-(y*y)/(ry*ry))));
    g.fillRect(Math.round(cx-w), Math.round(cy+y), w*2, 1);
  }
}
const _btTint = new Map();
function btTint(spr, col){
  const k = col; let m = _btTint.get(spr);
  if(!m){ m = {}; _btTint.set(spr, m); }
  if(m[k]) return m[k];
  const c = document.createElement('canvas'); c.width = spr.width; c.height = spr.height;
  const g = c.getContext('2d');
  g.drawImage(spr, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  m[k] = c; return c;
}
/* dibuja un sprite anclado a los pies, a escala entera (sx/sy solo para golpes breves) */
function btSpr(img, x, y, sc, o){
  o = o||{};
  ctx.save();
  if(o.alpha!==undefined) ctx.globalAlpha = o.alpha;
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(sc*(o.sx||1)*(o.flip?-1:1), sc*(o.sy||1));
  ctx.drawImage(img, -Math.floor(img.width/2), -img.height);
  ctx.restore();
}
/* anillo de puntos (elipse achatada) */
function btRing(cx, cy, r, col, thick, rot){
  const n = Math.max(12, Math.round(r*1.6));
  ctx.fillStyle = col;
  for(let a=0;a<n;a++){
    if(thick===0 && a%2) continue;
    const ang = a/n*Math.PI*2 + (rot||0);
    const x = Math.round(cx+Math.cos(ang)*r), y = Math.round(cy+Math.sin(ang)*r*0.8);
    ctx.fillRect(x, y, thick>1?2:1, thick>1?2:1);
  }
}
/* compat v2 */
function battleRing(cx, cy, r, col){ btRing(cx, cy, r, col, 1); }

/* ---------- fondo cacheado por tema ---------- */
const _btBg = {};
function btBuildBg(th){
  if(_btBg[th.key]) return _btBg[th.key];
  const c = document.createElement('canvas'); c.width = 160; c.height = BT_AH;
  const g = c.getContext('2d');
  const R = btRng(th.key.length*977 + th.key.charCodeAt(0)*31);
  const P = (x,y,w,h,col)=>{ g.fillStyle = col; g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); };
  /* cielo: tres bandas con tramado ordenado */
  for(let y=0;y<BT_HZ;y++){
    const f = y/BT_HZ*2, seg = Math.min(1, Math.floor(f)), fr = f-seg;
    for(let x=0;x<160;x++) P(x, y, 1, 1, fr > btBay(x,y) ? th.sky[seg+1] : th.sky[seg]);
  }
  /* estrellas fijas en cielos oscuros */
  if(th.prop==='moon' || th.prop==='ruins' || th.night){
    for(let i=0;i<40;i++) P(R()*160, R()*(BT_HZ-20), 1, 1, R()<0.3 ? '#fff8d0' : 'rgba(220,230,255,0.7)');
  }
  /* atrezzo lejano */
  const far = th.far, mid = th.mid;
  if(th.prop==='tree'){
    for(let x=-6;x<170;x+=9+Math.floor(R()*6)){
      const r = 5+Math.floor(R()*5), cy = BT_HZ-8-Math.floor(R()*6);
      btEll(g, x, cy, r, r, far); P(x-1, cy, 2, BT_HZ-cy, far);
    }
    if(!th.night) for(let i=0;i<3;i++){ const cx = 20+i*55+R()*10; btEll(g, cx, 16+R()*20, 10, 3, 'rgba(255,255,255,0.18)'); }
  } else if(th.prop==='volcano'){
    for(let y=22;y<BT_HZ;y++){ const w = 8 + (y-22)*1.15; P(58-w, y, w*2, 1, far); }
    P(51, 20, 14, 3, '#f0a04b'); P(53, 18, 10, 2, '#ffd94a');
    for(let y=23;y<50;y+=2) P(56 + Math.round(Math.sin(y/3)*2), y, 2, 2, y<34 ? '#e8574c' : '#8a2e2a');
    btEll(g, 58, 12, 12, 6, 'rgba(90,40,40,0.5)'); btEll(g, 64, 6, 9, 4, 'rgba(90,40,40,0.35)');
  } else if(th.prop==='sea'){
    P(0, BT_HZ-16, 160, 16, far);
    for(let y=BT_HZ-15;y<BT_HZ;y+=3) for(let x=(y*7)%11;x<160;x+=13) P(x, y, 4, 1, 'rgba(190,235,250,0.45)');
    btEll(g, 34, BT_HZ-16, 14, 4, '#2a4a6a'); P(30, BT_HZ-26, 2, 8, '#2a4a3a'); btEll(g, 31, BT_HZ-27, 5, 2, '#2a5a3a');
    P(0, BT_HZ-17, 160, 1, 'rgba(255,255,255,0.35)');
  } else if(th.prop==='mesa'){
    const mesa = (x0, w, h, col)=>{ for(let y=0;y<h;y++){ const ins = y<3 ? 3-y : 0; P(x0+ins, BT_HZ-h+y, w-ins*2, 1, col); } };
    mesa(-4, 46, 30, far); mesa(96, 40, 22, far); mesa(126, 40, 36, mid); mesa(30, 28, 16, mid);
  } else if(th.prop==='moon'){
    btEll(g, 128, 22, 10, 10, '#fff4d0'); btEll(g, 124, 20, 3, 3, '#e8dcb0'); btEll(g, 132, 26, 2, 2, '#e8dcb0');
    for(let i=0;i<9;i++){ const x = 6+i*19+R()*8, h = 8+R()*16; for(let y=0;y<h;y++) P(x-Math.floor((h-y)/4)+Math.floor(h/4)-2, BT_HZ-y, 1+Math.floor(y/4), 1, i%2?far:mid); }
  } else if(th.prop==='shroom'){
    const sh = (x, h, r)=>{ P(x-2, BT_HZ-h, 4, h, mid); btEll(g, x, BT_HZ-h, r, Math.round(r*0.45), far); };
    sh(18, 44, 16); sh(78, 26, 10); sh(146, 50, 18); sh(112, 20, 7);
  } else if(th.prop==='storm'){
    for(let i=0;i<5;i++) btEll(g, i*40+R()*10, 10+R()*10, 26, 8, 'rgba(10,10,20,0.45)');
    for(const x of [22, 132]){ P(x, BT_HZ-40, 2, 40, far); P(x-8, BT_HZ-36, 18, 1, far); P(x-6, BT_HZ-28, 14, 1, far); }
    for(let x=0;x<160;x++) P(x, BT_HZ-34+Math.round(Math.sin(x/9)*2)+Math.round((x-22)*(x-132)/1400), 1, 1, 'rgba(0,0,0,0.5)');
  } else if(th.prop==='ruins'){
    for(const [x,h] of [[10,34],[24,22],[120,40],[146,28]]){ P(x, BT_HZ-h, 8, h, far); P(x-2, BT_HZ-h, 12, 3, far); }
    for(let a=0;a<=20;a++){ const an = Math.PI*a/20; P(120+4+Math.cos(an)*13+13, BT_HZ-40-Math.sin(an)*10, 3, 3, far); }
  }
  /* colinas intermedias */
  for(let x=0;x<160;x++){
    const h = 4 + Math.round(3*Math.sin(x/13+th.key.length) + 2*Math.sin(x/5.3));
    P(x, BT_HZ-h, 1, h, mid);
  }
  /* suelo en perspectiva: bandas que se ensanchan hacia la cámara */
  P(0, BT_HZ, 160, BT_AH-BT_HZ, th.g1);
  let i = 0;
  for(let y=BT_HZ+2; y<BT_AH; i++){
    const hgt = Math.max(1, Math.round(1 + i*1.4));
    if(i%2){
      P(0, y, 160, hgt, th.g2);
      for(let x=0;x<160;x++){ if(btBay(x,y-1)<0.5) P(x, y-1, 1, 1, th.g2); if(btBay(x,y+hgt)<0.5) P(x, y+hgt, 1, 1, th.g2); }
    }
    y += hgt + 1;
  }
  P(0, BT_HZ, 160, 1, th.rim);
  for(let x=0;x<160;x+=2) P(x+(x%4?1:0), BT_HZ+1, 1, 1, th.rim);
  /* detalles del suelo, más grandes cerca */
  for(let n=0;n<70;n++){
    const yy = BT_HZ+4 + Math.pow(R(), 0.7)*(BT_AH-BT_HZ-6), xx = R()*160;
    const s = 1 + Math.floor((yy-BT_HZ)/45);
    const d = th.g2, l = th.plat;
    if(th.prop==='tree'){
      if(th.flowers && R()<0.5){ P(xx, yy, s, s, ['#f2a2b8','#ffd94a','#ffffff','#e2574c'][n%4]); }
      else { P(xx, yy, 1, s+1, d); P(xx-s, yy+1, 1, s, d); P(xx+s, yy+1, 1, s, d); }
    } else if(th.prop==='volcano'){
      if(R()<0.35){ for(let k=0;k<3+s*2;k++) P(xx+k, yy+Math.round(Math.sin(k)*1), 1, 1, R()<0.5?'#e8574c':'#f0a04b'); }
      else P(xx, yy, s+1, s, d);
    } else if(th.prop==='sea'){
      if(R()<0.25){ P(xx, yy, s+1, 1, '#f2a2b8'); P(xx+1, yy-1, 1, 1, '#f6efe0'); } else P(xx, yy, s, 1, th.rim);
    } else if(th.prop==='moon'){
      if(R()<0.3){ P(xx, yy-s*2, 1, s*2, '#9a8ae8'); P(xx+1, yy-s, 1, s, '#c8bcf8'); } else P(xx, yy, s, 1, d);
    } else if(th.prop==='shroom'){
      if(R()<0.3){ P(xx, yy-s, 1, s, '#e8d8b8'); P(xx-1, yy-s-1, 3, 1, '#c9743a'); } else { P(xx, yy, 1, s+1, d); P(xx+1, yy+1, 1, s, d); }
    } else if(th.prop==='ruins'){
      if(R()<0.15){ P(xx, yy-s*3, s+1, s*3, '#3a2e48'); P(xx, yy-s*3, s+1, 1, '#5c4a6c'); } else P(xx, yy, s, 1, d);
    } else {
      P(xx, yy, s+1, s, d); P(xx, yy, s, 1, th.rim);
    }
  }
  _btBg[th.key] = c;
  return c;
}
/* marco en primer plano (cacheado) */
const _btFg = {};
function btBuildFg(th){
  if(_btFg[th.key]) return _btFg[th.key];
  const c = document.createElement('canvas'); c.width = 160; c.height = BT_AH;
  const g = c.getContext('2d');
  const R = btRng(th.key.length*131 + 7);
  const P = (x,y,w,h,col)=>{ g.fillStyle = col; g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); };
  const fg = th.fg;
  /* borde inferior: matas / piedras oscuras */
  for(let x=-4;x<164;x+=3){
    const edge = Math.min(x, 160-x);
    const h = 2 + Math.round(R()*3) + (edge<30 ? Math.round((30-edge)/3) : 0);
    if(th.prop==='tree' || th.prop==='shroom' || th.prop==='sea'){
      P(x, BT_AH-h, 1, h, fg); P(x+1, BT_AH-h+2, 1, h-2, fg);
    } else {
      btEll(g, x, BT_AH, 3, Math.max(1,h-1), fg);
    }
  }
  /* esquina superior derecha: rama, estalactita, farolillo... */
  if(th.prop==='tree' || th.prop==='shroom'){
    for(let i=0;i<22;i++){ const x = 136 + R()*28, y = R()*16; btEll(g, x, y, 3+Math.round(R()*2), 2+Math.round(R()*2), fg); }
    for(let i=0;i<5;i++){ const x = 134+i*6; P(x, 0, 1, 12+R()*14, fg); }
  } else if(th.prop==='mesa' || th.prop==='volcano' || th.prop==='storm'){
    for(let x=128;x<160;x++){ const h = 4 + Math.round((x-128)*0.35 + Math.sin(x)*2); P(x, 0, 1, h, fg); }
    P(141, 0, 3, 14, fg); P(142, 14, 1, 3, fg); P(151, 0, 2, 10, fg);
  } else if(th.prop==='ruins'){
    P(146, 0, 14, 30, fg); P(142, 0, 4, 20, fg); for(let y=4;y<26;y+=6) P(147, y, 12, 1, 'rgba(90,70,110,0.5)');
  }
  _btFg[th.key] = c;
  return c;
}

/* ---------- ambiente animado (a ritmo de dt, sin azar por frame) ---------- */
function btAmbient(b, th, t, dt){
  const A = th.amb;
  if(A==='cloud'){
    for(let i=0;i<3;i++){
      const x = ((t*0.004 + i*70) % 220) - 30, y = 12 + i*14;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(Math.round(x), y, 22, 4); ctx.fillRect(Math.round(x)+5, y-3, 12, 3);
    }
  } else if(A==='storm'){
    const cyc = Math.floor(t/3400), ph = t - cyc*3400;
    if(ph<160){
      const bx = 20 + btHash(cyc)*120;
      ctx.fillStyle = 'rgba(255,248,200,'+(ph<60?0.22:0.1)+')'; ctx.fillRect(0,0,160,BT_AH);
      let x = bx;
      for(let y=0;y<BT_HZ-10;y+=4){ x += (btHash(cyc*31+y)-0.5)*8; px(x, y, 1, 5, '#fff8d0'); }
    }
  } else if(A==='glint'){
    for(let i=0;i<6;i++){ if(Math.sin(t/400 + i*1.7) > 0.7) px(10+i*26 + (i*7)%9, BT_HZ-14+(i%3)*4, 2, 1, '#ffffff'); }
  } else if(A==='twinkle'){
    for(let i=0;i<14;i++){ const k = Math.sin(t/300 + i*2.3); if(k>0.6){ const x = (i*47)%156+2, y = (i*29)%(BT_HZ-24)+2; px(x-1,y,3,1,'#fff8d0'); px(x,y-1,1,3,'#fff8d0'); } }
    const cyc = Math.floor(t/5200), ph = t - cyc*5200;
    if(ph<500){ const sx = 150 - ph*0.22, sy = 8 + btHash(cyc)*20 + ph*0.08; for(let j=0;j<6;j++) px(sx+j*2, sy-j*0.7, 1, 1, 'rgba(255,248,208,'+(1-j/6).toFixed(2)+')'); }
  } else if(A==='fog'){
    ctx.fillStyle = 'rgba(120,90,150,0.12)';
    for(let i=0;i<4;i++){ const x = ((t*0.006*(i%2?1:-1) + i*60) % 240 + 240) % 240 - 60; ctx.fillRect(Math.round(x), BT_HZ-6+i*22, 70, 5); }
  }
  /* partículas ambientales con acumulador */
  const rate = {ember:70, spore:140, petal:220, dust:260, firefly:420}[A];
  if(b.quirk==='spore') b._sporeAcc = (b._sporeAcc||0) + dt;
  if(rate){
    b.ambAcc += dt;
    while(b.ambAcc > rate){
      b.ambAcc -= rate;
      const n = (b.ambN = (b.ambN||0)+1), r = btHash(n), r2 = btHash(n+0.5);
      if(A==='ember') b.amb.push({x:r*160, y:BT_AH, vx:(r2-0.5)*0.01, vy:-0.02-r2*0.02, life:3200, col:r2<0.5?'#f0a04b':'#e8574c', wob:r*6});
      else if(A==='spore') b.amb.push({x:r*160, y:BT_AH-r2*60, vx:0.003, vy:-0.01-r2*0.008, life:5000, col:'rgba(232,216,184,0.7)', wob:r*6});
      else if(A==='petal') b.amb.push({x:-4, y:10+r*120, vx:0.03+r2*0.02, vy:0.008, life:6000, col:r2<0.5?'#f2a2b8':'#ffffff', wob:r*6});
      else if(A==='dust') b.amb.push({x:r*160, y:BT_HZ+r2*100, vx:0.006, vy:-0.002, life:4000, col:'rgba(230,220,210,0.45)', wob:r*6});
      else if(A==='firefly') b.amb.push({x:r*160, y:BT_HZ+10+r2*90, vx:0.004, vy:-0.004, life:4000, col:'#e8f070', wob:r*6, blink:true});
    }
  }
  while(b._sporeAcc > 90){
    b._sporeAcc -= 90;
    const n = (b.ambN = (b.ambN||0)+1), r = btHash(n*3.1), r2 = btHash(n*7.7);
    b.amb.push({x:r*170, y:20+r2*70, vx:-0.008, vy:0.012, life:3000, col:'rgba(201,116,58,0.85)', wob:r*6});
  }
  for(let i=b.amb.length-1;i>=0;i--){
    const a = b.amb[i];
    a.x += a.vx*dt; a.y += a.vy*dt; a.life -= dt;
    if(a.life<=0 || a.y<-4 || a.x>166){ b.amb.splice(i,1); continue; }
    if(a.blink && Math.sin(t/200 + a.wob) < 0) continue;
    px(a.x + Math.sin(t/400 + a.wob)*1.5, a.y, 1, 1, a.col);
  }
}

/* ---------- pose de cada luchador en este instante ---------- */
function btPoses(b, t){
  const P = {x:BTG.PX, y:BTG.PY, sx:1, sy:1, white:false, alpha:1, ghosts:null, dark:false};
  const E = {x:BTG.EX, y:BTG.EY, sx:1, sy:1, white:false, alpha:1, ghosts:null, glow:0, gone:false, sc:1};
  const ph = b.phase, bt = b.t, clk = b.clock;
  const bob = Math.round(Math.sin(t/280));
  const lerp = (a, c, k)=>a+(c-a)*k;
  /* entrada */
  if(ph==='intro'){
    const ke = ease.outCubic(clamp01(bt/450)), kp = ease.outCubic(clamp01((bt-150)/450));
    E.x += Math.round((1-ke)*100); P.x -= Math.round((1-kp)*90);
    if(bt>560 && bt<760){ const v = Math.sin((bt-560)/200*Math.PI); E.y -= Math.round(v*6); E.sy = 1+v*0.1; }
  }
  if(ph==='timing' || ph==='intro'){ P.y += bob; }
  /* tu golpe: preparación, embestida, contacto, vuelta */
  if(ph==='panim'){
    const Cx = BTG.EX-28, Cy = BTG.EY+12;
    const wx = BTG.PX-7, wy = BTG.PY+1;
    if(bt<140){ const k = ease.outCubic(bt/140); P.x = lerp(BTG.PX, wx, k); P.y = lerp(BTG.PY, wy, k); P.sx = 1+0.18*k; P.sy = 1-0.16*k; }
    else if(bt<BTG.PIMP){
      const k = (bt-140)/(BTG.PIMP-140), e = k*k;
      P.x = lerp(wx, Cx, e); P.y = lerp(wy, Cy, e) - Math.sin(k*Math.PI)*10;
      P.sx = 1.22; P.sy = 0.84;
      P.ghosts = [[lerp(wx, Cx, e*0.55), lerp(wy, Cy, e*0.55)], [lerp(wx, Cx, e*0.25), lerp(wy, Cy, e*0.25)]];
    } else if(bt<380){ P.x = Cx - (bt-BTG.PIMP)*0.05; P.y = Cy; P.sx = 0.9; P.sy = 1.1; }
    else { const k = ease.outCubic(clamp01((bt-380)/(BTG.PEND-380))); P.x = lerp(Cx-4, BTG.PX, k); P.y = lerp(Cy, BTG.PY, k) - Math.sin(k*Math.PI)*8; }
  }
  /* súper: se carga, flota y descarga */
  if(ph==='superAnim'){
    const k = clamp01(bt/300);
    P.y -= Math.round(ease.outCubic(k)*6 + Math.sin(bt/60)*(bt<BTG.SIMP?1:0));
    if(bt>780 && bt<BTG.SIMP+80){ P.x += Math.round(Math.sin((bt-780)/300*Math.PI)*10); }
    if(bt>BTG.SIMP){ P.y = BTG.PY - Math.round(6*(1-clamp01((bt-BTG.SIMP)/300))); }
  }
  /* telegrafía rival: se echa atrás, tiembla y brilla */
  if(ph==='eTele'){
    const dur = teleDur(b), q = clamp01(bt/dur);
    const back = ease.outCubic(clamp01(bt/220));
    E.x += Math.round(6*back); E.y -= Math.round(2*back);
    const amp = Math.round(q*1.6 + (b.bigAtk?1:0));
    E.x += (Math.floor(bt/35)%2 ? amp : -amp);
    E.sx = 1+0.12*q; E.sy = 1-0.12*q;
    E.glow = 0.12 + 0.33*q*(Math.floor(bt/70)%2 ? 1 : 0.55);
  }
  /* embestida rival */
  if(ph==='eanim'){
    const hx = BTG.EX+6, hy = BTG.EY-2;
    const dodged = clk - b.dodgeAt < 700 && b.dodgeAt > -9999;
    const Cx = BTG.PX + (dodged ? 18 : 30), Cy = BTG.PY - (dodged ? 2 : 8);
    if(bt<BTG.IMP){
      const k = bt/BTG.IMP, e = k*k;
      E.x = lerp(hx, Cx, e); E.y = lerp(hy, Cy, e) - Math.sin(k*Math.PI)*8;
      E.sx = 1.25; E.sy = 0.82;
      E.ghosts = [[lerp(hx, Cx, e*0.5), lerp(hy, Cy, e*0.5)], [lerp(hx, Cx, e*0.2), lerp(hy, Cy, e*0.2)]];
    } else if(bt<BTG.IMP+90){ E.x = Cx + (b.parry ? (bt-BTG.IMP)*0.25 : 0); E.y = Cy; E.sx = 0.88; E.sy = 1.12; }
    else {
      const k = ease.outCubic(clamp01((bt-BTG.IMP-90)/(BTG.EEND-BTG.IMP-90)));
      const sx0 = Cx + (b.parry ? 22 : 0);
      E.x = lerp(sx0, BTG.EX, k); E.y = lerp(Cy, BTG.EY, k) - Math.sin(k*Math.PI)*10;
    }
  }
  /* esquiva: salto lateral visible */
  const da = clk - b.dodgeAt;
  if(da>=0 && da<460 && (ph==='eTele' || ph==='eanim')){
    const env = da<110 ? ease.outCubic(da/110) : (da<300 ? 1 : 1-ease.inOutSine((da-300)/160));
    P.ghosts = da<200 ? [[BTG.PX, BTG.PY]] : null;
    P.x -= Math.round(20*env); P.y += Math.round(3*env) - Math.round(Math.sin(env*Math.PI)*4);
    if(da<110){ P.sx = 1.2; P.sy = 0.85; }
  }
  /* reacción a golpes: retroceso, destello blanco, rebote */
  const ea = clk - b.eHitAt;
  if(ea>=0 && ea<600){
    const kb = b.eKb*Math.exp(-ea/110);
    E.x += Math.round(kb); E.y -= Math.round(kb*0.3);
    const v = 0.28*Math.exp(-ea/130)*Math.cos(ea/34);
    E.sx *= 1+v; E.sy *= 1-v;
    if(ea<70 || (b.ko && ea<260)) E.white = true;
  }
  const pa = clk - b.pHitAt;
  if(pa>=0 && pa<600){
    const kb = (b.pKb||0)*Math.exp(-pa/110);
    P.x -= Math.round(kb); P.y += Math.round(kb*0.3);
    const v = 0.24*Math.exp(-pa/130)*Math.cos(pa/34);
    P.sx *= 1+v; P.sy *= 1-v;
    if(pa<70) P.white = true;
  }
  const va = clk - b.evadeAt;
  if(va>=0 && va<320){ E.alpha = Math.floor(va/40)%2 ? 0.25 : 0.6; E.x += Math.round(10*Math.sin(va/320*Math.PI)); }
  /* final */
  if(ph==='end'){
    if(b.win){
      if(b.friendly){ E.sy = 1 - clamp01(bt/400)*0.3; E.dark = true; }
      else if(b.boss){ E.alpha = Math.max(0, 1-bt/900); E.white = Math.floor(bt/80)%2===0; E.y += Math.round(bt*0.01); }
      else {
        /* sale volando hasta ser una estrellita */
        const k = clamp01(bt/650);
        E.x += Math.round(k*40); E.y -= Math.round(k*84 - Math.sin(k*Math.PI)*4);
        E.sc = 1 - k*0.5; E.white = Math.floor(bt/60)%2===0 && k<1; E.gone = k>=1;
      }
      if(bt>300){ P.y -= Math.round(Math.abs(Math.sin((bt-300)/170))*6); }
    } else if(b.fled){
      P.x -= Math.round(bt*0.16); P.y -= Math.round(Math.abs(Math.sin(bt/70))*3); P.sx = -1;
      E.y -= Math.round(Math.abs(Math.sin(bt/130))*4);
      if(bt>700){ E.x += Math.round((bt-700)*0.2); }
    } else {
      const k = clamp01(bt/420);
      P.sy = 1 - k*0.45; P.sx = 1 + k*0.25; P.dark = k>0.5;
      E.y -= Math.round(Math.abs(Math.sin(bt/130))*5);
      if(bt>700 && !b.friendly){ E.x += Math.round((bt-700)*0.2); }
    }
  }
  if(ph==='panim' && b.ko && bt>BTG.PIMP){ E.white = Math.floor(bt/50)%2===0; }
  return {P, E};
}

/* ---------- placas de vida ---------- */
function btBar(x, y, w, h, hp, show, mx, t){
  const pct = clamp01(hp/mx), pS = clamp01(show/mx);
  px(x-1, y-1, w+2, h+2, K);
  px(x, y, w, h, '#2a2440');
  if(pS>pct) px(x, y, Math.round(w*pS), h, '#fff3c0');
  let col = pct>0.5 ? '#7ac74f' : (pct>0.25 ? '#ffd94a' : '#e2574c');
  let hi = pct>0.5 ? '#b8f08a' : (pct>0.25 ? '#fff3a0' : '#ff9a90');
  if(pct<=0.25 && Math.floor(t/180)%2===0){ col = '#a02a2a'; hi = '#e2574c'; }
  const fw = Math.round(w*pct);
  if(fw>0){ px(x, y, fw, h, col); px(x, y, fw, 1, hi); }
}
function btPlate(x, y, w, h){
  px(x+1, y+h, w, 1, 'rgba(0,0,0,0.35)');
  px(x, y, w, h, K);
  px(x+1, y+1, w-2, h-2, '#1c2040');
  px(x+1, y+1, w-2, 1, '#3a4478');
}
function btElemIcon(x, y, el){
  const c = ELEM_COLS[el]||'#c8c0b0';
  px(x+1, y, 3, 5, K); px(x, y+1, 5, 3, K);
  px(x+1, y+1, 3, 3, c); px(x+2, y, 1, 1, c); px(x+2, y+4, 1, 1, c); px(x, y+2, 1, 1, c); px(x+4, y+2, 1, 1, c);
  px(x+1, y+1, 1, 1, '#ffffff');
}
const BT_QUIRK = {thorns:'PINCHOS', burn:'QUEMA', bubble:'BURBUJA', evade:'SE ESFUMA', armor:'CORAZA', double:'DOBLE', steal:'LADRON', regen:'REGENERA', fly:'VUELA', paralyze:'PARALIZA', charge:'CARGA', spore:'ESPORAS'};

function btArrow(x, y, up, col){
  if(up){ px(x+2,y,1,1,col); px(x+1,y+1,3,1,col); px(x,y+2,5,1,col); }
  else { px(x,y,5,1,col); px(x+1,y+1,3,1,col); px(x+2,y+2,1,1,col); }
}

/* ---------- el dibujo ---------- */
function drawBattle(t, dt){
  battleStep(dt);
  const b = UI.bt; if(!b) return;
  btEnsure(b);
  const p = AP();
  const th = btTheme(b);
  const pd = currentFormDef();
  const pspr = SPR[pd.spr][Math.floor(t/2600)%14===0 && b.phase!=='end' ? 1 : 0] || SPR[pd.spr][0];
  /* segundo fotograma de vez en cuando: el rival respira, parpadea, olfatea */
  const espr = (!b.fspr && ESPR[b.kind+'_b'] && (t%2200)<220) ? ESPR[b.kind+'_b'] : btESpr(b);
  const esc = btEScale(b);
  const {P, E} = btPoses(b, t);
  const ec = btECenter(b), pc = btPCenter();
  const clk = b.clock;
  const sup = b.phase==='superAnim';
  const S = superOf(p);
  const tti = btTTI(b);

  ctx.save();
  /* golpe de cámara en el crítico */
  if(b.zoomT>0){
    const z = 1 + 0.06*clamp01(b.zoomT/170);
    ctx.translate(ec.x, ec.y); ctx.scale(z, z); ctx.translate(-ec.x, -ec.y);
  }
  ctx.beginPath(); ctx.rect(0, 0, 160, BT_AH); ctx.clip();

  /* ----- escenario ----- */
  ctx.drawImage(btBuildBg(th), 0, 0);
  btAmbient(b, th, t, dt);

  /* aviso de carga / furia: el cielo se tiñe */
  if(b.phase==='eTele' && (b.bigAtk || b.rageNow)){
    ctx.fillStyle = 'rgba(226,60,50,'+(b.bigAtk ? 0.1 + 0.08*Math.sin(t/60) : 0.07).toFixed(3)+')';
    ctx.fillRect(0, 0, 160, BT_AH);
  }

  /* plataformas */
  const erx = b.boss ? 40 : 30;
  btEll(ctx, BTG.EX, BTG.EY+2, erx, 7, th.platD);
  btEll(ctx, BTG.EX, BTG.EY+1, erx-1, 6, th.plat);
  btEll(ctx, BTG.EX, BTG.EY+1, erx-6, 3, 'rgba(255,255,255,0.12)');
  btEll(ctx, BTG.PX, BTG.PY+3, 36, 9, th.platD);
  btEll(ctx, BTG.PX, BTG.PY+2, 35, 8, th.plat);
  btEll(ctx, BTG.PX, BTG.PY+2, 29, 4, 'rgba(255,255,255,0.12)');

  /* súper: la escena se apaga salvo los luchadores */
  let dark = 0;
  if(sup) dark = b.t<BTG.SIMP ? 0.62*clamp01(b.t/220) : 0.62*(1-clamp01((b.t-BTG.SIMP)/320));
  if(dark>0){ ctx.fillStyle = 'rgba(8,6,20,'+dark.toFixed(3)+')'; ctx.fillRect(0, 0, 160, BT_AH); }

  /* sombras en el suelo */
  const shw = (x, y, w, lift)=>{ const k = clamp01(1 - lift/40); btEll(ctx, x, y, Math.max(3, Math.round(w*k)), 2, 'rgba(0,0,0,0.3)'); };
  if(!E.gone && E.alpha>0.3) shw(E.x, BTG.EY+1, Math.round(espr.width*esc*0.42), BTG.EY-E.y);
  shw(P.x, Math.max(P.y, BTG.PY)+1, 14, Math.max(0, BTG.PY-P.y));

  /* ----- rival ----- */
  if(!E.gone){
    const eimg = E.white ? silhouette(espr) : (E.dark ? darkSilhouette(espr) : espr);
    if(E.ghosts) E.ghosts.forEach((g, i)=> btSpr(btTint(espr, '#ff8070'), g[0], g[1], esc, {flip:true, alpha:0.28-i*0.1}));
    const escK = E.sc<1 ? Math.max(0.5, E.sc) : 1;
    /* luz de contorno en escenarios oscuros: el rival nunca se funde con el fondo */
    if(th.rim && (th.prop==='moon' || th.prop==='ruins' || th.prop==='storm' || th.night) && !E.white){
      const rim = btTint(espr, '#d8d0ff');
      for(const d of [-1, 1]) btSpr(rim, E.x+d, E.y, esc*escK, {flip:true, sx:E.sx, sy:E.sy, alpha:0.4*E.alpha});
      btSpr(rim, E.x, E.y-1, esc*escK, {flip:true, sx:E.sx, sy:E.sy, alpha:0.4*E.alpha});
    }
    btSpr(eimg, E.x, E.y, esc*escK, {flip:true, sx:E.sx, sy:E.sy, alpha:E.alpha});
    if(E.glow>0) btSpr(btTint(espr, '#ff4a3a'), E.x, E.y, esc, {flip:true, sx:E.sx, sy:E.sy, alpha:E.glow});
    if(b.bubble && b.phase!=='end'){
      const r = Math.round(Math.max(espr.width, espr.height)*esc/2) + 4;
      btRing(E.x, E.y - Math.round(espr.height*esc/2), r + Math.round(Math.sin(t/300)), 'rgba(154,220,240,0.7)', 1, t/2000);
      px(E.x - r/2, E.y - espr.height*esc/2 - r*0.55, 3, 2, 'rgba(255,255,255,0.8)');
    }
    const ha = clk - b.healAt;
    if(ha>=0 && ha<300) btSpr(btTint(espr, '#7ac74f'), E.x, E.y, esc, {flip:true, alpha:0.5*(1-ha/300)});
  }
  /* estrellita del K.O. */
  if(b.phase==='end' && b.win && !b.boss && !b.friendly && b.t>650 && b.t<1300){
    const k = (b.t-650)/650, sx = BTG.EX+40, sy = BTG.EY-84;
    if(Math.floor(b.t/70)%2===0){ const r = k<0.5 ? 3 : 2; px(sx-r, sy, r*2+1, 1, '#ffffff'); px(sx, sy-r, 1, r*2+1, '#ffffff'); px(sx, sy, 1, 1, '#ffd94a'); }
  }

  /* ----- tu bitxo ----- */
  const pimg = P.white ? silhouette(pspr) : (P.dark ? darkSilhouette(pspr) : pspr);
  if(P.ghosts) P.ghosts.forEach((g, i)=> btSpr(btTint(pspr, sup ? S.col : '#bff0ff'), g[0], g[1], 2, {alpha:0.35-i*0.12}));
  btSpr(pimg, P.x, P.y, 2, {sx:P.sx, sy:P.sy});
  if(p.hat && !P.white){
    ctx.save(); ctx.translate(Math.round(P.x), Math.round(P.y)); ctx.scale(2*(P.sx||1), 2*(P.sy||1));
    drawPetHat(p, pspr, -Math.floor(pspr.width/2), -pspr.height, false);
    ctx.restore();
  }
  if(sup && b.t<BTG.SIMP){
    const a = 0.25 + 0.35*(Math.floor(b.t/60)%2);
    btSpr(btTint(pspr, S.col2), P.x, P.y, 2, {sx:P.sx, sy:P.sy, alpha:a});
  }
  if(b.burnT>0 && b.phase!=='end' && Math.floor(t/150)%2===0) px(P.x-8+Math.floor(t/150)%16, P.y-20, 2, 2, '#f0a04b');
  if(b.paraT && b.phase!=='end' && Math.floor(t/200)%2===0){ px(P.x+10, P.y-30, 1, 3, '#f0c030'); px(P.x+11, P.y-28, 1, 3, '#f0c030'); }

  /* ----- escudo / parada ----- */
  const ba = clk - b.blockAt;
  if(b.blocked && (b.phase==='eTele' || b.phase==='eanim') && (!b.resolved || ba<280)){
    const hit = b.resolved && ba<200;
    const col = b.parry ? (hit ? '#ffffff' : '#ffd94a') : (hit ? '#ffffff' : '#5ec8d8');
    const raise = ease.outBack(clamp01(ba/120));
    for(let a=-5;a<=5;a++){
      const an = a*0.16, r = 18 + (hit ? 2 : 0);
      const x = Math.round(pc.x + 4 + Math.cos(an)*r*raise), y = Math.round(P.y - 16 + Math.sin(an)*r);
      px(x, y, 2, 2, col);
    }
    if(b.parry && Math.floor(t/60)%2===0) px(pc.x+22, P.y-30, 1, 1, '#ffffff');
  }

  /* ----- aro de defensa: se cierra sobre ti al ritmo del golpe ----- */
  if((b.phase==='eTele' || b.phase==='eanim') && !b.resolved && tti>=-30 && !b.blocked && !b.dodge){
    const r = 17 + Math.max(0, tti)*0.055;
    const inParry = tti<=BTG.PARRY, inBlock = tti<=BTG.BLOCK;
    const col = inParry ? '#ffd94a' : (inBlock ? '#5ec8d8' : 'rgba(255,255,255,0.55)');
    btRing(pc.x, pc.y, 17, 'rgba(255,217,74,0.35)', 0);
    btRing(pc.x, pc.y, r, col, inParry ? 2 : 1, -t/900);
    if(inParry) btRing(pc.x, pc.y, r+2, 'rgba(255,217,74,0.35)', 1);
  }
  /* "!" sobre el rival */
  if(b.phase==='eTele'){
    const hy = E.y - espr.height*esc - 14 - Math.round(Math.abs(Math.sin(b.t/110))*3);
    const txt = b.bigAtk ? '!!' : '!';
    const w = txt.length*8+3;
    px(E.x-Math.ceil(w/2)-1, hy-2, w+2, 14, K);
    px(E.x-Math.ceil(w/2), hy-1, w, 12, b.bigAtk||b.rageNow ? '#e2574c' : '#fff8d0');
    px(E.x-1, hy+12, 3, 2, K);
    drawTextS(txt, E.x-Math.ceil(w/2)+2, hy+1, b.bigAtk||b.rageNow ? '#fff8d0' : '#e2574c', 2);
  }

  /* ----- aro de ataque: toca cuando abrace al rival ----- */
  if(b.phase==='timing'){
    const rdist = Math.abs(b.mk-0.5)*2;
    const er = Math.round(Math.max(espr.width, espr.height)*esc/2) + 3;
    const rr = er + rdist*30;
    const col = rdist<0.18 ? '#ffd94a' : (rdist<0.35 ? '#fff8d0' : 'rgba(255,255,255,0.55)');
    btRing(ec.x, ec.y, er, 'rgba(255,217,74,0.4)', 0);
    btRing(ec.x, ec.y, rr, col, rdist<0.18 ? 2 : 1, t/700);
    if(rdist<0.18){ btRing(ec.x, ec.y, rr+2.5, 'rgba(255,217,74,0.45)', 1, -t/700); }
    /* combo: el contador crece en cada eslabón */
    if(b.combo>0){
      const ca = clk - b.comboAt, pop = ca<160 ? 3 : 2;
      drawTextO('X'+(b.combo+1), ec.x + er + 6, ec.y - 18 - (ca<160 ? 2 : 0), b.combo>1 ? '#f0a04b' : '#ffd94a', pop);
    }
  }

  /* ----- partículas de la escena ----- */
  for(const f of b.fx){
    const k = f.life0 ? f.life/f.life0 : 1;
    ctx.globalAlpha = Math.min(1, k*2.2);
    const x = Math.round(f.x), y = Math.round(f.y);
    if(f.kind==='spark'){
      const sp = Math.hypot(f.vx, f.vy)||1, len = Math.min(6, sp*40);
      ctx.fillStyle = f.col;
      for(let j=0;j<=len;j++) ctx.fillRect(Math.round(f.x - f.vx/sp*j), Math.round(f.y - f.vy/sp*j), 1, 1);
    } else if(f.kind==='star'){
      const r = k>0.5 ? 2 : 1; px(x-r, y, r*2+1, 1, f.col); px(x, y-r, 1, r*2+1, f.col);
    } else if(f.kind==='ring'){
      btRing(f.x, f.y, ease.outCubic(1-k)*f.r1 + 2, f.col, 1);
    } else if(f.kind==='rock'){
      btEll(ctx, x, y, 6, 5, K); btEll(ctx, x, y, 5, 4, f.col); btEll(ctx, x-1, y-1, 3, 2, '#b8b8c4'); px(x+2, y+1, 2, 1, '#5a5a66');
    } else if(f.kind==='bolt'){
      let bx = f.x;
      for(let yy=0; yy<f.y; yy+=5){ bx += (btHash(f.seed*13+yy)-0.5)*7; px(bx-1, yy, 3, 6, K); px(bx, yy, 1, 6, yy%10 ? f.col : '#ffffff'); }
    } else if(f.kind==='leaf'){
      px(x, y, 2, 1, f.col); px(x+1, y-1, 1, 1, '#ffffff');
    } else if(f.kind==='mota'){
      /* motas del botín: primero saltan y luego vuelan al contador */
      continue;
    } else {
      ctx.fillStyle = f.col; ctx.fillRect(x, y, f.size||1, f.size||1);
    }
  }
  ctx.globalAlpha = 1;

  /* primer plano */
  ctx.drawImage(btBuildFg(th), 0, 0);

  /* marco de impacto: K.O. y súper (mientras dura el hitstop) */
  const ia = clk - b.eHitAt;
  if(ia===0 && (b.ko || (sup && b.resolved))){
    ctx.fillStyle = 'rgba(10,8,24,0.85)'; ctx.fillRect(0, 0, 160, BT_AH);
    btSpr(silhouette(espr), E.x, E.y, esc, {flip:true, sx:E.sx, sy:E.sy});
    btSpr(silhouette(pspr), P.x, P.y, 2, {sx:P.sx, sy:P.sy});
  }
  /* líneas de impacto radiales */
  if(ia>=0 && ia<110 && (b.crit || b.ko)){
    ctx.fillStyle = ia===0 ? '#ffffff' : 'rgba(255,255,255,0.6)';
    for(let i=0;i<14;i++){
      const an = i/14*Math.PI*2 + 0.2;
      for(let r=34; r<90; r+=3) ctx.fillRect(Math.round(ec.x+Math.cos(an)*r), Math.round(ec.y+Math.sin(an)*r*0.85), 1, 1);
    }
  }
  ctx.restore(); /* fin cámara/clip */

  /* ----- cinemática del súper: franja con retrato ----- */
  if(sup && b.t>120 && b.t<660){
    const kin = ease.outCubic(clamp01((b.t-120)/160)), kout = clamp01((b.t-560)/100);
    const bx = Math.round(-160*(1-kin) + 160*kout);
    const by = 58;
    ctx.save();
    ctx.translate(bx, 0);
    px(0, by-1, 160, 34, K);
    px(0, by, 160, 32, S.col);
    for(let i=0;i<12;i++){ const lx = ((i*29 + Math.floor(b.t*0.5)) % 190) - 20; px(lx, by+3+(i*7)%26, 18, 1, S.col2); }
    px(0, by, 160, 1, '#ffffff'); px(0, by+31, 160, 1, 'rgba(0,0,0,0.4)');
    ctx.beginPath(); ctx.rect(0, by, 160, 32); ctx.clip();
    btSpr(pspr, 28, by+46, 3);
    ctx.restore();
    drawTextO('¡SUPER!', bx+62, by+5, '#ffffff', 2);
    drawTextO(S.name, bx+62, by+21, S.col2, 1);
  }

  /* ----- sellos: ¡CRÍTICO!, ¡PARADA!, ¡K.O.!... ----- */
  for(const s of b.stamps){
    const a = clk - s.at;
    const sc = a<70 ? s.sc+1 : s.sc;
    const k = a/1000;
    ctx.globalAlpha = k>0.75 ? Math.max(0, (1-k)/0.25) : 1;
    const jx = a<120 ? (Math.floor(a/30)%2 ? 1 : -1) : 0;
    const w = textWS(s.s, sc);
    const x = Math.max(1, Math.min(159-w, Math.round(s.x - w/2))) + jx;
    drawTextO(s.s, x, Math.round(s.y - Math.min(6, a*0.01)), s.col, sc);
  }
  ctx.globalAlpha = 1;

  /* ----- placas ----- */
  const plateIn = b.phase==='intro' ? ease.outCubic(clamp01((b.t-350)/350)) : 1;
  const plateOut = b.phase==='end' ? clamp01(b.t/300) : 0;
  /* rival (arriba a la izquierda) */
  {
    const x = Math.round(4 - (1-plateIn)*100 - plateOut*100), y = 5, w = 88, h = 27;
    btPlate(x, y, w, h);
    btElemIcon(x+4, y+4, b.elem);
    drawText(b.name.slice(0, 11), x+12, y+4, '#ffffff');
    drawText('N'+b.nv, x+w-4-textW('N'+b.nv), y+4, b.elite ? '#ffd94a' : '#b8bccc');
    const ha = clk - b.eHitAt;
    const jig = ha>=0 && ha<120 ? (Math.floor(ha/30)%2 ? 1 : -1) : 0;
    btBar(x+4+jig, y+12, w-8, 4, b.ehp, b.ehpShow, b.emx, t);
    const q = BT_QUIRK[b.quirk];
    if(q) drawText(q, x+4, y+19, 'rgba(232,224,200,0.55)');
    if(b.mult>1){ btArrow(x+w-40, y+19, true, '#a8f07a'); drawText('VENT', x+w-33, y+19, '#a8f07a'); }
    else if(b.mult<1){ btArrow(x+w-40, y+19, false, '#e2574c'); drawText('RESI', x+w-33, y+19, '#e2574c'); }
    /* chapitas: JEFE / ELITE / REVANCHA */
    const tag = b.boss ? ['JEFE', '#e2574c'] : (b.elite ? ['★ELITE', '#ffd94a'] : (b.revenge ? ['REVANCHA', '#8a6ae8'] : (b.friendly ? ['DUELO', '#f2a2b8'] : null)));
    if(tag){
      const tw = textW(tag[0]) + 6;
      px(x+w-tw-2, y+h-1, tw, 8, K); px(x+w-tw-1, y+h, tw-2, 6, tag[1]);
      drawText(tag[0], x+w-tw+2, y+h+1, K);
    }
  }
  /* tú (a la derecha, sobre el panel) */
  {
    const x = Math.round(70 + (1-plateIn)*100 + plateOut*100), y = 150, w = 86, h = 30;
    btPlate(x, y, w, h);
    btElemIcon(x+4, y+4, playerElem(p));
    drawText((p.nick||pd.name).slice(0, 10), x+12, y+4, '#ffffff');
    drawText('NV'+p.level, x+w-4-textW('NV'+p.level), y+4, '#b8bccc');
    const ha = clk - b.pHitAt;
    const jig = ha>=0 && ha<120 ? (Math.floor(ha/30)%2 ? 1 : -1) : 0;
    btBar(x+4+jig, y+12, w-8, 4, b.php, b.phpShow, b.pmx, t);
    drawText(Math.ceil(b.php)+'/'+b.pmx, x+4, y+20, b.php/b.pmx<=0.25 ? '#ff9a90' : '#e8e0c8');
    let sx = x+w-6;
    if(b.burnT>0){ sx -= 18; px(sx-1, y+19, 19, 7, '#f0a04b'); drawText('QUE', sx+1, y+20, K); }
    if(b.paraT){ sx -= 18; px(sx-1, y+19, 19, 7, '#f0c030'); drawText('PAR', sx+1, y+20, K); }
  }

  /* ----- panel de mando ----- */
  btDrawPanel(b, p, t, S, tti);

  /* ----- entrada: franjas de cine ----- */
  if(b.phase==='intro'){
    const k = ease.inCubic(clamp01((b.t-850)/300));
    const h = Math.round(16*(1-k));
    if(h>0){ px(0, 0, 160, h, K); }
  }
  /* ----- tarjeta de resultado ----- */
  if(b.phase==='end') btDrawResult(b, p, t);
}

/* ---------- panel inferior: instrucciones + botones ---------- */
function btDrawPanel(b, p, t, S, tti){
  const Y = BT_AH;
  px(0, Y, 160, 272-Y, '#161a2c');
  px(0, Y, 160, 1, K); px(0, Y+1, 160, 1, '#2e3456');
  px(0, 240, 160, 32, '#11142a'); px(0, 240, 160, 1, '#232848');
  const ph = b.phase;
  const blink = Math.floor(t/140)%2===0;
  if(ph==='intro'){
    const kx = ease.outBack(clamp01((b.t-100)/450));
    const cx = Math.round(80 + (1-kx)*160);
    const sub = b.friendly ? 'DUELO AMISTOSO' : (b.boss ? '¡¡EL JEFE!!' : (b.elite ? '★ ELITE SALVAJE ★' : (b.revenge ? 'REVANCHA' : 'SALVAJE APARECE')));
    drawTextOC(b.name, cx, 204, b.boss ? '#e2574c' : '#ffffff', 2);
    drawTextOC(sub, cx, 222, b.boss ? '#ffd94a' : 'rgba(232,224,200,0.7)', 1);
    if(b.t>500) drawTextC('TOCA PARA EMPEZAR', 80, 252, blink ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)');
    return;
  }
  if(ph==='end'){
    if(b.t>800){
      drawTextOC('TOCA PARA SEGUIR', 80, 222, Math.floor(t/400)%2===0 ? '#ffffff' : 'rgba(255,255,255,0.5)', 1);
      drawTextC('ESPACIO / ENTER', 80, 236, 'rgba(255,255,255,0.25)');
    }
    return;
  }
  /* zona de mensajes */
  if((ph==='timing' || ph==='panim') && !b.ko){
    const full = b.super>=b.superMax;
    if(full && ph==='timing'){
      /* botón de súper: o lo desatas, o sigues a golpes */
      const x = 14, y = 198, w = 132, h = 32;
      const pulse = Math.floor(t/220)%2===0;
      px(x-1, y-1, w+2, h+2, K);
      px(x, y, w, h, pulse ? '#ffd94a' : '#f0c030');
      px(x, y, w, 2, '#fff3c0'); px(x, y+h-2, w, 2, '#c9a227');
      const sh = ((t*0.12) % 220) - 30;
      for(let i=0;i<6;i++){ const lx = Math.round(x + sh + i - (i*0)), ly = y+2; if(lx>x && lx<x+w-8) px(lx, ly, 3, h-4, 'rgba(255,255,255,0.45)'); }
      drawTextOC('★ SUPER ★', 80, y+5, '#ffffff', 2, '#8a5a10');
      drawTextC(S.name, 80, y+21, '#5a3a08');
      drawTextC('O TOCA AL RIVAL: GOLPE NORMAL', 80, 233, 'rgba(255,255,255,0.35)');
    } else if(b.combo>0){
      const ca = b.clock - b.comboAt;
      drawTextOC('¡COMBO X'+(b.combo+1)+'!', 80, 197 - (ca<120 ? 1 : 0), b.combo>1 ? '#f0a04b' : '#ffd94a', 2);
      drawTextC('¿SIGUES? FALLAR LO ENFURECE', 80, 212, 'rgba(255,255,255,0.6)');
      const left = 1 - clamp01(b.comboIdle/BTG.IDLE);
      px(30, 222, 100, 4, K); px(31, 223, Math.round(98*left), 2, '#5ec8d8');
      drawTextC('O ESPERA Y TE PLANTAS', 80, 229, 'rgba(94,200,216,0.6)');
    } else {
      drawTextOC('¡TOCA CUANDO EL ARO', 80, 198, '#ffd94a', 1);
      drawTextOC('ABRACE AL RIVAL!', 80, 207, '#ffd94a', 1);
      if(b.mult>1) drawTextC('VENTAJA DE ELEMENTO: +30%', 80, 222, '#a8f07a');
      else if(b.mult<1) drawTextC('TE RESISTE: DAÑO -25%', 80, 222, '#ff8a80');
      else drawTextC('ARO DORADO: CRITICO', 80, 222, 'rgba(255,255,255,0.4)');
      drawTextC('ESPACIO: GOLPE', 80, 231, 'rgba(255,255,255,0.18)');
    }
  } else if(ph==='panim' && b.ko){
    /* K.O.: silencio en el panel, que hable la escena */
  } else if(ph==='eTele' || ph==='eanim'){
    const hot = tti<=BTG.BLOCK && !b.resolved;
    drawTextOC(b.bigAtk ? '¡ATAQUE CARGADO!' : '¡DEFIENDE!', 80, 197, b.bigAtk||b.rageNow ? '#e2574c' : '#ffffff', 2);
    let msg, col;
    if(b.parry){ msg = '¡PARADA PERFECTA!'; col = '#ffd94a'; }
    else if(b.blocked){ msg = 'ESCUDO ARRIBA'; col = '#5ec8d8'; }
    else if(b.dodge){ msg = '¡SALTO!'; col = '#5ec8d8'; }
    else if(hot){ msg = tti<=BTG.PARRY ? '¡¡TOCA YA!!' : '¡PREPARATE...!'; col = blink ? '#ffd94a' : '#5ec8d8'; }
    else { msg = 'TOCA CUANDO EL ARO TE CIERRE'; col = 'rgba(255,255,255,0.7)'; }
    drawTextOC(msg, 80, 213, col, 1);
    drawTextC('DORADO: PARADA · DESLIZA: ESQUIVA', 80, 225, 'rgba(94,200,216,0.55)');
  } else if(ph==='superAnim'){
    drawTextOC('¡'+S.name+'!', 80, 206, S.col2, 1);
  }
  /* fila de botones: mochila · súper · huir */
  const items = G.items||[];
  for(let i=0;i<3;i++){
    const ix = 4+i*18, iy = 246;
    px(ix, iy, 16, 16, K);
    px(ix+1, iy+1, 14, 14, items[i] ? '#262a44' : '#181b30');
    if(items[i]) px(ix+1, iy+1, 14, 1, '#3a4070');
    if(items[i]==='pocion'){ px(ix+6,iy+3,4,3,'#f6efe0'); px(ix+5,iy+6,6,7,'#e2574c'); px(ix+6,iy+7,2,2,'#ff9a90'); }
    else if(items[i]){ px(ix+8,iy+2,2,6,'#ffd94a'); px(ix+5,iy+7,4,2,'#ffd94a'); px(ix+7,iy+9,2,5,'#ffd94a'); }
    if(items[i]) drawText(''+(i+1), ix+11, iy+10, 'rgba(255,255,255,0.35)');
  }
  /* medidor de súper */
  {
    const full = b.super>=b.superMax;
    drawTextC('SUPER', 86, 246, full ? (blink ? '#ffd94a' : '#fff3c0') : 'rgba(255,255,255,0.5)');
    for(let i=0;i<b.superMax;i++){
      const x = 63+i*12, y = 254;
      const on = b.super>i;
      px(x, y, 10, 7, K);
      px(x+1, y+1, 8, 5, on ? (full && blink ? '#fff3c0' : '#ffd94a') : '#262a44');
      if(on) px(x+1, y+1, 8, 1, '#ffffff');
    }
    if(full) drawText('S', 111, 255, 'rgba(255,255,255,0.3)');
  }
  /* huir */
  {
    const armed = performance.now() - b.fleeArm < 1800;
    const can = ph==='timing';
    const x = 116, y = 246, w = 40, h = 16;
    px(x, y, w, h, K);
    px(x+1, y+1, w-2, h-2, armed ? (blink ? '#e2574c' : '#a8322a') : (can ? '#2e2436' : '#1a1a2a'));
    px(x+1, y+1, w-2, 1, armed ? '#ff9a90' : '#44385a');
    const lbl = armed ? '¿SEGURO?' : 'HUIR';
    drawTextC(lbl, x+w/2, y+6, can ? '#ffffff' : 'rgba(255,255,255,0.3)');
    if(armed){
      const cost = b.friendly ? 'SIN COSTE' : (b.tower ? 'ADIOS TORRE' : (b.revenge ? 'SIN COSTE' : '-2% ✦'));
      drawTextC(cost, x+w/2, y-7, '#ff9a90');
    }
  }
}

/* ---------- tarjeta de resultado ---------- */
function btDrawResult(b, p, t){
  if(b.t<420) return;
  const kin = ease.outBack(clamp01((b.t-420)/360));
  const x = 14, w = 132;
  const n = (b.loot||[]).length;
  const tip = !b.win && !b.fled && !b.friendly ? btLoseTip(b) : null;
  const h = 26 + n*11 + (tip ? 16 : 0) + 6;
  const y = Math.round(28 - (1-kin)*140);
  px(x+2, y+2, w, h, 'rgba(0,0,0,0.45)');
  px(x-1, y-1, w+2, h+2, K);
  const edge = b.win ? '#ffd94a' : (b.fled ? '#8a8aa8' : '#e2574c');
  px(x, y, w, h, edge);
  px(x+1, y+1, w-2, h-2, '#1a1e3a');
  px(x+1, y+1, w-2, 1, '#343c70');
  let title, col;
  if(b.friendly){ title = b.fled ? 'TABLAS' : (b.win ? '¡BUEN DUELO!' : '¡GANA '+b.name.slice(0,6)+'!'); col = '#f2a2b8'; }
  else if(b.win){ title = '¡VICTORIA!'; col = '#ffd94a'; }
  else if(b.fled){ title = 'HUISTE...'; col = '#b8bccc'; }
  else { title = 'DERROTA...'; col = '#ff8a80'; }
  const tsc = b.t-420 < 90 ? 3 : 2;
  drawTextOC(title, 80, y+6 - (tsc===3 ? 2 : 0), col, tsc);
  if(b.win && !b.friendly){
    /* destello que recorre el título */
    const sx = ((b.t*0.15) % 200) - 20;
    for(let i=0;i<3;i++) px(40 + sx + i, y+5, 1, 12, 'rgba(255,255,255,0.35)');
  }
  const shown = b.lootShown||0;
  for(let i=0;i<Math.min(shown, n); i++){
    const L = b.loot[i];
    const ly = y + 24 + i*11;
    const ra = clamp01((b.t - (700 + i*260))/160);
    const ox = Math.round((1-ease.outBack(ra))*20);
    ctx.globalAlpha = ra;
    /* icono */
    if(L.icon==='mota'){ px(x+8, ly+1, 3, 1, '#ffd94a'); px(x+9, ly, 1, 3, '#ffd94a'); px(x+9, ly+1, 1, 1, '#ffffff'); }
    else if(L.icon==='xp'){ drawText('XP', x+6-ox, ly, '#5ec8d8'); }
    else if(L.icon==='stat'){ btArrow(x+7, ly+1, true, '#7ac74f'); }
    else if(L.icon==='heart'){ drawText('♥', x+7, ly, '#f2a2b8'); }
    else if(L.icon==='relic'){ px(x+7, ly, 5, 5, '#ffd94a'); px(x+8, ly+1, 3, 3, '#fff3c0'); }
    else px(x+8, ly+2, 2, 1, 'rgba(255,255,255,0.4)');
    /* motas: el número cuenta hacia arriba */
    let s = L.s;
    if(L.icon==='mota' && L.n){ const kc = clamp01((b.t - (700 + i*260))/700); s = '+'+fmt(Math.round(L.n*ease.outCubic(kc)))+'✦'; }
    drawText(s, x+16+ox, ly, L.col);
    /* barra de XP que se llena */
    if(L.icon==='xp' && b.xpGain){
      const kx = ease.outCubic(clamp01((b.t - (760 + i*260))/800));
      const need0 = xpNeed(b.lv0), need1 = xpNeed(b.lv1||b.lv0);
      let fr;
      if((b.lv1||b.lv0) > b.lv0){ fr = kx<0.5 ? (b.xp0/need0) + (1-b.xp0/need0)*(kx/0.5) : (b.xp1/need1)*((kx-0.5)/0.5); }
      else fr = (b.xp0 + (b.xp1-b.xp0)*kx)/need0;
      const bx = x+70, bw = 54;
      px(bx-1, ly, bw+2, 5, K); px(bx, ly+1, bw, 3, '#262a44');
      px(bx, ly+1, Math.round(bw*clamp01(fr)), 3, '#5ec8d8');
      if((b.lv1||b.lv0) > b.lv0 && kx>=0.5 && Math.floor(t/150)%2===0) drawText('¡NV'+b.lv1+'!', bx+bw-19, ly-7, '#ffd94a');
    }
    ctx.globalAlpha = 1;
  }
  if(tip && shown>=n){
    const ty = y + 24 + n*11 + 3;
    px(x+6, ty-3, w-12, 1, 'rgba(255,255,255,0.12)');
    drawTextC(tip[0], 80, ty, '#5ec8d8');
    drawTextC(tip[1], 80, ty+7, 'rgba(94,200,216,0.7)');
  }
  /* motas del botín volando al contador */
  for(const f of b.fx){
    if(f.kind!=='mota') continue;
    const age = f.life0 - f.life;
    let fx0 = f.x, fy0 = f.y;
    if(age>380){
      const k = ease.inCubic(clamp01((age-380)/300));
      fx0 = f.x + ((x+9) - f.x)*k; fy0 = f.y + ((y + 25 + (f.li||0)*11) - f.y)*k;
      if(k>=1) continue;
    }
    const bl = Math.floor((age)/80)%2;
    px(fx0-1, fy0, 3, 1, bl ? '#fff8d0' : '#ffd94a'); px(fx0, fy0-1, 1, 3, bl ? '#fff8d0' : '#ffd94a');
  }
}
function btLoseTip(b){
  if(b.guards===0 && b.hurts>=2) return ['TIP: TOCA CUANDO EL ARO', 'SE CIERRE SOBRE TI: PARADA'];
  if(b.misses>=2) return ['TIP: ESPERA AL ARO DORADO', 'FALLAR ENFURECE AL RIVAL'];
  if(b.mult<1) return ['TIP: SU ELEMENTO TE RESISTE', 'PRUEBA CON OTRO BITXO'];
  return ['TIP: ENTRENA EN EL GYM', 'Y VUELVE MAS FUERTE'];
}
