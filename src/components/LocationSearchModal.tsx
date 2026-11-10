import React, { useState, useEffect, useRef } from 'react';
import { LocationPoint } from '../types';
import { searchLocations, reverseGeocodeCoords, SearchResultItem } from '../services/locationService';
import { KOLKATA_PRESET_LOCATIONS } from '../data/kolkataData';
import { IconSearch, IconClose, IconNavigation, IconPin, IconChevronRight } from './Icons';

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (point: LocationPoint) => void;
  currentAddress?: string;
  title?: string;
}

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  currentAddress = '',
  title = 'Where should we pick you up?',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setGpsError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchLocations(query);
        setResults(res);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  // Handle GPS Current Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const point = await reverseGeocodeCoords(lat, lng);
          onSelectLocation(point);
          onClose();
        } catch {
          setGpsError('Could not fetch exact address for GPS coordinates.');
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError('Location permission denied. Please type your location.');
        } else {
          setGpsError('Could not obtain GPS location. Please search manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSelect = (item: SearchResultItem | (typeof KOLKATA_PRESET_LOCATIONS)[0]) => {
    onSelectLocation({
      address: 'secondaryAddress' in item ? `${item.primaryName}, ${item.secondaryAddress}` : `${item.name}, ${item.area}`,
      area: item.area,
      lat: item.lat,
      lng: item.lng,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2100] bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="w-full sm:w-[500px] max-h-[92vh] sm:max-h-[640px] bg-[#FFFFFF] rounded-t-3xl sm:rounded-2xl border-t sm:border border-[#E4E4E4] shadow-2xl flex flex-col overflow-hidden pb-safe">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-[#E4E4E4] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header with Search Bar */}
        <div className="p-3.5 sm:p-4 border-b border-[#E4E4E4] bg-[#FFFFFF] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-[#0E0E0E] font-display">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] text-[#0E0E0E] flex items-center justify-center transition cursor-pointer"
              aria-label="Close"
            >
              <IconClose size={16} />
            </button>
          </div>

          {/* Active Search Input */}
          <div className="relative flex items-center">
            <div className="absolute left-3 text-[#757575] pointer-events-none">
              <IconSearch size={16} />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type any area, street, landmark, mall..."
              className="w-full h-11 pl-9 pr-9 bg-[#F6F6F6] border border-[#E4E4E4] rounded-xl text-xs sm:text-sm text-[#0E0E0E] placeholder-[#757575] focus:bg-[#FFFFFF] focus:border-[#0E0E0E] transition font-medium"
            />

            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 w-5 h-5 rounded-full bg-[#E4E4E4] hover:bg-[#757575] text-[#FFFFFF] flex items-center justify-center text-xs transition"
              >
                ×
              </button>
            ) : loading ? (
              <div className="absolute right-3.5 w-4 h-4 border-2 border-[#0E0E0E] border-t-transparent rounded-full animate-spin" />
            ) : null}
          </div>

          {/* GPS Quick Action Row */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={gpsLoading}
              className="flex items-center gap-2 text-xs font-semibold text-[#0E0E0E] hover:opacity-75 transition cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-[#F6F6F6] border border-[#E4E4E4] flex items-center justify-center text-[#0F7B5F]">
                <IconNavigation size={12} className={gpsLoading ? 'animate-pulse' : ''} />
              </div>
              <span>{gpsLoading ? 'Detecting current GPS...' : 'Use current location'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 text-[11px] font-medium text-[#757575] hover:text-[#0E0E0E] transition"
            >
              <IconPin size={12} />
              <span>Drag pin on map</span>
            </button>
          </div>

          {gpsError && (
            <p className="text-[11px] text-[#C8321E] font-medium bg-[#F6F6F6] p-2 rounded-lg">
              {gpsError}
            </p>
          )}
        </div>

        {/* Scrollable Results & Suggestions */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E4E4E4]">
          {/* If query has matches */}
          {query.trim().length > 0 ? (
            results.length > 0 ? (
              results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="p-3 sm:p-3.5 flex items-start gap-3 hover:bg-[#F6F6F6] transition cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-[#F6F6F6] group-hover:bg-[#FFFFFF] border border-[#E4E4E4] flex items-center justify-center shrink-0 mt-0.5 text-[#0E0E0E]">
                    <IconPin size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-[#0E0E0E] block truncate">
                      {item.primaryName}
                    </span>
                    <span className="text-[11px] text-[#757575] block truncate mt-0.5">
                      {item.secondaryAddress}
                    </span>
                  </div>
                  <IconChevronRight size={14} className="text-[#757575] shrink-0 mt-2" />
                </div>
              ))
            ) : !loading ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-medium text-[#0E0E0E]">No places found for "{query}"</p>
                <p className="text-xs text-[#757575]">
                  Try searching for another locality, landmark, or tap "Drag pin on map".
                </p>
              </div>
            ) : null
          ) : (
            /* When input is empty: show Popular & Recent Kolkata Hubs */
            <div className="p-3 sm:p-4 space-y-3">
              <span className="text-[11px] font-semibold text-[#757575] uppercase tracking-wider block">
                Popular in Kolkata
              </span>

              <div className="space-y-1">
                {KOLKATA_PRESET_LOCATIONS.slice(0, 8).map((loc) => (
                  <div
                    key={loc.id}
                    onClick={() => handleSelect(loc)}
                    className="p-2.5 rounded-xl hover:bg-[#F6F6F6] flex items-center justify-between gap-3 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#F6F6F6] border border-[#E4E4E4] flex items-center justify-center shrink-0 text-[#757575]">
                        <IconPin size={13} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-medium text-[#0E0E0E] block truncate">
                          {loc.name}
                        </span>
                        <span className="text-[10px] text-[#757575] block truncate">
                          {loc.landmark ? `${loc.landmark} • ${loc.area}` : loc.area}
                        </span>
                      </div>
                    </div>
                    <IconChevronRight size={13} className="text-[#757575] shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-2.5 bg-[#F6F6F6] border-t border-[#E4E4E4] text-center text-[11px] text-[#757575] shrink-0">
          Type any custom street or colony across Kolkata & surrounding areas
        </div>
      </div>
    </div>
  );
};
