import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  IconClose,
  IconChevronRight,
  IconCamera,
  IconCheck,
} from './Icons';
import { UserAvatar } from './UserAvatar';

interface SettingsAndProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVehicles: () => void;
  onOpenDriverProfile: () => void;
  onOpenEarnings: () => void;
  onOpenHistory: () => void;
}

export const SettingsAndProfileModal: React.FC<SettingsAndProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenVehicles,
  onOpenDriverProfile,
  onOpenEarnings,
  onOpenHistory,
}) => {
  const {
    user,
    activeRole,
    switchRole,
    vehicles,
    subscriptions,
    driverProfile,
    updateDriverProfile,
    signOutUser,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState('');

  const [avatarVariant, setAvatarVariant] = React.useState<'black-bg' | 'yellow-bg'>(() => {
    try {
      const stored = localStorage.getItem('safar_avatar_variant');
      if (stored === 'yellow-bg' || stored === 'black-on-yellow') return 'yellow-bg';
      if (stored === 'black-bg' || stored === 'yellow-on-black') return 'black-bg';
    } catch {}
    return 'black-bg';
  });

  React.useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem('safar_avatar_variant');
        if (stored === 'yellow-bg' || stored === 'black-on-yellow') setAvatarVariant('yellow-bg');
        else if (stored === 'black-bg' || stored === 'yellow-on-black') setAvatarVariant('black-bg');
      } catch {}
    }
  }, [isOpen]);

  const handleSetAvatarVariant = (variant: 'black-bg' | 'yellow-bg') => {
    setAvatarVariant(variant);
    try {
      localStorage.setItem('safar_avatar_variant', variant);
      window.dispatchEvent(new CustomEvent('avatar-variant-changed', { detail: { variant } }));
    } catch (e) {
      console.warn('Could not save avatar variant:', e);
    }
  };

  // Driver Commercial ID Photo Upload (Uber / Ola standard: Driver only)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoUploading(true);
    setPhotoSuccessMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Compress & crop to square max 300x300 for fast mobile transport and low Firestore footprint
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        const targetSize = Math.min(size, 320);
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const offsetX = (img.width - size) / 2;
          const offsetY = (img.height - size) / 2;
          ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, targetSize, targetSize);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.84);
          await updateDriverProfile({ photoUrl: compressedDataUrl });
          setPhotoUploading(false);
          setPhotoSuccessMsg('Commercial driver photo saved!');
          setTimeout(() => setPhotoSuccessMsg(''), 3500);
        } else {
          setPhotoUploading(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const handleRemoveDriverPhoto = async () => {
    await updateDriverProfile({ photoUrl: '' });
    setPhotoSuccessMsg('Photo removed');
    setTimeout(() => setPhotoSuccessMsg(''), 3000);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#FFFFFF] border-t sm:border border-[#E4E4E4] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-safe">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-[#E4E4E4] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-[#E4E4E4] flex items-center justify-between shrink-0">
          <h3 className="text-[18px] font-semibold text-[#0E0E0E] font-display">
            Profile & settings
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] text-[#0E0E0E] flex items-center justify-center transition cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {/* Hidden File Input for Driver Photo Upload (Driver only) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />

          {/* User Bio Card */}
          <div className="flex items-center gap-3.5">
            <UserAvatar size="lg" showRoleBadge />
            <div>
              <h4 className="text-[16px] font-semibold text-[#0E0E0E] leading-tight">
                {user.name}
              </h4>
              <span className="text-xs text-[#757575] font-tabular block mt-0.5">
                +91 {user.phone}
              </span>
              <span className="text-[11px] font-medium text-[#757575] capitalize block mt-0.5">
                Active role: {activeRole === 'owner' ? 'Car owner' : 'Driver'}
              </span>
            </div>
          </div>

          {/* DRIVER-ONLY PROFILE PICTURE UPLOAD (Uber / Ola standard: Driver ID photo) */}
          {activeRole === 'driver' && (
            <div className="p-3.5 bg-[#F6F6F6] rounded-xl border border-[#E4E4E4] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0E0E0E] block">
                    Driver Profile Picture
                  </span>
                  <span className="text-[11px] text-[#757575] block mt-0.5">
                    Commercial driver photo shown to car owners on trips
                  </span>
                </div>
                {driverProfile?.photoUrl ? (
                  <span className="text-[10px] font-semibold text-[#0F7B5F] bg-[#0F7B5F]/10 border border-[#0F7B5F]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <IconCheck size={11} />
                    <span>Uploaded</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-[#757575] bg-[#E4E4E4] px-2 py-0.5 rounded-full">
                    Required for trip dispatch
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#0E0E0E] bg-[#FFFFFF] shrink-0 shadow-xs flex items-center justify-center">
                  {driverProfile?.photoUrl ? (
                    <img
                      src={driverProfile.photoUrl}
                      alt={driverProfile.name || 'Driver'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#0E0E0E] text-[#F2B705] font-display font-bold text-sm flex items-center justify-center">
                      {user.name ? user.name.slice(0, 2).toUpperCase() : 'DR'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading}
                    className="absolute inset-0 bg-black/40 hover:bg-black/55 text-[#FFFFFF] flex items-center justify-center transition cursor-pointer"
                    title="Upload driver selfie"
                  >
                    <IconCamera size={16} />
                  </button>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoUploading}
                      className="btn-primary h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <IconCamera size={13} />
                      <span>{photoUploading ? 'Uploading...' : driverProfile?.photoUrl ? 'Change Photo' : 'Upload Selfie / Photo'}</span>
                    </button>
                    {driverProfile?.photoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveDriverPhoto}
                        className="text-xs text-[#DC2626] hover:underline px-2 py-1 font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {photoSuccessMsg ? (
                    <p className="text-[11px] font-semibold text-[#0F7B5F] flex items-center gap-1">
                      <IconCheck size={12} />
                      <span>{photoSuccessMsg}</span>
                    </p>
                  ) : (
                    <span className="text-[10px] text-[#757575] block">
                      Clear face photo or commercial ID selfie. JPG, PNG, WebP.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Profile Badge Theme Selector */}
          <div className="space-y-1.5 p-2.5 rounded-[8px] bg-[#F6F6F6] border border-[#E4E4E4]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#0E0E0E]">
                Profile logo style
              </span>
              <span className="text-[10px] text-[#757575]">Taxi Black & Yellow</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Option 1: Black / Yellow */}
              <button
                type="button"
                onClick={() => handleSetAvatarVariant('black-bg')}
                className={`py-2 px-2.5 rounded-[8px] text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  avatarVariant === 'black-bg'
                    ? 'bg-[#0E0E0E] text-[#FFFFFF] border-[#0E0E0E] shadow-sm ring-2 ring-[#0E0E0E]/20'
                    : 'bg-[#FFFFFF] text-[#757575] border-[#E4E4E4] hover:border-[#0E0E0E] hover:text-[#0E0E0E]'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-[#0E0E0E] border-2 border-[#F2B705] flex items-center justify-center text-[8px] font-bold text-[#F2B705] shrink-0">
                  SD
                </span>
                <span>Black / Yellow</span>
              </button>

              {/* Option 2: Yellow / Black */}
              <button
                type="button"
                onClick={() => handleSetAvatarVariant('yellow-bg')}
                className={`py-2 px-2.5 rounded-[8px] text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  avatarVariant === 'yellow-bg'
                    ? 'bg-[#F2B705] text-[#0E0E0E] border-[#0E0E0E] shadow-sm font-bold ring-2 ring-[#F2B705]/40'
                    : 'bg-[#FFFFFF] text-[#757575] border-[#E4E4E4] hover:border-[#0E0E0E] hover:text-[#0E0E0E]'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-[#F2B705] border-2 border-[#0E0E0E] flex items-center justify-center text-[8px] font-bold text-[#0E0E0E] shrink-0">
                  SD
                </span>
                <span>Yellow / Black</span>
              </button>
            </div>
          </div>

          {/* Switch Role Segmented Control */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#757575]">
              Current role
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#F6F6F6] border border-[#E4E4E4] rounded-[8px]">
              <button
                type="button"
                onClick={() => switchRole('owner')}
                className={`py-2 text-xs font-medium rounded-[6px] transition cursor-pointer ${
                  activeRole === 'owner'
                    ? 'bg-[#0E0E0E] text-[#FFFFFF]'
                    : 'text-[#757575] hover:text-[#0E0E0E]'
                }`}
              >
                Car owner
              </button>
              <button
                type="button"
                onClick={() => switchRole('driver')}
                className={`py-2 text-xs font-medium rounded-[6px] transition cursor-pointer ${
                  activeRole === 'driver'
                    ? 'bg-[#0E0E0E] text-[#FFFFFF]'
                    : 'text-[#757575] hover:text-[#0E0E0E]'
                }`}
              >
                Driver
              </button>
            </div>
          </div>

          {/* Account Services & Features */}
          <div className="space-y-0 border-t border-b border-[#E4E4E4]">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenVehicles();
              }}
              className="w-full py-3.5 flex items-center justify-between text-left hover:opacity-75 transition cursor-pointer border-b border-[#E4E4E4]"
            >
              <div>
                <span className="text-sm font-medium text-[#0E0E0E] block">
                  Vehicles
                </span>
                <span className="text-xs text-[#757575] block mt-0.5">
                  {vehicles.length} {vehicles.length === 1 ? 'car registered' : 'cars registered'}
                </span>
              </div>
              <IconChevronRight size={16} className="text-[#757575]" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDriverProfile();
              }}
              className="w-full py-3.5 flex items-center justify-between text-left hover:opacity-75 transition cursor-pointer border-b border-[#E4E4E4]"
            >
              <div>
                <span className="text-sm font-medium text-[#0E0E0E] block">
                  Driver commercial licence
                </span>
                <span className="text-xs text-[#757575] block mt-0.5 capitalize">
                  Status: {driverProfile?.verificationStatus || 'verified'}
                </span>
              </div>
              <IconChevronRight size={16} className="text-[#757575]" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEarnings();
              }}
              className="w-full py-3.5 flex items-center justify-between text-left hover:opacity-75 transition cursor-pointer border-b border-[#E4E4E4]"
            >
              <div>
                <span className="text-sm font-medium text-[#0E0E0E] block">
                  Earnings
                </span>
                <span className="text-xs text-[#757575] block mt-0.5">
                  Today and weekly ledger
                </span>
              </div>
              <IconChevronRight size={16} className="text-[#757575]" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHistory();
              }}
              className="w-full py-3.5 flex items-center justify-between text-left hover:opacity-75 transition cursor-pointer border-b border-[#E4E4E4]"
            >
              <div>
                <span className="text-sm font-medium text-[#0E0E0E] block">
                  Trip history
                </span>
                <span className="text-xs text-[#757575] block mt-0.5">
                  Past receipts and ratings
                </span>
              </div>
              <IconChevronRight size={16} className="text-[#757575]" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('open-subscription-modal'));
              }}
              className="w-full py-3.5 flex items-center justify-between text-left hover:opacity-75 transition cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#0E0E0E] block">
                    Monthly & Recurring Drivers
                  </span>
                  <span className="text-[10px] font-bold text-[#0F7B5F] bg-[#0F7B5F]/10 px-2 py-0.5 rounded-full border border-[#0F7B5F]/20">
                    {subscriptions.filter((s) => s.status === 'active').length > 0 ? '1 Active Contract' : 'Mon–Fri / Month'}
                  </span>
                </div>
                <span className="text-xs text-[#757575] block mt-0.5">
                  Dedicated chauffeur contracts with replacement guarantee
                </span>
              </div>
              <IconChevronRight size={16} className="text-[#757575]" />
            </button>
          </div>

          {/* Safar Production Help & Support Card */}
          <div className="p-3 bg-[#F6F6F6] rounded-[8px] border border-[#E4E4E4] text-[11px] space-y-1">
            <span className="font-semibold text-[#0E0E0E] block">
              Safar Chauffeur Network • Kolkata
            </span>
            <p className="text-[#757575] leading-normal">
              Direct peer-to-peer driver hire for personal vehicle owners. 24/7 Roadside Assistance & Verified WB Transport Authority drivers.
            </p>
          </div>

          {/* Sign Out */}
          <button
            type="button"
            onClick={() => {
              signOutUser();
              onClose();
            }}
            className="btn-secondary w-full text-xs text-[#C8321E]"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};
