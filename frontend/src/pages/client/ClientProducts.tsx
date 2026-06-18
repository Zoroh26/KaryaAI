import React, { useState, useEffect } from 'react';
import { productService } from '@/services/productService';
import { Product } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProductForm {
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  estimatedBudget: string;
  deadline: string;
  targetAudience: string;
  platformType: string;
  techPreferences: string;
  keyFeatures: string;
  successCriteria: string;
  additionalNotes: string;
}

const INITIAL_FORM: ProductForm = {
  title: '',
  description: '',
  category: '',
  priority: 'Medium',
  estimatedBudget: '',
  deadline: '',
  targetAudience: '',
  platformType: '',
  techPreferences: '',
  keyFeatures: '',
  successCriteria: '',
  additionalNotes: '',
};

const CATEGORIES = [
  'Web Application', 'Mobile App (iOS/Android)', 'Desktop Software', 'E-commerce Platform',
  'API / Backend Service', 'Data Analytics / Dashboard', 'AI / ML Feature', 'DevOps / Infra',
  'UI/UX Design', 'Other'
];

const PLATFORMS = [
  'Web (Browser)', 'iOS', 'Android', 'Cross-Platform Mobile', 'Desktop (Windows/Mac)', 'Cloud / SaaS', 'Other'
];

