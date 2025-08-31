import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MealForm from './MealForm';

// Mock the contexts
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
  }),
}));

jest.mock('@/contexts/MealsContext', () => ({
  useMeals: () => ({
    addMeal: jest.fn(),
  }),
}));

import { useMeals } from '@/contexts/MealsContext';

const mockAddMeal = useMeals().addMeal as jest.MockedFunction<any>;

describe('MealForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddMeal.mockResolvedValue(undefined);
  });

  it('renders the form with all required fields', () => {
    render(<MealForm />);

    expect(screen.getByLabelText(/meal name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/calories/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add meal/i })).toBeInTheDocument();
  });

  it('renders form elements correctly', () => {
    render(<MealForm />);

    expect(screen.getByLabelText(/meal name/i)).toBeTruthy();
    expect(screen.getByLabelText(/calories/i)).toBeTruthy();
    expect(screen.getByLabelText(/date/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /add meal/i })).toBeTruthy();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(<MealForm />);

    const submitButton = screen.getByRole('button', { name: /add meal/i });

    await user.click(submitButton);

    // Form should not submit with empty fields
    expect(mockAddMeal).not.toHaveBeenCalled();
  });
});