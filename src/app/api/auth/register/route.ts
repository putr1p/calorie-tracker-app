import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByUsername } from '@/lib/db';
import { generateToken } from '@/lib/jwt';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      logger.error('Registration failed: Username and password are required');
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    if (password.length < 6) {
      logger.error('Registration failed: Password must be at least 6 characters');
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = getUserByUsername(username);
    if (existingUser) {
      logger.error('Registration failed: Username already exists');
      return NextResponse.json({ error: 'Conflict' }, { status: 409 });
    }

    // Create user
    const userId = createUser(username, password);
    
    // Create JWT token
    const token = generateToken({
      userId: userId,
      username: username
    });

    const response = NextResponse.json({
      user: { id: userId, username },
      token
    });

    // Set httpOnly cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use 'lax' for better development compatibility
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    logger.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}