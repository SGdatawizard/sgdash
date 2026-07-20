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
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
