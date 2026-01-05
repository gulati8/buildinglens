/**
 * API request/response type definitions
 * Defines Zod schemas for request validation and TypeScript types for API layer
 */

import { z } from 'zod';
import { BuildingCandidate, Coordinates } from './services.types';

/**
 * Request schema for building identification endpoint
 * Validates GPS coordinates, heading, and search radius
 */
export const IdentifyRequestSchema = z.object({
  latitude: z
    .number({
      required_error: 'Latitude is required',
      invalid_type_error: 'Latitude must be a number',
    })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),

  longitude: z
    .number({
      required_error: 'Longitude is required',
      invalid_type_error: 'Longitude must be a number',
    })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),

  heading: z
    .number({
      invalid_type_error: 'Heading must be a number',
    })
    .min(0, 'Heading must be between 0 and 360')
    .max(360, 'Heading must be between 0 and 360')
    .optional(),

  searchRadius: z
    .number({
      invalid_type_error: 'Search radius must be a number',
    })
    .positive('Search radius must be a positive number')
    .optional()
    .default(100),
});

/**
 * TypeScript type inferred from IdentifyRequestSchema
 */
export type IdentifyRequest = z.infer<typeof IdentifyRequestSchema>;

/**
 * Response format for building identification endpoint
 * Includes candidates array, query parameters, and timestamp
 */
export interface IdentifyResponse {
  candidates: BuildingCandidate[];
  query: {
    latitude: number;
    longitude: number;
    heading?: number;
    searchRadius: number;
  };
  metadata: {
    searchCenter: Coordinates;
    timestamp: string;
    resultCount: number;
  };
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: unknown;
    stack?: string;
  };
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database?: 'healthy' | 'unhealthy';
    redis?: 'healthy' | 'unhealthy';
    externalAPIs?: 'healthy' | 'degraded';
  };
}
