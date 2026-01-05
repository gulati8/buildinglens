/**
 * Geocoding Service
 * Reverse geocoding to convert coordinates to building information
 * Uses Google Geocoding API (primary) with Nominatim fallback
 */

import axios from 'axios';
import { env } from '../config/env';
import { redis, CACHE_TTL } from '../config/redis';
import { logger } from '../utils/logger';
import { Coordinates, GeocodingResult } from '../types/services.types';

/**
 * Cache key prefix for geocoding results
 */
const CACHE_PREFIX = 'geocode:';

/**
 * Generate cache key for geocoding request
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Cache key string
 */
function getCacheKey(lat: number, lon: number): string {
  // Round to 6 decimal places (~0.1m precision) for cache key
  const roundedLat = lat.toFixed(6);
  const roundedLon = lon.toFixed(6);
  return `${CACHE_PREFIX}${roundedLat},${roundedLon}`;
}

/**
 * Reverse geocode using Google Geocoding API
 * @param coordinates - Coordinates to geocode
 * @returns Geocoding result or null if failed
 */
async function geocodeWithGoogle(coordinates: Coordinates): Promise<GeocodingResult | null> {
  try {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = {
      latlng: `${coordinates.latitude},${coordinates.longitude}`,
      key: env.GOOGLE_MAPS_API_KEY,
      result_type: 'premise|street_address|route', // Focus on building-level results
    };

    logger.debug('Geocoding with Google API', { coordinates });

    const response = await axios.get(url, { params, timeout: 5000 });

    if (response.data.status !== 'OK' || !response.data.results || response.data.results.length === 0) {
      logger.warn('Google Geocoding API returned no results', {
        status: response.data.status,
        coordinates,
      });
      return null;
    }

    const result = response.data.results[0];

    // Extract building name from address components
    let name: string | undefined;
    const addressComponents = result.address_components || [];

    // Try to find premise or point_of_interest name
    for (const component of addressComponents) {
      if (component.types?.includes('premise') || component.types?.includes('point_of_interest')) {
        name = component.long_name;
        break;
      }
    }

    const geocodingResult: GeocodingResult = {
      name,
      address: result.formatted_address,
      coordinates: {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      },
      placeId: result.place_id,
      source: 'google_geocoding',
      metadata: {
        addressComponents: result.address_components,
        locationType: result.geometry.location_type,
        types: result.types,
      },
    };

    logger.info('Successfully geocoded with Google', { coordinates, hasName: !!name });

    return geocodingResult;
  } catch (error) {
    logger.error('Google Geocoding API error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      coordinates,
    });
    return null;
  }
}

/**
 * Reverse geocode using Nominatim (OpenStreetMap)
 * @param coordinates - Coordinates to geocode
 * @returns Geocoding result or null if failed
 */
async function geocodeWithNominatim(coordinates: Coordinates): Promise<GeocodingResult | null> {
  try {
    const url = `${env.NOMINATIM_BASE_URL}/reverse`;
    const params = {
      lat: coordinates.latitude,
      lon: coordinates.longitude,
      format: 'json',
      addressdetails: '1',
      zoom: 18, // Building-level zoom
    };

    const headers: Record<string, string> = {
      'User-Agent': 'BuildingLens/1.0',
    };

    if (env.NOMINATIM_EMAIL) {
      headers['Referer'] = env.NOMINATIM_EMAIL;
    }

    logger.debug('Geocoding with Nominatim', { coordinates });

    const response = await axios.get(url, { params, headers, timeout: 5000 });

    if (!response.data || response.data.error) {
      logger.warn('Nominatim API returned error', {
        error: response.data?.error,
        coordinates,
      });
      return null;
    }

    const data = response.data;

    // Extract building name from address or display_name
    const address = data.address || {};
    const name =
      address.building ||
      address.house ||
      address.amenity ||
      address.shop ||
      address.office ||
      undefined;

    const geocodingResult: GeocodingResult = {
      name,
      address: data.display_name,
      coordinates: {
        latitude: parseFloat(data.lat),
        longitude: parseFloat(data.lon),
      },
      placeId: data.place_id?.toString(),
      source: 'nominatim',
      metadata: {
        osmType: data.osm_type,
        osmId: data.osm_id,
        category: data.category,
        type: data.type,
        address: data.address,
      },
    };

    logger.info('Successfully geocoded with Nominatim', { coordinates, hasName: !!name });

    return geocodingResult;
  } catch (error) {
    logger.error('Nominatim API error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      coordinates,
    });
    return null;
  }
}

/**
 * Reverse geocode coordinates to building information
 * Tries Google first, falls back to Nominatim if Google fails
 * Results are cached in Redis
 * @param coordinates - Coordinates to geocode
 * @returns Geocoding result or null if all methods fail
 */
export async function reverseGeocode(coordinates: Coordinates): Promise<GeocodingResult | null> {
  const cacheKey = getCacheKey(coordinates.latitude, coordinates.longitude);

  try {
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('Geocoding cache hit', { coordinates });
      return JSON.parse(cached) as GeocodingResult;
    }

    // Try Google first
    let result = await geocodeWithGoogle(coordinates);

    // Fallback to Nominatim if Google fails
    if (!result) {
      logger.info('Google geocoding failed, trying Nominatim fallback', { coordinates });
      result = await geocodeWithNominatim(coordinates);
    }

    // Cache the result if we got one
    if (result) {
      await redis.setex(cacheKey, CACHE_TTL.GEOCODING, JSON.stringify(result));
      logger.debug('Cached geocoding result', { coordinates, ttl: CACHE_TTL.GEOCODING });
    }

    return result;
  } catch (error) {
    logger.error('Geocoding error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      coordinates,
    });
    return null;
  }
}

/**
 * Clear geocoding cache for specific coordinates
 * Useful for testing or cache invalidation
 * @param coordinates - Coordinates to clear from cache
 */
export async function clearGeocodeCache(coordinates: Coordinates): Promise<void> {
  const cacheKey = getCacheKey(coordinates.latitude, coordinates.longitude);
  await redis.del(cacheKey);
  logger.debug('Cleared geocoding cache', { coordinates });
}
