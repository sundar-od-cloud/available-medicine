'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { medicineApi } from '@/lib/api';
import { Medicine } from '@/types';
import { debounce, cn } from '@/lib/utils';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  autoNavigate?: boolean;
  size?: 'sm' | 'lg';
}

export function SearchBar({ className, placeholder = 'Search medicines...', onSearch, autoNavigate = false, size = 'sm' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchSuggestions = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) { setSuggestions([]); return; }
      setLoading(true);
      try {
        const res = await medicineApi.search({ q, limit: 5 });
        setSuggestions(res.data.data);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchSuggestions(query);
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (q: string = query) => {
    if (!q.trim()) return;
    setShowSuggestions(false);
    if (autoNavigate) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    } else {
      onSearch?.(q);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className={cn(
        'flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all',
        size === 'lg' && 'shadow-md'
      )}>
        <Search className={cn('ml-3 text-gray-400 flex-shrink-0', size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className={cn(
            'flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400',
            size === 'lg' ? 'px-4 py-4 text-lg' : 'px-3 py-2.5 text-sm'
          )}
        />
        {query && (
          <button onClick={() => { setQuery(''); setSuggestions([]); }} className="p-2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
        {loading && <Loader2 className="h-4 w-4 text-gray-400 animate-spin mr-2" />}
        <button
          onClick={() => handleSearch()}
          className={cn(
            'mr-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex-shrink-0',
            size === 'lg' ? 'px-6 py-2.5 text-sm' : 'px-3 py-1.5 text-xs'
          )}
        >
          Search
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((med) => (
            <button
              key={med.id}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => { handleSearch(med.medicine_name); setQuery(med.medicine_name); }}
            >
              <Search className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{med.medicine_name}</div>
                {med.generic_name && <div className="text-xs text-gray-500">{med.generic_name}</div>}
              </div>
              {med.pharmacy_count !== undefined && (
                <span className="ml-auto text-xs text-primary-600 dark:text-primary-400">{med.pharmacy_count} pharmacies</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
