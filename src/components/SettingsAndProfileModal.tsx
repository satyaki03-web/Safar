import React from 'react';
import { useApp } from '../context/AppContext';
import {
  IconClose,
  IconChevronRight,
  IconUser,
} from './Icons';
import { UserAvatar } from './UserAvatar';
import { getOlaMapsApiKey, setOlaMapsApiKey } from '../services/olaMapsService';

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
    isDemoMode,
    toggleDemoMode,
    signOutUser,
    firestoreConnected,
    testFirestore,
    firebaseInfo,
  } = useApp();

  const [olaKeyInput, setOlaKeyInput] = React.useState(getOlaMapsApiKey());
  const [keySavedMsg, setKeySavedMsg] = React.useState('');
  const [firebaseStatusMsg, setFirebaseStatusMsg] = React.useState<{ text: string; isError?: boolean } | null>(null);
  const [testingFirebase, setTestingFirebase] = React.useState(false);
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
      setOlaKeyInput(getOlaMapsApiKey());
      setKeySavedMsg('');
      setFirebaseStatusMsg(null);
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

  const handleSaveOlaKey = () => {
    setOlaMapsApiKey(olaKeyInput.trim());
    setKeySavedMsg(olaKeyInput.trim() ? 'Ola Maps key saved! Map & search updated.' : 'Ola Maps key cleared. Using OpenStreetMap fallback.');
    setTimeout(() => setKeySavedMsg(''), 3500);
  };

  const handleClearOlaKey = () => {
    setOlaKeyInput('');
    setOlaMapsApiKey('');
    setKeySavedMsg('Ola Maps key cleared. Using OpenStreetMap fallback.');
    setTimeout(() => setKeySavedMsg(''), 3500);
  };

  const handleTestFirebase = async () => {
    setTestingFirebase(true);
    setFirebaseStatusMsg(null);
    try {
      const ok = await testFirestore();
      setFirebaseStatusMsg({
        text: ok
          ? 'Cloud Firestore & Firebase Auth operational! Live collections synchronized.'
          : 'Firestore connection unreachable. Check network or rules permissions.',
        isError: !ok,
      });
      setTimeout(() => setFirebaseStatusMsg(null), 4000);
    } finally {
      setTestingFirebase(false);
    }
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

        <div className="p-5 overflow-y-auto space-y-6">
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

          {/* Profile Badge Theme Selector */}
          <div className="space-y-1.5 p-2.5 rounded-[8px] bg-[#F6F6F6] border border-[#E4E4E4]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#0E0E0E]">
                Profile logo style
              </span>
              <span className="text-[10px] text-[#757575]">Taxi Black & Yellow</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Option 1: Black / Yellow (Black BG, Yellow text) */}
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

              {/* Option 2: Yellow / Black (Yellow BG, Black text) */}
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

          {/* Manage Links */}
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
                  Dedicated chauffeur contracts with backup guarantee
                </span>
              </div>
              <IconChevronRight size={16} className="text-[#757575]" />
            </button>
          </div>

          {/* Demo Mode Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-[#E4E4E4] pb-4">
            <div>
              <span className="text-sm font-medium text-[#0E0E0E] block">
                Demo simulation
              </span>
              <span className="text-xs text-[#757575] block mt-0.5">
                Simulate driver movement along Kolkata corridor
              </span>
            </div>
            <button
              type="button"
              onClick={toggleDemoMode}
              className={`w-12 h-7 rounded-full transition p-1 cursor-pointer flex items-center ${
                isDemoMode ? 'bg-[#0E0E0E] justify-end' : 'bg-[#E4E4E4] justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-[#FFFFFF] shadow-sm" />
            </button>
          </div>

          {/* Replay App Launch Animation */}
          <div className="flex items-center justify-between py-2 border-b border-[#E4E4E4] pb-4">
            <div>
              <span className="text-sm font-medium text-[#0E0E0E] block">
                Opening screen animation
              </span>
              <span className="text-xs text-[#757575] block mt-0.5">
                Uber-style animated brand entrance
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('replay-intro'));
              }}
              className="px-3 py-1.5 rounded-[6px] bg-[#0E0E0E] hover:bg-[#262626] text-[#FFFFFF] text-xs font-semibold transition cursor-pointer"
            >
              Play intro
            </button>
          </div>

          {/* Ola Maps Configuration */}
          <div className="space-y-2.5 p-3.5 bg-[#F6F6F6] border border-[#E4E4E4] rounded-[10px]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#0E0E0E] block">
                  Ola Maps API Integration
                </span>
                <span className="text-[11px] text-[#757575] block mt-0.5">
                  Krutrim vector tiles, places autocomplete & routing
                </span>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                  getOlaMapsApiKey()
                    ? 'bg-[#0F7B5F]/10 text-[#0F7B5F] border border-[#0F7B5F]/20'
                    : 'bg-[#FFFFFF] text-[#757575] border border-[#E4E4E4]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    getOlaMapsApiKey() ? 'bg-[#0F7B5F]' : 'bg-[#757575]'
                  }`}
                />
                {getOlaMapsApiKey() ? 'Active' : 'Fallback (OSM)'}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <input
                type="text"
                value={olaKeyInput}
                onChange={(e) => setOlaKeyInput(e.target.value)}
                placeholder="Enter or paste your Ola Maps API key..."
                className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#E4E4E4] rounded-[6px] text-xs text-[#0E0E0E] placeholder-[#757575] focus:border-[#0E0E0E] font-mono tracking-tight transition"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveOlaKey}
                  className="px-3 py-1.5 rounded-[6px] bg-[#0E0E0E] text-[#FFFFFF] text-xs font-semibold hover:bg-[#262626] transition cursor-pointer"
                >
                  Save & apply
                </button>
                {getOlaMapsApiKey() && (
                  <button
                    type="button"
                    onClick={handleClearOlaKey}
                    className="px-3 py-1.5 rounded-[6px] bg-[#FFFFFF] text-[#757575] hover:text-[#0E0E0E] border border-[#E4E4E4] text-xs font-medium transition cursor-pointer"
                  >
                    Clear key
                  </button>
                )}
              </div>

              {keySavedMsg && (
                <div className="text-[11px] font-medium text-[#0F7B5F] bg-[#FFFFFF] p-1.5 rounded border border-[#E4E4E4]">
                  {keySavedMsg}
                </div>
              )}

              <p className="text-[11px] text-[#757575] leading-normal pt-1">
                Tip: In your Krutrim Cloud Console, ensure your API key has <strong>Places & Tiles</strong> services enabled. If direct browser calls return 401 Unauthorized, verify that domain whitelisting is added or that the key is configured for web or package <code className="font-mono text-[#0E0E0E]">com.safar.app</code>.
              </p>
            </div>
          </div>

          {/* Cloud Firestore & Firebase Authentication Status */}
          <div className="space-y-3 p-3.5 bg-[#F6F6F6] border border-[#E4E4E4] rounded-[10px]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#0E0E0E] block">
                  Google Cloud Firestore & Auth
                </span>
                <span className="text-[11px] text-[#757575] block mt-0.5">
                  Real-time database, owner/driver security rules & live dispatch
                </span>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                  firestoreConnected
                    ? 'bg-[#0F7B5F]/10 text-[#0F7B5F] border border-[#0F7B5F]/20'
                    : 'bg-[#F2B705]/15 text-[#9A7204] border border-[#F2B705]/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    firestoreConnected ? 'bg-[#0F7B5F]' : 'bg-[#F2B705]'
                  }`}
                />
                {firestoreConnected ? 'Connected' : 'Reconnecting...'}
              </span>
            </div>

            <div className="space-y-2 pt-0.5">
              <div className="bg-[#FFFFFF] p-2.5 rounded-[6px] border border-[#E4E4E4] text-[11px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#757575]">Project ID:</span>
                  <span className="font-mono font-medium text-[#0E0E0E] text-[10px]">
                    {firebaseInfo.projectId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#757575]">Database ID:</span>
                  <span className="font-mono font-medium text-[#0E0E0E] text-[10px]">
                    {firebaseInfo.firestoreDatabaseId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#757575]">Firebase Auth:</span>
                  <span className="font-mono font-medium text-[#0F7B5F] text-[10px]">
                    {firebaseInfo.currentUid ? `Active (${firebaseInfo.currentUid.slice(0, 10)}...)` : 'Authenticated'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleTestFirebase}
                  disabled={testingFirebase}
                  className="px-3 py-1.5 rounded-[6px] bg-[#0E0E0E] text-[#FFFFFF] text-xs font-semibold hover:bg-[#262626] transition cursor-pointer disabled:opacity-50"
                >
                  {testingFirebase ? 'Pinging Firestore...' : 'Test Firestore connection'}
                </button>
              </div>

              {firebaseStatusMsg && (
                <div
                  className={`text-[11px] font-medium p-2 rounded border leading-tight ${
                    firebaseStatusMsg.isError
                      ? 'bg-[#C8321E]/10 border-[#C8321E]/30 text-[#C8321E]'
                      : 'bg-[#0F7B5F]/10 border-[#0F7B5F]/30 text-[#0F7B5F]'
                  }`}
                >
                  {firebaseStatusMsg.text}
                </div>
              )}

              <div className="text-[11px] text-[#757575] bg-[#FFFFFF] p-2.5 rounded-[6px] border border-[#E4E4E4] space-y-1">
                <div className="font-semibold text-[#0E0E0E]">Active Firestore Architecture:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[#757575]">
                  <li><strong>/users/{'{uid}'}</strong>: Phone auth, role profile, and preferences.</li>
                  <li><strong>/driverProfiles/{'{driverId}'}</strong>: WB licence verification, ratings, and stats.</li>
                  <li><strong>/vehicles/{'{vehicleId}'}</strong>: Owner car registration, transmission & fuel type.</li>
                  <li><strong>/rides/{'{rideId}'}</strong>: Real-time driver dispatch, GPS tracking & 4-digit OTP.</li>
                  <li><strong>/subscriptions/{'{subId}'}</strong>: Recurring chauffeur packages (weekly/monthly).</li>
                </ul>
              </div>
            </div>
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
