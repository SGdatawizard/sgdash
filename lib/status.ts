import type { Category, KpiWithData, Status } from './types';

export interface CategorySeriesPoint {
  quarter: string;
  value: number;
}

export interface CategoryComputed {
  category: Category;
  series: CategorySeriesPoint[];
  latest: number | null;
  previous: number | null;
  target: number | null;
  deltaVsPrevious: number | null;
  /** How close `latest` is to `target`, 100 = met or exceeded. Null if no target set. */
  progressPct: number | null;
  status: Status;
}

const AT_RISK_THRESHOLD = 85; // progressPct below 100 but at/above this reads as "close, but flat"

/** Compute trend + target-progress for one KPI, filtered to a single category. */
export function computeCategory(kpi: KpiWithData, category: Category): CategoryComputed {
  const series = kpi.entries
    .filter((e) => e.category === category)
    .sort((a, b) => a.quarter.localeCompare(b.quarter))
    .map((e) => ({ quarter: e.quarter, value: e.value }));

  const target = kpi.targets.find((t) => t.category === category)?.targetValue ?? null;

  if (series.length === 0) {
    return {
      category, series, latest: null, previous: null, target,
      deltaVsPrevious: null, progressPct: null, status: 'no-data',
    };
  }

  const latest = series[series.length - 1].value;
  const previous = series.length > 1 ? series[series.length - 2].value : null;
  const deltaVsPrevious = previous !== null ? latest - previous : null;

  let progressPct: number | null = null;
  let status: Status;

  if (target !== null) {
    if (kpi.direction === 'increase') {
      progressPct = target !== 0 ? (latest / target) * 100 : null;
      status = latest >= target ? 'on-track' : (progressPct ?? 0) >= AT_RISK_THRESHOLD ? 'at-risk' : 'behind';
    } else {
      progressPct = latest !== 0 ? (target / latest) * 100 : null;
      status = latest <= target ? 'on-track' : (progressPct ?? 0) >= AT_RISK_THRESHOLD ? 'at-risk' : 'behind';
    }
  } else if (deltaVsPrevious === null) {
    status = 'on-track';
  } else {
    const favourable = kpi.direction === 'increase' ? deltaVsPrevious > 0 : deltaVsPrevious < 0;
    status = favourable ? 'on-track' : deltaVsPrevious === 0 ? 'at-risk' : 'behind';
  }

  return { category, series, latest, previous, target, deltaVsPrevious, progressPct, status };
}

export const STATUS_LABEL: Record<Status, string> = {
  'on-track': 'On track',
  'at-risk': 'Flat',
  behind: 'Behind',
  'no-data': 'Not yet tracked',
};

export const STATUS_COLOR: Record<Status, string> = {
  'on-track': 'text-good',
  'at-risk': 'text-gold-dark',
  behind: 'text-bad',
  'no-data': 'text-ink/40',
};

export const STATUS_DOT: Record<Status, string> = {
  'on-track': 'bg-good',
  'at-risk': 'bg-gold',
  behind: 'bg-bad',
  'no-data': 'bg-ink/20',
};