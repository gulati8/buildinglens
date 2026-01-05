import { Request, Response } from 'express';
import { pool } from '../config/database';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Health check response interface
 */
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    postgres: {
      status: 'up' | 'down';
      message?: string;
    };
    redis: {
      status: 'up' | 'down';
      message?: string;
    };
  };
}

/**
 * Health check controller
 * Verifies that all critical services (PostgreSQL, Redis) are operational
 *
 * @param _req - Express request object
 * @param res - Express response object
 */
export async function healthCheck(_req: Request, res: Response): Promise<void> {
  const response: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      postgres: { status: 'down' },
      redis: { status: 'down' },
    },
  };

  // Check PostgreSQL connection
  try {
    const result = await pool.query('SELECT 1 as health_check');
    if (result.rows[0]?.health_check === 1) {
      response.services.postgres.status = 'up';
      logger.debug('PostgreSQL health check passed');
    } else {
      response.services.postgres.status = 'down';
      response.services.postgres.message = 'Unexpected query result';
      response.status = 'unhealthy';
      logger.warn('PostgreSQL health check failed: unexpected result');
    }
  } catch (error) {
    response.services.postgres.status = 'down';
    response.services.postgres.message = error instanceof Error ? error.message : 'Unknown error';
    response.status = 'unhealthy';
    logger.error('PostgreSQL health check failed', { error });
  }

  // Check Redis connection
  try {
    const result = await redis.ping();
    if (result === 'PONG') {
      response.services.redis.status = 'up';
      logger.debug('Redis health check passed');
    } else {
      response.services.redis.status = 'down';
      response.services.redis.message = 'Unexpected ping result';
      response.status = 'unhealthy';
      logger.warn('Redis health check failed: unexpected result');
    }
  } catch (error) {
    response.services.redis.status = 'down';
    response.services.redis.message = error instanceof Error ? error.message : 'Unknown error';
    response.status = 'unhealthy';
    logger.error('Redis health check failed', { error });
  }

  // Return appropriate status code
  const statusCode = response.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(response);
}
