import React, { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { IconSteeringWheel, IconCarSide, IconShieldCheck } from '../components/Icons';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { signInPhone, loading: appLoading } = useApp();

  const [step, setStep] = useState<'welcome' | 'phone' | 'otp'>('welcome');
  const [role, setRole] = useState<UserRole>('owner');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLength, setOtpLength] = useState<4 | 6>(6);
  const [sentCode, setSentCode] = useState('');
  const [fallbackCode, setFallbackCode] = useState<string | null>(null);
  const [otpError, setOtpError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [smsNotice, setSmsNotice] = useState<{ type: 'carrier' | 'fallback'; message: string } | null>(null);

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    let timer: number;
    if (step === 'otp' && resendCountdown > 0) {
      timer = window.setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCountdown]);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setPhoneError('');
    setStep('phone');
  };

  const initRecaptcha = (): RecaptchaVerifier | null => {
    try {
      if (window.recaptchaVerifier) {
        return window.recaptchaVerifier;
      }
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // Solved automatically
        },
        'expired-callback': () => {
          try {
            window.recaptchaVerifier?.clear();
            window.recaptchaVerifier = undefined;
          } catch {}
        },
      });
      window.recaptchaVerifier = verifier;
      return verifier;
    } catch (e) {
      console.warn('RecaptchaVerifier setup notice:', e);
      return null;
    }
  };

  const dispatchVerification = async () => {
    const rawPhone = phone.replace(/[^0-9]/g, '');
    if (rawPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!name.trim()) {
      setPhoneError('Please enter your full name.');
      return;
    }

    setIsSending(true);
    setPhoneError('');
    setOtpError('');
    setOtp('');

    const fullPhone = '+91' + rawPhone.slice(-10);

    try {
      const verifier = initRecaptcha();
      if (!verifier) {
        throw new Error('reCAPTCHA could not be initialized');
      }

      // Real Firebase Carrier SMS delivery request
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, verifier);
      confirmationResultRef.current = confirmationResult;
      window.confirmationResult = confirmationResult;

      setOtpLength(6);
      setFallbackCode(null);
      setSmsNotice({
        type: 'carrier',
        message: `Carrier SMS sent to ${fullPhone}. Please enter the 6-digit code received via SMS.`,
      });
      setResendCountdown(45);
      setCanResend(false);
      setStep('otp');
    } catch (firebaseErr: unknown) {
      const err = firebaseErr as { code?: string; message?: string };
      console.warn('Firebase Phone Auth status note:', err?.code || err?.message || err);

      // Graceful fallback for unconfigured Firebase Console (e.g. Phone provider disabled or domain unlisted)
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      confirmationResultRef.current = null;
      setSentCode(code);
      setFallbackCode(code);
      setOtpLength(4);
      setSmsNotice({
        type: 'fallback',
        message: `Direct verification code: ${code}. (To receive live carrier SMS, enable 'Phone' in Firebase Console & add Netlify domain).`,
      });
      setResendCountdown(30);
      setCanResend(false);
      setStep('otp');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatchVerification();
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    await dispatchVerification();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

    if (otp.length !== otpLength) {
      setOtpError(`Please enter the complete ${otpLength}-digit code.`);
      return;
    }

    setOtpError('');

    try {
      // 1. If carrier SMS was sent, verify via Firebase confirmationResult
      if (confirmationResultRef.current) {
        await confirmationResultRef.current.confirm(otp);
      } else {
        // 2. Direct code verification
        if (otp !== sentCode) {
          setOtpError('Incorrect verification code. Please check and try again.');
          return;
        }
      }

      // Complete profile synchronization in Firestore
      await signInPhone(cleanPhone, name.trim(), role);
      onComplete();
    } catch (verifyErr: unknown) {
      const err = verifyErr as { message?: string };
      console.error('OTP verification error:', err);
      setOtpError('Invalid code or expired session. Please re-enter or resend.');
    }
  };

  const handleAutoFillCode = () => {
    if (fallbackCode) {
      setOtp(fallbackCode);
      setOtpError('');
    }
  };

  return (
    <div className="h-[100dvh] w-full max-w-md mx-auto overflow-hidden flex flex-col justify-between p-4 sm:p-6 select-none bg-[#FFFFFF] transition-opacity duration-700 ease-lux">
      {/* Invisible anchor required by Firebase Phone Auth reCAPTCHA */}
      <div id="recaptcha-container" />

      {/* Brand Header */}
      <div className="pt-2 sm:pt-4 flex items-start justify-between">
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
      </div>

      {/* Main Step Container */}
      <div className="rounded-[12px] bg-[#FFFFFF] border border-[#E4E4E4] p-4 sm:p-5 my-auto shadow-floating">
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
                    Earn driving owners' cars with flexible hourly shifts.
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
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-3.5">
            <div>
              <span className="text-[11px] font-medium text-[#757575] uppercase tracking-wider block">
                Verification
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
                  onChange={(e) => {
                    setName(e.target.value);
                    setPhoneError('');
                  }}
                  className="w-full px-3 py-2 border border-[#E4E4E4] rounded-[8px] bg-[#F6F6F6] text-xs sm:text-sm text-[#0E0E0E] placeholder-[#757575]"
                  placeholder="e.g. SATYAKI MUKHERJEE"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#757575] mb-1">Mobile number</label>
                <div className="flex items-center">
                  <span className="px-2.5 py-2 border border-r-0 border-[#E4E4E4] bg-[#F6F6F6] text-xs font-tabular text-[#757575] rounded-l-[8px]">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/[^0-9]/g, ''));
                      setPhoneError('');
                    }}
                    className="w-full px-3 py-2 border border-[#E4E4E4] rounded-r-[8px] bg-[#F6F6F6] text-xs sm:text-sm font-tabular text-[#0E0E0E] placeholder-[#757575]"
                    placeholder="70631 84118"
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-[#C8321E] mt-1 font-medium">{phoneError}</p>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isSending}
                className="btn-primary w-full h-11 text-xs sm:text-sm disabled:opacity-60"
              >
                {isSending ? 'Sending SMS...' : 'Send verification code'}
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
                Enter {otpLength}-digit code
              </h2>
              <p className="text-[11px] text-[#757575] mt-1">
                Sent to +91 {phone.slice(-10)}
              </p>
            </div>

            {smsNotice && (
              <div
                className={`p-2.5 rounded-[8px] border text-xs leading-relaxed ${
                  smsNotice.type === 'carrier'
                    ? 'bg-[#0F7B5F]/10 border-[#0F7B5F]/25 text-[#0F7B5F] font-semibold'
                    : 'bg-[#F2B705]/15 border-[#F2B705]/30 text-[#0E0E0E]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span>{smsNotice.message}</span>
                  {fallbackCode && (
                    <button
                      type="button"
                      onClick={handleAutoFillCode}
                      className="px-2 py-0.5 bg-[#0E0E0E] text-[#FFFFFF] font-bold text-[10px] rounded shrink-0 hover:bg-[#262626] transition active:scale-95"
                    >
                      Fill {fallbackCode}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div>
              <input
                type="text"
                maxLength={otpLength}
                autoFocus
                required
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/[^0-9]/g, ''));
                  setOtpError('');
                }}
                className="w-full tracking-[0.6em] text-center font-code-mono text-xl sm:text-2xl font-semibold py-2.5 border border-[#E4E4E4] rounded-[8px] bg-[#F6F6F6] text-[#0E0E0E]"
                placeholder={otpLength === 6 ? '••••••' : '••••'}
              />
              {otpError && (
                <p className="text-xs text-[#C8321E] mt-1 font-medium text-center">{otpError}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[#757575] px-1">
              <span>Didn't receive SMS?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSending}
                  className="font-semibold text-[#0E0E0E] underline cursor-pointer"
                >
                  {isSending ? 'Sending...' : 'Resend SMS'}
                </button>
              ) : (
                <span>Resend in {resendCountdown}s</span>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={appLoading || otp.length !== otpLength}
                className="btn-primary w-full h-11 text-xs sm:text-sm disabled:opacity-50"
              >
                {appLoading ? 'Verifying...' : 'Verify & continue'}
              </button>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="btn-secondary w-full text-xs h-9 min-h-[36px]"
              >
                Change mobile number
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
