'use client';

import { useState, useMemo } from 'react';
import { useMeals } from '@/contexts/MealsContext';

interface Meal {
  id: number;
  user_id: number;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  created_at: string;
  image_url?: string;
}

const ITEMS_PER_PAGE = 10;

export default function MealAnalysis() {
  const { meals, loading, deleteMeal } = useMeals();
  const [currentPage, setCurrentPage] = useState(1);

  const handleDelete = async (mealId: number) => {
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

  // Calculate pagination
  const totalPages = Math.ceil(meals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentMeals = meals.slice(startIndex, endIndex);

  // Calculate totals
  const totalCalories = useMemo(() => {
    return meals.reduce((sum, meal) => sum + meal.calories, 0);
  }, [meals]);

  const averageCaloriesPerMeal = useMemo(() => {
    return meals.length > 0 ? Math.round(totalCalories / meals.length) : 0;
  }, [meals, totalCalories]);

  // Calculate macro totals
  const totalProtein = useMemo(() => {
    return meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  }, [meals]);

  const totalCarbs = useMemo(() => {
    return meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  }, [meals]);

  const totalFats = useMemo(() => {
    return meals.reduce((sum, meal) => sum + (meal.fats || 0), 0);
  }, [meals]);

  const averageProteinPerMeal = useMemo(() => {
    return meals.length > 0 ? Math.round((totalProtein / meals.length) * 10) / 10 : 0;
  }, [meals, totalProtein]);

  const averageCarbsPerMeal = useMemo(() => {
    return meals.length > 0 ? Math.round((totalCarbs / meals.length) * 10) / 10 : 0;
  }, [meals, totalCarbs]);

  const averageFatsPerMeal = useMemo(() => {
    return meals.length > 0 ? Math.round((totalFats / meals.length) * 10) / 10 : 0;
  }, [meals, totalFats]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Meal History</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-blue-600 font-medium">Total Meals</p>
            <p className="text-2xl font-bold text-blue-900">{meals.length}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-green-600 font-medium">Total Calories</p>
            <p className="text-2xl font-bold text-green-900">{totalCalories.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-md">
            <p className="text-purple-600 font-medium">Avg Calories/Meal</p>
            <p className="text-2xl font-bold text-purple-900">{averageCaloriesPerMeal}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-md">
            <p className="text-orange-600 font-medium">Total Macros</p>
            <p className="text-lg font-bold text-orange-900">
              P: {totalProtein.toFixed(1)}g<br />
              C: {totalCarbs.toFixed(1)}g<br />
              F: {totalFats.toFixed(1)}g
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mt-4">
          <div className="bg-red-50 p-3 rounded-md">
            <p className="text-red-600 font-medium">Avg Protein/Meal</p>
            <p className="text-xl font-bold text-red-900">{averageProteinPerMeal}g</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-md">
            <p className="text-yellow-600 font-medium">Avg Carbs/Meal</p>
            <p className="text-xl font-bold text-yellow-900">{averageCarbsPerMeal}g</p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-md">
            <p className="text-indigo-600 font-medium">Avg Fats/Meal</p>
            <p className="text-xl font-bold text-indigo-900">{averageFatsPerMeal}g</p>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-8">Loading meals...</p>
      ) : meals.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No meals logged yet.</p>
      ) : (
        <>
          <div className="space-y-3 sm:space-y-4 mb-6">
            {currentMeals.map((meal) => (
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
                    <h4 className="text-sm font-medium text-gray-900 truncate">{meal.name}</h4>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, meals.length)} of {meals.length} meals
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}