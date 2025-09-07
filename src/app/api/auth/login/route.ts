import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/db';
import { generateToken } from '@/lib/jwt';

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
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = getUserByUsername(username) as User | undefined;
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // In a real app, you'd hash passwords. For now, we'll store plain text as before
    if (user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}