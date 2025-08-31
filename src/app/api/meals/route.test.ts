import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock the database functions
jest.mock('@/lib/db', () => ({
  getMealsByUserId: jest.fn(),
  createMeal: jest.fn(),
}));

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

import { getMealsByUserId, createMeal } from '@/lib/db';
import { cookies } from 'next/headers';

const mockGetMealsByUserId = getMealsByUserId as jest.MockedFunction<typeof getMealsByUserId>;
const mockCreateMeal = createMeal as jest.MockedFunction<typeof createMeal>;
const mockCookies = cookies as jest.MockedFunction<typeof cookies>;

describe('/api/meals', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: jest.fn(),
    } as any;

    // Mock cookies to return authenticated user
    const mockCookieStore = {
      get: jest.fn().mockReturnValue({ value: 'session_1_1234567890' }),
    };
    mockCookies.mockResolvedValue(mockCookieStore as any);
  });

  describe('GET /api/meals', () => {
    it('should return 401 if user is not authenticated', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return user meals for authenticated user', async () => {
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

      mockGetMealsByUserId.mockReturnValue(mockMeals);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockMeals);
      expect(mockGetMealsByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /api/meals', () => {
    it('should return 401 if user is not authenticated', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      (mockRequest.json as jest.Mock).mockResolvedValue({
        name: 'Lunch',
        calories: 500,
        date: '2024-01-01'
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if required fields are missing', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        name: 'Lunch'
        // missing calories and date
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name, calories, and date are required');
    });

    it('should return 400 if calories is not a positive number', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        name: 'Lunch',
        calories: -100,
        date: '2024-01-01'
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Calories must be a positive number');
    });

    it('should create meal and return it for valid data', async () => {
      const mealData = {
        name: 'Lunch',
        calories: 500,
        date: '2024-01-01'
      };

      const mockCreatedMeal = {
        id: 2,
        user_id: 1,
        ...mealData,
        created_at: '2024-01-01T12:00:00.000Z'
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(mealData);
      mockCreateMeal.mockReturnValue(2);
      mockGetMealsByUserId.mockReturnValue([mockCreatedMeal]);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockCreatedMeal);
      expect(mockCreateMeal).toHaveBeenCalledWith(1, 'Lunch', 500, '2024-01-01');
    });
  });
});