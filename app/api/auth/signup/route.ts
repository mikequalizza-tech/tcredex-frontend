
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { NextRequest, NextResponse } from 'next/server';

// Delegate to /api/auth/register for unified onboarding logic
export async function POST(request: NextRequest) {
  // Forward the request body to the register endpoint
  const registerUrl = new URL('/api/auth/register', request.url);
  const body = await request.json();
  const response = await fetch(registerUrl.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
      const organization_id = uuidv4();
