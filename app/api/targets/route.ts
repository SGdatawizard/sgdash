import { NextRequest, NextResponse } from 'next/server';
import { setTarget } from '@/lib/kpi-service';
import type { Category } from '@/lib/types';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (!body.category || body.targetValue === undefined || body.targetValue === null || isNaN(Number(body.targetValue))) {
    return NextResponse.json({ error: 'category and a numeric targetValue are required' }, { status: 400 });
  }
  const target = await setTarget(params.id, body.category as Category, Number(body.targetValue));
  return NextResponse.json(target, { status: 201 });
}