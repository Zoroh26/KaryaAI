import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { taskService } from '@/services/taskService';
import { productService } from '@/services/productService';
import { userService } from '@/services/userService';
import { workflowService } from '@/services/workflowService';
import { Task, Product, Workflow } from '@/types/api';
import { User } from '@/types/auth';

interface DashboardData {
  tasks: Task[];
  products: Product[];
  workflows: Workflow[];
  users: User[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboardData = (): DashboardData => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const [tasksData, productsData, workflowsData, usersData] = await Promise.allSettled([
        // Fetch tasks based on user role
        user.role === 'employee' 
          ? taskService.getMyTasks()
          : taskService.getTasks(),
        
        // Fetch products
        productService.getProducts(),
        
        // Fetch workflows
        workflowService.getWorkflows(),
        
        // Fetch users (only for admin)
        user.role === 'admin' 
          ? userService.getUsers()
          : Promise.resolve([])
      ]);

      if (tasksData.status === 'fulfilled') {
        setTasks(tasksData.value);
      }

      if (productsData.status === 'fulfilled') {
        setProducts(productsData.value);
      }

      if (workflowsData.status === 'fulfilled') {
        setWorkflows(workflowsData.value);
      }

      if (usersData.status === 'fulfilled') {
        setUsers(usersData.value);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return {
    tasks,
    products,
    workflows,
    users,
    isLoading,
    error,
    refetch: fetchData,
  };
};