#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection (read-only)
const dbPath = path.join(__dirname, '../../calorie_tracker.db');
console.error('Database path:', dbPath);

let db;
try {
  db = new Database(dbPath, { readonly: true });
  console.error('Database connected successfully');
} catch (error) {
  console.error('Failed to connect to database:', error.message);
  process.exit(1);
}

// TCP Server setup
const PORT = process.env.MCP_PORT || 3001;
const HOST = '127.0.0.1';

const server = net.createServer((socket) => {
  console.error(`Connection from ${socket.remoteAddress}:${socket.remotePort}`);

  let buffer = '';

  socket.on('data', (data) => {
    buffer += data.toString();

    // Process complete JSON-RPC messages (separated by newlines)
    const messages = buffer.split('\n');
    buffer = messages.pop(); // Keep incomplete message in buffer

    for (const message of messages) {
      if (message.trim()) {
        try {
          const parsedMessage = JSON.parse(message.trim());
          handleMessage(parsedMessage, socket);
        } catch (error) {
          console.error('Parse error:', error.message);
          sendError(socket, -32700, 'Parse error');
        }
      }
    }
  });

  socket.on('end', () => {
    console.error(`Connection closed from ${socket.remoteAddress}:${socket.remotePort}`);
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err.message);
  });
});

server.listen(PORT, HOST, () => {
  console.error(`MCP server listening on ${HOST}:${PORT}`);
});

// Define tools
const tools = [
  {
    name: "get_user_meals",
    description: "Get all meals for a specific user",
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "number", description: "User ID to fetch meals for" }
      },
      required: ["userId"]
    }
  }
];

function handleMessage(message, socket) {
  const { id, method, params } = message;

  console.error(`[${socket.remoteAddress}:${socket.remotePort}] ${method} request id=${id}`);

  switch (method) {
    case 'initialize':
      const initResponse = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'calorie-tracker-mcp',
          version: '1.0.0'
        }
      };
      sendResponse(socket, id, initResponse);
      console.error(`[${socket.remoteAddress}:${socket.remotePort}] initialize completed`);
      break;

    case 'tools/list':
      sendResponse(socket, id, { tools });
      console.error(`[${socket.remoteAddress}:${socket.remotePort}] tools/list completed`);
      break;

    case 'tools/call':
      handleToolCall(socket, id, params);
      break;

    default:
      console.error(`[${socket.remoteAddress}:${socket.remotePort}] unknown method: ${method}`);
      sendError(socket, id, 'Method not found', -32601);
  }
}

function handleToolCall(socket, id, params) {
  const { name, arguments: args } = params;

  try {
    switch (name) {
      case 'get_user_meals': {
        // Handle both snake_case (user_id) and camelCase (userId) arguments
        const userId = args.userId || args.user_id;

        if (!userId) {
          console.error(`[${socket.remoteAddress}:${socket.remotePort}] get_user_meals: missing userId`);
          sendError(socket, id, 'userId is required', -32602);
          break;
        }

        const sql = 'SELECT * FROM meals WHERE user_id = ? ORDER BY created_at DESC';
        const stmt = db.prepare(sql);
        const meals = stmt.all(parseInt(userId)); // Ensure it's a number for SQL

        const responseText = JSON.stringify(meals, null, 2);
        sendResponse(socket, id, {
          content: [{ type: 'text', text: responseText }]
        });
        console.error(`[${socket.remoteAddress}:${socket.remotePort}] get_user_meals completed for user ${userId}`);
        break;
      }

      default:
        console.error(`[${socket.remoteAddress}:${socket.remotePort}] unknown tool: ${name}`);
        sendError(socket, id, `Unknown tool: ${name}`, -32601);
    }
  } catch (error) {
    console.error(`[${socket.remoteAddress}:${socket.remotePort}] tool error: ${error.message}`);
    sendError(socket, id, `Database error: ${error.message}`, -32603);
  }
}

function sendResponse(socket, id, result) {
  const response = {
    jsonrpc: '2.0',
    id,
    result
  };
  socket.write(JSON.stringify(response) + '\n');
}

function sendError(socket, id, message, code = -32000) {
  const response = {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message
    }
  };
  socket.write(JSON.stringify(response) + '\n');
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down MCP server...');
  if (db) {
    db.close();
  }
  process.exit(0);
});
