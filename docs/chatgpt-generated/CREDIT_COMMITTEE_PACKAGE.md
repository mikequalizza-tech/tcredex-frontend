# tCredex Credit Committee Package

**Source:** ChatGPT Generated (2 pages)
**Original PDF:** `/mnt/user-data/uploads/tCredex_Credit_Committee_Package.pdf`
**Audience:** Institutional investors, credit committees, regulated financial institutions

---

# tCredex
## Institutional Tax Credit Transaction System
### Credit Committee Overview

---

## Executive Summary

tCredex is a transaction system purpose-built for NMTC, HTC, and LIHTC markets. It replaces document-driven underwriting with structured facts, enforced governance, and auditable AI pricing logic suitable for regulated financial institutions.

---

## The Problem

Tax credit transactions suffer from:
- **Information asymmetry** between parties
- **Structural inconsistency** across deals
- **Pricing decisions** that are difficult to reproduce
- **Document-heavy diligence** processes
- **Execution risk** borne by institutions without system-level controls

---

## System Design Principle

> **Documents are evidence—not data.**

tCredex limits pricing authority to a small set of authoritative documents and converts those into structured, versioned deal facts enforced in code.

---

## Pricing Authority

**Only four document classes inform pricing and analytics:**

| Document Class | Role in Pricing |
|----------------|-----------------|
| **Commitment Letters** | Defines capital terms, investor obligations |
| **Final Projections** | Source of financial forecasts, returns |
| **Deal Diagrams** | Transaction structure, fund flows |
| **Tax Opinions** | Legal basis for credit treatment |

**All other documents** are retained for audit and legal review only. They do not feed pricing models.

---

## Governance & Controls

| Control | Implementation |
|---------|----------------|
| **Source Document** | Every data field has a documented source |
| **Verification State** | Draft → Provisional → Verified → Locked |
| **Version History** | Complete audit trail of all changes |
| **Snapshot Boundary** | Immutable once created |
| **Model Constraints** | AI never reads draft data, infers missing values, or trains on live deal flow |

---

## Risk Management

### Deal State Lanes

| Lane | Purpose | Characteristics |
|------|---------|-----------------|
| **Lane 1: Intake** | Initial data collection | Dynamic, sponsor-facing, editable |
| **Lane 2: Underwriting** | Due diligence | Progressively verified, reviewer-controlled |
| **Lane 3: Dataset** | Model input | Frozen, immutable, model-visible |

**Key Principle:** Deal flow is never blocked, but only verified, immutable deal snapshots are visible to pricing models.

---

## Conclusion

tCredex delivers **explainable, defensible pricing by design**. The system prioritizes execution discipline over speculative AI and aligns with credit committee expectations for:

- ✅ **Transparency**
- ✅ **Control**
- ✅ **Auditability**
- ✅ **Reproducibility**

---

# Appendix A — Governance & Dataset Controls

## Deal State Lanes (Detailed)

| Lane | Description | Access |
|------|-------------|--------|
| **Lane 1: Intake** | Dynamic, sponsor-facing | Sponsors can edit freely |
| **Lane 2: Underwriting** | Progressively verified | Reviewers verify fields |
| **Lane 3: Dataset** | Frozen, immutable, model-visible | Read-only, audit-logged |

---

## Field Verification States

| State | Meaning | Model Visibility |
|-------|---------|------------------|
| **Draft** | Initial entry, unverified | ❌ Not visible |
| **Provisional** | Under review | ❌ Not visible |
| **Verified** | Confirmed by reviewer | ⚠️ Conditionally visible |
| **Locked** | Immutable, included in snapshot | ✅ Fully visible |

**Only Locked fields** are included in dataset snapshots and AI models.

---

## Snapshot Enforcement

| Rule | Enforcement |
|------|-------------|
| Immutability | Once created, snapshot fields cannot be changed |
| Traceability | All model references tied to snapshot IDs, not live deal objects |
| Versioning | Each snapshot has unique ID and timestamp |

---

## AI Usage Constraints

| Allowed | Prohibited |
|---------|------------|
| Classification | Inferring pricing |
| Validation | Rewriting legal conclusions |
| Anomaly detection | Operating without documented source authority |
| Pattern recognition | Training on live deal flow |

**AI is augmentative, not autonomous.** Human decision-makers retain final authority.

---

## Audit & Defensibility

| Feature | Implementation |
|---------|----------------|
| **Document Hash-Lock** | All documents hash-locked upon upload |
| **Retention** | All documents retained for audit |
| **Reproducibility** | Pricing outputs reproducible and traceable |
| **Source Linkage** | Every output tied to source documents and snapshot versions |

---

## Summary for Credit Committees

| Concern | tCredex Solution |
|---------|------------------|
| "How do we know the data is accurate?" | Verification states + source document linkage |
| "Can we reproduce this pricing decision?" | Snapshot IDs + formula versioning |
| "What if the AI makes an error?" | Human-in-the-loop + override audit trail |
| "Is this defensible in an audit?" | Hash-locked documents + complete audit log |
| "Can we trust the model?" | SHAP values + explainability layer |

---

**tCredex: Built for institutions that need to explain their decisions.**

---

*This document is intended for credit committee review and institutional due diligence.*
