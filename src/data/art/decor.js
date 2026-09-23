"use strict";
/* =========================================================
   BITXO — data/art/decor: arte y dibujo de la decoración nueva
   buildDecorArt() (tras buildToyArt) crea SPR.dc_*; drawDecorItem()
   pinta cada cosa en el MUNDO con el suelo en y=161, animada.
   Contorno K de 1px, luz arriba-izquierda, rampas de TA.
   ========================================================= */
const DC = {
  terra: ['#5a2418','#8a3c24','#c8643c','#e8905a','#ffc09a'],
  iron:  ['#1e1a2c','#2e2a40','#4a4660','#6e6a88'],
  white: ['#8a826e','#b8ae9a','#e8e0d0','#fffaf0'],
  straw: ['#6a4418','#a06a28','#d09a3c','#f0c860','#fff0a0'],
  lilac: ['#4a2a6a','#7a52a8','#a888d8','#d4c0f4']
};
const DC_FLOWERS = ['#e2574c','#f2a2b8','#ffd94a','#9adcf0','#b89af0','#fff8d0'];
function dcHash(s){ let h = 7; s = String(s); for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) & 0xffff; return h; }
/* forma rellena con contorno: rows = [[dx, w], ...] desde (x,y) */
function dcShape(x, y, rows, col, hi, lo){
  const n = rows.length;
  for(let i=0;i<n;i++){ const r = rows[i]; px(x+r[0]-1, y+i, r[1]+2, 1, K); }
  px(x+rows[0][0], y-1, rows[0][1], 1, K);
  px(x+rows[n-1][0], y+n, rows[n-1][1], 1, K);
  for(let i=0;i<n;i++){
    const r = rows[i];
    px(x+r[0], y+i, r[1], 1, col);
    if(hi && r[1]>1) px(x+r[0], y+i, 1, 1, hi);
    if(lo && r[1]>2) px(x+r[0]+r[1]-1, y+i, 1, 1, lo);
  }
}

