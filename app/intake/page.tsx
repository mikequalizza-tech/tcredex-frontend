'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IntakeShell, IntakeData } from '@/components/intake-v4';
import { DealCardPreview } from '@/components/deals';
import { generateDealFromIntake, validateForDealCard, DealCardGeneratorResult } from '@/lib/deals';
import { Deal } from '@/components/DealCard';

export default function IntakePage() {
  const router = useRouter();
  const [previewResult, setPreviewResult] = useState<DealCardGeneratorResult | null>(null);
  const [currentData, setCurrentData] = useState<IntakeData | null>(null);

  const handleSave = async (data: IntakeData, _readinessScore: number) => {
    // TODO: integrate save endpoint
    // For now, save to localStorage as backup
    try {
      localStorage.setItem('tcredex_draft', JSON.stringify(data));
      // Show brief success message without blocking
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const handleSubmit = async (data: IntakeData, readinessScore: number) => {
    // Validate the data
    const validation = validateForDealCard(data);
    
    if (!validation.isValid) {
      alert(`Please fix the following errors:\n\n${validation.errors.join('\n')}`);
      return;
    }

    // Generate the DealCard
    const result = generateDealFromIntake(data);
    
    // Store current data for potential edits
    setCurrentData(data);
    
    // Show preview modal
    setPreviewResult(result);
  };

  const handleClosePreview = () => {
    setPreviewResult(null);
  };

  const handleEditFromPreview = () => {
    setPreviewResult(null);
    // Data is already in the form, just close the modal
  };

  const handleSubmitToMarketplace = async (deal: Deal) => {
    // TODO: Submit to API
    try {
      // In production, this would POST to /api/deals
      // const response = await fetch('/api/deals', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ deal, intakeData: currentData }),
      // });
      // const result = await response.json();
      
      // For demo, show success and redirect
      alert(`🎉 Deal "${deal.projectName}" submitted successfully!\n\nDeal ID: ${deal.id}`);
      
      // Clear the draft
      localStorage.removeItem('tcredex_draft');
      
      // Close modal and redirect
      setPreviewResult(null);
      router.push(`/deals`);
    } catch (error) {
      console.error('Failed to submit deal:', error);
      alert('Failed to submit deal. Please try again.');
    }
  };

  return (
    <>
      <IntakeShell
        onSave={handleSave}
        onSubmit={handleSubmit}
      />
      
      {/* DealCard Preview Modal */}
      {previewResult && (
        <DealCardPreview
          result={previewResult}
          onClose={handleClosePreview}
          onEdit={handleEditFromPreview}
          onSubmit={handleSubmitToMarketplace}
        />
      )}
    </>
  );
}
