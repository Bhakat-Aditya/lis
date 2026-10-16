import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'lis_secret_key_clinic_2026_jwt_token',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.CLIENT_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  ].filter(Boolean),

  // Upstream LIS AWS Server configuration
  lab: {
    path: process.env.LAB_PATH || 'lifecare',
    databaseInit: process.env.LAB_DATABASE_INIT || 'lifecare',
    domain: process.env.LAB_DOMAIN || 'https://lis.newlifecaremidnapore.com',
    get url() {
      return `${this.domain}/${this.path}`;
    },
    website: process.env.LAB_WEBSITE || 'https://lis.newlifecaremidnapore.com',
    cookieName: process.env.LAB_COOKIE_NAME || 'lifecareauth',
    defaultUser: process.env.UPSTREAM_DEFAULT_USER || 'sandip',
    defaultPass: process.env.UPSTREAM_DEFAULT_PASS || 'Life',
  },

  // 24 Hour TTL for Master Data Lists
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS, 10) || 86400, // 24 hours
};
