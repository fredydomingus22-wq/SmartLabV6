# Spec: Lab Dashboard Improvements

## ADDED Requirements

### Requirement: Remove Duplicate Logic
The Lab Dashboard MUST NOT render the `PageHeader` component twice. Since `DashboardClient` contains the view transition logic (Grid/List/Table) and role-based toggles inside the header, it SHOULD be the sole owner of the `PageHeader` rendering for this page. The server component `lab/page.tsx` MUST NOT render a second `PageHeader`.

#### Scenario: Single Header
GIVEN the Lab Dashboard is loaded
WHEN the user views the page
THEN they should see exactly one "Controlo de Amostras" (or role-specific) header
AND the header should contain the View Mode toggles and Action buttons.

### Requirement: Real Data for KPIs
The `getLabStats` query MUST calculate "Turnaround Time (TAT)" and "Compliance Rate" based on actual database records from a relevant timeframe (suggested: last 30 days) rather than returning hardcoded constants.

#### Scenario: Compliance Rate Calculation
GIVEN a set of validated samples from the last 30 days
WHEN calculating "Compliance Rate" (or Quality Pass Rate)
THEN it should be the percentage of `approved` samples vs. total validated (`approved` + `rejected`) samples.
AND it should define `0%` if no samples are validated.

#### Scenario: TAT Calculation
GIVEN a set of completed samples (status `approved`, `rejected`, `released`) from the last 30 days
WHEN calculating "Average TAT"
THEN it should be the average time difference between `collected_at` and `validated_at`.
AND samples without `collected_at` or `validated_at` should be excluded from the average.
