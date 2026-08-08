import axios, { AxiosInstance } from "axios";
import env from "../../config/env";
import logger from "../../utils/logger";
import { cacheSet, cacheGet } from "../../config/redis";

// ============================================================
// TYPES
// ============================================================

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeName: string;
  street: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
  confidence: number;
}

export interface ReverseGeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeName: string;
  street: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
  distance: number;
}

export interface PlaceSearchResult {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  distance: number;
  categories: string[];
}

export interface DistanceResult {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  distance: number; // in kilometers
  duration: number; // in minutes
}

export interface AutocompleteResult {
  id: string;
  placeName: string;
  address: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
}

// ============================================================
// MAPBOX SERVICE
// ============================================================

/**
 * Mapbox service class for geolocation operations
 */
class MapboxService {
  private client: AxiosInstance;
  private baseUrl: string = "https://api.mapbox.com";
  private searchUrl: string = "https://api.mapbox.com/search/geocode/v6";

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      params: {
        access_token: env.MAPBOX_ACCESS_TOKEN,
      },
    });
  }

  /**
   * Check if Mapbox is configured
   */
  isConfigured(): boolean {
    return !!env.MAPBOX_ACCESS_TOKEN;
  }

  /**
   * Geocode an address to coordinates
   */
  async geocode(address: string): Promise<GeocodeResult | null> {
    try {
      if (!this.isConfigured()) {
        logger.warn("Mapbox not configured");
        return null;
      }

      const cacheKey = `geocode:${address.toLowerCase().trim()}`;
      const cached = await cacheGet<GeocodeResult>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get("/geocoding/v5/mapbox.places", {
        params: {
          q: address,
          limit: 1,
          country: "et",
          types: "address,place,locality,neighborhood",
        },
      });

      const features = response.data.features;

      if (!features || features.length === 0) {
        logger.debug(`No geocode results for address: ${address}`);
        return null;
      }

      const feature = features[0];
      const [longitude, latitude] = feature.center;
      const context = this.extractContext(feature.context);

      const result: GeocodeResult = {
        latitude,
        longitude,
        formattedAddress: feature.place_name,
        placeName: feature.text,
        street: feature.address || "",
        city: context.city || "",
        region: context.region || "",
        country: context.country || "Ethiopia",
        postalCode: context.postalCode || "",
        confidence: feature.relevance || 0,
      };

      // Cache for 30 days (geocode results are stable)
      await cacheSet(cacheKey, result, 2592000);

      return result;
    } catch (error) {
      logger.error("Geocode failed:", error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<ReverseGeocodeResult | null> {
    try {
      if (!this.isConfigured()) {
        logger.warn("Mapbox not configured");
        return null;
      }

      const cacheKey = `reverse:${latitude}:${longitude}`;
      const cached = await cacheGet<ReverseGeocodeResult>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get("/geocoding/v5/mapbox.places", {
        params: {
          q: `${longitude},${latitude}`,
          limit: 1,
          types: "address,place,locality,neighborhood",
        },
      });

      const features = response.data.features;

      if (!features || features.length === 0) {
        logger.debug(
          `No reverse geocode results for coordinates: ${latitude}, ${longitude}`,
        );
        return null;
      }

      const feature = features[0];
      const context = this.extractContext(feature.context);

      const result: ReverseGeocodeResult = {
        latitude,
        longitude,
        formattedAddress: feature.place_name,
        placeName: feature.text,
        street: feature.address || "",
        city: context.city || "",
        region: context.region || "",
        country: context.country || "Ethiopia",
        postalCode: context.postalCode || "",
        distance: feature.distance || 0,
      };

      // Cache for 30 days
      await cacheSet(cacheKey, result, 2592000);

      return result;
    } catch (error) {
      logger.error("Reverse geocode failed:", error);
      return null;
    }
  }

  /**
   * Search for places
   */
  async searchPlaces(
    query: string,
    latitude?: number,
    longitude?: number,
    radius: number = 10,
    limit: number = 10,
  ): Promise<PlaceSearchResult[]> {
    try {
      if (!this.isConfigured()) {
        logger.warn("Mapbox not configured");
        return [];
      }

      const cacheKey = `places:${query}:${latitude}:${longitude}:${radius}:${limit}`;
      const cached = await cacheGet<PlaceSearchResult[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const params: any = {
        q: query,
        limit,
        country: "et",
        types: "address,place,locality,neighborhood,poi",
      };

      if (latitude && longitude) {
        params.proximity = `${longitude},${latitude}`;
      }

      const response = await this.client.get("/geocoding/v5/mapbox.places", {
        params,
      });

      const features = response.data.features;

      if (!features) {
        return [];
      }

      const results: PlaceSearchResult[] = features.map((feature: any) => {
        const [lng, lat] = feature.center;
        const context = this.extractContext(feature.context);

        return {
          id: feature.id,
          name: feature.text,
          address: feature.address || "",
          city: context.city || "",
          region: context.region || "",
          country: context.country || "Ethiopia",
          latitude: lat,
          longitude: lng,
          distance: feature.distance || 0,
          categories: feature.category || [],
        };
      });

      // Cache for 1 hour
      await cacheSet(cacheKey, results, 3600);

      return results;
    } catch (error) {
      logger.error("Search places failed:", error);
      return [];
    }
  }

  /**
   * Autocomplete places (for search input)
   */
  async autocompletePlaces(
    query: string,
    latitude?: number,
    longitude?: number,
    limit: number = 5,
  ): Promise<AutocompleteResult[]> {
    try {
      if (!this.isConfigured()) {
        logger.warn("Mapbox not configured");
        return [];
      }

      if (!query || query.length < 2) {
        return [];
      }

      const cacheKey = `autocomplete:${query}:${latitude}:${longitude}`;
      const cached = await cacheGet<AutocompleteResult[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const params: any = {
        q: query,
        limit,
        country: "et",
        types: "address,place,locality,neighborhood",
        autocomplete: true,
      };

      if (latitude && longitude) {
        params.proximity = `${longitude},${latitude}`;
      }

      const response = await this.client.get("/search/geocode/v6/forward", {
        baseURL: this.searchUrl,
        params,
      });

      const features = response.data.features;

      if (!features) {
        return [];
      }

      const results: AutocompleteResult[] = features.map((feature: any) => {
        const [lng, lat] = feature.geometry.coordinates;
        const context = this.extractContext(feature.properties.context || []);

        return {
          id: feature.properties.mapbox_id || feature.id,
          placeName:
            feature.properties.full_address || feature.properties.name || "",
          address: feature.properties.name || "",
          city: context.city || "",
          region: context.region || "",
          latitude: lat,
          longitude: lng,
        };
      });

      // Cache for 10 minutes
      await cacheSet(cacheKey, results, 600);

      return results;
    } catch (error) {
      logger.error("Autocomplete places failed:", error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get distance and duration between two coordinates
   */
  async getDistance(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<DistanceResult | null> {
    try {
      if (!this.isConfigured()) {
        logger.warn("Mapbox not configured");
        return null;
      }

      const cacheKey = `distance:${originLat}:${originLng}:${destLat}:${destLng}`;
      const cached = await cacheGet<DistanceResult>(cacheKey);
      if (cached) {
        return cached;
      }

      const coordinates = `${originLng},${originLat};${destLng},${destLat}`;

      const response = await this.client.get("/directions/v5/mapbox/driving", {
        params: {
          coordinates,
          geometries: "geojson",
          overview: "simplified",
          access_token: env.MAPBOX_ACCESS_TOKEN,
        },
      });

      const data = response.data;

      if (!data.routes || data.routes.length === 0) {
        logger.debug("No route found between coordinates");
        return null;
      }

      const route = data.routes[0];
      const distanceKm = route.distance / 1000; // Convert meters to km
      const durationMin = route.duration / 60; // Convert seconds to minutes

      const result: DistanceResult = {
        origin: { latitude: originLat, longitude: originLng },
        destination: { latitude: destLat, longitude: destLng },
        distance: distanceKm,
        duration: durationMin,
      };

      // Cache for 1 day (distance doesn't change often)
      await cacheSet(cacheKey, result, 86400);

      return result;
    } catch (error) {
      logger.error("Get distance failed:", error);
      // Fallback to direct distance calculation
      const distance = this.calculateDistance(
        originLat,
        originLng,
        destLat,
        destLng,
      );
      return {
        origin: { latitude: originLat, longitude: originLng },
        destination: { latitude: destLat, longitude: destLng },
        distance,
        duration: (distance / 30) * 60, // Assume 30 km/h average speed
      };
    }
  }

  /**
   * Get static map image URL
   */
  getStaticMapUrl(
    latitude: number,
    longitude: number,
    width: number = 600,
    height: number = 400,
    zoom: number = 14,
    marker: boolean = true,
  ): string {
    if (!this.isConfigured()) {
      return "";
    }

    let url = `${this.baseUrl}/styles/v1/mapbox/streets-v12/static`;

    if (marker) {
      url += `/pin-s+2563eb(${longitude},${latitude})`;
    }

    url += `/${longitude},${latitude},${zoom}/${width}x${height}`;
    url += `?access_token=${env.MAPBOX_ACCESS_TOKEN}`;

    return url;
  }

  /**
   * Get multiple static map images URL
   */
  getMultipleStaticMapUrl(
    coordinates: { latitude: number; longitude: number }[],
    width: number = 600,
    height: number = 400,
    zoom: number = 12,
  ): string {
    if (!this.isConfigured()) {
      return "";
    }

    let markers = "";
    coordinates.forEach((coord) => {
      markers += `pin-s+2563eb(${coord.longitude},${coord.latitude})/`;
    });

    const center = this.getCenterCoordinate(coordinates);

    return `${this.baseUrl}/styles/v1/mapbox/streets-v12/static/${markers}${center.longitude},${center.latitude},${zoom}/${width}x${height}?access_token=${env.MAPBOX_ACCESS_TOKEN}`;
  }

  /**
   * Get center coordinate from multiple coordinates
   */
  private getCenterCoordinate(
    coordinates: { latitude: number; longitude: number }[],
  ): { latitude: number; longitude: number } {
    if (coordinates.length === 0) {
      return { latitude: 0, longitude: 0 };
    }

    let sumLat = 0;
    let sumLng = 0;

    coordinates.forEach((coord) => {
      sumLat += coord.latitude;
      sumLng += coord.longitude;
    });

    return {
      latitude: sumLat / coordinates.length,
      longitude: sumLng / coordinates.length,
    };
  }

  /**
   * Extract context from Mapbox response
   */
  private extractContext(context: any[]): {
    city: string;
    region: string;
    country: string;
    postalCode: string;
  } {
    let city = "";
    let region = "";
    let country = "";
    let postalCode = "";

    if (!context) {
      return { city, region, country, postalCode };
    }

    context.forEach((item: any) => {
      const id = item.id || "";
      if (id.includes("place")) {
        city = item.text || "";
      } else if (id.includes("region")) {
        region = item.text || "";
      } else if (id.includes("country")) {
        country = item.text || "";
      } else if (id.includes("postcode")) {
        postalCode = item.text || "";
      }
    });

    return { city, region, country, postalCode };
  }
}

// ============================================================
// EXPORTS
// ============================================================

const mapboxService = new MapboxService();

export default mapboxService;
