import { Request } from 'express'
import rateLimit from "express-rate-limit";
import { config } from "../config/env";
import { JWTPayload } from '../types/user.types';

interface AuthenticatedRequest extends Request {
  user?: JWTPayload
}

/**
 * Helper: Get unique key for rate limiting
 * Uses IP for guests, IP + UserID for authenticated users
 */
const getKey = (req: AuthenticatedRequest): string => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const userId = req.user?.userId;

  return userId ? `${ip}:${userId}` : ip;
};

/**
 * Helper: Format rate limit error response
 * Matches your app's error handling pattern
 */

const rateLimitterHandler = (_req: any, res: any) => {
  res.status(429).json({
    success: false,
    error: "Too many requests, please try again later",
    retryAfter: res.getHeader("Retry-After"), // seconds until reset
  });
};

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,

  // use custom key generator
  keyGenerator: getKey,

  // skip health check
  skip: (req) => req.path === "/health",

  // custom error handler
  handler: rateLimitterHandler,

  // Headers: `RateLimit-*` (standard) and `X-RateLimit-*` (legacy)
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth routes limiter (stricter)
 */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.authMs,
  max: config.rateLimit.authMax,

  keyGenerator: getKey,

  handler: rateLimitterHandler,
  
  // dont count successfully logins against the limit
  skipSuccessfulRequests: true,

  standardHeaders: true,
  legacyHeaders: false,
});
