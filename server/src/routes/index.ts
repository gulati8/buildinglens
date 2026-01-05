import { Router } from 'express';
import healthRoutes from './health.routes';
import identifyRoutes from './identify.routes';

/**
 * Main router
 * Mounts all route modules
 */
const router = Router();

/**
 * Health check routes (root level)
 */
router.use('/health', healthRoutes);

/**
 * API routes
 */
router.use('/api', identifyRoutes);

export default router;
