import winston from 'winston';
import { config } from './env';

/**
 * Log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console format (development)
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

/**
 * Create logger instance
 */
const logger = winston.createLogger({
  level: config.isDevelopment ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: { service: 'express-app' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

/**
 * Stream for Morgan HTTP logger
 */
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
