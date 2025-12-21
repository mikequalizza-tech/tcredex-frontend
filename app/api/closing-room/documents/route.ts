import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Lazy init - don't crash build if keys missing
const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key);
};

// GET /api/closing-room/documents - List document templates
// GET /api/closing-room/documents?programType=NMTC
// GET /api/closing-room/documents?category=LOI
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const programType = searchParams.get('programType');
    const category = searchParams.get('category');
    const packId = searchParams.get('packId');

    // Get document packs
    if (packId) {
      const { data: pack, error } = await supabase
        .from('document_packs')
        .select('*')
        .eq('id', packId)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
      }

      return NextResponse.json({ pack });
    }

    // Build query
    let query = supabase
      .from('document_templates')
      .select('*')
      .eq('is_active', true)
      .order('program_type')
      .order('category');

    if (programType) {
      query = query.eq('program_type', programType.toUpperCase());
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: templates, error: templatesError } = await query;

    if (templatesError) {
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    // Also get document packs
    const { data: packs, error: packsError } = await supabase
      .from('document_packs')
      .select('*')
      .eq('is_active', true)
      .order('price_cents');

    if (packsError) {
      console.error('Packs fetch error:', packsError);
    }

    // Group templates by program
    const byProgram = templates?.reduce((acc, template) => {
      if (!acc[template.program_type]) {
        acc[template.program_type] = [];
      }
      acc[template.program_type].push(template);
      return acc;
    }, {} as Record<string, typeof templates>);

    return NextResponse.json({
      templates,
      byProgram,
      packs: packs || [],
      summary: {
        totalTemplates: templates?.length || 0,
        freeTemplates: templates?.filter(t => t.price_cents === 0).length || 0,
        paidTemplates: templates?.filter(t => t.price_cents > 0).length || 0,
      }
    });

  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/closing-room/documents - Purchase document template or pack
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const stripe = getStripe();
    
    const body = await request.json();
    const { templateId, packId, dealId, userId, returnUrl } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (!templateId && !packId) {
      return NextResponse.json({ error: 'templateId or packId required' }, { status: 400 });
    }

    let priceInCents = 0;
    let productName = '';
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (packId) {
      // Purchasing a pack
      const { data: pack, error } = await supabase
        .from('document_packs')
        .select('*')
        .eq('id', packId)
        .single();

      if (error || !pack) {
        return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
      }

      priceInCents = pack.price_cents;
      productName = pack.pack_name;

      // Use Stripe price ID if exists, otherwise create line item
      if (pack.stripe_price_id) {
        lineItems = [{ price: pack.stripe_price_id, quantity: 1 }];
      } else {
        lineItems = [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: pack.pack_name,
              description: pack.description || `Document pack for ${pack.program_types?.join(', ')}`,
            },
            unit_amount: pack.price_cents,
          },
          quantity: 1,
        }];
      }
    } else {
      // Purchasing single template
      const { data: template, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error || !template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      // Check if free
      if (template.price_cents === 0) {
        // Free template - just record the "purchase" and return access
        const { data: purchase, error: purchaseError } = await supabase
          .from('document_purchases')
          .insert({
            user_id: userId,
            deal_id: dealId,
            template_id: templateId,
            amount_cents: 0,
            status: 'completed',
            purchased_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (purchaseError) {
          console.error('Purchase record error:', purchaseError);
        }

        return NextResponse.json({
          success: true,
          free: true,
          templateId,
          message: 'Free template access granted',
        });
      }

      priceInCents = template.price_cents;
      productName = template.template_name;

      lineItems = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: template.template_name,
            description: template.description || `${template.program_type} ${template.category} template`,
          },
          unit_amount: template.price_cents,
        },
        quantity: 1,
      }];
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/closing-room/${dealId}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/closing-room/${dealId}?purchase=canceled`,
      metadata: {
        userId,
        dealId: dealId || '',
        templateId: templateId || '',
        packId: packId || '',
        productType: packId ? 'pack' : 'template',
      },
    });

    // Record pending purchase
    const { error: purchaseError } = await supabase
      .from('document_purchases')
      .insert({
        user_id: userId,
        deal_id: dealId,
        template_id: templateId,
        pack_id: packId,
        stripe_checkout_session_id: session.id,
        amount_cents: priceInCents,
        status: 'pending',
      });

    if (purchaseError) {
      console.error('Purchase record error:', purchaseError);
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      amount: priceInCents / 100,
      productName,
    });

  } catch (error) {
    console.error('Documents POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}