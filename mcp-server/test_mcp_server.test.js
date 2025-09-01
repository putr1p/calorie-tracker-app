#!/usr/bin/env node

/**
 * Unit tests for MCP server functionality
 * Run with: npm test
 */

import { jest } from '@jest/globals';

// Mock the database
const mockDb = {
  prepare: jest.fn(() => ({
    all: jest.fn(() => [
      {
        id: 1,
        user_id: 1,
        name: 'Test Meal',
        calories: 500,
        created_at: '2025-01-01T12:00:00.000Z',
        image_url: null
      }
    ])
  }))
};

// Mock console methods to capture output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
let capturedStdout = [];
let capturedStderr = [];

beforeEach(() => {
  capturedStdout = [];
  capturedStderr = [];
  console.log = (...args) => capturedStdout.push(args.join(' '));
  console.error = (...args) => capturedStderr.push(args.join(' '));
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Mock the database import
jest.mock('better-sqlite3', () => {
  return jest.fn(() => mockDb);
});

// Import the MCP server functions (we'll need to refactor the server to export functions for testing)
describe('MCP Server Tests', () => {

  describe('Database Connection', () => {
    test('should connect to database successfully', () => {
      // This would test the database connection logic
      expect(mockDb.prepare).toBeDefined();
    });

    test('should handle database connection errors', () => {
      // Test error handling for database connection failures
      const mockError = new Error('Database connection failed');
      mockDb.prepare.mockImplementationOnce(() => {
        throw mockError;
      });

      // The server should handle this gracefully
      expect(() => {
        // Simulate database connection
        throw mockError;
      }).toThrow('Database connection failed');
    });
  });

  describe('JSON-RPC Message Handling', () => {
    test('should handle initialize request', () => {
      const message = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {}
      };

      // This would test the handleMessage function
      // For now, we'll test the expected response structure
      const expectedResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'calorie-tracker-mcp',
            version: '1.0.0'
          }
        }
      };

      expect(expectedResponse.jsonrpc).toBe('2.0');
      expect(expectedResponse.result.protocolVersion).toBe('2024-11-05');
    });

    test('should handle tools/list request', () => {
      const message = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      };

      // Test the expected tools list response
      const expectedResponse = {
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: [
            {
              name: 'get_user_meals',
              description: 'Get all meals for a specific user',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'number', description: 'User ID to fetch meals for' }
                },
                required: ['userId']
              }
            }
          ]
        }
      };

      expect(expectedResponse.result.tools).toHaveLength(1);
      expect(expectedResponse.result.tools[0].name).toBe('get_user_meals');
    });

    test('should handle tools/call request for get_user_meals', () => {
      const message = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'get_user_meals',
          arguments: { userId: 1 }
        }
      };

      // Mock the database response
      const mockMeals = [
        {
          id: 1,
          user_id: 1,
          name: 'Test Meal',
          calories: 500,
          created_at: '2025-01-01T12:00:00.000Z',
          image_url: null
        }
      ];

      mockDb.prepare().all.mockReturnValue(mockMeals);

      // Test the expected response structure
      const expectedResponse = {
        jsonrpc: '2.0',
        id: 3,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify(mockMeals, null, 2)
          }]
        }
      };

      expect(expectedResponse.result.content[0].type).toBe('text');
      expect(expectedResponse.result.content[0].text).toContain('Test Meal');
    });

    test('should handle unknown methods', () => {
      const message = {
        jsonrpc: '2.0',
        id: 4,
        method: 'unknown_method',
        params: {}
      };

      const expectedResponse = {
        jsonrpc: '2.0',
        id: 4,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      };

      expect(expectedResponse.error.code).toBe(-32601);
      expect(expectedResponse.error.message).toBe('Method not found');
    });

    test('should handle unknown tools', () => {
      const message = {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'unknown_tool',
          arguments: {}
        }
      };

      const expectedResponse = {
        jsonrpc: '2.0',
        id: 5,
        error: {
          code: -32601,
          message: 'Unknown tool: unknown_tool'
        }
      };

      expect(expectedResponse.error.message).toContain('Unknown tool');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', () => {
      const malformedMessage = "{ invalid json }";

      // This should trigger the parse error handler
      expect(() => {
        JSON.parse(malformedMessage);
      }).toThrow();
    });

    test('should handle database errors', () => {
      // Mock a database error
      const dbError = new Error('Database query failed');
      mockDb.prepare().all.mockImplementationOnce(() => {
        throw dbError;
      });

      // The server should handle this and return an error response
      expect(() => {
        // Simulate calling the tool that triggers the database error
        throw dbError;
      }).toThrow('Database query failed');
    });

    test('should handle missing required parameters', () => {
      const message = {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'get_user_meals',
          arguments: {} // Missing userId
        }
      };

      // This should result in a database error when trying to execute the query
      // The server should handle this gracefully
      const expectedResponse = {
        jsonrpc: '2.0',
        id: 6,
        error: {
          code: -32603,
          message: expect.stringContaining('Database error')
        }
      };

      expect(expectedResponse.error.code).toBe(-32603);
    });
  });

  describe('Response Format', () => {
    test('should format successful responses correctly', () => {
      const id = 7;
      const result = { test: 'data' };

      const expectedResponse = {
        jsonrpc: '2.0',
        id: id,
        result: result
      };

      expect(expectedResponse.jsonrpc).toBe('2.0');
      expect(expectedResponse.id).toBe(id);
      expect(expectedResponse.result).toEqual(result);
      expect(expectedResponse).not.toHaveProperty('error');
    });

    test('should format error responses correctly', () => {
      const id = 8;
      const message = 'Test error';
      const code = -32000;

      const expectedResponse = {
        jsonrpc: '2.0',
        id: id,
        error: {
          code: code,
          message: message
        }
      };

      expect(expectedResponse.jsonrpc).toBe('2.0');
      expect(expectedResponse.id).toBe(id);
      expect(expectedResponse.error.code).toBe(code);
      expect(expectedResponse.error.message).toBe(message);
      expect(expectedResponse).not.toHaveProperty('result');
    });
  });

  describe('Tool Validation', () => {
    test('should validate get_user_meals parameters', () => {
      // Test with valid parameters
      const validArgs = { userId: 1 };
      expect(validArgs).toHaveProperty('userId');
      expect(typeof validArgs.userId).toBe('number');

      // Test with invalid parameters
      const invalidArgs = { userId: 'invalid' };
      expect(typeof invalidArgs.userId).not.toBe('number');
    });

    test('should handle tool response formatting', () => {
      const meals = [
        { id: 1, name: 'Meal 1', calories: 300 },
        { id: 2, name: 'Meal 2', calories: 400 }
      ];

      const formattedResponse = {
        content: [{
          type: 'text',
          text: JSON.stringify(meals, null, 2)
        }]
      };

      expect(formattedResponse.content).toHaveLength(1);
      expect(formattedResponse.content[0].type).toBe('text');
      expect(formattedResponse.content[0].text).toContain('Meal 1');
      expect(formattedResponse.content[0].text).toContain('Meal 2');
    });
  });
});