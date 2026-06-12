'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, MapPin, Clock, Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ReservationTable } from '@/components/dashboard/ReservationTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { reservationApi } from '@/lib/api';
import { Reservation } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function UserDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchReservations = async () => {
    try {
      const res = await reservationApi.getUserReservations({ limit: 5 });
      setReservations(res.data.data);
    } catch {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = reservations.filter((r) => r.status === 'pending').length;
  const confirmedCount = reservations.filter((r) => r.status === 'confirmed' || r.status === 'ready').length;
  const completedCount = reservations.filter((r) => r.status === 'completed').length;

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Here&apos;s an overview of your activity</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatsCard title="Pending Reservations" value={pendingCount} icon={Clock} color="orange" />
          <StatsCard title="Active Reservations" value={confirmedCount} icon={ShoppingBag} color="blue" />
          <StatsCard title="Completed" value={completedCount} icon={ShoppingBag} color="green" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/search">
            <Card hover className="flex items-center gap-4 p-5">
              <div className="p-3 bg-primary-50 dark:bg-primary-950/30 rounded-xl">
                <Search className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Search Medicines</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Find medicines near you</p>
              </div>
            </Card>
          </Link>
          <Link href="/pharmacies">
            <Card hover className="flex items-center gap-4 p-5">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Nearby Pharmacies</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View pharmacies in your area</p>
              </div>
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
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : (
              <ReservationTable
                reservations={reservations}
                onStatusUpdate={fetchReservations}
                userView
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
