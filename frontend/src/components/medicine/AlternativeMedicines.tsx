'use client';
import { useEffect, useState } from 'react';
import { medicineApi } from '@/lib/api';
import { Medicine } from '@/types';
import { MedicineCard } from './MedicineCard';
import { Loader2 } from 'lucide-react';

interface AlternativeMedicinesProps {
  medicineId: string;
}

export function AlternativeMedicines({ medicineId }: AlternativeMedicinesProps) {
  const [alternatives, setAlternatives] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlternatives = async () => {
      try {
        const res = await medicineApi.getAlternatives(medicineId);
        setAlternatives(res.data.data);
      } catch {
        setAlternatives([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAlternatives();
  }, [medicineId]);

  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
    </div>
  );

  if (alternatives.length === 0) return (
    <p className="text-center text-gray-500 dark:text-gray-400 py-6">No alternatives found</p>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {alternatives.map((med) => <MedicineCard key={med.id} medicine={med} />)}
    </div>
  );
}
