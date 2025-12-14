export interface QALICBInput {
  gross_income_test: boolean;
  tangible_property_test: boolean;
  services_test: boolean;
  collectibles_test: boolean;
  financial_property_test: boolean;
  prohibited_business: boolean;
  active_business: boolean;
}

export function isQALICBEligible(input: QALICBInput): boolean {
  const basicTests =
    input.gross_income_test &&
    input.tangible_property_test &&
    input.services_test &&
    input.collectibles_test &&
    input.financial_property_test;

  const businessStatus = input.active_business && !input.prohibited_business;

  return basicTests && businessStatus;
}

export function getFailedTests(input: QALICBInput): string[] {
  const failed: string[] = [];
  
  if (!input.gross_income_test) failed.push('Gross Income Test (50% in LIC)');
  if (!input.tangible_property_test) failed.push('Tangible Property Test (40% in LIC)');
  if (!input.services_test) failed.push('Services Test (40% in LIC)');
  if (!input.collectibles_test) failed.push('Collectibles Test (<5%)');
  if (!input.financial_property_test) failed.push('Financial Property Test (<5%)');
  if (!input.active_business) failed.push('Active Business Requirement');
  if (input.prohibited_business) failed.push('Prohibited Business Type');
  
  return failed;
}
