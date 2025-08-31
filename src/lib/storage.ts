import { User, Meal } from '@/types';

const USERS_KEY = 'calorie_tracker_users';
const MEALS_KEY = 'calorie_tracker_meals';
const CURRENT_USER_KEY = 'calorie_tracker_current_user';

// User storage
export const getUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users).map((u: any) => ({ ...u, createdAt: new Date(u.createdAt) })) : [];
};

export const saveUsers = (users: User[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const addUser = (user: User): void => {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
};

export const findUser = (username: string): User | undefined => {
  const users = getUsers();
  return users.find(u => u.username === username);
};

// Current user
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// Meal storage
export const getMeals = (): Meal[] => {
  if (typeof window === 'undefined') return [];
  const meals = localStorage.getItem(MEALS_KEY);
  return meals ? JSON.parse(meals).map((m: any) => ({
    ...m,
    date: new Date(m.date),
    createdAt: new Date(m.createdAt)
  })) : [];
};

export const saveMeals = (meals: Meal[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
};

export const addMeal = (meal: Meal): void => {
  const meals = getMeals();
  meals.push(meal);
  saveMeals(meals);
};

export const getMealsByUser = (userId: string): Meal[] => {
  const meals = getMeals();
  return meals.filter(m => m.userId === userId);
};

export const deleteMeal = (mealId: string): void => {
  const meals = getMeals();
  const filteredMeals = meals.filter(m => m.id !== mealId);
  saveMeals(filteredMeals);
};