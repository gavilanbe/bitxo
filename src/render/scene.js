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
/* estrellas de ascensos anteriores: posiciones deterministas */
function legacyStarPos(i){
  return { x: (i*53+23)%150+5, y: (i*37+11)%70+8 };
}

function drawScene(t){
  const ph = dayPhase(), S = SKY[ph];
  px(0,0,160,50,S.bands[0]);
  px(0,50,160,35,S.bands[1]);
  px(0,85,160,35,S.bands[2]);

  if(ph==='night'){
    for(const st of stars){
      if(Math.sin(t/600 + st.t)>0.2) px(st.x, st.y, 1,1, '#dfe8ff');
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

  /* decoración base + jardín */
  const deco = [[14,182,'#e2574c'],[52,190,'#ffd94a'],[96,186,'#f2a2b8'],[136,180,'#e2574c']];
  if(G.up.jardin>=1) deco.push([30,166,'#ffd94a'],[118,168,'#f2a2b8'],[70,176,'#6db1ff'],[144,192,'#ffd94a'],[8,170,'#f2a2b8']);
  for(const d of deco){
    px(d[0],d[1]-3,1,3,S.grass2);
    px(d[0]-1,d[1]-5,3,2,d[2]);
    px(d[0],d[1]-6,1,1,d[2]);
  }
  for(let i=0;i<8;i++){ px((i*37+11)%160, 130+(i*23)%60, 2,1, S.grass2); }

  if(G.up.jardin>=2){ ctx.drawImage(SPR.shroom, 134, 128); }
  if(G.up.jardin>=3){
    /* estanque */
    px(8,178,34,12,'#3a6bb0'); px(10,176,30,2,'#3a6bb0'); px(10,190,30,2,'#3a6bb0');
    px(12,180,26,8,'#5e9be0');
    const sh = Math.floor(t/700)%2;
    px(16+sh*6,182,6,1,'#bde8f8'); px(26,186,5,1,'#bde8f8');
  }
  if(G.up.jardin>=4){
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
}

function drawSparkles(t){
  for(const s of UI.sparkles){
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
function drawWeather(t){
  if(WEATHER.kind==='rain'){
    ctx.fillStyle='rgba(20,30,70,0.15)'; ctx.fillRect(0,0,160,196);
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
