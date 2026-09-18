import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || 'https://ep-long-frog-au25g585.neonauth.c-10.us-east-1.aws.neon.tech/turnavia/auth',
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});
