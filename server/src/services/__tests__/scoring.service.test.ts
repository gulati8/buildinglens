/**
 * Unit tests for scoring service
 * Tests confidence scoring algorithm for building candidates
 */

import {
  calculateConfidenceScore,
  compareByConfidence,
  getScoringWeights,
} from '../scoring.service';
import { ScoringFactors } from '../../types/services.types';

describe('Scoring Service', () => {
  describe('calculateConfidenceScore', () => {
    it('should give high score for ideal candidate', () => {
      const factors: ScoringFactors = {
        distance: 5, // Very close
        bearingDiff: 5, // Almost perfect alignment
        source: 'google_places',
        hasName: true,
        hasRating: true,
      };

      const score = calculateConfidenceScore(factors);

      expect(score).toBeGreaterThan(85);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give lower score for distant candidate', () => {
      const factors: ScoringFactors = {
        distance: 200, // Far away
        bearingDiff: 5,
        source: 'google_places',
        hasName: true,
        hasRating: true,
      };

      const score = calculateConfidenceScore(factors);

      // Distance heavily impacts score
      expect(score).toBeLessThan(70);
    });

    it('should penalize poor bearing alignment', () => {
      const goodAlignment: ScoringFactors = {
        distance: 10,
        bearingDiff: 10, // Good alignment
        source: 'google_places',
        hasName: true,
        hasRating: true,
      };

      const poorAlignment: ScoringFactors = {
        distance: 10,
        bearingDiff: 120, // Poor alignment
        source: 'google_places',
        hasName: true,
        hasRating: true,
      };

      const goodScore = calculateConfidenceScore(goodAlignment);
      const poorScore = calculateConfidenceScore(poorAlignment);

      expect(goodScore).toBeGreaterThan(poorScore + 15);
    });

    it('should handle undefined bearingDiff (no heading)', () => {
      const factors: ScoringFactors = {
        distance: 10,
        bearingDiff: undefined,
        source: 'google_places',
        hasName: true,
        hasRating: true,
      };

      const score = calculateConfidenceScore(factors);

      // Should still calculate a reasonable score
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should rank sources by reliability', () => {
      const baseFactors = {
        distance: 10,
        bearingDiff: 10,
        hasName: true,
        hasRating: false,
      };

      const googlePlaces = calculateConfidenceScore({
        ...baseFactors,
        source: 'google_places',
      });

      const googleGeocoding = calculateConfidenceScore({
        ...baseFactors,
        source: 'google_geocoding',
      });

      const nominatim = calculateConfidenceScore({
        ...baseFactors,
        source: 'nominatim',
      });

      const cache = calculateConfidenceScore({
        ...baseFactors,
        source: 'cache',
      });

      expect(googlePlaces).toBeGreaterThan(googleGeocoding);
      expect(googleGeocoding).toBeGreaterThan(nominatim);
      expect(cache).toBeGreaterThan(nominatim);
    });

    it('should give bonus for having name', () => {
      const withName: ScoringFactors = {
        distance: 10,
        bearingDiff: 10,
        source: 'google_places',
        hasName: true,
        hasRating: false,
      };

      const withoutName: ScoringFactors = {
        distance: 10,
        bearingDiff: 10,
        source: 'google_places',
        hasName: false,
        hasRating: false,
      };

      const scoreWithName = calculateConfidenceScore(withName);
      const scoreWithoutName = calculateConfidenceScore(withoutName);

      expect(scoreWithName).toBeGreaterThan(scoreWithoutName);
    });

    it('should give bonus for having rating', () => {
      const withRating: ScoringFactors = {
        distance: 10,
        bearingDiff: 10,
        source: 'google_places',
        hasName: true,
        hasRating: true,
      };

      const withoutRating: ScoringFactors = {
        distance: 10,
        bearingDiff: 10,
        source: 'google_places',
        hasName: true,
        hasRating: false,
      };

      const scoreWithRating = calculateConfidenceScore(withRating);
      const scoreWithoutRating = calculateConfidenceScore(withoutRating);

      expect(scoreWithRating).toBeGreaterThan(scoreWithoutRating);
    });

    it('should return score between 0 and 100', () => {
      const testCases: ScoringFactors[] = [
        {
          distance: 1,
          bearingDiff: 0,
          source: 'google_places',
          hasName: true,
          hasRating: true,
        },
        {
          distance: 1000,
          bearingDiff: 180,
          source: 'nominatim',
          hasName: false,
          hasRating: false,
        },
        {
          distance: 50,
          bearingDiff: 45,
          source: 'cache',
          hasName: true,
          hasRating: false,
        },
      ];

      testCases.forEach((factors) => {
        const score = calculateConfidenceScore(factors);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('should heavily weight distance in scoring', () => {
      const veryClose: ScoringFactors = {
        distance: 5,
        bearingDiff: 10,
        source: 'google_places',
        hasName: true,
        hasRating: false,
      };

      const veryFar: ScoringFactors = {
        distance: 500,
        bearingDiff: 10,
        source: 'google_places',
        hasName: true,
        hasRating: false,
      };

      const closeScore = calculateConfidenceScore(veryClose);
      const farScore = calculateConfidenceScore(veryFar);

      // Distance is weighted at 40%, so very close should score much higher
      expect(closeScore).toBeGreaterThan(farScore + 30);
    });

    it('should produce consistent scores for same input', () => {
      const factors: ScoringFactors = {
        distance: 25,
        bearingDiff: 30,
        source: 'google_geocoding',
        hasName: true,
        hasRating: false,
      };

      const score1 = calculateConfidenceScore(factors);
      const score2 = calculateConfidenceScore(factors);
      const score3 = calculateConfidenceScore(factors);

      expect(score1).toBe(score2);
      expect(score2).toBe(score3);
    });
  });

  describe('compareByConfidence', () => {
    it('should sort candidates in descending order', () => {
      const candidates = [
        { confidence: 50, name: 'Building A' },
        { confidence: 90, name: 'Building B' },
        { confidence: 70, name: 'Building C' },
        { confidence: 30, name: 'Building D' },
      ];

      candidates.sort(compareByConfidence);

      expect(candidates[0]?.confidence).toBe(90);
      expect(candidates[1]?.confidence).toBe(70);
      expect(candidates[2]?.confidence).toBe(50);
      expect(candidates[3]?.confidence).toBe(30);
    });

    it('should handle equal confidence scores', () => {
      const candidates = [
        { confidence: 50, name: 'A' },
        { confidence: 50, name: 'B' },
      ];

      candidates.sort(compareByConfidence);

      // Order should be stable for equal scores
      expect(candidates).toHaveLength(2);
    });

    it('should handle single candidate', () => {
      const candidates = [{ confidence: 75, name: 'Only Building' }];

      candidates.sort(compareByConfidence);

      expect(candidates).toHaveLength(1);
      expect(candidates[0]?.confidence).toBe(75);
    });
  });

  describe('getScoringWeights', () => {
    it('should return scoring configuration', () => {
      const config = getScoringWeights();

      expect(config).toHaveProperty('weights');
      expect(config).toHaveProperty('sourceWeights');
      expect(config).toHaveProperty('distanceParams');
      expect(config).toHaveProperty('bearingParams');
    });

    it('should have weights that sum to 1.0', () => {
      const config = getScoringWeights();
      const { weights } = config;

      const sum =
        weights.distance +
        weights.bearing +
        weights.source +
        weights.metadata;

      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should have valid source weights', () => {
      const config = getScoringWeights();
      const { sourceWeights } = config;

      expect(sourceWeights.google_places).toBe(1.0);
      expect(sourceWeights.google_geocoding).toBeGreaterThan(0);
      expect(sourceWeights.nominatim).toBeGreaterThan(0);
      expect(sourceWeights.cache).toBeGreaterThan(0);

      // Google Places should be most reliable
      expect(sourceWeights.google_places).toBeGreaterThanOrEqual(
        sourceWeights.google_geocoding
      );
      expect(sourceWeights.google_geocoding).toBeGreaterThan(
        sourceWeights.nominatim
      );
    });
  });
});
