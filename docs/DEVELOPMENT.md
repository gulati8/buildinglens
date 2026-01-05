# Development Guide

Complete guide for developing BuildingLens - both backend and mobile components.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Code Organization](#code-organization)
- [TypeScript Configuration](#typescript-configuration)
- [Backend Development](#backend-development)
- [Mobile Development](#mobile-development)
- [Testing Best Practices](#testing-best-practices)
- [Code Style & Linting](#code-style--linting)
- [Git Workflow](#git-workflow)
- [Debugging Tips](#debugging-tips)
- [Performance Optimization](#performance-optimization)

## Development Environment Setup

### System Requirements

- **macOS/Linux/Windows** with Node.js 20+
- **Docker & Docker Compose** for local services
- **Git** for version control
- **Text Editor/IDE**: VS Code recommended

### Initial Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd buildinglens
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd server
   npm install

   # Mobile
   cd ../mobile
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy template
   cp .env.example .env

   # Edit with your values
   GOOGLE_MAPS_API_KEY=your_key_here
   NOMINATIM_EMAIL=your_email@example.com
   ```

4. **Start services**
   ```bash
   docker-compose up -d

   # Verify
   docker-compose ps
   ```

5. **Initialize database** (automatic on Docker start)
   ```bash
   # Verify database has migrations
   docker exec buildinglens-postgres psql -U buildinglens_user -d buildinglens -c "\dt"
   ```

## Code Organization

### Backend Structure

```
server/
├── src/
│   ├── config/          # Configuration (env, database, redis, cors)
│   ├── controllers/     # HTTP request handlers
│   ├── routes/          # Route definitions
│   ├── services/        # Business logic
│   │   └── __tests__/   # Unit tests
│   ├── middleware/      # Express middleware
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities (logger, helpers)
│   ├── app.ts           # Express app setup
│   └── index.ts         # Server entry point
├── database/
│   └── migrations/      # SQL migration files
└── __tests__/           # Integration tests
```

### Mobile Structure

```
mobile/
├── src/
│   ├── screens/         # Full-screen components
│   ├── components/      # Reusable components
│   │   ├── camera/
│   │   ├── building/
│   │   ├── status/
│   │   ├── crosshair/
│   │   └── ui/
│   ├── hooks/           # Custom React hooks
│   ├── services/        # External services (API)
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities
│   └── theme/           # Design system
└── assets/              # Images, icons
```

### Naming Conventions

**Files**:
- Components: `PascalCase.tsx` (e.g., `CameraPreview.tsx`)
- Utilities: `camelCase.ts` (e.g., `constants.ts`)
- Tests: `camelCase.test.ts` (e.g., `bearing.service.test.ts`)

**Functions/Variables**:
- Functions: `camelCase` (e.g., `calculateBearing()`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `SEARCH_RADIUS_METERS`)
- Types/Interfaces: `PascalCase` (e.g., `BuildingCandidate`)

## TypeScript Configuration

### Strict Mode

All code is written with TypeScript strict mode enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### Type Definitions

Create types in `types/` directory, not scattered throughout code:

**Bad**:
```typescript
// In service file
interface BuildingResult {
  id: string;
  // ...
}
```

**Good**:
```typescript
// types/building.types.ts
export interface BuildingCandidate {
  id: string;
  // ...
}

// In service file
import { BuildingCandidate } from '../types/building.types';
```

### Utility Types

Use existing utility types and avoid `any`:

```typescript
// Good - specific types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

// Bad - avoid any
const response: any = await api.call();
```

## Backend Development

### Adding New Services

1. **Create service file**
   ```typescript
   // src/services/myfeature.service.ts
   import { logger } from '../utils/logger';

   export async function myFeatureFunction(param: string): Promise<string> {
     try {
       // Implementation
       return result;
     } catch (error) {
       logger.error('Error in myFeatureFunction', { error });
       throw error;
     }
   }
   ```

2. **Export from index**
   ```typescript
   // src/services/index.ts
   export { myFeatureFunction } from './myfeature.service';
   ```

3. **Add tests**
   ```typescript
   // src/services/__tests__/myfeature.service.test.ts
   import { myFeatureFunction } from '../myfeature.service';

   describe('myFeatureFunction', () => {
     it('should handle input correctly', async () => {
       const result = await myFeatureFunction('test');
       expect(result).toBe('expected');
     });
   });
   ```

### Adding New Endpoints

1. **Create controller**
   ```typescript
   // src/controllers/myfeature.controller.ts
   import { Request, Response, NextFunction } from 'express';
   import { asyncHandler } from '../middleware/error-handler';

   export const myFeatureController = asyncHandler(
     async (req: Request, res: Response, next: NextFunction) => {
       const result = await myFeatureService(req.body);
       res.json(result);
     }
   );
   ```

2. **Create route**
   ```typescript
   // src/routes/myfeature.routes.ts
   import { Router } from 'express';
   import { validateRequest } from '../middleware/request-validator';
   import { myFeatureController } from '../controllers/myfeature.controller';
   import { MyFeatureSchema } from '../types/api.types';

   const router = Router();

   router.post(
     '/my-feature',
     validateRequest(MyFeatureSchema),
     myFeatureController
   );

   export default router;
   ```

3. **Register route**
   ```typescript
   // src/routes/index.ts
   import myFeatureRoutes from './myfeature.routes';

   router.use('/api', myFeatureRoutes);
   ```

### Database Migrations

1. **Create migration file**
   ```sql
   -- database/migrations/003_add_new_table.sql
   CREATE TABLE new_feature (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_new_feature_name ON new_feature(name);
   ```

2. **Run migrations** (automatic on Docker startup)
   Files in `database/migrations/` execute in alphabetical order

### Caching Strategies

**Cache Service Usage**:
```typescript
import { cacheService } from './cache.service';

// Check cache first
const cached = await cacheService.get('key');
if (cached) return cached;

// Fetch data
const data = await fetchFromAPI();

// Store in cache with TTL
await cacheService.set('key', data, 86400); // 24 hours

return data;
```

**Redis TTL Values** (configured in `.env`):
- Geocoding: 30 days (2592000s)
- Places: 7 days (604800s)
- Identify: 1 hour (3600s)

## Mobile Development

### Creating New Screens

1. **Create screen component**
   ```typescript
   // src/screens/NewScreen.tsx
   import React, { useState, useEffect } from 'react';
   import { View, Text } from 'react-native';
   import { useCustomHook } from '../hooks';

   interface NewScreenProps {
     // Props
   }

   export function NewScreen({}: NewScreenProps) {
     const [state, setState] = useState(null);

     useEffect(() => {
       // Setup
     }, []);

     return (
       <View>
         <Text>New Screen</Text>
       </View>
     );
   }
   ```

2. **Export from index**
   ```typescript
   // src/screens/index.ts
   export { NewScreen } from './NewScreen';
   export type { NewScreenProps } from './NewScreen';
   ```

### Creating New Components

1. **Create component with props interface**
   ```typescript
   // src/components/mycomponent/MyComponent.tsx
   import React from 'react';
   import { View, StyleSheet } from 'react-native';
   import { colors, spacing } from '../../theme';

   interface MyComponentProps {
     title: string;
     onPress: () => void;
   }

   export function MyComponent({ title, onPress }: MyComponentProps) {
     return (
       <View style={styles.container}>
         {/* Component content */}
       </View>
     );
   }

   const styles = StyleSheet.create({
     container: {
       padding: spacing.md,
       backgroundColor: colors.white,
     },
   });
   ```

2. **Use theme tokens, not magic numbers**
   ```typescript
   // Good - uses theme
   padding: spacing.md, // 16px
   backgroundColor: colors.primary,

   // Bad - magic numbers
   padding: 16,
   backgroundColor: '#007AFF',
   ```

### Creating Custom Hooks

1. **Create hook file**
   ```typescript
   // src/hooks/useMyHook.ts
   import { useState, useEffect, useCallback } from 'react';

   interface UseMyHookParams {
     param1: string;
     param2?: number;
   }

   interface UseMyHookReturn {
     data: any | null;
     isLoading: boolean;
     error: Error | null;
   }

   export function useMyHook({
     param1,
     param2,
   }: UseMyHookParams): UseMyHookReturn {
     const [data, setData] = useState(null);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState(null);

     useEffect(() => {
       // Setup hook logic
     }, [param1, param2]);

     return { data, isLoading, error };
   }
   ```

2. **Export from index**
   ```typescript
   // src/hooks/index.ts
   export { useMyHook } from './useMyHook';
   export type { UseMyHookParams, UseMyHookReturn } from './useMyHook';
   ```

### Theme Customization

**Add new color**:
```typescript
// src/theme/colors.ts
export const colors = {
  // Existing colors...
  newColor: '#YOUR_HEX',
};
```

**Add new spacing value**:
```typescript
// src/theme/spacing.ts
export const spacing = {
  // Existing...
  3xl: 64,
};
```

**Add new typography style**:
```typescript
// src/theme/typography.ts
export const typography = {
  // Existing...
  largeTitle: {
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 48,
  },
};
```

## Testing Best Practices

### Backend Testing

**Test structure**:
```typescript
describe('ServiceName', () => {
  describe('function', () => {
    it('should handle happy path', async () => {
      // Arrange
      const input = 'test';
      const expected = 'result';

      // Act
      const result = await functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });

    it('should handle errors', async () => {
      expect(async () => {
        await functionUnderTest(invalidInput);
      }).rejects.toThrow();
    });
  });
});
```

**Mocking external services**:
```typescript
import * as googleMapsService from '../services/geocoding.service';

jest.mock('../services/geocoding.service');

describe('TestSuite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use mocked service', async () => {
    (googleMapsService.reverseGeocode as jest.Mock).mockResolvedValue({
      address: 'Test Address',
    });

    const result = await functionThatCallsService();

    expect(googleMapsService.reverseGeocode).toHaveBeenCalledWith(
      37.7749,
      -122.4194
    );
  });
});
```

### Mobile Testing

**Test a custom hook**:
```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useDeviceLocation } from '../useDeviceLocation';

describe('useDeviceLocation', () => {
  it('should return location data', async () => {
    const { result } = renderHook(() => useDeviceLocation());

    await waitFor(() => {
      expect(result.current.latitude).not.toBeNull();
    });

    expect(result.current.latitude).toBeGreaterThanOrEqual(-90);
    expect(result.current.latitude).toBeLessThanOrEqual(90);
  });
});
```

**Test a component**:
```typescript
import { render, screen } from '@testing-library/react-native';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render with props', () => {
    render(
      <MyComponent
        title="Test Title"
        onPress={() => {}}
      />
    );

    expect(screen.getByText('Test Title')).toBeTruthy();
  });
});
```

## Code Style & Linting

### ESLint Configuration

```bash
# Run linter
npm run lint

# Fix issues automatically
npm run lint -- --fix
```

### Code Formatting

**Use Prettier** (if configured):
```bash
npm run format
```

### Naming & Structure

**Import Order**:
```typescript
// 1. External dependencies
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import axios from 'axios';

// 2. Internal - types
import { BuildingCandidate } from '../types/building.types';

// 3. Internal - services
import { api } from '../services/api';

// 4. Internal - utilities
import { colors, spacing } from '../theme';
```

**Avoid**:
- Circular dependencies
- Default exports (use named exports)
- `any` type (use `unknown` or specific types)
- Commented-out code (delete or use git history)

## Git Workflow

### Branch Naming

```
feature/description        # New feature
bugfix/description        # Bug fix
docs/description          # Documentation
refactor/description      # Code refactoring
test/description          # Test improvements
chore/description         # Maintenance
```

### Commit Messages

Use conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Test additions/changes
- `chore`: Build, dependencies, etc.

**Examples**:
```
feat(identify): add heading-based filtering

Implement scoring algorithm that considers compass heading
to prioritize buildings in user's viewing direction.

Closes #123
```

```
fix(api): handle missing coordinates in identify endpoint

Validate latitude and longitude before processing request.
Return 400 error with helpful message if missing.
```

```
docs(readme): add deployment instructions

Add comprehensive deployment guide for AWS ECS.
Include environment variables and scaling tips.
```

### Pull Request Process

1. Create feature branch from `main`
2. Make commits with descriptive messages
3. Push branch and create PR
4. Ensure CI passes (tests, lint)
5. Get code review approval
6. Squash and merge to main
7. Delete feature branch

## Debugging Tips

### Backend Debugging

**Enable debug logs**:
```typescript
// Temporarily add detailed logging
logger.debug('Function called', {
  param1: value1,
  param2: value2,
});

logger.info('Processing result', { result });
```

**Use Node debugger**:
```bash
node --inspect dist/index.js

# Then open chrome://inspect in Chrome
```

**Test endpoint directly**:
```bash
curl -X POST http://localhost:3100/api/identify \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "heading": 45
  }' | jq .
```

**Database inspection**:
```bash
docker exec -it buildinglens-postgres psql \
  -U buildinglens_user -d buildinglens

# View data
SELECT * FROM cached_buildings LIMIT 5;

# Check query performance
EXPLAIN ANALYZE
SELECT * FROM cached_buildings
WHERE ST_DWithin(location, ST_Point(-122.4194, 37.7749)::geography, 100);
```

**Redis inspection**:
```bash
docker exec -it buildinglens-redis redis-cli

# View keys
KEYS *

# Check cache content
GET cache_key

# Monitor Redis commands
MONITOR
```

### Mobile Debugging

**Console logs**:
```typescript
console.log('Debug message', variable);
console.warn('Warning message');
console.error('Error message', error);
```

**React DevTools**:
```bash
# Install globally
npm install -g react-devtools

# Start DevTools
react-devtools

# DevTools connects automatically to your app
```

**Flipper** (Advanced):
- Download [Flipper](https://fbflipper.com/)
- Supports network inspection, database viewing, etc.

**Network debugging**:
```typescript
// Log all API requests
import axios from 'axios';

axios.interceptors.request.use((config) => {
  console.log('Request:', config);
  return config;
});

axios.interceptors.response.use((response) => {
  console.log('Response:', response);
  return response;
});
```

## Performance Optimization

### Backend

**Query Optimization**:
```typescript
// Use indexes for spatial queries
CREATE INDEX idx_location ON cached_buildings USING GIST(location);

// Profile queries
EXPLAIN ANALYZE SELECT ...;
```

**Caching Strategy**:
```typescript
// Cache frequently accessed data
const cachedResult = await cacheService.get(`building_${id}`);
if (cachedResult) return cachedResult;

// Store with appropriate TTL
await cacheService.set(`building_${id}`, data, CACHE_TTL);
```

**Database Pooling**:
- Connection pooling configured in `config/database.ts`
- Default: 10 connections
- Adjust if needed for load testing

### Mobile

**Debounce API calls**:
```typescript
// Only call API when user stops moving
const DEBOUNCE_MS = 500;

useEffect(() => {
  const timer = setTimeout(() => {
    identifyBuilding();
  }, DEBOUNCE_MS);

  return () => clearTimeout(timer);
}, [latitude, longitude]);
```

**Optimize re-renders**:
```typescript
// Memoize expensive components
const MemoizedBuilding = React.memo(BuildingCard);

// Use useCallback for stable function references
const handlePress = useCallback(() => {
  // Handle press
}, []);
```

**Lazy load components**:
```typescript
// Load non-critical components on demand
const DetailsScreen = React.lazy(() => import('./DetailsScreen'));
```

---

**Last Updated**: January 2026
