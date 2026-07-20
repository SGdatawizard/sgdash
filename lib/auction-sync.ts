import { auctionSupabase } from './auction-supabase';
import type { Category } from './types';

/**
 * Bridge between the Auction Performance app and this dashboard.
 *
 * TODO (needs the real table/column names from the Auction Performance
 * app before this does anything): the functions below are scaffolding,
 * not a working integration yet. Once you can tell me:
 *   1. the table/view name(s) that hold sell-through rate & market
 *      share by category and quarter (or the raw lot-level data to
 *      compute them from), and
 *   2. the column names for category, quarter/date, hammer price,
 *      estimate, lot count, etc.
 * I'll fill in the query below for real and wire up the "Pull latest
 * from Auction Performance" button this file is meant to support.
 *
 * The shape every function here should end up returning is the same:
 * a single number for a given KPI + category + quarter, ready to be
 * written straight into `entries` via `addEntry`.
 */

export type SyncableKpi = 'sell-through-rate' | 'market-share';

export async function fetchAuctionMetric(
  kpi: SyncableKpi,
  category: Category,
  quarter: string
): Promise<number | null> {
  if (kpi === 'sell-through-rate') {
    return fetchSellThroughRate(category, quarter);
  }
  if (kpi === 'market-share') {
    return fetchMarketShare(category, quarter);
  }
  return null;
}

async function fetchSellThroughRate(category: Category, quarter: string): Promise<number | null> {
  // EXAMPLE ONLY — replace 'lots' / column names with the real schema.
  //
  // const { data, error } = await auctionSupabase
  //   .from('lots')
  //   .select('sold')
  //   .eq('category', category)
  //   .eq('quarter', quarter);
  // if (error) throw error;
  // if (!data || data.length === 0) return null;
  // const sold = data.filter((l) => l.sold).length;
  // return (sold / data.length) * 100;

  throw new Error(
    'fetchSellThroughRate is not wired up yet — see the TODO in lib/auction-sync.ts'
  );
}

async function fetchMarketShare(category: Category, quarter: string): Promise<number | null> {
  // EXAMPLE ONLY — replace with the real schema. Market share is
  // described as "measured on hammer / number of lots offered" in the
  // 2026 plan, so this likely needs to pull hammer totals from the
  // auction app and combine them with an external market-size figure.
  throw new Error(
    'fetchMarketShare is not wired up yet — see the TODO in lib/auction-sync.ts'
  );
}