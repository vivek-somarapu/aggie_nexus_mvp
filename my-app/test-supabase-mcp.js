require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

// Use the database URL from the .env file
const databaseUrl = process.env.DATABASE_URL;
console.log('Using database URL:', databaseUrl);

// Start the MCP server process
const mcpProcess = spawn('npx', [
  '-y',
  '@modelcontextprotocol/server-postgres',
  databaseUrl
]);

// Keep track of requests and responses
const responses = {};

// Handle server stdout
mcpProcess.stdout.on('data', (data) => {
  console.log(`MCP Server output: ${data.toString().trim()}`);
  
  try {
    const response = JSON.parse(data.toString());
    responses[response.id] = response;
  } catch (e) {
    // Not JSON or other parsing error, ignore
  }
});

// Handle server stderr
mcpProcess.stderr.on('data', (data) => {
  console.error(`MCP Server error: ${data.toString().trim()}`);
});

// Function to send a JSON-RPC request
function sendRequest(id, method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id,
    method,
    params
  };
  
  console.log(`Sending request: ${method} (id: ${id})`);
  mcpProcess.stdin.write(JSON.stringify(request) + '\n');
}

// Try various method names
setTimeout(() => {
  // Standard ping to verify server is alive
  sendRequest('ping', 'ping');
  
  setTimeout(() => {
    // Try each of these methods
    [
      // MCP standard methods
      'mcp.list_tools',
      'mcp.list_resources',
      'mcp.call_tool',
      // JSON-RPC standard methods
      'system.listMethods',
      // Direct methods from the code
      'query',
      // Custom attempts
      'execute',
      'sql'
    ].forEach((method, index) => {
      setTimeout(() => {
        if (method === 'mcp.call_tool') {
          sendRequest(`call_${index}`, method, {
            name: 'query',
            arguments: {
              sql: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' LIMIT 5;'
            }
          });
        } else if (method === 'query' || method === 'execute' || method === 'sql') {
          sendRequest(`sql_${index}`, method, {
            sql: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' LIMIT 5;'
          });
        } else {
          sendRequest(`req_${index}`, method);
        }
      }, index * 500);
    });
    
    // Final cleanup and summary
    setTimeout(() => {
      console.log('\n--- TEST SUMMARY ---');
      console.log('Successfully working methods:');
      
      const workingMethods = Object.entries(responses)
        .filter(([id, response]) => !response.error)
        .map(([id, response]) => ({ id, method: id.split('_')[0] }));
      
      if (workingMethods.length > 0) {
        workingMethods.forEach(({ id, method }) => {
          console.log(`- ${responses[id].method || method}`);
        });
      } else {
        console.log('None - Only ping was successful');
      }
      
      console.log('\nTest completed, stopping MCP server');
      mcpProcess.kill();
    }, 5000);
  }, 1000);
}, 1000); 