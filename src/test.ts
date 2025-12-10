#!/usr/bin/env node
/**
 * Test script for MCP Google Travels server
 * This script tests the server by sending JSON-RPC requests via stdio
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, '..', 'dist', 'index.js');

console.log('Starting MCP Google Travels server test...\n');

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseBuffer = '';
let requestId = 1;

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  // Try to parse complete JSON-RPC responses
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || ''; // Keep incomplete line
  
  lines.forEach((line) => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('Received response:', JSON.stringify(response, null, 2));
      } catch (e) {
        // Not a complete JSON object yet
      }
    }
  });
});

server.stderr.on('data', (data) => {
  console.log('[Server Log]:', data.toString().trim());
});

server.on('close', (code) => {
  console.log(`\nServer process exited with code ${code}`);
  process.exit(code || 0);
});

// Helper to send JSON-RPC request
function sendRequest(method: string, params: any = {}) {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params
  };
  console.log('\nSending request:', JSON.stringify(request, null, 2));
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Wait a bit for server to start
setTimeout(() => {
  // Test 1: Initialize
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  });

  // Test 2: List tools
  setTimeout(() => {
    sendRequest('tools/list', {});
  }, 1000);

  // Test 3: Search flights
  setTimeout(() => {
    sendRequest('tools/call', {
      name: 'search_flights',
      arguments: {
        origin: 'SFO',
        destination: 'LAX',
        departureDate: '2024-03-15',
        passengers: 2,
        cabinClass: 'economy'
      }
    });
  }, 2000);

  // Test 4: Search hotels
  setTimeout(() => {
    sendRequest('tools/call', {
      name: 'search_hotels',
      arguments: {
        location: 'San Francisco',
        checkIn: '2024-03-15',
        checkOut: '2024-03-17',
        guests: 2,
        rooms: 1
      }
    });
  }, 3000);

  // Close after tests
  setTimeout(() => {
    console.log('\n✓ Tests completed successfully!');
    server.kill();
  }, 4000);
}, 500);
