'use client';

import { useMeals } from '@/contexts/MealsContext';

export default function MealList() {
  const { meals, loading, deleteMeal } = useMeals();

  const handleDelete = async (mealId: number) => {
    try {
      await deleteMeal(mealId);
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Meals</h2>
      {loading ? (
        <p className="text-gray-500">Loading meals...</p>
      ) : meals.length === 0 ? (
        <p className="text-gray-500">No meals logged yet.</p>
      ) : (
        <div className="space-y-4">
          {meals.map((meal) => (
            <div key={meal.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{meal.name}</h3>
                <p className="text-sm text-gray-500">{formatDate(meal.date)}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900">{meal.calories} cal</span>
                <button
                  onClick={() => handleDelete(meal.id)}
                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}