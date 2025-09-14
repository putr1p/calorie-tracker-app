import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/db';
import { generateToken } from '@/lib/jwt';
import logger from '@/lib/logger';

interface User {
  id: string;
  username: string;
  password: string;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      logger.error('Login failed: Username and password are required');
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    const user = getUserByUsername(username) as User | undefined;
    if (!user) {
      logger.error('Login failed: User not found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real app, you'd hash passwords. For now, we'll store plain text as before
    if (user.password !== password) {
      logger.error('Login failed: Invalid password');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username
    });

    const response = NextResponse.json({
      user: { id: user.id, username: user.username },
      token
    });

    // Set httpOnly cookie for security
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use 'lax' for better development compatibility
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    logger.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}