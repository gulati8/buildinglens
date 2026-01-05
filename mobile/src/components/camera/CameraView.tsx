import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { CameraView as ExpoCamera } from 'expo-camera';
import { colors, typography, spacing } from '../../theme';

export interface CameraViewProps {
  onCameraReady?: () => void;
  children?: React.ReactNode;
}

/**
 * Full-screen camera view with back camera
 * Displays overlay children (crosshair, building info, etc.)
 */
export function CameraView({ onCameraReady, children }: CameraViewProps) {
  const [isCameraReady, setIsCameraReady] = useState(false);

  const handleCameraReady = () => {
    setIsCameraReady(true);
    onCameraReady?.();
  };

  return (
    <View style={styles.container}>
      <ExpoCamera
        style={styles.camera}
        facing="back"
        onCameraReady={handleCameraReady}
      >
        {/* Overlay children */}
        {isCameraReady && children}
      </ExpoCamera>

      {/* Loading state */}
      {!isCameraReady && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Initializing camera...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[900],
  },
  camera: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.neutral[900],
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.lg,
    color: colors.text.inverse,
    fontWeight: typography.weights.medium,
  },
});
