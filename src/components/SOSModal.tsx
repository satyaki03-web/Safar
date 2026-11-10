import React, { useState } from 'react';
import { Ride } from '../types';
import { IconAlert, IconPhone, IconClose } from './Icons';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: Ride;
}

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose, ride }) => {
  const [dispatched, setDispatched] = useState(false);

  if (!isOpen) return null;

  const handleTriggerEmergency = () => {
    setDispatched(true);
    setTimeout(() => {
      window.location.href = 'tel:112';
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#FFFFFF] border-t sm:border border-[#E4E4E4] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-safe">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-[#E4E4E4] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-[#E4E4E4] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#C8321E] text-white flex items-center justify-center shadow-xs">
              <IconAlert size={14} />
            </div>
            <h3 className="text-[18px] font-semibold text-[#0E0E0E] font-display">
              Emergency assistance
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] text-[#0E0E0E] flex items-center justify-center transition cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          {dispatched ? (
            <div className="space-y-3 py-2 text-center">
              <span className="text-[16px] font-semibold text-[#C8321E] block">
                Emergency protocol activated
              </span>
              <p className="text-xs text-[#757575] leading-relaxed">
                Live location and vehicle details ({ride.vehicleInfo.registrationNumber}) transmitted to Emergency Services (112). Connecting line now.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[#757575] leading-relaxed">
                If you are in danger or need immediate emergency assistance, call Kolkata Police Emergency Control.
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleTriggerEmergency}
                  className="w-full h-[52px] rounded-full bg-[#C8321E] text-white text-[15px] font-medium flex items-center justify-center gap-2 transition active:opacity-90 cursor-pointer"
                >
                  <IconPhone size={18} />
                  <span>Call Emergency (112)</span>
                </button>

                <a
                  href="tel:+913322140000"
                  className="btn-secondary w-full text-xs"
                >
                  Safar Safety Helpline (24x7)
                </a>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs text-[#757575] hover:text-[#0E0E0E] underline cursor-pointer"
              >
                Go back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
