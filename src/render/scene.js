"use strict";
/* =========================================================
   BITXO — render/scene: cielo, prado, clima, chispas y fugaces
   ========================================================= */
const SKY = {
  night:{bands:['#0e1030','#141646','#1b1f5c'], hill:'#14304a', hill2:'#0e2438', grass:'#1c4a3a', grass2:'#153a2e'},
  dawn: {bands:['#5a4a8a','#c96f8e','#f2b06b'], hill:'#3d6b52', hill2:'#2e5440', grass:'#4a8a5c', grass2:'#3a7048'},
  day:  {bands:['#7ec8e8','#9ad8f0','#bde8f8'], hill:'#57a05e', hill2:'#478a50', grass:'#66b26e', grass2:'#529c5c'},
  dusk: {bands:['#3a2e6e','#8a4a7a','#e88a5a'], hill:'#2e5440', hill2:'#234233', grass:'#3a7048', grass2:'#2e5c3a'}
};
const stars = []; for(let i=0;i<26;i++) stars.push({x:Math.random()*160,y:Math.random()*90,t:Math.random()*6});
const clouds = [{x:20,y:18,s:1},{x:100,y:44,s:0.7},{x:-40,y:8,s:1.2},{x:60,y:68,s:0.5}];
const fireflies = []; for(let i=0;i<9;i++) fireflies.push({x:Math.random()*160,y:130+Math.random()*55,a:Math.random()*7});
const butterflies = []; for(let i=0;i<6;i++) butterflies.push({x:Math.random()*160,y:126+Math.random()*50,a:Math.random()*7,c:['#f2a2b8','#fff8d0','#ffd94a'][i%3]});
/* mezcla gradual entre fases del día: nada de saltos de color */
function lerpHexCol(a, b, t){
  const pa = [parseInt(a.slice(1,3),16), parseInt(a.slice(3,5),16), parseInt(a.slice(5,7),16)];
  const pb = [parseInt(b.slice(1,3),16), parseInt(b.slice(3,5),16), parseInt(b.slice(5,7),16)];
  const f = v=>('0'+Math.round(v).toString(16)).slice(-2);
  return '#'+f(pa[0]+(pb[0]-pa[0])*t)+f(pa[1]+(pb[1]-pa[1])*t)+f(pa[2]+(pb[2]-pa[2])*t);
}
function skyNow(){
  const d = new Date();
  const h = d.getHours() + d.getMinutes()/60;
  const ph = dayPhase();
  /* primeros 40 min de cada fase: fundido desde la anterior */
  const edges = [[6.5,'night','dawn'],[9,'dawn','day'],[18.5,'day','dusk'],[21,'dusk','night']];
  for(const e of edges){
    if(h>=e[0] && h<e[0]+0.66){
      const t = (h-e[0])/0.66;
      const A = SKY[e[1]], B = SKY[e[2]];
      const mix = {bands:[]};
      for(let i=0;i<3;i++) mix.bands[i] = lerpHexCol(A.bands[i], B.bands[i], t);
      for(const k of ['hill','hill2','grass','grass2']) mix[k] = lerpHexCol(A[k], B[k], t);
      return mix;
    }
  }
  return SKY[ph];
}
/* ================= FONDO v2: degradados tramados, capas y luz =================
   Todo lo estático se hornea en lienzos (cacheados por paleta) y el
   frame solo los estampa: más detalle sin coste por frame. */
