import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { checkFirebaseConnection } from './config/firebase';

// Import routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import productsRoutes from './routes/products.routes';
import workflowsRoutes from './routes/workflows.routes';
import tasksRoutes from './routes/tasks';
import aiRoutes from './routes/ai';
import { errorHandler } from './middlewares/errorHandler';

const app: Application = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  process.env.FRONTEND_URL || 'http://localhost:3001',
  'http://localhost:3000',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body & cookie parsing ────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Rate limiting (applied to all /api/* routes) ────────────────────────────

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // limit each IP to 100 requests per window
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for AI generation endpoints (expensive Gemini calls)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,
  message: { success: false, error: 'AI generation rate limit exceeded. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/api/ai/generate-workflow', aiLimiter);
app.use('/api/ai/demo-workflow', aiLimiter);
app.use('/api/workflows/generate', aiLimiter);

// ─── Health checks ────────────────────────────────────────────────────────────

app.get('/', async (req: Request, res: Response) => {
  const dbConnected = await checkFirebaseConnection();
  res.json({
    message: 'KaryaAI Backend API is running! 🚀',
    version: '1.0.0',
    status: 'healthy',
    database: { connected: dbConnected, type: 'Firebase Firestore' },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', async (req: Request, res: Response) => {
  const dbConnected = await checkFirebaseConnection();
  res.json({
    status: dbConnected ? 'OK' : 'DEGRADED',
    database: { connected: dbConnected },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/workflows', workflowsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/ai', aiRoutes);

// ─── Global error handler ─────────────────────────────────────────────────────

app.use(errorHandler);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

export default app;
