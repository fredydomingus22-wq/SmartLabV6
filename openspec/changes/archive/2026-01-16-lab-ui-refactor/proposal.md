# Lab UI Refactor: Compact Header & Dashboard Improvements

## Why
Analysts need accurate, real-time data on their dashboard (not placeholders) and maximized screen space on detail pages to focus on critical analysis parameters. Duplicate headers confuse the user and degrade the perceived quality of the application, while real calculations for TAT and Compliance ensure the dashboard reflects the actual lab performance.

## What Changes
1.  **Compact Sample Header**: Optimizes the Sample Detail Page header for vertical space and clearer stepper integration.
2.  **Dashboard Deduplication**: Resolves a visual bug where the Page Header appears twice on the Lab Dashboard.
3.  **Real Data Statistics**: Updates the Lab Dashboard KPI cards to fetch and calculate real metrics (TAT, Compliance Rate) instead of using mock values.

## Impact
- **Components**: `PageHeader`, `SampleStepper`, `KPICards`.
- **Pages**: `src/app/(dashboard)/lab/page.tsx`, `src/app/(dashboard)/lab/samples/[id]/page.tsx`.
- **Queries**: `src/lib/queries/lab.ts` (Logic update for stats).
- **Risk**: Low. Targeted UI logic and read-only query enhancements.
