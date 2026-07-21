import { NextResponse } from 'next/server';
import { computeAllAuctionMetrics } from '@/lib/auction-sync';
import { addEntry } from '@/lib/kpi-service';

// Bulk sync: pulls every quarter that has real auction data in
// sg-auctions and writes Sell-Through Rate + Vendor Commission for
// every category (Company, Stamps, Coins, Pop Culture) in one go.
// Existing readings for KPIs/quarters this doesn't touch (Aged Debtors,
// NPS, Market Share, and any quarter with no auction data) are left
// completely alone — this only overwrites quarters it actually
// recomputes a fresh value for.
export async function POST() {
  try {
    const { quarters, rows } = await computeAllAuctionMetrics();

    let saved = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        await addEntry({
          kpiId: row.kpi,
          quarter: row.quarter,
          category: row.category,
          value: row.value,
          note: 'Synced from Auction Performance',
        });
        saved++;
      } catch (e) {
        errors.push(`${row.kpi} / ${row.category} / ${row.quarter}: ${(e as Error).message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      quartersFound: quarters,
      attempted: rows.length,
      saved,
      errors,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}