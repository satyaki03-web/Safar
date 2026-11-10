import React from 'react';
import { FareBreakdown, TripType } from '../types';
import { formatRupee } from '../utils/fare';
import { IconClose } from './Icons';

interface FareBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  breakdown: FareBreakdown;
  tripType: TripType;
  pickupAddress: string;
  vehicleSummary: string;
  loading?: boolean;
}

export const FareBreakdownModal: React.FC<FareBreakdownModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  breakdown,
  tripType,
  pickupAddress,
  vehicleSummary,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#FFFFFF] border-t sm:border border-[#E4E4E4] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-safe">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-[#E4E4E4] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-[#E4E4E4] flex items-center justify-between shrink-0">
          <h3 className="text-[18px] font-semibold text-[#0E0E0E] font-display">
            Fare breakdown
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] text-[#0E0E0E] flex items-center justify-center transition cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Simple ruled rows: label left, amount right */}
        <div className="p-5 space-y-4">
          <div className="space-y-3 text-sm">
            {/* Base hourly */}
            <div className="flex items-center justify-between py-1 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">
                Base rate ({breakdown.hours} {breakdown.hours === 1 ? 'hour' : 'hours'} × ₹{breakdown.hourlyRate})
              </span>
              <span className="font-medium text-[#0E0E0E] font-tabular">
                {formatRupee(breakdown.baseFare)}
              </span>
            </div>

            {/* Night Surcharge */}
            <div className="flex items-center justify-between py-1 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Night surcharge (10 PM – 6 AM)</span>
              <span className="font-medium text-[#0E0E0E] font-tabular">
                {breakdown.nightSurcharge > 0 ? formatRupee(breakdown.nightSurcharge) : '₹0'}
              </span>
            </div>

            {/* Outstation Allowance */}
            {tripType === 'outstation' && (
              <div className="flex items-center justify-between py-1 border-b border-[#E4E4E4]">
                <span className="text-[#757575]">Outstation daily allowance</span>
                <span className="font-medium text-[#0E0E0E] font-tabular">
                  {formatRupee(breakdown.outstationAllowance)}
                </span>
              </div>
            )}

            {/* Platform & Safety */}
            <div className="flex items-center justify-between py-1 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Safety & platform</span>
              <span className="font-medium text-[#0E0E0E] font-tabular">
                {formatRupee(breakdown.platformFee)}
              </span>
            </div>

            {/* Trip Cover Coming Soon */}
            <div className="flex items-center justify-between py-1 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Trip cover</span>
              <span className="text-xs text-[#757575]">Coming soon: per-trip micro-insurance</span>
            </div>

            {/* Heavier total row */}
            <div className="flex items-baseline justify-between pt-2">
              <span className="font-semibold text-base text-[#0E0E0E]">Total</span>
              <span className="text-[24px] font-semibold text-[#0E0E0E] font-tabular">
                {formatRupee(breakdown.totalFare)}
              </span>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? 'Confirming...' : 'Confirm booking'}
          </button>
        </div>
      </div>
    </div>
  );
};
