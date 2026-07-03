#!/bin/bash
# Estampa una versión nueva en index.html, src/config.js y version.json.
# Los ?v= nuevos invalidan la caché del navegador; version.json avisa
# a las partidas abiertas de que hay actualización.
set -e
cd "$(dirname "$0")/.."
V=$(date +%Y%m%d-%H%M)
sed -i '' -E "s/\?v=[0-9-]+/?v=$V/g" index.html
sed -i '' -E "s/const GAME_VERSION = '[^']*'/const GAME_VERSION = '$V'/" src/config.js
printf '{"v":"%s"}\n' "$V" > version.json
echo "📦 versión $V estampada"
