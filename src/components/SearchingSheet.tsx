import React from 'react';
import { useApp } from '../context/AppContext';
import { Ride } from '../types';

export const SearchingSheet: React.FC<{ ride: Ride }> = ({ ride }) => {
  const { cancelRide } = useApp();

  return (
    <div className="bg-[#FFFFFF] p-4 sm:p-5 space-y-4 select-none">
      <div className="flex items-center gap-3.5">
        {/* Subtle expanding ring */}
        <div className="relative flex items-center justify-center w-9 h-9 shrink-0">
          <div className="absolute w-9 h-9 rounded-full border border-[#0E0E0E]/15 animate-ping" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#0E0E0E]" />
        </div>

        <div>
          <h3 className="text-[16px] sm:text-[18px] font-semibold text-[#0E0E0E] leading-tight">
            Finding your driver
          </h3>
          <p className="text-xs text-[#757575] mt-0.5">
            Searching near {ride.pickupLocation.area || 'your pickup'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#E4E4E4]">
        <button
          type="button"
          onClick={() => cancelRide(ride.id, 'owner')}
          className="text-xs sm:text-sm font-medium text-[#757575] hover:text-[#0E0E0E] transition underline cursor-pointer"
        >
          Cancel ride request
        </button>
      </div>
    </div>
  );
};
