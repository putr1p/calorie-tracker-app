import { NextRequest, NextResponse } from 'next/server';
import { deleteMeal } from '@/lib/db';
import { cookies } from 'next/headers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token || !token.startsWith('session_')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parts = token.split('_');
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(parts[1]);
    const resolvedParams = await params;
    const mealId = parseInt(resolvedParams.id);

    if (isNaN(mealId)) {
      return NextResponse.json({ error: 'Invalid meal ID' }, { status: 400 });
    }

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