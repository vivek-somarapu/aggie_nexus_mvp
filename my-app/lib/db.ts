import { Pool } from 'pg';

// Use connection pooling for better performance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: true } // Strict SSL in production
    : { rejectUnauthorized: false }, // Less strict for development
  max: process.env.NODE_ENV === 'production' ? 20 : 5, // Maximum clients
  idleTimeoutMillis: 30000,
});

// Helper function to execute queries with logging
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log query performance in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text, duration, rows: result.rowCount });
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', { text, error });
    throw error;
  }
}

// For transactions that need multiple queries
export async function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
} 