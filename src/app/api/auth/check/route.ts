import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/db';
import { cookies } from 'next/headers';

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

    if (!token || !token.startsWith('session_')) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const parts = token.split('_');
    if (parts.length !== 3) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const userId = parseInt(parts[1]);
    const user = getUserById(userId) as User | undefined;

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