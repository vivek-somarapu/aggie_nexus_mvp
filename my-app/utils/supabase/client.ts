import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";

export const createClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase URL or Anon Key. Check your environment variables.');
    throw new Error('Missing required Supabase credentials');
  }
  
  try {
    const client = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
    );
    
    // Test the connection
    console.log('Supabase client created with URL:', supabaseUrl);
    
    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error; // Re-throw to allow handling at the usage site
  }
}; 