"use strict";
/* =========================================================
   BITXO — render/constel: el mapa del cielo de la CONSTELACION
   estrellas-nodo unidas por líneas por rama; compradas en oro,
   comprables laten, bloqueadas apagadas. Tarjeta + ENCENDER abajo.
   ========================================================= */
/* cielo de fondo: estrellitas fijas (semilla determinista) */
const CST_BG = (function(){
  const L = []; let s = 7;
  const r = ()=>{ s = (s*16807) % 2147483647; return (s-1)/2147483646; };
  for(let i=0;i<90;i++){
    const x = 8 + Math.floor(r()*144), y = 46 + Math.floor(r()*104);
    /* vía láctea: más densa en la diagonal */
    L.push({x, y, b:r(), ph:r()*6.28, sp:0.6+r()*1.6});
  }
  for(let i=0;i<60;i++){
    const t = r(), x = 8 + Math.floor(t*144);
    const y = Math.floor(140 - t*80 + (r()-0.5)*22);
    if(y>46 && y<150) L.push({x, y, b:r()*0.5, ph:r()*6.28, sp:0.4+r(), mw:true});
  }
  return L;
})();

/* icono de POLVO ESTELAR: destello de 5x5 azul pálido */
function drawDustIcon(x, y, col){
  col = col || '#bfe6ff';
  px(x+2, y, 1, 5, col); px(x, y+2, 5, 1, col);
  px(x+1, y+1, 3, 3, col);
  px(x+2, y+2, 1, 1, '#ffffff');
}
/* línea de píxeles (Bresenham); dash>0 alterna huecos */
function cstLine(x0, y0, x1, y1, col, dash, off){
  x0|=0; y0|=0; x1|=0; y1|=0;
  const dx = Math.abs(x1-x0), dy = -Math.abs(y1-y0);
  const sx = x0<x1?1:-1, sy = y0<y1?1:-1;
  let err = dx+dy, i = off||0;
  ctx.fillStyle = col;
  for(;;){
    if(!dash || ((i/dash)|0)%2===0) ctx.fillRect(x0, y0, 1, 1);
    i++;
    if(x0===x1 && y0===y1) break;
    const e2 = 2*err;
    if(e2>=dy){ err+=dy; x0+=sx; }
    if(e2<=dx){ err+=dx; y0+=sy; }
  }
}
/* disco de luz con alfa (halo) */
function cstHalo(x, y, r, col, a){
  ctx.globalAlpha = a;
  ctx.fillStyle = col;
  for(let yy=-r; yy<=r; yy++){
    const w = Math.floor(Math.sqrt(r*r - yy*yy));
    ctx.fillRect(x-w, y+yy, w*2+1, 1);
  }
  ctx.globalAlpha = 1;
}
/* estrella-nodo: cruz con núcleo; big = remate de rama */
function cstStar(x, y, r, col, core){
  px(x-r, y, r*2+1, 1, col); px(x, y-r, 1, r*2+1, col);
  px(x-1, y-1, 3, 3, col);
  if(r>=4){ px(x-2, y-2, 1, 1, col); px(x+2, y-2, 1, 1, col); px(x-2, y+2, 1, 1, col); px(x+2, y+2, 1, 1, col); }
  if(core) px(x, y, 1, 1, core);
}

/* partículas propias: las del juice en el prado van BAJO los paneles */
const CST_FX = [];
function cstFx(o){ if(CST_FX.length>200) CST_FX.shift(); o.life0 = o.life; CST_FX.push(o); }
function cstBurst(x, y, n, cols, speed, kind, life){
  for(let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2, sp = speed*(0.4+Math.random()*0.8);
    cstFx({x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, g:kind==='star'?0.00006:0, drag:0.003,
      life:life*(0.7+Math.random()*0.6), col:cols[i%cols.length], kind});
  }
}
function cstRing(x, y, col, r1, life, delay){ cstFx({x, y, col, r1, life, kind:'ring', delay:delay||0}); }
function drawCstFx(dt){
  for(let i=CST_FX.length-1;i>=0;i--){
    const f = CST_FX[i];
    if(f.delay>0){ f.delay -= dt; continue; }
    f.life -= dt;
    if(f.life<=0){ CST_FX.splice(i,1); continue; }
    const k = f.life/f.life0;
    if(f.kind==='ring'){
      const r = Math.round(f.r1*(1-k*k*0.9)+1);
      ctx.globalAlpha = Math.min(1, k*1.4);
      for(let a=0;a<Math.PI*2;a+=1/Math.max(4,r)) px(Math.round(f.x+Math.cos(a)*r), Math.round(f.y+Math.sin(a)*r), 1, 1, f.col);
      ctx.globalAlpha = 1;
      continue;
    }
    f.vx *= (1 - f.drag*dt); f.vy *= (1 - f.drag*dt); f.vy += f.g*dt;
    f.x += f.vx*dt; f.y += f.vy*dt;
    const x = Math.round(f.x), y = Math.round(f.y);
    ctx.globalAlpha = Math.min(1, k*2);
    if(f.kind==='star' && k>0.35){ px(x-1, y, 3, 1, f.col); px(x, y-1, 1, 3, f.col); }
    else if(f.kind==='spark'){ px(x, y, 1, 1, f.col); px(Math.round(x-f.vx*30), Math.round(y-f.vy*30), 1, 1, f.col); }
    else px(x, y, 1, 1, f.col);
    ctx.globalAlpha = 1;
  }
}

