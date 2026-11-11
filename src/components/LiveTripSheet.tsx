import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Ride } from '../types';
import { formatRupee } from '../utils/fare';
import { IconShare, IconAlert } from './Icons';

interface LiveTripSheetProps {
  ride: Ride;
  onOpenSOS: () => void;
}

export const LiveTripSheet: React.FC<LiveTripSheetProps> = ({ ride, onOpenSOS }) => {
  const { driverEndTrip } = useApp();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const startTime = ride.startedAt ? new Date(ride.startedAt).getTime() : Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [ride.startedAt]);

  const formatTimer = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleShareTrip = () => {
    const shareUrl = `${window.location.origin}?track=${ride.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="bg-[#FFFFFF] p-3.5 sm:p-5 space-y-3.5 select-none">
      {/* Top Header: Title & SOS button */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <span className="text-[11px] font-medium text-[#757575] uppercase tracking-wider block">
            Trip in progress
          </span>
          <span className="text-xs sm:text-sm font-semibold text-[#0E0E0E] truncate block">
            {ride.driverName} is driving your {ride.vehicleInfo.make}
          </span>
        </div>

        {/* SOS is the only red element */}
        <button
          type="button"
          onClick={onOpenSOS}
          className="h-8 sm:h-9 px-3 rounded-full bg-[#C8321E] text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition active:opacity-90 cursor-pointer shrink-0"
        >
          <IconAlert size={13} />
          <span>SOS</span>
        </button>
      </div>

      {/* Metrics: Elapsed Time and Running Fare */}
      <div className="grid grid-cols-2 gap-3 py-2 border-t border-b border-[#E4E4E4]">
        <div>
          <span className="text-[10px] text-[#757575] block">Elapsed time</span>
          <span className="text-[20px] sm:text-[24px] font-semibold text-[#0E0E0E] font-tabular leading-tight block">
            {formatTimer(elapsedSeconds)}
          </span>
          <span className="text-[10px] text-[#757575] block mt-0.5">
            Booked for {ride.durationHours}h
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#757575] block">Running fare</span>
          <span className="text-[20px] sm:text-[24px] font-semibold text-[#0E0E0E] font-tabular leading-tight block">
            {formatRupee(ride.fareEstimate?.totalFare || 350)}
          </span>
          <span className="text-[10px] text-[#757575] block mt-0.5">
            Fixed hourly
          </span>
        </div>
      </div>

      {/* 4-Digit End OTP Display (Prominently displayed so owner can tell driver upon reaching destination) */}
      <div className="p-3 bg-[#F6F6F6] rounded-xl border border-[#E4E4E4] space-y-1.5 text-center">
        <div className="flex items-center justify-between text-left">
          <span className="text-[11px] font-bold text-[#0E0E0E] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0F7B5F]" />
            Trip Completion Code (End OTP)
          </span>
          <span className="text-[10px] text-[#757575] font-medium">
            Share at destination
          </span>
        </div>

        <div className="flex items-center justify-center gap-2.5 py-1">
          {(ride.end_otp || '----').slice(0, 4).split('').map((digit, idx) => (
            <div
              key={idx}
              className="w-12 h-14 rounded-[8px] bg-[#FFFFFF] border-2 border-[#0E0E0E] flex items-center justify-center font-code-mono text-2xl font-bold text-[#0E0E0E] shadow-xs"
            >
              {digit}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#757575]">
          Share this 4-digit completion code with your driver once you reach your destination to finish the trip.
        </p>
      </div>

      {/* Action: Share Live Trip */}
      <div>
        <button
          type="button"
          onClick={handleShareTrip}
          className="btn-secondary w-full gap-2 text-xs h-10 min-h-[40px]"
        >
          <IconShare size={14} />
          <span>{copied ? 'Live tracking link copied' : 'Share live trip with family'}</span>
        </button>
      </div>
    </div>
  );
};
