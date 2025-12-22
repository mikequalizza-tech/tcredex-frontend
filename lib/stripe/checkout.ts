import logger from '@/lib/utils/logger';

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
  logger.warn('createCheckoutSession called - Stripe not configured', null, 'Stripe');
  return {
    id: 'stub_session_' + Date.now(),
    url: params.successUrl || '/closing-room/success',
  };
}

export async function retrieveSession(sessionId: string) {
  logger.warn('retrieveSession called - Stripe not configured', null, 'Stripe');
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
  logger.warn('constructWebhookEvent called - Stripe not configured', null, 'Stripe');
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
