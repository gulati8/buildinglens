# BuildingLens Mobile App

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-~5.9-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

React Native mobile application for identifying buildings using camera, GPS, and compass. Built with Expo for seamless iOS/Android deployment.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Hooks & Components](#hooks--components)
- [API Integration](#api-integration)
- [Permissions](#permissions)
- [Theme System](#theme-system)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Building for Production](#building-for-production)

## Features

- Real-time building identification with GPS location
- Digital compass integration for heading-based filtering
- Camera preview with crosshair overlay
- Live permissions handling for camera, location, and sensors
- Debounced API requests to prevent spam
- Responsive UI with bottom sheet results display
- Smooth animations and transitions
- Offline-capable design with graceful degradation
- TypeScript for full type safety
- Comprehensive error handling and user feedback

## Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm 9+** or **yarn** (included with Node.js)
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS**: macOS with Xcode 14+ and iOS Simulator
- **Android**: Android Studio with Android Emulator or physical Android device
- **Backend API**: BuildingLens API running at http://localhost:3100 (or your configured server)

## Installation

1. **Install dependencies**
   ```bash
   cd /Users/amitgulati/Projects/JPD/buildinglens/mobile
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your API endpoint**
   ```bash
   # For local development
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3100

   # For testing on physical device, use your machine's IP
   # EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3100
   ```

4. **Install Expo CLI globally** (if not already installed)
   ```bash
   npm install -g expo-cli
   ```

## Running the App

### Development Server

Start the Expo development server:

```bash
npm start
```

This opens the Expo CLI menu with options to run on different platforms.

### iOS Simulator (macOS only)

```bash
# Option 1: From npm start menu, press 'i'
npm run ios

# Option 2: Direct command
expo start --ios
```

**Requirements**:
- macOS (Apple Silicon or Intel)
- Xcode 14+ with iOS SDK 15+
- iOS Simulator (install via Xcode Preferences)

### Android Emulator

```bash
# Option 1: From npm start menu, press 'a'
npm run android

# Option 2: Direct command
expo start --android
```

**Requirements**:
- Android Studio installed
- Android Emulator running or Android device connected
- API level 21+

**Start Android Emulator**:
```bash
# List available emulators
emulator -list-avds

# Start an emulator
emulator -avd Pixel_5_API_31
```

### Physical Device

1. **Install Expo Go app**
   - iOS: [App Store](https://apps.apple.com/us/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Configure API endpoint for your network**
   Edit `.env`:
   ```bash
   # Replace with your machine's local IP address
   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3100
   ```

3. **Start development server and scan QR code**
   ```bash
   npm start

   # Scan QR code with:
   # iOS: Camera app
   # Android: Expo Go app
   ```

### Web Version (Limited)

```bash
npm run web
```

**Note**: Camera functionality is not available on web. Use for testing UI and API integration only.

## Project Structure

```
mobile/
├── src/
│   ├── index.ts                 # App entry point
│   ├── app.json                 # Expo configuration
│   ├── screens/                 # Screen components
│   │   ├── PermissionsScreen.tsx    # Permission requests
│   │   ├── CameraScreen.tsx         # Main camera interface
│   │   └── index.ts
│   ├── components/              # Reusable UI components
│   │   ├── camera/              # Camera preview
│   │   │   ├── CameraPreview.tsx
│   │   │   └── index.ts
│   │   ├── building/            # Building results
│   │   │   ├── BuildingCard.tsx
│   │   │   ├── BuildingResult.tsx
│   │   │   └── index.ts
│   │   ├── status/              # Status indicators
│   │   │   ├── GPSIndicator.tsx
│   │   │   ├── HeadingIndicator.tsx
│   │   │   └── index.ts
│   │   ├── crosshair/           # Camera crosshair
│   │   │   ├── Crosshair.tsx
│   │   │   └── index.ts
│   │   └── ui/                  # Basic UI components
│   │       ├── Button.tsx
│   │       ├── Text.tsx
│   │       └── index.ts
│   ├── hooks/                   # Custom React hooks
│   │   ├── usePermissions.ts        # Permission handling
│   │   ├── useDeviceLocation.ts     # GPS location tracking
│   │   ├── useCompass.ts            # Compass/heading sensor
│   │   ├── useIdentifyBuilding.ts   # Building identification
│   │   └── index.ts
│   ├── services/                # External services
│   │   ├── api.ts               # HTTP API client
│   │   └── index.ts
│   ├── types/                   # TypeScript type definitions
│   │   ├── api.types.ts         # API request/response types
│   │   ├── building.types.ts    # Building data types
│   │   ├── device.types.ts      # Device sensor types
│   │   └── index.ts
│   ├── utils/                   # Utility functions
│   │   ├── constants.ts         # App configuration
│   │   ├── formatting.ts        # Text/number formatting
│   │   ├── geo.ts               # Geolocation calculations
│   │   └── index.ts
│   └── theme/                   # Design system
│       ├── colors.ts            # Color palette
│       ├── spacing.ts           # Spacing scale
│       ├── typography.ts        # Font styles
│       └── index.ts
├── assets/                      # Static assets
│   ├── icon.png                 # App icon
│   ├── splash-icon.png          # Splash screen
│   └── favicon.png              # Favicon
├── app.json                     # Expo config
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── jest.config.js               # Test config
├── babel.config.js              # Babel config
├── .env.example                 # Environment template
└── README.md                    # This file
```

## Hooks & Components

### Custom Hooks

#### usePermissions

Manages camera, location, and sensor permissions.

```typescript
import { usePermissions } from './hooks';

const { cameraGranted, locationGranted, status, requestPermissions } = usePermissions();
```

**Returns**:
- `cameraGranted`: boolean - Camera permission status
- `locationGranted`: boolean - Location permission status
- `status`: string - Overall permission status
- `requestPermissions()`: Promise - Request all permissions

#### useDeviceLocation

Tracks GPS location with accuracy.

```typescript
import { useDeviceLocation } from './hooks';

const { latitude, longitude, accuracy, isTracking } = useDeviceLocation();
```

**Returns**:
- `latitude`: number | null - Current latitude
- `longitude`: number | null - Current longitude
- `accuracy`: number | null - Accuracy in meters
- `isTracking`: boolean - Whether location is being tracked

#### useCompass

Accesses device compass/magnetometer for heading.

```typescript
import { useCompass } from './hooks';

const { heading, headingAccuracy, isCalibrated } = useCompass();
```

**Returns**:
- `heading`: number | null - Current heading (0-360 degrees)
- `headingAccuracy`: number | null - Accuracy of heading
- `isCalibrated`: boolean - Whether compass is calibrated

#### useIdentifyBuilding

Identifies buildings based on location and heading.

```typescript
import { useIdentifyBuilding } from './hooks';

const { candidates, isLoading, error, refetch } = useIdentifyBuilding({
  latitude,
  longitude,
  heading,
  horizontalAccuracy,
  enabled: true,
});
```

**Parameters**:
- `latitude`: number | null - User latitude
- `longitude`: number | null - User longitude
- `heading`: number | null - User heading (0-360)
- `horizontalAccuracy`: number | null - Location accuracy
- `enabled`: boolean - Whether to perform identification

**Returns**:
- `candidates`: BuildingCandidate[] - Array of identified buildings
- `isLoading`: boolean - Whether request is in progress
- `error`: string | null - Error message if any
- `refetch()`: () => void - Manual refresh function

### Components

#### CameraPreview

Displays live camera feed with crosshair.

```typescript
import { CameraPreview } from './components/camera';

<CameraPreview
  headingDegrees={heading}
  isReady={permissionsGranted}
  onCameraReady={() => {}}
/>
```

#### BuildingResult

Displays identified building in bottom sheet.

```typescript
import { BuildingResult } from './components/building';

<BuildingResult
  candidate={candidate}
  distance={distance}
  bearing={bearing}
  onClose={() => {}}
/>
```

#### GPSIndicator / HeadingIndicator

Status indicators for location and compass.

```typescript
import { GPSIndicator, HeadingIndicator } from './components/status';

<GPSIndicator
  latitude={latitude}
  longitude={longitude}
  accuracy={accuracy}
/>

<HeadingIndicator
  heading={heading}
  accuracy={headingAccuracy}
/>
```

## API Integration

### API Client

The app communicates with the BuildingLens backend via the `api` service.

**Configuration**:
```typescript
// src/services/api.ts
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const api = {
  identifyBuilding: async (request: IdentifyRequest): Promise<ApiResponse> => {
    // Implementation
  },
};
```

**Making Requests**:
```typescript
import { api } from './services/api';

const response = await api.identifyBuilding({
  latitude: 37.7749,
  longitude: -122.4194,
  heading: 45,
  searchRadius: 100,
});

if (response.success) {
  console.log(response.data.candidates);
} else {
  console.error(response.error);
}
```

### API Response Types

```typescript
interface IdentifyRequest {
  latitude: number;
  longitude: number;
  heading?: number;
  searchRadius?: number;
}

interface IdentifyResponse {
  candidates: BuildingCandidate[];
  query: object;
  metadata: object;
}

interface BuildingCandidate {
  id: string;
  name: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  distance: number;
  bearing: number;
  confidence: number;
  source: string;
  metadata: object;
}
```

### Network Configuration

**iOS Simulator**:
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3100
```

**Android Emulator**:
```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3100
```

**Physical Device** (replace with your local IP):
```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3100
```

Find your local IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

## Permissions

The app requires three permissions:

### Camera

**iOS**: `NSCameraUsageDescription` in Info.plist
**Android**: `android.permission.CAMERA` in AndroidManifest.xml

**Prompt**: Shown on first launch

### Location

**iOS**: `NSLocationWhenInUseUsageDescription` in Info.plist
**Android**: `android.permission.ACCESS_FINE_LOCATION` in AndroidManifest.xml

**Prompt**: Shown on first launch
**Required for**: GPS coordinates

### Sensors (Accelerometer/Magnetometer)

**iOS**: Implicit in Expo
**Android**: Implicit in Expo

**Required for**: Compass heading

**Permission Flow**:
1. User launches app
2. PermissionsScreen appears
3. Requests camera, location, and sensor permissions
4. Transitions to CameraScreen once all permissions granted
5. App displays building identification results

## Theme System

Centralized design system with colors, spacing, and typography.

### Colors

```typescript
import { colors } from './theme';

// Primary
colors.primary       // #007AFF
colors.primaryLight  // #F0F9FF

// Status
colors.success       // #34C759
colors.warning       // #FF9500
colors.error         // #FF3B30

// Neutral
colors.white         // #FFFFFF
colors.black         // #000000
colors.gray50        // #F9FAFB
colors.gray100       // #F3F4F6
```

### Spacing

```typescript
import { spacing } from './theme';

spacing.xs    // 4
spacing.sm    // 8
spacing.md    // 16
spacing.lg    // 24
spacing.xl    // 32
spacing.2xl   // 48
```

### Typography

```typescript
import { typography } from './theme';

typography.heading1  // 32px, bold
typography.heading2  // 24px, bold
typography.body      // 16px, regular
typography.caption   // 12px, regular
```

## Testing

### Unit & Component Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Test Files

Tests are colocated with components:
```
src/
├── components/
│   └── camera/
│       ├── CameraPreview.tsx
│       ├── CameraPreview.test.tsx
│       └── index.ts
├── hooks/
│   ├── useCompass.ts
│   ├── useCompass.test.ts
│   └── index.ts
```

### Example Test

```typescript
// src/hooks/__tests__/useCompass.test.ts
import { renderHook } from '@testing-library/react-native';
import { useCompass } from '../useCompass';

describe('useCompass', () => {
  it('should return heading between 0 and 360', () => {
    const { result } = renderHook(() => useCompass());

    if (result.current.heading !== null) {
      expect(result.current.heading).toBeGreaterThanOrEqual(0);
      expect(result.current.heading).toBeLessThan(360);
    }
  });
});
```

## Troubleshooting

### Installation Issues

**Error: npm install fails**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: Module not found**
```bash
# Reinstall Expo CLI globally
npm install -g expo-cli@latest

# Clear Metro bundler cache
npm start -- --reset-cache
```

### Runtime Issues

**Camera not showing**
- Ensure camera permission is granted
- Check that camera hardware is available
- Restart the app
- Try: `expo start --reset-cache`

**Location not updating**
- Ensure location services enabled on device
- iOS: Settings > Privacy > Location Services > On
- Android: Settings > Location > On
- Try moving to ensure GPS lock
- Accuracy improves after 10-30 seconds

**Compass not responding**
- Compass requires calibration on some devices
- Move phone in figure-8 pattern
- Check that device isn't near strong magnetic fields
- Try: `expo start --reset-cache`

**API connection fails**

Check `.env` configuration:
```bash
# Verify URL is correct
cat .env | grep EXPO_PUBLIC_API_BASE_URL

# Test connection manually
curl http://localhost:3100/health
```

For physical device:
```bash
# Find your local IP
ifconfig | grep inet

# Update .env with correct IP
EXPO_PUBLIC_API_BASE_URL=http://192.168.X.X:3100

# Restart app
npm start
```

**"Cannot find module" errors**

```bash
# Clear all caches
npm start -- --reset-cache

# Restart development server
# Kill with Ctrl+C, then restart
npm start
```

**Slow performance on Android emulator**

```bash
# Restart emulator with GPU enabled
emulator -avd Pixel_5_API_31 -gpu host

# Or use higher-end emulator
emulator -avd Pixel_6_API_31
```

### Debugging

**Enable debug logging**:
```typescript
// Add to app entry point
if (__DEV__) {
  import('./debug').then(({ setupDebugLogging }) => {
    setupDebugLogging();
  });
}
```

**Use React DevTools**:
```bash
# Install React DevTools
npm install -g react-devtools

# Start DevTools
react-devtools

# DevTools will auto-connect to your app
```

**View network requests**:
- Use Android Studio Network Profiler
- Or Charles Proxy / Fiddler for request inspection

## Building for Production

### iOS Build

**Using Expo EAS Build** (Recommended):

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Monitor build
eas build --platform ios --status

# After build completes, submit to App Store
eas submit --platform ios
```

**Manual Build**:
```bash
# Generate standalone iOS app
expo build:ios

# Get build status
expo build:status
```

### Android Build

**Using Expo EAS Build**:

```bash
# Build for Android
eas build --platform android

# Generate APK
eas build --platform android --output ./app.apk
```

**Create Release APK**:
```bash
# Configure signing
eas build:configure

# Build signed APK
eas build --platform android
```

### Submission to App Stores

**App Store (iOS)**:
1. Create Apple Developer account
2. Create app in App Store Connect
3. Submit using EAS: `eas submit --platform ios`

**Google Play (Android)**:
1. Create Google Play Developer account
2. Create app in Google Play Console
3. Submit using EAS: `eas submit --platform android`

### Over-The-Air (OTA) Updates

```bash
# Update app without rebuilding
eas update

# Rollback to previous version
eas update --rollout 0

# View update history
eas update --status
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| expo | ~54.0 | React Native platform |
| react | 19.1.0 | UI framework |
| react-native | 0.81.5 | Native bridge |
| expo-camera | ^14.1 | Camera access |
| expo-location | ^16.5 | GPS location |
| expo-sensors | ^13.0 | Compass/sensors |
| axios | ^1.13 | HTTP client |
| typescript | ~5.9 | Type safety |

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/docs/)
- [Expo Camera API](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Expo Location API](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo Sensors API](https://docs.expo.dev/versions/latest/sdk/sensors/)
- [TypeScript React Native Guide](https://reactnative.dev/docs/typescript)

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Status**: Active Development (MVP)
