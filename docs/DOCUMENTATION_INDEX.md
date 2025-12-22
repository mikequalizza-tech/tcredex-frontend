# tCredex Documentation Index

**Location:** `C:\tcredex.com\tcredex-frontend\docs\`
**Last Updated:** December 22, 2025

---

## Core Platform Documentation

| Document | Path | Description | Status |
|----------|------|-------------|--------|
| **Workflow Architecture v1** | `WORKFLOW_ARCHITECTURE_v1.md` | Master specification for platform workflow, user journeys, state machines, permissions | ✅ Complete |

---

## ChatGPT-Generated Reference Documents

**Location:** `docs/chatgpt-generated/`

| Document | Path | Pages | Description |
|----------|------|-------|-------------|
| **Central Transaction Hub White Paper** | `CENTRAL_TRANSACTION_HUB_WHITEPAPER.md` | 17 | Full platform vision with 117 citations |
| **Tax Credit Comparison Guide** | `TAX_CREDIT_COMPARISON_GUIDE.md` | 3 | LIHTC/NMTC/HTC/OZ/Brownfield comparison + capital stacks |
| **Section C: Scoring Engine Framework** | `SECTION_C_SCORING_ENGINE_FRAMEWORK.md` | 4 | **CANONICAL** 4-pillar scoring model (Approved) |
| **One Pager** | `TCREDEX_ONE_PAGER.md` | 1 | Executive pitch document |
| **Credit Committee Package** | `CREDIT_COMMITTEE_PACKAGE.md` | 2 | Institutional investor overview |

---

## Document Hierarchy

```
docs/
├── DOCUMENTATION_INDEX.md              ← You are here
├── WORKFLOW_ARCHITECTURE_v1.md         ← Master workflow spec
│
└── chatgpt-generated/
    ├── CENTRAL_TRANSACTION_HUB_WHITEPAPER.md
    ├── TAX_CREDIT_COMPARISON_GUIDE.md
    ├── SECTION_C_SCORING_ENGINE_FRAMEWORK.md  ← Scoring authority
    ├── TCREDEX_ONE_PAGER.md
    └── CREDIT_COMMITTEE_PACKAGE.md
```

---

## Key Specifications

### Scoring Engine (Section C)

| Pillar | Points | Weight |
|--------|--------|--------|
| Economic Distress | 0-40 | 40% |
| Impact Potential | 0-35 | 35% |
| Project Readiness | 0-15 | 15% |
| Mission Fit | 0-10 | 10% |
| **TOTAL** | **100** | 100% |

**Tier Classification:**
- **Tier 1 (Greenlight):** Distress ≥70% AND Impact ≥65%
- **Tier 2 (Watchlist):** Distress ≥60% OR Impact ≥60%
- **Tier 3 (Defer):** Below thresholds

### Deal Tier Progression

| Completion % | Tier | Marketplace Status |
|--------------|------|-------------------|
| 0-29% | Draft | Not Listed |
| 30-39% | Deal Card | Listed with Warning |
| 40-59% | Tier 1 | Listed |
| 60-79% | Tier 2 | Listed + Enhanced |
| 80-99% | Tier 3 | Featured |
| 100% | Complete | Closing Room |

### Credit Types & Routing

| Credit Type | Requires CDE? | Route |
|-------------|---------------|-------|
| Federal NMTC | ✅ YES | CDE → Investor |
| State NMTC | ✅ YES | CDE → Investor |
| HTC | ❌ NO | Direct to Investor |
| LIHTC | ❌ NO | Direct to Investor |
| Opportunity Zone | ❌ NO | Direct to Investor |

### Project Types

| Code | Category |
|------|----------|
| `HEALTHCARE` | Community health centers, clinics |
| `EDUCATION` | Schools, training centers |
| `MANUFACTURING` | Industrial, production |
| `MIXED_USE` | Retail + residential |
| `COMMUNITY` | YMCAs, rec centers |
| `HOUSING` | Affordable, workforce |
| `RETAIL` | Grocery, essential services |
| `HOSPITALITY` | Hotels, conference centers |
| `OFFICE` | Commercial, co-working |
| `OTHER` | Specify in description |

---

## Original PDF Locations

The ChatGPT-generated documents were converted from these uploaded PDFs:

| Markdown | Original PDF |
|----------|--------------|
| `CENTRAL_TRANSACTION_HUB_WHITEPAPER.md` | `/mnt/user-data/uploads/tCredex_Marketplace__Central_Transaction_Hub_for_NMTC__HTC__LIHTC__and_State_Tax_Credits.pdf` |
| `TAX_CREDIT_COMPARISON_GUIDE.md` | `/mnt/user-data/uploads/Tax_Credit_Compariosn_Guide_131225.pdf` |
| `SECTION_C_SCORING_ENGINE_FRAMEWORK.md` | `/mnt/user-data/uploads/SECTION_C_Scoring_Engine_Framework.pdf` |
| `TCREDEX_ONE_PAGER.md` | `/mnt/user-data/uploads/tCredex_One_Pager.pdf` |
| `CREDIT_COMMITTEE_PACKAGE.md` | `/mnt/user-data/uploads/tCredex_Credit_Committee_Package.pdf` |

---

## Usage Notes

### For Development
- Reference `WORKFLOW_ARCHITECTURE_v1.md` for all user journey and state machine logic
- Reference `SECTION_C_SCORING_ENGINE_FRAMEWORK.md` for scoring algorithm implementation
- Use `TAX_CREDIT_COMPARISON_GUIDE.md` for program stacking rules

### For Design
- Use `TCREDEX_ONE_PAGER.md` for messaging/copy
- Reference tier display examples in `WORKFLOW_ARCHITECTURE_v1.md` for UI components

### For Stakeholders
- Share `CREDIT_COMMITTEE_PACKAGE.md` with institutional investors
- Use `CENTRAL_TRANSACTION_HUB_WHITEPAPER.md` for comprehensive platform overview

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-22 | 1.0 | Initial documentation set created |

---

*This index should be updated whenever new documentation is added.*
