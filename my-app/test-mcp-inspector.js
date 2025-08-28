#!/usr/bin/env node
require('dotenv').config();
const { spawn } = require('child_process');
const readline = require('readline');

// Get the database URL from .env
const databaseUrl = process.env.DATABASE_URL;
console.log('Testing Supabase MCP server with database URL:', databaseUrl);

// Start the MCP server process
const serverProcess = spawn('npx', [
  '@modelcontextprotocol/server-postgres',
  databaseUrl
]);

// Give the server time to start up
setTimeout(() => {
  // Start the inspector process, connecting to the server's stdin/stdout
  const inspectorProcess = spawn('npx', ['@modelcontextprotocol/inspector']);
  
  // Connect the processes
  serverProcess.stdout.pipe(inspectorProcess.stdin);
  inspectorProcess.stdout.pipe(serverProcess.stdin);
  
  // Log server output for debugging
  serverProcess.stderr.on('data', (data) => {
    console.log(`Server stderr: ${data.toString().trim()}`);
  });
  
  // Log inspector output
  inspectorProcess.stdout.on('data', (data) => {
    console.log(`Inspector -> Server: ${data.toString().trim()}`);
  });
  
  inspectorProcess.stderr.on('data', (data) => {
    console.log(`Inspector stderr: ${data.toString().trim()}`);
  });
  
  // Create interface for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\nMCP Inspector started. Press Enter to exit...');
  
  rl.question('', () => {
    console.log('Shutting down...');
    serverProcess.kill();
    inspectorProcess.kill();
    rl.close();
    process.exit(0);
  });
}, 1000); 