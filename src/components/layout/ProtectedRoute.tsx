/**
 * ProtectedRoute.tsx — Domain-aware route guard for React Router
 *
 * Three guard types:
 *   1. <ProtectedRoute>              — requires any authenticated user
 *   2. <ProtectedRoute domain="CRM"> — requires CRM domain access
 *   3. <ProtectedRoute domain="TRADING"> — requires Trading domain access
 *   4. <ProtectedRoute domain="BOTH"> — requires Super Admin
 *
 * On failure: redirects to /auth/login (unauthenticated) or
 * the user's own domain dashboard (wrong domain).
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Domain, SystemRole } from '../../types/auth.types.js';
import { getRedirectForDomain } from '../../lib/rbac/roles.js';
import { canAccessCrm, canAccessTrading } from '../../lib/rbac/access.js';

// -------------------------------------------------------
// Auth context hook — replace with your actual auth state
// -------------------------------------------------------

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    systemRole: SystemRole;
    domain: Domain;
    permissions: string[];
  } | null;
}

/**
 * Replace this stub with your real auth context hook.
 * e.g.: import { useAuth } from '@/contexts/AuthContext';
 */
function useAuth(): AuthState {
  // Stub — real implementation reads from your AuthContext / Zustand store
  // The stored user comes from the login response (not localStorage)
  const storedUser =
    typeof window !== 'undefined'
      ? (window as any).__AUTH_USER__ ?? null
      : null;

  return {
    isAuthenticated: storedUser !== null,
    isLoading: false,
    user: storedUser,
  };
}

// -------------------------------------------------------
// ProtectedRoute component
// -------------------------------------------------------

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required domain. If omitted, any authenticated user is allowed. */
  domain?: Domain;
  /** Required permission. Checked in addition to domain. */
  permission?: string;
  /** Custom redirect when access is denied (defaults to domain dashboard). */
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  domain,
  permission,
  redirectTo,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check domain access
  if (domain) {
    let hasAccess = false;
    switch (domain) {
      case 'CRM':
        hasAccess = canAccessCrm(user.domain);
        break;
      case 'TRADING':
        hasAccess = canAccessTrading(user.domain);
        break;
      case 'BOTH':
        hasAccess = user.systemRole === 'SUPER_ADMIN';
        break;
    }

    if (!hasAccess) {
      const fallback = redirectTo ?? getRedirectForDomain(user.domain);
      return <Navigate to={fallback} replace />;
    }
  }

  // Check permission
  if (permission && !user.permissions.includes(permission)) {
    const fallback = redirectTo ?? getRedirectForDomain(user.domain);
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}

// -------------------------------------------------------
// Convenience wrappers
// -------------------------------------------------------

export function CrmRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute domain="CRM">{children}</ProtectedRoute>;
}

export function TradingRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute domain="TRADING">{children}</ProtectedRoute>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute domain="BOTH">{children}</ProtectedRoute>;
}
