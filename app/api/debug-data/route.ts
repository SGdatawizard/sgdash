import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auctionSupabase } from '@/lib/auction-supabase';

function projectRef(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return 'unparseable-url';
  }
}

// Temporary diagnostic — direct, unfiltered visibility into what's
// actually in each Supabase project right now, so persistence and
// category-matching questions can be answered from real data instead
// of guesswork. Safe to delete once things are confirmed working.
export async function GET() {
  const [kpisRes, entriesRes, targetsRes, lotsRes] = await Promise.all([
    supabase.from('kpis').select('id', { count: 'exact', head: true }),
    supabase.from('entries').select('id', { count: 'exact', head: true }),
    supabase.from('targets').select('id', { count: 'exact', head: true }),
    auctionSupabase.from('lots').select('category').limit(2000),
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

  const distinctLotCategories = Array.from(
    new Set((lotsRes.data ?? []).map((l) => JSON.stringify(l.category)))
  ).map((s) => JSON.parse(s));

  return NextResponse.json({
    dashboardProjectRef: projectRef(process.env.SUPABASE_URL),
    auctionProjectRef: projectRef(process.env.AUCTION_SUPABASE_URL),
    counts: {
      kpis: kpisRes.count,
      entries: entriesRes.count,
      targets: targetsRes.count,
    },
    errors: {
      kpis: kpisRes.error?.message ?? null,
      entries: entriesRes.error?.message ?? null,
      targets: targetsRes.error?.message ?? null,
      lots: lotsRes.error?.message ?? null,
    },
    mostRecentEntries: recentEntries.data ?? [],
    mostRecentTargets: recentTargets.data ?? [],
    distinctLotCategoriesInAuctionApp: distinctLotCategories,
  });
}