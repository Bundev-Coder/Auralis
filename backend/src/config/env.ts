import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'auralis_super_secret_jwt_key_2026',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  AI_RATE_LIMIT_PER_MIN: parseInt(process.env.AI_RATE_LIMIT_PER_MIN || '60', 10),
};
