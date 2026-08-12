// ============================================================
// LOCATION HELPERS
// Complete location utility functions for the application
// ============================================================

// ============================================================
// TYPES
// ============================================================

/**
 * Coordinate interface
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Address interface
 */
export interface Address {
  street: string;
  city: string;
  subCity?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates?: Coordinates;
}

/**
 * Distance result
 */
export interface DistanceResult {
  distance: number; // in kilometers
  duration: number; // in minutes (estimated)
  origin: Coordinates;
  destination: Coordinates;
}

/**
 * Geocode result
 */
export interface GeocodeResult {
  address: string;
  coordinates: Coordinates;
  placeId?: string;
  formattedAddress?: string;
  confidence?: number;
}

/**
 * Reverse geocode result
 */
export interface ReverseGeocodeResult extends GeocodeResult {
  street: string;
  city: string;
  subCity: string | null;
  state: string;
  country: string;
  postalCode: string | null;
}

/**
 * Location search result
 */
export interface LocationSearchResult {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  distance: number;
  category?: string;
}

/**
 * Bounding box
 */
export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Earth's radius in kilometers
 */
export const EARTH_RADIUS_KM = 6371;

/**
 * Earth's radius in miles
 */
export const EARTH_RADIUS_MILES = 3959;

/**
 * Default coordinates (Addis Ababa, Ethiopia)
 */
export const DEFAULT_COORDINATES: Coordinates = {
  lat: 9.03,
  lng: 38.74,
};

/**
 * Ethiopian cities with coordinates
 */
export const ETHIOPIAN_CITIES: Record<string, Coordinates> = {
  "Addis Ababa": { lat: 9.03, lng: 38.74 },
  "Bahir Dar": { lat: 11.6, lng: 37.38 },
  Gondar: { lat: 12.6, lng: 37.47 },
  Mekelle: { lat: 13.5, lng: 39.47 },
  Dessie: { lat: 11.13, lng: 39.63 },
  "Dire Dawa": { lat: 9.6, lng: 41.87 },
  Harar: { lat: 9.31, lng: 42.12 },
  Jimma: { lat: 7.67, lng: 36.83 },
  Adama: { lat: 8.54, lng: 39.27 },
  Hawassa: { lat: 7.05, lng: 38.48 },
  "Arba Minch": { lat: 6.04, lng: 37.55 },
  Jijiga: { lat: 9.35, lng: 42.8 },
  "Debre Birhan": { lat: 9.68, lng: 39.53 },
  "Debre Tabor": { lat: 11.85, lng: 38.01 },
  "Debre Markos": { lat: 10.34, lng: 37.73 },
  Nekemte: { lat: 9.08, lng: 36.55 },
  Gambela: { lat: 8.25, lng: 34.58 },
  Assosa: { lat: 10.07, lng: 34.53 },
  Semera: { lat: 11.79, lng: 41.01 },
  Adigrat: { lat: 14.27, lng: 39.46 },
  Adwa: { lat: 14.16, lng: 38.9 },
  Axum: { lat: 14.12, lng: 38.72 },
  Lalibela: { lat: 12.03, lng: 39.04 },
};

// ============================================================
// COORDINATE VALIDATION
// ============================================================

/**
 * Validate latitude
 */
export function isValidLatitude(lat: number): boolean {
  return (
    typeof lat === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    !isNaN(lat) &&
    isFinite(lat)
  );
}

/**
 * Validate longitude
 */
export function isValidLongitude(lng: number): boolean {
  return (
    typeof lng === "number" &&
    lng >= -180 &&
    lng <= 180 &&
    !isNaN(lng) &&
    isFinite(lng)
  );
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  return isValidLatitude(coords.lat) && isValidLongitude(coords.lng);
}

/**
 * Validate address
 */
export function isValidAddress(address: Address): boolean {
  if (!address) return false;
  if (!address.street || address.street.trim().length < 2) return false;
  if (!address.city || address.city.trim().length < 2) return false;
  return true;
}

