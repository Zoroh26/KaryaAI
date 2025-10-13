import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CheckSquare, 
  Workflow, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Bot,
  Zap,
  Calendar,
  BarChart3,
  UserPlus,
  Settings,
  PlusCircle
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { taskService } from '@/services/taskService';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const { tasks, users, workflows, products, isLoading, error, refetch } = useDashboardData();
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  // Calculate statistics from real data
  const stats = [
    {
      title: 'Total Users',
      value: users.length.toString(),
      change: '+12%', // This would come from API in real implementation
      changeType: 'positive',
      icon: Users,
      color: 'text-info'
    },
    {
      title: 'Active Tasks',
      value: tasks.filter(task => task.status === 'in_progress').length.toString(),
      change: '+8%',
      changeType: 'positive',
      icon: CheckSquare,
      color: 'text-success'
    },
    {
      title: 'Workflows',
      value: workflows.length.toString(),
      change: '+15%',
      changeType: 'positive',
      icon: Workflow,
      color: 'text-primary'
    },
    {
      title: 'Efficiency',
      value: '94%', // This would be calculated from task completion data
      change: '+3%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-accent'
    }
  ];

  const handleAutoAssign = async () => {
    const unassignedTasks = tasks.filter(task => !task.assignedTo);
    
    if (unassignedTasks.length === 0) {
      toast({
        title: "No Unassigned Tasks",
        description: "All tasks are already assigned.",
      });
      return;
    }

    setIsAssigning(true);
    try {
      const taskIds = unassignedTasks.map(task => task.id);
      await taskService.assignTasks(taskIds);
      
      toast({
        title: "Tasks Assigned Successfully",
        description: `${taskIds.length} tasks have been automatically assigned.`,
      });
      
      // Refresh data
      refetch();
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Use real data instead of mock data
  const recentTasks = tasks.slice(0, 4);
  const unassignedTasks = tasks.filter(task => !task.assignedTo).slice(0, 3);

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-success/20 text-success',
      in_progress: 'bg-primary/20 text-primary',
      assigned: 'bg-warning/20 text-warning'
    };
    return variants[status as keyof typeof variants] || 'bg-muted text-muted-foreground';
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'bg-destructive/20 text-destructive',
      medium: 'bg-warning/20 text-warning',
      low: 'bg-success/20 text-success'
    };
    return variants[priority as keyof typeof variants] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your team and projects efficiently</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            View Reports
          </Button>
          <Button className="bg-gradient-primary" onClick={handleAutoAssign} disabled={isAssigning}>
            <Bot className="w-4 h-4 mr-2" />
            {isAssigning ? 'Assigning...' : 'Auto-Assign Tasks'}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-gradient-surface border-border/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-3 h-3 text-success mr-1" />
                    <span className="text-xs text-success">{stat.change}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-background flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unassigned Tasks */}
        <Card className="bg-gradient-surface border-border/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Unassigned Tasks</CardTitle>
              <CardDescription>Tasks waiting for assignment</CardDescription>
            </div>
            <AlertCircle className="w-4 h-4 text-warning" />
          </CardHeader>
          <CardContent className="space-y-4">
            {unassignedTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/10">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{task.title}</h4>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getPriorityBadge(task.priority)}>
                      {task.priority}
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {task.requiredSkills?.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Assign
                </Button>
              </div>
            ))}
            <Button className="w-full bg-gradient-primary" size="sm" onClick={handleAutoAssign} disabled={isAssigning}>
              <Zap className="w-4 h-4 mr-2" />
              {isAssigning ? 'Assigning...' : 'Auto-Assign All'}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="bg-gradient-surface border-border/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <CardDescription>Latest task updates and assignments</CardDescription>
            </div>
            <Clock className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/10">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{task.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {task.assignedToName ? `Assigned to ${task.assignedToName}` : 'Unassigned'}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getStatusBadge(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityBadge(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              View All Tasks
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-surface border-border/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="w-6 h-6" />
              <span className="text-sm">Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Workflow className="w-6 h-6" />
              <span className="text-sm">Create Workflow</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm">View Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Bot className="w-6 h-6" />
              <span className="text-sm">AI Assistant</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;