const BAYER4 = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function _rgb(h){ return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]; }
function _mix(a, b, t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
/* degradado vertical con tramado Bayer: 'stops' = [[y, '#hex'], ...] */
function ditherGradInto(g, x0, y0, w, h, stops, steps){
  steps = steps||4;
  const id = g.getImageData(x0, y0, w, h), d = id.data;
  const S = stops.map(s=>[s[0], _rgb(s[1])]);
  for(let y=0;y<h;y++){
    let i=0; while(i<S.length-2 && y>=S[i+1][0]) i++;
    const span = Math.max(1, S[i+1][0]-S[i][0]);
    const f = Math.max(0, Math.min(1, (y-S[i][0])/span));
    const q = f*steps, lo = Math.floor(q), fr = q-lo;
    for(let x=0;x<w;x++){
      const lv = (BAYER4[(y&3)*4+(x&3)]/16 < fr) ? lo+1 : lo;
      const c = _mix(S[i][1], S[i+1][1], Math.min(1, lv/steps));
      const o = (y*w+x)*4;
      d[o]=c[0]; d[o+1]=c[1]; d[o+2]=c[2]; d[o+3]=255;
    }
  }
  g.putImageData(id, x0, y0);
}
function lerpHexA(a, b, t){ const c = _mix(_rgb(a), _rgb(b), t); const f=v=>('0'+Math.round(v).toString(16)).slice(-2); return '#'+f(c[0])+f(c[1])+f(c[2]); }
function darkHex(a, k){ return lerpHexA(a, '#0a0818', k); }
function lightHex(a, k){ return lerpHexA(a, '#fff6dc', k); }
/* silueta de colina determinista (suma de senos) */
function hillY(x, base, amp, seed){
  return Math.round(base - amp*(0.55*Math.sin(x/23+seed) + 0.3*Math.sin(x/11+seed*2.3) + 0.15*Math.sin(x/5.3+seed*4.1)));
}
const _bgCache = {key:null, cv:null};
function bakeBackdrop(S, ph){
  const key = S.bands.join()+S.hill+S.hill2+S.grass+S.grass2+ph+(G&&G.zone);
  if(_bgCache.key===key) return _bgCache.cv;
  const sky = (_bgCache.cv && _bgCache.cv.sky) || document.createElement('canvas');
  const c = (_bgCache.cv && _bgCache.cv.land) || document.createElement('canvas');
  sky.width = LW; sky.height = 126;
  c.width = LW; c.height = 196;
  const g = c.getContext('2d');
  g.clearRect(0,0,LW,196);
  /* cielo */
  ditherGradInto(sky.getContext('2d'), 0, 0, LW, 126, [[0,S.bands[0]],[48,S.bands[1]],[104,S.bands[2]],[126,lightHex(S.bands[2],0.18)]], 5);
  /* montañas lejanas: aire entre medias (perspectiva atmosférica) */
  const far = lerpHexA(S.hill2, S.bands[2], 0.55), farHi = lerpHexA(far, S.bands[2], 0.35);
  for(let x=0;x<LW;x++){
    const y = hillY(x, 100, 11, 1.3);
    g.fillStyle = far; g.fillRect(x, y, 1, 126-y);
    if(hillY(x-1,100,11,1.3) > y) { g.fillStyle = farHi; g.fillRect(x, y, 1, 1); }
  }
  /* colina media con arboleda */
  const mid = S.hill2, midHi = lightHex(S.hill2, 0.12);
  for(let x=0;x<LW;x++){
    const y = hillY(x, 111, 6, 4.2);
    g.fillStyle = mid; g.fillRect(x, y, 1, 126-y);
    g.fillStyle = midHi; g.fillRect(x, y, 1, 1);
  }
  const treeDark = darkHex(S.hill2, 0.22), treeLt = lightHex(S.hill2, 0.14);
  for(let i=0;i<11;i++){
    const tx = (i*37+9)%156 + 2;
    const ty = hillY(tx, 111, 6, 4.2);
    const r = 3 + (i*7)%3;
    g.fillStyle = darkHex(S.hill2,0.35); g.fillRect(tx, ty-1, 1, 3);
    for(let yy=-r;yy<=r;yy++) for(let xx=-r;xx<=r;xx++){
      if(xx*xx+yy*yy*1.3 > r*r+1) continue;
      g.fillStyle = (xx+yy < -r*0.4) ? treeLt : ((xx-yy > r*0.5) ? treeDark : mid);
      g.fillRect(tx+xx, ty-r-1+yy, 1, 1);
    }
  }
  /* colina cercana */
  const near = S.hill, nearHi = lightHex(S.hill, 0.14);
  for(let x=0;x<LW;x++){
    const y = hillY(x, 121, 3, 7.7);
    g.fillStyle = near; g.fillRect(x, y, 1, 128-y);
    g.fillStyle = nearHi; g.fillRect(x, y, 1, 1);
  }
  /* prado: más claro lejos, más oscuro cerca (profundidad) */
  ditherGradInto(g, 0, 124, LW, 72, [[0,lightHex(S.grass,0.1)],[26,S.grass],[72,darkHex(S.grass,0.16)]], 4);
  /* borde del horizonte del prado */
  for(let x=0;x<LW;x+=1){ if(((x*7)%5)<3){ g.fillStyle = S.grass2; g.fillRect(x, 124+((x*13)%3===0?1:0), 1, 1); } }
  /* matas de hierba deterministas, más grandes cuanto más cerca */
  for(let i=0;i<46;i++){
    const gx = (i*53+17)%158+1, gy = 128 + (i*29)%64;
    const big = gy>168 ? 2 : 1;
    g.fillStyle = S.grass2;
    g.fillRect(gx, gy, 1, 1+big); g.fillRect(gx-1, gy+big, 1, 1); g.fillRect(gx+1, gy+big-1, 1, 1+big-1);
    g.fillStyle = lightHex(S.grass, 0.18); g.fillRect(gx, gy-1, 1, 1);
  }
  /* guijarros */
  for(let i=0;i<7;i++){
    const gx = (i*71+33)%150+5, gy = 134 + (i*41)%56;
    g.fillStyle = darkHex(S.grass,0.3); g.fillRect(gx, gy+1, 3, 1);
    g.fillStyle = lerpHexA(S.grass, '#d8d0c0', 0.55); g.fillRect(gx, gy, 2, 1);
  }
  _bgCache.key = key; _bgCache.cv = {sky, land:c};
  return _bgCache.cv;
}
/* nubes esponjosas: tres formas horneadas por paleta */
const _cloudCache = {key:null, spr:[]};
function cloudSprites(ph){
  const night = ph==='night';
  const key = ph;
  if(_cloudCache.key===key) return _cloudCache.spr;
  const lit = night ? '#3a3f78' : (ph==='dusk' ? '#f6c8b0' : (ph==='dawn' ? '#fbe0e0' : '#ffffff'));
  const body = night ? '#2a2e5c' : (ph==='dusk' ? '#d89aa0' : (ph==='dawn' ? '#e8c0d0' : '#eef6fc'));
  const shade = night ? '#20234a' : (ph==='dusk' ? '#a86a88' : (ph==='dawn' ? '#c8a0c0' : '#c6dcee'));
  const shapes = [
    [[8,8,7],[16,6,8],[25,9,6],[4,11,4],[31,11,4]],
    [[6,6,5],[13,5,6],[20,7,5]],
    [[10,9,8],[20,6,9],[31,8,8],[40,11,5],[3,12,4]]
  ];
  _cloudCache.spr = shapes.map(sh=>{
    let W=0,H=0; for(const b of sh){ W=Math.max(W,b[0]+b[2]+1); H=Math.max(H,b[1]+b[2]+1); }
    H = Math.min(H, 16);
    const c = document.createElement('canvas'); c.width=W; c.height=H;
    const g = c.getContext('2d');
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){
      let inside=false, top=1e9;
      for(const b of sh){ const dx=x-b[0], dy=y-b[1]; if(dx*dx+dy*dy<=b[2]*b[2]){ inside=true; top=Math.min(top, dy/b[2]); } }
      if(!inside || y>H-3) continue;
      const bottom = y>=H-5;
      g.fillStyle = top<-0.55 ? lit : (bottom ? shade : body);
      g.fillRect(x,y,1,1);
    }
    return c;
  });
  _cloudCache.key = key;
  return _cloudCache.spr;
}
/* sol y luna recorren el cielo con la hora real */
function celestialPos(){
  const d = new Date();
  const h = d.getHours() + d.getMinutes()/60;
  let k;
  if(h>=6.5 && h<21){ k = (h-6.5)/14.5; }
  else { const hh = h<6.5 ? h+24 : h; k = (hh-21)/9.5; }
  return { x: Math.round(16 + k*128), y: Math.round(74 - Math.sin(k*Math.PI)*42) };
}
/* halo redondo: disco tramado que se desvanece hacia fuera */
function glowDisc(cx, cy, R, col, a){
  ctx.fillStyle = col;
  ctx.globalAlpha = a;
  for(let y=-R;y<=R;y++) for(let x=-R;x<=R;x++){
    const d = Math.sqrt(x*x+y*y)/R;
    if(d>1) continue;
    const lv = (1-d)*(1-d);
    if(BAYER4[((y+64)&3)*4+((x+64)&3)]/16 < lv*1.6) ctx.fillRect(cx+x, cy+y, 1, 1);
  }
  ctx.globalAlpha = 1;
}
function drawSunMoon(t, ph, S){
  const cp = celestialPos();
  if(ph==='night'){
    /* halo de luna tramado */
    glowDisc(cp.x, cp.y, 16, '#dfe8ff', 0.22);
    const mc = '#f4f0d8';
    px(cp.x-4,cp.y-5,8,10,mc); px(cp.x-5,cp.y-4,10,8,mc);
    px(cp.x-3,cp.y-6,6,1,mc); px(cp.x-3,cp.y+5,6,1,mc);
    px(cp.x-1,cp.y-3,2,2,'#d8d2b4'); px(cp.x+2,cp.y+1,2,1,'#d8d2b4'); px(cp.x-3,cp.y+2,1,1,'#d8d2b4');
    /* sombra creciente */
    px(cp.x+1,cp.y-5,4,10, S.bands[0]); px(cp.x+2,cp.y-6,2,1, S.bands[0]); px(cp.x+3,cp.y-4,3,8, S.bands[0]);
    return;
  }
  const sc = ph==='day' ? '#ffe066' : '#ffab5a', core = ph==='day' ? '#fff6c0' : '#ffd08a';
  /* halo que respira */
  const br = 1 + Math.sin(t/900)*0.5;
  glowDisc(cp.x, cp.y, 17+br, sc, 0.3);
  /* rayos girando lentos */
  for(let i=0;i<8;i++){
    const a = i*Math.PI/4 + t/5000;
    const r0 = 9, r1 = 11 + ((i%2)?1:3);
    for(let r=r0;r<=r1;r++) px(cp.x+Math.cos(a)*r, cp.y+Math.sin(a)*r, 1, 1, sc);
  }
  px(cp.x-4,cp.y-6,8,12,sc); px(cp.x-6,cp.y-4,12,8,sc); px(cp.x-5,cp.y-5,10,10,sc);
  px(cp.x-3,cp.y-4,5,5,core); px(cp.x-4,cp.y-3,2,2,'#ffffff');
}
/* rayos de luz diagonales de día: aire dorado sobre el prado */
function drawGodRays(t, ph){
  if(ph==='night' || WEATHER.kind==='rain' || WEATHER.kind==='fog') return;
  const cp = celestialPos();
  const a0 = ph==='day' ? 0.05 : 0.08;
  const col = ph==='day' ? '#fff6c0' : '#ffb070';
  ctx.fillStyle = col;
  for(let i=0;i<4;i++){
    const off = i*34 + Math.sin(t/2600+i)*6;
    ctx.globalAlpha = a0*(0.6+0.4*Math.sin(t/1700+i*1.7));
    for(let y=cp.y+8; y<196; y+=2){
      const x = cp.x - 30 + off + (y-cp.y)*(cp.x>80?-0.55:0.55);
      ctx.fillRect(Math.round(x), y, 7+(i%2)*4, 2);
    }
  }
  ctx.globalAlpha = 1;
}

