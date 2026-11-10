import React, { useState, useMemo } from 'react';
import { LocationPoint, TripType } from '../types';
import {
  calculateTripEstimate,
  estimateRoadDistanceKm,
  formatRupee,
} from '../utils/fare';
import { KOLKATA_PRESET_LOCATIONS } from '../data/kolkataData';
import {
  IconClose,
  IconPin,
  IconRoute,
  IconClock,
  IconCarSide,
  IconArrowDownUp,
  IconCalculator,
  IconChevronRight,
  IconCheck,
} from './Icons';
import { LocationSearchModal } from './LocationSearchModal';

interface EstimateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPickup?: LocationPoint | null;
  initialDestination?: LocationPoint | null;
  onApplyBooking: (params: {
    pickup: LocationPoint;
    destination: LocationPoint;
    durationHours: number;
    tripType: TripType;
    outstationDays?: number;
  }) => void;
}

export const EstimateTripModal: React.FC<EstimateTripModalProps> = ({
  isOpen,
  onClose,
  initialPickup,
  initialDestination,
  onApplyBooking,
}) => {
  const [pickup, setPickup] = useState<LocationPoint>(
    initialPickup || {
      address: 'Salt Lake Sector V, Near College More',
      area: 'Salt Lake',
      lat: 22.5735,
      lng: 88.4331,
    }
  );
  const [destination, setDestination] = useState<LocationPoint>(
    initialDestination || {
      address: 'Netaji Subhash Chandra Bose International Airport (CCU), Dum Dum',
      area: 'Dum Dum',
      lat: 22.6547,
      lng: 88.4467,
    }
  );

  const [tripType, setTripType] = useState<TripType>('commute');
  const [durationHours, setDurationHours] = useState(4);
  const [outstationDays, setOutstationDays] = useState(2);
  const [isNightDeparture, setIsNightDeparture] = useState(false);

  // Search modal state for either pickup or dropoff
  const [searchTarget, setSearchTarget] = useState<'pickup' | 'destination' | null>(null);

  // Sync initial props when opened
  React.useEffect(() => {
    if (isOpen) {
      if (initialPickup) setPickup(initialPickup);
      if (initialDestination) setDestination(initialDestination);
    }
  }, [isOpen, initialPickup, initialDestination]);

  // Calculate road distance
  const distanceKm = useMemo(() => {
    return estimateRoadDistanceKm(pickup.lat, pickup.lng, destination.lat, destination.lng);
  }, [pickup, destination]);

  // Calculate full trip breakdown
  const estimate = useMemo(() => {
    return calculateTripEstimate({
      distanceKm,
      durationHours,
      tripType,
      isNight: isNightDeparture,
      outstationDays,
    });
  }, [distanceKm, durationHours, tripType, isNightDeparture, outstationDays]);

  if (!isOpen) return null;

  const handleSwapLocations = () => {
    const temp = pickup;
    setPickup(destination);
    setDestination(temp);
  };

  const handleApply = () => {
    onApplyBooking({
      pickup,
      destination,
      durationHours: tripType === 'outstation' ? durationHours : estimate.recommendedHours,
      tripType,
      ...(tripType === 'outstation' ? { outstationDays } : {}),
    });
    onClose();
  };

  // Preset hubs for quick 1-tap destination testing
  const quickDestinations = [
    { name: 'Airport (CCU)', area: 'Dum Dum', lat: 22.6547, lng: 88.4467 },
    { name: 'Howrah Railway Station', area: 'Howrah', lat: 22.5857, lng: 88.3426 },
    { name: 'Park Street', area: 'Park Street', lat: 22.5535, lng: 88.3533 },
    { name: 'Sector V IT Hub', area: 'Salt Lake', lat: 22.5735, lng: 88.4331 },
    { name: 'South City Mall', area: 'Jadavpur', lat: 22.4998, lng: 88.3626 },
    { name: 'Digha Coastline (Outstation)', area: 'Digha', lat: 21.6266, lng: 87.5074 },
  ];

  return (
    <div className="fixed inset-0 z-[2000] bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="w-full sm:w-[500px] max-h-[92vh] sm:max-h-[640px] bg-[#FFFFFF] rounded-t-3xl sm:rounded-2xl border-t sm:border border-[#E4E4E4] shadow-2xl flex flex-col overflow-hidden pb-safe">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-[#E4E4E4] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#E4E4E4] flex items-center justify-between shrink-0 bg-[#FFFFFF]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0E0E0E] text-[#FFFFFF] flex items-center justify-center">
              <IconCalculator size={15} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[#0E0E0E] font-display leading-tight">
                Estimate trip fare
              </h3>
              <p className="text-[11px] text-[#757575] leading-none mt-0.5">
                Calculate approximate costs based on distance & duration
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] text-[#0E0E0E] flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-4 flex-1">
          {/* Pickup and Destination Selector Card */}
          <div className="p-3 bg-[#F6F6F6] border border-[#E4E4E4] rounded-xl space-y-2.5 relative">
            {/* Pickup Row */}
            <div className="flex items-center justify-between gap-2">
              <div
                onClick={() => setSearchTarget('pickup')}
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[#0E0E0E] border-2 border-[#FFFFFF] shrink-0 shadow-sm" />
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-[#757575] uppercase tracking-wider block">
                    Pickup
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[#0E0E0E] truncate block group-hover:text-[#F2B705] transition">
                    {pickup.address.split(',')[0]}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSearchTarget('pickup')}
                className="text-[11px] text-[#757575] hover:text-[#0E0E0E] underline shrink-0 cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Middle Divider & Swap Button */}
            <div className="relative flex items-center justify-center my-0.5">
              <div className="w-full border-t border-[#E4E4E4]" />
              <button
                type="button"
                onClick={handleSwapLocations}
                className="absolute w-7 h-7 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] hover:border-[#0E0E0E] text-[#0E0E0E] flex items-center justify-center shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer"
                title="Swap pickup and destination"
              >
                <IconArrowDownUp size={12} />
              </button>
            </div>

            {/* Destination Row */}
            <div className="flex items-center justify-between gap-2">
              <div
                onClick={() => setSearchTarget('destination')}
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
              >
                <div className="w-3.5 h-3.5 rounded-sm bg-[#0E0E0E] border-2 border-[#FFFFFF] shrink-0 shadow-sm" />
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-[#757575] uppercase tracking-wider block">
                    Destination
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[#0E0E0E] truncate block group-hover:text-[#F2B705] transition">
                    {destination.address.split(',')[0]}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSearchTarget('destination')}
                className="text-[11px] text-[#757575] hover:text-[#0E0E0E] underline shrink-0 cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {/* Quick Destination Hubs */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-[#757575]">
              Popular destinations in Kolkata:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {quickDestinations.map((q) => (
                <button
                  key={q.name}
                  type="button"
                  onClick={() => {
                    setDestination({
                      address: `${q.name}, ${q.area}`,
                      area: q.area,
                      lat: q.lat,
                      lng: q.lng,
                    });
                    if (q.name.includes('Outstation')) {
                      setTripType('outstation');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                    destination.address.includes(q.name)
                      ? 'bg-[#0E0E0E] text-[#FFFFFF] border-[#0E0E0E]'
                      : 'bg-[#F6F6F6] text-[#0E0E0E] border-[#E4E4E4] hover:bg-[#E4E4E4]'
                  }`}
                >
                  {q.name}
                </button>
              ))}
            </div>
          </div>

          {/* Live Calculated Metric Strip (Distance & Drive Time) */}
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#FFFFFF] border border-[#E4E4E4] rounded-xl shadow-xs">
            <div className="text-center p-1.5 bg-[#F6F6F6] rounded-lg">
              <span className="text-[10px] text-[#757575] block uppercase font-medium">
                Road distance
              </span>
              <span className="text-sm sm:text-base font-bold text-[#0E0E0E] font-tabular block mt-0.5">
                {distanceKm} km
              </span>
            </div>

            <div className="text-center p-1.5 bg-[#F6F6F6] rounded-lg">
              <span className="text-[10px] text-[#757575] block uppercase font-medium">
                Est. Drive Time
              </span>
              <span className="text-sm sm:text-base font-bold text-[#0E0E0E] font-tabular block mt-0.5">
                {estimate.driveDurationMinutes} mins
              </span>
            </div>

            <div className="text-center p-1.5 bg-[#F6F6F6] rounded-lg">
              <span className="text-[10px] text-[#757575] block uppercase font-medium">
                Rec. Booking
              </span>
              <span className="text-sm sm:text-base font-bold text-[#0E0E0E] font-tabular block mt-0.5">
                {estimate.recommendedHours} hrs
              </span>
            </div>
          </div>

          {/* Trip Type Segmented Control */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[#757575]">
              Trip Type
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#F6F6F6] border border-[#E4E4E4] rounded-[8px]">
              {[
                { id: 'commute', label: 'Commute' },
                { id: 'evening_out', label: 'Evening' },
                { id: 'airport', label: 'Airport' },
                { id: 'outstation', label: 'Outstation' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTripType(t.id as TripType)}
                  className={`py-1.5 text-xs font-semibold rounded-[6px] transition cursor-pointer ${
                    tripType === t.id
                      ? 'bg-[#0E0E0E] text-[#FFFFFF]'
                      : 'text-[#757575] hover:text-[#0E0E0E]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Stepper & Departure Window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Duration Stepper */}
            <div className="p-2.5 bg-[#F6F6F6] border border-[#E4E4E4] rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#757575]">
                  {tripType === 'outstation' ? 'Duration (Days)' : 'Chauffeur Time'}
                </span>
                <span className="text-[10px] text-[#757575] font-tabular">
                  ₹180/hr
                </span>
              </div>

              {tripType === 'outstation' ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-[#0E0E0E]">
                    {outstationDays} {outstationDays === 1 ? 'day' : 'days'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOutstationDays(Math.max(1, outstationDays - 1))}
                      className="w-7 h-7 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] font-bold text-xs"
                    >
                      −
                    </button>
                    <span className="font-tabular font-bold text-xs sm:text-sm w-5 text-center">
                      {outstationDays}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOutstationDays(outstationDays + 1)}
                      className="w-7 h-7 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-[#0E0E0E]">
                    {durationHours} {durationHours === 1 ? 'hour' : 'hours'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDurationHours(Math.max(1, durationHours - 1))}
                      className="w-7 h-7 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] font-bold text-xs"
                    >
                      −
                    </button>
                    <span className="font-tabular font-bold text-xs sm:text-sm w-5 text-center">
                      {durationHours}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDurationHours(Math.min(12, durationHours + 1))}
                      className="w-7 h-7 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Time of Day toggle */}
            <div className="p-2.5 bg-[#F6F6F6] border border-[#E4E4E4] rounded-xl space-y-1.5">
              <span className="text-[11px] font-medium text-[#757575] block">
                Departure Time
              </span>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setIsNightDeparture(false)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    !isNightDeparture
                      ? 'bg-[#FFFFFF] text-[#0E0E0E] border-[#0E0E0E] shadow-2xs font-semibold'
                      : 'bg-transparent text-[#757575] border-transparent hover:text-[#0E0E0E]'
                  }`}
                >
                  Daytime
                </button>
                <button
                  type="button"
                  onClick={() => setIsNightDeparture(true)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    isNightDeparture
                      ? 'bg-[#FFFFFF] text-[#0E0E0E] border-[#0E0E0E] shadow-2xs font-semibold'
                      : 'bg-transparent text-[#757575] border-transparent hover:text-[#0E0E0E]'
                  }`}
                >
                  Late (10PM-6AM)
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Cost Breakdown */}
          <div className="border border-[#E4E4E4] rounded-xl p-3 bg-[#FFFFFF] space-y-2">
            <span className="text-[11px] font-semibold text-[#757575] uppercase tracking-wider block">
              Estimated Cost Breakdown
            </span>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#0E0E0E]">
                <span className="text-[#757575]">
                  Driver fee ({estimate.recommendedHours} hrs @ ₹180/hr)
                </span>
                <span className="font-tabular font-medium">
                  {formatRupee(estimate.driverFee)}
                </span>
              </div>

              {estimate.nightSurcharge > 0 && (
                <div className="flex items-center justify-between text-[#0E0E0E]">
                  <span className="text-[#757575]">Night return surcharge</span>
                  <span className="font-tabular font-medium text-[#F2B705]">
                    +{formatRupee(estimate.nightSurcharge)}
                  </span>
                </div>
              )}

              {estimate.outstationAllowance > 0 && (
                <div className="flex items-center justify-between text-[#0E0E0E]">
                  <span className="text-[#757575]">Outstation daily allowance</span>
                  <span className="font-tabular font-medium">
                    +{formatRupee(estimate.outstationAllowance)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-[#0E0E0E]">
                <span className="text-[#757575]">Platform & insurance fee</span>
                <span className="font-tabular font-medium">
                  {formatRupee(estimate.platformFee)}
                </span>
              </div>

              <div className="border-t border-[#E4E4E4] pt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0E0E0E] block">
                    Total driver cost
                  </span>
                  <span className="text-[10px] text-[#757575]">
                    Includes verified driver & insurance
                  </span>
                </div>
                <span className="text-[20px] font-bold text-[#0E0E0E] font-tabular">
                  {formatRupee(estimate.totalDriverFare)}
                </span>
              </div>
            </div>

            {/* Savings & Fuel Advisory Strip */}
            <div className="mt-2 pt-2 border-t border-[#E4E4E4] bg-[#F6F6F6] -mx-3 -mb-3 p-2.5 rounded-b-xl flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-[#0F7B5F] font-semibold">
                <IconCheck size={14} className="shrink-0" />
                <span>Save ~{formatRupee(estimate.estimatedSavings)} vs private cabs</span>
              </div>
              <span className="text-[#757575] font-tabular">
                Car fuel est: {formatRupee(estimate.estimatedFuelCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Confirmation Button */}
        <div className="p-3.5 sm:p-4 border-t border-[#E4E4E4] bg-[#FFFFFF] shrink-0 space-y-2">
          <button
            type="button"
            onClick={handleApply}
            className="btn-primary w-full h-11 text-xs sm:text-sm font-semibold gap-2"
          >
            <span>Apply & book driver</span>
            <span className="font-tabular text-[#F2B705]">
              • {formatRupee(estimate.totalDriverFare)}
            </span>
          </button>
        </div>
      </div>

      {/* Embedded Location Search Modal for choosing pickup or destination */}
      <LocationSearchModal
        isOpen={Boolean(searchTarget)}
        onClose={() => setSearchTarget(null)}
        title={searchTarget === 'pickup' ? 'Select pickup location' : 'Select trip destination'}
        currentAddress={searchTarget === 'pickup' ? pickup.address : destination.address}
        onSelectLocation={(point) => {
          if (searchTarget === 'pickup') {
            setPickup(point);
          } else if (searchTarget === 'destination') {
            setDestination(point);
          }
          setSearchTarget(null);
        }}
      />
    </div>
  );
};