// ============================================================
// DISTANCE CALCULATION
// ============================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates,
  unit: "km" | "miles" = "km",
): number {
  if (!isValidCoordinates(coord1) || !isValidCoordinates(coord2)) {
    throw new Error("Invalid coordinates");
  }

  const radius = unit === "km" ? EARTH_RADIUS_KM : EARTH_RADIUS_MILES;

  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) *
      Math.cos(toRadians(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radius * c;
}

/**
 * Calculate distance with estimated duration (assuming average speed)
 */
export function calculateDistanceWithDuration(
  coord1: Coordinates,
  coord2: Coordinates,
  averageSpeedKmh: number = 30,
): DistanceResult {
  const distance = calculateDistance(coord1, coord2, "km");
  const duration = (distance / averageSpeedKmh) * 60;

  return {
    distance,
    duration,
    origin: coord1,
    destination: coord2,
  };
}

/**
 * Calculate distance between multiple points
 */
export function calculateTotalDistance(
  points: Coordinates[],
  unit: "km" | "miles" = "km",
): number {
  if (!points || points.length < 2) {
    return 0;
  }

  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += calculateDistance(points[i], points[i + 1], unit);
  }

  return total;
}

// ============================================================
// BOUNDING BOX
// ============================================================

/**
 * Create bounding box from coordinates
 */
export function createBoundingBox(
  coordinates: Coordinates[],
  paddingKm: number = 1,
): BoundingBox {
  if (!coordinates || coordinates.length === 0) {
    throw new Error("At least one coordinate is required");
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const coord of coordinates) {
    if (coord.lat < minLat) minLat = coord.lat;
    if (coord.lat > maxLat) maxLat = coord.lat;
    if (coord.lng < minLng) minLng = coord.lng;
    if (coord.lng > maxLng) maxLng = coord.lng;
  }

  // Add padding
  const latPadding = paddingKm / 111; // 1 degree ≈ 111 km
  const lngPadding =
    paddingKm / (111 * Math.cos(toRadians((minLat + maxLat) / 2)));

  return {
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    minLng: minLng - lngPadding,
    maxLng: maxLng + lngPadding,
  };
}

/**
 * Check if coordinates are within a bounding box
 */
export function isWithinBoundingBox(
  coords: Coordinates,
  bbox: BoundingBox,
): boolean {
  return (
    coords.lat >= bbox.minLat &&
    coords.lat <= bbox.maxLat &&
    coords.lng >= bbox.minLng &&
    coords.lng <= bbox.maxLng
  );
}

/**
 * Get center of bounding box
 */
export function getBoundingBoxCenter(bbox: BoundingBox): Coordinates {
  return {
    lat: (bbox.minLat + bbox.maxLat) / 2,
    lng: (bbox.minLng + bbox.maxLng) / 2,
  };
}

// ============================================================
// SEARCH HELPERS
// ============================================================

/**
 * Filter coordinates within radius
 */
export function filterWithinRadius(
  points: { coordinates: Coordinates; data?: any }[],
  center: Coordinates,
  radiusKm: number,
): { coordinates: Coordinates; data?: any; distance: number }[] {
  if (!points || points.length === 0) {
    return [];
  }

  return points
    .map((item) => {
      const distance = calculateDistance(center, item.coordinates, "km");
      return {
        ...item,
        distance,
      };
    })
    .filter((item) => item.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Get nearest point
 */
export function findNearestPoint(
  points: { coordinates: Coordinates; data?: any }[],
  center: Coordinates,
): { coordinates: Coordinates; data?: any; distance: number } | null {
  if (!points || points.length === 0) {
    return null;
  }

  let nearest = null;
  let minDistance = Infinity;

  for (const point of points) {
    const distance = calculateDistance(center, point.coordinates, "km");
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...point, distance };
    }
  }

  return nearest;
}

// ============================================================
// ADDRESS HELPERS
// ============================================================

/**
 * Format address
 */
