/**
 * Identify Controller
 * Handles HTTP requests for building identification endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { identifyBuilding } from '../services/identify.service';
import { IdentifyRequest, IdentifyResponse } from '../types/api.types';
import { logger } from '../utils/logger';
import { APIError, asyncHandler } from '../middleware/error-handler';

/**
 * Controller for POST /api/identify endpoint
 * Identifies buildings based on user's GPS coordinates and heading
 *
 * @param req - Express request object with validated body
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns JSON response with building candidates
 *
 * @example
 * Request body:
 * {
 *   "latitude": 37.7749,
 *   "longitude": -122.4194,
 *   "heading": 45,
 *   "searchRadius": 100
 * }
 *
 * Response:
 * {
 *   "candidates": [...],
 *   "query": {...},
 *   "metadata": {...}
 * }
 */
export const identifyBuildingController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
      // Request body is already validated by validateRequest middleware
      const validatedBody = req.body as IdentifyRequest;

      logger.info('Identify building request received', {
        latitude: validatedBody.latitude,
        longitude: validatedBody.longitude,
        heading: validatedBody.heading,
        searchRadius: validatedBody.searchRadius,
      });

      // Call the identify service
      const result = await identifyBuilding({
        latitude: validatedBody.latitude,
        longitude: validatedBody.longitude,
        heading: validatedBody.heading,
        searchRadius: validatedBody.searchRadius,
      });

      // Format the response
      const response: IdentifyResponse = {
        candidates: result.candidates,
        query: {
          latitude: validatedBody.latitude,
          longitude: validatedBody.longitude,
          heading: validatedBody.heading,
          searchRadius: result.searchRadius,
        },
        metadata: {
          searchCenter: result.searchCenter,
          timestamp: result.timestamp.toISOString(),
          resultCount: result.candidates.length,
        },
      };

      logger.info('Identify building request successful', {
        candidatesFound: result.candidates.length,
        topConfidence: result.candidates[0]?.confidence,
      });

      return res.status(200).json(response);
    } catch (error) {
      logger.error('Error in identify controller', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // If it's already an APIError, pass it through
      if (error instanceof APIError) {
        return next(error);
      }

      // Wrap unknown errors in APIError
      return next(
        new APIError(
          500,
          'Failed to identify building',
          'IDENTIFICATION_ERROR',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
    }
  }
);
