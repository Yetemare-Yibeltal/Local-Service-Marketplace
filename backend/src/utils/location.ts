// ============================================================
// LOCATION HELPERS
// Complete location utility functions for the application
// ============================================================

// ============================================================
// TYPES
// ============================================================

/**
 * Coordinates interface
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Address interface
 */
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formatted?: string;
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
 * Bounding box
 */
export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Location search result
 */
export interface LocationSearchResult {
  address: string;
  coordinates: Coordinates;
  placeId?: string;
  type?: string;
  confidence?: number;
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
export const EARTH_RADIUS_MI = 3959;

/**
 * Default coordinates (Addis Ababa, Ethiopia)
 */
export const DEFAULT_COORDINATES: Coordinates = {
  lat: 9.03,
  lng: 38.74,
};

/**
 * Ethiopian cities coordinates
 */
export const ETHIOPIAN_CITIES: Record<string, Coordinates> = {
  "addis ababa": { lat: 9.03, lng: 38.74 },
  "bahir dar": { lat: 11.6, lng: 37.38 },
  "dire dawa": { lat: 9.6, lng: 41.85 },
  mekelle: { lat: 13.5, lng: 39.47 },
  gondar: { lat: 12.6, lng: 37.47 },
  hawassa: { lat: 7.05, lng: 38.48 },
  jimma: { lat: 7.67, lng: 36.83 },
  adama: { lat: 8.55, lng: 39.27 },
  harar: { lat: 9.31, lng: 42.12 },
  dessie: { lat: 11.13, lng: 39.63 },
  "debre markos": { lat: 10.33, lng: 37.73 },
  "debre berhan": { lat: 9.68, lng: 39.53 },
  asosa: { lat: 10.07, lng: 34.53 },
  gambela: { lat: 8.25, lng: 34.58 },
  jijiga: { lat: 9.35, lng: 42.8 },
  shashamane: { lat: 7.2, lng: 38.6 },
  "wolaita sodo": { lat: 6.85, lng: 37.77 },
  "arba minch": { lat: 6.03, lng: 37.55 },
  batu: { lat: 7.94, lng: 38.7 },
  bishoftu: { lat: 8.75, lng: 38.98 },
};

// ============================================================
// DISTANCE CALCULATION
// ============================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  unit: "km" | "mi" = "km",
): number {
  const radius = unit === "km" ? EARTH_RADIUS_KM : EARTH_RADIUS_MI;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radius * c;
}

/**
 * Calculate distance between two coordinate objects
 */
export function calculateDistanceBetween(
  origin: Coordinates,
  destination: Coordinates,
  unit: "km" | "mi" = "km",
): number {
  return calculateDistance(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng,
    unit,
  );
}

/**
 * Calculate estimated travel time based on distance
 */
export function calculateTravelTime(
  distance: number,
  speed: number = 30, // km/h average speed
  unit: "km" | "mi" = "km",
): number {
  const speedInUnit = unit === "km" ? speed : speed * 1.60934;
  const timeInHours = distance / speedInUnit;
  return timeInHours * 60; // Return in minutes
}

/**
 * Get distance and estimated travel time
 */
export function getDistanceAndTime(
  origin: Coordinates,
  destination: Coordinates,
  speed: number = 30,
  unit: "km" | "mi" = "km",
): DistanceResult {
  const distance = calculateDistanceBetween(origin, destination, unit);
  const duration = calculateTravelTime(distance, speed, unit);

  return {
    distance,
    duration,
    origin,
    destination,
  };
}

// ============================================================
// COORDINATE VALIDATION
// ============================================================

/**
 * Validate latitude
 */
export function isValidLatitude(lat: number): boolean {
  return typeof lat === "number" && !isNaN(lat) && lat >= -90 && lat <= 90;
}

/**
 * Validate longitude
 */
export function isValidLongitude(lng: number): boolean {
  return typeof lng === "number" && !isNaN(lng) && lng >= -180 && lng <= 180;
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  return isValidLatitude(coords.lat) && isValidLongitude(coords.lng);
}

/**
 * Validate coordinates with strict check
 */
