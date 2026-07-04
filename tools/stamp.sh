#!/bin/bash
# Estampa una versión nueva en index.html, src/config.js y version.json.
# Los ?v= nuevos invalidan la caché del navegador; version.json avisa
# a las partidas abiertas de que hay actualización.
set -e
cd "$(dirname "$0")/.."
V=$(date +%Y%m%d-%H%M)
sed -i '' -E "s/\?v=[0-9-]+/?v=$V/g" index.html
sed -i '' -E "s/const GAME_VERSION = '[^']*'/const GAME_VERSION = '$V'/" src/config.js
sed -i '' -E "s/bitxo-cache-[0-9-]+/bitxo-cache-$V/" sw.js
# NOTE opcional: una línea de novedades que el juego enseña al actualizar
NOTE="${NOTE:-}"
NOTE="${NOTE//\"/}"
if [ -n "$NOTE" ]; then
  printf '{"v":"%s","note":"%s"}\n' "$V" "$NOTE" > version.json
else
  printf '{"v":"%s"}\n' "$V" > version.json
fi
echo "📦 versión $V estampada${NOTE:+ · nota: $NOTE}"
