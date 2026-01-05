import React, { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useDeviceLocation } from '../hooks/useDeviceLocation';
import { useCompass } from '../hooks/useCompass';
import { useIdentifyBuilding } from '../hooks/useIdentifyBuilding';
import { CameraView } from '../components/camera/CameraView';
import { Crosshair } from '../components/crosshair/Crosshair';
import { StatusIndicator } from '../components/status/StatusIndicator';
import { ErrorOverlay } from '../components/status/ErrorOverlay';
import { BuildingInfoSheet } from '../components/building/BuildingInfoSheet';
import { colors } from '../theme';

/**
 * Main camera screen for building identification
 * Integrates GPS, compass, and building identification
 */
export function CameraScreen() {
  const [dismissedError, setDismissedError] = useState<string | null>(null);

  // Get device location
  const { position, error: locationError, isLoading: isLoadingLocation } = useDeviceLocation();

  // Get device heading
  const { heading, error: compassError } = useCompass();

  // Identify building
  const {
    candidates,
    isLoading: isLoadingBuilding,
    error: buildingError,
  } = useIdentifyBuilding({
    latitude: position?.latitude ?? null,
    longitude: position?.longitude ?? null,
    heading,
    horizontalAccuracy: position?.horizontalAccuracy ?? null,
    enabled: !isLoadingLocation, // Only enable when location is ready
  });

  // Get the top candidate (highest confidence)
  const topCandidate = candidates.length > 0 ? candidates[0] : null;

  // Determine the most critical error to show
  const currentError = locationError || compassError || buildingError;

  // Check if error was dismissed
  const shouldShowError = currentError && currentError !== dismissedError;

  // Handle error dismissal
  const handleDismissError = useCallback(() => {
    if (currentError) {
      setDismissedError(currentError);
    }
  }, [currentError]);

  // Reset dismissed error when error changes
  React.useEffect(() => {
    if (currentError !== dismissedError) {
      setDismissedError(null);
    }
  }, [currentError, dismissedError]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <CameraView>
          {/* Status indicator at top */}
          <StatusIndicator position={position} heading={heading} />

          {/* Crosshair in center */}
          <Crosshair />

          {/* Error overlay (if any) */}
          {shouldShowError && (
            <ErrorOverlay error={currentError} onDismiss={handleDismissError} />
          )}

          {/* Building info sheet at bottom */}
          <BuildingInfoSheet
            candidate={topCandidate}
            isLoading={isLoadingBuilding && !isLoadingLocation}
          />
        </CameraView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[900],
  },
  content: {
    flex: 1,
  },
});
