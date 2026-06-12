'use client';
import { Pharmacy } from '@/types';

interface PharmacyMapProps {
  pharmacies: Pharmacy[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export function PharmacyMap({ pharmacies, center, zoom = 13 }: PharmacyMapProps) {
  const mapCenter = center || (pharmacies.length > 0
    ? { lat: pharmacies[0].latitude, lng: pharmacies[0].longitude }
    : { lat: 20.5937, lng: 78.9629 }); // India center

  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng - 0.05}%2C${mapCenter.lat - 0.05}%2C${mapCenter.lng + 0.05}%2C${mapCenter.lat + 0.05}&layer=mapnik&marker=${mapCenter.lat}%2C${mapCenter.lng}`;

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <iframe
        src={openStreetMapUrl}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: '300px' }}
        allowFullScreen
        loading="lazy"
        title="Pharmacy Map"
      />
      <div className="absolute bottom-2 right-2">
        <a
          href={`https://www.openstreetmap.org/?mlat=${mapCenter.lat}&mlon=${mapCenter.lng}#map=${zoom}/${mapCenter.lat}/${mapCenter.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded shadow text-primary-600 dark:text-primary-400 hover:underline"
        >
          View larger map
        </a>
      </div>
    </div>
  );
}
