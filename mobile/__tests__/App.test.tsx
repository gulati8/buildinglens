import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<App />);
    expect(getByText('BuildingLens')).toBeTruthy();
  });

  it('displays the correct subtitle', () => {
    const { getByText } = render(<App />);
    expect(getByText('Mobile Foundation Ready')).toBeTruthy();
  });
});
