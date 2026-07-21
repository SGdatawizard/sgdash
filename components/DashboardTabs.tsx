'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { KpiWithData } from '@/lib/types';
import { computeCategory, STATUS_DOT } from '@/lib/status';
import KpiDetail from './KpiDetail';

export default function DashboardTabs({ kpis }: { kpis: KpiWithData[] }) {
  const [activeId, setActiveId] = useState(kpis[0]?.id ?? '');

  // Headline status shown next to each tab is the Company-wide reading —
  // switch category inside a KPI's own detail panel to see the rest.
  const withStatus = useMemo(
    () => kpis.map((k) => ({ kpi: k, status: computeCategory(k, 'Company').status })),
    [kpis]
  );

  const summary = useMemo(() => {
    const statuses = withStatus.map((w) => w.status);
    return {
      onTrack: statuses.filter((s) => s === 'on-track').length,
      flat: statuses.filter((s) => s === 'at-risk').length,
      behind: statuses.filter((s) => s === 'behind').length,
    };
  }, [withStatus]);

  const active = kpis.find((k) => k.id === activeId) ?? kpis[0];

  const groupedByArea = useMemo(() => {
    const areas: KpiWithData['area'][] = ['Commercial', 'Customer', 'Cash'];
    return areas
      .map((area) => ({ area, items: withStatus.filter((w) => w.kpi.area === area) }))
      .filter((g) => g.items.length > 0);
  }, [withStatus]);

  if (!active) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-ink/50">
        No KPIs yet — add one from Data Entry.
      </div>
    );
  }

  return (
    <div className="w-full px-6 md:px-10 lg:px-16 py-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-wide2 text-gold-dark mb-1">2026 Business Plan</div>
          <h1 className="font-display text-3xl md:text-4xl text-navy">KPI Performance Room</h1>
          <p className="text-sm text-ink/60 mt-1.5 max-w-xl">
            Company-wide standing, quarter on quarter. Select a KPI to see its Stamps / Coins /
            Pop Culture breakdown.
          </p>
        </div>
        <div className="flex gap-6">
          <SummaryStat label="On track" value={summary.onTrack} color="text-good" />
          <SummaryStat label="Flat" value={summary.flat} color="text-gold-dark" />
          <SummaryStat label="Behind" value={summary.behind} color="text-bad" />
        </div>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        <nav className="space-y-6">
          {groupedByArea.map((g) => (
            <div key={g.area}>
              <div className="text-[10px] uppercase tracking-wide2 text-ink/40 mb-2 px-1">{g.area}</div>
              <div className="space-y-0.5">
                {g.items.map(({ kpi, status }) => (
                  <button
                    key={kpi.id}
                    onClick={() => setActiveId(kpi.id)}
                    className={clsx(
                      'w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-sm text-sm transition-colors',
                      activeId === kpi.id
                        ? 'bg-navy text-white'
                        : 'text-ink/70 hover:bg-paper hover:text-navy'
                    )}
                  >
                    <span className={clsx('h-1.5 w-1.5 rounded-full shrink-0', STATUS_DOT[status])} />
                    <span className="truncate">{kpi.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div key={active.id}>
          <KpiDetail kpi={active} />
        </div>
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