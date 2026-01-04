'use client';

import { IntakeData } from '@/types/intake';

interface SocialImpactProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
}

const LEED_LEVELS = ['Platinum', 'Gold', 'Silver', 'Certified'];

export function SocialImpact({ data, onChange }: SocialImpactProps) {
  return (
    <div className="space-y-6">
      {/* Community Support */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Community Support <span className="text-red-400">*</span>
          <span className="text-indigo-400 text-xs ml-2">(Key TC Factor)</span>
        </label>
        <textarea
          value={data.communitySupport || ''}
          onChange={(e) => onChange({ communitySupport: e.target.value })}
          placeholder="Describe community support for this project:&#10;• Letters of support from local organizations&#10;• Involvement in planning process&#10;• Community meetings held&#10;• Partnerships with local nonprofits&#10;• Government endorsements"
          rows={4}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Strong community support statements significantly improve matching scores
        </p>
      </div>

      {/* Long-Term Development */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Contribution to Sustainable Community Development
        </label>
        <textarea
          value={data.longTermDevelopment || ''}
          onChange={(e) => onChange({ longTermDevelopment: e.target.value })}
          placeholder="How will this project contribute to long-term community development?&#10;• Catalytic effect on neighborhood&#10;• Part of larger revitalization effort&#10;• Addresses specific community need&#10;• Sustainable economic impact"
          rows={4}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Environmental Section */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span className="text-xl">🌿</span>
          Environmental Considerations
        </h3>

        {/* Environmental Remediation */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Does this project involve environmental remediation?
            <span className="text-purple-400 text-xs ml-2">Brownfield Potential</span>
          </label>
          <div className="flex gap-3 mb-3">
            {['Yes', 'No', "Don't Know"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange({ environmentalRemediation: option as any })}
                className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  data.environmentalRemediation === option
                    ? option === 'Yes'
                      ? 'border-purple-500 bg-purple-900/30 text-purple-300'
                      : 'border-indigo-500 bg-indigo-900/30 text-indigo-300'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          
          {data.environmentalRemediation === 'Yes' && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Describe environmental conditions and remediation scope
              </label>
              <textarea
                value={data.environmentalDescription || ''}
                onChange={(e) => onChange({ environmentalDescription: e.target.value })}
                placeholder="Describe known environmental conditions, required remediation, status of Phase I/II reports..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* LEED Certification */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            LEED Certification
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Is project LEED certifiable?</label>
              <div className="flex gap-2">
                {['Yes', 'No', "Don't Know"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onChange({ leedCertifiable: option as any })}
                    className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                      data.leedCertifiable === option
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-2">Is LEED certification being sought?</label>
              <div className="flex gap-2">
                {['Yes', 'No', "Don't Know"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onChange({ leedCertificationSought: option as any })}
                    className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                      data.leedCertificationSought === option
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {data.leedCertificationSought === 'Yes' && (
            <div>
              <label className="block text-xs text-gray-400 mb-2">Target LEED Level</label>
              <div className="flex gap-2">
                {LEED_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onChange({ leedLevel: level as any })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      data.leedLevel === level
                        ? level === 'Platinum' ? 'bg-indigo-600 text-white' :
                          level === 'Gold' ? 'bg-yellow-600 text-white' :
                          level === 'Silver' ? 'bg-gray-400 text-gray-900' :
                          'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Green Features */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Green Building Features
          </label>
          <textarea
            value={data.greenFeatures || ''}
            onChange={(e) => onChange({ greenFeatures: e.target.value })}
            placeholder="Describe green building features:&#10;• Low-water fixtures&#10;• ENERGY STAR appliances&#10;• Solar panels&#10;• Geothermal systems&#10;• Green roof&#10;• EV charging stations&#10;• Sustainable materials"
            rows={4}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Impact Preview */}
      {(data.communitySupport || data.environmentalRemediation === 'Yes' || data.leedCertificationSought === 'Yes') && (
        <div className="bg-gradient-to-r from-emerald-900/20 to-indigo-900/20 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📊</span>
            <div className="flex-1">
              <p className="text-emerald-300 font-medium text-sm mb-2">Social Impact Indicators</p>
              <div className="flex flex-wrap gap-2">
                {data.communitySupport && (
                  <span className="px-2 py-1 bg-emerald-900/50 text-emerald-300 rounded text-xs font-medium">
                    ✓ Community Support Documented
                  </span>
                )}
                {data.environmentalRemediation === 'Yes' && (
                  <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded text-xs font-medium">
                    ✓ Environmental Remediation
                  </span>
                )}
                {data.leedCertificationSought === 'Yes' && (
                  <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs font-medium">
                    ✓ LEED {data.leedLevel || 'Certification'} Targeted
                  </span>
                )}
                {data.greenFeatures && (
                  <span className="px-2 py-1 bg-teal-900/50 text-teal-300 rounded text-xs font-medium">
                    ✓ Green Features
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialImpact;
