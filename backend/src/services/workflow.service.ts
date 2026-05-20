import { ai, GEMINI_MODEL } from '../config/gemini';
import { firestore } from '../config/firebase';
import {
  Workflow,
  WorkflowStructure,
  WorkflowPhase,
  WorkflowTask,
  WorkflowSummary,
  UpdateWorkflowData,
  WorkflowFilterOptions,
  ProjectAnalysis,
  WorkflowStatus
} from '../models/workflow.model';
import { productService } from './products.services';
import { Task } from '../types/schema';
import { hoursToStoryPoints } from '../utils/storyPoints';

export class WorkflowService {
  private readonly workflowsCollection = 'workflows';
  private readonly tasksCollection = 'tasks';

  /**
   * Generate AI workflow for a project
   */
  async generateWorkflow(description: string, productId: string, clientId: string): Promise<Workflow> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      console.log('WorkflowService.generateWorkflow called with:', { description, productId, clientId });

      // Generate workflow structure using AI
      const workflowStructure = await this.generateWorkflowStructure(description);

      // Transform AI structure to hierarchical format (also resolves dep titles → IDs)
      const hierarchicalWorkflow = this.transformToHierarchical(workflowStructure, productId, clientId);

      // Save to Firestore
      const docRef = await firestore.collection(this.workflowsCollection).add({
        ...hierarchicalWorkflow,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Workflow created with ID: ${docRef.id}`);

      return {
        id: docRef.id,
        ...hierarchicalWorkflow,
      };

    } catch (error: any) {
      console.error('WorkflowService.generateWorkflow error:', error);
      throw error;
    }
  }

  /**
   * Transform AI workflow structure to hierarchical format.
   * Also converts dependency task-titles to task IDs post-generation.
   */
  private transformToHierarchical(aiStructure: WorkflowStructure, productId: string, clientId: string): Omit<Workflow, 'id'> {
    // Build a title → id lookup first so we can resolve dependencies
    const titleToId = new Map<string, string>();
    aiStructure.phases.forEach((aiPhase, phaseIndex) => {
      aiPhase.tasks.forEach((aiTask, taskIndex) => {
        const taskId = `task_${phaseIndex + 1}_${taskIndex + 1}`;
        titleToId.set(aiTask.title.toLowerCase().trim(), taskId);
      });
    });

    const phases: WorkflowPhase[] = [];
    let totalTasks = 0;

    aiStructure.phases.forEach((aiPhase, phaseIndex) => {
      const tasks: WorkflowTask[] = [];

      aiPhase.tasks.forEach((aiTask, taskIndex) => {
        const taskId = `task_${phaseIndex + 1}_${taskIndex + 1}`;

        // Resolve dependency titles to IDs; fall back to the original string if not found
        const resolvedDeps = (aiTask.dependencies || []).map((dep: string) => {
          const resolved = titleToId.get(dep.toLowerCase().trim());
          return resolved ?? dep; // keep original if unresolvable
        });

        tasks.push({
          id: taskId,
          title: aiTask.title,
          description: aiTask.description,
          skillsRequired: aiTask.skillsRequired,
          estimatedHours: aiTask.estimatedHours,
          storyPoints: hoursToStoryPoints(aiTask.estimatedHours),
          priority: aiTask.priority,
          status: 'pending',
          order: taskIndex + 1,
          dependencies: resolvedDeps,
        });

        totalTasks++;
      });

      // Calculate phase estimated hours
      const phaseEstimatedHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);

      phases.push({
        id: `phase_${phaseIndex + 1}`,
        name: aiPhase.name,
        description: aiPhase.description,
        order: phaseIndex + 1,
        estimatedHours: phaseEstimatedHours,
        status: 'pending',
        tasks,
      });
    });

    // Create summary
    const summary: WorkflowSummary = {
      totalPhases: phases.length,
      totalTasks,
      completedTasks: 0,
      progress: 0,
      totalEstimatedHours: aiStructure.totalEstimatedHours,
      recommendedTeamSize: aiStructure.recommendedTeamSize,
    };

    const priority = this.determinePriority(aiStructure.totalEstimatedHours);

    return {
      productId,
      clientId,
      title: aiStructure.title,
      description: aiStructure.description,
      status: 'generated',
      priority,
      estimatedHours: aiStructure.totalEstimatedHours,
      estimatedDuration: this.calculateDuration(aiStructure.totalEstimatedHours),
      complexity: this.determineComplexity(aiStructure.totalEstimatedHours, phases.length),
      generatedBy: 'ai',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      phases,
      summary,
    };
  }

  /**
   * Generate workflow structure using AI (JSON mode for reliable parsing)
   */
  private async generateWorkflowStructure(projectDescription: string): Promise<WorkflowStructure> {
    try {
      const prompt = `You are an expert project manager and workflow architect.
Generate a detailed, structured workflow for the given project description.

Requirements:
1. Break down the project into logical phases (3-6 phases typically)
2. Create specific, actionable tasks for each phase
3. Specify required skills for each task under "skillsRequired"
4. Estimate realistic hours for each task (consider 8-hour workdays)
5. Set appropriate priority levels: "High", "Medium", or "Low"
6. For dependencies, list the EXACT title of the task it depends on (within the same project)

Project Description: ${projectDescription}

Respond with JSON in this exact format:
{
  "title": "Project Title",
  "description": "Brief project description",
  "phases": [
    {
      "name": "Phase Name",
      "description": "Phase description",
      "tasks": [
        {
          "title": "Task Title",
          "description": "Detailed task description",
          "skillsRequired": ["skill1", "skill2"],
          "estimatedHours": 8,
          "priority": "High",
          "dependencies": ["Exact Title of Dependency Task"]
        }
      ]
    }
  ],
  "totalEstimatedHours": 120,
  "recommendedTeamSize": 4
}`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text ?? '';

      let workflowData: WorkflowStructure;
      try {
        workflowData = JSON.parse(responseText);
      } catch {
        // Fallback: extract JSON block if model added surrounding text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in AI response');
        }
        workflowData = JSON.parse(jsonMatch[0]);
      }

      // Validate required fields
      if (!workflowData.title || !workflowData.phases || !Array.isArray(workflowData.phases)) {
        throw new Error('Invalid workflow structure from AI');
      }

      return workflowData;
    } catch (error) {
      console.error('Gemini workflow generation error:', error);
      throw new Error(`Failed to generate workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all workflows with filtering and pagination
   */
  async getWorkflows(options: WorkflowFilterOptions = {}): Promise<{
    workflows: Workflow[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      console.log('WorkflowService.getWorkflows called with:', options);

      // Build base query — apply database-level filters where possible
      let query: FirebaseFirestore.Query = firestore
        .collection(this.workflowsCollection)
        .where('isDeleted', '==', false);

      if (options.clientId) {
        query = query.where('clientId', '==', options.clientId);
      }
      if (options.productId) {
        query = query.where('productId', '==', options.productId);
      }
      if (options.status) {
        query = query.where('status', '==', options.status);
      }

      const snapshot = await query.get();
      console.log(`Found ${snapshot.size} workflows`);

      let workflows: Workflow[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Workflow, 'id'>),
      }));

      // In-memory sort
      const sortBy = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder || 'desc';

      workflows.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          const aField = a[sortBy as keyof Workflow] as any;
          const bField = b[sortBy as keyof Workflow] as any;
          aValue = aField?.toDate ? aField.toDate() : (aField instanceof Date ? aField : new Date(aField || 0));
          bValue = bField?.toDate ? bField.toDate() : (bField instanceof Date ? bField : new Date(bField || 0));
        } else {
          aValue = a[sortBy as keyof Workflow] || '';
          bValue = b[sortBy as keyof Workflow] || '';
        }

