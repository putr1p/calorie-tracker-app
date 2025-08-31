import { NextRequest } from 'next/server';
import { DELETE } from './route';

// Mock the database functions
jest.mock('@/lib/db', () => ({
  deleteMeal: jest.fn(),
}));

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

import { deleteMeal } from '@/lib/db';
import { cookies } from 'next/headers';

const mockDeleteMeal = deleteMeal as jest.MockedFunction<typeof deleteMeal>;
const mockCookies = cookies as jest.MockedFunction<typeof cookies>;

describe('/api/meals/[id]', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: jest.fn(),
    } as any;
  });

  describe('DELETE /api/meals/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 for invalid session token', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'invalid_token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for invalid meal ID', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session_1_1234567890' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid meal ID');
    });

    it('should return 404 if meal not found or unauthorized', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session_1_1234567890' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      mockDeleteMeal.mockReturnValue({ changes: 0, lastInsertRowid: 0 });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Meal not found or unauthorized');
      expect(mockDeleteMeal).toHaveBeenCalledWith(999, 1);
    });

    it('should return 200 for successful deletion', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session_1_1234567890' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      mockDeleteMeal.mockReturnValue({ changes: 1, lastInsertRowid: 0 });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Meal deleted successfully');
      expect(mockDeleteMeal).toHaveBeenCalledWith(1, 1);
    });
  });
});