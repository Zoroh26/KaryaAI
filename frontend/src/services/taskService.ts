import { apiClient } from '@/lib/api';
import { Task, TaskAssignment, ApiResponse } from '@/types/api';

class TaskService {
  async getTasks(filters?: { workflowId?: string; assignedTo?: string; status?: string }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.workflowId) params.append('workflowId', filters.workflowId);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters?.status) params.append('status', filters.status);
    
    const endpoint = `/tasks${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<Task[]>>(endpoint);
    return response.data;
  }

  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data;
  }

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', taskData);
    return response.data;
  }

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, taskData);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  }

  async assignTasks(taskIds: string[]): Promise<TaskAssignment[]> {
    const response = await apiClient.post<ApiResponse<TaskAssignment[]>>('/tasks/assign', { taskIds });
    return response.data;
  }

  async getMyTasks(): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]>>('/tasks/my');
    return response.data;
  }
}

export const taskService = new TaskService();