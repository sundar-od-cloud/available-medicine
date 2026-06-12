'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { pharmacyApi, inventoryApi, medicineApi } from '@/lib/api';
import { Pharmacy, Inventory, Medicine } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const { isAuthenticated, isPharmacyOwner } = useAuth();
  const router = useRouter();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editItem, setEditItem] = useState<Inventory | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [form, setForm] = useState({ medicine_id: '', stock: '', price: '', expiry_date: '' });
  const [medicineSearch, setMedicineSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isPharmacyOwner) { router.push('/dashboard/user'); return; }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isPharmacyOwner]);

  const fetchData = async () => {
    try {
      const phRes = await pharmacyApi.getMyPharmacy();
      setPharmacy(phRes.data.data);
      const invRes = await pharmacyApi.getInventory(phRes.data.data.id, { search: search || undefined });
      setInventory(invRes.data.data);
    } catch { setInventory([]); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!pharmacy) return;
    const fetchInv = async () => {
      const invRes = await pharmacyApi.getInventory(pharmacy.id, { search: search || undefined });
      setInventory(invRes.data.data);
    };
    fetchInv();
  }, [search, pharmacy]);

  useEffect(() => {
    if (!medicineSearch || medicineSearch.length < 2) { setMedicines([]); return; }
    const fetch = async () => {
      const res = await medicineApi.search({ q: medicineSearch, limit: 10 });
      setMedicines(res.data.data);
    };
    fetch();
  }, [medicineSearch]);

  const handleSave = async () => {
    if (!pharmacy || !form.medicine_id || !form.stock || !form.price) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.update({
        pharmacy_id: pharmacy.id,
        medicine_id: form.medicine_id,
        stock: Number(form.stock),
        price: Number(form.price),
        expiry_date: form.expiry_date || undefined,
      });
      toast.success(editItem ? 'Inventory updated' : 'Medicine added to inventory');
      setAddModal(false);
      setEditItem(null);
      setForm({ medicine_id: '', stock: '', price: '', expiry_date: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this item from inventory?')) return;
    try {
      await inventoryApi.delete(id);
      toast.success('Removed from inventory');
      fetchData();
    } catch { toast.error('Failed to remove'); }
  };

  const openEdit = (item: Inventory) => {
    setEditItem(item);
    setForm({
      medicine_id: item.medicine_id,
      stock: String(item.stock),
      price: String(item.price),
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
    });
    setAddModal(true);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Manage your medicine stock and prices</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/inventory/upload')}>
              Bulk Upload
            </Button>
            <Button onClick={() => { setEditItem(null); setForm({ medicine_id: '', stock: '', price: '', expiry_date: '' }); setAddModal(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Medicine
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <Card padding="none">
            <CardHeader className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <CardTitle>{inventory.length} items</CardTitle>
                <div className="w-64">
                  <Input
                    placeholder="Search inventory..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {inventory.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No medicines in inventory. Add your first medicine.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Medicine</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Stock</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Price</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Expiry</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{item.medicine_name}</div>
                            {item.generic_name && <div className="text-xs text-gray-500">{item.generic_name}</div>}
                          </td>
                          <td className="py-3 px-4">
                            {item.category && <Badge variant="info">{item.category}</Badge>}
                          </td>
                          <td className="py-3 px-4">
                            <span className={item.stock < 10 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}>
                              {item.stock}
                            </span>
                            {item.stock < 10 && <span className="ml-1 text-xs text-red-500">(Low)</span>}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{formatPrice(item.price)}</td>
                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                            {item.expiry_date ? formatDate(item.expiry_date) : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
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
        )}
      </main>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => { setAddModal(false); setEditItem(null); }}
        title={editItem ? 'Edit Inventory Item' : 'Add Medicine to Inventory'}
        size="md"
      >
        <div className="space-y-4">
          {!editItem && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Medicine</label>
              <input
                type="text"
                placeholder="Type medicine name..."
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {medicines.length > 0 && (
                <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {medicines.map((med) => (
                    <button
                      key={med.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      onClick={() => {
                        setForm((f) => ({ ...f, medicine_id: med.id }));
                        setMedicineSearch(med.medicine_name);
                        setMedicines([]);
                      }}
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">{med.medicine_name}</span>
                      {med.generic_name && <span className="text-gray-500 ml-2">{med.generic_name}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Input
            label="Stock quantity *"
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            placeholder="e.g. 100"
          />
          <Input
            label="Price per unit (INR) *"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="e.g. 49.50"
          />
          <Input
            label="Expiry date (optional)"
            type="date"
            value={form.expiry_date}
            onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => { setAddModal(false); setEditItem(null); }}>
              Cancel
            </Button>
            <Button fullWidth loading={saving} onClick={handleSave}>
              {editItem ? 'Update' : 'Add to Inventory'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
