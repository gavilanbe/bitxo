"use strict";
/* =========================================================
   BITXO — render/uikit: lenguaje visual v2 de los menús.
   Paneles con cabecera, filas con icono, píldoras de precio,
   insignias, pestañas, botones, listas con inercia, entrada
   escalonada y respuesta a cada toque. Ver UIKIT.md.
   ========================================================= */

/* ---------------- paleta ---------------- */
const UIC = {
  paper:'#e8e0c8', paperHi:'#fbf6e6', paperLo:'#cfc3a2', rim:'#b8a98a',
  card:'#f6efe0', cardHi:'#fffaf0', cardLo:'#c9bd9e',
  poor:'#ece4cf', locked:'#d2c9b1', owned:'#e6f2da', on:'#fff1c2',
  well:'#dcd2b8', wellLo:'#c4b898', wellHi:'#f4edda',
  text:K, muted:'rgba(26,20,40,0.55)', faint:'rgba(26,20,40,0.38)',
  gold:'#ffd94a', goldHi:'#fff3a8', goldLo:'#c8a04b', goldTx:'#8a6a10',
  red:'#e2574c', redTx:'#a03030', green:'#7ac74f', greenTx:'#3a7048',
  cyan:'#5ec8d8', purple:'#8a6ae8', orange:'#f0a04b', plum:'#3b3552'
};
/* colores de cabecera por categoría de pantalla */
const UI_CAT = {
  shop:'#e0ac2c', food:'#e2574c', play:'#f0943b', data:'#5fae45',
  collection:'#8a6ae8', neutral:'#5a5078', sky:'#4a8ec8'
};
/* mezcla dos colores hex (t=0 → a, t=1 → b) */
const _mixCache = new Map();
function uiMix(a, b, t){
  const k = a+b+t; let r = _mixCache.get(k); if(r) return r;
  const pa = [1,3,5].map(i=>parseInt(a.slice(i,i+2),16)), pb = [1,3,5].map(i=>parseInt(b.slice(i,i+2),16));
  r = '#'+pa.map((v,i)=>('0'+Math.round(v+(pb[i]-v)*t).toString(16)).slice(-2)).join('');
  _mixCache.set(k, r); return r;
}
const uiDark = (c,t)=>uiMix(c, '#1a1428', t===undefined?0.35:t);
const uiLight = (c,t)=>uiMix(c, '#ffffff', t===undefined?0.4:t);

/* ---------------- geometría ---------------- */
function uiHit(r, x, y){ return !!r && x>=r.x && x<r.x+r.w && y>=r.y && y<r.y+r.h; }
function uiKey(k){ return typeof k==='string' ? k : (k ? k.x+','+k.y+','+k.w+','+k.h : ''); }
/* caja con esquinas recortadas de 1px: relleno + borde */
function uiBox(x, y, w, h, fill, rim){
  px(x+1, y, w-2, h, fill); px(x, y+1, w, h-2, fill);
  if(rim){ px(x+1, y, w-2, 1, rim); px(x+1, y+h-1, w-2, 1, rim); px(x, y+1, 1, h-2, rim); px(x+w-1, y+1, 1, h-2, rim); }
}

/* ---------------- texto ---------------- */
/* recorta con '.' para que quepa en maxW píxeles */
function uiFit(s, maxW){
  s = String(s);
  if(textW(s) <= maxW) return s;
  const n = Math.max(1, Math.floor((maxW+1)/4) - 1);
  return s.slice(0, n).replace(/\s+$/,'') + '.';
}
/* parte en líneas por palabras (máx maxLines, la última se recorta) */
function uiWrap(s, maxW, maxLines){
  const words = String(s).split(' '); const L = [];
  let cur = '';
  for(const w of words){
    const t = cur ? cur+' '+w : w;
    if(textW(t) <= maxW || !cur) cur = t; else { L.push(cur); cur = w; }
  }
  if(cur) L.push(cur);
  if(maxLines && L.length > maxLines){ const rest = L.slice(maxLines-1).join(' '); L.length = maxLines-1; L.push(uiFit(rest+'  ', maxW).replace(/\.?$/,'.')); }
  return L.map(l=>uiFit(l, maxW));
}
/* texto con sombra de 1px debajo (títulos sobre papel) */
function uiTextSh(s, x, y, col, sh){ drawText(s, x, y+1, sh||'rgba(26,20,40,0.25)'); drawText(s, x, y, col); }

