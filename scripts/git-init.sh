#!/usr/bin/env bash
# =============================================================================
# git-init.sh — Initialize Git repository and push to ailegal-armenia/bullenhaus
# =============================================================================
#
# Usage:
#   chmod +x scripts/git-init.sh
#   ./scripts/git-init.sh
#
# Reads GITHUB_TOKEN, GITHUB_USER, GITHUB_REPO from .env (or environment).
# After pushing, strips the token from the saved remote URL.
#
# =============================================================================

set -euo pipefail

# ── Load .env if present ──────────────────────────────────────────────────────
if [ -f ".env" ]; then
  # shellcheck disable=SC1091
  set -a
  # Export only non-comment, non-empty lines
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    # Strip surrounding quotes
    value="${value%\"}"
    value="${value#\"}"
    export "$key=$value"
  done < <(grep -v '^#' .env | grep -v '^$')
  set +a
fi

# ── Config ────────────────────────────────────────────────────────────────────
REPO_NAME="${GITHUB_REPO:-bullenhaus}"
ORG="${GITHUB_USER:-ailegal-armenia}"
TOKEN="${GITHUB_TOKEN:-}"
GIT_USER_NAME="${GIT_USER_NAME:-ailegal-armenia}"
GIT_USER_EMAIL="${GIT_USER_EMAIL:-AILegalArmenia@proton.me}"

if [ -z "$TOKEN" ]; then
  echo "❌ GITHUB_TOKEN is not set. Add it to .env or export it first."
  echo "   Example: export GITHUB_TOKEN=ghp_..."
  exit 1
fi

# HTTPS remote with token (stripped after push)
REMOTE_URL_WITH_TOKEN="https://${TOKEN}@github.com/${ORG}/${REPO_NAME}.git"
REMOTE_URL_CLEAN="https://github.com/${ORG}/${REPO_NAME}.git"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[git-init]${NC} $*"; }
success() { echo -e "${GREEN}[git-init]${NC} ✅ $*"; }
warn()    { echo -e "${YELLOW}[git-init]${NC} ⚠️  $*"; }
error()   { echo -e "${RED}[git-init]${NC} ❌ $*"; exit 1; }

# ── Safety checks ─────────────────────────────────────────────────────────────
info "Bullenhaus — Git Initialization"
echo "  Org:    ${ORG}"
echo "  Repo:   ${REPO_NAME}"
echo "  Remote: ${REMOTE_URL_CLEAN}"
echo ""

if [ ! -f "package.json" ]; then
  error "Run this script from the Bullenhaus project root (where package.json is)."
fi

# ── Check for .env (never commit) ─────────────────────────────────────────────
if [ -f ".env" ]; then
  warn ".env file found. It is in .gitignore and will NOT be committed."
fi

# ── Create GitHub repo via API ────────────────────────────────────────────────
info "Creating GitHub repository ${ORG}/${REPO_NAME} (private)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: token ${TOKEN}" \
  -H "Content-Type: application/json" \
  "https://api.github.com/user/repos" \
  -d "{
    \"name\": \"${REPO_NAME}\",
    \"description\": \"Bullenhaus — unified CRM + Trading platform (AI-powered)\",
    \"private\": true,
    \"auto_init\": false
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

if echo "$BODY" | grep -q '"id"'; then
  success "Repository created: https://github.com/${ORG}/${REPO_NAME}"
elif echo "$BODY" | grep -q '"already exists"'; then
  warn "Repository already exists — continuing."
elif [ "$HTTP_CODE" = "422" ] && echo "$BODY" | grep -q '"name"'; then
  # name already taken under the org — org repos use a different endpoint
  info "Trying org endpoint (user endpoint said name taken)..."
  RESPONSE2=$(curl -s -X POST \
    -H "Authorization: token ${TOKEN}" \
    -H "Content-Type: application/json" \
    "https://api.github.com/orgs/${ORG}/repos" \
    -d "{
      \"name\": \"${REPO_NAME}\",
      \"description\": \"Bullenhaus — unified CRM + Trading platform (AI-powered)\",
      \"private\": true
    }")
  if echo "$RESPONSE2" | grep -q '"id"'; then
    success "Repository created via org endpoint."
  elif echo "$RESPONSE2" | grep -q '"already exists"'; then
    warn "Repository already exists — continuing."
  else
    warn "Unexpected response (continuing anyway): $(echo "$RESPONSE2" | head -c 200)"
  fi
