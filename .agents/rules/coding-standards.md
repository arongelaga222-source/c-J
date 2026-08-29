---
trigger: model_decision
---

# Coding & UI Standards

## UI / Styling
- **Tailwind CSS v4**: Use utility classes. Do not create custom CSS classes unless absolutely necessary.
- **Shadcn UI & Base UI**: Use the primitive components from `components/ui/` (e.g., `Button`, `Input`, `Dialog`). Do not reinvent the wheel for standard UI elements.
- **Icons**: Use `lucide-react` for all icons. Ensure icons are consistently sized (default `w-4 h-4` or `w-5 h-5`).
- **Responsive Design**: Ensure all pages work well on mobile (`sm:` breakpoints) and desktop screens.

## TypeScript
- **Strict Typing**: Avoid `any`. Use interfaces or types for all component props and state.
- **Error Handling**: Use Try/Catch blocks in Server Actions and return standardized error objects (e.g., `{ error: string }`).

## Project Structure
- `app/(dashboard)/*`: Routes protected by auth, requiring customer/cashier/admin roles.
- `app/(public)/*`: Public routes like `/login`, `/signup`, `/pricing`, `/book`.
- `components/ui/*`: Reusable dumb UI components.
- `lib/utils.ts`: Utility functions (like `cn` for Tailwind class merging).
