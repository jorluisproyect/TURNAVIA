import { createNeonAuth } from '@neondatabase/auth/next/server';
import { NEON_AUTH_BASE_URL } from '@/lib/auth/config';

const isBuild = process.env.npm_lifecycle_event === 'build';
const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ||
  (isBuild ? 'tucita-build-only-cookie-secret-not-used-at-runtime' : undefined);

if (!cookieSecret) {
  throw new Error('NEON_AUTH_COOKIE_SECRET is required at runtime.');
}

export const auth = createNeonAuth({
  baseUrl: NEON_AUTH_BASE_URL,
  cookies: {
    secret: cookieSecret,
  },
});
