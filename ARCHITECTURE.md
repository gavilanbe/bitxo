# Arquitectura — BITXO

Mascota virtual + idle incremental en un `<canvas>` 2D de **160×272 píxeles
lógicos** escalado a factor entero (pixel-perfect). 100% procedural: sprites,
iconos, SFX y música se generan en código. **Sin build step y sin dependencias**
— scripts clásicos servidos estáticos (`make` o `python3 -m http.server`).

## Principio rector

**El orden de `<script>` en `index.html` ES el grafo de dependencias.** Todos los
módulos comparten el ámbito global (no hay imports); un archivo solo puede usar
*en tiempo de carga* lo definido en archivos anteriores. Las llamadas en tiempo de
ejecución (dentro de funciones) pueden cruzar en cualquier dirección. Si añades un
archivo nuevo, insértalo en `index.html` después de sus dependencias de carga.

```
src/
├─ config.js               resolución lógica (160×272) y constantes de juego:
│                          tiempos de evolución, cacas, tope offline, costes
│
├─ core/                   ─── motor (no sabe nada de bitxos) ───
│  ├─ canvas.js            canvas, reescalado entero y px(x,y,w,h,color)
│  ├─ font.js              fuente bitmap 3×5, drawText/drawTextC/textW, fmt (1.2K/3M)
│  ├─ color.js             color de línea K, hexToHsl/hslToHex/shiftHue
│  └─ sprites.js           mkSprite (texto→canvas), mkIcon, siluetas (blanca/oscura)
│
├─ data/                   ─── contenido puro ───
│  ├─ species.js           LINES (5 líneas, nombres, desbloqueo), SLOT_KEYS (9 formas),
│  │                       TRAITS (6 caracteres)
│  ├─ pixelart.js          arte en píxeles: RAW (bitxos + parpadeo), huevo, comida,
│  │                       juguetes, iconos IC, enemigos ESPR
│  └─ content.js           SHOP, ACH (logros), EXPEDS, RELICS, FOODS (+FAVES), TOYS,
│                          ENEMIES
│
├─ audio/                  ─── todo Web Audio, cero samples ───
│  ├─ engine.js            AudioContext perezoso, bus maestro + delay, ondas de pulso
│  │                       NES (duty 12.5/25%), tone/nz/kick/beep
│  ├─ sfx.js               SFX por capas (transitorio+cuerpo+cola) y petVoice (cada
│  │                       línea/etapa suena distinto)
│  ├─ ambience.js          pájaros al alba, grillos, lechuza, lluvia y viento diegéticos
│  └─ music.js             SONGS (día/noche/lluvia/combate) + secuenciador con bajo,
│                          guide-tones, acompañamiento, batería y swing
│
├─ game/                   ─── reglas y estado ───
│  ├─ state.js             G (estado global), makePet, spawnEgg/rollLine, freshGame,
│  │                       migrateOld (partidas v1–v4)
│  ├─ storage.js           saveGame/loadGame en localStorage ('bitxo-save')
│  ├─ world.js             WEATHER (lluvia/viento/niebla) y dayPhase (reloj real)
│  ├─ economy.js           tasas de hambre/pilas/ánimo, producción de motas, XP y
│  │                       niveles, evolución por cuidado, logros, regalo diario
│  ├─ ui.js                UI (modo de pantalla), toast, vibrate, sprite actual
│  ├─ offline.js           applyElapsed: simula hasta 14 h de ausencia en 24 pasos
│  ├─ sim.js               liveUpdate: el corazón — necesidades, paseo, amistad,
│  │                       juguetes, clima, chispas, salvajes, autoguardado
│  ├─ actions.js           comer, limpiar, luz, entrenar, tienda, juguetes,
│  │                       expediciones, ascensión
│  ├─ minigames.js         lógica de atrapa-motas, baile y simón
│  └─ battle.js            combate por turnos con barra de timing, jefes, botín
│
├─ render/                 ─── dibujo (una función por pantalla/capa) ───
│  ├─ scene.js             cielo por fase del día, colinas, prado, jardín, clima,
│  │                       chispas, fugaces, constelación de la dinastía
│  ├─ pets.js              bitxos (anim. squash&stretch, dormir, comer, columpio),
│  │                       juguetes, salvajes, cacas
│  ├─ hud.js               HUD, botonera, paneles y pantallas: datos, tienda,
│  │                       despensa, jugar, expedición, reliquias, álbum, logros
│  ├─ fx.js                partículas/flotantes y cinemáticas (evolución,
│  │                       nacimiento, ascensión)
│  └─ minigames.js         dibujo del combate y de los 3 minijuegos
│
├─ input.js                botonera + handleTap: un único router de toques por modo
└─ main.js                 bucle frame() (rAF) + arranque: sprites, carga, offline
```

