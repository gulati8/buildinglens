import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variable validation schema
 * Uses Zod to ensure all required environment variables are present and valid
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url().startsWith('postgresql://'),

  // Redis
  REDIS_URL: z.string().url().startsWith('redis://'),
  REDIS_TTL_GEOCODING: z.string().transform(Number).pipe(z.number().positive()).default('2592000'), // 30 days
  REDIS_TTL_PLACES: z.string().transform(Number).pipe(z.number().positive()).default('604800'), // 7 days
  REDIS_TTL_IDENTIFY: z.string().transform(Number).pipe(z.number().positive()).default('3600'), // 1 hour

  // External APIs
  GOOGLE_MAPS_API_KEY: z.string().min(1),
  NOMINATIM_BASE_URL: z.string().url().default('https://nominatim.openstreetmap.org'),
  NOMINATIM_EMAIL: z.string().email().optional(),

  // Search Configuration
  SEARCH_RADIUS_METERS: z.string().transform(Number).pipe(z.number().positive()).default('100'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('60000'), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('10'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),
});

/**
 * Validated environment variables
 * Throws an error if validation fails
 */
export const env = envSchema.parse(process.env);

/**
 * Type definition for environment variables
 */
export type Env = z.infer<typeof envSchema>;
