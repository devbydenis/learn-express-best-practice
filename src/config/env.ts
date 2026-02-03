import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized environment configuration
 * Validate required variables at startup
 */

// Required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
];

// Validate
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

// Export typed config
export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // Bcrypt
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '10')
  }
} as const;  // Make readonly
