# Implementation Tasks

## Compact Header (Detail Page)
- [x] **Refactor SampleStepper** @[SampleStepper]
  - Remove hardcoded `py-6` or make it overrideable via `className`.
  - Ensure it looks good in a constrained height container.

- [x] **Update PageHeader Component** @[PageHeader]
  - Add `size?: 'default' | 'compact'` to `PageHeaderProps`.
  - Implement basic conditional styling for padding/height (no complex responsive changes needed yet).

- [x] **Apply to Sample Detail Page** @[SampleDetailPage]
  - Update `src/app/(dashboard)/lab/samples/[id]/page.tsx` to use `size="compact"`.
  - Adjust stepper container classes.

## Lab Dashboard
- [x] **Remove Duplicate Header** @[LabPage]
  - In `src/app/(dashboard)/lab/page.tsx`, remove the `<PageHeader ... />` render.
  - Ensure `DashboardClient` receives correct props to display the header fully.

- [x] **Implement Real KPI Stats** @[Queries]
  - In `src/lib/queries/lab.ts`, update `getLabStats`:
    - Calculate `compliance_rate` = (Approved / (Approved + Rejected)) * 100.
    - Calculate `tat` = Average(validated_at - collected_at) for completed samples in the last 30 days.
    - Format TAT as hours (e.g. "3.5h") or days if > 24h.

## Ultra-Compact Detail Header (Refinement)
- [x] **Mini SampleStepper Variant** @[SampleStepper]
  - Create a `variant="mini"` that hides labels/descriptions and uses smaller icons.
  - Ensure icons are aligned horizontally in a tight row.

- [x] **Inline PageHeader Support** @[PageHeader]
  - Add `childrenPosition="inline"` prop.
  - If `inline`, render `children` between the title and actions.
  - Hide overline/breadcrumb and description when `size="compact"` and in single-line mode.

- [x] **Update Sample Detail Page** @[SampleDetailPage]
  - Switch to `size="compact"`, `childrenPosition="inline"`.
  - Use `SampleStepper` with `variant="mini"`.

## UI Standards Compliance (shadcn/ui + Radix)
- [x] **Sample Detail Page Refactoring** @[SampleDetailPage]
  - [x] Standardize page container padding (`p-6`).
  - [x] Refactor "Sample Info Cards" to `Operational Card` standards (`p-4`, `rounded-lg`).
  - [x] Replace custom "glass" styles with standard shadcn `Card` and `bg-card`.
  - [x] Standardize gaps to `gap-4` (between cards) and `gap-6` (between sections).
  - [x] Refactor `Technical Resume` to strictly use shadcn `Card` and standard paddings.
- [x] **Component-Level Refactoring** @[_components]
  - [x] Refactor `IndustrialAnalysisForm` to use standard containers and spacing.
  - [x] Refactor `IndustrialExecutionWizard` to use standard shadcn `Dialog` and layout patterns.
  - [x] Audit `industrial-ui.tsx` for compliance with tipography and spacing rules.
  - [x] Refactor `IndustrialConfirmDialog` for semantic alignment and standard tokens.

## High-Density UI & UX Refinement
- [x] **Technical Resume Refactoring** @[SampleDetailPage]
  - [x] Convert grid of result cards into a compact, standardized `Table`.
  - [x] Implement fixed heights for top KPIs (`h-[120px]`) as per `ui-standards.md`.
  - [x] Refine microcopy (titles, labels) to be more professional/concise.
- [x] **Analytical Table Refactor (Form)** @[AnalysisForm]
  - [x] Standardize the "Quadro Analítico" table (spacing, borders, typography).
  - [x] Clean up buttons (size, labels) to match branding.
  - [x] Optimize for 10+ parameters (max-height with scroll or pagination).
- [x] **Execution Wizard & Form Polish** @[_components]
  - [x] Clean up `IndustrialAnalysisForm` UX (spacing, input density).
  - [x] Refine `IndustrialExecutionWizard` final summary and buttons.

## SPC Dashboard (Follow-up)
- [x] **Add Batch (Lote) Filter** @[SPC]
  - [x] Add `selectedBatch` state in `SPCDashboardShell`.
  - [x] Implement dynamic batch fetching in `actions.ts`.
  - [x] Update `SPCFilters` component.
  - [x] Wire up filter to backend queries.
