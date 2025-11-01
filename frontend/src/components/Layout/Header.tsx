import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = () => {
    return user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <header className="h-16 border-b border-white/20 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <i className="fas fa-bars text-white"></i>
          </button>
          
          {/* Search */}
          <div className="hidden md:flex relative input-group">
            <input
              type="text"
              name="search"
              autoComplete="off"
              className="input w-64"
              placeholder="Search tasks, users, workflows..."
              required
            />
            <label className="user-label">Search</label>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Search button for mobile */}
          <button className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors">
            <i className="fas fa-search text-white"></i>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors relative"
            >
              <i className="fas fa-bell text-white"></i>
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-black/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 z-50">
                <div className="p-4 border-b border-white/20">
                  <h3 className="text-sm font-medium text-white">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-4 hover:bg-white/10 border-b border-white/10">
                    <div className="flex items-start space-x-3">
                      <i className="fas fa-check-circle text-green-400 mt-1"></i>
                      <div className="flex-1">
                        <p className="text-sm text-white">Task completed</p>
                        <p className="text-xs text-white/70">2 minutes ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 hover:bg-white/10 border-b border-white/10">
                    <div className="flex items-start space-x-3">
                      <i className="fas fa-user-plus text-blue-400 mt-1"></i>
                      <div className="flex-1">
                        <p className="text-sm text-white">New user registered</p>
                        <p className="text-xs text-white/70">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 hover:bg-white/10">
                    <div className="flex items-start space-x-3">
                      <i className="fas fa-exclamation-triangle text-yellow-400 mt-1"></i>
                      <div className="flex-1">
                        <p className="text-sm text-white">System maintenance scheduled</p>
                        <p className="text-xs text-white/70">3 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 bg-primary text-black rounded-full flex items-center justify-center text-sm font-medium">
                {getUserInitials()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-white">{user?.name || 'User'}</div>
                <div className="text-xs text-white/70 capitalize">{user?.role || 'user'}</div>
              </div>
              <i className="fas fa-chevron-down text-white/70 text-xs"></i>
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-black/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 z-50">
                <div className="p-4 border-b border-white/20">
                  <div className="font-medium text-white">{user?.name}</div>
                  <div className="text-sm text-white/70">{user?.email}</div>
                </div>
                <div className="py-2">
                  <button className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-white/10">
                    <i className="fas fa-user mr-3 text-white/70"></i>
                    Profile Settings
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-white/10">
                    <i className="fas fa-cog mr-3 text-white/70"></i>
                    Preferences
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-white/10">
                    <i className="fas fa-question-circle mr-3 text-white/70"></i>
                    Help & Support
                  </button>
                  <hr className="my-2 border-white/20" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
                  >
                    <i className="fas fa-sign-out-alt mr-3"></i>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
}