const nodeEnv = process.env.NODE_ENV || 'development';
const isDev = nodeEnv === 'development';
const isProd = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (isTest) {
    return 'test-jwt-secret';
  }

  throw new Error('JWT_SECRET must be configured');
}

function getCorsOrigins() {
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  if (isDev) {
    return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  }

  return [];
}

const env = Object.freeze({
  PORT: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV: nodeEnv,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/financeflow',
  JWT_SECRET: getJwtSecret(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_ISSUER: process.env.JWT_ISSUER || 'financeflow-api',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'financeflow-client',
  CORS_ORIGINS: getCorsOrigins(),
  isDev,
  isProd,
  isTest,
});

module.exports = { env };
