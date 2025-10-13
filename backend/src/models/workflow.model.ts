// Workflow models and types
export interface Workflow {
  id: string;
  productId: string;
  clientId: string;
  title: string;
  description: string;
  status: WorkflowStatus;
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  estimatedDuration: string;
  complexity: 'Low' | 'Medium' | 'High';
  generatedBy: string; // AI or user ID
  approvedBy?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  phases: WorkflowPhase[];
  summary: WorkflowSummary;
}

export interface WorkflowPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  estimatedHours: number;
  status: PhaseStatus;
  tasks: WorkflowTask[];
}

export interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  skillsRequired: string[];
  estimatedHours: number;
  priority: 'High' | 'Medium' | 'Low';
  status: TaskStatus;
  order: number;
  dependencies: string[];
  assignedTo?: string;
  dueDate?: Date;
}

export interface WorkflowSummary {
  totalPhases: number;
  totalTasks: number;
  completedTasks: number;
  progress: number; // percentage 0-100
  totalEstimatedHours: number;
  recommendedTeamSize: number;
}

export interface WorkflowStructure {
  title: string;
  description: string;
  phases: Array<{
    name: string;
    description: string;
    tasks: Array<{
      title: string;
      description: string;
      skillsRequired: string[];
      estimatedHours: number;
      priority: 'High' | 'Medium' | 'Low';
      dependencies?: string[];
    }>;
  }>;
  totalEstimatedHours: number;
  recommendedTeamSize: number;
}

export type WorkflowStatus = 
  | 'draft' 
  | 'generated' 
  | 'pending_approval' 
  | 'approved' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export type PhaseStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'blocked';

export type TaskStatus = 
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'blocked';

export interface CreateWorkflowData {
  productId: string;
  clientId: string;
  title: string;
  description: string;
  workflowStructure?: WorkflowStructure;
}

export interface UpdateWorkflowData {
  title?: string;
  description?: string;
  workflowStructure?: WorkflowStructure;
  status?: WorkflowStatus;
  approvedBy?: string;
}

export interface WorkflowFilterOptions {
  status?: WorkflowStatus;
  productId?: string;
  clientId?: string;
  page?: number;
  limit?: number;
  sortBy?: keyof Workflow;
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectAnalysis {
  complexity: 'Low' | 'Medium' | 'High';
  estimatedDuration: string;
  recommendedApproach: string;
  riskFactors: string[];
  recommendedTeamSize: number;
  keyTechnologies: string[];
}