else
  warn "Unexpected response (HTTP ${HTTP_CODE}): $(echo "$BODY" | head -c 300)"
  warn "Continuing — repo may already exist or be created manually."
fi

# ── Initialize repo ───────────────────────────────────────────────────────────
if [ -d ".git" ]; then
  warn "Git repository already initialized — skipping git init."
else
  info "Initializing git repository..."
  git init -b main
  success "Repository initialized."
fi

# ── Set local user identity ───────────────────────────────────────────────────
info "Setting git identity for this repo..."
git config user.name  "${GIT_USER_NAME}"
git config user.email "${GIT_USER_EMAIL}"
success "Identity set: ${GIT_USER_NAME} <${GIT_USER_EMAIL}>"

# ── Add remote (with token for push) ─────────────────────────────────────────
if git remote get-url origin &>/dev/null; then
  CURRENT_REMOTE=$(git remote get-url origin)
  info "Updating remote 'origin' to use token-authenticated URL..."
  git remote set-url origin "${REMOTE_URL_WITH_TOKEN}"
else
  info "Adding remote 'origin' (with token)..."
  git remote add origin "${REMOTE_URL_WITH_TOKEN}"
fi

# ── Stage all files ───────────────────────────────────────────────────────────
info "Staging all files (respecting .gitignore)..."
git add .

STAGED_COUNT=$(git diff --cached --name-only | wc -l | tr -d ' ')
info "Staging ${STAGED_COUNT} files."

# Confirm before committing
echo ""
read -r -p "Proceed with initial commit and push? [y/N] " CONFIRM
if [[ ! "${CONFIRM}" =~ ^[Yy]$ ]]; then
  warn "Aborted by user. Files are staged — run 'git commit' manually."
  # Strip token from remote before exiting
  git remote set-url origin "${REMOTE_URL_CLEAN}"
  exit 0
fi

# ── Initial commit ────────────────────────────────────────────────────────────
# Check if there are already commits
if git rev-parse HEAD &>/dev/null 2>&1; then
  info "Commits already exist — skipping initial commit."
else
  info "Creating initial commit..."
  git commit -m "feat: initial Bullenhaus unified CRM+Trading platform

- Unified schema (Prisma + Supabase)
- RBAC with 7 system roles
- Domain isolation: CRM / TRADING / BOTH
- Row Level Security (PostgreSQL)
- JWT auth (HS256, in-memory token, HttpOnly refresh cookie)
- Worker job queue with retry + audit log
- GitHub Actions CI/CD (staging + production)
- Full documentation in docs/

Co-authored-by: ailegal-armenia <AILegalArmenia@proton.me>"
  success "Initial commit created."
fi

# ── Create develop branch ─────────────────────────────────────────────────────
if git show-ref --quiet refs/heads/develop; then
  info "Branch 'develop' already exists."
else
  info "Creating 'develop' branch..."
  git checkout -b develop
  git checkout main
  success "Branch 'develop' created."
fi

# ── Push to remote ────────────────────────────────────────────────────────────
info "Pushing 'main' to origin..."
git push -u origin main

info "Pushing 'develop' to origin..."
git push -u origin develop

# ── Strip token from saved remote URL ────────────────────────────────────────
info "Removing token from remote URL (security)..."
git remote set-url origin "${REMOTE_URL_CLEAN}"
success "Remote URL sanitized (token removed)."

echo ""
echo "════════════════════════════════════════════════════════════"
success "Repository initialized and pushed to GitHub!"
echo ""
echo "  GitHub:   https://github.com/${ORG}/${REPO_NAME}"
echo "  Branches: main (production), develop (staging)"
echo ""
echo "  Next steps:"
echo "    1. Go to GitHub → Settings → Environments"
echo "       Create: 'staging' and 'production' environments"
echo "    2. Add GitHub Secrets (see docs/GITHUB_SECRETS.md)"
echo "    3. Enable branch protection on 'main'"
echo "       → Require PR + CI pass before merge"
echo "    4. Run: ./scripts/vercel-env-push.sh"
echo "       → Pushes all env vars to Vercel"
echo "════════════════════════════════════════════════════════════"
