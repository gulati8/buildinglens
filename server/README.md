# BuildingLens Backend API

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18-black.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D.svg)](https://redis.io/)

RESTful API server for building identification using GPS coordinates, heading, and camera input. Built with Node.js, Express, TypeScript, PostgreSQL + PostGIS, and Redis caching.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [API Endpoints](#api-endpoints)
- [Request/Response Examples](#requestresponse-examples)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Database Schema](#database-schema)
- [Service Architecture](#service-architecture)
- [Running Tests](#running-tests)
- [Docker Deployment](#docker-deployment)
- [Troubleshooting](#troubleshooting)

## Features

- Building identification based on GPS coordinates and device heading
- Multi-source geocoding (Google Maps, Nominatim/OpenStreetMap)
- Intelligent result scoring (proximity and direction relevance)
- Redis-based caching (30-day geocoding, 7-day places, 1-hour results)
- Request validation with Zod schemas
- Rate limiting with Redis backend
- Comprehensive error handling
- Health check endpoint with service status
- Docker containerization with multi-stage builds
- TypeScript for full type safety
- Structured logging with Winston
- Security middleware (Helmet, CORS)

## Prerequisites

- **Node.js 20.0.0+** ([Download](https://nodejs.org/))
- **npm 10.0.0+** (included with Node.js)
- **PostgreSQL 16** with PostGIS 3.4 extension ([Docker setup recommended](#running-with-docker))
- **Redis 7** ([Docker setup recommended](#running-with-docker))
- **Google Maps API Key** ([Get one](https://developers.google.com/maps/documentation/javascript/get-api-key))

## Installation

1. **Install dependencies**
   ```bash
   cd /Users/amitgulati/Projects/JPD/buildinglens/server
   npm install
   ```

2. **Copy environment template**
   ```bash
   cp ../.env.example ../.env
   ```

3. **Configure environment variables**
   Edit `../.env` with your settings:
   ```bash
   # Application
   NODE_ENV=development
   PORT=3100
   HOST=0.0.0.0

   # Database
   DATABASE_URL=postgresql://buildinglens_user:buildinglens_pass@localhost:5434/buildinglens

   # Redis
   REDIS_URL=redis://localhost:6380

   # External APIs
   GOOGLE_MAPS_API_KEY=your_api_key_here
   NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
   NOMINATIM_EMAIL=your_email@example.com

   # Other settings...
   ```

## Running Locally

### With Docker Compose (Recommended)

Start all services (PostgreSQL, Redis, Backend):

```bash
# Start services in background
cd /Users/amitgulati/Projects/JPD/buildinglens
docker-compose up -d

# View logs
docker-compose logs -f backend

# Monitor specific service
docker-compose logs -f postgres

# Stop services
docker-compose down
```

The API will be available at **http://localhost:3100**

### Without Docker (Manual Setup)

Ensure PostgreSQL 16 + PostGIS, Redis 7, and other dependencies are running on your system:

```bash
cd /Users/amitgulati/Projects/JPD/buildinglens/server

# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# In another terminal, run TypeScript compiler in watch mode
npm run build -- --watch
```

The API will be available at **http://localhost:3100**

### Health Check

Verify the API is running:

```bash
curl http://localhost:3100/health
```

Expected response (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2026-01-05T10:30:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "externalAPIs": "healthy"
  }
}
```

## API Endpoints

### Overview

| Method | Endpoint | Description | Rate Limited |
|--------|----------|-------------|--------------|
| GET | `/` | API metadata | No |
| GET | `/health` | Health check | No |
| POST | `/api/identify` | Identify building | Yes |

### GET /

Root endpoint returns API information.

**Request**
```bash
curl http://localhost:3100/
```

**Response** (200 OK)
```json
{
  "name": "BuildingLens API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "health": "/health",
    "api": "/api"
  }
}
```

### GET /health

Health check endpoint returns status of all services (database, Redis, external APIs).

**Request**
```bash
curl http://localhost:3100/health
```

**Response** (200 Healthy)
```json
{
  "status": "healthy",
  "timestamp": "2026-01-05T10:30:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "externalAPIs": "healthy"
  }
}
```

**Response** (503 Degraded)
```json
{
  "status": "degraded",
  "timestamp": "2026-01-05T10:30:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "unhealthy",
    "externalAPIs": "degraded"
  }
}
```

### POST /api/identify

Identify buildings based on GPS coordinates and device heading.

**Request Schema**

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `latitude` | number | Yes | -90 to 90 | GPS latitude coordinate |
| `longitude` | number | Yes | -180 to 180 | GPS longitude coordinate |
| `heading` | number | No | 0 to 360 | Device heading in degrees (0 = North) |
| `searchRadius` | number | No | > 0 | Search radius in meters (default: 100) |

**Request Example**

```bash
curl -X POST http://localhost:3100/api/identify \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "heading": 45,
    "searchRadius": 100
  }'
```

**Response** (200 OK)
```json
{
  "candidates": [
    {
      "id": "place_1",
      "name": "Salesforce Tower",
      "address": "415 Mission St, San Francisco, CA 94105, USA",
      "coordinates": {
        "latitude": 37.7897,
        "longitude": -122.3988
      },
      "distance": 1823,
      "bearing": 42,
      "confidence": 0.95,
      "source": "google",
      "metadata": {
        "placeId": "ChIJIQBpAG2ahYAR_6128GltTXQ",
        "rating": 4.6,
        "reviews": 1240
      }
    },
    {
      "id": "place_2",
      "name": "Transamerica Pyramid",
      "address": "600 Montgomery St, San Francisco, CA 94111, USA",
      "coordinates": {
        "latitude": 37.7952,
        "longitude": -122.4028
      },
      "distance": 2456,
      "bearing": 35,
      "confidence": 0.87,
      "source": "google",
      "metadata": {
        "placeId": "ChIJ3V-wvxGAhYAR4SEVVt-U1Zo",
        "rating": 4.7,
        "reviews": 2100
      }
    }
  ],
  "query": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "heading": 45,
    "searchRadius": 100
  },
  "metadata": {
    "searchCenter": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "timestamp": "2026-01-05T10:30:00.000Z",
    "resultCount": 2
  }
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `candidates` | array | Array of building candidates sorted by confidence |
| `candidates[].id` | string | Unique identifier (external API ID) |
| `candidates[].name` | string | Building/place name |
| `candidates[].address` | string | Full street address |
| `candidates[].coordinates` | object | GPS coordinates |
| `candidates[].distance` | number | Distance from search center in meters |
| `candidates[].bearing` | number | Bearing from user to building (0-360 degrees) |
| `candidates[].confidence` | number | Confidence score (0-1) based on distance and heading relevance |
| `candidates[].source` | string | Data source (google, nominatim, etc.) |
| `candidates[].metadata` | object | Additional data from source API |
| `query` | object | Echo of search parameters |
| `metadata.searchCenter` | object | Center of search area |
| `metadata.timestamp` | string | ISO 8601 timestamp |
| `metadata.resultCount` | number | Number of candidates returned |

## Request/Response Examples

### Example 1: San Francisco Downtown

```bash
curl -X POST http://localhost:3100/api/identify \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "heading": 90,
    "searchRadius": 200
  }'
```

### Example 2: New York Times Square

```bash
curl -X POST http://localhost:3100/api/identify \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.758,
    "longitude": -73.9855,
    "searchRadius": 150
  }'
```

### Example 3: London Big Ben

```bash
curl -X POST http://localhost:3100/api/identify \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 51.4975,
    "longitude": -0.1243,
    "heading": 180
  }'
```

## Error Handling

### Error Response Format

All error responses follow a consistent format:

```json
{
  "error": {
    "message": "Description of what went wrong",
    "code": "ERROR_CODE",
    "details": "Additional context if available",
    "stack": "Stack trace in development mode only"
  }
}
```

### Common Error Codes

| Status | Code | Description | Cause |
|--------|------|-------------|-------|
| 400 | `VALIDATION_ERROR` | Request validation failed | Invalid coordinates, missing required fields |
| 400 | `INVALID_COORDINATES` | GPS coordinates out of range | Latitude not -90 to 90, longitude not -180 to 180 |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate limit exceeded | More than 10 requests per minute |
| 500 | `DATABASE_ERROR` | Database connection failed | PostgreSQL unavailable |
| 500 | `CACHE_ERROR` | Cache service failed | Redis unavailable |
| 500 | `EXTERNAL_API_ERROR` | External API call failed | Google Maps or Nominatim unavailable |
| 500 | `IDENTIFICATION_ERROR` | Identification failed | Unexpected error during processing |
| 503 | `SERVICE_UNAVAILABLE` | Service degraded | Multiple service failures |

### Example Error Responses

**Invalid Coordinates** (400)
```json
{
  "error": {
    "message": "Latitude must be between -90 and 90",
    "code": "VALIDATION_ERROR",
    "details": "latitude: Number must be less than or equal to 90"
  }
}
```

**Rate Limited** (429)
```json
{
  "error": {
    "message": "Too many requests, please retry after 60 seconds",
    "code": "RATE_LIMIT_EXCEEDED",
    "details": "10 requests per 60000 milliseconds"
  }
}
```

**Service Error** (500)
```json
{
  "error": {
    "message": "Failed to identify building",
    "code": "EXTERNAL_API_ERROR",
    "details": "Google Maps API returned 503 Service Unavailable"
  }
}
```

## Rate Limiting

Rate limiting is implemented to prevent abuse and ensure fair API access.

### Configuration

- **Window**: 60 seconds
- **Max Requests**: 10 requests per window per IP address
- **Storage**: Redis (distributed rate limiting)
- **Header**: `X-RateLimit-*` headers included in responses

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1641375600
```

### Behavior

- Request 1-10: Accepted (200 OK)
- Request 11+: Rejected with 429 Too Many Requests
- After 60 seconds: Counter resets

### Increasing Limits

Edit `.env`:
```bash
RATE_LIMIT_WINDOW_MS=60000        # Time window in ms
RATE_LIMIT_MAX_REQUESTS=10        # Requests per window
```

Then restart the server. For API-key based rate limiting, extend the middleware in `src/middleware/rate-limiter.ts`.

## Database Schema

### cached_buildings

Primary table for storing cached building data from external APIs.

```sql
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
```

### Schema Details

| Column | Type | Nullable | Index | Description |
|--------|------|----------|-------|-------------|
| `id` | UUID | No | Primary | Unique identifier |
| `external_id` | VARCHAR(255) | Yes | Yes | ID from source API |
| `source` | VARCHAR(50) | No | Yes | Data source (google, nominatim) |
| `name` | VARCHAR(500) | Yes | No | Building/place name |
| `address` | TEXT | Yes | No | Full street address |
| `location` | GEOGRAPHY(POINT, 4326) | No | GIST | GPS coordinates (WGS84) |
| `metadata` | JSONB | Yes | No | Additional API data |
| `created_at` | TIMESTAMP | No | No | Record creation time |
| `updated_at` | TIMESTAMP | No | No | Last update time |
| `expires_at` | TIMESTAMP | Yes | Yes | Cache expiration time |

### Indexes

```sql
-- Spatial index for location-based queries
CREATE INDEX idx_cached_buildings_location ON cached_buildings
  USING GIST(location);

-- Fast lookups by external ID
CREATE INDEX idx_cached_buildings_external_id ON cached_buildings
  (external_id);

-- Filter by source API
CREATE INDEX idx_cached_buildings_source ON cached_buildings
  (source);

-- Cache cleanup operations
CREATE INDEX idx_cached_buildings_expires_at ON cached_buildings
  (expires_at);
```

## Service Architecture

The backend is organized into service layers for separation of concerns and reusability.

### Request Flow

```
HTTP Request
    ↓
[Express Middleware]
  - Security (Helmet)
  - CORS
  - Body parsing
  - Request logging
    ↓
[Rate Limiting Middleware]
  - Check Redis for request count
  - Add rate limit headers
    ↓
[Routes] (/api/identify)
    ↓
[Controller]
  - Parse and validate request
  - Call service layer
  - Format response
    ↓
[Services]
  - Cache: Check Redis cache
  - Geocoding: Reverse geocode to address
  - Places: Query building data
  - Scoring: Calculate confidence scores
  - Bearing: Calculate direction angles
  - Database: Store/retrieve cached data
    ↓
[Error Handler Middleware]
  - Catch and format errors
  - Log errors
    ↓
HTTP Response
```

### Services

| Service | File | Purpose |
|---------|------|---------|
| **Identify** | `services/identify.service.ts` | Main orchestration service |
| **Geocoding** | `services/geocoding.service.ts` | Convert coordinates ↔ addresses |
| **Places** | `services/places.service.ts` | Retrieve building data from APIs |
| **Scoring** | `services/scoring.service.ts` | Calculate relevance scores |
| **Bearing** | `services/bearing.service.ts` | Calculate direction and distance |
| **Cache** | `services/cache.service.ts` | Manage Redis caching |
| **Database** | `services/database.service.ts` | PostgreSQL operations |

### Scoring Algorithm

Confidence scores (0-1) are calculated based on:
- **Proximity Score** (0-0.7): Closer buildings = higher score
  - Formula: `1 - (distance / maxDistance)`
  - Max distance: 500 meters
- **Direction Score** (0-0.3): Buildings in heading direction = higher score
  - Formula: `1 - (angleDifference / 180)`
  - Only applied if user heading provided
- **Total**: `proximityScore * 0.7 + directionScore * 0.3`

## Running Tests

### Test Setup

Tests use Jest with Supertest for API endpoint testing.

```bash
cd /Users/amitgulati/Projects/JPD/buildinglens/server

# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm test:watch

# Run tests with coverage report
npm test:coverage

# Run specific test file
npm test -- bearing.service.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="scoring"
```

### Test Files

Tests are located in `src/__tests__` subdirectories:

| File | Coverage |
|------|----------|
| `services/__tests__/bearing.service.test.ts` | Bearing calculations and distance |
| `services/__tests__/scoring.service.test.ts` | Confidence scoring algorithm |
| `controllers/__tests__/identify.controller.test.ts` | API endpoint validation |

## Docker Deployment

### Building the Docker Image

```bash
cd /Users/amitgulati/Projects/JPD/buildinglens/server

# Build development image
docker build --target development -t buildinglens-backend:dev .

# Build production image
docker build --target production -t buildinglens-backend:prod .
```

### Dockerfile Stages

The Dockerfile uses multi-stage builds:

1. **base**: Common setup with Node.js and dumb-init
2. **dependencies**: Install all npm packages
3. **build**: Compile TypeScript to JavaScript
4. **production**: Final optimized image with only production dependencies
5. **development**: Development image with hot reload via nodemon

### Docker Compose

Use the project root `docker-compose.yml`:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Remove all data (WARNING: loses database)
docker-compose down -v
```

## Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint code with ESLint |

## Project Structure

```
server/
├── src/
│   ├── index.ts                 # Server entry point
│   ├── app.ts                   # Express app configuration
│   ├── config/                  # Configuration files
│   │   ├── env.ts               # Environment variables
│   │   ├── database.ts          # PostgreSQL connection
│   │   ├── redis.ts             # Redis connection
│   │   └── cors.ts              # CORS configuration
│   ├── controllers/             # HTTP request handlers
│   │   ├── health.controller.ts
│   │   └── identify.controller.ts
│   ├── routes/                  # API route definitions
│   │   ├── index.ts
│   │   ├── health.routes.ts
│   │   └── identify.routes.ts
│   ├── services/                # Business logic
│   │   ├── identify.service.ts
│   │   ├── geocoding.service.ts
│   │   ├── places.service.ts
│   │   ├── scoring.service.ts
│   │   ├── bearing.service.ts
│   │   ├── cache.service.ts
│   │   ├── database.service.ts
│   │   └── __tests__/           # Service tests
│   ├── middleware/              # Express middleware
│   │   ├── request-validator.ts # Zod validation
│   │   ├── error-handler.ts     # Error handling
│   │   └── rate-limiter.ts      # Rate limiting
│   ├── types/                   # TypeScript type definitions
│   │   ├── api.types.ts         # API request/response types
│   │   └── services.types.ts    # Service type definitions
│   └── utils/
│       └── logger.ts            # Winston logging
├── database/
│   └── migrations/              # SQL migration files
│       ├── 001_create_extensions.sql
│       └── 002_create_buildings.sql
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Test configuration
├── nodemon.json                 # Nodemon configuration
├── Dockerfile                   # Multi-stage Docker image
└── README.md                    # This file
```

## Environment Variables Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | string | development | Environment (development, production, test) |
| `PORT` | number | 3000 | HTTP server port |
| `HOST` | string | 0.0.0.0 | Listen address |
| `DATABASE_URL` | string | - | PostgreSQL connection string (required) |
| `REDIS_URL` | string | - | Redis connection string (required) |
| `REDIS_TTL_GEOCODING` | number | 2592000 | Geocoding cache TTL (seconds, 30 days) |
| `REDIS_TTL_PLACES` | number | 604800 | Places data cache TTL (seconds, 7 days) |
| `REDIS_TTL_IDENTIFY` | number | 3600 | Identification results cache TTL (seconds, 1 hour) |
| `GOOGLE_MAPS_API_KEY` | string | - | Google Maps API key (required) |
| `NOMINATIM_BASE_URL` | string | https://nominatim.openstreetmap.org | Nominatim API base URL |
| `NOMINATIM_EMAIL` | string | - | Email for Nominatim API (required) |
| `SEARCH_RADIUS_METERS` | number | 100 | Default search radius in meters |
| `RATE_LIMIT_WINDOW_MS` | number | 60000 | Rate limit time window (milliseconds) |
| `RATE_LIMIT_MAX_REQUESTS` | number | 10 | Max requests per window |
| `LOG_LEVEL` | string | debug | Logging level (debug, info, warn, error) |
| `CORS_ORIGIN` | string | * | CORS allowed origins |

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Connect manually to verify
docker exec -it buildinglens-postgres psql -U buildinglens_user -d buildinglens
```

### Redis Connection Issues

```bash
# Check Redis status
docker exec buildinglens-redis redis-cli ping
# Expected: PONG

# Restart Redis
docker-compose restart redis
```

### Port Already in Use

```bash
# Find process using port 3100
lsof -i :3100

# Kill process (replace PID)
kill -9 <PID>
```

### Invalid API Key

```bash
# Verify key in .env
cat .env | grep GOOGLE_MAPS_API_KEY

# Check API is enabled in GCP console
# https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
```

## Additional Resources

- [Express Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL + PostGIS](https://postgis.net/documentation/)
- [Redis Documentation](https://redis.io/documentation)
- [Jest Testing Framework](https://jestjs.io/)
- [Zod Schema Validation](https://zod.dev/)
- [Google Maps API](https://developers.google.com/maps/documentation)
- [Nominatim API](https://nominatim.org/release-docs/latest/api/)

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Status**: Active Development (MVP)
