// User roles
export const USER_ROLES = {
  CLIENT: 'client',
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
} as const;

// Product/Project statuses
export const PRODUCT_STATUS = {
  PENDING_REVIEW: 'pending_review',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

// Workflow statuses
export const WORKFLOW_STATUS = {
  GENERATED: 'generated',
  APPROVED: 'approved',
  IN_PROGRESS: 'in_progress',
} as const;

// Task statuses
export const TASK_STATUS = {
  UNASSIGNED: 'unassigned',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

// Task priorities
export const TASK_PRIORITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
} as const;

// Common skills list
export const COMMON_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'PHP',
  'SQL',
  'HTML',
  'CSS',
  'UI/UX Design',
  'Project Management',
  'DevOps',
  'Quality Assurance',
  'Data Analysis',
  'Machine Learning',
  'Mobile Development',
  'Backend Development',
  'Frontend Development',
  'Full Stack Development',
  'Database Design',
  'API Development',
  'Cloud Computing',
  'Cybersecurity',
  'System Administration',
] as const;

// Firebase collections
export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  WORKFLOWS: 'workflows',
  TASKS: 'tasks',
} as const;

// API endpoints base paths
export const API_PATHS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  PRODUCTS: '/api/products',
  WORKFLOWS: '/api/workflows',
  TASKS: '/api/tasks',
  AI: '/api/ai',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  INVALID_INPUT: 'Invalid input data',
  INTERNAL_ERROR: 'Internal server error',
  USER_NOT_FOUND: 'User not found',
  PRODUCT_NOT_FOUND: 'Product not found',
  WORKFLOW_NOT_FOUND: 'Workflow not found',
  TASK_NOT_FOUND: 'Task not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_EXISTS: 'Email already exists',
  INVALID_TOKEN: 'Invalid or expired token',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  WORKFLOW_GENERATED: 'Workflow generated successfully',
  WORKFLOW_APPROVED: 'Workflow approved successfully',
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  TASKS_ASSIGNED: 'Tasks assigned successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
} as const;

// Limits and constraints
export const LIMITS = {
  MAX_SKILLS_PER_USER: 20,
  MAX_TASKS_PER_EMPLOYEE: 10,
  MAX_PRODUCT_DESCRIPTION_LENGTH: 5000,
  MAX_TASK_DESCRIPTION_LENGTH: 2000,
  MAX_WORKFLOW_TITLE_LENGTH: 200,
  MIN_PASSWORD_LENGTH: 6,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// Default values
export const DEFAULTS = {
  TASK_ESTIMATED_HOURS: 8,
  TASK_PRIORITY: TASK_PRIORITY.MEDIUM,
  PAGINATION_LIMIT: 10,
  PAGINATION_MAX_LIMIT: 100,
} as const;
