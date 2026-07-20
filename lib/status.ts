import type { KpiWithEntries, Status } from './types';

export interface KpiComputed {
  latest: number | null;
  previous: number | null;
  baseline: number | null;
  deltaVsPrevious: number | null;
  deltaVsBaseline: number | null;
  pctChangeVsPrevious: number | null;
  status: Status;
}

export function computeKpi(kpi: KpiWithEntries): KpiComputed {
  const entries = kpi.entries;
  if (entries.length === 0) {
    return {
      latest: null,
      previous: null,
      baseline: null,
      deltaVsPrevious: null,
      deltaVsBaseline: null,
      pctChangeVsPrevious: null,
      status: 'no-data',
    };
  }

  const baseline = entries[0].value;
  const latest = entries[entries.length - 1].value;
  const previous = entries.length > 1 ? entries[entries.length - 2].value : null;

  const deltaVsPrevious = previous !== null ? latest - previous : null;
  const deltaVsBaseline = latest - baseline;
  const pctChangeVsPrevious =
    previous !== null && previous !== 0 ? ((latest - previous) / Math.abs(previous)) * 100 : null;

  const favourable = (delta: number) => (kpi.direction === 'increase' ? delta > 0 : delta < 0);
  const unfavourable = (delta: number) => (kpi.direction === 'increase' ? delta < 0 : delta > 0);

  let status: Status = 'on-track';
  if (entries.length < 2) {
    status = 'on-track';
  } else if (deltaVsPrevious !== null) {
    if (favourable(deltaVsPrevious)) status = 'on-track';
    else if (deltaVsPrevious === 0) status = 'at-risk';
    else if (unfavourable(deltaVsPrevious)) status = 'behind';
  }

  return { latest, previous, baseline, deltaVsPrevious, deltaVsBaseline, pctChangeVsPrevious, status };
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