export function isValidCoordinatesStrict(coords: Coordinates): boolean {
  if (!isValidCoordinates(coords)) return false;

  // Additional checks for Ethiopian region (optional)
  // const isInEthiopia = coords.lat >= 3 && coords.lat <= 15 && coords.lng >= 33 && coords.lng <= 48;

  return true;
}

// ============================================================
// BOUNDING BOX
// ============================================================

/**
 * Calculate bounding box from center and radius
 */
export function getBoundingBox(
  center: Coordinates,
  radiusKm: number,
): BoundingBox {
  const lat = center.lat;
  const lng = center.lng;

  // Approximate degrees per kilometer
  const latDegPerKm = 1 / 111.32;
  const lngDegPerKm = 1 / (111.32 * Math.cos((lat * Math.PI) / 180));

  const latDelta = radiusKm * latDegPerKm;
  const lngDelta = radiusKm * lngDegPerKm;

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
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
 * Check if coordinates are within a radius
 */
export function isWithinRadius(
  point: Coordinates,
  center: Coordinates,
  radiusKm: number,
): boolean {
  const distance = calculateDistanceBetween(point, center);
  return distance <= radiusKm;
}

// ============================================================
// ADDRESS FORMATTING
// ============================================================

/**
 * Format address string
 */
export function formatAddress(address: Address): string {
  const parts: string[] = [];

  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);

  return parts.join(", ");
}

/**
 * Get short address
 */
export function getShortAddress(
  address: string,
  maxLength: number = 50,
): string {
  if (!address) return "";
  if (address.length <= maxLength) return address;
  return address.substring(0, maxLength) + "...";
}

/**
 * Extract city from address
 */
export function extractCity(address: string): string | null {
  if (!address) return null;

  // Common Ethiopian city names
  const cities = [
    "Addis Ababa",
    "Bahir Dar",
    "Dire Dawa",
    "Mekelle",
    "Gondar",
    "Hawassa",
    "Jimma",
    "Adama",
    "Harar",
    "Dessie",
    "Debre Markos",
    "Debre Berhan",
    "Asosa",
    "Gambela",
    "Jijiga",
    "Shashamane",
    "Wolaita Sodo",
    "Arba Minch",
    "Batu",
    "Bishoftu",
  ];

  for (const city of cities) {
    if (address.toLowerCase().includes(city.toLowerCase())) {
      return city;
    }
  }

  return null;
}

// ============================================================
// GEOCODING HELPERS
// ============================================================

/**
 * Get coordinates for a city (Ethiopian cities only)
 */
export function getCityCoordinates(cityName: string): Coordinates | null {
  const normalizedName = cityName.toLowerCase().trim();
  return ETHIOPIAN_CITIES[normalizedName] || null;
}

/**
 * Search for location by name
 */
export function searchLocation(query: string): LocationSearchResult[] {
  const results: LocationSearchResult[] = [];
  const normalizedQuery = query.toLowerCase().trim();

  // Search in Ethiopian cities
  for (const [cityName, coords] of Object.entries(ETHIOPIAN_CITIES)) {
    if (cityName.includes(normalizedQuery)) {
      results.push({
        address: cityName.charAt(0).toUpperCase() + cityName.slice(1),
        coordinates: coords,
        type: "city",
        confidence: 1.0,
      });
    }
  }

  return results;
}

// ============================================================
// SORTING AND FILTERING
// ============================================================

/**
 * Sort locations by distance from origin
 */
export function sortByDistance<
  T extends { location?: Coordinates; lat?: number; lng?: number },
>(
  items: T[],
  origin: Coordinates,
  getCoordinates: (item: T) => Coordinates,
): T[] {
  return [...items].sort((a, b) => {
    const coordsA = getCoordinates(a);
    const coordsB = getCoordinates(b);

    if (!coordsA || !coordsB) return 0;

    const distA = calculateDistanceBetween(origin, coordsA);
    const distB = calculateDistanceBetween(origin, coordsB);

    return distA - distB;
  });
}

/**
 * Filter items within a radius
 */
export function filterWithinRadius<
  T extends { location?: Coordinates; lat?: number; lng?: number },
