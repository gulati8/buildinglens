/**
 * Scoring Service
 * Calculates confidence scores for building candidates based on multiple factors
 * Implements a weighted scoring algorithm considering distance, bearing alignment, and source reliability
 */

import { ScoringFactors } from '../types/services.types';

/**
 * Source reliability weights
 * Higher weight = more reliable source
 */
const SOURCE_WEIGHTS = {
  google_places: 1.0, // Most reliable - dedicated places database
  google_geocoding: 0.8, // Good reliability - geocoding service
  nominatim: 0.6, // Moderate reliability - open source
  cache: 0.7, // Cached data - reliability depends on original source
} as const;

/**
 * Scoring algorithm weights
 * These weights determine how much each factor contributes to the final score
 */
const SCORING_WEIGHTS = {
  distance: 0.4, // 40% - proximity is very important
  bearing: 0.3, // 30% - direction alignment matters
  source: 0.2, // 20% - source reliability
  metadata: 0.1, // 10% - additional metadata (name, rating, etc.)
} as const;

/**
 * Distance decay parameters
 * Determines how quickly confidence drops with distance
 */
const DISTANCE_PARAMS = {
  optimalDistance: 10, // Within 10m = maximum distance score
  decayRate: 0.05, // Exponential decay rate
} as const;

/**
 * Bearing alignment parameters
 * Determines how bearing difference affects the score
 */
const BEARING_PARAMS = {
  perfectAlignment: 15, // Within 15° = perfect alignment
  maxPenalty: 90, // Beyond 90° = maximum penalty
} as const;

/**
 * Calculate distance score using exponential decay
 * Closer distances get higher scores
 * @param distance - Distance in meters
 * @returns Score between 0 and 1
 */
function calculateDistanceScore(distance: number): number {
  if (distance <= DISTANCE_PARAMS.optimalDistance) {
    return 1.0;
  }

  // Exponential decay: score = e^(-k * (d - d_optimal))
  const excessDistance = distance - DISTANCE_PARAMS.optimalDistance;
  const score = Math.exp(-DISTANCE_PARAMS.decayRate * excessDistance);

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate bearing alignment score
 * Lower bearing difference = higher score
 * @param bearingDiff - Bearing difference in degrees (0-180)
 * @returns Score between 0 and 1
 */
function calculateBearingScore(bearingDiff?: number): number {
  if (bearingDiff === undefined) {
    // If no heading provided, return neutral score
    return 0.5;
  }

  if (bearingDiff <= BEARING_PARAMS.perfectAlignment) {
    return 1.0;
  }

  if (bearingDiff >= BEARING_PARAMS.maxPenalty) {
    return 0.0;
  }

  // Linear decay between perfect alignment and max penalty
  const score =
    1 - (bearingDiff - BEARING_PARAMS.perfectAlignment) /
    (BEARING_PARAMS.maxPenalty - BEARING_PARAMS.perfectAlignment);

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate source reliability score
 * @param source - Data source type
 * @returns Score between 0 and 1
 */
function calculateSourceScore(source: ScoringFactors['source']): number {
  return SOURCE_WEIGHTS[source];
}

/**
 * Calculate metadata quality score
 * Considers presence of building name, ratings, etc.
 * @param hasName - Whether building has a name
 * @param hasRating - Whether place has ratings
 * @returns Score between 0 and 1
 */
function calculateMetadataScore(hasName: boolean, hasRating?: boolean): number {
  let score = 0;

  // Having a name is a strong positive signal
  if (hasName) {
    score += 0.6;
  }

  // Having ratings indicates a real, verified place
  if (hasRating) {
    score += 0.4;
  }

  return Math.min(1, score);
}

/**
 * Calculate overall confidence score for a building candidate
 * Combines multiple factors with weighted average
 * @param factors - Scoring factors for the candidate
 * @returns Confidence score as percentage (0-100)
 */
export function calculateConfidenceScore(factors: ScoringFactors): number {
  // Calculate individual component scores
  const distanceScore = calculateDistanceScore(factors.distance);
  const bearingScore = calculateBearingScore(factors.bearingDiff);
  const sourceScore = calculateSourceScore(factors.source);
  const metadataScore = calculateMetadataScore(factors.hasName, factors.hasRating);

  // Weighted combination
  const rawScore =
    distanceScore * SCORING_WEIGHTS.distance +
    bearingScore * SCORING_WEIGHTS.bearing +
    sourceScore * SCORING_WEIGHTS.source +
    metadataScore * SCORING_WEIGHTS.metadata;

  // Convert to percentage and round to 2 decimal places
  const percentage = rawScore * 100;
  return Math.round(percentage * 100) / 100;
}

/**
 * Compare two candidates for sorting by confidence
 * Used for sorting candidates in descending order of confidence
 * @param a - First candidate score
 * @param b - Second candidate score
 * @returns Comparison result for sorting
 */
export function compareByConfidence(a: { confidence: number }, b: { confidence: number }): number {
  return b.confidence - a.confidence;
}

/**
 * Get scoring weights for transparency/debugging
 * @returns Current scoring weights configuration
 */
export function getScoringWeights() {
  return {
    weights: SCORING_WEIGHTS,
    sourceWeights: SOURCE_WEIGHTS,
    distanceParams: DISTANCE_PARAMS,
    bearingParams: BEARING_PARAMS,
  };
}
