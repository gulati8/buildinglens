/**
 * Jest setup file
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://buildinglens_user:buildinglens_pass@localhost:5434/buildinglens';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';
process.env.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'test_key';

// Increase timeout for integration tests
// Note: timeout is now configured in jest.config.js