## El estado

Todo vive en el objeto global **`G`** (serializado tal cual a `localStorage`):
mascotas (`G.pets[]`, cada una con hambre/ánimo/pilas/higiene, nivel, carácter,
forma...), economía (`G.motas`, mejoras `G.up`), metaprogreso (`G.stars`,
`G.ascensions`, `G.dex`, `G.relics`, `G.ach`). La versión de guardado es `G.v`
(actual: 5); `migrateOld()` convierte partidas v1–v4. Si cambias el formato,
**sube `v` y añade migración** — nunca rompas partidas existentes.

`UI` (en `game/ui.js`) es estado efímero de pantalla y **no se guarda**: modo
actual, partículas, toasts, minijuego en curso.

Nota de diseño del sueño: dormido, el hambre y el ánimo bajan a ×0.3 y las
pilas se recargan de 0 a 100 en ~6 h (menos con CAMA y el carácter DORMILON).
Dormir repara — no castiga.

## El bucle

`main.js#frame()` corre con `requestAnimationFrame`:
`liveUpdate(dt)` (simulación) → dibujo según `UI.mode`. La música y el ambiente
van aparte con `setInterval`, planificando notas por delante del reloj de audio
(no dependen del framerate).

## Recetas

- **Nueva comida** — añade la entrada a `FOODS` en `data/content.js`, su sprite
  en `buildAllSprites()` (`data/pixelart.js`) y, si quieres sonido propio, un
  caso en `SFX.eatFood` (`audio/sfx.js`). La cuadrícula de la despensa es 2×4:
  si pasas de 8 comidas, ajusta `drawFeedMenu` y su zona táctil en `handleTap`.
- **Nueva línea (especie)** — entrada en `LINES` (`data/species.js`) con nombres
  de las 9 formas y condición de desbloqueo, y los 9 sprites `linea_forma` en
  `RAW` (`data/pixelart.js`). El álbum y el roll de huevos la recogen solos.
- **Nueva mejora de tienda** — entrada en `SHOP` (`data/content.js`) + su efecto
  donde toque (las tasas están en `game/economy.js`). La lista de la tienda
  pagina de 8 en 8… con más de 8, toca darle scroll o pestañas.
- **Nuevo minijuego** — lógica en `game/minigames.js` (usa `mgGuard`/`finishMg`),
  dibujo en `render/minigames.js`, rama de modo en `frame()` y toques en
  `handleTap`, y su tarjeta en `drawPlayMenu`.
- **Nuevo SFX** — método en el objeto `SFX` componiendo `tone()`/`nz()`/`kick()`.
- **Nueva misión diaria** — entrada en `QUESTS` (`data/content.js`) + su hook
  `questProg(id, n)` donde ocurra la acción. La selección diaria es determinista
  (LCG sembrado por la fecha) en `ensureDaily()`.
- **Nuevo gorro** — entrada en `HATS` + sprite `hat_<id>` en `buildAllSprites()`.
  Se dibuja anclado a la cabeza en `drawOnePet` y en el combate.
- **Nueva oferta del buhonero** — añádela al `pool` de `buhoOffers()` y su
  efecto en `buyBuhoOffer()` (`game/actions.js`).
- **Nuevo enemigo** — entrada en `ENEMIES` (`data/content.js`) con `elem`,
  `quirk` (o uno nuevo en `battle.js`), `hpM/atkM` y `desc` para el bestiario;
  su sprite en `buildEnemySprites()`, su hueco en `BEAST_ORDER` y, si es
  salvaje normal, el umbral de victorias en `WILD_POOL`.
