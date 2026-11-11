import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LocationPoint, TripType } from '../types';
import { KOLKATA_PRESET_LOCATIONS, DEMO_ROUTE_COORDINATES } from '../data/kolkataData';
import { reverseGeocodeCoords } from '../services/locationService';
import { filterDriversWithinPickupRadius, DRIVER_MATCH_RADIUS_KM } from '../services/matchmakingService';
import { calculateFare, formatRupee, generateRoutePoints } from '../utils/fare';
import { MapCanvas } from '../components/MapCanvas';
import { SearchingSheet } from '../components/SearchingSheet';
import { DriverAssignedSheet } from '../components/DriverAssignedSheet';
import { LiveTripSheet } from '../components/LiveTripSheet';
import { ReceiptRatingModal } from '../components/ReceiptRatingModal';
import { FareBreakdownModal } from '../components/FareBreakdownModal';
import { SOSModal } from '../components/SOSModal';
import { DriverBriefModal, DriverBrief } from '../components/DriverBriefModal';
import { LocationSearchModal } from '../components/LocationSearchModal';
import { EstimateTripModal } from '../components/EstimateTripModal';
import { SubscriptionBookingModal } from '../components/SubscriptionBookingModal';
import { ActiveSubscriptionCard } from '../components/ActiveSubscriptionCard';
import {
  IconSearch,
  IconChevronRight,
  IconCarSide,
  IconClock,
  IconNavigation,
  IconPin,
  IconCalculator,
  IconAlert,
  IconX,
} from '../components/Icons';

interface OwnerHomeScreenProps {
  onOpenVehicles: () => void;
}

