#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import jwt from 'jsonwebtoken';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-change-this-in-production-2024';

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

// JWT utility functions
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return null;
  }
}

function extractTokenFromAuthHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// TCP Server setup
const PORT = 3001 ;
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
    description: "Get meals for the authenticated user, optionally filtered by date range",
    inputSchema: {
      type: "object",
      properties: {
        date_from: { type: "string", description: "Start date in YYYY-MM-DD format" },
        date_to: { type: "string", description: "End date in YYYY-MM-DD format" }
      },
      required: []
    }
  },
  {
    name: "get_user_details",
    description: "Get details of the authenticated user",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "get_meal_macros",
    description: "Get aggregated macros (calories, protein, carbs, fats) from user's meals, optionally filtered by date range",
    inputSchema: {
      type: "object",
      properties: {
        date_from: { type: "string", description: "Start date in YYYY-MM-DD format" },
        date_to: { type: "string", description: "End date in YYYY-MM-DD format" }
      },
      required: []
    }
  }
];

function handleMessage(message, socket) {
  const { id, method, params, headers } = message;

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
      // Validate authentication for tool calls
      const authHeader = headers?.authorization || headers?.Authorization;
      const token = extractTokenFromAuthHeader(authHeader);

      if (!token) {
        console.error(`[${socket.remoteAddress}:${socket.remotePort}] tools/call: missing authentication`);
        sendError(socket, id, 'Authentication required', -32001);
        break;
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        console.error(`[${socket.remoteAddress}:${socket.remotePort}] tools/call: invalid token`);
        sendError(socket, id, 'Invalid authentication token', -32001);
        break;
      }

      handleToolCall(socket, id, params, decoded);
      break;

    default:
      console.error(`[${socket.remoteAddress}:${socket.remotePort}] unknown method: ${method}`);
      sendError(socket, id, 'Method not found', -32601);
  }
}

function handleToolCall(socket, id, params, decodedToken) {
  const { name, arguments: args } = params;

  try {
    switch (name) {
      case 'get_user_meals': {
        const userId = decodedToken.userId;
        const { date_from, date_to } = args;

        let sql = 'SELECT * FROM meals WHERE user_id = ?';
        let params = [parseInt(userId)];

        if (date_from && date_to) {
          sql += ' AND DATE(created_at) BETWEEN ? AND ?';
          params.push(date_from, date_to);
        }

        sql += ' ORDER BY created_at DESC';
        const stmt = db.prepare(sql);
        const meals = stmt.all(...params);

        const responseText = JSON.stringify(meals, null, 2);
        sendResponse(socket, id, {
          content: [{ type: 'text', text: responseText }]
        });
        console.error(`[${socket.remoteAddress}:${socket.remotePort}] get_user_meals completed for user ${userId}`);
        break;
      }

      case 'get_user_details': {
        const userId = decodedToken.userId;

        const sql = 'SELECT id, username, created_at FROM users WHERE id = ?';
        const stmt = db.prepare(sql);
        const user = stmt.get(parseInt(userId));

        if (!user) {
          sendError(socket, id, 'User not found', -32603);
          break;
        }

        const responseText = JSON.stringify(user, null, 2);
        sendResponse(socket, id, {
          content: [{ type: 'text', text: responseText }]
        });
        console.error(`[${socket.remoteAddress}:${socket.remotePort}] get_user_details completed for user ${userId}`);
        break;
      }

      case 'get_meal_macros': {
        const userId = decodedToken.userId;
        const { date_from, date_to } = args;

        let sql = 'SELECT SUM(calories) as total_calories, SUM(protein) as total_protein, SUM(carbs) as total_carbs, SUM(fats) as total_fats FROM meals WHERE user_id = ?';
        let params = [parseInt(userId)];

        if (date_from && date_to) {
          sql += ' AND DATE(created_at) BETWEEN ? AND ?';
          params.push(date_from, date_to);
        }

        const stmt = db.prepare(sql);
        const macros = stmt.get(...params);

        const responseText = JSON.stringify(macros, null, 2);
        sendResponse(socket, id, {
          content: [{ type: 'text', text: responseText }]
        });
        console.error(`[${socket.remoteAddress}:${socket.remotePort}] get_meal_macros completed for user ${userId}`);
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
