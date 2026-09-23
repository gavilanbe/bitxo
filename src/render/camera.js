"use strict";
/* =========================================================
   BITXO — render/camera: la cámara del mundo ancho
   Cada zona mide WORLD_W; la pantalla enseña 160. La cámara sigue a tu
   bitxo con suavidad, se arrastra con el dedo (con inercia y rebote) y,
   si algo pasa fuera de cuadro, una flechita en el borde te lo cuenta.
   ========================================================= */
const CAM = {x:0, v:0, manualUntil:0, drag:null, lastZone:null};
function camMax(){ return WORLD_W - LW; }
/* mundo ↔ pantalla */
function toWorldX(sx){ return sx + CAM.x; }
function toScreenX(wx){ return wx - CAM.x; }
/* centra la cámara en una x del mundo (inmediato o suave) */
function camLookAt(wx, instant){
  const tx = Math.max(0, Math.min(camMax(), wx - LW/2));
  if(instant){ CAM.x = tx; CAM.v = 0; }
  else CAM.target = tx;
}
function camStep(dt){
  if(sceneFamily(UI.mode)!=='world' || !G) return;
  /* al cambiar de zona se entra por el lado del que vienes */
  if(CAM.lastZone !== G.zone){
    if(CAM.lastZone){
      const fromRight = ZONE_ORDER.indexOf(CAM.lastZone) > ZONE_ORDER.indexOf(G.zone);
      CAM.x = fromRight ? camMax() : 0; CAM.v = 0; CAM.target = undefined;
    }
    CAM.lastZone = G.zone;
  }
  const now = performance.now();
  if(CAM.drag){ return; }
  /* inercia tras soltar */
  if(Math.abs(CAM.v) > 0.002){
    CAM.x += CAM.v*dt; CAM.v *= Math.exp(-dt/220);
    if(CAM.x < 0){ CAM.x = 0; CAM.v = 0; }
    if(CAM.x > camMax()){ CAM.x = camMax(); CAM.v = 0; }
    return;
  }
  CAM.v = 0;
  let tx = null;
  if(CAM.target!==undefined){ tx = CAM.target; if(Math.abs(CAM.x-tx)<0.5) CAM.target = undefined; }
  else if(now > CAM.manualUntil){
    /* seguir al elegido con zona muerta: solo se mueve si se acerca al borde */
    const p = G.pets[G.sel];
    const focus = UI.carry ? null : (p && (p.zone||'prado')===G.zone ? p.rx : null);
    if(focus!==null){
      const sx = focus - CAM.x;
      if(sx < 48) tx = focus - 48;
      else if(sx > LW-48) tx = focus - (LW-48);
    }
  }
  if(tx!==null){
    tx = Math.max(0, Math.min(camMax(), tx));
    CAM.x += (tx - CAM.x)*(1 - Math.exp(-dt/260));
  }
  CAM.x = Math.max(0, Math.min(camMax(), CAM.x));
}
/* arrastre con el dedo por el prado */
function camDragStart(sx){ CAM.drag = {sx, x0:CAM.x, lastX:sx, lastT:performance.now(), moved:false}; CAM.v = 0; CAM.target = undefined; }
function camDragMove(sx){
  const d = CAM.drag; if(!d) return false;
  if(!d.moved && Math.abs(sx - d.sx) < 5) return false;
  d.moved = true;
  const now = performance.now();
  const nx = d.x0 - (sx - d.sx);
  /* fuera de los bordes cuesta el doble (se nota el tope) */
  CAM.x = nx < 0 ? nx*0.35 : (nx > camMax() ? camMax() + (nx-camMax())*0.35 : nx);
  const dtm = Math.max(1, now - d.lastT);
  CAM.v = -(sx - d.lastX)/dtm * 0.9;
  d.lastX = sx; d.lastT = now;
  return true;
}
function camDragEnd(){
  const d = CAM.drag; CAM.drag = null;
  if(!d) return false;
  if(d.moved){ CAM.manualUntil = performance.now() + 5000; }
  if(CAM.x < 0 || CAM.x > camMax()){ CAM.target = Math.max(0, Math.min(camMax(), CAM.x)); CAM.v = 0; }
  return d.moved;
}
/* ---- lo que pasa fuera de cuadro: flechas con icono en los bordes ---- */
function camOffscreen(t){
  if(!G) return;
  const items = [];
  if(G.wild && (G.wild.zone||'prado')===G.zone) items.push({x:G.wild.x, col:'#e2574c', ch:'!'});
  if(G.buho && G.zone==='prado') items.push({x:G.buho.x, col:'#5ec8d8', ch:'✦'});
  for(const p of G.pets){
    if((p.zone||'prado')!==G.zone || p.stage===STAGES.EGG && p!==G.pets[G.sel]) continue;
    if(petAlert(p)) items.push({x:p.rx, col:'#ffd94a', ch:'!'});
    else if(p===G.pets[G.sel]) items.push({x:p.rx, col:'#fff8d0', ch:'♥'});
  }
  const sp = UI.sparkles.filter(s=>(s.zone||'prado')===G.zone);
  for(const s of sp) items.push({x:s.x, col:'#ffd94a', ch:'✦', small:true});
  let lefts = 0, rights = 0;
  for(const it of items){
    const sx = it.x - CAM.x;
    if(sx >= -2 && sx <= LW+2) continue;
    const left = sx < 0;
    const k = left ? lefts++ : rights++;
    if(k>2) continue;
    const y = 140 - k*12 + Math.round(Math.sin(t/200+k)*1.5);
    const bx = left ? 1 : LW-9;
    const nud = Math.round(Math.abs(Math.sin(t/260))*2)*(left?-1:1);
    ctx.globalAlpha = it.small ? 0.75 : 0.95;
    px(bx+nud, y, 8, 9, '#20243c'); px(bx+nud, y, 8, 1, 'rgba(255,255,255,0.2)');
    drawText(it.ch, bx+nud+2, y+2, it.col);
    /* pico hacia fuera */
    if(left){ px(bx+nud-1, y+3, 1, 3, '#20243c'); } else { px(bx+nud+8, y+3, 1, 3, '#20243c'); }
    ctx.globalAlpha = 1;
  }
}
/* barrita inferior: qué trozo del mundo estás viendo */
function camMinimap(t){
  const w = 40, x0 = 60, y0 = 193;
  const f = CAM.x / camMax(), vw = Math.round(w*LW/WORLD_W);
  const vis = CAM.drag || Math.abs(CAM.v)>0.01 || CAM.target!==undefined || performance.now() < CAM.manualUntil - 3500;
  ctx.globalAlpha = vis ? 0.85 : 0.35;
  px(x0, y0, w, 2, 'rgba(10,8,30,0.5)');
  px(x0 + Math.round((w-vw)*f), y0, vw, 2, '#f6efe0');
  ctx.globalAlpha = 1;
}
