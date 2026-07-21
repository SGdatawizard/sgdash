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

function quarterOf(date: Date): string {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${q}`;
}

function buildQuarterRange(quartersBack: number, quartersForward: number): string[] {
  const now = new Date();
  const currentIndex = now.getFullYear() * 4 + Math.floor(now.getMonth() / 3);
  const quarters: string[] = [];
  for (let offset = -quartersBack; offset <= quartersForward; offset++) {
    const idx = currentIndex + offset;
    const year = Math.floor(idx / 4);
    const q = (idx % 4) + 1;
    quarters.push(`${year}-Q${q}`);
  }
  return quarters;
}

/** Rolling list: the last 6 quarters through 1 quarter ahead of today.
 *  Recomputed from the real date rather than hardcoded, so it never
 *  goes stale — no more editing this file every January. */
export const QUARTERS = buildQuarterRange(6, 1);

/** The quarter we're actually in right now — use this as the default
 *  selection in any quarter picker, not QUARTERS[QUARTERS.length - 1]
 *  (which is 1 quarter in the future, not "now"). */
export const CURRENT_QUARTER = quarterOf(new Date());