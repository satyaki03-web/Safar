import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  DayOfWeek,
  DailyDutyHours,
  SubscriptionPlanType,
  LocationPoint,
} from '../types';
import {
  calculateSubscriptionQuote,
  formatRupee,
  DAY_CONFIG,
  PRESET_MON_TO_FRI,
  PRESET_ALL_WEEK,
} from '../utils/fare';
import {
  IconClose,
  IconPin,
  IconClock,
  IconCarSide,
  IconCheck,
  IconChevronRight,
  IconPhone,
  IconUser,
} from './Icons';
import { LocationSearchModal } from './LocationSearchModal';

interface SubscriptionBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVehicles: () => void;
}

export const SubscriptionBookingModal: React.FC<SubscriptionBookingModalProps> = ({
  isOpen,
  onClose,
  onOpenVehicles,
}) => {
  const {
    user,
    vehicles,
    selectedVehicle,
    createSubscriptionBooking,
  } = useApp();

  // Plan Type: 'week' | 'month' | 'custom_days'
  const [planType, setPlanType] = useState<SubscriptionPlanType>('month');

  // Days of week
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([...PRESET_MON_TO_FRI]);

  // Duration multipliers
  const [durationValue, setDurationValue] = useState<number>(1); // 1 month or 1 week

  // Daily Duty Hours: 4, 8, 10, 12
  const [dailyDutyHours, setDailyDutyHours] = useState<DailyDutyHours>(8);

  // Daily Reporting Time
  const [dailyStartTime, setDailyStartTime] = useState<string>('09:00 AM');

  // Start Date (Defaults to tomorrow)
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  // Pickup location (Default to Salt Lake Sector V or owner's default)
  const [pickupLocation, setPickupLocation] = useState<LocationPoint>({
    address: 'Salt Lake Sector V, Near College More, Kolkata',
    area: 'Salt Lake',
    lat: 22.5735,
    lng: 88.4331,
  });

  // Driver preferences brief
  const [acPreference, setAcPreference] = useState<'full' | 'eco' | 'windows'>('full');
  const [musicPreference, setMusicPreference] = useState<'silent' | 'low' | 'owner_choice'>('owner_choice');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  // Search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Current car
  const currentCar = selectedVehicle || vehicles[0] || {
    id: 'default_car',
    make: 'Tata',
    model: 'Nexon',
    year: 2023,
    registrationNumber: 'WB 06 H 4210',
    transmission: 'manual' as const,
    fuelType: 'diesel' as const,
  };

  // Toggle day
  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev; // Keep at least one day
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  // Quick preset handlers
  const handleSelectMonToFri = () => {
    setSelectedDays([...PRESET_MON_TO_FRI]);
  };

  const handleSelectAllDays = () => {
    setSelectedDays([...PRESET_ALL_WEEK]);
  };

  // Calculate quote
  const quote = useMemo(() => {
    return calculateSubscriptionQuote({
      planType,
      selectedDays,
      dailyDutyHours,
      weeksCount: planType === 'week' ? durationValue : undefined,
      monthsCount: planType === 'month' ? durationValue : undefined,
    });
  }, [planType, selectedDays, dailyDutyHours, durationValue]);

  // End Date estimation
  const calculatedEndDate = useMemo(() => {
    const d = new Date(startDate);
    const daysToAdd = planType === 'month' ? durationValue * 30 : durationValue * 7;
    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().split('T')[0];
  }, [startDate, planType, durationValue]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createSubscriptionBooking({
        planType,
        selectedDays,
        startDate,
        endDate: calculatedEndDate,
        totalDays: planType === 'month' ? durationValue * 30 : durationValue * 7,
        workingDaysCount: quote.workingDaysCount,
        dailyDutyHours,
        dailyStartTime,
        perDayRate: quote.dailyRate,
        discountPercent: quote.discountPercent,
        subtotal: quote.subtotal,
        savings: quote.savingsVsHourly,
        totalFare: quote.totalFare,
        vehicleId: currentCar.id,
        pickupLocation,
        driverBrief: {
          acPreference,
          musicPreference,
          specialInstructions: specialInstructions.trim() || undefined,
        },
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Could not create subscription booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="w-full sm:w-[520px] max-h-[94vh] sm:max-h-[680px] bg-[#FFFFFF] rounded-t-3xl sm:rounded-2xl border-t sm:border border-[#E4E4E4] shadow-2xl flex flex-col overflow-hidden pb-safe">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-[#E4E4E4] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-4.5 border-b border-[#E4E4E4] flex items-center justify-between shrink-0 bg-[#FFFFFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0E0E0E] text-[#F2B705] flex items-center justify-center font-bold text-sm shrink-0">
              📅
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[#0E0E0E] font-display leading-tight">
                Book a recurring driver
              </h3>
              <p className="text-[11px] text-[#757575] leading-none mt-0.5">
                Hire a dedicated driver for weeks or months (e.g. Mon–Fri)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] text-[#0E0E0E] flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Success Splash */}
        {bookingSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3.5 my-auto">
            <div className="w-14 h-14 rounded-full bg-[#0F7B5F] text-[#FFFFFF] flex items-center justify-center text-2xl shadow-lg animate-bounce">
              ✓
            </div>
            <h4 className="text-xl font-bold text-[#0E0E0E] font-display">
              Driver Contract Confirmed!
            </h4>
            <p className="text-xs text-[#757575] max-w-xs leading-relaxed">
              Your dedicated verified chauffeur has been assigned for <strong>{quote.workingDaysCount} scheduled days</strong>. They will arrive at {dailyStartTime} on schedule.
            </p>
            <div className="text-xs font-semibold text-[#0F7B5F] bg-[#0F7B5F]/10 px-3 py-1.5 rounded-full border border-[#0F7B5F]/20">
              Contract active • Replacement chauffeur guaranteed
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* Plan Duration Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0E0E0E] block">
                Select booking duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Mon-Fri Month Option */}
                <button
                  type="button"
                  onClick={() => {
                    setPlanType('month');
                    setSelectedDays([...PRESET_MON_TO_FRI]);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                    planType === 'month' && selectedDays.length === 5
                      ? 'border-[#0E0E0E] bg-[#0E0E0E] text-[#FFFFFF] shadow-sm'
                      : 'border-[#E4E4E4] bg-[#F6F6F6] text-[#0E0E0E] hover:border-[#0E0E0E]'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-[#F2B705] block">
                    Save 22%
                  </span>
                  <span className="text-xs font-semibold block leading-tight mt-0.5">
                    1 Month (Mon–Fri)
                  </span>
                  <span className={`text-[10px] block mt-0.5 ${planType === 'month' && selectedDays.length === 5 ? 'text-[#D1D5DB]' : 'text-[#757575]'}`}>
                    ~22 working days
                  </span>
                </button>

                {/* 1 Week Option */}
                <button
                  type="button"
                  onClick={() => {
                    setPlanType('week');
                    setSelectedDays([...PRESET_MON_TO_FRI]);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                    planType === 'week'
                      ? 'border-[#0E0E0E] bg-[#0E0E0E] text-[#FFFFFF] shadow-sm'
                      : 'border-[#E4E4E4] bg-[#F6F6F6] text-[#0E0E0E] hover:border-[#0E0E0E]'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-[#F2B705] block">
                    Save 12%
                  </span>
                  <span className="text-xs font-semibold block leading-tight mt-0.5">
                    1 Week Pass
                  </span>
                  <span className={`text-[10px] block mt-0.5 ${planType === 'week' ? 'text-[#D1D5DB]' : 'text-[#757575]'}`}>
                    5 or 7 days
                  </span>
                </button>

                {/* Full Month (All Days) */}
                <button
                  type="button"
                  onClick={() => {
                    setPlanType('month');
                    setSelectedDays([...PRESET_ALL_WEEK]);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                    planType === 'month' && selectedDays.length === 7
                      ? 'border-[#0E0E0E] bg-[#0E0E0E] text-[#FFFFFF] shadow-sm'
                      : 'border-[#E4E4E4] bg-[#F6F6F6] text-[#0E0E0E] hover:border-[#0E0E0E]'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-[#F2B705] block">
                    Full 24/7
                  </span>
                  <span className="text-xs font-semibold block leading-tight mt-0.5">
                    1 Month (7 Days)
                  </span>
                  <span className={`text-[10px] block mt-0.5 ${planType === 'month' && selectedDays.length === 7 ? 'text-[#D1D5DB]' : 'text-[#757575]'}`}>
                    30 continuous days
                  </span>
                </button>
              </div>
            </div>

            {/* Days of Week Selector */}
            <div className="space-y-1.5 p-3 rounded-xl bg-[#F6F6F6] border border-[#E4E4E4]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#0E0E0E] block">
                    Duty days of the week
                  </span>
                  <span className="text-[10px] text-[#757575]">
                    Driver reports only on selected days
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectMonToFri}
                    className="text-[10px] font-semibold text-[#0E0E0E] underline cursor-pointer hover:text-[#F2B705]"
                  >
                    Mon–Fri
                  </button>
                  <span className="text-[#E4E4E4]">•</span>
                  <button
                    type="button"
                    onClick={handleSelectAllDays}
                    className="text-[10px] font-semibold text-[#0E0E0E] underline cursor-pointer hover:text-[#F2B705]"
                  >
                    All 7
                  </button>
                </div>
              </div>

              {/* 7 Days Button Row */}
              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as DayOfWeek[]).map((d) => {
                  const isSelected = selectedDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`h-9 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition cursor-pointer border ${
                        isSelected
                          ? 'bg-[#0E0E0E] text-[#FFFFFF] border-[#0E0E0E] shadow-2xs'
                          : 'bg-[#FFFFFF] text-[#757575] border-[#E4E4E4] hover:text-[#0E0E0E]'
                      }`}
                      title={DAY_CONFIG[d]?.label}
                    >
                      <span className="text-[11px] uppercase">{DAY_CONFIG[d]?.short}</span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-[#0F7B5F] font-medium pt-0.5">
                ✓ {selectedDays.length} days/week selected ({selectedDays.map((d) => DAY_CONFIG[d]?.short).join(', ')})
              </div>
            </div>

            {/* Daily Shift Duty Hours */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#0E0E0E]">
                  Daily shift hours
                </label>
                <span className="text-[11px] text-[#757575]">
                  Overtime @ ₹150/hr
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#F6F6F6] border border-[#E4E4E4] rounded-xl">
                {[
                  { hours: 4 as DailyDutyHours, label: '4 hrs', sub: '₹580/day' },
                  { hours: 8 as DailyDutyHours, label: '8 hrs', sub: '₹950/day' },
                  { hours: 10 as DailyDutyHours, label: '10 hrs', sub: '₹1,150/day' },
                  { hours: 12 as DailyDutyHours, label: '12 hrs', sub: '₹1,350/day' },
                ].map((item) => (
                  <button
                    key={item.hours}
                    type="button"
                    onClick={() => setDailyDutyHours(item.hours)}
                    className={`py-2 px-1 rounded-lg text-center transition cursor-pointer ${
                      dailyDutyHours === item.hours
                        ? 'bg-[#0E0E0E] text-[#FFFFFF] shadow-sm font-semibold'
                        : 'text-[#757575] hover:text-[#0E0E0E]'
                    }`}
                  >
                    <span className="text-xs block font-bold leading-none">{item.label}</span>
                    <span className={`text-[10px] block mt-1 leading-none ${dailyDutyHours === item.hours ? 'text-[#F2B705]' : 'text-[#757575]'}`}>
                      {item.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Shift Timing & Start Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Daily reporting time */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0E0E0E] block">
                  Daily reporting time
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={dailyStartTime}
                    onChange={(e) => setDailyStartTime(e.target.value)}
                    className="w-full h-10 px-3 bg-[#F6F6F6] border border-[#E4E4E4] rounded-xl text-xs font-semibold text-[#0E0E0E] focus:bg-[#FFFFFF] focus:border-[#0E0E0E]"
                  >
                    <option value="07:00 AM">07:00 AM (Early commute)</option>
                    <option value="08:00 AM">08:00 AM</option>
                    <option value="08:30 AM">08:30 AM</option>
                    <option value="09:00 AM">09:00 AM (Corporate standard)</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM (Afternoon shift)</option>
                  </select>
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0E0E0E] block">
                  Starting date
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-3 bg-[#F6F6F6] border border-[#E4E4E4] rounded-xl text-xs font-tabular font-medium text-[#0E0E0E] focus:bg-[#FFFFFF] focus:border-[#0E0E0E]"
                />
              </div>
            </div>

            {/* Reporting Address / Pickup Location */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#0E0E0E]">
                  Driver reporting address
                </label>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="text-[11px] font-semibold text-[#0E0E0E] underline cursor-pointer hover:text-[#F2B705]"
                >
                  Change address
                </button>
              </div>

              <div
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 rounded-xl bg-[#F6F6F6] hover:bg-[#FFFFFF] border border-[#E4E4E4] hover:border-[#0E0E0E] flex items-center justify-between gap-2.5 cursor-pointer transition group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] flex items-center justify-center shrink-0 text-[#0E0E0E]">
                    <IconPin size={13} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-[#0E0E0E] truncate block">
                      {pickupLocation.address}
                    </span>
                    <span className="text-[10px] text-[#757575] block">
                      {pickupLocation.area}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-[#757575] group-hover:text-[#0E0E0E] underline shrink-0">
                  Edit
                </span>
              </div>
            </div>

            {/* Selected Car Row */}
            <div
              onClick={onOpenVehicles}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#F6F6F6] hover:bg-[#EAEAEA] border border-[#E4E4E4] text-xs text-[#0E0E0E] cursor-pointer transition group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#FFFFFF] border border-[#E4E4E4] flex items-center justify-center shrink-0 text-[#0E0E0E]">
                  <IconCarSide size={14} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-medium text-[#757575] block leading-none">Vehicle assigned</span>
                  <span className="text-xs font-semibold text-[#0E0E0E] truncate block mt-0.5">
                    {currentCar.make} {currentCar.model} ({currentCar.registrationNumber}) • {currentCar.transmission}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#0E0E0E] bg-[#FFFFFF] border border-[#E4E4E4] group-hover:border-[#0E0E0E] px-2.5 py-1 rounded-full shrink-0 transition">
                Change
              </span>
            </div>

            {/* Safar Chauffeur Guarantees Banner */}
            <div className="p-3 bg-[#FFFFFF] border border-[#E4E4E4] rounded-xl space-y-1.5 shadow-xs">
              <span className="text-[11px] font-bold text-[#0E0E0E] uppercase tracking-wider block">
                Contract Inclusions & Guarantees
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[#0F7B5F] font-semibold">
                  <IconCheck size={14} className="shrink-0" />
                  <span>Verified Chauffeur</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#0F7B5F] font-semibold">
                  <IconCheck size={14} className="shrink-0" />
                  <span>Free Backup Replacement</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#0F7B5F] font-semibold">
                  <IconCheck size={14} className="shrink-0" />
                  <span>₹5 Lakh Personal Cover</span>
                </div>
              </div>
            </div>

            {/* Dynamic Fare & Savings Ledger */}
            <div className="p-3.5 bg-[#F6F6F6] border border-[#E4E4E4] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-[#757575]">
                <span>Rate ({quote.workingDaysCount} days @ {formatRupee(quote.dailyRate)}/day)</span>
                <span className="font-tabular font-medium text-[#0E0E0E]">{formatRupee(quote.subtotal)}</span>
              </div>

              {quote.discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-[#0F7B5F] font-semibold">
                  <span>Package plan discount ({quote.discountPercent}%)</span>
                  <span className="font-tabular">−{formatRupee(quote.discountAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-[#757575]">
                <span>Verified driver cover & backup insurance</span>
                <span className="font-tabular font-medium text-[#0E0E0E]">+{formatRupee(quote.insuranceAndSupportFee)}</span>
              </div>

              <div className="border-t border-[#E4E4E4] pt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0E0E0E] block">
                    Total package price
                  </span>
                  <span className="text-[10px] text-[#0F7B5F] font-semibold">
                    Save ~{formatRupee(quote.savingsVsHourly)} vs hourly daily bookings
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-bold text-[#0E0E0E] font-tabular">
                  {formatRupee(quote.totalFare)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full h-12 text-sm font-semibold gap-2 shadow-floating"
              >
                {isSubmitting ? (
                  <span>Assigning dedicated chauffeur...</span>
                ) : (
                  <>
                    <span>Confirm {planType === 'month' ? 'Monthly' : 'Weekly'} Chauffeur</span>
                    <span className="text-[#F2B705] font-tabular">• {formatRupee(quote.totalFare)}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Embedded Location Search Modal */}
      <LocationSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        title="Driver daily reporting address"
        currentAddress={pickupLocation.address}
        onSelectLocation={(point) => {
          setPickupLocation(point);
          setIsSearchOpen(false);
        }}
      />
    </div>
  );
};
