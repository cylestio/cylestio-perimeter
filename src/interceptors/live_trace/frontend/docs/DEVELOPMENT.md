# Development Guide

This is the source of truth for developing in the Cylestio UIKit frontend.

---

## Executor Profile

**You are:** A **World-Class React Engineer** with 10+ years of experience building web applications. You have:
- Deep expertise in React
- Track record of building web applications that are fast, responsive, and easy to use
- Experience with building web applications that are scalable and maintainable
- Strong ability to simplify complex multi-stage products

---

## Development Principles

1. **Keep It Simple** - The most important principle. Simple over complex, boring over clever, working over perfect, incremental over big-bang, explicit over implicit. Don't over-engineer.
2. **Read First, Then Act** - Read the ENTIRE task before starting. Understand scope and dependencies.
3. **Research Before Implementing** - Look online for best practices. Study similar tools. Validate your approach.
4. **Test-First When Applicable** - Tests serve as documentation and prevent regressions.
5. **Document Decisions** - Explain WHY, not just what. But don't create redundant markdown files.
6. **Deliver Incrementally** - Show progress regularly. Break large deliverables into checkpoints.
7. **Ask for Clarification** - If ambiguous, ask before proceeding. State assumptions explicitly.
8. **Use Up-to-Date Versions** - Use the latest stable versions of packages.
9. **Never use emojis in the code** - Use icons from `lucide-react`
---

## Quick Reference Checklists

### Before Starting

- [ ] Read task fully before acting
- [ ] Check existing components in [COMPONENTS_INDEX.md](./COMPONENTS_INDEX.md)
- [ ] Research patterns if needed

### Import Organization

- [ ] Follow exact order: React → External → Internal (`@api`, `@theme`, `@utils`) → `@ui` → `@domain` → Relative
- [ ] Add blank line between each group
- [ ] Sort alphabetically within each group

