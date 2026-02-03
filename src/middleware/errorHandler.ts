import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Global error handler middleware
 * HARUS ditempatkan di akhir setelah semua routes
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Resource already exists',
        details: err.meta
      });
    }
    
    // Foreign key constraint failed
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Invalid reference'
      });
    }
    
    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }
    
  }
  
  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Invalid data provided'
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
};
