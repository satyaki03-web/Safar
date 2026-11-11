import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupee, formatDateIN } from '../utils/fare';
import { IconClose } from './Icons';

interface DriverEarningsScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverEarningsScreen: React.FC<DriverEarningsScreenProps> = ({ isOpen, onClose }) => {
  const { driverProfile, rideHistory } = useApp();
  const [period, setPeriod] = useState<'today' | 'week'>('today');

  if (!isOpen) return null;

  const currentTotal = period === 'today'
    ? (driverProfile?.todayEarnings || 0)
    : (driverProfile?.weekEarnings || 0);

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#FFFFFF] border-t sm:border border-[#E4E4E4] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-safe">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-[#E4E4E4] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-[#E4E4E4] flex items-center justify-between shrink-0">
          <h3 className="text-[18px] font-semibold text-[#0E0E0E] font-display">
            Earnings
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] text-[#0E0E0E] flex items-center justify-center transition cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          {/* Segmented Control: Today / This week */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F6F6F6] border border-[#E4E4E4] rounded-[8px]">
            <button
              type="button"
              onClick={() => setPeriod('today')}
              className={`py-2 text-xs font-medium rounded-[6px] transition ${
                period === 'today'
                  ? 'bg-[#0E0E0E] text-[#FFFFFF]'
                  : 'text-[#757575] hover:text-[#0E0E0E]'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPeriod('week')}
              className={`py-2 text-xs font-medium rounded-[6px] transition ${
                period === 'week'
                  ? 'bg-[#0E0E0E] text-[#FFFFFF]'
                  : 'text-[#757575] hover:text-[#0E0E0E]'
              }`}
            >
              This week
            </button>
          </div>

          {/* Large Total */}
          <div>
            <span className="text-xs text-[#757575] block">
              {period === 'today' ? 'Earnings today' : 'Earnings this week'}
            </span>
            <span className="text-[32px] font-semibold text-[#0E0E0E] font-tabular leading-tight block mt-1">
              {formatRupee(currentTotal)}
            </span>
            <span className="text-xs text-[#757575] block mt-0.5 font-tabular">
              {driverProfile?.tripsCompleted || 0} trips
            </span>
          </div>

          {/* Plain list of trips with time, route and amount */}
          <div className="space-y-3 pt-2 border-t border-[#E4E4E4]">
            <span className="text-[12px] font-medium text-[#757575] uppercase tracking-wider block">
              Trip history
            </span>

            {rideHistory.length === 0 ? (
              <p className="text-xs text-[#757575] py-2">
                No trips completed in this period.
              </p>
            ) : (
              <div className="space-y-0 border-t border-b border-[#E4E4E4]">
                {rideHistory.map((r, idx) => {
                  const driverNet = Math.round((r.fareEstimate?.totalFare || 350) * 0.85);
                  return (
                    <div
                      key={r.id}
                      className={`py-3.5 flex items-center justify-between ${
                        idx !== rideHistory.length - 1 ? 'border-b border-[#E4E4E4]' : ''
                      }`}
                    >
                      <div>
                        <span className="text-sm font-medium text-[#0E0E0E] block">
                          {r.pickupLocation.area}
                        </span>
                        <span className="text-xs text-[#757575] block mt-0.5">
                          {formatDateIN(r.completedAt || r.createdAt)} • {r.durationHours}h drive
                        </span>
                      </div>
                      <span className="font-semibold text-sm text-[#0E0E0E] font-tabular">
                        +{formatRupee(driverNet)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E4E4E4] bg-[#FFFFFF] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary w-full text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
