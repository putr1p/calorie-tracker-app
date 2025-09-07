import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

interface User {
  id: number;
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
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error('🚨 Server: Auth check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}