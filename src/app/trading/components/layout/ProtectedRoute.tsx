import React, { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MainLayout } from './MainLayout';
import { Loader2 } from 'lucide-react';

const Fallback = () => (
  <div className="flex h-full w-full items-center justify-center min-h-[400px]">
    <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
  </div>
);

export const ProtectedRoute: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <MainLayout>
      <Suspense fallback={<Fallback />}>
        <Outlet />
      </Suspense>
    </MainLayout>
  );
};


export const AdminProtectedRoute: React.FC = () => {
  const { session, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  if (role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
