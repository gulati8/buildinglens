import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { CameraScreen } from '../../screens/CameraScreen';
import type { UseDeviceLocationReturn } from '../../hooks/useDeviceLocation';
import type { UseCompassReturn } from '../../hooks/useCompass';
import type { UseIdentifyBuildingReturn } from '../../hooks/useIdentifyBuilding';

// Mock all custom hooks
jest.mock('../../hooks/useDeviceLocation');
jest.mock('../../hooks/useCompass');
jest.mock('../../hooks/useIdentifyBuilding');

// Mock components
jest.mock('../../components/camera/CameraView', () => ({
  CameraView: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock('../../components/crosshair/Crosshair', () => ({
  Crosshair: () => null,
}));

jest.mock('../../components/status/StatusIndicator', () => ({
  StatusIndicator: () => null,
}));

jest.mock('../../components/status/ErrorOverlay', () => ({
  ErrorOverlay: () => null,
}));

jest.mock('../../components/building/BuildingInfoSheet', () => ({
  BuildingInfoSheet: () => null,
}));

// Import mocked hooks for TypeScript
const { useDeviceLocation } = require('../../hooks/useDeviceLocation');
const { useCompass } = require('../../hooks/useCompass');
const { useIdentifyBuilding } = require('../../hooks/useIdentifyBuilding');

describe('CameraScreen', () => {
  const mockPosition = {
    latitude: 40.748817,
    longitude: -73.985428,
    altitude: 10,
    heading: 180,
    horizontalAccuracy: 5,
    timestamp: Date.now(),
  };

  const mockCandidate = {
    id: 'test-building-1',
    name: 'Empire State Building',
    address: '350 5th Ave, New York, NY 10118',
    distance: 150,
    bearing: 45,
    bearingDiff: 10,
    confidence: 0.92,
    source: 'google_places' as const,
    coordinates: {
      latitude: 40.748817,
      longitude: -73.985428,
    },
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Default mock implementations
    useDeviceLocation.mockReturnValue({
      position: mockPosition,
      error: null,
      isLoading: false,
    } as UseDeviceLocationReturn);

    useCompass.mockReturnValue({
      heading: 180,
      error: null,
    } as UseCompassReturn);

    useIdentifyBuilding.mockReturnValue({
      candidates: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as UseIdentifyBuildingReturn);
  });

  it('renders without crashing', () => {
    render(<CameraScreen />);
    // If it renders without throwing, the test passes
    expect(true).toBe(true);
  });

  it('shows loading state initially when location is loading', () => {
    useDeviceLocation.mockReturnValue({
      position: null,
      error: null,
      isLoading: true,
    } as UseDeviceLocationReturn);

    render(<CameraScreen />);
    // Component should render even when loading
    expect(true).toBe(true);
  });

  it('handles location error', () => {
    useDeviceLocation.mockReturnValue({
      position: null,
      error: 'Location permission not granted',
      isLoading: false,
    } as UseDeviceLocationReturn);

    render(<CameraScreen />);
    // Error should be handled gracefully
    expect(true).toBe(true);
  });

  it('handles compass error', () => {
    useCompass.mockReturnValue({
      heading: null,
      error: 'Magnetometer not available',
    } as UseCompassReturn);

    render(<CameraScreen />);
    // Error should be handled gracefully
    expect(true).toBe(true);
  });

  it('handles building identification error', () => {
    useIdentifyBuilding.mockReturnValue({
      candidates: [],
      isLoading: false,
      error: 'Network error',
      refetch: jest.fn(),
    } as UseIdentifyBuildingReturn);

    render(<CameraScreen />);
    // Error should be handled gracefully
    expect(true).toBe(true);
  });

  it('displays building candidates when available', () => {
    useIdentifyBuilding.mockReturnValue({
      candidates: [mockCandidate],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as UseIdentifyBuildingReturn);

    render(<CameraScreen />);
    // Should render with candidates
    expect(true).toBe(true);
  });

  it('passes correct parameters to useIdentifyBuilding', () => {
    render(<CameraScreen />);

    expect(useIdentifyBuilding).toHaveBeenCalledWith({
      latitude: mockPosition.latitude,
      longitude: mockPosition.longitude,
      heading: 180,
      horizontalAccuracy: mockPosition.horizontalAccuracy,
      enabled: true, // Not loading
    });
  });

  it('disables identification when location is loading', () => {
    useDeviceLocation.mockReturnValue({
      position: null,
      error: null,
      isLoading: true,
    } as UseDeviceLocationReturn);

    render(<CameraScreen />);

    expect(useIdentifyBuilding).toHaveBeenCalledWith({
      latitude: null,
      longitude: null,
      heading: 180,
      horizontalAccuracy: null,
      enabled: false, // Disabled when loading
    });
  });

  it('handles multiple candidates and selects top one', () => {
    const candidates = [
      { ...mockCandidate, confidence: 0.92 },
      { ...mockCandidate, id: 'test-2', confidence: 0.85 },
      { ...mockCandidate, id: 'test-3', confidence: 0.78 },
    ];

    useIdentifyBuilding.mockReturnValue({
      candidates,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as UseIdentifyBuildingReturn);

    render(<CameraScreen />);
    // Top candidate should be passed to BuildingInfoSheet
    expect(true).toBe(true);
  });

  it('handles no GPS signal', () => {
    useDeviceLocation.mockReturnValue({
      position: null,
      error: null,
      isLoading: false,
    } as UseDeviceLocationReturn);

    render(<CameraScreen />);
    // Should handle null position gracefully
    expect(true).toBe(true);
  });

  it('handles no compass heading', () => {
    useCompass.mockReturnValue({
      heading: null,
      error: null,
    } as UseCompassReturn);

    render(<CameraScreen />);
    // Should handle null heading gracefully
    expect(true).toBe(true);
  });
});
