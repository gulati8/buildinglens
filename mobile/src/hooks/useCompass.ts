import { useState, useEffect } from 'react';
import { Magnetometer } from 'expo-sensors';
import { normalizeAngle } from '../utils/geo';
import { COMPASS_CONFIG } from '../utils/constants';

export interface UseCompassReturn {
  heading: number | null;
  error: string | null;
}

/**
 * Calculate heading from magnetometer data
 * Returns heading in degrees (0-360) where 0 is North
 */
function calculateHeading(x: number, y: number): number {
  // Calculate angle in radians
  let angle = Math.atan2(y, x);

  // Convert to degrees
  let degrees = angle * (180 / Math.PI);

  // Normalize to 0-360 range
  // Note: We subtract from 90 to convert from mathematical angle to compass heading
  // (where 0 is North instead of East)
  degrees = 90 - degrees;

  return normalizeAngle(degrees);
}

/**
 * Hook to track device compass heading using magnetometer
 * Updates at ~5Hz for smooth compass
 */
export function useCompass(): UseCompassReturn {
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

    const startCompass = async () => {
      try {
        // Check if magnetometer is available
        const isAvailable = await Magnetometer.isAvailableAsync();
        if (!isAvailable) {
          if (isMounted) {
            setError('Magnetometer not available on this device');
          }
          return;
        }

        // Set update interval
        Magnetometer.setUpdateInterval(COMPASS_CONFIG.UPDATE_INTERVAL);

        // Subscribe to magnetometer updates
        subscription = Magnetometer.addListener((data) => {
          if (isMounted) {
            const compassHeading = calculateHeading(data.x, data.y);
            setHeading(compassHeading);
            setError(null);
          }
        });
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to start compass');
        }
      }
    };

    startCompass();

    // Cleanup
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return { heading, error };
}
