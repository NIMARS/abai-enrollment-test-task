import { config } from 'dotenv';

config({ path: '.env.test' });
process.env.NODE_ENV = 'test';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for tests (.env.test)');
}