/* estrellas de ascensos anteriores: posiciones deterministas */
function legacyStarPos(i){
  return { x: (i*53+23)%150+5, y: (i*37+11)%70+8 };
}

function drawScene(t){
  /* reloj propio: la escena anima igual a 60 o 120 Hz (y no corre doble en el deslizamiento de zona) */
  const sdt = Math.min(50, Math.max(0, t-(UI.sceneT||t))); UI.sceneT = t;
  const fk = sdt/16.67;
  const ph = dayPhase(), S = skyNow();
  const BG = bakeBackdrop(S, ph);
  ctx.drawImage(BG.sky, 0, 0);

  if(ph==='night'){
    for(let i=0;i<stars.length;i++){
      const st = stars[i];
      const tw = Math.sin(t/600 + st.t);
      if(tw>0.2) px(st.x, st.y, 1,1, '#dfe8ff');
      /* las más brillantes centellean en cruz */
      if(i%5===0 && tw>0.85){ px(st.x-1, st.y, 3, 1, 'rgba(223,232,255,0.55)'); px(st.x, st.y-1, 1, 3, 'rgba(223,232,255,0.55)'); }
    }
    if(G.decor && G.decor.cielo){
      for(let i=0;i<16;i++){
        const ex = (i*61+37)%158, ey = (i*29+13)%86;
        if(Math.sin(t/500+i*2)>0) px(ex, ey, 1, 1, i%3 ? '#aab6e8' : '#ffd3e2');
      }
      /* vía láctea tenue */
      ctx.globalAlpha = 0.10; ctx.fillStyle = '#c8c0f0';
      for(let x=0;x<160;x+=2) ctx.fillRect(x, 70 - x*0.35 + Math.sin(x/9)*4, 2, 6);
      ctx.globalAlpha = 1;
    }
    /* constelación de la dinastía, unida por hilos de luz */
    const nL = Math.min(24, G.ascensions);
    for(let i=0;i<nL;i++){
      const p = legacyStarPos(i);
      if(i>0){
        const q = legacyStarPos(i-1);
        ctx.globalAlpha = 0.18; ctx.fillStyle = '#ffd94a';
        for(let k=0;k<=12;k++) ctx.fillRect(Math.round(q.x+(p.x-q.x)*k/12)+1, Math.round(q.y+(p.y-q.y)*k/12)+1, 1, 1);
        ctx.globalAlpha = 1;
      }
      const tw = Math.sin(t/400 + i)>-0.3;
      px(p.x, p.y, 2, 2, tw ? '#ffd94a' : '#b89a30');
      px(p.x-1, p.y+0.5, 1,1,'#ffd94a'); px(p.x+2, p.y+0.5,1,1,'#ffd94a');
    }
    drawSunMoon(t, ph, S);
    /* aurora si jardín 5 */
    if(G.up.jardin>=5){
      for(let x=0;x<160;x+=2){
        const yy = 30 + Math.sin(x/14 + t/900)*8 + Math.sin(x/5 + t/400)*1.5;
        px(x, yy, 2, 3, 'rgba(122,199,140,0.22)');
        px(x, yy+3, 2, 4, 'rgba(110,177,255,0.14)');
        px(x, yy+7, 2, 3, 'rgba(180,120,230,0.08)');
      }
    }
  } else {
    drawSunMoon(t, ph, S);
    /* arcoíris si jardín 5 */
    if(G.up.jardin>=5 && ph==='day'){
      const cols=['#e2574c','#f0a04b','#ffd94a','#7ac74f','#6db1ff','#8a6ae8'];
      ctx.globalAlpha = 0.55;
      for(let i=0;i<6;i++){
        for(let a=0;a<=60;a++){
          const ang = Math.PI + (a/60)*Math.PI;
          const r = 54+i*2;
          const xx = 80 + Math.cos(ang)*r, yy = 116 + Math.sin(ang)*r*0.8;
          if(yy>0 && yy<112) px(xx, yy, 2, 2, cols[i]);
        }
      }
      ctx.globalAlpha = 1;
    }
  }
  /* nubes con volumen y parallax */
  const CS = cloudSprites(ph);
  for(let i=0;i<clouds.length;i++){
    const c = clouds[i];
    c.x += 0.008*c.s*(WEATHER.kind==='wind'?3:1)*fk; if(c.x>175) c.x=-50;
    const spr = CS[i%CS.length];
    ctx.globalAlpha = ph==='night' ? 0.8 : 0.95;
    ctx.drawImage(spr, Math.round(c.x), Math.round(c.y));
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(BG.land, 0, 0);
  /* franja 196-199: única zona que nadie más repinta por frame —
     sin esto acumula restos de paneles y del atenuado modal */
  px(0,196,160,4,K);
  drawGodRays(t, ph);
  /* hierba alta del primer plano que se mece con el viento */
  const wind = WEATHER.kind==='wind' ? 2.2 : 1;
  for(let i=0;i<14;i++){
    const gx = (i*47+5)%156+2, gy = 186+(i*13)%9;
    const sw = Math.round(Math.sin(t/(520/wind)+i*1.3)*wind*0.8);
    px(gx, gy-2, 1, 3, S.grass2);
    px(gx+sw, gy-4, 1, 2, S.grass2);
    px(gx+1, gy-1, 1, 2, darkHex(S.grass,0.25));
  }

  /* charcos que quedan un rato tras la lluvia */
  if(Date.now() < (G.puddlesUntil||0) && WEATHER.kind!=='rain'){
    for(const pd of [[44,176],[108,184]]){
      px(pd[0]-6,pd[1],12,3,'rgba(94,155,224,0.4)');
      px(pd[0]-4,pd[1]-1,8,1,'rgba(154,220,240,0.5)');
      px(pd[0]-3,pd[1]+3,6,1,'rgba(94,155,224,0.28)');
    }
  }

  /* escenografía propia de cada zona */
  if(G.zone==='parque') drawParqueProps(t, S);
  if(G.zone==='huerta') drawHuertaProps(t, S);

  /* decoración base + jardín (paleta de flores elegible) */
  if(G.zone==='prado'){
    const fp = FLOWER_PALS[(G.decor && G.decor.flores) || 'clasico'] || FLOWER_PALS.clasico;
    const deco = [[14,182,fp[0]],[52,190,fp[1]],[96,186,fp[2]],[136,180,fp[3]]];
    if(G.up.jardin>=1) deco.push([30,166,fp[1]],[118,168,fp[2]],[70,176,fp[4]],[144,192,fp[1]],[8,170,fp[2]]);
    const fw = WEATHER.kind==='wind' ? 1 : 0;
    for(let i=0;i<deco.length;i++){
      const d = deco[i];
      /* flor con hojas y corazón amarillo; con viento cabecea */
      const nod = fw && Math.sin(t/260+i)>0.3 ? 1 : 0;
      ctx.drawImage(florSpr(d[2]), d[0]-3+nod, d[1]-8);
    }
  }

  /* valla y caminito comprados */
  if(G.zone==='prado' && G.decor && G.decor.valla){
    /* valla de madera al fondo: largueros sombreados y postes con remate */
    for(const ry of [115,120]){ px(0,ry,160,2,TA.wood[2]); px(0,ry,160,1,TA.wood[3]); px(0,ry+2,160,1,'rgba(26,20,40,0.35)'); }
    for(let x=4;x<160;x+=22) ctx.drawImage(SPR.valla_poste, x, 110);
  }
  if(G.zone==='prado' && G.decor && G.decor.camino){
    /* losas redondeadas con canto claro, sombra y musgo */
    for(let x=4;x<156;x+=14){
      const y = 168+((x/14)%2)*3, w = 8 + (x%3);
      px(x+1, y+4, w-1, 1, 'rgba(20,40,30,0.25)');
      px(x, y+1, w, 3, '#b8ae96'); px(x+1, y, w-2, 1, '#b8ae96'); px(x+1, y+4, w-2, 1, '#8a826e');
      px(x+1, y, w-3, 1, '#dcd4bc'); px(x, y+1, 1, 2, '#dcd4bc');
      px(x+w-1, y+2, 1, 2, '#8a826e');
      if(x%28===4) px(x+w-3, y+3, 2, 1, '#6a9a4a');
    }
  }
  /* mariposas al sol (más con jardín) */
  if(ph==='day' || ph==='dawn'){
    const nB = 3 + Math.min(3, G.up.jardin);
    for(let i=0;i<nB;i++){
      const b = butterflies[i];
      b.x += Math.sin(t/700+b.a)*0.22*fk; b.y += Math.cos(t/860+b.a*2)*0.12*fk;
      if(b.x<4) b.x=4; if(b.x>156) b.x=156;
      if(b.y<122) b.y=122; if(b.y>186) b.y=186;
      const open = Math.floor(t/160+b.a)%2===0;
      px(b.x, b.y, 1, 1, b.c);
      if(open){ px(b.x-1, b.y, 1, 1, b.c); px(b.x+1, b.y, 1, 1, b.c); }
      else px(b.x, b.y-1, 1, 1, b.c);
    }
  }
  if(G.zone==='prado' && G.up.jardin>=2){ ctx.drawImage(SPR.shroom, 134, 128); }
  if(G.zone==='prado' && G.up.jardin>=3){
    /* estanque: óvalo con orilla, reflejo del cielo, nenúfar y ondas */
    const cx = 33, cy = 184, rx = 18, ry = 7;
    for(let yy=-ry-1; yy<=ry+1; yy++){
      const half = Math.round(rx*Math.sqrt(Math.max(0, 1-(yy*yy)/((ry+1)*(ry+1)))));
      px(cx-half-1, cy+yy, half*2+2, 1, '#8a7a5a');
    }
    for(let yy=-ry; yy<=ry; yy++){
      const half = Math.round((rx-1)*Math.sqrt(Math.max(0, 1-(yy*yy)/(ry*ry))));
      px(cx-half, cy+yy, half*2, 1, yy<-2 ? '#3a6bb0' : (yy<3 ? '#4a80c8' : '#5e9be0'));
    }
    px(cx-10, cy-3, 8, 1, 'rgba(189,232,248,0.55)');
    const sh = Math.floor(t/700)%2;
    px(cx-8+sh*6,cy+1,6,1,'#bde8f8'); px(cx+4,cy+4,5,1,'#bde8f8');
    /* nenúfar con flor */
    px(cx+6, cy-2, 5, 2, '#57a05e'); px(cx+7, cy-3, 3, 1, '#57a05e'); px(cx+8, cy-3, 1, 1, '#f2a2b8');
    px(cx+6, cy-1, 5, 1, '#3f7f3a'); px(cx-12, cy+2, 4, 1, '#57a05e'); px(cx-11, cy+1, 2, 1, '#7ac74f');
    /* piedras de la orilla */
    for(const r of [[-19,-2,4],[-17,3,3],[16,-3,4],[17,2,3],[-4,-8,3],[8,7,4]]){
      const rx0 = cx+r[0], ry0 = cy+r[1];
      px(rx0, ry0, r[2], 2, '#8a8aa0'); px(rx0, ry0, r[2]-1, 1, '#c2c2d4'); px(rx0+1, ry0+2, r[2]-1, 1, '#5a5a6e');
    }
    /* juncos con espiga que se mecen */
    for(let k=0;k<4;k++){
      const jx = cx+14+k*2, jy = cy-4-(k%2)*2, sw = Math.round(Math.sin(t/700+k)*0.6);
      px(jx, jy-6, 1, 7, k%2 ? '#4f9a42' : '#3f7f3a');
      if(k%2===0){ px(jx-1+sw, jy-9, 2, 3, '#8a5a30'); px(jx-1+sw, jy-9, 1, 1, '#b08050'); }
    }
    /* onda que se expande cada pocos segundos */
    const rp = (t%3200)/3200;
    if(rp<0.6){ const rr = Math.round(2+rp*14); ctx.globalAlpha = 0.5*(1-rp/0.6); px(cx-6-rr, cy+1, 2, 1, '#e8f6ff'); px(cx-6+rr, cy+1, 2, 1, '#e8f6ff'); px(cx-6, cy+1-Math.round(rr*0.4), 1, 1, '#e8f6ff'); ctx.globalAlpha = 1; }
  }
  if(G.zone==='prado' && G.up.jardin>=4){
    /* farolillos */
    for(const lx of [22, 126]){
      const on = ph==='night' || ph==='dusk';
      if(on) glowDisc(lx+1, 135, 12 + Math.round(Math.sin(t/400+lx)*0.8), '#ffd94a', ph==='night' ? 0.35 : 0.18);
      ctx.drawImage(SPR.farol, lx-3, 130);
      /* cristal con llama que titila */
      const fl = on ? (Math.sin(t/90+lx)>0 ? '#fff0a0' : '#ffd94a') : '#f2c890';
      px(lx-1, 133, 4, 4, on ? '#f0a04b' : '#c89a6a'); px(lx, 134, 2, 2, fl);
      px(lx-1, 133, 1, 1, 'rgba(255,255,255,0.6)');
    }
    if(ph==='night' || ph==='dusk'){
      for(const f of fireflies){
        f.x += Math.sin(t/800+f.a)*0.15*fk; f.y += Math.cos(t/900+f.a)*0.1*fk;
        if(Math.sin(t/300+f.a*3)>0.3) px(f.x, f.y, 1,1,'#ffe066');
      }
    }
  }
  if(sceneFamily(UI.mode)==='world') drawZoneEdges(t);
}

/* copa de árbol: blobs con luz arriba-izquierda, sombra abajo-derecha */
const _treeCache = {key:null, c:null};
function treeCanopy(S){
  const key = S.grass2+S.grass;
  if(_treeCache.key===key) return _treeCache.c;
  const W=54, H=42, c = document.createElement('canvas'); c.width=W; c.height=H;
  const g = c.getContext('2d');
  const blobs = [[27,16,15],[14,24,11],[40,24,11],[27,28,12],[20,11,8],[35,11,8]];
  const base = S.grass2, lt = lightHex(S.grass,0.18), dk = darkHex(S.grass2,0.3), rimC = darkHex(S.grass2,0.55);
  const inside = (x,y)=>blobs.some(b=>(x-b[0])**2+(y-b[1])**2 <= b[2]*b[2]);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    if(!inside(x,y)) continue;
    const edge = !inside(x-1,y)||!inside(x+1,y)||!inside(x,y-1)||!inside(x,y+1);
    let col = base;
    const lx = x-22, ly = y-12;
    if(lx*lx+ly*ly < 110 || (!inside(x-2,y-2))) col = lt;
    if(!inside(x+3,y+3) || y>34) col = dk;
    if((x*7+y*13)%11===0 && col===base) col = lt;
    if((x*5+y*3)%13===0 && col===base) col = dk;
    if(edge) col = rimC;
    g.fillStyle = col; g.fillRect(x,y,1,1);
  }
  /* un par de manzanas */
  for(const a of [[17,20],[36,15],[29,30]]){ g.fillStyle='#e2574c'; g.fillRect(a[0],a[1],2,2); g.fillStyle='#ffb0a0'; g.fillRect(a[0],a[1],1,1); }
  _treeCache.key = key; _treeCache.c = c;
  return c;
}
/* ---------------- EL PARQUE: escenografía propia ---------------- */
function drawParqueProps(t, S){
  /* arco de entrada: la puerta de vuelta al prado */
  ctx.drawImage(SPR.arco, -2, 123);
  /* el gran árbol: copa redonda sombreada (horneada) que se mece */
  const sway = Math.round(Math.sin(t/1400));
  px(74,118,8,42,'#6a4e2e');
  px(75,120,2,38,'#8a6a3a'); px(80,122,1,34,'#5a3e24');
  px(70,158,16,3,'#5a3e24'); px(68,159,4,2,'#6a4e2e'); px(84,159,4,2,'#6a4e2e');
  ctx.drawImage(treeCanopy(S), 51+sway, 84);
  /* banco de madera */
  ctx.drawImage(SPR.banco, 102, 124);
  /* muñeco de entreno: tócalo y el GYM abre sin menús */
  {
    const hitK = Math.max(0, 1 - (performance.now()-(UI.dummyHitAt||0))/400);
    const wob = Math.round(Math.sin(t/60)*2*hitK);
    softShadow(53, 158, 10);
    ctx.save(); ctx.translate(53, 158); ctx.rotate(wob*0.04);
    ctx.drawImage(SPR.muneco, -7, -35);
    ctx.restore();
  }
  /* si hay pareja de residentes, ¡duelo! */
  const duo = G.pets.filter(q=>(q.zone||'prado')==='parque' && q.stage>=STAGES.CHILD && !q.sleeping && !q.exped);
  if(duo.length>=2 && Math.floor(t/400)%2===0) drawTextC('¡VS!', 53, 112, '#e2574c');
}

