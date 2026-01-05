import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatusIndicator } from '../../components/status/StatusIndicator';
import type { DevicePosition } from '../../types/device.types';

const mockPosition: DevicePosition = {
  latitude: 40.748817,
  longitude: -73.985428,
  altitude: 10,
  heading: 180,
  horizontalAccuracy: 5,
  timestamp: Date.now(),
};

describe('StatusIndicator', () => {
  it('renders with good GPS accuracy', () => {
    render(<StatusIndicator position={mockPosition} heading={180} />);

    expect(screen.getByText('GPS: 5m')).toBeTruthy();
  });

  it('renders with compass heading', () => {
    render(<StatusIndicator position={mockPosition} heading={180} />);

    expect(screen.getByText('180°')).toBeTruthy();
  });

  it('shows no GPS when position is null', () => {
    render(<StatusIndicator position={null} heading={180} />);

    expect(screen.getByText('No GPS')).toBeTruthy();
  });

  it('shows no compass when heading is null', () => {
    render(<StatusIndicator position={mockPosition} heading={null} />);

    expect(screen.getByText('No Compass')).toBeTruthy();
  });

  it('renders with poor GPS accuracy', () => {
    const poorPosition = {
      ...mockPosition,
      horizontalAccuracy: 100,
    };

    render(<StatusIndicator position={poorPosition} heading={180} />);

    expect(screen.getByText('GPS: 100m')).toBeTruthy();
  });

  it('renders with medium GPS accuracy', () => {
    const mediumPosition = {
      ...mockPosition,
      horizontalAccuracy: 12,
    };

    render(<StatusIndicator position={mediumPosition} heading={180} />);

    expect(screen.getByText('GPS: 12m')).toBeTruthy();
  });

  it('renders with zero heading (North)', () => {
    render(<StatusIndicator position={mockPosition} heading={0} />);

    expect(screen.getByText('0°')).toBeTruthy();
  });

  it('renders with 359 heading (almost North)', () => {
    render(<StatusIndicator position={mockPosition} heading={359} />);

    expect(screen.getByText('359°')).toBeTruthy();
  });

  it('handles null position and heading together', () => {
    render(<StatusIndicator position={null} heading={null} />);

    expect(screen.getByText('No GPS')).toBeTruthy();
    expect(screen.getByText('No Compass')).toBeTruthy();
  });
});
