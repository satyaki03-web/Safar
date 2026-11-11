import React, { useState } from 'react';
import { SubscriptionBooking } from '../types';
import { formatRupee, DAY_CONFIG } from '../utils/fare';
import { useApp } from '../context/AppContext';
import {
  IconPhone,
  IconClock,
  IconClose,
  IconCheck,
  IconCalendar,
  IconAlert,
} from './Icons';

interface ActiveSubscriptionCardProps {
  subscription: SubscriptionBooking;
  onCancel?: (id: string) => void;
}

export const ActiveSubscriptionCard: React.FC<ActiveSubscriptionCardProps> = ({
  subscription,
}) => {
  const { cancelSubscriptionWithProration, pauseSubscriptionDates } = useApp();

  const [showScheduleDetails, setShowScheduleDetails] = useState(false);
  const [showProratedCancelModal, setShowProratedCancelModal] = useState(false);
  const [showPauseLeaveModal, setShowPauseLeaveModal] = useState(false);
  const [cancellationResult, setCancellationResult] = useState<{
    payout: number;
    refund: number;
  } | null>(null);

  // Default estimated days driven (based on days elapsed since start, bounded 1 to workingDaysCount)
  const workingDays = Math.max(1, subscription.workingDaysCount || subscription.totalDays || 1);
  const dailyRate = subscription.perDayRate || Math.round(subscription.totalFare / workingDays);

  const initialEstimatedDays = (() => {
    try {
      const start = new Date(subscription.startDate);
      const now = new Date();
      const diffDays = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      return Math.min(diffDays, workingDays);
    } catch {
      return 2;
    }
  })();

  const [daysDriven, setDaysDriven] = useState<number>(initialEstimatedDays);
  const [cancellationReason, setCancellationReason] = useState('Plans changed / Driver not needed for some days');
  const [cancelling, setCancelling] = useState(false);

  // Pause / Leave state (select 1 to 3 upcoming dates to pause)
  const upcomingPauseCandidates = React.useMemo(() => {
    const list: string[] = [];
    const base = new Date();
    for (let i = 1; i <= 5; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const str = d.toISOString().split('T')[0];
      list.push(str);
    }
    return list;
  }, []);

  const [selectedPauseDates, setSelectedPauseDates] = useState<string[]>(
    subscription.pausedDates || []
  );
  const [pausing, setPausing] = useState(false);
  const [pauseSuccessMsg, setPauseSuccessMsg] = useState('');

  // Live Prorated Calculations
  const currentPayoutToDriver = Math.round(Math.min(daysDriven, workingDays) * dailyRate);
  const currentRefundToOwner = Math.max(0, subscription.totalFare - currentPayoutToDriver);

  const daysFormatted = subscription.selectedDays
    .map((d) => DAY_CONFIG[d]?.short || d)
    .join(', ');

  const handleConfirmProratedCancel = async () => {
    setCancelling(true);
    try {
      const res = await cancelSubscriptionWithProration(
        subscription.id,
        daysDriven,
        cancellationReason
      );
      if (res.success) {
        setCancellationResult({ payout: res.payoutToDriver, refund: res.refundToOwner });
      }
    } finally {
      setCancelling(false);
    }
  };

  const handleTogglePauseDate = (dateStr: string) => {
    if (selectedPauseDates.includes(dateStr)) {
      setSelectedPauseDates((prev) => prev.filter((d) => d !== dateStr));
    } else {
      if (selectedPauseDates.length >= 3) {
        alert('You can pause up to 3 days at a time.');
        return;
      }
      setSelectedPauseDates((prev) => [...prev, dateStr]);
    }
  };

  const handleSavePausedDates = async () => {
    setPausing(true);
    try {
      const res = await pauseSubscriptionDates(subscription.id, selectedPauseDates);
      if (res.success) {
        setPauseSuccessMsg(`Leave updated: ₹${res.creditAmount} credited for paused days.`);
        setTimeout(() => {
          setPauseSuccessMsg('');
          setShowPauseLeaveModal(false);
        }, 2500);
      }
    } finally {
      setPausing(false);
    }
  };

  const isCancelled = subscription.status === 'cancelled';

  return (
    <>
      <div className="bg-[#FFFFFF] border border-[#0E0E0E] rounded-2xl shadow-floating p-3.5 sm:p-4 space-y-3">
        {/* Top Tag & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isCancelled ? 'bg-[#DC2626]' : 'bg-[#0F7B5F] animate-pulse'
              }`}
            />
            <span className="text-xs font-bold text-[#0E0E0E] uppercase tracking-wide">
              {subscription.planType === 'month' ? 'Monthly Chauffeur Contract' : 'Weekly Driver Pass'}
            </span>
          </div>
          {isCancelled ? (
            <span className="text-[11px] font-semibold text-[#DC2626] bg-[#DC2626]/10 px-2 py-0.5 rounded-full border border-[#DC2626]/20">
              Cancelled • Settled
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-[#0F7B5F] bg-[#0F7B5F]/10 px-2 py-0.5 rounded-full border border-[#0F7B5F]/20">
              Active • {subscription.workingDaysCount} Days
            </span>
          )}
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
                Dedicated chauffeur • ₹{dailyRate}/day rate
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

        {/* Paused Days Notice if active */}
        {subscription.pausedDates && subscription.pausedDates.length > 0 && !isCancelled && (
          <div className="p-2 bg-[#F2B705]/15 border border-[#F2B705]/40 rounded-lg text-xs flex items-center justify-between">
            <span className="text-[#0E0E0E] font-medium">
              ⏸️ {subscription.pausedDates.length} days paused ({subscription.pausedDates.join(', ')})
            </span>
            <span className="text-[11px] font-bold text-[#0E0E0E]">
              ₹{subscription.pausedDates.length * dailyRate} credited
            </span>
          </div>
        )}

        {/* Schedule & Timing Specs */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-[#F6F6F6] rounded-lg border border-[#E4E4E4]">
            <span className="text-[10px] text-[#757575] uppercase block font-semibold">
              Duty Schedule
            </span>
            <span className="font-semibold text-[#0E0E0E] block mt-0.5 truncate">
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
        <div className="space-y-2 pt-1.5 border-t border-[#E4E4E4]">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowScheduleDetails(true)}
              className="btn-secondary w-full h-10 text-xs font-semibold cursor-pointer"
            >
              Contract Pass
            </button>
            {!isCancelled ? (
              <button
                type="button"
                onClick={() => setShowPauseLeaveModal(true)}
                className="btn-secondary w-full h-10 text-xs font-semibold cursor-pointer gap-1.5"
              >
                <IconCalendar size={13} />
                <span>Pause 1-3 Days</span>
              </button>
            ) : (
              <div className="w-full text-center py-2 text-xs font-bold text-[#DC2626] bg-[#FEE2E2] rounded-xl border border-[#FCA5A5]">
                Settled: ₹{subscription.refundToOwner || 0} Refunded
              </div>
            )}
          </div>

          {!isCancelled && (
            <button
              type="button"
              onClick={() => setShowProratedCancelModal(true)}
              className="w-full h-9.5 rounded-xl border border-[#DC2626] text-[#DC2626] hover:bg-[#FEE2E2]/60 text-xs font-semibold flex items-center justify-center transition cursor-pointer"
            >
              Cancel Contract & Request Refund
            </button>
          )}
        </div>
      </div>

      {/* Contract Pass & Settlement Details Modal */}
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

              {/* Settlement status if already cancelled */}
              {isCancelled && (
                <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl space-y-1.5">
                  <span className="text-xs font-bold text-[#991B1B] block">
                    Contract Cancelled & Settled
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#991B1B]">
                    <div>Days Driven: <strong>{subscription.daysUsed || 0} days</strong></div>
                    <div>Daily Rate: <strong>₹{dailyRate}</strong></div>
                    <div>Driver Payout: <strong>₹{subscription.payoutToDriver || 0}</strong></div>
                    <div>Owner Refund: <strong>₹{subscription.refundToOwner || 0}</strong></div>
                  </div>
                </div>
              )}

              {/* Contract Specs */}
              <div className="space-y-2 border-t border-b border-[#E4E4E4] py-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#757575]">Duration</span>
                  <span className="font-semibold text-[#0E0E0E]">
                    {subscription.startDate} to {subscription.endDate} ({workingDays} duty days)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Daily Rate</span>
                  <span className="font-semibold text-[#0E0E0E]">
                    ₹{dailyRate} / day ({subscription.dailyDutyHours} hrs/shift)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Duty Days</span>
                  <span className="font-semibold text-[#0E0E0E]">
                    {subscription.selectedDays.map((d) => DAY_CONFIG[d]?.label).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Vehicle</span>
                  <span className="font-semibold text-[#0E0E0E]">
                    {subscription.vehicleInfo.make} {subscription.vehicleInfo.model} ({subscription.vehicleInfo.registrationNumber})
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-[#E4E4E4]">
                  <span className="text-[#757575]">Total Contract Value</span>
                  <span className="text-base font-bold text-[#0E0E0E] font-tabular">
                    {formatRupee(subscription.totalFare)}
                  </span>
                </div>
              </div>

              {/* Flexible Controls */}
              {!isCancelled && (
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowScheduleDetails(false);
                      setShowPauseLeaveModal(true);
                    }}
                    className="btn-secondary w-full h-11 text-xs font-semibold gap-2 cursor-pointer"
                  >
                    <IconCalendar size={15} />
                    <span>Pause / Take 1-3 Days Off</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowScheduleDetails(false);
                      setShowProratedCancelModal(true);
                    }}
                    className="w-full h-11 rounded-full border border-[#DC2626] text-[#DC2626] hover:bg-[#FEE2E2]/60 text-xs font-semibold flex items-center justify-center transition cursor-pointer"
                  >
                    Cancel Contract with Prorated Refund
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAUSE / LEAVE MODAL (Driver or Owner taking 1-3 days off) */}
      {showPauseLeaveModal && (
        <div className="fixed inset-0 z-[2100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 select-none">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#FFFFFF] border-t sm:border border-[#E4E4E4] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-safe">
            <div className="p-4 border-b border-[#E4E4E4] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-[#0E0E0E] font-display">
                  Pause Contract / Driver Leave
                </h3>
                <span className="text-xs text-[#757575]">
                  Skip 1 to 3 days. Daily rate is refunded / credited.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPauseLeaveModal(false)}
                className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] flex items-center justify-center transition cursor-pointer"
              >
                <IconClose size={16} />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto">
              <div className="p-3 bg-[#F6F6F6] rounded-xl border border-[#E4E4E4] space-y-1">
                <span className="text-xs font-semibold text-[#0E0E0E] block">
                  Flexible Leave Policy
                </span>
                <p className="text-[11px] text-[#757575] leading-relaxed">
                  If the chauffeur or car owner needs 2–3 days off, select the duty dates below. You are credited <strong>₹{dailyRate}/day</strong> for every skipped day.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0E0E0E] block">
                  Select Days to Pause (Up to 3 Days):
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {upcomingPauseCandidates.map((dateStr) => {
                    const isSelected = selectedPauseDates.includes(dateStr);
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => handleTogglePauseDate(dateStr)}
                        className={`p-3 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#0E0E0E] text-[#FFFFFF] border-[#0E0E0E]'
                            : 'bg-[#FFFFFF] text-[#0E0E0E] border-[#E4E4E4] hover:border-[#0E0E0E]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                              isSelected
                                ? 'border-[#F2B705] bg-[#F2B705] text-[#0E0E0E] font-bold'
                                : 'border-[#757575]'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                          <span className="font-semibold text-xs">{dateStr}</span>
                        </div>
                        <span className="text-xs font-medium">
                          {isSelected ? `- ₹${dailyRate} Credited` : `Pause (₹${dailyRate})`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Total Credit calculation */}
              <div className="p-3 bg-[#0F7B5F]/10 border border-[#0F7B5F]/20 rounded-xl flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0F7B5F]">
                  Total Credit for {selectedPauseDates.length} Days:
                </span>
                <span className="text-sm font-bold text-[#0F7B5F]">
                  ₹{selectedPauseDates.length * dailyRate}
                </span>
              </div>

              {pauseSuccessMsg && (
                <div className="p-3 bg-[#0F7B5F] text-[#FFFFFF] rounded-xl text-xs font-semibold text-center animate-fade-in">
                  {pauseSuccessMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPauseLeaveModal(false)}
                  className="btn-secondary h-11 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePausedDates}
                  disabled={pausing}
                  className="btn-primary h-11 text-xs font-semibold"
                >
                  {pausing ? 'Saving...' : 'Save Leave'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRORATED CANCELLATION MODAL */}
      {showProratedCancelModal && (
        <div className="fixed inset-0 z-[2100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 select-none">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#FFFFFF] border-t sm:border border-[#E4E4E4] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-safe">
            <div className="p-4 border-b border-[#E4E4E4] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-[#0E0E0E] font-display">
                  Prorated Contract Cancellation
                </h3>
                <span className="text-xs text-[#757575]">
                  Driver is paid for days driven; owner is refunded the remainder.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProratedCancelModal(false);
                  setCancellationResult(null);
                }}
                className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] flex items-center justify-center transition cursor-pointer"
              >
                <IconClose size={16} />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto">
              {!cancellationResult ? (
                <>
                  {/* Explanatory banner */}
                  <div className="p-3 bg-[#F6F6F6] rounded-xl border border-[#E4E4E4] space-y-1">
                    <span className="font-semibold text-[#0E0E0E] block">
                      Fair Proration Guarantee
                    </span>
                    <p className="text-[11px] text-[#757575] leading-relaxed">
                      If the chauffeur or owner cancels mid-contract (e.g. after 2-3 days of driving), payment is calculated strictly for the days driven. The unused balance is refunded directly to the car owner.
                    </p>
                  </div>

                  {/* Days Driven Stepper / Slider */}
                  <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#0E0E0E] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0E0E0E] text-xs">
                        Days Chauffeur Drove:
                      </span>
                      <span className="text-sm font-extrabold text-[#0E0E0E] bg-[#F6F6F6] px-2.5 py-0.5 rounded-md border border-[#E4E4E4]">
                        {daysDriven} of {workingDays} days
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={workingDays}
                      value={daysDriven}
                      onChange={(e) => setDaysDriven(Number(e.target.value))}
                      className="w-full accent-[#0E0E0E] cursor-pointer"
                    />

                    <div className="flex justify-between text-[10px] text-[#757575]">
                      <span>0 days (Full refund)</span>
                      <span>Halfway ({Math.round(workingDays / 2)} d)</span>
                      <span>{workingDays} days (Full duty)</span>
                    </div>
                  </div>

                  {/* Financial Settlement Breakdown */}
                  <div className="p-3 bg-[#F6F6F6] rounded-xl border border-[#E4E4E4] space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#757575] block">
                      Settlement Calculation
                    </span>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#757575]">Total Contract Fare:</span>
                        <span className="font-semibold text-[#0E0E0E]">
                          {formatRupee(subscription.totalFare)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#757575]">Per Day Chauffeur Rate:</span>
                        <span className="font-semibold text-[#0E0E0E]">
                          ₹{dailyRate} / day
                        </span>
                      </div>
                      <div className="flex justify-between text-[#0E0E0E] font-semibold pt-1 border-t border-[#E4E4E4]">
                        <span>Chauffeur Payout ({daysDriven} days worked):</span>
                        <span className="text-[#0E0E0E] font-bold">
                          {formatRupee(currentPayoutToDriver)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#0F7B5F] font-bold pt-1 border-t border-[#E4E4E4]">
                        <span>Owner Refund Amount (Remainder):</span>
                        <span className="text-sm font-extrabold text-[#0F7B5F]">
                          {formatRupee(currentRefundToOwner)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Reason */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#0E0E0E]">
                      Reason for cancellation:
                    </label>
                    <select
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E4E4E4] bg-[#FFFFFF] text-[#0E0E0E] outline-none"
                    >
                      <option value="Plans changed / Driver not needed for some days">
                        Plans changed / Driver not needed for some days
                      </option>
                      <option value="Driver took 2-3 days leave / unavailable">
                        Driver took 2-3 days leave / unavailable
                      </option>
                      <option value="Vehicle in service or repair">
                        Vehicle in service or repair
                      </option>
                      <option value="Switched to on-demand hourly booking">
                        Switched to on-demand hourly booking
                      </option>
                      <option value="Mutual agreement between driver and owner">
                        Mutual agreement between driver and owner
                      </option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowProratedCancelModal(false)}
                      className="btn-secondary h-11 text-xs"
                    >
                      Keep Contract
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmProratedCancel}
                      disabled={cancelling}
                      className="h-11 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFFFF] text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-xs"
                    >
                      {cancelling ? 'Processing...' : `Confirm & Refund ${formatRupee(currentRefundToOwner)}`}
                    </button>
                  </div>
                </>
              ) : (
                /* Success Receipt */
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#0F7B5F]/15 border-2 border-[#0F7B5F] text-[#0F7B5F] flex items-center justify-center mx-auto">
                    <IconCheck size={28} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#0E0E0E]">
                      Contract Successfully Cancelled
                    </h4>
                    <p className="text-xs text-[#757575] mt-1">
                      Prorated settlement recorded in Firestore ledger.
                    </p>
                  </div>

                  <div className="p-4 bg-[#F6F6F6] rounded-xl border border-[#E4E4E4] text-xs space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Days Driven:</span>
                      <span className="font-bold text-[#0E0E0E]">{daysDriven} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Driver Paid:</span>
                      <span className="font-bold text-[#0E0E0E]">{formatRupee(cancellationResult.payout)}</span>
                    </div>
                    <div className="flex justify-between text-[#0F7B5F] font-bold border-t border-[#E4E4E4] pt-2">
                      <span>Owner Refunded:</span>
                      <span className="text-sm font-extrabold">{formatRupee(cancellationResult.refund)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProratedCancelModal(false);
                      setShowScheduleDetails(false);
                      setCancellationResult(null);
                    }}
                    className="btn-primary w-full h-11 text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
