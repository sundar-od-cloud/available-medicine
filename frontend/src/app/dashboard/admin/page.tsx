'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Building2, Pill, ShoppingBag, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ReservationTable } from '@/components/dashboard/ReservationTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/lib/api';
import { DashboardStats, Reservation, Pharmacy } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [pendingPharmacies, setPendingPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isAdmin) { router.push('/dashboard/user'); return; }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  const fetchData = async () => {
    try {
      const [dashRes, pendingRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getPendingPharmacies(),
      ]);
      setStats(dashRes.data.data.stats);
      setRecentReservations(dashRes.data.data.recentReservations);
      setPendingPharmacies(pendingRes.data.data);
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePharmacy = async (id: string, action: 'approve' | 'reject') => {
    try {
      await adminApi.approvePharmacy(id, action);
      fetchData();
    } catch {}
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Platform overview and management</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatsCard title="Total Users" value={stats.totalUsers} icon={Users} color="blue" />
                <StatsCard title="Pharmacies" value={stats.approvedPharmacies} icon={Building2} color="green" />
                <StatsCard title="Medicines" value={stats.totalMedicines} icon={Pill} color="primary" />
                <StatsCard title="Reservations" value={stats.totalReservations} icon={ShoppingBag} color="orange" />
                <StatsCard title="Pending Approval" value={stats.pendingPharmacies} icon={Clock} color="red" />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Pending Pharmacies */}
              <div className="lg:col-span-1">
                <Card padding="none">
                  <CardHeader className="px-5 pt-5 pb-0 flex flex-row items-center justify-between">
                    <CardTitle>Pending Approvals</CardTitle>
                    <Link href="/admin/pharmacies">
                      <Button variant="ghost" size="sm">View all</Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {pendingPharmacies.length === 0 ? (
                      <p className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">No pending pharmacies</p>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {pendingPharmacies.slice(0, 5).map((ph) => (
                          <div key={ph.id} className="px-5 py-3">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{ph.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(ph.created_at)}</p>
                              </div>
                              <Badge variant="warning">pending</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleApprovePharmacy(ph.id, 'approve')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                className="flex-1"
                                onClick={() => handleApprovePharmacy(ph.id, 'reject')}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Links */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { href: '/admin/users', icon: Users, label: 'Manage Users', desc: 'View and manage all users' },
                    { href: '/admin/pharmacies', icon: Building2, label: 'Manage Pharmacies', desc: 'Approve and manage pharmacies' },
                    { href: '/admin/medicines', icon: Pill, label: 'Manage Medicines', desc: 'Add and edit medicine database' },
                    { href: '/admin/analytics', icon: ShoppingBag, label: 'Analytics', desc: 'View platform statistics' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href}>
                        <Card hover className="h-full p-5">
                          <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400 mb-3" />
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{item.label}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Reservations */}
            <Card padding="none">
              <CardHeader className="px-5 pt-5 pb-0">
                <CardTitle>Recent Reservations</CardTitle>
              </CardHeader>
              <CardContent>
                <ReservationTable reservations={recentReservations} showActions={false} />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
