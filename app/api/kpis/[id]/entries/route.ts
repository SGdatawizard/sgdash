import { NextRequest, NextResponse } from 'next/server';
import { addEntry } from '@/lib/kpi-service';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (body.quarter === undefined || body.value === undefined) {
    return NextResponse.json({ error: 'quarter and value are required' }, { status: 400 });
  }
  const entry = await addEntry({
    kpiId: params.id,
    quarter: body.quarter,
    category: body.category ?? 'Company',
    value: Number(body.value),
    note: body.note ?? null,
  });
  return NextResponse.json(entry, { status: 201 });
}