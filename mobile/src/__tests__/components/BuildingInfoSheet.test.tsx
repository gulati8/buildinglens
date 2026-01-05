import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { BuildingInfoSheet } from '../../components/building/BuildingInfoSheet';
import type { BuildingCandidate } from '../../types/building.types';

const mockCandidate: BuildingCandidate = {
  id: '1',
  name: 'Empire State Building',
  address: '20 W 34th St, New York, NY 10001',
  distance: 125.5,
  bearing: 45,
  bearingDiff: 10,
  confidence: 0.87,
  source: 'google_places',
  coordinates: {
    latitude: 40.748817,
    longitude: -73.985428,
  },
};

describe('BuildingInfoSheet', () => {
  it('renders loading state correctly', () => {
    render(<BuildingInfoSheet candidate={null} isLoading={true} />);

    expect(screen.getByText('Searching for buildings...')).toBeTruthy();
  });

  it('renders empty state when no candidate', () => {
    render(<BuildingInfoSheet candidate={null} isLoading={false} />);

    expect(screen.getByText('No building found')).toBeTruthy();
    expect(screen.getByText('Point your camera at a building to identify it')).toBeTruthy();
  });

  it('renders building information correctly', () => {
    render(<BuildingInfoSheet candidate={mockCandidate} isLoading={false} />);

    // Check building name
    expect(screen.getByText('Empire State Building')).toBeTruthy();

    // Check address
    expect(screen.getByText('20 W 34th St, New York, NY 10001')).toBeTruthy();

    // Check distance label
    expect(screen.getByText('Distance')).toBeTruthy();

    // Check confidence label
    expect(screen.getByText('Confidence')).toBeTruthy();
  });

  it('formats distance correctly', () => {
    render(<BuildingInfoSheet candidate={mockCandidate} isLoading={false} />);

    // Distance should be formatted as "126m" (rounded)
    expect(screen.getByText('126m')).toBeTruthy();
  });

  it('formats confidence correctly', () => {
    render(<BuildingInfoSheet candidate={mockCandidate} isLoading={false} />);

    // Confidence should be formatted as "87%"
    expect(screen.getByText('87%')).toBeTruthy();
  });

  it('renders with low confidence candidate', () => {
    const lowConfidenceCandidate = {
      ...mockCandidate,
      confidence: 0.45,
    };

    render(<BuildingInfoSheet candidate={lowConfidenceCandidate} isLoading={false} />);

    expect(screen.getByText('45%')).toBeTruthy();
  });

  it('renders with far distance candidate', () => {
    const farCandidate = {
      ...mockCandidate,
      distance: 2500, // 2.5km
    };

    render(<BuildingInfoSheet candidate={farCandidate} isLoading={false} />);

    // Should format as km
    expect(screen.getByText('2.5km')).toBeTruthy();
  });
});
