import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { IconSteeringWheel, IconCarSide, IconShieldCheck } from '../components/Icons';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { signInPhone, loading } = useApp();

  const [step, setStep] = useState<'welcome' | 'phone' | 'otp'>('welcome');
  const [role, setRole] = useState<UserRole>('owner');
  const [phone, setPhone] = useState('98301 44521');
  const [name, setName] = useState('Debashis Banerjee');
  const [otp, setOtp] = useState('4829');
  const [otpError, setOtpError] = useState('');

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'driver') {
      setName('Subhashish Das');
      setPhone('98300 12894');
    } else if (selectedRole === 'both') {
      setName('Sourav Ganguly');
      setPhone('98310 99001');
    } else {
      setName('Debashis Banerjee');
      setPhone('98301 44521');
    }
    setStep('phone');
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/[^0-9]/g, '').length < 10) return;
    setOtp('4829');
    setStep('otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) {
      setOtpError('Enter the 4-digit verification code.');
      return;
    }
    await signInPhone(phone, name, role);
    onComplete();
  };

  const handleQuickDemoSign = async (quickRole: UserRole) => {
    if (quickRole === 'driver') {
      await signInPhone('98300 12894', 'Subhashish Das', 'driver');
    } else if (quickRole === 'both') {
      await signInPhone('98310 99001', 'Sourav Ganguly', 'both');
    } else {
      await signInPhone('98301 44521', 'Debashis Banerjee', 'owner');
    }
    onComplete();
  };

  return (
    <div className="h-[100dvh] w-full max-w-md mx-auto overflow-hidden flex flex-col justify-between p-4 sm:p-6 select-none bg-[#FFFFFF] transition-opacity duration-700 ease-lux">
      {/* Brand Header */}
      <div className="pt-2 sm:pt-4 flex items-start justify-between transition-all duration-700 ease-lux animate-in fade-in slide-in-from-top-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-[26px] sm:text-[30px] font-bold text-[#0E0E0E] tracking-tight leading-none font-display">
              Safar
            </h1>
            <span className="w-2 h-2 rounded-full bg-[#F2B705] mt-1" />
          </div>
          <p className="text-xs sm:text-sm text-[#757575] mt-1.5 leading-normal">
            Hire verified local drivers by the hour to drive your personal car in Kolkata.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('replay-intro'))}
          className="text-[10px] text-[#757575] hover:text-[#0E0E0E] underline px-2 py-1 bg-[#F6F6F6] rounded-md border border-[#E4E4E4] cursor-pointer shrink-0 mt-1"
          title="Replay Uber-style opening animation"
        >
          Replay intro
        </button>
      </div>

      {/* Main Step Container (Auto-centered vertically, fits viewport) */}
      <div className="rounded-[12px] bg-[#FFFFFF] border border-[#E4E4E4] p-4 sm:p-5 my-auto shadow-floating transition-all duration-800 ease-lux animate-in fade-in slide-in-from-bottom-4">
        {step === 'welcome' && (
          <div className="space-y-3.5">
            <div>
              <span className="text-[11px] font-medium text-[#757575] uppercase tracking-wider block">
                Get started
              </span>
              <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#0E0E0E] leading-tight mt-0.5">
                Choose your role
              </h2>
            </div>

            <div className="space-y-2">
              {/* Option 1: Car Owner */}
              <div
                onClick={() => handleRoleSelect('owner')}
                className="p-3 sm:p-3.5 rounded-[8px] border border-[#E4E4E4] hover:border-[#0E0E0E] bg-[#FFFFFF] cursor-pointer transition flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-[#F6F6F6] border border-[#E4E4E4] flex items-center justify-center shrink-0">
                  <IconCarSide size={16} className="text-[#0E0E0E]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-semibold text-[#0E0E0E] block leading-tight">
                    Car owner
                  </span>
                  <p className="text-[11px] text-[#757575] mt-0.5 truncate leading-tight">
                    Hire a verified chauffeur by the hour for your personal car.
                  </p>
                </div>
              </div>

              {/* Option 2: Professional Driver */}
              <div
                onClick={() => handleRoleSelect('driver')}
                className="p-3 sm:p-3.5 rounded-[8px] border border-[#E4E4E4] hover:border-[#0E0E0E] bg-[#FFFFFF] cursor-pointer transition flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-[#F6F6F6] border border-[#E4E4E4] flex items-center justify-center shrink-0">
                  <IconSteeringWheel size={16} className="text-[#0E0E0E]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-semibold text-[#0E0E0E] block leading-tight">
                    Professional driver
                  </span>
                  <p className="text-[11px] text-[#757575] mt-0.5 truncate leading-tight">
                    Earn ₹180/hr driving owners' cars with flexible shifts.
                  </p>
                </div>
              </div>

              {/* Option 3: Both */}
              <div
                onClick={() => handleRoleSelect('both')}
                className="p-3 sm:p-3.5 rounded-[8px] border border-[#E4E4E4] hover:border-[#0E0E0E] bg-[#FFFFFF] cursor-pointer transition flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-[#F6F6F6] border border-[#E4E4E4] flex items-center justify-center shrink-0">
                  <IconShieldCheck size={16} className="text-[#0E0E0E]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-semibold text-[#0E0E0E] block leading-tight">
                    Both
                  </span>
                  <p className="text-[11px] text-[#757575] mt-0.5 truncate leading-tight">
                    Book drivers and accept incoming dispatches with role toggle.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="pt-2.5 border-t border-[#E4E4E4] space-y-1.5">
              <span className="text-[11px] text-[#757575] block">
                Quick 1-tap demo access:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoSign('owner')}
                  className="btn-secondary w-full text-xs h-9 min-h-[36px]"
                >
                  Enter as Owner
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoSign('driver')}
                  className="btn-secondary w-full text-xs h-9 min-h-[36px]"
                >
                  Enter as Driver
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-3.5">
            <div>
              <span className="text-[11px] font-medium text-[#757575] uppercase tracking-wider block">
                Phone sign-in
              </span>
              <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#0E0E0E] leading-tight mt-0.5">
                Enter your details
              </h2>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-medium text-[#757575] mb-1">Full name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E4E4E4] rounded-[8px] bg-[#F6F6F6] text-xs sm:text-sm text-[#0E0E0E]"
                  placeholder="e.g. Debashis Banerjee"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#757575] mb-1">Phone number</label>
                <div className="flex items-center">
                  <span className="px-2.5 py-2 border border-r-0 border-[#E4E4E4] bg-[#F6F6F6] text-xs font-tabular text-[#757575] rounded-l-[8px]">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E4E4E4] rounded-r-[8px] bg-[#F6F6F6] text-xs sm:text-sm font-tabular text-[#0E0E0E]"
                    placeholder="98301 23456"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                className="btn-primary w-full h-11 text-xs sm:text-sm"
              >
                Send verification code
              </button>
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="btn-secondary w-full text-xs h-9 min-h-[36px]"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-3.5">
            <div>
              <span className="text-[11px] font-medium text-[#757575] uppercase tracking-wider block">
                Verification
              </span>
              <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#0E0E0E] leading-tight mt-0.5">
                Enter 4-digit code
              </h2>
              <p className="text-[11px] text-[#757575] mt-1">
                Sent to +91 {phone}. Demo code: <span className="font-tabular font-semibold text-[#0E0E0E]">4829</span>
              </p>
            </div>

            <div>
              <input
                type="text"
                maxLength={4}
                autoFocus
                required
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/[^0-9]/g, ''));
                  setOtpError('');
                }}
                className="w-full tracking-[0.8em] text-center font-code-mono text-xl sm:text-2xl font-semibold py-2.5 border border-[#E4E4E4] rounded-[8px] bg-[#F6F6F6] text-[#0E0E0E]"
                placeholder="0000"
              />
              {otpError && (
                <p className="text-xs text-[#C8321E] mt-1 font-medium">{otpError}</p>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-11 text-xs sm:text-sm"
              >
                {loading ? 'Verifying...' : 'Verify & continue'}
              </button>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="btn-secondary w-full text-xs h-9 min-h-[36px]"
              >
                Change phone
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-2">
        <span className="text-[11px] text-[#757575]">
          Safar Kolkata • Verified Peer-to-Peer Chauffeurs
        </span>
      </div>
    </div>
  );
};
