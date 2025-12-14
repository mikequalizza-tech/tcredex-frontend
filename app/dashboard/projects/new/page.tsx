'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddressAutocomplete from '@/components/forms/AddressAutocomplete';

interface ProjectFormData {
  // Basic Info
  projectName: string;
  entityName: string;
  entityType: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  
  // Location
  address: string;
  city: string;
  state: string;
  zip: string;
  censusTract: string;
  
  // Project Details
  projectType: string;
  projectDescription: string;
  totalProjectCost: string;
  nmtcRequested: string;
  stateNmtcRequested: string;
  htcRequested: string;
  financingGap: string;
  
  // Timeline
  shovelReady: boolean;
  constructionStart: string;
  completionDate: string;
  
  // Impact
  jobsCreated: string;
  jobsRetained: string;
  communityBenefit: string;
}

const initialFormData: ProjectFormData = {
  projectName: '',
  entityName: '',
  entityType: 'nonprofit',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  censusTract: '',
  projectType: '',
  projectDescription: '',
  totalProjectCost: '',
  nmtcRequested: '',
  stateNmtcRequested: '',
  htcRequested: '',
  financingGap: '',
  shovelReady: false,
  constructionStart: '',
  completionDate: '',
  jobsCreated: '',
  jobsRetained: '',
  communityBenefit: '',
};

const projectTypes = [
  'Healthcare / Medical Facility',
  'Community Facility',
  'Manufacturing',
  'Mixed-Use Development',
  'Retail / Grocery',
  'Education / Training',
  'Childcare',
  'Office / Commercial',
  'Historic Rehabilitation',
  'Other',
];

