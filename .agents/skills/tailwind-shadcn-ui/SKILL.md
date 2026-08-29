---
name: tailwind-shadcn-ui
description: >-
  Use this skill when developing UI components, modifying Tailwind v4 classes, dealing with responsive layouts, or implementing Shadcn UI primitives like modals and dialogs.
---

# UI & Styling Guidelines (Tailwind CSS v4 + Shadcn)

## 1. Tailwind v4 Overview
This project uses **Tailwind CSS v4** (`@tailwindcss/postcss`). 
- There is no `tailwind.config.js`. Theme configuration is handled entirely in CSS (`globals.css`) via CSS variables.
- Standard utility classes apply (e.g., `flex`, `grid`, `text-center`, `p-4`).

## 2. Shadcn UI Component Primitives
- Shadcn UI components are located in `components/ui/`.
- Do not modify these primitive components directly unless requested.
- Compose pages using these primitives (e.g., `<Button>`, `<Card>`, `<Input>`, `<Dialog>`).

## 3. Creating New UI Components
- If you need a new complex component (e.g., a Booking Calendar, a POS receipt preview), create it in the `components/` root directory.
- Keep them responsive. Design mobile-first (use base classes for mobile, and `md:` or `lg:` for desktop).

## 4. Date Pickers & Forms
- The project includes `react-day-picker`. When building the court booking interface, use the existing `<Calendar>` component inside `components/ui/calendar.tsx` to ensure consistent styling.
- Use native HTML forms and `action={serverAction}` for data submission, but standard controlled components for client-side interactions where React state is necessary.
