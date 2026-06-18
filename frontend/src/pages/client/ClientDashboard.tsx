import React from 'react';
import { WobbleCard } from '../../components/ui/wobble-card';
import CountUp from '@/components/ui/CountUp';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { products, workflows, isLoading } = useDashboardData();
  
  const clientName = user?.full_name?.split(' ')[0] || 'Client';

  // Calculate real stats
  const activeProductsCount = products.filter(p => p.status === 'in_progress').length;
  const completedProductsCount = products.filter(p => p.status === 'completed').length;
  
  // Aggregate budget (if we had it on the model, otherwise placeholder or 0)
  const totalBudget = products.reduce((acc, curr) => acc + (curr.estimatedBudget || 0), 0) / 1000; // in K

  const stats = [
    {
      title: 'Total Products',
      value: products.length.toString(),
      change: '+1',
      changeType: 'positive',
      icon: 'fas fa-box',
      color: 'text-primary'
    },
    {
      title: 'Active',
      value: activeProductsCount.toString(),
      change: '0',
      changeType: 'neutral',
      icon: 'fas fa-chart-line',
      color: 'text-warning'
    },
    {
      title: 'Completed',
      value: completedProductsCount.toString(),
      change: '+1',
      changeType: 'positive',
      icon: 'fas fa-check-circle',
      color: 'text-success'
    },
    {
      title: 'Total Budget',
      value: totalBudget.toString(),
      change: '+25',
      changeType: 'positive',
      icon: 'fas fa-dollar-sign',
      color: 'text-white'
    }
  ];

  // Map latest workflows to recent updates for the UI
  const recentUpdates = workflows.slice(0, 5).map(w => ({
    id: w.id,
    title: `Workflow ${w.status.replace('_', ' ')}: ${w.title}`,
    timestamp: new Date(w.updatedAt || Date.now()).toLocaleDateString(),
    type: w.status === 'completed' ? 'completed' : w.status === 'pending_approval' ? 'review_required' : 'milestone',
    project: w.title
  }));



  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-success/20 text-success',
      in_progress: 'bg-primary/20 text-primary',
      planning: 'bg-warning/20 text-warning',
      on_hold: 'bg-muted/20 text-muted-foreground'
    };
    return variants[status as keyof typeof variants] || 'bg-muted text-muted-foreground';
  };

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return 'fas fa-check-circle';
      case 'review_required':
        return 'fas fa-eye';
      case 'completed':
        return 'fas fa-star';
      default:
        return 'fas fa-clock';
    }
  };

  return (
    <div className="bg-black h-screen text-white p-6 flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between h-[10vh] justify-center">
        <div>
          <h1 className="text-4xl font-bold text-white font-navbar">Hello {clientName}! Here's your project overview</h1>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <span className="inline-flex items-center rounded-full px-2 py-1 text-lg font-medium bg-primary/20 text-primary">
            <i className="fas fa-user w-3 h-3 mr-1"></i>
            Client
          </span>
          <Link to="/app/client/products" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-lg font-medium ring-offset-background transition-colors bg-white/10 hover:bg-white/20 border border-white/20 text-white h-10 py-2 px-4">
            <i className="fas fa-plus w-4 h-4 mr-2"></i>
            New Product
          </Link>
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
              {stat.title === 'Total Budget' && <span className="text-2xl font-bold text-white font-navbar">K</span>}
            </div>
          </WobbleCard>
        ))}
        
        <WobbleCard containerClassName="bg-white/5 border border-white/20 col-span-3 row-span-3" className="h-full px-4 py-4 sm:px-6 flex flex-col">
          <div className="flex flex-row items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white font-navbar">My Products</h3>
              <p className="text-base text-white/70 font-navbar">Track progress and manage your product development</p>
            </div>
            <i className="fas fa-box text-lg text-primary"></i>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-white/50 font-navbar">Loading...</div>
            ) : products.length === 0 ? (
              <div className="p-4 text-center text-white/50 font-navbar">No products found. Create your first product request.</div>
            ) : (
              products.map((project) => (
                <div key={project.id} className="p-2 rounded-lg bg-white/5 border border-white/10 block">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white text-base font-navbar truncate">{project.title}</h4>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-sm font-medium font-navbar ${getStatusBadge(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-white/70 font-navbar mb-2">
                      <div>
                        <span className="block text-white font-medium">{project.priority}</span>
                        <span>Priority</span>
                      </div>
                      <div>
                        <span className="block text-white font-medium">${project.estimatedBudget?.toLocaleString() || 'TBD'}</span>
                        <span>Budget</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </WobbleCard>

        <WobbleCard containerClassName="bg-[#0f181a] border border-white/20" className="h-full px-4 py-4 sm:px-6 flex flex-col">
          <div className="flex flex-row items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white font-navbar">Recent Updates</h3>
            </div>
            <i className="fas fa-bell text-lg text-primary"></i>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {recentUpdates.slice(0, 3).map((update) => (
              <div key={update.id} className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20">
                <div>
                  <p className="text-sm font-medium text-white font-navbar truncate">{update.title.split(':')[1]?.trim() || update.title}</p>
                  <p className="text-sm text-white/70 font-navbar">{update.timestamp}</p>
                </div>
                <i className={`${getUpdateTypeIcon(update.type)} text-sm text-primary`}></i>
              </div>
            ))}
          </div>
        </WobbleCard>

        <WobbleCard containerClassName="bg-[#0f181a] border border-white/20" className="h-full px-4 py-4 sm:px-6 flex flex-col">
          <div className="flex flex-row items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white font-navbar">AI Assistant</h3>
            </div>
            <i className="fas fa-robot text-lg text-primary"></i>
          </div>
          <div className="flex flex-col gap-2 mb-4 flex-1">
            <p className="text-sm text-white/70 font-navbar">Generate workflows with AI</p>
          </div>
          <button className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg px-3 py-2 text-sm font-medium font-navbar transition-colors">
            + Create Workflow
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
              <i className="fas fa-box mr-2"></i>
              Add Product
            </button>
            <button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm font-medium font-navbar transition-colors flex items-center">
              <i className="fas fa-calendar mr-2"></i>
              Schedule Meeting
            </button>
          </div>
        </WobbleCard>
      </div>
    </div>
  );
};

export default ClientDashboard;