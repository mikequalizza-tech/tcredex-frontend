# tCredex Platform — Gap Analysis Report

**Generated:** December 22, 2025  
**Baseline:** Workflow Architecture v1.1 + Section C Scoring Framework  
**Codebase:** `C:\tcredex.com\tcredex-frontend\`

---

## Executive Summary

| Category | Built | Partial | Missing | Priority |
|----------|-------|---------|---------|----------|
| Auth & Teams | ✅ | — | — | — |
| Intake Form v4 | — | 🔧 | — | HIGH |
| Scoring Engine | — | 🔧 | ❌ | **CRITICAL** |
| Deal Cards | — | 🔧 | — | HIGH |
| Marketplace | — | 🔧 | — | HIGH |
| Map Platform | — | 🔧 | — | MEDIUM |
| CDE Console | — | 🔧 | — | HIGH |
| Investor Console | — | 🔧 | — | MEDIUM |
| LOI/Commitment Flow | — | — | ❌ | **CRITICAL** |
| Closing Room | — | 🔧 | — | HIGH |
| Ledger/Audit | ✅ | — | — | — |

---

## Detailed Analysis

### 1. AUTH & TEAMS — ✅ BUILT

**Status:** Complete

**Evidence:**
- `/app/(auth)/` — signin, signup, signout, reset-password
- `middleware.ts` — auth protection
- Team roles defined in types

**No action needed.**

---

### 2. INTAKE FORM v4 — 🔧 PARTIAL (80%)

**Status:** Components exist but need integration work

**What Exists:**
```
/components/intake-v4/
├── IntakeShell.tsx          ✅
├── ProgressRail.tsx         ✅
├── ReadinessMeter.tsx       ✅
├── SectionRenderer.tsx      ✅
└── sections/
    ├── ProjectBasics.tsx    ✅
    ├── LocationTract.tsx    ✅
    ├── SponsorDetails.tsx   ✅
    ├── CapitalStack.tsx     ✅
    ├── ProjectCosts.tsx     ✅
    ├── Timeline.tsx         ✅
    ├── SiteControl.tsx      ✅
    ├── ProjectReadiness.tsx ✅
    ├── SocialImpact.tsx     ✅
    ├── EconomicBenefits.tsx ✅
    ├── DueDiligenceDocs.tsx ✅
    ├── ProjectTeam.tsx      ✅
    ├── ProgramSelector.tsx  ✅
    ├── NMTC_QALICB.tsx      ✅
    ├── HTC_Details.tsx      ✅
    ├── LIHTC_Housing.tsx    ✅
    └── OZ_Details.tsx       ✅
```

**What's Missing:**
- [ ] Tier progression logic (30% → Deal Card, 40% → Tier 1, etc.)
- [ ] Auto-save to Supabase
- [ ] Deal Card generation trigger at 30%
- [ ] Project Profile generation at 40%
- [ ] Field validation per tier requirements

**Types:** `types/intake.ts` is comprehensive (300+ lines) ✅

**Priority:** HIGH — This is the entry point for all deals

---

### 3. SCORING ENGINE — ❌ CRITICAL GAP

**Status:** Current implementation does NOT match Section C spec

**What Exists:**
```typescript
// lib/automatch/matchScore.ts (SIMPLIFIED VERSION)
score += 20  // geographic match
score += 25  // severely distressed
score += 25  // program alignment
score += 20  // impact score
score += 10  // project type
```

**What Section C Requires:**
```
4-PILLAR MODEL (100 points):
├── Economic Distress (40 pts)
│   ├── Poverty rate percentile (10)
│   ├── MFI vs metro/state (10)
│   ├── Unemployment percentile (10)
│   ├── PPC flag (3)
│   ├── Non-Metro flag (3)
│   └── Capital Desert Index (4)
│
├── Impact Potential (35 pts)
│   ├── Job Creation (8)
│   ├── Essential Services (8)
│   ├── LMI Benefit (7)
│   ├── Catalytic Effect (6)
│   ├── Community Readiness (3)
│   └── Leverage (3)
│
├── Project Readiness (15 pts)
│   ├── Site Control (4)
│   ├── Pro Forma (3)
│   ├── Third-Party Reports (3)
│   ├── Committed Sources (3)
│   └── Feasible Timeline (2)
│
└── Mission Fit (10 pts)
    ├── Sector Alignment (4)
    ├── Geographic Alignment (4)
    └── Deal Size Alignment (2)
