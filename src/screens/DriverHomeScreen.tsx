import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupee, generateRoutePoints } from '../utils/fare';
import { MapCanvas } from '../components/MapCanvas';
import { IconRoute, IconPhone, IconCheck, IconNavigation, IconAlert, IconX } from '../components/Icons';
import { CancelRideModal } from '../components/CancelRideModal';
import { SuccessModal } from '../components/SuccessModal';

interface DriverHomeScreenProps {
  onOpenDriverProfile: () => void;
  onOpenEarnings: () => void;
}

export const DriverHomeScreen: React.FC<DriverHomeScreenProps> = ({
  onOpenDriverProfile,
  onOpenEarnings,
}) => {
  const {
    driverProfile,
    updateDriverProfile,
    driverAvailableRides,
    activeRide,
    lastCancellationNotice,
    clearCancellationNotice,
    userLocation,
    driverAcceptRide,
    driverMarkEnRoute,
    driverMarkArrived,
    driverStartTrip,
    driverEndTrip,
    cancelRide,
    clearActiveRide,
  } = useApp();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTripSuccessModal, setShowTripSuccessModal] = useState(false);

  // Start OTP state (entered upon arrival to start trip)
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // End OTP state (entered upon reaching destination to complete trip)
  const [enteredEndOtp, setEnteredEndOtp] = useState('');
  const [endOtpError, setEndOtpError] = useState('');
  const [showEndOtpSection, setShowEndOtpSection] = useState(false);

  const [accepting, setAccepting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [acceptTimer, setAcceptTimer] = useState(30);
  const [declinedRideIds, setDeclinedRideIds] = useState<string[]>([]);

  // Filter out any ride this driver explicitly declined or timed out on
  const availableRides = useMemo(() => {
    return driverAvailableRides.filter((r) => !declinedRideIds.includes(r.id));
  }, [driverAvailableRides, declinedRideIds]);

  const currentIncoming = !activeRide && availableRides.length > 0 ? availableRides[0] : null;

  // 30-second countdown for incoming request popup
  useEffect(() => {
    if (currentIncoming) {
      setAcceptTimer(30);
      const timer = setInterval(() => {
        setAcceptTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentIncoming?.id]);

  // Auto-dismiss when timer expires
  useEffect(() => {
    if (acceptTimer === 0 && currentIncoming) {
      setDeclinedRideIds((prev) => [...prev, currentIncoming.id]);
    }
  }, [acceptTimer, currentIncoming]);

  const isVerified = driverProfile?.verificationStatus === 'verified';
  const isOnline = !!driverProfile?.isOnline;

  // Normalized ride status
  const rawStatus = activeRide?.ride_status || activeRide?.status;
  const isEnRoute = rawStatus === 'en_route' || rawStatus === 'accepted' || rawStatus === 'driver_assigned' || rawStatus === 'driver_en_route';
  const isArrived = rawStatus === 'arrived' || rawStatus === 'driver_arrived';
  const isInProgress = rawStatus === 'in_progress' || rawStatus === 'ride_active';
  const isCompleted = rawStatus === 'completed';

  const handleToggleOnline = () => {
    if (!driverProfile) return;
    const nextOnline = !driverProfile.isOnline;
    const coords = userLocation ? { currentLat: userLocation.lat, currentLng: userLocation.lng } : {};
    updateDriverProfile({
      isOnline: nextOnline,
      ...coords,
    });
  };

  // Ensure online status and live coordinates are written to Firestore on mount
  useEffect(() => {
    if (isOnline && driverProfile) {
      updateDriverProfile({
        isOnline: true,
        ...(userLocation ? { currentLat: userLocation.lat, currentLng: userLocation.lng } : {}),
      });
    }
  }, [isOnline]);

  // Automatically keep driver's real-time GPS coordinates synced in Firestore while online
  useEffect(() => {
    if (isOnline && userLocation && driverProfile) {
      const latDiff = Math.abs((driverProfile.currentLat || 0) - userLocation.lat);
      const lngDiff = Math.abs((driverProfile.currentLng || 0) - userLocation.lng);
      if (latDiff > 0.0001 || lngDiff > 0.0001) {
        updateDriverProfile({
          currentLat: userLocation.lat,
          currentLng: userLocation.lng,
          isOnline: true,
        });
      }
    }
  }, [isOnline, userLocation?.lat, userLocation?.lng]);

  const handleAccept = async (rideId: string) => {
    setAccepting(true);
    try {
      const ok = await driverAcceptRide(rideId);
      if (!ok) {
        alert('This ride was already assigned or cancelled.');
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleVerifyOtpAndStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRide) return;
    if (enteredOtp.length !== 4) {
      setOtpError('Enter the 4-digit code shown on the owner’s screen.');
      return;
    }

    const res = await driverStartTrip(activeRide.id, enteredOtp);
    if (!res.success) {
      setOtpError(res.message || 'Incorrect start code.');
    } else {
      setOtpError('');
      setEnteredOtp('');
    }
  };

  const handleVerifyEndOtpAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRide) return;
    if (enteredEndOtp.length !== 4) {
      setEndOtpError('Enter the 4-digit completion code provided by the owner.');
      return;
    }

    setCompleting(true);
    try {
      const res = await driverEndTrip(activeRide.id, enteredEndOtp);
      if (!res.success) {
        setEndOtpError(res.message || 'Incorrect end OTP. Please ask owner for the code.');
      } else {
        setEndOtpError('');
        setEnteredEndOtp('');
        setShowEndOtpSection(false);
        setShowTripSuccessModal(true);
      }
    } finally {
      setCompleting(false);
    }
  };

  // Dynamic Route Coordinates for Map
  const driverCoords = userLocation || (driverProfile?.currentLat && driverProfile?.currentLng
    ? { lat: driverProfile.currentLat, lng: driverProfile.currentLng }
    : null);

  const activeRouteCoordinates = useMemo(() => {
    if (!activeRide) return undefined;

    // STATE: IN PROGRESS -> Route to final destination
    if (isInProgress && activeRide.pickupLocation && activeRide.destinationLocation) {
      const startPoint = driverCoords || activeRide.pickupLocation;
      return generateRoutePoints(startPoint, activeRide.destinationLocation);
    }

    // STATE: EN ROUTE / ARRIVED -> Route to Owner's pickup location
    if ((isEnRoute || isArrived) && driverCoords && activeRide.pickupLocation) {
      return generateRoutePoints(driverCoords, activeRide.pickupLocation);
    }

    return undefined;
  }, [isInProgress, isEnRoute, isArrived, driverCoords?.lat, driverCoords?.lng, activeRide?.pickupLocation, activeRide?.destinationLocation]);

  return (
    <div className="relative w-full h-[calc(100dvh-56px)] min-h-[420px] overflow-hidden bg-[#FFFFFF]">
      {/* Full Bleed Map Canvas */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapCanvas
          pickupLocation={activeRide?.pickupLocation || currentIncoming?.pickupLocation || null}
          // DESTINATION IS REVEALED ON MAP ONLY ONCE IN_PROGRESS
          destinationLocation={isInProgress ? activeRide?.destinationLocation : null}
          driverLocation={activeRide?.driverLocation || userLocation || { lat: driverProfile?.currentLat || 22.428, lng: driverProfile?.currentLng || 88.421 }}
          userLocation={userLocation}
          routeCoordinates={activeRouteCoordinates}
          isDraggablePin={false}
        />
      </div>

      {/* Centered Online/Offline Status Pill (Top Center) */}
      <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-20 bg-[#FFFFFF] border border-[#E4E4E4] rounded-full px-3.5 py-1.5 shadow-floating flex items-center gap-2 select-none">
        <span
          className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-[#0F7B5F]' : 'bg-[#757575]'
          }`}
        />
        <span className="text-xs font-semibold text-[#0E0E0E]">
          {isOnline ? 'Online (Dispatch Active)' : 'Offline'}
        </span>
      </div>

      {/* Verification Alert Banner (Top, under pill, if not verified) */}
      {!isVerified && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[92%] sm:w-[460px] max-w-lg z-20 p-3 bg-[#FFFFFF] border border-[#E4E4E4] rounded-xl shadow-floating text-xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="font-semibold text-[#C8321E] block">
              Licence verification pending
            </span>
            <p className="text-[11px] text-[#757575] truncate">
              Toggle verification in profile to simulate live trips.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenDriverProfile}
            className="text-xs font-semibold text-[#0E0E0E] underline shrink-0"
          >
            Update
          </button>
        </div>
      )}

      {/* ACTIVE TRIP DASHBOARD (Never vanishes after accepting) */}
      {activeRide && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[480px] max-w-lg z-30 max-h-[85vh] overflow-y-auto bg-[#FFFFFF] border border-[#E4E4E4] rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3.5">
          {/* Status Header Badge */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F7B5F] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0F7B5F] animate-pulse" />
                {isEnRoute && 'Status: En Route to Pickup'}
                {isArrived && 'Status: Arrived at Pickup'}
                {isInProgress && 'Status: Trip in Progress'}
                {isCompleted && 'Status: Trip Completed'}
              </span>
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[#0E0E0E] leading-tight mt-0.5">
                {isEnRoute && 'Heading to Owner’s Location'}
                {isArrived && 'Awaiting Owner’s Start OTP'}
                {isInProgress && 'Navigating to Destination'}
                {isCompleted && 'Trip Finished & Payout Settled'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[18px] sm:text-[20px] font-bold text-[#0E0E0E] font-tabular">
                {formatRupee(Math.round((activeRide.fareEstimate?.totalFare || 350) * 0.85))}
              </span>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="text-[11px] font-semibold text-[#DC2626] hover:bg-[#FEE2E2] px-2.5 py-1 rounded-md border border-[#FCA5A5] cursor-pointer transition"
                title="Cancel this trip"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Owner & Car Details */}
          <div className="bg-[#F6F6F6] rounded-[10px] p-3 space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-0.5 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Vehicle Owner</span>
              <span className="font-semibold text-[#0E0E0E]">{activeRide?.ownerName || 'Vehicle Owner'}</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Contact</span>
              <a
                href={`tel:${activeRide?.ownerPhone || ''}`}
                className="font-semibold text-[#0E0E0E] underline flex items-center gap-1.5 hover:text-[#0F7B5F]"
              >
                <IconPhone size={13} />
                <span>+91 {activeRide?.ownerPhone || 'Client'}</span>
              </a>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Vehicle</span>
              <span className="font-semibold text-[#0E0E0E]">
                {activeRide?.vehicleInfo?.make || 'Car'} {activeRide?.vehicleInfo?.model || ''} ({activeRide?.vehicleInfo?.registrationNumber || 'WB Reg'})
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#757575]">Transmission</span>
              <span className="font-semibold text-[#0E0E0E] capitalize">
                {activeRide?.vehicleInfo?.transmission || 'Manual'} • {activeRide?.vehicleInfo?.fuelType || 'Petrol'}
              </span>
            </div>
          </div>

          {/* STATE 1: EN ROUTE (Show route to pickup + 'Arrived' button) */}
          {isEnRoute && (
            <div className="space-y-3 pt-1 border-t border-[#E4E4E4]">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-[#757575] block">
                  Pickup address
                </span>
                <p className="text-xs sm:text-sm font-semibold text-[#0E0E0E]">
                  {activeRide.pickupLocation.address}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeRide.pickupLocation.lat},${activeRide.pickupLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full gap-1.5 text-xs h-11"
                >
                  <IconRoute size={15} />
                  <span>Navigate</span>
                </a>

                {/* State: En Route -> Add a button that says 'Arrived' */}
                <button
                  type="button"
                  onClick={() => driverMarkArrived(activeRide.id)}
                  className="btn-primary w-full h-11 text-xs sm:text-sm font-semibold"
                >
                  Arrived
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: ARRIVED (Input field requiring driver to enter start_otp provided by Owner) */}
          {isArrived && (
            <form onSubmit={handleVerifyOtpAndStart} className="space-y-3 pt-1 border-t border-[#E4E4E4]">
              <div className="p-3 bg-[#F6F6F6] rounded-xl border border-[#E4E4E4] text-center space-y-1.5">
                <span className="text-xs sm:text-sm font-bold text-[#0E0E0E] block">
                  Enter 4-digit Start OTP
                </span>
                <p className="text-[11px] text-[#757575]">
                  Ask {activeRide.ownerName} for the 4-digit code displayed on their screen.
                </p>

                <div className="flex justify-center gap-2 py-1">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 rounded-[8px] bg-[#FFFFFF] border-2 border-[#0E0E0E] flex items-center justify-center font-code-mono text-xl font-bold text-[#0E0E0E] shadow-xs"
                    >
                      {enteredOtp[idx] || ''}
                    </div>
                  ))}
                </div>

                {/* OTP Test Helper Pill */}
                {(activeRide.start_otp || activeRide.otp) && (
                  <button
                    type="button"
                    onClick={() => {
                      const code = (activeRide.start_otp || activeRide.otp || '').slice(0, 4);
                      setEnteredOtp(code);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F2B705]/20 text-[#0E0E0E] text-xs font-semibold border border-[#F2B705]/50 hover:bg-[#F2B705]/35 cursor-pointer transition my-1"
                  >
                    <span>Owner Start OTP: <strong>{activeRide.start_otp || activeRide.otp}</strong></span>
                    <span className="underline text-[11px] font-bold">(Tap to fill)</span>
                  </button>
                )}

                <input
                  type="text"
                  maxLength={4}
                  value={enteredOtp}
                  onChange={(e) => {
                    setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''));
                    setOtpError('');
                  }}
                  autoFocus
                  placeholder="Enter 4-digit start OTP"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-[8px] border border-[#E4E4E4] bg-[#FFFFFF] text-[#0E0E0E] text-center font-code-mono focus:border-[#0E0E0E] outline-none"
                />

                {otpError && (
                  <p className="text-xs text-[#C8321E] font-medium">{otpError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={enteredOtp.length !== 4}
                className="btn-primary w-full h-11 text-xs sm:text-sm font-semibold"
              >
                Verify Start OTP & Begin Trip
              </button>

              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="w-full py-1 text-xs font-semibold text-[#DC2626] hover:underline cursor-pointer text-center block"
              >
                Cancel Trip / Client No-Show
              </button>
            </form>
          )}

          {/* STATE 3: IN PROGRESS (Reveal destination + End OTP verification upon reaching destination) */}
          {isInProgress && (
            <div className="space-y-3 pt-1 border-t border-[#E4E4E4]">
              {/* Revealed Destination */}
              <div className="space-y-1 bg-[#F6F6F6] p-3 rounded-xl border border-[#E4E4E4]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#0F7B5F] uppercase tracking-wide">
                    Final Destination Revealed
                  </span>
                  <span className="text-[10px] text-[#757575] font-medium">Navigating</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-[#0E0E0E]">
                  {activeRide.destinationLocation?.address || 'Destination Point'}
                </p>
                {activeRide.destinationLocation && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeRide.destinationLocation.lat},${activeRide.destinationLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary w-full gap-1.5 text-xs h-9 mt-2"
                  >
                    <IconRoute size={14} />
                    <span>Open in Google Maps Navigation</span>
                  </a>
                )}
              </div>

              {/* Owner preferences */}
              {activeRide.driverBrief && (
                <div className="text-[11px] text-[#757575] flex justify-between px-1">
                  <span>Cabin AC: <strong className="text-[#0E0E0E] capitalize">{activeRide.driverBrief.acPreference}</strong></span>
                  <span>Music: <strong className="text-[#0E0E0E] capitalize">{activeRide.driverBrief.musicPreference}</strong></span>
                </div>
              )}

              {/* State: Completed -> When reaching destination, require driver to input end_otp */}
              {!showEndOtpSection ? (
                <button
                  type="button"
                  onClick={() => setShowEndOtpSection(true)}
                  className="btn-primary w-full h-11 text-xs sm:text-sm font-semibold"
                >
                  Reached Destination • Enter End OTP
                </button>
              ) : (
                <form onSubmit={handleVerifyEndOtpAndComplete} className="space-y-2.5 p-3 bg-[#F6F6F6] rounded-xl border border-[#E4E4E4]">
                  <span className="text-xs sm:text-sm font-bold text-[#0E0E0E] block text-center">
                    Enter 4-digit End OTP
                  </span>
                  <p className="text-[11px] text-[#757575] text-center">
                    Ask {activeRide.ownerName} for the 4-digit completion code shown on their screen.
                  </p>

                  <div className="flex justify-center gap-2 py-1">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className="w-12 h-12 rounded-[8px] bg-[#FFFFFF] border-2 border-[#0E0E0E] flex items-center justify-center font-code-mono text-xl font-bold text-[#0E0E0E]"
                      >
                        {enteredEndOtp[idx] || ''}
                      </div>
                    ))}
                  </div>

                  <input
                    type="text"
                    maxLength={4}
                    value={enteredEndOtp}
                    onChange={(e) => {
                      setEnteredEndOtp(e.target.value.replace(/[^0-9]/g, ''));
                      setEndOtpError('');
                    }}
                    autoFocus
                    placeholder="Enter 4-digit end OTP"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-[8px] border border-[#E4E4E4] bg-[#FFFFFF] text-[#0E0E0E] text-center font-code-mono focus:border-[#0E0E0E] outline-none"
                  />

                  {endOtpError && (
                    <p className="text-xs text-[#C8321E] font-medium text-center">{endOtpError}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowEndOtpSection(false)}
                      className="btn-secondary w-full text-xs h-10"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={enteredEndOtp.length !== 4 || completing}
                      className="btn-primary w-full text-xs h-10 font-semibold"
                    >
                      {completing ? 'Completing...' : 'Verify & Finish Ride'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STATE 4: COMPLETED (Celebration Overlay & Live Owner Payment Tracker) */}
          {isCompleted && (
            <div className="space-y-4 pt-1 border-t border-[#E4E4E4] text-center animate-fade-in">
              <div className="p-4 bg-[#0F7B5F]/10 border-2 border-[#0F7B5F] rounded-2xl space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#0F7B5F] text-[#FFFFFF] flex items-center justify-center mx-auto shadow-md animate-checkmark-pop">
                  <IconCheck size={26} strokeWidth={3} />
                </div>
                <span className="text-xs font-bold text-[#0F7B5F] uppercase tracking-wider block">
                  🎉 Trip Completed & Delivered
                </span>
                <h3 className="text-xl font-bold text-[#0E0E0E] font-tabular">
                  {formatRupee(Math.round((activeRide.fareEstimate?.totalFare || 350) * 0.85))} Earned
                </h3>
                <span className="text-[11px] text-[#757575] block">
                  85% Chauffeur payout credited to your daily ledger
                </span>
              </div>

              {/* Live Owner Payment Status */}
              <div className="p-3 bg-[#F6F6F6] rounded-xl border border-[#E4E4E4] text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0E0E0E]">Owner Payment Status:</span>
                  {activeRide.paymentStatus === 'paid' ? (
                    <span className="text-[11px] font-bold text-[#0F7B5F] bg-[#0F7B5F]/15 border border-[#0F7B5F]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <IconCheck size={12} /> Paid via UPI
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-[#F2B705] bg-[#F2B705]/20 border border-[#F2B705]/50 px-2 py-0.5 rounded-full animate-pulse">
                      ⏳ Owner Paying via UPI...
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#757575]">
                  {activeRide.paymentStatus === 'paid'
                    ? `Ref: UPI-${(activeRide.paymentReference || activeRide.id.slice(-6)).toUpperCase()}`
                    : 'Waiting for vehicle owner to authorize UPI checkout on their screen.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => clearActiveRide()}
                className="btn-primary w-full h-12 text-sm font-semibold cursor-pointer shadow-floating"
              >
                Done • Back to Online Dispatch Radar
              </button>
            </div>
          )}
        </div>
      )}

      {/* INCOMING REQUEST POPUP (Shown only when driver has NO active ride) */}
      {!activeRide && currentIncoming && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[480px] max-w-lg z-30 max-h-[82vh] overflow-y-auto bg-[#FFFFFF] border border-[#E4E4E4] rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
          {/* 30-Second Countdown Progress Bar along top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#E4E4E4] overflow-hidden">
            <div
              className="h-full bg-[#0E0E0E] transition-all duration-1000 ease-linear"
              style={{ width: `${(acceptTimer / 30) * 100}%` }}
            />
          </div>

          <div className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#757575] uppercase tracking-wider">
                New ride request ({acceptTimer}s)
              </span>
              <span className="text-[20px] sm:text-[22px] font-semibold text-[#0E0E0E] font-tabular">
                {formatRupee(Math.round((currentIncoming.fareEstimate?.totalFare || 350) * 0.85))}
              </span>
            </div>

            {/* Trip specs */}
            <div className="space-y-2 border-t border-b border-[#E4E4E4] py-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#757575]">Pickup area</span>
                <span className="font-semibold text-[#0E0E0E]">{currentIncoming.pickupLocation.area}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#757575]">Duration</span>
                <span className="font-semibold text-[#0E0E0E] font-tabular">
                  {currentIncoming.durationHours} {currentIncoming.durationHours === 1 ? 'hour' : 'hours'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#757575]">Trip type</span>
                <span className="font-semibold text-[#0E0E0E] capitalize">{currentIncoming.tripType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#757575]">Vehicle</span>
                <span className="font-semibold text-[#0E0E0E]">
                  {currentIncoming.vehicleInfo.make} {currentIncoming.vehicleInfo.model} ({currentIncoming.vehicleInfo.transmission})
                </span>
              </div>
            </div>

            {/* Driver brief preview if present */}
            {currentIncoming.driverBrief && (
              <div className="bg-[#F6F6F6] rounded-[10px] p-2.5 text-xs space-y-1">
                <span className="font-semibold text-[#0E0E0E] block">Owner brief</span>
                <div className="text-[#757575] flex justify-between">
                  <span>AC</span>
                  <span className="text-[#0E0E0E] font-medium capitalize">{currentIncoming.driverBrief.acPreference}</span>
                </div>
                <div className="text-[#757575] flex justify-between">
                  <span>Cabin music</span>
                  <span className="text-[#0E0E0E] font-medium capitalize">{currentIncoming.driverBrief.musicPreference}</span>
                </div>
              </div>
            )}

            {/* Actions: Decline and Accept */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setDeclinedRideIds((prev) => [...prev, currentIncoming.id]);
                }}
                className="btn-secondary w-full text-xs h-10 min-h-[40px]"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleAccept(currentIncoming.id)}
                disabled={accepting}
                className="btn-primary w-full text-xs h-10 min-h-[40px]"
              >
                {accepting ? 'Assigning...' : 'Accept Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IDLE BOTTOM CARD: When no active trip and no incoming request */}
      {!activeRide && !currentIncoming && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[460px] max-w-lg z-20">
          <div className="bg-[#FFFFFF] border border-[#E4E4E4] rounded-2xl shadow-floating p-4 space-y-3">
            {/* Go Online / Go Offline Button */}
            {isOnline ? (
              <button
                type="button"
                onClick={handleToggleOnline}
                disabled={!isVerified}
                className="w-full h-12 rounded-full bg-[#FFFFFF] hover:bg-[#F6F6F6] border border-[#E4E4E4] text-[#0E0E0E] text-sm font-semibold flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer shadow-2xs"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F7B5F] animate-pulse" />
                <span>Go offline</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleOnline}
                disabled={!isVerified}
                className="btn-primary w-full h-12 text-sm font-semibold gap-2 shadow-floating"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#F2B705]" />
                <span>Go online</span>
              </button>
            )}

            {/* Today's Earnings Roomy Card */}
            <div
              onClick={onOpenEarnings}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F6F6F6] hover:bg-[#EAEAEA] border border-[#E4E4E4] transition cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] flex items-center justify-center shrink-0 font-bold text-xs text-[#0E0E0E]">
                  ₹
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[#757575] uppercase tracking-wider block leading-none">
                    Today's earnings
                  </span>
                  <span className="text-base font-bold text-[#0E0E0E] font-tabular block mt-0.5">
                    {formatRupee(driverProfile?.todayEarnings || 0)}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#0E0E0E] bg-[#FFFFFF] border border-[#E4E4E4] group-hover:border-[#0E0E0E] px-2.5 py-1 rounded-full shrink-0 transition">
                Ledger →
              </span>
            </div>

            {/* Dispatch radius notice */}
            <div className="flex items-center justify-center gap-1.5 pt-0.5 text-center">
              <span className="text-[11px] text-[#757575] leading-normal">
                {isOnline
                  ? "Radar active • Auto-receiving trips within 5 km"
                  : 'You are offline • Go online to start receiving driver dispatches'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Cancellation Notice Banner from Owner */}
      {lastCancellationNotice && lastCancellationNotice.by === 'owner' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[92%] sm:w-[460px] max-w-lg z-40 p-4 bg-[#FFF5F5] border-2 border-[#C8321E] rounded-xl shadow-2xl animate-fade-in flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C8321E]/10 flex items-center justify-center shrink-0 mt-0.5">
              <IconAlert size={18} className="text-[#C8321E]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0E0E0E]">Ride Cancelled by Owner</h4>
              <p className="text-xs text-[#757575] mt-0.5">
                Reason: <strong className="text-[#0E0E0E]">{lastCancellationNotice.reason}</strong>
              </p>
              <p className="text-[11px] text-[#757575] mt-1">
                You have been returned to active dispatch radar mode.
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

      <CancelRideModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirmCancel={async (reason) => {
          if (activeRide) {
            await cancelRide(activeRide.id, 'driver', reason);
          }
          setShowCancelModal(false);
        }}
        role="driver"
      />

      {/* Driver Success Modal for Trip Completion */}
      <SuccessModal
        isOpen={showTripSuccessModal}
        onClose={() => setShowTripSuccessModal(false)}
        type="trip_completed"
        title="Trip Finished & Payout Settled!"
        subtitle="Great duty performance! Your 85% driver share has been credited to your daily ledger."
        amount={Math.round((activeRide?.fareEstimate?.totalFare || 350) * 0.85)}
        role="driver"
      />
    </div>
  );
};
