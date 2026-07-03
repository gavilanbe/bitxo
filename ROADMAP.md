# Roadmap — BITXO

Ideas priorizadas para el futuro. Las ✅ ya están; lo demás, por orden dentro
de cada bloque (arriba = más ganas). Cada entrada intenta apoyarse en sistemas
que ya existen — esa es la regla de la casa: **coherencia antes que novedad**.

## 🎮 Mecánicas grandes

- ✅ **🗼 Torre del Prado** — 5 pisos de NV creciente sin curarte (solo un
  respiro del 18% entre pisos), cuota ✦100, élite en el 4º y jefe arriba;
  bono en el piso 3 y en la cima motas + reliquia + el gorro LAUREL.
- **🥚 Cría** — dos adultos con AMISTAD alta pueden dar un huevo que hereda
  línea y carácter (con sorpresas). *Se apoya en: multi-bitxo, bond, dex.*
- ✅ **🌟 Pantalla de DINASTÍA** — toca el cielo y ahí están: cada ascendido
  con su sprite, nivel, generación y las estrellas que dejó.
- **🎒 Inventario ligero** — pociones del buhonero que se guardan en vez de
  usarse al momento (3 huecos). *Se apoya en: buhonero, boosts.*
- ✅ **📅 Misión semanal** — un encargo gordo por semana (élites, combates,
  minijuegos o entreno) en el cartel, bajo las diarias.
- ✅ **🏆 Revancha del bestiario** — toca la ficha de cualquier enemigo visto
  y peleas contra él a tu nivel +1.

## 🐾 Contenido

- **Más líneas** — ✅ FUNGO · ✅ VOLTIO · ideas: BRUMA (fantasma, se desbloquea
  criando a un GRIMO hasta nivel 10 — redime el fracaso), FLORA (jardín 5).
- **Más enemigos** — ✅ 13 · ideas: pareja que ataca junta (dos barras de vida),
  mímico que copia tu línea, jefe estacional.
- **Más discos** — NANA (para dormirlo tú), MAREA ALTA (ritmo irregular),
  disco secreto del buhonero.
- **Más expediciones** — ✅ 5 · ideas: expedición nocturna (solo de noche),
  cooperativa (dos bitxos, botín doble).
- **Más gorros** — ✅ 11 con posiciones (cara/cuello/halo) y ✅ el primero por
  mérito (LAUREL de la torre) · ideas: gorro estacional.
- **Más juguetes** — ✅ 9 · ideas: cama elástica (minijuego improvisado),
  espejo (posan con el gorro), casita (duermen mejor sin CAMA máxima).

## 🌦 Mundo

- **Estaciones reales** — por mes: nieve en invierno (bitxos con bufanda),
  hojas en otoño, flores extra en primavera; comida y enemigo de temporada.
- **Clima extremo raro** — tormenta con truenos (corren a refugiarse a la
  casita), arcoíris tras la lluvia con mota dorada.
- **Eventos de fecha** — cumpleaños del bitxo (tarta gratis), año nuevo
  (fuegos artificiales sobre el prado).

## 🖥 UI / UX

- **🎨 Temas de panel desbloqueables** — madera, noche, GBC verde; se ganan
  con logros, se cambian en DATOS.
- **📸 Postales** — botón de foto que compone un PNG del bitxo con marco y
  fecha para compartir (usa el pipeline de captura del arnés).
- **✏️ Nombres propios** — teclado pixel en pantalla para bautizarlo; el
  nombre viaja por HUD, combate y dinastía.
- **📊 Página de estadísticas de vida** — pasos del prado, motas históricas,
  comidas favoritas, tiempo jugado.
- **🔊 Volumen fino** — deslizador música/efectos por separado (hoy solo mute).

## 🔗 Social / meta

- **🎁 Código-huevo regalo** — exportar un huevo como código corto para que
  otro jugador lo incube (una vez). *Se apoya en: export/import de partidas.*
- **🏅 Vitrina de récords** — imagen-resumen de tus récords de la sala de
  juegos para compartir.

## 🔧 Técnico

- **Migración opcional a ES modules** — solo si el proyecto crece más;
  empezar encapsulando `G` (ver ARCHITECTURE).
- **Gate de deploy por CI** — pasar Pages a despliegue por Actions para que
  un rojo bloquee la publicación (hoy es alarma, no barrera).
- **i18n ligero** — tabla de cadenas si algún día hay inglés.
- **Gamepad / teclado** — mapear la botonera a teclas para escritorio.