/* ---------------- números que se animan ---------------- */
const UI_COUNT = {};
function uiCount(key, target){
  const now = performance.now();
  let c = UI_COUNT[key];
  if(!c){ c = UI_COUNT[key] = {v:target, t:now, chg:0, dir:0}; return Math.round(target); }
  const dt = Math.min(100, now-c.t); c.t = now;
  if(Math.abs(target - c.v) > 0.5 && (!c.last || c.last!==target)){ c.chg = now; c.dir = target > c.v ? 1 : -1; }
  c.last = target;
  c.v += (target - c.v) * (1 - Math.exp(-dt/90));
  if(Math.abs(target-c.v) < 0.5) c.v = target;
  return Math.round(c.v);
}
/* ms desde el último cambio y dirección (+1 sube, -1 baja) */
function uiCountAge(key){ const c = UI_COUNT[key]; return c ? [performance.now()-c.chg, c.dir] : [1e9, 0]; }

/* ---------------- entrada escalonada ---------------- */
/* reinicia el escalonado (p.ej. al cambiar de pestaña) */
function uiRestagger(){ UI.staggerAt = performance.now(); }
function uiStagger(i, step){
  const base = Math.max(UI.menuAt||0, UI.staggerAt||0);
  const t = performance.now() - base - (i||0)*(step||30);
  const k = ease.outCubic(clamp01(t/200));
  return {dx: Math.round((1-k)*6), alpha: k};
}
/* envuelve un dibujo con el escalonado i */
function uiStag(i, fn, step){
  const s = uiStagger(i, step);
  if(s.alpha <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= s.alpha; ctx.translate(s.dx, 0);
  fn(); ctx.restore();
}

/* ---------------- toque: hundirse, destello, negación ---------------- */
function uiPress(k){ UI.uiPress = {k:uiKey(k), t:performance.now()}; }
/* 1 mientras la pulsación está fresca (≈130ms): el elemento se hunde 1px */
function uiPressed(k){ const p = UI.uiPress; return p && p.k===uiKey(k) && performance.now()-p.t < 130 ? 1 : 0; }
/* 0..1 destello que se apaga en 260ms tras pulsar */
function uiPressGlow(k){ const p = UI.uiPress; if(!p || p.k!==uiKey(k)) return 0; return 1-clamp01((performance.now()-p.t)/260); }
/* acción fallida: la FILA tiembla y muestra el porqué en rojo dentro del panel */
function uiDeny(k, msg){ UI.uiDeny = {k:uiKey(k), t:performance.now(), msg:msg||''}; }
function uiDenyOff(k){ const d = UI.uiDeny; return d && d.k===uiKey(k) ? Math.round(springOff(d.t, 3)) : 0; }
function uiDenyMsg(k){ const d = UI.uiDeny; return d && d.k===uiKey(k) && performance.now()-d.t < 1800 ? d.msg : ''; }
/* destello de compra (clave → ms) */
function uiFlash(k){ UI.uiFlashAt = UI.uiFlashAt||{}; UI.uiFlashAt[uiKey(k)] = performance.now(); }
function uiFlashK(k){ const f = UI.uiFlashAt && UI.uiFlashAt[uiKey(k)]; return f ? 1-clamp01((performance.now()-f)/320) : 0; }

/* ---------------- glifos ---------------- */
function uiLock(x, y, col){
  col = col || '#6a6072';
  px(x+1, y, 3, 1, col); px(x, y+1, 1, 2, col); px(x+4, y+1, 1, 2, col);
  px(x, y+3, 5, 4, col); px(x+2, y+4, 1, 2, '#f6efe0');
}
function uiCoin(x, y, col, hi){  /* mota 5x5 */
  col = col || UIC.gold;
  px(x+2, y, 1, 5, col); px(x, y+2, 5, 1, col); px(x+1, y+1, 3, 3, col);
  px(x+2, y+2, 1, 1, hi || '#ffffff');
}
/* silueta teñida de un sprite (cacheada) */
const _tintCache = new Map();
function uiTint(spr, col){
  let m = _tintCache.get(spr); if(!m){ m = new Map(); _tintCache.set(spr, m); }
  let c = m.get(col); if(c) return c;
  c = document.createElement('canvas'); c.width = spr.width; c.height = spr.height;
  const g = c.getContext('2d'); g.drawImage(spr, 0, 0);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  m.set(col, c); return c;
}
function uiCheck(x, y, col){ col = col||UIC.greenTx; px(x, y+2, 1, 1, col); px(x+1, y+3, 1, 1, col); px(x+2, y+2, 1, 1, col); px(x+3, y+1, 1, 1, col); px(x+4, y, 1, 1, col); }

/* ---------------- iconos 10x10 del kit ---------------- */
const UIIC = {};
(function buildUIIcons(){
  const P = {k:K, y:'#ffd94a', o:'#c8a04b', w:'#ffffff', r:'#e2574c', R:'#a03030', g:'#7ac74f', G:'#3a7048',
    b:'#5ec8d8', B:'#3a78a8', p:'#a68af0', n:'#b07a44', N:'#6a4a2a', s:'#b4b4bc', S:'#6a6a78', c:'#f6efe0', i:'#f2a2b8', e:'#f0a04b'};
  const mk = (rows, pal)=>mkSprite(Object.assign({}, P, pal||{}), rows);
  UIIC.mota = mk(["....k.....","...kyk....","...kyk....",".kkywykk..","kyywwwyyk.",".kkywykk..","...kyk....","...kyk....","....k.....",".........."]);
  UIIC.cosecha = mk(["..y....y..","...y..y...",".y.kkkk.y.","..kyywyk..","kknnnnnnkk","knNnNnNnNk","knnnnnnnnk",".knNnNnNk.",".knnnnnnk.","..kkkkkk.."]);
  UIIC.aura = mk(["...pppp...","..p....p..",".p..yy..p.","p..yyyy..p","p.yywwyy.p","p.yywwyy.p","p..yyyy..p",".p..yy..p.","..p....p..","...pppp..."]);
  UIIC.iman = mk(["kkkk..kkkk","kwsk..kwsk","kssk..kssk","krrk..krrk","krrk..krrk","krrk..krrk","krrkkkkrrk","krrrrrrrRk",".kRrrrrRk.","..kkkkkk.."]);
  UIIC.comedero = mk(["..........","...nNnn...","..nnnNnn..",".kkkkkkkk.","kbbbbbbbbk","kbwbbbbbbk",".kbbbbbbk.",".kBBBBBBk.","..kkkkkk..",".........."]);
  UIIC.juguete = mk(["..kkkkk...",".kwrrrrk..","kwwrrrrrk.","krrrwwrrk.","krrwwwwrk.","krrrwwrrk.","krrrrrrRk.",".kRrrrRk..","..kkkkk...",".........."]);
  UIIC.cama = mk(["..........","k.........","kn........","knccbbbbb.","knccbbbbbk","knkkkkkkkk","knnnnnnnnk","kNNNNNNNNk","kk......kk",".........."]);
  UIIC.jardin = mk(["...kkk....","..kiiik...",".kkiyikk..","kiiyyyiik.",".kkiyikk..","..kiiik...","...kGk....",".kkkGkkk..",".kgggggk..","..kkkkk..."]);
  UIIC.nido = mk(["...kkkk...","..kccwck..",".kccccwck.",".kcccccck.","knkccccknk","knnkkkknnk","kNnnNnnNnk",".knNnnNnk.","..kkkkkk..",".........."]);
  UIIC.fue = mk(["........kk",".......kwk","......kwk.",".....kwk..","k...kwk...","kk.kwk....",".kkyk.....","..kk......",".kNkk.....","kNk.kk...."]);
  UIIC.def = mk(["kkkkkkkkk.","kbbbwbbbk.","kbbbwbbbk.","kbbbwbbbk.","kwwwwwwwk.","kbbbwbbbk.",".kbbwbbk..","..kbwbk...","...kkk....",".........."]);
  UIIC.vel = mk(["....kkkk..","...kyyk...","..kyyk....",".kyyykkk..",".kkkyyyyk.","....kyyk..","...kyyk...","..kyyk....","..kyk.....","..kk......"]);
  UIIC.heart = mk(["..........",".kkk.kkk..","krrrkrrrk.","krwrrrrrk.","krrrrrrrk.",".krrrrrk..","..krrrk...","...krk....","....k.....",".........."]);
  UIIC.star = mk(["....k.....","...kyk....","kkkyyykkk.","kyyyywyyk.",".kyyyyyk..","..kyyyk...",".kyykyyk..",".kk...kk..","..........",".........."]);
  UIIC.trofeo = mk(["kkkkkkkkk.","kyyyyywyk.",".kyyyyyk..",".kyyyyyk..","..kyyyk...","...kyk....","...kok....","..kkkkk...","..koook...","..kkkkk..."]);
  UIIC.fallo = mk(["kk....kk..","krk..krk..",".krkkrk...","..krrk....","..krrk....",".krkkrk...","krk..krk..","kk....kk..","..........",".........."]);
  UIIC.edad = mk(["..kkkkk...",".kcckcck..","kccckccck.","kccckccck.","kccckkkck.","kccccccck.",".kccccck..","..kkkkk...","..........",".........."]);
  UIIC.peso = mk(["...kkk....","..k...k...","..k...k...",".kkkkkkk..","kSSSSSSSk.","kSsSSSSSk.","kSSSSSSSk.",".kSSSSSk..","..kkkkk...",".........."]);
  UIIC.nivel = mk(["....k.....","...kgk....","..kgggk...",".kgggggk..","kkkgggkkk.","..kgggk...","..kgggk...","..kkkkk...","..........",".........."]);
  UIIC.cara = mk(["..kkkkk...",".kyyyyyk..","kykyyykyk.","kyyyyyyyk.","kykyyykyk.","kyykkkyyk.",".kyyyyyk..","..kkkkk...","..........",".........."]);
  UIIC.brote = mk(["..........","..kk.kk...",".kggkggk..",".kgGkGgk..","..kkGkk...","...kGk....",".kknnnkk..",".knnnnnk..","..kkkkk...",".........."]);
  UIIC.flores_pastel = mk(["...kkk....","..kiiik...",".kkiyikk..","kbbyyyiik.",".kkiyikk..","..kbbik...","...kGk....",".kkkGkkk..",".kgggggk..","..kkkkk..."], {i:'#f2a2b8', b:'#9adcf0'});
  UIIC.flores_fuego = mk(["...kkk....","..kiiik...",".kkiyikk..","kiiyyyiik.",".kkiyikk..","..kiiik...","...kGk....",".kkkGkkk..",".kgggggk..","..kkkkk..."], {i:'#e8574c', y:'#ffd94a'});
  UIIC.valla = mk(["kk..kk..kk","nn..nn..nn","nnkknnkknn","nnnnnnnnnn","nnkknnkknn","nn..nn..nn","nnkknnkknn","nnnnnnnnnn","NNkkNNkkNN","NN..NN..NN"]);
  UIIC.camino = mk(["....kkk...","...kswsk..","...kSSSk..","....kkk...",".kkk......","kswsk.kkk.","kSSSkkswsk",".kkk.kSSSk","......kkk.",".........."]);
  UIIC.cielo = mk(["......w...","..kkk.....",".kyyk...w.","kyyk......","kyyk......","kyyk..w...","kyyyk.....",".kyyyykk..","..kkkk....",".........."]);
  UIIC.copia = mk(["kkkkkk....","kcccck....","kckkkkkk..","kckccccck.","kkkcgggck.","..kccccck.","..kcgggck.","..kccccck.","..kkkkkkk.",".........."]);
  UIIC.carga = mk(["...kk.....","..kbbk....",".kbbbbk...","kkkbbkkk..","..kbbk....","..kbbk....","kk.kk..kk.","kc.....ck.","kkkkkkkkk.",".........."]);
  UIIC.foto = mk(["..........","..kkk.....","kkkkkkkkk.","kssskkssk.","ksskbbksk.","kskbwbbkk.","ksskbbksk.","kssskksk k".replace(' ','.'),"kkkkkkkkk.",".........."]);
  UIIC.aro = mk(["..kkkkk...",".kyyyyyk..","kyk...kyk.","kyk...kyk.","kyk...kyk.","kyk...kyk.",".kyyyyyk..","..kkkkk...","..........",".........."]);
  UIIC.album = mk(["kkkkkkkk..","kpppppwk..","kpkkkkpk..","kpkcckpk..","kpkkkkpk..","kppppppk..","kpyyyypk..","kppppppk..","kkkkkkkk..",".........."]);
})();

/* ---------------- ranura de icono ---------------- */
/* icon: canvas | function(cx,cy) | null. o: {s:16, dim, lock, bg} */
function iconSlot(x, y, icon, o){
  o = o||{}; const s = o.s||16;
  px(x, y, s, s, o.bg || UIC.well);
  px(x, y, s, 1, UIC.wellLo); px(x, y, 1, s, UIC.wellLo);
  px(x+1, y+s-1, s-1, 1, UIC.wellHi); px(x+s-1, y+1, 1, s-1, UIC.wellHi);
  const cx = x + s/2, cy = y + s/2;
  if(icon){
    ctx.save();
    ctx.beginPath(); ctx.rect(x+1, y+1, s-2, s-2); ctx.clip();
    if(o.dim) ctx.globalAlpha *= 0.4;
    if(typeof icon==='function') icon(cx, cy);
    else {
      const img = o.sil && typeof silhouette==='function' ? silhouette(icon) : icon;
      ctx.drawImage(img, Math.round(cx - icon.width/2), Math.round(cy - icon.height/2));
    }
    ctx.restore();
  }
  if(o.lock) uiLock(x+s-6, y+s-8);
}

/* ---------------- píldoras e insignias ---------------- */
/* precio alineado a la derecha en xr; devuelve el x izquierdo */
function pricePill(xr, y, cost, afford){
  const s = fmt(cost), w = textW(s) + 12, x = xr - w;
  uiBox(x, y, w, 9, afford ? UIC.gold : '#eadfbe', afford ? uiDark(UIC.gold,0.55) : '#b8a98a');
  if(afford){ px(x+1, y+1, w-2, 1, UIC.goldHi); px(x+1, y+7, w-2, 1, UIC.goldLo); }
  uiCoin(x+2, y+2, afford ? '#b0801c' : '#c8a04b', afford ? '#fff3a8' : '#fff8d0');
  drawText(s, x+8, y+2, afford ? K : UIC.redTx);
  return x;
}
const UI_BADGE = {
  TUYO:   {bg:'#c8ecb0', fg:'#2a5a30', rim:'#5a9a48'},
  PUESTO: {bg:'#ffe9a0', fg:'#7a5a08', rim:'#c8a04b', dot:true},
  MAX:    {bg:'#3b3552', fg:'#ffd94a', rim:K},
  LOCK:   {bg:'#cfc6b0', fg:'#6a6072', rim:'#a89c84', lock:true},
  NUEVO:  {bg:'#e2574c', fg:'#ffffff', rim:'#a03030'},
  LISTO:  {bg:'#7ac74f', fg:'#ffffff', rim:'#3a7048'}
};
/* kind: clave de UI_BADGE o {text,bg,fg,rim,lock}; text opcional para LOCK */
function badge(xr, y, kind, text){
  const B = typeof kind==='string' ? (UI_BADGE[kind]||UI_BADGE.TUYO) : kind;
  const s = text!==undefined ? text : (typeof kind==='string' ? (kind==='LOCK' ? '' : kind) : (B.text||''));
  const lw = B.lock ? 6 : (B.dot ? 4 : 0);
  const w = (s ? textW(s) : -1) + 6 + lw, x = xr - w;
  uiBox(x, y, w, 9, B.bg, B.rim);
  px(x+1, y+1, w-2, 1, 'rgba(255,255,255,0.35)');
  if(B.lock) uiLock(x+3, y+1, B.fg);
  if(B.dot){ px(x+3, y+3, 2, 3, B.fg); }
  if(s) drawText(s, x+3+lw, y+2, B.fg);
  return x;
}
/* píldora de motas para la cabecera (anima la cifra) */
function uiCurrency(xr, y){
  const v = uiCount('motas', G.motas);
  const [age, dir] = uiCountAge('motas');
  const s = fmt(v), w = textW(s) + 13, x = xr - w;
  const bump = age < 220 ? Math.round(-1.5*Math.sin(age/220*Math.PI)) : 0;
  uiBox(x, y+bump, w, 10, 'rgba(26,20,40,0.55)', null);
  px(x+1, y+bump, w-2, 1, 'rgba(0,0,0,0.25)');
  uiCoin(x+2, y+2+bump);
  drawText(s, x+9, y+3+bump, age<300 ? (dir<0 ? '#ff9a8a' : '#ffffff') : UIC.gold);
  return x;
}

/* ---------------- panel con cabecera ---------------- */
/* o: {x,y,w,h,title,icon,color,currency, sub}
   devuelve el área de contenido {x,y,w,h} (debajo de la cabecera) */
function uiPanel(o){
  const x=o.x, y=o.y, w=o.w, h=o.h;
  const col = UI_CAT[o.color] || o.color || UI_CAT.neutral;
  panel(x, y, w, h);
  const hh = o.headH || 15;
  const hx = x+2, hy = y+2, hw = w-4;
  /* banda de cabecera con brillo, rayas suaves y filo oscuro */
  px(hx, hy, hw, hh, col);
  px(hx, hy, hw, 1, uiLight(col, 0.45));
  px(hx, hy+1, hw, 1, uiLight(col, 0.18));
  ctx.globalAlpha = 0.08; ctx.fillStyle = '#ffffff';
  for(let i=-hh; i<hw; i+=6) for(let j=2;j<hh-1;j++){ const xx = hx+i+j; if(xx>=hx && xx<hx+hw) ctx.fillRect(xx, hy+j, 2, 1); }
  ctx.globalAlpha = 1;
  px(hx, hy+hh-1, hw, 1, uiDark(col, 0.3));
  px(hx, hy+hh, hw, 1, uiDark(col, 0.6));
  px(hx, hy+hh+1, hw, 1, 'rgba(26,20,40,0.12)');
  let tx = hx + 5;
  if(o.icon){
    const ic = typeof o.icon==='string' ? (IC[o.icon] || UIIC[o.icon]) : o.icon;
    if(ic){
      const iy = hy + Math.round((hh - ic.height)/2);
      /* halo oscuro detrás del icono para que destaque */
      ctx.globalAlpha = 0.25; ctx.drawImage(silhouette(ic), tx+1, iy+1); ctx.globalAlpha = 1;
      ctx.drawImage(ic, tx, iy); tx += ic.width + 4;
    }
  }
  if(o.title) drawTextO(o.title, tx, hy + Math.round((hh-5)/2), '#ffffff', 1, uiDark(col, 0.55));
  if(o.currency) uiCurrency(x + w - 13, hy + Math.round((hh-10)/2));
  else if(o.right) drawText(o.right, x + w - 14 - textW(o.right), hy + Math.round((hh-5)/2), 'rgba(255,255,255,0.85)');
  UI.panelHead = {x:hx, y:hy, w:hw, h:hh, col};
  return {x:x+4, y:hy+hh+4, w:w-8, h:h-hh-9};
}

/* ---------------- filas ---------------- */
/* o: {x,y,w,h, key, i, icon, iconO, title, sub, price, afford, badge, badgeText,
        state:'normal'|'poor'|'locked'|'owned'|'on', stripe, right(fn(xr,cy)→xLeft), subCol}
   el precio/insignia va a la derecha; el texto se recorta solo */
function uiRow(o){
  const key = o.key || o;
  const st = uiStagger(o.i||0);
  if(st.alpha <= 0.01) return;
  const sink = uiPressed(key), glow = uiPressGlow(key), flash = uiFlashK(key);
  const deny = uiDenyOff(key);
  const x = o.x, y = o.y, w = o.w, h = o.h;
  ctx.save();
  ctx.globalAlpha *= st.alpha;
  ctx.translate(st.dx + deny, sink);
  const state = o.state || 'normal';
  const bg = {normal:UIC.card, poor:UIC.poor, locked:UIC.locked, owned:UIC.owned, on:UIC.on}[state] || UIC.card;
  /* sombra de pieza física */
  if(!sink) px(x+1, y+h, w-2, 1, 'rgba(26,20,40,0.22)');
  uiBox(x, y, w, h, bg, state==='locked' ? '#6a6072' : K);
  if(state!=='locked') px(x+1, y+1, w-2, 1, state==='poor' ? '#f6f0e0' : UIC.cardHi);
  px(x+1, y+h-2, w-2, 1, 'rgba(26,20,40,0.08)');
  if(o.stripe) px(x+1, y+2, 2, h-4, o.stripe);
  /* icono */
  let tx = x + 4;
  if(o.icon!==undefined){
    const s = Math.min(16, h-4);
    iconSlot(x+4, y+Math.round((h-s)/2), o.icon, Object.assign({s, dim:state==='locked'}, o.iconO||{}));
    tx = x + 4 + s + 4;
  }
  /* lado derecho */
  let xr = x + w - 4;
  const cy = y + Math.round(h/2);
  if(o.right) xr = o.right(xr, cy) - 3;
  else if(o.price!==undefined) xr = pricePill(xr, cy-4, o.price, o.afford!==false) - 3;
  else if(o.badge) xr = badge(xr, cy-4, o.badge, o.badgeText) - 3;
  /* texto */
  const tw = xr - tx;
  const dmsg = uiDenyMsg(key);
  const tcol = state==='locked' ? 'rgba(26,20,40,0.5)' : K;
  if(o.sub || o.subFn || dmsg){
    const ty = y + Math.max(2, Math.round((h-(o.subFn?14:12))/2));
    drawText(uiFit(o.title||'', tw), tx, ty, tcol);
    if(dmsg) drawText(uiFit(dmsg, tw), tx, ty+(o.subFn?9:7), UIC.redTx);
    else if(o.subFn) o.subFn(tx, ty+9, tw);
    else drawText(uiFit(o.sub, tw), tx, ty+7, o.subCol || UIC.muted);
  } else drawText(uiFit(o.title||'', tw), tx, y + Math.round((h-5)/2), tcol);
  /* destellos */
  if(glow>0 || flash>0){
    ctx.globalAlpha = Math.max(glow*0.35, flash*0.7) * st.alpha;
    uiBox(x, y, w, h, flash>0 ? '#fff3a8' : '#ffffff', null);
  }
  ctx.restore();
  return {x, y, w, h};
}

/* ---------------- pestañas ---------------- */
/* tabs: ['A','B'] o [{label, icon}] ; devuelve rects (misma geometría que uiTabRects) */
function uiTabRects(x, y, w, n, gap){
  gap = gap===undefined ? 2 : gap;
  const tw = Math.floor((w - gap*(n-1))/n), R = [];
  for(let i=0;i<n;i++) R.push({x:x+i*(tw+gap), y, w: i===n-1 ? w-(tw+gap)*(n-1) : tw, h:12});
  return R;
}
function uiTabs(x, y, w, tabs, active, color, gap){
  const col = UI_CAT[color] || color || UIC.gold;
  const R = uiTabRects(x, y, w, tabs.length, gap);
  /* raíl hundido debajo */
  px(x, y+12, w, 1, 'rgba(26,20,40,0.18)');
  R.forEach((r, i)=>{
    const T = typeof tabs[i]==='string' ? {label:tabs[i]} : tabs[i];
    const on = i===active;
    const sink = uiPressed('tab'+i+T.label);
    if(on){
      px(r.x+1, r.y+12, r.w-2, 1, 'rgba(26,20,40,0.3)');
      uiBox(r.x, r.y-1+sink, r.w, 13, col, K);
      px(r.x+1, r.y+sink, r.w-2, 1, uiLight(col, 0.5));
      px(r.x+1, r.y+10+sink, r.w-2, 1, uiDark(col, 0.2));
    } else {
      uiBox(r.x, r.y+1, r.w, 11, '#d3c8ac', '#8a7e68');
      px(r.x+1, r.y+2, r.w-2, 1, 'rgba(26,20,40,0.12)');
    }
    const ic = T.icon ? (typeof T.icon==='string' ? (UIIC[T.icon]||IC[T.icon]) : T.icon) : null;
    const lab = uiFit(T.label, r.w - 4 - (ic ? 0 : 0));
    const ty = on ? r.y+3+sink : r.y+4;
    drawTextC(lab, r.x + r.w/2, ty, on ? K : 'rgba(26,20,40,0.55)');
  });
  return R;
}

/* ---------------- botones ---------------- */
/* o: {x,y,w,h,label,kind:'primary'|'secondary'|'danger'|'ghost',icon,disabled,key,sub}
   se hunde 1px al pulsar (uiPress(key) en el toque) */
function uiButton(o){
  const key = o.key || o.label;
  const x = o.x, y = o.y, w = o.w, h = o.h || 14;
  const kind = o.disabled ? 'disabled' : (o.kind || 'secondary');
  const S = {
    primary:  {bg:UIC.gold, hi:UIC.goldHi, sh:'#b08a2a', fg:K},
    secondary:{bg:UIC.card, hi:UIC.cardHi, sh:'#a89c80', fg:K},
    danger:   {bg:UIC.red, hi:'#f59088', sh:'#8a2a24', fg:'#ffffff'},
    good:     {bg:UIC.green, hi:'#bdf0a0', sh:'#3a7048', fg:K},
    disabled: {bg:'#d6ccb4', hi:'#e4dcc6', sh:'#b0a48a', fg:'rgba(26,20,40,0.4)'}
  }[kind] || {bg:UIC.card, hi:UIC.cardHi, sh:'#a89c80', fg:K};
  const dn = uiPressed(key) ? 1 : 0;
  const deny = uiDenyOff(key);
  ctx.save(); ctx.translate(deny, 0);
  /* cara del botón: h-2 de alto sobre 2px de canto */
  const fh = h-2;
  px(x+1, y+h-1, w-2, 1, 'rgba(26,20,40,0.25)');
  uiBox(x, y+1+dn, w, fh+1-dn, S.sh, K);      /* canto */
  uiBox(x, y+dn, w, fh, S.bg, K);
  px(x+1, y+1+dn, w-2, 1, S.hi);
  const glow = uiPressGlow(key);
  if(glow>0){ ctx.globalAlpha = glow*0.4; uiBox(x, y+dn, w, fh, '#ffffff', null); ctx.globalAlpha = 1; }
  let ic = o.icon ? (typeof o.icon==='string' ? (UIIC[o.icon]||IC[o.icon]) : o.icon) : null;
  /* si el texto no cabe con el icono, manda el texto */
  if(ic && o.label && textW(o.label) > w - 4 - ic.width - 2) ic = null;
  const lab = o.label ? uiFit(o.label, w - 4 - (ic ? ic.width+2 : 0)) : '';
  const cw = (ic ? ic.width + (lab ? 2 : 0) : 0) + (lab ? textW(lab) : 0);
  let cx = Math.round(x + (w - cw)/2);
  const cyT = y + dn + Math.round((fh-5)/2);
  if(ic){ ctx.drawImage(ic, cx, y + dn + Math.round((fh - ic.height)/2)); cx += ic.width + 2; }
  if(lab) drawText(lab, cx, cyT, S.fg);
  ctx.restore();
  return {x, y, w, h};
}

/* ---------------- listas con scroll ---------------- */
/* Estado de inercia por clave. `val` es el scroll actual (lo mueve input.js
   mientras arrastras); al soltar, sigue con inercia y rebota en los bordes.
   Úsalo en el draw:  UI.xScroll = uiScrollTick('x', UI.xScroll||0, max, uiDragging('x')) */
const UI_SCROLL = {};
/* pantallas deslizables: input.js puede consultar UI_SCROLLABLE[UI.mode]
   → {get(), set(v), max()} para arrastrar cualquier lista */
const UI_SCROLLABLE = {};
function uiDragging(mode){
  return typeof shopTouch!=='undefined' && !!shopTouch && shopTouch.mode===mode;
}
function uiScrollTick(key, val, max, touching){
  const now = performance.now();
  let s = UI_SCROLL[key];
  if(!s) s = UI_SCROLL[key] = {prev:val, vel:0, t:now, bounceAt:0, bounceAmp:0};
  const dt = Math.max(1, Math.min(50, now - s.t)); s.t = now;
  val = Math.max(0, Math.min(max, val||0));
  if(touching){
    /* muestras del dedo: la velocidad al soltar sale de los últimos ~100ms */
    s.smp = s.smp || [];
    if(!s.touch){ s.smp.length = 0; s.vel = 0; }
    if(!s.smp.length || s.smp[s.smp.length-1].v !== val) s.smp.push({t:now, v:val});
    while(s.smp.length > 2 && now - s.smp[0].t > 120) s.smp.shift();
    s.prev = val; s.touch = true;
    return val;
  }
  if(s.touch){
    s.touch = false; s.vel = 0;
    const L = s.smp || [];
    if(L.length >= 2 && now - L[L.length-1].t < 90){
      const a = L[0], b = L[L.length-1];
      if(b.t > a.t) s.vel = Math.max(-1.2, Math.min(1.2, (b.v - a.v)/(b.t - a.t)));
    }
  }
  else if(Math.abs(val - s.prev) > 0.5){ s.vel = 0; } /* salto externo (pestaña, reset) */
  if(Math.abs(s.vel) > 0.004){
    let nv = val + s.vel*dt;
    s.vel *= Math.pow(0.94, dt/16);
    if(nv < 0 || nv > max){
      s.bounceAt = now; s.bounceAmp = Math.max(-5, Math.min(5, s.vel*14)) * (nv<0 ? 1 : 1);
      s.vel = 0; nv = nv<0 ? 0 : max;
      if(typeof tone==='function' && Math.abs(s.bounceAmp)>1) tone({f:260, slide:200, d:0.03, type:'triangle', vol:0.012});
    }
    val = nv;
  } else s.vel = 0;
  s.prev = val;
  return Math.max(0, Math.min(max, val));
}
/* desplazamiento visual del rebote (px, positivo = contenido baja) */
function uiScrollBounce(key){
  const s = UI_SCROLL[key]; if(!s || !s.bounceAt) return 0;
  return -Math.round(springOff(s.bounceAt, s.bounceAmp));
}
/* abre la ventana recortada; dibuja con coordenadas de CONTENIDO (y ya desplazada) */
function uiScrollBegin(v, off, key){
  ctx.save();
  ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  ctx.translate(0, -Math.round(off) + (key ? uiScrollBounce(key) : 0));
}
/* cierra: desvanecidos en los bordes + barra de scroll */
function uiScrollEnd(v, off, contentH, bg){
  ctx.restore();
  const max = Math.max(0, contentH - v.h);
  if(max <= 0) return;
  bg = bg || UIC.paper;
  ctx.fillStyle = bg;
  const fade = (yy, dir)=>{ for(let i=0;i<5;i++){ ctx.globalAlpha = (5-i)/6; ctx.fillRect(v.x, yy + dir*i, v.w, 1); } ctx.globalAlpha = 1; };
  if(off > 1) fade(v.y, 1);
  if(off < max-1) fade(v.y+v.h-1, -1);
  const bx = v.x + v.w + (v.barGap===undefined ? 1 : v.barGap);
  const th = Math.max(10, Math.round(v.h*v.h/contentH));
  const ty = v.y + Math.round((v.h-th) * (off/max));
  px(bx, v.y, 2, v.h, 'rgba(26,20,40,0.10)');
  uiBox(bx, ty, 2, th, 'rgba(26,20,40,0.45)', null);
  px(bx, ty, 2, th, 'rgba(26,20,40,0.45)');
  /* flechitas que avisan de que hay más */
  const bob = Math.round(Math.sin(performance.now()/220));
  if(off < max-1){ const ax = v.x + (v.w>>1); px(ax-2, v.y+v.h-3+bob, 5, 1, UIC.muted); px(ax-1, v.y+v.h-2+bob, 3, 1, UIC.muted); px(ax, v.y+v.h-1+bob, 1, 1, UIC.muted); }
}

/* ---------------- barra de progreso compacta ---------------- */
function uiBar(x, y, w, h, k, col, bg){
  k = clamp01(k);
  px(x, y, w, h, bg || 'rgba(26,20,40,0.2)');
  const fw = Math.round(w*k);
  if(fw>0){ px(x, y, fw, h, col); px(x, y, fw, 1, 'rgba(255,255,255,0.45)'); }
}
/* pips de nivel (mejoras): n de max; si max>10 dibuja barra */
function uiPips(x, y, n, max, col, w){
  col = col || UIC.green;
  if(max > 10){ uiBar(x, y, w||30, 3, n/max, col); return; }
  for(let i=0;i<max;i++){
    px(x+i*4, y, 3, 3, i<n ? col : 'rgba(26,20,40,0.18)');
    if(i<n) px(x+i*4, y, 3, 1, 'rgba(255,255,255,0.5)');
  }
}
/* texto de ayuda de pie de panel */
function uiHint(s, cx, y){ drawTextC(s, cx, y, UIC.faint); }
/* separador con título pequeño */
function uiSection(x, y, w, label, col){
  const tw = label ? textW(label) : -4;
  if(label) drawText(label, x, y, col || UIC.muted);
  px(x+tw+4, y+2, w-tw-4, 1, 'rgba(26,20,40,0.15)');
}
