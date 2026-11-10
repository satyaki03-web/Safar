import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const baseProps = (size = 24, strokeWidth = 1.75, className = '') => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
});

export const IconSteeringWheel: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
    <line x1="3" y1="12" x2="9" y2="12" />
    <line x1="15" y1="12" x2="21" y2="12" />
    <line x1="12" y1="15" x2="12" y2="21" />
  </svg>
);

export const IconKey: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="M10.8 12.2L20 3v4h-3v3h-3v3" />
  </svg>
);

export const IconPin: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <path d="M12 21s-7-6.5-7-11.5a7 7 0 1114 0c0 5-7 11.5-7 11.5z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export const IconClock: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15.5 14" />
  </svg>
);

export const IconShieldCheck: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <path d="M12 3L4 6.5v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10v-6L12 3z" />
    <polyline points="9 12.5 11 14.5 15.5 10" />
  </svg>
);

export const IconPhone: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
  </svg>
);

export const IconRoute: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <circle cx="6" cy="19" r="3" />
    <circle cx="18" cy="5" r="3" />
    <path d="M6 16V9a3 3 0 013-3h6a3 3 0 013 3v7" />
  </svg>
);

export const IconRupee: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <line x1="6" y1="4" x2="18" y2="4" />
    <line x1="6" y1="8.5" x2="18" y2="8.5" />
    <path d="M6 4h7a4.5 4.5 0 010 9H6l9 7" />
  </svg>
);

export const IconStar: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const IconCarSide: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <path d="M3 13l2-5h12l3 5v4H3v-4z" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <line x1="9" y1="17" x2="15" y2="17" />
    <line x1="3" y1="13" x2="20" y2="13" />
    <line x1="11" y1="8" x2="11" y2="13" />
  </svg>
);

export const IconAlert: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <polygon points="12 3 22 20 2 20 12 3" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="16.5" x2="12.01" y2="16.5" strokeWidth="2.5" />
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const IconChevronDown: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const IconChevronUp: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export const IconChevronRight: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const IconClose: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const IconUser: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 20a6.5 6.5 0 0113 0" />
  </svg>
);

export const IconSettings: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

export const IconShare: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const IconWallet: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
    <path d="M16 3H4a2 2 0 00-2 2v2" />
    <circle cx="18" cy="14" r="1.5" />
  </svg>
);

export const IconRecenter: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
  </svg>
);

export const IconMessage: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

export const IconNavigation: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

export const IconCalculator: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="16" y1="14" x2="16" y2="14.01" strokeWidth="2.5" />
    <line x1="12" y1="14" x2="12" y2="14.01" strokeWidth="2.5" />
    <line x1="8" y1="14" x2="8" y2="14.01" strokeWidth="2.5" />
    <line x1="16" y1="18" x2="16" y2="18.01" strokeWidth="2.5" />
    <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2.5" />
    <line x1="8" y1="18" x2="8" y2="18.01" strokeWidth="2.5" />
    <line x1="8" y1="10" x2="8" y2="10.01" strokeWidth="2.5" />
    <line x1="12" y1="10" x2="12" y2="10.01" strokeWidth="2.5" />
    <line x1="16" y1="10" x2="16" y2="10.01" strokeWidth="2.5" />
  </svg>
);

export const IconArrowDownUp: React.FC<IconProps> = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg {...baseProps(size, strokeWidth, className)} {...props}>
    <path d="M7 3v18" />
    <path d="M3 7l4-4 4 4" />
    <path d="M17 21V3" />
    <path d="M21 17l-4 4-4-4" />
  </svg>
);

