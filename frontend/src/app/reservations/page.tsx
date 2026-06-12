'use client';
import { useEffect, useState } from 'react';
import { Loader2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { reservationApi } from '@/lib/api';
import { Reservation } from '@/types';
import { ReservationTable } from '@/components/dashboard/ReservationTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchReservations = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const res = await reservationApi.getUserReservations({ ...params, limit: 50 });
      setReservations(res.data.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const statusOptions: StatusFilter[] = ['all', 'pending', 'confirmed', 'ready', 'completed', 'cancelled'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Reservations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track all your medicine reservations</p>
        </div>
        <Link href="/search">
          <Button><ShoppingBag className="h-4 w-4 mr-2" /> Reserve Medicine</Button>
        </Link>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              statusFilter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {status}
            {status !== 'all' && (
              <span className="ml-1.5 text-xs opacity-80">
                ({reservations.filter(r => status === 'all' || r.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <Card padding="none">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : (
          <ReservationTable
            reservations={reservations}
            onStatusUpdate={fetchReservations}
            userView
            showActions
          />
        )}
      </Card>
    </div>
  );
}
