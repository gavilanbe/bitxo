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
 {id:'gour',  name:'GOURMET',        cond:()=>Object.keys(G.foodsTried||{}).length>=8, m:250},
 {id:'natu',  name:'NATURALISTA',    cond:()=>BEAST_ORDER.every(k=>G.beast && G.beast[k] && G.beast[k].seen>0), s:1}
];
const EXPEDS = [
 {id:'prado', name:'PRADO ALTO',    mins:20,  motas:30,  xp:10,  relic:0.10, egg:'fungo', eggP:0.15},
 {id:'pico',  name:'PICO ARDIENTE', mins:60,  motas:90,  xp:25,  relic:0.20, egg:'brasa', eggP:0.25},
 {id:'costa', name:'COSTA SALADA',  mins:180, motas:250, xp:60,  relic:0.35, egg:'marea', eggP:0.30},
 {id:'cima',  name:'CIMA ESTELAR',  mins:480, motas:700, xp:150, relic:0.55, egg:'astro', eggP:0.25},
 {id:'trueno',name:'PICO DEL TRUENO',mins:300, motas:420, xp:95,  relic:0.45, egg:'voltio', eggP:0.25}
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
const FAVES = {pradera:'fruta', brasa:'picante', marea:'pescado', fungo:'seta', petrea:'seta', astro:'sopa'};
const TOYS = [
 {id:'pelota',  name:'PELOTA',        desc:'LA CHUTAN Y JUEGAN', cost:60},
 {id:'caja',    name:'CAJA SORPRESA', desc:'PREMIO CADA 45 MIN', cost:100},
 {id:'columpio',name:'COLUMPIO',      desc:'RELAX: ANIMO Y PILAS', cost:150},
 {id:'banera',  name:'BANERA',        desc:'CHAPUZONES: +LIMPIO', cost:180},
 {id:'tambor',  name:'TAMBOR',        desc:'CONCIERTOS DE PRADO', cost:220},
 {id:'huerto',  name:'HUERTO',        desc:'FRUTA GRATIS CADA 2H', cost:400},
 {id:'cometa',  name:'COMETA',        desc:'VUELA CON EL VIENTO', cost:260},
 {id:'fuente',  name:'FUENTE',        desc:'AGUA FRESCA: +PILAS', cost:350},
 {id:'robot',   name:'ROBOT AMIGO',   desc:'LIMPIA CACAS EL SOLO', cost:500}
];

/* --- zonas del mundo: el prado es el hogar; cada juguete vive en su sitio.
   EL PARQUE se abre por el sendero (2 juguetes + un JOVEN + motas) y se
   lleva los juguetes de jugar; el prado conserva los de cuidado. --- */
const ZONES = {
  prado:  {name:'EL PRADO'},
  parque: {name:'EL PARQUE', cost:500, toysNeed:2}
};
const TOY_ZONE = {
  pelota:'parque', caja:'parque', columpio:'parque', tambor:'parque', cometa:'parque',
  banera:'prado', huerto:'prado', fuente:'prado', robot:'prado'
};

const ENEMIES = {
  ratuco:     {name:'RATUCO',      elem:'neutral', quirk:null,     hpM:0.9,  atkM:0.9,  desc:'SIN TRUCOS, PURO DIENTE'},
  pinchon:    {name:'PINCHON',     elem:'pradera', quirk:'thorns', hpM:1,    atkM:0.95, desc:'PINCHOS SI NO ES CRITICO'},
  chispin:    {name:'CHISPIN',     elem:'brasa',   quirk:'burn',   hpM:0.95, atkM:1,    desc:'SU QUEMADURA DURA 2 TURNOS'},
  burbujon:   {name:'BURBUJON',    elem:'marea',   quirk:'bubble', hpM:1.1,  atkM:0.9,  desc:'SU BURBUJA PIDE UN CRITICO'},
  sombrio:    {name:'SOMBRIO',     elem:'sombra',  quirk:'evade',  hpM:0.9,  atkM:1.05, desc:'SE ESFUMA SIN UN CRITICO'},
  roquijo:    {name:'ROQUIJO',     elem:'petrea',  quirk:'armor',  hpM:1.25, atkM:0.9,  desc:'CORAZA -2 PERO ES LENTO'},
  polillux:   {name:'POLILLUX',    elem:'astro',   quirk:'double', hpM:0.9,  atkM:0.8,  desc:'PUEDE GOLPEAR DOS VECES'},
  ladronzuelo:{name:'LADRONZUELO', elem:'neutral', quirk:'steal',  hpM:0.95, atkM:0.95, desc:'ROBA MOTAS: VENCE Y DOBLAS'},
  setazo:     {name:'SETAZO',      elem:'fungo',   quirk:'regen',  hpM:1.05, atkM:0.9,  desc:'SE REGENERA CADA TURNO'},
  cuervillo:  {name:'CUERVILLO',   elem:'neutral', quirk:'fly',    hpM:0.9,  atkM:1.05, desc:'VUELA SOBRE EL ESCUDO'},
  relampin:   {name:'RELAMPIN',    elem:'voltio',  quirk:'paralyze',hpM:0.95,atkM:1,    desc:'SU CHISPAZO TE RALENTIZA'},
  lobruno:    {name:'LOBRUNO',     elem:'neutral', quirk:'charge', hpM:1,    atkM:1,    desc:'JEFE: CARGA CADA 3 TURNOS', boss:true},
  reyseto:    {name:'REY SETO',    elem:'fungo',   quirk:'spore',  hpM:1.05, atkM:1,    desc:'JEFE: ESPORAS TE ACELERAN', boss:true}
};
/* orden del bestiario y desbloqueo del prado (victorias necesarias) */
const BEAST_ORDER = ['ratuco','pinchon','chispin','burbujon','sombrio','roquijo','setazo','polillux','cuervillo','ladronzuelo','relampin','lobruno','reyseto'];
const WILD_POOL = [['ratuco',0],['pinchon',3],['chispin',6],['burbujon',10],['sombrio',14],['roquijo',18],['setazo',22],['polillux',26],['cuervillo',30],['ladronzuelo',34],['relampin',38]];
/* la rueda elemental: dos triángulos (y la luz astral castiga a la sombra) */
const ELEM_BEATS = {
  brasa:['pradera'], pradera:['marea'], marea:['brasa'],
  astro:['petrea'], petrea:['fungo','voltio'], fungo:['astro'],
  voltio:['marea']
};
const ELEM_COLS = {pradera:'#7ac74f', brasa:'#e8574c', marea:'#4a90d8', petrea:'#9a9aa4', astro:'#ffd94a', fungo:'#c9743a', voltio:'#f0c030', sombra:'#9d7bd8', neutral:'#c8c0b0'};

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
/* dy: dónde se lleva puesto (0 = coronilla; + baja hacia la cara/cuello; - flota) */
const HATS = [
 {id:'lazo',    name:'LAZO',       cost:100, desc:'UN TOQUE MONO'},
 {id:'flor',    name:'FLOR',       cost:120, desc:'HUELE A PRADO'},
 {id:'pajarita',name:'PAJARITA',   cost:150, desc:'ELEGANTE Y MONO', dy:9},
 {id:'seta',    name:'SETA',       cost:150, desc:'MUY CAMPESTRE'},
 {id:'gafas',   name:'GAFAS',      cost:180, desc:'PURO ESTILO', dy:4},
 {id:'copa',    name:'COPA',       cost:250, desc:'ELEGANCIA PURA'},
 {id:'vikingo', name:'VIKINGO',    cost:300, desc:'A LA CONQUISTA'},
 {id:'corona',  name:'CORONA',     cost:400, desc:'PARA LEYENDAS'},
 {id:'halo',    name:'HALO',       cost:500, desc:'BENDITO BICHO', dy:-4},
 {id:'buho',    name:'GORRO BUHO', cost:250, desc:'SOLO EL BUHONERO', buhoOnly:true},
 {id:'laurel',  name:'LAUREL',     cost:0,   desc:'CAMPEON DE LA TORRE', towerOnly:true}
];
const HAT_BY_ID = {};
for(const H of HATS) HAT_BY_ID[H.id] = H;

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
 {id:'nana',    name:'DISCO NANA',    cost:150, desc:'PARA IR A DORMIR',
  step:360, base:294, mult:0.9,
  pat:[1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0],
  tune:[7,0,4,0,7,0,9,0,5,0,2,0,4,0,0,0]},
 {id:'maquina', name:'DISCO MAQUINA', cost:350, desc:'CHIPTUNE A TOPE',
  step:200, base:262, mult:1.3,
  pat:[1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,1],
  tune:[0,0,3,0,5,3,0,7,0,0,3,0,10,7,5,3]}
];
const COST_SALTA = 250;
/* sala de juegos: catálogo con desbloqueo y qué entrena cada uno */
const MINIGAMES = [
 {id:'mgCatch', name:'MOTAS', glyph:'✦', col:'#8a6a10', sub:'REFLEJOS'},
 {id:'mgDance', name:'BAILE', glyph:'♥', col:'#e2574c', sub:'RITMO'},
 {id:'mgSimon', name:'SIMON', glyph:'?', col:'#6db1ff', sub:'+DEF'},
 {id:'mgJump',  name:'SALTA', glyph:'>', col:'#5ec8d8', sub:'+VEL', cost:250, gkey:'salta'},
 {id:'mgTopo',  name:'TOPO',  glyph:'!', col:'#a4713a', sub:'+FUE', cost:200, gkey:'topo'},
 {id:'mgPesca', name:'PESCA', glyph:'~', col:'#4a90d8', sub:'TESOROS', cost:300, gkey:'pesca'}
];

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

