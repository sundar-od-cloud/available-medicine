'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30 mb-4">
          <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Something went wrong</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-2 max-w-md">
        An unexpected error occurred. Our team has been notified.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-8 font-mono">
          Error ID: {error.digest}
        </p>
      )}
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
        >
          <Home className="h-4 w-4" /> Go Home
        </Link>
      </div>
    </div>
  );
}
