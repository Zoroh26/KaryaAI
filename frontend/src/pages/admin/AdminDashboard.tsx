import React, { useEffect, useState } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { taskService } from '@/services/taskService';
import { WobbleCard } from '@/components/ui/wobble-card';
import CountUp from '@/components/ui/CountUp';
import { useAuth } from '@/contexts/AuthContext';

const AdminDashboard = () => {
  const { tasks, users, workflows, products, isLoading, error, refetch } = useDashboardData();
  const { user, logout } = useAuth();
  const [isAssigning, setIsAssigning] = useState(false);
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

  // Calculate statistics from real data
  const stats = [
    {
      title: 'Total Users',
      value: users.length.toString(),
      change: '+12%',
      changeType: 'positive',
      icon: 'fas fa-users',
      color: 'text-info'
    },
    {
      title: 'Active Tasks',
      value: tasks.filter(task => task.status === 'in_progress').length.toString(),
      change: '+8%',
      changeType: 'positive',
      icon: 'fas fa-square-check',
      color: 'text-success'
    },
    {
      title: 'Workflows',
      value: workflows.length.toString(),
      change: '+15%',
      changeType: 'positive',
      icon: 'fas fa-diagram-project',
      color: 'text-white'
    },
    {
      title: 'Efficiency',
      value: '94%',
      change: '+3%',
      changeType: 'positive',
      icon: 'fas fa-gauge',
      color: 'text-white'
    }
  ];

  const handleAutoAssign = async () => {
    const unassignedTasks = tasks.filter(task => !task.assignedTo);
    
    if (unassignedTasks.length === 0) {
      alert("No unassigned tasks found.");
      return;
    }

    setIsAssigning(true);
    try {
      const taskIds = unassignedTasks.map(task => task.id);
      await taskService.assignTasks(taskIds);
      alert(`${taskIds.length} tasks have been automatically assigned.`);
      refetch();
    } catch (error) {
      alert("Failed to assign tasks. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  const recentTasks = tasks.slice(0, 4);
  const unassignedTasks = tasks.filter(task => !task.assignedTo).slice(0, 3);

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-success/20 text-success',
      in_progress: 'bg-primary/20 text-primary',
      assigned: 'bg-warning/20 text-warning'
    };
    return variants[status as keyof typeof variants] || 'bg-muted text-muted-foreground';
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'bg-destructive/20 text-destructive',
      medium: 'bg-warning/20 text-warning',
      low: 'bg-success/20 text-success'
    };
    return variants[priority as keyof typeof variants] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="bg-black h-screen text-white p-6 flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between h-[10vh] justify-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
        

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors relative"
            >
              <i className="fas fa-bell text-white"></i>
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-secondary text-white text-xs rounded-full flex items-center justify-center">
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

          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-white/10 hover:bg-white/20 border border-white/20 text-white h-10 py-2 px-4">
            View Reports
          </button>
          <button 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary hover:bg-primary/90 text-black h-10 px-4 py-2"
            onClick={handleAutoAssign} 
            disabled={isAssigning}
          >
            {isAssigning ? 'Assigning...' : 'Auto-Assign Tasks'}
          </button>
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

      {/* First Row: Stat1, Stat2, Recent Activity (2 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[28vh]">
        {stats.slice(0, 2).map((stat, index) => (
          <WobbleCard key={stat.title} containerClassName="bg-[#0f181a] border border-white/20" className="h-full px-6 py-6 sm:px-8 relative">
            <i className={`${stat.icon} text-4xl ${stat.color} absolute top-6 left-6`}></i>
            <div className="absolute top-6 right-6 flex items-center">
              <i className="fas fa-chart-line text-2xl text-primary mr-2"></i>
              <span className="text-lg text-primary font-navbar">{stat.change}</span>
            </div>
            <p className="text-lg font-medium text-white/70 font-navbar absolute top-20 left-6">{stat.title}</p>
            <div className="absolute bottom-6 left-6">
              <CountUp
                to={parseInt(stat.value.replace(/[^0-9]/g, ''))}
                className="text-6xl font-bold text-white font-navbar"
                duration={2}
                separator=","
              />
            </div>
          </WobbleCard>
        ))}

        <WobbleCard containerClassName="bg-white/5 border border-white/20 col-span-2" className="h-full px-4 py-4 sm:px-6">
          <div className="flex flex-row items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white font-navbar">Recent Activity</h3>
              <p className="text-sm text-white/70 font-navbar">Latest task updates</p>
            </div>
            <i className="fas fa-clock w-4 h-4 text-primary"></i>
          </div>
          <div className="space-y-3">
            {recentTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex-1">
                  <h4 className="font-medium text-white text-base font-navbar">{task.title}</h4>
                  <p className="text-sm text-white/70 mt-1 font-navbar">
                    {task.assignedToName ? `Assigned to ${task.assignedToName}` : 'Unassigned'}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-sm font-medium font-navbar ${getStatusBadge(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </WobbleCard>
      </div>

      {/* Second Row: Unassigned Tasks (2 cols), Stat3, Stat4 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[28vh]">
        <WobbleCard containerClassName="bg-foreground/50 border border-primary/20 col-span-2" className="h-full px-4 py-4 sm:px-6 flex flex-col">
          <div className="flex flex-row items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white font-navbar">Unassigned Tasks</h3>
              <p className="text-sm text-white/70 font-navbar">Tasks waiting for assignment</p>
            </div>
            <i className="fas fa-exclamation-triangle w-4 h-4 text-yellow-400"></i>
          </div>
          <div className="space-y-3 flex-1">
            {unassignedTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex-1">
                  <h4 className="font-medium text-white text-base font-navbar">{task.title}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-sm font-medium font-navbar ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 py-3">
            <button 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary hover:bg-primary/90 text-black h-8 px-3 w-full font-navbar"
              onClick={handleAutoAssign} 
              disabled={isAssigning}
            >
              <i className="fas fa-bolt w-3 h-3 mr-2"></i>
              {isAssigning ? 'Assigning...' : 'Auto-Assign All'}
            </button>
          </div>
        </WobbleCard>

        {stats.slice(2, 4).map((stat) => (
          <WobbleCard key={stat.title} containerClassName="bg-[#0f181a] border border-white/20" className="h-full px-6 py-6 sm:px-8 relative">
            <i className={`${stat.icon} text-4xl ${stat.color} absolute top-6 left-6`}></i>
            <div className="absolute top-6 right-6 flex items-center">
              <i className="fas fa-chart-line text-2xl text-primary mr-2"></i>
              <span className="text-lg text-primary font-navbar">{stat.change}</span>
            </div>
            <p className="text-lg font-medium text-white/70 font-navbar absolute top-20 left-6">{stat.title}</p>
            <div className="absolute bottom-6 left-6">
              <CountUp
                to={parseInt(stat.value.replace(/[^0-9]/g, ''))}
                className="text-6xl font-bold text-white font-navbar"
                duration={2}
                separator=","
              />
            </div>
          </WobbleCard>
        ))}
      </div>

      {/* Third Row: Quick Actions (4 columns) */}
      <div className="h-[26vh]">
        <WobbleCard containerClassName="bg-white/5 border border-white/20 h-full" className="h-full px-4 py-6 sm:px-6 flex flex-col">
        <div className="mb-6 font-navbar">
          <h3 className="text-lg font-semibold text-white font-navbar">Quick Actions</h3>
          <p className="text-sm text-white/70 font-navbar">Common administrative tasks</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          <button className="relative px-4 py-6 rounded-md text-sm font-medium transition-colors border border-white/20 bg-white/10 hover:bg-white/20 text-white font-navbar">
            <i className="fas fa-users text-2xl absolute top-4 left-4"></i>
            <span className="text-base absolute bottom-4 right-4">Manage Users</span>
          </button>
          <button className="relative px-4 py-6 rounded-md text-sm font-medium transition-colors border border-white/20 bg-white/10 hover:bg-white/20 text-white font-navbar">
            <i className="fas fa-project-diagram text-2xl absolute top-4 left-4"></i>
            <span className="text-base absolute bottom-4 right-4">Create Workflow</span>
          </button>
          <button className="relative px-4 py-6 rounded-md text-sm font-medium transition-colors border border-white/20 bg-white/10 hover:bg-white/20 text-white font-navbar">
            <i className="fas fa-chart-bar text-2xl absolute top-4 left-4"></i>
            <span className="text-base absolute bottom-4 right-4">View Analytics</span>
          </button>
          <button className="relative px-4 py-6 rounded-md text-sm font-medium transition-colors border border-white/20 bg-white/10 hover:bg-white/20 text-white font-navbar">
            <i className="fas fa-robot text-2xl absolute top-4 left-4"></i>
            <span className="text-base absolute bottom-4 right-4">AI Assistant</span>
          </button>
        </div>
        </WobbleCard>
      </div>
    </div>
  );
};

export default AdminDashboard;