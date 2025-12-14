'use client';

import { IntakeData } from '../IntakeShell';

interface NMTC_QALICBProps {
  data: IntakeData;
  onChange: (data: IntakeData) => void;
}

const PROHIBITED_BUSINESSES = [
  'Golf course',
  'Country club',
  'Massage parlor',
  'Hot tub/suntan facility',
  'Gambling facility',
  'Liquor store',
  'Farm (raises or harvests)',
];

export function NMTC_QALICB({ data, onChange }: NMTC_QALICBProps) {
  const updateField = (field: keyof IntakeData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const testsPassing = [
    (data.qalicbGrossIncome ?? 0) >= 50,
    (data.qalicbTangibleProperty ?? 0) >= 40,
    (data.qalicbEmployeeServices ?? 0) >= 40,
    data.isProhibitedBusiness === false,
  ];

  const passCount = testsPassing.filter(Boolean).length;
  const allPass = passCount === 4;

  return (
    <div className="space-y-6">
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <p className="text-sm text-emerald-700">
          <strong>QALICB (Qualified Active Low-Income Community Business)</strong> tests determine NMTC eligibility. 
          All four tests must be met.
        </p>
      </div>

      {/* Gross Income Test */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Gross Income Test</h3>
            <p className="text-xs text-gray-500">≥50% of gross income from active business in LIC</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            (data.qalicbGrossIncome ?? 0) >= 50 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {(data.qalicbGrossIncome ?? 0) >= 50 ? 'PASS' : 'NEEDS 50%+'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            value={data.qalicbGrossIncome ?? 0}
            onChange={(e) => updateField('qalicbGrossIncome', parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <span className="w-16 text-right font-medium text-gray-900">
            {data.qalicbGrossIncome ?? 0}%
          </span>
        </div>
      </div>

      {/* Tangible Property Test */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Tangible Property Test</h3>
            <p className="text-xs text-gray-500">≥40% of tangible property used in LIC</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            (data.qalicbTangibleProperty ?? 0) >= 40 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {(data.qalicbTangibleProperty ?? 0) >= 40 ? 'PASS' : 'NEEDS 40%+'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            value={data.qalicbTangibleProperty ?? 0}
            onChange={(e) => updateField('qalicbTangibleProperty', parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <span className="w-16 text-right font-medium text-gray-900">
            {data.qalicbTangibleProperty ?? 0}%
          </span>
        </div>
      </div>

      {/* Employee Services Test */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Employee Services Test</h3>
            <p className="text-xs text-gray-500">≥40% of employee services performed in LIC</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            (data.qalicbEmployeeServices ?? 0) >= 40 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {(data.qalicbEmployeeServices ?? 0) >= 40 ? 'PASS' : 'NEEDS 40%+'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            value={data.qalicbEmployeeServices ?? 0}
            onChange={(e) => updateField('qalicbEmployeeServices', parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <span className="w-16 text-right font-medium text-gray-900">
            {data.qalicbEmployeeServices ?? 0}%
          </span>
        </div>
      </div>

      {/* Prohibited Business Test */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Prohibited Business Test</h3>
            <p className="text-xs text-gray-500">Business is not a prohibited type</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            data.isProhibitedBusiness === false ? 'bg-green-100 text-green-700' : 
            data.isProhibitedBusiness === true ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {data.isProhibitedBusiness === false ? 'PASS' : 
             data.isProhibitedBusiness === true ? 'FAIL' : 'PENDING'}
          </span>
        </div>
        
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => updateField('isProhibitedBusiness', false)}
            className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
              data.isProhibitedBusiness === false
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            ✓ Not Prohibited
          </button>
          <button
            type="button"
            onClick={() => updateField('isProhibitedBusiness', true)}
            className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
              data.isProhibitedBusiness === true
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            ✗ Is Prohibited
          </button>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-2">Prohibited business types:</p>
          <div className="flex flex-wrap gap-1">
            {PROHIBITED_BUSINESSES.map((type) => (
              <span key={type} className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Leverage Structure */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Leverage Structure</h3>
        <p className="text-xs text-gray-500 mb-4">Select your expected NMTC structure</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: 'standard', label: 'Standard Leverage', desc: 'Bank provides leverage loan' },
            { value: 'self-leverage', label: 'Self-Leverage', desc: 'Sponsor provides leverage' },
            { value: 'hybrid', label: 'Hybrid', desc: 'Combination structure' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField('leverageStructure', option.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                data.leverageStructure === option.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`font-medium text-sm ${
                data.leverageStructure === option.value ? 'text-emerald-700' : 'text-gray-900'
              }`}>
                {option.label}
              </span>
              <p className="text-xs text-gray-500">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className={`p-4 rounded-lg ${allPass ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-sm font-medium ${allPass ? 'text-green-700' : 'text-amber-700'}`}>
              {allPass ? '✓ All QALICB Tests Pass' : `${passCount}/4 Tests Pass`}
            </span>
            <p className={`text-xs ${allPass ? 'text-green-600' : 'text-amber-600'}`}>
              {allPass ? 'Project appears NMTC eligible' : 'Complete all tests to confirm eligibility'}
            </p>
          </div>
          <span className={`text-2xl font-bold ${allPass ? 'text-green-700' : 'text-amber-700'}`}>
            {passCount}/4
          </span>
        </div>
      </div>
    </div>
  );
}

export default NMTC_QALICB;
