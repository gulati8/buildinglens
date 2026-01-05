import winston from 'winston';
import { env } from '../config/env';

/**
 * Custom log format for development
 * Provides colorized, readable logs with timestamps
 */
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata, null, 2)}`;
    }
    return msg;
  })
);

/**
 * Custom log format for production
 * Provides structured JSON logs for log aggregation systems
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Winston logger instance
 * Centralized logging service with appropriate formatting for environment
 */
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
  exitOnError: false,
});

/**
 * Log stream for Morgan HTTP request logging
 */
export const logStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};
