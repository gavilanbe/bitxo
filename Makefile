# 🥚 BITXO — mascota virtual + idle incremental
# Servidor local estático. Sin dependencias, no hace falta instalar nada.

PORT ?= 4321
URL  := http://localhost:$(PORT)/

.DEFAULT_GOAL := run

.PHONY: run stop help

run: stop ## Levanta el juego y lo abre en el navegador (Ctrl+C para parar)
	@echo "🥚  Sirviendo en $(URL)  —  Ctrl+C para parar"
	@( sleep 1 && open "$(URL)" ) &
	@python3 -m http.server $(PORT)

stop: ## Mata cualquier servidor que haya quedado vivo en el puerto
	@lsof -ti tcp:$(PORT) | xargs kill 2>/dev/null && echo "🧹  Puerto $(PORT) liberado" || true

help: ## Muestra esta ayuda
	@grep -E '^[a-z]+:.*## ' $(MAKEFILE_LIST) | sed 's/:.*## /\t→ /' | column -t -s $$'\t'
