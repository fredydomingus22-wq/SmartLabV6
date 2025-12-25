# UX Foundation — SmartLab Enterprise

> **Status**: Draft 1.0
> **Role**: Source of Truth for Design Decisions

## 1. Product Vision
**SmartLab Enterprise** is a mission-critical LIMS & QMS for industrial quality control. It solves the problem of fragmented data and slow reaction times in production by verifying quality at every stage (Raw Material -> Process -> Finished Good). Success is defined by **zero data-integrity violations**, **<5 min reaction time** to quality deviations, and **100% audit readiness**.

## 2. Personas & Context

### 👤 The Lab Technician ("Fast & Precise")
*   **Context**: Works in a clean lab, wears gloves, handles chemicals.
*   **Goal**: Register samples and enter results accurately without slowing down.
*   **Pain Points**: Repetitive data entry, slow systems, unclear spec limits.
*   **Needs**: "Quick Add" buttons, keyboard navigation (Tab-based), instant validation feedback.
*   **Level**: Read/Write (Lab Module).

### 👤 The QA Supervisor ("The Gatekeeper")
*   **Context**: Office desk, dual monitors, high cognitive load.
*   **Goal**: Review out-of-spec results, approve batches, generate COAs.
*   **Pain Points**: Hunting for data across screens, missing context on deviations.
*   **Needs**: Dashboards with "Red Light" status, traceable history, one-click approvals.
*   **Level**: Approval/Admin (All Modules).

### 👤 The Production Operator ("On the Floor")
*   **Context**: Noisy factory floor, shared tablet/touchscreen, greasy hands.
*   **Goal**: Check tank status, record CIP, see if they can run production.
*   **Pain Points**: Small buttons, complex text, login timeouts.
*   **Needs**: High contrast, large touch targets, "Go/No-Go" visuals.
*   **Level**: Read-Only / limited Input (Production Mode).

## 3. UX Principles

1.  **Clarity > Aesthetics**: Information density is high, but readability is paramount. Use whitespace to group, not to decorate.
2.  **Prevent Errors > Fix Errors**: Blocking validation (e.g., "Cannot release batch with pending tests") is better than a warning.
3.  **Traceability Always**: Every create/edit/delete action must leave a "Breadcrumb" (Audit Trail). No "Ghost" changes.
4.  **Reversible Actions**: Unless legally restricted (e.g., signed records), allow "Undo" or "Draft" states to reduce anxiety.
5.  **Perceived Performance**: Operators wait for no one. Optimistic UI updates for non-critical actions; clear skeletons for data loads.
6.  **Consistency**: A "Save" button works the same in Lab and QMS. A "Status Badge" means the same thing everywhere.

## 4. Mental Model & Language

### Key Concepts
*   **Sample**: A physical portion of material taken for testing. (Not "Test", Not "Specimen").
*   **Batch (Lote)**: A production run of a specific Product. The parent entity.
*   **Specification (Spec)**: The set of rules (Min/Max/Target) a sample must meet.
*   **OOS (Out of Spec)**: A result that fails the Spec rules. Critical state.
*   **Deviation (NC)**: A formal record of a process failure (Non-Conformance).

### Naming Standards
*   **Units**: Always explicit next to values (e.g., `pH` (no unit), `Brix` (°Bx), `Weight` (kg)).
*   **Dates**: `DD/MM/YYYY HH:mm` (24h format mandatory for industrial precision).
*   **Buttons**: Verb + Noun (`Create Sample`, `Approve Batch`). Avoid generic `OK`.
*   **Abbreviations**: Only standard industrial ones (`CIP`, `COA`, `SKU`). Avoid internal slang.

### UX Decision Log
*   **Wizard Pattern**: Used ONLY for complex multi-step creations (e.g., New Product Launch). Routine tasks (Sample Log) use single-page forms or Modals.
*   **OOS Handling**: OOS results trigger a mandatory "Review" workflow. They cannot be auto-approved.
*   **Permissions**: Visibility is open (Read), Action is restricted (Write). Everyone can see quality, only QA changes it.
