import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { UnauthorizedError } from "../utils/errors";
import logger from "../config/logger";

/**
 * Authentication middleware
 * Verifies JWT token dan inject user info ke request
 *
 * Usage:
 * router.get('/protected', authMiddleware, handler)
 */
export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    // Check header
    if (!authHeader) {
      throw new UnauthorizedError("No token provided");
    }

    // Check format: "Bearer <token>"
    if (!authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Invalid token format. Use: Bearer <token>");
    }

    // Extract token
    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("Token is empty");
    }

    // Verify token
    const decoded = verifyToken(token);

    // Inject user info ke request
    req.user = decoded;

    return next();
  } catch (error) {
    logger.warn("Auth failed", { error: (error as Error).message });

    next(new UnauthorizedError("Invalid or expired token"))
  }
};