function buildDecorArt(){
  /* ---------------- MACETA (maceta de barro con borde) ---------------- */
  SPR.dc_maceta = artCanvas(10, 8, (P)=>{
    const T = DC.terra;
    P(1,1,8,2,T[2]); P(1,1,8,1,T[3]); P(1,1,1,2,T[3]); P(8,2,1,1,T[1]);
    P(2,3,6,4,T[2]); P(2,3,1,4,T[3]); P(3,3,1,1,T[4]); P(6,3,2,4,T[1]); P(2,3,6,1,T[0]);
    P(3,6,4,1,T[1]);
  });
  /* ---------------- BANDERINES: poste ---------------- */
  SPR.dc_poste = artCanvas(5, 31, (P)=>{
    const W = TA.wood;
    P(1,3,3,27,W[2]); P(1,3,1,27,W[3]); P(3,3,1,27,W[1]);
    P(1,1,3,2,W[3]); P(2,1,1,1,W[4]);
  });
  /* ---------------- CAMPANA DE VIENTO: poste en T con sombrerete ---------------- */
  SPR.dc_chime = artCanvas(14, 33, (P)=>{
    const W = TA.wood;
    /* poste con brazo en escuadra (el carillón cuelga a la derecha) */
    P(1,3,3,28,W[2]); P(1,3,1,28,W[3]); P(3,3,1,28,W[1]);
    woodBar(P,1,1,12,2,W); P(2,1,10,1,W[4]);
    P(4,3,1,1,W[2]); P(5,4,1,1,W[1]); P(4,4,1,1,W[3]);
    P(0,30,6,2,W[1]); P(0,30,6,1,W[2]);
    /* cordel del que cuelga */
    P(9,3,1,1,'#c8a878');
  });
  /* ---------------- BANCO de parque: listones y hierro forjado ---------------- */
  SPR.dc_banco = artCanvas(26, 14, (P)=>{
    const W = TA.wood, I = DC.iron;
    /* respaldo */
    woodBar(P,3,1,20,2,W); P(4,1,18,1,W[4]);
    woodBar(P,3,4,20,2,W);
    /* hierro: brazos con voluta y patas */
    P(1,2,2,10,I[2]); P(1,2,1,10,I[3]); P(23,2,2,10,I[2]); P(23,2,1,10,I[3]);
    P(1,1,3,1,I[3]); P(22,1,3,1,I[3]);
    P(0,6,3,1,I[2]); P(23,6,3,1,I[2]); P(0,5,1,1,I[3]); P(25,5,1,1,I[1]);
    /* asiento */
    woodBar(P,1,7,24,2,W); P(2,7,22,1,W[4]);
    P(3,9,20,1,W[1]);
    P(2,12,3,1,I[1]); P(21,12,3,1,I[1]);
  });
  /* ---------------- FAROLA de hierro con farol de cristal ---------------- */
  SPR.dc_farola = artCanvas(11, 36, (P)=>{
    const I = DC.iron;
    /* tejadillo con remate */
    P(5,0,1,1,I[3]); P(4,1,3,1,I[2]); P(2,2,7,1,I[2]); P(1,3,9,1,I[3]); P(1,3,9,1,I[2]); P(2,3,6,1,I[3]);
    /* marco del farol (el cristal se pinta en vivo) */
    P(2,4,1,6,I[2]); P(8,4,1,6,I[1]); P(5,4,1,6,I[1]);
    P(2,10,7,1,I[2]); P(3,11,5,1,I[1]);
    /* columna con anillos */
    P(4,12,3,20,I[2]); P(4,12,1,20,I[3]); P(6,12,1,20,I[1]);
    P(3,16,5,1,I[3]); P(3,26,5,1,I[3]);
    /* pie */
    P(2,31,7,2,I[2]); P(2,31,7,1,I[3]); P(1,33,9,2,I[1]); P(1,33,9,1,I[2]);
  });
  /* ---------------- SETAS del corro ---------------- */
  SPR.dc_seta_r = artCanvas(7, 7, (P)=>{
    P(1,1,5,3,'#e2574c'); P(2,1,3,1,'#ff8a74'); P(1,3,5,1,'#a03030');
    P(2,2,1,1,'#fff8d0'); P(4,1,1,1,'#fff8d0');
    P(2,4,3,2,'#f0e8d4'); P(2,4,1,2,'#ffffff'); P(4,4,1,2,'#c8bca0');
  });
  SPR.dc_seta_c = artCanvas(6, 6, (P)=>{
    P(1,1,4,2,'#c9743a'); P(1,1,2,1,'#e8a060'); P(1,2,4,1,'#8a4a24');
    P(2,3,2,2,'#f0e8d4'); P(2,3,1,2,'#ffffff');
  });
  /* ---------------- MOLINO: torre encalada con tejado cónico ---------------- */
  SPR.dc_molino = artCanvas(20, 35, (P)=>{
    const Wh = DC.white, R = TA.red, S = TA.stone, W = TA.wood;
    for(let y=9;y<33;y++){
      const k = (y-9)/23, w = Math.round(10 + 6*k), x0 = Math.round(10 - w/2);
      P(x0, y, w, 1, Wh[2]);
      P(x0, y, 2, 1, Wh[3]);
      P(x0+w-3, y, 3, 1, Wh[1]); P(x0+w-1, y, 1, 1, Wh[0]);
    }
    /* zócalo de piedra */
    for(let y=29;y<33;y++){ P(2,y,16,1,S[2]); } P(2,29,16,1,S[3]); P(2,32,16,1,S[1]);
    P(6,30,1,2,S[1]); P(12,30,1,2,S[1]); P(9,31,1,1,S[3]);
    /* puerta en arco */
    P(8,24,4,9,W[1]); P(9,23,2,1,W[1]); P(8,24,1,9,W[2]); P(11,28,1,1,TA.gold[2]);
    /* ventanuco */
    P(9,15,2,3,DC.iron[1]); P(9,15,1,1,'#5ec8d8'); P(8,18,4,1,Wh[1]);
    /* tejado cónico */
    const RW = [2,4,6,8,10,12,13];
    for(let i=0;i<RW.length;i++){ const w = RW[i], x0 = Math.round(10 - w/2); P(x0, 2+i, w, 1, R[2]); P(x0, 2+i, 1, 1, R[3]); P(x0+w-1, 2+i, 1, 1, R[1]); }
    P(9,1,2,1,R[3]); P(3,8,14,1,R[1]);
  });
  /* ---------------- ÁRBOL FRUTAL: copa horneada y tronco ---------------- */
  SPR.dc_frutal = artCanvas(30, 38, (P)=>{
    const L = TA.leaf, W = TA.wood;
    /* tronco con raíces */
    P(13,18,4,19,W[2]); P(13,18,1,19,W[3]); P(16,18,1,19,W[1]);
    P(11,35,8,2,W[1]); P(10,36,2,1,W[1]); P(18,36,2,1,W[1]);
    P(15,22,2,1,W[1]); P(12,26,1,3,W[3]);
    /* copa: blobs sombreados */
    const blobs = [[8,11,7],[15,8,8],[22,11,7],[15,14,7],[10,15,5],[21,16,5]];
    for(let y=0;y<24;y++) for(let x=0;x<30;x++){
      let inside = null;
      for(const b of blobs){ const dx = x-b[0], dy = y-b[1]; if(dx*dx+dy*dy <= b[2]*b[2]){ inside = b; break; } }
      if(!inside) continue;
      const dx = x-inside[0], dy = y-inside[1], s = (dx+dy)/inside[2];
      let c = L[3];
      if(s < -0.75) c = L[4]; else if(s > 0.55) c = L[2];
      if(y >= 19) c = L[1];
      P(x, y+1, 1, 1, c);
    }
    /* hojas sueltas de luz */
    for(const [x,y] of [[7,6],[13,3],[18,5],[5,11],[24,9]]) P(x,y,2,1,L[4]);
    for(const [x,y] of [[10,17],[19,19],[24,15]]) P(x,y,2,1,L[1]);
  });
  /* ---------------- COLMENA de paja sobre su mesita ---------------- */
  SPR.dc_colmena = artCanvas(16, 22, (P)=>{
    const S = DC.straw, W = TA.wood;
    const RW = [4,8,10,12,12,12,12,12,12,12,12];
    for(let i=0;i<RW.length;i++){
      const w = RW[i], x0 = Math.round(8 - w/2), y = 1+i;
      const band = i%3===2;
      P(x0, y, w, 1, band ? S[1] : S[2]);
      P(x0, y, 1, 1, band ? S[2] : S[3]); if(!band && w>6) P(x0+1, y, 1, 1, S[4]);
      P(x0+w-2, y, 2, 1, band ? S[0] : S[1]);
    }
    /* piquera */
    P(7,9,3,3,'#2a1808'); P(8,8,1,1,'#2a1808');
    /* tablero y patas */
    woodBar(P,1,12,14,2,W);
    P(3,14,2,7,W[2]); P(3,14,1,7,W[3]); P(11,14,2,7,W[2]); P(12,14,1,7,W[1]);
    P(3,17,10,1,W[1]);
  });
  /* ---------------- CASITA con tejado rojo y chimenea ---------------- */
  SPR.dc_casita = artCanvas(32, 31, (P)=>{
    const R = TA.red, Wh = DC.white, W = TA.wood, S = TA.stone;
    /* chimenea */
    P(22,2,4,7,S[2]); P(22,2,1,7,S[3]); P(25,2,1,7,S[1]); P(21,1,6,2,S[3]); P(21,2,6,1,S[1]);
    /* paredes */
    P(4,13,24,17,Wh[2]); P(4,13,2,17,Wh[3]); P(25,13,3,17,Wh[1]);
    P(4,13,24,1,Wh[1]);
    /* vigas de madera */
    P(4,13,1,17,W[2]); P(27,13,1,17,W[1]); P(4,20,24,1,W[2]); P(4,20,24,1,W[1]);
    /* puerta */
    P(8,21,6,9,W[2]); P(8,21,1,9,W[3]); P(13,21,1,9,W[1]); P(9,20,4,1,W[2]); P(12,25,1,1,TA.gold[2]);
    P(10,22,2,1,W[1]);
    /* ventana redonda con cruz (el vidrio se pinta en vivo) */
    P(18,21,6,6,W[1]); P(19,20,4,1,W[1]); P(19,27,4,1,W[1]);
    /* zócalo */
    P(3,29,26,1,S[1]);
    /* tejado a dos aguas con alero */
    for(let i=0;i<12;i++){
      const w = Math.min(30, 4 + i*2 + 2), x0 = Math.round(16 - w/2), y = 1+i;
      P(x0, y, w, 1, R[2]);
      P(x0, y, 2, 1, R[3]);
      P(x0+w-2, y, 2, 1, R[1]);
      if(i%3===2) P(x0+2, y, w-4, 1, R[1]);
    }
    P(15,1,2,1,R[4]);
  });
  /* ---------------- PEDESTAL de la estatua ---------------- */
  SPR.dc_pedestal = artCanvas(20, 11, (P)=>{
    const S = TA.stone;
    P(1,1,18,2,S[3]); P(1,1,18,1,S[4]); P(18,1,1,2,S[1]);
    P(3,3,14,6,S[2]); P(3,3,1,6,S[3]); P(15,3,2,6,S[1]);
    P(6,4,8,3,TA.gold[1]); P(6,4,8,1,TA.gold[2]); P(7,5,6,1,TA.gold[0]);
    P(1,9,18,1,S[1]); P(2,9,16,1,S[2]);
    P(3,8,2,1,'#5a8a44'); P(15,8,1,1,'#5a8a44'); P(16,7,1,1,'#7ac74f');
  });
  /* ---------------- JUGLAR: el visitante (dos cuadros: normal / rasgueo) ---------------- */
  const jgPal = {k:K,l:DC.lilac[2],L:DC.lilac[3],d:DC.lilac[1],R:TA.red[2],r:TA.red[1],h:TA.red[3],Y:TA.gold[2],y:TA.gold[1],w:'#ffffff',p:'#f2a2b8',W:TA.wood[2],V:TA.wood[3],B:TA.wood[1],e:'#1a1428'};
  const JG = [
"........YY......",
".......kYk......",
"....kkkkkkkk....",
"...kRhRRRRRrk...",
"..kkkkkkkkkkkk..",
"..kLLllllllldk..",
".kLllwellwelldk.",
".klllkellkeldldk",
".klplllllllpldk.",
".kllllleellllldk",
".kdllVVVlllllldk",
"..kdlVBVBBBBBkk.",
"..kddVVVldddk...",
"...kkkkkkkkk....",
"....kdk..kdk....",
"....kkk..kkk...."];
  const JG1 = JG.slice();
  JG1[6] = ".kLlllllllllldk.";
  JG1[7] = ".kllkkellkkeldk.";
  JG1[10]= ".kdllVVVllllllk.";
  JG1[11]= "..kdlVBVBBBBBBk.";
  SPR.dc_juglar = [mkSprite(jgPal, JG), mkSprite(jgPal, JG1)];
  /* ---------------- REGALO del juglar ---------------- */
  SPR.dc_regalo = mkSprite({k:K,R:TA.red[2],r:TA.red[1],h:TA.red[3],Y:TA.gold[2],y:TA.gold[1],w:TA.gold[3]},[
"..kk..kk..",
".kwYkkYyk.",
"..kkYYkk..",
"kkkkYYkkkk",
"khRRYYRRrk",
"kRRRYyRRrk",
"kkkkYykkkk",
"khRRYyRRrk",
"kRRRYyRrrk",
"kkkkkkkkkk"]);

  /* ---------------- ICONOS de tienda (<=14x12) ---------------- */
  SPR.ico_d_maceta = artCanvas(12, 12, (P, g)=>{
    g.drawImage(SPR.dc_maceta, 1, 4);
    P(3,2,1,3,TA.leaf[2]); P(6,1,1,4,TA.leaf[2]); P(8,2,1,3,TA.leaf[2]);
    P(2,1,3,2,'#e2574c'); P(5,0,3,2,'#ffd94a'); P(7,1,3,2,'#f2a2b8');
  }, false);
  SPR.ico_d_banderines = artCanvas(14, 12, (P)=>{
    P(0,1,1,11,TA.wood[2]); P(13,1,1,11,TA.wood[2]);
    P(1,2,12,1,'#f6efe0');
    const c = ['#e2574c','#ffd94a','#5ec8d8','#7ac74f'];
    for(let i=0;i<4;i++){ const x = 1+i*3; P(x,3,3,1,c[i]); P(x,4,3,1,c[i]); P(x+1,5,1,1,c[i]); }
  });
  SPR.ico_d_campanilla = artCanvas(12, 12, (P)=>{
    P(1,0,10,2,TA.wood[2]); P(1,0,10,1,TA.wood[3]);
    P(3,3,6,1,TA.stone[3]);
    for(let i=0;i<4;i++) P(3+i*2,4,1,4+(i%2)*2+(i===1?1:0),i%2?TA.stone[4]:TA.stone[3]);
    P(5,10,2,2,'#e2574c');
  });
  SPR.ico_d_banco = artCanvas(14, 12, (P, g)=>{
    g.drawImage(SPR.dc_banco, 0, 0, 26, 14, 0, 1, 14, 8);
    P(1,9,2,3,DC.iron[2]); P(11,9,2,3,DC.iron[2]);
  }, false);
  SPR.ico_d_farola = artCanvas(10, 12, (P)=>{
    P(2,0,6,1,DC.iron[2]); P(2,1,6,4,'#ffd94a'); P(3,2,2,2,'#fff0a0'); P(4,5,2,6,DC.iron[2]); P(2,11,6,1,DC.iron[1]);
  });
  SPR.ico_d_setas = artCanvas(14, 12, (P, g)=>{
    g.drawImage(SPR.dc_seta_r, 0, 5); g.drawImage(SPR.dc_seta_c, 5, 2); g.drawImage(SPR.dc_seta_r, 7, 5);
    P(6,0,1,1,'#9af0d8'); P(12,2,1,1,'#9af0d8'); P(1,3,1,1,'#fff0a0');
  }, false);
  SPR.ico_d_molino = artCanvas(14, 12, (P)=>{
    const Wh = DC.white;
    P(5,5,4,7,Wh[2]); P(5,5,1,7,Wh[3]); P(8,5,1,7,Wh[1]); P(5,3,4,2,TA.red[2]);
    P(7,0,1,6,TA.wood[1]); P(3,4,9,1,TA.wood[1]);
    P(8,0,2,3,'#f0e8d4'); P(1,5,3,2,'#f0e8d4'); P(11,2,3,2,'#f0e8d4'); P(5,6,0,0,'#f0e8d4');
    P(6,9,2,3,TA.wood[1]);
  });
  SPR.ico_d_frutal = artCanvas(12, 12, (P)=>{
    const L = TA.leaf;
    P(5,7,2,5,TA.wood[2]);
    P(1,1,10,7,L[3]); P(2,0,8,1,L[3]); P(1,1,4,2,L[4]); P(1,6,10,2,L[2]);
    P(3,3,2,2,'#e2574c'); P(7,2,2,2,'#e2574c'); P(6,5,2,2,'#e2574c'); P(3,3,1,1,'#ffd0c4');
  });
  SPR.ico_d_colmena = artCanvas(12, 12, (P, g)=>{
    g.drawImage(SPR.dc_colmena, 0, 0, 16, 14, 0, 0, 12, 11);
    P(10,0,2,1,'#ffd94a'); P(11,1,1,1,K);
  }, false);
  SPR.ico_d_casita = artCanvas(14, 12, (P)=>{
    const R = TA.red;
    for(let i=0;i<5;i++) P(6-i,i,2+i*2,1,R[2]);
    P(1,5,12,1,R[1]);
    P(2,6,10,6,DC.white[2]); P(2,6,1,6,DC.white[3]);
    P(3,8,3,4,TA.wood[2]); P(8,7,3,3,'#ffd94a'); P(10,1,2,3,TA.stone[2]);
  });
  SPR.ico_d_estatua = artCanvas(12, 12, (P)=>{
    const S = TA.stone;
    P(3,0,6,6,S[3]); P(3,0,2,2,S[4]); P(7,3,2,3,S[2]); P(4,2,1,1,S[1]); P(7,2,1,1,S[1]);
    P(4,6,4,1,S[2]);
    P(1,8,10,4,S[2]); P(1,8,10,1,S[4]); P(4,9,4,2,TA.gold[2]);
  });
}

