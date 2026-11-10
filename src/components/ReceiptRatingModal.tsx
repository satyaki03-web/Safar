import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Ride } from '../types';
import { formatRupee, formatDateIN } from '../utils/fare';
import { IconStar, IconClose, IconCheck } from './Icons';

interface ReceiptRatingModalProps {
  ride: Ride;
  onDismiss: () => void;
}

export const ReceiptRatingModal: React.FC<ReceiptRatingModalProps> = ({ ride, onDismiss }) => {
  const { submitPayment, submitRating } = useApp();

  const [paymentStep, setPaymentStep] = useState<'receipt' | 'paying' | 'paid'>(
    ride.paymentStatus === 'paid' ? 'paid' : 'receipt'
  );
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const quickTags = ['Smooth driving', 'Punctual', 'Polite', 'Good route choice'];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePay = async () => {
    setPaymentStep('paying');
    setTimeout(async () => {
      await submitPayment(ride.id, 'UPI');
      setPaymentStep('paid');
    }, 1000);
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalNote = [selectedTags.join(', '), note].filter(Boolean).join(' - ');
    await submitRating(ride.id, rating, finalNote);
    setRatingSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#FFFFFF] border-t sm:border border-[#E4E4E4] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-safe">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-[#E4E4E4] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-[#E4E4E4] flex items-center justify-between shrink-0">
          <div>
            <span className="font-code-mono text-[11px] text-[#757575] uppercase block">
              Trip #{ride.id.slice(-6).toUpperCase()}
            </span>
            <h3 className="text-[18px] font-semibold text-[#0E0E0E] font-display leading-tight mt-0.5">
              Trip receipt
            </h3>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] text-[#0E0E0E] flex items-center justify-center transition cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Ruled rows */}
          <div className="space-y-2.5">
            <div className="flex justify-between py-1 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Date</span>
              <span className="text-[#0E0E0E] font-medium">
                {formatDateIN(ride.completedAt || ride.createdAt)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Driver</span>
              <span className="text-[#0E0E0E] font-medium">
                {ride.driverName || 'Subhashish Das'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Vehicle</span>
              <span className="text-[#0E0E0E] font-medium">
                {ride.vehicleInfo.make} {ride.vehicleInfo.model}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Duration</span>
              <span className="text-[#0E0E0E] font-medium font-tabular">
                {ride.durationHours} {ride.durationHours === 1 ? 'hour' : 'hours'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Base fare</span>
              <span className="text-[#0E0E0E] font-medium font-tabular">
                {formatRupee(ride.fareEstimate.baseFare)}
              </span>
            </div>

            {ride.fareEstimate.nightSurcharge > 0 && (
              <div className="flex justify-between py-1 border-b border-[#E4E4E4]">
                <span className="text-[#757575]">Night surcharge</span>
                <span className="text-[#0E0E0E] font-medium font-tabular">
                  {formatRupee(ride.fareEstimate.nightSurcharge)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-[#E4E4E4]">
              <span className="text-[#757575]">Trip cover</span>
              <span className="text-xs text-[#757575]">Coming soon: per-trip micro-insurance</span>
            </div>

            <div className="flex items-baseline justify-between pt-2">
              <span className="font-semibold text-base text-[#0E0E0E]">Total</span>
              <span className="text-[24px] font-semibold text-[#0E0E0E] font-tabular">
                {formatRupee(ride.fareEstimate.totalFare)}
              </span>
            </div>
          </div>

          {/* Payment Section (Simulate Razorpay UPI flow) */}
          {paymentStep === 'receipt' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePay}
                className="btn-primary w-full"
              >
                Pay {formatRupee(ride.fareEstimate.totalFare)} via UPI
              </button>
            </div>
          )}

          {paymentStep === 'paying' && (
            <div className="text-center py-4 bg-[#F6F6F6] rounded-[8px] border border-[#E4E4E4]">
              <span className="text-sm font-medium text-[#0E0E0E] block">
                Connecting to UPI...
              </span>
              <span className="text-xs text-[#757575] mt-1 block">
                Simulating Razorpay UPI payment
              </span>
            </div>
          )}

          {paymentStep === 'paid' && (
            <div className="flex items-center gap-2 p-3 bg-[#F6F6F6] rounded-[8px] border border-[#E4E4E4]">
              <div className="w-5 h-5 rounded-full bg-[#0F7B5F] text-white flex items-center justify-center">
                <IconCheck size={12} strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-xs font-medium text-[#0F7B5F] block">
                  Payment confirmed
                </span>
                <span className="font-code-mono text-[10px] text-[#757575]">
                  Ref: UPI-{ride.id.slice(-6).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Rating prompt with 5 stars and optional quick tags as outlined chips */}
          <div className="pt-2 border-t border-[#E4E4E4] space-y-3">
            <span className="text-[14px] font-semibold text-[#0E0E0E] block">
              Rate your driver
            </span>

            {ratingSubmitted ? (
              <p className="text-xs text-[#757575]">
                Thank you for your rating.
              </p>
            ) : (
              <form onSubmit={handleRatingSubmit} className="space-y-3">
                {/* 5 Stars */}
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="cursor-pointer"
                    >
                      <IconStar
                        size={24}
                        className={
                          s <= rating
                            ? 'text-[#F2B705] fill-[#F2B705]'
                            : 'text-[#E4E4E4]'
                        }
                      />
                    </button>
                  ))}
                  <span className="font-tabular font-medium text-sm ml-2 text-[#0E0E0E]">
                    {rating}.0
                  </span>
                </div>

                {/* Optional quick tags as outlined chips */}
                <div className="flex flex-wrap gap-1.5">
                  {quickTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#0E0E0E] text-[#FFFFFF] border-[#0E0E0E]'
                            : 'bg-[#FFFFFF] text-[#757575] border-[#E4E4E4] hover:border-[#0E0E0E]'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Leave an optional note"
                  className="w-full px-3 py-2 text-xs rounded-[8px] border border-[#E4E4E4] bg-[#F6F6F6] text-[#0E0E0E]"
                />

                <button
                  type="submit"
                  className="btn-secondary w-full text-xs"
                >
                  Submit rating
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Dismiss Footer */}
        <div className="p-4 border-t border-[#E4E4E4] bg-[#FFFFFF] shrink-0">
          <button
            type="button"
            onClick={onDismiss}
            className="w-full h-11 rounded-full border border-[#E4E4E4] text-xs font-medium text-[#0E0E0E] hover:bg-[#F6F6F6] transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
