/**
 * Cache Service
 * Manages building cache operations across Redis and PostgreSQL
 * Provides unified interface for caching and retrieving building data
 */

import { redis, CACHE_TTL } from '../config/redis';
import { logger } from '../utils/logger';
import {
  saveBuildingToDatabase,
  findBuildingsNearLocation,
} from './database.service';
import {
  BuildingCandidate,
  CachedBuilding,
  Coordinates,
} from '../types/services.types';

/**
 * Cache key prefix for identify results
 */
const IDENTIFY_CACHE_PREFIX = 'identify:';

/**
 * Generate cache key for identify results
 * @param lat - Latitude
 * @param lon - Longitude
 * @param heading - Optional heading
 * @param radius - Search radius
 * @returns Cache key string
 */
function getIdentifyCacheKey(
  lat: number,
  lon: number,
  heading: number | undefined,
  radius: number
): string {
  const roundedLat = lat.toFixed(5);
  const roundedLon = lon.toFixed(5);
  const headingStr = heading !== undefined ? `:h${Math.round(heading)}` : '';
  return `${IDENTIFY_CACHE_PREFIX}${roundedLat},${roundedLon}${headingStr}:${radius}`;
}

/**
 * Get cached buildings near a location from PostgreSQL
 * @param coordinates - Center point for search
 * @param radiusMeters - Search radius in meters
 * @returns Array of building candidates from cache
 */
export async function getCachedBuildings(
  coordinates: Coordinates,
  radiusMeters: number
): Promise<BuildingCandidate[]> {
  try {
    const cachedBuildings = await findBuildingsNearLocation(coordinates, radiusMeters);

    // Transform CachedBuilding to BuildingCandidate
    const candidates: BuildingCandidate[] = cachedBuildings.map((building) => ({
      id: building.id,
      externalId: building.externalId,
      name: building.name,
      address: building.address,
      coordinates: {
        latitude: building.latitude,
        longitude: building.longitude,
      },
      distance: 0, // Will be calculated by caller
      bearing: 0, // Will be calculated by caller
      confidence: 0, // Will be calculated by caller
      source: 'cache',
      metadata: building.metadata,
    }));

    logger.debug('Retrieved cached buildings', {
      coordinates,
      radiusMeters,
      count: candidates.length,
    });

    return candidates;
  } catch (error) {
    logger.error('Error getting cached buildings', {
      error: error instanceof Error ? error.message : 'Unknown error',
      coordinates,
      radiusMeters,
    });
    return [];
  }
}

/**
 * Save a building candidate to cache (both Redis and PostgreSQL)
 * @param candidate - Building candidate to cache
 * @param ttlSeconds - Optional TTL in seconds (default: 7 days)
 * @returns ID of cached building
 */
export async function saveBuildingToCache(
  candidate: BuildingCandidate,
  ttlSeconds: number = CACHE_TTL.PLACES
): Promise<string> {
  try {
    // Calculate expiration time
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // Map source to database format
    let dbSource: string = candidate.source;
    if (candidate.source === 'cache') {
      // If already from cache, preserve original source from metadata
      dbSource = (candidate.metadata?.originalSource as string) || 'cache';
    }

    // Save to PostgreSQL
    const buildingData: Omit<CachedBuilding, 'id' | 'createdAt' | 'updatedAt'> = {
      externalId: candidate.externalId,
      source: dbSource,
      name: candidate.name,
      address: candidate.address,
      latitude: candidate.coordinates.latitude,
      longitude: candidate.coordinates.longitude,
      metadata: {
        ...candidate.metadata,
        distance: candidate.distance,
        bearing: candidate.bearing,
        bearingDiff: candidate.bearingDiff,
        confidence: candidate.confidence,
      },
      expiresAt,
    };

    const id = await saveBuildingToDatabase(buildingData);

    logger.debug('Saved building to cache', {
      id,
      name: candidate.name,
      source: dbSource,
    });

    return id;
  } catch (error) {
    logger.error('Error saving building to cache', {
      error: error instanceof Error ? error.message : 'Unknown error',
      candidate,
    });
    throw error;
  }
}

/**
 * Get cached identify results from Redis
 * @param coordinates - Search coordinates
 * @param heading - Optional heading
 * @param radius - Search radius
 * @returns Cached building candidates or null if not found
 */
export async function getCachedIdentifyResults(
  coordinates: Coordinates,
  heading: number | undefined,
  radius: number
): Promise<BuildingCandidate[] | null> {
  try {
    const cacheKey = getIdentifyCacheKey(
      coordinates.latitude,
      coordinates.longitude,
      heading,
      radius
    );

    const cached = await redis.get(cacheKey);

    if (!cached) {
      return null;
    }

    const candidates = JSON.parse(cached) as BuildingCandidate[];

    logger.debug('Identify cache hit', {
      coordinates,
      heading,
      radius,
      count: candidates.length,
    });

    return candidates;
  } catch (error) {
    logger.error('Error getting cached identify results', {
      error: error instanceof Error ? error.message : 'Unknown error',
      coordinates,
      heading,
      radius,
    });
    return null;
  }
}

/**
 * Cache identify results in Redis
 * @param coordinates - Search coordinates
 * @param heading - Optional heading
 * @param radius - Search radius
 * @param candidates - Building candidates to cache
 */
export async function cacheIdentifyResults(
  coordinates: Coordinates,
  heading: number | undefined,
  radius: number,
  candidates: BuildingCandidate[]
): Promise<void> {
  try {
    const cacheKey = getIdentifyCacheKey(
      coordinates.latitude,
      coordinates.longitude,
      heading,
      radius
    );

    await redis.setex(cacheKey, CACHE_TTL.IDENTIFY, JSON.stringify(candidates));

    logger.debug('Cached identify results', {
      coordinates,
      heading,
      radius,
      count: candidates.length,
      ttl: CACHE_TTL.IDENTIFY,
    });
  } catch (error) {
    logger.error('Error caching identify results', {
      error: error instanceof Error ? error.message : 'Unknown error',
      coordinates,
      heading,
      radius,
    });
    // Don't throw - caching failure shouldn't break the request
  }
}

/**
 * Clear all identify caches
 * Useful for testing or when cache invalidation is needed
 */
export async function clearIdentifyCache(): Promise<void> {
  try {
    const pattern = `${IDENTIFY_CACHE_PREFIX}*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info('Cleared identify cache', { keysDeleted: keys.length });
    }
  } catch (error) {
    logger.error('Error clearing identify cache', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
