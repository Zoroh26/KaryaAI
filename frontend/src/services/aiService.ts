import { apiClient } from '@/lib/api';
import { WorkflowGenerationRequest, WorkflowGenerationResponse, ApiResponse } from '@/types/api';

class AIService {
  async generateWorkflow(request: WorkflowGenerationRequest): Promise<WorkflowGenerationResponse> {
    const response = await apiClient.post<ApiResponse<WorkflowGenerationResponse>>('/ai/generate-workflow', request);
    return response.data;
  }
}

export const aiService = new AIService();