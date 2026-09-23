import { NextResponse } from 'next/server';
import { getFxSnapshot } from '@/lib/currency';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function GET(){
  const fx=await getFxSnapshot();
  return NextResponse.json(fx,{headers:{'Cache-Control':'public, s-maxage=3600, stale-while-revalidate=86400'}});
}
