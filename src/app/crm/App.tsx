import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Specification } from "./pages/Specification";
import { VIPClients } from "./pages/VIPClients";
import { CallCenter } from "./pages/CallCenter";
import { TradingIntelligence } from "./pages/TradingIntelligence";
import { Login } from "./pages/Login";
import { AdminPanel } from "./pages/AdminPanel";
import { ManagerDashboard } from "./pages/ManagerDashboard";
import { AgentWorkspace } from "./pages/AgentWorkspace";
import { Reports } from "./pages/Reports";
import { Advertisers } from "./pages/Advertisers";
import { DataManagement } from "./pages/DataManagement";
import { authStorage, apiLogout, refreshAccessToken } from "./lib/auth";

export default function App() {
  const [role, setRole] = useState<string | null>(() => authStorage.getRole());

  // On mount: validate token still works (silently refresh if needed)
  useEffect(() => {
    const storedRole = authStorage.getRole();
    if (!storedRole) return;

    const token = authStorage.getToken();
    if (!token) {
      // Try refresh before forcing re-login
      refreshAccessToken().then(newToken => {
        if (!newToken) { authStorage.clear(); setRole(null); }
      });
    }
  }, []);

  const handleLogin = (r: string) => setRole(r);

  const handleLogout = async () => {
    await apiLogout();
    setRole(null);
  };

  const homeFor: Record<string, string> = {
    director: "/",
    admin:    "/",
    manager:  "/",
    agent:    "/",
  };

  return (
    <BrowserRouter basename="/crm">
      {!role ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Layout role={role} onLogout={handleLogout}>
          <Routes>
            {role === 'director' && <Route path="/" element={<Dashboard />} />}
            {role === 'admin'    && <Route path="/" element={<AdminPanel />} />}
            {role === 'manager'  && <Route path="/" element={<ManagerDashboard />} />}
            {role === 'agent'    && <Route path="/" element={<AgentWorkspace />} />}


            <Route path="/clients"  element={<VIPClients />} />
            <Route path="/call-center" element={<CallCenter />} />
            <Route path="/trading"  element={<TradingIntelligence />} />
            <Route path="/spec"     element={<Specification />} />
            <Route path="/reports"  element={<Reports />} />
            {(role === 'admin' || role === 'director') && <Route path="/advertisers" element={<Advertisers />} />}
            {(role === 'admin' || role === 'director') && <Route path="/data-management" element={<DataManagement />} />}
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  );
}
