import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: 'LITE' | 'PRO' | 'ADMIN' | 'STUDENT' | 'INSTRUCTOR' | null;
  kycStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInMockAdmin: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  kycStatus: null,
  loading: true,
  signOut: async () => {},
  signInMockAdmin: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'LITE' | 'PRO' | 'ADMIN' | 'STUDENT' | 'INSTRUCTOR' | null>(null);
  const [kycStatus, setKycStatus] = useState<'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoleAndKyc = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('role, kyc_status')
        .eq('id', userId)
        .single();
      
      if (data) {
        setRole(data.role as any);
        setKycStatus(data.kyc_status as any);
      } else {
        setRole('LITE');
        setKycStatus('UNVERIFIED');
      }
    } catch (err) {
      setRole('LITE');
      setKycStatus('UNVERIFIED');
    }
  };

  const refreshProfile = async () => {
    const currentUser = user || session?.user;
    if (currentUser?.id) {
      await fetchRoleAndKyc(currentUser.id);
    }
  };

  const signInMockAdmin = () => {
    // SECURITY: mock admin bypass is only available in local development builds.
    // In production the function is a hard no-op - it cannot be triggered from
    // the browser console, a UI button, or any other surface.
    if (!import.meta.env.DEV) {
      console.warn('[Auth] signInMockAdmin() is disabled in production builds.');
      return;
    }
    const mockUser = { id: 'admin-mock', email: 'admin@elite.trading' } as User;
    const mockSession = { user: mockUser, access_token: 'mock-token', refresh_token: 'mock', expires_in: 9999, token_type: 'bearer' } as Session;
    setSession(mockSession);
    setUser(mockUser);
    setRole('ADMIN');
    setKycStatus('VERIFIED');
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoleAndKyc(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        fetchRoleAndKyc(newUser.id);
      } else {
        setRole(null);
        setKycStatus(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update loading only when role is also determined if user is logged in
  useEffect(() => {
    if (!session || (session && role)) {
      setLoading(false);
    }
  }, [session, role]);

  const signOut = async () => {
    setSession(null);
    setUser(null);
    setRole(null);
    setKycStatus(null);
    setLoading(false);
    await supabase.auth.signOut({ scope: 'global' });
  };

  return (
    <AuthContext.Provider value={{ session, user, role, kycStatus, loading, signOut, signInMockAdmin, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
