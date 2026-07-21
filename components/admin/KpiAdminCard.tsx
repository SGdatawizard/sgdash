'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { Category, KpiWithData } from '@/lib/types';
import { CATEGORIES, QUARTERS } from '@/lib/types';

export default function KpiAdminCard({
  kpi,
  onChanged,
  onDeleteKpi,
}: {
  kpi: KpiWithData;
  onChanged: () => void;
  onDeleteKpi: (id: string) => void;
}) {
  const [quarter, setQuarter] = useState(QUARTERS[QUARTERS.length - 1]);
  const [category, setCategory] = useState<Category>('Company');
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
        body: JSON.stringify({ quarter, category, value: Number(value), note: note || null }),
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

  const syncable = kpi.id === 'sell-through-rate' || kpi.id === 'vendor-commission';
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function syncFromAuctionApp() {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/kpis/${kpi.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quarter, category }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Sync failed');
      onChanged();
    } catch (err) {
      setSyncError((err as Error).message);
    } finally {
      setSyncing(false);
    }
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
                {QUARTERS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="flex-1 border border-line rounded-sm px-2.5 py-2 text-sm bg-canvas"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Value (${kpi.unit})`}
              inputMode="decimal"
              className="w-full border border-line rounded-sm px-2.5 py-2 text-sm bg-canvas font-data"
            />
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
              Saving to a quarter + category that already has a value will overwrite it.
            </p>
          </form>

          {syncable && (
            <div className="mt-4 pt-4 border-t border-line">
              <button
                onClick={syncFromAuctionApp}
                disabled={syncing}
                className="text-xs uppercase tracking-wide2 px-4 py-2 rounded-sm border border-navy/30 text-navy hover:bg-navy hover:text-white disabled:opacity-50 transition-colors"
              >
                {syncing ? 'Pulling…' : 'Pull latest from Auction Performance'}
              </button>
              <p className="text-[11px] text-ink/40 mt-1.5">
                Pulls the {quarter} / {category} figure from your Auction Performance app instead of typing it in.
              </p>
              {syncError && <p className="text-xs text-bad mt-1.5">{syncError}</p>}
            </div>
          )}

          {kpi.id === 'market-share' && <MarketShareSnapshot quarter={quarter} />}

          <TargetsEditor kpi={kpi} onChanged={onChanged} />
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wide2 text-ink/40 mb-2">History</div>
          {kpi.entries.length === 0 ? (
            <p className="text-sm text-ink/50">No readings yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-[26rem] overflow-y-auto scrollbar-thin pr-1">
              {[...kpi.entries]
                .sort((a, b) => b.quarter.localeCompare(a.quarter) || a.category.localeCompare(b.category))
                .map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between text-sm border-b border-line/70 pb-1.5"
                  >
                    <div>
                      <span className="font-data text-navy">{e.quarter}</span>
                      <span className="ml-2 text-[10px] uppercase tracking-wide2 text-ink/40">{e.category}</span>
                      <span className="ml-3 font-data">{e.value}{kpi.unit === '%' ? '%' : ''}</span>
                      {e.note && <span className="ml-3 text-ink/40 text-xs italic">{e.note}</span>}
                    </div>
                    <button
                      onClick={() => removeEntry(e.id)}
                      className="text-ink/30 hover:text-bad text-xs"
                      aria-label={`Remove ${e.quarter} ${e.category} reading`}
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

function formatGBP(n: number): string {
  return `£${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function MarketShareSnapshot({ quarter }: { quarter: string }) {
  const [rows, setRows] = useState<{ category: string; hammerValue: number; lotsOffered: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auction-snapshot?quarter=${quarter}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Could not load snapshot');
      setRows(body);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-line">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wide2 text-ink/40">
          Auction snapshot — {quarter}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs uppercase tracking-wide2 px-3 py-1.5 rounded-sm border border-navy/30 text-navy hover:bg-navy hover:text-white disabled:opacity-50 transition-colors"
        >
          {loading ? 'Loading…' : rows ? 'Refresh' : 'Load from Auction Performance'}
        </button>
      </div>
      {error && <p className="text-xs text-bad mt-2">{error}</p>}
      {rows && (
        <table className="w-full mt-3 text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide2 text-ink/40 text-left">
              <th className="font-normal pb-1.5">Category</th>
              <th className="font-normal pb-1.5 text-right">Hammer value</th>
              <th className="font-normal pb-1.5 text-right">Lots offered</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.category} className="border-t border-line/70">
                <td className="py-1.5 text-navy font-medium">{r.category}</td>
                <td className="py-1.5 text-right font-data">{formatGBP(r.hammerValue)}</td>
                <td className="py-1.5 text-right font-data">{r.lotsOffered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-[11px] text-ink/40 mt-2">
        Informational only — enter whatever market share figure you land on into the field above by hand.
      </p>
    </div>
  );
}

function TargetsEditor({ kpi, onChanged }: { kpi: KpiWithData; onChanged: () => void }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingCategory, setSavingCategory] = useState<Category | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function draftFor(c: Category) {
    if (drafts[c] !== undefined) return drafts[c];
    const existing = kpi.targets.find((t) => t.category === c);
    return existing ? String(existing.targetValue) : '';
  }

  async function saveTarget(c: Category) {
    const val = draftFor(c);
    if (val === '' || isNaN(Number(val))) {
      setErrors((e) => ({ ...e, [c]: 'Enter a number first.' }));
      return;
    }
    setSavingCategory(c);
    setErrors((e) => ({ ...e, [c]: '' }));
    try {
      const res = await fetch(`/api/kpis/${kpi.id}/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: c, targetValue: Number(val) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Save failed (${res.status})`);
      onChanged();
    } catch (err) {
      setErrors((e) => ({ ...e, [c]: (err as Error).message }));
    } finally {
      setSavingCategory(null);
    }
  }

  return (
    <div className="mt-5 pt-4 border-t border-line">
      <div className="text-[10px] uppercase tracking-wide2 text-ink/40 mb-2">
        2026 targets ({kpi.unit})
      </div>
      <div className="space-y-2">
        {CATEGORIES.map((c) => (
          <div key={c}>
            <div className="flex items-center gap-2">
              <span className="w-24 text-xs text-ink/60 shrink-0">{c}</span>
              <input
                value={draftFor(c)}
                onChange={(e) => setDrafts((d) => ({ ...d, [c]: e.target.value }))}
                inputMode="decimal"
                placeholder="Not set"
                className="flex-1 border border-line rounded-sm px-2.5 py-1.5 text-sm bg-canvas font-data"
              />
              <button
                onClick={() => saveTarget(c)}
                disabled={savingCategory === c}
                className={clsx(
                  'text-[10px] uppercase tracking-wide2 px-3 py-1.5 rounded-sm shrink-0',
                  'bg-gold text-navy font-medium hover:bg-gold-light disabled:opacity-50'
                )}
              >
                {savingCategory === c ? 'Saving…' : 'Save'}
              </button>
            </div>
            {errors[c] && <p className="text-xs text-bad mt-1 ml-[6.5rem]">{errors[c]}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}