import { Pool, PoolConfig } from 'pg';
import { env } from './env';
import { logger } from '../utils/logger';

/**
 * PostgreSQL connection pool configuration
 */
const poolConfig: PoolConfig = {
  connectionString: env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
};

/**
 * PostgreSQL connection pool instance
 * Manages database connections efficiently with automatic connection pooling
 */
export const pool = new Pool(poolConfig);

/**
 * Handle pool errors
 * These are errors that occur on idle clients in the pool
 */
pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', { error: err.message, stack: err.stack });
});

/**
 * Handle successful connections
 */
pool.on('connect', () => {
  logger.debug('New database connection established');
});

/**
 * Handle client removal from pool
 */
pool.on('remove', () => {
  logger.debug('Database client removed from pool');
});

/**
 * Test database connection
 * @returns Promise that resolves if connection is successful
 */
export async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection test successful');
  } catch (error) {
    logger.error('Database connection test failed', { error });
    throw error;
  }
}

/**
 * Gracefully close database pool
 * Should be called during application shutdown
 */
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    logger.info('Database pool closed successfully');
  } catch (error) {
    logger.error('Error closing database pool', { error });
    throw error;
  }
}
