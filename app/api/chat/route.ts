import { NextRequest, NextResponse } from 'next/server';

const BASE_SYSTEM_PROMPT = `You are ChatTC, an AI assistant specialized in U.S. tax credit programs for community development and real estate finance. You are the official assistant for tCredex, an AI-powered tax credit marketplace platform.

You have deep knowledge of:

1. **tCredex Platform**
   - Intake Form v4 for deal submission
   - Readiness scoring (0-100) based on site control, capital stack, documentation, approvals, timeline
   - Marketplace for connecting sponsors with CDEs and investors
   - Closing Room for document management and deal completion
   - AutoMatch AI for deal-investor pairing

2. **NMTC (New Markets Tax Credit)**
   - 39% credit over 7 years (5% first 3 years, 6% last 4 years)
   - QALICB eligibility tests (gross income, tangible property, employee services, prohibited business)
   - QEI investment structure and leverage models
   - CDE allocation and deployment requirements

3. **LIHTC (Low-Income Housing Tax Credit)**
   - 9% (competitive) and 4% (bond-financed) credits over 10 years
   - Income targeting (30%, 40%, 50%, 60%, 70%, 80% AMI)
   - Minimum set-aside elections (20/50, 40/60, income averaging)
   - Extended use agreements and compliance periods

4. **HTC (Historic Tax Credit)**
   - 20% federal credit for qualified rehabilitation expenditures (QREs)
   - Part 1/2/3 NPS application process
   - Secretary of Interior's Standards for Rehabilitation
   - State HTC programs and stacking opportunities

5. **Opportunity Zones**
   - 180-day investment window from capital gain recognition
   - QOF and QOZB requirements
   - Substantial improvement test for existing properties
   - 5/7/10 year holding period benefits

You help users understand:
- Eligibility requirements and qualification tests
- Credit amounts, claim periods, and structures
- Strategic layering of multiple credit programs
- Compliance requirements and timelines
- How to use the tCredex platform effectively

Be concise, professional, and helpful. If you don't know something specific, recommend the user consult with a tax advisor or reach out to tCredex support.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1]?.content || '';

    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicKey) {
      // Fallback response if no API key configured
      return NextResponse.json({
        content: getFallbackResponse(userMessage),
        citations: [],
      });
    }

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
      const error = await response.text();
      console.error('Claude API error:', error);
      return NextResponse.json({
        content: getFallbackResponse(userMessage),
        citations: [],
      });
    }

    const data = await response.json();
    const assistantMessage = data.content[0]?.text || 'I apologize, I could not generate a response.';

    return NextResponse.json({ 
      content: assistantMessage,
      citations: [],
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

function getFallbackResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  // Platform questions
  if (lowerMessage.includes('tcredex') || lowerMessage.includes('platform') || lowerMessage.includes('submit')) {
    return `tCredex is an AI-powered tax credit marketplace that connects project sponsors with CDEs and investors across multiple programs (NMTC, HTC, LIHTC, OZ).

**Key Features:**
• **Intake Form v4**: Submit your project in ~20 minutes with automatic readiness scoring
• **Marketplace**: Browse and filter deals by program, state, allocation amount
• **AutoMatch AI**: Get matched with compatible investors based on project characteristics
• **Closing Room**: Manage documents, checklists, and compliance in one place

Would you like to know more about submitting a deal or using a specific feature?`;
  }

  if (lowerMessage.includes('readiness') || lowerMessage.includes('score')) {
    return `**Readiness Score** is tCredex's measure of how prepared your project is for closing (0-100 points).

**Scoring Dimensions:**
• **Site Control** (20 pts): Owned = 20, Under Contract = 10, LOI = 5
• **Capital Stack** (25 pts): 80%+ identified = 25, 60%+ = 15
• **Documentation** (25 pts): Based on % of required docs uploaded
• **Approvals** (20 pts): Entitlements approved = 20, submitted = 10
• **Timeline** (10 pts): Construction within 6 months = 10, 12 months = 5

**Tiers:**
• 80-100: Shovel Ready ✅
• 60-79: Advanced
• 40-59: Developing
• 0-39: Early Stage

Score 40+ to submit to the marketplace.`;
  }

  if (lowerMessage.includes('nmtc') || lowerMessage.includes('new markets')) {
    return `**New Markets Tax Credit (NMTC)** provides a 39% tax credit over 7 years for investments in low-income communities.

**Key Points:**
• **Credit**: 39% of Qualified Equity Investment (QEI)
• **Schedule**: 5% years 1-3, 6% years 4-7
• **Eligible**: Businesses in qualified census tracts meeting QALICB tests
• **QALICB Tests**: 50% gross income, 40% tangible property, 40% services in LIC
• **Prohibited**: Golf courses, country clubs, liquor stores, gambling facilities

