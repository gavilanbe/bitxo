"use strict";
/* =========================================================
   BITXO — render/screens/collection: álbum, árbol, logros, reliquias,
   bestiario, dinastía, diario e informes. Construido sobre el kit v2
   (render/uikit.js). Cada pantalla tiene una función de LAYOUT pura que
   usan tanto el dibujo como el toque (los tests tocan sin dibujar).
   ========================================================= */

/* ================= utilidades locales (co_) ================= */
const co_now = ()=>performance.now();
const co_blink = (ms)=>Math.floor(co_now()/(ms||400))%2===0;
/* icono con contorno automático: fn(P, C) pinta el relleno; el borde K sale solo */
function co_mk(w, h, fn){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const P = (x,y,ww,hh,col)=>{ g.fillStyle = col; g.fillRect(x, y, ww||1, hh||1); };
  const C = (cx,cy,r,col)=>{ g.fillStyle = col; for(let yy=-Math.ceil(r); yy<=Math.ceil(r); yy++) for(let xx=-Math.ceil(r); xx<=Math.ceil(r); xx++) if(xx*xx+yy*yy <= r*r+r*0.6) g.fillRect(Math.round(cx+xx), Math.round(cy+yy), 1, 1); };
  fn(P, C);
  const d = g.getImageData(0, 0, w, h).data, out = [];
  const on = (x,y)=> x>=0 && y>=0 && x<w && y<h && d[(y*w+x)*4+3] > 0;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(!on(x,y) && (on(x-1,y)||on(x+1,y)||on(x,y-1)||on(x,y+1))) out.push(x,y);
  g.fillStyle = K; for(let i=0;i<out.length;i+=2) g.fillRect(out[i], out[i+1], 1, 1);
  return c;
}
/* dibuja un canvas centrado en (cx,cy) con escala entera */
function co_img(img, cx, cy, sc){
  sc = sc||1;
  const w = img.width*sc, h = img.height*sc;
  if(sc===1){ ctx.drawImage(img, Math.round(cx-w/2), Math.round(cy-h/2)); return; }
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(cx-w/2), Math.round(cy-h/2), w, h);
  ctx.restore();
}
/* marco "vitrina": caja con borde, luz arriba y canto abajo */
function co_frame(x, y, w, h, bg, rim, hi, lo){
  uiBox(x, y, w, h, bg, rim||K);
  px(x+1, y+1, w-2, 1, hi||'rgba(255,255,255,0.5)');
  px(x+1, y+h-2, w-2, 1, lo||'rgba(26,20,40,0.12)');
}
/* esquinas de selección que laten */
function co_corners(x, y, w, h, col){
  const o = co_blink(260) ? 1 : 0;
  x -= o; y -= o; w += o*2; h += o*2;
  px(x-1,y-1,4,1,col); px(x-1,y-1,1,4,col);
  px(x+w-3,y-1,4,1,col); px(x+w,y-1,1,4,col);
  px(x-1,y+h,4,1,col); px(x-1,y+h-3,1,4,col);
  px(x+w-3,y+h,4,1,col); px(x+w,y+h-3,1,4,col);
}
/* chip de texto (x izquierda) */
function co_chip(x, y, s, bg, fg, rim){
  const w = textW(s)+6;
  uiBox(x, y, w, 9, bg, rim||uiDark(bg, 0.45));
  px(x+1, y+1, w-2, 1, 'rgba(255,255,255,0.35)');
  drawText(s, x+3, y+2, fg||K);
  return x+w;
}
/* silueta teñida (cacheada) */
const _coTint = new Map();
function co_tint(img, col){
  const k = col; let m = _coTint.get(img); if(!m){ m = {}; _coTint.set(img, m); }
  if(m[k]) return m[k];
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  return (m[k] = c);
}
/* toque fuera del panel activo */
function co_outside(x, y, r){ return !(x>=r.x && x<r.x+r.w && y>=r.y && y<r.y+r.h); }
/* hoja de página */
SFX.coPage = function(){
  nz(sfxAt(0), 0.07, 0.022, 2600, 0.9, 5200);
  tone({f:520, slide:760, d:0.05, type:'p125', vol:0.02});
};
SFX.coSelect = function(){ tone({f:880, slide:1180, d:0.05, type:'p25', vol:0.03}); };

/* ================= iconos propios ================= */
const CO_IC = {};
(function co_buildIcons(){
  /* --- reliquias (12x12) --- */
  CO_IC.trebol = co_mk(12,12,(P)=>{
    const leaf = (x,y)=>{ P(x+1,y,2,1,'#ffd94a'); P(x,y+1,4,2,'#ffd94a'); P(x+1,y+3,2,1,'#ffd94a'); P(x+1,y+1,1,1,'#fff3a8'); };
    leaf(1,1); leaf(6,1); leaf(1,6); leaf(6,6);
    P(4,4,3,3,'#c8a04b'); P(5,5,1,1,'#8a6a10'); P(8,10,1,1,'#3a7048'); P(9,11,1,1,'#3a7048');
  });
  CO_IC.campanilla = co_mk(12,12,(P)=>{
    P(5,1,2,1,'#c8a04b'); P(4,2,4,1,'#f0c030'); P(3,3,6,4,'#f0c030'); P(2,7,8,2,'#f0c030');
    P(4,3,1,4,'#fff3a8'); P(3,8,6,1,'#c8a04b'); P(5,9,2,2,'#8a6a10');
  });
  CO_IC.pluma = co_mk(12,12,(P)=>{
    for(let i=0;i<7;i++) P(3+i, 7-i, 2, 2, '#e2574c');
    for(let i=0;i<5;i++) P(4+i, 8-i, 1, 1, '#a03030');
    P(9,1,1,1,'#f59088');
    for(let i=0;i<4;i++) P(1+i, 10-i, 1, 1, '#f6efe0');
  });
  CO_IC.caracola = co_mk(12,12,(P,C)=>{
    C(5,6,3.6,'#f2c0b0');
    [[5,6],[6,6],[6,5],[5,4],[4,4],[3,5],[3,6],[3,7],[4,8],[5,8],[6,8],[7,7],[8,6]].forEach(q=>P(q[0],q[1],1,1,'#c07860'));
    P(9,8,2,2,'#f2c0b0'); P(3,3,1,1,'#ffffff');
  });
  CO_IC.seta = co_mk(12,12,(P)=>{
    P(4,1,4,1,'#8a6ae8'); P(2,2,8,1,'#8a6ae8'); P(1,3,10,3,'#8a6ae8');
    P(3,2,1,1,'#ffffff'); P(7,3,2,1,'#ffffff'); P(3,4,1,1,'#ffffff'); P(5,3,1,1,'#b09af0');
    P(1,5,10,1,'#5a3fb0');
    P(4,6,4,4,'#f6efe0'); P(4,6,1,4,'#fffaf0'); P(7,6,1,4,'#d8ccb0'); P(3,10,6,1,'#7ac74f');
  });
  CO_IC.lagrima = co_mk(12,12,(P,C)=>{
    P(5,1,2,2,'#5ec8d8'); P(4,3,4,2,'#5ec8d8'); C(5.5,7,3,'#5ec8d8');
    P(4,6,1,2,'#ffffff'); P(5,5,1,1,'#bfeef5'); P(6,9,2,1,'#3a78a8'); P(8,7,1,2,'#3a78a8');
  });
  CO_IC.hueso = co_mk(12,12,(P,C)=>{
    for(let i=0;i<6;i++) P(3+i, 7-i, 2, 2, '#f6efe0');
    C(2,8,1.2,'#f6efe0'); C(3,10,1.2,'#f6efe0'); C(8,1,1.2,'#f6efe0'); C(10,3,1.2,'#f6efe0');
    for(let i=0;i<5;i++) P(4+i, 8-i, 1, 1, '#c8c0b0');
  });
  CO_IC.cristal = co_mk(12,12,(P)=>{
    P(5,1,2,1,'#7ac74f'); P(4,2,4,1,'#7ac74f'); P(3,3,6,2,'#7ac74f'); P(2,5,8,2,'#7ac74f');
    P(3,7,6,1,'#7ac74f'); P(4,8,4,1,'#7ac74f'); P(5,9,2,1,'#7ac74f');
    P(4,3,1,3,'#c8f0a0'); P(5,2,1,1,'#ffffff'); P(8,5,1,2,'#3a7048'); P(6,7,2,1,'#3a7048'); P(5,8,2,1,'#3a7048');
  });
  CO_IC.corona = co_mk(12,12,(P)=>{
    P(1,3,2,3,'#7ac74f'); P(5,2,2,4,'#7ac74f'); P(9,3,2,3,'#7ac74f');
    P(1,6,10,3,'#5a9a3a'); P(1,6,10,1,'#9adf70'); P(5,7,2,1,'#ffd94a'); P(2,7,1,1,'#f2a2b8'); P(9,7,1,1,'#f2a2b8');
    P(5,1,1,1,'#c8f0a0'); P(2,8,8,1,'#3a7048');
  });
  CO_IC.ojo = co_mk(12,12,(P)=>{
    P(4,3,4,1,'#f0a04b'); P(3,4,6,1,'#f0a04b'); P(2,5,8,2,'#f0a04b'); P(3,7,6,1,'#f0a04b'); P(4,8,4,1,'#f0a04b');
    P(4,4,4,4,'#ffd94a'); P(5,3,2,6,'#ffd94a'); P(5,4,1,4,K); P(6,4,1,4,'#6a2a10'); P(4,4,1,1,'#ffffff');
  });
  /* --- extras (12x12) --- */
  CO_IC.crown = co_mk(12,12,(P)=>{
    P(1,3,1,1,'#ffd94a'); P(5,1,2,1,'#ffd94a'); P(10,3,1,1,'#ffd94a');
    P(1,4,2,2,'#ffd94a'); P(4,2,4,4,'#ffd94a'); P(9,4,2,2,'#ffd94a');
    P(1,6,10,3,'#ffd94a'); P(1,8,10,1,'#c8a04b'); P(5,6,2,2,'#e2574c'); P(2,6,1,1,'#5ec8d8'); P(9,6,1,1,'#5ec8d8'); P(5,2,1,1,'#fff3a8');
  });
  CO_IC.skull = co_mk(12,12,(P,C)=>{
    C(5.5,5,3.8,'#f6efe0'); P(3,8,6,2,'#f6efe0');
    P(3,5,2,2,'#3b3552'); P(7,5,2,2,'#3b3552'); P(5,8,1,1,'#c8c0b0'); P(4,10,1,1,'#c8c0b0'); P(7,10,1,1,'#c8c0b0');
  });
  CO_IC.house = co_mk(12,12,(P)=>{
    for(let i=0;i<5;i++) P(5-i, 1+i, 2+i*2, 1, '#e2574c');
    P(1,5,10,1,'#a03030'); P(2,6,8,4,'#f6efe0'); P(5,7,2,3,'#b07a44'); P(3,7,1,1,'#5ec8d8'); P(8,7,1,1,'#5ec8d8');
  });
  CO_IC.egg = co_mk(12,12,(P,C)=>{
    P(5,1,2,1,'#f6efe0'); P(4,2,4,2,'#f6efe0'); C(5.5,6.5,3.3,'#f6efe0');
    P(4,4,2,1,'#7ac74f'); P(7,6,2,2,'#7ac74f'); P(3,8,2,1,'#7ac74f'); P(4,2,1,2,'#ffffff');
  });
  CO_IC.chain = co_mk(12,12,(P)=>{
    P(1,4,4,4,'#b4b4bc'); P(2,5,2,2,'rgba(0,0,0,0)'); P(4,5,4,2,'#6a6a78'); P(7,4,4,4,'#b4b4bc');
    P(1,4,4,1,'#e4e4ea'); P(7,4,4,1,'#e4e4ea');
    ['#ffd94a'].forEach(c=>{ P(9,1,1,1,c); P(10,2,1,1,c); P(2,10,1,1,c); });
  });
  CO_IC.pill = co_mk(12,12,(P)=>{
    P(2,5,4,3,'#f6efe0'); P(6,5,4,3,'#e2574c'); P(3,4,6,1,'#f6efe0'); P(3,8,6,1,'#a03030'); P(6,4,3,1,'#e2574c');
    P(3,5,2,1,'#ffffff');
  });
  CO_IC.fish = SPR.pescado || CO_IC.egg;
  /* --- elementos (≈9x9) --- */
  const E = (rows, pal)=>mkSprite(Object.assign({k:K}, pal), rows);
  CO_IC.el_pradera = E([".....kkk.","...kkgggk","..kggglgk",".kgglggk.",".kglggk..","kglgkk...","klkk.....","kk......."], {g:'#7ac74f', l:'#3a7048'});
  CO_IC.el_brasa = E(["...k.....","..krk....","..krrk.k.",".krrrkrk.",".krryrrk.","krryyyrk.","kryywyrk.",".krryrk..","..kkkk..."], {r:'#e2574c', y:'#ffd94a', w:'#ffffff'});
  CO_IC.el_marea = E(["....k....","...kbk...","...kbk...","..kbbbk..",".kbwbbbk.",".kwbbbbk.",".kbbbbBk.","..kBBBk..","...kkk..."], {b:'#5ec8d8', B:'#3a78a8', w:'#ffffff'});
  CO_IC.el_petrea = E(["...kkkk..","..kssSsk.",".kswssSk.","kssssSSk.","ksSssSSk.","kSSSSSSk.",".kkkkkk.."], {s:'#b4b4bc', S:'#6a6a78', w:'#ffffff'});
  CO_IC.el_astro = UIIC.star;
  CO_IC.el_fungo = E(["..kkkkk..",".krrwrrk.","krwrrrwrk","krrrrrrrk",".kkcckkk.","...kck...","...kck...","..kkkkk.."], {r:'#c9743a', w:'#f6efe0', c:'#f6efe0'});
  CO_IC.el_voltio = UIIC.vel;
  CO_IC.el_sombra = E(["..kkk....",".kppk....","kppk.....","kppk.....","kppk.....","kpppk....",".kpppkk..","..kkkk..."], {p:'#9d7bd8'});
  CO_IC.el_neutral = E(["..kkkk..",".kcccck.","kccwccck","kcccccck","kcccccck",".kcccck.","..kkkk.."], {c:'#c8c0b0', w:'#ffffff'});
})();
const ELEM_NAME = {pradera:'PLANTA', brasa:'FUEGO', marea:'AGUA', petrea:'ROCA', astro:'ASTRAL', fungo:'HONGO', voltio:'RAYO', sombra:'SOMBRA', neutral:'NEUTRO'};
const CO_STAGE = {
  egg:{t:'HUEVO', c:'#c8c0b0'}, baby:{t:'BEBE', c:'#f2a2b8'}, child:{t:'JOVEN', c:'#5ec8d8'},
  adult:{t:'ADULTO', c:'#8a6ae8'}, legend:{t:'LEYENDA', c:'#ffd94a'}, grimo:{t:'SOMBRA', c:'#6a5f8c'}
};
function co_stageOf(slot){
  if(slot==='egg') return 'egg';
  if(slot==='grimo') return 'grimo';
  if(slot==='adultS') return 'legend';
  return slot.slice(0, slot.length-1);
}

