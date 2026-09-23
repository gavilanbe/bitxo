"use strict";
/* =========================================================
   BITXO — render/hats: dónde se pone cada gorro en cada bitxo
   Cada sprite tiene un "ancla" calculada sola (a partir del arte):
     · cabeza  (hx,hy): centro de la cara y fila del contorno superior de la
       cabeza, ignorando antenas, hojas y llamas finas que salen por arriba
     · ojos    (L/R): los píxeles que cambian al parpadear (frame 1)
     · cuello  (nx,ny): justo bajo la boca
     · cima    (top): el píxel más alto (para el halo, que flota)
   Si el cálculo automático falla en algún sprite, HAT_ANCHOR[key] lo corrige.
   Tipos de gorro (HATS[].slot): 'top' (encima), 'eyes' (gafas),
   'neck' (pajarita), 'halo' (flota por encima de todo).
   ========================================================= */

/* correcciones manuales por sprite: cualquier campo del ancla
   (hx: línea central en medios píxeles, p.ej. 7 = entre px 6 y 7; hy: fila;
    nx/ny: cuello; dx/dy: desplazar solo el gorro de encima) */
const HAT_ANCHOR = {
};

const _hatCache = {};
function _hatPixels(c){
  try{ return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; }
  catch(e){ return null; }
}
function hatKeyOf(p){
  return p.form==='grimo' ? 'grimo' : p.line+'_'+(p.form||'babyA');
}
/* analiza un sprite (frame normal + frame de parpadeo) */
function hatAnalyze(f0, f1){
  const W = f0.width, H = f0.height;
  const d0 = _hatPixels(f0), d1 = f1 && f1!==f0 ? _hatPixels(f1) : null;
  const A = {w:W, h:H, hx:W/2, hy:0, top:0, nx:W/2, ny:Math.round(H*0.6), eyes:[]};
  if(!d0) return A;
  const on = (x,y)=> x>=0 && y>=0 && x<W && y<H && d0[(y*W+x)*4+3]>0;
  /* fila más alta con algo */
  let top = 0; while(top<H && ![...Array(W).keys()].some(x=>on(x,top))) top++;
  A.top = top;
  A.mask = new Uint8Array(W*H); for(let y=0;y<H;y++) for(let x=0;x<W;x++) A.mask[y*W+x] = on(x,y)?1:0;
  /* ojos = lo que cambia al parpadear */
  const diff = [];
  if(d1) for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const i = (y*W+x)*4;
    if(d0[i]!==d1[i] || d0[i+1]!==d1[i+1] || d0[i+2]!==d1[i+2] || d0[i+3]!==d1[i+3]) diff.push([x,y]);
  }
  let faceX = null, eyeY0 = null, eyeY1 = null;
  if(diff.length){
    const xs = [...new Set(diff.map(d=>d[0]))].sort((a,b)=>a-b);
    let gi = -1, gap = 1;
    for(let i=1;i<xs.length;i++) if(xs[i]-xs[i-1]>gap){ gap = xs[i]-xs[i-1]; gi = i; }
    const groups = gi<0 ? [xs] : [xs.slice(0,gi), xs.slice(gi)];
    for(const g of groups){
      const pts = diff.filter(d=>g.includes(d[0]));
      const x0 = Math.min(...pts.map(d=>d[0])), x1 = Math.max(...pts.map(d=>d[0]));
      const y0 = Math.min(...pts.map(d=>d[1])), y1 = Math.max(...pts.map(d=>d[1]));
      A.eyes.push({x0, x1, y0, y1});
    }
    eyeY0 = Math.min(...A.eyes.map(e=>e.y0));
    eyeY1 = Math.max(...A.eyes.map(e=>e.y1));
    faceX = A.eyes.length===2 ? (A.eyes[0].x0 + A.eyes[1].x1 + 1)/2 : (A.eyes[0].x0 + A.eyes[0].x1 + 1)/2;
  }
  if(eyeY0===null){ eyeY0 = Math.round(H*0.45); eyeY1 = eyeY0; faceX = W/2; }
  /* tramo opaco de una fila que pasa por (o cerca de) x */
  const runAt = (y, x)=>{
    let cx = Math.floor(x);
    if(!on(cx,y)){ let f = -1; for(let k=1;k<=2 && f<0;k++){ if(on(cx-k,y)) f = cx-k; else if(on(cx+k,y)) f = cx+k; } if(f<0) return null; cx = f; }
    let a = cx, b = cx; while(on(a-1,y)) a--; while(on(b+1,y)) b++;
    return [a, b];
  };
  const er = runAt(eyeY0, faceX);
  const faceW = er ? er[1]-er[0]+1 : W;
  const thr = Math.max(4, Math.round(faceW*0.5));
  let hy = top, hrun = null;
  for(let y=top; y<eyeY0; y++){
    const r = runAt(y, faceX);
    if(r && r[1]-r[0]+1 >= thr){ hy = y; hrun = r; break; }
  }
  A.hy = hy;
  /* con dos ojos manda la cara; con uno (perfil), el centro de la cabeza */
  A.hx = A.eyes.length===2 ? faceX : (hrun ? (hrun[0]+hrun[1]+1)/2 : faceX);
  A.hw = hrun ? hrun[1]-hrun[0]+1 : faceW;
  A.nx = faceX;
  /* cuello: bajo la boca (el primer trazo oscuro interior bajo los ojos) */
  const isK = (x,y)=>{ if(!on(x,y)) return false; const i=(y*W+x)*4; return d0[i]+d0[i+1]+d0[i+2] < 150; };
  let mouth = -1;
  for(let y=eyeY1+1; y<H-1 && mouth<0; y++)
    for(let x=Math.floor(faceX)-2; x<=Math.floor(faceX)+1; x++)
      if(isK(x,y) && on(x-1,y) && on(x+1,y) && on(x,y+1) && on(x,y-1) && !isK(x-1,y-1)) { mouth = y; break; }
  /* ny = primera fila de la pajarita; nb = hasta dónde puede bajar (sin pisar los pies) */
  A.ny = mouth>=0 ? mouth+2 : eyeY1+3;
  let nb = H-1; while(nb>A.ny && !on(Math.floor(faceX), nb)) nb--;
  A.nb = nb;
  return A;
}
function hatAnchorFor(key, spr){
  const fr = SPR[key];
  const f0 = fr ? fr[0] : spr, f1 = fr ? fr[1] : null;
  const c = _hatCache[key];
  if(c && c.src===f0) return c.a;
  const a = Object.assign(hatAnalyze(f0, f1), HAT_ANCHOR[key]||{});
  _hatCache[key] = {src:f0, a};
  return a;
}
/* gafas de sol a medida: una lente sobre cada ojo, puente y patillas */
function drawHatGafas(A, ox, oy, flipX){
  const W = A.w;
  const put = (x,y,w,h,col)=>{
    const X = flipX ? W - x - w : x;
    ctx.fillStyle = col; ctx.fillRect(ox+X, oy+y, w, h);
  };
  const eyes = A.eyes.length ? A.eyes : [{x0:Math.floor(A.hx)-3, x1:Math.floor(A.hx)-2, y0:A.hy+4, y1:A.hy+4},{x0:Math.floor(A.hx)+1, x1:Math.floor(A.hx)+2, y0:A.hy+4, y1:A.hy+4}];
  /* lentes a medida de cada ojo (mín. 2x2), montura negra, patillas */
  const L = eyes.map(e=>{
    const w = Math.max(2, e.x1-e.x0+1), h = Math.max(1, e.y1-e.y0+1);
    const a = Math.round((e.x0+e.x1+1)/2 - w/2);
    return {a, b:a+w-1, t:e.y0, u:e.y0+h-1};
  });
  const t0 = Math.min(...L.map(l=>l.t)), lx = Math.min(...L.map(l=>l.a)), rx = Math.max(...L.map(l=>l.b));
  const on = (x,y)=>{ const c = A.mask; return c && x>=0 && y>=0 && x<W && y<A.h && c[y*W+x]; };
  /* patillas hasta el borde de la cara */
  let tl = lx-2; while(tl>lx-4 && on(tl-1,t0)) tl--;
  let tr = rx+2; while(tr<rx+4 && on(tr+1,t0)) tr++;
  put(tl, t0, lx-1-tl, 1, K); put(rx+2, t0, tr-rx-1, 1, K);
  /* puente */
  put(lx, t0-1, rx-lx+1, 1, K);
  for(const l of L){
    put(l.a-1, l.t-1, l.b-l.a+3, l.u-l.t+3, K);
    put(l.a, l.t, l.b-l.a+1, l.u-l.t+1, '#2a2e4a');
    put(l.a, l.u, l.b-l.a+1, 1, '#1c2036');
    put(l.a, l.t, 1, 1, '#9ae4f0');
  }
}
/* dibuja el gorro del bitxo p sobre el sprite spr pintado en (ox,oy)
   (en el sistema de coordenadas actual; flipX si el sprite va espejado) */
