import 'dotenv/config';

function bool(v, fallback = false) {
  if (v === undefined) return fallback;
  return /^(1|true|yes|on)$/i.test(String(v));
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  allowDevLogin: bool(process.env.ALLOW_DEV_LOGIN, false),

  databaseUrl: process.env.DATABASE_URL || 'postgres://localhost:5432/hustlezone',

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  livekit: {
    url: process.env.LIVEKIT_URL || '',
    apiKey: process.env.LIVEKIT_API_KEY || '',
    apiSecret: process.env.LIVEKIT_API_SECRET || '',
    get enabled() {
      return Boolean(this.url && this.apiKey && this.apiSecret);
    },
  },
};

export const isProd = config.env === 'production';
