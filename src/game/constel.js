"use strict";
/* =========================================================
   BITXO — game/constel: la CONSTELACION (árbol de ascensión)
   Cada ascensión deja POLVO ESTELAR; con él se encienden estrellas
   en tres ramas: PRADO (economía), CRIANZA (crecer) y COMBATE.
   G.constel = {pts, nodes:{id:nivel}, guide:linea|null}
   ========================================================= */
/* req: todos esos nodos a nivel >=1.  x,y: posición en el mapa del cielo */
const CONSTEL = [
  /* ---- PRADO: la economía ---- */
  {id:'rocio',  br:0, name:'ROCIO',        max:3, cost:[2,3,5], req:[],               x:56,  y:134,
   desc:l=>'MOTAS PASIVAS +'+(10*l)+'%'},
  {id:'chispa', br:0, name:'LLUVIA DE LUZ', max:3, cost:[2,4,6], req:['rocio'],        x:30,  y:122,
   desc:l=>'CADA CHISPA +'+(25*l)+'%'},
  {id:'sueno',  br:0, name:'SUENO LARGO',  max:2, cost:[3,6],   req:['rocio'],        x:48,  y:106,
   desc:l=>'AUSENCIA +'+(4*l)+'H Y +'+(20*l)+'%'},
  {id:'huerto', br:0, name:'HUERTO LUNAR', max:2, cost:[3,5],   req:['chispa','sueno'], x:24, y:88,
   desc:l=>'EL HUERTO -'+(20*l)+'% TIEMPO'},
  {id:'cometa', br:0, name:'COMETA',       max:1, cost:[12],    req:['huerto'],       x:30,  y:62, cap:true,
   desc:()=>'EXPEDICION +50% ✦ Y -25% TIEMPO'},
  /* ---- CRIANZA: crecer ---- */
  {id:'cuna',   br:1, name:'CUNA DE LUZ',  max:3, cost:[2,3,5], req:[],               x:80,  y:126,
   desc:l=>'TODA LA XP +'+(15*l)+'%'},
  {id:'semilla',br:1, name:'SEMILLA',      max:1, cost:[4],     req:['cuna'],         x:64,  y:106,
   desc:()=>'LOS HUEVOS NACEN A NIVEL 2'},
  {id:'sangre', br:1, name:'SANGRE FUERTE',max:2, cost:[3,5],   req:['cuna'],         x:96,  y:106,
   desc:l=>'AL CRECER +'+l+' FUE DEF VEL'},
  {id:'guia',   br:1, name:'ESTRELLA GUIA',max:1, cost:[8],     req:['semilla','sangre'], x:80, y:86,
   desc:()=>'TU ELIGES LA LINEA AL ASCENDER'},
  {id:'herencia',br:1,name:'HERENCIA',     max:1, cost:[14],    req:['guia'],         x:80,  y:58, cap:true,
   desc:()=>'HEREDA 25% FUE DEF VEL Y GORRO'},
  /* ---- COMBATE ---- */
  {id:'colmillo',br:2,name:'COLMILLO',     max:3, cost:[2,3,5], req:[],               x:104, y:134,
   desc:l=>'ATAQUE +'+(8*l)+'%'},
  {id:'caparazon',br:2,name:'CAPARAZON',   max:3, cost:[2,3,5], req:['colmillo'],     x:130, y:122,
   desc:l=>'VIDA +'+(10*l)+'%'},
  {id:'halcon', br:2, name:'OJO DE HALCON',max:2, cost:[3,5],   req:['colmillo'],     x:112, y:106,
   desc:l=>'PARADA PERFECTA +'+(25*l)+'% VENTANA'},
  {id:'botin',  br:2, name:'BOTIN',        max:2, cost:[3,5],   req:['caparazon','halcon'], x:136, y:88,
   desc:l=>'MOTAS DE COMBATE +'+(25*l)+'%'},
  {id:'furia',  br:2, name:'FURIA ESTELAR',max:1, cost:[12],    req:['botin'],        x:130, y:62, cap:true,
   desc:()=>'EMPIEZAS CON MEDIO SUPER Y +25%'}
];
const CONSTEL_BY = {}; for(const n of CONSTEL) CONSTEL_BY[n.id] = n;
const CONSTEL_BR = [
  {name:'PRADO',   col:'#9be86a', dim:'#3c6a3a'},
  {name:'CRIANZA', col:'#f2a2d0', dim:'#6a3c5e'},
  {name:'COMBATE', col:'#ff9a6a', dim:'#6e3c34'}
];

