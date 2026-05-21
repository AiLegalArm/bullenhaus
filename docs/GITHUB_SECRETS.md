# GitHub Secrets — Setup Guide

Configure these secrets in **GitHub → Settings → Secrets and variables → Actions**
for the `ailegal/bullenhaus` repository.

---

## Repository Secrets (shared across all environments)

| Secret | Description | Example |
|---|---|---|
| `VERCEL_TOKEN` | Vercel API token (from vercel.com/account/tokens) | `xxxxxxxxxxxxxx` |
| `VERCEL_ORG_ID` | Vercel team/org ID | `team_xxxxxxxxx` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `prj_xxxxxxxxxx` |
| `RAILWAY_TOKEN` | Railway API token | `xxxxxxxxxxxxxx` |
| `RAILWAY_PROJECT_ID` | Railway project ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |

---

## Environment: `staging`

Create environment at: **Settings → Environments → New environment → staging**

| Secret | Description |
|---|---|
| `STAGING_DATABASE_URL` | Pooled connection (port 6543) for Prisma runtime |
| `STAGING_DIRECT_URL` | Direct connection (port 5432) for migrations |
| `STAGING_SUPABASE_URL` | Staging Supabase project URL |
| `STAGING_SUPABASE_ANON_KEY` | Staging Supabase anon key |
| `STAGING_API_URL` | Backend API URL, e.g. `https://api-staging.bullenhaus.ailegal.dev` |
| `STAGING_APP_URL` | Frontend URL, e.g. `https://staging.bullenhaus.ailegal.dev` |

---

## Environment: `production`

Create environment at: **Settings → Environments → New environment → production**

⚠️ Enable **Required reviewers** — add at least 1 approver before any production deploy runs.

| Secret | Description |
|---|---|
| `PROD_DATABASE_URL` | Pooled connection (port 6543) for Prisma runtime |
| `PROD_DIRECT_URL` | Direct connection (port 5432) for migrations |
| `PROD_SUPABASE_URL` | Production Supabase project URL |
| `PROD_SUPABASE_ANON_KEY` | Production Supabase anon key |
| `PROD_API_URL` | Backend API URL, e.g. `https://api.bullenhaus.ailegal.dev` |
| `PROD_APP_URL` | Frontend URL, e.g. `https://bullenhaus.ailegal.dev` |

---

## Branch Protection Rules (Settings → Branches)

### `main` branch
- ✅ Require a pull request before merging
- ✅ Require 1 approving review
- ✅ Require status checks to pass: `TypeScript & Lint`, `Unit Tests`, `Build`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

### `develop` branch
- ✅ Require status checks to pass: `TypeScript & Lint`, `Unit Tests`
- ✅ Allow direct pushes (for deploy triggers)

---

## Deploy Flow Summary

```
feature/* ──PR──► develop ──auto──► [staging deploy]
develop   ──PR──► main    ──tag──► [production deploy]

Tag format: v1.2.3
Command:    make git-tag VERSION=1.2.3
         or: git tag -a v1.2.3 -m "Release v1.2.3" && git push origin v1.2.3
```

---

## Supabase Connection Strings

Find these in Supabase Dashboard → Project Settings → Database:

```
# Pooler (for Prisma runtime — Transaction mode)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Direct (for migrations — Session mode)
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

Replace `[ref]` with your project ref and `[password]` with your DB password.
