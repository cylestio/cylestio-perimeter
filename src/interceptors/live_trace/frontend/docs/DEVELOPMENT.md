# Development Guide

This guide covers everything you need to contribute to Cylestio UIKit.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start Storybook (component development)
npm run storybook

# Run build
npm run build

# Run linting
npm run lint

# Run Storybook tests
npm run test-storybook
```

---

## Import Organization

**IMPORTANT: Follow this exact order. Separate each group with a blank line.**

| Order | Group | Aliases/Patterns | Example |
|-------|-------|------------------|---------|
| 1 | React core | `react` | `import { useState } from 'react'` |
| 2 | External libs | npm packages | `import { X } from 'lucide-react'` |
| 3 | Internal shared | `@api/*`, `@theme/*`, `@utils/*` | `import { theme } from '@theme/index'` |
| 4 | UI components | `@ui/*` | `import { Button } from '@ui/core/Button'` |
| 5 | Domain components | `@domain/*` | `import { Shell } from '@domain/layout/Shell'` |
| 6 | Pages/Features | `@pages/*`, `@features/*` | `import { Dashboard } from '@pages/index'` |
| 7 | Relative imports | `./`, `../` | `import { styles } from './Component.styles'` |

### Checklist for Import Review

- [ ] React imports first?
- [ ] External libraries after React?
- [ ] `@api/*`, `@theme/*`, `@utils/*` grouped together?
- [ ] `@ui/*` imports together (alphabetical)?
- [ ] `@domain/*` imports together (alphabetical)?
- [ ] Relative imports (`./`, `../`) last?
- [ ] Blank line between each group?
- [ ] Alphabetical within each group?

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
// ✓ Good - UI component imports
import { Button } from '@ui/core/Button';
import { Modal } from '@ui/overlays/Modal';

// ✓ Good - Domain component imports
import { StatCard } from '@domain/metrics/StatCard';
import { Shell } from '@domain/layout/Shell';

// ✓ Good - same-directory imports stay relative
import { StyledButton } from './Button.styles';
import type { ButtonProps } from './Button';

// ✗ Bad - relative paths for cross-directory
import { Button } from '../../components/ui/core/Button';
import { theme } from '../../../theme';
```

---

## Component Reuse (CRITICAL)

**ALWAYS check for existing components before creating new ones.**

### Component Categories

**UI Components** (`@ui/*`) - Generic design system primitives:
| Category | Components |
|----------|------------|
| `ui/core/` | Button, Card, Badge, Text, Heading, Avatar, Code, Label |
| `ui/form/` | Input, Select, Checkbox, Radio, TextArea, FormLabel |
| `ui/feedback/` | Spinner, Skeleton, Toast, EmptyState, ProgressBar |
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

See [`COMPONENTS_INDEX.md`](./COMPONENTS_INDEX.md) for full API reference with props and usage examples.

**When adding/removing/updating components, update `COMPONENTS_INDEX.md`!**

### Import Pattern

```typescript
// From same category
import { Button } from './Button';

// From different category - use path aliases
import { Card } from '@ui/core/Card';
import { StatCard } from '@domain/metrics/StatCard';
```

### Where to Put New Components

| Category | Use When | Examples |
|----------|----------|----------|
| `ui/` | Generic, reusable in any project. No domain knowledge. | Button, Modal, Table |
| `domain/` | Specific to AI security, but reusable across pages. | StatCard, RiskScore |
| `features/` | Tied to a specific feature/page. | AlertsPanel, ReportBuilder |

---

## Project Structure

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
├── pages/               # Demo pages
│   ├── Dashboard/
│   ├── Findings/
│   ├── Sessions/
│   └── Settings/
│
├── theme/               # Design system
│   ├── theme.ts         # Design tokens and theme object
│   ├── GlobalStyles.ts  # CSS reset
│   ├── animations.ts    # Keyframe animations
│   └── index.ts
│
├── api/                 # API layer
│   └── mocks/           # Mock data for development
│
├── App.tsx              # Root component
└── main.tsx             # Entry point
```

### Component File Pattern

Each component follows this structure:

```
ComponentName.tsx         # Component + types (inline)
ComponentName.styles.ts   # Styled components
ComponentName.stories.tsx # Storybook stories + tests
```

---

## Updating Components (CRITICAL)

**When modifying a component, you MUST update its stories and tests.**

### Checklist for Component Changes

Before considering a component update complete, verify:

1. **Stories updated** - All stories reflect the current component API
   - New props have corresponding stories demonstrating their use
   - Removed props are cleaned from all stories
   - Changed behavior is reflected in story examples

2. **Tests updated** - All interaction tests pass and cover new behavior
   - New functionality has `play` functions testing it
   - Edge cases are covered (empty states, error states, etc.)
   - Existing tests still pass with the changes

3. **Types updated** - TypeScript interfaces match the implementation
   - New props are properly typed and documented
   - Removed props are removed from interfaces
   - Default values are documented in JSDoc comments

4. **Documentation updated** - `COMPONENTS_INDEX.md` reflects changes
   - Props table is accurate
   - Usage examples work with current API


### Running Tests After Changes

```bash
# Always run after component changes
npm run build              # Verify TypeScript compiles
npm run test-storybook     # Verify all stories pass
```

---

## Component Development

### 1. File Structure

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

### 2. Styled Components (Transient Props)

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

### 3. Theme Tokens

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

### 4. Animations

```typescript
import { pulse, spin, fadeInUp } from '@theme/animations';

const Spinner = styled.div`
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

// Stateful
export const Interactive: Story = {
  render: function InteractiveComponent() {
    const [value, setValue] = useState('');
    return <Input value={value} onChange={setValue} />;
  },
};
```

### Interaction Tests (REQUIRED)

**⚠️ Every story MUST have a `play` function with interaction tests!**

Tests ensure components work correctly and prevent regressions:

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
│   ├── findings.ts
│   └── index.ts
└── index.ts         # Barrel export
```

### Type Definitions

Define API response types in the `types/` folder:

```typescript
// src/api/types/dashboard.ts
export interface APIAgent {
  id: string;
  id_short: string;
  total_sessions: number;
  active_sessions: number;
  risk_status: 'evaluating' | 'ok';
  // ...
}

export interface DashboardResponse {
  agents: APIAgent[];
  sessions: APISession[];
  last_updated: string;
}
```

### Endpoint Functions

Create fetch functions in the `endpoints/` folder:

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

### Development Proxy

Vite proxies `/api/*` requests to the backend server (avoids CORS issues):

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8080',
      changeOrigin: true,
    },
  },
},
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

### Mock Data (for Storybook/Tests)

Mock data remains in `mocks/` for use in stories and tests:

```typescript
import { mockFindings } from '@api/mocks/findings';
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
// src/components/core/index.ts
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
