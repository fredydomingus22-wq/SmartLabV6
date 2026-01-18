# Design: Compact Page Header & Stepper

## Visual Style
- **Compactness**: Reduce vertical padding in `PageHeader` and `SampleStepper`.
- **Typography**: Slightly reduced font sizes for the Title in "compact" mode to balance the reduced whitespace.
- **Background**: Ensure the background remains consistent with the "Industrial Glassmorphism" (blur, transparency) but potentially with less "glow" interference in compact mode.

## Component Architecture

### `PageHeader`
Update the existing shared component to accept a `size` prop.

```tsx
interface PageHeaderProps {
  // ... existing props
  size?: 'default' | 'compact'; // default: 'default'
}
```

**Behavior for `size="compact"`:**
- Container: `min-h-[48px]` (vs 64px)
- Padding: `py-2` (vs py-4)
- Title: `text-xl` (vs 2xl)
- Bottom Margin: `mb-4` (vs mb-6)

### `SampleStepper`
- Remove hardcoded `py-6`.
- Allow `className` prop to control padding.
- In the Sample Detail Page, render `SampleStepper` inside `PageHeader`'s `children` (or `bottomContent` if we decide to add that slot, but `children` works) with minimal padding.

## Reference Image Analysis
- **Breadcrumbs**: Matches current `overline` + `backHref`.
- **Title**: Matches current `title`.
- **Subtitle**: Matches current `description`.
- **Status/Actions**: Matches current `actions`.
- **Stepper**: Visually integrated at the bottom of the header.

## Mockup Structure
```tsx
<PageHeader 
    size="compact"
    variant="blue"
    // ...
>
    <div className="mt-2 -mb-2"> {/* Negative margin to pull it up if needed */}
        <SampleStepper className="py-2" />
    </div>
</PageHeader>
```
