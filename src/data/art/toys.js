"use strict";
/* =========================================================
   BITXO — data/art/toys: arte de juguetes y decoración del prado
   buildToyArt() corre tras buildAllSprites y sobrescribe/añade SPR.*
   Todo con contorno K de 1px, luz arriba-izquierda y rampa de 3-4 tonos.
   ========================================================= */
/* rampas compartidas (oscuro → claro) */
const TA = {
  wood:  ['#4a3220','#6e4a2a','#9a6c3c','#c49256','#e0b878'],
  stone: ['#46445a','#6a6a82','#9494ac','#c2c2d4','#eeeef8'],
  red:   ['#7a2230','#b83a3c','#e2574c','#ff8a74','#ffd0c4'],
  gold:  ['#8a5a14','#c9a227','#ffd94a','#fff0a0'],
  water: ['#24488c','#3a72c4','#5e9be0','#9adcf0','#e8faff'],
  cream: ['#a89c84','#d0c6ac','#f0e8d4','#ffffff'],
  leaf:  ['#1c3a22','#2f6a34','#4f9a42','#7ac74f','#b4ec84'],
  purp:  ['#3a2466','#5a3fa8','#8a6ae0','#b89af0','#e2d4ff'],
  soil:  ['#2e2016','#4a3424','#6a4a30','#8a6a48']
};
/* lienzo con dibujo libre y contorno automático (4-vecinos) */
function artCanvas(w, h, draw, outline){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const P = (x,y,ww,hh,col)=>{ g.fillStyle = col; g.fillRect(x,y,ww,hh); };
  draw(P, g);
  if(outline!==false) autoOutline(c, outline||K);
  return c;
}
function autoOutline(c, col){
  const g = c.getContext('2d');
  const W = c.width, H = c.height;
  const d = g.getImageData(0,0,W,H).data;
  const op = (x,y)=> x>=0 && y>=0 && x<W && y<H && d[(y*W+x)*4+3]>40;
  g.fillStyle = col;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    if(op(x,y)) continue;
    if(op(x-1,y)||op(x+1,y)||op(x,y-1)||op(x,y+1)) g.fillRect(x,y,1,1);
  }
}
/* rectángulo de madera sombreado (luz arriba-izquierda) */
function woodBar(P, x, y, w, h, R){
  R = R||TA.wood;
  P(x,y,w,h,R[2]);
  if(h>=2) P(x,y,w,1,R[3]); else P(x,y,1,h,R[3]);
  if(w>=3 && h>=3){ P(x,y,1,h,R[3]); P(x+w-1,y,1,h,R[1]); P(x,y+h-1,w,1,R[1]); }
  else if(h>=3){ P(x,y,1,h,R[3]); P(x+w-1,y+1,1,h-1,R[1]); }
  else if(w>=3){ P(x,y+h-1,w,1,R[1]); P(x,y,w,1,R[3]); }
}

