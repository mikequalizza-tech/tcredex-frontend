# tCredex Platform — Workflow Architecture v1.0
## Master Specification Document

**Version:** 1.1  
**Date:** December 22, 2025  
**Status:** DRAFT — Updated with Section C Scoring Model

---

## Table of Contents

1. [User Types & Roles](#1-user-types--roles)
2. [Credit Types & Routing](#2-credit-types--routing)
3. [Deal Tier System](#3-deal-tier-system)
4. [Intake Form → Tier Progression](#4-intake-form--tier-progression)
5. [Document Generation Points](#5-document-generation-points)
6. [Marketplace Architecture](#6-marketplace-architecture)
7. [NMTC Workflow (with CDE)](#7-nmtc-workflow-with-cde)
8. [HTC/LIHTC/OZ Workflow (Direct)](#8-htclihtcoz-workflow-direct)
9. [LOI & Commitment Letter Flow](#9-loi--commitment-letter-flow)
10. [Closing Room Trigger & Access](#10-closing-room-trigger--access)
11. [AutoMatch AI Scoring](#11-automatch-ai-scoring)
12. [User Journeys](#12-user-journeys)
13. [Notification Matrix](#13-notification-matrix)
14. [Permission Matrix](#14-permission-matrix)
15. [State Machine Definitions](#15-state-machine-definitions)

---

## 1. User Types & Roles

### Primary User Types

| Type | Role | Primary Goal | Key Actions |
|------|------|--------------|-------------|
| **Sponsor** | Project owner/developer | Secure tax credit financing | Submit intake, manage project, accept LOI/Commitment |
| **CDE** | NMTC allocatee | Deploy allocation to quality projects | Review deals, issue LOI, manage pipeline |
| **Investor** | Capital provider | Acquire tax credits at target pricing | Review deals, issue Commitment Letter, fund deals |
| **Admin** | Platform operator | Manage marketplace, ensure compliance | User management, reporting, system config |

### Team Roles (Within Organizations)

| Role | Permissions |
|------|-------------|
| **ORG_ADMIN** | Full org control, user management, all deals |
| **PROJECT_ADMIN** | Manage assigned projects, team members |
| **MEMBER** | View and edit assigned projects |
| **VIEWER** | Read-only access to assigned projects |

---

## 2. Credit Types & Routing

### Supported Credit Programs

| Credit Type | Requires CDE? | Marketplace Route | Typical Structure |
|-------------|---------------|-------------------|-------------------|
| **Federal NMTC** | ✅ YES | CDE Marketplace → Investor Marketplace | Leveraged or Direct |
| **State NMTC** | ✅ YES | CDE Marketplace → Investor Marketplace | Varies by state |
| **HTC (Historic)** | ❌ NO | Direct to Investor Marketplace | Syndication |
| **LIHTC** | ❌ NO | Direct to Investor Marketplace | 4% or 9% allocation |
| **Opportunity Zone** | ❌ NO | Direct to Investor Marketplace | QOF structure |

### Routing Logic

```
IF credit_type IN ['Federal NMTC', 'State NMTC']:
    route → CDE_MARKETPLACE
    THEN → INVESTOR_MARKETPLACE (after LOI)
ELSE:
    route → INVESTOR_MARKETPLACE (direct)
```

---

## 3. Deal Tier System

### Tier Definitions

| Completion % | Tier | Label | Marketplace Status | Match Probability |
|--------------|------|-------|-------------------|-------------------|
| **0-29%** | — | Draft | Not Listed | — |
| **30-39%** | Deal Card | Early Stage | Listed with Warning | Low |
| **40-59%** | Tier 1 | Active | Listed | Moderate |
| **60-79%** | Tier 2 | Advanced | Listed + Enhanced | Good |
| **80-99%** | Tier 3 | Shovel Ready | Featured | High |
| **100%** | Complete | Closing Ready | In Closing Room | Committed |

### Tier Display in Marketplace

**Tier: Deal Card (30-39%)**
```
⚠️ EARLY STAGE
"Match probability increases significantly at Tier 2 (60%+)"
Progress: ████░░░░░░░░░░░░ 35%
```

**Tier 1 (40-59%)**
```
📋 TIER 1 - ACTIVE
"Complete Sources & Uses and Timeline to reach Tier 2"
Progress: ████████░░░░░░░░ 52%
```

**Tier 2 (60-79%)**
```
📈 TIER 2 - ADVANCED
"Confirm site control and permits for Shovel Ready status"
Progress: ████████████░░░░ 72%
```

**Tier 3 (80%+)**
```
🏆 TIER 3 - SHOVEL READY
"Gap Financing Only — Ready for Commitment"
Progress: █████████████░░░ 87%
```

---

## 4. Intake Form → Tier Progression

### Field Groups & Tier Unlocks

#### 30% — Deal Card Generated
**Required Fields:**
- [ ] Project Name
- [ ] Project Address
- [ ] Census Tract (auto-populated)
- [ ] Credit Type(s) requested
- [ ] Total Project Cost
- [ ] NMTC/Credit Request Amount
- [ ] Sponsor Name
- [ ] Sponsor Email

#### 40% — Tier 1 (Project Profile)
**Additional Required:**
- [ ] Project Description (min 200 chars)
- [ ] Community Impact Statement
- [ ] Project Type/Category
- [ ] 2-3 Project Images/Renderings
- [ ] Sponsor Organization Info
- [ ] Primary Contact Phone

#### 60% — Tier 2 (Advanced)
**Additional Required:**
- [ ] Sources & Uses Table
- [ ] Financing Gap Amount
- [ ] Project Timeline (start/completion)
- [ ] Site Control Status
- [ ] Site Control Documentation
- [ ] Key Project Partners
- [ ] Jobs Created/Retained estimate

#### 80% — Tier 3 (Shovel Ready)
**Additional Required:**
- [ ] Permits/Zoning Status: Approved
- [ ] Environmental Status: Clear/Phase I complete
- [ ] Construction Documents: Available
- [ ] Committed Financing Sources
- [ ] Letters of Support/Intent
- [ ] Detailed Pro Forma

#### 100% — Closing Ready
**Additional Required:**
- [ ] All Due Diligence Documents
- [ ] Legal Entity Documentation
- [ ] Title Commitment
- [ ] Insurance Certificates
- [ ] Final Sources & Uses
- [ ] Executed LOI / Commitment Letter

---

## 5. Document Generation Points

### Auto-Generated Documents

| Document | Trigger | Data Source | Output Format |
|----------|---------|-------------|---------------|
| **Deal Card** | 30% completion | Intake fields | PDF / Web view |
| **Project Profile** | 40% completion | Intake + images | PDF / Web view |
| **Enhanced Profile** | 60% completion | Full intake | PDF / Web view |
| **LOI** | CDE action | Deal + CDE terms | Word / PDF |
| **Commitment Letter** | Investor action | Deal + Investor terms | Word / PDF |
| **Closing Checklist** | Closing Room open | Deal type template | PDF / Tracker |

### Document Templates Required

1. **Deal Card Template** — Mini summary (1 page)
2. **Project Profile Template** — Full summary (3-5 pages)
3. **LOI Template** — CDE commitment terms
4. **Commitment Letter Template** — Investor commitment terms
5. **Structure Diagram Template** — Visual deal structure
6. **Closing Checklist Template** — Per credit type

---

## 6. Marketplace Architecture

### Marketplace Types

| Marketplace | Accessible By | Lists | Purpose |
|-------------|---------------|-------|---------|
| **CDE Marketplace** | CDEs | NMTC deals seeking allocation | CDE finds projects to allocate to |
| **Investor Marketplace** | Investors | All deals with LOI or direct credits | Investors find deals to fund |

### RECOMMENDATION: Single Marketplace with Filters

```
MARKETPLACE
├── Filter: Credit Type (NMTC, HTC, LIHTC, OZ)
├── Filter: Deal Stage (Seeking Allocation, Seeking Capital, Both)
├── Filter: Tier (1, 2, 3)
├── Filter: Geography (State, Metro, Rural)
├── Filter: Project Type (Healthcare, Education, Hospitality, etc.)
├── Filter: Deal Size ($1-5M, $5-10M, $10-25M, $25M+)
└── Filter: Distress Level (Eligible, Severely Distressed, Deep Distress)
```

**Stage Filter Logic:**
- "Seeking Allocation" = NMTC deals without LOI (CDE view)
- "Seeking Capital" = Deals with LOI or non-NMTC credits (Investor view)
- "Both" = Show all

---

## 7. NMTC Workflow (with CDE)

### Complete NMTC Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        SPONSOR JOURNEY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [1] LOGIN/REGISTER                                             │
│         ↓                                                       │
│  [2] CREATE/JOIN TEAM                                           │
│         ↓                                                       │
│  [3] START INTAKE FORM                                          │
│         ↓                                                       │
│  [4] REACH 30% → Deal Card Generated                            │
│         ↓                                                       │
│  [5] REACH 40% → Project Profile → LISTED IN MARKETPLACE        │
│         ↓                                                       │
│  [6] CONTINUE TO 60%/80% → Tier Up                              │
│         ↓                                                       │
│  [7] CDE EXPRESSES INTEREST ← (CDE views in marketplace)        │
│         ↓                                                       │
│  [8] CDE ISSUES LOI                                             │
│         ↓                                                       │
│  [9] SPONSOR ACCEPTS LOI                                        │
│         ↓                                                       │
│  [10] DEAL MOVES TO "SEEKING CAPITAL" STATUS                    │
│         ↓                                                       │
│  [11] INVESTOR EXPRESSES INTEREST ← (Investor views deal)       │
│         ↓                                                       │
│  [12] INVESTOR ISSUES COMMITMENT LETTER                         │
│         ↓                                                       │
│  [13] SPONSOR/CDE ACCEPTS COMMITMENT                            │
│         ↓                                                       │
│  [14] CLOSING ROOM OPENS                                        │
│         ↓                                                       │
│  [15] DUE DILIGENCE → 100% COMPLETION                           │
│         ↓                                                       │
│  [16] CLOSING                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### NMTC Deal States

| State | Description | Who Can Act |
|-------|-------------|-------------|
| `DRAFT` | Intake in progress, <30% | Sponsor |
| `DEAL_CARD` | 30%+, not yet listed | Sponsor |
| `LISTED_SEEKING_ALLOCATION` | In CDE marketplace | Sponsor, CDE (view) |
| `LOI_PENDING` | LOI issued, awaiting acceptance | Sponsor, CDE |
| `LOI_ACCEPTED` | LOI accepted, seeking capital | Sponsor, CDE, Investor (view) |
| `COMMITMENT_PENDING` | Commitment issued, awaiting acceptance | Sponsor, CDE, Investor |
| `COMMITMENT_ACCEPTED` | Commitment accepted | Sponsor, CDE, Investor |
| `CLOSING` | In closing room | All parties + Counsel |
| `CLOSED` | Deal complete | Read-only |
| `WITHDRAWN` | Sponsor withdrew | Read-only |
| `EXPIRED` | LOI/Commitment expired | Sponsor can reactivate |

---

## 8. HTC/LIHTC/OZ Workflow (Direct)

### Direct-to-Investor Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   DIRECT CREDIT WORKFLOW                        │
│                   (HTC, LIHTC, OZ)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [1] LOGIN/REGISTER                                             │
│         ↓                                                       │
│  [2] CREATE/JOIN TEAM                                           │
│         ↓                                                       │
│  [3] START INTAKE FORM (Select HTC/LIHTC/OZ)                    │
│         ↓                                                       │
│  [4] REACH 30% → Deal Card Generated                            │
│         ↓                                                       │
│  [5] REACH 40% → Project Profile → LISTED IN MARKETPLACE        │
│         ↓ (Listed as "Seeking Capital" — no CDE step)           │
│  [6] CONTINUE TO 60%/80% → Tier Up                              │
│         ↓                                                       │
│  [7] INVESTOR EXPRESSES INTEREST                                │
│         ↓                                                       │
│  [8] INVESTOR ISSUES COMMITMENT LETTER                          │
│         ↓                                                       │
│  [9] SPONSOR ACCEPTS COMMITMENT                                 │
│         ↓                                                       │
│  [10] CLOSING ROOM OPENS                                        │
│         ↓                                                       │
│  [11] DUE DILIGENCE → 100%                                      │
│         ↓                                                       │
│  [12] CLOSING                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Direct Credit Deal States

| State | Description |
|-------|-------------|
| `DRAFT` | Intake in progress |
| `DEAL_CARD` | 30%+, not listed |
| `LISTED_SEEKING_CAPITAL` | In investor marketplace |
| `COMMITMENT_PENDING` | Commitment issued |
| `COMMITMENT_ACCEPTED` | Ready for closing |
| `CLOSING` | In closing room |
| `CLOSED` | Complete |

---

## 9. LOI & Commitment Letter Flow

### Letter of Intent (LOI) — CDE → Sponsor

**Trigger:** CDE clicks "Issue LOI" on deal in marketplace

**LOI Contains:**
- CDE Name and Allocation Year
- Allocation Amount Committed
- Expected Closing Timeline
- Key Terms and Conditions
- Fees (if any)
- Expiration Date
- Signature Block

**LOI Options:**
1. **Generate** — Use platform template with auto-filled deal data
2. **Upload** — CDE uploads their own LOI document

**LOI States:**
- `DRAFT` — CDE preparing
- `ISSUED` — Sent to Sponsor
- `ACCEPTED` — Sponsor accepted
- `REJECTED` — Sponsor declined
- `EXPIRED` — Past expiration date
- `SUPERSEDED` — New LOI replaced this one

### Commitment Letter — Investor → Deal

**Trigger:** Investor clicks "Issue Commitment" on deal

**Commitment Letter Contains:**
- Investor Name and Entity
- Commitment Amount
- Pricing Terms (credit price, yield)
- Capital Call Schedule
- Conditions Precedent
- Expiration Date
- Signature Block

**Commitment Options:**
1. **Generate** — Use platform template
2. **Upload** — Investor uploads their own

**Commitment States:**
- `DRAFT` — Investor preparing
- `ISSUED` — Sent to Sponsor/CDE
- `ACCEPTED` — Parties accepted
- `REJECTED` — Declined
- `EXPIRED` — Past expiration
- `FUNDED` — Capital deployed

### Multiple Commitments

A deal CAN have multiple Commitment Letters if:
- Financing gap requires multiple investors
- Different credit types have different investors

**Example:**
```
Deal: Community Health Center
Financing Gap: $15M

Commitment 1: Bank ABC — $8M @ 0.82 credits
Commitment 2: Fund XYZ — $7M @ 0.80 credits

Total Committed: $15M ✓
```

---

## 10. Closing Room Trigger & Access

### When Does Closing Room Open?

**NMTC Deals:**
```
Closing Room opens when:
  LOI_ACCEPTED = TRUE
  AND
  (COMMITMENT_ACCEPTED = TRUE OR total_commitments >= financing_gap)
```

**Direct Credit Deals:**
```
Closing Room opens when:
  COMMITMENT_ACCEPTED = TRUE
  OR
  total_commitments >= financing_gap
```

### Closing Room Access Matrix

| Role | Access Level |
|------|--------------|
| **Sponsor (ORG_ADMIN)** | Full — upload, view, manage |
| **Sponsor (MEMBER)** | View + upload assigned docs |
| **CDE (Deal Lead)** | Full — review, approve, upload |
| **Investor (Deal Lead)** | Full — review, approve, upload |
| **Counsel (Sponsor)** | View + upload legal docs |
| **Counsel (CDE)** | View + upload legal docs |
| **Counsel (Investor)** | View + upload legal docs |
| **Platform Admin** | Full + audit |

### Closing Room Features

1. **Document Checklist** — Per credit type
2. **Version Control** — Track document revisions
3. **Comments/Notes** — Per document
4. **Status Tracking** — Pending, Submitted, Approved, Rejected
5. **Deadline Alerts** — Closing date countdown
6. **Signature Tracking** — Who signed what, when

---

## 11. AutoMatch AI Scoring

> **Canonical Source:** See `docs/chatgpt-generated/SECTION_C_SCORING_ENGINE_FRAMEWORK.md` for full specification.

### 4-Pillar Scoring Model (100 Points Total)

| Pillar | Points | Weight | Description |
|--------|--------|--------|-------------|
| **Economic Distress** | 0-40 | 40% | Poverty, MFI, unemployment, PPC, non-metro, capital desert |
| **Impact Potential** | 0-35 | 35% | Jobs, essential services, LMI benefit, catalytic effect |
| **Project Readiness** | 0-15 | 15% | Site control, pro forma, reports, committed sources |
| **Mission Fit** | 0-10 | 10% | CDE sector, geography, deal size alignment |
| **TOTAL** | **100** | 100% | |

### Economic Distress Variables (0-40)

| Variable | Points | Source |
|----------|--------|--------|
| Poverty rate percentile | 10 | ACS |
| MFI vs metro/state | 10 | ACS |
| Unemployment percentile | 10 | BLS |
| Persistent Poverty County (PPC) | 3 | USDA |
| Non-Metro flag | 3 | USDA |
| Capital Desert Index | 4 | CDFI Fund |

**Formula:**
```
Distress = 0.25 * (poverty_z + mfi_z + unemp_z) + PPC_flag + nonmetro_flag + capital_desert_score
```

### Impact Potential Variables (0-35)

| Variable | Points | Description |
|----------|--------|-------------|
| Job Creation | 8 | Permanent jobs created/retained |
| Essential Services | 8 | Healthcare, education, food access |
| LMI Benefit | 7 | Direct benefit to low-income residents |
| Catalytic Effect | 6 | Potential to spur additional investment |
| Community Readiness | 3 | Local support, partnerships |
| Leverage | 3 | Ratio of other funding to credit request |

### Project Readiness Variables (0-15)

| Variable | Points | Criteria |
|----------|--------|----------|
| Site Control | 4 | Owned (4), Contract (3), Option (2), None (0) |
| Completed Pro Forma | 3 | Financial projections complete |
| Third-Party Reports | 3 | Appraisal + Phase I + market study |
| Committed Sources ≥70% | 3 | Other financing committed |
| Feasible Timeline | 2 | Realistic schedule |

### Mission Fit Variables (0-10)

| Variable | Points | Description |
|----------|--------|-------------|
| Sector Alignment | 4 | Matches CDE priority sectors |
| Geographic Alignment | 4 | Within CDE target geography |
| Deal Size Alignment | 2 | Within CDE typical range |

**Note:** Mission Fit is CDE-specific — same project may score differently for different CDEs.

### Tier Classification (Section C Approved)

| Tier | Label | Criteria | AutoMatch Action |
|------|-------|----------|------------------|
| **Tier 1** | Greenlight | Distress ≥70% AND Impact ≥65% | Auto-route to matching CDEs |
| **Tier 2** | Watchlist | Distress ≥60% OR Impact ≥60% | Manual review recommended |
| **Tier 3** | Defer | Below thresholds | Needs improvement |

### Tier Logic

```python
def assign_tier(distress, impact):
    # Normalize to 100-point scale
    distress_pct = (distress / 40) * 100
    impact_pct = (impact / 35) * 100
    
    if distress_pct >= 70 and impact_pct >= 65:
        return "TIER_1_GREENLIGHT"
    elif distress_pct >= 60 or impact_pct >= 60:
        return "TIER_2_WATCHLIST"
    else:
        return "TIER_3_DEFER"
```

### Score Output (JSON)

```json
{
  "deal_id": "DEAL-2025-001",
  "scores": {
    "distress": 32,
    "impact": 28,
    "readiness": 12,
    "mission_fit": 8,
    "total": 80
  },
  "tier": "TIER_1_GREENLIGHT",
  "eligibility_flags": {
    "nmtc_eligible": true,
    "severely_distressed": true,
    "opportunity_zone": true
  },
  "reason_codes": [
    "HIGH_POVERTY_TRACT",
    "ESSENTIAL_SERVICE_HEALTHCARE",
    "SITE_CONTROL_CONFIRMED"
  ]
}
```

### Match Display

```
SCORE: 80/100 — TIER 1 GREENLIGHT ⭐⭐⭐⭐

├─ Economic Distress: 32/40 (80%)
│   └─ Severely Distressed tract, Non-Metro, Capital Desert
├─ Impact Potential: 28/35 (80%)
│   └─ Healthcare facility, 35 jobs, strong LMI benefit
├─ Project Readiness: 12/15 (80%)
│   └─ Site control confirmed, pro forma complete
└─ Mission Fit: 8/10 (80%)
    └─ Matches your healthcare focus in AL

✅ Auto-routed to 3 matching CDEs
```

### Forbidden Variables (Section C Mandate)

The following are **absolutely excluded** from all scoring:
- Race, gender, DEI factors
- Identity status (national origin, religion, disability)
- Narrative/political scoring
- Any non-merit-based criteria

### Human-in-the-Loop

**Principle:** AI recommends. CDEs decide.

All overrides require:
- Documented reason code
- Audit trail with timestamp and user
- Written justification for `OTHER` reasons

---

## 12. User Journeys

### Sponsor Journey

```
1. DISCOVER
   - Land on tCredex.com
   - See value prop: "Find NMTC allocation in days, not months"
   - Check address eligibility (no login required)

2. REGISTER
   - Create account
   - Verify email
   - Complete sponsor profile

3. TEAM SETUP
   - Create organization
   - Invite team members
   - Assign roles

4. PROJECT INTAKE
   - Start new project
   - Dynamic form with progress indicator
   - Auto-save at every step
   - See tier progress: "You're at 45% — Tier 1"

5. MARKETPLACE LISTING
   - At 40%+, project goes live
   - Sponsor sees views, watches, interests
   - Gets notified of CDE/Investor activity

6. ENGAGEMENT
   - Respond to questions from CDEs/Investors
   - Schedule calls through platform
   - Continue improving tier

7. LOI/COMMITMENT
   - Receive LOI from CDE (NMTC)
   - Receive Commitment from Investor
   - Review terms, negotiate, accept

8. CLOSING
   - Closing Room opens
   - Upload remaining documents
   - Track checklist to 100%
   - Close deal

9. POST-CLOSE
   - Deal marked complete
   - Added to track record
   - Testimonial request
```

### CDE Journey

```
1. REGISTER
   - Create CDE account
   - Verify NMTC allocatee status
   - Set up organization profile

2. CONFIGURE PREFERENCES
   - Target geographies
   - Target sectors
   - Deal size range
   - Allocation availability

3. BROWSE MARKETPLACE
   - Filter deals by criteria
   - See AutoMatch recommendations
   - View deal cards and profiles

4. ENGAGE
   - "Watch" deals of interest
   - "Express Interest" to notify sponsor
   - Request additional information
   - Schedule calls

5. ISSUE LOI
   - Select deal for allocation
   - Generate or upload LOI
   - Submit to sponsor

6. MANAGE PIPELINE
   - Track LOIs issued
   - Monitor deal progress
   - Allocation deployment dashboard

7. CLOSING
   - Participate in Closing Room
   - Review/approve documents
   - Execute closing docs

8. POST-CLOSE
   - Update allocation remaining
   - Compliance tracking
   - Report to CDFI Fund
```

### Investor Journey

```
1. REGISTER
   - Create investor account
   - Indicate investor type (bank, fund, corporate)
   - Set up organization profile

2. CONFIGURE PREFERENCES
   - Target credit types
   - Target geographies
   - Pricing expectations
   - Deal size range
   - CRA considerations

3. BROWSE MARKETPLACE
   - Filter deals with LOI (NMTC) or direct credits
   - See AutoMatch recommendations
   - Compare opportunities

4. ENGAGE
   - "Watch" deals
   - "Express Interest"
   - Request materials
   - Schedule calls

5. ISSUE COMMITMENT
   - Select deal to fund
   - Generate or upload Commitment Letter
   - Submit terms

6. CLOSING
   - Participate in Closing Room
   - Conduct due diligence
   - Review/approve documents
   - Fund capital call

7. POST-CLOSE
   - Track investment
   - Credit claim schedule
   - Compliance monitoring
   - Portfolio dashboard
```

---

## 13. Notification Matrix

### Sponsor Notifications

| Event | Channel | Timing |
|-------|---------|--------|
| New CDE view on deal | In-app | Real-time |
| CDE expressed interest | Email + In-app | Real-time |
| LOI received | Email + SMS + In-app | Immediate |
| Commitment received | Email + SMS + In-app | Immediate |
| Document requested | Email + In-app | Real-time |
| Closing Room opened | Email + In-app | Immediate |
| Document approved/rejected | In-app | Real-time |
| Closing deadline reminder | Email | 7, 3, 1 days before |

### CDE Notifications

| Event | Channel | Timing |
|-------|---------|--------|
| New matching deal listed | Email digest | Daily |
| High-match deal (90%+) | Email + In-app | Real-time |
| Sponsor responded to interest | In-app | Real-time |
| LOI accepted | Email + In-app | Immediate |
| LOI rejected/expired | Email + In-app | Immediate |
| Commitment issued on your LOI'd deal | Email + In-app | Real-time |
| Closing Room activity | In-app | Real-time |

### Investor Notifications

| Event | Channel | Timing |
|-------|---------|--------|
| New matching deal available | Email digest | Daily |
| High-match deal (90%+) | Email + In-app | Real-time |
| Deal with LOI now seeking capital | Email + In-app | Real-time |
| Commitment accepted | Email + In-app | Immediate |
| Closing Room opened | Email + In-app | Immediate |
| Document ready for review | In-app | Real-time |
| Capital call scheduled | Email + In-app | 7 days before |

---

## 14. Permission Matrix

### Feature Access by User Type

| Feature | Sponsor | CDE | Investor | Admin |
|---------|---------|-----|----------|-------|
| Create Project | ✅ | ❌ | ❌ | ✅ |
| View Own Projects | ✅ | ❌ | ❌ | ✅ |
| View Marketplace | ✅ (own only) | ✅ | ✅ | ✅ |
| Express Interest | ❌ | ✅ | ✅ | ❌ |
| Issue LOI | ❌ | ✅ | ❌ | ❌ |
| Accept LOI | ✅ | ❌ | ❌ | ❌ |
| Issue Commitment | ❌ | ❌ | ✅ | ❌ |
| Accept Commitment | ✅ | ✅ | ❌ | ❌ |
| Access Closing Room | ✅ (own deals) | ✅ (LOI'd deals) | ✅ (committed deals) | ✅ |
| Upload Documents | ✅ | ✅ | ✅ | ✅ |
| View All Users | ❌ | ❌ | ❌ | ✅ |
| Manage Platform | ❌ | ❌ | ❌ | ✅ |

### Document Access in Closing Room

| Document Type | Sponsor | CDE | Investor | Counsel |
|---------------|---------|-----|----------|---------|
| Project Docs | ✅ Upload/View | ✅ View | ✅ View | ✅ View |
| Legal Docs | ✅ View | ✅ View | ✅ View | ✅ Upload/View |
| Financial Docs | ✅ Upload/View | ✅ View | ✅ View | ✅ View |
| CDE Docs | ✅ View | ✅ Upload/View | ✅ View | ✅ View |
| Investor Docs | ✅ View | ✅ View | ✅ Upload/View | ✅ View |
| Closing Docs | ✅ View/Sign | ✅ View/Sign | ✅ View/Sign | ✅ Upload/View |

---

## 15. State Machine Definitions

### Deal State Machine (NMTC)

```
                    ┌──────────────────────────────────────────┐
                    │                                          │
                    ▼                                          │
┌────────┐    ┌───────────┐    ┌──────────────────────────┐   │
│ DRAFT  │───▶│ DEAL_CARD │───▶│ LISTED_SEEKING_ALLOCATION│   │
└────────┘    └───────────┘    └──────────────────────────┘   │
   30%            30%                    40%+                  │
                                           │                   │
                    ┌──────────────────────┘                   │
                    ▼                                          │
              ┌─────────────┐                                  │
              │ LOI_PENDING │                                  │
              └─────────────┘                                  │
                    │                                          │
         ┌─────────┼─────────┐                                │
         ▼         ▼         ▼                                │
   ┌──────────┐ ┌─────────┐ ┌─────────┐                      │
   │ REJECTED │ │ EXPIRED │ │ ACCEPTED│                      │
   └──────────┘ └─────────┘ └─────────┘                      │
         │           │            │                           │
         └───────────┴────────────┼───────────────────────────┘
                                  ▼            (reactivate)
                    ┌─────────────────────────┐
                    │ LISTED_SEEKING_CAPITAL  │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌────────────────────────┐
                    │ COMMITMENT_PENDING     │
                    └────────────────────────┘
                                  │
                       ┌─────────┼─────────┐
                       ▼         ▼         ▼
                 ┌──────────┐ ┌─────────┐ ┌─────────┐
                 │ REJECTED │ │ EXPIRED │ │ ACCEPTED│
                 └──────────┘ └─────────┘ └─────────┘
                       │           │            │
                       └───────────┴────────────┘
                                  │
                                  ▼
                           ┌───────────┐
                           │  CLOSING  │
                           └───────────┘
                                  │
                                  ▼
                           ┌───────────┐
                           │  CLOSED   │
                           └───────────┘
```

### LOI State Machine

```
┌────────┐    ┌────────┐    ┌──────────┐
│ DRAFT  │───▶│ ISSUED │───▶│ ACCEPTED │
└────────┘    └────────┘    └──────────┘
                  │              │
                  ├──▶ REJECTED  │
                  │              │
                  └──▶ EXPIRED ──┘
                         │
                         ▼
                    SUPERSEDED
```

### Commitment State Machine

```
┌────────┐    ┌────────┐    ┌──────────┐    ┌────────┐
│ DRAFT  │───▶│ ISSUED │───▶│ ACCEPTED │───▶│ FUNDED │
└────────┘    └────────┘    └──────────┘    └────────┘
                  │
                  ├──▶ REJECTED
                  │
                  └──▶ EXPIRED
```

---

## 16. Project Types

### Supported Categories

| Category | Code | Examples |
|----------|------|----------|
| Healthcare | `HEALTHCARE` | Community health centers, clinics, hospitals, mental health |
| Education | `EDUCATION` | Schools, training centers, early childhood, workforce dev |
| Manufacturing | `MANUFACTURING` | Industrial, production facilities, food processing |
| Mixed-Use | `MIXED_USE` | Retail + residential, commercial + community space |
| Community Facility | `COMMUNITY` | YMCAs, Boys & Girls Clubs, rec centers, libraries |
| Housing | `HOUSING` | Affordable, workforce, senior, supportive |
| Retail | `RETAIL` | Grocery, pharmacy, essential services, food access |
| Hospitality | `HOSPITALITY` | Hotels, conference centers, tourism facilities |
| Office | `OFFICE` | Commercial office, co-working, business incubators |
| Other | `OTHER` | Specify in description |

---

## Appendix A: API Endpoints Required

### Intake & Projects
- `POST /api/projects` — Create project
- `PUT /api/projects/:id` — Update project
- `GET /api/projects/:id` — Get project details
- `GET /api/projects/:id/progress` — Get completion percentage
- `POST /api/projects/:id/publish` — List in marketplace

### Marketplace
- `GET /api/marketplace/deals` — List deals with filters
- `GET /api/marketplace/deals/:id` — Get deal details
- `POST /api/marketplace/deals/:id/watch` — Watch a deal
- `POST /api/marketplace/deals/:id/interest` — Express interest

### LOI & Commitments
- `POST /api/loi` — Create LOI
- `PUT /api/loi/:id` — Update LOI
- `POST /api/loi/:id/issue` — Issue to sponsor
- `POST /api/loi/:id/accept` — Accept LOI
- `POST /api/loi/:id/reject` — Reject LOI
- `POST /api/commitments` — Create commitment
- `PUT /api/commitments/:id` — Update commitment
- `POST /api/commitments/:id/issue` — Issue commitment
- `POST /api/commitments/:id/accept` — Accept commitment

### Closing Room
- `GET /api/closing-room/:dealId` — Get closing room
- `GET /api/closing-room/:dealId/documents` — List documents
- `POST /api/closing-room/:dealId/documents` — Upload document
- `PUT /api/closing-room/:dealId/documents/:docId` — Update document status

### Notifications
- `GET /api/notifications` — Get user notifications
- `PUT /api/notifications/:id/read` — Mark as read
- `PUT /api/notifications/preferences` — Update preferences

---

## Appendix B: Database Tables Required

```sql
-- Core Tables
projects
teams
team_members
users
organizations

-- Marketplace Tables
deal_listings
deal_views
deal_interests
deal_watches

-- LOI & Commitment Tables
letters_of_intent
commitments
commitment_terms

-- Closing Room Tables
closing_rooms
closing_room_members
closing_documents
document_versions
document_comments

-- Notification Tables
notifications
notification_preferences

-- Matching Tables
match_scores
buyer_criteria
```

---

## Document Status

| Section | Status |
|---------|--------|
| User Types | ✅ Complete |
| Credit Types | ✅ Complete |
| Tier System | ✅ Complete |
| Intake Progression | ✅ Complete |
| Document Generation | ✅ Complete |
| Marketplace | ✅ Complete |
| NMTC Workflow | ✅ Complete |
| Direct Workflow | ✅ Complete |
| LOI/Commitment | ✅ Complete |
| Closing Room | ✅ Complete |
| AutoMatch AI | ✅ Complete |
| User Journeys | ✅ Complete |
| Notifications | ✅ Complete |
| Permissions | ✅ Complete |
| State Machines | ✅ Complete |

---

**END OF DOCUMENT**

*This document serves as the master specification for tCredex platform workflow. All development should reference this document to ensure consistency.*
