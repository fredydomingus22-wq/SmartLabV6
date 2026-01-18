# Spec: Standardized Sidebar Navigation

## 1. Goal
Implementar uma navegação lateral hierárquica e centrada em módulos, eliminando a lista plana e desconexa.

## ADDED Requirements

### 2.1. Requirement: Sidebar Module Groups
The sidebar MUST group links into distinct visual sections:
- **Core Operations**: Dashboard, Tasks.
- **LIMS Module**: Samples, Approvals, Lab Assets.
- **Production (MES)**: Batches, Tanks, Lines, CIP.
- **Quality (QMS)**: NCs, Audits, Objectives, SPC.
- **Food Safety (FSMS)**: HACCP, PRP, PCC.
- **Logistics**: Inventory, Suppliers.
- **Settings**: Profile, Plant Config.

#### Scenario: Visual Separation
GIVEN the user is viewing the sidebar
THEN they should see "LIMS" and "Production" separated by a label or divider
AND related sub-items should be indented.

### Requirement: Collapsible Groups
Each module group (e.g., LIMS) MUST be collapsible to reduce cognitive load.

#### Scenario: Collapsing LIMS Group
GIVEN the LIMS group is expanded
WHEN the user clicks the group header
THEN the sub-items should hide
AND the group icon should indicate a collapsed state.

### Requirement: Mobile Responsive Sidebar
The grouped navigation MUST work identically on Mobile Drawers.

#### Scenario: Mobile Drawer Navigation
GIVEN the user is on a mobile device
WHEN they open the sidebar drawer
THEN they should see the same grouped structure as desktop
AND tapping a group should expand/collapse it.

### Requirement: Route Preservation
The refactored sidebar MUST include EVERY link currently present in the legacy navigation.

#### Scenario: No Missing Links
GIVEN the new sidebar implementation
WHEN audited against `src/config/navigation.ts`
THEN no existing route (e.g., `/quality/training/manager`) MUST be missing.
