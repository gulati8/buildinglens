# BuildingLens MVP

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

A GPS-based building identification application that uses device location, compass heading, and camera input to identify nearby buildings in real-time.

## Overview

BuildingLens is a mobile-first MVP that helps users identify buildings around them using:

- **GPS Location**: Precise coordinates of the user's position
- **Digital Compass**: Device heading direction for heading-based filtering
- **Camera Integration**: Visual context capture (extensible for future computer vision)
- **Real-time API**: Fast building identification with intelligent caching

The application features a React Native mobile frontend with an Expo-based iOS/Android experience, backed by a Node.js/TypeScript REST API with PostgreSQL + PostGIS database support.

## Key Features

- Real-time building identification based on GPS coordinates and heading
- Intelligent result scoring (proximity, direction relevance)
- Multi-source geocoding (Google Maps API + Nominatim/OpenStreetMap)
- Redis-based caching for performance optimization
- Rate limiting and request validation
- Comprehensive error handling and health monitoring
- Docker-based containerized deployment
- TypeScript throughout for type safety
- Cross-platform mobile support (iOS/Android)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Application                      │
│                   (React Native + Expo)                     │
│                                                             │
│  ┌────────────┐  ┌──────────┐  ┌────────────┐             │
│  │  Camera    │  │ Location │  │  Compass   │             │
│  │  Component │  │   Hook   │  │   Sensor   │             │
│  └──────┬─────┘  └─────┬────┘  └──────┬─────┘             │
│         │              │              │                   │
│         └──────────────┴──────────────┘                   │
│                      │                                    │
│              IdentifyBuilding Hook                        │
│                      │                                    │
└──────────────────────┼────────────────────────────────────┘
                       │ HTTP Request
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    REST API (Express)                       │
│           (Node.js 20 + TypeScript + Port 3100)            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              /api/identify Endpoint                  │  │
│  │  ┌────────────┐  ┌───────────┐  ┌──────────────┐   │  │
│  │  │ Validation │→ │ Caching   │→ │ Scoring      │   │  │
│  │  │ (Zod)      │  │ (Redis)   │  │ Service      │   │  │
│  │  └────────────┘  └───────────┘  └──────┬───────┘   │  │
│  │                                         │           │  │
│  │  ┌────────────────────────────────────┘            │  │
│  │  ▼                                                  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Geocoding & Places Services                │  │  │
│  │  │  - Google Maps Places API                   │  │  │
│  │  │  - Nominatim (OpenStreetMap)               │  │  │
│  │  │  - Bearing & Proximity Calculations        │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     Middleware: Rate Limiting, Error Handling        │  │
│  └──────────────────────────────────────────────────────┘  │
└──────┬──────────────────────┬──────────────────────┬────────┘
       │                      │                      │
       ▼                      ▼                      ▼
   PostgreSQL            Redis Cache          External APIs
   (Port 5434)          (Port 6380)        (Google Maps, etc.)
   + PostGIS
```

## Tech Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript 5.3
- **Framework**: Express 4.18
- **Database**: PostgreSQL 16 + PostGIS 3.4
- **Cache**: Redis 7
- **API Client**: Axios
- **Validation**: Zod
- **Logging**: Winston
- **Security**: Helmet, CORS
- **Rate Limiting**: express-rate-limit + rate-limit-redis
- **Testing**: Jest + Supertest

### Mobile
- **Platform**: React Native 0.81.5
- **Framework**: Expo ~54.0.30
- **Language**: TypeScript ~5.9
- **HTTP Client**: Axios
- **Sensors**: expo-location, expo-sensors, expo-camera
- **UI Components**: React Native built-ins + custom components
- **Testing**: Jest + React Native Testing Library

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Cloud Ready**: AWS/Kubernetes compatible
- **Development**: Nodemon + ts-node

## Quick Start

### Prerequisites

- **Node.js 20+** ([Download](https://nodejs.org/))
- **npm 10+** (included with Node.js)
- **Docker & Docker Compose** ([Download](https://www.docker.com/))
- **Expo CLI** (for mobile development): `npm install -g expo-cli`
- **Google Maps API Key** ([Get one](https://developers.google.com/maps/documentation/javascript/get-api-key))

### Backend Setup (Local Development)

1. **Clone and install dependencies**
   ```bash
   cd /Users/amitgulati/Projects/JPD/buildinglens/server
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Google Maps API key and other settings
   ```

3. **Start services with Docker Compose**
   ```bash
   cd /Users/amitgulati/Projects/JPD/buildinglens
   docker-compose up -d
   ```

4. **Run migrations and start server**
   ```bash
   cd server
   npm run dev
   ```

The API will be available at `http://localhost:3100`

