import type { BuildingCandidate } from './building.types';

export interface IdentifyRequest {
  latitude: number;
  longitude: number;
  heading: number;
  horizontalAccuracy: number;
  altitude?: number;
}

export interface IdentifyResponse {
  success: true;
  data: {
    bestMatch: BuildingCandidate | null;
    candidates: BuildingCandidate[];
    searchRadius: number;
    timestamp: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
