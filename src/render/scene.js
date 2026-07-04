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
const clouds = [{x:20,y:22,s:1},{x:100,y:40,s:0.7},{x:-40,y:12,s:1.2}];
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
/* estrellas de ascensos anteriores: posiciones deterministas */
function legacyStarPos(i){
  return { x: (i*53+23)%150+5, y: (i*37+11)%70+8 };
}

function drawScene(t){
  const ph = dayPhase(), S = skyNow();
  px(0,0,160,50,S.bands[0]);
  px(0,50,160,35,S.bands[1]);
  px(0,85,160,35,S.bands[2]);

  if(ph==='night'){
    for(const st of stars){
      if(Math.sin(t/600 + st.t)>0.2) px(st.x, st.y, 1,1, '#dfe8ff');
    }
    if(G.decor && G.decor.cielo){
      for(let i=0;i<16;i++){
        const ex = (i*61+37)%158, ey = (i*29+13)%86;
        if(Math.sin(t/500+i*2)>0) px(ex, ey, 1, 1, i%3 ? '#aab6e8' : '#ffd3e2');
      }
      px(30,34,3,1,'#8a92c8'); px(60,20,4,1,'#8a92c8'); px(110,44,3,1,'#8a92c8');
    }
    /* constelación de la dinastía */
    for(let i=0;i<Math.min(24, G.ascensions);i++){
      const p = legacyStarPos(i);
      const tw = Math.sin(t/400 + i)>-0.3;
      px(p.x, p.y, 2, 2, tw ? '#ffd94a' : '#b89a30');
      px(p.x-1, p.y+0.5, 1,1,'#ffd94a'); px(p.x+2, p.y+0.5,1,1,'#ffd94a');
    }
    px(118,18,10,10,'#f4f0d8'); px(120,16,6,2,'#f4f0d8'); px(120,28,6,2,'#f4f0d8');
    px(116,20,2,6,'#f4f0d8'); px(128,20,2,6,'#f4f0d8');
    px(121,20,3,3, S.bands[0]);
    /* aurora si jardín 5 */
    if(G.up.jardin>=5){
      for(let x=0;x<160;x+=4){
        const yy = 30 + Math.sin(x/14 + t/900)*8;
        px(x, yy, 4, 3, 'rgba(122,199,140,0.25)');
        px(x, yy+4, 4, 2, 'rgba(110,177,255,0.18)');
      }
    }
  } else {
    const sc = ph==='day' ? '#ffd94a' : '#ff9d4a';
    px(120,16,10,10,sc); px(122,14,6,2,sc); px(122,26,6,2,sc);
    px(118,18,2,6,sc); px(130,18,2,6,sc);
    /* arcoíris si jardín 5 */
    if(G.up.jardin>=5 && ph==='day'){
      const cols=['#e2574c','#f0a04b','#ffd94a','#7ac74f','#6db1ff'];
      for(let i=0;i<5;i++){
        for(let a=0;a<=40;a++){
          const ang = Math.PI + (a/40)*Math.PI;
          const r = 54+i*2;
          const xx = 80 + Math.cos(ang)*r, yy = 112 + Math.sin(ang)*r*0.8;
          if(yy>0 && yy<110) px(xx, yy, 2, 2, cols[i]+'');
        }
      }
    }
  }
  for(const c of clouds){
    c.x += 0.008*c.s; if(c.x>175) c.x=-30;
    const cc = ph==='night' ? '#2a2e5c' : 'rgba(255,255,255,0.85)';
    px(c.x, c.y, 18*c.s, 4, cc);
    px(c.x+3, c.y-3, 10*c.s, 3, cc);
  }
  px(0,108,160,14,S.hill2);
  for(let x=0;x<160;x+=8){ const hh = 4+Math.round(3*Math.sin(x/18)); px(x,108-hh,8,hh,S.hill2); }
  px(0,116,160,8,S.hill);
  for(let x=4;x<160;x+=10){ const hh = 3+Math.round(2*Math.sin(x/12+2)); px(x,116-hh,10,hh,S.hill); }
  px(0,124,160,72,S.grass);
  for(let x=0;x<160;x+=6){ px(x,124,3,2,S.grass2); }
  /* franja 196-199: única zona que nadie más repinta por frame —
     sin esto acumula restos de paneles y del atenuado modal */
  px(0,196,160,4,K);

  for(let i=0;i<8;i++){ px((i*37+11)%160, 130+(i*23)%60, 2,1, S.grass2); }

  /* escenografía propia de cada zona */
  if(G.zone==='parque') drawParqueProps(t, S);
  if(G.zone==='huerta') drawHuertaProps(t, S);

  /* decoración base + jardín (paleta de flores elegible) */
  if(G.zone==='prado'){
    const fp = FLOWER_PALS[(G.decor && G.decor.flores) || 'clasico'] || FLOWER_PALS.clasico;
    const deco = [[14,182,fp[0]],[52,190,fp[1]],[96,186,fp[2]],[136,180,fp[3]]];
    if(G.up.jardin>=1) deco.push([30,166,fp[1]],[118,168,fp[2]],[70,176,fp[4]],[144,192,fp[1]],[8,170,fp[2]]);
    for(const d of deco){
      px(d[0],d[1]-3,1,3,S.grass2);
      px(d[0]-1,d[1]-5,3,2,d[2]);
      px(d[0],d[1]-6,1,1,d[2]);
    }
  }

  /* valla y caminito comprados */
  if(G.zone==='prado' && G.decor && G.decor.valla){
    for(let x=6;x<160;x+=22){ px(x,112,3,12,'#8a6a3a'); px(x,112,3,1,K); }
    px(0,115,160,2,'#a4834e'); px(0,120,160,2,'#a4834e');
  }
  if(G.zone==='prado' && G.decor && G.decor.camino){
    for(let x=4;x<156;x+=14){
      px(x, 168+((x/14)%2)*3, 8, 4, 'rgba(190,182,160,0.85)');
      px(x+1, 167+((x/14)%2)*3, 6, 1, 'rgba(220,214,196,0.85)');
    }
  }
  /* mariposas al sol (más con jardín) */
  if(ph==='day' || ph==='dawn'){
    const nB = 3 + Math.min(3, G.up.jardin);
    for(let i=0;i<nB;i++){
      const b = butterflies[i];
      b.x += Math.sin(t/700+b.a)*0.22; b.y += Math.cos(t/860+b.a*2)*0.12;
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
    /* estanque */
    px(16,178,34,12,'#3a6bb0'); px(18,176,30,2,'#3a6bb0'); px(18,190,30,2,'#3a6bb0');
    px(20,180,26,8,'#5e9be0');
    const sh = Math.floor(t/700)%2;
    px(24+sh*6,182,6,1,'#bde8f8'); px(34,186,5,1,'#bde8f8');
  }
  if(G.zone==='prado' && G.up.jardin>=4){
    /* farolillos */
    for(const lx of [22, 126]){
      px(lx,138,2,18,'#5a4632');
      px(lx-2,132,6,7,'#8a6a3a');
      px(lx-1,133,4,5, ph==='night' ? '#ffd94a' : '#f2b06b');
      if(ph==='night'){
        ctx.fillStyle='rgba(255,217,74,0.13)';
        ctx.fillRect(lx-7,128,16,16);
      }
    }
    if(ph==='night' || ph==='dusk'){
      for(const f of fireflies){
        f.x += Math.sin(t/800+f.a)*0.15; f.y += Math.cos(t/900+f.a)*0.1;
        if(Math.sin(t/300+f.a*3)>0.3) px(f.x, f.y, 1,1,'#ffe066');
      }
    }
  }
  drawZoneEdges(t);
}

/* ---------------- EL PARQUE: escenografía propia ---------------- */
function drawParqueProps(t, S){
  /* arco de entrada: la puerta de vuelta al prado */
  px(0,128,3,32,'#8a6a3a'); px(9,128,3,32,'#8a6a3a');
  px(0,124,12,4,'#a4834e');
  px(0,124,12,1,K); px(0,127,12,1,K);
  /* el gran árbol: copa con borde oscuro para leerse sobre las colinas */
  const sway = Math.round(Math.sin(t/1400));
  px(74,120,8,40,'#6a4e2e');
  px(75,122,2,36,'#8a6a3a');
  px(70,158,16,3,'#5a3e24');
  const rim = 'rgba(18,26,22,0.55)';
  px(55+sway,105,48,18,rim);
  px(61+sway,96,36,12,rim);
  px(67+sway,90,24,9,rim);
  px(56+sway,106,46,16,S.grass2);
  px(62+sway,97,34,10,S.grass2);
  px(68+sway,91,22,7,S.grass2);
  px(61+sway,103,14,5,S.grass);
  px(82+sway,96,12,5,S.grass);
  px(72+sway,112,10,4,S.grass);
  /* banco de madera */
  px(104,127,22,3,'#a4834e');
  px(104,127,22,1,'#c8a04b');
  px(106,130,2,5,'#5a4632'); px(122,130,2,5,'#5a4632');
}

/* ---------------- LA HUERTA: escenografía propia ---------------- */
function drawHuertaProps(t, S){
  /* surcos labrados con brotes */
  for(let r=0;r<3;r++){
    const y = 130 + r*7;
    px(22,y,44,4,'#6a4e2e');
    px(22,y,44,1,'#5a3e24');
    px(24,y+2,40,1,'#7a5e3a');
  }
  for(let i=0;i<6;i++){
    px(27+i*7, 128+(i%3)*7, 2, 2, S.grass);
  }
  /* espantapájaros (a veces con cuervo confianzudo) */
  px(112,130,2,28,'#8a6a3a');
  px(105,136,16,2,'#8a6a3a');
  px(109,127,8,7,'#e8d8a0');
  px(110,129,2,1,K); px(114,129,2,1,K);
  px(108,124,10,3,'#a03030');
  px(107,126,12,1,K);
  if(Math.floor(t/900)%5===0){ px(104,132,3,2,'#2a2438'); px(103,131,1,1,'#2a2438'); }
  /* girasoles */
  for(const gx of [141,148]){
    px(gx,140,1,16,'#57a05e');
    px(gx-2,135,5,5,'#ffd94a');
    px(gx-1,136,3,3,'#8a6a10');
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
  const arrowR = ()=>{
    px(146,178,14,4,'rgba(190,182,160,0.75)');
    px(150,184,10,3,'rgba(190,182,160,0.55)');
    drawText('>', 152, 170, blink ? '#ffd94a' : 'rgba(246,239,224,0.9)');
    const al = zoneAlertDir(1);
    if(al && blink) drawTextC('!', 154, 158, al);
  };
  const arrowL = ()=>{
    px(0,178,14,4,'rgba(190,182,160,0.75)');
    px(0,184,10,3,'rgba(190,182,160,0.55)');
    drawText('<', 4, 170, blink ? '#ffd94a' : 'rgba(246,239,224,0.9)');
    const al = zoneAlertDir(-1);
    if(al && blink) drawTextC('!', 6, 158, al);
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
  for(const s of UI.sparkles){
    if((s.zone||'prado')!==G.zone) continue;
    const bob = Math.sin(t/300 + s.t)*2;
    const y = s.y + bob;
    const blink = Math.floor(t/200 + s.t)%3;
    const col = blink===0 ? '#fff8d0' : '#ffd94a';
    px(s.x, y-3, 1, 7, col);
    px(s.x-3, y, 7, 1, col);
    px(s.x-1, y-1, 3, 3, col);
    px(s.x, y, 1, 1, '#ffffff');
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
    ctx.fillStyle='rgba(20,30,70,0.15)'; ctx.fillRect(0,0,160,196);
    /* salpicaduras en el estanque */
    if(G.up.jardin>=3 && Math.floor(t/120)%3===0){
      const rx2 = 22+((t*0.37)|0)%22, ry2 = 180+((t*0.13)|0)%8;
      px(rx2-1, ry2, 3, 1, 'rgba(190,232,248,0.7)');
      px(rx2, ry2-1, 1, 1, 'rgba(190,232,248,0.7)');
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