/* ================= ÁLBUM: libro de colección ================= */
/* pestañas: las 7 líneas + la página secreta (GRIMO) */
function albumLayout(){
  const tabs = [];
  const n = LINE_KEYS.length + 1;
  for(let i=0;i<n;i++) tabs.push({x:8 + i*18, y:43, w:17, h:17});
  const slots = [];
  for(let i=0;i<SLOT_KEYS.length;i++){
    const c = i%3, r = Math.floor(i/3);
    slots.push({x:8 + c*49, y:83 + r*44, w:46, h:42, slot:SLOT_KEYS[i]});
  }
  return {panel:{x:4, y:22, w:152, h:236}, tabs, slots, grimo:{x:52, y:84, w:56, h:56}};
}
function albumPage(){
  if(UI.albumPage===undefined || UI.albumPage===null){
    const i = LINE_KEYS.indexOf(AP().line);
    UI.albumPage = AP().form==='grimo' ? LINE_KEYS.length : Math.max(0, i);
  }
  return UI.albumPage;
}
function co_lineDone(ln){ let n=0; for(const s of SLOT_KEYS) if(G.dex[ln+'_'+s]) n++; return n; }
/* próximo premio de colección */
function co_albumNext(){
  const dx = dexCount();
  const half = Math.ceil(DEX_TOTAL/2);
  const M = [
    {n:10, t:'LOGRO COLECCIONISTA +300✦', ok:!!G.ach.col10},
    {n:25, t:'LOGRO ENCICLOPEDIA +1★', ok:!!G.ach.col25},
    {n:half, t:'+1 POLVO AL ASCENDER', ok:dx>=half},
    {n:DEX_TOTAL, t:'+1 POLVO MAS AL ASCENDER', ok:dx>=DEX_TOTAL}
  ].filter(m=>!m.ok && m.n>dx).sort((a,b)=>a.n-b.n);
  return M[0] ? {left:M[0].n-dx, n:M[0].n, t:M[0].t} : null;
}
function drawAlbum(){
  const L = albumLayout();
  const page = albumPage();
  const c = uiPanel({x:L.panel.x, y:L.panel.y, w:L.panel.w, h:L.panel.h, title:'ALBUM', icon:'album', color:'collection', right:dexCount()+'/'+DEX_TOTAL});
  /* pestañas con el huevo de cada línea */
  px(8, 59, 144, 1, 'rgba(26,20,40,0.2)');
  L.tabs.forEach((r, i)=>{
    const on = i===page;
    const isG = i===LINE_KEYS.length;
    const ln = LINE_KEYS[i];
    const col = isG ? '#6a5f8c' : LINES[ln].eggSpot;
    const open = isG ? !!G.dex.grimo : LINES[ln].unlock(G);
    const sink = uiPressed('altab'+i);
    const yy = on ? r.y-1+sink : r.y+2;
    const hh = on ? r.h+1 : r.h-2;
    if(on){
      uiBox(r.x, yy, r.w, hh, col, K);
      px(r.x+1, yy+1, r.w-2, 1, uiLight(col, 0.5));
      px(r.x+1, yy+hh-1, r.w-2, 1, col);
    } else {
      uiBox(r.x, yy, r.w, hh, '#d3c8ac', '#8a7e68');
      px(r.x+1, yy+hh-2, r.w-2, 1, uiDark(col, 0.1));
    }
    const cx = r.x + r.w/2, cy = yy + Math.round(hh/2);
    if(isG){
      const g = SPR.grimo[0];
      ctx.save(); ctx.beginPath(); ctx.rect(r.x+1, yy+1, r.w-2, hh-2); ctx.clip();
      ctx.drawImage(open ? g : darkSilhouette(g), Math.round(cx-g.width/2), yy+2);
      ctx.restore();
      if(!open) drawTextC('?', cx, cy-2, '#f6efe0');
    } else {
      const eg = SPR['egg_'+ln][0];
      if(!on) ctx.globalAlpha = open ? 0.8 : 0.45;
      co_img(eg, cx, cy);
      ctx.globalAlpha = 1;
      /* completada: estrellita */
      if(co_lineDone(ln)===SLOT_KEYS.length){ px(r.x+r.w-4, yy+1, 3, 3, '#ffd94a'); px(r.x+r.w-4, yy+1, 3, 1, '#fff3a8'); }
      if(!open) uiLock(r.x+r.w-6, yy+hh-8, '#6a6072');
    }
  });
  if(page===LINE_KEYS.length){ co_albumGrimo(L); co_albumFooter(); return; }
  const ln = LINE_KEYS[page], LN = LINES[ln];
  const open = LN.unlock(G);
  /* cabecera de la página */
  uiStag(0, ()=>{
    drawTextO(LN.name, 10, 64, LN.eggSpot, 1, K);
    const bx = badge(152, 63, {text:open ? LN.bonus : LN.hint, bg:open ? uiLight(LN.eggSpot, 0.6) : '#cfc6b0', fg:open ? uiDark(LN.eggSpot, 0.6) : '#6a6072', rim:open ? uiDark(LN.eggSpot, 0.2) : '#a89c84', lock:!open});
    void bx;
    const done = co_lineDone(ln);
    const k = done/SLOT_KEYS.length;
    const kv = uiCount('alb'+ln, Math.round(k*100))/100;
    px(10, 74, 110, 5, 'rgba(26,20,40,0.2)');
    const fw = Math.round(110*kv);
    if(fw>0){ px(10, 74, fw, 5, done===SLOT_KEYS.length ? '#ffd94a' : LN.eggSpot); px(10, 74, fw, 1, 'rgba(255,255,255,0.5)'); }
    for(let q=1;q<9;q++) px(10+Math.round(110*q/9), 75, 1, 4, 'rgba(26,20,40,0.12)');
    const s = done+'/'+SLOT_KEYS.length;
    drawText(s, 150-textW(s), 74, done===SLOT_KEYS.length ? UIC.goldTx : K);
  });
  /* ranuras de formas */
  const cur = evoKeyOf(AP());
  L.slots.forEach((r, i)=>{
    uiStag(i+1, ()=>{
      const key = ln+'_'+r.slot;
      const seen = !!G.dex[key];
      const st = CO_STAGE[co_stageOf(r.slot)];
      const sink = uiPressed('alslot'+i);
      const y = r.y + sink;
      if(!sink) px(r.x+1, r.y+r.h, r.w-2, 1, 'rgba(26,20,40,0.2)');
      const leg = r.slot==='adultS';
      co_frame(r.x, y, r.w, r.h, seen ? (leg ? '#fff4c8' : UIC.card) : '#d6ccb2', leg ? '#8a6a10' : K, seen ? UIC.cardHi : 'rgba(255,255,255,0.2)');
      px(r.x+1, y+1, r.w-2, 2, st.c);
      px(r.x+1, y+3, r.w-2, 1, uiDark(st.c, 0.25));
      /* peana */
      px(r.x+10, y+30, r.w-20, 2, seen ? 'rgba(26,20,40,0.12)' : 'rgba(26,20,40,0.08)');
      const spr = SPR[key][0];
      const sy = y + 31 - spr.height;
      if(seen){
        const bob = (cur===key && co_blink(500)) ? -1 : 0;
        ctx.drawImage(spr, Math.round(r.x + r.w/2 - spr.width/2), sy + bob);
      } else {
        ctx.globalAlpha = 0.85; ctx.drawImage(darkSilhouette(spr), Math.round(r.x + r.w/2 - spr.width/2), sy); ctx.globalAlpha = 1;
        drawTextC('?', r.x + r.w/2, sy + Math.round(spr.height/2) - 2, '#f6efe0');
      }
      const nm = seen ? LN.names[r.slot] : '?????';
      drawTextC(uiFit(nm, r.w-4), r.x + r.w/2, y+34, seen ? K : UIC.faint);
      if(leg){ px(r.x+2, y+5, 1, 1, '#ffd94a'); px(r.x+r.w-3, y+5, 1, 1, '#ffd94a'); }
      if(cur===key) co_chip(r.x+r.w-15, y+4, 'TU', '#7ac74f', '#ffffff', '#3a7048');
      const gl = uiPressGlow('alslot'+i);
      if(gl>0){ ctx.globalAlpha = gl*0.4; uiBox(r.x, y, r.w, r.h, '#ffffff'); ctx.globalAlpha = 1; }
    });
  });
  co_albumFooter();
}
function co_albumGrimo(L){
  const g = L.grimo, seen = !!G.dex.grimo;
  uiStag(0, ()=>{
    drawTextO('PAGINA SECRETA', 10, 64, '#9d7bd8', 1, K);
    const s = (seen?1:0)+'/1';
    drawText(s, 150-textW(s), 64, seen ? UIC.goldTx : K);
    px(10, 74, 140, 1, 'rgba(26,20,40,0.15)');
  });
  uiStag(1, ()=>{
    const sink = uiPressed('algrimo');
    co_frame(g.x, g.y+sink, g.w, g.h, seen ? '#3b3552' : '#2a2540', K, '#5a5078');
    const sp = SPR.grimo[0];
    co_img(seen ? sp : darkSilhouette(sp), g.x+g.w/2, g.y+g.h/2+sink, 2);
    if(!seen) drawTextOC('?', g.x+g.w/2, g.y+g.h/2-5+sink, '#f6efe0', 2, K);
    drawTextC(seen ? 'GRIMO' : '?????', 80, g.y+g.h+5, seen ? K : UIC.faint);
    if(seen) drawTextC(FORM_DESC.grimo, 80, g.y+g.h+13, '#6a5f8c');
  });
  uiStag(2, ()=>{
    const y = 170;
    uiBox(12, y, 136, 36, '#e2d8c0', '#b8a98a');
    drawTextC('APARECE CUANDO...', 80, y+4, UIC.muted);
    drawTextC(EVO_REQS.grimo[0], 80, y+13, UIC.redTx);
    drawTextC(EVO_REQS.grimo[1], 80, y+21, UIC.muted);
  });
}
function co_albumFooter(){
  uiStag(11, ()=>{
    const y = 218;
    uiBox(8, y, 144, 32, '#efe6cc', '#b8a98a');
    px(9, y+1, 142, 1, '#fbf6e6');
    const nx = co_albumNext();
    ctx.drawImage(UIIC.trofeo, 13, y+11);
    if(nx){
      drawText('PROXIMO PREMIO: '+nx.n+' FORMAS', 27, y+5, UIC.muted);
      drawText(uiFit(nx.t, 120), 27, y+13, UIC.goldTx);
      drawText('TE FALTAN '+nx.left, 27, y+21, UIC.faint);
    } else {
      drawText('¡ALBUM COMPLETO!', 27, y+9, UIC.goldTx);
      drawText('ERES TODA UNA LEYENDA', 27, y+17, UIC.muted);
    }
  });
}

