import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import type { BuildingCandidate } from '../../types/building.types';
import { colors, typography, spacing } from '../../theme';
import { formatDistance, formatConfidence } from '../../utils/formatting';

export interface BuildingInfoSheetProps {
  candidate: BuildingCandidate | null;
  isLoading: boolean;
}

/**
 * Bottom sheet displaying the top building candidate
 * Slides up with animation
 */
export function BuildingInfoSheet({ candidate, isLoading }: BuildingInfoSheetProps) {
  const slideAnim = useRef(new Animated.Value(300)).current; // Start off-screen

  useEffect(() => {
    // Slide up when there's content, slide down when empty
    Animated.spring(slideAnim, {
      toValue: candidate || isLoading ? 0 : 300,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [candidate, isLoading, slideAnim]);

  // Render loading state
  if (isLoading) {
    return (
      <Animated.View
        style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.handle} />
        <View style={styles.content}>
          <Text style={styles.loadingText}>Searching for buildings...</Text>
        </View>
      </Animated.View>
    );
  }

  // Render no results state
  if (!candidate) {
    return (
      <Animated.View
        style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.handle} />
        <View style={styles.content}>
          <Text style={styles.emptyText}>No building found</Text>
          <Text style={styles.emptySubtext}>
            Point your camera at a building to identify it
          </Text>
        </View>
      </Animated.View>
    );
  }

  // Render building info
  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <View style={styles.handle} />
      <View style={styles.content}>
        {/* Building name */}
        <Text style={styles.buildingName} numberOfLines={2}>
          {candidate.name}
        </Text>

        {/* Address */}
        <Text style={styles.address} numberOfLines={2}>
          {candidate.address}
        </Text>

        {/* Distance and confidence */}
        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Distance</Text>
            <Text style={styles.metadataValue}>{formatDistance(candidate.distance)}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Confidence</Text>
            <Text style={styles.metadataValue}>{formatConfidence(candidate.confidence)}</Text>
          </View>
        </View>

        {/* Confidence bar */}
        <View style={styles.confidenceBarBackground}>
          <View
            style={[
              styles.confidenceBar,
              { width: `${Math.round(candidate.confidence * 100)}%` },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  buildingName: {
    fontSize: typography['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  address: {
    fontSize: typography.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: typography.base * typography.lineHeights.normal,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  metadataItem: {
    alignItems: 'center',
  },
  metadataLabel: {
    fontSize: typography.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  metadataValue: {
    fontSize: typography.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  confidenceBarBackground: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  loadingText: {
    fontSize: typography.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.base,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingBottom: spacing.lg,
  },
});
