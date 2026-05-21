# =============================================================================
# Bullenhaus — Makefile
# =============================================================================
# Common development, database, and deployment commands.
#
# Usage:
#   make <target>
#   make help
# =============================================================================

.DEFAULT_GOAL := help
.PHONY: help install dev build lint test test-integration test-smoke \
        db-generate db-migrate db-migrate-dev db-seed db-seed-crm \
        db-verify db-studio admin-create worker \
        rls-apply rls-staging rls-prod \
        git-init git-tag deploy-staging deploy-prod \
        docker-up docker-down clean

# ── Config ────────────────────────────────────────────────────────────────────
ORG         := ailegal
REPO        := bullenhaus
REMOTE      := git@github.com:$(ORG)/$(REPO).git

# Read version from package.json
VERSION     := $(shell node -p "require('./package.json').version" 2>/dev/null || echo "0.0.0")

# ── Colors ────────────────────────────────────────────────────────────────────
BOLD  := \033[1m
GREEN := \033[32m
BLUE  := \033[34m
RESET := \033[0m

# =============================================================================
# Help
# =============================================================================

help: ## Show this help message
	@echo ""
	@echo "$(BOLD)Bullenhaus — Available Commands$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { \
		printf "  $(BLUE)%-22s$(RESET) %s\n", $$1, $$2 \
	}' $(MAKEFILE_LIST)
	@echo ""
	@echo "  Version: $(VERSION)"
	@echo "  Remote:  $(REMOTE)"
	@echo ""

# =============================================================================
# Setup
# =============================================================================

install: ## Install dependencies and generate Prisma client
	npm ci
	npx prisma generate
	@echo "$(GREEN)✅ Dependencies installed$(RESET)"

# =============================================================================
# Development
# =============================================================================

dev: ## Start development servers (frontend + backend)
	npm run dev

dev-server: ## Start backend only
	npm run dev:server

dev-client: ## Start frontend only
	npm run dev:client

worker: ## Start the background worker
	npm run worker:start

# =============================================================================
# Build
# =============================================================================

build: ## Production build
	npm run build

build-server: ## Build server only
	npm run build:server

# =============================================================================
# Code Quality
# =============================================================================

lint: ## TypeScript check + ESLint
	npm run lint

# =============================================================================
# Tests
# =============================================================================

test: ## Run unit tests
	npm test

test-watch: ## Run unit tests in watch mode
	npm run test:watch

test-integration: ## Run integration tests (requires Postgres)
	npm run test:integration

test-smoke: ## Run smoke tests against running server
	npm run test:smoke

# =============================================================================
# Database
# =============================================================================

db-generate: ## Generate Prisma client
	npm run db:generate

db-migrate: ## Apply all pending migrations (production-safe)
	npm run db:migrate

db-migrate-dev: ## Create a new migration (development only)
	npm run db:migrate:dev

db-seed: ## Seed roles and permissions
	npm run db:seed

db-seed-crm: ## Seed CRM staff accounts (STAGING ONLY)
	@if [ "$$NODE_ENV" = "production" ]; then \
		echo "❌ Cannot run CRM staff seed in production"; \
		exit 1; \
	fi
	npm run db:seed:crm

db-verify: ## Verify migration state
	npm run db:verify

db-studio: ## Open Prisma Studio
	npm run db:studio

admin-create: ## Create Super Admin user (reads from .env)
	npm run admin:create

# =============================================================================
# RLS
# =============================================================================

rls-apply: ## Apply RLS policies to local/dev database
	@echo "$(BLUE)Applying RLS policies...$(RESET)"
	npm run rls:apply

rls-staging: ## Apply RLS to staging database
	@echo "$(BLUE)Applying RLS to staging...$(RESET)"
	psql $$STAGING_DIRECT_URL -f supabase/migrations/003_rls_domain_isolation.sql

rls-prod: ## Apply RLS to production database (CAUTION)
	@echo "⚠️  Applying RLS to PRODUCTION database..."
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ]
	psql $$PROD_DIRECT_URL -f supabase/migrations/003_rls_domain_isolation.sql

# =============================================================================
# Git
# =============================================================================

git-init: ## Initialize git repo and push to ailegal/bullenhaus
	@chmod +x scripts/git-init.sh
	@./scripts/git-init.sh

git-tag: ## Create and push a release tag (e.g. make git-tag VERSION=1.2.3)
	@if [ -z "$(VERSION)" ]; then echo "Usage: make git-tag VERSION=x.y.z"; exit 1; fi
	@echo "Creating tag v$(VERSION)..."
	git tag -a "v$(VERSION)" -m "Release v$(VERSION)"
	git push origin "v$(VERSION)"
	@echo "$(GREEN)✅ Tag v$(VERSION) pushed — production deploy triggered$(RESET)"

git-status: ## Show git status and current branch
	@git status --short
	@echo ""
	@git log --oneline -5

# =============================================================================
# Deployment
# =============================================================================

deploy-staging: ## Trigger staging deploy (pushes develop branch)
	@echo "$(BLUE)Triggering staging deploy...$(RESET)"
	git push origin develop
	@echo "$(GREEN)✅ Pushed to develop — GitHub Actions will deploy to staging$(RESET)"

deploy-prod: ## Trigger production deploy (creates release tag)
	@echo "⚠️  This will deploy to PRODUCTION."
	@read -p "Enter version (current: $(VERSION)): " v && \
		$(MAKE) git-tag VERSION=$$v

# =============================================================================
# Docker (local dev with full stack)
# =============================================================================

docker-up: ## Start local Docker stack (Postgres + Redis)
	docker compose up -d
	@echo "$(GREEN)✅ Stack running — Postgres: 5432, Redis: 6379$(RESET)"

docker-down: ## Stop local Docker stack
	docker compose down

docker-reset: ## Reset local Docker volumes (wipes all local DB data)
	@echo "⚠️  This will DELETE all local database data."
	@read -p "Confirm? [y/N] " c && [ "$$c" = "y" ]
	docker compose down -v
	docker compose up -d

# =============================================================================
# Cleanup
# =============================================================================

clean: ## Remove build artifacts and node_modules
	rm -rf dist/ node_modules/ .prisma/
	@echo "$(GREEN)✅ Cleaned$(RESET)"