const entityTypes = [
  { value: 'nonprofit', label: '501(c)(3) Nonprofit' },
  { value: 'forprofit', label: 'For-Profit Developer' },
  { value: 'government', label: 'Government Entity' },
  { value: 'tribal', label: 'Tribal Entity' },
  { value: 'coop', label: 'Cooperative' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);

  const totalSteps = 4;

  const updateField = (field: keyof ProjectFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressSelect = (suggestion: { place_name: string; center: [number, number] }) => {
    // Parse address components from place_name
    const parts = suggestion.place_name.split(', ');
    if (parts.length >= 3) {
      const stateZip = parts[parts.length - 2].split(' ');
      updateField('city', parts[parts.length - 3] || '');
      updateField('state', stateZip[0] || '');
      updateField('zip', stateZip[1] || '');
    }
  };

  const handleCensusTractFound = (tract: string | null) => {
    if (tract) {
      updateField('censusTract', tract);
      setEligibilityChecked(true);
      // Simulate eligibility check
      setIsEligible(Math.random() > 0.3);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Redirect to projects list
    router.push('/dashboard/projects');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.projectName && formData.entityName && formData.contactEmail;
      case 2:
        return formData.address && formData.censusTract;
      case 3:
        return formData.projectType && formData.totalProjectCost && formData.nmtcRequested;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Submit New Project</h1>
        <p className="text-gray-400 mt-1">Complete the intake form to submit your project for matching. ~20 minutes.</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Basic Info', 'Location', 'Financials', 'Review'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep > index + 1 
                  ? 'bg-green-600 text-white' 
                  : currentStep === index + 1 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-800 text-gray-500'
              }`}>
                {currentStep > index + 1 ? '✓' : index + 1}
              </div>
              <span className={`ml-2 text-sm ${currentStep >= index + 1 ? 'text-gray-200' : 'text-gray-500'}`}>
                {step}
              </span>
              {index < 3 && (
                <div className={`w-16 h-0.5 mx-4 ${currentStep > index + 1 ? 'bg-green-600' : 'bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => updateField('projectName', e.target.value)}
                placeholder="e.g., Downtown Community Health Center"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Sponsor Entity Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.entityName}
                  onChange={(e) => updateField('entityName', e.target.value)}
                  placeholder="Legal entity name"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Entity Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.entityType}
                  onChange={(e) => updateField('entityType', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                >
                  {entityTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Contact Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => updateField('contactName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Project Location</h2>
            
            <AddressAutocomplete
              value={formData.address}
              onChange={(value) => updateField('address', value)}
              onSelect={handleAddressSelect}
              onCensusTractFound={handleCensusTractFound}
              label="Project Address"
              required
              placeholder="Start typing the project address..."
            />

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => updateField('zip', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Census Tract & Eligibility */}
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Census Tract</p>
                  <p className="text-lg font-mono text-gray-200">
                    {formData.censusTract || 'Will auto-populate from address'}
                  </p>
                </div>
                {eligibilityChecked && (
                  <div className={`px-4 py-2 rounded-lg ${isEligible ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                    {isEligible ? '✓ NMTC Eligible' : '✗ Not in Qualified Tract'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Financials */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Project Financials</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Project Type <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.projectType}
                onChange={(e) => updateField('projectType', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select project type...</option>
                {projectTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Project Description</label>
              <textarea
                value={formData.projectDescription}
                onChange={(e) => updateField('projectDescription', e.target.value)}
                rows={3}
                placeholder="Brief description of the project and its community impact..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Total Project Cost <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.totalProjectCost}
                    onChange={(e) => updateField('totalProjectCost', e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Federal NMTC Requested <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.nmtcRequested}
                    onChange={(e) => updateField('nmtcRequested', e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">State NMTC (if applicable)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.stateNmtcRequested}
                    onChange={(e) => updateField('stateNmtcRequested', e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">HTC (if applicable)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.htcRequested}
                    onChange={(e) => updateField('htcRequested', e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
                <input
                  type="checkbox"
                  id="shovelReady"
                  checked={formData.shovelReady}
                  onChange={(e) => updateField('shovelReady', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="shovelReady" className="text-sm text-gray-300">Shovel Ready</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Construction Start</label>
                <input
                  type="date"
                  value={formData.constructionStart}
                  onChange={(e) => updateField('constructionStart', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Completion Date</label>
                <input
                  type="date"
                  value={formData.completionDate}
                  onChange={(e) => updateField('completionDate', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Jobs Created</label>
                <input
                  type="number"
                  value={formData.jobsCreated}
                  onChange={(e) => updateField('jobsCreated', e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Jobs Retained</label>
                <input
                  type="number"
                  value={formData.jobsRetained}
                  onChange={(e) => updateField('jobsRetained', e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Review & Submit</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-200 mb-3">Basic Info</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Project Name</dt>
                    <dd className="text-gray-200">{formData.projectName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Sponsor</dt>
                    <dd className="text-gray-200">{formData.entityName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Contact</dt>
                    <dd className="text-gray-200">{formData.contactEmail}</dd>
                  </div>
                </dl>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-200 mb-3">Location</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Address</dt>
                    <dd className="text-gray-200 text-right max-w-[200px] truncate">{formData.address}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Census Tract</dt>
                    <dd className="font-mono text-gray-200">{formData.censusTract}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Eligibility</dt>
                    <dd className={isEligible ? 'text-green-400' : 'text-red-400'}>
                      {isEligible ? 'Qualified Tract' : 'Not Qualified'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-200 mb-3">Financials</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Project Type</dt>
                    <dd className="text-gray-200">{formData.projectType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Total Cost</dt>
                    <dd className="text-gray-200">${Number(formData.totalProjectCost).toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">NMTC Requested</dt>
                    <dd className="text-indigo-400 font-medium">${Number(formData.nmtcRequested).toLocaleString()}</dd>
                  </div>
                </dl>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-200 mb-3">Timeline & Impact</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Shovel Ready</dt>
                    <dd className={formData.shovelReady ? 'text-green-400' : 'text-gray-400'}>
                      {formData.shovelReady ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Completion</dt>
                    <dd className="text-gray-200">{formData.completionDate || 'TBD'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Jobs Impact</dt>
                    <dd className="text-gray-200">
                      {formData.jobsCreated || 0} created / {formData.jobsRetained || 0} retained
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-lg">
              <p className="text-sm text-indigo-200">
                <strong>Next Steps:</strong> After submission, your project will be reviewed and matched with aligned CDEs. 
                You&apos;ll receive match notifications within 48 hours.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg transition-colors ${
              currentStep === 1
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Back
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
              disabled={!canProceed()}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                canProceed()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-500 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Project'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
