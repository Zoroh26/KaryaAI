import { firestore } from '../config/firebase';
import {
  Sprint,
  SprintStatus,
  SprintPlanningOptions,
  SprintPlanningResult,
  SprintSummaryItem,
} from '../models/sprint.model';
import { WorkflowTask } from '../models/workflow.model';
import { User, Task } from '../types/schema';
import { workflowService } from './workflow.service';
import { firebaseService } from './firebaseService';
import { hoursToStoryPoints } from '../utils/storyPoints';

// ─── Constants ────────────────────────────────────────────────────────────────

const SPRINT_DURATION_WORKING_DAYS = 10; // 10 working days per sprint
const EMPLOYEE_CAPACITY_POINTS = 16;     // 16 story points per employee per sprint
// First and last day are planning/review — 8 effective coding days

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Add N working days to a date (skips Saturday and Sunday).
 */
function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5) added++; // Mon–Fri only
  }
  return d;
}

/**
 * Kahn's algorithm — topological sort of workflow tasks by their dependencies.
 * Tasks with no dependencies come first. Cyclic tasks are appended at the end.
 */
function sortByDependencies(tasks: WorkflowTask[]): WorkflowTask[] {
  const byId = new Map<string, WorkflowTask>(tasks.map(t => [t.id, t]));

  // in-degree: number of unresolved dependencies per task
  const inDeg = new Map<string, number>(tasks.map(t => [t.id, 0]));
  // adjacency: dep → [tasks that depend on dep]
  const adj   = new Map<string, string[]>(tasks.map(t => [t.id, []]));

  for (const task of tasks) {
    for (const dep of task.dependencies ?? []) {
      if (byId.has(dep)) {
        inDeg.set(task.id, (inDeg.get(task.id) ?? 0) + 1);
        adj.get(dep)!.push(task.id);
      }
      // Unresolvable dependencies are simply ignored (treated as no constraint)
    }
  }

  const queue = tasks.filter(t => (inDeg.get(t.id) ?? 0) === 0);
  const sorted: WorkflowTask[] = [];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    sorted.push(cur);
    for (const nb of adj.get(cur.id) ?? []) {
      const deg = (inDeg.get(nb) ?? 0) - 1;
      inDeg.set(nb, deg);
      if (deg === 0 && byId.has(nb)) queue.push(byId.get(nb)!);
    }
  }

  // Append any tasks with unresolved cycles
  const done = new Set(sorted.map(t => t.id));
  tasks.filter(t => !done.has(t.id)).forEach(t => sorted.push(t));

  return sorted;
}

/**
 * Skill-match score for an employee on a task (0–100).
 * 70% weight for skill matches, 30% weight for breadth of experience.
 */
