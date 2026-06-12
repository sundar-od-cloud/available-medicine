'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, Star, Package, Loader2 } from 'lucide-react';
import { PharmacyMap } from '@/components/pharmacy/PharmacyMap';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { pharmacyApi } from '@/lib/api';
import { Pharmacy, Inventory } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PharmacyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPharmacy = async () => {
      try {
        const res = await pharmacyApi.getById(id);
        setPharmacy(res.data.data);
      } catch {
        toast.error('Pharmacy not found');
        router.push('/pharmacies');
      } finally {
        setLoading(false);
      }
    };
    fetchPharmacy();
  }, [id, router]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await pharmacyApi.getInventory(id, { page: inventoryPage, limit: 20, search: search || undefined });
        setInventory(res.data.data);
      } catch {
        setInventory([]);
      }
    };
    fetchInventory();
  }, [id, inventoryPage, search]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!pharmacy) return null;

  const statusVariant = pharmacy.status === 'approved' ? 'success' : pharmacy.status === 'rejected' ? 'danger' : 'warning';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card padding="lg">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{pharmacy.name}</h1>
                <Badge variant={statusVariant}>{pharmacy.status}</Badge>
              </div>

              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">{Number(pharmacy.rating).toFixed(1)}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">({pharmacy.total_ratings} reviews)</span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{pharmacy.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <a href={`tel:${pharmacy.phone}`} className="hover:text-primary-600">{pharmacy.phone}</a>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 space-y-1">
                <p>License: {pharmacy.license_no}</p>
                {pharmacy.gst_no && <p>GST: {pharmacy.gst_no}</p>}
                <p>Member since {formatDate(pharmacy.created_at)}</p>
              </div>

              <a
                href={`https://maps.google.com/?q=${pharmacy.latitude},${pharmacy.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <MapPin className="h-4 w-4" /> Get Directions
              </a>
            </div>
          </Card>

          <div className="h-64">
            <PharmacyMap
              pharmacies={[pharmacy]}
              center={{ lat: pharmacy.latitude, lng: pharmacy.longitude }}
              zoom={15}
            />
          </div>
        </div>

        {/* Inventory */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <CardHeader className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <CardTitle>Available Medicines</CardTitle>
                <span className="text-sm text-gray-500 dark:text-gray-400">{inventory.length} items</span>
              </div>
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </CardHeader>
            <CardContent>
              {inventory.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No medicines found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {inventory.map((item) => (
                    <div key={item.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{item.medicine_name}</p>
                        {item.generic_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.generic_name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {item.category && <Badge variant="info" className="text-xs">{item.category}</Badge>}
                          <span className="text-xs text-gray-500 dark:text-gray-400">{item.stock} in stock</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(item.price)}</p>
                        {item.expiry_date && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">Exp: {formatDate(item.expiry_date)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
