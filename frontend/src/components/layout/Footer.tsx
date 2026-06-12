import Link from 'next/link';
import { Pill, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-600 dark:text-primary-400 mb-3">
              <Pill className="h-6 w-6" />
              <span>AvailMed</span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
              Find medicines near you instantly. Search, reserve, and collect from pharmacies in your area.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/search" className="hover:text-primary-600 dark:hover:text-primary-400">Search Medicines</Link></li>
              <li><Link href="/register" className="hover:text-primary-600 dark:hover:text-primary-400">Register Pharmacy</Link></li>
              <li><Link href="/login" className="hover:text-primary-600 dark:hover:text-primary-400">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">Help Center</a></li>
              <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <p>© 2025 AvailMed. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> for better healthcare
          </p>
        </div>
      </div>
    </footer>
  );
}
