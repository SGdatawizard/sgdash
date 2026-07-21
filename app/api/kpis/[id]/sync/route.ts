import { NextRequest, NextResponse } from 'next/server';
import { addEntry } from '@/lib/kpi-service';
import { fetchAuctionMetric, type SyncableKpi } from '@/lib/auction-sync';
import type { Category } from '@/lib/types';

const SYNCABLE: SyncableKpi[] = ['sell-through-rate', 'vendor-commission'];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!SYNCABLE.includes(params.id as SyncableKpi)) {
    return NextResponse.json({ error: 'This KPI has no Auction Performance sync configured.' }, { status: 400 });
  }
  const body = await req.json();
  const category = (body.category ?? 'Company') as Category;
  const quarter = body.quarter as string;
  if (!quarter) {
    return NextResponse.json({ error: 'quarter is required' }, { status: 400 });
  }

  try {
    const value = await fetchAuctionMetric(params.id as SyncableKpi, category, quarter);
    if (value === null) {
      return NextResponse.json({ error: 'No matching data found in Auction Performance for that quarter/category.' }, { status: 404 });
    }
    const entry = await addEntry({ kpiId: params.id, quarter, category, value, note: 'Synced from Auction Performance' });
    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 501 });
  }
}