## Context
The SmartLab UI must feel like a next-generation industrial command center. This requires strict adherence to specific design tokens and component usage rules to ensure the system remains professional and audit-ready.

## Goals
- Provide a clear, unambiguous guide for UI development.
- Ensure 100% consistency in spacing and layout across all modules.
- Enforce the use of semantic cards for industrial data representation.

## Decisions
- **Decision**: Standardize on `h-[120px]` for KPI cards.
  - **Rationale**: Ensures a predictable grid alignment for high-level metrics.
- **Decision**: Mandatory `PageHeader` in all structural pages.
  - **Rationale**: Establishes functional context and hierarchy consistency.
- **Decision**: Exclusive use of `slate` palette for the industrial dark mode.
  - **Rationale**: High contrast and professional aesthetic suitable for industrial displays.

## Risks / Trade-offs
- **Risk**: Rigid height for KPI cards might cut off long text.
  - **Mitigation**: Standard includes a "Not Allowed" section (no long paragraphs in KPI cards).
