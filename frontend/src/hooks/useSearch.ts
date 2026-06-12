'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { medicineApi } from '@/lib/api';
import { Medicine, Pagination } from '@/types';
import { debounce } from '@/lib/utils';

interface UseSearchResult {
  results: Medicine[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  search: (query: string, options?: { category?: string; page?: number }) => void;
  clearResults: () => void;
}

export function useSearch(): UseSearchResult {
  const [results, setResults] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (
    query: string,
    options: { category?: string; page?: number } = {}
  ) => {
    if (!query.trim() && !options.category) {
      setResults([]);
      setPagination(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await medicineApi.search({
        q: query,
        category: options.category,
        page: options.page || 1,
        limit: 20,
      });
      setResults(response.data.data);
      setPagination(response.data.pagination || null);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError('Search failed. Please try again.');
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(debounce(performSearch, 400), [performSearch]);

  const search = useCallback((query: string, options?: { category?: string; page?: number }) => {
    debouncedSearch(query, options);
  }, [debouncedSearch]);

  const clearResults = useCallback(() => {
    setResults([]);
    setPagination(null);
    setError(null);
  }, []);

  return { results, loading, error, pagination, search, clearResults };
}
