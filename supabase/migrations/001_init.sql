-- Stanley Gibbons KPI Performance Room — schema + seed data
-- Run this once in the Supabase SQL editor (or via `supabase db push`
-- if you're using the CLI) against the project you've already set up.

create extension if not exists pgcrypto;

create table if not exists kpis (
  id           text primary key,
  area         text not null check (area in ('Commercial', 'Customer', 'Cash')),
  name         text not null,
  unit         text not null check (unit in ('%', 'count', 'pts', '£')),
  direction    text not null check (direction in ('increase', 'decrease')),
  target_label text not null,
  measure      text not null,
  method       text not null,
  target_value numeric,
  sort_order   integer not null default 0
);

create table if not exists entries (
  id         uuid primary key default gen_random_uuid(),
  kpi_id     text not null references kpis(id) on delete cascade,
  quarter    text not null,
  value      numeric not null,
  note       text,
  created_at timestamptz not null default now(),
  unique (kpi_id, quarter)
);

-- This app talks to Supabase using the service role key from server-only
-- code (API routes / Server Components), which bypasses Row Level Security.
-- RLS can stay off on these tables, or you can enable it and add a policy
-- restricting access to the service role — either is safe as long as no
-- client-side code ever uses the anon key against these tables directly.

-- 2026 KPI plan
insert into kpis (id, area, name, unit, direction, target_label, measure, method, target_value, sort_order) values
('vendor-commission', 'Commercial', 'Vendor Commission', '%', 'increase',
  'Improve vendor commission earnings across each category',
  'Vendor commission earnings up quarter-on-quarter in each category',
  'Run an informative campaign showing consignors how our marketing reach, auction platform and brand strength deliver higher realised prices. Charging vendor commission aligns our interests with the seller''s — we are financially invested in maximising every lot, whereas competitors with no stake have less incentive to push consignors'' items the way we do.',
  null, 1),
('sell-through-rate', 'Commercial', 'Sell-Through Rate', '%', 'increase',
  'Increase sell-through rate',
  'Sell-through rate up quarter-on-quarter',
  'Better promotion of lots, more accurate estimating, and stronger marketing.',
  null, 2),
('nps', 'Customer', 'Net Promoter Score', 'pts', 'increase',
  'Increase NPS by 10 points over 12 months (currently not tracking this but will be by Q1 2027)',
  'NPS +10 points over 12 months, tracked quarterly',
  'Stand up quarterly NPS survey; establish baseline once tracking begins.',
  null, 3),
('aged-debtors', 'Cash', 'Aged Debtors (30+ days)', 'count', 'decrease',
  'Decrease the number of buyers with debts falling due after 30 days',
  'Fewer buyers with 30+ day outstanding balances quarter-on-quarter (measured by buyer count, not spend)',
  'Better management of late invoices, CS follow-up, and a requirement to register a credit card in advance.',
  null, 4),
('market-share', 'Commercial', 'Market Share', '%', 'increase',
  'Increase market share versus key competitors',
  'Market share up quarter-on-quarter versus key competitors',
  'Measured on hammer / number of lots offered.',
  null, 5)
on conflict (id) do nothing;

-- Sample quarterly readings so the dashboard isn't empty on first run.
-- Delete these from the Data Entry screen once real figures are in —
-- NPS is left with no readings, matching the plan's note that tracking
-- doesn't start until Q1 2027.
insert into entries (kpi_id, quarter, value, note) values
('vendor-commission', '2025-Q4', 5.8, 'Baseline before campaign launch'),
('vendor-commission', '2026-Q1', 6.1, null),
('vendor-commission', '2026-Q2', 6.7, 'Marketing campaign live from April'),
('sell-through-rate',  '2025-Q4', 61,  null),
('sell-through-rate',  '2026-Q1', 63,  null),
('sell-through-rate',  '2026-Q2', 66,  'Revised estimating guidelines rolled out'),
('aged-debtors',       '2025-Q4', 42,  null),
('aged-debtors',       '2026-Q1', 37,  null),
('aged-debtors',       '2026-Q2', 31,  'Card-on-file requirement introduced'),
('market-share',       '2025-Q4', 13.9, null),
('market-share',       '2026-Q1', 14.2, null),
('market-share',       '2026-Q2', 14.8, null)
on conflict (kpi_id, quarter) do nothing;
