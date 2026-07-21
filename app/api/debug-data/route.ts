import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auctionSupabase } from '@/lib/auction-supabase';

export const dynamic = 'force-dynamic';

function projectRef(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return 'unparseable-url';
  }
}

async function fetchAllLotCategoryCounts(): Promise<{ category: string | null; count: number }[]> {
  const pageSize = 1000;
  const tally = new Map<string | null, number>();
  let from = 0;
  while (true) {
    const { data, error } = await auctionSupabase
      .from('lots')
      .select('category')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const row of data) {
      const key = row.category ?? null;
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return Array.from(tally.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

// Temporary diagnostic — direct, unfiltered visibility into what's
// actually in each Supabase project right now, so persistence and
// category-matching questions can be answered from real data instead
// of guesswork. Safe to delete once things are confirmed working.
export async function GET() {
  const [kpisRes, entriesRes, targetsRes, lotCategoryCounts] = await Promise.all([
    supabase.from('kpis').select('id', { count: 'exact', head: true }),
    supabase.from('entries').select('id', { count: 'exact', head: true }),
    supabase.from('targets').select('id', { count: 'exact', head: true }),
    fetchAllLotCategoryCounts(),
  ]);

  const recentEntries = await supabase
    .from('entries')
    .select('kpi_id, quarter, category, value, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  const recentTargets = await supabase
    .from('targets')
    .select('kpi_id, category, target_value, updated_at')
    .order('updated_at', { ascending: false })
    .limit(10);

  const body = {
    dashboardProjectRef: projectRef(process.env.SUPABASE_URL),
    auctionProjectRef: projectRef(process.env.AUCTION_SUPABASE_URL),
    checkedAt: new Date().toISOString(),
    counts: {
      kpis: kpisRes.count,
      entries: entriesRes.count,
      targets: targetsRes.count,
    },
    errors: {
      kpis: kpisRes.error?.message ?? null,
      entries: entriesRes.error?.message ?? null,
      targets: targetsRes.error?.message ?? null,
    },
    mostRecentEntries: recentEntries.data ?? [],
    mostRecentTargets: recentTargets.data ?? [],
    lotCategoryCountsInAuctionApp: lotCategoryCounts,
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
    },
  });
}