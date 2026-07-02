"use strict";
/* =========================================================
   BITXO — core/canvas: lienzo, escalado pixel-perfect y px()
   ========================================================= */
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
let SCALE = 2;
function resize(){
  const w = window.innerWidth, h = window.innerHeight;
  SCALE = Math.max(1, Math.floor(Math.min(w/LW, h/LH)));
  cv.width = LW; cv.height = LH;
  cv.style.width = (LW*SCALE)+'px';
  cv.style.height = (LH*SCALE)+'px';
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize); resize();

function px(x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),w,h); }
