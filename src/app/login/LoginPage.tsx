/**
 * LoginPage.tsx — Unified login page
 *
 * All users (CRM, Trading, Admin) log in through this single page.
 * After successful login, the user is redirected based on their domain:
 *   CRM    → /crm/dashboard
 *   TRADING → /trade/dashboard
 *   BOTH   → /admin/dashboard
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm, MfaForm } from '../../components/auth/LoginForm.js';
import {
  login,
  verifyMfa,
  refreshAccessToken,
} from '../../lib/auth/authClient.js';
import { getRedirectForDomain } from '../../lib/rbac/roles.js';
import type { AuthUser, Domain } from '../../types/auth.types.js';

// -------------------------------------------------------
// Types
// -------------------------------------------------------

type PageState =
  | { step: 'login' }
  | { step: 'mfa'; mfaSessionToken: string }
  | { step: 'done' };

// -------------------------------------------------------
// LoginPage component
// -------------------------------------------------------

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState<PageState>({ step: 'login' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------
  // On mount: try to restore session via refresh cookie
  // -------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function tryRestore() {
      try {
        const token = await refreshAccessToken();
        if (!cancelled && token) {
          // Decode domain from JWT payload (base64 middle section)
          const payload = JSON.parse(atob(token.split('.')[1]!));
          const domain = payload.domain as Domain;
          const redirectTo = (location.state as any)?.from ?? getRedirectForDomain(domain);
          navigate(redirectTo, { replace: true });
        }
      } catch {
        // No valid refresh token — stay on login page
      }
    }

    tryRestore();
    return () => { cancelled = true; };
  }, [navigate, location.state]);

  // -------------------------------------------------------
  // Handlers
  // -------------------------------------------------------

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login({ email, password });

      if ('mfaRequired' in result) {
        setState({ step: 'mfa', mfaSessionToken: result.mfaSessionToken });
        return;
      }

      // Store user in window for ProtectedRoute (replace with real auth context)
      (window as any).__AUTH_USER__ = result.user;

      redirectAfterLogin(result.user);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerify = async (totpCode: string) => {
    if (state.step !== 'mfa') return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyMfa({
        mfaSessionToken: state.mfaSessionToken,
        totpCode,
      });
      (window as any).__AUTH_USER__ = result.user;
      redirectAfterLogin(result.user);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const redirectAfterLogin = (user: AuthUser) => {
    const from = (location.state as any)?.from;
    const defaultRedirect = getRedirectForDomain(user.domain);
    navigate(from ?? defaultRedirect, { replace: true });
  };

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-xl mb-4">
              B
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Bullenhaus</h1>
            <p className="text-sm text-gray-500 mt-1">
              {state.step === 'mfa' ? 'Two-factor verification' : 'Sign in to your account'}
            </p>
          </div>

          {/* Form */}
          {state.step === 'login' && (
            <LoginForm
              onSubmit={handleLogin}
              isLoading={isLoading}
              error={error}
            />
          )}

          {state.step === 'mfa' && (
            <MfaForm
              onSubmit={handleMfaVerify}
              onCancel={() => {
                setState({ step: 'login' });
                setError(null);
              }}
              isLoading={isLoading}
              error={error}
            />
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Your session is protected with end-to-end encryption.
        </p>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Error message extractor
// -------------------------------------------------------

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const status = (err as any).status ?? (err as any).statusCode;
    if (status === 429) return 'Account temporarily locked. Please try again later.';
    if (status === 403) return 'Account suspended. Contact support.';
    return err.message || 'Login failed. Please try again.';
  }
  return 'An unexpected error occurred.';
}
