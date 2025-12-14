// Stripe checkout - STUBBED for development
// TODO: Install 'stripe' package and uncomment real implementation

export interface CheckoutSessionParams {
  userId: string;
  feature: string;
  amount: number;
  successUrl?: string;
  cancelUrl?: string;
}

export async function createCheckoutSession(params: CheckoutSessionParams) {
  console.warn('[STUB] createCheckoutSession called - Stripe not configured');
  return {
    id: 'stub_session_' + Date.now(),
    url: params.successUrl || '/closing-room/success',
  };
}

export async function retrieveSession(sessionId: string) {
  console.warn('[STUB] retrieveSession called - Stripe not configured');
  return {
    id: sessionId,
    payment_status: 'unpaid',
    metadata: {},
  };
}

export function constructWebhookEvent(
  payload: Buffer,
  signature: string,
  webhookSecret: string
) {
  console.warn('[STUB] constructWebhookEvent called - Stripe not configured');
  // Return a mock event structure
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'stub_session',
        metadata: {},
      },
    },
  };
}
