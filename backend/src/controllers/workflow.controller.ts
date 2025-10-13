import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { workflowService } from '../services/workflow.service';
import { productService } from '../services/products.services';
import { WorkflowStatus } from '../models/workflow.model';

export class WorkflowController {
  /**
   * Generate AI workflow for a product
   */
  async generateWorkflow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const { productId, description } = req.body;

      // Validation
      if (!productId) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
          code: 'MISSING_PRODUCT_ID'
        });
        return;
      }

      // Verify product exists and user has access
      const product = await productService.getProductById(productId);
      
      // Check if user has access to this product
      if (req.user.role !== 'admin' && product.clientId !== req.user.uid) {
        res.status(403).json({
          success: false,
          error: 'Access denied to this product',
          code: 'ACCESS_DENIED'
        });
        return;
      }

      // Generate workflow using AI
      const workflowData = await workflowService.generateWorkflow(
        description || product.description,
        productId,
        product.clientId
      );

      res.status(201).json({
        success: true,
        data: workflowData,
        message: 'Workflow generated successfully'
      });

    } catch (error: any) {
      console.error('WorkflowController.generateWorkflow error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate workflow',
        code: 'GENERATE_WORKFLOW_ERROR'
      });
    }
  }

  /**
   * Get all workflows with filtering
   */
  async getWorkflows(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const { status, productId, page, limit } = req.query;

      // Import WorkflowStatus type from the appropriate location if not already imported
      // import { WorkflowStatus } from '../models/workflow.model'; // adjust path as needed

      const filterOptions = {
        status: status ? status as WorkflowStatus : undefined,
        productId: productId as string,
        clientId: req.user.role === 'client' ? req.user.uid : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      };

      const result = await workflowService.getWorkflows(filterOptions);

      res.json({
        success: true,
        data: {
          workflows: result.workflows,
          pagination: result.pagination
        },
        message: `Retrieved ${result.workflows.length} workflows successfully`
      });

    } catch (error: any) {
      console.error('WorkflowController.getWorkflows error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve workflows',
        code: 'FETCH_WORKFLOWS_ERROR'
      });
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Workflow ID is required',
          code: 'MISSING_WORKFLOW_ID'
        });
        return;
      }

      const workflow = await workflowService.getWorkflowById(id);

      // Check access permissions
      if (req.user.role === 'client' && workflow.clientId !== req.user.uid) {
        res.status(403).json({
          success: false,
          error: 'Access denied to this workflow',
          code: 'ACCESS_DENIED'
        });
        return;
      }

      res.json({
        success: true,
        data: workflow,
        message: 'Workflow retrieved successfully'
      });

    } catch (error: any) {
      console.error('WorkflowController.getWorkflowById error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve workflow',
        code: 'FETCH_WORKFLOW_ERROR'
      });
    }
  }

  /**
   * Update workflow
   */
  async updateWorkflow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Workflow ID is required',
          code: 'MISSING_WORKFLOW_ID'
        });
        return;
      }

      // Check if workflow exists and user has access
      const existingWorkflow = await workflowService.getWorkflowById(id);
      
      if (req.user.role === 'client' && existingWorkflow.clientId !== req.user.uid) {
        res.status(403).json({
          success: false,
          error: 'Access denied to this workflow',
          code: 'ACCESS_DENIED'
        });
        return;
      }

      const updatedWorkflow = await workflowService.updateWorkflow(id, updateData);

      res.json({
        success: true,
        data: updatedWorkflow,
        message: 'Workflow updated successfully'
      });

    } catch (error: any) {
      console.error('WorkflowController.updateWorkflow error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update workflow',
        code: 'UPDATE_WORKFLOW_ERROR'
      });
    }
  }

  /**
   * Approve workflow (Admin only)
   */
  async approveWorkflow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Workflow ID is required',
          code: 'MISSING_WORKFLOW_ID'
        });
        return;
      }

      const result = await workflowService.approveWorkflow(id, req.user.uid);

      res.json({
        success: true,
        data: result,
        message: 'Workflow approved successfully'
      });

    } catch (error: any) {
      console.error('WorkflowController.approveWorkflow error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve workflow',
        code: 'APPROVE_WORKFLOW_ERROR'
      });
    }
  }

  /**
   * Analyze project complexity using AI
   */
  async analyzeProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const { description } = req.body;

      if (!description) {
        res.status(400).json({
          success: false,
          error: 'Project description is required',
          code: 'MISSING_DESCRIPTION'
        });
        return;
      }

      const analysis = await workflowService.analyzeProjectComplexity(description);

      res.json({
        success: true,
        data: analysis,
        message: 'Project analyzed successfully'
      });

    } catch (error: any) {
      console.error('WorkflowController.analyzeProject error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze project',
        code: 'ANALYZE_PROJECT_ERROR'
      });
    }
  }
}

export const workflowController = new WorkflowController();
