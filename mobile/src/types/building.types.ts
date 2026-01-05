export interface BuildingCandidate {
  id: string;
  name: string;
  address: string;
  distance: number;
  bearing: number;
  bearingDiff: number;
  confidence: number;
  source: 'google_places' | 'google_geocoding' | 'nominatim' | 'cache';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  metadata?: {
    placeId?: string;
    rating?: number;
    userRatingsTotal?: number;
    types?: string[];
  };
}
