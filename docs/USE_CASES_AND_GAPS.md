# User Stories & Gap Analysis - SmartLab v4

**Status**: Verified
**Sprints**: Phase 1 & 2

---

## 1. Verified Core Workflows (PepsiCo-Grade Traceability)

The system is designed to handle "Continuous Process" complexity, not just simple discrete manufacturing.

### WF-01: The "Golden Batch" Traceability Flow
*Objective: Prove full compliance from Raw Material to Fill.*

1.  **Batch Creation (The Parent)**:
    - QA/Production Manager creates **Production Batch** `#PB-2025-101` for Product `Coke Zero 500ml`.
    - Status: `Open`.
    - Context: Line 1, Shift A.

2.  **Intermediate Processing (The Tanks)**:
    - Process Operator prepares syrup in **Tank A** and **Tank B**.
    - Operator registers **Intermediate Product** for Tank A (linked to `#PB-2025-101`).
    - *Constraint*: System verifies **CIP** (Cleaning) of Tank A was done < 24h ago.

3.  **Sampling (The Critical Check)**:
    - Lab Tech collects samples.
    - **Sample 1**: From Tank A (Type: `intermediate_product`).
        - *System*: Fetches specs for `#PB-2025-101` (Syrup Phase).
    - **Sample 2**: From Filler Nozzle (Type: `finished_product`).
        - *System*: Fetches specs for `#PB-2025-101` (Finished Phase).
    - **Sample 3**: From Water Line (Type: `water`).

4.  **Analysis & Validation**:
    - Tech inputs Brix/Carbonation.
    - System auto-flags: "Tank A is OK", "Filler is OK".
    - Data is locked with `signed_transaction_hash`.

5.  **Batch Release**:
    - QA Manager views "Batch Genealogy":
        - `#PB-2025-101` children: [Tank A (Pass), Tank B (Pass), 5000 Bottles (Pass)].
    - Manager signs Release. Status → `Closed`.

---

## 2. Real-World User Stories (Personas)

### 👤 Persona: Carlos - Line Operator (Tablet User)
**Context**: Wearing gloves, noisy environment, poor Wi-Fi.

- **US-01 [Fast Collection]**: "As Carlos, I want to register a sample in 3 taps so I don't stop the line."
  - *Requirement*: Pre-selected context (I am at Line 1). Big buttons. "New Sample" auto-fills Batch info.
- **US-02 [Visual Feedback]**: "As Carlos, I need to know immediately if the result is OOS so I can stop the filler."
  - *Requirement*: Big Red/Green visual feedback.

### 👤 Persona: Sarah - Lab Analyst (Desktop User)
**Context**: High volume, 500+ samples/day.

- **US-03 [Bulk Entry]**: "As Sarah, I want to input data for 10 samples (Tank A, Tank B, Tank C...) at once."
  - *Requirement*: Data Grid View (Excel-style).
- **US-04 [Work Queue]**: "As Sarah, I need to know which Tank is waiting for approval to start pumping."
  - *Requirement*: Priority Queue sorted by "Production Stoppage Risk".

### 👤 Persona: Ana - QA Manager (Auditor View)
**Context**: FSSC 22000 Audit.

- **US-05 [Recall Drill]**: "As Ana, I need to find every Production Batch that used 'Sugar Lot #99' in 5 seconds."
  - *Requirement*: Backward Traceability query.
- **US-06 [Changes]**: "As Ana, I need to see *who* changed the Brix Spec yesterday."
  - *Requirement*: Immutable Audit Log + Version History.

---

## 3. Structural Gap Analysis (Holistic Audit Findings)

I have performed a Deep Audit of `docs/` vs `rules/` and identified the following **Structural Gaps** that must be addressed during Implementation (SOP-compliant):

### 🔴 GAP-01: Offline / Spotty Network Policy
**Finding**: `rules/sop.md` does not mandate an offline strategy, but Factory Floors (User Persona: Carlos) imply it.
**Risk**: Data loss during sync.
**Mitigation Plan**:
1. **Architecture**: Use `TanStack Query` (React Query) with `persist` adaptation.
2. **UI**: Add "Pending Sync" status icon.
3. **Optimistic UI**: Show successful save immediately, background sync.

### 🔴 GAP-02: Transaction Integrity for Complex Flows
**Finding**: "Golden Batch" creation touches 3 tables (`production_batches`, `intermediate_products`, `intermediate_ingredients`).
**Risk**: Partial saves (Phantom Batch without Ingredients).
**Mitigation Plan**:
1. **Rule**: ALL multi-table writes must use `supabase.rpc()` (Stored Procedures) to wrap logic in a SQL Transaction (`BEGIN...COMMIT`).
2. **Constraint**: Frontend never chains multiple `await supabase.insert()` calls for atomic operations.

### 🔴 GAP-03: State Management for "Wizard" Flows
**Finding**: `sop.md` mandates `Zustand`, but complex multi-step forms (e.g., Batch Setup → Tank Mapping → Ingredient Check) need a dedicated state machine pattern.
**Risk**: Operator loses context if they refresh page mid-setup.
**Mitigation Plan**:
1. **Architecture**: Implement `createJSONStorage` persistence in Zustand stores for draft forms.

### 🔴 GAP-04: Blocking Logic (CIP Check)
**Finding**: `sop.md` Rule 8 (CIP Check) requires checking external state before allowing action.
**Risk**: Performance bottleneck if checking 10 checks synchronously on every click.
**Mitigation Plan**:
1. **Caching**: Cache "Active CIP Status" for Equipment in React Query (staleTime: 5 mins).
2. **Validation**: Double-check on Server Side (RPC) before commit.

---

## 4. Conclusion
The database structure is solid (`data-model.md`). The Gaps are now purely **Architectural Implementation Details**.

**Action**: We proceed to Phase 1 (Setup), but with the strict mandate to implement **RPC Transactions** and **React Query Persistence** to close these gaps.
