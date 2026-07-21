import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * This app's data changes constantly (quarterly readings, targets,
 * auction syncs) and is read by more than one page. Rather than keep
 * chasing individual caching layers one at a time — Next's client
 * Router Cache, its Data Cache, Vercel's edge cache — this applies a
 * single blanket rule at the HTTP level: nothing this app returns is
 * ever cacheable, by anything, anywhere. It's a blunt instrument, but
 * for an internal dashboard where every page is cheap to regenerate
 * and correctness matters more than shaving off render time, that's
 * the right trade-off.
 */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  return response;
}

export const config = {
  matcher: '/:path*',
};