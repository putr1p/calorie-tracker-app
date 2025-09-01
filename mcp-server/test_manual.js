#!/usr/bin/env node

/**
 * Manual test script for MCP server
 * Run with: node test_manual.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test cases
const testCases = [
  {
    name: 'Initialize',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {}
    },
    expectedContains: ['protocolVersion', 'capabilities', 'serverInfo']
  },
  {
    name: 'List Tools',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    },
    expectedContains: ['tools', 'get_user_meals']
  },
  {
    name: 'Get User Meals',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_user_meals',
        arguments: { userId: 1 }
      }
    },
    expectedContains: ['content', 'text']
  },
  {
    name: 'Unknown Method',
    request: {
      jsonrpc: '2.0',
      id: 4,
      method: 'unknown_method',
      params: {}
    },
    expectedContains: ['error', 'Method not found']
  },
  {
    name: 'Unknown Tool',
    request: {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'unknown_tool',
        arguments: {}
      }
    },
    expectedContains: ['error', 'Unknown tool']
  }
];

async function runTest(serverProcess, testCase) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Running test: ${testCase.name}`);
    console.log('Request:', JSON.stringify(testCase.request, null, 2));

    let responseData = '';
    let errorData = '';

    const timeout = setTimeout(() => {
      console.log('❌ Test timed out');
      resolve({ success: false, error: 'Timeout' });
    }, 5000);

    // Listen for response
    const onData = (data) => {
      responseData += data.toString();

      // Try to parse complete JSON responses
      const lines = responseData.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line.trim());
            console.log('Response:', JSON.stringify(response, null, 2));

            // Check if response contains expected content
            const responseStr = JSON.stringify(response);
            const hasExpected = testCase.expectedContains.every(expected =>
              responseStr.includes(expected)
            );

            if (hasExpected) {
              console.log('✅ Test passed');
              clearTimeout(timeout);
              resolve({ success: true, response });
              return;
            } else {
              console.log('⚠️  Response received but missing expected content');
              clearTimeout(timeout);
              resolve({ success: false, error: 'Missing expected content', response });
              return;
            }
          } catch (e) {
            // Not a complete JSON yet, continue listening
          }
        }
      }
    };

    serverProcess.stdout.on('data', onData);
    serverProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.log('Server log:', data.toString().trim());
    });

    // Send the request
    const requestJson = JSON.stringify(testCase.request) + '\n';
    serverProcess.stdin.write(requestJson);

    // Clean up listeners after test
    setTimeout(() => {
      serverProcess.stdout.removeListener('data', onData);
    }, 6000);
  });
}

async function runAllTests() {
  console.log('🚀 Starting MCP Server Manual Tests');
  console.log('=' .repeat(50));

  // Start the MCP server
  const serverPath = path.join(__dirname, 'src', 'index.js');
  console.log(`Starting server: ${serverPath}`);

  const serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
  });

  let passed = 0;
  let failed = 0;

  try {
    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run each test
    for (const testCase of testCases) {
      const result = await runTest(serverProcess, testCase);

      if (result.success) {
        passed++;
      } else {
        failed++;
        console.log(`❌ Test failed: ${result.error || 'Unknown error'}`);
      }
    }

  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    // Clean up
    serverProcess.kill();
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️  Some tests failed. Check the output above.');
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Tests interrupted by user');
  process.exit(0);
});

// Run the tests
runAllTests().catch(console.error);