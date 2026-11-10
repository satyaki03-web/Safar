import React, { useState } from 'react';
import { IconClose } from './Icons';

export interface DriverBrief {
  acPreference: 'full' | 'eco' | 'windows';
  musicPreference: 'silent' | 'low' | 'owner_choice';
  avoidHighways: boolean;
  noPhoneCalls: boolean;
  specialInstructions: string;
}

interface DriverBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  brief: DriverBrief;
  onSave: (brief: DriverBrief) => void;
}

export const DriverBriefModal: React.FC<DriverBriefModalProps> = ({ isOpen, onClose, brief, onSave }) => {
  const [ac, setAc] = useState(brief.acPreference);
  const [music, setMusic] = useState(brief.musicPreference);
  const [highways, setHighways] = useState(brief.avoidHighways);
  const [calls, setCalls] = useState(brief.noPhoneCalls);
  const [instructions, setInstructions] = useState(brief.specialInstructions);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      acPreference: ac,
      musicPreference: music,
      avoidHighways: highways,
      noPhoneCalls: calls,
      specialInstructions: instructions,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#FFFFFF] border-t sm:border border-[#E4E4E4] shadow-2xl overflow-hidden text-sm max-h-[92vh] flex flex-col pb-safe">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-[#E4E4E4] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-[#E4E4E4] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-[18px] font-semibold text-[#0E0E0E] font-display leading-tight">
              Driver brief
            </h3>
            <span className="text-xs text-[#757575]">Shown to driver before accepting</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] text-[#0E0E0E] flex items-center justify-center transition cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* AC Preference */}
          <div>
            <label className="block text-xs font-medium text-[#757575] mb-1.5">Air conditioning</label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#F6F6F6] border border-[#E4E4E4] rounded-[8px]">
              {[
                { id: 'full', label: 'Full' },
                { id: 'eco', label: 'Eco (24°C)' },
                { id: 'windows', label: 'Windows' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAc(opt.id as any)}
                  className={`py-1.5 text-xs font-medium rounded-[6px] transition ${
                    ac === opt.id
                      ? 'bg-[#0E0E0E] text-[#FFFFFF]'
                      : 'text-[#757575] hover:text-[#0E0E0E]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Music Preference */}
          <div>
            <label className="block text-xs font-medium text-[#757575] mb-1.5">Cabin music</label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#F6F6F6] border border-[#E4E4E4] rounded-[8px]">
              {[
                { id: 'silent', label: 'Silent' },
                { id: 'low', label: 'Low' },
                { id: 'owner_choice', label: 'Owner playlist' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMusic(opt.id as any)}
                  className={`py-1.5 text-xs font-medium rounded-[6px] transition ${
                    music === opt.id
                      ? 'bg-[#0E0E0E] text-[#FFFFFF]'
                      : 'text-[#757575] hover:text-[#0E0E0E]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Highway & Phone Preferences */}
          <div className="space-y-2 pt-2 border-t border-[#E4E4E4]">
            <label className="flex items-center justify-between p-2.5 rounded-[8px] border border-[#E4E4E4] bg-[#F6F6F6] text-xs text-[#0E0E0E] font-medium cursor-pointer">
              <span>Avoid toll highways</span>
              <input
                type="checkbox"
                checked={highways}
                onChange={(e) => setHighways(e.target.checked)}
                className="accent-[#0E0E0E]"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-[8px] border border-[#E4E4E4] bg-[#F6F6F6] text-xs text-[#0E0E0E] font-medium cursor-pointer">
              <span>No phone calls while driving</span>
              <input
                type="checkbox"
                checked={calls}
                onChange={(e) => setCalls(e.target.checked)}
                className="accent-[#0E0E0E]"
              />
            </label>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-xs font-medium text-[#757575] mb-1.5">Special instructions</label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Elderly passenger in rear seat"
              className="w-full px-3 py-2 border border-[#E4E4E4] rounded-[8px] bg-[#F6F6F6] text-xs text-[#0E0E0E]"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary w-full"
            >
              Save brief
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