/* nivel comprado de un nodo (0 si nada). Seguro sin partida cargada */
function perk(id){
  const c = G && G.constel;
  return (c && c.nodes && c.nodes[id]) || 0;
}
function constelEnsure(){
  if(!G.constel) G.constel = {pts:0, nodes:{}, guide:null};
  G.constel.nodes = G.constel.nodes || {};
  G.constel.pts = G.constel.pts || 0;
  return G.constel;
}
/* ---- multiplicadores que leen el resto de sistemas ---- */
function constelMotaMult(){ return 1 + 0.10*perk('rocio'); }
function constelTapMult(){ return 1 + 0.25*perk('chispa'); }
function constelXpMult(){ return 1 + 0.15*perk('cuna'); }
function offlineCap(){ return OFFLINE_CAP + perk('sueno')*4*3600*1000; }
function offlineRateMult(){ return 1 + 0.2*perk('sueno'); }

function constelNodeCost(n){ const l = perk(n.id); return l>=n.max ? 0 : n.cost[l]; }
function constelReqOk(n){ return n.req.every(r=>perk(r)>=1); }
/* estado para pintar/decidir: 'max' | 'ok' (se puede comprar) | 'poor' (desbloqueado sin polvo) | 'lock' */
function constelState(n){
  if(perk(n.id)>=n.max) return 'max';
  if(!constelReqOk(n)) return 'lock';
  return G.constel.pts >= constelNodeCost(n) ? 'ok' : 'poor';
}
function constelSpent(){ let s=0; for(const n of CONSTEL){ const l = perk(n.id); for(let i=0;i<l;i++) s += n.cost[i]; } return s; }

/* POLVO que deja una ascensión: las estrellas + premios por hacerlo bien */
function constelGainFor(p, stars){
  let g = stars;
  const why = [];
  if(p.form==='adultS'){ g += 2; why.push('LEYENDA +2'); }
  if(p.level>=12){ g += 1; why.push('NV12 +1'); }
  if(p.level>=16){ g += 1; why.push('NV16 +1'); }
  const dx = dexCount();
  if(dx >= Math.ceil(DEX_TOTAL/2)){ g += 1; why.push('ALBUM +1'); }
  if(dx >= DEX_TOTAL){ g += 1; }
  return {n:g, why};
}

/* "no" dentro de la tarjeta: el panel sacude, suena y lo explica */
function constelSay(msg){
  UI.cst = UI.cst || {};
  UI.cst.msg = msg; UI.cst.msgUntil = performance.now() + 1600;
  SFX.nope(); UI.denyAt = performance.now(); vibrate(20);
  if(UI.mode!=='constel') toast(msg);
}
/* comprar un nivel. Devuelve true si se compró */
function buyConstel(id){
  constelEnsure();
  const n = CONSTEL_BY[id]; if(!n) return false;
  const st = constelState(n);
  if(st==='max'){ constelSay('YA BRILLA AL MAXIMO'); return false; }
  if(st==='lock'){ constelSay('ENCIENDE ANTES LAS DE ABAJO'); return false; }
  const cost = constelNodeCost(n);
  if(G.constel.pts < cost){ constelSay('FALTA POLVO: ASCIENDE MAS'); return false; }
  G.constel.pts -= cost;
  G.constel.nodes[id] = perk(id) + 1;
  if(id==='guia' && !G.constel.guide) G.constel.guide = null;
  UI.cst = UI.cst || {};
  UI.cst.boughtAt = performance.now(); UI.cst.boughtId = id;
  if(typeof constelBuyFx==='function') constelBuyFx(n);
  diaryLog('SE ENCENDIO '+n.name+(n.max>1 ? ' '+perk(id) : ''));
  saveGame();
  return true;
}

