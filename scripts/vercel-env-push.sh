#!/usr/bin/env bash
# =============================================================================
# vercel-env-push.sh — Push all environment variables to Vercel
# =============================================================================
#
# Reads variables from .env and pushes them to the correct Vercel environments.
# Run ONCE after creating the Vercel project.
#
# Prerequisites:
#   npm install -g vercel
#   vercel login
#   vercel link   (link this folder to your Vercel project)
#
# Usage:
#   chmod +x scripts/vercel-env-push.sh
#   ./scripts/vercel-env-push.sh
#
# Vercel org:     ailegal-armenia
# Team ID:        team_LmTGcomh4kwypxssUbMCe0Ha
# =============================================================================

set -euo pipefail

# ── Load .env if present ──────────────────────────────────────────────────────
if [ -f ".env" ]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    value="${value%\"}"
    value="${value#\"}"
    export "$key=$value"
  done < <(grep -v '^#' .env | grep -v '^$')
fi

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${BLUE}[vercel-env]${NC} $*"; }
ok()    { echo -e "${GREEN}[vercel-env]${NC} ✅ $*"; }
warn()  { echo -e "${YELLOW}[vercel-env]${NC} ⚠️  $*"; }
error() { echo -e "${RED}[vercel-env]${NC} ❌ $*"; exit 1; }

# ── Check prerequisites ────────────────────────────────────────────────────────
command -v vercel >/dev/null 2>&1 || error "Vercel CLI not found. Run: npm i -g vercel"

if [ ! -f ".env" ]; then
  error ".env file not found. Run from the Bullenhaus project root."
fi

# ── Auth: use token from .env if available ────────────────────────────────────
VERCEL_ARGS=""
if [ -n "${VERCEL_TOKEN:-}" ]; then
  export VERCEL_TOKEN
  info "Using VERCEL_TOKEN from .env for authentication."
else
  info "VERCEL_TOKEN not set — using vercel CLI session login."
  vercel whoami >/dev/null 2>&1 || error "Not logged in to Vercel. Run: vercel login  or add VERCEL_TOKEN to .env"
fi

if [ -n "${VERCEL_ORG_ID:-}" ]; then
  export VERCEL_ORG_ID
fi

info "Bullenhaus — Vercel Environment Variable Push"
info "Org: ailegal-armenia  (team_LmTGcomh4kwypxssUbMCe0Ha)"
echo ""

# ── Helper: push one variable ─────────────────────────────────────────────────
# push_env VAR_NAME "production" | "preview" | "development"
push_env() {
  local var_name="$1"
  local env_target="$2"   # production | preview | development
  local value="${!var_name:-}"

  # Never push local-only deployment credentials to Vercel env
  case "$var_name" in
    VERCEL_TOKEN|VERCEL_ORG_ID|VERCEL_PROJECT_ID|GITHUB_TOKEN|GITHUB_USER|GITHUB_REPO)
      warn "SKIPPED ${var_name} (${env_target}) — local-only credential, not pushed to Vercel"
      return ;;
  esac

  if [ -z "$value" ] || [ "$value" = "PASTE_FROM_SUPABASE_DASHBOARD" ] || [ "$value" = "CHOOSE_STRONG_PASSWORD_16_CHARS_MIN" ]; then
    warn "SKIPPED ${var_name} (${env_target}) — value is empty or placeholder"
    return
  fi

  echo "$value" | vercel env add "$var_name" "$env_target" --force --yes 2>/dev/null \
    && echo "  ✅ ${var_name} → ${env_target}" \
    || echo "  ⚠️  ${var_name} → ${env_target} (may already exist)"
}

# ── Variables pushed to ALL environments ──────────────────────────────────────
info "Pushing shared variables (all environments)..."

for ENV_TARGET in production preview development; do
  push_env "NODE_ENV"              "$ENV_TARGET"
  push_env "SUPABASE_URL"          "$ENV_TARGET"
  push_env "VITE_SUPABASE_URL"     "$ENV_TARGET"
  push_env "VITE_SUPABASE_ANON_KEY" "$ENV_TARGET"
