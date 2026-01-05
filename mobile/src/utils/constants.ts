export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: 10000, // 10 seconds
};

export const GPS_CONFIG = {
  ACCURACY: {
    HIGH: 5,      // meters
    MEDIUM: 15,   // meters
    LOW: 50,      // meters
  },
  UPDATE_INTERVAL: 1000, // 1 second
};

export const COMPASS_CONFIG = {
  UPDATE_INTERVAL: 100, // 100ms
};

export const IDENTIFICATION_CONFIG = {
  DEBOUNCE_MS: 2000, // 2 seconds between requests
  HEADING_TOLERANCE: 45, // degrees
  SEARCH_RADIUS: 50, // meters
};
