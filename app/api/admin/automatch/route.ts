/**
 * tCredex Admin API - AutoMatch Operations
 * POST /api/admin/automatch - Run batch matching
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { findMatches, runAutoMatchBatch } from '@/lib/automatch';

export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, dealId } = body;

    switch (action) {
      case 'batch': {
        const result = await runAutoMatchBatch();
        return NextResponse.json({
          success: true,
          action: 'batch',
          processed: result.processed,
          matchesFound: result.matches,
          timestamp: new Date().toISOString(),
        });
      }

      case 'single': {
        if (!dealId) {
          return NextResponse.json(
            { error: 'dealId required for single action' },
            { status: 400 }
          );
        }
        const result = await findMatches(dealId, {
          notifyMatches: true,
          maxResults: 20,
        });
        return NextResponse.json({
          success: true,
          action: 'single',
          dealId: result.dealId,
          projectName: result.projectName,
          matchesFound: result.matches.length,
          topMatches: result.matches.slice(0, 5),
          timestamp: result.timestamp,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: batch, single' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin AutoMatch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