// ─── ClientProducts ───────────────────────────────────────────────────────────
const ClientProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, toast, removeToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ProductForm>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1 = Basic, 2 = Details, 3 = Requirements

  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getMyProducts();
      setProducts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setFormData(INITIAL_FORM);
    setFormStep(1);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: Partial<Product> = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : undefined,
        deadline: formData.deadline || undefined,
        clientId: user?.uid || '',
        status: 'pending_review',
        // extended fields stored as metadata
        ...({
          targetAudience: formData.targetAudience,
          platformType: formData.platformType,
          techPreferences: formData.techPreferences,
          keyFeatures: formData.keyFeatures,
          successCriteria: formData.successCriteria,
          additionalNotes: formData.additionalNotes,
        } as any),
      };
      await productService.createProduct(payload);
      toast.success('Product submitted!', 'Your product request has been sent for review.');
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error('Submission failed', err.message || 'Could not submit product request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/20 text-success border-success/30';
      case 'in_progress': return 'bg-primary/20 text-primary border-primary/30';
      case 'pending_review': return 'bg-warning/20 text-warning border-warning/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'High') return 'text-red-400';
    if (priority === 'Medium') return 'text-yellow-400';
    return 'text-green-400';
  };

  // Format deadline string
  const formatDate = (d?: any) => {
    if (!d) return '—';
    try {
      const date = d?.toDate ? d.toDate() : new Date(d);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  // Steps
  const STEPS = [
    { label: 'Overview', icon: 'fas fa-info-circle' },
    { label: 'Timeline & Budget', icon: 'fas fa-calendar-alt' },
    { label: 'Requirements', icon: 'fas fa-list-check' },
  ];

  return (
    <div className="bg-black min-h-screen text-white p-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-navbar">My Products</h1>
          <p className="text-white/70 font-navbar mt-2">Manage your product requests and track their development.</p>
        </div>
        <button
          onClick={openModal}
          className="mt-4 sm:mt-0 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary hover:bg-primary/90 text-black h-10 px-4 py-2 font-navbar"
        >
          <i className="fas fa-plus"></i> New Product Request
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6">
          <i className="fas fa-exclamation-circle mr-2"></i>{error}
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-white/50">
            <i className="fas fa-spinner fa-spin text-2xl mb-2 text-primary block mb-2"></i>
            <p>Loading your products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-white/10 border-dashed rounded-xl bg-white/5">
            <i className="fas fa-box-open text-4xl text-white/30 mb-4 block"></i>
            <h3 className="text-lg font-medium text-white font-navbar">No Products Yet</h3>
            <p className="text-white/50 font-navbar mt-1">Submit your first product request to get started.</p>
            <button
              onClick={openModal}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors border border-white/20 bg-white/10 hover:bg-white/20 text-white h-10 px-4 py-2 font-navbar"
            >
              Create Request
            </button>
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="bg-[#0f181a] border border-white/10 rounded-xl p-5 hover:border-white/30 transition-all flex flex-col h-full cursor-pointer group"
              onClick={() => setViewProduct(product)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white font-navbar truncate">{product.title}</h3>
                  {product.category && (
                    <span className="inline-block mt-1 bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded">
                      {product.category}
                    </span>
                  )}
                </div>
                <span className={`shrink-0 ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(product.status)}`}>
                  {product.status.replace(/_/g, ' ')}
                </span>
              </div>

              <p className="text-white/60 text-sm font-navbar mb-4 flex-1 line-clamp-2">{product.description}</p>

              <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs font-navbar text-white/40">
                <div>
                  <span className="block text-white/20 uppercase tracking-wider text-[10px] mb-0.5">Priority</span>
                  <span className={`font-medium ${getPriorityIcon(product.priority)}`}>{product.priority}</span>
                </div>
                <div>
                  <span className="block text-white/20 uppercase tracking-wider text-[10px] mb-0.5">Deadline</span>
                  <span className="text-white/60">{formatDate(product.deadline)}</span>
                </div>
                {product.estimatedBudget && (
                  <div className="col-span-2">
                    <span className="block text-white/20 uppercase tracking-wider text-[10px] mb-0.5">Budget</span>
                    <span className="text-white/60">₹{product.estimatedBudget.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex justify-end">
                <span className="text-primary text-xs font-medium font-navbar group-hover:underline">
                  View Details <i className="fas fa-arrow-right ml-1"></i>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Product Detail View Modal ─── */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121c1e] border border-white/10 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-xl font-bold font-navbar">{viewProduct.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {viewProduct.category && (
                    <span className="bg-white/10 text-white/60 text-xs px-2 py-0.5 rounded font-navbar">{viewProduct.category}</span>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(viewProduct.status)}`}>
                    {viewProduct.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewProduct(null)} className="text-white/50 hover:text-white transition-colors ml-4">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-xs text-white/40 uppercase tracking-widest mb-1 font-navbar">Description</h4>
                <p className="text-sm text-white/80 font-navbar leading-relaxed">{viewProduct.description}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Priority', value: viewProduct.priority },
                  { label: 'Deadline', value: formatDate(viewProduct.deadline) },
                  { label: 'Budget', value: viewProduct.estimatedBudget ? `₹${viewProduct.estimatedBudget.toLocaleString()}` : '—' },
                  { label: 'Target Audience', value: (viewProduct as any).targetAudience || '—' },
                  { label: 'Platform', value: (viewProduct as any).platformType || '—' },
                  { label: 'Tech Preferences', value: (viewProduct as any).techPreferences || '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span className="block text-white/30 text-[10px] uppercase tracking-widest font-navbar mb-0.5">{label}</span>
                    <span className="text-sm text-white/80 font-navbar">{value}</span>
                  </div>
                ))}
              </div>
              {(viewProduct as any).keyFeatures && (
                <div>
                  <h4 className="text-xs text-white/40 uppercase tracking-widest mb-1 font-navbar">Key Features</h4>
                  <p className="text-sm text-white/80 font-navbar leading-relaxed whitespace-pre-wrap">{(viewProduct as any).keyFeatures}</p>
                </div>
              )}
              {(viewProduct as any).successCriteria && (
                <div>
                  <h4 className="text-xs text-white/40 uppercase tracking-widest mb-1 font-navbar">Success Criteria</h4>
                  <p className="text-sm text-white/80 font-navbar leading-relaxed whitespace-pre-wrap">{(viewProduct as any).successCriteria}</p>
                </div>
              )}
              {(viewProduct as any).additionalNotes && (
                <div>
                  <h4 className="text-xs text-white/40 uppercase tracking-widest mb-1 font-navbar">Additional Notes</h4>
                  <p className="text-sm text-white/80 font-navbar leading-relaxed whitespace-pre-wrap">{(viewProduct as any).additionalNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Create Product Modal (Multi-step) ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121c1e] border border-white/10 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 shrink-0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-navbar">Submit New Product Request</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              {/* Step indicators */}
              <div className="flex gap-1">
                {STEPS.map((step, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormStep(i + 1)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium font-navbar transition-colors ${
                      formStep === i + 1
                        ? 'bg-primary text-black'
                        : formStep > i + 1
                        ? 'bg-primary/20 text-primary'
                        : 'bg-white/5 text-white/40'
                    }`}
                  >
                    <i className={step.icon}></i>
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-4">

                {/* ─── Step 1: Overview ─── */}
                {formStep === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Product Title <span className="text-red-400">*</span></label>
                      <input
                        type="text" required
                        value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Inventory Management System"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Category</label>
                        <select
                          value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors appearance-none"
                        >
                          <option value="">Select a category</option>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Priority</label>
                        <select
                          value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors appearance-none"
                        >
                          <option value="Low">🟢 Low</option>
                          <option value="Medium">🟡 Medium</option>
                          <option value="High">🔴 High</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Platform / Type</label>
                      <select
                        value={formData.platformType} onChange={(e) => setFormData({ ...formData, platformType: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors appearance-none"
                      >
                        <option value="">Select a platform</option>
                        {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Project Description <span className="text-red-400">*</span></label>
                      <textarea
                        required rows={4}
                        value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Provide a high-level overview of the product — its purpose, goals, and what problem it solves…"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Target Audience</label>
                      <input
                        type="text"
                        value={formData.targetAudience} onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                        placeholder="e.g., Small business owners, B2B SaaS teams, students"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </>
                )}

                {/* ─── Step 2: Timeline & Budget ─── */}
                {formStep === 2 && (
                  <>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-2">
                      <p className="text-xs text-primary/80 font-navbar">
                        <i className="fas fa-info-circle mr-1.5"></i>
                        Timeline and budget are estimates. Our team will confirm feasibility after reviewing your request.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Deadline</label>
                        <input
                          type="date"
                          value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Estimated Budget (₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">₹</span>
                          <input
                            type="number" min={0}
                            value={formData.estimatedBudget} onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                            placeholder="0"
                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-8 pr-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Technology Preferences</label>
                      <input
                        type="text"
                        value={formData.techPreferences} onChange={(e) => setFormData({ ...formData, techPreferences: e.target.value })}
                        placeholder="e.g., React, Node.js, AWS, PostgreSQL — or 'No preference'"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors"
                      />
                      <p className="text-xs text-white/30 mt-1 font-navbar">Mention any specific tech stack or tool preferences you have.</p>
                    </div>
                  </>
                )}

                {/* ─── Step 3: Requirements ─── */}
                {formStep === 3 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Key Features & Functionality</label>
                      <textarea
                        rows={4}
                        value={formData.keyFeatures} onChange={(e) => setFormData({ ...formData, keyFeatures: e.target.value })}
                        placeholder="List the core features you want in this product. E.g.:&#10;• User authentication & role management&#10;• Real-time notifications&#10;• Analytics dashboard&#10;• Multi-language support"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Success Criteria</label>
                      <textarea
                        rows={3}
                        value={formData.successCriteria} onChange={(e) => setFormData({ ...formData, successCriteria: e.target.value })}
                        placeholder="How will you measure success? E.g.: The platform should handle 1000 concurrent users, load times under 2s, 99% uptime…"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Additional Notes / References</label>
                      <textarea
                        rows={3}
                        value={formData.additionalNotes} onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                        placeholder="Any competitor references, design inspirations, compliance requirements, or other context…"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors resize-none"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex justify-between items-center border-t border-white/10 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => formStep > 1 ? setFormStep(formStep - 1) : setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors font-navbar"
                >
                  {formStep > 1 ? <><i className="fas fa-arrow-left mr-2"></i>Back</> : 'Cancel'}
                </button>
                <div className="flex gap-2">
                  {formStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setFormStep(formStep + 1)}
                      disabled={formStep === 1 && (!formData.title || !formData.description)}
                      className="px-5 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90 text-black transition-colors font-navbar disabled:opacity-40 flex items-center gap-2"
                    >
                      Next <i className="fas fa-arrow-right"></i>
                    </button>
                  ) : (
                    <button
                      type="submit" disabled={isSubmitting}
                      className="px-5 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90 text-black transition-colors font-navbar disabled:opacity-60 flex items-center gap-2"
                    >
                      {isSubmitting && <i className="fas fa-spinner fa-spin text-xs"></i>}
                      Submit Request
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProducts;
