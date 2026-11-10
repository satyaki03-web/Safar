import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TransmissionType, FuelType } from '../types';
import { IconClose, IconCheck } from './Icons';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({ isOpen, onClose }) => {
  const { vehicles, selectedVehicle, selectVehicle, addVehicle } = useApp();

  const [isAddingNew, setIsAddingNew] = useState(vehicles.length === 0);
  const [make, setMake] = useState('Tata');
  const [model, setModel] = useState('Nexon');
  const [year, setYear] = useState(2023);
  const [registrationNumber, setRegistrationNumber] = useState('WB 06 H 4210');
  const [transmission, setTransmission] = useState<TransmissionType>('manual');
  const [fuelType, setFuelType] = useState<FuelType>('diesel');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addVehicle({
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        registrationNumber: registrationNumber.toUpperCase().trim(),
        transmission,
        fuelType,
      });
      setIsAddingNew(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#FFFFFF] border-t sm:border border-[#E4E4E4] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-safe">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-[#E4E4E4] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:py-4 border-b border-[#E4E4E4] shrink-0">
          <h3 className="text-[18px] font-semibold text-[#0E0E0E] font-display">
            {isAddingNew ? 'Add a vehicle' : 'Your vehicles'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E4E4E4] text-[#0E0E0E] flex items-center justify-center transition cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {!isAddingNew ? (
            <div className="space-y-4">
              <p className="text-xs text-[#757575]">
                Select the car you want the hired driver to operate.
              </p>

              <div className="space-y-2">
                {vehicles.map((v) => {
                  const isSelected = selectedVehicle?.id === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => selectVehicle(v)}
                      className={`p-3.5 rounded-[8px] border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'border-[#0E0E0E] bg-[#F6F6F6]'
                          : 'border-[#E4E4E4] bg-[#FFFFFF] hover:border-[#0E0E0E]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#0E0E0E]">
                            {v.make} {v.model}
                          </span>
                          <span className="text-[11px] uppercase font-medium text-[#757575]">
                            {v.transmission}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[#757575]">
                          <span className="font-medium text-[#0E0E0E]">
                            {v.registrationNumber}
                          </span>
                          <span>• {v.year}</span>
                          <span className="uppercase">• {v.fuelType}</span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#0E0E0E] bg-[#0E0E0E] text-[#FFFFFF]'
                            : 'border-[#E4E4E4] bg-[#FFFFFF]'
                        }`}
                      >
                        {isSelected && <IconCheck size={12} strokeWidth={2.5} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="btn-secondary w-full text-xs"
                >
                  Add another car
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary w-full"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-[#757575] mb-1">Make</label>
                    <select
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E4E4E4] rounded-[8px] bg-[#F6F6F6] text-xs font-medium text-[#0E0E0E]"
                    >
                      <option value="Maruti Suzuki">Maruti Suzuki</option>
                      <option value="Hyundai">Hyundai</option>
                      <option value="Tata Motors">Tata Motors</option>
                      <option value="Honda">Honda</option>
                      <option value="Mahindra">Mahindra</option>
                      <option value="Kia">Kia</option>
                      <option value="Toyota">Toyota</option>
                      <option value="Volkswagen">Volkswagen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#757575] mb-1">Model</label>
                    <input
                      type="text"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E4E4E4] rounded-[8px] bg-[#F6F6F6] text-xs text-[#0E0E0E]"
                      placeholder="e.g. Swift / Nexon"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-[#757575] mb-1">Year</label>
                    <input
                      type="number"
                      required
                      min={2005}
                      max={2026}
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#E4E4E4] rounded-[8px] bg-[#F6F6F6] text-xs font-tabular text-[#0E0E0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#757575] mb-1">Registration number</label>
                    <input
                      type="text"
                      required
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E4E4E4] rounded-[8px] bg-[#F6F6F6] text-xs text-[#0E0E0E]"
                      placeholder="WB 02 AB 1234"
                    />
                  </div>
                </div>

                {/* Transmission */}
                <div>
                  <label className="block text-xs font-medium text-[#757575] mb-1.5">Transmission</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTransmission('manual')}
                      className={`h-10 text-xs font-medium rounded-[8px] border transition ${
                        transmission === 'manual'
                          ? 'border-[#0E0E0E] bg-[#0E0E0E] text-[#FFFFFF]'
                          : 'border-[#E4E4E4] bg-[#FFFFFF] text-[#757575]'
                      }`}
                    >
                      Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransmission('automatic')}
                      className={`h-10 text-xs font-medium rounded-[8px] border transition ${
                        transmission === 'automatic'
                          ? 'border-[#0E0E0E] bg-[#0E0E0E] text-[#FFFFFF]'
                          : 'border-[#E4E4E4] bg-[#FFFFFF] text-[#757575]'
                      }`}
                    >
                      Automatic
                    </button>
                  </div>
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="block text-xs font-medium text-[#757575] mb-1.5">Fuel type</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['petrol', 'diesel', 'cng', 'ev'] as FuelType[]).map((ft) => (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => setFuelType(ft)}
                        className={`py-2 text-xs uppercase font-medium rounded-[8px] border transition ${
                          fuelType === ft
                            ? 'border-[#0E0E0E] bg-[#0E0E0E] text-[#FFFFFF]'
                            : 'border-[#E4E4E4] bg-[#FFFFFF] text-[#757575]'
                        }`}
                      >
                        {ft}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full"
                >
                  {saving ? 'Saving...' : 'Save vehicle'}
                </button>
                {vehicles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="btn-secondary w-full text-xs"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
