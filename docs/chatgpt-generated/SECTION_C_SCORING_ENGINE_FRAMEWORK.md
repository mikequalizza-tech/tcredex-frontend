# SECTION C — Scoring Engine Framework (Approved)

**Source:** ChatGPT Generated (4 pages)
**Original PDF:** `/mnt/user-data/uploads/SECTION_C_Scoring_Engine_Framework.pdf`
**Status:** APPROVED - This is the canonical scoring specification

---

## C1 — Purpose of the Scoring Engine

The scoring engine ranks QALICBs using objective, reproducible metrics grounded in **need**, **impact**, and **feasibility**. 

**Excluded Variables:**
- Race
- DEI
- Gender
- Identity factors

This aligns with CDFI Fund program requirements and merit-based evaluation standards.

---

## C2 — Structure of the Model (4 Pillars)

| Pillar | Points | Weight |
|--------|--------|--------|
| **Economic Distress** | 0-40 | 40% |
| **Impact Potential** | 0-35 | 35% |
| **Project Readiness** | 0-15 | 15% |
| **Mission Fit** | 0-10 | 10% |
| **TOTAL** | **100** | 100% |

---

## C3 — Economic Distress (0-40 points)

### Data Sources
- American Community Survey (ACS)
- Bureau of Labor Statistics (BLS)
- CDFI Fund datasets

### Variables

| Variable | Points |
|----------|--------|
| Poverty rate percentile | 10 |
| MFI vs metro/state | 10 |
| Unemployment percentile | 10 |
| Persistent Poverty County (PPC) flag | 3 |
| Non-Metro flag | 3 |
| Capital Desert Index | 4 |
| **Subtotal** | **40** |

### Formula

```
Distress = 0.25 * (poverty_z + mfi_z + unemp_z) + PPC_flag + nonmetro_flag + capital_desert_score
```

Where:
- `poverty_z` = Poverty rate z-score (standard deviations from national mean)
- `mfi_z` = Median Family Income z-score (inverted - lower is more distressed)
- `unemp_z` = Unemployment rate z-score
- `PPC_flag` = 3 if Persistent Poverty County, else 0
- `nonmetro_flag` = 3 if Non-Metro (rural), else 0
- `capital_desert_score` = 0-4 based on historical investment levels

---

## C4 — Impact Potential (0-35 points)

### Variables

| Variable | Points | Description |
|----------|--------|-------------|
| Job Creation | 8 | Permanent jobs created or retained |
| Essential Services | 8 | Healthcare, education, food access, childcare |
| LMI Benefit | 7 | Direct benefit to low-to-moderate income residents |
| Catalytic Effect | 6 | Potential to spur additional investment |
| Community Readiness | 3 | Local support, partnerships |
| Leverage | 3 | Ratio of other funding to NMTC request |
| **Subtotal** | **35** |

### Scoring Guidelines

**Job Creation (0-8):**
- 0-10 jobs: 2 points
- 11-25 jobs: 4 points
- 26-50 jobs: 6 points
- 51+ jobs: 8 points

**Essential Services (0-8):**
- Healthcare facility: 8 points
- Education facility: 7 points
- Childcare center: 6 points
- Food access (grocery): 6 points
- Community facility: 5 points
- Manufacturing: 4 points
- Other commercial: 2 points

**LMI Benefit (0-7):**
- Direct services to LMI residents: 7 points
- Employment for LMI residents: 5 points
- Indirect benefit (economic activity): 3 points

---

## C5 — Project Readiness (0-15 points)

### Variables

| Variable | Points | Description |
|----------|--------|-------------|
| Site Control | 4 | Ownership, lease, or option in place |
| Completed Pro Forma | 3 | Financial projections complete |
| Third-Party Reports | 3 | Appraisal, Phase I, market study |
| Committed Sources ≥ 70% | 3 | Other financing committed |
| Feasible Timeline | 2 | Realistic construction/completion schedule |
| **Subtotal** | **15** |

