import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Ride } from '../types';
import { CancelRideModal } from './CancelRideModal';

export const SearchingSheet: React.FC<{ ride: Ride; nearbyCount?: number }> = ({ ride, nearbyCount }) => {
  const { cancelRide } = useApp();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleConfirmCancel = (reason: string) => {
    cancelRide(ride.id, 'owner', reason);
    setShowCancelModal(false);
  };

  return (
    <>
      <div className="bg-[#FFFFFF] p-4 sm:p-5 space-y-3.5 select-none">
        <div className="flex items-start gap-3.5">
          {/* Pulsing radar icon */}
          <div className="relative flex items-center justify-center w-10 h-10 shrink-0 mt-0.5">
            <div className="absolute w-10 h-10 rounded-full border-2 border-[#0F7B5F]/30 animate-ping" />
            <div className="w-8 h-8 rounded-full bg-[#0F7B5F]/10 border border-[#0F7B5F]/30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#0F7B5F] animate-pulse" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[16px] sm:text-[18px] font-semibold text-[#0E0E0E] leading-tight">
                Finding nearest driver
              </h3>
              <span className="text-[10px] font-bold text-[#0F7B5F] bg-[#0F7B5F]/10 px-2 py-0.5 rounded-full border border-[#0F7B5F]/20 shrink-0">
                ≤ 5 km Radius
              </span>
            </div>

            <p className="text-xs text-[#757575] mt-1 leading-normal">
              Scanning for available online drivers near <span className="font-semibold text-[#0E0E0E]">{ride.pickupLocation.area || ride.pickupLocation.address.split(',')[0]}</span>
              {nearbyCount !== undefined && nearbyCount > 0 ? (
                <span className="text-[#0F7B5F] font-semibold"> ({nearbyCount} detected within 5km)</span>
              ) : null}.
            </p>

            {ride.destinationLocation && (
              <p className="text-[11px] text-[#757575] mt-1 bg-[#F6F6F6] rounded-md px-2 py-1 border border-[#E4E4E4]">
                <span className="font-medium text-[#0E0E0E]">Route note:</span> Destination ({ride.destinationLocation.area || 'Drop-off'}) is used only for trip fare & routing.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E4E4E4]">
          <span className="text-[11px] text-[#757575]">
            Average dispatch time: ~15-30 secs
          </span>
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="text-xs sm:text-sm font-medium text-[#757575] hover:text-[#C8321E] transition underline cursor-pointer"
          >
            Cancel request
          </button>
        </div>
      </div>

      <CancelRideModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirmCancel={handleConfirmCancel}
        role="owner"
      />
    </>
  );
};