### Mobile Setup (Local Development)

1. **Install dependencies**
   ```bash
   cd /Users/amitgulati/Projects/JPD/buildinglens/mobile
   npm install
   ```

2. **Start Expo development server**
   ```bash
   npm start
   ```

3. **Run on simulator/emulator**
   ```bash
   # iOS (macOS only)
   npm run ios

   # Android
   npm run android

   # Web (for testing, camera disabled)
   npm run web
   ```

### Testing the API

```bash
# Health check
curl http://localhost:3100/health

# Identify building at specific coordinates
curl -X POST http://localhost:3100/api/identify \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "heading": 45,
    "searchRadius": 100
  }'
```

For more details, see [Backend API Documentation](./server/README.md).

## Project Structure

```
buildinglens/
├── server/                              # Node.js/Express Backend
│   ├── src/
│   │   ├── index.ts                     # Application entry point
│   │   ├── app.ts                       # Express app configuration
│   │   ├── config/                      # Configuration files
│   │   │   ├── env.ts                   # Environment variables
│   │   │   ├── database.ts              # PostgreSQL connection
│   │   │   ├── redis.ts                 # Redis connection
│   │   │   └── cors.ts                  # CORS configuration
│   │   ├── controllers/                 # HTTP request handlers
│   │   │   ├── health.controller.ts
│   │   │   └── identify.controller.ts
│   │   ├── routes/                      # Route definitions
│   │   │   ├── index.ts
│   │   │   ├── health.routes.ts
│   │   │   └── identify.routes.ts
│   │   ├── services/                    # Business logic
│   │   │   ├── identify.service.ts      # Main identification logic
│   │   │   ├── geocoding.service.ts     # Address ↔ Coordinates
│   │   │   ├── places.service.ts        # Building data retrieval
│   │   │   ├── scoring.service.ts       # Relevance scoring
│   │   │   ├── bearing.service.ts       # Direction calculations
│   │   │   ├── cache.service.ts         # Redis caching
│   │   │   ├── database.service.ts      # Database operations
│   │   │   └── __tests__/               # Service tests
│   │   ├── middleware/                  # Express middleware
│   │   │   ├── request-validator.ts     # Zod validation
│   │   │   ├── error-handler.ts         # Error handling
│   │   │   └── rate-limiter.ts          # Rate limiting
│   │   ├── types/                       # TypeScript type definitions
│   │   │   ├── api.types.ts             # API request/response types
│   │   │   └── services.types.ts        # Service type definitions
│   │   └── utils/
│   │       └── logger.ts                # Winston logging
│   ├── database/
│   │   └── migrations/                  # SQL migration files
│   │       ├── 001_create_extensions.sql
│   │       └── 002_create_buildings.sql
│   ├── package.json                     # Dependencies
│   ├── tsconfig.json                    # TypeScript configuration
│   ├── jest.config.js                   # Test configuration
│   ├── Dockerfile                       # Multi-stage Docker image
│   └── README.md                        # Backend documentation
│
├── mobile/                              # React Native Mobile App
│   ├── src/
│   │   ├── index.ts                     # App entry point
│   │   ├── screens/                     # Screen components
│   │   │   ├── PermissionsScreen.tsx    # Permission requests
│   │   │   └── CameraScreen.tsx         # Main camera interface
│   │   ├── components/
│   │   │   ├── camera/                  # Camera preview component
│   │   │   ├── building/                # Building result display
│   │   │   ├── status/                  # Status indicators
│   │   │   ├── crosshair/               # Camera crosshair overlay
│   │   │   └── ui/                      # Reusable UI components
│   │   ├── hooks/                       # Custom React hooks
│   │   │   ├── usePermissions.ts        # Permission handling
│   │   │   ├── useDeviceLocation.ts     # GPS tracking
│   │   │   ├── useCompass.ts            # Compass sensor
│   │   │   └── useIdentifyBuilding.ts   # Building identification
│   │   ├── services/
│   │   │   └── api.ts                   # HTTP API client
│   │   ├── types/                       # TypeScript types
│   │   │   ├── api.types.ts
│   │   │   ├── building.types.ts
│   │   │   └── device.types.ts
│   │   ├── utils/
│   │   │   ├── constants.ts             # App configuration
│   │   │   ├── formatting.ts            # Text/number formatting
│   │   │   └── geo.ts                   # Geo calculations
│   │   └── theme/                       # Design system
│   │       ├── colors.ts
│   │       ├── spacing.ts
│   │       ├── typography.ts
│   │       └── index.ts
│   ├── app.json                         # Expo configuration
│   ├── package.json                     # Dependencies
│   ├── tsconfig.json                    # TypeScript configuration
│   ├── jest.config.js                   # Test configuration
│   └── README.md                        # Mobile documentation
│
├── docs/                                # Project documentation
│   ├── DEVELOPMENT.md                   # Development guide
│   └── DEPLOYMENT.md                    # Deployment guide
│
├── docker-compose.yml                   # Local development services
├── .env.example                         # Environment variable template
└── README.md                            # This file
```

