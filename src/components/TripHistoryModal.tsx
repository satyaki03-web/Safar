import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Ride } from '../types';
import { formatRupee, formatDateIN } from '../utils/fare';
import { IconClose } from './Icons';
import { ReceiptRatingModal } from './ReceiptRatingModal';

interface TripHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TripHistoryModal: React.FC<TripHistoryModalProps> = ({ isOpen, onClose }) => {
  const { rideHistory } = useApp();
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4 select-none">
        <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#FFFFFF] border-t sm:border border-[#E4E4E4] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-safe">
          {/* Mobile drag handle */}
          <div className="w-10 h-1 bg-[#E4E4E4] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

          {/* Header */}
          <div className="px-5 py-3.5 sm:py-4 border-b border-[#E4E4E4] flex items-center justify-between shrink-0">
            <h3 className="text-[18px] font-semibold text-[#0E0E0E] font-display">
              Trip history
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] text-[#0E0E0E] flex items-center justify-center transition cursor-pointer"
            >
              <IconClose size={16} />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-3">
            {rideHistory.length === 0 ? (
              <p className="text-xs text-[#757575] py-4 text-center">
                No past trips yet.
              </p>
            ) : (
              <div className="space-y-0 border-t border-b border-[#E4E4E4]">
                {rideHistory.map((r, idx) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRide(r)}
                    className={`py-3.5 flex items-center justify-between cursor-pointer hover:opacity-75 transition ${
                      idx !== rideHistory.length - 1 ? 'border-b border-[#E4E4E4]' : ''
                    }`}
                  >
                    <div>
                      <span className="text-sm font-medium text-[#0E0E0E] block">
                        {r.pickupLocation.area}
                      </span>
                      <span className="text-xs text-[#757575] block mt-0.5">
                        {formatDateIN(r.completedAt || r.createdAt)} • {r.durationHours}h • {r.driverName || 'Driver'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-semibold text-sm text-[#0E0E0E] font-tabular block">
                        {formatRupee(r.fareEstimate?.totalFare || 350)}
                      </span>
                      <span className="text-xs text-[#757575] underline block mt-0.5">
                        Receipt
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedRide && (
        <ReceiptRatingModal
          ride={selectedRide}
          onDismiss={() => setSelectedRide(null)}
        />
      )}
    </>
  );
};
