'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Meal {
  id: number;
  user_id: number;
  name: string;
  calories: number;
  created_at: string;
  image_url?: string;
}

interface MealsContextType {
  meals: Meal[];
  todaysMeals: Meal[];
  loading: boolean;
  addMeal: (name: string, calories: number, imageUrl?: string | null) => Promise<void>;
  deleteMeal: (mealId: number) => Promise<void>;
  refreshMeals: () => Promise<void>;
}

const MealsContext = createContext<MealsContextType | undefined>(undefined);

export const useMeals = () => {
  const context = useContext(MealsContext);
  if (!context) {
    throw new Error('useMeals must be used within a MealsProvider');
  }
  return context;
};

interface MealsProviderProps {
  children: ReactNode;
}

export const MealsProvider: React.FC<MealsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [todaysMeals, setTodaysMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeals = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/meals', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const sortedMeals = data.sort((a: Meal, b: Meal) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setMeals(sortedMeals);

        // Filter today's meals
        const today = new Date();
        const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        const todaysMealsFiltered = sortedMeals.filter((meal: Meal) => {
          const mealDate = new Date(meal.created_at).toISOString().split('T')[0];
          return mealDate === todayString;
        });
        setTodaysMeals(todaysMealsFiltered);
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMeal = async (name: string, calories: number, imageUrl?: string | null) => {
    try {
      console.log('Adding meal:', { name, calories, imageUrl });
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, calories, imageUrl }),
      });
      if (response.ok) {
        const newMeal = await response.json();
        console.log("Added meal, response:", newMeal);
        // Add the new meal to the state
        setMeals(prevMeals => [newMeal, ...prevMeals]);

        // Update today's meals if the new meal is from today
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const mealDate = new Date(newMeal.created_at).toISOString().split('T')[0];
        if (mealDate === todayString) {
          setTodaysMeals(prevTodaysMeals => [newMeal, ...prevTodaysMeals]);
        }
      } else {
        throw new Error('Failed to add meal');
      }
    } catch (error) {
      console.error('Error adding meal:', error);
      throw error;
    }
  };

  const deleteMeal = async (mealId: number) => {
    try {
      const response = await fetch(`/api/meals/${mealId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Update both meals and todaysMeals arrays
        setMeals(prevMeals => prevMeals.filter(meal => meal.id !== mealId));
        setTodaysMeals(prevTodaysMeals => prevTodaysMeals.filter(meal => meal.id !== mealId));
      } else {
        throw new Error('Failed to delete meal');
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  };

  const refreshMeals = async () => {
    await fetchMeals();
  };

  useEffect(() => {
    if (user) {
      fetchMeals();
    } else {
      setMeals([]);
      setLoading(false);
    }
  }, [user]);

  return (
    <MealsContext.Provider value={{
      meals,
      todaysMeals,
      loading,
      addMeal,
      deleteMeal,
      refreshMeals
    }}>
      {children}
    </MealsContext.Provider>
  );
};