'use client';

import { useMeals } from '@/contexts/MealsContext';

interface MealListProps {
  showTodaysMeals?: boolean;
}

export default function MealList({ showTodaysMeals = false }: MealListProps) {
  const { meals, todaysMeals, loading, deleteMeal } = useMeals();

  const displayMeals = showTodaysMeals ? todaysMeals : meals;

  const handleDelete = async (mealId: string) => {
    try {
      await deleteMeal(mealId);
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      {loading ? (
        <p className="text-gray-500 text-center py-8">Loading meals...</p>
      ) : displayMeals.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {showTodaysMeals ? "No meals logged today yet." : "No meals logged yet."}
        </p>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {displayMeals.map((meal) => (
            <div key={meal.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-md gap-3 sm:gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                {meal.image_url && (
                  <img
                    src={meal.image_url}
                    alt={meal.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md border border-gray-300 flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{meal.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Logged: {formatDateTime(meal.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 flex-shrink-0">
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{meal.calories} cal</span>
                  {(meal.protein || meal.carbs || meal.fats) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {meal.protein && <span>P: {meal.protein}g </span>}
                      {meal.carbs && <span>C: {meal.carbs}g </span>}
                      {meal.fats && <span>F: {meal.fats}g</span>}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(meal.id)}
                  className="text-red-600 hover:text-red-900 text-xs sm:text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
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