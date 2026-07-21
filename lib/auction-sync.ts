import { auctionSupabase } from './auction-supabase';
import type { Category } from './types';

/**
 * Bridge between the Auction Performance app (sg-auctions) and this
 * dashboard. Confirmed schema (from sg-auctions/src/lib/types/database.ts):
 *
 *   auctions: id, date, auction_category, total_lots, lots_sold, ...
 *   lots:     id, auction_id, category ('Stamps' | 'Coins' | 'Pop Culture'),
 *             sold (boolean), hammer_price (numeric)
 *
 * lots.category matches our Category values exactly, so no mapping is
 * needed there. Quarters aren't stored directly — auctions only have a
 * `date` — so we convert "YYYY-Qn" to a date range and join through
 * auction_id to find the lots that fall in it.
 */

export type SyncableKpi = 'sell-through-rate' | 'market-share';

function quarterToDateRange(quarter: string): { start: string; end: string } {
  const match = quarter.match(/^(\d{4})-Q([1-4])$/);
  if (!match) throw new Error(`Unrecognised quarter format: "${quarter}"`);
  const year = Number(match[1]);
  const q = Number(match[2]);
  const startMonth = (q - 1) * 3; // 0-indexed
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 1));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

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
  const { start, end } = quarterToDateRange(quarter);

  const { data: auctions, error: auctionsError } = await auctionSupabase
    .from('auctions')
    .select('id')
    .gte('date', start)
    .lt('date', end);
  if (auctionsError) throw auctionsError;
  if (!auctions || auctions.length === 0) return null;

  const auctionIds = auctions.map((a) => a.id);

  let totalQuery = auctionSupabase
    .from('lots')
    .select('*', { count: 'exact', head: true })
    .in('auction_id', auctionIds);
  let soldQuery = auctionSupabase
    .from('lots')
    .select('*', { count: 'exact', head: true })
    .in('auction_id', auctionIds)
    .eq('sold', true);

  if (category !== 'Company') {
    totalQuery = totalQuery.eq('category', category);
    soldQuery = soldQuery.eq('category', category);
  }

  const [{ count: totalCount, error: totalError }, { count: soldCount, error: soldError }] =
    await Promise.all([totalQuery, soldQuery]);
  if (totalError) throw totalError;
  if (soldError) throw soldError;

  if (!totalCount) return null;
  return ((soldCount ?? 0) / totalCount) * 100;
}

async function fetchMarketShare(_category: Category, _quarter: string): Promise<number | null> {
  // sg-auctions has our own hammer totals and lot counts, but "market
  // share versus key competitors" (per the 2026 plan) needs a total
  // market-size figure to divide by — competitor sales aren't tracked
  // anywhere in this system. There's nothing to silently substitute
  // here without producing a misleading number, so this stays manual
  // in Data Entry until there's a market-size source to pull from.
  throw new Error(
    'Market Share needs a total-market benchmark that sg-auctions doesn\u2019t track (only our own hammer totals). Enter this one manually for now.'
  );
}