# UX/UI & Layout Upgrade Plan — SmartLab Enterprise

Upgrade the application UX and layout to match the **Design System + UX URS** by implementing a global header, collapsible sidebar, polished dashboard, contextual FAB, and a robust SPC module.

## 1. Current State Audit

*   **Existing Layout**: Simple flexbox in `(dashboard)/layout.tsx`. Lacks a global header. Breadcrumbs are currently rendered inside the main content area.
*   **Sidebar**: `AppSidebar.tsx` has a fixed width (256px) and lacks collapsible groups or a global collapse state.
*   **Dashboard**: `dashboard/page.tsx` contains basic KPI cards and lists. Lacks advanced data visualization and drill-down sophistication.
*   **Charting**: `recharts` is present in `package.json`.
*   **Routing**: Next.js App Router.
*   **Data Access**: Server actions and direct Supabase client usage.

## 2. UX/Design System Alignment Checklist

- [ ] **Spacing**: Minimum `p-6` for external padding, `gap-4` or `gap-6` for grid elements.
- [ ] **Typography**: Extra Bold titles, uppercase technical labels.
- [ ] **Surfaces**: `slate-950` background, `slate-800` cards with glassmorphism (`glass` utility).
- [ ] **Accessibility**: WCAG AA contrast, keyboard navigation, `aria` attributes for interactive components.

## 3. Assumptions & Gaps

*   **Timezone**: default to `Africa/Luanda` for greetings.
*   **SPC Data**: Assumed results and specifications are available in `lab_analysis` and `product_specifications`.
*   **Permissions**: `user_profiles.role` used for RBAC.

## 4. Task Breakdown

### 4.1 Global Header
*   **What**: Create `src/components/layout/app-header.tsx`.
*   **Features**:
    *   Dynamic greeting (Africa/Luanda).
    *   Breadcrumbs migration (move from layout to header).
    *   User menu (Avatar + Role).
    *   Status chips (System Status: Operational).
    *   Search bar.
    *   Notification button.
    *   Logout button.
    *   Adherence to Design System for contrast and spacing.
*   **Logic**: Greeting based on: 05:00–11:59 (Bom dia), 12:00–17:59 (Boa tarde), 18:00–04:59 (Boa noite).

### 4.2 Collapsible Sidebar
*   **What**: Update `src/components/smart/app-sidebar.tsx`.
*   **Features**:
    *   Collapsible groups (Accordion-style).
    *   Global collapse (Toggle between 256px and 64px).
    *   Persistence in `localStorage`.
    *   Keyboard navigation (Arrows to navigate groups).
*   **Components**: Use `radix-ui/react-accordion` or custom logic for groups.

### 4.3 Dashboard Polish
*   **What**: Update `src/app/(dashboard)/dashboard/page.tsx`.
*   **Features**:
    *   Actionable KPIs (with link to filters).
    *   Recharts trend snapshots (e.g., sample throughput).
    *   Traceability-first layout (clear relationship between batch and results).
    *   "My tasks" section based on role.

### 4.4 Floating Action Button (FAB)
*   **What**: Create `src/components/smart/fab.tsx`.
*   **Features**:
    *   Trigger on bottom right.
    *   Expandable menu with: "Nova Amostra", "Registar Resultado", "Criar Relatório".
    *   RBAC filtering for actions.
    *   Safe area support for mobile.

### 4.5 SPC Module
*   **What**: Create `src/app/(dashboard)/quality/spc/page.tsx` (upgrade current if exists).
*   **Features**:
    *   Filters: Product, Parameter, Batch.
    *   Recharts LineChart with USL/LSL ReferenceLines.
    *   Summary Stats: Mean, Stdev, Cp, Cpk.
    *   Data Table for the series.

## 5. Data & Performance Plan

*   **Caching**: Next.js cache and `revalidatePath`.
*   **Loading**: Skeleton loaders for cards and charts.
*   **Virtualization**: Use `tanstack/react-virtual` if data tables exceed 100 rows. (Optional, pending data volume audit).
*   **Debounce**: 300ms for SPC filter updates.

## 6. Testing Plan

*   **Manual QA**:
    *   Verify sidebar collapses and persists across refreshes.
    *   Test FAB visibility for different roles.
    *   Check greeting time triggers (manual system clock override).
    *   SPC chart accuracy vs raw data in DB.
*   **Unit Tests**: `utils/format.ts` for Cp/Cpk calculations.

## 7. Rollout Strategy

1.  **Phase 1**: Layout Foundation (Header & Sidebar).
2.  **Phase 2**: Dashboard & FAB.
3.  **Phase 3**: SPC Module & Final Polish.
