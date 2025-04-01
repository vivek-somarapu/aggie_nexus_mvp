import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Ensure Supabase environment variables are available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not set');
}

// Create a Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    // We're using RPC for queries that don't have a simple structure
    // for Supabase's from().select() pattern
    const { data, error } = await supabase.rpc('run_query', { 
      query_text: text,
      query_params: params || []
    });
    
    if (error) throw error;
    
    const duration = Date.now() - start;
    
    // Log query performance in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text, duration, rows: data?.length || 0 });
    }
    
    return { rows: data || [], rowCount: data?.length || 0 };
  } catch (error) {
    console.error('Database query error:', { text, error });
    throw error;
  }
}

// For transactions, you'll need to create a Postgres function in Supabase
// that performs the transaction, since direct transaction control isn't available
// in the client. For complex transactions, consider using database functions/procedures.
export async function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  // This is a simplified version that won't actually use transactions
  // You should create appropriate Supabase functions for each transaction
  try {
    return await callback(supabase);
  } catch (e) {
    throw e;
  }
} 