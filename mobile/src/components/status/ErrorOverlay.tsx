import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../../theme';

export interface ErrorOverlayProps {
  error: string | null;
  onDismiss?: () => void;
}

/**
 * Error display overlay
 * Shows a dismissible error message
 */
export function ErrorOverlay({ error, onDismiss }: ErrorOverlayProps) {
  if (!error) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.errorBox}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>!</Text>
        </View>
        <Text style={styles.errorText}>{error}</Text>
        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            accessibilityLabel="Dismiss error"
            accessibilityRole="button"
          >
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120, // Below status indicator
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 1000,
  },
  errorBox: {
    backgroundColor: colors.error,
    borderRadius: 12,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconText: {
    fontSize: typography['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  errorText: {
    fontSize: typography.base,
    color: colors.text.inverse,
    marginBottom: spacing.md,
    lineHeight: typography.base * typography.lineHeights.normal,
  },
  dismissButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  dismissText: {
    fontSize: typography.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
