import { useState, useEffect, useCallback } from 'react';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';

export type PermissionStatus = 'undetermined' | 'denied' | 'granted';

export interface UsePermissionsReturn {
  cameraPermission: PermissionStatus;
  locationPermission: PermissionStatus;
  requestCameraPermission: () => Promise<boolean>;
  requestLocationPermission: () => Promise<boolean>;
  requestAllPermissions: () => Promise<boolean>;
  hasAllPermissions: boolean;
}

/**
 * Hook to manage camera and location permissions
 */
export function usePermissions(): UsePermissionsReturn {
  const [cameraPermission, setCameraPermission] = useState<PermissionStatus>('undetermined');
  const [locationPermission, setLocationPermission] = useState<PermissionStatus>('undetermined');

  // Check initial permission status
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    // Check camera permission
    const cameraStatus = await Camera.getCameraPermissionsAsync();
    setCameraPermission(
      cameraStatus.granted ? 'granted' : cameraStatus.canAskAgain ? 'undetermined' : 'denied'
    );

    // Check location permission
    const locationStatus = await Location.getForegroundPermissionsAsync();
    setLocationPermission(
      locationStatus.granted ? 'granted' : locationStatus.canAskAgain ? 'undetermined' : 'denied'
    );
  };

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    const granted = status === 'granted';
    setCameraPermission(granted ? 'granted' : 'denied');
    return granted;
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setLocationPermission(granted ? 'granted' : 'denied');
    return granted;
  }, []);

  const requestAllPermissions = useCallback(async (): Promise<boolean> => {
    const [cameraGranted, locationGranted] = await Promise.all([
      requestCameraPermission(),
      requestLocationPermission(),
    ]);
    return cameraGranted && locationGranted;
  }, [requestCameraPermission, requestLocationPermission]);

  const hasAllPermissions = cameraPermission === 'granted' && locationPermission === 'granted';

  return {
    cameraPermission,
    locationPermission,
    requestCameraPermission,
    requestLocationPermission,
    requestAllPermissions,
    hasAllPermissions,
  };
}
