import { createNeonAuth } from '@neondatabase/auth/next/server';
import { NEON_AUTH_BASE_URL } from '@/lib/auth/config';

export const auth = createNeonAuth({
  baseUrl: NEON_AUTH_BASE_URL,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});