function matchScore(task: WorkflowTask, employee: User): number {
  const required = task.skillsRequired ?? [];
  if (required.length === 0) return 20; // no skill requirement → base score

  const matched = required.filter(s =>
    (employee.skillset ?? []).some(es =>
      es.toLowerCase().includes(s.toLowerCase()) ||
      s.toLowerCase().includes(es.toLowerCase())
    )
  ).length;

  const skillScore = (matched / required.length) * 70;
  const expScore   = Math.min((employee.skillset?.length ?? 0) / 10, 1) * 30;
  return Math.round(skillScore + expScore);
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class SprintService {
  private readonly col = 'sprints';

  /**
   * Plan sprints for a workflow using a dependency-aware, capacity-bound algorithm:
   *
   * 1. Topological sort of tasks by dependencies
   * 2. For each task (in dependency order):
   *    a. Determine the earliest sprint it can start (all deps must be in earlier sprints)
   *    b. Find the employee + sprint combo that places the task in the EARLIEST sprint
   *       (tie-break by skill-match score)
   *    c. Spill to the next sprint if the employee is at capacity (16 pts)
   * 3. Create Sprint documents in Firestore
   * 4. Batch-update flat tasks with storyPoints, sprintId, sprintNumber, assignedTo
   *
   * Calling this again (re-plan) deletes existing sprints and re-builds from scratch.
   */
  async planSprintsForWorkflow(
    workflowId: string,
    opts: SprintPlanningOptions = {}
  ): Promise<SprintPlanningResult> {
    if (!firestore) throw new Error('Firestore not initialized');

    const capacity  = opts.employeeCapacityPoints    ?? EMPLOYEE_CAPACITY_POINTS;
    const duration  = opts.sprintDurationWorkingDays ?? SPRINT_DURATION_WORKING_DAYS;
    const startDate = opts.sprintStartDate           ?? new Date();

    // ── 1. Load workflow (embedded tasks carry the dependency graph) ──────────
    const workflow = await workflowService.getWorkflowById(workflowId);

    // ── 2. Load flat tasks ────────────────────────────────────────────────────
    const flatTasks = await firebaseService.getTasks({ workflowId });
    if (flatTasks.length === 0) {
      throw new Error('No tasks found — approve the workflow first to seed tasks.');
    }

    // embeddedId (e.g. "task_1_1") → flat Task
    const byEmbeddedId = new Map<string, Task>();
    for (const ft of flatTasks) {
      const embId = ft.id.replace(`${workflowId}_`, '');
      byEmbeddedId.set(embId, ft);
    }

    // ── 3. Load employees ─────────────────────────────────────────────────────
    const employees = await firebaseService.getAvailableEmployees();
    if (employees.length === 0) {
      throw new Error('No available employees for sprint planning.');
    }

    // ── 4. Flatten & sort embedded tasks by dependencies ──────────────────────
    const allEmb: WorkflowTask[] = workflow.phases.flatMap(p => p.tasks);
    const sortedEmb = sortByDependencies(allEmb);

    // ── 5. Planning state ─────────────────────────────────────────────────────
    // empPts[employeeId][sprintNumber] = allocated story points
    const empPts = new Map<string, Map<number, number>>(
      employees.map(e => [e.id, new Map()])
    );
    // embeddedTaskId → sprint number it was assigned to (for dependency constraints)
    const taskSprint = new Map<string, number>();
    // sprintNumber → list of planned slots
    type Slot = { flatId: string; empId: string; pts: number };
    const sprintSlots = new Map<number, Slot[]>();

    // ── 6. Delete any existing sprints (re-plan is idempotent) ────────────────
    const existing = await this.getSprintsByWorkflow(workflowId);
    if (existing.length > 0) {
      const delBatch = firestore.batch();
      existing.forEach(s =>
        delBatch.delete(firestore!.collection(this.col).doc(s.id))
      );
      await delBatch.commit();
    }

    // ── 7. Plan each task ─────────────────────────────────────────────────────
    for (const emb of sortedEmb) {
      const flat = byEmbeddedId.get(emb.id);
      if (!flat) continue; // task not seeded yet — skip

      const pts = hoursToStoryPoints(emb.estimatedHours);

      // Earliest sprint this task can go into (all deps must be in EARLIER sprints)
      const depSprints = (emb.dependencies ?? [])
        .map(d => taskSprint.get(d))
        .filter((s): s is number => s !== undefined);
      const minSprint = depSprints.length > 0 ? Math.max(...depSprints) + 1 : 1;

      // Find the employee + sprint that places the task as early as possible
      // Prefer earlier sprint, tie-break by higher skill score
      let bestEmp: User | null = null;
      let bestSprintNum = Infinity;
      let bestScore = -1;

      for (const emp of employees) {
        const capacity_pts = emp.sprintCapacityPoints ?? capacity;
        const buckets = empPts.get(emp.id)!;

        // Walk forward from minSprint until we find a sprint with spare capacity
        let target = minSprint;
        while ((buckets.get(target) ?? 0) + pts > capacity_pts) target++;

        const sc = matchScore(emb, emp);
        if (target < bestSprintNum || (target === bestSprintNum && sc > bestScore)) {
          bestSprintNum = target;
          bestEmp       = emp;
          bestScore     = sc;
        }
      }

      if (!bestEmp) continue; // shouldn't happen with unbounded sprints

      // Commit the assignment
      empPts.get(bestEmp.id)!.set(
        bestSprintNum,
        (empPts.get(bestEmp.id)!.get(bestSprintNum) ?? 0) + pts
      );
      taskSprint.set(emb.id, bestSprintNum);

      if (!sprintSlots.has(bestSprintNum)) sprintSlots.set(bestSprintNum, []);
      sprintSlots.get(bestSprintNum)!.push({ flatId: flat.id, empId: bestEmp.id, pts });
    }

    // ── 8. Persist sprints + batch-update tasks ───────────────────────────────
    const maxSprint = sprintSlots.size === 0 ? 0 : Math.max(...sprintSlots.keys());
    const writeBatch = firestore.batch();
    const summary: SprintSummaryItem[] = [];

    for (let n = 1; n <= maxSprint; n++) {
      const slots = sprintSlots.get(n);
      if (!slots || slots.length === 0) continue;

      // Sprint dates (skip weekends)
      const sStart = addWorkingDays(startDate, (n - 1) * duration);
      const sEnd   = addWorkingDays(sStart,    duration - 1);

      const empAlloc: Record<string, number> = {};
      let totalPts = 0;
      for (const { empId, pts } of slots) {
        empAlloc[empId] = (empAlloc[empId] ?? 0) + pts;
        totalPts += pts;
      }

      const ref = firestore.collection(this.col).doc();
      const sprintDoc: Sprint = {
        id: ref.id,
        workflowId,
        productId: workflow.productId,
        number: n,
        name: `Sprint ${n}`,
        startDate: sStart,
        endDate: sEnd,
        // Sprint 1 is immediately active; subsequent sprints start as planning
        status: n === 1 ? 'active' : 'planning',
        allocatedPoints: totalPts,
        taskIds: slots.map(s => s.flatId),
        employeeAllocations: empAlloc,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      writeBatch.set(ref, sprintDoc);

      // Update each flat task with sprint info + assignment
      for (const { flatId, empId, pts } of slots) {
        writeBatch.update(firestore.collection('tasks').doc(flatId), {
          storyPoints:  pts,
          sprintId:     ref.id,
          sprintNumber: n,
          assignedTo:   empId,
          status:       'assigned',
          updatedAt:    new Date(),
        });
      }

      summary.push({
        sprintNumber: n,
        sprintId:     ref.id,
        taskCount:    slots.length,
        totalPoints:  totalPts,
        employeeAllocations: empAlloc,
        startDate: sStart,
        endDate:   sEnd,
      });
    }

    await writeBatch.commit();

    return {
      sprintsCreated: summary.length,
      totalTasks:     flatTasks.length,
      tasksPlanned:   Array.from(sprintSlots.values()).reduce((s, arr) => s + arr.length, 0),
      sprintSummary:  summary,
    };
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────

  async getSprintsByWorkflow(workflowId: string): Promise<Sprint[]> {
    if (!firestore) throw new Error('Firestore not initialized');
    const snap = await firestore.collection(this.col)
      .where('workflowId', '==', workflowId)
      .get();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Sprint))
      .sort((a, b) => a.number - b.number);
  }

  async getSprintById(sprintId: string): Promise<Sprint> {
    if (!firestore) throw new Error('Firestore not initialized');
    const doc = await firestore.collection(this.col).doc(sprintId).get();
    if (!doc.exists) throw new Error('Sprint not found');
    return { id: doc.id, ...doc.data() } as Sprint;
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────────

  /**
   * Advance a sprint through its lifecycle:
   *   planning → active → completed
   *   Any state → cancelled
   */
  async updateSprintStatus(sprintId: string, newStatus: SprintStatus): Promise<Sprint> {
    if (!firestore) throw new Error('Firestore not initialized');
    const sprint = await this.getSprintById(sprintId);

    const allowed: Record<SprintStatus, SprintStatus[]> = {
      planning:  ['active', 'cancelled'],
      active:    ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!allowed[sprint.status].includes(newStatus)) {
      throw new Error(
        `Cannot transition sprint from '${sprint.status}' to '${newStatus}'. ` +
        `Allowed: ${allowed[sprint.status].join(', ') || 'none'}`
      );
    }

    await firestore.collection(this.col).doc(sprintId).update({
      status: newStatus,
      updatedAt: new Date(),
    });
    return this.getSprintById(sprintId);
  }

  /**
   * End a sprint: move all incomplete tasks to the next sprint.
   * Creates the next sprint if it doesn't already exist.
   * Marks the current sprint as 'completed'.
   *
   * "Incomplete" = any task NOT in status 'completed' or 'cancelled'.
   */
  async replanSprint(sprintId: string): Promise<{
    movedTasks: number;
    nextSprintId: string;
    nextSprintNumber: number;
  }> {
    if (!firestore) throw new Error('Firestore not initialized');

    const sprint = await this.getSprintById(sprintId);
    if (sprint.status !== 'active') {
      throw new Error(`Only active sprints can be replanned (current status: '${sprint.status}')`);
    }

    // Load all tasks in this sprint and find incomplete ones
    const taskDocs = await Promise.all(sprint.taskIds.map(id => firebaseService.getTask(id)));
    const incomplete = taskDocs.filter(
      (t): t is Task => t !== null && !['completed', 'cancelled'].includes(t.status)
    );

    // Determine next sprint number
    const allSprints  = await this.getSprintsByWorkflow(sprint.workflowId);
    const maxNum      = Math.max(...allSprints.map(s => s.number));
    const nextNum     = maxNum + 1;

    // Calculate next sprint dates from the last sprint's end date
    const lastSprint  = allSprints.find(s => s.number === maxNum)!;
    const lastEnd     = lastSprint.endDate instanceof Date
      ? lastSprint.endDate
      : new Date((lastSprint.endDate as any)._seconds * 1000); // Firestore Timestamp
    const nextStart   = addWorkingDays(lastEnd, 1);
    const nextEnd     = addWorkingDays(nextStart, SPRINT_DURATION_WORKING_DAYS - 1);

    // Aggregate employee allocations from moved tasks
    const empAlloc: Record<string, number> = {};
    let totalPts = 0;
    for (const t of incomplete) {
      if (t.assignedTo && t.storyPoints) {
        empAlloc[t.assignedTo] = (empAlloc[t.assignedTo] ?? 0) + t.storyPoints;
        totalPts += t.storyPoints;
      }
    }

    const nextRef = firestore.collection(this.col).doc();
    const nextSprint: Sprint = {
      id: nextRef.id,
      workflowId: sprint.workflowId,
      productId:  sprint.productId,
      number:     nextNum,
      name:       `Sprint ${nextNum}`,
      startDate:  nextStart,
      endDate:    nextEnd,
      status:     'planning',
      allocatedPoints: totalPts,
      taskIds:         incomplete.map(t => t.id),
      employeeAllocations: empAlloc,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const batch = firestore.batch();
    batch.set(nextRef, nextSprint);

    // Move tasks to next sprint
    for (const t of incomplete) {
      batch.update(firestore.collection('tasks').doc(t.id), {
        sprintId:     nextRef.id,
        sprintNumber: nextNum,
        updatedAt:    new Date(),
      });
    }

    // Complete current sprint (remove moved tasks from its taskIds)
    const movedIds = new Set(incomplete.map(t => t.id));
    batch.update(firestore.collection(this.col).doc(sprintId), {
      status:    'completed',
      taskIds:   sprint.taskIds.filter(id => !movedIds.has(id)),
      updatedAt: new Date(),
    });

    await batch.commit();

    return {
      movedTasks:        incomplete.length,
      nextSprintId:      nextRef.id,
      nextSprintNumber:  nextNum,
    };
  }
}

export const sprintService = new SprintService();
