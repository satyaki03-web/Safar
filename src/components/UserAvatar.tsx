import React from 'react';
import { useApp } from '../context/AppContext';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'yellow-on-black' | 'black-on-yellow';
  className?: string;
  onClick?: () => void;
  showRoleBadge?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  size = 'md',
  variant = 'black-on-yellow',
  className = '',
  onClick,
  showRoleBadge = false,
}) => {
  const { user, activeRole, isOnline, driverProfile } = useApp();

  const [activeVariant, setActiveVariant] = React.useState<'black-bg' | 'yellow-bg'>(() => {
    try {
      const stored = localStorage.getItem('safar_avatar_variant');
      if (stored === 'yellow-bg' || stored === 'black-on-yellow') return 'yellow-bg';
      if (stored === 'black-bg' || stored === 'yellow-on-black') return 'black-bg';
    } catch {}
    return 'black-bg'; // Default to Black/Yellow
  });

  React.useEffect(() => {
    const handleVariantChange = (e: any) => {
      const v = e.detail?.variant;
      if (v === 'black-bg' || v === 'yellow-on-black') {
        setActiveVariant('black-bg');
      } else if (v === 'yellow-bg' || v === 'black-on-yellow') {
        setActiveVariant('yellow-bg');
      }
    };
    window.addEventListener('avatar-variant-changed', handleVariantChange);
    return () => window.removeEventListener('avatar-variant-changed', handleVariantChange);
  }, []);

  // Functional online status:
  // For Driver role: check driverProfile?.isOnline AND network connectivity (isOnline)
  // For Owner role: check network connectivity (isOnline)
  const isCurrentlyOnline = React.useMemo(() => {
    if (!isOnline) return false;
    if (activeRole === 'driver') {
      return Boolean(driverProfile?.isOnline);
    }
    return true;
  }, [isOnline, activeRole, driverProfile?.isOnline]);

  const initials = React.useMemo(() => {
    if (!user?.name) return 'SD';
    const parts = user.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user?.name]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-[13px]',
    lg: 'w-12 h-12 text-base',
  }[size];

  // black-bg: Black background, Yellow text and border
  // yellow-bg: Yellow background, Black text and border
  const variantClasses = activeVariant === 'black-bg'
    ? 'bg-[#0E0E0E] text-[#F2B705] border-2 border-[#F2B705] shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
    : 'bg-[#F2B705] text-[#0E0E0E] border-2 border-[#0E0E0E] shadow-[0_2px_8px_rgba(242,183,5,0.4)]';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative inline-flex items-center justify-center rounded-full font-display font-extrabold select-none transition-all duration-150 ${sizeClasses} ${variantClasses} ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 hover:shadow-md' : ''
      } ${className}`}
      title={user?.name ? `${user.name} (${activeRole}) • ${isCurrentlyOnline ? 'Online' : 'Offline'}` : 'Account profile'}
    >
      {activeRole === 'driver' && driverProfile?.photoUrl ? (
        <img
          src={driverProfile.photoUrl}
          alt={user?.name || 'Driver'}
          className="w-full h-full object-cover rounded-full pointer-events-none"
        />
      ) : (
        <span className="tracking-tight leading-none pointer-events-none">
          {initials}
        </span>
      )}

      {showRoleBadge && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#FFFFFF] transition-colors duration-300 shadow-sm ${
            isCurrentlyOnline ? 'bg-[#0F7B5F]' : 'bg-[#C8321E]'
          }`}
          title={isCurrentlyOnline ? 'Status: Online' : 'Status: Offline'}
        />
      )}
    </div>
  );
};
