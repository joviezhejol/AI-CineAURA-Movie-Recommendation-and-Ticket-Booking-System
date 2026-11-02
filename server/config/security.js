/**
 * Centralized Security and Authentication Configuration
 * 
 * Enforces strong JWT secrets in production and disables unsafe fallbacks.
 */
const dotenv = require('dotenv');
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

let jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.trim() === '') {
  if (isProduction) {
    throw new Error('FATAL SECURITY ERROR: process.env.JWT_SECRET must be defined in production. Application startup aborted.');
  } else {
    // Only permit local development fallback with clear notice
    jwtSecret = 'cineaura_local_development_jwt_secret_do_not_use_in_prod_2026';
    console.warn('⚠️ WARNING: JWT_SECRET not set in environment. Using development secret (ALLOWED IN DEVELOPMENT ONLY).');
  }
} else if (isProduction && jwtSecret.length < 32) {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET must be at least 32 characters long in production.');
}

module.exports = {
  JWT_SECRET: jwtSecret,
  IS_PRODUCTION: isProduction,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5005',
  PORT: process.env.PORT || 5005
};
