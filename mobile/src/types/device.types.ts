export interface DevicePosition {
  latitude: number;
  longitude: number;
  altitude: number | null;
  heading: number;
  horizontalAccuracy: number;
  timestamp: number;
}
