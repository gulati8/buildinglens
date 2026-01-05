import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

/**
 * Redis client configuration with retry strategy
 */
const redisConfig = {
  retryStrategy(times: number): number | null {
    const delay = Math.min(times * 50, 2000); // Exponential backoff up to 2 seconds

    if (times > 20) {
      logger.error('Redis connection failed after 20 retries');
      return null; // Stop retrying
    }

    logger.warn(`Redis connection attempt ${times}, retrying in ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
};

/**
 * Redis client instance
 * Manages connection to Redis for caching and rate limiting
 */
export const redis = new Redis(env.REDIS_URL, redisConfig);

/**
 * Handle Redis connection events
 */
redis.on('connect', () => {
  logger.info('Connecting to Redis...');
});

redis.on('ready', () => {
  logger.info('Redis connection established and ready');
});

redis.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message, stack: err.stack });
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', (delay: number) => {
  logger.info(`Reconnecting to Redis in ${delay}ms`);
});

redis.on('end', () => {
  logger.info('Redis connection ended');
});

/**
 * Test Redis connection
 * @returns Promise that resolves if connection is successful
 */
export async function testRedisConnection(): Promise<void> {
  try {
    const result = await redis.ping();
    if (result !== 'PONG') {
      throw new Error('Redis PING failed');
    }
    logger.info('Redis connection test successful');
  } catch (error) {
    logger.error('Redis connection test failed', { error });
    throw error;
  }
}

/**
 * Gracefully close Redis connection
 * Should be called during application shutdown
 */
export async function closeRedis(): Promise<void> {
  try {
    await redis.quit();
    logger.info('Redis connection closed successfully');
  } catch (error) {
    logger.error('Error closing Redis connection', { error });
    // Force disconnect if graceful shutdown fails
    redis.disconnect();
  }
}

/**
 * Cache TTL values from environment
 */
export const CACHE_TTL = {
  GEOCODING: env.REDIS_TTL_GEOCODING,
  PLACES: env.REDIS_TTL_PLACES,
  IDENTIFY: env.REDIS_TTL_IDENTIFY,
} as const;
