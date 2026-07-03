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
 {id:'fruta',  name:'FRUTA',     cost:7,  spr:'fruta',  hunger:20, happy:4,  energy:10, weight:0, desc:'SUAVE +PILAS'},
 {id:'pescado',name:'PESCADO',   cost:12, spr:'pescado',hunger:30, happy:0,  energy:0,  weight:1, desc:'+1 FUERZA', str:1},
 {id:'picante',name:'PICANTE',   cost:10, spr:'picante',hunger:5,  happy:6,  energy:30, weight:0, desc:'PICA: +PILAS', spicy:true},
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

/* --- misiones del día: 3 rotan cada día en el cartel del prado --- */
const QUESTS = [
 {id:'chispas', name:'RECOGE 12 CHISPAS',  n:12, m:60, xp:10},
 {id:'comidas', name:'DA 3 COMIDAS',       n:3,  m:40, xp:8},
 {id:'juegos',  name:'JUEGA 2 MINIJUEGOS', n:2,  m:50, xp:10},
 {id:'combate', name:'GANA 1 COMBATE',     n:1,  m:70, xp:12},
 {id:'limpia',  name:'LIMPIA 3 CACAS',     n:3,  m:40, xp:8},
 {id:'mimos',   name:'ACARICIA 5 VECES',   n:5,  m:30, xp:6},
 {id:'entrena', name:'ENTRENA 2 VECES',    n:2,  m:45, xp:8}
];

/* --- gorros: cosmética que tu bitxo lleva puesta de verdad --- */
const HATS = [
 {id:'lazo',   name:'LAZO',       cost:100, desc:'UN TOQUE MONO'},
 {id:'flor',   name:'FLOR',       cost:120, desc:'HUELE A PRADO'},
 {id:'seta',   name:'SETA',       cost:150, desc:'MUY CAMPESTRE'},
 {id:'copa',   name:'COPA',       cost:250, desc:'ELEGANCIA PURA'},
 {id:'corona', name:'CORONA',     cost:400, desc:'PARA LEYENDAS'},
 {id:'buho',   name:'GORRO BUHO', cost:250, desc:'SOLO EL BUHONERO', buhoOnly:true}
];

/* --- discos para el BAILE: cada uno una canción distinta --- */
const DISCOS = [
 {id:'prado',   name:'DISCO PRADO',   cost:0,   desc:'LA DE SIEMPRE',
  step:280, base:349.23, mult:1,
  pat:[1,0,1,0,1,1,0,1,1,0,1,1,0,1,0,1],
  tune:[12,0,9,0,7,9,0,12,14,0,12,9,0,7,4,7]},
 {id:'verbena', name:'DISCO VERBENA', cost:120, desc:'FIESTA DEL PUEBLO',
  step:235, base:392, mult:1.15,
  pat:[1,1,0,1,1,0,1,1,1,1,0,1,1,0,1,1],
  tune:[0,4,7,4,9,7,4,0,2,5,9,5,11,9,5,2]},
 {id:'luna',    name:'DISCO LUNA',    cost:200, desc:'VALS PARA SOÑAR',
  step:340, base:330, mult:1.1,
  pat:[1,0,0,1,0,1,1,0,0,1,0,1,1,0,1,0],
  tune:[0,3,7,10,7,3,12,7,0,3,7,3,10,8,7,3]},
 {id:'maquina', name:'DISCO MAQUINA', cost:350, desc:'CHIPTUNE A TOPE',
  step:200, base:262, mult:1.3,
  pat:[1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,1],
  tune:[0,0,3,0,5,3,0,7,0,0,3,0,10,7,5,3]}
];
const COST_SALTA = 250;

/* --- árbol evolutivo: requisitos visibles (estilo Digimon World) --- */
const EVO_REQS = {
 egg:   ['TODO EMPIEZA AQUI', 'CUIDA LO QUE SALGA'],
 babyA: ['AL ECLOSIONAR: 50%', 'PURA SUERTE'],
 babyB: ['AL ECLOSIONAR: 50%', 'PURA SUERTE'],
 childA:['BEBE CON ENTRENO TOTAL 4+', 'O CUIDADO 65+'],
 childB:['BEBE CON POCO ENTRENO', 'Y CUIDADO REGULAR'],
 adultA:['JOVEN {cA} + FUERZA 5+', 'CON MAS FUE QUE DEF'],
 adultB:['JOVEN {cA} SIN FUERZA 5', 'O CON MAS DEF QUE FUE'],
 adultC:['JOVEN {cB} + VELOCIDAD 5+', 'O 3 JUEGOS GANADOS'],
 adultD:['JOVEN {cB} TRANQUILO:', 'SIN VELOCIDAD NI JUEGOS'],
 adultS:['TODAS LAS STATS 6+ Y 0 FALLOS', 'CUIDADO 85+ Y JUEGOS 5+'],
 grimo: ['5 FALLOS O CUIDADO PESIMO', 'EL ABANDONO TIENE PRECIO']
};