        if (sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });

      // Pagination
      const page = options.page || 1;
      const limit = options.limit || 10;
      const total = workflows.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;

      const paginatedWorkflows = workflows.slice(startIndex, startIndex + limit);
      console.log(`Returning ${paginatedWorkflows.length} workflows`);

      return {
        workflows: paginatedWorkflows,
        pagination: { total, page, limit, totalPages },
      };

    } catch (error: any) {
      console.error('WorkflowService.getWorkflows error:', error);
      throw error;
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(workflowId: string): Promise<Workflow> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const workflowDoc = await firestore.collection(this.workflowsCollection).doc(workflowId).get();

      if (!workflowDoc.exists) {
        throw new Error('Workflow not found');
      }

      const workflowData = workflowDoc.data() as Omit<Workflow, 'id'>;

      if (workflowData.isDeleted) {
        throw new Error('Workflow not found');
      }

      return { id: workflowDoc.id, ...workflowData };

    } catch (error: any) {
      console.error('WorkflowService.getWorkflowById error:', error);
      throw error;
    }
  }

  /**
   * Update workflow
   */
  async updateWorkflow(workflowId: string, updateData: UpdateWorkflowData): Promise<Workflow> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const workflowDoc = await firestore.collection(this.workflowsCollection).doc(workflowId).get();
      if (!workflowDoc.exists) {
        throw new Error('Workflow not found');
      }

      const updates = { ...updateData, updatedAt: new Date() };
      await firestore.collection(this.workflowsCollection).doc(workflowId).update(updates);

      return await this.getWorkflowById(workflowId);

    } catch (error: any) {
      console.error('WorkflowService.updateWorkflow error:', error);
      throw error;
    }
  }

  /**
   * Approve workflow, update product status, and seed the top-level tasks collection.
   * This bridges the embedded workflow tasks with the flat tasks collection used by
   * the task assignment engine.
   */
  async approveWorkflow(workflowId: string, approvedBy: string): Promise<{
    workflow: Workflow;
    productUpdated: boolean;
    tasksSeeded: number;
  }> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const workflow = await this.getWorkflowById(workflowId);

      // Approve workflow
      const updatedWorkflow = await this.updateWorkflow(workflowId, {
        status: 'approved',
        approvedBy,
      });

      // Update associated product status
      let productUpdated = false;
      try {
        await productService.updateProduct(workflow.productId, { status: 'in_progress' });
        productUpdated = true;
      } catch (error) {
        console.error('Failed to update product status:', error);
      }

      // Seed top-level tasks collection from embedded workflow tasks
      let tasksSeeded = 0;
      try {
        tasksSeeded = await this.seedTasksFromWorkflow(updatedWorkflow);
        console.log(`Seeded ${tasksSeeded} tasks for workflow ${workflowId}`);
      } catch (error) {
        console.error('Failed to seed tasks collection (non-fatal):', error);
      }

      return { workflow: updatedWorkflow, productUpdated, tasksSeeded };

    } catch (error: any) {
      console.error('WorkflowService.approveWorkflow error:', error);
      throw error;
    }
  }

  /**
   * Seed the flat `tasks` collection from the workflow's embedded phase tasks.
   * Skips tasks that already exist (idempotent via workflow-scoped task IDs).
   */
  private async seedTasksFromWorkflow(workflow: Workflow): Promise<number> {
    if (!firestore) return 0;

    // Collect all (docId, embeddedTask, phaseId) tuples first
    const candidates: { docId: string; phase: WorkflowPhase; task: WorkflowTask }[] = [];
    for (const phase of workflow.phases) {
      for (const embeddedTask of phase.tasks) {
        candidates.push({
          docId: `${workflow.id}_${embeddedTask.id}`,
          phase,
          task: embeddedTask,
        });
      }
    }

    if (candidates.length === 0) return 0;

    // Fetch all existing docs in parallel — single round-trip instead of N serial reads
    const refs = candidates.map(c => firestore!.collection(this.tasksCollection).doc(c.docId));
    const existingDocs = await Promise.all(refs.map(r => r.get()));

    const batch = firestore.batch();
    let count = 0;

    for (let i = 0; i < candidates.length; i++) {
      if (existingDocs[i].exists) continue; // already seeded — skip

      const { docId, phase, task: embeddedTask } = candidates[i];
      const taskRef = refs[i];

      const taskDoc: Omit<Task, 'id'> = {
        workflowId: workflow.id,
        productId: workflow.productId,
        phaseId: phase.id,
        title: embeddedTask.title,
        description: embeddedTask.description,
        skillsRequired: embeddedTask.skillsRequired,
        estimatedHours: embeddedTask.estimatedHours,
        // Use embedded storyPoints if available; compute from hours for legacy workflows
        storyPoints: embeddedTask.storyPoints ?? hoursToStoryPoints(embeddedTask.estimatedHours),
        priority: embeddedTask.priority as 'Low' | 'Medium' | 'High',
        status: 'unassigned',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      batch.set(taskRef, { id: docId, ...taskDoc });
      count++;
    }

    if (count > 0) await batch.commit();
    return count;
  }

  /**
   * Analyze project complexity using AI (JSON mode)
   */
  async analyzeProjectComplexity(description: string): Promise<ProjectAnalysis> {
    try {
      const prompt = `Analyze the following project description and provide insights.

Project Description: ${description}

Respond with JSON containing:
{
  "complexity": "Low",
  "estimatedDuration": "4-6 weeks",
  "recommendedApproach": "Agile with 2-week sprints",
  "riskFactors": ["Risk 1", "Risk 2"],
  "recommendedTeamSize": 4,
  "keyTechnologies": ["React", "Node.js"]
}

Use exactly "Low", "Medium", or "High" for complexity.`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text ?? '';

      let analysisData: ProjectAnalysis;
      try {
        analysisData = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in AI response');
        analysisData = JSON.parse(jsonMatch[0]);
      }

      return analysisData;
    } catch (error) {
      console.error('Project analysis error:', error);
      throw new Error(`Failed to analyze project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete workflow (soft delete)
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      await this.updateWorkflow(workflowId, { status: 'cancelled' });

      await firestore?.collection(this.workflowsCollection).doc(workflowId).update({
        isDeleted: true,
        updatedAt: new Date(),
      });

    } catch (error: any) {
      console.error('WorkflowService.deleteWorkflow error:', error);
      throw error;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private determinePriority(totalHours: number): 'High' | 'Medium' | 'Low' {
    if (totalHours >= 200) return 'High';
    if (totalHours >= 80) return 'Medium';
    return 'Low';
  }

  private calculateDuration(totalHours: number): string {
    const daysEstimate = Math.ceil(totalHours / 8);
    const weeksEstimate = Math.ceil(daysEstimate / 5);

    if (weeksEstimate <= 1) {
      return `${daysEstimate} day${daysEstimate !== 1 ? 's' : ''}`;
    } else if (weeksEstimate <= 4) {
      return `${weeksEstimate} week${weeksEstimate !== 1 ? 's' : ''}`;
    } else {
      const monthsEstimate = Math.ceil(weeksEstimate / 4);
      return `${monthsEstimate} month${monthsEstimate !== 1 ? 's' : ''}`;
    }
  }

  private determineComplexity(totalHours: number, phaseCount: number): 'Low' | 'Medium' | 'High' {
    if (totalHours <= 40 && phaseCount <= 3) return 'Low';
    if (totalHours <= 160 && phaseCount <= 5) return 'Medium';
    return 'High';
  }
}

export const workflowService = new WorkflowService();