**Structure:**
Investment Fund → CDE → QLICI Loan → QALICB (Project)

Use tCredex's Map feature to check if your address is in a qualified tract.`;
  }

  if (lowerMessage.includes('lihtc') || lowerMessage.includes('housing')) {
    return `**Low-Income Housing Tax Credit (LIHTC)** is the primary federal program for affordable rental housing.

**Key Points:**
• **9% Credit**: Competitive, ~9% of eligible costs annually for 10 years
• **4% Credit**: As-of-right with tax-exempt bonds, ~4% annually for 10 years
• **Target**: Households at 60% Area Median Income (AMI) or below
• **Compliance**: 15-year initial period, typically 30+ year extended use

**Set-Aside Elections:**
• 20% at 50% AMI
• 40% at 60% AMI
• Income Averaging (average 60% across all units)

LIHTC can be combined with HTC for historic affordable housing projects.`;
  }

  if (lowerMessage.includes('htc') || lowerMessage.includes('historic')) {
    return `**Historic Tax Credit (HTC)** provides a 20% credit for rehabilitating certified historic buildings.

**Key Points:**
• **Credit**: 20% of Qualified Rehabilitation Expenditures (QREs)
• **Eligible**: Buildings on National Register or in registered historic districts
• **Standards**: Must meet Secretary of Interior's Standards for Rehabilitation
• **Substantial Rehab**: QREs must exceed adjusted basis or $5,000

**NPS Process:**
• **Part 1**: Certifies historic significance
• **Part 2**: Approves proposed rehabilitation work
• **Part 3**: Certifies completed work (after construction)

HTC is often combined with NMTC or LIHTC for maximum benefit.`;
  }

  if (lowerMessage.includes('oz') || lowerMessage.includes('opportunity zone')) {
    return `**Opportunity Zones** offer capital gains benefits for investments in designated census tracts.

**Key Benefits:**
• **Deferral**: Defer recognition of original capital gain until 2026
• **5-Year Hold**: 10% step-up in basis
• **7-Year Hold**: Additional 5% step-up (15% total)
• **10-Year Hold**: 100% exclusion of NEW gains from OZ investment

**Requirements:**
• Invest within 180 days of capital gain recognition
• Invest through a Qualified Opportunity Fund (QOF)
• 90% of QOF assets must be in Qualified OZ Property
• **Substantial Improvement**: For existing buildings, improvements must exceed original basis within 30 months

Use tCredex's Map to identify Opportunity Zone tracts.`;
  }

  if (lowerMessage.includes('stack') || lowerMessage.includes('layer') || lowerMessage.includes('combine')) {
    return `**Credit Stacking** combines multiple tax credits on a single project to maximize financing.

**Common Combinations:**
• **LIHTC + HTC**: Historic affordable housing (mill conversions)
• **NMTC + HTC**: Community facilities in historic buildings
• **NMTC + OZ**: Different portions of project (careful with overlapping compliance)
• **Any + Brownfield**: Add state brownfield credits for environmental cleanup

**Key Considerations:**
• Credits apply to different cost bases
• Compliance requirements must all be met
• Timing of credit claims varies by program
• tCredex's Pricing Coach helps model stacked structures

Want to explore a specific combination for your project?`;
  }

  if (lowerMessage.includes('eligib') || lowerMessage.includes('qualify')) {
    return `Tax credit eligibility depends on the program:

**NMTC (QALICB Tests):**
✓ 50%+ gross income from active business in LIC
✓ 40%+ tangible property used in LIC
✓ 40%+ employee services performed in LIC
✓ Not a prohibited business type

**HTC:**
✓ Building listed on National Register OR
✓ Contributing structure in historic district
✓ Substantial rehabilitation (QREs > adjusted basis)

**LIHTC:**
✓ Affordable rental housing
✓ Income-restricted tenants (≤60% AMI)
✓ Rent-restricted units

**OZ:**
✓ Located in designated Opportunity Zone tract
✓ Capital gain invested within 180 days
✓ Held through Qualified Opportunity Fund

Use tCredex's Intake Form to check program-specific eligibility for your project.`;
  }

  return `I'm ChatTC, your tax credit assistant for tCredex. I can help with:

• **NMTC** - New Markets Tax Credit (39% over 7 years)
• **LIHTC** - Low-Income Housing Tax Credit (9% or 4% for affordable housing)
• **HTC** - Historic Tax Credit (20% for rehabilitation)
• **Opportunity Zones** - Capital gains deferral and exclusion
• **tCredex Platform** - How to submit deals, readiness scoring, marketplace

What would you like to know more about? You can also use tCredex's Map feature to check if any address qualifies for these programs.`;
}
