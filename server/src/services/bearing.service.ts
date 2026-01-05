/**
 * Bearing Service
 * Pure calculation service for geographic bearing and distance calculations
 * Uses the Haversine formula for accurate distance calculations on a sphere
 */

import { Coordinates, BearingCalculation } from '../types/services.types';

/**
 * Earth's radius in meters
 */
const EARTH_RADIUS_METERS = 6371000;

/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Normalize bearing to 0-360 degrees range
 * @param bearing - Bearing in degrees
 * @returns Normalized bearing (0-360)
 */
export function normalizeBearing(bearing: number): number {
  let normalized = bearing % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param from - Starting coordinates
 * @param to - Ending coordinates
 * @returns Distance in meters
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const lat1Rad = toRadians(from.latitude);
  const lat2Rad = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculate bearing (forward azimuth) from one coordinate to another
 * Bearing is the angle from north (0°) clockwise to the target point
 * @param from - Starting coordinates
 * @param to - Ending coordinates
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const lat1Rad = toRadians(from.latitude);
  const lat2Rad = toRadians(to.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);

  // Calculate bearing using spherical law of cosines
  const y = Math.sin(deltaLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLon);

  const bearingRad = Math.atan2(y, x);
  const bearingDeg = toDegrees(bearingRad);

  return normalizeBearing(bearingDeg);
}

/**
 * Calculate the absolute angular difference between two bearings
 * Returns the smallest angle between the two bearings
 * @param bearing1 - First bearing in degrees
 * @param bearing2 - Second bearing in degrees
 * @returns Angular difference in degrees (0-180)
 */
export function calculateBearingDifference(bearing1: number, bearing2: number): number {
  const normalized1 = normalizeBearing(bearing1);
  const normalized2 = normalizeBearing(bearing2);

  let diff = Math.abs(normalized1 - normalized2);

  // Take the smaller angle
  if (diff > 180) {
    diff = 360 - diff;
  }

  return diff;
}

/**
 * Calculate bearing and distance from one point to another
 * @param from - Starting coordinates
 * @param to - Ending coordinates
 * @param userHeading - Optional user heading to calculate bearing difference
 * @returns BearingCalculation object with distance, bearing, and optional bearing difference
 */
export function calculateBearingAndDistance(
  from: Coordinates,
  to: Coordinates,
  userHeading?: number
): BearingCalculation {
  const distance = calculateDistance(from, to);
  const bearing = calculateBearing(from, to);

  const result: BearingCalculation = {
    distance,
    bearing,
  };

  if (userHeading !== undefined) {
    result.bearingDiff = calculateBearingDifference(bearing, userHeading);
  }

  return result;
}
