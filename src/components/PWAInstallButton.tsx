import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { IconClose } from './Icons';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`h-9 px-3 rounded-full bg-[#0E0E0E] text-[#FFFFFF] text-xs font-medium transition cursor-pointer ${className}`}
      >
        Install app
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`h-9 px-3 rounded-full border border-[#E4E4E4] bg-[#FFFFFF] text-xs font-medium text-[#0E0E0E] transition cursor-pointer ${className}`}
        >
          Install app
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#0E0E0E]/40 p-4">
            <div className="w-full max-w-sm rounded-[12px] bg-[#FFFFFF] p-5 border border-[#E4E4E4] shadow-floating">
              <div className="flex items-center justify-between border-b border-[#E4E4E4] pb-3 mb-3">
                <h3 className="text-[16px] font-semibold text-[#0E0E0E]">Install Safar on iOS</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-[#757575] hover:text-[#0E0E0E] p-1 cursor-pointer"
                >
                  <IconClose size={18} />
                </button>
              </div>
              <ol className="text-sm text-[#0E0E0E] space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <span className="font-tabular font-semibold text-xs bg-[#F6F6F6] border border-[#E4E4E4] px-1.5 py-0.5 rounded-[4px]">1</span>
                  <span>Tap <strong>Share</strong> in the Safari bottom toolbar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-tabular font-semibold text-xs bg-[#F6F6F6] border border-[#E4E4E4] px-1.5 py-0.5 rounded-[4px]">2</span>
                  <span>Select <strong>Add to Home Screen</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-tabular font-semibold text-xs bg-[#F6F6F6] border border-[#E4E4E4] px-1.5 py-0.5 rounded-[4px]">3</span>
                  <span>Tap <strong>Add</strong> to use Safar full-screen.</span>
                </li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="btn-primary w-full text-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