/* líneas elegibles para ESTRELLA GUIA (las ya desbloqueadas) */
function constelGuideLines(){
  const keep = {stars:G.stars, ascensions:G.ascensions};
  return LINE_KEYS.filter(ln=>LINES[ln].unlock(keep));
}
function constelCycleGuide(dir){
  const L = [null].concat(constelGuideLines());
  let i = L.indexOf(G.constel.guide||null); if(i<0) i = 0;
  i = (i + (dir||1) + L.length) % L.length;
  G.constel.guide = L[i];
  SFX.tap(); saveGame();
}

/* ascensión: aplica HERENCIA / ESTRELLA GUIA al nuevo huevo */
function constelBeforeEgg(){
  if(perk('guia') && G.constel.guide && constelGuideLines().includes(G.constel.guide)) G.nextEggLine = G.constel.guide;
}
function constelAfterEgg(parent, egg){
  if(!perk('herencia') || !egg) return;
  const g = egg.gift || (egg.gift = {s:0, d:0, v:0});
  g.s += Math.floor((parent.str||0)*0.25);
  g.d += Math.floor((parent.def||0)*0.25);
  g.v += Math.floor((parent.spd||0)*0.25);
  if(parent.hat) egg.hat = parent.hat;
  egg.heir = true;
}

/* ---------------- ENTRADA ---------------- */
/* geometría compartida con render/constel.js */
const CST = {X:6, Y:26, W:148, H:212, MAPY:44, MAPH:110, CARDY:158, BUY:{x:96,y:212,w:52,h:18}, GL:{x:14,y:199,w:76,h:11}};
function constelNodeAt(x, y){
  let best = null, bd = 99;
  for(const n of CONSTEL){
    const d = Math.hypot(x-n.x, y-n.y);
    if(d < (n.cap ? 12 : 10) && d < bd){ bd = d; best = n; }
  }
  return best;
}
function constelTap(x, y){
  constelEnsure();
  UI.cst = UI.cst || {};
  UI.cst.hint = false;
  if(x < CST.X || x > CST.X+CST.W || y < CST.Y || y > CST.Y+CST.H){ UI.mode = 'main'; SFX.tap(); return; }
  const n = constelNodeAt(x, y);
  if(n){
    UI.cst.sel = n.id; UI.cst.selAt = performance.now();
    tone({f:880 + n.br*120, slide:1320 + n.br*120, d:0.06, type:'triangle', vol:0.04});
    vibrate(8);
    return;
  }
  const sel = UI.cst.sel && CONSTEL_BY[UI.cst.sel];
  if(sel){
    const B = CST.BUY;
    if(x>=B.x && x<=B.x+B.w && y>=B.y && y<=B.y+B.h){ buyConstel(sel.id); return; }
    const L = CST.GL;
    if(sel.id==='guia' && perk('guia') && x>=L.x && x<=L.x+L.w && y>=L.y-2 && y<=L.y+L.h+2){
      constelCycleGuide(x < L.x+L.w/2 ? -1 : 1); return;
    }
  }
}
function constelKey(k){
  if(k==='Escape'){ UI.mode = 'main'; SFX.tap(); return true; }
  const order = CONSTEL.map(n=>n.id);
  UI.cst = UI.cst || {};
  if(k==='ArrowRight' || k==='ArrowLeft' || k==='ArrowUp' || k==='ArrowDown'){
    let i = order.indexOf(UI.cst.sel); if(i<0) i = -1;
    i = (i + ((k==='ArrowRight'||k==='ArrowDown') ? 1 : -1) + order.length) % order.length;
    UI.cst.sel = order[i]; UI.cst.selAt = performance.now(); SFX.tap();
    return true;
  }
  if((k==='Enter' || k===' ') && UI.cst.sel){ buyConstel(UI.cst.sel); return true; }
  return false;
}
/* abre el panel (entrada desde DATOS / DINASTIA) */
function openConstel(hint){
  constelEnsure();
  UI.cst = UI.cst || {};
  UI.cst.hint = !!hint; UI.cst.openAt = performance.now();
  if(!UI.cst.sel || hint){
    const ok = CONSTEL.find(n=>constelState(n)==='ok');
    UI.cst.sel = ok ? ok.id : CONSTEL[0].id;
  }
  UI.mode = 'constel';
}
