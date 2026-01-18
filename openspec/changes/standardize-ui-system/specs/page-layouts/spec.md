# Spec: Standard Page Layouts

## 1. Goal
Implementar uma estrutura de página consistente baseada em wrappers globais.

## ADDED Requirements

### 2.1. Requirement: PageShell Wrapper
All pages MUST be wrapped in a `<PageShell>` component that handles:
- Background color (`bg-muted/40`).
- Standard responsive padding (`p-4` mobile, `p-6` desktop).
- `min-h-screen`.

### Requirement: PageHeader Usage
All pages MUST use `<PageHeader>` containing:
- **Title**: H1 text-2xl font-semibold.
- **Description**: Optional muted text.
- **Actions**: Slot for primary/secondary buttons.

#### Scenario: Standard Header Rendering
GIVEN a page with title "Quality Dashboard"
WHEN it renders
THEN it should show "Quality Dashboard" in H1
AND standard breadcrumbs above it.

### Requirement: KPI Card Component
New component `<KPICard>` MUST be used for metric summaries.
- Height: Fixed `120px`.
- Alignment: Flex column with icon on top-left.

#### Scenario: KPI Display
GIVEN a metric "Total Batches" with value "150"
WHEN rendered in a `<KPICard>`
THEN the card height MUST be 120px
AND the icon MUST be in the top-left corner.

### Requirement: Tabbed Views
Routes with multiple sub-context (e.g. QMS) MUST use Shadcn Tabs aligned with the PageHeader.
-Tabs should NOT trigger full page reloads.

#### Scenario: Consistent Spacing
GIVEN a dashboard page
THEN the gap between the Header and the Content MUST be `gap-6` (24px).
