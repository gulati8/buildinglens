import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { colors, typography } from '../../theme';

interface HeadingProps extends TextProps {
  level?: 1 | 2 | 3;
  children: React.ReactNode;
}

/**
 * Heading component with different levels
 */
export function Heading({ level = 1, children, style, ...props }: HeadingProps) {
  const headingStyle = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;

  return (
    <Text style={[headingStyle, style]} {...props}>
      {children}
    </Text>
  );
}

interface BodyTextProps extends TextProps {
  children: React.ReactNode;
}

/**
 * Body text component
 */
export function BodyText({ children, style, ...props }: BodyTextProps) {
  return (
    <Text style={[styles.body, style]} {...props}>
      {children}
    </Text>
  );
}

interface CaptionProps extends TextProps {
  children: React.ReactNode;
}

/**
 * Caption component for small text
 */
export function Caption({ children, style, ...props }: CaptionProps) {
  return (
    <Text style={[styles.caption, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: typography['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography['4xl'] * typography.lineHeights.tight,
  },
  h2: {
    fontSize: typography['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography['3xl'] * typography.lineHeights.tight,
  },
  h3: {
    fontSize: typography['2xl'],
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    lineHeight: typography['2xl'] * typography.lineHeights.normal,
  },
  body: {
    fontSize: typography.base,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
    lineHeight: typography.base * typography.lineHeights.normal,
  },
  caption: {
    fontSize: typography.sm,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    lineHeight: typography.sm * typography.lineHeights.normal,
  },
});
