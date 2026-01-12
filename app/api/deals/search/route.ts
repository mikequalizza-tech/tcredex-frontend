import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);

  if (!query || query.length < 2) {
    return NextResponse.json({ deals: [] });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // Read-only for GET
      },
    }
  );

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ deals: [] });
  }

  // Get user's organization info for role-based filtering
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, organization_type')
    .eq('id', user.id)
    .single();

  const orgType = profile?.organization_type;
  const orgId = profile?.organization_id;

  // Build the search query
  let dealsQuery = supabase
    .from('deals')
    .select('id, project_name, name, city, state, program_type, status, sponsor_id')
    .or(`project_name.ilike.%${query}%,name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`)
    .limit(limit);

  // Role-based filtering:
  // - Sponsors see only their own deals
  // - CDEs and Investors see all submitted/matched/closing deals
  if (orgType === 'sponsor') {
    // Sponsors see their own deals
    if (orgId) {
      dealsQuery = dealsQuery.eq('sponsor_id', orgId);
    } else {
      dealsQuery = dealsQuery.eq('sponsor_id', user.id);
    }
  } else {
    // CDEs and Investors see public deals (not drafts)
    dealsQuery = dealsQuery.in('status', ['submitted', 'matched', 'closing', 'closed']);
  }

  const { data: deals, error } = await dealsQuery;

  if (error) {
    console.error('Search error:', error);
    return NextResponse.json({ deals: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deals: deals || [] });
}
