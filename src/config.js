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
/* evolución unificada con el nivel: madurar pide edad Y nivel.
   La XP pasiva (despierto) gotea hasta el nivel de madurez, así el
   ritmo idle se mantiene y el cariño acelera; el ascenso (LV8) ya
   solo se gana jugando. */
const EVO_LEVEL = { child:3, adult:6 };
const XP_TRICKLE_MS = 1.5/60000; /* 1.5 XP por minuto despierto */
const POOP_EVERY = 4*60*1000;
const OFFLINE_CAP = 14*60*60*1000;
const RUNAWAY_AFTER = 14*60*60*1000;
const COST_MEAL = 5, COST_SNACK = 8;

/* versión desplegada: la estampa tools/stamp.sh en cada publicación */
const GAME_VERSION = '20260704-1715';
let UPDATE_READY = false;
