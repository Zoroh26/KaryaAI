import { z } from 'zod';

// Common validation schemas
export const idSchema = z.string().min(1, 'ID is required');

export const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
});

export const statusFilterSchema = z.object({
  status: z.enum(['pending_review', 'in_progress', 'completed']).optional(),
});

export const taskStatusFilterSchema = z.object({
  status: z.enum(['unassigned', 'assigned', 'in_progress', 'completed']).optional(),
});

export const workflowStatusFilterSchema = z.object({
  status: z.enum(['generated', 'approved', 'in_progress']).optional(),
});

// Email validation
export const emailSchema = z.string().email('Invalid email format');

// Skill validation
export const skillSchema = z.string().min(1).max(50);
export const skillsArraySchema = z.array(skillSchema).max(20, 'Maximum 20 skills allowed');

// Date validation
export const dateSchema = z.string().datetime().or(z.date());
export const futureDateSchema = z.string().datetime().refine(
  (date) => new Date(date) > new Date(),
  'Date must be in the future'
);

// Priority validation
export const prioritySchema = z.enum(['High', 'Medium', 'Low']);

// Role validation
export const roleSchema = z.enum(['client', 'admin', 'employee']);
