import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthLayout } from './pages/auth/AuthLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { ProtectedRoute, AdminProtectedRoute } from './components/layout/ProtectedRoute';
import { useMarketEngine } from './hooks/useMarketEngine';
import { Loader2 } from 'lucide-react';

const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const Markets = React.lazy(() => import('./pages/dashboard/Markets').then(m => ({ default: m.Markets })));
const Trade = React.lazy(() => import('./pages/dashboard/Trade').then(m => ({ default: m.Trade })));
const Portfolio = React.lazy(() => import('./pages/dashboard/Portfolio').then(m => ({ default: m.Portfolio })));
const Transactions = React.lazy(() => import('./pages/dashboard/Transactions').then(m => ({ default: m.Transactions })));
const Referrals = React.lazy(() => import('./pages/dashboard/Referrals').then(m => ({ default: m.Referrals })));
const KYC = React.lazy(() => import('./pages/dashboard/KYC').then(m => ({ default: m.KYC })));
const Notifications = React.lazy(() => import('./pages/dashboard/NotificationsPage').then(m => ({ default: m.Notifications })));
const Support = React.lazy(() => import('./pages/dashboard/Support').then(m => ({ default: m.Support })));
const ProfileSettings = React.lazy(() => import('./pages/dashboard/ProfileSettings').then(m => ({ default: m.ProfileSettings })));
const Gamification = React.lazy(() => import('./pages/dashboard/Gamification').then(m => ({ default: m.Gamification })));

const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminOverview = React.lazy(() => import('./pages/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminMarketControl = React.lazy(() => import('./pages/admin/AdminMarketControl').then(m => ({ default: m.AdminMarketControl })));
const AdminKYC = React.lazy(() => import('./pages/admin/AdminKYC').then(m => ({ default: m.AdminKYC })));
const AdminTransactions = React.lazy(() => import('./pages/admin/AdminTransactions').then(m => ({ default: m.AdminTransactions })));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const CRMSyncPanel = React.lazy(() => import('./pages/admin/CRMSyncPanel').then(m => ({ default: m.CRMSyncPanel })));
const AdminDeposits = React.lazy(() => import('./pages/admin/AdminDeposits').then(m => ({ default: m.AdminDeposits })));
const AdminWithdrawals = React.lazy(() => import('./pages/admin/AdminWithdrawals').then(m => ({ default: m.AdminWithdrawals })));

const Fallback = () => (
  <div className="flex h-full w-full items-center justify-center min-h-[400px]">
    <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
  </div>
);

const AppContent = () => {
  useMarketEngine();

  return (
    <Router basename="/trade">
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>

          {/* User Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/trade" element={<Trade />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/kyc" element={<KYC />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/support" element={<Support />} />
            <Route path="/gamification" element={<Gamification />} />
            <Route path="/settings" element={<ProfileSettings />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/kyc" element={<AdminKYC />} />
              <Route path="/admin/deposits" element={<AdminDeposits />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
              <Route path="/admin/market-control" element={<AdminMarketControl />} />
              <Route path="/admin/transactions" element={<AdminTransactions />} />
              <Route path="/admin/crm-sync" element={<div className="p-8"><CRMSyncPanel /></div>} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
