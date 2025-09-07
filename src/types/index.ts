export interface User {
  id: string; // UUID
  username: string;
  password: string; // In real app, this would be hashed
  createdAt: Date;
}

export interface Meal {
  id: string; // UUID
  user_id: string; // UUID
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  created_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface CalorieSummary {
  date: string;
  totalCalories: number;
}