export type Area = 'Commercial' | 'Customer' | 'Cash';
export type Direction = 'increase' | 'decrease';
export type Unit = '%' | 'count' | 'pts' | '£';

export interface Kpi {
  id: string;
  area: Area;
  name: string;
  unit: Unit;
  direction: Direction;
  targetLabel: string;   // the qualitative "2026 Target" text
  measure: string;       // the "Measure (Quarterly)" text
  method: string;        // the "Method" text
  targetValue: number | null; // numeric goal if one exists (e.g. NPS +10)
  sortOrder: number;
}

export interface KpiEntry {
  id: string;
  kpiId: string;
  quarter: string; // e.g. "2026-Q1"
  value: number;
  note: string | null;
  createdAt: string;
}

export interface KpiWithEntries extends Kpi {
  entries: KpiEntry[];
}

export type Status = 'on-track' | 'at-risk' | 'behind' | 'no-data';

export const QUARTERS = [
  '2025-Q4', '2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4', '2027-Q1',
];
