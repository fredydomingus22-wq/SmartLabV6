# Interaction Patterns — SmartLab Enterprise

> **Status**: Draft 1.0

## 1. Data Tables (The Workhorse)
Used for: Samples, Inventory, Logs, Users.
*   **Pattern**: Full-width, dense rows.
*   **Features**:
    *   **Sticky Header**: Column names always visible.
    *   **Pagination**: Server-side (limit 20/50/100).
    *   **Actions**: Row hover reveals "Edit/Delete/View" icons at the end.
    *   **Filters**: Popover interaction (Click funnel icon -> select active/pending). Only show active filters as "Chips" above table.
*   **Mobile**: Collapse to Card View (Vertical stack of key-value pairs).

## 2. Modals vs. Drawers vs. Pages
*   **Modal (Dialog)**:
    *   *Use for*: Critical confirmations ("Are you sure?"), Short forms (Change Password), Quick Entry (New Sample).
    *   *Behavior*: Blocks background interaction. Close on Escape.
*   **Drawer (Sheet)**:
    *   *Use for*: Contextual details (Click row -> Inspect details without leaving list), Filters, Help context.
    *   *Behavior*: Slides from right. Persists scroll position of main content.
*   **Dedicated Page**:
    *   *Use for*: Complex workflows (Analysis Entry), Dashboards, Settings.
    *   *Behavior*: Has its own URL. "Back" button required.

## 3. Wizards / Steppers
*   *Use for*: Setup processes (New Plant Config), infrequent complex tasks (New Product Launch).
*   *Behavior*: Horizontal steps top bar. "Next" button disabled until step valid. "Back" allowed. Auto-save draft on step change.
*   *Avoid for*: Routine daily tasks (do not use Wizard for creating a generic sample).

## 4. Searchable Combobox (The "Smart Select")
*   *Use for*: Selecting Product, Batch, or User.
*   *Behavior*: Type to filter.
*   *Quick Create*: If item not found, show "+ Create 'XYZ'" option at bottom (if permission allows).

## 5. Inline Edit
*   *Use for*: Rapid data entry in Grids (Result Entry Worksheet).
*   *Behavior*: Click cell -> turns to Input. Enter/Tab -> saves and moves to next cell.
*   *Visuals*: Dirty state (yellow corner) indicates "Unsaved" if batch saving; Green check if auto-saved.

## 6. Feedback (Toast vs. Banner)
*   **Toast (Sonner)**: Transient success/info. ("Saved successfully"). Bottom-right.
*   **Banner (Alert)**: Persistent system status. ("Maintenance Scheduled", "Subscription Expiring"). Top of content.
*   **Inline Error**: Validation failures. Immediately below the input field.

## 7. Dashboards
*   **Pattern**: Grid layout.
*   **Drilldown**: Clicking a Chart Bar or KPI Card does NOT just show a tooltip. It filters the underlying Data Table to show records contributing to that metric.
    *   *Ex*: Click "5 Rejected Samples" card -> Navigate to Samples List with `?status=rejected`.
