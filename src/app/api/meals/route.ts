import { NextRequest, NextResponse } from 'next/server';
import { createMeal, getMealsByUserId } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import logger from '@/lib/logger';

interface Meal {
  id: string;
  user_id: string;
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
    logger.error('Get meals error:', error);
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
      logger.error('Meal creation failed: Name and calories are required');
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    if (isNaN(calories) || calories <= 0) {
      logger.error('Meal creation failed: Calories must be a positive number');
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    // Validate macro inputs if provided
    if (protein !== undefined && (isNaN(protein) || protein < 0)) {
      logger.error('Meal creation failed: Protein must be a non-negative number');
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    if (carbs !== undefined && (isNaN(carbs) || carbs < 0)) {
      logger.error('Meal creation failed: Carbs must be a non-negative number');
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    if (fats !== undefined && (isNaN(fats) || fats < 0)) {
      logger.error('Meal creation failed: Fats must be a non-negative number');
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    // Create meal with automatic timestamping
    const mealId = createMeal(userId, name, calories, protein, carbs, fats, imageUrl);
    const meals = getMealsByUserId(userId) as any[];
    const meal = meals.find(m => m.id === mealId);
    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    logger.error('Create meal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}