function drawConstel(){
  constelEnsure();
  const now = performance.now();
  const C = G.constel;
  UI.cst = UI.cst || {};
  const cs = UI.cst;
  const X = CST.X, Y = CST.Y, W = CST.W, H = CST.H;
  /* ---- marco y cielo ---- */
  px(X+2, Y+H, W-2, 2, 'rgba(0,0,0,0.35)');
  const bands = ['#0a0b1f','#0d0f27','#11122e','#151536','#1a183e','#201c46','#28214e'];
  for(let i=0;i<bands.length;i++){
    const y0 = Y + Math.floor(i*H/bands.length), y1 = Y + Math.floor((i+1)*H/bands.length);
    px(X+1, y0, W-2, y1-y0, bands[i]);
  }
  px(X, Y+1, 1, H-2, K); px(X+W-1, Y+1, 1, H-2, K);
  px(X+1, Y, W-2, 1, K); px(X+1, Y+H-1, W-2, 1, K);
  px(X+1, Y+1, W-2, 1, '#3a3470');
  UI.panelRect = {x:X, y:Y, w:W, h:H};

  /* estrellas de fondo que titilan */
  const t = now/1000;
  for(const s of CST_BG){
    const tw = 0.5 + 0.5*Math.sin(t*s.sp + s.ph);
    const a = s.mw ? 0.12 + 0.2*tw*s.b : 0.15 + 0.6*tw*s.b;
    ctx.globalAlpha = a;
    ctx.fillStyle = s.b>0.85 ? '#fff4c8' : '#c8d4ff';
    ctx.fillRect(s.x, s.y, 1, 1);
    if(!s.mw && s.b>0.93 && tw>0.8){ ctx.fillRect(s.x-1, s.y, 3, 1); ctx.fillRect(s.x, s.y-1, 1, 3); }
  }
  ctx.globalAlpha = 1;
  /* estrella fugaz de vez en cuando */
  const sh = (t % 7) / 7;
  if(sh < 0.12){
    const k = sh/0.12, sx = 130 - k*70, sy = 52 + k*26;
    for(let i=0;i<8;i++){ ctx.globalAlpha = (1-i/8)*(1-k); px(Math.round(sx+i*2), Math.round(sy-i), 1, 1, '#ffffff'); }
    ctx.globalAlpha = 1;
  }
  /* horizonte: colinas del prado en silueta */
  for(let x=X+1; x<X+W-1; x++){
    const h = Math.round(4 + 3*Math.sin(x*0.07) + 2*Math.sin(x*0.19+1));
    px(x, 154-h, 1, h, '#0a0a1a');
  }
  px(X+1, 154, W-2, 1, '#2d2860');

  /* ---- cabecera ---- */
  titleChip(80, 31, 'CONSTELACION');
  drawText('★'+G.stars, X+5, 40, '#ffd94a');
  const ptsTxt = String(C.pts);
  const bump = cs.boughtAt && now-cs.boughtAt < 300 ? 1 : 0;
  drawDustIcon(X+W-9-textW(ptsTxt)-2, 40-bump);
  drawText(ptsTxt, X+W-5-textW(ptsTxt), 40-bump, '#bfe6ff');

  /* ---- líneas entre estrellas ---- */
  for(const n of CONSTEL){
    const B = CONSTEL_BR[n.br];
    for(const rid of n.req){
      const r = CONSTEL_BY[rid];
      const lit = perk(rid)>0 && perk(n.id)>0;
      const open = perk(rid)>0;
      if(lit){
        cstLine(r.x, r.y, n.x, n.y, B.col);
      } else if(open){
        ctx.globalAlpha = 0.75;
        cstLine(r.x, r.y, n.x, n.y, B.dim, 2, Math.floor(now/120));
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = 0.35;
        cstLine(r.x, r.y, n.x, n.y, '#4a4a7a', 1);
        ctx.globalAlpha = 1;
      }
    }
  }
  /* raíces: una línea tenue desde el horizonte */
  for(const n of CONSTEL) if(!n.req.length){
    ctx.globalAlpha = 0.4; cstLine(n.x, n.y+4, n.x, 148, CONSTEL_BR[n.br].dim, 1); ctx.globalAlpha = 1;
  }
  /* pulso de energía por la línea recién encendida */
  if(cs.boughtAt && now - cs.boughtAt < 700 && CONSTEL_BY[cs.boughtId]){
    const n = CONSTEL_BY[cs.boughtId], k = (now-cs.boughtAt)/700;
    for(const rid of n.req){
      const r = CONSTEL_BY[rid];
      const qx = Math.round(r.x + (n.x-r.x)*Math.min(1,k*1.6)), qy = Math.round(r.y + (n.y-r.y)*Math.min(1,k*1.6));
      px(qx-1, qy-1, 3, 3, '#ffffff');
    }
  }

  /* ---- nombres de rama ---- */
  drawTextC('PRADO', 34, 146, CONSTEL_BR[0].col);
  drawTextC('CRIANZA', 80, 146, CONSTEL_BR[1].col);
  drawTextC('COMBATE', 126, 146, CONSTEL_BR[2].col);

  /* ---- estrellas-nodo ---- */
  for(const n of CONSTEL){
    const B = CONSTEL_BR[n.br];
    const st = constelState(n), l = perk(n.id);
    const r = n.cap ? 4 : 3;
    const sel = cs.sel===n.id;
    let pop = 0;
    if(cs.boughtAt && cs.boughtId===n.id){ const s2 = springOff(cs.boughtAt, 3, now); pop = Math.round(Math.abs(s2)); }
    if(l>0){
      const full = st==='max';
      const tw = 0.5+0.5*Math.sin(t*2.2 + n.x);
      cstHalo(n.x, n.y, r+3+pop+(full?1:0), '#ffd94a', 0.10 + 0.08*tw);
      cstHalo(n.x, n.y, r+1+pop, '#fff0a0', 0.22);
      cstStar(n.x, n.y, r+pop, full ? '#ffd94a' : '#e8b83a', '#ffffff');
      if(full && n.cap){
        /* remate encendido: rayos que giran */
        const a = t*0.8;
        for(let i=0;i<4;i++){
          const aa = a + i*Math.PI/2;
          px(Math.round(n.x+Math.cos(aa)*(r+4)), Math.round(n.y+Math.sin(aa)*(r+4)), 1, 1, '#fff4c8');
        }
      }
    } else if(st==='ok'){
      const p = 0.5+0.5*Math.sin(now/180);
      cstHalo(n.x, n.y, r+2+Math.round(p*2), B.col, 0.12 + 0.18*p);
      cstStar(n.x, n.y, r, B.col, '#ffffff');
    } else if(st==='poor'){
      cstStar(n.x, n.y, r-1, B.dim, B.col);
    } else {
      cstStar(n.x, n.y, r-1, '#34345a', '#55557e');
    }
    /* pips de nivel */
    if(n.max>1){
      const w = n.max*3-1, x0 = n.x - Math.floor(w/2);
      for(let i=0;i<n.max;i++) px(x0+i*3, n.y+r+3, 2, 1, i<l ? '#ffd94a' : '#3c3a66');
    }
    /* seleccionada: corchetes que respiran */
    if(sel){
      const d = r + 4 + Math.round(1+Math.sin(now/160));
      const c = '#ffffff';
      px(n.x-d, n.y-d, 3, 1, c); px(n.x-d, n.y-d, 1, 3, c);
      px(n.x+d-2, n.y-d, 3, 1, c); px(n.x+d, n.y-d, 1, 3, c);
      px(n.x-d, n.y+d, 3, 1, c); px(n.x-d, n.y+d-2, 1, 3, c);
      px(n.x+d-2, n.y+d, 3, 1, c); px(n.x+d, n.y+d-2, 1, 3, c);
    }
  }

  /* partículas de compra, sobre el cielo */
  const fdt = cs.lastDraw ? Math.min(50, now - cs.lastDraw) : 16;
  cs.lastDraw = now;
  ctx.save(); ctx.beginPath(); ctx.rect(X+1, Y+1, W-2, H-2); ctx.clip();
  drawCstFx(fdt);
  ctx.restore();
  /* estrellitas que suben del horizonte sin parar (el cielo está vivo) */
  if(every(420, now)) cstFx({x:12+Math.random()*136, y:150, vx:(Math.random()-0.5)*0.004, vy:-0.012-Math.random()*0.01, g:0, drag:0, life:2600, col:['#bfe6ff','#fff4c8'][Math.random()<0.5?0:1], kind:'px'});

  /* ---- aviso tras ascender ---- */
  if(cs.hint){
    const p = 0.5+0.5*Math.sin(now/200);
    const msg = cs.gain ? '+'+cs.gain+' POLVO ESTELAR' : 'TIENES POLVO ESTELAR';
    const w = textW(msg)+14, x0 = Math.round(80-w/2);
    px(x0, 47, w, 11, '#2a2458'); px(x0, 47, w, 1, '#bfe6ff'); px(x0, 57, w, 1, '#bfe6ff');
    drawDustIcon(x0+3, 50);
    drawText(msg, x0+10, 50, p>0.5 ? '#ffffff' : '#bfe6ff');
  }

  /* ---- tarjeta del nodo ---- */
  const n = cs.sel && CONSTEL_BY[cs.sel];
  const cy = CST.CARDY;
  px(X+4, cy, W-8, 76, '#12132c');
  px(X+4, cy, W-8, 1, '#3a3470'); px(X+4, cy+75, W-8, 1, '#3a3470');
  px(X+4, cy, 1, 76, '#3a3470'); px(X+W-5, cy, 1, 76, '#3a3470');
  if(!n){
    drawTextC('TOCA UNA ESTRELLA', 80, cy+26, '#bfe6ff');
    drawTextC('CADA ASCENSION DEJA POLVO', 80, cy+38, 'rgba(191,230,255,0.6)');
    return;
  }
  const B = CONSTEL_BR[n.br];
  const st = constelState(n), l = perk(n.id);
  /* entra con un pequeño deslizamiento al cambiar de estrella */
  const slide = cs.selAt ? Math.round((1-ease.outCubic(Math.min(1,(now-cs.selAt)/160)))*6) : 0;
  const tx = 14 + slide;
  px(X+5, cy+1, 2, 74, B.col);
  drawText(n.name, tx, cy+4, n.cap ? '#ffd94a' : B.col);
  if(n.cap) drawText('★', tx+textW(n.name)+3, cy+4, '#ffd94a');
  drawText('NV '+l+'/'+n.max, 146-textW('NV '+l+'/'+n.max), cy+4, l ? '#ffd94a' : 'rgba(191,230,255,0.55)');
  ctx.globalAlpha = 0.6; drawText('RAMA '+B.name, tx, cy+12, B.col); ctx.globalAlpha = 1;
  if(l>0) drawText(n.desc(l), tx, cy+22, '#f6efe0');
  else drawText('APAGADA', tx, cy+22, 'rgba(191,230,255,0.45)');
  if(st!=='max'){
    drawText('>', tx, cy+31, '#ffd94a');
    drawText(n.desc(l+1), tx+6, cy+31, '#ffd94a');
  } else {
    drawText('BRILLA AL MAXIMO', tx, cy+31, '#ffd94a');
  }
  if(st==='lock' && !(cs.msg && now < cs.msgUntil)){
    const need = n.req.filter(r=>!perk(r)).map(r=>CONSTEL_BY[r].name).join(' + ');
    drawText('NECESITA '+need, tx, cy+41, '#ff8a7a');
  }
  /* aviso dentro de la tarjeta (sin toasts encima del panel) */
  if(cs.msg && now < cs.msgUntil){
    const k = Math.min(1, (cs.msgUntil-now)/200);
    ctx.globalAlpha = k;
    drawText(cs.msg, tx, cy+41, '#ff8a7a');
    ctx.globalAlpha = 1;
  }
  /* ESTRELLA GUIA: selector de línea */
  if(n.id==='guia' && perk('guia')){
    const L = CST.GL;
    const g = C.guide ? LINES[C.guide].name : 'AL AZAR';
    px(L.x, L.y, L.w, L.h, '#2a2458');
    drawText('<', L.x+2, L.y+3, '#bfe6ff'); drawText('>', L.x+L.w-5, L.y+3, '#bfe6ff');
    drawTextC(g, L.x+L.w/2, L.y+3, C.guide ? '#ffd94a' : '#f6efe0');
  }
  /* coste */
  const Bt = CST.BUY;
  if(st!=='max'){
    const cost = constelNodeCost(n);
    drawText('COSTE', 14, Bt.y+2, 'rgba(191,230,255,0.6)');
    drawDustIcon(14, Bt.y+9, C.pts>=cost ? '#bfe6ff' : '#ff8a7a');
    drawText(String(cost), 21, Bt.y+9, C.pts>=cost ? '#ffffff' : '#ff8a7a');
  }
  /* botón ENCENDER */
  const ok = st==='ok';
  const press = cs.boughtAt && now-cs.boughtAt < 120 ? 1 : 0;
  const by = Bt.y + press;
  const pulse = ok ? 0.5+0.5*Math.sin(now/150) : 0;
  const face = st==='max' ? '#3a3470' : (ok ? (pulse>0.5 ? '#ffe47a' : '#ffd94a') : '#4a4870');
  if(!press) px(Bt.x+1, Bt.y+Bt.h, Bt.w-2, 1, '#000000');
  px(Bt.x+1, by, Bt.w-2, Bt.h, face); px(Bt.x, by+1, Bt.w, Bt.h-2, face);
  px(Bt.x+1, by, Bt.w-2, 1, K); px(Bt.x+1, by+Bt.h-1, Bt.w-2, 1, K);
  px(Bt.x, by+1, 1, Bt.h-2, K); px(Bt.x+Bt.w-1, by+1, 1, Bt.h-2, K);
  if(ok) px(Bt.x+2, by+1, Bt.w-4, 1, '#fff4c8');
  const lab = st==='max' ? 'MAX' : (st==='lock' ? 'BLOQ' : 'ENCENDER');
  drawTextC(lab, Bt.x+Bt.w/2, by+7, ok ? K : (st==='max' ? '#ffd94a' : '#8a88b0'));
}

