import { NextResponse } from 'next/server';

// tCredex Matching API - AutoMatch AI
// Implements the 3-deal rule for CDE matching

interface MatchResult {
  dealId: string;
  projectName: string;
  matchScore: number;
  matchTier: 'Excellent' | 'Good' | 'Fair';
  rationale: string[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cdeId, criteria } = body;

    if (!cdeId) {
      return NextResponse.json(
        { error: 'CDE ID is required' },
        { status: 400 }
      );
    }

    // Mock matching results - in production this uses the real matching engine
    const matches: MatchResult[] = [
      {
        dealId: 'D12345',
        projectName: 'Eastside Grocery Co-Op',
        matchScore: 92,
        matchTier: 'Excellent',
        rationale: [
          'Geographic match: IL focus state',
          'Severely distressed tract (+25 pts)',
          'NMTC eligible (+25 pts)',
          'High impact score: 82 (+20 pts)',
        ],
      },
      {
        dealId: 'D12348',
        projectName: 'Riverfront Manufacturing Hub',
        matchScore: 85,
        matchTier: 'Excellent',
        rationale: [
          'Geographic match: OH adjacent state',
          'Severely distressed tract (+25 pts)',
          'NMTC + State NMTC (+25 pts)',
          'Manufacturing sector priority',
        ],
      },
      {
        dealId: 'D12349',
        projectName: 'Downtown Child Care Center',
        matchScore: 78,
        matchTier: 'Good',
        rationale: [
          'Community facility focus',
          'Shovel ready status',
          'Strong community impact',
          'Moderate distress indicators',
        ],
      },
    ];

    // Apply 3-deal rule: only return top 3 matches
    const topMatches = matches.slice(0, 3);

    return NextResponse.json({
      cdeId,
      timestamp: new Date().toISOString(),
      totalMatchesFound: matches.length,
      matches: topMatches,
      rule: '3-deal rule applied - showing top 3 matches only',
    });
  } catch (error) {
    console.error('Matching API error:', error);
    return NextResponse.json(
      { error: 'Failed to compute matches' },
      { status: 500 }
    );
  }
}
