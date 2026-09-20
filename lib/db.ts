import { neon } from '@neondatabase/serverless';

const candidates=[
  ['DATABASE_URL',process.env.DATABASE_URL],
  ['POSTGRES_URL',process.env.POSTGRES_URL],
  ['NEON_DATABASE_URL',process.env.NEON_DATABASE_URL],
  ['DATABASE_URL_UNPOOLED',process.env.DATABASE_URL_UNPOOLED],
  ['POSTGRES_URL_NON_POOLING',process.env.POSTGRES_URL_NON_POOLING],
] as const;

const selected=candidates.find(([,value])=>Boolean(value));
export const databaseEnvName=selected?.[0]||null;
export const databaseUrl=selected?.[1]||null;
export const hasDatabase=Boolean(databaseUrl);
export const sql=hasDatabase ? neon(databaseUrl!) : null;
