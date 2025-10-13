export interface Product {
  id: string;
  name: string;
  description: string;
  clientId: string;
  clientName?: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed';
  progress: number;
  createdAt: string;
  updatedAt: string;
  workflows?: Workflow[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  productId: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  workflowId: string;
  assignedTo?: string;
  assignedToName?: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  requiredSkills: string[];
  estimatedHours?: number;
  deadline?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignment {
  taskId: string;
  assignedTo: string;
  employeeName: string;
  matchScore: number;
  reason: string;
}

export interface WorkflowGenerationRequest {
  productId: string;
  requirements: string;
}

export interface WorkflowGenerationResponse {
  workflow: Workflow;
  tasks: Task[];
  message: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}