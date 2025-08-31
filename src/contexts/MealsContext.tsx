'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Meal {
  id: number;
  user_id: number;
  name: string;
  calories: number;
  date: string;
  created_at: string;
}

interface MealsContextType {
  meals: Meal[];
  loading: boolean;
  addMeal: (name: string, calories: number, date: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  const fetchMeals = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/meals', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setMeals(data.sort((a: Meal, b: Meal) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMeal = async (name: string, calories: number, date: string) => {
    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, calories, date }),
      });

      if (response.ok) {
        const newMeal = await response.json();
        // Add the new meal to the state
        setMeals(prevMeals => [newMeal, ...prevMeals]);
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
        setMeals(prevMeals => prevMeals.filter(meal => meal.id !== mealId));
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
      loading,
      addMeal,
      deleteMeal,
      refreshMeals
    }}>
      {children}
    </MealsContext.Provider>
  );
};