/* ================= ÁRBOL EVOLUTIVO (estilo Digimon World) ================= */
const EVO_NODES = [
  {slot:'egg',    x:16,  y:100},
  {slot:'babyA',  x:46,  y:74},  {slot:'babyB',  x:46,  y:128},
  {slot:'childA', x:82,  y:74},  {slot:'childB', x:82,  y:128},
  {slot:'adultA', x:134, y:52},  {slot:'adultB', x:134, y:78},
  {slot:'adultS', x:134, y:104},
  {slot:'adultC', x:134, y:130}, {slot:'adultD', x:134, y:156},
  {slot:'grimo',  x:16,  y:146}
];
/* color del requisito de cada rama */
const EVO_COL = {babyA:'#c8b078', babyB:'#c8b078', childA:'#e2574c', childB:'#7ac74f',
  adultA:'#e2574c', adultB:'#4a90d8', adultS:'#ffd94a', adultC:'#5ec8d8', adultD:'#7ac74f', grimo:'#6a5f8c'};
function evoNodeSize(slot){ return slot.startsWith('adult') ? 24 : (slot==='egg' ? 18 : 20); }
function evoSprite(ln, slot){
  if(slot==='egg') return SPR['egg_'+ln][0];
  if(slot==='grimo') return SPR.grimo[0];
  return SPR[ln+'_'+slot][0];
}
function evoKey(ln, slot){
  if(slot==='egg') return null;
  if(slot==='grimo') return 'grimo';
  return ln+'_'+slot;
}
function evoLayout(){
  return {panel:{x:2, y:22, w:156, h:244}, prev:{x:4, y:22, w:20, h:18}, next:{x:136, y:22, w:22, h:18},
    back:{x:5, y:158, w:40, h:11}};
}
/* barras de progreso hacia la forma elegida */
function co_evoBars(slot, p){
  const lv = (n)=>({l:'NV', v:p.level||1, n, c:'#8a6ae8'});
  const tr = (p.str||0)+(p.def||0)+(p.spd||0);
  const cs = Math.round(careScore(p));
  switch(slot){
    case 'childA': return [lv(EVO_LEVEL.child), {l:'ENT', v:tr, n:4, c:'#e2574c'}, {l:'CUI', v:cs, n:65, c:'#7ac74f'}];
    case 'childB': return [lv(EVO_LEVEL.child), {l:'CUI', v:cs, n:35, c:'#7ac74f'}];
    case 'adultA': return [lv(EVO_LEVEL.adult), {l:'FUE', v:p.str||0, n:5, c:'#e2574c'}, {l:'DEF', v:p.def||0, n:Math.max(1,p.str||0), c:'#4a90d8', inv:true}];
    case 'adultB': return [lv(EVO_LEVEL.adult), {l:'DEF', v:p.def||0, n:Math.max(1,p.str||0), c:'#4a90d8'}, {l:'FUE', v:p.str||0, n:5, c:'#e2574c', inv:true}];
    case 'adultC': return [lv(EVO_LEVEL.adult), {l:'VEL', v:p.spd||0, n:5, c:'#5ec8d8'}, {l:'JUE', v:p.gamesWon||0, n:3, c:'#f0a04b'}];
    case 'adultD': return [lv(EVO_LEVEL.adult), {l:'CUI', v:cs, n:35, c:'#7ac74f'}];
    case 'adultS': return [{l:'FUE', v:p.str||0, n:5, c:'#e2574c'}, {l:'DEF', v:p.def||0, n:5, c:'#4a90d8'}, {l:'VEL', v:p.spd||0, n:5, c:'#5ec8d8'},
                           {l:'CUI', v:cs, n:80, c:'#7ac74f'}, {l:'JUE', v:p.gamesWon||0, n:5, c:'#f0a04b'}, {l:'FAL', v:Math.max(0,1-(p.mistakes||0)), n:1, c:'#a03030'}];
    case 'grimo':  return [{l:'FAL', v:p.mistakes||0, n:5, c:'#6a5f8c'}];
  }
  return null;
}
function drawEvoTree(){
  const ln = LINE_KEYS[UI.evoLine||0];
  const L = LINES[ln];
  const Y = evoLayout();
  uiPanel({x:Y.panel.x, y:Y.panel.y, w:Y.panel.w, h:Y.panel.h, title:'', color:'collection'});
  /* cabecera: < LINEA X > */
  const hd = UI.panelHead;
  drawTextOC('LINEA '+L.name, 80, hd.y+5, '#ffffff', 1, uiDark(UI_CAT.collection, 0.55));
  [['<', Y.prev, 'evprev'], ['>', Y.next, 'evnext']].forEach(([s, r, k])=>{
    const dn = uiPressed(k);
    const bx = r===Y.prev ? 7 : 141;
    uiBox(bx, hd.y+2+dn, 12, 11, '#6a50c8', K);
    px(bx+1, hd.y+3+dn, 10, 1, '#b09af0');
    drawText(s, bx+4, hd.y+5+dn, '#ffffff');
  });
  /* leyenda de colores */
  const lg = [['FUE','#e2574c'],['DEF','#4a90d8'],['VEL','#5ec8d8'],['CUIDA','#7ac74f']];
  lg.forEach((q,i)=>{ px(6, 45+i*7, 4, 4, q[1]); px(6, 45+i*7, 4, 1, 'rgba(255,255,255,0.5)'); drawText(q[0], 12, 44+i*7, UIC.muted); });
  /* ---- conexiones ---- */
  const seenOf = (slot)=>{ const k = evoKey(ln, slot); return !k || !!G.dex[k]; };
  const seg = (x, y, w, h, col, slot)=>{
    const s = !slot || seenOf(slot);
    if(s){ px(x, y, w, h, col); }
    else { ctx.fillStyle = col; ctx.globalAlpha = 0.55; for(let i=0;i<Math.max(w,h);i+=3) ctx.fillRect(w>h ? x+i : x, w>h ? y : y+i, w>h ? Math.min(2,w-i) : w, w>h ? h : Math.min(2,h-i)); ctx.globalAlpha = 1; }
  };
  const nb = '#a89c80';
  /* huevo → bebés (suerte) */
  seg(25, 100, 6, 2, nb); seg(30, 74, 2, 56, nb);
  seg(30, 74, 6, 2, EVO_COL.babyA, 'babyA'); seg(30, 128, 6, 2, EVO_COL.babyB, 'babyB');
  /* bebés → bus → jóvenes */
  seg(56, 74, 8, 2, nb); seg(56, 128, 8, 2, nb); seg(63, 74, 2, 56, nb);
  seg(64, 74, 8, 2, EVO_COL.childA, 'childA'); seg(64, 128, 8, 2, EVO_COL.childB, 'childB');
  /* jóvenes → adultos */
  seg(92, 74, 12, 2, nb); seg(103, 52, 2, 54, nb);
  seg(92, 128, 18, 2, nb); seg(109, 104, 2, 54, nb);
  seg(104, 52, 18, 2, EVO_COL.adultA, 'adultA');
  seg(104, 78, 18, 2, EVO_COL.adultB, 'adultB');
  seg(104, 104, 18, 2, EVO_COL.adultS, 'adultS');
  seg(110, 130, 12, 2, EVO_COL.adultC, 'adultC');
  seg(110, 156, 12, 2, EVO_COL.adultD, 'adultD');
  /* el abandono: línea punteada hacia GRIMO */
  ctx.fillStyle = EVO_COL.grimo;
  for(let yy=130; yy<146; yy+=3) ctx.fillRect(63, yy, 2, 2);
  for(let xx=26; xx<64; xx+=3) ctx.fillRect(xx, 146, 2, 2);
  /* ---- nodos ---- */
  const sel = UI.evoSel||0;
  const pcur = AP();
  const mine = ln===pcur.line || pcur.form==='grimo';
  const curKey = evoKeyOf(pcur);
  const nx2 = mine ? predictNext(pcur) : null;
  const tags = [];
  for(let i=0;i<EVO_NODES.length;i++){
    const nd = EVO_NODES[i];
    const key = evoKey(ln, nd.slot);
    const seen = !key || !!G.dex[key];
    const spr = evoSprite(ln, nd.slot);
    const s = evoNodeSize(nd.slot);
    const sink = uiPressed('evnode'+i);
    const x = nd.x - s/2, y = nd.y - s/2 + sink;
    const isCur = mine && key && key===curKey;
    const isNext = nx2 && nx2.key && nx2.key===key;
    const st = CO_STAGE[co_stageOf(nd.slot)];
    uiStag(i, ()=>{
      if(!sink) px(x+1, nd.y+s/2, s-2, 1, 'rgba(26,20,40,0.25)');
      const bg = seen ? (nd.slot==='adultS' ? '#fff4c8' : (nd.slot==='grimo' ? '#4a4264' : UIC.card)) : '#3b3552';
      const rim = isCur ? '#3a7048' : (i===sel ? '#8a6a10' : K);
      co_frame(x, y, s, s, bg, rim, seen ? 'rgba(255,255,255,0.6)' : '#524a70');
      px(x+1, y+s-2, s-2, 1, st.c);
      if(isCur){ px(x+1, y+1, 1, s-2, '#7ac74f'); px(x+s-2, y+1, 1, s-2, '#7ac74f'); }
      if(seen) ctx.drawImage(spr, Math.round(nd.x - spr.width/2), Math.round(nd.y - spr.height/2) + sink);
      else {
        ctx.globalAlpha = 0.9; ctx.drawImage(silhouette(spr), Math.round(nd.x - spr.width/2), Math.round(nd.y - spr.height/2) + sink);
        ctx.globalAlpha = 1;
        ctx.globalAlpha = 0.75; px(x+1, y+1, s-2, s-2, '#3b3552'); ctx.globalAlpha = 1;
        drawTextC('?', nd.x, nd.y-2+sink, '#ffe9a8');
      }
      if(i===sel) co_corners(x, y, s, s, '#e2574c');
      const gl = uiPressGlow('evnode'+i);
      if(gl>0){ ctx.globalAlpha = gl*0.45; uiBox(x, y, s, s, '#ffffff'); ctx.globalAlpha = 1; }
    });
    if(isCur) tags.push({nd, s, t:'AQUI', bg:'#7ac74f', rim:'#3a7048'});
    else if(isNext) tags.push({nd, s, t:'RUMBO', bg:'#ffd94a', rim:'#8a6a10', blink:true});
  }
  /* marcadores AQUI / RUMBO (encima de todo) */
  for(const tg of tags){
    if(tg.blink && !co_blink(450)) continue;
    const w = textW(tg.t)+6;
    let tx, ty;
    if(tg.nd.slot.startsWith('adult')){ tx = tg.nd.x - tg.s/2 - w - 1; ty = tg.nd.y - 4; }
    else { tx = Math.round(tg.nd.x - w/2); ty = tg.nd.y + tg.s/2 - 3; }
    co_chip(tx, ty, tg.t, tg.bg, K, tg.rim);
  }
  /* flujo animado hacia el RUMBO */
  if(nx2 && nx2.key){
    const nd = EVO_NODES.find(n=>evoKey(ln, n.slot)===nx2.key);
    if(nd){
      const s = evoNodeSize(nd.slot);
      const x1 = nd.x - s/2;
      const x0 = nd.slot.startsWith('adult') ? (nd.slot==='adultC'||nd.slot==='adultD' ? 110 : 104) : (nd.slot.startsWith('child') ? 64 : 30);
      const t = (co_now()/12) % Math.max(1, x1-x0);
      px(Math.round(x0+t), nd.y-1, 2, 4, '#ffffff');
    }
  }
  /* volver al álbum */
  { const b = Y.back; const dn = uiPressed('evback');
    uiBox(b.x, b.y+dn, b.w, b.h, '#d3c8ac', '#8a7e68'); px(b.x+1, b.y+1+dn, b.w-2, 1, '#efe6cc');
    drawText('<ALBUM', b.x+4, b.y+3+dn, UIC.muted); }
  /* ---- ficha del nodo elegido ---- */
  co_evoCard(ln, sel);
}
function co_evoCard(ln, sel){
  const L = LINES[ln];
  const nd = EVO_NODES[sel] || EVO_NODES[0];
  const key = evoKey(ln, nd.slot);
  const seen = !key || !!G.dex[key];
  const secret = (nd.slot==='adultS' || nd.slot==='grimo') && !seen;
  const st = CO_STAGE[co_stageOf(nd.slot)];
  const y0 = 172;
  uiStag(12, ()=>{
    card(5, y0, 150, 90);
    px(6, y0+1, 148, 2, st.c);
    /* retrato 2x */
    const bx = 9, by = y0+6, bs = 48;
    co_frame(bx, by, bs, bs, seen ? '#fbf6e6' : '#3b3552', K, seen ? '#ffffff' : '#524a70');
    px(bx+8, by+bs-6, bs-16, 2, 'rgba(26,20,40,0.12)');
    const spr = evoSprite(ln, nd.slot);
    const bob = Math.round(Math.sin(co_now()/300));
    if(seen) co_img(spr, bx+bs/2, by+bs/2 + (nd.slot==='egg' ? 0 : bob), 2);
    else if(secret) drawTextOC('?', bx+bs/2, by+bs/2-5, '#ffe9a8', 2, K);
    else { co_img(silhouette(spr), bx+bs/2, by+bs/2, 2); ctx.globalAlpha = 0.75; px(bx+1, by+1, bs-2, bs-2, '#3b3552'); ctx.globalAlpha = 1; drawTextOC('?', bx+bs/2, by+bs/2-5, '#ffe9a8', 2, K); }
    /* nombre, etapa y descripción */
    let nm = 'HUEVO '+L.name;
    if(nd.slot==='grimo') nm = seen ? 'GRIMO' : '?????';
    else if(nd.slot!=='egg') nm = seen ? L.names[nd.slot] : '?????';
    const tx = 62;
    drawText(nm, tx, y0+7, K);
    co_chip(tx, y0+15, secret ? 'SECRETO' : st.t, uiLight(st.c, 0.35), K, uiDark(st.c, 0.35));
    const fdesc = nd.slot==='grimo' ? FORM_DESC.grimo : (FORM_DESC[ln] && FORM_DESC[ln][nd.slot]);
    let desc = '';
    if(nd.slot==='egg') desc = (LINE_MOTIF[ln] || '') + (LINE_MOTIF[ln] ? ' · ' : '') + L.bonus;
    else if(seen && typeof fdesc==='string') desc = fdesc;
    else desc = secret ? 'UN SECRETO POR DESCUBRIR' : 'AUN NO LA HAS VISTO';
    uiWrap(desc, 88, 3).forEach((l,i)=>drawText(l, tx, y0+27+i*7, seen ? UIC.goldTx : UIC.faint));
    /* requisitos */
    const reqs = EVO_REQS[nd.slot];
    const cA = G.dex[ln+'_childA'] ? L.names.childA : '???';
    const cB = G.dex[ln+'_childB'] ? L.names.childB : '???';
    px(9, y0+57, 142, 1, 'rgba(26,20,40,0.12)');
    if(secret){
      drawTextC('? ? ?', 80, y0+60, UIC.muted);
    } else {
      drawTextC(reqs[0].replace('{cA}',cA).replace('{cB}',cB), 80, y0+60, K);
      drawTextC(reqs[1].replace('{cA}',cA).replace('{cB}',cB), 80, y0+67, UIC.muted);
    }
    /* tu progreso hacia esta forma */
    const bars = secret ? null : co_evoBars(nd.slot, AP());
    if(bars){
      const n = Math.min(3, bars.length), W = 46;
      const two = bars.length > 3 && co_now()%4000 > 2000;
      const B = bars.slice(two ? 3 : 0, (two ? 3 : 0)+n);
      B.forEach((b, i)=>{
        const x = 9 + i*(W+2), y = y0+74;
        const k = b.inv ? (b.v < b.n ? 1 : 0) : clamp01(b.v/b.n);
        const ok = b.inv ? b.v < b.n : b.v >= b.n;
        const kv = uiCount('evb'+i+b.l, Math.round(k*100))/100;
        drawText(b.l, x, y, ok ? UIC.greenTx : K);
        const vs = b.inv ? b.v+'<'+b.n : b.v+'/'+b.n;
        drawText(vs, x+W-1-textW(vs), y, ok ? UIC.greenTx : UIC.muted);
        uiBar(x, y+7, W-1, 3, kv, ok ? '#7ac74f' : b.c);
        if(ok) uiCheck(x+14, y, UIC.greenTx);
      });
      if(bars.length>3){ px(76, y0+85, 3, 1, two ? UIC.faint : K); px(81, y0+85, 3, 1, two ? K : UIC.faint); }
    } else if(!secret){
      drawTextC(nd.slot==='egg' ? 'CADA HUEVO ES UNA SORPRESA' : 'NO DEPENDE DE TI: ¡SUERTE!', 80, y0+77, UIC.faint);
    }
  });
}