/* ---------- estatua: el sprite de la dinastía, en piedra ---------- */
const _stoneCache = {};
function stoneTint(key){
  if(_stoneCache[key]) return _stoneCache[key];
  const fr = SPR[key]; const src = Array.isArray(fr) ? fr[1] : fr;   /* ojos cerrados: aire solemne */
  if(!src) return null;
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0);
  const im = g.getImageData(0, 0, c.width, c.height), d = im.data;
  const S = TA.stone.map(h=>[parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]);
  const mask = [];
  for(let i=0;i<d.length;i+=4){
    const a = d[i+3]; mask.push(a>40);
    if(a<=40) continue;
    const l = (0.3*d[i] + 0.59*d[i+1] + 0.11*d[i+2])/255;
    const idx = l < 0.16 ? 0 : (l < 0.38 ? 1 : (l < 0.6 ? 2 : (l < 0.8 ? 3 : 4)));
    const s = idx===0 ? [42,40,56] : S[idx];
    d[i] = s[0]; d[i+1] = s[1]; d[i+2] = s[2]; d[i+3] = 255;
  }
  g.putImageData(im, 0, 0);
  return (_stoneCache[key] = {c, mask, w:c.width, h:c.height});
}

/* ---------- farolas y ventanas: ¿hay luz? ---------- */
function dcLit(){ const ph = dayPhase(); return ph==='night' || ph==='dusk'; }

