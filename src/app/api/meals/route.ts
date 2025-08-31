import { NextRequest, NextResponse } from 'next/server';
import { createMeal, getMealsByUserId } from '@/lib/db';
import { cookies } from 'next/headers';

interface Meal {
  id: number;
  user_id: number;
  name: string;
  calories: number;
  date: string;
  created_at: string;
}

// Helper function to get user from session
async function getUserFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token || !token.startsWith('session_')) {
    return null;
  }

  const parts = token.split('_');
  if (parts.length !== 3) {
    return null;
  }

  const userId = parseInt(parts[1]);
  return userId;
}

export async function GET() {
  try {
    const userId = await getUserFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meals = getMealsByUserId(userId);
    return NextResponse.json(meals);
  } catch (error) {
    console.error('Get meals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, calories, date } = await request.json();

    if (!name || !calories || !date) {
      return NextResponse.json({ error: 'Name, calories, and date are required' }, { status: 400 });
    }

    if (isNaN(calories) || calories <= 0) {
      return NextResponse.json({ error: 'Calories must be a positive number' }, { status: 400 });
    }

    const mealId = createMeal(userId, name, calories, date);
    const meals = getMealsByUserId(userId) as any[];
    const meal = meals.find(m => m.id === mealId);
    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error('Create meal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}