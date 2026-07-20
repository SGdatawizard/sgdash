import { randomUUID } from 'crypto';
import { supabase } from './supabase';
import type { Kpi, KpiEntry, KpiWithData, Target, Category } from './types';

// --- row <-> domain-type mapping (Postgres columns are snake_case) ---

interface KpiRow {
  id: string;
  area: string;
  name: string;
  unit: string;
  direction: string;
  target_label: string;
  measure: string;
  method: string;
  sort_order: number;
}

interface EntryRow {
  id: string;
  kpi_id: string;
  quarter: string;
  category: string;
  value: number;
  note: string | null;
  created_at: string;
}

interface TargetRow {
  id: string;
  kpi_id: string;
  category: string;
  target_value: number;
  updated_at: string;
}

function kpiFromRow(r: KpiRow): Kpi {
  return {
    id: r.id,
    area: r.area as Kpi['area'],
    name: r.name,
    unit: r.unit as Kpi['unit'],
    direction: r.direction as Kpi['direction'],
    targetLabel: r.target_label,
    measure: r.measure,
    method: r.method,
    sortOrder: r.sort_order,
  };
}

function entryFromRow(r: EntryRow): KpiEntry {
  return {
    id: r.id,
    kpiId: r.kpi_id,
    quarter: r.quarter,
    category: r.category as Category,
    value: Number(r.value),
    note: r.note,
    createdAt: r.created_at,
  };
}

function targetFromRow(r: TargetRow): Target {
  return {
    id: r.id,
    kpiId: r.kpi_id,
    category: r.category as Category,
    targetValue: Number(r.target_value),
    updatedAt: r.updated_at,
  };
}

function slugify(name: string): string {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return slug || randomUUID();
}

// --- reads ---

export async function getAllKpis(): Promise<KpiWithData[]> {
  const { data: kpiRows, error: kpiError } = await supabase
    .from('kpis')
    .select('*')
    .order('sort_order', { ascending: true });
  if (kpiError) throw kpiError;

  const { data: entryRows, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .order('quarter', { ascending: true });
  if (entryError) throw entryError;

  const { data: targetRows, error: targetError } = await supabase
    .from('targets')
    .select('*');
  if (targetError) throw targetError;

  const entriesByKpi = new Map<string, EntryRow[]>();
  for (const e of entryRows ?? []) {
    const list = entriesByKpi.get(e.kpi_id) ?? [];
    list.push(e);
    entriesByKpi.set(e.kpi_id, list);
  }

  const targetsByKpi = new Map<string, TargetRow[]>();
  for (const t of targetRows ?? []) {
    const list = targetsByKpi.get(t.kpi_id) ?? [];
    list.push(t);
    targetsByKpi.set(t.kpi_id, list);
  }

  return (kpiRows ?? []).map((k) => ({
    ...kpiFromRow(k),
    entries: (entriesByKpi.get(k.id) ?? []).map(entryFromRow),
    targets: (targetsByKpi.get(k.id) ?? []).map(targetFromRow),
  }));
}

export async function getKpi(id: string): Promise<KpiWithData | null> {
  const { data: kpiRow, error: kpiError } = await supabase
    .from('kpis')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (kpiError) throw kpiError;
  if (!kpiRow) return null;

  const { data: entryRows, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .eq('kpi_id', id)
    .order('quarter', { ascending: true });
  if (entryError) throw entryError;

  const { data: targetRows, error: targetError } = await supabase
    .from('targets')
    .select('*')
    .eq('kpi_id', id);
  if (targetError) throw targetError;

  return {
    ...kpiFromRow(kpiRow),
    entries: (entryRows ?? []).map(entryFromRow),
    targets: (targetRows ?? []).map(targetFromRow),
  };
}

// --- writes: KPIs ---

export async function createKpi(input: Omit<Kpi, 'id'>): Promise<Kpi> {
  const id = slugify(input.name);
  const { data, error } = await supabase
    .from('kpis')
    .insert({
      id,
      area: input.area,
      name: input.name,
      unit: input.unit,
      direction: input.direction,
      target_label: input.targetLabel,
      measure: input.measure,
      method: input.method,
      sort_order: input.sortOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return kpiFromRow(data);
}

export async function updateKpi(id: string, input: Partial<Omit<Kpi, 'id'>>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (input.area !== undefined) patch.area = input.area;
  if (input.name !== undefined) patch.name = input.name;
  if (input.unit !== undefined) patch.unit = input.unit;
  if (input.direction !== undefined) patch.direction = input.direction;
  if (input.targetLabel !== undefined) patch.target_label = input.targetLabel;
  if (input.measure !== undefined) patch.measure = input.measure;
  if (input.method !== undefined) patch.method = input.method;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { error } = await supabase.from('kpis').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteKpi(id: string): Promise<void> {
  // entries.kpi_id and targets.kpi_id both cascade, so this removes
  // its readings and targets too
  const { error } = await supabase.from('kpis').delete().eq('id', id);
  if (error) throw error;
}

// --- writes: quarterly readings ---

export async function addEntry(
  input: Omit<KpiEntry, 'id' | 'createdAt'>
): Promise<KpiEntry> {
  // One reading per KPI + quarter + category — re-saving overwrites it.
  const { data, error } = await supabase
    .from('entries')
    .upsert(
      {
        kpi_id: input.kpiId,
        quarter: input.quarter,
        category: input.category,
        value: input.value,
        note: input.note,
      },
      { onConflict: 'kpi_id,quarter,category' }
    )
    .select()
    .single();
  if (error) throw error;
  return entryFromRow(data);
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('entries').delete().eq('id', id);
  if (error) throw error;
}

// --- writes: targets ---

export async function setTarget(
  kpiId: string,
  category: Category,
  targetValue: number
): Promise<Target> {
  const { data, error } = await supabase
    .from('targets')
    .upsert(
      { kpi_id: kpiId, category, target_value: targetValue, updated_at: new Date().toISOString() },
      { onConflict: 'kpi_id,category' }
    )
    .select()
    .single();
  if (error) throw error;
  return targetFromRow(data);
}

export async function deleteTarget(kpiId: string, category: Category): Promise<void> {
  const { error } = await supabase.from('targets').delete().eq('kpi_id', kpiId).eq('category', category);
  if (error) throw error;
}