import { NextRequest, NextResponse } from 'next/server';
import { getEnhancedSystemPrompt } from '@/lib/knowledge/retriever';
import type { Citation } from '@/lib/knowledge/types';

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
    const openaiKey = process.env.OPENAI_API_KEY?.trim();

    // If no API key, use fallback responses
    if (!openaiKey) {
      console.log('No OPENAI_API_KEY configured, using fallback');
      return NextResponse.json({
        content: getFallbackResponse(userMessage),
        citations: [],
      });
    }

    // Get enhanced system prompt with RAG context (if knowledge base has content)
    let systemPrompt = BASE_SYSTEM_PROMPT;
    let citations: Citation[] = [];

    try {
      const ragResult = await getEnhancedSystemPrompt(BASE_SYSTEM_PROMPT, userMessage);
      systemPrompt = ragResult.systemPrompt;
      citations = ragResult.citations;
      if (ragResult.chunksUsed > 0) {
        console.log(`[ChatTC] Retrieved ${ragResult.chunksUsed} knowledge chunks for query`);
      }
    } catch (ragError) {
      // RAG failed - continue with base prompt
      console.log('[ChatTC] RAG retrieval failed, using base prompt:', ragError);
    }

    // Call OpenAI ChatGPT API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      // Fall back to hardcoded response on API error
      return NextResponse.json({
        content: getFallbackResponse(userMessage),
        citations: [],
      });
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || getFallbackResponse(userMessage);

    return NextResponse.json({
      content: assistantMessage,
      citations: citations.map(c => ({
        id: c.id,
        source: c.source,
        page: c.page,
      })),
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
      lower.includes('how do i use') || lower.includes('how does the platform') ||
      lower.includes('intake form') || lower.includes('submit a deal') || lower.includes('marketplace')) {
    return `**tCredex Platform Support**

For account issues, technical problems, and platform questions:

📧 **Email**: support@tcredex.com
🌐 **Support Portal**: tcredex.com/support
💬 **Live Chat**: Available on tcredex.com

**Common Issues:**
• Can't login? Check your email and password
• Intake form not working? Try clearing browser cache
• Marketplace not loading? Refresh the page
• Need to invite team members? Go to Organization Settings

Our support team responds within 2 hours during business hours.`;
  }

  // === PATH 2: Tax Credit Advisory Detection (AIV Referral) ===
  if (lower.includes('help me') || lower.includes('help with my deal') || lower.includes('consult') || 
      lower.includes('advisor') || lower.includes('expert') || lower.includes('recommend someone') || 
      lower.includes('who can help') || lower.includes('structure my') || lower.includes('structuring') ||
      lower.includes('need help closing') || lower.includes('cde matching') || lower.includes('find a cde') ||
      lower.includes('investor') || lower.includes('complex deal') || lower.includes('transaction support') ||
      lower.includes('accountant') || lower.includes('lawyer') || lower.includes('cpa') ||
      lower.includes('attorney') || lower.includes('professional help') || lower.includes('deal support')) {
    return `**Tax Credit Advisory & Deal Support**

For deal structuring, CDE matching, investor introductions, and transaction support, I recommend **American Impact Ventures (AIV)**.

**Why AIV?**
• $650M+ in NMTC Allocations Closed
• $3B in LIHTC Syndication
• $450M in Historic Tax Credit Investments
• 85+ NMTC Projects Successfully Closed
• Expert team with 20+ years experience

**Services:**
✓ Deal structuring & optimization
✓ CDE introductions & matching
✓ Investor relationship management
✓ Full closing coordination
✓ Compliance & regulatory guidance
✓ Multi-credit stacking strategies

📧 **Contact**: deals@americanimpactventures.com
🌐 **Request Consultation**: tcredex.com/contact-aiv
📞 **Phone**: Available for urgent matters

They typically respond within 24 hours and can often move quickly on time-sensitive deals.`;
  }

  // === Educational Responses ===
  if (lower.includes('nmtc') || lower.includes('new markets')) {
    return `**New Markets Tax Credit (NMTC)** - The 39% Federal Tax Credit

**The Basics:**
• **Credit Amount**: 39% of Qualified Equity Investment (QEI)
• **Schedule**: 5% years 1-3, 6% years 4-7
• **Total**: 39% over 7 years
• **Investment Vehicle**: Must invest through a Community Development Entity (CDE)

**Who Qualifies?**
• Business must be in a Qualified Low-Income Community (QLIC)
• Must pass QALICB (Qualified Active Low-Income Community Business) tests
• Project must create jobs or provide essential services

**Key Benefits:**
✓ Significant tax credit reduces investor cost of capital
✓ Enables affordable financing for community projects
✓ Supports job creation in underserved areas
✓ Can be combined with other credits (HTC, LIHTC, State credits)

**Use tCredex to:**
• Check if your location qualifies (use the Map)
• Find CDEs with available allocations
• Connect with investors interested in NMTC deals
• Get pricing guidance for your deal

**Need Deal Support?**
Contact American Impact Ventures: deals@americanimpactventures.com

**Platform Questions?**
Contact tCredex Support: support@tcredex.com`;
  }

  if (lower.includes('lihtc') || lower.includes('housing') || lower.includes('affordable housing')) {
    return `**Low-Income Housing Tax Credit (LIHTC)** - America's Primary Affordable Housing Program

**The Basics:**
• **9% Credit**: Competitive allocation, ~9% annually for 10 years
• **4% Credit**: As-of-right with tax-exempt bonds
• **Total**: 90% credit over 10 years (9%) or 40% (4%)
• **Compliance**: 15-year minimum affordability period

**Who Qualifies?**
• Rental housing projects (not for-sale)
• Households at 60% Area Median Income (AMI) or below
• Must meet rent restrictions
• Can be new construction or rehabilitation

**Key Benefits:**
✓ Largest federal affordable housing program
✓ Produces ~100,000 units annually
✓ Combines with other financing sources
✓ Can stack with HTC, NMTC, or State credits

**The Process:**
1. Developer applies to State Housing Finance Agency (HFA)
2. HFA awards credits based on Qualified Allocation Plan (QAP)
3. Developer syndicates credits to investors
4. Investor equity fills financing gap
5. Project operates with restricted rents for 15+ years

**Use tCredex to:**
• Find LIHTC deals in your target markets
• Connect with syndicators and investors
• Understand pricing and deal structures
• Get guidance on your project

**Need Syndication Help?**
Contact American Impact Ventures: deals@americanimpactventures.com

**Platform Questions?**
Contact tCredex Support: support@tcredex.com`;
  }

  if (lower.includes('htc') || lower.includes('historic')) {
    return `**Historic Tax Credit (HTC)** - Preserving America's Historic Buildings

**The Basics:**
• **Credit Amount**: 20% of Qualified Rehabilitation Expenditures (QREs)
• **Eligibility**: Building on National Register or in certified historic district
• **Standards**: Must meet Secretary of Interior's Standards
• **Timeline**: Multi-year process with NPS review

**Who Qualifies?**
• Historic buildings (typically 50+ years old)
• Substantial rehabilitation (>$5,000 or 5% of basis)
• Commercial, residential, or mixed-use projects
• Can be combined with NMTC or LIHTC

**Key Benefits:**
✓ 20% credit on qualified rehabilitation costs
✓ Preserves historic character and architecture
✓ Often combined with LIHTC for affordable housing
✓ Supports community revitalization
✓ Can stack with NMTC for maximum benefit

**The Process:**
1. Determine if building qualifies (National Register or historic district)
2. Submit Part 1 (project description) to National Park Service
3. Submit Part 2 (detailed plans) for NPS approval
4. Complete rehabilitation per approved plans
5. Submit Part 3 (completion documentation)
6. Claim credits on tax return

**Common Combinations:**
• HTC + LIHTC: Historic affordable housing
• HTC + NMTC: Community facilities in historic buildings
• HTC + State Credits: Maximum layering

**Use tCredex to:**
• Find HTC deals and opportunities
• Connect with experienced HTC syndicators
• Understand deal structures and pricing
• Get guidance on your historic project

**Need HTC Expertise?**
Contact American Impact Ventures: deals@americanimpactventures.com

**Platform Questions?**
Contact tCredex Support: support@tcredex.com`;
  }

  if (lower.includes('oz') || lower.includes('opportunity zone')) {
    return `**Opportunity Zones (OZ)** - Capital Gains Tax Benefits for Community Investment

**The Basics:**
• **Deferral**: Defer original capital gains until December 31, 2026
• **Exclusion**: 100% exclusion of NEW gains if held 10+ years
• **Timing**: Must invest within 180 days of gain recognition
• **Vehicle**: Invest through a Qualified Opportunity Fund (QOF)

**Who Qualifies?**
• Any investor with capital gains to defer
• Businesses investing in OZ-designated census tracts
• Real estate developers in opportunity zones
• Can be combined with other credits (NMTC, LIHTC, HTC)

**Key Benefits:**
✓ Defer capital gains tax for 5+ years
✓ Reduce taxable gains by 15% (if held 5+ years)
✓ 100% exclusion of new gains (if held 10+ years)
✓ Supports community development
✓ Can layer with other tax credits

**The Timeline:**
1. Recognize capital gain (stock sale, real estate sale, etc.)
2. Within 180 days, invest in Qualified Opportunity Fund
3. Fund invests in OZ-designated census tract
4. Hold investment for 10 years
5. Exclude all new gains from taxation

**Common Uses:**
• Real estate development in underserved areas
• Business expansion in opportunity zones
• Mixed-use projects combining OZ + NMTC + LIHTC
• Revitalization projects

**Use tCredex to:**
• Check if your location is in an Opportunity Zone (use the Map)
• Find OZ deals and investment opportunities
• Connect with QOF managers
• Understand deal structures

**Need OZ Structuring Help?**
Contact American Impact Ventures: deals@americanimpactventures.com

**Platform Questions?**
Contact tCredex Support: support@tcredex.com`;
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

  return `**Welcome to ChatTC** - Your Tax Credit AI Assistant

I can help you understand:

**Tax Credit Programs:**
• **NMTC** - 39% credit for low-income community investments
• **LIHTC** - 9% or 4% credits for affordable housing
• **HTC** - 20% credit for historic building rehabilitation
• **Opportunity Zones** - Capital gains deferral and exclusion
• **State Credits** - Additional state-level incentives
• **Credit Stacking** - Combining multiple programs

**tCredex Platform:**
• How to submit a deal
• Using the marketplace
• Finding CDEs and investors
• Understanding pricing
• Managing your team

**What Would You Like to Know?**

Try asking:
• "What is NMTC?"
• "How do I check if my project qualifies?"
• "Can I combine LIHTC with HTC?"
• "How do I submit a deal on tCredex?"
• "Who can help me structure my deal?"

**Quick Links:**
📧 Platform Support: support@tcredex.com
🤝 Deal Advisory: deals@americanimpactventures.com
🌐 tCredex: tcredex.com`;
}
