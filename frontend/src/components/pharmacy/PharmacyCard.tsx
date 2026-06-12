import Link from 'next/link';
import { MapPin, Phone, Star, CheckCircle } from 'lucide-react';
import { Pharmacy } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDistance } from '@/lib/utils';

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  showDistance?: boolean;
}

export function PharmacyCard({ pharmacy, showDistance = true }: PharmacyCardProps) {
  const statusVariant =
    pharmacy.status === 'approved' ? 'success' :
    pharmacy.status === 'rejected' ? 'danger' : 'warning';

  return (
    <Card hover className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link href={`/pharmacy/${pharmacy.id}`} className="hover:text-primary-600 dark:hover:text-primary-400">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{pharmacy.name}</h3>
          </Link>
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Number(pharmacy.rating).toFixed(1)} ({pharmacy.total_ratings} reviews)
            </span>
          </div>
        </div>
        <Badge variant={statusVariant}>{pharmacy.status}</Badge>
      </div>

      <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{pharmacy.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <a href={`tel:${pharmacy.phone}`} className="hover:text-primary-600 dark:hover:text-primary-400">{pharmacy.phone}</a>
        </div>
        {showDistance && pharmacy.distance_km !== undefined && (
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>{formatDistance(pharmacy.distance_km)}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-1">
        <Link href={`/pharmacy/${pharmacy.id}`} className="flex-1">
          <Button variant="outline" size="sm" fullWidth>View Details</Button>
        </Link>
        <a
          href={`https://maps.google.com/?q=${pharmacy.latitude},${pharmacy.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button size="sm" fullWidth>
            <MapPin className="h-3.5 w-3.5 mr-1" /> Directions
          </Button>
        </a>
      </div>
    </Card>
  );
}
