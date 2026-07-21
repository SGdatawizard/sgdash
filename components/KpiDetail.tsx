'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  ComposedChart, Area, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CATEGORIES } from '@/lib/types';
import type { Category, KpiWithData } from '@/lib/types';
import { computeCategory, STATUS_COLOR } from '@/lib/status';
import StatusBadge from './StatusBadge';

function formatValue(v: number, unit: KpiWithData['unit']) {
  if (unit === '%') return `${v.toFixed(1)}%`;
  if (unit === 'pts') return `${v.toFixed(0)} pts`;
  if (unit === '£') return `£${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `${v.toFixed(0)}`;
}

function formatDelta(delta: number, unit: KpiWithData['unit']) {
  const sign = delta > 0 ? '+' : '';
  return unit === '%' ? `${sign}${delta.toFixed(1)} pts` : `${sign}${formatValue(delta, unit)}`;
}

export default function KpiDetail({ kpi }: { kpi: KpiWithData }) {
  const [category, setCategory] = useState<Category>('Company');
  const [infoOpen, setInfoOpen] = useState(false);

  const computed = useMemo(() => computeCategory(kpi, category), [kpi, category]);
  const allCategories = useMemo(() => CATEGORIES.map((c) => computeCategory(kpi, c)), [kpi]);

  const chartData = computed.series.map((p) => ({
    quarter: p.quarter.replace('20', "'"),
    value: p.value,
  }));

  const hasReadings = computed.latest !== null;

  return (
    <div className="bg-paper rounded-sm shadow-card overflow-hidden">
      <div className="bg-navy px-6 md:px-8 pt-6 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide2 text-gold/80 mb-1">{kpi.area}</div>
            <h2 className="font-display text-2xl text-white leading-snug">{kpi.name}</h2>
          </div>
          <div className="flex gap-1.5 bg-navy-dark/60 rounded-full p-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={clsx(
                  'px-3.5 py-1.5 text-xs uppercase tracking-wide2 rounded-full transition-colors',
                  category === c ? 'bg-gold text-navy font-medium' : 'text-white/60 hover:text-white'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="perf perf-navy -mt-px" aria-hidden />

      <div className="px-6 md:px-8 py-6">
        <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
          <div className="min-w-[180px]">
            {hasReadings ? (
              <div className="font-data text-5xl text-navy leading-none">
                {formatValue(computed.latest!, kpi.unit)}
              </div>
            ) : (
              <div className="text-sm text-ink/40 italic max-w-[180px]">
                No {category === 'Company' ? 'company-wide' : category} readings yet
              </div>
            )}
            <div className="mt-3">
              <StatusBadge status={computed.status} />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {computed.deltaVsPrevious !== null && (
                <div className={clsx('font-medium', STATUS_COLOR[computed.status])}>
                  {formatDelta(computed.deltaVsPrevious, kpi.unit)}
                  <span className="text-ink/40 font-normal ml-1.5">vs prior qtr</span>
                </div>
              )}
              {computed.target !== null ? (
                <div className="text-ink/60">
                  Target: <span className="font-data text-navy">{formatValue(computed.target, kpi.unit)}</span>
                  {computed.progressPct !== null && (
                    <span className="ml-1.5 text-ink/40">({computed.progressPct.toFixed(0)}% of target)</span>
                  )}
                </div>
              ) : (
                <div className="text-ink/40 italic">No target set for {category} yet.</div>
              )}
            </div>
          </div>

          <div className="h-56">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${kpi.id}-${category}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B8934A" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#B8934A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="quarter"
                    tick={{ fontSize: 11, fill: '#1A1D26', opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 2, borderColor: '#E4DECD', fontFamily: 'var(--font-body)' }}
                    formatter={(v: number) => [formatValue(v, kpi.unit), 'Value']}
                  />
                  {computed.target !== null && (
                    <ReferenceLine
                      y={computed.target}
                      stroke="#132345"
                      strokeDasharray="4 4"
                      label={{ value: 'Target', position: 'insideTopRight', fontSize: 10, fill: '#132345' }}
                    />
                  )}
                  <Area type="monotone" dataKey="value" stroke="none" fill={`url(#grad-${kpi.id}-${category})`} />
                  <Line type="monotone" dataKey="value" stroke="#B8934A" strokeWidth={2.5} dot={{ r: 3, fill: '#B8934A' }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-ink/40 italic">
                No trend data yet for {category}.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-line">
          <div className="text-[10px] uppercase tracking-wide2 text-ink/40 mb-3">Latest quarter, by category</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {allCategories.map((c) => (
              <button
                key={c.category}
                onClick={() => setCategory(c.category)}
                className={clsx(
                  'text-left rounded-sm border px-4 py-3 transition-colors',
                  category === c.category ? 'border-gold bg-canvas' : 'border-line hover:border-navy/30'
                )}
              >
                <div className="text-[10px] uppercase tracking-wide2 text-ink/45 mb-1">{c.category}</div>
                {c.latest === null ? (
                  <div className="text-sm text-ink/35 italic">No data</div>
                ) : (
                  <div className="font-data text-lg text-navy">{formatValue(c.latest, kpi.unit)}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setInfoOpen((o) => !o)}
          className="mt-6 text-left text-[11px] uppercase tracking-wide2 text-navy/70 hover:text-navy font-medium flex items-center gap-1"
        >
          {infoOpen ? 'Hide detail' : '2026 target & method'}
          <span className={clsx('transition-transform', infoOpen && 'rotate-180')}>&darr;</span>
        </button>
        {infoOpen && (
          <div className="mt-3 pt-4 border-t border-line grid sm:grid-cols-3 gap-5 text-sm text-ink/75">
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