done

echo ""

# ── Production variables ───────────────────────────────────────────────────────
info "Pushing PRODUCTION variables..."

push_env "DATABASE_URL"            "production"
push_env "DIRECT_URL"              "production"
push_env "JWT_ACCESS_SECRET"       "production"
push_env "JWT_REFRESH_SECRET"      "production"
push_env "JWT_ACCESS_EXPIRES_IN"   "production"
push_env "JWT_REFRESH_EXPIRES_IN"  "production"
push_env "SUPABASE_ANON_KEY"       "production"
push_env "SUPABASE_SERVICE_ROLE_KEY" "production"
push_env "WORKER_API_KEY"          "production"
push_env "SYNC_WEBHOOK_SECRET"     "production"
push_env "APP_URL"                 "production"
push_env "ALLOWED_ORIGINS"         "production"
push_env "VITE_API_URL"            "production"
push_env "SUPER_ADMIN_EMAIL"       "production"
push_env "SUPER_ADMIN_PASSWORD"    "production"
push_env "SUPER_ADMIN_FIRST_NAME"  "production"
push_env "SUPER_ADMIN_LAST_NAME"   "production"

echo ""

# ── Preview (staging) variables ───────────────────────────────────────────────
info "Pushing PREVIEW (staging) variables..."

push_env "DATABASE_URL"            "preview"
push_env "DIRECT_URL"              "preview"
push_env "JWT_ACCESS_SECRET"       "preview"
push_env "JWT_REFRESH_SECRET"      "preview"
push_env "JWT_ACCESS_EXPIRES_IN"   "preview"
push_env "JWT_REFRESH_EXPIRES_IN"  "preview"
push_env "SUPABASE_ANON_KEY"       "preview"
push_env "SUPABASE_SERVICE_ROLE_KEY" "preview"
push_env "WORKER_API_KEY"          "preview"
push_env "SYNC_WEBHOOK_SECRET"     "preview"
push_env "VITE_API_URL"            "preview"

echo ""

# ── Development variables ─────────────────────────────────────────────────────
info "Pushing DEVELOPMENT variables..."

push_env "DATABASE_URL"            "development"
push_env "DIRECT_URL"              "development"
push_env "JWT_ACCESS_SECRET"       "development"
push_env "JWT_REFRESH_SECRET"      "development"
push_env "JWT_ACCESS_EXPIRES_IN"   "development"
push_env "JWT_REFRESH_EXPIRES_IN"  "development"
push_env "SUPABASE_ANON_KEY"       "development"
push_env "SUPABASE_SERVICE_ROLE_KEY" "development"
push_env "WORKER_API_KEY"          "development"
push_env "SYNC_WEBHOOK_SECRET"     "development"
push_env "VITE_API_URL"            "development"

echo ""

# ── Gemini (optional) ─────────────────────────────────────────────────────────
if [ -n "${GEMINI_API_KEY:-}" ]; then
  info "Pushing GEMINI_API_KEY to all environments..."
  for ENV_TARGET in production preview development; do
    push_env "GEMINI_API_KEY" "$ENV_TARGET"
  done
fi

echo ""
echo "════════════════════════════════════════════════════════════"
ok "Vercel environment variables pushed!"
echo ""
echo "  ⚠️  SKIPPED variables need manual action:"
echo "     SUPABASE_ANON_KEY       → Supabase Dashboard → Project Settings → API"
echo "     SUPABASE_SERVICE_ROLE_KEY → Supabase Dashboard → Project Settings → API"
echo "     SUPER_ADMIN_PASSWORD    → set a strong password in .env first"
echo ""
echo "  After filling them in .env, re-run this script."
echo ""
echo "  Verify in Vercel:"
echo "    vercel env ls"
echo "════════════════════════════════════════════════════════════"
