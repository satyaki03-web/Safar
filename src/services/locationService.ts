import { LocationPoint } from '../types';
import { KOLKATA_PRESET_LOCATIONS } from '../data/kolkataData';
import { searchOlaPlaces, reverseGeocodeOla, getOlaMapsApiKey } from './olaMapsService';

export interface SearchResultItem {
  id: string;
  primaryName: string;
  secondaryAddress: string;
  area: string;
  lat: number;
  lng: number;
  source: 'preset' | 'osm' | 'ola' | 'history';
}

/**
 * Searches for any location: prioritizes Ola Maps Places API when API key is set,
 * combines with expansive local Kolkata catalog, and falls back to OSM/Photon.
 */
export async function searchLocations(query: string): Promise<SearchResultItem[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  // 1. Try Ola Maps Places API if key is present
  if (getOlaMapsApiKey()) {
    try {
      const olaResults = await searchOlaPlaces(cleanQuery);
      if (olaResults && olaResults.length > 0) {
        return olaResults.map((item) => ({
          ...item,
          source: 'ola' as const,
        }));
      }
    } catch (e) {
      console.warn('Ola search fallback to local/OSM:', e);
    }
  }

  // 2. Instant local search from curated database
  const localMatches: SearchResultItem[] = KOLKATA_PRESET_LOCATIONS.filter((loc) => {
    return (
      loc.name.toLowerCase().includes(cleanQuery) ||
      loc.area.toLowerCase().includes(cleanQuery) ||
      (loc.landmark && loc.landmark.toLowerCase().includes(cleanQuery))
    );
  }).map((loc) => ({
    id: `local-${loc.id}`,
    primaryName: loc.name,
    secondaryAddress: loc.landmark ? `${loc.landmark}, ${loc.area}` : `${loc.area}, Kolkata`,
    area: loc.area,
    lat: loc.lat,
    lng: loc.lng,
    source: 'preset',
  }));

  // If query is short (< 3 chars), return instant local matches
  if (cleanQuery.length < 3) {
    return localMatches.slice(0, 7);
  }

  // 3. Fetch live geocoding results for any custom address or street name
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    // Photon API (OpenStreetMap-backed, very fast, biased around Kolkata coords)
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      cleanQuery
    )}&lat=22.5726&lon=88.3639&limit=8`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const osmResults: SearchResultItem[] = [];

      if (data && Array.isArray(data.features)) {
        for (const feature of data.features) {
          const props = feature.properties || {};
          const coords = feature.geometry?.coordinates || [];
          if (coords.length >= 2) {
            const [lng, lat] = coords;
            const name = props.name || props.street || cleanQuery;
            const district = props.district || props.city || props.suburb || props.state || 'Kolkata';
            const contextParts = [props.street, props.suburb, props.city, props.state]
              .filter(Boolean)
              .filter((item, idx, arr) => arr.indexOf(item) === idx);

            osmResults.push({
              id: `osm-${props.osm_id || Math.random()}`,
              primaryName: name,
              secondaryAddress: contextParts.join(', ') || district,
              area: props.suburb || props.city || district,
              lat,
              lng,
              source: 'osm',
            });
          }
        }
      }

      // Merge results avoiding duplicate coordinates
      const combined = [...localMatches];
      for (const item of osmResults) {
        const isDuplicate = combined.some(
          (c) => Math.hypot(c.lat - item.lat, c.lng - item.lng) < 0.005
        );
        if (!isDuplicate) {
          combined.push(item);
        }
      }

      return combined.slice(0, 10);
    }
  } catch (err) {
    // If network or timeout occurs, gracefully return local matches
  }

  return localMatches.slice(0, 7);
}

/**
 * Reverse geocode GPS coordinates to an address
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<LocationPoint> {
  // If Ola Maps key is available, attempt Ola reverse-geocode
  if (getOlaMapsApiKey()) {
    try {
      const olaPoint = await reverseGeocodeOla(lat, lng);
      if (olaPoint) return olaPoint;
    } catch (e) {
      // fallback
    }
  }

  // First find closest local landmark
  let closest = KOLKATA_PRESET_LOCATIONS[0];
  let minDist = Infinity;
  for (const loc of KOLKATA_PRESET_LOCATIONS) {
    const d = Math.hypot(loc.lat - lat, loc.lng - lng);
    if (d < minDist) {
      minDist = d;
      closest = loc;
    }
  }

  // If very close (< 800m), return landmark
  if (minDist < 0.008 && closest) {
    return {
      address: `${closest.name}, near ${closest.area}`,
      area: closest.area,
      lat,
      lng,
    };
  }

  // Try live reverse geocoding via Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const road = addr.road || addr.suburb || addr.neighbourhood || addr.residential || 'Kolkata';
      const city = addr.city || addr.town || addr.county || 'Kolkata';
      return {
        address: data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : `${road}, ${city}`,
        area: addr.suburb || addr.neighbourhood || city,
        lat,
        lng,
      };
    }
  } catch (e) {
    // Fallback
  }

  return {
    address: closest ? `${closest.name}, ${closest.area}` : `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    area: closest ? closest.area : 'Kolkata',
    lat,
    lng,
  };
}
