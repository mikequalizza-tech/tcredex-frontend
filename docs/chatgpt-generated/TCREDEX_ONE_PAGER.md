# tCredex One Pager

**Source:** ChatGPT Generated (1 page)
**Original PDF:** `/mnt/user-data/uploads/tCredex_One_Pager.pdf`

---

# tCredex
## Institutional Tax Credit Transaction System

---

## The Problem

Tax credit markets fail due to:
- **Information asymmetry**
- **Inconsistent structure**
- **Execution risk**

Deals are buried in tens of thousands of pages, pricing decisions cannot be reproduced, and human judgment is locked inside PDFs.

---

## Core Insight

> **Documents are evidence, not data.**

- Pricing authority exists in a limited set of documents
- Risk is structural, not textual
- tCredex extracts facts, enforces governance in code, and separates deal flow from analytics

---

## System Architecture

| Principle | Implementation |
|-----------|----------------|
| **One Canonical Deal Object** | Single source of truth |
| **Code-Driven Views** | Intake, Deal Cards, Project Profiles governed by state and permissions |
| **Three Lanes** | Intake → Underwriting → Dataset |
| **Never Blocked** | Deals flow freely; only model access is gated |

---

## Pricing Authority

**Only these 4 document classes inform pricing and analytics:**

| Document | Purpose |
|----------|---------|
| **Commitment Letters** | Capital commitment terms |
| **Final Projections** | Financial forecasts |
| **Deal Diagrams** | Transaction structure |
| **Tax Opinions** | Legal/tax treatment |

All other documents are retained for audit, not analytics.

---

## Governance by Design

| Requirement | Enforcement |
|-------------|-------------|
| Source Document | Every data field has one |
| Verification State | Draft → Provisional → Verified → Locked |
| Version History | Complete audit trail |
| Snapshot Boundary | Immutable once created |
| Model Constraints | Never read drafts, infer values, or train on live deal flow |
| Dataset Entries | Immutable |

---

## Why This Is Different

| Most Platforms | tCredex |
|----------------|---------|
| Marketplaces with AI layered on top | Transaction system where structured facts replace PDFs |
| Opaque pricing decisions | Reproducible pricing decisions |
| Quality degrades with volume | Data quality improves as volume grows |

---

## Bottom Line

> **tCredex did not build AI to read documents.**
> 
> **It built a system that makes documents irrelevant to pricing.**

**Execution—not architecture—is now the focus.**

---

*One page. One vision. One system.*
