"use strict";
/* =========================================================
   BITXO — core/color: utilidades HSL y color de línea (K)
   ========================================================= */
/* ---------------- COLOR / ESPECIES ---------------- */
const K = '#1a1428';
function hexToHsl(hex){
  const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b); let h=0,s=0,l=(mx+mn)/2;
  if(mx!==mn){ const d=mx-mn; s=l>0.5? d/(2-mx-mn): d/(mx+mn);
    if(mx===r) h=((g-b)/d+(g<b?6:0)); else if(mx===g) h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; }
  return [h,s,l];
}
function hslToHex(h,s,l){
  h=((h%360)+360)%360;
  const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
  let r=0,g=0,b=0;
  if(h<60){r=c;g=x;} else if(h<120){r=x;g=c;} else if(h<180){g=c;b=x;}
  else if(h<240){g=x;b=c;} else if(h<300){r=x;b=c;} else {r=c;b=x;}
  const f=v=>('0'+Math.round((v+m)*255).toString(16)).slice(-2);
  return '#'+f(r)+f(g)+f(b);
}
function shiftHue(hex, deg, dl=0){
  const [h,s,l]=hexToHsl(hex);
  return hslToHex(h+deg, s, Math.max(0.08,Math.min(0.95,l+dl)));
}
