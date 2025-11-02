import React from 'react';
import { WobbleCard } from '@/components/ui/wobble-card';
import CountUp from '@/components/ui/CountUp';

const EmployeeDashboard = () => {
  const employeeName = 'John Doe';
  
  const myTasks = [
    { 
      id: 1, 
      title: 'Setup CI/CD Pipeline', 
      description: 'Configure automated deployment pipeline for the project',
      status: 'in_progress', 
      priority: 'high',
      deadline: '2025-09-05',
      progress: 65
    },
    { 
      id: 2, 
      title: 'Code Review: Authentication Module', 
      description: 'Review and approve authentication implementation',
      status: 'assigned', 
      priority: 'medium',
      deadline: '2025-09-03',
      progress: 0
    },
    { 
      id: 3, 
      title: 'Update Documentation', 
      description: 'Update API documentation with latest changes',
      status: 'assigned', 
      priority: 'low',
      deadline: '2025-09-07',
      progress: 0
    },
  ];

  const completedToday = [
    { id: 4, title: 'Database Schema Update', completedAt: '10:30 AM' },
    { id: 5, title: 'Bug Fix: Login Issue', completedAt: '2:15 PM' },
  ];

  const stats = [
    {
      title: 'Today\'s Tasks',
      value: '5',
      change: '+2',
      changeType: 'positive',
      icon: 'fas fa-check-square',
      color: 'text-primary'
    },
    {
      title: 'Completed',
      value: '2',
      change: '+1',
      changeType: 'positive',
      icon: 'fas fa-check-circle',
      color: 'text-success'
    },
    {
      title: 'In Progress',
      value: '1',
      change: '0',
      changeType: 'neutral',
      icon: 'fas fa-play',
      color: 'text-warning'
    },
    {
      title: 'Avg. Time',
      value: '2.3',
      change: '-0.2',
      changeType: 'positive',
      icon: 'fas fa-chart-line',
      color: 'text-white'
    }
  ];

  const skills = ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS'];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'fas fa-check-circle';
      case 'in_progress':
        return 'fas fa-play';
      case 'assigned':
        return 'fas fa-clock';
      default:
        return 'fas fa-exclamation-triangle';
    }
  };

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
          <h1 className="text-4xl font-bold text-white font-navbar">Hello {employeeName}! Here's your work today</h1>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <span className="inline-flex items-center rounded-full px-2 py-1 text-lg font-medium bg-success/20 text-success">
            <i className="fas fa-user w-3 h-3 mr-1"></i>
            Available
          </span>
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-lg font-medium ring-offset-background transition-colors bg-white/10 hover:bg-white/20 border border-white/20 text-white h-10 py-2 px-4">
            <i className="fas fa-calendar w-4 h-4 mr-2"></i>
            Schedule
          </button>
        </div>
      </div>

      {/* Combined Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[90vh] grid-rows-[15vh_1fr_20vh_1fr]">
        {/* Stats Cards Row */}
        {stats.map((stat, index) => (
          <WobbleCard key={stat.title} containerClassName="bg-[#0f181a] border border-white/20" className="h-full px-4 py-4 sm:px-6 relative">
            <i className={`${stat.icon} text-3xl ${stat.color} absolute top-4 left-4`}></i>
            <div className="absolute top-4 right-4 flex items-center">
              <i className="fas fa-chart-line text-lg text-primary mr-2"></i>
              <span className="text-sm text-primary font-navbar">{stat.change}</span>
            </div>
            <p className="text-sm font-medium text-white/70 font-navbar absolute top-12 left-4">{stat.title}</p>
            <div className="absolute bottom-4 right-4">
              <CountUp
                to={parseFloat(stat.value)}
                className="text-5xl font-bold text-white font-navbar"
                duration={2}
                separator=","
              />
            </div>
          </WobbleCard>
        ))}
        <WobbleCard containerClassName="bg-white/5 border border-white/20 col-span-3 row-span-3" className="h-full px-4 py-4 sm:px-6 flex flex-col">
          <div className="flex flex-row items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white font-navbar">Active Tasks</h3>
              <p className="text-base text-white/70 font-navbar">All your assigned tasks</p>
            </div>
            <i className="fas fa-tasks text-lg text-primary"></i>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {myTasks.map((task) => (
              <div key={task.id} className="p-2 rounded-lg bg-white/5 border border-white/10 block">
                <div>
                  <h4 className="font-medium text-white text-base font-navbar mb-2 truncate">{task.title}</h4>
                  <p className="text-sm text-white/70 font-navbar truncate mb-2">{task.description}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-sm font-medium font-navbar ${getStatusBadge(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-sm font-medium font-navbar ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.progress > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-white/20 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${task.progress}%` }}></div>
                        </div>
                        <span className="text-sm text-white/70 font-navbar">{task.progress}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </WobbleCard>

        <WobbleCard containerClassName="bg-[#0f181a] border border-white/20" className="h-full px-4 py-4 sm:px-6 flex flex-col">
          <div className="flex flex-row items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white font-navbar">Completed Today</h3>
            </div>
            <i className="fas fa-trophy text-lg text-success"></i>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {completedToday.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-success/5 border border-success/20">
                <div>
                  <p className="text-sm font-medium text-white font-navbar">{task.title}</p>
                  <p className="text-sm text-white/70 font-navbar">{task.completedAt}</p>
                </div>
                <i className="fas fa-check-circle text-sm text-success"></i>
              </div>
            ))}
          </div>
        </WobbleCard>

        <WobbleCard containerClassName="bg-[#0f181a] border border-white/20" className="h-full px-4 py-4 sm:px-6 flex flex-col">
          <div className="flex flex-row items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white font-navbar">My Skills</h3>
            </div>
            <i className="fas fa-code text-lg text-primary"></i>
          </div>
          <div className="flex flex-wrap gap-2 mb-4 flex-1">
            {skills.slice(0, 3).map((skill) => (
              <span key={skill} className="inline-flex items-center rounded-full border border-white/20 px-2 py-1 text-sm font-medium text-white font-navbar">
                {skill}
              </span>
            ))}
          </div>
          <button className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg px-3 py-2 text-sm font-medium font-navbar transition-colors">
            + Add Skill
          </button>
        </WobbleCard>

        <WobbleCard containerClassName="bg-[#0f181a] border border-white/20" className="h-full px-4 py-4 sm:px-6 flex flex-col">
          <div className="flex flex-row items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white font-navbar">Quick Actions</h3>
            </div>
            <i className="fas fa-bolt text-lg text-primary"></i>
          </div>
          <div className="space-y-2 flex-1">
            <button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm font-medium font-navbar transition-colors flex items-center">
              <i className="fas fa-calendar mr-2"></i>
              View Schedule
            </button>
            <button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm font-medium font-navbar transition-colors flex items-center">
              <i className="fas fa-user-cog mr-2"></i>
              Set Availability
            </button>
            <button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm font-medium font-navbar transition-colors flex items-center">
              <i className="fas fa-user mr-2"></i>
              Update Profile
            </button>
          </div>
        </WobbleCard>
      </div>
    </div>
  );
};

export default EmployeeDashboard;