---
name: nextjs16-supabase
description: >-
  Use this skill when developing Next.js 16 App Router features, handling Supabase SSR authentication, writing Server Actions, or modifying data-fetching architecture.
---

# Next.js 16 & Supabase Architecture Guide

This project relies on Next.js 16 and the `@supabase/ssr` package. When implementing new features, follow these architectural constraints:

## 1. Authentication Flow
- **Supabase SSR**: The user session is managed securely via cookies using the `@supabase/ssr` library.
- **Server Actions**: If a user submits a login/signup form, the action runs in `app/actions.ts`. The Server Action instantiates the Supabase server client and calls `supabase.auth.signInWithPassword` or `signUp`.
- **Client Fallback**: If you need real-time data or a client-side subscription, instantiate `createBrowserClient` from `utils/supabase/client.ts`.

## 2. Data Fetching Strategy
- **Server Components (Default)**: Fetch data directly in Server Components using the Supabase server client. Next.js 16 will render this on the server.
- **Data Mutations**: Always use Server Actions for POST/PUT/DELETE operations. Server actions should reside in `app/actions.ts` or closely co-located files.
- **Revalidation**: After a successful Server Action (like booking a court), call `revalidatePath('/dashboard')` or `revalidateTag` to refresh the cached data on the client.

## 3. Dealing with Supabase Schema
- Since we use standard Supabase PostgreSQL tables, we don't have an ORM like Prisma. Write strongly typed wrappers or generate types via the Supabase CLI (`supabase gen types typescript --local > types/supabase.ts`) if types are needed.
- Treat `auth.users` as internal to Supabase. All application user data (name, role) belongs in the `public.profiles` table. They are linked via `auth.users.id = public.profiles.id`.