export const OwnerHomeScreen: React.FC<OwnerHomeScreenProps> = ({ onOpenVehicles }) => {
  const {
    selectedVehicle,
    activeRide,
    activeSubscription,
    onlineDrivers,
    userLocation,
    lastCancellationNotice,
    clearCancellationNotice,
    cancelSubscription,
    createBooking,
    clearActiveRide,
  } = useApp();

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Booking Form State - unselected by default so user can search any custom location
  const [pickupPoint, setPickupPoint] = useState<LocationPoint | null>(null);
  const [destinationPoint, setDestinationPoint] = useState<LocationPoint | null>(null);

  const [tripType, setTripType] = useState<TripType>('commute');
  const [durationHours, setDurationHours] = useState(4);
  const [startTimeMode, setStartTimeMode] = useState<'now' | 'scheduled'>('now');
  const [scheduledTime, setScheduledTime] = useState('2026-11-07T10:00');
  const [outstationDays, setOutstationDays] = useState(2);

  // Bottom Sheet expansion: peek vs full booking
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);

  // Estimate Trip Modal
  const [showEstimateModal, setShowEstimateModal] = useState(false);

  // Driver Brief
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [driverBrief, setDriverBrief] = useState<DriverBrief>({
    acPreference: 'eco',
    musicPreference: 'low',
    avoidHighways: false,
    noPhoneCalls: true,
    specialInstructions: '',
  });

  // Modals
  const [searchTarget, setSearchTarget] = useState<'pickup' | 'destination' | null>(null);
  const [showFareModal, setShowFareModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Auto show receipt when ride becomes completed
  // Auto-sync initial pickup point from user's live GPS location if not manually set
  useEffect(() => {
    if (userLocation && !pickupPoint) {
      reverseGeocodeCoords(userLocation.lat, userLocation.lng).then((point) => {
        setPickupPoint((prev) => prev || point);
      });
    }
  }, [userLocation]);

  React.useEffect(() => {
    if (activeRide?.status === 'completed' || activeRide?.ride_status === 'completed') {
      setShowReceiptModal(true);
    }
  }, [activeRide?.status, activeRide?.ride_status]);

  React.useEffect(() => {
    const handleOpenSub = () => setShowSubscriptionModal(true);
    window.addEventListener('open-subscription-modal', handleOpenSub);
    return () => window.removeEventListener('open-subscription-modal', handleOpenSub);
  }, []);

  const fareEstimate = calculateFare({
    tripType,
    durationHours,
    startTime: startTimeMode === 'scheduled' ? scheduledTime : new Date().toISOString(),
    outstationDays,
  });

  const handleConfirmBooking = async () => {
    if (!pickupPoint) {
      setSearchTarget('pickup');
      return;
    }

    if (!selectedVehicle) {
      onOpenVehicles();
      return;
    }

    setCreating(true);
    try {
      await createBooking({
        vehicleId: selectedVehicle.id,
        pickupLocation: pickupPoint,
        ...(destinationPoint ? { destinationLocation: destinationPoint } : {}),
        tripType,
        startTime: startTimeMode === 'scheduled' ? scheduledTime : 'Now (within 10-15 mins)',
        durationHours,
        ...(tripType === 'outstation' ? { outstationDays } : {}),
        fareEstimate,
        driverBrief,
      });
      setShowFareModal(false);
      setIsBookingSheetOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const currentVehicleSummary = selectedVehicle
    ? `${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.registrationNumber})`
    : 'No vehicle selected';

  // Recent places list for peek sheet
  const recentPlaces = [
    KOLKATA_PRESET_LOCATIONS[0],
    KOLKATA_PRESET_LOCATIONS[1],
    KOLKATA_PRESET_LOCATIONS[2],
  ];

  // Matchmaking & Nearby Drivers are EXCLUSIVELY calculated within 5km of the OWNER'S PICKUP LOCATION
  // (or current live GPS location). The destination coordinates are NEVER used to find or filter drivers.
  const currentPickup = activeRide?.pickupLocation || pickupPoint || userLocation;

  const nearbyDriversWithin5km = useMemo(() => {
    return filterDriversWithinPickupRadius(
      onlineDrivers,
      currentPickup,
      DRIVER_MATCH_RADIUS_KM
    );
  }, [onlineDrivers, currentPickup]);

  const ownerRouteCoordinates = useMemo(() => {
    if (!activeRide) return undefined;
    const s = activeRide.ride_status || activeRide.status;
    if (s === 'ride_active' || s === 'in_progress') {
      if (activeRide.pickupLocation && activeRide.destinationLocation) {
        return generateRoutePoints(
          activeRide.driverLocation || activeRide.pickupLocation,
          activeRide.destinationLocation
        );
      }
    }
    if (s === 'driver_assigned' || s === 'driver_en_route' || s === 'accepted' || s === 'en_route') {
      if (activeRide.driverLocation && activeRide.pickupLocation) {
        return generateRoutePoints(activeRide.driverLocation, activeRide.pickupLocation);
      }
    }
    return undefined;
  }, [
    activeRide?.status,
    activeRide?.ride_status,
    activeRide?.driverLocation?.lat,
    activeRide?.driverLocation?.lng,
    activeRide?.pickupLocation,
    activeRide?.destinationLocation,
  ]);

  return (
    <div className="relative w-full h-[calc(100dvh-56px)] min-h-[420px] overflow-hidden bg-[#FFFFFF]">
      {/* Full-Bleed Map Canvas (The main focus, full-width and full-height) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapCanvas
          pickupLocation={activeRide ? activeRide.pickupLocation : pickupPoint}
          destinationLocation={activeRide ? activeRide.destinationLocation : destinationPoint}
          driverLocation={activeRide?.driverLocation || null}
          userLocation={userLocation}
          routeCoordinates={ownerRouteCoordinates}
          isDraggablePin={!activeRide}
          onPickupChange={(point) => setPickupPoint(point)}
          nearbyDrivers={(!activeRide || activeRide.status === 'looking_for_driver' || activeRide.ride_status === 'pending') ? nearbyDriversWithin5km : undefined}
        />
      </div>

      {/* Floating Centered Search Bar (Top of Map, Uber-style instant search trigger) */}
      {!activeRide && (
        <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-[92%] sm:w-[480px] max-w-lg z-20">
          <div
            onClick={() => setSearchTarget('pickup')}
            className="bg-[#FFFFFF] border border-[#E4E4E4] rounded-full sm:rounded-2xl shadow-floating px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 cursor-pointer hover:border-[#0E0E0E] transition select-none group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#F6F6F6] border border-[#E4E4E4] flex items-center justify-center shrink-0 text-[#0E0E0E] group-hover:bg-[#0E0E0E] group-hover:text-[#FFFFFF] transition">
                <IconSearch size={15} />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-[#0E0E0E] truncate block">
                  {pickupPoint?.address ? pickupPoint.address.split(',')[0] : 'Search location'}
                </span>
                <span className="text-[11px] text-[#757575] truncate hidden sm:block">
                  {pickupPoint?.area ? `Pickup: ${pickupPoint.area} • Tap to change` : 'Search any pickup address or tap map'}
                </span>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 bg-[#F6F6F6] border border-[#E4E4E4] px-2.5 py-1 rounded-full">
              <span className={`w-2 h-2 rounded-full ${nearbyDriversWithin5km.length > 0 ? 'bg-[#0F7B5F] animate-pulse' : 'bg-[#757575]'}`}></span>
              <span className={`text-[11px] font-semibold whitespace-nowrap ${nearbyDriversWithin5km.length > 0 ? 'text-[#0F7B5F]' : 'text-[#757575]'}`}>
                {nearbyDriversWithin5km.length > 0 ? `${nearbyDriversWithin5km.length} nearby (≤5km)` : '0 within 5km'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE RIDE DOCKED PANEL (Bottom Center) */}
      {activeRide && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[480px] max-w-lg z-30 rounded-2xl border border-[#E4E4E4] bg-[#FFFFFF] shadow-floating overflow-hidden">
          {(activeRide.status === 'looking_for_driver' ||
            activeRide.status === 'pending' ||
            activeRide.ride_status === 'pending') && (
            <SearchingSheet ride={activeRide} nearbyCount={nearbyDriversWithin5km.length} />
          )}
          {(activeRide.status === 'driver_assigned' ||
            activeRide.status === 'driver_en_route' ||
            activeRide.status === 'driver_arrived' ||
            activeRide.ride_status === 'accepted' ||
            activeRide.ride_status === 'en_route' ||
            activeRide.ride_status === 'arrived') && <DriverAssignedSheet ride={activeRide} />}
          {(activeRide.status === 'ride_active' ||
            activeRide.status === 'in_progress' ||
            activeRide.ride_status === 'in_progress') && (
            <LiveTripSheet ride={activeRide} onOpenSOS={() => setShowSOSModal(true)} />
          )}
        </div>
      )}

      {/* ACTIVE RECURRING CHAUFFEUR DOCKED CARD (If owner has active contract) */}
      {activeSubscription && !activeRide && !isBookingSheetOpen && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[480px] max-w-lg z-25">
          <ActiveSubscriptionCard
            subscription={activeSubscription}
            onCancel={cancelSubscription}
          />
        </div>
      )}

      {/* IDLE BOTTOM PEEK CARD (When no active ride and booking sheet closed and no active subscription) */}
      {!activeRide && !isBookingSheetOpen && !activeSubscription && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[480px] max-w-lg z-20">
          <div className="bg-[#FFFFFF] border border-[#E4E4E4] rounded-2xl shadow-floating p-3.5 sm:p-4 space-y-3">
            {/* Primary & Estimate Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsBookingSheetOpen(true)}
                className="btn-primary w-full h-11 text-xs sm:text-sm font-semibold"
              >
                Book a driver
              </button>
              <button
                type="button"
                onClick={() => setShowEstimateModal(true)}
                className="btn-secondary w-full h-11 text-xs sm:text-sm font-semibold gap-1.5 cursor-pointer"
                title="Calculate approximate cost based on distance and duration"
              >
                <IconCalculator size={15} />
                <span>Estimate trip</span>
              </button>
            </div>

            {/* Recurring Chauffeur / Subscription Banner */}
            <div
              onClick={() => setShowSubscriptionModal(true)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#0E0E0E] text-[#FFFFFF] cursor-pointer hover:bg-[#262626] transition group shadow-xs select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#F2B705] text-[#0E0E0E] flex items-center justify-center font-bold text-xs shrink-0">
                  📅
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#FFFFFF] truncate">
                      Book for custom days (Mon–Fri / Month)
                    </span>
                    <span className="text-[10px] font-bold text-[#F2B705] bg-[#F2B705]/20 px-1.5 py-0.5 rounded shrink-0">
                      22% off
                    </span>
                  </div>
                  <span className="text-[11px] text-[#D1D5DB] block leading-tight truncate mt-0.5">
                    Hire a dedicated driver weekly or monthly
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#0E0E0E] bg-[#F2B705] px-2.5 py-1 rounded-full shrink-0 group-hover:scale-105 transition ml-1">
                Book →
              </span>
            </div>

            {/* Quick Destination Hubs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#757575] font-medium px-0.5">
                <span>Popular destinations</span>
                <span className="text-[10px] text-[#757575]">Scroll for more →</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar -mx-0.5 px-0.5">
                {recentPlaces.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => {
                      setPickupPoint({
                        address: place.name,
                        area: place.area,
                        lat: place.lat,
                        lng: place.lng,
                      });
                      setIsBookingSheetOpen(true);
                    }}
                    className="shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#F6F6F6] hover:bg-[#EAEAEA] active:bg-[#E0E0E0] border border-[#E4E4E4] text-left transition cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] flex items-center justify-center shrink-0 text-[#0E0E0E]">
                      <IconPin size={12} />
                    </div>
                    <div className="min-w-0 pr-1">
                      <span className="text-xs font-semibold text-[#0E0E0E] whitespace-nowrap block">
                        {place.name.split(',')[0]}
                      </span>
                      <span className="text-[10px] text-[#757575] whitespace-nowrap block leading-tight">
                        {place.area}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Row - Roomy Card */}
            <div
              onClick={onOpenVehicles}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#F6F6F6] hover:bg-[#EAEAEA] border border-[#E4E4E4] text-xs text-[#0E0E0E] cursor-pointer transition group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] flex items-center justify-center shrink-0 text-[#0E0E0E]">
                  <IconCarSide size={14} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-medium text-[#757575] block leading-none">Vehicle</span>
                  <span className="text-xs font-semibold text-[#0E0E0E] truncate block mt-0.5">{currentVehicleSummary}</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#0E0E0E] bg-[#FFFFFF] border border-[#E4E4E4] group-hover:border-[#0E0E0E] px-2.5 py-1 rounded-full shrink-0 shadow-2xs transition">
                Change
              </span>
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED BOOKING DRAWER / MODAL (Centered, compact, cross-device optimized) */}
      {!activeRide && isBookingSheetOpen && (
        <div className="absolute inset-x-0 bottom-0 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-[480px] max-w-lg z-40 max-h-[85vh] sm:max-h-[calc(100vh-80px)] flex flex-col bg-[#FFFFFF] rounded-t-2xl sm:rounded-2xl border border-[#E4E4E4] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-[#E4E4E4] flex items-center justify-between shrink-0 bg-[#FFFFFF]">
            <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#0E0E0E]">
              Book a driver
            </h2>
            <button
              type="button"
              onClick={() => setIsBookingSheetOpen(false)}
              className="text-xs font-medium text-[#757575] hover:text-[#0E0E0E] underline cursor-pointer p-1"
            >
              Close
            </button>
          </div>

          {/* Scrollable Form Content */}
          <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 flex-1">
            {/* Pickup Row with Uber-style Live Search */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-[#757575]">
                  Pickup address
                </label>
                <button
                  type="button"
                  onClick={() => setSearchTarget('pickup')}
                  className="text-[11px] font-semibold text-[#0E0E0E] underline cursor-pointer"
                >
                  Search any address
                </button>
              </div>

              {/* Tappable Search Field */}
              <div
                onClick={() => setSearchTarget('pickup')}
                className="p-2.5 bg-[#F6F6F6] hover:bg-[#FFFFFF] border border-[#E4E4E4] hover:border-[#0E0E0E] rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] flex items-center justify-center shrink-0 text-[#0E0E0E]">
                    <IconPin size={13} />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-[#0E0E0E] truncate">
                    {pickupPoint ? pickupPoint.address : 'Search location'}
                  </span>
                </div>
                <span className="text-[11px] text-[#757575] group-hover:text-[#0E0E0E] underline shrink-0">
                  Change
                </span>
              </div>
            </div>

            {/* Destination Row & Trip Estimator Trigger */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-[#757575]">
                  Destination (dropoff)
                </label>
                <button
                  type="button"
                  onClick={() => setShowEstimateModal(true)}
                  className="text-[11px] font-semibold text-[#0E0E0E] underline flex items-center gap-1 cursor-pointer hover:text-[#F2B705] transition"
                  title="Estimate cost by distance & duration"
                >
                  <IconCalculator size={12} />
                  <span>Estimate by distance</span>
                </button>
              </div>

              {/* Tappable Destination Field */}
              <div
                onClick={() => setSearchTarget('destination')}
                className="p-2.5 bg-[#F6F6F6] hover:bg-[#FFFFFF] border border-[#E4E4E4] hover:border-[#0E0E0E] rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-sm bg-[#FFFFFF] border border-[#E4E4E4] flex items-center justify-center shrink-0 text-[#0E0E0E]">
                    <div className="w-2.5 h-2.5 rounded-2xs bg-[#0E0E0E]" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-[#0E0E0E] truncate">
                    {destinationPoint ? destinationPoint.address : 'Where should driver drop you?'}
                  </span>
                </div>
                <span className="text-[11px] text-[#757575] group-hover:text-[#0E0E0E] underline shrink-0">
                  {destinationPoint ? 'Change' : 'Set'}
                </span>
              </div>
            </div>

            {/* Trip Type Segmented Control */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-[#757575]">
                  Trip type
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsBookingSheetOpen(false);
                    setShowSubscriptionModal(true);
                  }}
                  className="text-[11px] font-bold text-[#0E0E0E] underline flex items-center gap-1 hover:text-[#F2B705] cursor-pointer"
                >
                  <span>📅 Need Mon–Fri / Monthly?</span>
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#F6F6F6] border border-[#E4E4E4] rounded-[8px]">
                {[
                  { id: 'commute', label: 'Commute' },
                  { id: 'evening_out', label: 'Evening' },
                  { id: 'outstation', label: 'Outstation' },
                  { id: 'airport', label: 'Airport' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTripType(t.id as TripType)}
                    className={`py-1.5 text-xs font-medium rounded-[6px] transition ${
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

            {/* Time Block Stepper */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#757575]">
                {tripType === 'outstation' ? 'Duration (Days)' : 'Duration (Hours)'}
              </label>
              {tripType === 'outstation' ? (
                <div className="flex items-center justify-between p-2.5 bg-[#F6F6F6] border border-[#E4E4E4] rounded-[8px]">
                  <span className="text-xs sm:text-sm font-medium text-[#0E0E0E]">
                    {outstationDays} {outstationDays === 1 ? 'day' : 'days'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOutstationDays(Math.max(1, outstationDays - 1))}
                      className="w-7 h-7 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] flex items-center justify-center font-medium text-xs"
                    >
                      −
                    </button>
                    <span className="font-tabular font-medium text-xs sm:text-sm w-6 text-center">
                      {outstationDays}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOutstationDays(outstationDays + 1)}
                      className="w-7 h-7 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] flex items-center justify-center font-medium text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-[#F6F6F6] border border-[#E4E4E4] rounded-[8px]">
                  <span className="text-xs sm:text-sm font-medium text-[#0E0E0E]">
                    {durationHours} {durationHours === 1 ? 'hour' : 'hours'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDurationHours(Math.max(1, durationHours - 1))}
                      className="w-7 h-7 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] flex items-center justify-center font-medium text-xs"
                    >
                      −
                    </button>
                    <span className="font-tabular font-medium text-xs sm:text-sm w-6 text-center">
                      {durationHours}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDurationHours(Math.min(12, durationHours + 1))}
                      className="w-7 h-7 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] flex items-center justify-center font-medium text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Selection Row */}
            <div
              onClick={onOpenVehicles}
              className="flex items-center justify-between p-2.5 bg-[#F6F6F6] border border-[#E4E4E4] rounded-[8px] cursor-pointer hover:border-[#0E0E0E] transition"
            >
              <div>
                <span className="text-[10px] font-medium text-[#757575] block">
                  Vehicle
                </span>
                <span className="text-xs sm:text-sm font-medium text-[#0E0E0E] block">
                  {currentVehicleSummary}
                </span>
              </div>
              <span className="text-xs text-[#757575] underline">Change</span>
            </div>

            {/* Driver Preferences Brief row */}
            <div
              onClick={() => setShowBriefModal(true)}
              className="flex items-center justify-between p-2.5 bg-[#F6F6F6] border border-[#E4E4E4] rounded-[8px] cursor-pointer hover:border-[#0E0E0E] transition"
            >
              <div>
                <span className="text-[10px] font-medium text-[#757575] block">
                  Driver preferences
                </span>
                <span className="text-xs font-medium text-[#0E0E0E] block capitalize">
                  AC {driverBrief.acPreference} • Music {driverBrief.musicPreference}
                  {driverBrief.noPhoneCalls ? ' • No calls' : ''}
                </span>
              </div>
              <span className="text-xs text-[#757575] underline">Edit</span>
            </div>

            {/* Timing mode */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStartTimeMode('now')}
                className={`h-9 rounded-[8px] text-xs font-medium border transition ${
                  startTimeMode === 'now'
                    ? 'bg-[#0E0E0E] text-[#FFFFFF] border-[#0E0E0E]'
                    : 'bg-[#FFFFFF] text-[#757575] border-[#E4E4E4]'
                }`}
              >
                Depart now
              </button>
              <button
                type="button"
                onClick={() => setStartTimeMode('scheduled')}
                className={`h-9 rounded-[8px] text-xs font-medium border transition ${
                  startTimeMode === 'scheduled'
                    ? 'bg-[#0E0E0E] text-[#FFFFFF] border-[#0E0E0E]'
                    : 'bg-[#FFFFFF] text-[#757575] border-[#E4E4E4]'
                }`}
              >
                Schedule later
              </button>
            </div>
          </div>

          {/* Fare Summary & Confirmation Pinned to bottom */}
          <div className="p-3.5 sm:p-4 border-t border-[#E4E4E4] bg-[#FFFFFF] shrink-0 space-y-2.5">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-[#757575] block">Estimated fare</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowFareModal(true)}
                    className="text-xs text-[#757575] underline hover:text-[#0E0E0E]"
                  >
                    View breakdown
                  </button>
                  <span className="text-[#E4E4E4]">•</span>
                  <button
                    type="button"
                    onClick={() => setShowEstimateModal(true)}
                    className="text-xs text-[#0E0E0E] font-medium underline hover:text-[#F2B705] flex items-center gap-1 cursor-pointer"
                  >
                    <IconCalculator size={11} />
                    <span>Trip estimate</span>
                  </button>
                </div>
              </div>
              <span className="text-[20px] sm:text-[22px] font-semibold text-[#0E0E0E] font-tabular">
                {formatRupee(fareEstimate.totalFare)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowFareModal(true)}
              className="btn-primary w-full h-11 text-xs sm:text-sm font-semibold"
            >
              Confirm booking
            </button>
          </div>
        </div>
      )}

      {/* Fare Breakdown Modal */}
      <FareBreakdownModal
        isOpen={showFareModal}
        onClose={() => setShowFareModal(false)}
        onConfirm={handleConfirmBooking}
        breakdown={fareEstimate}
        tripType={tripType}
        pickupAddress={pickupPoint?.address || 'Search location'}
        vehicleSummary={currentVehicleSummary}
        loading={creating}
      />

      {/* SOS Emergency Modal */}
      {activeRide && (
        <SOSModal
          isOpen={showSOSModal}
          onClose={() => setShowSOSModal(false)}
          ride={activeRide}
        />
      )}

      {/* Receipt & Rating Modal */}
      {activeRide && activeRide.status === 'completed' && showReceiptModal && (
        <ReceiptRatingModal
          ride={activeRide}
          onDismiss={() => {
            setShowReceiptModal(false);
            clearActiveRide();
          }}
        />
      )}

      {/* Driver Brief Modal */}
      <DriverBriefModal
        isOpen={showBriefModal}
        onClose={() => setShowBriefModal(false)}
        brief={driverBrief}
        onSave={(b) => setDriverBrief(b)}
      />

      {/* Estimate Trip Fare Modal */}
      <EstimateTripModal
        isOpen={showEstimateModal}
        onClose={() => setShowEstimateModal(false)}
        initialPickup={pickupPoint}
        initialDestination={destinationPoint}
        onApplyBooking={(params) => {
          setPickupPoint(params.pickup);
          setDestinationPoint(params.destination);
          setDurationHours(params.durationHours);
          setTripType(params.tripType);
          if (params.outstationDays) {
            setOutstationDays(params.outstationDays);
          }
          setIsBookingSheetOpen(true);
        }}
      />

      {/* Dynamic Location Search Modal for Pickup or Destination */}
      <LocationSearchModal
        isOpen={Boolean(searchTarget)}
        onClose={() => setSearchTarget(null)}
        title={searchTarget === 'pickup' ? 'Where should we pick you up?' : 'Where are you heading?'}
        currentAddress={searchTarget === 'pickup' ? (pickupPoint?.address || '') : (destinationPoint?.address || '')}
        onSelectLocation={(point) => {
          if (searchTarget === 'pickup') {
            setPickupPoint(point);
          } else if (searchTarget === 'destination') {
            setDestinationPoint(point);
          }
          setSearchTarget(null);
          setIsBookingSheetOpen(true);
        }}
      />

      {/* Recurring Driver & Subscription Booking Modal */}
      <SubscriptionBookingModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onOpenVehicles={onOpenVehicles}
      />

      {/* Real-Time Driver Cancellation Notice Banner */}
      {lastCancellationNotice && lastCancellationNotice.by === 'driver' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[92%] sm:w-[480px] max-w-lg z-40 p-4 bg-[#FFF5F5] border-2 border-[#C8321E] rounded-xl shadow-2xl animate-fade-in flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C8321E]/10 flex items-center justify-center shrink-0 mt-0.5">
              <IconAlert size={18} className="text-[#C8321E]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0E0E0E]">Trip Cancelled by Driver</h4>
              <p className="text-xs text-[#757575] mt-0.5">
                Reason: <strong className="text-[#0E0E0E]">{lastCancellationNotice.reason}</strong>
              </p>
              <p className="text-[11px] text-[#757575] mt-1">
                You can submit a new booking request to find another nearby driver immediately.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearCancellationNotice}
            className="p-1 text-[#757575] hover:text-[#0E0E0E] rounded-full hover:bg-[#E4E4E4]/50 transition cursor-pointer"
          >
            <IconX size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