function drawPetHat(p, spr, ox, oy, flipX){
  if(!p || !p.hat || !spr) return;
  const H = HAT_BY_ID[p.hat]; let hs = SPR['hat_'+p.hat];
  if(!H || !hs) return;
  const A = hatAnchorFor(hatKeyOf(p), spr);
  const slot = H.slot || 'top';
  if(slot==='eyes'){ drawHatGafas(A, ox, oy, flipX); return; }
  let cx, ty;
  if(slot==='neck'){
    cx = A.nx;
    /* bitxos pequeñitos sin cuello: pajarita mini justo bajo la boca */
    if(A.nb - A.ny + 1 < 4 && SPR.hat_pajarita_s){ hs = SPR.hat_pajarita_s; ty = Math.max(A.hy+2, Math.min(A.ny - 1, A.nb - hs.height + 1)); }
    else ty = Math.max(A.hy+2, Math.min(A.ny, A.nb - hs.height + 1));
  }
  else if(slot==='halo'){
    cx = A.hx;
    const bob = Math.round(Math.sin(performance.now()/420)) ;
    ty = Math.min(A.top, A.hy) - hs.height - 1 + bob;
  } else {
    cx = A.hx + (A.dx||0);
    ty = A.hy + (H.sink===undefined ? 1 : H.sink) - hs.height + 1 + (A.dy||0);
  }
  let hx = Math.round(cx - hs.width/2);
  if(flipX){
    hx = A.w - hx - hs.width;
    ctx.save(); ctx.translate(ox+hx+hs.width, oy+ty); ctx.scale(-1, 1);
    ctx.drawImage(hs, 0, 0); ctx.restore();
  } else ctx.drawImage(hs, ox+hx, oy+ty);
}
