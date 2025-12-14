'use client';

import { IntakeData } from '../IntakeShell';

interface ProjectCostsProps {
  data: IntakeData;
  onChange: (data: IntakeData) => void;
}

export function ProjectCosts({ data, onChange }: ProjectCostsProps) {
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

  // Calculate totals
  const totalCost = (data.landCost || 0) + (data.constructionCost || 0) + (data.softCosts || 0);
  const gap = data.totalProjectCost ? data.totalProjectCost - totalCost : 0;

  return (
    <div className="space-y-6">
      {/* Total Project Cost */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Total Project Cost <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="text"
            value={formatCurrency(data.totalProjectCost)}
            onChange={(e) => updateField('totalProjectCost', parseCurrency(e.target.value))}
            placeholder="0"
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Total all-in project cost including land, construction, and soft costs</p>
      </div>

      {/* Cost Breakdown */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Cost Breakdown (Optional)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Land / Acquisition
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                value={formatCurrency(data.landCost)}
                onChange={(e) => updateField('landCost', parseCurrency(e.target.value))}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Construction / Hard Costs
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                value={formatCurrency(data.constructionCost)}
                onChange={(e) => updateField('constructionCost', parseCurrency(e.target.value))}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Soft Costs
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                value={formatCurrency(data.softCosts)}
                onChange={(e) => updateField('softCosts', parseCurrency(e.target.value))}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Breakdown Summary */}
        {totalCost > 0 && data.totalProjectCost && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Breakdown Total:</span>
              <span className="font-medium">${formatCurrency(totalCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Difference:</span>
              <span className={`font-medium ${Math.abs(gap) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                ${formatCurrency(Math.abs(gap))} {gap !== 0 && (gap > 0 ? 'unallocated' : 'over')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Financing Gap */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Financing Gap</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Financing Gap <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                value={formatCurrency(data.financingGap)}
                onChange={(e) => updateField('financingGap', parseCurrency(e.target.value))}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Amount needed from tax credit financing</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requested Allocation
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                value={formatCurrency(data.requestedAllocation)}
                onChange={(e) => updateField('requestedAllocation', parseCurrency(e.target.value))}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">NMTC/LIHTC allocation amount requested</p>
          </div>
        </div>

        {/* Gap Percentage */}
        {data.totalProjectCost && data.financingGap && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Gap as % of Total Cost</span>
              <span className="text-lg font-bold text-green-700">
                {((data.financingGap / data.totalProjectCost) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-green-200 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${Math.min((data.financingGap / data.totalProjectCost) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectCosts;
