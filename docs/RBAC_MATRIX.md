# Bullenhaus — RBAC Matrix

## 1. Role Matrix

| Role | Domain | Description |
|---|---|---|
| `SUPER_ADMIN` | BOTH | Full access to CRM + Trading. Manages both platforms. |
| `CRM_ADMIN` | CRM | Full CRM management: users, roles, all data, delete |
| `CRM_DIRECTOR` | CRM | Operational lead: sees all, creates/edits, approves financial requests |
| `CRM_MANAGER` | CRM | Team management: sees team clients/leads, assigns tasks |
| `CRM_AGENT` | CRM | Assigned clients/leads only |
| `TRADING_OPERATOR` | TRADING | Platform management: KYC, deposits, withdrawals, market control |
| `TRADER` | TRADING | Own trading account only |
| `worker_service` | — | Server-to-server via `X-API-Key` header (not a JWT role) |

---

## 2. CRM Permission Matrix

| Permission | SUPER_ADMIN | CRM_ADMIN | CRM_DIRECTOR | CRM_MANAGER | CRM_AGENT |
|---|:---:|:---:|:---:|:---:|:---:|
| **Clients** | | | | | |
| View all clients | ✅ | ✅ | ✅ | ❌ | ❌ |
| View team clients | ✅ | ✅ | ✅ | ✅ | ❌ |
| View assigned clients | ✅ | ✅ | ✅ | ✅ | ✅ |
| View PII (email, phone) | ✅ | ✅ | ✅ | ✅ | ✅* |
| Create client | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit client | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete client (soft) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export clients | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Leads** | | | | | |
| View all leads | ✅ | ✅ | ✅ | ❌ | ❌ |
| View team leads | ✅ | ✅ | ✅ | ✅ | ❌ |
| View assigned leads | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create lead | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit lead | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assign lead to agent | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete lead (soft) | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Calls** | | | | | |
| View all call logs | ✅ | ✅ | ✅ | ❌ | ❌ |
| View team call logs | ✅ | ✅ | ✅ | ✅ | ❌ |
| Make call / log call | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Reports** | | | | | |
| View reports | ✅ | ✅ | ✅ | ✅ | ❌ |
| Export reports | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Approvals** | | | | | |
| Submit approval request | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve/reject requests | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Users / Roles** | | | | | |
| Create CRM users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit CRM users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign roles | ✅ | ✅ | ❌ | ❌ | ❌ |
| Suspend/delete users | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Teams** | | | | | |
| Create/manage teams | ✅ | ✅ | ✅ | ❌ | ❌ |
| Add members to own team | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Advertisers** | | | | | |
| View advertisers | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage advertisers | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Audit Log** | | | | | |
| View audit log | ✅ | ✅ | ✅ | ❌ | ❌ |
| **AI Insights** | | | | | |
| View AI insights | ✅ | ✅ | ✅ | ✅ | ✅ |

*PII for CRM_AGENT is limited to their assigned clients only.

---

## 3. Trading Permission Matrix

| Permission | SUPER_ADMIN | TRADING_OPERATOR | TRADER |
|---|:---:|:---:|:---:|
| **Own Account** | | | |
| View own balance/positions | ✅ | ✅ | ✅ |
| Place orders | ✅ | ❌ | ✅ |
| View own transactions | ✅ | ✅ | ✅ |
| Request deposit | ✅ | ❌ | ✅ |
| Request withdrawal | ✅ | ❌ | ✅ |
| Submit KYC documents | ✅ | ❌ | ✅ |
| **Platform Management** | | | |
| View ALL user accounts | ✅ | ✅ | ❌ |
| Approve/reject deposits | ✅ | ✅ | ❌ |
| Approve/reject withdrawals | ✅ | ✅ | ❌ |
| KYC review | ✅ | ✅ | ❌ |
| Market control | ✅ | ✅ | ❌ |
| Set spreads/leverage | ✅ | ✅ | ❌ |
| View trading audit log | ✅ | ✅ | ❌ |
| **CRM Data** | | | |
| View CRM clients | ❌ | ❌ | ❌ |
| View CRM leads | ❌ | ❌ | ❌ |

---

## 4. Route Access Matrix

### Frontend Routes

| Route Pattern | SUPER_ADMIN | CRM_* | TRADING_OPERATOR | TRADER |
|---|:---:|:---:|:---:|:---:|
| `/auth/login` | ✅ | ✅ | ✅ | ✅ |
| `/crm/*` | ✅ | ✅ | ❌ | ❌ |
| `/trade/*` | ✅ | ❌ | ✅ | ✅ |
| `/admin/*` | ✅ | ❌ | ❌ | ❌ |

### Backend API Routes

