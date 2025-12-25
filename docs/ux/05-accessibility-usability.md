# Accessibility & Usability — SmartLab Enterprise

> **Status**: Draft 1.0

## 1. Accessibility (A11y) Checklist

We target **WCAG 2.1 AA** compliance.

### Keyboard Navigation
- [ ] **Focus Visible**: All interactive elements must have a visible focus ring (Outline).
- [ ] **Tab Order**: Logical flow (Left->Right, Top->Bottom). No "Keyboard Traps".
- [ ] **Shortcuts**: Support `Enter` to submit, `Esc` to close modals.

### Visuals
- [ ] **Contrast**: Text ratio at least 4.5:1 against background. (Crucial for lab environments with glare).
- [ ] **Color Independence**: Do not rely *only* on color to convey meaning.
    *   *Bad*: "Red button".
    *   *Good*: "Red button with 'Reject' icon/text".
    *   *Charts*: Use patterns or distinct shapes/tooltips alongside colors.

### Screen Readers
- [ ] **Labels**: All inputs have `<label>` or `aria-label`.
- [ ] **Roles**: Use proper HTML5 tags (`<nav>`, `<main>`, `<button>`).

## 2. Usability Standards

### Touch Targets (Production Mode)
*   **Size**: Minimum **44x44px** for all touchable elements on mobile/tablet views.
*   **Spacing**: 8px minimum margin between buttons to prevent "Fat finger" errors.

### Data Density
*   **Office Mode**: High density allowed (Compact rows).
*   **Lab/Plant Mode**: Cozy/Relaxed density.
*   **Responsiveness**: Tables must scroll horizontally or stack cards. Do not break layout.

### Performance (Perceived)
*   **Debounce**: Search inputs wait 300ms before querying.
*   **Feedback**: Any click takes <100ms to show visual reaction (ripple, active state).
*   **Large Lists**: Virtualize lists > 100 items to keep DOM light.

## 3. Environment Specifics
*   **Glare**: Avoid pure white backgrounds in bright labs if possible; support Dark Mode.
*   **Gloves**: Avoid multi-touch gestures. Simple taps only.
*   **Noise**: Audio feedback (beeps) must be accompanied by visual flash/toast.
