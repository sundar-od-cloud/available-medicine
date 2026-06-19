'use client';
import { useEffect, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { pharmacyApi } from '@/lib/api';
import { Pharmacy } from '@/types';
import { PharmacyCard } from '@/components/pharmacy/PharmacyCard';
import { PharmacyMap } from '@/components/pharmacy/PharmacyMap';
import { Button } from '@/components/ui/Button';
import { useGeolocation } from '@/hooks/useGeolocation';
import toast from 'react-hot-toast';

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const { latitude, longitude, getLocation, loading: geoLoading } = useGeolocation();
  const [radius, setRadius] = useState(10);

  const fetchNearby = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await pharmacyApi.getNearby({ lat, lng, radius });
      setPharmacies(res.data.data);
    } catch {
      toast.error('Failed to load pharmacies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (latitude && longitude) {
      fetchNearby(latitude, longitude);
    }
  }, [latitude, longitude, radius]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nearby Pharmacies</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Find pharmacies near your location</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'list' ? 'primary' : 'outline'} size="sm" onClick={() => setView('list')}>List</Button>
          <Button variant={view === 'map' ? 'primary' : 'outline'} size="sm" onClick={() => setView('map')}>Map</Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Radius:</label>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
          >
            {[2, 5, 10, 20, 50].map((r) => (
              <option key={r} value={r}>{r} km</option>
            ))}
          </select>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={getLocation}
          loading={geoLoading}
        >
          <MapPin className="h-4 w-4 mr-1" /> Use My Location
        </Button>
        {latitude && longitude && (
          <span className="text-sm text-primary-600 dark:text-primary-400 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Location detected
          </span>
        )}
      </div>

      {!latitude && !loading && (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-2">Enable location access</p>
          <p className="text-sm mb-4">We need your location to find pharmacies near you</p>
          <Button onClick={getLocation} loading={geoLoading}>
            <MapPin className="h-4 w-4 mr-2" /> Enable Location
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      )}

      {!loading && latitude && pharmacies.length === 0 && (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <p>No pharmacies found within {radius}km. Try increasing the radius.</p>
        </div>
      )}

      {!loading && view === 'map' && pharmacies.length > 0 && (
        <div className="h-96 mb-6">
          <PharmacyMap
            pharmacies={pharmacies}
            center={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
          />
        </div>
      )}

      {!loading && view === 'list' && pharmacies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pharmacies.map((pharmacy) => (
            <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} showDistance />
          ))}
        </div>
      )}
    </div>
  );
}
