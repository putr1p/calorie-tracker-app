'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMeals } from '@/contexts/MealsContext';

export default function MealForm() {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { addMeal } = useMeals();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError('');

    try {
      let imageUrl = null;

      // Upload image if selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.imageUrl;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      await addMeal(
        name,
        parseInt(calories),
        protein ? parseFloat(protein) : null,
        carbs ? parseFloat(carbs) : null,
        fats ? parseFloat(fats) : null,
        imageUrl
      );
      // Clear form on success
      setName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error adding meal:', error);
      setError('Failed to add meal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
      <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Add Meal</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Meal Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm text-black px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="calories" className="block text-sm font-medium text-gray-700">
            Calories
          </label>
          <input
            type="number"
            id="calories"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            required
            min="0"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm text-black px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="protein" className="block text-sm font-medium text-gray-700">
              Protein (g)
            </label>
            <input
              type="number"
              id="protein"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              min="0"
              step="0.1"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm text-black px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="carbs" className="block text-sm font-medium text-gray-700">
              Carbs (g)
            </label>
            <input
              type="number"
              id="carbs"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              min="0"
              step="0.1"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm text-black px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="fats" className="block text-sm font-medium text-gray-700">
              Fats (g)
            </label>
            <input
              type="number"
              id="fats"
              value={fats}
              onChange={(e) => setFats(e.target.value)}
              min="0"
              step="0.1"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm text-black px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            Meal Image (Optional)
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {imagePreview && (
            <div className="mt-2 flex justify-center">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-md border border-gray-300"
              />
            </div>
          )}
        </div>
        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md">{error}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
        >
          {isSubmitting ? 'Adding...' : 'Add Meal'}
        </button>
      </form>
    </div>
  );
}