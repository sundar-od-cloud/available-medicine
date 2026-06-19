'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Package, Star, Phone, Bookmark, Loader2 } from 'lucide-react';
import { AlternativeMedicines } from '@/components/medicine/AlternativeMedicines';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { medicineApi, reservationApi } from '@/lib/api';
import { Medicine, Pharmacy, Inventory } from '@/types';
import { formatPrice, formatDistance, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import toast from 'react-hot-toast';

type AvailabilityItem = Pharmacy & Inventory;

export default function MedicineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { latitude, longitude } = useGeolocation();

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [availLoading, setAvailLoading] = useState(false);
  const [reserveModal, setReserveModal] = useState<{ open: boolean; pharmacy?: AvailabilityItem }>({ open: false });
  const [reserveQty, setReserveQty] = useState(1);
  const [reserveNotes, setReserveNotes] = useState('');
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const res = await medicineApi.getById(id);
        setMedicine(res.data.data);
      } catch {
        toast.error('Medicine not found');
        router.push('/search');
      } finally {
        setLoading(false);
      }
    };
    fetchMedicine();
  }, [id, router]);

  useEffect(() => {
    const fetchAvailability = async () => {
      setAvailLoading(true);
      try {
        const res = await medicineApi.getAvailability(id, {
          lat: latitude ?? undefined,
          lng: longitude ?? undefined,
        });
        setAvailability(res.data.data);
      } catch {
        setAvailability([]);
      } finally {
        setAvailLoading(false);
      }
    };
    fetchAvailability();
  }, [id, latitude, longitude]);

  const handleReserve = async () => {
    if (!reserveModal.pharmacy) return;
    if (!isAuthenticated) {
      toast.error('Please login to reserve medicines');
      router.push('/login');
      return;
    }
    setReserving(true);
    try {
      await reservationApi.create({
        pharmacy_id: reserveModal.pharmacy.id,
        medicine_id: id,
        quantity: reserveQty,
        notes: reserveNotes || undefined,
      });
      toast.success('Reservation created successfully!');
      setReserveModal({ open: false });
      setReserveQty(1);
      setReserveNotes('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create reservation');
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!medicine) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to results
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Medicine Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card padding="lg">
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{medicine.medicine_name}</h1>
                {medicine.generic_name && (
                  <p className="text-base text-gray-500 dark:text-gray-400 mt-1">{medicine.generic_name}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {medicine.category && <Badge variant="info">{medicine.category}</Badge>}
                <Badge variant={Number(medicine.pharmacy_count) > 0 ? 'success' : 'danger'}>
                  {Number(medicine.pharmacy_count) > 0 ? `${medicine.pharmacy_count} pharmacies` : 'Out of stock'}
                </Badge>
              </div>

              {medicine.manufacturer && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Manufacturer</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{medicine.manufacturer}</p>
                </div>
              )}

              {medicine.composition && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Composition</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{medicine.composition}</p>
                </div>
              )}

              {medicine.min_price !== undefined && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Price Range</p>
                  <p className="text-lg font-semibold text-primary-600 dark:text-primary-400 mt-1">
                    {formatPrice(medicine.min_price)} &ndash; {formatPrice(medicine.max_price)}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-400 dark:text-gray-500">
                Last updated: {formatDate(medicine.updated_at)}
              </p>
            </div>
          </Card>
        </div>

        {/* Availability & Alternatives */}
        <div className="lg:col-span-2 space-y-6">
          {/* Availability */}
          <Card padding="none">
            <CardHeader className="px-5 pt-5 pb-0">
              <div className="flex items-center justify-between">
                <CardTitle>Available at Pharmacies</CardTitle>
                <span className="text-sm text-gray-500 dark:text-gray-400">{availability.length} found</span>
              </div>
            </CardHeader>
            <CardContent>
              {availLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
              ) : availability.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No pharmacies have this medicine in stock</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {availability.map((item) => (
                    <div key={item.id} className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h4>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{item.address}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              <Package className="h-3.5 w-3.5 inline mr-1" />
                              {item.stock} in stock
                            </span>
                            {item.distance_km !== undefined && (
                              <span className="text-primary-600 dark:text-primary-400">
                                {formatDistance(item.distance_km)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {formatPrice(item.price)}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => setReserveModal({ open: true, pharmacy: item })}
                        >
                          <Bookmark className="h-3.5 w-3.5 mr-1" /> Reserve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alternatives */}
          <Card padding="none">
            <CardHeader className="px-5 pt-5 pb-0">
              <CardTitle>Alternative Medicines</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <AlternativeMedicines medicineId={id} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reserve Modal */}
      <Modal
        isOpen={reserveModal.open}
        onClose={() => setReserveModal({ open: false })}
        title="Reserve Medicine"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-gray-100">{medicine.medicine_name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{reserveModal.pharmacy?.name}</p>
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">
              {formatPrice(reserveModal.pharmacy?.price)} per unit
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity (max: {reserveModal.pharmacy?.stock})
            </label>
            <input
              type="number"
              min={1}
              max={reserveModal.pharmacy?.stock}
              value={reserveQty}
              onChange={(e) => setReserveQty(Math.max(1, Math.min(Number(e.target.value), reserveModal.pharmacy?.stock || 1)))}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={reserveNotes}
              onChange={(e) => setReserveNotes(e.target.value)}
              placeholder="Any special instructions..."
              rows={3}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setReserveModal({ open: false })}>Cancel</Button>
            <Button fullWidth loading={reserving} onClick={handleReserve}>Confirm Reservation</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
