import { JWTPayload } from '../utils/jwt';

/**
 * Extend Express Request interface
 * Add custom properties yang di-inject oleh middleware
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;  // User info dari auth middleware
    }
  }
}
