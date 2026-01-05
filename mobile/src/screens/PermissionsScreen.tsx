import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/Button';
import { colors, typography, spacing } from '../theme';

export interface PermissionsScreenProps {
  onPermissionsGranted: () => void;
}

/**
 * Screen to request camera and location permissions
 * Shows before the main app
 */
export function PermissionsScreen({ onPermissionsGranted }: PermissionsScreenProps) {
  const {
    cameraPermission,
    locationPermission,
    requestAllPermissions,
    hasAllPermissions,
  } = usePermissions();

  const [isRequesting, setIsRequesting] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleRequestPermissions = async () => {
    setIsRequesting(true);
    setShowError(false);

    const granted = await requestAllPermissions();

    setIsRequesting(false);

    if (granted) {
      onPermissionsGranted();
    } else {
      setShowError(true);
    }
  };

  // Auto-proceed if permissions are already granted
  React.useEffect(() => {
    if (hasAllPermissions) {
      onPermissionsGranted();
    }
  }, [hasAllPermissions, onPermissionsGranted]);

  const cameraGranted = cameraPermission === 'granted';
  const locationGranted = locationPermission === 'granted';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to BuildingLens</Text>
          <Text style={styles.subtitle}>
            We need your permission to access your camera and location to identify buildings
          </Text>
        </View>

        {/* Permissions list */}
        <View style={styles.permissionsContainer}>
          {/* Camera permission */}
          <View style={styles.permissionItem}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📷</Text>
            </View>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>Camera Access</Text>
              <Text style={styles.permissionDescription}>
                Required to capture the view and identify buildings in real-time
              </Text>
              {cameraGranted && (
                <View style={styles.grantedBadge}>
                  <Text style={styles.grantedText}>Granted ✓</Text>
                </View>
              )}
            </View>
          </View>

          {/* Location permission */}
          <View style={styles.permissionItem}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📍</Text>
            </View>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>Location Access</Text>
              <Text style={styles.permissionDescription}>
                Required to determine your position and orientation for accurate building identification
              </Text>
              {locationGranted && (
                <View style={styles.grantedBadge}>
                  <Text style={styles.grantedText}>Granted ✓</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Error message */}
        {showError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Please grant all permissions to use BuildingLens. You can change permissions in your device settings.
            </Text>
          </View>
        )}

        {/* Action button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isRequesting ? 'Requesting...' : 'Grant Permissions'}
            onPress={handleRequestPermissions}
            disabled={isRequesting}
          />
        </View>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          Your privacy is important to us. Location and camera data is only used for building identification and is not stored or shared.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing['2xl'],
    paddingTop: spacing['4xl'],
  },
  header: {
    marginBottom: spacing['3xl'],
  },
  title: {
    fontSize: typography['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.lg,
    color: colors.text.secondary,
    lineHeight: typography.lg * typography.lineHeights.relaxed,
  },
  permissionsContainer: {
    marginBottom: spacing['2xl'],
  },
  permissionItem: {
    flexDirection: 'row',
    marginBottom: spacing['2xl'],
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: colors.neutral[100],
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 24,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  permissionDescription: {
    fontSize: typography.base,
    color: colors.text.secondary,
    lineHeight: typography.base * typography.lineHeights.normal,
  },
  grantedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  grantedText: {
    fontSize: typography.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.inverse,
  },
  errorContainer: {
    backgroundColor: colors.error,
    padding: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing['2xl'],
  },
  errorText: {
    fontSize: typography.base,
    color: colors.text.inverse,
    lineHeight: typography.base * typography.lineHeights.normal,
  },
  buttonContainer: {
    marginBottom: spacing.xl,
  },
  footerNote: {
    fontSize: typography.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sm * typography.lineHeights.relaxed,
  },
});
