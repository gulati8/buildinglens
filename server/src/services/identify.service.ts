/**
 * Identify Service
 * Main orchestrator for building identification
 * Coordinates all services to identify buildings based on user location and heading
 */

import { env } from '../config/env';
import { logger } from '../utils/logger';
import {
  BuildingCandidate,
  Coordinates,
  IdentifyBuildingInput,
  IdentifyBuildingResult,
} from '../types/services.types';
import { findNearbyPlaces } from './places.service';
import { reverseGeocode } from './geocoding.service';
import { calculateBearingAndDistance } from './bearing.service';
import { calculateConfidenceScore } from './scoring.service';
import {
  getCachedBuildings,
  saveBuildingToCache,
  getCachedIdentifyResults,
  cacheIdentifyResults,
} from './cache.service';

/**
 * Identify buildings near user's location
 * @param input - User location, heading, and search parameters
 * @returns Identification result with ranked building candidates
 */
export async function identifyBuilding(
  input: IdentifyBuildingInput
): Promise<IdentifyBuildingResult> {
  const startTime = Date.now();
  const searchRadius = input.searchRadius || env.SEARCH_RADIUS_METERS;
  const userCoordinates: Coordinates = {
    latitude: input.latitude,
    longitude: input.longitude,
  };

  logger.info('Starting building identification', {
    coordinates: userCoordinates,
    heading: input.heading,
    searchRadius,
  });

  try {
    // Step 1: Check if we have cached identify results
    const cachedResults = await getCachedIdentifyResults(
      userCoordinates,
      input.heading,
      searchRadius
    );

    if (cachedResults) {
      logger.info('Returning cached identify results', {
        count: cachedResults.length,
        duration: Date.now() - startTime,
      });

      return {
        candidates: cachedResults,
        searchRadius,
        searchCenter: userCoordinates,
        heading: input.heading,
        timestamp: new Date(),
      };
    }

    // Step 2: Get all potential building candidates
    const candidates: BuildingCandidate[] = [];

    // 2a. Check database cache for nearby buildings
    const cachedBuildings = await getCachedBuildings(userCoordinates, searchRadius);
    logger.debug('Found cached buildings', { count: cachedBuildings.length });
    candidates.push(...cachedBuildings);

    // 2b. Query Google Places API for nearby places
    const nearbyPlaces = await findNearbyPlaces(userCoordinates, searchRadius);
    logger.debug('Found nearby places', { count: nearbyPlaces.length });

    // Convert places to candidates
    for (const place of nearbyPlaces) {
      candidates.push({
        externalId: place.placeId,
        name: place.name,
        address: place.address,
        coordinates: place.coordinates,
        distance: 0, // Will be calculated next
        bearing: 0, // Will be calculated next
        confidence: 0, // Will be calculated next
        source: 'google_places',
        metadata: {
          rating: place.rating,
          userRatingsTotal: place.userRatingsTotal,
          types: place.types,
          ...place.metadata,
        },
      });
    }

    // 2c. If we have very few candidates, try geocoding as fallback
    if (candidates.length < 3) {
      logger.info('Few candidates found, trying geocoding fallback');
      const geocodeResult = await reverseGeocode(userCoordinates);

      if (geocodeResult) {
        candidates.push({
          externalId: geocodeResult.placeId,
          name: geocodeResult.name,
          address: geocodeResult.address,
          coordinates: geocodeResult.coordinates,
          distance: 0,
          bearing: 0,
          confidence: 0,
          source: geocodeResult.source,
          metadata: geocodeResult.metadata,
        });
      }
    }

    // Step 3: Calculate bearing and distance for each candidate
    for (const candidate of candidates) {
      const bearingCalc = calculateBearingAndDistance(
        userCoordinates,
        candidate.coordinates,
        input.heading
      );

      candidate.distance = bearingCalc.distance;
      candidate.bearing = bearingCalc.bearing;
      candidate.bearingDiff = bearingCalc.bearingDiff;
    }

    // Step 4: Calculate confidence scores
    for (const candidate of candidates) {
      candidate.confidence = calculateConfidenceScore({
        distance: candidate.distance,
        bearingDiff: candidate.bearingDiff,
        source: candidate.source,
        hasName: !!candidate.name,
        hasRating: candidate.metadata?.rating !== undefined,
      });
    }

    // Step 5: Sort by confidence (highest first)
    candidates.sort((a, b) => b.confidence - a.confidence);

    // Step 6: Cache results for future requests
    // Cache top candidates to database (not from cache source)
    const topCandidates = candidates
      .filter((c) => c.source !== 'cache' && c.confidence > 30)
      .slice(0, 5);

    await Promise.allSettled(
      topCandidates.map((candidate) => saveBuildingToCache(candidate))
    );

    // Cache complete results to Redis
    await cacheIdentifyResults(userCoordinates, input.heading, searchRadius, candidates);

    const duration = Date.now() - startTime;

    logger.info('Building identification complete', {
      candidatesFound: candidates.length,
      topConfidence: candidates[0]?.confidence,
      duration,
    });

    return {
      candidates,
      searchRadius,
      searchCenter: userCoordinates,
      heading: input.heading,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error('Error identifying building', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      input,
    });

    throw error;
  }
}

/**
 * Get the most likely building for user's location
 * Convenience method that returns only the top candidate
 * @param input - User location, heading, and search parameters
 * @returns Top building candidate or null if none found
 */
export async function identifyTopBuilding(
  input: IdentifyBuildingInput
): Promise<BuildingCandidate | null> {
  const result = await identifyBuilding(input);

  if (result.candidates.length === 0) {
    return null;
  }

  return result.candidates[0] || null;
}