export function formatAddress(address: Address): string {
  if (!address) return "";

  const parts: string[] = [];

  if (address.street) {
    parts.push(address.street);
  }

  if (address.subCity) {
    parts.push(address.subCity);
  }

  if (address.city) {
    parts.push(address.city);
  }

  if (address.state) {
    parts.push(address.state);
  }

  if (address.country) {
    parts.push(address.country);
  }

  if (address.postalCode) {
    parts.push(address.postalCode);
  }

  return parts.join(", ");
}

/**
 * Format address for display
 */
export function formatAddressDisplay(
  address: Address,
  includeCoordinates: boolean = false,
): string {
  const formatted = formatAddress(address);

  if (includeCoordinates && address.coordinates) {
    return `${formatted} (${address.coordinates.lat}, ${address.coordinates.lng})`;
  }

  return formatted;
}

/**
 * Normalize city name
 */
export function normalizeCityName(city: string): string {
  if (!city) return "";
  return city
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[a-z]/, (c) => c.toUpperCase());
}

/**
 * Get city coordinates
 */
export function getCityCoordinates(city: string): Coordinates | null {
  const normalized = normalizeCityName(city);
  return ETHIOPIAN_CITIES[normalized] || null;
}

/**
 * Search city by name
 */
export function searchCity(searchTerm: string): string[] {
  const term = searchTerm.toLowerCase().trim();
  return Object.keys(ETHIOPIAN_CITIES).filter((city) =>
    city.toLowerCase().includes(term),
  );
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Check if coordinates are the same
 */
export function areCoordinatesEqual(
  coord1: Coordinates,
  coord2: Coordinates,
  tolerance: number = 0.001,
): boolean {
  return (
    Math.abs(coord1.lat - coord2.lat) < tolerance &&
    Math.abs(coord1.lng - coord2.lng) < tolerance
  );
}

/**
 * Round coordinates to decimal places
 */
export function roundCoordinates(
  coords: Coordinates,
  decimals: number = 6,
): Coordinates {
  const factor = Math.pow(10, decimals);
  return {
    lat: Math.round(coords.lat * factor) / factor,
    lng: Math.round(coords.lng * factor) / factor,
  };
}

/**
 * Get coordinate from address (mock - in production would use geocoding API)
 */
export function geocodeAddress(address: string): Coordinates | null {
  // This is a mock implementation
  // In production, use a geocoding service like Mapbox or Google Maps
  const cityMatch = Object.keys(ETHIOPIAN_CITIES).find((city) =>
    address.toLowerCase().includes(city.toLowerCase()),
  );

  if (cityMatch) {
    return ETHIOPIAN_CITIES[cityMatch];
  }

  return null;
}

/**
 * Get address from coordinates (mock - in production would use reverse geocoding)
 */
export function reverseGeocode(coords: Coordinates): string | null {
  // This is a mock implementation
  // In production, use a reverse geocoding service
  for (const [city, cityCoords] of Object.entries(ETHIOPIAN_CITIES)) {
    const distance = calculateDistance(coords, cityCoords, "km");
    if (distance < 10) {
      return city;
    }
  }

  return null;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Types
  Coordinates,
  Address,
  DistanceResult,
  GeocodeResult,
  ReverseGeocodeResult,
  LocationSearchResult,
  BoundingBox,

  // Constants
  EARTH_RADIUS_KM,
  EARTH_RADIUS_MILES,
  DEFAULT_COORDINATES,
  ETHIOPIAN_CITIES,

  // Validation
  isValidLatitude,
  isValidLongitude,
  isValidCoordinates,
  isValidAddress,

  // Distance
  calculateDistance,
  calculateDistanceWithDuration,
  calculateTotalDistance,

  // Bounding Box
  createBoundingBox,
  isWithinBoundingBox,
  getBoundingBoxCenter,

  // Search
  filterWithinRadius,
  findNearestPoint,

  // Address
  formatAddress,
  formatAddressDisplay,
  normalizeCityName,
  getCityCoordinates,
  searchCity,

  // Helpers
  toRadians,
  toDegrees,
  areCoordinatesEqual,
  roundCoordinates,
  geocodeAddress,
  reverseGeocode,
};
