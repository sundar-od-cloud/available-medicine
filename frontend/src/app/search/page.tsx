'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MapPin, Loader2, X } from 'lucide-react';
import { SearchBar } from '@/components/medicine/SearchBar';
import { MedicineCard } from '@/components/medicine/MedicineCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { medicineApi } from '@/lib/api';
import { Medicine, Pagination } from '@/types';
import { useGeolocation } from '@/hooks/useGeolocation';

const CATEGORIES = [
  'All', 'Antibiotics', 'Antidiabetics', 'Cardiovascular', 'Analgesics',
  'Antifungals', 'Vitamins', 'Antihistamines', 'Gastrointestinal',
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { latitude, longitude } = useGeolocation();

  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';

  const [results, setResults] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [page, setPage] = useState(1);

  const fetchResults = useCallback(async (q: string, cat: string, pg: number) => {
    if (!q && !cat) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await medicineApi.search({ q: q || undefined, category: cat || undefined, page: pg, limit: 20 });
      setResults(res.data.data);
      setPagination(res.data.pagination || null);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(query, category, page);
  }, [query, category, page, fetchResults]);

  const handleSearch = (q: string) => {
    setQuery(q);
    setPage(1);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handleCategoryChange = (cat: string) => {
    const newCat = cat === 'All' ? '' : cat;
    setCategory(newCat);
    setPage(1);
  };

  const clearFilters = () => {
    setCategory('');
    setPage(1);
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950">
      {/* Search Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search medicines, generic names, compositions..."
            className="max-w-2xl"
          />
          {/* Category Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  (cat === 'All' && !category) || category === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {loading ? 'Searching...' : pagination ? `${pagination.total} results` : 'Search Results'}
            </h2>
            {(query || category) && (
              <div className="flex flex-wrap gap-2">
                {query && <Badge>{query}</Badge>}
                {category && (
                  <Badge variant="info">
                    {category}
                    <button onClick={clearFilters} className="ml-1">
                      <X className="h-3 w-3 inline" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
          {latitude && longitude && (
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <MapPin className="h-4 w-4" />
              <span>Location active</span>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => fetchResults(query, category, page)}>Retry</Button>
          </div>
        )}

        {/* Empty — no query */}
        {!loading && !error && results.length === 0 && !query && !category && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Search for medicines</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Enter a medicine name, generic name, or select a category to get started
            </p>
          </div>
        )}

        {/* Empty — with query */}
        {!loading && !error && results.length === 0 && (query || category) && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💊</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No medicines found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try searching with a different name, generic name, or composition
            </p>
            <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
          </div>
        )}

        {/* Results Grid */}
        {!loading && results.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {results.map((med) => (
                <MedicineCard key={med.id} medicine={med} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
