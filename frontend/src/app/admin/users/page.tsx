'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Trash2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { adminApi } from '@/lib/api';
import { User } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isAdmin) { router.push('/dashboard/user'); return; }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({ search: search || undefined, role: roleFilter || undefined });
      setUsers(res.data.data);
    } catch { setUsers([]); } finally { setLoading(false); }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await adminApi.updateUserRole(id, role);
      toast.success('User role updated');
      fetchUsers();
    } catch { toast.error('Failed to update role'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminApi.deleteUser(id);
      toast.success('User deleted');
      fetchUsers();
    } catch { toast.error('Failed to delete user'); }
  };

  const roleVariants: Record<string, 'default' | 'info' | 'warning'> = {
    user: 'default',
    pharmacy_owner: 'info',
    admin: 'warning',
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage platform users and their roles</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="pharmacy_owner">Pharmacy Owner</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <Card padding="none">
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle>{users.length} users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{u.name}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                          <div>{u.email}</div>
                          <div>{u.phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={roleVariants[u.role] || 'default'}>{u.role}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{formatDate(u.created_at)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            >
                              <option value="user">User</option>
                              <option value="pharmacy_owner">Pharmacy Owner</option>
                              <option value="admin">Admin</option>
                            </select>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
