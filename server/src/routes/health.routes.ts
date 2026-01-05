import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { healthCheck } from '../controllers/health.controller';

/**
 * Health check routes
 * Provides endpoints for monitoring service health
 */
const router = Router();

/**
 * GET /health
 * Check the health status of all services
 * @returns Health status of PostgreSQL and Redis
 */
router.get('/', asyncHandler(healthCheck));

export default router;
