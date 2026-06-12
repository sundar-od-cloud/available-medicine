'use client';
import { useEffect, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { PharmacyCard } from '@/components/pharmacy/PharmacyCard';
import { PharmacyMap } from '@/components/pharmacy/PharmacyMap';
import { Button } from '@/components/ui/Button';
import { pharmacyApi } from '@/lib/api';
import { Pharmacy } from '@/types';
import { useGeolocation } from '@/hooks/useGeolocation';
import toast from 'react-hot-toast';

export default function PharmaciesPage() {
  const { latitude, longitude, loading: geoLoading, error: geoError, getLocation } = useGeolocation();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(5);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  useEffect(() => {
    if (latitude && longitude) {
      fetchNearby();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, radius]);

  const fetchNearby = async () => {
    if (!latitude || !longitude) return;
    setLoading(true);
    try {
      const res = await pharmacyApi.getNearby({ lat: latitude, lng: longitude, radius });
      setPharmacies(res.data.data);
    } catch {
      toast.error('Failed to fetch nearby pharmacies');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Nearby Pharmacies</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Find licensed pharmacies near your location</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Radius:</label>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            {[1, 2, 5, 10, 20].map((r) => (
              <option key={r} value={r}>{r} km</option>
            ))}
          </select>
        </div>

        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {(['grid', 'map'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {latitude && longitude && (
          <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <MapPin className="h-4 w-4" />
            <span>Location active</span>
          </div>
        )}
      </div>

      {/* Location Error */}
      {geoError && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-yellow-800 dark:text-yellow-400">{geoError}</p>
          <Button size="sm" variant="outline" onClick={getLocation}>
            <MapPin className="h-4 w-4 mr-1" /> Enable Location
          </Button>
        </div>
      )}

      {/* Loading */}
      {(loading || geoLoading) && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      )}

      {/* No Location */}
      {!latitude && !geoLoading && !loading && (
        <div className="text-center py-16">
          <MapPin className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Location access needed</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Enable location to find pharmacies near you</p>
          <Button onClick={getLocation}>
            <MapPin className="h-4 w-4 mr-2" /> Enable Location
          </Button>
        </div>
      )}

      {/* Results */}
      {!loading && pharmacies.length > 0 && (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{pharmacies.length} pharmacies within {radius}km</p>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pharmacies.map((pharmacy) => (
                <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} showDistance />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 lg:h-auto">
                <PharmacyMap
                  pharmacies={pharmacies}
                  center={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
                />
              </div>
              <div className="space-y-3 overflow-y-auto max-h-96 lg:max-h-none">
                {pharmacies.map((pharmacy) => (
                  <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} showDistance />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !geoLoading && latitude && pharmacies.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-600 dark:text-gray-400">No pharmacies found within {radius}km. Try increasing the radius.</p>
        </div>
      )}
    </div>
  );
}
