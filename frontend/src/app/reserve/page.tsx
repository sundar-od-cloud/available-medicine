'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, MapPin, Package, CheckCircle } from 'lucide-react';
import { medicineApi, reservationApi } from '@/lib/api';
import { Medicine } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDistance } from '@/lib/utils';
import { useGeolocation } from '@/hooks/useGeolocation';
import toast from 'react-hot-toast';

function ReserveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const medicineId = searchParams.get('medicine_id');
  const { latitude, longitude } = useGeolocation();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [reserving, setReserving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!medicineId) { router.push('/search'); return; }
    const fetchData = async () => {
      try {
        const [medRes, availRes] = await Promise.all([
          medicineApi.getById(medicineId),
          medicineApi.getAvailability(medicineId, latitude && longitude ? { lat: latitude, lng: longitude } : undefined),
        ]);
        setMedicine(medRes.data.data);
        setAvailability(availRes.data.data);
      } catch { router.push('/search'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [medicineId, latitude, longitude]);

  const handleReserve = async () => {
    if (!selectedPharmacy || !medicineId) {
      toast.error('Please select a pharmacy');
      return;
    }
    setReserving(true);
    try {
      await reservationApi.create({ pharmacy_id: selectedPharmacy, medicine_id: medicineId, quantity, notes });
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reserve');
    } finally {
      setReserving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;

  if (success) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Reservation Successful!</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Your medicine has been reserved. Please visit the pharmacy to collect it.</p>
      <Button onClick={() => router.push('/dashboard/user')} fullWidth>View My Reservations</Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Reserve Medicine</h1>

      {medicine && (
        <Card className="mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{medicine.medicine_name}</h2>
          {medicine.generic_name && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{medicine.generic_name}</p>}
          {medicine.composition && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{medicine.composition}</p>}
        </Card>
      )}

      <div className="space-y-3 mb-6">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">Select Pharmacy</h3>
        {availability.length === 0 ? (
          <Card>
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No stock available near you</p>
            </div>
          </Card>
        ) : availability.map((pharm) => (
          <button
            key={pharm.id}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all ${selectedPharmacy === pharm.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300'}`}
            onClick={() => setSelectedPharmacy(pharm.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100">{pharm.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{pharm.address}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold">{formatPrice(pharm.price)}</span>
                  <span className="text-gray-500 dark:text-gray-400">{pharm.stock} available</span>
                  {pharm.distance_km !== undefined && (
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {formatDistance(pharm.distance_km)}
                    </span>
                  )}
                </div>
              </div>
              {selectedPharmacy === pharm.id && (
                <CheckCircle className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 ml-3" />
              )}
            </div>
          </button>
        ))}
      </div>

      <Card className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            max="10"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any special instructions for the pharmacist..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      <Button fullWidth size="lg" loading={reserving} onClick={handleReserve} disabled={!selectedPharmacy}>
        Confirm Reservation
      </Button>
    </div>
  );
}

export default function ReservePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>}>
      <ReserveContent />
    </Suspense>
  );
}
