import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import type { DevicePosition } from '../../types/device.types';
import { colors, typography, spacing } from '../../theme';
import { GPS_CONFIG } from '../../utils/constants';

export interface StatusIndicatorProps {
  position: DevicePosition | null;
  heading: number | null;
}

type StatusLevel = 'good' | 'fair' | 'poor';

interface StatusInfo {
  level: StatusLevel;
  color: string;
  gpsText: string;
  compassText: string;
}

/**
 * Get GPS accuracy status level
 */
function getGPSStatus(accuracy: number | null): { level: StatusLevel; text: string } {
  if (accuracy === null) {
    return { level: 'poor', text: 'No GPS' };
  }

  if (accuracy <= GPS_CONFIG.ACCURACY.HIGH) {
    return { level: 'good', text: `GPS: ${Math.round(accuracy)}m` };
  }

  if (accuracy <= GPS_CONFIG.ACCURACY.MEDIUM) {
    return { level: 'fair', text: `GPS: ${Math.round(accuracy)}m` };
  }

  return { level: 'poor', text: `GPS: ${Math.round(accuracy)}m` };
}

/**
 * Get compass status level
 */
function getCompassStatus(heading: number | null): { level: StatusLevel; text: string } {
  if (heading === null) {
    return { level: 'poor', text: 'No Compass' };
  }

  return { level: 'good', text: `${Math.round(heading)}°` };
}

/**
 * Get overall status color
 */
function getStatusColor(level: StatusLevel): string {
  switch (level) {
    case 'good':
      return colors.success;
    case 'fair':
      return colors.warning;
    case 'poor':
      return colors.error;
  }
}

/**
 * Small top indicator showing GPS accuracy and compass status
 */
export function StatusIndicator({ position, heading }: StatusIndicatorProps) {
  const gpsStatus = getGPSStatus(position?.horizontalAccuracy ?? null);
  const compassStatus = getCompassStatus(heading);

  // Overall status is the worse of the two
  const overallLevel: StatusLevel =
    gpsStatus.level === 'poor' || compassStatus.level === 'poor'
      ? 'poor'
      : gpsStatus.level === 'fair' || compassStatus.level === 'fair'
      ? 'fair'
      : 'good';

  const statusColor = getStatusColor(overallLevel);

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: statusColor }]} />
      <View style={styles.textContainer}>
        <Text style={styles.statusText}>{gpsStatus.text}</Text>
        <View style={styles.separator} />
        <Text style={styles.statusText}>{compassStatus.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.overlay.bg,
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: typography.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.inverse,
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: colors.text.inverse,
    opacity: 0.3,
    marginHorizontal: spacing.sm,
  },
});
