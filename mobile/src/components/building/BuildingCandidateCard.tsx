import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import type { BuildingCandidate } from '../../types/building.types';
import { colors, typography, spacing } from '../../theme';
import { formatDistance, formatHeading, formatConfidence } from '../../utils/formatting';

export interface BuildingCandidateCardProps {
  candidate: BuildingCandidate;
}

/**
 * Compact card showing one building candidate
 */
export function BuildingCandidateCard({ candidate }: BuildingCandidateCardProps) {
  const confidencePercentage = Math.round(candidate.confidence * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {candidate.name}
        </Text>
        <View style={styles.distanceContainer}>
          <Text style={styles.distance}>{formatDistance(candidate.distance)}</Text>
          <Text style={styles.bearing}>{formatHeading(candidate.bearing)}</Text>
        </View>
      </View>

      {/* Confidence bar */}
      <View style={styles.confidenceContainer}>
        <View style={styles.confidenceBarBackground}>
          <View style={[styles.confidenceBar, { width: `${confidencePercentage}%` }]} />
        </View>
        <Text style={styles.confidenceText}>{formatConfidence(candidate.confidence)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: typography.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  distance: {
    fontSize: typography.sm,
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
  bearing: {
    fontSize: typography.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  confidenceBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: typography.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    minWidth: 40,
    textAlign: 'right',
  },
});