/* ---------------- LA HUERTA: escenografía propia ---------------- */
function drawHuertaProps(t, S){
  /* bancales labrados: caballones con sombra y hortalizas */
  for(let r=0;r<3;r++){
    const y = 130 + r*7;
    px(22,y,44,4,'#6a4a30');
    px(22,y,44,1,'#8a6a48');
    px(22,y+3,44,1,'#4a3424');
    px(21,y+1,1,2,'#6a4a30'); px(66,y+1,1,2,'#4a3424');
    for(let i=0;i<6;i++){
      const hx = 25 + i*7 + (r%2)*3, hy = y;
      if(r===0){
        /* lechugas */
        px(hx-1,hy-2,4,3,'#7ac74f'); px(hx,hy-3,2,1,'#b4ec84'); px(hx-1,hy,4,1,'#3f7f3a'); px(hx,hy-1,1,1,'#b4ec84');
      } else if(r===1){
        /* zanahorias: hojas y hombro naranja */
        const sw = Math.round(Math.sin(t/800+i)*0.6);
        px(hx+sw,hy-4,1,3,'#4f9a42'); px(hx-1,hy-3,1,2,'#7ac74f'); px(hx+1+sw,hy-3,1,2,'#7ac74f');
        px(hx-1,hy,3,1,'#f0a04b'); px(hx-1,hy,1,1,'#ffc88a');
      } else {
        /* coles moradas */
        px(hx-1,hy-2,4,3,'#8a6ae0'); px(hx,hy-3,2,1,'#b89af0'); px(hx-1,hy,4,1,'#5a3fa8'); px(hx+2,hy-2,1,1,'#7ac74f');
      }
    }
  }
  /* espantapájaros (a veces con cuervo confianzudo) */
  softShadow(113, 158, 12);
  ctx.drawImage(SPR.espanta, 104, 123);
  if(Math.floor(t/900)%5===0){
    const cy = Math.floor(t/150)%2;
    px(103,133-cy,4,3,'#2a2438'); px(102,132-cy,2,2,'#2a2438'); px(101,133-cy,1,1,'#f0a04b'); px(103,132-cy,1,1,'#ffffff');
  }
  /* girasoles que siguen al sol (cabecean) */
  for(const [gx,i] of [[136,0],[145,1]]){
    const nod = Math.round(Math.sin(t/1400+i*2)*0.7);
    softShadow(gx+4, 158, 6);
    ctx.drawImage(SPR.girasol, gx+nod, 134+i*2);
  }
}

