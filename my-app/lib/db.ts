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

// Export supabase client for direct use
export { supabase };

// Helper function to execute queries - uses direct table access instead of RPC
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    // Parse the SQL query to determine the operation and table
    const operation = text.trim().split(' ')[0].toLowerCase();
    
    let result;
    
    // For simple SELECT queries from single tables
    if (operation === 'select') {
      const tableMatch = text.match(/from\s+([a-zA-Z_]+)/i);
      if (tableMatch && tableMatch[1]) {
        const tableName = tableMatch[1];
        result = await supabase.from(tableName).select('*');
      } else {
        throw new Error('Could not parse table name from query');
      }
    } 
    // For other operations, use direct table methods when possible
    else {
      // For now, just return empty result for non-SELECT queries
      // In a real implementation, you would handle INSERT, UPDATE, DELETE
      result = { data: [], error: null };
    }
    
    if (result.error) throw result.error;
    
    const duration = Date.now() - start;
    
    // Log query performance in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text, duration, rows: result.data?.length || 0 });
    }
    
    return { rows: result.data || [], rowCount: result.data?.length || 0 };
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