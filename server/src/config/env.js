import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  translation: {
    primaryTimeoutMs: parseInt(process.env.TRANSLATION_TIMEOUT_MS || '2500', 10),
    secondaryTimeoutMs: parseInt(process.env.TRANSLATION_TIMEOUT_MS || '2500', 10)
  }
};
