import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Workflow, 
  Clock, 
  CheckCircle,
  Plus,
  Bot,
  Eye,
  MessageSquare,
  Star,
  Calendar,
  TrendingUp,
  Users
} from 'lucide-react';

const ClientDashboard = () => {
  const projects = [
    { 
      id: 1, 
      name: 'E-commerce Platform', 
      status: 'in_progress',
      progress: 75,
      totalTasks: 24,
      completedTasks: 18,
      deadline: '2025-09-15',
      budget: '$25,000'
    },
    { 
      id: 2, 
      name: 'Mobile App Redesign', 
      status: 'planning',
      progress: 25,
      totalTasks: 16,
      completedTasks: 4,
      deadline: '2025-10-01',
      budget: '$18,000'
    },
    { 
      id: 3, 
      name: 'Analytics Dashboard', 
      status: 'completed',
      progress: 100,
      totalTasks: 12,
      completedTasks: 12,
      deadline: '2025-08-20',
      budget: '$15,000'
    },
  ];

  const recentUpdates = [
    { 
      id: 1, 
      title: 'E-commerce Platform: Payment Integration Complete',
      timestamp: '2 hours ago',
      type: 'milestone',
      project: 'E-commerce Platform'
    },
    { 
      id: 2, 
      title: 'Mobile App: UI Mockups Ready for Review',
      timestamp: '1 day ago',
      type: 'review_required',
      project: 'Mobile App Redesign'
    },
    { 
      id: 3, 
      title: 'Analytics Dashboard: Project Completed',
      timestamp: '3 days ago',
      type: 'completed',
      project: 'Analytics Dashboard'
    },
  ];

  const stats = {
    totalProjects: 3,
    activeProjects: 2,
    completedProjects: 1,
    totalBudget: '$58,000'
  };

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
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'review_required':
        return <Eye className="w-4 h-4 text-warning" />;
      case 'completed':
        return <Star className="w-4 h-4 text-primary" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your projects and collaborate with our team</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Feedback
          </Button>
          <Button className="bg-gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            New Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-surface border-border/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stats.totalProjects}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-surface border-border/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stats.activeProjects}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-surface border-border/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stats.completedProjects}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-surface border-border/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stats.totalBudget}</p>
              </div>
              <Users className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-surface border-border/20">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">My Products</CardTitle>
              <CardDescription>Track progress and manage your product development</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {projects.map((project) => (
                <div key={project.id} className="p-4 rounded-lg bg-card/50 border border-border/10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-foreground">{project.name}</h4>
                        <Badge className={getStatusBadge(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                        <div>
                          <span className="block text-foreground font-medium">{project.completedTasks}/{project.totalTasks}</span>
                          <span>Tasks</span>
                        </div>
                        <div>
                          <span className="block text-foreground font-medium">{project.progress}%</span>
                          <span>Complete</span>
                        </div>
                        <div>
                          <span className="block text-foreground font-medium">{project.deadline}</span>
                          <span>Deadline</span>
                        </div>
                        <div>
                          <span className="block text-foreground font-medium">{project.budget}</span>
                          <span>Budget</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-foreground">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-2 border-t border-border/10">
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm" variant="ghost">
                      <MessageSquare className="w-3 h-3 mr-2" />
                      Feedback
                    </Button>
                    {project.status === 'planning' && (
                      <Button size="sm" className="bg-gradient-primary">
                        <Bot className="w-3 h-3 mr-2" />
                        Generate Workflow
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Updates */}
          <Card className="bg-gradient-surface border-border/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Recent Updates</CardTitle>
              <CardDescription>Latest project activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentUpdates.map((update) => (
                <div key={update.id} className="flex items-start space-x-3 p-3 rounded-lg bg-card/30 border border-border/10">
                  {getUpdateTypeIcon(update.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{update.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">{update.project}</p>
                      <p className="text-xs text-muted-foreground">{update.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Workflow Generator */}
          <Card className="bg-gradient-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <Bot className="w-4 h-4 mr-2 text-primary" />
                AI Workflow Generator
              </CardTitle>
              <CardDescription>Describe your product and get an instant workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Simply describe what you want to build, and our AI will create a complete workflow with tasks and timelines.
              </p>
              <Button className="w-full bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-surface border-border/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Package className="w-4 h-4 mr-2" />
                Add Product
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Workflow className="w-4 h-4 mr-2" />
                View Workflows
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;