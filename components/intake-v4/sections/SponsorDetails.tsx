'use client';

import { IntakeData } from '@/types/intake';

interface SponsorDetailsProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
}

const ORGANIZATION_TYPES = [
  'For-profit',
  'Non-profit',
  'Not-for-profit',
  'Government',
  'Tribal',
];

export function SponsorDetails({ data, onChange }: SponsorDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Organization Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Organization Type <span className="text-red-400">*</span>
        </label>
        <select
          value={data.organizationType || ''}
          onChange={(e) => onChange({ organizationType: e.target.value as any })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select organization type...</option>
          {ORGANIZATION_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Low-Income Owned/Controlled */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Is the organization owned or controlled by Low-Income Community residents?
          <span className="text-indigo-400 text-xs ml-2">CDE Priority Factor</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          &gt;50% of board members or ownership from Low-Income Community
        </p>
        <div className="flex gap-3">
          {['Yes', 'No', "Don't Know"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange({ lowIncomeOwned: option as any })}
              className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                data.lowIncomeOwned === option
                  ? option === 'Yes' 
                    ? 'border-green-500 bg-green-900/30 text-green-300'
                    : 'border-indigo-500 bg-indigo-900/30 text-indigo-300'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Ownership Certifications */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Ownership Certifications
          <span className="text-gray-500 text-xs ml-2 font-normal">(Optional - may improve matching)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Woman-Owned */}
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.womanOwned === 'Yes'}
                onChange={(e) => onChange({ womanOwned: e.target.checked ? 'Yes' : 'No' })}
                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-300">Woman-Owned</span>
                <p className="text-xs text-gray-500">≥51% woman ownership</p>
              </div>
            </label>
          </div>

          {/* Minority-Owned or Controlled */}
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.minorityOwned === 'Yes'}
                onChange={(e) => onChange({ minorityOwned: e.target.checked ? 'Yes' : 'No' })}
                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-300">Minority-Owned or Controlled</span>
                <p className="text-xs text-gray-500">≥51% minority ownership or board control</p>
              </div>
            </label>
          </div>

          {/* Veteran-Owned */}
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.veteranOwned === 'Yes'}
                onChange={(e) => onChange({ veteranOwned: e.target.checked ? 'Yes' : 'No' })}
                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-300">Veteran-Owned</span>
                <p className="text-xs text-gray-500">≥51% veteran ownership</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Person Completing Form */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Form Preparer</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Person Completing Form
            </label>
            <input
              type="text"
              value={data.personCompletingForm || ''}
              onChange={(e) => onChange({ personCompletingForm: e.target.value })}
              placeholder="Name of person completing this form"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Contact Name (if different)
            </label>
            <input
              type="text"
              value={data.contactName || ''}
              onChange={(e) => onChange({ contactName: e.target.value })}
              placeholder="Primary contact for questions"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* CDE Matching Note */}
      {(data.lowIncomeOwned === 'Yes' || data.womanOwned === 'Yes' || data.minorityOwned === 'Yes' || data.veteranOwned === 'Yes') && (
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">✨</span>
            <div>
              <p className="text-emerald-300 font-medium text-sm">Enhanced CDE Matching</p>
              <p className="text-xs text-emerald-400/80 mt-1">
                Your ownership certifications will be highlighted to CDEs with matching investment priorities.
                Many CDEs specifically target projects with diverse or community-based ownership.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SponsorDetails;
