// Service-role Supabase client for accelerator admin operations.
//
// ONLY import this in server-side code (API routes, server actions).
// Never import in client components — the service role key bypasses all RLS.
// Used for: inviting users, triggering notifications, seeding data.

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
