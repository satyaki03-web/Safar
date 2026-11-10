import React from 'react';
import { UserAvatar } from './UserAvatar';

interface NavbarProps {
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenProfile }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E4E4E4] h-14 px-4 md:px-6 flex items-center justify-between select-none">
      {/* Safar Wordmark */}
      <div className="flex items-center gap-1.5">
        <span className="font-display font-bold text-[22px] tracking-tight text-[#0E0E0E]">
          Safar
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#F2B705] mt-1" />
      </div>

      {/* Right: Punchy Black & Yellow Avatar Button */}
      <button
        type="button"
        onClick={onOpenProfile}
        className="focus:outline-none rounded-full cursor-pointer transition active:scale-95"
        aria-label="Account and Profile"
      >
        <UserAvatar size="md" variant="black-on-yellow" showRoleBadge />
      </button>
    </header>
  );
};
