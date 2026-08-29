---
name: agy-customizations
description: >-
  Guide to extending this project's custom rules and skills. Use this when you are asked to create a new project rule, hook, or skill.
---

# Antigravity Customizations Guide

This project uses the `.agents/` directory to store specialized rules and skills.

## 1. Creating Rules
- Place global repository rules in `.agents/rules/*.md` or the top-level `AGENTS.md`.
- Use rules for architectural constraints, styling guidelines, and strict "do not do X" restrictions.

## 2. Creating Skills
- Place specialized workflows in `.agents/skills/<skill-name>/SKILL.md`.
- Skills are loaded via progressive disclosure. Ensure the YAML frontmatter contains a clear, third-person `description` explaining EXACTLY when the agent should activate the skill.
- Skills are for step-by-step procedures, business logic documentation, or CLI workflows.

## 3. Creating MCP Servers & Hooks
- If integrating an external tool or database, define an MCP server in `mcp_config.json`.
- If automating actions before/after specific tool calls, define a hook in `hooks.json`.