/* aviso en la flecha: algo pasa en la zona a la que apunta */
function zoneAlertCol(target){
  if(G.wild && (G.wild.zone||'prado')===target) return '#e2574c';
  if(G.pets.some(p=>(p.zone||'prado')===target && petAlert(p))) return '#ffd94a';
  if(G.buho && target==='prado') return '#5ec8d8';
  return null;
}
/* mirando en una dirección: primer aviso de las zonas de ese lado */
function zoneAlertDir(dir){
  let idx = ZONE_ORDER.indexOf(G.zone);
  for(idx+=dir; idx>=0 && idx<ZONE_ORDER.length; idx+=dir){
    const z = ZONE_ORDER[idx];
    if(z!=='prado' && !G.zonesOpen[z]) continue;
    const c = zoneAlertCol(z);
    if(c) return c;
  }
  return null;
}
/* senderos cerrados, o flechas para ir y volver */
function drawZoneEdges(t){
  const blink = Math.floor(t/450)%2===0;
  /* chevrón que empuja hacia el borde: se lee como "por aquí se sigue" */
  const chevron = (x, dir, col)=>{
    for(let i=0;i<4;i++){ px(x+dir*i, 172+i, 1, 1, col); px(x+dir*i, 178-i, 1, 1, col); }
    px(x+dir*3, 175, 1, 1, col);
  };
  const arrowR = ()=>{
    px(146,178,14,4,'rgba(190,182,160,0.75)');
    px(150,184,10,3,'rgba(190,182,160,0.55)');
    const nudge = Math.round(Math.abs(Math.sin(t/260))*2);
    chevron(150+nudge, 1, 'rgba(26,20,40,0.35)');
    chevron(149+nudge, 1, blink ? '#ffd94a' : '#f6efe0');
    chevron(153+nudge, 1, 'rgba(246,239,224,0.5)');
    const al = zoneAlertDir(1);
    if(al) drawTextOC('!', 154, 160+Math.round(Math.sin(t/150)), al);
  };
  const arrowL = ()=>{
    px(0,178,14,4,'rgba(190,182,160,0.75)');
    px(0,184,10,3,'rgba(190,182,160,0.55)');
    const nudge = Math.round(Math.abs(Math.sin(t/260))*2);
    chevron(9-nudge, -1, 'rgba(26,20,40,0.35)');
    chevron(10-nudge, -1, blink ? '#ffd94a' : '#f6efe0');
    chevron(6-nudge, -1, 'rgba(246,239,224,0.5)');
    const al = zoneAlertDir(-1);
    if(al) drawTextOC('!', 6, 160+Math.round(Math.sin(t/150)), al);
  };
  const teaser = (sx)=>{
    px(sx+5,177,2,9,'#5a4632');
    px(sx,168,12,9,'#8a6a3a');
    px(sx,168,12,1,K); px(sx,176,12,1,K);
    px(sx,168,1,9,K); px(sx+11,168,1,9,K);
    drawTextC('?', sx+6, 170, blink ? '#ffd94a' : '#f6efe0');
    px(sx+2,188,12,3,'rgba(190,182,160,0.4)');
  };
  if(G.zone==='prado'){
    if(G.zonesOpen.parque) arrowR();
    else if(Object.keys(G.toys).length>=1) teaser(146);
    if(G.zonesOpen.huerta) arrowL();
    else if(huertaTeaser()) teaser(2);
  } else if(G.zone==='parque'){
    arrowL();
  } else if(G.zone==='huerta'){
    arrowR();
  }
}

