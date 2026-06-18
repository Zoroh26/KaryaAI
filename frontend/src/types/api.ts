export interface Product {
  id: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  title: string;
  description: string;
  category?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'pending_review' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  estimatedBudget?: number;
  deadline?: any;
  requirements?: string[];
  attachments?: string[];
  // Extended brief fields
  targetAudience?: string;
  platformType?: string;
  techPreferences?: string;
  keyFeatures?: string;
  successCriteria?: string;
  additionalNotes?: string;
  // Meta
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Workflow {
  id: string;
  productId: string;
  clientId: string;
  title: string;
  description: string;
  status: 'draft' | 'generated' | 'pending_approval' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  complexity: 'Low' | 'Medium' | 'High';
  priority: 'Low' | 'Medium' | 'High';
  estimatedHours: number;
  estimatedDuration: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  workflowId: string;
  productId: string;
  phaseId: string;
  title: string;
  skillsRequired: string[];
  estimatedHours: number;
  storyPoints: number;
  priority: 'Low' | 'Medium' | 'High';
  status: 'unassigned' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  assignedToName?: string;
  sprintId?: string;
  sprintNumber?: number;
  createdAt?: string;
  updatedAt?: string;
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