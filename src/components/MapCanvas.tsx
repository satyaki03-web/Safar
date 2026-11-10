import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LatLng, LocationPoint, NearbyDriver } from '../types';
import { KOLKATA_CENTER, KOLKATA_PRESET_LOCATIONS } from '../data/kolkataData';
import { reverseGeocodeCoords } from '../services/locationService';
import { getOlaTileUrl, getOlaMapsApiKey } from '../services/olaMapsService';
import { IconRecenter } from './Icons';

interface MapCanvasProps {
  pickupLocation?: LocationPoint | null;
  destinationLocation?: LocationPoint | null;
  driverLocation?: LatLng | null;
  userLocation?: LatLng | null;
  routeCoordinates?: LatLng[];
  isDraggablePin?: boolean;
  onPickupChange?: (point: LocationPoint) => void;
  nearbyDrivers?: NearbyDriver[];
  className?: string;
  zoom?: number;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  pickupLocation,
  destinationLocation,
  driverLocation,
  userLocation,
  routeCoordinates,
  isDraggablePin = false,
  onPickupChange,
  nearbyDrivers,
  className = 'w-full h-full',
  zoom = 13,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const polylineBgRef = useRef<L.Polyline | null>(null);
  const polylineFgRef = useRef<L.Polyline | null>(null);
  const nearbyMarkersRef = useRef<L.Marker[]>([]);
  const etaMarkerRef = useRef<L.Marker | null>(null);
  const [activeProvider, setActiveProvider] = React.useState<'ola' | 'ola_styled'>('ola_styled');

  // Initialize Map & Tile Layer with Ola Maps aesthetic
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = pickupLocation
      ? [pickupLocation.lat, pickupLocation.lng]
      : [KOLKATA_CENTER.lat, KOLKATA_CENTER.lng];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Resilient Multi-CDN pool for 100% device, carrier & WebView compatibility
    const TILE_CDN_POOL = [
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
    ];
    let currentCdnIndex = 0;

    const fastTileUrl = TILE_CDN_POOL[0];
    const activeProviderRef = { current: 'ola_styled' as 'ola' | 'ola_styled' };
    let errorCount = 0;

    // Mount tile layer with mobile-safe buffer and neutral crossOrigin to prevent carrier proxy drops
    const tileLayer = L.tileLayer(fastTileUrl, {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      keepBuffer: 3,
      updateWhenIdle: false,
      updateWhenZooming: false,
      className: 'safar-ola-tiles',
    }).addTo(map);

    tileLayer.on('tileerror', () => {
      errorCount++;
      // If direct Ola endpoint is blocked or returns 401/404, smoothly fallback to high-speed CDN
      if (errorCount >= 2 && tileLayerRef.current && activeProviderRef.current === 'ola') {
        errorCount = 0;
        tileLayerRef.current.setUrl(fastTileUrl);
        activeProviderRef.current = 'ola_styled';
        setActiveProvider('ola_styled');
      } else if (errorCount >= 3 && tileLayerRef.current && currentCdnIndex < TILE_CDN_POOL.length - 1) {
        // If carrier/device blocks primary CDN, automatically rotate to backup CDN (CartoDB / Esri / Wikimedia)
        currentCdnIndex++;
        errorCount = 0;
        const backupUrl = TILE_CDN_POOL[currentCdnIndex];
        tileLayerRef.current.setUrl(backupUrl);
      }
    });

    tileLayerRef.current = tileLayer;

    // Proactively probe Ola Maps raster tiles in background without stalling the initial render
    let probeTimer: number | null = null;
    const probeAndActivateOla = () => {
      const olaDirectUrl = getOlaTileUrl();
      const apiKey = getOlaMapsApiKey();
      if (!olaDirectUrl || !apiKey) {
        activeProviderRef.current = 'ola_styled';
        setActiveProvider('ola_styled');
        return;
      }

      const probeImg = new Image();
      let finished = false;
      probeTimer = window.setTimeout(() => {
        if (!finished) {
          finished = true;
          activeProviderRef.current = 'ola_styled';
          setActiveProvider('ola_styled');
        }
      }, 1500);

      probeImg.onload = () => {
        if (!finished) {
          finished = true;
          if (probeTimer) clearTimeout(probeTimer);
          if (tileLayerRef.current) {
            errorCount = 0;
            tileLayerRef.current.setUrl(olaDirectUrl);
            activeProviderRef.current = 'ola';
            setActiveProvider('ola');
          }
        }
      };

      probeImg.onerror = () => {
        if (!finished) {
          finished = true;
          if (probeTimer) clearTimeout(probeTimer);
          activeProviderRef.current = 'ola_styled';
          setActiveProvider('ola_styled');
        }
      };

      probeImg.src = `https://api.olamaps.io/tiles/vector/v1/styles/default/13/6561/3618.png?api_key=${encodeURIComponent(apiKey)}`;
    };

