'use client';

import { useState } from 'react';
import { IntakeData } from '../IntakeShell';

interface ProjectBasicsProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
}

const PROJECT_TYPES = ['Community Facility', 'Healthcare', 'Education', 'Manufacturing', 'Mixed-Use', 'Office', 'Retail', 'Affordable Housing', 'Historic Rehabilitation', 'Industrial', 'Other'];

export function ProjectBasics({ data, onChange }: ProjectBasicsProps) {
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // FIXED: Send only the changed field, not spreading data
  const updateField = (field: keyof IntakeData, value: any) => {
    onChange({ [field]: value });
  };

  // Handle image upload - store File object along with blob URL
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingImages(true);
    
    const currentImages = data.projectImages || [];
    const newImages: { name: string; url: string; size: number; file?: File }[] = [];
    
    for (let i = 0; i < Math.min(files.length, 5 - currentImages.length); i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      newImages.push({
        name: file.name,
        url: url,
        size: file.size,
        file: file // Store the actual file for later upload
      });
    }
    
    onChange({ projectImages: [...currentImages, ...newImages] });
    setUploadingImages(false);
  };

  const removeImage = (index: number) => {
    const images = [...(data.projectImages || [])];
    if (images[index]?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(images[index].url);
    }
    images.splice(index, 1);
    onChange({ projectImages: images });
  };

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
          placeholder="Brief description of the project, its purpose, and what it will accomplish..." rows={4}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        <p className="text-xs text-gray-500 mt-1">This will appear on your marketplace listing</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Community Impact <span className="text-indigo-400 text-xs ml-2">Helps with matching</span>
        </label>
        <textarea value={data.communityImpact || ''} onChange={(e) => updateField('communityImpact', e.target.value)}
          placeholder="Describe how this project will benefit the community:&#10;• Jobs created (construction and permanent)&#10;• Services provided to residents&#10;• Economic development impact&#10;• Environmental or health benefits&#10;• Underserved populations served" 
          rows={5}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        <p className="text-xs text-gray-500 mt-1">
          Strong community impact statements improve CDE matching and investor interest
        </p>
      </div>

      {/* Project Images Section */}
      <div className="border-t border-gray-800 pt-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Project Images <span className="text-gray-500 text-xs ml-2">(up to 5 images)</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Upload photos of the site, renderings, or related project images for your Project Profile
        </p>
        
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
          <input
            type="file"
            id="projectImages"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            disabled={uploadingImages || (data.projectImages?.length || 0) >= 5}
            className="hidden"
          />
          <label 
            htmlFor="projectImages" 
            className={`cursor-pointer ${(data.projectImages?.length || 0) >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-10 h-10 mx-auto text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {uploadingImages ? (
              <p className="text-gray-400">Uploading...</p>
            ) : (data.projectImages?.length || 0) >= 5 ? (
              <p className="text-gray-500">Maximum 5 images reached</p>
            ) : (
              <>
                <p className="text-indigo-400 font-medium">Click to upload images</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, or WEBP up to 10MB each</p>
              </>
            )}
          </label>
        </div>

        {data.projectImages && data.projectImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {data.projectImages.map((image, index) => (
              <div key={`${image.name}-${index}`} className="relative group">
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                  <img 
                    src={image.url} 
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sponsor Information */}
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
