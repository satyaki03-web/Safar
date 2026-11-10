import React, { useState } from 'react';
import { SubscriptionBooking } from '../types';
import { formatRupee, DAY_CONFIG } from '../utils/fare';
import {
  IconPhone,
  IconCarSide,
  IconPin,
  IconClock,
  IconClose,
  IconCheck,
} from './Icons';

interface ActiveSubscriptionCardProps {
  subscription: SubscriptionBooking;
  onCancel: (id: string) => void;
}

export const ActiveSubscriptionCard: React.FC<ActiveSubscriptionCardProps> = ({
  subscription,
  onCancel,
}) => {
  const [showScheduleDetails, setShowScheduleDetails] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const daysFormatted = subscription.selectedDays
    .map((d) => DAY_CONFIG[d]?.short || d)
    .join(', ');

  return (
    <>
      <div className="bg-[#FFFFFF] border border-[#0E0E0E] rounded-2xl shadow-floating p-3.5 sm:p-4 space-y-3">
        {/* Top Tag & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F7B5F] animate-pulse" />
            <span className="text-xs font-bold text-[#0E0E0E] uppercase tracking-wide">
              {subscription.planType === 'month' ? 'Monthly Chauffeur Contract' : 'Weekly Driver Pass'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#0F7B5F] bg-[#0F7B5F]/10 px-2 py-0.5 rounded-full border border-[#0F7B5F]/20">
            Active • {subscription.workingDaysCount} Days
          </span>
        </div>

        {/* Driver Profile Row */}
        <div className="flex items-center justify-between p-2.5 bg-[#F6F6F6] rounded-xl border border-[#E4E4E4]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#0E0E0E] text-[#F2B705] font-bold text-sm flex items-center justify-center shrink-0 border-2 border-[#FFFFFF] shadow-sm overflow-hidden">
              {subscription.driverPhoto ? (
                <img
                  src={subscription.driverPhoto}
                  alt={subscription.driverName}
                  className="w-full h-full object-cover"
                />
              ) : (
                'SD'
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-[#0E0E0E] truncate">
                  {subscription.driverName}
                </span>
                <span className="text-[11px] font-semibold text-[#0E0E0E] flex items-center gap-0.5">
                  <span className="text-[#F2B705]">★</span>
                  <span>{subscription.driverRating.toFixed(2)}</span>
                </span>
              </div>
              <span className="text-[11px] text-[#757575] block mt-0.5">
                Dedicated driver • {subscription.driverExperienceYears} yrs experience
              </span>
            </div>
          </div>

          <a
            href={`tel:${subscription.driverPhone}`}
            className="w-9 h-9 rounded-full bg-[#0E0E0E] text-[#FFFFFF] flex items-center justify-center hover:bg-[#262626] transition active:scale-95 shrink-0 shadow-xs"
            title="Call dedicated driver"
          >
            <IconPhone size={15} />
          </a>
        </div>

        {/* Schedule & Timing Specs */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-[#F6F6F6] rounded-lg border border-[#E4E4E4]">
            <span className="text-[10px] text-[#757575] uppercase block font-semibold">
              Duty Schedule
            </span>
            <span className="font-semibold text-[#0E0E0E] block mt-0.5">
              {daysFormatted}
            </span>
            <span className="text-[10px] text-[#757575] block">
              Reports @ {subscription.dailyStartTime}
            </span>
          </div>

          <div className="p-2 bg-[#F6F6F6] rounded-lg border border-[#E4E4E4]">
            <span className="text-[10px] text-[#757575] uppercase block font-semibold">
              Daily Duty Hours
            </span>
            <span className="font-semibold text-[#0E0E0E] block mt-0.5 font-tabular">
              {subscription.dailyDutyHours} hrs / day
            </span>
            <span className="text-[10px] text-[#757575] block truncate">
              {subscription.vehicleInfo.make} {subscription.vehicleInfo.model}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#E4E4E4]">
          <button
            type="button"
            onClick={() => setShowScheduleDetails(true)}
            className="btn-secondary flex-1 h-10 text-xs font-semibold cursor-pointer"
          >
            View Contract Pass
          </button>
          <a
            href={`tel:${subscription.driverPhone}`}
            className="btn-primary flex-1 h-10 text-xs font-semibold gap-1.5"
          >
            <IconPhone size={13} />
            <span>Call Driver</span>
          </a>
        </div>
      </div>

      {/* Schedule Pass Modal */}
      {showScheduleDetails && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4 select-none">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#FFFFFF] border-t sm:border border-[#E4E4E4] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-safe">
            <div className="w-10 h-1 bg-[#E4E4E4] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

            <div className="p-4 border-b border-[#E4E4E4] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#0E0E0E] font-display">
                  Recurring Chauffeur Contract
                </h3>
                <span className="text-xs text-[#757575]">
                  Pass ID: {subscription.id.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleDetails(false)}
                className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] flex items-center justify-center transition cursor-pointer"
              >
                <IconClose size={16} />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Driver Card */}
              <div className="p-3 bg-[#F6F6F6] rounded-xl border border-[#E4E4E4] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#757575] block">
                    Assigned Primary Chauffeur
                  </span>
                  <span className="text-sm font-bold text-[#0E0E0E] block mt-0.5">
                    {subscription.driverName}
                  </span>
                  <span className="text-xs text-[#757575] block">
                    Commercial DL Verified • Rating {subscription.driverRating.toFixed(2)} ★
                  </span>
                </div>
                <a
                  href={`tel:${subscription.driverPhone}`}
                  className="px-3 py-1.5 bg-[#0E0E0E] text-[#FFFFFF] rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <IconPhone size={12} />
                  <span>Call</span>
                </a>
              </div>

              {/* Contract Summary */}
              <div className="space-y-2 border-t border-b border-[#E4E4E4] py-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#757575]">Duration</span>
                  <span className="font-semibold text-[#0E0E0E]">
                    {subscription.startDate} to {subscription.endDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Duty Days</span>
                  <span className="font-semibold text-[#0E0E0E]">
                    {subscription.selectedDays.map((d) => DAY_CONFIG[d]?.label).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Daily Shift</span>
                  <span className="font-semibold text-[#0E0E0E]">
                    {subscription.dailyStartTime} ({subscription.dailyDutyHours} hrs/day)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Designated Vehicle</span>
                  <span className="font-semibold text-[#0E0E0E]">
                    {subscription.vehicleInfo.make} {subscription.vehicleInfo.model} ({subscription.vehicleInfo.registrationNumber})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Reporting Address</span>
                  <span className="font-semibold text-[#0E0E0E] text-right max-w-[200px] truncate">
                    {subscription.pickupLocation.address}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-[#E4E4E4]">
                  <span className="text-[#757575]">Total Paid</span>
                  <span className="text-base font-bold text-[#0E0E0E] font-tabular">
                    {formatRupee(subscription.totalFare)}
                  </span>
                </div>
              </div>

              {/* Backup & Replacement Guarantee */}
              <div className="p-3 bg-[#0F7B5F]/10 border border-[#0F7B5F]/20 rounded-xl space-y-1">
                <span className="text-xs font-bold text-[#0F7B5F] block flex items-center gap-1.5">
                  <IconCheck size={14} />
                  <span>Safar Replacement Guarantee Active</span>
                </span>
                <p className="text-[11px] text-[#0F7B5F]/90 leading-relaxed">
                  If {subscription.driverName.split(' ')[0]} is unavailable or on medical leave, Safar dispatches an equally rated verified chauffeur automatically at no extra cost.
                </p>
              </div>

              {/* Danger Zone: Cancel */}
              <div className="pt-2">
                {showCancelConfirm ? (
                  <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] space-y-2">
                    <p className="text-xs text-[#991B1B] font-semibold">
                      Are you sure you want to cancel this recurring driver contract?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        className="py-1.5 bg-[#FFFFFF] rounded-lg text-xs font-medium text-[#0E0E0E] border border-[#E4E4E4]"
                      >
                        Keep contract
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onCancel(subscription.id);
                          setShowScheduleDetails(false);
                        }}
                        className="py-1.5 bg-[#DC2626] rounded-lg text-xs font-semibold text-[#FFFFFF]"
                      >
                        Yes, Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2]/50 rounded-lg transition cursor-pointer"
                  >
                    Cancel Chauffeur Subscription
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
