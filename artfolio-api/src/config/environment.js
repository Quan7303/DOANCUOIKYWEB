import 'dotenv/config'

export const env = {
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_NAME: process.env.DATABASE_NAME || 'artfolio',
  APP_HOST: process.env.APP_HOST || 'localhost',
  APP_PORT: process.env.APP_PORT || 8017,

  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,

  JWT_SECRET: process.env.JWT_SECRET || 'jwt-default-secret-key-2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'jwt-refresh-default-secret-key-2026',

  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development'
}
