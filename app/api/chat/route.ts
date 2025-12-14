import { NextRequest, NextResponse } from 'next/server';

const BASE_SYSTEM_PROMPT = `You are ChatTC, an AI assistant specialized in U.S. tax credit programs for community development and real estate finance. You are the official assistant for tCredex, an AI-powered tax credit marketplace platform.

You have deep knowledge of:
- NMTC: 39% credit over 7 years for investments in low-income communities
- LIHTC: 9% or 4% credits over 10 years for affordable housing
- HTC: 20% credit for rehabilitating certified historic buildings
- Opportunity Zones: Capital gains deferral and exclusion
- tCredex Platform: Intake forms, marketplace, closing room, AutoMatch AI

Be helpful, concise, and professional. If you don't know something specific, say so.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { content: 'Invalid request format', citations: [] },
        { status: 400 }
      );
    }

    const userMessage = messages[messages.length - 1]?.content || '';
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // If no API key, use fallback responses
    if (!anthropicKey) {
      console.log('No ANTHROPIC_API_KEY configured, using fallback');
      return NextResponse.json({
        content: getFallbackResponse(userMessage),
        citations: [],
      });
    }

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: BASE_SYSTEM_PROMPT,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      // Fall back to hardcoded response on API error
      return NextResponse.json({
        content: getFallbackResponse(userMessage),
        citations: [],
      });
    }

    const data = await response.json();
    const assistantMessage = data.content?.[0]?.text || getFallbackResponse(userMessage);

    return NextResponse.json({ 
      content: assistantMessage,
      citations: [],
    });
  } catch (error) {
    console.error('Chat API error:', error);
    // Always return a valid response, never throw
    return NextResponse.json({
      content: "I'm having a moment - let me help you with what I know! Ask me about NMTC, LIHTC, HTC, Opportunity Zones, or how to use tCredex.",
      citations: [],
    });
  }
}

function getFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('nmtc') || lower.includes('new markets')) {
    return `**New Markets Tax Credit (NMTC)** provides a 39% federal tax credit over 7 years for investments in low-income communities.

**Key Points:**
• Credit: 39% of Qualified Equity Investment (QEI)
• Schedule: 5% years 1-3, 6% years 4-7
• Must invest through a Community Development Entity (CDE)
• Project must be a Qualified Active Low-Income Community Business (QALICB)

Use tCredex's Map to check if your location qualifies!`;
  }

  if (lower.includes('lihtc') || lower.includes('housing')) {
    return `**Low-Income Housing Tax Credit (LIHTC)** is the primary federal program for affordable rental housing.

**Key Points:**
• 9% Credit: Competitive, ~9% annually for 10 years
• 4% Credit: As-of-right with tax-exempt bonds
• Target: Households at 60% AMI or below
• 15-year compliance period

Great for affordable housing developers!`;
  }

  if (lower.includes('htc') || lower.includes('historic')) {
    return `**Historic Tax Credit (HTC)** provides a 20% credit for rehabilitating certified historic buildings.

**Key Points:**
• 20% of Qualified Rehabilitation Expenditures (QREs)
• Building must be on National Register or in historic district
• Must meet Secretary of Interior's Standards
• Requires NPS Part 1/2/3 application process

Often combined with NMTC or LIHTC!`;
  }

  if (lower.includes('oz') || lower.includes('opportunity zone')) {
    return `**Opportunity Zones** offer capital gains tax benefits for investments in designated census tracts.

**Key Benefits:**
• Defer original capital gains until 2026
• 10-year hold: 100% exclusion of NEW gains
• Must invest within 180 days of gain recognition
• Invest through a Qualified Opportunity Fund (QOF)

Check tCredex's Map for OZ-designated tracts!`;
  }

  if (lower.includes('stack') || lower.includes('combine')) {
    return `**Credit Stacking** combines multiple tax credits on one project:

**Common Combinations:**
• LIHTC + HTC: Historic affordable housing
• NMTC + HTC: Community facilities in historic buildings
• NMTC + State Credits: Layer state NMTC on federal

tCredex's Pricing Coach can help model stacked structures!`;
  }

  if (lower.includes('eligib') || lower.includes('qualify')) {
    return `**Eligibility** varies by program:

• **NMTC**: Business in qualified census tract, passes QALICB tests
• **HTC**: Building on National Register or in historic district
• **LIHTC**: Affordable rental housing with income-restricted tenants
• **OZ**: Located in designated Opportunity Zone tract

Use tCredex's Map to check tract eligibility instantly!`;
  }

  if (lower.includes('tcredex') || lower.includes('platform')) {
    return `**tCredex** is an AI-powered tax credit marketplace:

• **Map**: Check any address for NMTC/OZ eligibility
• **Intake Form**: Submit deals in ~20 minutes
• **Marketplace**: Browse deals by program, state, allocation
• **Pricing Coach**: Get credit pricing guidance
• **Closing Room**: Manage documents and compliance

Ready to submit a deal? Click "Submit Deal" in the sidebar!`;
  }

  return `I'm ChatTC, your tax credit assistant! I can help with:

• **NMTC** - New Markets Tax Credit (39% over 7 years)
• **LIHTC** - Low-Income Housing Tax Credit
• **HTC** - Historic Tax Credit (20%)
• **Opportunity Zones** - Capital gains benefits
• **tCredex Platform** - How to use the marketplace

What would you like to know?`;
}
