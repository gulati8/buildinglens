export const colors = {
  // Primary brand color
  primary: '#0EA5E9',
  primaryDark: '#0284C7',
  primaryLight: '#38BDF8',

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Neutral colors (light mode)
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Dark mode overlay (always dark for camera)
  overlay: {
    bg: 'rgba(0, 0, 0, 0.7)',
    bgLight: 'rgba(0, 0, 0, 0.5)',
    bgHeavy: 'rgba(0, 0, 0, 0.9)',
  },

  // Semantic colors
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
    inverse: '#FFFFFF',
  },
};

export type Colors = typeof colors;
