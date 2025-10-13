import type { Express } from "express";
import { createServer, type Server } from "http";
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Import route modules
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products.routes';
import workflowRoutes from './routes/workflows.routes';
import taskRoutes from './routes/tasks';
import aiRoutes from './routes/ai';

// Import middleware
import { errorHandler } from './middlewares/errorHandler';

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS configuration
  const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(cors(corsOptions));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', limiter);

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/workflows', workflowRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/ai', aiRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Demo AI endpoint without authentication
  app.post('/api/demo/workflow', async (req, res): Promise<void> => {
    try {
      const { description, requirements, timeline, budget } = req.body;
      
      if (!description) {
        res.status(400).json({ message: 'Description is required' });
        return;
      }

      // Import workflowService dynamically
      const { workflowService } = await import('./services/workflow.service');
      
      // For demo, use dummy productId and clientId
      const workflow = await workflowService.generateWorkflow(description, 'demo-product', 'demo-client');

      res.json({ 
        success: true,
        workflow,
        message: 'Demo workflow generated successfully' 
      });
    } catch (error) {
      console.error('Error generating demo workflow:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to generate workflow',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  const httpServer = createServer(app);

  return httpServer;
}
