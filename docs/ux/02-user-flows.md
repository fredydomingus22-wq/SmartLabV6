# User Flows — SmartLab Enterprise

> **Status**: Draft 1.0

## Flow 1: Create Sample (The "Daily Driver")

**Goal**: Register a new physical sample into the system for testing.
**Preconditions**: User is logged in as Lab Tech or QA. Product exists in Master Data.

1.  **Entry**: Click "+ New Sample" (Primary Action on Dashboard or Samples List).
2.  **Selection**: Modal opens. User scans barcode OR selects "Tank/Line" manually.
    *   *System validates*: Is the Tank active? (If no, show error).
3.  **Details**: Select "Product" and "Sample Type" (e.g., Finished Good).
    *   *Auto-fill*: Batch Code is inferred from current Production Run if available.
4.  **Submission**: Click "Create".
    *   **Success**: Toast "Sample AMS-001 created". Navigate to Sample Detail (or stay to create another if "Save & Add Another" checked).
    *   **Failure**: Network error? Show "Retry" option.
    *   **Variant**: "Draft" mode if unsure about details (saves locally).

## Flow 2: Record Results (The "Core Loop")

**Goal**: Enter analytical data for a sample.

1.  **Access**: Open Sample Detail > "Results" Tab.
2.  **Entry**: Focus on first parameter field (e.g., pH). Type value `7.2`.
3.  **Validation (Immediate)**:
    *   **In-Spec**: Field border turns Green or neutral.
    *   **OOS (Out of Spec)**: Field border turns **RED**. Message: "Max 7.0".
4.  **Completion**: Fill all required fields.
5.  **Save**: Click "Save Results".
    *   *Prompt*: If OOS exists, Modal appears: "Spec Failure Detected. Please enter comment/justification."
6.  **Confirmation**: Results saved. Status changes from `Pending` -> `In Review`.

## Flow 3: Review & Approve (The "Gate")

**Goal**: QA Supervisor releases the sample.

1.  **Notification**: Supervisor sees "5 Pending Approvals" in Dashboard.
2.  **Review**: Clicks item. Sees highlighted OOS results (if any).
3.  **Decision**:
    *   **Approve**: Validates data. Clicks "Approve". Electronic Signature prompt (Password/PIN). Result: Status `Approved`.
    *   **Reject**: Data suspect. Clicks "Reject". Enters reason ("Retest needed"). Result: Status `Rejected` -> Flow triggers "New Sample" request.
    *   **Correction**: Clicks specific result, requests edit.

## Flow 4: Generate Report (The "Output")

1.  **Filter**: Go to Reports. Select "COA". Filter by Batch `B-2024`.
2.  **Preview**: See generated PDF preview on screen.
3.  **Action**:
    *   **Export**: Download PDF.
    *   **Print**: Trigger system print dialog.
    *   **Email**: Send directly to customer (if configured).

## Flow 5: Investigate Deviation (The "Fix")

1.  **Trigger**: OOS confirmed. System creates "NC (Non-Conformance)" object automatically.
2.  **Dashboard**: User navigates to Quality > Deviations.
3.  **Drilldown**: Click NC-001. View "Root Cause Analysis" form (Ishikawa/5 Whys).
4.  **Trace**: View "History" tab to see all samples from that Batch/Line.
5.  **Action Plan**: Assign Task to Operator ("Adjust Pump A").
6.  **Close**: When Action completed, Mark as Closed.
