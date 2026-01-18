# Spec: Compact Header Capability

## ADDED Requirements

### Requirement: Support Compact Mode in PageHeader
The `PageHeader` component MUST support a `size` prop that allows switching between `default` and `compact` modes.

#### Scenario: Rendering Compact Header
GIVEN a PageHeader with `size="compact"`
WHEN it is rendered
THEN it should have reduced vertical padding (e.g., `py-2`)
AND the title font size should be smaller (e.g., `text-xl`)
AND the minimum height should be reduced (e.g., `min-h-[48px]`)

### Requirement: Responsive Compact Layout
The compact header MUST maintain responsive behavior, stacking actions on smaller screens if necessary, but prioritizing vertical space saving.

#### Scenario: Mobile View
GIVEN the compact header on a mobile screen
WHEN the width is reduced
THEN the actions should wrap or stack gracefully without breaking the layout or overlapping the title.

### Requirement: Stepper Integration
The `SampleStepper` component MUST be adjustable via props/classes to fit within the compact header without excessive padding.

#### Scenario: Reduced Padding in Stepper
GIVEN the `SampleStepper` component
WHEN `className="py-0"` or similar is passed
THEN it should utilize that class and not enforce a hardcoded large vertical padding.
