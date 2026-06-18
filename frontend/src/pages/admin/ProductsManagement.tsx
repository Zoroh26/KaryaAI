import React, { useState, useEffect } from 'react';
import { productService } from '@/services/productService';
import { workflowService } from '@/services/workflowService';
import { Product } from '@/types/api';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { ToastContainer, useToast } from '@/components/ui/Toast';

const ProductsManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toasts, toast, removeToast } = useToast();
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>(
    { open: false, title: '', message: '', onConfirm: () => {} }
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getProducts();
      setProducts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await productService.updateProductStatus(id, newStatus);
      toast.success('Status updated', 'The product status has been changed.');
      fetchProducts();
    } catch (err: any) {
      toast.error('Failed to update status', err.message);
    }
  };

  const handleDelete = (id: string) => {
    setConfirm({
      open: true,
      title: 'Archive Product',
      message: 'Are you sure you want to soft-delete this product? It will be archived but can be restored later.',
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        try {
          await productService.deleteProduct(id);
          toast.success('Product archived', 'The product has been soft-deleted.');
          fetchProducts();
        } catch (err: any) {
          toast.error('Delete failed', err.message);
        }
      }
    });
  };

  const handleGenerateWorkflow = async () => {
    if (!selectedProduct) return;
    setIsGenerating(true);
    try {
      await workflowService.generateWorkflow({
        productId: selectedProduct.id,
        title: selectedProduct.title,
        description: selectedProduct.description
      });
      // After successful generation, update status to approved
      await productService.updateProductStatus(selectedProduct.id, 'approved');
      toast.success('Workflow Generated', 'The product has been approved and a workflow has been created.');
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      toast.error('Generation Failed', err.message || 'Failed to generate workflow.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProduct) return;
    try {
      await productService.updateProductStatus(selectedProduct.id, 'rejected');
      toast.success('Product Rejected', 'The product request has been rejected.');
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      toast.error('Rejection Failed', err.message || 'Failed to reject product.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 text-success border-success/30';
      case 'in_progress':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'pending_review':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'approved':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'rejected':
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
        confirmLabel="Archive"
        variant="danger"
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-navbar">Product Management</h1>
          <p className="text-white/70 font-navbar mt-2">Oversee all client product requests and manage their statuses.</p>
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
                <th className="p-4 font-medium">Product Details</th>
                <th className="p-4 font-medium">Client Info</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/50">
                    <i className="fas fa-spinner fa-spin text-2xl mb-2 text-primary"></i>
                    <p>Loading products...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/50">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="font-navbar text-sm text-white font-medium">{product.title}</div>
                      <div className="font-navbar text-xs text-white/50 truncate max-w-xs">{product.description}</div>
                      {product.category && (
                        <span className="inline-block mt-1 bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded">
                          {product.category}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-navbar text-sm text-white">{product.clientName || 'Unknown Client'}</div>
                      <div className="font-navbar text-xs text-white/50">{product.clientId}</div>
                    </td>
                    <td className="p-4 font-navbar text-sm">
                      <span className={`inline-flex items-center font-medium ${getPriorityBadge(product.priority)}`}>
                        {product.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(product.status)} uppercase tracking-wider`}>
                        {product.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className={`${
                            product.status === 'pending_review'
                              ? 'bg-primary hover:bg-primary/90 text-black'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          } px-3 py-1 text-xs font-medium rounded transition-colors font-navbar whitespace-nowrap`}
                        >
                          {product.status === 'pending_review' ? 'Review' : 'View'}
                        </button>
                        
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-white/50 hover:text-red-400 transition-colors rounded hover:bg-white/10 opacity-0 group-hover:opacity-100" 
                          title="Delete Product"
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
      {/* Review Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f181a] border border-white/10 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold font-navbar text-white">
                  {selectedProduct.status === 'pending_review' ? 'Review Product Request' : 'Product Details'}
                </h2>
                <p className="text-white/50 text-sm font-navbar">
                  {selectedProduct.status === 'pending_review' ? 'Review details and approve/reject' : 'View product details'}
                </p>
              </div>
              <button 
                onClick={() => !isGenerating && setSelectedProduct(null)}
                className="text-white/50 hover:text-white"
                disabled={isGenerating}
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Core Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Title</h3>
                  <div className="text-lg font-medium text-white">{selectedProduct.title}</div>
                </div>
                
                <div>
                  <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Description</h3>
                  <div className="text-white/80 text-sm bg-white/5 p-4 rounded-lg">{selectedProduct.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Client</h3>
                    <div className="text-white text-sm">{selectedProduct.clientName || 'Unknown'}</div>
                  </div>
                  <div>
                    <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Category</h3>
                    <div className="text-white text-sm">{selectedProduct.category || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Extended Details */}
              <div className="space-y-4 border-t border-white/10 pt-4">
                <h3 className="text-lg font-medium font-navbar text-white mb-2">Extended Brief</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Target Audience</h3>
                    <div className="text-white/80 text-sm">{selectedProduct.targetAudience || 'Not specified'}</div>
                  </div>
                  <div>
                    <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Platform Type</h3>
                    <div className="text-white/80 text-sm">{selectedProduct.platformType || 'Not specified'}</div>
                  </div>
                  <div>
                    <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Tech Preferences</h3>
                    <div className="text-white/80 text-sm">{selectedProduct.techPreferences || 'Not specified'}</div>
                  </div>
                  <div>
                    <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Budget</h3>
                    <div className="text-white/80 text-sm">
                      {selectedProduct.estimatedBudget ? `₹${selectedProduct.estimatedBudget.toLocaleString()}` : 'Not specified'}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Key Features</h3>
                  <div className="text-white/80 text-sm bg-white/5 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedProduct.keyFeatures || 'Not specified'}
                  </div>
                </div>

                <div>
                  <h3 className="text-white/50 text-xs uppercase tracking-wider mb-1 font-navbar">Success Criteria</h3>
                  <div className="text-white/80 text-sm bg-white/5 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedProduct.successCriteria || 'Not specified'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-black/20 flex justify-between items-center">
              <div>
                {selectedProduct.status !== 'pending_review' && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white/50">Change Status:</span>
                    <select
                      value={selectedProduct.status}
                      onChange={(e) => {
                        handleStatusChange(selectedProduct.id, e.target.value);
                        setSelectedProduct(null); // Close modal on change
                      }}
                      className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    >
                      <option value="approved">Approved</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 text-white hover:bg-white/5 transition-colors"
                  disabled={isGenerating}
                >
                  Close
                </button>
                {selectedProduct.status === 'pending_review' && (
                  <>
                    <button
                      onClick={handleReject}
                      disabled={isGenerating}
                      className="px-6 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleGenerateWorkflow}
                      disabled={isGenerating}
                      className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-black hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <><i className="fas fa-spinner fa-spin"></i> Generating Workflow...</>
                      ) : (
                        <><i className="fas fa-magic"></i> Approve & Generate Workflow</>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManagement;
