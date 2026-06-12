'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ShoppingBag, Star, Upload, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ReservationTable } from '@/components/dashboard/ReservationTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { pharmacyApi, reservationApi } from '@/lib/api';
import { Pharmacy, Reservation, Inventory } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function PharmacyDashboardPage() {
  const { isAuthenticated, isPharmacyOwner } = useAuth();
  const router = useRouter();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isPharmacyOwner) { router.push('/dashboard/user'); return; }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isPharmacyOwner]);

  const fetchData = async () => {
    try {
      const pharmacyRes = await pharmacyApi.getMyPharmacy();
      setPharmacy(pharmacyRes.data.data);
      const [resRes, invRes] = await Promise.all([
        reservationApi.getPharmacyReservations(pharmacyRes.data.data.id, { limit: 10 }),
        pharmacyApi.getInventory(pharmacyRes.data.data.id, { limit: 5 }),
      ]);
      setReservations(resRes.data.data);
      setInventory(invRes.data.data);
    } catch {
      // Pharmacy might not be registered yet
    } finally {
      setLoading(false);
    }
  };

  const pendingReservations = reservations.filter((r) => r.status === 'pending').length;
  const lowStockItems = inventory.filter((i) => i.stock < 10).length;

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pharmacy Dashboard</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {pharmacy ? pharmacy.name : 'Manage your pharmacy'}
            </p>
          </div>
          {pharmacy && (
            <Link href="/inventory">
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Inventory
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : !pharmacy ? (
          <Card padding="lg" className="text-center">
            <div className="py-8">
              <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Pharmacy Registered</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Register your pharmacy to start managing inventory and reservations.</p>
              <Link href="/pharmacy/register">
                <Button size="lg">Register Your Pharmacy</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {/* Status Banner */}
            {pharmacy.status !== 'approved' && (
              <div className={`mb-6 p-4 rounded-xl border ${
                pharmacy.status === 'pending'
                  ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400'
                  : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
              }`}>
                <p className="font-medium">
                  {pharmacy.status === 'pending'
                    ? 'Your pharmacy is pending approval. You can manage inventory while waiting.'
                    : 'Your pharmacy registration was rejected. Please contact support.'}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatsCard title="Pending Reservations" value={pendingReservations} icon={ShoppingBag} color="orange" />
              <StatsCard title="Total Inventory" value={inventory.length} icon={Package} color="blue" />
              <StatsCard title="Low Stock Items" value={lowStockItems} icon={Package} color="red" />
              <StatsCard title="Rating" value={Number(pharmacy.rating).toFixed(1)} icon={Star} color="green" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Link href="/inventory">
                <Card hover className="flex items-center gap-3 p-4">
                  <Package className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Manage Inventory</span>
                </Card>
              </Link>
              <Link href="/inventory/upload">
                <Card hover className="flex items-center gap-3 p-4">
                  <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Bulk Upload</span>
                </Card>
              </Link>
              <Link href="/reservations">
                <Card hover className="flex items-center gap-3 p-4">
                  <ShoppingBag className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">View Reservations</span>
                </Card>
              </Link>
            </div>

            {/* Recent Reservations */}
            <Card padding="none">
              <CardHeader className="px-5 pt-5 pb-0 flex flex-row items-center justify-between">
                <CardTitle>Recent Reservations</CardTitle>
                <Link href="/reservations">
                  <Button variant="ghost" size="sm">View all</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <ReservationTable reservations={reservations} onStatusUpdate={fetchData} />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
