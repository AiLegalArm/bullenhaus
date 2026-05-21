/**
 * permissions.ts — All permission strings as typed constants
 *
 * These strings are stored in the Permission table and checked by
 * requirePermissions() middleware. Keep in sync with prisma/seed-unified-roles.ts.
 */

// -------------------------------------------------------
// CRM Permissions
// -------------------------------------------------------

export const CRM_PERMISSIONS = {
  // Clients
  CLIENTS_VIEW_ALL:      'crm.clients.view_all',
  CLIENTS_VIEW_TEAM:     'crm.clients.view_team',
  CLIENTS_VIEW_ASSIGNED: 'crm.clients.view_assigned',
  CLIENTS_VIEW_PII:      'crm.clients.view_pii',
  CLIENTS_CREATE:        'crm.clients.create',
  CLIENTS_EDIT:          'crm.clients.edit',
  CLIENTS_DELETE:        'crm.clients.delete',
  CLIENTS_EXPORT:        'crm.clients.export',

  // Leads
  LEADS_VIEW_ALL:      'crm.leads.view_all',
  LEADS_VIEW_TEAM:     'crm.leads.view_team',
  LEADS_VIEW_ASSIGNED: 'crm.leads.view_assigned',
  LEADS_CREATE:        'crm.leads.create',
  LEADS_EDIT:          'crm.leads.edit',
  LEADS_ASSIGN:        'crm.leads.assign',
  LEADS_DELETE:        'crm.leads.delete',

  // Calls
  CALLS_VIEW_ALL:  'crm.calls.view_all',
  CALLS_VIEW_TEAM: 'crm.calls.view_team',
  CALLS_LOG:       'crm.calls.log',

  // Reports
  REPORTS_VIEW:   'crm.reports.view',
  REPORTS_EXPORT: 'crm.reports.export',

  // Approvals
  APPROVALS_SUBMIT:  'crm.approvals.submit',
  APPROVALS_APPROVE: 'crm.approvals.approve',

  // Users / Roles
  USERS_MANAGE: 'crm.users.manage',

  // Teams
  TEAMS_MANAGE:          'crm.teams.manage',
  TEAMS_ADD_OWN_MEMBERS: 'crm.teams.add_own_members',

  // Advertisers
  ADVERTISERS_VIEW:   'crm.advertisers.view',
  ADVERTISERS_MANAGE: 'crm.advertisers.manage',

  // Audit
  AUDIT_VIEW: 'crm.audit.view',

  // AI
  AI_INSIGHTS_VIEW: 'crm.ai.insights_view',
} as const;

// -------------------------------------------------------
// Trading Permissions
// -------------------------------------------------------

export const TRADING_PERMISSIONS = {
  // Own account
  ACCOUNT_VIEW_OWN:  'trading.account.view_own',
  ACCOUNT_VIEW_ALL:  'trading.account.view_all',
  ORDERS_PLACE:      'trading.orders.place',
  ORDERS_VIEW_OWN:   'trading.orders.view_own',
  ORDERS_VIEW_ALL:   'trading.orders.view_all',

  // Deposits / Withdrawals
  DEPOSITS_REQUEST:  'trading.deposits.request',
  DEPOSITS_MANAGE:   'trading.deposits.manage',
  WITHDRAWALS_REQUEST: 'trading.withdrawals.request',
  WITHDRAWALS_MANAGE:  'trading.withdrawals.manage',

  // KYC
  KYC_SUBMIT: 'trading.kyc.submit',
  KYC_REVIEW: 'trading.kyc.review',

  // Market
  MARKET_CONTROL: 'trading.market.control',

  // Audit
  AUDIT_VIEW: 'trading.audit.view',

  // Wallet
  WALLET_VIEW_OWN: 'trading.wallet.view_own',
  WALLET_VIEW_ALL: 'trading.wallet.view_all',
} as const;

// -------------------------------------------------------
// Admin Permissions
// -------------------------------------------------------

export const ADMIN_PERMISSIONS = {
  FULL_ACCESS: 'admin.full_access',
} as const;

// -------------------------------------------------------
// Flattened union type for type safety
// -------------------------------------------------------

