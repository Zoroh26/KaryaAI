import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Workflow,
  BarChart3,
  Settings,
  Bot,
  Briefcase,
  Package,
  Calendar,
  User,
  MessageSquare,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const adminNavigation = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, exact: true },
      { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
    ]
  },
  {
    title: 'Management',
    items: [
      { title: 'Users', url: '/admin/users', icon: Users },
      { title: 'Tasks', url: '/admin/tasks', icon: CheckSquare },
      { title: 'Workflows', url: '/admin/workflows', icon: Workflow },
    ]
  },
  {
    title: 'System',
    items: [
      { title: 'Settings', url: '/admin/settings', icon: Settings },
    ]
  }
];

const employeeNavigation = [
  {
    title: 'Work',
    items: [
      { title: 'Dashboard', url: '/employee', icon: LayoutDashboard, exact: true },
      { title: 'My Tasks', url: '/employee/tasks', icon: CheckSquare },
      { title: 'Schedule', url: '/employee/schedule', icon: Calendar },
    ]
  },
  {
    title: 'Personal',
    items: [
      { title: 'Profile', url: '/employee/profile', icon: User },
    ]
  }
];

const clientNavigation = [
  {
    title: 'Projects',
    items: [
      { title: 'Dashboard', url: '/client', icon: LayoutDashboard, exact: true },
      { title: 'Products', url: '/client/products', icon: Package },
      { title: 'Workflows', url: '/client/workflows', icon: Workflow },
    ]
  },
  {
    title: 'Communication',
    items: [
      { title: 'Updates', url: '/client/updates', icon: Bell },
      { title: 'Feedback', url: '/client/feedback', icon: MessageSquare },
    ]
  }
];

const getNavigation = (role: string) => {
  switch (role) {
    case 'admin':
      return adminNavigation;
    case 'employee':
      return employeeNavigation;
    case 'client':
      return clientNavigation;
    default:
      return [];
  }
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const navigation = getNavigation(user?.role || 'admin');

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const getNavClassName = (path: string, exact = false) => {
    const active = isActive(path, exact);
    return active 
      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center space-x-3 px-4 py-6">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">KaryaAI</h2>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role || 'admin'} Portal</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {navigation.map((section) => (
          <SidebarGroup key={section.title}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/60 font-medium px-2">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClassName(item.url, item.exact)}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <item.icon className="w-4 h-4" />
                        {!isCollapsed && <span className="ml-3">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}