import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PRODUCTION_HOST='tucita.com.ve';
const LEGACY_VERCEL_HOST='turnavia.vercel.app';

export function middleware(request:NextRequest){
  const host=(request.headers.get('host')||'').split(':')[0].toLowerCase();

  // Keep Preview deployment URLs available for TEST, but never expose the
  // permanent Vercel production alias to end users. The canonical public
  // production address is always tucita.com.ve.
  if(host===LEGACY_VERCEL_HOST){
    const url=request.nextUrl.clone();
    url.protocol='https:';
    url.host=PRODUCTION_HOST;
    url.port='';
    return NextResponse.redirect(url,308);
  }

  return NextResponse.next();
}

export const config={
  matcher:['/((?!_next/static|_next/image|favicon.ico).*)']
};
