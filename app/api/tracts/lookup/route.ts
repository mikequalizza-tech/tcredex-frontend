import { NextRequest, NextResponse } from 'next/server';

// FIPS state codes mapping
const STATE_FIPS: Record<string, string> = {
  '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas',
  '06': 'California', '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware',
  '11': 'District of Columbia', '12': 'Florida', '13': 'Georgia', '15': 'Hawaii',
  '16': 'Idaho', '17': 'Illinois', '18': 'Indiana', '19': 'Iowa',
  '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana', '23': 'Maine',
  '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
  '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska',
  '32': 'Nevada', '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico',
  '36': 'New York', '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio',
  '40': 'Oklahoma', '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island',
  '45': 'South Carolina', '46': 'South Dakota', '47': 'Tennessee', '48': 'Texas',
  '49': 'Utah', '50': 'Vermont', '51': 'Virginia', '53': 'Washington',
  '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming', '72': 'Puerto Rico'
};

// Sample tract data for major metros (expanded as needed)
// This is a subset - full data should be loaded from database/file
const SAMPLE_TRACTS: Record<string, {
  county: string;
  state: string;
  eligible: boolean;
  poverty: number;
  income: number;
  unemployment: number | null;
  povertyQualifies: boolean;
  incomeQualifies: boolean;
  classification: string;
}> = {
  // Chicago / Cook County, IL samples
  '17031010100': { county: 'Cook County', state: 'Illinois', eligible: true, poverty: 27.6, income: 85.4, unemployment: 5.1, povertyQualifies: true, incomeQualifies: false, classification: 'Neither' },
  '17031010201': { county: 'Cook County', state: 'Illinois', eligible: true, poverty: 29.4, income: 54.7, unemployment: 3.9, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
  '17031280100': { county: 'Cook County', state: 'Illinois', eligible: true, poverty: 32.1, income: 48.3, unemployment: 8.2, povertyQualifies: true, incomeQualifies: true, classification: 'Sellable' },
  '17031842400': { county: 'Cook County', state: 'Illinois', eligible: true, poverty: 45.2, income: 35.8, unemployment: 12.1, povertyQualifies: true, incomeQualifies: true, classification: 'Sellable' },
  
  // Detroit / Wayne County, MI samples
  '26163502100': { county: 'Wayne County', state: 'Michigan', eligible: true, poverty: 38.5, income: 42.1, unemployment: 15.2, povertyQualifies: true, incomeQualifies: true, classification: 'Sellable' },
  '26163516300': { county: 'Wayne County', state: 'Michigan', eligible: true, poverty: 42.1, income: 38.6, unemployment: 18.3, povertyQualifies: true, incomeQualifies: true, classification: 'Sellable' },
  
  // Baltimore / Baltimore City, MD samples
  '24510010100': { county: 'Baltimore City', state: 'Maryland', eligible: true, poverty: 35.2, income: 45.6, unemployment: 10.8, povertyQualifies: true, incomeQualifies: true, classification: 'Sellable' },
  '24510150100': { county: 'Baltimore City', state: 'Maryland', eligible: true, poverty: 28.4, income: 52.3, unemployment: 8.9, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
  
  // Cleveland / Cuyahoga County, OH samples
  '39035102100': { county: 'Cuyahoga County', state: 'Ohio', eligible: true, poverty: 31.5, income: 48.2, unemployment: 11.2, povertyQualifies: true, incomeQualifies: true, classification: 'Sellable' },
  '39035108900': { county: 'Cuyahoga County', state: 'Ohio', eligible: true, poverty: 25.8, income: 55.1, unemployment: 9.4, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
  
  // Memphis / Shelby County, TN samples
  '47157003800': { county: 'Shelby County', state: 'Tennessee', eligible: true, poverty: 36.8, income: 41.5, unemployment: 12.5, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
  '47157004600': { county: 'Shelby County', state: 'Tennessee', eligible: true, poverty: 29.3, income: 58.2, unemployment: 8.7, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
  
  // St. Louis / St. Louis City, MO samples
  '29510101100': { county: 'St. Louis City', state: 'Missouri', eligible: true, poverty: 33.5, income: 44.8, unemployment: 11.8, povertyQualifies: true, incomeQualifies: true, classification: 'Sellable' },
  '29510126100': { county: 'St. Louis City', state: 'Missouri', eligible: true, poverty: 27.6, income: 52.4, unemployment: 9.2, povertyQualifies: true, incomeQualifies: true, classification: 'Sellable' },
  
  // New York / Manhattan samples
  '36061001100': { county: 'New York County', state: 'New York', eligible: true, poverty: 22.4, income: 68.5, unemployment: 5.8, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
  '36061023000': { county: 'New York County', state: 'New York', eligible: true, poverty: 35.1, income: 42.3, unemployment: 9.1, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
  
  // Los Angeles / LA County samples  
  '06037206020': { county: 'Los Angeles County', state: 'California', eligible: true, poverty: 28.3, income: 55.2, unemployment: 8.4, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
  '06037534002': { county: 'Los Angeles County', state: 'California', eligible: true, poverty: 32.6, income: 48.7, unemployment: 10.2, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
  
  // Houston / Harris County, TX samples
  '48201211600': { county: 'Harris County', state: 'Texas', eligible: true, poverty: 26.8, income: 58.4, unemployment: 7.5, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
  '48201311100': { county: 'Harris County', state: 'Texas', eligible: true, poverty: 31.2, income: 49.8, unemployment: 9.8, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
  
  // Atlanta / Fulton County, GA samples
  '13121006600': { county: 'Fulton County', state: 'Georgia', eligible: true, poverty: 29.4, income: 52.1, unemployment: 8.9, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
  '13121010100': { county: 'Fulton County', state: 'Georgia', eligible: true, poverty: 24.5, income: 61.8, unemployment: 7.2, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
  
  // Springfield / Sangamon County, IL (one of our deals)
  '17167000100': { county: 'Sangamon County', state: 'Illinois', eligible: true, poverty: 31.2, income: 54.3, unemployment: 8.5, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
  '17167000200': { county: 'Sangamon County', state: 'Illinois', eligible: true, poverty: 28.6, income: 58.1, unemployment: 7.8, povertyQualifies: true, incomeQualifies: true, classification: 'Neither' },
};

// Helper to simulate eligibility based on GEOID pattern
function simulateEligibility(geoid: string): {
  county: string;
  state: string;
  eligible: boolean;
  poverty: number;
  income: number;
  unemployment: number;
  povertyQualifies: boolean;
  incomeQualifies: boolean;
  classification: string;
} | null {
  if (!geoid || geoid.length !== 11) return null;
  
  const stateFips = geoid.substring(0, 2);
  const stateName = STATE_FIPS[stateFips] || 'Unknown';
  
  // Use GEOID hash for consistent random-ish values
  const hash = geoid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // ~41% of tracts are eligible nationally (35,167 / 85,395)
  const eligible = (hash % 100) < 41;
  
  // Generate plausible values
  const poverty = eligible ? 15 + (hash % 30) : 5 + (hash % 15);
  const income = eligible ? 40 + (hash % 40) : 80 + (hash % 40);
  const unemployment = 3 + (hash % 12);
  
  const povertyQualifies = poverty >= 20;
  const incomeQualifies = income <= 80;
  
  let classification = 'Neither';
  if (povertyQualifies || incomeQualifies) {
    if (hash % 4 === 0) classification = 'Sellable';
    else if (hash % 4 === 1) classification = 'Refundable';
    else if (hash % 8 === 0) classification = 'Both';
  }
  
  return {
    county: 'County ' + geoid.substring(2, 5),
    state: stateName,
    eligible,
    poverty: Math.round(poverty * 10) / 10,
    income: Math.round(income * 10) / 10,
    unemployment: Math.round(unemployment * 10) / 10,
    povertyQualifies,
    incomeQualifies,
    classification
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const geoid = searchParams.get('geoid');

  if (!geoid) {
    return NextResponse.json(
      { error: 'GEOID parameter required' },
      { status: 400 }
    );
  }

  // Normalize GEOID (pad to 11 chars if needed)
  const normalizedGeoid = geoid.padStart(11, '0');

  // First check our sample data
  if (SAMPLE_TRACTS[normalizedGeoid]) {
    return NextResponse.json(SAMPLE_TRACTS[normalizedGeoid]);
  }

  // Fall back to simulated data
  const simulated = simulateEligibility(normalizedGeoid);
  if (simulated) {
    return NextResponse.json({
      ...simulated,
      _note: 'Simulated data - full dataset integration pending'
    });
  }

  return NextResponse.json(
    { error: 'Tract not found', geoid: normalizedGeoid },
    { status: 404 }
  );
}
