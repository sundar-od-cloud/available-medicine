'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { adminApi } from '@/lib/api';
import { Pharmacy } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminPharmaciesPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isAdmin) { router.push('/dashboard/user'); return; }
    fetchPharmacies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, statusFilter]);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPharmacies({ status: statusFilter || undefined });
      setPharmacies(res.data.data);
    } catch { setPharmacies([]); } finally { setLoading(false); }
  };

  const handleApprove = async (id: string, action: 'approve' | 'reject') => {
    try {
      await adminApi.approvePharmacy(id, action);
      toast.success(`Pharmacy ${action}d successfully`);
      fetchPharmacies();
    } catch { toast.error(`Failed to ${action} pharmacy`); }
  };

  const statusVariants: Record<string, 'warning' | 'success' | 'danger'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pharmacy Management</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Review and approve pharmacy registrations</p>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-6">
          {['pending', 'approved', 'rejected', ''].map((status) => (
            <button
              key={status || 'all'}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
            </button>
          ))}
        </div>

        <Card padding="none">
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle>{pharmacies.length} pharmacies</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : pharmacies.length === 0 ? (
              <p className="text-center py-12 text-gray-500 dark:text-gray-400">No pharmacies found</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {pharmacies.map((ph) => (
                  <div key={ph.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <Link href={`/pharmacy/${ph.id}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400">
                            {ph.name}
                          </Link>
                          <Badge variant={statusVariants[ph.status]}>{ph.status}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />{ph.address}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />{ph.phone}
                          </div>
                          <p>License: {ph.license_no} | Registered: {formatDate(ph.created_at)}</p>
                          {ph.owner_name && <p>Owner: {ph.owner_name} ({ph.owner_email})</p>}
                        </div>
                      </div>
                      {ph.status === 'pending' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(ph.id, 'approve')}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleApprove(ph.id, 'reject')}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