### Scoring Logic

**Site Control (0-4):**
- Owned: 4 points
- Under contract: 3 points
- Option/LOI: 2 points
- Identified only: 0 points

**Third-Party Reports (0-3):**
- All three (appraisal + Phase I + market study): 3 points
- Two of three: 2 points
- One of three: 1 point
- None: 0 points

**Committed Sources (0-3):**
- ≥90% committed: 3 points
- 70-89% committed: 2 points
- 50-69% committed: 1 point
- <50% committed: 0 points

---

## C6 — Mission Fit (0-10 points)

### Variables

| Variable | Points | Description |
|----------|--------|-------------|
| Sector Alignment | 4 | Matches CDE's priority sectors |
| Geographic Alignment | 4 | Within CDE's target geography |
| Deal Size Alignment | 2 | Within CDE's typical deal range |
| **Subtotal** | **10** |

### Rules

- **NO identity variables allowed**
- Sector, geography, deal size alignment ONLY
- Score is CDE-specific (different CDEs may score same project differently)

---

## C7 — Output Format (JSON)

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
  "eligibility_flags": {
    "nmtc_eligible": true,
    "severely_distressed": true,
    "qct": false,
    "opportunity_zone": true,
    "ppc": false,
    "non_metro": true
  },
  "reason_codes": [
    "HIGH_POVERTY_TRACT",
    "ESSENTIAL_SERVICE_HEALTHCARE",
    "SITE_CONTROL_CONFIRMED",
    "STRONG_JOB_CREATION"
  ],
  "tier": "TIER_1_GREENLIGHT",
  "computed_at": "2025-12-22T16:45:00Z",
  "model_version": "1.0.0"
}
```

---

## C8 — Tier Classification

| Tier | Label | Criteria | Action |
|------|-------|----------|--------|
| **Tier 1** | Greenlight | Distress ≥70 AND Impact ≥65 | Auto-route to matching CDEs |
| **Tier 2** | Watchlist | Distress ≥60 OR Impact ≥60 | Manual review recommended |
| **Tier 3** | Defer | Below thresholds | Needs improvement before matching |

### Tier Logic (Pseudocode)

```python
def assign_tier(distress, impact):
    # Normalize to 100-point scale
    distress_normalized = (distress / 40) * 100
    impact_normalized = (impact / 35) * 100
    
    if distress_normalized >= 70 and impact_normalized >= 65:
        return "TIER_1_GREENLIGHT"
    elif distress_normalized >= 60 or impact_normalized >= 60:
        return "TIER_2_WATCHLIST"
    else:
        return "TIER_3_DEFER"
```

---

## C9 — Forbidden Variables

**Absolutely Excluded from All Scoring:**

| Category | Examples |
|----------|----------|
| Race | Any racial classification |
| Gender | Sex, gender identity |
| DEI | Diversity, equity, inclusion metrics |
| Identity Status | National origin, religion, disability status |
| Narrative Scoring | Subjective assessments |
| Political Scoring | Political affiliation or views |

**Rationale:** Merit-based evaluation only. Scoring must be objective, reproducible, and legally defensible.

---

## C10 — Explainability

### Required Transparency Features

| Feature | Purpose |
|---------|---------|
| **SHAP Values** | Show contribution of each variable to final score |
| **Rule Triggers** | List which eligibility rules were triggered |
| **NAICS Mapping** | Show how project sector was classified |
| **Variable Contributions** | Breakdown of points earned per variable |

### Example Explanation Output

```
SCORE BREAKDOWN: 80/100

Economic Distress: 32/40
  ├─ Poverty Rate: 8/10 (tract at 85th percentile)
  ├─ MFI: 7/10 (52% of state median)
  ├─ Unemployment: 6/10 (tract at 72nd percentile)
  ├─ PPC: 0/3 (not a Persistent Poverty County)
  ├─ Non-Metro: 3/3 (rural location)
  └─ Capital Desert: 4/4 (minimal prior NMTC investment)

