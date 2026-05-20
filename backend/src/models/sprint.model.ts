// ─── Sprint model ─────────────────────────────────────────────────────────────

export type SprintStatus = 'planning' | 'active' | 'completed' | 'cancelled';

/**
 * A sprint is a time-boxed iteration (10 working days) within a workflow.
 * First and last days are reserved for planning/review — 8 effective coding days.
 * Each employee has a capacity of 16 story points per sprint.
 */
export interface Sprint {
  id: string;
  workflowId: string;
  productId: string;
  /** Sequential sprint number within the workflow (1-based) */
  number: number;
  name: string;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
  /** Sum of story points of all tasks in this sprint */
  allocatedPoints: number;
  /** Flat task IDs assigned to this sprint */
  taskIds: string[];
  /** employeeId → story points allocated to them in this sprint */
  employeeAllocations: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sprint planning ──────────────────────────────────────────────────────────

export interface SprintPlanningOptions {
  /** Date when Sprint 1 starts (default: today) */
  sprintStartDate?: Date;
  /** Working days per sprint including planning+review days (default: 10) */
  sprintDurationWorkingDays?: number;
  /** Max story points per employee per sprint (default: 16) */
  employeeCapacityPoints?: number;
}

export interface SprintPlanningResult {
  sprintsCreated: number;
  totalTasks: number;
  tasksPlanned: number;
  sprintSummary: SprintSummaryItem[];
}

export interface SprintSummaryItem {
  sprintNumber: number;
  sprintId: string;
  taskCount: number;
  totalPoints: number;
  /** employeeId → points in this sprint */
  employeeAllocations: Record<string, number>;
  startDate: Date;
  endDate: Date;
}
