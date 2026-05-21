# Bullenhaus — Test Plan

## 1. Login Tests

### 1.1 Successful login — CRM user
- Input: valid CRM_AGENT email + password
- Expected: 200, `{ accessToken, user: { domain: 'CRM', systemRole: 'CRM_AGENT' } }`
- Verify: refresh token cookie is HttpOnly, SameSite=Strict

### 1.2 Successful login — Trading user
- Input: valid TRADER email + password
- Expected: 200, `{ accessToken, user: { domain: 'TRADING', systemRole: 'TRADER' } }`

### 1.3 Successful login — Super Admin
- Input: valid SUPER_ADMIN email + password
- Expected: 200, `{ accessToken, user: { domain: 'BOTH', systemRole: 'SUPER_ADMIN' } }`

### 1.4 Invalid password
- Input: valid email, wrong password
- Expected: 401, same error message as "user not found" (no user enumeration)

### 1.5 Non-existent email
- Input: unknown@email.com, any password
- Expected: 401, SAME error message as invalid password

### 1.6 Suspended account
- Input: suspended user credentials
- Expected: 403, "Account suspended"

### 1.7 Account lockout
- Input: valid email, wrong password × 5 attempts
- Expected: 6th attempt returns 429 / lockout message
- Wait 15 min (or adjust in test with mocked time)
- Expected: unlocked after lockout period

### 1.8 MFA required
- Input: MFA-enabled user valid credentials
- Expected: 200, `{ mfaRequired: true, mfaSessionToken: '...' }`
- Input: TOTP code via `/auth/verify-mfa`
- Expected: full login response with tokens

### 1.9 Rate limiting
- Fire 30+ login requests from same IP in < 60 seconds
- Expected: 429 Too Many Requests

---

## 2. Redirect by Role Tests

### 2.1 CRM_AGENT redirect
- Login as CRM_AGENT
- Expected: frontend redirects to `/crm/dashboard`

### 2.2 CRM_DIRECTOR redirect
- Login as CRM_DIRECTOR
- Expected: frontend redirects to `/crm/dashboard`

### 2.3 TRADER redirect
- Login as TRADER
- Expected: frontend redirects to `/trade/dashboard`

### 2.4 TRADING_OPERATOR redirect
- Login as TRADING_OPERATOR
- Expected: frontend redirects to `/trade/dashboard`

### 2.5 SUPER_ADMIN redirect
- Login as SUPER_ADMIN
- Expected: frontend redirects to `/admin/dashboard`

---

## 3. Route Guard Tests

### 3.1 CRM user cannot access Trading frontend route
- Login as CRM_AGENT
- Navigate to `/trade/dashboard` directly
- Expected: redirect to `/crm/dashboard` or 403

### 3.2 CRM user cannot access Admin frontend route
- Login as CRM_AGENT
- Navigate to `/admin/dashboard` directly
- Expected: redirect to `/crm/dashboard` or 403

### 3.3 Trading user cannot access CRM frontend route
- Login as TRADER
- Navigate to `/crm/dashboard` directly
- Expected: redirect to `/trade/dashboard` or 403

### 3.4 Super Admin can access all routes
- Login as SUPER_ADMIN
- Navigate to `/crm/dashboard` — expected: 200
- Navigate to `/trade/dashboard` — expected: 200
- Navigate to `/admin/dashboard` — expected: 200

### 3.5 Unauthenticated user redirected to login
- Clear cookies, navigate to `/crm/dashboard`
- Expected: redirect to `/auth/login`

---

## 4. API Authorization Tests

### 4.1 CRM user cannot call Trading API
```
GET /api/v1/trading/accounts
Authorization: Bearer <crm_agent_token>
Expected: 403 Forbidden
```

### 4.2 Trading user cannot call CRM API
```
GET /api/v1/crm/clients
Authorization: Bearer <trader_token>
Expected: 403 Forbidden
```

### 4.3 CRM_AGENT cannot call CRM admin endpoints
```
POST /api/v1/crm/users   (create user)
Authorization: Bearer <crm_agent_token>
Expected: 403 Forbidden
```

### 4.4 Super Admin can call all APIs
```
GET /api/v1/crm/clients
Authorization: Bearer <super_admin_token>
Expected: 200

GET /api/v1/trading/accounts
Authorization: Bearer <super_admin_token>
Expected: 200
```

### 4.5 Expired token rejected
```
GET /api/v1/crm/clients
Authorization: Bearer <expired_token>
Expected: 401 Token expired or invalid
```

### 4.6 Revoked token rejected (logout-all)
```
POST /api/v1/auth/logout-all  (revokes all sessions)
GET  /api/v1/crm/clients with old token
Expected: 401 Token has been revoked
```

### 4.7 Missing Authorization header
```
GET /api/v1/crm/clients
(no Authorization header)
Expected: 401 Unauthorized
```

---

## 5. RLS Tests

Run directly against Supabase database as specific roles.

### 5.1 CRM user cannot read TradingAccount
```sql
-- Set role to simulate CRM_AGENT JWT
SET request.jwt.claims = '{"systemRole":"CRM_AGENT","domain":"CRM"}';
SELECT * FROM "TradingAccount";
-- Expected: 0 rows (RLS denies)
```

