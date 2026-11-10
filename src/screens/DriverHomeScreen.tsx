import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupee } from '../utils/fare';
import { MapCanvas } from '../components/MapCanvas';
import { DEMO_ROUTE_COORDINATES } from '../data/kolkataData';
import { IconRoute, IconPhone } from '../components/Icons';

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
    driverAcceptRide,
    driverMarkEnRoute,
    driverMarkArrived,
    driverStartTrip,
    driverEndTrip,
  } = useApp();

  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [acceptTimer, setAcceptTimer] = useState(30);

  // 30-second countdown for incoming request
  useEffect(() => {
    if (driverAvailableRides.length > 0) {
      setAcceptTimer(30);
      const timer = setInterval(() => {
        setAcceptTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [driverAvailableRides.length]);

  const handleToggleOnline = () => {
    if (!driverProfile) return;
    updateDriverProfile({ isOnline: !driverProfile.isOnline });
  };

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

  const isVerified = driverProfile?.verificationStatus === 'verified';
  const isOnline = !!driverProfile?.isOnline;
  const currentIncoming = driverAvailableRides[0];

  return (
    <div className="relative w-full h-[calc(100dvh-56px)] min-h-[420px] overflow-hidden bg-[#FFFFFF]">
      {/* Full Bleed Map Canvas */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapCanvas
          pickupLocation={activeRide?.pickupLocation || currentIncoming?.pickupLocation || null}
          destinationLocation={activeRide?.destinationLocation || currentIncoming?.destinationLocation || null}
          driverLocation={activeRide?.driverLocation || { lat: driverProfile?.currentLat || 22.5726, lng: driverProfile?.currentLng || 88.3639 }}
          routeCoordinates={activeRide?.status === 'ride_active' ? DEMO_ROUTE_COORDINATES : undefined}
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

      {/* ACTIVE TRIP IN PROGRESS (Floating bottom-center card) */}
      {activeRide && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[480px] max-w-lg z-30 max-h-[82vh] overflow-y-auto bg-[#FFFFFF] border border-[#E4E4E4] rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3.5">
          <div>
            <span className="text-[11px] font-medium text-[#757575] uppercase tracking-wider block">
              Active trip
            </span>
            <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#0E0E0E] leading-tight mt-0.5">
              {activeRide.status === 'driver_assigned' && 'Head to pickup location'}
              {activeRide.status === 'driver_en_route' && 'Driving to owner'}
              {activeRide.status === 'driver_arrived' && 'Arrived at owner’s vehicle'}
              {activeRide.status === 'ride_active' && 'Trip currently running'}
            </h2>
          </div>

          {/* Owner & Car Details */}
          <div className="bg-[#F6F6F6] rounded-[10px] p-3 space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-0.5 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Owner</span>
              <span className="font-semibold text-[#0E0E0E]">{activeRide.ownerName}</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Contact</span>
              <a
                href={`tel:${activeRide.ownerPhone}`}
                className="font-semibold text-[#0E0E0E] underline flex items-center gap-1"
              >
                <IconPhone size={13} />
                <span>+91 {activeRide.ownerPhone}</span>
              </a>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Vehicle</span>
              <span className="font-semibold text-[#0E0E0E]">
                {activeRide.vehicleInfo.make} {activeRide.vehicleInfo.model}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Registration</span>
              <span className="font-semibold text-[#0E0E0E]">
                {activeRide.vehicleInfo.registrationNumber}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#757575]">Transmission</span>
              <span className="font-semibold text-[#0E0E0E] capitalize">
                {activeRide.vehicleInfo.transmission}
              </span>
            </div>
          </div>

          {/* Pickup Location & Directions */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-[#757575] block">
              Pickup address
            </span>
            <p className="text-xs sm:text-sm font-medium text-[#0E0E0E]">
              {activeRide.pickupLocation.address}
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeRide.pickupLocation.lat},${activeRide.pickupLocation.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full gap-2 text-xs sm:text-sm h-10 min-h-[40px]"
            >
              <IconRoute size={15} />
              <span>Open in Google Maps</span>
            </a>
          </div>

          {/* Action State Buttons */}
          {activeRide.status === 'driver_assigned' && (
            <button
              type="button"
              onClick={() => driverMarkEnRoute(activeRide.id)}
              className="btn-primary w-full h-11 text-xs sm:text-sm"
            >
              Start driving to pickup
            </button>
          )}

          {activeRide.status === 'driver_en_route' && (
            <button
              type="button"
              onClick={() => driverMarkArrived(activeRide.id)}
              className="btn-primary w-full h-11 text-xs sm:text-sm"
            >
              Mark arrived
            </button>
          )}

          {/* 4-Digit Start Code input on arrival */}
          {activeRide.status === 'driver_arrived' && (
            <form onSubmit={handleVerifyOtpAndStart} className="space-y-3 pt-1">
              <div>
                <label className="text-xs sm:text-sm font-semibold text-[#0E0E0E] block">
                  Enter 4-digit start code
                </label>
                <p className="text-[11px] text-[#757575] mb-2">
                  Ask {activeRide.ownerName} for the 4-digit token on their screen.
                </p>

                <div className="flex justify-between gap-2 max-w-[240px] mx-auto">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 rounded-[8px] bg-[#F6F6F6] border border-[#E4E4E4] flex items-center justify-center font-code-mono text-xl font-semibold text-[#0E0E0E]"
                    >
                      {enteredOtp[idx] || ''}
                    </div>
                  ))}
                </div>

                <input
                  type="text"
                  maxLength={4}
                  value={enteredOtp}
                  onChange={(e) => {
                    setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''));
                    setOtpError('');
                  }}
                  autoFocus
                  placeholder="Type 4 digits"
                  className="w-full mt-2.5 px-3 py-2 text-xs sm:text-sm rounded-[8px] border border-[#E4E4E4] bg-[#F6F6F6] text-[#0E0E0E] text-center font-code-mono"
                />
                {otpError && (
                  <p className="text-xs text-[#C8321E] mt-1 font-medium text-center">{otpError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={enteredOtp.length !== 4}
                className="btn-primary w-full h-11 text-xs sm:text-sm"
              >
                Verify & Start Trip
              </button>
            </form>
          )}

          {activeRide.status === 'ride_active' && (
            <button
              type="button"
              onClick={() => driverEndTrip(activeRide.id)}
              className="btn-primary w-full h-11 text-xs sm:text-sm"
            >
              End trip & Collect fare
            </button>
          )}
        </div>
      )}

      {/* INCOMING REQUEST (Floating bottom-center card) */}
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
                {formatRupee(Math.round(currentIncoming.fareEstimate.totalFare * 0.85))}
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
                  // Decline
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
                {accepting ? 'Assigning...' : 'Accept'}
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
    </div>
  );
};
