# Stanley Gibbons — KPI Performance Room

A small internal dashboard for tracking the 2026 C-suite KPIs (Commercial,
Customer, Cash) with a companion screen for entering the quarterly figures.
Data lives in Supabase (Postgres) so the whole team can add readings from
wherever they're working.

## Stack

- **Next.js 14** (App Router, TypeScript) — one codebase for both the
  dashboard UI and the API that backs it.
- **Supabase** (Postgres) — shared database, accessed server-side via the
  service role key so every team member's entries land in the same place.
- **Tailwind CSS** for styling, tokenised with the brand palette
  (off-white canvas, navy, gold).
- **Recharts** for the quarterly trend sparklines.

## Getting started

1. **Run the migration** — open your Supabase project → SQL Editor,
   paste in `supabase/migrations/001_init.sql`, and run it. This creates
   the `kpis` and `entries` tables and seeds the five 2026 KPIs
   (Vendor Commission, Sell-Through Rate, NPS, Aged Debtors, Market
   Share) with a couple of quarters of sample data — delete the sample
   readings from Data Entry once real figures are in. NPS is seeded with
   no readings at all, matching the plan's note that tracking starts
   Q1 2027.

2. **Set your environment variables** — copy `.env.local.example` to
   `.env.local` and fill in your project's URL and **service role** key
   (Supabase → Project Settings → API). The service role key is a
   secret — it stays server-side and must never be exposed to the
   browser or committed to source control (`.env.local` is already
   git-ignored).

3. **Install and run:**

   ```bash
   npm install
   npm run dev
   ```

Then open:

- `http://localhost:3000` — the dashboard your C-suite will look at.
- `http://localhost:3000/admin` — where whoever owns each KPI enters the
  quarterly numbers. Anyone on the team can use this; every entry is
  saved straight to the shared Supabase database.

## Project structure

```
app/
  layout.tsx              Root layout — loads brand fonts, global styles
  globals.css              Tailwind + the perforated-edge "signature" motif
  page.tsx                 Dashboard (server component, fetches KPI data)
  admin/
    page.tsx               Data entry screen (server component)
  api/
    kpis/route.ts               GET (list) / POST (create) KPI
    kpis/[id]/route.ts          GET / PUT / DELETE a single KPI
    kpis/[id]/entries/route.ts  POST a new quarterly reading
    entries/[id]/route.ts       DELETE a single reading

components/
  Header.tsx                Shared nav, styled after the Stanley Gibbons site
  KpiCard.tsx                Dashboard card: headline value, trend, status
  StatusBadge.tsx            On track / Flat / Behind indicator
  DashboardClient.tsx        Area grouping, filter chips, summary counts
  admin/
    AdminClient.tsx           Data entry page state/orchestration
    KpiAdminCard.tsx          Per-KPI entry form + history table
    NewKpiForm.tsx            Add a brand-new KPI (beyond the initial five)

lib/
  supabase.ts               Supabase client (service role, server-only)
  kpi-service.ts            All reads/writes to Supabase
  status.ts                 Trend & "on track / flat / behind" logic
  types.ts                  Shared TypeScript types + quarter list

supabase/
  migrations/001_init.sql   Schema + seed data — run once in Supabase
```

## How data flows

Client components (the forms on `/admin`, the filter chips on `/`) never
talk to Supabase directly — they call this app's own `/api/...` routes,
which use the service role key server-side. That key bypasses Row Level
Security, so it must stay out of any `'use client'` file and out of
anything shipped to the browser; the code is structured so that only
`lib/supabase.ts`, `lib/kpi-service.ts`, the API routes, and the two
server-component pages ever import it.

## Adding KPIs beyond the initial five

Data Entry has an "Add a new KPI" form for anything that comes up later
(a fourth pillar, a new commercial metric, etc.) — no code changes
needed. If a KPI has a genuinely fixed numeric target rather than a
"trend up/down each quarter" goal, that's tracked via `target_value` on
the KPI record and can be wired into `lib/status.ts` for a progress-bar
style view later.

## Deploying

Since the data now lives in Supabase rather than a local file, this
deploys cleanly to any Next.js host, including serverless platforms
(Vercel, Netlify, etc.) — just set `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` as environment variables there too.

**Note:** those two variables need to be set *before* `npm run build`
runs, not just before the app starts — Next.js touches the API routes
while collecting page data at build time, and `lib/supabase.ts` throws
immediately if they're missing. Most hosts (Vercel included) already set
environment variables ahead of the build step, so this is normally a
non-issue — it only bites if you try to build locally without a
`.env.local` in place.
