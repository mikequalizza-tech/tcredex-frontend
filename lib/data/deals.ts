/**
 * Deal Types and Constants
 *
 * Core types for deals - NO MOCK DATA, just type definitions
 */

import { ProjectImage } from '@/types/intake';

// Program Types
export type ProgramType = 'NMTC' | 'HTC' | 'LIHTC' | 'OZ';
export type ProgramLevel = 'federal' | 'state';
export type TractType = 'QCT' | 'SD' | 'LIC' | 'DDA';

// DealStatus - Unified with lib/db/types.ts (the database source of truth)
export type DealStatus = 'draft' | 'submitted' | 'under_review' | 'available' | 'seeking_capital' | 'matched' | 'closing' | 'closed' | 'withdrawn';

// Financing source/use item
export interface FinancingItem {
  name: string;
  amount: number;
}

// Deal Interface
export interface Deal {
  id: string;
  projectName: string;
  sponsorName: string;
  sponsorOrganizationId?: string;  // For ownership detection
  sponsorDescription?: string;
  website?: string;
  programType: ProgramType;
  programLevel: ProgramLevel;
  stateProgram?: string;
  allocation: number;
  creditPrice: number;
  state: string;
  city: string;
  tractType: TractType[];
  status: DealStatus;
  description?: string;
  communityImpact?: string;
  projectHighlights?: string[];
  useOfFunds?: { category: string; amount: number }[];
  timeline?: { milestone: string; date: string; completed: boolean }[];
  foundedYear?: number;
  submittedDate: string;
  povertyRate?: number;
  medianIncome?: number;
  jobsCreated?: number;
  visible: boolean;
  coordinates?: [number, number];
  projectCost?: number;
  financingGap?: number;
  censusTract?: string;
  unemployment?: number;
  shovelReady?: boolean;
  completionDate?: string;
  // Profile media fields
  logoUrl?: string;
  heroImageUrl?: string;
  projectImages?: ProjectImage[];
  draftData?: Record<string, unknown>;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  sources?: FinancingItem[];
  uses?: FinancingItem[];
}

// Status Configuration
export const STATUS_CONFIG: Record<DealStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-700 text-gray-400' },
  submitted: { label: 'Submitted', color: 'bg-blue-900/50 text-blue-400' },
  under_review: { label: 'Under Review', color: 'bg-amber-900/50 text-amber-400' },
  available: { label: 'Available', color: 'bg-green-900/50 text-green-400' },
  seeking_capital: { label: 'Seeking Capital', color: 'bg-indigo-900/50 text-indigo-400' },
  matched: { label: 'Matched', color: 'bg-purple-900/50 text-purple-400' },
  closing: { label: 'Closing', color: 'bg-teal-900/50 text-teal-400' },
  closed: { label: 'Closed', color: 'bg-emerald-900/50 text-emerald-400' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-700 text-gray-400' },
};

// Program Colors
export const PROGRAM_COLORS: Record<ProgramType, { gradient: string; bg: string; text: string; border: string }> = {
  NMTC: { gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-900/30', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  HTC: { gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-500/30' },
  LIHTC: { gradient: 'from-purple-500 to-pink-600', bg: 'bg-purple-900/30', text: 'text-purple-300', border: 'border-purple-500/30' },
  OZ: { gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-900/30', text: 'text-amber-300', border: 'border-amber-500/30' },
};

// Tract Labels
export const TRACT_LABELS: Record<TractType, string> = {
  QCT: 'Qualified Census Tract',
  SD: 'Severely Distressed',
  LIC: 'Low-Income Community',
  DDA: 'Difficult Development Area',
};
