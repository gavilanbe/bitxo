"use strict";
/* =========================================================
   BITXO — config: resolución lógica y constantes de juego
   ========================================================= */
const LW = 160, LH = 272;

/* ---------------- ESTADO (v6 multi-bitxo) ---------------- */
const STAGES = { EGG:0, BABY:1, CHILD:2, ADULT:3 };
const T_HATCH = 45*1000;
const T_CHILD = 20*60*1000;
const T_ADULT = 3*60*60*1000;
const POOP_EVERY = 4*60*1000;
const OFFLINE_CAP = 14*60*60*1000;
const RUNAWAY_AFTER = 14*60*60*1000;
const COST_MEAL = 5, COST_SNACK = 8;

/* versión desplegada: la estampa tools/stamp.sh en cada publicación */
const GAME_VERSION = '20260703-1526';
let UPDATE_READY = false;
