import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckSquare, 
  Clock, 
  Calendar, 
  Target,
  Play,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Award,
  User
} from 'lucide-react';

const EmployeeDashboard = () => {
  const myTasks = [
    { 
      id: 1, 
      title: 'Setup CI/CD Pipeline', 
      description: 'Configure automated deployment pipeline for the project',
      status: 'in_progress', 
      priority: 'high',
      deadline: '2025-09-05',
      progress: 65
    },
    { 
      id: 2, 
      title: 'Code Review: Authentication Module', 
      description: 'Review and approve authentication implementation',
      status: 'assigned', 
      priority: 'medium',
      deadline: '2025-09-03',
      progress: 0
    },
    { 
      id: 3, 
      title: 'Update Documentation', 
      description: 'Update API documentation with latest changes',
      status: 'assigned', 
      priority: 'low',
      deadline: '2025-09-07',
      progress: 0
    },
  ];

  const completedToday = [
    { id: 4, title: 'Database Schema Update', completedAt: '10:30 AM' },
    { id: 5, title: 'Bug Fix: Login Issue', completedAt: '2:15 PM' },
  ];

  const stats = {
    totalTasks: 5,
    completedTasks: 2,
    inProgress: 1,
    avgCompletionTime: '2.3 days'
  };

  const skills = ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS'];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'in_progress':
        return <Play className="w-4 h-4 text-primary" />;
      case 'assigned':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's on your plate today.</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Badge className="bg-success/20 text-success">
            <User className="w-3 h-3 mr-1" />
            Available
          </Badge>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-surface border-border/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Tasks</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stats.totalTasks}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-surface border-border/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stats.completedTasks}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-surface border-border/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stats.inProgress}</p>
              </div>
              <Play className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-surface border-border/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Time</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stats.avgCompletionTime}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-surface border-border/20">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">My Active Tasks</CardTitle>
              <CardDescription>Tasks currently assigned to you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myTasks.map((task) => (
                <div key={task.id} className="p-4 rounded-lg bg-card/50 border border-border/10 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(task.status)}
                        <h4 className="font-medium text-foreground">{task.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge className={getStatusBadge(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityBadge(task.priority)}>
                          {task.priority} priority
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Due: {task.deadline}
                        </Badge>
                      </div>
                      {task.progress > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="text-foreground">{task.progress}%</span>
                          </div>
                          <Progress value={task.progress} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-2 border-t border-border/10">
                    {task.status === 'assigned' && (
                      <Button size="sm" className="bg-gradient-primary">
                        <Play className="w-3 h-3 mr-2" />
                        Start Task
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button size="sm" variant="outline">
                        <CheckCircle className="w-3 h-3 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Completed Today */}
          <Card className="bg-gradient-surface border-border/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <Award className="w-4 h-4 mr-2 text-success" />
                Completed Today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedToday.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.completedAt}</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-success" />
                </div>
              ))}
              {completedToday.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No tasks completed today</p>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="bg-gradient-surface border-border/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold">My Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="mt-3 text-primary">
                + Add Skill
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
                <Calendar className="w-4 h-4 mr-2" />
                View Schedule
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                Set Availability
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <User className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;