## Development Workflow

### 1. Start Development Environment

```bash
# Start all services (PostgreSQL, Redis, Backend)
docker-compose up -d

# Watch the logs
docker-compose logs -f backend
```

### 2. Backend Development

```bash
cd server

# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Check code coverage
npm test:coverage

# Lint code
npm run lint
```

### 3. Mobile Development

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on simulators
npm run ios    # macOS/iOS
npm run android # Android

# Run tests
npm test
```

### 4. Database Management

```bash
# View database
docker exec -it buildinglens-postgres psql -U buildinglens_user -d buildinglens

# View Redis
docker exec -it buildinglens-redis redis-cli

# Restart database (WARNING: loses data)
docker-compose down -v
docker-compose up -d postgres
```

## Testing

### Backend Tests

```bash
cd server

# Run all tests
npm test

# Run specific test file
npm test -- health.controller.test.ts

# Run with coverage
npm test:coverage

# Watch mode for development
npm test:watch
```

Tests cover:
- Service business logic
- API endpoint validation
- Error handling
- Scoring algorithms
- Bearing calculations

### Mobile Tests

```bash
cd mobile

# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## API Endpoints

### Health Check
- **Endpoint**: `GET /health`
- **Description**: System health status with service dependencies
- **Status Code**: 200 (healthy), 503 (degraded)

### Building Identification
- **Endpoint**: `POST /api/identify`
- **Description**: Identify buildings based on location and heading
- **Request**:
  ```json
  {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "heading": 45,
    "searchRadius": 100
  }
  ```
- **Response**: Array of building candidates with confidence scores

See [Backend API Documentation](./server/README.md) for detailed examples and error responses.

## Environment Configuration

Copy `.env.example` to `.env` and update with your values:

