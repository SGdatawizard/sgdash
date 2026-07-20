'use client';

import { useState } from 'react';
import type { KpiWithEntries } from '@/lib/types';
import { QUARTERS } from '@/lib/types';

export default function KpiAdminCard({
  kpi,
  onChanged,
  onDeleteKpi,
}: {
  kpi: KpiWithEntries;
  onChanged: () => void;
  onDeleteKpi: (id: string) => void;
}) {
  const [quarter, setQuarter] = useState(QUARTERS[QUARTERS.length - 1]);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitEntry(e: React.FormEvent) {
    e.preventDefault();
    if (value === '' || isNaN(Number(value))) {
      setError('Enter a numeric value.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/kpis/${kpi.id}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quarter, value: Number(value), note: note || null }),
      });
      if (!res.ok) throw new Error('Save failed');
      setValue('');
      setNote('');
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(entryId: string) {
    if (!confirm('Remove this reading?')) return;
    await fetch(`/api/entries/${entryId}`, { method: 'DELETE' });
    onChanged();
  }

  return (
    <div className="bg-paper rounded-sm shadow-card overflow-hidden">
      <div className="bg-navy px-5 py-3.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wide2 text-gold/80">{kpi.area}</div>
          <h3 className="font-display text-base text-white">{kpi.name}</h3>
        </div>
        <button
          onClick={() => onDeleteKpi(kpi.id)}
          className="text-[10px] uppercase tracking-wide2 text-white/50 hover:text-white/90"
        >
          Delete KPI
        </button>
      </div>
      <div className="perf perf-navy -mt-px" aria-hidden />

      <div className="p-5 grid md:grid-cols-2 gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-wide2 text-ink/40 mb-2">Add a quarterly reading</div>
          <form onSubmit={submitEntry} className="space-y-3">
            <div className="flex gap-3">
              <select
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                className="flex-1 border border-line rounded-sm px-2.5 py-2 text-sm bg-canvas"
              >
                {QUARTERS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Value (${kpi.unit})`}
                inputMode="decimal"
                className="flex-1 border border-line rounded-sm px-2.5 py-2 text-sm bg-canvas font-data"
              />
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="w-full border border-line rounded-sm px-2.5 py-2 text-sm bg-canvas"
            />
            {error && <p className="text-xs text-bad">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="bg-navy text-white text-xs uppercase tracking-wide2 px-4 py-2 rounded-sm hover:bg-navy-light disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save reading'}
            </button>
            <p className="text-[11px] text-ink/40">
              Saving to a quarter that already has a value will overwrite it.
            </p>
          </form>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wide2 text-ink/40 mb-2">History</div>
          {kpi.entries.length === 0 ? (
            <p className="text-sm text-ink/50">No readings yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-thin pr-1">
              {[...kpi.entries].reverse().map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between text-sm border-b border-line/70 pb-1.5"
                >
                  <div>
                    <span className="font-data text-navy">{e.quarter}</span>
                    <span className="ml-3 font-data">{e.value}{kpi.unit === '%' ? '%' : ''}</span>
                    {e.note && <span className="ml-3 text-ink/40 text-xs italic">{e.note}</span>}
                  </div>
                  <button
                    onClick={() => removeEntry(e.id)}
                    className="text-ink/30 hover:text-bad text-xs"
                    aria-label={`Remove ${e.quarter} reading`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
