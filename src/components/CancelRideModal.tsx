import React, { useState } from 'react';
import { IconAlert, IconX } from './Icons';

interface CancelRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (reason: string) => void;
  role: 'owner' | 'driver';
}

const OWNER_REASONS = [
  'Driver taking too long / stuck in traffic',
  'Booked by mistake / Changed plans',
  'Wrong pickup location selected',
  'Unable to contact driver',
  'Other reason',
];

const DRIVER_REASONS = [
  'Client no-show / Unreachable',
  'Vehicle breakdown or emergency',
  'Pickup location unreachable or hazardous',
  'Client requested cancellation',
  'Other reason',
];

export const CancelRideModal: React.FC<CancelRideModalProps> = ({
  isOpen,
  onClose,
  onConfirmCancel,
  role,
}) => {
  const reasons = role === 'owner' ? OWNER_REASONS : DRIVER_REASONS;
  const [selectedReason, setSelectedReason] = useState<string>(reasons[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setIsSubmitting(true);
    const finalReason =
      selectedReason === 'Other reason'
        ? customReason.trim() || 'Cancelled without details'
        : selectedReason;
    
    setTimeout(() => {
      onConfirmCancel(finalReason);
      setIsSubmitting(false);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div
        className="w-full max-w-md bg-[#FFFFFF] rounded-2xl shadow-2xl border border-[#E4E4E4] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E4E4E4] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#C8321E]/10 border border-[#C8321E]/20 flex items-center justify-center shrink-0">
              <IconAlert size={18} className="text-[#C8321E]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[#0E0E0E]">
                Cancel Ride Request?
              </h3>
              <p className="text-xs text-[#757575]">
                {role === 'owner'
                  ? 'Please select a reason for cancelling this booking.'
                  : 'Let the client know why you need to cancel this trip.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#757575] hover:text-[#0E0E0E] rounded-full hover:bg-[#E4E4E4]/50 transition cursor-pointer"
            aria-label="Close modal"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Body: Reason Selection */}
        <div className="p-4 sm:p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <label className="text-xs font-semibold text-[#0E0E0E] uppercase tracking-wider block">
            Select Reason
          </label>
          <div className="space-y-2">
            {reasons.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'border-[#0E0E0E] bg-[#F6F6F6] font-medium text-[#0E0E0E]'
                      : 'border-[#E4E4E4] bg-[#FFFFFF] text-[#757575] hover:border-[#CCCCCC]'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    value={reason}
                    checked={isSelected}
                    onChange={() => setSelectedReason(reason)}
                    className="w-4 h-4 text-[#0E0E0E] focus:ring-[#0E0E0E]"
                  />
                  <span className="text-xs sm:text-sm leading-tight">{reason}</span>
                </label>
              );
            })}
          </div>

          {selectedReason === 'Other reason' && (
            <div className="pt-2">
              <label className="text-xs font-medium text-[#757575] block mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain brief reason..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-[#E4E4E4] focus:outline-hidden focus:border-[#0E0E0E] text-[#0E0E0E]"
              />
            </div>
          )}

          <p className="text-[11px] text-[#757575] bg-[#F6F6F6] p-2.5 rounded-lg border border-[#E4E4E4]/80">
            {role === 'owner'
              ? 'Note: No cancellation fees apply. Your driver will be notified immediately.'
              : 'Note: Cancelling active dispatches regularly may lower your acceptance score.'}
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E4E4E4] bg-[#FAFAFA] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-[#E4E4E4] bg-[#FFFFFF] text-[#0E0E0E] hover:bg-[#F6F6F6] transition cursor-pointer"
          >
            Keep Ride
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#C8321E] text-[#FFFFFF] hover:bg-[#B22B18] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? 'Cancelling...' : 'Yes, Cancel Ride'}
          </button>
        </div>
      </div>
    </div>
  );
};
