import jwt from 'jsonwebtoken';
import { config } from '../config/env';

/**
 * JWT Payload interface
 * Define structure of data stored in token
 */
export interface JWTPayload {
  userId: number;
  email: string;
}

/**
 * Generate JWT token
 * @param payload - User data to encode in token
 * @returns Signed JWT token
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any
  });
};

/**
 * Verify and decode JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload
 * @throws Error if token is invalid or expired
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};
