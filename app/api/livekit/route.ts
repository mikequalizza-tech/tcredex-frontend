import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { AccessToken } from 'livekit-server-sdk';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const room = searchParams.get('room');

    if (!room) {
      return NextResponse.json({ error: 'Room parameter required' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        { error: 'LiveKit configuration missing' },
        { status: 500 }
      );
    }

    const name =
      user.fullName ||
      user.firstName ||
      user.lastName ||
      user.emailAddresses[0]?.emailAddress?.split('@')[0] ||
      'User';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: name,
    });

    at.addGrant({
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error('[LiveKit] Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
