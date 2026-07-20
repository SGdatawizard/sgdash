export type Area = 'Commercial' | 'Customer' | 'Cash';
export type Direction = 'increase' | 'decrease';
export type Unit = '%' | 'count' | 'pts' | '£';
export type Category = 'Company' | 'Stamps' | 'Coins' | 'Pop Culture';

export const CATEGORIES: Category[] = ['Company', 'Stamps', 'Coins', 'Pop Culture'];

export interface Kpi {
  id: string;
  area: Area;
  name: string;
  unit: Unit;
  direction: Direction;
  targetLabel: string;   // the qualitative "2026 Target" text
  measure: string;       // the "Measure (Quarterly)" text
  method: string;        // the "Method" text
  sortOrder: number;
}

export interface KpiEntry {
  id: string;
  kpiId: string;
  quarter: string; // e.g. "2026-Q1"
  category: Category;
  value: number;
  note: string | null;
  createdAt: string;
}

export interface Target {
  id: string;
  kpiId: string;
  category: Category;
  targetValue: number;
  updatedAt: string;
}

export interface KpiWithData extends Kpi {
  entries: KpiEntry[];
  targets: Target[];
}

export type Status = 'on-track' | 'at-risk' | 'behind' | 'no-data';

export const QUARTERS = [
  '2025-Q4', '2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4', '2027-Q1',
];