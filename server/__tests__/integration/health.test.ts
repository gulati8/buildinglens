import request from 'supertest';
import { app } from '../../src/app';
import { pool } from '../../src/config/database';
import { redis } from '../../src/config/redis';

/**
 * Health endpoint integration tests
 */
describe('Health Check Endpoint', () => {
  /**
   * Cleanup after all tests
   */
  afterAll(async () => {
    await pool.end();
    await redis.quit();
  });

  /**
   * Test successful health check
   */
  it('should return 200 status with healthy services', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('services');
    expect(response.body.services).toHaveProperty('postgres');
    expect(response.body.services).toHaveProperty('redis');
  });

  /**
   * Test PostgreSQL status
   */
  it('should report PostgreSQL as up', async () => {
    const response = await request(app).get('/health');

    expect(response.body.services.postgres.status).toBe('up');
  });

  /**
   * Test Redis status
   */
  it('should report Redis as up', async () => {
    const response = await request(app).get('/health');

    expect(response.body.services.redis.status).toBe('up');
  });

  /**
   * Test response structure
   */
  it('should return proper response structure', async () => {
    const response = await request(app).get('/health');

    expect(response.body).toEqual({
      status: expect.stringMatching(/^(healthy|unhealthy)$/),
      timestamp: expect.any(String),
      services: {
        postgres: {
          status: expect.stringMatching(/^(up|down)$/),
        },
        redis: {
          status: expect.stringMatching(/^(up|down)$/),
        },
      },
    });
  });

  /**
   * Test timestamp format
   */
  it('should return valid ISO timestamp', async () => {
    const response = await request(app).get('/health');
    const timestamp = new Date(response.body.timestamp);

    expect(timestamp.toISOString()).toBe(response.body.timestamp);
  });
});
