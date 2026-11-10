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
            {formatRupee(ride.fareEstimate.totalFare)}
          </span>
          <span className="text-[10px] text-[#757575] block mt-0.5">
            Fixed hourly
          </span>
        </div>
      </div>

      {/* Actions: Share Trip & End Trip */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleShareTrip}
          className="btn-secondary w-full gap-1.5 text-xs h-10 min-h-[40px]"
        >
          <IconShare size={14} />
          <span>{copied ? 'Link copied' : 'Share trip'}</span>
        </button>

        <button
          type="button"
          onClick={() => driverEndTrip(ride.id)}
          className="btn-primary w-full text-xs h-10 min-h-[40px]"
        >
          End trip
        </button>
      </div>
    </div>
  );
};
