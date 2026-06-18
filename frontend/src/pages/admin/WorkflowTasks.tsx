import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService } from '@/services/taskService';
import { workflowService } from '@/services/workflowService';
import { userService } from '@/services/userService';
import { Task, Workflow } from '@/types/api';
import { User } from '@/types/auth';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { ToastContainer, useToast } from '@/components/ui/Toast';

const WorkflowTasks = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const { toasts, toast, removeToast } = useToast();
  
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>(
    { open: false, title: '', message: '', onConfirm: () => {} }
  );

  useEffect(() => {
    if (workflowId) {
      fetchData();
    }
  }, [workflowId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [workflowData, tasksData, usersData] = await Promise.all([
        workflowService.getWorkflow(workflowId!),
        taskService.getTasks({ workflowId }),
        userService.getUsers('employee')
      ]);
      
      setWorkflow(workflowData);
      setTasks(tasksData);
      setEmployees(usersData);
    } catch (err: any) {
      toast.error('Failed to load data', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoAssign = () => {
    const unassignedTasks = tasks.filter(task => task.status === 'unassigned' || !task.assignedTo || task.assignedTo === '');
    if (unassignedTasks.length === 0) {
      toast.warning('No tasks to assign', 'All tasks are already assigned.');
      return;
    }
    setConfirm({
      open: true,
      title: 'AI Auto-Assign Tasks',
      message: `AI will intelligently assign ${unassignedTasks.length} unassigned task(s) to the most suitable available employees based on their skillsets.`,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        setIsAssigning(true);
        try {
          const taskIds = unassignedTasks.map((t) => t.id);
          await taskService.assignTasks(taskIds);
          toast.success('Tasks assigned!', `${taskIds.length} task(s) have been processed for auto-assignment.`);
          fetchData();
        } catch (err: any) {
          toast.error('Auto-assign failed', err.message);
        } finally {
          setIsAssigning(false);
        }
      }
    });
  };

  const handleAssignTask = async (taskId: string, employeeId: string) => {
    try {
      if (employeeId === 'unassigned') {
        await taskService.updateTask(taskId, {
          assignedTo: "",
          assignedToName: "",
          status: 'unassigned'
        });
        toast.success('Task unassigned', 'The task is now unassigned.');
      } else {
        const employee = employees.find(e => e.uid === employeeId);
        await taskService.updateTask(taskId, {
          assignedTo: employeeId,
          assignedToName: employee?.full_name,
          status: 'assigned'
        });
        toast.success('Task assigned', `Task assigned to ${employee?.full_name}.`);
      }
      fetchData();
    } catch (err: any) {
      toast.error('Assignment failed', err.message);
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
      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel="Assign Tasks"
        variant="info"
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
      />
      
      <div className="mb-6">
        <button 
          onClick={() => navigate('/app/admin/tasks')}
          className="text-white/50 hover:text-white mb-4 flex items-center gap-2 font-navbar text-sm transition-colors"
        >
          <i className="fas fa-arrow-left"></i> Back to Workflows
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-navbar">
              {workflow ? workflow.title : 'Loading Workflow...'}
            </h1>
            <p className="text-white/70 font-navbar mt-2">Manage tasks and assignments for this workflow.</p>
          </div>
          <button 
            onClick={handleAutoAssign}
            disabled={isAssigning || isLoading}
            className="mt-4 sm:mt-0 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary hover:bg-primary/90 text-black h-10 px-4 py-2 font-navbar disabled:opacity-50"
          >
            {isAssigning ? (
              <><i className="fas fa-spinner fa-spin"></i> Assigning...</>
            ) : (
              <><i className="fas fa-bolt"></i> AI Auto-Assign Unassigned</>
            )}
          </button>
        </div>
      </div>

      <div className="bg-[#0f181a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-white/50 text-xs uppercase tracking-wider font-navbar">
                <th className="p-6 font-medium">Task Details</th>
                <th className="p-6 font-medium">Estimates</th>
                <th className="p-6 font-medium">Priority</th>
                <th className="p-6 font-medium">Assignment</th>
                <th className="p-6 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/50">
                    <i className="fas fa-spinner fa-spin text-2xl mb-2 text-primary"></i>
                    <p>Loading tasks...</p>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/50">
                    No tasks found for this workflow.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-6">
                      <div className="font-navbar text-base text-white font-medium">{task.title}</div>
                      <div className="font-navbar text-xs text-white/50 mb-2">{task.id}</div>
                      {task.skillsRequired && task.skillsRequired.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {task.skillsRequired.map(skill => (
                            <span key={skill} className="px-2 py-1 bg-white/10 text-white/70 rounded text-[10px] uppercase tracking-wider">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      <div className="font-navbar text-sm text-white">{task.storyPoints} Points</div>
                      <div className="font-navbar text-xs text-white/50">{task.estimatedHours} hrs</div>
                    </td>
                    <td className="p-6 font-navbar text-sm">
                      <span className={`font-medium ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-3">
                        {task.assignedTo && (() => {
                          const assignedEmp = employees.find(e => e.uid === task.assignedTo);
                          return (
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                                {(task.assignedToName || 'U').substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">{task.assignedToName}</span>
                                <span className="text-xs text-white/50">{assignedEmp?.designation || 'Employee'}</span>
                              </div>
                            </div>
                          );
                        })()}
                        <select
                          value={task.assignedTo || 'unassigned'}
                          onChange={(e) => handleAssignTask(task.id, e.target.value)}
                          className="bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-primary w-full max-w-[250px]"
                        >
                          <option value="unassigned" className="italic text-white/50">Unassigned</option>
                          {employees.map(emp => (
                            <option key={emp.uid} value={emp.uid}>
                              {emp.full_name} {emp.designation ? `- ${emp.designation}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(task.status)} uppercase tracking-wider`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkflowTasks;
