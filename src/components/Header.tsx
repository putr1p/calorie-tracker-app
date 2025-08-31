'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 sm:py-6">
          <div className="flex items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calorie Tracker</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-6">
            {user && (
              <>
                {/* Mobile: Show shorter welcome */}
                <span className="hidden sm:inline text-gray-700">Welcome, {user.username}!</span>
                <span className="sm:hidden text-sm text-gray-700">Hi, {user.username}!</span>

                {/* Navigation Links */}
                <nav className="flex space-x-1 sm:space-x-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      pathname === '/dashboard'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/analysis')}
                    className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      pathname === '/analysis'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Analysis
                  </button>
                </nav>

                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}