.PHONY: help dev build start lint install

PORT_START ?= 3000
PORT_END ?= 3010

help: ## 使えるコマンドを表示
	@awk 'BEGIN {FS = ":.*##"}; /^[a-zA-Z_-]+:.*##/ {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## 開発サーバーを必ず利用可能な状態で起動
	@project_dir="$(CURDIR)"; lock_file=".next/dev/lock"; \
	stop_stale_server() { \
		stale_pid="$$1"; \
		process_dir=$$(lsof -a -p "$$stale_pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'); \
		process_command=$$(ps -p "$$stale_pid" -o command= 2>/dev/null); \
		if [ "$$process_dir" = "$$project_dir" ] && echo "$$process_command" | grep -q "next-server"; then \
			echo "応答しない開発サーバー（PID $$stale_pid）を終了します"; \
			kill "$$stale_pid" 2>/dev/null || true; \
			for attempt in 1 2 3 4 5; do kill -0 "$$stale_pid" 2>/dev/null || break; sleep 1; done; \
			if kill -0 "$$stale_pid" 2>/dev/null; then kill -9 "$$stale_pid" 2>/dev/null || true; fi; \
		fi; \
	}; \
	if [ -f "$$lock_file" ]; then \
		lock_pid=$$(sed -n 's/.*"pid":\([0-9][0-9]*\).*/\1/p' "$$lock_file"); \
		lock_port=$$(sed -n 's/.*"port":\([0-9][0-9]*\).*/\1/p' "$$lock_file"); \
		if [ -n "$$lock_pid" ] && kill -0 "$$lock_pid" 2>/dev/null && ! curl --silent --fail --max-time 3 "http://localhost:$${lock_port:-3000}/" >/dev/null; then \
			stop_stale_server "$$lock_pid"; \
		fi; \
		if [ ! -n "$$lock_pid" ] || ! kill -0 "$$lock_pid" 2>/dev/null; then rm -f "$$lock_file"; fi; \
	fi; \
	for port in $$(seq $(PORT_START) $(PORT_END)); do \
		pid=$$(lsof -tiTCP:$$port -sTCP:LISTEN 2>/dev/null | head -n 1); \
		if [ -z "$$pid" ]; then \
			echo "開発サーバーを http://localhost:$$port で起動します"; \
			npm run dev -- --port $$port; \
			exit $$?; \
		fi; \
		process_dir=$$(lsof -a -p "$$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'); \
		if [ "$$process_dir" = "$$project_dir" ]; then \
			if curl --silent --fail --max-time 3 "http://localhost:$$port/" >/dev/null; then \
				echo "このプロジェクトの開発サーバーは http://localhost:$$port で利用できます。"; \
				exit 0; \
			fi; \
			stop_stale_server "$$pid"; \
			rm -f "$$lock_file"; \
			continue; \
		fi; \
	done; \
	echo "ポート $(PORT_START)-$(PORT_END) はすべて使用中です。"; \
	exit 1

build: ## 本番用にビルド
	npm run build

start: ## 本番ビルドを起動（事前に make build が必要）
	npm run start

lint: ## コードを検査
	npm run lint

install: ## 依存パッケージを復元
	npm ci