function drawSparkles(t){
  const nowD = Date.now();
  for(const s of UI.sparkles){
    if((s.zone||'prado')!==G.zone) continue;
    const age = nowD - s.born;
    /* aparece brotando con rebote; parpadea cuando va a apagarse */
    const pop = ease.outBack(clamp01(age/320));
    if(age > 11000 && Math.floor(t/90)%2===0) continue;
    const bob = Math.sin(t/300 + s.t)*2;
    const y = Math.round(s.y + bob + (1-pop)*6), x = Math.round(s.x);
    const r = Math.max(1, Math.round(3*pop));
    /* halo tramado */
    ctx.globalAlpha = 0.28 + 0.12*Math.sin(t/200+s.t);
    px(x-4, y-2, 9, 5, '#fff3a0'); px(x-2, y-4, 5, 9, '#fff3a0');
    ctx.globalAlpha = 1;
    const tw = Math.floor(t/140 + s.t)%4;
    const col = tw===0 ? '#ffffff' : '#ffd94a';
    px(x, y-r-1, 1, r*2+3, col);
    px(x-r-1, y, r*2+3, 1, col);
    px(x-1, y-1, 3, 3, '#ffd94a');
    px(x, y, 1, 1, '#ffffff');
    if(tw===2){ px(x-2, y-2, 1, 1, '#fff8d0'); px(x+2, y+2, 1, 1, '#fff8d0'); }
    else if(tw===0){ px(x+2, y-2, 1, 1, '#fff8d0'); px(x-2, y+2, 1, 1, '#fff8d0'); }
    /* destello al nacer */
    if(!s.rung){ s.rung = true; ringFx(x, y, '#fff8d0', 8, 260); tone({f:1760, d:0.04, type:'p125', vol:0.012}); }
  }
}