function buildToyArt(){
  /* ---------------- PELOTA de playa (9x9) ---------------- */
  SPR.pelota = mkSprite({k:K,h:'#ffffff',w:'#f0ecf4',e:'#c8c0d8',r:'#e2574c',d:'#a03030',y:'#ffd94a',o:'#c9a227',b:'#5e9be0',n:'#3a6bb0'},[
"..kkkkk..",
".khwrrrk.",
"khwwrrrdk",
"kwwwyrrdk",
"kbbyyyydk",
"kbbbyooek",
"knbbboeek",
".knnneek.",
"..kkkkk.."]);

  /* ---------------- CAJA SORPRESA: tapa y cuerpo por separado ---------------- */
  const cajaPal = {k:K,P:TA.purp[3],p:TA.purp[2],d:TA.purp[1],D:TA.purp[0],Y:TA.gold[3],y:TA.gold[2],o:TA.gold[1],w:'#ffffff'};
  const LID = [
"...kk..kk...",
"..kYykkyok..",
"kkkkkyykkkkk",
"kPPPPYyPPPPk",
"kppppyyppppk",
"kkkkkkkkkkkk"];
  const BODY = [
".kpppyyppdk.",
".kpwpyyppdk.",
".kpppyyppdk.",
".kdddooddDk.",
".kkkkkkkkkk."];
  SPR.caja_lid = mkSprite(cajaPal, LID);
  SPR.caja_body = mkSprite(cajaPal, [".kkkkkkkkkk.",".kDDDDDDDDk."].concat(BODY));
  SPR.caja = mkSprite(cajaPal, LID.concat(BODY));

  /* ---------------- BAÑERA con patas (tienda 16x10 y mundo 22x11) ---------------- */
  const tubPal = {k:K,W:'#ffffff',C:'#f0e8d4',c:'#d0c6ac',s:'#a89c84',B:'#c8f0ff',b:'#9adcf0',n:'#5e9be0',g:'#ffd94a',o:'#c9a227'};
  SPR.banera = mkSprite(tubPal,[
"..kkkkkkkkkkkk..",
".kCCCCCCCCCCCCk.",
"kCbBbbbbBbbbbbck",
"kWWWWWWWWWWWWWWk",
"kCCCCCCCCCCCCcck",
"kCCCCCCCCCCCcssk",
".kcCCCCCCCCccsk.",
"..kkkkkkkkkkkk..",
"..kgk......kok..",
"..kk........kk.."]);
  const TUBW = [
"..kkkkkkkkkkkkkkkkkk..",
".kCCCCCCCCCCCCCCCCCCk.",
"kCnbbBbbbbbbbbBbbbbnck",
"kWWWWWWWWWWWWWWWWWWWWk",
"kWCCCCCCCCCCCCCCCCCcck",
"kCCCCCCCCCCCCCCCCCccsk",
"kCCCCCCCCCCCCCCCCCcssk",
".kcCCCCCCCCCCCCCCccsk.",
"..kkkkkkkkkkkkkkkkkk..",
"..kgok..........kgok..",
"..kkk............kkk.."];
  SPR.banera_w = mkSprite(tubPal, TUBW);
  /* la pared delantera, para tapar al bitxo que se baña */
  SPR.banera_wf = mkSprite(tubPal, TUBW.map((r,i)=> i<3 ? '.'.repeat(r.length) : r));

  /* ---------------- TAMBOR (12x10) ---------------- */
  SPR.tambor = mkSprite({k:K,W:'#ffffff',C:'#f6efe0',c:'#dccba0',y:'#ffd94a',o:'#c9a227',R:'#ff8a74',r:'#e2574c',d:'#a03030',w:'#f6efe0'},[
"..kkkkkkkk..",
".kWWCCCCCck.",
"kCCCCCCCCcck",
"koyyyyyyyyok",
"kRwrrrwrrrwk",
"kRrwrwrwrwdk",
"kRrrwrrrwrdk",
"kRrrrrrrrrdk",
"koyyyyyyyyok",
".kkkkkkkkkk."]);
  /* baqueta */
  SPR.baqueta = mkSprite({k:K,w:'#e0b878',h:'#f6efe0'},["kk....","khk...",".kwk..","..kwk.","...kwk","....kk"]);

  /* ---------------- COMETA (9x9) ---------------- */
  SPR.cometa = mkSprite({k:K,R:'#ff8a74',r:'#e2574c',d:'#a03030',Y:'#fff0a0',y:'#ffd94a',o:'#c9a227',w:'#6e4a2a'},[
"....k....",
"...kwk...",
"..kRwYk..",
".kRrwyyk.",
"kwwwwwwwk",
".krdwyok.",
"..kdwok..",
"...kwk...",
"....k...."]);

  /* ---------------- FUENTE de piedra (18x18) ---------------- */
  SPR.fuente = artCanvas(20, 20, (P)=>{
    const S = TA.stone, B = TA.water;
    /* remate */
    P(9,1,2,2,S[3]); P(9,1,1,1,S[4]);
    /* cuenco alto */
    P(4,4,12,3,S[2]); P(4,4,12,1,S[3]); P(5,5,10,1,B[2]); P(6,5,3,1,B[3]);
    P(5,7,10,1,S[1]); P(4,4,1,3,S[3]);
    /* pie */
    P(8,8,4,5,S[2]); P(8,8,1,5,S[3]); P(11,8,1,5,S[1]);
    P(7,12,6,1,S[1]);
    /* pila baja */
    P(1,13,18,2,S[3]); P(1,13,18,1,S[4]);
    P(2,14,16,1,B[2]); P(3,14,4,1,B[3]); P(12,14,2,1,B[3]);
    P(1,15,18,1,S[4]);
    P(1,16,18,2,S[2]); P(1,16,1,2,S[3]); P(17,16,1,2,S[1]); P(15,16,2,2,S[1]);
    P(2,18,16,1,S[1]);
    /* musgo */
    P(2,17,2,1,'#5a8a4a'); P(14,18,2,1,'#5a8a4a');
  });

  /* ---------------- ROBOT AMIGO (12x13, 2 cuadros de oruga) ---------------- */
  const robo = (tread)=> artCanvas(14, 15, (P)=>{
    const S = TA.stone;
    P(6,1,2,2,S[2]);                     /* mástil de antena */
    P(3,3,8,4,S[2]); P(3,3,8,1,S[3]); P(3,3,1,4,S[3]); P(10,3,1,4,S[1]); P(4,3,2,1,S[4]);
    P(4,4,6,2,'#20243c');                /* visor */
    P(2,7,10,4,'#e8a84a'); P(2,7,10,1,'#ffd08a'); P(2,7,1,4,'#ffd08a'); P(11,7,1,4,'#b87428'); P(2,10,10,1,'#b87428');
    P(4,8,2,1,'#5ec8d8'); P(7,8,1,1,'#e2574c'); P(9,8,1,1,'#7ac74f');
    /* oruga */
    P(1,11,12,3,'#3a3448'); P(1,11,12,1,'#5a546a');
    for(let x=1+tread;x<13;x+=2) P(x,12,1,1,'#8a8a9a');
  });
  SPR.robot = [robo(0), robo(1)];

  /* ---------------- HUERTO: bancal de madera (26x7) ---------------- */
  SPR.bancal = artCanvas(26, 8, (P)=>{
    const W = TA.wood, S = TA.soil;
    P(1,1,24,2,S[2]); P(1,1,24,1,S[3]);
    for(let x=2;x<24;x+=3) P(x,2,1,1,S[1]);
    woodBar(P,0,3,26,4,W);
    P(8,3,1,4,W[1]); P(17,3,1,4,W[1]);
    P(2,4,1,1,W[4]); P(10,4,1,1,W[4]); P(19,4,1,1,W[4]);
  });

  /* ---------------- CACA con volutas (9x8) ---------------- */
  SPR.poop = mkSprite({k:K,L:'#d4a06a',b:'#a4713a',d:'#6e4a2a',h:'#f0cfa0'},[
"....kk....",
"...khbk...",
"..khbbdk..",
".khLbbbdk.",
".kddddddk.",
"khLLbbbbdk",
"kbbbbbbddk",
".kkkkkkkk."]);

  /* ---------------- COLUMPIO: pórtico y asiento ---------------- */
  SPR.columpio = artCanvas(34, 36, (P)=>{
    const W = TA.wood;
    /* patas en A, ligeramente abiertas */
    for(let y=4;y<35;y++){
      const o = Math.floor((y-4)/12);
      P(3-o,y,3,1,W[2]); P(3-o,y,1,1,W[3]); P(5-o,y,1,1,W[1]);
      P(28+o,y,3,1,W[2]); P(28+o,y,1,1,W[3]); P(30+o,y,1,1,W[1]);
    }
    /* travesaño */
    woodBar(P,1,1,32,4,W);
    P(2,1,30,1,W[4]);
    /* argollas */
    P(11,5,2,1,TA.stone[3]); P(21,5,2,1,TA.stone[3]);
    /* estacas al suelo */
    P(0,34,6,2,W[1]); P(28,34,6,2,W[1]);
  });
  SPR.columpio_seat = artCanvas(14, 4, (P)=>{ woodBar(P,1,1,12,2,TA.wood); P(2,1,10,1,TA.wood[4]); });

  /* ---------------- CARTEL de misiones (17x24) ---------------- */
  SPR.cartel = artCanvas(19, 26, (P)=>{
    const W = TA.wood;
    P(8,13,3,12,W[2]); P(8,13,1,12,W[3]); P(10,13,1,12,W[1]);
    /* tejadillo */
    P(2,1,15,2,'#b83a3c'); P(2,1,15,1,'#e2574c'); P(1,3,17,1,'#7a2230');
    /* tablero */
    P(2,4,15,11,W[2]); P(2,4,15,1,W[3]); P(2,4,1,11,W[3]); P(16,4,1,11,W[1]); P(2,14,15,1,W[1]);
    P(3,9,13,1,W[1]);
  });

  /* ---------------- BUHONERO: búho viajero con sombrero ---------------- */
  const bhPal = {k:K,u:'#8a6ae0',d:'#5a3fa8',U:'#d2c4fa',W:'#ffffff',o:'#f0a04b',H:'#c49256',h:'#8a6a3a',q:'#5ec8d8',R:'#e2574c',r:'#a03030'};
  const BH = [
".....kkkkkk.....",
"....kHHhhhhk....",
"....kqqqqqqk....",
".kkkkkkkkkkkkkk.",
"kHHhhhhhhhhhhhhk",
".kkkkkkkkkkkkkk.",
"..kuWWWuuWWWuk..",
"..kuWkWuuWkWdk..",
"..kuWWWooWWWdk..",
".kuuuuuoouuuudk.",
".kRRRRRRRRRRRrk.",
".kuuRrUUUUUUudk.",
".kuuRrUUUUUUudk.",
".kuuuuUUUUUUudk.",
"..kuuuuUUUUuddk.",
"...kddddddddk...",
"....kook.kook..."];
  const BH1 = BH.slice();
  BH1[6] = "..kuuuuuuuuudk..";
  BH1[7] = "..kukkkuukkkdk..";
  BH1[8] = "..kuuuuoouuudk..";
  SPR.buhonero = [mkSprite(bhPal, BH), mkSprite(bhPal, BH1)];
  /* su carro con toldo a rayas */
  SPR.carro = artCanvas(26, 24, (P)=>{
    const W = TA.wood;
    /* palos del toldo */
    P(3,6,1,10,W[1]); P(21,6,1,10,W[1]);
    /* toldo a rayas con volante */
    for(let x=1;x<24;x++){
      const c = Math.floor((x-1)/3)%2 ? '#f6efe0' : '#e2574c';
      P(x,1+(x<4||x>20?1:0),1,5-(x<4||x>20?1:0),c);
    }
    P(1,2,23,1,'rgba(255,255,255,0.35)');
    for(let x=1;x<24;x+=3){ P(x,6,2,1,Math.floor((x-1)/3)%2 ? '#d0c6ac' : '#b83a3c'); }
    /* mercancía */
    P(5,11,3,4,'#5ec8d8'); P(5,11,1,1,'#e8faff'); P(5,10,3,1,'#c49256');
    P(9,12,3,3,'#e2574c'); P(9,12,1,1,'#ffd0c4');
    P(13,10,2,5,'#8a6ae0'); P(13,10,1,1,'#e2d4ff');
    P(16,12,4,3,'#ffd94a'); P(16,12,1,1,'#fff0a0');
    /* caja del carro */
    woodBar(P,1,15,23,6,W);
    P(2,17,21,1,W[1]); P(8,15,1,6,W[1]); P(16,15,1,6,W[1]);
    /* varas */
    P(24,17,2,1,W[3]);
  });

  /* ---------------- MUÑECO DE ENTRENO, BANCO, ARCO (parque) ---------------- */
  SPR.muneco = artCanvas(15, 36, (P)=>{
    const W = TA.wood;
    P(6,12,3,23,W[2]); P(6,12,1,23,W[3]); P(8,12,1,23,W[1]);
    P(5,1,5,4,'#c49256'); P(5,1,5,1,'#e0b878'); P(6,2,1,1,K); P(8,2,1,1,K); P(6,4,3,1,'#8a5a30');
    /* saco de paja */
    P(1,5,13,13,'#d8a860'); P(1,5,13,1,'#f0cc88'); P(1,5,1,13,'#f0cc88'); P(13,5,1,13,'#a87838'); P(1,17,13,1,'#a87838');
    P(1,8,13,1,'#8a5a30'); P(1,14,13,1,'#8a5a30');
    /* diana */
    P(5,9,5,5,'#f6efe0'); P(6,10,3,3,'#e2574c'); P(7,11,1,1,'#f6efe0');
    /* pajitas */
    P(0,6,1,1,'#f0cc88'); P(14,11,1,1,'#f0cc88'); P(0,15,1,1,'#f0cc88');
    P(4,34,7,2,W[1]);
  });
  SPR.banco = artCanvas(26, 12, (P)=>{
    const W = TA.wood;
    woodBar(P,1,1,24,2,W); woodBar(P,1,4,24,2,W);   /* respaldo */
    P(3,1,2,6,W[1]); P(21,1,2,6,W[1]);
    woodBar(P,0,6,26,2,W);                          /* asiento */
    P(2,8,2,4,TA.stone[1]); P(22,8,2,4,TA.stone[1]); P(2,8,1,4,TA.stone[2]); P(22,8,1,4,TA.stone[2]);
  });
  SPR.arco = artCanvas(16, 38, (P)=>{
    const W = TA.wood;
    P(1,6,3,31,W[2]); P(1,6,1,31,W[3]); P(3,6,1,31,W[1]);
    P(11,6,3,31,W[2]); P(11,6,1,31,W[3]); P(13,6,1,31,W[1]);
    woodBar(P,0,2,16,4,W); P(0,1,16,1,W[3]);
    /* hiedra */
    for(const [x,y] of [[2,8],[1,12],[3,15],[12,9],[11,14],[13,19],[2,22],[12,25],[5,3],[9,4]]){ P(x,y,2,2,'#4f9a42'); P(x,y,1,1,'#7ac74f'); }
    P(6,4,1,1,'#f2a2b8'); P(12,13,1,1,'#ffd94a');
  });

  /* ---------------- HUERTA: espantapájaros y girasol ---------------- */
  SPR.espanta = artCanvas(19, 36, (P)=>{
    const W = TA.wood;
    P(8,12,3,23,W[2]); P(8,12,1,23,W[3]);
    /* camisa y brazos de paja */
    P(1,13,17,3,'#5e9be0'); P(1,13,17,1,'#9adcf0'); P(1,15,17,1,'#3a72c4');
    P(0,13,1,2,'#f0cc88'); P(18,13,1,2,'#f0cc88'); P(0,15,1,1,'#f0cc88'); P(18,15,1,1,'#f0cc88');
    P(5,16,9,7,'#5e9be0'); P(5,16,1,7,'#9adcf0'); P(13,16,1,7,'#3a72c4');
    P(7,18,2,2,'#e2574c'); P(10,20,2,2,'#ffd94a');     /* remiendos */
    /* cabeza de saco */
    P(6,5,7,7,'#f0dca0'); P(6,5,7,1,'#fff0c0'); P(12,5,1,7,'#c8b070');
    P(7,7,2,1,K); P(10,7,2,1,K); P(8,10,3,1,'#8a5a30');
    /* sombrero */
    P(4,4,11,1,'#8a6a3a'); P(6,1,7,3,'#b83a3c'); P(6,1,7,1,'#e2574c'); P(6,3,7,1,'#5a3a28');
  });
  SPR.girasol = artCanvas(9, 24, (P)=>{
    const L = TA.leaf;
    P(4,7,1,16,L[2]);
    P(1,12,3,2,L[3]); P(1,12,1,1,L[4]); P(5,15,3,2,L[3]); P(7,15,1,1,L[4]);
    /* pétalos */
    P(2,1,5,7,'#ffd94a'); P(1,2,7,5,'#ffd94a'); P(3,0,3,1,'#ffd94a'); P(3,8,3,0,'#ffd94a');
    P(0,3,1,3,'#f0a04b'); P(8,3,1,3,'#f0a04b'); P(3,0,1,1,'#fff0a0'); P(1,2,1,1,'#fff0a0');
    P(3,3,3,3,'#6a3a18'); P(3,3,1,1,'#9a6a38'); P(5,5,1,1,'#3a2010');
  });

  /* ---------------- PRADO: farolillo, valla ---------------- */
  SPR.farol = artCanvas(9, 26, (P)=>{
    const W = TA.wood;
    P(3,8,3,17,W[2]); P(3,8,1,17,W[3]); P(5,8,1,17,W[1]);
    P(1,24,7,2,W[1]);
    P(1,1,7,1,'#3a3448'); P(2,0,5,1,'#5a546a');
    P(1,2,7,6,'#3a3448');
  });
  SPR.valla_poste = artCanvas(5, 15, (P)=>{
    const W = TA.wood;
    P(1,1,3,13,W[2]); P(1,1,1,13,W[3]); P(3,1,1,13,W[1]); P(2,0,1,1,W[2]);
  });
  /* ---------------- ICONOS DE TIENDA (<=14x12) para los juguetes sin sprite propio ---------------- */
  SPR.ico_columpio = artCanvas(14, 12, (P)=>{
    const W = TA.wood;
    P(0,0,14,3,K); P(1,1,12,1,W[3]);
    P(0,3,3,9,K); P(1,3,1,9,W[3]); P(11,3,3,9,K); P(12,3,1,9,W[2]);
    P(5,3,1,5,'#c8a878'); P(8,3,1,5,'#c8a878');
    P(3,8,8,3,K); P(4,9,6,1,W[3]);
  }, false);
  SPR.ico_huerto = artCanvas(14, 12, (P)=>{
    const L = TA.leaf;
    P(6,2,1,6,L[2]); P(3,4,3,1,L[3]); P(7,3,3,1,L[3]); P(3,6,3,1,L[3]); P(8,6,3,1,L[3]);
    P(3,5,2,2,'#e2574c'); P(3,5,1,1,'#ffd0c4'); P(8,2,2,2,'#e2574c'); P(8,2,1,1,'#ffd0c4');
    P(0,8,14,1,TA.soil[3]); woodBar(P,0,9,14,3,TA.wood);
  });
  SPR.ico_cometa = artCanvas(13, 12, (P, g)=>{
    g.drawImage(SPR.cometa, 0, 0);
    P(5,9,1,1,'#e2574c'); P(7,10,1,1,'#ffd94a'); P(9,11,1,1,'#5ec8d8');
  }, false);
  SPR.ico_fuente = artCanvas(14, 12, (P)=>{
    const S = TA.stone, B = TA.water;
    P(6,0,2,1,B[3]); P(3,2,8,2,S[2]); P(3,2,8,1,S[3]); P(4,3,6,1,B[2]);
    P(6,4,2,3,S[2]); P(6,4,1,3,S[3]);
    P(1,7,12,4,S[2]); P(1,7,12,1,S[3]); P(2,8,10,1,B[2]); P(3,8,3,1,B[3]); P(1,10,12,1,S[1]);
    P(2,4,1,2,B[3]); P(11,4,1,2,B[3]);
  });
  SPR.ico_robot = artCanvas(12, 12, (P)=>{
    const S = TA.stone;
    P(5,0,2,1,'#e2574c'); P(5,1,1,1,S[2]);
    P(2,2,8,3,S[2]); P(2,2,8,1,S[3]); P(3,3,6,1,'#20243c'); P(4,3,1,1,'#5ec8d8'); P(7,3,1,1,'#5ec8d8');
    P(1,5,10,3,'#e8a84a'); P(1,5,10,1,'#ffd08a'); P(1,7,10,1,'#b87428');
    P(1,8,10,3,'#3a3448'); P(1,8,10,1,'#5a546a'); P(2,9,1,1,'#8a8a9a'); P(5,9,1,1,'#8a8a9a'); P(8,9,1,1,'#8a8a9a');
  });
  /* flor de 5x7 con hojas: la paleta se tiñe por flor */
  SPR._flor = {};
}
/* flor coloreada, cacheada por color */
function florSpr(col){
  if(SPR._flor && SPR._flor[col]) return SPR._flor[col];
  const c = artCanvas(7, 9, (P)=>{
    const L = TA.leaf;
    P(3,4,1,5,L[2]);
    P(1,6,2,1,L[3]); P(4,5,2,1,L[3]); P(1,6,1,1,L[4]);
    P(2,1,3,3,col); P(3,0,1,1,col); P(1,2,1,1,col); P(5,2,1,1,col); P(3,4,1,0,col);
    P(2,1,1,1,lightHex(col,0.5));
    P(3,2,1,1,'#ffd94a');
    P(4,3,1,1,darkHex(col,0.25));
  }, darkHex(TA.leaf[0],0));
  if(!SPR._flor) SPR._flor = {};
  SPR._flor[col] = c;
  return c;
}
