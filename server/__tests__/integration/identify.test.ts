/**
 * Integration tests for /api/identify endpoint
 * Tests the complete request/response flow with mocked external services
 */

import request from 'supertest';
import { app } from '../../src/app';
import * as placesService from '../../src/services/places.service';
import * as geocodingService from '../../src/services/geocoding.service';
import * as cacheService from '../../src/services/cache.service';
import { redis } from '../../src/config/redis';
import { BuildingCandidate, PlaceResult } from '../../src/types/services.types';

// Mock external services
jest.mock('../../src/services/places.service');
jest.mock('../../src/services/geocoding.service');
jest.mock('../../src/services/cache.service');

describe('POST /api/identify', () => {
  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Clear rate limiter keys from Redis
    try {
      const keys = await redis.keys('rl:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      // Ignore Redis errors in tests
      console.warn('Failed to clear Redis rate limit keys:', error);
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    // Close Redis connection after all tests
    try {
      await redis.quit();
    } catch (error) {
      // Ignore errors on cleanup
    }
  });

  describe('Successful identification', () => {
    it('should return building candidates with valid coordinates and heading', async () => {
      // Mock cache to return no cached results
      jest.spyOn(cacheService, 'getCachedIdentifyResults').mockResolvedValue(null);
      jest.spyOn(cacheService, 'getCachedBuildings').mockResolvedValue([]);
      jest.spyOn(cacheService, 'saveBuildingToCache').mockResolvedValue('mock-id');
      jest.spyOn(cacheService, 'cacheIdentifyResults').mockResolvedValue(undefined);

      // Mock places service to return nearby places
      const mockPlaces: PlaceResult[] = [
        {
          placeId: 'ChIJ_test_1',
          name: 'Empire State Building',
          address: '350 5th Ave, New York, NY 10118',
          coordinates: {
            latitude: 40.748817,
            longitude: -73.985428,
          },
          rating: 4.7,
          userRatingsTotal: 125000,
          types: ['tourist_attraction', 'point_of_interest'],
        },
        {
          placeId: 'ChIJ_test_2',
          name: 'One Penn Plaza',
          address: '250 W 34th St, New York, NY 10119',
          coordinates: {
            latitude: 40.750580,
            longitude: -73.993584,
          },
          types: ['building', 'point_of_interest'],
        },
      ];

      jest.spyOn(placesService, 'findNearbyPlaces').mockResolvedValue(mockPlaces);

      // Make request
      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 40.7489,
          longitude: -73.9680,
          heading: 270,
          searchRadius: 500,
        })
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('candidates');
      expect(response.body).toHaveProperty('query');
      expect(response.body).toHaveProperty('metadata');

      // Verify query echoed back
      expect(response.body.query).toEqual({
        latitude: 40.7489,
        longitude: -73.9680,
        heading: 270,
        searchRadius: 500,
      });

      // Verify metadata
      expect(response.body.metadata).toHaveProperty('timestamp');
      expect(response.body.metadata).toHaveProperty('resultCount');
      expect(response.body.metadata).toHaveProperty('searchCenter');

      // Verify candidates
      expect(Array.isArray(response.body.candidates)).toBe(true);
      expect(response.body.candidates.length).toBeGreaterThan(0);

      // Verify candidate structure
      const candidate = response.body.candidates[0];
      expect(candidate).toHaveProperty('name');
      expect(candidate).toHaveProperty('address');
      expect(candidate).toHaveProperty('coordinates');
      expect(candidate).toHaveProperty('distance');
      expect(candidate).toHaveProperty('bearing');
      expect(candidate).toHaveProperty('confidence');
      expect(candidate).toHaveProperty('source');

      // Verify candidates are sorted by confidence
      if (response.body.candidates.length > 1) {
        const confidences = response.body.candidates.map((c: BuildingCandidate) => c.confidence);
        const sortedConfidences = [...confidences].sort((a, b) => b - a);
        expect(confidences).toEqual(sortedConfidences);
      }

      // Verify external services were called
      expect(placesService.findNearbyPlaces).toHaveBeenCalledWith(
        { latitude: 40.7489, longitude: -73.9680 },
        500
      );
    });

    it('should use default search radius when not provided', async () => {
      // Mock services
      jest.spyOn(cacheService, 'getCachedIdentifyResults').mockResolvedValue(null);
      jest.spyOn(cacheService, 'getCachedBuildings').mockResolvedValue([]);
      jest.spyOn(cacheService, 'saveBuildingToCache').mockResolvedValue('mock-id');
      jest.spyOn(cacheService, 'cacheIdentifyResults').mockResolvedValue(undefined);
      jest.spyOn(placesService, 'findNearbyPlaces').mockResolvedValue([]);

      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 40.7489,
          longitude: -73.9680,
          heading: 270,
        })
        .expect(200);

      // Verify default radius was used (100 meters)
      expect(response.body.query.searchRadius).toBe(100);
    });

    it('should work without heading parameter', async () => {
      // Mock services
      jest.spyOn(cacheService, 'getCachedIdentifyResults').mockResolvedValue(null);
      jest.spyOn(cacheService, 'getCachedBuildings').mockResolvedValue([]);
      jest.spyOn(cacheService, 'saveBuildingToCache').mockResolvedValue('mock-id');
      jest.spyOn(cacheService, 'cacheIdentifyResults').mockResolvedValue(undefined);
      jest.spyOn(placesService, 'findNearbyPlaces').mockResolvedValue([]);

      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 40.7489,
          longitude: -73.9680,
        })
        .expect(200);

      expect(response.body.query.heading).toBeUndefined();
    });

    it('should return cached results when available', async () => {
      // Mock cached results
      const mockCachedCandidates: BuildingCandidate[] = [
        {
          externalId: 'ChIJ_cached',
          name: 'Cached Building',
          address: '123 Cache St',
          coordinates: { latitude: 40.7489, longitude: -73.9680 },
          distance: 50,
          bearing: 90,
          bearingDiff: 20,
          confidence: 85,
          source: 'cache',
        },
      ];

      jest.spyOn(cacheService, 'getCachedIdentifyResults').mockResolvedValue(mockCachedCandidates);

      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 40.7489,
          longitude: -73.9680,
          heading: 270,
        })
        .expect(200);

      expect(response.body.candidates).toEqual(mockCachedCandidates);

      // Verify places service was NOT called when cache hit
      expect(placesService.findNearbyPlaces).not.toHaveBeenCalled();
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for missing latitude', async () => {
      const response = await request(app)
        .post('/api/identify')
        .send({
          longitude: -73.9680,
          heading: 270,
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error).toHaveProperty('message', 'Validation failed');
      expect(response.body.error.details).toBeDefined();
    });

    it('should return 400 for missing longitude', async () => {
      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 40.7489,
          heading: 270,
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for invalid latitude (too high)', async () => {
      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 91,
          longitude: -73.9680,
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for invalid latitude (too low)', async () => {
      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: -91,
          longitude: -73.9680,
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for invalid longitude (too high)', async () => {
      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 40.7489,
          longitude: 181,
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for invalid longitude (too low)', async () => {
      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 40.7489,
          longitude: -181,
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for invalid heading (negative)', async () => {
      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 40.7489,
          longitude: -73.9680,
          heading: -1,
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for invalid heading (too high)', async () => {
      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 40.7489,
          longitude: -73.9680,
          heading: 361,
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for invalid search radius (negative)', async () => {
      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 40.7489,
          longitude: -73.9680,
          searchRadius: -100,
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for invalid search radius (zero)', async () => {
      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 40.7489,
          longitude: -73.9680,
          searchRadius: 0,
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for invalid data types', async () => {
      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 'not a number',
          longitude: -73.9680,
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for empty request body', async () => {
      const response = await request(app)
        .post('/api/identify')
        .send({})
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('Error handling', () => {
    it('should return 500 when places service fails', async () => {
      // Mock cache to return no results
      jest.spyOn(cacheService, 'getCachedIdentifyResults').mockResolvedValue(null);
      jest.spyOn(cacheService, 'getCachedBuildings').mockResolvedValue([]);

      // Mock places service to throw error
      jest.spyOn(placesService, 'findNearbyPlaces').mockRejectedValue(
        new Error('Google Places API error')
      );

      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 40.7489,
          longitude: -73.9680,
          heading: 270,
        })
        .expect(500);

      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('code');
    });

    it('should handle geocoding service failure gracefully', async () => {
      // Mock cache to return no results
      jest.spyOn(cacheService, 'getCachedIdentifyResults').mockResolvedValue(null);
      jest.spyOn(cacheService, 'getCachedBuildings').mockResolvedValue([]);

      // Mock places service to return few results (triggers geocoding fallback)
      jest.spyOn(placesService, 'findNearbyPlaces').mockResolvedValue([]);

      // Mock geocoding to fail
      jest.spyOn(geocodingService, 'reverseGeocode').mockRejectedValue(
        new Error('Geocoding failed')
      );

      // Should still handle gracefully and return what it has
      const response = await request(app)
        .post('/api/identify')
        .send({
          latitude: 40.7489,
          longitude: -73.9680,
        })
        .expect(500);

      // Error should be caught and handled
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Rate limiting', () => {
    it('should have rate limiting middleware enabled', async () => {
      // Mock all services for successful requests
      jest.spyOn(cacheService, 'getCachedIdentifyResults').mockResolvedValue(null);
      jest.spyOn(cacheService, 'getCachedBuildings').mockResolvedValue([]);
      jest.spyOn(cacheService, 'saveBuildingToCache').mockResolvedValue('mock-id');
      jest.spyOn(cacheService, 'cacheIdentifyResults').mockResolvedValue(undefined);

      // Mock places to return some results (to avoid geocoding fallback)
      const mockPlaces: PlaceResult[] = [
        {
          placeId: 'test1',
          name: 'Test Building 1',
          address: '123 Test St',
          coordinates: { latitude: 40.7490, longitude: -73.9681 },
          types: ['building'],
        },
        {
          placeId: 'test2',
          name: 'Test Building 2',
          address: '456 Test Ave',
          coordinates: { latitude: 40.7491, longitude: -73.9682 },
          types: ['building'],
        },
        {
          placeId: 'test3',
          name: 'Test Building 3',
          address: '789 Test Blvd',
          coordinates: { latitude: 40.7492, longitude: -73.9683 },
          types: ['building'],
        },
      ];
      jest.spyOn(placesService, 'findNearbyPlaces').mockResolvedValue(mockPlaces);

      const requestBody = {
        latitude: 40.7489,
        longitude: -73.9680,
      };

      // Make a single request to verify rate limiting headers are present
      const response = await request(app)
        .post('/api/identify')
        .send(requestBody)
        .expect(200);

      // Verify rate limit headers are present (added by rate limiter middleware)
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });
  });
});
