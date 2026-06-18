import { apiClient } from '@/lib/api';
import { Workflow, ApiResponse } from '@/types/api';

class WorkflowService {
  async getWorkflows(productId?: string): Promise<Workflow[]> {
    const endpoint = productId ? `/workflows?productId=${productId}` : '/workflows';
    const response = await apiClient.get<ApiResponse<{ workflows: Workflow[] }>>(endpoint);
    return response.data.workflows;
  }

  async getMyWorkflows(): Promise<Workflow[]> {
    const response = await apiClient.get<ApiResponse<{ workflows: Workflow[] }>>('/workflows/my-workflows');
    return response.data.workflows;
  }

  async getWorkflow(id: string): Promise<Workflow> {
    const response = await apiClient.get<ApiResponse<Workflow>>(`/workflows/${id}`);
    return response.data;
  }

  async createWorkflow(workflowData: Partial<Workflow>): Promise<Workflow> {
    const response = await apiClient.post<ApiResponse<Workflow>>('/workflows', workflowData);
    return response.data;
  }

  async generateWorkflow(data: { productId: string, description: string, title?: string }): Promise<Workflow> {
    const response = await apiClient.post<ApiResponse<Workflow>>('/workflows/generate', data);
    return response.data;
  }

  async updateWorkflow(id: string, workflowData: Partial<Workflow>): Promise<Workflow> {
    const response = await apiClient.put<ApiResponse<Workflow>>(`/workflows/${id}`, workflowData);
    return response.data;
  }

  async approveWorkflow(id: string): Promise<Workflow> {
    const response = await apiClient.post<ApiResponse<Workflow>>(`/workflows/${id}/approve`);
    return response.data;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await apiClient.delete(`/workflows/${id}`);
  }
}

export const workflowService = new WorkflowService();