```

**Tier Logic Gap:**
- Current: `Excellent/Good/Fair/Poor` (arbitrary)
- Required: `TIER_1_GREENLIGHT` / `TIER_2_WATCHLIST` / `TIER_3_DEFER`
- Criteria: Distress ≥70% AND Impact ≥65% = Tier 1

**Action Required:**
1. Create `lib/scoring/sectionC.ts` with full 4-pillar implementation
2. Add `deal_scores` table to Supabase
3. Implement SHAP-style explainability
4. Add audit logging for all score runs

**Priority:** **CRITICAL** — Core platform intelligence

---

### 4. DEAL CARDS — 🔧 PARTIAL (60%)

**Status:** Basic component exists, needs enhancement

**What Exists:**
- `components/DealCard.tsx` — Basic card
- `components/deals/DealCardPreview.tsx` — Preview component
- `types/deal.ts` — Deal type definitions ✅

**What's Missing:**
- [ ] Role-based views (Public, CDE, Investor)
- [ ] Traffic light readiness indicators
- [ ] Score breakdown display
- [ ] Tier badge display
- [ ] Action buttons (Watch, Interest, Request Info)
- [ ] Anti-screenshot watermarking
- [ ] PDF generation for download

**Priority:** HIGH — Marketplace depends on this

---

### 5. MARKETPLACE — 🔧 PARTIAL (50%)

**Status:** Basic structure exists, needs major work

**What Exists:**
- `/app/deals/page.tsx` — Deal listing page
- `/app/dashboard/pipeline/page.tsx` — Pipeline view
- `components/maps/MapFilterRail.tsx` — Filter UI

**What's Missing:**
- [ ] Unified marketplace with role-based filtering
- [ ] "Seeking Allocation" vs "Seeking Capital" filters
- [ ] Tier filtering
- [ ] Watch/Interest functionality
- [ ] Bottom comparison bar
- [ ] Sort by match score

**Priority:** HIGH — Core discovery mechanism

---

### 6. MAP PLATFORM — 🔧 PARTIAL (70%)

**Status:** Components exist, census tract rendering incomplete

**What Exists:**
```
/components/maps/
├── DealMap.tsx              ✅
├── DealMapView.tsx          ✅
├── HomeMapWithTracts.tsx    ✅
├── InteractiveMapPlatform.tsx ✅
├── MapFilterRail.tsx        ✅
├── AddressSearch.tsx        ✅
└── MapFilters.tsx           ✅

/lib/tracts/
├── tractData.ts             ✅
└── index.ts                 ✅

/app/api/geo/
├── resolve-tract/           ✅
├── tract-geometry/          ✅
├── tract-lookup/            ✅
└── tracts/                  ✅
```

**What's Missing:**
- [ ] Orange census tract polygon rendering (PolicyMap style)
- [ ] Deal pins with tree icons
- [ ] Distress heatmap overlay
- [ ] CDE service area overlays
- [ ] Clickable popups with eligibility data
- [ ] UTS state highlighting

**Priority:** MEDIUM — Enhances discovery but not blocking

---

### 7. CDE CONSOLE — 🔧 PARTIAL (40%)

**Status:** Basic page exists, major features missing

**What Exists:**
- `/app/cde/page.tsx` — CDE landing page
- `/app/dashboard/allocations/` — Allocation tracking
- `types/cde.ts` — CDE types

**What's Missing:**
- [ ] CDE Mode toggle in marketplace
- [ ] Mandate setting (geography, sectors, size)
- [ ] Pipeline Kanban view
- [ ] LOI issuance workflow
- [ ] IC packet auto-generation
- [ ] Allocation deployment dashboard

**Priority:** HIGH — CDEs are primary buyers

---

### 8. INVESTOR CONSOLE — 🔧 PARTIAL (30%)

**Status:** Minimal implementation

**What Exists:**
- `/app/investor/page.tsx` — Basic investor page
- `/app/dashboard/portfolio/` — Portfolio view
- `types/investor.ts` — Investor types

**What's Missing:**
- [ ] Investment criteria profile
- [ ] CRA requirement tracking
- [ ] Commitment issuance workflow
- [ ] Deal comparison tools
- [ ] Credit claim schedule
- [ ] Portfolio analytics

**Priority:** MEDIUM — After CDE console

---

### 9. LOI & COMMITMENT FLOW — ❌ MISSING

**Status:** Not implemented

**What's Needed:**
```
LOI FLOW:
1. CDE clicks "Issue LOI" on deal
2. Generate from template OR upload custom
3. Submit to Sponsor
4. Sponsor Accept/Reject
5. If accepted → Deal moves to "Seeking Capital"

