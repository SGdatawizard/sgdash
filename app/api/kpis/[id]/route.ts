import { NextRequest, NextResponse } from 'next/server';
import { getKpi, updateKpi, deleteKpi } from '@/lib/kpi-service';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const kpi = await getKpi(params.id);
  if (!kpi) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(kpi);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  try {
    await updateKpi(params.id, body);
    return NextResponse.json(await getKpi(params.id));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await deleteKpi(params.id);
  return NextResponse.json({ ok: true });
}
