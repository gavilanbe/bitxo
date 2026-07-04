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
- ✅ **🤒 Enfermedad y medicina** — la lluvia sin cometa y la mugre pasan
  factura: gota de fiebre, todo más lento, gym cerrado; MEDICINA en la
  despensa (✦30) o se cura solo tras 10h (con castigo a las 4h).
- ✅ **🎭 Caracteres visibles** — el GLOTÓN sueña comida, el JUGUETÓN persigue
  mariposas, el VALIENTE encara a los salvajes, el TÍMIDO tiembla y huye,
  el CURIOSO investiga chispas, el DORMILÓN bosteza.
- ✅ **📖 Diario del prado** — nacimientos, bautizos, evoluciones, primeras
  hazañas y sustos, escritos solos; 5º botón de DATOS.
- ✅ **🎓 Arco de primer día** — el prado te enseña a jugar paso a paso
  (mimos, comer, limpiar, luz, gym, combate).

## 🐾 Contenido

- **Más líneas** — ✅ FUNGO · ✅ VOLTIO · ideas: BRUMA (fantasma, se desbloquea
  criando a un GRIMO hasta nivel 10 — redime el fracaso), FLORA (jardín 5).
- **Más enemigos** — ✅ 13 · ideas: pareja que ataca junta (dos barras de vida),
  mímico que copia tu línea, jefe estacional.
- **Más discos** — ✅ NANA (báilala y lo dejas dormido) · ideas: MAREA ALTA
  (ritmo irregular), disco secreto del buhonero.
- **Más expediciones** — ✅ 5 · ideas: expedición nocturna (solo de noche),
  cooperativa (dos bitxos, botín doble).
- **Más gorros** — ✅ 11 con posiciones (cara/cuello/halo) y ✅ el primero por
  mérito (LAUREL de la torre) · ideas: gorro estacional.
- **Más juguetes** — ✅ 9 · ideas: cama elástica (minijuego improvisado),
  espejo (posan con el gorro), casita (duermen mejor sin CAMA máxima).
- ✅ **Decorar el prado** — pestaña PRADO en la tienda: flores pastel o fuego,
  valla de madera, caminito de piedras y cielo astral.

## 🌦 Mundo

- **🗺 Zonas del mundo** — ✅ primera fase: EL PARQUE, pantalla nueva a la
  derecha con sendero desbloqueable (2 juguetes + un joven + ✦500); los
  juguetes de jugar (pelota, caja, columpio, tambor, cometa) se mudan allí
  y cada compra futura va a su zona; los salvajes y las chispas recuerdan
  dónde aparecen y las flechas avisan con «!» · pendiente: LA HUERTA
  (huerto, fuente, bañera), dejar bitxos residentes por zona (en brazos,
  máx. 2), bonus pasivos por zona y el GYM viviendo en el parque.
- **Estaciones reales** — ✅ primera fase: el prado respira el calendario
  (nieve en invierno, hojas en otoño, pétalos en primavera) · pendiente:
  bufandas, comida y enemigo de temporada.
- **Clima extremo raro** — tormenta con truenos (corren a refugiarse a la
  casita), arcoíris tras la lluvia con mota dorada.
- ✅ **Citas del prado** — mercadillo del buhonero fijo a mediodía y lluvia
  de estrellas a las 22:00 (deseos ×2).
- ✅ **Cielo gradual** — el color del día ya no salta: amaneceres y
  atardeceres se funden en 40 minutos reales.
- ✅ **Fondos de combate por elemento** — charca contra marea, brasas contra
  brasa, rocas, setas, nubes de tormenta con relámpagos...
- **Eventos de fecha** — cumpleaños del bitxo (tarta gratis), año nuevo
  (fuegos artificiales sobre el prado).

## 🖥 UI / UX

- **🎨 Temas de panel desbloqueables** — madera, noche, GBC verde; se ganan
  con logros, se cambian en DATOS.
- ✅ **📸 Postales** — FOTO en DATOS: PNG enmarcado con nombre y fecha, por
  la hoja de compartir del móvil (o descarga).
- ✅ **✏️ Nombres propios** — teclado pixel en DATOS (toca su nombre); el
  nombre viaja por HUD, combate, toasts, diario, dinastía y postales.
- **📊 Página de estadísticas de vida** — pasos del prado, motas históricas,
  comidas favoritas, tiempo jugado.
- ✅ **🔊 Volumen en el altavoz** — alto → bajo → silencio, de un toque ·
  pendiente: música y efectos por separado.

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
- ✅ **Teclado de escritorio** — 1-6 abren la botonera, M cambia el volumen,
  Escape cierra paneles · pendiente: gamepad.
