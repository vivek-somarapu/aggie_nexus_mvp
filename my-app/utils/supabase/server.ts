import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async (cookieStore: ReturnType<typeof cookies>) => {
  const cookieData = await cookieStore;
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            const cookie = cookieData.get(name);
            return cookie?.value;
          } catch (error) {
            console.error(`Error getting cookie "${name}":`, error);
            return undefined;
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieData.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This is expected in some cases and can be safely ignored
            // if you have middleware refreshing user sessions.
            console.warn(`Warning: Unable to set cookie "${name}" in server component:`, error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieData.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This is expected in some cases and can be safely ignored
            // if you have middleware refreshing user sessions.
            console.warn(`Warning: Unable to remove cookie "${name}" in server component:`, error);
          }
        },
      },
    },
  );
}; 