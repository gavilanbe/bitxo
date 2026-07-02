"use strict";
/* =========================================================
   BITXO — data/content: tienda, logros, expediciones, reliquias, comida, juguetes y enemigos
   ========================================================= */
const SHOP = [
 {id:'cosecha', name:'COSECHA', desc:'+1 POR MOTA',    base:15,  growth:1.65, max:50},
 {id:'aura',    name:'AURA',    desc:'+0.25/S PASIVO', base:25,  growth:1.7,  max:50},
 {id:'iman',    name:'IMAN',    desc:'AUTO-RECOGE',    base:150, growth:1,    max:1},
 {id:'comedero',name:'COMEDERO',desc:'COMEN SOLOS',    base:120, growth:2.4,  max:3},
 {id:'juguete', name:'JUGUETE', desc:'ANIMO DURA MAS', base:80,  growth:2,    max:5},
 {id:'cama',    name:'CAMA',    desc:'DUERMEN MEJOR',  base:80,  growth:2,    max:5},
 {id:'jardin',  name:'JARDIN',  desc:'PRADO +25%',     base:100, growth:2.3,  max:5},
 {id:'nido',    name:'NIDO',    desc:'+1 HUEVO',       base:2000,growth:15,   max:2}
];
function upCost(item, lvl){ return Math.ceil(item.base * Math.pow(item.growth, lvl)); }

const ACH = [
 {id:'hatch', name:'PRIMER PASO',    cond:()=>dexCount()>=1, m:20},
 {id:'joven', name:'ADOLESCENTE',    cond:()=>Object.keys(G.dex).some(k=>k.includes('_child')), m:50},
 {id:'adulto',name:'TODO UN ADULTO', cond:()=>Object.keys(G.dex).some(k=>k.includes('_adult')), m:150},
 {id:'col10', name:'COLECCIONISTA',  cond:()=>dexCount()>=10, m:300},
 {id:'col25', name:'ENCICLOPEDIA',   cond:()=>dexCount()>=25, s:1},
 {id:'guer',  name:'GUERRERO',       cond:()=>G.battlesWon>=5, m:200},
 {id:'camp',  name:'CAMPEON',        cond:()=>G.battlesWon>=25, s:1},
 {id:'magn',  name:'MAGNATE',        cond:()=>G.totalMotas>=10000, m:500},
 {id:'dina',  name:'DINASTIA',       cond:()=>G.ascensions>=3, s:1},
 {id:'fam',   name:'FAMILIA',        cond:()=>G.pets.length>=3, m:400},
 {id:'leye',  name:'LEYENDA',        cond:()=>Object.keys(G.dex).some(k=>k.endsWith('_adultS')), s:2},
 {id:'amig',  name:'MEJORES AMIGOS', cond:()=>(G.bond||0)>=20, m:300},
 {id:'expl',  name:'EXPLORADOR',     cond:()=>(G.expedsDone||0)>=5, m:300},
 {id:'caza',  name:'CAZAJEFES',      cond:()=>(G.bossesWon||0)>=3, s:1},
 {id:'gour',  name:'GOURMET',        cond:()=>Object.keys(G.foodsTried||{}).length>=8, m:250}
];
const EXPEDS = [
 {id:'prado', name:'PRADO ALTO',    mins:20,  motas:30,  xp:10,  relic:0.10, egg:null,    eggP:0},
 {id:'pico',  name:'PICO ARDIENTE', mins:60,  motas:90,  xp:25,  relic:0.20, egg:'brasa', eggP:0.25},
 {id:'costa', name:'COSTA SALADA',  mins:180, motas:250, xp:60,  relic:0.35, egg:'marea', eggP:0.30},
 {id:'cima',  name:'CIMA ESTELAR',  mins:480, motas:700, xp:150, relic:0.55, egg:'astro', eggP:0.25}
];
const RELICS = [
 {id:'trebol',    name:'TREBOL DORADO',   desc:'+5% MOTAS'},
 {id:'campanilla',name:'CAMPANILLA',      desc:'+1 POR CHISPA'},
 {id:'pluma',     name:'PLUMA ROJA',      desc:'+10% ATAQUE'},
 {id:'caracola',  name:'CARACOLA',        desc:'PILAS DURAN +10%'},
 {id:'seta',      name:'SETA ANCESTRAL',  desc:'JARDIN +10%'},
 {id:'lagrima',   name:'LAGRIMA LUNAR',   desc:'FUGACES DAN X2'},
 {id:'hueso',     name:'HUESO VIEJO',     desc:'LADRONES LENTOS'},
 {id:'cristal',   name:'CRISTAL VIVO',    desc:'+10% XP'},
 {id:'corona',    name:'CORONA DE MUSGO', desc:'ANIMO DURA MAS'},
 {id:'ojo',       name:'OJO DE DRAGON',   desc:'BOTIN DURA 20 MIN'}
];
const FOODS = [
 {id:'racion', name:'RACION',    cost:5,  spr:'meal',   hunger:35, happy:0,  energy:0,  weight:1, desc:'+HAMBRE'},
 {id:'chuche', name:'CHUCHE',    cost:8,  spr:'snack',  hunger:8,  happy:18, energy:0,  weight:2, desc:'+ANIMO', snack:true},
 {id:'fruta',  name:'FRUTA',     cost:7,  spr:'fruta',  hunger:20, happy:4,  energy:10, weight:0, desc:'LIGERA +PILAS'},
 {id:'pescado',name:'PESCADO',   cost:12, spr:'pescado',hunger:30, happy:0,  energy:0,  weight:1, desc:'+1 FUERZA', str:1},
 {id:'picante',name:'PICANTE',   cost:10, spr:'picante',hunger:5,  happy:6,  energy:30, weight:0, desc:'+PILAS ¡PICA!', spicy:true},
 {id:'pastel', name:'PASTEL',    cost:25, spr:'pastel', hunger:50, happy:25, energy:0,  weight:4, desc:'FIESTA TOTAL'},
 {id:'seta',   name:'SETA RARA', cost:15, spr:'setita', hunger:0,  happy:0,  energy:0,  weight:0, desc:'¿¿¿???', gamble:true},
 {id:'sopa',   name:'SOPA ASTRAL',cost:40,spr:'sopa',   hunger:15, happy:15, energy:15, weight:0, desc:'+TODO +XP', xp:10}
];
const FAVES = {pradera:'fruta', brasa:'picante', marea:'pescado', petrea:'seta', astro:'sopa'};
const TOYS = [
 {id:'pelota',  name:'PELOTA',        desc:'LA CHUTAN Y JUEGAN', cost:60},
 {id:'caja',    name:'CAJA SORPRESA', desc:'PREMIO CADA 45 MIN', cost:100},
 {id:'columpio',name:'COLUMPIO',      desc:'RELAX: ANIMO Y PILAS', cost:150}
];

const ENEMIES = {
  ratuco: {name:'RATUCO',  base:3},
  pinchon:{name:'PINCHON', base:6},
  sombrio:{name:'SOMBRIO', base:10},
  lobruno:{name:'LOBRUNO', base:14}
};
