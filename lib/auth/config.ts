export const NEON_AUTH_BASE_URL =
  process.env.NEON_AUTH_BASE_URL ||
  'https://ep-long-frog-au25g585.neonauth.c-10.us-east-1.aws.neon.tech/turnavia/auth';

export const neonAuthConfigured = Boolean(NEON_AUTH_BASE_URL);
