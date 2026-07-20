import { NextRequest, NextResponse } from 'next/server';
import { getAllKpis, createKpi } from '@/lib/kpi-service';

export async function GET() {
  const kpis = await getAllKpis();
  return NextResponse.json(kpis);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const required = ['area', 'name', 'unit', 'direction', 'targetLabel', 'measure', 'method'];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }
  const kpi = await createKpi({
    area: body.area,
    name: body.name,
    unit: body.unit,
    direction: body.direction,
    targetLabel: body.targetLabel,
    measure: body.measure,
    method: body.method,
    targetValue: body.targetValue ?? null,
    sortOrder: body.sortOrder ?? 99,
  });
  return NextResponse.json(kpi, { status: 201 });
}
