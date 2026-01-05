import { CorsOptions } from 'cors';
import { env } from './env';

/**
 * CORS middleware configuration
 * Configures Cross-Origin Resource Sharing for API security
 */
export const corsOptions: CorsOptions = {
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours - cache preflight requests
  optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on 204
};
