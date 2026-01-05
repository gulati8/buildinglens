import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';

/**
 * Center targeting reticle
 * Subtle crosshair overlay showing aim point
 */
export function Crosshair() {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Outer circle */}
      <View style={styles.outerCircle}>
        {/* Inner circle */}
        <View style={styles.innerCircle} />

        {/* Cross lines */}
        <View style={[styles.line, styles.lineHorizontal]} />
        <View style={[styles.line, styles.lineVertical]} />

        {/* Corner brackets */}
        <View style={[styles.bracket, styles.bracketTopLeft]} />
        <View style={[styles.bracket, styles.bracketTopRight]} />
        <View style={[styles.bracket, styles.bracketBottomLeft]} />
        <View style={[styles.bracket, styles.bracketBottomRight]} />
      </View>
    </View>
  );
}

const CROSSHAIR_SIZE = 80;
const LINE_WIDTH = 2;
const BRACKET_SIZE = 16;
const BRACKET_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    width: CROSSHAIR_SIZE,
    height: CROSSHAIR_SIZE,
    borderRadius: CROSSHAIR_SIZE / 2,
    borderWidth: LINE_WIDTH,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  innerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  line: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  lineHorizontal: {
    width: 24,
    height: LINE_WIDTH,
    left: -24 - LINE_WIDTH,
  },
  lineVertical: {
    width: LINE_WIDTH,
    height: 24,
    top: -24 - LINE_WIDTH,
  },
  bracket: {
    position: 'absolute',
    borderColor: colors.primary,
    borderWidth: BRACKET_WIDTH,
  },
  bracketTopLeft: {
    top: -LINE_WIDTH,
    left: -LINE_WIDTH,
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: CROSSHAIR_SIZE / 2,
  },
  bracketTopRight: {
    top: -LINE_WIDTH,
    right: -LINE_WIDTH,
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: CROSSHAIR_SIZE / 2,
  },
  bracketBottomLeft: {
    bottom: -LINE_WIDTH,
    left: -LINE_WIDTH,
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: CROSSHAIR_SIZE / 2,
  },
  bracketBottomRight: {
    bottom: -LINE_WIDTH,
    right: -LINE_WIDTH,
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: CROSSHAIR_SIZE / 2,
  },
});