/* ================= LOGROS ================= */
const ACH_IC = {hatch:'egg', joven:'brote', adulto:'cara', col10:'album', col25:'album', guer:'fue', camp:'trofeo',
  magn:'mota', dina:'star', fam:'heart', leye:'crown', amig:'heart', expl:'camino', caza:'skull', gour:'pastel',
  natu:'jardin', mudanza:'house', terra:'valla', encade:'chain', torero:'def', verdu:'cosecha'};
function co_icon(k){ return CO_IC[k] || UIIC[k] || SPR[k] || null; }
/* progreso de cada logro [actual, meta] */
function co_achProg(a){
  const dex = Object.keys(G.dex);
  const nb = BEAST_ORDER.filter(k=>G.beast && G.beast[k] && G.beast[k].seen>0).length;
  const P = {
    hatch:[dexCount(),1], joven:[dex.some(k=>k.includes('_child'))?1:0,1], adulto:[dex.some(k=>k.includes('_adult')||k==='grimo')?1:0,1],
    col10:[dexCount(),10], col25:[dexCount(),25], guer:[G.battlesWon||0,5], camp:[G.battlesWon||0,25],
    magn:[G.totalMotas||0,10000], dina:[G.ascensions||0,3], fam:[G.pets.length,3],
    leye:[dex.some(k=>k.endsWith('_adultS'))?1:0,1], amig:[G.bond||0,20], expl:[G.expedsDone||0,5],
    caza:[G.bossesWon||0,3], gour:[Object.keys(G.foodsTried||{}).length,8], natu:[nb,BEAST_ORDER.length],
    mudanza:[G.pets.some(p=>(p.zone||'prado')!=='prado')?1:0,1],
    terra:[(G.zonesOpen&&G.zonesOpen.parque?1:0)+(G.zonesOpen&&G.zonesOpen.huerta?1:0),2],
    encade:[G.combos3||0,1], torero:[G.parries||0,3], verdu:[G.harvests||0,5]
  }[a.id] || [0,1];
  if(G.ach[a.id]) return [P[1], P[1]];
  return [Math.min(P[0], P[1]), P[1]];
}
const ACH_ROW = 22;
function achLayout(){ return {panel:{x:4, y:22, w:152, h:216}, view:{x:8, y:62, w:141, h:170}}; }
function co_achMax(){ const v = achLayout().view; return Math.max(0, ACH.length*ACH_ROW + 2 - v.h); }
/* mientras input.js escale con achMaxScroll(), traducimos a nuestra altura real */
function co_achK(){ const m = typeof achMaxScroll==='function' ? achMaxScroll() : 0; return m>0 ? co_achMax()/m : 1; }
UI_SCROLLABLE.ach = {get:()=>UI.achScroll||0, set:v=>{ UI.achScroll = v; }, max:()=>typeof achMaxScroll==='function' ? achMaxScroll() : co_achMax()};
function drawAch(){
  const Lo = achLayout();
  let done=0, stars=0, motas=0;
  for(const a of ACH) if(G.ach[a.id]){ done++; if(a.s) stars += a.s; else motas += a.m; }
  uiPanel({x:Lo.panel.x, y:Lo.panel.y, w:Lo.panel.w, h:Lo.panel.h, title:'LOGROS', icon:'trofeo', color:'collection', right:done+'/'+ACH.length});
  /* resumen: barra total + lo ganado */
  uiStag(0, ()=>{
    const k = uiCount('achdone', done)/ACH.length;
    uiBox(8, 43, 144, 15, '#efe6cc', '#b8a98a');
    px(9, 44, 142, 1, '#fbf6e6');
    uiBar(12, 49, 56, 4, k, '#8a6ae8');
    drawText(Math.round(done/ACH.length*100)+'%', 71, 48, K);
    drawText('GANADO', 90, 48, UIC.faint);
    const ms = fmt(motas);
    uiCoin(116, 48); drawText(ms, 122, 48, UIC.goldTx);
    drawText('★'+stars, 148-textW('★'+stars), 48, UIC.goldTx);
  });
  const v = Lo.view;
  const kk = co_achK();
  const max = co_achMax();
  const raw = uiScrollTick('ach', (UI.achScroll||0)*kk, max, uiDragging('ach'));
  UI.achScroll = raw/kk;
  const off = raw;
  const contentH = ACH.length*ACH_ROW + 2;
  uiScrollBegin(v, off, 'ach');
  for(let i=0;i<ACH.length;i++){
    const a = ACH[i], got = !!G.ach[a.id];
    const y = v.y + 1 + i*ACH_ROW;
    if(y + ACH_ROW < v.y + off - 2 || y > v.y + off + v.h + 2) continue;
    const [cur, need] = co_achProg(a);
    const ic = co_icon(ACH_IC[a.id]);
    const rw = a.m ? '+'+a.m : '+'+a.s+'★';
    uiRow({x:v.x, y, w:v.w-2, h:ACH_ROW-2, key:'ach'+i, i:Math.max(0, i - Math.floor(off/ACH_ROW))+1,
      icon: ic, iconO:{sil:false, dim:!got && cur===0},
      title: a.name, sub:' ', state: got ? 'owned' : 'normal', stripe: got ? '#7ac74f' : null,
      right:(xr, cy)=>{
        if(got){
          const w2 = textW(rw) + (a.m ? 13 : 6) + 7;
          uiBox(xr-w2, cy-4, w2, 9, '#c8ecb0', '#5a9a48');
          uiCheck(xr-w2+2, cy-2, '#2a5a30');
          if(a.m){ uiCoin(xr-w2+9, cy-2); drawText(rw, xr-w2+15, cy-2, '#2a5a30'); }
          else drawText(rw, xr-w2+9, cy-2, '#2a5a30');
          return xr-w2;
        }
        if(a.m) return pricePill(xr, cy-4, a.m, true);
        const w2 = textW(rw)+6;
        uiBox(xr-w2, cy-4, w2, 9, '#3b3552', K);
        drawText(rw, xr-w2+3, cy-2, '#ffd94a');
        return xr-w2;
      }
    });
    /* barra de progreso bajo el título (se dibuja encima de la fila) */
    const st = uiStagger(Math.max(0, i - Math.floor(off/ACH_ROW))+1);
    ctx.save(); ctx.globalAlpha *= st.alpha; ctx.translate(st.dx + uiDenyOff('ach'+i), uiPressed('ach'+i));
    const bx = v.x+24, bw = 38;
    if(uiDenyMsg('ach'+i)){ ctx.restore(); continue; }
    const ps = got ? '¡HECHO!' : (need>=1000 ? fmt(cur)+'/'+fmt(need) : cur+'/'+need);
    uiBar(bx, y+12, bw, 3, cur/need, got ? '#7ac74f' : '#8a6ae8');
    drawText(ps, bx+bw+3, y+11, got ? UIC.greenTx : UIC.muted);
    ctx.restore();
  }
  uiScrollEnd(v, off, contentH);
}

