import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { asyncHandler } from './utils/asyncHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Body parsers
app.use(express.json());                      // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse form data

// ============================================
// ROUTES
// ============================================

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', (req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Root endpoint
 * GET /
 */
app.get('/', (req: Request, res: Response): void => {
  res.json({
    message: 'Express + TypeScript API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/users'
    }
  });
});

/**
 * Example async route
 * GET /async-example
 */
app.get('/async-example', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));

  res.json({
    message: 'This is an async route',
    timestamp: new Date().toISOString()
  });
}));

// ============================================
// ERROR HANDLERS (MUST BE LAST!)
// ============================================

// 404 handler
app.use((req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
