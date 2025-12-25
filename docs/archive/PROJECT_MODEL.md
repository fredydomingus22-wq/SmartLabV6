# SmartLab v4 – Project Management Model

## 1. Methodology

We use a hybrid of **Scrum + Waterfall for architecture**:

- Phase 0: Vision & Requirements (fixed)
- Phase 1: Architecture & Data Model (fixed)
- Phase 2–5: Incremental Sprints (Scrum-like, 1–2 weeks per sprint)
- Each sprint must end with:
  - Working, buildable code
  - Database migrations applied
  - Updated documentation

## 2. Project Phases

### Phase 0 – Vision & Scope
- Inputs:
  - URS docs (global, frontend, backend, modules)
- Outputs:
  - Clear scope
  - List of modules:
    - Materials & Reagents
    - Raw Material QA
    - Physico-chemical
    - Microbiology
    - Production Lots & Line Control
    - Audit & Nonconformities
    - FSMS: ISO 22000 / FSSC 22000
    - QMS: ISO 9001:2015
    - HACCP
    - Reports & Dashboards
    - AI Assistant & Analytics
- No code is written here.

### Phase 1 – Architecture & Data Model
- Define:
  - System architecture (Next.js 15 + React 19 + Supabase)
  - Folder structure
  - Naming conventions
  - Global ERD (high-level tables and relationships)
- Outputs:
  - `docs/architecture.md`
  - `docs/data-model.md`
  - First migration files in `supabase/migrations`.

### Phase 2 – Core Platform
Epic: Authentication, authorization and base entities.

- Implement:
  - Auth (Supabase)
  - Roles & permissions (admin, QA supervisor, lab tech, auditor, etc.)
  - Plants, Labs, Users
  - Basic navigation layout
- Deliverables:
  - User can log in and see their dashboards.

### Phase 3 – Lab & QA Modules (Core Operations)
Split into sprints by module:

- Sprint 3.1 – Materials & Reagents
- Sprint 3.2 – Raw Material
- Sprint 3.3 – Physico-chemical
- Sprint 3.4 – Microbiology
- Sprint 3.5 – Production lots & in-line control

Each sprint must:
- Add or extend tables only via migrations.
- Add UI flows (create sample, record result, approve, etc.).
- Include validation and basic audit trail.

### Phase 4 – Compliance & FSMS/QMS
- ISO 9001:2015 module
- ISO 22000 / FSSC 22000 module
- HACCP risk matrix module
- Internal audit and CAPA workflows

### Phase 5 – Analytics & AI
- Trend charts, SPC, Pareto
- Automatic report generation (PDF/HTML)
- AI assistant:
  - Answer questions like “show nonconformities for line 3 in last 7 days”
  - Suggest root causes and actions (where possible)

### Phase 6 – Hardening & Release
- Performance passes
- Security checks
- Final migration consolidation
- Release v1.0

## 3. Sprint Template

Each sprint in `IMPLEMENTATION_PLAN.md` must follow this template:

- Sprint ID: `Sx.y` (e.g. S3.1)
- Goal (1–2 sentences)
- Scope (what is INCLUDED)
- Out of scope (must NOT touch)
- Deliverables
- Affected files/folders
- DB migrations needed
- Tests & acceptance criteria

## 4. Rules for Using Code Agents

- All DB changes = SQL migration files under `supabase/migrations`.
- Never duplicate tables or create parallel schemas.
- Always update docs when:
  - new module is created
  - new table is added
- Implementation order:
  1. Update plan
  2. Write migrations
  3. Implement backend logic
  4. Implement frontend
  5. Update docs
