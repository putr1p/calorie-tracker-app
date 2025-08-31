export interface User {
  id: string;
  username: string;
  password: string; // In real app, this would be hashed
  createdAt: Date;
}

export interface Meal {
  id: number;
  user_id: number;
  name: string;
  calories: number;
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