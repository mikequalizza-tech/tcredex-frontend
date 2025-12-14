'use client';

import { IntakeData } from '../IntakeShell';

interface ProjectBasicsProps {
  data: IntakeData;
  onChange: (data: IntakeData) => void;
}

const PROJECT_TYPES = ['Community Facility', 'Healthcare', 'Education', 'Manufacturing', 'Mixed-Use', 'Office', 'Retail', 'Affordable Housing', 'Historic Rehabilitation', 'Industrial', 'Other'];

export function ProjectBasics({ data, onChange }: ProjectBasicsProps) {
  const updateField = (field: keyof IntakeData, value: any) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Project Name <span className="text-red-400">*</span></label>
        <input type="text" value={data.projectName || ''} onChange={(e) => updateField('projectName', e.target.value)}
          placeholder="e.g., Downtown Community Center"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Project Type <span className="text-red-400">*</span></label>
        <select value={data.projectType || ''} onChange={(e) => updateField('projectType', e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option value="">Select project type...</option>
          {PROJECT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Project Description</label>
        <textarea value={data.projectDescription || ''} onChange={(e) => updateField('projectDescription', e.target.value)}
          placeholder="Brief description of the project, its purpose, and community impact..." rows={4}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        <p className="text-xs text-gray-500 mt-1">This will appear on your marketplace listing</p>
      </div>

      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Sponsor Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sponsor / Developer Name <span className="text-red-400">*</span></label>
            <input type="text" value={data.sponsorName || ''} onChange={(e) => updateField('sponsorName', e.target.value)}
              placeholder="Organization name"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Contact Email</label>
            <input type="email" value={data.sponsorEmail || ''} onChange={(e) => updateField('sponsorEmail', e.target.value)}
              placeholder="contact@example.com"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Contact Phone</label>
            <input type="tel" value={data.sponsorPhone || ''} onChange={(e) => updateField('sponsorPhone', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectBasics;
