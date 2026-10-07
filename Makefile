.PHONY: help dev build start lint install

help: ## 使えるコマンドを表示
	@awk 'BEGIN {FS = ":.*##"}; /^[a-zA-Z_-]+:.*##/ {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## 開発サーバーを起動（http://localhost:3000）
	npm run dev

build: ## 本番用にビルド
	npm run build

start: ## 本番ビルドを起動（事前に make build が必要）
	npm run start

lint: ## コードを検査
	npm run lint

install: ## 依存パッケージを復元
	npm ci
