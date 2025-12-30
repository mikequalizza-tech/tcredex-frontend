import { Deal as SupabaseDeal } from '@/lib/data/deals';
import { Deal as DealCardDeal } from '@/components/DealCard';

const PROJECT_COST_MULTIPLIER = 2;
const FINANCING_GAP_RATIO = 0.1;

export function mapDealToCard(deal: SupabaseDeal): DealCardDeal {
  const location = [deal.city, deal.state].filter(Boolean).join(', ');
  const estimatedProjectCost = deal.allocation ? deal.allocation * PROJECT_COST_MULTIPLIER : 0;
  const completionYear = new Date(deal.submittedDate).getFullYear();

  return {
    id: deal.id,
    projectName: deal.projectName,
    location,
    parent: deal.sponsorName,
    censusTract: deal.tractType?.[0],
    povertyRate: deal.povertyRate,
    medianIncome: deal.medianIncome,
    projectCost: estimatedProjectCost,
    fedNmtcReq: deal.programType === 'NMTC' ? deal.allocation : undefined,
    htc: deal.programType === 'HTC' ? deal.allocation : undefined,
    shovelReady: deal.status !== 'closed' && deal.status !== 'closing',
    completionDate: Number.isNaN(completionYear) ? undefined : `${completionYear}`,
    financingGap: Math.max(0, Math.round((deal.allocation || 0) * FINANCING_GAP_RATIO)),
  };
}
