import { NextRequest, NextResponse } from 'next/server';
import { deleteMeal } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.userId;
    const resolvedParams = await params;
    const mealId = resolvedParams.id;
    
    // Validate UUID format if needed, but for now assume it's valid

    const result = deleteMeal(mealId, userId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Meal not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Delete meal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}