/* ================= RELIQUIAS: vitrina ================= */
function relicsLayout(){
  const niches = [];
  for(let i=0;i<RELICS.length;i++){
    const c = i%5, r = Math.floor(i/5);
    niches.push({x:13 + c*27, y:54 + r*46, w:26, h:40});
  }
  return {panel:{x:4, y:22, w:152, h:214}, niches, cab:{x:8, y:45, w:144, h:103}};
}
function drawRelics(){
  const Lo = relicsLayout();
  let n=0; for(const r of RELICS) if(G.relics[r.id]) n++;
  uiPanel({x:Lo.panel.x, y:Lo.panel.y, w:Lo.panel.w, h:Lo.panel.h, title:'RELIQUIAS', icon:CO_IC.ojo, color:'collection', right:n+'/'+RELICS.length});
  if(UI.relicSel===undefined){ UI.relicSel = Math.max(0, RELICS.findIndex(r=>G.relics[r.id])); }
  /* vitrina de madera con terciopelo */
  const cb = Lo.cab;
  uiBox(cb.x, cb.y, cb.w, cb.h, '#8a5a34', K);
  px(cb.x+1, cb.y+1, cb.w-2, 1, '#b07a44');
  px(cb.x+3, cb.y+3, cb.w-6, cb.h-6, '#3a2446');
  px(cb.x+3, cb.y+3, cb.w-6, 1, '#241630');
  /* estantes */
  for(let r=0;r<2;r++){
    const sy = 54 + r*46 + 40;
    px(cb.x+3, sy, cb.w-6, 3, '#b07a44'); px(cb.x+3, sy, cb.w-6, 1, '#d8a060'); px(cb.x+3, sy+3, cb.w-6, 1, '#5a3620');
  }
  const t = co_now();
  Lo.niches.forEach((r, i)=>{
    const R = RELICS[i], got = !!G.relics[R.id];
    uiStag(i, ()=>{
      const sink = uiPressed('relic'+i);
      const cx = r.x + r.w/2, cy = r.y + 20 + sink;
      /* foco de luz en las que tienes */
      if(got){
        ctx.globalAlpha = 0.18 + 0.06*Math.sin(t/500 + i);
        px(cx-8, r.y+2, 16, 36, '#ffe9a8'); px(cx-6, r.y, 12, 38, '#ffe9a8');
        ctx.globalAlpha = 1;
        px(cx-7, r.y+37, 14, 2, 'rgba(255,233,168,0.35)');
      }
      const ic = CO_IC[R.id];
      if(got){
        const bob = Math.round(Math.sin(t/420 + i*0.9));
        co_img(ic, cx, cy + bob, 2);
        if(Math.floor(t/140 + i*3) % 18 === 0){ px(cx+6, cy-9, 1, 3, '#ffffff'); px(cx+5, cy-8, 3, 1, '#ffffff'); }
      } else {
        co_img(co_tint(ic, '#57426a'), cx, cy, 2);
        drawTextC('?', cx, cy-2, '#b8a8d0');
      }
      /* cristal */
      px(r.x+2, r.y+2, 1, 8, 'rgba(255,255,255,0.18)'); px(r.x+3, r.y+2, 1, 3, 'rgba(255,255,255,0.12)');
      if(i===UI.relicSel) co_corners(r.x+1, r.y+1, r.w-2, r.h-2, '#ffd94a');
    });
  });
  /* ficha */
  const sel = UI.relicSel||0, R = RELICS[sel], got = !!G.relics[R.id];
  uiStag(11, ()=>{
    const y = 152;
    card(8, y, 144, 58);
    px(9, y+1, 142, 2, got ? '#ffd94a' : '#b8a98a');
    co_frame(12, y+7, 30, 30, got ? '#3a2446' : '#d6ccb2', K, got ? '#5a3a66' : 'rgba(255,255,255,0.3)');
    if(got) co_img(CO_IC[R.id], 27, y+22, 2); else { co_img(co_tint(CO_IC[R.id], '#a89c84'), 27, y+22, 2); drawTextC('?', 27, y+20, '#f6efe0'); }
    drawText(got ? R.name : '?????', 47, y+8, got ? K : UIC.faint);
    const xl = co_chip(47, y+16, got ? 'ACTIVA' : 'SIN ENCONTRAR', got ? '#c8ecb0' : '#e2d8c0', got ? '#2a5a30' : UIC.muted, got ? '#5a9a48' : '#b8a98a');
    void xl;
    drawText(got ? 'EFECTO:' : 'PISTA:', 47, y+28, UIC.muted);
    drawText(uiFit(R.desc, 72), 47+ (got?32:28), y+28, got ? UIC.greenTx : UIC.goldTx);
    px(12, y+41, 136, 1, 'rgba(26,20,40,0.12)');
    drawTextC('SE HALLAN EN EXPEDICIONES Y JEFES', 80, y+46, UIC.faint);
  });
  uiHint('TOCA UNA PARA VERLA', 80, 223);
}

