import { createBrowserClient } from '@supabase/ssr';

// Create a singleton browser client to prevent multiple instances
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Creates a Supabase client for use in browser environments.
 * Uses the SSR-compatible createBrowserClient for better integration with Next.js.
 * Implements singleton pattern to prevent multiple client instances.
 */
export function createClient() {
  if (browserClient) return browserClient;
  
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  return browserClient;
} 