import React from 'react';
import { WobbleCard } from '../../components/ui/wobble-card';
import CountUp from '@/components/ui/CountUp';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { tasks, isLoading } = useDashboardData();
  
  const employeeName = user?.full_name?.split(' ')[0] || 'Employee';

  // Calculate real stats
  const activeTasksCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const pendingTasksCount = tasks.filter(t => t.status === 'assigned').length;

  const stats = [
    {
      title: 'Active Tasks',
      value: activeTasksCount.toString(),
      change: '+2',
      changeType: 'positive',
      icon: 'fas fa-spinner fa-spin',
      color: 'text-primary'
    },
    {
      title: 'Completed',
      value: completedTasksCount.toString(),
      change: '+5',
      changeType: 'positive',
      icon: 'fas fa-check-circle',
      color: 'text-success'
    },
    {
      title: 'Pending',
      value: pendingTasksCount.toString(),
      change: '0',
      changeType: 'neutral',
      icon: 'fas fa-clock',
      color: 'text-warning'
    },
    {
      title: 'Total Points',
      value: tasks.reduce((acc, task) => acc + (task.storyPoints || 0), 0).toString(),
      change: '+15',
      changeType: 'positive',
      icon: 'fas fa-star',
      color: 'text-white'
    }
  ];

  const skills = user?.skillset || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: 'bg-success/20 text-success border-success/30',
      in_progress: 'bg-primary/20 text-primary border-primary/30',
      assigned: 'bg-warning/20 text-warning border-warning/30'
    };
    return variants[status] || 'bg-muted text-muted-foreground border-white/10';
  };

  return (
    <div className="bg-black h-screen text-white p-6 flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between h-[10vh] justify-center">
        <div>
          <h1 className="text-4xl font-bold text-white font-navbar">Hello {employeeName}! Here's your work today</h1>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-lg font-medium ${user?.isAvailable ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
            <i className="fas fa-user w-3 h-3 mr-1"></i>
            {user?.isAvailable ? 'Available' : 'Busy'}
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
        {stats.map((stat) => (
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold font-navbar flex items-center">
              <i className="fas fa-list-check mr-2 text-primary"></i>
              Current Tasks
            </h3>
            <Link to="/app/employee/tasks" className="text-sm text-primary hover:text-primary/80 font-navbar transition-colors">
              View All Board
            </Link>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-2">
            {isLoading ? (
              <div className="p-4 text-center text-white/50 font-navbar">Loading...</div>
            ) : tasks.length === 0 ? (
              <div className="p-4 text-center text-white/50 font-navbar">No tasks assigned.</div>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${task.priority === 'High' ? 'text-red-400' : task.priority === 'Medium' ? 'text-warning' : 'text-success'}`}>
                        {task.priority} Priority
                      </span>
                      <span className="text-white/30 text-xs">•</span>
                      <span className="text-xs text-white/50">{task.estimatedHours}h / {task.storyPoints}pts</span>
                    </div>
                    <h4 className="font-medium text-white text-base font-navbar">{task.title}</h4>
                    <p className="text-sm text-white/50 font-navbar mt-1">{task.workflowId}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 sm:w-32">
                      <div className="flex justify-between text-xs text-white/50 font-navbar mb-1">
                        <span>Progress</span>
                        <span>{task.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${task.progress || 0}%` }}></div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border ${getStatusBadge(task.status)} uppercase`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
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
            {tasks.filter(t => t.status === 'completed').slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-success/5 border border-success/20">
                <div>
                  <p className="text-sm font-medium text-white font-navbar truncate max-w-[150px]">{task.title}</p>
                  <p className="text-sm text-white/70 font-navbar">{task.storyPoints} pts</p>
                </div>
                <i className="fas fa-check-circle text-sm text-success"></i>
              </div>
            ))}
            {tasks.filter(t => t.status === 'completed').length === 0 && (
              <div className="p-4 text-center text-white/50 font-navbar text-sm">No tasks completed today.</div>
            )}
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
            {skills.map((skill) => (
              <span key={skill} className="inline-flex items-center rounded-full border border-white/20 px-2 py-1 text-sm font-medium text-white font-navbar">
                {skill}
              </span>
            ))}
            {skills.length === 0 && (
              <span className="text-white/50 text-sm font-navbar">No skills set.</span>
            )}
          </div>
        </WobbleCard>

        <WobbleCard containerClassName="bg-[#0f181a] border border-white/20" className="h-full px-4 py-4 sm:px-6 flex flex-col">
          <div className="flex flex-row items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white font-navbar">Quick Actions</h3>
            </div>
            <i className="fas fa-bolt text-lg text-primary"></i>
          </div>
          <div className="space-y-2 flex-1">
            <Link to="/app/employee/tasks" className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm font-medium font-navbar transition-colors flex items-center">
              <i className="fas fa-list-check mr-2"></i>
              View All Tasks
            </Link>
          </div>
        </WobbleCard>
      </div>
    </div>
  );
};

export default EmployeeDashboard;