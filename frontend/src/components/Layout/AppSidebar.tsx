import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const adminNavigation = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', url: '/admin', icon: 'fas fa-pager', exact: true },
      { title: 'Analytics', url: '/admin/analytics', icon: 'fas fa-chart-line' },
    ]
  },
  {
    title: 'Management',
    items: [
      { title: 'Users', url: '/admin/users', icon: 'fas fa-users' },
      { title: 'Tasks', url: '/admin/tasks', icon: 'fas fa-square-check' },
      { title: 'Workflows', url: '/admin/workflows', icon: 'fas fa-diagram-project' },
    ]
  },
  {
    title: 'System',
    items: [
      { title: 'Settings', url: '/admin/settings', icon: 'fas fa-cog' },
    ]
  }
];

const employeeNavigation = [
  {
    title: 'Work',
    items: [
      { title: 'Dashboard', url: '/employee', icon: 'fas fa-tachograph-digital', exact: true },
      { title: 'My Tasks', url: '/employee/tasks', icon: 'fas fa-check-square' },
      { title: 'Schedule', url: '/employee/schedule', icon: 'fas fa-calendar' },
    ]
  },
  {
    title: 'Personal',
    items: [
      { title: 'Profile', url: '/employee/profile', icon: 'fas fa-user' },
    ]
  }
];

const clientNavigation = [
  {
    title: 'Projects',
    items: [
      { title: 'Dashboard', url: '/client', icon: 'fas fa-tachograph-digtal', exact: true },
      { title: 'Products', url: '/client/products', icon: 'fas fa-box' },
      { title: 'Workflows', url: '/client/workflows', icon: 'fas fa-diagram-project' },
    ]
  },
  {
    title: 'Communication',
    items: [
      { title: 'Updates', url: '/client/updates', icon: 'fas fa-bell' },
      { title: 'Feedback', url: '/client/feedback', icon: 'fas fa-comment' },
    ]
  }
];

const getNavigation = (role: string) => {
  switch (role) {
    case 'admin':
      return adminNavigation;
    case 'employee':
      return employeeNavigation;
    case 'client':
      return clientNavigation;
    default:
      return [];
  }
};

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ isCollapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const navigation = getNavigation(user?.role || 'admin');

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-black border-r border-white/20 flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="border-b border-white/20">
        {isCollapsed ? (
          <div className="flex flex-col items-center py-4 space-y-3">
            <img src="/Karya.png" alt="KaryaAI" className="w-6 h-6" />
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <i className="fas fa-bars text-white text-lg"></i>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-6">
            <div className="flex items-center space-x-3">
              <img src="/Karya.png" alt="KaryaAI" className="w-12 h-12" />
              <span className="font-bold text-white font-navbar text-xl">KaryaAI</span>
            </div>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <i className="fas fa-bars text-white text-xl"></i>
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {navigation.map((section, sectionIndex) => (
          <div key={section.title}>
            <div className="px-2">
              {!isCollapsed && (
                <h3 className="text-lg font-medium text-white/50 uppercase tracking-wider px-2 mb-3 font-navbar">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.title}>
                    <NavLink
                      to={item.url}
                      className={({ isActive: navIsActive }) => {
                        const active = navIsActive || isActive(item.url, item.exact);
                        return `flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-4 rounded-lg text-lg font-medium transition-colors font-navbar ${
                          active
                            ? 'bg-primary/20 text-primary border-r-2 border-primary'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`;
                      }}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <i className={`${item.icon} w-6 h-6 flex-shrink-0 text-xl`}></i>
                      {!isCollapsed && <span className="ml-4 text-lg font-navbar">{item.title}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
            {sectionIndex < navigation.length - 1 && (
              <div className="border-b border-white/20 my-6"></div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}