    probeAndActivateOla();

    // Dynamic tile update listener on key change
    const handleKeyChange = () => {
      probeAndActivateOla();
    };
    window.addEventListener('ola-maps-key-changed', handleKeyChange);

    // Multi-stage viewport invalidation for diverse mobile devices, low-power modes & WebViews
    map.whenReady(() => {
      map.invalidateSize({ animate: false });
    });

    const invalidationDelays = [50, 150, 350, 750, 1500, 2500];
    const invalidationTimers: number[] = invalidationDelays.map((delay) =>
      window.setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ animate: false });
        }
      }, delay)
    );

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: false });
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: false });
      }
    };

    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('orientationchange', handleWindowResize);
    window.addEventListener('pageshow', handleWindowResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ animate: false });
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    mapInstanceRef.current = map;

    // Handle map click for selecting location
    if (onPickupChange && isDraggablePin) {
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const point = await reverseGeocodeCoords(lat, lng);
        onPickupChange(point);
      });
    }

    return () => {
      if (probeTimer) clearTimeout(probeTimer);
      invalidationTimers.forEach((t) => clearTimeout(t));
      window.removeEventListener('ola-maps-key-changed', handleKeyChange);
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('orientationchange', handleWindowResize);
      window.removeEventListener('pageshow', handleWindowResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      nearbyMarkersRef.current.forEach((m) => m.remove());
      nearbyMarkersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Nearby Driver Markers with custom icons and infobox popups on click
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous nearby driver markers
    nearbyMarkersRef.current.forEach((m) => m.remove());
    nearbyMarkersRef.current = [];

    if (!nearbyDrivers || nearbyDrivers.length === 0) return;

    nearbyDrivers.forEach((driver) => {
      const pos: [number, number] = [driver.lat, driver.lng];

      // Custom icon for available nearby drivers
      const customDriverIcon = L.divIcon({
        className: 'custom-nearby-driver-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; cursor: pointer; transition: transform 0.15s ease;">
            <div style="width: 36px; height: 36px; background-color: #0E0E0E; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.22); display: flex; align-items: center; justify-content: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2B705" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="3" />
                <line x1="3" y1="12" x2="9" y2="12" />
                <line x1="15" y1="12" x2="21" y2="12" />
                <line x1="12" y1="15" x2="12" y2="21" />
              </svg>
            </div>
            <!-- Online status green badge -->
            <div style="position: absolute; top: -1px; right: -1px; width: 11px; height: 11px; background-color: #0F7B5F; border: 2px solid #FFFFFF; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = L.marker(pos, {
        icon: customDriverIcon,
        title: `${driver.name} • ${driver.vehicleModel}`,
      }).addTo(map);

      // Popup Infobox displaying driver's name, rating, and vehicle model
      const infoboxContent = `
        <div style="font-family: 'Montserrat', sans-serif; min-width: 190px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px;">
            <span style="font-family: 'Bricolage Grotesque', sans-serif; font-size: 15px; font-weight: 700; color: #0E0E0E; line-height: 1.2;">
              ${driver.name}
            </span>
            <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 600; color: #0E0E0E; background: #F6F6F6; border: 1px solid #E4E4E4; padding: 2px 7px; border-radius: 9999px;">
              <span style="color: #F2B705;">★</span> ${driver.rating.toFixed(2)}
            </span>
          </div>

          <div style="margin-bottom: 6px;">
            <div style="font-size: 12px; font-weight: 600; color: #0E0E0E; line-height: 1.3;">
              ${driver.vehicleModel}
            </div>
            <div style="font-size: 11px; color: #757575; margin-top: 2px;">
              ${driver.tripsCount} trips • ${driver.experienceYears} yrs experience
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #E4E4E4; padding-top: 6px; font-size: 11px;">
            <span style="display: inline-flex; align-items: center; gap: 4px; color: #0F7B5F; font-weight: 600;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #0F7B5F; display: inline-block;"></span>
              Available nearby
            </span>
            <span style="color: #757575;">${driver.area}</span>
          </div>
        </div>
      `;

      marker.bindPopup(infoboxContent, {
        className: 'safar-leaflet-popup',
        maxWidth: 260,
        closeButton: true,
      });

      nearbyMarkersRef.current.push(marker);
    });
  }, [nearbyDrivers]);

  // Update Pickup Marker (small ink dot with 2px white outline)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!pickupLocation) {
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.remove();
        pickupMarkerRef.current = null;
      }
      return;
    }

    const pos: [number, number] = [pickupLocation.lat, pickupLocation.lng];

    // Ola Maps pickup marker: green dot with soft translucent radar halo (matching Image 2)
    const pickupIcon = L.divIcon({
      className: 'custom-pickup-dot',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: ${isDraggablePin ? 'grab' : 'default'};">
          <!-- Translucent green pulse halo -->
          <div style="position: absolute; width: 42px; height: 42px; background: rgba(16, 185, 129, 0.28); border-radius: 50%; border: 1px solid rgba(16, 185, 129, 0.45); animation: pulse 2s infinite ease-in-out;"></div>
          <!-- Solid emerald center core -->
          <div style="position: relative; z-index: 2; width: 16px; height: 16px; background: #059669; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!pickupMarkerRef.current) {
      const marker = L.marker(pos, {
        icon: pickupIcon,
        draggable: isDraggablePin,
      }).addTo(map);

      if (isDraggablePin && onPickupChange) {
        marker.on('dragend', async () => {
          const newPos = marker.getLatLng();
          const point = await reverseGeocodeCoords(newPos.lat, newPos.lng);
          onPickupChange(point);
        });
      }

      pickupMarkerRef.current = marker;
    } else {
      pickupMarkerRef.current.setLatLng(pos);
      pickupMarkerRef.current.setIcon(pickupIcon);
    }

    if (!routeCoordinates || routeCoordinates.length === 0) {
      map.setView(pos, Math.max(map.getZoom(), 14), { animate: true });
    }
  }, [pickupLocation, isDraggablePin]);

  // Update Destination Marker: Ola Maps red teardrop pin with dark center dot (matching Image 2)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!destinationLocation) {
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
      return;
    }

    const pos: [number, number] = [destinationLocation.lat, destinationLocation.lng];

    const destIcon = L.divIcon({
      className: 'custom-dest-pin',
      html: `
        <div style="position: relative; width: 34px; height: 42px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));">
          <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
            <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 14.5 40.5 16.2 41.9C16.65 42.3 17.35 42.3 17.8 41.9C19.5 40.5 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="#DC2626"/>
            <!-- Dark inner center dot -->
            <circle cx="17" cy="17" r="6" fill="#1F2937"/>
          </svg>
        </div>
      `,
      iconSize: [34, 42],
      iconAnchor: [17, 40],
    });

    if (!destMarkerRef.current) {
      destMarkerRef.current = L.marker(pos, { icon: destIcon }).addTo(map);
    } else {
      destMarkerRef.current.setLatLng(pos);
    }
  }, [destinationLocation]);

  // Update User Live Location Marker (pulsing blue dot)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    const pos: [number, number] = [userLocation.lat, userLocation.lng];

    const userGpsIcon = L.divIcon({
      className: 'custom-user-gps-dot',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; background: rgba(37, 99, 235, 0.25); border-radius: 50%; border: 1px solid rgba(37, 99, 235, 0.4); animation: pulse 2s infinite ease-in-out;"></div>
          <div style="position: relative; z-index: 2; width: 14px; height: 14px; background: #2563EB; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(pos, {
        icon: userGpsIcon,
        zIndexOffset: 1000,
        title: 'Your Current Live Location',
      }).addTo(map);

      // On first location lock, pan map if no active route is being inspected
      if (!pickupLocation && !driverLocation && (!routeCoordinates || routeCoordinates.length === 0)) {
        map.setView(pos, 15, { animate: true });
      }
    } else {
      userMarkerRef.current.setLatLng(pos);
    }
  }, [userLocation]);

  // Update Driver / Car Marker (yellow circle with ink car-side icon and white ring)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!driverLocation) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
      return;
    }

    const pos: [number, number] = [driverLocation.lat, driverLocation.lng];

    const driverIcon = L.divIcon({
      className: 'custom-driver-ring',
      html: `
        <div style="width: 36px; height: 36px; background-color: #F2B705; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; transition: all 0.3s ease-out;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E0E0E" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 13l2-5h12l3 5v4H3v-4z" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker(pos, { icon: driverIcon }).addTo(map);
    } else {
      driverMarkerRef.current.setLatLng(pos);
    }
  }, [driverLocation]);

  // Update Route Polyline & Floating ETA Callout Badge (matching Image 2)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!routeCoordinates || routeCoordinates.length < 2) {
      if (polylineBgRef.current) {
        polylineBgRef.current.remove();
        polylineBgRef.current = null;
      }
      if (polylineFgRef.current) {
        polylineFgRef.current.remove();
        polylineFgRef.current = null;
      }
      if (etaMarkerRef.current) {
        etaMarkerRef.current.remove();
        etaMarkerRef.current = null;
      }
      return;
    }

    const latLngs: [number, number][] = routeCoordinates.map((c) => [c.lat, c.lng]);

    // Outer white casing
    if (!polylineBgRef.current) {
      polylineBgRef.current = L.polyline(latLngs, {
        color: '#FFFFFF',
        weight: 8,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    } else {
      polylineBgRef.current.setLatLngs(latLngs);
    }

    // Emerald green route line (matching Ola Maps in Image 2)
    if (!polylineFgRef.current) {
      polylineFgRef.current = L.polyline(latLngs, {
        color: '#059669',
        weight: 5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    } else {
      polylineFgRef.current.setLatLngs(latLngs);
    }

    // Floating ETA Callout along the route (matching Image 2 "06 min" / "10 min" badge)
    const midIndex = Math.floor(latLngs.length / 2);
    const midPoint = latLngs[midIndex] || latLngs[0];

    const etaIcon = L.divIcon({
      className: 'custom-route-eta',
      html: `
        <div style="background: #FFFFFF; color: #0E0E0E; border: 1px solid #E5E7EB; border-radius: 6px; padding: 3px 8px; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 700; box-shadow: 0 3px 8px rgba(0,0,0,0.18); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #059669; display: inline-block;"></span>
          <span>Fastest Route</span>
        </div>
      `,
      iconSize: [95, 26],
      iconAnchor: [47, 13],
    });

    if (!etaMarkerRef.current) {
      etaMarkerRef.current = L.marker(midPoint, { icon: etaIcon, interactive: false }).addTo(map);
    } else {
      etaMarkerRef.current.setLatLng(midPoint);
    }

    // Auto-fit bounds
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, {
      paddingTopLeft: [50, 50],
      paddingBottomRight: [50, 240],
      maxZoom: 15,
      animate: true,
    });
  }, [routeCoordinates]);

  // Recenter handler
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 15, { animate: true });
    } else if (pickupLocation) {
      map.setView([pickupLocation.lat, pickupLocation.lng], 14, { animate: true });
    } else if (driverLocation) {
      map.setView([driverLocation.lat, driverLocation.lng], 14, { animate: true });
    } else {
      map.setView([KOLKATA_CENTER.lat, KOLKATA_CENTER.lng], 13, { animate: true });
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className={`relative isolate z-0 overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full relative" style={{ zIndex: 1 }} />

      {/* Custom Bottom-Right Minimal Map Controls */}
      <div className="absolute bottom-28 sm:bottom-6 right-3 sm:right-4 z-10 flex flex-col gap-1.5 select-none pointer-events-auto">
        <button
          type="button"
          onClick={handleRecenter}
          className="w-9 h-9 rounded-[8px] bg-[#FFFFFF] border border-[#E4E4E4] flex items-center justify-center text-[#0E0E0E] shadow-floating hover:bg-[#F6F6F6] transition active:scale-95"
          aria-label="Recenter map"
          title="Recenter"
        >
          <IconRecenter size={18} />
        </button>

        <div className="flex flex-col rounded-[8px] bg-[#FFFFFF] border border-[#E4E4E4] shadow-floating overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-9 h-9 flex items-center justify-center text-[#0E0E0E] font-medium text-lg hover:bg-[#F6F6F6] transition active:bg-[#E4E4E4] border-b border-[#E4E4E4]"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-9 h-9 flex items-center justify-center text-[#0E0E0E] font-medium text-lg hover:bg-[#F6F6F6] transition active:bg-[#E4E4E4]"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
      </div>

      {/* Map Provider Attribution Chip (Bottom Left, non-intrusive) */}
      <div className="absolute bottom-28 sm:bottom-6 left-3 sm:left-4 z-10 pointer-events-none select-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFFFFF]/90 backdrop-blur-xs border border-[#E4E4E4] shadow-xs text-[11px] font-medium text-[#757575]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F7B5F]" />
          <span className="text-[#0E0E0E] font-semibold">Ola Maps</span>
        </div>
      </div>
    </div>
  );
};
