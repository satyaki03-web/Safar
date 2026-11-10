import React, { useEffect, useState } from 'react';

interface AnimatedOpeningScreenProps {
  onFinish: () => void;
  onRevealStart?: () => void;
  durationMs?: number;
}

export const AnimatedOpeningScreen: React.FC<AnimatedOpeningScreenProps> = ({
  onFinish,
  onRevealStart,
  durationMs = 3600,
}) => {
  // 'intro': Holding stage with centered white wordmark & pulsing dot
  // 'transitioning': Luxurious 1400ms smooth morphing stage where logo glides up & background dissolves smoothly
  // 'done': Complete and unmounted
  const [phase, setPhase] = useState<'intro' | 'transitioning' | 'done'>('intro');

  useEffect(() => {
    // Phase 1 -> Phase 2: Start smooth slow morph & backdrop fade at 2200ms
    const transitionTimer = setTimeout(() => {
      setPhase('transitioning');
      onRevealStart?.();
    }, 2200);

    // Phase 2 -> Phase 3: Seamless finish and handover at durationMs (3600ms)
    const finishTimer = setTimeout(() => {
      setPhase('done');
      onFinish();
    }, durationMs);

    return () => {
      clearTimeout(transitionTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish, onRevealStart]);

  if (phase === 'done') return null;

  const isTransitioning = phase === 'transitioning';

  return (
    <div
      onClick={() => {
        setPhase('done');
        onFinish();
      }}
      className={`fixed inset-0 z-[3000] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-[1400ms] ease-lux ${
        isTransitioning
          ? 'opacity-0 pointer-events-none'
          : 'opacity-100 bg-[#0E0E0E]'
      }`}
      style={{
        backgroundColor: isTransitioning ? 'transparent' : '#0E0E0E',
      }}
      aria-label="Safar Opening Screen"
    >
      {/* Background radial taxi ambient illumination */}
      <div
        className={`absolute w-[440px] h-[440px] rounded-full bg-[#F2B705]/8 blur-[140px] pointer-events-none transition-opacity duration-1000 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Main Animated Brand Centerpiece */}
      <div
        className={`relative flex flex-col items-center justify-center text-center px-6 transition-all duration-[1400ms] ease-lux ${
          isTransitioning
            ? '-translate-y-[36vh] scale-[0.46] opacity-0'
            : 'translate-y-0 scale-100 opacity-100'
        }`}
      >
        {/* Brand Name Lockup */}
        <div className="flex items-baseline justify-center gap-2.5 animate-uber-intro">
          <span className="font-display font-extrabold text-[56px] sm:text-[68px] tracking-tight text-[#FFFFFF] leading-none drop-shadow-sm">
            Safar
          </span>
          {/* Punchy Taxi Yellow Signature Dot */}
          <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-[#F2B705] animate-yellow-dot shadow-[0_0_14px_rgba(242,183,5,0.75)] shrink-0" />
        </div>

        {/* Dynamic Expanding Mobility Accent Bar */}
        <div
          className={`mt-4 h-[3px] rounded-full bg-[#F2B705] animate-uber-line shadow-[0_0_8px_rgba(242,183,5,0.5)] transition-opacity duration-500 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Minimal Subtitle */}
        <div
          className={`mt-4 space-y-1 transition-opacity duration-500 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <p className="text-xs sm:text-sm font-medium text-[#E4E4E4] tracking-wide font-sans-ui opacity-90">
            Hire a driver by the hour
          </p>
          <p className="text-[11px] text-[#757575] font-tabular tracking-wider uppercase">
            Kolkata • 22.5726° N, 88.3639° E
          </p>
        </div>
      </div>

      {/* Subtle Skip Prompt */}
      <div
        className={`absolute bottom-8 left-0 right-0 text-center transition-opacity duration-500 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <span className="text-[11px] text-[#757575] hover:text-[#E4E4E4] transition cursor-pointer">
          Tap anywhere to skip
        </span>
      </div>
    </div>
  );
};
