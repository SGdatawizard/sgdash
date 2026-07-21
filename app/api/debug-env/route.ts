import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Temporary diagnostic — reports whether env vars are present without
// ever revealing their values. Safe to leave in, but fine to delete
// once the auction connection is confirmed working.
export async function GET() {
  return NextResponse.json({
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    AUCTION_SUPABASE_URL: !!process.env.AUCTION_SUPABASE_URL,
    AUCTION_SUPABASE_SERVICE_ROLE_KEY: !!process.env.AUCTION_SUPABASE_SERVICE_ROLE_KEY,
  });
}