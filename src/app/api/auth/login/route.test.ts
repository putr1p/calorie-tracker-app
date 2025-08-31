import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock the database functions
jest.mock('@/lib/db', () => ({
  getUserByUsername: jest.fn(),
}));

import { getUserByUsername } from '@/lib/db';

const mockGetUserByUsername = getUserByUsername as jest.MockedFunction<typeof getUserByUsername>;

describe('/api/auth/login', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a mock request
    mockRequest = {
      json: jest.fn(),
    } as any;
  });

  it('should return 400 if username or password is missing', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({ username: 'testuser' });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Username and password are required');
  });

  it('should return 401 for invalid credentials', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      username: 'testuser',
      password: 'wrongpassword'
    });

    mockGetUserByUsername.mockReturnValue({
      id: 1,
      username: 'testuser',
      password: 'correctpassword',
      created_at: '2024-01-01T00:00:00.000Z'
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid credentials');
  });

  it('should return 401 for non-existent user', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      username: 'nonexistent',
      password: 'password'
    });

    mockGetUserByUsername.mockReturnValue(undefined);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid credentials');
  });

  it('should return 200 and user data for valid credentials', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      password: 'correctpassword',
      created_at: '2024-01-01T00:00:00.000Z'
    };

    (mockRequest.json as jest.Mock).mockResolvedValue({
      username: 'testuser',
      password: 'correctpassword'
    });

    mockGetUserByUsername.mockReturnValue(mockUser);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toEqual({
      id: 1,
      username: 'testuser'
    });
    expect(data.token).toMatch(/^session_1_\d+$/);
  });

  it('should handle database errors gracefully', async () => {
    (mockRequest.json as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});