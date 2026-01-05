/**
 * Identify Routes
 * Defines routes for building identification endpoints
 */

import { Router } from 'express';
import { identifyBuildingController } from '../controllers/identify.controller';
import { validateRequest } from '../middleware/request-validator';
import { IdentifyRequestSchema } from '../types/api.types';
import { rateLimiter } from '../middleware/rate-limiter';

/**
 * Create router for identify endpoints
 */
const router = Router();

/**
 * POST /identify
 * Identify buildings based on GPS coordinates and heading
 *
 * Request body:
 * - latitude: number (-90 to 90)
 * - longitude: number (-180 to 180)
 * - heading: number (0 to 360, optional)
 * - searchRadius: number (positive, optional, default: 100)
 *
 * Response:
 * - candidates: BuildingCandidate[]
 * - query: object with request parameters
 * - metadata: object with search metadata
 */
router.post(
  '/identify',
  rateLimiter,
  validateRequest({ body: IdentifyRequestSchema }),
  identifyBuildingController
);

export default router;
