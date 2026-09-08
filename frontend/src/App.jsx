import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CataloguePage } from './pages/CataloguePage';
import { ImpactPage } from './pages/ImpactPage';
import { PipelinesPage } from './pages/PipelinesPage';
import { AssistantIAPage } from './pages/AssistantIAPage';
import { UsersPage } from './pages/UsersPage';
import { AtlasSyncPage } from './pages/AtlasSyncPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { token, user, loading } = useAuth();

  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (requireAdmin && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
};

const MainLayout = ({ children }) => (
  <div className="app-container">
    <Sidebar />
    <main className="main-content">{children}</main>
  </div>
);

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />
          <Route path="/catalogue" element={<ProtectedRoute><MainLayout><CataloguePage /></MainLayout></ProtectedRoute>} />
          <Route path="/impact" element={<ProtectedRoute><MainLayout><ImpactPage /></MainLayout></ProtectedRoute>} />
          <Route path="/pipelines" element={<ProtectedRoute><MainLayout><PipelinesPage /></MainLayout></ProtectedRoute>} />
          <Route path="/quality" element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />

          {/* Assistant IA Page with its own dedicated ChatGPT layout */}
          <Route path="/chat" element={<ProtectedRoute><AssistantIAPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><MainLayout><UsersPage /></MainLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><MainLayout><UsersPage /></MainLayout></ProtectedRoute>} />
          <Route path="/admin/atlas-sync" element={<ProtectedRoute requireAdmin><MainLayout><AtlasSyncPage /></MainLayout></ProtectedRoute>} />
          <Route path="/admin/roles" element={<ProtectedRoute requireAdmin><MainLayout><UsersPage /></MainLayout></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><MainLayout><SettingsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/admin/connectors" element={<ProtectedRoute requireAdmin><MainLayout><SettingsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute requireAdmin><MainLayout><SettingsPage /></MainLayout></ProtectedRoute>} />

          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