| API Route Pattern | SUPER_ADMIN | CRM_ADMIN | CRM_DIRECTOR | CRM_MANAGER | CRM_AGENT | TRADING_OPERATOR | TRADER |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `POST /api/v1/auth/login` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/v1/crm/clients` | ✅ | ✅ | ✅ | ✅* | ✅* | ❌ | ❌ |
| `GET /api/v1/crm/leads` | ✅ | ✅ | ✅ | ✅* | ✅* | ❌ | ❌ |
| `POST /api/v1/crm/users` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/v1/crm/reports` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `GET /api/v1/trading/accounts` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅* |
| `GET /api/v1/trading/positions` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅* |
| `POST /api/v1/trading/orders` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅* |
| `GET /api/v1/admin/*` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/v1/admin/users` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

*Scoped: managers see team data, agents see own data, traders see own account

---

## 5. Database Access Matrix (RLS)

### Table: `User`

| Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| SUPER_ADMIN | All rows | ✅ | All rows | ✅ |
| CRM_ADMIN | CRM users | ✅ | CRM users | Soft only |
| CRM_DIRECTOR | CRM users | ❌ | Own profile | ❌ |
| CRM_MANAGER | Team users | ❌ | Own profile | ❌ |
| CRM_AGENT | Own row | ❌ | Own profile | ❌ |
| TRADING_OPERATOR | Trading users | ❌ | Own profile | ❌ |
| TRADER | Own row | ❌ | Own profile | ❌ |
| worker_service | All | ✅ | All | ✅ |

### Table: `Client` (CRM domain)

| Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| SUPER_ADMIN | All | ✅ | All | Soft only |
| CRM_ADMIN | All | ✅ | All | Soft only |
| CRM_DIRECTOR | All | ✅ | All | ❌ |
| CRM_MANAGER | Team's clients | ✅ | Team's clients | ❌ |
| CRM_AGENT | Assigned | ✅ | Assigned | ❌ |
| TRADING_* / TRADER | ❌ | ❌ | ❌ | ❌ |
| worker_service | All | ✅ | All | ❌ |

### Table: `TradingAccount` (Trading domain)

| Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| SUPER_ADMIN | All | ✅ | All | ✅ |
| TRADING_OPERATOR | All | ✅ | All | ❌ |
| TRADER | Own | ❌ | Own (limited) | ❌ |
| CRM_* | ❌ | ❌ | ❌ | ❌ |
| worker_service | All | ✅ | All | ❌ |

### Table: `AuditLog`

| Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| SUPER_ADMIN | All | ❌ | ❌ | ❌ |
| CRM_ADMIN / CRM_DIRECTOR | CRM events | ❌ | ❌ | ❌ |
| TRADING_OPERATOR | Trading events | ❌ | ❌ | ❌ |
| Others | ❌ | ❌ | ❌ | ❌ |
| worker_service | All | ✅ | ❌ | ❌ |

Audit logs are **immutable** — no UPDATE or DELETE for any role.

---

## 6. API Access Helper (Permission Strings)

```typescript
// Permission action strings used in backend guards
const PERMISSIONS = {
  // CRM
  CRM_CLIENTS_VIEW_ALL:     'crm.clients.view_all',
  CRM_CLIENTS_VIEW_TEAM:    'crm.clients.view_team',
  CRM_CLIENTS_VIEW_ASSIGNED:'crm.clients.view_assigned',
  CRM_CLIENTS_CREATE:       'crm.clients.create',
  CRM_CLIENTS_EDIT:         'crm.clients.edit',
  CRM_CLIENTS_DELETE:       'crm.clients.delete',
  CRM_CLIENTS_VIEW_PII:     'crm.clients.view_pii',
  CRM_CLIENTS_EXPORT:       'crm.clients.export',
  CRM_LEADS_VIEW_ALL:       'crm.leads.view_all',
  CRM_LEADS_CREATE:         'crm.leads.create',
  CRM_LEADS_ASSIGN:         'crm.leads.assign',
  CRM_CALLS_LOG:            'crm.calls.log',
  CRM_REPORTS_VIEW:         'crm.reports.view',
  CRM_APPROVALS_SUBMIT:     'crm.approvals.submit',
  CRM_APPROVALS_APPROVE:    'crm.approvals.approve',
  CRM_USERS_MANAGE:         'crm.users.manage',
  CRM_TEAMS_MANAGE:         'crm.teams.manage',
  CRM_AUDIT_VIEW:           'crm.audit.view',

  // Trading
  TRADING_ACCOUNT_VIEW_OWN:   'trading.account.view_own',
  TRADING_ACCOUNT_VIEW_ALL:   'trading.account.view_all',
  TRADING_ORDERS_PLACE:       'trading.orders.place',
  TRADING_DEPOSITS_MANAGE:    'trading.deposits.manage',
  TRADING_WITHDRAWALS_MANAGE: 'trading.withdrawals.manage',
  TRADING_KYC_REVIEW:         'trading.kyc.review',
  TRADING_MARKET_CONTROL:     'trading.market.control',

  // Admin
  ADMIN_FULL_ACCESS: 'admin.full_access',
} as const;
```

---

## 7. worker_service Access

The worker service is **not a JWT role**. It authenticates via `X-API-Key` header (HMAC signed or static secret stored in env).

```
Allowed endpoints (worker only):
  POST /api/v1/internal/sync-event        — process sync event
  POST /api/v1/internal/job-complete      — mark job complete
  GET  /api/v1/internal/pending-jobs      — fetch pending jobs

Not allowed:
  Any /api/v1/crm/* or /api/v1/trading/* user-facing endpoints
```

In the database, the worker uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS entirely. This key must **never** be present in any frontend bundle or client-side code.
