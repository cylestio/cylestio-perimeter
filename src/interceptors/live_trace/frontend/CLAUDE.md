# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cylestio UIKit - A React component library implementing a dark cyberpunk design system for AI security monitoring dashboards.

**Tech Stack:** React 19, TypeScript, Vite, Styled Components, Storybook 10

## Build Commands

```bash
npm run dev            # Start Vite dev server
npm run build          # TypeScript check + Vite build
npm run storybook      # Start Storybook dev server (port 6006)
npm run test-storybook # Run Storybook interaction tests
npm run lint           # Run ESLint
npm run format         # Run Prettier
```

**Don't kill or restart Storybook without asking.**

## Development Guide

**IMPORTANT: Before starting any component work, you MUST read [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md).**

This includes:
- Executor profile and development principles
- Quick reference checklists
- Project structure and component patterns
- Import organization and path aliases
- Storybook story patterns and testing requirements
- API layer conventions

When adding, updating, or removing components, you MUST also update [docs/COMPONENTS_INDEX.md](./docs/COMPONENTS_INDEX.md).

You must read those files if you're doing anything relevant:

- **Creating a component**
  - Template: [COMPONENT.md](./docs/templates/COMPONENT.md)
  - What's Inside: Import order (7 groups), placement rules, file structure, styled components patterns, exports, accessibility, icons (lucide-react only)
- **Creating a story**
  - Template: [STORY.md](./docs/templates/STORY.md)
  - What's Inside: Story patterns, required `play()` functions, router customization, testing interactions
- **Creating an API endpoint**
  - Template: [API.md](./docs/templates/API.md)
  - What's Inside: Type definitions, endpoint functions, barrel exports, error handling
- **Need theme tokens**
  - Template: [THEME_REFERENCE.md](./docs/THEME_REFERENCE.md)
  - What's Inside: Colors, spacing, typography, radii, shadows, transitions

## Page Icons

Page and navigation icons are centralized in `@constants/pageIcons`. This ensures consistency between sidebar navigation (App.tsx) and page headers.

**When adding a new page:**
1. Add its icon to `src/constants/pageIcons.ts`
2. Import from `@constants/pageIcons` in both App.tsx and the page component
3. Do NOT import icons directly from `lucide-react` for page headers

**Note:** Icons used within page content (not in headers/navigation) can still be imported directly from `lucide-react`.

## Before Committing

- [ ] `npm run build` passes
- [ ] `npm run test-storybook` passes
- [ ] `npm run lint` passes
- [ ] COMPONENTS_INDEX.md updated if components changed

