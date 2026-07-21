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
 */

export type SyncableKpi = 'sell-through-rate' | 'vendor-commission';
const SYNCABLE_KPIS: SyncableKpi[] = ['sell-through-rate', 'vendor-commission'];

interface LotRow {
  category: string | null;
  sold: boolean | null;
  hammer_price: number | string | null;
  commission_rate: string | null;
}

function quarterToDateRange(quarter: string): { start: string; end: string } {
  const match = quarter.match(/^(\d{4})-Q([1-4])$/);
  if (!match) throw new Error(`Unrecognised quarter format: "${quarter}"`);
  const year = Number(match[1]);
  const q = Number(match[2]);
  const startMonth = (q - 1) * 3;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 1));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function dateStringToQuarter(dateStr: string): string {
  const d = new Date(dateStr);
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `${d.getUTCFullYear()}-Q${q}`;
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
 *  can be large enough that Supabase's default row cap applies. */
async function fetchLotsForAuctions(auctionIds: string[], columns: string): Promise<LotRow[]> {
  if (auctionIds.length === 0) return [];
  const pageSize = 1000;
  const results: LotRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await auctionSupabase
      .from('lots')
      .select(columns)
      .in('auction_id', auctionIds)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    results.push(...(data as unknown as LotRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return results;
}

function computeSellThroughFromLots(lots: LotRow[], category: Category): number | null {
  const filtered = category === 'Company' ? lots : lots.filter((l) => l.category === category);
  if (filtered.length === 0) return null;
  const sold = filtered.filter((l) => l.sold === true).length;
  return (sold / filtered.length) * 100;
}

function computeVendorCommissionFromLots(lots: LotRow[], category: Category): number | null {
  const filtered = (category === 'Company' ? lots : lots.filter((l) => l.category === category)).filter(
    (l) => l.sold === true
  );
  if (filtered.length === 0) return null;
  let totalHammer = 0;
  let totalCommission = 0;
  for (const lot of filtered) {
    const hammer = Number(lot.hammer_price) || 0;
    const rate = parseCommissionRate(lot.commission_rate);
    totalHammer += hammer;
    totalCommission += hammer * rate;
  }
  if (totalHammer === 0) return null;
  return (totalCommission / totalHammer) * 100;
}

// --- single metric, single category/quarter (used by the per-KPI "Pull latest" button) ---

export async function fetchAuctionMetric(
  kpi: SyncableKpi,
  category: Category,
  quarter: string
): Promise<number | null> {
  const auctionIds = await auctionIdsInQuarter(quarter);
  const lots = await fetchLotsForAuctions(auctionIds, 'category, sold, hammer_price, commission_rate');
  if (lots.length === 0) return null;
  if (kpi === 'sell-through-rate') return computeSellThroughFromLots(lots, category);
  if (kpi === 'vendor-commission') return computeVendorCommissionFromLots(lots, category);
  return null;
}

// --- bulk sync: every syncable KPI, every category, every quarter with real data ---

export interface SyncAllRow {
  kpi: SyncableKpi;
  category: Category;
  quarter: string;
  value: number;
}

/** Every quarter that has at least one auction on record, oldest first. */
export async function listQuartersWithData(): Promise<string[]> {
  const { data, error } = await auctionSupabase.from('auctions').select('date');
  if (error) throw error;
  const quarters = new Set<string>();
  for (const row of data ?? []) {
    if (row.date) quarters.add(dateStringToQuarter(row.date as string));
  }
  return Array.from(quarters).sort();
}

/** Computes every KPI × category value for every quarter with data, fetching
 *  each quarter's lots only once (not once per category/KPI) to keep this
 *  fast even across a full auction history. Does not write anything — the
 *  caller decides how to persist the results. */
export async function computeAllAuctionMetrics(): Promise<{ quarters: string[]; rows: SyncAllRow[] }> {
  const quarters = await listQuartersWithData();
  const rows: SyncAllRow[] = [];

  for (const quarter of quarters) {
    const auctionIds = await auctionIdsInQuarter(quarter);
    const lots = await fetchLotsForAuctions(auctionIds, 'category, sold, hammer_price, commission_rate');
    if (lots.length === 0) continue;

    for (const category of CATEGORIES) {
      const sellThrough = computeSellThroughFromLots(lots, category);
      if (sellThrough !== null) {
        rows.push({ kpi: 'sell-through-rate', category, quarter, value: sellThrough });
      }
      const vendorCommission = computeVendorCommissionFromLots(lots, category);
      if (vendorCommission !== null) {
        rows.push({ kpi: 'vendor-commission', category, quarter, value: vendorCommission });
      }
    }
  }

  return { quarters, rows };
}

export { SYNCABLE_KPIS };

// --- Market Share: hammer value & lots offered snapshot ---
//
// True "market share versus key competitors" needs an external
// market-size benchmark sg-auctions doesn't have, so rather than fake a
// percentage, this pulls the underlying numbers (hammer value, lots
// offered) for the quarter — company overall and each category — so
// whoever owns Market Share can see the same breakdown sg-auctions
// shows and decide the figure to enter by hand.

export interface AuctionSnapshotRow {
  category: Category;
  hammerValue: number;
  lotsOffered: number;
}

export async function fetchMarketShareSnapshot(quarter: string): Promise<AuctionSnapshotRow[]> {
  const auctionIds = await auctionIdsInQuarter(quarter);
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