export interface InvestorProfile {
  investorId: string;
  name: string;

  targetYield: number;
  capitalAvailable: number;

  preferences: {
    regions: string[];
    sectors: string[];
    dealTypes: ("singleCDE" | "multiCDE" | "multiCredit")[];
    programs: {
      nmtc: boolean;
      htc: boolean;
      lihtc: boolean;
      oz: boolean;
    };
  };

  requiredMetrics: {
    minImpact: number;
    minDistress: number;
    minSponsorStrength: number;
  };
}
