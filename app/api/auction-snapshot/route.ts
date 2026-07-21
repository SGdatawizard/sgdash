import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketShareSnapshot } from '@/lib/auction-sync';

export async function GET(req: NextRequest) {
  const quarter = req.nextUrl.searchParams.get('quarter');
  if (!quarter) {
    return NextResponse.json({ error: 'quarter query param is required' }, { status: 400 });
  }
  try {
    const snapshot = await fetchMarketShareSnapshot(quarter);
    return NextResponse.json(snapshot);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}