/* =========================================================
   DIBUJO: una cosa colocada. x = centro en el mundo; suelo y=161
   ========================================================= */
function drawDecorItem(id, x, t, zone, key){
  x = Math.round(x);
  key = key || id;
  const h = dcHash(key);
  const wind = WEATHER.kind==='wind';
  const pn = performance.now();
  switch(id){
    case 'maceta': {
      softShadow(x, 160, 10);
      const cols = [DC_FLOWERS[h%6], DC_FLOWERS[(h>>3)%6], DC_FLOWERS[(h>>6)%6]];
      /* tres tallos que se mecen (más con viento) */
      const st = [[-2,5],[0,7],[2,5]];
      for(let i=0;i<3;i++){
        const sw = Math.round(Math.sin(t/(wind?260:900) + i*1.7 + h)*(wind?1.4:0.6));
        const sx = x + st[i][0], top = 154 - st[i][1];
        for(let y=top+2; y<155; y++) px(sx + (y<top+4 ? sw : 0), y, 1, 1, TA.leaf[2]);
        px(sx + (i===0?-2:1), 152 - i%2, 2, 1, TA.leaf[3]);
        const fx0 = sx + sw - 1, fy = top;
        px(fx0-1, fy, 5, 3, K); px(fx0, fy-1, 3, 5, K);
        px(fx0, fy, 3, 3, cols[i]); px(fx0+1, fy-1, 1, 1, cols[i]); px(fx0+1, fy+3, 1, 1, cols[i]);
        px(fx0-1, fy+1, 1, 1, cols[i]); px(fx0+3, fy+1, 1, 1, cols[i]);
        px(fx0+1, fy+1, 1, 1, '#ffd94a'); px(fx0, fy, 1, 1, lightHex(cols[i], 0.5));
      }
      ctx.drawImage(SPR.dc_maceta, x-5, 153);
      break;
    }
    case 'banderines': {
      const x0 = x-20, x1 = x+20;
      softShadow(x0+2, 160, 5); softShadow(x1+2, 160, 5);
      ctx.drawImage(SPR.dc_poste, x0, 130); ctx.drawImage(SPR.dc_poste, x1, 130);
      const cols = ['#e2574c','#ffd94a','#5ec8d8','#7ac74f','#f2a2b8','#8a6ae8'];
      const ax = x0+3, bx = x1+1, ay = 133;
      const amp = wind ? 2.2 : 0.8, spd = wind ? 180 : 700;
      const sag = u => Math.round(Math.sin(u*Math.PI)*6 + Math.sin(t/spd*2 + u*6)*amp*Math.sin(u*Math.PI));
      for(let xx=ax; xx<=bx; xx++){ const u = (xx-ax)/(bx-ax); px(xx, ay + sag(u), 1, 1, '#f6efe0'); }
      for(let i=0;i<7;i++){
        const u = (i+0.7)/7.4, fx0 = Math.round(ax + u*(bx-ax)) - 2, fy = ay + sag(u) + 1;
        const flap = Math.round(Math.sin(t/(wind?90:400) + i*1.3)*(wind?1:0.4));
        const c = cols[(i + h)%cols.length];
        dcShape(fx0, fy, [[0,5],[0,5],[1+ (flap>0?1:0),3-(flap>0?1:0)],[1+flap,3],[2+flap,1]], c, lightHex(c,0.45), darkHex(c,0.3));
      }
      break;
    }
    case 'campanilla': {
      softShadow(x-2, 160, 8);
      ctx.drawImage(SPR.dc_chime, x-6, 128);
      const ring = UI.chimeAt && UI.chimeAt[key] ? pn - UI.chimeAt[key] : 1e9;
      const k = ring < 1600 ? (1 - ring/1600) : 0;
      const sw = Math.sin(t/(wind?110:600))*(wind?1.2:0.3) + Math.sin(ring/60)*2*k;
      const hx = x+3;
      /* sombrerete del que cuelgan los tubos */
      dcShape(hx-3, 132, [[2,3],[0,7]], TA.red[2], TA.red[3], TA.red[1]);
      const L = [6,9,11,8], cols = ['#e0c070','#c2c2d4','#e0c070','#c2c2d4'], his = ['#fff0a0','#eeeef8','#fff0a0','#eeeef8'];
      for(let i=0;i<4;i++){
        const tx = hx-3 + i*2, len = L[i];
        const off = Math.round(sw*(0.6 + i*0.25)*(i%2?1:-1));
        for(let y=0;y<len;y++) px(tx + Math.round(off*y/len) - 1, 135+y, 3, 1, K);
        px(tx - 1 + off, 135+len, 3, 1, K);
        for(let y=0;y<len;y++) px(tx + Math.round(off*y/len), 135+y, 1, 1, y<2 ? his[i] : cols[i]);
      }
      /* badajo y vela de viento */
      const bo = Math.round(sw*1.6);
      px(hx, 135, 1, 12, '#c8a878');
      px(hx-1+bo, 147, 3, 3, K); px(hx+bo, 148, 1, 1, TA.red[2]);
      dcShape(hx-1+bo*2, 151, [[0,3],[0,3],[1,1]], '#f6efe0', '#ffffff', '#d0c6ac');
      if(k>0.5 && every(120, pn)) toyFx({kind:'note', x:hx+4, y:136, vx:0.015, vy:-0.03, life:800, col:'#9adcf0', wob:h});
      break;
    }
    case 'banco': {
      softShadow(x, 160, 26);
      ctx.drawImage(SPR.dc_banco, x-13, 147);
      break;
    }
    case 'farola': {
      const lit = dcLit();
      const fl = Math.sin(t/90 + h) > 0.2;
      if(lit){
        glowDisc(x, 131, 15 + (fl?1:0), '#ffd94a', dayPhase()==='night' ? 0.32 : 0.18);
        /* cono de luz tramado hacia el suelo */
        ctx.globalAlpha = 0.16;
        for(let y=137; y<161; y++){
          const w = Math.round((y-137)*0.55) + 2;
          for(let xx=-w; xx<=w; xx++) if(((xx+y)&1)===0) px(x+xx, y, 1, 1, '#fff0a0');
        }
        ctx.globalAlpha = 1;
        ctx.globalAlpha = 0.3; px(x-7, 160, 15, 1, '#fff0a0'); ctx.globalAlpha = 1;
      }
      softShadow(x, 160, 10);
      ctx.drawImage(SPR.dc_farola, x-5, 125);
      /* cristal: apagado lechoso, encendido con llama que titila */
      px(x-2, 129, 2, 6, lit ? '#ffd94a' : '#d8e4ec'); px(x+1, 129, 2, 6, lit ? '#f0a04b' : '#b8c8d4');
      if(lit){ px(x-1, 131, 1, 2, fl ? '#ffffff' : '#fff0a0'); px(x+1, 132, 1, 2, fl ? '#fff0a0' : '#ffd94a'); }
      else px(x-2, 129, 1, 2, '#ffffff');
      break;
    }
    case 'setas': {
      const night = dcLit();
      const pop = pn - (UI.ringPopAt||-1e9);
      /* hierba del corro, algo más oscura */
      ctx.globalAlpha = 0.22; px(x-12, 153, 25, 5, '#1c3a22'); px(x-9, 152, 19, 1, '#1c3a22'); px(x-9, 158, 19, 1, '#1c3a22'); ctx.globalAlpha = 1;
      if(night){
        const pulse = 0.24 + 0.1*Math.sin(t/500) + (pop<600 ? 0.3*(1-pop/600) : 0);
        glowDisc(x, 154, 13, '#9af0d8', pulse);
      }
      const back = [[-9,151,'c'],[-3,150,'r'],[4,150,'c'],[10,151,'r']];
      const front = [[-13,155,'r'],[-6,157,'c'],[1,158,'r'],[8,157,'c'],[14,155,'c']];
      const drawS = (s)=>{
        const spr = s[2]==='r' ? SPR.dc_seta_r : SPR.dc_seta_c;
        ctx.drawImage(spr, x + s[0] - Math.floor(spr.width/2), s[1] + (s[2]==='r'?-2:0));
        if(night){ const on = Math.sin(t/300 + s[0]) > -0.2; if(on) px(x + s[0] - 1, s[1] - (s[2]==='r'?0:1), 1, 1, '#c8fff0'); }
      };
      back.forEach(drawS); front.forEach(drawS);
      if(night){
        /* luces de hada que giran alrededor del corro */
        for(let i=0;i<3;i++){
          const a = t/900 + i*2.09;
          for(let tr=0; tr<3; tr++){
            const a2 = a - tr*0.18;
            const fx0 = Math.round(x + Math.cos(a2)*12), fy = Math.round(150 + Math.sin(a2)*4 - 4 + Math.sin(t/300+i)*2);
            ctx.globalAlpha = 1 - tr*0.35;
            px(fx0, fy, 1, 1, tr ? '#9af0d8' : '#ffffff');
          }
          ctx.globalAlpha = 1;
        }
      }
      break;
    }
    case 'molino': {
      softShadow(x, 160, 20);
      ctx.drawImage(SPR.dc_molino, x-10, 126);
      const st = G.deco2 && G.deco2.st[key] || {};
      /* aspas: giran siempre; con viento a toda vela; al tocarlas, un empujón */
      const boost = Math.max(0, 1 - (pn - (st.spinAt||-1e9))/2500);
      const spd = (wind ? 0.0032 : 0.0009) + boost*0.006;
      UI.millA = UI.millA||{}; const lastT = UI.millA[key+'_t']||t;
      UI.millA[key] = (UI.millA[key]||0) + spd*Math.min(60, t-lastT); UI.millA[key+'_t'] = t;
      const a0 = UI.millA[key], hx = x, hy = 132;
      for(let s=0;s<4;s++){
        const a = a0 + s*Math.PI/2, ca = Math.cos(a), sa = Math.sin(a);
        /* vela de lona (a un lado del mástil) con listones */
        for(let r=4; r<=15; r+=0.5){
          for(let w=1; w<=3; w++){
            const qx = Math.round(hx + ca*r - sa*w), qy = Math.round(hy + sa*r + ca*w);
            px(qx, qy, 1, 1, (Math.round(r)%4===0) ? '#b8ae9a' : (w===1 ? '#fffaf0' : '#e8e0d0'));
          }
        }
        /* contorno del borde exterior de la vela */
        for(let r=4; r<=15; r+=0.5){ const qx = Math.round(hx + ca*r - sa*4), qy = Math.round(hy + sa*r + ca*4); px(qx, qy, 1, 1, K); }
        for(let w=1; w<=4; w++){ px(Math.round(hx + ca*15.5 - sa*w), Math.round(hy + sa*15.5 + ca*w), 1, 1, K); }
        /* mástil */
        for(let r=0; r<=16; r+=0.5) px(Math.round(hx + ca*r), Math.round(hy + sa*r), 1, 1, TA.wood[1]);
      }
      px(hx-1, hy-1, 3, 3, K); px(hx, hy, 1, 1, TA.gold[2]);
      if((wind || boost>0.3) && every(wind?260:180, pn)) toyFx({kind:'leaf', x:hx-12+Math.random()*24, y:hy-6+Math.random()*12, vx:0.03, vy:0.004, life:900, col:'#e8e0d0', wob:h});
      break;
    }
    case 'frutal': {
      const st = G.deco2 && G.deco2.st[key] || {};
      const shakeK = UI.treeShakeAt && UI.treeShakeAt[key] ? Math.max(0, 1 - (pn - UI.treeShakeAt[key])/500) : 0;
      const jx = shakeK ? Math.round(Math.sin(pn/30)*1.5*shakeK) : (wind ? Math.round(Math.sin(t/300+h)*0.6) : 0);
      softShadow(x, 160, 26);
      /* tronco quieto, copa que se agita */
      ctx.drawImage(SPR.dc_frutal, 0, 24, 30, 14, x-15, 147, 30, 14);
      ctx.drawImage(SPR.dc_frutal, 0, 0, 30, 24, x-15+jx, 123, 30, 24);
      const total = 90*60*1000, left = (st.readyAt||0) - Date.now();
      const ready = left <= 0;
      const prog = ready ? 1 : Math.max(0, 1 - left/total);
      const spots = [[6,13],[11,6],[19,9],[23,15],[14,15]];
      const n = ready ? 5 : Math.floor(prog*4.5);
      const drop = UI.fruitDrop && UI.fruitDrop.key===key ? UI.fruitDrop : null;
      for(let i=0;i<n;i++){
        const fx0 = x-15+jx+spots[i][0], fy = 123+spots[i][1] + (ready ? Math.round(Math.sin(t/400+i)*0.5) : 0);
        const ripe = ready || prog > 0.85;
        const c = ripe ? '#e2574c' : (prog>0.5 ? '#f0a04b' : '#9ad04a');
        px(fx0-1, fy, 4, 2, K); px(fx0, fy-1, 2, 4, K);
        px(fx0, fy, 2, 2, c); px(fx0, fy, 1, 1, ripe ? '#ffd0c4' : '#e8f8b0');
      }
      if(drop){
        const e = pn - drop.at;
        if(e > 1100) UI.fruitDrop = null;
        else for(let i=0;i<3;i++){
          const s = spots[i*2%5], sx0 = x-15+s[0], sy0 = 123+s[1];
          const tt = Math.max(0, e - i*90);
          const fall = Math.min(1, tt/360);
          let yy = sy0 + (158 - sy0)*fall*fall;
          if(fall>=1){ const b = (tt-360)/300; yy = 158 - Math.max(0, Math.sin(Math.min(1,b)*Math.PI))*4; }
          const xx = sx0 + (fall>=1 ? Math.round((tt-360)*0.01*(i-1)) : 0);
          ctx.globalAlpha = e > 900 ? (1100-e)/200 : 1;
          px(xx-1, yy, 4, 3, K); px(xx, yy-1, 2, 5, K); px(xx, yy, 2, 3, '#e2574c'); px(xx, yy, 1, 1, '#ffd0c4');
          ctx.globalAlpha = 1;
        }
      }
      if(ready){
        if(every(520, t)) fx({x:x-10+Math.random()*20, y:128+Math.random()*14, vy:-0.015, life:600, col:'#fff0a0', kind:'star'});
        drawTextOC('!', x, 115 - Math.round(Math.abs(Math.sin(t/240))*2), '#ffd94a');
      }
      break;
    }
    case 'colmena': {
      const st = G.deco2 && G.deco2.st[key] || {};
      const ready = Date.now() >= (st.readyAt||0);
      const angry = pn - (UI.beeAngryAt||-1e9) < 1400;
      softShadow(x, 160, 14);
      ctx.drawImage(SPR.dc_colmena, x-8, 139);
      if(ready){
        /* gota de miel que asoma por la piquera */
        const dr = (t/1200)%1;
        px(x, 150, 2, 1, '#f0a04b'); px(x, 151, 1, 1 + Math.round(dr*2), '#ffd94a');
        /* tarro con brillo */
        const b = Math.round(Math.abs(Math.sin(t/260))*-2);
        dcShape(x+6, 133+b, [[1,3],[0,5],[0,5],[0,5]], '#ffd94a', '#fff0a0', '#c9a227');
        px(x+7, 132+b, 3, 1, TA.wood[2]);
        drawTextOC('!', x, 124+b, '#ffd94a');
      }
      /* abejas: vuelan en ochos alrededor de la colmena */
      const nb = angry ? 8 : (ready ? 6 : 4);
      for(let i=0;i<nb;i++){
        const sp = angry ? 3 : 1;
        const a = t/700*sp + i*(Math.PI*2/nb);
        const bx = Math.round(x + Math.sin(a)*(9 + (i%3)*3) + Math.sin(a*2.3+i)*2);
        const by = Math.round(143 + Math.sin(a*2)*5 - (i%2)*4);
        px(bx, by, 2, 1, '#ffd94a'); px(bx+(Math.cos(a)>0?1:0), by, 1, 1, K);
        if(Math.floor(t/50+i)%2) px(bx, by-1, 1, 1, '#ffffff');
      }
      break;
    }
    case 'casita': {
      const lit = dcLit();
      softShadow(x, 160, 30);
      if(lit) glowDisc(x+5, 154, 9, '#ffd94a', 0.22);
      ctx.drawImage(SPR.dc_casita, x-16, 130);
      /* ventana redonda: vidrio con cruz */
      const wx = x+3, wy = 152;
      px(wx, wy, 4, 5, lit ? '#ffd94a' : '#9adcf0'); px(wx-1, wy+1, 6, 3, lit ? '#ffd94a' : '#9adcf0');
      if(lit){ px(wx, wy+1, 2, 2, '#fff0a0'); }
      else px(wx, wy, 1, 2, '#e8faff');
      px(wx+1, wy, 1, 5, TA.wood[1]); px(wx-1, wy+2, 6, 1, TA.wood[1]);
      /* puerta: se abre un instante al tocar */
      if(pn - (UI.doorAt||-1e9) < 700){ px(x-8, 151, 5, 9, lit ? '#fff0a0' : '#2a1808'); }
      /* humo de la chimenea */
      for(let i=0;i<3;i++){
        const ph = ((t/2200) + i/3) % 1;
        const sx = x + 8 + Math.round(ph*(wind?14:5) + Math.sin(t/500+i)*1), sy = 130 - Math.round(ph*16);
        const r = 1 + Math.round(ph*2);
        ctx.globalAlpha = 0.55*(1-ph);
        px(sx-r+1, sy, r*2, r, '#e8e0d0'); px(sx-r+2, sy-1, r*2-2, 1, '#ffffff');
        ctx.globalAlpha = 1;
      }
      /* zzz si alguien duerme en esta zona */
      if(G.pets.some(p=>(p.zone||'prado')===zone && p.sleeping)){
        const zp = (t/1500)%1;
        ctx.globalAlpha = 1 - zp;
        drawText('z', wx + 6 + Math.round(zp*6), wy - 4 - Math.round(zp*10), '#f6efe0');
        ctx.globalAlpha = 1;
      }
      break;
    }
    case 'estatua': {
      softShadow(x, 160, 20);
      ctx.drawImage(SPR.dc_pedestal, x-10, 150);
      const L = G.legacy && G.legacy.length ? G.legacy[G.legacy.length-1] : null;
      const S = stoneTint(L && SPR[L.key] ? L.key : 'pradera_adultS');
      if(S){
        const sx = x - Math.floor(S.w/2), sy = 151 - S.h;
        ctx.drawImage(S.c, sx, sy);
        /* destello que barre la piedra cada pocos segundos */
        const ph = (t % 4200)/700;
        if(ph < 1){
          const d0 = Math.round(ph*(S.w+S.h));
          for(let yy=0; yy<S.h; yy++){
            for(const o of [0,1]){
              const xx = d0 - yy + o;
              if(xx>=0 && xx<S.w && S.mask[yy*S.w+xx]) px(sx+xx, sy+yy, 1, 1, o ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.8)');
            }
          }
        }
        if(!L){ drawTextOC('?', x, sy + Math.floor(S.h/2) - 2, '#eeeef8'); }
      }
      break;
    }
  }
}

