/**
 * Welcome Email API
 * Sends welcome email after successful onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { roleType, userName } = body;

    // Send welcome email via backend API
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:4000';

    try {
      await fetch(`${backendUrl}/api/email/welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          data: {
            name: userName || user.email?.split('@')[0] || 'User',
            loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.tcredex.com'}/signin`,
            organizationName: '',
          },
        }),
      });
    } catch (emailError) {
      // Log but don't fail - email is not critical
      console.warn('[Onboarding] Failed to send welcome email:', emailError);
    }

    // Also log the successful onboarding
    console.log(`[Onboarding] User ${user.id} completed onboarding as ${roleType}`);

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent',
    });
  } catch (error) {
    console.error('[Onboarding] Welcome email error:', error);
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}