### 5.2 Trading user cannot read Client
```sql
SET request.jwt.claims = '{"systemRole":"TRADER","domain":"TRADING"}';
SELECT * FROM "Client";
-- Expected: 0 rows (RLS denies)
```

### 5.3 CRM_AGENT sees only assigned clients
```sql
SET request.jwt.claims = '{"sub":"<agent_user_id>","systemRole":"CRM_AGENT","domain":"CRM"}';
SELECT id, "assignedAgentId" FROM "Client";
-- Expected: only rows where assignedAgentId = agent_user_id
```

### 5.4 SUPER_ADMIN sees all
```sql
SET request.jwt.claims = '{"sub":"<super_admin_id>","systemRole":"SUPER_ADMIN","domain":"BOTH"}';
SELECT COUNT(*) FROM "Client";
SELECT COUNT(*) FROM "TradingAccount";
-- Expected: full counts of all rows
```

### 5.5 AuditLog is immutable
```sql
SET role authenticated;
SET request.jwt.claims = '{"systemRole":"SUPER_ADMIN","domain":"BOTH"}';
DELETE FROM "AuditLog" WHERE id = '<any_id>';
-- Expected: ERROR - no DELETE policy exists
UPDATE "AuditLog" SET action = 'CREATE' WHERE id = '<any_id>';
-- Expected: ERROR - no UPDATE policy exists
```

### 5.6 Service role bypasses RLS
```sql
SET role service_role;
SELECT COUNT(*) FROM "Client";
SELECT COUNT(*) FROM "TradingAccount";
-- Expected: full access (service_role bypasses RLS)
```

---

## 6. Worker Tests

### 6.1 Worker health check
```
GET /api/v1/internal/health
X-API-Key: <worker_api_key>
Expected: 200 { status: 'ok' }
```

### 6.2 Worker authenticates with API key
```
POST /api/v1/internal/sync-event
X-API-Key: <worker_api_key>
Body: { eventType: 'registerClient', payload: {...}, idempotencyKey: 'test-123' }
Expected: 200
```

### 6.3 Worker rejects missing API key
```
POST /api/v1/internal/sync-event
(no X-API-Key)
Expected: 401
```

### 6.4 Idempotency — same event processed once
```
POST /api/v1/internal/sync-event
Body: { idempotencyKey: 'dedup-test-456', ... }
POST again with same idempotencyKey
Expected: second call returns 200 with { duplicate: true }, no DB write
```

### 6.5 Worker logs to AuditLog
- Process a sync event
- Query AuditLog for entityType = 'sync_event'
- Expected: entry exists with correct eventId and status

### 6.6 Worker retry on failure
- Simulate temporary DB failure (mock)
- Expected: worker retries up to MAX_RETRIES times
- After max retries: job marked as FAILED with error message

---

## 7. Migration Tests

### 7.1 CRM users migrated with correct roles
```sql
SELECT "systemRole", COUNT(*) FROM "User"
WHERE domain = 'CRM'
GROUP BY "systemRole";
-- Expected counts match original CRM seed data
```

### 7.2 Trading users migrated with correct roles
```sql
SELECT "systemRole", COUNT(*) FROM "User"
WHERE domain = 'TRADING'
GROUP BY "systemRole";
-- Expected: TRADER count matches Trade-V2 user count
```

### 7.3 No email collisions
```sql
SELECT email, COUNT(*) FROM "User"
GROUP BY email
HAVING COUNT(*) > 1;
-- Expected: 0 rows
```

### 7.4 All CRM users can still log in after migration
- Test each CRM role (admin, director, manager, agent) with existing credentials
- Expected: successful login, correct domain redirect

### 7.5 Prisma migrations idempotent
- Run `npx prisma migrate deploy` twice
- Expected: no errors, "Database schema is up to date"

---

## 8. Smoke Tests (Production)

Run immediately after every production deploy:

```bash
# Script: scripts/smoke-test.sh
BASE_URL="${1:-https://api.bullenhaus.com}"

echo "1. Health check..."
curl -f "$BASE_URL/health" || exit 1

echo "2. Login endpoint responds..."
curl -f -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrong"}' \
  -o /dev/null -w "%{http_code}" | grep -q "401" || exit 1

echo "3. Protected route requires auth..."
curl -f "$BASE_URL/api/v1/crm/clients" \
  -o /dev/null -w "%{http_code}" | grep -q "401" || exit 1

echo "4. Worker health..."
curl -f "$BASE_URL/api/v1/internal/health" \
  -H "X-API-Key: $WORKER_API_KEY" || exit 1

echo "All smoke tests passed."
```

---

## Test Data Accounts (Staging Only — NOT Production)

| Role | Email | Purpose |
|---|---|---|
| SUPER_ADMIN | superadmin@staging.bullenhaus.com | Full access testing |
| CRM_ADMIN | crm.admin@staging.bullenhaus.com | CRM admin testing |
| CRM_AGENT | crm.agent@staging.bullenhaus.com | CRM agent testing |
| TRADING_OPERATOR | trading.op@staging.bullenhaus.com | Trading admin testing |
| TRADER | trader@staging.bullenhaus.com | Trader testing |

Passwords stored only in staging `.env` — never in code or docs.
