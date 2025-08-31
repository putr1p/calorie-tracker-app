'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import CalorieChart from '@/components/CalorieChart';
import Chatbot from '@/components/Chatbot';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AnalysisPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after we've finished checking authentication
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Calorie Tracker</h1>
          <p className="text-gray-600 mt-2">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl">
        <div className="w-full">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Calorie Analysis</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">View your calorie trends and patterns</p>
          </div>

          {/* Analysis Content - 2 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Calorie Chart */}
            <div>
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Calorie Trends</h3>
                <CalorieChart />
              </div>
            </div>

            {/* Right Column: Chatbot */}
            <div>
              <Chatbot />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}