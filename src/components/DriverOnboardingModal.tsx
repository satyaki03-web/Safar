import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DriverVerificationStatus } from '../types';
import { IconClose } from './Icons';

interface DriverOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverOnboardingModal: React.FC<DriverOnboardingModalProps> = ({ isOpen, onClose }) => {
  const { driverProfile, updateDriverProfile } = useApp();

  const [licenceNumber, setLicenceNumber] = useState(driverProfile?.licenceNumber || 'WB-01-2017-0038912');
  const [licenceExpiry, setLicenceExpiry] = useState(driverProfile?.licenceExpiry || '2032-05-18');
  const [experienceYears, setExperienceYears] = useState(driverProfile?.experienceYears || 8);
  const [manual, setManual] = useState(true);
  const [automatic, setAutomatic] = useState(true);
  const [suv, setSuv] = useState(true);
  const [status, setStatus] = useState<DriverVerificationStatus>(driverProfile?.verificationStatus || 'verified');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const vehicleTypes: ('manual' | 'automatic' | 'suv')[] = [];
      if (manual) vehicleTypes.push('manual');
      if (automatic) vehicleTypes.push('automatic');
      if (suv) vehicleTypes.push('suv');

      await updateDriverProfile({
        licenceNumber: licenceNumber.toUpperCase().trim(),
        licenceExpiry,
        experienceYears: Number(experienceYears),
        vehicleTypes,
        verificationStatus: status,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#FFFFFF] border-t sm:border border-[#E4E4E4] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-safe">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-[#E4E4E4] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:py-4 border-b border-[#E4E4E4] shrink-0">
          <h3 className="text-[18px] font-semibold text-[#0E0E0E] font-display">
            Driver licence
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] text-[#0E0E0E] flex items-center justify-center transition cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs text-[#757575] leading-relaxed">
            Commercial licence verified via West Bengal State Transport Authority.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#0E0E0E] mb-1">
                Licence number
              </label>
              <input
                type="text"
                required
                value={licenceNumber}
                onChange={(e) => setLicenceNumber(e.target.value)}
                className="w-full h-10 px-3 border border-[#E4E4E4] rounded-xl text-xs sm:text-sm bg-[#F6F6F6] text-[#0E0E0E] font-code-mono uppercase focus:border-[#0E0E0E] transition"
                placeholder="WB-01-2017-0038912"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#0E0E0E] mb-1">
                  Valid until
                </label>
                <input
                  type="date"
                  required
                  value={licenceExpiry}
                  onChange={(e) => setLicenceExpiry(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E4E4E4] rounded-xl text-xs sm:text-sm bg-[#F6F6F6] text-[#0E0E0E] font-tabular focus:border-[#0E0E0E] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0E0E0E] mb-1">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  required
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full h-10 px-3 border border-[#E4E4E4] rounded-xl text-xs sm:text-sm bg-[#F6F6F6] font-tabular text-[#0E0E0E] focus:border-[#0E0E0E] transition"
                />
              </div>
            </div>

            {/* Vehicle Types - Responsive Chips */}
            <div>
              <label className="block text-xs font-semibold text-[#0E0E0E] mb-1.5">
                Vehicles qualified to drive
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl border text-xs cursor-pointer font-semibold transition select-none ${
                  manual
                    ? 'border-[#0E0E0E] bg-[#0E0E0E] text-[#FFFFFF] shadow-xs'
                    : 'border-[#E4E4E4] bg-[#F6F6F6] text-[#757575] hover:text-[#0E0E0E]'
                }`}>
                  <input
                    type="checkbox"
                    checked={manual}
                    onChange={(e) => setManual(e.target.checked)}
                    className="sr-only"
                  />
                  <span>{manual ? '✓ ' : ''}Manual</span>
                </label>

                <label className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl border text-xs cursor-pointer font-semibold transition select-none ${
                  automatic
                    ? 'border-[#0E0E0E] bg-[#0E0E0E] text-[#FFFFFF] shadow-xs'
                    : 'border-[#E4E4E4] bg-[#F6F6F6] text-[#757575] hover:text-[#0E0E0E]'
                }`}>
                  <input
                    type="checkbox"
                    checked={automatic}
                    onChange={(e) => setAutomatic(e.target.checked)}
                    className="sr-only"
                  />
                  <span>{automatic ? '✓ ' : ''}Auto</span>
                </label>

                <label className={`flex items-center justify-center gap-1.5 px-1.5 py-2.5 rounded-xl border text-xs cursor-pointer font-semibold transition select-none ${
                  suv
                    ? 'border-[#0E0E0E] bg-[#0E0E0E] text-[#FFFFFF] shadow-xs'
                    : 'border-[#E4E4E4] bg-[#F6F6F6] text-[#757575] hover:text-[#0E0E0E]'
                }`}>
                  <input
                    type="checkbox"
                    checked={suv}
                    onChange={(e) => setSuv(e.target.checked)}
                    className="sr-only"
                  />
                  <span>{suv ? '✓ ' : ''}SUV</span>
                </label>
              </div>
            </div>

            {/* Verification Status */}
            <div className="pt-2 border-t border-[#E4E4E4]">
              <label className="block text-xs font-semibold text-[#0E0E0E] mb-1.5">
                Verification status (Simulation)
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F6F6F6] border border-[#E4E4E4] rounded-xl">
                {(['verified', 'pending', 'rejected'] as DriverVerificationStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 text-xs capitalize font-semibold rounded-lg transition ${
                      status === st
                        ? 'bg-[#0E0E0E] text-[#FFFFFF] shadow-sm'
                        : 'text-[#757575] hover:text-[#0E0E0E]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full h-11 text-xs sm:text-sm font-semibold"
            >
              {saving ? 'Updating...' : 'Save credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
