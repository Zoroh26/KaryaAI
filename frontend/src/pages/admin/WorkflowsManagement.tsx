import React, { useState, useEffect } from 'react';
import { workflowService } from '@/services/workflowService';
import { Workflow } from '@/types/api';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { ToastContainer, useToast } from '@/components/ui/Toast';

const WorkflowsManagement = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const { toasts, toast, removeToast } = useToast();
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; confirmLabel: string; variant: 'danger' | 'info'; onConfirm: () => void }>(
    { open: false, title: '', message: '', confirmLabel: 'Confirm', variant: 'danger', onConfirm: () => {} }
  );

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      const data = await workflowService.getWorkflows();
      setWorkflows(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await workflowService.approveWorkflow(id);
      toast.success('Workflow approved', 'Sprint planning has been triggered automatically.');
      setSelectedWorkflow(null);
      fetchWorkflows();
    } catch (err: any) {
      toast.error('Approval failed', err.message);
    }
  };

  const confirmApprove = (id: string) => {
    setConfirm({
      open: true,
      title: 'Approve Workflow',
      message: 'Approving this workflow will trigger automatic sprint planning and task assignment to available employees.',
      confirmLabel: 'Approve & Plan',
      variant: 'info',
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        await handleApprove(id);
      }
    });
  };

  const handleDelete = (id: string) => {
    setConfirm({
      open: true,
      title: 'Delete Workflow',
      message: 'Are you sure you want to permanently delete this workflow? This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        try {
          await workflowService.deleteWorkflow(id);
          toast.success('Workflow deleted', 'The workflow has been removed.');
          fetchWorkflows();
        } catch (err: any) {
          toast.error('Delete failed', err.message);
        }
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-success/20 text-success border-success/30';
      case 'in_progress':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'pending_approval':
      case 'generated':
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
        confirmLabel={confirm.confirmLabel}
        variant={confirm.variant}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-navbar">Workflows Management</h1>
          <p className="text-white/70 font-navbar mt-2">Approve AI-generated workflows and kick off sprint planning.</p>
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
                <th className="p-4 font-medium">Workflow</th>
                <th className="p-4 font-medium">Complexity</th>
                <th className="p-4 font-medium">Estimated Duration</th>
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
                    No workflows found.
                  </td>
                </tr>
              ) : (
                workflows.map((workflow) => (
                  <tr key={workflow.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="font-navbar text-sm text-white font-medium">{workflow.title}</div>
                      <div className="font-navbar text-xs text-white/50 truncate max-w-[200px]" title={workflow.description}>{workflow.description}</div>
                      <div className="font-navbar text-xs text-white/40 mt-1">Product ID: {workflow.productId}</div>
                    </td>
                    <td className="p-4 font-navbar text-sm">
                      <span className={`inline-flex items-center font-medium ${getPriorityBadge(workflow.complexity)}`}>
                        {workflow.complexity}
                      </span>
                    </td>
                    <td className="p-4 font-navbar text-sm text-white/80">
                      {workflow.estimatedDuration} <span className="text-white/40">({workflow.estimatedHours} hrs)</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(workflow.status)} uppercase tracking-wider`}>
                        {workflow.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedWorkflow(workflow)}
                          className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors font-navbar inline-flex items-center"
                        >
                          View Details
                        </button>
                        {(workflow.status === 'pending_approval' || workflow.status === 'generated') && (
                          <button 
                            onClick={() => confirmApprove(workflow.id)}
                            className="bg-primary hover:bg-primary/90 text-black px-3 py-1.5 rounded text-xs font-medium transition-colors font-navbar inline-flex items-center"
                          >
                            <i className="fas fa-check mr-1.5"></i> Approve
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(workflow.id)}
                          className="p-1.5 text-white/50 hover:text-red-400 transition-colors rounded hover:bg-white/10 opacity-0 group-hover:opacity-100" 
                          title="Delete Workflow"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Workflow Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f181a] border border-white/10 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold font-navbar text-white">Workflow Details</h2>
                <p className="text-white/50 text-sm font-navbar">Product ID: {selectedWorkflow.productId}</p>
              </div>
              <button 
                onClick={() => setSelectedWorkflow(null)}
                className="text-white/50 hover:text-white"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div>
                <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Title</h3>
                <div className="text-lg font-medium text-white">{selectedWorkflow.title}</div>
              </div>
              
              <div>
                <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Description</h3>
                <div className="text-white/80 text-sm bg-white/5 p-4 rounded-lg whitespace-pre-wrap">
                  {selectedWorkflow.description}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Status</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(selectedWorkflow.status)} uppercase tracking-wider`}>
                    {selectedWorkflow.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Complexity</h3>
                  <span className={`inline-flex items-center font-medium text-sm ${getPriorityBadge(selectedWorkflow.complexity)}`}>
                    {selectedWorkflow.complexity}
                  </span>
                </div>
                <div>
                  <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Priority</h3>
                  <span className={`inline-flex items-center font-medium text-sm ${getPriorityBadge(selectedWorkflow.priority)}`}>
                    {selectedWorkflow.priority}
                  </span>
                </div>
                <div>
                  <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Est. Time</h3>
                  <div className="text-white text-sm">{selectedWorkflow.estimatedDuration} <span className="text-white/40">({selectedWorkflow.estimatedHours}h)</span></div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3">
              <button
                onClick={() => setSelectedWorkflow(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 text-white hover:bg-white/5 transition-colors"
              >
                Close
              </button>
              {(selectedWorkflow.status === 'pending_approval' || selectedWorkflow.status === 'generated') && (
                <button
                  onClick={() => confirmApprove(selectedWorkflow.id)}
                  className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-black hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-check"></i> Approve & Plan Sprints
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowsManagement;
