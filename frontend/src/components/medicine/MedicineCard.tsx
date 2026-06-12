'use client';
import Link from 'next/link';
import { MapPin, TrendingDown, Bookmark } from 'lucide-react';
import { Medicine } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

interface MedicineCardProps {
  medicine: Medicine;
  onReserve?: (medicine: Medicine) => void;
}

export function MedicineCard({ medicine, onReserve }: MedicineCardProps) {
  const isAvailable = Number(medicine.pharmacy_count) > 0;

  return (
    <Card hover className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link href={`/medicine/${medicine.id}`} className="hover:text-primary-600 dark:hover:text-primary-400">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{medicine.medicine_name}</h3>
          </Link>
          {medicine.generic_name && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{medicine.generic_name}</p>
          )}
        </div>
        <Badge variant={isAvailable ? 'success' : 'danger'} className="ml-2 flex-shrink-0">
          {isAvailable ? 'Available' : 'Out of Stock'}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {medicine.category && <Badge variant="info">{medicine.category}</Badge>}
        {medicine.manufacturer && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{medicine.manufacturer}</span>
        )}
      </div>

      {medicine.composition && (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{medicine.composition}</p>
      )}

      <div className="flex items-center gap-4 text-sm">
        {isAvailable && (
          <>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <MapPin className="h-3.5 w-3.5" />
              <span>{medicine.pharmacy_count} pharmacies</span>
            </div>
            <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>from {formatPrice(medicine.min_price)}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 mt-1">
        <Link href={`/medicine/${medicine.id}`} className="flex-1">
          <Button variant="outline" size="sm" fullWidth>View Details</Button>
        </Link>
        {isAvailable && onReserve && (
          <Button size="sm" onClick={() => onReserve(medicine)} className="flex-1">
            <Bookmark className="h-3.5 w-3.5 mr-1" /> Reserve
          </Button>
        )}
      </div>
    </Card>
  );
}
