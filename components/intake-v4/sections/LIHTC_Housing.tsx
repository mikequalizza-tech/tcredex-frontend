'use client';

import { IntakeData } from '../IntakeShell';

interface LIHTC_HousingProps {
  data: IntakeData;
  onChange: (data: IntakeData) => void;
}

export function LIHTC_Housing({ data, onChange }: LIHTC_HousingProps) {
  const updateField = (field: keyof IntakeData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const affordablePct = data.totalUnits && data.totalUnits > 0 && data.affordableUnits
    ? Math.round((data.affordableUnits / data.totalUnits) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-700">
          <strong>Low-Income Housing Tax Credit (LIHTC)</strong> provides 9% or 4% credits over 10 years 
          for developing affordable rental housing for households at or below 60% AMI.
        </p>
      </div>

      {/* Credit Type */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">LIHTC Type <span className="text-red-500">*</span></h3>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => updateField('lihtcType', '9%')}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              data.lihtcType === '9%'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-lg font-bold ${data.lihtcType === '9%' ? 'text-purple-700' : 'text-gray-900'}`}>
                9% Credit
              </span>
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">Competitive</span>
            </div>
            <p className="text-xs text-gray-500">
              Higher credit rate, competitive allocation through state HFA
            </p>
          </button>

          <button
            type="button"
            onClick={() => updateField('lihtcType', '4%')}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              data.lihtcType === '4%'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-lg font-bold ${data.lihtcType === '4%' ? 'text-purple-700' : 'text-gray-900'}`}>
                4% Credit
              </span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">Bond-Financed</span>
            </div>
            <p className="text-xs text-gray-500">
              Lower credit rate, paired with tax-exempt bonds
            </p>
          </button>
        </div>
      </div>

      {/* Unit Mix */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Unit Mix</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Units <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={data.totalUnits || ''}
              onChange={(e) => updateField('totalUnits', parseInt(e.target.value) || undefined)}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Affordable Units <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={data.affordableUnits || ''}
              onChange={(e) => updateField('affordableUnits', parseInt(e.target.value) || undefined)}
              placeholder="0"
              max={data.totalUnits || undefined}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Affordable %
            </label>
            <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
              <span className={`text-lg font-bold ${affordablePct >= 100 ? 'text-purple-700' : 'text-gray-700'}`}>
                {affordablePct}%
              </span>
            </div>
          </div>
        </div>

        {/* Affordability bar */}
        {data.totalUnits && data.totalUnits > 0 && (
          <div className="mt-4">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(affordablePct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>100% Affordable</span>
            </div>
          </div>
        )}
      </div>

      {/* AMI Targeting */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Income Targeting</h3>
        <p className="text-xs text-gray-500 mb-4">Select all AMI levels you're targeting</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[30, 40, 50, 60, 70, 80].map((ami) => {
            const isSelected = (data.amiTargets || []).includes(ami);
            return (
              <button
                key={ami}
                type="button"
                onClick={() => {
                  const current = data.amiTargets || [];
                  if (isSelected) {
                    updateField('amiTargets', current.filter(a => a !== ami));
                  } else {
                    updateField('amiTargets', [...current, ami].sort((a, b) => a - b));
                  }
                }}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`text-lg font-bold ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                  {ami}%
                </span>
                <p className="text-xs text-gray-500">AMI</p>
              </button>
            );
          })}
        </div>

        {/* Selected AMI summary */}
        {data.amiTargets && data.amiTargets.length > 0 && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <span className="text-sm text-purple-700">
              Targeting: {data.amiTargets.map(a => `${a}% AMI`).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Set-Aside Election */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Minimum Set-Aside Election</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => updateField('setAsideElection', '20-50')}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              data.setAsideElection === '20-50'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className={`font-medium ${data.setAsideElection === '20-50' ? 'text-purple-700' : 'text-gray-900'}`}>
              20% at 50% AMI
            </span>
            <p className="text-xs text-gray-500">20% of units at 50% AMI or below</p>
          </button>

          <button
            type="button"
            onClick={() => updateField('setAsideElection', '40-60')}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              data.setAsideElection === '40-60'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className={`font-medium ${data.setAsideElection === '40-60' ? 'text-purple-700' : 'text-gray-900'}`}>
              40% at 60% AMI
            </span>
            <p className="text-xs text-gray-500">40% of units at 60% AMI or below</p>
          </button>

          <button
            type="button"
            onClick={() => updateField('setAsideElection', 'average')}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              data.setAsideElection === 'average'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className={`font-medium ${data.setAsideElection === 'average' ? 'text-purple-700' : 'text-gray-900'}`}>
              Income Averaging
            </span>
            <p className="text-xs text-gray-500">Average 60% AMI across all units</p>
          </button>
        </div>
      </div>

      {/* Summary */}
      {data.lihtcType && data.affordableUnits && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="text-sm font-medium text-purple-700 mb-2">LIHTC Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-purple-600">Credit Type</span>
              <p className="font-bold text-purple-700">{data.lihtcType}</p>
            </div>
            <div>
              <span className="text-purple-600">Affordable Units</span>
              <p className="font-bold text-purple-700">{data.affordableUnits} / {data.totalUnits || '?'}</p>
            </div>
            <div>
              <span className="text-purple-600">AMI Targets</span>
              <p className="font-bold text-purple-700">
                {data.amiTargets?.length || 0} levels
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LIHTC_Housing;
