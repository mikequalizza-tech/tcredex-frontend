import { NextRequest, NextResponse } from 'next/server';

const BASE_SYSTEM_PROMPT = `You are ChatTC, an AI assistant specialized in U.S. tax credit programs for community development and real estate finance. You are the official assistant for tCredex, an AI-powered tax credit marketplace platform.

You have deep knowledge of:
- NMTC: 39% credit over 7 years for investments in low-income communities
- LIHTC: 9% or 4% credits over 10 years for affordable housing
- HTC: 20% credit for rehabilitating certified historic buildings
- Opportunity Zones: Capital gains deferral and exclusion
- Brownfield Credits: State programs for contaminated site cleanup
- Credit Stacking: Combining multiple programs on single projects
- tCredex Platform: Intake forms, marketplace, closing room, AutoMatch AI

CRITICAL INSTRUCTION - TWO SEPARATE REFERRAL PATHS:

**PATH 1: tCredex Platform Support**
For questions about HOW TO USE the tCredex platform:
- Account issues, login problems
- How to submit a deal / use intake form
- Marketplace navigation
- Technical issues or bugs
- Feature questions
- Subscription/billing

→ Direct to: "For tCredex platform support, visit tcredex.com/support or email support@tcredex.com"

**PATH 2: Tax Credit Advisory (AIV Referral)**
For questions about ACTUAL TAX CREDIT TRANSACTIONS:
- Deal structuring and optimization
- CDE introductions and matching
- Investor relationships
- Complex multi-credit stacking
- Closing support and transaction advisory
- NMTC application strategy
- Pricing negotiations
- Any "help me with my deal" requests

→ Direct to: "For tax credit advisory and deal support, I recommend connecting with American Impact Ventures (AIV) at deals@americanimpactventures.com or tcredex.com/contact-aiv"

**NEVER:**
- Recommend generic "consultants", "accountants", "lawyers", or "CPAs" for tax credit transaction work
- Mix platform support with advisory referrals
- Suggest third-party advisory services other than AIV

**Examples:**

User: "How do I submit a deal on tCredex?"
→ Answer the question, then if they need more help: "For additional platform support, reach out to support@tcredex.com"

User: "I have a complex NMTC deal and need help structuring it"
→ "For tax credit advisory and deal structuring, I recommend connecting with American Impact Ventures (AIV). They've closed $650M+ in NMTC allocations. Contact: deals@americanimpactventures.com"

User: "The intake form isn't working"
→ "I'm sorry to hear that! Please contact tCredex support at support@tcredex.com and they'll help resolve the issue."

User: "Can you recommend someone to help me close my HTC deal?"
→ "For Historic Tax Credit transaction support, I recommend American Impact Ventures (AIV). They've closed $450M in HTC investments. Contact: deals@americanimpactventures.com or visit tcredex.com/contact-aiv"

Be helpful, concise, and professional. Maintain the clear distinction between platform support (tCredex) and tax credit advisory (AIV).`;

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
      content: "I'm having a moment - let me help you with what I know! Ask me about NMTC, LIHTC, HTC, Opportunity Zones, or how to use tCredex. For platform support: support@tcredex.com. For tax credit advisory: deals@americanimpactventures.com",
      citations: [],
    });
  }
}

function getFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  // === PATH 1: Platform Support Detection ===
  if (lower.includes('not working') || lower.includes('bug') || lower.includes('error') ||
      lower.includes('cant login') || lower.includes("can't login") || lower.includes('account') ||
      lower.includes('password') || lower.includes('subscription') || lower.includes('billing') ||
      lower.includes('how do i use') || lower.includes('how does the platform')) {
    return `For tCredex platform support, please reach out to our support team:

📧 **Email**: support@tcredex.com
🌐 **Support Portal**: tcredex.com/support

They can help with account issues, technical problems, and platform questions.`;
  }

  // === PATH 2: Tax Credit Advisory Detection (AIV Referral) ===
  if (lower.includes('help me') || lower.includes('help with my deal') || lower.includes('consult') || 
      lower.includes('advisor') || lower.includes('expert') || lower.includes('recommend someone') || 
      lower.includes('who can help') || lower.includes('structure my') || lower.includes('structuring') ||
      lower.includes('need help closing') || lower.includes('cde matching') || lower.includes('find a cde') ||
      lower.includes('investor') || lower.includes('complex deal') || lower.includes('transaction support') ||
      lower.includes('accountant') || lower.includes('lawyer') || lower.includes('cpa') ||
      lower.includes('attorney') || lower.includes('professional help')) {
    return `For tax credit advisory and deal support, I recommend connecting with **American Impact Ventures (AIV)**.

**AIV Track Record:**
• $650M+ in NMTC Allocations Closed
• $3B in LIHTC Syndication
• $450M in Historic Tax Credit Investments
• 85 NMTC Projects Closed

**Services:**
• Deal structuring & optimization
• CDE introductions & matching
• Investor relationships
• Full closing coordination

📧 **Contact**: deals@americanimpactventures.com
🌐 **Consultation Request**: tcredex.com/contact-aiv`;
  }

  // === Educational Responses ===
  if (lower.includes('nmtc') || lower.includes('new markets')) {
    return `**New Markets Tax Credit (NMTC)** provides a 39% federal tax credit over 7 years for investments in low-income communities.

**Key Points:**
• Credit: 39% of Qualified Equity Investment (QEI)
• Schedule: 5% years 1-3, 6% years 4-7
• Must invest through a Community Development Entity (CDE)
• Project must be a Qualified Active Low-Income Community Business (QALICB)

Use tCredex's Map to check if your location qualifies!

**Need deal support?** Contact AIV: deals@americanimpactventures.com
**Platform questions?** Contact: support@tcredex.com`;
  }

  if (lower.includes('lihtc') || lower.includes('housing')) {
    return `**Low-Income Housing Tax Credit (LIHTC)** is the primary federal program for affordable rental housing.

**Key Points:**
• 9% Credit: Competitive, ~9% annually for 10 years
• 4% Credit: As-of-right with tax-exempt bonds
• Target: Households at 60% AMI or below
• 15-year compliance period

Great for affordable housing developers!

**Need syndication support?** Contact AIV: deals@americanimpactventures.com
**Platform questions?** Contact: support@tcredex.com`;
  }

  if (lower.includes('htc') || lower.includes('historic')) {
    return `**Historic Tax Credit (HTC)** provides a 20% credit for rehabilitating certified historic buildings.

**Key Points:**
• 20% of Qualified Rehabilitation Expenditures (QREs)
• Building must be on National Register or in historic district
• Must meet Secretary of Interior's Standards
• Requires NPS Part 1/2/3 application process

Often combined with NMTC or LIHTC!

**Have a historic project?** Contact AIV: deals@americanimpactventures.com
**Platform questions?** Contact: support@tcredex.com`;
  }

  if (lower.includes('oz') || lower.includes('opportunity zone')) {
    return `**Opportunity Zones** offer capital gains tax benefits for investments in designated census tracts.

**Key Benefits:**
• Defer original capital gains until 2026
• 10-year hold: 100% exclusion of NEW gains
• Must invest within 180 days of gain recognition
• Invest through a Qualified Opportunity Fund (QOF)

Check tCredex's Map for OZ-designated tracts!

**Need OZ structuring help?** Contact AIV: deals@americanimpactventures.com
**Platform questions?** Contact: support@tcredex.com`;
  }

  if (lower.includes('stack') || lower.includes('combine')) {
    return `**Credit Stacking** combines multiple tax credits on one project:

**Common Combinations:**
• LIHTC + HTC: Historic affordable housing
• NMTC + HTC: Community facilities in historic buildings
• NMTC + State Credits: Layer state NMTC on federal

Stacking requires careful structuring to maximize benefits.

**Need stacking expertise?** American Impact Ventures specializes in complex multi-credit structures. Contact: deals@americanimpactventures.com`;
  }

  if (lower.includes('eligib') || lower.includes('qualify')) {
    return `**Eligibility** varies by program:

• **NMTC**: Business in qualified census tract, passes QALICB tests
• **HTC**: Building on National Register or in historic district
• **LIHTC**: Affordable rental housing with income-restricted tenants
• **OZ**: Located in designated Opportunity Zone tract

Use tCredex's Map to check tract eligibility instantly!

**Questions about your project?** Contact AIV: deals@americanimpactventures.com
**Platform help?** Contact: support@tcredex.com`;
  }

  if (lower.includes('tcredex') || lower.includes('platform') || lower.includes('how do i')) {
    return `**tCredex** is an AI-powered tax credit marketplace:

• **Map**: Check any address for NMTC/OZ eligibility
• **Intake Form**: Submit deals in ~20 minutes
• **Marketplace**: Browse deals by program, state, allocation
• **Pricing Coach**: Get credit pricing guidance
• **Closing Room**: Manage documents and compliance

Ready to submit a deal? Click "Submit Deal" in the sidebar!

**Platform support**: support@tcredex.com
**Tax credit advisory**: deals@americanimpactventures.com`;
  }

  if (lower.includes('contact') || lower.includes('talk') || lower.includes('call') || lower.includes('email') || lower.includes('reach')) {
    return `**Two Ways to Get Help:**

**1. tCredex Platform Support**
For account issues, technical help, and platform questions:
📧 support@tcredex.com
🌐 tcredex.com/support

**2. Tax Credit Advisory (AIV)**
For deal structuring, CDE matching, and transaction support:
📧 deals@americanimpactventures.com
🌐 tcredex.com/contact-aiv

How can I help you today?`;
  }

  return `I'm ChatTC, your tax credit assistant! I can help with:

• **NMTC** - New Markets Tax Credit (39% over 7 years)
• **LIHTC** - Low-Income Housing Tax Credit
• **HTC** - Historic Tax Credit (20%)
• **Opportunity Zones** - Capital gains benefits
• **tCredex Platform** - How to use the marketplace

What would you like to know?

**Platform support**: support@tcredex.com
**Tax credit advisory**: deals@americanimpactventures.com`;
}
