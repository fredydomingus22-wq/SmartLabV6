# URS_BACKEND.md
## SmartLab V4 – Backend User Requirements Specification (Enterprise Edition)

---

## 1. Database Architecture

The system MUST:

- Use **PostgreSQL via Supabase** (using `organization_id` for isolation)
- Be **multi-tenant from day one**
- Enforce **Row Level Security (RLS)** on all business tables
- Never store business data without tenant and plant binding

All business tables MUST include:

- `organization_id` (organization identifier)
- `plant_id` (factory identifier)

---

## 2. Core Technical Stack

Mandatory stack:

| Layer      | Technology                  |
|------------|------------------------------|
| Database   | PostgreSQL (Supabase)         |
| API        | Next.js API Routes (REST)     |
| Auth       | Supabase Auth + JWT           |
| Security   | Supabase RLS                  |
| Validation | Zod                           |

---

## 3. Core Entities

The system MUST natively support the following entities:

- Organizations (Tenants)
- Plants (Factories)
- Plant Sections
- Production Lines
- Products
- Technicians
- Teams
- Shifts
- Production Batches
- Intermediate Products (Tanks, Syrops, Mixtures, Pasturized bases)
- Raw Materials
- Raw Material Lots
- Packaging Materials
- Packaging Lots
- Samples
- Analysis Results
- Quality Parameters
- Product Specifications
- Reagents
- Reagent Stock Movements

---

## 4. Multi-Tenant Rules

Mandatory rules:

- Every record MUST belong to exactly:
  - One `organization_id`
  - One `plant_id`
- Cross-tenant access is **strictly forbidden**
- All queries MUST respect tenant and plant isolation

---

## 5. Production Flow Model

### Production Batch

A Production Batch:

- Belongs to one Product
- Has a unique batch code
- Has statuses:
  - `pending`
  - `active`
  - `closed`

---

### Intermediate Products

Intermediate Products:

- Are physically linked to equipment (e.g., Tanks, Mixers)
- Belong to a Production Batch
- Store ingredient compositions pulled from Raw Material Lots
- Support multiple sampling points

---

## 6. Parameters & Specifications Model

### Parameters

Parameters MUST exist independently of products:

- Name
- Code
- Unit of measure
- Description

### Specifications

Specifications link:

`Parameter + Product + Limits`

Each Specification MUST contain:

- `min_value`
- `target_value`
- `max_value`
- `unit`
- `version`
- `effective_date`
- `status` (active / obsolete)

---

## 7. Versioning System

The following MUST be version-controlled:

- Parameters
- Specifications

Each version MUST contain:

- Version number
- Effective date
- Status (active / obsolete)

Only one version may be ACTIVE per product/parameter combination.

---

## 8. Sample Lifecycle

When a Sample is created:

- It must bind to:
  - Intermediate Product wich automatcaly will fetch their  Production Batch
  - Sampling Point
- The system MUST automatically:
  - Load Product
  - Load Parameters
  - Load Specifications
- Results must be tracked per parameter per sample

---

## 9. Microbiology Module

The system MUST support:

- Media Types
- Media Lots
- Incubators (with temperature setpoints)
- Micro Test Sessions
- Colony counting
- Growth flags (TNTC / Overgrown / Absent)

---

## 10. Reagents Module (Strict Scope)

ONLY the following operations are allowed:

✅ Register new reagents  
✅ Register stock entry (purchase)  
✅ Register stock dispatch (requested to lab)

Dispatch MUST record:

- Reagent
- Quantity
- Destination laboratory
- Requested by

No automatic consumption per analysis is allowed.

---

## 11. CIP – Cleaning In Place

The system MUST:

- Register CIP Programs
- Track CIP Execution
- Bind executions to Equipment
- Store temperature, time and chemical data

---

## 12. Security Model

Authentication:

- Supabase Auth
- JWT tokens with claims:
  - `organization_id`
  - `plant_id`
  - `role`

Authorization:

- Supabase Row Level Security on all business tables

---

## 13. Audit & Traceability

All critical tables MUST have:

- `created_at`
- `created_by`
- `updated_at`
- `audit_log_id`
- `signed_transaction_hash` (for critical records)

A centralized table MUST exist:

- `audit_trail`

---

## 14. Reporting Engine

The system MUST support generation of:

- COA (Certificate of Analysis)
- SPC Charts
- Trend Reports
- HACCP Logs
- Non-Conformance Reports
- Audit-ready summaries

Formats:

- PDF
- Excel
- JSON

---

## 15. AI & Analytics Readiness

The backend MUST be designed to:

- Expose clean data APIs for AI models
- Support SPC real-time evaluation
- Enable predictive quality analytics

---

## 16. Reference Documents

The agent MUST consider the following folders as authoritative:

- `/docs`
- `/agents`
- `/urs`

These documents are binding.

---

## 17. Code Quality Rules (MANDATORY)

The codebase MUST:

- Enforce TypeScript strict mode
- Use Zod for all validations
- Avoid `any` types
- Follow Service / Repository / Controller architecture
- Never mix business logic with UI

---

## 18. Final Objective

This backend MUST be capable of competing directly with:

- InfinityQS
- MasterControl
- Internal PepsiCo Systems
- Internal Coca-Cola Systems

The system must be audit-ready at any time.

---

✅ END OF DOCUMENT
