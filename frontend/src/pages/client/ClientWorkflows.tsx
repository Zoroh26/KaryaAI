import React, { useState, useEffect } from 'react';
import { workflowService } from '@/services/workflowService';
import { Workflow } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const ClientWorkflows = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      // The backend /api/workflows/my-workflows automatically filters by client ID if the role is 'client'
      const data = await workflowService.getMyWorkflows();
      setWorkflows(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
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
      case 'draft':
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="bg-black min-h-screen text-white p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-navbar">My Workflows</h1>
          <p className="text-white/70 font-navbar mt-2">Track the execution plans generated for your products.</p>
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
          <p className="font-navbar">Loading your workflows...</p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="p-12 text-center border border-white/10 border-dashed rounded-xl bg-white/5">
          <i className="fas fa-diagram-project text-4xl text-white/30 mb-4"></i>
          <h3 className="text-lg font-medium text-white font-navbar">No Workflows Generated Yet</h3>
          <p className="text-white/50 font-navbar mt-1">Once you submit a product, an AI workflow will be generated here.</p>
          <Link to="/app/client/products" className="mt-4 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors border border-white/20 bg-white/10 hover:bg-white/20 text-white h-10 px-4 py-2 font-navbar">
            Go to Products
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-[#0f181a] border border-white/10 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white font-navbar">{workflow.title}</h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(workflow.status)} uppercase tracking-wider`}>
                      {workflow.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-white/60 font-navbar mb-4 leading-relaxed">
                    {workflow.description}
                  </p>
                </div>
                <div className="md:w-64 bg-black/40 rounded-lg p-4 border border-white/5 shrink-0 flex flex-col gap-3">
                  <div>
                    <div className="text-xs text-white/40 font-navbar uppercase tracking-wider mb-1">Estimated Time</div>
                    <div className="text-lg font-medium text-white font-navbar flex items-center">
                      <i className="fas fa-clock text-primary mr-2"></i>
                      {workflow.estimatedDuration} <span className="text-sm text-white/40 ml-2">({workflow.estimatedHours}h)</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40 font-navbar uppercase tracking-wider mb-1">Complexity</div>
                    <div className="font-medium text-white font-navbar flex items-center">
                      <i className="fas fa-layer-group text-primary mr-2"></i>
                      {workflow.complexity}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40 font-navbar uppercase tracking-wider mb-1">Product ID</div>
                    <div className="text-sm text-white/70 font-navbar font-mono truncate" title={workflow.productId}>
                      {workflow.productId}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                <button className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors font-navbar">
                  View Full Plan <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientWorkflows;
