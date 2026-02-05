import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

/**
 * Authentication middleware
 * Verifies JWT token dan inject user info ke request
 *
 * Usage:
 * router.get('/protected', authMiddleware, handler)
 */
export const authMiddleware = (
  req: any,  // Using any because of Express.Request extension
  res: Response,
  next: NextFunction
) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;
    console.log(authHeader);

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'No token provided'
      });
      return;
    }

    // Check format: "Bearer <token>"
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Invalid token format. Use: Bearer <token>'
      });
      return;
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);

    // Inject user info ke request
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    });
    return;
  }
};
