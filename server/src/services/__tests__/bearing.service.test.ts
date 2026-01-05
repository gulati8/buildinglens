/**
 * Unit tests for bearing service
 * Tests pure calculation functions for distance, bearing, and bearing differences
 */

import {
  calculateDistance,
  calculateBearing,
  calculateBearingDifference,
  normalizeBearing,
  calculateBearingAndDistance,
} from '../bearing.service';
import { Coordinates } from '../../types/services.types';

describe('Bearing Service', () => {
  describe('normalizeBearing', () => {
    it('should normalize positive bearings within range', () => {
      expect(normalizeBearing(45)).toBe(45);
      expect(normalizeBearing(180)).toBe(180);
      expect(normalizeBearing(359)).toBe(359);
    });

    it('should normalize bearings over 360', () => {
      expect(normalizeBearing(360)).toBe(0);
      expect(normalizeBearing(450)).toBe(90);
      expect(normalizeBearing(720)).toBe(0);
    });

    it('should normalize negative bearings', () => {
      expect(normalizeBearing(-45)).toBe(315);
      expect(normalizeBearing(-90)).toBe(270);
      expect(Math.abs(normalizeBearing(-360))).toBe(0); // Handle -0 vs 0
    });

    it('should handle zero', () => {
      expect(normalizeBearing(0)).toBe(0);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between same point as 0', () => {
      const point: Coordinates = { latitude: 37.7749, longitude: -122.4194 };
      const distance = calculateDistance(point, point);
      expect(distance).toBeCloseTo(0, 1);
    });

    it('should calculate distance between two nearby points', () => {
      // San Francisco City Hall to Golden Gate Bridge (approx 6.5 km)
      const cityHall: Coordinates = { latitude: 37.7794, longitude: -122.4194 };
      const bridge: Coordinates = { latitude: 37.8199, longitude: -122.4783 };

      const distance = calculateDistance(cityHall, bridge);

      // Should be approximately 6500 meters
      expect(distance).toBeGreaterThan(6000);
      expect(distance).toBeLessThan(7000);
    });

    it('should calculate distance between points across equator', () => {
      const north: Coordinates = { latitude: 10, longitude: 0 };
      const south: Coordinates = { latitude: -10, longitude: 0 };

      const distance = calculateDistance(north, south);

      // 20 degrees latitude ≈ 2,223 km
      expect(distance).toBeGreaterThan(2200000);
      expect(distance).toBeLessThan(2300000);
    });

    it('should be symmetric (distance A to B = distance B to A)', () => {
      const pointA: Coordinates = { latitude: 40.7128, longitude: -74.006 };
      const pointB: Coordinates = { latitude: 34.0522, longitude: -118.2437 };

      const distanceAB = calculateDistance(pointA, pointB);
      const distanceBA = calculateDistance(pointB, pointA);

      expect(distanceAB).toBeCloseTo(distanceBA, 1);
    });
  });

  describe('calculateBearing', () => {
    it('should calculate bearing due north as 0', () => {
      const from: Coordinates = { latitude: 0, longitude: 0 };
      const to: Coordinates = { latitude: 1, longitude: 0 };

      const bearing = calculateBearing(from, to);
      expect(bearing).toBeCloseTo(0, 0);
    });

    it('should calculate bearing due east as 90', () => {
      const from: Coordinates = { latitude: 0, longitude: 0 };
      const to: Coordinates = { latitude: 0, longitude: 1 };

      const bearing = calculateBearing(from, to);
      expect(bearing).toBeCloseTo(90, 0);
    });

    it('should calculate bearing due south as 180', () => {
      const from: Coordinates = { latitude: 0, longitude: 0 };
      const to: Coordinates = { latitude: -1, longitude: 0 };

      const bearing = calculateBearing(from, to);
      expect(bearing).toBeCloseTo(180, 0);
    });

    it('should calculate bearing due west as 270', () => {
      const from: Coordinates = { latitude: 0, longitude: 0 };
      const to: Coordinates = { latitude: 0, longitude: -1 };

      const bearing = calculateBearing(from, to);
      expect(bearing).toBeCloseTo(270, 0);
    });

    it('should calculate bearing for northeast direction', () => {
      const from: Coordinates = { latitude: 37.7749, longitude: -122.4194 };
      const to: Coordinates = { latitude: 37.8049, longitude: -122.3894 };

      const bearing = calculateBearing(from, to);

      // Should be somewhere between 0 (north) and 90 (east)
      expect(bearing).toBeGreaterThan(0);
      expect(bearing).toBeLessThan(90);
    });

    it('should normalize bearing to 0-360 range', () => {
      const from: Coordinates = { latitude: 40.7128, longitude: -74.006 };
      const to: Coordinates = { latitude: 34.0522, longitude: -118.2437 };

      const bearing = calculateBearing(from, to);

      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    });
  });

  describe('calculateBearingDifference', () => {
    it('should calculate difference for same bearings as 0', () => {
      expect(calculateBearingDifference(45, 45)).toBe(0);
      expect(calculateBearingDifference(180, 180)).toBe(0);
      expect(calculateBearingDifference(270, 270)).toBe(0);
    });

    it('should calculate small differences correctly', () => {
      expect(calculateBearingDifference(45, 50)).toBe(5);
      expect(calculateBearingDifference(50, 45)).toBe(5);
      expect(calculateBearingDifference(0, 10)).toBe(10);
    });

    it('should take shorter angle across 0/360 boundary', () => {
      // 350° to 10° is 20° difference, not 340°
      expect(calculateBearingDifference(350, 10)).toBe(20);
      expect(calculateBearingDifference(10, 350)).toBe(20);

      // 1° to 359° is 2° difference, not 358°
      expect(calculateBearingDifference(1, 359)).toBe(2);
      expect(calculateBearingDifference(359, 1)).toBe(2);
    });

    it('should handle opposite directions (180° difference)', () => {
      expect(calculateBearingDifference(0, 180)).toBe(180);
      expect(calculateBearingDifference(90, 270)).toBe(180);
      expect(calculateBearingDifference(45, 225)).toBe(180);
    });

    it('should never return more than 180', () => {
      const testCases: [number, number][] = [
        [0, 270], // Should be 90, not 270
        [90, 0], // Should be 90, not 270
        [180, 0], // Should be 180
        [270, 0], // Should be 90, not 270
      ];

      testCases.forEach(([b1, b2]) => {
        const diff = calculateBearingDifference(b1, b2);
        expect(diff).toBeLessThanOrEqual(180);
      });
    });

    it('should be symmetric', () => {
      const bearing1 = 45;
      const bearing2 = 135;

      const diff1 = calculateBearingDifference(bearing1, bearing2);
      const diff2 = calculateBearingDifference(bearing2, bearing1);

      expect(diff1).toBe(diff2);
    });
  });

  describe('calculateBearingAndDistance', () => {
    it('should calculate both bearing and distance', () => {
      const from: Coordinates = { latitude: 37.7749, longitude: -122.4194 };
      const to: Coordinates = { latitude: 37.8049, longitude: -122.3894 };

      const result = calculateBearingAndDistance(from, to);

      expect(result.distance).toBeGreaterThan(0);
      expect(result.bearing).toBeGreaterThanOrEqual(0);
      expect(result.bearing).toBeLessThan(360);
      expect(result.bearingDiff).toBeUndefined();
    });

    it('should calculate bearing difference when heading provided', () => {
      const from: Coordinates = { latitude: 37.7749, longitude: -122.4194 };
      const to: Coordinates = { latitude: 37.8049, longitude: -122.3894 };
      const userHeading = 45; // User facing northeast

      const result = calculateBearingAndDistance(from, to, userHeading);

      expect(result.distance).toBeGreaterThan(0);
      expect(result.bearing).toBeGreaterThanOrEqual(0);
      expect(result.bearing).toBeLessThan(360);
      expect(result.bearingDiff).toBeDefined();
      expect(result.bearingDiff).toBeGreaterThanOrEqual(0);
      expect(result.bearingDiff).toBeLessThanOrEqual(180);
    });

    it('should return zero distance for same point', () => {
      const point: Coordinates = { latitude: 37.7749, longitude: -122.4194 };

      const result = calculateBearingAndDistance(point, point);

      expect(result.distance).toBeCloseTo(0, 1);
    });
  });
});
