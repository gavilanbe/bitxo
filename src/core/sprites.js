"use strict";
/* =========================================================
   BITXO — core/sprites: fábrica de sprites y siluetas
   ========================================================= */
/* ---------------- SPRITES ---------------- */
function mkSprite(pal, rows){
  const h = rows.length, w = rows[0].length;
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const g = c.getContext('2d');
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const ch = rows[y][x];
    if(ch && ch!=='.' && pal[ch]){ g.fillStyle=pal[ch]; g.fillRect(x,y,1,1); }
  }
  return c;
}

const _silCache = new Map();
function silhouette(spr){
  if(_silCache.has(spr)) return _silCache.get(spr);
  const c = document.createElement('canvas'); c.width=spr.width; c.height=spr.height;
  const g = c.getContext('2d');
  g.drawImage(spr,0,0);
  g.globalCompositeOperation='source-in';
  g.fillStyle='#ffffff'; g.fillRect(0,0,c.width,c.height);
  _silCache.set(spr,c); return c;
}

/* Iconos de botonera 9x9 */
function mkIcon(rows, c1, c2){ return mkSprite({'1':c1,'2':c2||c1}, rows); }

const _darkCache = new Map();
function darkSilhouette(spr){
  if(_darkCache.has(spr)) return _darkCache.get(spr);
  const c = document.createElement('canvas'); c.width=spr.width; c.height=spr.height;
  const g = c.getContext('2d');
  g.drawImage(spr,0,0);
  g.globalCompositeOperation='source-in';
  g.fillStyle='#3c3458'; g.fillRect(0,0,c.width,c.height);
  _darkCache.set(spr,c); return c;
}