Impact Potential: 28/35
  ├─ Job Creation: 6/8 (35 permanent jobs)
  ├─ Essential Services: 8/8 (healthcare facility)
  ├─ LMI Benefit: 5/7 (employment focus)
  ├─ Catalytic Effect: 4/6 (moderate spillover expected)
  ├─ Community Readiness: 2/3 (local support confirmed)
  └─ Leverage: 3/3 (4:1 leverage ratio)

Project Readiness: 12/15
  ├─ Site Control: 4/4 (owned)
  ├─ Pro Forma: 3/3 (complete)
  ├─ Third-Party Reports: 2/3 (appraisal + Phase I, no market study)
  ├─ Committed Sources: 2/3 (75% committed)
  └─ Timeline: 1/2 (aggressive but feasible)

Mission Fit: 8/10
  ├─ Sector: 4/4 (healthcare = CDE priority)
  ├─ Geography: 4/4 (within CDE service area)
  └─ Deal Size: 0/2 (smaller than typical CDE deal)

TIER: GREENLIGHT (Distress 80% + Impact 80%)
```

---

## C11 — Human-in-the-Loop

### Principle
**AI recommends. CDEs decide.**

### Override Requirements

| Requirement | Description |
|-------------|-------------|
| Documented Reason Code | Every override must include justification |
| Audit Trail | All overrides logged with timestamp, user, reason |
| Review Threshold | Overrides exceeding X% flagged for admin review |
| No Anonymous Overrides | User identity always recorded |

### Valid Override Reasons

- `LOCAL_KNOWLEDGE` - Reviewer has direct knowledge not in data
- `DATA_ERROR` - Underlying data appears incorrect
- `TIMING_ISSUE` - Project circumstances have changed
- `PROGRAM_SPECIFIC` - Unique program requirement not captured
- `OTHER` - Requires detailed written explanation

---

## C12 — Versioning & Audit Logging

### Each Score Run Logs:

| Field | Description |
|-------|-------------|
| `input_snapshot` | Complete input data at time of scoring |
| `formula_version` | Version of scoring formulas used |
| `ai_model_version` | Version of any ML models used |
| `reviewer_actions` | Any human review actions taken |
| `override_justifications` | Documented reasons for any overrides |
| `timestamp` | ISO 8601 timestamp |
| `user_id` | ID of user who triggered score (if applicable) |

### Version Control

- All formula changes require version bump
- Historical scores remain tied to formula version used
- Recomputation possible with any historical version
- Change log maintained for all formula updates

---

## Implementation Notes

### Database Schema Requirements

```sql
CREATE TABLE deal_scores (
    id UUID PRIMARY KEY,
    deal_id UUID REFERENCES deals(id),
    distress_score DECIMAL(5,2),
    impact_score DECIMAL(5,2),
    readiness_score DECIMAL(5,2),
    mission_fit_score DECIMAL(5,2),
    total_score DECIMAL(5,2),
    tier VARCHAR(20),
    eligibility_flags JSONB,
    reason_codes TEXT[],
    input_snapshot JSONB,
    formula_version VARCHAR(20),
    model_version VARCHAR(20),
    computed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    CONSTRAINT valid_tier CHECK (tier IN ('TIER_1_GREENLIGHT', 'TIER_2_WATCHLIST', 'TIER_3_DEFER'))
);

CREATE TABLE score_overrides (
    id UUID PRIMARY KEY,
    deal_score_id UUID REFERENCES deal_scores(id),
    original_tier VARCHAR(20),
    new_tier VARCHAR(20),
    reason_code VARCHAR(50),
    justification TEXT,
    overridden_by UUID,
    overridden_at TIMESTAMP WITH TIME ZONE
);
```

---

**END OF SECTION C**

*This is the approved, canonical scoring engine specification for tCredex.*
