import { NextRequest, NextResponse } from 'next/server';
import { deleteEntry } from '@/lib/kpi-service';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await deleteEntry(params.id);
  return NextResponse.json({ ok: true });
}
