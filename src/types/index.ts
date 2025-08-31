export interface User {
  id: string;
  username: string;
  password: string; // In real app, this would be hashed
  createdAt: Date;
}

export interface Meal {
  id: string;
  userId: string;
  name: string;
  calories: number;
  date: Date;
  createdAt: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface CalorieSummary {
  date: string;
  totalCalories: number;
}