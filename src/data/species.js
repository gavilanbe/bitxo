"use strict";
/* =========================================================
   BITXO — data/species: líneas, formas, caracteres y favoritas
   ========================================================= */
const LINES = {
 pradera:{name:'PRADERA', eggShell:'#f6efe0', eggSpot:'#7ac74f', bonus:'+15% MOTAS', hint:'DISPONIBLE',
   unlock:k=>true,
   w:30, names:{babyA:'MIRU',babyB:'PIPO',childA:'KIPO',childB:'CHUMBO',adultA:'RAYON',adultB:'GORDON',adultC:'BRINCO',adultD:'MOFLE',adultS:'FLORAN'}},
 brasa:{name:'BRASA', eggShell:'#f8e0d0', eggSpot:'#e8574c', bonus:'ENTRENO X2', hint:'1 ASCENSO',
   unlock:k=>k.ascensions>=1,
   w:25, names:{babyA:'FLAMI',babyB:'HUMITO',childA:'CHISPO',childB:'ASCUO',adultA:'PIROX',adultB:'VULCAN',adultC:'FAROL',adultD:'BRASGO',adultS:'IGNIS'}},
 marea:{name:'MAREA', eggShell:'#e0f0f8', eggSpot:'#4a90d8', bonus:'+PILAS', hint:'2 ASCENSOS',
   unlock:k=>k.ascensions>=2,
   w:20, names:{babyA:'GOTI',babyB:'PLIP',childA:'NADIN',childB:'BURBU',adultA:'TRITON',adultB:'MEDUSO',adultC:'SURFIN',adultD:'GLUGLU',adultS:'ABISAL'}},
 fungo:{name:'FUNGO', eggShell:'#f2e8da', eggSpot:'#c9743a', bonus:'VIAJA RAPIDO', hint:'3 ASCENSOS',
   unlock:k=>k.ascensions>=3,
   w:14, names:{babyA:'ESPORIN',babyB:'PILZI',childA:'CHAMPI',childB:'TRUFO',adultA:'MICELION',adultB:'BOLETON',adultC:'AMANITO',adultD:'HONGON',adultS:'FUNGALOR'}},
 petrea:{name:'PETREA', eggShell:'#e4e4e8', eggSpot:'#6a6a78', bonus:'-CACAS', hint:'4 ASCENSOS',
   unlock:k=>k.ascensions>=4,
   w:15, names:{babyA:'ROCLI',babyB:'GUIJA',childA:'GRAVIO',childB:'MUSGO',adultA:'GOLEM',adultB:'GEODO',adultC:'OBSIDIO',adultD:'PEDRON',adultS:'TITANO'}},
 astro:{name:'ASTRO', eggShell:'#e6e0f8', eggSpot:'#ffd94a', bonus:'+1 ESTRELLA', hint:'6 ASCENSOS',
   unlock:k=>k.ascensions>=6||k.stars>=8,
   w:10, names:{babyA:'LUNI',babyB:'TILIN',childA:'COMETIN',childB:'NEBLIN',adultA:'ASTRAL',adultB:'ECLIPSO',adultC:'FUGAZ',adultD:'PLANETON',adultS:'COSMO'}}
};
const LINE_KEYS = Object.keys(LINES);
const SLOT_KEYS = ['babyA','babyB','childA','childB','adultA','adultB','adultC','adultD','adultS'];

/* --- caracteres --- */
const TRAITS = {
  GLOTON:  'COME MAS Y MEJOR',
  VALIENTE:'PEGA UN 25% MAS',
  DORMILON:'DUERME DE LUJO',
  JUGUETON:'GANA MAS XP JUGANDO',
  TIMIDO:  '+10% MOTAS EN CALMA',
  CURIOSO: 'APRENDE X2 DE CHISPAS'
};
const TRAIT_KEYS = Object.keys(TRAITS);
