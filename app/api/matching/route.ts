/**
 * tCredex Matching API - AutoMatch AI
 * 
 * POST /api/matching - Find CDE matches for a deal
 * POST /api/matching/batch - Run batch matching (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { findMatches, MATCH_THRESHOLDS } from '@/lib/automatch';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealId, cdeId, minScore, maxResults } = body;

    // If dealId provided, find CDEs for this deal
    if (dealId) {
      const result = await findMatches(dealId, {
        minScore: minScore || MATCH_THRESHOLDS.fair,
        maxResults: maxResults || 10,
        notifyMatches: false, // Don't notify on manual searches
      });

      // Apply 3-deal rule for display: only show top 3
      const topMatches = result.matches.slice(0, 3);

      return NextResponse.json({
        dealId: result.dealId,
        projectName: result.projectName,
        timestamp: result.timestamp,
        totalMatchesFound: result.matches.length,
        matches: topMatches.map(m => ({
          cdeId: m.cdeId,
          cdeName: m.cdeName,
          matchScore: m.totalScore,
          matchStrength: m.matchStrength,
          breakdown: m.breakdown,
          reasons: m.reasons,
        })),
        rule: '3-deal rule applied - showing top 3 matches only',
      });
    }

    // If cdeId provided, find deals for this CDE
    if (cdeId) {
      const supabase = supabaseAdmin;

      // Get CDE info
      const { data: cde } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', cdeId)
        .eq('type', 'CDE')
        .single();

      if (!cde) {
        return NextResponse.json({ error: 'CDE not found' }, { status: 404 });
      }

      // Get available deals
      const { data: deals } = await supabase
        .from('deals')
        .select('id')
        .eq('status', 'available')
        .eq('program_type', 'NMTC');

      // Score each deal for this CDE
      const matches = [];
      for (const deal of deals || []) {
        const result = await findMatches(deal.id, {
          minScore: 0,
          maxResults: 100,
          notifyMatches: false,
        });

        const cdeMatch = result.matches.find(m => m.cdeId === cdeId);
        if (cdeMatch && cdeMatch.totalScore >= (minScore || MATCH_THRESHOLDS.fair)) {
          matches.push({
            dealId: deal.id,
            projectName: result.projectName,
            matchScore: cdeMatch.totalScore,
            matchStrength: cdeMatch.matchStrength,
            reasons: cdeMatch.reasons,
          });
        }
      }

      // Sort and limit
      matches.sort((a, b) => b.matchScore - a.matchScore);
      const topMatches = matches.slice(0, 3);

      return NextResponse.json({
        cdeId,
        cdeName: cde.name,
        timestamp: new Date().toISOString(),
        totalMatchesFound: matches.length,
        matches: topMatches,
        rule: '3-deal rule applied - showing top 3 matches only',
      });
    }

    return NextResponse.json(
      { error: 'Either dealId or cdeId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Matching API error:', error);
    return NextResponse.json(
      { error: 'Failed to compute matches' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/matching - Get existing matches for a deal
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');

    if (!dealId) {
      return NextResponse.json(
        { error: 'dealId is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // Get saved matches
    const { data: matches, error } = await supabase
      .from('deal_matches')
      .select(`
        cde_id,
        score,
        match_strength,
        breakdown,
        reasons,
        created_at,
        organizations!deal_matches_cde_id_fkey(id, name)
      `)
      .eq('deal_id', dealId)
      .order('score', { ascending: false })
      .limit(10);

    if (error) {
      // Table might not exist yet
      return NextResponse.json({ matches: [] });
    }

    const formatted = (matches || []).map(m => {
      // Handle organizations - could be object, array, or null
      let cdeName = 'Unknown CDE';
      if (m.organizations) {
        const orgData = Array.isArray(m.organizations) 
          ? m.organizations[0] 
          : m.organizations;
        if (orgData && typeof orgData === 'object') {
          cdeName = (orgData as Record<string, unknown>).name as string || 'Unknown CDE';
        }
      }

      return {
        cdeId: m.cde_id,
        cdeName,
        matchScore: m.score,
        matchStrength: m.match_strength,
        breakdown: m.breakdown,
        reasons: m.reasons,
        matchedAt: m.created_at,
      };
    });

    return NextResponse.json({
      dealId,
      matches: formatted.slice(0, 3), // 3-deal rule
      totalMatchesFound: formatted.length,
    });
  } catch (error) {
    console.error('Get matches error:', error);
    return NextResponse.json(
      { error: 'Failed to get matches' },
      { status: 500 }
    );
  }
}
