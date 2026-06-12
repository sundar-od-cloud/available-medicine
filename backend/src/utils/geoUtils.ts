/**
 * Haversine formula to calculate distance between two coordinates
 * Returns distance in kilometers
 */
export const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Get bounding box for a given center point and radius
 * Returns min/max lat/lng for SQL queries
 */
export const getBoundingBox = (
  lat: number,
  lng: number,
  radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } => {
  const R = 6371;
  const latDelta = (radiusKm / R) * (180 / Math.PI);
  const lngDelta = (radiusKm / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

/**
 * Validate coordinates
 */
export const isValidCoordinate = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * SQL fragment for Haversine distance calculation
 * Returns distance in km
 */
export const haversineSql = (
  latCol: string,
  lngCol: string,
  lat: number,
  lng: number
): string => {
  return `(
    6371 * acos(
      LEAST(1.0, cos(radians(${lat})) * cos(radians(${latCol})) *
      cos(radians(${lngCol}) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(${latCol}))
    )
  )`;
};
