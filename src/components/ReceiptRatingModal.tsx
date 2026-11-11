import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Ride } from '../types';
import { formatRupee, formatDateIN } from '../utils/fare';
import { IconStar, IconClose, IconCheck } from './Icons';
import { SuccessModal } from './SuccessModal';

interface ReceiptRatingModalProps {
  ride: Ride;
  onDismiss: () => void;
}

export const ReceiptRatingModal: React.FC<ReceiptRatingModalProps> = ({ ride, onDismiss }) => {
  const { submitPayment, submitRating } = useApp();

  const [paymentStep, setPaymentStep] = useState<'receipt' | 'paying' | 'paid'>(
    ride.paymentStatus === 'paid' ? 'paid' : 'receipt'
  );
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
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
      setShowSuccessPopup(true);
    }, 1200);
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalNote = [selectedTags.join(', '), note].filter(Boolean).join(' - ');
    await submitRating(ride.id, rating, finalNote);
    setRatingSubmitted(true);
  };

  const totalFare = ride.fareEstimate?.totalFare || 350;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4 select-none animate-fade-in">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#FFFFFF] border-t sm:border border-[#E4E4E4] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-safe">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-[#E4E4E4] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Celebration Header */}
        <div className="px-5 py-4 bg-[#0E0E0E] text-[#FFFFFF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0F7B5F] text-[#FFFFFF] flex items-center justify-center font-bold animate-green-ripple shrink-0">
              <IconCheck size={18} strokeWidth={2.5} className="animate-checkmark-pop" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#F2B705] uppercase tracking-wider block">
                🎉 Trip Completed Safely
              </span>
              <h3 className="text-[16px] font-bold text-[#FFFFFF] font-display leading-tight mt-0.5">
                Receipt & Driver Rating
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="w-8 h-8 rounded-full bg-[#FFFFFF]/15 hover:bg-[#FFFFFF]/25 text-[#FFFFFF] flex items-center justify-center transition cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Trip Overview Card */}
          <div className="bg-[#F6F6F6] rounded-xl p-3 border border-[#E4E4E4] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#757575]">Trip Reference</span>
              <span className="font-code-mono font-bold text-[#0E0E0E]">
                #{ride.id.slice(-6).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#757575]">Chauffeur</span>
              <span className="font-bold text-[#0E0E0E]">
                {ride.driverName || 'Assigned Driver'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#757575]">Vehicle</span>
              <span className="font-semibold text-[#0E0E0E]">
                {ride.vehicleInfo.make} {ride.vehicleInfo.model} ({ride.vehicleInfo.registrationNumber})
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#757575]">Date</span>
              <span className="font-medium text-[#0E0E0E]">
                {formatDateIN(ride.completedAt || ride.createdAt)}
              </span>
            </div>
          </div>

          {/* Fare Breakdown */}
          <div className="space-y-2 pt-1 border-t border-[#E4E4E4]">
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-[#757575]">Base Duty Fare ({ride.durationHours} hrs)</span>
              <span className="text-[#0E0E0E] font-medium font-tabular">
                {formatRupee(ride.fareEstimate?.baseFare || 300)}
              </span>
            </div>

            {(ride.fareEstimate?.nightSurcharge ?? 0) > 0 && (
              <div className="flex justify-between text-xs py-0.5">
                <span className="text-[#757575]">Night Allowance</span>
                <span className="text-[#0E0E0E] font-medium font-tabular">
                  {formatRupee(ride.fareEstimate?.nightSurcharge || 0)}
                </span>
              </div>
            )}

            <div className="flex items-baseline justify-between pt-2 border-t border-[#E4E4E4]">
              <span className="font-bold text-base text-[#0E0E0E]">Total Fare</span>
              <span className="text-[24px] font-bold text-[#0E0E0E] font-tabular">
                {formatRupee(totalFare)}
              </span>
            </div>
          </div>

          {/* Interactive Payment Section */}
          {paymentStep === 'receipt' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePay}
                className="btn-primary w-full shadow-floating gap-2 text-sm cursor-pointer"
              >
                <span>Pay {formatRupee(totalFare)} via Razorpay UPI</span>
              </button>
            </div>
          )}

          {paymentStep === 'paying' && (
            <div className="text-center py-5 bg-[#F6F6F6] rounded-2xl border border-[#E4E4E4] space-y-2">
              <div className="w-8 h-8 border-3 border-[#0E0E0E] border-t-transparent rounded-full animate-spin mx-auto" />
              <span className="text-sm font-bold text-[#0E0E0E] block">
                Connecting to UPI Application...
              </span>
              <span className="text-xs text-[#757575] block">
                Authorizing secure payment gateway
              </span>
            </div>
          )}

          {paymentStep === 'paid' && (
            <div className="p-4 bg-[#0F7B5F]/10 border-2 border-[#0F7B5F] rounded-2xl text-center space-y-2 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-[#0F7B5F] text-[#FFFFFF] flex items-center justify-center mx-auto shadow-md animate-checkmark-pop">
                <IconCheck size={26} strokeWidth={3} />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#0F7B5F] uppercase tracking-wider block">
                  Payment Successful
                </span>
                <h4 className="text-lg font-bold text-[#0E0E0E] font-tabular">
                  {formatRupee(totalFare)} Paid
                </h4>
                <span className="font-code-mono text-[11px] text-[#757575] block">
                  Ref: UPI-{(ride.paymentReference || ride.id.slice(-8)).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Rating Section */}
          <div className="pt-3 border-t border-[#E4E4E4] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#0E0E0E]">
                Rate Chauffeur Performance
              </span>
              <span className="text-xs text-[#757575]">
                {ride.driverName || 'Driver'}
              </span>
            </div>

            {ratingSubmitted ? (
              <div className="p-3 bg-[#F6F6F6] rounded-xl border border-[#E4E4E4] text-center space-y-1">
                <span className="text-xs font-bold text-[#0F7B5F] block flex items-center justify-center gap-1">
                  <IconCheck size={14} />
                  <span>Rating Submitted</span>
                </span>
                <p className="text-xs text-[#757575]">
                  Thank you for helping keep Safar safe & high quality!
                </p>
              </div>
            ) : (
              <form onSubmit={handleRatingSubmit} className="space-y-3">
                {/* 5 Stars */}
                <div className="flex items-center justify-center gap-3 py-1 bg-[#F6F6F6] rounded-xl border border-[#E4E4E4]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="cursor-pointer transition transform active:scale-125 p-1"
                    >
                      <IconStar
                        size={28}
                        className={
                          s <= rating
                            ? 'text-[#F2B705] fill-[#F2B705] filter drop-shadow-xs'
                            : 'text-[#E4E4E4]'
                        }
                      />
                    </button>
                  ))}
                  <span className="font-bold text-base text-[#0E0E0E] font-tabular ml-1">
                    {rating}.0
                  </span>
                </div>

                {/* Optional quick tags */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {quickTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#0E0E0E] text-[#FFFFFF] border-[#0E0E0E] shadow-2xs'
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
                  placeholder="Add a feedback note (optional)..."
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E4E4E4] bg-[#FFFFFF] text-[#0E0E0E] outline-none focus:border-[#0E0E0E]"
                />

                <button
                  type="submit"
                  className="btn-secondary w-full text-xs font-semibold cursor-pointer"
                >
                  Submit Driver Rating
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
            className="btn-primary w-full h-11 text-xs font-semibold cursor-pointer shadow-xs"
          >
            Done • Back to Home
          </button>
        </div>
      </div>

      {/* Success Modal Popup for Payment Confirmation */}
      <SuccessModal
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        type="payment_success"
        title="Payment Successful!"
        subtitle="Your UPI payment has been processed and verified. Thank you for riding with Safar!"
        amount={totalFare}
        paymentReference={ride.paymentReference || ride.id.slice(-8)}
        role="owner"
      />
    </div>
  );
};
