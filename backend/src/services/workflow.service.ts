import { model } from '../config/gemini';
import { firestore } from '../config/firebase';
import { 
  Workflow, 
  WorkflowStructure, 
  WorkflowPhase,
  WorkflowTask,
  WorkflowSummary,
  CreateWorkflowData, 
  UpdateWorkflowData, 
  WorkflowFilterOptions, 
  ProjectAnalysis,
  WorkflowStatus 
} from '../models/workflow.model';
import { productService } from './products.services';

export class WorkflowService {
  private readonly workflowsCollection = 'workflows';

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

      // Transform AI structure to hierarchical format
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
   * Transform AI workflow structure to hierarchical format
   */
  private transformToHierarchical(aiStructure: WorkflowStructure, productId: string, clientId: string): Omit<Workflow, 'id'> {
    const phases: WorkflowPhase[] = [];
    let totalTasks = 0;

    // Transform each phase
    aiStructure.phases.forEach((aiPhase, phaseIndex) => {
      const tasks: WorkflowTask[] = [];

      // Transform each task within the phase
      aiPhase.tasks.forEach((aiTask, taskIndex) => {
        const taskId = `task_${phaseIndex + 1}_${taskIndex + 1}`;
        
        tasks.push({
          id: taskId,
          title: aiTask.title,
          description: aiTask.description,
          skillsRequired: aiTask.skillsRequired,
          estimatedHours: aiTask.estimatedHours,
          priority: aiTask.priority,
          status: 'pending',
          order: taskIndex + 1,
          dependencies: aiTask.dependencies || [],
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

    // Determine priority based on complexity
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
   * Generate workflow structure using AI
   */
  private async generateWorkflowStructure(projectDescription: string): Promise<WorkflowStructure> {
    try {
      const systemPrompt = `You are an expert project manager and workflow architect. 
Generate a detailed, structured workflow for the given project description.

Requirements:
1. Break down the project into logical phases (3-6 phases typically)
2. Create specific, actionable tasks for each phase
3. Specify required skills for each task
4. Estimate realistic hours for each task (consider 8-hour workdays)
5. Set appropriate priority levels
6. Consider task dependencies where relevant

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
          "priority": "High|Medium|Low",
          "dependencies": ["optional task dependencies"]
        }
      ]
    }
  ],
  "totalEstimatedHours": 120,
  "recommendedTeamSize": 4
}`;

      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nProject Description: ${projectDescription}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      const responseText = response.response.text();
      
      // Clean up the response to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const workflowData = JSON.parse(jsonMatch[0]);
      
      // Validate the structure
      if (!workflowData.title || !workflowData.phases || !Array.isArray(workflowData.phases)) {
        throw new Error('Invalid workflow structure from AI');
      }

      return workflowData as WorkflowStructure;
    } catch (error) {
      console.error('Gemini workflow generation error:', error);
      throw new Error(`Failed to generate workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all workflows with filtering and pagination - Enhanced response format
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

      // Use simple query to avoid composite index requirements
      let query: FirebaseFirestore.Query = firestore.collection(this.workflowsCollection);

      // Only apply clientId filter at database level if specified
      if (options.clientId) {
        query = query.where('clientId', '==', options.clientId);
      }

      const snapshot = await query.get();
      console.log(`Found ${snapshot.size} workflows`);

      let workflows: Workflow[] = [];
      snapshot.docs.forEach((doc) => {
        const workflowData = doc.data() as Omit<Workflow, 'id'>;
        workflows.push({
          id: doc.id,
          ...workflowData,
        });
      });

      // Apply additional filters in memory
      workflows = workflows.filter(workflow => {
        // Filter out soft-deleted workflows
        if (workflow.isDeleted) return false;
        
        // Apply status filter
        if (options.status && workflow.status !== options.status) return false;
        
        // Apply productId filter
        if (options.productId && workflow.productId !== options.productId) return false;
        
        return true;
      });

      // Apply sorting in memory
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

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 10;
      const total = workflows.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedWorkflows = workflows.slice(startIndex, endIndex);
      
      console.log(`Returning ${paginatedWorkflows.length} workflows after filtering and pagination`);

      return {
        workflows: paginatedWorkflows,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
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

      return {
        id: workflowDoc.id,
        ...workflowData,
      };

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

      // Check if workflow exists
      const workflowDoc = await firestore.collection(this.workflowsCollection).doc(workflowId).get();
      
      if (!workflowDoc.exists) {
        throw new Error('Workflow not found');
      }

      const updates = {
        ...updateData,
        updatedAt: new Date(),
      };

      await firestore.collection(this.workflowsCollection).doc(workflowId).update(updates);

      // Return updated workflow
      return await this.getWorkflowById(workflowId);

    } catch (error: any) {
      console.error('WorkflowService.updateWorkflow error:', error);
      throw error;
    }
  }

  /**
   * Approve workflow and update product status
   */
  async approveWorkflow(workflowId: string, approvedBy: string): Promise<{
    workflow: Workflow;
    productUpdated: boolean;
  }> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      // Get workflow
      const workflow = await this.getWorkflowById(workflowId);

      // Update workflow status
      const updatedWorkflow = await this.updateWorkflow(workflowId, {
        status: 'approved',
        approvedBy,
      });

      // Update associated product status
      let productUpdated = false;
      try {
        await productService.updateProduct(workflow.productId, {
          status: 'in_progress',
        });
        productUpdated = true;
      } catch (error) {
        console.error('Failed to update product status:', error);
      }

      return {
        workflow: updatedWorkflow,
        productUpdated,
      };

    } catch (error: any) {
      console.error('WorkflowService.approveWorkflow error:', error);
      throw error;
    }
  }

  /**
   * Analyze project complexity using AI
   */
  async analyzeProjectComplexity(description: string): Promise<ProjectAnalysis> {
    try {
      const prompt = `Analyze the following project description and provide insights:

Project Description: ${description}

Respond with JSON containing:
{
  "complexity": "Low|Medium|High",
  "estimatedDuration": "human-readable duration estimate",
  "recommendedApproach": "brief methodology recommendation",
  "riskFactors": ["array", "of", "potential", "risks"],
  "recommendedTeamSize": 4,
  "keyTechnologies": ["tech1", "tech2"]
}`;

      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      const responseText = response.response.text();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      return JSON.parse(jsonMatch[0]) as ProjectAnalysis;
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
      await this.updateWorkflow(workflowId, {
        status: 'cancelled',
      });
      
      // Also mark as deleted
      await firestore?.collection(this.workflowsCollection).doc(workflowId).update({
        isDeleted: true,
        updatedAt: new Date(),
      });

    } catch (error: any) {
      console.error('WorkflowService.deleteWorkflow error:', error);
      throw error;
    }
  }

  /**
   * Helper: Determine project priority based on estimated hours
   */
  private determinePriority(totalHours: number): 'High' | 'Medium' | 'Low' {
    if (totalHours >= 200) return 'High';
    if (totalHours >= 80) return 'Medium';
    return 'Low';
  }

  /**
   * Helper: Calculate estimated duration from total hours
   */
  private calculateDuration(totalHours: number): string {
    const daysEstimate = Math.ceil(totalHours / 8); // 8 hours per day
    const weeksEstimate = Math.ceil(daysEstimate / 5); // 5 working days per week

    if (weeksEstimate <= 1) {
      return `${daysEstimate} day${daysEstimate !== 1 ? 's' : ''}`;
    } else if (weeksEstimate <= 4) {
      return `${weeksEstimate} week${weeksEstimate !== 1 ? 's' : ''}`;
    } else {
      const monthsEstimate = Math.ceil(weeksEstimate / 4);
      return `${monthsEstimate} month${monthsEstimate !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Helper: Determine project complexity
   */
  private determineComplexity(totalHours: number, phaseCount: number): 'Low' | 'Medium' | 'High' {
    if (totalHours <= 40 && phaseCount <= 3) return 'Low';
    if (totalHours <= 160 && phaseCount <= 5) return 'Medium';
    return 'High';
  }
}

export const workflowService = new WorkflowService();

