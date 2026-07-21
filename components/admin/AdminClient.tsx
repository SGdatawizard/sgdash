'use client';

import { useCallback, useState } from 'react';
import type { KpiWithData } from '@/lib/types';
import KpiAdminCard from './KpiAdminCard';
import NewKpiForm from './NewKpiForm';

interface SyncAllResult {
  ok: boolean;
  quartersFound?: string[];
  attempted?: number;
  saved?: number;
  errors?: string[];
  error?: string;
}

export default function AdminClient({ initialKpis }: { initialKpis: KpiWithData[] }) {
  const [kpis, setKpis] = useState(initialKpis);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncAllResult, setSyncAllResult] = useState<SyncAllResult | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/kpis', { cache: 'no-store' });
    setKpis(await res.json());
  }, []);

  async function removeKpi(id: string) {
    if (!confirm('Delete this KPI and all of its readings? This cannot be undone.')) return;
    await fetch(`/api/kpis/${id}`, { method: 'DELETE' });
    refresh();
  }

  async function syncAll() {
    if (
      !confirm(
        'Pull every quarter of Sell-Through Rate and Vendor Commission data from Auction Performance, for every category? This overwrites any existing readings for those KPIs/quarters/categories with freshly recalculated figures.'
      )
    ) {
      return;
    }
    setSyncingAll(true);
    setSyncAllResult(null);
    try {
      const res = await fetch('/api/sync-all', { method: 'POST' });
      const body: SyncAllResult = await res.json();
      setSyncAllResult(body);
      if (body.ok) refresh();
    } catch (err) {
      setSyncAllResult({ ok: false, error: (err as Error).message });
    } finally {
      setSyncingAll(false);
    }
  }

  return (
    <div className="w-full px-6 md:px-10 lg:px-16 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-wide2 text-gold-dark mb-1">Data Entry</div>
          <h1 className="font-display text-3xl text-navy">Update KPI readings</h1>
          <p className="text-sm text-ink/60 mt-1.5 max-w-xl">
            Record each quarter&rsquo;s figure per KPI. Changes appear on the dashboard immediately.
          </p>
        </div>
        <div className="text-right">
          <button
            onClick={syncAll}
            disabled={syncingAll}
            className="bg-navy text-white text-xs uppercase tracking-wide2 px-5 py-3 rounded-sm hover:bg-navy-light disabled:opacity-50 transition-colors"
          >
            {syncingAll ? 'Syncing every quarter…' : 'Sync all from Auction Performance'}
          </button>
          <p className="text-[11px] text-ink/40 mt-1.5 max-w-[240px]">
            Pulls Sell-Through Rate &amp; Vendor Commission for every category and every quarter with real data.
          </p>
        </div>
      </div>

      {syncAllResult && (
        <div
          className={`mb-8 rounded-sm border px-5 py-4 text-sm ${
            syncAllResult.ok ? 'border-good/30 bg-good/5' : 'border-bad/30 bg-bad/5'
          }`}
        >
          {syncAllResult.ok ? (
            <>
              <p className="font-medium text-navy">
                Synced {syncAllResult.saved} of {syncAllResult.attempted} readings across{' '}
                {syncAllResult.quartersFound?.length ?? 0} quarter
                {syncAllResult.quartersFound?.length === 1 ? '' : 's'} with auction data.
              </p>
              {syncAllResult.quartersFound && syncAllResult.quartersFound.length > 0 && (
                <p className="text-ink/50 text-xs mt-1">Quarters: {syncAllResult.quartersFound.join(', ')}</p>
              )}
              {syncAllResult.errors && syncAllResult.errors.length > 0 && (
                <div className="mt-2 text-bad text-xs">
                  <p className="font-medium">{syncAllResult.errors.length} row(s) failed to save:</p>
                  <ul className="list-disc list-inside">
                    {syncAllResult.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-bad">{syncAllResult.error ?? 'Sync failed.'}</p>
          )}
        </div>
      )}

      <div className="space-y-6">
        {kpis.map((k) => (
          <KpiAdminCard key={k.id} kpi={k} onChanged={refresh} onDeleteKpi={removeKpi} />
        ))}
        <NewKpiForm onCreated={refresh} />
      </div>
    </div>
  );
}