'use client';

import { useState } from 'react';
import type { Area, Direction, Unit } from '@/lib/types';

const AREAS: Area[] = ['Commercial', 'Customer', 'Cash'];
const UNITS: Unit[] = ['%', 'count', 'pts', '£'];

const empty = {
  area: 'Commercial' as Area,
  name: '',
  unit: '%' as Unit,
  direction: 'increase' as Direction,
  targetLabel: '',
  measure: '',
  method: '',
};

export default function NewKpiForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof empty>(key: K, val: (typeof empty)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.targetLabel || !form.measure || !form.method) {
      setError('Fill in name, target, measure and method.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, targetValue: null, sortOrder: 99 }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Could not create KPI');
      setForm(empty);
      setOpen(false);
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border border-dashed border-navy/30 text-navy/70 hover:border-navy/60 hover:text-navy rounded-sm px-5 py-3 text-xs uppercase tracking-wide2 w-full text-left"
      >
        + Add a new KPI
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="bg-paper rounded-sm shadow-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-navy">New KPI</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink/40 hover:text-ink/70">
          Cancel
        </button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <select value={form.area} onChange={(e) => set('area', e.target.value as Area)} className="border border-line rounded-sm px-2.5 py-2 text-sm bg-canvas">
          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="KPI name"
          className="sm:col-span-2 border border-line rounded-sm px-2.5 py-2 text-sm bg-canvas"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <select value={form.unit} onChange={(e) => set('unit', e.target.value as Unit)} className="border border-line rounded-sm px-2.5 py-2 text-sm bg-canvas">
          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={form.direction} onChange={(e) => set('direction', e.target.value as Direction)} className="border border-line rounded-sm px-2.5 py-2 text-sm bg-canvas">
          <option value="increase">Higher is better</option>
          <option value="decrease">Lower is better</option>
        </select>
      </div>
      <textarea
        value={form.targetLabel}
        onChange={(e) => set('targetLabel', e.target.value)}
        placeholder="2026 target (qualitative description)"
        className="w-full border border-line rounded-sm px-2.5 py-2 text-sm bg-canvas"
        rows={2}
      />
      <textarea
        value={form.measure}
        onChange={(e) => set('measure', e.target.value)}
        placeholder="Measure (quarterly)"
        className="w-full border border-line rounded-sm px-2.5 py-2 text-sm bg-canvas"
        rows={2}
      />
      <textarea
        value={form.method}
        onChange={(e) => set('method', e.target.value)}
        placeholder="Method"
        className="w-full border border-line rounded-sm px-2.5 py-2 text-sm bg-canvas"
        rows={2}
      />
      {error && <p className="text-xs text-bad">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="bg-gold text-navy font-medium text-xs uppercase tracking-wide2 px-4 py-2 rounded-sm hover:bg-gold-light disabled:opacity-50"
      >
        {saving ? 'Creating…' : 'Create KPI'}
      </button>
    </form>
  );
}
