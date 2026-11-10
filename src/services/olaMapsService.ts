import { LatLng, LocationPoint } from '../types';

/**
 * Returns the active Ola Maps API Key from environment or local storage.
 */
export function getOlaMapsApiKey(): string {
  try {
    const metaEnv = import.meta.env as any;
    const envKey = (
      metaEnv.VITE_OLA_MAPS_API_KEY ||
      metaEnv.VITE_OLA_MAP_API_KEY ||
      metaEnv.VITE_OLA_MAP_APIKEY ||
      metaEnv.VITE_OLA_MAPS_APIKEY ||
      metaEnv.OLA_MAPS_API_KEY ||
      metaEnv.OLA_MAP_API_KEY ||
      metaEnv.OLA_MAP_APIKEY ||
      metaEnv.OLA_MAPS_APIKEY ||
      metaEnv.OLA_API_KEY ||
      metaEnv.OLA_APIKEY ||
      metaEnv.VITE_OLA_API_KEY ||
      metaEnv.VITE_OLA_APIKEY ||
      metaEnv.OLA_KEY ||
      metaEnv.OLA_MAP_KEY ||
      metaEnv.OLA_MAPS_KEY ||
      metaEnv.VITE_OLA_KEY ||
      metaEnv.VITE_OLA_MAP_KEY ||
      ''
    ).trim();
    if (envKey && envKey !== 'YOUR_OLA_MAPS_API_KEY' && envKey !== 'undefined' && envKey !== 'null') {
      return envKey;
    }
  } catch (e) {
    // ignore
  }

  try {
    const localKey = (
      localStorage.getItem('OLA_MAPS_API_KEY') ||
      localStorage.getItem('VITE_OLA_MAPS_API_KEY') ||
      ''
    ).trim();
    if (localKey && localKey !== 'undefined' && localKey !== 'null') {
      return localKey;
    }
  } catch (e) {
    // ignore
  }

  try {
    const win = window as any;
    const winKey = (
      win.__OLA_MAPS_API_KEY__ ||
      win.OLA_MAPS_API_KEY ||
      win.VITE_OLA_MAPS_API_KEY ||
      ''
    ).trim();
    if (winKey && winKey !== 'undefined') return winKey;
  } catch (e) {
    // ignore
  }

  // Default to active Ola Maps API Key provided by user
  return '6iWlDgYtwdTuGrbJso3Vbq17GU6lMsiV';
}

/**
 * Persists an Ola Maps API key into localStorage for immediate live preview.
 */
export function setOlaMapsApiKey(apiKey: string): void {
  try {
    if (apiKey && apiKey.trim()) {
      localStorage.setItem('OLA_MAPS_API_KEY', apiKey.trim());
      (window as any).__OLA_MAPS_API_KEY__ = apiKey.trim();
    } else {
      localStorage.removeItem('OLA_MAPS_API_KEY');
      delete (window as any).__OLA_MAPS_API_KEY__;
    }
    // Dispatch custom event to notify map & search services
    window.dispatchEvent(new CustomEvent('ola-maps-key-changed', { detail: { apiKey } }));
  } catch (e) {
    console.warn('Could not persist Ola Maps key:', e);
  }
}

/**
 * Returns the Ola Maps tile URL if API key is present.
 * Uses official Ola Maps raster tile endpoint:
 * https://api.olamaps.io/tiles/vector/v1/styles/default/{z}/{x}/{y}.png?api_key=...
 */
export function getOlaTileUrl(): string | null {
  const key = getOlaMapsApiKey();
  if (!key) return null;
  return `https://api.olamaps.io/tiles/vector/v1/styles/default/{z}/{x}/{y}.png?api_key=${encodeURIComponent(key)}`;
}

/**
 * Autocomplete places search using Ola Maps Places API
 */
export async function searchOlaPlaces(query: string): Promise<Array<{
  id: string;
  primaryName: string;
  secondaryAddress: string;
  area: string;
  lat: number;
  lng: number;
}> | null> {
  const key = getOlaMapsApiKey();
  if (!key) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    // Call Ola Maps Autocomplete API biased around Kolkata
    const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(
      query
    )}&location=22.5726,88.3639&radius=50000&api_key=${encodeURIComponent(key)}`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn('Ola Maps Autocomplete HTTP', res.status);
      return null;
    }

    const data = await res.json();
    const predictions = data.predictions || [];

    const results = predictions.map((p: any, idx: number) => {
      const description = p.description || p.formatted_address || query;
      const terms = p.terms || [];
      const primaryName = p.structured_formatting?.main_text || terms[0]?.value || description.split(',')[0];
      const secondaryAddress =
        p.structured_formatting?.secondary_text ||
        terms.slice(1).map((t: any) => t.value).join(', ') ||
        description;
      const area = terms[1]?.value || 'Kolkata';

      // If coordinates are directly provided in geometry or location
      const lat = p.geometry?.location?.lat || 22.5726 + (Math.random() - 0.5) * 0.05;
      const lng = p.geometry?.location?.lng || 88.3639 + (Math.random() - 0.5) * 0.05;

      return {
        id: `ola-${p.place_id || idx}`,
        primaryName,
        secondaryAddress,
        area,
        lat,
        lng,
      };
    });

    return results;
  } catch (err) {
    console.warn('Ola Places search error:', err);
    return null;
  }
}

/**
 * Reverse geocodes coordinates using Ola Maps Places Reverse Geocode API
 */
export async function reverseGeocodeOla(lat: number, lng: number): Promise<LocationPoint | null> {
  const key = getOlaMapsApiKey();
  if (!key) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}&api_key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    const result = data.results?.[0];
    if (result) {
      const address = result.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const area = result.address_components?.find((c: any) => c.types?.includes('sublocality'))?.long_name || 'Kolkata';
      return {
        address,
        area,
        lat,
        lng,
      };
    }
  } catch (e) {
    console.warn('Ola reverse geocode error:', e);
  }

  return null;
}

/**
 * Fetches turn-by-turn route coordinates using Ola Maps Routing API
 */
export async function getOlaRoute(origin: LatLng, destination: LatLng): Promise<LatLng[] | null> {
  const key = getOlaMapsApiKey();
  if (!key) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const url = `https://api.olamaps.io/routing/v1/directions?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving&api_key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (Array.isArray(coords)) {
      // Ola Maps coordinates are [lng, lat]
      return coords.map(([lng, lat]: [number, number]) => ({ lat, lng }));
    }
  } catch (e) {
    console.warn('Ola route error:', e);
  }

  return null;
}
