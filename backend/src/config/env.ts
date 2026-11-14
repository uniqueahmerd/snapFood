import dotenv from 'dotenv'

dotenv.config()

const nodeEnv = process.env.NODE_ENV ?? 'development'

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const env = {
  NODE_ENV: nodeEnv,
  PORT: parseInt(getEnv('PORT', '5001'), 10),
  API_URL: getEnv('API_URL', `http://localhost:${process.env.PORT || '5001'}`),
  CLIENT_URL: getEnv('CLIENT_URL', 'http://localhost:5174'),
  CORS_ORIGINS: getEnv('CORS_ORIGINS', 'http://localhost:5174,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  DB_HOST: getEnv('DB_HOST'),
  DB_PORT: parseInt(getEnv('DB_PORT', '5432'), 10),
  DB_USERNAME: getEnv('DB_USERNAME'),
  DB_PASSWORD: getEnv('DB_PASSWORD'),
  DB_NAME: getEnv('DB_NAME'),

  REDIS_HOST: getEnv('REDIS_HOST'),
  REDIS_PORT: parseInt(getEnv('REDIS_PORT', '6379'), 10),

  JWT_ACCESS_SECRET: getEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: getEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),

  SMTP_HOST: getEnv('SMTP_HOST', nodeEnv === 'development' ? '127.0.0.1' : undefined),
  SMTP_PORT: parseInt(getEnv('SMTP_PORT', nodeEnv === 'development' ? '1025' : '587'), 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SENDER_EMAIL: getEnv('SENDER_EMAIL', 'snapfood@localhost'),
  SUPPORT_EMAIL: getEnv('SUPPORT_EMAIL', 'support@example.com'),
  
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: getEnv(
    'GOOGLE_CALLBACK_URL',
    `${process.env.API_URL || `http://localhost:${process.env.PORT || '5001'}`}/api/v1/auth/google/callback`,
  ),
  AI_URL: getEnv("AI_URL"),
  AI_ADMIN_TOKEN: process.env.AI_ADMIN_TOKEN,
  USDA_API_KEY: process.env.USDA_API_KEY,

}

if (!Number.isInteger(env.PORT) || env.PORT < 1 || env.PORT > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

if (!Number.isInteger(env.DB_PORT) || env.DB_PORT < 1 || env.DB_PORT > 65535) {
  throw new Error('DB_PORT must be an integer between 1 and 65535');
}

if (
  env.NODE_ENV === 'production' &&
  (
    !env.SMTP_USER ||
    !env.SMTP_PASSWORD ||
    env.SENDER_EMAIL === 'snapfood@localhost' ||
    ['localhost', '127.0.0.1', '::1'].includes(env.SMTP_HOST) ||
    env.SMTP_PORT === 1025
  )
) {
  throw new Error('Production requires a non-local SMTP host, SMTP credentials, and a production SENDER_EMAIL');
}

export const isGoogleOAuthConfigured = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);