See [Import Organization](#import-organization-1) for full details.

### Component Placement (Decision Tree)

1. Can it be a standalone npm package? → `ui/`
2. Does it know about agents, security, monitoring? → `domain/`
3. Otherwise → `features/`

### Path Aliases

- [ ] Use `@ui/*`, `@domain/*`, `@features/*` for cross-directory imports
- [ ] Use relative imports (`./`) only for same-directory

### Component Changes

- [ ] Update stories with new props
- [ ] Add `play()` function with tests to every story
- [ ] Ensure types match implementation
- [ ] Update [COMPONENTS_INDEX.md](./COMPONENTS_INDEX.md)
- [ ] Verify usages still work (find usages, check nothing broke)

### Testing

- [ ] Run `npm run build` (TypeScript check)
- [ ] Run `npm run test-storybook`
- [ ] Keep Storybook running (don't restart without asking)

### Before Committing

- [ ] Use `git mv` for file moves (not `mv`)
- [ ] Run `npm run lint`
- [ ] Remove any over-engineering

---

## Quick Start

```bash
# Install dependencies
npm install

# Start Storybook (component development)
npm run storybook

# Run build (TypeScript check + Vite build)
npm run build

# Run linting
npm run lint

# Run Storybook tests (assumes Storybook is running on port 6006)
npm run test-storybook
```

**Testing Workflow:**
1. Storybook is usually already running on port 6006
2. Run `npm run build` to check TypeScript errors
3. Run `npm run test-storybook` directly
4. If tests fail due to Storybook not running, ask the user before starting it

**DO NOT:**
- Kill existing Storybook processes
- Start a new Storybook instance without asking
- Run `npm run storybook` unless explicitly needed

---

## Project Structure

```
src/
├── components/
│   ├── ui/                    # Generic UI primitives (reusable anywhere)
│   │   ├── core/              # Button, Card, Badge, Text, Heading, Avatar, Code, Label
│   │   ├── form/              # Input, Select, Checkbox, Radio, TextArea, FormLabel
│   │   ├── feedback/          # OrbLoader, Skeleton, Toast, ProgressBar, EmptyState
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
│   │   └── visualization/     # ClusterVisualization, SurfaceNode
│   │
│   └── features/              # Feature-specific (tied to specific pages)
│       └── ...
│
├── pages/               # Demo pages
├── theme/               # Design system (theme.ts, animations.ts, GlobalStyles.ts)
├── api/                 # API layer (types, endpoints, mocks)
├── hooks/               # Custom hooks
└── utils/               # Utility functions
```

### Component File Pattern

```
ComponentName/
├── ComponentName.tsx         # Component + types
├── ComponentName.styles.ts   # Styled components
└── ComponentName.stories.tsx # Stories + tests
```

---

## Import Organization

**Follow this exact order. Separate each group with a blank line.**

| Order | Group | Aliases/Patterns | Example |
|-------|-------|------------------|---------|
| 1 | React core | `react` | `import { useState } from 'react'` |
| 2 | External libs | npm packages | `import { X } from 'lucide-react'` |
| 3 | Internal shared | `@api/*`, `@theme/*`, `@utils/*` | `import { theme } from '@theme/index'` |
| 4 | UI components | `@ui/*` | `import { Button } from '@ui/core/Button'` |
| 5 | Domain components | `@domain/*` | `import { Shell } from '@domain/layout/Shell'` |
| 6 | Pages/Features | `@pages/*`, `@features/*` | `import { Dashboard } from '@pages/index'` |
| 7 | Relative imports | `./`, `../` | `import { styles } from './Component.styles'` |

### Example

```typescript
import { useState, useEffect } from 'react';

import { AlertCircle, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { APIAgent } from '@api/types/dashboard';
import { fetchDashboard } from '@api/endpoints/dashboard';
import { formatAgentName } from '@utils/formatting';

import { Button } from '@ui/core/Button';
import { Modal } from '@ui/overlays/Modal';

import { AgentSelector } from '@domain/agents/AgentSelector';
import { Shell } from '@domain/layout/Shell';

import { usePageMeta } from '../../context';
import { StyledContainer } from './App.styles';
```

---

## Path Aliases

**ALWAYS use path aliases for cross-directory imports.**

| Alias | Maps To | Purpose |
|-------|---------|---------|
| `@ui/*` | `src/components/ui/*` | Generic UI primitives |
| `@domain/*` | `src/components/domain/*` | Domain-specific components |
| `@features/*` | `src/components/features/*` | Feature-specific components |
| `@theme/*` | `src/theme/*` | Design tokens |
| `@api/*` | `src/api/*` | API layer |
| `@pages/*` | `src/pages/*` | Demo pages |
| `@hooks/*` | `src/hooks/*` | Custom hooks |
| `@utils/*` | `src/utils/*` | Utility functions |

### Examples

```typescript
// ✓ Good - cross-directory imports
import { Button } from '@ui/core/Button';
import { StatCard } from '@domain/metrics/StatCard';

// ✓ Good - same-directory imports stay relative
import { StyledButton } from './Button.styles';

// ✗ Bad - relative paths for cross-directory
import { Button } from '../../components/ui/core/Button';
```

---

## Component Reuse

**ALWAYS check for existing components before creating new ones.**

### Component Categories

**UI Components** (`@ui/*`) - Generic design system primitives:
| Category | Components |
|----------|------------|
| `ui/core/` | Button, Card, Badge, Text, Heading, Avatar, Code, Label |
| `ui/form/` | Input, Select, Checkbox, Radio, TextArea, FormLabel |
| `ui/feedback/` | OrbLoader, Skeleton, Toast, EmptyState, ProgressBar |
| `ui/navigation/` | NavItem, Tabs, Breadcrumb, ToggleGroup |
| `ui/overlays/` | Modal, ConfirmDialog, Tooltip, Popover, Dropdown |
| `ui/data-display/` | Table, CodeBlock |
| `ui/layout/` | Grid, Content, Main |

**Domain Components** (`@domain/*`) - AI security monitoring specific:
| Category | Components |
|----------|------------|
| `domain/layout/` | Shell, Sidebar, TopBar, UserMenu, Logo |
| `domain/agents/` | AgentSelector, ModeIndicators |
| `domain/metrics/` | StatCard, RiskScore, ComplianceGauge |
| `domain/activity/` | ActivityFeed, ToolChain, LifecycleProgress |
| `domain/visualization/` | ClusterVisualization, SurfaceNode |

See [COMPONENTS_INDEX.md](./COMPONENTS_INDEX.md) for full API reference with props and usage examples.

**When adding/removing/updating components, update COMPONENTS_INDEX.md!**

---

## Component Development

### File Structure

```typescript
// ComponentName.tsx
import type { FC, ReactNode } from 'react';
import { StyledComponent } from './ComponentName.styles';

// Types - defined at top, exported for external use
export type ComponentVariant = 'primary' | 'secondary';

export interface ComponentNameProps {
  variant?: ComponentVariant;
  children: ReactNode;
  className?: string;
}

// Component
export const ComponentName: FC<ComponentNameProps> = ({
  variant = 'primary',
  children,
  className,
}) => {
  return (
    <StyledComponent $variant={variant} className={className}>
      {children}
    </StyledComponent>
  );
};
```

### Styled Components (Transient Props)

Use `$` prefix for props that control styling:

```typescript
// ComponentName.styles.ts
import styled, { css } from 'styled-components';

interface StyledComponentProps {
  $variant: 'primary' | 'secondary';
  $disabled?: boolean;
}

export const StyledComponent = styled.div<StyledComponentProps>`
  // Always use theme values - never hardcode
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: all ${({ theme }) => theme.transitions.base};

  // Variant styles
  ${({ $variant, theme }) =>
    $variant === 'primary' &&
    css`
      background: ${theme.colors.cyan};
      color: ${theme.colors.void};
    `}

  // Conditional styles
  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.5;
      cursor: not-allowed;
    `}
`;
```

### Theme Tokens

Access via styled-components theme prop:

```typescript
// Colors
theme.colors.cyan          // Signal colors
theme.colors.white90       // Text colors
theme.colors.surface2      // Backgrounds
theme.colors.borderMedium  // Borders

// Typography
theme.typography.fontDisplay  // Space Grotesk
theme.typography.fontMono     // JetBrains Mono
theme.typography.textMd       // 14px

// Spacing (4px base)
theme.spacing[4]  // 16px

// Border radius
theme.radii.md    // 6px

// Shadows
theme.shadows.glowCyan
```

### Animations

```typescript
import { pulse, spin, fadeInUp } from '@theme/animations';

const LoadingIcon = styled.div`
  animation: ${spin} 0.8s linear infinite;
`;
```

---

## Storybook Stories

### File Structure

```typescript
// ComponentName.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  // UI components: 'UI/Category/ComponentName'
  // Domain components: 'Domain/Category/ComponentName'
  title: 'UI/Core/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ComponentName>;
```

### Story Patterns

```typescript
// Args-based (simple)
export const Default: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
};

// Render-based (complex JSX)
export const WithIcon: Story = {
  render: () => (
    <ComponentName>
      <Icon /> Label
    </ComponentName>
  ),
};

// Stateful (requires useState import)
export const Interactive: Story = {
  render: function InteractiveComponent() {
    const [value, setValue] = useState('');
    return <Input value={value} onChange={setValue} />;
  },
};
// Note: Add `import { useState } from 'react';` at top of file
```

### Interaction Tests (REQUIRED)

**Every story MUST have a `play` function with interaction tests!**

```typescript
export const Default: Story = {
  args: { title: 'Dashboard' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
  },
};

export const ClickInteraction: Story = {
  args: { onClick: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button');
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();
  },
};
```

### Global Router (DO NOT add MemoryRouter in stories)

Storybook has a **global `MemoryRouter`** configured in `.storybook/preview.ts`. Do NOT add another `MemoryRouter` in story decorators - this causes "router inside router" errors.

```typescript
// ✗ Bad - redundant router
decorators: [
  (Story) => (
    <MemoryRouter>  // DON'T DO THIS
      <Story />
    </MemoryRouter>
  ),
],

// ✓ Good - router already provided globally
decorators: [
  (Story) => (
    <div style={{ padding: 24 }}>
      <Story />
    </div>
  ),
],
```

**To customize router behavior**, use `parameters.router`:
```typescript
export const WithCustomRoute: Story = {
  parameters: {
    router: {
      initialEntries: ['/workflow/abc123/agent/xyz'],  // Set initial route
    },
  },
};

export const NoRouter: Story = {
  parameters: {
    router: { disable: true },  // Disable global router for this story
  },
};
```

---

## API Layer

### Directory Structure

```
src/api/
├── types/           # API response types
│   ├── dashboard.ts
│   └── index.ts
├── endpoints/       # Fetch functions
│   ├── dashboard.ts
│   └── index.ts
├── mocks/           # Mock data for development
│   ├── stats.ts
│   └── index.ts
└── index.ts         # Barrel export
```

### Type Definitions

```typescript
// src/api/types/dashboard.ts
export interface APIAgent {
  id: string;
  id_short: string;
  total_sessions: number;
  active_sessions: number;
  risk_status: 'evaluating' | 'ok';
}

export interface DashboardResponse {
  agents: APIAgent[];
  sessions: APISession[];
  last_updated: string;
}
```

### Endpoint Functions

```typescript
// src/api/endpoints/dashboard.ts
import type { DashboardResponse } from '../types/dashboard';

export const fetchDashboard = async (): Promise<DashboardResponse> => {
  const response = await fetch('/api/dashboard');
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  return response.json();
};
```

### Usage in Components

```typescript
import { fetchDashboard } from '@api';
import type { APIAgent } from '@api';

const [agents, setAgents] = useState<APIAgent[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const load = async () => {
    try {
      const data = await fetchDashboard();
      setAgents(data.agents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);
```

---

## Accessibility

### Semantic HTML
- `<button>` for actions
- `<a>` for navigation
- `<nav>`, `<main>`, `<aside>` for structure

### ARIA Attributes
```typescript
<button aria-haspopup="listbox" aria-expanded={isOpen}>
<ul role="listbox">
  <li role="option" aria-selected={selected}>
```

### Keyboard Support
- Enter/Space to activate
- Escape to close
- Arrow keys to navigate

---

## Exports

Each category folder has an `index.ts`:

```typescript
// src/components/ui/core/index.ts
export { Button } from './Button';
export type { ButtonProps, ButtonVariant } from './Button';

export { Card } from './Card';
export type { CardProps } from './Card';
```

When adding a new component, update the category's `index.ts`.

---

## Commit Messages

Follow conventional commits:

```
feat: add new Button variant
fix: correct Badge alignment issue
docs: update development guide
style: format code with prettier
refactor: simplify Card component
```
