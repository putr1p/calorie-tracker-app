'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useMeals } from '@/contexts/MealsContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function CalorieChart() {
  const { meals, loading } = useMeals();
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (meals.length >= 0) { // Update chart whenever meals change
      generateChartData();
    }
  }, [meals]);

  const generateChartData = () => {
    // Group meals by date and sum calories (using local timezone)
    const dailyCalories: { [key: string]: number } = {};
    meals.forEach((meal) => {
      const mealDate = new Date(meal.created_at);
      // Use local date components to avoid timezone conversion issues
      const year = mealDate.getFullYear();
      const month = String(mealDate.getMonth() + 1).padStart(2, '0');
      const day = String(mealDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      dailyCalories[dateKey] = (dailyCalories[dateKey] || 0) + meal.calories;
    });

    // Get last 7 days in local timezone
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // Use local date components for consistency
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      last7Days.push({
        date: dateKey,
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        calories: dailyCalories[dateKey] || 0,
      });
    }

    setChartData({
      labels: last7Days.map(day => day.label),
      datasets: [
        {
          label: 'Calories',
          data: last7Days.map(day => day.calories),
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        },
      ],
    });
  };

  if (loading || !chartData) {
    return <div className="bg-white p-6 rounded-lg shadow">Loading chart...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Calorie Summary</h2>
      <Bar
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top' as const,
            },
            title: {
              display: true,
              text: 'Daily Calorie Intake (Last 7 Days)',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Calories',
              },
            },
          },
        }}
      />
    </div>
  );
}