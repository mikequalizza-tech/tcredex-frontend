import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const cookieToken = request.cookies.get('auth-token')?.value
  
  if (!cookieToken) {
    return NextResponse.json({ error: 'No auth token' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data: userResult, error: userError } = await supabase.auth.getUser(cookieToken)

    if (userError || !userResult?.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const authUser = userResult.user

    // Debug: Check user data from users table
    const { data: user, error: userQueryError } = await supabase
      .from('users')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', authUser.id)
      .single()

    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        metadata: authUser.user_metadata
      },
      profile: {
        data: user,
        error: userQueryError
      },
      organization: (user as any)?.organization ? {
        data: (user as any).organization,
        error: null
      } : null,
      debug: {
        hasProfile: !!user,
        hasOrgId: !!(user as any)?.organization_id,
        orgId: (user as any)?.organization_id
      }
    })
  } catch (error) {
    console.error('[Debug] error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}