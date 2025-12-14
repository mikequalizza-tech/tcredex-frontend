'use client';

import { useState } from 'react';
import { IntakeData } from '../IntakeShell';

interface LocationTractProps {
  data: IntakeData;
  onChange: (data: IntakeData) => void;
}

const US_STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

const TRACT_TYPES = [
  { id: 'QCT', label: 'Qualified Census Tract', description: 'Poverty rate ≥ 20% or median income ≤ 80% AMI' },
  { id: 'SD', label: 'Severely Distressed', description: 'Poverty rate ≥ 30% (extra credit boost)' },
  { id: 'LIC', label: 'Low-Income Community', description: 'Meets NMTC eligibility thresholds' },
  { id: 'DDA', label: 'Difficult Development Area', description: 'High construction costs relative to income' },
];

export function LocationTract({ data, onChange }: LocationTractProps) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const updateField = (field: keyof IntakeData, value: any) => onChange({ ...data, [field]: value });

  const toggleTractType = (type: string) => {
    const current = data.tractType || [];
    if (current.includes(type as any)) updateField('tractType', current.filter(t => t !== type));
    else updateField('tractType', [...current, type]);
  };

  const handleLookup = async () => {
    if (!data.address || !data.city || !data.state) { alert('Please enter address, city, and state first'); return; }
    setIsLookingUp(true);
    setTimeout(() => {
      const demoTract = '17031' + Math.floor(Math.random() * 900000 + 100000).toString();
      updateField('censusTract', demoTract);
      updateField('tractType', ['QCT', 'LIC']);
      setIsLookingUp(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Project Address <span className="text-red-400">*</span></label>
        <input type="text" value={data.address || ''} onChange={(e) => updateField('address', e.target.value)} placeholder="123 Main Street"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">City <span className="text-red-400">*</span></label>
          <input type="text" value={data.city || ''} onChange={(e) => updateField('city', e.target.value)} placeholder="Chicago"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">State <span className="text-red-400">*</span></label>
          <select value={data.state || ''} onChange={(e) => updateField('state', e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Select state...</option>
            {US_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">ZIP Code <span className="text-red-400">*</span></label>
          <input type="text" value={data.zipCode || ''} onChange={(e) => updateField('zipCode', e.target.value)} placeholder="60601" maxLength={10}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
      </div>

      <div className="border-t border-gray-800 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Census Tract</h3>
            <p className="text-xs text-gray-500">Required for eligibility verification</p>
          </div>
          <button onClick={handleLookup} disabled={isLookingUp}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 border border-gray-700">
            {isLookingUp ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Looking up...
              </span>
            ) : '🔍 Lookup Tract'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Census Tract Number <span className="text-red-400">*</span></label>
            <input type="text" value={data.censusTract || ''} onChange={(e) => updateField('censusTract', e.target.value)} placeholder="e.g., 17031839100"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono" />
            <p className="text-xs text-gray-500 mt-1">11-digit FIPS code (State + County + Tract)</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-100 mb-3">Tract Qualifications</h3>
        <p className="text-xs text-gray-500 mb-4">Select all that apply. This affects eligibility and pricing.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TRACT_TYPES.map((type) => {
            const isSelected = (data.tractType || []).includes(type.id as any);
            return (
              <button key={type.id} type="button" onClick={() => toggleTractType(type.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${isSelected ? 'border-indigo-500 bg-indigo-900/30' : 'border-gray-700 hover:border-gray-600'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-500'}`}>
                    {isSelected ? '✓' : ''}
                  </span>
                  <span className={`font-medium ${isSelected ? 'text-indigo-300' : 'text-gray-200'}`}>{type.id}</span>
                  <span className="text-gray-400 text-sm">- {type.label}</span>
                </div>
                <p className="text-xs text-gray-500 ml-7">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {data.censusTract && (
        <div className="border-t border-gray-800 pt-6">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-gray-500 mb-2">🗺️</div>
            <p className="text-sm text-gray-400">Map preview for tract {data.censusTract}</p>
            <button className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium">View on Full Map →</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationTract;