/* --- la torre del prado: 5 combates seguidos, la vida no se cura --- */
const TOWER = {fee:100, floors:5, heal:0.18, unlockWins:10, cooldown:4*3600*1000};
const TOWER_POOL_LOW  = ['ratuco','pinchon','chispin','burbujon'];
const TOWER_POOL_HIGH = ['sombrio','roquijo','setazo','polillux','cuervillo','ladronzuelo','relampin'];

/* --- misión semanal: un encargo gordo con premio a juego --- */
const WEEKLY = [
 {id:'combates', name:'GANA 12 COMBATES',   n:12, m:350, xp:40},
 {id:'elites',   name:'VENCE 3 ELITES',     n:3,  m:400, xp:50},
 {id:'juegos',   name:'JUEGA 20 MINIJUEGOS',n:20, m:300, xp:40},
 {id:'entrena',  name:'ENTRENA 15 VECES',   n:15, m:350, xp:40}
];

/* --- decorar el prado: expresión + sumidero de motas --- */
const DECOR = [
 {id:'flores_pastel', name:'FLORES PASTEL', cost:200, desc:'ROSAS Y CELESTES', kind:'flores', val:'pastel'},
 {id:'flores_fuego',  name:'FLORES FUEGO',  cost:200, desc:'ROJAS Y DORADAS',  kind:'flores', val:'fuego'},
 {id:'valla',   name:'VALLA',        cost:300, desc:'MADERA DEL PARQUE',    kind:'toggle'},
 {id:'camino',  name:'CAMINITO',     cost:250, desc:'PIEDRAS EN LA HIERBA', kind:'toggle'},
 {id:'cielo',   name:'CIELO ASTRAL', cost:500, desc:'MAS ESTRELLAS DE NOCHE', kind:'toggle'}
];
const FLOWER_PALS = {
 clasico:['#e2574c','#ffd94a','#f2a2b8','#e2574c','#6db1ff'],
 pastel: ['#f2a2b8','#9adcf0','#e0c8f8','#fff8d0','#c8f0d8'],
 fuego:  ['#e8574c','#ffd94a','#f0a04b','#e2574c','#ffd94a']
};
