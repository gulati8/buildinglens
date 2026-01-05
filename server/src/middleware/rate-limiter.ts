import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { env } from '../config/env';

/**
 * Rate limiting middleware configuration
 * Limits requests per IP address using Redis as the store
 */
export const rateLimiter = rateLimit({
  // Use Redis for distributed rate limiting
  store: new RedisStore({
    // @ts-ignore - Type compatibility issue between ioredis and rate-limit-redis
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:', // Key prefix in Redis
  }) as any,

  // Rate limit configuration
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,

  // Customize error message
  message: {
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },

  // Return rate limit info in headers
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers

  // Skip successful requests (only count failed requests)
  skipSuccessfulRequests: false,

  // Skip failed requests
  skipFailedRequests: false,

  // Custom key generator (use IP address)
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },

  // Handler for when rate limit is exceeded
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        message: 'Too many requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
});
