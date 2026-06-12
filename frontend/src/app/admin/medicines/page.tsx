'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Loader2, Pencil } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { medicineApi } from '@/lib/api';
import { Medicine } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Antibiotics', 'Antidiabetics', 'Cardiovascular', 'Analgesics',
  'Antifungals', 'Vitamins', 'Antihistamines', 'Gastrointestinal', 'Other',
];

export default function AdminMedicinesPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editMed, setEditMed] = useState<Medicine | null>(null);
  const [form, setForm] = useState({
    medicine_name: '', generic_name: '', composition: '',
    manufacturer: '', category: '', alternatives: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isAdmin) { router.push('/dashboard/user'); return; }
    fetchMedicines();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, search, categoryFilter]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await medicineApi.search({ q: search || undefined, category: categoryFilter || undefined, limit: 50 });
      setMedicines(res.data.data);
    } catch { setMedicines([]); }
    finally { setLoading(false); }
  };

  const openEdit = (med: Medicine) => {
    setEditMed(med);
    setForm({
      medicine_name: med.medicine_name,
      generic_name: med.generic_name || '',
      composition: med.composition || '',
      manufacturer: med.manufacturer || '',
      category: med.category || '',
      alternatives: (med.alternatives || []).join(', '),
    });
    setModal(true);
  };

  const openCreate = () => {
    setEditMed(null);
    setForm({ medicine_name: '', generic_name: '', composition: '', manufacturer: '', category: '', alternatives: '' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.medicine_name) { toast.error('Medicine name is required'); return; }
    setSaving(true);
    const payload = {
      ...form,
      alternatives: form.alternatives ? form.alternatives.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
    try {
      if (editMed) {
        await medicineApi.update(editMed.id, payload);
        toast.success('Medicine updated');
      } else {
        await medicineApi.create(payload);
        toast.success('Medicine created');
      }
      setModal(false);
      fetchMedicines();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Medicine Database</h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">Manage the platform medicine catalog</p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Add Medicine
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-48">
              <Input
                placeholder="Search medicines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <Card padding="none">
            <CardHeader className="px-5 pt-5 pb-0">
              <CardTitle>{medicines.length} medicines</CardTitle>
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
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Generic Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Pharmacies</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map((med) => (
                        <tr key={med.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{med.medicine_name}</p>
                            {med.manufacturer && <p className="text-xs text-gray-500">{med.manufacturer}</p>}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{med.generic_name || '—'}</td>
                          <td className="py-3 px-4">
                            {med.category ? <Badge variant="info">{med.category}</Badge> : '—'}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{med.pharmacy_count || 0}</td>
                          <td className="py-3 px-4">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(med)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
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

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editMed ? 'Edit Medicine' : 'Add Medicine'} size="lg">
        <div className="space-y-4">
          <Input label="Medicine Name *" value={form.medicine_name} onChange={(e) => setForm((f) => ({ ...f, medicine_name: e.target.value }))} placeholder="e.g. Paracetamol 500mg" />
          <Input label="Generic Name" value={form.generic_name} onChange={(e) => setForm((f) => ({ ...f, generic_name: e.target.value }))} placeholder="e.g. Acetaminophen" />
          <Input label="Manufacturer" value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} placeholder="e.g. Cipla" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Composition</label>
            <textarea
              value={form.composition}
              onChange={(e) => setForm((f) => ({ ...f, composition: e.target.value }))}
              placeholder="e.g. Paracetamol IP 500mg"
              rows={2}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <Input label="Alternatives (comma separated)" value={form.alternatives} onChange={(e) => setForm((f) => ({ ...f, alternatives: e.target.value }))} placeholder="e.g. Crocin, Dolo" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setModal(false)}>Cancel</Button>
            <Button fullWidth loading={saving} onClick={handleSave}>{editMed ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
