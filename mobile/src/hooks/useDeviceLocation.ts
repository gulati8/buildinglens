import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import type { DevicePosition } from '../types/device.types';
import { GPS_CONFIG } from '../utils/constants';

export interface UseDeviceLocationReturn {
  position: DevicePosition | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Hook to track device GPS location in real-time
 * Updates at ~1Hz for real-time tracking
 */
export function useDeviceLocation(): UseDeviceLocationReturn {
  const [position, setPosition] = useState<DevicePosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    const startLocationTracking = async () => {
      try {
        // Check permission
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setError('Location permission not granted');
            setIsLoading(false);
          }
          return;
        }

        // Start watching position
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: GPS_CONFIG.UPDATE_INTERVAL,
            distanceInterval: 0, // Update on any movement
          },
          (location) => {
            if (isMounted) {
              const devicePosition: DevicePosition = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                altitude: location.coords.altitude,
                heading: location.coords.heading ?? 0,
                horizontalAccuracy: location.coords.accuracy ?? 999,
                timestamp: location.timestamp,
              };
              setPosition(devicePosition);
              setError(null);
              setIsLoading(false);
            }
          }
        );
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to get location');
          setIsLoading(false);
        }
      }
    };

    startLocationTracking();

    // Cleanup
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return { position, error, isLoading };
}
