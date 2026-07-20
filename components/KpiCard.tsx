'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { KpiWithEntries } from '@/lib/types';
import { computeKpi, STATUS_COLOR } from '@/lib/status';
import StatusBadge from './StatusBadge';

function formatValue(v: number, unit: KpiWithEntries['unit']) {
  if (unit === '%') return `${v.toFixed(1)}%`;
  if (unit === 'pts') return `${v.toFixed(0)} pts`;
  if (unit === '£') return `£${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `${v.toFixed(0)}`;
}

function formatDelta(delta: number, unit: KpiWithEntries['unit']) {
  const sign = delta > 0 ? '+' : '';
  if (unit === '%') return `${sign}${delta.toFixed(1)} pts`;
  return `${sign}${formatValue(delta, unit)}`;
}

export default function KpiCard({ kpi }: { kpi: KpiWithEntries }) {
  const [open, setOpen] = useState(false);
  const c = computeKpi(kpi);
  const chartData = kpi.entries.map((e) => ({ quarter: e.quarter.replace('20', "'"), value: e.value }));

  return (
    <div className="bg-paper rounded-sm shadow-card overflow-hidden flex flex-col">
      <div className="bg-navy px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide2 text-gold/80 mb-1">{kpi.area}</div>
            <h3 className="font-display text-lg text-white leading-snug">{kpi.name}</h3>
          </div>
        </div>
      </div>
      <div className="perf perf-navy -mt-px" aria-hidden />

      <div className="px-5 pt-4 pb-5 flex-1 flex flex-col">
        {c.status === 'no-data' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-2">
            <div className="h-8 w-8 rounded-full border border-dashed border-ink/25" />
            <p className="text-sm text-ink/60 max-w-[220px]">
              Tracking hasn&rsquo;t started yet. Add the first quarterly reading in Data Entry to begin the trend.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between gap-4 mb-1">
              <div>
                <div className="font-data text-3xl text-navy leading-none">
                  {formatValue(c.latest!, kpi.unit)}
                </div>
                <div className="mt-1.5">
                  <StatusBadge status={c.status} />
                </div>
              </div>
              {c.deltaVsPrevious !== null && (
                <div
                  className={clsx(
                    'text-sm font-medium text-right',
                    STATUS_COLOR[c.status]
                  )}
                >
                  {formatDelta(c.deltaVsPrevious, kpi.unit)}
                  <div className="text-[10px] uppercase tracking-wide2 text-ink/40 font-normal">vs prior qtr</div>
                </div>
              )}
            </div>

            <div className="h-24 -mx-2 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B8934A" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#B8934A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="quarter"
                    tick={{ fontSize: 10, fill: '#1A1D26', opacity: 0.45 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 2,
                      borderColor: '#E4DECD',
                      fontFamily: 'var(--font-body)',
                    }}
                    formatter={(v: number) => [formatValue(v, kpi.unit), 'Value']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#B8934A"
                    strokeWidth={2}
                    fill={`url(#grad-${kpi.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-3 text-left text-[11px] uppercase tracking-wide2 text-navy/70 hover:text-navy font-medium flex items-center gap-1 self-start"
        >
          {open ? 'Hide detail' : '2026 target & method'}
          <span className={clsx('transition-transform', open && 'rotate-180')}>&darr;</span>
        </button>

        {open && (
          <div className="mt-3 pt-3 border-t border-line space-y-2.5 text-sm text-ink/75">
            <div>
              <div className="text-[10px] uppercase tracking-wide2 text-ink/40 mb-0.5">2026 Target</div>
              <p>{kpi.targetLabel}</p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide2 text-ink/40 mb-0.5">Measure (quarterly)</div>
              <p>{kpi.measure}</p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide2 text-ink/40 mb-0.5">Method</div>
              <p>{kpi.method}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
