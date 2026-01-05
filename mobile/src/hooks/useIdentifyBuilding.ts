import { useState, useEffect, useCallback, useRef } from 'react';
import type { BuildingCandidate } from '../types/building.types';
import type { IdentifyRequest } from '../types/api.types';
import { api } from '../services/api';
import { IDENTIFICATION_CONFIG } from '../utils/constants';

export interface UseIdentifyBuildingParams {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  horizontalAccuracy: number | null;
  enabled?: boolean;
}

export interface UseIdentifyBuildingReturn {
  candidates: BuildingCandidate[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to identify building based on device position and heading
 * Automatically debounces requests to avoid spamming the API
 */
export function useIdentifyBuilding({
  latitude,
  longitude,
  heading,
  horizontalAccuracy,
  enabled = true,
}: UseIdentifyBuildingParams): UseIdentifyBuildingReturn {
  const [candidates, setCandidates] = useState<BuildingCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestRef = useRef<string>('');

  const identifyBuilding = useCallback(async () => {
    // Validate inputs
    if (!latitude || !longitude || heading === null || horizontalAccuracy === null) {
      return;
    }

    if (!enabled) {
      return;
    }

    // Create request signature to avoid duplicate requests
    const requestSignature = `${latitude.toFixed(6)},${longitude.toFixed(6)},${heading.toFixed(0)}`;
    if (requestSignature === lastRequestRef.current) {
      return; // Same request, skip
    }

    try {
      setIsLoading(true);
      setError(null);

      const request: IdentifyRequest = {
        latitude,
        longitude,
        heading,
        horizontalAccuracy,
      };

      const response = await api.identifyBuilding(request);

      if (response.success) {
        setCandidates(response.data.candidates);
        lastRequestRef.current = requestSignature;
      }
    } catch (err: any) {
      const errorMessage = err?.error?.message || err?.message || 'Failed to identify building';
      setError(errorMessage);
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, heading, horizontalAccuracy, enabled]);

  // Debounced effect to trigger identification
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      identifyBuilding();
    }, IDENTIFICATION_CONFIG.DEBOUNCE_MS);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [identifyBuilding]);

  const refetch = useCallback(() => {
    // Force immediate refetch, bypassing debounce
    lastRequestRef.current = ''; // Reset last request
    identifyBuilding();
  }, [identifyBuilding]);

  return {
    candidates,
    isLoading,
    error,
    refetch,
  };
}
