import { randomUUID } from 'crypto';
import { supabase } from './supabase';
import type { Kpi, KpiEntry, KpiWithEntries } from './types';

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
  target_value: number | null;
  sort_order: number;
}

interface EntryRow {
  id: string;
  kpi_id: string;
  quarter: string;
  value: number;
  note: string | null;
  created_at: string;
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
    targetValue: r.target_value,
    sortOrder: r.sort_order,
  };
}

function entryFromRow(r: EntryRow): KpiEntry {
  return {
    id: r.id,
    kpiId: r.kpi_id,
    quarter: r.quarter,
    value: Number(r.value),
    note: r.note,
    createdAt: r.created_at,
  };
}

function slugify(name: string): string {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return slug || randomUUID();
}

// --- reads ---

export async function getAllKpis(): Promise<KpiWithEntries[]> {
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

  const entriesByKpi = new Map<string, EntryRow[]>();
  for (const e of entryRows ?? []) {
    const list = entriesByKpi.get(e.kpi_id) ?? [];
    list.push(e);
    entriesByKpi.set(e.kpi_id, list);
  }

  return (kpiRows ?? []).map((k) => ({
    ...kpiFromRow(k),
    entries: (entriesByKpi.get(k.id) ?? []).map(entryFromRow),
  }));
}

export async function getKpi(id: string): Promise<KpiWithEntries | null> {
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

  return { ...kpiFromRow(kpiRow), entries: (entryRows ?? []).map(entryFromRow) };
}

// --- writes ---

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
      target_value: input.targetValue,
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
  if (input.targetValue !== undefined) patch.target_value = input.targetValue;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { error } = await supabase.from('kpis').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteKpi(id: string): Promise<void> {
  // entries.kpi_id has ON DELETE CASCADE, so this removes its readings too
  const { error } = await supabase.from('kpis').delete().eq('id', id);
  if (error) throw error;
}

export async function addEntry(input: Omit<KpiEntry, 'id' | 'createdAt'>): Promise<KpiEntry> {
  // One reading per KPI per quarter — re-saving the same quarter overwrites it.
  const { data, error } = await supabase
    .from('entries')
    .upsert(
      { kpi_id: input.kpiId, quarter: input.quarter, value: input.value, note: input.note },
      { onConflict: 'kpi_id,quarter' }
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
