import { createClient as createServerClient } from './supabase/server';
import { createClient as createBrowserClient } from './supabase/client';

// Enhanced logging for database operations
const dbLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[DATABASE ${timestamp}] ${message}`, data);
  } else {
    console.log(`[DATABASE ${timestamp}] ${message}`);
  }
};

const dbError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[DATABASE ERROR ${timestamp}] ${message}`, error);
  } else {
    console.error(`[DATABASE ERROR ${timestamp}] ${message}`);
  }
};

/**
 * Get the appropriate Supabase client based on environment
 * Uses server client for server-side operations, browser client for client-side
 */
async function getSupabaseClient() {
  // Check if we're running on the server or client
  if (typeof window === 'undefined') {
    // Server-side: use server client
    dbLog("Creating server-side Supabase client");
    return await createServerClient();
  } else {
    // Client-side: use browser client
    dbLog("Using browser-side Supabase client");
    return createBrowserClient();
  }
}

/**
 * Execute a query using Supabase client with proper error handling
 * This replaces the legacy direct SQL approach with Supabase operations
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  dbLog("Executing query", { query: text.substring(0, 100) + '...', hasParams: !!params });
  
  try {
    const supabase = await getSupabaseClient();
    
    // Parse the SQL query to determine the operation and table
    const operation = text.trim().split(' ')[0].toLowerCase();
    
    let result;
    
    // For simple SELECT queries from single tables
    if (operation === 'select') {
      const tableMatch = text.match(/from\s+([a-zA-Z_]+)/i);
      if (tableMatch && tableMatch[1]) {
        const tableName = tableMatch[1];
        
        // Parse WHERE conditions if present
        const whereMatch = text.match(/where\s+(.+?)(?:\s+order|\s+limit|$)/i);
        let query = supabase.from(tableName).select('*');
        
        if (whereMatch && whereMatch[1]) {
          // Simple WHERE parsing for common patterns
          const whereClause = whereMatch[1].trim();
          
          // Handle status = $1 pattern
          if (whereClause.includes('status = $1') && params && params[0]) {
            query = query.eq('status', params[0]);
          }
          // Handle id = $1 pattern
          else if (whereClause.includes('id = $1') && params && params[0]) {
            query = query.eq('id', params[0]);
          }
          // Add more WHERE patterns as needed
        }
        
        // Parse ORDER BY if present
        const orderMatch = text.match(/order\s+by\s+([a-zA-Z_]+)(?:\s+(asc|desc))?/i);
        if (orderMatch) {
          const column = orderMatch[1];
          const direction = orderMatch[2]?.toLowerCase() === 'desc' ? false : true;
          query = query.order(column, { ascending: direction });
        }
        
        result = await query;
      } else {
        throw new Error('Could not parse table name from query');
      }
    } 
    // For DELETE operations
    else if (operation === 'delete') {
      const tableMatch = text.match(/from\s+([a-zA-Z_]+)/i);
      if (tableMatch && tableMatch[1]) {
        const tableName = tableMatch[1];
        
        // Parse WHERE conditions for DELETE
        const whereMatch = text.match(/where\s+(.+?)$/i);
        if (whereMatch && whereMatch[1]) {
          const whereClause = whereMatch[1].trim();
          
          if (whereClause.includes('id = $1') && params && params[0]) {
            result = await supabase
              .from(tableName)
              .delete()
              .eq('id', params[0])
              .select(); // Return deleted rows
          } else {
            throw new Error('DELETE operation requires valid WHERE clause');
          }
        } else {
          throw new Error('DELETE operation requires WHERE clause');
        }
      } else {
        throw new Error('Could not parse table name from DELETE query');
      }
    }
    // For INSERT operations (basic support)
    else if (operation === 'insert') {
      // For now, return empty result - implement as needed
      dbLog("INSERT operation detected - implement specific logic as needed");
      result = { data: [], error: null };
    }
    // For UPDATE operations (basic support)
    else if (operation === 'update') {
      // For now, return empty result - implement as needed
      dbLog("UPDATE operation detected - implement specific logic as needed");
      result = { data: [], error: null };
    }
    // For other operations
    else {
      dbError("Unsupported SQL operation", { operation });
      result = { data: [], error: new Error(`Unsupported operation: ${operation}`) };
    }
    
    if (result.error) {
      dbError("Query execution failed", result.error);
      throw result.error;
    }
    
    const duration = Date.now() - start;
    dbLog("Query executed successfully", { 
      duration, 
      rowCount: result.data?.length || 0,
      operation 
    });
    
    return { 
      rows: result.data || [], 
      rowCount: result.data?.length || 0 
    };
  } catch (error) {
    const duration = Date.now() - start;
    dbError("Query execution error", { query: text, duration, error });
    throw error;
  }
}

/**
 * Execute multiple operations in a transaction-like manner
 * Note: Supabase doesn't support true transactions from the client,
 * so this is a best-effort approach for related operations
 */
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  dbLog("Starting transaction-like operation");
  
  try {
    const supabase = await getSupabaseClient();
    const result = await callback(supabase);
    
    dbLog("Transaction-like operation completed successfully");
    return result;
  } catch (error) {
    dbError("Transaction-like operation failed", error);
    throw error;
  }
}

/**
 * Direct access to the Supabase client for complex operations
 * Use this when you need full Supabase functionality
 */
export async function getClient() {
  return await getSupabaseClient();
} 