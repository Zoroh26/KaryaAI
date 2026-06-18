import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';

export const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Redirect /app to the appropriate role-based dashboard
  if (location.pathname === '/app' || location.pathname === '/app/') {
    if (user?.role) {
      return <Navigate to={`/app/${user.role}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex w-full bg-black">
      <AppSidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div className="flex-1">
        <main className="h-screen overflow-y-auto scrollbar-hide">
          <Outlet />
        </main>
      </div>
    </div>
  );
};