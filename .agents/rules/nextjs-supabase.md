---
trigger: model_decision
---

# Next.js 16 & Supabase Standards

## Next.js 16 App Router
- **Server Actions**: Always prefer Server Actions (`app/actions.ts`) over Route Handlers (`app/api/*`) for data mutations.
- **Async Components**: In Next.js 16, page and layout components can be async. Data fetching should happen on the server component side.
- **Client Components**: Use `"use client"` only at the leaves of your component tree. Avoid putting it at the root layout or page level.

## Supabase SSR
- Always use `@supabase/ssr` to interact with Supabase in Next.js 16.
- **Server Components/Actions**: Use `createServerClient` from `utils/supabase/server.ts`. Remember that Server Components cannot set cookies, only Server Actions or Route Handlers can.
- **Client Components**: Use `createBrowserClient` from `utils/supabase/client.ts`.
- **Middleware**: Use `utils/supabase/middleware.ts` to refresh the auth token and protect routes (`/dashboard`, `/admin`, `/cashier`). Do not write custom cookie logic directly in the middleware; use the pattern provided by `@supabase/ssr`.

## Database Security (RLS)
- Never expose the `service_role` key to the client.
- Always assume Row Level Security (RLS) is enabled on the database. Queries from the client will run under the context of the authenticated user.
