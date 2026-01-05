export { colors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';

export type { Colors } from './colors';
export type { Typography } from './typography';
export type { Spacing } from './spacing';

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';

export const theme = {
  colors,
  typography,
  spacing,
};

export type Theme = typeof theme;