COMMITMENT FLOW:
1. Investor clicks "Issue Commitment" on deal
2. Generate from template OR upload custom
3. Submit to Sponsor/CDE
4. Multi-party acceptance
5. If accepted → Closing Room opens
```

**Database Needed:**
- `letters_of_intent` table
- `commitments` table
- State machine implementation

**Priority:** **CRITICAL** — Core transaction flow

---

### 10. CLOSING ROOM — 🔧 PARTIAL (65%)

**Status:** Good foundation, needs completion

**What Exists:**
```
/app/closing-room/
├── page.tsx                 ✅
├── layout.tsx               ✅
└── [id]/                    ✅

/components/closing/
├── ClosingChecklist.tsx     ✅
├── ClosingTimeline.tsx      ✅
├── DealRoomParticipants.tsx ✅
├── DocumentVault.tsx        ✅
└── index.ts                 ✅

/supabase/migrations/
└── 005_closing_room_documents.sql ✅ (Comprehensive!)
```

**What's Missing:**
- [ ] Trigger logic (when does closing room open?)
- [ ] Role-based access enforcement
- [ ] Document approval workflow
- [ ] E-signature integration placeholder
- [ ] Deadline alerts
- [ ] Completion percentage tracking

**Priority:** HIGH — Revenue generation point

---

### 11. LEDGER & AUDIT — ✅ BUILT

**Status:** Complete and sophisticated

**Evidence:**
```
/supabase/migrations/001_ledger_schema.sql
- ledger_events table (append-only) ✅
- Hash chain support ✅
- Immutability triggers ✅
- External anchors table ✅
- Verification log ✅

/lib/ledger/ — Ledger utilities ✅
/app/ledger-integrity/ — Integrity checking UI ✅
```

**No action needed.** (Impressive work already done)

---

## Priority Build List

### 🔴 CRITICAL (Must Build Now)

| # | Feature | Est. Hours | Blocks |
|---|---------|-----------|--------|
| 1 | **Section C Scoring Engine** | 16 | AutoMatch, Tier Display, CDE Console |
| 2 | **LOI/Commitment Flow** | 24 | Closing Room trigger |
| 3 | **Intake Tier Progression** | 8 | Deal Card generation |

### 🟡 HIGH (Build This Week)

| # | Feature | Est. Hours | Blocks |
|---|---------|-----------|--------|
| 4 | Deal Card Enhancement | 12 | Marketplace display |
| 5 | Marketplace Filters | 8 | Discovery |
| 6 | CDE Console Features | 16 | CDE engagement |
| 7 | Closing Room Completion | 12 | Transaction completion |

### 🟢 MEDIUM (Build Next Week)

| # | Feature | Est. Hours | Blocks |
|---|---------|-----------|--------|
| 8 | Map Polygon Rendering | 12 | Visual appeal |
| 9 | Investor Console | 12 | Investor engagement |
| 10 | Notification System | 8 | User engagement |

---

## Recommended Build Sequence

```
WEEK 1: Core Transaction Flow
├── Day 1-2: Section C Scoring Engine
├── Day 3-4: LOI Flow (CDE → Sponsor)
└── Day 5: Commitment Flow (Investor → Deal)

WEEK 2: User Experience
├── Day 1-2: Intake Tier Progression + Deal Card Gen
├── Day 3: Deal Card Enhancement
├── Day 4: Marketplace Filters
└── Day 5: CDE Console Features

WEEK 3: Polish & Complete
├── Day 1-2: Closing Room Completion
├── Day 3: Map Polygon Rendering
├── Day 4: Investor Console
└── Day 5: Testing & Bug Fixes
```

---

## Database Tables Status

| Table | Exists | Migration |
|-------|--------|-----------|
| `users` | ✅ | — |
| `teams` | ✅ | — |
| `deals` | ✅ | — |
| `deal_scores` | ❌ | Need to create |
| `letters_of_intent` | ❌ | Need to create |
| `commitments` | ❌ | Need to create |
| `ledger_events` | ✅ | 001 |
| `closing_checklist_templates` | ✅ | 005 |
| `deal_checklists` | ✅ | 005 |
| `document_templates` | ✅ | 005 |
| `generated_documents` | ✅ | 005 |

---

## Conclusion

**Good News:** You have a solid foundation. Auth, ledger, closing room schema, intake components, and map components are substantial.

**Challenge:** The scoring engine and LOI/Commitment flow are completely missing — these are the "business logic" that makes tCredex a marketplace vs. just a form.

**Recommendation:** Start with Section C Scoring Engine. Everything else depends on deals having proper scores and tiers.

---

*Ready to begin implementation on your command.*
