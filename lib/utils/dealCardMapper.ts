import { Deal as SupabaseDeal } from '@/lib/data/deals';
import { Deal as DealCardDeal } from '@/components/DealCard';

export function mapDealToCard(deal: SupabaseDeal): DealCardDeal {
  const location = [deal.city, deal.state].filter(Boolean).join(', ');
  const estimatedProjectCost = deal.allocation ? deal.allocation * 2 : 0;
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
    financingGap: Math.max(0, Math.round((deal.allocation || 0) * 0.1)),
  };
}
