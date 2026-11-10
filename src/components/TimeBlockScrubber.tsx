import React from 'react';

interface TimeBlockScrubberProps {
  startHour: number; // 0 to 24 (e.g. 9.5 = 9:30 AM)
  endHour: number; // 0 to 24 (e.g. 13.5 = 1:30 PM)
  onChange: (start: number, end: number) => void;
}

export const TimeBlockScrubber: React.FC<TimeBlockScrubberProps> = ({ startHour, endHour, onChange }) => {
  const duration = Math.max(1, endHour - startHour);

  const formatHour = (hour: number) => {
    const totalMinutes = Math.round(hour * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = parseFloat(e.target.value);
    if (newStart < endHour - 0.75) {
      onChange(newStart, endHour);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = parseFloat(e.target.value);
    if (newEnd > startHour + 0.75) {
      onChange(startHour, newEnd);
    }
  };

  const startPercent = (startHour / 24) * 100;
  const endPercent = (endHour / 24) * 100;
  const widthPercent = endPercent - startPercent;

  return (
    <div className="bg-[#FFFFFF] border border-[#E4E4E4] rounded-[8px] p-3.5 select-none space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[12px] font-medium text-[#757575] block">
            Time window
          </span>
          <div className="text-sm font-semibold text-[#0E0E0E] font-tabular">
            {formatHour(startHour)} – {formatHour(endHour)}
          </div>
        </div>

        <span className="text-xs font-semibold text-[#0E0E0E] font-tabular bg-[#F6F6F6] px-2.5 py-1 rounded-full border border-[#E4E4E4]">
          {duration.toFixed(duration % 1 === 0 ? 0 : 2)} hours
        </span>
      </div>

      {/* Visual Timeline Track */}
      <div className="relative h-7 bg-[#F6F6F6] rounded-[6px] border border-[#E4E4E4] overflow-hidden">
        {/* Selected Active Block */}
        <div
          className="absolute top-0 bottom-0 bg-[#0E0E0E] rounded-[4px]"
          style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
        />
      </div>

      {/* Sliders for Start and End */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-10 text-[11px] text-[#757575]">Start:</span>
          <input
            type="range"
            min={0}
            max={23.5}
            step={0.25}
            value={startHour}
            onChange={handleStartChange}
            className="w-full accent-[#0E0E0E]"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-10 text-[11px] text-[#757575]">End:</span>
          <input
            type="range"
            min={0.5}
            max={24}
            step={0.25}
            value={endHour}
            onChange={handleEndChange}
            className="w-full accent-[#0E0E0E]"
          />
        </div>
      </div>
    </div>
  );
};
