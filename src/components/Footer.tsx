export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-4 sm:mb-0">
              <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                © 2025 Calorie Tracker. Track your meals and stay healthy.
              </p>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end space-x-4 sm:space-x-6">
              <a
                href="#"
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}