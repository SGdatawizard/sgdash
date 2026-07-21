import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.local.example to .env.local and fill in your project\u2019s values from Supabase \u2192 Project Settings \u2192 API.'
  );
}

// This client uses the service role key, which bypasses Row Level Security.
// It must only ever be imported from server-side code (Server Components,
// Route Handlers) — never from a 'use client' component or shipped to the
// browser. The rest of this app follows that rule: client components talk
// to our own /api routes, and only those routes and server pages import
// this file.
//
// The custom `fetch` below explicitly forces `cache: 'no-store'` on every
// HTTP request this client makes. Next.js patches the global `fetch()` to
// cache results by default, and that patching doesn't always reliably
// respect a page's `dynamic`/`revalidate` settings when the fetch call
// happens inside an imported library (like supabase-js) rather than
// directly in the page component — which is exactly what was causing the
// dashboard to keep showing data from days ago no matter what changed.
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
  global: {
    fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
  },
});