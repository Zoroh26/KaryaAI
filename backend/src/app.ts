import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { checkFirebaseConnection } from './config/firebase';


// Import routes - using the existing JavaScript route for now


const app: Application = express();

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Health check endpoint with database status
app.get('/', async (req: Request, res: Response) => {
    const dbConnected = await checkFirebaseConnection();
    
    res.json({
        message: 'KaryaAI Backend API is running! 🚀',
        version: '1.0.0',
        status: 'healthy',
        database: {
            connected: dbConnected,
            type: 'Firebase Firestore'
        },
        timestamp: new Date().toISOString()
    });
});

// Import auth routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import productsRoutes from './routes/products.routes';
import workflowsRoutes from './routes/workflows.routes';
import tasksRoutes from './routes/tasks';
import aiRoutes from './routes/ai';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/workflows', workflowsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/ai', aiRoutes);


// Database health check endpoint
app.get('/health/db', async (req: Request, res: Response) => {
    try {
        const isConnected = await checkFirebaseConnection();
        res.json({
            database: {
                status: isConnected ? 'connected' : 'disconnected',
                type: 'Firebase Firestore',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            database: {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            }
        });
    }
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

export default app;
