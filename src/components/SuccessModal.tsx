import React, { useEffect } from 'react';
import { IconCheck, IconClose } from './Icons';
import { formatRupee } from '../utils/fare';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'payment_success' | 'trip_completed' | 'booking_confirmed';
  title: string;
  subtitle?: string;
  amount?: number;
  paymentReference?: string;
  role?: 'owner' | 'driver';
  autoDismissMs?: number;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  subtitle,
  amount,
  paymentReference,
  role = 'owner',
  autoDismissMs = 0,
}) => {
  useEffect(() => {
    if (!isOpen || autoDismissMs <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [isOpen, autoDismissMs, onClose]);

  if (!isOpen) return null;

  const badgeText =
    type === 'payment_success'
      ? 'Payment Authorized & Verified'
      : type === 'trip_completed'
      ? role === 'driver'
        ? 'Chauffeur Payout Credited'
        : 'Trip Completed Safely'
      : 'Booking Request Confirmed';

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none animate-fade-in">
      <div
        className="w-full max-w-sm bg-[#FFFFFF] rounded-3xl shadow-2xl border border-[#E4E4E4] overflow-hidden flex flex-col items-center text-center p-6 space-y-4 animate-uber-intro"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Green Circle with Ripple & Checkmark Pop */}
        <div className="relative flex items-center justify-center my-2">
          <div className="w-20 h-20 rounded-full bg-[#0F7B5F]/15 flex items-center justify-center animate-green-ripple">
            <div className="w-16 h-16 rounded-full bg-[#0F7B5F] text-[#FFFFFF] flex items-center justify-center shadow-lg transform transition">
              <IconCheck size={36} strokeWidth={3} className="animate-checkmark-pop" />
            </div>
          </div>
        </div>

        {/* Badge */}
        <span className="text-[10px] font-bold text-[#0F7B5F] bg-[#0F7B5F]/10 border border-[#0F7B5F]/20 px-3 py-1 rounded-full uppercase tracking-wider">
          {badgeText}
        </span>

        {/* Title & Subtitle */}
        <div className="space-y-1.5">
          <h3 className="text-xl sm:text-2xl font-bold text-[#0E0E0E] font-display leading-tight">
            {title}
          </h3>
          <p className="text-xs text-[#757575] leading-normal max-w-xs mx-auto">
            {subtitle ||
              (type === 'payment_success'
                ? 'Your transaction was completed smoothly via Razorpay UPI.'
                : 'Thank you for choosing Safar chauffeur services.')}
          </p>
        </div>

        {/* Amount Card if present */}
        {amount !== undefined && amount > 0 && (
          <div className="w-full bg-[#F6F6F6] rounded-2xl p-3.5 border border-[#E4E4E4] space-y-1">
            <span className="text-[10px] text-[#757575] font-semibold uppercase tracking-wider block">
              {role === 'driver' ? 'Payer Fare Earned' : 'Amount Paid'}
            </span>
            <span className="text-2xl font-bold text-[#0E0E0E] font-tabular block">
              {formatRupee(amount)}
            </span>
            {paymentReference && (
              <span className="font-code-mono text-[10px] text-[#757575] block mt-0.5">
                Ref: {paymentReference.startsWith('UPI-') ? paymentReference : `UPI-${paymentReference}`}
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="btn-primary w-full shadow-floating text-sm font-semibold cursor-pointer h-12 min-h-[48px] rounded-2xl"
        >
          {role === 'driver' ? 'Done • View Ledger' : 'Done • Great'}
        </button>
      </div>
    </div>
  );
};