/* ================= BESTIARIO ================= */
function beastLayout(){
  const cards = [];
  for(let i=0;i<BEAST_ORDER.length;i++){
    const c = i%5, r = Math.floor(i/5);
    cards.push({x:9 + c*29, y:43 + r*32, w:27, h:30});
  }
  return {panel:{x:4, y:22, w:152, h:236}, cards, card:{x:8, y:141, w:144, h:74}, btn:{x:56, y:196, w:92, h:15}};
}
function co_beastSeen(k){ return !!(G.beast && G.beast[k] && G.beast[k].seen>0); }
function drawBeast(){
  const Lo = beastLayout();
  G.beast = G.beast || {};
  let n=0; for(const k of BEAST_ORDER) if(co_beastSeen(k)) n++;
  uiPanel({x:Lo.panel.x, y:Lo.panel.y, w:Lo.panel.w, h:Lo.panel.h, title:'BESTIARIO', icon:'fue', color:'collection', right:n+'/'+BEAST_ORDER.length});
  if(UI.beastSel===undefined) UI.beastSel = Math.max(0, BEAST_ORDER.findIndex(co_beastSeen));
  const t = co_now();
  Lo.cards.forEach((r, i)=>{
    const k = BEAST_ORDER[i], E = ENEMIES[k], seen = co_beastSeen(k), info = G.beast[k];
    uiStag(i, ()=>{
      const sink = uiPressed('bst'+i);
      const y = r.y + sink;
      if(!sink) px(r.x+1, r.y+r.h, r.w-2, 1, 'rgba(26,20,40,0.22)');
      const ec = ELEM_COLS[E.elem] || '#c8c0b0';
      co_frame(r.x, y, r.w, r.h, seen ? UIC.card : '#cfc6ae', E.boss ? '#a03030' : K, seen ? UIC.cardHi : 'rgba(255,255,255,0.2)');
      px(r.x+1, y+1, r.w-2, 2, seen ? ec : '#b8ad94');
      const spr = ESPR[k];
      if(seen){
        const bob = i===UI.beastSel ? Math.round(Math.sin(t/200)) : 0;
        ctx.drawImage(spr, Math.round(r.x + r.w/2 - spr.width/2), y + 17 - spr.height + 4 + bob);
      } else {
        ctx.globalAlpha = 0.85; ctx.drawImage(darkSilhouette(spr), Math.round(r.x + r.w/2 - spr.width/2), y + 17 - spr.height + 4); ctx.globalAlpha = 1;
      }
      if(seen){
        const w = String(info.wins||0);
        drawText(w, r.x + r.w - 2 - textW(w), y + r.h - 7, (info.wins||0)>0 ? UIC.greenTx : UIC.faint);
        const ei = CO_IC['el_'+E.elem];
        if(ei){ ctx.save(); ctx.beginPath(); ctx.rect(r.x+1, y+r.h-9, 9, 8); ctx.clip(); ctx.drawImage(ei, r.x+1, y+r.h-10); ctx.restore(); }
      } else drawTextC('?', r.x + r.w/2, y + r.h - 8, UIC.faint);
      if(E.boss){ px(r.x+r.w-5, y+4, 3, 3, '#e2574c'); }
      if(i===UI.beastSel) co_corners(r.x, y, r.w, r.h, '#e2574c');
    });
  });
  /* ficha del elegido */
  const sel = UI.beastSel||0, k = BEAST_ORDER[sel], E = ENEMIES[k], seen = co_beastSeen(k), info = G.beast[k]||{seen:0,wins:0};
  const C = Lo.card;
  uiStag(14, ()=>{
    card(C.x, C.y, C.w, C.h);
    const ec = ELEM_COLS[E.elem] || '#c8c0b0';
    px(C.x+1, C.y+1, C.w-2, 2, seen ? ec : '#b8a98a');
    const bx = C.x+4, by = C.y+6;
    co_frame(bx, by, 40, 36, '#2a2540', K, '#443c60');
    px(bx+1, by+26, 38, 9, seen ? uiDark(ec, 0.45) : '#221c36');
    px(bx+1, by+26, 38, 1, seen ? uiDark(ec, 0.2) : '#2e2848');
    const spr = ESPR[k];
    if(seen){
      px(bx+10, by+29, 20, 2, 'rgba(0,0,0,0.35)');
      const bsc = (spr.width<=19 && spr.height<=14) ? 2 : 1;
      co_img(spr, bx+20, by+29 - spr.height*bsc/2 + Math.round(Math.sin(t/260)), bsc);
    } else { co_img(darkSilhouette(spr), bx+20, by+18, 2); drawTextOC('?', bx+20, by+13, '#ffe9a8', 2, K); }
    const tx = C.x+48;
    drawText(seen ? E.name : '?????', tx, C.y+6, seen ? K : UIC.faint);
    if(seen){
      let xx = tx;
      const ei = CO_IC['el_'+E.elem];
      uiBox(xx, C.y+13, textW(ELEM_NAME[E.elem])+15, 11, uiLight(ec, 0.55), uiDark(ec, 0.35));
      if(ei) ctx.drawImage(ei, xx+1, C.y+14);
      drawText(ELEM_NAME[E.elem], xx+12, C.y+16, uiDark(ec, 0.6));
      xx += textW(ELEM_NAME[E.elem]) + 18;
      if(E.boss) co_chip(xx, C.y+14, 'JEFE', '#e2574c', '#ffffff', '#a03030');
      uiWrap(E.desc, 92, 2).forEach((l,i)=>drawText(l, tx, C.y+27+i*7, UIC.muted));
      /* ventaja elemental frente a tu bitxo */
      const m = elemMult(playerElem(AP()), E.elem);
      const mt = m>1 ? 'VENTAJA' : (m<1 ? 'DESVENT' : 'IGUALES');
      const mc = m>1 ? '#c8ecb0' : (m<1 ? '#f8c8c0' : '#e2d8c0');
      co_chip(C.x+4, C.y+46, mt, mc, m>1 ? '#2a5a30' : (m<1 ? '#a03030' : UIC.muted), m>1 ? '#5a9a48' : (m<1 ? '#c07060' : '#b8a98a'));
      const dm = uiDenyMsg('revancha');
      if(dm) drawText(uiFit(dm, 92), tx, C.y+44, UIC.redTx);
      else drawText('VISTO '+info.seen+' · GANADO '+(info.wins||0), tx, C.y+44, UIC.greenTx);
    } else {
      drawText('AUN NO TE HAS', tx, C.y+20, UIC.faint);
      drawText('CRUZADO CON EL', tx, C.y+27, UIC.faint);
      const dm = uiDenyMsg('revancha');
      if(dm) drawText(uiFit(dm, 92), tx, C.y+44, UIC.redTx);
    }
  });
  /* REVANCHA */
  const nv = Math.max(1, playerPower(AP())+1);
  uiStag(15, ()=>{
    const B = Lo.btn;
    uiButton({x:B.x, y:B.y, w:B.w, h:B.h, key:'revancha', kind:'danger', disabled:!seen, label:seen ? 'REVANCHA NV'+nv : 'SIN DESCUBRIR', icon:seen ? 'fue' : null});
  });
  /* rueda elemental con colores */
  uiStag(16, ()=>{
    uiSection(10, 220, 140, 'RUEDA ELEMENTAL');
    const lines = [['brasa','pradera','marea','brasa'], ['astro','petrea','fungo','astro'], ['voltio','marea','·','petrea','voltio']];
    lines.forEach((ln, li)=>{
      const parts = [];
      ln.forEach((e, j)=>{ if(e==='·'){ parts.push([' · ', UIC.faint]); return; } if(j>0 && ln[j-1]!=='·') parts.push(['>', UIC.faint]); parts.push([LINES[e] ? LINES[e].name : e.toUpperCase(), uiDark(ELEM_COLS[e]||'#888888', 0.3)]); });
      let w = 0; parts.forEach(p=>w += textW(p[0])+1);
      let x = Math.round(80 - w/2);
      parts.forEach(p=>{ drawText(p[0], x, 228 + li*8, p[1]); x += textW(p[0])+1; });
    });
  });
}

