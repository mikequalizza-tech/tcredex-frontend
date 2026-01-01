# tCredex Deal Workflow Architecture

## Overview

This document defines the deal lifecycle, document triggers, and fee structure for the tCredex platform.

---

## Deal Submission Agreement

**Current Implementation: Popup Agreement (Checkbox)**

At deal submission, sponsor agrees to platform terms via simple checkbox modal. This is NOT a binding legal document - it's a terms acknowledgment.

**Why this works:**
- Reduces friction for sponsors
- A signed NDA/Exclusivity doc is unenforceable anyway ("wipe your ass with it")
- Real protection comes from the Commitment Letter stage
- Platform fee is locked in at Commitment, not at submission

---

## Deal Flow by Program Type

### NMTC Deals (Require CDE Intermediary)

```
Sponsor submits Deal
        ↓
   [Deal Card] ← Marketplace visible at 40%+
        ↓
CDE expresses interest
        ↓
   [Allocation Reservation Letter] ← CDE reserves allocation for this deal
        ↓
CDE finds Investor (or Sponsor brings investor)
        ↓
   [Commitment Letter] ← LOCKS IN PLATFORM FEE
   [3rd Party Financial Model] ← Required by investor
        ↓
   [Closing Room Opens] ← Checklist generated from Commitment + Model
        ↓
   [Legal Templates] ← Available for FEE (Stripe)
        ↓
   [Close & Fund]
```

### LIHTC / HTC / OZ Deals (Direct to Investor)

```
Sponsor submits Deal
        ↓
   [Deal Card] ← Marketplace visible at 40%+
        ↓
Investor expresses interest
        ↓
   [Letter of Investment Interest] ← Investor signals intent
        ↓
   [Commitment Letter] ← LOCKS IN PLATFORM FEE
   [3rd Party Financial Model] ← Required by investor
        ↓
   [Closing Room Opens] ← Checklist generated from Commitment + Model
        ↓
   [Legal Templates] ← Available for FEE (Stripe)
        ↓
   [Close & Fund]
```

---

## Document Types & Issuers

| Document | Issuer | Recipient | Programs | Binding? |
|----------|--------|-----------|----------|----------|
| Submission Agreement | Platform | Sponsor | All | No (terms acknowledgment) |
| Allocation Reservation Letter | CDE | Sponsor | NMTC, State NMTC | Soft commitment |
| Letter of Investment Interest | Investor | Sponsor | LIHTC, HTC, OZ | Soft commitment |
| **Commitment Letter** | CDE or Investor | Sponsor | All | **YES - Locks platform fee** |
| 3rd Party Financial Model | Accounting Firm | All parties | All | Required for closing |

---

## Platform Fee Structure

### When Fee is Earned

**NOT at submission** - Popup agreement is just terms acceptance

**NOT at Allocation Reservation / Investment Interest** - These are soft commitments

**YES at Commitment Letter** - This is when the platform fee is locked in:
- Deal has binding terms
- Parties are committed
- Financial model validates the deal
- Closing Room opens

### Fee Triggers

1. Commitment Letter is executed (all parties sign)
2. Platform fee is calculated based on allocation/investment amount
3. Fee is due at closing (collected via Stripe)

---

## Closing Room Architecture

### Entry Requirements

Closing Room ONLY opens when:
1. Commitment Letter is fully executed
2. 3rd Party Financial Model is uploaded
3. All parties have accepted terms

### Checklist Generation

System generates closing checklist based on:
- Deal structure (leverage vs non-leverage NMTC)
- Programs involved (NMTC, HTC, LIHTC, OZ, stacked)
- Parties (specific CDE requirements, investor requirements)
- Financial model terms (loan amounts, rates, etc.)

### Legal Templates (Revenue Stream)

Available for purchase via Stripe:
- QLICI Loan Documents
- Operating Agreements
- Leverage Loan Documents
- Investor Subscription Agreements
- Assignment Documents
- etc.

**Pricing:** TBD per template or bundle pricing

---

## Deal Attractiveness vs. Readiness

Two axes determine how fast a deal moves:

### Readiness (Data Completeness)
- 25%: Deal Card basics
- 40%: Marketplace visible
- 60%: Project Profile complete
- 80%: Due diligence ready
- 100%: Closing ready

### Attractiveness (Mission Fit / Optics)

**High Attractiveness** (Boys & Girls Club of Harlem)
- Gets Allocation Reservation at Deal Card stage
- CDEs compete for deal
- Less data required to move forward

**Medium Attractiveness** (Generic Community Center)
- Needs Project Profile to generate interest
- Must tell the impact story
- Normal data requirements

**Low Attractiveness** (Manufacturing Facility)
- Must prove community benefit
- Extensive data requirements
- May need 80%+ before serious interest

### Implication

A deal can receive an Allocation Reservation well before "shovel ready" if mission fit is strong. The LOI/Commitment workflow must support early-stage reservations, not just completed deals.

---

## Matching Logic

### NMTC Deals
1. Match to CDEs first (based on allocation criteria, geography, sector focus)
2. CDE issues Allocation Reservation
3. CDE + Sponsor find Investor together (or Sponsor brings their own)

### LIHTC / HTC / OZ Deals
1. Match to Investors directly (based on investment criteria, CRA needs, geography)
2. Investor issues Letter of Investment Interest
3. No CDE intermediary required

### Stacked Deals (Multiple Programs)
1. Primary program determines initial matching
2. Secondary programs shown as additional opportunity
3. May require both CDE (for NMTC) and direct Investor (for HTC/LIHTC)

---

## Status Flow

```
draft → submitted → under_review → available → seeking_capital → matched → closing → closed
                                      ↓
                                 withdrawn (can happen at any stage)
```

---

## Next Steps for Implementation

1. [ ] Build Commitment Letter workflow
2. [ ] Financial Model upload + validation
3. [ ] Closing Room checklist generator
4. [ ] Stripe integration for legal templates
5. [ ] Matching algorithm updates (CDE vs Investor routing)
6. [ ] Section C scoring to include "attractiveness" factors

---

*Last Updated: 2024-12-31*
*Version: 1.0*
