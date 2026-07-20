'use client';

import { useCallback, useState } from 'react';
import type { KpiWithData } from '@/lib/types';
import KpiAdminCard from './KpiAdminCard';
import NewKpiForm from './NewKpiForm';

export default function AdminClient({ initialKpis }: { initialKpis: KpiWithData[] }) {
  const [kpis, setKpis] = useState(initialKpis);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/kpis', { cache: 'no-store' });
    setKpis(await res.json());
  }, []);

  async function removeKpi(id: string) {
    if (!confirm('Delete this KPI and all of its readings? This cannot be undone.')) return;
    await fetch(`/api/kpis/${id}`, { method: 'DELETE' });
    refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-6 md:px-10 py-10">
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-wide2 text-gold-dark mb-1">Data Entry</div>
        <h1 className="font-display text-3xl text-navy">Update KPI readings</h1>
        <p className="text-sm text-ink/60 mt-1.5 max-w-xl">
          Record each quarter&rsquo;s figure per KPI, by category. Changes appear on the dashboard immediately.
        </p>
      </div>

      <div className="space-y-6">
        {kpis.map((k) => (
          <KpiAdminCard key={k.id} kpi={k} onChanged={refresh} onDeleteKpi={removeKpi} />
        ))}
        <NewKpiForm onCreated={refresh} />
      </div>
    </div>
  );
}