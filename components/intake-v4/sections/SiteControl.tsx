'use client';

import { IntakeData } from '../IntakeShell';

interface SiteControlProps {
  data: IntakeData;
  onChange: (data: IntakeData) => void;
}

const SITE_CONTROL_OPTIONS = [
  { value: 'Owned', label: 'Owned', description: 'Sponsor owns the property', points: 20 },
  { value: 'Under Contract', label: 'Under Contract', description: 'Purchase agreement in place', points: 10 },
  { value: 'LOI', label: 'Letter of Intent', description: 'LOI signed, not yet under contract', points: 5 },
  { value: 'None', label: 'No Site Control', description: 'Site not yet identified or controlled', points: 0 },
];

export function SiteControl({ data, onChange }: SiteControlProps) {
  const updateField = (field: keyof IntakeData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const selectedOption = SITE_CONTROL_OPTIONS.find(o => o.value === data.siteControl);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Site control is a key readiness indicator. Stronger site control = higher readiness score.
      </p>

      {/* Site Control Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SITE_CONTROL_OPTIONS.map((option) => {
          const isSelected = data.siteControl === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField('siteControl', option.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-medium ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                  {option.label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  +{option.points} pts
                </span>
              </div>
              <p className="text-xs text-gray-500">{option.description}</p>
            </button>
          );
        })}
      </div>

      {/* Additional Details */}
      {data.siteControl && data.siteControl !== 'None' && (
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Site Control Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {data.siteControl === 'Owned' ? 'Date Acquired' :
                 data.siteControl === 'Under Contract' ? 'Contract Date' :
                 'LOI Date'}
              </label>
              <input
                type="date"
                value={data.siteControlDate || ''}
                onChange={(e) => updateField('siteControlDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {data.siteControl === 'Under Contract' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Expiration
                </label>
                <input
                  type="date"
                  value={data.contractExpiration || ''}
                  onChange={(e) => updateField('contractExpiration', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zoning Status */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Zoning & Entitlements</h3>
        
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={data.zoningApproved || false}
              onChange={(e) => updateField('zoningApproved', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div>
              <span className="font-medium text-gray-900">Zoning Approved</span>
              <p className="text-xs text-gray-500">Property is properly zoned for intended use</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={data.entitlementsApproved || false}
              onChange={(e) => {
                updateField('entitlementsApproved', e.target.checked);
                if (e.target.checked) {
                  updateField('entitlementsSubmitted', true);
                  updateField('entitlementsStarted', true);
                }
              }}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div>
              <span className="font-medium text-gray-900">Entitlements Approved</span>
              <p className="text-xs text-gray-500">All necessary permits and approvals in place (+20 pts)</p>
            </div>
          </label>

          {!data.entitlementsApproved && (
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer ml-6">
              <input
                type="checkbox"
                checked={data.entitlementsSubmitted || false}
                onChange={(e) => {
                  updateField('entitlementsSubmitted', e.target.checked);
                  if (e.target.checked) {
                    updateField('entitlementsStarted', true);
                  }
                }}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-gray-900">Entitlements Submitted</span>
                <p className="text-xs text-gray-500">Applications filed, pending approval (+10 pts)</p>
              </div>
            </label>
          )}

          {!data.entitlementsApproved && !data.entitlementsSubmitted && (
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer ml-6">
              <input
                type="checkbox"
                checked={data.entitlementsStarted || false}
                onChange={(e) => updateField('entitlementsStarted', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-gray-900">Entitlement Process Started</span>
                <p className="text-xs text-gray-500">Pre-application meetings or initial filings (+5 pts)</p>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Score Summary */}
      {selectedOption && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-green-700">Site Control Score</span>
              <p className="text-xs text-green-600">{selectedOption.label}</p>
            </div>
            <span className="text-2xl font-bold text-green-700">{selectedOption.points}/20</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SiteControl;
