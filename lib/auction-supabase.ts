import { createClient } from '@supabase/supabase-js';
import { supabase as dashboardSupabase } from './supabase';

const auctionUrl = process.env.AUCTION_SUPABASE_URL;
const auctionKey = process.env.AUCTION_SUPABASE_SERVICE_ROLE_KEY;

/**
 * Client for the Auction Performance app's database.
 *
 * - If AUCTION_SUPABASE_URL / AUCTION_SUPABASE_SERVICE_ROLE_KEY are not
 *   set, this assumes the auction app lives in the SAME Supabase project
 *   as this dashboard, and just reuses the main client — in that case
 *   you can query its tables directly, e.g.
 *   `auctionSupabase.from('lots').select(...)`.
 * - If they ARE set, this points at a second, separate project instead.
 *
 * Either way, only `lib/auction-sync.ts` should import this — it's the
 * one place that needs to know the auction app's actual table/column
 * names, which aren't filled in here yet. See the TODO there.
 */
export const auctionSupabase =
  auctionUrl && auctionKey
    ? createClient(auctionUrl, auctionKey, { auth: { persistSession: false } })
    : dashboardSupabase;