/* ================= DINASTÍA: salón de la fama estrellado ================= */
function legacyLayout(){ return {panel:{x:8, y:24, w:144, h:222}, btn:{x:30, y:222, w:100, h:16}, sky:{x:12, y:45, w:136, h:173}}; }
function drawLegacy(){
  const Lo = legacyLayout();
  const L = G.legacy||[];
  uiPanel({x:Lo.panel.x, y:Lo.panel.y, w:Lo.panel.w, h:Lo.panel.h, title:'DINASTIA', icon:'star', color:'#4a3a8a', right:'★'+G.stars});
  const S = Lo.sky, t = co_now();
  /* cielo */
  uiBox(S.x, S.y, S.w, S.h, '#141838', K);
  px(S.x+1, S.y+1, S.w-2, 30, '#1c2048');
  px(S.x+1, S.y+31, S.w-2, 20, '#181c42');
  for(let i=0;i<46;i++){
    const sx = S.x+2 + ((i*53)%(S.w-4)), sy = S.y+2 + ((i*31 + (i*i)%17)%(S.h-4));
    const tw = Math.sin(t/(380+i*17) + i) > 0.6;
    px(sx, sy, 1, 1, tw ? '#ffffff' : (i%3 ? '#5a6090' : '#8a90c0'));
    if(tw && i%5===0){ px(sx-1, sy, 3, 1, 'rgba(255,255,255,0.5)'); px(sx, sy-1, 1, 3, 'rgba(255,255,255,0.5)'); }
  }
  /* resumen */
  uiStag(0, ()=>{
    const s1 = 'ASCENSOS '+(G.ascensions||0), s2 = 'MOTAS X'+legacyMult().toFixed(1);
    drawText(s1, S.x+5, S.y+5, '#b8c0f0');
    drawText(s2, S.x+S.w-5-textW(s2), S.y+5, '#ffd94a');
    px(S.x+4, S.y+12, S.w-8, 1, 'rgba(184,192,240,0.2)');
  });
  if(L.length===0){
    uiStag(1, ()=>{
      co_img(UIIC.star, 80, 100 + Math.round(Math.sin(t/400)*2), 2);
      drawTextC('AUN NADIE HA ASCENDIDO', 80, 120, '#e8e0f8');
      drawTextC('CRIA UN ADULTO AL NIVEL 8', 80, 134, '#8a90c0');
      drawTextC('Y TOCA ASCENDER EN DATOS', 80, 142, '#8a90c0');
    });
  } else {
    const show = L.slice(-8).reverse();
    /* hilos de constelación entre placas */
    const pos = show.map((e, i)=>({x:S.x+4 + (i%2)*66, y:S.y+17 + Math.floor(i/2)*38}));
    ctx.fillStyle = 'rgba(184,192,240,0.25)';
    for(let i=1;i<pos.length;i++){
      const a = pos[i-1], b = pos[i];
      const ax = a.x+31, ay = a.y+17, bx = b.x+31, by = b.y+17;
      const n = Math.max(Math.abs(bx-ax), Math.abs(by-ay));
      for(let j=0;j<n;j+=3) ctx.fillRect(Math.round(ax+(bx-ax)*j/n), Math.round(ay+(by-ay)*j/n), 1, 1);
    }
    show.forEach((e, i)=>{
      uiStag(i+1, ()=>{
        const {x, y} = pos[i];
        const w = 62, h = 35;
        const newest = i===0;
        uiBox(x, y, w, h, newest ? '#2e2a5a' : '#242850', newest ? '#ffd94a' : '#5a6090');
        px(x+1, y+1, w-2, 1, newest ? '#4a4486' : '#343a6a');
        /* pedestal con halo */
        const cx = x+13, cy = y+15;
        ctx.globalAlpha = 0.25 + 0.1*Math.sin(t/500+i); px(cx-8, cy-9, 16, 18, '#8a90e0'); px(cx-10, cy-6, 20, 12, '#8a90e0'); ctx.globalAlpha = 1;
        px(cx-8, y+h-7, 16, 2, '#8a90c0'); px(cx-7, y+h-5, 14, 2, '#5a6090');
        const spr = SPR[e.key] ? SPR[e.key][0] : SPR.grimo[0];
        const sc = Math.min(1, 20/Math.max(spr.width, spr.height));
        ctx.save(); ctx.translate(cx, y+h-7 - spr.height*sc/2); ctx.scale(sc, sc);
        ctx.drawImage(spr, -Math.round(spr.width/2), -Math.round(spr.height/2)); ctx.restore();
        drawText(uiFit(e.name, 34), x+27, y+4, '#ffffff');
        drawText('NV'+e.lv, x+27, y+12, '#b8c0f0');
        drawText('GEN '+e.gen, x+27, y+19, '#8a90c0');
        const st = '+'+(e.stars||1)+'★';
        drawText(st, x+27, y+27, '#ffd94a');
        if(newest && co_blink(600)) px(x+w-4, y+3, 1, 1, '#ffffff');
      });
    });
    if(L.length>8) drawTextC('...Y '+(L.length-8)+' MAS EN EL CIELO', 80, S.y+S.h-8, '#8a90c0');
  }
  /* botón de la constelación (mismo sitio de siempre) */
  const B = Lo.btn;
  uiButton({x:B.x, y:B.y, w:B.w, h:B.h, key:'constel', kind:'primary', label:'CONSTELACION', icon:'star'});
  if(CONSTEL.some(n=>constelState(n)==='ok') && co_blink(400)){ px(B.x+B.w-5, B.y-1, 4, 4, '#e2574c'); px(B.x+B.w-5, B.y-1, 4, 1, K); }
}

/* ================= DIARIO: cuaderno de papel ================= */
function co_diaryIcon(txt){
  const T = [
    ['NACIO','egg'], ['HUEVO','egg'], ['EVOLUCIONO','star'], ['ASCENDIO','crown'], ['VENCIO','fue'], ['CORONO','trofeo'],
    ['MALITO','pill'], ['CURO','heart'], ['BAUTIZADO','pluma'], ['SE FUE','camino'], ['OBJETIVO','trofeo'],
    ['SE ABRIO','valla'], ['SE MUDO','house'], ['SE ENCENDIO','aura'], ['PESCO','fish'], ['NOVEDAD','carga'], ['ACTUALIZO','carga']
  ];
  for(const q of T) if(txt.includes(q[0])) return co_icon(q[1]);
  return UIIC.brote;
}
function diaryLayout(){ return {panel:{x:6, y:24, w:148, h:222}, paper:{x:10, y:44, w:140, h:182}, prev:{x:10, y:228, w:30, h:14}, next:{x:120, y:228, w:30, h:14}}; }
/* páginas: entradas (más nuevas primero) repartidas por altura */
function co_diaryPages(){
  const D = (G.diary||[]).slice().reverse();
  const pages = [];
  let cur = [], h = 0, lastD = null;
  const maxH = 170;
  for(const e of D){
    const lines = uiWrap(e.txt, 108, 2);
    const head = e.d!==lastD ? 10 : 0;
    const eh = head + 4 + lines.length*7 + 2;
    if(h + eh > maxH && cur.length){ pages.push(cur); cur = []; h = 0; lastD = null; }
    const head2 = e.d!==lastD ? 10 : 0;
    cur.push({e, lines, head:head2});
    h += head2 + 4 + lines.length*7 + 2;
    lastD = e.d;
  }
  if(cur.length) pages.push(cur);
  return pages;
}
function drawDiary(){
  const Lo = diaryLayout();
  uiPanel({x:Lo.panel.x, y:Lo.panel.y, w:Lo.panel.w, h:Lo.panel.h, title:'DIARIO DEL PRADO', icon:UIIC.copia, color:'collection'});
  const P = Lo.paper;
  /* papel pautado con margen */
  const flipK = clamp01((co_now() - (UI.diaryFlipAt||0))/220);
  uiBox(P.x, P.y, P.w, P.h, '#fbf6e6', '#b8a98a');
  px(P.x+P.w-3, P.y+2, 2, P.h-4, '#efe6cc');
  for(let yy=P.y+10; yy<P.y+P.h-2; yy+=7) px(P.x+1, yy, P.w-2, 1, 'rgba(94,144,200,0.18)');
  px(P.x+19, P.y+1, 1, P.h-2, 'rgba(226,87,76,0.45)');
  /* agujeros de anilla */
  for(let yy=P.y+14; yy<P.y+P.h-6; yy+=26){ px(P.x+2, yy, 4, 4, '#d6ccb2'); px(P.x+3, yy+1, 2, 2, '#b8a98a'); }
  const pages = co_diaryPages();
  const np = Math.max(1, pages.length);
  UI.diaryPage = Math.max(0, Math.min(np-1, UI.diaryPage||0));
  if(!pages.length){
    uiStag(0, ()=>{
      co_img(UIIC.copia, 85, 110, 2);
      drawTextC('AUN NO HAY RECUERDOS', 85, 128, UIC.muted);
      drawTextC('VIVE Y SE ESCRIBIRAN SOLOS', 85, 138, UIC.faint);
    });
  } else {
    const pg = pages[UI.diaryPage];
    ctx.save();
    ctx.beginPath(); ctx.rect(P.x+1, P.y+1, P.w-2, P.h-2); ctx.clip();
    ctx.globalAlpha = 0.25 + 0.75*flipK;
    ctx.translate(Math.round((1-ease.outCubic(flipK))*(UI.diaryFlipDir||1)*10), 0);
    let y = P.y + 5;
    pg.forEach((it, i)=>{
      uiStag(i, ()=>{
        if(it.head){
          /* sello de fecha */
          const s = it.e.d;
          uiBox(P.x+22, y, textW(s)+6, 9, '#f2a2b8', '#c0607a');
          drawText(s, P.x+25, y+2, '#7a2a44');
          px(P.x+28+textW(s), y+4, P.w-32-textW(s), 1, 'rgba(192,96,122,0.3)');
        }
      });
      y += it.head;
      const yy = y;
      uiStag(i, ()=>{
        const ic = co_diaryIcon(it.e.txt);
        if(ic){ ctx.save(); ctx.beginPath(); ctx.rect(P.x+7, yy+1, 12, 12); ctx.clip(); ctx.drawImage(ic, Math.round(P.x+13-ic.width/2), Math.round(yy+7-ic.height/2)); ctx.restore(); }
        it.lines.forEach((l, j)=>drawText(l, P.x+23, yy+3+j*7, j===0 ? K : '#3b3552'));
      });
      y += 4 + it.lines.length*7 + 2;
    });
    ctx.restore();
  }
  /* pie: paso de páginas */
  const pr = UI.diaryPage>0, nx = UI.diaryPage<np-1;
  uiButton({x:Lo.prev.x, y:Lo.prev.y, w:Lo.prev.w, h:Lo.prev.h, key:'dprev', label:'<', kind:'secondary', disabled:!pr});
  uiButton({x:Lo.next.x, y:Lo.next.y, w:Lo.next.w, h:Lo.next.h, key:'dnext', label:'>', kind:'secondary', disabled:!nx});
  drawTextC('PAG '+(UI.diaryPage+1)+'/'+np, 80, 232, UIC.muted);
}

