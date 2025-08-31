import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock the database functions
jest.mock('@/lib/db', () => ({
  createUser: jest.fn(),
  getUserByUsername: jest.fn(),
}));

import { createUser, getUserByUsername } from '@/lib/db';

const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockGetUserByUsername = getUserByUsername as jest.MockedFunction<typeof getUserByUsername>;

describe('/api/auth/register', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('should return 400 if password is too short', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      username: 'testuser',
      password: '123'
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Password must be at least 6 characters');
  });

  it('should return 409 if username already exists', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      username: 'existinguser',
      password: 'password123'
    });

    mockGetUserByUsername.mockReturnValue({
      id: 1,
      username: 'existinguser',
      password: 'hashedpassword',
      created_at: '2024-01-01T00:00:00.000Z'
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Username already exists');
  });

  it('should return 200 and user data for successful registration', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      username: 'newuser',
      password: 'password123'
    });

    mockGetUserByUsername.mockReturnValue(undefined);
    mockCreateUser.mockReturnValue(2);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toEqual({
      id: 2,
      username: 'newuser'
    });
    expect(data.token).toMatch(/^session_2_\d+$/);
    expect(mockCreateUser).toHaveBeenCalledWith('newuser', 'password123');
  });

  it('should handle database errors gracefully', async () => {
    (mockRequest.json as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});