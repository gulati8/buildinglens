-- Create cached_buildings table for storing building data from external APIs
CREATE TABLE cached_buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255),
  source VARCHAR(50) NOT NULL,
  name VARCHAR(500),
  address TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Create spatial index for efficient location-based queries
CREATE INDEX idx_cached_buildings_location ON cached_buildings USING GIST(location);

-- Create index on external_id for faster lookups
CREATE INDEX idx_cached_buildings_external_id ON cached_buildings(external_id);

-- Create index on source for filtering by API source
CREATE INDEX idx_cached_buildings_source ON cached_buildings(source);

-- Create index on expires_at for cache cleanup operations
CREATE INDEX idx_cached_buildings_expires_at ON cached_buildings(expires_at);

-- Add comment to table
COMMENT ON TABLE cached_buildings IS 'Cached building data from Google Maps, Nominatim, and other geolocation APIs';
COMMENT ON COLUMN cached_buildings.location IS 'Geographic point stored as WGS84 (SRID 4326) for compatibility with GPS coordinates';
COMMENT ON COLUMN cached_buildings.metadata IS 'Additional data from the source API stored as JSON (place details, ratings, photos, etc.)';