/* ================= INFORMES (expedición / ausencia) ================= */
/* cifra que cuenta hacia arriba desde que se abre el informe */
function countUp(v, t0, ms){ const k = ease.outCubic(clamp01((performance.now()-t0)/(ms||900))); return Math.round(v*k); }
function repOpened(key, cy){
  if(UI.repKey!==key){
    UI.repKey = key; UI.repT = performance.now(); SFX.coin();
    if(typeof confetti==='function') confetti(80, cy||110, 26);
    if(typeof ringFx==='function') ringFx(80, (cy||110)+6, '#ffd94a', 30, 420);
  }
}
/* filas con icono que entran una a una */
function reportRows(rows, y0){
  rows.forEach((r,i)=>{
    const age = performance.now() - (UI.repT||0) - 260 - i*120;
    if(age<0) return;
    const k = ease.outBack(clamp01(age/280));
    const dx = Math.round((1-k)*-16);
    const y = y0 + i*14;
    ctx.save(); ctx.globalAlpha = clamp01(age/160); ctx.translate(dx, 0);
    uiBox(20, y, 120, 12, i%2 ? '#f6efe0' : '#fbf6e6', 'rgba(26,20,40,0.15)');
    if(r[2]){ ctx.save(); ctx.beginPath(); ctx.rect(22, y+1, 12, 10); ctx.clip(); ctx.drawImage(r[2], Math.round(28-r[2].width/2), Math.round(y+6-r[2].height/2)); ctx.restore(); }
    drawText(uiFit(r[0], 100), 37, y+4, r[1]);
    ctx.restore();
    if(age<30 && !r.pop){ r.pop = true; tone({f:660+i*90, d:0.04, type:'p25', vol:0.02}); }
  });
}
/* tarjeta de celebración: cabecera, rayos y la cifra gorda */
function co_repCard(title, sub, motas, rows, icon){
  const h = 86 + rows.length*14;
  const y0 = Math.round(128 - h/2);
  repOpened(title+sub+motas, y0+38);
  const x0 = 12, w = 136;
  const now = performance.now(), age = now - (UI.repT||0);
  const pop = ease.outBack(clamp01(age/320));
  ctx.save();
  ctx.translate(80, y0+h/2); ctx.scale(0.85+0.15*pop, 0.85+0.15*pop); ctx.translate(-80, -(y0+h/2));
  uiPanel({x:x0, y:y0, w, h, title, icon, color:'#e0ac2c'});
  drawTextC(sub, 80, y0+22, UIC.muted);
  /* rayos girando detrás de la cifra */
  const cy = y0+38;
  ctx.save();
  ctx.beginPath(); ctx.rect(x0+3, y0+29, w-6, 22); ctx.clip();
  ctx.translate(80, cy); ctx.rotate(now/2400);
  ctx.fillStyle = 'rgba(255,217,74,0.32)';
  for(let i=0;i<10;i++){ ctx.rotate(Math.PI/5); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(90, -9); ctx.lineTo(90, 9); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  const mv = countUp(motas, UI.repT, 1100);
  const bump = age>1100 && age<1350 ? Math.round(Math.sin((age-1100)/250*Math.PI)*-2) : 0;
  const big = '+'+fmt(mv)+'✦';
  const bsc = textWS('+'+fmt(motas)+'✦', 3) <= 120 ? 3 : 2;
  drawTextOC(big, 80, cy - (bsc===3 ? 7 : 5) + bump, '#ffd94a', bsc, '#8a6a10');
  if(every(90, now) && age<1100) fx({x:80+(Math.random()*40-20), y:cy, vx:(Math.random()-0.5)*0.06, vy:-0.05, g:0.0002, life:400, size:1, col:'#ffd94a', kind:'star'});
  reportRows(rows, y0+56);
  /* seguir */
  if(age > 700){
    const pulse = Math.round(Math.sin(now/220));
    const s = 'TOCA PARA SEGUIR', bw = textW(s)+12;
    uiBox(Math.round(80-bw/2), y0+h-17+pulse, bw, 11, '#ffd94a', '#8a6a10');
    px(Math.round(80-bw/2)+1, y0+h-16+pulse, bw-2, 1, '#fff3a8');
    drawTextC(s, 80, y0+h-14+pulse, K);
  }
  ctx.restore();
}
function drawExpReport(){
  const r = UI.expReport;
  const rows = [['+'+r.xp+' XP', '#3a7048', UIIC.nivel]];
  if(r.relicName){ const R = RELICS.find(q=>q.name===r.relicName); rows.push(['RELIQUIA: '+r.relicName, '#8a6a10', R ? CO_IC[R.id] : UIIC.star]); }
  if(r.extra) rows.push(['+'+r.extra+'✦ EXTRA', '#8a6a10', UIIC.mota]);
  if(r.eggline) rows.push([r.eggWait ? 'HUEVO '+LINES[r.eggline].name+' EN ESPERA' : '¡HUEVO '+LINES[r.eggline].name+'!', '#a03030', SPR['egg_'+r.eggline] ? SPR['egg_'+r.eggline][0] : CO_IC.egg]);
  co_repCard('¡'+r.name+' HA VUELTO!', 'DEL '+r.dest, r.motas, rows, UIIC.camino);
}
function drawOfflineReport(){
  const r = offlineReport;
  const rows = [];
  if(r.autofed>0) rows.push(['COMIO SOLO X'+r.autofed, '#3a7048', SPR.meal]);
  if(r.lvls>0) rows.push(['CRECIO: +'+r.lvls+' NIVELES', '#8a6a10', UIIC.nivel]);
  if(r.poops>0) rows.push(['CACAS NUEVAS: '+r.poops, '#a03030', SPR.poop]);
  if(r.robot>0) rows.push(['EL ROBOT LIMPIO '+r.robot, '#3a7048', (SPR.robot && SPR.robot[0]) || UIIC.iman]);
  if(r.mistakes>0) rows.push(['PASO HAMBRE: +'+r.mistakes+' FALLO', '#a03030', UIIC.fallo]);
  if(r.ranAway && r.ranAway.length) rows.push([r.ranAway[0]+' SE FUE...', '#a03030', UIIC.camino]);
  if(r.evolved) rows.push(['¡EVOLUCION A LA VISTA!', '#8a6a10', UIIC.star]);
  const hrs = Math.floor(r.away/3600000), mins = Math.floor((r.away%3600000)/60000);
  const sub = (hrs>0? hrs+'H ':'')+mins+'M FUERA'+(r.capped?' (MAX '+Math.round(offlineCap()/3600000)+'H)':'');
  co_repCard('MIENTRAS NO ESTABAS', sub, r.motas, rows, UIIC.cama);
}

/* ================= TOQUES ================= */
function tapAlbum(x, y){
  const L = albumLayout();
  if(co_outside(x, y, L.panel)){ UI.mode='stats'; SFX.tap(); return; }
  for(let i=0;i<L.tabs.length;i++){
    if(uiHit(L.tabs[i], x, y)){
      uiPress('altab'+i);
      if(UI.albumPage!==i){ UI.albumPage = i; uiRestagger(); SFX.coPage(); } else SFX.tap();
      return;
    }
  }
  const page = albumPage();
  if(page===LINE_KEYS.length){
    if(uiHit(L.grimo, x, y)){
      uiPress('algrimo');
      const li = Math.max(0, LINE_KEYS.indexOf(AP().line));
      UI.evoLine = li; UI.evoSel = EVO_NODES.findIndex(n=>n.slot==='grimo'); UI.mode='evotree'; SFX.tap();
    }
    return;
  }
  for(let i=0;i<L.slots.length;i++){
    if(uiHit(L.slots[i], x, y)){
      uiPress('alslot'+i);
      UI.evoLine = page; UI.evoSel = Math.max(0, EVO_NODES.findIndex(n=>n.slot===L.slots[i].slot));
      UI.mode='evotree'; SFX.tap(); return;
    }
  }
}
SCREEN_TAP.album = tapAlbum;
function tapAch(x, y){
  const Lo = achLayout();
  if(co_outside(x, y, Lo.panel)){ UI.mode='stats'; UI.achScroll = 0; SFX.tap(); return; }
  const v = Lo.view;
  if(uiHit(v, x, y)){
    const off = (UI.achScroll||0)*co_achK();
    const i = Math.floor((y - v.y - 1 + off)/ACH_ROW);
    if(i>=0 && i<ACH.length){
      uiPress('ach'+i);
      const a = ACH[i];
      if(G.ach[a.id]){ SFX.coSelect(); }
      else {
        const [cur, need] = co_achProg(a);
        uiDeny('ach'+i, 'TE FALTAN '+(need>=1000 ? fmt(need-cur) : (need-cur)));
        SFX.tap();
      }
    }
  }
}
SCREEN_TAP.ach = tapAch;
function tapRelics(x, y){
  const Lo = relicsLayout();
  if(co_outside(x, y, Lo.panel)){ UI.mode='stats'; SFX.tap(); return; }
  for(let i=0;i<Lo.niches.length;i++){
    if(uiHit(Lo.niches[i], x, y)){
      uiPress('relic'+i); UI.relicSel = i;
      if(G.relics[RELICS[i].id]) SFX.coSelect(); else SFX.tap();
      return;
    }
  }
}
SCREEN_TAP.relics = tapRelics;
function tapBeast(x, y){
  const Lo = beastLayout();
  if(co_outside(x, y, Lo.panel)){ UI.mode='stats'; SFX.tap(); return; }
  for(let i=0;i<Lo.cards.length;i++){
    if(uiHit(Lo.cards[i], x, y)){ uiPress('bst'+i); UI.beastSel = i; co_beastSeen(BEAST_ORDER[i]) ? SFX.coSelect() : SFX.tap(); return; }
  }
  const B = {x:Lo.btn.x, y:Lo.btn.y, w:Lo.btn.w, h:Lo.btn.h+2};
  if(uiHit(B, x, y)){
    const k = BEAST_ORDER[UI.beastSel||0];
    if(!co_beastSeen(k)){ uiDeny('revancha', 'AUN NO LO CONOCES'); SFX.nope(); return; }
    uiPress('revancha');
    /* revancha: a tu nivel actual +1 */
    const pp2 = playerPower(AP());
    G.wild = {kind:k, nv:Math.max(1,pp2+1), elite:false, boss:!!ENEMIES[k].boss, revenge:true, zone:G.zone,
              x:110, tx:110, arriveAt:Date.now(), stealAt:Date.now()+9e9, dir:-1};
    startBattle();
    if(UI.mode!=='battle'){ G.wild = null; UI.mode = 'beast'; uiDeny('revancha', 'NO PUEDE LUCHAR AHORA'); }
    return;
  }
}
SCREEN_TAP.beast = tapBeast;
function tapLegacy(x, y){
  const B = legacyLayout().btn;
  if(y>=B.y && y<=B.y+B.h && x>=B.x && x<=B.x+B.w){ uiPress('constel'); openConstel(false); SFX.tap(); return; }
  UI.mode='main'; SFX.tap(); return;
}
SCREEN_TAP.legacy = tapLegacy;
function tapDiary(x, y){
  const Lo = diaryLayout();
  const np = Math.max(1, co_diaryPages().length);
  const pg = UI.diaryPage||0;
  if(uiHit(Lo.prev, x, y)){
    if(pg>0){ uiPress('dprev'); UI.diaryPage = pg-1; UI.diaryFlipAt = performance.now(); UI.diaryFlipDir = -1; uiRestagger(); SFX.coPage(); }
    else { uiDeny('dprev'); SFX.nope(); }
    return;
  }
  if(uiHit(Lo.next, x, y)){
    if(pg<np-1){ uiPress('dnext'); UI.diaryPage = pg+1; UI.diaryFlipAt = performance.now(); UI.diaryFlipDir = 1; uiRestagger(); SFX.coPage(); }
    else { uiDeny('dnext'); SFX.nope(); }
    return;
  }
  UI.mode='stats'; UI.diaryPage = 0; SFX.tap(); return;
}
SCREEN_TAP.diary = tapDiary;
function tapEvotree(x, y){
  const Y = evoLayout();
  if(y<40 && (x<22 || x>136)){
    if(x<22){ uiPress('evprev'); UI.evoLine = ((UI.evoLine||0)+LINE_KEYS.length-1)%LINE_KEYS.length; UI.evoSel=0; uiRestagger(); SFX.coPage(); return; }
    uiPress('evnext'); UI.evoLine = ((UI.evoLine||0)+1)%LINE_KEYS.length; UI.evoSel=0; uiRestagger(); SFX.coPage(); return;
  }
  if(uiHit(Y.back, x, y)){ uiPress('evback'); UI.mode='album'; UI.albumPage = UI.evoLine||0; SFX.tap(); return; }
  let best=-1, bd=15;
  for(let i=0;i<EVO_NODES.length;i++){
    const d = Math.abs(x-EVO_NODES[i].x)+Math.abs(y-EVO_NODES[i].y);
    if(d<bd){ bd=d; best=i; }
  }
  if(best>=0){ uiPress('evnode'+best); UI.evoSel=best; SFX.coSelect(); return; }
  /* la ficha no cierra; fuera de todo, vuelta al álbum */
  if(y>=172 && y<266) return;
  UI.mode='album'; UI.albumPage = UI.evoLine||0; SFX.tap(); return;
}
SCREEN_TAP.evotree = tapEvotree;
