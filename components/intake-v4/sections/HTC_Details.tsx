'use client';

import { IntakeData } from '../IntakeShell';

interface HTC_DetailsProps {
  data: IntakeData;
  onChange: (data: IntakeData) => void;
}

export function HTC_Details({ data, onChange }: HTC_DetailsProps) {
  const updateField = (field: keyof IntakeData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '';
    return value.toLocaleString();
  };

  const parseCurrency = (value: string) => {
    const num = parseInt(value.replace(/,/g, ''));
    return isNaN(num) ? undefined : num;
  };

  // Calculate credit estimate
  const estimatedCredit = data.qreAmount ? data.qreAmount * 0.20 : 0;

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Historic Tax Credit (HTC)</strong> provides a 20% federal credit for qualified rehabilitation expenditures (QREs) 
          on certified historic structures.
        </p>
      </div>

      {/* Historic Status */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Historic Status <span className="text-red-500">*</span></h3>
        <p className="text-xs text-gray-500 mb-4">Building must be listed or contributing to a historic district</p>
        
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'listed', label: 'Individually Listed', desc: 'On National Register of Historic Places' },
            { value: 'contributing', label: 'Contributing Structure', desc: 'In a registered historic district' },
            { value: 'pending', label: 'Pending Nomination', desc: 'National Register nomination in progress' },
            { value: 'none', label: 'Not Historic', desc: 'Does not qualify for HTC' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField('historicStatus', option.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                data.historicStatus === option.value
                  ? option.value === 'none' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`font-medium text-sm ${
                data.historicStatus === option.value 
                  ? option.value === 'none' ? 'text-red-700' : 'text-blue-700' 
                  : 'text-gray-900'
              }`}>
                {option.label}
              </span>
              <p className="text-xs text-gray-500">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {data.historicStatus && data.historicStatus !== 'none' && (
        <>
          {/* Part 1 / Part 2 Status */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">NPS Application Status</h3>
            
            <div className="space-y-4">
              {/* Part 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Part 1 - Evaluation of Significance
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'approved', label: 'Approved', color: 'green' },
                    { value: 'submitted', label: 'Submitted', color: 'amber' },
                    { value: 'not_started', label: 'Not Started', color: 'gray' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField('part1Status', option.value)}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        data.part1Status === option.value
                          ? option.color === 'green' ? 'border-green-500 bg-green-50 text-green-700' :
                            option.color === 'amber' ? 'border-amber-500 bg-amber-50 text-amber-700' :
                            'border-gray-400 bg-gray-50 text-gray-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Confirms the building is a certified historic structure
                </p>
              </div>

              {/* Part 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Part 2 - Description of Rehabilitation
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'approved', label: 'Approved', color: 'green' },
                    { value: 'submitted', label: 'Submitted', color: 'amber' },
                    { value: 'not_started', label: 'Not Started', color: 'gray' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField('part2Status', option.value)}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        data.part2Status === option.value
                          ? option.color === 'green' ? 'border-green-500 bg-green-50 text-green-700' :
                            option.color === 'amber' ? 'border-amber-500 bg-amber-50 text-amber-700' :
                            'border-gray-400 bg-gray-50 text-gray-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Describes the proposed rehabilitation work
                </p>
              </div>
            </div>
          </div>

          {/* QRE Section */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Qualified Rehabilitation Expenditures (QRE)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated QRE Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    value={formatCurrency(data.qreAmount)}
                    onChange={(e) => updateField('qreAmount', parseCurrency(e.target.value))}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Hard costs for rehabilitation work
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated HTC (20%)
                </label>
                <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-lg font-bold text-blue-700">
                    ${formatCurrency(estimatedCredit)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  20% × QRE = Federal HTC
                </p>
              </div>
            </div>
          </div>

          {/* State HTC */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">State Historic Tax Credit</h3>
            
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={data.hasStateHTC || false}
                onChange={(e) => updateField('hasStateHTC', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Project qualifies for State HTC</span>
                <p className="text-xs text-gray-500">
                  Some states offer additional historic tax credits (varies by state)
                </p>
              </div>
            </label>

            {data.hasStateHTC && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={data.stateHTCState || ''}
                    onChange={(e) => updateField('stateHTCState', e.target.value)}
                    placeholder="e.g., Virginia"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State Credit Rate</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={data.stateHTCRate || ''}
                      onChange={(e) => updateField('stateHTCRate', parseFloat(e.target.value) || undefined)}
                      placeholder="25"
                      className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Summary */}
      {data.historicStatus && data.historicStatus !== 'none' && data.qreAmount && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-700 mb-2">Credit Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Federal HTC (20%)</span>
              <p className="font-bold text-blue-700">${formatCurrency(estimatedCredit)}</p>
            </div>
            {data.hasStateHTC && data.stateHTCRate && (
              <div>
                <span className="text-blue-600">State HTC ({data.stateHTCRate}%)</span>
                <p className="font-bold text-blue-700">
                  ${formatCurrency(Math.round(data.qreAmount * (data.stateHTCRate / 100)))}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HTC_Details;
