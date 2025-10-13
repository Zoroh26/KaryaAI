import { z } from 'zod';

// Base interfaces
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  skillset?: string[];
  isAvailable?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export type UserRole = 'client' | 'admin' | 'employee';

export interface InsertUser {
  email: string;
  full_name: string;
  role: UserRole;
  skillset?: string[];
  isAvailable?: boolean;
  isActive?: boolean;
}

export interface Product {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  description: string;
  status: ProductStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export type ProductStatus = 'pending_review' | 'in_progress' | 'completed' | 'cancelled';

export interface InsertProduct {
  clientId: string;
  clientName: string;
  clientEmail: string;
  description: string;
  status?: ProductStatus;
}

export interface Workflow {
  id: string;
  productId: string;
  clientId: string;
  title: string;
  description: string;
  phases: WorkflowPhase[];
  totalHours: number;
  complexity: 'Low' | 'Medium' | 'High';
  priority: 'Low' | 'Medium' | 'High';
  status: WorkflowStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export interface WorkflowPhase {
  id: string;
  title: string;
  description: string;
  tasks: WorkflowTask[];
  estimatedHours: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  skillRequired: string[];
  priority: 'Low' | 'Medium' | 'High';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  assignedTo?: string;
  assignedToName?: string;
}

export type WorkflowStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

export interface InsertWorkflow {
  productId: string;
  clientId: string;
  title: string;
  description: string;
  phases: WorkflowPhase[];
  totalHours: number;
  complexity: 'Low' | 'Medium' | 'High';
  priority: 'Low' | 'Medium' | 'High';
  status?: WorkflowStatus;
}

export interface Task {
  id: string;
  workflowId: string;
  productId: string;
  phaseId: string;
  title: string;
  description: string;
  skillRequired: string[];
  estimatedHours: number;
  priority: 'Low' | 'Medium' | 'High';
  status: TaskStatus;
  assignedTo?: string;
  assignedToName?: string;
  startDate?: Date;
  endDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export type TaskStatus = 'unassigned' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface InsertTask {
  workflowId: string;
  productId: string;
  phaseId: string;
  title: string;
  description: string;
  skillRequired: string[];
  estimatedHours: number;
  priority: 'Low' | 'Medium' | 'High';
  status?: TaskStatus;
  assignedTo?: string;
  assignedToName?: string;
}

// Zod validation schemas
export const userRoleSchema = z.enum(['client', 'admin', 'employee']);

export const insertUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  role: userRoleSchema,
  skillset: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
});

export const productStatusSchema = z.enum(['pending_review', 'in_progress', 'completed', 'cancelled']);

export const insertProductSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  clientEmail: z.string().email(),
  description: z.string().min(10),
  status: productStatusSchema.optional().default('pending_review'),
});

export const taskStatusSchema = z.enum(['unassigned', 'assigned', 'in_progress', 'completed', 'cancelled']);
export const prioritySchema = z.enum(['Low', 'Medium', 'High']);

export const insertTaskSchema = z.object({
  workflowId: z.string(),
  productId: z.string(),
  phaseId: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  skillRequired: z.array(z.string()),
  estimatedHours: z.number().positive(),
  priority: prioritySchema,
  status: taskStatusSchema.optional().default('unassigned'),
  assignedTo: z.string().optional(),
  assignedToName: z.string().optional(),
});

export const workflowStatusSchema = z.enum(['pending', 'approved', 'in_progress', 'completed', 'cancelled']);

export const workflowTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  estimatedHours: z.number().positive(),
  skillRequired: z.array(z.string()),
  priority: prioritySchema,
  status: z.enum(['pending', 'assigned', 'in_progress', 'completed']),
  assignedTo: z.string().optional(),
  assignedToName: z.string().optional(),
});

export const workflowPhaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tasks: z.array(workflowTaskSchema),
  estimatedHours: z.number().positive(),
  status: z.enum(['pending', 'in_progress', 'completed']),
});

export const insertWorkflowSchema = z.object({
  productId: z.string(),
  clientId: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  phases: z.array(workflowPhaseSchema),
  totalHours: z.number().positive(),
  complexity: z.enum(['Low', 'Medium', 'High']),
  priority: prioritySchema,
  status: workflowStatusSchema.optional().default('pending'),
});