- **Nuevo disco para el BAILE** — entrada en `DISCOS` (`data/content.js`) con
  `step` (ms por paso), `pat` (16 pulsos), `tune` (16 semitonos sobre `base`) y
  `mult` (recompensa). La discoteca, la preview y el juego lo recogen solos.
- **Cambiar la evolución** — las reglas viven en `checkEvolution()`
  (`game/economy.js`), su predicción en `predictNext()` (mismo archivo) y su
  descripción visible en `EVO_REQS` (`data/content.js`). **Mantén las TRES
  sincronizadas**: lo que promete el árbol y el RUMBO de DATOS es lo que debe
  ejecutar el código. Stats entrenables: `p.str`, `p.def`, `p.spd` (el antiguo
  `discipline` migra a `str` al cargar). Toda evolución pasa por `EVO_QUEUE`
  (`game/ui.js`): se encola al cumplirse y la cinemática se reproduce cuando
  el jugador está en el prado — también las que ocurren offline.

## Red de seguridad

- **CI**: `.github/workflows/test.yml` ejecuta la batería del arnés en cada
  push (Chrome headless en el runner). Si una prueba cae, el Action falla y
  el badge del README se pone rojo. Ojo: GitHub Pages (legacy) despliega
  igualmente — el Action es la alarma, no la barrera.
- **Defaults de guardado**: TODOS los valores por defecto al cargar viven en
  `normalizeSave()` (`main.js`), probado en la batería con un guardado v5
  antiguo sintético. Campo nuevo en `G` ⇒ default en `normalizeSave` +
  `freshGame()` y, si hace falta, su prueba.
- **Copia de seguridad**: COPIAR/CARGAR SAVE en DATOS (base64 del JSON por
  el portapapeles). Cargar valida el código y recarga la página para pasar
  por `normalizeSave`.

## PWA

`manifest.webmanifest` + `sw.js` + `icons/` (generados desde el arte real con
`tools/icon.html`). El service worker es **red primero, caché de respaldo**:
nunca sirve JS viejo si hay conexión (los `?v=` además cambian de URL), y sin
red el juego abre con lo último descargado. `tools/stamp.sh` estampa también
el nombre de la caché del SW, que purga las versiones anteriores al activarse.

## Publicar (y que a nadie le quede caché vieja)

`make ship MSG="mensaje"` hace todo: ejecuta `tools/stamp.sh` (estampa una
versión nueva en los `?v=` de `index.html`, en `GAME_VERSION` de
`src/config.js` y en `version.json`), commitea y publica con la cuenta
correcta. Los `?v=` nuevos invalidan la caché del navegador al instante; las
partidas que ya estén abiertas consultan `version.json` cada 5 minutos (con
`cache: no-store`) y muestran el banner "VERSION NUEVA: TOCA", que recarga.
**No publiques a mano sin estampar** — los usuarios se quedarían con JS viejo.

## Pruebas

`test/harness.html` carga el juego en un iframe y ejecuta una batería de
comprobaciones (arranque, misiones, buhonero, gorros, toques, regresiones).
Con el servidor local levantado:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --virtual-time-budget=8000 --dump-dom http://localhost:4321/test/harness.html \
  | grep -o 'RESULTS::{[^<]*'
```

Con `?mode=hat|buhoprado|quests|buho|gorros` fuerza estados visuales para
capturarlos con `--screenshot`.

## Deuda conocida / decisiones

- **Globales compartidos en vez de ES modules**: decisión deliberada — el código
  original era un único archivo con estado muy entrelazado (`G`, `UI`, `WEATHER`
  se reasignan desde varios módulos) y los scripts clásicos preservan ese
  comportamiento exactamente con riesgo cero. Si algún día se migra a ES modules,
  empezar por encapsular `G` tras getters/setters.
- `render/hud.js` es el archivo más largo (una función por pantalla); si crece,
  partir en `hud.js` + `screens/`.
