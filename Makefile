.PHONY: help dev build start lint install

PORT_START ?= 3000
PORT_END ?= 3010

help: ## 使えるコマンドを表示
	@awk 'BEGIN {FS = ":.*##"}; /^[a-zA-Z_-]+:.*##/ {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## 空いているポートで開発サーバーを起動
	@project_dir="$(CURDIR)"; \
	for port in $$(seq $(PORT_START) $(PORT_END)); do \
		pid=$$(lsof -tiTCP:$$port -sTCP:LISTEN 2>/dev/null | head -n 1); \
		if [ -z "$$pid" ]; then \
			echo "開発サーバーを http://localhost:$$port で起動します"; \
			npm run dev -- --port $$port; \
			exit $$?; \
		fi; \
		process_dir=$$(lsof -a -p $$pid -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'); \
		if [ "$$process_dir" = "$$project_dir" ]; then \
			echo "このプロジェクトの開発サーバーは既に http://localhost:$$port で起動しています。"; \
			exit 0; \
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
