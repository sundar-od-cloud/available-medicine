'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users, Building2, Pill, ShoppingBag } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { adminApi } from '@/lib/api';
import { DashboardStats, Reservation } from '@/types';
import { useAuth } from '@/hooks/useAuth';

const COLORS = ['#14b8a6', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminAnalyticsPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topMedicines, setTopMedicines] = useState<any[]>([]);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isAdmin) { router.push('/dashboard/user'); return; }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  const fetchData = async () => {
    try {
      const res = await adminApi.getDashboard();
      setStats(res.data.data.stats);
      setTopMedicines(res.data.data.topMedicines || []);
      setRecentReservations(res.data.data.recentReservations || []);
    } catch {}
    finally { setLoading(false); }
  };

  // Generate status distribution from reservations
  const statusData = recentReservations.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const statusChartData = Object.entries(statusData).map(([name, value]) => ({ name, value }));

  // Mock trend data
  const trendData = [
    { month: 'Jan', reservations: 45 },
    { month: 'Feb', reservations: 72 },
    { month: 'Mar', reservations: 63 },
    { month: 'Apr', reservations: 94 },
    { month: 'May', reservations: 87 },
    { month: 'Jun', reservations: 115 },
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Platform performance and usage statistics</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <>
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatsCard title="Total Users" value={stats.totalUsers} icon={Users} color="blue" />
                  <StatsCard title="Active Pharmacies" value={stats.approvedPharmacies} icon={Building2} color="green" />
                  <StatsCard title="Total Medicines" value={stats.totalMedicines} icon={Pill} color="primary" />
                  <StatsCard title="Total Reservations" value={stats.totalReservations} icon={ShoppingBag} color="orange" />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Reservation Trend */}
                <Card padding="none">
                  <CardHeader className="px-5 pt-5 pb-4">
                    <CardTitle>Reservation Trend (6 months)</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="reservations"
                          stroke="#14b8a6"
                          strokeWidth={2}
                          dot={{ fill: '#14b8a6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card padding="none">
                  <CardHeader className="px-5 pt-5 pb-4">
                    <CardTitle>Reservation Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    {statusChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={statusChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {statusChartData.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-60 text-gray-500 dark:text-gray-400">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Top Medicines */}
              {topMedicines.length > 0 && (
                <Card padding="none">
                  <CardHeader className="px-5 pt-5 pb-4">
                    <CardTitle>Top Searched Medicines</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topMedicines.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="medicine_name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