export type CrmPermission = typeof CRM_PERMISSIONS[keyof typeof CRM_PERMISSIONS];
export type TradingPermission = typeof TRADING_PERMISSIONS[keyof typeof TRADING_PERMISSIONS];
export type AdminPermission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS];
export type Permission = CrmPermission | TradingPermission | AdminPermission;

// -------------------------------------------------------
// Role → default permissions map
// Used by seed-unified-roles.ts and tests
// -------------------------------------------------------

import type { SystemRole } from '../../types/auth.types.js';

export const ROLE_PERMISSIONS: Record<SystemRole, readonly Permission[]> = {
  SUPER_ADMIN: [
    ...Object.values(CRM_PERMISSIONS),
    ...Object.values(TRADING_PERMISSIONS),
    ...Object.values(ADMIN_PERMISSIONS),
  ],

  CRM_ADMIN: [
    CRM_PERMISSIONS.CLIENTS_VIEW_ALL,
    CRM_PERMISSIONS.CLIENTS_VIEW_TEAM,
    CRM_PERMISSIONS.CLIENTS_VIEW_ASSIGNED,
    CRM_PERMISSIONS.CLIENTS_VIEW_PII,
    CRM_PERMISSIONS.CLIENTS_CREATE,
    CRM_PERMISSIONS.CLIENTS_EDIT,
    CRM_PERMISSIONS.CLIENTS_DELETE,
    CRM_PERMISSIONS.CLIENTS_EXPORT,
    CRM_PERMISSIONS.LEADS_VIEW_ALL,
    CRM_PERMISSIONS.LEADS_VIEW_TEAM,
    CRM_PERMISSIONS.LEADS_VIEW_ASSIGNED,
    CRM_PERMISSIONS.LEADS_CREATE,
    CRM_PERMISSIONS.LEADS_EDIT,
    CRM_PERMISSIONS.LEADS_ASSIGN,
    CRM_PERMISSIONS.LEADS_DELETE,
    CRM_PERMISSIONS.CALLS_VIEW_ALL,
    CRM_PERMISSIONS.CALLS_VIEW_TEAM,
    CRM_PERMISSIONS.CALLS_LOG,
    CRM_PERMISSIONS.REPORTS_VIEW,
    CRM_PERMISSIONS.REPORTS_EXPORT,
    CRM_PERMISSIONS.APPROVALS_SUBMIT,
    CRM_PERMISSIONS.APPROVALS_APPROVE,
    CRM_PERMISSIONS.USERS_MANAGE,
    CRM_PERMISSIONS.TEAMS_MANAGE,
    CRM_PERMISSIONS.TEAMS_ADD_OWN_MEMBERS,
    CRM_PERMISSIONS.ADVERTISERS_VIEW,
    CRM_PERMISSIONS.ADVERTISERS_MANAGE,
    CRM_PERMISSIONS.AUDIT_VIEW,
    CRM_PERMISSIONS.AI_INSIGHTS_VIEW,
  ],

  CRM_DIRECTOR: [
    CRM_PERMISSIONS.CLIENTS_VIEW_ALL,
    CRM_PERMISSIONS.CLIENTS_VIEW_TEAM,
    CRM_PERMISSIONS.CLIENTS_VIEW_ASSIGNED,
    CRM_PERMISSIONS.CLIENTS_VIEW_PII,
    CRM_PERMISSIONS.CLIENTS_CREATE,
    CRM_PERMISSIONS.CLIENTS_EDIT,
    CRM_PERMISSIONS.CLIENTS_EXPORT,
    CRM_PERMISSIONS.LEADS_VIEW_ALL,
    CRM_PERMISSIONS.LEADS_VIEW_TEAM,
    CRM_PERMISSIONS.LEADS_VIEW_ASSIGNED,
    CRM_PERMISSIONS.LEADS_CREATE,
    CRM_PERMISSIONS.LEADS_EDIT,
    CRM_PERMISSIONS.LEADS_ASSIGN,
    CRM_PERMISSIONS.CALLS_VIEW_ALL,
    CRM_PERMISSIONS.CALLS_VIEW_TEAM,
    CRM_PERMISSIONS.CALLS_LOG,
    CRM_PERMISSIONS.REPORTS_VIEW,
    CRM_PERMISSIONS.REPORTS_EXPORT,
    CRM_PERMISSIONS.APPROVALS_SUBMIT,
    CRM_PERMISSIONS.APPROVALS_APPROVE,
    CRM_PERMISSIONS.TEAMS_MANAGE,
    CRM_PERMISSIONS.TEAMS_ADD_OWN_MEMBERS,
    CRM_PERMISSIONS.ADVERTISERS_VIEW,
    CRM_PERMISSIONS.ADVERTISERS_MANAGE,
    CRM_PERMISSIONS.AUDIT_VIEW,
    CRM_PERMISSIONS.AI_INSIGHTS_VIEW,
  ],

  CRM_MANAGER: [
    CRM_PERMISSIONS.CLIENTS_VIEW_TEAM,
    CRM_PERMISSIONS.CLIENTS_VIEW_ASSIGNED,
    CRM_PERMISSIONS.CLIENTS_VIEW_PII,
    CRM_PERMISSIONS.CLIENTS_CREATE,
    CRM_PERMISSIONS.CLIENTS_EDIT,
    CRM_PERMISSIONS.CLIENTS_EXPORT,
    CRM_PERMISSIONS.LEADS_VIEW_TEAM,
    CRM_PERMISSIONS.LEADS_VIEW_ASSIGNED,
    CRM_PERMISSIONS.LEADS_CREATE,
    CRM_PERMISSIONS.LEADS_EDIT,
    CRM_PERMISSIONS.LEADS_ASSIGN,
    CRM_PERMISSIONS.CALLS_VIEW_TEAM,
    CRM_PERMISSIONS.CALLS_LOG,
    CRM_PERMISSIONS.REPORTS_VIEW,
    CRM_PERMISSIONS.REPORTS_EXPORT,
    CRM_PERMISSIONS.APPROVALS_SUBMIT,
    CRM_PERMISSIONS.TEAMS_ADD_OWN_MEMBERS,
    CRM_PERMISSIONS.AI_INSIGHTS_VIEW,
  ],

  CRM_AGENT: [
    CRM_PERMISSIONS.CLIENTS_VIEW_ASSIGNED,
    CRM_PERMISSIONS.CLIENTS_VIEW_PII,
    CRM_PERMISSIONS.CLIENTS_CREATE,
    CRM_PERMISSIONS.CLIENTS_EDIT,
    CRM_PERMISSIONS.LEADS_VIEW_ASSIGNED,
    CRM_PERMISSIONS.LEADS_CREATE,
    CRM_PERMISSIONS.LEADS_EDIT,
    CRM_PERMISSIONS.CALLS_LOG,
    CRM_PERMISSIONS.APPROVALS_SUBMIT,
    CRM_PERMISSIONS.AI_INSIGHTS_VIEW,
  ],

  TRADING_OPERATOR: [
    TRADING_PERMISSIONS.ACCOUNT_VIEW_OWN,
    TRADING_PERMISSIONS.ACCOUNT_VIEW_ALL,
    TRADING_PERMISSIONS.ORDERS_VIEW_OWN,
    TRADING_PERMISSIONS.ORDERS_VIEW_ALL,
    TRADING_PERMISSIONS.DEPOSITS_MANAGE,
    TRADING_PERMISSIONS.WITHDRAWALS_MANAGE,
    TRADING_PERMISSIONS.KYC_REVIEW,
    TRADING_PERMISSIONS.MARKET_CONTROL,
    TRADING_PERMISSIONS.AUDIT_VIEW,
    TRADING_PERMISSIONS.WALLET_VIEW_OWN,
    TRADING_PERMISSIONS.WALLET_VIEW_ALL,
  ],

  TRADER: [
    TRADING_PERMISSIONS.ACCOUNT_VIEW_OWN,
    TRADING_PERMISSIONS.ORDERS_PLACE,
    TRADING_PERMISSIONS.ORDERS_VIEW_OWN,
    TRADING_PERMISSIONS.DEPOSITS_REQUEST,
    TRADING_PERMISSIONS.WITHDRAWALS_REQUEST,
    TRADING_PERMISSIONS.KYC_SUBMIT,
    TRADING_PERMISSIONS.WALLET_VIEW_OWN,
  ],
};
