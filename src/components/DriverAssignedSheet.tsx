import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Ride } from '../types';
import { IconCheck, IconPhone, IconMessage, IconStar } from './Icons';
import { CancelRideModal } from './CancelRideModal';

export const DriverAssignedSheet: React.FC<{ ride: Ride }> = ({ ride }) => {
  const { cancelRide } = useApp();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleConfirmCancel = (reason: string) => {
    cancelRide(ride.id, 'owner', reason);
    setShowCancelModal(false);
  };

  const isArrived = ride.ride_status === 'arrived' || ride.status === 'driver_arrived';
  const startOtp = ride.start_otp || ride.otp || '----';

  // 3-step status rail
  const steps = [
    { id: 'en_route', label: 'En Route', active: !isArrived },
    { id: 'arrived', label: 'Driver Arrived', active: isArrived },
    { id: 'in_progress', label: 'In Progress', active: false },
  ];
  const activeIndex = isArrived ? 1 : 0;

  return (
    <>
      <div className="bg-[#FFFFFF] p-3.5 sm:p-5 space-y-3.5 select-none">
        {/* Slim 4-step status rail */}
        <div className="flex items-center justify-between border-b border-[#E4E4E4] pb-2.5">
          {steps.map((step, idx) => {
            const isCurrent = idx === activeIndex;
            const isPassed = idx < activeIndex;

            return (
              <div key={step.id} className="flex-1 flex flex-col items-center relative">
                {/* Connector line */}
                {idx > 0 && (
                  <div
                    className={`absolute top-1.5 right-1/2 w-full h-[1.5px] -z-0 ${
                      isPassed || isCurrent ? 'bg-[#0E0E0E]' : 'bg-[#E4E4E4]'
                    }`}
                  />
                )}

                {/* Step indicator dot */}
                <div
                  className={`w-3 h-3 rounded-full flex items-center justify-center z-10 ${
                    isCurrent
                      ? 'bg-[#0E0E0E]'
                      : isPassed
                      ? 'bg-[#0E0E0E]'
                      : 'bg-[#E4E4E4]'
                  }`}
                >
                  {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-[#F2B705]" />}
                </div>

                <span
                  className={`text-[10px] sm:text-[11px] mt-1 text-center truncate ${
                    isCurrent ? 'font-semibold text-[#0E0E0E]' : 'text-[#757575]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ETA and Driver Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={
                ride.driverPhoto ||
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
              }
              alt={ride.driverName || 'Driver'}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-[#E4E4E4]"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm sm:text-base font-semibold text-[#0E0E0E]">
                  {ride.driverName || 'Verified Driver'}
                </h4>
                <span className="inline-flex items-center gap-0.5 bg-[#F6F6F6] text-[#0E0E0E] border border-[#E4E4E4] text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                  <IconCheck size={10} strokeWidth={2} />
                  <span>Verified</span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#757575] mt-0.5">
                <span className="flex items-center gap-0.5 text-[#0E0E0E] font-medium">
                  <IconStar size={11} className="text-[#F2B705] fill-[#F2B705]" />
                  {ride.driverRating ?? 4.9}
                </span>
                <span>•</span>
                <span className="font-tabular">{ride.driverTripsCount ?? 142} trips</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#757575] block">Arrival</span>
            <span className="text-[18px] sm:text-[22px] font-semibold text-[#0E0E0E] font-tabular leading-tight">
              {isArrived ? 'Arrived' : `${ride.etaMinutes ?? 6}m`}
            </span>
          </div>
        </div>

        {/* Call and Message secondary buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={ride.driverPhone ? `tel:${ride.driverPhone}` : '#'}
            className="btn-secondary w-full gap-1.5 text-xs h-9 min-h-[36px]"
          >
            <IconPhone size={14} />
            <span>Call driver</span>
          </a>
          <a
            href={`sms:${ride.driverPhone || ''}`}
            className="btn-secondary w-full gap-1.5 text-xs h-9 min-h-[36px]"
          >
            <IconMessage size={14} />
            <span>Message</span>
          </a>
        </div>

        {/* Prominently displayed Start OTP Card */}
        <div className="p-3 bg-[#F6F6F6] rounded-xl border border-[#E4E4E4] space-y-1.5 text-center">
          <div className="flex items-center justify-between text-left">
            <span className="text-[11px] font-bold text-[#0E0E0E] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0F7B5F]" />
              Trip Start Code (4-Digit OTP)
            </span>
            <span className="text-[10px] text-[#757575] font-medium">
              Tell this to driver
            </span>
          </div>

          <div className="flex items-center justify-center gap-2.5 py-1">
            {startOtp.slice(0, 4).split('').map((digit, idx) => (
              <div
                key={idx}
                className="w-12 h-14 rounded-[8px] bg-[#FFFFFF] border-2 border-[#0E0E0E] flex items-center justify-center font-code-mono text-2xl font-bold text-[#0E0E0E] shadow-xs"
              >
                {digit}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#757575]">
            Share this 4-digit start OTP with your driver upon arrival to begin the trip.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-[#E4E4E4]">
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="text-xs text-[#757575] hover:text-[#C8321E] transition underline cursor-pointer"
          >
            Cancel booking
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
