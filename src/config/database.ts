import { PrismaClient, Prisma } from '@prisma/client';
import logger from './logger';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient<Prisma.PrismaClientOptions> | undefined;
}

/**
 * Prisma Client with logging and error handling
 */
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: Prisma.QueryEvent) => {
    logger.debug('Query:', { query: e.query, duration: `${e.duration}ms` });
  });
}

// Log errors
prisma.$on('error' as never, (e: Prisma.LogEvent) => {
  logger.error('Prisma error:', e);
});

// Log warnings
prisma.$on('warn' as never, (e: Prisma.LogEvent) => {
  logger.warn('Prisma warning:', e);
});

// Reuse in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Graceful shutdown
 */
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};

export default prisma;