```bash
# Application
NODE_ENV=development          # development or production
PORT=3000                     # Backend port
HOST=0.0.0.0                  # Listen address

# Database
DATABASE_URL=postgresql://... # PostgreSQL connection string

# Cache
REDIS_URL=redis://...         # Redis connection string
REDIS_TTL_GEOCODING=2592000   # 30 days
REDIS_TTL_PLACES=604800       # 7 days
REDIS_TTL_IDENTIFY=3600       # 1 hour

# External APIs
GOOGLE_MAPS_API_KEY=...       # Google Maps API key
NOMINATIM_BASE_URL=...        # Nominatim API URL
NOMINATIM_EMAIL=...           # Required for Nominatim

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000    # Time window in ms
RATE_LIMIT_MAX_REQUESTS=10    # Requests per window

# Logging
LOG_LEVEL=debug               # debug, info, warn, error
CORS_ORIGIN=*                 # CORS origin
```

For details, see [.env.example](./env.example).

## Contributing Guidelines

1. **Branch naming**: `feature/description`, `bugfix/description`, `docs/description`
2. **Commits**: Use conventional commits (feat:, fix:, docs:, etc.)
3. **Code style**:
   - ESLint + TypeScript strict mode
   - Run `npm run lint` before committing
4. **Tests**: All features must have corresponding tests
5. **TypeScript**: Ensure `npm run build` passes with no errors
6. **Documentation**: Update docs for new features or API changes

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:
```
feat(identify): add heading-based building filtering
fix(api): handle missing coordinates gracefully
docs(readme): add deployment instructions
```

## Troubleshooting

### Backend Issues

**Port already in use**
```bash
# Find process using port 3100
lsof -i :3100

# Kill the process
kill -9 <PID>
```

**Database connection failed**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

**Redis connection issues**
```bash
# Check Redis status
docker exec buildinglens-redis redis-cli ping

# Restart Redis
docker-compose restart redis
```

### Mobile Issues

**Expo connection issues**
```bash
# Clear cache and restart
expo start --clear

# On physical device, scan QR code again
npm start
```

**Camera permission denied**
- iOS: Settings > BuildingLens > Camera > Allow
- Android: App permissions > Camera > Allow

**Location not updating**
- Ensure location services are enabled
- iOS: Settings > Privacy > Location Services > On
- Android: Settings > Location > On

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](./docs/DEPLOYMENT.md).

### Quick Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set strong database password
- [ ] Configure Redis with persistence
- [ ] Set up SSL/TLS certificates
- [ ] Configure monitoring and alerting
- [ ] Set up automated backups for PostgreSQL
- [ ] Configure proper CORS origins
- [ ] Set rate limiting appropriately
- [ ] Review security settings in Helmet
- [ ] Test health checks

## Performance Considerations

- **Caching**: 30-day cache for geocoding, 7-day for places data, 1-hour for identification results
- **Database**: Spatial indexes on GPS coordinates for fast queries
- **Rate Limiting**: 10 requests per 60 seconds per IP
- **Debouncing**: Mobile app debounces location updates by 500ms
- **Search Radius**: Default 100m, configurable per request

## Security

- HTTPS/TLS in production
- SQL injection prevention via prepared statements
- XSS protection via Helmet CSP headers
- Rate limiting prevents abuse
- Input validation via Zod schemas
- API key security for external services
- PostgreSQL user with limited permissions
- No sensitive data in logs

For security best practices, see [DEVELOPMENT.md](./docs/DEVELOPMENT.md).

## License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## Support

For issues, feature requests, or questions:
1. Check existing [Issues](https://github.com/yourorg/buildinglens/issues)
2. Create a new issue with clear description
3. Include reproduction steps and environment details

## Roadmap

- Computer vision building identification (phase 2)
- User authentication and bookmarks
- Building history and search filters
- Offline-first capability
- Advanced analytics dashboard
- Integration with mapping services

---

**Last Updated**: January 2026
**Status**: Active Development (MVP)
**Maintainers**: BuildingLens Team
