# Copy, States & Errors — SmartLab Enterprise

> **Status**: Draft 1.0

## 1. Tone of Voice
**Professional, Technical, Concise, Calm.**
*   *Do*: "Sample ID required." | "Batch approved."
*   *Don't*: "Oops! You forgot something." | "Great job!" (Robotic cheerleading is annoying in pro tools).
*   *Voice*: We are a reliable assistant, not a buddy.

## 2. Microcopy Library

### CTAs (Call to Action)
*   **Save**: Persist changes locally or to DB.
*   **Submit**: Send for processing/review (changes ownership).
*   **Approve**: Formal validation (Quality).
*   **Reject**: Formal invalidation (Quality).
*   **Cancel**: Abort action / Close modal.

### Labels & Hints
*   **Units**: `Temperature (°C)`, `Volume (L)`.
*   **Optional**: Mark optional fields with `(Optional)` rather than marking all required ones with `*` (unless form is 90% optional).
    *   *Decision*: In our context, 95% of fields are required. **Mark Optional fields explicitly.**

## 3. Standard States

### Loading
*   **Skeleton**: Use for structural content (Tables, Cards). Mimic the layout.
*   **Spinner**: Use for buttons (Submit -> Submitting...) to prevent double-submit.
*   **Progress Bar**: For uploads or long batch processes.

### Empty State
*   **Context**: "No Samples Found."
*   **Next Action**: "Create your first Sample" (Button) or "Adjust filters" (Link).
*   **Illustration**: Minimalist icon (Ghost, Folder). Avoid "Cute" cartoons.

### Offline / Latency
*   **Indicator**: Yellow/Orange badge "Offline Mode".
*   **Action**: "Changes saved locally. Will sync when online."

## 4. Error Taxonomy

### Validation Errors (User Fixable)
*   **Message**: "Value must be between 0 and 14."
*   **Action**: Highlight field in red. Focus field.
*   **Timing**: Validate `onBlur` for complex fields, `onChange` for simple formatting.

### Network Errors (Retryable)
*   **Message**: "Connection failed. Please check your internet."
*   **Action**: "Retry" button. Do not lose form data.

### Permission Errors (Blockers)
*   **Message**: "You do not have permission to approve this batch."
*   **Action**: "Request Access" (if applicable) or "Contact Administrator".

### System/Server Errors (Fatal)
*   **Message**: "Something went wrong. Error Ref: #12345."
*   **Action**: "Reload Page". (Log automatically to Sentry/Logs).