/* ---------- el juglar visitante ---------- */
function drawJuglar(V, t){
  const pn = performance.now();
  const walking = V.st!=='play';
  const strum = V.st==='play' && pn - (V.strumAt||0) < 120;
  const spr = SPR.dc_juglar[strum ? 1 : 0];
  const hop = walking ? Math.round(Math.abs(Math.sin(t/130))*2) : (strum ? 1 : 0);
  const hi = pn - (V.hiAt||-1e9) < 500;
  const x = Math.round(V.x);
  softShadow(x, 160, 12);
  ctx.save(); ctx.translate(x, 161 - hop); ctx.scale(V.dir<0 ? -1 : 1, hi ? 1.1 : 1);
  ctx.drawImage(spr, -8, -spr.height);
  ctx.restore();
  if(walking && every(170, t)) dustFx(x - (V.dir||1)*4, 161, 1, '#d8c8a0');
  /* laúd: caja clara con boca y mástil en diagonal; al rasguear, vibra */
  const d = V.dir<0 ? -1 : 1, lx = x + d*1, ly = 154 + (strum?1:0) - hop;
  px(lx-2, ly-1, 5, 4, K); px(lx-1, ly-2, 3, 6, K);
  px(lx-1, ly-1, 3, 4, TA.wood[3]); px(lx-2, ly, 1, 2, TA.wood[3]); px(lx+2, ly, 1, 2, TA.wood[2]);
  px(lx, ly, 1, 1, '#3a2010'); px(lx-1, ly-1, 1, 1, TA.wood[4]);
  for(let i=1;i<=6;i++) px(lx + d*(1+i), ly - 1 - Math.round(i*0.8), 1, 1, i>=5 ? TA.wood[1] : TA.wood[2]);
  px(lx + d*7, ly - 7, 1, 1, TA.gold[2]);
  if(strum) px(lx + d*2, ly - 2, 1, 1, '#ffffff');
}
/* ---------- bichitos de la belleza ---------- */
function drawBug(b, t){
  const x = Math.round(b.x), y = Math.round(b.y);
  const flap = Math.floor(t/(b.kind==='moth' ? 60 : 130) + b.a*3) % 2;
  if(b.kind==='bfly' || b.kind==='gold'){
    const c = b.kind==='gold' ? '#ffd94a' : ['#f2a2b8','#9adcf0','#fff8d0','#b89af0'][Math.floor(b.a*10)%4];
    const c2 = b.kind==='gold' ? '#fff0a0' : lightHex(c, 0.4);
    if(b.kind==='gold'){
      glowDisc(x, y, 5, '#ffd94a', 0.25);
      if(every(90, t)) fx({x, y, vy:0.01, life:400, col:'#fff0a0', kind:'star'});
    }
    px(x, y-1, 1, 3, K);
    if(flap){ px(x-2, y-1, 2, 2, c); px(x+1, y-1, 2, 2, c); px(x-2, y-1, 1, 1, c2); px(x+2, y-1, 1, 1, c2); px(x-1, y+1, 1, 1, c); px(x+1, y+1, 1, 1, c); }
    else { px(x-1, y-2, 1, 2, c); px(x+1, y-2, 1, 2, c); px(x-1, y-2, 1, 1, c2); }
  } else if(b.kind==='moth'){
    px(x, y, 1, 2, '#6a5a48');
    if(flap){ px(x-2, y, 2, 1, '#d8d0b8'); px(x+1, y, 2, 1, '#d8d0b8'); }
    else { px(x-1, y-1, 1, 1, '#d8d0b8'); px(x+1, y-1, 1, 1, '#d8d0b8'); }
  } else {
    /* luciérnaga */
    const on = Math.sin(t/260 + b.a*5) > -0.3;
    if(on){ glowDisc(x, y, 3, '#e8ff80', 0.35); px(x, y, 1, 1, '#f8ffb0'); }
    else px(x, y, 1, 1, '#4a5a2a');
  }
}
