import { neon } from '@neondatabase/serverless';
export const hasDatabase = Boolean(process.env.DATABASE_URL);
export const sql = hasDatabase ? neon(process.env.DATABASE_URL!) : null;
