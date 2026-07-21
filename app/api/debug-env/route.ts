import { NextResponse } from 'next/server';

// Temporary diagnostic. Doesn't expose keys — just enough of the URLs
// to confirm which Supabase project each one points at.
function projectRef(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return 'unparseable-url';
  }
}

export async function GET() {
  const dashboardRef = projectRef(process.env.SUPABASE_URL);
  const auctionRef = projectRef(process.env.AUCTION_SUPABASE_URL);

  return NextResponse.json({
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    AUCTION_SUPABASE_URL: !!process.env.AUCTION_SUPABASE_URL,
    AUCTION_SUPABASE_SERVICE_ROLE_KEY: !!process.env.AUCTION_SUPABASE_SERVICE_ROLE_KEY,
    dashboardProjectRef: dashboardRef,
    auctionProjectRef: auctionRef,
    theseAreTheSameProject: dashboardRef !== null && dashboardRef === auctionRef,
  });
}