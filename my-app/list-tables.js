#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');

// Get the database URL from .env
const databaseUrl = process.env.DATABASE_URL;
console.log('Connecting to database...');

const pool = new Pool({
  connectionString: databaseUrl,
});

async function listTables() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Tables in your Supabase database:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Error querying database:', err);
  }
}

listTables(); 