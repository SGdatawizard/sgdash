'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { Area, KpiWithEntries } from '@/lib/types';
import { computeKpi } from '@/lib/status';
import KpiCard from './KpiCard';

const AREAS: Area[] = ['Commercial', 'Customer', 'Cash'];

export default function DashboardClient({ kpis }: { kpis: KpiWithEntries[] }) {
  const [filter, setFilter] = useState<Area | 'All'>('All');

  const summary = useMemo(() => {
    const computed = kpis.map((k) => computeKpi(k));
    return {
      onTrack: computed.filter((c) => c.status === 'on-track').length,
      behind: computed.filter((c) => c.status === 'behind').length,
      flat: computed.filter((c) => c.status === 'at-risk').length,
      noData: computed.filter((c) => c.status === 'no-data').length,
      total: kpis.length,
    };
  }, [kpis]);

  const visibleKpis = filter === 'All' ? kpis : kpis.filter((k) => k.area === filter);
  const grouped = AREAS.map((area) => ({
    area,
    items: visibleKpis.filter((k) => k.area === area),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-10 py-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-wide2 text-gold-dark mb-1">2026 Business Plan</div>
          <h1 className="font-display text-3xl md:text-4xl text-navy">KPI Performance Room</h1>
          <p className="text-sm text-ink/60 mt-1.5 max-w-xl">
            Quarter-on-quarter progress against this year&rsquo;s commercial, customer and cash targets.
          </p>
        </div>
        <div className="flex gap-6">
          <SummaryStat label="On track" value={summary.onTrack} color="text-good" />
          <SummaryStat label="Flat" value={summary.flat} color="text-gold-dark" />
          <SummaryStat label="Behind" value={summary.behind} color="text-bad" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {(['All', ...AREAS] as const).map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={clsx(
              'px-3.5 py-1.5 text-xs uppercase tracking-wide2 rounded-full border transition-colors',
              filter === a
                ? 'bg-navy text-white border-navy'
                : 'bg-transparent text-navy/70 border-line hover:border-navy/40'
            )}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="space-y-12">
        {grouped.map((g) => (
          <section key={g.area}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-display text-xl text-navy">{g.area}</h2>
              <div className="flex-1 perf perf-canvas" aria-hidden />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {g.items.map((k) => (
                <KpiCard key={k.id} kpi={k} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-right">
      <div className={clsx('font-data text-2xl leading-none', color)}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide2 text-ink/45 mt-1">{label}</div>
    </div>
  );
}
