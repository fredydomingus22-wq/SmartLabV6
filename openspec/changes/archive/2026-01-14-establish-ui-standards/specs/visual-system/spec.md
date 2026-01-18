## ADDED Requirements

### Requirement: Standard Card Types
The system SHALL support four official card types: KPI, Status/Risk, Operational, and Analytical, each with specific design and usage constraints.

#### Scenario: KPI Card Usage
- **WHEN** a high-level metric needs to be displayed on a dashboard
- **THEN** it MUST use a KPI Card with fixed height `h-[120px]` and `p-4` padding

#### Scenario: Status Card Usage
- **WHEN** a quality or risk state needs to be indicated
- **THEN** it MUST use a Status Card with height `h-[96px]` and a mandatory semantic icon

### Requirement: Core Spacing Tokens
The UI SHALL exclusively use standardized Tailwind spacing tokens for layout and internal padding.

#### Scenario: Element Gap
- **WHEN** placing elements within a section or card block
- **THEN** they MUST use `gap-4` as the primary spacing standard

#### Scenario: Vertical Spacing
- **WHEN** separating title and value within a card
- **THEN** they MUST use `space-y-1` or `space-y-2` as defined in the container standards

### Requirement: Mandatory PageHeader
Every structural page in the application SHALL include a `PageHeader` component as its first element.

#### Scenario: Structural Page Context
- **WHEN** a user navigates to a new module page
- **THEN** a `PageHeader` MUST be visible at the top, containing the title and optional functional actions