>(
  items: T[],
  origin: Coordinates,
  radiusKm: number,
  getCoordinates: (item: T) => Coordinates,
): T[] {
  return items.filter((item) => {
    const coords = getCoordinates(item);
    if (!coords) return false;
    const distance = calculateDistanceBetween(origin, coords);
    return distance <= radiusKm;
  });
}

/**
 * Get coordinates from item with fallback
 */
export function getItemCoordinates<
  T extends { location?: Coordinates; lat?: number; lng?: number },
>(item: T): Coordinates | null {
  if (item.location && isValidCoordinates(item.location)) {
    return item.location;
  }

  if (item.lat !== undefined && item.lng !== undefined) {
    const coords = { lat: item.lat, lng: item.lng };
    if (isValidCoordinates(coords)) {
      return coords;
    }
  }

  return null;
}

// ============================================================
// DEFAULT COORDINATES
// ============================================================

/**
 * Get default coordinates (Addis Ababa)
 */
export function getDefaultCoordinates(): Coordinates {
  return { ...DEFAULT_COORDINATES };
}

/**
 * Get coordinates for a location with fallback to default
 */
export function getCoordinatesWithFallback(
  coords: Coordinates | null | undefined,
  fallback: Coordinates = DEFAULT_COORDINATES,
): Coordinates {
  if (coords && isValidCoordinates(coords)) {
    return coords;
  }
  return { ...fallback };
}

/**
 * Parse coordinates from string
 */
export function parseCoordinates(coordsString: string): Coordinates | null {
  try {
    const parts = coordsString.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length !== 2) return null;

    const coords = { lat: parts[0], lng: parts[1] };
    if (isValidCoordinates(coords)) {
      return coords;
    }

    return null;
  } catch {
    return null;
  }
}

// ============================================================
// DISTANCE FORMATTING
// ============================================================

/**
 * Format distance for display
 */
export function formatDistance(
  distance: number,
  unit: "km" | "mi" = "km",
): string {
  if (distance < 0) return "0 m";

  if (distance < 1) {
    const meters = Math.round(distance * 1000);
    return `${meters} m`;
  }

  return `${distance.toFixed(1)} ${unit}`;
}

/**
 * Format travel time for display
 */
export function formatTravelTime(minutes: number): string {
  if (minutes < 0) return "0 min";

  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (mins === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${mins} min`;
}

// ============================================================
// LOCATION COMPARISON
// ============================================================

/**
 * Check if two coordinates are approximately equal
 */
export function areCoordinatesEqual(
  coords1: Coordinates,
  coords2: Coordinates,
  tolerance: number = 0.0001,
): boolean {
  return (
    Math.abs(coords1.lat - coords2.lat) < tolerance &&
    Math.abs(coords1.lng - coords2.lng) < tolerance
  );
}

/**
 * Get midpoint between two coordinates
 */
export function getMidpoint(
  coords1: Coordinates,
  coords2: Coordinates,
): Coordinates {
  return {
    lat: (coords1.lat + coords2.lat) / 2,
    lng: (coords1.lng + coords2.lng) / 2,
  };
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Constants
  EARTH_RADIUS_KM,
  EARTH_RADIUS_MI,
  DEFAULT_COORDINATES,
  ETHIOPIAN_CITIES,

  // Types
  Coordinates,
  Address,
  DistanceResult,
  BoundingBox,
  LocationSearchResult,

  // Distance calculation
  calculateDistance,
  calculateDistanceBetween,
  calculateTravelTime,
  getDistanceAndTime,

  // Coordinate validation
  isValidLatitude,
  isValidLongitude,
  isValidCoordinates,
  isValidCoordinatesStrict,

  // Bounding box
  getBoundingBox,
  isWithinBoundingBox,
  isWithinRadius,

  // Address formatting
  formatAddress,
  getShortAddress,
  extractCity,

  // Geocoding helpers
  getCityCoordinates,
  searchLocation,

  // Sorting and filtering
  sortByDistance,
  filterWithinRadius,
  getItemCoordinates,

  // Default coordinates
  getDefaultCoordinates,
  getCoordinatesWithFallback,
  parseCoordinates,

  // Distance formatting
  formatDistance,
  formatTravelTime,

  // Location comparison
  areCoordinatesEqual,
  getMidpoint,
};
