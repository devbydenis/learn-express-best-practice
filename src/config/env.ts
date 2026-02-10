import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Environment variable schema
 * Runtime validation dengan Zod
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().positive()),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // Bcrypt
  BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().int().min(10).max(12)).default(10),

  // CORS
  ALLOWED_ORIGINS: z.string().transform((s) => s.split(',')),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), // 15 min
  RATE_LIMIT_MAX: z.string().transform(Number).default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), 
  AUTH_RATE_LIMIT_MAX: z.string().transform(Number).default(5),            

});

/**
 * Parse and validate environment variables
 * Fail fast if invalid configuration
 */
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    console.error(error);
    process.exit(1);
  }
};

const env = parseEnv();

/**
 * Type-safe configuration object
 */
export const config = {
  // Server
  nodeEnv: env.NODE_ENV,
  port: env.PORT,

  // Database
  database: {
    url: env.DATABASE_URL,
  },

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },

  // Bcrypt
  bcrypt: {
    rounds: env.BCRYPT_ROUNDS,
  },

  // CORS
  cors: {
    allowedOrigins: env.ALLOWED_ORIGINS,
  },

  // Rate Limiting
  rateLimit: {
    authMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    authMax: env.AUTH_RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },

  // Helpers
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;
