# Change: Establish UI Standards for Card & Container System

## Why
To ensure visual consistency, operational clarity, and industrial robustness across all SmartLab Enterprise modules. Standardized UI components reduce developer cognitive load and improve the auditability of the user interface in regulated environments.

## What Changes
- Defines official requirements for **Card & Container** systems.
- Establishes mandatory spacing, padding, and layout tokens based on Tailwind CSS.
- Mandates the use of a centralized **PageHeader** component.
- Defines contextual usage rules for different card types (KPI, Status, Operational, Analytical).

## Impact
- Affected specs: `visual-system`
- Affected code: `src/components/ui/card.tsx`, `src/components/layout/PageHeader.tsx`, and all future dashboard/module pages.
