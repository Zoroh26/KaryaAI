import React, { useState, useEffect } from 'react';
import { taskService } from '@/services/taskService';
import { Task } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { ToastContainer, useToast } from '@/components/ui/Toast';

const EmployeeTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, toast, removeToast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await taskService.getEmployeeTasks(user.uid);
      setTasks(Array.isArray(data) ? data : (data as any).tasks || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // The backend updateTask expects a Partial<Task>
      await taskService.updateTask(id, { status: newStatus as any });
      fetchTasks();
    } catch (err: any) {
      toast.error('Failed to update status', err.message);
    }
  };

  const handleProgressChange = async (id: string, progress: number) => {
    try {
      await taskService.updateTask(id, { progress });
      fetchTasks();
    } catch (err: any) {
      toast.error('Failed to update progress', err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 text-success border-success/30';
      case 'in_progress':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'assigned':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'unassigned':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-400';
      case 'Medium':
        return 'text-warning';
      case 'Low':
        return 'text-success';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-black min-h-screen text-white p-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-navbar">My Tasks</h1>
          <p className="text-white/70 font-navbar mt-2">Manage your assigned work and update progress.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-center text-white/50">
          <i className="fas fa-spinner fa-spin text-3xl mb-4 text-primary"></i>
          <p className="font-navbar">Loading your tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center border border-white/10 border-dashed rounded-xl bg-white/5">
          <i className="fas fa-tasks text-4xl text-white/30 mb-4"></i>
          <h3 className="text-lg font-medium text-white font-navbar">No Tasks Assigned</h3>
          <p className="text-white/50 font-navbar mt-1">You currently have no tasks assigned to you. Kick back and relax, or update your skills to match new requirements.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="bg-[#0f181a] border border-white/10 rounded-xl p-6 flex flex-col h-full hover:border-white/30 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
                    {task.priority} Priority
                  </span>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(task.status)} uppercase tracking-wider`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-white font-navbar mb-2">{task.title}</h3>
              <p className="text-white/60 text-sm font-navbar mb-4 flex-1 line-clamp-3" title={task.description}>
                {task.description || "No description provided."}
              </p>
              
              {task.skillsRequired && task.skillsRequired.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {task.skillsRequired.map(skill => (
                    <span key={skill} className="bg-white/5 border border-white/10 text-white/70 text-xs px-2 py-0.5 rounded font-mono">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-white/50 font-navbar mb-4">
                <div><i className="fas fa-clock mr-1 text-primary"></i> {task.estimatedHours}h</div>
                <div><i className="fas fa-cube mr-1 text-primary"></i> {task.storyPoints} pts</div>
              </div>

              <div className="pt-4 border-t border-white/10 mt-auto flex items-center justify-between gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-white/50 font-navbar">
                    <span>Progress</span>
                    <span>{task.progress || 0}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" step="5"
                    value={task.progress || 0}
                    onChange={(e) => handleProgressChange(task.id, parseInt(e.target.value))}
                    disabled={task.status === 'completed'}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <select 
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  className="bg-black/50 border border-white/20 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary shrink-0"
                >
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeTasks;
