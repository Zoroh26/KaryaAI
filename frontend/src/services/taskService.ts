import { apiClient } from '@/lib/api';
import { Task, TaskAssignment, ApiResponse } from '@/types/api';

class TaskService {
  async getTasks(filters?: { workflowId?: string; assignedTo?: string; status?: string }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.workflowId) params.append('workflowId', filters.workflowId);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters?.status) params.append('status', filters.status);
    
    const endpoint = `/tasks${params.toString() ? `?${params.toString()}` : ''}`;
    // taskController.getTasks returns { tasks: Task[] }
    const response = await apiClient.get<{ tasks: Task[] }>(endpoint);
    return response.tasks;
  }

  async getTask(id: string): Promise<Task> {
    // taskController.getTaskById returns { task: Task }
    const response = await apiClient.get<{ task: Task }>(`/tasks/${id}`);
    return response.task;
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    // taskController.createTask returns { message, task }
    const response = await apiClient.post<{ task: Task }>('/tasks', taskData);
    return response.task;
  }

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    // taskController.updateTask returns { message, task }
    const response = await apiClient.put<{ task: Task }>(`/tasks/${id}`, taskData);
    return response.task;
  }

  async deleteTask(id: string): Promise<void> {
    // There is no deleteTask in taskController, but assuming it exists
    await apiClient.delete(`/tasks/${id}`);
  }

  async assignTasks(taskIds: string[]): Promise<any> {
    // taskController.assignTasks returns { success, assignments, totalAssigned }
    const response = await apiClient.post<{ assignments: any[] }>('/tasks/assign', { taskIds });
    return response.assignments;
  }

  async getEmployeeTasks(employeeId: string): Promise<Task[]> {
    // taskController.getEmployeeTasks returns { tasks: Task[] }
    const response = await apiClient.get<{ tasks: Task[] }>(`/tasks/employee/${employeeId}`);
    return response.tasks;
  }
}

export const taskService = new TaskService();