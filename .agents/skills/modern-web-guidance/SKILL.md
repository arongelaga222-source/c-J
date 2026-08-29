---
name: modern-web-guidance
description: >-
  Use this skill when planning frontend user experience flows, adding animations, handling loading states, or optimizing Core Web Vitals.
---

# Modern Web Development Guidance

## 1. User Experience (UX) States
- **Optimistic Updates**: Use React's `useOptimistic` hook (if using Next.js client components) or optimistic UI patterns to make the interface feel snappy, particularly during POS checkout or booking confirmations.
- **Loading States**: Always provide clear visual feedback. Use loading spinners inside buttons (`<Button disabled> <Spinner /> </Button>`) when a Server Action is pending.
- **Empty States**: If a user has no bookings, or the POS cart is empty, render a well-designed Empty State component instead of a blank screen.

## 2. Micro-Interactions & Animation
- The project includes `tw-animate-css`. Use tasteful animations for state transitions (e.g., fading in the cart side-panel, modal entrance animations).
- Don't over-animate. Stick to quick, subtle transitions (`duration-150` to `duration-300`).

## 3. Accessibility (a11y)
- Shadcn components are built on Radix UI/Base UI, providing built-in accessibility.
- When creating custom components, always include `aria-label` where text isn't explicitly visible, and ensure everything is keyboard-navigable.
- Maintain high color contrast (WCAG standards).
