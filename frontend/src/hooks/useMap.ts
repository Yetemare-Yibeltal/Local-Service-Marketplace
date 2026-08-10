'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ============================================================
// TYPES
// ============================================================

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapMarker {
  id: string;
  position: MapCoordinates;
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
  data?: any;
}

export interface MapOptions {
  center?: MapCoordinates;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  style?: string;
  controls?: boolean;
  scrollZoom?: boolean;
  dragPan?: boolean;
  interactive?: boolean;
}

export interface AddressResult {
  formattedAddress: string;
  street: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  confidence: number;
}

// ============================================================
// HOOK
// ============================================================

export function useMap(options: MapOptions = {}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<MapMarker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [center, setCenter] = useState<MapCoordinates | null>(options.center || null);
  const [zoom, setZoom] = useState<number>(options.zoom || 12);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [error, setError] = useState<string | null>(null);

  const defaultCenter: MapCoordinates = options.center || { lat: 9.03, lng: 38.74 }; // Addis Ababa

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mapContainerRef.current) return;

    setIsLoading(true);

    // For this hook, we'll use Mapbox GL JS or Leaflet
    // This is a simplified implementation that works with both
    const initMap = async () => {
      try {
        // Check if mapbox is available
        const mapboxgl = (window as any).mapboxgl;
        if (mapboxgl) {
          // Use Mapbox
          mapInstanceRef.current = new mapboxgl.Map({
            container: mapContainerRef.current!,
            center: [defaultCenter.lng, defaultCenter.lat],
            zoom: zoom,
            style: options.style || 'mapbox://styles/mapbox/streets-v11',
            minZoom: options.minZoom || 3,
            maxZoom: options.maxZoom || 18,
            scrollZoom: options.scrollZoom !== false,
            dragPan: options.dragPan !== false,
            interactive: options.interactive !== false,
          });

          mapInstanceRef.current.on('load', () => {
            setIsLoaded(true);
            setIsLoading(false);
          });

          mapInstanceRef.current.on('move', () => {
            const center = mapInstanceRef.current.getCenter();
            setCenter({ lat: center.lat, lng: center.lng });
            setZoom(mapInstanceRef.current.getZoom());
          });

          mapInstanceRef.current.on('moveend', () => {
            const bounds = mapInstanceRef.current.getBounds();
            if (bounds) {
              setBounds({
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
              });
            }
          });

          // Navigation controls
          if (options.controls !== false) {
            mapInstanceRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
          }
        } else {
          // Fallback: use Leaflet
          const L = (window as any).L;
          if (L) {
            mapInstanceRef.current = L.map(mapContainerRef.current!, {
              center: [defaultCenter.lat, defaultCenter.lng],
              zoom: zoom,
              zoomControl: options.controls !== false,
              scrollWheelZoom: options.scrollZoom !== false,
              dragging: options.dragPan !== false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors',
            }).addTo(mapInstanceRef.current);

            mapInstanceRef.current.on('move', () => {
              const center = mapInstanceRef.current.getCenter();
              setCenter({ lat: center.lat, lng: center.lng });
              setZoom(mapInstanceRef.current.getZoom());
            });

            mapInstanceRef.current.on('moveend', () => {
              const bounds = mapInstanceRef.current.getBounds();
              if (bounds) {
                setBounds({
                  north: bounds.getNorth(),
                  south: bounds.getSouth(),
                  east: bounds.getEast(),
                  west: bounds.getWest(),
                });
              }
            });

            setIsLoaded(true);
            setIsLoading(false);
          } else {
            setError('No map library available');
            setIsLoading(false);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          // Ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, [defaultCenter.lat, defaultCenter.lng, options]);

  // Add markers
  const addMarkers = useCallback(
    (markers: MapMarker[]): void => {
      if (!mapInstanceRef.current || !isLoaded) return;

      // Remove existing markers
      removeMarkers();

      markersRef.current = markers;

      const map = mapInstanceRef.current;
      const mapboxgl = (window as any).mapboxgl;
      const L = (window as any).L;

      if (mapboxgl) {
        // Mapbox markers
        markers.forEach((marker) => {
          const el = document.createElement('div');
          el.className = 'map-marker';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = marker.color || '#3b82f6';
          el.style.border = '2px solid white';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.fontSize = '14px';
          el.style.fontWeight = 'bold';
          el.style.color = 'white';
          el.textContent = marker.icon || '';

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <strong>${marker.title || ''}</strong><br>
            ${marker.description || ''}
          `);

          new mapboxgl.Marker(el)
            .setLngLat([marker.position.lng, marker.position.lat])
            .setPopup(popup)
            .addTo(map);
        });
      } else if (L) {
        // Leaflet markers
        markers.forEach((marker) => {
          const icon = L.divIcon({
            html: `<div style="width:30px;height:30px;border-radius:50%;background-color:${marker.color || '#3b82f6'};border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:white;">${marker.icon || ''}</div>`,
            className: '',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });

          L.marker([marker.position.lat, marker.position.lng], { icon })
            .bindPopup(
              `
            <strong>${marker.title || ''}</strong><br>
            ${marker.description || ''}
          `
            )
            .addTo(map);
        });
      }
    },
    [isLoaded]
  );

  // Remove markers
  const removeMarkers = useCallback((): void => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const mapboxgl = (window as any).mapboxgl;

    if (mapboxgl) {
      // Mapbox: remove markers by class
      document.querySelectorAll('.map-marker').forEach((el) => el.remove());
    } else {
      // Leaflet: remove layers
      map.eachLayer((layer: any) => {
        if (layer._popup) {
          map.removeLayer(layer);
        }
      });
    }

    markersRef.current = [];
  }, []);

  // Fly to location
  const flyTo = useCallback(
    (coords: MapCoordinates, zoomLevel?: number): void => {
      if (!mapInstanceRef.current || !isLoaded) return;

      const map = mapInstanceRef.current;
      const zoomVal = zoomLevel || zoom;

      if (map.flyTo) {
        map.flyTo({
          center: [coords.lng, coords.lat],
          zoom: zoomVal,
          duration: 1500,
        });
      } else {
        map.setView([coords.lat, coords.lng], zoomVal);
      }

      setCenter(coords);
      if (zoomLevel) setZoom(zoomLevel);
    },
    [isLoaded, zoom]
  );

  // Fit bounds
  const fitBounds = useCallback(
    (bounds: MapBounds): void => {
      if (!mapInstanceRef.current || !isLoaded) return;

      const map = mapInstanceRef.current;
      const mapboxgl = (window as any).mapboxgl;

      if (mapboxgl) {
        map.fitBounds(
          [
            [bounds.west, bounds.south],
            [bounds.east, bounds.north],
          ],
          { padding: 50, duration: 1500 }
        );
      } else {
        const L = (window as any).L;
        if (L) {
          map.fitBounds(
            [
              [bounds.south, bounds.west],
              [bounds.north, bounds.east],
            ],
            { padding: [50, 50] }
          );
        }
      }
    },
    [isLoaded]
  );

  // Get current location
  const getCurrentLocation = useCallback((): Promise<MapCoordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(coords);
          resolve(coords);
        },
        (err) => {
          reject(new Error(err.message || 'Failed to get location'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  // Search address
  const searchAddress = useCallback(async (query: string): Promise<AddressResult[]> => {
    try {
      // Use Mapbox Geocoding API
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) {
        throw new Error('Mapbox token not configured');
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=et&types=address,place,locality,neighborhood&limit=5`
      );

      if (!response.ok) {
        throw new Error('Failed to search address');
      }

      const data = await response.json();
      const results: AddressResult[] = data.features.map((feature: any) => {
        const context = feature.context || [];
        const city = context.find((c: any) => c.id.includes('place'))?.text || '';
        const region = context.find((c: any) => c.id.includes('region'))?.text || '';
        const country = context.find((c: any) => c.id.includes('country'))?.text || 'Ethiopia';
        const postalCode = context.find((c: any) => c.id.includes('postcode'))?.text || '';

        return {
          formattedAddress: feature.place_name,
          street: feature.address || feature.text || '',
          city: city,
          region: region,
          country: country,
          postalCode: postalCode,
          latitude: feature.center[1],
          longitude: feature.center[0],
          confidence: feature.relevance || 0,
        };
      });

      return results;
    } catch (error) {
      console.error('Address search error:', error);
      return [];
    }
  }, []);

  // Reverse geocode
  const reverseGeocode = useCallback(
    async (coords: MapCoordinates): Promise<AddressResult | null> => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
          throw new Error('Mapbox token not configured');
        }

        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${token}&types=address,place,locality,neighborhood&limit=1`
        );

        if (!response.ok) {
          throw new Error('Failed to reverse geocode');
        }

        const data = await response.json();
        const feature = data.features?.[0];
        if (!feature) return null;

        const context = feature.context || [];
        const city = context.find((c: any) => c.id.includes('place'))?.text || '';
        const region = context.find((c: any) => c.id.includes('region'))?.text || '';
        const country = context.find((c: any) => c.id.includes('country'))?.text || 'Ethiopia';
        const postalCode = context.find((c: any) => c.id.includes('postcode'))?.text || '';

        return {
          formattedAddress: feature.place_name,
          street: feature.address || feature.text || '',
          city: city,
          region: region,
          country: country,
          postalCode: postalCode,
          latitude: coords.lat,
          longitude: coords.lng,
          confidence: feature.relevance || 0,
        };
      } catch (error) {
        console.error('Reverse geocode error:', error);
        return null;
      }
    },
    []
  );

  // Get distance between coordinates (Haversine)
  const getDistance = useCallback((coords1: MapCoordinates, coords2: MapCoordinates): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
    const dLng = ((coords2.lng - coords1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coords1.lat * Math.PI) / 180) *
        Math.cos((coords2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  return {
    mapContainerRef,
    mapInstance: mapInstanceRef.current,
    isLoaded,
    isLoading,
    center,
    zoom,
    bounds,
    error,
    addMarkers,
    removeMarkers,
    flyTo,
    fitBounds,
    getCurrentLocation,
    searchAddress,
    reverseGeocode,
    getDistance,
  };
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useMap;
