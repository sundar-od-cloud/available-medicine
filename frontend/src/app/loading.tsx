import { Loader2, Pill } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Pill className="h-12 w-12 text-primary-200 dark:text-primary-800" />
          <Loader2 className="h-6 w-6 text-primary-600 dark:text-primary-400 animate-spin absolute inset-0 m-auto" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