/* compra: destello, anillo, lluvia de estrellas y un acorde que sube */
SFX.constelBuy = function(big){
  const base = big ? 523 : 659;
  [0, 4, 7, 12, big ? 16 : null].forEach((st, i)=>{
    if(st===null) return;
    tone({f: base*Math.pow(2, st/12), d:0.16, type:'triangle', vol:0.05, at: sfxAt(i*0.06)});
    tone({f: base*2*Math.pow(2, st/12), d:0.08, type:'p25', vol:0.018, at: sfxAt(i*0.06+0.02)});
  });
  tone({f:1760, slide:2640, d:0.25, type:'triangle', vol:0.03, at: sfxAt(0.3), vib:6});
};
function constelBuyFx(n){
  const B = CONSTEL_BR[n.br];
  flash('#fff8d0', n.cap ? 0.45 : 0.28, n.cap ? 260 : 160);
  shake(n.cap ? 0.35 : 0.12);
  hitstop(n.cap ? 60 : 30);
  cstRing(n.x, n.y, '#ffffff', 12, 320);
  cstRing(n.x, n.y, '#ffd94a', 22, 520, 60);
  if(n.cap){ cstRing(n.x, n.y, B.col, 38, 800, 120); cstRing(n.x, n.y, '#ffffff', 52, 900, 220); }
  cstBurst(n.x, n.y, n.cap ? 30 : 16, ['#ffd94a','#ffffff', B.col], n.cap ? 0.1 : 0.075, 'star', 700);
  cstBurst(n.x, n.y, 12, ['#fff8d0','#bfe6ff'], 0.14, 'spark', 380);
  /* el polvo gastado vuela del contador a la estrella */
  for(let i=0;i<6;i++){
    const sx = 146 - Math.random()*8, sy = 42;
    cstFx({x:sx, y:sy, vx:(n.x-sx)/420 + (Math.random()-0.5)*0.03, vy:(n.y-sy)/420 - 0.02 + Math.random()*0.02, g:0.0001, drag:0, life:420, col:'#bfe6ff', kind:'spark'});
  }
  const l = perk(n.id);
  const lab = n.max>1 ? n.name+' '+l : n.name;
  const hw = (n.cap ? textWS(lab, 2) : textW(lab))/2;
  if(n.cap) popText(80, 100, lab, '#ffd94a', {big:true, life:1400, vy:-0.012});
  else popText(Math.round(Math.max(10+hw, Math.min(150-hw, n.x))), n.y-10, lab, '#ffd94a', {life:1100, vy:-0.02});
  SFX.constelBuy(!!n.cap);
  vibrate(n.cap ? [30,40,90] : [20,30,40]);
}
