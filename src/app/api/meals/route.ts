import { NextRequest, NextResponse } from 'next/server';
import { createMeal, getMealsByUserId } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

interface Meal {
  id: number;
  user_id: number;
  name: string;
  calories: number;
  date: string;
  created_at: string;
}

// Helper function to get user from JWT
async function getUserFromJWT() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  return decoded ? decoded.userId : null;
}

export async function GET() {
  try {
    const userId = await getUserFromJWT();
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
    const userId = await getUserFromJWT();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, calories, protein, carbs, fats, imageUrl } = await request.json();

    if (!name || !calories) {
      return NextResponse.json({ error: 'Name and calories are required' }, { status: 400 });
    }

    if (isNaN(calories) || calories <= 0) {
      return NextResponse.json({ error: 'Calories must be a positive number' }, { status: 400 });
    }

    // Validate macro inputs if provided
    if (protein !== undefined && (isNaN(protein) || protein < 0)) {
      return NextResponse.json({ error: 'Protein must be a non-negative number' }, { status: 400 });
    }

    if (carbs !== undefined && (isNaN(carbs) || carbs < 0)) {
      return NextResponse.json({ error: 'Carbs must be a non-negative number' }, { status: 400 });
    }

    if (fats !== undefined && (isNaN(fats) || fats < 0)) {
      return NextResponse.json({ error: 'Fats must be a non-negative number' }, { status: 400 });
    }

    // Create meal with automatic timestamping
    const mealId = createMeal(userId, name, calories, protein, carbs, fats, imageUrl);
    const meals = getMealsByUserId(userId) as any[];
    const meal = meals.find(m => m.id === mealId);
    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error('Create meal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}