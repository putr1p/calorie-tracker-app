import { createUser, getUserByUsername, getMealsByUserId, createMeal } from './db';

// Mock better-sqlite3
jest.mock('better-sqlite3', () => {
  const mockDb = {
    exec: jest.fn(),
    prepare: jest.fn(() => ({
      run: jest.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
      get: jest.fn(),
      all: jest.fn(() => []),
    })),
  };
  return jest.fn(() => mockDb);
});

describe('Database functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user and return the ID', () => {
      const result = createUser('testuser', 'password123');
      expect(result).toBe(1);
    });
  });

  describe('getUserByUsername', () => {
    it('should return user data for existing user', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'password123',
        created_at: '2024-01-01T00:00:00.000Z'
      };

      // Mock the get method to return user data
      const mockPrepare = require('better-sqlite3')();
      mockPrepare.prepare.mockReturnValue({
        run: jest.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
        get: jest.fn(() => mockUser),
        all: jest.fn(() => []),
      });

      const result = getUserByUsername('testuser');
      expect(result).toEqual(mockUser);
    });

    it('should return undefined for non-existent user', () => {
      const mockPrepare = require('better-sqlite3')();
      mockPrepare.prepare.mockReturnValue({
        run: jest.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
        get: jest.fn(() => undefined),
        all: jest.fn(() => []),
      });

      const result = getUserByUsername('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('getMealsByUserId', () => {
    it('should return meals for a user', () => {
      const mockMeals = [
        {
          id: 1,
          user_id: 1,
          name: 'Breakfast',
          calories: 300,
          date: '2024-01-01',
          created_at: '2024-01-01T08:00:00.000Z'
        }
      ];

      const mockPrepare = require('better-sqlite3')();
      mockPrepare.prepare.mockReturnValue({
        run: jest.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
        get: jest.fn(),
        all: jest.fn(() => mockMeals),
      });

      const result = getMealsByUserId(1);
      expect(result).toEqual(mockMeals);
    });
  });

  describe('createMeal', () => {
    it('should create a meal and return the ID', () => {
      const result = createMeal(1, 'Lunch', 500, '2024-01-01');
      expect(result).toBe(1);
    });
  });
});