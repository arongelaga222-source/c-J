---
name: chrome-devtools
description: >-
  Use this skill when you need to debug UI layout, troubleshoot network requests, analyze cookies, or run automated browser tests.
---

# Chrome DevTools Debugging Guide

When encountering UI issues, cookie problems, or failed Supabase network requests, you can use the Chrome DevTools MCP or run a browser subagent.

## 1. Inspecting Layouts
- **Tailwind Grid/Flex**: If a layout is broken, check the DOM structure. Ensure `h-full` and `min-h-screen` are applied correctly down the DOM tree.
- **Z-Index**: If Shadcn dialogs or popovers are hiding behind other elements, check z-index stacking contexts.

## 2. Debugging Auth & Network
- Supabase SSR relies on cookies. If authentication is failing, verify the `sb-[project_ref]-auth-token` cookie is being set by the server and sent by the client.
- Inspect the Network tab for failed requests to `https://*.supabase.co/rest/v1/` or `https://*.supabase.co/auth/v1/`.
- Ensure Row Level Security (RLS) is not silently blocking SELECT queries (which return empty arrays instead of errors).

## 3. Responsive Testing
- Emulate mobile devices to ensure the Pickleball booking calendar and POS grid look acceptable on small screens.
