/**
 * Places Service
 * Find nearby places using Google Places API
 * Focuses on building-related establishments and points of interest
 */

import axios from 'axios';
import { env } from '../config/env';
import { redis, CACHE_TTL } from '../config/redis';
import { logger } from '../utils/logger';
import { Coordinates, PlaceResult } from '../types/services.types';

/**
 * Cache key prefix for places searches
 */
const CACHE_PREFIX = 'places:';

/**
 * Building-related place types to search for
 */
const BUILDING_TYPES = [
  'establishment',
  'point_of_interest',
  'premise',
  'street_address',
];

/**
 * Generate cache key for places search
 * @param lat - Latitude
 * @param lon - Longitude
 * @param radius - Search radius in meters
 * @returns Cache key string
 */
function getCacheKey(lat: number, lon: number, radius: number): string {
  // Round to 5 decimal places (~1m precision) for cache key
  const roundedLat = lat.toFixed(5);
  const roundedLon = lon.toFixed(5);
  return `${CACHE_PREFIX}${roundedLat},${roundedLon}:${radius}`;
}

/**
 * Search for nearby places using Google Places API Nearby Search
 * @param coordinates - Center point for search
 * @param radius - Search radius in meters (default from env)
 * @returns Array of place results
 */
export async function findNearbyPlaces(
  coordinates: Coordinates,
  radius: number = env.SEARCH_RADIUS_METERS
): Promise<PlaceResult[]> {
  const cacheKey = getCacheKey(coordinates.latitude, coordinates.longitude, radius);

  try {
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('Places cache hit', { coordinates, radius });
      return JSON.parse(cached) as PlaceResult[];
    }

    // Make API request
    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const params = {
      location: `${coordinates.latitude},${coordinates.longitude}`,
      radius: radius.toString(),
      key: env.GOOGLE_MAPS_API_KEY,
      // Don't filter by type here - we want all nearby places
    };

    logger.debug('Searching for nearby places with Google Places API', {
      coordinates,
      radius,
    });

    const response = await axios.get(url, { params, timeout: 5000 });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      logger.warn('Google Places API returned error status', {
        status: response.data.status,
        errorMessage: response.data.error_message,
        coordinates,
        radius,
      });

      // Return empty array for ZERO_RESULTS or other non-critical errors
      if (response.data.status === 'ZERO_RESULTS') {
        return [];
      }

      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    const places = response.data.results || [];

    // Transform API results to PlaceResult format
    const placeResults: PlaceResult[] = places
      .filter((place: any) => {
        // Filter for building-related types
        const hasRelevantType = place.types?.some((type: string) =>
          BUILDING_TYPES.includes(type)
        );
        return hasRelevantType && place.geometry?.location;
      })
      .map((place: any) => {
        const result: PlaceResult = {
          placeId: place.place_id,
          name: place.name,
          address: place.vicinity || place.formatted_address || '',
          coordinates: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          vicinity: place.vicinity,
          types: place.types,
          metadata: {
            businessStatus: place.business_status,
            icon: place.icon,
            photos: place.photos,
            plusCode: place.plus_code,
            priceLevel: place.price_level,
          },
        };

        // Add rating information if available
        if (place.rating !== undefined) {
          result.rating = place.rating;
        }
        if (place.user_ratings_total !== undefined) {
          result.userRatingsTotal = place.user_ratings_total;
        }

        return result;
      });

    logger.info('Found nearby places', {
      coordinates,
      radius,
      totalResults: places.length,
      filteredResults: placeResults.length,
    });

    // Cache the results
    await redis.setex(cacheKey, CACHE_TTL.PLACES, JSON.stringify(placeResults));
    logger.debug('Cached places results', { coordinates, radius, ttl: CACHE_TTL.PLACES });

    return placeResults;
  } catch (error) {
    logger.error('Error finding nearby places', {
      error: error instanceof Error ? error.message : 'Unknown error',
      coordinates,
      radius,
    });

    // Return empty array on error - don't fail the entire request
    return [];
  }
}

/**
 * Get details for a specific place by place_id
 * @param placeId - Google Place ID
 * @returns Place details or null if not found
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  try {
    const url = 'https://maps.googleapis.com/maps/api/place/details/json';
    const params = {
      place_id: placeId,
      key: env.GOOGLE_MAPS_API_KEY,
      fields: 'name,formatted_address,geometry,rating,user_ratings_total,types,vicinity,business_status',
    };

    logger.debug('Fetching place details', { placeId });

    const response = await axios.get(url, { params, timeout: 5000 });

    if (response.data.status !== 'OK' || !response.data.result) {
      logger.warn('Google Places API returned no result', {
        status: response.data.status,
        placeId,
      });
      return null;
    }

    const place = response.data.result;

    const result: PlaceResult = {
      placeId: placeId,
      name: place.name,
      address: place.formatted_address || place.vicinity || '',
      coordinates: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      },
      vicinity: place.vicinity,
      types: place.types,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      metadata: {
        businessStatus: place.business_status,
      },
    };

    logger.info('Successfully fetched place details', { placeId, name: place.name });

    return result;
  } catch (error) {
    logger.error('Error fetching place details', {
      error: error instanceof Error ? error.message : 'Unknown error',
      placeId,
    });
    return null;
  }
}

/**
 * Clear places cache for specific coordinates
 * Useful for testing or cache invalidation
 * @param coordinates - Coordinates to clear from cache
 * @param radius - Search radius used
 */
export async function clearPlacesCache(coordinates: Coordinates, radius?: number): Promise<void> {
  const searchRadius = radius || env.SEARCH_RADIUS_METERS;
  const cacheKey = getCacheKey(coordinates.latitude, coordinates.longitude, searchRadius);
  await redis.del(cacheKey);
  logger.debug('Cleared places cache', { coordinates, radius: searchRadius });
}
