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

## Testing Workflow

**Storybook is usually already running** on port 6006. When verifying changes:
1. Run `npm run build` to check TypeScript errors
2. Run `npm run test-storybook` directly (assumes Storybook is running on port 6006)
3. If tests fail due to Storybook not running, ask the user before starting it

**DO NOT:**
- Kill existing Storybook processes
- Start a new Storybook instance without asking
- Run `npm run storybook` unless explicitly needed

## Architecture

```
src/
├── components/
│   ├── ui/                    # Generic UI primitives (reusable anywhere)
│   │   ├── core/              # Button, Card, Badge, Text, Heading, Avatar, Code, Label
│   │   ├── form/              # Input, Select, Checkbox, Radio, TextArea, FormLabel
│   │   ├── feedback/          # Skeleton, Toast, Spinner, ProgressBar, EmptyState
│   │   ├── navigation/        # NavItem, Breadcrumb, Tabs, ToggleGroup
│   │   ├── overlays/          # Modal, Tooltip, Popover, Dropdown, ConfirmDialog
│   │   ├── data-display/      # Table, CodeBlock
│   │   └── layout/            # Grid, Content, Main
│   │
│   ├── domain/                # Domain-specific (AI security monitoring)
│   │   ├── layout/            # Shell, Sidebar, TopBar, UserMenu, Logo
│   │   ├── agents/            # AgentSelector, ModeIndicators
│   │   ├── metrics/           # StatCard, RiskScore, ComplianceGauge
│   │   ├── activity/          # ActivityFeed, ToolChain, LifecycleProgress
│   │   ├── visualization/     # ClusterVisualization, SurfaceNode
│   │
│   └── features/              # Feature-specific (tied to specific pages)
│       └── ...
│
├── theme/
│   ├── theme.ts       # Design tokens and theme object
│   ├── animations.ts  # Keyframe animations
│   └── GlobalStyles.ts # Global CSS reset
└── pages/             # Demo pages
```

## Path Aliases (ALWAYS USE)

```typescript
// ✓ Good - UI component imports
import { Button } from '@ui/core/Button';
import { Modal } from '@ui/overlays/Modal';

// ✓ Good - Domain component imports
import { StatCard } from '@domain/metrics/StatCard';
import { Shell } from '@domain/layout/Shell';

// ✓ Good - same-directory imports stay relative
import { StyledButton } from './Button.styles';

// ✗ Bad - relative paths for cross-directory
import { Button } from '../../components/ui/core/Button';
```

| Alias | Maps To | Purpose |
|-------|---------|---------|
| `@ui/*` | `src/components/ui/*` | Generic UI primitives |
| `@domain/*` | `src/components/domain/*` | Domain-specific components |
| `@features/*` | `src/components/features/*` | Feature-specific components |
| `@theme/*` | `src/theme/*` | Design tokens |
| `@api/*` | `src/api/*` | API layer |
| `@pages/*` | `src/pages/*` | Demo pages |

## Component Placement Guide

**Where should I put my new component?**

| Category | Use When | Examples |
|----------|----------|----------|
| `ui/` | Generic, reusable in any project. No domain knowledge. | Button, Modal, Table, Input |
| `domain/` | Specific to AI security monitoring, but reusable across pages. | StatCard, RiskScore, AgentSelector |
| `features/` | Tied to a specific feature/page. Used in one place. | AlertsPanel, ReportBuilder |

**Decision tree:**
1. Could this be extracted as a standalone npm package? → `ui/`
2. Does it know about agents, security, monitoring? → `domain/`
3. Is it only used in one feature/page? → `features/`

## Development Guide

**All development instructions are in [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md).**

Key requirements:
- **REUSE FIRST:** Check existing components before creating new ones
- **Path aliases:** Use `@ui/*`, `@domain/*`, `@features/*` for component imports
- **Correct category:** Place components in UI, Domain, or Features per the guide above
- **Interaction tests:** Every story MUST have a `play` function with tests
- **Update index:** When adding/removing components, update [COMPONENTS_INDEX.md](./docs/COMPONENTS_INDEX.md)
- **Verify Usage:** When adding/removing components or updating their API, find usages and make sure change didn't break anything - if difficult to solve - ask user
- **Move files using git** - Use `git mv` instead of `mv`


## How to Execute Tasks

### 1. Read First, Then Act
- Read the ENTIRE task document before starting any work
- Understand the full scope and all requirements
- Note any dependencies on other tasks

### 2. Research Before Implementing
- Look online for best practices and patterns
- Study similar tools and how they solve similar problems
- Validate your approach before committing to it
- Reference the existing codebase where relevant

### 3. Keep It Simple

**This is the most important principle.** 

Always prefer:
- Simple over complex
- Boring over clever
- Working over perfect
- Incremental over big-bang
- Explicit over implicit

Don't over-engineer. The simplest solution that meets the requirements is the best solution.

### 4. Test-First When Applicable
- Write tests before implementation when the task involves code
- Tests serve as documentation of expected behavior
- Tests prevent regressions

### 5. Document Your Decisions
- Explain WHY you chose an approach, not just what you did
- Document trade-offs you considered
- Make it easy for others to understand and extend your work
- But - don't create redundant markdown files, no one ever read those! Document for yourself first, then review, validate and iterate.

### 6. Deliver Incrementally
- Show progress regularly
- Don't disappear for hours without output
- Break large deliverables into smaller checkpoints

### 7. Ask for Clarification
- If something is ambiguous, ask before proceeding
- It's better to clarify than to build the wrong thing
- Assumptions should be stated explicitly


### 8. Always use up-to-date versions

- Use the latest stable versions of each package

## Executor Profile

**You are:** A **World-Class React Engineer** with 10+ years of experience building web applications. You have:
- Deep expertise in React
- Track record of building web applications that are fast, responsive, and easy to use
- Experience with building web applications that are scalable and maintainable
- Strong ability to simplify complex multi-stage products
