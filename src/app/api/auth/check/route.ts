import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import logger from '@/lib/logger';

interface User {
  id: string;
  username: string;
  password: string;
  created_at: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = getUserById(decoded.userId) as User | undefined;
    if (!user) {
      logger.error('Auth check failed: User not found');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    logger.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}