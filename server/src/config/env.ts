import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5432/student_records'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters')
    .default('adcet_development_jwt_access_secret_key_32_chars'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters')
    .default('adcet_development_jwt_refresh_secret_key_32_chars'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
}).refine(
  (data) => {
    if (data.NODE_ENV === 'production') {
      return (
        data.JWT_ACCESS_SECRET !== 'adcet_development_jwt_access_secret_key_32_chars' &&
        data.JWT_REFRESH_SECRET !== 'adcet_development_jwt_refresh_secret_key_32_chars'
      );
    }
    return true;
  },
  {
    message: 'FATAL SECURITY: Default development JWT secrets are strictly forbidden in production!',
  }
);

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
