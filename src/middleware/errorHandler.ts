import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError, ValidationError, NotFoundError } from "../utils/errors";
import logger from "../config/logger";
import { config } from "../config/env";
import jwt from "jsonwebtoken";

/**
 * Global error handler middleware
 * HARUS ditempatkan di akhir setelah semua routes
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // log error
  logger.error("Error occur", {
    name: err.name,
    message: err.message,
    stack: config.isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // JWT errors
  if (err instanceof jwt.TokenExpiredError) {
    res.status(401).json({ success: false, error: "Token expired" });
    return;
  }
  if (err instanceof jwt.JsonWebTokenError) {
    res.status(401).json({ success: false, error: "Invalid token" });
    return;
  }

  // AppError (operational errors)
  if (err instanceof AppError) {
    const response: Record<string, any> = {
      success: false,
      error: err.message,
    };

    // include validation details
    if (err instanceof ValidationError && err.details) {
      response.details = err.details;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const errorMap: Record<string, { status: number; message: string }> = {
      P2002: { status: 409, message: "Resource already exists" }, // Unique constraint violation
      P2003: { status: 400, message: "Invalid reference" }, // Foreign key constraint failed
      P2025: { status: 404, message: "Resource not found" }, // Record not found
    };

    const mapped = errorMap[err.code];
    if (mapped) {
      res.status(mapped.status).json({
        success: false,
        error: mapped.message,
        ...(config.isDevelopment && { details: err.meta }),
      });
      return;
    }
  }

  // Prisma validation
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: "Invalid data provided",
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    error: config.isProduction ? "Internal server error" : err.message,
  });
  return;
};

/**
 * 404 Handler
 * Passes error to global error handler for consistent formatting and logging
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
};
