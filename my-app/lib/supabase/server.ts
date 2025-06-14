import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for server-side operations.
 * Uses Next.js cookies() API for session management.
 * 
 * NOTE (Next 15 +): cookies() is now asynchronous in Route Handlers,
 * so this helper itself must be async when you call it there.
 */
export async function createClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // This might be running in a middleware environment where cookies can't be modified
            // We'll just ignore errors at this point
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // This might be running in a middleware environment where cookies can't be modified
            // We'll just ignore errors at this point
          }
        },
      },
    }
  );
} 