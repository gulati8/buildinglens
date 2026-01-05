/**
 * Service type definitions for BuildingLens backend
 * Defines interfaces for all service layer operations
 */

/**
 * Geographic coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Result from geocoding service
 */
export interface GeocodingResult {
  name?: string;
  address: string;
  coordinates: Coordinates;
  placeId?: string;
  source: 'google_geocoding' | 'nominatim';
  metadata?: Record<string, unknown>;
}

/**
 * Result from places API
 */
export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  vicinity?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Bearing and distance calculation result
 */
export interface BearingCalculation {
  distance: number; // Distance in meters
  bearing: number; // Bearing in degrees (0-360)
  bearingDiff?: number; // Difference from target bearing (optional)
}

/**
 * Factors used in scoring algorithm
 */
export interface ScoringFactors {
  distance: number; // Distance in meters
  bearingDiff?: number; // Bearing difference in degrees
  source: 'google_places' | 'google_geocoding' | 'nominatim' | 'cache';
  hasName: boolean; // Whether building has a name
  hasRating?: boolean; // Whether place has ratings
}

/**
 * Building candidate with confidence score
 */
export interface BuildingCandidate {
  id?: string; // UUID from database (if cached)
  externalId?: string; // ID from external API
  name?: string;
  address: string;
  coordinates: Coordinates;
  distance: number; // Distance from user in meters
  bearing: number; // Bearing from user position
  bearingDiff?: number; // Difference from user heading
  confidence: number; // Confidence score (0-100)
  source: 'google_places' | 'google_geocoding' | 'nominatim' | 'cache';
  metadata?: Record<string, unknown>;
}

/**
 * Cached building from database
 */
export interface CachedBuilding {
  id: string;
  externalId?: string;
  source: string;
  name?: string;
  address: string;
  latitude: number;
  longitude: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

/**
 * Input parameters for building identification
 */
export interface IdentifyBuildingInput {
  latitude: number;
  longitude: number;
  heading?: number; // User's heading/compass direction (0-360)
  searchRadius?: number; // Search radius in meters (default from env)
}

/**
 * Result from building identification
 */
export interface IdentifyBuildingResult {
  candidates: BuildingCandidate[];
  searchRadius: number;
  searchCenter: Coordinates;
  heading?: number;
  timestamp: Date;
}
