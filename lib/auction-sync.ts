import { auctionSupabase } from './auction-supabase';
import type { Category } from './types';
import { CATEGORIES } from './types';

/**
 * Bridge between the Auction Performance app (sg-auctions) and this
 * dashboard. Confirmed schema (from sg-auctions/src/lib/types/database.ts):
 *
 *   auctions: id, date, auction_category, total_lots, lots_sold, ...
 *   lots:     id, auction_id, category ('Stamps' | 'Coins' | 'Pop Culture'),
 *             sold (boolean), hammer_price (numeric), commission_rate
 *             (text, e.g. "10%" — see parseCommissionRate in
 *             sg-auctions/src/app/dashboard/analytics/financials/page.tsx,
 *             which this mirrors)
 *
 * lots.category matches our Category values exactly, so no mapping is
 * needed there. Quarters aren't stored directly — auctions only have a
 * `date` — so we convert "YYYY-Qn" to a date range and join through
 * auction_id to find the lots that fall in it.
 */

export type SyncableKpi = 'sell-through-rate' | 'vendor-commission';

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

function parseCommissionRate(rate: string | null): number {
  if (!rate) return 0;
  const cleaned = rate.replace('%', '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed / 100;
}

async function auctionIdsInQuarter(quarter: string): Promise<string[]> {
  const { start, end } = quarterToDateRange(quarter);
  const { data, error } = await auctionSupabase
    .from('auctions')
    .select('id')
    .gte('date', start)
    .lt('date', end);
  if (error) throw error;
  return (data ?? []).map((a) => a.id as string);
}

/** Paginated fetch of lots for a set of auctions — sg-auctions' own tables
 *  can be large enough that Supabase's default row cap applies, so this
 *  fetches in chunks the same way sg-auctions' own financials page does. */
async function fetchLotsForAuctions(
  auctionIds: string[],
  columns: string
): Promise<Record<string, unknown>[]> {
  const pageSize = 1000;
  const results: Record<string, unknown>[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await auctionSupabase
      .from('lots')
      .select(columns)
      .in('auction_id', auctionIds)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    results.push(...(data as unknown as Record<string, unknown>[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return results;
}

export async function fetchAuctionMetric(
  kpi: SyncableKpi,
  category: Category,
  quarter: string
): Promise<number | null> {
  if (kpi === 'sell-through-rate') return fetchSellThroughRate(category, quarter);
  if (kpi === 'vendor-commission') return fetchVendorCommission(category, quarter);
  return null;
}

async function fetchSellThroughRate(category: Category, quarter: string): Promise<number | null> {
  const auctionIds = await auctionIdsInQuarter(quarter);
  if (auctionIds.length === 0) return null;

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

async function fetchVendorCommission(category: Category, quarter: string): Promise<number | null> {
  const auctionIds = await auctionIdsInQuarter(quarter);
  if (auctionIds.length === 0) return null;

  const lots = await fetchLotsForAuctions(auctionIds, 'category, sold, hammer_price, commission_rate');
  const soldLots = lots.filter((l) => l.sold === true && (category === 'Company' || l.category === category));

  if (soldLots.length === 0) return null;

  let totalHammer = 0;
  let totalCommission = 0;
  for (const lot of soldLots) {
    const hammer = Number(lot.hammer_price) || 0;
    const rate = parseCommissionRate(lot.commission_rate as string | null);
    totalHammer += hammer;
    totalCommission += hammer * rate;
  }

  if (totalHammer === 0) return null;
  // Blended commission rate earned, as a % of hammer value — matches
  // Vendor Commission's unit ('%') and sg-auctions' own financials math.
  return (totalCommission / totalHammer) * 100;
}

// --- Market Share: hammer value & lots offered snapshot ---
//
// True "market share versus key competitors" needs an external
// market-size benchmark sg-auctions doesn't have, so rather than fake a
// percentage, this pulls the underlying numbers (hammer value, lots
// offered) for the quarter — for the company overall and each category
// — so whoever owns Market Share can see the same breakdown sg-auctions
// shows and decide the figure to enter.

export interface AuctionSnapshotRow {
  category: Category;
  hammerValue: number;
  lotsOffered: number;
}

export async function fetchMarketShareSnapshot(quarter: string): Promise<AuctionSnapshotRow[]> {
  const auctionIds = await auctionIdsInQuarter(quarter);
  if (auctionIds.length === 0) {
    return CATEGORIES.map((category) => ({ category, hammerValue: 0, lotsOffered: 0 }));
  }

  const lots = await fetchLotsForAuctions(auctionIds, 'category, sold, hammer_price');

  function summarize(filterCategory: Category | null) {
    const filtered = filterCategory ? lots.filter((l) => l.category === filterCategory) : lots;
    const lotsOffered = filtered.length;
    const hammerValue = filtered
      .filter((l) => l.sold === true)
      .reduce((sum, l) => sum + (Number(l.hammer_price) || 0), 0);
    return { hammerValue, lotsOffered };
  }

  return [
    { category: 'Company', ...summarize(null) },
    { category: 'Stamps', ...summarize('Stamps') },
    { category: 'Coins', ...summarize('Coins') },
    { category: 'Pop Culture', ...summarize('Pop Culture') },
  ];
}