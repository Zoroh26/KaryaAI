import React, { useState, useEffect } from 'react';
import { workflowService } from '@/services/workflowService';
import { Workflow } from '@/types/api';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { useNavigate } from 'react-router-dom';

const TasksManagement = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, toast, removeToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      const data = await workflowService.getWorkflows();
      // Filter out drafts or workflows without tasks if needed, but for now show all approved/generated ones
      setWorkflows(data.filter(w => w.status !== 'draft' && w.status !== 'cancelled'));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load workflows');
    } finally {
      setIsLoading(false);
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
          <h1 className="text-3xl font-bold text-white font-navbar">Task Assignment Groups</h1>
          <p className="text-white/70 font-navbar mt-2">Select a workflow to view and manage its tasks and assignments.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      <div className="bg-[#0f181a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-white/50 text-xs uppercase tracking-wider font-navbar">
                <th className="p-4 font-medium">Workflow Title</th>
                <th className="p-4 font-medium">Complexity</th>
                <th className="p-4 font-medium">Est. Duration</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/50">
                    <i className="fas fa-spinner fa-spin text-2xl mb-2 text-primary"></i>
                    <p>Loading workflows...</p>
                  </td>
                </tr>
              ) : workflows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/50">
                    No active workflows found.
                  </td>
                </tr>
              ) : (
                workflows.map((workflow) => (
                  <tr key={workflow.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => navigate(`/app/admin/tasks/${workflow.id}`)}>
                    <td className="p-4">
                      <div className="font-navbar text-sm text-white font-medium">{workflow.title}</div>
                      <div className="font-navbar text-xs text-white/50 truncate max-w-xs">{workflow.description}</div>
                    </td>
                    <td className="p-4 font-navbar text-sm">
                      <span className={`inline-flex items-center font-medium ${getPriorityBadge(workflow.complexity)}`}>
                        {workflow.complexity}
                      </span>
                    </td>
                    <td className="p-4 font-navbar text-sm text-white/80">
                      {workflow.estimatedDuration} <span className="text-white/40">({workflow.estimatedHours}h)</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(workflow.status)} uppercase tracking-wider`}>
                        {workflow.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/app/admin/tasks/${workflow.id}`); }}
                        className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors font-navbar inline-flex items-center"
                      >
                        Manage Tasks <i className="fas fa-arrow-right ml-1.5"></i>
                      </button>
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

export default TasksManagement;