/* ---------------- CLIMA Y FUGACES: DIBUJO ---------------- */
const rainDrops = [];
for(let i=0;i<46;i++) rainDrops.push({x:Math.random()*160, y:Math.random()*200, s:0.7+Math.random()*0.6});
/* estación por mes: el prado respira el calendario */
function season(){
  const m = new Date().getMonth();
  if(m===11||m<=1) return 'invierno';
  if(m>=2&&m<=4) return 'primavera';
  if(m>=8&&m<=10) return 'otono';
  return 'verano';
}
const seasonBits = [];
for(let i=0;i<18;i++) seasonBits.push({x:Math.random()*160, y:Math.random()*200, s:0.5+Math.random()*0.7, a:Math.random()*7});
function drawSeason(t){
  const sn = season();
  if(sn==='verano') return;
  const n = sn==='invierno' ? 18 : 10;
  for(let i=0;i<n;i++){
    const d = seasonBits[i];
    if(sn==='invierno'){
      const y = (d.y + t*0.018*d.s)%200;
      const x = ((d.x + Math.sin(t/900+d.a)*8)%160+160)%160;
      px(x, y, d.s>0.9?2:1, d.s>0.9?2:1, 'rgba(240,246,255,0.8)');
    } else if(sn==='otono'){
      const y = (d.y + t*0.026*d.s)%200;
      const x = ((d.x + Math.sin(t/500+d.a)*14 + t*0.008)%160+160)%160;
      px(x, y, 2, 1, i%2 ? '#c9743a' : '#e2a04b');
    } else {
      const y = (d.y + t*0.014*d.s)%200;
      const x = ((d.x + Math.sin(t/700+d.a)*10)%160+160)%160;
      px(x, y, 1, 1, i%2 ? '#f2a2b8' : '#ffd3e2');
    }
  }
}
function drawWeather(t){
  if(WEATHER.kind==='rain'){
    G.puddlesUntil = Date.now() + 3*60*1000; /* charcos al escampar */
    ctx.fillStyle='rgba(20,30,70,0.15)'; ctx.fillRect(0,0,160,196);
    /* salpicaduras en el estanque */
    if(G.up.jardin>=3 && Math.floor(t/120)%3===0){
      const rx2 = 22+((t*0.37)|0)%22, ry2 = 180+((t*0.13)|0)%8;
      px(rx2-1, ry2, 3, 1, 'rgba(190,232,248,0.7)');
      px(rx2, ry2-1, 1, 1, 'rgba(190,232,248,0.7)');
    }
    /* salpicaduras donde caen las gotas */
    if(every(70, t)){
      const sx = 4+Math.random()*152, sy = 130+Math.random()*62;
      fx({x:sx-1, y:sy, vx:-0.02, vy:-0.03, g:0.0003, life:220, col:'rgba(190,220,255,0.8)'});
      fx({x:sx+1, y:sy, vx:0.02, vy:-0.03, g:0.0003, life:220, col:'rgba(190,220,255,0.8)'});
    }
    for(const d of rainDrops){
      const y = (d.y + t*0.14*d.s)%200;
      const x = ((d.x - t*0.02*d.s)%160+160)%160;
      px(x, y, 1, 4, 'rgba(160,200,255,0.5)');
    }
  } else if(WEATHER.kind==='wind'){
    for(let i=0;i<8;i++){
      const x = (((i*53) + t*0.08)%180)-10 + Math.sin(t/300+i)*6;
      const y = 118+((i*37)%64)+Math.sin(t/200+i*2)*4;
      px(x, y, 2, 1, i%2? '#f2a2b8':'#7ac74f');
    }
  } else if(WEATHER.kind==='fog'){
    for(let b=0;b<3;b++){
      const y = 116+b*24;
      const off = ((t*0.008*(b+1))%200);
      ctx.fillStyle='rgba(205,215,235,0.10)';
      ctx.fillRect(off-170, y, 170, 12);
      ctx.fillRect(off, y, 170, 12);
    }
  }
}
function drawShoot(t){
  if(!UI.shoot) return;
  const sx = UI.shoot.x, sy = UI.shoot.y;
  for(let i=0;i<6;i++){
    px(sx-i*3, sy-i*1.1, 2, 1, i<2? '#ffffff' : 'rgba(255,217,74,'+(0.8-i*0.13)+')');
  }
  px(sx, sy-1, 2, 2, '#ffffff');
}
